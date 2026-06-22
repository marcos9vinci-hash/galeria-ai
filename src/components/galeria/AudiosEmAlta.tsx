import React from "react";
import { Badge } from "@/components/ui/badge";
import { Music, ArrowUpRight, Play, ExternalLink } from "lucide-react";
import { motion } from "motion/react";

interface AudioTrend {
  name: string;
  artist: string;
  trendReason: string;
  id: string;
}

const TATTOO_AUDIOS: AudioTrend[] = [
  { name: "Minimal Techno / Dark Synth", artist: "Tattoo Beats", trendReason: "Alta conversão em Reels de Blackwork", id: "1" },
  { name: "Lofi Study Session", artist: "Chill Master", trendReason: "Ideal para Timelapses de sessões longas", id: "2" },
  { name: "Phonk Drift Bass", artist: "Cyber Audio", trendReason: "Viral para Reels de Impacto / Reveal", id: "3" },
  { name: "Ambient Forest Sounds", artist: "Nature Mix", trendReason: "Perfeito para tattoos Botânicas / Fine Line", id: "4" },
  { name: "RockInstrumental (Heavy)", artist: "Ink Anthems", trendReason: "Bombando em Old School / Tradicional", id: "5" },
];

export default function AudiosEmAlta({ onSelect }: { onSelect?: (audio: string) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 text-primary">
          <Music className="w-4 h-4" />
          <h4 className="text-[11px] font-bold uppercase tracking-widest">Trending Audios (Nicho Tattoo)</h4>
        </div>
        <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-primary/20 text-primary bg-primary/5 uppercase animate-pulse">
           Live Trends
        </Badge>
      </div>

      <div className="grid gap-2">
        {TATTOO_AUDIOS.map((audio, i) => (
          <motion.div
            key={audio.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group flex items-center justify-between p-2 bg-muted/30 border border-border/50 rounded-lg hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer"
            onClick={() => onSelect?.(`${audio.name} - ${audio.artist}`)}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Play className="w-3.5 h-3.5 ml-0.5" />
              </div>
              <div>
                <h5 className="text-[11px] font-bold leading-none mb-1 group-hover:text-primary transition-colors">{audio.name}</h5>
                <p className="text-[9px] text-muted-foreground flex items-center gap-1">
                   {audio.artist} • <span className="text-green-500 font-medium">{audio.trendReason}</span>
                </p>
              </div>
            </div>
            <ArrowUpRight className="w-3 h-3 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0" />
          </motion.div>
        ))}
      </div>
      
      <p className="text-[9px] text-muted-foreground text-center italic mt-2">
        💡 Selecione um áudio para integrar ao seu planejamento.
      </p>
    </div>
  );
}
