import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Betterway Mortgages OS',
    short_name: 'Betterway OS',
    description: 'Betterway Mortgages LLC — UAE Mortgage Operating System & Field Desk PWA',
    start_url: '/os',
    display: 'standalone',
    background_color: '#0A1128',
    theme_color: '#0A1128',
    icons: [
      { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
