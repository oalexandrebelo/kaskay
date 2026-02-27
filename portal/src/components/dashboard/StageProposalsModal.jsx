import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const stageLabels = {
  draft: "Rascunho",
  awaiting_documents: "Aguardando Docs",
  under_analysis: "Em Análise",
  margin_check: "Verificação Margem",
  margin_approved: "Margem Aprovada",
  margin_rejected: "Margem Rejeitada",
  ccb_pending: "CCB Pendente",
  ccb_issued: "CCB Emitida",
  signature_pending: "Assinatura Pendente",
  signature_completed: "Assinatura Completa",
  averbation_pending: "Averbação Pendente",
  averbated: "Averbada",
  disbursed: "Desembolsada",
  rejected: "Rejeitada",
  cancelled: "Cancelada",
  expired: "Expirada",
};

export default function StageProposalsModal({ open, onOpenChange, stage, proposals = [] }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = proposals.filter(p =>
    p.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.proposal_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.client_cpf?.includes(searchTerm)
  );

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: "bg-slate-100 text-slate-800",
      awaiting_documents: "bg-yellow-100 text-yellow-800",
      under_analysis: "bg-blue-100 text-blue-800",
      margin_approved: "bg-emerald-100 text-emerald-800",
      margin_rejected: "bg-red-100 text-red-800",
      ccb_issued: "bg-purple-100 text-purple-800",
      signature_completed: "bg-indigo-100 text-indigo-800",
      averbated: "bg-cyan-100 text-cyan-800",
      disbursed: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-slate-100 text-slate-800";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge className="bg-blue-600">{proposals.length}</Badge>
            {stageLabels[stage] || stage}
          </DialogTitle>
        </DialogHeader>

        <div className="relative px-6">
          <Search className="absolute left-9 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Pesquisar por cliente, proposta ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-3 pr-4">
            {filtered.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500 text-sm">Nenhuma proposta encontrada</p>
              </div>
            ) : (
              filtered.map((p) => (
                <div
                  key={p.id}
                  className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-slate-900">{p.client_name}</p>
                        <Badge variant="outline" className="text-xs">
                          {p.proposal_number}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600">{p.client_cpf}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">
                        {formatCurrency(p.approved_amount || p.requested_amount || 0)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(p.created_date).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 items-center">
                    {p.convenio_name && (
                      <Badge variant="outline" className="text-xs bg-purple-50 text-purple-800 border-0">
                        {p.convenio_name}
                      </Badge>
                    )}
                    <Badge className={`text-xs border-0 ${getStatusColor(p.status)}`}>
                      {stageLabels[p.status] || p.status}
                    </Badge>
                    {p.interest_rate && (
                      <Badge variant="outline" className="text-xs">
                        {p.interest_rate}% a.m.
                      </Badge>
                    )}
                    {p.installments && (
                      <Badge variant="outline" className="text-xs">
                        {p.installments}x
                      </Badge>
                    )}
                  </div>

                  {p.rejection_reason && (
                    <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                      <p className="text-xs text-red-800">
                        <strong>Motivo da rejeição:</strong> {p.rejection_reason}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}