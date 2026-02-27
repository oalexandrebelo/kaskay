import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Wallet,
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { format, startOfMonth, endOfMonth, addDays, subDays } from "date-fns";

export default function CashflowDashboard() {
  const { data: proposals = [], isLoading: proposalsLoading } = useQuery({
    queryKey: ["proposals"],
    queryFn: () => base44.entities.Proposal.list("-created_date", 500),
  });

  const { data: installments = [], isLoading: installmentsLoading } = useQuery({
    queryKey: ["installments"],
    queryFn: () => base44.entities.Installment.list("-due_date", 1000),
  });

  const { data: reconciliations = [], isLoading: reconciliationsLoading } = useQuery({
    queryKey: ["financial_reconciliations"],
    queryFn: () => base44.entities.FinancialReconciliation.list("-processed_at", 100),
  });

  const { data: issues = [], isLoading: issuesLoading } = useQuery({
    queryKey: ["payment_issues"],
    queryFn: () => base44.entities.PaymentIssue.list("-created_date", 200),
  });

  // === CALCULAR MÉTRICAS ===
  const metrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Desembolsos (saída de caixa)
    const disbursedProposals = proposals.filter(p => p.status === 'disbursed' || p.disbursement_date);
    const totalDisbursed = disbursedProposals.reduce((sum, p) => sum + (p.approved_amount || 0), 0);

    // Recebimentos esperados (parcelas a vencer)
    const pendingInstallments = installments.filter(i => i.status === 'pending');
    const totalPending = pendingInstallments.reduce((sum, i) => sum + (i.expected_amount || 0), 0);

    // Recebimentos confirmados (parcelas pagas)
    const paidInstallments = installments.filter(i => i.status === 'paid');
    const totalPaid = paidInstallments.reduce((sum, i) => sum + (i.paid_amount || 0), 0);

    // Inadimplência
    const overdueInstallments = installments.filter(i => {
      const dueDate = new Date(i.due_date);
      return dueDate < today && i.status !== 'paid';
    });
    const totalOverdue = overdueInstallments.reduce((sum, i) => sum + (i.expected_amount || 0), 0);

    // Fluxo de caixa líquido (recebido - desembolsado)
    const netCashflow = totalPaid - totalDisbursed;

    // Próximos 30 dias
    const next30Days = addDays(today, 30);
    const next30DaysInstallments = installments.filter(i => {
      const dueDate = new Date(i.due_date);
      return dueDate >= today && dueDate <= next30Days && i.status === 'pending';
    });
    const totalNext30Days = next30DaysInstallments.reduce((sum, i) => sum + (i.expected_amount || 0), 0);

    // Divergências de conciliação
    const activeDivergencies = reconciliations.filter(r => r.status === 'with_divergencies');
    const totalDivergencies = activeDivergencies.reduce((sum, r) => sum + Math.abs(r.variance_amount || 0), 0);

    return {
      totalDisbursed,
      totalPaid,
      totalPending,
      totalOverdue,
      netCashflow,
      totalNext30Days,
      totalDivergencies,
      overdueCount: overdueInstallments.length,
      pendingCount: pendingInstallments.length,
      divergenciesCount: activeDivergencies.length,
    };
  }, [proposals, installments, reconciliations]);

  // === GRÁFICO DE FLUXO DE CAIXA (30 DIAS) ===
  const cashflowData = useMemo(() => {
    const data = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = -15; i <= 15; i++) {
      const date = addDays(today, i);
      const dateStr = format(date, 'dd/MM');

      // Recebimentos do dia
      const dayReceived = installments
        .filter(inst => {
          const paidDate = inst.paid_date ? new Date(inst.paid_date) : null;
          return paidDate && format(paidDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
        })
        .reduce((sum, inst) => sum + (inst.paid_amount || 0), 0);

      // Desembolsos do dia
      const dayDisbursed = proposals
        .filter(p => {
          const disbDate = p.disbursement_date ? new Date(p.disbursement_date) : null;
          return disbDate && format(disbDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
        })
        .reduce((sum, p) => sum + (p.approved_amount || 0), 0);

      data.push({
        date: dateStr,
        received: dayReceived,
        disbursed: dayDisbursed,
        net: dayReceived - dayDisbursed,
      });
    }

    return data;
  }, [proposals, installments]);

  // === DISTRIBUIÇÃO DE PARCELAS POR STATUS ===
  const installmentsByStatus = useMemo(() => {
    const statusCounts = {
      pending: { count: 0, amount: 0, color: '#f59e0b' },
      paid: { count: 0, amount: 0, color: '#10b981' },
      overdue: { count: 0, amount: 0, color: '#ef4444' },
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    installments.forEach(inst => {
      if (inst.status === 'paid') {
        statusCounts.paid.count++;
        statusCounts.paid.amount += inst.paid_amount || 0;
      } else {
        const dueDate = new Date(inst.due_date);
        if (dueDate < today) {
          statusCounts.overdue.count++;
          statusCounts.overdue.amount += inst.expected_amount || 0;
        } else {
          statusCounts.pending.count++;
          statusCounts.pending.amount += inst.expected_amount || 0;
        }
      }
    });

    return [
      { name: 'Pagas', value: statusCounts.paid.amount, color: statusCounts.paid.color },
      { name: 'Pendentes', value: statusCounts.pending.amount, color: statusCounts.pending.color },
      { name: 'Vencidas', value: statusCounts.overdue.amount, color: statusCounts.overdue.color },
    ];
  }, [installments]);

  if (proposalsLoading || installmentsLoading || reconciliationsLoading || issuesLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard de Caixa</h1>
        <p className="text-slate-500 text-sm mt-1">Visão em tempo real do fluxo de caixa e conciliação financeira</p>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-100 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-blue-700 uppercase">Desembolsado</p>
              <ArrowDownRight className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-900">
              R$ {(metrics.totalDisbursed / 1000).toFixed(0)}k
            </p>
            <p className="text-xs text-blue-600 mt-1">Saída de caixa</p>
          </CardContent>
        </Card>

        <Card className="border-green-100 bg-green-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-green-700 uppercase">Recebido</p>
              <ArrowUpRight className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-900">
              R$ {(metrics.totalPaid / 1000).toFixed(0)}k
            </p>
            <p className="text-xs text-green-600 mt-1">Entrada de caixa</p>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-slate-100",
          metrics.netCashflow >= 0 ? "bg-emerald-50/50" : "bg-red-50/50"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-700 uppercase">Fluxo Líquido</p>
              {metrics.netCashflow >= 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
            </div>
            <p className={cn(
              "text-2xl font-bold",
              metrics.netCashflow >= 0 ? "text-emerald-900" : "text-red-900"
            )}>
              R$ {(Math.abs(metrics.netCashflow) / 1000).toFixed(0)}k
            </p>
            <p className={cn(
              "text-xs mt-1",
              metrics.netCashflow >= 0 ? "text-emerald-600" : "text-red-600"
            )}>
              {metrics.netCashflow >= 0 ? "Positivo" : "Negativo"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-100 bg-amber-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-amber-700 uppercase">Próximos 30d</p>
              <Calendar className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-900">
              R$ {(metrics.totalNext30Days / 1000).toFixed(0)}k
            </p>
            <p className="text-xs text-amber-600 mt-1">A receber</p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {(metrics.overdueCount > 0 || metrics.divergenciesCount > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metrics.overdueCount > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-900">Inadimplência Ativa</p>
                    <p className="text-xs text-red-700 mt-0.5">
                      {metrics.overdueCount} parcelas vencidas · R$ {(metrics.totalOverdue / 1000).toFixed(1)}k
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {metrics.divergenciesCount > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-900">Divergências Pendentes</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      {metrics.divergenciesCount} reconciliações · R$ {(metrics.totalDivergencies / 1000).toFixed(1)}k
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fluxo de Caixa (30 dias) */}
        <Card className="lg:col-span-2 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Fluxo de Caixa (15 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={cashflowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
                />
                <Legend />
                <Area type="monotone" dataKey="received" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Recebido" />
                <Area type="monotone" dataKey="disbursed" stackId="2" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Desembolsado" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição por Status */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Parcelas por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={installmentsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: R$ ${(entry.value / 1000).toFixed(0)}k`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {installmentsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Resumo de Posição */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Posição de Caixa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4 text-slate-600" />
                <p className="text-xs text-slate-600 font-medium">A Receber (Total)</p>
              </div>
              <p className="text-xl font-bold text-slate-900">
                R$ {(metrics.totalPending / 1000).toFixed(0)}k
              </p>
              <p className="text-xs text-slate-500 mt-1">{metrics.pendingCount} parcelas</p>
            </div>

            <div className="bg-emerald-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <p className="text-xs text-emerald-700 font-medium">Já Recebido</p>
              </div>
              <p className="text-xl font-bold text-emerald-900">
                R$ {(metrics.totalPaid / 1000).toFixed(0)}k
              </p>
              <p className="text-xs text-emerald-600 mt-1">Confirmado</p>
            </div>

            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-red-600" />
                <p className="text-xs text-red-700 font-medium">Vencido</p>
              </div>
              <p className="text-xl font-bold text-red-900">
                R$ {(metrics.totalOverdue / 1000).toFixed(0)}k
              </p>
              <p className="text-xs text-red-600 mt-1">{metrics.overdueCount} parcelas</p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <p className="text-xs text-blue-700 font-medium">Desembolsado</p>
              </div>
              <p className="text-xl font-bold text-blue-900">
                R$ {(metrics.totalDisbursed / 1000).toFixed(0)}k
              </p>
              <p className="text-xs text-blue-600 mt-1">Total saída</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}