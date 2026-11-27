import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  assertCleanBetterwayPublicText,
  BROCHURE_THEME_PRESETS,
  buildDefaultStagesForTrack,
  CLOSING_TRACKS,
  COMMISSION_PAYMENT_MODES,
  computeAgentSettlementSummary,
  extractTemplatePlaceholders,
  fillTemplateText,
  normalizeBrochureTheme,
  summarizeChequeLedger,
} from '@/lib/workspace/domain';

describe('Warda & Shabib Workspace Command Suite — Offline Domain & Schema Contracts', () => {
  it('verifies migration 006 exists with all 4 workspace tables, RLS, and 6 UAE legal form templates', () => {
    const migPath = path.join(process.cwd(), 'supabase', 'migrations', '006_owner_workspace_command_suite.sql');
    expect(fs.existsSync(migPath)).toBe(true);
    const sql = fs.readFileSync(migPath, 'utf8');

    for (const table of [
      'forensic_field_reports',
      'closing_forensic_dossiers',
      'closing_cheque_ledger',
      'owner_commission_expenses',
    ]) {
      expect(sql).toContain(`CREATE TABLE IF NOT EXISTS public.${table}`);
      expect(sql).toContain(`'${table}'`);
    }

    for (const tplCode of [
      'BW-A2A-FORMI',
      'BW-LOI-OFFER',
      'BW-TENANCY-RERA',
      'BW-EJARI-PACK',
      'BW-NOC-PACK',
      'BW-AGREEMENT-PACK',
    ]) {
      expect(sql).toContain(tplCode);
    }
  });

  it('normalizes brochure themes, validates custom hexes, and enforces Zero-SWK public brochure guard', () => {
    expect(Object.keys(BROCHURE_THEME_PRESETS)).toHaveLength(5);
    const custom = normalizeBrochureTheme({
      preset: 'custom',
      primaryHex: '#123456',
      accentHex: 'bad-color',
      coverLayout: 'editorial_split',
    });
    expect(custom.primaryHex).toBe('#123456');
    expect(custom.accentHex).toBe('#D4AF37'); // fell back safely
    expect(custom.coverLayout).toBe('editorial_split');

    expect(() => assertCleanBetterwayPublicText({ title: 'Betterway Mortgages Dubai Hills Brochure' })).not.toThrow();
    expect(() => assertCleanBetterwayPublicText({ footer: 'Powered by SWK Properties' })).toThrow(/ZERO_SWK_GUARD/);
  });

  it('generates complete pin-to-pin closing stages across all 5 tracks and accurately summarizes cheque ledgers', () => {
    expect(CLOSING_TRACKS).toEqual(['Off-Plan', 'Secondary', 'Handover', 'Leasing', 'Property Management']);
    for (const track of CLOSING_TRACKS) {
      const stages = buildDefaultStagesForTrack(track);
      expect(stages.length).toBeGreaterThanOrEqual(8);
      expect(stages[0].step).toBe(1);
      expect(stages[0].status).toBe('In Progress');
    }

    const summary = summarizeChequeLedger([
      { amount_aed: 250_000, status: 'Cleared' },
      { amount_aed: 50_000, status: 'Paid' },
      { amount_aed: 100_000, status: 'Received' },
      { amount_aed: 75_000, status: 'Pending' },
      { amount_aed: 25_000, status: 'Bounced' },
    ]);
    expect(summary.totalCheques).toBe(5);
    expect(summary.totalAmountAed).toBe(500_000);
    expect(summary.clearedAed).toBe(300_000);
    expect(summary.receivedAed).toBe(100_000);
    expect(summary.pendingAed).toBe(75_000);
    expect(summary.bouncedAed).toBe(25_000);
  });

  it('extracts fillable placeholders from UAE legal agreements and renders filled document text cleanly', () => {
    const sample = 'Date: [Agreement_Date] | Party B: [Party_B_Agent_Name] | Email: [Party_B_Email] | Deal: AED [Deal_Amount_AED] | [x] Verified';
    const fields = extractTemplatePlaceholders(sample);
    expect(fields.map((f) => f.token)).toEqual(['Agreement_Date', 'Party_B_Agent_Name', 'Party_B_Email', 'Deal_Amount_AED']);
    expect(fields.find((f) => f.token === 'Agreement_Date')?.inputType).toBe('date');
    expect(fields.find((f) => f.token === 'Party_B_Email')?.inputType).toBe('email');
    expect(fields.find((f) => f.token === 'Deal_Amount_AED')?.inputType).toBe('number');

    const filled = fillTemplateText(sample, {
      Agreement_Date: '2026-11-27',
      Party_B_Agent_Name: 'Amina Hassan',
      Deal_Amount_AED: '3,200,000',
    });
    expect(filled).toContain('Date: 2026-11-27');
    expect(filled).toContain('Party B: Amina Hassan');
    expect(filled).toContain('[Party_B_Email]'); // untouched if blank
    expect(filled).toContain('[x] Verified');
  });

  it('computes Agent Commission, Agent Expense, Advance & 3rd-Party Split net settlement balances across Cash/BT/Botim', () => {
    expect(COMMISSION_PAYMENT_MODES).toContain('Cash');
    expect(COMMISSION_PAYMENT_MODES).toContain('Bank Transfer (BT)');
    expect(COMMISSION_PAYMENT_MODES).toContain('Botim');

    const res = computeAgentSettlementSummary([
      {
        agent_name: 'Asif Khan',
        entry_type: 'Commission to Agent',
        gross_amount_aed: 40_000,
        split_pct: 50,
        net_amount_aed: 20_000,
        status: 'Received',
        payment_mode: 'Bank Transfer (BT)',
        is_third_party: false,
      },
      {
        agent_name: 'Asif Khan',
        entry_type: 'Expense by Agent',
        gross_amount_aed: 1_500,
        split_pct: 100,
        net_amount_aed: 1_500,
        status: 'Pending',
        payment_mode: 'Cash',
        is_third_party: false,
      },
      {
        agent_name: 'Asif Khan',
        entry_type: 'Agent Advance',
        gross_amount_aed: 3_000,
        split_pct: 100,
        net_amount_aed: 3_000,
        status: 'Paid',
        payment_mode: 'Botim',
        is_third_party: false,
      },
      {
        agent_name: 'External Co-Broker',
        entry_type: '3rd-Party Split',
        gross_amount_aed: 40_000,
        split_pct: 25,
        net_amount_aed: 10_000,
        status: 'Paid',
        payment_mode: 'Bank Transfer (BT)',
        is_third_party: true,
      },
    ]);

    expect(res.totals.totalReceivedAed).toBe(20_000);
    expect(res.totals.totalPaidAed).toBe(13_000);
    expect(res.totals.totalPendingAed).toBe(1_500);
    expect(res.totals.totalExpensesAed).toBe(1_500);
    expect(res.totals.totalThirdPartyAed).toBe(10_000);

    const asif = res.agents.find((a) => a.agentName === 'Asif Khan');
    expect(asif?.netBalanceDueAed).toBe(18_500); // 20,000 + 1,500 - 3,000
  });
});
