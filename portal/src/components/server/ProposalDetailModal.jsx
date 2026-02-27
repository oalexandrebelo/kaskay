import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, DollarSign, Percent, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import ProposalStatusBadge from "./ProposalStatusBadge";

export default function ProposalDetailModal({ proposal, onClose }) {
  const stageFlow = [
    { status: "draft", label: "Rascunho", icon: null },
    { status: "awaiting_documents", label: "Documentos", icon: null },
    { status: "under_analysis", label: "Análise", icon: null },
    { status: "margin_check", label: "Margem", icon: null },
    { status: "ccb_issued", label: "CCB", icon: null },
    { status: "signature_completed", label: "Assinatura", icon: null },
    { status: "averbated", label: "Averbação", icon: null },
    { status: "disbursed", label: "Desembolsada", icon: CheckCircle2 },
  ];

  const isCompleted = ["disbursed", "averbated", "signature_completed"].includes(proposal.status);
  const isRejected = ["rejected", "cancelled"].includes(proposal.status);

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Proposta #{proposal.proposal_number || proposal.id.slice(0, 8)}</span>
            <DialogClose />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Atual */}
          <div className="bg-slate-50 p-4 rounded-lg space-y-2">
            <p className="text-sm text-slate-600 font-medium">Status Atual</p>
            <ProposalStatusBadge status={proposal.status} />
            {isRejected && proposal.rejection_reason && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                <p className="font-semibold mb-1 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Motivo da rejeição:
                </p>
                <p>{proposal.rejection_reason}</p>
              </div>
            )}
          </div>

          {/* Valores e Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-slate-500 font-medium">Valor Solicitado</p>
              <p className="text-2xl font-bold text-slate-900">
                R$ {(proposal.requested_amount || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-500 font-medium">Valor Aprovado</p>
              <p className="text-2xl font-bold text-green-600">
                R$ {(proposal.approved_amount || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-500 font-medium">Data da Solicitação</p>
              <p className="text-sm font-semibold text-slate-900">
                {format(new Date(proposal.created_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
            {proposal.disbursement_date && (
              <div className="space-y-1">
                <p className="text-xs text-slate-500 font-medium">Data do Desembolso</p>
                <p className="text-sm font-semibold text-slate-900">
                  {format(new Date(proposal.disbursement_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Condições Financeiras */}
          <div>
            <p className="text-sm font-semibold text-slate-900 mb-3">Condições Financeiras</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Percent className="w-4 h-4 text-blue-600" />
                  <p className="text-xs text-slate-600">Taxa Mensal</p>
                </div>
                <p className="text-lg font-bold text-blue-600">
                  {proposal.interest_rate ? `${proposal.interest_rate.toFixed(2)}%` : "N/A"}
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Percent className="w-4 h-4 text-purple-600" />
                  <p className="text-xs text-slate-600">CET</p>
                </div>
                <p className="text-lg font-bold text-purple-600">
                  {proposal.cet ? `${proposal.cet.toFixed(2)}%` : "N/A"}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <p className="text-xs text-slate-600">Parcelas</p>
                </div>
                <p className="text-lg font-bold text-green-600">
                  {proposal.installments || 1}x
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Informações Adicionais */}
          <div>
            <p className="text-sm font-semibold text-slate-900 mb-3">Informações da Proposta</p>
            <div className="space-y-2 text-sm">
              {proposal.scd_partner && (
                <div className="flex justify-between">
                  <span className="text-slate-600">SCD Parceira:</span>
                  <span className="font-semibold text-slate-900">{proposal.scd_partner}</span>
                </div>
              )}
              {proposal.ccb_number && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Número da CCB:</span>
                  <span className="font-semibold text-slate-900">{proposal.ccb_number}</span>
                </div>
              )}
              {proposal.disbursement_bank && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Banco de Desembolso:</span>
                  <span className="font-semibold text-slate-900">{proposal.disbursement_bank}</span>
                </div>
              )}
              {proposal.channel && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Canal:</span>
                  <span className="font-semibold text-slate-900 capitalize">{proposal.channel}</span>
                </div>
              )}
            </div>
          </div>

          {/* Observações */}
          {proposal.notes && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-semibold text-slate-900 mb-2">Observações</p>
                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded">
                  {proposal.notes}
                </p>
              </div>
            </>
          )}

          {/* Suporte */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <p className="text-sm text-blue-900">
              <strong>Dúvidas?</strong> Entre em contato pelo WhatsApp para mais informações sobre sua proposta.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}