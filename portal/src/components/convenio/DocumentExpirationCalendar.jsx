import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, AlertTriangle, FileText, Clock } from "lucide-react";
import { format, addMonths, isBefore, isAfter, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function DocumentExpirationCalendar({ convenioId }) {
  const { data: documents = [] } = useQuery({
    queryKey: ["convenio_documents", convenioId],
    queryFn: async () => {
      if (!convenioId) return [];
      return await base44.entities.ConvenioDocument.filter({ convenio_id: convenioId });
    },
    enabled: !!convenioId,
  });

  const documentsByMonth = useMemo(() => {
    const months = {};
    const today = new Date();
    
    // Próximos 6 meses
    for (let i = 0; i < 6; i++) {
      const monthDate = addMonths(today, i);
      const monthKey = format(monthDate, "yyyy-MM");
      months[monthKey] = {
        label: format(monthDate, "MMMM yyyy", { locale: ptBR }),
        documents: [],
      };
    }

    documents.forEach(doc => {
      const expirationDate = new Date(doc.expiration_date);
      const monthKey = format(expirationDate, "yyyy-MM");
      
      if (months[monthKey]) {
        const daysUntilExpiration = differenceInDays(expirationDate, today);
        months[monthKey].documents.push({
          ...doc,
          daysUntilExpiration,
          isExpired: daysUntilExpiration < 0,
          isExpiringSoon: daysUntilExpiration >= 0 && daysUntilExpiration <= 30,
        });
      }
    });

    return months;
  }, [documents]);

  return (
    <Card className="rounded-2xl border-slate-100">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          Calendário de Vencimentos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(documentsByMonth).map(([monthKey, month]) => (
            <div key={monthKey} className="border-b border-slate-100 pb-3 last:border-0">
              <h4 className="text-sm font-semibold text-slate-700 mb-2 capitalize">{month.label}</h4>
              {month.documents.length === 0 ? (
                <p className="text-xs text-slate-400">Nenhum documento vencendo</p>
              ) : (
                <div className="space-y-2">
                  {month.documents.map(doc => (
                    <div
                      key={doc.id}
                      className={`p-2 rounded-lg border ${
                        doc.isExpired
                          ? "bg-red-50 border-red-200"
                          : doc.isExpiringSoon
                          ? "bg-yellow-50 border-yellow-200"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="w-3 h-3 text-slate-600" />
                            <span className="text-xs font-medium text-slate-900">
                              {doc.document_name || doc.document_type}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Clock className="w-3 h-3" />
                            {format(new Date(doc.expiration_date), "dd/MM/yyyy")}
                            {doc.isExpired && (
                              <Badge className="bg-red-600 text-white border-0 text-[10px] h-4 px-1">
                                Vencido há {Math.abs(doc.daysUntilExpiration)} dias
                              </Badge>
                            )}
                            {doc.isExpiringSoon && !doc.isExpired && (
                              <Badge className="bg-yellow-600 text-white border-0 text-[10px] h-4 px-1">
                                {doc.daysUntilExpiration} dias
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}