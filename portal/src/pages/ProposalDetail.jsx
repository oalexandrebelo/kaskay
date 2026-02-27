import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import StatusBadge from "@/components/common/StatusBadge";
import { ArrowLeft, User, DollarSign, FileText, PenTool, Shield, Clock, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const statusFlow = [
  "draft", "awaiting_documents", "under_analysis", "margin_check", "margin_approved",
  "ccb_pending", "ccb_issued", "signature_pending", "signature_completed",
  "averbation_pending", "averbated", "disbursed"
];

export default function ProposalDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");

  const { data: proposal, isLoading } = useQuery({
    queryKey: ["proposal", id],
    queryFn: () => base44.entities.Proposal.filter({ id }),
    enabled: !!id,
    select: data => data?.[0],
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["audit_logs", id],
    queryFn: () => base44.entities.AuditLog.filter({ entity_id: id }, "-created_date", 50),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: ({ status, notes }) => {
      const updates = { status };
      if (notes) updates.notes = notes;
      return Promise.all([
        base44.entities.Proposal.update(id, updates),
        base44.entities.AuditLog.create({
          entity_type: "Proposal",
          entity_id: id,
          action: "status_change",
          from_value: proposal?.status,
          to_value: status,
          details: notes || "",
        }),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal", id] });
      queryClient.invalidateQueries({ queryKey: ["audit_logs", id] });
      setNote("");
    },
  });

  if (isLoading) return <div className="space-y-4">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}</div>;
  if (!proposal) return <div className="text-center py-20 text-slate-400">Proposta não encontrada</div>;

  const currentIndex = statusFlow.indexOf(proposal.status);
  const nextStatus = currentIndex >= 0 && currentIndex < statusFlow.length - 1 ? statusFlow[currentIndex + 1] : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl("Proposals")}>
          <Button variant="ghost" size="icon" className="rounded-xl"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{proposal.proposal_number || `#${id?.slice(-6)}`}</h1>
            <StatusBadge status={proposal.status} />
          </div>
          <p className="text-sm text-slate-500 mt-1">{proposal.client_name} · {proposal.client_cpf}</p>
        </div>
        <div className="flex gap-2">
          {nextStatus && (
            <Button
              className="bg-blue-600 hover:bg-blue-700 rounded-xl"
              onClick={() => updateMutation.mutate({ status: nextStatus, notes: note })}
              disabled={updateMutation.isPending}
            >
              <Send className="w-4 h-4 mr-2" /> Avançar para próxima etapa
            </Button>
          )}
          {!["rejected", "cancelled", "disbursed"].includes(proposal.status) && (
            <Button
              variant="outline"
              className="rounded-xl border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => updateMutation.mutate({ status: "rejected", notes: note })}
              disabled={updateMutation.isPending}
            >
              Rejeitar
            </Button>
          )}
        </div>
      </div>

      {/* Status Timeline */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-[800px]">
          {statusFlow.map((s, i) => {
            const isCurrent = s === proposal.status;
            const isPast = i < currentIndex;
            return (
              <React.Fragment key={s}>
                <div className={`flex flex-col items-center ${isCurrent ? "scale-110" : ""}`}>
                  <div className={`w-3 h-3 rounded-full transition-all ${
                    isCurrent ? "bg-blue-600 ring-4 ring-blue-100" :
                    isPast ? "bg-emerald-500" : "bg-slate-200"
                  }`} />
                  <span className={`text-[9px] mt-1 text-center max-w-[60px] leading-tight ${
                    isCurrent ? "font-bold text-blue-700" : isPast ? "text-emerald-600" : "text-slate-400"
                  }`}>
                    {s.replace(/_/g, " ")}
                  </span>
                </div>
                {i < statusFlow.length - 1 && (
                  <div className={`flex-1 h-0.5 ${isPast ? "bg-emerald-400" : "bg-slate-200"}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Cards */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl border-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4 text-blue-600" /> Dados do Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-400">Nome</span><p className="font-medium text-slate-900">{proposal.client_name}</p></div>
                <div><span className="text-slate-400">CPF</span><p className="font-medium text-slate-900">{proposal.client_cpf}</p></div>
                <div><span className="text-slate-400">Canal</span><p className="font-medium text-slate-900 capitalize">{proposal.channel}</p></div>
                <div><span className="text-slate-400">Score Decisão</span><p className="font-medium text-slate-900">{proposal.decision_score || "—"}</p></div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-600" /> Dados Financeiros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div><span className="text-slate-400">Valor Solicitado</span><p className="font-semibold text-slate-900">R$ {(proposal.requested_amount || 0).toLocaleString("pt-BR")}</p></div>
                <div><span className="text-slate-400">Valor Aprovado</span><p className="font-semibold text-slate-900">{proposal.approved_amount ? `R$ ${proposal.approved_amount.toLocaleString("pt-BR")}` : "—"}</p></div>
                <div><span className="text-slate-400">Parcelas</span><p className="font-semibold text-slate-900">{proposal.installments ? `${proposal.installments}x R$ ${(proposal.installment_value || 0).toLocaleString("pt-BR")}` : "—"}</p></div>
                <div><span className="text-slate-400">Taxa Mensal</span><p className="font-semibold text-slate-900">{proposal.interest_rate ? `${proposal.interest_rate}%` : "—"}</p></div>
                <div><span className="text-slate-400">CET</span><p className="font-semibold text-slate-900">{proposal.cet ? `${proposal.cet}%` : "—"}</p></div>
                <div><span className="text-slate-400">Desembolso</span><p className="font-semibold text-slate-900">{proposal.disbursement_date ? format(new Date(proposal.disbursement_date), "dd/MM/yyyy") : "—"}</p></div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4 text-violet-600" /> Integrações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-400">Gestora de Margem</span><p className="font-medium text-slate-900">{proposal.margin_manager || "—"}</p></div>
                <div><span className="text-slate-400">ID Reserva Margem</span><p className="font-medium text-slate-900">{proposal.margin_reservation_id || "—"}</p></div>
                <div><span className="text-slate-400">SCD Parceira</span><p className="font-medium text-slate-900">{proposal.scd_partner || "—"}</p></div>
                <div><span className="text-slate-400">Nº CCB</span><p className="font-medium text-slate-900">{proposal.ccb_number || "—"}</p></div>
                <div><span className="text-slate-400">Nº Proposta</span><p className="font-medium text-slate-900">{proposal.proposal_number || "—"}</p></div>
                <div><span className="text-slate-400">Provedor Assinatura</span><p className="font-medium text-slate-900">{proposal.signature_provider || "—"}</p></div>
                <div><span className="text-slate-400">Status Assinatura</span><p className="font-medium text-slate-900 capitalize">{proposal.signature_status || "—"}</p></div>
                <div><span className="text-slate-400">ID Averbação</span><p className="font-medium text-slate-900">{proposal.averbation_id || "—"}</p></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="rounded-2xl border-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4 text-amber-600" /> Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Adicionar observação..."
                value={note}
                onChange={e => setNote(e.target.value)}
                className="rounded-xl mb-3 resize-none"
                rows={3}
              />
              {proposal.notes && (
                <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-600">{proposal.notes}</div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4 text-slate-500" /> Histórico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {logs.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Sem registros</p>}
                {logs.map(log => (
                  <div key={log.id} className="border-l-2 border-slate-200 pl-3 py-1">
                    <p className="text-xs font-medium text-slate-700">{log.action?.replace(/_/g, " ")}</p>
                    {log.from_value && <p className="text-[10px] text-slate-400">{log.from_value} → {log.to_value}</p>}
                    {log.details && <p className="text-[10px] text-slate-500 mt-0.5">{log.details}</p>}
                    <p className="text-[10px] text-slate-300 mt-0.5">
                      {log.created_date ? format(new Date(log.created_date), "dd/MM HH:mm") : ""}
                      {log.performed_by ? ` · ${log.performed_by}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}