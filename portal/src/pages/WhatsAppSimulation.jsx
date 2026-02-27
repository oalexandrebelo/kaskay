import React, { useState, useRef, useEffect } from "react";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function WhatsAppSimulation() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Olá! 👋 Bem-vindo ao Kaskay! Gostaria de solicitar um adiantamento salarial?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const botResponses = {
    "olá": "Ótimo! Vou te ajudar. Qual é o seu CPF?",
    "cpf": "Perfeito! E qual é o seu órgão empregador?",
    "órgão": "Excelente! Quanto você gostaria de solicitar de adiantamento?",
    "quanto": "Ótimo! O valor solicitado é possível com sua margem consignável. Vou enviar um código para você.",
    "código": "Código enviado via WhatsApp! Digite o código de 6 dígitos que você recebeu.",
    "123456": "Código validado com sucesso! 🎉 Agora vou precisar de sua chave PIX para o desembolso.",
    "pix": "Perfeito! Sua solicitação foi enviada com sucesso. Você receberá o valor em até 2 horas via PIX.",
    "default": "Entendi! Pode detalhar um pouco mais?",
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: input,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Simulate bot delay and response
    setTimeout(() => {
      const lowerInput = input.toLowerCase();
      let botText = botResponses.default;

      // Match keywords
      if (
        lowerInput.includes("olá") ||
        lowerInput.includes("oi") ||
        lowerInput.includes("e aí")
      ) {
        botText = botResponses.olá;
      } else if (
        lowerInput.match(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/) ||
        lowerInput.match(/^\d{11}$/)
      ) {
        botText = botResponses.cpf;
      } else if (
        lowerInput.includes("federal") ||
        lowerInput.includes("estadual") ||
        lowerInput.includes("municipal") ||
        lowerInput.includes("prefeitura") ||
        lowerInput.includes("câmara") ||
        lowerInput.includes("assembleia")
      ) {
        botText = botResponses.órgão;
      } else if (
        lowerInput.match(/r\$\s*\d+/) ||
        lowerInput.match(/\d{2,}/)
      ) {
        botText = botResponses.quanto;
      } else if (lowerInput.includes("código")) {
        botText = botResponses.código;
      } else if (lowerInput.match(/^\d{6}$/)) {
        botText = botResponses["123456"];
      } else if (
        lowerInput.includes("pix") ||
        lowerInput.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/) ||
        lowerInput.match(/^\d{2,3}\.\d{8,9}\/0001-\d{2}$/)
      ) {
        botText = botResponses.pix;
      }

      const botMessage = {
        id: messages.length + 2,
        text: botText,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to={createPageUrl("Website")} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
            <span className="text-sm font-medium text-slate-600">Voltar</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900">Kaskay Bot</h1>
              <p className="text-xs text-green-600">Online</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-2xl mx-auto h-[calc(100vh-120px)] flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50 to-white">
          {messages.map((msg, idx) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                  msg.sender === "user"
                    ? "bg-green-600 text-white rounded-br-none"
                    : "bg-slate-200 text-slate-900 rounded-bl-none"
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.sender === "user" ? "text-green-100" : "text-slate-500"
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Info Box */}
        <div className="px-4 py-3 bg-blue-50 border-t border-blue-200">
          <p className="text-xs text-blue-900">
            💡 <strong>Dica:</strong> Tente digitar "Olá", "CPF", "Federal", "R$ 1000", "123456" para ver como funciona!
          </p>
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="border-t border-slate-200 bg-white p-4">
          <div className="flex gap-3">
            <Input
              type="text"
              placeholder="Digite sua mensagem..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 rounded-full"
            />
            <Button
              type="submit"
              size="icon"
              className="rounded-full w-10 h-10 bg-green-600 hover:bg-green-700 shrink-0"
              disabled={!input.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}