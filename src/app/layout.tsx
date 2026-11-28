import type { Metadata, Viewport } from 'next';
import './globals.css';
import { OsProvider } from '@/components/os/OsProvider';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#070e1a' },
  ],
};

export const metadata: Metadata = {
  title: 'Betterway Mortgages OS v3 — Executive Operating System',
  description:
    'UAE Mortgage Brokerage Operating System for Betterway Mortgages LLC (Al Nasr Plaza, Oud Metha, Dubai) — 24-Bank Policy Matrix, 12-Step Pipeline, Warda & Shabib Executive Workspace, Full Excel Backups & Native Mobile App.',
  applicationName: 'Betterway Mortgages OS',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Betterway OS',
  },
  icons: {
    icon: [
      { url: '/brand/betterway-favicon.svg', type: 'image/svg+xml' },
      { url: '/brand/favicon-4k.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '1024x1024', type: 'image/png' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <OsProvider>{children}</OsProvider>
      </body>
    </html>
  );
}
