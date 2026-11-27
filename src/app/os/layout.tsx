import React, { Suspense } from 'react';
import { OsShell } from '@/components/os/OsShell';

export default function OsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fbf6e6] dark:bg-[#05070a]" />}>
      <OsShell>{children}</OsShell>
    </Suspense>
  );
}
