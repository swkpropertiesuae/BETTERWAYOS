'use client';

import React, { useState } from 'react';
import { ArrowRight, Crown, Lock, ShieldCheck } from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { StaffAvatar } from '@/components/os/UiKit';

export default function LoginPage() {
  const { demoMode, demoAccounts, switchDemoAccount, toast } = useOs();
  const [email, setEmail] = useState('warda@betterwaymortgages.com');
  const [password, setPassword] = useState('Betterway@2026');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Invalid credentials', 'err');
      } else {
        window.location.href = '/os';
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070E1A] text-white grid lg:grid-cols-12">
      {/* Left Executive Brand Showcase */}
      <div className="lg:col-span-7 p-8 lg:p-14 flex flex-col justify-between bg-[radial-gradient(circle_at_top_left,#0F4A3B_0%,#070E1A_55%)] border-e border-white/10">
        <div className="space-y-6">
          <img src="/brand/logo-horizontal-dark.svg" alt="Betterway Mortgages" className="h-10 w-auto" />
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#FCF1B7] text-[11px] font-bold uppercase tracking-[0.18em]">
            <ShieldCheck size={14} /> Betterway Mortgages LLC · Dubai Operating System v3
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-[-0.03em] leading-[1.06] max-w-xl">
            One Operating System for <span className="text-[#34DFAC]">24 UAE Banks</span>, 12 Closing Steps & Live Website Control.
          </h1>
          <p className="text-sm text-slate-300 max-w-lg leading-relaxed">
            Al Nasr Plaza, Oud Metha, Dubai · Permanent Supabase Cloud Postgres, Private Encrypted Document Vault, Hikvision Door Biometric + QR Attendance, Field GPS, and Live Sync with betterwaymortgages.com.
          </p>
        </div>

        {/* Equal Co-Owners Leadership Strip */}
        <div className="grid sm:grid-cols-2 gap-4 pt-8">
          <div className="p-4 rounded-2xl bg-white/5 border border-[#D4AF37]/35 flex items-center gap-3.5">
            <img
              src="/staff/warda-kapadia.jpg"
              alt="Warda Kapadia"
              className="size-16 rounded-2xl object-cover object-top border border-[#D4AF37]/50"
            />
            <div>
              <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#FCF1B7]">
                <Crown size={11} /> Warda&apos;s Place
              </div>
              <div className="font-bold text-base">Warda Kapadia</div>
              <div className="text-xs text-[#34DFAC]">Owner, Founder &amp; Managing Director</div>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-[#D4AF37]/35 flex items-center gap-3.5">
            <img
              src="/staff/shabib-siraj.jpg"
              alt="Shabib Siraj"
              className="size-16 rounded-2xl object-cover object-top border border-[#D4AF37]/50"
            />
            <div>
              <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#FCF1B7]">
                <Crown size={11} /> Shabib&apos;s Corner
              </div>
              <div className="font-bold text-base">Shabib Siraj</div>
              <div className="text-xs text-[#34DFAC]">Executive Director</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sign-In & Role Switch Panel */}
      <div className="lg:col-span-5 p-8 lg:p-12 flex flex-col justify-center bg-[#0B1424]">
        <div className="w-full max-w-md mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Sign in to Betterway OS</h2>
            <p className="text-xs text-slate-400 mt-1">Encrypted HTTP-only session · CBUAE &amp; UAE PDPL compliant</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Work Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/15 text-sm outline-none focus:border-[#34DFAC]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/15 text-sm outline-none focus:border-[#34DFAC]"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full h-11 rounded-full bg-[#0D8A6A] hover:bg-[#11A37D] text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Lock size={14} /> {busy ? 'Authenticating...' : 'Enter Operating System'} <ArrowRight size={15} />
            </button>
          </form>

          {demoMode && demoAccounts.length > 0 && (
            <div className="pt-5 border-t border-white/10 space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#FCF1B7]">
                Quick Workspace Access (Demo Mode Enabled)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pe-1">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => void switchDemoAccount(acc.email)}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#34DFAC]/50 flex items-center gap-2.5 text-start transition cursor-pointer"
                  >
                    <StaffAvatar name={acc.name} avatarUrl={acc.avatarUrl} initials={acc.initials} size="sm" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">{acc.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{acc.designation}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
