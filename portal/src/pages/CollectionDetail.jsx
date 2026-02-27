import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, DollarSign, AlertTriangle, User, Building2, Calendar, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const issueColors = {
  open: "bg-red-100 text-red-700",
  in_collection: "bg-amber-100 text-amber-700",
  negotiating: "bg-blue-100 text-blue-700",
  legal: "bg-purple-100 text-purple-700",
  resolved: "bg-emerald-100 text-emerald-700",
  written_off: "bg-slate-100 text-slate-500",
};

export default function CollectionDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [chargeAmount, setChargeAmount] = useState("");

  const { data: issue, isLoading } = useQuery({
    queryKey: ["payment_issue", id],
    queryFn: () => base44.entities.PaymentIssue.filter({ id }),
    enabled: !!id,
    select: data => data?.[0],
  });

  const { data: proposal } = useQuery({
    queryKey: ["proposal", issue?.proposal_id],
    queryFn: () => base44.entities.Proposal.filter({ id: issue.proposal_id }),
    enabled: !!issue?.proposal_id,
    select: data => data?.[0],
  });

  const updateMutation = useMutation({
    mutationFn: (updates) => base44.entities.PaymentIssue.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment_issue", id] });
      setNote("");
    },
  });

  const createAsaasChargeMutation = useMutation({
    mutationFn: async () => {
      // Aqui seria a integração real com Asaas
      const mockChargeId = `CHG-${Date.now()}`;
      await base44.entities.PaymentIssue.update(id, {
        asaas_charge_id: mockChargeId,
        collection_strategy: "asaas_collection",
        status: "in_collection",
        resolution_notes: `Cobrança criada no Asaas: R$ ${chargeAmount}`,
      });
      return mockChargeId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment_issue", id] });
      setChargeAmount("");
    },
  });

  if (isLoading) return (
    <div className="space-y-4">
      {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
    </div>
  );

  if (!issue) return (
    <div className="text-center py-20 text-slate-400">Caso de cobrança não encontrado</div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl("Collections")}>
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Caso #{id?.slice(-6)}</h1>
            <Badge className={`${issueColors[issue.status]} border-0 text-xs font-semibold`}>
              {issue.status?.replace(/_/g, " ")}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">{issue.client_name}</p>
        </div>
        <div className="flex gap-2">
          <Select 
            value={issue.status} 
            onValueChange={v => updateMutation.mutate({ status: v, resolution_notes: note })}
          >
            <SelectTrigger className="w-40 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Aberto</SelectItem>
              <SelectItem value="in_collection">Em Cobrança</SelectItem>
              <SelectItem value="negotiating">Negociando</SelectItem>
              <SelectItem value="legal">Jurídico</SelectItem>
              <SelectItem value="resolved">Resolvido</SelectItem>
              <SelectItem value="written_off">Baixado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl border-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" /> Detalhes do Problema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Tipo</span>
                  <p className="font-medium text-slate-900 capitalize">{issue.issue_type?.replace(/_/g, " ")}</p>
                </div>
                <div>
                  <span className="text-slate-400">Prioridade</span>
                  <p className="font-medium text-slate-900 uppercase">{issue.severity}</p>
                </div>
                <div>
                  <span className="text-slate-400">Valor em Aberto</span>
                  <p className="font-semibold text-red-600">R$ {(issue.outstanding_amount || 0).toLocaleString("pt-BR")}</p>
                </div>
                <div>
                  <span className="text-slate-400">Dias de Atraso</span>
                  <p className="font-semibold text-orange-600">{issue.days_overdue || 0} dias</p>
                </div>
                <div>
                  <span className="text-slate-400">Estratégia</span>
                  <p className="font-medium text-slate-900 capitalize text-xs">{issue.collection_strategy?.replace(/_/g, " ") || "—"}</p>
                </div>
                <div>
                  <span className="text-slate-400">Próxima Ação</span>
                  <p className="font-medium text-slate-900">{issue.next_action_date ? format(new Date(issue.next_action_date), "dd/MM/yyyy") : "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" /> Dados do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Nome</span>
                  <p className="font-medium text-slate-900">{issue.client_name}</p>
                </div>
                <div>
                  <span className="text-slate-400">CPF</span>
                  <p className="font-medium text-slate-900">{issue.client_cpf}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400">Proposta</span>
                  <Link to={createPageUrl("ProposalDetail") + `?id=${issue.proposal_id}`} className="font-medium text-blue-600 hover:text-blue-700">
                    {proposal?.proposal_number || `#${issue.proposal_id?.slice(-6)}`}
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4 text-violet-600" /> Órgão Pagador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="col-span-2">
                  <span className="text-slate-400">Órgão</span>
                  <p className="font-medium text-slate-900">{issue.employer || "—"}</p>
                </div>
                {issue.last_contact_date && (
                  <div>
                    <span className="text-slate-400">Último Contato</span>
                    <p className="font-medium text-slate-900">{format(new Date(issue.last_contact_date), "dd/MM/yyyy")}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Integração Asaas */}
          <Card className="rounded-2xl border-blue-100 bg-blue-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-600" /> Criar Cobrança Alternativa (Asaas)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-600">
                Se o órgão público não está pagando, você pode criar uma cobrança direta para o cliente via Asaas (boleto/PIX/cartão).
              </p>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <Label>Valor da Cobrança</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={chargeAmount}
                    onChange={e => setChargeAmount(e.target.value)}
                    className="rounded-xl mt-1"
                  />
                </div>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 rounded-xl"
                  onClick={() => createAsaasChargeMutation.mutate()}
                  disabled={!chargeAmount || createAsaasChargeMutation.isPending}
                >
                  {createAsaasChargeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Criar Cobrança
                </Button>
              </div>
              {issue.asaas_charge_id && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-800">
                  <strong>Cobrança criada:</strong> {issue.asaas_charge_id}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="rounded-2xl border-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Observações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Adicionar nota sobre a cobrança..."
                value={note}
                onChange={e => setNote(e.target.value)}
                className="rounded-xl resize-none"
                rows={3}
              />
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl"
                onClick={() => updateMutation.mutate({ resolution_notes: note })}
                disabled={!note || updateMutation.isPending}
              >
                <Send className="w-4 h-4 mr-2" /> Salvar Nota
              </Button>
              {issue.resolution_notes && (
                <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-600 mt-3">
                  {issue.resolution_notes}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" /> Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="border-l-2 border-slate-200 pl-3 py-1">
                  <p className="text-xs font-medium text-slate-700">Caso criado</p>
                  <p className="text-[10px] text-slate-400">
                    {issue.created_date ? format(new Date(issue.created_date), "dd/MM HH:mm") : ""}
                  </p>
                </div>
                {issue.last_contact_date && (
                  <div className="border-l-2 border-blue-300 pl-3 py-1">
                    <p className="text-xs font-medium text-blue-700">Último contato</p>
                    <p className="text-[10px] text-slate-400">
                      {format(new Date(issue.last_contact_date), "dd/MM HH:mm")}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}