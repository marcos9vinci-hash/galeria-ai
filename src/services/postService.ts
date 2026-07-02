import { db } from "../lib/firebase"; // Assuming standard firebase init
import { collection, addDoc, getDocs, query, where, Timestamp, doc, updateDoc } from "firebase/firestore";

export interface Post {
  id?: string;
  userId: string;
  imageUrl: string;
  scheduledAt: Timestamp;
  status: 'pending' | 'posted';
  title?: string;
}

export interface ScheduleSlot {
  id?: string;
  userId: string;
  scheduledAt: Timestamp;
  status: 'empty' | 'filled';
}

export const postService = {
  async addPost(userId: string, postData: Omit<Post, 'id' | 'userId'>): Promise<string> {
    const docRef = await addDoc(collection(db, "posts"), {
      ...postData,
      userId,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  },

  async getPosts(userId: string): Promise<Post[]> {
    const q = query(collection(db, "posts"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
  },

  async getAvailableSlots(userId: string): Promise<ScheduleSlot[]> {
    const q = query(collection(db, "scheduleSlots"), where("userId", "==", userId), where("status", "==", "empty"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduleSlot));
  },

  async updateSlot(slotId: string, updates: Partial<ScheduleSlot>): Promise<void> {
    const slotRef = doc(db, "scheduleSlots", slotId);
    await updateDoc(slotRef, updates);
  }
};
