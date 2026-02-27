import React from "react";
import { motion } from "framer-motion";

const stats = [
  { value: "R$ 0", label: "de impacto ao órgão", prefix: "" },
  { value: "Instantâneo", label: "receba via PIX", prefix: "" },
  { value: "100%", label: "protegido e seguro", prefix: "" },
  { value: "Taxa Fixa", label: "sem cobranças ocultas", prefix: "" },
];

export default function StatsSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-emerald-600/8 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="text-center"
            >
              <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">
                {stat.prefix}{stat.value}
              </p>
              <p className="text-emerald-300/80 text-sm sm:text-base font-medium">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}