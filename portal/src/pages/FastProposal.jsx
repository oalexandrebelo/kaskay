import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Zap, CheckCircle2, Loader2, ArrowRight, AlertTriangle } from "lucide-react";
import FinancialCalculator from "../components/proposal/FinancialCalculator";
import AutoCPFVerification from "../components/fraud/AutoCPFVerification";
import BankValidation from "../components/fraud/BankValidation";

export default function FastProposal() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    client_cpf: "",
    client_name: "",
    client_phone: "",
    convenio_id: "",
    pix_key: "",
    available_margin: "",
    days_worked: "",
  });
  const [calculation, setCalculation] = useState(null);
  const [cpfVerification, setCpfVerification] = useState(null);
  const [bankValidation, setBankValidation] = useState(null);
  const [clientLearning, setClientLearning] = useState(null);
  const [isReturningClient, setIsReturningClient] = useState(false);

  const { data: convenios = [] } = useQuery({
    queryKey: ["convenio_configs_active"],
    queryFn: () => base44.entities.ConvenioConfig.filter({ is_active: true, accepts_new_contracts: true }),
  });

  // Buscar histórico do cliente quando CPF for informado
  useQuery({
    queryKey: ["client_learning", formData.client_cpf],
    queryFn: async () => {
      if (!formData.client_cpf || formData.client_cpf.length < 11) return null;
      
      const learning = await base44.entities.ClientLearning.filter({ client_cpf: formData.client_cpf });
      if (learning.length > 0) {
        setClientLearning(learning[0]);
        setIsReturningClient(true);
        
        // Preencher dados automaticamente para cliente recorrente
        setFormData(prev => ({
          ...prev,
          convenio_id: learning[0].preferred_convenio_id || prev.convenio_id,
          pix_key: learning[0].preferred_pix_key || prev.pix_key,
        }));
      }
      return learning;
    },
    enabled: formData.client_cpf.length >= 11,
  });

  const selectedConvenio = convenios.find(c => c.id === formData.convenio_id);

  const createProposalMutation = useMutation({
    mutationFn: async () => {
      // 1. Criar/atualizar cliente
      let client = await base44.entities.Client.filter({ cpf: formData.client_cpf });
      if (client.length === 0) {
        client = await base44.entities.Client.create({
          full_name: formData.client_name,
          cpf: formData.client_cpf,
          phone: formData.client_phone,
          available_margin: parseFloat(formData.available_margin),
          status: "active",
        });
      } else {
        client = client[0];
      }

      // 2. Verificar antifraude (score avançado com validações)
      const fraudScore = await calculateFraudScore(client.id, formData.pix_key, cpfVerification, bankValidation);

      // 3. Gerar número único de proposta
      const { data: proposalNumberData } = await base44.functions.invoke('generateProposalNumber', {});
      const proposalNumber = proposalNumberData.proposal_number;
      
      const proposal = await base44.entities.Proposal.create({
        client_id: client.id,
        client_name: formData.client_name,
        client_cpf: formData.client_cpf,
        proposal_number: proposalNumber,
        product_type: "adiantamento_salarial",
        requested_amount: calculation.net_payout,
        approved_amount: calculation.net_payout,
        installments: 1,
        installment_value: calculation.repayment_value,
        status: fraudScore.requires_manual_review ? "under_analysis" : "margin_approved",
        pix_key: formData.pix_key,
        channel: "web",
      });

      // 4. Criar parcela
      await base44.entities.Installment.create({
        proposal_id: proposal.id,
        client_id: client.id,
        client_name: formData.client_name,
        client_cpf: formData.client_cpf,
        installment_number: 1,
        due_date: calculation.repasse_date,
        expected_amount: calculation.repayment_value,
        status: "pending",
      });

      // 5. Atualizar aprendizagem do cliente
      const existingLearning = await base44.entities.ClientLearning.filter({ client_id: client.id });
      const pastProposals = await base44.entities.Proposal.filter({ client_id: client.id, status: "disbursed" });
      
      const learningData = {
        client_id: client.id,
        client_cpf: formData.client_cpf,
        client_name: formData.client_name,
        total_operations: (existingLearning[0]?.total_operations || 0) + 1,
        successful_operations: pastProposals.length,
        preferred_convenio_id: formData.convenio_id,
        preferred_pix_key: formData.pix_key,
        average_days_to_payroll: formData.days_worked ? parseInt(formData.days_worked) : (existingLearning[0]?.average_days_to_payroll || 15),
        last_operation_date: new Date().toISOString().split('T')[0],
        risk_score: fraudScore.score,
        auto_approve: fraudScore.score < 20 && pastProposals.length >= 3,
        last_updated: new Date().toISOString(),
      };

      if (existingLearning.length > 0) {
        await base44.entities.ClientLearning.update(existingLearning[0].id, learningData);
      } else {
        await base44.entities.ClientLearning.create(learningData);
      }

      // 6. Audit log
      await base44.entities.AuditLog.create({
        entity_type: "Proposal",
        entity_id: proposal.id,
        action: "status_change",
        from_value: "draft",
        to_value: proposal.status,
        details: `Proposta criada via Fast Proposal. Score fraude: ${fraudScore.score}. Cliente recorrente: ${isReturningClient}`,
      });

      return { proposal, fraudScore };
    },
    onSuccess: ({ proposal, fraudScore }) => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      
      if (fraudScore.requires_manual_review) {
        alert("Proposta criada! Requer revisão manual devido ao score de risco.");
      } else {
        alert("Proposta aprovada! Próximo passo: assinatura e desembolso.");
      }
      
      navigate(`/proposal/${proposal.id}`);
    },
  });

  const calculateFraudScore = async (clientId, pixKey, cpfVerif, bankValid) => {
    // Score avançado com validações de CPF e banco
    const pastOperations = await base44.entities.Proposal.filter({ client_id: clientId });
    const samePixDifferentCpf = await base44.entities.Proposal.filter({ pix_key: pixKey });
    
    let score = 0;
    const riskFactors = [];

    // Sem histórico de crédito em bureau = ALERTA MÁXIMO
    if (cpfVerif?.risk_flags?.some(f => f.includes("Sem histórico de crédito"))) {
      score += 60;
      riskFactors.push({ factor: "Sem histórico de crédito em bureau", severity: "critical", details: "Possível fraude - cliente nunca teve crédito" });
    }

    // Órgão não confirmado no Portal da Transparência
    if (cpfVerif?.risk_flags?.some(f => f.includes("não confirmado"))) {
      score += 40;
      riskFactors.push({ factor: "Órgão não confirmado", severity: "high", details: "Vínculo empregatício não validado" });
    }

    // Banco bloqueado ou titularidade não confirmada
    if (bankValid?.is_blacklisted) {
      score += 80;
      riskFactors.push({ factor: "Banco bloqueado", severity: "critical", details: "Banco sem KYC rigoroso" });
    }
    if (bankValid && !bankValid.titularity_confirmed) {
      score += 70;
      riskFactors.push({ factor: "Titularidade não confirmada", severity: "critical", details: "Conta não pertence ao CPF" });
    }

    // Primeira operação = menor risco (se passou nas validações acima)
    if (pastOperations.length === 0 && score < 40) {
      score += 5;
      riskFactors.push({ factor: "Primeiro adiantamento", severity: "low", details: "Cliente novo" });
    }

    // Múltiplas operações no mesmo mês
    const thisMonth = new Date().toISOString().slice(0, 7);
    const thisMonthOps = pastOperations.filter(p => p.created_date?.startsWith(thisMonth));
    if (thisMonthOps.length > 2) {
      score += 30;
      riskFactors.push({ factor: "Múltiplas operações", severity: "high", details: `${thisMonthOps.length} operações este mês` });
    }

    // Chave Pix usada por outro CPF
    if (samePixDifferentCpf.length > 0 && samePixDifferentCpf.some(p => p.client_cpf !== formData.client_cpf)) {
      score += 50;
      riskFactors.push({ factor: "Chave Pix compartilhada", severity: "critical", details: "Mesma chave em outro CPF" });
    }

    const riskLevel = score >= 70 ? "critical" : score >= 40 ? "high" : score >= 20 ? "medium" : "low";
    const requiresReview = score >= 40;

    const fraudScore = await base44.entities.FraudScore.create({
      client_id: clientId,
      client_cpf: formData.client_cpf,
      score,
      risk_level: riskLevel,
      risk_factors: riskFactors,
      pix_key: pixKey,
      pix_key_validated: bankValid?.is_valid || false,
      pix_key_matches_cpf: bankValid?.titularity_confirmed || false,
      operations_same_month: thisMonthOps.length,
      total_operations: pastOperations.length,
      same_pix_different_cpf: samePixDifferentCpf.length > 1,
      requires_manual_review: requiresReview,
    });

    return fraudScore;
  };

  const updateForm = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canProceedStep1 = formData.client_cpf && formData.client_name && formData.client_phone;
  const canProceedStep2 = formData.convenio_id && formData.available_margin && parseFloat(formData.available_margin) > 0;
  const canProceedStep3 = formData.pix_key && calculation && calculation.within_limits && bankValidation?.is_valid;

  const progress = (step / 3) * 100;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Contratação Rápida</h1>
            <p className="text-slate-500 text-sm">Jornada otimizada para desembolso em minutos</p>
          </div>
        </div>
        <Progress value={progress} className="h-2 mt-3" />
        <p className="text-xs text-slate-500 mt-1">Etapa {step} de 3</p>
      </div>

      {isReturningClient && clientLearning ? (
        <Alert className="border-blue-200 bg-blue-50">
          <CheckCircle2 className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900 text-sm">
            <strong>Cliente Recorrente Identificado!</strong> {clientLearning.total_operations} operações anteriores.
            {clientLearning.auto_approve && " ✓ Aprovação automática habilitada"}
            <br />
            <span className="text-blue-700">Jornada otimizada com seus dados salvos</span>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-emerald-200 bg-emerald-50">
          <Zap className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-900 text-sm">
            <strong>Desembolso Rápido:</strong> Aprovação automática com validação de risco em tempo real. PIX na conta em até 5 minutos.
          </AlertDescription>
        </Alert>
      )}

      {/* Step 1: Dados do Cliente */}
      {step === 1 && (
        <>
          <Card className="rounded-2xl border-slate-100">
            <CardHeader>
              <CardTitle className="text-base">1. Dados do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>CPF *</Label>
                <Input
                  value={formData.client_cpf}
                  onChange={(e) => updateForm("client_cpf", e.target.value)}
                  className="rounded-xl mt-1"
                  placeholder="000.000.000-00"
                />
              </div>
              <div>
                <Label>Nome Completo *</Label>
                <Input
                  value={formData.client_name}
                  onChange={(e) => updateForm("client_name", e.target.value)}
                  className="rounded-xl mt-1"
                />
              </div>
              <div>
                <Label>Telefone/WhatsApp *</Label>
                <Input
                  value={formData.client_phone}
                  onChange={(e) => updateForm("client_phone", e.target.value)}
                  className="rounded-xl mt-1"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
              >
                Próximo <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {formData.client_cpf.length >= 11 && (
            <AutoCPFVerification
              cpf={formData.client_cpf}
              onVerificationComplete={setCpfVerification}
            />
          )}
        </>
      )}

      {/* Step 2: Convênio e Margem */}
      {step === 2 && (
        <>
          <Card className="rounded-2xl border-slate-100">
            <CardHeader>
              <CardTitle className="text-base">2. Convênio e Margem Disponível</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Convênio *</Label>
                <Select value={formData.convenio_id} onValueChange={(v) => updateForm("convenio_id", v)}>
                  <SelectTrigger className="rounded-xl mt-1">
                    <SelectValue placeholder="Selecione o órgão" />
                  </SelectTrigger>
                  <SelectContent>
                    {convenios.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.convenio_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Margem Consignável Disponível (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.available_margin}
                  onChange={(e) => updateForm("available_margin", e.target.value)}
                  className="rounded-xl mt-1"
                  placeholder="Ex: 1500.00"
                />
                <p className="text-xs text-slate-500 mt-1">Consulte na gestora de margem ou holerite</p>
              </div>
              <div>
                <Label>Dias Trabalhados no Mês (Opcional)</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.days_worked}
                  onChange={(e) => updateForm("days_worked", e.target.value)}
                  className="rounded-xl mt-1"
                  placeholder="Ex: 15"
                />
                <p className="text-xs text-slate-500 mt-1">Valor liberado será proporcional aos dias trabalhados</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="rounded-xl" onClick={() => setStep(1)}>
                  Voltar
                </Button>
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                  onClick={() => setStep(3)}
                  disabled={!canProceedStep2}
                >
                  Próximo <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {selectedConvenio && formData.available_margin && (
            <FinancialCalculator
              convenio={selectedConvenio}
              availableMargin={parseFloat(formData.available_margin)}
              daysWorked={formData.days_worked ? parseInt(formData.days_worked) : null}
              onCalculationComplete={setCalculation}
            />
          )}
        </>
      )}

      {/* Step 3: PIX e Confirmação */}
      {step === 3 && (
        <>
          <BankValidation
            cpf={formData.client_cpf}
            onBankValidated={setBankValidation}
          />

          <Card className="rounded-2xl border-slate-100">
            <CardHeader>
              <CardTitle className="text-base">3. Chave PIX e Confirmação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Chave PIX *</Label>
                <Input
                  value={formData.pix_key}
                  onChange={(e) => updateForm("pix_key", e.target.value)}
                  className="rounded-xl mt-1"
                  placeholder="CPF, telefone, e-mail ou aleatória"
                />
                <p className="text-xs text-slate-500 mt-1">
                  ⚠️ A chave deve pertencer ao CPF {formData.client_cpf}
                </p>
              </div>

              {calculation && !calculation.within_limits && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-900 text-sm">
                    Valor calculado está fora dos limites. Ajuste o percentual na etapa anterior.
                  </AlertDescription>
                </Alert>
              )}

              {bankValidation && !bankValidation.is_valid && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-900 text-sm">
                    <strong>Validação bancária falhou:</strong> {bankValidation.is_blacklisted ? "Banco bloqueado por política de segurança" : "Titularidade não confirmada"}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button variant="outline" className="rounded-xl" onClick={() => setStep(2)}>
                  Voltar
                </Button>
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                  onClick={() => createProposalMutation.mutate()}
                  disabled={!canProceedStep3 || createProposalMutation.isPending}
                >
                  {createProposalMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Finalizar Proposta
                </Button>
              </div>
            </CardContent>
          </Card>

          {calculation && calculation.within_limits && (
            <FinancialCalculator
              convenio={selectedConvenio}
              availableMargin={parseFloat(formData.available_margin)}
              daysWorked={formData.days_worked ? parseInt(formData.days_worked) : null}
              onCalculationComplete={setCalculation}
            />
          )}
        </>
      )}
    </div>
  );
}