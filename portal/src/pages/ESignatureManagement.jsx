import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileSignature, Plus, CheckCircle, AlertCircle, Activity } from "lucide-react";
import { toast } from "sonner";

export default function ESignatureManagement() {
  const [isAddingProvider, setIsAddingProvider] = useState(false);
  const [newProvider, setNewProvider] = useState({
    provider_name: "",
    api_key: "",
    api_secret: "",
    environment: "sandbox",
    is_primary: false,
    priority: 0,
  });

  const queryClient = useQueryClient();

  const { data: providers = [] } = useQuery({
    queryKey: ["esignature_providers"],
    queryFn: () => base44.entities.ESignatureConfig.list(),
  });

  const { data: requests = [] } = useQuery({
    queryKey: ["signature_requests"],
    queryFn: () => base44.entities.SignatureRequest.list("-created_date", 50),
  });

  const createProviderMutation = useMutation({
    mutationFn: (data) => base44.entities.ESignatureConfig.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["esignature_providers"] });
      setIsAddingProvider(false);
      setNewProvider({
        provider_name: "",
        api_key: "",
        api_secret: "",
        environment: "sandbox",
        is_primary: false,
        priority: 0,
      });
      toast.success("Provedor adicionado!");
    },
  });

  const toggleProviderMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.ESignatureConfig.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["esignature_providers"] });
      toast.success("Status atualizado!");
    },
  });

  const handleAddProvider = (e) => {
    e.preventDefault();
    createProviderMutation.mutate(newProvider);
  };

  const getHealthBadge = (status) => {
    const config = {
      healthy: { label: "Saudável", className: "bg-green-100 text-green-700" },
      degraded: { label: "Degradado", className: "bg-yellow-100 text-yellow-700" },
      down: { label: "Indisponível", className: "bg-red-100 text-red-700" },
      unknown: { label: "Desconhecido", className: "bg-slate-100 text-slate-700" },
    };
    const { label, className } = config[status] || config.unknown;
    return <Badge className={className}>{label}</Badge>;
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { label: "Pendente", variant: "outline" },
      sent: { label: "Enviado", variant: "secondary" },
      viewed: { label: "Visualizado", variant: "secondary" },
      partially_signed: { label: "Parcialmente Assinado", variant: "secondary" },
      signed: { label: "Assinado", variant: "default" },
      rejected: { label: "Rejeitado", variant: "destructive" },
      expired: { label: "Expirado", variant: "destructive" },
      cancelled: { label: "Cancelado", variant: "outline" },
    };
    const { label, variant } = config[status] || config.pending;
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Assinatura Digital</h1>
          <p className="text-slate-600 mt-1">Gerencie provedores e requisições de assinatura</p>
        </div>
        <Dialog open={isAddingProvider} onOpenChange={setIsAddingProvider}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Provedor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Provedor de Assinatura</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddProvider} className="space-y-4">
              <div className="space-y-2">
                <Label>Provedor *</Label>
                <Select
                  value={newProvider.provider_name}
                  onValueChange={(value) => setNewProvider({ ...newProvider, provider_name: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DocuSign">DocuSign</SelectItem>
                    <SelectItem value="ClickSign">ClickSign</SelectItem>
                    <SelectItem value="D4Sign">D4Sign</SelectItem>
                    <SelectItem value="ZapSign">ZapSign</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>API Key *</Label>
                <Input
                  value={newProvider.api_key}
                  onChange={(e) => setNewProvider({ ...newProvider, api_key: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>API Secret</Label>
                <Input
                  type="password"
                  value={newProvider.api_secret}
                  onChange={(e) => setNewProvider({ ...newProvider, api_secret: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Ambiente</Label>
                <Select
                  value={newProvider.environment}
                  onValueChange={(value) => setNewProvider({ ...newProvider, environment: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">Sandbox</SelectItem>
                    <SelectItem value="production">Produção</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Prioridade (menor = mais prioritário)</Label>
                <Input
                  type="number"
                  value={newProvider.priority}
                  onChange={(e) => setNewProvider({ ...newProvider, priority: parseInt(e.target.value) })}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={newProvider.is_primary}
                  onCheckedChange={(checked) => setNewProvider({ ...newProvider, is_primary: checked })}
                />
                <Label>Provedor Principal</Label>
              </div>

              <Button type="submit" className="w-full" disabled={createProviderMutation.isPending}>
                {createProviderMutation.isPending ? "Salvando..." : "Salvar Provedor"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {providers.map((provider) => (
          <Card key={provider.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileSignature className="w-5 h-5" />
                    {provider.provider_name}
                  </CardTitle>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={provider.environment === "production" ? "default" : "secondary"}>
                      {provider.environment}
                    </Badge>
                    {provider.is_primary && <Badge className="bg-blue-100 text-blue-700">Principal</Badge>}
                  </div>
                </div>
                <Switch
                  checked={provider.is_active}
                  onCheckedChange={(checked) =>
                    toggleProviderMutation.mutate({ id: provider.id, is_active: checked })
                  }
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Status:</span>
                {getHealthBadge(provider.health_status)}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Prioridade:</span>
                <span className="font-medium">{provider.priority}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Sucessos:</span>
                <span className="text-green-600 font-medium">{provider.success_count || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Falhas:</span>
                <span className="text-red-600 font-medium">{provider.failure_count || 0}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Requisições de Assinatura Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {requests.length === 0 ? (
              <p className="text-center py-8 text-slate-500">Nenhuma requisição ainda</p>
            ) : (
              requests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">Proposta #{request.proposal_id?.slice(0, 8)}</div>
                    <div className="text-sm text-slate-600">
                      {request.provider_used} • {request.signers?.length || 0} signatários
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {new Date(request.created_date).toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <div>{getStatusBadge(request.status)}</div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}