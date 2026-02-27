import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingDown, TrendingUp, DollarSign, AlertTriangle, Clock,
  Users, Phone, Mail, MessageSquare, CheckCircle2, Target,
  BarChart3, PieChart, Activity
} from "lucide-react";
import { 
  BarChart, Bar, LineChart, Line, PieChart as RechartPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444"];

export default function CollectionsBI() {
  const [period, setPeriod] = useState("30");

  const { data: paymentIssues = [] } = useQuery({
    queryKey: ["payment_issues"],
    queryFn: () => base44.entities.PaymentIssue.list(),
  });

  const { data: proposals = [] } = useQuery({
    queryKey: ["proposals"],
    queryFn: () => base44.entities.Proposal.list(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  // Filtrar por período
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - parseInt(period));

  const filteredIssues = paymentIssues.filter(issue => 
    new Date(issue.created_date) >= cutoffDate
  );

  // KPIs
  const totalOutstanding = filteredIssues.reduce((sum, i) => sum + (i.outstanding_amount || 0), 0);
  const totalIssues = filteredIssues.length;
  const resolvedIssues = filteredIssues.filter(i => i.status === "resolved").length;
  const recoveryRate = totalIssues > 0 ? (resolvedIssues / totalIssues * 100).toFixed(1) : 0;
  const avgDaysOverdue = filteredIssues.length > 0
    ? (filteredIssues.reduce((sum, i) => sum + (i.days_overdue || 0), 0) / filteredIssues.length).toFixed(1)
    : 0;

  // Issues por status
  const issuesByStatus = filteredIssues.reduce((acc, issue) => {
    acc[issue.status] = (acc[issue.status] || 0) + 1;
    return acc;
  }, {});

  const statusData = Object.entries(issuesByStatus).map(([status, count]) => ({
    name: status.replace("_", " "),
    value: count,
  }));

  // Issues por tipo
  const issuesByType = filteredIssues.reduce((acc, issue) => {
    const type = issue.issue_type || "outros";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const typeData = Object.entries(issuesByType).map(([type, count]) => ({
    name: type.replace("_", " "),
    value: count,
  }));

  // Valor em aberto por faixa de atraso (Aging)
  const agingBuckets = {
    "0-30 dias": 0,
    "31-60 dias": 0,
    "61-90 dias": 0,
    "91-180 dias": 0,
    "180+ dias": 0,
  };

  filteredIssues.forEach(issue => {
    const days = issue.days_overdue || 0;
    const amount = issue.outstanding_amount || 0;
    if (days <= 30) agingBuckets["0-30 dias"] += amount;
    else if (days <= 60) agingBuckets["31-60 dias"] += amount;
    else if (days <= 90) agingBuckets["61-90 dias"] += amount;
    else if (days <= 180) agingBuckets["91-180 dias"] += amount;
    else agingBuckets["180+ dias"] += amount;
  });

  const agingData = Object.entries(agingBuckets).map(([bucket, amount]) => ({
    bucket,
    amount: amount / 1000, // em milhares
  }));

  // Performance de cobrança (últimos 30 dias)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split('T')[0];
  });

  const dailyRecovery = last30Days.map(date => {
    const resolved = paymentIssues.filter(i => 
      i.resolved_at && i.resolved_at.startsWith(date)
    );
    const amount = resolved.reduce((sum, i) => sum + (i.outstanding_amount || 0), 0);
    return {
      date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      recuperado: amount / 1000,
      casos: resolved.length,
    };
  });

  // Estratégias de cobrança
  const strategiesUsed = filteredIssues.reduce((acc, issue) => {
    const strategy = issue.collection_strategy || "não definida";
    acc[strategy] = (acc[strategy] || 0) + 1;
    return acc;
  }, {});

  const strategyData = Object.entries(strategiesUsed).map(([strategy, count]) => ({
    name: strategy.replace("_", " "),
    value: count,
  }));

  // Performance por responsável
  const performanceByUser = filteredIssues.reduce((acc, issue) => {
    if (!issue.assigned_to) return acc;
    if (!acc[issue.assigned_to]) {
      acc[issue.assigned_to] = { total: 0, resolved: 0, amount: 0 };
    }
    acc[issue.assigned_to].total += 1;
    if (issue.status === "resolved") {
      acc[issue.assigned_to].resolved += 1;
      acc[issue.assigned_to].amount += issue.outstanding_amount || 0;
    }
    return acc;
  }, {});

  const userPerformanceData = Object.entries(performanceByUser)
    .map(([user, stats]) => ({
      user: user.split('@')[0],
      taxa: ((stats.resolved / stats.total) * 100).toFixed(1),
      recuperado: stats.amount / 1000,
      casos: stats.total,
    }))
    .sort((a, b) => parseFloat(b.taxa) - parseFloat(a.taxa))
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">BI de Cobrança</h1>
          <p className="text-slate-500 text-sm mt-1">
            Análise completa de inadimplência, recuperação e performance da área de cobrança
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-48 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="60">Últimos 60 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
            <SelectItem value="365">Último ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Valor em Aberto</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  R$ {(totalOutstanding / 1000).toFixed(1)}k
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Casos Abertos</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{totalIssues}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Taxa de Recuperação</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{recoveryRate}%</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <Target className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Casos Resolvidos</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{resolvedIssues}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Média Dias Atraso</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{avgDaysOverdue}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg">Visão Geral</TabsTrigger>
          <TabsTrigger value="aging" className="rounded-lg">Aging</TabsTrigger>
          <TabsTrigger value="performance" className="rounded-lg">Performance</TabsTrigger>
          <TabsTrigger value="strategies" className="rounded-lg">Estratégias</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Status dos Casos */}
            <Card className="rounded-xl border-slate-100">
              <CardHeader>
                <CardTitle className="text-sm">Casos por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartPieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Tipos de Problemas */}
            <Card className="rounded-xl border-slate-100">
              <CardHeader>
                <CardTitle className="text-sm">Tipos de Problemas</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={typeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recuperação Diária */}
          <Card className="rounded-xl border-slate-100">
            <CardHeader>
              <CardTitle className="text-sm">Recuperação nos Últimos 30 Dias</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyRecovery}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="recuperado" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Valor (R$ mil)"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="casos" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Casos Resolvidos"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aging" className="space-y-4">
          <Card className="rounded-xl border-slate-100">
            <CardHeader>
              <CardTitle className="text-sm">Aging - Valor em Aberto por Faixa de Atraso</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={agingData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="bucket" type="category" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip formatter={(value) => `R$ ${value.toFixed(1)}k`} />
                  <Bar dataKey="amount" fill="#ef4444" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(agingBuckets).map(([bucket, amount]) => (
              <Card key={bucket} className="rounded-xl border-slate-100">
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-500">{bucket}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    R$ {(amount / 1000).toFixed(1)}k
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {((amount / totalOutstanding) * 100).toFixed(1)}% do total
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card className="rounded-xl border-slate-100">
            <CardHeader>
              <CardTitle className="text-sm">Top 10 Cobradores - Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={userPerformanceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="user" type="category" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="taxa" fill="#10b981" name="Taxa Recuperação (%)" radius={[0, 8, 8, 0]} />
                  <Bar dataKey="recuperado" fill="#3b82f6" name="Valor (R$ mil)" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {userPerformanceData.slice(0, 6).map((user, idx) => (
              <Card key={idx} className="rounded-xl border-slate-100">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-700">{idx + 1}</span>
                      </div>
                      <span className="font-semibold text-sm">{user.user}</span>
                    </div>
                    <span className="text-lg font-bold text-emerald-600">{user.taxa}%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="text-slate-500">Casos</p>
                      <p className="font-semibold text-slate-900">{user.casos}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="text-slate-500">Recuperado</p>
                      <p className="font-semibold text-emerald-600">R$ {user.recuperado.toFixed(1)}k</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="strategies" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="rounded-xl border-slate-100">
              <CardHeader>
                <CardTitle className="text-sm">Estratégias Utilizadas</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartPieChart>
                    <Pie
                      data={strategyData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {strategyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-slate-100">
              <CardHeader>
                <CardTitle className="text-sm">Efetividade por Estratégia</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(strategiesUsed).map(([strategy, count]) => {
                  const resolved = filteredIssues.filter(
                    i => i.collection_strategy === strategy && i.status === "resolved"
                  ).length;
                  const rate = ((resolved / count) * 100).toFixed(1);
                  return (
                    <div key={strategy} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-700">{strategy.replace("_", " ")}</span>
                        <span className="font-semibold text-emerald-600">{rate}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all"
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500">{resolved}/{count} casos resolvidos</p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}