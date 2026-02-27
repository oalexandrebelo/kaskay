import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Building2, CheckCircle2, AlertTriangle, Clock, FileText,
  Shield, Award, Calendar, XCircle
} from "lucide-react";

export default function ConvenioDiligence() {
  const { data: convenios = [] } = useQuery({
    queryKey: ["convenios"],
    queryFn: () => base44.entities.ConvenioConfig.list(),
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["convenio_documents"],
    queryFn: () => base44.entities.ConvenioDocument.list(),
  });

  // Calcular status de diligência para cada convênio
  const getDiligenceStatus = (convenio) => {
    const checks = {
      decreto_valido: convenio.decree_number && (!convenio.decree_expiration || new Date(convenio.decree_expiration) > new Date()),
      credenciamento_valido: convenio.accreditation_term_number && (!convenio.accreditation_expiration || new Date(convenio.accreditation_expiration) > new Date()),
      margem_definida: !!convenio.margin_manager,
      contato_ativo: !!(convenio.contact_name && convenio.contact_phone),
      is_active: convenio.is_active,
    };

    const total = Object.keys(checks).length;
    const completed = Object.values(checks).filter(Boolean).length;
    const percentage = (completed / total) * 100;

    return {
      checks,
      completed,
      total,
      percentage,
      status: percentage === 100 ? "completo" : percentage >= 60 ? "parcial" : "pendente"
    };
  };

  const conveniosWithDiligence = convenios.map(c => ({
    ...c,
    diligence: getDiligenceStatus(c)
  }));

  // KPIs
  const completeDiligence = conveniosWithDiligence.filter(c => c.diligence.status === "completo").length;
  const partialDiligence = conveniosWithDiligence.filter(c => c.diligence.status === "parcial").length;
  const pendingDiligence = conveniosWithDiligence.filter(c => c.diligence.status === "pendente").length;

  const statusColors = {
    completo: "bg-emerald-100 text-emerald-700",
    parcial: "bg-amber-100 text-amber-700",
    pendente: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Diligência de Convênios</h1>
        <p className="text-slate-500 text-sm mt-1">
          Verificação jurídica de documentação, credenciamento e conformidade legal
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Convênios</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{convenios.length}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Diligência Completa</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{completeDiligence}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Diligência Parcial</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{partialDiligence}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pendente</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{pendingDiligence}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Convênios */}
      <Card className="rounded-xl border-slate-100">
        <CardHeader>
          <CardTitle className="text-sm">Status de Diligência por Convênio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {conveniosWithDiligence.map(convenio => (
              <div key={convenio.id} className="border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                      <Building2 className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-900">{convenio.convenio_name}</p>
                      <p className="text-xs text-slate-500">{convenio.employer_type}</p>
                    </div>
                  </div>
                  <Badge className={statusColors[convenio.diligence.status]}>
                    {convenio.diligence.status}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Progresso da Diligência</span>
                    <span className="font-semibold text-slate-700">
                      {convenio.diligence.completed}/{convenio.diligence.total} itens
                    </span>
                  </div>
                  <Progress value={convenio.diligence.percentage} className="h-2" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    {convenio.diligence.checks.decreto_valido ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className={convenio.diligence.checks.decreto_valido ? "text-emerald-700" : "text-red-700"}>
                      Decreto
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {convenio.diligence.checks.credenciamento_valido ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className={convenio.diligence.checks.credenciamento_valido ? "text-emerald-700" : "text-red-700"}>
                      Credenciamento
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {convenio.diligence.checks.margem_definida ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className={convenio.diligence.checks.margem_definida ? "text-emerald-700" : "text-red-700"}>
                      Margem
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {convenio.diligence.checks.contato_ativo ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className={convenio.diligence.checks.contato_ativo ? "text-emerald-700" : "text-red-700"}>
                      Contato
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {convenio.diligence.checks.is_active ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className={convenio.diligence.checks.is_active ? "text-emerald-700" : "text-red-700"}>
                      Ativo
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <Button size="sm" variant="outline" className="flex-1 rounded-lg text-xs">
                    <FileText className="w-3 h-3 mr-1" />
                    Ver Documentos
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 rounded-lg text-xs">
                    <Shield className="w-3 h-3 mr-1" />
                    Atualizar Status
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}