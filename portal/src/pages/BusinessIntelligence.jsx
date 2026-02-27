import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, DollarSign, AlertTriangle, Users, Target, 
  TrendingUp, Lock, Eye, Building2
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function BusinessIntelligence() {
  const { data: currentUser } = useQuery({
    queryKey: ["current_user"],
    queryFn: () => base44.auth.me(),
  });

  const { data: userPermissions } = useQuery({
    queryKey: ["user_permissions", currentUser?.email],
    queryFn: () => base44.entities.UserPermission.filter({ user_email: currentUser?.email }),
    enabled: !!currentUser?.email,
  });

  const userPermission = userPermissions?.[0];

  // Define BIs disponíveis e suas permissões
  const biModules = [
    {
      id: "financial",
      name: "BI Financeiro",
      description: "Receitas, despesas, impostos e performance financeira",
      icon: DollarSign,
      page: "FinancialBI",
      color: "emerald",
      requiredPermission: "can_view_financial",
      areas: ["Financeiro", "Diretoria"],
    },
    {
      id: "collections",
      name: "BI de Cobrança",
      description: "Inadimplência, recuperação, aging e performance de cobradores",
      icon: AlertTriangle,
      page: "CollectionsBI",
      color: "orange",
      requiredPermission: "can_view_collections_bi",
      areas: ["Cobrança", "Financeiro", "Diretoria"],
    },
    {
      id: "convenios",
      name: "BI de Convênios",
      description: "Pipeline, documentação, credenciamento e gestoras de margem",
      icon: Building2,
      page: "ConvenioBI",
      color: "indigo",
      requiredPermission: "can_view_convenio_bi",
      areas: ["Convênios", "Diretoria"],
    },
    {
      id: "commercial",
      name: "BI Comercial",
      description: "Pipeline, conversão, performance de vendedores",
      icon: TrendingUp,
      page: "CommercialBI",
      color: "blue",
      requiredPermission: "can_view_commercial_bi",
      areas: ["Comercial", "Diretoria"],
    },
    {
      id: "operations",
      name: "BI Operacional",
      description: "SLA, tempo médio, produtividade, gargalos operacionais",
      icon: BarChart3,
      page: "OperationsBI",
      color: "purple",
      requiredPermission: "can_view_operations_bi",
      areas: ["Operações", "Diretoria"],
    },
    {
      id: "crm",
      name: "BI de Marketing & CX",
      description: "Leads, conversão de canais, NPS, satisfação de clientes",
      icon: Users,
      page: "MarketingBI",
      color: "pink",
      requiredPermission: "can_view_marketing_bi",
      areas: ["Marketing", "CX", "Diretoria"],
    },
    {
      id: "dre",
      name: "DRE Consolidada",
      description: "Demonstração de Resultado do Exercício - Visão contábil completa",
      icon: BarChart3,
      page: "ConsolidatedDRE",
      color: "emerald",
      requiredPermission: "can_view_financial",
      areas: ["Financeiro", "Controladoria", "Diretoria"],
    },
  ];

  // Filtrar BIs baseado em permissões
  const hasPermission = (requiredPermission) => {
    // Admin vê tudo
    if (currentUser?.role === "admin") return true;
    
    // Verifica permissão específica
    if (userPermission?.permissions?.[requiredPermission]) return true;
    
    return false;
  };

  const availableBIs = biModules.filter(bi => hasPermission(bi.requiredPermission));
  const restrictedBIs = biModules.filter(bi => !hasPermission(bi.requiredPermission));

  const colorClasses = {
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
    orange: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" },
    blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
    pink: { bg: "bg-pink-50", text: "text-pink-600", border: "border-pink-200" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-200" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Business Intelligence</h1>
        <p className="text-slate-500 text-sm mt-1">
          Acesse os dashboards analíticos da sua área
        </p>
      </div>

      {availableBIs.length === 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <Lock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900">
            Você não tem permissão para acessar nenhum módulo de BI. Entre em contato com o administrador.
          </AlertDescription>
        </Alert>
      )}

      {/* BIs Disponíveis */}
      {availableBIs.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Dashboards Disponíveis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableBIs.map(bi => {
              const Icon = bi.icon;
              const colors = colorClasses[bi.color];
              return (
                <Link key={bi.id} to={createPageUrl(bi.page)}>
                  <Card className={`rounded-xl border ${colors.border} hover:shadow-lg transition-all cursor-pointer group`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className={`p-3 ${colors.bg} rounded-lg group-hover:scale-110 transition-transform`}>
                          <Icon className={`w-6 h-6 ${colors.text}`} />
                        </div>
                        <Eye className="w-4 h-4 text-slate-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardTitle className="text-base mb-2">{bi.name}</CardTitle>
                      <p className="text-xs text-slate-500 mb-3">{bi.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {bi.areas.map(area => (
                          <Badge key={area} variant="outline" className="text-[10px]">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* BIs Restritos */}
      {restrictedBIs.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-400 mb-3">Sem Acesso</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {restrictedBIs.map(bi => {
              const Icon = bi.icon;
              return (
                <Card key={bi.id} className="rounded-xl border-slate-200 bg-slate-50/50 opacity-60">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="p-3 bg-slate-200 rounded-lg">
                        <Icon className="w-6 h-6 text-slate-400" />
                      </div>
                      <Lock className="w-4 h-4 text-slate-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-base mb-2 text-slate-600">{bi.name}</CardTitle>
                    <p className="text-xs text-slate-400 mb-3">{bi.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {bi.areas.map(area => (
                        <Badge key={area} variant="outline" className="text-[10px] text-slate-400">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Info sobre permissões */}
      <Alert className="border-blue-200 bg-blue-50">
        <BarChart3 className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900 text-sm">
          <strong>Controle de Acesso:</strong> Os dashboards são filtrados automaticamente baseado na sua área e permissões. 
          Cada BI mostra apenas os dados que você tem autorização para visualizar.
        </AlertDescription>
      </Alert>
    </div>
  );
}