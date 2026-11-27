'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Calculator,
  Crown,
  Database,
  Download,
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
  Smartphone,
  Sparkles,
  UserPlus,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { fmtAed, GlossyBlackCard, ShineLink, StatusPill } from '@/components/os/UiKit';
import { useInstantApi } from '@/lib/client-cache';

interface AppIconDef {
  key: string;
  label: string;
  group: string;
  blurb: string;
  badge: string;
  href: string;
  icon: LucideIcon;
  visible: boolean;
}

interface WorkspaceCardDef {
  id: string;
  title: string;
  href: string;
  icon: LucideIcon;
  style: 'glossy-black' | 'pearl-white';
  accent: 'emerald' | 'gold' | 'dual';
  previews: string[];
  featureCount: number;
  visible: boolean;
}

export default function OsAppLauncherPage() {
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
      activeFieldVisitsCount: number;
    };
  }>('/api/v1/dashboard/overview');

  const stats = overview?.kpis ?? null;

  const isOwner = Boolean(user?.isOwner);
  const isOwnerOrAdmin = user?.role === 'OWNER' || user?.role === 'OFFICE_ADMIN';
  const hasPipelineAccess = user?.role !== 'HR_MANAGER' && user?.role !== 'IT_MARKETING';
  const hasWebsiteStudioAccess = isOwnerOrAdmin || user?.role === 'IT_MARKETING';
  const ownerWorkspaceLabel = user?.email?.toLowerCase().includes('warda') ? "Warda's Workspace" : "Shabib's Workspace";

  const workspaceCards: WorkspaceCardDef[] = (
    [
      {
        id: 'executive',
        title: ownerWorkspaceLabel,
        href: '/os/executive',
        icon: Crown,
        style: 'glossy-black',
        accent: 'dual',
        previews: ['Team Roles, Daily To-Do & Field Verifiers', 'GPS Mortgage Field Meetings & Proofs', 'APL Brochures, Fillable Forms, Closings & Payouts'],
        featureCount: 11,
        visible: isOwner,
      },
      {
        id: 'mortgage-desk',
        title: '18-Bank Policy, RMs & Proposals',
        href: '/os/mortgage-desk',
        icon: Calculator,
        style: 'glossy-black',
        accent: 'emerald',
        previews: ['Live 18-Bank Rate Matrix & 140+ Direct Bank RMs', '3-Bank Auto-Eco Proposal & 300-Month Schedule', '60-Sec Matcher, AI Policy Finder & Statement Check'],
        featureCount: 8,
        visible: hasPipelineAccess,
      },
      {
        id: 'origination',
        title: 'Daily Leads & 12-Step Pipeline',
        href: '/os/pipeline',
        icon: KanbanSquare,
        style: 'pearl-white',
        accent: 'emerald',
        previews: ['12-Step UAE Mortgage Kanban Board', 'Daily Lead Capture & PDPL-Protected Client List', 'Live War Room & Coordinator Logins'],
        featureCount: 4,
        visible: hasPipelineAccess,
      },
      {
        id: 'finance',
        title: 'Accounts, Bank DSA & VAT 201',
        href: '/os/accounts',
        icon: Wallet,
        style: 'pearl-white',
        accent: 'gold',
        previews: ['Double-Entry Ledger & 5% UAE FTA VAT 201', 'Corporate-Account-Only RERA Partner Payouts', 'Advisor DSA Commission & Expense Tracker'],
        featureCount: isOwner ? 3 : 1,
        visible: isOwnerOrAdmin,
      },
      {
        id: 'team-field',
        title: 'Staff, Oud Metha QR & Field GPS',
        href: '/os/employees',
        icon: Users,
        style: 'pearl-white',
        accent: 'emerald',
        previews: ['Oud Metha 20s Rotating QR Check-In & WPS', 'GPS Mortgage Field Meetings & 1-Tap SOS', 'Team Group Channels (Inside)'],
        featureCount: 3,
        visible: true,
      },
      {
        id: 'forms-excel',
        title: 'All-Data Excel, Backups & AI',
        href: '/os/utilities',
        icon: Sparkles,
        style: 'glossy-black',
        accent: 'gold',
        previews: ['1-Click Full 17-Sheet Master Excel Workbook', 'Automated Daily Backup (Local + Cloud + GitHub)', '12 Fillable Word/JPEG Mortgage Forms & AI Copilot'],
        featureCount: 6,
        visible: true,
      },
    ] satisfies WorkspaceCardDef[]
  ).filter((c) => c.visible);

  const allApps: AppIconDef[] = [
    {
      key: 'executive',
      label: user?.executiveAppTitle || "Warda's Place",
      group: ownerWorkspaceLabel,
      blurb: 'Team daily tasks, GPS field meetings, bank brochures, Word/JPEG forms, 5-track closings, advisor payouts & VIP fast track.',
      badge: 'Owner Desk',
      href: '/os/executive',
      icon: Crown,
      visible: isOwner,
    },
    {
      key: 'dashboard',
      label: 'Daily Dashboard',
      group: 'Leads & Pipeline',
      blurb: 'Loan book totals, expected bank payouts, 12-step counts, your tasks today, team board & assigned clients.',
      badge: 'Live Pulse',
      href: '/os/dashboard',
      icon: LayoutDashboard,
      visible: true,
    },
    {
      key: 'mortgage-desk',
      label: '24-Bank & Proposal Hub',
      group: 'Bank Hub & Proposals',
      blurb: '18-bank live rates, 140+ bank RM contacts, 3-bank Auto-Eco Proposal Maker, 60-sec matcher, AI policy finder & statement analyzer.',
      badge: '18 Banks + 140 RMs',
      href: '/os/mortgage-desk',
      icon: Calculator,
      visible: hasPipelineAccess,
    },
    {
      key: 'pipeline',
      label: '12-Step Pipeline',
      group: 'Leads & Pipeline',
      blurb: 'Move every mortgage step-by-step from Enquiry and Pre-Approval to Valuation, FOL, e-NOC, Trustee Disbursal & Care.',
      badge: '12 Stages',
      href: '/os/pipeline',
      icon: KanbanSquare,
      visible: hasPipelineAccess,
    },
    {
      key: 'crm',
      label: 'Leads & Protected Vault',
      group: 'Leads & Pipeline',
      blurb: 'Capture every Website, WhatsApp, Call & Partner enquiry with PDPL phone masking and instant pipeline conversion.',
      badge: 'PDPL Safe',
      href: '/os/crm',
      icon: UserPlus,
      visible: hasPipelineAccess,
    },
    {
      key: 'command',
      label: 'Command Center',
      group: 'Leads & Pipeline',
      blurb: 'Live daily enquiry ticker, stage numbers, urgent alerts, office attendance, and active field GPS radar.',
      badge: 'War Room',
      href: '/os/command-center',
      icon: Radar,
      visible: true,
    },
    {
      key: 'vault',
      label: 'Client Document Vault',
      group: 'Bank Hub & Proposals',
      blurb: 'Safe encrypted storage for Passport, EID, Visa, Salary Certificate, 6-month Bank Statements, AECB, Form F & Title Deed.',
      badge: 'Encrypted',
      href: '/os/vault',
      icon: FileLock2,
      visible: hasPipelineAccess,
    },
    {
      key: 'sales',
      label: 'Quotes & RERA Partners',
      group: 'Bank Hub & Proposals',
      blurb: 'Share white-label client tracking cards, bank comparisons, Takaful/Golden Visa add-ons & RERA partner referrals.',
      badge: 'Client Tracker',
      href: '/os/sales',
      icon: Briefcase,
      visible: hasPipelineAccess,
    },
    {
      key: 'utilities',
      label: 'Excel, Daily Backups & Forms',
      group: 'Excel, Backups & AI',
      blurb: 'Download ALL OS data in 1 Master Excel file, run automated daily backups, and export Word/JPEG UAE mortgage forms.',
      badge: 'Full Excel + Backup',
      href: '/os/utilities',
      icon: Wrench,
      visible: true,
    },
    {
      key: 'accounts',
      label: 'Accounts & UAE VAT',
      group: 'Accounts & Bank DSA',
      blurb: 'Company accounting ledger, Bank DSA tax invoices, 5% UAE FTA VAT 201 & corporate-bank-only payout rules.',
      badge: 'FTA VAT',
      href: '/os/accounts',
      icon: Wallet,
      visible: isOwnerOrAdmin,
    },
    {
      key: 'master-log',
      label: 'Master Log (22 Lists)',
      group: 'Master Log & Rules',
      blurb: 'Central control for Communities, Developers, Banks, Staff Departments, Office Geofence, Chart of Accounts & VAT codes.',
      badge: isOwner ? 'Direct Control' : 'Approval Gated',
      href: '/os/master-log',
      icon: Database,
      visible: isOwnerOrAdmin,
    },
    {
      key: 'compliance',
      label: 'CBUAE Compliance',
      group: 'Master Log & Rules',
      blurb: 'CBUAE Key Facts Statement checks, AML screening, PDPL audit log & 2-of-2 Owner Delete Bin protection.',
      badge: 'CBUAE & PDPL',
      href: '/os/compliance',
      icon: ShieldCheck,
      visible: isOwnerOrAdmin,
    },
    {
      key: 'employees',
      label: 'Staff & Oud Metha QR',
      group: 'Team, QR & Field GPS',
      blurb: 'Team profiles, 20-second rotating office QR check-in, visas, leave requests & UAE WPS salary export.',
      badge: 'Office QR',
      href: '/os/employees',
      icon: Users,
      visible: true,
    },
    {
      key: 'field-gps',
      label: 'Mortgage Field GPS',
      group: 'Team, QR & Field GPS',
      blurb: 'GPS check-in & verified forensic reports for Bank RM, Valuation, Developer NOC & DLD Trustee meetings plus 1-Tap SOS.',
      badge: 'GPS + SOS',
      href: '/os/field-gps',
      icon: MapPin,
      visible: true,
    },
    {
      key: 'inside',
      label: 'Team Channels (Inside)',
      group: 'Team, QR & Field GPS',
      blurb: 'Internal channels and automatic live #attendance-checkin updates whenever staff scan in at Oud Metha.',
      badge: 'Live Chat',
      href: '/os/inside',
      icon: MessagesSquare,
      visible: true,
    },
    {
      key: 'ai',
      label: 'AI Mortgage Copilot',
      group: 'Excel, Backups & AI',
      blurb: 'Privacy-safe UAE mortgage helper trained on Betterway case studies & 18-bank credit policies.',
      badge: 'PII Safe AI',
      href: '/os/ai',
      icon: Sparkles,
      visible: true,
    },
    {
      key: 'website-studio',
      label: 'Website & Social Studio',
      group: 'Excel, Backups & AI',
      blurb: 'Update live rates, hot offers, banners & team cards on betterwaymortgages.com directly from the OS.',
      badge: 'Live Sync',
      href: '/os/website-studio',
      icon: Globe,
      visible: hasWebsiteStudioAccess,
    },
    {
      key: 'settings',
      label: 'Office & Mobile Settings',
      group: 'Master Log & Rules',
      blurb: 'Oud Metha geofence & Wi-Fi rules, automated daily backup schedule, website sync & Android/iOS mobile app setup.',
      badge: 'Config',
      href: '/os/settings',
      icon: Settings,
      visible: isOwnerOrAdmin,
    },
  ];

  const needle = filter.trim().toLowerCase();
  const visibleApps = allApps.filter((a) => a.visible);
  const matchingApps = needle
    ? visibleApps.filter((a) => `${a.label} ${a.group} ${a.blurb} ${a.badge}`.toLowerCase().includes(needle))
    : visibleApps;

  const firstName = user?.name?.split(' ')[0];

  return (
    <div className="space-y-7">
      {/* Premium White Hero Greeting + Glossy Black Action Strip */}
      <section className="flex flex-wrap items-end justify-between gap-4 pt-1">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0a0e14] text-[#34f0bc] text-[10.5px] font-extrabold uppercase tracking-[0.14em] mb-2.5 shadow-sm border border-[#22e2ad]/30">
            <img src="/brand/betterway-icon.svg" alt="" className="size-3.5" />
            Betterway Mortgages LLC · Dubai OS
          </div>
          <h1 className="font-display text-[30px] sm:text-[38px] font-extrabold tracking-[-0.035em] leading-[1.1] text-[var(--bw-ink)]">
            Welcome back{firstName ? `, ${firstName}` : ''}.
          </h1>
          <p className="text-[14px] text-[var(--bw-muted)] mt-1.5 max-w-[62ch]">
            Simple, fast control over every UAE mortgage — from 18-bank rate quotes and 140+ bank RMs to DLD Trustee disbursals and daily Excel backups.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a href="/api/v1/utilities/master-backup-excel" className="bw-btn bw-btn-outline group">
            <Download size={14} className="text-[#119c78]" /> All Data Excel
          </a>
          <ShineLink href="/os/dashboard" variant="obsidian">
            Dashboard
          </ShineLink>
          {isOwner && (
            <ShineLink href="/os/executive" variant="emerald">
              {ownerWorkspaceLabel}
            </ShineLink>
          )}
        </div>
      </section>

      {/* Glossy Floating Shining Black Executive Snapshot Ribbon */}
      <GlossyBlackCard className="p-5 sm:p-6" accent="dual">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-5 sm:gap-8">
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-400">Active Loan Book</div>
              <div className="font-display text-2xl sm:text-[28px] font-extrabold font-mono-num text-white mt-0.5">
                {fmtAed(stats?.loanBookAed ?? 0, true)}
              </div>
            </div>
            <div className="h-9 w-px bg-white/12 hidden sm:block" />
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#fbe8a4]">Expected Bank DSA</div>
              <div className="font-display text-2xl sm:text-[28px] font-extrabold font-mono-num text-[#34f0bc] mt-0.5">
                {fmtAed(stats?.expectedDsaAed ?? 0, true)}
              </div>
            </div>
            <div className="h-9 w-px bg-white/12 hidden md:block" />
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-400">Team Checked In</div>
              <div className="font-display text-2xl sm:text-[28px] font-extrabold font-mono-num text-[#fbe8a4] mt-0.5">
                {stats ? `${stats.checkedInCount}/${stats.totalStaffCount}` : '0/9'}
              </div>
            </div>
            <div className="h-9 w-px bg-white/12 hidden lg:block" />
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-400">Live Bank Panel</div>
              <div className="font-display text-2xl sm:text-[28px] font-extrabold font-mono-num text-white mt-0.5">
                24 Banks <span className="text-xs font-bold text-[#34f0bc]">· 140+ RMs</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/os/mortgage-desk"
              className="bw-btn bw-btn-gold text-xs py-2 min-h-[38px]"
            >
              <Calculator size={14} /> 3-Bank Proposal Maker
            </Link>
            <Link
              href="/os/utilities"
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-bold inline-flex items-center gap-1.5 transition"
            >
              <Smartphone size={14} className="text-[#34f0bc]" /> Daily Backup &amp; App
            </Link>
          </div>
        </div>

        {/* Owner 1-Click 6-Module Dock Inside Glossy Shining Black Card */}
        {isOwner && (
          <div className="mt-5 pt-4 border-t border-white/12">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[10.5px] font-extrabold uppercase tracking-[0.15em] text-[#fbe8a4]">
                {ownerWorkspaceLabel} · Quick Jump (Zero Loading)
              </span>
              <Link href="/os/executive" className="text-xs font-bold text-[#34f0bc] hover:underline inline-flex items-center gap-1">
                Open Full Desk <ArrowUpRight size={13} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
              {[
                { tab: 'team', label: 'Team & To-Do', hint: 'Roles & Verifiers' },
                { tab: 'visits', label: 'Field Meetings', hint: 'GPS + Proof Photos' },
                { tab: 'catalog', label: 'APL Brochures', hint: 'Colors & Templates' },
                { tab: 'legal', label: 'Word / JPEG Forms', hint: 'Fill & Seal Docs' },
                { tab: 'closings', label: '5-Track Closings', hint: 'Cheque Ledger' },
                { tab: 'commissions', label: 'DSA & Expenses', hint: 'Cash · BT · Botim' },
              ].map((q) => (
                <Link
                  key={q.tab}
                  href={`/os/executive?tab=${q.tab}`}
                  className="p-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.14] border border-white/10 hover:border-[#22e2ad]/60 transition group"
                >
                  <div className="font-extrabold text-white truncate flex items-center justify-between gap-1">
                    <span className="truncate">{q.label}</span>
                    <ArrowRight size={12} className="text-[#34f0bc] shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <div className="text-[10.5px] text-slate-300 mt-0.5 truncate">{q.hint}</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </GlossyBlackCard>

      {/* Instant Capsule Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="relative block w-full sm:w-[440px]">
          <Search size={17} className="absolute start-4 top-1/2 -translate-y-1/2 text-[#119c78] pointer-events-none" />
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Find any tool, bank rate, RM contact, proposal, or Excel export..."
            aria-label="Find a mortgage tool"
            className="w-full h-11 ps-11 pe-4 rounded-full bg-[var(--bw-card)] border border-[var(--bw-line-strong)] text-sm text-[var(--bw-ink)] shadow-[var(--bw-shadow-raised)] outline-none focus:border-[#119c78] focus:shadow-[var(--bw-focus-ring)]"
          />
        </label>
        <div className="text-xs text-[var(--bw-muted)] font-semibold">
          {workspaceCards.length} workspaces · {visibleApps.length} mortgage apps · 100% UAE CBUAE
        </div>
      </div>

      {/* Primary 3-Column Hybrid Glossy Black + Pure White Workspaces */}
      {!needle && (
        <>
          <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5" aria-label="Mortgage workspaces">
            {workspaceCards.map((card) => {
              const Icon = card.icon;
              const isDark = card.style === 'glossy-black';
              if (isDark) {
                return (
                  <Link key={card.id} href={card.href} className="block group">
                    <GlossyBlackCard className="p-6 min-h-[244px] h-full flex flex-col" accent={card.accent}>
                      <div className="flex items-center justify-between mb-5">
                        <span className="size-12 rounded-2xl bg-white/10 border border-[#22e2ad]/35 flex items-center justify-center text-[#34f0bc]">
                          <Icon size={24} strokeWidth={1.75} />
                        </span>
                        <span className="size-9 rounded-full bg-white/8 group-hover:bg-[#22e2ad] text-[#fbe8a4] group-hover:text-[#070e1a] flex items-center justify-center transition">
                          <ArrowUpRight size={17} />
                        </span>
                      </div>
                      <h2 className="font-display text-[21px] font-extrabold tracking-[-0.025em] text-white mb-3">
                        {card.title}
                      </h2>
                      <div className="grid gap-1.5 text-[12.5px] leading-snug text-slate-300 mb-6">
                        {card.previews.map((p) => (
                          <span key={p} className="flex items-center gap-2">
                            <span className="size-1.5 rounded-full bg-[#22e2ad] shrink-0" />
                            <span>{p}</span>
                          </span>
                        ))}
                      </div>
                      <div className="mt-auto flex items-center justify-between text-xs pt-3 border-t border-white/10">
                        <span className="text-slate-400 font-semibold">{card.featureCount} tools inside</span>
                        <span className="inline-flex items-center gap-1 font-extrabold text-[#34f0bc] group-hover:text-[#fbe8a4] transition">
                          Open now <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </GlossyBlackCard>
                  </Link>
                );
              }
              return (
                <Link
                  key={card.id}
                  href={card.href}
                  className="bw-card p-6 min-h-[244px] flex flex-col hover:-translate-y-1 hover:border-[#119c78]/60 hover:shadow-[var(--bw-shadow-floating)] group"
                >
                  <div className="flex items-center justify-between mb-5">
                    <span className="size-12 rounded-2xl bg-[#0a0e14] text-[#34f0bc] border border-[#22e2ad]/30 shadow-md flex items-center justify-center">
                      <Icon size={23} strokeWidth={1.75} />
                    </span>
                    <span className="size-9 rounded-full bg-[var(--bw-soft)] group-hover:bg-[#0a0e14] text-[var(--bw-ink)] group-hover:text-[#34f0bc] flex items-center justify-center transition">
                      <ArrowUpRight size={17} />
                    </span>
                  </div>
                  <h2 className="font-display text-[21px] font-extrabold tracking-[-0.025em] text-[var(--bw-ink)] mb-3">
                    {card.title}
                  </h2>
                  <div className="grid gap-1.5 text-[12.5px] leading-snug text-[var(--bw-muted)] mb-6">
                    {card.previews.map((p) => (
                      <span key={p} className="flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-[#119c78] shrink-0" />
                        <span>{p}</span>
                      </span>
                    ))}
                  </div>
                  <div className="mt-auto flex items-center justify-between text-xs pt-3 border-t border-[var(--bw-line)]">
                    <span className="text-[var(--bw-muted)] font-semibold">{card.featureCount} tools inside</span>
                    <span className="inline-flex items-center gap-1 font-extrabold text-[#0b5442] dark:text-[#34f0bc]">
                      Open now <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </section>

          {/* Simple 6-Step UAE Mortgage Journey Ribbon */}
          <nav
            className="bw-card px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-[var(--bw-body)]"
            aria-label="Simple Mortgage Flow"
          >
            <span className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#119c78] dark:text-[#34f0bc]">
              <span className="size-2 rounded-full bg-[#d9b356]" /> Simple Mortgage Flow
            </span>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {[
                ['01 New Lead', '/os/crm'],
                ['02 Bank Rates & Proposal', '/os/mortgage-desk'],
                ['03 Pre-Approval', '/os/pipeline'],
                ['04 Forms & e-NOC', '/os/utilities'],
                ['05 Disbursal', isOwner ? '/os/executive?tab=closings' : '/os/pipeline'],
                ['06 Bank Payout', isOwnerOrAdmin ? '/os/accounts' : '/os/dashboard'],
              ].map(([label, href]) => (
                <Link key={label} href={href} className="inline-flex items-center gap-1 hover:text-[#119c78] transition group">
                  {label} <ArrowUpRight size={13} className="text-[#119c78] transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </nav>
        </>
      )}

      {/* All Permitted Apps Grid */}
      <section className="space-y-3.5" aria-label="All Betterway OS applications">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-[var(--bw-ink)]">
              {needle ? `Matching Apps (${matchingApps.length})` : 'Every Tool in One Place'}
            </h2>
            <p className="text-xs text-[var(--bw-muted)]">Click any card to open instantly — zero waiting.</p>
          </div>
          {needle && (
            <button type="button" onClick={() => setFilter('')} className="bw-btn bw-btn-outline text-xs py-1.5 min-h-[34px]">
              Clear search
            </button>
          )}
        </div>

        {matchingApps.length === 0 ? (
          <div className="bw-card p-10 text-center space-y-3">
            <div className="text-sm font-bold">No matching mortgage tools found</div>
            <button type="button" onClick={() => setFilter('')} className="bw-btn bw-btn-outline">
              Show all tools
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {matchingApps.map((app) => {
              const Icon = app.icon;
              return (
                <Link key={app.key} href={app.href} className="bw-feature-card p-5 gap-3 group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="size-11 rounded-2xl bg-[#0a0e14] text-[#34f0bc] border border-[#22e2ad]/30 shadow-sm flex items-center justify-center shrink-0 group-hover:border-[#d9b356]/70 transition">
                        <Icon size={19} strokeWidth={1.8} />
                      </span>
                      <div className="min-w-0">
                        <div className="font-display text-[15px] font-extrabold text-[var(--bw-ink)] group-hover:text-[#119c78] transition truncate">
                          {app.label}
                        </div>
                        <div className="text-[11px] font-semibold text-[var(--bw-muted)] truncate">{app.group}</div>
                      </div>
                    </div>
                    <ArrowUpRight size={17} className="text-[#119c78] shrink-0 mt-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                  <p className="text-xs text-[var(--bw-muted)] leading-relaxed line-clamp-2">{app.blurb}</p>
                  <div className="mt-auto pt-1">
                    <StatusPill label={app.badge} tone="emerald" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
