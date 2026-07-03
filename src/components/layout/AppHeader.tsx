import React from 'react';
import { Button } from "@/components/ui/button";
import { Upload, Sparkles, Settings2 } from "lucide-react";
import { InstagramStatusBadge } from "@/components/integracoes/InstagramIntegracaoModal";

export const AppHeader = ({ 
  title, 
  description, 
  profileInfo, 
  igConnected, 
  hasPublishPerm, 
  isPlanning, 
  onOpenIgModal, 
  onOpenConfigWhatsapp, 
  onUpload 
}: any) => {
  return (
    <header className="px-6 py-4 border-b border-border flex flex-col md:flex-row justify-between md:items-center gap-4 bg-card/50 backdrop-blur-md sticky top-0 z-20">
      <div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent italic">{title}</h1>
        <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-1">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        <InstagramStatusBadge 
          connected={igConnected} 
          profile={profileInfo} 
          hasPublishPerm={hasPublishPerm}
          onClick={onOpenIgModal} 
        />
        <Button variant="ghost" size="icon" className="rounded-full" onClick={onOpenConfigWhatsapp}>
            <Settings2 className="w-5 h-5 text-muted-foreground" />
        </Button>
        <Button 
          size="sm" 
          className={`rounded-full px-4 ${isPlanning ? 'bg-primary/50 cursor-not-allowed' : ''}`} 
          onClick={onUpload}
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
};
