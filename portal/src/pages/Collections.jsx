import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, DollarSign, TrendingDown, Users, Search, ExternalLink, Phone, FileText } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";

const issueColors = {
  open: "bg-red-100 text-red-700",
  in_collection: "bg-amber-100 text-amber-700",
  negotiating: "bg-blue-100 text-blue-700",
  legal: "bg-purple-100 text-purple-700",
  resolved: "bg-emerald-100 text-emerald-700",
  written_off: "bg-slate-100 text-slate-500",
};

const issueLabels = {
  open: "Aberto",
  in_collection: "Em Cobrança",
  negotiating: "Negociando",
  legal: "Jurídico",
  resolved: "Resolvido",
  written_off: "Baixado",
};

const severityColors = {
  low: "bg-blue-100 text-blue-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

const severityLabels = {
  low: "Baixo",
  medium: "Médio",
  high: "Alto",
  critical: "Crítico",
};

export default function Collections() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  const { data: issues = [], isLoading: loadingIssues } = useQuery({
    queryKey: ["payment_issues"],
    queryFn: () => base44.entities.PaymentIssue.list("-created_date", 500),
  });

  const { data: installments = [], isLoading: loadingInstallments } = useQuery({
    queryKey: ["installments"],
    queryFn: () => base44.entities.Installment.list("-due_date", 500),
  });

  const filtered = useMemo(() => {
    return issues.filter(i => {
      const searchMatch = !search || 
        (i.client_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (i.client_cpf || "").includes(search) ||
        (i.employer || "").toLowerCase().includes(search.toLowerCase());
      const statusMatch = statusFilter === "all" || i.status === statusFilter;
      const severityMatch = severityFilter === "all" || i.severity === severityFilter;
      return searchMatch && statusMatch && severityMatch;
    });
  }, [issues, search, statusFilter, severityFilter]);

  const openIssues = issues.filter(i => i.status === "open");
  const inCollection = issues.filter(i => i.status === "in_collection");
  const totalOutstanding = issues.reduce((sum, i) => sum + (i.outstanding_amount || 0), 0);
  const overdueInstallments = installments.filter(i => i.status === "overdue" || i.status === "defaulted");

  const isLoading = loadingIssues || loadingInstallments;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestão de Cobranças</h1>
        <p className="text-slate-500 text-sm mt-1">Controle de inadimplência e pagamentos parciais</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-2xl border-slate-100">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-50">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Casos Abertos</p>
                  <p className="text-2xl font-bold text-slate-900">{openIssues.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-100">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-50">
                  <Phone className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Em Cobrança</p>
                  <p className="text-2xl font-bold text-slate-900">{inCollection.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-100">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-orange-50">
                  <TrendingDown className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Parcelas Atrasadas</p>
                  <p className="text-2xl font-bold text-slate-900">{overdueInstallments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-100">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-50">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Valor em Aberto</p>
                  <p className="text-2xl font-bold text-slate-900">
                    R$ {(totalOutstanding / 1000).toFixed(0)}k
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por cliente, CPF ou órgão..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-white border-slate-200 rounded-xl"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 bg-white border-slate-200 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
           <SelectItem value="all">Todos os Status</SelectItem>
           <SelectItem value="open">Aberto</SelectItem>
           <SelectItem value="in_collection">Em Cobrança</SelectItem>
           <SelectItem value="negotiating">Negociando</SelectItem>
           <SelectItem value="legal">Jurídico</SelectItem>
           <SelectItem value="resolved">Resolvido</SelectItem>
           <SelectItem value="written_off">Baixado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-40 bg-white border-slate-200 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
           <SelectItem value="all">Todas Prioridades</SelectItem>
           <SelectItem value="critical">Crítico</SelectItem>
           <SelectItem value="high">Alto</SelectItem>
           <SelectItem value="medium">Médio</SelectItem>
           <SelectItem value="low">Baixo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Órgão</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo do Problema</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Valor em Aberto</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dias Atraso</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Prioridade</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-400">Nenhum caso de cobrança encontrado</p>
                  </TableCell>
                </TableRow>
              )}
              {filtered.map(issue => (
                <TableRow key={issue.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{issue.client_name || "—"}</p>
                      <p className="text-xs text-slate-400">{issue.client_cpf}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">{issue.employer || "—"}</TableCell>
                  <TableCell>
                    <span className="text-xs text-slate-600 capitalize">
                      {issue.issue_type?.replace(/_/g, " ")}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm font-semibold text-red-600">
                    R$ {(issue.outstanding_amount || 0).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <span className={`text-sm font-semibold ${
                      (issue.days_overdue || 0) > 30 ? "text-red-600" :
                      (issue.days_overdue || 0) > 15 ? "text-orange-600" : "text-amber-600"
                    }`}>
                      {issue.days_overdue || 0} dias
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${severityColors[issue.severity] || "bg-slate-100 text-slate-600"} border-0 text-[10px] font-semibold`}>
                       {severityLabels[issue.severity] || issue.severity}
                     </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${issueColors[issue.status] || "bg-slate-100 text-slate-600"} border-0 text-[10px] font-semibold`}>
                       {issueLabels[issue.status] || issue.status?.replace(/_/g, " ")}
                     </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Link to={createPageUrl("CollectionDetail") + `?id=${issue.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 rounded-lg text-xs">
                          <FileText className="w-3 h-3 mr-1" /> Ver
                        </Button>
                      </Link>
                      {issue.asaas_charge_id && (
                        <Button variant="ghost" size="sm" className="h-7 rounded-lg text-xs text-blue-600">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}