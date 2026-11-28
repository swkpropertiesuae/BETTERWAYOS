'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Bell,
  BookOpen,
  Briefcase,
  Calculator,
  Check,
  ClipboardList,
  Crown,
  Database,
  FileLock2,
  Globe,
  KanbanSquare,
  Languages,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  MapPin,
  MessagesSquare,
  Moon,
  Palette,
  PhoneCall,
  Radar,
  Search,
  Settings,
  ShieldCheck,
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
import { prefetchApi } from '@/lib/client-cache';

interface TopNavApp {
  key: string;
  label: string;
  href: string;
  matchPrefix: string;
  icon: LucideIcon;
  visible: boolean;
  prefetchUrl?: string;
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
  return <span>{text || 'Dubai Live GST'}</span>;
}

export function OsShell({ children }: { children: React.ReactNode }) {
  const { user, dark, toggleDark, toggleRtl, logout, setCustomizerOpen } = useOs();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchRes, setSearchRes] = useState<Array<{ type: string; title: string; subtitle: string; href: string }>>([]);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; body?: string; href?: string; is_read: boolean; created_at?: string }>>([]);
  const [notifOpen, setNotifOpen] = useState(false);

  const currentSection = searchParams?.get('section') || '';
  const currentTab = searchParams?.get('tab') || '';

  useEffect(() => {
    const warmRoutes = ['/os', '/os/place', '/os/corner', '/os/dashboard', '/os/pipeline', '/os/coordinator', '/os/mortgage-desk', '/os/utilities'];
    for (const r of warmRoutes) router.prefetch(r);
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
  const placeLabel = isShabib ? "Shabib's Place" : "Warda's Place";
  const cornerLabel = isShabib ? "Shabib's Corner" : "Warda's Corner";

  // Exact Horizontal Full-Width App Strip matching the uploaded reference screenshot (shown on inner pages, hidden on /os)
  const navApps: TopNavApp[] = useMemo(
    () =>
      [
        { key: 'apps', label: 'Apps', href: '/os', matchPrefix: '/os', icon: LayoutGrid, visible: true, prefetchUrl: '/api/v1/dashboard/overview' },
        { key: 'place', label: placeLabel, href: '/os/place', matchPrefix: '/os/place', icon: Crown, visible: isOwner, prefetchUrl: '/api/v1/executive/overview' },
        { key: 'corner', label: cornerLabel, href: '/os/corner', matchPrefix: '/os/corner', icon: ShieldCheck, visible: isOwner, prefetchUrl: '/api/v1/executive/overview' },
        { key: 'command', label: 'Command', href: '/os/command-center', matchPrefix: '/os/command-center', icon: Radar, visible: hasPipelineAccess },
        { key: 'dashboard', label: 'Dashboard', href: '/os/dashboard', matchPrefix: '/os/dashboard', icon: LayoutDashboard, visible: true, prefetchUrl: '/api/v1/dashboard/overview' },
        { key: 'master', label: 'Master Log', href: '/os/master-log', matchPrefix: '/os/master-log', icon: Database, visible: isOwnerOrAdmin },
        { key: 'pipeline', label: '12-Step', href: '/os/pipeline', matchPrefix: '/os/pipeline', icon: KanbanSquare, visible: hasPipelineAccess },
        { key: 'coordinator', label: 'Coordinator', href: '/os/coordinator', matchPrefix: '/os/coordinator', icon: ClipboardList, visible: hasPipelineAccess },
        { key: 'crm', label: 'CRM', href: '/os/crm', matchPrefix: '/os/crm', icon: UserPlus, visible: hasPipelineAccess },
        { key: 'desk', label: 'Mortgage Desk', href: '/os/mortgage-desk', matchPrefix: '/os/mortgage-desk', icon: Calculator, visible: hasPipelineAccess, prefetchUrl: '/api/v1/mortgage-desk' },
        { key: 'calculators', label: 'Calculators', href: '/os/calculators', matchPrefix: '/os/calculators', icon: Calculator, visible: true },
        { key: 'vault', label: 'Vault', href: '/os/vault', matchPrefix: '/os/vault', icon: FileLock2, visible: hasPipelineAccess },
        { key: 'accounts', label: 'Accounts', href: '/os/accounts', matchPrefix: '/os/accounts', icon: Wallet, visible: isOwnerOrAdmin },
        { key: 'compliance', label: 'Compliance', href: '/os/compliance', matchPrefix: '/os/compliance', icon: ShieldCheck, visible: isOwnerOrAdmin },
        { key: 'website', label: 'Website', href: '/os/website-studio', matchPrefix: '/os/website-studio', icon: Globe, visible: hasWebsiteAccess },
        { key: 'employees', label: 'Team & QR', href: '/os/employees', matchPrefix: '/os/employees', icon: Users, visible: true },
        { key: 'inside', label: 'Betterway Inside', href: '/os/inside', matchPrefix: '/os/inside', icon: MessagesSquare, visible: true },
        { key: 'sip-calls', label: 'SIP Calls', href: '/os/sip-calls', matchPrefix: '/os/sip-calls', icon: PhoneCall, visible: true },
        { key: 'gps', label: 'Field GPS', href: '/os/field-gps', matchPrefix: '/os/field-gps', icon: MapPin, visible: true },
        { key: 'ai', label: 'Case Playbook', href: '/os/ai', matchPrefix: '/os/ai', icon: BookOpen, visible: true },
        { key: 'utilities', label: 'Utilities', href: '/os/utilities', matchPrefix: '/os/utilities', icon: Wrench, visible: true },
        { key: 'sales', label: 'Sales', href: '/os/sales', matchPrefix: '/os/sales', icon: Briefcase, visible: hasPipelineAccess },
        { key: 'settings', label: 'Settings', href: '/os/settings', matchPrefix: '/os/settings', icon: Settings, visible: isOwnerOrAdmin },
      ].filter((a) => a.visible),
    [placeLabel, cornerLabel, isOwner, hasPipelineAccess, isOwnerOrAdmin, hasWebsiteAccess],
  );

  const isNavAppActive = (app: TopNavApp) => {
    if (app.key === 'apps') return pathname === '/os';
    if (pathname === '/os/executive') {
      const cornerTabs = new Set(['fasttrack', 'approvals', 'vat', 'bulkai', 'goldrush']);
      if (currentSection === 'corner' || cornerTabs.has(currentTab)) return app.key === 'corner';
      return app.key === 'place';
    }
    return pathname === app.matchPrefix || pathname.startsWith(app.matchPrefix + '/');
  };

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-[var(--bw-bg)] text-[var(--bw-ink)]">
      {/* Exact Top Header Bar Matching Reference Screenshots (Logo + OS V3 + Live Dubai Clock + 3M EIBOR | Search + Bell + AR/EN + Theme + Profile + Sign Out) */}
      <header className="flex-none h-[60px] px-4 lg:px-6 bg-white/95 dark:bg-[#080b10]/95 backdrop-blur-xl border-b border-[var(--bw-line)] flex items-center justify-between gap-3 no-print z-40">
        {/* Left Brand & Live Dubai Telemetry Pills */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Link href="/os" className="flex items-center shrink-0 group" aria-label="Betterway Mortgages OS Home">
            <img
              src={dark ? '/brand/betterway-logo-horizontal-dark-transparent.svg' : '/brand/betterway-logo-horizontal-light-transparent.svg'}
              alt="Betterway Mortgages"
              className="h-8 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
            />
          </Link>
          <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#090d13] text-white text-[10px] font-extrabold tracking-wider shrink-0">
            OS V3
          </span>
          <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--bw-soft)] border border-[var(--bw-line)] text-[11px] font-mono-num font-bold text-[var(--bw-ink)] shrink-0">
            <span className="size-1.5 rounded-full bg-[#119c78] animate-pulse" />
            <DubaiClock compact />
          </span>
          <span className="hidden lg:inline-flex items-center px-3 py-1 rounded-full bg-[#e3fbf3] dark:bg-[#0d2b24] border border-[#9be8ce] dark:border-[#1c5c4b] text-[11px] font-mono-num font-extrabold text-[#053b2e] dark:text-[#34f0bc] shrink-0">
            3M EIBOR {EIBOR_SNAPSHOT.latest.threeMonth.toFixed(3)}%
          </span>
        </div>

        {/* Right SIP Phone, Betterway Inside, Customise UI, Search, Alerts, Language, Theme & Profile */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href="/os/inside"
            className="hidden 2xl:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full bg-[var(--bw-soft)] hover:bg-[#090d13] hover:text-[#34f0bc] border border-[var(--bw-line)] text-[11px] font-bold transition"
            title="Open Betterway Inside Messaging"
          >
            <MessagesSquare size={12} className="text-[#119c78]" />
            <span>Inside</span>
          </Link>
          <Link
            href="/os/sip-calls"
            className="hidden 2xl:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full bg-[var(--bw-soft)] hover:bg-[#090d13] hover:text-[#34f0bc] border border-[var(--bw-line)] text-[11px] font-bold transition"
            title="Open Betterway SIP Call Desk"
          >
            <PhoneCall size={12} className="text-[#119c78]" />
            <span>SIP</span>
          </Link>
          <button
            type="button"
            onClick={() => setCustomizerOpen(true)}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-[#090d13] hover:bg-[#141d29] text-[#fbe8a4] border border-[#d9b356]/50 text-[11px] font-extrabold cursor-pointer transition shadow-sm"
            title="Customise UI colors, fonts, sizes, highlights & pinned drag layout"
          >
            <Palette size={13} className="text-[#34f0bc]" />
            <span className="hidden sm:inline">Customise UI</span>
          </button>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-[var(--bw-soft)] hover:bg-[var(--bw-hover)] border border-[var(--bw-line)] text-[11px] font-semibold text-[var(--bw-muted)] cursor-pointer transition"
            aria-label="Search OS"
          >
            <Search size={13} />
            <span className="hidden xl:inline">Search</span>
            <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-white/10 text-[var(--bw-muted)] border border-[var(--bw-line)]">
              ⌘K
            </kbd>
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen((v) => !v)}
              className="relative size-8 rounded-full hover:bg-[var(--bw-soft)] text-[var(--bw-body)] flex items-center justify-center cursor-pointer transition"
              aria-label={`Notifications, ${unreadCount} unread`}
            >
              <Bell size={16} />
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
            className="size-8 rounded-full hover:bg-[var(--bw-soft)] text-[var(--bw-body)] flex items-center justify-center cursor-pointer transition"
            title="Switch English / Arabic"
            aria-label="Switch language"
          >
            <Languages size={15} />
          </button>

          <button
            type="button"
            onClick={toggleDark}
            className="size-8 rounded-full hover:bg-[var(--bw-soft)] text-[var(--bw-body)] flex items-center justify-center cursor-pointer transition"
            title="Switch Light / Dark"
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {user && (
            <div className="flex items-center gap-2 ps-2 border-s border-[var(--bw-line)]">
              <StaffAvatar name={user.name} avatarUrl={user.avatarUrl} initials={user.initials} size="sm" />
              <div className="hidden md:block leading-tight">
                <div className="text-[11.5px] font-extrabold text-[var(--bw-ink)] flex items-center gap-1">
                  {user.name}
                  {isOwner && <Crown size={11} className="text-[#d9b356]" />}
                </div>
                <div className="text-[10px] text-[var(--bw-muted)] max-w-[140px] truncate">{user.designation}</div>
              </div>
              <button
                type="button"
                onClick={() => void logout()}
                className="size-7 rounded-full hover:bg-[#fff0f3] hover:text-[#e11d48] text-[var(--bw-muted)] flex items-center justify-center cursor-pointer transition"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Exact Horizontal All-Apps Top Strip (Visible Inside Any App, Hidden on /os Home — Matches Screenshot 2 Pixel-for-Pixel!) */}
      {pathname !== '/os' && (
        <nav
          className="flex-none bg-white/90 dark:bg-[#0a0e14]/95 border-b border-[var(--bw-line)] px-4 lg:px-6 py-2 flex items-center gap-1.5 overflow-x-auto no-print [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
          aria-label="Betterway OS Applications"
        >
          {navApps.map((app) => {
            const Icon = app.icon;
            const active = isNavAppActive(app);
            return (
              <Link
                key={app.key}
                href={app.href}
                onMouseEnter={() => {
                  router.prefetch(app.href);
                  if (app.prefetchUrl) prefetchApi(app.prefetchUrl);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-bold whitespace-nowrap transition shrink-0 ${
                  active
                    ? 'bg-[#090d13] text-white shadow-md'
                    : 'text-[var(--bw-body)] hover:bg-[var(--bw-soft)] hover:text-[var(--bw-ink)]'
                }`}
              >
                <Icon size={13} className={active ? 'text-[#34f0bc]' : 'text-[var(--bw-muted)]'} />
                <span>{app.label}</span>
              </Link>
            );
          })}
        </nav>
      )}

      {/* Full-Width Centered Canvas (No Left Sidebar Rail — Exact Match to Uploaded Screenshots!) */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 sm:pb-12 scroll-smooth">
        <div className="w-full max-w-[1220px] mx-auto">{children}</div>
      </main>

      {/* Native Android & iOS Mobile Bottom Dock */}
      <nav
        className="bw-mobile-dock fixed bottom-0 inset-x-0 z-40 bg-[#070a0f]/95 backdrop-blur-xl border-t border-white/12 px-2 pt-2 items-center justify-around text-[10px] font-bold text-slate-300 no-print"
        aria-label="Mobile quick navigation"
      >
        {[
          { label: 'Apps', href: '/os', icon: LayoutGrid },
          { label: isOwner ? 'Place' : 'Dashboard', href: isOwner ? '/os/place' : '/os/dashboard', icon: isOwner ? Crown : LayoutDashboard },
          { label: '24 Banks', href: '/os/mortgage-desk', icon: Calculator },
          { label: 'Field GPS', href: '/os/field-gps', icon: MapPin },
          { label: isOwner ? 'Corner' : 'Excel', href: isOwner ? '/os/corner' : '/os/utilities', icon: isOwner ? ShieldCheck : Wrench },
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

      {/* Command Palette Search (Ctrl+K / Cmd+K) */}
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
                placeholder="Search clients, case codes, 18-bank rates, 159 RMs, developers..."
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
