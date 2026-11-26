'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  Briefcase,
  Calculator,
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
} from 'lucide-react';
import { useOs } from './OsProvider';
import { StaffAvatar } from './UiKit';
import { EIBOR_SNAPSHOT } from '@/lib/domain/banks';

function DubaiClock() {
  const [text, setText] = useState('');
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const t = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Dubai',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
        .format(now)
        .toUpperCase();
      setText(`Dubai ${t} GST`);
    };
    update();
    const id = setInterval(update, 15_000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="hidden lg:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold border border-[var(--bw-line)] bg-[var(--bw-card)]">
      <span className="size-2 rounded-full bg-[#34DFAC] animate-pulse" />
      {text || 'Dubai GST'}
    </span>
  );
}

export function OsShell({ children }: { children: React.ReactNode }) {
  const { user, loading, dark, rtl, toggleDark, toggleRtl, logout } = useOs();
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchRes, setSearchRes] = useState<Array<{ type: string; title: string; subtitle: string; href: string }>>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch('/api/v1/notifications')
      .then((r) => r.json())
      .then((d) => setUnreadCount((d.notifications ?? []).filter((n: { is_read: boolean }) => !n.is_read).length))
      .catch(() => {});
  }, [user, pathname]);

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
      <div className="min-h-screen flex items-center justify-center bg-[#0A1128] text-white">
        <div className="flex flex-col items-center gap-3">
          <img src="/brand/icon-gold.svg" alt="Betterway" className="size-12 animate-pulse" />
          <div className="text-xs tracking-[0.2em] uppercase text-[#FCF1B7]">Loading Betterway OS v3...</div>
        </div>
      </div>
    );
  }

  const hasPipelineAccess = user?.role !== 'HR_MANAGER' && user?.role !== 'IT_MARKETING';
  const isOwnerOrAdmin = user?.role === 'OWNER' || user?.role === 'OFFICE_ADMIN';

  const quickDock = [
    { label: 'Apps', href: '/os', icon: LayoutGrid, show: true },
    { label: user?.executiveAppTitle || "Owner's Desk", href: '/os/executive', icon: Crown, show: Boolean(user?.isOwner) },
    { label: 'Command', href: '/os/command-center', icon: Radar, show: true },
    { label: 'Dashboard', href: '/os/dashboard', icon: LayoutDashboard, show: true },
    { label: 'Master Log', href: '/os/master-log', icon: Database, show: isOwnerOrAdmin },
    { label: '12-Step', href: '/os/pipeline', icon: KanbanSquare, show: hasPipelineAccess },
    { label: 'CRM', href: '/os/crm', icon: UserPlus, show: hasPipelineAccess },
    { label: 'Mortgage Desk', href: '/os/mortgage-desk', icon: Calculator, show: hasPipelineAccess },
    { label: 'Vault', href: '/os/vault', icon: FileLock2, show: hasPipelineAccess },
    { label: 'Accounts', href: '/os/accounts', icon: Wallet, show: isOwnerOrAdmin },
    { label: 'Compliance', href: '/os/compliance', icon: ShieldCheck, show: isOwnerOrAdmin },
    { label: 'Website', href: '/os/website-studio', icon: Globe, show: isOwnerOrAdmin || user?.role === 'IT_MARKETING' },
    { label: 'Team & QR', href: '/os/employees', icon: Users, show: true },
    { label: 'Group', href: '/os/inside', icon: MessagesSquare, show: true },
    { label: 'Field GPS', href: '/os/field-gps', icon: MapPin, show: true },
    { label: 'AI Desk', href: '/os/ai', icon: Sparkles, show: true },
    { label: 'Utilities', href: '/os/utilities', icon: Wrench, show: true },
    { label: 'Sales', href: '/os/sales', icon: Briefcase, show: hasPipelineAccess },
    { label: 'Settings', href: '/os/settings', icon: Settings, show: isOwnerOrAdmin },
  ].filter((i) => i.show);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bw-bg)] text-[var(--bw-ink)]">
      {/* Persistent Executive Top OS Bar */}
      <header className="sticky top-0 z-40 h-16 border-b border-[var(--bw-line)] bg-[var(--bw-card)]/90 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/os" className="flex items-center gap-2.5 shrink-0">
            <img src={dark ? '/brand/logo-horizontal-dark.svg' : '/brand/logo-horizontal-light.svg'} alt="Betterway Mortgages" className="h-8 w-auto" />
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-[#0A1128] text-[#FCF1B7] text-[10px] font-bold uppercase tracking-wider">
              OS v3
            </span>
          </Link>
          <DubaiClock />
          <span className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono-num font-bold border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
            3M EIBOR {EIBOR_SNAPSHOT.latest.threeMonth.toFixed(3)}%
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="h-9 px-3 rounded-full border border-[var(--bw-line)] bg-[var(--bw-bg)] text-xs text-[var(--bw-muted)] flex items-center gap-2 hover:border-[var(--bw-emerald)] cursor-pointer"
          >
            <Search size={13} />
            <span className="hidden sm:inline">Search OS...</span>
            <kbd className="hidden md:inline text-[10px] px-1.5 py-0.5 rounded bg-[var(--bw-card)] border border-[var(--bw-line)]">⌘K</kbd>
          </button>

          <Link
            href={user?.isOwner ? '/os/executive' : '/os/dashboard'}
            className="relative size-9 rounded-full border border-[var(--bw-line)] bg-[var(--bw-card)] flex items-center justify-center hover:border-[var(--bw-emerald)]"
            title="Critical Alerts & Approvals"
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -end-0.5 size-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={toggleRtl}
            className="size-9 rounded-full border border-[var(--bw-line)] bg-[var(--bw-card)] flex items-center justify-center hover:border-[var(--bw-emerald)] cursor-pointer"
            title="Toggle English / Arabic RTL"
          >
            <Languages size={15} />
          </button>

          <button
            type="button"
            onClick={toggleDark}
            className="size-9 rounded-full border border-[var(--bw-line)] bg-[var(--bw-card)] flex items-center justify-center hover:border-[var(--bw-emerald)] cursor-pointer"
            title="Toggle Light / Dark Theme"
          >
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {user && (
            <div className="flex items-center gap-2 ps-2 border-s border-[var(--bw-line)]">
              <StaffAvatar name={user.name} avatarUrl={user.avatarUrl} initials={user.initials} size="sm" />
              <div className="hidden md:block leading-tight">
                <div className="text-xs font-bold flex items-center gap-1">
                  {user.name}
                  {user.isOwner && <Crown size={11} className="text-[#D4AF37]" />}
                </div>
                <div className="text-[10.5px] text-[var(--bw-muted)]">{user.designation}</div>
              </div>
              <button
                type="button"
                onClick={() => void logout()}
                className="size-8 rounded-full hover:bg-red-500/10 hover:text-red-600 flex items-center justify-center cursor-pointer"
                title="Sign Out"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Compact OS App Strip (visible on sub-apps for 1-click desktop switching) */}
      {pathname !== '/os' && (
        <nav className="border-b border-[var(--bw-line)] bg-[var(--bw-card)]/70 px-4 lg:px-6 py-2 overflow-x-auto no-print [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex items-center gap-1.5 min-w-max">
            {quickDock.map((item) => {
              const active = pathname === item.href || (item.href !== '/os' && pathname.startsWith(item.href + '/'));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                    active
                      ? 'bg-[#0A1128] text-[#FCF1B7] shadow-sm'
                      : 'text-[var(--bw-body)] hover:bg-[var(--bw-soft)]'
                  }`}
                >
                  <Icon size={13} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      <main className="flex-1 w-full max-w-[1520px] mx-auto px-4 lg:px-6 py-6">{children}</main>

      {/* Global Search Command Palette */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-20 px-4 no-print">
          <div className="w-full max-w-xl bw-card overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--bw-line)]">
              <Search size={16} className="text-[var(--bw-muted)]" />
              <input
                autoFocus
                value={searchQ}
                onChange={(e) => void runSearch(e.target.value)}
                placeholder="Search clients, case codes, banks, communities, or developers..."
                className="flex-1 bg-transparent outline-none text-sm"
              />
              <button type="button" onClick={() => setSearchOpen(false)} className="p-1 cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-[var(--bw-line)]">
              {searchRes.length === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--bw-muted)]">
                  Type at least 2 characters to search across Betterway OS (Privacy Fast Track strictly isolated to Owners).
                </div>
              ) : (
                searchRes.map((r, i) => (
                  <Link
                    key={`${r.href}-${i}`}
                    href={r.href}
                    onClick={() => setSearchOpen(false)}
                    className="flex items-center justify-between px-4 py-3 hover:bg-[var(--bw-soft)] text-xs"
                  >
                    <div>
                      <div className="font-bold">{r.title}</div>
                      <div className="text-[var(--bw-muted)]">{r.subtitle}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[var(--bw-soft)] text-[10px] font-bold uppercase">{r.type}</span>
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
