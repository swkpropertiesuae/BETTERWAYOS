import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource/ibm-plex-sans-arabic/400.css';
import '@fontsource/ibm-plex-sans-arabic/600.css';
import '@fontsource/ibm-plex-sans-arabic/700.css';
import './globals.css';
import { getActiveLang, getCurrentUser } from '@/server/auth/request';

export const metadata: Metadata = {
  title: 'Betterway Mortgages LLC — Corporate Operating System',
  description:
    'Betterway Mortgages LLC institutional operating system for client origination, credit underwriting, conveyancing, treasury, human capital, and regulatory compliance.',
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  maximumScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const lang = await getActiveLang(user);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={lang} dir={dir} className="bg-[#f8f9fa] text-[#021125]">
      <body className="min-h-[100dvh] bg-[#f8f9fa] text-[#021125] antialiased">{children}</body>
    </html>
  );
}
