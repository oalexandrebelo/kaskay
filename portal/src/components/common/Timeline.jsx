import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Timeline({ events = [] }) {
  const getIcon = (type) => {
    switch (type) {
      case "success": return <Check className="w-4 h-4" />;
      case "pending": return <Clock className="w-4 h-4" />;
      case "error": return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getColor = (type) => {
    switch (type) {
      case "success": return "bg-green-100 text-green-700";
      case "pending": return "bg-blue-100 text-blue-700";
      case "error": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="space-y-4">
      {events.map((event, idx) => (
        <div key={idx} className="flex gap-4">
          {/* Timeline dot */}
          <div className="flex flex-col items-center">
            <div className={cn("p-2 rounded-full", getColor(event.type))}>
              {getIcon(event.type)}
            </div>
            {idx < events.length - 1 && <div className="w-0.5 h-12 bg-slate-200 my-2" />}
          </div>

          {/* Content */}
          <div className="flex-1 pt-1">
            <p className="font-medium text-slate-900">{event.title}</p>
            {event.description && (
              <p className="text-sm text-slate-600 mt-1">{event.description}</p>
            )}
            {event.author && (
              <p className="text-xs text-slate-500 mt-2">
                Por <span className="font-medium">{event.author}</span>
              </p>
            )}
            <p className="text-xs text-slate-400 mt-2">
              {format(new Date(event.date), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}