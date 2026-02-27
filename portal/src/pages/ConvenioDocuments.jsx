import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  FileText, Building2, Calendar, AlertTriangle, CheckCircle2,
  Clock, Download, Eye, Bell
} from "lucide-react";

export default function ConvenioDocuments() {
  const { data: documents = [] } = useQuery({
    queryKey: ["convenio_documents"],
    queryFn: () => base44.entities.ConvenioDocument.list("-expiration_date"),
  });

  const { data: convenios = [] } = useQuery({
    queryKey: ["convenios"],
    queryFn: () => base44.entities.ConvenioConfig.list(),
  });

  const getConvenioName = (convenioId) => {
    return convenios.find(c => c.id === convenioId)?.convenio_name || "Desconhecido";
  };

  const getDocumentStatus = (doc) => {
    if (!doc.expiration_date) return { status: "sem_vencimento", color: "bg-slate-100 text-slate-600" };
    
    const daysUntilExpiry = Math.floor(
      (new Date(doc.expiration_date) - new Date()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry < 0) return { status: "expirado", color: "bg-red-100 text-red-700" };
    if (daysUntilExpiry <= 15) return { status: "crítico", color: "bg-red-100 text-red-700" };
    if (daysUntilExpiry <= 30) return { status: "atenção", color: "bg-amber-100 text-amber-700" };
    return { status: "válido", color: "bg-emerald-100 text-emerald-700" };
  };

  const expiredDocs = documents.filter(d => getDocumentStatus(d).status === "expirado").length;
  const criticalDocs = documents.filter(d => getDocumentStatus(d).status === "crítico").length;
  const warningDocs = documents.filter(d => getDocumentStatus(d).status === "atenção").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Documentos de Convênios</h1>
        <p className="text-slate-500 text-sm mt-1">
          Gerencie certidões, decretos e documentação necessária para operação
        </p>
      </div>

      {(expiredDocs > 0 || criticalDocs > 0) && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">
            <strong>{expiredDocs} documentos expirados</strong> e <strong>{criticalDocs} críticos</strong> (vencimento em até 15 dias)
          </AlertDescription>
        </Alert>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Documentos</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{documents.length}</p>
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
                <p className="text-sm text-slate-500">Expirados</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{expiredDocs}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Críticos (15d)</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{criticalDocs}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Atenção (30d)</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{warningDocs}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <Bell className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Documentos */}
      <Card className="rounded-xl border-slate-100">
        <CardHeader>
          <CardTitle className="text-sm">Todos os Documentos ({documents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {documents.map(doc => {
              const status = getDocumentStatus(doc);
              const daysUntilExpiry = doc.expiration_date
                ? Math.floor((new Date(doc.expiration_date) - new Date()) / (1000 * 60 * 60 * 24))
                : null;

              return (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-700" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-slate-900">{doc.document_name || doc.document_type}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <Building2 className="w-3 h-3" />
                        <span>{getConvenioName(doc.convenio_id)}</span>
                        {doc.expiration_date && (
                          <>
                            <span>•</span>
                            <Calendar className="w-3 h-3" />
                            <span>Vence: {new Date(doc.expiration_date).toLocaleDateString('pt-BR')}</span>
                            {daysUntilExpiry !== null && daysUntilExpiry >= 0 && (
                              <span className="font-medium">({daysUntilExpiry}d)</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <Badge className={status.color}>
                      {status.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.file_url && (
                      <Button size="sm" variant="outline" className="rounded-lg">
                        <Download className="w-3 h-3" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="rounded-lg">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}