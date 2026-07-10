'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, Calendar, User } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/bookings', label: 'Bookings', icon: Calendar },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const activeIndex = NAV_ITEMS.findIndex((item) =>
    pathname.startsWith(item.href)
  );

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4">
      <nav className="bg-arcade-card rounded-full px-2 py-2 flex items-center gap-2 shadow-2xl border border-arcade-border transition-colors">
        {NAV_ITEMS.map((item, index) => {
          const isActive = index === activeIndex || (activeIndex === -1 && index === 0);
          const Icon = item.icon;

          return (
            <button
              key={item.href}
              onClick={() => router.replace(item.href)}
              className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
                isActive ? 'bg-foreground text-background' : 'text-arcade-text-secondary hover:text-foreground'
              }`}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 2}
              />
            </button>
          );
        })}
      </nav>
    </div>
  );
}
