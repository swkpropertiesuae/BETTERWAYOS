'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { BookOpen, CheckCircle2, Landmark, Plus, Search, ShieldCheck } from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { GlossyBlackCard, PageHeader, StatusPill } from '@/components/os/UiKit';

interface Scenario {
  id: string;
  scenario_code: string;
  title: string;
  category: string;
  borrower_profile: string;
  mortgage_type: string;
  income_summary: string;
  challenge: string;
  winning_bank: string;
  structuring_solution: string;
  outcome_lessons: string;
  tags: string[];
  source_ref: string;
}

interface DeskMemoResponse {
  answer: string;
  provider: string;
  redactions: number;
  sanitizedPrompt: string;
  matchedScenarios: Scenario[];
}

export default function UnderwritingCasePlaybookPage() {
  const { user } = useOs();
  const [prompt, setPrompt] = useState(
    'Self-employed business owner with no 2-year audited financials, personal account receives AED 55,000/mo, wants to buy AED 2.8M Dubai Hills townhouse — which UAE banks and rules apply?',
  );
  const [reply, setReply] = useState<DeskMemoResponse | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  // Log new closed case precedent
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Private Wealth / Complex Structuring');
  const [borrowerProfile, setBorrowerProfile] = useState('self_employed_full');
  const [mortgageType, setMortgageType] = useState('Resale Purchase (Secondary)');
  const [incomeSummary, setIncomeSummary] = useState('');
  const [challenge, setChallenge] = useState('');
  const [winningBank, setWinningBank] = useState('Emirates NBD');
  const [solution, setSolution] = useState('');
  const [lessons, setLessons] = useState('');
  const [tagsRaw, setTagsRaw] = useState('golden-visa, high-ltv');

  const loadScenarios = useCallback(async () => {
    const r = await fetch('/api/v1/ai/case-studies', { cache: 'no-store' });
    if (r.ok) {
      const j = await r.json();
      setScenarios(j.scenarios ?? []);
    }
  }, []);

  useEffect(() => {
    void loadScenarios();
  }, [loadScenarios]);

  async function lookupStructuringBrief(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/v1/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Could not match credit desk precedents');
      setReply(j);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  async function saveNewPrecedent(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const r = await fetch('/api/v1/ai/case-studies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          borrowerProfile,
          mortgageType,
          incomeSummary,
          challenge,
          winningBank,
          structuringSolution: solution,
          outcomeLessons: lessons,
          tags: tagsRaw
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Could not save case study');
      setNotice(
        `Saved Case Precedent ${j.scenario.scenario_code} ("${j.scenario.title}") to Betterway's Credit Desk Playbook.`,
      );
      setTitle('');
      setIncomeSummary('');
      setChallenge('');
      setSolution('');
      setLessons('');
      await loadScenarios();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  const canLogCase =
    user?.role === 'OWNER' || user?.role === 'TEAM_MANAGER' || user?.role === 'OPERATIONS_MANAGER';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Betterway Credit Desk · 15-Year Dubai Underwriting Playbook · 24 UAE Banks"
        title="Underwriting Case"
        accent="Playbook"
        subtitle="Search real structuring precedents and bank policy exceptions closed by Betterway's senior advisory team. Emirates IDs, phone numbers, emails & IBANs are automatically masked under UAE PDPL rules."
      />

      {error && (
        <div className="rounded-xl border border-red-400/40 bg-red-50 p-3 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-xl border border-emerald-500/35 bg-emerald-50 dark:bg-emerald-950/30 p-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 size={14} /> {notice}
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Left 3 cols: Credit Desk Precedent Lookup */}
        <div className="lg:col-span-3 space-y-4">
          <GlossyBlackCard className="p-5 sm:p-6 space-y-3.5" accent="dual">
            <form onSubmit={lookupStructuringBrief} className="space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-sm font-extrabold flex items-center gap-2 text-[#dfc285]">
                  <Landmark size={16} className="text-[#64c4a8]" /> Search Betterway Structuring Precedents
                </h2>
                <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-[#64c4a8] border border-emerald-400/30">
                  <ShieldCheck size={12} /> PDPL PII Redaction On
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  'Low-Doc self-employed personal statement >40k/mo rules',
                  'Non-resident overseas buyer 40k in 4 transactions Golden Visa',
                  'Buy-out plus equity cash-out for second investment property',
                  'Off-plan 50% construction handover financing rules',
                ].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setPrompt(q)}
                    className="text-[10.5px] px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 cursor-pointer transition"
                  >
                    {q}
                  </button>
                ))}
              </div>

              <textarea
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe borrower profile, salary/CTO, DBR liabilities, community, LTV goal... (Any EID/phone/IBAN pasted is automatically masked)"
                className="w-full rounded-xl bg-white/10 border border-white/15 p-3 text-xs text-white placeholder:text-slate-400 outline-none focus:border-[#47a88d]"
                required
              />
              <button
                type="submit"
                disabled={busy}
                className="bw-btn bw-btn-primary text-xs py-2.5 min-h-[40px] disabled:opacity-50"
              >
                <Search size={13} /> {busy ? 'Reviewing Credit Precedents…' : 'Review Matching Bank Playbooks'}
              </button>
            </form>
          </GlossyBlackCard>

          {reply && (
            <div className="bw-card p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--bw-line)] pb-3">
                <div className="flex items-center gap-2 text-xs font-extrabold">
                  <BookOpen size={15} className="text-[var(--bw-emerald)]" /> Betterway Senior Credit Desk Brief
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill
                    label={reply.redactions > 0 ? `${reply.redactions} PII Field(s) Masked` : 'Zero PII Detected'}
                    tone={reply.redactions > 0 ? 'gold' : 'emerald'}
                  />
                  <StatusPill label={`${reply.matchedScenarios.length} Precedents Cited`} tone="navy" />
                </div>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-xs sm:text-[13px] leading-relaxed text-[var(--bw-ink)]">
                {reply.answer}
              </pre>
            </div>
          )}
        </div>

        {/* Right 2 cols: Log New Real-World Case Precedent */}
        <div className="lg:col-span-2 space-y-4">
          {canLogCase && (
            <form onSubmit={saveNewPrecedent} className="bw-card p-5 space-y-3">
              <h2 className="font-display text-sm font-extrabold flex items-center gap-1.5">
                <Plus size={15} className="text-[var(--bw-emerald)]" /> Record New Closed Case Precedent
              </h2>
              <p className="text-[11px] text-[var(--bw-muted)]">
                Log real bank approvals, credit committee exceptions, and structuring wins so every Betterway advisor can reference them immediately.
              </p>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Case Title (e.g. Business Owner Equity Release via Mashreq)"
                className="w-full rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] px-3 py-2 text-xs"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Category"
                  className="rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] px-3 py-2 text-xs"
                />
                <input
                  value={winningBank}
                  onChange={(e) => setWinningBank(e.target.value)}
                  placeholder="Approved Bank"
                  className="rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] px-3 py-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={borrowerProfile}
                  onChange={(e) => setBorrowerProfile(e.target.value)}
                  className="rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] px-2.5 py-2 text-xs"
                >
                  <option value="salaried">UAE Salaried</option>
                  <option value="self_employed_full">Self-Employed Full-Doc</option>
                  <option value="self_employed_low_doc">Self-Employed Low-Doc</option>
                  <option value="non_resident">Non-Resident</option>
                  <option value="uae_national">UAE National</option>
                </select>
                <input
                  value={mortgageType}
                  onChange={(e) => setMortgageType(e.target.value)}
                  placeholder="Mortgage Type"
                  className="rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] px-3 py-2 text-xs"
                />
              </div>
              <input
                value={incomeSummary}
                onChange={(e) => setIncomeSummary(e.target.value)}
                placeholder="Income / CTO / Average Balance Summary"
                className="w-full rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] px-3 py-2 text-xs"
              />
              <textarea
                rows={2}
                value={challenge}
                onChange={(e) => setChallenge(e.target.value)}
                placeholder="Underwriting Challenge / Credit Hurdle..."
                className="w-full rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] p-2.5 text-xs"
                required
              />
              <textarea
                rows={2}
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                placeholder="Approved Structuring Solution..."
                className="w-full rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] p-2.5 text-xs"
                required
              />
              <textarea
                rows={2}
                value={lessons}
                onChange={(e) => setLessons(e.target.value)}
                placeholder="Key Advisory Takeaway for Advisors..."
                className="w-full rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] p-2.5 text-xs"
                required
              />
              <input
                value={tagsRaw}
                onChange={(e) => setTagsRaw(e.target.value)}
                placeholder="Tags (comma-separated)"
                className="w-full rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] px-3 py-2 text-xs"
              />
              <button disabled={busy} className="bw-btn bw-btn-obsidian w-full text-xs">
                Save Case Precedent to Playbook
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Verified Case-Study Archive */}
      <div className="bw-card p-5 space-y-4">
        <h2 className="font-display text-sm font-extrabold flex items-center gap-2">
          <BookOpen size={15} className="text-[var(--bw-emerald)]" /> Betterway Verified Underwriting Archive ({scenarios.length} Cases)
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {scenarios.map((sc) => (
            <div key={sc.id} className="rounded-xl border border-[var(--bw-line)] bg-[var(--bw-soft)]/40 p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-[var(--bw-emerald)]">{sc.scenario_code}</span>
                <StatusPill label={sc.winning_bank || sc.category} tone="navy" />
              </div>
              <div className="font-extrabold text-[13px] leading-snug">{sc.title}</div>
              {sc.income_summary && (
                <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">{sc.income_summary}</div>
              )}
              <p className="text-[11px] text-[var(--bw-muted)]">
                <strong>Challenge:</strong> {sc.challenge}
              </p>
              <p className="text-[11px]">
                <strong>Solution:</strong> {sc.structuring_solution}
              </p>
              <div className="text-[10.5px] text-emerald-700 dark:text-emerald-300 border-t border-[var(--bw-line)] pt-2">
                <strong>Desk Takeaway:</strong> {sc.outcome_lessons}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
