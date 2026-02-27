import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Users, Plus, Search, TrendingUp, Award, Calendar, Eye, Briefcase
} from "lucide-react";

const departmentColors = {
  comercial: "bg-blue-100 text-blue-700",
  marketing: "bg-purple-100 text-purple-700",
  backoffice: "bg-amber-100 text-amber-700",
  tecnologia: "bg-emerald-100 text-emerald-700",
  convenios: "bg-indigo-100 text-indigo-700",
  compliance_juridico: "bg-red-100 text-red-700",
  financeiro: "bg-green-100 text-green-700",
  rh: "bg-pink-100 text-pink-700",
  produtos_processos: "bg-cyan-100 text-cyan-700",
  relacionamento_cliente: "bg-orange-100 text-orange-700",
};

const statusColors = {
  ativo: "bg-emerald-100 text-emerald-700",
  ferias: "bg-blue-100 text-blue-700",
  afastado: "bg-amber-100 text-amber-700",
  desligado: "bg-slate-100 text-slate-600",
};

export default function HREmployees() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [newEmployee, setNewEmployee] = useState({
    full_name: "",
    cpf: "",
    email: "",
    phone: "",
    department: "comercial",
    position: "",
    level: "junior",
    hire_date: "",
    base_salary: "",
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list("-hire_date"),
  });

  const createEmployeeMutation = useMutation({
    mutationFn: (data) => base44.entities.Employee.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setIsCreating(false);
      setNewEmployee({
        full_name: "",
        cpf: "",
        email: "",
        phone: "",
        department: "comercial",
        position: "",
        level: "junior",
        hire_date: "",
        base_salary: "",
      });
    },
  });

  // Filtros
  const filteredEmployees = employees.filter(emp => {
    const matchSearch = emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       emp.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDepartment = filterDepartment === "all" || emp.department === filterDepartment;
    return matchSearch && matchDepartment;
  });

  // KPIs
  const activeEmployees = employees.filter(e => e.status === "ativo").length;
  const avgPerformance = employees.length > 0
    ? (employees.reduce((sum, e) => sum + (e.performance_score || 0), 0) / employees.length).toFixed(1)
    : 0;
  const withPDI = employees.filter(e => e.pdi_active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Colaboradores</h1>
          <p className="text-slate-500 text-sm mt-1">
            Gestão de equipe, performance e desenvolvimento
          </p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button className="rounded-lg">
              <Plus className="w-4 h-4 mr-2" />
              Novo Colaborador
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Cadastrar Colaborador</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <Label>Nome Completo *</Label>
                <Input
                  value={newEmployee.full_name}
                  onChange={(e) => setNewEmployee({...newEmployee, full_name: e.target.value})}
                  className="rounded-lg mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>CPF</Label>
                  <Input
                    value={newEmployee.cpf}
                    onChange={(e) => setNewEmployee({...newEmployee, cpf: e.target.value})}
                    className="rounded-lg mt-1"
                  />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={newEmployee.phone}
                    onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})}
                    className="rounded-lg mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>Email Corporativo *</Label>
                <Input
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                  className="rounded-lg mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Departamento</Label>
                  <Select 
                    value={newEmployee.department} 
                    onValueChange={(v) => setNewEmployee({...newEmployee, department: v})}
                  >
                    <SelectTrigger className="rounded-lg mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comercial">Comercial</SelectItem>
                      <SelectItem value="marketing">Marketing & CX</SelectItem>
                      <SelectItem value="convenios">Convênios</SelectItem>
                      <SelectItem value="backoffice">Backoffice</SelectItem>
                      <SelectItem value="financeiro">Financeiro</SelectItem>
                      <SelectItem value="compliance_juridico">Compliance & Jurídico</SelectItem>
                      <SelectItem value="tecnologia">Tecnologia</SelectItem>
                      <SelectItem value="rh">RH</SelectItem>
                      <SelectItem value="produtos_processos">Produtos & Processos</SelectItem>
                      <SelectItem value="relacionamento_cliente">Relacionamento Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Nível</Label>
                  <Select 
                    value={newEmployee.level} 
                    onValueChange={(v) => setNewEmployee({...newEmployee, level: v})}
                  >
                    <SelectTrigger className="rounded-lg mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="estagiario">Estagiário</SelectItem>
                      <SelectItem value="junior">Júnior</SelectItem>
                      <SelectItem value="pleno">Pleno</SelectItem>
                      <SelectItem value="senior">Sênior</SelectItem>
                      <SelectItem value="coordenador">Coordenador</SelectItem>
                      <SelectItem value="gerente">Gerente</SelectItem>
                      <SelectItem value="diretor">Diretor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Cargo *</Label>
                <Input
                  value={newEmployee.position}
                  onChange={(e) => setNewEmployee({...newEmployee, position: e.target.value})}
                  placeholder="Ex: Analista Comercial"
                  className="rounded-lg mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Data de Admissão</Label>
                  <Input
                    type="date"
                    value={newEmployee.hire_date}
                    onChange={(e) => setNewEmployee({...newEmployee, hire_date: e.target.value})}
                    className="rounded-lg mt-1"
                  />
                </div>
                <div>
                  <Label>Salário Base</Label>
                  <Input
                    type="number"
                    value={newEmployee.base_salary}
                    onChange={(e) => setNewEmployee({...newEmployee, base_salary: e.target.value})}
                    placeholder="R$ 0,00"
                    className="rounded-lg mt-1"
                  />
                </div>
              </div>
              <Button 
                onClick={() => createEmployeeMutation.mutate(newEmployee)} 
                className="w-full rounded-lg"
                disabled={!newEmployee.full_name || !newEmployee.email || !newEmployee.position}
              >
                Cadastrar Colaborador
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
                <p className="text-sm text-slate-500">Colaboradores Ativos</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{activeEmployees}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Performance Média</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{avgPerformance}%</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Com PDI Ativo</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{withPDI}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Headcount</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{employees.length}</p>
              </div>
              <div className="p-3 bg-slate-100 rounded-lg">
                <Briefcase className="w-5 h-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="rounded-xl border-slate-100">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-lg"
              />
            </div>
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger className="w-48 rounded-lg">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Departamentos</SelectItem>
                <SelectItem value="comercial">Comercial</SelectItem>
                <SelectItem value="marketing">Marketing & CX</SelectItem>
                <SelectItem value="convenios">Convênios</SelectItem>
                <SelectItem value="backoffice">Backoffice</SelectItem>
                <SelectItem value="financeiro">Financeiro</SelectItem>
                <SelectItem value="compliance_juridico">Compliance & Jurídico</SelectItem>
                <SelectItem value="tecnologia">Tecnologia</SelectItem>
                <SelectItem value="rh">RH</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Colaboradores */}
      <Card className="rounded-xl border-slate-100">
        <CardHeader>
          <CardTitle className="text-sm">Colaboradores ({filteredEmployees.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredEmployees.map(employee => (
              <div key={employee.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {employee.full_name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-slate-900">{employee.full_name}</p>
                      <Badge className={statusColors[employee.status || "ativo"]}>
                        {employee.status || "ativo"}
                      </Badge>
                      {employee.pdi_active && (
                        <Badge className="bg-purple-100 text-purple-700">PDI</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span>{employee.position}</span>
                      <span>•</span>
                      <Badge className={departmentColors[employee.department]} variant="outline">
                        {employee.department?.replace("_", " ")}
                      </Badge>
                      <span>•</span>
                      <span className="capitalize">{employee.level}</span>
                      {employee.hire_date && (
                        <>
                          <span>•</span>
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(employee.hire_date).toLocaleDateString('pt-BR')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {employee.performance_score > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Performance</p>
                      <p className="text-sm font-bold text-blue-600">{employee.performance_score}%</p>
                    </div>
                  )}
                </div>
                <Button size="sm" variant="ghost" className="rounded-lg ml-2">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}