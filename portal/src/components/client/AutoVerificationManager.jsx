import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  TrendingDown, 
  Zap,
  Calendar,
  DollarSign
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const verificationLabels = {
  bureau_ph3a: "Ph3A Bureau",
  bureau_nova_vida: "Nova Vida",
  portal_transparencia: "Portal Transparência",
  margin_manager: "Gestora de Margem",
};

export default function AutoVerificationManager({ clientId }) {
  const { data: verifications = [] } = useQuery({
    queryKey: ["client_verifications", clientId],
    queryFn: () => base44.entities.ClientVerification.filter({ client_id: clientId }),
    enabled: !!clientId,
    refetchInterval: 30000, // Atualiza a cada 30s
  });

  const { data: rules = [] } = useQuery({
    queryKey: ["verification_rules"],
    queryFn: () => base44.entities.VerificationRule.list(),
  });

  // Agrupar por tipo
  const verificationsByType = verifications.reduce((acc, v) => {
    if (!acc[v.verification_type]) acc[v.verification_type] = [];
    acc[v.verification_type].push(v);
    return acc;
  }, {});

  // Pegar mais recente de cada tipo
  const latestVerifications = Object.keys(verificationsByType).map(type => {
    const sorted = verificationsByType[type].sort((a, b) => 
      new Date(b.verified_at) - new Date(a.verified_at)
    );
    return sorted[0];
  });

  const totalCost = verifications.reduce((sum, v) => sum + (v.cost_estimate || 0), 0);
  const cacheHits = verifications.filter(v => v.cache_hit).length;
  const cacheRate = verifications.length > 0 ? (cacheHits / verifications.length * 100).toFixed(0) : 0;

  return (
    <Card className="rounded-2xl border-slate-100">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-600" /> Verificações Automáticas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Alert className="border-blue-200 bg-blue-50/50">
          <TrendingDown className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-xs text-blue-900">
            <strong>Otimização:</strong> Cache de {cacheRate}% • Economia estimada: R$ {(cacheHits * 2).toFixed(2)}
          </AlertDescription>
        </Alert>

        {latestVerifications.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">
            Nenhuma verificação realizada ainda
          </p>
        ) : (
          <div className="space-y-2">
            {latestVerifications.map(verification => {
              const isExpired = verification.expires_at && new Date(verification.expires_at) < new Date();
              const daysUntilExpiry = verification.expires_at 
                ? Math.ceil((new Date(verification.expires_at) - new Date()) / (1000 * 60 * 60 * 24))
                : null;

              return (
                <div key={verification.id} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">
                        {verificationLabels[verification.verification_type]}
                      </span>
                      {verification.status === "success" ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      ) : verification.status === "pending" ? (
                        <Clock className="w-3 h-3 text-orange-600" />
                      ) : (
                        <XCircle className="w-3 h-3 text-red-600" />
                      )}
                    </div>
                    {verification.cache_hit && (
                      <Badge className="bg-green-100 text-green-700 border-0 text-[10px]">
                        Cache
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {verification.verified_at 
                          ? formatDistanceToNow(new Date(verification.verified_at), { addSuffix: true, locale: ptBR })
                          : "Pendente"}
                      </span>
                      {daysUntilExpiry !== null && (
                        <span className={`flex items-center gap-1 ${isExpired ? "text-red-600" : daysUntilExpiry < 7 ? "text-orange-600" : ""}`}>
                          <Calendar className="w-3 h-3" />
                          {isExpired ? "Expirado" : `Expira em ${daysUntilExpiry}d`}
                        </span>
                      )}
                    </div>
                    {verification.cost_estimate && !verification.cache_hit && (
                      <span className="flex items-center gap-1 text-slate-500">
                        <DollarSign className="w-3 h-3" />
                        R$ {verification.cost_estimate.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {verification.trigger_reason && (
                    <div className="mt-2 pt-2 border-t border-slate-200">
                      <span className="text-[10px] text-slate-500">
                        Motivo: {verification.trigger_reason.replace(/_/g, " ")}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {verifications.length > 0 && (
          <div className="pt-3 border-t border-slate-200 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500">Total de Consultas:</span>
              <p className="font-semibold text-slate-900">{verifications.length}</p>
            </div>
            <div>
              <span className="text-slate-500">Custo Total:</span>
              <p className="font-semibold text-emerald-600">R$ {totalCost.toFixed(2)}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}