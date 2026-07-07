import { registerSW } from 'virtual:pwa-register/react';

export function usePWA() {
  const { needRefresh, offlineReady, updateServiceWorker } = registerSW({
    onNeedRefresh() {
      // Show update available notification
      console.log('New version available');
    },
    onOfflineReady() {
      console.log('App ready to work offline');
    },
  });

  return {
    needRefresh,
    offlineReady,
    updateServiceWorker,
  };
}

// Offline queue for mutations
interface QueuedMutation {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
  retries: number;
}

class OfflineQueue {
  private queue: QueuedMutation[] = [];
  private dbName = 'galeria-ia-offline';
  private storeName = 'mutations';
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        this.loadQueue();
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  private async loadQueue(): Promise<void> {
    if (!this.db) return;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();
      
      request.onsuccess = () => {
        this.queue = request.result || [];
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  private async saveQueue(): Promise<void> {
    if (!this.db) return;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      // Clear and rewrite
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => {
        for (const mutation of this.queue) {
          store.add(mutation);
        }
        resolve();
      };
      clearRequest.onerror = () => reject(clearRequest.error);
    });
  }

  async enqueue(mutation: Omit<QueuedMutation, 'id' | 'timestamp' | 'retries'>): Promise<string> {
    const id = crypto.randomUUID();
    const queued: QueuedMutation = {
      ...mutation,
      id,
      timestamp: Date.now(),
      retries: 0,
    };
    
    this.queue.push(queued);
    await this.saveQueue();
    return id;
  }

  async dequeue(id: string): Promise<void> {
    this.queue = this.queue.filter(m => m.id !== id);
    await this.saveQueue();
  }

  async incrementRetries(id: string): Promise<void> {
    const mutation = this.queue.find(m => m.id === id);
    if (mutation) {
      mutation.retries++;
      await this.saveQueue();
    }
  }

  getQueue(): QueuedMutation[] {
    return [...this.queue];
  }

  getPendingCount(): number {
    return this.queue.length;
  }

  async clear(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
  }
}

export const offlineQueue = new OfflineQueue();

// Sync service - processes queue when online
import { supabase } from '@/lib/supabase';

export const syncService = {
  async processQueue(): Promise<{ processed: number; failed: number }> {
    if (!navigator.onLine) return { processed: 0, failed: 0 };
    
    const queue = offlineQueue.getQueue();
    let processed = 0;
    let failed = 0;

    for (const mutation of queue) {
      if (mutation.retries >= 3) {
        failed++;
        continue;
      }

      try {
        await this.executeMutation(mutation);
        await offlineQueue.dequeue(mutation.id);
        processed++;
      } catch (err) {
        await offlineQueue.incrementRetries(mutation.id);
        failed++;
      }
    }

    return { processed, failed };
  },

  async executeMutation(mutation: QueuedMutation): Promise<void> {
    const { type, table, data } = mutation;

    switch (type) {
      case 'create':
        await supabase.from(table).insert(data);
        break;
      case 'update':
        await supabase.from(table).update(data).eq('id', data.id);
        break;
      case 'delete':
        await supabase.from(table).delete().eq('id', data.id);
        break;
    }
  },

  // Setup periodic sync
  setupPeriodicSync(intervalMs: number = 30000): () => void {
    const interval = setInterval(() => {
      if (navigator.onLine) {
        this.processQueue();
      }
    }, intervalMs);

    // Also sync when coming online
    window.addEventListener('online', () => {
      this.processQueue();
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', () => this.processQueue());
    };
  },
};

// React hook for offline queue
import { useState, useEffect } from 'react';

export function useOfflineQueue() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const updateCount = () => setPendingCount(offlineQueue.getPendingCount());
    updateCount();

    const handleOnline = () => {
      setIsOnline(true);
      syncService.processQueue();
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for queue changes
    const originalEnqueue = offlineQueue.enqueue.bind(offlineQueue);
    offlineQueue.enqueue = async (...args) => {
      const result = await originalEnqueue(...args);
      setPendingCount(offlineQueue.getPendingCount());
      return result;
    };

    const originalDequeue = offlineQueue.dequeue.bind(offlineQueue);
    offlineQueue.dequeue = async (...args) => {
      const result = await originalDequeue(...args);
      setPendingCount(offlineQueue.getPendingCount());
      return result;
    };

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { pendingCount, isOnline };
}