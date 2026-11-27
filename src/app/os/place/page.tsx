'use client';

import React, { Suspense } from 'react';
import { OwnerSectionView } from '@/components/workspace/OwnerSectionView';

export default function OwnerPlacePage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-[var(--bw-muted)]">Opening Place...</div>}>
      <OwnerSectionView mode="place" />
    </Suspense>
  );
}
