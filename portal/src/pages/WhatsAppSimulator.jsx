import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, User, Bot, Loader2, CheckCheck, Zap } from "lucide-react";

export default function WhatsAppSimulator() {
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const [phone, setPhone] = useState("5511999999999");
  const [message, setMessage] = useState("");
  const [conversationId, setConversationId] = useState(null);

  const { data: conversation = null } = useQuery({
    queryKey: ["whatsapp_conversation", conversationId],
    queryFn: () => conversationId ? base44.agents.getConversation(conversationId) : null,
    enabled: !!conversationId,
    refetchInterval: 2000, // Atualiza a cada 2s
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  const startConversationMutation = useMutation({
    mutationFn: async () => {
      const conv = await base44.agents.createConversation({
        agent_name: "credit_advisor",
        metadata: {
          phone,
          channel: "whatsapp_simulator",
        },
      });
      return conv;
    },
    onSuccess: (conv) => {
      setConversationId(conv.id);
      queryClient.invalidateQueries({ queryKey: ["whatsapp_conversation"] });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (msg) => {
      if (!conversationId) return;
      await base44.agents.addMessage(conversation, {
        role: "user",
        content: msg,
      });
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["whatsapp_conversation"] });
    },
  });

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate(message);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Simulador WhatsApp</h1>
        <p className="text-slate-500 text-sm mt-1">Teste o agente de crédito sem API oficial</p>
      </div>

      <Alert className="border-blue-200 bg-blue-50">
        <Zap className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900 text-sm">
          <strong>Simulador Local:</strong> Teste a jornada completa de adiantamento sem precisar de API oficial do WhatsApp. 
          Todas as mensagens são processadas pelo agente de IA real.
        </AlertDescription>
      </Alert>

      {!conversationId ? (
        <Card className="rounded-2xl border-slate-100">
          <CardContent className="p-8 text-center">
            <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Iniciar Simulação</h3>
            <p className="text-slate-500 text-sm mb-4">Digite o número de telefone para começar</p>
            <div className="max-w-xs mx-auto space-y-3">
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="rounded-xl"
                placeholder="5511999999999"
              />
              <Button
                className="w-full bg-green-600 hover:bg-green-700 rounded-xl"
                onClick={() => startConversationMutation.mutate()}
                disabled={startConversationMutation.isPending}
              >
                {startConversationMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <MessageSquare className="w-4 h-4 mr-2" />
                )}
                Iniciar Conversa
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl border-slate-100">
          <CardHeader className="pb-3 border-b bg-green-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base">Kaskay Crédito</CardTitle>
                  <p className="text-xs text-green-700">Agente de Adiantamento</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-700 border-0">
                Online
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Mensagens */}
            <div className="h-[500px] overflow-y-auto p-4 space-y-3 bg-slate-50">
              {conversation?.messages?.map((msg, idx) => {
                const isUser = msg.role === "user";
                return (
                  <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] ${isUser ? "order-2" : "order-1"}`}>
                      <div className={`flex items-start gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? "bg-blue-600" : "bg-green-600"}`}>
                          {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                        </div>
                        <div className={`rounded-2xl px-4 py-2 ${isUser ? "bg-blue-600 text-white" : "bg-white border border-slate-200"}`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <div className={`flex items-center gap-1 mt-1 text-xs ${isUser ? "text-blue-100 justify-end" : "text-slate-400"}`}>
                            <span>{new Date(msg.timestamp || Date.now()).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                            {isUser && <CheckCheck className="w-3 h-3" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t bg-white">
              <div className="flex items-center gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="rounded-full"
                  placeholder="Digite sua mensagem..."
                  disabled={sendMessageMutation.isPending}
                />
                <Button
                  size="icon"
                  className="rounded-full bg-green-600 hover:bg-green-700 shrink-0"
                  onClick={handleSend}
                  disabled={!message.trim() || sendMessageMutation.isPending}
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}