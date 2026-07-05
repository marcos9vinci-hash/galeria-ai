import { supabase } from "./supabase";

export async function ensureAnonymousAuth() {
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.error("Auth error:", error);
    throw error;
  }
  return data.user;
}
