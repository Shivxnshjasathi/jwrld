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
  type Unsubscribe,
} from 'firebase/firestore';
import { isFirebaseConfigured, getFirebaseDb } from './firebase';

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
  lastMessageAt: string;
  unreadAdmin: number;
  unreadUser: number;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'admin';
  createdAt: string;
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
    { id: 'pool-table-1', name: 'Pool Table 1', category: 'pool', status: 'active', price: 400 },
    { id: 'snooker-table-1', name: 'Snooker Table 1', category: 'snooker', status: 'active', price: 500 },
    { id: 'ps5-station-1', name: 'PS5 Station 1', category: 'ps5', status: 'active', price: 350 },
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
  return docRef.id;
}

export async function cancelBooking(bookingId: string) {
  const db = getDb();
  await updateDoc(doc(db, 'bookings', bookingId), { status: 'cancelled' });
}

export async function updateBookingStatus(bookingId: string, status: Booking['status']) {
  const db = getDb();
  await updateDoc(doc(db, 'bookings', bookingId), { status });
}

export async function getAllBookings(): Promise<Booking[]> {
  const db = getDb();
  const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
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
  });
}

// ─── Food Orders ─────────────────────────────────────────────────────────────

export async function createFoodOrder(orderData: Omit<FoodOrder, 'id' | 'createdAt'>): Promise<string> {
  const db = getDb();
  const docRef = await addDoc(collection(db, 'foodOrders'), {
    ...orderData,
    createdAt: new Date().toISOString(),
  });
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
  });
}

export async function updateFoodOrderStatus(orderId: string, status: 'completed' | 'rejected') {
  const db = getDb();
  await updateDoc(doc(db, 'foodOrders', orderId), { status });
}


// ─── Messaging ───────────────────────────────────────────────────────────────

export async function sendMessage(userId: string, userName: string, text: string, sender: 'user' | 'admin') {
  const db = getDb();
  const chatRef = doc(db, 'chats', userId);
  const now = new Date().toISOString();
  
  // Update or create the chat document
  const chatDoc = await getDoc(chatRef);
  if (!chatDoc.exists()) {
    await setDoc(chatRef, {
      userId,
      userName,
      lastMessage: text,
      lastMessageAt: now,
      unreadAdmin: sender === 'user' ? 1 : 0,
      unreadUser: sender === 'admin' ? 1 : 0,
    });
  } else {
    const data = chatDoc.data() as Chat;
    await updateDoc(chatRef, {
      lastMessage: text,
      lastMessageAt: now,
      unreadAdmin: sender === 'user' ? (data.unreadAdmin || 0) + 1 : 0,
      unreadUser: sender === 'admin' ? (data.unreadUser || 0) + 1 : 0,
    });
  }

  // Add the message
  await addDoc(collection(db, `chats/${userId}/messages`), {
    text,
    sender,
    createdAt: now,
  });
}

export function subscribeToMessages(userId: string, callback: (messages: Message[]) => void): Unsubscribe {
  if (!isFirebaseConfigured) {
    callback([]);
    return () => {};
  }
  const db = getFirebaseDb();
  const q = query(collection(db, `chats/${userId}/messages`), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Message));
    callback(messages);
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
    const chats = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Chat));
    callback(chats);
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
