import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import VirtualizedTable from "@/components/common/VirtualizedTable";
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  FileText, 
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle2,
  DollarSign
} from "lucide-react";
import { format } from "date-fns";

const actionTypeIcons = {
  sms: MessageSquare,
  whatsapp: MessageSquare,
  email: Mail,
  call: Phone,
  letter: FileText,
  lawyer_referral: AlertTriangle,
};

const actionStatusColors = {
  scheduled: "bg-blue-100 text-blue-700",
  sent: "bg-indigo-100 text-indigo-700",
  delivered: "bg-emerald-100 text-emerald-700",
  read: "bg-purple-100 text-purple-700",
  responded: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

export default function CollectionDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: collectionActions = [], isLoading: actionsLoading } = useQuery({
    queryKey: ["collection_actions"],
    queryFn: () => base44.entities.CollectionAction.list("-executed_at", 500),
  });

  const { data: collectionRules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ["collection_rules"],
    queryFn: () => base44.entities.CollectionRule.list(),
  });

  const { data: installments = [], isLoading: installmentsLoading } = useQuery({
    queryKey: ["installments"],
    queryFn: () => base44.entities.Installment.list(),
  });

  const executeRuleMutation = useMutation({
    mutationFn: () => base44.functions.invoke('executeCollectionRule', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection_actions"] });
    },
  });

  // Calcular KPIs
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueInstallments = installments.filter(inst => {
    const dueDate = new Date(inst.due_date);
    return dueDate < today && inst.status !== 'paid';
  });

  const totalOverdueAmount = overdueInstallments.reduce((sum, i) => sum + (i.expected_amount || 0), 0);

  const actionsLast7Days = collectionActions.filter(action => {
    const executedDate = new Date(action.executed_at || action.created_date);
    const daysDiff = Math.floor((today.getTime() - executedDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 7;
  });

  const successfulActions = actionsLast7Days.filter(a => a.resulted_in_payment);
  const successRate = actionsLast7Days.length > 0 
    ? (successfulActions.length / actionsLast7Days.length) * 100 
    : 0;

  const recoveredAmount = successfulActions.reduce((sum, a) => sum + (a.outstanding_amount || 0), 0);

  // Definir colunas da tabela
  const columns = [
    {
      header: "Cliente",
      accessor: (row) => row.client_name,
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.client_name}</p>
          <p className="text-xs text-slate-500">{row.client_cpf}</p>
        </div>
      ),
    },
    {
      header: "Ação",
      accessor: (row) => row.action_type,
      render: (row) => {
        const Icon = actionTypeIcons[row.action_type] || MessageSquare;
        return (
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-slate-600" />
            <span className="text-sm text-slate-900">{row.action_type}</span>
          </div>
        );
      },
    },
    {
      header: "Dias Atraso",
      accessor: (row) => row.days_overdue,
      render: (row) => (
        <Badge className={`${row.days_overdue > 30 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'} border-0`}>
          {row.days_overdue} dias
        </Badge>
      ),
    },
    {
      header: "Valor",
      accessor: (row) => row.outstanding_amount,
      render: (row) => (
        <span className="font-semibold text-slate-900">
          R$ {row.outstanding_amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: (row) => row.action_status,
      render: (row) => (
        <Badge className={`${actionStatusColors[row.action_status] || 'bg-slate-100 text-slate-700'} border-0`}>
          {row.action_status}
        </Badge>
      ),
    },
    {
      header: "Resultado",
      accessor: (row) => row.resulted_in_payment,
      render: (row) => (
        row.resulted_in_payment ? (
          <Badge className="bg-green-100 text-green-700 border-0">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Pago
          </Badge>
        ) : null
      ),
    },
    {
      header: "Data",
      accessor: (row) => row.executed_at || row.scheduled_for,
      render: (row) => (
        <span className="text-sm text-slate-600">
          {row.executed_at 
            ? format(new Date(row.executed_at), 'dd/MM/yyyy HH:mm')
            : row.scheduled_for 
            ? format(new Date(row.scheduled_for), 'dd/MM/yyyy HH:mm')
            : '—'}
        </span>
      ),
    },
  ];

  if (actionsLoading || rulesLoading || installmentsLoading) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestão de Cobrança</h1>
          <p className="text-slate-500 text-sm mt-1">Régua multicanal e recuperação de crédito</p>
        </div>
        <Button
          onClick={() => executeRuleMutation.mutate()}
          disabled={executeRuleMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700 rounded-xl"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Executar Régua
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-red-100 bg-red-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-red-700 uppercase">Em Atraso</p>
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-900">{overdueInstallments.length}</p>
            <p className="text-xs text-red-600 mt-1">
              R$ {(totalOverdueAmount / 1000).toFixed(0)}k
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-100 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-blue-700 uppercase">Ações (7d)</p>
              <MessageSquare className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-900">{actionsLast7Days.length}</p>
            <p className="text-xs text-blue-600 mt-1">Última semana</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 bg-emerald-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-emerald-700 uppercase">Taxa Sucesso</p>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-900">{successRate.toFixed(1)}%</p>
            <p className="text-xs text-emerald-600 mt-1">{successfulActions.length} pagamentos</p>
          </CardContent>
        </Card>

        <Card className="border-green-100 bg-green-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-green-700 uppercase">Recuperado</p>
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-900">
              R$ {(recoveredAmount / 1000).toFixed(0)}k
            </p>
            <p className="text-xs text-green-600 mt-1">Últimos 7 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Réguas Ativas */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Réguas de Cobrança Configuradas</CardTitle>
        </CardHeader>
        <CardContent>
          {collectionRules.length === 0 ? (
            <p className="text-center py-8 text-slate-400 text-sm">Nenhuma régua configurada</p>
          ) : (
            <div className="space-y-3">
              {collectionRules.map((rule) => (
                <div key={rule.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-slate-900">{rule.rule_name}</h3>
                    <Badge className={rule.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}>
                      {rule.is_active ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p>Atraso: {rule.days_overdue_from} - {rule.days_overdue_to || "∞"} dias</p>
                    <p>Ações: {rule.actions?.length || 0} etapas configuradas</p>
                    {rule.success_rate !== undefined && (
                      <p>Taxa de sucesso: {rule.success_rate.toFixed(1)}%</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Ações */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Histórico de Ações</CardTitle>
        </CardHeader>
        <CardContent>
          <VirtualizedTable
            data={collectionActions}
            columns={columns}
            pageSize={50}
            searchTerm={searchTerm}
          />
        </CardContent>
      </Card>
    </div>
  );
}