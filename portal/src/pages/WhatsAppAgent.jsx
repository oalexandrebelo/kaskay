import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Send, MessageSquare, Loader2, Trash2, Hand, Phone, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MessageBubble from "@/components/chat/MessageBubble";

export default function WhatsAppAgent() {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [convStatus, setConvStatus] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [takeoverDialog, setTakeoverDialog] = useState(false);
  const [convStatuses, setConvStatuses] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const getUser = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
    };
    getUser();
    loadConversations();
  }, []);

  useEffect(() => {
    if (!activeConv) return;
    const unsubscribe = base44.agents.subscribeToConversation(activeConv.id, (data) => {
      setMessages(data.messages || []);
    });
    return () => unsubscribe();
  }, [activeConv?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async () => {
    setLoading(true);
    const convs = await base44.agents.listConversations({ agent_name: "credit_advisor" });
    setConversations(convs || []);
    
    // Carregar status de cada conversa
    const statuses = {};
    for (const conv of convs) {
      const status = await base44.entities.WhatsAppConversationStatus.filter({
        conversation_id: conv.id
      });
      statuses[conv.id] = status[0] || null;
    }
    setConvStatuses(statuses);
    setLoading(false);
  };

  const createNew = async () => {
    const conv = await base44.agents.createConversation({
      agent_name: "credit_advisor",
      metadata: { name: `Atendimento ${new Date().toLocaleString("pt-BR")}` },
    });
    setConversations(prev => [conv, ...prev]);
    setActiveConv(conv);
    setMessages(conv.messages || []);
  };

  const selectConv = async (conv) => {
    const full = await base44.agents.getConversation(conv.id);
    setActiveConv(full);
    setMessages(full.messages || []);
    
    // Carregar ou criar status
    let status = convStatuses[conv.id];
    if (!status) {
      status = {
        conversation_id: conv.id,
        status: "bot",
        client_name: conv?.metadata?.name || "Cliente",
      };
    }
    setConvStatus(status);
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeConv) return;
    
    // Se conversa está com bot, enviar como user (para teste)
    // Se está com human, enviar como assistant (resposta do operador)
    const role = convStatus?.status === "human_active" ? "assistant" : "user";
    
    setSending(true);
    const msg = input;
    setInput("");
    await base44.agents.addMessage(activeConv, { role, content: msg });
    
    // Atualizar timestamp
    if (convStatus?.id) {
      await base44.entities.WhatsAppConversationStatus.update(convStatus.id, {
        last_message_at: new Date().toISOString(),
        last_message_from: role === "assistant" ? "human" : "client",
      });
    }
    setSending(false);
  };

  const takeoverConversation = async () => {
    if (!convStatus || !currentUser) return;
    
    let updatedStatus = convStatus;
    if (!convStatus.id) {
      // Criar novo status se não existir
      const created = await base44.entities.WhatsAppConversationStatus.create({
        conversation_id: activeConv.id,
        status: "human_active",
        assigned_to: currentUser.email,
        assigned_at: new Date().toISOString(),
        taken_over_at: new Date().toISOString(),
        client_name: activeConv?.metadata?.name || "Cliente",
      });
      updatedStatus = created;
    } else {
      // Atualizar existente
      updatedStatus = await base44.entities.WhatsAppConversationStatus.update(convStatus.id, {
        status: "human_active",
        assigned_to: currentUser.email,
        taken_over_at: new Date().toISOString(),
      });
    }
    setConvStatus(updatedStatus);
    setTakeoverDialog(false);
  };

  const releaseConversation = async () => {
    if (!convStatus?.id) return;
    
    const updated = await base44.entities.WhatsAppConversationStatus.update(convStatus.id, {
      status: "bot",
      assigned_to: null,
      taken_over_at: null,
    });
    setConvStatus(updated);
  };

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-2xl border border-slate-100 overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 border-r border-slate-100 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-100">
          <Button className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl" onClick={createNew}>
            <Plus className="w-4 h-4 mr-2" /> Nova Conversa
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {loading && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>}
            {conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => selectConv(conv)}
                className={`w-full text-left p-3 rounded-xl transition-colors ${
                  activeConv?.id === conv.id ? "bg-blue-50 border border-blue-200" : "hover:bg-slate-50"
                }`}
              >
                <p className="text-sm font-medium text-slate-900 truncate">{conv?.metadata?.name || "Conversa"}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {conv.created_date ? new Date(conv.created_date).toLocaleString("pt-BR") : ""}
                </p>
              </button>
            ))}
          </div>
        </ScrollArea>
        <div className="p-3 border-t border-slate-100">
          <a
            href={base44.agents.getWhatsAppConnectURL("credit_advisor")}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <MessageSquare className="w-4 h-4" /> Conectar WhatsApp
          </a>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col">
        {!activeConv ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400">Selecione ou crie uma conversa</p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{activeConv?.metadata?.name || "Conversa"}</p>
                  <p className="text-[10px] text-slate-400">
                    {convStatus?.status === "human_active" ? "🟢 Operador ativo" : "🤖 Atendimento automático"}
                  </p>
                </div>
                {convStatus?.status === "human_active" ? (
                  <Badge className="bg-emerald-600 text-white flex items-center gap-1">
                    <Hand className="w-3 h-3" /> Assumido
                  </Badge>
                ) : (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Bot
                  </Badge>
                )}
              </div>
              {convStatus?.assigned_to && (
                <p className="text-xs text-slate-600">Operador: {convStatus.assigned_to}</p>
              )}
            </div>
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4 max-w-3xl mx-auto">
                {messages.map((msg, i) => <MessageBubble key={i} message={msg} />)}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            <div className="p-4 border-t border-slate-100 space-y-3">
              {convStatus?.status === "bot" && (
                <Button 
                  onClick={() => setTakeoverDialog(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center gap-2"
                >
                  <Hand className="w-4 h-4" /> Assumir Atendimento
                </Button>
              )}
              {convStatus?.status === "human_active" && (
                <Button 
                  onClick={releaseConversation}
                  variant="outline"
                  className="w-full rounded-xl"
                >
                  Retornar ao Bot
                </Button>
              )}
              <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-2 max-w-3xl mx-auto">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={convStatus?.status === "human_active" ? "Responda como operador..." : "Teste a conversa..."}
                  className="rounded-xl"
                  disabled={sending || (convStatus?.status === "bot")}
                />
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 rounded-xl px-4" disabled={sending || !input.trim() || convStatus?.status === "bot"}>
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </form>
              {convStatus?.status === "bot" && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-800">Conversa no modo automático. Assuma para responder como operador humano.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Dialog para assumir conversa */}
      <Dialog open={takeoverDialog} onOpenChange={setTakeoverDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assumir Atendimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-600">
              Você está prestes a assumir o atendimento desta conversa. O cliente saberá que está falando com um operador humano.
            </p>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
              <p className="text-sm font-semibold text-slate-900">Detalhes:</p>
              <div className="text-sm text-slate-600 space-y-1">
                <p><strong>Conversa:</strong> {activeConv?.metadata?.name || "Conversa"}</p>
                <p><strong>Operador:</strong> {currentUser?.full_name} ({currentUser?.email})</p>
                <p><strong>Horário:</strong> {new Date().toLocaleString("pt-BR")}</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={() => setTakeoverDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={takeoverConversation} className="bg-emerald-600 hover:bg-emerald-700">
                <Hand className="w-4 h-4 mr-2" /> Assumir Agora
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}