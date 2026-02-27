import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Plus, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  Zap,
  CheckCircle2,
  Edit,
  Loader2
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const verificationTypes = {
  bureau_ph3a: { label: "Bureau Ph3A", defaultCost: 2.50, defaultCache: 30 },
  bureau_nova_vida: { label: "Bureau Nova Vida", defaultCost: 3.00, defaultCache: 30 },
  portal_transparencia: { label: "Portal da Transparência", defaultCost: 0.50, defaultCache: 60 },
  margin_manager: { label: "Gestora de Margem", defaultCost: 1.50, defaultCache: 7 },
};

const triggers = [
  { value: "new_client", label: "Novo Cliente" },
  { value: "new_proposal", label: "Nova Proposta" },
  { value: "data_change", label: "Mudança de Dados" },
  { value: "manual_request", label: "Requisição Manual" },
];

const initialForm = {
  name: "",
  verification_type: "bureau_ph3a",
  trigger_on: ["new_proposal"],
  cache_duration_days: "30",
  cost_per_query: "2.50",
  is_active: true,
  priority: "0",
  required_for_approval: false,
  skip_if_similar_recent: true,
};

export default function VerificationSettings() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [form, setForm] = useState(initialForm);

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["verification_rules"],
    queryFn: () => base44.entities.VerificationRule.list(),
  });

  const { data: verifications = [] } = useQuery({
    queryKey: ["all_verifications"],
    queryFn: () => base44.entities.ClientVerification.list("-verified_at", 1000),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        ...form,
        cache_duration_days: parseInt(form.cache_duration_days),
        cost_per_query: parseFloat(form.cost_per_query),
        priority: parseInt(form.priority),
      };

      if (editingRule) {
        await base44.entities.VerificationRule.update(editingRule.id, data);
      } else {
        await base44.entities.VerificationRule.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verification_rules"] });
      setDialogOpen(false);
      setEditingRule(null);
      setForm(initialForm);
    },
  });

  const openCreateDialog = () => {
    setEditingRule(null);
    setForm(initialForm);
    setDialogOpen(true);
  };

  const openEditDialog = (rule) => {
    setEditingRule(rule);
    setForm({
      name: rule.name || "",
      verification_type: rule.verification_type || "bureau_ph3a",
      trigger_on: rule.trigger_on || ["new_proposal"],
      cache_duration_days: (rule.cache_duration_days || 30).toString(),
      cost_per_query: (rule.cost_per_query || 0).toString(),
      is_active: rule.is_active !== false,
      priority: (rule.priority || 0).toString(),
      required_for_approval: rule.required_for_approval || false,
      skip_if_similar_recent: rule.skip_if_similar_recent !== false,
    });
    setDialogOpen(true);
  };

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleTrigger = (trigger) => {
    setForm(prev => ({
      ...prev,
      trigger_on: prev.trigger_on.includes(trigger)
        ? prev.trigger_on.filter(t => t !== trigger)
        : [...prev.trigger_on, trigger]
    }));
  };

  // Métricas
  const totalVerifications = verifications.length;
  const cacheHits = verifications.filter(v => v.cache_hit).length;
  const totalCost = verifications.reduce((sum, v) => sum + (v.cost_estimate || 0), 0);
  const estimatedSavings = cacheHits * 2.5; // Custo médio de uma consulta

  if (isLoading) {
    return <Skeleton className="h-96 rounded-2xl" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Otimização de Verificações</h1>
          <p className="text-slate-500 text-sm mt-1">Configure regras de cache para minimizar custos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl" onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Regra
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingRule ? "Editar Regra" : "Nova Regra de Verificação"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Nome da Regra</Label>
                <Input
                  value={form.name}
                  onChange={e => updateForm("name", e.target.value)}
                  className="rounded-xl mt-1"
                  placeholder="Ex: Verificação Ph3A para novas propostas"
                />
              </div>

              <div>
                <Label>Tipo de Verificação</Label>
                <Select value={form.verification_type} onValueChange={v => updateForm("verification_type", v)}>
                  <SelectTrigger className="rounded-xl mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(verificationTypes).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Acionar Quando</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {triggers.map(trigger => (
                    <div key={trigger.value} className="flex items-center gap-2">
                      <Switch
                        checked={form.trigger_on.includes(trigger.value)}
                        onCheckedChange={() => toggleTrigger(trigger.value)}
                      />
                      <span className="text-sm text-slate-700">{trigger.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cache (dias)</Label>
                  <Input
                    type="number"
                    value={form.cache_duration_days}
                    onChange={e => updateForm("cache_duration_days", e.target.value)}
                    className="rounded-xl mt-1"
                  />
                  <p className="text-xs text-slate-500 mt-1">Validade da verificação</p>
                </div>
                <div>
                  <Label>Custo por Consulta (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.cost_per_query}
                    onChange={e => updateForm("cost_per_query", e.target.value)}
                    className="rounded-xl mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>Prioridade</Label>
                <Select value={form.priority} onValueChange={v => updateForm("priority", v)}>
                  <SelectTrigger className="rounded-xl mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Crítica (sempre executar)</SelectItem>
                    <SelectItem value="1">Alta</SelectItem>
                    <SelectItem value="2">Média</SelectItem>
                    <SelectItem value="3">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={v => updateForm("is_active", v)}
                  />
                  <Label>Regra Ativa</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.required_for_approval}
                    onCheckedChange={v => updateForm("required_for_approval", v)}
                  />
                  <Label>Obrigatória para Aprovação</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.skip_if_similar_recent}
                    onCheckedChange={v => updateForm("skip_if_similar_recent", v)}
                  />
                  <Label>Pular se houver verificação recente (economia)</Label>
                </div>
              </div>

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl"
                onClick={() => saveMutation.mutate()}
                disabled={!form.name || saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                {editingRule ? "Salvar Alterações" : "Criar Regra"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-500 uppercase">Verificações</p>
              <Zap className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{totalVerifications}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-500 uppercase">Taxa de Cache</p>
              <TrendingDown className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-700">
              {totalVerifications > 0 ? ((cacheHits / totalVerifications) * 100).toFixed(0) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-500 uppercase">Custo Total</p>
              <DollarSign className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-700">R$ {totalCost.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-500 uppercase">Economia</p>
              <TrendingDown className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-700">R$ {estimatedSavings.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <Alert className="border-emerald-200 bg-emerald-50">
        <TrendingDown className="h-4 w-4 text-emerald-600" />
        <AlertDescription className="text-emerald-900 text-sm">
          <strong>Otimização Ativa:</strong> O sistema usa cache inteligente para evitar consultas desnecessárias. 
          Verificações são feitas automaticamente apenas quando necessário (nova proposta, dados alterados, cache expirado).
        </AlertDescription>
      </Alert>

      <Card className="rounded-2xl border-slate-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-600" /> Regras de Verificação
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <p className="text-center py-8 text-slate-400 text-sm">Nenhuma regra configurada</p>
          ) : (
            <div className="space-y-3">
              {rules.map(rule => (
                <div key={rule.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-slate-900">{rule.name}</h3>
                        {rule.is_active ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Ativa</Badge>
                        ) : (
                          <Badge className="bg-slate-200 text-slate-600 border-0 text-xs">Inativa</Badge>
                        )}
                        {rule.required_for_approval && (
                          <Badge className="bg-red-100 text-red-700 border-0 text-xs">Obrigatória</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-600">
                        {verificationTypes[rule.verification_type]?.label}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      onClick={() => openEditDialog(rule)}
                    >
                      <Edit className="w-3 h-3 mr-2" />
                      Editar
                    </Button>
                  </div>

                  <div className="grid grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Cache
                      </span>
                      <p className="font-medium text-slate-900">{rule.cache_duration_days} dias</p>
                    </div>
                    <div>
                      <span className="text-slate-500 flex items-center gap-1">
                        <DollarSign className="w-3 h-3" /> Custo
                      </span>
                      <p className="font-medium text-slate-900">R$ {(rule.cost_per_query || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Prioridade</span>
                      <p className="font-medium text-slate-900">
                        {rule.priority === 0 ? "Crítica" : rule.priority === 1 ? "Alta" : rule.priority === 2 ? "Média" : "Baixa"}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Cache Smart</span>
                      <p className="font-medium text-slate-900">
                        {rule.skip_if_similar_recent ? "Sim" : "Não"}
                      </p>
                    </div>
                  </div>

                  {rule.trigger_on && rule.trigger_on.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <span className="text-xs text-slate-500">Acionada em: </span>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {rule.trigger_on.map(t => (
                          <Badge key={t} className="bg-blue-100 text-blue-700 border-0 text-[10px]">
                            {triggers.find(tr => tr.value === t)?.label || t}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}