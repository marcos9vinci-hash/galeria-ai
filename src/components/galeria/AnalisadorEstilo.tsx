import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";

interface AnalisadorEstiloProps {
  imageUrl: string;
  onComplete: (analysis: any) => void;
  onClose: () => void;
}

export default function AnalisadorEstilo({ imageUrl, onComplete, onClose }: AnalisadorEstiloProps) {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    analyzeStyle();
  }, []);

  const analyzeStyle = async () => {
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise esta imagem de tatuagem e retorne um JSON com as seguintes informações:
- style: estilo principal da tatuagem (ex: "blackwork", "realismo", "aquarela", "geométrico", "old school", "tribal", "fineline", "neotradicional", "japonês", etc.)
- mood: humor/sentimento geral (ex: "sombrio", "delicado", "agressivo", "espiritual", "minimalista", "colorido")
- complexity: complexidade do trabalho ("simples", "médio", "complexo")
- placement_suggestion: sugestão de local do corpo ideal para este estilo
- audience: público-alvo ideal (ex: "colecionadores de tattoo", "jovens aventureiros", "amantes de arte")
- color_palette: paleta de cores principal ("preto e branco", "colorido", "tons de cinza", "poucas cores")
- instagram_tips: 2-3 dicas específicas para postar este tipo de tattoo no Instagram`,
        file_urls: [imageUrl],
        response_json_schema: {
          type: "object",
          properties: {
            style: { type: "string" },
            mood: { type: "string" },
            complexity: { type: "string" },
            placement_suggestion: { type: "string" },
            audience: { type: "string" },
            color_palette: { type: "string" },
            instagram_tips: { type: "array", items: { type: "string" } }
          }
        }
      });
      setAnalysis(result);
    } catch (error) {
      console.error("Erro na análise:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md z-[200]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" /> Análise de Estilo com IA
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analisando a tatuagem...</p>
          </div>
        ) : analysis ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-primary text-primary-foreground">{analysis.style}</Badge>
              <Badge variant="secondary">{analysis.mood}</Badge>
              <Badge variant="outline">{analysis.complexity}</Badge>
              <Badge variant="outline">{analysis.color_palette}</Badge>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-1">Público-alvo</p>
                <p>{analysis.audience}</p>
              </div>
              <div>
                <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-1">Melhor local no corpo</p>
                <p>{analysis.placement_suggestion}</p>
              </div>
              {analysis.instagram_tips?.length > 0 && (
                <div>
                  <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-2">Dicas para o Instagram</p>
                  <ul className="space-y-1.5">
                    {analysis.instagram_tips.map((tip: string, i: number) => (
                      <li key={i} className="flex gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-muted-foreground">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>Fechar</Button>
              <Button className="flex-1" onClick={() => onComplete(analysis)}>
                <Sparkles className="w-4 h-4 mr-2" /> Usar no Editor
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
