import React, { useEffect, useState } from 'react';
import { ArrowRight, Lock, ShieldCheck, Smartphone } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { apiFetch } from '../lib/api';
import { EIBOR_SNAPSHOT, UAE_BANKS } from '@shared/banks-data';
import { StaffAvatar } from '../components/UiPrimitives';

export function LoginPage() {
  const { login, quickRoleLogin, toast } = useAuth();
  const [email, setEmail] = useState('shabib@betterwaymortgages.com');
  const [password, setPassword] = useState('Betterway@2026');
  const [busy, setBusy] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => {
    apiFetch<{ accounts: any[] }>('/api/auth/demo-accounts')
      .then((d) => setAccounts(d.accounts || []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
    } catch (err: any) {
      toast(err.message || 'Sign-in failed', 'err');
    } finally {
      setBusy(false);
    }
  };

  const handleQuick = async (accEmail: string) => {
    setBusy(true);
    try {
      await quickRoleLogin(accEmail);
    } catch (err: any) {
      toast(err.message || 'Quick sign-in failed', 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-[#070E1A] text-white">
      {/* Left 7-Col Luxury Brand & Architectural Showcase */}
      <div className="relative lg:col-span-7 flex flex-col justify-between p-8 sm:p-12 overflow-hidden">
        <img
          src="/images/hero-morning-01-2048.webp"
          alt="Dubai Morning Skyline"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(140deg, rgba(7,14,26,0.92) 0%, rgba(10,74,62,0.72) 52%, rgba(7,14,26,0.96) 100%)',
          }}
        />

        <div className="relative z-10 flex items-center justify-between gap-4">
          <img
            src="/brand/betterway-logo-horizontal-dark-bg.svg"
            alt="Betterway Mortgages"
            className="h-11 sm:h-13 w-auto object-contain"
          />
          <span className="px-3.5 py-1.5 rounded-full text-[11px] font-mono-num font-semibold bg-[#0C1524]/85 border border-[#D7B158]/45 text-[#FCF1B7]">
            3M EIBOR {EIBOR_SNAPSHOT.latest.threeMonth.toFixed(3)}% · CBUAE
          </span>
        </div>

        <div className="relative z-10 my-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#34DFAC]/15 border border-[#34DFAC]/35 text-[#34DFAC] text-[11px] font-bold uppercase tracking-[0.2em] mb-4">
            <ShieldCheck size={14} /> Institutional UAE Mortgage OS v1.0
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-[-0.035em] leading-[1.08]">
            Whole-of-market UAE mortgage{' '}
            <span className="font-serif-accent font-normal text-[#FCF1B7]">command,</span> from first fact-find to DLD
            disbursal.
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            Built for <b>Betterway Mortgages LLC</b> (Al Nasr Plaza, Oud Metha, Dubai) — uniting 24 UAE partner banks,
            deterministic CBUAE 50% DBR stress testing, 12-milestone parallel bank origination, 50 Excel governance
            specs, SWK Properties Dual-Relay attribution, and our dedicated 3-mode Mobile App.
          </p>

          {/* Featured Official Bank Panel Strip */}
          <div className="mt-8">
            <div className="text-[10px] uppercase tracking-[0.22em] text-[#D7B158] font-bold mb-3">
              24 UAE Partner Banks Integrated
            </div>
            <div className="flex flex-wrap gap-2">
              {UAE_BANKS.slice(0, 10).map((b) => (
                <div
                  key={b.key}
                  className="h-9 w-20 px-2 rounded-lg bg-white/95 flex items-center justify-center shadow-sm"
                  title={b.name}
                >
                  <img src={b.logo} alt={b.name} className="h-5 w-16 object-contain" />
                </div>
              ))}
              <div className="h-8 px-3 rounded-lg bg-white/10 border border-white/15 flex items-center text-xs font-semibold text-[#FCF1B7]">
                +14 more banks
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-white/15 text-xs text-slate-300">
          <span>DED #1084921 · CBUAE-MB-2025-041 · UAE PDPL Law 45/2021 Compliant</span>
          <a
            href="/mobile/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-[#34DFAC] hover:text-[#FCF1B7] font-semibold"
          >
            <Smartphone size={14} /> Launch Betterway Mobile PWA ↗
          </a>
        </div>
      </div>

      {/* Right 5-Col Sign-In & Role Switcher */}
      <div className="lg:col-span-5 flex flex-col justify-center p-6 sm:p-10 bg-[#F5F7FA] text-[#070E1A]">
        <div className="max-w-md w-full mx-auto">
          <div className="mb-6">
            <img
              src="/brand/betterway-logo-horizontal-light-bg.svg"
              alt="Betterway Mortgages"
              className="h-9 w-auto object-contain mb-4 lg:hidden"
            />
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#179373]">Authorized Staff Access</div>
            <h2 className="text-2xl font-bold tracking-[-0.025em] mt-1">Sign in to Betterway OS</h2>
            <p className="text-xs text-slate-500 mt-1">
              Use your corporate credentials or select any official Betterway role below for instant workspace access.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Corporate Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#179373] focus:ring-2 focus:ring-[#34DFAC]/25"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#179373] focus:ring-2 focus:ring-[#34DFAC]/25"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full h-11 rounded-full font-bold text-sm text-white bg-gradient-to-r from-[#179373] to-[#0A4A3E] hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Lock size={15} />
              <span>{busy ? 'Authenticating…' : 'Sign In to Workspace'}</span>
              <ArrowRight size={15} />
            </button>
          </form>

          {/* Official 9-Staff Instant Executive & Team Switcher */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Instant 1-Click Staff Sign-In (9 Official Profiles)
              </span>
              <span className="text-[10px] font-mono-num text-slate-400">PW: Betterway@2026</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pe-1">
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  disabled={busy}
                  onClick={() => void handleQuick(acc.email)}
                  className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-white border border-slate-200 hover:border-[#179373] hover:shadow-md transition-all text-start cursor-pointer"
                >
                  <StaffAvatar avatar={acc.avatar} name={acc.name} initials={acc.initials} size="sm" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#070E1A] truncate">{acc.name}</div>
                    <div className="text-[10.5px] text-slate-500 truncate">{acc.designation}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
