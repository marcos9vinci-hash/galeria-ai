import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles } from "lucide-react";

export default function ContextoModal({ open, onClose, contexto, setContexto, onGenerate }: any) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Contexto para a IA
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label>Tema / estilo da tatuagem</Label>
            <Input
              placeholder="Ex: tribal, floral, realismo..."
              value={contexto.tema}
              onChange={(e) => setContexto((c: any) => ({ ...c, tema: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label>Público-alvo</Label>
            <Select value={contexto.publico} onValueChange={(v) => setContexto((c: any) => ({ ...c, publico: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jovens_18_25">Jovens (18–25 anos)</SelectItem>
                <SelectItem value="adultos_25_40">Adultos (25–40 anos)</SelectItem>
                <SelectItem value="todos">Todos os públicos</SelectItem>
                <SelectItem value="collectors">Colecionadores de tattoo</SelectItem>
                <SelectItem value="primeira_tatuagem">Primeira tatuagem</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Tom da legenda</Label>
            <Select value={contexto.tom} onValueChange={(v) => setContexto((c: any) => ({ ...c, tom: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inspirador">Inspirador</SelectItem>
                <SelectItem value="informativo">Informativo</SelectItem>
                <SelectItem value="divertido">Divertido</SelectItem>
                <SelectItem value="premium">Premium / exclusivo</SelectItem>
                <SelectItem value="minimalista">Minimalista</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Informação extra (opcional)</Label>
            <Input
              placeholder="Ex: tatuagem feita em uma sessão, cover-up..."
              value={contexto.extra}
              onChange={(e) => setContexto((c: any) => ({ ...c, extra: e.target.value }))}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                onGenerate();
                onClose();
              }}
            >
              <Sparkles className="w-4 h-4 mr-2" /> Gerar com Contexto
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
