import React from "react";
import { motion } from "framer-motion";
import { Building2, MessageSquare, Banknote, CreditCard } from "lucide-react";

const steps = [
  {
    icon: Building2,
    number: "01",
    title: "Órgão se cadastra",
    description: "O órgão público faz a adesão à plataforma Kaskay de forma simples e sem custo.",
  },
  {
    icon: MessageSquare,
    number: "02",
    title: "Cliente contrata",
    description: "O servidor pode contratar diretamente pelo WhatsApp ou pelo nosso portal de forma rápida.",
  },
  {
    icon: Banknote,
    number: "03",
    title: "Recebe via PIX",
    description: "O valor é transferido via PIX em até 5 minutos, direto na conta do servidor.",
  },
  {
    icon: CreditCard,
    number: "04",
    title: "Desconto em folha",
    description: "O pagamento acontece automaticamente via desconto em folha na próxima competência.",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="py-24 lg:py-32 bg-slate-50" id="como-funciona">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium mb-4">
            Como funciona
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
            Simples como deve ser
          </h2>
          <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
            Em 4 passos, o servidor público tem acesso ao adiantamento salarial com total transparência.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              className="relative"
            >
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[calc(50%+40px)] right-[calc(-50%+40px)] h-[2px] bg-gradient-to-r from-emerald-300 to-emerald-100" />
              )}
              <div className="relative bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-500 text-center group hover:-translate-y-1">
                <div className="text-5xl font-black text-emerald-100 group-hover:text-emerald-200 transition-colors mb-4">
                  {step.number}
                </div>
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-6 group-hover:bg-emerald-100 transition-colors">
                  <step.icon className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}