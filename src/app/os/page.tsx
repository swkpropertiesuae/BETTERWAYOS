'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  Briefcase,
  Calculator,
  CalendarClock,
  CheckSquare,
  ClipboardList,
  Crown,
  Database,
  FileSpreadsheet,
  FileText,
  Flame,
  KanbanSquare,
  Lock,
  MapPin,
  Palette,
  PhoneCall,
  Receipt,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
  Wallet,
} from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { fmtAed, GlossyBlackCard } from '@/components/os/UiKit';
import { useInstantApi } from '@/lib/client-cache';

export default function OsHomePage() {
  const { user } = useOs();
  const [filter, setFilter] = useState('');
  const { data: overview } = useInstantApi<{
    kpis?: {
      loanBookAed: number;
      expectedDsaAed: number;
      todayEnquiriesCount: number;
      checkedInCount: number;
      totalStaffCount: number;
      pendingApprovalsCount: number;
      activeCasesCount: number;
    };
  }>('/api/v1/dashboard/overview');

  const kpis = overview?.kpis ?? null;
  const isOwner = Boolean(user?.isOwner);
  const isShabib = Boolean(user?.email?.toLowerCase().includes('shabib'));
  const firstName = user?.name?.split(' ')[0] || 'Team';
  const placeTitle = isShabib ? "Shabib's Place" : "Warda's Place";
  const cornerTitle = isShabib ? "Shabib's Corner" : "Warda's Corner";

  const placeModules = [
    { label: 'Team & Daily To-Do', desc: 'Staff job roles, tasks & verifiers', href: '/os/place?tab=team', icon: CheckSquare },
    { label: 'Next Day Plan & Daily Report', desc: 'Calls, visits, tie-ups, socials & logins', href: '/os/place?tab=daily-plan', icon: CalendarClock },
    { label: 'Mortgage Field Meetings', desc: 'GPS pin, proof photo & authority sign-off', href: '/os/place?tab=visits', icon: MapPin },
    { label: 'APL Brochures & Catalog', desc: 'Custom colors, materials & bank sheets', href: '/os/place?tab=catalog', icon: Palette },
    { label: 'Mortgage Forms (Word / JPEG)', desc: 'Fillable agreements, NOCs & templates', href: '/os/place?tab=legal', icon: FileText },
    { label: '5-Track Disbursal Closings', desc: 'Scratch to handover & cheque ledger', href: '/os/place?tab=closings', icon: ClipboardList },
    { label: 'Advisor DSA & Expenses', desc: 'Paid / pending · Cash, BT & Botim', href: '/os/place?tab=commissions', icon: Receipt },
  ];

  const cornerModules = [
    { label: 'Privacy Fast Track', desc: 'Private VIP cases & direct owner invoices', href: '/os/corner?tab=fasttrack', icon: Lock },
    { label: 'Owner Approvals', desc: '1-of-2 & 2-of-2 high-value release sign-offs', href: '/os/corner?tab=approvals', icon: ShieldCheck },
    { label: 'Consolidated P&L & VAT 201', desc: 'Corporate + Private UAE 5% VAT view', href: '/os/corner?tab=vat', icon: Wallet },
    { label: 'Bulk AI Upload & Audit', desc: 'Batch OCR ingestion & executive logs', href: '/os/corner?tab=bulkai', icon: Upload },
  ];

  const deskModules = [
    { label: '3-Bank Auto-Eco Proposal', desc: 'Side-by-side EMI, 300m schedule & PDF/Excel', href: '/os/mortgage-desk?tab=proposal', icon: Calculator, dark: true },
    { label: '18-Bank 2026 Rate Matrix', desc: 'Salaried, Self-Employed, Commercial & NR', href: '/os/mortgage-desk?tab=matrix', icon: Database, dark: false },
    { label: '159 Direct Bank RMs', desc: 'Direct bank RM phones, emails & escalations', href: '/os/mortgage-desk?tab=rms', icon: PhoneCall, dark: false },
    { label: 'Coordinator & Logins Tracker', desc: '32-col Excel logins, valuation, FOL & disbursal', href: '/os/coordinator', icon: ClipboardList, dark: true },
    { label: '12-Step Mortgage Pipeline', desc: 'Enquiry to DLD Trustee & bank payout', href: '/os/pipeline', icon: KanbanSquare, dark: false },
    { label: 'Employees, Leave & Salary', desc: 'EID/Visa, QR check-in, leave & WPS payroll', href: '/os/employees', icon: Users, dark: false },
    { label: 'All-Data Excel & 2026 Matrix', desc: '17-sheet full OS backup + recreated bank matrix', href: '/os/utilities', icon: FileSpreadsheet, dark: true },
    { label: 'CBUAE, CC Reducer & CTO', desc: 'DBR 50%, 6-month CTO & USD/AED avg balance', href: '/os/mortgage-desk?tab=cbuae', icon: Flame, dark: false },
  ];

  const q = filter.trim().toLowerCase();
  const match = (item: { label: string; desc: string }) =>
    !q || item.label.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q);

  return (
    <div className="space-y-8">
      {/* Clean Typographic Greeting Header — Zero Clutter Buttons */}
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#0b5442] dark:text-[#34f0bc]">
            <img src="/brand/betterway-icon.svg" alt="" aria-hidden className="size-5" />
            Betterway Mortgages LLC · Dubai OS
          </div>
          <h1 className="font-display text-3xl sm:text-[38px] font-extrabold tracking-[-0.035em] leading-[1.08] text-[var(--bw-ink)]">
            Welcome back, {firstName}.
          </h1>
          <p className="text-[13.5px] text-[var(--bw-muted)] max-w-[66ch]">
            Select any app from the left sidebar to open it — its sub-pages automatically appear along the top bar.
          </p>
        </div>

        {/* Quiet Inline Filter */}
        <label className="flex items-center gap-2 px-4 h-10 rounded-full bg-white dark:bg-[#0d1219] border border-[var(--bw-line-strong)] focus-within:border-[#119c78] w-full sm:w-80 shadow-xs">
          <Search size={14} className="text-[#119c78] shrink-0" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Quick filter modules..."
            className="flex-1 bg-transparent outline-none text-xs text-[var(--bw-ink)] placeholder:text-[var(--bw-muted)]"
          />
        </label>
      </section>

      {/* Split Individual Glossy Floating Shining Black KPI Tiles (1 Metric Per Card — Never Crammed Together) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Live mortgage metrics">
        <GlossyBlackCard className="p-5 space-y-1.5" accent="emerald">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-slate-400">Active Loan Book</div>
          <div className="font-display text-2xl sm:text-[28px] font-extrabold font-mono-num text-white">
            {fmtAed(kpis?.loanBookAed ?? 0, true)}
          </div>
          <div className="text-[11px] font-semibold text-[#34f0bc]">{kpis?.activeCasesCount ?? 0} active cases</div>
        </GlossyBlackCard>

        <GlossyBlackCard className="p-5 space-y-1.5" accent="dual">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-slate-400">Expected Bank DSA</div>
          <div className="font-display text-2xl sm:text-[28px] font-extrabold font-mono-num text-[#34f0bc]">
            {fmtAed(kpis?.expectedDsaAed ?? 0, true)}
          </div>
          <div className="text-[11px] text-slate-300">Corporate bank payouts</div>
        </GlossyBlackCard>

        <GlossyBlackCard className="p-5 space-y-1.5" accent="gold">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-slate-400">Team Checked In</div>
          <div className="font-display text-2xl sm:text-[28px] font-extrabold font-mono-num text-[#fbe8a4]">
            {kpis ? `${kpis.checkedInCount} / ${kpis.totalStaffCount}` : '0 / 9'}
          </div>
          <div className="text-[11px] text-slate-300">Oud Metha QR attendance</div>
        </GlossyBlackCard>

        <GlossyBlackCard className="p-5 space-y-1.5" accent="emerald">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-slate-400">Live UAE Bank Matrix</div>
          <div className="font-display text-2xl sm:text-[28px] font-extrabold text-white">
            18 Banks <span className="text-sm font-bold text-[#34f0bc]">· 159 RMs</span>
          </div>
          <div className="text-[11px] text-slate-300">Updated 2026 rates &amp; policies</div>
        </GlossyBlackCard>
      </section>

      {/* OWNER SECTION 1: Warda's Place / Shabib's Place (Daily UAE Mortgage Operations — Split Modular Cards) */}
      {isOwner && (
        <section className="space-y-3" aria-label={placeTitle}>
          <div className="flex items-center justify-between border-b border-[var(--bw-line-strong)] pb-2">
            <div className="flex items-center gap-2">
              <span className="size-7 rounded-lg bg-[#090d13] text-[#34f0bc] flex items-center justify-center">
                <Briefcase size={15} />
              </span>
              <div>
                <h2 className="font-display text-base font-extrabold text-[var(--bw-ink)]">{placeTitle}</h2>
                <p className="text-[11.5px] text-[var(--bw-muted)]">Daily UAE Mortgage Operations · Team, Plans, Field GPS, Brochures, Forms &amp; Disbursals</p>
              </div>
            </div>
            <Link href="/os/place?tab=team" className="text-xs font-extrabold text-[#0b5442] dark:text-[#34f0bc] hover:underline inline-flex items-center gap-1">
              Open {placeTitle} <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {placeModules.filter(match).map((m) => {
              const Icon = m.icon;
              return (
                <Link
                  key={m.href}
                  href={m.href}
                  className="group bg-white dark:bg-[#0e131b] rounded-[18px] border border-[var(--bw-line)] hover:border-[#119c78] p-4 shadow-[var(--bw-shadow-raised)] hover:-translate-y-0.5 transition flex flex-col justify-between gap-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="size-9 rounded-xl bg-[#090d13] text-[#34f0bc] flex items-center justify-center shadow-sm">
                      <Icon size={17} />
                    </span>
                    <ArrowUpRight size={15} className="text-[var(--bw-muted)] group-hover:text-[#119c78] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                  <div>
                    <div className="font-display text-sm font-extrabold text-[var(--bw-ink)] group-hover:text-[#0b5442] dark:group-hover:text-[#34f0bc]">
                      {m.label}
                    </div>
                    <div className="text-[11.5px] text-[var(--bw-muted)] mt-0.5 leading-snug">{m.desc}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* OWNER SECTION 2: Warda's Corner / Shabib's Corner (Private Fast Track & Governance — Split Glossy Black Cards) */}
      {isOwner && (
        <section className="space-y-3" aria-label={cornerTitle}>
          <div className="flex items-center justify-between border-b border-[var(--bw-line-strong)] pb-2">
            <div className="flex items-center gap-2">
              <span className="size-7 rounded-lg bg-[#090d13] text-[#fbe8a4] border border-[#d9b356]/40 flex items-center justify-center">
                <Crown size={15} />
              </span>
              <div>
                <h2 className="font-display text-base font-extrabold text-[var(--bw-ink)]">{cornerTitle}</h2>
                <p className="text-[11.5px] text-[var(--bw-muted)]">Private Fast Track, Confidential VIP Invoices, Dual Approvals &amp; Consolidated VAT</p>
              </div>
            </div>
            <Link href="/os/corner?tab=fasttrack" className="text-xs font-extrabold text-[#9a7123] dark:text-[#fbe8a4] hover:underline inline-flex items-center gap-1">
              Open {cornerTitle} <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {cornerModules.filter(match).map((m) => {
              const Icon = m.icon;
              return (
                <Link key={m.href} href={m.href} className="block group">
                  <GlossyBlackCard className="p-4 h-full flex flex-col justify-between gap-3" accent="gold">
                    <div className="flex items-center justify-between">
                      <span className="size-9 rounded-xl bg-white/10 border border-[#d9b356]/40 text-[#fbe8a4] flex items-center justify-center">
                        <Icon size={17} />
                      </span>
                      <ArrowUpRight size={15} className="text-[#fbe8a4]/80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                    <div>
                      <div className="font-display text-sm font-extrabold text-white group-hover:text-[#fbe8a4]">{m.label}</div>
                      <div className="text-[11.5px] text-slate-300 mt-0.5 leading-snug">{m.desc}</div>
                    </div>
                  </GlossyBlackCard>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* CORE UAE MORTGAGE WORKFLOWS (Split White & Glossy Black Tiles) */}
      <section className="space-y-3" aria-label="Core mortgage operations">
        <div className="flex items-center justify-between border-b border-[var(--bw-line-strong)] pb-2">
          <div className="flex items-center gap-2">
            <span className="size-7 rounded-lg bg-[#090d13] text-[#34f0bc] flex items-center justify-center">
              <Sparkles size={15} />
            </span>
            <div>
              <h2 className="font-display text-base font-extrabold text-[var(--bw-ink)]">UAE Mortgage Operations &amp; Excel Tools</h2>
              <p className="text-[11.5px] text-[var(--bw-muted)]">18-Bank Rates, 159 Direct Bank RMs, Coordinator Logins, HR/Salary &amp; Daily Excel Backups</p>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {deskModules.filter(match).map((m) => {
            const Icon = m.icon;
            if (m.dark) {
              return (
                <Link key={m.href} href={m.href} className="block group">
                  <GlossyBlackCard className="p-4 h-full flex flex-col justify-between gap-3" accent="emerald">
                    <div className="flex items-center justify-between">
                      <span className="size-9 rounded-xl bg-white/10 border border-[#22e2ad]/35 text-[#34f0bc] flex items-center justify-center">
                        <Icon size={17} />
                      </span>
                      <ArrowUpRight size={15} className="text-[#34f0bc] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                    <div>
                      <div className="font-display text-sm font-extrabold text-white">{m.label}</div>
                      <div className="text-[11.5px] text-slate-300 mt-0.5 leading-snug">{m.desc}</div>
                    </div>
                  </GlossyBlackCard>
                </Link>
              );
            }
            return (
              <Link
                key={m.href}
                href={m.href}
                className="group bg-white dark:bg-[#0e131b] rounded-[18px] border border-[var(--bw-line)] hover:border-[#119c78] p-4 shadow-[var(--bw-shadow-raised)] hover:-translate-y-0.5 transition flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className="size-9 rounded-xl bg-[#090d13] text-[#34f0bc] flex items-center justify-center shadow-sm">
                    <Icon size={17} />
                  </span>
                  <ArrowUpRight size={15} className="text-[var(--bw-muted)] group-hover:text-[#119c78] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <div>
                  <div className="font-display text-sm font-extrabold text-[var(--bw-ink)] group-hover:text-[#0b5442] dark:group-hover:text-[#34f0bc]">
                    {m.label}
                  </div>
                  <div className="text-[11.5px] text-[var(--bw-muted)] mt-0.5 leading-snug">{m.desc}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Open 6-Step UAE Mortgage Flow Strip */}
      <section className="pt-2 border-t border-[var(--bw-line-strong)] flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-display font-extrabold text-[#9a7123] dark:text-[#fbe8a4] uppercase tracking-[0.12em] text-[10.5px]">
          UAE Mortgage Flow
        </span>
        <div className="flex flex-wrap items-center gap-4 font-bold text-[var(--bw-body)]">
          {[
            { n: '01', t: 'Lead & Docs', h: '/os/crm' },
            { n: '02', t: '18-Bank Proposal', h: '/os/mortgage-desk?tab=proposal' },
            { n: '03', t: 'Coordinator Login', h: '/os/coordinator' },
            { n: '04', t: 'Valuation & FOL', h: '/os/pipeline' },
            { n: '05', t: 'DLD Disbursal', h: '/os/place?tab=closings' },
            { n: '06', t: 'Bank Payout', h: '/os/accounts' },
          ].map((s) => (
            <Link key={s.n} href={s.h} className="inline-flex items-center gap-1.5 hover:text-[#119c78] transition">
              <span className="font-mono-num text-[#119c78] font-extrabold">{s.n}</span>
              <span>{s.t}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
