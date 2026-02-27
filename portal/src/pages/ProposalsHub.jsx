import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import QuickActionCard from "@/components/common/QuickActionCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  TrendingUp,
  AlertTriangle,
  BarChart3,
  FileText
} from "lucide-react";

export default function ProposalsHub() {
  const { data: proposals = [] } = useQuery({
    queryKey: ["proposals_hub"],
    queryFn: () => base44.entities.Proposal.list(),
  });

  const pending = proposals.filter(p => p.status === 'awaiting_documents' || p.status === 'under_analysis').length;
  const approved = proposals.filter(p => p.status === 'disbursed').length;
  const rejected = proposals.filter(p => p.status === 'rejected').length;
  const total = proposals.length;

  const actions = [
    {
      icon: Plus,
      title: "Nova Proposta",
      description: "Criar proposta rápida",
      link: createPageUrl("NewProposal"),
      variant: "primary",
    },
    {
      icon: Clock,
      title: "Pendentes",
      description: `${pending} aguardando`,
      link: createPageUrl("Proposals"),
      variant: pending > 0 ? "warning" : "default",
      badge: pending > 0 ? `${pending}` : undefined,
    },
    {
      icon: CheckCircle2,
      title: "Aprovadas",
      description: `${approved} desembolsadas`,
      link: createPageUrl("Proposals"),
      variant: "success",
      badge: approved > 0 ? `${approved}` : undefined,
    },
    {
      icon: XCircle,
      title: "Rejeitadas",
      description: `${rejected} propostas`,
      link: createPageUrl("Proposals"),
      variant: rejected > 0 ? "danger" : "default",
      badge: rejected > 0 ? `${rejected}` : undefined,
    },
    {
      icon: BarChart3,
      title: "Analytics",
      description: "Dados e KPIs",
      link: createPageUrl("BusinessIntelligence"),
      variant: "default",
    },
    {
      icon: TrendingUp,
      title: "Carteira",
      description: "Gestão de portfólio",
      link: createPageUrl("PortfolioManagement"),
      variant: "default",
    },
    {
      icon: AlertTriangle,
      title: "Exceções",
      description: "Monitoramento",
      link: createPageUrl("ExceptionMonitoring"),
      variant: "warning",
    },
    {
      icon: FileText,
      title: "Documentos",
      description: "Gerenciar documentos",
      link: createPageUrl("DocumentManager"),
      variant: "default",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Gestão de Propostas</h1>
        <p className="text-slate-600 mt-2">Acompanhamento completo do ciclo de crédito</p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${pending > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {pending}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Aprovadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Rejeitadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${rejected > 0 ? 'text-red-600' : 'text-slate-400'}`}>
              {rejected}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action, i) => (
            <Link key={i} to={action.link} className="no-underline">
              <QuickActionCard
                icon={action.icon}
                title={action.title}
                description={action.description}
                variant={action.variant}
                badge={action.badge}
              />
            </Link>
          ))}
        </div>
      </div>

      {/* Propostas Recentes */}
      {proposals.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Propostas Recentes</h2>
          <div className="space-y-2">
            {proposals.slice(0, 5).map(prop => (
              <Card key={prop.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                <CardContent className="py-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{prop.client_name}</p>
                    <p className="text-sm text-slate-600">#{prop.proposal_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-600">R$ {(prop.approved_amount || prop.requested_amount).toLocaleString('pt-BR')}</p>
                    <p className={`text-xs font-medium ${prop.status === 'disbursed' ? 'text-green-600' : 'text-orange-600'}`}>
                      {prop.status}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}