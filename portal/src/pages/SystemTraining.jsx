import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Play, CheckCircle2, AlertCircle, Code } from "lucide-react";

export default function SystemTraining() {
  const [expandedSection, setExpandedSection] = useState(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-100 rounded-lg">
          <BookOpen className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Treinamento do Sistema</h1>
          <p className="text-sm text-slate-500 mt-1">Aprenda a utilizar todas as funcionalidades da plataforma</p>
        </div>
      </div>

      <Tabs defaultValue="formatting" className="space-y-4">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="formatting">Formatação Brasileira</TabsTrigger>
          <TabsTrigger value="proposals">Propostas</TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
        </TabsList>

        {/* TAB: Formatação Brasileira */}
        <TabsContent value="formatting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Formatação de Números - Padrão Brasileiro</CardTitle>
              <CardDescription>
                Entenda como o sistema formata e processa números segundo as convenções brasileiras
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Separadores */}
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Separadores
                </h3>
                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">Separador de Milhar:</span>
                    <code className="bg-white px-3 py-1 rounded border border-slate-200">.</code>
                    <span className="text-slate-500 text-sm">(ponto)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">Separador Decimal:</span>
                    <code className="bg-white px-3 py-1 rounded border border-slate-200">,</code>
                    <span className="text-slate-500 text-sm">(vírgula)</span>
                  </div>
                </div>
              </div>

              {/* Exemplos */}
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Play className="w-4 h-4 text-blue-600" />
                  Exemplos Práticos
                </h3>
                <div className="space-y-2">
                  <div className="border border-slate-200 rounded-lg p-3">
                    <p className="text-sm text-slate-600 font-mono">Valor: 1234.56</p>
                    <p className="text-sm text-slate-700 font-semibold">Exibe como: R$ 1.234,56</p>
                  </div>
                  <div className="border border-slate-200 rounded-lg p-3">
                    <p className="text-sm text-slate-600 font-mono">Taxa: 2.5%</p>
                    <p className="text-sm text-slate-700 font-semibold">Exibe como: 2,50%</p>
                  </div>
                  <div className="border border-slate-200 rounded-lg p-3">
                    <p className="text-sm text-slate-600 font-mono">Quantidade: 1000000</p>
                    <p className="text-sm text-slate-700 font-semibold">Exibe como: 1.000.000</p>
                  </div>
                </div>
              </div>

              {/* Importante */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
                <p className="flex items-start gap-2 text-sm text-amber-900">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <strong>Importante:</strong> A formatação é apenas para exibição visual. Os cálculos no backend
                  usam sempre a precisão completa do número, SEM arredondamento.
                </p>
              </div>

              {/* Entrada do Usuário */}
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Code className="w-4 h-4 text-purple-600" />
                  Entrada do Usuário
                </h3>
                <p className="text-sm text-slate-600">
                  Quando você digita em um campo de valor, o sistema aceita ambos os formatos:
                </p>
                <div className="space-y-2">
                  <div className="border border-slate-200 rounded-lg p-3">
                    <p className="text-sm text-slate-600">Você digita: <code className="bg-white px-2 py-0.5 rounded border border-slate-200">1.234,56</code></p>
                    <p className="text-sm text-slate-700">Sistema processa: <code className="bg-white px-2 py-0.5 rounded border border-slate-200">1234.56</code></p>
                  </div>
                  <div className="border border-slate-200 rounded-lg p-3">
                    <p className="text-sm text-slate-600">Você digita: <code className="bg-white px-2 py-0.5 rounded border border-slate-200">1234.56</code> (sem milhar)</p>
                    <p className="text-sm text-slate-700">Sistema processa: <code className="bg-white px-2 py-0.5 rounded border border-slate-200">1234.56</code></p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Propostas */}
        <TabsContent value="proposals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Propostas</CardTitle>
              <CardDescription>
                Aprenda a criar, editar e acompanhar propostas de crédito
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  Este módulo será preenchido com tutoriais detalhados sobre propostas, fluxo de aprovação,
                  integração com SCD e muito mais.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Financeiro */}
        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cálculos Financeiros</CardTitle>
              <CardDescription>
                Entenda CET, IOF, taxas e cálculos de juros
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  Documentação sobre cálculos financeiros, validação com SCD e parametrizações será adicionada em breve.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Integrações */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integrações do Sistema</CardTitle>
              <CardDescription>
                Configure e integre com SCD, margem e outros serviços
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  Guia completo de integrações com terceiros será adicionado em breve.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}