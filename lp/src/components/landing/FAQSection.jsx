import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "O que é o Kaskay?",
    answer: "O Kaskay é uma plataforma de adiantamento salarial feita para servidores públicos. Permitimos que você antecipe parte do salário já trabalhado de forma rápida, segura e com taxas transparentes.",
  },
  {
    question: "Quem pode usar o Kaskay?",
    answer: "Neste primeiro momento, o Kaskay é exclusivo para servidores públicos cujos órgãos sejam parceiros da plataforma. Estamos expandindo parcerias com prefeituras, estados e órgãos federais.",
  },
  {
    question: "Tem custo para o órgão público?",
    answer: "Não. O Kaskay é 100% gratuito para o órgão público. A única taxa é cobrada do servidor que solicita o adiantamento, de forma transparente e fixa.",
  },
  {
    question: "Como recebo o dinheiro?",
    answer: "O valor é transferido via PIX diretamente para sua conta bancária em poucos minutos após a solicitação.",
  },
  {
    question: "Qual o valor máximo que posso antecipar?",
    answer: "Você pode antecipar até um percentual do salário proporcional aos dias já trabalhados no mês. O valor exato é calculado automaticamente pela plataforma.",
  },
  {
    question: "Como é feito o desconto?",
    answer: "O desconto é automático na folha de pagamento do mês vigente. Você não precisa se preocupar com boletos ou cobranças separadas.",
  },
  {
    question: "É seguro?",
    answer: "Sim. Utilizamos criptografia de ponta a ponta e estamos em conformidade com a LGPD. Seus dados são tratados com o mais alto nível de segurança.",
  },
];

function FAQItem({ faq, isOpen, onToggle }) {
  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-6 text-left group"
      >
        <span className="text-base sm:text-lg font-semibold text-slate-900 pr-8 group-hover:text-emerald-700 transition-colors">
          {faq.question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-emerald-500" : ""}`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-slate-500 leading-relaxed pr-12">
              {faq.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="py-24 lg:py-32 bg-slate-50" id="faq">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium mb-4">
            Dúvidas frequentes
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
            Tire suas dúvidas
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm px-8"
        >
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              faq={faq}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? -1 : index)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}