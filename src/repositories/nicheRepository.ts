import { supabase } from '../lib/supabase';
import { Niche } from '../types';

export const nicheRepository = {
  async getNiches(userId: string): Promise<Niche[]> {
    const { data, error } = await supabase
      .from('niches')
      .select('*')
      .eq('userId', userId);
    
    if (error) throw error;
    return data as Niche[];
  },
  async addNiche(niche: Omit<Niche, 'id'>) {
    const { data, error } = await supabase
      .from('niches')
      .insert(niche)
      .select()
      .single();
    
    if (error) throw error;
    return { id: data.id };
  }
};
