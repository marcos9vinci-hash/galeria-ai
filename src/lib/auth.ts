import { signInAnonymously } from 'firebase/auth';
import { auth } from './firebase';

export async function ensureAnonymousAuth() {
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
      console.log("Signed in anonymously");
    }
  } catch (error) {
    console.error("Error signing in anonymously", error);
    throw error;
  }
}
