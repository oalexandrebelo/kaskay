import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle2, XCircle, AlertTriangle, Clock, Zap, 
  TrendingUp, TrendingDown, Minus, Brain, Eye 
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function AutoDecisionQueue() {
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ["proposals"],
    queryFn: () => base44.entities.Proposal.list("-created_date", 200),
  });

  // Processar decisão manual
  const decisionMutation = useMutation({
    mutationFn: async ({ id, decision, notes }) => {
      const updateData = {
        status: decision === 'approved' ? 'margin_check' : 'rejected',
        decision_result: decision,
      };
      if (notes) updateData.notes = notes;
      return base44.entities.Proposal.update(id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      setDetailDialog(false);
    },
  });

  // Executar decisão automática
  const autoDecisionMutation = useMutation({
    mutationFn: (proposalId) => base44.functions.invoke('autoDecisionEngine', { proposal_id: proposalId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
    },
  });

  // Filtrar propostas por status
  const autoApproved = proposals.filter(p => 
    p.decision_result === 'approved' && 
    (p.status === 'margin_check' || p.status === 'margin_approved')
  );
  
  const autoRejected = proposals.filter(p => 
    p.decision_result === 'rejected' && 
    p.status === 'rejected'
  );

  const manualReview = proposals.filter(p => 
    p.decision_result === 'manual_review' && 
    p.status === 'under_analysis'
  );

  // Priorizar fila de revisão manual
  const highPriority = manualReview.filter(p => p.notes?.includes('Prioridade: HIGH'));
  const normalPriority = manualReview.filter(p => !p.notes?.includes('Prioridade: HIGH') && !p.notes?.includes('Prioridade: LOW'));
  const lowPriority = manualReview.filter(p => p.notes?.includes('Prioridade: LOW'));

  const getScoreIcon = (score) => {
    if (score >= 75) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (score >= 50) return <Minus className="w-4 h-4 text-amber-600" />;
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const ProposalCard = ({ proposal, showActions = false }) => {
    const score = proposal.decision_score || 0;
    
    return (
      <Card className="hover:shadow-md transition-all">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-semibold text-slate-900">{proposal.client_name}</p>
                <Badge variant="outline" className="text-xs">{proposal.proposal_number}</Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                <span>CPF: {proposal.client_cpf}</span>
                <span>•</span>
                <span>R$ {proposal.requested_amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                {score > 0 && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      {getScoreIcon(score)}
                      <span className={cn(
                        "font-semibold",
                        score >= 75 && "text-green-600",
                        score >= 50 && score < 75 && "text-amber-600",
                        score < 50 && "text-red-600"
                      )}>
                        {score}/100
                      </span>
                    </div>
                  </>
                )}
              </div>
              {proposal.notes && (
                <div className="text-xs text-slate-600 bg-slate-50 rounded-lg p-2 space-y-0.5">
                  {proposal.notes.split('\n').slice(0, 3).map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
              )}
            </div>
            {showActions && (
              <div className="flex flex-col gap-2 shrink-0">
                <Button
                  size="sm"
                  onClick={() => { setSelectedProposal(proposal); setDetailDialog(true); }}
                  variant="outline"
                  className="rounded-lg"
                >
                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                  Ver
                </Button>
                <Button
                  size="sm"
                  onClick={() => decisionMutation.mutate({ id: proposal.id, decision: 'approved' })}
                  disabled={decisionMutation.isPending}
                  className="rounded-lg bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Aprovar
                </Button>
                <Button
                  size="sm"
                  onClick={() => decisionMutation.mutate({ id: proposal.id, decision: 'rejected' })}
                  disabled={decisionMutation.isPending}
                  variant="destructive"
                  className="rounded-lg"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1.5" />
                  Rejeitar
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Decisão Automatizada</h1>
        <p className="text-slate-500 text-sm mt-1">Aprovação e rejeição automática com fila inteligente de revisão</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-green-100 bg-green-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-900">{autoApproved.length}</p>
                <p className="text-xs text-green-600 font-medium">Auto-Aprovadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-100 bg-red-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-900">{autoRejected.length}</p>
                <p className="text-xs text-red-600 font-medium">Auto-Rejeitadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-100 bg-amber-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-900">{manualReview.length}</p>
                <p className="text-xs text-amber-600 font-medium">Revisão Manual</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-100 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-900">
                  {autoApproved.length + autoRejected.length > 0
                    ? Math.round((autoApproved.length + autoRejected.length) / proposals.length * 100)
                    : 0}%
                </p>
                <p className="text-xs text-blue-600 font-medium">Automação</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="manual" className="space-y-4">
        <TabsList className="bg-slate-100 rounded-xl">
          <TabsTrigger value="manual" className="rounded-lg">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Revisão Manual ({manualReview.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="rounded-lg">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Auto-Aprovadas ({autoApproved.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="rounded-lg">
            <XCircle className="w-4 h-4 mr-2" />
            Auto-Rejeitadas ({autoRejected.length})
          </TabsTrigger>
        </TabsList>

        {/* Revisão Manual */}
        <TabsContent value="manual" className="space-y-4">
          {highPriority.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-red-600 text-white">🔥 Alta Prioridade</Badge>
                <span className="text-xs text-slate-500">Boa chance de aprovação</span>
              </div>
              <div className="space-y-2">
                {highPriority.map(p => <ProposalCard key={p.id} proposal={p} showActions />)}
              </div>
            </div>
          )}

          {normalPriority.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline">Prioridade Normal</Badge>
              </div>
              <div className="space-y-2">
                {normalPriority.map(p => <ProposalCard key={p.id} proposal={p} showActions />)}
              </div>
            </div>
          )}

          {lowPriority.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary">Baixa Prioridade</Badge>
                <span className="text-xs text-slate-500">Revisar quando possível</span>
              </div>
              <div className="space-y-2">
                {lowPriority.map(p => <ProposalCard key={p.id} proposal={p} showActions />)}
              </div>
            </div>
          )}

          {manualReview.length === 0 && (
            <div className="text-center py-12">
              <Brain className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400">Nenhuma proposta aguardando revisão manual</p>
            </div>
          )}
        </TabsContent>

        {/* Auto-Aprovadas */}
        <TabsContent value="approved" className="space-y-2">
          {autoApproved.map(p => <ProposalCard key={p.id} proposal={p} />)}
          {autoApproved.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400">Nenhuma proposta auto-aprovada ainda</p>
            </div>
          )}
        </TabsContent>

        {/* Auto-Rejeitadas */}
        <TabsContent value="rejected" className="space-y-2">
          {autoRejected.map(p => <ProposalCard key={p.id} proposal={p} />)}
          {autoRejected.length === 0 && (
            <div className="text-center py-12">
              <XCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400">Nenhuma proposta auto-rejeitada ainda</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Proposta</DialogTitle>
          </DialogHeader>
          {selectedProposal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 text-xs">Cliente</p>
                  <p className="font-semibold">{selectedProposal.client_name}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">CPF</p>
                  <p className="font-semibold">{selectedProposal.client_cpf}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Valor Solicitado</p>
                  <p className="font-semibold">
                    R$ {selectedProposal.requested_amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Score de Decisão</p>
                  <p className="font-semibold">{selectedProposal.decision_score || 'N/A'}/100</p>
                </div>
              </div>

              {selectedProposal.notes && (
                <div>
                  <p className="text-slate-500 text-xs mb-2">Análise</p>
                  <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 whitespace-pre-line">
                    {selectedProposal.notes}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => decisionMutation.mutate({ 
                    id: selectedProposal.id, 
                    decision: 'approved',
                    notes: selectedProposal.notes 
                  })}
                  disabled={decisionMutation.isPending}
                  className="flex-1 rounded-xl bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Aprovar
                </Button>
                <Button
                  onClick={() => decisionMutation.mutate({ 
                    id: selectedProposal.id, 
                    decision: 'rejected',
                    notes: selectedProposal.notes 
                  })}
                  disabled={decisionMutation.isPending}
                  variant="destructive"
                  className="flex-1 rounded-xl"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rejeitar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}