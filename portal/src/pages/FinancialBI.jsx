import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Receipt,
  PiggyBank,
  AlertTriangle,
  Building2,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, subMonths, startOfMonth } from "date-fns";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function FinancialBI() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [periodView, setPeriodView] = useState("6months");

  const { data: revenues = [], isLoading: revenuesLoading } = useQuery({
    queryKey: ["revenues"],
    queryFn: () => base44.entities.Revenue.list("-reference_month", 1000),
  });

  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => base44.entities.Expense.list("-reference_month", 1000),
  });

  const { data: taxes = [], isLoading: taxesLoading } = useQuery({
    queryKey: ["taxes"],
    queryFn: () => base44.entities.Tax.list("-reference_month", 1000),
  });

  const { data: cessions = [] } = useQuery({
    queryKey: ["cessions_bi"],
    queryFn: () => base44.entities.ContractCession.list("-cession_date", 1000),
  });

  // Análises do mês selecionado
  const monthlyAnalysis = useMemo(() => {
    const monthRevenues = revenues.filter(r => r.reference_month?.startsWith(selectedMonth));
    const monthExpenses = expenses.filter(e => e.reference_month?.startsWith(selectedMonth));
    const monthTaxes = taxes.filter(t => t.reference_month?.startsWith(selectedMonth));

    const totalRevenue = monthRevenues.reduce((sum, r) => sum + (r.amount || 0), 0);
    const totalExpenses = monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalTaxes = monthTaxes.reduce((sum, t) => sum + (t.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses - totalTaxes;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Receita por convênio
    const revenueByConvenio = {};
    monthRevenues.forEach(r => {
      const key = r.convenio_name || "Sem Convênio";
      revenueByConvenio[key] = (revenueByConvenio[key] || 0) + (r.amount || 0);
    });

    // Receita por tipo
    const revenueByType = {};
    monthRevenues.forEach(r => {
      const key = r.revenue_type;
      revenueByType[key] = (revenueByType[key] || 0) + (r.amount || 0);
    });

    // Despesas por categoria
    const expensesByCategory = {};
    monthExpenses.forEach(e => {
      const key = e.category;
      expensesByCategory[key] = (expensesByCategory[key] || 0) + (e.amount || 0);
    });

    // Impostos por tipo
    const taxesByType = {};
    monthTaxes.forEach(t => {
      const key = t.tax_type;
      taxesByType[key] = (taxesByType[key] || 0) + (t.amount || 0);
    });

    return {
      totalRevenue,
      totalExpenses,
      totalTaxes,
      netProfit,
      profitMargin,
      revenueByConvenio,
      revenueByType,
      expensesByCategory,
      taxesByType,
    };
  }, [revenues, expenses, taxes, selectedMonth]);

  // Análise temporal (últimos 6 ou 12 meses)
  const temporalAnalysis = useMemo(() => {
    const monthsCount = periodView === "6months" ? 6 : 12;
    const data = [];

    for (let i = monthsCount - 1; i >= 0; i--) {
      const month = format(subMonths(new Date(), i), "yyyy-MM");
      const monthName = format(subMonths(new Date(), i), "MMM/yy");

      const monthRevenues = revenues.filter(r => r.reference_month?.startsWith(month));
      const monthExpenses = expenses.filter(e => e.reference_month?.startsWith(month));
      const monthTaxes = taxes.filter(t => t.reference_month?.startsWith(month));

      const revenue = monthRevenues.reduce((sum, r) => sum + (r.amount || 0), 0);
      const expense = monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const tax = monthTaxes.reduce((sum, t) => sum + (t.amount || 0), 0);
      const profit = revenue - expense - tax;

      data.push({
        month: monthName,
        receita: revenue,
        despesas: expense,
        impostos: tax,
        lucro: profit,
      });
    }

    return data;
  }, [revenues, expenses, taxes, periodView]);

  if (revenuesLoading || expensesLoading || taxesLoading) {
    return <Skeleton className="h-96 rounded-2xl" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Business Intelligence - Financeiro</h1>
          <p className="text-slate-500 text-sm mt-1">Análise completa de receitas, despesas, impostos e rentabilidade</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }).map((_, i) => {
                const date = subMonths(new Date(), i);
                const value = format(date, "yyyy-MM");
                const label = format(date, "MMMM 'de' yyyy");
                return <SelectItem key={value} value={value}>{label}</SelectItem>;
              })}
            </SelectContent>
          </Select>
          <Select value={periodView} onValueChange={setPeriodView}>
            <SelectTrigger className="w-40 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6months">Últimos 6 meses</SelectItem>
              <SelectItem value="12months">Últimos 12 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="rounded-2xl border-blue-100 bg-blue-50/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-blue-700 uppercase">Receita Bruta</p>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-900">
              R$ {monthlyAnalysis.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-red-100 bg-red-50/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-red-700 uppercase">Despesas</p>
              <TrendingDown className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-900">
              R$ {monthlyAnalysis.totalExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-orange-100 bg-orange-50/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-orange-700 uppercase">Impostos</p>
              <Receipt className="w-4 h-4 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-orange-900">
              R$ {monthlyAnalysis.totalTaxes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card className={`rounded-2xl ${monthlyAnalysis.netProfit >= 0 ? 'border-emerald-100 bg-emerald-50/30' : 'border-red-100 bg-red-50/30'}`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className={`text-xs font-medium uppercase ${monthlyAnalysis.netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>Lucro Líquido</p>
              <PiggyBank className={`w-4 h-4 ${monthlyAnalysis.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
            </div>
            <p className={`text-2xl font-bold ${monthlyAnalysis.netProfit >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>
              R$ {monthlyAnalysis.netProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-violet-100 bg-violet-50/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-violet-700 uppercase">Margem Lucro</p>
              <BarChart3 className="w-4 h-4 text-violet-600" />
            </div>
            <p className="text-2xl font-bold text-violet-900">
              {monthlyAnalysis.profitMargin.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-slate-100 rounded-xl p-1">
          <TabsTrigger value="overview" className="rounded-lg">Visão Geral</TabsTrigger>
          <TabsTrigger value="revenue" className="rounded-lg">Receitas</TabsTrigger>
          <TabsTrigger value="expenses" className="rounded-lg">Despesas</TabsTrigger>
          <TabsTrigger value="taxes" className="rounded-lg">Impostos</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="rounded-2xl border-slate-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <LineChartIcon className="w-4 h-4 text-blue-600" />
                  Evolução Financeira
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={temporalAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="receita" stroke="#3b82f6" strokeWidth={2} name="Receita" />
                    <Line type="monotone" dataKey="lucro" stroke="#10b981" strokeWidth={2} name="Lucro" />
                    <Line type="monotone" dataKey="despesas" stroke="#ef4444" strokeWidth={2} name="Despesas" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  Comparativo Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={temporalAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    />
                    <Legend />
                    <Bar dataKey="receita" fill="#3b82f6" name="Receita" />
                    <Bar dataKey="despesas" fill="#ef4444" name="Despesas" />
                    <Bar dataKey="impostos" fill="#f59e0b" name="Impostos" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Receitas */}
        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="rounded-2xl border-slate-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-blue-600" />
                  Receita por Convênio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(monthlyAnalysis.revenueByConvenio).map(([name, value], index) => ({
                        name,
                        value,
                        color: COLORS[index % COLORS.length]
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(monthlyAnalysis.revenueByConvenio).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  Ranking de Convênios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(monthlyAnalysis.revenueByConvenio)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([convenio, value], index) => (
                      <div key={convenio} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white`}
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                            {index + 1}
                          </div>
                          <span className="text-sm font-medium text-slate-900">{convenio}</span>
                        </div>
                        <span className="text-sm font-bold text-emerald-700">
                          R$ {value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Despesas */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="rounded-2xl border-slate-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-red-600" />
                  Despesas por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(monthlyAnalysis.expensesByCategory).map(([name, value], index) => ({
                        name,
                        value,
                        color: COLORS[index % COLORS.length]
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(monthlyAnalysis.expensesByCategory).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  Maiores Despesas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(monthlyAnalysis.expensesByCategory)
                    .sort(([, a], [, b]) => b - a)
                    .map(([category, value], index) => (
                      <div key={category} className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                        <span className="text-sm font-medium text-slate-900 capitalize">{category}</span>
                        <span className="text-sm font-bold text-red-700">
                          R$ {value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Impostos */}
        <TabsContent value="taxes" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="rounded-2xl border-slate-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-orange-600" />
                  Impostos por Tipo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(monthlyAnalysis.taxesByType).map(([name, value]) => ({ name: name.toUpperCase(), value }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    />
                    <Bar dataKey="value" fill="#f59e0b" name="Imposto" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  Carga Tributária
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                    <p className="text-xs text-orange-700 mb-2">Carga Tributária Efetiva</p>
                    <p className="text-3xl font-bold text-orange-900">
                      {monthlyAnalysis.totalRevenue > 0 
                        ? ((monthlyAnalysis.totalTaxes / monthlyAnalysis.totalRevenue) * 100).toFixed(1)
                        : 0}%
                    </p>
                    <p className="text-xs text-orange-600 mt-1">
                      sobre a receita bruta
                    </p>
                  </div>

                  <div className="space-y-2">
                    {Object.entries(monthlyAnalysis.taxesByType)
                      .sort(([, a], [, b]) => b - a)
                      .map(([type, value]) => (
                        <div key={type} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                          <span className="text-sm font-medium text-slate-900 uppercase">{type}</span>
                          <span className="text-sm font-bold text-orange-700">
                            R$ {value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}