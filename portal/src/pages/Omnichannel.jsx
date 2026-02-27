import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  MessageSquare, Phone, Mail, Clock, CheckCircle2, AlertCircle,
  XCircle, User, Search, Filter, Plus, Send, Headphones,
  Instagram, Facebook, Globe, AlertTriangle, TrendingUp, Users
} from "lucide-react";

const channelIcons = {
  whatsapp: MessageSquare,
  email: Mail,
  telefone: Phone,
  chat_web: Globe,
  instagram: Instagram,
  facebook: Facebook,
  presencial: User,
};

const statusColors = {
  novo: "bg-blue-100 text-blue-700",
  em_atendimento: "bg-purple-100 text-purple-700",
  aguardando_cliente: "bg-amber-100 text-amber-700",
  aguardando_interno: "bg-orange-100 text-orange-700",
  resolvido: "bg-emerald-100 text-emerald-700",
  fechado: "bg-slate-100 text-slate-500",
  cancelado: "bg-red-100 text-red-700",
};

const priorityColors = {
  baixa: "bg-slate-100 text-slate-600",
  media: "bg-blue-100 text-blue-600",
  alta: "bg-orange-100 text-orange-600",
  critica: "bg-red-100 text-red-600",
};

export default function Omnichannel() {
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterChannel, setFilterChannel] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [responseText, setResponseText] = useState("");

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["tickets"],
    queryFn: () => base44.entities.Ticket.list("-created_date"),
  });

  const { data: currentUser } = useQuery({
    queryKey: ["current_user"],
    queryFn: () => base44.auth.me(),
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ["interactions", selectedTicket?.id],
    queryFn: () => base44.entities.Interaction.filter({ ticket_id: selectedTicket?.id }),
    enabled: !!selectedTicket,
  });

  const updateTicketMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Ticket.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  const createInteractionMutation = useMutation({
    mutationFn: (data) => base44.entities.Interaction.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interactions"] });
      setResponseText("");
    },
  });

  // Filtros
  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = filterStatus === "all" || ticket.status === filterStatus;
    const matchesChannel = filterChannel === "all" || ticket.channel === filterChannel;
    const matchesSearch = !searchTerm || 
      ticket.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticket_number?.includes(searchTerm) ||
      ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesChannel && matchesSearch;
  });

  // Stats
  const totalTickets = tickets.length;
  const openTickets = tickets.filter(t => ["novo", "em_atendimento", "aguardando_cliente", "aguardando_interno"].includes(t.status)).length;
  const avgResolutionTime = tickets.filter(t => t.resolved_at).length > 0
    ? tickets.filter(t => t.resolved_at).reduce((sum, t) => {
        const created = new Date(t.created_date);
        const resolved = new Date(t.resolved_at);
        return sum + (resolved - created) / (1000 * 60 * 60);
      }, 0) / tickets.filter(t => t.resolved_at).length
    : 0;
  const slaBreached = tickets.filter(t => t.sla_breached).length;

  const handleSendResponse = () => {
    if (!responseText || !selectedTicket) return;
    
    createInteractionMutation.mutate({
      ticket_id: selectedTicket.id,
      client_id: selectedTicket.client_id,
      interaction_type: selectedTicket.channel === "email" ? "email" : "whatsapp",
      channel: selectedTicket.channel,
      direction: "outbound",
      subject: `Re: ${selectedTicket.subject}`,
      description: responseText,
      performed_by: currentUser?.email,
      outcome: "sucesso",
    });

    // Atualizar ticket para "em_atendimento"
    if (selectedTicket.status === "novo") {
      updateTicketMutation.mutate({
        id: selectedTicket.id,
        data: { 
          status: "em_atendimento",
          assigned_to: currentUser?.email,
          first_response_at: new Date().toISOString(),
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Atendimento Omnichannel</h1>
        <p className="text-slate-500 text-sm mt-1">
          Gerencie todos os canais de atendimento em uma única interface
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total de Tickets</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{totalTickets}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Headphones className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Abertos</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{openTickets}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Tempo Médio</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{avgResolutionTime.toFixed(1)}h</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">SLA Violado</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{slaBreached}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Tickets */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="rounded-xl border-slate-100">
            <CardHeader className="pb-3">
              <div className="space-y-3">
                <CardTitle className="text-sm">Tickets ({filteredTickets.length})</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 rounded-lg h-9 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="rounded-lg h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Status</SelectItem>
                      <SelectItem value="novo">Novo</SelectItem>
                      <SelectItem value="em_atendimento">Em Atendimento</SelectItem>
                      <SelectItem value="aguardando_cliente">Aguardando Cliente</SelectItem>
                      <SelectItem value="resolvido">Resolvido</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterChannel} onValueChange={setFilterChannel}>
                    <SelectTrigger className="rounded-lg h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Canais</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="telefone">Telefone</SelectItem>
                      <SelectItem value="chat_web">Chat Web</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {filteredTickets.map(ticket => {
                const ChannelIcon = channelIcons[ticket.channel] || MessageSquare;
                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedTicket?.id === ticket.id ? "bg-blue-50 border border-blue-200" : "bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <ChannelIcon className="w-4 h-4 text-slate-600" />
                        <span className="text-xs font-semibold text-slate-900">{ticket.client_name}</span>
                      </div>
                      <Badge className={`${priorityColors[ticket.priority]} text-[10px]`}>
                        {ticket.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-700 font-medium mb-2 line-clamp-1">{ticket.subject}</p>
                    <div className="flex items-center justify-between">
                      <Badge className={`${statusColors[ticket.status]} text-[10px]`}>
                        {ticket.status.replace("_", " ")}
                      </Badge>
                      <span className="text-[10px] text-slate-400">
                        #{ticket.ticket_number?.slice(-6)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Detalhes do Ticket */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <Card className="rounded-xl border-slate-100">
              <CardHeader className="border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{selectedTicket.subject}</CardTitle>
                    <p className="text-sm text-slate-500 mt-1">
                      {selectedTicket.client_name} • {selectedTicket.client_phone}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Select 
                      value={selectedTicket.status} 
                      onValueChange={(v) => updateTicketMutation.mutate({ id: selectedTicket.id, data: { status: v }})}
                    >
                      <SelectTrigger className="w-40 h-9 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="novo">Novo</SelectItem>
                        <SelectItem value="em_atendimento">Em Atendimento</SelectItem>
                        <SelectItem value="aguardando_cliente">Aguardando Cliente</SelectItem>
                        <SelectItem value="aguardando_interno">Aguardando Interno</SelectItem>
                        <SelectItem value="resolvido">Resolvido</SelectItem>
                        <SelectItem value="fechado">Fechado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {/* Descrição */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-slate-500 mb-2">DESCRIÇÃO INICIAL</p>
                  <p className="text-sm text-slate-700">{selectedTicket.description}</p>
                </div>

                {/* Interações */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500">HISTÓRICO</p>
                  {interactions.map(interaction => (
                    <div key={interaction.id} className={`p-3 rounded-lg ${
                      interaction.direction === "outbound" ? "bg-blue-50 ml-8" : "bg-slate-50 mr-8"
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-700">
                          {interaction.direction === "outbound" ? "Você" : selectedTicket.client_name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(interaction.created_date).toLocaleString("pt-BR")}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{interaction.description}</p>
                    </div>
                  ))}
                </div>

                {/* Resposta */}
                {selectedTicket.status !== "fechado" && selectedTicket.status !== "resolvido" && (
                  <div className="border-t pt-4">
                    <Label className="text-xs font-semibold text-slate-700 mb-2 block">RESPONDER</Label>
                    <Textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Digite sua resposta..."
                      className="rounded-lg mb-2"
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleSendResponse} className="rounded-lg" disabled={!responseText}>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Resposta
                      </Button>
                      <Button 
                        variant="outline" 
                        className="rounded-lg"
                        onClick={() => updateTicketMutation.mutate({ 
                          id: selectedTicket.id, 
                          data: { status: "resolvido", resolved_at: new Date().toISOString() }
                        })}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Marcar como Resolvido
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-xl border-slate-100 h-full flex items-center justify-center">
              <CardContent className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400">Selecione um ticket para visualizar detalhes</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}