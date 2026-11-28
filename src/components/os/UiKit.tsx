'use client';

import React, { useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Landmark, WalletCards } from 'lucide-react';

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
    emerald: 'bg-[#eaf4f1] text-[#0a3f34] border-[#bddcd3] dark:bg-[#0e2d29] dark:text-[#64c4a8] dark:border-[#1c4b43]',
    gold: 'bg-[#faf6ed] text-[#7d5b1c] border-[#e0cca0] dark:bg-[#251f14] dark:text-[#dfc285] dark:border-[#5c4820]',
    navy: 'bg-[#0b192c] text-[#dfc285] border-[#c49a45]/40 shadow-xs',
    red: 'bg-[#fdf2f4] text-[#881b30] border-[#f2c6cf] dark:bg-[#2c141c] dark:text-[#f2a3b3] dark:border-[#632537]',
    blue: 'bg-[#eef3f9] text-[#1b3a63] border-[#c7d6ea] dark:bg-[#11243d] dark:text-[#93b8e8] dark:border-[#244269]',
    slate: 'bg-[#eef2f7] text-[#33465e] border-[#d3dce7] dark:bg-[#15243a] dark:text-[#cbd5e1] dark:border-[#273c59]',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap ${cls[tone] || cls.slate}`}>
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
        className={`${dims} rounded-full object-cover object-top border-2 border-[#d9b356]/70 shadow-sm shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${dims} rounded-full bg-[#0b192c] text-[#dfc285] border border-[#c49a45]/50 font-bold flex items-center justify-center shrink-0`}
    >
      {initials}
    </div>
  );
}

/** Sovereign Navy Glossy Executive Card with Subtle Specular Mouse Spotlight */
export function GlossyBlackCard({
  children,
  className = '',
  accent = 'emerald',
}: {
  children: React.ReactNode;
  className?: string;
  accent?: 'emerald' | 'gold' | 'dual';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hover, setHover] = useState(false);

  const glowColor =
    accent === 'gold'
      ? 'rgba(196, 154, 69, 0.18)'
      : accent === 'dual'
        ? 'rgba(196, 154, 69, 0.15)'
        : 'rgba(71, 168, 141, 0.16)';

  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`bw-glossy-black ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-[22px] transition-opacity duration-300"
        style={{
          opacity: hover ? 1 : 0,
          background: `radial-gradient(460px circle at ${pos.x}px ${pos.y}px, ${glowColor}, transparent 48%)`,
          zIndex: 1,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/** 21st.dev Interactive Shine Hover Button / Link */
export function ShineLink({
  href,
  children,
  variant = 'obsidian',
  className = '',
  showArrow = true,
}: {
  href: string;
  children: React.ReactNode;
  variant?: 'obsidian' | 'emerald' | 'gold' | 'outline';
  className?: string;
  showArrow?: boolean;
}) {
  const map = {
    obsidian: 'bw-btn bw-btn-obsidian',
    emerald: 'bw-btn bw-btn-primary',
    gold: 'bw-btn bw-btn-gold',
    outline: 'bw-btn bw-btn-outline',
  };
  return (
    <Link href={href} className={`group ${map[variant]} ${className}`}>
      <span>{children}</span>
      {showArrow && <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />}
    </Link>
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
        <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#0e5a49] dark:text-[#dfc285]">
          <span className="size-1.5 rounded-full bg-[#c49a45]" />
          {eyebrow}
        </div>
        <h1 className="font-display text-2xl sm:text-[34px] font-extrabold tracking-[-0.03em] leading-[1.12] text-[var(--bw-ink)]">
          {title}{' '}
          {accent && (
            <span className="text-[#0e5a49] dark:text-[#dfc285]">
              {accent}
            </span>
          )}
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
  if (tone === 'navy') {
    return (
      <GlossyBlackCard className="p-5 space-y-1.5" accent="dual">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[11.5px] font-bold uppercase tracking-[0.06em] text-[#cbd5e1]">{label}</div>
          <span className="size-2 rounded-full bg-[#c49a45]" />
        </div>
        <div className="font-display text-2xl sm:text-[30px] font-extrabold font-mono-num tracking-[-0.03em] leading-tight text-white">
          {value}
        </div>
        {hint && <div className="text-[11.5px] font-medium text-[#dfc285]">{hint}</div>}
      </GlossyBlackCard>
    );
  }

  if (tone === 'emerald') {
    return (
      <GlossyBlackCard className="p-5 space-y-1.5" accent="emerald">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[11.5px] font-bold uppercase tracking-[0.06em] text-[#b4ded2]">{label}</div>
          <span className="size-2 rounded-full bg-[#64c4a8]" />
        </div>
        <div className="font-display text-2xl sm:text-[30px] font-extrabold font-mono-num tracking-[-0.03em] leading-tight text-[#64c4a8]">
          {value}
        </div>
        {hint && <div className="text-[11.5px] text-[#cbd5e1]">{hint}</div>}
      </GlossyBlackCard>
    );
  }

  if (tone === 'gold') {
    return (
      <GlossyBlackCard className="p-5 space-y-1.5" accent="gold">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[11.5px] font-bold uppercase tracking-[0.06em] text-[#dfc285]">{label}</div>
          <span className="size-2 rounded-full bg-[#c49a45]" />
        </div>
        <div className="font-display text-2xl sm:text-[30px] font-extrabold font-mono-num tracking-[-0.03em] leading-tight text-[#dfc285]">
          {value}
        </div>
        {hint && <div className="text-[11.5px] text-[#cbd5e1]">{hint}</div>}
      </GlossyBlackCard>
    );
  }

  const cls =
    tone === 'red'
      ? 'bg-[#fdf2f4] dark:bg-[#2c141c] text-[#881b30] dark:text-[#f2a3b3] border-[#f2c6cf] dark:border-[#632537]'
      : 'bg-[var(--bw-card)] text-[var(--bw-ink)] border-[var(--bw-line)] hover:border-[#0e5a49]/50';

  return (
    <div className={`rounded-[20px] border p-5 space-y-1.5 shadow-[var(--bw-shadow-raised)] transition hover:-translate-y-0.5 ${cls}`}>
      <div className="text-[11.5px] font-bold uppercase tracking-[0.05em] text-[var(--bw-muted)]">{label}</div>
      <div className="font-display text-2xl sm:text-[30px] font-extrabold font-mono-num tracking-[-0.03em] leading-tight">
        {value}
      </div>
      {hint && <div className="text-[11.5px] text-[var(--bw-muted)]">{hint}</div>}
    </div>
  );
}

/** 21st.dev 3D-Tilt Shining Glossy Black Wallet Card with Betterway 4K Logo Jewel */
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
      style={{ '--rx': '0deg', '--ry': '0deg', perspective: '1100px' } as CSSProperties}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const b = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--rx', `${(-(e.clientY - b.top - b.height / 2) / b.height) * 7}deg`);
        e.currentTarget.style.setProperty('--ry', `${((e.clientX - b.left - b.width / 2) / b.width) * 7}deg`);
      }}
      onPointerLeave={() => {
        ref.current?.style.setProperty('--rx', '0deg');
        ref.current?.style.setProperty('--ry', '0deg');
      }}
    >
      <section className="bw-cash-card">
        <div className="relative z-10 flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-2 font-bold text-[#dfc285]">
            <Landmark size={15} className="text-[#64c4a8]" /> {label}
          </span>
          <div className="flex items-center gap-2">
            <img src="/brand/betterway-icon.svg" alt="" aria-hidden className="size-6 drop-shadow-[0_2px_8px_rgba(196,154,69,0.35)]" />
            <WalletCards size={18} strokeWidth={1.6} className="text-[#c49a45]" />
          </div>
        </div>
        <div className="relative z-10 my-5">
          <div className="font-display text-3xl sm:text-[36px] font-extrabold tracking-[-0.035em] font-mono-num leading-none bg-gradient-to-r from-white via-[#eef3f9] to-[#dfc285] bg-clip-text text-transparent">
            {amount}
          </div>
          {subLabel && <div className="text-xs text-[#cbd5e1] mt-2 font-medium">{subLabel}</div>}
        </div>
        <div className="relative z-10 flex items-center justify-between gap-2 pt-3 border-t border-white/12 text-[11.5px] text-[#cbd5e1]">
          <span className="font-semibold">{footerLeft}</span>
          <Link
            href={footerHref}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 hover:bg-[#c49a45] text-[#dfc285] hover:text-[#0b192c] font-bold transition"
          >
            {footerLinkLabel} <ArrowUpRight size={13} />
          </Link>
        </div>
      </section>
    </div>
  );
}
