'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { OwnerSectionView } from '@/components/workspace/OwnerSectionView';

const CORNER_TABS = new Set(['fasttrack', 'approvals', 'vat', 'bulkai', 'goldrush']);

function ExecutiveRouterInner() {
  const sp = useSearchParams();
  const sec = sp?.get('section');
  const tab = sp?.get('tab') || '';
  const mode: 'place' | 'corner' = sec === 'corner' || CORNER_TABS.has(tab) ? 'corner' : 'place';
  return <OwnerSectionView mode={mode} />;
}

export default function ExecutiveOwnerDeskPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-[var(--bw-muted)]">Opening Owner Desk...</div>}>
      <ExecutiveRouterInner />
    </Suspense>
  );
}
