import React from "react";
import { motion } from "framer-motion";
import { Shield, Zap, Landmark, HeartHandshake, TrendingUp, Users } from "lucide-react";

const benefits = [
  {
    icon: Zap,
    title: "Ultrarrápido",
    description: "Solicite seu adiantamento e receba via PIX em ~5 minutos. Velocidade incomparável no mercado.",
    color: "from-amber-500 to-orange-500",
    bg: "bg-amber-50",
  },
  {
    icon: Shield,
    title: "Segurança total",
    description: "Seus dados são protegidos com criptografia de ponta. Plataforma em conformidade com a LGPD.",
    color: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-50",
  },
  {
    icon: Landmark,
    title: "Feito para servidores",
    description: "Desenvolvido especialmente para servidores públicos, com integração direta aos órgãos parceiros.",
    color: "from-blue-500 to-indigo-500",
    bg: "bg-blue-50",
  },
  {
    icon: HeartHandshake,
    title: "Tarifa fixa",
    description: "Tarifa única e independente do valor solicitado. Sem cobranças escondidas, transparência total.",
    color: "from-rose-500 to-pink-500",
    bg: "bg-rose-50",
  },
  {
    icon: TrendingUp,
    title: "Educação financeira",
    description: "Conteúdos e ferramentas para ajudar você a organizar suas finanças e alcançar seus objetivos.",
    color: "from-violet-500 to-purple-500",
    bg: "bg-violet-50",
  },
  {
    icon: Users,
    title: "Suporte humanizado",
    description: "Atendimento personalizado para resolver suas dúvidas no dia a dia.",
    color: "from-cyan-500 to-blue-500",
    bg: "bg-cyan-50",
  },
];

export default function BenefitsSection() {
  return (
    <section className="py-24 lg:py-32 bg-white" id="beneficios">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium mb-4">
            Benefícios
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
            Por que escolher o{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
              Kaskay
            </span>
            ?
          </h2>
          <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
            Uma plataforma pensada para trazer tranquilidade financeira ao servidor público brasileiro.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="group relative p-8 rounded-2xl border border-slate-100 bg-white hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-200 transition-all duration-500 hover:-translate-y-1"
            >
              <div className={`w-14 h-14 rounded-2xl ${benefit.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <benefit.icon className={`w-7 h-7 bg-gradient-to-r ${benefit.color} bg-clip-text`} style={{ color: benefit.color.includes('emerald') ? '#059669' : benefit.color.includes('amber') ? '#d97706' : benefit.color.includes('blue') ? '#2563eb' : benefit.color.includes('rose') ? '#e11d48' : benefit.color.includes('violet') ? '#7c3aed' : '#0891b2' }} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{benefit.title}</h3>
              <p className="text-slate-500 leading-relaxed">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}