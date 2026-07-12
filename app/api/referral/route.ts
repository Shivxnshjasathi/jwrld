import { NextResponse } from 'next/server';
import { getFirebaseAdminApp, getAdminMessaging } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const { newUserId, referralCode } = await req.json();

    if (!newUserId || !referralCode) {
      return NextResponse.json({ error: 'Missing newUserId or referralCode' }, { status: 400 });
    }

    const app = getFirebaseAdminApp();
    if (!process.env.FIREBASE_PRIVATE_KEY) {
       return NextResponse.json({ error: 'Firebase Admin not configured on server' }, { status: 500 });
    }

    const { getFirestore, FieldValue } = await import('firebase-admin/firestore');
    const db = getFirestore(app);
    const code = referralCode.trim().toUpperCase();

    // Find the referring user by their referral code
    const usersSnapshot = await db.collection('users')
      .where('referralCode', '==', code)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
    }

    const referrerDoc = usersSnapshot.docs[0];
    const referrerId = referrerDoc.id;

    if (referrerId === newUserId) {
      return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 });
    }

    const rewardAmount = 50;

    const batch = db.batch();
    const referrerRef = db.collection('users').doc(referrerId);
    const newUserRef = db.collection('users').doc(newUserId);

    // 1. Reward the Referrer
    batch.update(referrerRef, {
      walletBalance: FieldValue.increment(rewardAmount)
    });

    // 2. Reward the New User & Mark as Redeemed
    batch.update(newUserRef, {
      walletBalance: FieldValue.increment(rewardAmount),
      hasRedeemedReferral: true,
      referredBy: referrerId,
    });

    await batch.commit();

    // 3. Send Push Notifications (Optional, best effort)
    const messaging = getAdminMessaging();
    const referrerData = referrerDoc.data();
    const newUserData = (await newUserRef.get()).data();

    if (referrerData?.fcmToken) {
      messaging.send({
        token: referrerData.fcmToken,
        notification: {
          title: 'Referral Reward! 🎉',
          body: `A new user signed up with your code! You earned ₹${rewardAmount} in your Arcade Wallet.`
        }
      }).catch(console.error);
    }

    if (newUserData?.fcmToken) {
      messaging.send({
        token: newUserData.fcmToken,
        notification: {
          title: 'Welcome Bonus! 🎁',
          body: `You used a referral code and earned ₹${rewardAmount} in your Arcade Wallet to start playing!`
        }
      }).catch(console.error);
    }

    return NextResponse.json({ success: true, rewardAmount });
  } catch (error) {
    console.error('Error processing referral on server:', error);
    return NextResponse.json({ error: `Failed to process referral: ${(error as Error).message}` }, { status: 500 });
  }
}
