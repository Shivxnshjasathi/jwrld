import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { getFirebaseDb, isFirebaseConfigured } from './firebase';
import { addWalletBalance } from './wallet';
import { sendPushToUser } from './notify-client';

export async function processReferral(newUserId: string, referralCode: string): Promise<boolean> {
  if (!referralCode) return false;
  
  const code = referralCode.trim().toUpperCase();
  if (code.length === 0) return false;

  try {
    const response = await fetch('/api/referral', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        newUserId,
        referralCode: code,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.warn(`[ArcadeZone] Referral failed: ${errorData.error}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error processing referral:', error);
    return false;
  }
}

export function generateReferralCode(): string {
  // Generates a random 6-character alphanumeric string (e.g. A9B2C4)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
