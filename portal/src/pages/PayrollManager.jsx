import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  FileText, 
  Download, 
  Upload, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Calendar,
  Send,
  Bell,
  Loader2,
  ArrowUpDown,
  FileCheck
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, addDays, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";

const fileStatusConfig = {
  generated: { label: "Gerado", color: "bg-blue-100 text-blue-700", icon: FileText },
  sent: { label: "Enviado", color: "bg-violet-100 text-violet-700", icon: Send },
  received: { label: "Recebido", color: "bg-emerald-100 text-emerald-700", icon: Download },
  processing: { label: "Processando", color: "bg-orange-100 text-orange-700", icon: Loader2 },
  processed: { label: "Processado", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  error: { label: "Erro", color: "bg-red-100 text-red-700", icon: AlertTriangle },
};

export default function PayrollManager() {
  const queryClient = useQueryClient();
  const [selectedConvenio, setSelectedConvenio] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));

  const { data: convenios = [] } = useQuery({
    queryKey: ["convenio_configs"],
    queryFn: () => base44.entities.ConvenioConfig.list(),
  });

  const { data: files = [], isLoading } = useQuery({
    queryKey: ["payroll_files"],
    queryFn: () => base44.entities.PayrollFile.list("-generated_at", 1000),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["payroll_notifications"],
    queryFn: () => base44.entities.PayrollNotification.filter({ status: "pending" }),
  });

  const { data: proposals = [] } = useQuery({
    queryKey: ["proposals_for_payroll"],
    queryFn: () => base44.entities.Proposal.filter({ status: "averbated" }),
  });

  const generateRemessaMutation = useMutation({
    mutationFn: async (convenioId) => {
      const convenio = convenios.find(c => c.id === convenioId);
      const proposalsForConvenio = proposals.filter(p => p.employer === convenio.convenio_name);
      
      // Simular geração de arquivo
      const fileContent = generateRemessaFile(convenio, proposalsForConvenio, selectedMonth);
      const blob = new Blob([fileContent], { type: "text/plain" });
      
      // Upload do arquivo
      const file = new File([blob], `remessa_${convenio.convenio_code}_${selectedMonth}.txt`);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // Calcular data de corte
      const cutOffDay = convenio.cut_off_day;
      const dueDate = new Date(selectedMonth);
      dueDate.setDate(cutOffDay);
      
      // Criar registro
      await base44.entities.PayrollFile.create({
        convenio_id: convenioId,
        convenio_name: convenio.convenio_name,
        file_type: "remessa",
        reference_month: selectedMonth,
        file_url,
        layout_version: "1.0",
        records_count: proposalsForConvenio.length,
        total_amount: proposalsForConvenio.reduce((sum, p) => sum + (p.installment_value || 0), 0),
        status: "generated",
        generated_at: new Date().toISOString(),
        due_date: dueDate.toISOString().split('T')[0],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll_files"] });
    },
  });

  const markAsSentMutation = useMutation({
    mutationFn: (fileId) => base44.entities.PayrollFile.update(fileId, {
      status: "sent",
      sent_at: new Date().toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll_files"] });
    },
  });

  const generateRemessaFile = (convenio, proposals, month) => {
    // Header
    let content = `0${convenio.convenio_code.padEnd(20)}${format(new Date(), "yyyyMMdd")}REMESSA${month.replace("-", "")}`.padEnd(240) + "\n";
    
    // Details
    proposals.forEach((p, idx) => {
      const line = `1${(idx + 1).toString().padStart(6, "0")}${p.client_cpf.padEnd(11)}${p.client_name.padEnd(40)}${(p.installment_value * 100).toFixed(0).padStart(15, "0")}`;
      content += line.padEnd(240) + "\n";
    });
    
    // Trailer
    const totalAmount = proposals.reduce((sum, p) => sum + (p.installment_value || 0), 0);
    content += `9${proposals.length.toString().padStart(6, "0")}${(totalAmount * 100).toFixed(0).padStart(15, "0")}`.padEnd(240);
    
    return content;
  };

  const filteredFiles = useMemo(() => {
    let result = files;
    if (selectedConvenio !== "all") {
      result = result.filter(f => f.convenio_id === selectedConvenio);
    }
    if (selectedMonth !== "all") {
      result = result.filter(f => f.reference_month?.startsWith(selectedMonth));
    }
    return result;
  }, [files, selectedConvenio, selectedMonth]);

  // Calcular métricas
  const pendingRemessas = files.filter(f => f.file_type === "remessa" && f.status === "generated").length;
  const pendingRetornos = files.filter(f => f.file_type === "retorno" && f.status === "received").length;
  const urgentNotifications = notifications.filter(n => n.priority === "urgent").length;

  if (isLoading) {
    return <Skeleton className="h-96 rounded-2xl" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestão de Arquivos de Folha</h1>
        <p className="text-slate-500 text-sm mt-1">Remessa, retorno e conciliação automática com órgãos</p>
      </div>

      {urgentNotifications > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <Bell className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900 text-sm">
            <strong>Atenção:</strong> Você tem {urgentNotifications} notificação(ões) urgente(s) de prazos próximos!
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-500 uppercase">Remessas Pendentes</p>
              <Upload className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-700">{pendingRemessas}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-500 uppercase">Retornos a Processar</p>
              <Download className="w-4 h-4 text-violet-600" />
            </div>
            <p className="text-2xl font-bold text-violet-700">{pendingRetornos}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-500 uppercase">Notificações</p>
              <Bell className="w-4 h-4 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-orange-700">{notifications.length}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-500 uppercase">Convênios Ativos</p>
              <FileCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-700">{convenios.filter(c => c.is_active).length}</p>
          </CardContent>
        </Card>
      </div>

      <Alert className="border-blue-200 bg-blue-50">
        <Calendar className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900 text-sm">
          <strong>Automação:</strong> Arquivos de remessa são gerados automaticamente com base nas datas de corte de cada convênio. 
          Notificações são enviadas 3 dias antes do prazo.
        </AlertDescription>
      </Alert>

      {/* Geração de Remessa */}
      <Card className="rounded-2xl border-slate-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="w-4 h-4 text-blue-600" /> Gerar Arquivo de Remessa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <Select value={selectedConvenio} onValueChange={setSelectedConvenio}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Selecione o convênio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Convênios</SelectItem>
                {convenios.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.convenio_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={format(new Date(), "yyyy-MM")}>Este Mês</SelectItem>
                <SelectItem value={format(addDays(new Date(), 30), "yyyy-MM")}>Próximo Mês</SelectItem>
              </SelectContent>
            </Select>

            <Button
              className="bg-blue-600 hover:bg-blue-700 rounded-xl"
              onClick={() => selectedConvenio !== "all" && generateRemessaMutation.mutate(selectedConvenio)}
              disabled={selectedConvenio === "all" || generateRemessaMutation.isPending}
            >
              {generateRemessaMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
              )}
              Gerar Remessa
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Arquivos */}
      <Card className="rounded-2xl border-slate-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-slate-600" /> Arquivos de Folha
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredFiles.length === 0 ? (
            <p className="text-center py-8 text-slate-400 text-sm">Nenhum arquivo encontrado</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase">Convênio</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase">Tipo</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase">Referência</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase">Registros</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase">Valor Total</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase">Prazo</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map(file => {
                  const Icon = fileStatusConfig[file.status]?.icon || FileText;
                  const isOverdue = file.due_date && isBefore(new Date(file.due_date), new Date()) && file.status === "generated";
                  
                  return (
                    <TableRow key={file.id} className="hover:bg-slate-50/50">
                      <TableCell className="text-sm font-medium text-slate-900">
                        {file.convenio_name}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${file.file_type === "remessa" ? "bg-blue-100 text-blue-700" : "bg-violet-100 text-violet-700"} border-0 text-xs`}>
                          {file.file_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {file.reference_month ? format(new Date(file.reference_month), "MMM/yyyy", { locale: ptBR }) : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">{file.records_count || 0}</TableCell>
                      <TableCell className="text-sm font-semibold text-slate-900">
                        R$ {(file.total_amount || 0).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        {file.due_date && (
                          <span className={`text-xs ${isOverdue ? "text-red-600 font-semibold" : "text-slate-600"}`}>
                            {format(new Date(file.due_date), "dd/MM/yyyy")}
                            {isOverdue && " (Vencido)"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${fileStatusConfig[file.status]?.color || "bg-slate-100 text-slate-600"} border-0 text-xs flex items-center gap-1 w-fit`}>
                          <Icon className="w-3 h-3" />
                          {fileStatusConfig[file.status]?.label || file.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {file.file_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-lg"
                              onClick={() => window.open(file.file_url, "_blank")}
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Baixar
                            </Button>
                          )}
                          {file.status === "generated" && file.file_type === "remessa" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-lg"
                              onClick={() => markAsSentMutation.mutate(file.id)}
                            >
                              <Send className="w-3 h-3 mr-1" />
                              Marcar Enviado
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Notificações Pendentes */}
      {notifications.length > 0 && (
        <Card className="rounded-2xl border-orange-100 bg-orange-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-4 h-4 text-orange-600" /> Notificações Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {notifications.map(notif => (
                <div key={notif.id} className="bg-white rounded-lg p-3 border border-orange-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`${notif.priority === "urgent" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"} border-0 text-xs`}>
                          {notif.priority}
                        </Badge>
                        <span className="text-sm font-medium text-slate-900">{notif.convenio_name}</span>
                      </div>
                      <p className="text-xs text-slate-600">{notif.message || `Prazo: ${format(new Date(notif.due_date), "dd/MM/yyyy")}`}</p>
                    </div>
                    <Clock className="w-4 h-4 text-orange-600" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}