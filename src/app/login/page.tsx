'use client';

import React, { useState } from 'react';
import { Crown, Eye, EyeOff, LogIn, ShieldCheck, Sparkles } from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { GlossyBlackCard, StaffAvatar } from '@/components/os/UiKit';

export default function LoginPage() {
  const { demoMode, demoAccounts, switchDemoAccount, toast } = useOs();
  const isDemoBuild = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  const [email, setEmail] = useState(isDemoBuild ? 'warda@betterwaymortgages.com' : '');
  const [password, setPassword] = useState(isDemoBuild ? 'Betterway@2026' : '');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid credentials');
        toast(data.error || 'Invalid credentials', 'err');
      } else {
        window.location.href = '/os';
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bw-bg)] p-4 sm:p-6 lg:p-8 grid lg:grid-cols-[1.1fr_1fr] gap-6 lg:gap-8">
      {/* Left 21st.dev Glossy Floating Shining Black Showcase Panel */}
      <GlossyBlackCard className="hidden lg:flex flex-col justify-between p-10 xl:p-12" accent="dual">
        <div className="space-y-6">
          <img
            src="/brand/betterway-logo-horizontal-dark-4k-transparent.png"
            alt="Betterway Mortgages LLC"
            className="h-11 w-auto object-contain"
          />
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/8 border border-[#22e2ad]/35 text-[#34f0bc] text-[11px] font-extrabold uppercase tracking-[0.15em]">
            <ShieldCheck size={14} className="text-[#d9b356]" /> Betterway Mortgages LLC · Dubai OS v3
          </div>
          <h1 className="font-display text-white text-4xl xl:text-[44px] font-extrabold leading-[1.08] tracking-[-0.035em] max-w-lg">
            One fast desk for every{' '}
            <span className="bg-gradient-to-r from-[#34f0bc] via-[#9cf7dd] to-[#fbe8a4] bg-clip-text text-transparent">
              UAE mortgage.
            </span>
          </h1>
          <p className="text-[15px] text-slate-300 max-w-lg leading-relaxed">
            Compare 18+ UAE banks live, reach 140+ direct bank RMs, generate 3-bank client proposals in seconds, track all 12 stages to DLD Trustee disbursal, and keep full Excel daily backups.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2 text-[13px] text-slate-200 max-w-lg">
            {[
              '18-Bank Policy & 2026 Rates',
              '140+ Direct Bank RM Contacts',
              '3-Bank Auto-Eco Proposal Maker',
              'GPS Field Meetings & QR Check-In',
              '17-Sheet Full Excel & Daily Backup',
              'Native Android & iOS Mobile Ready',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-[#22e2ad] shadow-[0_0_8px_#22e2ad] shrink-0" />
                <span className="font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Equal Co-Owners Leadership Strip */}
        <div className="space-y-4 pt-8">
          <div className="grid sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/12 hover:border-[#22e2ad]/45 transition flex items-center gap-3.5">
              <img
                src="/staff/warda-kapadia.jpg"
                alt="Warda Kapadia"
                className="size-14 rounded-2xl object-cover object-top border-2 border-[#d9b356]/70 shrink-0"
              />
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-[#fbe8a4]">
                  <Crown size={11} /> Warda&apos;s Place
                </div>
                <div className="font-display font-extrabold text-sm text-white truncate">Warda Kapadia</div>
                <div className="text-[11.5px] text-[#34f0bc] truncate">Owner, Founder &amp; MD</div>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/12 hover:border-[#22e2ad]/45 transition flex items-center gap-3.5">
              <img
                src="/staff/shabib-siraj.jpg"
                alt="Shabib Siraj"
                className="size-14 rounded-2xl object-cover object-top border-2 border-[#d9b356]/70 shrink-0"
              />
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-[#fbe8a4]">
                  <Crown size={11} /> Shabib&apos;s Corner
                </div>
                <div className="font-display font-extrabold text-sm text-white truncate">Shabib Siraj</div>
                <div className="text-[11.5px] text-[#34f0bc] truncate">Executive Director</div>
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-400">
            © {new Date().getFullYear()} Betterway Mortgages LLC · Al Nasr Plaza, Oud Metha, Dubai, UAE
          </div>
        </div>
      </GlossyBlackCard>

      {/* Right Premium Pure White Sign-In Card */}
      <section className="flex items-center justify-center">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-[465px] rounded-[24px] bg-[var(--bw-card)] p-7 sm:p-10 shadow-[var(--bw-shadow-floating)] border border-[var(--bw-line)] space-y-5"
          aria-labelledby="bw-signin-heading"
        >
          <div className="space-y-3">
            <img
              src="/brand/betterway-logo-horizontal-light-4k-transparent.png"
              alt="Betterway Mortgages"
              className="h-9 w-auto lg:hidden object-contain"
            />
            <div className="hidden lg:inline-flex items-center gap-2.5">
              <img src="/brand/betterway-icon.svg" alt="" aria-hidden className="size-11" />
              <span className="px-2.5 py-1 rounded-full bg-[#0a0e14] text-[#34f0bc] text-[10px] font-extrabold uppercase tracking-[0.14em] inline-flex items-center gap-1">
                <Sparkles size={11} className="text-[#fbe8a4]" /> Fast Zero-Wait OS
              </span>
            </div>
            <div>
              <h2 id="bw-signin-heading" className="font-display text-[30px] font-extrabold tracking-[-0.035em] text-[var(--bw-ink)]">
                Sign in
              </h2>
              <p className="text-xs sm:text-[13.5px] text-[var(--bw-muted)] mt-1">
                Welcome back to Betterway Mortgages OS · CBUAE &amp; UAE PDPL protected.
              </p>
            </div>
          </div>

          {error && (
            <div role="alert" className="px-3.5 py-2.5 rounded-xl bg-[#fff0f3] border border-[#fecdd6] text-[#be123c] text-xs font-bold">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="bw-email" className="block text-xs font-bold text-[var(--bw-body)] mb-1.5">
                Work Email
              </label>
              <input
                id="bw-email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@betterwaymortgages.com"
                className="w-full min-h-[46px] px-4 rounded-xl bg-[var(--bw-soft)] border border-[var(--bw-line-strong)] text-sm text-[var(--bw-ink)] outline-none focus:border-[#119c78] focus:shadow-[var(--bw-focus-ring)]"
              />
            </div>

            <div>
              <label htmlFor="bw-password" className="block text-xs font-bold text-[var(--bw-body)] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="bw-password"
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full min-h-[46px] ps-4 pe-11 rounded-xl bg-[var(--bw-soft)] border border-[var(--bw-line-strong)] text-sm text-[var(--bw-ink)] outline-none focus:border-[#119c78] focus:shadow-[var(--bw-focus-ring)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="absolute end-1.5 top-1/2 -translate-y-1/2 size-8 rounded-full hover:bg-black/5 text-[var(--bw-muted)] flex items-center justify-center cursor-pointer"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="bw-btn bw-btn-obsidian w-full min-h-[48px] text-[14.5px] font-extrabold"
            >
              <LogIn size={16} className="text-[#34f0bc]" /> {busy ? 'Opening OS…' : 'Open Betterway OS'}
            </button>
          </div>

          {demoMode && demoAccounts.length > 0 && (
            <div className="pt-5 border-t border-[var(--bw-line)] space-y-2.5">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#119c78]">
                1-Click Staff Access (Local Mode)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pe-1">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => void switchDemoAccount(acc.email)}
                    className="p-2.5 rounded-xl bg-[var(--bw-soft)] hover:bg-[#0a0e14] hover:text-white border border-[var(--bw-line)] hover:border-[#22e2ad]/60 flex items-center gap-2.5 text-start transition cursor-pointer group"
                  >
                    <StaffAvatar name={acc.name} avatarUrl={acc.avatarUrl} initials={acc.initials} size="sm" />
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold truncate">{acc.name}</div>
                      <div className="text-[10px] text-[var(--bw-muted)] group-hover:text-[#34f0bc] truncate">{acc.designation}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-[11.5px] text-[var(--bw-muted)] leading-relaxed pt-1">
            Restricted to authorized Betterway Mortgages staff. Encrypted session with full UAE CBUAE &amp; PDPL audit log.
          </p>
        </form>
      </section>
    </div>
  );
}
