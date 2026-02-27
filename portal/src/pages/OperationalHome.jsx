import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Clock, AlertCircle, TrendingUp, Users, FileText, Zap, XCircle, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";



export default function OperationalHome() {
  const { data: currentUser } = useQuery({
    queryKey: ["current_user"],
    queryFn: () => base44.auth.me(),
  });

  // Buscar tarefas pendentes
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks_pending"],
    queryFn: () => base44.entities.Task.filter({ status: "pending" }),
    staleTime: 3 * 60 * 1000,
  });

  // Buscar alertas críticos
  const { data: alerts = [] } = useQuery({
    queryKey: ["alerts_critical"],
    queryFn: () => base44.entities.Alert.filter({ severity: "critical", status: "active" }),
    staleTime: 2 * 60 * 1000,
  });

  // Buscar todas as propostas (para rejeições, análise, etc)
  const { data: allProposals = [] } = useQuery({
    queryKey: ["all_proposals"],
    queryFn: () => base44.entities.Proposal.list(),
    staleTime: 5 * 60 * 1000,
  });

  const proposalsAnalysis = allProposals.filter(p => 
    ["under_analysis", "margin_check", "awaiting_documents"].includes(p.status)
  );

  // Buscar averbações pendentes
  const { data: averbationsPending = [] } = useQuery({
    queryKey: ["averbations_pending"],
    queryFn: () => base44.entities.AverbationVerification?.filter?.({ status: "pending" }) ?? Promise.resolve([]),
    staleTime: 5 * 60 * 1000,
  });

  // Buscar exceções
  const { data: exceptions = [] } = useQuery({
    queryKey: ["exceptions_pending"],
    queryFn: async () => {
      const allAlerts = await base44.entities.Alert.list?.() ?? [];
      return allAlerts.filter(a => a.type === "exception" && a.status === "active");
    },
    staleTime: 5 * 60 * 1000,
  });

  // Buscar documentos vencendo - convênios
  const { data: expiringDocs = [] } = useQuery({
    queryKey: ["expiring_docs"],
    queryFn: async () => {
      try {
        const docs = await base44.entities.ConvenioDocument.list?.() ?? [];
        return docs.filter(d => d.expiration_date && new Date(d.expiration_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  // Buscar reconciliações em aberto
  const { data: pendingReconciliations = [] } = useQuery({
    queryKey: ["reconciliations_pending"],
    queryFn: async () => {
      try {
        const recs = await base44.entities.FinancialReconciliation.list?.() ?? [];
        return recs.filter(r => r.status === "pending" || r.status === "in_progress");
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Home Operacional</h1>
        <p className="text-slate-500 text-sm mt-1">Visão consolidada de tarefas, alertas e operações críticas</p>
      </div>

      {/* Principais: Tarefas + Alertas Críticos + Exceções - Reduzido */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Card de Tarefas */}
         <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
           <CardHeader className="pb-3">
             <CardTitle className="text-sm flex items-center gap-2">
               <Clock className="w-4 h-4 text-slate-600" />
               Tarefas Pendentes
               <Badge className="ml-auto bg-blue-600 text-white text-xs">{tasks.length}</Badge>
             </CardTitle>
           </CardHeader>
           <CardContent className="pt-2">
             {tasks.length === 0 ? (
               <div className="text-center py-6">
                 <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                 <p className="text-slate-400 text-sm">Nenhuma tarefa pendente</p>
               </div>
             ) : (
               <div className="space-y-2 max-h-48 overflow-y-auto">
                 {tasks.slice(0, 6).map(task => {
                   const priorityBadge = {
                     urgent: "bg-red-600",
                     high: "bg-orange-600",
                     medium: "bg-yellow-600",
                     low: "bg-blue-600"
                   };
                   const priorityLabel = {
                     urgent: "Urgente",
                     high: "Alta",
                     medium: "Média",
                     low: "Baixa"
                   };
                   return (
                     <div key={task.id} className="p-3 rounded-lg transition-all cursor-pointer">
                       <div className="flex items-start justify-between gap-2 mb-1">
                         <p className="text-sm font-medium text-slate-900 flex-1 line-clamp-1">{task.title}</p>
                         <Badge className={`${priorityBadge[task.priority] || priorityBadge.medium} text-white text-xs flex-shrink-0`}>
                           {priorityLabel[task.priority] || "MÉDIA"}
                         </Badge>
                       </div>
                       {task.due_date && (
                         <div className="flex items-center gap-1 text-xs text-slate-600">
                           <Calendar className="w-3 h-3" />
                           {format(new Date(task.due_date), "dd 'de' MMM", { locale: require('date-fns/locale/pt-BR') })}
                         </div>
                       )}
                     </div>
                   );
                 })}
               </div>
             )}
           </CardContent>
         </Card>

        {/* Card de Alertas Críticos */}
        <Card className="rounded-2xl border-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              Alertas Críticos
              <Badge className="ml-auto bg-red-600 text-white text-xs">{alerts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {alerts.length === 0 ? (
              <div className="text-center py-2">
                <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto" />
                <p className="text-slate-600 font-medium text-xs mt-1">Sem alertas</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {alerts.slice(0, 5).map(alert => (
                  <div key={alert.id} className="p-2 bg-red-50 rounded border border-red-200">
                    <p className="text-xs font-medium text-red-900 truncate">{alert.title || alert.message}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Métricas Operacionais - 4 Caixas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        
        {/* Propostas em Análise */}
        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wider">Em Análise</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{proposalsAnalysis.length}</p>
              </div>
              <FileText className="w-6 h-6 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        {/* Averbações Pendentes */}
        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wider">Averbações</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{averbationsPending.length}</p>
              </div>
              <CheckCircle2 className="w-6 h-6 text-orange-200" />
            </div>
          </CardContent>
        </Card>

        {/* Tarefas Urgentes */}
        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wider">Urgentes</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{tasks.filter(t => t.priority === "urgent").length}</p>
              </div>
              <Zap className="w-6 h-6 text-yellow-200" />
            </div>
          </CardContent>
        </Card>

        {/* Status Geral */}
        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wider">Saúde Op.</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {alerts.length === 0 ? "✓" : "!"}
                </p>
              </div>
              <TrendingUp className="w-6 h-6 text-green-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Widgets do Dashboard - Trazidos de Painel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Exceções em Aberto */}
        <Card className="rounded-2xl border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-orange-600" />
              </div>
              Exceções em Aberto
              <Badge className="ml-auto bg-orange-600 text-white text-xs">{exceptions.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {exceptions.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-slate-600 text-sm font-medium">Nenhuma exceção</p>
              </div>
            ) : (
              <div className="space-y-2 flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                {exceptions.slice(0, 12).map(exc => (
                  <Badge key={exc.id} className="bg-orange-100 text-orange-800 text-xs border-orange-200 border">
                    {exc.title || exc.message}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Análise de Rejeições */}
        {(() => {
          const rejectedProposals = allProposals.filter(p => p.status === "rejected");
          const rejectionReasons = rejectedProposals.reduce((acc, p) => {
            const reason = p.rejection_reason || "Não informado";
            acc[reason] = (acc[reason] || 0) + 1;
            return acc;
          }, {});
          const sortedRejections = Object.entries(rejectionReasons).sort((a, b) => b[1] - a[1]);
          const totalRejected = rejectedProposals.length;

          return (
            <Card className="rounded-2xl border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  Análise de Rejeições
                  <Badge className="ml-auto bg-red-600 text-white text-xs">{totalRejected}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {sortedRejections.length === 0 ? (
                  <div className="text-center py-6">
                    <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-slate-600 text-sm font-medium">Nenhuma rejeição registrada</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sortedRejections.slice(0, 6).map(([reason, count], idx) => {
                      const percentage = (count / totalRejected * 100).toFixed(0);
                      return (
                        <div key={reason} className="group">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-900 flex-1 truncate">{reason}</span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge className="bg-red-600 text-white text-xs">{count}</Badge>
                              <span className="text-xs text-slate-500 min-w-9 text-right">{percentage}%</span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div className="bg-red-600 h-full rounded-full transition-all duration-300" style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })()}

        {/* Dupla Verificação de Averbações */}
        {averbationsPending.length > 0 && (
          <Card className="rounded-2xl border-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-600" /> Dupla Verificação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {averbationsPending.slice(0, 5).map(av => (
                  <div key={av.id} className="p-2 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-orange-900 truncate">{av.client_name || "Cliente"}</span>
                      <Badge className="bg-orange-600 text-white border-0 text-xs">
                        {av.first_verification_status === "pending" ? "1ª" : "2ª"}
                      </Badge>
                    </div>
                    <p className="text-xs text-orange-700">{av.convenio_name || "Convênio"}</p>
                  </div>
                ))}
                <p className="text-xs text-slate-500 pt-2 border-t">
                  {averbationsPending.length} averbação(ões) pendente(s)
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Documentos Vencendo - Convênios + Conciliação em Aberto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Documentos Vencendo */}
        {expiringDocs.length > 0 && (
          <Card className="rounded-2xl border-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" /> Documentos Vencendo
                <Badge className="ml-auto bg-blue-600 text-white text-xs">{expiringDocs.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {expiringDocs.slice(0, 5).map(doc => {
                  const daysUntil = Math.floor((new Date(doc.expiration_date).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
                  const isExpired = daysUntil < 0;
                  return (
                    <div key={doc.id} className={`p-2 rounded-lg border ${isExpired ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"}`}>
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-sm font-medium text-slate-900 truncate">{doc.document_type || "Documento"}</span>
                        <Badge className={`${isExpired ? "bg-red-600" : "bg-yellow-600"} text-white border-0 text-xs`}>
                          {isExpired ? "Vencido" : `${daysUntil}d`}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600">{doc.convenio_name || "Convênio"}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Conciliações em Aberto */}
        {pendingReconciliations.length > 0 && (
          <Card className="rounded-2xl border-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" /> Conciliações em Aberto
                <Badge className="ml-auto bg-green-600 text-white text-xs">{pendingReconciliations.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pendingReconciliations.slice(0, 5).map(rec => (
                  <div key={rec.id} className="p-2 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-sm font-medium text-slate-900 truncate">{rec.period || "Período"}</span>
                      <Badge className="bg-green-600 text-white border-0 text-xs">
                        {rec.status === "in_progress" ? "Em progresso" : "Pendente"}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600">Divergência: {rec.valor_divergencia ? `R$ ${rec.valor_divergencia.toLocaleString("pt-BR")}` : "—"}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}