import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  setDoc,
  serverTimestamp,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { isFirebaseConfigured, getFirebaseDb } from './firebase';
import { sendPushToUser, sendPushToAdmins } from './notify-client';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Asset {
  id: string;
  name: string;
  category: 'pool' | 'snooker' | 'ps5';
  status: 'active' | 'maintenance';
  price: number;
}

export interface Booking {
  id: string;
  userId: string;
  userName?: string;
  assetId: string;
  assetName: string;
  category: string;
  date: string; // YYYY-MM-DD
  startTime: number; // hour (24h format)
  endTime: number;   // hour (24h format)
  totalAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled' | 'confirmed';
  createdAt: string;
  protection: boolean;
}

export interface WaitlistItem {
  id: string;
  userId: string;
  userName: string;
  category: string;
  date: string;
  startTime: number;
  endTime: number;
  createdAt: string;
}

export interface FoodItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface FoodOrder {
  id: string;
  userId: string;
  userName?: string;
  tableNumber: string;
  items: FoodItem[];
  totalAmount: number;
  status: 'pending' | 'completed' | 'rejected';
  createdAt: string;
}

export interface Chat {
  id: string; // usually userId
  userId: string;
  userName: string;
  lastMessage: string;
  lastMessageAt: number;
  unreadAdmin: number;
  unreadUser: number;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'admin';
  createdAt: number;
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function getDb() {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase not configured. Add your credentials to .env.local');
  }
  return getFirebaseDb();
}

// ─── Assets ──────────────────────────────────────────────────────────────────

export async function getAssets(): Promise<Asset[]> {
  const db = getDb();
  const snapshot = await getDocs(collection(db, 'assets'));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Asset));
}

export async function getAssetsByCategory(category: string): Promise<Asset[]> {
  const assets: Asset[] = [
    { id: 'pool-table-1', name: 'Pool Table 1', category: 'pool', status: 'active', price: 100 },
    { id: 'snooker-table-1', name: 'Snooker Table 1', category: 'snooker', status: 'active', price: 250 },
    { id: 'ps5-station-1', name: 'PS5 Station 1', category: 'ps5', status: 'active', price: 100 },
  ];
  return assets.filter(a => a.category === category && a.status === 'active');
}

export async function updateAssetStatus(assetId: string, status: 'active' | 'maintenance') {
  const db = getDb();
  await updateDoc(doc(db, 'assets', assetId), { status });
}

// ─── Bookings ────────────────────────────────────────────────────────────────

export async function getBookingsForDate(date: string, category?: string): Promise<Booking[]> {
  const db = getDb();
  let q;
  if (category) {
    q = query(
      collection(db, 'bookings'),
      where('date', '==', date),
      where('category', '==', category),
      where('status', '==', 'confirmed')
    );
  } else {
    q = query(
      collection(db, 'bookings'),
      where('date', '==', date),
      where('status', '==', 'confirmed')
    );
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
}

export async function getUserBookings(userId: string): Promise<Booking[]> {
  const db = getDb();
  const q = query(
    collection(db, 'bookings'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
}

export async function createBooking(booking: Omit<Booking, 'id'>): Promise<string> {
  const db = getDb();
  // Check for conflicts before creating
  const conflicts = await getBookingsForDate(booking.date, booking.category);
  const hasConflict = conflicts.some(
    (b) =>
      b.assetId === booking.assetId &&
      b.startTime < booking.endTime &&
      b.endTime > booking.startTime
  );

  if (hasConflict) {
    throw new Error('This slot has already been booked. Please select another.');
  }

  const docRef = await addDoc(collection(db, 'bookings'), {
    ...booking,
    createdAt: new Date().toISOString(),
  });
  
  // Notify admins
  sendPushToAdmins(
    'New Booking Request',
    `New booking request for ${booking.assetName}`
  ).catch(console.error);

  return docRef.id;
}

export async function cancelBooking(bookingId: string) {
  const db = getDb();
  await updateDoc(doc(db, 'bookings', bookingId), { status: 'cancelled' });
}

export async function updateBookingStatus(bookingId: string, status: Booking['status']) {
  const db = getDb();
  const bookingRef = doc(db, 'bookings', bookingId);
  const snap = await getDoc(bookingRef);
  
  await updateDoc(bookingRef, { status });
  
  // Notify user of status change
  if (snap.exists()) {
    const data = snap.data() as Booking;
    const readableStatus = status === 'confirmed' ? 'approved' : status;
    sendPushToUser(
      data.userId,
      'Booking Update',
      `Your booking for ${data.assetName} has been ${readableStatus}.`
    ).catch(console.error);
  }
}

export async function extendBookingTime(booking: Booking, hoursToAdd: number): Promise<void> {
  const db = getDb();
  const newEndTime = booking.endTime + hoursToAdd;
  
  if (newEndTime > 21) {
    throw new Error('Cannot extend beyond closing time (9 PM).');
  }

  // Check for conflicts for the extended period
  const conflicts = await getBookingsForDate(booking.date, booking.category);
  const hasConflict = conflicts.some(
    (b) =>
      b.id !== booking.id &&
      b.assetId === booking.assetId &&
      b.startTime < newEndTime &&
      b.endTime > booking.endTime
  );

  if (hasConflict) {
    throw new Error('Cannot extend: the next slot is already booked.');
  }

  // Deduct from wallet based on asset price (assumes 1 hour = base price)
  const amountToDeduct = (booking.totalAmount / (booking.endTime - booking.startTime)) * hoursToAdd;
  
  const { deductWalletBalance } = await import('./wallet');
  await deductWalletBalance(booking.userId, amountToDeduct);

  // Update booking
  await updateDoc(doc(db, 'bookings', booking.id), {
    endTime: newEndTime,
    totalAmount: booking.totalAmount + amountToDeduct
  });
}

export async function getAllBookings(): Promise<Booking[]> {
  const db = getDb();
  const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
}

// ─── Waitlist ────────────────────────────────────────────────────────────────

export async function joinWaitlist(waitlist: Omit<WaitlistItem, 'id' | 'createdAt'>): Promise<string> {
  const db = getDb();
  // Check if user is already on waitlist for this slot
  const q = query(
    collection(db, 'waitlist'),
    where('userId', '==', waitlist.userId),
    where('category', '==', waitlist.category),
    where('date', '==', waitlist.date)
  );
  const snapshot = await getDocs(q);
  const existing = snapshot.docs.find(d => {
    const data = d.data();
    return data.startTime === waitlist.startTime && data.endTime === waitlist.endTime;
  });

  if (existing) {
    throw new Error('You are already on the waitlist for this exact slot.');
  }

  const docRef = await addDoc(collection(db, 'waitlist'), {
    ...waitlist,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

// ─── Real-time Listeners ─────────────────────────────────────────────────────

export function subscribeToBookings(
  date: string,
  category: string,
  callback: (bookings: Booking[]) => void
): Unsubscribe {
  if (!isFirebaseConfigured) {
    callback([]);
    return () => {};
  }
  const db = getFirebaseDb();
  const q = query(
    collection(db, 'bookings'),
    where('date', '==', date),
    where('category', '==', category)
    // Removed the where clause for status, so we can filter on client for confirmed/approved/pending
  );

  return onSnapshot(q, (snapshot) => {
    const bookings = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
    callback(bookings);
  }, (error) => {
    console.error('[ArcadeZone] Bookings listener error:', error.message);
    callback([]);
  });
}

export function subscribeToUserBookings(
  userId: string,
  callback: (bookings: Booking[]) => void
): Unsubscribe {
  if (!isFirebaseConfigured) {
    callback([]);
    return () => {};
  }
  const db = getFirebaseDb();
  const q = query(
    collection(db, 'bookings'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const bookings = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
    callback(bookings);
  }, (error) => {
    console.error('[ArcadeZone] User bookings listener error:', error.message);
    callback([]);
  });
}

export function subscribeToAllBookings(
  callback: (bookings: Booking[]) => void
): Unsubscribe {
  if (!isFirebaseConfigured) {
    callback([]);
    return () => {};
  }
  const db = getFirebaseDb();
  const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const bookings = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
    callback(bookings);
  }, (error) => {
    console.error('[ArcadeZone] All bookings listener error:', error.message);
    callback([]);
  });
}

export function subscribeToAssets(
  callback: (assets: Asset[]) => void
): Unsubscribe {
  if (!isFirebaseConfigured) {
    callback([]);
    return () => {};
  }
  const db = getFirebaseDb();
  return onSnapshot(collection(db, 'assets'), (snapshot) => {
    const assets = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Asset));
    callback(assets);
  }, (error) => {
    console.error('[ArcadeZone] Assets listener error:', error.message);
    callback([]);
  });
}

// ─── Food Orders ─────────────────────────────────────────────────────────────

export async function createFoodOrder(orderData: Omit<FoodOrder, 'id' | 'createdAt'>): Promise<string> {
  const db = getDb();
  const docRef = await addDoc(collection(db, 'foodOrders'), {
    ...orderData,
    createdAt: new Date().toISOString(),
  });
  
  // Notify admins
  sendPushToAdmins(
    'New Food Order',
    `New order for ${orderData.items.length} items`
  ).catch(console.error);

  return docRef.id;
}

export function subscribeToFoodOrders(callback: (orders: FoodOrder[]) => void): Unsubscribe {
  if (!isFirebaseConfigured) {
    callback([]);
    return () => {};
  }
  const db = getFirebaseDb();
  const q = query(collection(db, 'foodOrders'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as FoodOrder));
    callback(orders);
  }, (error) => {
    console.error('[ArcadeZone] Food orders listener error:', error.message);
    callback([]);
  });
}

export async function updateFoodOrderStatus(orderId: string, status: 'completed' | 'rejected') {
  const db = getDb();
  const orderRef = doc(db, 'foodOrders', orderId);
  const snap = await getDoc(orderRef);
  
  await updateDoc(orderRef, { status });
  
  if (snap.exists()) {
    const data = snap.data() as FoodOrder;
    sendPushToUser(
      data.userId,
      'Food Order Update',
      `Your food order is now ${status}.`
    ).catch(console.error);
  }
}


// ─── Messaging ───────────────────────────────────────────────────────────────

export async function sendMessage(userId: string, userName: string, text: string, sender: 'user' | 'admin') {
  const db = getDb();
  const chatRef = doc(db, 'chats', userId);
  
  // Update or create the chat document
  const chatDoc = await getDoc(chatRef);
  if (!chatDoc.exists()) {
    await setDoc(chatRef, {
      userId,
      userName,
      lastMessage: text,
      lastMessageAt: serverTimestamp(),
      unreadAdmin: sender === 'user' ? 1 : 0,
      unreadUser: sender === 'admin' ? 1 : 0,
    });
  } else {
    const data = chatDoc.data() as Chat;
    await updateDoc(chatRef, {
      lastMessage: text,
      lastMessageAt: serverTimestamp(),
      unreadAdmin: sender === 'user' ? (data.unreadAdmin || 0) + 1 : 0,
      unreadUser: sender === 'admin' ? (data.unreadUser || 0) + 1 : 0,
    });
  }

  // Add the message
  await addDoc(collection(db, `chats/${userId}/messages`), {
    text,
    sender,
    createdAt: serverTimestamp(),
  });
  
  // Trigger push notifications
  if (sender === 'user') {
    sendPushToAdmins('New Message from ' + userName, text).catch(console.error);
  } else {
    sendPushToUser(userId, 'Message from Admin', text).catch(console.error);
  }
}

export function subscribeToMessages(userId: string, callback: (messages: Message[]) => void): Unsubscribe {
  if (!isFirebaseConfigured) {
    callback([]);
    return () => {};
  }
  const db = getFirebaseDb();
  const q = query(collection(db, `chats/${userId}/messages`), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((d) => {
      const data = d.data();
      // Handle both Timestamp objects (new) and ISO strings (old) gracefully
      const createdAt = data.createdAt?.toMillis 
        ? data.createdAt.toMillis() 
        : (new Date(data.createdAt || Date.now()).getTime());
      return { id: d.id, ...data, createdAt } as Message;
    });
    // Local sort to fix cross-type sorting artifacts in Firestore
    messages.sort((a, b) => a.createdAt - b.createdAt);
    callback(messages);
  }, (error) => {
    console.error('[ArcadeZone] Messages listener error:', error.message);
    callback([]);
  });
}

export function subscribeToChats(callback: (chats: Chat[]) => void): Unsubscribe {
  if (!isFirebaseConfigured) {
    callback([]);
    return () => {};
  }
  const db = getFirebaseDb();
  const q = query(collection(db, 'chats'), orderBy('lastMessageAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const chats = snapshot.docs.map((d) => {
      const data = d.data();
      const lastMessageAt = data.lastMessageAt?.toMillis 
        ? data.lastMessageAt.toMillis() 
        : (new Date(data.lastMessageAt || Date.now()).getTime());
      return { id: d.id, ...data, lastMessageAt } as Chat;
    });
    // Local sort to fix cross-type sorting artifacts in Firestore
    chats.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
    callback(chats);
  }, (error) => {
    console.error('[ArcadeZone] Chats listener error:', error.message);
    callback([]);
  });
}

export async function markChatRead(userId: string, userType: 'user' | 'admin') {
  const db = getDb();
  const chatRef = doc(db, 'chats', userId);
  const chatDoc = await getDoc(chatRef);
  if (chatDoc.exists()) {
    await updateDoc(chatRef, {
      [userType === 'user' ? 'unreadUser' : 'unreadAdmin']: 0,
    });
  }
}


// ─── Seed Data ───────────────────────────────────────────────────────────────

export async function seedAssets() {
  const db = getDb();
  const assets = [
    { name: 'Pool Table 1', category: 'pool', status: 'active', price: 400 },
    { name: 'Snooker Table 1', category: 'snooker', status: 'active', price: 500 },
    { name: 'PS5 Station 1', category: 'ps5', status: 'active', price: 350 },
  ];

  for (const asset of assets) {
    const assetId = asset.name.toLowerCase().replace(/\s+/g, '-');
    await setDoc(doc(db, 'assets', assetId), asset);
  }
}

// ─── Announcements ──────────────────────────────────────────────────────────

export interface Announcement {
  text: string;
  active: boolean;
  createdAt: string;
}

export async function setAnnouncement(text: string, active: boolean) {
  const db = getDb();
  await setDoc(doc(db, 'settings', 'announcement'), {
    text,
    active,
    createdAt: new Date().toISOString(),
  });
}

export function subscribeToAnnouncement(callback: (announcement: Announcement | null) => void): Unsubscribe {
  if (!isFirebaseConfigured) {
    callback(null);
    return () => {};
  }
  const db = getFirebaseDb();
  return onSnapshot(doc(db, 'settings', 'announcement'), (snap) => {
    if (snap.exists()) {
      callback(snap.data() as Announcement);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('[ArcadeZone] Announcement listener error:', error.message);
    callback(null);
  });
}

// ─── Live Availability ───────────────────────────────────────────────────────

export function subscribeToTodayBookings(callback: (bookings: Booking[]) => void): Unsubscribe {
  if (!isFirebaseConfigured) {
    callback([]);
    return () => {};
  }
  const db = getFirebaseDb();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const q = query(
    collection(db, 'bookings'),
    where('date', '==', todayStr)
  );
  return onSnapshot(q, (snapshot) => {
    const bookings = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
    callback(bookings);
  }, (error) => {
    console.error('[ArcadeZone] Today bookings listener error:', error.message);
    callback([]);
  });
}

