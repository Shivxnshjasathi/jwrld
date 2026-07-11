import { NextResponse } from 'next/server';
import { getAdminMessaging, getFirebaseAdminApp } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

export async function POST(req: Request) {
  try {
    const { title, body, data } = await req.json();

    const app = getFirebaseAdminApp();
    if (!process.env.FIREBASE_PRIVATE_KEY) {
       return NextResponse.json({ error: 'Firebase Admin not configured on server' }, { status: 500 });
    }

    const messaging = getAdminMessaging();
    const db = getFirestore(app);

    // Fetch all admin users
    const adminsSnapshot = await db.collection('users').where('role', '==', 'admin').get();
    
    if (adminsSnapshot.empty) {
      return NextResponse.json({ success: true, message: 'No admins found to notify' });
    }

    const tokens: string[] = [];
    adminsSnapshot.forEach(doc => {
      const adminData = doc.data();
      if (adminData.fcmToken) {
        tokens.push(adminData.fcmToken);
      }
    });

    if (tokens.length === 0) {
      return NextResponse.json({ success: true, message: 'No admins have FCM tokens' });
    }

    const message = {
      tokens,
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

    const response = await messaging.sendEachForMulticast(message);
    
    return NextResponse.json({ success: true, successCount: response.successCount });
  } catch (error) {
    console.error('Error sending push notification to admins:', error);
    return NextResponse.json({ error: 'Failed to send admin notifications', details: (error as Error).message }, { status: 500 });
  }
}
