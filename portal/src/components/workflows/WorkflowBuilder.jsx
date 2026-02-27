import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STEP_TYPES = [
  { id: "action", label: "Ação", color: "bg-blue-100 border-blue-300" },
  { id: "condition", label: "Condição", color: "bg-yellow-100 border-yellow-300" },
  { id: "email", label: "Email", color: "bg-green-100 border-green-300" },
  { id: "notification", label: "Notificação", color: "bg-purple-100 border-purple-300" },
  { id: "update_field", label: "Atualizar Campo", color: "bg-orange-100 border-orange-300" },
];

export default function WorkflowBuilder({ workflow, onSave }) {
  const [steps, setSteps] = useState(workflow?.steps || []);
  const [selectedStep, setSelectedStep] = useState(null);
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (workflow?.id) {
        return base44.entities.Workflow.update(workflow.id, data);
      } else {
        return base44.entities.Workflow.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      onSave?.();
    },
  });

  const addStep = (type) => {
    const newStep = {
      id: `step_${Date.now()}`,
      type,
      name: `Novo ${type}`,
      position_x: 0,
      position_y: steps.length * 120,
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (stepId) => {
    setSteps(steps.filter((s) => s.id !== stepId));
    setSelectedStep(null);
  };

  const updateStep = (stepId, updates) => {
    setSteps(steps.map((s) => (s.id === stepId ? { ...s, ...updates } : s)));
  };

  const handleSave = () => {
    saveMutation.mutate({
      ...workflow,
      steps: steps,
    });
  };

  return (
    <div className="space-y-6">
      {/* Canvas */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100">
        <CardContent className="p-6">
          <div className="min-h-96 bg-white border-2 border-dashed border-slate-300 rounded-lg p-4 relative">
            {steps.length === 0 ? (
              <div className="flex items-center justify-center h-96 text-slate-400">
                <p className="text-sm">Adicione um passo para começar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {steps.map((step, idx) => {
                  const stepType = STEP_TYPES.find((t) => t.id === step.type);
                  return (
                    <div key={step.id}>
                      <div
                        onClick={() => setSelectedStep(step.id)}
                        className={cn(
                          "p-4 rounded-lg border-2 cursor-pointer transition-all",
                          stepType?.color,
                          selectedStep === step.id && "ring-2 ring-blue-500"
                        )}
                      >
                        <p className="font-medium text-sm">{step.name}</p>
                        <p className="text-xs text-slate-600 mt-1">{stepType?.label}</p>
                      </div>
                      {idx < steps.length - 1 && (
                        <div className="h-4 flex items-center justify-center">
                          <div className="h-4 border-l-2 border-slate-400" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {STEP_TYPES.map((type) => (
          <Button
            key={type.id}
            variant="outline"
            size="sm"
            onClick={() => addStep(type.id)}
          >
            <Plus className="w-4 h-4 mr-1" />
            {type.label}
          </Button>
        ))}
      </div>

      {/* Properties */}
      {selectedStep && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Propriedades do Passo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome</label>
              <input
                type="text"
                value={
                  steps.find((s) => s.id === selectedStep)?.name || ""
                }
                onChange={(e) =>
                  updateStep(selectedStep, { name: e.target.value })
                }
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removeStep(selectedStep)}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Remover
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save */}
      <Button
        onClick={handleSave}
        disabled={saveMutation.isPending}
        className="bg-blue-600 hover:bg-blue-700 w-full"
      >
        {saveMutation.isPending ? "Salvando..." : "Salvar Workflow"}
      </Button>
    </div>
  );
}