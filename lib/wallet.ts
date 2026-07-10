import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getFirebaseDb, isFirebaseConfigured } from './firebase';
import type { AppUser } from './auth';

export async function getUserWalletBalance(userId: string): Promise<number> {
  if (!isFirebaseConfigured) return 0;
  const db = getFirebaseDb();
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    return (snap.data() as AppUser).walletBalance || 0;
  }
  return 0;
}

export async function addWalletBalance(userId: string, amount: number): Promise<void> {
  if (!isFirebaseConfigured) return;
  const db = getFirebaseDb();
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    const current = (snap.data() as AppUser).walletBalance || 0;
    await updateDoc(userRef, { walletBalance: current + amount });
  }
}

export async function deductWalletBalance(userId: string, amount: number): Promise<void> {
  if (!isFirebaseConfigured) return;
  const db = getFirebaseDb();
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    const current = (snap.data() as AppUser).walletBalance || 0;
    if (current < amount) {
      throw new Error('Insufficient wallet balance');
    }
    await updateDoc(userRef, { walletBalance: current - amount });
  }
}

export async function searchUserByPhone(phone: string): Promise<AppUser | null> {
  if (!isFirebaseConfigured) return null;
  const db = getFirebaseDb();
  
  // Try exact match first
  let q = query(collection(db, 'users'), where('phone', '==', phone));
  let snap = await getDocs(q);
  
  if (snap.empty) {
    // If phone didn't include +91, try with +91
    if (!phone.startsWith('+91')) {
      q = query(collection(db, 'users'), where('phone', '==', `+91${phone}`));
      snap = await getDocs(q);
    }
  }

  if (!snap.empty) {
    return snap.docs[0].data() as AppUser;
  }
  return null;
}

export async function getAllUsers(): Promise<AppUser[]> {
  if (!isFirebaseConfigured) return [];
  const db = getFirebaseDb();
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(doc => doc.data() as AppUser);
}
