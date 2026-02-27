import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, TrendingUp, Phone, Mail, Calendar, Plus, Search, Filter,
  Target, CheckCircle2, XCircle, Clock, Star, MessageSquare,
  Building2, DollarSign, ArrowRight, Eye
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const stageColors = {
  novo: "bg-slate-100 text-slate-700",
  contato_inicial: "bg-blue-100 text-blue-700",
  qualificado: "bg-purple-100 text-purple-700",
  proposta_enviada: "bg-indigo-100 text-indigo-700",
  negociacao: "bg-amber-100 text-amber-700",
  ganho: "bg-emerald-100 text-emerald-700",
  perdido: "bg-red-100 text-red-700",
};

const stageLabels = {
  novo: "Novo",
  contato_inicial: "Contato Inicial",
  qualificado: "Qualificado",
  proposta_enviada: "Proposta Enviada",
  negociacao: "Negociação",
  ganho: "Ganho",
  perdido: "Perdido",
};

export default function CRM() {
  const queryClient = useQueryClient();
  const [selectedStage, setSelectedStage] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreatingLead, setIsCreatingLead] = useState(false);
  const [newLead, setNewLead] = useState({
    full_name: "",
    phone: "",
    email: "",
    employer: "",
    lead_source: "whatsapp",
  });

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: () => base44.entities.Lead.list("-created_date"),
  });

  const { data: currentUser } = useQuery({
    queryKey: ["current_user"],
    queryFn: () => base44.auth.me(),
  });

  const createLeadMutation = useMutation({
    mutationFn: (leadData) => base44.entities.Lead.create(leadData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setIsCreatingLead(false);
      setNewLead({ full_name: "", phone: "", email: "", employer: "", lead_source: "whatsapp" });
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lead.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  // Filtros
  const filteredLeads = leads.filter(lead => {
    const matchesStage = selectedStage === "all" || lead.stage === selectedStage;
    const matchesSearch = !searchTerm || 
      lead.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.includes(searchTerm) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStage && matchesSearch;
  });

  // Stats por estágio
  const stageCounts = leads.reduce((acc, lead) => {
    acc[lead.stage] = (acc[lead.stage] || 0) + 1;
    return acc;
  }, {});

  const totalValue = leads
    .filter(l => l.stage !== "perdido" && l.stage !== "ganho")
    .reduce((sum, l) => sum + (l.estimated_value || 0), 0);

  const conversionRate = leads.length > 0
    ? ((leads.filter(l => l.stage === "ganho").length / leads.length) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">CRM & Pipeline de Vendas</h1>
          <p className="text-slate-500 text-sm mt-1">
            Gerencie leads e oportunidades em um funil de vendas completo
          </p>
        </div>
        <Dialog open={isCreatingLead} onOpenChange={setIsCreatingLead}>
          <DialogTrigger asChild>
            <Button className="rounded-lg">
              <Plus className="w-4 h-4 mr-2" />
              Novo Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Novo Lead</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome Completo *</Label>
                <Input
                  value={newLead.full_name}
                  onChange={(e) => setNewLead({...newLead, full_name: e.target.value})}
                  placeholder="João Silva"
                  className="rounded-lg mt-1"
                />
              </div>
              <div>
                <Label>Telefone *</Label>
                <Input
                  value={newLead.phone}
                  onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                  placeholder="(11) 99999-9999"
                  className="rounded-lg mt-1"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newLead.email}
                  onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                  placeholder="joao@email.com"
                  className="rounded-lg mt-1"
                />
              </div>
              <div>
                <Label>Órgão</Label>
                <Input
                  value={newLead.employer}
                  onChange={(e) => setNewLead({...newLead, employer: e.target.value})}
                  placeholder="Prefeitura Municipal"
                  className="rounded-lg mt-1"
                />
              </div>
              <div>
                <Label>Origem do Lead</Label>
                <Select value={newLead.lead_source} onValueChange={(v) => setNewLead({...newLead, lead_source: v})}>
                  <SelectTrigger className="rounded-lg mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="indicacao">Indicação</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="evento">Evento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={() => createLeadMutation.mutate(newLead)} 
                className="w-full rounded-lg"
                disabled={!newLead.full_name || !newLead.phone}
              >
                Criar Lead
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
                <p className="text-sm text-slate-500">Total de Leads</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{leads.length}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Em Negociação</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stageCounts.negociacao || 0}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <Target className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Taxa de Conversão</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{conversionRate}%</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Valor em Pipeline</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  R$ {(totalValue / 1000).toFixed(0)}k
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 rounded-lg"
          />
        </div>
        <Select value={selectedStage} onValueChange={setSelectedStage}>
          <SelectTrigger className="w-48 rounded-lg">
            <SelectValue placeholder="Filtrar por estágio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Estágios</SelectItem>
            {Object.entries(stageLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Pipeline Visual */}
      <div className="grid grid-cols-7 gap-3">
        {Object.entries(stageLabels).map(([stage, label]) => (
          <div key={stage} className="space-y-2">
            <div className={`${stageColors[stage]} rounded-lg p-2 text-center`}>
              <p className="text-xs font-semibold">{label}</p>
              <p className="text-lg font-bold">{stageCounts[stage] || 0}</p>
            </div>
            <div className="space-y-2">
              {leads.filter(l => l.stage === stage).slice(0, 3).map(lead => (
                <Card key={lead.id} className="rounded-lg border-slate-100 cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <p className="text-xs font-semibold text-slate-900 truncate">{lead.full_name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{lead.phone}</p>
                    {lead.estimated_value > 0 && (
                      <p className="text-[10px] text-emerald-600 font-medium mt-1">
                        R$ {lead.estimated_value.toFixed(0)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Lista Detalhada */}
      <Card className="rounded-xl border-slate-100">
        <CardHeader>
          <CardTitle className="text-sm">Todos os Leads ({filteredLeads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredLeads.map(lead => (
              <div key={lead.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-700">
                      {lead.full_name?.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-slate-900">{lead.full_name}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <Phone className="w-3 h-3" />
                      <span>{lead.phone}</span>
                      {lead.email && (
                        <>
                          <span>•</span>
                          <Mail className="w-3 h-3" />
                          <span>{lead.email}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge className={stageColors[lead.stage]}>
                    {stageLabels[lead.stage]}
                  </Badge>
                  {lead.lead_source && (
                    <Badge variant="outline" className="text-xs">
                      {lead.lead_source}
                    </Badge>
                  )}
                  {lead.assigned_to && (
                    <div className="text-xs text-slate-500">
                      👤 {lead.assigned_to}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Select 
                    value={lead.stage} 
                    onValueChange={(newStage) => updateLeadMutation.mutate({ id: lead.id, data: { stage: newStage }})}
                  >
                    <SelectTrigger className="w-40 h-8 rounded-lg text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(stageLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="ghost" className="rounded-lg">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}