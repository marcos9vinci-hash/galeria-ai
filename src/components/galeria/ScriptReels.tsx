import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Video, Copy, RefreshCw, CheckCircle2, Music } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AudiosEmAlta from "./AudiosEmAlta";

const FORMATS = [
  { value: "processo", label: "Processo da tatuagem", desc: "Do rascunho ao resultado final" },
  { value: "antes_depois", label: "Antes e depois", desc: "Transformação ou cover-up" },
  { value: "bastidores", label: "Bastidores do estúdio", desc: "Um dia na vida do tatuador" },
  { value: "tutorial", label: "Tutorial / técnica", desc: "Como funciona uma técnica específica" },
  { value: "inspiracao", label: "Inspiracão e portfólio", desc: "Melhores trabalhos com storytelling" },
];

const DURATIONS = [
  { value: "15", label: "15 segundos" },
  { value: "30", label: "30 segundos" },
  { value: "60", label: "1 minuto" },
  { value: "90", label: "90 segundos" },
];

interface ScriptReelsProps {
  post: any;
  styleAnalysis?: {
    style: string;
    mood: string;
  };
  contexto?: {
    tema?: string;
  };
  onClose: () => void;
}

export default function ScriptReels({ post, styleAnalysis, contexto, onClose }: ScriptReelsProps) {
  console.log("ScriptReels Rendering, post ID:", post?.id);
  const [format, setFormat] = useState("processo");
  const [duration, setDuration] = useState("30");
  const [script, setScript] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const styleCtx = styleAnalysis ? `Estilo da tattoo: ${styleAnalysis.style}. Mood: ${styleAnalysis.mood}.` : '';
    const userCtx = contexto?.tema ? `Tema: ${contexto.tema}.` : '';
    const selectedFormat = FORMATS.find(f => f.value === format);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Crie um roteiro detalhado para um Reels de Instagram de ${duration} segundos sobre tatuagem.
Formato: "${selectedFormat?.label}" — ${selectedFormat?.desc}
${styleCtx} ${userCtx}

Regras Cruciais:
1. O roteiro deve cobrir exatamente ${duration} segundos.
2. DIVIDA O TEMPO EM INTERVALOS (ex: 0-3s, 3-7s, 7-12s...).
3. O HOOK deve ser nos primeiros 3 segundos.

Retorne um JSON com:
- hook: frase de abertura poderosa
- scenes: array de cenas, cada cena com:
    "cena": número,
    "tempo": "X a Y seg" (ex: "0 a 3 seg"),
    "visual": descrição do que filmar,
    "audio": o que dizer ou o que aparece de legenda
- cta_final: call to action
- musica_sugerida: estilo de música
- hashtags_reels: 5 hashtags`,
        response_json_schema: {
          type: "object",
          properties: {
            hook: { type: "string" },
            scenes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  cena: { type: "number" },
                  tempo: { type: "string" },
                  visual: { type: "string" },
                  audio: { type: "string" }
                }
              }
            },
            cta_final: { type: "string" },
            musica_sugerida: { type: "string" },
            hashtags_reels: { type: "array", items: { type: "string" } }
          }
        }
      });
      setScript(result);
    } catch (error) {
      console.error("Erro ao gerar roteiro:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!script) return;
    const text = [
      `🎬 ROTEIRO REELS — ${FORMATS.find(f => f.value === format)?.label}`,
      `⏱ ${duration} segundos`,
      ``,
      `🪝 HOOK: ${script.hook}`,
      ``,
      `🎞 CENAS:`,
      ...(script.scenes || []).map((s: any) =>
        `Cena ${s.cena} (${s.tempo || ''})\n  📹 Visual: ${s.visual}\n  🎙 Áudio: ${s.audio}`
      ),
      ``,
      `📢 CTA FINAL: ${script.cta_final}`,
      `🎵 Música: ${script.musica_sugerida}`,
      ``,
      `#️⃣ ${script.hashtags_reels?.join(' ')}`,
    ].join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto z-[9999]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" /> Script para Reels
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Formato + Duração */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Formato</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FORMATS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Duração</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DURATIONS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botão Gerar */}
          <Button className="w-full" onClick={handleGenerate} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Video className="w-4 h-4 mr-2" />}
            {loading ? 'Gerando roteiro...' : 'Gerar Roteiro com IA'}
          </Button>

          {/* Resultado */}
          {script && (
            <div className="space-y-4 border border-border rounded-lg p-4">

              {/* Hook */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">🪝 Hook (primeiros 3s)</p>
                <p className="text-sm font-medium bg-primary/5 rounded p-2 border-l-2 border-primary">{script.hook}</p>
              </div>

              {/* Script linha por linha */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1 h-3 bg-primary rounded-full" />
                  Estrutura do Vídeo (Timestamp)
                </div>
                <div className="bg-black/95 rounded-xl p-4 space-y-4 font-sans">
                  {script.scenes?.map((scene: any, i: number) => (
                    <div key={i} className="relative pl-6 border-l border-white/10 group">
                      {/* Timeline dot */}
                      <div className="absolute left-[-4px] top-1 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                      
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-primary/80 uppercase tracking-tighter">
                            Cena {scene.cena}
                          </span>
                          <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-white/20 text-white/60 bg-white/5">
                            {scene.tempo}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                            <p className="text-white text-sm leading-relaxed font-medium">"{scene.audio}"</p>
                          </div>
                          <div className="flex gap-2 items-start opacity-70 group-hover:opacity-100 transition-opacity">
                            <Video className="w-3 h-3 mt-0.5 text-white/40" />
                            <p className="text-white/60 text-[10px] leading-snug">
                              <span className="text-white/80 font-semibold uppercase mr-1">Visual:</span> 
                              {scene.visual}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA + Música */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">📢 CTA Final</p>
                  <p className="text-xs bg-muted rounded p-2">{script.cta_final}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">🎵 Música</p>
                  <p className="text-xs bg-muted rounded p-2">{script.musica_sugerida}</p>
                </div>
              </div>

              {/* Hashtags + Audios */}
              <div className="space-y-4 pt-2 border-t">
                {script.hashtags_reels?.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Hashtags Estratégicas</p>
                    <div className="flex flex-wrap gap-1">
                      {script.hashtags_reels.map((tag: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                   <AudiosEmAlta onSelect={(audio) => setScript({...script, musica_sugerida: audio})} />
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleGenerate} disabled={loading}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Regenerar
                </Button>
                <Button className="flex-1" onClick={handleCopy}>
                  {copied ? <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? 'Copiado!' : 'Copiar Roteiro'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
