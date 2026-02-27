import React from "react";
import { Badge } from "@/components/ui/badge";

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

export default function StatusBadge({ status }) {
  const st = statusMap[status] || { label: status || "—", className: "bg-slate-100 text-slate-600" };
  return <Badge className={`${st.className} border-0 text-[11px] font-semibold px-2.5 py-0.5`}>{st.label}</Badge>;
}