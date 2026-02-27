import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import QuickActionCard from "@/components/common/QuickActionCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, AlertTriangle, BarChart3, ClipboardList } from "lucide-react";

export default function LegalHub() {
  const { data: processes = [] } = useQuery({
    queryKey: ["legal_processes"],
    queryFn: () => base44.entities.LegalProcess.list(),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["legal_notifications"],
    queryFn: () => base44.entities.LegalNotification.filter({ is_read: false }),
  });

  const active = processes.filter(p => p.status === 'open' || p.status === 'in_progress').length;
  const unreadAlerts = notifications.length;

  const actions = [
    {
      icon: FileText,
      title: "Processos",
      description: `${active} em andamento`,
      link: createPageUrl("LegalProcesses"),
      variant: "primary",
      badge: active > 0 ? `${active}` : undefined,
    },
    {
      icon: AlertTriangle,
      title: "Notificações",
      description: `${unreadAlerts} não lidas`,
      link: createPageUrl("LegalNotifications"),
      variant: unreadAlerts > 0 ? "danger" : "default",
      badge: unreadAlerts > 0 ? `${unreadAlerts}` : undefined,
    },
    {
      icon: FileText,
      title: "Documentos",
      description: "Gestão de documentos",
      link: createPageUrl("ConvenioDocuments"),
      variant: "default",
    },
    {
      icon: BarChart3,
      title: "Analytics",
      description: "Análise jurídica",
      link: createPageUrl("LegalBI"),
      variant: "default",
    },
    {
      icon: ClipboardList,
      title: "Auditoria",
      description: "Registros do sistema",
      link: createPageUrl("AuditLogs"),
      variant: "default",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Gestão Jurídica</h1>
        <p className="text-slate-600 mt-2">Acompanhamento de processos e compliance</p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total de Processos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{processes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Em Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${active > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {active}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Alertas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${unreadAlerts > 0 ? 'text-red-600' : 'text-slate-400'}`}>
              {unreadAlerts}
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
    </div>
  );
}