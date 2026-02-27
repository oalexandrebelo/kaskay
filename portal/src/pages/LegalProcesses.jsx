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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, Plus, Scale, Calendar, User, AlertTriangle, 
  CheckCircle2, Clock, TrendingUp, Eye, Gavel
} from "lucide-react";

const statusColors = {
  em_andamento: "bg-blue-100 text-blue-700",
  aguardando_julgamento: "bg-amber-100 text-amber-700",
  sentenca_favoravel: "bg-emerald-100 text-emerald-700",
  sentenca_desfavoravel: "bg-red-100 text-red-700",
  recurso: "bg-purple-100 text-purple-700",
  arquivado: "bg-slate-100 text-slate-600",
  acordo: "bg-green-100 text-green-700",
};

const priorityColors = {
  baixa: "bg-slate-100 text-slate-600",
  media: "bg-blue-100 text-blue-700",
  alta: "bg-orange-100 text-orange-700",
  urgente: "bg-red-100 text-red-700",
};

export default function LegalProcesses() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTab, setSelectedTab] = useState("all");
  const [newProcess, setNewProcess] = useState({
    process_number: "",
    process_type: "acao_cliente",
    status: "em_andamento",
    priority: "media",
    court: "",
    filing_date: "",
    summary: "",
    lawyer_responsible: "",
    claim_value: "",
  });

  const { data: processes = [] } = useQuery({
    queryKey: ["legal_processes"],
    queryFn: () => base44.entities.LegalProcess.list("-filing_date"),
  });

  const createProcessMutation = useMutation({
    mutationFn: (data) => base44.entities.LegalProcess.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legal_processes"] });
      setIsCreating(false);
      setNewProcess({
        process_number: "",
        process_type: "acao_cliente",
        status: "em_andamento",
        priority: "media",
        court: "",
        filing_date: "",
        summary: "",
        lawyer_responsible: "",
        claim_value: "",
      });
    },
  });

  // KPIs
  const activeProcesses = processes.filter(p => 
    ["em_andamento", "aguardando_julgamento", "recurso"].includes(p.status)
  ).length;
  const favorableOutcomes = processes.filter(p => p.status === "sentenca_favoravel").length;
  const urgentProcesses = processes.filter(p => p.priority === "urgente").length;
  const totalClaimValue = processes.reduce((sum, p) => sum + (p.claim_value || 0), 0);

  // Filtrar por tab
  const filteredProcesses = selectedTab === "all" 
    ? processes 
    : processes.filter(p => p.process_type === selectedTab);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Processos Jurídicos</h1>
          <p className="text-slate-500 text-sm mt-1">
            Gestão de ações judiciais, defesas e processos administrativos
          </p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button className="rounded-lg">
              <Plus className="w-4 h-4 mr-2" />
              Novo Processo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Processo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <Label>Número do Processo *</Label>
                <Input
                  value={newProcess.process_number}
                  onChange={(e) => setNewProcess({...newProcess, process_number: e.target.value})}
                  placeholder="Ex: 0001234-56.2025.8.26.0100"
                  className="rounded-lg mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo de Processo</Label>
                  <Select 
                    value={newProcess.process_type} 
                    onValueChange={(v) => setNewProcess({...newProcess, process_type: v})}
                  >
                    <SelectTrigger className="rounded-lg mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="acao_cliente">Ação Cliente</SelectItem>
                      <SelectItem value="notificacao_orgao">Notificação Órgão</SelectItem>
                      <SelectItem value="cobranca_judicial">Cobrança Judicial</SelectItem>
                      <SelectItem value="revisional">Revisional</SelectItem>
                      <SelectItem value="reclamacao_trabalhista">Trabalhista</SelectItem>
                      <SelectItem value="defesa_consumidor">Defesa Consumidor</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Prioridade</Label>
                  <Select 
                    value={newProcess.priority} 
                    onValueChange={(v) => setNewProcess({...newProcess, priority: v})}
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
              </div>
              <div>
                <Label>Vara/Tribunal</Label>
                <Input
                  value={newProcess.court}
                  onChange={(e) => setNewProcess({...newProcess, court: e.target.value})}
                  placeholder="Ex: 1ª Vara Cível de São Paulo"
                  className="rounded-lg mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Data de Protocolo</Label>
                  <Input
                    type="date"
                    value={newProcess.filing_date}
                    onChange={(e) => setNewProcess({...newProcess, filing_date: e.target.value})}
                    className="rounded-lg mt-1"
                  />
                </div>
                <div>
                  <Label>Valor da Causa</Label>
                  <Input
                    type="number"
                    value={newProcess.claim_value}
                    onChange={(e) => setNewProcess({...newProcess, claim_value: e.target.value})}
                    placeholder="R$ 0,00"
                    className="rounded-lg mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>Advogado Responsável</Label>
                <Input
                  value={newProcess.lawyer_responsible}
                  onChange={(e) => setNewProcess({...newProcess, lawyer_responsible: e.target.value})}
                  placeholder="Nome do advogado"
                  className="rounded-lg mt-1"
                />
              </div>
              <div>
                <Label>Resumo do Processo</Label>
                <Textarea
                  value={newProcess.summary}
                  onChange={(e) => setNewProcess({...newProcess, summary: e.target.value})}
                  placeholder="Descreva brevemente o objeto da ação..."
                  className="rounded-lg mt-1"
                  rows={3}
                />
              </div>
              <Button 
                onClick={() => createProcessMutation.mutate(newProcess)} 
                className="w-full rounded-lg"
                disabled={!newProcess.process_number}
              >
                Cadastrar Processo
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
                <p className="text-sm text-slate-500">Processos Ativos</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{activeProcesses}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Gavel className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Sentenças Favoráveis</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{favorableOutcomes}</p>
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
                <p className="text-sm text-slate-500">Urgentes</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{urgentProcesses}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Valor Total</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalClaimValue)}
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="all" className="rounded-lg">Todos</TabsTrigger>
          <TabsTrigger value="acao_cliente" className="rounded-lg">Ações Clientes</TabsTrigger>
          <TabsTrigger value="notificacao_orgao" className="rounded-lg">Notificações Órgãos</TabsTrigger>
          <TabsTrigger value="cobranca_judicial" className="rounded-lg">Cobranças</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-4">
          <Card className="rounded-xl border-slate-100">
            <CardHeader>
              <CardTitle className="text-sm">
                {selectedTab === "all" ? "Todos os Processos" : "Processos Filtrados"} ({filteredProcesses.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredProcesses.map(process => (
                  <div key={process.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Scale className="w-5 h-5 text-blue-700" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-slate-900">{process.process_number}</p>
                          <Badge className={priorityColors[process.priority]}>{process.priority}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span className="capitalize">{process.process_type?.replace("_", " ")}</span>
                          {process.court && (
                            <>
                              <span>•</span>
                              <span>{process.court}</span>
                            </>
                          )}
                          {process.filing_date && (
                            <>
                              <span>•</span>
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(process.filing_date).toLocaleDateString('pt-BR')}</span>
                            </>
                          )}
                          {process.lawyer_responsible && (
                            <>
                              <span>•</span>
                              <User className="w-3 h-3" />
                              <span>{process.lawyer_responsible}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={statusColors[process.status]}>
                          {process.status?.replace("_", " ")}
                        </Badge>
                        {process.claim_value > 0 && (
                          <p className="text-xs text-slate-500 mt-1">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(process.claim_value)}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="rounded-lg ml-2">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}