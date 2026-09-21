import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wrybqqitsylqyhgzodyc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyeWJxcWl0c3lscXloZ3pvZHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNDA3MjEsImV4cCI6MjA5ODYxNjcyMX0.2-qH7NsPQrDn-8sn16mepAkYdQB5XsxMs5jFve2ejQg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);