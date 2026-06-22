import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, Plus, Sparkles } from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function SugerirEspacos({ posts, onSelect }: any) {
  const [suggestions, setSuggestions] = React.useState<any[]>([]);

  const analyzeAndSuggest = () => {
    // Simulated logic: look for gaps in the next 7 days
    const today = new Date();
    const suggested = [
      { date: addDays(today, 1), time: '12:30', type: 'reels', score: 95, reason: 'Pico de almoço Terça' },
      { date: addDays(today, 2), time: '19:00', type: 'feed', score: 88, reason: 'Horário nobre Quarta' },
      { date: addDays(today, 4), time: '11:00', type: 'story', score: 82, reason: 'Engajamento manhã Sexta' },
      { date: addDays(today, 5), time: '14:00', type: 'reels', score: 91, reason: 'Consumo alto Sábado' },
    ];
    setSuggestions(suggested);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-sm">Gaps de Postagem</h3>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1" onClick={analyzeAndSuggest}>
          <Sparkles className="w-3 h-3 text-primary" /> Analisar Calendário
        </Button>
      </div>

      <div className="grid gap-2">
        {suggestions.length > 0 ? (
          suggestions.map((s, i) => (
            <Card key={i} className="border-none bg-muted/40 hover:bg-muted/60 transition-colors cursor-pointer" onClick={() => onSelect(s)}>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary">
                     <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">
                       {format(s.date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                       <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {s.time}
                       </span>
                       <Badge variant="outline" className="text-[8px] h-3 px-1 border-primary/30 text-primary">
                          {s.type.toUpperCase()}
                       </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                   <div className="text-[10px] text-green-500 font-bold">{s.score}% Match</div>
                   <div className="text-[8px] text-muted-foreground whitespace-nowrap">{s.reason}</div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="p-6 text-center text-muted-foreground border-2 border-dashed rounded-lg bg-muted/10 opacity-60">
            <p className="text-xs">Descubra as janelas de oportunidade para novos posts.</p>
          </div>
        )}
      </div>
    </div>
  );
}
