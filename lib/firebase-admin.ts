import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

function formatPrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  
  let formatted = key.trim();
  // Remove surrounding quotes if they exist (common Vercel env issue)
  if (formatted.startsWith('"') && formatted.endsWith('"')) {
    formatted = formatted.slice(1, -1);
  } else if (formatted.startsWith("'") && formatted.endsWith("'")) {
    formatted = formatted.slice(1, -1);
  }
  
  // Replace unescaped literal '\n' characters with actual newlines
  return formatted.replace(/\\n/g, '\n');
}

export function getFirebaseAdminApp() {
  if (getApps().length === 0) {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

    if (projectId && clientEmail && privateKey) {
      initializeApp({
        projectId,
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log('Firebase Admin initialized');
    } else {
      console.warn('Firebase Admin is not configured. Push notifications will not work.');
      // Initialize an empty app to prevent crashes, but calls to it will fail
      initializeApp();
    }
  }
  return getApps()[0];
}

export function getAdminMessaging() {
  getFirebaseAdminApp();
  return getMessaging();
}
