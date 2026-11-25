import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Bell,
  Briefcase,
  Calculator,
  CalendarDays,
  Check,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Crown,
  FilePenLine,
  FileSpreadsheet,
  Globe,
  Handshake,
  KanbanSquare,
  Landmark,
  Languages,
  LayoutDashboard,
  LayoutGrid,
  LineChart,
  Lock,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  MessagesSquare,
  Moon,
  PhoneCall,
  Plus,
  QrCode,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  Wand2,
  Workflow,
  X,
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { apiFetch } from '../lib/api';
import { EIBOR_SNAPSHOT } from '@shared/banks-data';
import { StaffAvatar } from './UiPrimitives';
import { CommandPalette } from './CommandPalette';

const NAV_GROUPS = [
  {
    title: 'Do Today',
    items: [
      { label: 'Home & Results', to: '/home', icon: LayoutGrid },
      { label: "Shabib's Corner", to: '/shabibs-corner', icon: Crown, ownerOnly: true },
      { label: 'My Tasks Today', to: '/my-work', icon: CheckSquare },
      { label: 'My Assigned Clients', to: '/my-cases', icon: UserCheck },
      { label: 'Business Results', to: '/dashboard', icon: LayoutDashboard },
      { label: 'Schedule & Deadlines', to: '/calendar', icon: CalendarDays },
      { label: 'Field Visits GPS', to: '/field-duty', icon: MapPin },
    ],
  },
  {
    title: 'Clients & Deals',
    items: [
      { label: 'Mortgage Steps (1→12)', to: '/pipeline', icon: KanbanSquare },
      { label: 'Client Vault (Safe)', to: '/vault', icon: Lock },
      { label: 'New Enquiries', to: '/leads', icon: UserPlus },
      { label: 'Client Messages', to: '/communications', icon: MessageCircle },
      { label: 'Betterway Inside', to: '/inside', icon: MessagesSquare },
      { label: 'Betterway Phone', to: '/phone', icon: PhoneCall },
    ],
  },
  {
    title: 'Banks & Quotes',
    items: [
      { label: '24 Partner Banks', to: '/banks', icon: Landmark },
      { label: 'Borrowing Calculator', to: '/calculators', icon: Calculator },
      { label: 'Letter & Word Studio', to: '/word-studio', icon: FilePenLine },
      { label: 'Translator & OCR', to: '/utilities', icon: Wand2 },
      { label: 'AI Mortgage Helper', to: '/ai', icon: Sparkles },
      { label: 'UAE Areas (60)', to: '/market', icon: LineChart },
    ],
  },
  {
    title: 'Money, Team & Rules',
    items: [
      { label: 'Commissions & Money', to: '/finance', icon: Wallet },
      { label: 'Rules & Delete Bin', to: '/compliance', icon: ShieldCheck },
      { label: '50 Excel Reports', to: '/data-hub', icon: FileSpreadsheet },
      { label: 'Auto Follow-Ups', to: '/automations', icon: Workflow },
      { label: 'Office QR & Daily Close', to: '/reception-qr', icon: QrCode },
      { label: 'HR, Visas & Leave', to: '/hr', icon: Briefcase },
      { label: 'Team Directory (8K)', to: '/team', icon: Users },
    ],
  },
  {
    title: 'Brands & Mobile',
    items: [
      { label: 'Website & Brand Studio', to: '/website-studio', icon: Globe },
      { label: 'Client Live Tracker', to: '/portal', icon: ShieldCheck },
      { label: 'RERA Partner Hub', to: '/partners', icon: Handshake },
      { label: 'Betterway Mobile App', to: '/mobile-preview', icon: Smartphone },
    ],
  },
];

function DubaiClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 20_000);
    return () => clearInterval(id);
  }, []);
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dubai',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
    .format(now)
    .toUpperCase();
  const day = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dubai',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(now);
  return (
    <span className="hidden xl:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border border-[var(--bw-line)] bg-[var(--bw-card)] text-[var(--bw-body)]">
      <span className="size-2 rounded-full bg-[#34DFAC] animate-pulse" />
      <span className="font-semibold text-[var(--bw-ink)]">Dubai {time}</span>
      <span className="text-[var(--bw-muted)]">· {day}</span>
    </span>
  );
}

export function Shell() {
  const { user, dark, rtl, toggleDark, toggleRtl, logout } = useAuth();
  const nav = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<{ unread: number; rows: any[] }>({ unread: 0, rows: [] });

  const isElevated = ['OWNER', 'EXEC_DIR', 'ADMIN', 'TEAM_MANAGER'].includes(user?.role || '');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((o) => !o);
      } else if (e.key === 'Escape') {
        setCmdOpen(false);
        setNotifOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const loadNotifs = async () => {
    try {
      const data = await apiFetch<{ unread: number; rows: any[] }>('/api/notifications');
      setNotifs(data);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    void loadNotifs();
    const t = setInterval(() => void loadNotifs(), 30_000);
    return () => clearInterval(t);
  }, []);

  const markAllRead = async () => {
    await apiFetch('/api/notifications/read', { method: 'POST' });
    void loadNotifs();
  };

  return (
    <div className="min-h-screen flex bg-[var(--bw-canvas)] text-[var(--bw-ink)]">
      {/* Desktop Midnight Navy Command Rail / Sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 bg-[#070E1A] text-white border-e border-white/10 transition-all duration-200 no-print ${
          collapsed ? 'w-[78px]' : 'w-[264px]'
        }`}
      >
        <div className="h-16 px-4 flex items-center justify-between border-b border-white/10">
          <Link to="/home" className="flex items-center gap-2.5 min-w-0">
            {collapsed ? (
              <img src="/brand/betterway-icon-fullcolor.svg" alt="Betterway" className="size-9 object-contain" />
            ) : (
              <img
                src="/brand/betterway-logo-horizontal-dark-bg.svg"
                alt="Betterway Mortgages"
                className="h-9 w-auto object-contain"
              />
            )}
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label="Toggle sidebar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {NAV_GROUPS.map((grp) => {
            const visibleItems = grp.items.filter((i) => !i.ownerOnly || isElevated);
            return (
              <div key={grp.title}>
                {!collapsed && (
                  <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D7B158]/85">
                    {grp.title}
                  </div>
                )}
                <div className="space-y-0.5">
                  {visibleItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      title={collapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${
                          isActive
                            ? item.ownerOnly
                              ? 'bg-gradient-to-r from-[#D7B158] to-[#BA8D36] text-[#070E1A] font-bold shadow-lg'
                              : 'bg-gradient-to-r from-[#179373] to-[#0A4A3E] text-white shadow-lg shadow-[#179373]/25 border border-[#34DFAC]/30'
                            : item.ownerOnly
                              ? 'text-[#FCF1B7] hover:bg-[#D7B158]/15'
                              : 'text-slate-300 hover:text-white hover:bg-white/6'
                        }`
                      }
                    >
                      <item.icon size={16} className="shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Bottom Mobile App Quick Launch Card */}
        {!collapsed && (
          <div className="p-3 border-t border-white/10">
            <a
              href="/mobile/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-[#0C1524] to-[#0A4A3E]/60 border border-[#34DFAC]/30 hover:border-[#D7B158]/70 transition-all"
            >
              <img
                src="/brand/betterway-app-icon-dark-squircle-512x512.png"
                alt="Betterway Mobile"
                className="size-10 rounded-xl shrink-0"
              />
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">Betterway Mobile</div>
                <div className="text-[10.5px] text-[#34DFAC] truncate">Open Phone App ↗</div>
              </div>
            </a>
          </div>
        )}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenu && (
        <div
          className="fixed inset-0 z-[160] lg:hidden flex bg-[#070E1A]/75 backdrop-blur-sm"
          onClick={() => setMobileMenu(false)}
        >
          <div className="w-72 bg-[#070E1A] text-white h-full overflow-y-auto p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <img src="/brand/betterway-logo-horizontal-dark-bg.svg" alt="Betterway" className="h-8 w-auto" />
              <button type="button" onClick={() => setMobileMenu(false)} className="p-1.5 rounded-lg hover:bg-white/10">
                <X size={18} />
              </button>
            </div>
            {NAV_GROUPS.map((grp) => {
              const visibleItems = grp.items.filter((i) => !i.ownerOnly || isElevated);
              return (
                <div key={grp.title} className="mb-4">
                  <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D7B158]">
                    {grp.title}
                  </div>
                  <div className="space-y-1">
                    {visibleItems.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileMenu(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium ${
                            isActive ? 'bg-[#179373] text-white' : 'text-slate-300 hover:bg-white/10'
                          }`
                        }
                      >
                        <item.icon size={16} />
                        <span>{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Command Bar */}
        <header className="sticky top-0 z-40 h-16 px-4 sm:px-6 flex items-center justify-between gap-3 bg-[var(--bw-card)]/90 backdrop-blur-md border-b border-[var(--bw-line)] no-print">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenu(true)}
              className="lg:hidden p-2 rounded-xl border border-[var(--bw-line)] hover:bg-[var(--bw-soft)]"
            >
              <Menu size={18} />
            </button>
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-full border border-[var(--bw-line)] bg-[var(--bw-soft)]/70 hover:border-[#179373]/50 text-xs text-[var(--bw-muted)] transition-colors cursor-pointer w-44 sm:w-64 md:w-72"
            >
              <Search size={14} className="text-[#179373]" />
              <span className="truncate flex-1 text-start">Jump to any tool, client, or bank…</span>
              <kbd className="hidden sm:inline px-1.5 py-0.5 rounded bg-[var(--bw-card)] border border-[var(--bw-line)] text-[10px] font-mono-num">
                ⌘K
              </kbd>
            </button>
            <DubaiClock />
            <Link
              to="/banks"
              className="hidden 2xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono-num bg-[#070E1A] text-[#FCF1B7] border border-[#D7B158]/40"
              title="Today's Official 3-Month UAE Bank Rate (EIBOR)"
            >
              <span className="text-[#34DFAC] font-bold">3M EIBOR</span>
              <span>{EIBOR_SNAPSHOT.latest.threeMonth.toFixed(3)}%</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => nav('/pipeline?new=1')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r from-[#179373] to-[#0A4A3E] hover:brightness-110 shadow-sm cursor-pointer"
            >
              <Plus size={15} />
              <span>Add Deal</span>
            </button>

            <button
              type="button"
              onClick={toggleRtl}
              title="Switch English / Arabic"
              className="p-2 rounded-full border border-[var(--bw-line)] bg-[var(--bw-card)] hover:border-[#179373] text-[var(--bw-body)] cursor-pointer"
            >
              <Languages size={16} />
            </button>

            <button
              type="button"
              onClick={toggleDark}
              title="Switch Dark / Light Look"
              className="p-2 rounded-full border border-[var(--bw-line)] bg-[var(--bw-card)] hover:border-[#D7B158] text-[var(--bw-body)] cursor-pointer"
            >
              {dark ? <Sun size={16} className="text-[#FCF1B7]" /> : <Moon size={16} />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((o) => !o)}
                className="relative p-2 rounded-full border border-[var(--bw-line)] bg-[var(--bw-card)] hover:border-[#179373] text-[var(--bw-body)] cursor-pointer"
                aria-label="Alerts"
              >
                <Bell size={16} />
                {notifs.unread > 0 && (
                  <span className="absolute -top-1 -end-1 size-4.5 rounded-full bg-[#179373] text-white text-[10px] font-bold flex items-center justify-center">
                    {notifs.unread > 9 ? '9+' : notifs.unread}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute end-0 mt-2 w-80 sm:w-96 bw-card shadow-2xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-[var(--bw-line)] flex items-center justify-between bg-[var(--bw-soft)]/60">
                    <span className="font-bold text-sm">Alerts &amp; Approvals</span>
                    {notifs.unread > 0 && (
                      <button
                        type="button"
                        onClick={markAllRead}
                        className="text-xs font-semibold text-[#179373] flex items-center gap-1 cursor-pointer"
                      >
                        <Check size={13} /> Clear all
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-[var(--bw-line)]">
                    {notifs.rows.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          setNotifOpen(false);
                          nav(n.link || '/dashboard');
                        }}
                        className="w-full text-start px-4 py-3 hover:bg-[var(--bw-soft)]/70 transition-colors cursor-pointer"
                      >
                        <div className="text-xs font-bold text-[var(--bw-ink)] flex items-center gap-2">
                          {!n.read_at && <span className="size-2 rounded-full bg-[#34DFAC]" />}
                          {n.title}
                        </div>
                        <div className="text-[11.5px] text-[var(--bw-muted)] mt-0.5 line-clamp-2">{n.body}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill */}
            {user && (
              <div className="flex items-center gap-2.5 ps-2 border-s border-[var(--bw-line)]">
                <Link to="/team" className="flex items-center gap-2.5">
                  <StaffAvatar avatar={user.avatar} name={user.name} initials={user.initials} size="sm" />
                  <div className="hidden md:block text-start leading-tight">
                    <div className="text-xs font-bold text-[var(--bw-ink)]">{user.name}</div>
                    <div className="text-[10.5px] text-[var(--bw-muted)]">{user.designation}</div>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => void logout()}
                  title="Sign out"
                  className="p-2 rounded-full hover:bg-red-500/10 text-[var(--bw-muted)] hover:text-red-500 cursor-pointer"
                >
                  <LogOut size={15} />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Active Page Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1640px] w-full mx-auto">
          <Outlet />
        </main>

        <footer className="px-6 py-3 border-t border-[var(--bw-line)] text-[11px] text-[var(--bw-muted)] flex flex-wrap items-center justify-between gap-2 no-print">
          <span>
            Betterway Mortgages LLC · Al Nasr Plaza, Oud Metha, Dubai, UAE · Licensed UAE Mortgage Broker · Sister Brand to SWK Properties
          </span>
          <span className="font-mono-num">
            3M EIBOR: {EIBOR_SNAPSHOT.latest.threeMonth.toFixed(3)}% ({EIBOR_SNAPSHOT.asOfDate}) · Company Bank Account Guard Active
          </span>
        </footer>
      </div>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}
