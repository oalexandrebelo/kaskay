import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const REQUIRED_APPROVERS = ["Operações", "Financeiro", "Jurídico"];

export default function ConvenioApprovals() {
  const queryClient = useQueryClient();
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalComments, setApprovalComments] = useState("");
  const [approvingArea, setApprovingArea] = useState(null);

  const { data: currentUser } = useQuery({
    queryKey: ["current_user"],
    queryFn: () => base44.auth.me(),
  });

  const { data: approvals = [], isLoading } = useQuery({
    queryKey: ["convenio_approvals"],
    queryFn: () => base44.entities.ConvenioApproval.list("-created_date", 100),
  });

  const { data: convenios = [] } = useQuery({
    queryKey: ["convenio_configs"],
    queryFn: () => base44.entities.ConvenioConfig.list("-created_date", 1000),
  });

  const approveAreaMutation = useMutation({
    mutationFn: async ({ approvalId, area, approved }) => {
      const approval = approvals.find(a => a.id === approvalId);
      const updatedApprovals = approval.approvals.map(app =>
        app.area === area
          ? {
              ...app,
              status: approved ? "approved" : "rejected",
              approved_by: currentUser.email,
              approved_at: new Date().toISOString(),
              comments: approvalComments,
            }
          : app
      );

      const allApproved = updatedApprovals.every(app => app.status === "approved");
      const anyRejected = updatedApprovals.some(app => app.status === "rejected");

      const newStatus = anyRejected ? "rejected" : allApproved ? "approved" : "pending";

      await base44.entities.ConvenioApproval.update(approvalId, {
        approvals: updatedApprovals,
        approval_status: newStatus,
      });

      // Se aprovado, ativar o convênio
      if (newStatus === "approved") {
        const convenio = convenios.find(c => c.id === approval.convenio_id);
        if (convenio && !convenio.is_active) {
          await base44.entities.ConvenioConfig.update(convenio.id, { is_active: true });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["convenio_approvals"] });
      queryClient.invalidateQueries({ queryKey: ["convenio_configs"] });
      setApprovalDialogOpen(false);
      setApprovalComments("");
      setApprovingArea(null);
    },
  });

  const requestApprovalMutation = useMutation({
    mutationFn: async (convenioId) => {
      const approval = await base44.entities.ConvenioApproval.create({
        convenio_id: convenioId,
        convenio_name: convenios.find(c => c.id === convenioId)?.convenio_name,
        approval_status: "pending",
        required_approvers: REQUIRED_APPROVERS,
        approvals: REQUIRED_APPROVERS.map(area => ({
          area,
          status: "pending",
          approved_by: null,
          approved_at: null,
          comments: null,
        })),
        request_date: new Date().toISOString(),
        requested_by: currentUser.email,
      });
      return approval;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["convenio_approvals"] });
    },
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-emerald-100 text-emerald-700 border-emerald-300";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-300";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const pendingApprovals = approvals.filter(a => a.approval_status === "pending");
  const approvedApprovals = approvals.filter(a => a.approval_status === "approved");
  const rejectedApprovals = approvals.filter(a => a.approval_status === "rejected");

  if (isLoading) {
    return <Skeleton className="h-96 rounded-2xl" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Aprovação de Convênios</h1>
        <p className="text-slate-500 text-sm mt-1">
          Gerenciar fluxo de aprovação de novos convênios por áreas impactadas
        </p>
      </div>

      <Alert className="border-blue-200 bg-blue-50">
        <AlertTriangle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900 text-sm">
          Convênios precisam de aprovação das áreas de <strong>Operações</strong>, <strong>Financeiro</strong> e <strong>Jurídico</strong> antes de serem ativados e poderem receber propostas.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            Pendentes ({pendingApprovals.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Aprovados ({approvedApprovals.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejeitados ({rejectedApprovals.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-4">
          {pendingApprovals.length === 0 ? (
            <Card className="rounded-2xl border-slate-200">
              <CardContent className="p-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
                <p className="text-slate-500 mb-4">Nenhuma aprovação pendente</p>
              </CardContent>
            </Card>
          ) : (
            pendingApprovals.map(approval => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                currentUser={currentUser}
                onApprove={(area) => {
                  setSelectedApproval(approval);
                  setApprovingArea(area);
                  setApprovalComments("");
                  setApprovalDialogOpen(true);
                }}
                getStatusColor={getStatusColor}
                getStatusIcon={getStatusIcon}
                isLoading={approveAreaMutation.isPending}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4 mt-4">
          {approvedApprovals.length === 0 ? (
            <Card className="rounded-2xl border-slate-200">
              <CardContent className="p-12 text-center">
                <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 mb-4">Nenhum convênio aprovado</p>
              </CardContent>
            </Card>
          ) : (
            approvedApprovals.map(approval => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                currentUser={currentUser}
                getStatusColor={getStatusColor}
                getStatusIcon={getStatusIcon}
                readOnly
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4 mt-4">
          {rejectedApprovals.length === 0 ? (
            <Card className="rounded-2xl border-slate-200">
              <CardContent className="p-12 text-center">
                <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 mb-4">Nenhum convênio rejeitado</p>
              </CardContent>
            </Card>
          ) : (
            rejectedApprovals.map(approval => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                currentUser={currentUser}
                getStatusColor={getStatusColor}
                getStatusIcon={getStatusIcon}
                readOnly
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de Aprovação */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedApproval && approvingArea ? `Aprovar ${approvingArea}` : "Aprovação"}
            </DialogTitle>
          </DialogHeader>
          {selectedApproval && approvingArea && (
            <div className="space-y-4 pt-4">
              <div>
                <p className="text-sm text-slate-600 mb-2">Convênio</p>
                <p className="font-semibold text-slate-900">{selectedApproval.convenio_name}</p>
              </div>

              <div>
                <p className="text-sm text-slate-600 mb-2">Área</p>
                <p className="font-semibold text-slate-900">{approvingArea}</p>
              </div>

              <div>
                <p className="text-sm text-slate-600 mb-2">Comentários (opcional)</p>
                <Textarea
                  value={approvalComments}
                  onChange={e => setApprovalComments(e.target.value)}
                  placeholder="Adicione comentários sobre a aprovação..."
                  className="rounded-xl"
                  rows={4}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setApprovalDialogOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    approveAreaMutation.mutate({
                      approvalId: selectedApproval.id,
                      area: approvingArea,
                      approved: false,
                    })
                  }
                  disabled={approveAreaMutation.isPending}
                  className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                >
                  {approveAreaMutation.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Rejeitar
                </Button>
                <Button
                  onClick={() =>
                    approveAreaMutation.mutate({
                      approvalId: selectedApproval.id,
                      area: approvingArea,
                      approved: true,
                    })
                  }
                  disabled={approveAreaMutation.isPending}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {approveAreaMutation.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Aprovar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ApprovalCard({
  approval,
  currentUser,
  onApprove,
  getStatusColor,
  getStatusIcon,
  readOnly,
  isLoading,
}) {
  const userDepartment = currentUser?.user?.department || null;
  const pendingAreas = approval.approvals.filter(a => a.status === "pending");

  return (
    <Card className="rounded-2xl border-slate-100">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-slate-900">
                {approval.convenio_name}
              </h3>
              <Badge className={getStatusColor()}>
                {getStatusIcon()}
                <span className="ml-1">
                  {approval.approval_status === "approved"
                    ? "Aprovado"
                    : approval.approval_status === "rejected"
                    ? "Rejeitado"
                    : "Pendente"}
                </span>
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Solicitado em {new Date(approval.request_date).toLocaleDateString("pt-BR")} por{" "}
              {approval.requested_by}
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <p className="text-sm font-medium text-slate-700">Aprovações Requeridas:</p>
          <div className="grid grid-cols-3 gap-3">
            {approval.approvals.map(app => (
              <div
                key={app.area}
                className={`p-3 rounded-lg border ${
                  app.status === "approved"
                    ? "bg-emerald-50 border-emerald-200"
                    : app.status === "rejected"
                    ? "bg-red-50 border-red-200"
                    : "bg-yellow-50 border-yellow-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {getStatusIcon(app.status)}
                  <span className="text-sm font-medium text-slate-900">{app.area}</span>
                </div>
                {app.approved_by && (
                  <p className="text-xs text-slate-600">Por: {app.approved_by}</p>
                )}
                {app.comments && (
                  <p className="text-xs text-slate-600 mt-1 italic">"{app.comments}"</p>
                )}
                {!readOnly && app.status === "pending" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-2 h-7 text-xs"
                    onClick={() => onApprove(app.area)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <MessageSquare className="w-3 h-3 mr-1" />
                    )}
                    Avaliar
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {pendingAreas.length > 0 && !readOnly && (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900 text-xs">
              Aguardando aprovação de: {pendingAreas.map(a => a.area).join(", ")}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}