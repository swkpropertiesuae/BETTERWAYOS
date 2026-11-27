import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Betterway Mortgages OS v3',
    short_name: 'Betterway OS',
    description:
      'UAE Mortgage Brokerage Operating System — 24-Bank Policy Matrix, 12-Step Pipeline, Warda & Shabib Workspace, GPS Field Meetings & Daily Excel Backups.',
    start_url: '/os',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#070a0f',
    theme_color: '#070a0f',
    categories: ['finance', 'business', 'productivity'],
    icons: [
      {
        src: '/brand/betterway-app-icon-dark-squircle-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/brand/betterway-icon-4k-transparent.png',
        sizes: '1024x1024',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      { name: 'Workspaces', url: '/os', description: 'Open Betterway OS Home' },
      { name: 'Dashboard', url: '/os/dashboard', description: 'Live Loan Book & Tasks' },
      { name: '24-Bank Desk', url: '/os/mortgage-desk', description: '18-Bank Rates, Proposals & RMs' },
      { name: 'Field GPS', url: '/os/field-gps', description: 'Log GPS Mortgage Field Meetings' },
    ],
  };
}
