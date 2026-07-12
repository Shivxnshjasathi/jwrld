import { NextResponse } from 'next/server';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.toLowerCase() || '';

    const app = getFirebaseAdminApp();
    if (!process.env.FIREBASE_PRIVATE_KEY) {
       return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 500 });
    }

    const { getFirestore } = await import('firebase-admin/firestore');
    const db = getFirestore(app);

    // Simple search: get all users and filter (fine for small apps)
    const usersSnap = await db.collection('users').get();
    const results: any[] = [];

    usersSnap.forEach(doc => {
      const data = doc.data();
      const name = (data.name || '').toLowerCase();
      const email = (data.email || '').toLowerCase();
      
      if (name.includes(query) || email.includes(query)) {
        results.push({
          uid: data.uid,
          name: data.name,
          photoURL: data.photoURL,
          tier: data.tier,
          xp: data.xp
        });
      }
    });

    return NextResponse.json({ results: results.slice(0, 20) });
  } catch (error: any) {
    console.error('Error searching friends:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { action, targetUid, uid, requestId } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }

    const app = getFirebaseAdminApp();
    const { getFirestore, FieldValue } = await import('firebase-admin/firestore');
    const db = getFirestore(app);

    if (action === 'send') {
      if (!targetUid) return NextResponse.json({ error: 'Missing targetUid' }, { status: 400 });
      if (uid === targetUid) return NextResponse.json({ error: 'Cannot add yourself' }, { status: 400 });

      // Check if already friends
      const userDoc = await db.collection('users').doc(uid).get();
      const friends = userDoc.data()?.friends || [];
      if (friends.includes(targetUid)) {
        return NextResponse.json({ error: 'Already friends' }, { status: 400 });
      }

      // Create a friend request
      await db.collection('friendRequests').add({
        fromUid: uid,
        toUid: targetUid,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'accept' && requestId) {
      const reqRef = db.collection('friendRequests').doc(requestId);
      const reqSnap = await reqRef.get();
      if (!reqSnap.exists) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
      
      const reqData = reqSnap.data()!;
      if (reqData.toUid !== uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

      // Add to each other's friends list
      await db.runTransaction(async (transaction) => {
        const user1Ref = db.collection('users').doc(reqData.fromUid);
        const user2Ref = db.collection('users').doc(reqData.toUid);

        transaction.update(user1Ref, { friends: FieldValue.arrayUnion(reqData.toUid) });
        transaction.update(user2Ref, { friends: FieldValue.arrayUnion(reqData.fromUid) });
        transaction.update(reqRef, { status: 'accepted' });
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'decline' && requestId) {
      const reqRef = db.collection('friendRequests').doc(requestId);
      const reqSnap = await reqRef.get();
      if (!reqSnap.exists) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
      
      const reqData = reqSnap.data()!;
      if (reqData.toUid !== uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

      await reqRef.update({ status: 'declined' });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in friends POST:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
