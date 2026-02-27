import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sliders, Settings, DollarSign, Zap, AlertCircle, Check, X, Edit2, ChevronRight, Info, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SystemParameters() {
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingIOF, setEditingIOF] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Mock data - substituir por dados reais da API
  const mockProducts = [
    {
      id: 1,
      name: "Adiantamento Salarial",
      minAmount: 500,
      maxAmount: 5000,
      minInstallments: 1,
      maxInstallments: 12,
      baseRate: 2.5,
      status: "active",
    },
    {
      id: 2,
      name: "Empréstimo Consignado",
      minAmount: 1000,
      maxAmount: 50000,
      minInstallments: 6,
      maxInstallments: 84,
      baseRate: 1.8,
      status: "active",
    },
  ];

  const mockIOFConfig = {
    annualRate: 0.38,
    uniqueFee: 0.5,
    isFinanced: true,
    calculationBase: "financed_amount",
    appliedTo: ["adiantamento_salarial", "emprestimo_consignado"],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 rounded-lg">
            <Sliders className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Parametrizações do Sistema</h1>
            <p className="text-sm text-slate-500 mt-1">Configure produtos, taxas, IOF, CET e outras parametrizações</p>
          </div>
        </div>
      </div>

      {/* Status Indicator */}
      <Alert className="bg-green-50 border-green-200">
        <Check className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Sistema operacional:</strong> Todas as parametrizações estão sincronizadas
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="iof_cet">IOF & CET</TabsTrigger>
          <TabsTrigger value="pricing">Precificação</TabsTrigger>
          <TabsTrigger value="rules">Regras</TabsTrigger>
        </TabsList>

        {/* TAB: Produtos */}
        <TabsContent value="products" className="space-y-4">
          {/* Info Card */}
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              Configure os parâmetros de cada produto: valores, parcelas, taxas base e margens aceitas
            </AlertDescription>
          </Alert>

          {/* Products Grid */}
          <div className="grid gap-4">
            {mockProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <Badge variant={product.status === "active" ? "default" : "secondary"}>
                          {product.status === "active" ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <CardDescription>ID: PROD-{product.id}</CardDescription>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Edit2 className="w-4 h-4" />
                          Editar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Editar {product.name}</DialogTitle>
                          <DialogDescription>
                            Atualize os parâmetros deste produto
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="min-amount" className="text-xs">Valor Mínimo</Label>
                              <Input id="min-amount" type="number" defaultValue={product.minAmount} placeholder="R$" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="max-amount" className="text-xs">Valor Máximo</Label>
                              <Input id="max-amount" type="number" defaultValue={product.maxAmount} placeholder="R$" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="min-inst" className="text-xs">Parcelas Mín</Label>
                              <Input id="min-inst" type="number" defaultValue={product.minInstallments} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="max-inst" className="text-xs">Parcelas Máx</Label>
                              <Input id="max-inst" type="number" defaultValue={product.maxInstallments} />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="rate" className="text-xs">Taxa Base Mensal (%)</Label>
                            <Input id="rate" type="number" defaultValue={product.baseRate} step="0.01" />
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline">Cancelar</Button>
                          <Button onClick={() => setSaveSuccess(true)}>Salvar</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-slate-50 rounded p-3">
                      <p className="text-slate-500 text-xs font-medium mb-1">VALORES</p>
                      <p className="font-semibold text-slate-900">R$ {product.minAmount.toLocaleString()} - R$ {product.maxAmount.toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-50 rounded p-3">
                      <p className="text-slate-500 text-xs font-medium mb-1">PARCELAS</p>
                      <p className="font-semibold text-slate-900">{product.minInstallments} a {product.maxInstallments}x</p>
                    </div>
                    <div className="bg-slate-50 rounded p-3 col-span-2">
                      <p className="text-slate-500 text-xs font-medium mb-1">TAXA BASE MENSAL</p>
                      <p className="font-semibold text-slate-900">{product.baseRate.toFixed(2)}% a.m.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Add Product Button */}
          <Button className="w-full gap-2" variant="outline">
            <ArrowUpRight className="w-4 h-4" />
            Adicionar Novo Produto
          </Button>
        </TabsContent>

        {/* TAB: IOF & CET */}
        <TabsContent value="iof_cet" className="space-y-4">
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 h-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              Parametrizações críticas para cálculos de propostas. Qualquer mudança aqui afeta todas as novas propostas.
            </AlertDescription>
          </Alert>

          {/* CRITICAL WARNING */}
          <Alert className="border-red-300 bg-red-50">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-900 font-medium">
              <strong>⚠️ VALIDAÇÃO CRÍTICA COM SCD:</strong> Toda proposta enviada para SCD deve ter seus cálculos validados no backend contra a resposta da SCD. Divergências causam impacto em receita, notas fiscais e conciliação.
            </AlertDescription>
          </Alert>

          {/* IOF Configuration */}
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  IOF - Imposto sobre Operações Financeiras
                </CardTitle>
                <CardDescription>⚠️ Varia por SCD - Configuração padrão do sistema</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Edit2 className="w-4 h-4" />
                    Editar
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Editar Configuração IOF</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="iof-annual" className="text-xs">Taxa Anual (%)</Label>
                        <Input id="iof-annual" type="number" defaultValue={mockIOFConfig.annualRate} step="0.01" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="iof-fee" className="text-xs">Taxa Única Contratação (%)</Label>
                        <Input id="iof-fee" type="number" defaultValue={mockIOFConfig.uniqueFee} step="0.01" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Base de Cálculo</Label>
                      <select className="w-full border border-slate-200 rounded p-2 text-sm">
                        <option value="financed_amount">Sobre valor financiado (padrão)</option>
                        <option value="released_amount">Sobre valor liberado</option>
                        <option value="both">Sobre ambos</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Financiamento</Label>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="finance-iof" defaultChecked={mockIOFConfig.isFinanced} />
                        <label htmlFor="finance-iof" className="text-sm cursor-pointer">IOF é financiado (entra na proposta)</label>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline">Cancelar</Button>
                    <Button onClick={() => setSaveSuccess(true)}>Salvar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded p-3">
                  <p className="text-slate-500 text-xs font-medium mb-1">TAXA ANUAL</p>
                  <p className="font-semibold text-slate-900">{mockIOFConfig.annualRate}% a.a.</p>
                </div>
                <div className="bg-slate-50 rounded p-3">
                  <p className="text-slate-500 text-xs font-medium mb-1">TAXA ÚNICA</p>
                  <p className="font-semibold text-slate-900">{mockIOFConfig.uniqueFee}%</p>
                </div>
                <div className="bg-slate-50 rounded p-3">
                  <p className="text-slate-500 text-xs font-medium mb-1">STATUS</p>
                  <Badge variant="default" className="gap-1">
                    <Check className="w-3 h-3" />
                    Ativo
                  </Badge>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <p className="text-sm font-semibold text-slate-900">Aplicável a:</p>
                <div className="flex flex-wrap gap-2">
                  {mockIOFConfig.appliedTo.map((product) => (
                    <Badge key={product} variant="secondary" className="text-xs">
                      {product.replace("_", " ")}
                    </Badge>
                  ))}
                </div>
              </div>

              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-900 text-sm">
                  Base de cálculo: <strong>Valor financiado</strong> | Financiado: <strong>Sim</strong>
                </AlertDescription>
              </Alert>

              {/* Critical IOF Notes */}
              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-semibold text-slate-900">Questões Críticas:</p>
                
                <div className="bg-slate-50 rounded p-3 space-y-2 border-l-4 border-red-500">
                  <p className="text-xs font-semibold text-slate-900">1. Varia por SCD</p>
                  <p className="text-xs text-slate-700">
                    Algumas SCDs incidem sobre <strong>valor financiado</strong>, outras sobre <strong>valor liberado</strong>. Validar com cada SCD antes de parametrizar.
                  </p>
                </div>

                <div className="bg-slate-50 rounded p-3 space-y-2 border-l-4 border-red-500">
                  <p className="text-xs font-semibold text-slate-900">2. IOF Financiado = Menos Dinheiro para o Cliente</p>
                  <p className="text-xs text-slate-700">
                    Se cliente pede R$ 1.000 e IOF é financiado (7% exemplo), ele recebe: R$ 1.000 - R$ 70 = <strong>R$ 930</strong> na conta.
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Impacto: cliente vê valor diferente e pode gerar reclamações.</p>
                </div>

                <div className="bg-slate-50 rounded p-3 space-y-2 border-l-4 border-red-500">
                  <p className="text-xs font-semibold text-slate-900">3. Validação com SCD é Obrigatória</p>
                  <p className="text-xs text-slate-700">
                    Quando proposta é enviada para SCD, backend <strong>DEVE validar</strong> cálculos retornados. Divergências causam:
                  </p>
                  <ul className="text-xs text-slate-700 mt-1 ml-3 space-y-0.5">
                    <li>❌ Perda de receita</li>
                    <li>❌ Divergência em notas fiscais</li>
                    <li>❌ Impacto em conciliação financeira</li>
                    <li>❌ Gestão complexa de discrepâncias</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CET Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                CET - Custo Efetivo Total
              </CardTitle>
              <CardDescription>Calculado automaticamente • Validado contra SCD</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900">CET é calculado automaticamente</p>
                    <p className="text-sm text-green-800 mt-1">
                      O sistema agrega todos os custos para gerar a taxa final mensal/anual.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold text-slate-900">Fórmula do CET:</p>
                <div className="bg-white rounded p-3 font-mono text-xs text-slate-700 border border-slate-200">
                  <p>CET = Taxa de Juros + IOF (anualizado) + TAC + TC (se houver)</p>
                </div>
                <p className="text-xs text-slate-500 mt-2">TAC = Taxa Administrativa de Crédito | TC = Taxa de Cadastro</p>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold text-slate-900">Componentes incluídos:</p>
                <ul className="text-sm text-slate-700 space-y-1">
                  <li className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-blue-600" />
                    Taxa de juros mensal (principal)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-blue-600" />
                    IOF (anualizado e convertido para taxa mensal)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-blue-600" />
                    TAC - Taxa Administrativa de Crédito
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-blue-600" />
                    TC - Taxa de Cadastro (quando aplicável)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-blue-600" />
                    Seguros (quando contratados)
                  </li>
                </ul>
              </div>

              {/* Critical CET Notes */}
              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-semibold text-slate-900">⚠️ Validação com SCD:</p>
                
                <div className="bg-red-50 rounded p-3 border-l-4 border-red-500 space-y-2">
                  <p className="text-xs font-semibold text-red-900">Obrigatório após submissão para SCD</p>
                  <p className="text-xs text-red-800">
                    Backend DEVE comparar CET calculado com CET retornado pela SCD. Se divergir, proposta não deve ser liberada até resolução.
                  </p>
                  <p className="text-xs text-red-700 font-semibold mt-2">Motivos: Evitar divergências que impactam receita, notas fiscais e conciliação.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Precificação */}
        <TabsContent value="pricing" className="space-y-4">
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              Configure spreads, taxas diferenciais e regras de preço por produto e convênio
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Regras de Precificação
              </CardTitle>
              <CardDescription>
                Gerenciamento de spreads e taxas diferenciais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-slate-500">
                <p className="mb-2">Nenhuma regra de precificação configurada</p>
                <Button className="gap-2" variant="outline">
                  <ArrowUpRight className="w-4 h-4" />
                  Criar Regra de Preço
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Regras */}
        <TabsContent value="rules" className="space-y-4">
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              Regras de elegibilidade, verificação e validações automáticas de propostas
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Regras de Elegibilidade
              </CardTitle>
              <CardDescription>
                Defina limites, restrições e validações para propostas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-slate-500">
                <p className="mb-2">Nenhuma regra de elegibilidade configurada</p>
                <Button className="gap-2" variant="outline">
                  <ArrowUpRight className="w-4 h-4" />
                  Criar Regra
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}