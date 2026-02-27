import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Settings,
  Eye,
  EyeOff,
  GripVertical,
  BarChart3,
  Calendar,
  Clock
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import RealTimeMetrics from "../components/dashboard/RealTimeMetrics";

const availableWidgets = [
  { id: "realtime_metrics", label: "Métricas em Tempo Real", icon: TrendingUp, roles: ["admin", "gestor", "operador"] },
  { id: "stage_distribution", label: "Distribuição por Estágio", icon: BarChart3, roles: ["admin", "gestor", "operador"] },
  { id: "kpis", label: "KPIs Principais", icon: BarChart3, roles: ["admin", "gestor", "operador"] },
  { id: "rejections", label: "Análise de Rejeições", icon: XCircle, roles: ["admin", "gestor"] },
  { id: "averbations", label: "Averbações Pendentes", icon: AlertTriangle, roles: ["admin", "operador"] },
  { id: "convenio_docs", label: "Documentos Convênios", icon: Calendar, roles: ["admin", "gestor"] },
  { id: "recent_proposals", label: "Propostas Recentes", icon: FileText, roles: ["admin", "gestor", "operador"] },
  { id: "financial_summary", label: "Resumo Financeiro", icon: DollarSign, roles: ["admin"] },
];

export default function HomeComercial() {
  const queryClient = useQueryClient();
  const [configOpen, setConfigOpen] = useState(false);
  const [selectedConvenio, setSelectedConvenio] = useState(null);
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: proposals = [] } = useQuery({
    queryKey: ["proposals"],
    queryFn: () => base44.entities.Proposal.list("-created_date", 1000),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: averbations = [] } = useQuery({
    queryKey: ["averbation_verifications"],
    queryFn: () => base44.entities.AverbationVerification.filter({ final_status: "pending" }),
    staleTime: 3 * 60 * 1000,
  });

  const { data: convenios = [] } = useQuery({
    queryKey: ["convenios"],
    queryFn: () => base44.entities.ConvenioConfig.list(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: convenioDocuments = [] } = useQuery({
    queryKey: ["convenio_documents_expiring"],
    queryFn: async () => {
      const docs = await base44.entities.ConvenioDocument.list();
      return docs.filter(d => d.status === "expiring_soon" || d.status === "expired");
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: userConfig = null } = useQuery({
    queryKey: ["user_dashboard_config", user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const configs = await base44.entities.UserDashboardConfig.filter({ user_email: user.email });
      return configs[0] || null;
    },
    enabled: !!user?.email,
    staleTime: 60 * 60 * 1000,
  });

  const saveConfigMutation = useMutation({
    mutationFn: async (widgets) => {
      if (!user?.email) return;
      if (userConfig) {
        await base44.entities.UserDashboardConfig.update(userConfig.id, { widgets });
      } else {
        await base44.entities.UserDashboardConfig.create({
          user_email: user.email,
          widgets,
          layout: "grid",
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_dashboard_config"] });
      setConfigOpen(false);
    },
  });

  const [widgetConfig, setWidgetConfig] = useState(() => {
    const defaultConfig = availableWidgets.map((w, idx) => ({
      id: w.id,
      type: w.id,
      position: idx,
      visible: true,
      config: {},
    }));
    return userConfig?.widgets || defaultConfig;
  });

  React.useEffect(() => {
    if (userConfig?.widgets) {
      setWidgetConfig(userConfig.widgets);
    }
  }, [userConfig]);

  const toggleWidget = (widgetId) => {
    setWidgetConfig(prev => 
      prev.map(w => w.id === widgetId ? { ...w, visible: !w.visible } : w)
    );
  };

  const saveConfig = () => {
    saveConfigMutation.mutate(widgetConfig);
  };

  // Análise de rejeições
  const rejectedProposals = proposals.filter(p => p.status === "rejected");
  const rejectionReasons = rejectedProposals.reduce((acc, p) => {
    const reason = p.rejection_reason || "Não informado";
    acc[reason] = (acc[reason] || 0) + 1;
    return acc;
  }, {});

  const sortedRejections = Object.entries(rejectionReasons).sort((a, b) => b[1] - a[1]);

  // KPIs - Filtrando por convênio se selecionado
  const filteredProposals = selectedConvenio 
    ? proposals.filter(p => p.convenio_id === selectedConvenio)
    : proposals;
  
  const totalProposals = filteredProposals.length;
  const totalClients = new Set(filteredProposals.map(p => p.client_id)).size;
  const totalRequested = filteredProposals.reduce((sum, p) => sum + (p.requested_amount || 0), 0);
  const totalDisbursed = filteredProposals.filter(p => p.status === "disbursed").reduce((sum, p) => sum + (p.approved_amount || 0), 0);
  const approvalRate = totalProposals > 0 ? ((filteredProposals.filter(p => !["rejected", "cancelled"].includes(p.status)).length / totalProposals) * 100).toFixed(1) : 0;
  
  // Origination (propostas criadas hoje)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayProposals = filteredProposals.filter(p => {
    const created = new Date(p.created_date);
    created.setHours(0, 0, 0, 0);
    return created.getTime() === today.getTime();
  });
  const todayOrigination = todayProposals.reduce((sum, p) => sum + (p.requested_amount || 0), 0);

  const visibleWidgets = widgetConfig.filter(w => w.visible).sort((a, b) => a.position - b.position);

  const userRole = user?.role || "operador";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <div>
           <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Home Comercial</h1>
           <p className="text-slate-500 text-sm mt-1">Visão de produção comercial e performance por convênio</p>
         </div>
        <div className="flex gap-2">
          {convenios.length > 0 && (
            <select
              value={selectedConvenio || ""}
              onChange={(e) => setSelectedConvenio(e.target.value || null)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white hover:border-slate-300"
            >
              <option value="">Todos os Convênios</option>
              {convenios.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
          <Dialog open={configOpen} onOpenChange={setConfigOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-xl">
                <Settings className="w-4 h-4 mr-2" />
                Personalizar
              </Button>
            </DialogTrigger>
          <DialogContent className="rounded-2xl max-w-md">
            <DialogHeader>
              <DialogTitle>Configurar Dashboard</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-4">
              {availableWidgets
                .filter(w => w.roles.includes(userRole))
                .map(widget => {
                  const config = widgetConfig.find(w => w.id === widget.id);
                  const Icon = widget.icon;
                  return (
                    <div key={widget.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-4 h-4 text-slate-400" />
                        <Icon className="w-4 h-4 text-slate-600" />
                        <Label className="cursor-pointer">{widget.label}</Label>
                      </div>
                      <Switch
                        checked={config?.visible || false}
                        onCheckedChange={() => toggleWidget(widget.id)}
                      />
                    </div>
                  );
                })}
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl mt-4"
                onClick={saveConfig}
                disabled={saveConfigMutation.isPending}
              >
                Salvar Configuração
              </Button>
            </div>
          </DialogContent>
          </Dialog>
          </div>
          </div>

      {/* Métricas em Tempo Real */}
      {visibleWidgets.find(w => w.id === "realtime_metrics") && (
        <RealTimeMetrics />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {visibleWidgets.map(widget => {
          const widgetDef = availableWidgets.find(w => w.id === widget.id);
          if (!widgetDef || !widgetDef.roles.includes(userRole)) return null;
          if (widget.id === "realtime_metrics" || widget.id === "stage_distribution") return null;

          // Widget: KPIs Produção Comercial
          if (widget.id === "kpis") {
            return (
              <Card key={widget.id} className="rounded-2xl border-slate-100 lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Métricas de Produção Comercial</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div className="bg-blue-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-medium text-blue-700">Propostas</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-900">{totalProposals}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-medium text-emerald-700">Clientes</span>
                      </div>
                      <p className="text-2xl font-bold text-emerald-900">{totalClients}</p>
                    </div>
                    <div className="bg-indigo-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-medium text-indigo-700">Originação Hoje</span>
                      </div>
                      <p className="text-lg font-bold text-indigo-900">R$ {(todayOrigination / 1000).toFixed(0)}k</p>
                    </div>
                    <div className="bg-violet-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4 text-violet-600" />
                        <span className="text-xs font-medium text-violet-700">Solicitado</span>
                      </div>
                      <p className="text-lg font-bold text-violet-900">R$ {(totalRequested / 1000).toFixed(0)}k</p>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-orange-600" />
                        <span className="text-xs font-medium text-orange-700">Desembolsado</span>
                      </div>
                      <p className="text-lg font-bold text-orange-900">R$ {(totalDisbursed / 1000).toFixed(0)}k</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-xs font-medium text-green-700">Aprovação</span>
                      </div>
                      <p className="text-2xl font-bold text-green-900">{approvalRate}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }

          // Widget: Análise de Rejeições
          if (widget.id === "rejections") {
            return (
              <Card key={widget.id} className="rounded-2xl border-slate-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600" /> Análise de Rejeições
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {sortedRejections.length === 0 ? (
                    <p className="text-center text-slate-400 text-sm py-4">Nenhuma rejeição registrada</p>
                  ) : (
                    <div className="space-y-2">
                      {sortedRejections.slice(0, 5).map(([reason, count]) => (
                        <div key={reason} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                          <span className="text-sm text-red-900 font-medium">{reason}</span>
                          <Badge className="bg-red-600 text-white border-0">{count}</Badge>
                        </div>
                      ))}
                      <div className="pt-2 border-t">
                        <p className="text-xs text-slate-500">
                          Total de rejeições: <strong>{rejectedProposals.length}</strong> ({((rejectedProposals.length / totalProposals) * 100).toFixed(1)}%)
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          }

          // Widget: Averbações Pendentes
          if (widget.id === "averbations") {
            return (
              <Card key={widget.id} className="rounded-2xl border-slate-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600" /> Dupla Verificação de Averbações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {averbations.length === 0 ? (
                    <p className="text-center text-slate-400 text-sm py-4">Todas averbações verificadas</p>
                  ) : (
                    <div className="space-y-2">
                      {averbations.slice(0, 5).map(av => (
                        <div key={av.id} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-orange-900">{av.client_name}</span>
                            <Badge className="bg-orange-600 text-white border-0 text-xs">
                              {av.first_verification_status === "pending" ? "1ª Verificação" : "2ª Verificação"}
                            </Badge>
                          </div>
                          <p className="text-xs text-orange-700">{av.convenio_name}</p>
                        </div>
                      ))}
                      <p className="text-xs text-slate-500 pt-2 border-t">
                        {averbations.length} averbação(ões) aguardando dupla verificação
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          }

          // Widget: Documentos Convênios
          if (widget.id === "convenio_docs") {
            return (
              <Card key={widget.id} className="rounded-2xl border-slate-100 lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" /> Documentos Vencendo - Convênios
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {convenioDocuments.length === 0 ? (
                    <p className="text-center text-slate-400 text-sm py-4">Todos documentos válidos</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {convenioDocuments.slice(0, 6).map(doc => (
                        <div key={doc.id} className={`p-3 rounded-lg border ${doc.status === "expired" ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"}`}>
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900">{doc.document_name || doc.document_type}</p>
                              <p className="text-xs text-slate-600">{doc.convenio_name}</p>
                            </div>
                            <Badge className={`${doc.status === "expired" ? "bg-red-600" : "bg-yellow-600"} text-white border-0 text-xs`}>
                              {doc.status === "expired" ? "Vencido" : "Vencendo"}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Validade: {new Date(doc.expiration_date).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}