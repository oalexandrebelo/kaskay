import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Breadcrumbs({ items = [] }) {
  if (items.length === 0) return null;

  return (
    <nav className="flex items-center gap-2 text-sm mb-6">
      <Link to={createPageUrl("Dashboard")} className="text-slate-500 hover:text-slate-700 transition-colors">
        <Home className="w-4 h-4" />
      </Link>
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight className="w-4 h-4 text-slate-300" />
          {item.href ? (
            <Link to={item.href} className="text-slate-500 hover:text-slate-700 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className={cn(
              "transition-colors",
              idx === items.length - 1 ? "text-slate-900 font-medium" : "text-slate-500"
            )}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}