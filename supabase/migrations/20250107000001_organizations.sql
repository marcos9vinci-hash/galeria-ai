-- Organizations / Multi-tenant support
-- Migration: 20250107000001_organizations.sql

-- Organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  max_users INTEGER DEFAULT 5,
  max_posts_per_month INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Organization members (many-to-many users <-> organizations)
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Add organization_id to posts table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'organization_id' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
  END IF;
END $$;

-- Add organization_id to other tables that need isolation
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'carousel_slides' AND column_name = 'organization_id' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.carousel_slides ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Policies for organizations
CREATE POLICY "Members can view their organizations" ON public.organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update organization" ON public.organizations
  FOR UPDATE USING (
    id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners can delete organization" ON public.organizations
  FOR DELETE USING (
    id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Policies for organization_members
CREATE POLICY "Members can view org members" ON public.organization_members
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage members" ON public.organization_members
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Service role can manage everything
CREATE POLICY "Service role full access organizations" ON public.organizations
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access org members" ON public.organization_members
  FOR ALL USING (auth.role() = 'service_role');

-- Updated posts RLS to include organization isolation
DROP POLICY IF EXISTS "Users can view own posts" ON public.posts;
CREATE POLICY "Users can view org posts" ON public.posts
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own posts" ON public.posts;
CREATE POLICY "Members can insert org posts" ON public.posts
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
    )
  );

DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
CREATE POLICY "Members can update org posts" ON public.posts
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
    )
  );

DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
CREATE POLICY "Admins can delete org posts" ON public.posts
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_posts_organization_id ON public.posts(organization_id);