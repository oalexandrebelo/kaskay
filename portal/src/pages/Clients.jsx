import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Users } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const statusColors = {
  active: "bg-emerald-100 text-emerald-800",
  inactive: "bg-slate-100 text-slate-600",
  blocked: "bg-red-100 text-red-700",
  pending_verification: "bg-yellow-100 text-yellow-800",
};

const statusLabels = {
  active: "Ativo",
  inactive: "Inativo",
  blocked: "Bloqueado",
  pending_verification: "Pendente de Verificação",
};

export default function Clients() {
  const [search, setSearch] = useState("");

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list("-created_date", 500),
  });

  const filtered = useMemo(() => {
    if (!search) return clients;
    const s = search.toLowerCase();
    return clients.filter(c =>
      (c.full_name || "").toLowerCase().includes(s) ||
      (c.cpf || "").includes(s) ||
      (c.phone || "").includes(s)
    );
  }, [clients, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clientes</h1>
          <p className="text-slate-500 text-sm mt-1">{clients.length} clientes cadastrados</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar por nome, CPF ou telefone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 bg-white border-slate-200 rounded-xl"
        />
      </div>

      {isLoading ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">CPF</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Telefone</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Órgão</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Margem Disp.</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cadastro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-400">Nenhum cliente encontrado</p>
                  </TableCell>
                </TableRow>
              )}
              {filtered.map(c => (
                <TableRow key={c.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer">
                  <TableCell>
                    <Link to={createPageUrl("ClientDetail") + `?id=${c.id}`} className="block">
                      <p className="text-sm font-medium text-slate-900 hover:text-blue-600">{c.full_name}</p>
                      <p className="text-xs text-slate-400">{c.email || ""}</p>
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">{c.cpf}</TableCell>
                  <TableCell className="text-sm text-slate-600">{c.phone}</TableCell>
                  <TableCell className="text-sm text-slate-600">{c.employer || "—"}</TableCell>
                  <TableCell className="text-sm font-semibold text-slate-700">
                    {c.available_margin ? `R$ ${c.available_margin.toLocaleString("pt-BR")}` : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${statusColors[c.status] || "bg-slate-100 text-slate-600"} border-0 text-[10px] font-semibold`}>
                      {statusLabels[c.status] || "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-400">
                    {c.created_date ? format(new Date(c.created_date), "dd/MM/yy") : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}