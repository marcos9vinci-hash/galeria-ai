import React, { createContext, useContext } from 'react';
import { useSyncManager } from '@/hooks/useSyncManager';

interface SyncContextType {
  state: 'initializing' | 'online' | 'offline' | 'syncing' | 'saving' | 'saved' | 'error' | 'reconnecting';
  isOnline: boolean;
}

const SyncContext = createContext<SyncContextType>({ state: 'initializing', isOnline: true });

export const SyncProvider = ({ children }: { children: React.ReactNode }) => {
  const syncManager = useSyncManager();
  return <SyncContext.Provider value={syncManager}>{children}</SyncContext.Provider>;
};

export const useSync = () => useContext(SyncContext);
