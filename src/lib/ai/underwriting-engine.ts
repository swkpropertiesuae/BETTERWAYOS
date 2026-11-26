import crypto from 'node:crypto';
import type { SessionUser } from '@/lib/domain/types';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { scrubPiiForLlm } from './pii-shield';
import { EIBOR_SNAPSHOT } from '@/lib/domain/banks';

export interface MatchedCaseStudy {
  id: string;
  scenario_code: string;
  title: string;
  category: string;
  borrower_profile: string;
  mortgage_type: string;
  income_summary?: string;
  property_summary?: string;
  challenge: string;
  winning_bank: string;
  structuring_solution: string;
  outcome_lessons: string;
  score: number;
}

export async function addTrainedCaseStudy(
  input: {
    title: string;
    category: string;
    borrowerProfile: string;
    mortgageType: string;
    incomeSummary?: string;
    propertySummary?: string;
    challenge: string;
    banksConsidered?: string[];
    winningBank?: string;
    structuringSolution: string;
    cbuaeRulesApplied?: string[];
    outcomeLessons: string;
    tags?: string[];
  },
  actor: SessionUser,
) {
  const db = await getSupabaseAdmin();
  const code = `CS-${new Date().getFullYear()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  const { data, error } = await db
    .from('case_study_scenarios')
    .insert({
      scenario_code: code,
      title: input.title.trim(),
      category: input.category || 'Custom Trained Scenario',
      borrower_profile: input.borrowerProfile || 'salaried',
      mortgage_type: input.mortgageType || 'Resale Purchase (Secondary)',
      income_summary: input.incomeSummary || '',
      property_summary: input.propertySummary || '',
      challenge: input.challenge.trim(),
      banks_considered: input.banksConsidered ?? [],
      winning_bank: input.winningBank || '',
      structuring_solution: input.structuringSolution.trim(),
      cbuae_rules_applied: input.cbuaeRulesApplied ?? [],
      outcome_lessons: input.outcomeLessons.trim(),
      tags: input.tags ?? [],
      source_ref: `Trained by ${actor.name} (${actor.designation})`,
      verified: true,
      created_by: actor.id,
    })
    .select('*')
    .single();
  if (error || !data) throw new Error(`Failed to train case study: ${error?.message}`);
  return data;
}

export async function answerUnderwritingQuery(prompt: string, user: SessionUser) {
  const { sanitized, redactions } = scrubPiiForLlm(prompt);
  const db = await getSupabaseAdmin();

  const [{ data: scenarios }, { count: activeCases }, { count: bankCount }] = await Promise.all([
    db.from('case_study_scenarios').select('*').order('created_at', { ascending: false }),
    db.from('mortgage_cases').select('*', { count: 'exact', head: true }).eq('deleted_soft', false),
    db.from('banks').select('*', { count: 'exact', head: true }),
  ]);

  const tokens = sanitized
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2);

  const scored: MatchedCaseStudy[] = (scenarios ?? [])
    .map((s) => {
      const haystack = [
        s.scenario_code,
        s.title,
        s.category,
        s.borrower_profile,
        s.mortgage_type,
        s.income_summary,
        s.property_summary,
        s.challenge,
        s.winning_bank,
        s.structuring_solution,
        s.outcome_lessons,
        ...(Array.isArray(s.tags) ? s.tags : []),
      ]
        .join(' ')
        .toLowerCase();

      let score = 0;
      for (const tok of tokens) {
        if (haystack.includes(tok)) score += tok.length >= 5 ? 3 : 1;
      }
      return { ...s, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const topMatches = scored.length > 0 ? scored : ((scenarios ?? []).slice(0, 2).map((s) => ({ ...s, score: 1 })) as MatchedCaseStudy[]);

  // Optional external LLM synthesis strictly over PII-scrubbed prompt & matched Betterway scenarios
  let llmAnswer: string | null = null;
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (geminiKey) {
    try {
      const contextBlock = topMatches
        .map(
          (m) =>
            `[${m.scenario_code}] ${m.title}\nChallenge: ${m.challenge}\nWinning Bank: ${m.winning_bank}\nSolution: ${m.structuring_solution}\nLesson: ${m.outcome_lessons}`,
        )
        .join('\n\n');
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `You are Betterway Mortgages LLC's Senior UAE Mortgage Underwriting AI (Dubai, CBUAE rules, 24 partner banks, 3M EIBOR ${EIBOR_SNAPSHOT.latest.threeMonth}%).\nUser (${user.name}, ${user.designation}) asks (PII-scrubbed): ${sanitized}\n\nGrounded Betterway Case Studies:\n${contextBlock}\n\nProvide a crisp, structured UAE mortgage underwriting recommendation citing the scenario codes.`,
                  },
                ],
              },
            ],
          }),
          signal: AbortSignal.timeout(12_000),
        },
      );
      if (r.ok) {
        const j = await r.json();
        llmAnswer = j?.candidates?.[0]?.content?.parts?.[0]?.text || null;
      }
    } catch {
      /* gracefully fall back to deterministic Betterway Case-Study Engine below */
    }
  }

  const deterministicAnswer = [
    `### Betterway AI Underwriting Desk (${bankCount ?? 24} UAE Banks · 3M EIBOR ${EIBOR_SNAPSHOT.latest.threeMonth}% · ${activeCases ?? 0} Active Cases)`,
    redactions > 0 ? `> **PDPL PII Shield Active:** ${redactions} sensitive identifier(s) stripped before AI reasoning.` : '',
    '',
    ...topMatches.map(
      (m) =>
        `**${m.scenario_code} — ${m.title}** (${m.category} · Winning Bank: *${m.winning_bank || 'Panel Best'}*)\n${m.income_summary ? `- **Income / Threshold:** ${m.income_summary}\n` : ''}- **Challenge:** ${m.challenge}\n- **Structuring Solution:** ${m.structuring_solution}\n- **Key Lesson:** ${m.outcome_lessons}`,
    ),
  ]
    .filter(Boolean)
    .join('\n\n');

  return {
    answer: llmAnswer || deterministicAnswer,
    provider: llmAnswer ? 'Gemini + Betterway Case-Study RAG (PII-Shielded)' : 'Betterway Deterministic Case-Study Engine (Zero-Leak Local)',
    redactions,
    sanitizedPrompt: sanitized,
    matchedScenarios: topMatches,
  };
}
