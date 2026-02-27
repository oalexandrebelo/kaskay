import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Calculator, DollarSign, TrendingUp, AlertCircle, Calendar } from "lucide-react";

export default function CreditSimulator() {
  const [convenioId, setConvenioId] = useState("");
  const [requestedAmount, setRequestedAmount] = useState("");
  const [installments, setInstallments] = useState("12");
  const [simulation, setSimulation] = useState(null);

  const { data: convenios = [], isLoading: conveniosLoading } = useQuery({
    queryKey: ["convenio_configs"],
    queryFn: () => base44.entities.ConvenioConfig.list(),
  });

  const { data: productConfigs = [], isLoading: productsLoading } = useQuery({
    queryKey: ["product_configs"],
    queryFn: () => base44.entities.ProductConfig.list(),
  });

  const { data: pricingRules = [], isLoading: pricingLoading } = useQuery({
    queryKey: ["pricing_rules"],
    queryFn: () => base44.entities.PricingRule.list(),
  });

  const selectedConvenio = convenios.find(c => c.id === convenioId);

  const handleSimulate = () => {
    if (!convenioId || !requestedAmount) return;

    const amount = parseFloat(requestedAmount);
    const term = parseInt(installments);

    // Buscar regra de pricing aplicável
    const applicableRule = pricingRules.find(rule => 
      (rule.convenio_id === convenioId || !rule.convenio_id) &&
      rule.is_active
    );

    let monthlyRate = applicableRule?.base_rate || 2.5; // Default 2.5% a.m.

    // Aplicar faixas de valor se existir
    if (applicableRule?.amount_ranges) {
      const range = applicableRule.amount_ranges.find(r => 
        amount >= r.min_amount && (!r.max_amount || amount <= r.max_amount)
      );
      if (range) {
        monthlyRate = range.rate;
      }
    }

    // Calcular parcela (Price)
    const i = monthlyRate / 100;
    const installmentValue = amount * (i * Math.pow(1 + i, term)) / (Math.pow(1 + i, term) - 1);
    const totalAmount = installmentValue * term;
    const totalInterest = totalAmount - amount;
    const annualRate = Math.pow(1 + i, 12) - 1;
    const cet = annualRate * 100;

    // Taxas adicionais
    const originationFee = (applicableRule?.fees?.origination_fee_percent || 0) * amount / 100;
    const insuranceFee = (applicableRule?.fees?.insurance_fee_percent || 0) * amount / 100;
    const totalFees = originationFee + insuranceFee;

    const netAmount = amount - totalFees;

    setSimulation({
      requestedAmount: amount,
      netAmount,
      installments: term,
      installmentValue,
      monthlyRate,
      annualRate: annualRate * 100,
      cet,
      totalAmount,
      totalInterest,
      fees: {
        origination: originationFee,
        insurance: insuranceFee,
        total: totalFees,
      },
    });
  };

  if (conveniosLoading || productsLoading || pricingLoading) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Simulador de Crédito</h1>
        <p className="text-slate-500 text-sm mt-1">
          Simule condições de crédito por convênio para atendimento ao cliente
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-600" />
              Dados da Simulação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Convênio</Label>
              <Select value={convenioId} onValueChange={setConvenioId}>
                <SelectTrigger className="rounded-xl mt-1">
                  <SelectValue placeholder="Selecione o convênio..." />
                </SelectTrigger>
                <SelectContent>
                  {convenios.map(conv => (
                    <SelectItem key={conv.id} value={conv.id}>
                      {conv.convenio_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Valor Solicitado</Label>
              <div className="relative mt-1">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="number"
                  value={requestedAmount}
                  onChange={(e) => setRequestedAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-10 rounded-xl"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <Label>Número de Parcelas</Label>
              <Select value={installments} onValueChange={setInstallments}>
                <SelectTrigger className="rounded-xl mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 3, 6, 12, 18, 24, 36, 48, 60, 72, 84, 96].map(n => (
                    <SelectItem key={n} value={n.toString()}>
                      {n}x
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedConvenio && (
              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription className="text-xs text-blue-900">
                  <strong>Margem Disponível:</strong> R$ {(selectedConvenio.average_margin || 0).toLocaleString('pt-BR')}
                  <br />
                  <strong>Taxa Base:</strong> {selectedConvenio.base_interest_rate || 2.5}% a.m.
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleSimulate}
              disabled={!convenioId || !requestedAmount}
              className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl"
            >
              <Calculator className="w-4 h-4 mr-2" />
              Simular
            </Button>
          </CardContent>
        </Card>

        {/* Resultado */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Resultado da Simulação
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!simulation ? (
              <div className="text-center py-12">
                <Calculator className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Preencha os dados e clique em Simular</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Valor Líquido */}
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                  <p className="text-xs text-emerald-700 mb-1">Valor Líquido (Cliente Recebe)</p>
                  <p className="text-3xl font-bold text-emerald-900">
                    R$ {simulation.netAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Parcelas */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-xs text-blue-700 mb-1">Valor da Parcela</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {simulation.installments}x de R$ {simulation.installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Taxas */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-600">Taxa Mensal</p>
                    <p className="text-lg font-bold text-slate-900">{simulation.monthlyRate.toFixed(2)}%</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-600">Taxa Anual</p>
                    <p className="text-lg font-bold text-slate-900">{simulation.annualRate.toFixed(2)}%</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-600">CET</p>
                    <p className="text-lg font-bold text-slate-900">{simulation.cet.toFixed(2)}%</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-600">Total Juros</p>
                    <p className="text-lg font-bold text-slate-900">
                      R$ {(simulation.totalInterest / 1000).toFixed(1)}k
                    </p>
                  </div>
                </div>

                {/* Taxas Adicionais */}
                {simulation.fees.total > 0 && (
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <AlertDescription className="text-xs text-amber-900">
                      <strong>Taxas Descontadas:</strong>
                      <br />
                      Originação: R$ {simulation.fees.origination.toFixed(2)}
                      {simulation.fees.insurance > 0 && (
                        <> | Seguro: R$ {simulation.fees.insurance.toFixed(2)}</>
                      )}
                      <br />
                      <strong>Total Descontado: R$ {simulation.fees.total.toFixed(2)}</strong>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Total a Pagar */}
                <div className="bg-slate-100 rounded-xl p-4 border border-slate-300">
                  <p className="text-xs text-slate-600 mb-1">Total a Pagar</p>
                  <p className="text-xl font-bold text-slate-900">
                    R$ {simulation.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}