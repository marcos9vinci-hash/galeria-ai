import React from 'react';
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Sparkles, CalendarDays, Target, X, Zap, ChevronRight } from "lucide-react";
import SugerirEspacos from "../galeria/SugerirEspacos";

export const Sidebar = ({ 
  isOpen,
  onClose,
  setShowEstudioIA, 
  setShowPlanoSemanal, 
  setShowNicheConfig, 
  profileInfo, 
  posts, 
  setCurrentDate 
}: any) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
          />

          {/* Off-Canvas Slide-over Panel */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-card/95 backdrop-blur-2xl border-l border-border/80 shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header da Sidebar */}
            <div className="p-5 border-b border-border/60 flex items-center justify-between bg-primary/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Menu IA & Estratégia</h3>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Ferramentas Criativas</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Estúdio de Campanhas */}
              <div className="p-4 bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent rounded-2xl border border-primary/20 shadow-xs relative overflow-hidden">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/20 rounded-xl text-primary mt-0.5 shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
                      Estúdio de Campanhas IA
                    </h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Defina um tema e anexe várias fotos. O Agente de IA criará a estratégia e agendará tudo de forma sequencial nos melhores horários.
                    </p>
                    <Button 
                      size="sm" 
                      className="w-full h-8 mt-2 text-xs font-bold bg-primary hover:bg-primary/90 text-white gap-1.5 rounded-xl shadow-xs"
                      onClick={() => {
                        onClose();
                        setShowEstudioIA(true);
                      }}
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Iniciar Co-Criação IA
                    </Button>
                  </div>
                </div>
              </div>

              {/* Botões de Ação Rápida */}
              <div className="space-y-2.5">
                <Button 
                  variant="outline"
                  className="w-full h-12 justify-between bg-card/60 hover:bg-muted/50 border-border/80 rounded-xl px-4 text-xs font-semibold group transition-all"
                  onClick={() => {
                    onClose();
                    setShowPlanoSemanal(true);
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <CalendarDays className="w-4 h-4 text-primary" />
                    <span>Planejamento Semanal</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </Button>

                {profileInfo && (
                  <Button 
                    variant="outline"
                    className="w-full h-12 justify-between bg-card/60 hover:bg-muted/50 border-border/80 rounded-xl px-4 text-xs font-semibold group transition-all"
                    onClick={() => {
                      onClose();
                      setShowNicheConfig(true);
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <Target className="w-4 h-4 text-indigo-500" />
                      <span>Estratégia e Inteligência de Nicho</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                )}
              </div>

              {/* Sugestão de Espaços / Lacunas */}
              <div className="pt-2">
                <SugerirEspacos 
                  posts={posts} 
                  onSelect={(s: any) => {
                    setCurrentDate(s.date);
                    onClose();
                  }} 
                />
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
