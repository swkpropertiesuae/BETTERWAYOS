import React, { Suspense } from 'react';
import { OsShell } from '@/components/os/OsShell';

export default function OsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f3f5f8] dark:bg-[#070e1a]" />}>
      <OsShell>{children}</OsShell>
    </Suspense>
  );
}
