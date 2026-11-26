'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  Briefcase,
  Calculator,
  Crown,
  Database,
  FileLock2,
  Globe,
  KanbanSquare,
  LayoutDashboard,
  MapPin,
  MessagesSquare,
  Radar,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { fmtAed, StaffAvatar, StatusPill } from '@/components/os/UiKit';

interface AppIconDef {
  key: string;
  label: string;
  blurb: string;
  badge: string;
  href: string;
  icon: LucideIcon;
  tone: 'gold' | 'navy' | 'emerald' | 'sky' | 'violet';
  visible: boolean;
}

export default function OsAppLauncherPage() {
  const { user } = useOs();
  const [filter, setFilter] = useState('');
  const [stats, setStats] = useState<{
    loanBookAed: number;
    expectedDsaAed: number;
    todayEnquiriesCount: number;
    checkedInCount: number;
    totalStaffCount: number;
    pendingApprovalsCount: number;
    activeFieldVisitsCount: number;
  } | null>(null);

  useEffect(() => {
    fetch('/api/v1/dashboard/overview')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.kpis) setStats(d.kpis);
      })
      .catch(() => {});
  }, []);

  const isOwner = Boolean(user?.isOwner);
  const isOwnerOrAdmin = user?.role === 'OWNER' || user?.role === 'OFFICE_ADMIN';

  const allApps: AppIconDef[] = [
    {
      key: 'executive',
      label: user?.executiveAppTitle || "Warda's Place",
      blurb: `${user?.privacyLaneTitle || 'Privacy Fast Track'}, 1–12 Gold-Rush Kanban, Bulk AI Upload, Owner Approvals & Consolidated VAT`,
      badge: 'Owner Private HQ',
      href: '/os/executive',
      icon: Crown,
      tone: 'gold',
      visible: isOwner,
    },
    {
      key: 'command',
      label: 'Command Center',
      blurb: 'Live daily enquiry ticker, 12-stage lead counts, critical alerts, office attendance & field GPS radar',
      badge: 'Live War Room',
      href: '/os/command-center',
      icon: Radar,
      tone: 'navy',
      visible: true,
    },
    {
      key: 'dashboard',
      label: 'Dashboard',
      blurb: 'Loan book, commissions, 12-stage funnel, My Tasks Today, Team Task Monitor & Assigned Clients',
      badge: 'Daily Pulse',
      href: '/os/dashboard',
      icon: LayoutDashboard,
      tone: 'emerald',
      visible: true,
    },
    {
      key: 'master-log',
      label: 'Master Log (CORE)',
      blurb: '22 headquarters registries: Communities, Developers, Oud Metha Geofence, Departments, COA, VAT, 24 Banks',
      badge: isOwner ? 'Direct Owner Control' : 'Owner-Approval Gated',
      href: '/os/master-log',
      icon: Database,
      tone: 'emerald',
      visible: isOwnerOrAdmin,
    },
    {
      key: 'pipeline',
      label: '12-Step Pipeline',
      blurb: 'Exact 1→12 mortgage Kanban from Enquiry, Eligibility, Pick Banks & Papers to NOC, Commission & Care',
      badge: '12 Stages',
      href: '/os/pipeline',
      icon: KanbanSquare,
      tone: 'emerald',
      visible: true,
    },
    {
      key: 'crm',
      label: 'CRM',
      blurb: '100% exact daily enquiry ledger (Website, Chat, WhatsApp, Bayut, Referrals), Masked Client Vault & calls',
      badge: '100% Daily Log',
      href: '/os/crm',
      icon: UserPlus,
      tone: 'sky',
      visible: true,
    },
    {
      key: 'mortgage-desk',
      label: 'Mortgage Exclusive Desk',
      blurb: 'Schedules, valuations, Form F/FOL deadlines, 24 UAE banks, 8 CBUAE calculators & CTO/Avg Balance analyzer',
      badge: '24 Banks + CTO',
      href: '/os/mortgage-desk',
      icon: Calculator,
      tone: 'gold',
      visible: true,
    },
    {
      key: 'sales',
      label: 'Sales & Services',
      blurb: 'Branded bank comparison proposals, Takaful/Wills/Golden Visa cross-sell & RERA Partner Referral Hub',
      badge: 'Quotes & Partners',
      href: '/os/sales',
      icon: Briefcase,
      tone: 'navy',
      visible: true,
    },
    {
      key: 'vault',
      label: 'Client Document Vault',
      blurb: 'Per-client encrypted Supabase vault: Passport, EID, Visa, Payslips, Salary Cert, 6m Bank, AECB, Form F, Oqood, Title Deed',
      badge: 'Private Storage',
      href: '/os/vault',
      icon: FileLock2,
      tone: 'navy',
      visible: true,
    },
    {
      key: 'accounts',
      label: 'Accounts',
      blurb: 'Double-entry GL, Bank DSA invoices, UAE 5% VAT 201, PINT-AE XML & Corporate-Account-Only payout guard',
      badge: 'FTA VAT & GL',
      href: '/os/accounts',
      icon: Wallet,
      tone: 'gold',
      visible: isOwnerOrAdmin,
    },
    {
      key: 'compliance',
      label: 'Compliance',
      blurb: 'CBUAE Joint KFS gate, AML sanctions screening, goAML XML, UAE PDPL audit trail & 2-of-2 Owner Delete Bin',
      badge: 'CBUAE & PDPL',
      href: '/os/compliance',
      icon: ShieldCheck,
      tone: 'violet',
      visible: true,
    },
    {
      key: 'website-studio',
      label: 'Website & Social Studio',
      blurb: 'Live two-way control of betterwaymortgages.com (Hot Offers, Bank Rates, Banners, Team) & Social UTM Campaigns',
      badge: 'Two-Way Live Sync',
      href: '/os/website-studio',
      icon: Globe,
      tone: 'emerald',
      visible: true,
    },
    {
      key: 'employees',
      label: 'Employees & Attendance',
      blurb: '8-member studio roster, Hikvision door fingerprint + 20s Office QR check-in, Visas, Leave & MOHRE WPS .SIF',
      badge: 'Hikvision + QR',
      href: '/os/employees',
      icon: Users,
      tone: 'navy',
      visible: true,
    },
    {
      key: 'inside',
      label: 'Team Group (Inside)',
      blurb: 'Company channels & live #attendance-checkin feed automatically updated when staff enter via Hikvision or QR',
      badge: 'Auto Check-In Feed',
      href: '/os/inside',
      icon: MessagesSquare,
      tone: 'sky',
      visible: true,
    },
    {
      key: 'field-gps',
      label: 'Field GPS Services',
      blurb: 'Track field staff live at Banks, Valuations, Developers & DLD Trustees with GPS pins & 1-Tap SOS alert',
      badge: 'Live GPS + SOS',
      href: '/os/field-gps',
      icon: MapPin,
      tone: 'emerald',
      visible: true,
    },
    {
      key: 'ai',
      label: 'AI Case-Study Copilot',
      blurb: 'PII-shielded UAE mortgage AI grounded in Betterway case studies + Train New Scenario knowledge studio',
      badge: 'Case-Study AI',
      href: '/os/ai',
      icon: Sparkles,
      tone: 'violet',
      visible: true,
    },
    {
      key: 'utilities',
      label: 'Utilities & Documents',
      blurb: 'Letter & Word Studio with Owner Corporate Seal, 9-Language Translator, OCR extractor & 50-Spec Excel Data Hub',
      badge: '50 Excel + Seal',
      href: '/os/utilities',
      icon: Wrench,
      tone: 'gold',
      visible: true,
    },
    {
      key: 'settings',
      label: 'Settings',
      blurb: 'Oud Metha Wi-Fi/Geofence calibration, Hikvision door relay config, Website sync HMAC & Corporate IBAN whitelist',
      badge: 'System Config',
      href: '/os/settings',
      icon: Settings,
      tone: 'navy',
      visible: isOwnerOrAdmin,
    },
  ];
  const apps = allApps.filter((a) => a.visible && (!filter.trim() || `${a.label} ${a.blurb} ${a.badge}`.toLowerCase().includes(filter.toLowerCase())));

  const iconBg: Record<AppIconDef['tone'], string> = {
    gold: 'bg-gradient-to-br from-[#D4AF37] to-[#9A7818] text-[#0A1128]',
    navy: 'bg-gradient-to-br from-[#0A1128] to-[#1D2D52] text-[#FCF1B7]',
    emerald: 'bg-gradient-to-br from-[#0D8A6A] to-[#084D3C] text-white',
    sky: 'bg-gradient-to-br from-[#0284C7] to-[#0369A1] text-white',
    violet: 'bg-gradient-to-br from-[#6D28D9] to-[#4C1D95] text-white',
  };

  return (
    <div className="space-y-6">
      {/* Executive Welcome Hero Banner */}
      <section className="rounded-3xl bg-[#0A1128] text-white border border-[#D4AF37]/35 p-6 sm:p-7 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            {user && (
              <StaffAvatar name={user.name} avatarUrl={user.avatarUrl} initials={user.initials} size="lg" />
            )}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#FCF1B7] text-[10.5px] font-bold uppercase tracking-[0.16em]">
                {isOwner ? <Crown size={12} /> : <ShieldCheck size={12} />}
                {isOwner ? `${user?.executiveAppTitle} · Equal Co-Owner Control` : `${user?.department} Workspace`}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1.5">
                Welcome back, <span className="text-[#34DFAC]">{user?.name || 'Betterway Team'}</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                {user?.designation} · Al Nasr Plaza, Oud Metha, Dubai · Connected live to betterwaymortgages.com
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isOwner && (
              <Link
                href="/os/executive"
                className="px-4 py-2.5 rounded-full bg-[#D4AF37] hover:bg-[#e1be49] text-[#0A1128] text-xs font-extrabold inline-flex items-center gap-1.5 shadow"
              >
                <Crown size={14} /> Open {user?.executiveAppTitle}
              </Link>
            )}
            <Link
              href="/os/pipeline"
              className="px-4 py-2.5 rounded-full bg-[#0D8A6A] hover:bg-[#10a07b] text-white text-xs font-bold inline-flex items-center gap-1.5"
            >
              <KanbanSquare size={14} /> 12-Step Pipeline
            </Link>
            <Link
              href="/os/employees"
              className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Users size={14} /> Check-In ({stats?.checkedInCount ?? 0}/{stats?.totalStaffCount ?? 9})
            </Link>
          </div>
        </div>

        {/* Live Executive Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="rounded-2xl bg-white/5 px-4 py-3">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Active Loan Book</div>
            <div className="text-lg font-extrabold font-mono-num text-white mt-0.5">{fmtAed(stats?.loanBookAed ?? 0, true)}</div>
          </div>
          <div className="rounded-2xl bg-white/5 px-4 py-3">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Expected Bank DSA</div>
            <div className="text-lg font-extrabold font-mono-num text-[#FCF1B7] mt-0.5">{fmtAed(stats?.expectedDsaAed ?? 0, true)}</div>
          </div>
          <div className="rounded-2xl bg-white/5 px-4 py-3">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Today&apos;s Enquiries (GST)</div>
            <div className="text-lg font-extrabold font-mono-num text-[#34DFAC] mt-0.5">{stats?.todayEnquiriesCount ?? 0} Logged</div>
          </div>
          <div className="rounded-2xl bg-white/5 px-4 py-3">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              {isOwner ? 'Pending Owner Approvals' : 'Active Field Visits'}
            </div>
            <div className="text-lg font-extrabold font-mono-num text-amber-300 mt-0.5">
              {isOwner ? `${stats?.pendingApprovalsCount ?? 0} Waiting` : `${stats?.activeFieldVisitsCount ?? 0} Live`}
            </div>
          </div>
        </div>
      </section>

      {/* Filter Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight">Betterway OS Applications</h2>
          <p className="text-xs text-[var(--bw-muted)]">Select any app icon to launch its full workspace</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-[var(--bw-muted)]" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter apps..."
            className="w-full h-10 ps-9 pe-4 rounded-full border border-[var(--bw-line)] bg-[var(--bw-card)] text-xs outline-none focus:border-[var(--bw-emerald)]"
          />
        </div>
      </div>

      {/* Desktop App-Icon Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {apps.map((app) => {
          const Icon = app.icon;
          return (
            <Link key={app.key} href={app.href} className="bw-app-tile p-5 flex flex-col justify-between gap-4 group">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className={`size-12 rounded-2xl flex items-center justify-center shadow-md ${iconBg[app.tone]}`}>
                    <Icon size={22} />
                  </div>
                  <StatusPill label={app.badge} tone={app.tone === 'gold' ? 'gold' : app.tone === 'emerald' ? 'emerald' : 'slate'} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold tracking-tight group-hover:text-[var(--bw-emerald)] transition">
                    {app.label}
                  </h3>
                  <p className="text-xs text-[var(--bw-muted)] mt-1 leading-relaxed">{app.blurb}</p>
                </div>
              </div>
              <div className="pt-3 border-t border-[var(--bw-line)] flex items-center justify-between text-[11px] font-bold text-[var(--bw-emerald)]">
                <span>Open App</span>
                <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
