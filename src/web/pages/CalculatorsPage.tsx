import { useMemo, useState } from 'react';
import { Award, Calculator, CheckCircle2, Printer, Save, ShieldAlert, ShieldCheck } from 'lucide-react';
import {
  borrowingPower,
  buyoutSavings,
  cashToClose,
  CBUAE_RULE_VERSION,
  chequeSplit,
  emi,
  evaluateUnderwritingPolicy,
  fixedThenRevert,
  goldenVisaCheck,
  handoverRelease,
  lifeInsuranceSavings,
} from '@shared/cbuae-math';
import { EIBOR_SNAPSHOT, UAE_BANKS } from '@shared/banks-data';
import { type BorrowerProfileType } from '@shared/workflow-constants';
import { apiFetch, fmtAed } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { PageHeader, StatusPill } from '../components/UiPrimitives';

export function CalculatorsPage() {
  const { toast } = useAuth();
  const [borrowerName, setBorrowerName] = useState('Prospective Dubai Homebuyer');
  const [profile, setProfile] = useState<BorrowerProfileType>('salaried');
  const [price, setPrice] = useState(2_850_000);
  const [downPct, setDownPct] = useState(20);
  const [tenure, setTenure] = useState(25);
  const [bankKey, setBankKey] = useState('emirates-nbd');
  const [fixedYears, setFixedYears] = useState(3);
  const [salary, setSalary] = useState(55_000);
  const [existingEmis, setExistingEmis] = useState(3_000);
  const [cardLimits, setCardLimits] = useState(30_000);
  const [age, setAge] = useState(36);
  const [currentBuyoutRate, setCurrentBuyoutRate] = useState(5.45);
  const [handoverVal, setHandoverVal] = useState(3_200_000);
  const [saving, setSaving] = useState(false);

  const selectedBank = UAE_BANKS.find((b) => b.key === bankKey) || UAE_BANKS[0]!;
  const loan = Math.max(0, price * (1 - downPct / 100));

  const calc = useMemo(() => {
    const monthlyEmi = emi(loan, selectedBank.indicativeFixed3Y, tenure);
    const dbr = borrowingPower({ salary, existingEmis, cardLimits, years: tenure });
    const cash = cashToClose({ price, downPct, bankFeePct: selectedBank.processingFeePct });
    const revert = fixedThenRevert(
      loan,
      tenure,
      selectedBank.indicativeFixed3Y,
      fixedYears,
      EIBOR_SNAPSHOT.latest.threeMonth,
      selectedBank.revertMarginOver3m,
      selectedBank.floorPct,
    );
    const buyout = buyoutSavings({
      balance: loan,
      currentRate: currentBuyoutRate,
      newRate: selectedBank.indicativeFixed3Y,
      yearsLeft: Math.min(20, tenure),
      newBankFeePct: selectedBank.processingFeePct,
    });
    const handover = handoverRelease(price, 60, handoverVal, 100 - downPct);
    const gv = goldenVisaCheck(price, 2);
    const ins = lifeInsuranceSavings(loan, selectedBank.indicativeFixed3Y, tenure);
    const cheques = chequeSplit(price, 0, price * (downPct / 100), loan);
    const policy = evaluateUnderwritingPolicy({
      profile,
      monthlyIncomeAed: salary,
      existingEmisAed: existingEmis,
      cardLimitsAed: cardLimits,
      age,
      propertyPriceAed: price,
      requestedLoanAed: loan,
    });
    return { monthlyEmi, dbr, cash, revert, buyout, handover, gv, ins, cheques, policy };
  }, [price, downPct, tenure, selectedBank, fixedYears, salary, existingEmis, cardLimits, age, profile, currentBuyoutRate, handoverVal, loan]);

  const handleSaveQuote = async () => {
    setSaving(true);
    try {
      const res = await apiFetch<{ id: string }>('/api/quotes', {
        method: 'POST',
        body: JSON.stringify({
          borrower_name: borrowerName,
          bank_key: selectedBank.key,
          bank_name: selectedBank.name,
          property_price_aed: price,
          loan_amount_aed: loan,
          tenure_years: tenure,
          fixed_rate_pct: selectedBank.indicativeFixed3Y,
          fixed_years: fixedYears,
          revert_rate_pct: calc.revert.revertRate,
          intro_emi_aed: Math.round(calc.monthlyEmi),
          revert_emi_aed: Math.round(calc.revert.revertEmi),
          cash_to_close_aed: Math.round(calc.cash.total),
          dbr_pct: calc.policy.projectedDbrPct,
          ltv_pct: 100 - downPct,
        }),
      });
      toast(`Saved Versioned KFS Quote ${res.id} (${CBUAE_RULE_VERSION})`);
    } catch (e: any) {
      toast(e.message, 'err');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Printable Official Betterway KFS Letterhead (Visible in Print/PDF!) */}
      <div className="hidden print:flex items-center justify-between pb-4 mb-4 border-b-2 border-[#070E1A]">
        <img src="/brand/betterway-logo-horizontal-light-bg.svg" alt="Betterway Mortgages" className="h-11" />
        <div className="text-right text-xs">
          <div className="font-bold">KEY FACTS STATEMENT &amp; CBUAE AFFORDABILITY BRIEF</div>
          <div>Rule Version: {CBUAE_RULE_VERSION} · 3M EIBOR: {EIBOR_SNAPSHOT.latest.threeMonth.toFixed(3)}% ({EIBOR_SNAPSHOT.asOfDate})</div>
        </div>
      </div>

      <PageHeader
        eyebrow={`Deterministic Finance Engine · ${CBUAE_RULE_VERSION}`}
        title="8-Engine CBUAE"
        accent="Affordability & KFS Studio"
        subtitle="Powered directly by Betterway's CBUAE 50% DBR (6.5% stress), 15-year Salaried/Low-Doc/Non-Resident policy rules, Dubai DLD cash-to-close, EIBOR revert shock, buyout break-even, handover release, Golden Visa, and life insurance engines."
        actions={
          <>
            <button
              type="button"
              onClick={() => void handleSaveQuote()}
              disabled={saving}
              className="px-4 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r from-[#179373] to-[#0A4A3E] flex items-center gap-1.5 cursor-pointer no-print"
            >
              <Save size={14} /> {saving ? 'Saving…' : 'Save Versioned KFS Quote'}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-full text-xs font-bold border border-[var(--bw-line)] bg-[var(--bw-card)] flex items-center gap-1.5 cursor-pointer no-print"
            >
              <Printer size={14} /> Print / PDF KFS
            </button>
          </>
        }
      />

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left 5-Col Inputs Panel */}
        <div className="lg:col-span-5 bw-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Calculator size={16} className="text-[#179373]" /> Borrower &amp; Property Parameters
            </h3>
            <StatusPill label={`3M EIBOR ${EIBOR_SNAPSHOT.latest.threeMonth.toFixed(2)}%`} tone="gold" />
          </div>

          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-bold mb-1">Client Name (for KFS Quote)</label>
              <input value={borrowerName} onChange={(e) => setBorrowerName(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-soft)]/40" />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold mb-1">Underwriting Profile (Betterway 15-Yr Rules)</label>
              <select value={profile} onChange={(e) => setProfile(e.target.value as BorrowerProfileType)} className="w-full h-10 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)]">
                <option value="salaried">UAE Resident Salaried (Min AED 10k · Cap Age 65)</option>
                <option value="self_employed_full">Self-Employed Full-Doc (2yr TL / 2M TO · Cap Age 70)</option>
                <option value="self_employed_low_doc">Self-Employed Low-Doc (40k Personal Credits · 60% LTV)</option>
                <option value="non_resident">Non-Resident Overseas Buyer (40k / 4 txns · 60% LTV)</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold mb-1">Target Partner Bank (24 UAE Panel)</label>
              <select value={bankKey} onChange={(e) => setBankKey(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)]">
                {UAE_BANKS.map((b) => (
                  <option key={b.key} value={b.key}>
                    {b.name} — {b.indicativeFixed3Y.toFixed(2)}% Fixed / +{b.revertMarginOver3m.toFixed(2)}% Revert ({b.type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold mb-1">Property Value (AED)</label>
              <input type="number" step={50000} value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-full h-10 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] font-mono-num" />
            </div>
            <div>
              <label className="block font-bold mb-1">Down Payment ({downPct}% = LTV {100 - downPct}%)</label>
              <input type="number" min={15} max={80} value={downPct} onChange={(e) => setDownPct(Number(e.target.value))} className="w-full h-10 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] font-mono-num" />
            </div>
            <div>
              <label className="block font-bold mb-1">Monthly Income (AED)</label>
              <input type="number" step={2000} value={salary} onChange={(e) => setSalary(Number(e.target.value))} className="w-full h-10 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] font-mono-num" />
            </div>
            <div>
              <label className="block font-bold mb-1">Existing EMIs (AED/mo)</label>
              <input type="number" step={500} value={existingEmis} onChange={(e) => setExistingEmis(Number(e.target.value))} className="w-full h-10 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] font-mono-num" />
            </div>
            <div>
              <label className="block font-bold mb-1">Credit Card Limits (AED)</label>
              <input type="number" step={5000} value={cardLimits} onChange={(e) => setCardLimits(Number(e.target.value))} className="w-full h-10 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] font-mono-num" />
            </div>
            <div>
              <label className="block font-bold mb-1">Tenure (Yrs) · Age {age}</label>
              <div className="flex gap-1.5">
                <input type="number" min={5} max={25} value={tenure} onChange={(e) => setTenure(Number(e.target.value))} className="w-1/2 h-10 px-2.5 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] font-mono-num" />
                <input type="number" min={21} max={69} value={age} onChange={(e) => setAge(Number(e.target.value))} className="w-1/2 h-10 px-2.5 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] font-mono-num" />
              </div>
            </div>
            <div>
              <label className="block font-bold mb-1">Buyout Current Rate (%)</label>
              <input type="number" step={0.05} value={currentBuyoutRate} onChange={(e) => setCurrentBuyoutRate(Number(e.target.value))} className="w-full h-10 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] font-mono-num" />
            </div>
            <div>
              <label className="block font-bold mb-1">Handover Valuation (AED)</label>
              <input type="number" step={50000} value={handoverVal} onChange={(e) => setHandoverVal(Number(e.target.value))} className="w-full h-10 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] font-mono-num" />
            </div>
          </div>

          {/* Visual Guide Cards from Betterway Repo */}
          <div className="grid grid-cols-3 gap-2 pt-2 no-print">
            {[
              ['/images/guide-dbr-planning.webp', '50% DBR'],
              ['/images/guide-valuation.webp', 'Valuation'],
              ['/images/guide-transfer-day.webp', 'DLD Day'],
            ].map(([src, lbl]) => (
              <div key={lbl} className="relative h-20 rounded-xl overflow-hidden border border-[var(--bw-line)]">
                <img src={src} alt={lbl} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-[#070E1A]/45 flex items-end p-1.5">
                  <span className="text-[10px] font-bold text-white">{lbl}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 7-Col Live Outputs & Policy Verdict */}
        <div className="lg:col-span-7 space-y-4">
          {/* Underwriting Policy Verdict Banner */}
          <div
            className={`bw-card p-5 border-2 ${
              calc.policy.verdict === 'ELIGIBLE'
                ? 'border-[#179373]/60 bg-[#0A4A3E]/8'
                : calc.policy.verdict === 'REFER_MANUAL'
                ? 'border-[#D7B158]/70 bg-[#D7B158]/10'
                : 'border-red-500/60 bg-red-500/8'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-24 px-2 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                  <img src={selectedBank.logo} alt={selectedBank.name} className="h-6 w-20 object-contain" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--bw-muted)]">
                    Betterway CBUAE Policy Verdict
                  </div>
                  <div className="text-lg font-bold flex items-center gap-2">
                    {calc.policy.verdict === 'ELIGIBLE' ? (
                      <ShieldCheck className="text-[#179373]" size={20} />
                    ) : (
                      <ShieldAlert className="text-amber-500" size={20} />
                    )}
                    {calc.policy.verdict.replace(/_/g, ' ')} · Stressed DBR {calc.policy.projectedDbrPct}%
                  </div>
                </div>
              </div>
              <div className="text-end font-mono-num">
                <div className="text-[10.5px] text-[var(--bw-muted)]">Intro Monthly EMI ({selectedBank.indicativeFixed3Y}%)</div>
                <div className="text-2xl font-bold text-[#179373] dark:text-[#34DFAC]">{fmtAed(calc.monthlyEmi)}/mo</div>
              </div>
            </div>
            {(calc.policy.reasons.length > 0 || calc.policy.warnings.length > 0) && (
              <ul className="mt-3 space-y-1 text-xs">
                {calc.policy.reasons.map((r) => (
                  <li key={r} className="text-red-600 dark:text-red-400 font-semibold">• {r}</li>
                ))}
                {calc.policy.warnings.map((w) => (
                  <li key={w} className="text-amber-700 dark:text-amber-300 font-semibold">• {w}</li>
                ))}
              </ul>
            )}
          </div>

          {/* 4-Card Core Math Grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Engine 2: CBUAE DBR Borrowing Power */}
            <div className="bw-card p-4 space-y-2 text-xs">
              <div className="font-bold text-sm">1. CBUAE 50% DBR &amp; Stress Test (6.5%)</div>
              <div className="flex justify-between"><span>50% Gross Monthly Cap:</span><b className="font-mono-num">{fmtAed(calc.dbr.capacity)}</b></div>
              <div className="flex justify-between"><span>Card Limit Hit (5%):</span><b className="font-mono-num">-{fmtAed(calc.dbr.cardHit)}</b></div>
              <div className="flex justify-between"><span>Available Stressed EMI:</span><b className="font-mono-num text-[#179373]">{fmtAed(calc.dbr.available)}</b></div>
              <div className="pt-2 border-t border-[var(--bw-line)] flex justify-between text-sm">
                <span className="font-bold">Max Borrowing Power:</span>
                <b className="font-mono-num text-[#0A4A3E] dark:text-[#34DFAC]">{fmtAed(calc.dbr.maxLoan)}</b>
              </div>
            </div>

            {/* Engine 3: Dubai Cash-to-Close Itemizer */}
            <div className="bw-card p-4 space-y-1.5 text-xs">
              <div className="font-bold text-sm">2. Dubai Upfront Cash-to-Close (No Wrapping)</div>
              <div className="flex justify-between"><span>Down Payment ({downPct}%):</span><b className="font-mono-num">{fmtAed(calc.cash.down)}</b></div>
              <div className="flex justify-between"><span>DLD Transfer (4% + 580):</span><b className="font-mono-num">{fmtAed(calc.cash.dld)}</b></div>
              <div className="flex justify-between"><span>Mortgage Reg (0.25% + 290):</span><b className="font-mono-num">{fmtAed(calc.cash.mortgageReg)}</b></div>
              <div className="flex justify-between"><span>Trustee + Valuation + Bank + 2% Agency:</span><b className="font-mono-num">{fmtAed(calc.cash.trustee + calc.cash.valuation + calc.cash.bankFee + calc.cash.agencyFee)}</b></div>
              <div className="pt-2 border-t border-[var(--bw-line)] flex justify-between text-sm">
                <span className="font-bold">Total Liquid Cash Required:</span>
                <b className="font-mono-num text-[#BA8D36]">{fmtAed(calc.cash.total)}</b>
              </div>
            </div>

            {/* Engine 4: Fixed-to-Revert Shock Analyzer */}
            <div className="bw-card p-4 space-y-2 text-xs">
              <div className="font-bold text-sm">3. Fixed-to-Revert Shock ({fixedYears}Y Fixed → 3M EIBOR)</div>
              <div className="flex justify-between"><span>Intro EMI ({selectedBank.indicativeFixed3Y}%):</span><b className="font-mono-num">{fmtAed(calc.revert.introEmi)}/mo</b></div>
              <div className="flex justify-between"><span>Revert Rate ({EIBOR_SNAPSHOT.latest.threeMonth.toFixed(2)}% + {selectedBank.revertMarginOver3m}%):</span><b className="font-mono-num">{calc.revert.revertRate.toFixed(2)}%</b></div>
              <div className="flex justify-between"><span>Post-Fixed Monthly EMI:</span><b className="font-mono-num text-amber-600">{fmtAed(calc.revert.revertEmi)}/mo</b></div>
              <div className="pt-2 border-t border-[var(--bw-line)] flex justify-between">
                <span className="font-bold">Monthly Payment Jump:</span>
                <b className="font-mono-num text-red-600">+{fmtAed(calc.revert.monthlyShock)}/mo</b>
              </div>
            </div>

            {/* Engine 5: Buyout Refinance Break-Even */}
            <div className="bw-card p-4 space-y-2 text-xs">
              <div className="font-bold text-sm">4. Buyout Break-Even (vs {currentBuyoutRate}%)</div>
              <div className="flex justify-between"><span>Monthly EMI Reduction:</span><b className="font-mono-num text-[#179373]">{fmtAed(calc.buyout.monthly)}/mo</b></div>
              <div className="flex justify-between"><span>CBUAE Early Exit Cap (≤10k+VAT):</span><b className="font-mono-num">{fmtAed(calc.buyout.earlyFee)}</b></div>
              <div className="flex justify-between"><span>Total Switch Cost:</span><b className="font-mono-num">{fmtAed(calc.buyout.switchCost)}</b></div>
              <div className="pt-2 border-t border-[var(--bw-line)] flex justify-between">
                <span className="font-bold">36-Mo Net Gain / Break-Even:</span>
                <b className="font-mono-num text-[#179373]">
                  {fmtAed(calc.buyout.net)} ({Number.isFinite(calc.buyout.breakEvenMonths) ? `${calc.buyout.breakEvenMonths} mo` : 'N/A'})
                </b>
              </div>
            </div>
          </div>

          {/* Engines 6, 7 & 8: Handover SOA Release + Golden Visa + External Life Insurance */}
          <div className="grid sm:grid-cols-3 gap-4 text-xs">
            <div className="bw-card p-4 space-y-1.5">
              <div className="font-bold">5. Handover SOA Release</div>
              <div className="flex justify-between"><span>60% Dev SOA Due:</span><b className="font-mono-num">{fmtAed(calc.handover.developerSoaOwed, true)}</b></div>
              <div className="flex justify-between"><span>Fresh Val Loan Cap:</span><b className="font-mono-num">{fmtAed(calc.handover.loanCap, true)}</b></div>
              <div className="flex justify-between text-[#179373]"><span>Cash Released:</span><b className="font-mono-num">{fmtAed(calc.handover.cashOutToClient)}</b></div>
            </div>

            <div className="bw-card p-4 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5"><Award size={14} className="text-[#D7B158]" /> 6. UAE Golden Visa</div>
              <div className="flex items-center gap-1.5 mt-1">
                <CheckCircle2 size={14} className={calc.gv.eligible ? 'text-[#179373]' : 'text-amber-500'} />
                <b>{calc.gv.eligible ? 'Eligible (≥ AED 2.0M)' : `Short by ${fmtAed(calc.gv.gapAed)}`}</b>
              </div>
              <div className="text-[var(--bw-muted)]">Est. family (2 dep.) gov fees: {fmtAed(calc.gv.estimatedFeeLow)} – {fmtAed(calc.gv.estimatedFeeHigh)}</div>
            </div>

            <div className="bw-card p-4 space-y-1.5">
              <div className="font-bold">7–8. Life Cover &amp; Cheques</div>
              <div className="flex justify-between"><span>External Cover Saves:</span><b className="font-mono-num text-[#179373]">{fmtAed(calc.ins.totalSaved)}</b></div>
              <div className="flex justify-between"><span>Transfer DLD Cheque:</span><b className="font-mono-num">{fmtAed(calc.cheques.dld)}</b></div>
              <div className="flex justify-between"><span>Mortgage Reg Cheque:</span><b className="font-mono-num">{fmtAed(calc.cheques.mortgageReg)}</b></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
