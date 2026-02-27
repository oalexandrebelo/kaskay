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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Plus, TrendingUp, Users, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export default function CommissionManagement() {
  const queryClient = useQueryClient();
  const [openNewCommission, setOpenNewCommission] = useState(false);
  const [openReferralCode, setOpenReferralCode] = useState(false);
  const [formData, setFormData] = useState({
    user_id: "",
    commission_type: "referral",
    base_amount: "",
    commission_rate: "",
    referral_code: "",
    proposal_id: "",
  });

  const { data: commissions = [] } = useQuery({
    queryKey: ["commissions"],
    queryFn: () => base44.entities.Commission.list("-created_date", 1000),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: proposals = [] } = useQuery({
    queryKey: ["proposals"],
    queryFn: () => base44.entities.Proposal.list("-created_date", 500),
  });

  const createCommissionMutation = useMutation({
    mutationFn: (data) => {
      const commissionAmount = (Number(data.base_amount) * Number(data.commission_rate)) / 100;
      return base44.entities.Commission.create({
        user_id: data.user_id,
        user_email: employees.find(e => e.id === data.user_id)?.email,
        commission_type: data.commission_type,
        base_amount: Number(data.base_amount),
        commission_rate: Number(data.commission_rate),
        commission_amount: commissionAmount,
        referral_code: data.referral_code || undefined,
        proposal_id: data.proposal_id || undefined,
        status: "pending",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commissions"] });
      setOpenNewCommission(false);
      setFormData({
        user_id: "",
        commission_type: "referral",
        base_amount: "",
        commission_rate: "",
        referral_code: "",
        proposal_id: "",
      });
    },
  });

  const approveCommissionMutation = useMutation({
    mutationFn: (commissionId) =>
      base44.entities.Commission.update(commissionId, { status: "approved" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commissions"] });
    },
  });

  const payCommissionMutation = useMutation({
    mutationFn: (commissionId) =>
      base44.entities.Commission.update(commissionId, {
        status: "paid",
        payment_date: new Date().toISOString().split('T')[0],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commissions"] });
    },
  });

  const statusColor = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-blue-100 text-blue-800",
    paid: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  const statusLabel = {
    pending: "Pendente",
    approved: "Aprovada",
    paid: "Paga",
    cancelled: "Cancelada",
  };

  const typeLabel = {
    referral: "Indicação",
    sale: "Venda",
    collection_recovery: "Cobrança",
    performance_bonus: "Bônus Performance",
  };

  // Cálculos
  const totalCommissions = commissions.reduce((sum, c) => sum + (c.commission_amount || 0), 0);
  const pendingCommissions = commissions.filter(c => c.status === "pending").length;
  const paidCommissions = commissions.filter(c => c.status === "paid").reduce((sum, c) => sum + (c.commission_amount || 0), 0);
  const commissionsByEmployee = employees.map(emp => ({
    ...emp,
    total: commissions
      .filter(c => c.user_id === emp.id && c.status === "paid")
      .reduce((sum, c) => sum + (c.commission_amount || 0), 0),
    pending: commissions
      .filter(c => c.user_id === emp.id && c.status === "pending")
      .reduce((sum, c) => sum + (c.commission_amount || 0), 0),
  })).filter(e => e.total > 0 || e.pending > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gerenciamento de Comissões</h1>
          <p className="text-slate-500 mt-1">Gerencie comissões, indicações e remuneração de agentes</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={openReferralCode} onOpenChange={setOpenReferralCode}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-lg">
                <Plus className="w-4 h-4 mr-2" />
                Novo Cupom
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>Gerar Código de Indicação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Comissionado</Label>
                  <Select value={formData.user_id} onValueChange={(value) => setFormData({ ...formData, user_id: value })}>
                    <SelectTrigger className="rounded-lg mt-2">
                      <SelectValue placeholder="Selecione um comissionado" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Código de Cupom</Label>
                  <Input
                    placeholder="Ex: CUPOM2024AGENTE"
                    value={formData.referral_code}
                    onChange={(e) => setFormData({ ...formData, referral_code: e.target.value })}
                    className="rounded-lg mt-2"
                  />
                </div>
                <div>
                  <Label>Taxa de Comissão (%)</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 5"
                    value={formData.commission_rate}
                    onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                    className="rounded-lg mt-2"
                  />
                </div>
                <Button
                  onClick={() => {
                    createCommissionMutation.mutate({
                      ...formData,
                      commission_type: "referral",
                      base_amount: 0,
                    });
                  }}
                  disabled={!formData.user_id || !formData.referral_code}
                  className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Gerar Cupom
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={openNewCommission} onOpenChange={setOpenNewCommission}>
            <DialogTrigger asChild>
              <Button className="rounded-lg bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Nova Comissão
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>Registrar Nova Comissão</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Comissionado</Label>
                  <Select value={formData.user_id} onValueChange={(value) => setFormData({ ...formData, user_id: value })}>
                    <SelectTrigger className="rounded-lg mt-2">
                      <SelectValue placeholder="Selecione um comissionado" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Valor Base (R$)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.base_amount}
                      onChange={(e) => setFormData({ ...formData, base_amount: e.target.value })}
                      className="rounded-lg mt-2"
                    />
                  </div>
                  <div>
                    <Label>Taxa (%)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.commission_rate}
                      onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                      className="rounded-lg mt-2"
                    />
                  </div>
                </div>
                {formData.base_amount && formData.commission_rate && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900">
                      Comissão: R$ {((Number(formData.base_amount) * Number(formData.commission_rate)) / 100).toFixed(2)}
                    </p>
                  </div>
                )}
                <Button
                  onClick={() => createCommissionMutation.mutate(formData)}
                  disabled={!formData.user_id || !formData.base_amount || !formData.commission_rate}
                  className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Registrar Comissão
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Comissões</p>
                <p className="text-2xl font-bold text-slate-900">R$ {(totalCommissions / 1000).toFixed(1)}k</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Pendentes</p>
                <p className="text-2xl font-bold text-slate-900">{pendingCommissions}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Pagas</p>
                <p className="text-2xl font-bold text-slate-900">R$ {(paidCommissions / 1000).toFixed(1)}k</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Comissionados</p>
                <p className="text-2xl font-bold text-slate-900">{commissionsByEmployee.length}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="comissoes" className="w-full">
        <TabsList className="grid w-full grid-cols-2 rounded-lg">
          <TabsTrigger value="comissoes">Comissões</TabsTrigger>
          <TabsTrigger value="comissionados">Comissionados</TabsTrigger>
        </TabsList>

        {/* Comissões */}
        <TabsContent value="comissoes" className="space-y-4">
          <Card className="rounded-xl border-slate-100">
            <CardHeader>
              <CardTitle>Lista de Comissões</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Comissionado</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Tipo</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-600">Valor</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-600">Comissão</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-600">Status</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-600">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.slice(0, 20).map(commission => {
                      const employee = employees.find(e => e.id === commission.user_id);
                      return (
                        <tr key={commission.id} className="border-b border-slate-50 hover:bg-slate-50">
                          <td className="py-3 px-4">{employee?.full_name || commission.user_email}</td>
                          <td className="py-3 px-4">
                            <Badge variant="outline">{typeLabel[commission.commission_type]}</Badge>
                          </td>
                          <td className="py-3 px-4 text-right">R$ {(commission.base_amount || 0).toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-semibold">R$ {(commission.commission_amount || 0).toFixed(2)}</td>
                          <td className="py-3 px-4 text-center">
                            <Badge className={statusColor[commission.status]}>
                              {statusLabel[commission.status]}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-center space-x-1">
                            {commission.status === "pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => approveCommissionMutation.mutate(commission.id)}
                                className="rounded-lg"
                              >
                                Aprovar
                              </Button>
                            )}
                            {commission.status === "approved" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => payCommissionMutation.mutate(commission.id)}
                                className="rounded-lg"
                              >
                                Pagar
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comissionados */}
        <TabsContent value="comissionados" className="space-y-4">
          <Card className="rounded-xl border-slate-100">
            <CardHeader>
              <CardTitle>Comissionados - Resumo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {commissionsByEmployee.map(emp => (
                  <div key={emp.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-slate-900">{emp.full_name}</p>
                        <p className="text-xs text-slate-500">{emp.email}</p>
                      </div>
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Pagas:</span>
                        <span className="font-semibold text-green-600">R$ {emp.total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Pendentes:</span>
                        <span className="font-semibold text-yellow-600">R$ {emp.pending.toFixed(2)}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-200">
                        <span className="text-sm font-semibold text-slate-900">
                          Total: R$ {(emp.total + emp.pending).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {commissionsByEmployee.length === 0 && (
                <p className="text-center text-slate-400 py-8">Nenhum comissionado com comissões registradas</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}