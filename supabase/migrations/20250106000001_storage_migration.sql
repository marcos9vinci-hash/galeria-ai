-- Create Supabase Storage bucket and migrate images from base64 to Storage
-- Migration: 20250106000001_storage_migration.sql

-- Create storage bucket for post images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('post-images', 'post-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can upload their own images
CREATE POLICY "Users can upload own images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'post-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can view their own images
CREATE POLICY "Users can view own images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'post-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can update their own images
CREATE POLICY "Users can update own images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'post-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can delete their own images
CREATE POLICY "Users can delete own images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'post-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Add storage_path column to posts table for tracking uploaded images
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'storage_path' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN storage_path TEXT;
  END IF;
END $$;

-- Function to generate signed URL for post images
CREATE OR REPLACE FUNCTION get_post_image_signed_url(p_storage_path TEXT, p_expires_in INTEGER DEFAULT 3600)
RETURNS TEXT AS $$
DECLARE
  v_signed_url TEXT;
BEGIN
  IF p_storage_path IS NULL THEN
    RETURN NULL;
  END IF;
  
  SELECT signed_url INTO v_signed_url
  FROM storage.create_signed_url('post-images', p_storage_path, p_expires_in);
  
  RETURN v_signed_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;