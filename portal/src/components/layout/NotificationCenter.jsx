import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Bell, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => base44.entities.ConvenioStatusNotification.filter({ is_read: false }),
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  const unreadCount = notifications.length;

  const getPriorityColor = (priority) => {
    const colors = {
      low: "text-blue-600",
      medium: "text-yellow-600",
      high: "text-orange-600",
      critical: "text-red-600",
    };
    return colors[priority] || "text-slate-600";
  };

  const getPriorityBg = (priority) => {
    const colors = {
      low: "bg-blue-50",
      medium: "bg-yellow-50",
      high: "bg-orange-50",
      critical: "bg-red-50",
    };
    return colors[priority] || "bg-slate-50";
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500">
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg border border-slate-200 z-40 max-h-[500px] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Notificações</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Você está em dia!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map(notif => (
                  <NotificationItem
                    key={notif.id}
                    notification={notif}
                    priorityColor={getPriorityColor(notif.priority)}
                    priorityBg={getPriorityBg(notif.priority)}
                    onClose={() => setIsOpen(false)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function NotificationItem({ notification, priorityColor, priorityBg, onClose }) {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleMarkAsRead = async () => {
    setIsLoading(true);
    try {
      await base44.entities.ConvenioStatusNotification.update(notification.id, {
        is_read: true,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const priorityLabel = {
    low: "Baixa",
    medium: "Média",
    high: "Alta",
    critical: "Crítica",
  }[notification.priority];

  return (
    <div className={cn("p-4 hover:bg-slate-50 transition-colors", priorityBg)}>
      <div className="flex gap-3">
        <div className={cn("w-2 h-2 rounded-full mt-2 shrink-0", priorityColor)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-medium text-slate-900 text-sm">{notification.convenio_name}</h4>
            <span className={cn("text-xs font-medium", priorityColor)}>{priorityLabel}</span>
          </div>
          <p className="text-sm text-slate-600 mb-2">{notification.message}</p>
          {notification.action_deadline && (
            <p className="text-xs text-slate-500 mb-2">
              Prazo: {new Date(notification.action_deadline).toLocaleDateString("pt-BR")}
            </p>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleMarkAsRead}
            disabled={isLoading}
            className="text-xs rounded-lg"
          >
            {isLoading ? "..." : "Marcar como lida"}
          </Button>
        </div>
      </div>
    </div>
  );
}