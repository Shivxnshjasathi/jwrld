import { NextResponse } from 'next/server';
import { getAdminMessaging, getFirebaseAdminApp } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const { title, body, data } = await req.json();

    if (!title || !body) {
      return NextResponse.json({ error: 'Missing title or body' }, { status: 400 });
    }

    const app = getFirebaseAdminApp();
    
    if (!app.options.projectId) {
       return NextResponse.json({ error: 'Firebase Admin not configured on server' }, { status: 500 });
    }

    // Get Firestore to fetch all user tokens
    const { getFirestore } = await import('firebase-admin/firestore');
    const db = getFirestore(app);
    
    // Fetch users with fcmToken
    const usersSnapshot = await db.collection('users')
      .where('fcmToken', '!=', null)
      .get();

    const tokens: string[] = [];
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.fcmToken) {
        tokens.push(data.fcmToken);
      }
    });

    if (tokens.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: 'No users with push notification tokens found.' });
    }

    const messaging = getAdminMessaging();

    // Send multicasting message (max 500 per batch)
    // For large scale, you'd want to chunk this array into batches of 500
    const message = {
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
      tokens: tokens,
    };

    const response = await messaging.sendEachForMulticast(message);
    
    return NextResponse.json({ 
      success: true, 
      count: response.successCount,
      failed: response.failureCount 
    });
  } catch (error) {
    console.error('Error sending push broadcast:', error);
    return NextResponse.json({ error: 'Failed to send broadcast', details: (error as Error).message }, { status: 500 });
  }
}
