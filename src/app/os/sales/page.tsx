'use client';

import React, { useState } from 'react';
import { Copy, Handshake, Printer, Share2, Sparkles } from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { fmtAed, GlossyBlackCard, PageHeader, StatusPill } from '@/components/os/UiKit';
import { useInstantApi } from '@/lib/client-cache';

export default function SalesAndServicesPage() {
  const { user, toast } = useOs();
  const { data: liveData, reload } = useInstantApi<{ brokers: any[]; cases: any[]; referrals: any[] }>('/api/v1/sales');
  const data = liveData ?? { brokers: [], cases: [], referrals: [] };

  const [refForm, setRefForm] = useState({
    contactName: '',
    contactPhone: '+971 50 ',
    partnerAgency: '',
    partnerBrn: '',
    community: 'Dubai Creek Harbour',
    propertyPriceAed: 2_800_000,
  });

  // White-Label Borrower Live Tracker Card
  const [trackerCaseIdx, setTrackerCaseIdx] = useState(0);

  const registerReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await fetch('/api/v1/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(refForm),
    });
    if (r.ok) {
      toast('RERA Partner Referral attribution locked into Step 01 CRM!');
      setRefForm({ ...refForm, contactName: '', partnerAgency: '', partnerBrn: '' });
      await reload();
    }
  };

  const trackedCase = data.cases[trackerCaseIdx] ?? null;

  const copyBorrowerTracker = () => {
    const c = trackedCase;
    const msg = c
      ? [
          `*Betterway Mortgages LLC — Live Mortgage Status Update*`,
          `Case Ref: ${c.case_code} | Client: ${c.borrower_name}`,
          `Current Stage: ${c.stage_code} | Property: ${c.community || 'Dubai'} (${fmtAed(c.property_price_aed)})`,
          `Requested Facility: ${fmtAed(c.requested_loan_aed)} (${c.mortgage_type || 'UAE Mortgage'})`,
          `Next Milestone: ${c.next_action || 'Bank Pre-Approval / Valuation Coordination'}`,
          `Advisor: ${user?.name || 'Betterway Advisory Desk'} · Zero Client Broker Fee`,
        ].join('\n')
      : `*Betterway Mortgages LLC — Live Client Mortgage Portal*\nTrack your 12-step UAE mortgage journey from Pre-Approval to DLD Trustee Disbursal with Zero Client Broker Fee.`;
    void navigator.clipboard?.writeText(msg);
    toast('Copied White-Label Borrower Status Update for WhatsApp!');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Quotes · White-Label Borrower Tracker · Cross-Sell & RERA Partner Referral Hub"
        title="Quotes &"
        accent="Partner Desk"
        subtitle="Lock RERA broker referral attributions with corporate-bank-only payout protection, share white-label live borrower status cards, print branded comparisons, and coordinate Takaful, Golden Visa & DIFC Wills."
      />

      {/* Glossy Black White-Label Borrower Live Tracker (Dubai Competitor Feature) */}
      <GlossyBlackCard className="p-5 sm:p-6 space-y-4" accent="dual">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[#34f0bc]">
              <Share2 size={13} className="text-[#fbe8a4]" /> White-Label Borrower &amp; Partner Live Status Share
            </div>
            <h2 className="font-display text-lg font-extrabold text-white mt-0.5">
              Instant PDPL-Safe Mortgage Progress Card
            </h2>
            <p className="text-xs text-slate-300">
              Send borrowers or referring RERA brokers an instant live milestone update — zero internal DSA or sensitive notes exposed.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {data.cases.length > 0 && (
              <select
                value={trackerCaseIdx}
                onChange={(e) => setTrackerCaseIdx(Number(e.target.value))}
                className="h-9 px-3 rounded-full bg-white/10 border border-white/15 text-xs text-white font-bold"
              >
                {data.cases.slice(0, 20).map((c, idx) => (
                  <option key={c.id} value={idx} className="text-black">
                    {c.case_code} · {c.borrower_name}
                  </option>
                ))}
              </select>
            )}
            <button type="button" onClick={copyBorrowerTracker} className="bw-btn bw-btn-gold text-xs py-2 min-h-[36px]">
              <Copy size={13} /> Copy Live WhatsApp Update
            </button>
          </div>
        </div>
        {trackedCase && (
          <div className="grid sm:grid-cols-4 gap-3 pt-2 border-t border-white/12 text-xs">
            <div className="p-3 rounded-xl bg-white/[0.06]">
              <div className="text-[10px] text-slate-400 uppercase">Case &amp; Borrower</div>
              <div className="font-bold text-white mt-0.5">{trackedCase.case_code} · {trackedCase.borrower_name}</div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.06]">
              <div className="text-[10px] text-slate-400 uppercase">Current Stage</div>
              <div className="font-bold text-[#34f0bc] mt-0.5">{trackedCase.stage_code}</div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.06]">
              <div className="text-[10px] text-slate-400 uppercase">Loan Amount</div>
              <div className="font-mono-num font-bold text-[#fbe8a4] mt-0.5">{fmtAed(trackedCase.requested_loan_aed)}</div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.06]">
              <div className="text-[10px] text-slate-400 uppercase">Next Step</div>
              <div className="font-semibold text-slate-200 mt-0.5 truncate">{trackedCase.next_action || 'Bank Processing'}</div>
            </div>
          </div>
        )}
      </GlossyBlackCard>

      <div className="grid lg:grid-cols-12 gap-6">
        <form onSubmit={registerReferral} className="lg:col-span-5 bw-card p-5 space-y-3 text-xs">
          <h3 className="font-display text-sm font-extrabold flex items-center gap-1.5">
            <Handshake size={15} className="text-[#119c78]" /> 60-Second RERA Broker Referral Lock
          </h3>
          <input required value={refForm.contactName} onChange={(e) => setRefForm({ ...refForm, contactName: e.target.value })} placeholder="Referred Borrower Name *" className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]" />
          <input required value={refForm.contactPhone} onChange={(e) => setRefForm({ ...refForm, contactPhone: e.target.value })} placeholder="Borrower Phone *" className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]" />
          <div className="grid grid-cols-2 gap-2">
            <input required value={refForm.partnerAgency} onChange={(e) => setRefForm({ ...refForm, partnerAgency: e.target.value })} placeholder="Partner Brokerage (RERA ORN) *" className="h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]" />
            <input value={refForm.partnerBrn} onChange={(e) => setRefForm({ ...refForm, partnerBrn: e.target.value })} placeholder="Partner RERA BRN" className="h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input value={refForm.community} onChange={(e) => setRefForm({ ...refForm, community: e.target.value })} placeholder="Community" className="h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]" />
            <input type="number" value={refForm.propertyPriceAed} onChange={(e) => setRefForm({ ...refForm, propertyPriceAed: Number(e.target.value) })} className="h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
          </div>
          <button type="submit" className="bw-btn bw-btn-obsidian w-full text-xs">
            Lock Referral Attribution
          </button>
        </form>

        <div className="lg:col-span-7 space-y-4">
          <div className="bw-card p-5 space-y-3 text-xs">
            <h3 className="font-display text-sm font-extrabold">Registered RERA Broker Partners ({data.brokers.length})</h3>
            {data.brokers.length === 0 ? (
              <div className="py-6 text-center text-[var(--bw-muted)]">No RERA broker partners loaded yet.</div>
            ) : (
              data.brokers.map((b) => (
                <div key={b.id} className="p-3 rounded-xl border border-[var(--bw-line)] flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-bold">{b.agency_name} · {b.broker_name}</div>
                    <div className="text-[var(--bw-muted)]">ORN {b.orn_number} · BRN {b.brn_number} · Split {b.commission_split_pct}%</div>
                  </div>
                  <StatusPill label={b.corporate_bank_verified ? 'Corporate IBAN Verified' : 'Needs Bank Letter'} tone={b.corporate_bank_verified ? 'emerald' : 'gold'} />
                </div>
              ))
            )}
          </div>

          <div className="bw-card p-5 space-y-3 text-xs">
            <h3 className="font-display text-sm font-extrabold flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#d9b356]" /> Post-Mortgage Value-Add Desk
            </h3>
            <div className="grid sm:grid-cols-3 gap-2.5">
              <div className="p-3.5 rounded-xl bg-[var(--bw-soft)] border border-[var(--bw-line)]">
                <div className="font-extrabold">Life &amp; Property Takaful</div>
                <div className="text-[11px] text-[var(--bw-muted)] mt-0.5">External assignment savings vs bank bundled cover</div>
              </div>
              <div className="p-3.5 rounded-xl bg-[var(--bw-soft)] border border-[var(--bw-line)]">
                <div className="font-extrabold">UAE Golden Visa (AED 2M)</div>
                <div className="text-[11px] text-[var(--bw-muted)] mt-0.5">Bank NOC + DLD 10-year residency coordination</div>
              </div>
              <div className="p-3.5 rounded-xl bg-[var(--bw-soft)] border border-[var(--bw-line)]">
                <div className="font-extrabold">DIFC / Abu Dhabi Wills</div>
                <div className="text-[11px] text-[var(--bw-muted)] mt-0.5">Asset protection upon DLD Title Deed issuance</div>
              </div>
            </div>
            <button type="button" onClick={() => window.print()} className="bw-btn bw-btn-outline text-xs py-2 min-h-[36px]">
              <Printer size={13} /> Print Partner &amp; Value-Add Sheet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
