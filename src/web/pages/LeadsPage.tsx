import React, { useEffect, useState } from 'react';
import { ArrowRightCircle, Globe, Plus, ShieldCheck, UserPlus } from 'lucide-react';
import { apiFetch, fmtAed } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { ModalDialog, PageHeader, StatusPill } from '../components/UiPrimitives';

export function LeadsPage() {
  const { toast } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    contact_name: '',
    contact_phone: '+971 50 ',
    contact_email: '',
    residency: 'Expat resident',
    borrower_profile: 'salaried',
    goal: 'Resale Purchase (Secondary)',
    property_price_aed: 2500000,
    monthly_income_aed: 45000,
    source_channel: 'WhatsApp Direct',
    is_swk_relay: false,
  });

  const load = async () => {
    const d = await apiFetch<{ leads: any[] }>('/api/leads');
    setLeads(d.leads || []);
  };
  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch<any>('/api/leads', { method: 'POST', body: JSON.stringify(form) });
      toast(`Lead captured: ${res.reference_code}`);
      setOpen(false);
      await load();
    } catch (err: any) {
      toast(err.message, 'err');
    }
  };

  const simulateWebsiteLead = async () => {
    const rand = Math.floor(1000 + Math.random() * 8999);
    try {
      const res = await apiFetch<any>('/api/v1/intake/leads', {
        method: 'POST',
        body: JSON.stringify({
          contactName: `Website Buyer #${rand}`,
          contactPhone: `+971 50 ${rand} 204`,
          contactEmail: `buyer${rand}@dubai.ae`,
          residency: 'Expat resident',
          goal: 'Handover Payment (SOA)',
          propertyPriceAed: 3_150_000,
          downPaymentPct: 20,
          monthlyIncomeAed: 58_000,
          topic: 'betterwaymortgages.com Live Calculator Enquiry',
          sourcePage: '/calculators/mortgage-calculator',
        }),
      });
      toast(`Synced live website lead ${res.referenceCode} → Assigned to ${res.assignedAdvisor?.name}`);
      await load();
    } catch (err: any) {
      toast(err.message, 'err');
    }
  };

  const convertLead = async (id: string) => {
    try {
      const res = await apiFetch<any>(`/api/leads/${id}/convert`, { method: 'POST' });
      toast(`Converted to active LOS Mortgage Case ${res.case_code}!`);
      await load();
    } catch (err: any) {
      toast(err.message, 'err');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CRM & Website Interconnect (/api/v1/intake/leads)"
        title="Leads &"
        accent="Attribution Desk"
        subtitle="Unified intake from betterwaymortgages.com, WhatsApp, RERA Partner Hub, and SWK Properties Dual-Relay with automatic deduplication and PDPL consent logging."
        actions={
          <>
            <button
              type="button"
              onClick={() => void simulateWebsiteLead()}
              className="px-4 py-2 rounded-full text-xs font-bold border border-[#D7B158]/50 bg-[#070E1A] text-[#FCF1B7] flex items-center gap-1.5 cursor-pointer"
            >
              <Globe size={14} /> Test Website Interconnect
            </button>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="px-4 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r from-[#179373] to-[#0A4A3E] flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} /> Add Lead
            </button>
          </>
        }
      />

      <div className="bw-card overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[920px]">
          <thead className="bg-[var(--bw-soft)] text-[10.5px] uppercase tracking-wider text-[var(--bw-muted)]">
            <tr>
              <th className="p-3.5">Ref Code</th>
              <th className="p-3.5">Client &amp; Contact</th>
              <th className="p-3.5">Profile &amp; Goal</th>
              <th className="p-3.5">Property / Income</th>
              <th className="p-3.5">Source &amp; Consent</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--bw-line)]">
            {leads.map((l) => (
              <tr key={l.id} className="hover:bg-[var(--bw-soft)]/50">
                <td className="p-3.5 font-mono-num font-bold text-[#179373]">{l.reference_code}</td>
                <td className="p-3.5">
                  <div className="font-bold">{l.contact_name}</div>
                  <div className="text-[11px] text-[var(--bw-muted)]">{l.contact_phone} · {l.contact_email || 'No email'}</div>
                </td>
                <td className="p-3.5">
                  <div className="font-semibold">{l.goal}</div>
                  <div className="text-[11px] text-[var(--bw-muted)]">{l.residency} · {l.borrower_profile}</div>
                </td>
                <td className="p-3.5 font-mono-num">
                  <div className="font-bold">{fmtAed(l.property_price_aed)}</div>
                  <div className="text-[11px] text-[var(--bw-muted)]">Income: {fmtAed(l.monthly_income_aed)}/mo</div>
                </td>
                <td className="p-3.5">
                  <div className="flex flex-wrap gap-1">
                    <StatusPill label={l.source_channel} tone="navy" />
                    {l.is_swk_relay === 1 && <StatusPill label="SWK Relay" tone="gold" />}
                    {l.consent_pdpl === 1 && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#179373]">
                        <ShieldCheck size={12} /> PDPL
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-3.5">
                  <StatusPill
                    label={l.status}
                    tone={l.status === 'Converted' ? 'emerald' : l.status === 'Qualified' ? 'blue' : 'gold'}
                  />
                </td>
                <td className="p-3.5">
                  {l.status !== 'Converted' ? (
                    <button
                      type="button"
                      onClick={() => void convertLead(l.id)}
                      className="px-3 py-1.5 rounded-full bg-[#179373] text-white font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowRightCircle size={13} /> Convert to LOS
                    </button>
                  ) : (
                    <span className="text-[11px] text-[var(--bw-muted)]">In Pipeline</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ModalDialog open={open} onClose={() => setOpen(false)} title="Capture Mortgage Lead" subtitle="Deduplicates phone numbers and enforces PDPL Law 45/2021 consent tracking.">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">Full Name</label>
              <input required value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} className="w-full h-10 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Mobile Number</label>
              <input required value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} className="w-full h-10 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Property Value (AED)</label>
              <input type="number" value={form.property_price_aed} onChange={(e) => setForm({ ...form, property_price_aed: Number(e.target.value) })} className="w-full h-10 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] text-sm font-mono-num" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Monthly Income (AED)</label>
              <input type="number" value={form.monthly_income_aed} onChange={(e) => setForm({ ...form, monthly_income_aed: Number(e.target.value) })} className="w-full h-10 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] text-sm font-mono-num" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
            <input type="checkbox" checked={form.is_swk_relay} onChange={(e) => setForm({ ...form, is_swk_relay: e.target.checked })} className="size-4 accent-[#179373]" />
            SWK Properties Dual-Relay Lead
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-full border border-[var(--bw-line)] text-xs font-bold">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-full bg-[#179373] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer">
              <UserPlus size={14} /> Save Lead
            </button>
          </div>
        </form>
      </ModalDialog>
    </div>
  );
}
