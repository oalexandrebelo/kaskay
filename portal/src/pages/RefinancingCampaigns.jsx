import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import VirtualizedTable from "@/components/common/VirtualizedTable";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  MessageSquare,
  Target,
  Award,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";

const refinTypeLabels = {
  rate_reduction: "Redução de Taxa",
  term_extension: "Extensão de Prazo",
  cashout: "Troco (Cashout)",
  delinquency_recovery: "Recuperação de Inadimplência",
};

const refinTypeColors = {
  rate_reduction: "bg-blue-100 text-blue-700",
  term_extension: "bg-purple-100 text-purple-700",
  cashout: "bg-emerald-100 text-emerald-700",
  delinquency_recovery: "bg-amber-100 text-amber-700",
};

const statusColors = {
  detected: "bg-slate-100 text-slate-700",
  campaign_sent: "bg-indigo-100 text-indigo-700",
  client_contacted: "bg-blue-100 text-blue-700",
  proposal_created: "bg-purple-100 text-purple-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

export default function RefinancingCampaigns() {
  const queryClient = useQueryClient();

  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ["refinancing_opportunities"],
    queryFn: () => base44.entities.RefinancingOpportunity.list("-created_date", 500),
  });

  const detectOpportunitiesMutation = useMutation({
    mutationFn: () => base44.functions.invoke('detectRefinancingOpportunities', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["refinancing_opportunities"] });
    },
  });

  // KPIs
  const activeOpportunities = opportunities.filter(o => ['detected', 'campaign_sent', 'client_contacted'].includes(o.status));
  const totalCashout = activeOpportunities.reduce((sum, o) => sum + (o.cashout_amount || 0), 0);
  const totalRefinAmount = activeOpportunities.reduce((sum, o) => sum + (o.refinancing_amount || 0), 0);
  const conversionRate = opportunities.length > 0 
    ? (opportunities.filter(o => o.status === 'approved').length / opportunities.length) * 100 
    : 0;

  // Breakdown por tipo
  const breakdown = {
    rate_reduction: opportunities.filter(o => o.refin_type === 'rate_reduction').length,
    cashout: opportunities.filter(o => o.refin_type === 'cashout').length,
    delinquency_recovery: opportunities.filter(o => o.refin_type === 'delinquency_recovery').length,
  };

  // Colunas da tabela
  const columns = [
    {
      header: "Cliente",
      accessor: (row) => row.client_name,
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.client_name}</p>
          <p className="text-xs text-slate-500">{row.client_cpf}</p>
        </div>
      ),
    },
    {
      header: "Tipo",
      accessor: (row) => row.refin_type,
      render: (row) => (
        <Badge className={`${refinTypeColors[row.refin_type]} border-0`}>
          {refinTypeLabels[row.refin_type]}
        </Badge>
      ),
    },
    {
      header: "Progresso",
      accessor: (row) => row.payment_progress,
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-slate-900">{row.payment_progress?.toFixed(0)}%</p>
          <p className="text-xs text-slate-500">
            {row.installments_paid}/{row.total_installments} parcelas
          </p>
        </div>
      ),
    },
    {
      header: "Valor Refin",
      accessor: (row) => row.refinancing_amount,
      render: (row) => (
        <span className="text-sm font-semibold text-slate-900">
          R$ {row.refinancing_amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: "Troco Cliente",
      accessor: (row) => row.cashout_amount,
      render: (row) => (
        row.cashout_amount > 0 ? (
          <span className="text-sm font-semibold text-emerald-700">
            R$ {row.cashout_amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )
      ),
    },
    {
      header: "Taxa",
      accessor: (row) => row.current_rate,
      render: (row) => (
        <div className="text-xs">
          <p className="text-slate-500">
            {row.current_rate?.toFixed(2)}% → {row.suggested_rate?.toFixed(2)}%
          </p>
          {row.suggested_rate < row.current_rate && (
            <Badge className="bg-green-100 text-green-700 border-0 mt-1">
              ↓ {((row.current_rate - row.suggested_rate) / row.current_rate * 100).toFixed(0)}%
            </Badge>
          )}
        </div>
      ),
    },
    {
      header: "Score",
      accessor: (row) => row.opportunity_score,
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="h-2 w-16 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-600 rounded-full"
              style={{ width: `${row.opportunity_score}%` }}
            />
          </div>
          <span className="text-xs font-medium text-slate-700">{row.opportunity_score}</span>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: (row) => row.status,
      render: (row) => (
        <Badge className={`${statusColors[row.status] || 'bg-slate-100 text-slate-700'} border-0`}>
          {row.status?.replace(/_/g, ' ')}
        </Badge>
      ),
    },
  ];

  if (isLoading) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Campanhas de Refinanciamento</h1>
          <p className="text-slate-500 text-sm mt-1">
            Oportunidades inteligentes de refinanciamento
          </p>
        </div>
        <Button
          onClick={() => detectOpportunitiesMutation.mutate()}
          disabled={detectOpportunitiesMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700 rounded-xl"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Detectar Oportunidades
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-100 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-blue-700 uppercase">Oportunidades</p>
              <Target className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-900">{activeOpportunities.length}</p>
            <p className="text-xs text-blue-600 mt-1">Ativas</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 bg-emerald-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-emerald-700 uppercase">Volume Refin</p>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-900">
              R$ {(totalRefinAmount / 1000).toFixed(0)}k
            </p>
            <p className="text-xs text-emerald-600 mt-1">Total potencial</p>
          </CardContent>
        </Card>

        <Card className="border-purple-100 bg-purple-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-purple-700 uppercase">Troco Clientes</p>
              <Award className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-900">
              R$ {(totalCashout / 1000).toFixed(0)}k
            </p>
            <p className="text-xs text-purple-600 mt-1">Cashout total</p>
          </CardContent>
        </Card>

        <Card className="border-indigo-100 bg-indigo-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-indigo-700 uppercase">Conversão</p>
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-indigo-900">{conversionRate.toFixed(1)}%</p>
            <p className="text-xs text-indigo-600 mt-1">Taxa de sucesso</p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown por tipo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600 mb-1">Redução de Taxa</p>
                <p className="text-xl font-bold text-blue-900">{breakdown.rate_reduction}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600 mb-1">Cashout</p>
                <p className="text-xl font-bold text-emerald-900">{breakdown.cashout}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <Award className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600 mb-1">Recuperação</p>
                <p className="text-xl font-bold text-amber-900">{breakdown.delinquency_recovery}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Oportunidades */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Oportunidades Detectadas</CardTitle>
        </CardHeader>
        <CardContent>
          <VirtualizedTable
            data={opportunities}
            columns={columns}
            pageSize={50}
          />
        </CardContent>
      </Card>
    </div>
  );
}