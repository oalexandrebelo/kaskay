import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Building2, 
  Calendar, 
  Plus, 
  Settings, 
  CheckCircle2, 
  XCircle,
  Loader2,
  Edit,
  Percent,
  Clock,
  DollarSign,
  FileText,
  AlertTriangle,
  Upload
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import DocumentExpirationCalendar from "../components/convenio/DocumentExpirationCalendar";

const employerTypeLabels = {
  federal: "Federal",
  estadual: "Estadual",
  municipal: "Municipal",
  autarquia: "Autarquia",
  fundacao: "Fundação",
};

const initialFormState = {
  convenio_name: "",
  convenio_code: "",
  employer_type: "municipal",
  cut_off_day: "10",
  payroll_processing_day: "15",
  payment_day: "20",
  max_margin_percentage: "35",
  salary_advance_percentage: "25",
  allow_multiple_per_month: true,
  max_advances_per_month: "3",
  decree_number: "",
  decree_date: "",
  decree_expiration: "",
  accreditation_term_number: "",
  accreditation_date: "",
  accreditation_expiration: "",
  margin_manager: "",
  margin_manager_contract_number: "",
  margin_manager_contract_expiration: "",
  margin_manager_fee_percentage: "",
  scd_partner: "",
  payslip_collection_frequency_days: "30",
  portal_verification_frequency_days: "60",
  is_active: true,
  accepts_new_contracts: true,
  minimum_salary: "",
  contract_term_months: "84",
  observation_window_days: "90",
  contact_name: "",
  contact_phone: "",
  contact_email: "",
  notes: "",
};

export default function ConvenioSettings() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConvenio, setEditingConvenio] = useState(null);
  const [form, setForm] = useState(initialFormState);

  const { data: convenios = [], isLoading } = useQuery({
    queryKey: ["convenio_configs"],
    queryFn: () => base44.entities.ConvenioConfig.list("-created_date", 1000),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        ...form,
        cut_off_day: parseInt(form.cut_off_day),
        payroll_processing_day: parseInt(form.payroll_processing_day),
        payment_day: parseInt(form.payment_day),
        max_margin_percentage: parseFloat(form.max_margin_percentage),
        salary_advance_percentage: parseFloat(form.salary_advance_percentage),
        max_advances_per_month: parseInt(form.max_advances_per_month),
        minimum_salary: form.minimum_salary ? parseFloat(form.minimum_salary) : undefined,
        contract_term_months: parseInt(form.contract_term_months),
        observation_window_days: parseInt(form.observation_window_days),
        payslip_collection_frequency_days: parseInt(form.payslip_collection_frequency_days),
        portal_verification_frequency_days: parseInt(form.portal_verification_frequency_days),
        margin_manager_fee_percentage: form.margin_manager_fee_percentage ? parseFloat(form.margin_manager_fee_percentage) : undefined,
      };

      if (editingConvenio) {
        await base44.entities.ConvenioConfig.update(editingConvenio.id, data);
      } else {
        await base44.entities.ConvenioConfig.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["convenio_configs"] });
      setDialogOpen(false);
      setEditingConvenio(null);
      setForm(initialFormState);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, field, value }) => base44.entities.ConvenioConfig.update(id, { [field]: value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["convenio_configs"] });
    },
  });

  const openCreateDialog = () => {
    setEditingConvenio(null);
    setForm(initialFormState);
    setDialogOpen(true);
  };

  const openEditDialog = (convenio) => {
    setEditingConvenio(convenio);
    setForm({
      convenio_name: convenio.convenio_name || "",
      convenio_code: convenio.convenio_code || "",
      employer_type: convenio.employer_type || "municipal",
      cut_off_day: (convenio.cut_off_day || 10).toString(),
      payroll_processing_day: (convenio.payroll_processing_day || 15).toString(),
      payment_day: (convenio.payment_day || 20).toString(),
      max_margin_percentage: (convenio.max_margin_percentage || 35).toString(),
      salary_advance_percentage: (convenio.salary_advance_percentage || 25).toString(),
      allow_multiple_per_month: convenio.allow_multiple_per_month !== false,
      max_advances_per_month: (convenio.max_advances_per_month || 3).toString(),
      decree_number: convenio.decree_number || "",
      decree_date: convenio.decree_date || "",
      decree_expiration: convenio.decree_expiration || "",
      accreditation_term_number: convenio.accreditation_term_number || "",
      accreditation_date: convenio.accreditation_date || "",
      accreditation_expiration: convenio.accreditation_expiration || "",
      margin_manager: convenio.margin_manager || "",
      margin_manager_contract_number: convenio.margin_manager_contract_number || "",
      margin_manager_contract_expiration: convenio.margin_manager_contract_expiration || "",
      margin_manager_fee_percentage: convenio.margin_manager_fee_percentage?.toString() || "",
      scd_partner: convenio.scd_partner || "",
      payslip_collection_frequency_days: (convenio.payslip_collection_frequency_days || 30).toString(),
      portal_verification_frequency_days: (convenio.portal_verification_frequency_days || 60).toString(),
      is_active: convenio.is_active !== false,
      accepts_new_contracts: convenio.accepts_new_contracts !== false,
      minimum_salary: convenio.minimum_salary?.toString() || "",
      contract_term_months: (convenio.contract_term_months || 84).toString(),
      observation_window_days: (convenio.observation_window_days || 90).toString(),
      contact_name: convenio.contact_name || "",
      contact_phone: convenio.contact_phone || "",
      contact_email: convenio.contact_email || "",
      notes: convenio.notes || "",
    });
    setDialogOpen(true);
  };

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return <Skeleton className="h-96 rounded-2xl" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Parametrização de Convênios</h1>
          <p className="text-slate-500 text-sm mt-1">Configure datas de corte, folha e repasse de cada órgão</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl" onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Convênio
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingConvenio ? "Editar Convênio" : "Novo Convênio"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {/* Dados Básicos */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome do Convênio *</Label>
                  <Input
                    value={form.convenio_name}
                    onChange={e => updateForm("convenio_name", e.target.value)}
                    className="rounded-xl mt-1"
                    placeholder="Ex: Prefeitura Municipal de São Paulo"
                  />
                </div>
                <div>
                  <Label>Código do Convênio</Label>
                  <Input
                    value={form.convenio_code}
                    onChange={e => updateForm("convenio_code", e.target.value)}
                    className="rounded-xl mt-1"
                    placeholder="Ex: PMSP"
                  />
                </div>
              </div>

              <div>
                <Label>Tipo de Órgão</Label>
                <Select value={form.employer_type} onValueChange={v => updateForm("employer_type", v)}>
                  <SelectTrigger className="rounded-xl mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(employerTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Datas e Prazos */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Calendário de Processamento
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-blue-900">Dia de Corte *</Label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={form.cut_off_day}
                      onChange={e => updateForm("cut_off_day", e.target.value)}
                      className="rounded-xl mt-1"
                    />
                    <p className="text-xs text-blue-700 mt-1">Último dia para inclusões</p>
                  </div>
                  <div>
                    <Label className="text-blue-900">Dia da Folha *</Label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={form.payroll_processing_day}
                      onChange={e => updateForm("payroll_processing_day", e.target.value)}
                      className="rounded-xl mt-1"
                    />
                    <p className="text-xs text-blue-700 mt-1">Processamento da folha</p>
                  </div>
                  <div>
                    <Label className="text-blue-900">Dia de Repasse *</Label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={form.payment_day}
                      onChange={e => updateForm("payment_day", e.target.value)}
                      className="rounded-xl mt-1"
                    />
                    <p className="text-xs text-blue-700 mt-1">Pagamento aos credores</p>
                  </div>
                </div>
              </div>

              {/* Regras de Margem e Adiantamento */}
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                <h3 className="text-sm font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                  <Percent className="w-4 h-4" /> Regras de Crédito
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <Label className="text-emerald-900">Margem Consignável (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={form.max_margin_percentage}
                      onChange={e => updateForm("max_margin_percentage", e.target.value)}
                      className="rounded-xl mt-1"
                    />
                    <p className="text-xs text-emerald-700 mt-1">Máximo permitido por decreto</p>
                  </div>
                  <div>
                    <Label className="text-emerald-900">% Adiantamento Salarial</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={form.salary_advance_percentage}
                      onChange={e => updateForm("salary_advance_percentage", e.target.value)}
                      className="rounded-xl mt-1"
                    />
                    <p className="text-xs text-emerald-700 mt-1">Do salário líquido (ex: 25%)</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={form.allow_multiple_per_month}
                      onCheckedChange={v => updateForm("allow_multiple_per_month", v)}
                    />
                    <Label className="text-emerald-900">Múltiplos no mesmo mês</Label>
                  </div>
                  <div>
                    <Label className="text-emerald-900">Máx. por Mês</Label>
                    <Input
                      type="number"
                      value={form.max_advances_per_month}
                      onChange={e => updateForm("max_advances_per_month", e.target.value)}
                      className="rounded-xl mt-1"
                      disabled={!form.allow_multiple_per_month}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Salário Mínimo (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.minimum_salary}
                    onChange={e => updateForm("minimum_salary", e.target.value)}
                    className="rounded-xl mt-1"
                    placeholder="Ex: 1500.00"
                  />
                </div>
                <div>
                  <Label>Prazo Máximo (meses)</Label>
                  <Input
                    type="number"
                    value={form.contract_term_months}
                    onChange={e => updateForm("contract_term_months", e.target.value)}
                    className="rounded-xl mt-1"
                  />
                </div>
              </div>

              {/* Documentação Legal */}
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                <h3 className="text-sm font-semibold text-orange-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Documentação Legal
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-orange-900">Nº Decreto</Label>
                      <Input
                        value={form.decree_number}
                        onChange={e => updateForm("decree_number", e.target.value)}
                        className="rounded-xl mt-1"
                        placeholder="Ex: 12.345/2024"
                      />
                    </div>
                    <div>
                      <Label className="text-orange-900">Data Publicação</Label>
                      <Input
                        type="date"
                        value={form.decree_date}
                        onChange={e => updateForm("decree_date", e.target.value)}
                        className="rounded-xl mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-orange-900">Validade</Label>
                      <Input
                        type="date"
                        value={form.decree_expiration}
                        onChange={e => updateForm("decree_expiration", e.target.value)}
                        className="rounded-xl mt-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-orange-900">Nº Termo Credenciamento</Label>
                      <Input
                        value={form.accreditation_term_number}
                        onChange={e => updateForm("accreditation_term_number", e.target.value)}
                        className="rounded-xl mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-orange-900">Data</Label>
                      <Input
                        type="date"
                        value={form.accreditation_date}
                        onChange={e => updateForm("accreditation_date", e.target.value)}
                        className="rounded-xl mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-orange-900">Validade</Label>
                      <Input
                        type="date"
                        value={form.accreditation_expiration}
                        onChange={e => updateForm("accreditation_expiration", e.target.value)}
                        className="rounded-xl mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Integrações e Comercial */}
              <div className="bg-violet-50 rounded-xl p-4 border border-violet-200">
                <h3 className="text-sm font-semibold text-violet-900 mb-3 flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Gestora de Margem
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <Label className="text-violet-900">Gestora</Label>
                    <Input
                      value={form.margin_manager}
                      onChange={e => updateForm("margin_manager", e.target.value)}
                      className="rounded-xl mt-1"
                      placeholder="Ex: Zetra, QI Tech"
                    />
                  </div>
                  <div>
                    <Label className="text-violet-900">Nº Contrato</Label>
                    <Input
                      value={form.margin_manager_contract_number}
                      onChange={e => updateForm("margin_manager_contract_number", e.target.value)}
                      className="rounded-xl mt-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-violet-900">Validade Contrato</Label>
                    <Input
                      type="date"
                      value={form.margin_manager_contract_expiration}
                      onChange={e => updateForm("margin_manager_contract_expiration", e.target.value)}
                      className="rounded-xl mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-violet-900">Taxa da Gestora (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.margin_manager_fee_percentage}
                      onChange={e => updateForm("margin_manager_fee_percentage", e.target.value)}
                      className="rounded-xl mt-1"
                      placeholder="Ex: 1.5"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>SCD Parceira</Label>
                  <Input
                    value={form.scd_partner}
                    onChange={e => updateForm("scd_partner", e.target.value)}
                    className="rounded-xl mt-1"
                    placeholder="Ex: SCD Parceira"
                  />
                </div>
                <div>
                  <Label>Carência (dias)</Label>
                  <Input
                    type="number"
                    value={form.observation_window_days}
                    onChange={e => updateForm("observation_window_days", e.target.value)}
                    className="rounded-xl mt-1"
                  />
                </div>
              </div>

              {/* Automação Back-end */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Automação de Coletas
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-blue-900">Frequência Holerite (dias)</Label>
                    <Input
                      type="number"
                      value={form.payslip_collection_frequency_days}
                      onChange={e => updateForm("payslip_collection_frequency_days", e.target.value)}
                      className="rounded-xl mt-1"
                    />
                    <p className="text-xs text-blue-700 mt-1">Evita coletas desnecessárias</p>
                  </div>
                  <div>
                    <Label className="text-blue-900">Frequência Portal (dias)</Label>
                    <Input
                      type="number"
                      value={form.portal_verification_frequency_days}
                      onChange={e => updateForm("portal_verification_frequency_days", e.target.value)}
                      className="rounded-xl mt-1"
                    />
                    <p className="text-xs text-blue-700 mt-1">Validação no portal transparência</p>
                  </div>
                </div>
              </div>

              {/* Contato */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Contato no Órgão</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Nome</Label>
                    <Input
                      value={form.contact_name}
                      onChange={e => updateForm("contact_name", e.target.value)}
                      className="rounded-xl mt-1"
                    />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input
                      value={form.contact_phone}
                      onChange={e => updateForm("contact_phone", e.target.value)}
                      className="rounded-xl mt-1"
                    />
                  </div>
                  <div>
                    <Label>E-mail</Label>
                    <Input
                      type="email"
                      value={form.contact_email}
                      onChange={e => updateForm("contact_email", e.target.value)}
                      className="rounded-xl mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={v => updateForm("is_active", v)}
                  />
                  <Label>Convênio Ativo</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.accepts_new_contracts}
                    onCheckedChange={v => updateForm("accepts_new_contracts", v)}
                  />
                  <Label>Aceita Novos Contratos</Label>
                </div>
              </div>

              {/* Observações */}
              <div>
                <Label>Observações</Label>
                <Textarea
                  value={form.notes}
                  onChange={e => updateForm("notes", e.target.value)}
                  className="rounded-xl mt-1"
                  rows={3}
                  placeholder="Informações adicionais sobre o convênio..."
                />
              </div>

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl"
                onClick={() => saveMutation.mutate()}
                disabled={!form.convenio_name || saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                {editingConvenio ? "Salvar Alterações" : "Criar Convênio"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Alert className="border-blue-200 bg-blue-50">
            <Calendar className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900 text-sm">
              <strong>Calendário:</strong> Configure as datas de corte, processamento de folha e repasse de cada órgão para gerenciar prazos e averbações corretamente.
            </AlertDescription>
          </Alert>
        </div>
        <DocumentExpirationCalendar convenios={convenios} />
      </div>

      {convenios.length === 0 ? (
        <Card className="rounded-2xl border-slate-200">
          <CardContent className="p-12 text-center">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 mb-4">Nenhum convênio cadastrado</p>
            <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl" onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Primeiro Convênio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {convenios.map(conv => (
            <Card key={conv.id} className="rounded-2xl border-slate-100">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">{conv.convenio_name}</h3>
                      {conv.convenio_code && (
                        <Badge className="bg-slate-100 text-slate-700 border-0 text-xs">
                          {conv.convenio_code}
                        </Badge>
                      )}
                      <Badge className="bg-blue-100 text-blue-700 border-0 text-xs capitalize">
                        {employerTypeLabels[conv.employer_type]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-600">
                      {conv.is_active ? (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle2 className="w-3 h-3" /> Ativo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600">
                          <XCircle className="w-3 h-3" /> Inativo
                        </span>
                      )}
                      {conv.accepts_new_contracts && (
                        <span className="text-blue-600">• Aceita novos contratos</span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                    onClick={() => openEditDialog(conv)}
                  >
                    <Edit className="w-3 h-3 mr-2" />
                    Editar
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-3 h-3 text-blue-600" />
                      <span className="text-xs font-medium text-blue-700">Corte</span>
                    </div>
                    <p className="text-lg font-bold text-blue-900">Dia {conv.cut_off_day}</p>
                  </div>

                  <div className="bg-violet-50 rounded-lg p-3 border border-violet-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-3 h-3 text-violet-600" />
                      <span className="text-xs font-medium text-violet-700">Folha</span>
                    </div>
                    <p className="text-lg font-bold text-violet-900">Dia {conv.payroll_processing_day}</p>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-3 h-3 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-700">Repasse</span>
                    </div>
                    <p className="text-lg font-bold text-emerald-900">Dia {conv.payment_day}</p>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Percent className="w-3 h-3 text-orange-600" />
                      <span className="text-xs font-medium text-orange-700">Margem</span>
                    </div>
                    <p className="text-lg font-bold text-orange-900">{conv.max_margin_percentage}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  {conv.margin_manager && (
                    <div>
                      <span className="text-slate-500">Gestora:</span>
                      <p className="font-medium text-slate-700">{conv.margin_manager}</p>
                    </div>
                  )}
                  {conv.scd_partner && (
                    <div>
                      <span className="text-slate-500">SCD:</span>
                      <p className="font-medium text-slate-700">{conv.scd_partner}</p>
                    </div>
                  )}
                  {conv.contract_term_months && (
                    <div>
                      <span className="text-slate-500">Prazo Máx:</span>
                      <p className="font-medium text-slate-700">{conv.contract_term_months} meses</p>
                    </div>
                  )}
                  {conv.minimum_salary && (
                    <div>
                      <span className="text-slate-500">Salário Mín:</span>
                      <p className="font-medium text-slate-700">R$ {conv.minimum_salary.toLocaleString("pt-BR")}</p>
                    </div>
                  )}
                </div>

                {conv.notes && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <p className="text-xs text-slate-600">{conv.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}