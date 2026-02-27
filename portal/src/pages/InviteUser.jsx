import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserPlus, CheckCircle, Clock, XCircle, Mail } from "lucide-react";
import { toast } from "sonner";

export default function InviteUser() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ["current_user"],
    queryFn: () => base44.auth.me(),
  });

  const { data: invitations = [], refetch } = useQuery({
    queryKey: ["invitations"],
    queryFn: () => base44.entities.UserInvitation.list("-created_date"),
  });

  const handleInvite = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await base44.functions.invoke("inviteUser", {
        email,
        full_name: fullName,
        role,
      });

      toast.success("Convite enviado com sucesso!");
      setEmail("");
      setFullName("");
      setRole("user");
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.error || "Erro ao enviar convite");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: { label: "Pendente", variant: "outline", icon: Clock },
      accepted: { label: "Aceito", variant: "default", icon: CheckCircle },
      expired: { label: "Expirado", variant: "destructive", icon: XCircle },
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  if (!currentUser) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Convidar Usuários</h1>
        <p className="text-slate-600 mt-1">Gerencie convites e acessos ao sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Novo Convite
          </CardTitle>
          <CardDescription>
            Envie um convite por email para adicionar novos usuários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo *</Label>
                <Input
                  id="fullName"
                  placeholder="João da Silva"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Nível de Acesso *</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  {currentUser.role === "admin" && (
                    <SelectItem value="admin">Administrador</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              <Mail className="w-4 h-4 mr-2" />
              {loading ? "Enviando..." : "Enviar Convite"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Convites Enviados</CardTitle>
          <CardDescription>
            Histórico de convites ({invitations.length})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Nenhum convite enviado ainda
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Convidado por</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell className="font-medium">{invite.full_name}</TableCell>
                      <TableCell>{invite.email}</TableCell>
                      <TableCell>
                        <Badge variant={invite.role === "admin" ? "default" : "secondary"}>
                          {invite.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(invite.status)}</TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {invite.invited_by}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {new Date(invite.created_date).toLocaleDateString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}