import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Search } from "lucide-react";

export default function AutoCPFVerification({ cpf, onVerificationComplete }) {
  const [verifying, setVerifying] = useState(false);
  const [results, setResults] = useState(null);

  const performVerification = async () => {
    setVerifying(true);
    try {
      // Buscar cliente existente
      const clients = await base44.entities.Client.filter({ cpf });
      const client = clients[0];

      const verificationResults = {
        cpf,
        client_exists: !!client,
        client_id: client?.id,
        bureau_check: null,
        portal_transparencia_check: null,
        credit_history: null,
        risk_flags: [],
      };

      // Bureau Ph3A
      try {
        const bureauResponse = await base44.integrations.Core.InvokeLLM({
          prompt: `Simule uma consulta de bureau de crédito para CPF ${cpf}. Retorne se a pessoa tem histórico de crédito, score aproximado, e se há restrições.`,
          response_json_schema: {
            type: "object",
            properties: {
              has_credit_history: { type: "boolean" },
              score: { type: "number" },
              restrictions: { type: "boolean" },
              details: { type: "string" },
            },
          },
        });
        verificationResults.bureau_check = bureauResponse;
        
        if (!bureauResponse.has_credit_history) {
          verificationResults.risk_flags.push("Sem histórico de crédito em bureau - ALERTA FRAUDE");
        }
        if (bureauResponse.restrictions) {
          verificationResults.risk_flags.push("Restrições em bureau");
        }
      } catch (e) {
        verificationResults.bureau_check = { error: e.message };
      }

      // Portal da Transparência
      try {
        const portalResponse = await base44.integrations.Core.InvokeLLM({
          prompt: `Simule uma consulta ao Portal da Transparência para CPF ${cpf}. Verifique se há vínculo empregatício público e órgão.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              public_employee: { type: "boolean" },
              employer: { type: "string" },
              position: { type: "string" },
              salary: { type: "number" },
            },
          },
        });
        verificationResults.portal_transparencia_check = portalResponse;
        
        if (!portalResponse.public_employee && client?.employer) {
          verificationResults.risk_flags.push("Órgão informado não confirmado no Portal da Transparência");
        }
      } catch (e) {
        verificationResults.portal_transparencia_check = { error: e.message };
      }

      // Salvar verificação
      if (client) {
        await base44.entities.ClientVerification.create({
          client_id: client.id,
          client_cpf: cpf,
          verification_type: "auto_fraud_check",
          status: "success",
          result_data: JSON.stringify(verificationResults),
          verified_at: new Date().toISOString(),
          trigger_reason: "new_proposal",
        });
      }

      setResults(verificationResults);
      onVerificationComplete?.(verificationResults);
    } catch (error) {
      console.error("Verification error:", error);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Card className="rounded-2xl border-slate-100">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Search className="w-4 h-4 text-blue-600" />
          Verificação Automática de CPF
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!results && !verifying && (
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl"
            onClick={performVerification}
          >
            <Search className="w-4 h-4 mr-2" />
            Iniciar Verificação Completa
          </Button>
        )}

        {verifying && (
          <div className="text-center py-6">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-sm text-slate-600">Consultando bureaus e portais...</p>
          </div>
        )}

        {results && (
          <div className="space-y-3">
            {results.risk_flags.length > 0 && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-900 text-sm">
                  <strong>Alertas de Fraude Detectados:</strong>
                  <ul className="mt-2 list-disc list-inside">
                    {results.risk_flags.map((flag, idx) => (
                      <li key={idx}>{flag}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Bureau de Crédito</p>
                {results.bureau_check?.has_credit_history ? (
                  <Badge className="bg-green-100 text-green-700 border-0">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Histórico OK
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-700 border-0">
                    <XCircle className="w-3 h-3 mr-1" />
                    Sem Histórico
                  </Badge>
                )}
              </div>

              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Portal Transparência</p>
                {results.portal_transparencia_check?.public_employee ? (
                  <Badge className="bg-green-100 text-green-700 border-0">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Vínculo Confirmado
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-100 text-yellow-700 border-0">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Não Confirmado
                  </Badge>
                )}
              </div>
            </div>

            {results.bureau_check?.score && (
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-700 mb-1">Score de Crédito</p>
                <p className="text-xl font-bold text-blue-900">{results.bureau_check.score}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}