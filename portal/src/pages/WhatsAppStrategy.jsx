import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  Clock,
  TrendingDown,
  Zap,
  Users,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Timer,
  Pause,
  Play,
} from "lucide-react";

export default function WhatsAppStrategy() {
  const { data: sessions = [] } = useQuery({
    queryKey: ["whatsapp_sessions"],
    queryFn: () => base44.entities.WhatsAppSession.list("-created_date", 100),
  });

  const activeSessions = sessions.filter(s => s.status === "active");
  const waitingSessions = sessions.filter(s => s.status === "waiting_user");
  const totalCost = sessions.reduce((sum, s) => sum + (s.conversation_cost || 0), 0);
  const avgMessagesPerWindow = sessions.length > 0 
    ? sessions.reduce((sum, s) => sum + (s.messages_in_window || 0), 0) / sessions.length 
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Estratégia WhatsApp</h1>
        <p className="text-slate-500 text-sm mt-1">Otimização de custos da API oficial do WhatsApp</p>
      </div>

      {/* KPIs de Custo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-100">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-green-50">
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Custo Total</p>
                <p className="text-xl font-bold text-slate-900">R$ {(totalCost / 100).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-50">
                <MessageSquare className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Sessões Ativas</p>
                <p className="text-xl font-bold text-slate-900">{activeSessions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-amber-50">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Aguardando Usuário</p>
                <p className="text-xl font-bold text-slate-900">{waitingSessions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-violet-50">
                <Zap className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Msgs/Janela (Média)</p>
                <p className="text-xl font-bold text-slate-900">{avgMessagesPerWindow.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="strategies" className="w-full">
        <TabsList className="bg-slate-100 rounded-xl">
          <TabsTrigger value="strategies" className="rounded-lg">Estratégias de Economia</TabsTrigger>
          <TabsTrigger value="pricing" className="rounded-lg">Tabela de Preços</TabsTrigger>
          <TabsTrigger value="implementation" className="rounded-lg">Implementação</TabsTrigger>
        </TabsList>

        <TabsContent value="strategies" className="space-y-4 mt-6">
          <Alert className="border-blue-200 bg-blue-50">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-900">
              <strong>Meta de Economia:</strong> Reduzir custos em até 70% usando janelas de 24h e pausas estratégicas
            </AlertDescription>
          </Alert>

          <Card className="rounded-2xl border-slate-100">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Timer className="w-5 h-5 text-emerald-600" />
                1. Maximizar Janela de 24h (FREE)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                <p className="text-sm font-semibold text-emerald-900 mb-2">Como funciona:</p>
                <p className="text-sm text-emerald-700">
                  Quando o usuário envia a primeira mensagem, você tem <strong>24 horas GRÁTIS</strong> para responder quantas vezes quiser.
                  Aproveite esse período ao máximo!
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700 uppercase">Táticas:</p>
                <div className="space-y-2">
                  <div className="flex gap-3 items-start">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-600">
                      <strong>Coleta completa na primeira interação:</strong> Pergunte nome, CPF, órgão, salário, tudo de uma vez
                    </p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-600">
                      <strong>Simulação imediata:</strong> Faça simulações e apresente condições dentro das 24h
                    </p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-600">
                      <strong>Lembretes dentro da janela:</strong> Envie 2-3 follow-ups se cliente não responder (ainda grátis!)
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-100">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Pause className="w-5 h-5 text-blue-600" />
                2. Sistema de Pausa Inteligente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-sm font-semibold text-blue-900 mb-2">Quando pausar:</p>
                <p className="text-sm text-blue-700">
                  Se após 20-22 horas o cliente ainda não enviou documentos ou não respondeu, <strong>PARE de enviar mensagens</strong>.
                  Deixe ele retomar quando quiser - a próxima mensagem DELE iniciará uma nova janela grátis.
                </p>
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                    <p className="text-xs font-semibold text-red-900 mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> NÃO FAZER
                    </p>
                    <p className="text-xs text-red-700">Enviar mensagem após 24h = nova conversa cobrada (~R$ 0,30)</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                    <p className="text-xs font-semibold text-emerald-900 mb-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> FAZER
                    </p>
                    <p className="text-xs text-emerald-700">Aguardar cliente retomar = nova janela grátis de 24h</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-100">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-violet-600" />
                3. Consolidar em Uma Única Conversa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
                <p className="text-sm text-violet-700">
                  Cada nova "conversa" (conjunto de mensagens separadas por +24h de silêncio) é cobrada. 
                  <strong> Meta: 1 conversa = 1 proposta completa</strong>
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex gap-3 items-start">
                  <ArrowRight className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-600">
                    Identifique o estágio da jornada e retome exatamente de onde parou
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <ArrowRight className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-600">
                    Use metadata da sessão para lembrar contexto sem perguntar novamente
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <ArrowRight className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-600">
                    Finalize tudo que for possível antes de encerrar a janela
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-100">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-600" />
                4. Agrupamento de Mensagens
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <p className="text-sm text-amber-700">
                  Em vez de enviar 5 mensagens curtas, envie 1 mensagem completa com todas as informações.
                  Isso reduz ruído e melhora a experiência.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-slate-500 mb-2">❌ Ruim (5 msgs):</p>
                  <div className="space-y-1 text-xs text-slate-600">
                    <p>• "Qual seu nome?"</p>
                    <p>• "Qual seu CPF?"</p>
                    <p>• "Onde trabalha?"</p>
                    <p>• "Qual salário?"</p>
                    <p>• "Quanto precisa?"</p>
                  </div>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-emerald-700 mb-2">✅ Bom (1 msg):</p>
                  <p className="text-xs text-emerald-600">
                    "Para começar, preciso de:<br/>
                    • Nome completo<br/>
                    • CPF<br/>
                    • Órgão empregador<br/>
                    • Salário bruto<br/>
                    • Valor desejado"
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="mt-6">
          <Card className="rounded-2xl border-slate-100">
            <CardHeader>
              <CardTitle className="text-base">Tabela de Preços - API WhatsApp Business (Brasil)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertDescription className="text-sm text-blue-900">
                    <strong>Importante:</strong> Cobrança é por <strong>conversa</strong>, não por mensagem. 
                    Uma conversa = janela de 24 horas.
                  </AlertDescription>
                </Alert>

                <div className="overflow-hidden border border-slate-200 rounded-xl">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left p-3 font-semibold text-slate-700">Tipo de Conversa</th>
                        <th className="text-left p-3 font-semibold text-slate-700">Quem Inicia</th>
                        <th className="text-left p-3 font-semibold text-slate-700">Custo Médio</th>
                        <th className="text-left p-3 font-semibold text-slate-700">Estratégia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr className="bg-emerald-50/50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">FREE</Badge>
                            <span className="font-medium">Resposta dentro de 24h</span>
                          </div>
                        </td>
                        <td className="p-3">Cliente</td>
                        <td className="p-3"><span className="font-bold text-emerald-700">R$ 0,00</span></td>
                        <td className="p-3 text-xs text-slate-600">Maximize esse período!</td>
                      </tr>
                      <tr>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">Service</Badge>
                            <span className="font-medium">Conversa iniciada pelo cliente</span>
                          </div>
                        </td>
                        <td className="p-3">Cliente</td>
                        <td className="p-3"><span className="font-bold text-slate-700">~R$ 0,16</span></td>
                        <td className="p-3 text-xs text-slate-600">Mais barato, incentive retorno</td>
                      </tr>
                      <tr>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-violet-100 text-violet-700 border-0 text-xs">Marketing</Badge>
                            <span className="font-medium">Template aprovado (proativo)</span>
                          </div>
                        </td>
                        <td className="p-3">Empresa</td>
                        <td className="p-3"><span className="font-bold text-slate-700">~R$ 0,33</span></td>
                        <td className="p-3 text-xs text-slate-600">Use com moderação</td>
                      </tr>
                      <tr>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">Utility</Badge>
                            <span className="font-medium">Notificações (aprovação, CCB)</span>
                          </div>
                        </td>
                        <td className="p-3">Empresa</td>
                        <td className="p-3"><span className="font-bold text-slate-700">~R$ 0,19</span></td>
                        <td className="p-3 text-xs text-slate-600">Para atualizações críticas</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-slate-900 mb-2">Exemplo de Economia:</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-red-700 font-medium mb-2">❌ Estratégia Ruim (Alto Custo)</p>
                      <div className="space-y-1 text-xs text-slate-600">
                        <p>• Dia 1: Cliente inicia (R$ 0,16)</p>
                        <p>• Dia 2: Empresa envia follow-up (R$ 0,33)</p>
                        <p>• Dia 3: Empresa envia docs (R$ 0,33)</p>
                        <p>• Dia 5: Empresa envia status (R$ 0,33)</p>
                        <p className="text-red-700 font-bold pt-1">Total: R$ 1,15</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-emerald-700 font-medium mb-2">✅ Estratégia Boa (Baixo Custo)</p>
                      <div className="space-y-1 text-xs text-slate-600">
                        <p>• Dia 1: Cliente inicia - coleta tudo (FREE)</p>
                        <p>• Dia 1: Simulação e docs (FREE)</p>
                        <p>• Dia 2: Cliente responde com docs (R$ 0,16)</p>
                        <p>• Dia 2: Análise e aprovação (FREE)</p>
                        <p className="text-emerald-700 font-bold pt-1">Total: R$ 0,16 (86% economia!)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="implementation" className="space-y-4 mt-6">
          <Card className="rounded-2xl border-slate-100">
            <CardHeader>
              <CardTitle className="text-base">Implementação Técnica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-slate-900 mb-2">1. Tracking de Sessões (Entidade: WhatsAppSession)</p>
                  <div className="space-y-2 text-xs text-slate-600">
                    <p>• <strong>window_expires_at:</strong> Timestamp de quando expira a janela de 24h</p>
                    <p>• <strong>messages_in_window:</strong> Contador de mensagens enviadas na janela atual</p>
                    <p>• <strong>status:</strong> active | waiting_user | paused | completed</p>
                    <p>• <strong>stage:</strong> Etapa da jornada para retomar contexto</p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-slate-900 mb-2">2. Lógica de Pausa Automática</p>
                  <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto mt-2">
{`// Antes de enviar mensagem, verificar:
const session = await getSession(phone);
const hoursInWindow = (now - session.last_message_at) / 3600000;

if (hoursInWindow > 22 && session.status === "waiting_user") {
  // NÃO ENVIAR - pausar sessão
  await updateSession(session.id, { 
    status: "paused",
    pending_action: "aguardando_documentos" 
  });
  return;
}

// Só enviar se dentro de janela ativa`}</pre>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-slate-900 mb-2">3. Webhook - Mensagem Recebida do Cliente</p>
                  <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto mt-2">
{`// Quando cliente envia mensagem:
const session = await getOrCreateSession(phone);

if (session.status === "paused") {
  // NOVA JANELA GRÁTIS DE 24H!
  await updateSession(session.id, {
    status: "active",
    window_expires_at: now + 24h,
    messages_in_window: 0,
    // Retomar do estágio anterior
    stage: session.stage
  });
}`}</pre>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-slate-900 mb-2">4. Instrução do Agente (credit_advisor)</p>
                  <div className="space-y-2 text-xs text-slate-600 mt-2">
                    <p>Adicionar ao prompt do agente:</p>
                    <div className="bg-amber-50 border border-amber-200 rounded p-2 mt-1">
                      <p className="text-amber-900">
                        "Você está otimizando custos de WhatsApp. <strong>Colete o máximo de informações na primeira interação.</strong> 
                        Se cliente não responder após 2 follow-ups, pause e aguarde ele retomar. 
                        Sempre agrupe perguntas em uma única mensagem completa."
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-sm font-semibold text-blue-900 mb-2">📊 Monitoramento Recomendado</p>
                  <div className="space-y-1 text-xs text-blue-700">
                    <p>• Custo médio por proposta concluída</p>
                    <p>• Taxa de conclusão dentro de 1 conversa (meta: &gt;70%)</p>
                    <p>• Média de mensagens por janela (meta: &gt;8)</p>
                    <p>• % de sessões pausadas vs. concluídas</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}