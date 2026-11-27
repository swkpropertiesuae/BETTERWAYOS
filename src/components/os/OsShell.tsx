'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bell,
  Calculator,
  Check,
  ChevronRight,
  Crown,
  Database,
  Download,
  HelpCircle,
  KanbanSquare,
  Languages,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  MapPin,
  Moon,
  Search,
  Sparkles,
  Sun,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useOs } from './OsProvider';
import { StaffAvatar } from './UiKit';
import { EIBOR_SNAPSHOT } from '@/lib/domain/banks';
import { prefetchApi } from '@/lib/client-cache';

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
  const { user, dark, toggleDark, toggleRtl, logout } = useOs();
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchRes, setSearchRes] = useState<Array<{ type: string; title: string; subtitle: string; href: string }>>([]);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; body?: string; href?: string; is_read: boolean; created_at?: string }>>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [activeRailPopup, setActiveRailPopup] = useState<RailGroup | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  // Instant route prefetching for zero-loading clicks
  useEffect(() => {
    const warmRoutes = ['/os', '/os/dashboard', '/os/pipeline', '/os/mortgage-desk', '/os/executive', '/os/utilities', '/os/crm'];
    for (const r of warmRoutes) {
      router.prefetch(r);
    }
  }, [router]);

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
            description:
              'Owner desk for daily team tasks, GPS mortgage meetings, bank brochures, fillable Word/JPEG forms, 5-track closings, advisor payouts, and private VIP deals.',
            icon: Crown,
            primaryHref: '/os/executive',
            items: [
              { label: 'Team & Daily To-Do', href: '/os/executive?tab=team', badge: 'Verifiers' },
              { label: 'Mortgage Field Meetings', href: '/os/executive?tab=visits', badge: 'GPS' },
              { label: 'APL Catalog & Brochures', href: '/os/executive?tab=catalog', badge: '24 Banks' },
              { label: 'Mortgage Forms (Word / JPEG)', href: '/os/executive?tab=legal', badge: 'Fillable' },
              { label: 'Pin-to-Pin Disbursals (5 Tracks)', href: '/os/executive?tab=closings', badge: 'Cheques' },
              { label: 'Advisor DSA & Expenses', href: '/os/executive?tab=commissions', badge: 'BT / Botim' },
              { label: user?.privacyLaneTitle || 'Privacy Fast Track', href: '/os/executive?tab=fasttrack', badge: 'Private' },
              { label: 'Owner Approvals & VAT 201', href: '/os/executive?tab=approvals', badge: '1-of-2 / 2-of-2' },
            ],
          },
        ]
      : []),
    ...(hasPipelineAccess
      ? [
          {
            id: 'origination',
            label: 'Leads & Pipeline',
            shortLabel: 'Pipeline',
            description: 'Daily leads, phone-protected client list, 12-step mortgage board, and live war room.',
            icon: KanbanSquare,
            primaryHref: '/os/pipeline',
            items: [
              { label: '12-Step Mortgage Pipeline', href: '/os/pipeline', badge: 'Kanban' },
              { label: 'Daily Leads & Client Vault', href: '/os/crm', badge: 'PDPL' },
              { label: 'Command Center War Room', href: '/os/command-center', badge: 'Live' },
              { label: 'Daily Control Dashboard', href: '/os/dashboard', badge: 'Today' },
            ],
          },
          {
            id: 'desk',
            label: 'Bank Hub & Proposals',
            shortLabel: '24 Banks',
            description:
              'Live 18-bank policy & rates, 140+ bank RM contacts, 3-bank Auto-Eco Proposal Maker, 60-sec eligibility matcher, AI policy finder & statement check.',
            icon: Calculator,
            primaryHref: '/os/mortgage-desk',
            items: [
              { label: '18-Bank Rates, 140+ RMs & Proposals', href: '/os/mortgage-desk', badge: 'Pro Hub' },
              { label: 'Client Document Vault', href: '/os/vault', badge: 'Encrypted' },
              { label: 'Bank Quotes & Partner Desk', href: '/os/sales', badge: 'Share Link' },
            ],
          },
        ]
      : []),
    ...(isOwnerOrAdmin
      ? [
          {
            id: 'finance',
            label: 'Accounts & Bank DSA',
            shortLabel: 'Finance',
            description: 'Company ledger, 5% UAE VAT 201, bank DSA invoices, and corporate partner payouts.',
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
            label: 'Master Log & Rules',
            shortLabel: 'Master Log',
            description: '22 headquarters lists, CBUAE compliance, AML checks, delete bin, and office settings.',
            icon: Database,
            primaryHref: '/os/master-log',
            items: [
              { label: 'Master Log (22 Lists)', href: '/os/master-log', badge: 'CORE' },
              { label: 'CBUAE Rules & Delete Bin', href: '/os/compliance', badge: 'PDPL' },
              { label: 'Office & Backup Settings', href: '/os/settings', badge: 'Config' },
            ],
          },
        ]
      : []),
    {
      id: 'team',
      label: 'Team, QR & Field GPS',
      shortLabel: 'Field & QR',
      description: 'Oud Metha QR attendance, staff payroll/WPS, live GPS mortgage meetings with SOS, and team chat.',
      icon: Users,
      primaryHref: '/os/employees',
      items: [
        { label: 'Staff & Oud Metha QR Check-In', href: '/os/employees', badge: 'WPS' },
        { label: 'GPS Field Meetings & SOS', href: '/os/field-gps', badge: 'GPS + SOS' },
        { label: 'Team Channels (Inside)', href: '/os/inside', badge: 'Live Chat' },
      ],
    },
    {
      id: 'tools',
      label: 'Excel, Backups & AI',
      shortLabel: 'Excel & AI',
      description: 'Full-data Master Excel download, automated daily backups, fillable Word/JPEG forms, AI helper & live website editor.',
      icon: Sparkles,
      primaryHref: '/os/utilities',
      items: [
        { label: 'All-Data Excel, Backups & Forms', href: '/os/utilities', badge: 'Daily Backup' },
        { label: 'AI Case-Study Copilot', href: '/os/ai', badge: 'PII Safe' },
        ...(hasWebsiteAccess ? [{ label: 'Website & Social Studio', href: '/os/website-studio', badge: 'Live Sync' }] : []),
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
    '/os/crm': 'Leads & Vault',
    '/os/mortgage-desk': 'Bank Hub & Proposals',
    '/os/vault': 'Document Vault',
    '/os/sales': 'Quotes & Partners',
    '/os/accounts': 'Accounts & VAT',
    '/os/compliance': 'CBUAE Rules',
    '/os/master-log': 'Master Log',
    '/os/website-studio': 'Website Studio',
    '/os/employees': 'Staff & QR',
    '/os/inside': 'Team Chat',
    '/os/field-gps': 'Field GPS',
    '/os/ai': 'AI Copilot',
    '/os/utilities': 'Excel, Backups & Forms',
    '/os/settings': 'Settings',
  };
  const currentTitle =
    pageLabelMap[pathname] ||
    (pathname.startsWith('/os/master-log/') ? 'Master Log List' : 'Betterway OS');

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-[var(--bw-bg)] text-[var(--bw-ink)]">
      {/* Subtle Official Betterway Logo Jewel Top Accent Line */}
      <div
        className="h-[3px] w-full flex-none no-print"
        style={{ background: 'linear-gradient(90deg, #070e1a 0%, #119c78 36%, #22e2ad 62%, #d9b356 88%, #fbe8a4 100%)' }}
      />

      {/* Premium Pure White Floating Topbar */}
      <header className="flex-none min-h-[72px] px-4 lg:px-7 py-2.5 bg-white/90 dark:bg-[#080b10]/92 backdrop-blur-xl border-b border-[var(--bw-line)] flex flex-wrap items-center gap-2.5 lg:gap-4 no-print z-40">
        <Link href="/os" className="flex items-center gap-2.5 shrink-0 me-1 lg:me-3 group" aria-label="Betterway Mortgages OS Home">
          <img
            src={dark ? '/brand/betterway-logo-horizontal-dark-4k-transparent.png' : '/brand/betterway-logo-horizontal-light-4k-transparent.png'}
            alt="Betterway Mortgages"
            className="h-8 sm:h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
          />
          <span className="hidden xl:block leading-tight border-s border-[var(--bw-line-strong)] ps-2.5">
            <span className="block font-display text-[13px] font-extrabold tracking-tight text-[var(--bw-ink)]">
              Mortgages OS <span className="text-[#119c78] dark:text-[#34f0bc]">v3</span>
            </span>
            <span className="block text-[10px] font-bold text-[#9a7123] dark:text-[#fbe8a4]">Dubai · 24 UAE Banks</span>
          </span>
        </Link>

        {/* Primary Capsule Navigation Pills (White at rest, Glossy Black with Emerald glow when active) */}
        <nav
          className="flex items-center gap-1.5 overflow-x-auto max-w-full order-5 sm:order-none w-full sm:w-auto pt-1 sm:pt-0 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
          aria-label="Primary navigation"
        >
          <Link href="/os" onMouseEnter={() => prefetchApi('/api/v1/dashboard/overview')} className={`bw-primary-pill ${pathname === '/os' ? 'active' : ''}`}>
            <LayoutGrid size={14} className={pathname === '/os' ? 'text-[#34f0bc]' : ''} /> Home
          </Link>
          {isOwner && (
            <Link
              href="/os/executive"
              onMouseEnter={() => prefetchApi('/api/v1/executive/overview')}
              className={`bw-primary-pill ${pathname === '/os/executive' ? 'active' : ''}`}
            >
              <Crown size={14} className={pathname === '/os/executive' ? 'text-[#fbe8a4]' : 'text-[#b58a2d]'} />{' '}
              {user?.executiveAppTitle || "Warda's Place"}
            </Link>
          )}
          <Link href="/os/dashboard" onMouseEnter={() => prefetchApi('/api/v1/dashboard/overview')} className={`bw-primary-pill ${pathname === '/os/dashboard' ? 'active' : ''}`}>
            <LayoutDashboard size={14} className={pathname === '/os/dashboard' ? 'text-[#34f0bc]' : ''} /> Dashboard
          </Link>
          {hasPipelineAccess && (
            <>
              <Link href="/os/mortgage-desk" onMouseEnter={() => prefetchApi('/api/v1/mortgage-desk')} className={`bw-primary-pill ${pathname === '/os/mortgage-desk' ? 'active' : ''}`}>
                <Calculator size={14} className={pathname === '/os/mortgage-desk' ? 'text-[#34f0bc]' : ''} /> 24-Bank Hub
              </Link>
              <Link href="/os/pipeline" className={`bw-primary-pill ${pathname === '/os/pipeline' ? 'active' : ''}`}>
                <KanbanSquare size={14} className={pathname === '/os/pipeline' ? 'text-[#34f0bc]' : ''} /> 12-Step
              </Link>
            </>
          )}
        </nav>

        <div className="flex-1 hidden sm:block" />

        {/* Right Floating Utility Controls */}
        <div className="flex items-center gap-2 ms-auto sm:ms-0">
          <a
            href="/api/v1/utilities/master-backup-excel"
            className="hidden 2xl:inline-flex items-center gap-1.5 px-3.5 h-10 rounded-full bg-[#0a0e14] text-[#34f0bc] hover:text-white border border-[#22e2ad]/40 text-[11.5px] font-bold shadow-md transition hover:-translate-y-0.5"
            title="Download all live OS data in one Excel workbook"
          >
            <Download size={13} /> Full Excel
          </a>

          <span className="hidden xl:inline-flex items-center gap-1.5 px-3.5 h-10 rounded-full bg-[var(--bw-soft)] border border-[var(--bw-line)] text-[11.5px] font-mono-num font-bold text-[var(--bw-ink)]">
            <span className="size-2 rounded-full bg-[#22e2ad] shadow-[0_0_8px_#22e2ad]" />
            EIBOR {EIBOR_SNAPSHOT.latest.threeMonth.toFixed(2)}%
          </span>

          <button type="button" onClick={() => setSearchOpen(true)} className="bw-tb-btn" aria-label="Search OS">
            <Search size={15} />
            <span className="hidden md:inline">Search</span>
            <kbd className="hidden xl:inline text-[10px] px-1.5 py-0.5 rounded bg-[var(--bw-soft)] text-[var(--bw-muted)] border border-[var(--bw-line-strong)]">
              Ctrl K
            </kbd>
          </button>

          {/* Interactive Notification Bell Popover */}
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
                  unreadCount > 0 ? 'bg-[#e11d48] text-white' : 'bg-[var(--bw-soft)] text-[var(--bw-muted)]'
                }`}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </button>
            {notifOpen && (
              <div className="absolute end-0 mt-2 w-[340px] max-w-[90vw] bw-card shadow-2xl overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0a0e14] text-white">
                  <span className="font-display font-bold text-xs">Alerts ({unreadCount} unread)</span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => void markAllRead()}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#34f0bc] hover:underline cursor-pointer"
                    >
                      <Check size={12} /> Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-[var(--bw-line)]">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[var(--bw-muted)]">You are all caught up.</div>
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
                          {!n.is_read && <span className="size-2 rounded-full bg-[#119c78] mt-1.5 shrink-0" />}
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

          <button type="button" onClick={toggleRtl} className="bw-tb-btn px-2.5" title="Switch English / Arabic" aria-label="Switch language">
            <Languages size={15} />
          </button>

          <button type="button" onClick={toggleDark} className="bw-tb-btn px-2.5" title="Switch Light / Dark" aria-label="Toggle theme">
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {user && (
            <div className="inline-flex items-center gap-2 ps-1.5 pe-2 h-10 rounded-full bg-[#0a0e14] text-white border border-white/12 shadow-md">
              <StaffAvatar name={user.name} avatarUrl={user.avatarUrl} initials={user.initials} size="sm" />
              <div className="hidden lg:block leading-tight pe-1">
                <div className="text-[11.5px] font-bold flex items-center gap-1 text-white">
                  {user.name.split(' ')[0]}
                  {isOwner && <Crown size={11} className="text-[#fbe8a4]" />}
                </div>
                <div className="text-[9.5px] text-[#34f0bc] max-w-[110px] truncate">{user.designation}</div>
              </div>
              <button
                type="button"
                onClick={() => void logout()}
                className="size-7 rounded-full hover:bg-[#e11d48]/25 hover:text-[#fda4af] text-slate-300 flex items-center justify-center cursor-pointer transition"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut size={13} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Body: Left Shortcut Rail + Fast Scrolling Canvas */}
      <div className="flex flex-1 min-h-0">
        <nav className="bw-workspace-rail no-print" aria-label="Workspace shortcuts">
          <Link href="/os" className={`bw-rail-shortcut ${pathname === '/os' ? 'active' : ''}`} title="All Workspaces">
            <LayoutGrid size={19} />
            <span>Home</span>
          </Link>
          {railGroups.map((g) => {
            const Icon = g.icon;
            const isActive = activeRailGroup?.id === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onMouseEnter={() => router.prefetch(g.primaryHref)}
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
            title="Quick Guide & Mobile App"
          >
            <HelpCircle size={19} />
            <span>Guide</span>
          </button>
        </nav>

        <div className="flex-1 min-w-0 flex flex-col">
          <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pt-4 pb-24 sm:pb-10 scroll-smooth">
            <div className="w-full max-w-[1480px] mx-auto">
              {/* Shared Glossy Black Back Pill & Breadcrumb */}
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
                    <Link href="/os" className="inline-flex items-center gap-1 hover:text-[#119c78] font-bold">
                      <LayoutGrid size={13} /> Home
                    </Link>
                    {activeRailGroup && (
                      <>
                        <ChevronRight size={13} />
                        <button
                          type="button"
                          onClick={() => setActiveRailPopup(activeRailGroup)}
                          className="hover:text-[#119c78] font-bold cursor-pointer"
                        >
                          {activeRailGroup.label}
                        </button>
                      </>
                    )}
                    <ChevronRight size={13} />
                    <span className="font-extrabold text-[var(--bw-ink)]">{currentTitle}</span>
                  </nav>
                </div>
              )}

              {children}
            </div>
          </main>

          {/* Quiet Status Footer (Desktop) */}
          <footer className="hidden sm:flex flex-none px-5 py-2 bg-white/95 dark:bg-[#080b10] border-t border-[var(--bw-line)] text-[11px] text-[var(--bw-muted)] flex-wrap items-center justify-between gap-3 no-print">
            <span>
              Signed in: <strong className="text-[var(--bw-ink)]">{user?.email || 'Betterway Staff'}</strong>
            </span>
            <span className="font-mono-num">
              <DubaiClock />
            </span>
            <span className="font-bold text-[#0b5442] dark:text-[#34f0bc]">
              Betterway Mortgages LLC · Al Nasr Plaza, Oud Metha, Dubai
            </span>
          </footer>

          {/* Native Android & iOS Mobile Bottom Dock */}
          <nav
            className="bw-mobile-dock fixed bottom-0 inset-x-0 z-40 bg-[#070a0f]/95 backdrop-blur-xl border-t border-white/12 px-2 pt-2 items-center justify-around text-[10px] font-bold text-slate-300 no-print"
            aria-label="Mobile quick navigation"
          >
            {[
              { label: 'Home', href: '/os', icon: LayoutGrid },
              { label: 'Dashboard', href: '/os/dashboard', icon: LayoutDashboard },
              { label: '24 Banks', href: '/os/mortgage-desk', icon: Calculator },
              { label: 'Field GPS', href: '/os/field-gps', icon: MapPin },
              { label: isOwner ? 'Owner' : 'Forms', href: isOwner ? '/os/executive' : '/os/utilities', icon: isOwner ? Crown : Sparkles },
            ].map((m) => {
              const Icon = m.icon;
              const active = pathname === m.href;
              return (
                <Link
                  key={m.href}
                  href={m.href}
                  className={`flex flex-col items-center gap-1 px-2.5 py-1 rounded-xl transition ${
                    active ? 'text-[#34f0bc] bg-white/10' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  <span>{m.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Glossy Shining Black Workspace Quick-Jump Popup Modal */}
      {activeRailPopup && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 no-print"
          onClick={() => setActiveRailPopup(null)}
        >
          <div className="w-full max-w-2xl bw-card overflow-hidden bw-workspace-popup" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 bg-gradient-to-r from-[#070a0f] via-[#0e151f] to-[#052920] text-white border-b border-[#22e2ad]/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="size-11 rounded-2xl bg-white/10 border border-[#22e2ad]/35 flex items-center justify-center">
                  <activeRailPopup.icon size={21} className="text-[#34f0bc]" />
                </span>
                <div>
                  <h2 className="text-lg font-extrabold text-white">{activeRailPopup.label}</h2>
                  <p className="text-xs text-slate-300 mt-0.5">{activeRailPopup.description}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveRailPopup(null)}
                className="size-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
                aria-label="Close menu"
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
                    className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl bg-[var(--bw-soft)] hover:bg-[#090d13] text-[var(--bw-ink)] hover:text-white border border-[var(--bw-line)] hover:border-[#22e2ad]/50 font-bold text-xs transition group"
                  >
                    <span className="truncate">{item.label}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded-full bg-white dark:bg-white/10 text-[10px] font-extrabold text-[#0b5442] group-hover:bg-[#22e2ad]/20 group-hover:text-[#34f0bc]">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight size={15} className="text-[#119c78] group-hover:text-[#34f0bc] transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[var(--bw-line)]">
                <span className="text-[11px] font-semibold text-[var(--bw-muted)]">100% UAE CBUAE Mortgage Operations</span>
                <Link href={activeRailPopup.primaryHref} onClick={() => setActiveRailPopup(null)} className="bw-btn bw-btn-obsidian">
                  Open {activeRailPopup.label} <ChevronRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Command Palette Search (Ctrl+K) */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4 no-print"
          onClick={() => setSearchOpen(false)}
        >
          <div className="w-full max-w-xl bw-card overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-[var(--bw-line)]">
              <Search size={17} className="text-[#119c78]" />
              <input
                autoFocus
                value={searchQ}
                onChange={(e) => void runSearch(e.target.value)}
                placeholder="Search clients, case codes, 24 banks, bank RMs, developers..."
                className="flex-1 bg-transparent outline-none text-sm text-[var(--bw-ink)]"
              />
              <button type="button" onClick={() => setSearchOpen(false)} className="size-8 rounded-full hover:bg-[var(--bw-soft)] flex items-center justify-center cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-[var(--bw-line)]">
              {searchRes.length === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--bw-muted)]">
                  Type at least 2 characters to search across Betterway Mortgages OS.
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
                    <span className="px-2.5 py-0.5 rounded-full bg-[#0a0e14] text-[#34f0bc] text-[10px] font-bold uppercase">
                      {r.type}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Guide & Mobile App Install Modal */}
      {guideOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 no-print"
          onClick={() => setGuideOpen(false)}
        >
          <div className="w-full max-w-xl bw-card overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 bg-[#0a0e14] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img src="/brand/betterway-icon.svg" alt="" className="size-6" />
                <h3 className="font-display font-extrabold text-base">Quick Guide · Web, Excel &amp; Mobile App</h3>
              </div>
              <button type="button" onClick={() => setGuideOpen(false)} className="size-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-3.5 text-xs leading-relaxed text-[var(--bw-body)]">
              <div>
                <strong className="text-[var(--bw-ink)] font-display">1. Instant Search (Ctrl + K):</strong> Find any borrower, case, 24-bank rate, or developer in 1 second.
              </div>
              <div>
                <strong className="text-[var(--bw-ink)] font-display">2. Full Excel &amp; Daily Backup:</strong> Go to <strong>Excel, Backups &amp; Forms</strong> to download every single OS table in one `.xlsx` workbook or trigger an instant daily backup.
              </div>
              <div>
                <strong className="text-[var(--bw-ink)] font-display">3. Android &amp; iOS Mobile App:</strong> Install directly on iPhone (Share → Add to Home Screen) or Android Chrome (Install App), or build native `.apk` / `.ipa` from the included <code>mobile/</code> Capacitor project.
              </div>
              <div className="pt-2 border-t border-[var(--bw-line)] text-[11px] text-[var(--bw-muted)]">
                Betterway Mortgages LLC · Al Nasr Plaza, Oud Metha, Dubai · Asia/Dubai GST
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
