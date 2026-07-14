const CACHE_NAME = 'jaaduwrld-pwa-v4';
const OFFLINE_URL = '/offline';

const STATIC_ASSETS = [
  '/',
  '/home',
  '/login',
  '/bookings',
  '/profile',
  '/settings',
  '/food',
  '/social',
  '/chats',
  '/help',
  '/privacy',
  OFFLINE_URL
];

// Install event — cache static assets + skip waiting immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Pre-cache static assets
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.error('[SW] Failed to cache static assets during install:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event — claim all clients immediately + clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key.startsWith('jaaduwrld-pwa-'))
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch event with advanced caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Bypass Service Worker for Firebase & APIs (Firestore long-polling cannot be cached)
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('firestore') ||
    url.pathname.startsWith('/api/')
  ) {
    return;
  }

  // Next.js RSC payload caching (stale-while-revalidate)
  if (request.headers.get('RSC') === '1' || url.pathname.startsWith('/_next/data/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => {
          // If offline and no cache, maybe return empty or a generic RSC payload
          return cached;
        });
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Next.js static assets & generic static files (Cache-First)
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|webp|woff2?|avif)$/) ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok || response.type === 'opaque') { // opaque for cross-origin like fonts
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => {
          // Ignore failures for background images/fonts
        });
      })
    );
    return;
  }

  // HTML page navigations (Stale-While-Revalidate with Offline Fallback)
  if (request.mode === 'navigate' || request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => {
          // OFFLINE FALLBACK
          return cached || caches.match(OFFLINE_URL) || caches.match('/');
        });
        return cached || fetchPromise;
      })
    );
    return;
  }
});

// Push notification handler
self.addEventListener('push', (event) => {
  if (event.data) {
    const payload = event.data.json();
    const notification = payload.notification || payload;
    const options = {
      body: notification.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: payload.id || '1',
      },
    };
    event.waitUntil(
      self.registration.showNotification(notification.title || 'Jaaduwrld', options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
