import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Clock } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const actionLabels = {
  status_change: "Mudança de Status",
  document_upload: "Upload Documento",
  margin_check: "Consulta Margem",
  ccb_issue: "Emissão CCB",
  signature_request: "Solicitação Assinatura",
  averbation: "Averbação",
  disbursement: "Desembolso",
  rule_triggered: "Regra Ativada",
  manual_override: "Override Manual",
};

const actionColors = {
  status_change: "bg-blue-100 text-blue-700",
  margin_check: "bg-cyan-100 text-cyan-700",
  ccb_issue: "bg-violet-100 text-violet-700",
  signature_request: "bg-amber-100 text-amber-700",
  averbation: "bg-emerald-100 text-emerald-700",
  disbursement: "bg-green-100 text-green-700",
  rule_triggered: "bg-orange-100 text-orange-700",
  manual_override: "bg-red-100 text-red-700",
};

export default function AuditLogs() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["all_audit_logs"],
    queryFn: () => base44.entities.AuditLog.list("-created_date", 500),
  });

  const filtered = useMemo(() => {
    return logs.filter(l => {
      const searchMatch = !search || (l.entity_id || "").includes(search) || (l.details || "").toLowerCase().includes(search.toLowerCase()) || (l.performed_by || "").toLowerCase().includes(search.toLowerCase());
      const actionMatch = actionFilter === "all" || l.action === actionFilter;
      return searchMatch && actionMatch;
    });
  }, [logs, search, actionFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Logs de Auditoria</h1>
        <p className="text-slate-500 text-sm mt-1">Rastreabilidade completa de todas as operações</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-white border-slate-200 rounded-xl" />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-48 bg-white border-slate-200 rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Ações</SelectItem>
            {Object.entries(actionLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Data/Hora</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ação</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Entidade</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">De → Para</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Detalhes</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Usuário</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-12"><Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" /><p className="text-slate-400">Nenhum log encontrado</p></TableCell></TableRow>
              )}
              {filtered.map(l => (
                <TableRow key={l.id} className="hover:bg-slate-50/50">
                  <TableCell className="text-xs text-slate-500">{l.created_date ? format(new Date(l.created_date), "dd/MM/yy HH:mm:ss") : "—"}</TableCell>
                  <TableCell><Badge className={`${actionColors[l.action] || "bg-slate-100 text-slate-600"} border-0 text-[10px]`}>{actionLabels[l.action] || l.action}</Badge></TableCell>
                  <TableCell className="text-xs text-slate-600">{l.entity_type} <span className="text-slate-400">#{l.entity_id?.slice(-6)}</span></TableCell>
                  <TableCell className="text-xs text-slate-600">{l.from_value && l.to_value ? `${l.from_value} → ${l.to_value}` : l.to_value || "—"}</TableCell>
                  <TableCell className="text-xs text-slate-500 max-w-[200px] truncate">{l.details || "—"}</TableCell>
                  <TableCell className="text-xs text-slate-400">{l.performed_by || l.created_by || "Sistema"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}