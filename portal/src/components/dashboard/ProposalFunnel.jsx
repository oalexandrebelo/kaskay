import React from "react";

const stages = [
  { key: "draft", label: "Rascunho", color: "bg-slate-400" },
  { key: "under_analysis", label: "Em Análise", color: "bg-blue-500" },
  { key: "margin_check", label: "Consulta Margem", color: "bg-cyan-500" },
  { key: "margin_approved", label: "Margem Aprovada", color: "bg-teal-500" },
  { key: "ccb_issued", label: "CCB Emitida", color: "bg-violet-500" },
  { key: "signature_completed", label: "Assinado", color: "bg-amber-500" },
  { key: "averbated", label: "Averbado", color: "bg-emerald-500" },
  { key: "disbursed", label: "Desembolsado", color: "bg-green-600" },
];

export default function ProposalFunnel({ proposals = [] }) {
  const counts = {};
  stages.forEach(s => {
    counts[s.key] = proposals.filter(p => p.status === s.key).length;
  });

  const maxCount = Math.max(...Object.values(counts), 1);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-6">Funil de Propostas</h3>
      <div className="space-y-3">
        {stages.map((stage, i) => {
          const count = counts[stage.key] || 0;
          const width = Math.max((count / maxCount) * 100, 8);
          return (
            <div key={stage.key} className="flex items-center gap-3">
              <div className="w-32 text-xs font-medium text-slate-500 text-right shrink-0 truncate">
                {stage.label}
              </div>
              <div className="flex-1 h-8 bg-slate-50 rounded-lg overflow-hidden relative">
                <div
                  className={`h-full ${stage.color} rounded-lg transition-all duration-700 ease-out flex items-center px-3`}
                  style={{ width: `${width}%` }}
                >
                  <span className="text-xs font-bold text-white">{count}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}