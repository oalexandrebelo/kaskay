import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DollarSign, Clock, CheckCircle2, TrendingUp, ArrowRight, Loader2, Zap } from "lucide-react";
import { format } from "date-fns";

export default function ClientPortal() {
  const queryClient = useQueryClient();
  const [requestAmount, setRequestAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [step, setStep] = useState("balance"); // balance, request, pix, processing, success

  const { data: user } = useQuery({
    queryKey: ["current_user"],
    queryFn: () => base44.auth.me(),
  });

  const { data: client } = useQuery({
    queryKey: ["client_data", user?.email],
    queryFn: () => base44.entities.Client.filter({ email: user.email }),
    enabled: !!user,
    select: data => data?.[0],
  });

  const { data: proposals = [] } = useQuery({
    queryKey: ["client_proposals", client?.id],
    queryFn: () => base44.entities.Proposal.filter({ client_id: client.id }),
    enabled: !!client,
  });

  const createProposalMutation = useMutation({
    mutationFn: async (data) => {
      const proposal = await base44.entities.Proposal.create({
        client_id: client.id,
        client_name: client.full_name,
        client_cpf: client.cpf,
        requested_amount: parseFloat(data.amount),
        product_type: "adiantamento_salarial",
        status: "under_analysis",
        channel: "web",
        proposal_number: `WEB-${Date.now().toString(36).toUpperCase()}`,
      });
      return proposal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client_proposals"] });
      setStep("success");
    },
  });

  const availableBalance = client?.available_margin || 0;
  const activeProposal = proposals.find(p => !["rejected", "cancelled", "disbursed"].includes(p.status));

  const handleRequestSubmit = () => {
    if (parseFloat(requestAmount) > availableBalance) {
      alert("Valor solicitado maior que seu saldo disponível!");
      return;
    }
    setStep("pix");
  };

  const handlePixSubmit = () => {
    setStep("processing");
    createProposalMutation.mutate({ amount: requestAmount, pix_key: pixKey });
  };

  if (!client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-2xl border-slate-100">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-slate-600">Carregando seus dados...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center mx-auto shadow-lg">
              <span className="text-white text-2xl font-bold">K</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Olá, {client.full_name?.split(" ")[0]}! 👋</h1>
          <p className="text-slate-500">Seu dinheiro disponível 24/7</p>
        </div>

        {/* Balance Card */}
        {step === "balance" && (
          <Card className="rounded-2xl border-slate-100 shadow-xl bg-white/80 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">💰 Seu Saldo Disponível</CardTitle>
                <Badge className="bg-emerald-100 text-emerald-700 border-0">Disponível agora</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-6">
                <p className="text-sm text-slate-500 mb-2">Com base no seu salário já trabalhado:</p>
                <p className="text-5xl font-bold text-slate-900 mb-1">
                  R$ {availableBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-slate-400">Salário Bruto: R$ {(client.gross_salary || 0).toLocaleString("pt-BR")}</p>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-sm text-blue-900 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Como funciona?
                </p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>✓ Resgate disponível 24/7, qualquer dia da semana</li>
                  <li>✓ Dinheiro na sua conta via PIX em minutos</li>
                  <li>✓ Desconto automático na folha de pagamento</li>
                  <li>✓ 100% digital, sem burocracia</li>
                </ul>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl h-12 text-base font-semibold shadow-lg"
                onClick={() => setStep("request")}
                disabled={availableBalance <= 0}
              >
                <DollarSign className="w-5 h-5 mr-2" />
                Resgatar Agora
              </Button>

              {activeProposal && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                  <p className="text-sm font-semibold text-amber-900 mb-2">Você tem uma solicitação em andamento</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-amber-700">
                        R$ {(activeProposal.requested_amount || 0).toLocaleString("pt-BR")}
                      </p>
                      <p className="text-xs text-amber-600 capitalize">{activeProposal.status.replace(/_/g, " ")}</p>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">Em análise</Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Request Amount */}
        {step === "request" && (
          <Card className="rounded-2xl border-slate-100 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg">Quanto você precisa?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Valor do resgate</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={requestAmount}
                  onChange={e => setRequestAmount(e.target.value)}
                  className="rounded-xl mt-2 text-lg h-12"
                />
                <p className="text-xs text-slate-400 mt-2">
                  Disponível: R$ {availableBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="flex gap-2">
                {[500, 1000, 2000].map(val => (
                  <Button
                    key={val}
                    variant="outline"
                    size="sm"
                    onClick={() => setRequestAmount(val.toString())}
                    className="rounded-lg flex-1"
                  >
                    R$ {val}
                  </Button>
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="rounded-xl flex-1" onClick={() => setStep("balance")}>
                  Voltar
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 rounded-xl flex-1"
                  onClick={handleRequestSubmit}
                  disabled={!requestAmount || parseFloat(requestAmount) <= 0}
                >
                  Continuar <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* PIX Key */}
        {step === "pix" && (
          <Card className="rounded-2xl border-slate-100 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg">Informe sua chave PIX</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
                <p className="text-sm text-blue-900 mb-1">Você vai receber</p>
                <p className="text-3xl font-bold text-blue-700">
                  R$ {parseFloat(requestAmount || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-blue-600 mt-1">O dinheiro cai na hora! ⚡</p>
              </div>

              <div>
                <Label>Chave PIX</Label>
                <Input
                  placeholder="CPF, e-mail, telefone ou chave aleatória"
                  value={pixKey}
                  onChange={e => setPixKey(e.target.value)}
                  className="rounded-xl mt-2 h-12"
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="rounded-xl flex-1" onClick={() => setStep("request")}>
                  Voltar
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 rounded-xl flex-1"
                  onClick={handlePixSubmit}
                  disabled={!pixKey || createProposalMutation.isPending}
                >
                  {createProposalMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Confirmar Resgate
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Processing */}
        {step === "processing" && (
          <Card className="rounded-2xl border-slate-100 shadow-xl">
            <CardContent className="p-8 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Processando seu resgate...</h3>
              <p className="text-sm text-slate-500">Aguarde alguns instantes</p>
            </CardContent>
          </Card>
        )}

        {/* Success */}
        {step === "success" && (
          <Card className="rounded-2xl border-emerald-100 shadow-xl bg-emerald-50">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-emerald-900 mb-2">Resgate Solicitado! 🎉</h3>
              <p className="text-emerald-700 mb-4">
                Sua solicitação de R$ {parseFloat(requestAmount || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} está sendo processada.
              </p>
              <p className="text-sm text-emerald-600 mb-6">
                Você receberá o dinheiro via PIX em alguns minutos!
              </p>
              <Button
                className="bg-blue-600 hover:bg-blue-700 rounded-xl"
                onClick={() => {
                  setStep("balance");
                  setRequestAmount("");
                  setPixKey("");
                }}
              >
                Fazer Novo Resgate
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Info Footer */}
        <div className="bg-white/60 backdrop-blur rounded-2xl p-6 border border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">Disponível 24/7</p>
              <p className="text-xs text-slate-500">Qualquer dia, qualquer hora</p>
            </div>
            <div>
              <Zap className="w-6 h-6 text-amber-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">PIX Instantâneo</p>
              <p className="text-xs text-slate-500">Dinheiro em minutos</p>
            </div>
            <div>
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">100% Seguro</p>
              <p className="text-xs text-slate-500">Desconto automático</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}