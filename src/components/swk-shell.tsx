'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import '@/estate-os/styles/tokens.css';
import '@/estate-os/styles/base.css';
import '@/estate-os/styles/components.css';
import '@/estate-os/styles/motion.css';
import '@/estate-os/styles/assistant.css';
import '@/estate-os/styles/integrations.css';
import { DubaiClock, OsFrame, QuickAdd } from '@/components/os-chrome';
import { StaffAvatar } from '@/components/staff-avatar';
import { OS_ITEMS } from '@/lib/os-apps';
import {
  Activity,
  ArrowLeftRight,
  ArrowUp,
  Bell,
  BookOpen,
  Building2,
  Calculator,
  ChartArea,
  CheckSquare,
  CornerDownLeft,
  CreditCard,
  Database,
  FileSignature,
  Home,
  Inbox,
  Landmark,
  LayoutDashboard,
  LayoutGrid,
  Lock,
  LogOut,
  Menu as MenuIcon,
  Moon,
  OctagonPause,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Printer,
  QrCode,
  Search,
  Send,
  Settings,
  Shield,
  Sparkles,
  Sun,
  Target,
  Trash2,
  TrendingUp,
  UserPlus,
  Users,
  UsersRound,
  Wallet,
  X,
} from 'lucide-react';

export interface DrawerDealRecord {
  id: string;
  dealRef: string;
  borrowerName: string;
  residency: 'UAE National' | 'Expat Salaried' | 'Self-Employed' | 'Non-Res';
  eidNumber: string;
  phone: string;
  propertyTitle: string;
  propertyValueAed: number;
  loanAmountAed: number;
  ltvPct: number;
  selectedBank: string;
  rateLabel: string;
  dbrPct: number;
  docsVerified: number;
  docsTotal: number;
  stage: string;
  daysInStage: number;
  monthlyIncomeAed: number;
  existingDebtAed: number;
  aecbScore: number;
}

export const DEFAULT_DRAWER_DEALS: DrawerDealRecord[] = [];

export const CORPORATE_NAV_SECTIONS = [
  {
    key: 'command',
    label: 'Dashboards',
    blurb: 'Overview, deal pipeline, approvals & daily operations',
    icon: LayoutDashboard,
    items: [
      { title: 'Overview', url: '/os', icon: LayoutDashboard, desc: 'Daily business & mortgage summary' },
      { title: 'All Apps Launcher', url: '/os/home', icon: LayoutGrid, desc: 'Department app launcher grid' },
      { title: 'Deal Pipeline', url: '/os/deals', icon: ArrowLeftRight, desc: 'Track deals step by step' },
      { title: '10-Step Workflow', url: '/os/steps', icon: CheckSquare, desc: 'Sequential 10-step company guide' },
      { title: 'Playbook Engine', url: '/os/workflow', icon: Activity, desc: 'Automated stage playbooks & SLAs' },
      { title: 'Daily Operations', url: '/os/operations', icon: Activity, desc: 'Company workflow control' },
      { title: 'Market Pulse', url: '/os/market', icon: Target, desc: 'Dubai prices, yields & 15Y outlook' },
      { title: 'Attendance Check-In', url: '/os/reception-qr', icon: QrCode, desc: 'Office reception scan & check-in' },
      { title: 'AI Assistant', url: '/os/bi-copilot', icon: Sparkles, desc: 'Smart underwriting & policy helper' },
      { title: 'Global Record Search', url: '/os/search', icon: Search, desc: 'Search borrowers, EIDs & files' },
    ],
  },
  {
    key: 'clients',
    label: 'CRM & Inbox',
    blurb: 'Leads, 5m SLA clock, WhatsApp, email, team chat & follow-ups',
    icon: Inbox,
    items: [
      { title: 'Leads & 5m SLA', url: '/os/crm', icon: UserPlus, desc: 'Step 1 · New mortgage enquiries' },
      { title: 'Unified Inbox', url: '/os/inbox', icon: Inbox, desc: 'Step 2 · WhatsApp, email & internal notes' },
      { title: 'Tasks & Appointments', url: '/os/activities', icon: CheckSquare, desc: 'Step 3 · Viewings, DLD & callbacks' },
      { title: '360° Cross-Sell Desk', url: '/os/cross-sell', icon: Sparkles, desc: 'Step 4 · Life Takaful, Wills & Golden Visa' },
    ],
  },
  {
    key: 'origination',
    label: 'Origination & LOS',
    blurb: '24-bank underwriting, CBUAE 50% DBR, bank rates & PDC vault',
    icon: Landmark,
    items: [
      { title: '24-Bank Underwriting', url: '/os/los', icon: Landmark, desc: 'Step 1 · CBUAE 50% DBR & 24-bank matrix' },
      { title: 'CBUAE 50% DBR Toolkit', url: '/os/toolkit', icon: Calculator, desc: 'Step 2 · Buyout break-even & rent vs buy' },
      { title: 'Bank Rates & APL', url: '/os/banks-apl', icon: Building2, desc: 'Step 3 · Maker-checker rate cards & towers' },
      { title: 'Loans & PDC Vault', url: '/os/loan-risk-pdc', icon: CreditCard, desc: 'Step 4 · EIBOR schedule & security cheques' },
    ],
  },
  {
    key: 'conveyancing',
    label: 'Sales & Conveyancing',
    blurb: 'Form F (MOU), RICS valuation, developer NOC, DLD cheques & handover',
    icon: Send,
    items: [
      { title: 'DLD & Cheque Pack', url: '/os/conveyancing', icon: Send, desc: 'Step 1 · Form F, NOC & Manager Cheques' },
      { title: 'Off-Plan Handover', url: '/os/handover', icon: Home, desc: 'Step 2 · Snagging, Oqood & escrow tranches' },
      { title: '6-Doc Print Suite', url: '/os/print/proposal/1', icon: Printer, desc: 'Step 3 · Branded 3-bank proposals & AIP' },
      { title: 'Withdrawals & Refunds', url: '/os/withdrawals', icon: FileSignature, desc: 'Step 4 · Deal cancellations & 50/50 splits' },
    ],
  },
  {
    key: 'finance',
    label: 'Accounting & VAT',
    blurb: 'Double-entry GL, FTA VAT 201, 9% Corporate Tax, P&L & Balance Sheet',
    icon: TrendingUp,
    items: [
      { title: 'Accounting & FTA VAT', url: '/os/erp', icon: TrendingUp, desc: 'Step 1 · Trial Balance, VAT 201 & PINT-AE' },
      { title: 'Expenses, P&L & BS', url: '/os/accounts-expenses', icon: Wallet, desc: 'Step 2 · Financial statements & bills' },
    ],
  },
  {
    key: 'compliance',
    label: 'Compliance & AML',
    blurb: 'Joint CBUAE KFS sign-off, PEP/sanctions screening, goAML XML & PDPL',
    icon: Shield,
    items: [
      { title: 'Joint KFS & goAML', url: '/os/compliance', icon: Shield, desc: 'Step 1 · CBUAE KFS gate & FIU goAML XML' },
      { title: 'PDPL Privacy', url: '/os/privacy', icon: Lock, desc: 'Step 2 · Federal Decree-Law 45/2021 privacy' },
    ],
  },
  {
    key: 'team',
    label: 'Employees & WPS',
    blurb: 'Internal staff workload, MOHRE WPS .SIF payroll, EOSB gratuity & QR',
    icon: UsersRound,
    items: [
      { title: 'Team & Workload', url: '/os/team', icon: UsersRound, desc: 'Step 1 · Internal staff roster & capacity' },
      { title: 'Payroll & MOHRE WPS', url: '/os/hrm', icon: Users, desc: 'Step 2 · Monthly WPS .SIF & EOSB gratuity' },
      { title: 'Reception QR Check-In', url: '/os/reception-qr', icon: QrCode, desc: 'Step 3 · 10:05 AM GST office QR stand' },
    ],
  },
  {
    key: 'admin',
    label: 'Settings & Manual',
    blurb: 'Credit policy wiki, 50-file data hub, pending delete bin & security',
    icon: Settings,
    items: [
      { title: 'Credit Policy Wiki', url: '/os/wiki', icon: BookOpen, desc: 'Step 1 · Company SOPs & bank policy manual' },
      { title: 'Data Hub & UAT', url: '/os/data', icon: Database, desc: 'Step 2 · 50-file templates & CSV import/export' },
      { title: 'Pending Delete Bin', url: '/os/recycle-bin', icon: Trash2, desc: 'Step 3 · Owner Shabib Siraj delete sign-off' },
      { title: 'Executive Command', url: '/os/command', icon: LayoutDashboard, desc: 'Step 4 · Master OS control desk' },
      { title: 'Go-Live Checklist', url: '/os/golive', icon: CheckSquare, desc: 'Step 5 · Production readiness verification' },
      { title: 'Security & MFA', url: '/os/security', icon: Settings, desc: 'Step 6 · TOTP MFA & production lock' },
    ],
  },
];

export function openDealDrawer(deal: DrawerDealRecord) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bw:open-deal-drawer', { detail: deal }));
  }
}

export function OsLayoutFrame({
  user,
  lang,
  openTasksCount = 0,
  eibor3mPct = '4.18',
  children,
}: {
  user: { full_name_en: string; role: string; email: string };
  lang: 'en' | 'ar';
  openTasksCount?: number;
  canPrintQr?: boolean;
  eibor3mPct?: string;
  eibor6mPct?: string;
  activePipelineM?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() || '/os';
  const router = useRouter();

  const [outboundPaused, setOutboundPaused] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<Array<{ id: string; role: 'assistant' | 'user'; text: string }>>([
    {
      id: 'welcome',
      role: 'assistant',
      text: "Hello — I'm your Betterway Mortgages OS assistant. Ask me about CBUAE 50% DBR stress tests, 24-bank rate cards, DLD Form F cheque splits, or FTA VAT 201 ledgers.",
    },
  ]);

  useEffect(() => {
    const saved = localStorage.getItem('estate-os:theme');
    if (saved === 'dark' || saved === 'light') {
      setTheme(saved);
      document.documentElement.dataset.theme = saved;
    } else {
      document.documentElement.dataset.theme = 'light';
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('estate-os:theme', next);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    setUserMenuOpen(false);
    setNotifOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setAiOpen((v) => !v);
      }
      if (e.key === 'Escape') {
        setCmdOpen(false);
        setUserMenuOpen(false);
        setNotifOpen(false);
        setAiOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // On /os/workspace, EstateOsHost renders its own interactive canvas frame.
  if (pathname === '/os/workspace') {
    return <>{children}</>;
  }

  const initials = (user.full_name_en || user.email || 'BW')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join('');

  const filteredCmd = OS_ITEMS.filter(
    (n) =>
      !cmdQuery.trim() ||
      n.label.toLowerCase().includes(cmdQuery.toLowerCase()) ||
      n.desc.toLowerCase().includes(cmdQuery.toLowerCase()) ||
      n.app.label.toLowerCase().includes(cmdQuery.toLowerCase()),
  );

  const handleAiSend = (text?: string) => {
    const q = (text ?? aiInput).trim();
    if (!q) return;
    const uMsg = { id: `u-${Date.now()}`, role: 'user' as const, text: q };
    const bMsg = {
      id: `b-${Date.now() + 1}`,
      role: 'assistant' as const,
      text: `Betterway Mortgages OS:\n• 3M EIBOR Benchmark: ${eibor3mPct}%\n• CBUAE 50.0% DBR Hard Gate: Active across all 24 UAE banks (+2.0% stress buffer).\n• Net commission split: 50% Betterway Mortgages LLC / 50% Sales Advisor.`,
    };
    setAiMessages((prev) => [...prev, uMsg, bMsg]);
    if (!text) setAiInput('');
  };

  const header = (
    <>
      <DubaiClock />
      <span className="swk-chip brass swk-hide-lg" title="CBUAE 3M EIBOR benchmark, UAE dirham workspace">
        3M EIBOR {eibor3mPct}% · AED
      </span>
      {outboundPaused && <span className="swk-chip warn swk-hide-md">Outbound paused</span>}
      <button type="button" className="swk-search-pill" onClick={() => setCmdOpen(true)} aria-label="Search (Ctrl K)">
        <Search size={15} />
        <span>Search leads, banks, deals…</span>
        <kbd>Ctrl K</kbd>
      </button>
      <button
        type="button"
        className="swk-tbtn"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
      >
        {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
      </button>
      <div className="swk-rel">
        <button
          type="button"
          className="swk-tbtn"
          onClick={() => {
            setNotifOpen((o) => !o);
            setUserMenuOpen(false);
          }}
          aria-label={`Notifications, ${openTasksCount} open tasks`}
        >
          <Bell size={17} />
          {openTasksCount > 0 && <span className="count">{openTasksCount}</span>}
        </button>
        {notifOpen && (
          <div className="swk-menu" role="dialog" aria-label="Notifications" style={{ width: 340 }}>
            <div className="head">
              <b>Notifications</b>
            </div>
            <div className="sep" />
            <div className="head" style={{ textAlign: 'center', padding: '22px 10px' }}>
              {openTasksCount > 0 ? `${openTasksCount} open tasks need follow-up.` : "You're all caught up."}
            </div>
            {openTasksCount > 0 && (
              <a href="/os/activities">
                <span className="ic">
                  <CheckSquare size={16} />
                </span>
                <span>
                  <b>Open tasks</b>
                  <small>Review callbacks, viewings and DLD steps</small>
                </span>
              </a>
            )}
          </div>
        )}
      </div>
      <QuickAdd />
      <div className="swk-rel">
        <button
          type="button"
          className="swk-avatar overflow-hidden p-0"
          onClick={() => {
            setUserMenuOpen((o) => !o);
            setNotifOpen(false);
          }}
          aria-label="Account menu"
          aria-expanded={userMenuOpen}
        >
          <StaffAvatar name={user.full_name_en} email={user.email} size={36} />
        </button>
        {userMenuOpen && (
          <div className="swk-menu" style={{ minWidth: 260 }}>
            <div className="head flex items-center gap-2.5">
              <StaffAvatar name={user.full_name_en} email={user.email} size={38} />
              <div className="min-w-0">
                <b className="truncate block">{user.full_name_en}</b>
                <div className="truncate text-[11px]">
                  {user.email} · {user.role}
                </div>
              </div>
            </div>
            <div className="sep" />
            <Link href="/os/home" onClick={() => setUserMenuOpen(false)}>
              <span className="ic">
                <LayoutGrid size={16} />
              </span>
              All apps
            </Link>
            <Link href="/os" onClick={() => setUserMenuOpen(false)}>
              <span className="ic">
                <LayoutDashboard size={16} />
              </span>
              Dashboard
            </Link>
            <button
              type="button"
              className="item"
              onClick={() => {
                toggleTheme();
                setUserMenuOpen(false);
              }}
            >
              <span className="ic">{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</span>
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
            <div className="sep" />
            <form method="POST" action="/api/v1/auth/logout">
              <button type="submit" className="item">
                <span className="ic">
                  <LogOut size={16} />
                </span>
                Sign out
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );

  const sidebarFooter = (
    <div className={`swk-kill ${outboundPaused ? 'on' : ''}`}>
      <OctagonPause size={16} />
      <div className="grow">
        <div style={{ fontWeight: 600 }}>{outboundPaused ? 'Outbound paused' : 'Outbound live'}</div>
        <small>Global kill switch</small>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={outboundPaused}
        className={`switch danger ${outboundPaused ? 'on' : ''}`}
        onClick={() => setOutboundPaused((v) => !v)}
        aria-label="Pause all outbound"
      />
    </div>
  );

  return (
    <OsFrame pathname={pathname} header={header} sidebarFooter={sidebarFooter} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="page">{children}</div>

      {/* Floating AI Assistant Launcher */}
      <button
        type="button"
        className="ai-fab no-print"
        onClick={() => setAiOpen((v) => !v)}
        aria-label="Open AI assistant"
        title="Ask Betterway AI Assistant (Ctrl J)"
      >
        <Sparkles size={20} />
      </button>

      {aiOpen && (
        <aside className="ai-panel no-print" role="dialog" aria-label="AI Assistant">
          <div className="ai-head">
            <span className="ai-orb">
              <Sparkles size={15} />
            </span>
            <div className="grow">
              <div className="ai-title">Betterway AI Assistant</div>
              <div className="ai-sub">CBUAE 50% DBR · 24 UAE Banks · DLD &amp; VAT</div>
            </div>
            <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => setAiOpen(false)} aria-label="Close assistant">
              <X size={16} />
            </button>
          </div>
          <div className="ai-body">
            {aiMessages.map((m) => (
              <div key={m.id} className={`ai-msg ${m.role}`}>
                <div className="ai-bubble" style={{ whiteSpace: 'pre-line' }}>
                  {m.text}
                </div>
              </div>
            ))}
            <div className="ai-chips">
              {['CBUAE 50% DBR stress rule', 'Top 3Yr fixed bank rates', '50/50 commission & FTA VAT'].map((chip) => (
                <button key={chip} type="button" className="ai-chip" onClick={() => handleAiSend(chip)}>
                  {chip}
                </button>
              ))}
            </div>
          </div>
          <form
            className="ai-compose"
            onSubmit={(e) => {
              e.preventDefault();
              handleAiSend();
            }}
          >
            <input
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="Ask about leads, DBR, banks, or DLD…"
              style={{ flex: 1, border: 0, outline: 'none', background: 'transparent', fontSize: 13.5, height: 34 }}
            />
            <button type="submit" className="ai-send" disabled={!aiInput.trim()} aria-label="Send">
              <ArrowUp size={16} />
            </button>
          </form>
        </aside>
      )}

      {/* Command Palette (Ctrl K) */}
      {cmdOpen && (
        <>
          <div className="overlay" onClick={() => setCmdOpen(false)} />
          <div className="cmdk" role="dialog" aria-label="Command palette">
            <div className="cmdk-input">
              <Search size={17} className="faint" />
              <input autoFocus value={cmdQuery} onChange={(e) => setCmdQuery(e.target.value)} placeholder="Search or jump to…" aria-label="Search" />
              <span className="kbd">Esc</span>
            </div>
            <div className="cmdk-list">
              {filteredCmd.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.href}
                    type="button"
                    className="cmdk-item"
                    onClick={() => {
                      setCmdOpen(false);
                      if (item.href.startsWith('/os/workspace#')) window.location.href = item.href;
                      else router.push(item.href);
                    }}
                  >
                    <span className="faint">
                      <Icon size={15} />
                    </span>
                    <span className="truncate">{item.label}</span>
                    <span className="hint">{item.app.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="row faint" style={{ padding: '9px 14px', borderTop: '1px solid var(--border-soft)', fontSize: 12, gap: 14 }}>
              <span className="row" style={{ gap: 5 }}>
                <CornerDownLeft size={12} /> open
              </span>
              <span className="row ml-auto" style={{ gap: 5 }}>
                <span className="kbd">Ctrl K</span> anywhere to search
              </span>
            </div>
          </div>
        </>
      )}
    </OsFrame>
  );
}
