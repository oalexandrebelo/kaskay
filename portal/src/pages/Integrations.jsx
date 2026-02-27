import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Settings, Wifi, WifiOff, Save, X, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const typeLabels = { scd: "SCD (Emissora CCB)", margin_manager: "Gestora de Margem", signature_provider: "Assinatura Digital", bureau: "Bureau de Crédito" };
const typeColors = { scd: "bg-violet-100 text-violet-700", margin_manager: "bg-cyan-100 text-cyan-700", signature_provider: "bg-amber-100 text-amber-700", bureau: "bg-blue-100 text-blue-700" };
const healthColors = { healthy: "bg-emerald-500", degraded: "bg-yellow-500", down: "bg-red-500", unknown: "bg-slate-300" };

export default function Integrations() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", type: "scd", provider: "", base_url: "", api_key: "", is_active: false, environment: "sandbox", config_json: "" });
  const queryClient = useQueryClient();

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["integrations"],
    queryFn: () => base44.entities.IntegrationConfig.list("type", 100),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing ? base44.entities.IntegrationConfig.update(editing.id, data) : base44.entities.IntegrationConfig.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["integrations"] }); setShowForm(false); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.IntegrationConfig.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["integrations"] }),
  });

  const openEdit = (config) => { setEditing(config); setForm(config); setShowForm(true); };
  const openNew = () => { setEditing(null); setForm({ name: "", type: "scd", provider: "", base_url: "", api_key: "", is_active: false, environment: "sandbox", config_json: "" }); setShowForm(true); };
  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const grouped = configs.reduce((acc, c) => { const t = c.type || "other"; if (!acc[t]) acc[t] = []; acc[t].push(c); return acc; }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Integrações</h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie conexões com SCDs, gestoras de margem e provedores</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl" onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" /> Nova Integração
        </Button>
      </div>

      {showForm && (
        <Card className="rounded-2xl border-slate-100">
          <CardHeader><CardTitle className="text-base">{editing ? "Editar" : "Nova"} Integração</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><Label>Nome</Label><Input value={form.name} onChange={e => update("name", e.target.value)} className="rounded-xl mt-1" /></div>
              <div>
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={v => update("type", v)}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Provedor</Label><Input value={form.provider} onChange={e => update("provider", e.target.value)} className="rounded-xl mt-1" placeholder="Ex: QI Tech, Zetra" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>URL Base</Label><Input value={form.base_url} onChange={e => update("base_url", e.target.value)} className="rounded-xl mt-1" placeholder="https://api.provider.com" /></div>
              <div><Label>API Key</Label><Input type="password" value={form.api_key} onChange={e => update("api_key", e.target.value)} className="rounded-xl mt-1" /></div>
            </div>
            <div><Label>Config JSON (opcional)</Label><Textarea value={form.config_json} onChange={e => update("config_json", e.target.value)} className="rounded-xl mt-1 resize-none font-mono text-xs" rows={3} /></div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Select value={form.environment} onValueChange={v => update("environment", v)}>
                  <SelectTrigger className="w-36 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="sandbox">Sandbox</SelectItem><SelectItem value="production">Produção</SelectItem></SelectContent>
                </Select>
                <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => update("is_active", v)} /><Label>Ativa</Label></div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="rounded-xl" onClick={() => { setShowForm(false); setEditing(null); }}><X className="w-4 h-4 mr-1" /> Cancelar</Button>
                <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.name}>
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />} Salvar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}</div>
      ) : (
        Object.entries(typeLabels).map(([type, label]) => {
          const items = grouped[type] || [];
          return (
            <div key={type}>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">{label}</h2>
              {items.length === 0 ? (
                <div className="bg-slate-50 rounded-xl p-6 text-center text-sm text-slate-400 border border-dashed border-slate-200">
                  Nenhuma integração configurada
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {items.map(c => (
                    <div key={c.id} className={`bg-white rounded-xl border border-slate-100 p-5 transition-all hover:shadow-sm ${!c.is_active ? "opacity-60" : ""}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                          <p className="text-xs text-slate-400">{c.provider}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${healthColors[c.health_status] || "bg-slate-300"}`} />
                          <Badge className={`${typeColors[c.type]} border-0 text-[10px]`}>{c.environment}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {c.is_active ? <Wifi className="w-3.5 h-3.5 text-emerald-500" /> : <WifiOff className="w-3.5 h-3.5 text-slate-400" />}
                          <span className="text-xs text-slate-500">{c.is_active ? "Conectado" : "Desconectado"}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 rounded-lg text-xs" onClick={() => openEdit(c)}>
                            <Settings className="w-3 h-3 mr-1" /> Config
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 rounded-lg text-xs text-red-500" onClick={() => deleteMutation.mutate(c.id)}>
                            Remover
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}