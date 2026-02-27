import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  Loader2,
  Trash2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ConvenioNotifications() {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["convenio_notifications"],
    queryFn: () => base44.entities.ConvenioStatusNotification.list("-created_date", 100),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) =>
      base44.entities.ConvenioStatusNotification.update(notificationId, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["convenio_notifications"] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId) =>
      base44.entities.ConvenioStatusNotification.delete(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["convenio_notifications"] });
    },
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const actionRequiredCount = notifications.filter(n => n.action_required && !n.is_read).length;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-700 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "low":
        return "bg-blue-100 text-blue-700 border-blue-300";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "critical":
      case "high":
        return <AlertTriangle className="w-4 h-4" />;
      case "medium":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "status_change":
      case "activation":
      case "deactivation":
        return <CheckCircle2 className="w-4 h-4" />;
      case "approval_needed":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return <Skeleton className="h-96 rounded-2xl" />;
  }

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const readNotifications = notifications.filter(n => n.is_read);
  const actionRequiredNotifications = notifications.filter(n => n.action_required);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Notificações de Convênios
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Acompanhe todas as mudanças de status e ações requeridas
        </p>
      </div>

      {actionRequiredCount > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900 text-sm">
            Você tem <strong>{actionRequiredCount}</strong> notificação(ões) que requer(em) ação
            imediata.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="unread" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="unread">
            Não Lidas ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="action">
            Requer Ação ({actionRequiredNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="read">
            Lidas ({readNotifications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unread" className="space-y-4 mt-4">
          {unreadNotifications.length === 0 ? (
            <Card className="rounded-2xl border-slate-200">
              <CardContent className="p-12 text-center">
                <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 mb-4">Todas as notificações foram lidas</p>
              </CardContent>
            </Card>
          ) : (
            unreadNotifications.map(notification => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkAsRead={() =>
                  markAsReadMutation.mutate(notification.id)
                }
                onDelete={() =>
                  deleteNotificationMutation.mutate(notification.id)
                }
                getPriorityColor={getPriorityColor}
                getPriorityIcon={getPriorityIcon}
                getNotificationIcon={getNotificationIcon}
                isLoading={
                  markAsReadMutation.isPending || deleteNotificationMutation.isPending
                }
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="action" className="space-y-4 mt-4">
          {actionRequiredNotifications.length === 0 ? (
            <Card className="rounded-2xl border-slate-200">
              <CardContent className="p-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
                <p className="text-slate-500 mb-4">Nenhuma ação requerida no momento</p>
              </CardContent>
            </Card>
          ) : (
            actionRequiredNotifications.map(notification => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkAsRead={() =>
                  markAsReadMutation.mutate(notification.id)
                }
                onDelete={() =>
                  deleteNotificationMutation.mutate(notification.id)
                }
                getPriorityColor={getPriorityColor}
                getPriorityIcon={getPriorityIcon}
                getNotificationIcon={getNotificationIcon}
                isLoading={
                  markAsReadMutation.isPending || deleteNotificationMutation.isPending
                }
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="read" className="space-y-4 mt-4">
          {readNotifications.length === 0 ? (
            <Card className="rounded-2xl border-slate-200">
              <CardContent className="p-12 text-center">
                <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 mb-4">Nenhuma notificação lida</p>
              </CardContent>
            </Card>
          ) : (
            readNotifications.map(notification => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onDelete={() =>
                  deleteNotificationMutation.mutate(notification.id)
                }
                getPriorityColor={getPriorityColor}
                getPriorityIcon={getPriorityIcon}
                getNotificationIcon={getNotificationIcon}
                isLoading={deleteNotificationMutation.isPending}
                isRead
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NotificationCard({
  notification,
  onMarkAsRead,
  onDelete,
  getPriorityColor,
  getPriorityIcon,
  getNotificationIcon,
  isLoading,
  isRead,
}) {
  const notificationTypeLabels = {
    status_change: "Mudança de Status",
    approval_needed: "Aprovação Necessária",
    activation: "Ativação",
    deactivation: "Desativação",
    contract_update: "Atualização de Contrato",
  };

  return (
    <Card className={`rounded-2xl border-slate-100 ${!isRead ? "bg-blue-50" : ""}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${getPriorityColor(notification.priority)}`}>
                {getPriorityIcon(notification.priority)}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{notification.convenio_name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {notificationTypeLabels[notification.notification_type]}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-700 my-3">{notification.message}</p>

            {notification.affected_areas && notification.affected_areas.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {notification.affected_areas.map(area => (
                  <Badge key={area} variant="outline" className="text-xs">
                    {area}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              {new Date(notification.created_date).toLocaleDateString("pt-BR")}{" "}
              {new Date(notification.created_date).toLocaleTimeString("pt-BR")}
            </div>

            {notification.action_required && !isRead && (
              <Alert className="border-orange-200 bg-orange-50 mt-3">
                <AlertTriangle className="h-3 w-3 text-orange-600" />
                <AlertDescription className="text-orange-900 text-xs">
                  Ação requerida: {notification.action_type || "revisar"}
                  {notification.action_deadline && (
                    <span>
                      {" "}
                      até{" "}
                      {new Date(notification.action_deadline).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex gap-2">
            {!isRead && (
              <Button
                size="sm"
                variant="outline"
                onClick={onMarkAsRead}
                disabled={isLoading}
                className="rounded-lg"
              >
                {isLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3 h-3" />
                )}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={onDelete}
              disabled={isLoading}
              className="rounded-lg text-red-600 border-red-300 hover:bg-red-50"
            >
              {isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Trash2 className="w-3 h-3" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}