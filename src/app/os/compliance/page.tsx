'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Download, ShieldAlert, ShieldCheck, Trash2, Upload } from 'lucide-react';
import { PageHeader, StatusPill } from '@/components/os/UiKit';

interface CompliancePayload {
  checks: Array<Record<string, unknown>>;
  sanctions: Array<Record<string, unknown>>;
  deleteBin: Array<Record<string, unknown>>;
  audits: Array<Record<string, unknown>>;
}

export default function CompliancePage() {
  const [data, setData] = useState<CompliancePayload | null>(null);
  const [tab, setTab] = useState<'screening' | 'delete_bin' | 'audit'>('screening');
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
    load();
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
    setNotice(`Screening completed: ${j.check.subject_name} → ${j.check.status}`);
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
    <div className="space-y-6">
      <PageHeader
        eyebrow="CBUAE · UAE FIU goAML · PDPL · 2-of-2 Owner Delete Bin"
        title="Compliance &"
        accent="Audit Shield"
        subtitle="Screen borrowers against UAE EOCN & UN sanctions lists, generate goAML STR XML filings, inspect immutable PDPL audit trails, and manage 2-of-2 Owner permanent deletion requests."
      />

      {error && (
        <div className="rounded-xl border border-red-400/40 bg-red-50 dark:bg-red-950/30 p-3 text-xs font-semibold text-red-700 dark:text-red-300">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-xl border border-emerald-500/35 bg-emerald-50 dark:bg-emerald-950/30 p-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 size={14} /> {notice}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['screening', `AML/KYC Screening & goAML (${data?.checks.length ?? 0})`, ShieldCheck],
            ['delete_bin', `2-of-2 Owner Delete Bin (${data?.deleteBin.length ?? 0})`, Trash2],
            ['audit', `Immutable PDPL Audit Log (${data?.audits.length ?? 0})`, ShieldAlert],
          ] as const
        ).map(([k, label, Icon]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition ${
              tab === k ? 'bg-[#083B2E] text-white border-[#083B2E]' : 'bg-[var(--bw-card)] border-[var(--bw-line)]'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === 'screening' && (
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="space-y-4">
            <form onSubmit={runScreening} className="rounded-2xl bg-[var(--bw-card)] border border-[var(--bw-line)] p-5 space-y-3">
              <h2 className="text-sm font-extrabold">Run Sanctions / CBUAE KFS Check</h2>
              <input
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="Borrower or Entity Full Name"
                className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 text-xs"
                required
              />
              <select
                value={checkType}
                onChange={(e) => setCheckType(e.target.value)}
                className="w-full rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] px-3 py-2 text-xs"
              >
                <option value="SANCTIONS_SCREEN">UAE EOCN / UN Sanctions Screen</option>
                <option value="CBUAE_KFS">CBUAE Key Facts Statement (KFS) Audit</option>
                <option value="PEP_REVIEW">Politically Exposed Person (PEP) Review</option>
              </select>
              <button className="w-full rounded-xl bg-[#083B2E] text-white py-2.5 text-xs font-bold">
                Run Compliance Check
              </button>
            </form>

            <form onSubmit={importWatchlist} className="rounded-2xl bg-[var(--bw-card)] border border-[var(--bw-line)] p-5 space-y-3">
              <h2 className="text-sm font-extrabold flex items-center gap-1.5">
                <Upload size={14} className="text-[var(--bw-emerald)]" /> Import UAE EOCN / UN Watchlist
              </h2>
              <textarea
                rows={4}
                value={rawWatchlist}
                onChange={(e) => setRawWatchlist(e.target.value)}
                placeholder="Paste one full name or entity per line..."
                className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent p-3 text-xs"
                required
              />
              <button className="w-full rounded-xl bg-[#0A1128] text-[#FCF1B7] py-2 text-xs font-bold">
                Import Watchlist ({data?.sanctions.length ?? 0} Loaded)
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 rounded-2xl bg-[var(--bw-card)] border border-[var(--bw-line)] p-5 overflow-x-auto">
            <h3 className="text-sm font-extrabold mb-3">Screening Results &amp; goAML XML Export</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[var(--bw-muted)] border-b border-[var(--bw-line)]">
                  <th className="py-2 pr-3">Subject</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Evidence</th>
                  <th className="py-2">goAML</th>
                </tr>
              </thead>
              <tbody>
                {(data?.checks ?? []).map((c) => (
                  <tr key={String(c.id)} className="border-b border-[var(--bw-line)]/60">
                    <td className="py-2.5 pr-3 font-semibold">{String(c.subject_name)}</td>
                    <td className="py-2.5 pr-3 font-mono text-[11px]">{String(c.check_type)}</td>
                    <td className="py-2.5 pr-3">
                      <StatusPill label={String(c.status)} tone={String(c.status) === 'Flagged' ? 'red' : 'emerald'} />
                    </td>
                    <td className="py-2.5 pr-3 text-[var(--bw-muted)]">{String(c.evidence_note)}</td>
                    <td className="py-2.5">
                      <a
                        href={`/api/v1/compliance?goamlId=${String(c.id)}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--bw-emerald)] hover:underline"
                      >
                        <Download size={12} /> XML
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'delete_bin' && (
        <div className="grid lg:grid-cols-3 gap-5">
          <form onSubmit={submitDeletePurge} className="rounded-2xl bg-[var(--bw-card)] border border-[var(--bw-line)] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold">Request Permanent Delete Purge</h2>
              <StatusPill label="2-of-2 Owners" tone="red" />
            </div>
            <p className="text-[11px] text-[var(--bw-muted)]">
              Zero staff can permanently delete records. Every purge requires independent cryptographic sign-off from BOTH Warda Kapadia AND Shabib Siraj.
            </p>
            <select
              value={delTable}
              onChange={(e) => setDelTable(e.target.value)}
              className="w-full rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] px-3 py-2 text-xs"
            >
              <option value="leads">leads</option>
              <option value="mortgage_cases">mortgage_cases</option>
              <option value="client_documents">client_documents</option>
              <option value="contacts">contacts</option>
            </select>
            <input
              value={delId}
              onChange={(e) => setDelId(e.target.value)}
              placeholder="Record ID / UUID"
              className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 text-xs font-mono"
              required
            />
            <input
              value={delLabel}
              onChange={(e) => setDelLabel(e.target.value)}
              placeholder="Record Label (e.g. Duplicate Lead BW-LD-992)"
              className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 text-xs"
              required
            />
            <textarea
              rows={3}
              value={delReason}
              onChange={(e) => setDelReason(e.target.value)}
              placeholder="Compliance justification for permanent erasure..."
              className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent p-3 text-xs"
              required
            />
            <button className="w-full rounded-xl bg-red-700 text-white py-2.5 text-xs font-bold">
              Submit to 2-of-2 Owner Delete Bin
            </button>
          </form>

          <div className="lg:col-span-2 rounded-2xl bg-[var(--bw-card)] border border-[var(--bw-line)] p-5 overflow-x-auto">
            <h3 className="text-sm font-extrabold mb-3">Delete Bin Queue</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[var(--bw-muted)] border-b border-[var(--bw-line)]">
                  <th className="py-2 pr-3">Table</th>
                  <th className="py-2 pr-3">Record</th>
                  <th className="py-2 pr-3">Reason</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {(data?.deleteBin ?? []).map((d) => (
                  <tr key={String(d.id)} className="border-b border-[var(--bw-line)]/60">
                    <td className="py-2 pr-3 font-mono">{String(d.entity_table)}</td>
                    <td className="py-2 pr-3 font-semibold">{String(d.record_label)}</td>
                    <td className="py-2 pr-3 text-[var(--bw-muted)]">{String(d.reason)}</td>
                    <td className="py-2">
                      <StatusPill label={String(d.status)} tone={String(d.status) === 'APPROVED' ? 'red' : 'gold'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="rounded-2xl bg-[var(--bw-card)] border border-[var(--bw-line)] p-5 overflow-x-auto">
          <h3 className="text-sm font-extrabold mb-3">Immutable PDPL &amp; Security Audit Trail</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[var(--bw-muted)] border-b border-[var(--bw-line)]">
                <th className="py-2 pr-3">Timestamp</th>
                <th className="py-2 pr-3">Actor</th>
                <th className="py-2 pr-3">Action</th>
                <th className="py-2 pr-3">Entity</th>
                <th className="py-2">Details</th>
              </tr>
            </thead>
            <tbody>
              {(data?.audits ?? []).map((a) => (
                <tr key={String(a.id)} className="border-b border-[var(--bw-line)]/60">
                  <td className="py-2 pr-3 font-mono text-[11px]">{String(a.created_at).slice(0, 19).replace('T', ' ')}</td>
                  <td className="py-2 pr-3 font-semibold">{String(a.actor_role || a.actor_id || 'SYSTEM')}</td>
                  <td className="py-2 pr-3 font-mono text-[var(--bw-emerald)]">{String(a.action)}</td>
                  <td className="py-2 pr-3">{String(a.entity_type)}</td>
                  <td className="py-2 text-[var(--bw-muted)] truncate max-w-md">{JSON.stringify(a.details || {})}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
