import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import QuickActionCard from "@/components/common/QuickActionCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Brain } from "lucide-react";

export default function PeopleHub() {
  const { data: employees = [] } = useQuery({
    queryKey: ["people_employees"],
    queryFn: () => base44.entities.Employee.filter({ status: "ativo" }),
  });

  const { data: pdis = [] } = useQuery({
    queryKey: ["people_pdis"],
    queryFn: () => base44.entities.PDI.filter({ status: "em_andamento" }),
  });

  const actions = [
    {
      icon: Users,
      title: "Colaboradores",
      description: "Gestão de equipe",
      link: createPageUrl("HREmployees"),
      variant: "primary",
    },
    {
      icon: TrendingUp,
      title: "PDI",
      description: `${pdis.length} em andamento`,
      link: createPageUrl("HRDevelopment"),
      variant: "default",
      badge: pdis.length > 0 ? `${pdis.length}` : undefined,
    },
    {
      icon: Brain,
      title: "Treinamentos",
      description: "Desenvolvimento",
      link: createPageUrl("HRTraining"),
      variant: "default",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Gestão de Pessoas</h1>
        <p className="text-slate-600 mt-2">Desenvolvimento e gestão de colaboradores</p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Colaboradores Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{employees.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">PDI em Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{pdis.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Taxa de Desenvolvimento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{employees.length > 0 ? Math.round((pdis.length / employees.length) * 100) : 0}%</div>
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
    </div>
  );
}