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
import { fmtAed, StatusPill } from '@/components/os/UiKit';

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
  tone: 'fold' | 'mint' | 'sand' | 'sky';
  previews: string[];
  featureCount: number;
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
  const hasPipelineAccess = user?.role !== 'HR_MANAGER' && user?.role !== 'IT_MARKETING';
  const hasWebsiteStudioAccess = isOwnerOrAdmin || user?.role === 'IT_MARKETING';
  const ownerWorkspaceLabel = user?.email?.toLowerCase().includes('warda') ? "Warda's Workspace" : "Shabib's Workspace";

  // Calm Operating Wallet Tinted Workspace Cards (3 columns alternating fold / mint / sand / sky)
  const workspaceCards: WorkspaceCardDef[] = (
    [
      {
        id: 'executive',
        title: ownerWorkspaceLabel,
        href: '/os/executive',
        icon: Crown,
        tone: 'fold',
        previews: ['Team & Daily To-Do + Verifiers', 'Mortgage Field Meetings (GPS)', 'APL Brochures, Forms, Disbursals & DSA'],
        featureCount: 11,
        visible: isOwner,
      },
      {
        id: 'origination',
        title: 'Origination & Pipeline',
        href: '/os/pipeline',
        icon: KanbanSquare,
        tone: isOwner ? 'mint' : 'fold',
        previews: ['12-Step Mortgage Kanban', '100% Daily Enquiry CRM & Masked Vault', 'Live Command Center Radar'],
        featureCount: 4,
        visible: hasPipelineAccess,
      },
      {
        id: 'mortgage-desk',
        title: '24-Bank Desk & Vault',
        href: '/os/mortgage-desk',
        icon: Calculator,
        tone: 'sand',
        previews: ['24 UAE Conventional & Islamic Banks', '8 CBUAE Calculators & CTO Analyzer', 'Encrypted Borrower Document Vault'],
        featureCount: 3,
        visible: hasPipelineAccess,
      },
      {
        id: 'finance',
        title: 'Accounts, Bank DSA & VAT',
        href: '/os/accounts',
        icon: Wallet,
        tone: 'sky',
        previews: ['Double-Entry GL & UAE 5% VAT 201', 'Corporate-Account-Only ORN Guard', 'Advisor DSA & Partner Settlements'],
        featureCount: isOwner ? 3 : 1,
        visible: isOwnerOrAdmin,
      },
      {
        id: 'team-field',
        title: 'Team, QR & Field GPS',
        href: '/os/employees',
        icon: Users,
        tone: 'mint',
        previews: ['Oud Metha 20s QR Attendance & WPS', 'GPS Mortgage Field Meetings & SOS', 'Team Group Channels (Inside)'],
        featureCount: 3,
        visible: true,
      },
      {
        id: 'forms-ai',
        title: 'Mortgage Forms, AI & Master Log',
        href: '/os/utilities',
        icon: Sparkles,
        tone: 'sand',
        previews: ['12 Fillable Word/JPEG CBUAE Forms', '50-Spec Excel Data Hub & AI Copilot', '22 CORE Registries, Compliance & CMS'],
        featureCount: 4,
        visible: true,
      },
    ] satisfies WorkspaceCardDef[]
  ).filter((c) => c.visible);

  const allApps: AppIconDef[] = [
    {
      key: 'executive',
      label: user?.executiveAppTitle || "Warda's Place",
      group: ownerWorkspaceLabel,
      blurb: `${user?.privacyLaneTitle || 'Privacy Fast Track'}, Team To-Do, Field Meetings, APL Brochures, CBUAE Forms, 5-Track Disbursals & DSA`,
      badge: 'Owner HQ',
      href: '/os/executive',
      icon: Crown,
      visible: isOwner,
    },
    {
      key: 'dashboard',
      label: 'Dashboard',
      group: 'Origination & Pipeline',
      blurb: 'Loan book, expected Bank DSA, 12-stage funnel, My Tasks Today, Team Task Monitor & Assigned Borrowers',
      badge: 'Daily Pulse',
      href: '/os/dashboard',
      icon: LayoutDashboard,
      visible: true,
    },
    {
      key: 'command',
      label: 'Command Center',
      group: 'Origination & Pipeline',
      blurb: 'Live daily enquiry ticker, 12-stage lead counts, critical alerts, Oud Metha attendance & field GPS radar',
      badge: 'War Room',
      href: '/os/command-center',
      icon: Radar,
      visible: true,
    },
    {
      key: 'pipeline',
      label: '12-Step Pipeline',
      group: 'Origination & Pipeline',
      blurb: 'Exact 1→12 UAE mortgage Kanban from Enquiry, Eligibility, 24 Banks & Papers to e-NOC, Disbursal & Care',
      badge: '12 Stages',
      href: '/os/pipeline',
      icon: KanbanSquare,
      visible: hasPipelineAccess,
    },
    {
      key: 'crm',
      label: 'CRM & Masked Vault',
      group: 'Origination & Pipeline',
      blurb: '100% daily enquiry ledger (Website, Chat, WhatsApp, Referrals), PDPL-masked borrower phones & call log',
      badge: 'PDPL Safe',
      href: '/os/crm',
      icon: UserPlus,
      visible: hasPipelineAccess,
    },
    {
      key: 'mortgage-desk',
      label: '24-Bank Mortgage Desk',
      group: '24-Bank Desk & Vault',
      blurb: 'Schedules, valuations, Form F/FOL deadlines, 24 UAE banks, 8 CBUAE calculators & CTO/Avg Balance analyzer',
      badge: '24 Banks',
      href: '/os/mortgage-desk',
      icon: Calculator,
      visible: hasPipelineAccess,
    },
    {
      key: 'vault',
      label: 'Client Document Vault',
      group: '24-Bank Desk & Vault',
      blurb: 'Encrypted Supabase vault: Passport, EID, Visa, Payslips, Salary Cert, 6m Bank, AECB, Form F, Oqood, Title Deed',
      badge: 'Encrypted',
      href: '/os/vault',
      icon: FileLock2,
      visible: hasPipelineAccess,
    },
    {
      key: 'sales',
      label: 'Quotes & RERA Partners',
      group: '24-Bank Desk & Vault',
      blurb: 'Branded bank comparison proposals, Takaful/Wills/Golden Visa cross-sell & RERA Partner Referral Hub',
      badge: 'Proposals',
      href: '/os/sales',
      icon: Briefcase,
      visible: hasPipelineAccess,
    },
    {
      key: 'accounts',
      label: 'Accounts & UAE VAT',
      group: 'Accounts, Bank DSA & VAT',
      blurb: 'Double-entry GL, Bank DSA invoices, UAE 5% VAT 201, PINT-AE XML & Corporate-Account-Only payout guard',
      badge: 'FTA VAT',
      href: '/os/accounts',
      icon: Wallet,
      visible: isOwnerOrAdmin,
    },
    {
      key: 'master-log',
      label: 'Master Log (CORE)',
      group: 'Governance & Compliance',
      blurb: '22 headquarters registries: Communities, Developers, Oud Metha Geofence, Departments, COA, VAT & 24 Banks',
      badge: isOwner ? 'Direct Control' : 'Approval Gated',
      href: '/os/master-log',
      icon: Database,
      visible: isOwnerOrAdmin,
    },
    {
      key: 'compliance',
      label: 'CBUAE Compliance',
      group: 'Governance & Compliance',
      blurb: 'CBUAE Joint KFS gate, AML sanctions screening, goAML XML, UAE PDPL audit trail & 2-of-2 Owner Delete Bin',
      badge: 'CBUAE & PDPL',
      href: '/os/compliance',
      icon: ShieldCheck,
      visible: isOwnerOrAdmin,
    },
    {
      key: 'website-studio',
      label: 'Website & Social Studio',
      group: 'Forms, AI & Website',
      blurb: 'Live two-way control of betterwaymortgages.com (Hot Offers, Bank Rates, Banners, Team) & UTM Campaigns',
      badge: 'Live Sync',
      href: '/os/website-studio',
      icon: Globe,
      visible: hasWebsiteStudioAccess,
    },
    {
      key: 'employees',
      label: 'Employees & QR',
      group: 'Team, QR & Field GPS',
      blurb: 'Official studio roster, 20s Oud Metha Office QR + Geofence check-in, Visas, Leave & MOHRE WPS .SIF',
      badge: 'Oud Metha QR',
      href: '/os/employees',
      icon: Users,
      visible: true,
    },
    {
      key: 'inside',
      label: 'Team Group (Inside)',
      group: 'Team, QR & Field GPS',
      blurb: 'Company channels & live #attendance-checkin feed automatically updated when staff scan Oud Metha QR',
      badge: 'Live Feed',
      href: '/os/inside',
      icon: MessagesSquare,
      visible: true,
    },
    {
      key: 'field-gps',
      label: 'Mortgage Field GPS',
      group: 'Team, QR & Field GPS',
      blurb: 'Track field staff live at Banks, Valuations, Developers & DLD Trustees with GPS pins & 1-Tap SOS alert',
      badge: 'GPS + SOS',
      href: '/os/field-gps',
      icon: MapPin,
      visible: true,
    },
    {
      key: 'ai',
      label: 'AI Case-Study Copilot',
      group: 'Forms, AI & Website',
      blurb: 'PII-shielded UAE mortgage AI grounded in Betterway case studies + Train New Scenario knowledge studio',
      badge: 'PII Shield',
      href: '/os/ai',
      icon: Sparkles,
      visible: true,
    },
    {
      key: 'utilities',
      label: 'Mortgage Forms & Excel',
      group: 'Forms, AI & Website',
      blurb: '12 fillable Word/JPEG CBUAE mortgage forms with Owner Corporate Seal, 9-Language Translator, OCR & 50 Excel Hub',
      badge: '50 Excel + Forms',
      href: '/os/utilities',
      icon: Wrench,
      visible: true,
    },
    {
      key: 'settings',
      label: 'Settings',
      group: 'Governance & Compliance',
      blurb: 'Oud Metha Wi-Fi/Geofence calibration, Reception QR rules, Website sync HMAC & Corporate IBAN whitelist',
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
      {/* Calm Operating Wallet Personal Greeting + Live Strip */}
      <section className="flex flex-wrap items-end justify-between gap-4 pt-1">
        <div>
          <h1 className="font-display text-[28px] sm:text-[36px] font-bold tracking-[-0.03em] leading-[1.15] text-[var(--bw-ink)]">
            Good to see you{firstName ? `, ${firstName}` : ''}.
          </h1>
          <p className="text-[13.5px] text-[var(--bw-muted)] mt-1.5 max-w-[58ch]">
            Enquiry to Pre-Approval. Valuation to DLD Trustee Disbursal. Choose where to work today.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {stats && (
            <div className="hidden xl:flex items-center gap-2 me-2 text-xs">
              <span className="px-3.5 py-2 rounded-full bg-[var(--bw-card)] border border-[var(--bw-line)] font-mono-num font-bold shadow-[var(--bw-shadow-raised)]">
                Loan Book <span className="text-[var(--bw-emerald)]">{fmtAed(stats.loanBookAed, true)}</span>
              </span>
              <span className="px-3.5 py-2 rounded-full bg-[var(--bw-card)] border border-[var(--bw-line)] font-mono-num font-bold shadow-[var(--bw-shadow-raised)]">
                Bank DSA <span className="text-[var(--bw-fold)] dark:text-[#b9dec9]">{fmtAed(stats.expectedDsaAed, true)}</span>
              </span>
              <span className="px-3.5 py-2 rounded-full bg-[var(--bw-card)] border border-[var(--bw-line)] font-mono-num font-bold shadow-[var(--bw-shadow-raised)]">
                Team {stats.checkedInCount}/{stats.totalStaffCount} In
              </span>
            </div>
          )}
          <Link href="/os/dashboard" className="bw-btn bw-btn-dark">
            <LayoutDashboard size={15} /> Dashboard
          </Link>
          {isOwner && (
            <Link href="/os/executive" className="bw-btn bw-btn-primary">
              <Crown size={15} /> {ownerWorkspaceLabel}
            </Link>
          )}
        </div>
      </section>

      {/* Owner Direct 1-Click Access Strip (6 UAE Mortgage Executive Modules) */}
      {isOwner && (
        <section className="bw-card p-5 space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--bw-emerald)]">
                {ownerWorkspaceLabel} · Direct 1-Click Access
              </div>
              <h2 className="font-display text-[15px] font-bold text-[var(--bw-ink)] mt-0.5">
                Executive Mortgage Operations, Field Meetings, APL Brochures, CBUAE Forms &amp; DSA Settlements
              </h2>
            </div>
            <Link href="/os/executive" className="text-xs font-bold text-[var(--bw-emerald)] hover:underline inline-flex items-center gap-1">
              Open Full Workspace <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
            {[
              { tab: 'team', label: 'Team & Daily To-Do', hint: 'Roles & Field Verifiers' },
              { tab: 'visits', label: 'Mortgage Field Meetings', hint: 'GPS + Bank RM + Verify' },
              { tab: 'catalog', label: 'APL Catalog & Brochures', hint: '24-Bank APL & Themes' },
              { tab: 'legal', label: 'Mortgage Forms Studio', hint: 'KFS · DIP · SOA · FOL' },
              { tab: 'closings', label: 'Pin-to-Pin Disbursals', hint: '5 Mortgage Tracks' },
              { tab: 'commissions', label: 'Advisor DSA & Expenses', hint: 'Cash · BT · Botim · ORN' },
            ].map((q) => (
              <Link
                key={q.tab}
                href={`/os/executive?tab=${q.tab}`}
                className="p-3.5 rounded-2xl bg-[var(--bw-soft)] hover:bg-[var(--bw-mint)] border border-[var(--bw-line)] transition group"
              >
                <div className="font-bold text-[var(--bw-ink)] truncate flex items-center justify-between gap-1">
                  <span className="truncate">{q.label}</span>
                  <ArrowUpRight size={13} className="text-[var(--bw-emerald)] shrink-0 opacity-70 group-hover:opacity-100" />
                </div>
                <div className="text-[11px] text-[var(--bw-muted)] mt-1 truncate">{q.hint}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Floating Capsule Workspace Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="relative block w-full sm:w-[420px]">
          <Search size={17} className="absolute start-4 top-1/2 -translate-y-1/2 text-[var(--bw-muted)] pointer-events-none" />
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Find a mortgage workspace, 24-bank tool, or workflow..."
            aria-label="Find a mortgage workspace or feature"
            className="w-full h-11 ps-11 pe-4 rounded-full bg-[var(--bw-card)] border border-[var(--bw-line)] text-sm text-[var(--bw-ink)] shadow-[var(--bw-shadow-raised)] outline-none focus:border-[var(--bw-emerald)] focus:shadow-[var(--bw-focus-ring)]"
          />
        </label>
        <div className="text-xs text-[var(--bw-muted)] font-medium">
          {workspaceCards.length} workspaces · {visibleApps.length} operating modules
        </div>
      </div>

      {/* Primary Tinted 3-Column Workspace Cards (Hidden while searching specific feature) */}
      {!needle && (
        <>
          <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5" aria-label="Mortgage workspaces">
            {workspaceCards.map((card) => {
              const Icon = card.icon;
              const isFold = card.tone === 'fold';
              return (
                <Link key={card.id} href={card.href} className={`bw-workspace-card tone-${card.tone}`}>
                  <div className={`flex items-center justify-between mb-6 ${isFold ? 'text-[#d3eee0]' : 'text-[var(--bw-emerald)]'}`}>
                    <Icon size={28} strokeWidth={1.65} />
                    <ArrowUpRight size={19} />
                  </div>
                  <h2 className={`font-display text-[22px] font-bold tracking-[-0.025em] mb-3 ${isFold ? 'text-white' : 'text-[var(--bw-ink)]'}`}>
                    {card.title}
                  </h2>
                  <div className={`grid gap-1.5 text-[12.5px] leading-snug mb-6 ${isFold ? 'text-[#d3eee0]' : 'text-[var(--bw-muted)]'}`}>
                    {card.previews.map((p) => (
                      <span key={p}>{p}</span>
                    ))}
                  </div>
                  <div className={`mt-auto flex items-center justify-between text-xs pt-2 ${isFold ? 'text-[#d3eee0]' : 'text-[var(--bw-muted)]'}`}>
                    <span>{card.featureCount} tools</span>
                    <span className={`inline-flex items-center gap-1 font-bold ${isFold ? 'text-white' : 'text-[var(--bw-emerald)]'}`}>
                      Open workspace <ArrowUpRight size={14} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </section>

          {/* Calm Mortgage Flow Ribbon (Enquiry to Bank DSA Settlement) */}
          <nav
            className="bw-card px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-[var(--bw-body)]"
            aria-label="UAE Mortgage Workflow from Enquiry to Bank DSA"
          >
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--bw-emerald)]">
              Enquiry to Bank DSA Flow
            </span>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {[
                ['01 Daily Enquiry', '/os/crm'],
                ['03 24-Bank Shortlist', '/os/mortgage-desk'],
                ['05 Pre-Approval (DIP)', '/os/pipeline'],
                ['08 FOL & e-NOC', '/os/utilities'],
                ['10 Trustee Disbursal', isOwner ? '/os/executive?tab=closings' : '/os/pipeline'],
                ['11 Bank DSA Settlement', isOwnerOrAdmin ? '/os/accounts' : '/os/dashboard'],
              ].map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  className="inline-flex items-center gap-1 hover:text-[var(--bw-emerald)] transition"
                >
                  {label} <ArrowUpRight size={13} className="text-[var(--bw-emerald)]" />
                </Link>
              ))}
            </div>
          </nav>
        </>
      )}

      {/* Full Permitted Feature Cards Grid (All 18 Operating Apps) */}
      <section className="space-y-3.5" aria-label="All Betterway OS applications">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold tracking-tight text-[var(--bw-ink)]">
              {needle ? `Matching Tools (${matchingApps.length})` : 'All Operating Applications'}
            </h2>
            <p className="text-xs text-[var(--bw-muted)]">
              Direct access to every permitted Betterway Mortgages OS application.
            </p>
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
              Reset filter
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
                      <span className="size-11 rounded-xl bg-[var(--bw-mint)] text-[var(--bw-fold)] dark:text-[#b9dec9] flex items-center justify-center shrink-0">
                        <Icon size={20} strokeWidth={1.75} />
                      </span>
                      <div className="min-w-0">
                        <div className="font-display text-[15px] font-bold text-[var(--bw-ink)] group-hover:text-[var(--bw-emerald)] transition truncate">
                          {app.label}
                        </div>
                        <div className="text-[11px] text-[var(--bw-muted)] truncate">{app.group}</div>
                      </div>
                    </div>
                    <ArrowUpRight size={17} className="text-[var(--bw-emerald)] shrink-0 mt-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
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
