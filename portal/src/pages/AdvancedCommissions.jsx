import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, Users, Calendar, Play } from "lucide-react";
import { toast } from "sonner";

export default function AdvancedCommissions() {
  const queryClient = useQueryClient();
  const [processing, setProcessing] = useState(false);

  const { data: commissions = [] } = useQuery({
    queryKey: ["commissions"],
    queryFn: () => base44.entities.Commission.list("-created_date", 100),
  });

  const { data: rules = [] } = useQuery({
    queryKey: ["commission_rules"],
    queryFn: () => base44.entities.CommissionRule.list(),
  });

  const processCommissionsMutation = useMutation({
    mutationFn: () => base44.functions.invoke("processMonthlyCommissions", {}),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["commissions"] });
      toast.success(`${response.data.processed} comissões processadas!`);
      setProcessing(false);
    },
    onError: () => {
      toast.error("Erro ao processar comissões");
      setProcessing(false);
    },
  });

  const handleProcessCommissions = () => {
    setProcessing(true);
    processCommissionsMutation.mutate();
  };

  const pendingCommissions = commissions.filter((c) => c.status === "pending");
  const approvedCommissions = commissions.filter((c) => c.status === "approved");
  const paidCommissions = commissions.filter((c) => c.status === "paid");

  const totalPending = pendingCommissions.reduce((sum, c) => sum + (c.commission_amount || 0), 0);
  const totalApproved = approvedCommissions.reduce((sum, c) => sum + (c.commission_amount || 0), 0);
  const totalPaid = paidCommissions.reduce((sum, c) => sum + (c.commission_amount || 0), 0);

  const getStatusBadge = (status) => {
    const config = {
      pending: { label: "Pendente", variant: "outline" },
      approved: { label: "Aprovado", variant: "secondary" },
      paid: { label: "Pago", variant: "default" },
      cancelled: { label: "Cancelado", variant: "destructive" },
    };
    const { label, variant } = config[status] || config.pending;
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getTypeBadge = (type) => {
    const config = {
      referral: { label: "Indicação", className: "bg-purple-100 text-purple-700" },
      sale: { label: "Venda", className: "bg-blue-100 text-blue-700" },
      collection_recovery: { label: "Recuperação", className: "bg-green-100 text-green-700" },
      performance_bonus: { label: "Bônus", className: "bg-orange-100 text-orange-700" },
    };
    const { label, className } = config[type] || { label: type, className: "bg-slate-100 text-slate-700" };
    return <Badge className={className}>{label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Comissões</h1>
          <p className="text-slate-600 mt-1">Gestão avançada de comissões e pagamentos</p>
        </div>
        <Button onClick={handleProcessCommissions} disabled={processing}>
          <Play className="w-4 h-4 mr-2" />
          {processing ? "Processando..." : "Processar Comissões"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Pendente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold">R$ {totalPending.toLocaleString("pt-BR")}</div>
              <div className="text-sm text-slate-500">{pendingCommissions.length}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Aprovado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-blue-600">R$ {totalApproved.toLocaleString("pt-BR")}</div>
              <div className="text-sm text-slate-500">{approvedCommissions.length}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-green-600">R$ {totalPaid.toLocaleString("pt-BR")}</div>
              <div className="text-sm text-slate-500">{paidCommissions.length}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {(totalPending + totalApproved + totalPaid).toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">Pendentes ({pendingCommissions.length})</TabsTrigger>
          <TabsTrigger value="approved">Aprovadas ({approvedCommissions.length})</TabsTrigger>
          <TabsTrigger value="paid">Pagas ({paidCommissions.length})</TabsTrigger>
          <TabsTrigger value="rules">Regras ({rules.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3 mt-4">
          {pendingCommissions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-500">
                Nenhuma comissão pendente
              </CardContent>
            </Card>
          ) : (
            pendingCommissions.map((commission) => (
              <Card key={commission.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{commission.user_email}</span>
                        {getTypeBadge(commission.commission_type)}
                      </div>
                      <div className="text-sm text-slate-600">
                        Proposta #{commission.proposal_id?.slice(0, 8)} • Base: R${" "}
                        {commission.base_amount?.toLocaleString("pt-BR")} • Taxa: {commission.commission_rate}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">
                        R$ {commission.commission_amount?.toLocaleString("pt-BR")}
                      </div>
                      <div className="text-sm text-slate-500">
                        {new Date(commission.created_date).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-3 mt-4">
          {approvedCommissions.map((commission) => (
            <Card key={commission.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{commission.user_email}</span>
                      {getTypeBadge(commission.commission_type)}
                      {getStatusBadge(commission.status)}
                    </div>
                    <div className="text-sm text-slate-600">
                      Proposta #{commission.proposal_id?.slice(0, 8)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      R$ {commission.commission_amount?.toLocaleString("pt-BR")}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="paid" className="space-y-3 mt-4">
          {paidCommissions.map((commission) => (
            <Card key={commission.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{commission.user_email}</span>
                      {getTypeBadge(commission.commission_type)}
                    </div>
                    <div className="text-sm text-slate-600">
                      Pago em: {new Date(commission.payment_date).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      R$ {commission.commission_amount?.toLocaleString("pt-BR")}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="rules" className="mt-4">
          <div className="grid gap-4">
            {rules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{rule.name}</CardTitle>
                    <Badge variant={rule.is_active ? "default" : "outline"}>
                      {rule.is_active ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-slate-600">Método</div>
                      <div className="font-medium">{rule.calculation_method}</div>
                    </div>
                    <div>
                      <div className="text-slate-600">Taxa Base</div>
                      <div className="font-medium">{rule.commission_rate}%</div>
                    </div>
                    {rule.user_role && (
                      <div>
                        <div className="text-slate-600">Role</div>
                        <div className="font-medium">{rule.user_role}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-slate-600">Prioridade</div>
                      <div className="font-medium">{rule.priority}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}