import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Betterway Mortgages OS',
    short_name: 'Betterway OS',
    description:
      'UAE Mortgage Brokerage Operating System — 18-Bank 2026 Matrix, 12-Step Pipeline, Betterway Inside, SIP Cloud Calls, Task Follow-Ups & Attachments, Field GPS & Daily Excel Backups.',
    start_url: '/os',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0b192c',
    theme_color: '#0b192c',
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
      { name: 'My Tasks & Follow-Ups', url: '/os/dashboard', description: 'Live Loan Book, Tasks & Attachments' },
      { name: 'Betterway Inside', url: '/os/inside', description: 'Team Channels & Direct Messages' },
      { name: 'SIP Call Desk', url: '/os/sip-calls', description: 'Cloud PBX & 159 Bank RM Speed-Dial' },
      { name: '18-Bank Desk', url: '/os/mortgage-desk', description: '2026 Rates, Proposals & RMs' },
      { name: 'Field GPS', url: '/os/field-gps', description: 'Log GPS Mortgage Field Meetings' },
    ],
  };
}
