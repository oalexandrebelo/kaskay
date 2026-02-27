import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, FileText, Shield, Users, DollarSign, AlertTriangle, TrendingUp, Package, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const reportTypes = {
  proposals: {
    label: "Relatório de Propostas",
    icon: FileText,
    color: "text-blue-600",
    roles: ["admin", "manager", "analyst"],
    description: "Todas as propostas com status, valores e datas",
  },
  clients: {
    label: "Relatório de Clientes",
    icon: Users,
    color: "text-purple-600",
    roles: ["admin", "manager"],
    description: "Base de clientes com dados cadastrais (LGPD: dados sensíveis)",
  },
  financial: {
    label: "Relatório Financeiro",
    icon: DollarSign,
    color: "text-emerald-600",
    roles: ["admin", "manager"],
    description: "Volume desembolsado, em aberto, e margem",
  },
  collections: {
    label: "Relatório de Cobranças",
    icon: AlertTriangle,
    color: "text-orange-600",
    roles: ["admin", "manager", "collection_agent"],
    description: "Inadimplência, atrasos e ações de cobrança",
  },
  commissions: {
    label: "Relatório de Comissões",
    icon: TrendingUp,
    color: "text-violet-600",
    roles: ["admin", "manager"],
    description: "Comissões geradas, pagas e pendentes",
  },
  fidc: {
    label: "Relatório FIDC",
    icon: Package,
    color: "text-indigo-600",
    roles: ["admin", "manager"],
    description: "Cessões realizadas e contratos cedidos",
  },
  audit: {
    label: "Log de Auditoria",
    icon: Shield,
    color: "text-red-600",
    roles: ["admin"],
    description: "Histórico completo de ações (LGPD compliance)",
  },
};

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState("");
  const [exporting, setExporting] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ["current_user"],
    queryFn: () => base44.auth.me(),
  });

  const { data: proposals = [] } = useQuery({
    queryKey: ["proposals"],
    queryFn: () => base44.entities.Proposal.list("-created_date", 1000),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list("-created_date", 1000),
  });

  const { data: issues = [] } = useQuery({
    queryKey: ["payment_issues"],
    queryFn: () => base44.entities.PaymentIssue.list("-created_date", 1000),
  });

  const { data: commissions = [] } = useQuery({
    queryKey: ["commissions"],
    queryFn: () => base44.entities.Commission.list("-created_date", 1000),
  });

  const { data: cessions = [] } = useQuery({
    queryKey: ["contract_cessions"],
    queryFn: () => base44.entities.ContractCession.list("-created_date", 1000),
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ["audit_logs"],
    queryFn: () => base44.entities.AuditLog.list("-created_date", 1000),
  });

  const hasAccess = (reportKey) => {
    const report = reportTypes[reportKey];
    return report.roles.includes(currentUser?.role);
  };

  const exportReport = async () => {
    if (!selectedReport) return;
    
    setExporting(true);
    
    // Registrar acesso a dados (LGPD)
    await base44.entities.AuditLog.create({
      entity_type: "Report",
      entity_id: selectedReport,
      action: "data_export",
      details: `Exportação de ${reportTypes[selectedReport].label}`,
      performed_by: currentUser?.email,
      user_role: currentUser?.role,
      sensitive_data_accessed: ["clients", "audit"].includes(selectedReport),
    });

    // Selecionar dados para exportação
    let data = [];
    let headers = [];
    
    switch (selectedReport) {
      case "proposals":
        data = proposals.map(p => ({
          "Número": p.proposal_number,
          "Cliente": p.client_name,
          "CPF": p.client_cpf,
          "Valor": p.requested_amount,
          "Status": p.status,
          "Data": p.created_date,
        }));
        break;
      case "clients":
        data = clients.map(c => ({
          "Nome": c.full_name,
          "CPF": c.cpf,
          "Telefone": c.phone,
          "Email": c.email,
          "Órgão": c.employer,
          "Margem": c.available_margin,
        }));
        break;
      case "financial":
        const totalDisbursed = proposals.filter(p => p.status === "disbursed").reduce((s, p) => s + (p.approved_amount || 0), 0);
        data = [{
          "Volume Solicitado": proposals.reduce((s, p) => s + (p.requested_amount || 0), 0),
          "Volume Desembolsado": totalDisbursed,
          "Propostas Ativas": proposals.filter(p => !["rejected", "cancelled", "disbursed"].includes(p.status)).length,
        }];
        break;
      case "collections":
        data = issues.map(i => ({
          "Cliente": i.client_name,
          "Órgão": i.employer,
          "Tipo": i.issue_type,
          "Valor": i.outstanding_amount,
          "Dias Atraso": i.days_overdue,
          "Status": i.status,
        }));
        break;
      case "commissions":
        data = commissions.map(c => ({
          "Usuário": c.user_email,
          "Tipo": c.commission_type,
          "Base": c.base_amount,
          "Taxa": c.commission_rate,
          "Comissão": c.commission_amount,
          "Status": c.status,
        }));
        break;
      case "fidc":
        data = cessions.map(c => ({
          "Lote": c.batch_id,
          "FIDC": c.fidc_name,
          "Cliente": c.client_name,
          "Valor Contrato": c.contract_value,
          "Valor Cessão": c.cession_value,
          "Data": c.cession_date,
        }));
        break;
      case "audit":
        data = auditLogs.map(a => ({
          "Data": a.created_date,
          "Usuário": a.performed_by,
          "Role": a.user_role,
          "Entidade": a.entity_type,
          "Ação": a.action,
          "Detalhes": a.details,
          "Dados Sensíveis": a.sensitive_data_accessed ? "Sim" : "Não",
        }));
        break;
    }

    // Converter para CSV
    if (data.length > 0) {
      headers = Object.keys(data[0]);
      const csv = [
        headers.join(","),
        ...data.map(row => headers.map(h => JSON.stringify(row[h] || "")).join(","))
      ].join("\n");

      // Download
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${selectedReport}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    }

    setTimeout(() => setExporting(false), 1000);
  };

  if (!currentUser) {
    return <Skeleton className="h-96 rounded-2xl" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Relatórios e Exportações</h1>
        <p className="text-slate-500 text-sm mt-1">Gere relatórios respeitando hierarquia de acesso (LGPD compliance)</p>
      </div>

      <Alert className="border-blue-200 bg-blue-50">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900 text-sm">
          <strong>LGPD:</strong> Todos os acessos e exportações são registrados no log de auditoria. 
          Apenas usuários autorizados podem exportar dados sensíveis.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(reportTypes).map(([key, report]) => {
          const Icon = report.icon;
          const hasUserAccess = hasAccess(key);
          
          return (
            <Card 
              key={key} 
              className={`rounded-2xl border-slate-100 ${hasUserAccess ? "cursor-pointer hover:border-blue-200 hover:shadow-md transition-all" : "opacity-50"}`}
              onClick={() => hasUserAccess && setSelectedReport(key)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-50">
                    <Icon className={`w-5 h-5 ${report.color}`} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-sm">{report.label}</CardTitle>
                    {!hasUserAccess && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <Shield className="w-3 h-3" /> Sem permissão
                      </p>
                    )}
                  </div>
                  {selectedReport === key && (
                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500">{report.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedReport && (
        <Card className="rounded-2xl border-blue-100 bg-blue-50/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900 mb-1">
                  Relatório Selecionado: {reportTypes[selectedReport].label}
                </p>
                <p className="text-xs text-slate-600">{reportTypes[selectedReport].description}</p>
              </div>
              <Button
                className="bg-blue-600 hover:bg-blue-700 rounded-xl"
                onClick={exportReport}
                disabled={exporting}
              >
                {exporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Exportar CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl border-slate-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Permissões por Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="font-semibold text-slate-700">Administrador</span>
              <span className="text-slate-500">Acesso total a todos os relatórios</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="font-semibold text-slate-700">Gerente</span>
              <span className="text-slate-500">Propostas, clientes, financeiro, cobranças, comissões, FIDC</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="font-semibold text-slate-700">Analista</span>
              <span className="text-slate-500">Propostas apenas</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="font-semibold text-slate-700">Cobrança</span>
              <span className="text-slate-500">Cobranças apenas</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}