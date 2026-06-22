import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, MessageSquare, Play, LayoutGrid, Camera, RefreshCw, Plus, Music } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { base44 } from "@/api/base44Client";
import AudiosEmAlta from "./AudiosEmAlta";

export default function StorySequencer({ post, isGenerating, onGenerate, onGenerated, contexto, styleAnalysis }: any) {
  const [frames, setFrames] = React.useState<any[]>([]);
  const [localIsGenerating, setLocalIsGenerating] = React.useState(false);

  const generateSequence = async () => {
    if (localIsGenerating || isGenerating) return;
    setLocalIsGenerating(true);
    onGenerate?.();
    
    const styleCtx = styleAnalysis ? `Estilo da tattoo: ${styleAnalysis.style}. Mood: ${styleAnalysis.mood}.` : '';
    const angleCtx = `Ângulo narrativo: ${narrativeAngle}.`;

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Crie uma sequência narrativa de 5 stories de Instagram para um tatuador altamente qualificado.
        Objetivo: ${narrativeAngle}.
        
        ${styleCtx}
        ${angleCtx}
        Imagem base: Post de tatuagem atual.
        Contexto do Tatuador: ${contexto.tema || 'Tatuagem Profissional'}.
        Publico-target: ${contexto.publico || 'Fãs de tatuagem premium'}.
        
        A sequência deve ser estratégica e conter:
        Stories 1: HOOK visual impactante.
        Stories 2: DESENVOLVIMENTO (curiosidade ou bastidor).
        Stories 3: REVEAL artístico cinematográfico.
        Stories 4: VALOR AGREGADO (detalhe ou expertise).
        Stories 5: CALL TO ACTION irresistível.
        
        Retorne um JSON com:
        - frames: lista de 5 objetos com (id, type, title, desc, overlay_text, sticker, duration)
        - recommendation: uma dica curta de qual música ou áudio em alta usar.`,
        file_urls: [post.image],
        response_json_schema: {
          type: "object",
          properties: {
            frames: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "number" },
                  type: { type: "string" },
                  title: { type: "string" },
                  desc: { type: "string" },
                  overlay_text: { type: "string" },
                  sticker: { type: "string" },
                  duration: { type: "string" }
                },
                required: ["id", "type", "title", "desc", "overlay_text", "sticker", "duration"]
              }
            },
            recommendation: { type: "string" }
          }
        }
      });

      if (response && response.frames) {
        setFrames(response.frames);
        setRecommendation(response.recommendation || "");
      }
    } catch (error) {
      console.error("Erro ao gerar stories:", error);
    } finally {
      setLocalIsGenerating(false);
      onGenerated?.();
    }
  };

  const [narrativeAngle, setNarrativeAngle] = React.useState("Processo e Arte");
  const [recommendation, setRecommendation] = React.useState("");

  const generating = isGenerating || localIsGenerating;

  return (
    <Card className="border-none shadow-none bg-background">
      <CardHeader className="px-0 pt-0 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Story Sequencer</CardTitle>
            <p className="text-[10px] text-muted-foreground">Planeje uma narrativa de 5 frames</p>
          </div>
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={generateSequence} disabled={generating}>
            {generating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-primary" />}
            {frames.length > 0 ? "Regerar" : "Planejar"}
          </Button>
        </div>

        <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
           {["Arte", "Bastidores", "Dicas", "Venda"].map(angle => (
             <Badge 
               key={angle} 
               variant={narrativeAngle === angle ? "default" : "outline"} 
               className="cursor-pointer whitespace-nowrap text-[9px] px-2 py-0.5"
               onClick={() => setNarrativeAngle(angle)}
             >
               {angle}
             </Badge>
           ))}
        </div>
      </CardHeader>
      <CardContent className="px-0 space-y-4 max-h-[400px] overflow-y-auto pr-2 pb-2">
        {recommendation && (
          <div className="bg-primary/10 border border-primary/20 p-2 rounded-lg mb-2">
            <p className="text-[10px] font-bold text-primary flex items-center gap-1">
              <Play className="w-3 h-3" /> Dica de Áudio
            </p>
            <p className="text-[10px] italic leading-tight text-foreground/80">{recommendation}</p>
          </div>
        )}
        <AnimatePresence mode="wait">
          {frames.length > 0 ? (
            <div className="space-y-4">
              {frames.map((frame, idx) => (
                <motion.div 
                  key={frame.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative pl-6 border-l-2 border-primary/20 group hover:border-primary transition-colors"
                >
                  <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-primary" />
                  <div className="bg-muted/30 p-3 rounded-xl border border-border/50 group-hover:bg-primary/5 transition-all relative overflow-hidden">
                     {/* Decorative background number */}
                     <span className="absolute right-2 top-0 text-4xl font-black text-primary/5 select-none">{frame.id}</span>
                     
                     <div className="flex justify-between items-center mb-1">
                        <Badge className="text-[8px] font-bold uppercase py-0 px-1 h-3.5 bg-primary/10 text-primary border-none">
                          {frame.type}
                        </Badge>
                        <span className="text-[9px] font-mono text-muted-foreground">{frame.duration}</span>
                     </div>
                     <h5 className="text-xs font-bold text-foreground leading-tight">{frame.title}</h5>
                     <p className="text-[10px] text-muted-foreground leading-relaxed mt-1.5 italic">"{frame.desc}"</p>
                     
                     <div className="mt-3 p-2 bg-primary/5 rounded-lg border border-primary/10">
                        <p className="text-[9px] font-bold text-primary uppercase mb-1 flex items-center gap-1">
                          <Plus className="w-2.5 h-2.5" /> Texto no Story
                        </p>
                        <p className="text-[10px] font-medium leading-snug">{frame.overlay_text}</p>
                     </div>

                     <div className="mt-3 flex items-center gap-1.5 opacity-80">
                        <MessageSquare className="w-3 h-3 text-primary" />
                        <span className="text-[9px] font-medium decoration-primary underline-offset-2 underline">{frame.sticker}</span>
                     </div>
                  </div>
                </motion.div>
              ))}
              <Button 
                variant="secondary" 
                size="sm" 
                className="w-full text-[10px] h-8 mt-4 mb-6" 
                onClick={() => {
                  const text = frames.map((f: any) => `Frame ${f.id} (${f.type}): ${f.title}\nGravar: ${f.desc}\nTexto: ${f.overlay_text}\nSticker: ${f.sticker}\n`).join('\n---\n');
                  navigator.clipboard.writeText(text);
                }}
              >
                <MessageSquare className="w-3.5 h-3.5 mr-2" /> Copiar Sequência Completa
              </Button>

              <div className="pt-6 border-t border-border/50">
                 <AudiosEmAlta onSelect={(audio) => setRecommendation(`A IA recomenda este áudio: ${audio}`)} />
              </div>
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                <LayoutGrid className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-xs">Sua história começa aqui. Deixe a IA criar uma sequência envolvente.</p>
             </div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
