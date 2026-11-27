'use client';

import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Languages,
  ScanText,
  Search,
} from 'lucide-react';
import { EXCEL_SPECS } from '@/lib/domain/excel-specs';
import { PageHeader, StatusPill } from '@/components/os/UiKit';
import { LegalFormsStudioTab } from '@/components/workspace/LegalFormsStudioTab';

export default function UtilitiesPage() {
  const [tab, setTab] = useState<'word' | 'excel' | 'translate' | 'ocr' | 'search'>('word');

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
        eyebrow="UAE Mortgage Word/JPEG Forms Studio · 50-Spec Excel Data Hub · 9-Lang Translator · PII-Safe OCR"
        title="Utilities &"
        accent="Mortgage Document Studio"
        subtitle="Fill, edit & export CBUAE KFS Mandates, 24-Bank DIP Comparisons, RERA Referral DSA Agreements, Developer SOA/e-NOCs, Buyout Liability Letters & FOL Trustee Packs as Word (.doc), JPEG & PDF, download all 50 Excel workbooks, translate mortgage clauses across 9 languages, and run PII-shielded OCR."
      />

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['word', 'Mortgage Word/JPEG Forms Studio', FileText],
            ['excel', `50-Spec Excel Data Hub (${EXCEL_SPECS.length})`, FileSpreadsheet],
            ['translate', '9-Language Translator', Languages],
            ['ocr', 'PII-Shielded OCR', ScanText],
            ['search', 'Unified Global Search', Search],
          ] as const
        ).map(([k, label, Icon]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition ${
              tab === k ? 'bg-[#025e3d] text-white border-[#025e3d]' : 'bg-[var(--bw-card)] border-[var(--bw-line)]'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

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
              className="rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 text-xs w-64"
            />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredExcel.map((sp) => (
              <div
                key={sp.num}
                className="rounded-xl border border-[var(--bw-line)] p-3.5 flex flex-col justify-between gap-2 hover:border-[#007b52] transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono text-[11px] font-bold text-[var(--bw-emerald)]">#{sp.num}</span>
                    <StatusPill label={`${sp.fileType} · ${sp.owner}`} tone="slate" />
                  </div>
                  <div className="text-xs font-bold break-all">{sp.filename}</div>
                  <div className="text-[10.5px] text-[var(--bw-muted)] mt-1 line-clamp-2">{sp.columns.join(' · ')}</div>
                </div>
                <a
                  href={`/api/v1/utilities/excel-export?num=${sp.num}`}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#025e3d] text-white py-1.5 text-[11px] font-bold hover:brightness-110"
                >
                  <Download size={12} /> Download .xlsx
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
              className="w-full rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] px-3 py-2 text-xs"
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
              className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent p-3 text-xs"
            />
            <button type="button" onClick={runTranslate} className="rounded-xl bg-[#025e3d] text-white px-4 py-2 text-xs font-bold">
              Translate with Legal Mortgage Glossary
            </button>
          </div>
          <div className="bw-card p-5 space-y-2">
            <h3 className="text-sm font-extrabold">Glossary-Locked Output</h3>
            <pre className="whitespace-pre-wrap text-xs leading-relaxed text-[var(--bw-ink)] bg-slate-500/5 rounded-xl p-4 min-h-40">
              {translated || 'Click Translate to preview glossary-locked multilingual mortgage text.'}
            </pre>
          </div>
        </div>
      )}

      {tab === 'ocr' && (
        <div className="grid md:grid-cols-2 gap-5">
          <div className="bw-card p-5 space-y-3">
            <h2 className="text-sm font-extrabold">PII-Shielded Document OCR Extractor</h2>
            <p className="text-xs text-[var(--bw-muted)]">
              Extracts Emirates ID presence, salary figures, and expiry dates while redacting raw PII before any downstream AI pipeline.
            </p>
            <textarea
              rows={5}
              value={rawOcr}
              onChange={(e) => setRawOcr(e.target.value)}
              className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent p-3 text-xs font-mono"
            />
            <button type="button" onClick={runOcr} className="rounded-xl bg-[#025e3d] text-white px-4 py-2 text-xs font-bold">
              Run PII-Shielded OCR Parse
            </button>
          </div>
          <div className="bw-card p-5 space-y-2">
            <h3 className="text-sm font-extrabold">Extracted Structured JSON</h3>
            <pre className="whitespace-pre-wrap text-xs font-mono bg-slate-500/5 rounded-xl p-4 min-h-40">
              {ocrResult ? JSON.stringify(ocrResult, null, 2) : 'Run OCR to inspect redacted preview and extracted fields.'}
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
              placeholder="Search Leads, Cases, Banks, Communities, Case Studies (strictly role-scoped — zero Fast Track leak)..."
              className="flex-1 rounded-xl border border-[var(--bw-line)] bg-transparent px-4 py-2.5 text-xs"
              required
            />
            <button className="rounded-xl bg-[#025e3d] text-white px-5 py-2.5 text-xs font-bold">Search OS</button>
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
