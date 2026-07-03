import React from 'react';
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import NotificacoesAgendamento from '../galeria/NotificacoesAgendamento';

export const Notifications = ({ show, onClose, posts, bufferPosts, onPostClick, onDismiss }: any) => {
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
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}><X className="w-3 h-3" /></Button>
            </div>
            <CardContent className="p-4 max-h-[400px] overflow-y-auto">
              <NotificacoesAgendamento
                posts={posts}
                bufferPosts={bufferPosts}
                onPostClick={onPostClick}
                onDismiss={onDismiss}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
