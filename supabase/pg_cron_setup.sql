-- pg_cron setup for auto-caption worker
-- Run this in Supabase SQL Editor

-- 1. Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Create function to generate captions for pending posts
CREATE OR REPLACE FUNCTION generate_captions_for_due_slots()
RETURNS void AS $$
DECLARE
  post_record RECORD;
  caption_text TEXT;
  ai_response JSONB;
BEGIN
  -- Find posts that need captions (scheduled within 15 minutes, no caption yet)
  FOR post_record IN 
    SELECT id, image_url, scheduled_at 
    FROM posts 
    WHERE status = 'agendado' 
    AND caption IS NULL 
    AND scheduled_at <= NOW() + INTERVAL '15 minutes'
    AND scheduled_at > NOW()
    LIMIT 10
  LOOP
    -- Call generate-caption Edge Function
    BEGIN
      PERFORM net.http_post(
        url := current_setting('supabase.functions.generate-caption.url') || '/generate-caption',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('supabase.service_role_key')
        ),
        body := jsonb_build_object(
          'imageUrl', post_record.image_url,
          'postId', post_record.id
        )
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue with other posts
      RAISE NOTICE 'Failed to generate caption for post %: %', post_record.id, SQLERRM;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. Schedule the function to run every 15 minutes
SELECT cron.schedule(
  'generate-captions-every-15min',
  '*/15 * * * *',
  'SELECT generate_captions_for_due_slots();'
);

-- 4. Optional: Function to publish due posts
CREATE OR REPLACE FUNCTION publish_due_posts()
RETURNS void AS $$
DECLARE
  post_record RECORD;
BEGIN
  -- Find posts ready to publish (scheduled time passed, not yet published)
  FOR post_record IN 
    SELECT id, image_url, caption, scheduled_at, buffer_profile_id, ig_id
    FROM posts 
    WHERE status IN ('legenda_pronta', 'agendado_buffer', 'agendado_instagram')
    AND scheduled_at <= NOW()
    AND published_at IS NULL
    LIMIT 10
  LOOP
    -- Determine publish method (Buffer or Instagram)
    -- This would call the appropriate Edge Function
    -- Implementation depends on your publish flow
    RAISE NOTICE 'Ready to publish post %', post_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 5. Schedule publisher every 5 minutes
SELECT cron.schedule(
  'publish-due-posts-every-5min',
  '*/5 * * * *',
  'SELECT publish_due_posts();'
);

-- View scheduled jobs
SELECT * FROM cron.job;

-- To remove jobs:
-- SELECT cron.unschedule('generate-captions-every-15min');
-- SELECT cron.unschedule('publish-due-posts-every-5min');