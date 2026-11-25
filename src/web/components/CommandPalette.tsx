import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Building2,
  Calculator,
  CalendarDays,
  CheckSquare,
  Crown,
  FilePenLine,
  FileSpreadsheet,
  Globe,
  Handshake,
  KanbanSquare,
  Landmark,
  LayoutDashboard,
  LayoutGrid,
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
  X,
} from 'lucide-react';

const COMMAND_ITEMS = [
  { label: 'Home & Daily Results', desc: 'All Betterway apps, today results & brand showcase', to: '/home', icon: LayoutGrid, tag: 'Home' },
  { label: "Shabib's Corner (Owner Room)", desc: 'Owner playbook, AI bulk lead importer, VIP fast-track & approvals', to: '/shabibs-corner', icon: Crown, tag: 'Owner' },
  { label: 'My Tasks Today', desc: 'Your checklist of overdue, today and upcoming actions', to: '/my-work', icon: CheckSquare, tag: 'Do Now' },
  { label: 'My Assigned Clients', desc: 'Call or WhatsApp your assigned buyers with phone numbers safely hidden', to: '/my-cases', icon: UserCheck, tag: 'Clients' },
  { label: 'Business Results Dashboard', desc: 'Total loan book, bank commissions, team rankings & EIBOR trend', to: '/dashboard', icon: LayoutDashboard, tag: 'Results' },
  { label: 'Mortgage Steps (1 to 12)', desc: 'Move every client from Enquiry to Bank Disbursal and Commission Paid', to: '/pipeline', icon: KanbanSquare, tag: 'Deals' },
  { label: 'Client Vault (Safe Numbers)', desc: 'Protected buyer list with owner-controlled phone masking & assignment', to: '/vault', icon: Lock, tag: 'Vault' },
  { label: 'New Enquiries & SWK Relay', desc: 'Website leads and live buyer handoffs from SWK Properties', to: '/leads', icon: UserPlus, tag: 'Leads' },
  { label: 'Schedule & Deadlines', desc: 'Valuations, FOL signing dates, DLD Trustee appointments & reminders', to: '/calendar', icon: CalendarDays, tag: 'Dates' },
  { label: 'Field Visits GPS & SOS', desc: 'Start bank, valuation or trustee visit with GPS proof & live map', to: '/field-duty', icon: MapPin, tag: 'Field' },
  { label: 'Client Messages (WhatsApp & Email)', desc: 'Send fast updates using ready-made templates and keep full history', to: '/communications', icon: MessageCircle, tag: 'Inbox' },
  { label: '24 Partner Banks & Rates', desc: 'Compare all 24 UAE banks, logos, fixed rates and developer lists', to: '/banks', icon: Landmark, tag: 'Banks' },
  { label: 'Borrowing Power Calculator', desc: 'Instant UAE bank affordability, 50% DBR test, buyout & handover math', to: '/calculators', icon: Calculator, tag: 'Calc' },
  { label: 'Letter & Word Studio', desc: 'Create official bank quotes, zero-fee letters & request company seal', to: '/word-studio', icon: FilePenLine, tag: 'Letters' },
  { label: 'Translator, ID Scanner & Search', desc: 'Translate 9 languages, scan Emirates ID/Salary/Title Deed & search all records', to: '/utilities', icon: Wand2, tag: 'Tools' },
  { label: 'Commissions, Money & Refunds', desc: 'Track bank commission invoices, VAT, payouts & company-bank-only lock', to: '/finance', icon: Wallet, tag: 'Money' },
  { label: 'Compliance, Seal & Delete Bin', desc: 'UAE PDPL consent, AML checks, seal approvals & Owner Delete Bin', to: '/compliance', icon: ShieldCheck, tag: 'Rules' },
  { label: '50 Excel Reports & Templates', desc: 'Download any of the 50 official Betterway Excel reports in 1 click', to: '/data-hub', icon: FileSpreadsheet, tag: 'Excel' },
  { label: 'Office QR & Daily Close', desc: 'Al Nasr Plaza 20-second attendance QR and mandatory end-of-day report', to: '/reception-qr', icon: QrCode, tag: 'Office' },
  { label: 'HR, Visas, Leave & Payroll', desc: 'Track staff visas, Emirates ID expiry, leave requests & UAE WPS payroll', to: '/hr', icon: Briefcase, tag: 'HR' },
  { label: 'Team Directory (8K Portraits)', desc: 'Leadership and all 6 official Betterway mortgage specialists', to: '/team', icon: Users, tag: 'Team' },
  { label: 'Website & Brand Studio', desc: 'Publish live bank rate banners, developer promos & Betterway brand pack', to: '/website-studio', icon: Globe, tag: 'Brand' },
  { label: 'Betterway Inside Chat', desc: 'Team chat rooms by deal, bank desk updates and instant @mentions', to: '/inside', icon: MessagesSquare, tag: 'Suite' },
  { label: 'Auto Follow-Ups (Betterway Work)', desc: 'Automatic reminders, 90-day refinance alerts & SLA timers', to: '/automations', icon: Workflow, tag: 'Suite' },
  { label: 'Betterway Masked Phone', desc: 'Call buyers safely without exposing client phone numbers', to: '/phone', icon: PhoneCall, tag: 'Suite' },
  { label: 'AI Mortgage Helper', desc: 'Ask UAE bank rules, non-resident LTV or live deal questions in plain English', to: '/ai', icon: Sparkles, tag: 'AI' },
  { label: 'UAE Areas & Yields (60)', desc: 'Check prices, rents and mortgage yields across 60 UAE communities', to: '/market', icon: LineChart, tag: 'Market' },
  { label: 'Client Live Tracker Portal', desc: 'Share a clean 12-step progress link and document upload page with buyers', to: '/portal', icon: ShieldCheck, tag: 'Client' },
  { label: 'RERA Realtor Partner Hub', desc: 'Real estate brokers send buyer referrals & download instant pre-qual letters', to: '/partners', icon: Handshake, tag: 'B2B' },
  { label: 'Betterway Mobile App (PWA)', desc: 'Open the dedicated Android / iOS / Web mobile app for Advisors, Clients & Partners', to: '/mobile-preview', icon: Smartphone, tag: 'Mobile' },
];

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    if (!open) setQ('');
  }, [open]);

  if (!open) return null;
  const needle = q.trim().toLowerCase();
  const filtered = COMMAND_ITEMS.filter(
    (item) =>
      !needle ||
      item.label.toLowerCase().includes(needle) ||
      item.desc.toLowerCase().includes(needle) ||
      item.tag.toLowerCase().includes(needle),
  );

  return (
    <div
      className="fixed inset-0 z-[170] flex items-start justify-center pt-[9vh] px-4 bg-[#070E1A]/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bw-card overflow-hidden shadow-2xl border-[#D7B158]/30"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--bw-line)]">
          <Search size={18} className="text-[#179373]" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Type where you want to go: Shabib, Vault, Tasks, 24 Banks, Letters, Translator, HR…"
            className="flex-1 bg-transparent text-sm text-[var(--bw-ink)] outline-none placeholder:text-[var(--bw-muted)]"
          />
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10">
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[62vh] overflow-y-auto p-2">
          {filtered.map((item) => (
            <button
              key={item.to}
              type="button"
              onClick={() => {
                nav(item.to);
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-start hover:bg-[#34DFAC]/10 transition-colors cursor-pointer"
            >
              <div className="size-9 rounded-xl bg-[#070E1A] text-[#34DFAC] flex items-center justify-center shrink-0 border border-[#D7B158]/30">
                <item.icon size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-[var(--bw-ink)] truncate">{item.label}</div>
                <div className="text-xs text-[var(--bw-muted)] truncate">{item.desc}</div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--bw-soft)] text-[var(--bw-muted)]">
                {item.tag}
              </span>
            </button>
          ))}
          {!filtered.length && (
            <div className="p-6 text-center space-y-3">
              <div className="text-sm text-[var(--bw-muted)]">No screen matches &ldquo;{q}&rdquo;.</div>
              <button
                type="button"
                onClick={() => {
                  nav('/utilities');
                  onClose();
                }}
                className="px-4 py-2 rounded-full bg-[#179373] text-white text-xs font-bold cursor-pointer"
              >
                Search inside Clients, Deals &amp; Letters →
              </button>
            </div>
          )}
        </div>
        <div className="px-4 py-2.5 border-t border-[var(--bw-line)] bg-[var(--bw-soft)]/50 flex items-center justify-between text-[11px] text-[var(--bw-muted)]">
          <span>Betterway Mortgages OS · Quick Jump (30 Tools)</span>
          <span className="font-mono-num">ESC to close</span>
        </div>
      </div>
    </div>
  );
}

export { Building2 };
