import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

const statusOptions = [
  { value: "all", label: "Todos os Status" },
  { value: "draft", label: "Rascunho" },
  { value: "awaiting_documents", label: "Aguard. Docs" },
  { value: "under_analysis", label: "Em Análise" },
  { value: "margin_check", label: "Consulta Margem" },
  { value: "margin_approved", label: "Margem Aprovada" },
  { value: "ccb_issued", label: "CCB Emitida" },
  { value: "signature_pending", label: "Aguard. Assinatura" },
  { value: "signature_completed", label: "Assinado" },
  { value: "averbated", label: "Averbado" },
  { value: "disbursed", label: "Desembolsado" },
  { value: "rejected", label: "Rejeitado" },
  { value: "cancelled", label: "Cancelado" },
];

const channelOptions = [
  { value: "all", label: "Todos os Canais" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "web", label: "Web" },
  { value: "presencial", label: "Presencial" },
];

export default function ProposalFilters({ filters, onFilterChange }) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar por nome ou CPF..."
          value={filters.search}
          onChange={e => onFilterChange({ ...filters, search: e.target.value })}
          className="pl-9 bg-white border-slate-200 rounded-xl"
        />
      </div>
      <Select value={filters.status} onValueChange={v => onFilterChange({ ...filters, status: v })}>
        <SelectTrigger className="w-44 bg-white border-slate-200 rounded-xl">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.channel} onValueChange={v => onFilterChange({ ...filters, channel: v })}>
        <SelectTrigger className="w-40 bg-white border-slate-200 rounded-xl">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {channelOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}