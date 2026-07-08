// @ts-nocheck
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface RealtimePostPayload {
  id: string;
  user_id?: string;
  organization_id?: string;
  image: string;
  caption?: string;
  date?: string;
  type?: string;
  status?: string;
  scheduled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface RealtimeSubscription {
  channel: RealtimeChannel;
  unsubscribe: () => void;
}

export const realtimeService = {
  // Subscribe to posts changes for an organization
  subscribeToPosts(
    organizationId: string,
    callbacks: {
      onInsert?: (post: RealtimePostPayload) => void;
      onUpdate?: (post: RealtimePostPayload) => void;
      onDelete?: (post: RealtimePostPayload) => void;
      onError?: (error: Error) => void;
    }
  ): RealtimeSubscription {
    const channel = supabase
      .channel(`posts:${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          try {
            const post = payload.new as RealtimePostPayload;
            const oldPost = payload.old as RealtimePostPayload;

            switch (payload.eventType) {
              case 'INSERT':
                callbacks.onInsert?.(post);
                break;
              case 'UPDATE':
                callbacks.onUpdate?.(post);
                break;
              case 'DELETE':
                callbacks.onDelete?.(oldPost);
                break;
            }
          } catch (err) {
            callbacks.onError?.(err as Error);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to posts for org ${organizationId}`);
        } else if (status === 'CHANNEL_ERROR') {
          callbacks.onError?.(new Error('Realtime channel error'));
        }
      });

    return {
      channel,
      unsubscribe: () => {
        supabase.removeChannel(channel);
      },
    };
  },

  // Subscribe to scheduled posts (for calendar sync)
  subscribeToScheduledPosts(
    organizationId: string,
    callbacks: {
      onScheduleChange?: (post: RealtimePostPayload) => void;
      onError?: (error: Error) => void;
    }
  ): RealtimeSubscription {
    const channel = supabase
      .channel(`scheduled-posts:${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
          filter: `organization_id=eq.${organizationId} AND status=eq.scheduled`,
        },
        (payload) => {
          try {
            const post = payload.new as RealtimePostPayload;
            callbacks.onScheduleChange?.(post);
          } catch (err) {
            callbacks.onError?.(err as Error);
          }
        }
      )
      .subscribe();

    return {
      channel,
      unsubscribe: () => supabase.removeChannel(channel),
    };
  },

  // Subscribe to organization members (presence)
  subscribeToPresence(
    organizationId: string,
    callbacks: {
      onJoin?: (user: { id: string; email: string; role: string }) => void;
      onLeave?: (userId: string) => void;
      onSync?: (users: Array<{ id: string; email: string; role: string }>) => void;
      onError?: (error: Error) => void;
    }
  ): RealtimeSubscription {
    const channel = supabase
      .channel(`presence:${organizationId}`, {
        config: {
          presence: {
            key: organizationId,
          },
        },
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.values(state).flat() as Array<{ id: string; email: string; role: string }>;
        callbacks.onSync?.(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        const user = newPresences[0] as { id: string; email: string; role: string };
        callbacks.onJoin?.(user);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        const user = leftPresences[0] as { id: string };
        callbacks.onLeave?.(user.id);
      })
      .subscribe();

    return {
      channel,
      unsubscribe: () => supabase.removeChannel(channel),
    };
  },

  // Track user presence
  async trackPresence(
    organizationId: string,
    userData: { id: string; email: string; role: string }
  ): Promise<void> {
    const channel = supabase.channel(`presence:${organizationId}`);
    await channel.track(userData);
  },

  // Subscribe to AI generation logs (for progress updates)
  subscribeToAIGenerations(
    organizationId: string,
    callbacks: {
      onGenerationComplete?: (log: any) => void;
      onGenerationError?: (log: any) => void;
      onError?: (error: Error) => void;
    }
  ): RealtimeSubscription {
    const channel = supabase
      .channel(`ai-generations:${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_generation_logs',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          try {
            const log = payload.new;
            if (log.success) {
              callbacks.onGenerationComplete?.(log);
            } else {
              callbacks.onGenerationError?.(log);
            }
          } catch (err) {
            callbacks.onError?.(err as Error);
          }
        }
      )
      .subscribe();

    return {
      channel,
      unsubscribe: () => supabase.removeChannel(channel),
    };
  },

  // Subscribe to subscription/billing changes
  subscribeToBilling(
    organizationId: string,
    callbacks: {
      onSubscriptionChange?: (subscription: any) => void;
      onInvoiceChange?: (invoice: any) => void;
      onError?: (error: Error) => void;
    }
  ): RealtimeSubscription {
    const channel = supabase
      .channel(`billing:${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          try {
            const sub = payload.new;
            callbacks.onSubscriptionChange?.(sub);
          } catch (err) {
            callbacks.onError?.(err as Error);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          try {
            const inv = payload.new;
            callbacks.onInvoiceChange?.(inv);
          } catch (err) {
            callbacks.onError?.(err as Error);
          }
        }
      )
      .subscribe();

    return {
      channel,
      unsubscribe: () => supabase.removeChannel(channel),
    };
  },

  // Broadcast custom events (for collaborative features)
  async broadcast(
    organizationId: string,
    event: string,
    payload: any
  ): Promise<void> {
    const channel = supabase.channel(`broadcast:${organizationId}`);
    await channel.send({
      type: 'broadcast',
      event,
      payload,
    });
  },

  // Listen for broadcasts
  subscribeToBroadcasts(
    organizationId: string,
    callbacks: {
      onBroadcast?: (event: string, payload: any) => void;
      onError?: (error: Error) => void;
    }
  ): RealtimeSubscription {
    const channel = supabase
      .channel(`broadcast:${organizationId}`)
      .on('broadcast', { event: '*' }, ({ event, payload }) => {
        callbacks.onBroadcast?.(event, payload);
      })
      .subscribe();

    return {
      channel,
      unsubscribe: () => supabase.removeChannel(channel),
    };
  },

  // Clean up all subscriptions for an organization
  async unsubscribeAll(organizationId: string): Promise<void> {
    const channels = supabase.getChannels();
    for (const channel of channels) {
      if (channel.topic.includes(organizationId)) {
        await supabase.removeChannel(channel);
      }
    }
  },
};

// React hooks for realtime
import { useEffect, useRef, useCallback } from 'react';
import { useOrganization } from '@/hooks/useOrganization';

export function useRealtimePosts(
  callbacks: {
    onInsert?: (post: RealtimePostPayload) => void;
    onUpdate?: (post: RealtimePostPayload) => void;
    onDelete?: (post: RealtimePostPayload) => void;
  }
) {
  const { currentOrganization } = useOrganization();
  const subscriptionRef = useRef<RealtimeSubscription | null>(null);

  useEffect(() => {
    if (!currentOrganization) return;

    subscriptionRef.current = realtimeService.subscribeToPosts(
      currentOrganization.id,
      callbacks
    );

    return () => {
      subscriptionRef.current?.unsubscribe();
    };
  }, [currentOrganization, callbacks.onInsert, callbacks.onUpdate, callbacks.onDelete]);
}

export function useRealtimeScheduledPosts(
  onScheduleChange: (post: RealtimePostPayload) => void
) {
  const { currentOrganization } = useOrganization();
  const subscriptionRef = useRef<RealtimeSubscription | null>(null);

  useEffect(() => {
    if (!currentOrganization) return;

    subscriptionRef.current = realtimeService.subscribeToScheduledPosts(
      currentOrganization.id,
      { onScheduleChange }
    );

    return () => {
      subscriptionRef.current?.unsubscribe();
    };
  }, [currentOrganization, onScheduleChange]);
}

export function usePresence(
  callbacks: {
    onJoin?: (user: { id: string; email: string; role: string }) => void;
    onLeave?: (userId: string) => void;
    onSync?: (users: Array<{ id: string; email: string; role: string }>) => void;
  }
) {
  const { currentOrganization } = useOrganization();
  const subscriptionRef = useRef<RealtimeSubscription | null>(null);
  const trackRef = useRef(false);

  useEffect(() => {
    if (!currentOrganization) return;

    subscriptionRef.current = realtimeService.subscribeToPresence(
      currentOrganization.id,
      callbacks
    );

    return () => {
      subscriptionRef.current?.unsubscribe();
    };
  }, [currentOrganization, callbacks.onJoin, callbacks.onLeave, callbacks.onSync]);

  const track = useCallback(async (userData: { id: string; email: string; role: string }) => {
    if (!currentOrganization || trackRef.current) return;
    trackRef.current = true;
    try {
      await realtimeService.trackPresence(currentOrganization.id, userData);
    } finally {
      trackRef.current = false;
    }
  }, [currentOrganization]);

  return { track };
}

export function useRealtimeAIGenerations(
  callbacks: {
    onGenerationComplete?: (log: any) => void;
    onGenerationError?: (log: any) => void;
  }
) {
  const { currentOrganization } = useOrganization();
  const subscriptionRef = useRef<RealtimeSubscription | null>(null);

  useEffect(() => {
    if (!currentOrganization) return;

    subscriptionRef.current = realtimeService.subscribeToAIGenerations(
      currentOrganization.id,
      callbacks
    );

    return () => {
      subscriptionRef.current?.unsubscribe();
    };
  }, [currentOrganization, callbacks.onGenerationComplete, callbacks.onGenerationError]);
}

export function useRealtimeBilling(
  callbacks: {
    onSubscriptionChange?: (subscription: any) => void;
    onInvoiceChange?: (invoice: any) => void;
  }
) {
  const { currentOrganization } = useOrganization();
  const subscriptionRef = useRef<RealtimeSubscription | null>(null);

  useEffect(() => {
    if (!currentOrganization) return;

    subscriptionRef.current = realtimeService.subscribeToBilling(
      currentOrganization.id,
      callbacks
    );

    return () => {
      subscriptionRef.current?.unsubscribe();
    };
  }, [currentOrganization, callbacks.onSubscriptionChange, callbacks.onInvoiceChange]);
}

export function useBroadcast(organizationId?: string) {
  const { currentOrganization } = useOrganization();
  const orgId = organizationId || currentOrganization?.id;

  const broadcast = useCallback(async (event: string, payload: any) => {
    if (!orgId) return;
    await realtimeService.broadcast(orgId, event, payload);
  }, [orgId]);

  return { broadcast };
}

export function useBroadcastListener(
  organizationId: string | undefined,
  onBroadcast: (event: string, payload: any) => void
) {
  const subscriptionRef = useRef<RealtimeSubscription | null>(null);

  useEffect(() => {
    if (!organizationId) return;

    subscriptionRef.current = realtimeService.subscribeToBroadcasts(
      organizationId,
      { onBroadcast }
    );

    return () => {
      subscriptionRef.current?.unsubscribe();
    };
  }, [organizationId, onBroadcast]);
}