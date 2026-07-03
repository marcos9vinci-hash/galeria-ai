import React from 'react';
import { useSyncManager } from '@/hooks/useSyncManager';
import { Loader2, CheckCircle, CloudOff, AlertCircle, RefreshCw } from 'lucide-react';

export const SyncStatus = () => {
  const { state } = useSyncManager();

  switch (state) {
    case 'offline':
      return <div className="flex items-center gap-1 text-xs text-red-600"><CloudOff className="w-3 h-3"/> Offline</div>;
    case 'saving':
      return <div className="flex items-center gap-1 text-xs text-amber-600"><Loader2 className="w-3 h-3 animate-spin"/> Salvando...</div>;
    case 'syncing':
      return <div className="flex items-center gap-1 text-xs text-blue-600"><Loader2 className="w-3 h-3 animate-spin"/> Sincronizando...</div>;
    case 'reconnecting':
      return <div className="flex items-center gap-1 text-xs text-amber-600"><RefreshCw className="w-3 h-3 animate-spin"/> Reconectando...</div>;
    case 'error':
      return <div className="flex items-center gap-1 text-xs text-red-600"><AlertCircle className="w-3 h-3"/> Erro</div>;
    case 'saved':
    case 'initializing':
    case 'online':
    default:
      return <div className="flex items-center gap-1 text-xs text-green-600"><CheckCircle className="w-3 h-3"/> Salvo</div>;
  }
};

