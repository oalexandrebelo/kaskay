import React from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, GripVertical, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CustomizableWidget({ widget, onRemove, onEdit, isDragging }) {
  const queryClient = useQueryClient();

  const toggleVisibilityMutation = useMutation({
    mutationFn: (isVisible) =>
      base44.entities.DashboardWidget.update(widget.id, { is_visible: isVisible }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard_widgets"] });
    },
  });

  return (
    <Card className={cn(
      "transition-all duration-200",
      isDragging && "opacity-50 shadow-lg"
    )}>
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-slate-400 cursor-grab" />
          <CardTitle className="text-base">{widget.title}</CardTitle>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit?.(widget)}
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-700"
            onClick={() => onRemove?.(widget.id)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="h-48 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg flex items-center justify-center">
          <span className="text-sm text-slate-500">Widget: {widget.widget_type}</span>
        </div>
      </CardContent>
    </Card>
  );
}