import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://galeria-ia-inkdream.netlify.app',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/api/, '');

    // POST /stripe/create-checkout-session
    if (path === '/stripe/create-checkout-session' && req.method === 'POST') {
      const { priceId, organizationId, successUrl, cancelUrl } = await req.json();
      
      if (!priceId || !organizationId) {
        return json({ error: 'Missing priceId or organizationId' }, 400);
      }

      // Get or create Stripe customer
      let customerId: string;
      // ... implementation

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: successUrl || `${Deno.env.get('SITE_URL')}/billing?success=true`,
        cancel_url: cancelUrl || `${Deno.env.get('SITE_URL')}/billing?canceled=true`,
        metadata: { organizationId },
      });

      return json({ url: session.url });
    }

    // POST /stripe/create-portal-session
    if (path === '/stripe/create-portal-session' && req.method === 'POST') {
      const { organizationId, returnUrl } = await req.json();
      
      // Get customer ID from subscription
      // ...

      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl || `${Deno.env.get('SITE_URL')}/billing`,
      });

      return json({ url: session.url });
    }

    // POST /stripe/webhook — handled by separate webhook endpoint
    if (path === '/stripe/webhook' && req.method === 'POST') {
      return json({ error: 'Use dedicated webhook endpoint' }, 400);
    }

    return json({ error: 'Not found' }, 404);
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
});

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { 
    status, 
    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
  });
}