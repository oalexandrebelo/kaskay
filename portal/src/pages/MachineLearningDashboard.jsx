import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, AlertTriangle, CheckCircle2, Target, Brain, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function MachineLearningDashboard() {
  const [timeRange, setTimeRange] = useState("30");

  // Buscar aprendizados (previsões vs outcomes reais)
  const { data: learnings = [] } = useQuery({
    queryKey: ["client_learning"],
    queryFn: () => base44.entities.ClientLearning.list(),
  });

  // Buscar testes A/B
  const { data: abTests = [] } = useQuery({
    queryKey: ["ab_tests"],
    queryFn: () => base44.entities.OrchestrationLog.filter({ orchestration_id: { $regex: "ab_test_" } }),
  });

  // Buscar alertas
  const { data: alerts = [] } = useQuery({
    queryKey: ["anomaly_alerts"],
    queryFn: () => base44.entities.AuditLog.filter({ action: "anomaly_detected" }),
  });

  // Buscar propostas para contexto
  const { data: proposals = [] } = useQuery({
    queryKey: ["proposals_context"],
    queryFn: () => base44.entities.Proposal.list(),
  });

  // MÉTRICAS DE ACURÁCIA
  const totalPredictions = learnings.length;
  const correctPredictions = learnings.filter(l => l.model_accuracy === 1).length;
  const overallAccuracy = totalPredictions > 0 ? ((correctPredictions / totalPredictions) * 100).toFixed(1) : 0;

  // Acurácia por range de score
  const highScoreAccuracy = learnings
    .filter(l => l.predicted_score >= 70)
    .filter(l => l.model_accuracy === 1).length / (learnings.filter(l => l.predicted_score >= 70).length || 1) * 100;

  const mediumScoreAccuracy = learnings
    .filter(l => l.predicted_score >= 50 && l.predicted_score < 70)
    .filter(l => l.model_accuracy === 1).length / (learnings.filter(l => l.predicted_score >= 50 && l.predicted_score < 70).length || 1) * 100;

  const lowScoreAccuracy = learnings
    .filter(l => l.predicted_score < 50)
    .filter(l => l.model_accuracy === 1).length / (learnings.filter(l => l.predicted_score < 50).length || 1) * 100;

  // EVOLUÇÃO TEMPORAL
  const accuracyByDate = learnings.reduce((acc, l) => {
    const date = new Date(l.created_date).toLocaleDateString('pt-BR');
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.predictions += 1;
      if (l.model_accuracy === 1) existing.correct += 1;
      existing.accuracy = ((existing.correct / existing.predictions) * 100).toFixed(1);
    } else {
      acc.push({
        date,
        predictions: 1,
        correct: l.model_accuracy === 1 ? 1 : 0,
        accuracy: l.model_accuracy === 1 ? 100 : 0
      });
    }
    return acc;
  }, []).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-30);

  // A/B TESTING
  const abTestComparison = abTests.map(test => ({
    date: new Date(test.created_date).toLocaleDateString('pt-BR'),
    modelA: test.log_details?.model_a_score || 0,
    modelB: test.log_details?.model_b_score || 0,
    difference: test.log_details?.difference || 0,
  })).slice(-20);

  // DISTRIBUIÇÃO DE RESULTADOS PREDITOS
  const resultsDistribution = [
    { name: 'Aprovado', value: learnings.filter(l => l.predicted_result === 'approved').length, color: '#22c55e' },
    { name: 'Revisão Manual', value: learnings.filter(l => l.predicted_result === 'manual_review').length, color: '#f59e0b' },
    { name: 'Rejeitado', value: learnings.filter(l => l.predicted_result === 'rejected').length, color: '#ef4444' },
  ];

  // RECOMENDAÇÕES AUTOMÁTICAS
  const recommendations = [];
  if (overallAccuracy < 70) recommendations.push({ level: 'high', text: 'Acurácia abaixo de 70% - modelo precisa ser ajustado' });
  if (highScoreAccuracy > 85) recommendations.push({ level: 'info', text: 'Score alto com alta acurácia - confiar mais neste range' });
  if (alerts.length > 5) recommendations.push({ level: 'warning', text: `${alerts.length} anomalias detectadas na última semana` });
  if (abTests.length > 0) {
    const latestAB = abTests[abTests.length - 1];
    if (latestAB.log_details?.model_b_result !== latestAB.log_details?.model_a_result) {
      recommendations.push({ level: 'info', text: 'Modelos A/B divergindo - revisar impacto no negócio' });
    }
  }

  const getAlertLevel = (level) => {
    const colors = { high: 'bg-red-50 border-red-200', warning: 'bg-yellow-50 border-yellow-200', info: 'bg-blue-50 border-blue-200' };
    return colors[level] || colors.info;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Machine Learning Analytics</h1>
        <p className="text-slate-600 mt-2">Acompanhe a evolução do modelo de score e detecção automática de anomalias</p>
      </div>

      {/* CARDS DE RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Acurácia Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{overallAccuracy}%</div>
            <p className="text-xs text-slate-600 mt-1">{totalPredictions} previsões analisadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Score Alto (70+)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{highScoreAccuracy.toFixed(1)}%</div>
            <p className="text-xs text-slate-600 mt-1">Taxa acertos neste range</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Testes A/B</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{abTests.length}</div>
            <p className="text-xs text-slate-600 mt-1">Modelos comparados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Alertas/7d</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{alerts.slice(-7).length}</div>
            <p className="text-xs text-slate-600 mt-1">Anomalias detectadas</p>
          </CardContent>
        </Card>
      </div>

      {/* RECOMENDAÇÕES */}
      {recommendations.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-slate-900">Recomendações Automáticas</h3>
          {recommendations.map((rec, i) => (
            <Alert key={i} className={`${getAlertLevel(rec.level)} border`}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{rec.text}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* TABS */}
      <Tabs defaultValue="accuracy" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="accuracy">Acurácia</TabsTrigger>
          <TabsTrigger value="ab_testing">A/B Testing</TabsTrigger>
          <TabsTrigger value="distribution">Distribuição</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>

        {/* ACURÁCIA */}
        <TabsContent value="accuracy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evolução de Acurácia (últimos 30 dias)</CardTitle>
              <CardDescription>Taxa de acertos do modelo ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={accuracyByDate}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Line type="monotone" dataKey="accuracy" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{"Score Médio (50-69)"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mediumScoreAccuracy.toFixed(1)}%</div>
                <p className="text-xs text-slate-600">Propostas em revisão manual</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{"Score Baixo (<50)"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{lowScoreAccuracy.toFixed(1)}%</div>
                <p className="text-xs text-slate-600">Propostas rejeitadas corretamente</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Tempo Médio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {learnings.length > 0 ? (learnings.reduce((sum, l) => sum + (l.days_to_outcome || 0), 0) / learnings.length).toFixed(1) : 0} dias
                </div>
                <p className="text-xs text-slate-600">até outcome real</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* A/B TESTING */}
        <TabsContent value="ab_testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comparação Modelo A vs B</CardTitle>
              <CardDescription>Scores obtidos em cada teste</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={abTestComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="modelA" fill="#3b82f6" name="Modelo A (Atual)" />
                  <Bar dataKey="modelB" fill="#8b5cf6" name="Modelo B (Novo)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Status dos Testes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {abTests.length > 0 ? (
                <>
                  <p className="text-sm text-slate-600">Total de testes: <strong>{abTests.length}</strong></p>
                  {abTests.slice(-3).map((test, i) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                      <span className="text-sm">{new Date(test.created_date).toLocaleDateString('pt-BR')}</span>
                      <Badge variant={test.log_details?.model_b_score > test.log_details?.model_a_score ? 'default' : 'outline'}>
                        Modelo {test.log_details?.model_b_score > test.log_details?.model_a_score ? 'B' : 'A'} melhor
                      </Badge>
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-sm text-slate-500">Nenhum teste realizado ainda</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DISTRIBUIÇÃO */}
        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Resultados Preditos</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={resultsDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {resultsDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ALERTAS */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertas de Anomalia</CardTitle>
              <CardDescription>Últimas detecções automáticas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts.length > 0 ? (
                alerts.slice(-10).reverse().map((alert, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-900">{alert.details}</p>
                      <p className="text-xs text-red-700 mt-1">{new Date(alert.created_date).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 py-8 text-center">Nenhuma anomalia detectada</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* INFORMAÇÕES ÚTEIS */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Como o Sistema Melhora Automaticamente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-700">
          <p>✅ <strong>Coleta</strong>: Toda proposta registra seu score predito</p>
          <p>✅ <strong>Resultado</strong>: Quando a proposta é paga/inadimplente, o resultado real é registrado</p>
          <p>✅ <strong>Comparação</strong>: Sistema compara previsão vs resultado (acurácia)</p>
          <p>✅ <strong>A/B Testing</strong>: Novos modelos são testados em paralelo (modelo B vs A)</p>
          <p>✅ <strong>Alertas</strong>: Anomalias (taxa aprovação caindo, inadimplência subindo) geram alertas automáticos</p>
          <p>✅ <strong>Ajustes</strong>: Com base nos dados, pesos e regras são ajustados para a próxima rodada</p>
        </CardContent>
      </Card>
    </div>
  );
}