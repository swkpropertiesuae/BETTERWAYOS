import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileCode2,
  Globe,
  Languages,
  Printer,
  Save,
  ScanText,
  Search,
  Stamp,
  Users,
} from 'lucide-react';
import { apiFetch, fmtAed } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { BankBadge, PageHeader, StatusPill } from '../components/UiPrimitives';

const LETTER_TEMPLATES = [
  {
    code: 'KFS_QUOTE',
    label: 'Bank Quote & Key Facts Sheet',
    body: '<h2>UAE Mortgage Key Facts &amp; Bank Shortlist</h2><p><strong>Prepared For:</strong> [Client Name] &nbsp;|&nbsp; <strong>Property:</strong> [Community / Unit]</p><p><strong>Property Value:</strong> AED [Value] &nbsp;|&nbsp; <strong>Loan Amount:</strong> AED [Loan] (80% LTV)</p><p><strong>Recommended Offer:</strong> Emirates NBD — 3.89% Fixed for 3 Years, reverting to 3M EIBOR + 1.75%.</p><p><strong>Betterway Fee:</strong> AED 0 to client (paid directly by the lending bank upon disbursal).</p>',
  },
  {
    code: 'ZERO_FEE',
    label: 'Zero-Fee Engagement Letter',
    body: '<h2>Client Mortgage Advisory &amp; PDPL Consent</h2><p>Betterway Mortgages LLC (DED #1084921, Al Nasr Plaza, Oud Metha, Dubai) confirms <strong>AED 0 upfront broker advisory fee</strong> for standard UAE residential mortgage placement across our 24 partner banks.</p><p>Client documents are handled strictly inside our encrypted Vault under UAE PDPL Law 45/2021.</p>',
  },
  {
    code: 'HANDOVER_SOA',
    label: 'Developer Handover SOA Letter',
    body: '<h2>Request for Final Statement of Account (SOA) &amp; Handover Mortgage</h2><p>To: Developer Handover Desk &nbsp;|&nbsp; Unit: [Project &amp; Door #]</p><p>Please issue the updated Statement of Account (SOA) and bank-payable details so Betterway Mortgages LLC can finalize bank valuation and funding disbursement ahead of handover.</p>',
  },
  {
    code: 'RERA_PARTNER',
    label: 'RERA Partner Commission Agreement',
    body: '<h2>RERA Partner Referral &amp; Attribution Confirmation</h2><p>Betterway Mortgages LLC confirms locked referral attribution for <strong>[Agency Name / BRN #]</strong> on client <strong>[Buyer Name]</strong>. Approved referral share will be transferred via UAEFTS corporate bank wire upon confirmed bank loan disbursal.</p>',
  },
];

export function WordStudioPage() {
  const { user, toast } = useAuth();
  const [docs, setDocs] = useState<any[]>([]);
  const [title, setTitle] = useState('UAE Mortgage Quote & Key Facts — Betterway Mortgages');
  const [code, setCode] = useState('KFS_QUOTE');
  const [bodyHtml, setBodyHtml] = useState(LETTER_TEMPLATES[0]!.body);
  const [caseCode, setCaseCode] = useState('BW-2026-M03');
  const [requestSeal, setRequestSeal] = useState(true);

  const load = async () => {
    const d = await apiFetch<{ documents: any[] }>('/api/word-studio');
    setDocs(d.documents || []);
  };
  useEffect(() => {
    void load();
  }, []);

  const saveDoc = async () => {
    await apiFetch('/api/word-studio', {
      method: 'POST',
      body: JSON.stringify({ title, template_code: code, body_html: bodyHtml, case_code: caseCode, request_seal: requestSeal }),
    });
    toast(requestSeal ? 'Saved letter & requested Official Owner Seal!' : 'Saved letter to Betterway Studio');
    await load();
  };

  const stampSeal = async (id: string) => {
    try {
      await apiFetch(`/api/word-studio/${id}/seal`, { method: 'POST' });
      toast('Official Betterway Corporate Seal stamped by Owner!');
      await load();
    } catch (e: any) {
      toast(e.message, 'err');
    }
  };

  const downloadWordDoc = () => {
    const fullHtml = `<html><head><meta charset="utf-8"><title>${title}</title></head><body style="font-family:Arial,sans-serif;padding:32px;color:#070E1A;"><div style="border-bottom:3px solid #179373;padding-bottom:12px;margin-bottom:20px;"><strong>BETTERWAY MORTGAGES LLC</strong> — Al Nasr Plaza, Oud Metha, Dubai, UAE · DED #1084921</div>${bodyHtml}</body></html>`;
    const blob = new Blob([fullHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]+/gi, '_')}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="SWK Word Studio Parity · Official Betterway Letterhead & Corporate Seal"
        title="Betterway Letter &"
        accent="Word Studio"
        subtitle="Draft client quotes, engagement letters, developer SOA requests, and RERA partner agreements on official Betterway letterhead — request Owner Shabib Siraj seal and export to Word (.doc) or PDF."
        actions={
          <>
            <button type="button" onClick={downloadWordDoc} className="px-4 py-2 rounded-full border border-[var(--bw-line)] bg-[var(--bw-card)] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer no-print">
              <Download size={14} /> Export .DOC
            </button>
            <button type="button" onClick={() => window.print()} className="px-4 py-2 rounded-full bg-[#070E1A] text-[#FCF1B7] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer no-print">
              <Printer size={14} /> Print / PDF
            </button>
          </>
        }
      />

      <div className="grid lg:grid-cols-12 gap-5">
        {/* Editor & Templates */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap gap-2 no-print">
            {LETTER_TEMPLATES.map((t) => (
              <button
                key={t.code}
                type="button"
                onClick={() => { setCode(t.code); setTitle(`${t.label} — Betterway Mortgages`); setBodyHtml(t.body); }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer ${code === t.code ? 'bg-[#179373] text-white' : 'bg-[var(--bw-card)] border border-[var(--bw-line)]'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Live Branded A4 Preview Sheet */}
          <div className="bw-card p-6 bg-white text-[#070E1A] border-2 border-[#D7B158]/45 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b-2 border-[#070E1A]">
              <img src="/brand/betterway-logo-horizontal-light-bg.svg" alt="Betterway Mortgages" className="h-10 w-auto" />
              <div className="text-right text-[11px] text-slate-600">
                <div className="font-bold text-[#070E1A]">Betterway Mortgages LLC</div>
                <div>Al Nasr Plaza, Oud Metha, Dubai, UAE</div>
                <div>DED #1084921 · CBUAE-MB-2025-041</div>
              </div>
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-lg font-bold border-b border-slate-200 pb-2 outline-none bg-transparent"
            />
            <textarea
              rows={7}
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono-num no-print"
            />
            <div className="prose prose-sm max-w-none text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span>Ref: {caseCode || 'BW-OFFICIAL'}</span>
              <div className="px-3 py-1.5 rounded-full border-2 border-[#BA8D36] text-[#8A621C] font-bold inline-flex items-center gap-1.5">
                <Stamp size={13} /> Betterway Official Seal Ready
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 no-print">
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input type="checkbox" checked={requestSeal} onChange={(e) => setRequestSeal(e.target.checked)} className="size-4 accent-[#179373]" />
              Submit for Owner Shabib Siraj Official Seal
            </label>
            <button type="button" onClick={() => void saveDoc()} className="px-5 py-2.5 rounded-full bg-[#179373] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer">
              <Save size={14} /> Save Official Document
            </button>
          </div>
        </div>

        {/* Saved Letters & Seal Governance */}
        <div className="lg:col-span-5 bw-card p-5 space-y-3 no-print">
          <h3 className="text-sm font-bold flex items-center gap-2"><FileCode2 size={16} className="text-[#BA8D36]" /> Saved Letters &amp; Seal Queue</h3>
          <div className="space-y-3 text-xs">
            {docs.map((d) => (
              <div key={d.id} className="p-3.5 rounded-2xl bg-[var(--bw-soft)]/70 border border-[var(--bw-line)] space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <b className="text-sm">{d.title}</b>
                  <StatusPill label={d.seal_status} tone={d.seal_status.includes('Sealed') ? 'emerald' : d.seal_status.includes('Pending') ? 'gold' : 'neutral'} />
                </div>
                <div className="text-[var(--bw-muted)]">By {d.created_by} · {d.case_code || 'General'}</div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setTitle(d.title); setBodyHtml(d.body_html); setCaseCode(d.case_code); }} className="px-3 py-1 rounded-full border border-[var(--bw-line)] font-bold cursor-pointer">
                    Load in Editor
                  </button>
                  {d.seal_status === 'Pending Owner Seal' && user?.can_approve_deletions === 1 && (
                    <button type="button" onClick={() => void stampSeal(d.id)} className="px-3 py-1 rounded-full bg-[#070E1A] text-[#FCF1B7] font-bold inline-flex items-center gap-1 cursor-pointer">
                      <Stamp size={12} /> Stamp Official Seal
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function UtilitiesSuitePage() {
  const [tab, setTab] = useState<'translator' | 'ocr' | 'search'>('translator');
  // Translator
  const [srcText, setSrcText] = useState('Your Mortgage Pre-Approval is ready with Zero Broker Fee. Down Payment is 20% and Bank Valuation takes 3 working days before your Final Offer Letter and Title Deed.');
  const [lang, setLang] = useState('ar');
  const [translated, setTranslated] = useState('');
  const [glossary, setGlossary] = useState<string[]>([]);
  // OCR
  const [ocrText, setOcrText] = useState('EMIRATES ID: 784-1988-4512901-7\nPASSPORT: N8492014\nSALARY CERTIFICATE: Monthly Basic + Allowance AED 54,500\nCONTACT: +971 50 422 4218 | client@dubai.ae');
  const [ocrRes, setOcrRes] = useState<any>(null);
  // Search
  const [sq, setSq] = useState('Emirates');
  const [sres, setSres] = useState<any>(null);

  const runTranslate = async () => {
    const d = await apiFetch<any>('/api/utilities/translate', { method: 'POST', body: JSON.stringify({ text: srcText, target_lang: lang }) });
    setTranslated(d.translated);
    setGlossary(d.glossaryLocked || []);
  };

  const runOcr = async () => {
    const d = await apiFetch<any>('/api/utilities/ocr-parse', { method: 'POST', body: JSON.stringify({ text: ocrText }) });
    setOcrRes(d.extracted);
  };

  const runSearch = async (q = sq) => {
    const d = await apiFetch<any>(`/api/utilities/search?q=${encodeURIComponent(q)}`);
    setSres(d);
  };

  useEffect(() => {
    void runTranslate();
    void runOcr();
    void runSearch('Emirates');
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="SWK Utilities Suite Parity · Translator · OCR · Unified Search"
        title="Betterway"
        accent="Productivity Utilities"
        subtitle="Translate UAE mortgage messages into 9 languages with legal glossary lock, scan Emirates ID / Salary Certificates, and search every record in Betterway OS at once."
      />

      <div className="flex flex-wrap gap-2">
        {[
          ['translator', '9-Language Mortgage Translator', Languages],
          ['ocr', 'Document OCR Reader', ScanText],
          ['search', 'Search Everything', Search],
        ].map(([id, lbl, Icon]: any) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-full text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
              tab === id ? 'bg-[#070E1A] text-[#FCF1B7] dark:bg-[#179373] dark:text-white' : 'bg-[var(--bw-card)] border border-[var(--bw-line)]'
            }`}
          >
            <Icon size={14} /> {lbl}
          </button>
        ))}
      </div>

      {tab === 'translator' && (
        <div className="grid lg:grid-cols-2 gap-5 text-xs">
          <div className="bw-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <b>English Source Message</b>
              <select value={lang} onChange={(e) => setLang(e.target.value)} className="h-8 px-2.5 rounded-lg border border-[var(--bw-line)] bg-[var(--bw-card)] font-bold">
                <option value="ar">Arabic (العربية)</option>
                <option value="hi">Hindi (हिन्दी)</option>
                <option value="ur">Urdu (اردو)</option>
                <option value="ru">Russian (Русский)</option>
                <option value="fr">French (Français)</option>
                <option value="zh">Chinese (中文)</option>
                <option value="tl">Tagalog</option>
                <option value="ml">Malayalam (മലയാളം)</option>
              </select>
            </div>
            <textarea rows={5} value={srcText} onChange={(e) => setSrcText(e.target.value)} className="w-full p-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-soft)]/50 text-sm" />
            <button type="button" onClick={() => void runTranslate()} className="px-5 py-2.5 rounded-full bg-[#179373] text-white font-bold cursor-pointer">
              Translate with UAE Mortgage Glossary
            </button>
          </div>
          <div className="bw-card p-5 space-y-3">
            <b>Glossary-Protected Output</b>
            <div className="p-4 rounded-2xl bg-[var(--bw-soft)] text-sm whitespace-pre-line leading-relaxed min-h-[140px]">
              {translated}
            </div>
            {glossary.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {glossary.map((g) => <StatusPill key={g} label={g} tone="gold" />)}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'ocr' && (
        <div className="grid lg:grid-cols-2 gap-5 text-xs">
          <div className="bw-card p-5 space-y-3">
            <b>Paste / Scan Document Text (Emirates ID, Salary Cert, Oqood)</b>
            <textarea rows={6} value={ocrText} onChange={(e) => setOcrText(e.target.value)} className="w-full p-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-soft)]/50 font-mono-num" />
            <button type="button" onClick={() => void runOcr()} className="px-5 py-2.5 rounded-full bg-[#179373] text-white font-bold cursor-pointer">
              Extract Key Borrower Fields
            </button>
          </div>
          <div className="bw-card p-5 space-y-2.5">
            <b>Extracted Structured Fields (Ready for Fact-Find)</b>
            {ocrRes && (
              <div className="space-y-2 pt-1 font-mono-num">
                <div className="p-2.5 rounded-xl bg-[var(--bw-soft)] flex justify-between"><span>Emirates ID:</span><b className="text-[#179373]">{ocrRes.emiratesId}</b></div>
                <div className="p-2.5 rounded-xl bg-[var(--bw-soft)] flex justify-between"><span>Passport #:</span><b>{ocrRes.passportNumber}</b></div>
                <div className="p-2.5 rounded-xl bg-[var(--bw-soft)] flex justify-between"><span>UAE Phone:</span><b>{ocrRes.uaePhone}</b></div>
                <div className="p-2.5 rounded-xl bg-[var(--bw-soft)] flex justify-between"><span>Email:</span><b>{ocrRes.email}</b></div>
                <div className="p-2.5 rounded-xl bg-[var(--bw-soft)] flex justify-between"><span>AED Amounts Found:</span><b className="text-[#BA8D36]">{ocrRes.detectedAedFigures.join(', ') || 'None'}</b></div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'search' && (
        <div className="space-y-4">
          <form onSubmit={(e) => { e.preventDefault(); void runSearch(); }} className="bw-card p-3.5 flex gap-2">
            <input value={sq} onChange={(e) => setSq(e.target.value)} placeholder="Search across Cases, Leads, 24 Banks, 60 Communities & 50 Excel Specs…" className="flex-1 h-10 px-4 rounded-full border border-[var(--bw-line)] bg-[var(--bw-card)] text-sm" />
            <button type="submit" className="h-10 px-6 rounded-full bg-[#179373] text-white text-xs font-bold cursor-pointer">Search All</button>
          </form>
          {sres && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="bw-card p-4 space-y-2">
                <b className="text-[#179373]">Mortgage Cases ({sres.cases.length})</b>
                {sres.cases.map((c: any) => <div key={c.id} className="p-2 rounded-lg bg-[var(--bw-soft)]"><b>{c.case_code}</b> · {c.borrower_name} ({c.community})</div>)}
              </div>
              <div className="bw-card p-4 space-y-2">
                <b className="text-[#BA8D36]">24 UAE Banks ({sres.banks.length})</b>
                {sres.banks.map((b: any) => <div key={b.id} className="p-2 rounded-lg bg-[var(--bw-soft)] flex items-center justify-between"><BankBadge bankKey={b.key} /><span>{b.indicativeFixed3Y}%</span></div>)}
              </div>
              <div className="bw-card p-4 space-y-2">
                <b className="text-sky-600">UAE Communities ({sres.communities.length})</b>
                {sres.communities.map((c: any) => <div key={c.slug} className="p-2 rounded-lg bg-[var(--bw-soft)]"><b>{c.name}</b> · {c.grossYieldPct}% yield</div>)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function HrWorkspacePage() {
  const { user, toast } = useAuth();
  const [data, setData] = useState<{ compliance: any[]; leaves: any[] }>({ compliance: [], leaves: [] });
  const [leave, setLeave] = useState({ leave_type: 'Annual Leave', from_date: '2026-12-10', to_date: '2026-12-12', days: 3, reason: '' });

  const load = async () => {
    const d = await apiFetch<{ compliance: any[]; leaves: any[] }>('/api/hr');
    setData(d);
  };
  useEffect(() => {
    void load();
  }, []);

  const applyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/api/hr/leaves', { method: 'POST', body: JSON.stringify(leave) });
    toast('Leave request submitted to HR & Owner');
    setLeave({ ...leave, reason: '' });
    await load();
  };

  const decide = async (id: string, decision: 'Approved' | 'Rejected') => {
    try {
      await apiFetch(`/api/hr/leaves/${id}/decide`, { method: 'POST', body: JSON.stringify({ decision }) });
      toast(`Leave ${decision}`);
      await load();
    } catch (e: any) {
      toast(e.message, 'err');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="MOHRE WPS · UAE Visas · Emirates IDs · Leave Requests"
        title="HR, Visas &"
        accent="WPS Payroll"
        subtitle="Keep every Betterway team member's UAE Visa, Emirates ID, annual leave, and monthly WPS payroll slip 100% on track."
      />
      <div className="bw-card overflow-x-auto">
        <div className="px-5 py-3.5 border-b border-[var(--bw-line)] font-bold text-sm flex items-center gap-2">
          <Users size={16} className="text-[#179373]" /> Staff UAE Visas, Emirates IDs &amp; Monthly WPS Payroll
        </div>
        <table className="w-full text-left text-xs min-w-[820px]">
          <thead className="bg-[var(--bw-soft)] text-[10.5px] uppercase text-[var(--bw-muted)]">
            <tr>
              <th className="p-3.5">Staff Member</th>
              <th className="p-3.5">Role</th>
              <th className="p-3.5">Emirates ID Expiry</th>
              <th className="p-3.5">UAE Visa Expiry</th>
              <th className="p-3.5">Monthly WPS Total</th>
              <th className="p-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--bw-line)]">
            {data.compliance.map((c) => (
              <tr key={c.user_id}>
                <td className="p-3.5 font-bold">{c.user_name}</td>
                <td className="p-3.5 text-[var(--bw-muted)]">{c.designation}</td>
                <td className="p-3.5 font-mono-num">{c.emirates_id_expiry}</td>
                <td className="p-3.5 font-mono-num">{c.visa_expiry}</td>
                <td className="p-3.5 font-mono-num font-bold text-[#179373]">{fmtAed(c.basic_salary_aed + c.allowance_aed)}</td>
                <td className="p-3.5"><StatusPill label={c.wps_status} tone={c.wps_status.includes('Due') ? 'gold' : 'emerald'} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid lg:grid-cols-12 gap-5 text-xs">
        <form onSubmit={applyLeave} className="lg:col-span-5 bw-card p-5 space-y-3">
          <h3 className="text-sm font-bold">Request Leave</h3>
          <select value={leave.leave_type} onChange={(e) => setLeave({ ...leave, leave_type: e.target.value })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)]">
            <option>Annual Leave</option><option>Sick Leave</option><option>Emergency Leave</option>
          </select>
          <div className="grid grid-cols-3 gap-2">
            <input type="date" value={leave.from_date} onChange={(e) => setLeave({ ...leave, from_date: e.target.value })} className="h-9 px-2 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] font-mono-num" />
            <input type="date" value={leave.to_date} onChange={(e) => setLeave({ ...leave, to_date: e.target.value })} className="h-9 px-2 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] font-mono-num" />
            <input type="number" min={1} value={leave.days} onChange={(e) => setLeave({ ...leave, days: Number(e.target.value) })} className="h-9 px-2 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] font-mono-num" />
          </div>
          <input required value={leave.reason} onChange={(e) => setLeave({ ...leave, reason: e.target.value })} placeholder="Handover advisor & reason…" className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)]" />
          <button type="submit" className="w-full h-10 rounded-full bg-[#179373] text-white font-bold cursor-pointer">Submit Leave Request</button>
        </form>

        <div className="lg:col-span-7 bw-card p-5 space-y-3">
          <h3 className="text-sm font-bold">Leave Approvals Queue</h3>
          {data.leaves.map((l) => (
            <div key={l.id} className="p-3.5 rounded-2xl bg-[var(--bw-soft)]/70 border border-[var(--bw-line)] flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-bold">{l.user_name} · {l.leave_type} ({l.days}d)</div>
                <div className="text-[var(--bw-muted)]">{l.from_date} → {l.to_date} · {l.reason}</div>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill label={l.status} tone={l.status === 'Approved' ? 'emerald' : l.status === 'Rejected' ? 'red' : 'gold'} />
                {l.status === 'Pending' && (user?.is_elevated === 1 || user?.role === 'HR_MANAGER') && (
                  <>
                    <button type="button" onClick={() => void decide(l.id, 'Approved')} className="px-3 py-1 rounded-full bg-[#179373] text-white font-bold cursor-pointer">Approve</button>
                    <button type="button" onClick={() => void decide(l.id, 'Rejected')} className="px-3 py-1 rounded-full bg-red-600 text-white font-bold cursor-pointer">Reject</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function WebsiteStudioPage() {
  const { toast } = useAuth();
  const [offers, setOffers] = useState<any[]>([]);

  const load = async () => {
    const d = await apiFetch<{ offers: any[] }>('/api/website-studio');
    setOffers(d.offers || []);
  };
  useEffect(() => {
    void load();
  }, []);

  const toggle = async (id: string, patch: any) => {
    await apiFetch(`/api/website-studio/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
    toast('Updated live offer on betterwaymortgages.com!');
    await load();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Live Control for betterwaymortgages.com"
        title="Website Studio &"
        accent="Live Bank Offers"
        subtitle="Turn bank rate cards and Hot Mortgage Spotlights on or off on betterwaymortgages.com — leads flow directly into Betterway OS via /api/v1/intake/leads."
      />
      <div className="grid md:grid-cols-2 gap-4">
        {offers.map((o) => (
          <div key={o.id} className="bw-card p-5 flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center justify-between gap-2">
                <BankBadge bankKey={o.bank_key} />
                <div className="flex gap-1.5">
                  <StatusPill label={o.rate_badge} tone="emerald" />
                  {o.spotlight === 1 && <StatusPill label="Trending Spotlight" tone="gold" />}
                </div>
              </div>
              <h3 className="text-base font-bold mt-3">{o.headline}</h3>
              <p className="text-xs text-[var(--bw-muted)] mt-1">{o.subline}</p>
            </div>
            <div className="pt-3 border-t border-[var(--bw-line)] flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-mono-num text-[#179373] font-bold flex items-center gap-1">
                <Globe size={13} /> {o.enquiries_count} website enquiries · {o.audience}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void toggle(o.id, { spotlight: !o.spotlight })}
                  className="px-3 py-1.5 rounded-full border border-[var(--bw-line)] font-bold cursor-pointer"
                >
                  {o.spotlight ? 'Unpin Spotlight' : 'Pin Spotlight'}
                </button>
                <button
                  type="button"
                  onClick={() => void toggle(o.id, { published: !o.published })}
                  className={`px-3 py-1.5 rounded-full font-bold inline-flex items-center gap-1 cursor-pointer ${
                    o.published ? 'bg-[#179373] text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  <CheckCircle2 size={12} /> {o.published ? 'Live on Site' : 'Hidden'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
