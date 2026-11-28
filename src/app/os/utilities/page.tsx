'use client';

import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  DatabaseBackup,
  Download,
  FileSpreadsheet,
  FileText,
  Languages,
  RefreshCw,
  ScanText,
  Search,
  Smartphone,
} from 'lucide-react';
import { EXCEL_SPECS } from '@/lib/domain/excel-specs';
import { useOs } from '@/components/os/OsProvider';
import { GlossyBlackCard, MetricTile, PageHeader, StatusPill } from '@/components/os/UiKit';
import { LegalFormsStudioTab } from '@/components/workspace/LegalFormsStudioTab';

export default function UtilitiesPage() {
  const { toast } = useOs();
  const [tab, setTab] = useState<'backup' | 'word' | 'excel' | 'translate' | 'ocr' | 'search'>('backup');

  // Daily Backup state
  const [backupInfo, setBackupInfo] = useState<any>(null);
  const [runningBackup, setRunningBackup] = useState(false);
  const [lastRun, setLastRun] = useState<any>(null);

  // Translator
  const [targetLang, setTargetLang] = useState('ar');
  const [sourceText, setSourceText] = useState(
    'Your Pre-Approval is valid for 60 days. Prepare your Down Payment, Valuation fee, and Title Deed for DLD Trustee transfer with Zero Broker Fee.',
  );
  const [translated, setTranslated] = useState('');

  // OCR
  const [rawOcr, setRawOcr] = useState('Emirates ID: 784-1988-4455667-1 | Monthly Salary: AED 38,500 | Visa Expiry: 2028-06-15');
  const [ocrResult, setOcrResult] = useState<Record<string, unknown> | null>(null);

  // Global Search
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<Array<Record<string, unknown>>>([]);
  const [excelFilter, setExcelFilter] = useState('');

  const loadBackupStatus = async () => {
    try {
      const r = await fetch('/api/v1/utilities/daily-backup', { cache: 'no-store' });
      if (r.ok) setBackupInfo(await r.json());
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    void loadBackupStatus();
  }, []);

  const triggerBackupNow = async () => {
    setRunningBackup(true);
    try {
      const r = await fetch('/api/v1/utilities/daily-backup', { method: 'POST' });
      const out = await r.json();
      if (!r.ok) {
        toast(out.error || 'Backup failed', 'err');
        return;
      }
      setLastRun(out);
      toast(`Full 17-Sheet Daily Backup saved (${out.totalRows} live rows)!`);
      await loadBackupStatus();
    } finally {
      setRunningBackup(false);
    }
  };

  async function runTranslate() {
    const r = await fetch('/api/v1/utilities/word-studio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'translate', targetLang, text: sourceText }),
    });
    const j = await r.json();
    if (r.ok) setTranslated(j.translated);
  }

  async function runOcr() {
    const r = await fetch('/api/v1/utilities/word-studio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'ocr', rawOcrText: rawOcr }),
    });
    const j = await r.json();
    if (r.ok) setOcrResult(j.extracted);
  }

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch(`/api/v1/utilities/search?q=${encodeURIComponent(searchQ)}`, { cache: 'no-store' });
    const j = await r.json();
    if (r.ok) setSearchResults(j.results ?? []);
  }

  const filteredExcel = EXCEL_SPECS.filter(
    (s) =>
      !excelFilter.trim() ||
      s.filename.toLowerCase().includes(excelFilter.toLowerCase()) ||
      s.owner.toLowerCase().includes(excelFilter.toLowerCase()) ||
      s.fileType.toLowerCase().includes(excelFilter.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="17-Sheet All-Data Master Excel · Automated Daily Backup · Word/JPEG Forms · 50 Excel Hub"
        title="Excel, Daily Backups &"
        accent="Document Studio"
        subtitle="Download 100% of Betterway OS live data into one 17-sheet Master Excel workbook, run or schedule automatic 00:00 Dubai GST daily backups, fill Word/JPEG UAE mortgage forms, translate across 9 languages, and run PII-safe OCR."
      />

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['backup', 'All-Data Excel & Daily Backup', DatabaseBackup],
            ['word', 'Mortgage Forms (Word / JPEG)', FileText],
            ['excel', `50-Spec Excel Hub (${EXCEL_SPECS.length})`, FileSpreadsheet],
            ['translate', '9-Language Translator', Languages],
            ['ocr', 'PII-Safe OCR', ScanText],
            ['search', 'Global Search', Search],
          ] as const
        ).map(([k, label, Icon]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-extrabold border transition cursor-pointer ${
              tab === k
                ? 'bg-[#0a0e14] text-[#34f0bc] border-[#22e2ad]/60 shadow-lg'
                : 'bg-[var(--bw-card)] border-[var(--bw-line)] text-[var(--bw-body)] hover:border-[#119c78]'
            }`}
          >
            <Icon size={14} className={tab === k ? 'text-[#fbe8a4]' : 'text-[#119c78]'} /> {label}
          </button>
        ))}
      </div>

      {tab === 'backup' && (
        <div className="space-y-5">
          <GlossyBlackCard className="p-6 sm:p-7 space-y-5" accent="dual">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#34f0bc]">
                  <DatabaseBackup size={14} className="text-[#fbe8a4]" /> Complete Master Excel + Automated 00:00 GST Daily Backup
                </div>
                <h2 className="font-display text-2xl font-extrabold text-white">
                  100% of Your OS Data in One Excel Workbook
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Exports all 17 live sheets in 1 click: Staff, Leads CRM, 12-Step Cases, Bank Submissions, Valuations, GPS Field Meetings, 5-Track Disbursals, Manager Cheques, Advisor DSA &amp; Expenses, Daily Tasks, Invoices &amp; VAT, RERA Partners, Bank APL Catalog, 18-Bank Rates, 140+ Direct Bank RMs, and Compliance Audit.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <a href="/api/v1/utilities/master-backup-excel" className="bw-btn bw-btn-primary text-xs">
                  <Download size={14} /> Download 17-Sheet Master Excel (.xlsx)
                </a>
                <a href="/api/v1/utilities/bank-matrix-excel" className="bw-btn bw-btn-obsidian text-xs border-[#22e2ad]/45">
                  <FileSpreadsheet size={14} className="text-[#34f0bc]" /> Recreated 2026 Bank Matrix (.xlsx)
                </a>
                <button
                  type="button"
                  disabled={runningBackup}
                  onClick={() => void triggerBackupNow()}
                  className="bw-btn bw-btn-gold text-xs"
                >
                  <RefreshCw size={14} className={runningBackup ? 'animate-spin' : ''} />{' '}
                  {runningBackup ? 'Saving Backup…' : 'Run Daily Backup Now'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/10">
                <div className="text-[10.5px] font-bold uppercase text-slate-400">Workbook Coverage</div>
                <div className="font-display text-2xl font-extrabold text-white mt-0.5">17 Sheets</div>
                <div className="text-[11px] text-[#34f0bc]">All Supabase tables + 140+ RMs</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/10">
                <div className="text-[10.5px] font-bold uppercase text-slate-400">Automatic Schedule</div>
                <div className="font-display text-2xl font-extrabold text-[#fbe8a4] mt-0.5">00:00 GST</div>
                <div className="text-[11px] text-slate-300">Vercel Cron + GitHub Actions 90d</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/10">
                <div className="text-[10.5px] font-bold uppercase text-slate-400">Saved Snapshots</div>
                <div className="font-display text-2xl font-extrabold text-[#34f0bc] mt-0.5">
                  {(backupInfo?.localFiles?.length ?? 0) + (backupInfo?.history?.length ?? 0)}
                </div>
                <div className="text-[11px] text-slate-300">Local + Supabase Storage</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/10">
                <div className="text-[10.5px] font-bold uppercase text-slate-400">Mobile App Sync</div>
                <div className="font-display text-2xl font-extrabold text-white mt-0.5 flex items-center gap-1.5">
                  <Smartphone size={18} className="text-[#34f0bc]" /> iOS &amp; Android
                </div>
                <div className="text-[11px] text-slate-300">Capacitor 7 + PWA Ready</div>
              </div>
            </div>

            {lastRun && (
              <div className="p-4 rounded-2xl bg-[#22e2ad]/12 border border-[#22e2ad]/40 text-xs flex flex-wrap items-center justify-between gap-2 text-[#e6fff7]">
                <span className="inline-flex items-center gap-2 font-bold">
                  <CheckCircle2 size={15} className="text-[#34f0bc]" />
                  Saved {lastRun.filename} · {lastRun.totalRows} rows · SHA-256 {String(lastRun.sha256).slice(0, 14)}…
                </span>
                {lastRun.localSavedPath && <span className="font-mono-num text-[#fbe8a4]">{lastRun.localSavedPath}</span>}
              </div>
            )}
          </GlossyBlackCard>

          <div className="grid lg:grid-cols-2 gap-5">
            <div className="bw-card p-5 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-extrabold">Local Daily Backup Files (`backups/daily/`)</h3>
                <StatusPill label="Auto-Saved" tone="emerald" />
              </div>
              {(backupInfo?.localFiles ?? []).length === 0 ? (
                <div className="py-6 text-center text-[var(--bw-muted)]">
                  Click <strong>Run Daily Backup Now</strong> above to save today&apos;s timestamped `.xlsx` &amp; `.json` snapshot locally.
                </div>
              ) : (
                <div className="divide-y divide-[var(--bw-line)]">
                  {backupInfo.localFiles.map((f: any) => (
                    <div key={f.name} className="py-2.5 flex items-center justify-between gap-2">
                      <div>
                        <div className="font-mono-num font-bold text-[var(--bw-ink)]">{f.name}</div>
                        <div className="text-[11px] text-[var(--bw-muted)]">{new Date(f.modifiedAt).toLocaleString()}</div>
                      </div>
                      <StatusPill label={`${f.sizeKb} KB`} tone="navy" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bw-card p-5 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-extrabold flex items-center gap-1.5">
                  <Clock size={14} className="text-[#119c78]" /> Automated Daily Backup Audit History
                </h3>
                <StatusPill label="00:00 Dubai GST" tone="gold" />
              </div>
              {(backupInfo?.history ?? []).length === 0 ? (
                <div className="py-6 text-center text-[var(--bw-muted)]">
                  No cloud backup runs logged yet. Runs automatically every midnight Dubai GST or on-demand above.
                </div>
              ) : (
                <div className="divide-y divide-[var(--bw-line)] max-h-60 overflow-y-auto">
                  {backupInfo.history.map((h: any) => (
                    <div key={h.id} className="py-2.5 flex items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-[var(--bw-ink)]">{h.entity_id || 'Master Excel Backup'}</div>
                        <div className="text-[11px] text-[var(--bw-muted)]">
                          {h.metadata?.totalRows ?? 0} rows · {h.metadata?.sheetCount ?? 17} sheets · {h.metadata?.actor || 'Cron'}
                        </div>
                      </div>
                      <span className="font-mono-num text-[10.5px] text-[var(--bw-muted)]">
                        {new Date(h.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <MetricTile label="All-Data Sheets" value="17 Tabs" hint="Includes 18 Banks & 140+ RMs" tone="navy" />
            <MetricTile label="50-Spec Operational Hub" value={`${EXCEL_SPECS.length} Files`} hint="Role-scoped individual Excel exports" tone="emerald" />
            <MetricTile label="Daily Archive Retention" value="90 Days" hint="GitHub Actions + Local + Supabase" tone="gold" />
          </div>
        </div>
      )}

      {tab === 'word' && <LegalFormsStudioTab />}

      {tab === 'excel' && (
        <div className="bw-card p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-extrabold">50-Spec Operational Excel Data Hub</h2>
              <p className="text-xs text-[var(--bw-muted)]">
                Download live Supabase-populated `.xlsx` workbooks for Bank Panels, Pipelines, CTO/Average Balance, Accounts, HR &amp; Compliance.
              </p>
            </div>
            <input
              value={excelFilter}
              onChange={(e) => setExcelFilter(e.target.value)}
              placeholder="Filter 50 Excel specs..."
              className="rounded-full border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] px-4 py-2 text-xs w-64"
            />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredExcel.map((sp) => (
              <div
                key={sp.num}
                className="rounded-2xl border border-[var(--bw-line)] p-4 flex flex-col justify-between gap-2.5 hover:border-[#119c78] transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono text-[11px] font-extrabold text-[#119c78]">#{sp.num}</span>
                    <StatusPill label={`${sp.fileType} · ${sp.owner}`} tone="slate" />
                  </div>
                  <div className="text-xs font-bold break-all">{sp.filename}</div>
                  <div className="text-[10.5px] text-[var(--bw-muted)] mt-1 line-clamp-2">{sp.columns.join(' · ')}</div>
                </div>
                <a
                  href={`/api/v1/utilities/excel-export?num=${sp.num}`}
                  className="bw-btn bw-btn-obsidian w-full text-[11px] py-1.5 min-h-[34px]"
                >
                  <Download size={12} className="text-[#34f0bc]" /> Download .xlsx
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'translate' && (
        <div className="grid md:grid-cols-2 gap-5">
          <div className="bw-card p-5 space-y-3">
            <h2 className="text-sm font-extrabold">9-Language UAE Mortgage Glossary Translator</h2>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] px-3 py-2 text-xs"
            >
              <option value="ar">Arabic (العربية)</option>
              <option value="hi">Hindi (हिन्दी)</option>
              <option value="ur">Urdu (اردو)</option>
              <option value="ru">Russian (Русский)</option>
              <option value="fr">French (Français)</option>
              <option value="zh">Chinese (中文)</option>
              <option value="tl">Tagalog / Filipino</option>
              <option value="ml">Malayalam (മലയാളം)</option>
            </select>
            <textarea
              rows={5}
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              className="w-full rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] p-3 text-xs"
            />
            <button type="button" onClick={runTranslate} className="bw-btn bw-btn-obsidian text-xs">
              Translate Mortgage Text
            </button>
          </div>
          <div className="bw-card p-5 space-y-2">
            <h3 className="text-sm font-extrabold">Glossary-Locked Output</h3>
            <pre className="whitespace-pre-wrap text-xs leading-relaxed text-[var(--bw-ink)] bg-[var(--bw-soft)] rounded-xl p-4 min-h-40">
              {translated || 'Click Translate to preview multilingual UAE mortgage text.'}
            </pre>
          </div>
        </div>
      )}

      {tab === 'ocr' && (
        <div className="grid md:grid-cols-2 gap-5">
          <div className="bw-card p-5 space-y-3">
            <h2 className="text-sm font-extrabold">PII-Shielded Document OCR Extractor</h2>
            <p className="text-xs text-[var(--bw-muted)]">
              Extracts Emirates ID presence, salary figures, and expiry dates while masking sensitive personal fields for UAE PDPL compliance.
            </p>
            <textarea
              rows={5}
              value={rawOcr}
              onChange={(e) => setRawOcr(e.target.value)}
              className="w-full rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] p-3 text-xs font-mono"
            />
            <button type="button" onClick={runOcr} className="bw-btn bw-btn-obsidian text-xs">
              Run PII-Safe OCR Parse
            </button>
          </div>
          <div className="bw-card p-5 space-y-2">
            <h3 className="text-sm font-extrabold">Extracted Structured JSON</h3>
            <pre className="whitespace-pre-wrap text-xs font-mono bg-[var(--bw-soft)] rounded-xl p-4 min-h-40">
              {ocrResult ? JSON.stringify(ocrResult, null, 2) : 'Run OCR to inspect extracted fields.'}
            </pre>
          </div>
        </div>
      )}

      {tab === 'search' && (
        <div className="bw-card p-5 space-y-4">
          <form onSubmit={runSearch} className="flex gap-2">
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search Leads, Cases, Banks, Communities, Case Studies..."
              className="flex-1 rounded-full border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] px-4 py-2.5 text-xs"
              required
            />
            <button className="bw-btn bw-btn-obsidian text-xs">Search OS</button>
          </form>
          <div className="space-y-2">
            {searchResults.map((r, idx) => (
              <div key={idx} className="rounded-xl border border-[var(--bw-line)] p-3 flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold">{String(r.title)}</div>
                  <div className="text-[11px] text-[var(--bw-muted)]">{String(r.subtitle)}</div>
                </div>
                <StatusPill label={String(r.type || 'Record')} tone={String(r.type) === 'Privacy Fast Track' ? 'navy' : 'emerald'} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
