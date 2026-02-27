import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

export default function ContasAReceber() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: revenues = [], isLoading } = useQuery({
    queryKey: ["revenues"],
    queryFn: () => base44.entities.Revenue.list(),
  });

  const filteredRevenues = revenues.filter(rev => 
    rev.description?.toLowerCase().includes(search.toLowerCase()) ||
    rev.payer?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Contas a Receber</h1>
        <p className="text-slate-500 mt-2">Gerencie os recebimentos da empresa</p>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por cliente ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Conta
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <p className="text-slate-500">Nenhuma conta adicionada ainda</p>
      </div>
    </div>
  );
}