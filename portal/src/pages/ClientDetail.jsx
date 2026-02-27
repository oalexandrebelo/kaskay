import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  Building2, 
  DollarSign, 
  Shield, 
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import AutoVerificationManager from "../components/client/AutoVerificationManager";

const statusColors = {
  active: "bg-emerald-100 text-emerald-800",
  inactive: "bg-slate-100 text-slate-600",
  blocked: "bg-red-100 text-red-700",
  pending_verification: "bg-yellow-100 text-yellow-800",
};

export default function ClientDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");
  const queryClient = useQueryClient();
  const [verifying, setVerifying] = useState(null);

  const { data: client, isLoading } = useQuery({
    queryKey: ["client", id],
    queryFn: () => base44.entities.Client.filter({ id }),
    enabled: !!id,
    select: data => data?.[0],
  });

  const { data: proposals = [] } = useQuery({
    queryKey: ["client_proposals", id],
    queryFn: () => base44.entities.Proposal.filter({ client_id: id }),
    enabled: !!id,
  });

  const verifyBureauMutation = useMutation({
    mutationFn: async (bureauType) => {
      setVerifying(bureauType);
      // Simulação de consulta ao bureau
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockData = {
        ph3a: {
          status: "verified",
          score: 750,
          name_match: true,
          cpf_match: true,
          phone_match: true,
          address_match: true,
          risk_level: "low",
        },
        nova_vida: {
          status: "verified",
          has_restrictions: false,
          credit_score: 680,
          active_debts: 0,
        },
      };
      
      return mockData[bureauType];
    },
    onSuccess: () => {
      setVerifying(null);
    },
  });

  const verifyTransparenciaMutation = useMutation({
    mutationFn: async () => {
      setVerifying("transparencia");
      // Simulação de consulta ao portal da transparência
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      return {
        registration_found: true,
        registration_number: client?.registration_number,
        employer_confirmed: client?.employer,
        gross_salary: client?.gross_salary,
        position: "Analista de Sistemas",
        active_since: "2020-03-15",
        status: "Ativo",
      };
    },
    onSuccess: () => {
      setVerifying(null);
    },
  });

  const verifyMarginMutation = useMutation({
    mutationFn: async () => {
      setVerifying("margin");
      // Simulação de consulta à gestora de margem
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        available_margin: client?.available_margin,
        total_margin: client?.gross_salary * 0.35,
        used_margin: (client?.gross_salary * 0.35) - (client?.available_margin || 0),
        active_loans: 2,
        employer_confirmed: client?.employer,
        last_update: new Date().toISOString(),
      };
    },
    onSuccess: () => {
      setVerifying(null);
    },
  });

  if (isLoading) return (
    <div className="space-y-4">
      {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
    </div>
  );

  if (!client) return (
    <div className="text-center py-20 text-slate-400">Cliente não encontrado</div>
  );

  const totalSolicited = proposals.reduce((sum, p) => sum + (p.requested_amount || 0), 0);
  const activeProposals = proposals.filter(p => !["rejected", "cancelled", "disbursed"].includes(p.status));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl("Clients")}>
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{client.full_name}</h1>
          <p className="text-sm text-slate-500 mt-1">{client.cpf}</p>
        </div>
        <Badge className={`${statusColors[client.status]} border-0 text-xs font-semibold`}>
          {client.status?.replace(/_/g, " ")}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dados Cadastrais */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl border-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" /> Dados Cadastrais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Nome Completo</span>
                  <p className="font-medium text-slate-900">{client.full_name}</p>
                </div>
                <div>
                  <span className="text-slate-400">CPF</span>
                  <p className="font-medium text-slate-900">{client.cpf}</p>
                </div>
                <div>
                  <span className="text-slate-400 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Telefone
                  </span>
                  <p className="font-medium text-slate-900">{client.phone}</p>
                </div>
                <div>
                  <span className="text-slate-400 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> E-mail
                  </span>
                  <p className="font-medium text-slate-900">{client.email || "—"}</p>
                </div>
                <div>
                  <span className="text-slate-400">Data de Nascimento</span>
                  <p className="font-medium text-slate-900">
                    {client.birth_date ? format(new Date(client.birth_date), "dd/MM/yyyy") : "—"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Cadastro</span>
                  <p className="font-medium text-slate-900">
                    {client.created_date ? format(new Date(client.created_date), "dd/MM/yyyy") : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4 text-violet-600" /> Dados de Emprego
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Órgão Empregador</span>
                  <p className="font-medium text-slate-900">{client.employer || "—"}</p>
                </div>
                <div>
                  <span className="text-slate-400">Tipo de Órgão</span>
                  <p className="font-medium text-slate-900 capitalize">{client.employer_type?.replace(/_/g, " ") || "—"}</p>
                </div>
                <div>
                  <span className="text-slate-400">Matrícula Funcional</span>
                  <p className="font-medium text-slate-900">{client.registration_number || "—"}</p>
                </div>
                <div>
                  <span className="text-slate-400">Salário Bruto</span>
                  <p className="font-medium text-slate-900">
                    {client.gross_salary ? `R$ ${client.gross_salary.toLocaleString("pt-BR")}` : "—"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Salário Líquido</span>
                  <p className="font-medium text-slate-900">
                    {client.net_salary ? `R$ ${client.net_salary.toLocaleString("pt-BR")}` : "—"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Margem Disponível</span>
                  <p className="font-semibold text-emerald-600">
                    {client.available_margin ? `R$ ${client.available_margin.toLocaleString("pt-BR")}` : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Verificações de Dados */}
          <Card className="rounded-2xl border-blue-100 bg-blue-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" /> Verificação de Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-600 mb-4">
                Confronte os dados cadastrais com bureaus externos e portal da transparência
              </p>

              {/* Ph3A Bureau */}
              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Bureau Ph3A</p>
                    <p className="text-xs text-slate-500">Validação de identidade e score</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg"
                    onClick={() => verifyBureauMutation.mutate("ph3a")}
                    disabled={verifying === "ph3a"}
                  >
                    {verifying === "ph3a" ? (
                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    ) : (
                      <Search className="w-3 h-3 mr-2" />
                    )}
                    Consultar
                  </Button>
                </div>
                {verifyBureauMutation.data && verifyBureauMutation.variables === "ph3a" && (
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Nome:</span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span className="font-medium text-emerald-700">Confirmado</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">CPF:</span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span className="font-medium text-emerald-700">Confirmado</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Telefone:</span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span className="font-medium text-emerald-700">Confirmado</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Score:</span>
                      <span className="font-semibold text-blue-700">{verifyBureauMutation.data.score}</span>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs mt-2">
                      Risco: {verifyBureauMutation.data.risk_level}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Nova Vida Bureau */}
              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Bureau Nova Vida</p>
                    <p className="text-xs text-slate-500">Restrições e score de crédito</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg"
                    onClick={() => verifyBureauMutation.mutate("nova_vida")}
                    disabled={verifying === "nova_vida"}
                  >
                    {verifying === "nova_vida" ? (
                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    ) : (
                      <Search className="w-3 h-3 mr-2" />
                    )}
                    Consultar
                  </Button>
                </div>
                {verifyBureauMutation.data && verifyBureauMutation.variables === "nova_vida" && (
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Restrições:</span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span className="font-medium text-emerald-700">Sem restrições</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Score de Crédito:</span>
                      <span className="font-semibold text-blue-700">{verifyBureauMutation.data.credit_score}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Dívidas Ativas:</span>
                      <span className="font-medium text-slate-700">{verifyBureauMutation.data.active_debts}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Portal da Transparência */}
              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Portal da Transparência</p>
                    <p className="text-xs text-slate-500">Validação de matrícula e salário</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg"
                    onClick={() => verifyTransparenciaMutation.mutate()}
                    disabled={verifying === "transparencia"}
                  >
                    {verifying === "transparencia" ? (
                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    ) : (
                      <ExternalLink className="w-3 h-3 mr-2" />
                    )}
                    Consultar
                  </Button>
                </div>
                {verifyTransparenciaMutation.data && (
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Matrícula:</span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span className="font-medium text-emerald-700">{verifyTransparenciaMutation.data.registration_number}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Órgão:</span>
                      <span className="font-medium text-slate-700">{verifyTransparenciaMutation.data.employer_confirmed}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Salário Bruto:</span>
                      <span className="font-semibold text-blue-700">
                        R$ {verifyTransparenciaMutation.data.gross_salary?.toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Cargo:</span>
                      <span className="font-medium text-slate-700">{verifyTransparenciaMutation.data.position}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Status:</span>
                      <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">
                        {verifyTransparenciaMutation.data.status}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              {/* Gestora de Margem */}
              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Gestora de Margem</p>
                    <p className="text-xs text-slate-500">Validação de margem disponível</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg"
                    onClick={() => verifyMarginMutation.mutate()}
                    disabled={verifying === "margin"}
                  >
                    {verifying === "margin" ? (
                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3 mr-2" />
                    )}
                    Consultar
                  </Button>
                </div>
                {verifyMarginMutation.data && (
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Margem Total (35%):</span>
                      <span className="font-semibold text-slate-700">
                        R$ {verifyMarginMutation.data.total_margin?.toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Margem Utilizada:</span>
                      <span className="font-medium text-red-600">
                        R$ {verifyMarginMutation.data.used_margin?.toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Margem Disponível:</span>
                      <span className="font-semibold text-emerald-600">
                        R$ {verifyMarginMutation.data.available_margin?.toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Contratos Ativos:</span>
                      <span className="font-medium text-slate-700">{verifyMarginMutation.data.active_loans}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <AutoVerificationManager clientId={id} />

          <Card className="rounded-2xl border-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" /> Resumo Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-xs text-slate-500">Total Solicitado</span>
                <p className="text-lg font-bold text-slate-900">
                  R$ {totalSolicited.toLocaleString("pt-BR")}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Propostas Ativas</span>
                <p className="text-lg font-bold text-blue-600">{activeProposals.length}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Total de Propostas</span>
                <p className="text-lg font-bold text-slate-700">{proposals.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Propostas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {proposals.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">Nenhuma proposta</p>
              ) : (
                <div className="space-y-2">
                  {proposals.slice(0, 5).map(p => (
                    <Link
                      key={p.id}
                      to={createPageUrl("ProposalDetail") + `?id=${p.id}`}
                      className="block bg-slate-50 rounded-lg p-3 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-900">
                          {p.proposal_number || `#${p.id?.slice(-6)}`}
                        </span>
                        <Badge className="text-[10px] border-0 bg-slate-200 text-slate-700">
                          {p.status?.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">
                        R$ {(p.requested_amount || 0).toLocaleString("pt-BR")}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}