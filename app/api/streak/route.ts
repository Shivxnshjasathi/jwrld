import { NextResponse } from 'next/server';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }

    const app = getFirebaseAdminApp();
    if (!process.env.FIREBASE_PRIVATE_KEY) {
       return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 500 });
    }

    const { getFirestore, FieldValue } = await import('firebase-admin/firestore');
    const db = getFirestore(app);

    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userSnap.data();
    const today = new Date().toISOString().split('T')[0];
    const lastLoginDate = userData?.lastLoginDate || '';
    
    let currentStreak = userData?.currentStreak || 0;
    let spinsAvailable = userData?.spinsAvailable || 0;

    if (lastLoginDate === today) {
      // Already logged in today, do nothing
      return NextResponse.json({ success: true, currentStreak, spinsAvailable, message: 'Already updated today' });
    }

    // Check if last login was exactly yesterday
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    if (lastLoginDate === yesterdayStr) {
      currentStreak += 1;
      // Grant a spin every 7 days
      if (currentStreak % 7 === 0) {
        spinsAvailable += 1;
      }
    } else {
      // Streak broken or first login
      currentStreak = 1;
    }

    await userRef.update({
      lastLoginDate: today,
      currentStreak,
      spinsAvailable
    });

    return NextResponse.json({ 
      success: true, 
      currentStreak, 
      spinsAvailable,
      spinGranted: (lastLoginDate === yesterdayStr && currentStreak % 7 === 0)
    });

  } catch (error) {
    console.error('Error updating streak:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
