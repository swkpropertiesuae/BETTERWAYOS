'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { BookOpen, BrainCircuit, CheckCircle2, Plus, Send, ShieldCheck, Sparkles } from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { PageHeader, StatusPill } from '@/components/os/UiKit';

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

interface CopilotResponse {
  answer: string;
  provider: string;
  redactions: number;
  sanitizedPrompt: string;
  matchedScenarios: Scenario[];
}

export default function AiCopilotPage() {
  const { user } = useOs();
  const [prompt, setPrompt] = useState(
    'Self-employed business owner with no 2-year audited financials, personal account receives AED 55,000/mo, wants to buy AED 2.8M Dubai Hills townhouse — which UAE banks and rules apply?',
  );
  const [reply, setReply] = useState<CopilotResponse | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  // Train new case study form
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
    loadScenarios();
  }, [loadScenarios]);

  async function askCopilot(e: React.FormEvent) {
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
      if (!r.ok) throw new Error(j.error || 'Copilot failed');
      setReply(j);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  async function trainScenario(e: React.FormEvent) {
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
      if (!r.ok) throw new Error(j.error || 'Training failed');
      setNotice(`Trained new AI Case Study ${j.scenario.scenario_code} ("${j.scenario.title}"). Copilot can cite it immediately!`);
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

  const canTrain =
    user?.role === 'OWNER' || user?.role === 'TEAM_MANAGER' || user?.role === 'OPERATIONS_MANAGER';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="PDPL PII-Shielded AI · 15-Year Betterway Case-Study Knowledge Base · 24 UAE Banks"
        title="AI Underwriting Copilot &"
        accent="Case-Study Trainer"
        subtitle="Ask any UAE mortgage structuring question grounded in Betterway's verified case studies. Emirates IDs, phone numbers, emails & IBANs are automatically redacted before reasoning. Owners & Managers can train new real-world scenarios live."
      />

      {error && <div className="rounded-xl border border-red-400/40 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</div>}
      {notice && (
        <div className="rounded-xl border border-emerald-500/35 bg-emerald-50 dark:bg-emerald-950/30 p-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 size={14} /> {notice}
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Left 3 cols: Copilot Desk */}
        <div className="lg:col-span-3 space-y-4">
          <form onSubmit={askCopilot} className="rounded-2xl bg-[#025e3d] text-white border border-[#D4AF37]/40 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold flex items-center gap-2 text-[#FCF1B7]">
                <BrainCircuit size={16} className="text-[#34DFAC]" /> Ask Betterway Senior Underwriting AI
              </h2>
              <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-[#34DFAC] border border-emerald-400/30">
                <ShieldCheck size={12} /> PDPL PII Shield Active
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
                  className="text-[10.5px] px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition"
                >
                  {q}
                </button>
              ))}
            </div>

            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe borrower profile, salary/CTO, DBR liabilities, community, LTV goal... (Any EID/phone/IBAN pasted will be auto-redacted!)"
              className="w-full rounded-xl bg-white/10 border border-white/15 p-3 text-xs text-white placeholder:text-slate-400"
              required
            />
            <button
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0B664F] text-white px-5 py-2.5 text-xs font-bold hover:brightness-110 disabled:opacity-50"
            >
              <Send size={13} /> {busy ? 'Analyzing Case Studies…' : 'Get Grounded Underwriting Strategy'}
            </button>
          </form>

          {reply && (
            <div className="rounded-2xl bg-[var(--bw-card)] border border-[var(--bw-line)] p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--bw-line)] pb-3">
                <div className="flex items-center gap-2 text-xs font-extrabold">
                  <Sparkles size={15} className="text-[var(--bw-emerald)]" /> {reply.provider}
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill
                    label={reply.redactions > 0 ? `${reply.redactions} PII Token(s) Redacted` : 'Zero PII Detected'}
                    tone={reply.redactions > 0 ? 'gold' : 'emerald'}
                  />
                  <StatusPill label={`${reply.matchedScenarios.length} Case Studies Cited`} tone="navy" />
                </div>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-xs sm:text-[13px] leading-relaxed text-[var(--bw-ink)]">
                {reply.answer}
              </pre>
            </div>
          )}
        </div>

        {/* Right 2 cols: Train New Case Study */}
        <div className="lg:col-span-2 space-y-4">
          {canTrain && (
            <form onSubmit={trainScenario} className="rounded-2xl bg-[var(--bw-card)] border border-[var(--bw-line)] p-5 space-y-3">
              <h2 className="text-sm font-extrabold flex items-center gap-1.5">
                <Plus size={15} className="text-[var(--bw-emerald)]" /> Train New Case Study into AI Model
              </h2>
              <p className="text-[11px] text-[var(--bw-muted)]">
                Every real underwriting win or bank policy exception you log here is permanently stored in Supabase and instantly searchable by the AI Copilot.
              </p>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Scenario Title (e.g. Crypto Founder Equity Release via Mashreq)"
                className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 text-xs"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Category"
                  className="rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 text-xs"
                />
                <input
                  value={winningBank}
                  onChange={(e) => setWinningBank(e.target.value)}
                  placeholder="Winning Bank"
                  className="rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={borrowerProfile}
                  onChange={(e) => setBorrowerProfile(e.target.value)}
                  className="rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] px-2.5 py-2 text-xs"
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
                  className="rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 text-xs"
                />
              </div>
              <input
                value={incomeSummary}
                onChange={(e) => setIncomeSummary(e.target.value)}
                placeholder="Income / CTO / Average Balance Summary"
                className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 text-xs"
              />
              <textarea
                rows={2}
                value={challenge}
                onChange={(e) => setChallenge(e.target.value)}
                placeholder="Underwriting Challenge / Rejection Risk..."
                className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent p-2.5 text-xs"
                required
              />
              <textarea
                rows={2}
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                placeholder="Winning Structuring Solution..."
                className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent p-2.5 text-xs"
                required
              />
              <textarea
                rows={2}
                value={lessons}
                onChange={(e) => setLessons(e.target.value)}
                placeholder="Key Advisory Lesson for Team..."
                className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent p-2.5 text-xs"
                required
              />
              <input
                value={tagsRaw}
                onChange={(e) => setTagsRaw(e.target.value)}
                placeholder="Tags (comma-separated)"
                className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 text-xs"
              />
              <button disabled={busy} className="w-full rounded-xl bg-[#025e3d] text-[#FCF1B7] py-2.5 text-xs font-bold">
                Save &amp; Train AI Knowledge Base
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Trained Case-Study Library */}
      <div className="rounded-2xl bg-[var(--bw-card)] border border-[var(--bw-line)] p-5 space-y-4">
        <h2 className="text-sm font-extrabold flex items-center gap-2">
          <BookOpen size={15} className="text-[var(--bw-emerald)]" /> Trained Betterway Underwriting Case-Study Library ({scenarios.length} Scenarios)
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {scenarios.map((sc) => (
            <div key={sc.id} className="rounded-xl border border-[var(--bw-line)] p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-[var(--bw-emerald)]">{sc.scenario_code}</span>
                <StatusPill label={sc.winning_bank || sc.category} tone="navy" />
              </div>
              <div className="font-extrabold text-[13px] leading-snug">{sc.title}</div>
              {sc.income_summary && <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">{sc.income_summary}</div>}
              <p className="text-[11px] text-[var(--bw-muted)]">
                <strong>Challenge:</strong> {sc.challenge}
              </p>
              <p className="text-[11px]">
                <strong>Solution:</strong> {sc.structuring_solution}
              </p>
              <div className="text-[10.5px] text-emerald-700 dark:text-emerald-300 border-t border-[var(--bw-line)] pt-2">
                <strong>Lesson:</strong> {sc.outcome_lessons}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
