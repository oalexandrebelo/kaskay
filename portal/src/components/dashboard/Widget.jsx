import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WIDGET_DEFINITIONS } from "./DashboardWidgetLibrary";
import { GripVertical, X } from "lucide-react";
import { cn } from "@/lib/utils";

const colorMap = {
  blue: "text-blue-600 bg-blue-50",
  green: "text-green-600 bg-green-50",
  red: "text-red-600 bg-red-50",
  orange: "text-orange-600 bg-orange-50",
  purple: "text-purple-600 bg-purple-50",
  indigo: "text-indigo-600 bg-indigo-50",
  cyan: "text-cyan-600 bg-cyan-50",
  emerald: "text-emerald-600 bg-emerald-50",
};

export default function Widget({
  type,
  size = "medium",
  data,
  isEditing = false,
  onRemove,
  children,
}) {
  const def = WIDGET_DEFINITIONS[type];
  if (!def) return null;

  const Icon = def.icon;
  const color = colorMap[def.color];

  const sizeClasses = {
    small: "col-span-1",
    medium: "col-span-2",
    large: "col-span-4",
  };

  return (
    <div className={cn("relative", sizeClasses)}>
      {isEditing && (
        <div className="absolute top-2 right-2 z-10 flex gap-1">
          <div className="p-1.5 bg-slate-100 rounded cursor-grab hover:bg-slate-200 active:cursor-grabbing">
            <GripVertical className="w-3 h-3 text-slate-600" />
          </div>
          <button
            onClick={onRemove}
            className="p-1.5 bg-red-100 rounded hover:bg-red-200 transition"
          >
            <X className="w-3 h-3 text-red-600" />
          </button>
        </div>
      )}

      <Card className={cn(
        "rounded-lg border-slate-200 h-full",
        isEditing && "ring-2 ring-blue-300"
      )}>
        <CardHeader className="pb-2 pt-3 px-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("p-2 rounded-lg", color)}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">{def.title}</CardTitle>
              <p className="text-xs text-slate-500">{def.description}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          {children}
        </CardContent>
      </Card>
    </div>
  );
}