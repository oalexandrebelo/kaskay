import React from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BulkActions({ selectedIds = [], onComplete }) {
  const [status, setStatus] = React.useState("");
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (newStatus) => {
      await Promise.all(
        selectedIds.map(id => 
          base44.entities.Proposal.update(id, { status: newStatus })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      setStatus("");
      onComplete?.();
    },
  });

  if (selectedIds.length === 0) return null;

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg transition-all duration-300",
      selectedIds.length > 0 ? "translate-y-0" : "translate-y-full"
    )}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-slate-900">
            {selectedIds.length} proposta{selectedIds.length !== 1 ? 's' : ''} selecionada{selectedIds.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Alterar status..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="awaiting_documents">Aguardando Documentos</SelectItem>
              <SelectItem value="under_analysis">Em Análise</SelectItem>
              <SelectItem value="approved">Aprovada</SelectItem>
              <SelectItem value="rejected">Rejeitada</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={() => updateMutation.mutate(status)}
            disabled={!status || updateMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {updateMutation.isPending ? "Atualizando..." : "Aplicar"}
          </Button>
        </div>
      </div>
    </div>
  );
}