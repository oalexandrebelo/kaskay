import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DraggableWidget({ id, title, icon: Icon, children, isDragging }) {
  return (
    <Card className={cn(
      "rounded-2xl transition-all duration-200",
      isDragging && "opacity-50 shadow-2xl"
    )}>
      <CardHeader className="pb-3 cursor-move">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-blue-600" />}
            <span>{title}</span>
          </div>
          <GripVertical className="w-4 h-4 text-slate-400" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}