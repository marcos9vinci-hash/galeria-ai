import React from "react";
import { motion } from "motion/react";
import { Sparkles, CalendarDays, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import SugerirEspacos from "@/components/galeria/SugerirEspacos";

interface SidebarCardsProps {
  onOpenEstudioIA: () => void;
  onOpenPlanoSemanal: () => void;
  onOpenNicheConfig: () => void;
  profileInfo: any;
  posts: any[];
  onSugestaoClick: (sugestao: any) => void;
}

export default function SidebarCards({
  onOpenEstudioIA,
  onOpenPlanoSemanal,
  onOpenNicheConfig,
  profileInfo,
  posts,
  onSugestaoClick,
}: SidebarCardsProps) {
  return (
    <div className="space-y-6">
      {/* Estúdio IA Card */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="p-4 bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent rounded-2xl border border-primary/20 shadow-md relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -z-10" />
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/20 rounded-lg text-primary mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-bold text-primary">Estúdio de Campanhas (Agente IA)</h4>
            <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
              Defina um tema (ex: "Promoção de Outubro" ou "Significados Botânicos") e anexe fotos de tatuagens.
              O Agente de IA criará e agendará uma campanha inteira em massa para você de forma coesa e sequencial!
            </p>
            <Button
              size="sm"
              className="w-full h-8 mt-3 text-[10px] font-bold bg-primary hover:bg-primary/90 text-white gap-1.5 shadow-sm"
              onClick={onOpenEstudioIA}
            >
              <Sparkles className="w-3.5 h-3.5" /> Iniciar Co-Criação IA
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Planejamento Semanal */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          variant="outline"
          className="w-full h-14 bg-card shadow-sm gap-2 text-xs font-bold border-primary/20 hover:border-primary/50"
          onClick={onOpenPlanoSemanal}
        >
          <CalendarDays className="w-5 h-5 text-primary" />
          Planejamento Semanal
        </Button>
      </motion.div>

      {/* Estratégia de Nicho */}
      {profileInfo && (
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            variant="outline"
            className="w-full h-14 bg-card shadow-sm gap-2 text-xs font-bold border-primary/20 hover:border-primary/50"
            onClick={onOpenNicheConfig}
          >
            <Target className="w-5 h-5 text-primary animate-pulse" />
            Estratégia de Nicho
          </Button>
        </motion.div>
      )}

      {/* Sugerir Espaços */}
      <SugerirEspacos
        posts={posts}
        onSelect={(s: any) => {
          onSugestaoClick(s);
        }}
      />
    </div>
  );
}
