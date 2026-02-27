import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Send, 
  CheckCircle2, 
  Clock,
  AlertCircle,
  Eye
} from "lucide-react";
import { format } from "date-fns";

const statusColors = {
  pending: "bg-slate-100 text-slate-700",
  sent: "bg-blue-100 text-blue-700",
  viewed: "bg-purple-100 text-purple-700",
  signed: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  expired: "bg-amber-100 text-amber-700",
};

export default function ConvenioSignatures() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedConvenio, setSelectedConvenio] = useState("");
  const [formData, setFormData] = useState({});
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ["current_user"],
    queryFn: () => base44.auth.me(),
  });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["signature_requests"],
    queryFn: () => base44.entities.ConvenioSignatureRequest.list("-created_date", 500),
  });

  const { data: convenios = [] } = useQuery({
    queryKey: ["convenios"],
    queryFn: () => base44.entities.ConvenioConfig.list(),
  });

  const requestSignatureMutation = useMutation({
    mutationFn: async (data) => {
      return base44.functions.invoke('requestConvenioSignature', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signature_requests"] });
      setDialogOpen(false);
      setFormData({});
    },
  });

  const handleSubmit = () => {
    const convenio = convenios.find(c => c.id === selectedConvenio);
    requestSignatureMutation.mutate({
      convenio_id: selectedConvenio,
      convenio_name: convenio?.convenio_name,
      ...formData,
    });
  };

  const myRequests = currentUser?.role === "admin" 
    ? requests 
    : requests.filter(r => r.signer_email === currentUser?.email);

  const pendingCount = myRequests.filter(r => r.status === "sent" || r.status === "pending").length;

  if (isLoading) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assinaturas de Credenciamento</h1>
          <p className="text-slate-500 text-sm mt-1">
            Solicitações de assinatura de documentos de convênios
          </p>
        </div>
        {currentUser?.role === "admin" && (
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 rounded-xl"
          >
            <Send className="w-4 h-4 mr-2" />
            Nova Solicitação
          </Button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-100 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-blue-700 uppercase">Pendentes</p>
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-900">{pendingCount}</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 bg-emerald-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-emerald-700 uppercase">Assinados</p>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-900">
              {myRequests.filter(r => r.status === "signed").length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-100 bg-purple-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-purple-700 uppercase">Visualizados</p>
              <Eye className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-900">
              {myRequests.filter(r => r.status === "viewed").length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-100 bg-amber-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-amber-700 uppercase">Expirados</p>
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-900">
              {myRequests.filter(r => r.status === "expired").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Solicitações */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Solicitações de Assinatura</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {myRequests.map(request => (
              <div key={request.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <h3 className="font-semibold text-slate-900">{request.convenio_name}</h3>
                    </div>
                    <p className="text-sm text-slate-600">
                      {request.document_type?.replace(/_/g, ' ').toUpperCase()}
                    </p>
                  </div>
                  <Badge className={statusColors[request.status]}>
                    {request.status === "signed" ? "Assinado" : 
                     request.status === "sent" ? "Enviado" :
                     request.status === "viewed" ? "Visualizado" :
                     request.status === "expired" ? "Expirado" : "Pendente"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-slate-500">Assinante:</span>
                    <p className="font-medium text-slate-900">{request.signer_name}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Cargo:</span>
                    <p className="font-medium text-slate-900">{request.signer_role || "—"}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Solicitado:</span>
                    <p className="font-medium text-slate-900">
                      {format(new Date(request.created_date), 'dd/MM/yyyy')}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Expira em:</span>
                    <p className="font-medium text-slate-900">
                      {format(new Date(request.expires_at), 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>

                {request.status === "sent" && request.signer_email === currentUser?.email && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => window.open(request.document_url, '_blank')}
                      className="bg-blue-600 hover:bg-blue-700 rounded-lg"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Visualizar Documento
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {myRequests.length === 0 && (
              <p className="text-center py-8 text-slate-400">
                Nenhuma solicitação de assinatura encontrada
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog Nova Solicitação */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Solicitação de Assinatura</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Convênio</Label>
              <Select value={selectedConvenio} onValueChange={setSelectedConvenio}>
                <SelectTrigger className="rounded-xl mt-1">
                  <SelectValue placeholder="Selecione o convênio..." />
                </SelectTrigger>
                <SelectContent>
                  {convenios.map(conv => (
                    <SelectItem key={conv.id} value={conv.id}>
                      {conv.convenio_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tipo de Documento</Label>
              <Select 
                value={formData.document_type} 
                onValueChange={(v) => setFormData({...formData, document_type: v})}
              >
                <SelectTrigger className="rounded-xl mt-1">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contrato_credenciamento">Contrato de Credenciamento</SelectItem>
                  <SelectItem value="termo_adesao">Termo de Adesão</SelectItem>
                  <SelectItem value="procuracao">Procuração</SelectItem>
                  <SelectItem value="contrato_cessao">Contrato de Cessão</SelectItem>
                  <SelectItem value="aditivo_contratual">Aditivo Contratual</SelectItem>
                  <SelectItem value="termo_confidencialidade">Termo de Confidencialidade</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>URL do Documento</Label>
              <Input
                value={formData.document_url || ""}
                onChange={(e) => setFormData({...formData, document_url: e.target.value})}
                placeholder="https://..."
                className="rounded-xl mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nome do Representante</Label>
                <Input
                  value={formData.signer_name || ""}
                  onChange={(e) => setFormData({...formData, signer_name: e.target.value})}
                  className="rounded-xl mt-1"
                />
              </div>
              <div>
                <Label>Cargo</Label>
                <Input
                  value={formData.signer_role || ""}
                  onChange={(e) => setFormData({...formData, signer_role: e.target.value})}
                  placeholder="Ex: Diretor Geral"
                  className="rounded-xl mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.signer_email || ""}
                  onChange={(e) => setFormData({...formData, signer_email: e.target.value})}
                  className="rounded-xl mt-1"
                />
              </div>
              <div>
                <Label>CPF</Label>
                <Input
                  value={formData.signer_cpf || ""}
                  onChange={(e) => setFormData({...formData, signer_cpf: e.target.value})}
                  placeholder="000.000.000-00"
                  className="rounded-xl mt-1"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!selectedConvenio || !formData.document_type || !formData.signer_email || requestSignatureMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 rounded-xl"
              >
                <Send className="w-4 h-4 mr-2" />
                Enviar Solicitação
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}