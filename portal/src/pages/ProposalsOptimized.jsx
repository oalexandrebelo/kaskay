import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Search, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import VirtualizedTable from "@/components/common/VirtualizedTable";
import { format } from "date-fns";

const statusColors = {
  draft: "bg-slate-100 text-slate-700",
  awaiting_documents: "bg-amber-100 text-amber-700",
  under_analysis: "bg-blue-100 text-blue-700",
  margin_check: "bg-violet-100 text-violet-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  disbursed: "bg-green-100 text-green-700",
};

const channelIcons = {
  whatsapp: "💬",
  web: "🌐",
  app: "📱",
  presencial: "🏢",
};

export default function ProposalsOptimized() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");

  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ["proposals"],
    queryFn: () => base44.entities.Proposal.list("-created_date", 1000),
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
  });

  // Definir colunas da tabela
  const columns = useMemo(() => [
    {
      header: "Proposta",
      accessor: (row) => row.proposal_number,
      render: (row) => (
        <Link
          to={createPageUrl("ProposalDetail") + `?id=${row.id}`}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          {row.proposal_number || `#${row.id.slice(0, 8)}`}
        </Link>
      ),
    },
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
      header: "Valor",
      accessor: (row) => row.requested_amount,
      render: (row) => (
        <span className="font-semibold text-slate-900">
          R$ {row.requested_amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
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
    {
      header: "Canal",
      accessor: (row) => row.channel,
      render: (row) => (
        <span className="text-sm">
          {channelIcons[row.channel] || '📄'} {row.channel || 'web'}
        </span>
      ),
    },
    {
      header: "Data",
      accessor: (row) => row.created_date,
      render: (row) => (
        <span className="text-sm text-slate-600">
          {row.created_date ? format(new Date(row.created_date), 'dd/MM/yyyy') : '—'}
        </span>
      ),
    },
  ], []);

  // Função de filtro customizada
  const filterFn = useMemo(() => {
    return (row) => {
      const statusMatch = statusFilter === "all" || row.status === statusFilter;
      const channelMatch = channelFilter === "all" || row.channel === channelFilter;
      return statusMatch && channelMatch;
    };
  }, [statusFilter, channelFilter]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Propostas</h1>
          <p className="text-slate-500 text-sm mt-1">
            Gestão otimizada de propostas com paginação server-side
          </p>
        </div>
        <Link to={createPageUrl("NewProposal")}>
          <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl">
            <Plus className="w-4 h-4 mr-2" />
            Nova Proposta
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[250px]">
          <label className="text-xs font-medium text-slate-600 mb-2 block">Buscar</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Cliente, CPF, número da proposta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>
        </div>

        <div className="w-48">
          <label className="text-xs font-medium text-slate-600 mb-2 block">Status</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="awaiting_documents">Aguardando Docs</SelectItem>
              <SelectItem value="under_analysis">Em Análise</SelectItem>
              <SelectItem value="approved">Aprovado</SelectItem>
              <SelectItem value="rejected">Rejeitado</SelectItem>
              <SelectItem value="disbursed">Desembolsado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-48">
          <label className="text-xs font-medium text-slate-600 mb-2 block">Canal</label>
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="web">Web</SelectItem>
              <SelectItem value="app">App</SelectItem>
              <SelectItem value="presencial">Presencial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" className="rounded-xl">
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Tabela com Paginação */}
      <VirtualizedTable
        data={proposals}
        columns={columns}
        pageSize={50}
        searchTerm={searchTerm}
        filterFn={filterFn}
      />
    </div>
  );
}