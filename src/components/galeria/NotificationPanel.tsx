import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import NotificacoesAgendamento from "@/components/galeria/NotificacoesAgendamento";

interface NotificationPanelProps {
  show: boolean;
  posts: any[];
  bufferPosts: any[];
  dismissedNotifs: (string | number)[];
  onClose: () => void;
  onPostClick: (p: any) => void;
  onDismiss: (id: string | number, source: 'local' | 'buffer') => void;
}

export default function NotificationPanel({
  show,
  posts,
  bufferPosts,
  dismissedNotifs,
  onClose,
  onPostClick,
  onDismiss,
}: NotificationPanelProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-20 right-6 z-[100] w-full max-w-sm"
        >
          <Card className="shadow-2xl border-primary/20 overflow-hidden">
            <div className="bg-primary/5 p-3 border-b flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-tighter">Alertas de Agendamento</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
                <X className="w-3 h-3" />
              </Button>
            </div>
            <CardContent className="p-4 max-h-[400px] overflow-y-auto">
              <NotificacoesAgendamento
                posts={posts.filter(p => !dismissedNotifs.includes(p.id))}
                bufferPosts={bufferPosts.filter(p => !dismissedNotifs.includes(p.id))}
                onPostClick={(p: any) => {
                  onPostClick(p);
                  onClose();
                }}
                onDismiss={onDismiss}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
