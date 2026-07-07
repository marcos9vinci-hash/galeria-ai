import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://galeria-ia-inkdream.netlify.app',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,Stripe-Signature',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const signature = req.headers.get('Stripe-Signature');
  if (!signature) {
    return json({ error: 'Missing Stripe-Signature header' }, 400);
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return json({ error: 'Webhook signature verification failed' }, 400);
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return json({ received: true });
  } catch (err: any) {
    console.error('Webhook handler error:', err);
    return json({ error: err.message }, 500);
  }
});

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata?.organizationId;
  if (!organizationId) {
    console.error('No organizationId in subscription metadata');
    return;
  }

  // Get or create customer
  let customerId = subscription.customer as string;
  
  // Find plan by price ID
  const priceId = subscription.items.data[0]?.price.id;
  if (!priceId) return;

  const { data: plan } = await supabase
    .from('plans')
    .select('id')
    .or(`stripe_price_id_monthly.eq.${priceId},stripe_price_id_yearly.eq.${priceId}`)
    .single();

  if (!plan) {
    console.error('Plan not found for price:', priceId);
    return;
  }

  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      organization_id: organizationId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      plan_id: plan.id,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
      trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      metadata: subscription.metadata,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'stripe_subscription_id' });

  if (error) {
    console.error('Failed to upsert subscription:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Failed to update subscription:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;

  const { error } = await supabase
    .from('invoices')
    .upsert({
      organization_id: (await getOrgIdFromSubscription(subscriptionId)),
      subscription_id: (await getSubscriptionUuid(subscriptionId)),
      stripe_invoice_id: invoice.id,
      amount_cents: invoice.amount_paid,
      currency: invoice.currency,
      status: 'paid',
      invoice_pdf_url: invoice.invoice_pdf,
      hosted_invoice_url: invoice.hosted_invoice_url,
      period_start: new Date(invoice.period_start * 1000).toISOString(),
      period_end: new Date(invoice.period_end * 1000).toISOString(),
      paid_at: new Date().toISOString(),
      metadata: invoice.metadata,
    }, { onConflict: 'stripe_invoice_id' });

  if (error) {
    console.error('Failed to upsert invoice:', error);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;

  const { error } = await supabase
    .from('invoices')
    .upsert({
      organization_id: (await getOrgIdFromSubscription(subscriptionId)),
      subscription_id: (await getSubscriptionUuid(subscriptionId)),
      stripe_invoice_id: invoice.id,
      amount_cents: invoice.amount_due,
      currency: invoice.currency,
      status: 'uncollectible',
      hosted_invoice_url: invoice.hosted_invoice_url,
      period_start: new Date(invoice.period_start * 1000).toISOString(),
      period_end: new Date(invoice.period_end * 1000).toISOString(),
      metadata: invoice.metadata,
    }, { onConflict: 'stripe_invoice_id' });

  if (error) {
    console.error('Failed to upsert failed invoice:', error);
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== 'subscription') return;
  
  const organizationId = session.metadata?.organizationId;
  if (!organizationId) return;

  // The subscription.created event will handle the rest
  console.log('Checkout completed for org:', organizationId);
}

async function getOrgIdFromSubscription(stripeSubscriptionId: string): Promise<string | null> {
  const { data } = await supabase
    .from('subscriptions')
    .select('organization_id')
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .single();
  return data?.organization_id || null;
}

async function getSubscriptionUuid(stripeSubscriptionId: string): Promise<string | null> {
  const { data } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .single();
  return data?.id || null;
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}