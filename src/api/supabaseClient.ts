// Supabase direct client - replaces Netlify /api/* proxy calls
export const SUPABASE_FUNCTIONS_URL = 'https://galeria-ia-production.up.railway.app/api';

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
  "https://galeria-ia-production.up.railway.app/api/llm/invoke": "https://galeria-ia-production.up.railway.app/api/llm/invoke",  // needs new function
  
  // Instagram
  "https://galeria-ia-production.up.railway.app/api/instagram/me": '/instagram/me',
  "https://galeria-ia-production.up.railway.app/api/instagram/publish": '/instagram/publish',
  "https://galeria-ia-production.up.railway.app/api/instagram/scheduled-status": '/instagram/scheduled-status',
  "https://galeria-ia-production.up.railway.app/api/instagram/login-manual": '/instagram/login-manual',
  "https://galeria-ia-production.up.railway.app/api/auth/facebook/url": '/auth/facebook/url',
  
  // Buffer
  "https://galeria-ia-production.up.railway.app/api/buffer/profiles": '/buffer/profiles',
  "https://galeria-ia-production.up.railway.app/api/buffer/schedule-update": '/buffer/schedule-update',
  
  // Niche
  "https://galeria-ia-production.up.railway.app/api/niche/schedule-preferences": '/niche/schedule-preferences',
  "https://galeria-ia-production.up.railway.app/api/niche/detect": '/niche/detect',
  "https://galeria-ia-production.up.railway.app/api/niche/hashtags": '/niche/hashtags',
  "https://galeria-ia-production.up.railway.app/api/niche/profiles": '/niche/profiles',
  
  // Studio
  "https://galeria-ia-production.up.railway.app/api/studio/plan-strategy": '/studio/plan-strategy',
  
  // AI / Image
  "https://galeria-ia-production.up.railway.app/api/ai/generate-image": '/ai/generate-image',
  "https://galeria-ia-production.up.railway.app/api/airtop/scrape-gem": '/airtop/scrape-gem',
  "https://galeria-ia-production.up.railway.app/api/airtop/generate-tattoo": '/airtop/generate-tattoo',
};
