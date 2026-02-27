import React from "react";
import {
  Clock,
  AlertTriangle,
  FileText,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const WIDGET_DEFINITIONS = {
  open_proposals: {
    title: "Propostas em Aberto",
    icon: FileText,
    description: "Propostas aguardando ação",
    color: "blue",
  },
  active_contracts: {
    title: "Contratos Ativos",
    icon: CheckCircle2,
    description: "Contratos em vigência",
    color: "green",
  },
  overdue: {
    title: "Em Atraso",
    icon: AlertTriangle,
    description: "Contratos com atraso",
    color: "red",
  },
  critical_alerts: {
    title: "Alertas Críticos",
    icon: AlertCircle,
    description: "Situações que requerem ação imediata",
    color: "orange",
  },
  daily_queue: {
    title: "Fila do Dia",
    icon: Clock,
    description: "Tarefas de hoje",
    color: "blue",
  },
  active_alerts: {
    title: "Alertas Ativos",
    icon: AlertTriangle,
    description: "Alertas do sistema",
    color: "orange",
  },
  daily_report: {
    title: "Relatório Diário",
    icon: BarChart3,
    description: "Métricas do dia",
    color: "purple",
  },
  proposals_by_stage: {
    title: "Propostas por Etapa",
    icon: TrendingUp,
    description: "Distribuição por status",
    color: "indigo",
  },
  proposal_analysis: {
    title: "Análise de Propostas",
    icon: BarChart3,
    description: "Gráfico de etapas",
    color: "cyan",
  },
  credit_decision: {
    title: "Decisão de Crédito",
    icon: CheckCircle2,
    description: "Pendente, Aprovada, Reprovada",
    color: "emerald",
  },
};

export const PRESET_LAYOUTS = [
  {
    name: "Executivo",
    description: "Visão geral para gestores",
    widgets: [
      { type: "critical_alerts", position: 0, size: "small" },
      { type: "open_proposals", position: 1, size: "small" },
      { type: "active_contracts", position: 2, size: "small" },
      { type: "overdue", position: 3, size: "small" },
      { type: "daily_queue", position: 4, size: "medium" },
      { type: "active_alerts", position: 5, size: "medium" },
      { type: "credit_decision", position: 6, size: "large" },
    ],
  },
  {
    name: "Operacional",
    description: "Foco em execução e alertas",
    widgets: [
      { type: "daily_queue", position: 0, size: "medium" },
      { type: "active_alerts", position: 1, size: "medium" },
      { type: "open_proposals", position: 2, size: "small" },
      { type: "proposals_by_stage", position: 3, size: "medium" },
      { type: "critical_alerts", position: 4, size: "small" },
    ],
  },
  {
    name: "Analítico",
    description: "Foco em dados e análises",
    widgets: [
      { type: "proposal_analysis", position: 0, size: "large" },
      { type: "credit_decision", position: 1, size: "large" },
      { type: "daily_report", position: 2, size: "medium" },
      { type: "proposals_by_stage", position: 3, size: "medium" },
    ],
  },
  {
    name: "Minimalista",
    description: "Apenas o essencial",
    widgets: [
      { type: "critical_alerts", position: 0, size: "small" },
      { type: "open_proposals", position: 1, size: "small" },
      { type: "daily_queue", position: 2, size: "medium" },
      { type: "active_alerts", position: 3, size: "medium" },
    ],
  },
];