import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function LegalBI() {
  const { data: processes = [] } = useQuery({
    queryKey: ["legal_bi_processes"],
    queryFn: () => base44.entities.LegalProcess.list(),
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ["legal_bi_audit"],
    queryFn: () => base44.entities.AuditLog.list(),
  });

  // Status Distribution
  const statusCounts = processes.reduce((acc, p) => {
    const status = p.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status.replace(/_/g, ' '),
    value: count,
  }));

  // Timeline - Processes by month
  const monthCounts = {};
  processes.forEach(p => {
    if (p.created_date) {
      const month = new Date(p.created_date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    }
  });

  const timelineData = Object.entries(monthCounts)
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .slice(-12)
    .map(([month, count]) => ({
      month,
      count,
    }));

  // Audit Activity
  const auditCounts = auditLogs.reduce((acc, log) => {
    const action = log.action || 'other';
    acc[action] = (acc[action] || 0) + 1;
    return acc;
  }, {});

  const auditData = Object.entries(auditCounts)
    .slice(0, 6)
    .map(([action, count]) => ({
      action: action.replace(/_/g, ' '),
      count,
    }));

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Analytics Jurídico</h1>
        <p className="text-slate-600 mt-2">Análise de processos e atividades legais</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total de Processos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{processes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Em Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {processes.filter(p => p.status === 'open' || p.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Encerrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {processes.filter(p => p.status === 'closed' || p.status === 'resolved').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Atividades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{auditLogs.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        {statusData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Distribuição por Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Activity Timeline */}
        {auditData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Atividades por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={auditData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="action" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Timeline */}
      {timelineData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Processos por Período</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}