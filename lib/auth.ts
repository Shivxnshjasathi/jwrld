'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signInAnonymously,
  type User,
  type ConfirmationResult,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { isFirebaseConfigured, getFirebaseAuth, getFirebaseDb } from './firebase';
import { generateReferralCode, processReferral } from './referral';

export interface AppUser {
  uid: string;
  phone: string | null;
  name: string;
  email: string | null;
  role: 'customer' | 'admin' | 'guest';
  photoURL: string | null;
  walletBalance: number;
  fcmToken?: string | null;
  xp: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
  referralCode?: string;
  referredBy?: string | null;
  hasRedeemedReferral?: boolean;
  lastLoginDate?: string;
  currentStreak?: number;
  spinsAvailable?: number;
  friends?: string[];
  isVIP?: boolean;
  vipUntil?: string;
}

let confirmationResult: ConfirmationResult | null = null;

export function setupRecaptcha(elementId: string) {
  if (typeof window === 'undefined') return;
  if (!isFirebaseConfigured) {
    console.warn('[ArcadeZone] Firebase not configured — skipping reCAPTCHA setup');
    return;
  }

  const win = window as unknown as Record<string, unknown>;
  if (!win.recaptchaVerifier) {
    try {
      const auth = getFirebaseAuth();
      win.recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
        size: 'invisible',
        callback: () => {},
      });
    } catch (error) {
      console.error('[ArcadeZone] RecaptchaVerifier setup failed:', error);
    }
  }
}

export async function sendOTP(phoneNumber: string): Promise<boolean> {
  if (!isFirebaseConfigured) {
    console.warn('[ArcadeZone] Firebase not configured — cannot send OTP');
    return false;
  }
  try {
    const auth = getFirebaseAuth();
    const appVerifier = (window as unknown as Record<string, unknown>).recaptchaVerifier as RecaptchaVerifier;
    if (!appVerifier) {
      console.error('[ArcadeZone] RecaptchaVerifier not initialized');
      return false;
    }
    confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    return true;
  } catch (error) {
    console.error('Error sending OTP:', error);
    return false;
  }
}

export async function verifyOTP(code: string): Promise<User | null> {
  if (!isFirebaseConfigured) return null;
  try {
    if (!confirmationResult) throw new Error('No confirmation result');
    const result = await confirmationResult.confirm(code);
    await createOrUpdateUser(result.user);
    return result.user;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return null;
  }
}

export async function signUpWithEmail(email: string, password: string, name: string, phone: string = '', referralCode: string = ''): Promise<User | null> {
  if (!isFirebaseConfigured) return null;
  try {
    const auth = getFirebaseAuth();
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user doc with provided name and phone
    const db = getFirebaseDb();
    const userRef = doc(db, 'users', result.user.uid);
    let fcmToken: string | null = null;
    try {
      const { requestNotificationPermission } = await import('./firebase');
      fcmToken = await requestNotificationPermission();
    } catch (e) {
      console.error('Failed to get FCM token:', e);
    }

    const userData = {
      uid: result.user.uid,
      name,
      phone,
      email: result.user.email,
      role: 'customer',
      photoURL: null,
      walletBalance: 0,
      fcmToken,
      xp: 0,
      tier: 'Bronze',
      createdAt: new Date().toISOString(),
      referralCode: generateReferralCode(),
      hasRedeemedReferral: false,
      lastLoginDate: new Date().toISOString().split('T')[0],
      currentStreak: 1,
      spinsAvailable: 0,
      friends: [],
    };
    await setDoc(userRef, userData);
    
    // Process referral if provided
    if (referralCode) {
      await processReferral(result.user.uid, referralCode);
    }
    
    return result.user;
  } catch (error) {
    console.error('Error signing up with email:', error);
    throw error;
  }
}

export async function signInWithEmail(email: string, password: string): Promise<User | null> {
  if (!isFirebaseConfigured) return null;
  try {
    const auth = getFirebaseAuth();
    const result = await signInWithEmailAndPassword(auth, email, password);
    await createOrUpdateUser(result.user);
    return result.user;
  } catch (error) {
    console.error('Error signing in with email:', error);
    throw error;
  }
}

export async function resetPassword(email: string): Promise<boolean> {
  if (!isFirebaseConfigured) return false;
  try {
    const auth = getFirebaseAuth();
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
}

export async function signInWithGoogle(): Promise<User | null> {
  if (!isFirebaseConfigured) {
    console.warn('[ArcadeZone] Firebase not configured — cannot sign in with Google');
    return null;
  }
  try {
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    await createOrUpdateUser(result.user);
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    return null;
  }
}

export async function signInAsGuest(): Promise<User | null> {
  if (!isFirebaseConfigured) {
    console.warn('[ArcadeZone] Firebase not configured — cannot sign in as guest');
    return null;
  }
  try {
    const auth = getFirebaseAuth();
    const result = await signInAnonymously(auth);
    
    // Create guest user doc
    const db = getFirebaseDb();
    const userRef = doc(db, 'users', result.user.uid);
    let fcmToken: string | null = null;
    try {
      const { requestNotificationPermission } = await import('./firebase');
      fcmToken = await requestNotificationPermission();
    } catch (e) {
      console.error('Failed to get FCM token:', e);
    }

    const userData = {
      uid: result.user.uid,
      name: 'Guest Player',
      phone: null,
      email: null,
      role: 'guest',
      photoURL: null,
      walletBalance: 0,
      fcmToken,
      xp: 0,
      tier: 'Bronze',
      createdAt: new Date().toISOString(),
      referralCode: generateReferralCode(),
      hasRedeemedReferral: false,
      lastLoginDate: new Date().toISOString().split('T')[0],
      currentStreak: 1,
      spinsAvailable: 0,
      friends: [],
    };
    await setDoc(userRef, userData);
    
    return result.user;
  } catch (error) {
    console.error('Error signing in as guest:', error);
    throw error;
  }
}

export async function signOut() {
  if (!isFirebaseConfigured) return;
  try {
    const auth = getFirebaseAuth();
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
  }
}

async function createOrUpdateUser(user: User) {
  if (!isFirebaseConfigured) return;
  try {
    const db = getFirebaseDb();
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    let fcmToken: string | null = null;
    try {
      const { requestNotificationPermission } = await import('./firebase');
      fcmToken = await requestNotificationPermission();
    } catch (e) {
      console.error('Failed to get FCM token:', e);
    }

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        phone: user.phoneNumber || null,
        name: user.displayName || 'Arcade Player',
        email: user.email || null,
        role: 'customer',
        photoURL: user.photoURL || null,
        walletBalance: 0,
        fcmToken,
        xp: 0,
        tier: 'Bronze',
        createdAt: new Date().toISOString(),
        referralCode: generateReferralCode(),
        hasRedeemedReferral: false,
        lastLoginDate: new Date().toISOString().split('T')[0],
        currentStreak: 1,
        spinsAvailable: 0,
        friends: [],
      });
    } else {
      // User exists, just update their FCM token and latest sign-in
      if (fcmToken) {
        await updateDoc(userRef, {
          fcmToken,
          lastSignInTime: new Date().toISOString(),
        });
      } else {
        await updateDoc(userRef, {
          lastSignInTime: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    console.error('Error creating user doc:', error);
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  const fetchAppUser = useCallback(async (firebaseUser: User) => {
    if (!isFirebaseConfigured) return;
    try {
      const db = getFirebaseDb();
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setAppUser(userSnap.data() as AppUser);
      } else {
        // Document doesn't exist (maybe deleted manually). Recreate it.
        await createOrUpdateUser(firebaseUser);
        const newSnap = await getDoc(userRef);
        if (newSnap.exists()) {
          setAppUser(newSnap.data() as AppUser);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      setProfileLoading(false);
      return;
    }

    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch user data asynchronously without blocking the UI loading state
        fetchAppUser(firebaseUser).finally(() => setProfileLoading(false)).catch(console.error);
      } else {
        setAppUser(null);
        setProfileLoading(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchAppUser]);

  return {
    user,
    appUser,
    loading,
    profileLoading,
    isAdmin: appUser?.role === 'admin',
    isAuthenticated: !!user,
    isFirebaseReady: isFirebaseConfigured,
  };
}
