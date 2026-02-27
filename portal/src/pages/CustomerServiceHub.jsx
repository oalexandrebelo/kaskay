import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Search, 
  User, 
  FileText, 
  DollarSign, 
  Calendar,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Calculator
} from "lucide-react";
import { format } from "date-fns";

export default function CustomerServiceHub() {
  const [cpfSearch, setCpfSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list("-created_date", 1000),
    enabled: true,
  });

  const { data: proposals = [], isLoading: proposalsLoading } = useQuery({
    queryKey: ["client_proposals", selectedClient?.id],
    queryFn: () => base44.entities.Proposal.filter({ client_id: selectedClient.id }),
    enabled: !!selectedClient,
  });

  const { data: installments = [], isLoading: installmentsLoading } = useQuery({
    queryKey: ["client_installments"],
    queryFn: () => base44.entities.Installment.list(),
    enabled: !!selectedClient,
  });

  const handleSearch = () => {
    const cleanCpf = cpfSearch.replace(/\D/g, '');
    const found = clients.find(c => c.cpf === cleanCpf);
    if (found) {
      setSelectedClient(found);
    } else {
      alert('Cliente não encontrado');
    }
  };

  const clientInstallments = selectedClient 
    ? installments.filter(i => i.client_cpf === selectedClient.cpf)
    : [];

  const overdueInstallments = clientInstallments.filter(i => {
    const dueDate = new Date(i.due_date);
    return dueDate < new Date() && i.status !== 'paid';
  });

  const totalBalance = clientInstallments
    .filter(i => i.status === 'pending')
    .reduce((sum, i) => sum + (i.expected_amount || 0), 0);

  if (clientsLoading) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Central de Atendimento</h1>
        <p className="text-slate-500 text-sm mt-1">
          Acesso rápido às informações do cliente
        </p>
      </div>

      {/* Busca de Cliente */}
      <Card className="rounded-2xl">
        <CardContent className="p-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Digite o CPF do cliente..."
                value={cpfSearch}
                onChange={(e) => setCpfSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-11 rounded-xl text-lg h-12"
              />
            </div>
            <Button
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700 rounded-xl h-12 px-8"
            >
              <Search className="w-5 h-5 mr-2" />
              Buscar
            </Button>
            <Link to={createPageUrl("CreditSimulator")}>
              <Button variant="outline" className="rounded-xl h-12 px-8">
                <Calculator className="w-5 h-5 mr-2" />
                Simulador
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Dados do Cliente */}
      {selectedClient && (
        <>
          <Card className="rounded-2xl border-blue-200 bg-blue-50/30">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    {selectedClient.full_name}
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">CPF: {selectedClient.cpf}</p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 border-0">
                  Cliente Ativo
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 bg-white rounded-lg p-3">
                  <Mail className="w-4 h-4 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="text-sm font-medium text-slate-900">{selectedClient.email || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white rounded-lg p-3">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">Telefone</p>
                    <p className="text-sm font-medium text-slate-900">{selectedClient.phone || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white rounded-lg p-3">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">Convênio</p>
                    <p className="text-sm font-medium text-slate-900">{selectedClient.employer || '—'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPIs do Cliente */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-blue-100 bg-blue-50/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-blue-700 uppercase">Propostas</p>
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-blue-900">{proposals.length}</p>
              </CardContent>
            </Card>

            <Card className="border-emerald-100 bg-emerald-50/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-emerald-700 uppercase">Saldo Devedor</p>
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-2xl font-bold text-emerald-900">
                  R$ {(totalBalance / 1000).toFixed(1)}k
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-100 bg-purple-50/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-purple-700 uppercase">Parcelas Pagas</p>
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-purple-900">
                  {clientInstallments.filter(i => i.status === 'paid').length}
                </p>
              </CardContent>
            </Card>

            <Card className={cn(
              "border-red-100",
              overdueInstallments.length > 0 ? "bg-red-50/50" : "bg-slate-50"
            )}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-red-700 uppercase">Vencidas</p>
                  <AlertCircle className="w-4 h-4 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-red-900">
                  {overdueInstallments.length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs de Informações */}
          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <Tabs defaultValue="proposals" className="w-full">
                <TabsList className="grid grid-cols-3 w-full max-w-md">
                  <TabsTrigger value="proposals">Propostas</TabsTrigger>
                  <TabsTrigger value="installments">Parcelas</TabsTrigger>
                  <TabsTrigger value="history">Histórico</TabsTrigger>
                </TabsList>

                <TabsContent value="proposals" className="mt-4">
                  {proposalsLoading ? (
                    <Skeleton className="h-48 w-full" />
                  ) : proposals.length === 0 ? (
                    <p className="text-center py-8 text-slate-400 text-sm">Nenhuma proposta encontrada</p>
                  ) : (
                    <div className="space-y-3">
                      {proposals.map(proposal => (
                        <div key={proposal.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium text-slate-900">
                                {proposal.proposal_number || `#${proposal.id.slice(0, 8)}`}
                              </p>
                              <p className="text-xs text-slate-500">
                                {proposal.created_date && format(new Date(proposal.created_date), 'dd/MM/yyyy')}
                              </p>
                            </div>
                            <Badge className={statusColors[proposal.status] || 'bg-slate-100 text-slate-700'}>
                              {proposal.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-slate-500">Valor:</span>
                              <p className="font-semibold text-slate-900">
                                R$ {proposal.requested_amount?.toLocaleString('pt-BR')}
                              </p>
                            </div>
                            <div>
                              <span className="text-slate-500">Taxa:</span>
                              <p className="font-semibold text-slate-900">
                                {proposal.interest_rate || '—'}% a.m.
                              </p>
                            </div>
                            <div>
                              <span className="text-slate-500">Canal:</span>
                              <p className="font-semibold text-slate-900">
                                {proposal.channel || 'web'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="installments" className="mt-4">
                  {installmentsLoading ? (
                    <Skeleton className="h-48 w-full" />
                  ) : clientInstallments.length === 0 ? (
                    <p className="text-center py-8 text-slate-400 text-sm">Nenhuma parcela encontrada</p>
                  ) : (
                    <div className="space-y-2">
                      {clientInstallments.slice(0, 10).map(inst => (
                        <div key={inst.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              Parcela #{inst.installment_number || '—'}
                            </p>
                            <p className="text-xs text-slate-500">
                              Vencimento: {format(new Date(inst.due_date), 'dd/MM/yyyy')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-slate-900">
                              R$ {inst.expected_amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <Badge className={inst.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                              {inst.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                  <p className="text-center py-8 text-slate-400 text-sm">Histórico em desenvolvimento</p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

const statusColors = {
  draft: "bg-slate-100 text-slate-700",
  awaiting_documents: "bg-amber-100 text-amber-700",
  under_analysis: "bg-blue-100 text-blue-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  disbursed: "bg-green-100 text-green-700",
};