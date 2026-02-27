import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PRESET_LAYOUTS, WIDGET_DEFINITIONS } from "./DashboardWidgetLibrary";
import { Check } from "lucide-react";

export default function LayoutSelector({ isOpen, onClose, onSelect, currentLayout }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Escolher Layout Pré-definido</DialogTitle>
          <DialogDescription>
            Selecione um layout pronto ou customize seu painel
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {PRESET_LAYOUTS.map(layout => {
            const widgetCount = layout.widgets.length;
            const isSelected = currentLayout?.layout_name === layout.name;

            return (
              <button
                key={layout.name}
                onClick={() => onSelect(layout)}
                className={`p-4 rounded-lg border-2 transition text-left ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-slate-900">{layout.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{layout.description}</p>
                  </div>
                  {isSelected && <Check className="w-5 h-5 text-blue-600" />}
                </div>

                <div className="flex flex-wrap gap-1 mt-3">
                  {layout.widgets.slice(0, 3).map((w, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {WIDGET_DEFINITIONS[w.type]?.title}
                    </Badge>
                  ))}
                  {widgetCount > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{widgetCount - 3}
                    </Badge>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-2 justify-end border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          {currentLayout && (
            <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700">
              Aplicar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}