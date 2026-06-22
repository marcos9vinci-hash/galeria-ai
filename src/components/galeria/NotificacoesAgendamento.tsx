import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, X, Bell } from "lucide-react";
import { format, isPast, isFuture, differenceInHours } from "date-fns";
import { ptBR } from "date-fns/locale";

export function useNotificacoes(posts: any[], bufferPosts: any[] = []) {
  const now = new Date();
  const notifications: any[] = [];
  
  // Local drafts
  posts.forEach((post) => {
    if (!post.scheduledDate) return;
    const dt = post.scheduledTime
      ? new Date(`${post.scheduledDate}T${post.scheduledTime}`)
      : new Date(post.scheduledDate + "T23:59");
    if (isPast(dt) && post.status !== "publicado") notifications.push({ type: "overdue", post, dt, source: 'local' });
    if (isFuture(dt) && differenceInHours(dt, now) <= 2 && post.status !== "publicado")
      notifications.push({ type: "soon", post, dt, source: 'local' });
  });

  // Buffer scheduled posts
  bufferPosts.forEach((post) => {
    const scheduledTime = post.scheduledAt || post.dueAt;
    if (!scheduledTime) return;
    const dt = new Date(scheduledTime);
    
    // Buffer posts are already in the cloud, so if they are in QUEUED state, they are "soon"
    if (isFuture(dt) && differenceInHours(dt, now) <= 24) {
      notifications.push({ type: "buffer_soon", post, dt, source: 'buffer' });
    }
  });

  return notifications.sort((a, b) => {
    if (a.type === "overdue" && b.type !== "overdue") return -1;
    if (b.type === "overdue" && a.type !== "overdue") return 1;
    return a.dt.getTime() - b.dt.getTime();
  });
}

export default function NotificacoesAgendamento({ posts, bufferPosts = [], onPostClick, onDismiss }: any) {
  const notifications = useNotificacoes(posts, bufferPosts);
  if (notifications.length === 0) return null;
  return (
    <div className="space-y-2 mb-4">
      {notifications.map((n) => (
        <div
          key={`${n.source}-${n.post.id}-${n.type}`}
          className={`flex items-start gap-3 p-3 rounded-lg border ${
            n.type === "overdue"
              ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900"
              : n.type === "buffer_soon"
              ? "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900"
              : "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900"
          }`}
        >
          {n.type === "overdue" ? (
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          ) : (
            <Clock className={`w-4 h-4 mt-0.5 flex-shrink-0 ${n.type === "buffer_soon" ? "text-blue-600" : "text-yellow-600"}`} />
          )}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${
              n.type === "overdue" ? "text-red-700" : 
              n.type === "buffer_soon" ? "text-blue-700" : "text-yellow-700"
            }`}>
              {n.type === "overdue" ? "Post atrasado!" : 
               n.type === "buffer_soon" ? "Confirmado no Buffer" : "Post em breve"}
            </p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {n.type === "overdue"
                ? `Estava agendado para ${format(n.dt, "dd/MM 'às' HH:mm", { locale: ptBR })}`
                : n.type === "buffer_soon"
                ? `Publicação automática às ${format(n.dt, "HH:mm", { locale: ptBR })}`
                : `Agendado para ${format(n.dt, "HH:mm", { locale: ptBR })} · ${n.post.type}`}
              {n.post.caption || n.post.text || n.post.content?.text ? ` · "${(n.post.caption || n.post.text || n.post.content?.text).slice(0, 30)}..."` : ""}
            </p>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            {n.source === 'local' && (
              <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => onPostClick(n.post)}>
                Ver
              </Button>
            )}
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onDismiss(n.post.id, n.source)}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function NotificacoesBell({ posts, bufferPosts = [], onClick }: any) {
  const notifications = useNotificacoes(posts, bufferPosts);
  const overdueCount = notifications.filter((n) => n.type === "overdue").length;
  return (
    <Button variant="ghost" size="icon" onClick={onClick} className="relative rounded-full hover:bg-primary/10 transition-colors">
      <Bell className={`w-5 h-5 ${notifications.length > 0 ? "animate-pulse text-primary" : "text-muted-foreground"}`} />
      {notifications.length > 0 && (
        <span
          className={`absolute -top-1 -right-1 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-lg ${
            overdueCount > 0 ? "bg-red-500" : "bg-yellow-500"
          }`}
        >
          {notifications.length}
        </span>
      )}
    </Button>
  );
}
