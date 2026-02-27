import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Upload, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Trash2,
  FolderOpen,
  Users,
  Building2,
  Database,
  Cloud,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Shield,
  History,
  Lock,
  FileCheck,
  ShieldAlert
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const documentTypeLabels = {
  holerite: "Holerite",
  ccb: "CCB",
  comprovante_averbacao: "Comp. Averbação",
  rg: "RG",
  cpf: "CPF",
  comprovante_residencia: "Comp. Residência",
  contracheque: "Contracheque",
  certidao_negativa: "Certidão Negativa",
  decreto_convenio: "Decreto Convênio",
  termo_credenciamento: "Termo Credenciamento",
  contrato_gestora: "Contrato Gestora",
  alvara: "Alvará",
  contrato_social: "Contrato Social",
  procuracao: "Procuração",
  outro: "Outro",
};

const statusConfig = {
  valid: { label: "Válido", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  expired: { label: "Expirado", color: "bg-red-100 text-red-700", icon: XCircle },
  pending_review: { label: "Em Análise", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  rejected: { label: "Rejeitado", color: "bg-red-100 text-red-700", icon: XCircle },
  archived: { label: "Arquivado", color: "bg-slate-100 text-slate-600", icon: FolderOpen },
};

export default function DocumentManager() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOwnerType, setFilterOwnerType] = useState("all");
  const [filterDocType, setFilterDocType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    document_type: "",
    owner_type: "client",
    owner_id: "",
    owner_name: "",
    file: null,
    classification: "internal",
    retention_period_days: "",
    approval_required: false,
  });

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: () => base44.entities.Document.list("-upload_date", 1000),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients_list"],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: convenios = [] } = useQuery({
    queryKey: ["convenios_list"],
    queryFn: () => base44.entities.ConvenioConfig.list(),
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData) => {
      const currentUser = await base44.auth.me();
      
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file: formData.file });
      
      // Calcular hash do arquivo (simulado - em produção seria real)
      const fileHash = `sha256-${Date.now()}-${formData.file.name}`;
      
      // Calcular data de retenção
      const retentionExpiryDate = formData.retention_period_days 
        ? new Date(Date.now() + formData.retention_period_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : null;
      
      // Create document record with GED fields
      await base44.entities.Document.create({
        document_type: formData.document_type,
        owner_type: formData.owner_type,
        owner_id: formData.owner_id,
        owner_name: formData.owner_name,
        file_url,
        file_name: formData.file.name,
        file_size: formData.file.size,
        file_format: formData.file.name.split(".").pop(),
        file_hash: fileHash,
        upload_date: new Date().toISOString(),
        status: "pending_review",
        storage_provider: "base44",
        uploaded_by: currentUser.email,
        // GED fields
        version: 1,
        is_latest_version: true,
        classification: formData.classification,
        access_control: [currentUser.email],
        retention_period_days: formData.retention_period_days ? parseInt(formData.retention_period_days) : null,
        retention_expiry_date: retentionExpiryDate,
        can_be_deleted: !formData.retention_period_days,
        access_count: 0,
        workflow_status: formData.approval_required ? "pending_approval" : "draft",
        approval_required: formData.approval_required,
        is_signed: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setUploadOpen(false);
      setUploadForm({
        document_type: "",
        owner_type: "client",
        owner_id: "",
        owner_name: "",
        file: null,
        classification: "internal",
        retention_period_days: "",
        approval_required: false,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (doc) => {
      // Verificar se pode ser deletado (GED - retenção)
      if (!doc.can_be_deleted) {
        throw new Error("Documento em período de retenção legal. Não pode ser deletado.");
      }
      
      // Registrar acesso de deleção
      await base44.entities.DocumentAccess.create({
        document_id: doc.id,
        document_name: doc.file_name,
        document_type: doc.document_type,
        accessed_by: (await base44.auth.me()).email,
        access_type: "delete",
        access_date: new Date().toISOString(),
        owner_id: doc.owner_id,
        classification: doc.classification,
      });
      
      await base44.entities.Document.delete(doc.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] }),
  });

  const filteredDocuments = documents.filter(doc => {
    const matchSearch = 
      doc.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.owner_cpf?.includes(searchTerm) ||
      doc.file_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchOwnerType = filterOwnerType === "all" || doc.owner_type === filterOwnerType;
    const matchDocType = filterDocType === "all" || doc.document_type === filterDocType;
    const matchStatus = filterStatus === "all" || doc.status === filterStatus;
    
    return matchSearch && matchOwnerType && matchDocType && matchStatus;
  });

  // Stats
  const totalDocs = documents.length;
  const clientDocs = documents.filter(d => d.owner_type === "client").length;
  const convenioDocs = documents.filter(d => d.owner_type === "convenio").length;
  const pendingReview = documents.filter(d => d.status === "pending_review").length;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadForm(prev => ({ ...prev, file }));
    }
  };

  const handleUpload = () => {
    if (!uploadForm.file || !uploadForm.document_type || !uploadForm.owner_id) return;
    uploadMutation.mutate(uploadForm);
  };

  if (isLoading) {
    return <Skeleton className="h-96 rounded-2xl" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gerenciador de Documentos</h1>
          <p className="text-slate-500 text-sm mt-1">Central de documentos de clientes, convênios e propostas</p>
        </div>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl">
              <Upload className="w-4 h-4 mr-2" />
              Upload Documento
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Upload de Documento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo de Documento</label>
                <Select value={uploadForm.document_type} onValueChange={v => setUploadForm(prev => ({ ...prev, document_type: v }))}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(documentTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Tipo de Proprietário</label>
                <Select value={uploadForm.owner_type} onValueChange={v => setUploadForm(prev => ({ ...prev, owner_type: v, owner_id: "", owner_name: "" }))}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Cliente</SelectItem>
                    <SelectItem value="convenio">Convênio</SelectItem>
                    <SelectItem value="proposal">Proposta</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {uploadForm.owner_type === "client" && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Cliente</label>
                  <Select value={uploadForm.owner_id} onValueChange={v => {
                    const client = clients.find(c => c.id === v);
                    setUploadForm(prev => ({ ...prev, owner_id: v, owner_name: client?.full_name, owner_cpf: client?.cpf }));
                  }}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.full_name} - {c.cpf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {uploadForm.owner_type === "convenio" && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Convênio</label>
                  <Select value={uploadForm.owner_id} onValueChange={v => {
                    const convenio = convenios.find(c => c.id === v);
                    setUploadForm(prev => ({ ...prev, owner_id: v, owner_name: convenio?.convenio_name }));
                  }}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Selecione o convênio" />
                    </SelectTrigger>
                    <SelectContent>
                      {convenios.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.convenio_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-2 block">Arquivo</label>
                <Input type="file" onChange={handleFileChange} className="rounded-xl" accept=".pdf,.jpg,.jpeg,.png" />
                {uploadForm.file && (
                  <p className="text-xs text-slate-500 mt-1">{uploadForm.file.name} ({(uploadForm.file.size / 1024).toFixed(0)} KB)</p>
                )}
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  Controles GED
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium mb-1.5 block text-slate-600">Classificação de Segurança</label>
                    <Select value={uploadForm.classification} onValueChange={v => setUploadForm(prev => ({ ...prev, classification: v }))}>
                      <SelectTrigger className="rounded-lg h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">🌐 Público</SelectItem>
                        <SelectItem value="internal">🏢 Interno</SelectItem>
                        <SelectItem value="confidential">🔒 Confidencial</SelectItem>
                        <SelectItem value="restricted">🚫 Restrito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-medium mb-1.5 block text-slate-600">Retenção (dias)</label>
                    <Input
                      type="number"
                      value={uploadForm.retention_period_days}
                      onChange={e => setUploadForm(prev => ({ ...prev, retention_period_days: e.target.value }))}
                      className="rounded-lg h-9 text-sm"
                      placeholder="Ex: 1825 (5 anos)"
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 bg-slate-50 rounded-lg p-3">
                  <input
                    type="checkbox"
                    id="approval_required"
                    checked={uploadForm.approval_required}
                    onChange={e => setUploadForm(prev => ({ ...prev, approval_required: e.target.checked }))}
                    className="rounded"
                  />
                  <label htmlFor="approval_required" className="text-xs text-slate-700 cursor-pointer">
                    <FileCheck className="w-3 h-3 inline mr-1" />
                    Requer aprovação antes de uso
                  </label>
                </div>
              </div>

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl"
                onClick={handleUpload}
                disabled={!uploadForm.file || !uploadForm.document_type || !uploadForm.owner_id || uploadMutation.isPending}
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploadMutation.isPending ? "Enviando..." : "Fazer Upload"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Alert className="border-blue-200 bg-blue-50">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900 text-sm">
          <strong>GED (Gerenciamento Eletrônico de Documentos):</strong> Versionamento, controle de acesso, workflow de aprovação, auditoria completa, retenção legal e classificação de segurança.
          <br />
          <span className="text-blue-700">🔒 Compliance com LGPD e normas de retenção documental</span>
        </AlertDescription>
      </Alert>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-500 uppercase">Total Documentos</p>
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{totalDocs}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-500 uppercase">Docs Clientes</p>
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-700">{clientDocs}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-500 uppercase">Docs Convênios</p>
              <Building2 className="w-4 h-4 text-violet-600" />
            </div>
            <p className="text-2xl font-bold text-violet-700">{convenioDocs}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-500 uppercase">Em Análise</p>
              <Clock className="w-4 h-4 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-orange-700">{pendingReview}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="rounded-2xl border-slate-100">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 rounded-xl"
                  placeholder="Buscar por nome, CPF, arquivo..."
                />
              </div>
            </div>

            <Select value={filterOwnerType} onValueChange={setFilterOwnerType}>
              <SelectTrigger className="w-40 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="client">Clientes</SelectItem>
                <SelectItem value="convenio">Convênios</SelectItem>
                <SelectItem value="proposal">Propostas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterDocType} onValueChange={setFilterDocType}>
              <SelectTrigger className="w-48 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                {Object.entries(documentTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                {Object.entries(statusConfig).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card className="rounded-2xl border-slate-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-600" /> 
            Documentos ({filteredDocuments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <p className="text-center py-8 text-slate-400 text-sm">Nenhum documento encontrado</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="text-xs font-semibold">Tipo</TableHead>
                    <TableHead className="text-xs font-semibold">Proprietário</TableHead>
                    <TableHead className="text-xs font-semibold">Arquivo</TableHead>
                    <TableHead className="text-xs font-semibold">GED</TableHead>
                    <TableHead className="text-xs font-semibold">Upload</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map(doc => {
                    const Icon = statusConfig[doc.status]?.icon || Clock;
                    return (
                      <TableRow key={doc.id} className="hover:bg-slate-50/50">
                        <TableCell>
                          <Badge className="bg-slate-100 text-slate-700 border-0 text-xs">
                            {documentTypeLabels[doc.document_type]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{doc.owner_name}</p>
                            <p className="text-xs text-slate-500">{doc.owner_type} {doc.owner_cpf ? `• ${doc.owner_cpf}` : ""}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm text-slate-900">{doc.file_name}</p>
                            <p className="text-xs text-slate-500">
                              {doc.file_format?.toUpperCase()} • {doc.file_size ? (doc.file_size / 1024).toFixed(0) : "?"} KB
                              {doc.version > 1 && ` • v${doc.version}`}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge className={`${
                              doc.classification === 'restricted' ? 'bg-red-100 text-red-700' :
                              doc.classification === 'confidential' ? 'bg-orange-100 text-orange-700' :
                              doc.classification === 'internal' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-600'
                            } border-0 text-xs flex items-center gap-1 w-fit`}>
                              <Shield className="w-3 h-3" />
                              {doc.classification === 'restricted' ? 'Restrito' :
                               doc.classification === 'confidential' ? 'Confidencial' :
                               doc.classification === 'internal' ? 'Interno' : 'Público'}
                            </Badge>
                            {doc.retention_period_days && (
                              <Badge className="bg-purple-100 text-purple-700 border-0 text-xs flex items-center gap-1 w-fit">
                                <Lock className="w-3 h-3" />
                                Retenção: {doc.retention_period_days}d
                              </Badge>
                            )}
                            {doc.approval_required && doc.workflow_status === 'pending_approval' && (
                              <Badge className="bg-yellow-100 text-yellow-700 border-0 text-xs flex items-center gap-1 w-fit">
                                <Clock className="w-3 h-3" />
                                Aguarda Aprovação
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          <div>
                            <p>{doc.upload_date ? format(new Date(doc.upload_date), "dd/MM/yyyy") : "—"}</p>
                            {doc.access_count > 0 && (
                              <p className="text-xs text-slate-500">
                                <Eye className="w-3 h-3 inline mr-0.5" />
                                {doc.access_count} acessos
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusConfig[doc.status]?.color || "bg-slate-100 text-slate-600"} border-0 text-xs flex items-center gap-1 w-fit`}>
                            <Icon className="w-3 h-3" />
                            {statusConfig[doc.status]?.label || doc.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => window.open(doc.file_url, "_blank")}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            {doc.can_be_deleted ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => deleteMutation.mutate(doc)}
                                title="Deletar documento"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-slate-400 cursor-not-allowed"
                                disabled
                                title="Documento em retenção legal - não pode ser deletado"
                              >
                                <Lock className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}