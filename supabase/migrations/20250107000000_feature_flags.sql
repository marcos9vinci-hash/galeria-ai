-- Feature Flags and Remote Config tables
-- Migration: 20250107000000_feature_flags.sql

-- Feature flags table
CREATE TABLE IF NOT EXISTS public.feature_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT false,
  rollout_percentage INTEGER CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  user_ids UUID[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Remote config table
CREATE TABLE IF NOT EXISTS public.remote_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remote_config ENABLE ROW LEVEL SECURITY;

-- Policies: Anyone can read feature flags (for client-side evaluation)
CREATE POLICY "Anyone can read feature flags" ON public.feature_flags
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read remote config" ON public.remote_config
  FOR SELECT USING (true);

-- Only service role can modify (admin via Edge Functions)
CREATE POLICY "Service role can manage feature flags" ON public.feature_flags
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage remote config" ON public.remote_config
  FOR ALL USING (auth.role() = 'service_role');

-- Insert default feature flags
INSERT INTO public.feature_flags (key, enabled, rollout_percentage, user_ids, metadata) VALUES
  ('ai-caption-generation', true, 100, '{}', '{"description": "AI-powered caption generation"}'),
  ('instagram-scheduling', true, 100, '{}', '{"description": "Instagram post scheduling"}'),
  ('buffer-integration', true, 100, '{}', '{"description": "Buffer publishing integration"}'),
  ('analytics-dashboard', true, 100, '{}', '{"description": "Analytics dashboard"}'),
  ('calendar-view', true, 100, '{}', '{"description": "Calendar view for posts"}'),
  ('niche-config', true, 100, '{}', '{"description": "Niche configuration"}'),
  ('whatsapp-config', false, 0, '{}', '{"description": "WhatsApp Business integration"}'),
  ('quarterly-planning', true, 100, '{}', '{"description": "Quarterly planning view"}'),
  ('storage-migration', false, 0, '{}', '{"description": "Storage migration from base64"}'),
  ('pwa-support', false, 0, '{}', '{"description": "PWA/offline support"}')
ON CONFLICT (key) DO NOTHING;

-- Insert default remote config
INSERT INTO public.remote_config (key, value, description) VALUES
  ('app', '{"maxUploadSize": 5242880, "allowedImageTypes": ["image/jpeg", "image/png", "image/webp", "image/gif"], "defaultPostType": "feed", "maxHashtags": 30, "defaultTimezone": "America/Sao_Paulo"}', 'App-wide configuration'),
  ('ai', '{"maxCaptionLength": 2200, "defaultTone": "professional", "hashtagCount": 10}', 'AI generation settings'),
  ('scheduler', '{"minIntervalMinutes": 30, "maxPostsPerDay": 10, "defaultPostTime": "19:00"}', 'Post scheduling settings'),
  ('ui', '{"theme": "dark", "sidebarCollapsed": false, "compactMode": false}', 'UI preferences')
ON CONFLICT (key) DO NOTHING;