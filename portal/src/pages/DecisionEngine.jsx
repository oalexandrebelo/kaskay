import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Shield, Zap, AlertTriangle, Brain } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import RuleForm from "@/components/rules/RuleForm";

const categoryIcons = {
  eligibility: Shield,
  credit_limit: Zap,
  interest_rate: Zap,
  margin: Zap,
  documentation: Shield,
  scoring: Brain,
  anti_fraud: AlertTriangle,
};

const categoryLabels = {
  eligibility: "Elegibilidade",
  credit_limit: "Limite de Crédito",
  interest_rate: "Taxa de Juros",
  margin: "Margem",
  documentation: "Documentação",
  scoring: "Scoring",
  anti_fraud: "Anti-Fraude",
};

const actionLabels = {
  approve: "Aprovar",
  reject: "Rejeitar",
  manual_review: "Rev. Manual",
  adjust_rate: "Ajustar Taxa",
  adjust_limit: "Ajustar Limite",
  require_document: "Solic. Doc",
  flag: "Sinalizar",
};

const actionColors = {
  approve: "bg-emerald-100 text-emerald-700",
  reject: "bg-red-100 text-red-700",
  manual_review: "bg-amber-100 text-amber-700",
  adjust_rate: "bg-blue-100 text-blue-700",
  adjust_limit: "bg-violet-100 text-violet-700",
  require_document: "bg-cyan-100 text-cyan-700",
  flag: "bg-orange-100 text-orange-700",
};

export default function DecisionEngine() {
  const [formDialog, setFormDialog] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState(null);
  const queryClient = useQueryClient();

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["rules"],
    queryFn: () => base44.entities.BusinessRule.list("priority", 500),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editingRule
      ? base44.entities.BusinessRule.update(editingRule.id, data)
      : base44.entities.BusinessRule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rules"] });
      setFormDialog(false);
      setEditingRule(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BusinessRule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rules"] });
      setDeleteDialog(false);
      setRuleToDelete(null);
    },
  });

  const handleDeleteClick = (rule) => {
    setRuleToDelete(rule);
    setDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (ruleToDelete) {
      deleteMutation.mutate(ruleToDelete.id);
    }
  };

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.BusinessRule.update(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rules"] }),
  });

  const grouped = rules.reduce((acc, r) => {
    const cat = r.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Motor de Decisão</h1>
          <p className="text-slate-500 text-sm mt-1">Configure regras de negócio para análise automática</p>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700 rounded-xl"
          onClick={() => { setEditingRule(null); setFormDialog(true); }}
        >
          <Plus className="w-4 h-4 mr-2" /> Nova Regra
        </Button>
      </div>

      <Dialog open={formDialog} onOpenChange={setFormDialog}>
        <DialogContent className="rounded-2xl max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRule ? "Editar Regra" : "Nova Regra de Negócio"}</DialogTitle>
          </DialogHeader>
          <RuleForm
            rule={editingRule}
            onSave={(data) => saveMutation.mutate(data)}
            onCancel={() => { setFormDialog(false); setEditingRule(null); }}
            isSaving={saveMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="space-y-4">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, catRules]) => {
            const Icon = categoryIcons[category] || Shield;
            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-4 h-4 text-slate-500" />
                  <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    {categoryLabels[category] || category}
                  </h2>
                  <Badge variant="secondary" className="text-[10px]">{catRules.length}</Badge>
                </div>
                <div className="space-y-2">
                  {catRules.map(rule => (
                    <div key={rule.id} className={`bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-4 transition-all hover:shadow-sm ${!rule.is_active ? "opacity-50" : ""}`}>
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={(v) => toggleMutation.mutate({ id: rule.id, is_active: v })}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-slate-900">{rule.name}</p>
                          <Badge className={`${actionColors[rule.action] || "bg-slate-100 text-slate-600"} border-0 text-[10px]`}>
                            {actionLabels[rule.action] || rule.action}
                          </Badge>
                          <span className="text-[10px] text-slate-400">P{rule.priority}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          {rule.field} {rule.operator?.replace(/_/g, " ")} {rule.value}
                          {rule.description ? ` · ${rule.description}` : ""}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => { setEditingRule(rule); setFormDialog(true); }}>
                          <Pencil className="w-3.5 h-3.5 text-slate-400" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleDeleteClick(rule)}>
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {Object.keys(grouped).length === 0 && (
            <div className="text-center py-16">
              <Brain className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400">Nenhuma regra configurada</p>
              <p className="text-xs text-slate-300 mt-1">Crie sua primeira regra de negócio</p>
            </div>
          )}
        </div>
      )}

      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-600">
              Tem certeza que deseja excluir a regra <strong>"{ruleToDelete?.name}"</strong>?
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Esta ação não pode ser desfeita.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button 
              onClick={confirmDelete} 
              className="bg-red-600 hover:bg-red-700 rounded-xl"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir Regra"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}