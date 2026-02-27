import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ProposalFilters from "@/components/proposals/ProposalFilters";
import ProposalTable from "@/components/proposals/ProposalTable";
import { Skeleton } from "@/components/ui/skeleton";

export default function Proposals() {
  const [filters, setFilters] = useState({ search: "", status: "all", channel: "all" });

  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ["proposals"],
    queryFn: () => base44.entities.Proposal.list("-created_date", 500),
  });

  const filtered = useMemo(() => {
    return proposals.filter(p => {
      const searchMatch = !filters.search ||
        (p.client_name || "").toLowerCase().includes(filters.search.toLowerCase()) ||
        (p.client_cpf || "").includes(filters.search) ||
        (p.proposal_number || "").toLowerCase().includes(filters.search.toLowerCase());
      const statusMatch = filters.status === "all" || p.status === filters.status;
      const channelMatch = filters.channel === "all" || p.channel === filters.channel;
      return searchMatch && statusMatch && channelMatch;
    });
  }, [proposals, filters]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Propostas</h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie todas as propostas de crédito</p>
        </div>
        <Link to={createPageUrl("NewProposal")}>
          <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Nova Proposta
          </Button>
        </Link>
      </div>

      <ProposalFilters filters={filters} onFilterChange={setFilters} />

      {isLoading ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : (
        <ProposalTable proposals={filtered} />
      )}
    </div>
  );
}