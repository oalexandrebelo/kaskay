import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";

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

export default function StageDistributionPareto() {
  const [stageData, setStageData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState(null);
  const [stageProposals, setStageProposals] = useState([]);

  useEffect(() => {
    const fetchStages = async () => {
      const proposals = await base44.entities.Proposal.list();
      
      const stages = {};
      proposals.forEach((p) => {
        stages[p.status] = (stages[p.status] || 0) + 1;
      });

      // Ordenar por quantidade (Pareto)
      const sorted = Object.entries(stages)
        .map(([status, count]) => ({
          status,
          label: stageLabels[status] || status,
          count,
          percentage: Math.round((count / proposals.length) * 100),
          cumulativePercentage: 0,
          amount: proposals
            .filter(p => p.status === status)
            .reduce((sum, p) => sum + (p.approved_amount || p.requested_amount || 0), 0),
        }))
        .sort((a, b) => b.count - a.count);

      // Calcular percentual acumulado
      let cumulative = 0;
      sorted.forEach(item => {
        cumulative += item.percentage;
        item.cumulativePercentage = Math.min(cumulative, 100);
      });

      setStageData(sorted);
      setLoading(false);
    };

    fetchStages();
    const unsubscribe = base44.entities.Proposal.subscribe(() => fetchStages());
    return () => unsubscribe();
  }, []);

  const handleStageClick = async (stage) => {
    const proposals = await base44.entities.Proposal.list();
    const filtered = proposals.filter(p => p.status === stage.status);
    setStageProposals(filtered);
    setSelectedStage(stage);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      notation: "compact",
    }).format(value);
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Distribuição de Estágios (Pareto)</CardTitle>
          <p className="text-xs text-slate-500 mt-1">Clique em cada estágio para ver detalhes</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stageData.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma proposta</p>
            ) : (
              stageData.map((stage, idx) => (
                <button
                  key={stage.status}
                  onClick={() => handleStageClick(stage)}
                  className="w-full text-left hover:bg-slate-50 p-3 rounded-lg transition-all border border-transparent hover:border-slate-200 cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="text-sm font-medium text-slate-900 min-w-fit">
                        {stage.label}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {stage.count}
                      </Badge>
                      <Badge className="text-xs bg-emerald-600 text-white ml-auto">
                        {stage.percentage}%
                      </Badge>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
                  </div>

                  {/* Pareto Bar */}
                  <div className="flex gap-1 items-center mb-1">
                    {/* Barra de quantidade */}
                    <div className="flex-1 relative h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                        style={{
                          width: `${stage.percentage}%`,
                        }}
                      />
                    </div>
                    {/* Linha de percentual acumulado */}
                    <div className="absolute h-2 border-r-2 border-orange-500 opacity-60" 
                      style={{
                        left: `${(stage.cumulativePercentage / 100) * 100}%`,
                        top: 0,
                      }}>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>{formatCurrency(stage.amount)} em volume</span>
                    <span className="text-slate-400">Acumulado: {stage.cumulativePercentage}%</span>
                  </div>
                </button>
              ))
            )}
          </div>

          {stageData.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Top 3 Estágios</p>
                  <div className="space-y-1">
                    {stageData.slice(0, 3).map((stage, i) => (
                      <div key={stage.status} className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400">#{i + 1}</span>
                        <span className="text-slate-700 font-medium flex-1">{stage.label}</span>
                        <span className="text-slate-600 font-semibold">{stage.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Volume Total</p>
                  <p className="text-lg font-bold text-slate-900">
                    {formatCurrency(stageData.reduce((sum, s) => sum + s.amount, 0))}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    em {stageData.reduce((sum, s) => sum + s.count, 0)} propostas
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <Dialog open={!!selectedStage} onOpenChange={() => setSelectedStage(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge className="bg-blue-600">{selectedStage?.count}</Badge>
              {selectedStage?.label}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-4 py-4 border-b">
            <div>
              <p className="text-xs text-slate-500 mb-1">Quantidade</p>
              <p className="text-2xl font-bold text-slate-900">{selectedStage?.count}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Percentual</p>
              <p className="text-2xl font-bold text-slate-900">{selectedStage?.percentage}%</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Volume Total</p>
              <p className="text-lg font-bold text-slate-900">{formatCurrency(selectedStage?.amount || 0)}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Propostas neste estágio</h3>
            {stageProposals.map(p => (
              <div key={p.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{p.client_name}</p>
                    <p className="text-xs text-slate-600">{p.proposal_number}</p>
                  </div>
                  <Badge variant="outline">{formatCurrency(p.approved_amount || p.requested_amount)}</Badge>
                </div>
                <div className="flex gap-2 flex-wrap mt-2">
                  {p.convenio_name && (
                    <Badge className="text-xs bg-purple-100 text-purple-800 border-0">{p.convenio_name}</Badge>
                  )}
                  {p.created_date && (
                    <Badge variant="outline" className="text-xs">
                      {new Date(p.created_date).toLocaleDateString("pt-BR")}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}