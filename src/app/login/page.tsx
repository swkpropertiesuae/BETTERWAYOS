'use client';

import React, { useState } from 'react';
import { Crown, Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { StaffAvatar } from '@/components/os/UiKit';

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
    <div className="min-h-screen bg-[var(--bw-bg)] p-4 sm:p-6 lg:p-8 grid lg:grid-cols-[1.08fr_1fr] gap-6 lg:gap-8">
      {/* Left Brand Emerald Sanctuary Panel (Calm Operating Wallet Sign-In) */}
      <section
        className="hidden lg:flex flex-col justify-between rounded-2xl text-white p-10 xl:p-12 relative overflow-hidden shadow-[var(--bw-shadow-cash)]"
        style={{ background: 'linear-gradient(158deg, #025e3d 0%, #007b52 56%, #0b6e4c 100%)' }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 82% 18%, rgba(252,241,183,0.45) 0%, transparent 45%), radial-gradient(circle at 14% 85%, rgba(52,223,172,0.35) 0%, transparent 48%)',
          }}
        />

        <div className="relative space-y-6">
          <img src="/brand/logo-horizontal-dark.svg" alt="Betterway Mortgages LLC" className="h-10 w-auto" />
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/12 border border-white/20 text-[#fcf1b7] text-[11px] font-bold uppercase tracking-[0.16em]">
            <ShieldCheck size={14} /> Betterway Mortgages LLC · Dubai Operating System v3
          </div>
          <h1 className="font-display text-white text-4xl xl:text-[42px] font-extrabold leading-[1.08] tracking-[-0.03em] max-w-lg">
            One calm workspace for every UAE mortgage.
          </h1>
          <p className="text-[15px] text-[#d3eee0] max-w-lg leading-relaxed">
            Compare 24 UAE Conventional &amp; Islamic banks, run 12-step CBUAE origination to DLD Trustee disbursal, manage encrypted borrower vaults, and sync live with betterwaymortgages.com.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2 text-[13px] text-white/95 max-w-lg">
            {[
              '24 UAE partner banks & EIBOR',
              '12-step CBUAE mortgage pipeline',
              'Encrypted borrower document vault',
              'GPS mortgage field meetings & QR',
              'Fillable Word/JPEG CBUAE forms',
              'Advisor DSA & UAE 5% VAT ledger',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-[#fcf1b7] shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Equal Co-Owners Leadership Strip */}
        <div className="relative space-y-4 pt-8">
          <div className="grid sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/18 flex items-center gap-3.5">
              <img
                src="/staff/warda-kapadia.jpg"
                alt="Warda Kapadia"
                className="size-14 rounded-2xl object-cover object-top border-2 border-[#fcf1b7]/60 shrink-0"
              />
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#fcf1b7]">
                  <Crown size={11} /> Warda&apos;s Place
                </div>
                <div className="font-display font-bold text-sm truncate">Warda Kapadia</div>
                <div className="text-[11.5px] text-[#d3eee0] truncate">Owner, Founder &amp; MD</div>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/18 flex items-center gap-3.5">
              <img
                src="/staff/shabib-siraj.jpg"
                alt="Shabib Siraj"
                className="size-14 rounded-2xl object-cover object-top border-2 border-[#fcf1b7]/60 shrink-0"
              />
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#fcf1b7]">
                  <Crown size={11} /> Shabib&apos;s Corner
                </div>
                <div className="font-display font-bold text-sm truncate">Shabib Siraj</div>
                <div className="text-[11.5px] text-[#d3eee0] truncate">Executive Director</div>
              </div>
            </div>
          </div>
          <div className="text-xs text-[#d3eee0]/80">
            © {new Date().getFullYear()} Betterway Mortgages LLC · Al Nasr Plaza, Oud Metha, Dubai, UAE
          </div>
        </div>
      </section>

      {/* Right Floating White Sign-In Card */}
      <section className="flex items-center justify-center">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-[460px] rounded-2xl bg-[var(--bw-card)] p-7 sm:p-10 shadow-[var(--bw-shadow-floating)] border border-[var(--bw-line)] space-y-5"
          aria-labelledby="bw-signin-heading"
        >
          <div className="space-y-3">
            <img src="/brand/logo-horizontal-light.svg" alt="Betterway Mortgages" className="h-9 w-auto lg:hidden" />
            <img src="/brand/icon-fullcolor.svg" alt="" aria-hidden className="size-11 hidden lg:block" />
            <div>
              <h2 id="bw-signin-heading" className="font-display text-[28px] font-extrabold tracking-[-0.03em] text-[var(--bw-ink)]">
                Sign in
              </h2>
              <p className="text-xs sm:text-[13.5px] text-[var(--bw-muted)] mt-1">
                Welcome back to Betterway Mortgages OS · CBUAE &amp; UAE PDPL compliant.
              </p>
            </div>
          </div>

          {error && (
            <div role="alert" className="px-3.5 py-2.5 rounded-xl bg-[#fbe1e4] border border-[#f2bcc3] text-[#8f1325] text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="bw-email" className="block text-xs font-semibold text-[var(--bw-muted)] mb-1.5">
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
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[var(--bw-bg)] border border-[var(--bw-line-strong)] text-sm text-[var(--bw-ink)] outline-none focus:border-[var(--bw-emerald)] focus:shadow-[var(--bw-focus-ring)]"
              />
            </div>

            <div>
              <label htmlFor="bw-password" className="block text-xs font-semibold text-[var(--bw-muted)] mb-1.5">
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
                  className="w-full min-h-[44px] ps-3.5 pe-11 rounded-xl bg-[var(--bw-bg)] border border-[var(--bw-line-strong)] text-sm text-[var(--bw-ink)] outline-none focus:border-[var(--bw-emerald)] focus:shadow-[var(--bw-focus-ring)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="absolute end-1.5 top-1/2 -translate-y-1/2 size-8 rounded-full hover:bg-[var(--bw-soft)] text-[var(--bw-muted)] flex items-center justify-center cursor-pointer"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="bw-btn bw-btn-primary w-full min-h-[46px] text-[14.5px] font-bold"
            >
              <LogIn size={16} /> {busy ? 'Signing in…' : 'Enter Operating System'}
            </button>
          </div>

          {demoMode && demoAccounts.length > 0 && (
            <div className="pt-5 border-t border-[var(--bw-line)] space-y-2.5">
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--bw-emerald)]">
                Quick Workspace Access (Local Mode)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pe-1">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => void switchDemoAccount(acc.email)}
                    className="p-2.5 rounded-xl bg-[var(--bw-soft)] hover:bg-[var(--bw-mint)] border border-[var(--bw-line)] flex items-center gap-2.5 text-start transition cursor-pointer"
                  >
                    <StaffAvatar name={acc.name} avatarUrl={acc.avatarUrl} initials={acc.initials} size="sm" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[var(--bw-ink)] truncate">{acc.name}</div>
                      <div className="text-[10px] text-[var(--bw-muted)] truncate">{acc.designation}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-[11.5px] text-[var(--bw-muted)] leading-relaxed pt-1">
            Access is restricted to authorised Betterway Mortgages staff. Encrypted HTTP-only session with full CBUAE &amp; PDPL audit logging.
          </p>
        </form>
      </section>
    </div>
  );
}
