import { supabase } from '@/lib/supabase';

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  rolloutPercentage?: number;
  userIds?: string[];
  metadata?: Record<string, any>;
}

export interface RemoteConfig {
  [key: string]: any;
}

class FeatureFlagService {
  private cache: Map<string, { data: FeatureFlag; expiresAt: number }> = new Map();
  private configCache: Map<string, { data: RemoteConfig; expiresAt: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async getFlag(key: string, userId?: string): Promise<FeatureFlag | null> {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return this.evaluateFlag(cached.data, userId);
    }

    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('key', key)
        .single();

      if (error || !data) {
        return this.getDefaultFlag(key);
      }

      const flag: FeatureFlag = {
        key: data.key,
        enabled: data.enabled,
        rolloutPercentage: data.rollout_percentage,
        userIds: data.user_ids,
        metadata: data.metadata,
      };

      this.cache.set(key, { data: flag, expiresAt: Date.now() + this.CACHE_TTL });
      return this.evaluateFlag(flag, userId);
    } catch {
      return this.getDefaultFlag(key);
    }
  }

  private evaluateFlag(flag: FeatureFlag, userId?: string): FeatureFlag {
    if (!flag.enabled) {
      return { ...flag, enabled: false };
    }

    // Check user-specific targeting
    if (flag.userIds && userId && flag.userIds.includes(userId)) {
      return flag;
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100 && userId) {
      const hash = this.hashString(userId + flag.key);
      const bucket = hash % 100;
      if (bucket >= flag.rolloutPercentage) {
        return { ...flag, enabled: false };
      }
    }

    return flag;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private getDefaultFlag(key: string): FeatureFlag | null {
    const defaults: Record<string, FeatureFlag> = {
      'ai-caption-generation': { key: 'ai-caption-generation', enabled: true },
      'instagram-scheduling': { key: 'instagram-scheduling', enabled: true },
      'buffer-integration': { key: 'buffer-integration', enabled: true },
      'analytics-dashboard': { key: 'analytics-dashboard', enabled: true },
      'calendar-view': { key: 'calendar-view', enabled: true },
      'niche-config': { key: 'niche-config', enabled: true },
      'whatsapp-config': { key: 'whatsapp-config', enabled: false },
      'quarterly-planning': { key: 'quarterly-planning', enabled: true },
      'storage-migration': { key: 'storage-migration', enabled: false },
      'pwa-support': { key: 'pwa-support', enabled: false },
    };
    return defaults[key] || null;
  }

  async getAllFlags(userId?: string): Promise<Record<string, boolean>> {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*');

      if (error || !data) {
        return this.getDefaultFlags();
      }

      const flags: Record<string, boolean> = {};
      for (const row of data) {
        const flag: FeatureFlag = {
          key: row.key,
          enabled: row.enabled,
          rolloutPercentage: row.rollout_percentage,
          userIds: row.user_ids,
          metadata: row.metadata,
        };
        const evaluated = this.evaluateFlag(flag, userId);
        flags[row.key] = evaluated.enabled;
      }
      return flags;
    } catch {
      return this.getDefaultFlags();
    }
  }

  private getDefaultFlags(): Record<string, boolean> {
    return {
      'ai-caption-generation': true,
      'instagram-scheduling': true,
      'buffer-integration': true,
      'analytics-dashboard': true,
      'calendar-view': true,
      'niche-config': true,
      'whatsapp-config': false,
      'quarterly-planning': true,
      'storage-migration': false,
      'pwa-support': false,
    };
  }

  async getRemoteConfig(key: string): Promise<RemoteConfig | null> {
    const cached = this.configCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    try {
      const { data, error } = await supabase
        .from('remote_config')
        .select('*')
        .eq('key', key)
        .single();

      if (error || !data) {
        return this.getDefaultConfig(key);
      }

      const config = data.value as RemoteConfig;
      this.configCache.set(key, { data: config, expiresAt: Date.now() + this.CACHE_TTL });
      return config;
    } catch {
      return this.getDefaultConfig(key);
    }
  }

  private getDefaultConfig(key: string): RemoteConfig | null {
    const defaults: Record<string, RemoteConfig> = {
      'app': {
        maxUploadSize: 5 * 1024 * 1024, // 5MB
        allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        defaultPostType: 'feed',
        maxHashtags: 30,
        defaultTimezone: 'America/Sao_Paulo',
      },
      'ai': {
        maxCaptionLength: 2200,
        defaultTone: 'professional',
        hashtagCount: 10,
      },
      'scheduler': {
        minIntervalMinutes: 30,
        maxPostsPerDay: 10,
        defaultPostTime: '19:00',
      },
      'ui': {
        theme: 'dark',
        sidebarCollapsed: false,
        compactMode: false,
      },
    };
    return defaults[key] || null;
  }

  clearCache() {
    this.cache.clear();
    this.configCache.clear();
  }
}

export const featureFlags = new FeatureFlagService();

// React hook for feature flags
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export function useFeatureFlag(key: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['featureFlag', key, user?.id],
    queryFn: () => featureFlags.getFlag(key, user?.id),
    staleTime: 5 * 60 * 1000,
  });
}

export function useFeatureFlags() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['featureFlags', user?.id],
    queryFn: () => featureFlags.getAllFlags(user?.id),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRemoteConfig(key: string) {
  return useQuery({
    queryKey: ['remoteConfig', key],
    queryFn: () => featureFlags.getRemoteConfig(key),
    staleTime: 5 * 60 * 1000,
  });
}