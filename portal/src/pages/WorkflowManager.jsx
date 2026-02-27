import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Power } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import WorkflowBuilder from "@/components/workflows/WorkflowBuilder";

export default function WorkflowManager() {
  const [showNew, setShowNew] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const queryClient = useQueryClient();

  const { data: workflows = [] } = useQuery({
    queryKey: ["workflows"],
    queryFn: () => base44.entities.Workflow.list(),
  });

  const deleteWorkflowMutation = useMutation({
    mutationFn: (id) => base44.entities.Workflow.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
  });

  const toggleWorkflowMutation = useMutation({
    mutationFn: (workflow) =>
      base44.entities.Workflow.update(workflow.id, {
        is_active: !workflow.is_active,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
  });

  return (
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { label: "Tecnologia", href: "#" },
          { label: "Workflows" },
        ]}
      />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Workflows Customizados</h1>
          <p className="text-slate-600 mt-2">Automação de processos visuais</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Novo Workflow
        </Button>
      </div>

      <div className="grid gap-4">
        {workflows.map((workflow) => (
          <Card key={workflow.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle>{workflow.name}</CardTitle>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        workflow.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {workflow.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  {workflow.description && (
                    <p className="text-sm text-slate-600 mt-1">{workflow.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      toggleWorkflowMutation.mutate(workflow)
                    }
                  >
                    <Power className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingWorkflow(workflow)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteWorkflowMutation.mutate(workflow.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-slate-600">Entidade</p>
                  <p className="font-medium text-slate-900">{workflow.entity_type}</p>
                </div>
                <div>
                  <p className="text-slate-600">Trigger</p>
                  <p className="font-medium text-slate-900">{workflow.trigger}</p>
                </div>
                <div>
                  <p className="text-slate-600">Passos</p>
                  <p className="font-medium text-slate-900">
                    {workflow.steps?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog de novo/edição */}
      <Dialog
        open={showNew || !!editingWorkflow}
        onOpenChange={(open) => {
          if (!open) {
            setShowNew(false);
            setEditingWorkflow(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-96 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingWorkflow ? "Editar Workflow" : "Novo Workflow"}
            </DialogTitle>
          </DialogHeader>
          <WorkflowBuilder
            workflow={editingWorkflow}
            onSave={() => {
              setShowNew(false);
              setEditingWorkflow(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}