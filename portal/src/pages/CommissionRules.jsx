import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, Plus, Edit2, Trash2, CheckCircle2 } from "lucide-react";

export default function CommissionRules() {
  const queryClient = useQueryClient();
  const [openNewRule, setOpenNewRule] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    rule_name: "",
    description: "",
    commission_type: "referral",
    is_active: true,
    start_date: "",
    end_date: "",
    convenios: [],
    employees: [],
    commission_rate: "",
    minimum_amount: "",
    maximum_amount: "",
    require_activation: true,
    referral_code_required: false,
    calculation_method: "percentage",
    fixed_amount: "",
  });

  const { data: rules = [] } = useQuery({
    queryKey: ["commission_rules"],
    queryFn: () => base44.entities.CommissionRule.list("-created_date", 1000),
  });

  const { data: convenios = [] } = useQuery({
    queryKey: ["convenios"],
    queryFn: () => base44.entities.ConvenioConfig.list(),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: currentUser } = useQuery({
    queryKey: ["current_user"],
    queryFn: () => base44.auth.me(),
  });

  const createRuleMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.CommissionRule.create({
        ...data,
        commission_rate: Number(data.commission_rate),
        minimum_amount: data.minimum_amount ? Number(data.minimum_amount) : undefined,
        maximum_amount: data.maximum_amount ? Number(data.maximum_amount) : undefined,
        fixed_amount: data.fixed_amount ? Number(data.fixed_amount) : undefined,
        created_by: currentUser?.email,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission_rules"] });
      resetForm();
      setOpenNewRule(false);
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.CommissionRule.update(editingRule.id, {
        ...data,
        commission_rate: Number(data.commission_rate),
        minimum_amount: data.minimum_amount ? Number(data.minimum_amount) : undefined,
        maximum_amount: data.maximum_amount ? Number(data.maximum_amount) : undefined,
        fixed_amount: data.fixed_amount ? Number(data.fixed_amount) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission_rules"] });
      resetForm();
      setEditingRule(null);
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (ruleId) => base44.entities.CommissionRule.delete(ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission_rules"] });
    },
  });

  const toggleActiveRuleMutation = useMutation({
    mutationFn: (rule) =>
      base44.entities.CommissionRule.update(rule.id, { is_active: !rule.is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission_rules"] });
    },
  });

  const resetForm = () => {
    setFormData({
      rule_name: "",
      description: "",
      commission_type: "referral",
      is_active: true,
      start_date: "",
      end_date: "",
      convenios: [],
      employees: [],
      commission_rate: "",
      minimum_amount: "",
      maximum_amount: "",
      require_activation: true,
      referral_code_required: false,
      calculation_method: "percentage",
      fixed_amount: "",
    });
  };

  const openEditDialog = (rule) => {
    setEditingRule(rule);
    setFormData({
      rule_name: rule.rule_name,
      description: rule.description || "",
      commission_type: rule.commission_type,
      is_active: rule.is_active,
      start_date: rule.start_date || "",
      end_date: rule.end_date || "",
      convenios: rule.convenios || [],
      employees: rule.employees || [],
      commission_rate: rule.commission_rate.toString(),
      minimum_amount: rule.minimum_amount ? rule.minimum_amount.toString() : "",
      maximum_amount: rule.maximum_amount ? rule.maximum_amount.toString() : "",
      require_activation: rule.require_activation !== false,
      referral_code_required: rule.referral_code_required || false,
      calculation_method: rule.calculation_method || "percentage",
      fixed_amount: rule.fixed_amount ? rule.fixed_amount.toString() : "",
    });
  };

  const handleAddConvenio = (convenioId) => {
    if (!formData.convenios.includes(convenioId)) {
      setFormData({
        ...formData,
        convenios: [...formData.convenios, convenioId],
      });
    }
  };

  const handleRemoveConvenio = (convenioId) => {
    setFormData({
      ...formData,
      convenios: formData.convenios.filter(id => id !== convenioId),
    });
  };

  const handleAddEmployee = (employeeId) => {
    if (!formData.employees.includes(employeeId)) {
      setFormData({
        ...formData,
        employees: [...formData.employees, employeeId],
      });
    }
  };

  const handleRemoveEmployee = (employeeId) => {
    setFormData({
      ...formData,
      employees: formData.employees.filter(id => id !== employeeId),
    });
  };

  const typeLabel = {
    referral: "Indicação",
    sale: "Venda",
    collection_recovery: "Cobrança",
    performance_bonus: "Bônus Performance",
  };

  const isRuleValid = (rule) => {
    const now = new Date();
    const start = rule.start_date ? new Date(rule.start_date) : null;
    const end = rule.end_date ? new Date(rule.end_date) : null;

    if (start && start > now) return false;
    if (end && end < now) return false;
    return true;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Regras de Comissionamento</h1>
          <p className="text-slate-500 mt-1">Configure regras de comissão por tipo, convênio e período</p>
        </div>
        <Button 
          className="rounded-lg bg-blue-600 hover:bg-blue-700"
          onClick={() => {
            resetForm();
            setEditingRule(null);
            setOpenNewRule(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Regra
        </Button>
      </div>

      <Dialog open={openNewRule} onOpenChange={setOpenNewRule}>
        <DialogContent className="rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRule ? "Editar Regra" : "Nova Regra de Comissionamento"}</DialogTitle>
          </DialogHeader>
          <RuleForm
            formData={formData}
            setFormData={setFormData}
            convenios={convenios}
            employees={employees}
            onAddConvenio={handleAddConvenio}
            onRemoveConvenio={handleRemoveConvenio}
            onAddEmployee={handleAddEmployee}
            onRemoveEmployee={handleRemoveEmployee}
            onSubmit={() => editingRule ? updateRuleMutation.mutate(formData) : createRuleMutation.mutate(formData)}
            isLoading={createRuleMutation.isPending || updateRuleMutation.isPending}
          />
        </DialogContent>
      </Dialog>
      
      {/* Rules List */}
      <div className="space-y-4">
        {rules.length === 0 ? (
          <Card className="rounded-xl border-slate-100">
            <CardContent className="pt-6">
              <p className="text-center text-slate-400">Nenhuma regra de comissionamento criada</p>
            </CardContent>
          </Card>
        ) : (
          rules.map(rule => {
            const selectedConvenios = convenios.filter(c => rule.convenios?.includes(c.id));
            const selectedEmployees = employees.filter(e => rule.employees?.includes(e.id));
            const isValid = isRuleValid(rule);

            return (
              <Card key={rule.id} className={`rounded-xl border-slate-100 ${!rule.is_active ? "opacity-60" : ""}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">{rule.rule_name}</h3>
                        <Badge className={rule.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {rule.is_active ? "Ativa" : "Inativa"}
                        </Badge>
                        {!isValid && (
                          <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Período Expirado
                          </Badge>
                        )}
                      </div>
                      {rule.description && <p className="text-sm text-slate-600 mb-3">{rule.description}</p>}

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Tipo</p>
                          <Badge variant="outline">{typeLabel[rule.commission_type]}</Badge>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Taxa/Valor</p>
                          <p className="font-semibold text-slate-900">
                            {rule.calculation_method === "fixed"
                              ? `R$ ${rule.fixed_amount?.toFixed(2)}`
                              : `${rule.commission_rate}%`}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Método</p>
                          <Badge variant="outline">{rule.calculation_method}</Badge>
                        </div>
                      </div>

                      {(rule.start_date || rule.end_date) && (
                        <div className="p-3 bg-blue-50 rounded-lg mb-3">
                          <p className="text-xs text-blue-700">
                            Válido de {rule.start_date ? new Date(rule.start_date).toLocaleDateString("pt-BR") : "sempre"}{" "}
                            a {rule.end_date ? new Date(rule.end_date).toLocaleDateString("pt-BR") : "sempre"}
                          </p>
                        </div>
                      )}

                      {selectedConvenios.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-slate-500 mb-2">Convênios</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedConvenios.map(c => (
                              <Badge key={c.id} variant="secondary">{c.convenio_name}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedEmployees.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-500 mb-2">Comissionados</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedEmployees.map(e => (
                              <Badge key={e.id} variant="secondary">{e.full_name}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {rule.minimum_amount || rule.maximum_amount ? (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <p className="text-xs text-slate-500">
                            Valor: {rule.minimum_amount ? `R$ ${rule.minimum_amount.toFixed(2)}` : "Sem mín"} -{" "}
                            {rule.maximum_amount ? `R$ ${rule.maximum_amount.toFixed(2)}` : "Sem máx"}
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleActiveRuleMutation.mutate(rule)}
                        className="rounded-lg"
                      >
                        {rule.is_active ? "Desativar" : "Ativar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          openEditDialog(rule);
                          setOpenNewRule(true);
                        }}
                        className="rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteRuleMutation.mutate(rule.id)}
                        className="rounded-lg text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

function RuleForm({
  formData,
  setFormData,
  convenios,
  employees,
  onAddConvenio,
  onRemoveConvenio,
  onAddEmployee,
  onRemoveEmployee,
  onSubmit,
  isLoading,
}) {
  return (
    <div className="space-y-4 pt-4">
      <div>
        <Label>Nome da Regra</Label>
        <Input
          value={formData.rule_name}
          onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
          placeholder="Ex: Comissão Indicação 2024"
          className="rounded-lg mt-2"
        />
      </div>

      <div>
        <Label>Descrição</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descreva a regra..."
          className="rounded-lg mt-2 h-20"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Tipo de Comissão</Label>
          <Select value={formData.commission_type} onValueChange={(value) => setFormData({ ...formData, commission_type: value })}>
            <SelectTrigger className="rounded-lg mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="referral">Indicação</SelectItem>
              <SelectItem value="sale">Venda</SelectItem>
              <SelectItem value="collection_recovery">Cobrança</SelectItem>
              <SelectItem value="performance_bonus">Bônus Performance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Método de Cálculo</Label>
          <Select value={formData.calculation_method} onValueChange={(value) => setFormData({ ...formData, calculation_method: value })}>
            <SelectTrigger className="rounded-lg mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentual (%)</SelectItem>
              <SelectItem value="fixed">Valor Fixo</SelectItem>
              <SelectItem value="tiered">Escalonado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {formData.calculation_method === "percentage" && (
        <div>
          <Label>Taxa (%)</Label>
          <Input
            type="number"
            value={formData.commission_rate}
            onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
            placeholder="Ex: 5"
            className="rounded-lg mt-2"
          />
        </div>
      )}

      {formData.calculation_method === "fixed" && (
        <div>
          <Label>Valor Fixo (R$)</Label>
          <Input
            type="number"
            value={formData.fixed_amount}
            onChange={(e) => setFormData({ ...formData, fixed_amount: e.target.value })}
            placeholder="Ex: 100"
            className="rounded-lg mt-2"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Data Início</Label>
          <Input
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            className="rounded-lg mt-2"
          />
        </div>
        <div>
          <Label>Data Fim</Label>
          <Input
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            className="rounded-lg mt-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Valor Mínimo (R$)</Label>
          <Input
            type="number"
            value={formData.minimum_amount}
            onChange={(e) => setFormData({ ...formData, minimum_amount: e.target.value })}
            placeholder="Opcional"
            className="rounded-lg mt-2"
          />
        </div>
        <div>
          <Label>Valor Máximo (R$)</Label>
          <Input
            type="number"
            value={formData.maximum_amount}
            onChange={(e) => setFormData({ ...formData, maximum_amount: e.target.value })}
            placeholder="Opcional"
            className="rounded-lg mt-2"
          />
        </div>
      </div>

      <div>
        <Label className="mb-3 block">Convênios (deixe vazio para todos)</Label>
        <Select>
          <SelectTrigger className="rounded-lg">
            <SelectValue placeholder="Selecione convênios..." />
          </SelectTrigger>
          <SelectContent>
            {convenios.map(c => (
              <SelectItem key={c.id} value={c.id} onSelect={() => onAddConvenio(c.id)}>
                {c.convenio_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {formData.convenios.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.convenios.map(cid => {
              const conv = convenios.find(c => c.id === cid);
              return (
                <Badge key={cid} className="bg-blue-100 text-blue-800 cursor-pointer">
                  {conv?.convenio_name}
                  <button onClick={() => onRemoveConvenio(cid)} className="ml-2">×</button>
                </Badge>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <Label className="mb-3 block">Comissionados (deixe vazio para todos)</Label>
        <Select>
          <SelectTrigger className="rounded-lg">
            <SelectValue placeholder="Selecione comissionados..." />
          </SelectTrigger>
          <SelectContent>
            {employees.map(e => (
              <SelectItem key={e.id} value={e.id} onSelect={() => onAddEmployee(e.id)}>
                {e.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {formData.employees.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.employees.map(eid => {
              const emp = employees.find(e => e.id === eid);
              return (
                <Badge key={eid} className="bg-purple-100 text-purple-800 cursor-pointer">
                  {emp?.full_name}
                  <button onClick={() => onRemoveEmployee(eid)} className="ml-2">×</button>
                </Badge>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
        <Switch
          checked={formData.require_activation}
          onCheckedChange={(checked) => setFormData({ ...formData, require_activation: checked })}
        />
        <Label className="cursor-pointer">Requer aprovação antes de pagar</Label>
      </div>

      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
        <Switch
          checked={formData.referral_code_required}
          onCheckedChange={(checked) => setFormData({ ...formData, referral_code_required: checked })}
        />
        <Label className="cursor-pointer">Requer código de cupom/indicação</Label>
      </div>

      <Button onClick={onSubmit} disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg">
        {isLoading ? "Salvando..." : "Salvar Regra"}
      </Button>
    </div>
  );
}