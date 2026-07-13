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

      // Possible prizes in order (matches frontend wheel slices 0 to 7):
      // 0: Jackpot (₹500)
      // 1: ₹50 Bonus
      // 2: 200 XP
      // 3: 100 XP
      // 4: ₹20 Bonus
      // 5: 50 XP
      // 6: ₹10 Bonus
      // 7: Miss (0)
      
      const r = Math.random();
      let prizeType = 'xp';
      let prizeAmount = 50;
      let label = '50 XP';
      let prizeIndex = 5;

      if (r < 0.001) { // 0.1% Jackpot
        prizeType = 'wallet'; prizeAmount = 500; label = 'JACKPOT!'; prizeIndex = 0;
      } else if (r < 0.021) { // 2%
        prizeType = 'wallet'; prizeAmount = 50; label = '₹50 Bonus'; prizeIndex = 1;
      } else if (r < 0.071) { // 5%
        prizeType = 'xp'; prizeAmount = 200; label = '200 XP'; prizeIndex = 2;
      } else if (r < 0.171) { // 10%
        prizeType = 'xp'; prizeAmount = 100; label = '100 XP'; prizeIndex = 3;
      } else if (r < 0.321) { // 15%
        prizeType = 'wallet'; prizeAmount = 20; label = '₹20 Bonus'; prizeIndex = 4;
      } else if (r < 0.521) { // 20%
        prizeType = 'xp'; prizeAmount = 50; label = '50 XP'; prizeIndex = 5;
      } else if (r < 0.800) { // 27.9%
        prizeType = 'wallet'; prizeAmount = 10; label = '₹10 Bonus'; prizeIndex = 6;
      } else { // 20% Miss
        prizeType = 'miss'; prizeAmount = 0; label = 'Try Again'; prizeIndex = 7;
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

      return NextResponse.json({ success: true, prizeType, prizeAmount, label, prizeIndex });
    });

  } catch (error: any) {
    console.error('Error spinning wheel:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
