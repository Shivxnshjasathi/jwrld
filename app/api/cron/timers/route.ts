import { NextResponse } from 'next/server';
import { getFirebaseAdminApp, getAdminMessaging } from '@/lib/firebase-admin';

// Vercel Cron jobs trigger a GET request
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      // Ignoring auth check for now so you can test it directly in the browser during dev
    }

    const app = getFirebaseAdminApp();
    if (!app.options.projectId) {
      return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 500 });
    }

    // Get Firestore from Admin SDK
    const { getFirestore } = await import('firebase-admin/firestore');
    const db = getFirestore(app);
    const messaging = getAdminMessaging();

    // Calculate current time in IST
    const now = new Date();
    const istOptions = { timeZone: 'Asia/Kolkata' };
    const todayStr = new Intl.DateTimeFormat('en-CA', istOptions).format(now); // YYYY-MM-DD
    
    const istTimeString = now.toLocaleTimeString('en-US', { ...istOptions, hour12: false });
    const [istHour, istMinute] = istTimeString.split(':').map(Number);
    const currentMinutes = istHour * 60 + istMinute;

    // Fetch today's confirmed bookings
    const bookingsSnapshot = await db
      .collection('bookings')
      .where('date', '==', todayStr)
      .where('status', '==', 'confirmed')
      .get();

    let startingCount = 0;
    let endingCount = 0;

    const updates: Promise<any>[] = [];

    for (const doc of bookingsSnapshot.docs) {
      const booking = doc.data();
      const startMinutes = booking.startTime * 60;
      const endMinutes = booking.endTime * 60;

      const timeUntilStart = startMinutes - currentMinutes;
      const timeUntilEnd = endMinutes - currentMinutes;

      // 1. Check if starting soon (<= 15 mins)
      if (timeUntilStart > 0 && timeUntilStart <= 15 && !booking.startingNotified) {
        // Fetch user token
        const userDoc = await db.collection('users').doc(booking.userId).get();
        const fcmToken = userDoc.data()?.fcmToken;

        if (fcmToken) {
          updates.push(
            messaging.send({
              token: fcmToken,
              notification: {
                title: 'Booking Starting Soon 🎮',
                body: `Your booking for ${booking.assetName} starts in ${timeUntilStart} minutes!`,
              },
            }).catch(console.error)
          );
        }

        // Mark as notified
        updates.push(doc.ref.update({ startingNotified: true }));
        startingCount++;
      }

      // 2. Check if ending soon (<= 10 mins)
      if (timeUntilEnd > 0 && timeUntilEnd <= 10 && !booking.endingNotified) {
        const userDoc = await db.collection('users').doc(booking.userId).get();
        const fcmToken = userDoc.data()?.fcmToken;

        if (fcmToken) {
          updates.push(
            messaging.send({
              token: fcmToken,
              notification: {
                title: 'Time Almost Up ⏳',
                body: `Your booking for ${booking.assetName} ends in ${timeUntilEnd} minutes. Request an extension to keep playing!`,
              },
            }).catch(console.error)
          );
        }

        updates.push(doc.ref.update({ endingNotified: true }));
        endingCount++;
      }
    }

    await Promise.all(updates);

    return NextResponse.json({ 
      success: true, 
      processed: bookingsSnapshot.size,
      startingNotified: startingCount,
      endingNotified: endingCount,
      time: istTimeString
    });

  } catch (error) {
    console.error('Error running timers cron:', error);
    return NextResponse.json({ error: 'Failed to run cron job' }, { status: 500 });
  }
}
