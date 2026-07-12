import { NextResponse } from 'next/server';
import { getAdminMessaging, getFirebaseAdminApp } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const { title, body, data } = await req.json();

    if (!title || !body) {
      return NextResponse.json({ error: 'Missing title or body' }, { status: 400 });
    }

    const app = getFirebaseAdminApp();
    
    if (!process.env.FIREBASE_PRIVATE_KEY) {
       return NextResponse.json({ error: 'Firebase Admin not configured on server' }, { status: 500 });
    }

    // Get Firestore to fetch all user tokens
    const { getFirestore, FieldValue } = await import('firebase-admin/firestore');
    const db = getFirestore(app);
    
    // Fetch all users to update their in-app messages
    const usersSnapshot = await db.collection('users').get();

    const tokens: string[] = [];
    const users: { id: string; name?: string }[] = [];

    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      users.push({ id: doc.id, name: userData.name });
      if (userData.fcmToken) {
        tokens.push(userData.fcmToken);
      }
    });

    // Chunk array helper
    const chunkArray = <T,>(arr: T[], size: number): T[][] => {
      const chunks = [];
      for(let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
      }
      return chunks;
    };

    const broadcastText = `📢 ${title}\n\n${body}`;

    // Update in-app notifications (messages) for all users
    // Each user requires 2 ops (update chat doc + create message doc) -> 250 users max per batch (500 ops limit)
    const userChunks = chunkArray(users, 250);
    for (const chunk of userChunks) {
      const batch = db.batch();
      for (const user of chunk) {
        const chatRef = db.collection('chats').doc(user.id);
        const messageRef = chatRef.collection('messages').doc();
        
        batch.set(chatRef, {
          userId: user.id,
          userName: user.name || 'User',
          lastMessage: broadcastText,
          lastMessageAt: FieldValue.serverTimestamp(),
          unreadUser: FieldValue.increment(1)
        }, { merge: true });
        
        batch.set(messageRef, {
          text: broadcastText,
          sender: 'admin',
          createdAt: FieldValue.serverTimestamp()
        });
      }
      await batch.commit();
    }

    let successCount = 0;
    let failureCount = 0;

    // Send push notifications
    if (tokens.length > 0) {
      const messaging = getAdminMessaging();
      const tokenChunks = chunkArray(tokens, 500); // FCM max is 500 per multicast
      
      for (const tokenBatch of tokenChunks) {
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
          tokens: tokenBatch,
        };

        const response = await messaging.sendEachForMulticast(message);
        successCount += response.successCount;
        failureCount += response.failureCount;
      }
    }

    return NextResponse.json({ 
      success: true, 
      count: successCount,
      failed: failureCount,
      inAppCount: users.length
    });
  } catch (error) {
    console.error('Error sending push broadcast:', error);
    return NextResponse.json({ error: `Failed to send broadcast: ${(error as Error).message}` }, { status: 500 });
  }
}
