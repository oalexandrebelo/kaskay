import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertTriangle, AlertCircle, CheckCircle2, Clock, ChevronRight, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

const severityConfig = {
  low: { icon: AlertCircle, color: "bg-blue-50 border-blue-200", badge: "bg-blue-100 text-blue-800" },
  medium: { icon: AlertTriangle, color: "bg-yellow-50 border-yellow-200", badge: "bg-yellow-100 text-yellow-800" },
  high: { icon: AlertTriangle, color: "bg-orange-50 border-orange-200", badge: "bg-orange-100 text-orange-800" },
  critical: { icon: AlertTriangle, color: "bg-red-50 border-red-200", badge: "bg-red-100 text-red-800" },
};

const statusConfig = {
  active: { label: "Ativo", color: "bg-red-100 text-red-800" },
  acknowledged: { label: "Reconhecido", color: "bg-blue-100 text-blue-800" },
  resolved: { label: "Resolvido", color: "bg-green-100 text-green-800" },
};

export default function AlertsCenter() {
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [statusFilter, setStatusFilter] = useState("active");
  const queryClient = useQueryClient();

  // Fetch alerts
  const { data: alerts, isLoading } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => base44.entities.Alert.list("-triggered_at", 100),
  });

  // Acknowledge mutation
  const acknowledgeMutation = useMutation({
    mutationFn: (alertId) =>
      base44.entities.Alert.update(alertId, {
        status: "acknowledged",
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: (base44.auth.me()).email,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  // Resolve mutation
  const resolveMutation = useMutation({
    mutationFn: (alertId) =>
      base44.entities.Alert.update(alertId, {
        status: "resolved",
        resolved_at: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const filteredAlerts = (alerts || []).filter(a => a.status === statusFilter);

  const criticalAlerts = (alerts || []).filter(a => a.severity === "critical" && a.status === "active");
  const highAlerts = (alerts || []).filter(a => a.severity === "high" && a.status === "active");

  if (isLoading) return <div className="p-6 text-center">Carregando alertas...</div>;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Central de Alertas</h1>
        <p className="text-slate-500 mt-1">Monitoramento em tempo real de riscos operacionais</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Críticos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{criticalAlerts.length}</div>
            <p className="text-xs text-red-500 mt-1">Ação imediata necessária</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Altos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{highAlerts.length}</div>
            <p className="text-xs text-orange-500 mt-1">Requer revisão</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{(alerts || []).filter(a => a.status === "active").length}</div>
            <p className="text-xs text-slate-500 mt-1">Não reconhecidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{(alerts || []).length}</div>
            <p className="text-xs text-slate-500 mt-1">Últimos 30 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["active", "acknowledged", "resolved"].map(status => (
          <Button
            key={status}
            variant={statusFilter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(status)}
            className="capitalize"
          >
            <Filter className="w-3.5 h-3.5 mr-1.5" />
            {statusConfig[status].label}
          </Button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
              <p className="text-slate-600">Nenhum alerta neste status</p>
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map(alert => {
            const SeverityIcon = severityConfig[alert.severity].icon;
            return (
              <Card
                key={alert.id}
                className={cn(
                  "border-2 cursor-pointer transition-all hover:shadow-md",
                  severityConfig[alert.severity].color
                )}
                onClick={() => setSelectedAlert(alert)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <SeverityIcon className="w-5 h-5 mt-1 shrink-0" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900">{alert.title}</h3>
                        <Badge className={statusConfig[alert.status].color} variant="secondary">
                          {statusConfig[alert.status].label}
                        </Badge>
                      </div>

                      <p className="text-sm text-slate-600 mb-2">{alert.description}</p>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={severityConfig[alert.severity].badge}>
                          {alert.severity === "critical" ? "Crítico" : alert.severity === "high" ? "Alto" : alert.severity === "medium" ? "Médio" : "Baixo"}
                        </Badge>

                        {alert.action_required && (
                          <Badge className="bg-purple-100 text-purple-800">Ação Requerida</Badge>
                        )}

                        <span className="text-xs text-slate-500 ml-auto flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(alert.triggered_at).toLocaleString("pt-BR")}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <DialogTitle>{selectedAlert.title}</DialogTitle>
                  <DialogDescription>{selectedAlert.alert_type}</DialogDescription>
                </div>
                <Badge className={statusConfig[selectedAlert.status].color}>
                  {statusConfig[selectedAlert.status].label}
                </Badge>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-slate-900 mb-2">Descrição</h4>
                <p className="text-slate-600">{selectedAlert.description}</p>
              </div>

              {selectedAlert.metrics && Object.keys(selectedAlert.metrics).length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 mb-2">Métricas</h4>
                  <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
                    {Object.entries(selectedAlert.metrics).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-slate-600">{key}:</span>
                        <span className="font-medium text-slate-900">
                          {typeof value === "number" ? value.toFixed(2) : value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedAlert.suggested_action && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="font-semibold text-sm text-blue-900 mb-1">Ação Sugerida</h4>
                  <p className="text-sm text-blue-800">{selectedAlert.suggested_action}</p>
                </div>
              )}

              <div className="text-xs text-slate-500">
                Disparado em: {new Date(selectedAlert.triggered_at).toLocaleString("pt-BR")}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                {selectedAlert.status === "active" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        acknowledgeMutation.mutate(selectedAlert.id);
                        setSelectedAlert(null);
                      }}
                      disabled={acknowledgeMutation.isPending}
                    >
                      Reconhecer
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        resolveMutation.mutate(selectedAlert.id);
                        setSelectedAlert(null);
                      }}
                      disabled={resolveMutation.isPending}
                    >
                      Marcar como Resolvido
                    </Button>
                  </>
                )}
                {selectedAlert.status === "acknowledged" && (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      resolveMutation.mutate(selectedAlert.id);
                      setSelectedAlert(null);
                    }}
                    disabled={resolveMutation.isPending}
                  >
                    Marcar como Resolvido
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}