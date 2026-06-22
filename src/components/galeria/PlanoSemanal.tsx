import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Calendar, Sparkles, CheckCircle2, Copy } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { nextMonday } from "date-fns";

const NICHES = [
  { value: "tattoo", label: "Estúdio de Tatuagem" },
  { value: "barbearia", label: "Barbearia" },
  { value: "estetica", label: "Estética / Beleza" },
  { value: "moda", label: "Moda / Roupas" },
  { value: "gastronomia", label: "Gastronomia / Restaurante" },
  { value: "fitness", label: "Academia / Fitness" },
  { value: "outro", label: "Outro negócio" },
];

const FREQUENCIES = [
  { value: "3", label: "3x por semana" },
  { value: "5", label: "5x por semana" },
  { value: "7", label: "Todos os dias" },
];

interface PlanoSemanalProps {
  posts: any[];
  onClose: () => void;
  onAddPosts?: (newPosts: any[]) => void;
}

export default function PlanoSemanal({ posts, onClose }: PlanoSemanalProps) {
  const [niche, setNiche] = useState("tattoo");
  const [frequency, setFrequency] = useState("5");
  const [objective, setObjective] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const publishedTags = (() => {
    const freq: Record<string, number> = {};
    posts.filter(p => p.status === 'publicado' && p.hashtags?.length).forEach(p =>
      p.hashtags.forEach((h: string) => { freq[h] = (freq[h] || 0) + 1; })
    );
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([h]) => h).join(', ');
  })();

  const handleGenerate = async () => {
    setLoading(true);
    const nicheLabel = NICHES.find(n => n.value === niche)?.label || niche;
    // const nextWeekStart = nextMonday(new Date());

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Crie um plano de conteúdo semanal para o Instagram de um negócio do nicho: "${nicheLabel}".
Frequência: ${frequency} posts por semana.
${objective ? `Objetivo da semana: ${objective}.` : ''}
${publishedTags ? `Hashtags que já funcionaram bem: ${publishedTags}.` : ''}

Gere um plano para ${frequency} dias da próxima semana. Cada dia deve ter:
- dia: nome do dia da semana (Segunda, Terça, Quarta, Quinta, Sexta, Sábado, Domingo)
- tipo: formato do post (feed, story, reels)
- tema: tema/assunto do post
- formato_conteudo: tipo de conteúdo (ex: "foto do produto", "depoimento cliente", "bastidores", "dica", "promoção")
- horario_sugerido: melhor horário para postar (ex: "18:30")
- legenda_base: rascunho de legenda de 2-3 linhas
- hashtags: 6-8 hashtags relevantes separadas por espaço
- dica_engajamento: 1 dica curta de como engajar neste post

Responda com os posts no array "posts" e uma "estrategia_da_semana" resumindo o objetivo geral.`,
        response_json_schema: {
          type: "object",
          properties: {
            estrategia_da_semana: { type: "string" },
            posts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  dia: { type: "string" },
                  tipo: { type: "string" },
                  tema: { type: "string" },
                  formato_conteudo: { type: "string" },
                  horario_sugerido: { type: "string" },
                  legenda_base: { type: "string" },
                  hashtags: { type: "string" },
                  dica_engajamento: { type: "string" }
                }
              }
            }
          }
        }
      });
      setPlan(result);
    } catch (error) {
      console.error("Erro ao gerar plano:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPlan = () => {
    if (!plan) return;
    const text = [
      `📅 PLANO SEMANAL DE CONTEÚDO`,
      `🎯 Estratégia: ${plan.estrategia_da_semana}`,
      ``,
      ...(plan.posts || []).map((p: any) => [
        `📌 ${p.dia} — ${p.tipo.toUpperCase()} · ${p.horario_sugerido}`,
        `Tema: ${p.tema} (${p.formato_conteudo})`,
        `Legenda: ${p.legenda_base}`,
        `${p.hashtags}`,
        `💡 ${p.dica_engajamento}`,
        ``
      ].join('\n'))
    ].join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const TYPE_COLORS: Record<string, string> = { feed: "bg-blue-500", story: "bg-purple-500", reels: "bg-pink-500" };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto z-[100]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> Plano Semanal de Conteúdo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Nicho do negócio</Label>
              <Select value={niche} onValueChange={setNiche}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {NICHES.map(n => <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Frequência de posts</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Objetivo da semana (opcional)</Label>
            <Input
              placeholder="Ex: aumentar seguidores, promover novo serviço, engajar audiência..."
              value={objective}
              onChange={e => setObjective(e.target.value)}
            />
          </div>

          <Button className="w-full" onClick={handleGenerate} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {loading ? 'Gerando plano semanal...' : 'Gerar Plano com IA'}
          </Button>

          {plan && (
            <div className="space-y-4">
              {plan.estrategia_da_semana && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <p className="text-xs font-semibold text-primary mb-1">🎯 Estratégia da Semana</p>
                  <p className="text-sm">{plan.estrategia_da_semana}</p>
                </div>
              )}

              <div className="space-y-3">
                {plan.posts?.map((p: any, i: number) => (
                  <div key={i} className="border border-border rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{p.dia}</span>
                      <Badge className={`text-white text-xs ${TYPE_COLORS[p.tipo] || 'bg-gray-500'}`}>{p.tipo}</Badge>
                      <Badge variant="outline" className="text-xs">⏰ {p.horario_sugerido}</Badge>
                      <span className="text-xs text-muted-foreground">{p.formato_conteudo}</span>
                    </div>
                    <p className="text-sm font-medium">{p.tema}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{p.legenda_base}</p>
                    <div className="flex flex-wrap gap-1">
                      {p.hashtags?.split(/\s+/).filter((h: string) => h.startsWith('#')).map((tag: string, j: number) => (
                        <Badge key={j} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                    {p.dica_engajamento && (
                      <p className="text-xs text-primary">💡 {p.dica_engajamento}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleGenerate} disabled={loading}>
                  Regenerar
                </Button>
                <Button className="flex-1" onClick={handleCopyPlan}>
                  {copied ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? 'Copiado!' : 'Copiar Plano'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
