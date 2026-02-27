import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import QuickActionCard from "@/components/common/QuickActionCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  BarChart3, 
  Clock, 
  Users, 
  FileText,
  Settings,
  TrendingUp
} from "lucide-react";

export default function ConvenioHub() {
  const { data: convenios = [] } = useQuery({
    queryKey: ["convenios_hub"],
    queryFn: () => base44.entities.ConvenioConfig.filter({ is_active: true }),
  });

  const { data: approvals = [] } = useQuery({
    queryKey: ["convenio_approvals"],
    queryFn: () => base44.entities.ConvenioApproval.filter({ approval_status: "pending" }),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["convenio_notifications"],
    queryFn: () => base44.entities.ConvenioStatusNotification.filter({ is_read: false }),
  });

  const totalConvenios = convenios.length;
  const pendingApprovals = approvals.length;
  const unreadNotifications = notifications.length;

  const actions = [
    {
      icon: Plus,
      title: "Registrar Convênio",
      description: "Adicionar novo convênio",
      link: createPageUrl("ConvenioSettings"),
      variant: "primary",
    },
    {
      icon: CheckCircle2,
      title: "Aprovações",
      description: `${pendingApprovals} pendentes`,
      link: createPageUrl("ConvenioApprovals"),
      variant: "warning",
      badge: pendingApprovals > 0 ? `${pendingApprovals}` : undefined,
    },
    {
      icon: AlertTriangle,
      title: "Notificações",
      description: `${unreadNotifications} não lidas`,
      link: createPageUrl("ConvenioNotifications"),
      variant: unreadNotifications > 0 ? "danger" : "default",
      badge: unreadNotifications > 0 ? `${unreadNotifications}` : undefined,
    },
    {
      icon: BarChart3,
      title: "Analytics",
      description: "Dados e desempenho",
      link: createPageUrl("ConvenioBI"),
      variant: "default",
    },
    {
      icon: Users,
      title: "Gestão",
      description: "Relacionamento",
      link: createPageUrl("ConvenioRelationship"),
      variant: "default",
    },
    {
      icon: FileText,
      title: "Documentos",
      description: "Decretos e termos",
      link: createPageUrl("ConvenioDocuments"),
      variant: "default",
    },
    {
      icon: Clock,
      title: "Diligência",
      description: "Acompanhamento",
      link: createPageUrl("ConvenioDiligence"),
      variant: "default",
    },
    {
      icon: TrendingUp,
      title: "Prospecção",
      description: "Novos convênios",
      link: createPageUrl("ConvenioProspection"),
      variant: "success",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Gestão de Convênios</h1>
        <p className="text-slate-600 mt-2">Centro de controle para gerenciar convênios e operações</p>
      </div>

      {/* Resumo Rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Convênios Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{totalConvenios}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Aprovações Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${pendingApprovals > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {pendingApprovals}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Notificações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${unreadNotifications > 0 ? 'text-red-600' : 'text-slate-400'}`}>
              {unreadNotifications}
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

      {/* Lista de Convênios */}
      {convenios.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Convênios Ativos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {convenios.slice(0, 6).map(conv => (
              <Link key={conv.id} to={createPageUrl("ConvenioSettings")} className="no-underline">
                <Card className="hover:shadow-lg transition-all cursor-pointer">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{conv.convenio_name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Tipo:</span>
                      <span className="font-medium">{conv.employer_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Margem Máx:</span>
                      <span className="font-medium">{conv.max_margin_percentage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Status:</span>
                      <span className={`font-medium ${conv.is_active ? 'text-green-600' : 'text-slate-400'}`}>
                        {conv.is_active ? '✓ Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}