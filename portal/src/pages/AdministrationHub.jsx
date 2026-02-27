import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import QuickActionCard from "@/components/common/QuickActionCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, ClipboardList, FileText } from "lucide-react";

export default function AdministrationHub() {
  const actions = [
    {
      icon: Users,
      title: "Controle de Acesso",
      description: "Gestão de usuários",
      link: createPageUrl("UserManagement"),
      variant: "primary",
    },
    {
      icon: Shield,
      title: "Permissões",
      description: "Configuração de acesso",
      link: createPageUrl("PermissionsManager"),
      variant: "danger",
    },
    {
      icon: ClipboardList,
      title: "Auditoria",
      description: "Logs de sistema",
      link: createPageUrl("AuditLogs"),
      variant: "default",
    },
    {
      icon: FileText,
      title: "Relatórios",
      description: "Relatórios gerenciais",
      link: createPageUrl("Reports"),
      variant: "default",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Administração</h1>
        <p className="text-slate-600 mt-2">Controle e segurança do sistema</p>
      </div>

      {/* Card de Segurança */}
      <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
        <CardHeader>
          <CardTitle className="text-sm">Segurança</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          Manage user access, permissions, and audit all system activities
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