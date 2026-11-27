'use client';

import React, { useRef, type CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Landmark, WalletCards } from 'lucide-react';

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
    emerald: 'bg-[#dcf1e6] text-[#025e3d] border-[#b7e0cb] dark:bg-[#1e3a2d] dark:text-[#8fe3bd] dark:border-[#2e5845]',
    gold: 'bg-[#f6e9c3] text-[#7a5200] border-[#ead49a] dark:bg-[#3a311f] dark:text-[#fcf1b7] dark:border-[#5e4d2a]',
    navy: 'bg-[#025e3d] text-white border-[#025e3d]',
    red: 'bg-[#fbe1e4] text-[#9b1424] border-[#f2bcc3] dark:bg-[#3f2026] dark:text-[#ffb4be] dark:border-[#632f38]',
    blue: 'bg-[#dfecfa] text-[#1f4f85] border-[#bcd6f0] dark:bg-[#1e3247] dark:text-[#a8d0f8] dark:border-[#2f4d6b]',
    slate: 'bg-[#edf2ee] text-[#3f4f47] border-[#d5ddd6] dark:bg-[#24332a] dark:text-[#c4d0c7] dark:border-[#36493e]',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${cls[tone] || cls.slate}`}>
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
        className={`${dims} rounded-full object-cover object-top border-2 border-[#d4af37]/50 shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${dims} rounded-full bg-[#025e3d] text-[#fcf1b7] border border-[#d4af37]/45 font-bold flex items-center justify-center shrink-0`}
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
    <div className="flex flex-wrap items-end justify-between gap-4 pb-5 border-b border-[var(--bw-line)]">
      <div className="space-y-1.5 max-w-3xl">
        <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--bw-emerald)]">{eyebrow}</div>
        <h1 className="font-display text-2xl sm:text-[32px] font-bold tracking-[-0.03em] leading-[1.15] text-[var(--bw-ink)]">
          {title} {accent && <span className="text-[var(--bw-emerald)]">{accent}</span>}
        </h1>
        <p className="text-xs sm:text-[14px] text-[var(--bw-muted)] leading-relaxed">{subtitle}</p>
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
      ? 'bg-[#025e3d] text-white border-[#025e3d] shadow-[0_15px_28px_-19px_rgba(2,94,61,0.55)]'
      : tone === 'emerald'
        ? 'bg-[var(--bw-mint-soft)] text-[var(--bw-ink)] border-[var(--bw-line)]'
        : tone === 'gold'
          ? 'bg-[var(--bw-champagne-tint)] text-[var(--bw-ink)] border-[var(--bw-line)]'
          : tone === 'red'
            ? 'bg-[var(--bw-blush)] text-[#9b1424] dark:text-[#ffb4be] border-[#f2bcc3] dark:border-[#632f38]'
            : 'bg-[var(--bw-card)] text-[var(--bw-ink)] border-[var(--bw-line)]';

  const muted = tone === 'navy' ? 'text-[#d3eee0]' : 'text-[var(--bw-muted)]';

  return (
    <div className={`rounded-2xl border p-5 space-y-1.5 shadow-[var(--bw-shadow-raised)] transition ${cls}`}>
      <div className={`text-[11.5px] font-semibold tracking-[0.01em] ${muted}`}>{label}</div>
      <div className="font-display text-2xl sm:text-[28px] font-bold font-mono-num tracking-[-0.03em] leading-tight">
        {value}
      </div>
      {hint && <div className={`text-[11.5px] ${muted}`}>{hint}</div>}
    </div>
  );
}

/** Signature Calm Operating Wallet 3D-tilt Deep Emerald Account / Loan-Book Card */
export function WalletLoanCard({
  label,
  amount,
  subLabel,
  footerLeft,
  footerHref,
  footerLinkLabel,
}: {
  label: string;
  amount: string;
  subLabel?: string;
  footerLeft: string;
  footerHref: string;
  footerLinkLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      style={{ '--rx': '0deg', '--ry': '0deg', perspective: '1000px' } as CSSProperties}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const b = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--rx', `${(-(e.clientY - b.top - b.height / 2) / b.height) * 6}deg`);
        e.currentTarget.style.setProperty('--ry', `${((e.clientX - b.left - b.width / 2) / b.width) * 6}deg`);
      }}
      onPointerLeave={() => {
        ref.current?.style.setProperty('--rx', '0deg');
        ref.current?.style.setProperty('--ry', '0deg');
      }}
    >
      <section className="bw-cash-card">
        <div className="relative z-10 flex items-center justify-between text-xs text-[#d3eee0]">
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <Landmark size={15} /> {label}
          </span>
          <WalletCards size={20} strokeWidth={1.5} className="text-[#fcf1b7]" />
        </div>
        <div className="relative z-10 my-5">
          <div className="font-display text-3xl sm:text-[34px] font-bold tracking-[-0.03em] font-mono-num leading-none">
            {amount}
          </div>
          {subLabel && <div className="text-xs text-[#d3eee0] mt-2">{subLabel}</div>}
        </div>
        <div className="relative z-10 flex items-center justify-between gap-2 pt-3 border-t border-white/15 text-[11.5px] text-[#d3eee0]">
          <span>{footerLeft}</span>
          <Link href={footerHref} className="inline-flex items-center gap-1 text-white font-semibold hover:underline">
            {footerLinkLabel} <ArrowUpRight size={13} />
          </Link>
        </div>
      </section>
    </div>
  );
}
