import { Badge } from "@/components/ui/badge";

const statusConfig = {
  draft: { label: "Rascunho", variant: "outline", color: "bg-slate-100 text-slate-700 border-slate-300" },
  awaiting_documents: { label: "Aguardando Documentos", variant: "outline", color: "bg-yellow-50 text-yellow-700 border-yellow-300" },
  under_analysis: { label: "Em Análise", variant: "outline", color: "bg-blue-50 text-blue-700 border-blue-300" },
  margin_check: { label: "Verificação de Margem", variant: "outline", color: "bg-purple-50 text-purple-700 border-purple-300" },
  margin_approved: { label: "Margem Aprovada", variant: "outline", color: "bg-green-50 text-green-700 border-green-300" },
  margin_rejected: { label: "Margem Rejeitada", variant: "outline", color: "bg-red-50 text-red-700 border-red-300" },
  ccb_pending: { label: "CCB Pendente", variant: "outline", color: "bg-orange-50 text-orange-700 border-orange-300" },
  ccb_issued: { label: "CCB Emitida", variant: "outline", color: "bg-green-50 text-green-700 border-green-300" },
  signature_pending: { label: "Assinatura Pendente", variant: "outline", color: "bg-blue-50 text-blue-700 border-blue-300" },
  signature_completed: { label: "Assinatura Concluída", variant: "outline", color: "bg-green-50 text-green-700 border-green-300" },
  averbation_pending: { label: "Averbação Pendente", variant: "outline", color: "bg-blue-50 text-blue-700 border-blue-300" },
  averbated: { label: "Averbada", variant: "outline", color: "bg-green-50 text-green-700 border-green-300" },
  disbursed: { label: "Desembolsada", variant: "default", color: "bg-green-600 text-white" },
  rejected: { label: "Rejeitada", variant: "destructive", color: "bg-red-600 text-white" },
  cancelled: { label: "Cancelada", variant: "outline", color: "bg-slate-100 text-slate-700 border-slate-300" },
  expired: { label: "Expirada", variant: "outline", color: "bg-slate-100 text-slate-700 border-slate-300" },
};

export default function ProposalStatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, variant: "outline", color: "bg-slate-100 text-slate-700" };
  
  return (
    <Badge className={`text-xs font-medium ${config.color}`}>
      {config.label}
    </Badge>
  );
}