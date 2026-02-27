import React from "react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const statusMap = {
  draft: { label: "Rascunho", className: "bg-slate-100 text-slate-700" },
  awaiting_documents: { label: "Aguard. Docs", className: "bg-yellow-100 text-yellow-800" },
  under_analysis: { label: "Em Análise", className: "bg-blue-100 text-blue-800" },
  margin_check: { label: "Consulta Margem", className: "bg-cyan-100 text-cyan-800" },
  margin_approved: { label: "Margem Aprovada", className: "bg-teal-100 text-teal-800" },
  margin_rejected: { label: "Margem Rejeitada", className: "bg-red-100 text-red-800" },
  ccb_pending: { label: "CCB Pendente", className: "bg-violet-100 text-violet-800" },
  ccb_issued: { label: "CCB Emitida", className: "bg-violet-100 text-violet-800" },
  signature_pending: { label: "Aguard. Assinatura", className: "bg-amber-100 text-amber-800" },
  signature_completed: { label: "Assinado", className: "bg-amber-100 text-amber-800" },
  averbation_pending: { label: "Aguard. Averbação", className: "bg-indigo-100 text-indigo-800" },
  averbated: { label: "Averbado", className: "bg-emerald-100 text-emerald-800" },
  disbursed: { label: "Desembolsado", className: "bg-green-100 text-green-800" },
  rejected: { label: "Rejeitado", className: "bg-red-100 text-red-700" },
  cancelled: { label: "Cancelado", className: "bg-slate-100 text-slate-500" },
  expired: { label: "Expirado", className: "bg-slate-100 text-slate-500" },
};

export default function RecentProposals({ proposals = [] }) {
  const recent = proposals.slice(0, 8);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-slate-900">Propostas Recentes</h3>
        <Link to={createPageUrl("Proposals")} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          Ver todas →
        </Link>
      </div>
      <div className="space-y-3">
        {recent.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">Nenhuma proposta ainda</p>
        )}
        {recent.map(p => {
          const st = statusMap[p.status] || { label: p.status, className: "bg-slate-100 text-slate-600" };
          return (
            <Link
              key={p.id}
              to={createPageUrl("ProposalDetail") + `?id=${p.id}`}
              className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-slate-50 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                  {p.client_name || "—"}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {p.proposal_number || `#${p.id?.slice(-6)}`} · {p.created_date ? format(new Date(p.created_date), "dd/MM/yy") : "—"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-700">
                  R$ {(p.requested_amount || 0).toLocaleString("pt-BR")}
                </span>
                <Badge className={`${st.className} border-0 text-[10px] font-semibold`}>{st.label}</Badge>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}