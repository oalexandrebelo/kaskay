import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import VirtualizedTable from "@/components/common/VirtualizedTable";
import { 
  DollarSign, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  Settings
} from "lucide-react";
import { format } from "date-fns";

export default function PortfolioOperations() {
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [operationType, setOperationType] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [operationData, setOperationData] = useState({});
  const queryClient = useQueryClient();

  const { data: proposals = [], isLoading: proposalsLoading } = useQuery({
    queryKey: ["disbursed_proposals"],
    queryFn: () => base44.entities.Proposal.filter({ status: "disbursed" }),
  });

  const { data: installments = [], isLoading: installmentsLoading } = useQuery({
    queryKey: ["installments"],
    queryFn: () => base44.entities.Installment.list(),
  });

  const executeOperationMutation = useMutation({
    mutationFn: async (data) => {
      // Criar registro da operação
      await base44.entities.ContractOperation.create(data);
      
      // Executar operação nas parcelas
      if (data.operation_type === 'partial_payment') {
        const installment = installments.find(i => i.id === data.installments_affected[0]);
        const newAmount = installment.expected_amount - data.payment_amount;
        await base44.entities.Installment.update(installment.id, {
          expected_amount: newAmount,
          paid_amount: data.payment_amount,
          status: newAmount <= 0 ? 'paid' : 'pending',
        });
      } else if (data.operation_type === 'full_payment') {
        for (const instId of data.installments_affected) {
          await base44.entities.Installment.update(instId, {
            status: 'paid',
            paid_amount: data.payment_amount / data.installments_affected.length,
            paid_date: new Date().toISOString(),
          });
        }
      } else if (data.operation_type === 'prepayment') {
        // Liquidar todas as parcelas pendentes
        const pendingInst = installments.filter(i => 
          i.proposal_id === data.proposal_id && i.status === 'pending'
        );
        for (const inst of pendingInst) {
          await base44.entities.Installment.update(inst.id, {
            status: 'paid',
            paid_amount: inst.expected_amount,
            paid_date: new Date().toISOString(),
          });
        }
        await base44.entities.Proposal.update(data.proposal_id, {
          status: 'completed',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["installments"] });
      queryClient.invalidateQueries({ queryKey: ["disbursed_proposals"] });
      setDialogOpen(false);
      setSelectedProposal(null);
      setOperationData({});
    },
  });

  const openOperation = (proposal, type) => {
    setSelectedProposal(proposal);
    setOperationType(type);
    setOperationData({
      proposal_id: proposal.id,
      operation_type: type,
      original_amount: proposal.approved_amount,
      executed_by: 'current_user@example.com',
    });
    setDialogOpen(true);
  };

  const handleExecute = () => {
    executeOperationMutation.mutate(operationData);
  };

  const columns = [
    {
      header: "Proposta",
      accessor: (row) => row.proposal_number,
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.proposal_number || `#${row.id.slice(0, 8)}`}</p>
          <p className="text-xs text-slate-500">{row.client_name}</p>
        </div>
      ),
    },
    {
      header: "Valor Original",
      accessor: (row) => row.approved_amount,
      render: (row) => (
        <span className="font-semibold text-slate-900">
          R$ {row.approved_amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: "Saldo Devedor",
      accessor: (row) => row.id,
      render: (row) => {
        const proposalInstallments = installments.filter(i => i.proposal_id === row.id && i.status === 'pending');
        const balance = proposalInstallments.reduce((sum, i) => sum + (i.expected_amount || 0), 0);
        return (
          <span className="font-semibold text-blue-700">
            R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        );
      },
    },
    {
      header: "Parcelas",
      accessor: (row) => row.installments,
      render: (row) => {
        const proposalInstallments = installments.filter(i => i.proposal_id === row.id);
        const paid = proposalInstallments.filter(i => i.status === 'paid').length;
        return (
          <span className="text-sm text-slate-700">
            {paid}/{proposalInstallments.length}
          </span>
        );
      },
    },
    {
      header: "Ações",
      accessor: (row) => row.id,
      render: (row) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg"
            onClick={() => openOperation(row, 'partial_payment')}
          >
            Baixa Parcial
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg"
            onClick={() => openOperation(row, 'prepayment')}
          >
            Liquidar
          </Button>
        </div>
      ),
    },
  ];

  if (proposalsLoading || installmentsLoading) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestão de Carteira</h1>
        <p className="text-slate-500 text-sm mt-1">
          Operações de baixa, liquidação e renegociação de contratos
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-100 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-blue-700 uppercase">Contratos Ativos</p>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-900">{proposals.length}</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 bg-emerald-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-emerald-700 uppercase">Saldo Total</p>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-900">
              R$ {(installments.filter(i => i.status === 'pending').reduce((s, i) => s + (i.expected_amount || 0), 0) / 1000).toFixed(0)}k
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-100 bg-purple-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-purple-700 uppercase">Parcelas Pagas</p>
              <CheckCircle2 className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-900">
              {installments.filter(i => i.status === 'paid').length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-100 bg-amber-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-amber-700 uppercase">Vencidas</p>
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-900">
              {installments.filter(i => new Date(i.due_date) < new Date() && i.status !== 'paid').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Contratos */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Contratos Ativos</CardTitle>
        </CardHeader>
        <CardContent>
          <VirtualizedTable
            data={proposals}
            columns={columns}
            pageSize={50}
          />
        </CardContent>
      </Card>

      {/* Dialog de Operação */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {operationType === 'partial_payment' && 'Baixa Parcial'}
              {operationType === 'full_payment' && 'Baixa Integral'}
              {operationType === 'prepayment' && 'Liquidação Antecipada'}
            </DialogTitle>
          </DialogHeader>
          {selectedProposal && (
            <div className="space-y-4 pt-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-600">Cliente: <strong>{selectedProposal.client_name}</strong></p>
                <p className="text-sm text-slate-600">Proposta: <strong>{selectedProposal.proposal_number}</strong></p>
                <p className="text-sm text-slate-600">
                  Saldo: <strong className="text-blue-700">
                    R$ {installments.filter(i => i.proposal_id === selectedProposal.id && i.status === 'pending')
                      .reduce((s, i) => s + (i.expected_amount || 0), 0)
                      .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </strong>
                </p>
              </div>

              <div>
                <Label>Valor do Pagamento</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={operationData.payment_amount || ""}
                  onChange={(e) => setOperationData({...operationData, payment_amount: parseFloat(e.target.value)})}
                  className="rounded-xl mt-1"
                  placeholder="0.00"
                />
              </div>

              {operationType !== 'prepayment' && (
                <div>
                  <Label>Desconto Aplicado (opcional)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={operationData.discount_applied || ""}
                    onChange={(e) => setOperationData({...operationData, discount_applied: parseFloat(e.target.value)})}
                    className="rounded-xl mt-1"
                    placeholder="0.00"
                  />
                </div>
              )}

              <div>
                <Label>Observações</Label>
                <Textarea
                  value={operationData.notes || ""}
                  onChange={(e) => setOperationData({...operationData, notes: e.target.value})}
                  className="rounded-xl mt-1"
                  placeholder="Adicione observações sobre a operação..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleExecute}
                  disabled={!operationData.payment_amount || executeOperationMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Executar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}