import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, DollarSign, Calendar, TrendingUp, Send, Loader2, CheckCircle2 } from "lucide-react";
import { format, addDays } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function FIDCManagement() {
  const queryClient = useQueryClient();
  const [selectedProposals, setSelectedProposals] = useState([]);
  const [fidcName, setFidcName] = useState("");
  const [discountRate, setDiscountRate] = useState("2.5");

  const { data: proposals = [], isLoading: loadingProposals } = useQuery({
    queryKey: ["proposals_disbursed"],
    queryFn: () => base44.entities.Proposal.filter({ status: "disbursed" }),
  });

  const { data: cessions = [], isLoading: loadingCessions } = useQuery({
    queryKey: ["contract_cessions"],
    queryFn: () => base44.entities.ContractCession.list("-created_date", 500),
  });

  const eligibleProposals = proposals.filter(p => {
    const alreadyCeded = cessions.some(c => c.proposal_id === p.id && c.status !== "cancelled");
    return !alreadyCeded;
  });

  const createCessionBatchMutation = useMutation({
    mutationFn: async () => {
      const batchId = `BATCH-${Date.now().toString(36).toUpperCase()}`;
      const discount = parseFloat(discountRate) / 100;
      
      const cessionsData = selectedProposals.map(propId => {
        const prop = proposals.find(p => p.id === propId);
        const contractValue = prop.approved_amount || prop.requested_amount;
        const cessionValue = contractValue * (1 - discount);
        
        return {
          proposal_id: prop.id,
          ccb_number: prop.ccb_number,
          client_name: prop.client_name,
          client_cpf: prop.client_cpf,
          contract_value: contractValue,
          outstanding_balance: contractValue,
          cession_date: format(addDays(new Date(prop.disbursement_date), 1), "yyyy-MM-dd"),
          disbursement_date: prop.disbursement_date,
          fidc_name: fidcName,
          cession_value: cessionValue,
          discount_rate: parseFloat(discountRate),
          status: "ceded_d1",
          batch_id: batchId,
        };
      });

      await base44.entities.ContractCession.bulkCreate(cessionsData);
      return batchId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract_cessions"] });
      setSelectedProposals([]);
      setFidcName("");
    },
  });

  const toggleSelection = (propId) => {
    setSelectedProposals(prev =>
      prev.includes(propId) ? prev.filter(id => id !== propId) : [...prev, propId]
    );
  };

  const selectAll = () => {
    if (selectedProposals.length === eligibleProposals.length) {
      setSelectedProposals([]);
    } else {
      setSelectedProposals(eligibleProposals.map(p => p.id));
    }
  };

  const totalContractValue = selectedProposals.reduce((sum, propId) => {
    const prop = proposals.find(p => p.id === propId);
    return sum + (prop?.approved_amount || prop?.requested_amount || 0);
  }, 0);

  const totalCessionValue = totalContractValue * (1 - parseFloat(discountRate) / 100);

  const cessionsByBatch = useMemo(() => {
    const batches = {};
    cessions.forEach(c => {
      if (!batches[c.batch_id]) {
        batches[c.batch_id] = [];
      }
      batches[c.batch_id].push(c);
    });
    return batches;
  }, [cessions]);

  const isLoading = loadingProposals || loadingCessions;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestão FIDC</h1>
        <p className="text-slate-500 text-sm mt-1">Cessão de contratos em D+1 para fundos</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="rounded-2xl border-slate-100">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Contratos Elegíveis</p>
                  <p className="text-2xl font-bold text-slate-900">{eligibleProposals.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-100">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Cessões Realizadas</p>
                  <p className="text-2xl font-bold text-slate-900">{cessions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-100">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-violet-50">
                  <DollarSign className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Volume Cedido</p>
                  <p className="text-2xl font-bold text-slate-900">
                    R$ {(cessions.reduce((s, c) => s + (c.cession_value || 0), 0) / 1000).toFixed(0)}k
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Nova Cessão */}
      <Card className="rounded-2xl border-slate-100">
        <CardHeader>
          <CardTitle className="text-base">Criar Lote de Cessão (D+1)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Nome do FIDC</Label>
              <Input
                placeholder="Ex: FIDC Credz I"
                value={fidcName}
                onChange={e => setFidcName(e.target.value)}
                className="rounded-xl mt-1"
              />
            </div>
            <div>
              <Label>Taxa de Desconto (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={discountRate}
                onChange={e => setDiscountRate(e.target.value)}
                className="rounded-xl mt-1"
              />
            </div>
            <div>
              <Label>Resumo</Label>
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 mt-1">
                <p className="text-xs text-blue-600">
                  {selectedProposals.length} contratos selecionados
                </p>
                <p className="text-sm font-bold text-blue-700">
                  R$ {totalCessionValue.toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              className="bg-violet-600 hover:bg-violet-700 rounded-xl"
              onClick={() => createCessionBatchMutation.mutate()}
              disabled={selectedProposals.length === 0 || !fidcName || createCessionBatchMutation.isPending}
            >
              {createCessionBatchMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Ceder Contratos Selecionados
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contratos Elegíveis */}
      {isLoading ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Contratos Elegíveis para Cessão</h3>
            <Button variant="outline" size="sm" onClick={selectAll} className="rounded-lg text-xs">
              {selectedProposals.length === eligibleProposals.length ? "Desmarcar" : "Selecionar"} Todos
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="w-12"></TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase">Proposta</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase">Cliente</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase">CCB</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase">Valor Contrato</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase">Desembolso</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase">Valor Cessão</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eligibleProposals.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                    Nenhum contrato elegível para cessão
                  </TableCell>
                </TableRow>
              )}
              {eligibleProposals.map(prop => {
                const contractValue = prop.approved_amount || prop.requested_amount;
                const cessionValue = contractValue * (1 - parseFloat(discountRate) / 100);
                return (
                  <TableRow key={prop.id} className="hover:bg-slate-50/50">
                    <TableCell>
                      <Checkbox
                        checked={selectedProposals.includes(prop.id)}
                        onCheckedChange={() => toggleSelection(prop.id)}
                      />
                    </TableCell>
                    <TableCell className="text-sm font-medium text-blue-600">
                      {prop.proposal_number || `#${prop.id?.slice(-6)}`}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{prop.client_name}</p>
                        <p className="text-xs text-slate-400">{prop.client_cpf}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{prop.ccb_number || "—"}</TableCell>
                    <TableCell className="text-sm font-semibold text-slate-700">
                      R$ {contractValue.toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {prop.disbursement_date ? format(new Date(prop.disbursement_date), "dd/MM/yy") : "—"}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-violet-700">
                      R$ {cessionValue.toLocaleString("pt-BR")}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Histórico de Cessões */}
      {Object.keys(cessionsByBatch).length > 0 && (
        <Card className="rounded-2xl border-slate-100">
          <CardHeader>
            <CardTitle className="text-base">Histórico de Lotes Cedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(cessionsByBatch).map(([batchId, batchCessions]) => {
                const totalValue = batchCessions.reduce((s, c) => s + (c.cession_value || 0), 0);
                const firstCession = batchCessions[0];
                return (
                  <div key={batchId} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{batchId}</p>
                        <p className="text-xs text-slate-500">
                          {firstCession?.fidc_name} · {batchCessions.length} contratos
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-violet-700">R$ {totalValue.toLocaleString("pt-BR")}</p>
                        <p className="text-xs text-slate-400">
                          {firstCession?.cession_date ? format(new Date(firstCession.cession_date), "dd/MM/yy") : ""}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">
                      {firstCession?.status?.replace(/_/g, " ")}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}