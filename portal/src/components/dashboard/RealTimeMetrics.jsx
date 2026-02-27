import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Clock, Target, ArrowUpRight, ArrowDownRight, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import StageProposalsModal from "./StageProposalsModal";

export default function RealTimeMetrics() {
  const [metrics, setMetrics] = useState({
    clientsInProgress: 0,
    avgCompletionDays: 0,
    pendingProposals: 0,
    conversionRate: 0,
    todayVolume: 0,
    todayAmount: 0,
    monthVolume: 0,
    monthAmount: 0,
    yesterdayVolume: 0,
    yesterdayAmount: 0,
    monthPreviousAmount: 0,
    statusDistribution: [],
  });
  const [loading, setLoading] = useState(true);
  const [allProposals, setAllProposals] = useState([]);
  const [modalStage, setModalStage] = useState(null);
  const [stageProposals, setStageProposals] = useState([]);

  useEffect(() => {
    const calculateMetrics = async () => {
      const allProposals = await base44.entities.Proposal.list();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

      // Volume e valor do dia
      const todayProposals = allProposals.filter(p => {
        const created = new Date(p.created_date);
        created.setHours(0, 0, 0, 0);
        return created.getTime() === today.getTime();
      });
      const todayVolume = todayProposals.length;
      const todayAmount = todayProposals.reduce((sum, p) => sum + (p.approved_amount || p.requested_amount || 0), 0);

      // Volume e valor ontem
      const yesterdayProposals = allProposals.filter(p => {
        const created = new Date(p.created_date);
        created.setHours(0, 0, 0, 0);
        return created.getTime() === yesterday.getTime();
      });
      const yesterdayVolume = yesterdayProposals.length;
      const yesterdayAmount = yesterdayProposals.reduce((sum, p) => sum + (p.approved_amount || p.requested_amount || 0), 0);

      // Volume e valor do mês
      const monthProposals = allProposals.filter(p => {
        const created = new Date(p.created_date);
        return created >= monthStart && created < new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
      });
      const monthVolume = monthProposals.length;
      const monthAmount = monthProposals.reduce((sum, p) => sum + (p.approved_amount || p.requested_amount || 0), 0);

      // Volume e valor do mês anterior
      const prevMonthProposals = allProposals.filter(p => {
        const created = new Date(p.created_date);
        return created >= prevMonthStart && created <= prevMonthEnd;
      });
      const monthPreviousAmount = prevMonthProposals.reduce((sum, p) => sum + (p.approved_amount || p.requested_amount || 0), 0);

      // Clientes em andamento (únicos)
      const inProgressProposals = allProposals.filter(p => 
        !["rejected", "cancelled", "expired", "disbursed"].includes(p.status)
      );
      const uniqueClients = new Set(inProgressProposals.map(p => p.client_id).filter(Boolean));

      // Propostas pendentes
      const pending = allProposals.filter(p => 
        ["draft", "awaiting_documents", "under_analysis"].includes(p.status)
      ).length;

      // Tempo médio de conclusão
      const disbursed = allProposals.filter(p => p.status === "disbursed");
      const avgDays = disbursed.length > 0
        ? Math.round(disbursed.reduce((sum, p) => {
            const created = new Date(p.created_date);
            const disbDate = new Date(p.disbursement_date);
            return sum + Math.floor((disbDate - created) / (1000 * 60 * 60 * 24));
          }, 0) / disbursed.length)
        : 0;

      // Taxa de conversão
      const approved = allProposals.filter(p => !["rejected", "cancelled", "expired"].includes(p.status)).length;
      const conversion = allProposals.length > 0 ? Math.round((approved / allProposals.length) * 100) : 0;

      // Distribuição de status (para gráfico pizza)
      const statusCounts = {};
      allProposals.forEach(p => {
        statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
      });

      const statusLabels = {
        draft: "Rascunho",
        awaiting_documents: "Aguardando Docs",
        under_analysis: "Análise",
        margin_check: "Verificação",
        ccb_issued: "CCB",
        signature_pending: "Assinatura",
        averbated: "Averbada",
        disbursed: "Desembolsada",
        rejected: "Rejeitada",
      };

      const statusDistribution = Object.entries(statusCounts)
        .filter(([_, count]) => count > 0)
        .map(([status, count]) => ({
          name: statusLabels[status] || status,
          value: count,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // Top 5

      setAllProposals(allProposals);
      setMetrics({
        clientsInProgress: uniqueClients.size,
        avgCompletionDays: avgDays,
        pendingProposals: pending,
        conversionRate: conversion,
        todayVolume,
        todayAmount,
        monthVolume,
        monthAmount,
        yesterdayVolume,
        yesterdayAmount,
        monthPreviousAmount,
        statusDistribution,
      });
      setLoading(false);
    };

    calculateMetrics();
    const unsubscribe = base44.entities.Proposal.subscribe(() => calculateMetrics());
    return () => unsubscribe();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      notation: "compact",
    }).format(value);
  };

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  const handleStageClick = (stage) => {
    const proposals = allProposals.filter(p => p.status === stage);
    setStageProposals(proposals);
    setModalStage(stage);
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Volume e Valor - 3 colunas compactas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="pt-4">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-7 w-12" />
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-600 font-medium">Volume Hoje</p>
                <div className="flex items-baseline justify-between mt-2">
                  <p className="text-2xl font-bold text-blue-900">{metrics.todayVolume}</p>
                  <div className="flex items-center gap-1">
                    {metrics.todayVolume >= metrics.yesterdayVolume ? (
                      <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 text-red-600" />
                    )}
                    <span className={`text-xs font-semibold ${metrics.todayVolume >= metrics.yesterdayVolume ? "text-emerald-600" : "text-red-600"}`}>
                      {Math.abs(metrics.todayVolume - metrics.yesterdayVolume)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardContent className="pt-4">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-7 w-16" />
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-600 font-medium">Valor Hoje</p>
                <p className="text-xl font-bold text-emerald-900 mt-2">{formatCurrency(metrics.todayAmount)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="pt-4">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-7 w-12" />
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-600 font-medium">Mês (Volume)</p>
                <p className="text-2xl font-bold text-purple-900 mt-2">{metrics.monthVolume}</p>
                <p className="text-xs text-slate-600 mt-1">{formatCurrency(metrics.monthAmount)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráfico Pizza + KPIs em 2 colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Estágios Clicáveis */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Propostas por Estágio</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : metrics.statusDistribution.length > 0 ? (
              <div className="space-y-2">
                {metrics.statusDistribution.map((stage, idx) => (
                  <button
                    key={stage.name}
                    onClick={() => handleStageClick(stage.name)}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all group"
                  >
                    <div className="flex items-center gap-3 flex-1 text-left">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span className="text-sm font-medium text-slate-900">{stage.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{stage.value}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">Nenhuma proposta</p>
            )}
          </CardContent>
        </Card>

        {/* KPIs Compactos */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-slate-500 font-medium">Clientes em Progresso</p>
                    <p className="text-xl font-bold text-slate-900 mt-2">{metrics.clientsInProgress}</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-slate-500 font-medium">Tempo Médio</p>
                    <p className="text-xl font-bold text-slate-900 mt-2">{metrics.avgCompletionDays}d</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-slate-500 font-medium">Pendentes</p>
                    <p className="text-xl font-bold text-slate-900 mt-2">{metrics.pendingProposals}</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-slate-500 font-medium">Conversão</p>
                    <p className="text-xl font-bold text-slate-900 mt-2">{metrics.conversionRate}%</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de detalhes das propostas por estágio */}
      <StageProposalsModal
        open={!!modalStage}
        onOpenChange={() => setModalStage(null)}
        stage={modalStage}
        proposals={stageProposals}
      />
    </div>
  );
}