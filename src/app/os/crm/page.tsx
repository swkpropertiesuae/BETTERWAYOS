'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ArrowRight, MessageCircle, PhoneCall, Plus } from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { fmtAed, MetricTile, PageHeader, StatusPill } from '@/components/os/UiKit';
import { ENQUIRY_CHANNELS } from '@/lib/domain/workflow';

export default function CrmPage() {
  const { toast } = useOs();
  const [data, setData] = useState<{ todayDubai: string; todayCount: number; leads: any[]; vaultLeads: any[] }>({
    todayDubai: '',
    todayCount: 0,
    leads: [],
    vaultLeads: [],
  });
  const [dateFilter, setDateFilter] = useState('');
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
    const r = await fetch(`/api/v1/crm/leads${q}`);
    if (r.ok) setData(await r.json());
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
    toast(`Daily Enquiry ${out.lead.reference_code} logged (${out.lead.received_date_dubai})!`);
    setForm({ ...form, contactName: '', contactEmail: '', notes: '' });
    await load();
  };

  const outreach = async (entityType: 'lead' | 'vault_lead', entityId: string, channel: 'Call' | 'WhatsApp') => {
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Step 01 · 100% Exact Daily Enquiry Ledger (All Channels)"
        title="CRM & Daily"
        accent="Enquiry Control"
        subtitle="Capture every single daily enquiry from Website, Online Chat, WhatsApp, Bayut, Property Finder, Referrals, Calls & Walk-ins with 5-minute SLA & PDPL phone masking."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricTile label={`Today's Enquiries (${data.todayDubai || 'GST'})`} value={data.todayCount} hint="100% daily reconciliation" tone="emerald" />
        <MetricTile label="Total Active Enquiries" value={data.leads.length} hint="Scoped by RBAC role" tone="navy" />
        <MetricTile label="Protected Client Vault Leads" value={data.vaultLeads.length} hint="Hard-masked outreach" tone="gold" />
        <MetricTile label="Website Intake Endpoint" value="LIVE" hint="/api/v1/intake/leads (HMAC)" />
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Quick Daily Enquiry Capture */}
        <form onSubmit={logEnquiry} className="lg:col-span-4 bw-card p-5 space-y-3 text-xs">
          <h3 className="text-sm font-extrabold flex items-center gap-1.5">
            <Plus size={15} className="text-[#007b52]" /> Log Daily Enquiry (100% Capture)
          </h3>
          <div>
            <label className="font-bold block mb-1">Client Full Name *</label>
            <input required value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
          </div>
          <div>
            <label className="font-bold block mb-1">Phone Number *</label>
            <input required value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold block mb-1">Channel *</label>
              <select value={form.sourceChannel} onChange={(e) => setForm({ ...form, sourceChannel: e.target.value })} className="w-full h-9 px-2.5 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]">
                {ENQUIRY_CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="font-bold block mb-1">Reference / Staff</label>
              <input value={form.referrerName} onChange={(e) => setForm({ ...form, referrerName: e.target.value })} placeholder="Referrer name" className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold block mb-1">Community</label>
              <input value={form.community} onChange={(e) => setForm({ ...form, community: e.target.value })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
            </div>
            <div>
              <label className="font-bold block mb-1">Property Value (AED)</label>
              <input type="number" value={form.propertyPriceAed} onChange={(e) => setForm({ ...form, propertyPriceAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] font-mono-num" />
            </div>
          </div>
          <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Enquiry summary..." className="w-full p-2.5 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
          <button type="submit" className="w-full h-10 rounded-full bg-[#007b52] text-white font-bold cursor-pointer">
            Record Daily Enquiry
          </button>
        </form>

        {/* Daily Enquiry Table */}
        <div className="lg:col-span-8 bw-card p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-extrabold">Exact Daily Enquiries Register</h3>
            <div className="flex items-center gap-2 text-xs">
              <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="h-8 px-2.5 rounded-lg border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
              {dateFilter && (
                <button type="button" onClick={() => setDateFilter('')} className="text-[#007b52] font-bold cursor-pointer">All Dates</button>
              )}
            </div>
          </div>

          <div className="space-y-2.5 max-h-[540px] overflow-y-auto">
            {data.leads.length === 0 ? (
              <div className="py-10 text-center text-xs text-[var(--bw-muted)]">No enquiries logged for this filter yet.</div>
            ) : (
              data.leads.map((l) => (
                <div key={l.id} className="p-3.5 rounded-2xl border border-[var(--bw-line)] bg-[var(--bw-bg)]/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-num font-bold text-[#007b52]">{l.reference_code}</span>
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
                    <button type="button" onClick={() => void outreach('lead', l.id, 'Call')} className="px-3 py-1.5 rounded-full border border-[var(--bw-line)] font-bold inline-flex items-center gap-1 cursor-pointer">
                      <PhoneCall size={12} /> Call
                    </button>
                    <button type="button" onClick={() => void outreach('lead', l.id, 'WhatsApp')} className="px-3 py-1.5 rounded-full bg-emerald-600 text-white font-bold inline-flex items-center gap-1 cursor-pointer">
                      <MessageCircle size={12} /> WhatsApp
                    </button>
                    {l.status !== 'Converted' && (
                      <button type="button" onClick={() => void convertToPipeline(l)} className="px-3 py-1.5 rounded-full bg-[#025e3d] text-[#FCF1B7] font-bold inline-flex items-center gap-1 cursor-pointer">
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
    </div>
  );
}
