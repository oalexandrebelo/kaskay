import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Shield, Mail, Briefcase, Code, UserPlus, Loader2, Key, Trash2, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const roleLabels = {
  admin: { label: "Administrador", color: "bg-red-100 text-red-700", permissions: "Acesso total" },
  manager: { label: "Gerente", color: "bg-purple-100 text-purple-700", permissions: "Gestão operacional" },
  analyst: { label: "Analista", color: "bg-blue-100 text-blue-700", permissions: "Análise e aprovação" },
  collection_agent: { label: "Cobrança", color: "bg-orange-100 text-orange-700", permissions: "Gestão de cobranças" },
  support: { label: "Suporte", color: "bg-green-100 text-green-700", permissions: "Atendimento" },
  viewer: { label: "Visualizador", color: "bg-slate-100 text-slate-600", permissions: "Somente leitura" },
};

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    full_name: "",
    role: "viewer",
    department: "",
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: "",
    full_name: "",
    role: "viewer",
    department: "",
  });

  const { data: currentUser } = useQuery({
    queryKey: ["current_user"],
    queryFn: () => base44.auth.me(),
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  const inviteUserMutation = useMutation({
    mutationFn: async () => {
      await base44.users.inviteUser(inviteForm.email, inviteForm.role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setInviteOpen(false);
      setInviteForm({ email: "", full_name: "", role: "viewer", department: "" });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async () => {
      await base44.users.inviteUser(createForm.email, createForm.role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setCreateOpen(false);
      setCreateForm({ email: "", full_name: "", role: "viewer", department: "" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId) => {
      await base44.functions.invoke('resetUserPassword', { userId, tempPassword: 'mudar@123' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: ({ id, isActive }) => base44.entities.User.update(id, { is_active: isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  if (currentUser?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md rounded-2xl border-red-100 bg-red-50/50">
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">Acesso Restrito</h3>
            <p className="text-sm text-red-700">Apenas administradores podem acessar esta página.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <div>
           <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestão de Usuários</h1>
           <p className="text-slate-500 text-sm mt-1">Controle de acesso, permissões e autenticação</p>
         </div>
         <div className="flex gap-2">
           <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
             <DialogTrigger asChild>
               <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl">
                 <Mail className="w-4 h-4 mr-2" />
                 Convidar via Email
               </Button>
             </DialogTrigger>
             <DialogContent className="rounded-2xl">
               <DialogHeader>
                 <DialogTitle>Convidar Novo Usuário</DialogTitle>
               </DialogHeader>
               <div className="space-y-4 pt-4">
                 <div>
                   <Label>E-mail</Label>
                   <Input
                     type="email"
                     placeholder="usuario@empresa.com"
                     value={inviteForm.email}
                     onChange={e => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                     className="rounded-xl mt-1"
                   />
                 </div>
                 <div>
                   <Label>Perfil de Acesso</Label>
                   <Select value={inviteForm.role} onValueChange={v => setInviteForm(prev => ({ ...prev, role: v }))}>
                     <SelectTrigger className="rounded-xl mt-1">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       {Object.entries(roleLabels).map(([key, val]) => (
                         <SelectItem key={key} value={key}>
                           {val.label} - {val.permissions}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
                 <Button
                   className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl"
                   onClick={() => inviteUserMutation.mutate()}
                   disabled={!inviteForm.email || inviteUserMutation.isPending}
                 >
                   {inviteUserMutation.isPending ? (
                     <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                   ) : (
                     <Mail className="w-4 h-4 mr-2" />
                   )}
                   Enviar Convite
                 </Button>
               </div>
             </DialogContent>
           </Dialog>

           <Dialog open={createOpen} onOpenChange={setCreateOpen}>
             <DialogTrigger asChild>
               <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-xl">
                 <UserPlus className="w-4 h-4 mr-2" />
                 Criar Usuário
               </Button>
             </DialogTrigger>
             <DialogContent className="rounded-2xl">
               <DialogHeader>
                 <DialogTitle>Criar Novo Usuário Manualmente</DialogTitle>
               </DialogHeader>
               <div className="space-y-4 pt-4">
                 <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                   <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                   <p className="text-xs text-amber-700">Usuário receberá senha temporária: <strong>mudar@123</strong></p>
                 </div>
                 <div>
                   <Label>E-mail</Label>
                   <Input
                     type="email"
                     placeholder="usuario@empresa.com"
                     value={createForm.email}
                     onChange={e => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                     className="rounded-xl mt-1"
                   />
                 </div>
                 <div>
                   <Label>Nome Completo</Label>
                   <Input
                     placeholder="Nome do usuário"
                     value={createForm.full_name}
                     onChange={e => setCreateForm(prev => ({ ...prev, full_name: e.target.value }))}
                     className="rounded-xl mt-1"
                   />
                 </div>
                 <div>
                   <Label>Perfil de Acesso</Label>
                   <Select value={createForm.role} onValueChange={v => setCreateForm(prev => ({ ...prev, role: v }))}>
                     <SelectTrigger className="rounded-xl mt-1">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       {Object.entries(roleLabels).map(([key, val]) => (
                         <SelectItem key={key} value={key}>
                           {val.label} - {val.permissions}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
                 <Button
                   className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                   onClick={() => createUserMutation.mutate()}
                   disabled={!createForm.email || !createForm.full_name || createUserMutation.isPending}
                 >
                   {createUserMutation.isPending ? (
                     <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                   ) : (
                     <UserPlus className="w-4 h-4 mr-2" />
                   )}
                   Criar Usuário
                 </Button>
               </div>
             </DialogContent>
           </Dialog>
         </div>
       </div>

      {isLoading ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="text-xs font-semibold text-slate-500 uppercase">Usuário</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase">Perfil</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase">Status</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase">Último Acesso</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
               {users.length === 0 && (
                 <TableRow>
                   <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                     Nenhum usuário encontrado
                   </TableCell>
                 </TableRow>
               )}
               {users.map(user => (
                 <TableRow key={user.id} className="hover:bg-slate-50/50">
                   <TableCell>
                     <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs">
                         {user.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                       </div>
                       <div>
                         <p className="text-sm font-medium text-slate-900">{user.full_name || "—"}</p>
                         <p className="text-xs text-slate-400">{user.email}</p>
                       </div>
                     </div>
                   </TableCell>
                   <TableCell>
                     <Badge className={`${roleLabels[user.role]?.color || "bg-slate-100 text-slate-600"} border-0 text-xs`}>
                       {roleLabels[user.role]?.label || user.role}
                     </Badge>
                   </TableCell>
                   <TableCell>
                     <Badge className={user.is_active !== false ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}>
                       {user.is_active !== false ? "Ativo" : "Inativo"}
                     </Badge>
                   </TableCell>
                   <TableCell className="text-xs text-slate-400">
                      {user.last_login ? format(new Date(user.last_login), "dd/MM/yy HH:mm") : "Nunca"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => resetPasswordMutation.mutate(user.id)}
                          disabled={resetPasswordMutation.isPending || user.id === currentUser?.id}
                          className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          title="Resetar senha para mudar@123"
                        >
                          {resetPasswordMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Key className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleUserStatusMutation.mutate({ id: user.id, isActive: user.is_active === false })}
                          disabled={user.id === currentUser?.id || toggleUserStatusMutation.isPending}
                          className={user.is_active !== false ? "text-slate-600 hover:text-red-600 hover:bg-red-50" : "text-slate-600 hover:text-green-600 hover:bg-green-50"}
                          title={user.is_active !== false ? "Inativar usuário" : "Ativar usuário"}
                        >
                          {toggleUserStatusMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                   </TableRow>
                   ))}
                   </TableBody>
          </Table>
        </div>
      )}

      <Card className="rounded-2xl border-slate-100 bg-slate-50/50">
         <CardHeader className="pb-3">
           <CardTitle className="text-base flex items-center gap-2">
             <Shield className="w-4 h-4 text-slate-600" /> Níveis de Acesso e Informações
           </CardTitle>
         </CardHeader>
         <CardContent className="space-y-6">
           <div>
             <h3 className="text-sm font-semibold text-slate-900 mb-3">Perfis de Acesso</h3>
             <div className="space-y-2 text-sm">
               {Object.entries(roleLabels).map(([key, val]) => (
                 <div key={key} className="flex items-start gap-3 bg-white rounded-lg p-3 border border-slate-200">
                   <Badge className={`${val.color} border-0 text-xs mt-0.5`}>{val.label}</Badge>
                   <p className="text-slate-600 flex-1">{val.permissions}</p>
                 </div>
               ))}
             </div>
           </div>

           <div className="border-t pt-4">
             <h3 className="text-sm font-semibold text-slate-900 mb-3">Sobre Senhas</h3>
             <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 space-y-2">
               <p>• <strong>Senha Temporária:</strong> Todos os usuários novos recebem a senha <code className="bg-white px-1 rounded">mudar@123</code></p>
               <p>• <strong>Resetar Senha:</strong> Use o botão de chave (🔑) para resetar a senha de qualquer usuário para a senha temporária</p>
               <p>• <strong>Primeiro Acesso:</strong> Ao fazer login com a senha temporária, o usuário é obrigado a criar uma nova senha segura</p>
             </div>
           </div>
         </CardContent>
       </Card>
    </div>
  );
}