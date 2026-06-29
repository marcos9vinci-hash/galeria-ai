import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Post, Niche, CarouselSlide, ScheduleConfig, Insight } from '../types';

export const firestoreService = {
  // Posts
  async getPosts(userId: string): Promise<Post[]> {
    const q = query(collection(db, 'posts'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Post));
  },
  async addPost(post: Omit<Post, 'id'>) {
    return await addDoc(collection(db, 'posts'), post);
  },
  async updatePost(postId: string, post: Partial<Post>) {
    await updateDoc(doc(db, 'posts', postId), post);
  },
  async deletePost(postId: string) {
    await deleteDoc(doc(db, 'posts', postId));
  },

  // Niches
  async getNiches(userId: string): Promise<Niche[]> {
    const q = query(collection(db, 'niches'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Niche));
  },
  async addNiche(niche: Omit<Niche, 'id'>) {
    return await addDoc(collection(db, 'niches'), niche);
  },

  // CarouselSlides
  async getCarouselSlides(postId: string): Promise<CarouselSlide[]> {
      const q = query(collection(db, 'carouselSlides'), where('postId', '==', postId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CarouselSlide));
  },
  async addCarouselSlide(slide: Omit<CarouselSlide, 'id'>) {
      return await addDoc(collection(db, 'carouselSlides'), slide);
  },

  // ScheduleConfig
  async getScheduleConfig(userId: string): Promise<ScheduleConfig | null> {
      const q = query(collection(db, 'scheduleConfigs'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.empty ? null : ({ ...snapshot.docs[0].data(), id: snapshot.docs[0].id } as ScheduleConfig);
  },
  async saveScheduleConfig(userId: string, config: Omit<ScheduleConfig, 'id' | 'userId'>) {
      // Logic to upsert
      const existing = await this.getScheduleConfig(userId);
      if (existing) {
          await updateDoc(doc(db, 'scheduleConfigs', existing.id), config);
      } else {
          await addDoc(collection(db, 'scheduleConfigs'), { ...config, userId });
      }
  },

  // Insights
  async getInsights(userId: string): Promise<Insight[]> {
    const q = query(collection(db, 'insights'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Insight));
  },
  async addInsight(insight: Omit<Insight, 'id'>) {
    return await addDoc(collection(db, 'insights'), insight);
  }
};
