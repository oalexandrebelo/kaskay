import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut, User, Clock, CheckCircle2, XCircle, AlertCircle, DollarSign, Plus } from "lucide-react";
import ProposalHistoryList from "@/components/server/ProposalHistoryList.jsx";
import ProposalDetailModal from "@/components/server/ProposalDetailModal.jsx";

export default function ServerClientPortal() {
  const navigate = useNavigate();
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [clientCPF, setClientCPF] = useState("");
  const [clientName, setClientName] = useState("");

  // Verificar autenticação
  useEffect(() => {
    const cpf = sessionStorage.getItem("serverClientCPF");
    const name = sessionStorage.getItem("serverClientName");

    if (!cpf) {
      navigate(createPageUrl("ServerClientLogin"));
      return;
    }

    setClientCPF(cpf);
    setClientName(name || "Servidor");
  }, [navigate]);

  // Buscar propostas do cliente
  const { data: proposals, isLoading } = useQuery({
    queryKey: ["server_proposals", clientCPF],
    queryFn: () => (clientCPF ? base44.entities.Proposal.filter({ client_cpf: clientCPF }) : []),
    enabled: !!clientCPF,
  });

  // Cálculos de métricas
  const metrics = {
    total: proposals?.length || 0,
    approved: proposals?.filter(p => ["margin_approved", "ccb_issued", "signature_completed", "averbated", "disbursed"].includes(p.status)).length || 0,
    pending: proposals?.filter(p => ["draft", "awaiting_documents", "under_analysis", "margin_check"].includes(p.status)).length || 0,
    rejected: proposals?.filter(p => ["rejected", "cancelled"].includes(p.status)).length || 0,
    totalAmount: proposals?.reduce((sum, p) => sum + (p.approved_amount || p.requested_amount || 0), 0) || 0,
  };

  const handleLogout = () => {
    sessionStorage.removeItem("serverClientCPF");
    sessionStorage.removeItem("serverClientName");
    navigate(createPageUrl("ServerClientLogin"));
  };

  const handleNewAdvance = () => {
    // Redirecionar para nova proposta passando o CPF
    navigate(createPageUrl(`FastProposal?cpf=${clientCPF}`));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-2">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-slate-900">{clientName}</h1>
              <p className="text-xs text-slate-500">CPF: {clientCPF.slice(0, 3)}.{clientCPF.slice(3, 6)}.{clientCPF.slice(6, 9)}-{clientCPF.slice(9)}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-600 hover:text-red-600">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="border-slate-200">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-slate-600">Total de Propostas</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-3xl font-bold text-slate-900">{metrics.total}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <p className="text-sm text-slate-600">Aprovadas</p>
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-3xl font-bold text-green-600">{metrics.approved}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <p className="text-sm text-slate-600">Pendentes</p>
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-3xl font-bold text-blue-600">{metrics.pending}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 border-l-4 border-l-red-500">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <p className="text-sm text-slate-600">Rejeitadas</p>
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-3xl font-bold text-red-600">{metrics.rejected}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 border-l-4 border-l-purple-500">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-purple-600" />
                  <p className="text-sm text-slate-600">Total Solicitado</p>
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-lg font-bold text-purple-600">R$ {metrics.totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Botão Nova Solicitação */}
        <div className="flex gap-3">
          <Button
            onClick={handleNewAdvance}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold gap-2"
          >
            <Plus className="w-4 h-4" />
            Solicitar Novo Adiantamento
          </Button>
        </div>

        {/* Lista de Propostas */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              Histórico de Propostas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
              </div>
            ) : proposals && proposals.length > 0 ? (
              <ProposalHistoryList
                proposals={proposals}
                onSelectProposal={setSelectedProposal}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-600">Nenhuma proposta encontrada</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Detalhes */}
      {selectedProposal && (
        <ProposalDetailModal
          proposal={selectedProposal}
          onClose={() => setSelectedProposal(null)}
        />
      )}
    </div>
  );
}