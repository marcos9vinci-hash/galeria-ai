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

export const postService = {
  async addPost(userId: string, postData: Omit<Post, 'id' | 'userId'>) {
    const docRef = await addDoc(collection(db, "posts"), {
      ...postData,
      userId,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  },

  async getPosts(userId: string) {
    const q = query(collection(db, "posts"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
  },

  async getAvailableSlots(userId: string) {
    const q = query(collection(db, "scheduleSlots"), where("userId", "==", userId), where("status", "==", "empty"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async updateSlot(slotId: string, updates: Partial<any>) {
    const slotRef = doc(db, "scheduleSlots", slotId);
    await updateDoc(slotRef, updates);
  }
};
