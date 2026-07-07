-- Billing and Subscriptions with Stripe
-- Migration: 20250107000002_billing_subscriptions.sql

-- Plans table
CREATE TABLE IF NOT EXISTS public.plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly_cents INTEGER NOT NULL DEFAULT 0,
  price_yearly_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'brl',
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  features JSONB NOT NULL DEFAULT '{}',
  limits JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  plan_id TEXT NOT NULL REFERENCES public.plans(id),
  status TEXT NOT NULL CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  stripe_invoice_id TEXT UNIQUE,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'brl',
  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  invoice_pdf_url TEXT,
  hosted_invoice_url TEXT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Usage tracking for metered billing
CREATE TABLE IF NOT EXISTS public.usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  metric TEXT NOT NULL, -- e.g., 'posts_created', 'ai_generations', 'storage_mb'
  quantity INTEGER NOT NULL DEFAULT 1,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;

-- Plans: anyone can read active plans
CREATE POLICY "Anyone can read active plans" ON public.plans
  FOR SELECT USING (is_active = true);

-- Subscriptions: org members can view, service role manages
CREATE POLICY "Org members can view subscription" ON public.subscriptions
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role manages subscriptions" ON public.subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- Invoices: org admins can view, service role manages
CREATE POLICY "Org admins can view invoices" ON public.invoices
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Service role manages invoices" ON public.invoices
  FOR ALL USING (auth.role() = 'service_role');

-- Usage records: org members can insert/view their own, service role manages
CREATE POLICY "Org members can view usage" ON public.usage_records
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can insert usage" ON public.usage_records
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Service role manages usage" ON public.usage_records
  FOR ALL USING (auth.role() = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id ON public.subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON public.invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_id ON public.invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_usage_org_id ON public.usage_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_usage_subscription_id ON public.usage_records(subscription_id);
CREATE INDEX IF NOT EXISTS idx_usage_metric_timestamp ON public.usage_records(metric, timestamp);

-- Insert default plans
INSERT INTO public.plans (id, name, description, price_monthly_cents, price_yearly_cents, features, limits, sort_order) VALUES
  ('free', 'Gratuito', 'Para começar a explorar', 0, 0, 
   '{"ai_captions": true, "instagram_scheduling": true, "calendar_view": true, "basic_analytics": true}',
   '{"posts_per_month": 10, "ai_generations_per_month": 20, "storage_mb": 100, "team_members": 1, "organizations": 1}',
   0),
  ('pro', 'Profissional', 'Para tatuadores e estúdios ativos', 9900, 99000, -- R$ 99/mês ou R$ 990/ano
   '{"ai_captions": true, "instagram_scheduling": true, "buffer_integration": true, "advanced_analytics": true, "calendar_view": true, "niche_config": true, "quarterly_planning": true, "whatsapp_config": true}',
   '{"posts_per_month": 100, "ai_generations_per_month": 500, "storage_mb": 1000, "team_members": 5, "organizations": 3}',
   1),
  ('enterprise', 'Enterprise', 'Para agências e grandes estúdios', 29900, 299000, -- R$ 299/mês ou R$ 2990/ano
   '{"ai_captions": true, "instagram_scheduling": true, "buffer_integration": true, "advanced_analytics": true, "calendar_view": true, "niche_config": true, "quarterly_planning": true, "whatsapp_config": true, "custom_branding": true, "api_access": true, "priority_support": true, "sso": true}',
   '{"posts_per_month": -1, "ai_generations_per_month": -1, "storage_mb": 10000, "team_members": -1, "organizations": -1}',
   2)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly_cents = EXCLUDED.price_monthly_cents,
  price_yearly_cents = EXCLUDED.price_yearly_cents,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();