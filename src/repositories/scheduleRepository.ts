import { supabase } from '../lib/supabase';
import { ScheduleConfig } from '../types';

export const scheduleRepository = {
  async getScheduleConfig(userId: string): Promise<ScheduleConfig | null> {
      const { data, error } = await supabase
        .from('scheduleConfigs')
        .select('*')
        .eq('userId', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116: no rows found
      return data as ScheduleConfig | null;
  },
  async saveScheduleConfig(userId: string, config: Omit<ScheduleConfig, 'id' | 'userId'>) {
      const existing = await this.getScheduleConfig(userId);
      if (existing) {
          const { error } = await supabase
            .from('scheduleConfigs')
            .update(config)
            .eq('id', existing.id);
          if (error) throw error;
      } else {
          const { error } = await supabase
            .from('scheduleConfigs')
            .insert({ ...config, userId });
          if (error) throw error;
      }
  }
};
