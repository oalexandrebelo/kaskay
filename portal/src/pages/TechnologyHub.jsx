import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import QuickActionCard from "@/components/common/QuickActionCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Zap, Settings, Shield, Plug } from "lucide-react";

export default function TechnologyHub() {
  const actions = [
    {
      icon: Brain,
      title: "Decisão",
      description: "Engine de decisão",
      link: createPageUrl("DecisionEngine"),
      variant: "primary",
    },
    {
      icon: Zap,
      title: "Orquestração",
      description: "Fluxos de processo",
      link: createPageUrl("ServiceOrchestrator"),
      variant: "default",
    },
    {
      icon: Settings,
      title: "Regras",
      description: "Regras avançadas",
      link: createPageUrl("AdvancedOrchestrator"),
      variant: "default",
    },
    {
      icon: Shield,
      title: "Verificações",
      description: "Configurações",
      link: createPageUrl("VerificationSettings"),
      variant: "default",
    },
    {
      icon: Plug,
      title: "Integrações",
      description: "Conectar serviços",
      link: createPageUrl("Integrations"),
      variant: "default",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Tecnologia</h1>
        <p className="text-slate-600 mt-2">Configuração de sistemas e integrações</p>
      </div>

      {/* Card de Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm">Sistema</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          Configure motores de decisão, orquestração de processos e integrações externas
        </CardContent>
      </Card>

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