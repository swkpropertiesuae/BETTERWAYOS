import {
  Activity,
  ArrowLeftRight,
  BadgeDollarSign,
  BarChart3,
  BookOpen,
  Bot,
  Building2,
  Calculator,
  CalendarClock,
  CalendarDays,
  ChartArea,
  CheckSquare,
  ClipboardCheck,
  CreditCard,
  Database,
  DatabaseZap,
  FileSignature,
  FileText,
  Gauge,
  Handshake,
  Home,
  Inbox,
  Landmark,
  LayoutDashboard,
  LineChart,
  Lock,
  PhoneCall,
  Plug,
  Printer,
  QrCode,
  Repeat,
  Search,
  Send,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  SquareTerminal,
  Target,
  Trash2,
  TrendingUp,
  UserPlus,
  UserRound,
  Users,
  UsersRound,
  Wallet,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

export type AppTone = 'oxblood' | 'brass' | 'moss' | 'ink' | 'copper' | 'plum';

export interface OsItem {
  label: string;
  href: string;
  icon: LucideIcon;
  desc: string;
  /** Capability key from estate-os permissions, used to hide pages a role cannot open. */
  cap?: string;
  /** Extra path prefix that should also highlight this item (for example print routes). */
  prefix?: string;
}

export interface OsApp {
  key: string;
  label: string;
  blurb: string;
  icon: LucideIcon;
  tone: AppTone;
  items: OsItem[];
}

/** Legacy Estate-OS interactive workspace pages live behind hash routes on /os/workspace; live executive Overview lives on /os. */
const e = (key: string) => (key === 'dashboard' ? '/os' : `/os/workspace#/${key}`);

/**
 * Betterway Mortgages OS, workflow-ordered. Same launcher composition as SWK OS:
 * every department is one app, and every app lists its pages step by step.
 */
export const OS_APPS: OsApp[] = [
  {
    key: 'dashboards',
    label: 'Dashboards',
    blurb: 'Overview, pipeline, 10-step workflow, market pulse & AI assistant',
    icon: LayoutDashboard,
    tone: 'oxblood',
    items: [
      { label: 'Overview', href: e('dashboard'), icon: LayoutDashboard, desc: 'Daily mortgage business summary' },
      { label: 'Sales Intelligence', href: e('sales'), icon: LineChart, desc: 'Lead sources, funnel & speed to lead', cap: 'reports.view' },
      { label: 'Deal Pipeline', href: '/os/deals', icon: ArrowLeftRight, desc: 'Track every mortgage deal step by step' },
      { label: '10-Step Workflow', href: '/os/steps', icon: CheckSquare, desc: 'Sequential company guide, enquiry to payout', prefix: '/os/steps' },
      { label: 'Playbook Engine', href: '/os/workflow', icon: Activity, desc: 'Stage playbooks and SLA clocks' },
      { label: 'Daily Operations', href: '/os/operations', icon: Gauge, desc: 'Company workflow control desk' },
      { label: 'Market Pulse', href: '/os/market', icon: Target, desc: 'Dubai prices, yields & 15-year outlook' },
      { label: 'Attendance Check-In', href: '/os/reception-qr', icon: QrCode, desc: 'Office QR scan & check-in' },
      { label: 'AI Assistant', href: '/os/bi-copilot', icon: Sparkles, desc: 'Underwriting and policy co-pilot' },
      { label: 'Record Search', href: '/os/search', icon: Search, desc: 'Borrowers, Emirates IDs & files' },
    ],
  },
  {
    key: 'crm',
    label: 'CRM & Inbox',
    blurb: 'Leads with 5-minute SLA, WhatsApp, email, calls & follow-ups',
    icon: Inbox,
    tone: 'moss',
    items: [
      { label: 'Leads & 5m SLA', href: '/os/crm', icon: UserPlus, desc: 'Step 1 · New mortgage enquiries' },
      { label: 'Unified Inbox', href: '/os/inbox', icon: Inbox, desc: 'Step 2 · WhatsApp, email & internal notes' },
      { label: 'Tasks & Appointments', href: '/os/activities', icon: CheckSquare, desc: 'Step 3 · Viewings, DLD & callbacks' },
      { label: 'Cross-Sell Desk', href: '/os/cross-sell', icon: Sparkles, desc: 'Step 4 · Takaful, Wills & Golden Visa' },
      { label: 'Leads Workspace', href: e('leads'), icon: UserRound, desc: 'Qualify, assign & import leads', cap: 'leads.view' },
      { label: 'Contacts', href: e('contacts'), icon: Users, desc: 'Borrowers, co-borrowers & guarantors', cap: 'leads.view' },
      { label: 'Appointments', href: e('appointments'), icon: CalendarDays, desc: 'Calendar of meetings & visits', cap: 'leads.view' },
      { label: 'Tasks', href: e('tasks'), icon: CheckSquare, desc: 'Follow-up task list', cap: 'leads.view' },
      { label: 'Conversations', href: e('inbox'), icon: Inbox, desc: 'Threaded customer conversations', cap: 'inbox.reply' },
      { label: 'Calls', href: e('calls'), icon: PhoneCall, desc: 'Click-to-call and call log', cap: 'calls.place' },
      { label: 'Follow-ups', href: e('followups'), icon: Repeat, desc: 'Drip sequences & reminders', cap: 'inbox.reply' },
      { label: 'Activity Feed', href: e('activity'), icon: Activity, desc: 'Everything that happened, newest first', cap: 'leads.view' },
    ],
  },
  {
    key: 'origination',
    label: 'Origination & LOS',
    blurb: '24-bank underwriting, CBUAE 50% DBR, bank rates & PDC vault',
    icon: Landmark,
    tone: 'brass',
    items: [
      { label: '24-Bank Underwriting', href: '/os/los', icon: Landmark, desc: 'Step 1 · CBUAE 50% DBR & bank matrix' },
      { label: 'DBR Toolkit', href: '/os/toolkit', icon: Calculator, desc: 'Step 2 · Buyout, rent vs buy & EMI' },
      { label: 'Bank Rates & APL', href: '/os/banks-apl', icon: Building2, desc: 'Step 3 · Maker-checker rate cards' },
      { label: 'Loans & PDC Vault', href: '/os/loan-risk-pdc', icon: CreditCard, desc: 'Step 4 · EIBOR schedule & security cheques' },
      { label: 'CBUAE LOS Desk', href: e('cbuae'), icon: Landmark, desc: 'Fact-find and bank ranker', cap: 'leads.view' },
      { label: 'Properties', href: e('properties'), icon: Building2, desc: 'Property matches & valuations', cap: 'leads.view' },
    ],
  },
  {
    key: 'conveyancing',
    label: 'Sales & Conveyancing',
    blurb: 'Form F, valuation, developer NOC, DLD cheques & handover',
    icon: Send,
    tone: 'oxblood',
    items: [
      { label: 'DLD & Cheque Pack', href: '/os/conveyancing', icon: Send, desc: 'Step 1 · Form F, NOC & manager cheques' },
      { label: 'Off-Plan Handover', href: '/os/handover', icon: Home, desc: 'Step 2 · Snagging, Oqood & escrow' },
      { label: 'Proposal Print Suite', href: '/os/print/proposal/1', icon: Printer, desc: 'Step 3 · Branded bank proposals', prefix: '/os/print' },
      { label: 'Withdrawals & Refunds', href: '/os/withdrawals', icon: FileSignature, desc: 'Step 4 · Cancellations & splits' },
      { label: 'Deals Workspace', href: e('deals'), icon: Handshake, desc: 'Board and table of deals', cap: 'leads.view' },
      { label: 'Conveyancing Desk', href: e('conveyancing'), icon: Send, desc: 'Transfer milestones', cap: 'leads.view' },
    ],
  },
  {
    key: 'finance',
    label: 'Accounting & VAT',
    blurb: 'Double-entry GL, VAT 201, corporate tax, P&L & commissions',
    icon: TrendingUp,
    tone: 'copper',
    items: [
      { label: 'Accounting & FTA VAT', href: '/os/erp', icon: TrendingUp, desc: 'Step 1 · Trial balance, VAT 201 & PINT-AE' },
      { label: 'Expenses, P&L & BS', href: '/os/accounts-expenses', icon: Wallet, desc: 'Step 2 · Financial statements & bills' },
      { label: 'ERP Hub', href: e('erp'), icon: TrendingUp, desc: 'Ledger overview', cap: 'finance.view' },
      { label: 'Finance', href: e('finance'), icon: BadgeDollarSign, desc: 'Revenue & commission view', cap: 'finance.view' },
      { label: 'Reports', href: e('reports'), icon: BarChart3, desc: 'Exportable business reports', cap: 'reports.view' },
    ],
  },
  {
    key: 'compliance',
    label: 'Compliance & AML',
    blurb: 'Joint KFS sign-off, sanctions screening, goAML XML & PDPL',
    icon: Shield,
    tone: 'plum',
    items: [
      { label: 'KFS & goAML', href: '/os/compliance', icon: Shield, desc: 'Step 1 · CBUAE KFS gate & FIU goAML' },
      { label: 'PDPL Privacy', href: '/os/privacy', icon: Lock, desc: 'Step 2 · Decree-Law 45/2021' },
      { label: 'Audit Logs', href: e('audit'), icon: ShieldCheck, desc: 'Immutable change history', cap: 'audit.view' },
      { label: 'Data Quality', href: e('dataquality'), icon: DatabaseZap, desc: 'Duplicates and missing fields', cap: 'leads.view' },
    ],
  },
  {
    key: 'team',
    label: 'Employees & WPS',
    blurb: 'Staff workload, MOHRE WPS .SIF payroll, EOSB & attendance',
    icon: UsersRound,
    tone: 'ink',
    items: [
      { label: 'Team & Workload', href: '/os/team', icon: UsersRound, desc: 'Step 1 · Staff roster & capacity' },
      { label: 'Payroll & WPS', href: '/os/hrm', icon: Users, desc: 'Step 2 · Monthly .SIF & gratuity' },
      { label: 'Reception QR', href: '/os/reception-qr', icon: QrCode, desc: 'Step 3 · 10:05 AM GST check-in' },
      { label: 'Team Directory', href: e('team'), icon: UsersRound, desc: 'People and roles', cap: 'team.view' },
    ],
  },
  {
    key: 'ai',
    label: 'AI Operations',
    blurb: 'Pilot desk, AI agents, automations, workflows & approvals',
    icon: Bot,
    tone: 'moss',
    items: [
      { label: 'Pilot Operations', href: e('pilot'), icon: Gauge, desc: 'Live pilot health', cap: 'logs.view' },
      { label: 'AI Agents', href: e('agents'), icon: Bot, desc: 'Agent roster and prompts', cap: 'logs.view' },
      { label: 'Automations', href: e('automations'), icon: CalendarClock, desc: 'Triggers and rules', cap: 'leads.view' },
      { label: 'Workflows', href: e('workflows'), icon: Workflow, desc: 'Durable jobs and retries', cap: 'logs.view' },
      { label: 'Approvals', href: e('approvals'), icon: ClipboardCheck, desc: 'Items waiting for sign-off', cap: 'approvals.decide' },
      { label: 'Execution Logs', href: e('logs'), icon: SquareTerminal, desc: 'Every run, step by step', cap: 'logs.view' },
    ],
  },
  {
    key: 'docs',
    label: 'Documents & Manual',
    blurb: 'Credit policy wiki, data hub, templates & integrations',
    icon: FileText,
    tone: 'brass',
    items: [
      { label: 'Credit Policy Wiki', href: '/os/wiki', icon: BookOpen, desc: 'Step 1 · SOPs & bank policy manual' },
      { label: 'Data Hub & UAT', href: '/os/data', icon: Database, desc: 'Step 2 · Templates & CSV import/export' },
      { label: 'Documents', href: e('documents'), icon: FileText, desc: 'Letters and templates', cap: 'documents.edit' },
      { label: 'Integrations', href: e('integrations'), icon: Plug, desc: 'WhatsApp, email & portals', cap: 'integrations.manage' },
    ],
  },
  {
    key: 'admin',
    label: 'Settings',
    blurb: 'Delete bin, executive command, go-live checklist & security',
    icon: Settings,
    tone: 'oxblood',
    items: [
      { label: 'Executive Command', href: '/os/command', icon: LayoutDashboard, desc: 'Master OS control desk' },
      { label: 'Pending Delete Bin', href: '/os/recycle-bin', icon: Trash2, desc: 'Owner sign-off on deletions' },
      { label: 'Go-Live Checklist', href: '/os/golive', icon: CheckSquare, desc: 'Production readiness' },
      { label: 'Security & MFA', href: '/os/security', icon: Lock, desc: 'TOTP MFA & production lock' },
      { label: 'Workspace Settings', href: e('settings'), icon: Settings, desc: 'Company, SLA & roles', cap: 'settings.manage' },
    ],
  },
];

export const OS_ITEMS = OS_APPS.flatMap((app) => app.items.map((item) => ({ ...item, app })));

export interface ActiveNav {
  app: OsApp;
  item: OsItem;
}

/** Resolve the app + page for the current URL. `estateKey` is the hash route key when on /os/workspace. */
export function findActiveNav(pathname: string, estateKey?: string): ActiveNav | null {
  const clean = pathname.split('?')[0] || '/os';
  if (clean === '/os') {
    const hit = OS_ITEMS.find((i) => i.href === '/os');
    return hit ? { app: hit.app, item: hit } : null;
  }
  if (clean === '/os/workspace') {
    const href = e(estateKey || 'dashboard');
    const hit = OS_ITEMS.find((i) => i.href === href) || OS_ITEMS.find((i) => i.href === '/os');
    return hit ? { app: hit.app, item: hit } : null;
  }
  let best: (typeof OS_ITEMS)[number] | null = null;
  for (const i of OS_ITEMS) {
    if (i.href.startsWith('/os/workspace#')) continue;
    const p = i.prefix ?? i.href;
    if (clean === p || clean.startsWith(p + '/')) {
      if (!best || p.length > (best.prefix ?? best.href).length) best = i;
    }
  }
  return best ? { app: best.app, item: best } : null;
}

export function appOf(key: string): OsApp | undefined {
  return OS_APPS.find((a) => a.key === key);
}
