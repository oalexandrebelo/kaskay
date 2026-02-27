import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ShieldAlert, CheckCircle2, XCircle, Building2 } from "lucide-react";

const commonBanks = [
  { code: "001", name: "Banco do Brasil" },
  { code: "104", name: "Caixa Econômica Federal" },
  { code: "237", name: "Bradesco" },
  { code: "341", name: "Itaú" },
  { code: "033", name: "Santander" },
  { code: "756", name: "Bancoob" },
  { code: "260", name: "Nubank" },
  { code: "077", name: "Inter" },
  { code: "323", name: "Mercado Pago" },
  { code: "290", name: "PagSeguro" },
];

export default function BankValidation({ cpf, onBankValidated }) {
  const [bankCode, setBankCode] = useState("");
  const [agency, setAgency] = useState("");
  const [account, setAccount] = useState("");
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState(null);

  const { data: blacklistedBanks = [] } = useQuery({
    queryKey: ["bank_blacklist"],
    queryFn: () => base44.entities.BankBlacklist.filter({ is_active: true }),
  });

  const isBlacklisted = blacklistedBanks.some(b => b.bank_code === bankCode);
  const blacklistReason = blacklistedBanks.find(b => b.bank_code === bankCode);

  const validateBank = async () => {
    setValidating(true);
    try {
      // Validar titularidade (simulado - em produção, usar API bancária)
      const titularityCheck = await base44.integrations.Core.InvokeLLM({
        prompt: `Simule uma validação de titularidade bancária. Banco ${bankCode}, agência ${agency}, conta ${account}, CPF ${cpf}. Retorne se a conta pertence ao CPF informado.`,
        response_json_schema: {
          type: "object",
          properties: {
            is_owner: { type: "boolean" },
            account_status: { type: "string" },
            details: { type: "string" },
          },
        },
      });

      setValidation({
        ...titularityCheck,
        bank_code: bankCode,
        is_blacklisted: isBlacklisted,
      });

      onBankValidated?.({
        bank_code: bankCode,
        agency,
        account,
        is_valid: titularityCheck.is_owner && !isBlacklisted,
        titularity_confirmed: titularityCheck.is_owner,
        is_blacklisted: isBlacklisted,
      });
    } catch (error) {
      console.error("Bank validation error:", error);
    } finally {
      setValidating(false);
    }
  };

  return (
    <Card className="rounded-2xl border-slate-100">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="w-4 h-4 text-green-600" />
          Validação Bancária (Anti-Fraude)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isBlacklisted && (
          <Alert className="border-red-200 bg-red-50">
            <ShieldAlert className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-900 text-sm">
              <strong>BANCO BLOQUEADO:</strong> {blacklistReason?.reason === "no_kyc" ? "Banco sem KYC rigoroso" : blacklistReason?.reason}
              <br />
              <span className="text-xs">Este banco está na lista de bloqueio por segurança.</span>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <div>
            <Label>Banco</Label>
            <Select value={bankCode} onValueChange={setBankCode}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Selecione o banco" />
              </SelectTrigger>
              <SelectContent>
                {commonBanks.map(bank => (
                  <SelectItem key={bank.code} value={bank.code}>
                    {bank.code} - {bank.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Agência</Label>
              <Input
                value={agency}
                onChange={(e) => setAgency(e.target.value)}
                className="rounded-xl"
                placeholder="0000"
              />
            </div>
            <div>
              <Label>Conta</Label>
              <Input
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="rounded-xl"
                placeholder="00000-0"
              />
            </div>
          </div>

          <Button
            className="w-full bg-green-600 hover:bg-green-700 rounded-xl"
            onClick={validateBank}
            disabled={!bankCode || !agency || !account || validating || isBlacklisted}
          >
            {validating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Validando Titularidade...
              </>
            ) : (
              <>
                <Building2 className="w-4 h-4 mr-2" />
                Validar Conta Bancária
              </>
            )}
          </Button>
        </div>

        {validation && (
          <div className="mt-4 p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Titularidade</span>
              {validation.is_owner ? (
                <Badge className="bg-green-100 text-green-700 border-0">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Confirmada
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-700 border-0">
                  <XCircle className="w-3 h-3 mr-1" />
                  Não Confirmada
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-600">{validation.details}</p>

            {validation.is_blacklisted && (
              <Alert className="border-red-200 bg-red-50 mt-3">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-900 text-xs">
                  Desembolso bloqueado: banco não autorizado
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}