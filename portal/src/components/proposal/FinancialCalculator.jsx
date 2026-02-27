import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingUp, DollarSign, Calendar, AlertTriangle, CheckCircle2 } from "lucide-react";
import { differenceInDays } from "date-fns";

/**
 * Motor de Cálculo Financeiro
 * Baseado no RFP:
 * V1 = M * haircut * p (valor a receber no repasse)
 * V0 = V1 - fee_fixed (valor liberado ao cliente)
 * yield_days = repasse_date - payout_date
 * yield_monthly = (V1/V0)^(30/yield_days) - 1
 */
export default function FinancialCalculator({ 
  convenio, 
  availableMargin, 
  daysWorked,
  onCalculationComplete 
}) {
  const [requestedPercentage, setRequestedPercentage] = useState("100");
  const [calculation, setCalculation] = useState(null);

  useEffect(() => {
    if (!convenio || !availableMargin) return;

    const percentage = parseFloat(requestedPercentage) / 100;
    if (isNaN(percentage) || percentage <= 0) return;

    // M = margem disponível
    const M = availableMargin * percentage;

    // Parâmetros do convênio
    const haircut = convenio.haircut_default || 0.95;
    const p = (convenio.salary_advance_percentage || 25) / 100;
    const liquidUsagePercentage = (convenio.liquid_salary_usage_percentage || 15) / 100;

    // TARIFA FIXA por transação
    const FIXED_FEE = 29.90;

    // V1_base = valor bruto máximo disponível
    const V1_base = M * haircut * p;

    // Ajustar por dias trabalhados (se informado)
    const daysInMonth = 30;
    const effectiveDays = daysWorked && daysWorked > 0 ? Math.min(daysWorked, 31) : daysInMonth;
    const daysFactor = effectiveDays / daysInMonth;

    // Valor máximo que pode ser solicitado (proporcional aos dias)
    const maxAvailable = V1_base * daysFactor;

    // V0 = valor solicitado/liberado ao cliente (baseado no percentual do slider)
    // Mas respeitando o máximo disponível
    const V0 = Math.min(M * percentage, maxAvailable);

    // V1 = V0 + tarifa fixa
    const V1 = V0 + FIXED_FEE;

    // Fee fixo de R$ 29,90
    const fee_fixed = FIXED_FEE;

    // Verificar limites
    const min_payout = 300;
    const max_payout = 600;
    
    const withinLimits = V0 >= min_payout && V0 <= max_payout;

    // Calcular yield
    const today = new Date();
    const repasse_date = new Date();
    repasse_date.setDate(convenio.payment_day || 20);
    if (repasse_date < today) {
      repasse_date.setMonth(repasse_date.getMonth() + 1);
    }

    const yield_days = differenceInDays(repasse_date, today);
    const yield_monthly = yield_days > 0 && V0 > 0 
      ? (Math.pow(V1 / V0, 30 / yield_days) - 1) * 100 
      : 0;

    const calc = {
      margin_available: availableMargin,
      margin_used: M,
      percentage_requested: percentage * 100,
      haircut,
      salary_advance_percentage: p * 100,
      liquid_usage_percentage: liquidUsagePercentage * 100,
      days_worked: effectiveDays,
      days_factor: daysFactor,
      gross_value: V1,
      fee_fixed,
      fixed_fee: FIXED_FEE,
      net_payout: V0,
      repayment_value: V1,
      min_payout,
      max_payout,
      within_limits: withinLimits,
      yield_days,
      yield_monthly: V0 > 0 ? (FIXED_FEE / V0) * 100 : 0, // % efetiva sobre o valor solicitado
      repasse_date: repasse_date.toISOString().split('T')[0],
    };

    setCalculation(calc);
    
    if (onCalculationComplete && withinLimits) {
      onCalculationComplete(calc);
    }
  }, [convenio, availableMargin, requestedPercentage, onCalculationComplete]);

  if (!convenio) {
    return (
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-900 text-sm">
          Selecione um convênio para calcular o valor liberado.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="rounded-2xl border-blue-100 bg-gradient-to-br from-blue-50 to-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="w-4 h-4 text-blue-600" /> Simulação Financeira
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Percentual da Margem Disponível</Label>
          <div className="flex items-center gap-2 mt-1">
            <Input
              type="number"
              min="1"
              max="100"
              step="1"
              value={requestedPercentage}
              onChange={(e) => setRequestedPercentage(e.target.value)}
              className="rounded-xl"
            />
            <span className="text-sm text-slate-600 whitespace-nowrap">%</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Margem disponível: R$ {(availableMargin || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>

        {calculation && (
          <>
            {!calculation.within_limits && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-900 text-sm">
                  Valor fora dos limites: mín R$ {calculation.min_payout.toFixed(2)} - máx R$ {calculation.max_payout.toFixed(2)}
                </AlertDescription>
              </Alert>
            )}

            {calculation.within_limits && (
              <Alert className="border-emerald-200 bg-emerald-50">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-emerald-900 text-sm">
                  Operação dentro dos limites parametrizados
                </AlertDescription>
              </Alert>
            )}

            <div className="bg-white rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-600">Valor Liberado (V0)</span>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span className="text-2xl font-bold text-emerald-700">
                    R$ {calculation.net_payout.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Margem Utilizada:</span>
                  <span className="font-medium">R$ {calculation.margin_used.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Haircut ({(calculation.haircut * 100).toFixed(0)}%):</span>
                  <span className="font-medium">R$ {(calculation.margin_used * calculation.haircut).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">% Adiantamento ({calculation.salary_advance_percentage.toFixed(0)}%):</span>
                  <span className="font-medium">R$ {calculation.gross_value.toFixed(2)}</span>
                </div>
                {calculation.days_worked && calculation.days_worked < 30 && (
                  <div className="flex justify-between text-blue-700 bg-blue-50 -mx-4 px-4 py-2">
                    <span className="font-medium">Dias Trabalhados:</span>
                    <span className="font-medium">{calculation.days_worked} dias ({(calculation.days_factor * 100).toFixed(0)}%)</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2">
                  <span className="text-slate-500">Tarifa por Transação:</span>
                  <span className="font-medium text-red-600">- R$ {calculation.fee_fixed.toFixed(2)}</span>
                </div>
                <div className="flex justify-between bg-purple-50 -mx-4 px-4 py-2 rounded">
                  <span className="text-purple-700 font-medium">Tarifa de Serviço:</span>
                  <span className="font-bold text-purple-900">R$ 29,90 fixo</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-violet-50 rounded-lg p-3 border border-violet-200">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-3 h-3 text-violet-600" />
                  <span className="text-xs font-medium text-violet-700">Tarifa Fixa</span>
                </div>
                <p className="text-lg font-bold text-violet-900">
                  R$ 29,90
                </p>
                <p className="text-xs text-violet-600">≈ {calculation.yield_monthly.toFixed(1)}% do valor</p>
              </div>

              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-3 h-3 text-blue-600" />
                  <span className="text-xs font-medium text-blue-700">Repasse</span>
                </div>
                <p className="text-sm font-bold text-blue-900">
                  {calculation.yield_days} dias
                </p>
                <p className="text-xs text-blue-700">
                  {new Date(calculation.repasse_date).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-orange-700">Valor no Repasse (V1)</span>
                <span className="text-lg font-bold text-orange-900">
                  R$ {calculation.repayment_value.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-orange-600 mt-1">
                Descontado da folha no dia {convenio.payment_day || 20}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}