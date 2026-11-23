'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  Calculator,
  CalendarCheck,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Landmark,
  LayoutDashboard,
  LayoutGrid,
  Menu as MenuIcon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  UserPlus,
  Handshake,
  type LucideIcon,
} from 'lucide-react';
import { findActiveNav, OS_APPS, type OsItem } from '@/lib/os-apps';
import '@/styles/swk-os.css';

/** Betterway house mark: brass roofline on an oxblood tile. */
export function BrandMark({ size = 36 }: { size?: number }) {
  return (
    <span className="swk-mark" style={{ width: size, height: size }} aria-hidden>
      <svg viewBox="0 0 36 36" width={size * 0.62} height={size * 0.62} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bwBrass" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ecd9a6" />
            <stop offset="50%" stopColor="#c9a257" />
            <stop offset="100%" stopColor="#a8822f" />
          </linearGradient>
        </defs>
        <path d="M6.5 18.2L18 7.5L29.5 18.2" stroke="url(#bwBrass)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9.5 16V27.2C9.5 27.9 10.1 28.5 10.8 28.5H25.2C25.9 28.5 26.5 27.9 26.5 27.2V16" stroke="url(#bwBrass)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15.2 28.5V21.5C15.2 21 15.6 20.6 16.1 20.6H19.9C20.4 20.6 20.8 21 20.8 21.5V28.5" stroke="url(#bwBrass)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function BrandLockup() {
  return (
    <span className="swk-lockup">
      <BrandMark size={34} />
      <span className="swk-lockup-tx">
        <b>
          Betterway<i>OS</i>
        </b>
        <small>MORTGAGES LLC</small>
      </span>
    </span>
  );
}

/** Live Dubai time (Gulf Standard Time). */
export function DubaiClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const i = setInterval(() => setNow(new Date()), 20000);
    return () => clearInterval(i);
  }, []);
  if (!now) return <span className="swk-chip swk-hide-md" style={{ minWidth: 150 }} />;
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dubai', hour: '2-digit', minute: '2-digit', hour12: true }).format(now).toUpperCase();
  const day = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dubai', weekday: 'short', day: '2-digit', month: 'short' }).format(now);
  return (
    <span className="swk-chip swk-hide-md" title="Gulf Standard Time (GST, UTC+4)">
      <span className="dot" />
      Dubai <b>{time}</b>
      <span className="muted">· {day}</span>
    </span>
  );
}

const QUICK_ADD: { label: string; desc: string; href: string; icon: LucideIcon }[] = [
  { label: 'New Lead', desc: 'Capture a mortgage enquiry', href: '/os/crm', icon: UserPlus },
  { label: 'Run 24-Bank Match', desc: 'DBR, LTV and ranked offers', href: '/os/los', icon: Landmark },
  { label: 'Book Appointment', desc: 'Client meeting or valuation', href: '/os/activities', icon: CalendarCheck },
  { label: 'Open Deal Pipeline', desc: 'Move a case to the next stage', href: '/os/deals', icon: Handshake },
  { label: 'DBR Toolkit', desc: 'Buyout and EMI calculators', href: '/os/toolkit', icon: Calculator },
  { label: 'Add Follow-up Task', desc: 'Callbacks and reminders', href: '/os/activities', icon: CheckSquare },
];

export function QuickAdd() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', down);
      document.removeEventListener('keydown', key);
    };
  }, [open]);
  return (
    <div className="swk-rel" ref={ref}>
      <button type="button" className="swk-create" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}>
        <Plus size={16} />
        <span className="swk-hide-sm">Quick Add</span>
        <ChevronDown size={14} className="swk-hide-sm" style={{ opacity: 0.7 }} />
      </button>
      {open && (
        <div role="menu" className="swk-menu">
          {QUICK_ADD.map((i) => (
            <a key={i.label} role="menuitem" href={i.href} onClick={() => setOpen(false)}>
              <span className="ic">
                <i.icon size={16} />
              </span>
              <span>
                <b>{i.label}</b>
                <small>{i.desc}</small>
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export interface OsFrameProps {
  pathname: string;
  /** Hash-route key when the page is an Estate OS workspace page under /os. */
  estateKey?: string;
  /** Hide pages the current role cannot open (Estate OS capability check). */
  canSee?: (item: OsItem) => boolean;
  /** Right side of the header: search, notifications, account menu, etc. */
  header: ReactNode;
  /** Pinned at the bottom of the app sidebar (outbound kill switch). */
  sidebarFooter?: ReactNode;
  dir?: 'ltr' | 'rtl';
  children: ReactNode;
}

const COLLAPSE_KEY = 'bw.sidebar.collapsed';

/** SWK OS frame: light header with breadcrumb, dark per-app sidebar, floating main surface. */
export function OsFrame({ pathname, estateKey, canSee, header, sidebarFooter, dir, children }: OsFrameProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1');
    } catch {
      /* storage unavailable: sidebar stays expanded */
    }
  }, []);
  useEffect(() => setDrawer(false), [pathname, estateKey]);

  const isHome = pathname === '/os/home';
  const active = useMemo(() => findActiveNav(pathname, estateKey), [pathname, estateKey]);
  const items = useMemo(() => (active ? active.app.items.filter((i) => !canSee || canSee(i)) : []), [active, canSee]);
  const showSidebar = !isHome && !!active && items.length > 0;
  const toggle = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1');
      } catch {
        /* ignore */
      }
      return !c;
    });

  const title = isHome ? 'All apps' : active?.item.label ?? 'Workspace';
  return (
    <div className="swk-app" dir={dir}>
      <header className="swk-top no-print">
        {showSidebar && (
          <button type="button" className="swk-menu-btn" onClick={() => setDrawer((d) => !d)} aria-label="Open menu" aria-expanded={drawer}>
            <MenuIcon size={18} />
          </button>
        )}
        <div className="swk-top-title">
          <div className="crumb">
            <Link href="/os/home">Betterway OS</Link>
            {active && !isHome && (
              <>
                <ChevronRight size={11} />
                <span>{active.app.label}</span>
              </>
            )}
            <ChevronRight size={11} />
            <b>{title}</b>
          </div>
        </div>
        <div className="swk-grow" />
        {header}
      </header>
      <div className={`swk-body${showSidebar ? ' has-sidebar' : ''}${showSidebar && collapsed ? ' is-collapsed' : ''}${drawer ? ' sb-open' : ''}`}>
        {drawer && <div className="swk-sb-scrim" onClick={() => setDrawer(false)} />}
        {showSidebar && active && (
          <aside className={`swk-app-sidebar no-print${collapsed ? ' is-collapsed' : ''}`}>
            <nav className="swk-sidebar-nav" aria-label={`${active.app.label} pages`}>
              <Link href="/os/home" className="swk-sidebar-logo" aria-label="Betterway OS, all apps">
                <BrandLockup />
              </Link>
              <div className="swk-sidebar-head">
                <Link href="/os/home" className="swk-sidebar-back" title="All apps">
                  <ArrowLeft size={14} />
                  <span className="swk-sidebar-link-tx">All apps</span>
                </Link>
                <button type="button" onClick={toggle} className="swk-sidebar-collapse-btn swk-hide-md" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
                  {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
                </button>
              </div>
              <div className="swk-sidebar-group">
                <div className="swk-sidebar-group-label">
                  <active.app.icon size={12} />
                  <span className="swk-sidebar-link-tx">{active.app.label}</span>
                </div>
                {items.map((i) => {
                  const on = i.href === active.item.href;
                  return (
                    <a key={i.href} href={i.href} title={`${i.label} — ${i.desc}`} className={`swk-sidebar-link${on ? ' active' : ''}`} aria-current={on ? 'page' : undefined}>
                      <i.icon size={16} strokeWidth={1.8} />
                      <span className="swk-sidebar-link-tx">{i.label}</span>
                    </a>
                  );
                })}
              </div>
              {sidebarFooter && <div className="swk-sidebar-foot">{sidebarFooter}</div>}
            </nav>
          </aside>
        )}
        <main className="swk-main" id="main">
          {children}
        </main>
      </div>
      <nav className="swk-mobile-bottom-nav no-print" aria-label="Quick navigation">
        <Link href="/os/home" className="swk-mnav-item">
          <LayoutGrid size={18} />
          <span>Apps</span>
        </Link>
        <Link href="/os" className="swk-mnav-item">
          <LayoutDashboard size={18} />
          <span>Overview</span>
        </Link>
      </nav>
    </div>
  );
}

export { OS_APPS };
