import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getFirebaseDb, isFirebaseConfigured } from './firebase';

/**
 * Triggers the /api/notify endpoint to send a push notification.
 */
async function triggerPushAPI(token: string, title: string, body: string, data?: any) {
  try {
    const res = await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, title, body, data }),
    });
    if (!res.ok) {
      console.warn('Failed to send push notification', await res.text());
    }
  } catch (err) {
    console.error('Error hitting /api/notify:', err);
  }
}

/**
 * Sends a push notification to a specific user by their ID.
 */
export async function sendPushToUser(userId: string, title: string, body: string, data?: any) {
  if (!isFirebaseConfigured) return;
  try {
    const db = getFirebaseDb();
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.fcmToken) {
        await triggerPushAPI(userData.fcmToken, title, body, data);
      }
    }
  } catch (err) {
    console.error('Failed to send push to user:', err);
  }
}

/**
 * Sends a push notification to all admin users.
 */
export async function sendPushToAdmins(title: string, body: string, data?: any) {
  if (!isFirebaseConfigured) return;
  try {
    const db = getFirebaseDb();
    const q = query(collection(db, 'users'), where('role', '==', 'admin'));
    const snapshot = await getDocs(q);
    
    // We shouldn't block on all fetches sequentially, so we fire them off concurrently
    const pushPromises = snapshot.docs.map(adminDoc => {
      const adminData = adminDoc.data();
      if (adminData.fcmToken) {
        return triggerPushAPI(adminData.fcmToken, title, body, data);
      }
      return Promise.resolve();
    });
    
    await Promise.allSettled(pushPromises);
  } catch (err) {
    console.error('Failed to send push to admins:', err);
  }
}
