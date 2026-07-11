'use client';

import { usePathname, useRouter } from 'next/navigation';
// Force cache invalidation

const NAV_ITEMS = [
  { href: '/home', label: 'Home', icon: 'home' },
  { href: '/bookings', label: 'Bookings', icon: 'event' },
  { href: '/profile', label: 'Profile', icon: 'person' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full bg-black/60 backdrop-blur-2xl border-t border-white/10 z-50 flex justify-around items-center px-lg py-5 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href) || (pathname === '/' && item.href === '/home');
        
        if (isActive) {
          return (
            <button
              key={item.href}
              onClick={() => router.replace(item.href)}
              className="flex flex-col items-center justify-center text-primary after:content-[''] after:w-1.5 after:h-1.5 after:bg-primary after:rounded-full after:mt-1.5 hover:text-primary/80 transition-all active:scale-90 duration-300"
            >
              <span className="material-symbols-outlined font-label-md text-label-md text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                {item.icon}
              </span>
            </button>
          );
        }

        return (
          <button
            key={item.href}
            onClick={() => router.replace(item.href)}
            className="flex flex-col items-center justify-center text-white/40 hover:text-secondary transition-all active:scale-90 duration-300"
          >
            <span className="material-symbols-outlined font-label-md text-label-md text-[28px]">
              {item.icon}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
