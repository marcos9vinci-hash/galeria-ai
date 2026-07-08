// @ts-nocheck
import { supabase } from '../lib/supabase';
import { Insight } from '../types';

export const insightRepository = {
  async getInsights(userId: string): Promise<Insight[]> {
    const { data, error } = await supabase
      .from('insights')
      .select('*')
      .eq('userId', userId);
    
    if (error) throw error;
    return data as Insight[];
  },
  async addInsight(insight: Omit<Insight, 'id'>) {
    const { data, error } = await supabase
      .from('insights')
      .insert(insight)
      .select()
      .single();
    
    if (error) throw error;
    return { id: data.id };
  }
};
