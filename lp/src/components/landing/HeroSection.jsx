import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Clock, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-600/8 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-300 text-sm font-medium tracking-wide">
                Feito para servidores públicos
              </span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.1] tracking-tight">
              Seu salário,{" "}
              <span className="relative">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-300">
                  quando você
                </span>
              </span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300">
                precisar.
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-400 leading-relaxed max-w-lg">
              Solicite parte do seu salário já trabalhado de forma rápida, segura e sem burocracia. Sem juros abusivos, sem surpresas.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-base px-8 py-6 rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 hover:scale-[1.02]"
                onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Saiba como funciona
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <a href="https://app.flaviofaria.online" target="_blank" rel="noopener noreferrer">
                <Button
                  size="lg"
                  className="bg-white text-slate-900 hover:bg-slate-100 font-medium text-base px-8 py-6 rounded-xl shadow-lg"
                >
                  Sou Servidor
                </Button>
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="hidden lg:block"
          >
            <div className="relative">
              {/* Main card */}
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Banknote className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Saldo disponível</p>
                    <p className="text-slate-500 text-sm">Atualizado agora</p>
                  </div>
                </div>
                <p className="text-4xl font-bold text-white mb-1">R$ 2.450,00</p>
                <p className="text-emerald-400 text-sm font-medium">de R$ 4.200,00 trabalhados</p>
                
                <div className="mt-6 w-full bg-slate-700/50 rounded-full h-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "58%" }}
                    transition={{ delay: 1, duration: 1.5, ease: "easeOut" }}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-3 rounded-full"
                  />
                </div>
                <p className="text-slate-500 text-xs mt-2">58% do mês trabalhado</p>

                <div className="mt-8 grid grid-cols-3 gap-4">
                  {[
                    { icon: Shield, label: "Seguro", desc: "100% protegido" },
                    { icon: Clock, label: "Rápido", desc: "Em minutos" },
                    { icon: Banknote, label: "Sem juros", desc: "Taxa fixa baixa" },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.2 + i * 0.15, duration: 0.5 }}
                      className="text-center p-3 rounded-xl bg-slate-800/50 border border-slate-700/30"
                    >
                      <item.icon className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                      <p className="text-white text-xs font-semibold">{item.label}</p>
                      <p className="text-slate-500 text-[10px]">{item.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Floating notification */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.8, duration: 0.6 }}
                className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-4 shadow-xl border border-slate-100 max-w-[240px]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Banknote className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-slate-900 text-sm font-semibold">PIX recebido!</p>
                    <p className="text-slate-500 text-xs">R$ 800,00 • agora</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}