import { createClient } from '@supabase/supabase-js';

const defaultUrl = 'https://wrybqqitsylqyhgzodyc.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyeWJxcWl0c3lscXloZ3pvZHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNDA3MjEsImV4cCI6MjA5ODYxNjcyMX0.2-qH7NsPQrDn-8sn16mepAkYdQB5XsxMs5jFve2ejQg';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || defaultUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || defaultKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
