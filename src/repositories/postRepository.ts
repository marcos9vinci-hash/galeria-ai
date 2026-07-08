// @ts-nocheck
import { supabase } from '../lib/supabase';
import { Post } from '../types';

export const postRepository = {
  async getPosts(userId: string, pageSize: number = 10, offset: number = 0): Promise<{ posts: Post[] }> {
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .eq('userId', userId)
      .range(offset, offset + pageSize - 1)
      .order('date', { ascending: false });
    
    if (error) {
      throw error;
    }

    return { 
      posts: posts as Post[]
    };
  },
  async addPost(post: Omit<Post, 'id'>) {
    const { data, error } = await supabase
      .from('posts')
      .insert(post)
      .select()
      .single();
    
    if (error) throw error;
    return { id: data.id };
  },
  async updatePost(postId: string, post: Partial<Post>) {
    const { error } = await supabase
      .from('posts')
      .update(post)
      .eq('id', postId);
    
    if (error) throw error;
  },
  async deletePost(postId: string) {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);
    
    if (error) throw error;
  }
};
