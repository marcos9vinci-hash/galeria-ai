import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, MessageSquare, Info } from "lucide-react";

interface ConfigWhatsAppProps {
  onClose: () => void;
}

export default function ConfigWhatsApp({ onClose }: ConfigWhatsAppProps) {
  const [number, setNumber] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('whatsapp_number') || '';
    setNumber(stored);
  }, []);

  const handleSave = () => {
    localStorage.setItem('whatsapp_number', number.trim());
    setSaved(true);
    setTimeout(() => { 
      setSaved(false); 
      onClose(); 
    }, 1200);
  };

  const handleClear = () => {
    setNumber('');
    localStorage.removeItem('whatsapp_number');
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm z-[200]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-green-600" /> Configurar WhatsApp
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted rounded-lg p-3 flex gap-2 text-xs text-muted-foreground">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>Configure um número padrão para receber lembretes de posts. Você pode alterar a qualquer momento.</p>
          </div>

          <div className="space-y-1">
            <Label>Número do WhatsApp</Label>
            <Input
              placeholder="Ex: 5511999999999"
              value={number}
              onChange={e => setNumber(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Formato: código do país + DDD + número (sem espaços ou símbolos).
              <br />Ex: <span className="font-mono">5511999887766</span>
            </p>
          </div>

          {number && (
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <p className="text-xs text-green-700 dark:text-green-400 font-medium">✓ Número configurado</p>
              <p className="text-xs text-green-600 dark:text-green-500 font-mono mt-0.5">+{number.replace(/\D/g, '')}</p>
            </div>
          )}

          <div className="flex gap-2">
            {number && (
              <Button variant="outline" size="sm" onClick={handleClear} className="text-xs">
                Remover
              </Button>
            )}
            <Button className="flex-1" onClick={handleSave} variant={saved ? "outline" : "default"}>
              {saved
                ? <><CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> Salvo!</>
                : 'Salvar Número'
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
