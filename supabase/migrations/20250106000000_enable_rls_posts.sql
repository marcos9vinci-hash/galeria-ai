-- Enable RLS on posts table and add policies
-- Migration: 20250106000000_enable_rls_posts.sql

-- Enable RLS on posts table
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own posts
CREATE POLICY "Users can view own posts" ON public.posts
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own posts
CREATE POLICY "Users can insert own posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own posts
CREATE POLICY "Users can update own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own posts
CREATE POLICY "Users can delete own posts" ON public.posts
  FOR DELETE USING (auth.uid() = user_id);

-- Ensure user_id column exists (if not, add it)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'user_id' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN user_id UUID REFERENCES auth.users(id);
  END IF;
END $$;