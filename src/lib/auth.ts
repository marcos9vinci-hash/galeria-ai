import { supabase } from './supabase';

let authInitialized = false;

export async function ensureAnonymousAuth(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    authInitialized = true;
    return session.user.id;
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    return null;
  }
  if (data.user) {
    authInitialized = true;
    return data.user.id;
  }
  return null;
}

export function isAuthInitialized(): boolean {
  return authInitialized;
}

export async function initializeAuth(): Promise<string | null> {
  if (!authInitialized) {
    return ensureAnonymousAuth();
  }
  return (await supabase.auth.getSession()).data.session?.user?.id || null;
}