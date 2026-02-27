import React, { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays, parseISO, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function VolumeChart({ proposals = [], days = 30 }) {
  const data = useMemo(() => {
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = startOfDay(subDays(new Date(), i));
      const dayStr = format(day, "yyyy-MM-dd");
      const dayProposals = proposals.filter(p => {
        const pDate = format(new Date(p.created_date), "yyyy-MM-dd");
        return pDate === dayStr;
      });
      result.push({
        date: format(day, "dd/MM", { locale: ptBR }),
        propostas: dayProposals.length,
        valor: dayProposals.reduce((sum, p) => sum + (p.requested_amount || 0), 0),
      });
    }
    return result;
  }, [proposals, days]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs">
        <p className="font-medium mb-1">{label}</p>
        <p>Propostas: <span className="font-bold">{payload[0]?.value}</span></p>
        <p>Valor: <span className="font-bold">R$ {(payload[1]?.value || 0).toLocaleString("pt-BR")}</span></p>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-1">Volume de Propostas</h3>
      <p className="text-sm text-slate-400 mb-6">Últimos {days} dias</p>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPropostas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="propostas" stroke="#3b82f6" strokeWidth={2} fill="url(#colorPropostas)" />
          <Area type="monotone" dataKey="valor" stroke="#10b981" strokeWidth={2} fill="url(#colorValor)" yAxisId={0} hide />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}