import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Settings, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ArrowUpDown,
  Shield,
  FileSignature,
  Building2,
  CreditCard,
  Activity,
  Zap
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const typeIcons = {
  scd: Building2,
  signature_provider: FileSignature,
  anti_fraud: Shield,
  bureau: Activity,
  margin_manager: CreditCard,
  payment_gateway: Zap,
};

const typeLabels = {
  scd: "SCD (Emissão CCB)",
  signature_provider: "Assinatura Digital",
  anti_fraud: "Antifraude",
  bureau: "Bureau de Crédito",
  margin_manager: "Gestora de Margem",
  payment_gateway: "Gateway de Pagamento",
};

const healthColors = {
  healthy: { bg: "bg-emerald-100", text: "text-emerald-700", icon: CheckCircle2 },
  degraded: { bg: "bg-amber-100", text: "text-amber-700", icon: AlertTriangle },
  down: { bg: "bg-red-100", text: "text-red-700", icon: XCircle },
  unknown: { bg: "bg-slate-100", text: "text-slate-500", icon: Activity },
};

export default function ServiceOrchestrator() {
  const queryClient = useQueryClient();
  const [expandedType, setExpandedType] = useState(null);

  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ["integrations"],
    queryFn: () => base44.entities.IntegrationConfig.list(),
  });

  const updateIntegrationMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.IntegrationConfig.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: async ({ type, integrationId }) => {
      // Remove primary de todos do mesmo tipo
      const sameTypeIntegrations = integrations.filter(i => i.type === type);
      for (const int of sameTypeIntegrations) {
        if (int.id !== integrationId) {
          await base44.entities.IntegrationConfig.update(int.id, { is_primary: false });
        }
      }
      // Define novo primary
      await base44.entities.IntegrationConfig.update(integrationId, { is_primary: true, is_active: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    },
  });

  const groupedByType = integrations.reduce((acc, integration) => {
    if (!acc[integration.type]) {
      acc[integration.type] = [];
    }
    acc[integration.type].push(integration);
    return acc;
  }, {});

  // Ordena por prioridade
  Object.keys(groupedByType).forEach(type => {
    groupedByType[type].sort((a, b) => (a.priority || 0) - (b.priority || 0));
  });

  const getTypeStatus = (type) => {
    const providers = groupedByType[type] || [];
    const primary = providers.find(p => p.is_primary);
    const activeCount = providers.filter(p => p.is_active).length;
    const healthyCount = providers.filter(p => p.health_status === "healthy").length;
    
    return { primary, activeCount, healthyCount, total: providers.length };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Orquestração de Serviços</h1>
        <p className="text-slate-500 text-sm mt-1">
          Gerencie fornecedores e configure fallbacks automáticos para evitar indisponibilidade
        </p>
      </div>

      <Alert className="border-blue-200 bg-blue-50">
        <Settings className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900 text-sm">
          <strong>Camada de abstração:</strong> Defina qual fornecedor é primário para cada serviço. 
          Se houver problemas, mude instantaneamente sem alterar código. Configure prioridades para fallback automático.
        </AlertDescription>
      </Alert>

      {isLoading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Object.entries(typeLabels).map(([type, label]) => {
            const status = getTypeStatus(type);
            const providers = groupedByType[type] || [];
            const isExpanded = expandedType === type;
            const Icon = typeIcons[type];

            return (
              <Card key={type} className="rounded-2xl border-slate-100">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-blue-50">
                        <Icon className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{label}</CardTitle>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {status.total} fornecedor{status.total !== 1 ? "es" : ""} configurado{status.total !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedType(isExpanded ? null : type)}
                      className="rounded-lg"
                    >
                      <ArrowUpDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {status.primary && (
                    <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-600 text-white border-0 text-xs">PRIMÁRIO</Badge>
                          <span className="text-sm font-semibold text-slate-900">{status.primary.provider}</span>
                        </div>
                        {status.primary.health_status && (
                          <Badge className={`${healthColors[status.primary.health_status].bg} ${healthColors[status.primary.health_status].text} border-0 text-xs`}>
                            {status.primary.health_status}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-600">
                        <span>Prioridade: {status.primary.priority || 0}</span>
                        {status.primary.environment && (
                          <Badge variant="outline" className="text-xs">{status.primary.environment}</Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {!status.primary && providers.length > 0 && (
                    <Alert className="border-amber-200 bg-amber-50">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-900 text-xs">
                        Nenhum fornecedor primário definido para {label}
                      </AlertDescription>
                    </Alert>
                  )}

                  {providers.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4">
                      Nenhum fornecedor configurado
                    </p>
                  )}

                  {isExpanded && providers.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <p className="text-xs font-semibold text-slate-600 uppercase mb-2">
                        Todos os Fornecedores ({providers.length})
                      </p>
                      {providers.map(integration => {
                        const HealthIcon = healthColors[integration.health_status]?.icon || Activity;
                        return (
                          <div key={integration.id} className="bg-slate-50 rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <HealthIcon className={`w-3 h-3 ${healthColors[integration.health_status]?.text || "text-slate-400"}`} />
                                <span className="text-sm font-medium text-slate-900">{integration.provider}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {integration.is_primary && (
                                  <Badge className="bg-blue-600 text-white border-0 text-[10px]">PRIMÁRIO</Badge>
                                )}
                                <Switch
                                  checked={integration.is_active}
                                  onCheckedChange={(checked) => 
                                    updateIntegrationMutation.mutate({ 
                                      id: integration.id, 
                                      data: { is_active: checked } 
                                    })
                                  }
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              <span>Prioridade: {integration.priority || 0}</span>
                              {integration.environment && (
                                <Badge variant="outline" className="text-[10px]">{integration.environment}</Badge>
                              )}
                              {integration.error_count_24h > 0 && (
                                <span className="text-red-600">{integration.error_count_24h} erros/24h</span>
                              )}
                            </div>

                            {!integration.is_primary && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full rounded-lg text-xs h-7"
                                onClick={() => setPrimaryMutation.mutate({ type, integrationId: integration.id })}
                                disabled={setPrimaryMutation.isPending}
                              >
                                Definir como Primário
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="flex gap-2 text-xs text-slate-500">
                      <span>{status.activeCount} ativos</span>
                      <span>·</span>
                      <span>{status.healthyCount} saudáveis</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="rounded-2xl border-slate-100 bg-slate-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Como Funciona a Orquestração</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">1</div>
            <div>
              <p className="font-semibold text-slate-700">Defina o Fornecedor Primário</p>
              <p className="text-xs text-slate-500">Para cada tipo de serviço, marque qual fornecedor é o principal.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">2</div>
            <div>
              <p className="font-semibold text-slate-700">Configure Prioridades</p>
              <p className="text-xs text-slate-500">Defina ordem de fallback. Se o primário falhar, o sistema tenta o próximo automaticamente.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">3</div>
            <div>
              <p className="font-semibold text-slate-700">Monitore a Saúde</p>
              <p className="text-xs text-slate-500">Acompanhe health checks e contadores de erro para identificar problemas rapidamente.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">4</div>
            <div>
              <p className="font-semibold text-slate-700">Troque Sem Downtime</p>
              <p className="text-xs text-slate-500">Se um fornecedor apresentar problemas, mude o primário instantaneamente sem alterar código.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}