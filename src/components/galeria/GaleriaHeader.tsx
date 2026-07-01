import { Upload, Settings2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InstagramStatusBadge } from "@/components/integracoes/InstagramIntegracaoModal";

interface GaleriaHeaderProps {
  igConnected: boolean;
  profileInfo: any;
  hasPublishPerm: boolean;
  isPlanning: boolean;
  onOpenIgModal: () => void;
  onOpenWhatsApp: () => void;
  onUploadClick: () => void;
}

export default function GaleriaHeader({
  igConnected,
  profileInfo,
  hasPublishPerm,
  isPlanning,
  onOpenIgModal,
  onOpenWhatsApp,
  onUploadClick,
}: GaleriaHeaderProps) {
  return (
    <header className="px-6 py-4 border-b border-border flex flex-col md:flex-row justify-between md:items-center gap-4 bg-card/50 backdrop-blur-md sticky top-0 z-20">
      <div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent italic">
          Galeria IA
        </h1>
        <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-1">
          Estúdio Criativo de Tatuagem
        </p>
      </div>
      <div className="flex items-center gap-3">
        <InstagramStatusBadge
          connected={igConnected}
          profile={profileInfo}
          hasPublishPerm={hasPublishPerm}
          onClick={onOpenIgModal}
        />
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={onOpenWhatsApp}
        >
          <Settings2 className="w-5 h-5 text-muted-foreground" />
        </Button>
        <div className="hidden md:block" />
        <Button
          size="sm"
          className={`rounded-full px-4 ${isPlanning ? 'bg-primary/50 cursor-not-allowed' : ''}`}
          onClick={onUploadClick}
          disabled={isPlanning}
        >
          {isPlanning ? (
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-pulse text-yellow-300" />
              <span>O Cérebro planeja...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              <span>Carregar</span>
            </div>
          )}
        </Button>
      </div>
    </header>
  );
}
