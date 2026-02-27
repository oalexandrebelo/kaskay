import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  TrendingUp, 
  AlertCircle,
  Plus,
  DollarSign,
  CheckCircle2
} from "lucide-react";

export default function CNPJManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCNPJ, setSelectedCNPJ] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().slice(0, 7));
  const queryClient = useQueryClient();

  const { data: companies = [], isLoading: companiesLoading } = useQuery({
    queryKey: ["company_credentials"],
    queryFn: () => base44.entities.CompanyCredential.list(),
  });

  const { data: repasses = [], isLoading: repassesLoading } = useQuery({
    queryKey: ["cnpj_repasses", selectedPeriod],
    queryFn: () => base44.entities.CNPJRepasse.filter({ periodo: selectedPeriod }),
  });

  const { data: proposals = [] } = useQuery({
    queryKey: ["proposals_cnpj"],
    queryFn: () => base44.entities.Proposal.list("-created_date", 1000),
  });

  const createCompanyMutation = useMutation({
    mutationFn: (data) => base44.entities.CompanyCredential.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company_credentials"] });
      setDialogOpen(false);
    },
  });

  // KPIs Gerais
  const totalProducao = companies.reduce((sum, c) => sum + (c.producao_atual_mes || 0), 0);
  const companiesActive = companies.filter(c => c.is_active).length;
  const totalLimite = companies.reduce((sum, c) => sum + (c.limite_producao_mensal || 0), 0);
  const utilizacaoMedia = totalLimite > 0 ? (totalProducao / totalLimite) * 100 : 0;

  if (companiesLoading || repassesLoading) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestão Multi-CNPJ</h1>
          <p className="text-slate-500 text-sm mt-1">
            Controle de empresas credenciadas e repasses por CNPJ
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 rounded-xl"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo CNPJ
        </Button>
      </div>

      {/* KPIs Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-100 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-blue-700 uppercase">CNPJs Ativos</p>
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-900">{companiesActive}</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 bg-emerald-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-emerald-700 uppercase">Produção Mês</p>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-900">
              R$ {(totalProducao / 1000).toFixed(0)}k
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-100 bg-purple-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-purple-700 uppercase">Utilização</p>
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-900">{utilizacaoMedia.toFixed(0)}%</p>
          </CardContent>
        </Card>

        <Card className="border-amber-100 bg-amber-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-amber-700 uppercase">Divergências</p>
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-900">
              {repasses.filter(r => r.status === "divergente").length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <Tabs defaultValue="companies" className="w-full">
          <div className="border-b px-6 pt-6">
            <TabsList className="bg-transparent border-0 p-0 h-auto">
              <TabsTrigger 
                value="companies"
                className="border-0 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3 px-4"
              >
                <Building2 className="w-4 h-4 mr-2" />
                Empresas Credenciadas
              </TabsTrigger>
              <TabsTrigger 
                value="repasses"
                className="border-0 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3 px-4"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Repasses por CNPJ
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="companies" className="m-0 p-6">
            <div className="space-y-4">
              {companies.map(company => {
                const utilizacao = company.limite_producao_mensal > 0 
                  ? (company.producao_atual_mes / company.limite_producao_mensal) * 100 
                  : 0;
                
                const proposalsCNPJ = proposals.filter(p => p.operating_cnpj === company.cnpj);

                return (
                  <div key={company.id} className="bg-slate-50 rounded-lg p-5 border border-slate-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900">{company.razao_social}</h3>
                          <Badge className={company.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}>
                            {company.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600">CNPJ: {company.cnpj}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Prioridade</p>
                        <p className="text-lg font-bold text-slate-900">{company.prioridade}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-slate-500">Produção Mês</p>
                        <p className="text-sm font-semibold text-slate-900">
                          R$ {((company.producao_atual_mes || 0) / 1000).toFixed(0)}k
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Limite Mensal</p>
                        <p className="text-sm font-semibold text-slate-900">
                          R$ {((company.limite_producao_mensal || 0) / 1000).toFixed(0)}k
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Utilização</p>
                        <p className="text-sm font-semibold text-blue-700">{utilizacao.toFixed(0)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Contratos</p>
                        <p className="text-sm font-semibold text-emerald-700">{proposalsCNPJ.length}</p>
                      </div>
                    </div>

                    {company.rubricas_averbacao?.length > 0 && (
                      <div className="bg-white rounded-md p-3 border border-slate-200">
                        <p className="text-xs font-medium text-slate-600 mb-2">Rubricas de Averbação:</p>
                        <div className="flex flex-wrap gap-2">
                          {company.rubricas_averbacao.map((rub, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {rub.codigo_rubrica} - {rub.produto_type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="repasses" className="m-0 p-6">
            <div className="mb-4">
              <Label>Período</Label>
              <Input
                type="month"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="rounded-xl max-w-xs"
              />
            </div>

            <div className="space-y-3">
              {repasses.map(repasse => (
                <div key={repasse.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{repasse.company_name}</h3>
                      <p className="text-sm text-slate-600">{repasse.cnpj}</p>
                      <p className="text-xs text-slate-500 mt-1">{repasse.convenio_name}</p>
                    </div>
                    <Badge className={
                      repasse.status === "conciliado" ? "bg-emerald-100 text-emerald-700" :
                      repasse.status === "divergente" ? "bg-red-100 text-red-700" :
                      repasse.status === "recebido" ? "bg-blue-100 text-blue-700" :
                      "bg-slate-100 text-slate-700"
                    }>
                      {repasse.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-slate-500">Esperado:</span>
                      <p className="font-semibold text-slate-900">
                        R$ {(repasse.valor_esperado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Recebido:</span>
                      <p className="font-semibold text-blue-700">
                        R$ {(repasse.valor_recebido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Divergência:</span>
                      <p className="font-semibold text-red-700">
                        R$ {Math.abs(repasse.valor_divergencia || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Contratos:</span>
                      <p className="font-semibold text-slate-900">{repasse.contratos_inclusos?.length || 0}</p>
                    </div>
                  </div>
                </div>
              ))}

              {repasses.length === 0 && (
                <p className="text-center py-8 text-slate-400">
                  Nenhum repasse encontrado para o período selecionado
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}