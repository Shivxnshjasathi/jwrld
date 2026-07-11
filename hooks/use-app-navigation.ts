'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * A robust navigation hook that safely handles the "back" action.
 * In PWAs or when users land on a deep link from a push notification, the browser's history
 * stack might be empty (length = 1). Calling router.back() in this state can exit the app.
 * This hook checks the navigation depth and falls back to a safe route if needed.
 */
export function useAppNavigation() {
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    // Keep track of how many pages the user has visited within this PWA session
    // This is more reliable than window.history.length which can include external sites.
    const sessionDepth = sessionStorage.getItem('pwa_nav_depth');
    
    if (!sessionDepth) {
      sessionStorage.setItem('pwa_nav_depth', '1');
      setCanGoBack(false);
    } else {
      const depth = parseInt(sessionDepth, 10);
      setCanGoBack(depth > 1);
      
      // Increment depth on new page load 
      // (Only increment if we just pushed to history, though Next.js doesn't easily expose 'action'.
      // We will just assume any mount is a navigation for this heuristic).
      sessionStorage.setItem('pwa_nav_depth', (depth + 1).toString());
    }
  }, []);

  const goBack = (fallbackRoute: string = '/home') => {
    // Check if the history state has an index (Next.js specific implementation detail)
    const hasNextJsHistory = window.history.state && window.history.state.idx > 0;

    if (window.history.length > 2 || hasNextJsHistory || canGoBack) {
      router.back();
    } else {
      // The back stack is empty or we are the first page in this tab session.
      // Route safely to the fallback instead of crashing or exiting the app.
      router.replace(fallbackRoute);
    }
  };

  return { ...router, goBack };
}
