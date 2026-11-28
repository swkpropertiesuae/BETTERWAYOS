'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Briefcase,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Mail,
  MessageCircle,
  MessageSquarePlus,
  Paperclip,
  PhoneCall,
  Plus,
  Route,
  ShieldCheck,
  Target,
  UserPlus,
  Users,
} from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { fmtAed, GlossyBlackCard, MetricTile, PageHeader, StatusPill } from '@/components/os/UiKit';
import { SubFeatureTabs, type SubFeatureItem } from '@/components/os/SubFeatureTabs';
import { AttachmentChips, AttachmentPicker } from '@/components/os/AttachmentPicker';
import { TaskFollowUpDrawer, type FollowUpTaskItem } from '@/components/os/TaskFollowUpDrawer';
import {
  filesToLocalAttachments,
  uploadFilesToScope,
  type AttachmentItem,
} from '@/lib/workspace/attachments-types';
import { ENQUIRY_CHANNELS } from '@/lib/domain/workflow';
import { OFFICIAL_ROSTER } from '@/lib/domain/staff';
import { dialViaSip } from '@/lib/sip-store';

type CrmSubTab =
  | 'leads'
  | 'contacts'
  | 'vault'
  | 'assigned'
  | 'whatsapp'
  | 'email'
  | 'followups'
  | 'opportunities'
  | 'routing';

const CRM_SUB_TABS: ReadonlyArray<SubFeatureItem<CrmSubTab>> = [
  { id: 'leads', num: '01', label: 'Leads & Enquiries', icon: UserPlus },
  { id: 'contacts', num: '02', label: 'Contacts & Clients', icon: Users },
  { id: 'vault', num: '03', label: 'CRM Collateral Vault', icon: ShieldCheck },
  { id: 'assigned', num: '04', label: 'My Assigned Deals', icon: Briefcase },
  { id: 'whatsapp', num: '05', label: 'WhatsApp', icon: MessageCircle },
  { id: 'email', num: '06', label: 'Email Inbox', icon: Mail },
  { id: 'followups', num: '07', label: 'Follow-Ups & Calls', icon: CalendarCheck },
  { id: 'opportunities', num: '08', label: 'Opportunities', icon: Target },
  { id: 'routing', num: '09', label: 'Routing Rules', icon: Route },
];

const WHATSAPP_TEMPLATES = [
  {
    title: 'Initial 60-Second Eligibility Check',
    text: 'Hello from Betterway Mortgages LLC (Dubai). We compare 18 UAE banks at Zero Client Broker Fee. Share your target property value, residency status, and monthly income for a same-day 3-bank quote.',
  },
  {
    title: 'Pre-Approval Document Checklist (Salaried)',
    text: 'To submit your UAE mortgage pre-approval today, please share: Passport + Visa + Emirates ID, 6 months bank statements, 3 months payslips & latest Salary Certificate. Zero broker fee.',
  },
  {
    title: 'Buyout & Rate-Reset Savings Alert',
    text: 'With 2026 UAE fixed rates starting from 3.89%, you could cut your monthly EMI immediately via a buyout refinance. Reply YES for a free Betterway break-even comparison sheet.',
  },
];

export default function CrmPage() {
  const { user, toast } = useOs();
  const [subTab, setSubTab] = useState<CrmSubTab>('leads');
  const [data, setData] = useState<{ todayDubai: string; todayCount: number; leads: any[]; vaultLeads: any[] }>({
    todayDubai: '',
    todayCount: 0,
    leads: [],
    vaultLeads: [],
  });
  const [cases, setCases] = useState<any[]>([]);
  const [followUpTasks, setFollowUpTasks] = useState<FollowUpTaskItem[]>([]);
  const [activeFollowUpTask, setActiveFollowUpTask] = useState<FollowUpTaskItem | null>(null);
  const [dateFilter, setDateFilter] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [leadFiles, setLeadFiles] = useState<File[]>([]);
  const [emailFiles, setEmailFiles] = useState<File[]>([]);
  const [quickFuTitle, setQuickFuTitle] = useState('');
  const [quickFuDue, setQuickFuDue] = useState(() => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(new Date()));
  const [quickFuFiles, setQuickFuFiles] = useState<File[]>([]);
  const [emailLog, setEmailLog] = useState<Array<{ id: string; to: string; subject: string; status: string; time: string; attachments?: AttachmentItem[] }>>([
    { id: 'EM-1', to: 'mortgages@emiratesnbd.com', subject: 'STL Pre-Approval Pack — Dubai Hills Villa (AED 3.8M)', status: 'Sent', time: '09:42 GST' },
    { id: 'EM-2', to: 'client.advisory@domain.ae', subject: 'Betterway 3-Bank Auto-Eco Mortgage Proposal (ENBD / ADIB / CBD)', status: 'Replied', time: '10:15 GST' },
    { id: 'EM-3', to: 'valuations@cbre.ae', subject: 'Valuation Access Confirmation — Palm Jumeirah Apartment', status: 'Pending', time: '11:05 GST' },
  ]);
  const [emailDraft, setEmailDraft] = useState({ to: '', subject: 'Betterway UAE Mortgage Comparison Proposal' });
  const [routingRules, setRoutingRules] = useState([
    { id: 'R-01', name: 'AED 5M+ Private HNW & Golden Visa', channel: 'All Channels', assignee: 'Warda Kapadia & Shabib Siraj', slaMin: 5, active: true },
    { id: 'R-02', name: 'Website & WhatsApp Dubai Resident', channel: 'Website / WhatsApp', assignee: 'Daniel Xavier (Round-Robin)', slaMin: 5, active: true },
    { id: 'R-03', name: 'Buyout & Rate-Reset Refinance', channel: 'Referral / Direct Call', assignee: 'Asif Khan', slaMin: 10, active: true },
    { id: 'R-04', name: 'First-Home Eligibility & Non-Resident', channel: 'Portal / Chat', assignee: 'Reshma', slaMin: 10, active: true },
  ]);

  const [form, setForm] = useState({
    contactName: '',
    contactPhone: '+971 50 ',
    contactEmail: '',
    sourceChannel: 'Website',
    referrerName: '',
    community: 'Dubai Hills Estate',
    propertyPriceAed: 2_500_000,
    monthlyIncomeAed: 40_000,
    notes: '',
  });

  const load = useCallback(async () => {
    const q = dateFilter ? `?date=${encodeURIComponent(dateFilter)}` : '';
    const [leadRes, caseRes, taskRes] = await Promise.all([
      fetch(`/api/v1/crm/leads${q}`),
      fetch('/api/v1/pipeline/cases').catch(() => null),
      fetch('/api/v1/tasks').catch(() => null),
    ]);
    if (leadRes.ok) setData(await leadRes.json());
    if (caseRes && caseRes.ok) {
      const c = await caseRes.json();
      setCases(c.cases ?? []);
    }
    if (taskRes && taskRes.ok) {
      const t = await taskRes.json();
      setFollowUpTasks(t.tasks ?? []);
    }
  }, [dateFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const logEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await fetch('/api/v1/crm/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const out = await r.json();
    if (!r.ok) {
      toast(out.error || 'Unable to log enquiry', 'err');
      return;
    }
    if (leadFiles.length > 0 && out.lead?.id) {
      await uploadFilesToScope(leadFiles, 'lead', out.lead.id).catch(() => null);
    }
    toast(
      `Daily Enquiry ${out.lead.reference_code} logged (${out.lead.received_date_dubai})${leadFiles.length > 0 ? ` with ${leadFiles.length} attachment(s)` : ''}!`,
    );
    setForm({ ...form, contactName: '', contactEmail: '', notes: '' });
    setLeadFiles([]);
    await load();
  };

  const createQuickFollowUpTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickFuTitle.trim()) return;
    const r = await fetch('/api/v1/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: quickFuTitle.trim(),
        priority: 'High',
        dueDate: quickFuDue,
        assignedTo: user?.id,
      }),
    });
    const out = await r.json().catch(() => ({}));
    if (r.ok && out.task?.id) {
      if (quickFuFiles.length > 0) {
        await uploadFilesToScope(quickFuFiles, 'task', out.task.id).catch(() => null);
      }
      toast('Follow-up task scheduled!');
      setQuickFuTitle('');
      setQuickFuFiles([]);
      await load();
    }
  };

  const scheduleLeadFollowUp = async (lead: any) => {
    const r = await fetch('/api/v1/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `Follow up ${lead.contact_name} (${lead.reference_code}) — ${lead.community || 'UAE Mortgage'}`,
        description: `Channel: ${lead.source_channel} · Target Asset: ${fmtAed(lead.property_price_aed, true)}`,
        priority: 'High',
        assignedTo: user?.id,
        contactName: lead.contact_name,
        contactPhone: lead.contact_phone || '',
      }),
    });
    const out = await r.json().catch(() => ({}));
    if (r.ok && out.task) {
      toast(`Follow-up task opened for ${lead.contact_name}`);
      await load();
      setActiveFollowUpTask(out.task);
    }
  };

  const outreach = async (entityType: 'lead' | 'vault_lead', entityId: string, channel: 'Call' | 'WhatsApp', displayName?: string) => {
    const r = await fetch('/api/v1/crm/unmask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entityType, entityId, channel }),
    });
    const out = await r.json();
    if (!r.ok) {
      toast(out.error || 'PDPL action denied', 'err');
      return;
    }
    toast(`PDPL Audited ${channel}: ${out.phone}`, 'info');
    if (channel === 'Call' && out.phone) {
      dialViaSip({ number: out.phone, name: displayName || 'CRM Borrower', category: 'Borrower' });
    }
    if (channel === 'WhatsApp' && out.whatsappUrl) window.open(out.whatsappUrl, '_blank');
  };

  const convertToPipeline = async (lead: any) => {
    const r = await fetch('/api/v1/pipeline/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId: lead.id,
        borrowerName: lead.contact_name,
        borrowerPhone: lead.contact_phone,
        borrowerEmail: lead.contact_email,
        borrowerProfile: lead.borrower_profile || 'salaried',
        community: lead.community || 'Dubai',
        propertyPriceAed: Number(lead.property_price_aed || 2_500_000),
        requestedLoanAed: Math.round(Number(lead.property_price_aed || 2_500_000) * 0.8),
        monthlyIncomeAed: Number(lead.monthly_income_aed || 45_000),
        advisorId: lead.assigned_to,
      }),
    });
    if (r.ok) {
      toast('Converted enquiry to 12-Step Pipeline + spawned 13-doc Client Vault!');
      await load();
    }
  };

  const filteredContacts = useMemo(() => {
    const q = contactSearch.trim().toLowerCase();
    return data.leads.filter(
      (l) => !q || `${l.contact_name} ${l.community || ''} ${l.reference_code || ''}`.toLowerCase().includes(q),
    );
  }, [data.leads, contactSearch]);

  const myDeals = useMemo(() => {
    if (!user) return cases;
    if (user.isOwner) return cases;
    return cases.filter((c) => c.advisor_id === user.id || !c.advisor_id);
  }, [cases, user]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Step 01 · 100% Exact Daily Enquiry Ledger · UAE Mortgage CRM"
        title="CRM & Daily"
        accent="Enquiry Control"
        subtitle="Capture every daily borrower enquiry across Website, Chat, WhatsApp, Portals & Referrals with 5-minute SLA routing, PDPL collateral vault masking, and 1-click SIP dialing."
      />

      <SubFeatureTabs sectionTitle="CRM" items={CRM_SUB_TABS} activeId={subTab} onSelect={setSubTab} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricTile label={`Today's Enquiries (${data.todayDubai || 'GST'})`} value={data.todayCount} hint="100% daily reconciliation" tone="emerald" />
        <MetricTile label="Total Active Enquiries" value={data.leads.length} hint="Scoped by RBAC role" tone="navy" />
        <MetricTile label="Protected Collateral Vault" value={data.vaultLeads.length} hint="Hard-masked PDPL outreach" tone="gold" />
        <MetricTile label="Active Mortgage Deals" value={cases.length} hint="Live in 12-Step Pipeline" />
      </div>

      {/* 01 LEADS & ENQUIRIES */}
      {subTab === 'leads' && (
        <div className="grid lg:grid-cols-12 gap-6">
          <form onSubmit={logEnquiry} className="lg:col-span-4 bw-card p-5 space-y-3 text-xs">
            <h3 className="text-sm font-extrabold flex items-center gap-1.5">
              <Plus size={15} className="text-[#0e5a49]" /> Log Daily Enquiry (100% Capture)
            </h3>
            <div>
              <label className="font-bold block mb-1">Borrower Full Name *</label>
              <input required value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]" />
            </div>
            <div>
              <label className="font-bold block mb-1">Phone Number *</label>
              <input required value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold block mb-1">Channel *</label>
                <select value={form.sourceChannel} onChange={(e) => setForm({ ...form, sourceChannel: e.target.value })} className="w-full h-9 px-2.5 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]">
                  {ENQUIRY_CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="font-bold block mb-1">Referrer / Staff</label>
                <input value={form.referrerName} onChange={(e) => setForm({ ...form, referrerName: e.target.value })} placeholder="Referrer name" className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold block mb-1">Community</label>
                <input value={form.community} onChange={(e) => setForm({ ...form, community: e.target.value })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]" />
              </div>
              <div>
                <label className="font-bold block mb-1">Property Value (AED)</label>
                <input type="number" value={form.propertyPriceAed} onChange={(e) => setForm({ ...form, propertyPriceAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
              </div>
            </div>
            <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Mortgage goal, residency, bank preference..." className="w-full p-2.5 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]" />
            <AttachmentPicker files={leadFiles} onChange={setLeadFiles} label="Attach Passport / Salary Cert / Quote" />
            <button type="submit" className="bw-btn bw-btn-obsidian w-full text-xs">
              Record Daily Enquiry
            </button>
          </form>

          <div className="lg:col-span-8 bw-card p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold">Exact Daily Enquiries Register</h3>
              <div className="flex items-center gap-2 text-xs">
                <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="h-8 px-2.5 rounded-lg border border-[var(--bw-line)] bg-[var(--bw-soft)]" />
                {dateFilter && (
                  <button type="button" onClick={() => setDateFilter('')} className="text-[#0e5a49] font-bold cursor-pointer">All Dates</button>
                )}
              </div>
            </div>

            <div className="space-y-2.5 max-h-[540px] overflow-y-auto">
              {data.leads.length === 0 ? (
                <div className="py-10 text-center text-xs text-[var(--bw-muted)]">No enquiries logged for this filter yet.</div>
              ) : (
                data.leads.map((l) => (
                  <div key={l.id} className="p-3.5 rounded-2xl border border-[var(--bw-line)] bg-[var(--bw-soft)]/50 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono-num font-bold text-[#0e5a49]">{l.reference_code}</span>
                        <span className="font-extrabold text-sm">{l.contact_name}</span>
                        <StatusPill label={l.source_channel} tone="blue" />
                        <StatusPill label={l.status} tone={l.status === 'Converted' ? 'emerald' : 'gold'} />
                      </div>
                      <div className="text-[var(--bw-muted)]">
                        {l.received_date_dubai} · {l.contact_phone_masked} · {l.community || 'UAE'} ·{' '}
                        <strong className="font-mono-num text-[var(--bw-ink)]">{fmtAed(l.property_price_aed, true)}</strong>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={() => void outreach('lead', l.id, 'Call', l.contact_name)} className="px-3 py-1.5 rounded-full bg-[#0b192c] text-[#64c4a8] font-bold inline-flex items-center gap-1 cursor-pointer">
                        <PhoneCall size={12} /> SIP Call
                      </button>
                      <button type="button" onClick={() => void outreach('lead', l.id, 'WhatsApp', l.contact_name)} className="px-3 py-1.5 rounded-full bg-emerald-600 text-white font-bold inline-flex items-center gap-1 cursor-pointer">
                        <MessageCircle size={12} /> WhatsApp
                      </button>
                      {l.status !== 'Converted' && (
                        <button type="button" onClick={() => void convertToPipeline(l)} className="px-3 py-1.5 rounded-full bg-[#0e5a49] text-white font-bold inline-flex items-center gap-1 cursor-pointer">
                          Start 12-Step <ArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 02 CONTACTS & CLIENTS */}
      {subTab === 'contacts' && (
        <div className="bw-card p-5 space-y-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-sm font-extrabold">Borrower Contacts &amp; Clients Directory ({filteredContacts.length})</h2>
              <p className="text-[11px] text-[var(--bw-muted)]">PDPL-masked phone numbers unlock only on audited Call or WhatsApp outreach.</p>
            </div>
            <input
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              placeholder="Search client name, ref, community..."
              className="h-9 px-3.5 rounded-full border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] w-64"
            />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredContacts.map((c) => (
              <div key={c.id} className="p-4 rounded-2xl border border-[var(--bw-line)] bg-[var(--bw-soft)]/50 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-extrabold text-sm truncate">{c.contact_name}</div>
                  <StatusPill label={c.status} tone={c.status === 'Converted' ? 'emerald' : 'gold'} />
                </div>
                <div className="text-[11px] text-[var(--bw-muted)]">
                  {c.community || 'Dubai'} · Est. Asset <strong className="font-mono-num text-[var(--bw-ink)]">{fmtAed(c.property_price_aed, true)}</strong>
                </div>
                <div className="font-mono-num text-[11px] text-[#0e5a49]">{c.contact_phone_masked}</div>
                <div className="flex gap-1.5 pt-1">
                  <button type="button" onClick={() => void outreach('lead', c.id, 'Call', c.contact_name)} className="px-3 py-1 rounded-full bg-[#0b192c] text-[#64c4a8] font-bold inline-flex items-center gap-1 cursor-pointer">
                    <PhoneCall size={11} /> SIP Dial
                  </button>
                  <button type="button" onClick={() => void outreach('lead', c.id, 'WhatsApp', c.contact_name)} className="px-3 py-1 rounded-full border border-[var(--bw-line)] bg-white font-bold inline-flex items-center gap-1 cursor-pointer">
                    <MessageCircle size={11} className="text-emerald-600" /> WhatsApp
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 03 CRM COLLATERAL VAULT */}
      {subTab === 'vault' && (
        <div className="bw-card p-5 space-y-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-sm font-extrabold">PDPL-Shielded Mortgage Borrower &amp; Collateral Vault ({data.vaultLeads.length})</h2>
              <p className="text-[11px] text-[var(--bw-muted)]">High-security borrower records with hard-masked phones, LTV asset notes, and audited outbound calls.</p>
            </div>
            <Link href="/os/vault" className="bw-btn bw-btn-obsidian text-xs py-1.5 min-h-[34px]">Open Client Document Vault →</Link>
          </div>
          {data.vaultLeads.length === 0 ? (
            <div className="py-10 text-center text-[var(--bw-muted)]">No protected collateral vault records loaded yet. Use Owner Corner Batch Importer to ingest records.</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.vaultLeads.map((v) => (
                <div key={v.id} className="p-4 rounded-2xl border border-[#c49a45]/45 bg-[var(--bw-soft)]/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm">{v.contact_name}</span>
                    <StatusPill label="PDPL Masked" tone="navy" />
                  </div>
                  <div className="text-[11px] text-[var(--bw-muted)]">{v.community || 'UAE'} · {fmtAed(v.property_price_aed, true)}</div>
                  <button type="button" onClick={() => void outreach('vault_lead', v.id, 'Call', v.contact_name)} className="px-3 py-1.5 rounded-full bg-[#0b192c] text-[#64c4a8] font-bold inline-flex items-center gap-1 cursor-pointer">
                    <PhoneCall size={11} /> Audited SIP Call
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 04 MY ASSIGNED DEALS */}
      {subTab === 'assigned' && (
        <div className="bw-card p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-extrabold">My Assigned Mortgage Deals ({myDeals.length})</h2>
            <Link href="/os/pipeline" className="text-xs font-extrabold text-[#0e5a49] hover:underline">Open 12-Step Pipeline →</Link>
          </div>
          {myDeals.length === 0 ? (
            <div className="py-8 text-center text-[var(--bw-muted)]">No deals currently assigned in the 12-Step Pipeline.</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {myDeals.map((c) => (
                <div key={c.id} className="p-4 rounded-2xl border border-[var(--bw-line)] bg-[var(--bw-soft)]/50 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono-num font-bold text-[#0e5a49]">{c.case_code}</span>
                    <StatusPill label={c.stage_code || '01'} tone="emerald" />
                  </div>
                  <div className="font-extrabold text-sm">{c.borrower_name}</div>
                  <div className="text-[11px] text-[var(--bw-muted)]">{c.community} · Loan <strong className="font-mono-num text-[var(--bw-ink)]">{fmtAed(c.requested_loan_aed, true)}</strong></div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 05 WHATSAPP */}
      {subTab === 'whatsapp' && (
        <div className="grid lg:grid-cols-12 gap-5 text-xs">
          <GlossyBlackCard className="lg:col-span-5 p-5 space-y-3" accent="emerald">
            <div className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[#64c4a8]">WhatsApp Business Mortgage Intake</div>
            <h3 className="font-display text-lg font-extrabold text-white">Live Webhook Connected</h3>
            <p className="text-slate-300 leading-relaxed">Inbound WhatsApp mortgage messages route straight to Step 01 Leads via <code className="text-[#dfc285]">/api/v1/intake/whatsapp</code> with 5-minute SLA alerts.</p>
            <div className="p-3 rounded-xl bg-white/8 border border-white/12 font-mono text-[11px] text-[#64c4a8]">
              Endpoint: POST /api/v1/intake/whatsapp (HMAC Verified)
            </div>
          </GlossyBlackCard>
          <div className="lg:col-span-7 bw-card p-5 space-y-3">
            <h3 className="font-display text-sm font-extrabold">1-Click Betterway UAE Mortgage WhatsApp Templates</h3>
            {WHATSAPP_TEMPLATES.map((tpl) => (
              <div key={tpl.title} className="p-3.5 rounded-2xl border border-[var(--bw-line)] bg-[var(--bw-soft)]/50 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold">{tpl.title}</span>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard?.writeText(tpl.text);
                      toast(`Copied "${tpl.title}" for WhatsApp!`);
                    }}
                    className="px-3 py-1 rounded-full bg-emerald-600 text-white font-bold cursor-pointer"
                  >
                    Copy Template
                  </button>
                </div>
                <p className="text-[11px] text-[var(--bw-muted)] leading-relaxed">{tpl.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 06 EMAIL INBOX */}
      {subTab === 'email' && (
        <div className="grid lg:grid-cols-12 gap-5 text-xs">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!emailDraft.to.trim()) return;
              const emailId = `EM-${Date.now()}`;
              const atts = emailFiles.length > 0 ? await filesToLocalAttachments(emailFiles, 'crm-email', emailId, user?.name) : [];
              if (emailFiles.length > 0) {
                void uploadFilesToScope(emailFiles, 'crm-email', emailId).catch(() => null);
              }
              setEmailLog((prev) => [
                { id: emailId, to: emailDraft.to, subject: emailDraft.subject, status: 'Sent', time: 'Just now', attachments: atts },
                ...prev,
              ]);
              toast(`Logged mortgage email to ${emailDraft.to}${atts.length > 0 ? ` (${atts.length} attachment)` : ''}`);
              setEmailDraft({ to: '', subject: 'Betterway UAE Mortgage Comparison Proposal' });
              setEmailFiles([]);
            }}
            className="lg:col-span-5 bw-card p-5 space-y-3"
          >
            <h3 className="font-display text-sm font-extrabold">Compose Borrower / Bank RM Email</h3>
            <input required type="email" value={emailDraft.to} onChange={(e) => setEmailDraft({ ...emailDraft, to: e.target.value })} placeholder="Recipient email (borrower or bank RM)..." className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]" />
            <input required value={emailDraft.subject} onChange={(e) => setEmailDraft({ ...emailDraft, subject: e.target.value })} placeholder="Subject..." className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]" />
            <AttachmentPicker files={emailFiles} onChange={setEmailFiles} label="Attach Proposal / Bank Docs" compact />
            <button type="submit" className="bw-btn bw-btn-obsidian w-full text-xs">Log &amp; Send Correspondence</button>
          </form>
          <div className="lg:col-span-7 bw-card p-5 space-y-3">
            <h3 className="font-display text-sm font-extrabold">Recent Mortgage Email Threads ({emailLog.length})</h3>
            {emailLog.map((em) => (
              <div key={em.id} className="p-3 rounded-xl border border-[var(--bw-line)] space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-bold">{em.subject}</div>
                    <div className="text-[11px] text-[var(--bw-muted)]">{em.to} · {em.time}</div>
                  </div>
                  <StatusPill label={em.status} tone={em.status === 'Replied' ? 'emerald' : 'gold'} />
                </div>
                {em.attachments && em.attachments.length > 0 && <AttachmentChips attachments={em.attachments} compact />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 07 FOLLOW-UPS & CALLS */}
      {subTab === 'followups' && (
        <div className="grid lg:grid-cols-12 gap-5 text-xs">
          <div className="lg:col-span-6 bw-card p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-sm font-extrabold">Task &amp; To-Do Follow-Up Tracker ({followUpTasks.filter((t) => t.status !== 'Done').length} Open)</h2>
                <p className="text-[11px] text-[var(--bw-muted)]">Add attachments, schedule next callback time, and track every step.</p>
              </div>
            </div>

            <form onSubmit={createQuickFollowUpTask} className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <input
                  value={quickFuTitle}
                  onChange={(e) => setQuickFuTitle(e.target.value)}
                  placeholder="Schedule borrower or bank RM follow-up..."
                  className="flex-1 min-w-[160px] h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]"
                />
                <input
                  type="date"
                  value={quickFuDue}
                  onChange={(e) => setQuickFuDue(e.target.value)}
                  className="h-9 px-2.5 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num"
                />
                <button type="submit" className="bw-btn bw-btn-obsidian text-xs py-1.5 min-h-[36px]">
                  <Plus size={13} /> Add
                </button>
              </div>
              <AttachmentPicker files={quickFuFiles} onChange={setQuickFuFiles} label="Attach files to follow-up" compact />
            </form>

            <div className="space-y-2 max-h-[420px] overflow-y-auto pe-1">
              {followUpTasks.length === 0 ? (
                <div className="py-8 text-center text-[var(--bw-muted)]">No follow-up tasks scheduled yet.</div>
              ) : (
                followUpTasks.map((t) => (
                  <div key={t.id} className="p-3 rounded-2xl border border-[var(--bw-line)] bg-[var(--bw-soft)]/50 space-y-1.5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 size={14} className={t.status === 'Done' ? 'text-[#0e5a49]' : 'text-[var(--bw-muted)]'} />
                          <span className={`font-bold ${t.status === 'Done' ? 'line-through text-[var(--bw-muted)]' : ''}`}>{t.title}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10.5px] text-[var(--bw-muted)]">
                          {t.followUpStage && <StatusPill label={t.followUpStage} tone={t.followUpStage === 'Done' ? 'emerald' : 'navy'} />}
                          {t.nextFollowUpDate && t.status !== 'Done' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#eaf4f1] text-[#0a3f34] font-mono-num font-bold">
                              <CalendarClock size={10} /> {t.nextFollowUpDate} {t.nextFollowUpTime || ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveFollowUpTask(t)}
                        className="px-2.5 py-1 rounded-full bg-[#0b192c] text-[#dfc285] font-bold inline-flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <MessageSquarePlus size={11} />
                        Follow Up{t.followUpCount ? ` (${t.followUpCount})` : ''}
                        {(t.attachmentCount ?? 0) > 0 && (
                          <span className="text-[#64c4a8] inline-flex items-center gap-0.5">
                            <Paperclip size={10} />{t.attachmentCount}
                          </span>
                        )}
                      </button>
                    </div>
                    {t.attachments && t.attachments.length > 0 && <AttachmentChips attachments={t.attachments} compact />}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-6 bw-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-extrabold">Scheduled Borrower Callbacks &amp; SIP Queue</h2>
              <Link href="/os/sip-calls" className="bw-btn bw-btn-obsidian text-xs py-1.5 min-h-[34px]">Open Full SIP Call Desk →</Link>
            </div>
            <div className="space-y-2 max-h-[480px] overflow-y-auto">
              {data.leads.slice(0, 12).map((l) => (
                <div key={l.id} className="p-3.5 rounded-2xl border border-[var(--bw-line)] bg-[var(--bw-soft)]/50 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-extrabold">{l.contact_name} · <span className="font-mono-num text-[#0e5a49]">{l.reference_code}</span></div>
                    <div className="text-[11px] text-[var(--bw-muted)]">{l.community || 'Dubai'} · SLA 5-min callback · {l.contact_phone_masked}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => void scheduleLeadFollowUp(l)} className="px-3 py-1.5 rounded-full border border-[var(--bw-line-strong)] bg-white font-bold inline-flex items-center gap-1 cursor-pointer hover:border-[#0e5a49]">
                      <MessageSquarePlus size={12} className="text-[#0e5a49]" /> Follow Up
                    </button>
                    <button type="button" onClick={() => void outreach('lead', l.id, 'Call', l.contact_name)} className="px-3 py-1.5 rounded-full bg-[#0b192c] text-[#64c4a8] font-bold inline-flex items-center gap-1 cursor-pointer">
                      <PhoneCall size={12} /> SIP Call
                    </button>
                  </div>
                </div>
              ))}
              {data.leads.length === 0 && <div className="py-8 text-center text-[var(--bw-muted)]">All callback queues clear.</div>}
            </div>
          </div>
        </div>
      )}

      {/* 08 OPPORTUNITIES */}
      {subTab === 'opportunities' && (
        <div className="bw-card p-5 space-y-4 text-xs">
          <h2 className="font-display text-sm font-extrabold">Qualified Mortgage Opportunities &amp; Expected DSA Pipeline</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.leads.map((l) => {
              const estLoan = Math.round(Number(l.property_price_aed || 2_000_000) * 0.8);
              const estDsa = Math.round(estLoan * 0.0085);
              return (
                <div key={l.id} className="p-4 rounded-2xl border border-[var(--bw-line)] bg-[var(--bw-soft)]/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm">{l.contact_name}</span>
                    <StatusPill label={l.source_channel} tone="blue" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono-num">
                    <div className="p-2 rounded-xl bg-white border border-[var(--bw-line)]">
                      <div className="text-[9.5px] text-[var(--bw-muted)]">Est. Loan (80%)</div>
                      <div className="font-extrabold">{fmtAed(estLoan, true)}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-[var(--bw-line)]">
                      <div className="text-[9.5px] text-[var(--bw-muted)]">Est. Bank DSA</div>
                      <div className="font-extrabold text-[#0e5a49]">{fmtAed(estDsa, true)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 09 ROUTING RULES */}
      {subTab === 'routing' && (
        <div className="bw-card p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-sm font-extrabold">Lead Auto-Routing &amp; 5-Minute SLA Assignment Rules</h2>
              <p className="text-[11px] text-[var(--bw-muted)]">Active across {OFFICIAL_ROSTER.length - 1} Betterway Dubai mortgage seats.</p>
            </div>
            <StatusPill label="Round-Robin Active" tone="emerald" />
          </div>
          <div className="space-y-2.5">
            {routingRules.map((rule) => (
              <div key={rule.id} className="p-4 rounded-2xl border border-[var(--bw-line)] bg-[var(--bw-soft)]/50 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-extrabold text-sm">{rule.id} · {rule.name}</div>
                  <div className="text-[11px] text-[var(--bw-muted)]">Source: {rule.channel} · Assigned to: <strong>{rule.assignee}</strong> · SLA: {rule.slaMin} mins</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRoutingRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, active: !r.active } : r)));
                    toast(`Updated routing rule ${rule.id}`);
                  }}
                  className={`px-3.5 py-1.5 rounded-full font-extrabold cursor-pointer ${rule.active ? 'bg-[#0b192c] text-[#64c4a8]' : 'bg-slate-200 text-slate-600'}`}
                >
                  {rule.active ? 'Active' : 'Paused'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      <TaskFollowUpDrawer
        task={activeFollowUpTask}
        assigneeName={user?.name}
        onClose={() => setActiveFollowUpTask(null)}
        onUpdated={load}
      />
    </div>
  );
}
