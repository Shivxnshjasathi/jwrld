'use client';

import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSound } from '@/hooks/use-sound';

const NAV_ITEMS = [
  { href: '/home', label: 'Home', icon: 'home' },
  { href: '/bookings', label: 'Bookings', icon: 'event' },
  { href: '/profile', label: 'Profile', icon: 'person' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { playNavClick } = useSound();

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full bg-black/60 backdrop-blur-2xl border-t border-white/10 z-50 flex justify-around items-center px-lg py-5 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href) || (pathname === '/' && item.href === '/home');
        
        return (
          <button
            key={item.href}
            onClick={() => {
              playNavClick();
              router.replace(item.href);
            }}
            className="relative flex flex-col items-center justify-center transition-colors duration-300"
          >
            <motion.div
              whileTap={{ scale: 0.85 }}
              className={`flex flex-col items-center ${isActive ? 'text-primary' : 'text-white/40 hover:text-secondary'}`}
            >
              <span className="material-symbols-outlined font-label-md text-label-md text-[28px]" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {item.icon}
              </span>
            </motion.div>
            
            {isActive && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute -bottom-2 w-1.5 h-1.5 bg-primary rounded-full"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
