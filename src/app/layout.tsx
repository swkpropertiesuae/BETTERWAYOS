import type { Metadata } from 'next';
import './globals.css';
import { OsProvider } from '@/components/os/OsProvider';

export const metadata: Metadata = {
  title: 'Betterway Mortgages OS v3 — Executive Operating System',
  description:
    'UAE Mortgage Brokerage Operating System for Betterway Mortgages LLC (Al Nasr Plaza, Oud Metha, Dubai) — 22-Registry CORE Master Log, 12-Step Pipeline, Warda Place / Shabib Corner & Live Website Studio.',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
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
