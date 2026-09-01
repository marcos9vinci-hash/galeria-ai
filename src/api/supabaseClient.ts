// Supabase direct client - replaces Netlify /api/* proxy calls
export const SUPABASE_FUNCTIONS_URL = 'https://galeria-ia-api.vercel.app/api';

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

// Path mappings from old /api/* to Vercel API routes
export const API_PATHS = {
  // Health
  '/health': '/health',
  
  // Instagram
  "https://galeria-ia-production.up.railway.app/api/instagram/me": '/instagram/me',
  "https://galeria-ia-production.up.railway.app/api/instagram/publish": '/instagram/publish',
  "https://galeria-ia-production.up.railway.app/api/instagram/scheduled-status": '/instagram/scheduled-status',
  "https://galeria-ia-production.up.railway.app/api/auth/facebook/url": '/auth/facebook/url',
  
  // Buffer
  "https://galeria-ia-production.up.railway.app/api/buffer/profiles": '/buffer/profiles',
  "https://galeria-ia-production.up.railway.app/api/buffer/schedule-update": '/buffer/schedule-update',
  "https://galeria-ia-production.up.railway.app/api/buffer/create-update": '/buffer/create-update',
};