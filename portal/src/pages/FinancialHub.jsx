import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import QuickActionCard from "@/components/common/QuickActionCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Package,
  FileText
} from "lucide-react";

export default function FinancialHub() {
  const { data: proposals = [] } = useQuery({
    queryKey: ["financial_proposals"],
    queryFn: () => base44.entities.Proposal.list(),
  });

  const totalValue = proposals.reduce((sum, p) => sum + (p.approved_amount || p.requested_amount || 0), 0);
  const disbursed = proposals.filter(p => p.status === 'disbursed').length;

  const actions = [
    {
      icon: TrendingUp,
      title: "Carteira & Originação",
      description: "Gestão de portfólio",
      link: createPageUrl("PortfolioManagement"),
      variant: "primary",
    },
    {
      icon: DollarSign,
      title: "Contas a Pagar",
      description: "Gestão de despesas",
      link: createPageUrl("ContasAPagar"),
      variant: "danger",
    },
    {
      icon: DollarSign,
      title: "Contas a Receber",
      description: "Gestão de receitas",
      link: createPageUrl("ContasAReceber"),
      variant: "success",
    },
    {
      icon: FileText,
      title: "Folha",
      description: "Processamento",
      link: createPageUrl("PayrollManager"),
      variant: "default",
    },
    {
      icon: DollarSign,
      title: "Conciliação",
      description: "Reconciliação bancária",
      link: createPageUrl("Financial"),
      variant: "default",
    },
    {
      icon: TrendingUp,
      title: "Comissões",
      description: "Gestão de comissões",
      link: createPageUrl("CommissionManagement"),
      variant: "default",
    },
    {
      icon: FileText,
      title: "Regras Comissão",
      description: "Configuração",
      link: createPageUrl("CommissionRules"),
      variant: "default",
    },
    {
      icon: TrendingDown,
      title: "Cobranças",
      description: "Gestão de cobrança",
      link: createPageUrl("Collections"),
      variant: "warning",
    },
    {
      icon: BarChart3,
      title: "DRE",
      description: "Demonstrativo de resultado",
      link: createPageUrl("ConsolidatedDRE"),
      variant: "default",
    },
    {
      icon: Package,
      title: "FIDC",
      description: "Fundo de investimento",
      link: createPageUrl("FIDCManagement"),
      variant: "default",
    },
    {
      icon: BarChart3,
      title: "FP&A",
      description: "Análise financeira",
      link: createPageUrl("FinancialBI"),
      variant: "default",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Gestão Financeira</h1>
        <p className="text-slate-600 mt-2">Controle completo das operações financeiras</p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Carteira Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">R$ {(totalValue / 1000000).toFixed(1)}M</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Desembolsadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{disbursed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Valor Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-600">R$ {(totalValue / (proposals.length || 1) / 1000).toFixed(0)}K</div>
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
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}