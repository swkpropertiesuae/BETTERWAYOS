'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function fmtAed(amount: number | string | null | undefined, compact = false): string {
  const n = Number(amount || 0);
  if (!Number.isFinite(n)) return 'AED 0';
  if (compact) {
    if (Math.abs(n) >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(2)}M`;
    if (Math.abs(n) >= 1_000) return `AED ${(n / 1_000).toFixed(0)}K`;
  }
  return `AED ${Math.round(n).toLocaleString('en-US')}`;
}

export function StatusPill({
  label,
  tone = 'emerald',
}: {
  label: string;
  tone?: 'emerald' | 'gold' | 'navy' | 'red' | 'blue' | 'slate';
}) {
  const cls: Record<string, string> = {
    emerald: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
    gold: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30',
    navy: 'bg-[#0A1128] text-[#FCF1B7] border-[#D4AF37]/40',
    red: 'bg-red-500/12 text-red-700 dark:text-red-300 border-red-500/25',
    blue: 'bg-sky-500/12 text-sky-700 dark:text-sky-300 border-sky-500/25',
    slate: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-400/25',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cls[tone] || cls.slate}`}>
      {label}
    </span>
  );
}

export function StaffAvatar({
  name,
  avatarUrl,
  initials,
  size = 'md',
}: {
  name: string;
  avatarUrl?: string | null;
  initials: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const dims = size === 'sm' ? 'size-8 text-xs' : size === 'lg' ? 'size-14 text-base' : 'size-10 text-xs';
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${dims} rounded-full object-cover object-top border border-[#D4AF37]/45 shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${dims} rounded-full bg-[#0A1128] text-[#FCF1B7] border border-[#D4AF37]/45 font-bold flex items-center justify-center shrink-0`}
    >
      {initials}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  accent,
  subtitle,
  backHref = '/os',
  actions,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  subtitle: string;
  backHref?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-[var(--bw-line)]">
      <div className="space-y-1.5 max-w-3xl">
        <div className="flex items-center gap-2">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[var(--bw-emerald)] hover:underline no-print"
          >
            <ArrowLeft size={12} /> OS Home
          </Link>
          <span className="text-[var(--bw-muted)]">·</span>
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--bw-muted)]">{eyebrow}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.03em] text-[var(--bw-ink)]">
          {title} {accent && <span className="text-[var(--bw-emerald)]">{accent}</span>}
        </h1>
        <p className="text-xs sm:text-sm text-[var(--bw-muted)] leading-relaxed">{subtitle}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 no-print">{actions}</div>}
    </div>
  );
}

export function MetricTile({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'default' | 'navy' | 'emerald' | 'gold' | 'red';
}) {
  const cls =
    tone === 'navy'
      ? 'bg-[#0A1128] text-white border-[#D4AF37]/40'
      : tone === 'emerald'
        ? 'bg-[#083B2E] text-white border-[#34DFAC]/30'
        : tone === 'gold'
          ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300/60'
          : tone === 'red'
            ? 'bg-red-50 dark:bg-red-950/30 border-red-300/60'
            : 'bg-[var(--bw-card)] border-[var(--bw-line)]';

  return (
    <div className={`rounded-2xl border p-4 space-y-1 ${cls}`}>
      <div className={`text-[10.5px] font-bold uppercase tracking-[0.14em] ${tone === 'navy' || tone === 'emerald' ? 'text-slate-300' : 'text-[var(--bw-muted)]'}`}>
        {label}
      </div>
      <div className="text-xl sm:text-2xl font-extrabold font-mono-num tracking-tight">{value}</div>
      {hint && (
        <div className={`text-[11px] ${tone === 'navy' || tone === 'emerald' ? 'text-slate-300' : 'text-[var(--bw-muted)]'}`}>
          {hint}
        </div>
      )}
    </div>
  );
}
