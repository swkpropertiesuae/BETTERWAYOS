'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Award,
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarClock,
  CheckCircle2,
  Copy,
  FileCheck2,
  FileSignature,
  FileText,
  Handshake,
  Landmark,
  Printer,
  RotateCcw,
  Share2,
  Wallet,
} from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { fmtAed, GlossyBlackCard, PageHeader, StatusPill } from '@/components/os/UiKit';
import { SubFeatureTabs, type SubFeatureItem } from '@/components/os/SubFeatureTabs';
import { useInstantApi } from '@/lib/client-cache';

type SalesSubTab =
  | 'deals'
  | 'mandate'
  | 'consultations'
  | 'offers'
  | 'form_f'
  | 'noc'
  | 'dld'
  | 'fol'
  | 'schedules'
  | 'cheques'
  | 'partners'
  | 'refunds';

const SALES_SUB_TABS: ReadonlyArray<SubFeatureItem<SalesSubTab>> = [
  { id: 'deals', num: '01', label: 'Mortgage Deal Files', icon: Briefcase },
  { id: 'mandate', num: '02', label: 'Client Mandate & KFS', icon: FileSignature },
  { id: 'consultations', num: '03', label: 'Bank Consultations', icon: CalendarClock },
  { id: 'offers', num: '04', label: 'Pre-Approval Offers', icon: BadgeCheck },
  { id: 'form_f', num: '05', label: 'Form F / Sale Contract', icon: FileCheck2 },
  { id: 'noc', num: '06', label: 'Developer NOC & SOA', icon: Building2 },
  { id: 'dld', num: '07', label: 'DLD Transfer / Oqood', icon: Landmark },
  { id: 'fol', num: '08', label: 'Final Offer Letters (FOL)', icon: FileText },
  { id: 'schedules', num: '09', label: 'Rate-Reset Schedules', icon: CalendarClock },
  { id: 'cheques', num: '10', label: 'Manager Cheques (MC)', icon: Wallet },
  { id: 'partners', num: '11', label: 'RERA Partner Hub', icon: Handshake },
  { id: 'refunds', num: '12', label: 'Withdrawals & Refunds', icon: RotateCcw },
];

export default function SalesAndServicesPage() {
  const { user, toast } = useOs();
  const [subTab, setSubTab] = useState<SalesSubTab>('deals');
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
    <div className="space-y-5">
      <PageHeader
        eyebrow="100% UAE Mortgage Closing & Services · 12-Module Advisory Desk"
        title="Sales &"
        accent="Mortgage Services"
        subtitle="Manage Mortgage Deal Files, CBUAE Client Mandates, Bank Consultations, Pre-Approval Offers, Form F MOUs, Developer NOC/SOA, DLD Trustee/Oqood Transfers, FOLs, Rate-Reset Schedules, Manager Cheques, RERA Partner Referrals & Fee Refunds."
      />

      <SubFeatureTabs sectionTitle="Sales & Services" items={SALES_SUB_TABS} activeId={subTab} onSelect={setSubTab} />

      {/* 01 MORTGAGE DEAL FILES */}
      {subTab === 'deals' && (
        <div className="space-y-5">
          <GlossyBlackCard className="p-5 sm:p-6 space-y-4" accent="dual">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[#34f0bc]">
                  <Share2 size={13} className="text-[#fbe8a4]" /> White-Label Borrower &amp; Partner Live Status Share
                </div>
                <h2 className="font-display text-lg font-extrabold text-white mt-0.5">PDPL-Safe Mortgage Progress Card</h2>
                <p className="text-xs text-slate-300">Send borrowers or referring RERA partners an instant milestone update — zero internal DSA exposed.</p>
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
                  <div className="text-[10px] text-slate-400 uppercase">Loan Facility</div>
                  <div className="font-mono-num font-bold text-[#fbe8a4] mt-0.5">{fmtAed(trackedCase.requested_loan_aed)}</div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.06]">
                  <div className="text-[10px] text-slate-400 uppercase">Next Step</div>
                  <div className="font-semibold text-slate-200 mt-0.5 truncate">{trackedCase.next_action || 'Bank Processing'}</div>
                </div>
              </div>
            )}
          </GlossyBlackCard>

          <div className="bw-card p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-extrabold">Active Mortgage Deal Files ({data.cases.length})</h3>
              <Link href="/os/pipeline" className="text-xs font-extrabold text-[#119c78] hover:underline">Open 12-Step Pipeline →</Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.cases.map((c) => (
                <div key={c.id} className="p-4 rounded-2xl border border-[var(--bw-line)] bg-[var(--bw-soft)]/50 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono-num font-bold text-[#119c78]">{c.case_code}</span>
                    <StatusPill label={c.stage_code} tone="emerald" />
                  </div>
                  <div className="font-extrabold text-sm">{c.borrower_name}</div>
                  <div className="text-[11px] text-[var(--bw-muted)]">{c.community || 'Dubai'} · Loan <strong className="font-mono-num text-[var(--bw-ink)]">{fmtAed(c.requested_loan_aed, true)}</strong></div>
                </div>
              ))}
              {data.cases.length === 0 && <div className="col-span-full py-8 text-center text-[var(--bw-muted)]">No active mortgage deal files yet.</div>}
            </div>
          </div>
        </div>
      )}

      {/* 02 CLIENT MANDATE & KFS */}
      {subTab === 'mandate' && (
        <div className="bw-card p-5 space-y-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-sm font-extrabold">CBUAE Client Brokerage Mandate &amp; Joint Key Facts Statement (KFS)</h2>
              <p className="text-[11px] text-[var(--bw-muted)]">Mandatory CBUAE borrower disclosure confirming AED 0 client broker fee and multi-bank panel neutrality.</p>
            </div>
            <Link href="/os/utilities" className="bw-btn bw-btn-obsidian text-xs py-1.5 min-h-[34px]">Generate Fillable KFS (.docx / JPEG) →</Link>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { code: 'BW-MANDATE-KFS', title: 'CBUAE Joint Key Facts Statement', status: 'Mandatory Pre-Submission' },
              { code: 'BW-PREAPP-PACK', title: 'Borrower Consent & AECB Release', status: 'PDPL Logged' },
              { code: 'BW-BUYOUT-LIAB', title: 'Liability & Buyout Disclosure Form', status: 'Refinance Track' },
            ].map((doc) => (
              <div key={doc.code} className="p-4 rounded-2xl border border-[var(--bw-line)] bg-[var(--bw-soft)]/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#119c78]">{doc.code}</span>
                  <StatusPill label={doc.status} tone="emerald" />
                </div>
                <div className="font-extrabold text-sm">{doc.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 03 BANK CONSULTATIONS & VALUATIONS */}
      {subTab === 'consultations' && (
        <div className="bw-card p-5 space-y-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-sm font-extrabold">Borrower Consultations, Bank RM Meetings &amp; Valuation Appointments</h2>
              <p className="text-[11px] text-[var(--bw-muted)]">GPS-pinned field mortgage meetings and panel valuation bookings (CBRE, JLL, Cavendish Maxwell).</p>
            </div>
            <div className="flex gap-2">
              <Link href="/os/mortgage-desk?tab=schedule" className="bw-btn bw-btn-obsidian text-xs py-1.5 min-h-[34px]">Book Bank Valuation →</Link>
              <Link href="/os/field-gps" className="bw-btn bw-btn-outline text-xs py-1.5 min-h-[34px]">Field GPS Meetings →</Link>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {['Client Consultation (Oud Metha / Zoom)', 'Bank RM & FOL Signing Session', 'Panel Valuation Inspection Access'].map((m) => (
              <div key={m} className="p-4 rounded-2xl border border-[var(--bw-line)] bg-[var(--bw-soft)]/50 font-bold flex items-center gap-2">
                <CheckCircle2 size={14} className="text-[#119c78] shrink-0" /> {m}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 04 PRE-APPROVAL OFFERS */}
      {subTab === 'offers' && (
        <div className="bw-card p-5 space-y-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-sm font-extrabold">Multi-Bank Pre-Approval Offers &amp; 3-Bank Auto-Eco Quotes</h2>
              <p className="text-[11px] text-[var(--bw-muted)]">Compare 3 UAE banks side-by-side with exact 300-month amortization, life insurance, and DLD fees.</p>
            </div>
            <Link href="/os/mortgage-desk?tab=proposal" className="bw-btn bw-btn-obsidian text-xs py-1.5 min-h-[34px]">Open 3-Bank Proposal Maker →</Link>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { bank: 'Emirates NBD (STL)', rate: '3.89% 2Y Fixed', tat: '11–14d Fast-Pass' },
              { bank: 'ADIB Islamic Finance', rate: '3.99% 3Y Fixed', tat: 'Zero PF Promo' },
              { bank: 'Commercial Bank of Dubai', rate: '3.99% 3Y Fixed', tat: 'Self-Employed Friendly' },
            ].map((o) => (
              <div key={o.bank} className="p-4 rounded-2xl border border-[var(--bw-line)] bg-[var(--bw-soft)]/50 space-y-1">
                <div className="font-extrabold text-sm">{o.bank}</div>
                <div className="font-mono-num text-[#119c78] font-extrabold">{o.rate}</div>
                <div className="text-[11px] text-[var(--bw-muted)]">{o.tat}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 05 FORM F / SALE CONTRACT */}
      {subTab === 'form_f' && (
        <div className="bw-card p-5 space-y-3 text-xs">
          <h2 className="font-display text-sm font-extrabold">Form F (MOU) &amp; Purchase Contract Verification for Mortgage Underwriting</h2>
          <p className="text-[11px] text-[var(--bw-muted)]">Verify Form F expiry dates, seller mortgage liability status, 10% deposit cheque copy, and Title Deed before bank submission.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {['Form F Signed & Expiry Valid (> 45d)', 'Seller Title Deed / Oqood Verified', 'Seller Existing Mortgage Liability Letter', '10% Deposit Cheque Copy Logged'].map((chk) => (
              <div key={chk} className="p-3.5 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-soft)]/60 font-bold flex items-center gap-2">
                <CheckCircle2 size={14} className="text-[#119c78] shrink-0" /> {chk}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 06 DEVELOPER NOC & SOA */}
      {subTab === 'noc' && (
        <div className="bw-card p-5 space-y-3 text-xs">
          <h2 className="font-display text-sm font-extrabold">Developer NOC &amp; Statement of Account (SOA) Coordination</h2>
          <p className="text-[11px] text-[var(--bw-muted)]">Track Emaar, Nakheel, Sobha, DAMAC, Meraas, Aldar &amp; Azizi mortgage NOC approvals and service-charge clearance ahead of DLD transfer.</p>
          <div className="flex flex-wrap gap-2">
            {['Emaar Properties (APL)', 'Nakheel / Dubai Holding', 'DAMAC Properties', 'Sobha Realty', 'Meraas', 'Aldar Abu Dhabi', 'Azizi Developments'].map((dev) => (
              <StatusPill key={dev} label={dev} tone="emerald" />
            ))}
          </div>
        </div>
      )}

      {/* 07 DLD TRANSFER / OQOOD */}
      {subTab === 'dld' && (
        <div className="bw-card p-5 space-y-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-sm font-extrabold">Dubai Land Department (DLD) Trustee Transfer &amp; Oqood Handover Finance</h2>
              <p className="text-[11px] text-[var(--bw-muted)]">Coordinate DLD Trustee appointment, 4% + AED 580 transfer fee, 0.25% + AED 290 mortgage registration &amp; title deed issuance.</p>
            </div>
            <Link href="/os/coordinator" className="bw-btn bw-btn-obsidian text-xs py-1.5 min-h-[34px]">Open 32-Col Coordinator →</Link>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-[var(--bw-soft)] border border-[var(--bw-line)]"><div className="text-[10px] uppercase text-[var(--bw-muted)] font-bold">DLD Transfer Fee</div><div className="font-mono-num text-base font-extrabold mt-0.5">4% + AED 580</div></div>
            <div className="p-4 rounded-xl bg-[var(--bw-soft)] border border-[var(--bw-line)]"><div className="text-[10px] uppercase text-[var(--bw-muted)] font-bold">Mortgage Registration</div><div className="font-mono-num text-base font-extrabold mt-0.5">0.25% + AED 290</div></div>
            <div className="p-4 rounded-xl bg-[var(--bw-soft)] border border-[var(--bw-line)]"><div className="text-[10px] uppercase text-[var(--bw-muted)] font-bold">DLD Trustee Office</div><div className="font-mono-num text-base font-extrabold mt-0.5">AED 4,200 (incl. VAT)</div></div>
          </div>
        </div>
      )}

      {/* 08 FINAL OFFER LETTERS (FOL) */}
      {subTab === 'fol' && (
        <div className="bw-card p-5 space-y-3 text-xs">
          <h2 className="font-display text-sm font-extrabold">Final Offer Letters (FOL) &amp; Insurance Assignment Desk</h2>
          <p className="text-[11px] text-[var(--bw-muted)]">Verify final approved interest rate, revert margin, life/property takaful assignment, and bank disbursement conditions prior to client signing.</p>
          <div className="grid sm:grid-cols-3 gap-3">
            {['FOL Rate & Revert Margin Audited', 'Life & Property Takaful Assigned', 'Security Cheque & Salary Transfer Verified'].map((f) => (
              <div key={f} className="p-3.5 rounded-xl bg-[var(--bw-soft)] border border-[var(--bw-line)] font-bold flex items-center gap-2">
                <CheckCircle2 size={14} className="text-[#119c78] shrink-0" /> {f}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 09 RATE-RESET SCHEDULES */}
      {subTab === 'schedules' && (
        <div className="bw-card p-5 space-y-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-sm font-extrabold">Amortization &amp; Fixed-Rate Reset Retention Schedules (Step 12 Care)</h2>
              <p className="text-[11px] text-[var(--bw-muted)]">Track client 2Y/3Y/5Y fixed expiry dates and trigger proactive 90-day buyout refinancing proposals before EIBOR reversion.</p>
            </div>
            <Link href="/os/calculators" className="bw-btn bw-btn-obsidian text-xs py-1.5 min-h-[34px]">Run Buyout Break-Even →</Link>
          </div>
          <div className="p-4 rounded-xl bg-[var(--bw-soft)] border border-[var(--bw-line)]">
            Active Step 12 Client Care monitoring automatically flags borrowers 90 days prior to fixed-period rollover for zero-broker-fee refinancing review.
          </div>
        </div>
      )}

      {/* 10 MANAGER CHEQUES (MC) */}
      {subTab === 'cheques' && (
        <div className="bw-card p-5 space-y-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-sm font-extrabold">Bank Manager Cheques &amp; DLD Disbursement Cheque Vault</h2>
              <p className="text-[11px] text-[var(--bw-muted)]">Track seller liability settlement cheques, balance purchase Manager Cheques, DLD fee cheques, and clearance proofs.</p>
            </div>
            {user?.isOwner && (
              <Link href="/os/place?tab=closings" className="bw-btn bw-btn-obsidian text-xs py-1.5 min-h-[34px]">Open 5-Track Cheque Ledger →</Link>
            )}
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {['Seller Bank Liability Settlement MC', 'Seller Balance Equity MC', 'DLD Transfer & Mortgage Reg Fee MC'].map((mc) => (
              <div key={mc} className="p-3.5 rounded-xl bg-[var(--bw-soft)] border border-[var(--bw-line)] font-bold">{mc}</div>
            ))}
          </div>
        </div>
      )}

      {/* 11 RERA PARTNER REFERRAL HUB */}
      {subTab === 'partners' && (
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
            <button type="submit" className="bw-btn bw-btn-obsidian w-full text-xs">Lock Referral Attribution</button>
          </form>

          <div className="lg:col-span-7 bw-card p-5 space-y-3 text-xs">
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
        </div>
      )}

      {/* 12 WITHDRAWALS, REFUNDS & VALUE-ADD */}
      {subTab === 'refunds' && (
        <div className="space-y-4 text-xs">
          <div className="bw-card p-5 space-y-3">
            <h3 className="font-display text-sm font-extrabold">Facility Withdrawals, Cancellations &amp; Bank Valuation Fee Refunds</h3>
            <p className="text-[11px] text-[var(--bw-muted)]">Log withdrawn pre-approvals, cancelled valuations, or processing fee reversals with full CBUAE audit trail.</p>
            <div className="p-4 rounded-xl bg-[var(--bw-soft)] border border-[var(--bw-line)] text-[var(--bw-muted)]">
              Zero open fee refund disputes. All Betterway advisory mandates operate at AED 0 upfront client brokerage fee.
            </div>
          </div>

          <div className="bw-card p-5 space-y-3">
            <h3 className="font-display text-sm font-extrabold flex items-center gap-1.5">
              <Award size={14} className="text-[#d9b356]" /> Post-Mortgage Value-Add Desk
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
      )}
    </div>
  );
}
