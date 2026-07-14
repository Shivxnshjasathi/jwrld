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

    return await db.runTransaction(async (transaction: any) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists) {
        throw new Error('User not found');
      }

      const userData = userSnap.data();
      const spinsAvailable = userData?.spinsAvailable || 0;

      if (spinsAvailable <= 0) {
        throw new Error('No spins available');
      }

      // Randomly select a prize
      const r = Math.random();
      let prizeType = 'xp';
      let prizeAmount = 50;
      let label = '50 XP';

      if (r < 0.05) {
        prizeType = 'wallet'; prizeAmount = 50; label = '₹50 Bonus';
      } else if (r < 0.1) {
        prizeType = 'wallet'; prizeAmount = 20; label = '₹20 Bonus';
      } else if (r < 0.2) {
        prizeType = 'wallet'; prizeAmount = 10; label = '₹10 Bonus';
      } else if (r < 0.3) {
        prizeType = 'xp'; prizeAmount = 200; label = '200 XP';
      } else if (r < 0.5) {
        prizeType = 'xp'; prizeAmount = 150; label = '150 XP';
      } else if (r < 0.7) {
        prizeType = 'xp'; prizeAmount = 100; label = '100 XP';
      } else if (r < 0.9) {
        prizeType = 'xp'; prizeAmount = 50; label = '50 XP';
      } else {
        prizeType = 'none'; prizeAmount = 0; label = 'TRY AGAIN';
      }

      const updates: any = {
        spinsAvailable: FieldValue.increment(-1),
      };

      if (prizeType === 'wallet') {
        updates.walletBalance = FieldValue.increment(prizeAmount);
      } else if (prizeType === 'xp') {
        updates.xp = FieldValue.increment(prizeAmount);
      }

      transaction.update(userRef, updates);

      return NextResponse.json({ success: true, prizeType, prizeAmount, label });
    });

  } catch (error: any) {
    console.error('Error spinning wheel:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
