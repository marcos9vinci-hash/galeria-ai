import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wrybqqitsylqyhgzodyc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_7Vku_VAskhaM-euvRUaT7g_4gJMpbIa';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadImageToStorage(file: File | Blob, path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('images')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('images')
    .getPublicUrl(data.path);

  return publicUrl;
}