import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Save, X, Loader2 } from "lucide-react";

const categories = [
  { value: "eligibility", label: "Elegibilidade" },
  { value: "credit_limit", label: "Limite de Crédito" },
  { value: "interest_rate", label: "Taxa de Juros" },
  { value: "margin", label: "Margem" },
  { value: "documentation", label: "Documentação" },
  { value: "scoring", label: "Scoring" },
  { value: "anti_fraud", label: "Anti-Fraude" },
];

const operators = [
  { value: "equals", label: "Igual a" },
  { value: "not_equals", label: "Diferente de" },
  { value: "greater_than", label: "Maior que" },
  { value: "less_than", label: "Menor que" },
  { value: "greater_or_equal", label: "Maior ou igual" },
  { value: "less_or_equal", label: "Menor ou igual" },
  { value: "between", label: "Entre" },
  { value: "in", label: "Está em" },
  { value: "not_in", label: "Não está em" },
  { value: "contains", label: "Contém" },
];

const actions = [
  { value: "approve", label: "Aprovar" },
  { value: "reject", label: "Rejeitar" },
  { value: "manual_review", label: "Revisão Manual" },
  { value: "adjust_rate", label: "Ajustar Taxa" },
  { value: "adjust_limit", label: "Ajustar Limite" },
  { value: "require_document", label: "Solicitar Documento" },
  { value: "flag", label: "Sinalizar" },
];

export default function RuleForm({ rule, onSave, onCancel, isSaving }) {
  const [form, setForm] = useState(rule || {
    name: "",
    category: "eligibility",
    description: "",
    field: "",
    operator: "equals",
    value: "",
    action: "approve",
    action_value: "",
    priority: 10,
    is_active: true,
    product_type: "all",
  });

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label>Nome da Regra</Label><Input value={form.name} onChange={e => update("name", e.target.value)} className="rounded-xl mt-1" /></div>
        <div>
          <Label>Categoria</Label>
          <Select value={form.category} onValueChange={v => update("category", v)}>
            <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div><Label>Descrição</Label><Textarea value={form.description} onChange={e => update("description", e.target.value)} className="rounded-xl mt-1 resize-none" rows={2} /></div>

      <div className="bg-slate-50 rounded-xl p-4 space-y-4">
        <p className="text-sm font-semibold text-slate-700">Condição</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><Label>Campo</Label><Input value={form.field} onChange={e => update("field", e.target.value)} placeholder="ex: gross_salary" className="rounded-xl mt-1" /></div>
          <div>
            <Label>Operador</Label>
            <Select value={form.operator} onValueChange={v => update("operator", v)}>
              <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{operators.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Valor</Label><Input value={form.value} onChange={e => update("value", e.target.value)} placeholder='ex: 5000 ou ["SP","RJ"]' className="rounded-xl mt-1" /></div>
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl p-4 space-y-4">
        <p className="text-sm font-semibold text-slate-700">Ação</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Ação</Label>
            <Select value={form.action} onValueChange={v => update("action", v)}>
              <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{actions.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Valor da Ação</Label><Input value={form.action_value} onChange={e => update("action_value", e.target.value)} placeholder="Opcional" className="rounded-xl mt-1" /></div>
          <div>
            <Label>Produto</Label>
            <Select value={form.product_type} onValueChange={v => update("product_type", v)}>
              <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="adiantamento_salarial">Adiantamento Salarial</SelectItem>
                <SelectItem value="consignado">Consignado</SelectItem>
                <SelectItem value="portabilidade">Portabilidade</SelectItem>
                <SelectItem value="refinanciamento">Refinanciamento</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Label>Prioridade</Label>
          <Input type="number" value={form.priority} onChange={e => update("priority", parseInt(e.target.value) || 0)} className="w-20 rounded-xl" />
          <div className="flex items-center gap-2 ml-6">
            <Switch checked={form.is_active} onCheckedChange={v => update("is_active", v)} />
            <Label>Ativa</Label>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl" onClick={onCancel}><X className="w-4 h-4 mr-1" /> Cancelar</Button>
          <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl" onClick={() => onSave(form)} disabled={isSaving || !form.name || !form.field}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />} Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}