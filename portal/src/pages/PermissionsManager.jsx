import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Shield, 
  Users, 
  Lock, 
  Unlock, 
  Settings, 
  Eye,
  Menu as MenuIcon,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const availablePages = [
  { page: "Dashboard", name: "Dashboard", category: "Geral" },
  { page: "FinancialBI", name: "BI Financeiro", category: "Financeiro" },
  { page: "FastProposal", name: "Contratação Rápida", category: "Operações" },
  { page: "Proposals", name: "Propostas", category: "Operações" },
  { page: "Clients", name: "Clientes", category: "Operações" },
  { page: "Collections", name: "Cobranças", category: "Financeiro" },
  { page: "FIDCManagement", name: "FIDC", category: "Financeiro" },
  { page: "Financial", name: "Financeiro", category: "Financeiro" },
  { page: "PayrollManager", name: "Arquivos Folha", category: "Operações" },
  { page: "ConvenioSettings", name: "Convênios", category: "Configurações" },
  { page: "DecisionEngine", name: "Motor de Decisão", category: "Configurações" },
  { page: "DocumentManager", name: "Documentos", category: "Operações" },
  { page: "VerificationSettings", name: "Otimização Custos", category: "Configurações" },
  { page: "ServiceOrchestrator", name: "Orquestração", category: "Configurações" },
  { page: "Integrations", name: "Integrações", category: "Configurações" },
  { page: "WhatsAppSimulator", name: "Simulador WhatsApp", category: "Geral" },
  { page: "Reports", name: "Relatórios", category: "Geral" },
  { page: "UserManagement", name: "Usuários", category: "Administração" },
  { page: "WhatsAppAgent", name: "WhatsApp", category: "Geral" },
  { page: "WhatsAppStrategy", name: "Estratégia WA", category: "Geral" },
  { page: "AuditLogs", name: "Auditoria", category: "Administração" },
];

const permissionsList = [
  { key: "can_create_proposals", label: "Criar propostas" },
  { key: "can_approve_proposals", label: "Aprovar propostas" },
  { key: "can_edit_clients", label: "Editar clientes" },
  { key: "can_delete_clients", label: "Deletar clientes" },
  { key: "can_manage_convenios", label: "Gerenciar convênios" },
  { key: "can_view_financial", label: "Ver dados financeiros" },
  { key: "can_manage_users", label: "Gerenciar usuários" },
  { key: "can_export_data", label: "Exportar dados" },
  { key: "can_access_bi", label: "Acessar BI Financeiro" },
  { key: "can_manage_documents", label: "Gerenciar documentos" },
  { key: "can_manage_integrations", label: "Gerenciar integrações" },
];

export default function PermissionsManager() {
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    allowed_pages: [],
    permissions: {},
    menu_order: [],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["users_list"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: permissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ["user_permissions_all"],
    queryFn: () => base44.entities.UserPermission.list(),
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const existing = permissions.find(p => p.user_email === selectedUser.email);
      if (existing) {
        await base44.entities.UserPermission.update(existing.id, data);
      } else {
        await base44.entities.UserPermission.create({
          ...data,
          user_email: selectedUser.email,
          user_name: selectedUser.full_name,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_permissions_all"] });
      setEditOpen(false);
      setSelectedUser(null);
    },
  });

  const openEditDialog = (user) => {
    setSelectedUser(user);
    const existing = permissions.find(p => p.user_email === user.email);
    
    setFormData({
      allowed_pages: existing?.allowed_pages || [],
      permissions: existing?.permissions || {},
      menu_order: existing?.menu_order || [],
    });
    setEditOpen(true);
  };

  const togglePage = (page) => {
    setFormData(prev => ({
      ...prev,
      allowed_pages: prev.allowed_pages.includes(page)
        ? prev.allowed_pages.filter(p => p !== page)
        : [...prev.allowed_pages, page]
    }));
  };

  const togglePermission = (key) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key]
      }
    }));
  };

  const movePageUp = (page) => {
    const currentOrder = formData.menu_order.length > 0 ? formData.menu_order : formData.allowed_pages;
    const index = currentOrder.indexOf(page);
    if (index > 0) {
      const newOrder = [...currentOrder];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      setFormData(prev => ({ ...prev, menu_order: newOrder }));
    }
  };

  const movePageDown = (page) => {
    const currentOrder = formData.menu_order.length > 0 ? formData.menu_order : formData.allowed_pages;
    const index = currentOrder.indexOf(page);
    if (index < currentOrder.length - 1) {
      const newOrder = [...currentOrder];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      setFormData(prev => ({ ...prev, menu_order: newOrder }));
    }
  };

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  if (usersLoading || permissionsLoading) {
    return <Skeleton className="h-96 rounded-2xl" />;
  }

  const pagesByCategory = availablePages.reduce((acc, page) => {
    if (!acc[page.category]) acc[page.category] = [];
    acc[page.category].push(page);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gerenciamento de Permissões</h1>
        <p className="text-slate-500 text-sm mt-1">Configure o que cada usuário pode acessar e fazer na plataforma</p>
      </div>

      <Alert className="border-blue-200 bg-blue-50">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900 text-sm">
          <strong>Controle Granular:</strong> Configure páginas visíveis no menu, ordem dos itens, e permissões específicas por funcionalidade.
          <br />
          <span className="text-blue-700">🔒 Administradores sempre têm acesso completo</span>
        </AlertDescription>
      </Alert>

      <Card className="rounded-2xl border-slate-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            Usuários e Permissões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.map(user => {
              const userPerm = permissions.find(p => p.user_email === user.email);
              const pagesCount = userPerm?.allowed_pages?.length || 0;
              
              return (
                <div key={user.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-slate-900">{user.full_name}</p>
                      <Badge className={`${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'} border-0 text-xs`}>
                        {user.role === 'admin' ? 'Admin' : 'Usuário'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600">{user.email}</p>
                    {pagesCount > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
                          <Eye className="w-3 h-3 mr-1" />
                          {pagesCount} páginas
                        </Badge>
                        {userPerm.permissions && Object.values(userPerm.permissions).filter(Boolean).length > 0 && (
                          <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">
                            <Lock className="w-3 h-3 mr-1" />
                            {Object.values(userPerm.permissions).filter(Boolean).length} permissões
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                    onClick={() => openEditDialog(user)}
                  >
                    <Settings className="w-3 h-3 mr-2" />
                    Configurar
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-2xl max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Permissões - {selectedUser?.full_name}</DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6 pt-4">
              {/* Páginas Acessíveis */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <MenuIcon className="w-4 h-4 text-blue-600" />
                  Páginas no Menu
                </h3>
                <div className="space-y-4">
                  {Object.entries(pagesByCategory).map(([category, pages]) => (
                    <div key={category} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <p className="text-xs font-semibold text-slate-600 mb-3 uppercase">{category}</p>
                      <div className="grid grid-cols-2 gap-3">
                        {pages.map(({ page, name }) => (
                          <div key={page} className="flex items-center justify-between bg-white rounded-lg p-3 border border-slate-200">
                            <label className="flex items-center gap-2 cursor-pointer flex-1">
                              <Checkbox
                                checked={formData.allowed_pages.includes(page)}
                                onCheckedChange={() => togglePage(page)}
                              />
                              <span className="text-sm text-slate-900">{name}</span>
                            </label>
                            {formData.allowed_pages.includes(page) && (
                              <div className="flex gap-1 ml-2">
                                <button
                                  onClick={() => movePageUp(page)}
                                  className="p-1 hover:bg-slate-100 rounded"
                                  disabled={(formData.menu_order.length > 0 ? formData.menu_order : formData.allowed_pages).indexOf(page) === 0}
                                >
                                  <ChevronUp className="w-3 h-3 text-slate-400" />
                                </button>
                                <button
                                  onClick={() => movePageDown(page)}
                                  className="p-1 hover:bg-slate-100 rounded"
                                  disabled={(formData.menu_order.length > 0 ? formData.menu_order : formData.allowed_pages).indexOf(page) === formData.allowed_pages.length - 1}
                                >
                                  <ChevronDown className="w-3 h-3 text-slate-400" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Permissões Granulares */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  Permissões Específicas
                </h3>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="grid grid-cols-2 gap-3">
                    {permissionsList.map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer bg-white rounded-lg p-3 border border-slate-200">
                        <Checkbox
                          checked={formData.permissions[key] || false}
                          onCheckedChange={() => togglePermission(key)}
                        />
                        <span className="text-sm text-slate-900">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl"
                onClick={handleSave}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? "Salvando..." : "Salvar Permissões"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}