import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, Loader2, CheckCircle2, TrendingUp, Calendar, 
  UserCheck, Search, PenTool, ClipboardCheck, ArrowRight 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AgentStep } from "@/services/agenteStudioService";

interface EstudioIAProgressoProps {
  steps: AgentStep[];
  isProcessing: boolean;
  onFinish?: (result: any) => void;
}

const AGENT_ICONS: Record<string, any> = {
  "Agente 0": UserCheck,
  "Agente 1": Search,
  "Agente 2": TrendingUp,
  "Agente 3": Sparkles,
};

export default function EstudioIAProgresso({ steps, isProcessing }: EstudioIAProgressoProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [steps]);

  return (
    <Card className="border-primary/20 bg-card/60 backdrop-blur-xl h-full flex flex-col overflow-hidden">
      <CardHeader className="border-b py-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
             <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          </div>
          <div>
            <CardTitle className="text-sm">Agentes em Trabalho</CardTitle>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Estúdio de Criação IA</p>
          </div>
        </div>
        {isProcessing && (
          <Badge variant="outline" className="animate-pulse bg-primary/5 border-primary/20 text-primary text-[10px]">
            Processando Dados Reais...
          </Badge>
        )}
      </CardHeader>
      
      <CardContent ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        <AnimatePresence mode="popLayout">
          {steps.map((step, i) => {
            const Icon = AGENT_ICONS[step.agent] || Sparkles;
            return (
              <motion.div
                key={step.agent}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ type: "spring", damping: 20 }}
                className="relative pl-6 border-l-2 border-primary/20"
              >
                <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                   <Icon className="w-2 h-2 text-primary" />
                </div>
                
                <div className="bg-muted/30 rounded-xl p-3 border border-border/50 group hover:border-primary/40 transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black uppercase text-primary tracking-tighter">
                      {step.agent} • {step.role}
                    </span>
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                  </div>
                  <p className="text-[11px] leading-relaxed text-foreground/80 italic">
                    "{typeof step.log === 'string' ? step.log : 'Análise concluída.'}"
                  </p>
                </div>
                
                {i < steps.length - 1 && (
                  <div className="flex justify-center my-1">
                    <ArrowRight className="w-3 h-3 text-muted-foreground/30 rotate-90" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {isProcessing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center p-8 text-center space-y-3"
          >
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-primary">Orquestrando Agentes</p>
              <p className="text-[10px] text-muted-foreground">Isso pode levar alguns segundos, estamos varrendo o Instagram por dados precisos.</p>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
