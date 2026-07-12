import { NextResponse } from 'next/server';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const { bookingId, uid, action } = await req.json();

    if (!bookingId || !uid || !['pay', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
    }

    const app = getFirebaseAdminApp();
    if (!process.env.FIREBASE_PRIVATE_KEY) {
       return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 500 });
    }

    const { getFirestore, FieldValue } = await import('firebase-admin/firestore');
    const db = getFirestore(app);
    const bookingRef = db.collection('bookings').doc(bookingId);

    return await db.runTransaction(async (transaction) => {
      const bookingSnap = await transaction.get(bookingRef);
      if (!bookingSnap.exists) {
        throw new Error('Booking not found');
      }

      const booking = bookingSnap.data()!;
      if (!booking.splitWith || !booking.splitWith.includes(uid)) {
        throw new Error('You are not part of this split-pay');
      }

      if (booking.splitStatus?.[uid] !== 'pending') {
        throw new Error('You have already responded to this request');
      }

      const totalPeople = 1 + booking.splitWith.length;
      const share = Math.round(booking.totalAmount / totalPeople);
      const userRef = db.collection('users').doc(uid);
      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists) throw new Error('User not found');
      const userWallet = userSnap.data()?.walletBalance || 0;

      if (action === 'pay') {
        if (userWallet < share) {
          throw new Error('Insufficient wallet balance to pay your share');
        }

        // Deduct from user
        transaction.update(userRef, { walletBalance: FieldValue.increment(-share) });
        
        // Update split status
        const newSplitStatus = { ...booking.splitStatus, [uid]: 'paid' };
        
        // Check if everyone has paid
        const allPaid = booking.splitWith.every((friendId: string) => newSplitStatus[friendId] === 'paid');
        
        const bookingUpdates: any = { splitStatus: newSplitStatus };
        if (allPaid) {
          bookingUpdates.status = 'confirmed';
        }
        
        transaction.update(bookingRef, bookingUpdates);
        return NextResponse.json({ success: true, allPaid });

      } else if (action === 'decline') {
        // If someone declines, we cancel the booking and refund everyone who already paid
        const newSplitStatus = { ...booking.splitStatus, [uid]: 'declined' };
        
        // Refund creator
        const creatorRef = db.collection('users').doc(booking.userId);
        transaction.update(creatorRef, { walletBalance: FieldValue.increment(share) });

        // Refund anyone else who paid
        for (const friendId of booking.splitWith) {
          if (booking.splitStatus?.[friendId] === 'paid') {
            const friendRef = db.collection('users').doc(friendId);
            transaction.update(friendRef, { walletBalance: FieldValue.increment(share) });
          }
        }

        transaction.update(bookingRef, {
          splitStatus: newSplitStatus,
          status: 'cancelled'
        });

        return NextResponse.json({ success: true, message: 'Booking cancelled and refunds issued' });
      }
    });

  } catch (error: any) {
    console.error('Error in split-action:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
