import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const orgBenefits = [
  "Sem custo algum para o órgão público",
  "Implementação rápida e sem complexidade",
  "Integração com os sistemas de folha de pagamento",
  "Redução de pedidos de adiantamento por canais burocráticos",
  "Melhora do bem-estar financeiro dos servidores",
  "Suporte dedicado durante toda a operação",
];

export default function ForOrgsSection() {
  return (
    <section className="py-24 lg:py-32 bg-white" id="para-orgaos">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium mb-4">
              Para órgãos públicos
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
              Ofereça um benefício{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                que faz diferença
              </span>
            </h2>
            <p className="mt-6 text-lg text-slate-500 leading-relaxed">
              O Kaskay permite que órgãos públicos ofereçam adiantamento salarial como benefício aos seus servidores, sem impacto no orçamento e sem complexidade operacional.
            </p>

            <ul className="mt-8 space-y-4">
              {orgBenefits.map((benefit, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + index * 0.08, duration: 0.4 }}
                  className="flex items-start gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">{benefit}</span>
                </motion.li>
              ))}
            </ul>

            <Button
              size="lg"
              className="mt-10 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-base px-8 py-6 rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 hover:scale-[1.02]"
              onClick={() => document.getElementById('contato')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Quero ser parceiro
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-10 border border-emerald-100">
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-slate-500">Servidores ativos</span>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full">+12% mês</span>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">1.247</p>
                  <div className="mt-4 flex gap-1">
                    {[40, 55, 35, 70, 50, 85, 60, 90, 45, 75, 65, 80].map((h, i) => (
                      <div key={i} className="flex-1 bg-emerald-100 rounded-full overflow-hidden h-16">
                        <div
                          className="bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-full w-full transition-all duration-500"
                          style={{ height: `${h}%`, marginTop: `${100 - h}%` }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <p className="text-sm text-slate-500 mb-1">Satisfação</p>
                    <p className="text-2xl font-bold text-slate-900">98%</p>
                    <p className="text-xs text-emerald-600 font-medium mt-1">dos servidores</p>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <p className="text-sm text-slate-500 mb-1">Tempo médio</p>
                    <p className="text-2xl font-bold text-slate-900">3 min</p>
                    <p className="text-xs text-emerald-600 font-medium mt-1">para receber</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}