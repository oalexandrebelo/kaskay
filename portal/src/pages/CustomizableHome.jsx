import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { 
  FileText, 
  DollarSign, 
  AlertTriangle, 
  Clock,
  CheckCircle2,
  Settings,
  GripVertical,
  Zap,
  TrendingUp,
  Users,
  Bell
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const AVAILABLE_WIDGETS = [
  { id: "proposals_open", label: "Propostas em Aberto", icon: FileText },
  { id: "active_contracts", label: "Contratos Ativos", icon: DollarSign },
  { id: "overdue", label: "Em Atraso", icon: AlertTriangle },
  { id: "critical_alerts", label: "Alertas Críticos", icon: Bell },
  { id: "daily_queue", label: "Fila do Dia", icon: Zap },
  { id: "active_alerts", label: "Alertas Ativos", icon: AlertTriangle },
  { id: "daily_report", label: "Relatório Diário", icon: FileText },
  { id: "proposals_by_stage", label: "Propostas por Etapa", icon: TrendingUp },
  { id: "decision_analysis", label: "Análise de Decisão", icon: CheckCircle2 },
];

const PRESET_LAYOUTS = [
  {
    id: "executive",
    name: "🎯 Executivo",
    description: "Visão estratégica e KPIs principais",
    widgets: ["active_contracts", "daily_queue", "overdue", "decision_analysis"],
  },
  {
    id: "operational",
    name: "⚡ Operacional",
    description: "Fila do dia e pendências críticas",
    widgets: ["daily_queue", "proposals_open", "critical_alerts", "proposals_by_stage"],
  },
  {
    id: "credit_analyst",
    name: "🔍 Analista de Crédito",
    description: "Decisões e análises pendentes",
    widgets: ["decision_analysis", "proposals_open", "proposals_by_stage", "daily_report"],
  },
  {
    id: "collection",
    name: "💰 Cobrança",
    description: "Atrasos e ações de recuperação",
    widgets: ["overdue", "active_contracts", "critical_alerts", "active_alerts"],
  },
];

export default function CustomizableHome() {
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [widgetOrder, setWidgetOrder] = useState([]);
  const [enabledWidgets, setEnabledWidgets] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const queryClient = useQueryClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: currentUser } = useQuery({
    queryKey: ["current_user"],
    queryFn: () => base44.auth.me(),
  });

  const { data: userConfig } = useQuery({
    queryKey: ["user_dashboard_config", currentUser?.email],
    queryFn: () => base44.entities.UserDashboardConfig.filter({ user_email: currentUser?.email }),
    enabled: !!currentUser,
  });

  const { data: proposals = [] } = useQuery({
    queryKey: ["proposals"],
    queryFn: () => base44.entities.Proposal.list("-created_date", 1000),
    staleTime: 2 * 60 * 1000,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => base44.entities.Alert.filter({ status: "active" }),
    staleTime: 1 * 60 * 1000,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", currentUser?.email],
    queryFn: () => base44.entities.Task.filter({ assigned_to: currentUser?.email, status: "pending" }),
    enabled: !!currentUser,
    staleTime: 1 * 60 * 1000,
  });

  const { data: installments = [] } = useQuery({
    queryKey: ["installments"],
    queryFn: () => base44.entities.Installment.list(),
  });

  // Inicializar configuração
  useEffect(() => {
    if (userConfig && userConfig[0]) {
      const config = userConfig[0];
      setWidgetOrder(config.widget_order || AVAILABLE_WIDGETS.map(w => w.id));
      setEnabledWidgets(config.enabled_widgets || AVAILABLE_WIDGETS.map(w => w.id));
    } else {
      setWidgetOrder(AVAILABLE_WIDGETS.map(w => w.id));
      setEnabledWidgets(AVAILABLE_WIDGETS.map(w => w.id));
    }
  }, [userConfig]);

  const saveConfigMutation = useMutation({
    mutationFn: async (config) => {
      if (userConfig && userConfig[0]) {
        return base44.entities.UserDashboardConfig.update(userConfig[0].id, config);
      } else {
        return base44.entities.UserDashboardConfig.create({
          user_email: currentUser.email,
          ...config,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_dashboard_config"] });
      setIsCustomizing(false);
    },
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(widgetOrder);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    setWidgetOrder(items);
    setIsDragging(false);
    // Auto-save on drag
    saveConfigMutation.mutate({
      widget_order: items,
      enabled_widgets: enabledWidgets,
    });
  };

  const applyPreset = (presetId) => {
    const preset = PRESET_LAYOUTS.find(p => p.id === presetId);
    if (preset) {
      setWidgetOrder(preset.widgets);
      setEnabledWidgets(preset.widgets);
    }
  };

  const toggleWidget = (widgetId) => {
    setEnabledWidgets(prev =>
      prev.includes(widgetId) ? prev.filter(id => id !== widgetId) : [...prev, widgetId]
    );
  };

  const saveCustomization = () => {
    saveConfigMutation.mutate({
      widget_order: widgetOrder,
      enabled_widgets: enabledWidgets,
    });
  };

  // Calcular dados dos widgets
  const widgetData = {
    proposals_open: proposals.filter(p => !["disbursed", "rejected", "cancelled"].includes(p.status)).length,
    active_contracts: proposals.filter(p => p.status === "disbursed").length,
    overdue: installments.filter(i => new Date(i.due_date) < today && i.status !== "paid").length,
    critical_alerts: alerts.filter(a => a.severity === "critical").length,
    daily_queue: proposals.filter(p => {
      const created = new Date(p.created_date);
      created.setHours(0, 0, 0, 0);
      return created.getTime() === today.getTime();
    }).length,
    active_alerts: alerts.length,
    daily_report: proposals.filter(p => p.status === "disbursed").length,
    proposals_by_stage: proposals.length,
    decision_analysis: {
      pending: proposals.filter(p => p.decision_result === "manual_review").length,
      approved: proposals.filter(p => p.decision_result === "approved").length,
      rejected: proposals.filter(p => p.decision_result === "rejected").length,
    },
  };

  const renderWidget = (widgetId) => {
    const widget = AVAILABLE_WIDGETS.find(w => w.id === widgetId);
    if (!widget) return null;

    const Icon = widget.icon;

    // Widgets especiais
    if (widgetId === "decision_analysis") {
      return (
        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Icon className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-slate-900">{widget.label}</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Pendente</span>
                <Badge className="bg-amber-100 text-amber-700">{widgetData.decision_analysis.pending}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Aprovada</span>
                <Badge className="bg-emerald-100 text-emerald-700">{widgetData.decision_analysis.approved}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Reprovada</span>
                <Badge className="bg-red-100 text-red-700">{widgetData.decision_analysis.rejected}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Widgets padrão (número grande)
    const value = widgetData[widgetId];
    const colorClass = 
      widgetId === "critical_alerts" || widgetId === "overdue" ? "text-red-600" :
      widgetId === "active_contracts" ? "text-emerald-600" :
      widgetId === "proposals_open" ? "text-blue-600" :
      "text-slate-900";

    return (
      <Card className="rounded-2xl">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Icon className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">{widget.label}</h3>
          </div>
          <p className={`text-3xl font-bold ${colorClass}`}>
            {typeof value === 'number' ? value : 0}
          </p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Home Operacional</h1>
          <p className="text-slate-500 text-sm mt-1">Personalizada para você</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setIsCustomizing(true)}
          className="rounded-xl"
        >
          <Settings className="w-4 h-4 mr-2" />
          Personalizar
        </Button>
      </div>

      {/* Alertas e Tarefas - SEMPRE VISÍVEL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-2xl border-red-200 bg-red-50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-red-600" />
                <h3 className="text-sm font-semibold text-red-900">⚠️ Alertas Críticos</h3>
              </div>
              <Badge className="bg-red-600 text-white">{alerts.filter(a => a.severity === "critical").length}</Badge>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {alerts.filter(a => a.severity === "critical").slice(0, 5).map(alert => (
                <div key={alert.id} className="bg-white rounded-lg p-3 border border-red-200">
                  <p className="text-sm font-medium text-red-900">{alert.title}</p>
                  <p className="text-xs text-red-700 mt-1">{alert.description}</p>
                </div>
              ))}
              {alerts.filter(a => a.severity === "critical").length === 0 && (
                <p className="text-center text-red-600 text-sm py-4">✅ Nenhum alerta crítico</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-blue-200 bg-blue-50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-semibold text-blue-900">Minhas Tarefas</h3>
              </div>
              <Badge className="bg-blue-600 text-white">{tasks.length}</Badge>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {tasks.slice(0, 5).map(task => (
                <div key={task.id} className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">{task.title}</p>
                      <p className="text-xs text-blue-700 mt-1">
                        {task.priority} | {task.urgency}
                      </p>
                    </div>
                    <Badge className={
                      task.urgency === "critical" ? "bg-red-600 text-white" :
                      task.urgency === "high" ? "bg-orange-600 text-white" :
                      "bg-blue-600 text-white"
                    }>
                      {task.urgency}
                    </Badge>
                  </div>
                </div>
              ))}
              {tasks.length === 0 && (
                <p className="text-center text-blue-600 text-sm py-4">✅ Nenhuma tarefa pendente</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Widgets Personalizáveis com Drag & Drop */}
      <DragDropContext 
        onDragEnd={handleDragEnd}
        onDragStart={() => setIsDragging(true)}
      >
        <Droppable droppableId="widgets-grid" direction="horizontal">
          {(provided) => (
            <div 
              {...provided.droppableProps} 
              ref={provided.innerRef}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {widgetOrder
                .filter(widgetId => enabledWidgets.includes(widgetId))
                .map((widgetId, index) => (
                  <Draggable key={widgetId} draggableId={widgetId} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={snapshot.isDragging ? "opacity-50" : ""}
                      >
                        {renderWidget(widgetId)}
                      </div>
                    )}
                  </Draggable>
                ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Dialog de Personalização */}
      <Dialog open={isCustomizing} onOpenChange={setIsCustomizing}>
        <DialogContent className="rounded-2xl max-w-2xl">
          <DialogHeader>
            <DialogTitle>Personalizar Home Operacional</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Layouts Pré-definidos</h3>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {PRESET_LAYOUTS.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset.id)}
                    className="text-left p-4 bg-gradient-to-br from-slate-50 to-slate-100 hover:from-blue-50 hover:to-blue-100 rounded-xl border border-slate-200 hover:border-blue-300 transition-all"
                  >
                    <p className="font-semibold text-slate-900 mb-1">{preset.name}</p>
                    <p className="text-xs text-slate-600">{preset.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Widgets Disponíveis</h3>
              <div className="space-y-2">
                {AVAILABLE_WIDGETS.map(widget => {
                  const Icon = widget.icon;
                  return (
                    <div key={widget.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <Checkbox
                        checked={enabledWidgets.includes(widget.id)}
                        onCheckedChange={() => toggleWidget(widget.id)}
                      />
                      <Icon className="w-4 h-4 text-slate-600" />
                      <span className="text-sm text-slate-900">{widget.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Ordem dos Widgets</h3>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="widgets">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                      {widgetOrder.filter(wId => enabledWidgets.includes(wId)).map((widgetId, index) => {
                        const widget = AVAILABLE_WIDGETS.find(w => w.id === widgetId);
                        const Icon = widget?.icon;
                        return (
                          <Draggable key={widgetId} draggableId={widgetId} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg ${
                                  snapshot.isDragging ? "shadow-lg" : ""
                                }`}
                              >
                                <GripVertical className="w-4 h-4 text-slate-400" />
                                {Icon && <Icon className="w-4 h-4 text-slate-600" />}
                                <span className="text-sm text-slate-900">{widget?.label}</span>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setIsCustomizing(false)} className="rounded-xl">
                Cancelar
              </Button>
              <Button
                onClick={saveCustomization}
                disabled={saveConfigMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 rounded-xl"
              >
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}