import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Building2, Users, Calendar, Phone, Mail, FileText, 
  TrendingUp, AlertTriangle, CheckCircle2, ExternalLink
} from "lucide-react";

export default function ConvenioRelationship() {
  const { data: convenios = [] } = useQuery({
    queryKey: ["convenios"],
    queryFn: () => base44.entities.ConvenioConfig.list(),
  });

  const { data: proposals = [] } = useQuery({
    queryKey: ["proposals"],
    queryFn: () => base44.entities.Proposal.list(),
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["convenio_documents"],
    queryFn: () => base44.entities.ConvenioDocument.list(),
  });

  const activeConvenios = convenios.filter(c => c.is_active);
  const expiringDocuments = documents.filter(d => {
    if (!d.expiration_date) return false;
    const daysUntilExpiry = Math.floor(
      (new Date(d.expiration_date) - new Date()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Relacionamento com Convênios</h1>
        <p className="text-slate-500 text-sm mt-1">
          Acompanhe contatos, renovações e performance de cada convênio
        </p>
      </div>

      {expiringDocuments.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900">
            <strong>{expiringDocuments.length} documento(s)</strong> com vencimento nos próximos 30 dias
          </AlertDescription>
        </Alert>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Convênios Ativos</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{activeConvenios.length}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <Building2 className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Propostas Ativas</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{proposals.length}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Docs Vencendo</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{expiringDocuments.length}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Taxa de Ativação</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {convenios.length > 0 ? ((activeConvenios.length / convenios.length) * 100).toFixed(0) : 0}%
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Convênios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {convenios.map(convenio => {
          const convenioProposals = proposals.filter(p => p.convenio_id === convenio.id);
          const convenioDocuments = documents.filter(d => d.convenio_id === convenio.id);
          
          return (
            <Card key={convenio.id} className="rounded-xl border-slate-100">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{convenio.convenio_name}</CardTitle>
                      <p className="text-xs text-slate-500 mt-0.5">{convenio.employer_type}</p>
                    </div>
                  </div>
                  {convenio.is_active ? (
                    <Badge className="bg-emerald-100 text-emerald-700">Ativo</Badge>
                  ) : (
                    <Badge className="bg-slate-100 text-slate-500">Inativo</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Contato */}
                {convenio.contact_name && (
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-slate-500 mb-2">CONTATO PRINCIPAL</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span className="text-slate-700">{convenio.contact_name}</span>
                      </div>
                      {convenio.contact_phone && (
                        <div className="flex items-center gap-2 text-xs">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span className="text-slate-700">{convenio.contact_phone}</span>
                        </div>
                      )}
                      {convenio.contact_email && (
                        <div className="flex items-center gap-2 text-xs">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span className="text-slate-700">{convenio.contact_email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Métricas */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 rounded-lg p-2">
                    <p className="text-xs text-slate-500">Propostas</p>
                    <p className="text-lg font-bold text-slate-900">{convenioProposals.length}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2">
                    <p className="text-xs text-slate-500">Documentos</p>
                    <p className="text-lg font-bold text-slate-900">{convenioDocuments.length}</p>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button size="sm" variant="outline" className="flex-1 rounded-lg text-xs">
                    <FileText className="w-3 h-3 mr-1" />
                    Documentos
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 rounded-lg text-xs">
                    <Calendar className="w-3 h-3 mr-1" />
                    Agenda
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}