// Supabase direct client - replaces Netlify /api/* proxy calls
export const SUPABASE_FUNCTIONS_URL = 'https://galeria-ia-proxy.4f842090ed958ee94e2d24ee609292ae.workers.dev';

export async function supabaseFetch(path: string, options: RequestInit = {}) {
  const url = `${SUPABASE_FUNCTIONS_URL}${path}`;
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  
  // Get auth from supabase client if available
  const { supabase } = await import('../lib/supabase');
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }
  
  return fetch(url, { ...options, headers });
}

// Path mappings from old /api/* to Supabase functions
export const API_PATHS = {
  // Health
  '/health': '/health',
  
  // LLM / AI
  "https://galeria-ia-proxy.4f842090ed958ee94e2d24ee609292ae.workers.dev/llm/invoke": "https://galeria-ia-proxy.4f842090ed958ee94e2d24ee609292ae.workers.dev/llm/invoke",  // needs new function
  
  // Instagram
  "https://galeria-ia-proxy.4f842090ed958ee94e2d24ee609292ae.workers.dev/instagram/me": '/instagram/me',
  "https://galeria-ia-proxy.4f842090ed958ee94e2d24ee609292ae.workers.dev/instagram/publish": '/instagram/publish',
  "https://galeria-ia-proxy.4f842090ed958ee94e2d24ee609292ae.workers.dev/instagram/scheduled-status": '/instagram/scheduled-status',
  "https://galeria-ia-proxy.4f842090ed958ee94e2d24ee609292ae.workers.dev/auth/facebook/manual-token": '/auth/facebook/manual-token',
  "https://galeria-ia-proxy.4f842090ed958ee94e2d24ee609292ae.workers.dev/auth/facebook/url": '/auth/facebook/url',
  
  // Buffer
  "https://galeria-ia-proxy.4f842090ed958ee94e2d24ee609292ae.workers.dev/buffer/profiles": '/buffer/profiles',
  "https://galeria-ia-proxy.4f842090ed958ee94e2d24ee609292ae.workers.dev/buffer/create-update": '/buffer/create-update',
  
  // Niche
  "https://galeria-ia-proxy.4f842090ed958ee94e2d24ee609292ae.workers.dev/niche/schedule-preferences": '/niche/schedule-preferences',
  "https://galeria-ia-proxy.4f842090ed958ee94e2d24ee609292ae.workers.dev/niche/detect": '/niche/detect',
  "https://galeria-ia-proxy.4f842090ed958ee94e2d24ee609292ae.workers.dev/niche/hashtags": '/niche/hashtags',
  "https://galeria-ia-proxy.4f842090ed958ee94e2d24ee609292ae.workers.dev/niche/profiles": '/niche/profiles',
  
  // Studio
  "https://galeria-ia-proxy.4f842090ed958ee94e2d24ee609292ae.workers.dev/studio/plan-strategy": '/studio/plan-strategy',
  
  // AI / Image
  "https://galeria-ia-proxy.4f842090ed958ee94e2d24ee609292ae.workers.dev/ai/generate-image": '/ai/generate-image',
  "https://galeria-ia-proxy.4f842090ed958ee94e2d24ee609292ae.workers.dev/airtop/scrape-gem": '/airtop/scrape-gem',
  "https://galeria-ia-proxy.4f842090ed958ee94e2d24ee609292ae.workers.dev/airtop/generate-tattoo": '/airtop/generate-tattoo',
};
