import React, { useState, useMemo } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Plus,
  Package,
  ArrowDownUp,
  Loader2,
  Building2,
  FileText
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const statusConfig = {
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  reconciled: { label: "Conciliado", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  discrepancy: { label: "Divergência", color: "bg-red-100 text-red-700", icon: AlertTriangle },
  investigating: { label: "Em Análise", color: "bg-blue-100 text-blue-700", icon: ArrowDownUp },
};

export default function Financial() {
  const queryClient = useQueryClient();
  const [reconcileOpen, setReconcileOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [reconcileForm, setReconcileForm] = useState({
    received_amount: "",
    bank_statement_date: "",
    bank_transaction_id: "",
    notes: "",
  });

  const { data: currentUser } = useQuery({
    queryKey: ["current_user"],
    queryFn: () => base44.auth.me(),
  });

  const { data: cessions = [], isLoading: cessionsLoading } = useQuery({
    queryKey: ["contract_cessions"],
    queryFn: () => base44.entities.ContractCession.list("-cession_date", 1000),
  });

  const { data: reconciliations = [], isLoading: reconLoading } = useQuery({
    queryKey: ["financial_reconciliations"],
    queryFn: () => base44.entities.FinancialReconciliation.list("-reference_date", 1000),
  });

  // Agrupar cessões por lote
  const cessionBatches = useMemo(() => {
    const batches = {};
    cessions.forEach(c => {
      const batchId = c.batch_id || `BATCH-${c.id?.slice(-6)}`;
      if (!batches[batchId]) {
        batches[batchId] = {
          batch_id: batchId,
          fidc_name: c.fidc_name,
          scd_partner: c.scd_name || "SCD Parceira",
          cession_date: c.cession_date,
          contracts: [],
          total_value: 0,
          total_cession: 0,
        };
      }
      batches[batchId].contracts.push(c);
      batches[batchId].total_value += c.contract_value || 0;
      batches[batchId].total_cession += c.cession_value || 0;
    });
    return Object.values(batches);
  }, [cessions]);

  // KPIs
  const totalExpected = reconciliations.reduce((sum, r) => sum + (r.expected_amount || 0), 0);
  const totalReceived = reconciliations.reduce((sum, r) => sum + (r.received_amount || 0), 0);
  const totalDifference = totalExpected - totalReceived;
  const reconciledCount = reconciliations.filter(r => r.status === "reconciled").length;
  const discrepancyCount = reconciliations.filter(r => r.status === "discrepancy").length;

  const createReconciliationMutation = useMutation({
    mutationFn: async (data) => {
      const difference = data.expected_amount - parseFloat(reconcileForm.received_amount);
      const status = Math.abs(difference) < 1 ? "reconciled" : "discrepancy";
      
      await base44.entities.FinancialReconciliation.create({
        ...data,
        received_amount: parseFloat(reconcileForm.received_amount),
        difference,
        status,
        bank_statement_date: reconcileForm.bank_statement_date,
        bank_transaction_id: reconcileForm.bank_transaction_id,
        notes: reconcileForm.notes,
        reconciled_by: currentUser?.email,
        reconciled_date: new Date().toISOString(),
      });

      // Atualizar status das cessões do lote
      const batch = selectedBatch;
      for (const contract of batch.contracts) {
        await base44.entities.ContractCession.update(contract.id, {
          status: status === "reconciled" ? "confirmed" : "pending_cession",
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial_reconciliations"] });
      queryClient.invalidateQueries({ queryKey: ["contract_cessions"] });
      setReconcileOpen(false);
      setSelectedBatch(null);
      setReconcileForm({ received_amount: "", bank_statement_date: "", bank_transaction_id: "", notes: "" });
    },
  });

  const openReconcileDialog = (batch) => {
    setSelectedBatch(batch);
    setReconcileForm({
      received_amount: batch.total_cession.toString(),
      bank_statement_date: "",
      bank_transaction_id: "",
      notes: "",
    });
    setReconcileOpen(true);
  };

  const handleReconcile = () => {
    if (!selectedBatch) return;
    
    createReconciliationMutation.mutate({
      reference_date: selectedBatch.cession_date,
      cession_batch_id: selectedBatch.batch_id,
      expected_amount: selectedBatch.total_cession,
      scd_partner: selectedBatch.scd_partner,
      fidc_name: selectedBatch.fidc_name,
      contracts_count: selectedBatch.contracts.length,
    });
  };

  if (cessionsLoading || reconLoading) {
    return <Skeleton className="h-96 rounded-2xl" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financeiro - Originação & Ágio</h1>
        <p className="text-slate-500 text-sm mt-1">
          Gestão de ágio gerado na cessão de contratos para FIDCs/Securitizadoras (modelo de originação)
        </p>
      </div>

      <Alert className="border-emerald-200 bg-emerald-50">
        <TrendingUp className="h-4 w-4 text-emerald-600" />
        <AlertDescription className="text-emerald-900 text-sm">
          <strong>Modelo de Negócio:</strong> Originação de contratos com remuneração via <strong>ágio</strong> na venda dos títulos.
          <br />
          <span className="text-emerald-700">
            Valor Contrato (R$ 100) → Cessão FIDC (R$ 85) = <strong>Ágio de R$ 15 (15% de receita)</strong>
          </span>
          <span className="block mt-1 text-emerald-700">💡 Integração bancária automática em desenvolvimento</span>
        </AlertDescription>
      </Alert>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="rounded-2xl border-slate-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-500 uppercase">Valor Contratos</p>
              <DollarSign className="w-4 h-4 text-slate-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">
              R$ {cessionBatches.reduce((sum, b) => sum + b.total_value, 0).toLocaleString("pt-BR")}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-500 uppercase">Cessão FIDC</p>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-700">
              R$ {cessionBatches.reduce((sum, b) => sum + b.total_cession, 0).toLocaleString("pt-BR")}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-emerald-100 bg-emerald-50/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-emerald-700 uppercase">🎯 Ágio Gerado</p>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-700">
              R$ {cessionBatches.reduce((sum, b) => sum + (b.total_value - b.total_cession), 0).toLocaleString("pt-BR")}
            </p>
            <p className="text-xs text-emerald-600 mt-1">
              Margem: {cessionBatches.length > 0 ? (((cessionBatches.reduce((sum, b) => sum + (b.total_value - b.total_cession), 0) / cessionBatches.reduce((sum, b) => sum + b.total_value, 0)) * 100).toFixed(1)) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-500 uppercase">Recebido</p>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-700">
              R$ {totalReceived.toLocaleString("pt-BR")}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-500 uppercase">Conciliações</p>
              <CheckCircle2 className="w-4 h-4 text-slate-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {reconciledCount} / {reconciliations.length}
            </p>
            {discrepancyCount > 0 && (
              <p className="text-xs text-red-600 mt-1">{discrepancyCount} divergência(s)</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Baixas Contábil e Financeira */}
      <Card className="rounded-2xl border-slate-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" /> Baixas Contábil vs Financeira
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-blue-200 bg-blue-50 mb-4">
            <AlertDescription className="text-xs text-blue-900">
              <strong>Baixa Contábil:</strong> Registro do recebimento esperado (arquivo retorno)
              <br />
              <strong>Baixa Financeira:</strong> Efetiva entrada do dinheiro na conta
            </AlertDescription>
          </Alert>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-blue-700 mb-1">Baixa Contábil Pendente</p>
              <p className="text-lg font-bold text-blue-900">R$ 0,00</p>
            </div>
            <div className="bg-violet-50 rounded-lg p-3">
              <p className="text-xs text-violet-700 mb-1">Baixa Financeira Pendente</p>
              <p className="text-lg font-bold text-violet-900">R$ 0,00</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3">
              <p className="text-xs text-emerald-700 mb-1">Totalmente Conciliado</p>
              <p className="text-lg font-bold text-emerald-900">R$ {totalReceived.toLocaleString("pt-BR")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lotes de Cessão Pendentes */}
      <Card className="rounded-2xl border-slate-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-4 h-4 text-violet-600" /> Lotes de Cessão para Conciliar
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cessionBatches.length === 0 ? (
            <p className="text-center py-8 text-slate-400 text-sm">Nenhum lote de cessão encontrado</p>
          ) : (
            <div className="space-y-3">
              {cessionBatches.map((batch) => {
                const alreadyReconciled = reconciliations.find(r => r.cession_batch_id === batch.batch_id);
                
                return (
                  <div key={batch.batch_id} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-slate-900">{batch.batch_id}</p>
                          {alreadyReconciled && (
                            <Badge className={`${statusConfig[alreadyReconciled.status].color} border-0 text-xs`}>
                              {statusConfig[alreadyReconciled.status].label}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-600">
                          <span>FIDC: {batch.fidc_name}</span>
                          <span>•</span>
                          <span>SCD: {batch.scd_partner}</span>
                          <span>•</span>
                          <span>{batch.contracts.length} contratos</span>
                          {batch.cession_date && (
                            <>
                              <span>•</span>
                              <span>{format(new Date(batch.cession_date), "dd/MM/yyyy")}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                        onClick={() => openReconcileDialog(batch)}
                      >
                        <ArrowDownUp className="w-3 h-3 mr-2" />
                        {alreadyReconciled ? "Ver Conciliação" : "Conciliar"}
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-200">
                      <div>
                        <p className="text-xs text-slate-500">Valor Contratos</p>
                        <p className="text-sm font-semibold text-slate-900">
                          R$ {batch.total_value.toLocaleString("pt-BR")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Valor Cessão (Esperado)</p>
                        <p className="text-sm font-semibold text-blue-700">
                          R$ {batch.total_cession.toLocaleString("pt-BR")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-emerald-600">🎯 Ágio (Receita)</p>
                        <p className="text-sm font-semibold text-emerald-700">
                          R$ {(batch.total_value - batch.total_cession).toLocaleString("pt-BR")}
                        </p>
                        <p className="text-xs text-emerald-500 mt-0.5">
                          {batch.total_value > 0 ? (((batch.total_value - batch.total_cession) / batch.total_value) * 100).toFixed(1) : 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Conciliações */}
      <Card className="rounded-2xl border-slate-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-600" /> Histórico de Conciliações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reconciliations.length === 0 ? (
            <p className="text-center py-8 text-slate-400 text-sm">Nenhuma conciliação registrada</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase">Data</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase">Lote</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase">FIDC</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase">Esperado</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase">Recebido</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase">Diferença</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reconciliations.map((rec) => {
                    const Icon = statusConfig[rec.status]?.icon || Clock;
                    return (
                      <TableRow key={rec.id} className="hover:bg-slate-50/50">
                        <TableCell className="text-sm text-slate-600">
                          {rec.reference_date ? format(new Date(rec.reference_date), "dd/MM/yyyy") : "—"}
                        </TableCell>
                        <TableCell className="text-sm font-medium text-slate-900">
                          {rec.cession_batch_id}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">{rec.fidc_name || "—"}</TableCell>
                        <TableCell className="text-sm font-semibold text-blue-700">
                          R$ {(rec.expected_amount || 0).toLocaleString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-sm font-semibold text-emerald-600">
                          R$ {(rec.received_amount || 0).toLocaleString("pt-BR")}
                        </TableCell>
                        <TableCell className={`text-sm font-semibold ${Math.abs(rec.difference || 0) > 1 ? "text-red-600" : "text-slate-400"}`}>
                          R$ {Math.abs(rec.difference || 0).toLocaleString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusConfig[rec.status]?.color || "bg-slate-100 text-slate-600"} border-0 text-xs flex items-center gap-1 w-fit`}>
                            <Icon className="w-3 h-3" />
                            {statusConfig[rec.status]?.label || rec.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Conciliação */}
      <Dialog open={reconcileOpen} onOpenChange={setReconcileOpen}>
        <DialogContent className="rounded-2xl max-w-2xl">
          <DialogHeader>
            <DialogTitle>Conciliar Recebimento - {selectedBatch?.batch_id}</DialogTitle>
          </DialogHeader>
          {selectedBatch && (
            <div className="space-y-4 pt-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">FIDC:</span>
                    <p className="font-medium text-slate-900">{selectedBatch.fidc_name}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">SCD:</span>
                    <p className="font-medium text-slate-900">{selectedBatch.scd_partner}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Contratos:</span>
                    <p className="font-medium text-slate-900">{selectedBatch.contracts.length}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Data Cessão:</span>
                    <p className="font-medium text-slate-900">
                      {selectedBatch.cession_date ? format(new Date(selectedBatch.cession_date), "dd/MM/yyyy") : "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-xs text-blue-700 mb-1">Valor Esperado (Calculado)</p>
                  <p className="text-2xl font-bold text-blue-900">
                    R$ {selectedBatch.total_cession.toLocaleString("pt-BR")}
                  </p>
                </div>
                <div>
                  <Label>Valor Recebido (Extrato Bancário)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={reconcileForm.received_amount}
                    onChange={e => setReconcileForm(prev => ({ ...prev, received_amount: e.target.value }))}
                    className="rounded-xl mt-1"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {reconcileForm.received_amount && (
                <div className={`rounded-xl p-4 border ${Math.abs(selectedBatch.total_cession - parseFloat(reconcileForm.received_amount)) < 1 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                  <p className="text-xs font-medium mb-1">
                    {Math.abs(selectedBatch.total_cession - parseFloat(reconcileForm.received_amount)) < 1 ? "✓ Valores Conferem" : "⚠ Divergência Detectada"}
                  </p>
                  <p className={`text-sm font-semibold ${Math.abs(selectedBatch.total_cession - parseFloat(reconcileForm.received_amount)) < 1 ? "text-emerald-700" : "text-red-700"}`}>
                    Diferença: R$ {Math.abs(selectedBatch.total_cession - parseFloat(reconcileForm.received_amount)).toLocaleString("pt-BR")}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data do Extrato</Label>
                  <Input
                    type="date"
                    value={reconcileForm.bank_statement_date}
                    onChange={e => setReconcileForm(prev => ({ ...prev, bank_statement_date: e.target.value }))}
                    className="rounded-xl mt-1"
                  />
                </div>
                <div>
                  <Label>ID Transação Bancária (opcional)</Label>
                  <Input
                    value={reconcileForm.bank_transaction_id}
                    onChange={e => setReconcileForm(prev => ({ ...prev, bank_transaction_id: e.target.value }))}
                    className="rounded-xl mt-1"
                    placeholder="Ex: TRN123456"
                  />
                </div>
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea
                  value={reconcileForm.notes}
                  onChange={e => setReconcileForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="rounded-xl mt-1"
                  placeholder="Adicione observações sobre a conciliação..."
                  rows={3}
                />
              </div>

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl"
                onClick={handleReconcile}
                disabled={!reconcileForm.received_amount || !reconcileForm.bank_statement_date || createReconciliationMutation.isPending}
              >
                {createReconciliationMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Confirmar Conciliação
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}