import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Shield, 
  User,
  FileText,
  ChevronRight
} from "lucide-react";
import { format } from "date-fns";

const ruleTypeLabels = {
  override_decision: "Override de Decisão",
  bank_account_change: "Mudança de Conta Bancária",
  manual_release: "Liberação Manual",
  renegotiation: "Renegociação",
  reclassification: "Reclassificação",
  refin_approval: "Aprovação de Refinanciamento",
  high_value_disbursement: "Desembolso Alto Valor",
};

const statusConfig = {
  pending_first: { label: "1ª Aprovação Pendente", color: "bg-amber-100 text-amber-700", icon: Clock },
  pending_second: { label: "2ª Aprovação Pendente", color: "bg-blue-100 text-blue-700", icon: Clock },
  approved: { label: "Aprovado", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  rejected: { label: "Rejeitado", color: "bg-red-100 text-red-700", icon: XCircle },
  expired: { label: "Expirado", color: "bg-slate-100 text-slate-600", icon: AlertTriangle },
};

export default function DualApprovalQueue() {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionNotes, setActionNotes] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ["current_user"],
    queryFn: () => base44.auth.me(),
  });

  const { data: approvalRequests = [], isLoading } = useQuery({
    queryKey: ["approval_requests"],
    queryFn: () => base44.entities.ApprovalRequest.list("-requested_at", 200),
  });

  const processApprovalMutation = useMutation({
    mutationFn: async ({ approval_request_id, action, notes }) => {
      return base44.functions.invoke('processApprovalRequest', {
        approval_request_id,
        action,
        notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval_requests"] });
      setDialogOpen(false);
      setSelectedRequest(null);
      setActionNotes("");
    },
  });

  const pendingFirst = approvalRequests.filter(ar => ar.status === 'pending_first');
  const pendingSecond = approvalRequests.filter(ar => ar.status === 'pending_second');
  const completed = approvalRequests.filter(ar => ['approved', 'rejected', 'expired'].includes(ar.status));

  const handleAction = (action) => {
    if (!selectedRequest) return;
    
    processApprovalMutation.mutate({
      approval_request_id: selectedRequest.id,
      action,
      notes: actionNotes,
    });
  };

  const openDetail = (request) => {
    setSelectedRequest(request);
    setActionNotes("");
    setDialogOpen(true);
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Fila de Dupla Aprovação</h1>
        <p className="text-slate-500 text-sm mt-1">
          Governança e controle para operações críticas
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-amber-100 bg-amber-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-amber-700 uppercase">1ª Aprovação</p>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-900">{pendingFirst.length}</p>
          </CardContent>
        </Card>

        <Card className="border-blue-100 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-blue-700 uppercase">2ª Aprovação</p>
              <Shield className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-900">{pendingSecond.length}</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 bg-emerald-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-emerald-700 uppercase">Aprovadas</p>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-900">
              {completed.filter(c => c.status === 'approved').length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-100 bg-red-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-red-700 uppercase">Rejeitadas</p>
              <XCircle className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-900">
              {completed.filter(c => c.status === 'rejected').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Solicitações Pendentes */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Solicitações Pendentes</CardTitle>
        </CardHeader>
        <CardContent>
          {[...pendingFirst, ...pendingSecond].length === 0 ? (
            <p className="text-center py-8 text-slate-400 text-sm">Nenhuma solicitação pendente</p>
          ) : (
            <div className="space-y-3">
              {[...pendingFirst, ...pendingSecond].map((request) => {
                const Icon = statusConfig[request.status]?.icon || Clock;
                return (
                  <div key={request.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-slate-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-sm font-semibold text-slate-900">
                            {ruleTypeLabels[request.rule_type] || request.rule_type}
                          </h3>
                          <Badge className={`${statusConfig[request.status]?.color} border-0 text-xs`}>
                            <Icon className="w-3 h-3 mr-1" />
                            {statusConfig[request.status]?.label}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3" />
                            <span>Solicitado por: {request.requested_by}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            <span>{format(new Date(request.requested_at), "dd/MM/yyyy HH:mm")}</span>
                          </div>
                          {request.first_approver && (
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>1ª Aprovação: {request.first_approver}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-slate-700 mt-2">{request.justification}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                        onClick={() => openDetail(request)}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Histórico de Aprovações</CardTitle>
        </CardHeader>
        <CardContent>
          {completed.length === 0 ? (
            <p className="text-center py-8 text-slate-400 text-sm">Nenhum registro</p>
          ) : (
            <div className="space-y-3">
              {completed.slice(0, 10).map((request) => {
                const Icon = statusConfig[request.status]?.icon;
                return (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        {ruleTypeLabels[request.rule_type]}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {format(new Date(request.completed_at || request.requested_at), "dd/MM/yyyy")}
                      </p>
                    </div>
                    <Badge className={`${statusConfig[request.status]?.color} border-0`}>
                      <Icon className="w-3 h-3 mr-1" />
                      {statusConfig[request.status]?.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Solicitação</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 pt-4">
              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription className="text-sm text-blue-900">
                  <strong>{ruleTypeLabels[selectedRequest.rule_type]}</strong>
                  <br />
                  Status: {statusConfig[selectedRequest.status]?.label}
                </AlertDescription>
              </Alert>

              <div className="bg-slate-50 rounded-xl p-4 space-y-3 text-sm">
                <div>
                  <span className="text-slate-600">Solicitado por:</span>
                  <p className="font-medium text-slate-900">{selectedRequest.requested_by}</p>
                </div>
                <div>
                  <span className="text-slate-600">Data:</span>
                  <p className="font-medium text-slate-900">
                    {format(new Date(selectedRequest.requested_at), "dd/MM/yyyy HH:mm")}
                  </p>
                </div>
                <div>
                  <span className="text-slate-600">Justificativa:</span>
                  <p className="font-medium text-slate-900">{selectedRequest.justification}</p>
                </div>
                {selectedRequest.first_approver && (
                  <div>
                    <span className="text-slate-600">1ª Aprovação:</span>
                    <p className="font-medium text-slate-900">
                      {selectedRequest.first_approver} - {format(new Date(selectedRequest.first_approval_at), "dd/MM/yyyy HH:mm")}
                    </p>
                    {selectedRequest.first_approval_notes && (
                      <p className="text-xs text-slate-600 mt-1">{selectedRequest.first_approval_notes}</p>
                    )}
                  </div>
                )}
              </div>

              {['pending_first', 'pending_second'].includes(selectedRequest.status) && (
                <>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                      Observações (opcional)
                    </label>
                    <Textarea
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      placeholder="Adicione observações sobre sua decisão..."
                      className="rounded-xl"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => handleAction('reject')}
                      disabled={processApprovalMutation.isPending}
                      className="rounded-xl"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Rejeitar
                    </Button>
                    <Button
                      onClick={() => handleAction('approve')}
                      disabled={processApprovalMutation.isPending}
                      className="bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Aprovar
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}