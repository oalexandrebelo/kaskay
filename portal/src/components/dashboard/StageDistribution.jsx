import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function StageDistribution() {
  const [stageData, setStageData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchStages = async () => {
      const proposals = await base44.entities.Proposal.list();
      
      const stages = {};
      proposals.forEach((p) => {
        stages[p.status] = (stages[p.status] || 0) + 1;
      });

      const sorted = Object.entries(stages)
        .map(([status, count]) => ({
          status,
          label: stageLabels[status] || status,
          count,
          percentage: Math.round((count / proposals.length) * 100),
        }))
        .sort((a, b) => b.count - a.count);

      setStageData(sorted);
      setTotal(proposals.length);
      setLoading(false);
    };

    fetchStages();

    // Subscribe para atualizações em tempo real
    const unsubscribe = base44.entities.Proposal.subscribe(() => {
      fetchStages();
    });

    return () => unsubscribe();
  }, []);

  const colors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-red-500",
    "bg-indigo-500",
    "bg-cyan-500",
  ];

  return (
    <Card className="border-0 shadow-sm col-span-1 lg:col-span-2">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Distribuição por Estágio</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {stageData.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma proposta</p>
            ) : (
              stageData.map((stage, idx) => (
                <div key={stage.status} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700 font-medium">
                      {stage.label}
                    </span>
                    <span className="text-slate-600">
                      {stage.count} ({stage.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        colors[idx % colors.length]
                      }`}
                      style={{ width: `${stage.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Total de propostas: <span className="font-semibold text-slate-900">{total}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}