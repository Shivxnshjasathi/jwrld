import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Jaaduwrld — Book. Play. Win.',
    short_name: 'Jaaduwrld',
    description: 'Book pool tables, snooker, and PS5 gaming stations at Jaaduwrld. Premium arcade booking made easy.',
    start_url: '/',
    display: 'standalone',
    background_color: '#111111',
    theme_color: '#111111',
    orientation: 'portrait',
    categories: ['entertainment', 'games', 'sports'],
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
