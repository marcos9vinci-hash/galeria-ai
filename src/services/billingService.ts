// @ts-nocheck
import { supabase } from '@/lib/supabase';

export interface Plan {
  id: string;
  name: string;
  description: string;
  price_monthly_cents: number;
  price_yearly_cents: number;
  currency: string;
  stripe_price_id_monthly?: string;
  stripe_price_id_yearly?: string;
  features: Record<string, boolean>;
  limits: Record<string, number>;
  is_active: boolean;
  sort_order: number;
}

export interface Subscription {
  id: string;
  organization_id: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  stripe_price_id?: string;
  plan_id: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid';
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  canceled_at?: string;
  trial_start?: string;
  trial_end?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  plan?: Plan;
}

export interface Invoice {
  id: string;
  organization_id: string;
  subscription_id?: string;
  stripe_invoice_id: string;
  amount_cents: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  invoice_pdf_url?: string;
  hosted_invoice_url?: string;
  period_start?: string;
  period_end?: string;
  paid_at?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export const billingService = {
  async getPlans(): Promise<Plan[]> {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async getSubscription(organizationId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plan:plans(*)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  async getInvoices(organizationId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createCheckoutSession(
    priceId: string, 
    organizationId: string,
    successUrl?: string,
    cancelUrl?: string
  ): Promise<{ url: string }> {
    const siteUrl = 'https://galeria-ia-inkdream.netlify.app';
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        priceId,
        organizationId,
        successUrl: successUrl || `${siteUrl}/billing?success=true`,
        cancelUrl: cancelUrl || `${siteUrl}/billing?canceled=true`,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create checkout session');
    return data;
  },

  async createPortalSession(organizationId: string, returnUrl?: string): Promise<{ url: string }> {
    const siteUrl = 'https://galeria-ia-inkdream.netlify.app';
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe/create-portal-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        organizationId,
        returnUrl: returnUrl || `${siteUrl}/billing`,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create portal session');
    return data;
  },

  async trackUsage(organizationId: string, metric: string, quantity: number = 1, metadata?: Record<string, any>): Promise<void> {
    const { error } = await supabase
      .from('usage_records')
      .insert({
        organization_id: organizationId,
        metric,
        quantity,
        metadata: metadata || {},
      });
    
    if (error) throw error;
  },

  async getUsage(organizationId: string, metric: string, since?: Date): Promise<number> {
    let query = supabase
      .from('usage_records')
      .select('quantity')
      .eq('organization_id', organizationId)
      .eq('metric', metric);

    if (since) {
      query = query.gte('timestamp', since.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return data?.reduce((sum, r) => sum + r.quantity, 0) || 0;
  },

  formatPrice(cents: number, currency: string = 'BRL'): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(cents / 100);
  },

  getPlanLimits(plan: Plan): Record<string, number> {
    return plan.limits || {};
  },

  isFeatureEnabled(plan: Plan, feature: string): boolean {
    return plan.features?.[feature] === true;
  },

  isUnlimited(limit: number): boolean {
    return limit === -1;
  },

  getUsagePercentage(used: number, limit: number): number {
    if (this.isUnlimited(limit)) return 0;
    if (limit === 0) return 100;
    return Math.min(100, Math.round((used / limit) * 100));
  },
};

// React hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '@/hooks/useOrganization';

export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: () => billingService.getPlans(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSubscription() {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['subscription', currentOrganization?.id],
    queryFn: () => billingService.getSubscription(currentOrganization!.id),
    enabled: !!currentOrganization,
    staleTime: 30 * 1000,
  });
}

export function useInvoices() {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['invoices', currentOrganization?.id],
    queryFn: () => billingService.getInvoices(currentOrganization!.id),
    enabled: !!currentOrganization,
    staleTime: 60 * 1000,
  });
}

export function useCreateCheckoutSession() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ priceId, successUrl, cancelUrl }: { priceId: string; successUrl?: string; cancelUrl?: string }) => 
      billingService.createCheckoutSession(priceId, currentOrganization!.id, successUrl, cancelUrl),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });
}

export function useCreatePortalSession() {
  const { currentOrganization } = useOrganization();
  
  return useMutation({
    mutationFn: ({ returnUrl }: { returnUrl?: string }) => 
      billingService.createPortalSession(currentOrganization!.id, returnUrl),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });
}