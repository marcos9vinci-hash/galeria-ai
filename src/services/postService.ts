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
    // Load slots from localStorage for immediate access without AI brain planning
    const savedSlots = localStorage.getItem(`galeria_slots_${userId}`);
    if (savedSlots) {
      try {
        return JSON.parse(savedSlots);
      } catch (e) {
        console.warn("Error parsing slots from localStorage:", e);
      }
    }
    return [];
  },

  async saveSlots(userId: string, slots: any[]) {
    localStorage.setItem(`galeria_slots_${userId}`, JSON.stringify(slots));
  },

  async getManualSlotConfig(userId: string) {
    const saved = localStorage.getItem(`galeria_manual_config_${userId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn("Error parsing manual slot config:", e);
      }
    }
    return null;
  },

  async saveManualSlotConfig(userId: string, config: any) {
    localStorage.setItem(`galeria_manual_config_${userId}`, JSON.stringify(config));
  },

  async loadSlotsAI(userId: string, igId?: string, token?: string) {
      if (!igId || !token) return null;
      try {
        const response = await fetch(`/api/slots/analysis?igId=${igId}`, {
          headers: { "x-access-token": token }
        });
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.warn("Análise de slots AI falhou:", error);
      }
      return null;
    }
};