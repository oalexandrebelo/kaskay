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
  Target, Plus, Building2, Phone, Mail, User, Calendar, 
  TrendingUp, CheckCircle2, Clock, XCircle, FileText, Eye
} from "lucide-react";

const stageColors = {
  prospecção: "bg-blue-100 text-blue-700",
  contato_inicial: "bg-purple-100 text-purple-700",
  reunião_agendada: "bg-indigo-100 text-indigo-700",
  proposta_enviada: "bg-amber-100 text-amber-700",
  negociação: "bg-orange-100 text-orange-700",
  ganho: "bg-emerald-100 text-emerald-700",
  perdido: "bg-red-100 text-red-700",
};

export default function ConvenioProspection() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [newProspect, setNewProspect] = useState({
    convenio_name: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    employer_type: "municipal",
    estimated_employees: "",
    stage: "prospecção",
    notes: "",
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["convenio_prospects"],
    queryFn: () => base44.entities.Lead.filter({ tags: { $contains: "convênio" } }),
  });

  const createProspectMutation = useMutation({
    mutationFn: (data) => base44.entities.Lead.create({ ...data, tags: ["convênio"], lead_source: "prospecção" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["convenio_prospects"] });
      setIsCreating(false);
      setNewProspect({
        convenio_name: "",
        contact_name: "",
        contact_email: "",
        contact_phone: "",
        employer_type: "municipal",
        estimated_employees: "",
        stage: "prospecção",
        notes: "",
      });
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage }) => base44.entities.Lead.update(id, { stage }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["convenio_prospects"] });
    },
  });

  // Stats
  const stageCounts = leads.reduce((acc, lead) => {
    acc[lead.stage] = (acc[lead.stage] || 0) + 1;
    return acc;
  }, {});

  const conversionRate = leads.length > 0
    ? ((leads.filter(l => l.stage === "ganho").length / leads.length) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Prospecção de Convênios</h1>
          <p className="text-slate-500 text-sm mt-1">
            Gerencie o pipeline comercial de novos convênios e parcerias
          </p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button className="rounded-lg">
              <Plus className="w-4 h-4 mr-2" />
              Novo Convênio
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Convênio</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome do Órgão/Convênio *</Label>
                <Input
                  value={newProspect.convenio_name}
                  onChange={(e) => setNewProspect({...newProspect, convenio_name: e.target.value})}
                  placeholder="Ex: Prefeitura Municipal de São Paulo"
                  className="rounded-lg mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo de Órgão</Label>
                  <Select 
                    value={newProspect.employer_type} 
                    onValueChange={(v) => setNewProspect({...newProspect, employer_type: v})}
                  >
                    <SelectTrigger className="rounded-lg mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="federal">Federal</SelectItem>
                      <SelectItem value="estadual">Estadual</SelectItem>
                      <SelectItem value="municipal">Municipal</SelectItem>
                      <SelectItem value="autarquia">Autarquia</SelectItem>
                      <SelectItem value="fundacao">Fundação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Funcionários Estimados</Label>
                  <Input
                    type="number"
                    value={newProspect.estimated_employees}
                    onChange={(e) => setNewProspect({...newProspect, estimated_employees: e.target.value})}
                    placeholder="5000"
                    className="rounded-lg mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>Nome do Contato</Label>
                <Input
                  value={newProspect.contact_name}
                  onChange={(e) => setNewProspect({...newProspect, contact_name: e.target.value})}
                  placeholder="João Silva"
                  className="rounded-lg mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newProspect.contact_email}
                    onChange={(e) => setNewProspect({...newProspect, contact_email: e.target.value})}
                    placeholder="contato@email.com"
                    className="rounded-lg mt-1"
                  />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={newProspect.contact_phone}
                    onChange={(e) => setNewProspect({...newProspect, contact_phone: e.target.value})}
                    placeholder="(11) 99999-9999"
                    className="rounded-lg mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea
                  value={newProspect.notes}
                  onChange={(e) => setNewProspect({...newProspect, notes: e.target.value})}
                  placeholder="Notas sobre o convênio..."
                  className="rounded-lg mt-1"
                  rows={3}
                />
              </div>
              <Button 
                onClick={() => createProspectMutation.mutate(newProspect)} 
                className="w-full rounded-lg"
                disabled={!newProspect.convenio_name}
              >
                Adicionar à Prospecção
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
                <p className="text-sm text-slate-500">Total em Pipeline</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{leads.length}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Em Negociação</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stageCounts.negociação || 0}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <Target className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Convertidos</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stageCounts.ganho || 0}</p>
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
                <p className="text-sm text-slate-500">Taxa de Conversão</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{conversionRate}%</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Kanban */}
      <div className="grid grid-cols-7 gap-3">
        {Object.entries(stageColors).map(([stage, colorClass]) => {
          const stageLeads = leads.filter(l => l.stage === stage);
          return (
            <div key={stage} className="space-y-2">
              <div className={`${colorClass} rounded-lg p-2 text-center`}>
                <p className="text-xs font-semibold capitalize">{stage.replace("_", " ")}</p>
                <p className="text-lg font-bold">{stageLeads.length}</p>
              </div>
              <div className="space-y-2">
                {stageLeads.map(lead => (
                  <Card key={lead.id} className="rounded-lg border-slate-100 cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <p className="text-xs font-semibold text-slate-900 truncate">{lead.full_name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{lead.employer}</p>
                      {lead.contact_name && (
                        <p className="text-[10px] text-slate-400 mt-1 truncate">📞 {lead.contact_name}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lista Completa */}
      <Card className="rounded-xl border-slate-100">
        <CardHeader>
          <CardTitle className="text-sm">Todos os Convênios ({leads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {leads.map(lead => (
              <div key={lead.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-700" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-slate-900">{lead.full_name}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      {lead.employer && <span>📍 {lead.employer}</span>}
                      {lead.contact_name && (
                        <>
                          <span>•</span>
                          <User className="w-3 h-3" />
                          <span>{lead.contact_name}</span>
                        </>
                      )}
                      {lead.contact_phone && (
                        <>
                          <span>•</span>
                          <Phone className="w-3 h-3" />
                          <span>{lead.contact_phone}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge className={stageColors[lead.stage]}>
                    {lead.stage?.replace("_", " ")}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Select 
                    value={lead.stage} 
                    onValueChange={(newStage) => updateStageMutation.mutate({ id: lead.id, stage: newStage })}
                  >
                    <SelectTrigger className="w-40 h-8 rounded-lg text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(stageColors).map(stage => (
                        <SelectItem key={stage} value={stage}>
                          {stage.replace("_", " ")}
                        </SelectItem>
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