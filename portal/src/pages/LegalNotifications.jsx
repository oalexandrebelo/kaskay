import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  AlertTriangle, Plus, Mail, Send, CheckCircle2, Clock, XCircle, Eye, Building2
} from "lucide-react";

const statusColors = {
  rascunho: "bg-slate-100 text-slate-600",
  pendente_envio: "bg-amber-100 text-amber-700",
  enviada: "bg-blue-100 text-blue-700",
  recebida: "bg-purple-100 text-purple-700",
  respondida: "bg-emerald-100 text-emerald-700",
  expirada: "bg-red-100 text-red-700",
};

export default function LegalNotifications() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [newNotification, setNewNotification] = useState({
    notification_type: "atraso_repasse",
    convenio_name: "",
    recipient_name: "",
    recipient_email: "",
    subject: "",
    message: "",
    priority: "media",
    deadline_date: "",
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["legal_notifications"],
    queryFn: () => base44.entities.LegalNotification.list("-created_date"),
  });

  const createNotificationMutation = useMutation({
    mutationFn: (data) => base44.entities.LegalNotification.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legal_notifications"] });
      setIsCreating(false);
      setNewNotification({
        notification_type: "atraso_repasse",
        convenio_name: "",
        recipient_name: "",
        recipient_email: "",
        subject: "",
        message: "",
        priority: "media",
        deadline_date: "",
      });
    },
  });

  // KPIs
  const pendingNotifications = notifications.filter(n => ["rascunho", "pendente_envio"].includes(n.status)).length;
  const sentNotifications = notifications.filter(n => ["enviada", "recebida"].includes(n.status)).length;
  const respondedNotifications = notifications.filter(n => n.status === "respondida").length;
  const expiredNotifications = notifications.filter(n => n.status === "expirada").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notificações Legais</h1>
          <p className="text-slate-500 text-sm mt-1">
            Notificações extrajudiciais para órgãos e empresas parceiras
          </p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button className="rounded-lg">
              <Plus className="w-4 h-4 mr-2" />
              Nova Notificação
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Criar Nova Notificação</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tipo de Notificação</Label>
                <Select 
                  value={newNotification.notification_type} 
                  onValueChange={(v) => setNewNotification({...newNotification, notification_type: v})}
                >
                  <SelectTrigger className="rounded-lg mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="atraso_repasse">Atraso no Repasse</SelectItem>
                    <SelectItem value="inadimplencia_orgao">Inadimplência do Órgão</SelectItem>
                    <SelectItem value="descumprimento_contrato">Descumprimento de Contrato</SelectItem>
                    <SelectItem value="renovacao_convenio">Renovação de Convênio</SelectItem>
                    <SelectItem value="vencimento_decreto">Vencimento de Decreto</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nome do Convênio/Órgão *</Label>
                <Input
                  value={newNotification.convenio_name}
                  onChange={(e) => setNewNotification({...newNotification, convenio_name: e.target.value})}
                  placeholder="Ex: Prefeitura Municipal de São Paulo"
                  className="rounded-lg mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nome do Destinatário</Label>
                  <Input
                    value={newNotification.recipient_name}
                    onChange={(e) => setNewNotification({...newNotification, recipient_name: e.target.value})}
                    placeholder="Nome completo"
                    className="rounded-lg mt-1"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newNotification.recipient_email}
                    onChange={(e) => setNewNotification({...newNotification, recipient_email: e.target.value})}
                    placeholder="email@exemplo.com"
                    className="rounded-lg mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>Assunto *</Label>
                <Input
                  value={newNotification.subject}
                  onChange={(e) => setNewNotification({...newNotification, subject: e.target.value})}
                  placeholder="Assunto da notificação"
                  className="rounded-lg mt-1"
                />
              </div>
              <div>
                <Label>Mensagem</Label>
                <Textarea
                  value={newNotification.message}
                  onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                  placeholder="Corpo da notificação..."
                  className="rounded-lg mt-1"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Prioridade</Label>
                  <Select 
                    value={newNotification.priority} 
                    onValueChange={(v) => setNewNotification({...newNotification, priority: v})}
                  >
                    <SelectTrigger className="rounded-lg mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Prazo de Resposta</Label>
                  <Input
                    type="date"
                    value={newNotification.deadline_date}
                    onChange={(e) => setNewNotification({...newNotification, deadline_date: e.target.value})}
                    className="rounded-lg mt-1"
                  />
                </div>
              </div>
              <Button 
                onClick={() => createNotificationMutation.mutate(newNotification)} 
                className="w-full rounded-lg"
                disabled={!newNotification.convenio_name || !newNotification.subject}
              >
                Criar Notificação
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pendentes</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{pendingNotifications}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Enviadas</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{sentNotifications}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Send className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Respondidas</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{respondedNotifications}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Expiradas</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{expiredNotifications}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Notificações */}
      <Card className="rounded-xl border-slate-100">
        <CardHeader>
          <CardTitle className="text-sm">Todas as Notificações ({notifications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {notifications.map(notification => (
              <div key={notification.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-amber-700" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-slate-900">{notification.subject}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <Building2 className="w-3 h-3" />
                      <span>{notification.convenio_name}</span>
                      {notification.recipient_name && (
                        <>
                          <span>•</span>
                          <span>{notification.recipient_name}</span>
                        </>
                      )}
                      <span>•</span>
                      <span className="capitalize">{notification.notification_type?.replace("_", " ")}</span>
                    </div>
                  </div>
                  <Badge className={statusColors[notification.status]}>
                    {notification.status?.replace("_", " ")}
                  </Badge>
                </div>
                <Button size="sm" variant="ghost" className="rounded-lg ml-2">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}