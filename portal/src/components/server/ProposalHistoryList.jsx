import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Calendar, DollarSign } from "lucide-react";
import ProposalStatusBadge from "./ProposalStatusBadge";

const statusLabels = {
  draft: "Rascunho",
  awaiting_documents: "Aguardando Documentos",
  under_analysis: "Em Análise",
  margin_check: "Verificação de Margem",
  margin_approved: "Margem Aprovada",
  margin_rejected: "Margem Rejeitada",
  ccb_pending: "CCB Pendente",
  ccb_issued: "CCB Emitida",
  signature_pending: "Assinatura Pendente",
  signature_completed: "Assinatura Concluída",
  averbation_pending: "Averbação Pendente",
  averbated: "Averbada",
  disbursed: "Desembolsada",
  rejected: "Rejeitada",
  cancelled: "Cancelada",
  expired: "Expirada",
};

export default function ProposalHistoryList({ proposals, onSelectProposal }) {
  // Ordenar por data de criação descending
  const sortedProposals = [...proposals].sort((a, b) => 
    new Date(b.created_date) - new Date(a.created_date)
  );

  return (
    <div className="space-y-3">
      {sortedProposals.map((proposal) => (
        <button
          key={proposal.id}
          onClick={() => onSelectProposal(proposal)}
          className="w-full text-left p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Proposta e Status */}
              <div className="flex items-center gap-3 mb-2">
                <p className="font-semibold text-slate-900">
                  Proposta #{proposal.proposal_number || proposal.id.slice(0, 8)}
                </p>
                <ProposalStatusBadge status={proposal.status} />
              </div>

              {/* Detalhes */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-2">
                <div className="flex items-center gap-2 text-slate-600">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Valor</p>
                    <p className="font-semibold text-slate-900">
                      R$ {(proposal.approved_amount || proposal.requested_amount || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Data</p>
                    <p className="font-semibold text-slate-900">
                      {format(new Date(proposal.created_date), "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                {proposal.interest_rate && (
                  <div>
                    <p className="text-xs text-slate-500">Taxa</p>
                    <p className="font-semibold text-slate-900">{proposal.interest_rate.toFixed(2)}% a.m.</p>
                  </div>
                )}

                {proposal.installments && (
                  <div>
                    <p className="text-xs text-slate-500">Parcelas</p>
                    <p className="font-semibold text-slate-900">{proposal.installments}x</p>
                  </div>
                )}
              </div>

              {/* Observação de rejeitada */}
              {proposal.rejection_reason && (
                <p className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded inline-block">
                  Motivo: {proposal.rejection_reason}
                </p>
              )}
            </div>

            {/* Seta */}
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0 mt-1" />
          </div>
        </button>
      ))}
    </div>
  );
}