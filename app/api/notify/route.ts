import { NextResponse } from 'next/server';
import { getAdminMessaging, getFirebaseAdminApp } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const { token, title, body, data } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Missing FCM token' }, { status: 400 });
    }

    const app = getFirebaseAdminApp();
    
    // Check if we actually have credentials loaded
    if (!process.env.FIREBASE_PRIVATE_KEY) {
       return NextResponse.json({ error: 'Firebase Admin not configured on server' }, { status: 500 });
    }

    const messaging = getAdminMessaging();

    const message = {
      token,
      notification: {
        title,
        body,
      },
      data: data || {},
      webpush: {
        fcmOptions: {
          link: '/',
        },
      },
    };

    const response = await messaging.send(message);
    
    return NextResponse.json({ success: true, messageId: response });
  } catch (error) {
    console.error('Error sending push notification:', error);
    return NextResponse.json({ error: 'Failed to send notification', details: (error as Error).message }, { status: 500 });
  }
}
