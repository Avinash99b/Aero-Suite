import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Check, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useListNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export default function Notifications() {
  const { data: notifications, isLoading } = useListNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const queryClient = useQueryClient();

  const handleMarkRead = async (id: number) => {
    await markRead.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
  };

  const handleMarkAllRead = async () => {
    await markAllRead.mutateAsync();
    queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
  };

  const getIcon = (title: string) => {
    if (title.toLowerCase().includes('cancelled') || title.toLowerCase().includes('delayed')) return <AlertTriangle className="h-5 w-5 text-destructive" />;
    if (title.toLowerCase().includes('confirmed') || title.toLowerCase().includes('success')) return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    return <Info className="h-5 w-5 text-primary" />;
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-6 md:p-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground flex items-center gap-3">
              <Bell className="h-7 w-7 text-primary" /> Notifications
            </h1>
            <p className="text-muted-foreground mt-2">Updates about your flights and account.</p>
          </div>
          {notifications?.some(n => !n.isRead) && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={markAllRead.isPending}>
              <Check className="h-4 w-4 mr-2" /> Mark all read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-card animate-pulse rounded-xl border border-border" />)}
          </div>
        ) : notifications && notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map(n => (
              <Card 
                key={n.id} 
                className={cn(
                  "p-5 transition-colors border",
                  n.isRead ? "bg-card border-border/50 opacity-70" : "bg-card border-primary/30 shadow-sm"
                )}
              >
                <div className="flex gap-4">
                  <div className={cn(
                    "mt-1 h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                    n.isRead ? "bg-muted" : "bg-primary/10"
                  )}>
                    {getIcon(n.title)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-4">
                      <h3 className={cn("font-medium", !n.isRead && "font-semibold text-foreground")}>{n.title}</h3>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm mt-1 mb-3">{n.message}</p>
                    
                    {!n.isRead && (
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => handleMarkRead(n.id)}>
                        Mark as read
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-dashed border-border rounded-xl p-16 text-center">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">You're all caught up</h3>
            <p className="text-muted-foreground">There are no new notifications to display.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
