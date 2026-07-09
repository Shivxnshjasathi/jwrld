import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number): string {
  return `₹ ${amount.toFixed(2)}`;
}

export function formatTime(hour: number, minute: number = 0): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    pool: '8-Ball Pool',
    snooker: 'Snooker',
    ps5: 'PS5 Gaming',
  };
  return labels[category] || category;
}

export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    pool: '🎱',
    snooker: '🔴',
    ps5: '🎮',
  };
  return icons[category] || '🎯';
}

export const ASSET_PRICES: Record<string, number> = {
  pool: 400,
  snooker: 500,
  ps5: 350,
};

export const OPERATING_HOURS = {
  start: 10, // 10 AM
  end: 24,   // 12 AM (midnight)
};

export const CATEGORIES = [
  { id: 'pool', name: '8-Ball Pool', count: 3, price: 400 },
  { id: 'snooker', name: 'Snooker', count: 2, price: 500 },
  { id: 'ps5', name: 'PS5 Gaming', count: 4, price: 350 },
];
