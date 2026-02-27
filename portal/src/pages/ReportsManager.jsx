import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Edit, Play } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ReportsManager() {
  const [showNew, setShowNew] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const queryClient = useQueryClient();

  const { data: reports = [] } = useQuery({
    queryKey: ["scheduled_reports"],
    queryFn: () => base44.entities.ScheduledReport.list(),
  });

  const deleteReportMutation = useMutation({
    mutationFn: (id) => base44.entities.ScheduledReport.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled_reports"] });
    },
  });

  const runReportMutation = useMutation({
    mutationFn: (reportId) =>
      base44.functions.invoke("generateScheduledReport", { reportId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled_reports"] });
    },
  });

  return (
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { label: "Financeiro", href: "#" },
          { label: "Relatórios Agendados" },
        ]}
      />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Relatórios Agendados</h1>
          <p className="text-slate-600 mt-2">Automação de relatórios por email</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Novo Relatório
        </Button>
      </div>

      <div className="grid gap-4">
        {reports.map((report) => (
          <Card key={report.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{report.title}</CardTitle>
                  <p className="text-sm text-slate-600 mt-1">{report.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => runReportMutation.mutate(report.id)}
                    disabled={runReportMutation.isPending}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Executar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingReport(report)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteReportMutation.mutate(report.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-slate-600">Tipo</p>
                  <p className="font-medium text-slate-900">{report.type}</p>
                </div>
                <div>
                  <p className="text-slate-600">Frequência</p>
                  <p className="font-medium text-slate-900">{report.frequency}</p>
                </div>
                <div>
                  <p className="text-slate-600">Formato</p>
                  <p className="font-medium text-slate-900">{report.format.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-slate-600">Próxima Execução</p>
                  <p className="font-medium text-slate-900">
                    {report.next_scheduled
                      ? format(new Date(report.next_scheduled), "dd/MM/yyyy HH:mm", { locale: ptBR })
                      : "-"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-600">Destinatários</p>
                <p className="text-sm text-slate-900">{report.recipients?.join(", ") || "-"}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}