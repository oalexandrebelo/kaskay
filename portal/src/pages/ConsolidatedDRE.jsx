import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, DollarSign, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ConsolidatedDRE() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [dre, setDre] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch revenues, expenses, and taxes
  const { data: revenues = [] } = useQuery({
    queryKey: ["revenues"],
    queryFn: () => base44.entities.Revenue.list(),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => base44.entities.Expense.list(),
  });

  const { data: taxes = [] } = useQuery({
    queryKey: ["taxes"],
    queryFn: () => base44.entities.Tax.list(),
  });

  // Calculate DRE when data changes
  useEffect(() => {
    const calculateDRE = () => {
      const [year, month] = selectedMonth.split("-");
      const referenceMonth = `${year}-${month}-01`;

      // Filter by reference month
      const monthRevenues = revenues.filter(r => r.reference_month?.startsWith(selectedMonth));
      const monthExpenses = expenses.filter(e => e.reference_month?.startsWith(selectedMonth));
      const monthTaxes = taxes.filter(t => t.reference_month?.startsWith(selectedMonth));

      // Calculate revenue
      const grossRevenue = monthRevenues.reduce((sum, r) => sum + (r.amount || 0), 0);
      const taxOnRevenue = monthRevenues.reduce((sum, r) => sum + (r.tax_amount || 0), 0);
      const netRevenue = grossRevenue - taxOnRevenue;

      // Group expenses by category
      const operationalExpenses = monthExpenses
        .filter(e => e.category === "operacional")
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      const administrativeExpenses = monthExpenses
        .filter(e => e.category === "administrativa")
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      const commercialExpenses = monthExpenses
        .filter(e => e.category === "comercial")
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      const technologyExpenses = monthExpenses
        .filter(e => e.category === "tecnologia")
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      const complianceExpenses = monthExpenses
        .filter(e => e.category === "compliance")
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      const totalOperatingExpenses =
        operationalExpenses +
        administrativeExpenses +
        commercialExpenses +
        technologyExpenses +
        complianceExpenses;

      // Calculate EBIT
      const ebit = netRevenue - totalOperatingExpenses;

      // Calculate taxes
      const irpj = monthTaxes
        .filter(t => t.tax_type === "irpj")
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const csll = monthTaxes
        .filter(t => t.tax_type === "csll")
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const otherTaxes = monthTaxes
        .filter(t => !["irpj", "csll"].includes(t.tax_type))
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const totalTaxes = irpj + csll + otherTaxes;

      // Calculate net income
      const netIncome = ebit - totalTaxes;

      setDre({
        grossRevenue,
        taxOnRevenue,
        netRevenue,
        operationalExpenses,
        administrativeExpenses,
        commercialExpenses,
        technologyExpenses,
        complianceExpenses,
        totalOperatingExpenses,
        ebit,
        irpj,
        csll,
        otherTaxes,
        totalTaxes,
        netIncome,
        margins: {
          grossMargin: grossRevenue > 0 ? ((netRevenue / grossRevenue) * 100).toFixed(2) : 0,
          operatingMargin: netRevenue > 0 ? ((ebit / netRevenue) * 100).toFixed(2) : 0,
          netMargin: netRevenue > 0 ? ((netIncome / netRevenue) * 100).toFixed(2) : 0,
        },
      });
      setLoading(false);
    };

    calculateDRE();
  }, [selectedMonth, revenues, expenses, taxes]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-32" />
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const DRERow = ({ label, value, highlight = false, indent = false, margin = null }) => (
    <div
      className={`grid grid-cols-3 gap-4 py-3 px-4 border-b border-slate-100 ${
        highlight ? "bg-blue-50 font-semibold text-blue-900" : indent ? "ml-8 text-slate-600" : ""
      }`}
    >
      <div className="col-span-2">{label}</div>
      <div className="text-right font-medium">
        {formatCurrency(value)}
        {margin !== null && (
          <span className="text-xs ml-2 text-slate-600">
            ({margin}%)
          </span>
        )}
      </div>
    </div>
  );

  const VarianceIndicator = ({ value }) => {
    if (value > 0) {
      return (
        <div className="flex items-center gap-1 text-emerald-600">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-medium">{value > 0 ? "+" : ""}{formatCurrency(value)}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-red-600">
        <TrendingDown className="w-4 h-4" />
        <span className="text-sm font-medium">{formatCurrency(value)}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">DRE Consolidada</h1>
          <p className="text-slate-500 text-sm mt-1">Demonstração de Resultado do Exercício - Visão Contábil</p>
        </div>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[...Array(12)].map((_, i) => {
              const date = new Date();
              date.setMonth(date.getMonth() - i);
              const value = date.toISOString().slice(0, 7);
              return (
                <SelectItem key={value} value={value}>
                  {new Date(date).toLocaleDateString("pt-BR", {
                    month: "long",
                    year: "numeric",
                  })}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* KPI Cards */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Receita Bruta</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {formatCurrency(dre?.grossRevenue || 0)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Receita Líquida</p>
                <p className="text-2xl font-bold text-emerald-900 mt-1">
                  {formatCurrency(dre?.netRevenue || 0)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-50 to-violet-100 border-violet-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">EBIT (Lucro Operacional)</p>
                <p className="text-2xl font-bold text-violet-900 mt-1">
                  {formatCurrency(dre?.ebit || 0)}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Margem: {dre?.margins.operatingMargin}%
                </p>
              </div>
              <Target className="w-8 h-8 text-violet-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`bg-gradient-to-br ${
            (dre?.netIncome || 0) >= 0
              ? "from-green-50 to-green-100 border-green-200"
              : "from-red-50 to-red-100 border-red-200"
          }`}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Lucro Líquido</p>
                <p
                  className={`text-2xl font-bold mt-1 ${
                    (dre?.netIncome || 0) >= 0 ? "text-green-900" : "text-red-900"
                  }`}
                >
                  {formatCurrency(dre?.netIncome || 0)}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Margem: {dre?.margins.netMargin}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DRE Statement */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-t-xl">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Demonstração de Resultado - {selectedMonth}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* RECEITAS */}
          <div className="bg-slate-50 p-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">1. Receitas</h3>
          </div>
          <DRERow label="Receita Bruta de Operações" value={dre?.grossRevenue || 0} indent />
          <DRERow label="(-) Impostos sobre Receita" value={-(dre?.taxOnRevenue || 0)} indent />
          <DRERow label="Receita Líquida" value={dre?.netRevenue || 0} highlight />

          {/* DESPESAS OPERACIONAIS */}
          <div className="bg-slate-50 p-4 mt-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">2. Despesas Operacionais</h3>
          </div>
          <DRERow label="(-) Despesas Operacionais" value={-(dre?.operationalExpenses || 0)} indent />
          <DRERow label="(-) Despesas Administrativas" value={-(dre?.administrativeExpenses || 0)} indent />
          <DRERow label="(-) Despesas Comerciais" value={-(dre?.commercialExpenses || 0)} indent />
          <DRERow label="(-) Despesas de Tecnologia" value={-(dre?.technologyExpenses || 0)} indent />
          <DRERow label="(-) Despesas de Compliance" value={-(dre?.complianceExpenses || 0)} indent />
          <DRERow
            label="Total de Despesas Operacionais"
            value={-(dre?.totalOperatingExpenses || 0)}
            highlight
          />

          {/* EBIT */}
          <div className="bg-blue-50 p-4 my-2">
            <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide">3. Resultado Operacional</h3>
          </div>
          <DRERow
            label="EBIT (Lucro antes de Juros e Impostos)"
            value={dre?.ebit || 0}
            highlight
            margin={dre?.margins.operatingMargin}
          />

          {/* IMPOSTOS */}
          <div className="bg-slate-50 p-4 mt-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">4. Imposto de Renda</h3>
          </div>
          <DRERow label="(-) IRPJ" value={-(dre?.irpj || 0)} indent />
          <DRERow label="(-) CSLL" value={-(dre?.csll || 0)} indent />
          <DRERow label="(-) Outros Impostos" value={-(dre?.otherTaxes || 0)} indent />
          <DRERow label="(-) Total de Impostos" value={-(dre?.totalTaxes || 0)} highlight />

          {/* LUCRO LÍQUIDO */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 border-t-2 border-green-200">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <h3 className="text-base font-bold text-green-900">Lucro Líquido do Período</h3>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(dre?.netIncome || 0)}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Margem Líquida: {dre?.margins.netMargin}%
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Composição de Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "Operacional", value: dre?.operationalExpenses || 0, color: "bg-blue-500" },
                { label: "Administrativa", value: dre?.administrativeExpenses || 0, color: "bg-purple-500" },
                { label: "Comercial", value: dre?.commercialExpenses || 0, color: "bg-orange-500" },
                { label: "Tecnologia", value: dre?.technologyExpenses || 0, color: "bg-cyan-500" },
                { label: "Compliance", value: dre?.complianceExpenses || 0, color: "bg-red-500" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700">{item.label}</span>
                    <span className="font-medium text-slate-900">{formatCurrency(item.value)}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${item.color}`}
                      style={{
                        width: `${
                          dre?.totalOperatingExpenses > 0
                            ? ((item.value / dre.totalOperatingExpenses) * 100).toFixed(0)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Indicadores Financeiros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-slate-700">Margem Bruta</span>
                <Badge className="bg-blue-600">{dre?.margins.grossMargin}%</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-violet-50 rounded-lg">
                <span className="text-sm text-slate-700">Margem Operacional</span>
                <Badge className="bg-violet-600">{dre?.margins.operatingMargin}%</Badge>
              </div>
              <div
                className={`flex items-center justify-between p-3 rounded-lg ${
                  (dre?.netIncome || 0) >= 0 ? "bg-green-50" : "bg-red-50"
                }`}
              >
                <span className="text-sm text-slate-700">Margem Líquida</span>
                <Badge className={(dre?.netIncome || 0) >= 0 ? "bg-green-600" : "bg-red-600"}>
                  {dre?.margins.netMargin}%
                </Badge>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-3">Resumo Período</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Receita Líquida:</span>
                    <span className="font-semibold">{formatCurrency(dre?.netRevenue || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Despesas Totais:</span>
                    <span className="font-semibold">{formatCurrency(dre?.totalOperatingExpenses || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Impostos Totais:</span>
                    <span className="font-semibold">{formatCurrency(dre?.totalTaxes || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}