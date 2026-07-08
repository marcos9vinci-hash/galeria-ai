import { useSyncManager } from '@/hooks/useSyncManager';

type SyncState = 'initializing' | 'online' | 'offline' | 'syncing' | 'saving' | 'saved' | 'error' | 'reconnecting';

export const SyncStatus = () => {
  const { state, isOnline } = useSyncManager();

  const getStatusConfig = (state: SyncState) => {
    switch (state) {
      case 'offline':
        return { label: 'Offline', color: 'text-red-500', bg: 'bg-red-500/20' };
      case 'saving':
        return { label: 'Salvando...', color: 'text-yellow-500', bg: 'bg-yellow-500/20' };
      case 'syncing':
        return { label: 'Sincronizando...', color: 'text-blue-500', bg: 'bg-blue-500/20' };
      case 'saved':
        return { label: 'Salvo', color: 'text-green-500', bg: 'bg-green-500/20' };
      case 'error':
        return { label: 'Erro', color: 'text-red-500', bg: 'bg-red-500/20' };
      case 'reconnecting':
        return { label: 'Reconectando...', color: 'text-orange-500', bg: 'bg-orange-500/20' };
      case 'initializing':
        return { label: 'Iniciando...', color: 'text-gray-500', bg: 'bg-gray-500/20' };
      case 'online':
      default:
        return { label: isOnline ? 'Online' : 'Offline', color: 'text-green-500', bg: 'bg-green-500/20' };
    }
  };

  const config = getStatusConfig(state);

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
      <span className="relative flex h-1.5 w-1.5">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.bg} opacity-75`} />
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${config.color}`} />
      </span>
      {config.label}
    </div>
  );
};
