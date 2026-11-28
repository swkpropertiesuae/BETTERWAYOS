'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calculator,
  CheckCircle2,
  Clock,
  Copy,
  DatabaseBackup,
  Download,
  FileCode2,
  FileSpreadsheet,
  FileText,
  Languages,
  Palette,
  QrCode,
  RefreshCw,
  ScanText,
  Search,
  Smartphone,
  Wrench,
} from 'lucide-react';
import { EXCEL_SPECS } from '@/lib/domain/excel-specs';
import { useOs } from '@/components/os/OsProvider';
import { GlossyBlackCard, MetricTile, PageHeader, StatusPill } from '@/components/os/UiKit';
import { SubFeatureTabs, type SubFeatureItem } from '@/components/os/SubFeatureTabs';
import { LegalFormsStudioTab } from '@/components/workspace/LegalFormsStudioTab';
import { UI_PRESETS } from '@/lib/ui-customizer';

type UtilitySubTab =
  | 'hub'
  | 'word'
  | 'letters'
  | 'ocr'
  | 'translate'
  | 'calc_qr'
  | 'search'
  | 'mobile'
  | 'customise';

const UTILITY_SUB_TABS: ReadonlyArray<SubFeatureItem<UtilitySubTab>> = [
  { id: 'hub', num: '01', label: 'Utility Suite Hub', icon: Wrench },
  { id: 'word', num: '02', label: 'Word Studio (.docx)', icon: FileText },
  { id: 'letters', num: '03', label: 'Letter Studio Templates', icon: FileCode2 },
  { id: 'ocr', num: '04', label: 'Document Tools & OCR', icon: ScanText },
  { id: 'translate', num: '05', label: 'Translator (9 Langs)', icon: Languages },
  { id: 'calc_qr', num: '06', label: 'Calculators & QR', icon: Calculator },
  { id: 'search', num: '07', label: 'Unified Search', icon: Search },
  { id: 'mobile', num: '08', label: 'Mobile Apps (Android & iOS)', icon: Smartphone },
  { id: 'customise', num: '09', label: 'Customise UI Studio', icon: Palette },
];

const LETTER_TEMPLATES = [
  {
    code: 'BW-LTR-01',
    title: 'Bank Credit Rate Exception & Pricing Request',
    body: 'Dear Mortgage Pricing Desk,\n\nWe represent our client applying for a UAE residential mortgage facility of AED [Loan_Amount] ([LTV]% LTV). Given the borrower profile and clean AECB record, we kindly request a pricing exception to match your 2026 preferred fixed tier with reduced processing fee.\n\nWarm regards,\nBetterway Mortgages LLC — Al Nasr Plaza, Oud Metha, Dubai',
  },
  {
    code: 'BW-LTR-02',
    title: 'Employer Salary Certificate Request (CBUAE Format)',
    body: 'Dear HR Department,\n\nTo process our client\'s UAE mortgage pre-approval, kindly issue an official Salary Certificate addressed to [Bank_Name] detailing Joining Date, Designation, Basic Salary, Housing, Transport, and Total Monthly Package.\n\nThank you,\nBetterway Mortgages LLC',
  },
  {
    code: 'BW-LTR-03',
    title: 'Developer SOA & Mortgage NOC Request',
    body: 'Dear Developer Collections & NOC Team,\n\nKindly issue the updated Statement of Account (SOA) and Mortgage No-Objection Certificate (NOC) for Unit [Unit_No] in [Project_Name] financed through [Bank_Name] ahead of the DLD Trustee transfer.\n\nBest regards,\nBetterway Operations Desk',
  },
  {
    code: 'BW-LTR-04',
    title: '90-Day Fixed-Rate Expiry & Buyout Advisory Notice',
    body: 'Dear Valued Client,\n\nYour current fixed mortgage period expires in 90 days before reverting to EIBOR + Bank Margin. Betterway Mortgages LLC has prepared a complimentary 3-bank retention & buyout comparison to protect your monthly EMI at Zero Client Broker Fee.\n\nWarm regards,\nBetterway Client Care Desk',
  },
];

export default function UtilitiesPage() {
  const { toast, setCustomizerOpen, uiConfig, setUiConfig } = useOs();
  const [tab, setTab] = useState<UtilitySubTab>('hub');

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

  // Global Search & Excel filter
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<Array<Record<string, unknown>>>([]);
  const [excelFilter, setExcelFilter] = useState('');
  const [selectedLetter, setSelectedLetter] = useState(LETTER_TEMPLATES[0]);

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
    <div className="space-y-5">
      <PageHeader
        eyebrow="17-Sheet Master Excel · Automated Daily Backup · Word/Letter Studio · 9-Lang Translator · Mobile Apps"
        title="Utilities &"
        accent="Document Studio"
        subtitle="Full 9-module Betterway utility hub: Master Excel & Daily Backups, Word & Letter Studios, PII-Safe OCR, 9-Language Translator, Calculators & QR, Unified Search, Android/iOS Mobile Apps & Customise UI."
      />

      <SubFeatureTabs sectionTitle="Utilities & Documents" items={UTILITY_SUB_TABS} activeId={tab} onSelect={setTab} />

      {/* 01 UTILITY SUITE HUB */}
      {tab === 'hub' && (
        <div className="space-y-5">
          <GlossyBlackCard className="p-6 sm:p-7 space-y-5" accent="dual">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#64c4a8]">
                  <DatabaseBackup size={14} className="text-[#dfc285]" /> Complete Master Excel + Automated 00:00 GST Daily Backup
                </div>
                <h2 className="font-display text-2xl font-extrabold text-white">100% of Betterway OS Data in One Excel Workbook</h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Exports all 17 live sheets in 1 click: Staff, Leads CRM, 12-Step Cases, Bank Submissions, Valuations, GPS Field Meetings, 5-Track Disbursals, Manager Cheques, Advisor DSA &amp; Expenses, Daily Tasks, Invoices &amp; VAT, RERA Partners, Bank APL Catalog, 18-Bank Rates, 159 Direct Bank RMs, and Compliance Audit.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <a href="/api/v1/utilities/master-backup-excel" className="bw-btn bw-btn-primary text-xs">
                  <Download size={14} /> Download 17-Sheet Master Excel (.xlsx)
                </a>
                <a href="/api/v1/utilities/bank-matrix-excel" className="bw-btn bw-btn-obsidian text-xs border-[#47a88d]/45">
                  <FileSpreadsheet size={14} className="text-[#64c4a8]" /> Recreated 2026 Bank Matrix (.xlsx)
                </a>
                <button type="button" disabled={runningBackup} onClick={() => void triggerBackupNow()} className="bw-btn bw-btn-gold text-xs">
                  <RefreshCw size={14} className={runningBackup ? 'animate-spin' : ''} /> {runningBackup ? 'Saving Backup…' : 'Run Daily Backup Now'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/10">
                <div className="text-[10.5px] font-bold uppercase text-slate-400">Workbook Coverage</div>
                <div className="font-display text-2xl font-extrabold text-white mt-0.5">17 Sheets</div>
                <div className="text-[11px] text-[#64c4a8]">All Supabase tables + 159 RMs</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/10">
                <div className="text-[10.5px] font-bold uppercase text-slate-400">Automatic Schedule</div>
                <div className="font-display text-2xl font-extrabold text-[#dfc285] mt-0.5">00:00 GST</div>
                <div className="text-[11px] text-slate-300">Vercel Cron + GitHub Actions 90d</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/10">
                <div className="text-[10.5px] font-bold uppercase text-slate-400">Saved Snapshots</div>
                <div className="font-display text-2xl font-extrabold text-[#64c4a8] mt-0.5">
                  {(backupInfo?.localFiles?.length ?? 0) + (backupInfo?.history?.length ?? 0)}
                </div>
                <div className="text-[11px] text-slate-300">Local + Supabase Storage</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/10">
                <div className="text-[10.5px] font-bold uppercase text-slate-400">Mobile App Sync</div>
                <div className="font-display text-2xl font-extrabold text-white mt-0.5 flex items-center gap-1.5">
                  <Smartphone size={18} className="text-[#64c4a8]" /> iOS &amp; Android
                </div>
                <div className="text-[11px] text-slate-300">Capacitor 7 + PWA Ready</div>
              </div>
            </div>

            {lastRun && (
              <div className="p-4 rounded-2xl bg-[#47a88d]/12 border border-[#47a88d]/40 text-xs flex flex-wrap items-center justify-between gap-2 text-[#e6fff7]">
                <span className="inline-flex items-center gap-2 font-bold">
                  <CheckCircle2 size={15} className="text-[#64c4a8]" />
                  Saved {lastRun.filename} · {lastRun.totalRows} rows · SHA-256 {String(lastRun.sha256).slice(0, 14)}…
                </span>
                {lastRun.localSavedPath && <span className="font-mono-num text-[#dfc285]">{lastRun.localSavedPath}</span>}
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
                <div className="py-6 text-center text-[var(--bw-muted)]">Click <strong>Run Daily Backup Now</strong> above to save today&apos;s snapshot locally.</div>
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
                  <Clock size={14} className="text-[#0e5a49]" /> Automated Daily Backup Audit History
                </h3>
                <StatusPill label="00:00 Dubai GST" tone="gold" />
              </div>
              {(backupInfo?.history ?? []).length === 0 ? (
                <div className="py-6 text-center text-[var(--bw-muted)]">Runs automatically every midnight Dubai GST or on-demand above.</div>
              ) : (
                <div className="divide-y divide-[var(--bw-line)] max-h-60 overflow-y-auto">
                  {backupInfo.history.map((h: any) => (
                    <div key={h.id} className="py-2.5 flex items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-[var(--bw-ink)]">{h.entity_id || 'Master Excel Backup'}</div>
                        <div className="text-[11px] text-[var(--bw-muted)]">{h.metadata?.totalRows ?? 0} rows · {h.metadata?.sheetCount ?? 17} sheets</div>
                      </div>
                      <span className="font-mono-num text-[10.5px] text-[var(--bw-muted)]">{new Date(h.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <MetricTile label="All-Data Sheets" value="17 Tabs" hint="Includes 18 Banks & 159 RMs" tone="navy" />
            <MetricTile label="50-Spec Operational Hub" value={`${EXCEL_SPECS.length} Files`} hint="Role-scoped individual Excel exports" tone="emerald" />
            <MetricTile label="Daily Archive Retention" value="90 Days" hint="GitHub Actions + Local + Supabase" tone="gold" />
          </div>
        </div>
      )}

      {/* 02 WORD STUDIO (.docx) */}
      {tab === 'word' && <LegalFormsStudioTab />}

      {/* 03 LETTER STUDIO TEMPLATES */}
      {tab === 'letters' && (
        <div className="grid lg:grid-cols-12 gap-5 text-xs">
          <div className="lg:col-span-4 bw-card p-4 space-y-2">
            <h3 className="font-display text-sm font-extrabold px-1">UAE Mortgage Letter Templates</h3>
            {LETTER_TEMPLATES.map((ltr) => (
              <button
                key={ltr.code}
                type="button"
                onClick={() => setSelectedLetter(ltr)}
                className={`w-full p-3 rounded-xl text-start cursor-pointer transition ${
                  selectedLetter.code === ltr.code
                    ? 'bg-[#0b192c] text-white border border-[#c49a45]/50'
                    : 'bg-[var(--bw-soft)]/50 hover:bg-[var(--bw-soft)] border border-[var(--bw-line)]'
                }`}
              >
                <div className="font-mono text-[10px] text-[#64c4a8] font-bold">{ltr.code}</div>
                <div className="font-extrabold mt-0.5">{ltr.title}</div>
              </button>
            ))}
          </div>
          <div className="lg:col-span-8 bw-card p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-sm font-extrabold">{selectedLetter.title}</h3>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText(selectedLetter.body);
                  toast(`Copied ${selectedLetter.code} letter template!`);
                }}
                className="bw-btn bw-btn-obsidian text-xs py-1.5 min-h-[34px]"
              >
                <Copy size={12} className="text-[#64c4a8]" /> Copy Official Letter
              </button>
            </div>
            <textarea
              rows={9}
              value={selectedLetter.body}
              onChange={(e) => setSelectedLetter({ ...selectedLetter, body: e.target.value })}
              className="w-full rounded-2xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] p-4 text-xs leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* 04 DOCUMENT TOOLS & OCR + 50-SPEC EXCEL */}
      {tab === 'ocr' && (
        <div className="space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            <div className="bw-card p-5 space-y-3">
              <h2 className="text-sm font-extrabold">PII-Shielded Document OCR Extractor</h2>
              <p className="text-xs text-[var(--bw-muted)]">
                Extracts Emirates ID presence, salary figures, and expiry dates while masking sensitive personal fields for UAE PDPL compliance.
              </p>
              <textarea rows={5} value={rawOcr} onChange={(e) => setRawOcr(e.target.value)} className="w-full rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] p-3 text-xs font-mono" />
              <button type="button" onClick={runOcr} className="bw-btn bw-btn-obsidian text-xs">Run PII-Safe OCR Parse</button>
            </div>
            <div className="bw-card p-5 space-y-2">
              <h3 className="text-sm font-extrabold">Extracted Structured JSON</h3>
              <pre className="whitespace-pre-wrap text-xs font-mono bg-[var(--bw-soft)] rounded-xl p-4 min-h-40">
                {ocrResult ? JSON.stringify(ocrResult, null, 2) : 'Run OCR to inspect extracted fields.'}
              </pre>
            </div>
          </div>

          <div className="bw-card p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-extrabold">50-Spec Operational Excel Data Hub ({filteredExcel.length})</h2>
              <input value={excelFilter} onChange={(e) => setExcelFilter(e.target.value)} placeholder="Filter 50 Excel specs..." className="rounded-full border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] px-4 py-2 text-xs w-64" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredExcel.slice(0, 12).map((sp) => (
                <div key={sp.num} className="rounded-2xl border border-[var(--bw-line)] p-4 flex flex-col justify-between gap-2.5">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono text-[11px] font-extrabold text-[#0e5a49]">#{sp.num}</span>
                      <StatusPill label={sp.owner} tone="slate" />
                    </div>
                    <div className="text-xs font-bold break-all">{sp.filename}</div>
                  </div>
                  <a href={`/api/v1/utilities/excel-export?num=${sp.num}`} className="bw-btn bw-btn-obsidian w-full text-[11px] py-1.5 min-h-[34px]">
                    <Download size={12} className="text-[#64c4a8]" /> Download .xlsx
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 05 TRANSLATOR (9 LANGS) */}
      {tab === 'translate' && (
        <div className="grid md:grid-cols-2 gap-5">
          <div className="bw-card p-5 space-y-3">
            <h2 className="text-sm font-extrabold">9-Language UAE Mortgage Glossary Translator</h2>
            <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)} className="w-full rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] px-3 py-2 text-xs">
              <option value="ar">Arabic (العربية)</option>
              <option value="hi">Hindi (हिन्दी)</option>
              <option value="ur">Urdu (اردو)</option>
              <option value="ru">Russian (Русский)</option>
              <option value="fr">French (Français)</option>
              <option value="zh">Chinese (中文)</option>
              <option value="tl">Tagalog / Filipino</option>
              <option value="ml">Malayalam (മലയാളം)</option>
            </select>
            <textarea rows={5} value={sourceText} onChange={(e) => setSourceText(e.target.value)} className="w-full rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] p-3 text-xs" />
            <button type="button" onClick={runTranslate} className="bw-btn bw-btn-obsidian text-xs">Translate Mortgage Text</button>
          </div>
          <div className="bw-card p-5 space-y-2">
            <h3 className="text-sm font-extrabold">Glossary-Locked Output</h3>
            <pre className="whitespace-pre-wrap text-xs leading-relaxed text-[var(--bw-ink)] bg-[var(--bw-soft)] rounded-xl p-4 min-h-40">
              {translated || 'Click Translate to preview multilingual UAE mortgage text.'}
            </pre>
          </div>
        </div>
      )}

      {/* 06 CALCULATORS & QR */}
      {tab === 'calc_qr' && (
        <div className="grid lg:grid-cols-2 gap-5 text-xs">
          <GlossyBlackCard className="p-6 space-y-4" accent="emerald">
            <div className="inline-flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[#64c4a8]">
              <Calculator size={13} /> 12 Institutional UAE Calculators
            </div>
            <h3 className="font-display text-xl font-extrabold text-white">Complete CBUAE 2026 Calculation Suite</h3>
            <p className="text-slate-300 leading-relaxed">
              EMI &amp; Fixed-to-Variable Amortization, 50% DBR, 4-Emirate DLD/ADM Cash-to-Close, Buyout &amp; Equity Release, Prepayment Saver, Rent vs Buy, Yield &amp; DSCR, EIBOR Shock, CC Limit Optimizer &amp; Golden Visa.
            </p>
            <Link href="/os/calculators" className="bw-btn bw-btn-primary text-xs">Open All 12 UAE Calculators →</Link>
          </GlossyBlackCard>
          <div className="bw-card p-6 space-y-4">
            <div className="inline-flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[#0e5a49]">
              <QrCode size={13} /> Betterway Office &amp; Borrower QR Terminals
            </div>
            <h3 className="font-display text-lg font-extrabold">Oud Metha 20s Rotating Reception QR</h3>
            <p className="text-[var(--bw-muted)] leading-relaxed">
              Al Nasr Plaza office QR rotates every 20 seconds with GPS geofence verification and posts instant check-in cards to Betterway Inside.
            </p>
            <Link href="/os/employees" className="bw-btn bw-btn-obsidian text-xs">Open Live Oud Metha QR Desk →</Link>
          </div>
        </div>
      )}

      {/* 07 UNIFIED SEARCH */}
      {tab === 'search' && (
        <div className="bw-card p-5 space-y-4">
          <form onSubmit={runSearch} className="flex gap-2">
            <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Search Leads, Cases, Banks, Communities, Case Precedents..." className="flex-1 rounded-full border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] px-4 py-2.5 text-xs" required />
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

      {/* 08 MOBILE APPS (ANDROID & iOS) */}
      {tab === 'mobile' && (
        <div className="grid md:grid-cols-2 gap-5 text-xs">
          <GlossyBlackCard className="p-6 space-y-4" accent="dual">
            <div className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[#64c4a8]">Betterway Mortgages OS v3.2 · Android &amp; iOS</div>
            <h3 className="font-display text-xl font-extrabold text-white">Native Capacitor 7 Mobile Apps</h3>
            <ul className="space-y-2 text-slate-300 leading-relaxed">
              <li>• <strong className="text-white">Android (APK + AAB):</strong> Direct-install APK &amp; Google Play AAB built automatically via GitHub Actions (<code className="text-[#dfc285]">mobile-android-ios.yml</code>) with shining-black house icon, WebRTC SIP audio &amp; file attachments.</li>
              <li>• <strong className="text-white">iOS (IPA + Xcode):</strong> Native Xcode project (<code className="text-[#dfc285]">mobile/ios/App</code>) with iOS IPA build, AppIcon, microphone/file-sharing permissions &amp; live sync to <code className="text-[#64c4a8]">betterwayos.vercel.app</code>.</li>
              <li>• <strong className="text-white">Instant PWA Install:</strong> Open on iPhone Safari (Share → <em>Add to Home Screen</em>) or Android Chrome (<em>Install App</em>) for immediate full-screen access.</li>
            </ul>
            <div className="flex flex-wrap gap-2 pt-1">
              <a
                href="https://github.com/swkpropertiesuae/BETTERWAYOS/releases/download/mobile-latest/Betterway-Mortgages-OS-Android-v3.2.0.apk"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-full bg-[#0e5a49] hover:brightness-110 text-white text-xs font-extrabold inline-flex items-center gap-1.5"
              >
                <Download size={13} /> Download Android APK
              </a>
              <a
                href="https://github.com/swkpropertiesuae/BETTERWAYOS/releases/download/mobile-latest/Betterway-Mortgages-OS-iOS-v3.2.0.ipa"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-full bg-[#c49a45] hover:brightness-105 text-[#0b192c] text-xs font-extrabold inline-flex items-center gap-1.5"
              >
                <Download size={13} /> Download iOS IPA
              </a>
              <a
                href="https://github.com/swkpropertiesuae/BETTERWAYOS/actions/workflows/mobile-android-ios.yml"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Smartphone size={13} /> View Cloud Builds
              </a>
            </div>
          </GlossyBlackCard>
          <div className="bw-card p-6 space-y-3">
            <h3 className="font-display text-base font-extrabold">Mobile Field &amp; Executive Capabilities</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                'Oud Metha QR Scan',
                '1-Tap Field GPS SOS',
                'Betterway Inside Chat',
                'SIP Softphone Dialer',
                'Task Attachments & Follow-Ups',
                '12 UAE Calculators',
                '3-Bank WhatsApp Quote',
                'Android APK + iOS IPA',
              ].map((f) => (
                <div key={f} className="p-3 rounded-xl bg-[var(--bw-soft)] border border-[var(--bw-line)] font-bold flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-[#0e5a49] shrink-0" /> {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 09 CUSTOMISE UI STUDIO */}
      {tab === 'customise' && (
        <div className="bw-card p-6 space-y-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-extrabold">Customise UI Studio — Colors, Fonts, Sizes, Highlights &amp; Pin/Drag</h2>
              <p className="text-[11px] text-[var(--bw-muted)]">Switch instant presets below or open the full side studio to adjust every hex color, font family, scale, highlight glow, and pinned bar.</p>
            </div>
            <button type="button" onClick={() => setCustomizerOpen(true)} className="bw-btn bw-btn-obsidian text-xs">
              <Palette size={14} className="text-[#64c4a8]" /> Open Full Customise UI Drawer
            </button>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {UI_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setUiConfig({ ...uiConfig, presetId: p.id, ...p.patch });
                  toast(`Applied "${p.name}" theme!`);
                }}
                className={`p-4 rounded-2xl border text-start cursor-pointer transition ${
                  uiConfig.presetId === p.id ? 'border-[#0e5a49] bg-[#eaf4f1]/50 ring-1 ring-[#47a88d]' : 'border-[var(--bw-line)] bg-[var(--bw-soft)]/50 hover:border-[#0e5a49]'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  {p.swatch.map((hex, i) => (
                    <span key={i} className="size-4 rounded-full border border-black/15" style={{ backgroundColor: hex }} />
                  ))}
                </div>
                <div className="font-extrabold">{p.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
