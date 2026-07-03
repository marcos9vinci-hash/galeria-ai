import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingOverlay = ({ message = "Carregando..." }: { message?: string }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
    <div className="flex flex-col items-center gap-2">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  </div>
);
