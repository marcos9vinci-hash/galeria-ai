import { supabase } from '../lib/supabase';
import { CarouselSlide } from '../types';

export const carouselRepository = {
  async getCarouselSlides(postId: string): Promise<CarouselSlide[]> {
      const { data, error } = await supabase
        .from('carouselSlides')
        .select('*')
        .eq('postId', postId);
      
      if (error) throw error;
      return data as CarouselSlide[];
  },
  async addCarouselSlide(slide: Omit<CarouselSlide, 'id'>) {
      const { data, error } = await supabase
        .from('carouselSlides')
        .insert(slide)
        .select()
        .single();
      
      if (error) throw error;
      return { id: data.id };
  }
};
