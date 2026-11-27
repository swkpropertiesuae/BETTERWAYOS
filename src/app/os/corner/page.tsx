'use client';

import React, { Suspense } from 'react';
import { OwnerSectionView } from '@/components/workspace/OwnerSectionView';

export default function OwnerCornerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-[var(--bw-muted)]">Opening Corner...</div>}>
      <OwnerSectionView mode="corner" />
    </Suspense>
  );
}
