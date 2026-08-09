// Supabase direct client - points to Supabase Edge Functions
export const SUPABASE_FUNCTIONS_URL = 'https://wrybqqitsylqyhgzodyc.supabase.co/functions/v1';

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

// Path mappings - all Supabase Edge Functions
export const API_PATHS = {
  // Health
  '/health': '/api/health',
  
  // LLM / AI
  '/api/llm/invoke': '/api/llm/invoke',  // needs new function
  
  // Instagram
  '/api/instagram/me': '/api/instagram/me',
  '/api/instagram/publish': '/api/instagram/publish',
  '/api/instagram/scheduled-status': '/api/instagram/scheduled-status',
  '/api/instagram/login-manual': '/api/instagram/login-manual',
  '/api/auth/facebook/url': '/api/auth/facebook/url',
  
  // Buffer
  '/api/buffer/profiles': '/api/buffer/profiles',
  '/api/buffer/schedule-update': '/api/buffer/schedule-update',
  
  // Niche
  '/api/niche/schedule-preferences': '/api/niche/schedule-preferences',
  '/api/niche/detect': '/api/niche/detect',
  '/api/niche/hashtags': '/api/niche/hashtags',
  '/api/niche/profiles': '/api/niche/profiles',
  
  // Studio
  '/api/studio/plan-strategy': '/api/studio/plan-strategy',
  
  // AI / Image
  '/api/ai/generate-image': '/api/ai/generate-image',
  '/api/airtop/scrape-gem': '/api/airtop/scrape-gem',
  '/api/airtop/generate-tattoo': '/api/airtop/generate-tattoo',
};
