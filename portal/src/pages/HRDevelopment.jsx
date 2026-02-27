import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  TrendingUp, Plus, Target, Award, CheckCircle2, Clock, Users, Eye
} from "lucide-react";

const statusColors = {
  rascunho: "bg-slate-100 text-slate-600",
  em_andamento: "bg-blue-100 text-blue-700",
  concluido: "bg-emerald-100 text-emerald-700",
  cancelado: "bg-red-100 text-red-700",
};

export default function HRDevelopment() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [newPDI, setNewPDI] = useState({
    employee_name: "",
    period: "",
    career_goal: "",
    start_date: "",
    end_date: "",
  });

  const { data: pdis = [] } = useQuery({
    queryKey: ["pdis"],
    queryFn: () => base44.entities.PDI.list("-created_date"),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  const createPDIMutation = useMutation({
    mutationFn: (data) => base44.entities.PDI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdis"] });
      setIsCreating(false);
      setNewPDI({
        employee_name: "",
        period: "",
        career_goal: "",
        start_date: "",
        end_date: "",
      });
    },
  });

  // KPIs
  const activePDIs = pdis.filter(p => p.status === "em_andamento").length;
  const completedPDIs = pdis.filter(p => p.status === "concluido").length;
  const avgProgress = pdis.length > 0
    ? (pdis.reduce((sum, p) => sum + (p.overall_progress || 0), 0) / pdis.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">PDI & Desenvolvimento</h1>
          <p className="text-slate-500 text-sm mt-1">
            Planos de Desenvolvimento Individual e gestão de carreira
          </p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button className="rounded-lg">
              <Plus className="w-4 h-4 mr-2" />
              Novo PDI
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Criar Novo PDI</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Colaborador *</Label>
                <Select 
                  value={newPDI.employee_name} 
                  onValueChange={(v) => {
                    const employee = employees.find(e => e.full_name === v);
                    setNewPDI({...newPDI, employee_name: v, employee_id: employee?.id});
                  }}
                >
                  <SelectTrigger className="rounded-lg mt-1">
                    <SelectValue placeholder="Selecione o colaborador" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.filter(e => e.status === "ativo").map(emp => (
                      <SelectItem key={emp.id} value={emp.full_name}>
                        {emp.full_name} - {emp.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Período *</Label>
                <Input
                  value={newPDI.period}
                  onChange={(e) => setNewPDI({...newPDI, period: e.target.value})}
                  placeholder="Ex: 2026 Q1"
                  className="rounded-lg mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Data Início</Label>
                  <Input
                    type="date"
                    value={newPDI.start_date}
                    onChange={(e) => setNewPDI({...newPDI, start_date: e.target.value})}
                    className="rounded-lg mt-1"
                  />
                </div>
                <div>
                  <Label>Data Fim</Label>
                  <Input
                    type="date"
                    value={newPDI.end_date}
                    onChange={(e) => setNewPDI({...newPDI, end_date: e.target.value})}
                    className="rounded-lg mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>Objetivo de Carreira</Label>
                <Textarea
                  value={newPDI.career_goal}
                  onChange={(e) => setNewPDI({...newPDI, career_goal: e.target.value})}
                  placeholder="Descreva o objetivo de carreira de longo prazo..."
                  className="rounded-lg mt-1"
                  rows={3}
                />
              </div>
              <Button 
                onClick={() => createPDIMutation.mutate({...newPDI, status: "em_andamento"})} 
                className="w-full rounded-lg"
                disabled={!newPDI.employee_name || !newPDI.period}
              >
                Criar PDI
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">PDIs Ativos</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{activePDIs}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">PDIs Concluídos</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{completedPDIs}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Progresso Médio</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{avgProgress}%</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total PDIs</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{pdis.length}</p>
              </div>
              <div className="p-3 bg-slate-100 rounded-lg">
                <Award className="w-5 h-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de PDIs */}
      <Card className="rounded-xl border-slate-100">
        <CardHeader>
          <CardTitle className="text-sm">Planos de Desenvolvimento Individual ({pdis.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pdis.map(pdi => (
              <div key={pdi.id} className="border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mt-0.5">
                      <Users className="w-5 h-5 text-purple-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-900">{pdi.employee_name}</p>
                      <p className="text-xs text-slate-500">{pdi.period}</p>
                    </div>
                  </div>
                  <Badge className={statusColors[pdi.status]}>
                    {pdi.status?.replace("_", " ")}
                  </Badge>
                </div>

                {pdi.career_goal && (
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Objetivo de Carreira:</p>
                    <p className="text-sm text-slate-700">{pdi.career_goal}</p>
                  </div>
                )}

                {pdi.overall_progress !== undefined && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Progresso Geral</span>
                      <span className="font-semibold text-slate-700">{pdi.overall_progress}%</span>
                    </div>
                    <Progress value={pdi.overall_progress} className="h-2" />
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t">
                  <Button size="sm" variant="outline" className="flex-1 rounded-lg text-xs">
                    <Eye className="w-3 h-3 mr-1" />
                    Ver Detalhes
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 rounded-lg text-xs">
                    <Target className="w-3 h-3 mr-1" />
                    Atualizar Progresso
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}