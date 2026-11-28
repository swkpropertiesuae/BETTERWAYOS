'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Building2,
  Calculator,
  CheckCircle2,
  Crown,
  Eye,
  EyeOff,
  Landmark,
  LogIn,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  UserPlus,
} from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { fmtAed, GlossyBlackCard, StaffAvatar } from '@/components/os/UiKit';
import { EIBOR_SNAPSHOT } from '@/lib/domain/banks';

const LIVE_DUBAI_TICKER = [
  { label: '3M CBUAE EIBOR', value: `${EIBOR_SNAPSHOT.latest.threeMonth.toFixed(3)}%`, tag: 'LIVE' },
  { label: 'CBUAE BASE RATE', value: '3.90%', tag: 'BENCHMARK' },
  { label: 'RAKBANK ELITE 2Y', value: '3.89%', tag: 'FIXED' },
  { label: 'ENBD STL 2Y', value: '3.89%', tag: 'FIXED' },
  { label: 'SCB & HSBC 2Y', value: '3.90%', tag: 'FIXED' },
  { label: 'DIB ISLAMIC 3Y', value: '3.95%', tag: 'SHARIA' },
  { label: 'ADIB ISLAMIC 3Y', value: '3.99%', tag: 'ZERO PF' },
  { label: 'CBD GREEN 3Y', value: '3.99%', tag: 'FIXED' },
  { label: 'FAB STL 3Y', value: '3.99%', tag: 'FIXED' },
  { label: 'MASHREQ 2Y', value: '3.99%', tag: 'FAST-PASS' },
  { label: 'DUBAI MAX LTV', value: '80% EXPAT · 85% UAE', tag: 'CBUAE' },
];

const DUBAI_PRESETS = [
  { label: 'JVC · 1.4M', price: 1_400_000 },
  { label: 'Dubai Hills · 3.5M', price: 3_500_000 },
  { label: 'Palm · 7.5M', price: 7_500_000 },
];

export default function LoginPage() {
  const { demoMode, demoAccounts, switchDemoAccount, toast } = useOs();
  const isDemoBuild = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState(isDemoBuild ? 'warda@betterwaymortgages.com' : '');
  const [password, setPassword] = useState(isDemoBuild ? 'Betterway@2026' : '');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Sign-Up / Access Request form state
  const [reqName, setReqName] = useState('');
  const [reqEmail, setReqEmail] = useState('');
  const [reqPhone, setReqPhone] = useState('+971 50 ');
  const [reqRole, setReqRole] = useState('Mortgage Advisor');
  const [reqDone, setReqDone] = useState(false);

  // Live Dubai GST ticking clock (hydration-safe)
  const [dubaiClock, setDubaiClock] = useState('Dubai Live GST');
  useEffect(() => {
    const tick = () => {
      const s = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Dubai',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      })
        .format(new Date())
        .toUpperCase();
      setDubaiClock(`Dubai ${s} GST`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Live Interactive Dubai Mortgage EMI Widget
  const [propPrice, setPropPrice] = useState(3_500_000);
  const [residency, setResidency] = useState<'expat' | 'national' | 'nonres'>('expat');
  const bestRate = residency === 'nonres' ? 4.99 : 3.89;

  const liveCalc = useMemo(() => {
    const ltv =
      residency === 'national'
        ? propPrice > 5_000_000
          ? 0.75
          : 0.85
        : residency === 'nonres'
          ? 0.6
          : propPrice > 5_000_000
            ? 0.7
            : 0.8;
    const loan = Math.round(propPrice * ltv);
    const downPayment = propPrice - loan;
    const dldFee = Math.round(propPrice * 0.04 + 580);
    const monthlyRate = bestRate / 100 / 12;
    const months = 25 * 12;
    const emi = Math.round((loan * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1));
    return { ltvPct: Math.round(ltv * 100), loan, downPayment, dldFee, emi };
  }, [propPrice, residency, bestRate]);

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

  const onRequestAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqName.trim() || !reqEmail.trim()) return;
    setReqDone(true);
    toast(`Access request sent to Warda & Shabib for ${reqName}!`);
  };

  return (
    <div className="min-h-screen bg-[var(--bw-bg)] flex flex-col">
      {/* Live Scrolling Dubai UAE Mortgage Rate Ribbon */}
      <div className="w-full bg-[#070b11] border-b border-[#22e2ad]/25 text-white overflow-hidden py-2">
        <div className="bw-ticker-track items-center gap-6 px-4">
          {[...LIVE_DUBAI_TICKER, ...LIVE_DUBAI_TICKER].map((item, i) => (
            <div key={`${item.label}-${i}`} className="inline-flex items-center gap-2 text-[11px] whitespace-nowrap">
              <span className="size-1.5 rounded-full bg-[#22e2ad] shadow-[0_0_8px_#22e2ad]" />
              <span className="font-bold text-slate-300">{item.label}</span>
              <span className="font-mono-num font-extrabold text-[#34f0bc]">{item.value}</span>
              <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-extrabold text-[#fbe8a4] tracking-wider">
                {item.tag}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-6 lg:p-8 grid lg:grid-cols-[1.18fr_1fr] gap-6 lg:gap-8 max-w-[1440px] w-full mx-auto items-stretch">
        {/* Left Lively Glossy Floating Shining Black Dubai Mortgage Showcase */}
        <GlossyBlackCard className="hidden lg:flex flex-col justify-between p-8 xl:p-10 relative" accent="dual">
          {/* Subtle Glowing Dubai Skyline Silhouette (Burj Khalifa + Creek + Downtown) */}
          <svg
            aria-hidden="true"
            viewBox="0 0 800 180"
            className="pointer-events-none absolute bottom-0 inset-x-0 w-full h-44 opacity-[0.14]"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="dxb-sky" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22E2AD" />
                <stop offset="50%" stopColor="#FBE8A4" />
                <stop offset="100%" stopColor="#22E2AD" />
              </linearGradient>
            </defs>
            <path
              d="M0 180 L0 140 L35 140 L35 110 L55 110 L55 140 L85 140 L85 95 L110 95 L110 140 L145 140 L145 78 L168 78 L168 140 L210 140 L210 112 L245 112 L245 140 L290 140 L290 88 L308 88 L308 140 L352 140 L362 95 L370 52 L374 10 L378 52 L386 95 L396 140 L438 140 L438 92 L462 76 L486 92 L486 140 L535 140 L535 104 L575 104 L575 140 L618 140 L626 84 L646 84 L654 140 L705 140 L705 114 L748 114 L748 140 L800 140 L800 180 Z"
              fill="url(#dxb-sky)"
            />
          </svg>

          <div className="space-y-5 relative z-10">
            <div className="flex items-center justify-between gap-3">
              <img
                src="/brand/betterway-logo-horizontal-dark-transparent.svg"
                alt="Betterway Mortgages LLC"
                className="h-10 w-auto object-contain"
              />
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/8 border border-[#22e2ad]/40 text-[11px] font-mono-num font-bold text-[#34f0bc]">
                <span className="size-2 rounded-full bg-[#22e2ad] animate-pulse" />
                {dubaiClock}
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#22e2ad]/12 border border-[#22e2ad]/35 text-[#fbe8a4] text-[10.5px] font-extrabold uppercase tracking-[0.14em]">
                <Activity size={13} className="text-[#34f0bc]" /> Live Dubai Mortgage Desk · 18 UAE Banks · 159 Direct RMs
              </div>
              <h1 className="font-display text-white text-3xl xl:text-[40px] font-extrabold leading-[1.08] tracking-[-0.035em]">
                Dubai&apos;s live mortgage pulse,{' '}
                <span className="bg-gradient-to-r from-[#34f0bc] via-[#a7f3d0] to-[#fbe8a4] bg-clip-text text-transparent">
                  updated every second.
                </span>
              </h1>
            </div>

            {/* LIVE INTERACTIVE DUBAI MORTGAGE ESTIMATOR RIGHT AT SIGN-IN */}
            <div className="rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/15 p-5 space-y-4 shadow-xl bw-float-slow">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-extrabold text-white">
                  <Calculator size={15} className="text-[#34f0bc]" /> Live Dubai Mortgage EMI Pulse (2026 Rates)
                </div>
                <div className="flex gap-1.5">
                  {DUBAI_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setPropPrice(p.price)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition ${
                        propPrice === p.price
                          ? 'bg-[#22e2ad] text-[#070e1a]'
                          : 'bg-white/10 text-slate-200 hover:bg-white/20'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Building2 size={13} className="text-[#fbe8a4]" /> Dubai Property Value
                  </span>
                  <span className="font-mono-num font-extrabold text-base text-[#fbe8a4]">{fmtAed(propPrice)}</span>
                </div>
                <input
                  type="range"
                  min={800_000}
                  max={15_000_000}
                  step={100_000}
                  value={propPrice}
                  onChange={(e) => setPropPrice(Number(e.target.value))}
                  aria-label="Dubai Property Value"
                  className="w-full accent-[#22e2ad] cursor-pointer"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { id: 'expat', label: 'UAE Expat (80% LTV)' },
                    { id: 'national', label: 'UAE National (85% LTV)' },
                    { id: 'nonres', label: 'Non-Resident (60% LTV)' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setResidency(r.id as any)}
                      className={`px-3 py-1 rounded-full text-[10.5px] font-bold cursor-pointer transition ${
                        residency === r.id
                          ? 'bg-[#fbe8a4] text-[#070e1a]'
                          : 'bg-white/8 text-slate-300 hover:bg-white/16 border border-white/10'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 pt-2 border-t border-white/12">
                <div className="p-2.5 rounded-xl bg-black/40 border border-[#22e2ad]/30">
                  <div className="text-[9.5px] uppercase font-bold text-slate-400">Est. Monthly EMI</div>
                  <div className="font-mono-num text-base font-extrabold text-[#34f0bc] mt-0.5">{fmtAed(liveCalc.emi)}</div>
                  <div className="text-[9.5px] text-slate-400">@ {bestRate}% · 25 yrs</div>
                </div>
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
                  <div className="text-[9.5px] uppercase font-bold text-slate-400">Max Loan ({liveCalc.ltvPct}%)</div>
                  <div className="font-mono-num text-base font-extrabold text-white mt-0.5">{fmtAed(liveCalc.loan, true)}</div>
                  <div className="text-[9.5px] text-slate-400">CBUAE cap</div>
                </div>
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
                  <div className="text-[9.5px] uppercase font-bold text-slate-400">Down Payment</div>
                  <div className="font-mono-num text-base font-extrabold text-[#fbe8a4] mt-0.5">{fmtAed(liveCalc.downPayment, true)}</div>
                  <div className="text-[9.5px] text-slate-400">{100 - liveCalc.ltvPct}% equity</div>
                </div>
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
                  <div className="text-[9.5px] uppercase font-bold text-slate-400">4% DLD + Trustee</div>
                  <div className="font-mono-num text-base font-extrabold text-white mt-0.5">{fmtAed(liveCalc.dldFee, true)}</div>
                  <div className="text-[9.5px] text-[#34f0bc]">AED 0 Broker Fee</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Leadership & Live CBUAE Highlights */}
          <div className="space-y-3.5 pt-5 relative z-10">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/12 hover:border-[#22e2ad]/45 transition flex items-center gap-3">
                <img
                  src="/staff/warda-kapadia.jpg"
                  alt="Warda Kapadia"
                  className="size-12 rounded-xl object-cover object-top border-2 border-[#d9b356]/70 shrink-0"
                />
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1 text-[9.5px] font-extrabold uppercase tracking-wider text-[#fbe8a4]">
                    <Crown size={10} /> Warda&apos;s Place &amp; Corner
                  </div>
                  <div className="font-display font-extrabold text-sm text-white truncate">Warda Kapadia</div>
                  <div className="text-[11px] text-[#34f0bc] truncate">Owner, Founder &amp; MD</div>
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/12 hover:border-[#22e2ad]/45 transition flex items-center gap-3">
                <img
                  src="/staff/shabib-siraj.jpg"
                  alt="Shabib Siraj"
                  className="size-12 rounded-xl object-cover object-top border-2 border-[#d9b356]/70 shrink-0"
                />
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1 text-[9.5px] font-extrabold uppercase tracking-wider text-[#fbe8a4]">
                    <Crown size={10} /> Shabib&apos;s Place &amp; Corner
                  </div>
                  <div className="font-display font-extrabold text-sm text-white truncate">Shabib Siraj</div>
                  <div className="text-[11px] text-[#34f0bc] truncate">Executive Director</div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>© {new Date().getFullYear()} Betterway Mortgages LLC · Al Nasr Plaza, Oud Metha, Dubai</span>
              <span className="inline-flex items-center gap-1 text-[#34f0bc] font-bold">
                <TrendingDown size={12} /> 3M EIBOR {EIBOR_SNAPSHOT.latest.threeMonth.toFixed(3)}%
              </span>
            </div>
          </div>
        </GlossyBlackCard>

        {/* Right Crisp White Sign-In & Sign-Up / Access Request Card */}
        <section className="flex items-center justify-center">
          <div className="w-full max-w-[475px] rounded-[24px] bg-white dark:bg-[#0d1219] p-7 sm:p-9 shadow-[var(--bw-shadow-floating)] border border-[var(--bw-line)] space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <img
                  src="/brand/betterway-logo-horizontal-light-transparent.svg"
                  alt="Betterway Mortgages"
                  className="h-9 w-auto object-contain"
                />
                <span className="px-2.5 py-1 rounded-full bg-[#0a0e14] text-[#34f0bc] text-[10px] font-extrabold uppercase tracking-[0.12em] inline-flex items-center gap-1">
                  <Sparkles size={11} className="text-[#fbe8a4]" /> OS v3 Live
                </span>
              </div>

              {/* Mobile Compact Live Dubai Rate Strip */}
              <div className="lg:hidden p-3 rounded-xl bg-[#090d13] text-white flex items-center justify-between text-[11px]">
                <span className="inline-flex items-center gap-1.5 font-bold text-[#34f0bc]">
                  <Landmark size={13} /> Best 2026: 3.89%
                </span>
                <span className="font-mono-num text-[#fbe8a4]">3M EIBOR {EIBOR_SNAPSHOT.latest.threeMonth.toFixed(3)}%</span>
              </div>

              {/* Sign In / Sign Up Switcher */}
              <div className="grid grid-cols-2 p-1 rounded-full bg-[var(--bw-soft)] border border-[var(--bw-line)]">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('signin');
                    setReqDone(false);
                  }}
                  className={`py-2 rounded-full text-xs font-extrabold cursor-pointer transition ${
                    authTab === 'signin' ? 'bg-[#090d13] text-[#34f0bc] shadow-sm' : 'text-[var(--bw-muted)] hover:text-[var(--bw-ink)]'
                  }`}
                >
                  Staff Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthTab('signup')}
                  className={`py-2 rounded-full text-xs font-extrabold cursor-pointer transition ${
                    authTab === 'signup' ? 'bg-[#090d13] text-[#fbe8a4] shadow-sm' : 'text-[var(--bw-muted)] hover:text-[var(--bw-ink)]'
                  }`}
                >
                  Sign Up / Request Seat
                </button>
              </div>
            </div>

            {authTab === 'signin' ? (
              <form onSubmit={onSubmit} className="space-y-4" aria-labelledby="bw-signin-heading">
                <div>
                  <h2 id="bw-signin-heading" className="font-display text-2xl font-extrabold tracking-[-0.03em] text-[var(--bw-ink)]">
                    Sign in to Betterway OS
                  </h2>
                  <p className="text-xs text-[var(--bw-muted)] mt-0.5">
                    Connected live to 18 UAE banks, 159 direct RMs &amp; CBUAE PDPL-protected vaults.
                  </p>
                </div>

                {error && (
                  <div role="alert" className="px-3.5 py-2.5 rounded-xl bg-[#fff0f3] border border-[#fecdd6] text-[#be123c] text-xs font-bold">
                    {error}
                  </div>
                )}

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
                    className="w-full min-h-[44px] px-4 rounded-xl bg-[var(--bw-soft)] border border-[var(--bw-line-strong)] text-sm text-[var(--bw-ink)] outline-none focus:border-[#119c78] focus:shadow-[var(--bw-focus-ring)]"
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
                      className="w-full min-h-[44px] ps-4 pe-11 rounded-xl bg-[var(--bw-soft)] border border-[var(--bw-line-strong)] text-sm text-[var(--bw-ink)] outline-none focus:border-[#119c78] focus:shadow-[var(--bw-focus-ring)]"
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

                <button type="submit" disabled={busy} className="bw-btn bw-btn-obsidian w-full min-h-[46px] text-[14px] font-extrabold">
                  <LogIn size={16} className="text-[#34f0bc]" /> {busy ? 'Opening OS…' : 'Open Betterway OS'}
                </button>
              </form>
            ) : (
              <form onSubmit={onRequestAccess} className="space-y-3.5">
                <div>
                  <h2 className="font-display text-2xl font-extrabold tracking-[-0.03em] text-[var(--bw-ink)]">
                    Request Advisor / Partner Seat
                  </h2>
                  <p className="text-xs text-[var(--bw-muted)] mt-0.5">
                    New Betterway staff &amp; RERA mortgage partners require 1-of-2 Owner approval from Warda or Shabib.
                  </p>
                </div>

                {reqDone ? (
                  <div className="p-4 rounded-2xl bg-[#e3fbf3] border border-[#9be8ce] text-[#053b2e] text-xs space-y-1.5">
                    <div className="font-extrabold flex items-center gap-1.5">
                      <CheckCircle2 size={15} /> Onboarding Request Logged!
                    </div>
                    <p>
                      Your seat request for <strong>{reqName}</strong> ({reqRole}) has been queued for Warda Kapadia &amp; Shabib Siraj in Owner Approvals.
                    </p>
                  </div>
                ) : (
                  <>
                    <input
                      required
                      value={reqName}
                      onChange={(e) => setReqName(e.target.value)}
                      placeholder="Full Name *"
                      className="w-full min-h-[42px] px-3.5 rounded-xl bg-[var(--bw-soft)] border border-[var(--bw-line-strong)] text-xs"
                    />
                    <input
                      type="email"
                      required
                      value={reqEmail}
                      onChange={(e) => setReqEmail(e.target.value)}
                      placeholder="Work Email (@betterwaymortgages.com) *"
                      className="w-full min-h-[42px] px-3.5 rounded-xl bg-[var(--bw-soft)] border border-[var(--bw-line-strong)] text-xs"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={reqPhone}
                        onChange={(e) => setReqPhone(e.target.value)}
                        placeholder="+971 50 ..."
                        className="min-h-[42px] px-3 rounded-xl bg-[var(--bw-soft)] border border-[var(--bw-line-strong)] text-xs"
                      />
                      <select
                        value={reqRole}
                        onChange={(e) => setReqRole(e.target.value)}
                        className="min-h-[42px] px-2.5 rounded-xl bg-[var(--bw-soft)] border border-[var(--bw-line-strong)] text-xs font-semibold"
                      >
                        <option>Mortgage Advisor</option>
                        <option>Loan Coordinator</option>
                        <option>RERA Broker Partner</option>
                        <option>Accounts / Operations</option>
                      </select>
                    </div>
                    <button type="submit" className="bw-btn bw-btn-primary w-full min-h-[44px] text-xs font-extrabold">
                      <UserPlus size={15} /> Submit Seat Request to Owners
                    </button>
                  </>
                )}
              </form>
            )}

            {demoMode && demoAccounts.length > 0 && (
              <div className="pt-4 border-t border-[var(--bw-line)] space-y-2">
                <div className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[#119c78] flex items-center justify-between">
                  <span>1-Click Staff Access (Local Mode)</span>
                  <ShieldCheck size={13} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pe-1">
                  {demoAccounts.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => void switchDemoAccount(acc.email)}
                      className="p-2 rounded-xl bg-[var(--bw-soft)] hover:bg-[#0a0e14] hover:text-white border border-[var(--bw-line)] hover:border-[#22e2ad]/60 flex items-center gap-2 text-start transition cursor-pointer group"
                    >
                      <StaffAvatar name={acc.name} avatarUrl={acc.avatarUrl} initials={acc.initials} size="sm" />
                      <div className="min-w-0">
                        <div className="text-[11.5px] font-extrabold truncate">{acc.name}</div>
                        <div className="text-[9.5px] text-[var(--bw-muted)] group-hover:text-[#34f0bc] truncate">{acc.designation}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="text-[11px] text-[var(--bw-muted)] leading-relaxed">
              Restricted to authorized Betterway Mortgages LLC staff. Encrypted session with full UAE CBUAE &amp; PDPL audit trail.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
