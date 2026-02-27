import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Network, GitBranch, Shield, CheckCircle2, XCircle, AlertTriangle,
  Plus, Settings2, Filter, TrendingUp, Users, Building2, FileText,
  Zap, Activity, Clock, DollarSign, Edit, Trash2, Target
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdvancedOrchestrator() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedFidc, setSelectedFidc] = useState(null);
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  
  const { data: currentUser } = useQuery({
    queryKey: ["current_user"],
    queryFn: () => base44.auth.me(),
  });

  const isSuperAdmin = currentUser?.role === "super_admin";

  const { data: fidcs = [], isLoading: loadingFidcs } = useQuery({
    queryKey: ["fidcs"],
    queryFn: () => base44.entities.FIDC.list(),
  });

  const { data: orchestrationRules = [], isLoading: loadingRules } = useQuery({
    queryKey: ["orchestration_rules"],
    queryFn: () => base44.entities.OrchestrationRule.list(),
  });

  const { data: convenios = [] } = useQuery({
    queryKey: ["convenios"],
    queryFn: () => base44.entities.ConvenioConfig.list(),
  });

  const { data: systemConfigs = [] } = useQuery({
    queryKey: ["system_configs"],
    queryFn: () => base44.entities.SystemConfig.list(),
  });

  const { data: orchestrationLogs = [] } = useQuery({
    queryKey: ["orchestration_logs"],
    queryFn: () => base44.entities.OrchestrationLog.list("-created_date", 50),
  });

  // Stats
  const activeFidcs = fidcs.filter(f => f.is_active && f.accepts_new_operations).length;
  const activeRules = orchestrationRules.filter(r => r.is_active).length;
  const successRate = orchestrationLogs.length > 0
    ? (orchestrationLogs.filter(l => l.orchestration_result === "success").length / orchestrationLogs.length) * 100
    : 0;

  const deleteRuleMutation = useMutation({
    mutationFn: (id) => base44.entities.OrchestrationRule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orchestration_rules"] });
      setDeleteDialog(false);
      setItemToDelete(null);
    },
  });

  const handleDeleteClick = (rule) => {
    setItemToDelete(rule);
    setDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteRuleMutation.mutate(itemToDelete.id);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Orquestração Avançada</h1>
        <p className="text-slate-500 text-sm mt-1">
          Configure arranjos de FIDCs, SCDs e Convênios com regras de elegibilidade inteligentes
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">FIDCs Ativos</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{activeFidcs}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Regras Ativas</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{activeRules}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <GitBranch className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Taxa de Sucesso</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{successRate.toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Convênios</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{convenios.length}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <Network className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg">Visão Geral</TabsTrigger>
          <TabsTrigger value="fidcs" className="rounded-lg">FIDCs</TabsTrigger>
          <TabsTrigger value="rules" className="rounded-lg">Regras</TabsTrigger>
          <TabsTrigger value="logs" className="rounded-lg">Logs</TabsTrigger>
          {isSuperAdmin && <TabsTrigger value="admin" className="rounded-lg">Admin</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50">
            <Network className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-900 font-semibold">Orquestrador Inteligente</AlertTitle>
            <AlertDescription className="text-blue-700 text-sm mt-1">
              O sistema avalia automaticamente cada proposta contra os critérios de elegibilidade de todos os FIDCs,
              respeitando regras de convênio, SCD e parceiros. Propostas são direcionadas ao FIDC mais adequado baseado
              em prioridade, capacidade e estratégia de roteamento configurada.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Fluxo de Orquestração */}
            <Card className="rounded-xl border-slate-100">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  Fluxo de Orquestração
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">1</div>
                  <div>
                    <p className="font-semibold text-slate-700">Avaliação de Elegibilidade</p>
                    <p className="text-xs text-slate-500">Verifica idade, salário, score, histórico e restrições de convênio</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">2</div>
                  <div>
                    <p className="font-semibold text-slate-700">Filtro por Regras</p>
                    <p className="text-xs text-slate-500">Aplica regras de orquestração específicas do convênio/SCD</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">3</div>
                  <div>
                    <p className="font-semibold text-slate-700">Seleção do FIDC</p>
                    <p className="text-xs text-slate-500">Escolhe baseado em desconto, velocidade ou capacidade</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">4</div>
                  <div>
                    <p className="font-semibold text-slate-700">Cessão e Registro</p>
                    <p className="text-xs text-slate-500">Executa cessão e registra decisão nos logs de auditoria</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Últimas Orquestrações */}
            <Card className="rounded-xl border-slate-100">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-600" />
                  Últimas Orquestrações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {orchestrationLogs.slice(0, 5).map(log => (
                  <div key={log.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {log.orchestration_result === "success" ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      ) : log.orchestration_result === "no_eligible_fidc" ? (
                        <XCircle className="w-3 h-3 text-red-600" />
                      ) : (
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                      )}
                      <span className="text-xs font-medium">{log.selected_fidc_name || "Nenhum FIDC"}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      R$ {log.operation_amount?.toFixed(0)}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="fidcs" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Gestão de FIDCs</h3>
            <Button className="rounded-lg">
              <Plus className="w-4 h-4 mr-2" />
              Novo FIDC
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {fidcs.map(fidc => (
              <Card key={fidc.id} className="rounded-xl border-slate-100">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm">{fidc.fidc_name}</CardTitle>
                      <p className="text-xs text-slate-500 mt-0.5">{fidc.administrator}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {fidc.is_active && fidc.accepts_new_operations ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-0">Ativo</Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-500 border-0">Inativo</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="text-slate-500">Idade</p>
                      <p className="font-semibold text-slate-900">{fidc.min_borrower_age}-{fidc.max_borrower_age} anos</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="text-slate-500">Valor</p>
                      <p className="font-semibold text-slate-900">
                        R${fidc.min_operation_amount}-{fidc.max_operation_amount}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="text-slate-500">Score Mín</p>
                      <p className="font-semibold text-slate-900">{fidc.min_credit_score || "N/A"}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="text-slate-500">Desconto</p>
                      <p className="font-semibold text-emerald-700">{fidc.purchase_discount_percentage}%</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Prioridade</span>
                      <Badge variant="outline">{fidc.priority}</Badge>
                    </div>
                    {fidc.daily_capacity && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Capacidade Diária</span>
                        <span className="font-medium">R$ {fidc.daily_capacity.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <Button size="sm" variant="outline" className="flex-1 rounded-lg">
                      <Edit className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-lg">
                      <Settings2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Regras de Orquestração</h3>
            <Button onClick={() => setIsCreatingRule(true)} className="rounded-lg">
              <Plus className="w-4 h-4 mr-2" />
              Nova Regra
            </Button>
          </div>

          <Alert className="border-purple-200 bg-purple-50">
            <GitBranch className="h-4 w-4 text-purple-600" />
            <AlertDescription className="text-purple-900 text-sm">
              Crie arranjos personalizados combinando Convênio + SCD + Gestora de Margem, com FIDCs preferidos e estratégia de roteamento.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            {orchestrationRules.map(rule => (
              <Card key={rule.id} className="rounded-xl border-slate-100">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-900">{rule.rule_name}</h4>
                        {rule.is_active ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Ativa</Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-500 border-0 text-xs">Inativa</Badge>
                        )}
                        {rule.is_system_rule && (
                          <Badge variant="outline" className="text-xs">Sistema</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{rule.description}</p>

                      <div className="flex flex-wrap gap-2 text-xs">
                        {rule.convenio_id && (
                          <Badge variant="outline" className="text-xs">
                            <Building2 className="w-3 h-3 mr-1" />
                            Convênio específico
                          </Badge>
                        )}
                        {rule.scd_partner && (
                          <Badge variant="outline" className="text-xs">
                            <FileText className="w-3 h-3 mr-1" />
                            SCD: {rule.scd_partner}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          <Target className="w-3 h-3 mr-1" />
                          {rule.route_by}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Prioridade: {rule.priority}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="rounded-lg">
                        <Edit className="w-3 h-3" />
                        </Button>
                        {!rule.is_system_rule && (
                        <Button size="sm" variant="ghost" className="rounded-lg text-red-600" onClick={() => handleDeleteClick(rule)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Logs de Orquestração</h3>
          
          <div className="space-y-2">
            {orchestrationLogs.map(log => (
              <Card key={log.id} className="rounded-xl border-slate-100">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        {log.orchestration_result === "success" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : log.orchestration_result === "no_eligible_fidc" ? (
                          <XCircle className="w-4 h-4 text-red-600" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                        )}
                        <span className="font-semibold text-sm">Proposta #{log.proposal_id?.slice(-6)}</span>
                        <Badge variant="outline" className="text-xs">{log.orchestration_result}</Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div>
                          <p className="text-slate-500">FIDC Selecionado</p>
                          <p className="font-medium text-slate-900">{log.selected_fidc_name || "Nenhum"}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Valor</p>
                          <p className="font-medium text-slate-900">R$ {log.operation_amount?.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Tempo</p>
                          <p className="font-medium text-slate-900">{log.execution_time_ms}ms</p>
                        </div>
                      </div>

                      {log.evaluated_fidcs?.length > 0 && (
                        <div className="text-xs">
                          <p className="text-slate-500 mb-1">FIDCs Avaliados:</p>
                          <div className="flex flex-wrap gap-1">
                            {log.evaluated_fidcs.map((f, idx) => (
                              <Badge key={idx} className={f.eligible ? "bg-emerald-100 text-emerald-700 border-0" : "bg-red-100 text-red-700 border-0"}>
                                {f.fidc_name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {isSuperAdmin && (
          <TabsContent value="admin" className="space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <Shield className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-900 font-semibold">Painel Super Admin</AlertTitle>
              <AlertDescription className="text-red-700 text-sm mt-1">
                Controle total sobre o sistema de orquestração. Defina o que pode ser editável por admins normais e o que requer super admin.
              </AlertDescription>
            </Alert>

            <Card className="rounded-xl border-slate-100">
              <CardHeader>
                <CardTitle className="text-sm">Configurações de Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {systemConfigs.filter(c => c.config_category === "orchestration").map(config => (
                  <div key={config.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{config.config_key}</p>
                      <p className="text-xs text-slate-500">{config.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        {config.requires_super_admin ? "Super Admin" : "Admin"}
                      </Badge>
                      <Switch checked={config.is_editable_by_admin} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-600">
              Tem certeza que deseja excluir a regra <strong>"{itemToDelete?.rule_name}"</strong>?
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Esta ação não pode ser desfeita e pode afetar o roteamento de novas propostas.
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setDeleteDialog(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button 
              onClick={confirmDelete} 
              className="bg-red-600 hover:bg-red-700 rounded-xl"
              disabled={deleteRuleMutation.isPending}
            >
              {deleteRuleMutation.isPending ? "Excluindo..." : "Excluir Regra"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}