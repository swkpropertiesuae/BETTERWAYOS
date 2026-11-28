'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Edit3, FileText, Image as ImageIcon, Printer, Stamp } from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { StatusPill } from '@/components/os/UiKit';
import { extractTemplatePlaceholders, fillTemplateText } from '@/lib/workspace/domain';
import { downloadJpegDocument, downloadWordDocument, printBrandedDocument } from '@/lib/workspace/exporters';

const PRIORITY_CODES = ['BW-MANDATE-KFS', 'BW-PREAPP-PACK', 'BW-REFERRAL-DSA', 'BW-NOC-SOA', 'BW-BUYOUT-LIAB', 'BW-FOL-TRUSTEE'];

export function LegalFormsStudioTab() {
  const { user, toast } = useOs();
  const [templates, setTemplates] = useState<any[]>([]);
  const [savedDocs, setSavedDocs] = useState<any[]>([]);
  const [selectedCode, setSelectedCode] = useState('BW-MANDATE-KFS');
  const [title, setTitle] = useState('CBUAE Key Facts Statement (KFS) & Zero-Broker-Fee Mortgage Mandate');
  const [category, setCategory] = useState('CBUAE Mortgage Mandate');
  const [rawTemplate, setRawTemplate] = useState('');
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<'form' | 'edit'>('form');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch('/api/v1/utilities/word-studio', { cache: 'no-store' });
    if (r.ok) {
      const d = await r.json();
      const tpls: any[] = d.templates ?? [];
      setTemplates(tpls);
      setSavedDocs(d.docs ?? []);
      const first = tpls.find((t) => t.code === 'BW-MANDATE-KFS') || tpls[0];
      if (first && !rawTemplate) {
        setSelectedCode(first.code);
        setTitle(first.title);
        setCategory(first.category || 'CBUAE Mortgage Mandate');
        setRawTemplate(first.body_template || '');
      }
    }
  }, [rawTemplate]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectTemplate = (tpl: any) => {
    setSelectedCode(tpl.code);
    setTitle(tpl.title);
    setCategory(tpl.category || 'Legal & Brokerage');
    setRawTemplate(tpl.body_template || '');
    setFieldValues({});
  };

  const fields = useMemo(() => extractTemplatePlaceholders(rawTemplate), [rawTemplate]);
  const renderedBody = useMemo(() => fillTemplateText(rawTemplate, fieldValues), [rawTemplate, fieldValues]);

  const exportPayload = {
    filename: `${selectedCode}_${title.slice(0, 36).replace(/[^A-Za-z0-9]+/g, '_')}`,
    badge: `BETTERWAY LEGAL & AGREEMENT TEMPLATE · ${selectedCode}`,
    title,
    subtitle: `${category} · Prepared by ${user?.name || 'Betterway Mortgages LLC'}`,
    bodyText: renderedBody,
    sealedBy: user?.isOwner ? user.name : undefined,
  };

  const saveAndSeal = async () => {
    setSaving(true);
    try {
      const r = await fetch('/api/v1/utilities/word-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, bodyText: renderedBody }),
      });
      const out = await r.json();
      if (!r.ok) {
        toast(out.error || 'Failed to save document', 'err');
        return;
      }
      toast(
        out.doc.seal_status === 'Sealed'
          ? `Saved & Owner-Sealed (${out.doc.doc_code})!`
          : `Saved (${out.doc.doc_code}) — queued for Owner Corporate Seal.`,
      );
      await load();
    } finally {
      setSaving(false);
    }
  };

  const orderedTemplates = [
    ...PRIORITY_CODES.map((c) => templates.find((t) => t.code === c)).filter(Boolean),
    ...templates.filter((t) => !PRIORITY_CODES.includes(t.code)),
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold flex items-center gap-2">
            <FileText size={16} className="text-[#0e5243]" /> UAE Mortgage Forms &amp; Agreements Studio (Word `.DOC` · `.JPEG` · Fillable)
          </h2>
          <p className="text-xs text-[var(--bw-muted)]">
            CBUAE KFS Mandate, 24-Bank Pre-Approval Comparison, RERA Partner Referral DSA Agreement, Developer SOA &amp; e-NOC Letter, Buyout Liability Letter Authorization, and FOL &amp; DLD Trustee Disbursal Pack — fill fields, edit template freely, and export to Word, JPEG, or PDF.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => downloadWordDocument(exportPayload)}
            className="px-3.5 py-2 rounded-full bg-[#0e5243] text-[#ebd5a6] font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <FileText size={13} /> Download Word (.DOC)
          </button>
          <button
            type="button"
            onClick={() => void downloadJpegDocument(exportPayload)}
            className="px-3.5 py-2 rounded-full bg-[#0e5243] text-white font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ImageIcon size={13} /> Download .JPEG
          </button>
          <button
            type="button"
            onClick={() => printBrandedDocument(exportPayload)}
            className="px-3.5 py-2 rounded-full border border-[var(--bw-line)] font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Printer size={13} /> Print / PDF
          </button>
        </div>
      </div>

      {/* Quick-Launch Template Shelf */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
        {orderedTemplates.slice(0, 12).map((tpl) => (
          <button
            key={tpl.code}
            type="button"
            onClick={() => selectTemplate(tpl)}
            className={`p-3 rounded-2xl border text-start transition cursor-pointer ${
              selectedCode === tpl.code
                ? 'bg-[#0e5243] text-white border-[#c49a45]'
                : 'bg-[var(--bw-card)] border-[var(--bw-line)] hover:border-[#0e5243]'
            }`}
          >
            <div className={`font-mono-num text-[10px] font-extrabold ${selectedCode === tpl.code ? 'text-[#ebd5a6]' : 'text-[#0e5243]'}`}>
              {tpl.code}
            </div>
            <div className="font-bold mt-1 line-clamp-2 leading-snug">{tpl.title}</div>
          </button>
        ))}
      </div>

      {/* Mode Switch + Split Fillable Form / Live Preview */}
      <div className="grid lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 bw-card p-5 space-y-3 text-xs">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--bw-line)]">
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setMode('form')}
                className={`px-3 py-1.5 rounded-full font-bold cursor-pointer ${
                  mode === 'form' ? 'bg-[#0e5243] text-white' : 'border border-[var(--bw-line)]'
                }`}
              >
                Fillable Form ({fields.length} Fields)
              </button>
              <button
                type="button"
                onClick={() => setMode('edit')}
                className={`px-3 py-1.5 rounded-full font-bold inline-flex items-center gap-1 cursor-pointer ${
                  mode === 'edit' ? 'bg-[#0e5243] text-[#ebd5a6]' : 'border border-[var(--bw-line)]'
                }`}
              >
                <Edit3 size={12} /> Edit Template
              </button>
            </div>
          </div>

          <div>
            <label className="font-bold block mb-1">Document Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] font-semibold"
            />
          </div>

          {mode === 'form' ? (
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pe-1">
              {fields.length === 0 ? (
                <div className="py-8 text-center text-[var(--bw-muted)]">
                  No `[Placeholder]` tags in this template — switch to <strong>Edit Template</strong> to edit text directly.
                </div>
              ) : (
                fields.map((f) => (
                  <div key={f.token}>
                    <label className="font-bold block mb-1 text-[11px]">{f.label}</label>
                    <input
                      type={f.inputType}
                      value={fieldValues[f.token] ?? ''}
                      onChange={(e) => setFieldValues((prev) => ({ ...prev, [f.token]: e.target.value }))}
                      placeholder={`Enter ${f.label}...`}
                      className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]"
                    />
                  </div>
                ))
              )}
            </div>
          ) : (
            <div>
              <label className="font-bold block mb-1">Editable Template Body (use `[Field_Name]` for fillable fields)</label>
              <textarea
                rows={18}
                value={rawTemplate}
                onChange={(e) => setRawTemplate(e.target.value)}
                className="w-full p-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] font-mono text-[11.5px] leading-relaxed"
              />
            </div>
          )}

          <button
            type="button"
            disabled={saving}
            onClick={() => void saveAndSeal()}
            className="w-full h-10 rounded-full bg-[#0e5243] text-[#ebd5a6] font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            <Stamp size={14} /> {saving ? 'Saving...' : user?.isOwner ? 'Save & Apply Owner Corporate Seal' : 'Save & Request Corporate Seal'}
          </button>
        </div>

        {/* Right: Live Betterway Letterhead Document Preview */}
        <div className="lg:col-span-7 bw-card p-6 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white text-[#161d1a] overflow-hidden shadow-sm">
            <div className="bg-[#0e5243] text-white px-6 py-4 border-b-4 border-[#c49a45] flex items-center justify-between gap-3">
              <div>
                <img src="/brand/logo-horizontal-dark.png" alt="Betterway Mortgages" className="h-7 mb-1.5" />
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#ebd5a6]">{selectedCode} · {category}</div>
              </div>
              <div className="text-end text-[10.5px] text-slate-300">
                <div>Betterway Mortgages LLC</div>
                <div>Al Nasr Plaza, Oud Metha, Dubai</div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <h3 className="text-base font-extrabold text-[#161d1a] border-b border-slate-200 pb-2">{title}</h3>
              <pre className="whitespace-pre-wrap font-serif text-xs leading-relaxed text-slate-800">{renderedBody}</pre>
              {user?.isOwner && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-[#c49a45] bg-[#FFFDF4] text-[11px] font-bold text-[#0e5243]">
                  <CheckCircle2 size={14} className="text-[#0e5243]" /> Owner Corporate Seal Ready ({user.name})
                </div>
              )}
            </div>
          </div>

          {savedDocs.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-extrabold">Recently Saved &amp; Sealed Agreements ({savedDocs.length})</div>
              <div className="grid sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {savedDocs.slice(0, 6).map((d) => (
                  <div key={d.id} className="p-2.5 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]/60 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <div className="font-mono-num text-[10px] font-bold text-[#0e5243]">{d.doc_code}</div>
                      <div className="font-bold truncate">{d.title}</div>
                    </div>
                    <StatusPill label={d.seal_status} tone={d.seal_status === 'Sealed' ? 'emerald' : 'gold'} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
