import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, Clock, Instagram, Send, CheckCircle2 } from "lucide-react";

export default function CalendarioAgendamentos({ posts, bufferPosts = [], onPostClick, loadingBuffer }: any) {
  const getPostDateTime = (post: any) => {
    let dateObj = new Date(post.date);
    let timeStr = "Não definido";

    // Try scheduledTime or scheduledAt
    const timeRef = post.scheduledTime || post.scheduledAt || post.date;
    if (timeRef) {
      if (typeof timeRef === "string") {
        if (timeRef.includes("T")) {
          const parsed = new Date(timeRef);
          if (!isNaN(parsed.getTime())) {
            dateObj = parsed;
            const pad = (n: number) => n.toString().padStart(2, "0");
            timeStr = `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
          } else {
            const parts = timeRef.split("T");
            if (parts[1]) {
              timeStr = parts[1].substring(0, 5);
            }
          }
        } else if (timeRef.match(/^\d{2}:\d{2}/)) {
          timeStr = timeRef.substring(0, 5);
        }
      } else if (timeRef instanceof Date && !isNaN(timeRef.getTime())) {
        dateObj = timeRef;
        const pad = (n: number) => n.toString().padStart(2, "0");
        timeStr = `${pad(timeRef.getHours())}:${pad(timeRef.getMinutes())}`;
      }
    }

    if (post.scheduledDate && post.scheduledTime && !post.scheduledTime.includes("T")) {
      try {
        const parsed = new Date(`${post.scheduledDate}T${post.scheduledTime}`);
        if (!isNaN(parsed.getTime())) {
          dateObj = parsed;
          timeStr = post.scheduledTime.substring(0, 5);
        }
      } catch (e) {}
    }

    return { dateObj, timeStr };
  };

  const localScheduledPosts = posts.filter(
    (p: any) => (p.status === "agendado" || p.scheduledDate || p.scheduledTime) && p.status !== "publicado"
  );

  const hasNoPosts = localScheduledPosts.length === 0 && bufferPosts.length === 0;

  if (hasNoPosts && !loadingBuffer) {
    return (
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-3">
          <CalendarDays className="w-12 h-12 text-muted-foreground" />
          <div>
            <h3 className="font-semibold text-lg">Nenhum post agendado</h3>
            <p className="text-sm text-muted-foreground">Arraste posts no calendário ou agende via Buffer para ver aqui.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {localScheduledPosts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Rascunhos Agendados (Local)</h3>
          </div>
          <div className="grid gap-3">
            {localScheduledPosts
              .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map((post: any) => {
                const { dateObj, timeStr } = getPostDateTime(post);
                const isScheduledStatus = post.status === "agendado";
                return (
                  <Card key={post.id} className={`overflow-hidden hover:bg-muted/20 transition-colors cursor-pointer border-l-4 ${isScheduledStatus ? 'border-l-indigo-600' : 'border-l-yellow-500'}`} onClick={() => onPostClick(post)}>
                    <div className="flex items-center gap-4 p-3">
                      <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                        <img src={post.image} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${isScheduledStatus ? 'text-indigo-600 bg-indigo-50' : 'text-yellow-600 bg-yellow-500/10'}`}>
                            {isScheduledStatus ? "Agendado" : "Rascunho"}
                          </span>
                          <span className="text-xs font-bold uppercase tracking-wider text-primary">{post.type}</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs font-medium">{format(dateObj, "dd 'de' MMM", { locale: ptBR })}</span>
                        </div>
                        <p className="text-sm line-clamp-1 text-muted-foreground italic">
                          {post.caption || "Sem legenda..."}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {timeStr}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                         <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => {
                           e.stopPropagation();
                           const mensagem = `Post agendado: ${post.caption || ""}\nHashtags: ${post.hashtags?.join(' ') || ""}`;
                           window.open(`https://wa.me/?text=${encodeURIComponent(mensagem)}`, '_blank');
                         }}>
                           <Send className="w-4 h-4 text-primary" />
                         </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      {(bufferPosts.length > 0 || loadingBuffer) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Instagram className="w-5 h-5 text-[#2c4bff]" />
              <h3 className="font-semibold text-[#2c4bff]">Fila do Buffer (Confirmado)</h3>
            </div>
            {loadingBuffer && <div className="text-[10px] text-muted-foreground animate-pulse">Sincronizando...</div>}
          </div>
          
          <div className="grid gap-3">
            {bufferPosts.map((post: any) => (
              <Card key={post.id} className="overflow-hidden bg-[#2c4bff]/5 border-l-4 border-l-[#2c4bff]">
                <div className="flex items-center gap-4 p-3">
                  <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0 bg-muted">
                    {post.content?.assets?.images?.[0]?.url ? (
                      <img src={post.content.assets.images[0].url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><CalendarDays className="w-6 h-6 text-muted-foreground" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-[#2c4bff] px-1.5 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Buffer
                      </span>
                      {(post.scheduledAt || post.dueAt) && (
                        <span className="text-xs font-medium text-[#2c4bff]">
                          {format(new Date(post.scheduledAt || post.dueAt), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm line-clamp-2 text-foreground">
                      {post.text || post.content?.text || "Sem texto..."}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
