import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import NotificationCenter from "@/components/layout/NotificationCenter";
import GlobalSearch from "@/components/common/GlobalSearch";
import {
  LayoutDashboard,
  FileText,
  Users,
  Brain,
  Plug,
  MessageSquare,
  ClipboardList,
  Menu,
  X,
  ChevronRight,
  TrendingDown,
  AlertTriangle,
  Package,
  Settings,
  DollarSign,
  Building2,
  BarChart3,
  ChevronDown,
  Megaphone,
  Briefcase,
  Target,
  Shield,
  Zap,
  GripVertical,
  Settings2,
  CheckCircle2,
  TrendingUp,
  Bell,
  LogOut,
  Calculator,
  BookOpen,
  Sliders,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const navCategories = [
  {
    name: "Principal",
    items: [
      { name: "Dash Operacional", icon: LayoutDashboard, page: "OperationalHome" },
      { name: "⚠️ Alertas & Tarefas", icon: AlertTriangle, page: "TaskManager" },
      { name: "Dash Comercial", icon: LayoutDashboard, page: "Dashboard" },
      { name: "Inteligência", icon: BarChart3, page: "BusinessIntelligence" },
    ]
  },
  {
    name: "Atendimento",
    icon: Users,
    hubPage: "CustomerServiceHub",
    items: [
      { name: "Central de Atendimento", icon: Users, page: "CustomerServiceHub", quickAccessPage: "CustomerServiceHub" },
      { name: "Simulador de Crédito", icon: Calculator, page: "CreditSimulator", quickAccessPage: "CreditSimulator" },
    ]
  },
  {
    name: "Atendimento Digital",
    icon: Zap,
    hubPage: "FastProposal",
    items: [
      { name: "Contratação WhatsApp", icon: MessageSquare, page: "FastProposal", quickAccessPage: "FastProposal" },
      { name: "Simulador WhatsApp", icon: Zap, page: "WhatsAppSimulator", quickAccessPage: "WhatsAppSimulator" },
      { name: "Agente de IA", icon: Brain, page: "WhatsAppAgent", quickAccessPage: "WhatsAppAgent" },
    ]
  },
  {
    name: "Operações",
    icon: Briefcase,
    hubPage: "ProposalsHub",
    items: [
      { name: "Propostas", icon: FileText, page: "ProposalsOptimized" },
      { name: "Clientes", icon: Users, page: "Clients" },
      { name: "Monitoramento Exceções", icon: AlertTriangle, page: "ExceptionMonitoring" },
      { name: "Averbação", icon: CheckCircle2, page: "AverbationControl" },
    ]
  },
  {
    name: "Convênios",
    icon: Building2,
    hubPage: "ConvenioHub",
    items: [
      { name: "BI Convênios", icon: BarChart3, page: "ConvenioBI" },
      { name: "Gestão", icon: Users, page: "ConvenioRelationship" },
      { name: "Notificações", icon: Bell, page: "ConvenioNotifications" },
      { name: "Aprovações", icon: CheckCircle2, page: "ConvenioApprovals" },
      { name: "Assinaturas", icon: FileText, page: "ConvenioSignatures" },
      { name: "Prospecção", icon: Target, page: "ConvenioProspection" },
      { name: "Configuração", icon: Settings, page: "ConvenioSettings" },
      { name: "Diligência", icon: ClipboardList, page: "ConvenioDiligence" },
    ]
  },

  {
    name: "Financeiro",
    icon: DollarSign,
    hubPage: "FinancialHub",
    items: [
      { name: "Dashboard de Caixa", icon: TrendingUp, page: "CashflowDashboard" },
      { name: "Gestão de Carteira", icon: Briefcase, page: "PortfolioOperations" },
      { name: "Carteira & Originação", icon: Briefcase, page: "PortfolioManagement" },
      { name: "Contas a Pagar", icon: DollarSign, page: "ContasAPagar" },
      { name: "Contas a Receber", icon: DollarSign, page: "ContasAReceber" },
      { name: "Folha", icon: FileText, page: "PayrollManager" },
      { name: "Gestão Multi-CNPJ", icon: Building2, page: "CNPJManagement" },
      { name: "Conciliação", icon: DollarSign, page: "Financial" },
      { name: "Comissões Avançadas", icon: TrendingUp, page: "AdvancedCommissions" },
      { name: "Regras Comissão", icon: Settings, page: "CommissionRules" },
      { name: "Gestão Cobranças", icon: AlertTriangle, page: "Collections" },
      { name: "DRE", icon: BarChart3, page: "ConsolidatedDRE" },
      { name: "FIDC", icon: Package, page: "FIDCManagement" },
      { name: "FP&A", icon: TrendingUp, page: "FinancialBI" },
    ]
  },
  {
    name: "Jurídico",
    icon: Shield,
    hubPage: "LegalHub",
    items: [
      { name: "Processos", icon: FileText, page: "LegalProcesses" },
      { name: "Notificações", icon: AlertTriangle, page: "LegalNotifications" },
      { name: "Documentos", icon: FileText, page: "ConvenioDocuments" },
      { name: "Auditoria", icon: ClipboardList, page: "AuditLogs" },
      { name: "Analytics", icon: BarChart3, page: "LegalBI" },
    ]
  },
  {
    name: "Marketing",
    icon: Megaphone,
    hubPage: "MarketingHub",
    items: [
      { name: "BI Marketing", icon: BarChart3, page: "MarketingBI" },
      { name: "CRM", icon: Target, page: "CRM" },
      { name: "Omnichannel", icon: MessageSquare, page: "Omnichannel" },
    ]
  },
  {
    name: "Pessoas",
    icon: Users,
    hubPage: "PeopleHub",
    items: [
      { name: "Colaboradores", icon: Users, page: "HREmployees" },
      { name: "PDI", icon: TrendingUp, page: "HRDevelopment" },
      { name: "Treinamentos", icon: Brain, page: "HRTraining" },
      { name: "Treinamento do Sistema", icon: BookOpen, page: "SystemTraining", quickAccessPage: "SystemTraining" },
    ]
  },
  {
    name: "Governança",
    icon: Shield,
    hubPage: "DualApprovalQueue",
    items: [
      { name: "Dupla Aprovação", icon: Shield, page: "DualApprovalQueue", quickAccessPage: "DualApprovalQueue" },
    ]
  },
  {
    name: "Cobrança",
    icon: AlertTriangle,
    hubPage: "CollectionDashboard",
    items: [
      { name: "Dashboard Cobrança", icon: TrendingDown, page: "CollectionDashboard", quickAccessPage: "CollectionDashboard" },
    ]
  },
  {
    name: "Refin",
    icon: TrendingUp,
    hubPage: "RefinancingCampaigns",
    items: [
      { name: "Campanhas de Refin", icon: Target, page: "RefinancingCampaigns", quickAccessPage: "RefinancingCampaigns" },
    ]
  },
  {
    name: "Tecnologia",
    icon: Plug,
    hubPage: "TechnologyHub",
    items: [
      { name: "Decisão Automatizada", icon: Zap, page: "AutoDecisionQueue" },
      { name: "Motor de Decisão", icon: Brain, page: "DecisionEngine" },
      { name: "Orquestração", icon: Settings, page: "ServiceOrchestrator" },
      { name: "Regras", icon: Settings2, page: "AdvancedOrchestrator" },
      { name: "Verificações", icon: Shield, page: "VerificationSettings" },
      { name: "Integrações", icon: Plug, page: "Integrations" },
      { name: "Workflows", icon: Zap, page: "WorkflowManager" },
      { name: "Assinatura Digital", icon: FileText, page: "ESignatureManagement" },
      { name: "Parametrizações", icon: Sliders, page: "SystemParameters", quickAccessPage: "SystemParameters" },
    ]
  },
  {
    name: "Administração",
    icon: Shield,
    hubPage: "AdministrationHub",
    items: [
      { name: "Controle de Acesso", icon: Users, page: "UserManagement" },
      { name: "Convidar Usuários", icon: Users, page: "InviteUser" },
      { name: "Permissões", icon: Shield, page: "PermissionsManager" },
      { name: "Auditoria", icon: ClipboardList, page: "AuditLogs" },
      { name: "Relatórios", icon: FileText, page: "Reports" },
      { name: "Agendados", icon: FileText, page: "ReportsManager" },
    ]
  },
];

export default function Layout({ children, currentPageName }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(() => {
    // Inicializar todas as categorias como expandidas por padrão
    const initial = {};
    navCategories.forEach(cat => {
      if (cat.name !== "Principal") initial[cat.name] = true;
    });
    return initial;
  });
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customOrder, setCustomOrder] = useState([]);
  const queryClient = useQueryClient();

  // Buscar usuário atual e permissões
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

  // Mutation para salvar ordem personalizada
  const saveMenuOrderMutation = useMutation({
    mutationFn: async (menuOrder) => {
      if (userPermission?.id) {
        return base44.entities.UserPermission.update(userPermission.id, { menu_order: menuOrder });
      } else {
        return base44.entities.UserPermission.create({
          user_email: currentUser.email,
          user_name: currentUser.full_name,
          menu_order: menuOrder,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_permissions"] });
      setIsCustomizing(false);
    },
  });

  // Filtrar categorias e itens baseado nas permissões
  const filteredCategories = navCategories.map(category => {
    const visibleItems = category.items.filter(item => {
      // Admin sempre vê tudo
      if (currentUser?.role === "admin") return true;
      
      // Se não tem permissões configuradas, mostra apenas itens básicos
      if (!userPermission?.allowed_pages) {
        return ["Dashboard", "BusinessIntelligence", "FastProposal", "Proposals", "Clients"].includes(item.page);
      }
      
      // Filtra baseado nas páginas permitidas
      return userPermission.allowed_pages.includes(item.page);
    });

    return { ...category, items: visibleItems };
  }).filter(cat => cat.items.length > 0);

  // Aplicar ordem personalizada se existir
  const visibleCategories = userPermission?.menu_order?.length > 0
    ? userPermission.menu_order
        .map(name => filteredCategories.find(cat => cat.name === name))
        .filter(Boolean)
        .concat(filteredCategories.filter(cat => !userPermission.menu_order.includes(cat.name)))
    : filteredCategories;

  const toggleCategory = (categoryName) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: prev[categoryName] === false ? true : false
    }));
  };

  const toggleAllCategories = () => {
    const allExpanded = visibleCategories.every(cat => expandedCategories[cat.name] !== false);
    const newState = {};
    visibleCategories.forEach(cat => {
      if (cat.name !== "Principal") {
        newState[cat.name] = !allExpanded;
      }
    });
    setExpandedCategories(prev => ({ ...prev, ...newState }));
  };

  const openCustomizer = () => {
    setCustomOrder(visibleCategories.map(cat => cat.name));
    setIsCustomizing(true);
  };

  const moveCategory = (index, direction) => {
    const newOrder = [...customOrder];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < newOrder.length) {
      [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
      setCustomOrder(newOrder);
    }
  };

  const saveCustomOrder = () => {
    saveMenuOrderMutation.mutate(customOrder);
  };

  // Páginas que não devem ter layout com sidebar
  const noLayoutPages = ["Home", "PortalLogin", "PortalFirstAccess"];
  const isPublicPage = noLayoutPages.includes(currentPageName);

  // Se for página pública, retorna apenas o conteúdo sem layout
  if (isPublicPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <style>{`
        :root {
          --sidebar-width: ${collapsed ? "72px" : "240px"};
        }
        @media (max-width: 768px) {
          :root { --sidebar-width: 0px; }
        }
      `}</style>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-screen bg-white border-r border-slate-100 z-50 transition-all duration-300 flex flex-col",
        collapsed ? "w-[72px]" : "w-60",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-slate-100 shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                <span className="text-white text-sm font-bold">K</span>
              </div>
              <span className="text-lg font-bold text-slate-900 tracking-tight">Kaskay</span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center mx-auto">
              <span className="text-white text-sm font-bold">K</span>
            </div>
          )}
        </div>

        {/* Nav */}
        {!collapsed && (
          <div className="px-3 py-2 flex justify-end">
            <button
              onClick={toggleAllCategories}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Expandir/Recolher todos os menus"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <nav className="flex-1 py-4 px-3 space-y-2 overflow-y-auto">
          {visibleCategories.map(category => {
            const isExpanded = expandedCategories[category.name] !== false;
            const CategoryIcon = category.icon;
            const hasActiveItem = category.items.some(item => item.page === currentPageName);

            return (
              <div key={category.name} className="space-y-1">
                {category.name === "Principal" ? (
                  // Items principais sem categoria
                  category.items.map(item => {
                    const isActive = currentPageName === item.page;
                    return (
                      <Link
                        key={item.page}
                        to={createPageUrl(item.page)}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-blue-50 text-blue-700"
                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                        )}
                      >
                        <item.icon className={cn("w-[18px] h-[18px] shrink-0", isActive ? "text-blue-600" : "")} />
                        {!collapsed && <span>{item.name}</span>}
                      </Link>
                    );
                  })
                ) : (
                  <>
                    {/* Categoria com expansão */}
                    {!collapsed && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleCategory(category.name);
                          }}
                          className={cn(
                            "flex-1 flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer",
                            hasActiveItem ? "text-blue-700" : "text-slate-400 hover:text-slate-600"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {CategoryIcon && <CategoryIcon className="w-3.5 h-3.5" />}
                            <span>{category.name}</span>
                          </div>
                          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", isExpanded && "rotate-180")} />
                        </button>
                        {category.hubPage && (
                          <Link
                            to={createPageUrl(category.hubPage)}
                            onClick={() => setMobileOpen(false)}
                            className="p-2 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                            title={`Ir para Hub ${category.name}`}
                          >
                            <LayoutDashboard className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    )}
                    
                    {/* Ícone hub para modo collapsed */}
                    {collapsed && category.hubPage && (
                      <Link
                        to={createPageUrl(category.hubPage)}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center justify-center p-2 rounded-xl transition-all duration-200",
                          hasActiveItem ? "bg-blue-50 text-blue-700" : "text-slate-400 hover:text-blue-700 hover:bg-blue-50"
                        )}
                        title={`Hub ${category.name}`}
                      >
                        <LayoutDashboard className="w-[18px] h-[18px]" />
                      </Link>
                    )}
                    
                    {/* Items da categoria */}
                    <div className={cn(
                      "overflow-hidden transition-all duration-200",
                      !collapsed && !isExpanded ? "max-h-0" : "max-h-[2000px]"
                    )}>
                      {(isExpanded || collapsed) && category.items.map(item => {
                        const isActive = currentPageName === item.page;
                        return item.page ? (
                          <div
                            key={item.page}
                            className="flex items-center group"
                          >
                            <Link
                              to={createPageUrl(item.page)}
                              onClick={() => setMobileOpen(false)}
                              className={cn(
                                "flex-1 flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                                collapsed ? "px-3" : "px-3 ml-2",
                                isActive
                                  ? "bg-blue-50 text-blue-700"
                                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                              )}
                            >
                              <item.icon className={cn("w-[18px] h-[18px] shrink-0", isActive ? "text-blue-600" : "")} />
                              {!collapsed && <span>{item.name}</span>}
                            </Link>
                            {!collapsed && item.quickAccessPage && (
                              <Link
                                to={createPageUrl(item.quickAccessPage)}
                                onClick={() => setMobileOpen(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100"
                                title={`Acesso rápido: ${item.name}`}
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </Link>
                            )}
                          </div>
                        ) : null;
                      })}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-100 shrink-0">
          {!collapsed && (
            <button
              onClick={openCustomizer}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Personalizar Menu</span>
            </button>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex items-center justify-center h-10 text-slate-400 hover:text-slate-600 transition-colors w-full"
          >
            <ChevronRight className={cn("w-4 h-4 transition-transform", collapsed ? "" : "rotate-180")} />
          </button>
        </div>
      </aside>

      {/* Dialog de Personalização */}
      <Dialog open={isCustomizing} onOpenChange={setIsCustomizing}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Personalizar Ordem do Menu</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {customOrder.map((categoryName, index) => {
              const category = visibleCategories.find(c => c.name === categoryName);
              const CategoryIcon = category?.icon;
              return (
                <div key={categoryName} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <GripVertical className="w-4 h-4 text-slate-400" />
                  {CategoryIcon && <CategoryIcon className="w-4 h-4 text-slate-600" />}
                  <span className="flex-1 text-sm text-slate-900">{categoryName}</span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => moveCategory(index, "up")}
                      disabled={index === 0}
                      className="h-7 w-7 p-0"
                    >
                      ↑
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => moveCategory(index, "down")}
                      disabled={index === customOrder.length - 1}
                      className="h-7 w-7 p-0"
                    >
                      ↓
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsCustomizing(false)}>
              Cancelar
            </Button>
            <Button onClick={saveCustomOrder} disabled={saveMenuOrderMutation.isPending}>
              {saveMenuOrderMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main */}
      <main className="transition-all duration-300 md:ml-[var(--sidebar-width)]">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-slate-50/80 backdrop-blur-xl border-b border-slate-100 h-16 flex items-center justify-between px-6">
          <div className="flex items-center md:hidden">
            <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-slate-100">
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex items-center gap-2 ml-3">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">K</span>
              </div>
              <span className="text-sm font-bold text-slate-900">Kaskay</span>
            </div>
          </div>
          <div className="hidden md:flex">
            <GlobalSearch />
          </div>
          <div className="flex items-center gap-3">
            <NotificationCenter />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => base44.auth.logout(createPageUrl('PortalLogin'))}
              className="rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        <div className="p-6 md:p-8 max-w-[1400px]">
          {children}
        </div>
      </main>
    </div>
  );
}