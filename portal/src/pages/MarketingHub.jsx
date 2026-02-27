import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import QuickActionCard from "@/components/common/QuickActionCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Target, MessageSquare } from "lucide-react";

export default function MarketingHub() {
  const { data: leads = [] } = useQuery({
    queryKey: ["marketing_leads"],
    queryFn: () => base44.entities.Lead.list(),
  });

  const qualified = leads.filter(l => l.stage === 'qualificado').length;
  const converted = leads.filter(l => l.stage === 'ganho').length;

  const actions = [
    {
      icon: BarChart3,
      title: "BI Marketing",
      description: "Análise de dados",
      link: createPageUrl("MarketingBI"),
      variant: "primary",
    },
    {
      icon: Target,
      title: "CRM",
      description: "Gestão de relacionamento",
      link: createPageUrl("CRM"),
      variant: "default",
    },
    {
      icon: MessageSquare,
      title: "Omnichannel",
      description: "Comunicação integrada",
      link: createPageUrl("Omnichannel"),
      variant: "default",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Marketing e CRM</h1>
        <p className="text-slate-600 mt-2">Gestão de campanhas e relacionamento com clientes</p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total de Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{leads.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Qualificados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{qualified}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Convertidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{converted}</div>
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