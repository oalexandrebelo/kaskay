import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, Target, FileText, CheckCircle2, Clock, AlertTriangle,
  TrendingUp, Users, Shield, Award, DollarSign, Calendar
} from "lucide-react";
import { 
  BarChart, Bar, PieChart as RechartPieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444"];

export default function ConvenioBI() {
  const [period, setPeriod] = useState("365");
  const [selectedCNPJ, setSelectedCNPJ] = useState("consolidado");

  const { data: companyCredentials = [] } = useQuery({
    queryKey: ["company_credentials"],
    queryFn: () => base44.entities.CompanyCredential.list(),
  });

  const { data: convenios = [] } = useQuery({
    queryKey: ["convenios"],
    queryFn: () => base44.entities.ConvenioConfig.list(),
  });

  // Filtrar convênios por CNPJ se selecionado
  const filteredConvenios = selectedCNPJ === "consolidado" 
    ? convenios 
    : convenios.filter(c => c.cnpj === selectedCNPJ || companyCredentials.find(cc => cc.cnpj === selectedCNPJ)?.convenios_vinculados?.includes(c.id));

  const { data: leads = [] } = useQuery({
    queryKey: ["convenio_prospects"],
    queryFn: () => base44.entities.Lead.filter({ tags: { $contains: "convênio" } }),
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["convenio_documents"],
    queryFn: () => base44.entities.ConvenioDocument.list(),
  });

  // KPIs
  const activeConvenios = filteredConvenios.filter(c => c.is_active).length;
  const totalProspects = leads.length;
  const convertedProspects = leads.filter(l => l.stage === "ganho").length;
  const conversionRate = totalProspects > 0 ? ((convertedProspects / totalProspects) * 100).toFixed(1) : 0;

  // Convênios com decreto válido
  const conveniosWithDecree = filteredConvenios.filter(c => 
    c.decree_number && (!c.decree_expiration || new Date(c.decree_expiration) > new Date())
  ).length;

  // Convênios com credenciamento válido
  const conveniosWithAccreditation = filteredConvenios.filter(c => 
    c.accreditation_term_number && (!c.accreditation_expiration || new Date(c.accreditation_expiration) > new Date())
  ).length;

  // Status da documentação
  const documentationStatus = filteredConvenios.map(c => {
    const hasDecree = c.decree_number && (!c.decree_expiration || new Date(c.decree_expiration) > new Date());
    const hasAccreditation = c.accreditation_term_number && (!c.accreditation_expiration || new Date(c.accreditation_expiration) > new Date());
    
    if (hasDecree && hasAccreditation) return "completo";
    if (hasDecree) return "decreto_ok";
    if (hasAccreditation) return "credenciamento_ok";
    return "pendente";
  });

  const docStatusCounts = documentationStatus.reduce((acc, status) => {
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const docStatusData = Object.entries(docStatusCounts).map(([status, count]) => ({
    name: status === "completo" ? "Completo" : 
          status === "decreto_ok" ? "Só Decreto" : 
          status === "credenciamento_ok" ? "Só Credenciamento" : "Pendente",
    value: count,
  }));

  // Pipeline de prospecção
  const pipelineStages = {
    "prospecção": 0,
    "contato_inicial": 0,
    "reunião_agendada": 0,
    "proposta_enviada": 0,
    "negociação": 0,
    "ganho": 0,
    "perdido": 0,
  };

  leads.forEach(lead => {
    if (pipelineStages[lead.stage] !== undefined) {
      pipelineStages[lead.stage]++;
    }
  });

  const pipelineData = Object.entries(pipelineStages)
    .filter(([stage]) => stage !== "ganho" && stage !== "perdido")
    .map(([stage, count]) => ({
      stage: stage.replace("_", " "),
      quantidade: count,
    }));

  // Por tipo de órgão
  const byEmployerType = filteredConvenios.reduce((acc, c) => {
    const type = c.employer_type || "outros";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const employerTypeData = Object.entries(byEmployerType).map(([type, count]) => ({
    name: type,
    value: count,
  }));

  // Gestoras de margem
  const marginManagers = filteredConvenios.reduce((acc, c) => {
    if (!c.margin_manager) return acc;
    if (!acc[c.margin_manager]) {
      acc[c.margin_manager] = { count: 0, fee: c.margin_manager_fee_percentage || 0 };
    }
    acc[c.margin_manager].count++;
    return acc;
  }, {});

  const marginManagerData = Object.entries(marginManagers).map(([manager, data]) => ({
    gestor: manager,
    convenios: data.count,
    taxa_media: data.fee,
  }));

  // SCDs Parceiras
  const scdPartners = filteredConvenios.reduce((acc, c) => {
    const partner = c.scd_partner || "Não definido";
    acc[partner] = (acc[partner] || 0) + 1;
    return acc;
  }, {});

  const scdData = Object.entries(scdPartners).map(([partner, count]) => ({
    name: partner,
    value: count,
  }));

  // Timeline de ativação (últimos 12 meses)
  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - i));
    return date.toISOString().slice(0, 7); // YYYY-MM
  });

  const activationTimeline = last12Months.map(month => {
    const activated = filteredConvenios.filter(c => 
      c.created_date && c.created_date.startsWith(month) && c.is_active
    ).length;
    return {
      mes: new Date(month).toLocaleDateString('pt-BR', { month: 'short' }),
      ativados: activated,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">BI de Convênios</h1>
          <p className="text-slate-500 text-sm mt-1">
            Análise completa do pipeline, documentação e performance de convênios
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedCNPJ} onValueChange={setSelectedCNPJ}>
            <SelectTrigger className="w-56 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="consolidado">Consolidado (Todos os CNPJs)</SelectItem>
              {companyCredentials.map(cc => (
                <SelectItem key={cc.id} value={cc.cnpj}>
                  {cc.razao_social} ({cc.cnpj})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-48 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="180">Últimos 6 meses</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Convênios Ativos</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{activeConvenios}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Em Prospecção</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{totalProspects}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Com Decreto</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{conveniosWithDecree}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Credenciados</p>
                <p className="text-2xl font-bold text-indigo-600 mt-1">{conveniosWithAccreditation}</p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-lg">
                <Award className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Taxa Conversão</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{conversionRate}%</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg">Visão Geral</TabsTrigger>
          <TabsTrigger value="pipeline" className="rounded-lg">Pipeline</TabsTrigger>
          <TabsTrigger value="documentation" className="rounded-lg">Documentação</TabsTrigger>
          <TabsTrigger value="partners" className="rounded-lg">Parceiros</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Por Tipo de Órgão */}
            <Card className="rounded-xl border-slate-100">
              <CardHeader>
                <CardTitle className="text-sm">Convênios por Tipo de Órgão</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartPieChart>
                    <Pie
                      data={employerTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {employerTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status da Documentação */}
            <Card className="rounded-xl border-slate-100">
              <CardHeader>
                <CardTitle className="text-sm">Status da Documentação</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartPieChart>
                    <Pie
                      data={docStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {docStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Timeline de Ativação */}
          <Card className="rounded-xl border-slate-100">
            <CardHeader>
              <CardTitle className="text-sm">Ativações nos Últimos 12 Meses</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={activationTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="ativados" stroke="#10b981" strokeWidth={2} name="Ativados" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-4">
          <Card className="rounded-xl border-slate-100">
            <CardHeader>
              <CardTitle className="text-sm">Pipeline de Prospecção</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={pipelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="quantidade" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Detalhamento por Estágio */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(pipelineStages).filter(([stage]) => stage !== "ganho" && stage !== "perdido").map(([stage, count]) => (
              <Card key={stage} className="rounded-xl border-slate-100">
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-500 capitalize">{stage.replace("_", " ")}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{count}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {totalProspects > 0 ? ((count / totalProspects) * 100).toFixed(1) : 0}% do total
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="documentation" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="rounded-xl border-slate-100">
              <CardContent className="pt-6">
                <p className="text-sm text-slate-500">Documentação Completa</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{docStatusCounts.completo || 0}</p>
                <p className="text-xs text-slate-400 mt-1">Decreto + Credenciamento</p>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-slate-100">
              <CardContent className="pt-6">
                <p className="text-sm text-slate-500">Documentação Parcial</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  {(docStatusCounts.decreto_ok || 0) + (docStatusCounts.credenciamento_ok || 0)}
                </p>
                <p className="text-xs text-slate-400 mt-1">Falta decreto ou credenciamento</p>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-slate-100">
              <CardContent className="pt-6">
                <p className="text-sm text-slate-500">Documentação Pendente</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{docStatusCounts.pendente || 0}</p>
                <p className="text-xs text-slate-400 mt-1">Sem decreto nem credenciamento</p>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Pendências */}
          <Card className="rounded-xl border-slate-100">
            <CardHeader>
              <CardTitle className="text-sm">Convênios com Documentação Pendente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredConvenios.filter(c => {
                  const hasDecree = c.decree_number && (!c.decree_expiration || new Date(c.decree_expiration) > new Date());
                  const hasAccreditation = c.accreditation_term_number && (!c.accreditation_expiration || new Date(c.accreditation_expiration) > new Date());
                  return !hasDecree || !hasAccreditation;
                }).map(c => {
                  const hasDecree = c.decree_number && (!c.decree_expiration || new Date(c.decree_expiration) > new Date());
                  const hasAccreditation = c.accreditation_term_number && (!c.accreditation_expiration || new Date(c.accreditation_expiration) > new Date());
                  
                  return (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{c.convenio_name}</p>
                          <p className="text-xs text-slate-500">{c.employer_type}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!hasDecree && (
                          <Badge className="bg-red-100 text-red-700 text-xs">Sem Decreto</Badge>
                        )}
                        {!hasAccreditation && (
                          <Badge className="bg-amber-100 text-amber-700 text-xs">Sem Credenciamento</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partners" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Gestoras de Margem */}
            <Card className="rounded-xl border-slate-100">
              <CardHeader>
                <CardTitle className="text-sm">Gestoras de Margem</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {marginManagerData.map((manager, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{manager.gestor}</p>
                        <p className="text-xs text-slate-500">{manager.convenios} convênios</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-blue-600">{manager.taxa_media}%</p>
                        <p className="text-xs text-slate-500">taxa média</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* SCDs Parceiras */}
            <Card className="rounded-xl border-slate-100">
              <CardHeader>
                <CardTitle className="text-sm">SCDs Parceiras</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartPieChart>
                    <Pie
                      data={scdData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {scdData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}