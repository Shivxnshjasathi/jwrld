import { create } from 'zustand';

interface BookingState {
  selectedCategory: string | null;
  selectedDate: string; // YYYY-MM-DD
  startTime: number; // hour in 24h format
  endTime: number;
  selectedAssetId: string | null;
  selectedAssetName: string | null;
  selectedAssetPrice: number;
  protection: boolean;
  couponDiscount: number;
  adminAuthenticated: boolean;

  // Actions
  setAdminAuthenticated: (auth: boolean) => void;
  setCategory: (category: string) => void;
  setDate: (date: string) => void;
  setTimeRange: (start: number, end: number) => void;
  setAsset: (id: string, name: string, price: number) => void;
  clearAsset: () => void;
  toggleProtection: () => void;
  applyCoupon: (discount: number) => void;
  reset: () => void;

  // Computed
  getTotalAmount: () => number;
}

const today = new Date();
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

export const useBookingStore = create<BookingState>((set, get) => ({
  selectedCategory: null,
  selectedDate: todayStr,
  startTime: 10,
  endTime: 11,
  selectedAssetId: null,
  selectedAssetName: null,
  selectedAssetPrice: 0,
  protection: false,
  couponDiscount: 0,
  adminAuthenticated: false,

  setAdminAuthenticated: (auth) => set({ adminAuthenticated: auth }),
  setCategory: (category) => set({ selectedCategory: category }),
  setDate: (date) => set({ selectedDate: date }),
  setTimeRange: (start, end) => set({ startTime: start, endTime: end }),
  setAsset: (id, name, price) =>
    set({ selectedAssetId: id, selectedAssetName: name, selectedAssetPrice: price }),
  clearAsset: () =>
    set({ selectedAssetId: null, selectedAssetName: null, selectedAssetPrice: 0 }),
  toggleProtection: () => set((state) => ({ protection: !state.protection })),
  applyCoupon: (discount) => set({ couponDiscount: discount }),
  reset: () =>
    set({
      selectedCategory: null,
      selectedDate: todayStr,
      startTime: 10,
      endTime: 11,
      selectedAssetId: null,
      selectedAssetName: null,
      selectedAssetPrice: 0,
      protection: false,
      couponDiscount: 0,
    }),

  getTotalAmount: () => {
    const state = get();
    const duration = state.endTime - state.startTime;
    const basePrice = state.selectedAssetPrice * duration;
    const tax = basePrice * 0.18; // 18% GST
    const protectionFee = state.protection ? 9 : 0;
    const subtotal = basePrice + tax + protectionFee;
    return Math.max(0, subtotal - state.couponDiscount);
  },
}));
