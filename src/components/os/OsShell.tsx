'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bell,
  Briefcase,
  Calculator,
  Check,
  ChevronRight,
  Crown,
  Database,
  FileLock2,
  Globe,
  HelpCircle,
  KanbanSquare,
  Languages,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  MapPin,
  MessagesSquare,
  Moon,
  Radar,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  UserPlus,
  Users,
  Wallet,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useOs } from './OsProvider';
import { StaffAvatar } from './UiKit';
import { EIBOR_SNAPSHOT } from '@/lib/domain/banks';

interface RailGroup {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  primaryHref: string;
  items: Array<{ label: string; href: string; badge?: string }>;
}

function DubaiClock({ compact = false }: { compact?: boolean }) {
  const [text, setText] = useState('');
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const t = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Dubai',
        day: compact ? undefined : '2-digit',
        month: compact ? undefined : 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
        .format(now)
        .toUpperCase();
      setText(compact ? `Dubai ${t} GST` : `${t} Asia/Dubai`);
    };
    update();
    const id = setInterval(update, 15_000);
    return () => clearInterval(id);
  }, [compact]);
  return <span>{text || 'Asia/Dubai GST'}</span>;
}

export function OsShell({ children }: { children: React.ReactNode }) {
  const { user, loading, dark, toggleDark, toggleRtl, logout } = useOs();
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchRes, setSearchRes] = useState<Array<{ type: string; title: string; subtitle: string; href: string }>>([]);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; body?: string; href?: string; is_read: boolean; created_at?: string }>>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [activeRailPopup, setActiveRailPopup] = useState<RailGroup | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotifOpen(false);
        setActiveRailPopup(null);
        setGuideOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch('/api/v1/notifications')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.notifications) setNotifications(d.notifications);
      })
      .catch(() => {});
  }, [user, pathname]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    try {
      await fetch('/api/v1/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      /* ignore */
    }
  };

  const runSearch = async (q: string) => {
    setSearchQ(q);
    if (q.trim().length < 2) {
      setSearchRes([]);
      return;
    }
    try {
      const r = await fetch(`/api/v1/utilities/search?q=${encodeURIComponent(q)}`);
      if (r.ok) {
        const d = await r.json();
        setSearchRes(d.results ?? []);
      }
    } catch {
      /* ignore */
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#025e3d] text-white">
        <div className="flex flex-col items-center gap-3.5">
          <img src="/brand/icon-gold.svg" alt="Betterway Mortgages" className="size-12 animate-pulse" />
          <div className="text-xs font-semibold tracking-[0.2em] uppercase text-[#d3eee0]">
            Opening Betterway Mortgages OS v3...
          </div>
        </div>
      </div>
    );
  }

  const isOwner = Boolean(user?.isOwner);
  const isOwnerOrAdmin = user?.role === 'OWNER' || user?.role === 'OFFICE_ADMIN';
  const hasPipelineAccess = user?.role !== 'HR_MANAGER' && user?.role !== 'IT_MARKETING';
  const hasWebsiteAccess = isOwnerOrAdmin || user?.role === 'IT_MARKETING';
  const ownerWorkspaceName = user?.email?.toLowerCase().includes('warda') ? "Warda's Workspace" : "Shabib's Workspace";

  const railGroups: RailGroup[] = [
    ...(isOwner
      ? [
          {
            id: 'executive',
            label: ownerWorkspaceName,
            shortLabel: user?.email?.toLowerCase().includes('warda') ? "Warda's" : "Shabib's",
            description: 'Co-Owner command sanctuary: daily team directives, GPS mortgage field meetings, APL brochures, CBUAE forms, 5-track disbursals, DSA ledger & Privacy Fast Track.',
            icon: Crown,
            primaryHref: '/os/executive',
            items: [
              { label: 'Team & Daily To-Do', href: '/os/executive?tab=team', badge: 'Verifiers' },
              { label: 'Mortgage Field Meetings', href: '/os/executive?tab=visits', badge: 'GPS' },
              { label: 'APL Catalog & Brochures', href: '/os/executive?tab=catalog', badge: '24 Banks' },
              { label: 'Mortgage Forms (Word / JPEG)', href: '/os/executive?tab=legal', badge: 'Fillable' },
              { label: 'Pin-to-Pin Disbursals (5 Tracks)', href: '/os/executive?tab=closings', badge: 'Cheques' },
              { label: 'Advisor DSA & Expenses', href: '/os/executive?tab=commissions', badge: 'BT/Botim' },
              { label: user?.privacyLaneTitle || 'Privacy Fast Track', href: '/os/executive?tab=fasttrack', badge: 'Private' },
              { label: 'All Owner Approvals & Consolidated VAT', href: '/os/executive?tab=approvals', badge: '1-of-2 / 2-of-2' },
            ],
          },
        ]
      : []),
    ...(hasPipelineAccess
      ? [
          {
            id: 'origination',
            label: 'Origination & Pipeline',
            shortLabel: 'Pipeline',
            description: '100% daily enquiry capture, PDPL-masked borrower vault, 12-stage CBUAE mortgage Kanban, and live command radar.',
            icon: KanbanSquare,
            primaryHref: '/os/pipeline',
            items: [
              { label: '12-Step Mortgage Pipeline', href: '/os/pipeline', badge: 'Kanban' },
              { label: 'Daily CRM & Masked Vault', href: '/os/crm', badge: 'PDPL' },
              { label: 'Command Center War Room', href: '/os/command-center', badge: 'Live' },
              { label: 'Business & Task Dashboard', href: '/os/dashboard', badge: 'Daily' },
            ],
          },
          {
            id: 'desk',
            label: '24-Bank Desk & Vault',
            shortLabel: '24 Banks',
            description: 'Compare 24 UAE Conventional & Islamic banks, run 8 CBUAE calculators, analyze CTO/Average Balance, and manage encrypted borrower vaults.',
            icon: Calculator,
            primaryHref: '/os/mortgage-desk',
            items: [
              { label: 'Mortgage Exclusive Desk (24 Banks)', href: '/os/mortgage-desk', badge: 'CBUAE' },
              { label: 'Client Document Vault', href: '/os/vault', badge: 'Encrypted' },
              { label: 'Bank Quotes & RERA Partner Hub', href: '/os/sales', badge: 'Proposals' },
            ],
          },
        ]
      : []),
    ...(isOwnerOrAdmin
      ? [
          {
            id: 'finance',
            label: 'Accounts, DSA & VAT',
            shortLabel: 'Finance',
            description: 'Double-entry GL, UAE 5% FTA VAT 201, Bank DSA invoices, and corporate-account-only ORN payout controls.',
            icon: Wallet,
            primaryHref: '/os/accounts',
            items: [
              { label: 'Accounts, GL & UAE 5% VAT 201', href: '/os/accounts', badge: 'IFRS' },
              ...(isOwner ? [{ label: 'Advisor DSA & Case Expenses', href: '/os/executive?tab=commissions', badge: 'Owner' }] : []),
              ...(isOwner ? [{ label: 'Owner Consolidated P&L & VAT', href: '/os/executive?tab=vat', badge: 'Consolidated' }] : []),
            ],
          },
          {
            id: 'governance',
            label: 'Master Log & Compliance',
            shortLabel: 'Master Log',
            description: '22 core headquarters registries, CBUAE KFS compliance, AML/goAML screening, 2-of-2 Delete Bin, and Oud Metha settings.',
            icon: Database,
            primaryHref: '/os/master-log',
            items: [
              { label: 'Master Log (22 CORE Registries)', href: '/os/master-log', badge: 'CORE' },
              { label: 'CBUAE Compliance & Delete Bin', href: '/os/compliance', badge: 'PDPL' },
              { label: 'System & Geofence Settings', href: '/os/settings', badge: 'Config' },
            ],
          },
        ]
      : []),
    {
      id: 'team',
      label: 'Team, QR & Field GPS',
      shortLabel: 'Field & QR',
      description: 'Oud Metha 20s rotating QR attendance, staff visas & WPS, GPS-pinned mortgage field meetings with SOS, and internal team channels.',
      icon: Users,
      primaryHref: '/os/employees',
      items: [
        { label: 'Employees & Oud Metha QR Attendance', href: '/os/employees', badge: 'WPS' },
        { label: 'Mortgage Field GPS & Forensic Reports', href: '/os/field-gps', badge: 'GPS + SOS' },
        { label: 'Team Group Channels (Inside)', href: '/os/inside', badge: 'Live Feed' },
      ],
    },
    {
      id: 'tools',
      label: 'Forms, AI & Website',
      shortLabel: 'Forms & AI',
      description: 'Fillable Word/JPEG UAE mortgage forms, 50-spec Excel Data Hub, PII-shielded Case-Study AI Copilot, and live betterwaymortgages.com studio.',
      icon: Sparkles,
      primaryHref: '/os/utilities',
      items: [
        { label: 'Mortgage Forms (Word/JPEG) & 50 Excel Hub', href: '/os/utilities', badge: '12 Forms' },
        { label: 'AI Case-Study Copilot', href: '/os/ai', badge: 'PII Shield' },
        ...(hasWebsiteAccess ? [{ label: 'Website & Social Studio (Live Sync)', href: '/os/website-studio', badge: 'CMS' }] : []),
      ],
    },
  ];

  const activeRailGroup = railGroups.find((g) =>
    g.items.some((i) => {
      const base = i.href.split('?')[0];
      return pathname === base || pathname.startsWith(base + '/');
    }),
  );

  const pageLabelMap: Record<string, string> = {
    '/os': 'Workspaces',
    '/os/executive': ownerWorkspaceName,
    '/os/dashboard': 'Dashboard',
    '/os/command-center': 'Command Center',
    '/os/pipeline': '12-Step Pipeline',
    '/os/crm': 'CRM & Masked Vault',
    '/os/mortgage-desk': '24-Bank Mortgage Desk',
    '/os/vault': 'Client Document Vault',
    '/os/sales': 'Bank Quotes & Partner Hub',
    '/os/accounts': 'Accounts & UAE VAT',
    '/os/compliance': 'CBUAE & PDPL Compliance',
    '/os/master-log': 'Master Log (CORE)',
    '/os/website-studio': 'Website & Social Studio',
    '/os/employees': 'Employees & Oud Metha QR',
    '/os/inside': 'Team Group (Inside)',
    '/os/field-gps': 'Mortgage Field GPS',
    '/os/ai': 'AI Case-Study Copilot',
    '/os/utilities': 'Mortgage Forms & 50 Excel Hub',
    '/os/settings': 'System Settings',
  };
  const currentTitle =
    pageLabelMap[pathname] ||
    (pathname.startsWith('/os/master-log/') ? 'Master Log Registry' : 'Operating Workspace');

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-[var(--bw-bg)] text-[var(--bw-ink)]">
      {/* Calm Operating Wallet Flat Topbar */}
      <header className="flex-none min-h-[76px] px-4 lg:px-7 py-3 bg-[var(--bw-bg)] flex flex-wrap items-center gap-2.5 lg:gap-4 no-print z-40">
        <Link href="/os" className="flex items-center gap-2.5 shrink-0 me-1 lg:me-3" aria-label="Betterway Mortgages OS Home">
          <img
            src={dark ? '/brand/logo-horizontal-dark.svg' : '/brand/logo-horizontal-light.svg'}
            alt="Betterway Mortgages"
            className="h-8 w-auto object-contain"
          />
          <span className="hidden xl:block leading-tight border-s border-[var(--bw-line-strong)] ps-2.5">
            <span className="block font-display text-[13.5px] font-extrabold tracking-tight text-[var(--bw-ink)]">Mortgages OS</span>
            <span className="block text-[10px] font-semibold text-[var(--bw-muted)]">CBUAE v3 · Dubai</span>
          </span>
        </Link>

        {/* Primary Capsule Navigation Pills (White at rest, Emerald when active) */}
        <nav className="flex items-center gap-1.5 overflow-x-auto max-w-full order-5 sm:order-none w-full sm:w-auto pt-1 sm:pt-0 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]" aria-label="Primary navigation">
          <Link href="/os" className={`bw-primary-pill ${pathname === '/os' ? 'active' : ''}`}>
            <LayoutGrid size={14} /> Workspaces
          </Link>
          {isOwner && (
            <Link href="/os/executive" className={`bw-primary-pill ${pathname === '/os/executive' ? 'active' : ''}`}>
              <Crown size={14} /> {user?.executiveAppTitle || "Warda's Place"}
            </Link>
          )}
          <Link href="/os/dashboard" className={`bw-primary-pill ${pathname === '/os/dashboard' ? 'active' : ''}`}>
            <LayoutDashboard size={14} /> Dashboard
          </Link>
          {hasPipelineAccess && (
            <Link href="/os/pipeline" className={`bw-primary-pill ${pathname === '/os/pipeline' ? 'active' : ''}`}>
              <KanbanSquare size={14} /> 12-Step
            </Link>
          )}
        </nav>

        <div className="flex-1 hidden sm:block" />

        {/* Right Floating Capsule Utility Toolbar */}
        <div className="flex items-center gap-2 ms-auto sm:ms-0">
          <span className="hidden 2xl:inline-flex items-center gap-1.5 px-3.5 h-10 rounded-full bg-[var(--bw-card)] text-[11.5px] font-mono-num font-bold text-[var(--bw-fold)] dark:text-[#b9dec9] shadow-[0_4px_12px_-8px_rgba(23,61,41,0.16)]">
            <span className="size-2 rounded-full bg-[#007b52]" />
            3M EIBOR {EIBOR_SNAPSHOT.latest.threeMonth.toFixed(3)}%
          </span>

          <button type="button" onClick={() => setSearchOpen(true)} className="bw-tb-btn" aria-label="Search OS">
            <Search size={15} />
            <span className="hidden md:inline">Search</span>
            <kbd className="hidden xl:inline text-[10px] px-1.5 py-0.5 rounded bg-[var(--bw-soft)] text-[var(--bw-muted)] border border-[var(--bw-line-strong)]">
              Ctrl K
            </kbd>
          </button>

          {/* Interactive Notification Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen((v) => !v)}
              className="bw-tb-btn px-3"
              aria-label={`Notifications, ${unreadCount} unread`}
            >
              <Bell size={15} />
              <span
                className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-extrabold ${
                  unreadCount > 0 ? 'bg-[#c32135] text-white' : 'bg-[var(--bw-soft)] text-[var(--bw-muted)]'
                }`}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </button>
            {notifOpen && (
              <div className="absolute end-0 mt-2 w-[340px] max-w-[90vw] bw-card shadow-2xl overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--bw-line)] bg-[var(--bw-soft)]">
                  <span className="font-display font-bold text-xs">Notifications ({unreadCount} unread)</span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => void markAllRead()}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--bw-emerald)] hover:underline cursor-pointer"
                    >
                      <Check size={12} /> Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-[var(--bw-line)]">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[var(--bw-muted)]">You&apos;re all caught up.</div>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          setNotifOpen(false);
                          if (n.href) router.push(n.href);
                        }}
                        className={`w-full text-start px-4 py-3 hover:bg-[var(--bw-hover)] cursor-pointer transition ${
                          !n.is_read ? 'bg-[var(--bw-mint-soft)]' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {!n.is_read && <span className="size-2 rounded-full bg-[var(--bw-emerald)] mt-1.5 shrink-0" />}
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[var(--bw-ink)]">{n.title}</div>
                            {n.body && <div className="text-[11px] text-[var(--bw-muted)] mt-0.5 line-clamp-2">{n.body}</div>}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button type="button" onClick={toggleRtl} className="bw-tb-btn px-2.5" title="Switch English / Arabic RTL" aria-label="Switch language">
            <Languages size={15} />
          </button>

          <button type="button" onClick={toggleDark} className="bw-tb-btn px-2.5" title="Toggle Light / Dark Theme" aria-label="Toggle theme">
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {user && (
            <div className="inline-flex items-center gap-2 ps-1.5 pe-2 h-10 rounded-full bg-[var(--bw-card)] shadow-[0_4px_12px_-8px_rgba(23,61,41,0.16)]">
              <StaffAvatar name={user.name} avatarUrl={user.avatarUrl} initials={user.initials} size="sm" />
              <div className="hidden lg:block leading-tight pe-1">
                <div className="text-[11.5px] font-bold flex items-center gap-1 text-[var(--bw-ink)]">
                  {user.name.split(' ')[0]}
                  {isOwner && <Crown size={11} className="text-[#d4af37]" />}
                </div>
                <div className="text-[9.5px] text-[var(--bw-muted)] max-w-[110px] truncate">{user.designation}</div>
              </div>
              <button
                type="button"
                onClick={() => void logout()}
                className="size-7 rounded-full hover:bg-[#fbe1e4] hover:text-[#c32135] flex items-center justify-center cursor-pointer transition"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut size={13} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Body: Left Narrow Shortcut Rail + Independent Scrolling Canvas */}
      <div className="flex flex-1 min-h-0">
        <nav className="bw-workspace-rail no-print" aria-label="Workspace shortcuts">
          <Link href="/os" className={`bw-rail-shortcut ${pathname === '/os' ? 'active' : ''}`} title="All Workspaces">
            <LayoutGrid size={19} />
            <span>Workspaces</span>
          </Link>
          {railGroups.map((g) => {
            const Icon = g.icon;
            const isActive = activeRailGroup?.id === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setActiveRailPopup(g)}
                aria-haspopup="dialog"
                className={`bw-rail-shortcut ${isActive ? 'active' : ''}`}
                title={g.label}
              >
                <Icon size={19} />
                <span>{g.shortLabel}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setGuideOpen(true)}
            className="bw-rail-shortcut mt-auto"
            title="Quick Guide & Shortcuts"
          >
            <HelpCircle size={19} />
            <span>Guide</span>
          </button>
        </nav>

        <div className="flex-1 min-w-0 flex flex-col">
          <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pt-3 pb-10 scroll-smooth">
            <div className="w-full max-w-[1480px] mx-auto">
              {/* Shared Section Back Button & Wayfinding Breadcrumb */}
              {pathname !== '/os' && (
                <div className="flex flex-wrap items-center gap-3 mb-5 no-print">
                  <button
                    type="button"
                    onClick={() => (window.history.length > 1 ? router.back() : router.push('/os'))}
                    className="bw-btn bw-btn-back"
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                  <nav className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--bw-muted)]" aria-label="Breadcrumb">
                    <Link href="/os" className="inline-flex items-center gap-1 hover:text-[var(--bw-emerald)] font-semibold">
                      <LayoutGrid size={13} /> Workspaces
                    </Link>
                    {activeRailGroup && (
                      <>
                        <ChevronRight size={13} />
                        <button
                          type="button"
                          onClick={() => setActiveRailPopup(activeRailGroup)}
                          className="hover:text-[var(--bw-emerald)] font-semibold cursor-pointer"
                        >
                          {activeRailGroup.label}
                        </button>
                      </>
                    )}
                    <ChevronRight size={13} />
                    <span className="font-bold text-[var(--bw-ink)]">{currentTitle}</span>
                  </nav>
                </div>
              )}

              {children}
            </div>
          </main>

          {/* Quiet Corporate Status Footer */}
          <footer className="flex-none px-5 py-2 bg-[var(--bw-bg)] border-t border-[var(--bw-line)] text-[11px] text-[var(--bw-muted)] flex flex-wrap items-center justify-between gap-3 no-print">
            <span>User: <strong className="text-[var(--bw-body)]">{user?.email || 'Authenticated'}</strong></span>
            <span className="hidden sm:inline font-mono-num"><DubaiClock /></span>
            <span className="font-semibold text-[var(--bw-fold)] dark:text-[#b9dec9]">
              Betterway Mortgages LLC · Al Nasr Plaza, Oud Metha, Dubai
            </span>
          </footer>
        </div>
      </div>

      {/* Calm Workspace Quick-Jump Popup Modal (from Left Shortcut Rail) */}
      {activeRailPopup && (
        <div
          className="fixed inset-0 z-50 bg-[#0b100e]/55 backdrop-blur-[2px] flex items-center justify-center p-4 no-print"
          onClick={() => setActiveRailPopup(null)}
        >
          <div
            className="w-full max-w-2xl bw-card overflow-hidden bw-workspace-popup"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 bg-[#025e3d] text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <activeRailPopup.icon size={22} className="text-[#fcf1b7]" />
                <div>
                  <h2 className="text-lg font-extrabold text-white">{activeRailPopup.label}</h2>
                  <p className="text-xs text-[#d3eee0] mt-0.5">{activeRailPopup.description}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveRailPopup(null)}
                className="size-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
                aria-label="Close workspace menu"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid sm:grid-cols-2 gap-2.5">
                {activeRailPopup.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setActiveRailPopup(null)}
                    className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl bg-[var(--bw-soft)] hover:bg-[var(--bw-mint)] text-[var(--bw-ink)] font-semibold text-xs transition group"
                  >
                    <span className="truncate">{item.label}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded-full bg-[var(--bw-card)] text-[10px] font-bold text-[var(--bw-fold)] dark:text-[#b9dec9]">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight size={15} className="text-[var(--bw-emerald)] transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[var(--bw-line)]">
                <span className="text-[11px] text-[var(--bw-muted)]">100% UAE CBUAE Mortgage Operations</span>
                <Link
                  href={activeRailPopup.primaryHref}
                  onClick={() => setActiveRailPopup(null)}
                  className="bw-btn bw-btn-primary"
                >
                  Open {activeRailPopup.label} <ChevronRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Command Palette Search (Ctrl+K / Cmd+K) */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#0b100e]/55 backdrop-blur-sm flex items-start justify-center pt-20 px-4 no-print"
          onClick={() => setSearchOpen(false)}
        >
          <div className="w-full max-w-xl bw-card overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-[var(--bw-line)]">
              <Search size={17} className="text-[var(--bw-emerald)]" />
              <input
                autoFocus
                value={searchQ}
                onChange={(e) => void runSearch(e.target.value)}
                placeholder="Search borrowers, mortgage case codes, 24 banks, communities, or developers..."
                className="flex-1 bg-transparent outline-none text-sm text-[var(--bw-ink)]"
              />
              <button type="button" onClick={() => setSearchOpen(false)} className="size-8 rounded-full hover:bg-[var(--bw-soft)] flex items-center justify-center cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-[var(--bw-line)]">
              {searchRes.length === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--bw-muted)]">
                  Type at least 2 characters to search across Betterway Mortgages OS (Privacy Fast Track strictly isolated to Owners).
                </div>
              ) : (
                searchRes.map((r, i) => (
                  <Link
                    key={`${r.href}-${i}`}
                    href={r.href}
                    onClick={() => setSearchOpen(false)}
                    className="flex items-center justify-between px-4 py-3 hover:bg-[var(--bw-hover)] text-xs"
                  >
                    <div>
                      <div className="font-bold text-[var(--bw-ink)]">{r.title}</div>
                      <div className="text-[var(--bw-muted)]">{r.subtitle}</div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[var(--bw-mint)] text-[var(--bw-fold)] dark:text-[#b9dec9] text-[10px] font-bold uppercase">
                      {r.type}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Guide Modal */}
      {guideOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#0b100e]/55 backdrop-blur-sm flex items-center justify-center p-4 no-print"
          onClick={() => setGuideOpen(false)}
        >
          <div className="w-full max-w-xl bw-card overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[var(--bw-line)] flex items-center justify-between bg-[var(--bw-soft)]">
              <h3 className="font-display font-extrabold text-base">Betterway Mortgages OS · Quick Guide</h3>
              <button type="button" onClick={() => setGuideOpen(false)} className="size-8 rounded-full hover:bg-[var(--bw-card)] flex items-center justify-center cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-3.5 text-xs leading-relaxed text-[var(--bw-body)]">
              <div>
                <strong className="text-[var(--bw-ink)] font-display">Search anything (Ctrl + K):</strong> Instantly find borrowers, mortgage case codes, 24 partner banks, APL developers, and communities.
              </div>
              <div>
                <strong className="text-[var(--bw-ink)] font-display">12-Step UAE Mortgage Flow:</strong> 01 Enquiry → 02 CBUAE Eligibility (50% DBR / LTV) → 03 Pick 24 Banks → 04 Vault Papers → 05 Pre-Approval (DIP) → 07 Valuation → 08 FOL → 09 Developer e-NOC → 10 DLD Trustee Disbursal → 11 Bank DSA Settlement → 12 Rate-Reset Watch.
              </div>
              <div>
                <strong className="text-[var(--bw-ink)] font-display">Owner Workspace (Warda &amp; Shabib):</strong> Manage daily advisor to-dos, verify GPS-pinned mortgage field meetings, build Bank-APL brochures, export Word/JPEG CBUAE forms, track 5-track disbursals, and settle advisor DSA &amp; RERA partner splits.
              </div>
              <div className="pt-2 border-t border-[var(--bw-line)] text-[11px] text-[var(--bw-muted)]">
                Betterway Mortgages LLC · Al Nasr Plaza, Oud Metha, Dubai · All timestamps in Asia/Dubai GST
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
