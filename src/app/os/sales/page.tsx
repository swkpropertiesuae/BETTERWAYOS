'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Handshake, Printer, Sparkles } from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { fmtAed, PageHeader, StatusPill } from '@/components/os/UiKit';

export default function SalesAndServicesPage() {
  const { toast } = useOs();
  const [data, setData] = useState<{ brokers: any[]; cases: any[]; referrals: any[] }>({
    brokers: [],
    cases: [],
    referrals: [],
  });
  const [refForm, setRefForm] = useState({
    contactName: '',
    contactPhone: '+971 50 ',
    partnerAgency: 'SWK Properties LLC',
    partnerBrn: 'BRN-SWK-01',
    community: 'Dubai Creek Harbour',
    propertyPriceAed: 2_800_000,
  });

  const load = useCallback(async () => {
    const r = await fetch('/api/v1/sales');
    if (r.ok) setData(await r.json());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const registerReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await fetch('/api/v1/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(refForm),
    });
    if (r.ok) {
      toast('RERA Partner Referral attribution locked into Step 01 CRM!');
      setRefForm({ ...refForm, contactName: '' });
      await load();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sales, Quotes, Cross-Sell & RERA Partner Referral Hub"
        title="Sales &"
        accent="Services"
        subtitle="Lock RERA broker referral attributions (including internal SWK Properties partner relay), print branded bank comparison quotes, and track Takaful / Wills / Golden Visa cross-sell."
      />

      <div className="grid lg:grid-cols-12 gap-6">
        <form onSubmit={registerReferral} className="lg:col-span-5 bw-card p-5 space-y-3 text-xs">
          <h3 className="text-sm font-extrabold flex items-center gap-1.5">
            <Handshake size={15} className="text-[#007b52]" /> 60-Second RERA Broker Referral Lock
          </h3>
          <input required value={refForm.contactName} onChange={(e) => setRefForm({ ...refForm, contactName: e.target.value })} placeholder="Referred Buyer Name *" className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
          <input required value={refForm.contactPhone} onChange={(e) => setRefForm({ ...refForm, contactPhone: e.target.value })} placeholder="Buyer Phone *" className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
          <div className="grid grid-cols-2 gap-2">
            <input value={refForm.partnerAgency} onChange={(e) => setRefForm({ ...refForm, partnerAgency: e.target.value })} placeholder="Partner Agency" className="h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
            <input value={refForm.partnerBrn} onChange={(e) => setRefForm({ ...refForm, partnerBrn: e.target.value })} placeholder="RERA BRN" className="h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input value={refForm.community} onChange={(e) => setRefForm({ ...refForm, community: e.target.value })} placeholder="Community" className="h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
            <input type="number" value={refForm.propertyPriceAed} onChange={(e) => setRefForm({ ...refForm, propertyPriceAed: Number(e.target.value) })} className="h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] font-mono-num" />
          </div>
          <button type="submit" className="w-full h-10 rounded-full bg-[#025e3d] text-[#FCF1B7] font-bold cursor-pointer">
            Lock Referral Attribution
          </button>
        </form>

        <div className="lg:col-span-7 space-y-4">
          <div className="bw-card p-5 space-y-3 text-xs">
            <h3 className="text-sm font-extrabold">Registered RERA Broker Partners ({data.brokers.length})</h3>
            {data.brokers.map((b) => (
              <div key={b.id} className="p-3 rounded-xl border border-[var(--bw-line)] flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-bold">{b.agency_name} · {b.broker_name}</div>
                  <div className="text-[var(--bw-muted)]">ORN {b.orn_number} · BRN {b.brn_number} · Split {b.commission_split_pct}%</div>
                </div>
                <StatusPill label={b.corporate_bank_verified ? 'Corporate IBAN Verified' : 'Needs Bank Letter'} tone={b.corporate_bank_verified ? 'emerald' : 'gold'} />
              </div>
            ))}
          </div>

          <div className="bw-card p-5 space-y-3 text-xs">
            <h3 className="text-sm font-extrabold flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#D4AF37]" /> Cross-Sell Desk &amp; Branded Quote Print
            </h3>
            <div className="grid sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl bg-[var(--bw-bg)] border border-[var(--bw-line)]">
                <div className="font-bold">Life &amp; Property Takaful</div>
                <div className="text-[11px] text-[var(--bw-muted)] mt-0.5">External assignment savings vs bank bundled policy</div>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bw-bg)] border border-[var(--bw-line)]">
                <div className="font-bold">UAE Golden Visa (AED 2M)</div>
                <div className="text-[11px] text-[var(--bw-muted)] mt-0.5">Bank NOC + DLD 10-year residency coordination</div>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bw-bg)] border border-[var(--bw-line)]">
                <div className="font-bold">DIFC / Abu Dhabi Wills</div>
                <div className="text-[11px] text-[var(--bw-muted)] mt-0.5">Asset protection upon DLD Title Deed issuance</div>
              </div>
            </div>
            <button type="button" onClick={() => window.print()} className="px-4 py-2 rounded-full border border-[var(--bw-line)] font-bold inline-flex items-center gap-1.5 cursor-pointer">
              <Printer size={13} /> Print Sales &amp; Cross-Sell Sheet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
