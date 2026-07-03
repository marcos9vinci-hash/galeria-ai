import { useState, useEffect } from 'react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';

export const useSyncManager = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  let state: 'initializing' | 'online' | 'offline' | 'syncing' | 'saving' | 'saved' | 'error' | 'reconnecting' = 'online';

  if (!isOnline) {
    state = 'offline';
  } else if (isMutating > 0) {
    state = 'saving';
  } else if (isFetching > 0) {
    state = 'syncing';
  } else {
    state = 'saved';
  }

  return { state, isOnline };
};
