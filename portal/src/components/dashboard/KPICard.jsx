import React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function KPICard({ title, value, subtitle, icon: Icon, trend, trendValue, color = "blue" }) {
  const colorMap = {
    blue: "from-blue-500 to-blue-600",
    green: "from-emerald-500 to-emerald-600",
    purple: "from-violet-500 to-violet-600",
    orange: "from-amber-500 to-amber-600",
    red: "from-rose-500 to-rose-600",
    cyan: "from-cyan-500 to-cyan-600",
  };

  const trendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const TrendIcon = trendIcon;
  const trendColor = trend === "up" ? "text-emerald-600" : trend === "down" ? "text-rose-500" : "text-slate-400";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg hover:shadow-slate-100/50 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-2.5 rounded-xl bg-gradient-to-br shadow-lg shadow-slate-200/50", colorMap[color])}>
          {Icon && <Icon className="w-5 h-5 text-white" />}
        </div>
        {trendValue && (
          <div className={cn("flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-slate-50", trendColor)}>
            <TrendIcon className="w-3 h-3" />
            {trendValue}
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
        <p className="text-sm font-medium text-slate-500 mt-0.5">{title}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}