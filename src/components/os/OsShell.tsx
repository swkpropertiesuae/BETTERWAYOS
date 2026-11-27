'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Bell,
  Briefcase,
  Calculator,
  Check,
  Crown,
  KanbanSquare,
  Languages,
  LayoutDashboard,
  LayoutGrid,
  Lock,
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
import { prefetchApi } from '@/lib/client-cache';

interface SubPageDef {
  label: string;
  href: string;
  matchPath?: string;
  matchTab?: string;
  gold?: boolean;
}

interface SidebarAppDef {
  id: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  primaryHref: string;
  matchPrefixes: string[];
  matchSection?: 'place' | 'corner';
  goldAccent?: boolean;
  prefetchUrl?: string;
  subPages: SubPageDef[];
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
  const searchParams = useSearchParams();
  const router = useRouter();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchRes, setSearchRes] = useState<Array<{ type: string; title: string; subtitle: string; href: string }>>([]);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; body?: string; href?: string; is_read: boolean; created_at?: string }>>([]);
  const [notifOpen, setNotifOpen] = useState(false);

  const currentTab = searchParams?.get('tab') || '';
  const currentSection = searchParams?.get('section') || '';

  // Instant route prefetching for zero-loading sidebar clicks
  useEffect(() => {
    const warmRoutes = [
      '/os',
      '/os/place',
      '/os/corner',
      '/os/dashboard',
      '/os/pipeline',
      '/os/coordinator',
      '/os/mortgage-desk',
      '/os/accounts',
      '/os/employees',
      '/os/utilities',
    ];
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
  const isShabib = Boolean(user?.email?.toLowerCase().includes('shabib'));
  const placeName = isShabib ? "Shabib's Place" : "Warda's Place";
  const cornerName = isShabib ? "Shabib's Corner" : "Warda's Corner";

  // Direct Sidebar App Registry: clicking an icon opens the App immediately; its sub-pages appear cleanly in the Top Header
  const sidebarApps: SidebarAppDef[] = useMemo(
    () => [
      {
        id: 'home',
        label: 'Home',
        shortLabel: 'Home',
        icon: LayoutGrid,
        primaryHref: '/os',
        matchPrefixes: ['/os'],
        prefetchUrl: '/api/v1/dashboard/overview',
        subPages: [],
      },
      ...(isOwner
        ? [
            {
              id: 'place',
              label: `${placeName} (Daily Operations)`,
              shortLabel: isShabib ? "Shabib's\nPlace" : "Warda's\nPlace",
              icon: Briefcase,
              primaryHref: '/os/place?tab=team',
              matchPrefixes: ['/os/place', '/os/executive'],
              matchSection: 'place' as const,
              prefetchUrl: '/api/v1/executive/overview',
              subPages: [
                { label: 'Team & To-Do', href: '/os/place?tab=team', matchPath: '/os/place', matchTab: 'team' },
                { label: 'Next Day & Daily Report', href: '/os/place?tab=daily-plan', matchPath: '/os/place', matchTab: 'daily-plan' },
                { label: 'Field Meetings (GPS)', href: '/os/place?tab=visits', matchPath: '/os/place', matchTab: 'visits' },
                { label: 'APL Brochures', href: '/os/place?tab=catalog', matchPath: '/os/place', matchTab: 'catalog' },
                { label: 'Forms (Word/JPEG)', href: '/os/place?tab=legal', matchPath: '/os/place', matchTab: 'legal' },
                { label: '5-Track Disbursals', href: '/os/place?tab=closings', matchPath: '/os/place', matchTab: 'closings' },
                { label: 'DSA & Expenses', href: '/os/place?tab=commissions', matchPath: '/os/place', matchTab: 'commissions' },
              ],
            },
            {
              id: 'corner',
              label: `${cornerName} (Private Fast Track)`,
              shortLabel: isShabib ? "Shabib's\nCorner" : "Warda's\nCorner",
              icon: Crown,
              primaryHref: '/os/corner?tab=fasttrack',
              matchPrefixes: ['/os/corner', '/os/executive'],
              matchSection: 'corner' as const,
              goldAccent: true,
              prefetchUrl: '/api/v1/executive/overview',
              subPages: [
                { label: 'Privacy Fast Track', href: '/os/corner?tab=fasttrack', matchPath: '/os/corner', matchTab: 'fasttrack', gold: true },
                { label: 'Owner Approvals', href: '/os/corner?tab=approvals', matchPath: '/os/corner', matchTab: 'approvals', gold: true },
                { label: 'Consolidated P&L & VAT', href: '/os/corner?tab=vat', matchPath: '/os/corner', matchTab: 'vat', gold: true },
                { label: 'Bulk AI Upload', href: '/os/corner?tab=bulkai', matchPath: '/os/corner', matchTab: 'bulkai', gold: true },
                { label: 'Gold-Rush & Audit', href: '/os/corner?tab=goldrush', matchPath: '/os/corner', matchTab: 'goldrush', gold: true },
              ],
            },
          ]
        : []),
      {
        id: 'dashboard',
        label: 'Dashboard',
        shortLabel: 'Dashboard',
        icon: LayoutDashboard,
        primaryHref: '/os/dashboard',
        matchPrefixes: ['/os/dashboard', '/os/command-center'],
        prefetchUrl: '/api/v1/dashboard/overview',
        subPages: [
          { label: 'Daily Control Desk', href: '/os/dashboard', matchPath: '/os/dashboard' },
          { label: 'Command Center', href: '/os/command-center', matchPath: '/os/command-center' },
        ],
      },
      ...(hasPipelineAccess
        ? [
            {
              id: 'pipeline',
              label: 'Pipeline, Logins & Coordinator',
              shortLabel: 'Pipeline',
              icon: KanbanSquare,
              primaryHref: '/os/pipeline',
              matchPrefixes: ['/os/pipeline', '/os/coordinator', '/os/crm', '/os/sales'],
              subPages: [
                { label: '12-Step Pipeline', href: '/os/pipeline', matchPath: '/os/pipeline' },
                { label: 'Coordinator & Logins', href: '/os/coordinator', matchPath: '/os/coordinator' },
                { label: 'Daily Leads (PDPL)', href: '/os/crm', matchPath: '/os/crm' },
                { label: 'Quotes & Partners', href: '/os/sales', matchPath: '/os/sales' },
              ],
            },
            {
              id: 'banks',
              label: '18-Bank Hub, RMs & Proposals',
              shortLabel: '24 Banks',
              icon: Calculator,
              primaryHref: '/os/mortgage-desk?tab=proposal',
              matchPrefixes: ['/os/mortgage-desk'],
              prefetchUrl: '/api/v1/mortgage-desk',
              subPages: [
                { label: '3-Bank Proposal', href: '/os/mortgage-desk?tab=proposal', matchPath: '/os/mortgage-desk', matchTab: 'proposal' },
                { label: '60-Sec Matcher & AI', href: '/os/mortgage-desk?tab=matcher', matchPath: '/os/mortgage-desk', matchTab: 'matcher' },
                { label: '18-Bank 2026 Matrix', href: '/os/mortgage-desk?tab=matrix', matchPath: '/os/mortgage-desk', matchTab: 'matrix' },
                { label: '159 Direct RMs', href: '/os/mortgage-desk?tab=rms', matchPath: '/os/mortgage-desk', matchTab: 'rms' },
                { label: 'CBUAE, CC & CTO', href: '/os/mortgage-desk?tab=cbuae', matchPath: '/os/mortgage-desk', matchTab: 'cbuae' },
                { label: 'Valuations & Logos', href: '/os/mortgage-desk?tab=valuations', matchPath: '/os/mortgage-desk', matchTab: 'valuations' },
              ],
            },
          ]
        : []),
      ...(isOwnerOrAdmin
        ? [
            {
              id: 'finance',
              label: 'Accounts, Payouts & Master Log',
              shortLabel: 'Accounts',
              icon: Wallet,
              primaryHref: '/os/accounts',
              matchPrefixes: ['/os/accounts', '/os/master-log', '/os/compliance'],
              subPages: [
                { label: 'Accounts & VAT 201', href: '/os/accounts', matchPath: '/os/accounts' },
                { label: 'Master Log (22)', href: '/os/master-log', matchPath: '/os/master-log' },
                { label: 'CBUAE Rules', href: '/os/compliance', matchPath: '/os/compliance' },
              ],
            },
          ]
        : []),
      {
        id: 'team',
        label: 'Employees, Attendance, Salary & GPS',
        shortLabel: 'Team & HR',
        icon: Users,
        primaryHref: '/os/employees',
        matchPrefixes: ['/os/employees', '/os/field-gps', '/os/inside'],
        subPages: [
          { label: 'Employees, Leave & Salary', href: '/os/employees', matchPath: '/os/employees' },
          { label: 'Field GPS & SOS', href: '/os/field-gps', matchPath: '/os/field-gps' },
          { label: 'Team Chat (Inside)', href: '/os/inside', matchPath: '/os/inside' },
        ],
      },
      {
        id: 'utilities',
        label: 'Excel, Daily Backups, Vault & AI',
        shortLabel: 'Excel & AI',
        icon: Sparkles,
        primaryHref: '/os/utilities',
        matchPrefixes: ['/os/utilities', '/os/vault', '/os/ai', '/os/website-studio', '/os/settings'],
        subPages: [
          { label: 'Excel & Daily Backup', href: '/os/utilities', matchPath: '/os/utilities' },
          { label: 'Client Vault', href: '/os/vault', matchPath: '/os/vault' },
          { label: 'AI Copilot', href: '/os/ai', matchPath: '/os/ai' },
          ...(hasWebsiteAccess ? [{ label: 'Website Studio', href: '/os/website-studio', matchPath: '/os/website-studio' }] : []),
          ...(isOwnerOrAdmin ? [{ label: 'Settings', href: '/os/settings', matchPath: '/os/settings' }] : []),
        ],
      },
    ],
    [hasPipelineAccess, hasWebsiteAccess, isOwner, isOwnerOrAdmin, isShabib, placeName, cornerName],
  );

  // Determine active sidebar app
  const activeApp = useMemo(() => {
    if (pathname === '/os') return sidebarApps[0];
    if (pathname === '/os/place') return sidebarApps.find((a) => a.id === 'place') || sidebarApps[0];
    if (pathname === '/os/corner') return sidebarApps.find((a) => a.id === 'corner') || sidebarApps[0];
    if (pathname === '/os/executive') {
      const cornerTabs = new Set(['fasttrack', 'approvals', 'vat', 'bulkai', 'goldrush']);
      if (currentSection === 'corner' || cornerTabs.has(currentTab)) {
        return sidebarApps.find((a) => a.id === 'corner') || sidebarApps[0];
      }
      return sidebarApps.find((a) => a.id === 'place') || sidebarApps[0];
    }
    return (
      sidebarApps.find(
        (a) => a.id !== 'home' && a.matchPrefixes.some((p) => pathname === p || pathname.startsWith(p + '/')),
      ) || sidebarApps[0]
    );
  }, [pathname, currentSection, currentTab, sidebarApps]);

  const isSubPageActive = (sp: SubPageDef, idx: number): boolean => {
    if (sp.matchTab) {
      if (pathname === sp.matchPath || (pathname === '/os/executive' && (sp.matchPath === '/os/place' || sp.matchPath === '/os/corner'))) {
        if (currentTab) return currentTab === sp.matchTab;
        return idx === 0;
      }
      return false;
    }
    if (sp.matchPath) {
      return pathname === sp.matchPath || pathname.startsWith(sp.matchPath + '/');
    }
    return false;
  };

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-[var(--bw-bg)] text-[var(--bw-ink)]">
      {/* Subtle Betterway Logo Jewel Top Accent Line */}
      <div
        className="h-[3px] w-full flex-none no-print"
        style={{ background: 'linear-gradient(90deg, #05080d 0%, #119c78 36%, #22e2ad 60%, #d9b356 86%, #fbe8a4 100%)' }}
      />

      {/* Clean Minimal Topbar: Betterway Logo (Shining Black Home Icon) + Dynamic App Sub-Pages ONLY (Zero Static Header Buttons!) */}
      <header className="flex-none min-h-[64px] px-3 sm:px-5 py-2 bg-[#fffcf4]/95 dark:bg-[#080b10]/95 backdrop-blur-xl border-b border-[var(--bw-line)] flex flex-wrap lg:flex-nowrap items-center gap-3 no-print z-40">
        <Link href="/os" className="flex items-center shrink-0 group" aria-label="Betterway Mortgages OS Home">
          <img
            src={dark ? '/brand/betterway-logo-horizontal-dark-transparent.svg' : '/brand/betterway-logo-horizontal-light-transparent.svg'}
            alt="Betterway Mortgages"
            className="h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
          />
        </Link>

        {/* Dynamic Sub-Pages Bar: ONLY shown when an App is opened from the Left Sidebar */}
        {activeApp && activeApp.subPages.length > 0 ? (
          <nav
            className="flex items-center gap-1.5 overflow-x-auto max-w-full flex-1 min-w-0 order-5 lg:order-none pt-1 lg:pt-0 ps-0 lg:ps-3 lg:border-s lg:border-[var(--bw-line)] [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
            aria-label={`${activeApp.label} sub-pages`}
          >
            {activeApp.subPages.map((sp, idx) => {
              const active = isSubPageActive(sp, idx);
              return (
                <Link
                  key={sp.href}
                  href={sp.href}
                  className={`bw-subpage-tab ${active ? (sp.gold ? 'active-gold' : 'active') : ''}`}
                >
                  {sp.gold && <Lock size={11} className={active ? 'text-[#fbe8a4]' : 'text-[#9a7123]'} />}
                  {sp.label}
                </Link>
              );
            })}
          </nav>
        ) : (
          <div className="flex-1 hidden lg:block" />
        )}

        {/* Quiet Minimal Utility Icons (No Bulky Header Buttons) */}
        <div className="flex items-center gap-1.5 shrink-0 ms-auto lg:ms-0">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="size-9 rounded-full bg-white dark:bg-[#101620] border border-[var(--bw-line)] hover:bg-[#090d13] hover:text-[#34f0bc] flex items-center justify-center cursor-pointer transition"
            title="Search OS (Ctrl + K)"
            aria-label="Search OS"
          >
            <Search size={15} />
          </button>

          {/* Notification Bell Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen((v) => !v)}
              className="relative size-9 rounded-full bg-white dark:bg-[#101620] border border-[var(--bw-line)] hover:bg-[#090d13] hover:text-[#34f0bc] flex items-center justify-center cursor-pointer transition"
              title={`Alerts (${unreadCount} unread)`}
              aria-label={`Notifications, ${unreadCount} unread`}
            >
              <Bell size={15} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -end-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#e11d48] text-white text-[9.5px] font-extrabold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
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

          <button
            type="button"
            onClick={toggleRtl}
            className="size-9 rounded-full bg-white dark:bg-[#101620] border border-[var(--bw-line)] hover:bg-[#090d13] hover:text-[#34f0bc] flex items-center justify-center cursor-pointer transition"
            title="Switch English / Arabic"
            aria-label="Switch language"
          >
            <Languages size={15} />
          </button>

          <button
            type="button"
            onClick={toggleDark}
            className="size-9 rounded-full bg-white dark:bg-[#101620] border border-[var(--bw-line)] hover:bg-[#090d13] hover:text-[#34f0bc] flex items-center justify-center cursor-pointer transition"
            title="Switch Light / Dark"
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {user && (
            <div className="inline-flex items-center gap-2 ps-1 pe-1.5 h-9 rounded-full bg-[#0a0e14] text-white border border-white/12 shadow-md">
              <StaffAvatar name={user.name} avatarUrl={user.avatarUrl} initials={user.initials} size="sm" />
              <div className="hidden xl:block leading-tight pe-0.5">
                <div className="text-[11px] font-bold flex items-center gap-1 text-white">
                  {user.name.split(' ')[0]}
                  {isOwner && <Crown size={10} className="text-[#fbe8a4]" />}
                </div>
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

      {/* Main Body: Direct-Open Left Sidebar + Warm Beige-Yellow Canvas */}
      <div className="flex flex-1 min-h-0">
        <nav className="bw-workspace-rail no-print" aria-label="Apps sidebar">
          {sidebarApps.map((app) => {
            const Icon = app.icon;
            const active = activeApp?.id === app.id;
            return (
              <Link
                key={app.id}
                href={app.primaryHref}
                onMouseEnter={() => {
                  router.prefetch(app.primaryHref.split('?')[0]);
                  if (app.prefetchUrl) prefetchApi(app.prefetchUrl);
                }}
                className={`bw-rail-shortcut ${active ? 'active' : ''}`}
                title={app.label}
              >
                <Icon
                  size={18}
                  className={
                    active
                      ? app.goldAccent
                        ? 'text-[#fbe8a4]'
                        : 'text-[#34f0bc]'
                      : app.goldAccent
                        ? 'text-[#9a7123]'
                        : ''
                  }
                />
                <span className="whitespace-pre-line leading-tight">{app.shortLabel}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex-1 min-w-0 flex flex-col">
          <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pt-5 pb-24 sm:pb-10 scroll-smooth">
            <div className="w-full max-w-[1480px] mx-auto">{children}</div>
          </main>

          {/* Quiet Status Footer (Desktop) */}
          <footer className="hidden sm:flex flex-none px-5 py-2 bg-[#fffcf4]/95 dark:bg-[#080b10] border-t border-[var(--bw-line)] text-[11px] text-[var(--bw-muted)] flex-wrap items-center justify-between gap-3 no-print">
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
              { label: isOwner ? 'Place' : 'Dashboard', href: isOwner ? '/os/place?tab=team' : '/os/dashboard', icon: isOwner ? Briefcase : LayoutDashboard },
              { label: '24 Banks', href: '/os/mortgage-desk?tab=proposal', icon: Calculator },
              { label: 'Field GPS', href: '/os/field-gps', icon: MapPin },
              { label: isOwner ? 'Corner' : 'Excel', href: isOwner ? '/os/corner?tab=fasttrack' : '/os/utilities', icon: isOwner ? Crown : Sparkles },
            ].map((m) => {
              const Icon = m.icon;
              const base = m.href.split('?')[0];
              const active = pathname === base;
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
                placeholder="Search clients, case codes, 18-bank rates, 159 RMs, coordinators..."
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
    </div>
  );
}
