import { postRepository } from "@/repositories/postRepository";
import { postSchema } from "@/validators/post.schema";

export const postService = {
  async loadPosts(userId: string, pageSize: number = 10, offset: number = 0) {
    return await postRepository.getPosts(userId, pageSize, offset);
  },

  async savePost(userId: string, p: any) {
    const postData = {
      userId: userId,
      image: p.image,
      caption: p.caption || '',
      date: p.date instanceof Date ? p.date.toISOString() : p.date,
      type: p.type || 'feed',
      status: p.status || 'rascunho',
      cta: p.cta || '',
      hashtags: p.hashtags || [],
      title: p.title || ''
    };
    
    const validatedData = postSchema.parse(postData);
    
    if (p.id && typeof p.id === 'string' && !p.id.startsWith('temp_') && !String(p.id).includes('.')) {
      await postRepository.updatePost(p.id, validatedData);
      return p.id;
    } else {
      const docRef = await postRepository.addPost(validatedData);
      return docRef.id;
    }
  },

  async getAvailableSlots(userId: string) {
    return [];
  }
};
