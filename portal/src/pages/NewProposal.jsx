import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function NewProposal() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    client_name: "",
    client_cpf: "",
    product_type: "adiantamento_salarial",
    requested_amount: "",
    channel: "web",
    scd_partner: "",
    margin_manager: "",
    notes: "",
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      // Gerar número único de proposta
      const { data: proposalNumberData } = await base44.functions.invoke('generateProposalNumber', {});
      const proposalNumber = proposalNumberData.proposal_number;
      
      const proposal = await base44.entities.Proposal.create({
        ...form,
        requested_amount: parseFloat(form.requested_amount) || 0,
        installments: 1,
        proposal_number: proposalNumber,
        status: "draft",
      });
      await base44.entities.AuditLog.create({
        entity_type: "Proposal",
        entity_id: proposal.id,
        action: "status_change",
        to_value: "draft",
        details: "Proposta criada manualmente",
      });
      return proposal;
    },
    onSuccess: (data) => {
      navigate(createPageUrl("ProposalDetail") + `?id=${data.id}`);
    },
  });

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl("Proposals")}>
          <Button variant="ghost" size="icon" className="rounded-xl"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nova Proposta</h1>
          <p className="text-sm text-slate-500 mt-1">Criar proposta de crédito manualmente</p>
        </div>
      </div>

      <Card className="rounded-2xl border-slate-100">
        <CardHeader><CardTitle className="text-base">Dados do Cliente</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Nome Completo</Label><Input value={form.client_name} onChange={e => update("client_name", e.target.value)} className="rounded-xl mt-1" /></div>
            <div><Label>CPF</Label><Input value={form.client_cpf} onChange={e => update("client_cpf", e.target.value)} className="rounded-xl mt-1" placeholder="000.000.000-00" /></div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-slate-100">
        <CardHeader><CardTitle className="text-base">Dados da Proposta</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <p className="text-sm font-semibold text-blue-900 mb-1">✓ Produto: Adiantamento Salarial</p>
              <p className="text-xs text-blue-700">Parcela única, descontada automaticamente na folha de pagamento</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Canal</Label>
                <Select value={form.channel} onValueChange={v => update("channel", v)}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="web">Web</SelectItem>
                    <SelectItem value="presencial">Presencial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Valor Solicitado (R$)</Label><Input type="number" value={form.requested_amount} onChange={e => update("requested_amount", e.target.value)} className="rounded-xl mt-1" placeholder="Parcela única" /></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-slate-100">
        <CardHeader><CardTitle className="text-base">Integrações</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>SCD Parceira</Label><Input value={form.scd_partner} onChange={e => update("scd_partner", e.target.value)} className="rounded-xl mt-1" placeholder="Ex: QI Tech" /></div>
            <div><Label>Gestora de Margem</Label><Input value={form.margin_manager} onChange={e => update("margin_manager", e.target.value)} className="rounded-xl mt-1" placeholder="Ex: Zetra" /></div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Link to={createPageUrl("Proposals")}><Button variant="outline" className="rounded-xl">Cancelar</Button></Link>
        <Button
          className="bg-blue-600 hover:bg-blue-700 rounded-xl"
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending || !form.client_name || !form.client_cpf || !form.requested_amount}
        >
          {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
          Criar Proposta
        </Button>
      </div>
    </div>
  );
}