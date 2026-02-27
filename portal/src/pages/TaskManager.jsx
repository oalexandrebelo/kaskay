import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertTriangle, 
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";

const severityColors = {
  info: "bg-blue-100 text-blue-700 border-0",
  warning: "bg-amber-100 text-amber-700 border-0",
  critical: "bg-red-100 text-red-700 border-0",
};

const statusColors = {
  active: "bg-emerald-100 text-emerald-700 border-0",
  acknowledged: "bg-blue-100 text-blue-700 border-0",
  resolved: "bg-slate-100 text-slate-700 border-0",
  pending: "bg-amber-100 text-amber-700 border-0",
  completed: "bg-emerald-100 text-emerald-700 border-0",
  in_progress: "bg-blue-100 text-blue-700 border-0",
};

export default function TaskManager() {
  const [selectedItems, setSelectedItems] = useState([]);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ["current_user"],
    queryFn: () => base44.auth.me(),
  });

  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => base44.entities.Alert.list("-created_date", 500),
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => base44.entities.Task.list("-created_date", 500),
  });

  const myTasks = tasks.filter(t => t.assigned_to === currentUser?.email);
  const activeAlerts = alerts.filter(a => a.status === "active");

  const toggleSelectItem = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = (items) => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(i => i.id));
    }
  };

  if (alertsLoading || tasksLoading) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Alertas & Tarefas</h1>
        <p className="text-slate-500 text-sm mt-1">
          Monitoramento e pendências operacionais
        </p>
      </div>

      <Card className="rounded-2xl">
        <Tabs defaultValue="alerts" className="w-full">
          <div className="border-b px-6 pt-6">
            <TabsList className="bg-transparent border-0 p-0 h-auto">
              <TabsTrigger 
                value="alerts" 
                className="border-0 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3 px-4"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Alertas ({activeAlerts.length})
              </TabsTrigger>
              <TabsTrigger 
                value="tasks"
                className="border-0 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3 px-4"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Tarefas ({myTasks.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="alerts" className="m-0 p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left p-3 text-xs font-medium text-slate-600 w-10">
                      <Checkbox 
                        checked={selectedItems.length === activeAlerts.length && activeAlerts.length > 0}
                        onCheckedChange={() => toggleSelectAll(activeAlerts)}
                      />
                    </th>
                    <th className="text-left p-3 text-xs font-medium text-slate-600">Severidade</th>
                    <th className="text-left p-3 text-xs font-medium text-slate-600">Título</th>
                    <th className="text-left p-3 text-xs font-medium text-slate-600">Tipo</th>
                    <th className="text-left p-3 text-xs font-medium text-slate-600">Módulo</th>
                    <th className="text-left p-3 text-xs font-medium text-slate-600">Descrição</th>
                    <th className="text-left p-3 text-xs font-medium text-slate-600">Status</th>
                    <th className="text-left p-3 text-xs font-medium text-slate-600">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {activeAlerts.map(alert => (
                    <tr key={alert.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3">
                        <Checkbox 
                          checked={selectedItems.includes(alert.id)}
                          onCheckedChange={() => toggleSelectItem(alert.id)}
                        />
                      </td>
                      <td className="p-3">
                        <Badge className={severityColors[alert.severity] || severityColors.info}>
                          {alert.severity === "critical" ? "Crítico" : alert.severity === "warning" ? "Alerta" : "Info"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <span className="text-sm font-medium text-slate-900">{alert.title}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm text-slate-600">{alert.category || "—"}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm text-slate-600">{alert.entity_type || "—"}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm text-slate-600 truncate max-w-xs block">
                          {alert.description}
                        </span>
                      </td>
                      <td className="p-3">
                        <Badge className={statusColors[alert.status]}>
                          {alert.status === "active" ? "Ativo" : "Reconhecido"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <span className="text-xs text-slate-500">
                          {format(new Date(alert.created_date), 'dd/MM\nHH:mm')}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {activeAlerts.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        Nenhum alerta ativo no momento
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="m-0 p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left p-3 text-xs font-medium text-slate-600 w-10">
                      <Checkbox 
                        checked={selectedItems.length === myTasks.length && myTasks.length > 0}
                        onCheckedChange={() => toggleSelectAll(myTasks)}
                      />
                    </th>
                    <th className="text-left p-3 text-xs font-medium text-slate-600">Prioridade</th>
                    <th className="text-left p-3 text-xs font-medium text-slate-600">Título</th>
                    <th className="text-left p-3 text-xs font-medium text-slate-600">Tipo</th>
                    <th className="text-left p-3 text-xs font-medium text-slate-600">Origem</th>
                    <th className="text-left p-3 text-xs font-medium text-slate-600">Descrição</th>
                    <th className="text-left p-3 text-xs font-medium text-slate-600">Status</th>
                    <th className="text-left p-3 text-xs font-medium text-slate-600">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {myTasks.map(task => (
                    <tr key={task.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3">
                        <Checkbox 
                          checked={selectedItems.includes(task.id)}
                          onCheckedChange={() => toggleSelectItem(task.id)}
                        />
                      </td>
                      <td className="p-3">
                        <Badge className={severityColors[task.urgency === "critical" ? "critical" : task.urgency === "high" ? "warning" : "info"]}>
                          {task.urgency === "critical" ? "Crítico" : task.urgency === "high" ? "Alerta" : "Normal"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <span className="text-sm font-medium text-slate-900">{task.title}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm text-slate-600">{task.related_entity_type || "—"}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm text-slate-600">{task.source || "Manual"}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm text-slate-600 truncate max-w-xs block">
                          {task.description}
                        </span>
                      </td>
                      <td className="p-3">
                        <Badge className={statusColors[task.status]}>
                          {task.status === "pending" ? "Pendente" : task.status === "in_progress" ? "Em Andamento" : "Concluída"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <span className="text-xs text-slate-500">
                          {format(new Date(task.created_date), 'dd/MM\nHH:mm')}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {myTasks.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        Nenhuma tarefa pendente no momento
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}