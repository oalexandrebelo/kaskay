import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function QuickActionCard({ icon: Icon, title, description, onClick, badge, variant = "default", size = "default" }) {
  const baseStyles = "flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105";
  
  const variants = {
    default: "bg-white border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50",
    primary: "bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-xl",
    success: "bg-gradient-to-br from-green-500 to-green-600 text-white hover:shadow-xl",
    warning: "bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:shadow-xl",
    danger: "bg-gradient-to-br from-red-500 to-red-600 text-white hover:shadow-xl",
  };

  const sizes = {
    small: "p-6 gap-2",
    default: "p-8 gap-3",
    large: "p-12 gap-4",
  };

  return (
    <Card className={cn(baseStyles, variants[variant], sizes[size], "rounded-xl border-0")}>
      <CardContent className="p-0 flex flex-col items-center gap-inherit w-full">
        {Icon && <Icon className="w-8 h-8" />}
        <div>
          <h3 className="font-semibold text-sm md:text-base">{title}</h3>
          <p className={cn("text-xs md:text-sm", variant === "default" ? "text-slate-600" : "opacity-90")}>
            {description}
          </p>
        </div>
        {badge && (
          <span className={cn(
            "text-xs font-bold px-2.5 py-1 rounded-full mt-2",
            variant === "default" ? "bg-blue-100 text-blue-700" : "bg-white/20 text-white"
          )}>
            {badge}
          </span>
        )}
      </CardContent>
    </Card>
  );
}