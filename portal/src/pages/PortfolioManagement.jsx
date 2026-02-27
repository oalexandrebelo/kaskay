import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  DollarSign,
  Users,
  FileText,
  Calendar,
  Download,
  Eye,
  Search,
  Filter
} from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import moment from "moment";

const statusConfig = {
  draft: { label: "Rascunho", color: "bg-slate-100 text-slate-700", icon: FileText },
  awaiting_documents: { label: "Aguardando Documentos", color: "bg-amber-100 text-amber-700", icon: Clock },
  under_analysis: { label: "Em Análise", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  margin_check: { label: "Verificando Margem", color: "bg-blue-100 text-blue-700", icon: Clock },
  margin_approved: { label: "Margem Aprovada", color: "bg-teal-100 text-teal-700", icon: CheckCircle2 },
  margin_rejected: { label: "Margem Rejeitada", color: "bg-red-100 text-red-700", icon: AlertCircle },
  ccb_pending: { label: "CCB Pendente", color: "bg-indigo-100 text-indigo-700", icon: Clock },
  ccb_issued: { label: "CCB Emitida", color: "bg-cyan-100 text-cyan-700", icon: FileText },
  signature_pending: { label: "Aguardando Assinatura", color: "bg-purple-100 text-purple-700", icon: Clock },
  signature_completed: { label: "Assinado", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  averbation_pending: { label: "Aguardando Averbação", color: "bg-lime-100 text-lime-700", icon: Clock },
  averbated: { label: "Averbado", color: "bg-blue-100 text-blue-800", icon: CheckCircle2 },
  disbursed: { label: "Desembolsado", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  rejected: { label: "Rejeitado", color: "bg-red-100 text-red-800", icon: AlertCircle },
  cancelled: { label: "Cancelado", color: "bg-gray-100 text-gray-800", icon: AlertCircle },
  expired: { label: "Expirado", color: "bg-slate-100 text-slate-600", icon: AlertCircle },
};

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function PortfolioManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("all");

  // Buscar todas as propostas
  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ["all_proposals"],
    queryFn: () => base44.entities.Proposal.list("-created_date", 5000),
  });

  // Buscar clientes
  const { data: clients = [] } = useQuery({
    queryKey: ["all_clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  // Buscar issues de pagamento
  const { data: paymentIssues = [] } = useQuery({
    queryKey: ["payment_issues"],
    queryFn: () => base44.entities.PaymentIssue.list(),
  });

  // Calcular aging (vencidos por prazo)
  const agingAnalysis = paymentIssues.reduce((acc, issue) => {
    const days = issue.days_overdue || 0;
    const amount = issue.outstanding_amount || 0;
    
    if (days <= 30) {
      acc.days_0_30.count += 1;
      acc.days_0_30.amount += amount;
    } else if (days <= 60) {
      acc.days_31_60.count += 1;
      acc.days_31_60.amount += amount;
    } else if (days <= 90) {
      acc.days_61_90.count += 1;
      acc.days_61_90.amount += amount;
    } else if (days <= 180) {
      acc.days_91_180.count += 1;
      acc.days_91_180.amount += amount;
    } else {
      acc.days_over_180.count += 1;
      acc.days_over_180.amount += amount;
    }
    
    return acc;
  }, {
    days_0_30: { count: 0, amount: 0 },
    days_31_60: { count: 0, amount: 0 },
    days_61_90: { count: 0, amount: 0 },
    days_91_180: { count: 0, amount: 0 },
    days_over_180: { count: 0, amount: 0 }
  });

  const agingChartData = [
    { name: "0-30 dias", value: agingAnalysis.days_0_30.amount, count: agingAnalysis.days_0_30.count },
    { name: "31-60 dias", value: agingAnalysis.days_31_60.amount, count: agingAnalysis.days_31_60.count },
    { name: "61-90 dias", value: agingAnalysis.days_61_90.amount, count: agingAnalysis.days_61_90.count },
    { name: "91-180 dias", value: agingAnalysis.days_91_180.amount, count: agingAnalysis.days_91_180.count },
    { name: "Over 180 dias", value: agingAnalysis.days_over_180.amount, count: agingAnalysis.days_over_180.count }
  ];

  // Buscar logs de auditoria
  const { data: auditLogs = [] } = useQuery({
    queryKey: ["audit_logs"],
    queryFn: () => base44.entities.AuditLog.list("-created_date", 1000),
  });

  // Cálculos da carteira
  const activeProposals = proposals.filter(p => ["disbursed", "averbated"].includes(p.status));
  const totalPortfolio = activeProposals.reduce((sum, p) => sum + (p.approved_amount || 0), 0);
  const totalDisbursed = proposals.filter(p => p.status === "disbursed").reduce((sum, p) => sum + (p.approved_amount || 0), 0);
  const defaultAmount = paymentIssues.reduce((sum, issue) => sum + (issue.outstanding_amount || 0), 0);
  const defaultRate = totalPortfolio > 0 ? (defaultAmount / totalPortfolio) * 100 : 0;

  // Carteira por mês
  const portfolioByMonth = proposals
    .filter(p => p.created_date)
    .reduce((acc, p) => {
      const month = moment(p.created_date).format("YYYY-MM");
      if (!acc[month]) {
        acc[month] = { month, amount: 0, count: 0 };
      }
      if (["disbursed", "averbated"].includes(p.status)) {
        acc[month].amount += p.approved_amount || 0;
        acc[month].count += 1;
      }
      return acc;
    }, {});

  const monthlyData = Object.values(portfolioByMonth)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12);

  // Status distribution
  const statusDistribution = proposals.reduce((acc, p) => {
    const status = p.status || "unknown";
    if (!acc[status]) {
      acc[status] = { name: statusConfig[status]?.label || status, value: 0 };
    }
    acc[status].value += 1;
    return acc;
  }, {});

  const statusData = Object.values(statusDistribution);

  // Filtrar propostas
  const filteredProposals = proposals.filter(p => {
    const matchesSearch = !searchTerm || 
      p.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.client_cpf?.includes(searchTerm) ||
      p.proposal_number?.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    
    const matchesMonth = selectedMonth === "all" || 
      moment(p.created_date).format("YYYY-MM") === selectedMonth;
    
    return matchesSearch && matchesStatus && matchesMonth;
  });

  // Histórico completo do cliente
  const getClientHistory = (clientCpf) => {
    const clientProposals = proposals.filter(p => p.client_cpf === clientCpf);
    const clientLogs = auditLogs.filter(log => 
      clientProposals.some(p => p.id === log.entity_id)
    );
    const clientIssues = paymentIssues.filter(issue => issue.client_cpf === clientCpf);

    return {
      proposals: clientProposals,
      logs: clientLogs,
      issues: clientIssues,
      totalAmount: clientProposals.reduce((sum, p) => sum + (p.approved_amount || 0), 0),
      totalOperations: clientProposals.length,
    };
  };

  const openClientDetail = (clientCpf) => {
    const client = clients.find(c => c.cpf === clientCpf);
    const history = getClientHistory(clientCpf);
    setSelectedClient({ ...client, ...history });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-500">Carregando carteira...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Gestão de Carteira & Originação</h1>
        <p className="text-slate-500 mt-1">Visão completa do portfolio, inadimplência e histórico</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="aging">Inadimplência</TabsTrigger>
          <TabsTrigger value="evolution">Evolução</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Carteira Total</CardTitle>
                <Wallet className="w-4 h-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  {totalPortfolio.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </div>
                <p className="text-xs text-slate-500 mt-1">{activeProposals.length} contratos ativos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Desembolsado</CardTitle>
                <DollarSign className="w-4 h-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  {totalDisbursed.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {proposals.filter(p => p.status === "disbursed").length} operações
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Inadimplência</CardTitle>
                <AlertCircle className="w-4 h-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  {defaultAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </div>
                <p className="text-xs text-red-600 mt-1">{defaultRate.toFixed(2)}% da carteira</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Clientes Únicos</CardTitle>
                <Users className="w-4 h-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  {new Set(proposals.map(p => p.client_cpf)).size}
                </div>
                <p className="text-xs text-slate-500 mt-1">Na base</p>
              </CardContent>
            </Card>
          </div>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aging" className="space-y-6">
          {/* Aging Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <CardContent className="pt-6">
                <div className="text-xs text-yellow-700 font-medium mb-2">0-30 dias</div>
                <div className="text-2xl font-bold text-yellow-900">
                  {agingAnalysis.days_0_30.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </div>
                <div className="text-xs text-yellow-600 mt-1">{agingAnalysis.days_0_30.count} casos</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="pt-6">
                <div className="text-xs text-orange-700 font-medium mb-2">31-60 dias</div>
                <div className="text-2xl font-bold text-orange-900">
                  {agingAnalysis.days_31_60.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </div>
                <div className="text-xs text-orange-600 mt-1">{agingAnalysis.days_31_60.count} casos</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="pt-6">
                <div className="text-xs text-red-700 font-medium mb-2">61-90 dias</div>
                <div className="text-2xl font-bold text-red-900">
                  {agingAnalysis.days_61_90.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </div>
                <div className="text-xs text-red-600 mt-1">{agingAnalysis.days_61_90.count} casos</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-red-100 to-red-200 border-red-300">
              <CardContent className="pt-6">
                <div className="text-xs text-red-800 font-medium mb-2">91-180 dias</div>
                <div className="text-2xl font-bold text-red-950">
                  {agingAnalysis.days_91_180.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </div>
                <div className="text-xs text-red-700 mt-1">{agingAnalysis.days_91_180.count} casos</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-slate-100 to-slate-200 border-slate-300">
              <CardContent className="pt-6">
                <div className="text-xs text-slate-800 font-medium mb-2">Acima 180 dias</div>
                <div className="text-2xl font-bold text-slate-950">
                  {agingAnalysis.days_over_180.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </div>
                <div className="text-xs text-slate-700 mt-1">{agingAnalysis.days_over_180.count} casos</div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Gráfico de Inadimplência</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={agingChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  />
                  <Bar dataKey="value" name="Valor" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evolution" className="space-y-6">

          <Card>
            <CardHeader>
              <CardTitle>Evolução da Carteira (12 meses)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="amount" name="Valor" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Filtros e Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Propostas</CardTitle>
          <div className="flex gap-3 mt-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por cliente, CPF ou número da proposta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Meses</SelectItem>
                {monthlyData.map(m => (
                  <SelectItem key={m.month} value={m.month}>
                    {moment(m.month).format("MMM/YYYY")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Cliente</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">CPF</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Proposta</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Valor</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Data</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredProposals.map(proposal => {
                  const config = statusConfig[proposal.status] || {};
                  const StatusIcon = config.icon;
                  return (
                    <tr key={proposal.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <button
                          onClick={() => openClientDetail(proposal.client_cpf)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {proposal.client_name}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">{proposal.client_cpf}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{proposal.proposal_number || "-"}</td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">
                        {(proposal.approved_amount || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {moment(proposal.created_date).format("DD/MM/YYYY")}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={config.color}>
                          {StatusIcon && <StatusIcon className="w-3 h-3 mr-1" />}
                          {config.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredProposals.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                Nenhuma proposta encontrada
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Histórico do Cliente */}
      <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico Completo - {selectedClient?.full_name}</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-6">
              {/* Resumo */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-slate-900">
                      {selectedClient.totalOperations}
                    </div>
                    <div className="text-sm text-slate-500">Operações</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-slate-900">
                      {selectedClient.totalAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </div>
                    <div className="text-sm text-slate-500">Volume Total</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-slate-900">
                      {selectedClient.issues?.length || 0}
                    </div>
                    <div className="text-sm text-slate-500">Issues</div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs com detalhes */}
              <Tabs defaultValue="proposals">
                <TabsList>
                  <TabsTrigger value="proposals">Propostas ({selectedClient.proposals?.length})</TabsTrigger>
                  <TabsTrigger value="logs">Logs ({selectedClient.logs?.length})</TabsTrigger>
                  <TabsTrigger value="issues">Issues ({selectedClient.issues?.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="proposals" className="space-y-3">
                  {selectedClient.proposals?.map(p => (
                    <Card key={p.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-slate-900">{p.proposal_number || "Sem número"}</div>
                            <div className="text-sm text-slate-500 mt-1">
                              {moment(p.created_date).format("DD/MM/YYYY HH:mm")}
                            </div>
                            <div className="text-sm text-slate-600 mt-2">
                              Valor: {(p.approved_amount || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </div>
                            {p.ccb_url && (
                              <Button variant="link" size="sm" className="p-0 h-auto mt-2" asChild>
                                <a href={p.ccb_url} target="_blank" rel="noopener noreferrer">
                                  <FileText className="w-3 h-3 mr-1" /> Ver CCB
                                </a>
                              </Button>
                            )}
                          </div>
                          <Badge className={statusConfig[p.status]?.color}>
                            {statusConfig[p.status]?.label}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="logs" className="space-y-2">
                  {selectedClient.logs?.map(log => (
                    <div key={log.id} className="p-3 bg-slate-50 rounded-lg text-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium text-slate-900">{log.action}</span>
                          {log.details && <span className="text-slate-600 ml-2">{log.details}</span>}
                        </div>
                        <span className="text-xs text-slate-500">
                          {moment(log.created_date).format("DD/MM/YYYY HH:mm")}
                        </span>
                      </div>
                      {log.performed_by && (
                        <div className="text-xs text-slate-500 mt-1">Por: {log.performed_by}</div>
                      )}
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="issues" className="space-y-3">
                  {selectedClient.issues?.map(issue => (
                    <Card key={issue.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-slate-900">{issue.issue_type}</div>
                            <div className="text-sm text-slate-600 mt-1">
                              Valor em aberto: {(issue.outstanding_amount || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              {issue.days_overdue} dias em atraso
                            </div>
                          </div>
                          <Badge className={issue.status === "resolved" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {issue.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {(!selectedClient.issues || selectedClient.issues.length === 0) && (
                    <div className="text-center py-8 text-slate-500">Nenhum issue registrado</div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}