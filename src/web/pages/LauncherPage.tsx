import { useEffect, useState, type PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Calculator,
  CalendarDays,
  CheckCircle2,
  CheckSquare,
  Crown,
  FilePenLine,
  FileSpreadsheet,
  Globe,
  Handshake,
  KanbanSquare,
  Landmark,
  LayoutDashboard,
  LineChart,
  Lock,
  MapPin,
  MessageCircle,
  MessagesSquare,
  PhoneCall,
  QrCode,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  Wand2,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { apiFetch, fmtAed } from '../lib/api';
import { EIBOR_SNAPSHOT, UAE_BANKS } from '@shared/banks-data';

interface LauncherTile {
  key: string;
  label: string;
  blurb: string;
  actionTag: string;
  to: string;
  cat: string;
  icon: LucideIcon;
  tone: 'emerald' | 'gold' | 'navy' | 'sky' | 'violet';
  ownerOnly?: boolean;
}

const APP_TILES: LauncherTile[] = [
  { key: 'shabib', label: "Shabib's Corner", blurb: 'Owner daily plan, AI bulk client importer, VIP fast-track & sign-offs', actionTag: 'Owner Control', to: '/shabibs-corner', cat: 'today', icon: Crown, tone: 'gold', ownerOnly: true },
  { key: 'my-work', label: 'My Tasks Today', blurb: 'Clear action checklist — mark client follow-ups and bank calls done in 1 click', actionTag: 'Execute Today', to: '/my-work', cat: 'today', icon: CheckSquare, tone: 'emerald' },
  { key: 'my-cases', label: 'My Assigned Clients', blurb: 'Your buyer list with 1-tap Call & WhatsApp — phone numbers stay safe', actionTag: 'Call & Close', to: '/my-cases', cat: 'deals', icon: UserCheck, tone: 'emerald' },
  { key: 'pipeline', label: 'Mortgage Steps (1→12)', blurb: 'Move every buyer smoothly from First Call to Bank Disbursal & Payout', actionTag: '12 Clear Steps', to: '/pipeline', cat: 'deals', icon: KanbanSquare, tone: 'emerald' },
  { key: 'vault', label: 'Client Vault (Protected)', blurb: 'Store buyer lists safely with hidden phone numbers and 1-click advisor assignment', actionTag: 'Zero Data Leak', to: '/vault', cat: 'deals', icon: Lock, tone: 'navy' },
  { key: 'leads', label: 'New Enquiries & SWK', blurb: 'Website leads plus direct buyer handoffs from sister brand SWK Properties', actionTag: 'Fast Intake', to: '/leads', cat: 'deals', icon: UserPlus, tone: 'sky' },
  { key: 'dashboard', label: 'Business Results', blurb: 'Live AED loan book, bank commissions earned, team rankings & EIBOR rates', actionTag: 'Live Scoreboard', to: '/dashboard', cat: 'today', icon: LayoutDashboard, tone: 'navy' },
  { key: 'banks', label: '24 Partner Banks', blurb: 'Compare live fixed & variable rates, LTV caps and developer lists across 24 banks', actionTag: '24 UAE Banks', to: '/banks', cat: 'banks', icon: Landmark, tone: 'gold' },
  { key: 'calculators', label: 'Borrowing Calculator', blurb: 'Check how much a client can borrow, monthly EMI, upfront costs & buyout savings', actionTag: '8 Calculators', to: '/calculators', cat: 'banks', icon: Calculator, tone: 'emerald' },
  { key: 'word-studio', label: 'Letter & Word Studio', blurb: 'Generate branded Quotes, Zero-Fee Agreements & Developer SOA letters with Seal', actionTag: 'Print & Seal', to: '/word-studio', cat: 'banks', icon: FilePenLine, tone: 'gold' },
  { key: 'communications', label: 'Client Messages', blurb: 'Send WhatsApp & Email updates in 1 click using approved mortgage templates', actionTag: 'WhatsApp + Email', to: '/communications', cat: 'deals', icon: MessageCircle, tone: 'emerald' },
  { key: 'calendar', label: 'Schedule & Deadlines', blurb: 'Never miss a valuation visit, FOL expiry date or DLD Trustee signing', actionTag: 'No Missed Dates', to: '/calendar', cat: 'today', icon: CalendarDays, tone: 'sky' },
  { key: 'field-duty', label: 'Field Visits GPS & SOS', blurb: 'Log bank, developer or valuation visits with live GPS pin & safety alert', actionTag: 'Live Map + GPS', to: '/field-duty', cat: 'today', icon: MapPin, tone: 'emerald' },
  { key: 'utilities', label: 'Translator, OCR & Search', blurb: 'Translate 9 languages, scan Emirates ID/Salary slips & search all OS records', actionTag: '9 Languages + OCR', to: '/utilities', cat: 'banks', icon: Wand2, tone: 'violet' },
  { key: 'ai', label: 'AI Mortgage Helper', blurb: 'Ask UAE Central Bank rules, non-resident limits or live pipeline stats anytime', actionTag: 'Instant Answers', to: '/ai', cat: 'banks', icon: Sparkles, tone: 'violet' },
  { key: 'finance', label: 'Commissions & Money', blurb: 'Track bank commission invoices, 5% VAT, payouts & company-account-only lock', actionTag: 'Revenue Control', to: '/finance', cat: 'money', icon: Wallet, tone: 'gold' },
  { key: 'compliance', label: 'Rules, Seal & Delete Bin', blurb: 'PDPL privacy consent, AML checks, official seals & Owner Recycle Bin', actionTag: '100% Compliant', to: '/compliance', cat: 'money', icon: ShieldCheck, tone: 'navy' },
  { key: 'data-hub', label: '50 Excel Reports', blurb: 'Download ready-made reports for banks, management, audits & finance in 1 click', actionTag: '50 Live Exports', to: '/data-hub', cat: 'money', icon: FileSpreadsheet, tone: 'sky' },
  { key: 'reception-qr', label: 'Office QR & Daily Close', blurb: 'Al Nasr Plaza 20-second attendance QR and simple end-of-day check-out', actionTag: 'Attendance', to: '/reception-qr', cat: 'team', icon: QrCode, tone: 'emerald' },
  { key: 'hr', label: 'HR, Visas & Leave', blurb: 'Track visa renewals, Emirates IDs, staff leave approvals & UAE WPS payroll', actionTag: 'MOHRE Ready', to: '/hr', cat: 'team', icon: Briefcase, tone: 'violet' },
  { key: 'team', label: 'Team Directory (8K)', blurb: 'Meet leadership and all 6 official Betterway mortgage specialists', actionTag: '9 Official Roles', to: '/team', cat: 'team', icon: Users, tone: 'navy' },
  { key: 'website-studio', label: 'Website & Brand Studio', blurb: 'Publish live rate banners on betterwaymortgages.com & access official brand logos', actionTag: 'Brand Growth', to: '/website-studio', cat: 'brands', icon: Globe, tone: 'gold' },
  { key: 'market', label: 'UAE Areas & Yields (60)', blurb: 'Instant price-per-sqft and rental yield benchmarks across 60 top communities', actionTag: '60 Communities', to: '/market', cat: 'banks', icon: LineChart, tone: 'sky' },
  { key: 'portal', label: 'Client Live Tracker', blurb: 'Give buyers a branded link to track their 12 steps and upload documents', actionTag: 'Client Experience', to: '/portal', cat: 'brands', icon: CheckCircle2, tone: 'emerald' },
  { key: 'partners', label: 'RERA Partner Hub', blurb: 'Real estate agents refer buyers in 60 seconds and print instant pre-qual letters', actionTag: 'Broker Network', to: '/partners', cat: 'brands', icon: Handshake, tone: 'gold' },
  { key: 'mobile', label: 'Betterway Mobile App', blurb: 'Installable Android, iOS & Web mobile app for Advisors, Buyers & Partners', actionTag: '3-Mode App', to: '/mobile-preview', cat: 'brands', icon: Smartphone, tone: 'navy' },
];

const CATEGORIES = [
  { id: 'all', label: 'All Tools (26)' },
  { id: 'today', label: 'Do Today' },
  { id: 'deals', label: 'Clients & Deals' },
  { id: 'banks', label: 'Banks & Quotes' },
  { id: 'money', label: 'Money & Rules' },
  { id: 'team', label: 'Team & HR' },
  { id: 'brands', label: 'Brands & Mobile' },
];

const CORE_SUITE = [
  {
    key: 'inside',
    brandName: 'Betterway Inside',
    tagline: 'Team chat organized by client case, bank desk updates, and instant team alerts.',
    to: '/inside',
    icon: MessagesSquare,
    cta: 'Open Team Chat',
    bg: 'from-[#0A4A3E] via-[#0E5E4F] to-[#070E1A]',
    border: 'border-[#34DFAC]/35 hover:border-[#FCF1B7]/70',
    pill: 'bg-[#34DFAC]/20 text-[#34DFAC]',
  },
  {
    key: 'work',
    brandName: 'Betterway Work',
    tagline: 'Automatic follow-ups, 90-day refinance reminders, and daily SLA safety checks.',
    to: '/automations',
    icon: Workflow,
    cta: 'Open Auto Follow-Ups',
    bg: 'from-[#0C1524] via-[#132645] to-[#070E1A]',
    border: 'border-[#D7B158]/35 hover:border-[#34DFAC]/70',
    pill: 'bg-[#D7B158]/20 text-[#FCF1B7]',
  },
  {
    key: 'phone',
    brandName: 'Betterway Phone',
    tagline: 'Call and log every buyer safely with masked numbers so zero client data leaks.',
    to: '/phone',
    icon: PhoneCall,
    cta: 'Open Safe Dialer',
    bg: 'from-[#2A1D08] via-[#4D3410] to-[#070E1A]',
    border: 'border-[#D7B158]/40 hover:border-[#34DFAC]/70',
    pill: 'bg-[#FCF1B7]/15 text-[#FCF1B7]',
  },
];

const TONE_MAP: Record<LauncherTile['tone'], { bg: string; fg: string; pill: string }> = {
  emerald: { bg: '#E7FAF4', fg: '#0A4A3E', pill: 'bg-[#34DFAC]/15 text-[#0A4A3E] dark:text-[#34DFAC]' },
  gold: { bg: '#FDF6E2', fg: '#8A621C', pill: 'bg-[#D7B158]/18 text-[#8A621C] dark:text-[#FCF1B7]' },
  navy: { bg: '#E8EEF6', fg: '#070E1A', pill: 'bg-slate-500/12 text-slate-700 dark:text-slate-300' },
  sky: { bg: '#EBF7FF', fg: '#0369A1', pill: 'bg-sky-500/12 text-sky-700 dark:text-sky-300' },
  violet: { bg: '#F3EEFF', fg: '#6D28D9', pill: 'bg-violet-500/12 text-violet-700 dark:text-violet-300' },
};

const FEATURED_DEVELOPERS = [
  { name: 'Emaar Properties', logo: '/projects/emaar.svg', tag: 'The Oasis & Dubai Hills' },
  { name: 'DAMAC Properties', logo: '/projects/damac.png', tag: 'DAMAC Islands & Lagoons' },
  { name: 'Sobha Realty', logo: '/projects/sobha.png', tag: 'Sobha One & Hartland II' },
];

function dubaiGreeting() {
  const hr = Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dubai', hour: '2-digit', hour12: false }).format(new Date()),
  );
  return hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
}

function SpotlightAppCard({ tile }: { tile: LauncherTile }) {
  const accent = TONE_MAP[tile.tone];
  const onMove = (e: PointerEvent<HTMLAnchorElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  return (
    <Link
      to={tile.to}
      onPointerMove={onMove}
      className="group relative flex items-center gap-3.5 overflow-hidden rounded-[22px] border border-[var(--bw-line)] bg-[var(--bw-card)] p-4 shadow-[0_14px_34px_-24px_rgba(7,14,26,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#179373]/55 hover:shadow-[0_18px_38px_-18px_rgba(7,14,26,0.28)]"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(circle 190px at var(--mx, 50%) var(--my, 50%), rgba(215,177,88,0.16), transparent 72%)',
        }}
      />
      <div
        className="relative z-10 size-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
        style={{ backgroundColor: accent.bg, color: accent.fg }}
      >
        <tile.icon size={21} />
      </div>
      <div className="relative z-10 min-w-0 flex-1">
        <div className="font-bold text-[14.5px] text-[var(--bw-ink)] truncate group-hover:text-[#179373] dark:group-hover:text-[#34DFAC] transition-colors">
          {tile.label}
        </div>
        <div className="text-xs text-[var(--bw-muted)] line-clamp-2 mt-0.5 leading-snug">{tile.blurb}</div>
        <div className="mt-1.5">
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${accent.pill}`}>
            {tile.actionTag}
          </span>
        </div>
      </div>
      <ArrowUpRight
        size={16}
        className="relative z-10 shrink-0 text-[var(--bw-muted)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#179373]"
      />
    </Link>
  );
}

export function LauncherPage() {
  const { user } = useAuth();
  const [cat, setCat] = useState('all');
  const [query, setQuery] = useState('');
  const [kpis, setKpis] = useState<any>(null);
  const [execSnap, setExecSnap] = useState<{ openTasks: number; doneTasks: number; myClients: number; activeField: number; pendingApprovals: number }>({
    openTasks: 0,
    doneTasks: 0,
    myClients: 0,
    activeField: 0,
    pendingApprovals: 0,
  });

  const isElevated = ['OWNER', 'EXEC_DIR', 'ADMIN', 'TEAM_MANAGER'].includes(user?.role || '');

  useEffect(() => {
    apiFetch<any>('/api/dashboard')
      .then((d) => setKpis(d.kpis))
      .catch(() => {});

    Promise.allSettled([
      apiFetch<{ tasks: any[] }>('/api/tasks?scope=all'),
      apiFetch<{ rows: any[] }>('/api/vault/mine'),
      apiFetch<{ sessions: any[] }>('/api/field-duty'),
      isElevated ? apiFetch<any>('/api/shabibs-corner/overview') : Promise.resolve(null),
    ]).then(([tRes, vRes, fRes, sRes]) => {
      const tasks = tRes.status === 'fulfilled' ? tRes.value.tasks || [] : [];
      const myLeads = vRes.status === 'fulfilled' ? vRes.value.rows || [] : [];
      const sessions = fRes.status === 'fulfilled' ? fRes.value.sessions || [] : [];
      const corner = sRes.status === 'fulfilled' ? sRes.value : null;
      const pendingApprovals = corner ? Number(corner.approvals?.total || 0) : 0;
      setExecSnap({
        openTasks: tasks.filter((t) => t.status !== 'Done').length,
        doneTasks: tasks.filter((t) => t.status === 'Done').length,
        myClients: myLeads.length,
        activeField: sessions.filter((s) => s.status === 'Active').length,
        pendingApprovals,
      });
    });
  }, [isElevated]);

  const needle = query.trim().toLowerCase();
  const filtered = APP_TILES.filter((t) => {
    if (t.ownerOnly && !isElevated) return false;
    const matchText =
      !needle ||
      t.label.toLowerCase().includes(needle) ||
      t.blurb.toLowerCase().includes(needle) ||
      t.actionTag.toLowerCase().includes(needle);
    const matchCat = Boolean(needle) || cat === 'all' || t.cat === cat;
    return matchText && matchCat;
  });

  const firstName = user?.name?.split(' ')[0] || 'Team';
  const topBanks = UAE_BANKS.slice(0, 12);

  return (
    <div className="space-y-7">
      {/* Executive Morning Skyline Banner — Simple English & Live Results */}
      <div className="relative rounded-[28px] overflow-hidden bg-[#070E1A] text-white p-6 sm:p-8 border border-[#D7B158]/30 shadow-xl">
        <img
          src="/images/hero-morning-02-2048.webp"
          alt="Dubai Morning Skyline"
          className="absolute inset-0 w-full h-full object-cover opacity-35"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(110deg, rgba(7,14,26,0.95) 0%, rgba(10,74,62,0.72) 55%, rgba(7,14,26,0.9) 100%)',
          }}
        />
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-[#34DFAC]/35 text-[11px] font-bold uppercase tracking-[0.16em] text-[#34DFAC]">
              <img src="/brand/betterway-icon-fullcolor.svg" alt="" className="size-4 object-contain" />
              Betterway Mortgages LLC · Dubai, UAE
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-[-0.03em]">
              {dubaiGreeting()},{' '}
              <span className="font-serif-accent font-normal text-[#FCF1B7]">{firstName}</span>
            </h1>
            <p className="text-sm text-slate-200 max-w-2xl leading-relaxed">
              Signed in as <b>{user?.designation}</b>. Pick your next step below to close more home loans faster across{' '}
              <b>24 UAE banks</b>, track commissions clearly, and keep every client number protected.
            </p>
            <div className="flex flex-wrap gap-2.5 pt-2">
              <Link
                to="/my-work"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#34DFAC] text-[#070E1A] text-xs font-extrabold hover:brightness-105 transition"
              >
                <CheckSquare size={14} /> Open My Tasks ({execSnap.openTasks})
              </Link>
              <Link
                to="/pipeline"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/12 border border-white/25 text-white text-xs font-bold hover:bg-white/20 transition"
              >
                <KanbanSquare size={14} /> Move Deals (Step 1→12)
              </Link>
              <Link
                to="/calculators"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#D7B158]/20 border border-[#D7B158]/50 text-[#FCF1B7] text-xs font-bold hover:bg-[#D7B158]/30 transition"
              >
                <Calculator size={14} /> Instant Bank Quote
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 gap-3 shrink-0">
            <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <div className="text-[10px] uppercase tracking-wider text-slate-300">Active Loan Book</div>
              <div className="text-lg font-bold font-mono-num text-white mt-0.5">
                {kpis ? fmtAed(kpis.totalPipelineLoanAed, true) : 'AED 29.9M'}
              </div>
              <div className="text-[10px] text-[#34DFAC] mt-0.5">Live pipeline</div>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <div className="text-[10px] uppercase tracking-wider text-slate-300">Expected Commission</div>
              <div className="text-lg font-bold font-mono-num text-[#34DFAC] mt-0.5">
                {kpis ? fmtAed(kpis.projectedDsaAed, true) : 'AED 248K'}
              </div>
              <div className="text-[10px] text-slate-300 mt-0.5">Paid by UAE banks</div>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-[#D7B158]/40">
              <div className="text-[10px] uppercase tracking-wider text-[#FCF1B7]">3M Bank Rate (EIBOR)</div>
              <div className="text-lg font-bold font-mono-num text-[#FCF1B7] mt-0.5">
                {EIBOR_SNAPSHOT.latest.threeMonth.toFixed(3)}%
              </div>
              <div className="text-[10px] text-slate-300 mt-0.5">CBUAE official</div>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <div className="text-[10px] uppercase tracking-wider text-slate-300">SWK Sister Referrals</div>
              <div className="text-lg font-bold font-mono-num text-white mt-0.5">
                {kpis ? `${kpis.swkRelayCases || 4} Live` : '4 Live'}
              </div>
              <div className="text-[10px] text-[#34DFAC] mt-0.5">Zero-leak handoff</div>
            </div>
          </div>
        </div>
      </div>

      {/* Shabib's Corner Executive Control Strip (Visible to Owner / Director / Admin / Manager) */}
      {isElevated && (
        <Link
          to="/shabibs-corner"
          className="group flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-[24px] bg-gradient-to-r from-[#2A1D08] via-[#1C1710] to-[#070E1A] text-white border border-[#D7B158]/50 shadow-lg hover:border-[#FCF1B7] transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-gradient-to-br from-[#FCF1B7] to-[#BA8D36] text-[#070E1A] flex items-center justify-center shrink-0 shadow-md">
              <Crown size={24} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-bold text-[#FCF1B7]">Shabib&apos;s Corner — Owner Action Room</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#D7B158]/25 text-[#FCF1B7] border border-[#D7B158]/40">
                  {execSnap.pendingApprovals} waiting for approval
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Paste any client list into the AI Importer, approve company seals &amp; leave, or fast-track a VIP buyer in 1 click.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FCF1B7] text-[#070E1A] text-xs font-extrabold shrink-0 group-hover:gap-2.5 transition-all">
            Open Owner Room <ArrowRight size={14} />
          </span>
        </Link>
      )}

      {/* Today's Execution & Results Strip — 4 Fast Action Counters */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Link to="/my-work" className="bw-card p-4 hover:border-[#179373] transition-all flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--bw-muted)]">1. Tasks to Finish</div>
            <div className="text-2xl font-extrabold font-mono-num text-[var(--bw-ink)] mt-1">{execSnap.openTasks} Open</div>
            <div className="text-xs text-[#179373] font-semibold mt-0.5">{execSnap.doneTasks} completed already →</div>
          </div>
          <div className="size-11 rounded-2xl bg-[#E7FAF4] text-[#0A4A3E] flex items-center justify-center">
            <CheckSquare size={20} />
          </div>
        </Link>

        <Link to="/my-cases" className="bw-card p-4 hover:border-[#179373] transition-all flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--bw-muted)]">2. Clients to Call</div>
            <div className="text-2xl font-extrabold font-mono-num text-[var(--bw-ink)] mt-1">{execSnap.myClients} Assigned</div>
            <div className="text-xs text-[#179373] font-semibold mt-0.5">1-click masked Call &amp; WA →</div>
          </div>
          <div className="size-11 rounded-2xl bg-[#FDF6E2] text-[#8A621C] flex items-center justify-center">
            <UserCheck size={20} />
          </div>
        </Link>

        <Link to="/field-duty" className="bw-card p-4 hover:border-[#179373] transition-all flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--bw-muted)]">3. Active Field Visits</div>
            <div className="text-2xl font-extrabold font-mono-num text-[var(--bw-ink)] mt-1">{execSnap.activeField} On Duty</div>
            <div className="text-xs text-[#179373] font-semibold mt-0.5">Bank, Valuation &amp; Trustee GPS →</div>
          </div>
          <div className="size-11 rounded-2xl bg-[#EBF7FF] text-[#0369A1] flex items-center justify-center">
            <MapPin size={20} />
          </div>
        </Link>

        <Link to="/word-studio" className="bw-card p-4 hover:border-[#179373] transition-all flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--bw-muted)]">4. Official Letters</div>
            <div className="text-2xl font-extrabold font-mono-num text-[var(--bw-ink)] mt-1">4 Templates</div>
            <div className="text-xs text-[#179373] font-semibold mt-0.5">Quotes, Zero-Fee &amp; Seal →</div>
          </div>
          <div className="size-11 rounded-2xl bg-[#F3EEFF] text-[#6D28D9] flex items-center justify-center">
            <FilePenLine size={20} />
          </div>
        </Link>
      </section>

      {/* Betterway Core Suite 3-Card Hero Dock */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--bw-muted)]">
            Betterway Core Suite · Team Chat, Auto Follow-Ups &amp; Safe Phone
          </h2>
          <a
            href="/mobile/"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold text-[#179373] dark:text-[#34DFAC] hover:underline"
          >
            Open Dedicated Mobile App ↗
          </a>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {CORE_SUITE.map((s) => (
            <Link
              key={s.key}
              to={s.to}
              className={`group relative overflow-hidden rounded-[24px] p-5 text-white bg-gradient-to-br ${s.bg} border ${s.border} transition-all duration-200 hover:-translate-y-0.5 shadow-lg`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="size-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
                  <s.icon size={22} className="text-[#34DFAC]" />
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold ${s.pill}`}>READY</span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-bold tracking-[-0.02em]">{s.brandName}</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{s.tagline}</p>
              </div>
              <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#FCF1B7] group-hover:gap-2.5 transition-all">
                <span>{s.cta}</span>
                <ArrowUpRight size={14} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Partner Brands Showcase Strip — Betterway + 24 UAE Banks + Top Developers + SWK Sister Brand */}
      <section className="bw-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#179373]">
              Trusted UAE Partner Ecosystem
            </div>
            <h2 className="text-base font-bold text-[var(--bw-ink)] mt-0.5">
              Betterway Mortgages · 24 Accredited UAE Banks · Top Developers · SWK Properties Relay
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/banks" className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#070E1A] text-[#FCF1B7]">
              Compare All 24 Banks →
            </Link>
            <Link
              to="/website-studio"
              className="px-3 py-1.5 rounded-full text-xs font-bold border border-[var(--bw-line)] text-[var(--bw-ink)] hover:border-[#179373]"
            >
              Brand Kit
            </Link>
          </div>
        </div>

        {/* 12 Featured UAE Bank Brand Badges */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
          {topBanks.map((b) => (
            <Link
              key={b.key}
              to="/banks"
              className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl bg-white border border-slate-200 hover:border-[#179373] transition-all"
            >
              <img src={b.logo} alt={b.short} className="h-6 w-20 object-contain" />
              <span className="text-[10.5px] font-bold text-slate-700 truncate max-w-full">
                {b.short} · {b.indicativeFixed3Y.toFixed(2)}%
              </span>
            </Link>
          ))}
        </div>

        {/* Top UAE Developers + SWK Sister Brand Strip */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {FEATURED_DEVELOPERS.map((dev) => (
            <Link
              key={dev.name}
              to="/market"
              className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bw-soft)]/80 border border-[var(--bw-line)] hover:border-[#D7B158] transition"
            >
              <div className="w-16 h-10 rounded-lg bg-white p-1.5 flex items-center justify-center border border-slate-200 shrink-0">
                <img src={dev.logo} alt={dev.name} className="max-h-7 max-w-full object-contain" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[var(--bw-ink)] truncate">{dev.name}</div>
                <div className="text-[11px] text-[var(--bw-muted)] truncate">{dev.tag}</div>
              </div>
            </Link>
          ))}
          <Link
            to="/leads"
            className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-[#070E1A] to-[#0A4A3E] text-white border border-[#34DFAC]/40 hover:border-[#FCF1B7] transition"
          >
            <div className="size-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0 font-extrabold text-xs text-[#FCF1B7] border border-[#D7B158]/40">
              SWK
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">SWK Properties Relay</div>
              <div className="text-[11px] text-[#34DFAC] truncate">Sister Brokerage Buyer Bridge →</div>
            </div>
          </Link>
        </div>
      </section>

      {/* Filter & Search Bar + Full 26-App Betterway OS Grid */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCat(c.id)}
                className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  cat === c.id
                    ? 'bg-[#070E1A] text-[#FCF1B7] dark:bg-[#179373] dark:text-white shadow-sm'
                    : 'bg-[var(--bw-card)] border border-[var(--bw-line)] text-[var(--bw-body)] hover:border-[#179373]/50'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-72">
            <Search size={15} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-[var(--bw-muted)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find any Betterway tool…"
              className="w-full h-10 ps-9 pe-4 rounded-full border border-[var(--bw-line)] bg-[var(--bw-card)] text-xs focus:outline-none focus:border-[#179373]"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filtered.map((tile) => (
            <SpotlightAppCard key={tile.key} tile={tile} />
          ))}
        </div>
      </section>
    </div>
  );
}
