'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  Download,
  Gavel,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';
import { PageHeader, StatusPill } from '@/components/os/UiKit';
import { SubFeatureTabs, type SubFeatureItem } from '@/components/os/SubFeatureTabs';
import { OFFICIAL_ROSTER } from '@/lib/domain/staff';

type ComplianceSubTab = 'kyc' | 'regulatory' | 'aml' | 'licences' | 'cards' | 'risk';

const COMPLIANCE_SUB_TABS: ReadonlyArray<SubFeatureItem<ComplianceSubTab>> = [
  { id: 'kyc', num: '01', label: 'KYC Checks', icon: ShieldCheck },
  { id: 'regulatory', num: '02', label: 'CBUAE & RERA Centre', icon: Gavel },
  { id: 'aml', num: '03', label: 'AML & goAML Reports', icon: ShieldAlert },
  { id: 'licences', num: '04', label: 'Trade Licences', icon: BadgeCheck },
  { id: 'cards', num: '05', label: 'Advisor & Partner Cards', icon: CreditCard },
  { id: 'risk', num: '06', label: 'Risk Cases & Delete Bin', icon: Trash2 },
];

interface CompliancePayload {
  checks: Array<Record<string, unknown>>;
  sanctions: Array<Record<string, unknown>>;
  deleteBin: Array<Record<string, unknown>>;
  audits: Array<Record<string, unknown>>;
}

export default function CompliancePage() {
  const [data, setData] = useState<CompliancePayload | null>(null);
  const [tab, setTab] = useState<ComplianceSubTab>('kyc');
  const [subjectName, setSubjectName] = useState('');
  const [checkType, setCheckType] = useState('SANCTIONS_SCREEN');
  const [rawWatchlist, setRawWatchlist] = useState('');
  const [delTable, setDelTable] = useState('leads');
  const [delId, setDelId] = useState('');
  const [delLabel, setDelLabel] = useState('');
  const [delReason, setDelReason] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const r = await fetch('/api/v1/compliance', { cache: 'no-store' });
    if (r.ok) setData(await r.json());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function runScreening(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setNotice('');
    const r = await fetch('/api/v1/compliance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subjectName, checkType }),
    });
    const j = await r.json();
    if (!r.ok) return setError(j.error || 'Screening failed');
    setSubjectName('');
    setNotice(`Compliance check completed: ${j.check.subject_name} → ${j.check.status}`);
    await load();
  }

  async function importWatchlist(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setNotice('');
    const r = await fetch('/api/v1/compliance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'sanctions_import', source: 'UAE EOCN / UN Consolidated', rawNames: rawWatchlist }),
    });
    const j = await r.json();
    if (!r.ok) return setError(j.error || 'Import failed');
    setRawWatchlist('');
    setNotice(`Imported ${j.imported} UAE EOCN / UN watchlist entries.`);
    await load();
  }

  async function submitDeletePurge(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setNotice('');
    const r = await fetch('/api/v1/compliance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'delete_bin',
        entityTable: delTable,
        entityId: delId,
        recordLabel: delLabel,
        reason: delReason,
      }),
    });
    const j = await r.json();
    if (!r.ok) return setError(j.error || 'Delete purge request failed');
    setDelId('');
    setDelLabel('');
    setDelReason('');
    setNotice('Permanent Delete Purge queued — requires 2-of-2 Owner sign-off (Warda Kapadia + Shabib Siraj).');
    await load();
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="CBUAE · UAE FIU goAML · PDPL · DED Licences · 2-of-2 Owner Delete Bin"
        title="Compliance &"
        accent="Audit Shield"
        subtitle="Full 6-module UAE mortgage governance center: KYC Checks, CBUAE & RERA Partner Centre, AML/goAML XML filings, Trade Licences, Advisor/Partner Cards & Risk Cases / Delete Bin."
      />

      <SubFeatureTabs sectionTitle="Compliance" items={COMPLIANCE_SUB_TABS} activeId={tab} onSelect={setTab} />

      {error && <div className="rounded-xl border border-red-400/40 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</div>}
      {notice && (
        <div className="rounded-xl border border-emerald-500/35 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 size={14} /> {notice}
        </div>
      )}

      {/* 01 KYC CHECKS */}
      {tab === 'kyc' && (
        <div className="grid lg:grid-cols-3 gap-5">
          <form onSubmit={runScreening} className="bw-card p-5 space-y-3">
            <h2 className="text-sm font-extrabold">Run Borrower KYC / CBUAE KFS Verification</h2>
            <input value={subjectName} onChange={(e) => setSubjectName(e.target.value)} placeholder="Borrower or Entity Full Name" className="w-full rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] px-3 py-2 text-xs" required />
            <select value={checkType} onChange={(e) => setCheckType(e.target.value)} className="w-full rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] px-3 py-2 text-xs">
              <option value="KFS_SIGN">CBUAE Key Facts Statement (KFS) Audit</option>
              <option value="PDPL_CONSENT">UAE PDPL Consent &amp; Emirates ID KYC</option>
              <option value="SANCTIONS_SCREEN">UAE EOCN / UN Sanctions Screen</option>
              <option value="GOAML_STR">UAE FIU goAML STR Review</option>
            </select>
            <button className="bw-btn bw-btn-obsidian w-full text-xs">Run KYC Verification</button>
          </form>

          <div className="lg:col-span-2 bw-card p-5 overflow-x-auto">
            <h3 className="text-sm font-extrabold mb-3">KYC &amp; Compliance Checks Register ({data?.checks.length ?? 0})</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[var(--bw-muted)] border-b border-[var(--bw-line)]">
                  <th className="py-2 pr-3">Subject</th>
                  <th className="py-2 pr-3">Check Type</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2">Evidence</th>
                </tr>
              </thead>
              <tbody>
                {(data?.checks ?? []).map((c) => (
                  <tr key={String(c.id)} className="border-b border-[var(--bw-line)]/60">
                    <td className="py-2.5 pr-3 font-semibold">{String(c.subject_name)}</td>
                    <td className="py-2.5 pr-3 font-mono text-[11px]">{String(c.check_type)}</td>
                    <td className="py-2.5 pr-3"><StatusPill label={String(c.status)} tone={String(c.status) === 'Flagged' ? 'red' : 'emerald'} /></td>
                    <td className="py-2.5 text-[var(--bw-muted)]">{String(c.evidence_note)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 02 CBUAE & RERA CENTRE */}
      {tab === 'regulatory' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {[
            { title: 'CBUAE LTV Cap Enforcement', body: '80% Expat (≤5M) / 70% (>5M) · 85% UAE National (≤5M) / 75% (>5M) · 60% Non-Resident · 50% Off-Plan.', badge: 'Active' },
            { title: 'CBUAE 50% DBR & Stress Test', body: 'Total monthly liabilities including 5% of all credit card limits stressed at +2% above base rate capped strictly at 50%.', badge: 'Enforced' },
            { title: 'Joint Key Facts Statement (KFS)', body: 'Mandatory borrower signature disclosing fixed rate, revert margin, processing, valuation & early exit cap (1% max AED 10k).', badge: 'Required' },
            { title: 'UAE Federal PDPL (Law 45/2021)', body: 'Phone numbers masked across CRM; every unmask and outbound contact logged in immutable compliance audit table.', badge: 'Audited' },
            { title: 'Corporate-IBAN-Only Partner Payouts', body: 'All referring RERA brokerages require verified ORN, valid DED licence, corporate bank letter & 2-of-2 Owner sign-off.', badge: 'Locked' },
            { title: 'Zero Client Broker Fee Governance', body: 'Direct bank DSA compensation model with transparent FTA 5% VAT invoicing and PINT-AE XML readiness.', badge: 'Verified' },
          ].map((rule) => (
            <div key={rule.title} className="bw-card p-5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-display font-extrabold text-sm">{rule.title}</span>
                <StatusPill label={rule.badge} tone="emerald" />
              </div>
              <p className="text-[11px] text-[var(--bw-muted)] leading-relaxed">{rule.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* 03 AML & goAML REPORTS */}
      {tab === 'aml' && (
        <div className="grid lg:grid-cols-3 gap-5">
          <form onSubmit={importWatchlist} className="bw-card p-5 space-y-3">
            <h2 className="text-sm font-extrabold flex items-center gap-1.5">
              <Upload size={14} className="text-[#119c78]" /> Import UAE EOCN / UN Watchlist
            </h2>
            <textarea rows={5} value={rawWatchlist} onChange={(e) => setRawWatchlist(e.target.value)} placeholder="Paste one full name or entity per line..." className="w-full rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] p-3 text-xs" required />
            <button className="bw-btn bw-btn-obsidian w-full text-xs">Import Watchlist ({data?.sanctions.length ?? 0} Loaded)</button>
          </form>

          <div className="lg:col-span-2 bw-card p-5 overflow-x-auto">
            <h3 className="text-sm font-extrabold mb-3">AML Screenings &amp; UAE FIU goAML XML Export</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[var(--bw-muted)] border-b border-[var(--bw-line)]">
                  <th className="py-2 pr-3">Subject</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2">goAML XML</th>
                </tr>
              </thead>
              <tbody>
                {(data?.checks ?? []).map((c) => (
                  <tr key={String(c.id)} className="border-b border-[var(--bw-line)]/60">
                    <td className="py-2.5 pr-3 font-semibold">{String(c.subject_name)}</td>
                    <td className="py-2.5 pr-3 font-mono text-[11px]">{String(c.check_type)}</td>
                    <td className="py-2.5 pr-3"><StatusPill label={String(c.status)} tone={String(c.status) === 'Flagged' ? 'red' : 'emerald'} /></td>
                    <td className="py-2.5">
                      <a href={`/api/v1/compliance?goamlId=${String(c.id)}`} className="inline-flex items-center gap-1 text-[11px] font-bold text-[#119c78] hover:underline">
                        <Download size={12} /> Download XML
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 04 TRADE LICENCES */}
      {tab === 'licences' && (
        <div className="bw-card p-5 space-y-4 text-xs">
          <h2 className="font-display text-sm font-extrabold">Betterway Mortgages LLC — Corporate Licences &amp; Bank Panel Approvals</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { name: 'Dubai DET / DED Commercial Licence', ref: 'Betterway Mortgages LLC · Oud Metha', expiry: 'Active · Valid 2026–2027', tone: 'emerald' },
              { name: 'UAE FTA VAT Registration (TRN)', ref: '5% Standard Rated · PINT-AE Ready', expiry: 'Quarterly VAT 201 Active', tone: 'emerald' },
              { name: '18-Bank UAE Mortgage DSA Agreements', ref: 'ENBD, FAB, DIB, ADCB, ADIB, CBD, Mashreq + 11', expiry: 'Panel Active 2026', tone: 'gold' },
              { name: 'Corporate Receiving Bank Accounts', ref: 'Wio Business & UAE Corporate IBAN Whitelist', expiry: 'Verified Corporate Only', tone: 'navy' },
            ].map((lic) => (
              <div key={lic.name} className="p-4 rounded-2xl border border-[var(--bw-line)] bg-[var(--bw-soft)]/50 space-y-1.5">
                <div className="font-extrabold text-sm">{lic.name}</div>
                <div className="text-[11px] text-[var(--bw-muted)]">{lic.ref}</div>
                <StatusPill label={lic.expiry} tone={lic.tone as any} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 05 ADVISOR & PARTNER CARDS */}
      {tab === 'cards' && (
        <div className="bw-card p-5 space-y-4 text-xs">
          <h2 className="font-display text-sm font-extrabold">Betterway Certified Mortgage Advisors &amp; Authorized Staff Cards</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {OFFICIAL_ROSTER.filter((m) => m.id !== 'USR-00').map((m) => (
              <div key={m.id} className="p-4 rounded-2xl border border-[var(--bw-line)] bg-[var(--bw-soft)]/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#119c78]">{m.empCode}</span>
                  <StatusPill label="Verified" tone="emerald" />
                </div>
                <div className="font-extrabold text-sm">{m.name}</div>
                <div className="text-[11px] text-[var(--bw-muted)]">{m.designation}</div>
                <div className="text-[10.5px] text-[var(--bw-muted)]">{m.department}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 06 RISK CASES, AUDIT LOG & 2-OF-2 DELETE BIN */}
      {tab === 'risk' && (
        <div className="space-y-5">
          <div className="grid lg:grid-cols-3 gap-5">
            <form onSubmit={submitDeletePurge} className="bw-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold">Request Permanent Delete Purge</h2>
                <StatusPill label="2-of-2 Owners" tone="red" />
              </div>
              <p className="text-[11px] text-[var(--bw-muted)]">Every permanent deletion requires independent sign-off from BOTH Warda Kapadia AND Shabib Siraj.</p>
              <select value={delTable} onChange={(e) => setDelTable(e.target.value)} className="w-full rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] px-3 py-2 text-xs">
                <option value="leads">leads</option>
                <option value="mortgage_cases">mortgage_cases</option>
                <option value="case_documents">case_documents</option>
                <option value="contacts">contacts</option>
              </select>
              <input value={delId} onChange={(e) => setDelId(e.target.value)} placeholder="Record ID / UUID" className="w-full rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] px-3 py-2 text-xs font-mono" required />
              <input value={delLabel} onChange={(e) => setDelLabel(e.target.value)} placeholder="Record Label" className="w-full rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] px-3 py-2 text-xs" required />
              <textarea rows={2} value={delReason} onChange={(e) => setDelReason(e.target.value)} placeholder="Compliance justification..." className="w-full rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] p-2.5 text-xs" required />
              <button className="w-full rounded-full bg-red-700 text-white py-2.5 text-xs font-bold cursor-pointer">Submit to 2-of-2 Owner Delete Bin</button>
            </form>

            <div className="lg:col-span-2 bw-card p-5 overflow-x-auto">
              <h3 className="text-sm font-extrabold mb-3">Delete Bin Queue ({data?.deleteBin.length ?? 0}) &amp; Immutable PDPL Audit ({data?.audits.length ?? 0})</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-[var(--bw-muted)] border-b border-[var(--bw-line)]">
                    <th className="py-2 pr-3">Timestamp</th>
                    <th className="py-2 pr-3">Actor</th>
                    <th className="py-2 pr-3">Action</th>
                    <th className="py-2">Entity</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.audits ?? []).slice(0, 15).map((a) => (
                    <tr key={String(a.id)} className="border-b border-[var(--bw-line)]/60">
                      <td className="py-2 pr-3 font-mono text-[11px]">{String(a.created_at).slice(0, 19).replace('T', ' ')}</td>
                      <td className="py-2 pr-3 font-semibold">{String(a.actor_role || a.actor_id || 'SYSTEM')}</td>
                      <td className="py-2 pr-3 font-mono text-[#119c78]">{String(a.action)}</td>
                      <td className="py-2 font-mono">{String(a.entity_table)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
