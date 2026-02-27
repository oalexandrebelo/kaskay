import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertTriangle, CheckCircle2, Clock, XCircle, 
  FileText, User, DollarSign, Eye, TrendingUp
} from "lucide-react";

const severityColors = {
  critica: "bg-red-100 text-red-700 border-red-200",
  alta: "bg-orange-100 text-orange-700 border-orange-200",
  media: "bg-amber-100 text-amber-700 border-amber-200",
  baixa: "bg-blue-100 text-blue-700 border-blue-200",
};

const severityLabels = {
  critica: "Crítica",
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

const statusLabels = {
  draft: "Rascunho",
  awaiting_documents: "Aguardando Documentos",
  under_analysis: "Em Análise",
  margin_check: "Verificação de Margem",
  margin_approved: "Margem Aprovada",
  margin_rejected: "Margem Rejeitada",
  ccb_pending: "CCB Pendente",
  ccb_issued: "CCB Emitida",
  signature_pending: "Assinatura Pendente",
  signature_completed: "Assinatura Completa",
  averbation_pending: "Averbação Pendente",
  averbated: "Averbada",
  disbursed: "Desembolsada",
  rejected: "Rejeitada",
  cancelled: "Cancelada",
  expired: "Expirada",
};

const getStatusLabel = (status) => statusLabels[status] || status;

export default function ExceptionMonitoring() {
  const [selectedTab, setSelectedTab] = useState("all");

  // Buscar propostas com status problemático
  const { data: proposals = [] } = useQuery({
    queryKey: ["proposals_monitoring"],
    queryFn: () => base44.entities.Proposal.list("-updated_date", 100),
  });

  // Buscar problemas de pagamento
  const { data: paymentIssues = [] } = useQuery({
    queryKey: ["payment_issues"],
    queryFn: () => base44.entities.PaymentIssue.filter({ status: { $in: ["open", "in_collection"] } }),
  });

  // Buscar verificações pendentes
  const { data: verifications = [] } = useQuery({
    queryKey: ["client_verifications"],
    queryFn: () => base44.entities.ClientVerification.filter({ 
      verification_status: { $in: ["pending_manual", "review_required", "failed"] } 
    }),
  });

  // Identificar exceções
  const exceptions = [
    ...proposals
      .filter(p => [
        "margin_rejected", 
        "signature_pending", 
        "averbation_pending",
        "rejected"
      ].includes(p.status))
      .map(p => ({
        id: p.id,
        type: "proposal",
        severity: p.status === "rejected" ? "alta" : "media",
        title: `Proposta ${p.proposal_number || p.id.slice(0, 8)}`,
        description: `${p.client_name} - Status: ${p.status}`,
        status: p.status,
        client_name: p.client_name,
        created_date: p.created_date,
      })),
    ...paymentIssues.map(issue => ({
      id: issue.id,
      type: "payment",
      severity: issue.severity || "alta",
      title: `Problema Pagamento - ${issue.client_name}`,
      description: `${issue.issue_type} - R$ ${issue.outstanding_amount?.toFixed(2)}`,
      status: issue.status,
      client_name: issue.client_name,
      created_date: issue.created_date,
    })),
    ...verifications.map(v => ({
      id: v.id,
      type: "verification",
      severity: v.verification_status === "failed" ? "alta" : "media",
      title: `Verificação Pendente - ${v.client_name}`,
      description: `${v.verification_type} - ${v.verification_status}`,
      status: v.verification_status,
      client_name: v.client_name,
      created_date: v.created_date,
    }))
  ];

  // Filtrar por tab
  const filteredExceptions = selectedTab === "all" 
    ? exceptions 
    : exceptions.filter(e => e.type === selectedTab);

  // Ordenar por severidade e data
  const sortedExceptions = filteredExceptions.sort((a, b) => {
    const severityOrder = { critica: 0, alta: 1, media: 2, baixa: 3 };
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return new Date(b.created_date) - new Date(a.created_date);
  });

  // KPIs
  const criticalCount = exceptions.filter(e => e.severity === "critica").length;
  const highCount = exceptions.filter(e => e.severity === "alta").length;
  const automationRate = proposals.length > 0 
    ? ((proposals.length - exceptions.filter(e => e.type === "proposal").length) / proposals.length * 100).toFixed(1)
    : 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Monitoramento de Exceções</h1>
        <p className="text-slate-500 text-sm mt-1">
          Dashboard de contingência - acompanhamento de casos que requerem intervenção manual
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Taxa Automação</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{automationRate}%</p>
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
                <p className="text-sm text-slate-500">Exceções Críticas</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{criticalCount}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Alta Prioridade</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{highCount}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Exceções</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{exceptions.length}</p>
              </div>
              <div className="p-3 bg-slate-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert de Contingência */}
      {criticalCount > 0 && (
        <Card className="rounded-xl border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Atenção: {criticalCount} exceções críticas requerem ação imediata</p>
                <p className="text-sm text-red-700 mt-1">
                  Revise os casos abaixo e tome as ações necessárias. A automação está bloqueada para estes casos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="all" className="rounded-lg">
            Todas ({exceptions.length})
          </TabsTrigger>
          <TabsTrigger value="proposal" className="rounded-lg">
            Propostas ({exceptions.filter(e => e.type === "proposal").length})
          </TabsTrigger>
          <TabsTrigger value="payment" className="rounded-lg">
            Pagamentos ({exceptions.filter(e => e.type === "payment").length})
          </TabsTrigger>
          <TabsTrigger value="verification" className="rounded-lg">
            Verificações ({exceptions.filter(e => e.type === "verification").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-4">
          <Card className="rounded-xl border-slate-100">
            <CardHeader>
              <CardTitle className="text-sm">
                Exceções Ativas - Ordem de Prioridade ({sortedExceptions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sortedExceptions.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                    <p className="text-slate-600 font-medium">Nenhuma exceção encontrada</p>
                    <p className="text-sm text-slate-500 mt-1">Todas as operações estão sendo processadas automaticamente</p>
                  </div>
                ) : (
                  sortedExceptions.map(exception => (
                    <div key={exception.id} className={`flex items-center justify-between p-4 rounded-lg border ${severityColors[exception.severity]}`}>
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                          {exception.type === "proposal" && <FileText className="w-5 h-5 text-slate-700" />}
                          {exception.type === "payment" && <DollarSign className="w-5 h-5 text-slate-700" />}
                          {exception.type === "verification" && <User className="w-5 h-5 text-slate-700" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm">{exception.title}</p>
                            <Badge variant="outline" className="text-xs">
                              {severityLabels[exception.severity]}
                            </Badge>
                          </div>
                          <p className="text-sm mt-1">{exception.description}</p>
                          <p className="text-xs text-slate-600 mt-1">
                            {new Date(exception.created_date).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="rounded-lg ml-2">
                        <Eye className="w-4 h-4 mr-1" />
                        Resolver
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}