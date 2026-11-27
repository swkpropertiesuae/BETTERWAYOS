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
    emerald: 'bg-[#e3fbf3] text-[#053b2e] border-[#9be8ce] dark:bg-[#0d2b24] dark:text-[#34f0bc] dark:border-[#1c5c4b]',
    gold: 'bg-[#fdf4dc] text-[#7a5409] border-[#ebd28b] dark:bg-[#2a210f] dark:text-[#fbe8a4] dark:border-[#634c1c]',
    navy: 'bg-[#0a0e14] text-[#34f0bc] border-[#22e2ad]/40 shadow-xs',
    red: 'bg-[#fff0f3] text-[#be123c] border-[#fecdd6] dark:bg-[#2d121a] dark:text-[#fda4af] dark:border-[#6b2135]',
    blue: 'bg-[#eef5ff] text-[#1d4ed8] border-[#c7dcff] dark:bg-[#102136] dark:text-[#93c5fd] dark:border-[#24436b]',
    slate: 'bg-[#f4f6f7] text-[#334155] border-[#dce2e8] dark:bg-[#161e29] dark:text-[#cbd5e1] dark:border-[#283546]',
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
      className={`${dims} rounded-full bg-[#090d13] text-[#34f0bc] border border-[#22e2ad]/50 font-bold flex items-center justify-center shrink-0`}
    >
      {initials}
    </div>
  );
}

/** 21st.dev Glossy Floating Shining Black Card with Live Mouse Spotlight + Betterway Logo Jewel Sheen */
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
      ? 'rgba(217, 179, 86, 0.22)'
      : accent === 'dual'
        ? 'rgba(34, 226, 173, 0.2)'
        : 'rgba(34, 226, 173, 0.22)';

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
        <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#119c78] dark:text-[#34f0bc]">
          <span className="size-1.5 rounded-full bg-[#22e2ad] shadow-[0_0_8px_#22e2ad]" />
          {eyebrow}
        </div>
        <h1 className="font-display text-2xl sm:text-[34px] font-extrabold tracking-[-0.03em] leading-[1.12] text-[var(--bw-ink)]">
          {title}{' '}
          {accent && (
            <span className="bg-gradient-to-r from-[#0b5442] via-[#119c78] to-[#b58a2d] dark:from-[#34f0bc] dark:to-[#fbe8a4] bg-clip-text text-transparent">
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
          <span className="size-2 rounded-full bg-[#22e2ad] shadow-[0_0_10px_#22e2ad]" />
        </div>
        <div className="font-display text-2xl sm:text-[30px] font-extrabold font-mono-num tracking-[-0.03em] leading-tight text-white">
          {value}
        </div>
        {hint && <div className="text-[11.5px] font-medium text-[#34f0bc]">{hint}</div>}
      </GlossyBlackCard>
    );
  }

  if (tone === 'emerald') {
    return (
      <GlossyBlackCard className="p-5 space-y-1.5" accent="emerald">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[11.5px] font-bold uppercase tracking-[0.06em] text-[#a7f3d0]">{label}</div>
          <span className="size-2 rounded-full bg-[#34f0bc] shadow-[0_0_10px_#34f0bc]" />
        </div>
        <div className="font-display text-2xl sm:text-[30px] font-extrabold font-mono-num tracking-[-0.03em] leading-tight text-[#34f0bc]">
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
          <div className="text-[11.5px] font-bold uppercase tracking-[0.06em] text-[#fbe8a4]">{label}</div>
          <span className="size-2 rounded-full bg-[#d9b356] shadow-[0_0_10px_#d9b356]" />
        </div>
        <div className="font-display text-2xl sm:text-[30px] font-extrabold font-mono-num tracking-[-0.03em] leading-tight text-[#fbe8a4]">
          {value}
        </div>
        {hint && <div className="text-[11.5px] text-[#cbd5e1]">{hint}</div>}
      </GlossyBlackCard>
    );
  }

  const cls =
    tone === 'red'
      ? 'bg-[#fff0f3] dark:bg-[#2d121a] text-[#be123c] dark:text-[#fda4af] border-[#fecdd6] dark:border-[#6b2135]'
      : 'bg-[var(--bw-card)] text-[var(--bw-ink)] border-[var(--bw-line)] hover:border-[#119c78]/50';

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
          <span className="inline-flex items-center gap-2 font-bold text-[#fbe8a4]">
            <Landmark size={15} className="text-[#22e2ad]" /> {label}
          </span>
          <div className="flex items-center gap-2">
            <img src="/brand/betterway-icon.svg" alt="" aria-hidden className="size-6 drop-shadow-[0_0_8px_rgba(34,226,173,0.45)]" />
            <WalletCards size={18} strokeWidth={1.6} className="text-[#d9b356]" />
          </div>
        </div>
        <div className="relative z-10 my-5">
          <div className="font-display text-3xl sm:text-[36px] font-extrabold tracking-[-0.035em] font-mono-num leading-none bg-gradient-to-r from-white via-[#e6fff7] to-[#fbe8a4] bg-clip-text text-transparent">
            {amount}
          </div>
          {subLabel && <div className="text-xs text-[#cbd5e1] mt-2 font-medium">{subLabel}</div>}
        </div>
        <div className="relative z-10 flex items-center justify-between gap-2 pt-3 border-t border-white/12 text-[11.5px] text-[#cbd5e1]">
          <span className="font-semibold">{footerLeft}</span>
          <Link
            href={footerHref}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 hover:bg-[#22e2ad] text-[#34f0bc] hover:text-[#070e1a] font-bold transition"
          >
            {footerLinkLabel} <ArrowUpRight size={13} />
          </Link>
        </div>
      </section>
    </div>
  );
}
