import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle2, XCircle, AlertTriangle, Eye, Loader2, Shield } from "lucide-react";

export default function AverbationControl() {
  const queryClient = useQueryClient();
  const [selectedAverbation, setSelectedAverbation] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: averbations = [], isLoading } = useQuery({
    queryKey: ["averbation_verifications"],
    queryFn: () => base44.entities.AverbationVerification.list("-created_date", 1000),
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ averbationId, status, isSecondVerification }) => {
      const updates = {
        ...(isSecondVerification ? {
          second_verification_status: status,
          second_verified_by: user?.email,
          second_verified_at: new Date().toISOString(),
          final_status: status === "confirmed" ? "verified" : "discrepancy",
          discrepancy_notes: status !== "confirmed" ? verificationNotes : undefined,
        } : {
          first_verification_status: status,
          first_verified_by: user?.email,
          first_verified_at: new Date().toISOString(),
        }),
      };

      await base44.entities.AverbationVerification.update(averbationId, updates);

      // Audit log
      await base44.entities.AuditLog.create({
        entity_type: "AverbationVerification",
        entity_id: averbationId,
        action: isSecondVerification ? "second_verification" : "first_verification",
        to_value: status,
        details: `Verificação realizada: ${status}. ${verificationNotes || ""}`,
        performed_by: user?.email,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["averbation_verifications"] });
      setSelectedAverbation(null);
      setVerificationNotes("");
    },
  });

  const pendingFirst = averbations.filter(a => a.first_verification_status === "pending");
  const pendingSecond = averbations.filter(a => a.first_verification_status === "confirmed" && a.second_verification_status === "pending");
  const verified = averbations.filter(a => a.final_status === "verified");
  const discrepancy = averbations.filter(a => a.final_status === "discrepancy");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Controle de Averbações</h1>
        <p className="text-slate-500 text-sm mt-1">Dupla verificação obrigatória para garantir averbação</p>
      </div>

      <Alert className="border-orange-200 bg-orange-50">
        <Shield className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-900 text-sm">
          <strong>Dupla Verificação:</strong> Toda averbação passa por duas verificações independentes. 
          Só após confirmação dupla o status é marcado como "verificado".
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-4 gap-4">
        <Card className="rounded-2xl border-orange-100">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 mb-1">Aguardando 1ª Verificação</p>
            <p className="text-2xl font-bold text-orange-700">{pendingFirst.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-blue-100">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 mb-1">Aguardando 2ª Verificação</p>
            <p className="text-2xl font-bold text-blue-700">{pendingSecond.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-emerald-100">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 mb-1">Verificadas</p>
            <p className="text-2xl font-bold text-emerald-700">{verified.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-red-100">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 mb-1">Discrepâncias</p>
            <p className="text-2xl font-bold text-red-700">{discrepancy.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-slate-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Averbações para Verificação</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="text-xs font-semibold">Cliente</TableHead>
                <TableHead className="text-xs font-semibold">Convênio</TableHead>
                <TableHead className="text-xs font-semibold">ID Averbação</TableHead>
                <TableHead className="text-xs font-semibold">1ª Verificação</TableHead>
                <TableHead className="text-xs font-semibold">2ª Verificação</TableHead>
                <TableHead className="text-xs font-semibold">Status Final</TableHead>
                <TableHead className="text-xs font-semibold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {averbations.map(av => (
                <TableRow key={av.id}>
                  <TableCell className="text-sm font-medium">{av.client_name}</TableCell>
                  <TableCell className="text-sm">{av.convenio_name}</TableCell>
                  <TableCell className="text-sm font-mono">{av.averbation_id || "—"}</TableCell>
                  <TableCell>
                    <Badge className={`${
                      av.first_verification_status === "confirmed" ? "bg-emerald-100 text-emerald-700" :
                      av.first_verification_status === "failed" ? "bg-red-100 text-red-700" :
                      "bg-orange-100 text-orange-700"
                    } border-0 text-xs`}>
                      {av.first_verification_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${
                      av.second_verification_status === "confirmed" ? "bg-emerald-100 text-emerald-700" :
                      av.second_verification_status === "failed" ? "bg-red-100 text-red-700" :
                      "bg-orange-100 text-orange-700"
                    } border-0 text-xs`}>
                      {av.second_verification_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${
                      av.final_status === "verified" ? "bg-green-100 text-green-700" :
                      av.final_status === "discrepancy" ? "bg-red-100 text-red-700" :
                      "bg-slate-100 text-slate-700"
                    } border-0 text-xs`}>
                      {av.final_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg"
                          onClick={() => setSelectedAverbation(av)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Verificar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="rounded-2xl">
                        <DialogHeader>
                          <DialogTitle>Verificação de Averbação</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div>
                            <p className="text-sm font-medium text-slate-700 mb-1">Cliente</p>
                            <p className="text-sm text-slate-900">{av.client_name} - {av.client_cpf}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700 mb-1">Convênio</p>
                            <p className="text-sm text-slate-900">{av.convenio_name}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700 mb-1">ID Averbação</p>
                            <p className="text-sm font-mono bg-slate-100 p-2 rounded">{av.averbation_id || "Não informado"}</p>
                          </div>

                          <Textarea
                            placeholder="Notas da verificação (opcional)"
                            value={verificationNotes}
                            onChange={(e) => setVerificationNotes(e.target.value)}
                            className="rounded-xl"
                            rows={3}
                          />

                          {av.first_verification_status === "pending" && (
                            <div className="flex gap-3">
                              <Button
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                                onClick={() => verifyMutation.mutate({ averbationId: av.id, status: "confirmed", isSecondVerification: false })}
                                disabled={verifyMutation.isPending}
                              >
                                {verifyMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                Confirmar 1ª Verificação
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1 rounded-xl border-red-300 text-red-700 hover:bg-red-50"
                                onClick={() => verifyMutation.mutate({ averbationId: av.id, status: "failed", isSecondVerification: false })}
                                disabled={verifyMutation.isPending}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Não Encontrado
                              </Button>
                            </div>
                          )}

                          {av.first_verification_status === "confirmed" && av.second_verification_status === "pending" && (
                            <div className="flex gap-3">
                              <Button
                                className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-xl"
                                onClick={() => verifyMutation.mutate({ averbationId: av.id, status: "confirmed", isSecondVerification: true })}
                                disabled={verifyMutation.isPending}
                              >
                                {verifyMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                Confirmar 2ª Verificação
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1 rounded-xl border-red-300 text-red-700 hover:bg-red-50"
                                onClick={() => verifyMutation.mutate({ averbationId: av.id, status: "failed", isSecondVerification: true })}
                                disabled={verifyMutation.isPending}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Discrepância
                              </Button>
                            </div>
                          )}

                          {av.final_status === "verified" && (
                            <Alert className="border-emerald-200 bg-emerald-50">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              <AlertDescription className="text-emerald-900 text-sm">
                                Averbação verificada e confirmada por dupla verificação.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}