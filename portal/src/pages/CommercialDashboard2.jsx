import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, PieChart as RechartPieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, FileText, CheckCircle2, AlertCircle, Building2,
  Calendar, DollarSign, Users, Target, BarChart3,
} from "lucide-react";
import { createPageUrl } from "@/utils";

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444"];

export default function CommercialDashboard2() {
  const [period, setPeriod] = useState("current_month");
  const [selectedConvenio, setSelectedConvenio] = useState(null);

  const { data: proposals = [] } = useQuery({
    queryKey: ["proposals"],
    queryFn: () => base44.entities.Proposal.list(),
  });

  const { data: convenios = [] } = useQuery({
    queryKey: ["convenios"],
    queryFn: () => base44.entities.ConvenioConfig.list(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  // Calcular KPIs para Produção Comercial
  const proposalsByStatus = {
    analyzing: proposals.filter(p => p.status === "under_analysis").length,
    credentialing: proposals.filter(p => p.status === "signature_pending").length,
    configuring: proposals.filter(p => p.status === "margin_check").length,
  };

  // Originação por convênio
  const originationByConvenio = convenios.reduce((acc, conv) => {
    const convProposals = proposals.filter(p => p.convenio_id === conv.id);
    const total = convProposals.reduce((sum, p) => sum + (p.approved_amount || 0), 0);
    if (total > 0) {
      acc.push({
        name: conv.convenio_name,
        id: conv.id,
        value: total,
        amount: total,
        count: convProposals.length,
      });
    }
    return acc;
  }, []).sort((a, b) => b.value - a.value);

  const totalOrigination = originationByConvenio.reduce((sum, item) => sum + item.value, 0);

  // Gráfico de produção por período
  const productionData = [
    { periodo: "Semana 1", propostas: 12, credenciados: 8 },
    { periodo: "Semana 2", propostas: 18, credenciados: 11 },
    { periodo: "Semana 3", propostas: 15, credenciados: 13 },
    { periodo: "Semana 4", propostas: 22, credenciados: 16 },
  ];

  const handleProposalClick = (status) => {
    // Navegar para propostas com filtro
    window.location.href = createPageUrl(`ProposalsOptimized?status=${status}`);
  };

  const currentMonth = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" }).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Home Comercial</h1>
          <p className="text-slate-500 text-sm mt-1">Dashboard de performance comercial e originação</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-48 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current_month">Este Mês</SelectItem>
            <SelectItem value="last_month">Mês Anterior</SelectItem>
            <SelectItem value="last_3_months">Últimos 3 Meses</SelectItem>
            <SelectItem value="last_6_months">Últimos 6 Meses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="producao" className="space-y-4">
        <TabsList className="bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="tarifas" className="rounded-lg">Tarifas</TabsTrigger>
          <TabsTrigger value="producao" className="rounded-lg">Produção Comercial</TabsTrigger>
          <TabsTrigger value="excecoes" className="rounded-lg">Exceções</TabsTrigger>
        </TabsList>

        {/* PRODUÇÃO COMERCIAL */}
        <TabsContent value="producao" className="space-y-6">
          {/* Header da Seção */}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Produção Comercial</h2>
              <p className="text-sm text-slate-500">{currentMonth}</p>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Propostas em Análise */}
            <Card
              className="rounded-xl border-slate-100 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleProposalClick("under_analysis")}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Propostas em</p>
                    <p className="text-sm text-slate-500 mb-3">Análise</p>
                    <p className="text-4xl font-bold text-blue-600">{proposalsByStatus.analyzing}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <FileText className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="mt-4 w-full text-blue-600 hover:text-blue-700">
                  Ver Detalhes →
                </Button>
              </CardContent>
            </Card>

            {/* Convênios em Credenciamento */}
            <Card
              className="rounded-xl border-slate-100 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleProposalClick("signature_pending")}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Convênios em</p>
                    <p className="text-sm text-slate-500 mb-3">Credenciamento</p>
                    <p className="text-4xl font-bold text-purple-600">{proposalsByStatus.credentialing}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <Building2 className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="mt-4 w-full text-purple-600 hover:text-purple-700">
                  Ver Detalhes →
                </Button>
              </CardContent>
            </Card>

            {/* Credenciamento em Config */}
            <Card
              className="rounded-xl border-slate-100 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleProposalClick("margin_check")}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Credenc. em</p>
                    <p className="text-sm text-slate-500 mb-3">Config.</p>
                    <p className="text-4xl font-bold text-orange-600">{proposalsByStatus.configuring}</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <CheckCircle2 className="w-8 h-8 text-orange-600" />
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="mt-4 w-full text-orange-600 hover:text-orange-700">
                  Ver Detalhes →
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Originação por Convênio */}
          <Card className="rounded-xl border-slate-100">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  Originação do Mês (Por Convênio)
                </CardTitle>
                <p className="text-sm text-slate-500">
                  Total: <span className="font-bold text-slate-900">R$ {(totalOrigination / 1000000).toFixed(2)}M</span>
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {originationByConvenio.map((item, idx) => {
                  const percentage = totalOrigination > 0 ? ((item.value / totalOrigination) * 100).toFixed(1) : 0;
                  return (
                    <div
                      key={item.id}
                      className="p-4 bg-gradient-to-r from-slate-50 to-transparent rounded-lg hover:from-slate-100 transition-colors cursor-pointer border border-slate-100"
                      onClick={() => setSelectedConvenio(item.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-slate-900">{item.name}</p>
                          <p className="text-xs text-slate-500">{item.count} propostas</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-600">R$ {(item.amount / 1000).toFixed(1)}K</p>
                          <p className="text-sm text-slate-500">{percentage}%</p>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full`}
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: COLORS[idx % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de Produção */}
          <Card className="rounded-xl border-slate-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Produção ao Longo do Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={productionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="propostas" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Propostas" />
                  <Bar dataKey="credenciados" fill="#10b981" radius={[8, 8, 0, 0]} name="Credenciados" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TARIFAS */}
        <TabsContent value="tarifas" className="space-y-4">
          <Card className="rounded-xl border-slate-100">
            <CardHeader>
              <CardTitle>Tarifas por Convênio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-slate-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Seção de tarifas em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EXCEÇÕES */}
        <TabsContent value="excecoes" className="space-y-4">
          <Card className="rounded-xl border-slate-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                Exceções Abertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-slate-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma exceção no momento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}