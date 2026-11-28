'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  BookOpen,
  Briefcase,
  Calculator,
  ClipboardList,
  Crown,
  Database,
  FileLock2,
  Globe,
  GripVertical,
  KanbanSquare,
  LayoutDashboard,
  Lock,
  MapPin,
  MessagesSquare,
  Palette,
  PhoneCall,
  Pin,
  PinOff,
  Radar,
  Search,
  Settings,
  ShieldCheck,
  UserPlus,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { fmtAed, GlossyBlackCard, StaffAvatar } from '@/components/os/UiKit';
import { AnimatedAppIcon } from '@/components/os/AnimatedIcons';
import { LiveBankMarquee } from '@/components/os/LiveBankMarquee';
import { useInstantApi } from '@/lib/client-cache';
import { getExtensionForEmail } from '@/lib/sip-store';

interface OsAppTile {
  key: string;
  label: string;
  badge: string;
  badgeCls: string;
  iconBg: string;
  desc: string;
  href: string;
  icon: LucideIcon;
  visible: boolean;
}

export default function OsApplicationsLauncherPage() {
  const { user, uiConfig, setUiConfig, setCustomizerOpen, toast } = useOs();
  const [filter, setFilter] = useState('');
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const { data: overview } = useInstantApi<{
    kpis?: {
      loanBookAed: number;
      expectedDsaAed: number;
      todayEnquiriesCount: number;
      checkedInCount: number;
      totalStaffCount: number;
      pendingApprovalsCount: number;
    };
  }>('/api/v1/dashboard/overview');

  const kpis = overview?.kpis;
  const isOwner = Boolean(user?.isOwner);
  const isOwnerOrAdmin = user?.role === 'OWNER' || user?.role === 'OFFICE_ADMIN';
  const hasPipelineAccess = user?.role !== 'HR_MANAGER' && user?.role !== 'IT_MARKETING';
  const hasWebsiteAccess = isOwnerOrAdmin || user?.role === 'IT_MARKETING';
  const isShabib = Boolean(user?.email?.toLowerCase().includes('shabib'));
  const placeTitle = isShabib ? "Shabib's Place" : "Warda's Place";
  const cornerTitle = isShabib ? "Shabib's Corner" : "Warda's Corner";

  // Exact App Icon Colors, Badges & Placement Matching Uploaded Reference Screenshots 1 & 3
  const apps: OsAppTile[] = [
    {
      key: 'place',
      label: placeTitle,
      badge: 'Owner Daily Ops',
      badgeCls: 'bg-[#faf6ed] text-[#7d5b1c] border-[#e0cca0]',
      iconBg: 'bg-[#967028] text-white',
      desc: 'Daily UAE mortgage operations: Team & To-Do, Next Day Plan & Daily Report, GPS Field Meetings, APL Brochures, Word/JPEG Forms, 5-Track Disbursals & DSA',
      href: '/os/place',
      icon: Crown,
      visible: isOwner,
    },
    {
      key: 'corner',
      label: cornerTitle,
      badge: 'Owner Private HQ',
      badgeCls: 'bg-[#0b192c] text-[#dfc285] border-[#c49a45]/50',
      iconBg: 'bg-[#0b192c] text-[#dfc285] border border-[#c49a45]/40',
      desc: `${isShabib ? "Shabib's" : "Warda's"} Client — Privacy Fast Track, 1–12 Gold-Rush Kanban, Batch Sheet Upload, Owner Approvals (1-of-2 & 2-of-2) & Consolidated VAT`,
      href: '/os/corner',
      icon: Lock,
      visible: isOwner,
    },
    {
      key: 'command-center',
      label: 'Command Center',
      badge: 'Live War Room',
      badgeCls: 'bg-[#f1f5f9] text-[#334155] border-[#dce3ec]',
      iconBg: 'bg-[#10233e] text-white',
      desc: 'Live daily enquiry ticker, 12-stage lead counts, critical alerts, office attendance & field GPS radar',
      href: '/os/command-center',
      icon: Radar,
      visible: hasPipelineAccess,
    },
    {
      key: 'dashboard',
      label: 'Dashboard',
      badge: 'Daily Pulse',
      badgeCls: 'bg-[#eaf4f1] text-[#0a3f34] border-[#bddcd3]',
      iconBg: 'bg-[#0e5243] text-white',
      desc: 'Loan book, commissions, 12-stage funnel, My Tasks Today, Team Task Monitor & Assigned Clients',
      href: '/os/dashboard',
      icon: LayoutDashboard,
      visible: true,
    },
    {
      key: 'master-log',
      label: 'Master Log (CORE)',
      badge: 'Direct Owner Control',
      badgeCls: 'bg-[#eaf4f1] text-[#0a3f34] border-[#bddcd3]',
      iconBg: 'bg-[#0e5243] text-white',
      desc: '22 headquarters registries: Communities, Developers, Oud Metha Geofence, Departments, COA, VAT, 24 Banks',
      href: '/os/master-log',
      icon: Database,
      visible: isOwnerOrAdmin,
    },
    {
      key: 'pipeline',
      label: '12-Step Pipeline',
      badge: '12 Stages',
      badgeCls: 'bg-[#eaf4f1] text-[#0a3f34] border-[#bddcd3]',
      iconBg: 'bg-[#0e5243] text-white',
      desc: 'Exact 1–12 mortgage Kanban from Enquiry, Eligibility, Pick Banks & Papers to NOC, Commission & Care',
      href: '/os/pipeline',
      icon: KanbanSquare,
      visible: hasPipelineAccess,
    },
    {
      key: 'coordinator',
      label: 'Coordinator & Logins',
      badge: '32-Col Excel Flow',
      badgeCls: 'bg-[#eaf4f1] text-[#0a3f34] border-[#bddcd3]',
      iconBg: 'bg-[#0d4f49] text-[#64c4a8]',
      desc: 'CRM Excel 32-column Logins (7 tx types, 5 loan types, Banks 1/2/3), Docs Full/Incomplete, Valuation, FOL, Disbursed & Payouts',
      href: '/os/coordinator',
      icon: ClipboardList,
      visible: hasPipelineAccess,
    },
    {
      key: 'crm',
      label: 'CRM',
      badge: '100% Daily Log',
      badgeCls: 'bg-[#f1f5f9] text-[#334155] border-[#dce3ec]',
      iconBg: 'bg-[#1d3d63] text-white',
      desc: '100% exact daily enquiry ledger (Website, Chat, WhatsApp, Bayut, Referrals), Masked Client Vault & calls',
      href: '/os/crm',
      icon: UserPlus,
      visible: hasPipelineAccess,
    },
    {
      key: 'mortgage-desk',
      label: 'Mortgage Exclusive Desk',
      badge: '18 Banks + 159 RMs',
      badgeCls: 'bg-[#faf6ed] text-[#7d5b1c] border-[#e0cca0]',
      iconBg: 'bg-[#967028] text-white',
      desc: '3-Bank Auto-Eco Proposal Maker, 60-Sec Matcher & Policy Finder, 2026 18-Bank Matrix, 159 Direct RMs, CBUAE/CC/CTO & Valuations',
      href: '/os/mortgage-desk',
      icon: Calculator,
      visible: hasPipelineAccess,
    },
    {
      key: 'calculators',
      label: 'Calculators & Tools',
      badge: '12 UAE Tools',
      badgeCls: 'bg-[#eaf4f1] text-[#0a3f34] border-[#bddcd3]',
      iconBg: 'bg-[#0a3f34] text-[#64c4a8]',
      desc: 'All 12 UAE Mortgage Calculators: EMI, 50% DBR, DLD/ADM Cash-to-Close, Buyout/Equity, Prepayment, Rent vs Buy, Yield/DSCR, EIBOR Shock & Golden Visa',
      href: '/os/calculators',
      icon: Calculator,
      visible: true,
    },
    {
      key: 'sales',
      label: 'Sales & Services',
      badge: 'Quotes & Partners',
      badgeCls: 'bg-[#f1f5f9] text-[#334155] border-[#dce3ec]',
      iconBg: 'bg-[#10233e] text-white',
      desc: 'Branded bank comparison proposals, Live Borrower Share Card, Takaful/Wills/Golden Visa cross-sell & RERA Partner Referral Hub',
      href: '/os/sales',
      icon: Briefcase,
      visible: hasPipelineAccess,
    },
    {
      key: 'vault',
      label: 'Client Document Vault',
      badge: 'Private Storage',
      badgeCls: 'bg-[#f1f5f9] text-[#334155] border-[#dce3ec]',
      iconBg: 'bg-[#10233e] text-white',
      desc: 'Per-client encrypted Supabase vault: Passport, EID, Visa, Payslips, Salary Cert, 6m Bank, AECB, Form F, Oqood, Title Deed',
      href: '/os/vault',
      icon: FileLock2,
      visible: hasPipelineAccess,
    },
    {
      key: 'accounts',
      label: 'Accounts',
      badge: 'FTA VAT & GL',
      badgeCls: 'bg-[#faf6ed] text-[#7d5b1c] border-[#e0cca0]',
      iconBg: 'bg-[#967028] text-white',
      desc: 'Double-entry GL, Bank DSA Invoices, UAE 5% VAT 201, PINT-AE XML & Corporate-Account-Only payout guard',
      href: '/os/accounts',
      icon: Wallet,
      visible: isOwnerOrAdmin,
    },
    {
      key: 'compliance',
      label: 'Compliance',
      badge: 'CBUAE & PDPL',
      badgeCls: 'bg-[#f1f5f9] text-[#334155] border-[#dce3ec]',
      iconBg: 'bg-[#243852] text-white',
      desc: 'CBUAE Joint KFS gate, AML sanctions screening, goAML XML, UAE PDPL audit trail & 2-of-2 Owner Delete Bin',
      href: '/os/compliance',
      icon: ShieldCheck,
      visible: isOwnerOrAdmin,
    },
    {
      key: 'website-studio',
      label: 'Website & Social Studio',
      badge: 'Two-Way Live Sync',
      badgeCls: 'bg-[#eaf4f1] text-[#0a3f34] border-[#bddcd3]',
      iconBg: 'bg-[#0e5243] text-white',
      desc: 'Live two-way control of betterwaymortgages.com (Hot Offers, Bank Rates, Banners, Team) & Social UTM Campaigns',
      href: '/os/website-studio',
      icon: Globe,
      visible: hasWebsiteAccess,
    },
    {
      key: 'employees',
      label: 'Employees & Attendance',
      badge: 'Oud Metha QR',
      badgeCls: 'bg-[#f1f5f9] text-[#334155] border-[#dce3ec]',
      iconBg: 'bg-[#10233e] text-white',
      desc: '8-member studio roster, 20s Oud Metha Office QR + Geofence check-in, EID/Visa docs, Leave, Salary & MOHRE WPS .SIF',
      href: '/os/employees',
      icon: Users,
      visible: true,
    },
    {
      key: 'inside',
      label: 'Betterway Inside',
      badge: 'Channels & DMs',
      badgeCls: 'bg-[#eaf4f1] text-[#0a3f34] border-[#bddcd3]',
      iconBg: 'bg-[#1d3d63] text-white',
      desc: 'Dedicated company channels, 1-on-1 staff DMs, live #attendance-checkin Oud Metha QR feed, mortgage case cards & instant SIP dialing',
      href: '/os/inside',
      icon: MessagesSquare,
      visible: true,
    },
    {
      key: 'sip-calls',
      label: 'Betterway SIP Calls',
      badge: 'Cloud PBX + 159 RMs',
      badgeCls: 'bg-[#faf6ed] text-[#7d5b1c] border-[#e0cca0]',
      iconBg: 'bg-[#0b192c] text-[#64c4a8] border border-[#47a88d]/45',
      desc: 'UAE WebRTC SIP Softphone with DTMF keypad, Mute/Hold/Transfer, Extensions 100–108, 1-click 159 Bank RMs speed-dial & CDR call logs',
      href: '/os/sip-calls',
      icon: PhoneCall,
      visible: true,
    },
    {
      key: 'field-gps',
      label: 'Field GPS Services',
      badge: 'Live GPS + SOS',
      badgeCls: 'bg-[#eaf4f1] text-[#0a3f34] border-[#bddcd3]',
      iconBg: 'bg-[#0e5243] text-white',
      desc: 'Track field staff live at Banks, Valuations, Developers & DLD Trustees with GPS pins & 1-Tap SOS alert',
      href: '/os/field-gps',
      icon: MapPin,
      visible: true,
    },
    {
      key: 'ai',
      label: 'Underwriting Case Playbook',
      badge: 'Credit Desk Library',
      badgeCls: 'bg-[#f1f5f9] text-[#334155] border-[#dce3ec]',
      iconBg: 'bg-[#0a3f34] text-[#dfc285]',
      desc: '15 years of verified Betterway UAE mortgage structuring playbooks, bank exception precedents & credit desk memos — PDPL redacted',
      href: '/os/ai',
      icon: BookOpen,
      visible: true,
    },
    {
      key: 'utilities',
      label: 'Utilities & Documents',
      badge: '17-Sheet + 2026 Matrix',
      badgeCls: 'bg-[#faf6ed] text-[#7d5b1c] border-[#e0cca0]',
      iconBg: 'bg-[#967028] text-white',
      desc: '17-Sheet Master Excel & Daily Backup, Recreated 2026 Bank Matrix (.xlsx), Word/JPEG Studio, 9-Language Translator & OCR',
      href: '/os/utilities',
      icon: Wrench,
      visible: true,
    },
    {
      key: 'settings',
      label: 'Settings',
      badge: 'System Config',
      badgeCls: 'bg-[#f1f5f9] text-[#334155] border-[#dce3ec]',
      iconBg: 'bg-[#10233e] text-white',
      desc: 'Oud Metha Wi-Fi/Geofence calibration, Reception QR rules, Website sync HMAC & Corporate IBAN whitelist',
      href: '/os/settings',
      icon: Settings,
      visible: isOwnerOrAdmin,
    },
  ].filter((a) => a.visible);

  // Betterway Inside & SIP Calls are elevated into their own highlighted Live Communications Suite above the main grid!
  const coreApps = apps.filter((a) => a.key !== 'inside' && a.key !== 'sip-calls');
  const myExt = getExtensionForEmail(user?.email);

  const q = filter.trim().toLowerCase();
  const orderIndex = (k: string) => {
    const idx = uiConfig.appOrder.indexOf(k);
    return idx === -1 ? 999 : idx;
  };
  const orderedApps = [...coreApps].sort((a, b) => orderIndex(a.key) - orderIndex(b.key));
  const visibleApps = orderedApps.filter(
    (a) => !q || a.label.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q) || a.badge.toLowerCase().includes(q),
  );
  const pinnedApps = orderedApps.filter((a) => uiConfig.pinnedAppKeys.includes(a.key));

  const togglePin = (e: React.MouseEvent, key: string, label: string) => {
    e.preventDefault();
    e.stopPropagation();
    const exists = uiConfig.pinnedAppKeys.includes(key);
    const next = exists ? uiConfig.pinnedAppKeys.filter((k) => k !== key) : [key, ...uiConfig.pinnedAppKeys];
    setUiConfig({ ...uiConfig, pinnedAppKeys: next });
    toast(exists ? `Unpinned ${label}` : `Pinned ${label} to your top bar!`);
  };

  const handleDropApp = (targetKey: string) => {
    if (!draggedKey || draggedKey === targetKey) return;
    const keys = orderedApps.map((a) => a.key);
    const from = keys.indexOf(draggedKey);
    const to = keys.indexOf(targetKey);
    if (from < 0 || to < 0) return;
    const [moved] = keys.splice(from, 1);
    keys.splice(to, 0, moved);
    setDraggedKey(null);
    setUiConfig({ ...uiConfig, appOrder: keys });
    toast('App order updated & saved!');
  };

  return (
    <div className="space-y-6">
      {/* Exact Glossy Floating Shining Black Welcome Hero Banner (Matches Uploaded Screenshot 1) */}
      <GlossyBlackCard className="p-6 sm:p-7 space-y-5" accent="dual">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {user && <StaffAvatar name={user.name} avatarUrl={user.avatarUrl} initials={user.initials} size="lg" />}
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#dfc285]">
                <Crown size={11} className="text-[#c49a45]" /> {placeTitle.toUpperCase()} · EQUAL CO-OWNER CONTROL
              </div>
              <h1 className="font-display text-2xl sm:text-[30px] font-extrabold tracking-[-0.03em] text-white mt-1 leading-tight">
                Welcome back, <span className="text-[#64c4a8]">{user?.name || 'Betterway Team'}</span>
              </h1>
              <p className="text-xs text-slate-300 mt-0.5">
                {user?.designation || 'Mortgage Advisory'} · Al Nasr Plaza, Oud Metha, Dubai · Connected live to betterwaymortgages.com
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isOwner && (
              <>
                <Link href="/os/place" className="bw-btn bw-btn-gold text-xs py-2 min-h-[36px] px-4">
                  <Crown size={13} /> Open {placeTitle}
                </Link>
                <Link
                  href="/os/corner"
                  className="px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/18 border border-[#c49a45]/45 text-[#dfc285] text-xs font-extrabold inline-flex items-center gap-1.5 transition"
                >
                  <Lock size={12} /> {cornerTitle}
                </Link>
              </>
            )}
            {hasPipelineAccess && (
              <Link href="/os/pipeline" className="bw-btn bw-btn-primary text-xs py-2 min-h-[36px] px-4">
                <KanbanSquare size={13} /> 12-Step Pipeline
              </Link>
            )}
            <Link
              href="/os/employees"
              className="px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/18 border border-white/15 text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 transition"
            >
              <Users size={13} /> Check-In ({kpis ? `${kpis.checkedInCount}/${kpis.totalStaffCount}` : '0/9'})
            </Link>
          </div>
        </div>

        {/* 4 Clean Inner KPI Boxes Matching Screenshot 1 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="rounded-2xl bg-white/[0.05] border border-white/10 px-4 py-3.5">
            <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Active Loan Book</div>
            <div className="font-display text-xl sm:text-2xl font-extrabold font-mono-num text-white mt-1">
              {fmtAed(kpis?.loanBookAed ?? 0, true)}
            </div>
          </div>
          <div className="rounded-2xl bg-white/[0.05] border border-white/10 px-4 py-3.5">
            <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Expected Bank DSA</div>
            <div className="font-display text-xl sm:text-2xl font-extrabold font-mono-num text-[#64c4a8] mt-1">
              {fmtAed(kpis?.expectedDsaAed ?? 0, true)}
            </div>
          </div>
          <div className="rounded-2xl bg-white/[0.05] border border-white/10 px-4 py-3.5">
            <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Today&apos;s Enquiries (GST)</div>
            <div className="font-display text-xl sm:text-2xl font-extrabold font-mono-num text-[#64c4a8] mt-1">
              {kpis?.todayEnquiriesCount ?? 0} Logged
            </div>
          </div>
          <div className="rounded-2xl bg-white/[0.05] border border-white/10 px-4 py-3.5">
            <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Pending Owner Approvals</div>
            <div className="font-display text-xl sm:text-2xl font-extrabold font-mono-num text-[#dfc285] mt-1">
              {kpis?.pendingApprovalsCount ?? 0} Waiting
            </div>
          </div>
        </div>
      </GlossyBlackCard>

      {/* Live Dual-Band 18 UAE Bank Logos + CBUAE EIBOR / DLD / LTV Marquee */}
      <LiveBankMarquee />

      {/* Highlighted Dedicated Live Communications Zone — Betterway Inside & SIP Voice (Elevated Apart from Standard Apps) */}
      <section aria-label="Betterway Live Communications Suite" className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#0a3f34] dark:text-[#64c4a8]">
            <span className="size-2 rounded-full bg-[#47a88d] animate-pulse" />
            Live Desk Communications · Direct Team Messaging &amp; UAE Cloud SIP
          </div>
          <span className="text-[11px] font-mono-num font-bold text-[var(--bw-muted)]">
            Assigned Line: Ext {myExt.ext} · Oud Metha PBX Active
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Highlighted Card 1: Betterway Inside */}
          <Link
            href="/os/inside"
            className="group bw-glossy-black p-5 sm:p-6 flex flex-col justify-between gap-4 border-[#47a88d]/45 hover:border-[#64c4a8]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <span className="size-13 rounded-2xl bg-gradient-to-br from-[#0e5a49]/35 to-[#0c2838]/60 border border-[#64c4a8]/50 text-[#64c4a8] flex items-center justify-center shadow-lg shrink-0">
                  <AnimatedAppIcon name="inside" size={26} />
                </span>
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#64c4a8]">
                    <span className="size-1.5 rounded-full bg-[#64c4a8] animate-pulse" /> Dedicated Messaging Studio
                  </div>
                  <h2 className="font-display text-xl font-extrabold text-white mt-0.5 truncate">Betterway Inside</h2>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#47a88d]/15 border border-[#47a88d]/40 text-[#64c4a8] text-[10px] font-extrabold whitespace-nowrap">
                8 Channels · 7 DMs
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Private company channels, 1-on-1 staff DMs, automatic Oud Metha Reception QR check-in cards, Mortgage Case sharing, live field pins &amp; reactions.
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/12">
              <div className="flex flex-wrap gap-1.5 text-[10.5px] font-bold">
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[#dfc285]">#attendance-checkin</span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-200">#bank-rm-updates</span>
                {isOwner && <span className="px-2.5 py-0.5 rounded-full bg-[#c49a45]/20 text-[#dfc285]">#owners-private</span>}
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#64c4a8] group-hover:translate-x-0.5 transition">
                Open Inside <ArrowUpRight size={14} />
              </span>
            </div>
          </Link>

          {/* Highlighted Card 2: Betterway SIP Calls */}
          <Link
            href="/os/sip-calls"
            className="group bw-glossy-black p-5 sm:p-6 flex flex-col justify-between gap-4 border-[#c49a45]/45 hover:border-[#dfc285]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <span className="size-13 rounded-2xl bg-gradient-to-br from-[#c49a45]/30 to-[#3a2d15]/60 border border-[#dfc285]/50 text-[#dfc285] flex items-center justify-center shadow-lg shrink-0">
                  <AnimatedAppIcon name="sip-calls" size={26} />
                </span>
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#dfc285]">
                    <span className="size-1.5 rounded-full bg-[#64c4a8] animate-pulse" /> UAE Cloud PBX &amp; Softphone
                  </div>
                  <h2 className="font-display text-xl font-extrabold text-white mt-0.5 truncate">Betterway SIP Calls</h2>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#c49a45]/20 border border-[#dfc285]/40 text-[#dfc285] text-[10px] font-extrabold whitespace-nowrap">
                Ext {myExt.ext} · 159 Bank RMs
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Live browser WebRTC SIP dialpad with DTMF audio tones, Mute/Hold/Blind Transfer, CBUAE call recording audit, internal Extensions 100–108 &amp; 1-click speed-dial across 159 UAE Bank RMs.
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/12">
              <div className="flex flex-wrap gap-1.5 text-[10.5px] font-bold">
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[#64c4a8]">SIP Registered</span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-200">PDPL CDR Log</span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[#dfc285]">Etisalat / du / 3CX</span>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#dfc285] group-hover:translate-x-0.5 transition">
                Open SIP Desk <ArrowUpRight size={14} />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* Pinned Important Options Strip (Instant Access + Customisable) */}
      {pinnedApps.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-[#7d5b1c] dark:text-[#dfc285]">
            <Pin size={11} /> Pinned:
          </span>
          {pinnedApps.map((p) => {
            return (
              <Link
                key={`pin-${p.key}`}
                href={p.href}
                className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-[#0f2036] border border-[#c49a45]/60 hover:bg-[#0b192c] hover:text-[#64c4a8] text-[11.5px] font-bold shadow-xs transition"
              >
                <AnimatedAppIcon name={p.key} size={14} className="text-[#0e5a49]" /> {p.label}
              </Link>
            );
          })}
        </div>
      )}

      {/* Section Header + Customise UI + Right Filter Pill (Exact Match to Screenshot 1) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div>
          <h2 className="font-display text-lg font-extrabold text-[var(--bw-ink)]">Betterway OS Applications</h2>
          <p className="text-xs text-[var(--bw-muted)]">Select any app icon to launch · Drag cards to reorder or click the pin icon</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setCustomizerOpen(true)}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-[#0b192c] text-[#dfc285] border border-[#c49a45]/45 text-xs font-extrabold cursor-pointer hover:brightness-110 transition"
          >
            <Palette size={13} className="text-[#64c4a8]" /> Customise UI
          </button>
          <label className="flex items-center gap-2 px-3.5 h-9 rounded-full bg-white dark:bg-[#0e1d33] border border-[var(--bw-line)] focus-within:border-[#0e5a49] flex-1 sm:flex-none sm:w-60 shadow-xs">
            <Search size={13} className="text-[var(--bw-muted)] shrink-0" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter apps..."
              className="flex-1 bg-transparent outline-none text-xs text-[var(--bw-ink)] placeholder:text-[var(--bw-muted)]"
            />
          </label>
        </div>
      </div>

      {/* Exact 4-Column White Application Grid (Now Fully Draggable & Pinnable!) */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Betterway OS Applications">
        {visibleApps.map((app) => {
          const isPinned = uiConfig.pinnedAppKeys.includes(app.key);
          return (
            <Link
              key={app.key}
              href={app.href}
              draggable
              data-pinned={isPinned ? 'true' : 'false'}
              onDragStart={() => setDraggedKey(app.key)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleDropApp(app.key);
              }}
              className={`bw-app-card group rounded-[var(--bw-card-radius,20px)] bg-[var(--bw-card)] border ${
                isPinned ? 'border-[#c49a45]' : 'border-[var(--bw-line)]'
              } hover:border-[var(--bw-emerald)] p-5 shadow-[var(--bw-shadow-raised)] hover:shadow-[var(--bw-shadow-floating)] hover:-translate-y-0.5 transition flex flex-col justify-between min-h-[196px]`}
            >
              <div className="space-y-3.5">
                <div className="flex items-start justify-between gap-2">
                  <span className={`size-12 rounded-[15px] flex items-center justify-center shadow-md shrink-0 transition-transform duration-300 group-hover:scale-105 ${app.iconBg}`}>
                    <AnimatedAppIcon name={app.key} size={23} />
                  </span>
                  <div className="flex items-center gap-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${app.badgeCls}`}>
                      {app.badge}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => togglePin(e, app.key, app.label)}
                      title={isPinned ? 'Unpin app' : 'Pin important app'}
                      aria-label={isPinned ? `Unpin ${app.label}` : `Pin ${app.label}`}
                      className={`size-6 rounded-full flex items-center justify-center cursor-pointer transition ${
                        isPinned
                          ? 'bg-[#0b192c] text-[#dfc285]'
                          : 'opacity-50 group-hover:opacity-100 hover:bg-[var(--bw-soft)] text-[var(--bw-muted)]'
                      }`}
                    >
                      {isPinned ? <PinOff size={11} /> : <Pin size={11} />}
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="font-display text-[15px] font-extrabold text-[var(--bw-ink)] group-hover:text-[var(--bw-emerald)] transition flex items-center gap-1">
                    <span className="truncate">{app.label}</span>
                  </h3>
                  <p className="text-[11.5px] text-[var(--bw-muted)] mt-1 leading-relaxed line-clamp-3">{app.desc}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-[var(--bw-line)]/70 text-[11.5px] font-extrabold text-[var(--bw-emerald)]">
                <span className="inline-flex items-center gap-1">
                  Open App
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <GripVertical size={12} className="text-[var(--bw-muted)] opacity-45 group-hover:opacity-100" />
                  <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
