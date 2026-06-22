import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, Zap, Target, BookOpen, Upload, LayoutGrid, Loader2, X, CheckCircle2, PenTool } from "lucide-react";
import { AgenteStudioService, AgentStep } from "@/services/agenteStudioService";
import EstudioIAProgresso from "./EstudioIAProgresso";
import { base44 } from "@/api/base44Client";

interface EstudioIAWorkflowProps {
  open: boolean;
  onClose: () => void;
  igId?: string;
  profileInfo?: any;
  onPostCreated: (post: any) => void;
  existingPosts?: any[];
}

export default function EstudioIAWorkflow({ open, onClose, igId, profileInfo, onPostCreated, existingPosts = [] }: EstudioIAWorkflowProps) {
  const [topic, setTopic] = useState("");
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const [nicheConfig, setNicheConfig] = useState<any>(null);

  useEffect(() => {
    if (open && profileInfo?.username) {
      fetch(`/api/niche/config?igUsername=${profileInfo.username}`)
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) {
            setNicheConfig(data);
          }
        })
        .catch(err => console.error("Error loading niche config in workflow:", err));
    }
  }, [open, profileInfo?.username]);

  const handleStart = async () => {
    if (!topic || !igId) return;
    setIsProcessing(true);
    setSteps([]);
    setResult(null);

    try {
      const response = await AgenteStudioService.runWorkflow(topic, igId, profileInfo, selectedFiles);
      setSteps(response.steps);
      setResult(response.final);
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = () => {
    if (!result) return;
    
    // If AI suggested explicit media assignments, use them. Otherwise fallback to simple logic.
    const assignments = result.media_assignments || selectedFiles.map((_, i) => ({ media_index: i }));

    // Obter horários reais do Instagram Insights configurados pelo usuário
    const userHours = nicheConfig?.bestHours && nicheConfig.bestHours.length > 0
      ? nicheConfig.bestHours
      : ["12:00", "18:00", "20:00"];

    // Ordenar horas cronologicamente
    const sortedHours = [...userHours].sort((a, b) => {
      const [hA, mA] = a.split(":").map(Number);
      const [hB, mB] = b.split(":").map(Number);
      return (hA * 60 + mA) - (hB * 60 + mB);
    });
    
    // Distribuidor Inteligente por Código com base nos Insights Reais:
    const newPosts = selectedFiles.map((file, index) => {
       let checkDate = new Date();
       let slotsToSkip = index;
       let targetDate = new Date();
       let iteration = 0;

       while (slotsToSkip >= 0 && iteration < 100) {
         iteration++;
         let foundForDay = false;

         for (const hourStr of sortedHours) {
           const [h, m] = hourStr.split(":").map(Number);
           const candidate = new Date(checkDate.getTime());
           candidate.setHours(h, m, 0, 0);

           // O horário precisa ser no futuro (com margem de 10 minutos)
           if (candidate.getTime() > new Date().getTime() + 10 * 60 * 1000) {
             if (slotsToSkip === 0) {
               targetDate = candidate;
               slotsToSkip = -1;
               foundForDay = true;
               break;
             } else {
               slotsToSkip--;
             }
           }
         }

         if (!foundForDay && slotsToSkip >= 0) {
           checkDate.setDate(checkDate.getDate() + 1);
           checkDate.setHours(0, 0, 0, 0);
         }
       }

       return {
         id: Date.now() + index,
         date: targetDate,
         image: file, 
         type: (result.format_suggestion || 'feed').toLowerCase(),
         status: 'rascunho',
         caption: result.caption,
         hashtags: result.hashtags || [],
         scheduledTime: targetDate.toISOString(),
         reelsScript: result.reels,
         storySequence: result.stories,
         carouselSlides: result.carousel,
         strategyReasoning: result.reasoning,
         editorSettings: { brightness: 100, contrast: 100, saturate: 100, rotate: 0, scaleX: 1, scaleY: 1 }
       };
    }).filter(Boolean);
    
    newPosts.forEach(p => onPostCreated(p));
    onClose();
  };

  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    setIsUploading(true);
    try {
      const uploadedUrls = await Promise.all(
        files.map(async (file) => {
          const { file_url } = await (base44.integrations.Core as any).UploadFile({ file });
          return file_url;
        })
      );
      setSelectedFiles(prev => [...prev, ...uploadedUrls]);
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden bg-background">
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Input & Strategy */}
          <div className="w-full md:w-2/5 p-6 flex flex-col gap-6 border-r overflow-y-auto bg-muted/5">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-xl">Cérebro Estratégico IA</DialogTitle>
                  <p className="text-[10px] text-primary font-bold uppercase tracking-tighter">Coordenando sua presença digital</p>
                </div>
              </div>
            </DialogHeader>

            {!result && !isProcessing && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Sobre o que vamos postar?</label>
                  <Input 
                    placeholder="Ex: Tatuagem Fine Line Floral, Cicatrização, Agenda aberta..." 
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    className="h-12 text-sm bg-background border-border/50"
                  />
                  <p className="text-[10px] text-muted-foreground">O cérebro analisará seus insights e o mercado para decidir o melhor formato.</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Fotos para o Lote</label>
                    <Button 
                      variant="ghost" 
                      className="h-6 text-[10px] font-bold text-primary gap-1"
                      onClick={() => setShowGalleryPicker(!showGalleryPicker)}
                    >
                      <LayoutGrid className="w-3 h-3" />
                      {showGalleryPicker ? "Fechar Galeria" : "Escolher da Galeria"}
                    </Button>
                  </div>

                  {showGalleryPicker && (
                    <div className="grid grid-cols-4 gap-2 p-3 bg-muted/30 rounded-2xl border animate-in slide-in-from-top-2">
                       {existingPosts.filter(p => !p.caption).map((p, i) => (
                          <div 
                            key={i} 
                            className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${selectedFiles.includes(p.image) ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'}`}
                            onClick={() => {
                              if (selectedFiles.includes(p.image)) {
                                setSelectedFiles(prev => prev.filter(f => f !== p.image));
                              } else {
                                setSelectedFiles(prev => [...prev, p.image]);
                              }
                            }}
                          >
                             <img src={p.image} className="w-full h-full object-cover" />
                             {selectedFiles.includes(p.image) && (
                               <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                  <CheckCircle2 className="w-6 h-6 text-white shadow-sm" />
                               </div>
                             )}
                          </div>
                       ))}
                       {existingPosts.filter(p => !p.caption).length === 0 && (
                         <div className="col-span-4 py-4 text-center text-[10px] text-muted-foreground">
                            Nenhuma foto sem legenda na galeria. Suba novas abaixo!
                         </div>
                       )}
                    </div>
                  )}

                  <div 
                    className="border-2 border-dashed border-primary/20 rounded-2xl p-4 flex flex-wrap gap-2 min-h-[100px] hover:bg-primary/5 transition-all cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input type="file" multiple hidden ref={fileInputRef} onChange={handleFileSelect} accept="image/*" />
                    {isUploading ? (
                      <div className="w-full flex flex-col items-center justify-center py-4 text-primary">
                        <Loader2 className="w-6 h-6 mb-2 animate-spin" />
                        <span className="text-[10px] font-bold">Enviando para Nuvem...</span>
                      </div>
                    ) : selectedFiles.length === 0 ? (
                      <div className="w-full flex flex-col items-center justify-center py-4 text-muted-foreground">
                        <Upload className="w-6 h-6 mb-2 opacity-50" />
                        <span className="text-[10px]">Clique para subir novas ou escolha da galeria acima</span>
                      </div>
                    ) : (
                      selectedFiles.map((f, i) => (
                        <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border shadow-sm group">
                           <img src={f} className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button 
                                className="bg-destructive text-white p-1 rounded-full"
                                onClick={(e) => { e.stopPropagation(); setSelectedFiles(prev => prev.filter((_, idx) => idx !== i)); }}
                              >
                                <X className="w-3 h-3" />
                              </button>
                           </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="p-4 bg-background rounded-2xl border border-border/50 flex gap-4 hover:border-primary/30 transition-colors">
                     <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0">
                        <Target className="w-5 h-5 text-primary" />
                     </div>
                     <div>
                        <h6 className="text-[12px] font-bold">Análise Simbólica Profunda</h6>
                        <p className="text-[10px] text-muted-foreground leading-tight">Os Agentes 0 e 1 extraem o simbolismo da imagem para criar uma conexão profunda.</p>
                     </div>
                  </div>
                  <div className="p-4 bg-background rounded-2xl border border-border/50 flex gap-4 hover:border-purple-500/30 transition-colors">
                     <div className="w-10 h-10 rounded-xl bg-purple-500/5 flex items-center justify-center shrink-0">
                        <PenTool className="w-5 h-5 text-purple-500" />
                     </div>
                     <div>
                        <h6 className="text-[12px] font-bold">Os 7 Pilares de Captivação</h6>
                        <p className="text-[10px] text-muted-foreground leading-tight">O Agente 3 aplica técnicas de copywriting magnético para converter seguidores em clientes.</p>
                     </div>
                  </div>
                </div>

                <Button 
                  className="w-full h-14 bg-primary text-white font-bold group shadow-lg shadow-primary/20"
                  onClick={handleStart}
                  disabled={!topic || !igId}
                >
                  COORDENAR CRIAÇÃO COMPLETA
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                
                {!igId && (
                  <p className="text-[10px] text-center text-destructive font-bold uppercase p-2 border border-dashed border-destructive/20 rounded-lg">
                    ⚠️ Conecte seu Instagram para usar dados reais do perfil
                  </p>
                )}
              </div>
            )}

            {result && (
              <div className="space-y-6 animate-in zoom-in-95">
                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-2 opacity-10">
                      <BookOpen className="w-10 h-10" />
                   </div>
                   <h4 className="text-sm font-bold text-primary mb-2 flex items-center gap-2">
                     <Zap className="w-4 h-4" /> Por que esta estratégia?
                   </h4>
                   <p className="text-[11px] leading-relaxed text-foreground/80 italic">
                     {result.reasoning}
                   </p>
                </div>

                <div className="p-4 bg-muted/30 rounded-2xl border flex items-center justify-between">
                   <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Formato Ideal</p>
                      <p className="text-sm font-bold text-primary">{result.format_suggestion}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Agendamento Recomendado</p>
                      <p className="text-[11px] font-bold">
                        {new Date(Date.now() + 2 * 60 * 60 * 1000).toLocaleString('pt-BR', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}
                      </p>
                   </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" className="flex-1 h-12" onClick={() => { setResult(null); setSteps([]); }}>Refazer Análise</Button>
                  <Button className="flex-1 bg-primary text-white h-12 font-bold shadow-lg shadow-primary/20" onClick={handleApply}>
                    SALVAR TUDO NO APP
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right Content Area */}
          <div className="flex-1 flex flex-col bg-muted/5 overflow-hidden">
             {isProcessing ? (
                <div className="flex-1">
                   <EstudioIAProgresso steps={steps} isProcessing={isProcessing} />
                </div>
             ) : result ? (
               <div className="flex-1 p-6 overflow-y-auto space-y-8 scrollbar-thin">
                  {/* Preview da Legenda */}
                  <section className="space-y-3">
                     <div className="flex items-center justify-between">
                        <h5 className="text-[11px] font-black uppercase text-muted-foreground tracking-tighter">Legenda do Feed</h5>
                        <Badge variant="outline" className="text-[10px] font-bold">REVISADO POR IA</Badge>
                     </div>
                     <div className="p-5 bg-background rounded-3xl border border-border/50 shadow-sm whitespace-pre-wrap text-sm leading-relaxed relative group">
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none" />
                        {result.caption}
                        <div className="mt-4 flex flex-wrap gap-1">
                           {result.hashtags?.map((tag: string) => (
                             <span key={tag} className="text-primary font-medium">#{tag}</span>
                           ))}
                        </div>
                     </div>
                  </section>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     {/* Preview Reels */}
                     <section className="space-y-3">
                        <h5 className="text-[11px] font-black uppercase text-muted-foreground tracking-tighter flex items-center gap-2">
                           <Zap className="w-3 h-3 text-purple-500" /> Roteiro de Reels
                        </h5>
                        <div className="bg-purple-500/5 rounded-3xl border border-purple-500/20 p-5 space-y-4">
                           <div>
                              <p className="text-[10px] font-black uppercase text-purple-600 mb-1">Hook (Início)</p>
                              <p className="text-sm font-medium leading-normal italic">"{result.reels?.hook}"</p>
                           </div>
                           <div>
                              <p className="text-[10px] font-black uppercase text-purple-600 mb-1">Desenvolvimento</p>
                              <p className="text-xs text-muted-foreground leading-relaxed">{result.reels?.body}</p>
                           </div>
                           <div>
                              <p className="text-[10px] font-black uppercase text-purple-600 mb-1">CTA (Final)</p>
                              <p className="text-sm font-bold text-foreground">{result.reels?.cta}</p>
                           </div>
                        </div>
                     </section>

                     {/* Preview Stories */}
                     <section className="space-y-3">
                        <h5 className="text-[11px] font-black uppercase text-muted-foreground tracking-tighter flex items-center gap-2">
                           <Target className="w-3 h-3 text-blue-500" /> Sequência de Stories
                        </h5>
                        <div className="space-y-2">
                           {result.stories?.map((story: any) => (
                              <div key={story.id} className="p-3 bg-blue-500/5 rounded-2xl border border-blue-500/10 flex gap-3 items-center group hover:bg-blue-500/10 transition-all">
                                 <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 text-[10px] font-bold text-blue-600 group-hover:scale-110 transition-transform">
                                    {story.id}
                                 </div>
                                 <div className="flex-1">
                                    <h6 className="text-[11px] font-bold leading-tight">{story.title}</h6>
                                    <p className="text-[9px] text-muted-foreground leading-tight">{story.overlay}</p>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </section>

                     {/* Preview Carrossel (Novo) */}
                     {result.carousel && result.carousel.length > 0 && (
                       <section className="space-y-3 lg:col-span-2">
                          <h5 className="text-[11px] font-black uppercase text-muted-foreground tracking-tighter flex items-center gap-2">
                             <LayoutGrid className="w-3 h-3 text-orange-500" /> Estrutura do Carrossel
                          </h5>
                          <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                             {result.carousel.map((slide: any) => (
                                <div key={slide.slide} className="min-w-[200px] p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl space-y-2">
                                   <Badge variant="outline" className="text-[8px] bg-orange-500/10 text-orange-600 border-none">SLIDE {slide.slide}</Badge>
                                   <h6 className="text-xs font-bold leading-tight">{slide.title}</h6>
                                   <p className="text-[10px] text-muted-foreground leading-tight">{slide.content}</p>
                                </div>
                             ))}
                          </div>
                       </section>
                     )}
                  </div>
               </div>
             ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
                   <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                      <Sparkles className="w-10 h-10 text-muted-foreground/30" />
                   </div>
                   <div className="max-w-xs space-y-2">
                      <h3 className="text-lg font-bold">Pronta para orquestrar?</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Defina um tópico à esquerda e deixe que o cérebro do app coordene todos os seus canais.
                      </p>
                   </div>
                </div>
             )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
