'use client';

import React from 'react';
import Link from 'next/link';
import { Activity, Calculator, ShieldCheck, TrendingDown } from 'lucide-react';
import { EIBOR_SNAPSHOT, UAE_BANKS } from '@/lib/domain/banks';
import { UAE_BANK_POLICIES } from '@/lib/domain/bank-intelligence';

const MARKET_FACTS = [
  { label: '3M CBUAE EIBOR', value: `${EIBOR_SNAPSHOT.latest.threeMonth.toFixed(3)}%`, tone: 'emerald' },
  { label: '1M EIBOR', value: `${EIBOR_SNAPSHOT.latest.oneMonth.toFixed(3)}%`, tone: 'emerald' },
  { label: '6M EIBOR', value: `${EIBOR_SNAPSHOT.latest.sixMonth.toFixed(3)}%`, tone: 'gold' },
  { label: 'CBUAE BASE RATE', value: '3.90%', tone: 'gold' },
  { label: 'MAX EXPAT LTV (<5M)', value: '80% LTV', tone: 'emerald' },
  { label: 'MAX UAE NATIONAL LTV', value: '85% LTV', tone: 'gold' },
  { label: 'NON-RESIDENT MAX LTV', value: '60% LTV', tone: 'emerald' },
  { label: 'CBUAE DBR CAP', value: '50% MAX', tone: 'gold' },
  { label: 'DUBAI DLD TRANSFER', value: '4% + AED 580', tone: 'emerald' },
  { label: 'MORTGAGE REG FEE', value: '0.25% + AED 290', tone: 'gold' },
  { label: 'EARLY SETTLEMENT CAP', value: '1% OR AED 10K MAX', tone: 'emerald' },
  { label: 'UAE GOLDEN VISA MIN', value: 'AED 2,000,000', tone: 'gold' },
];

const EXACT_LOGO_KEY_BY_POLICY_CODE: Record<string, string> = {
  ENBD: 'emirates-nbd',
  FAB: 'fab',
  DIB: 'dib',
  ADCB: 'adcb',
  ADIB: 'adib',
  EIB: 'emirates-islamic',
  EI: 'emirates-islamic',
  HSBC: 'hsbc',
  MASHREQ: 'mashreq',
  CBD: 'cbd',
  RAK: 'rakbank',
  RAKBANK: 'rakbank',
  SCB: 'standard-chartered',
  SC: 'standard-chartered',
  SIB: 'sib',
  NBF: 'nbf',
  UAB: 'uab',
  AJMAN: 'ajman-bank',
  ALHILAL: 'al-hilal',
  BOB: 'bank-of-baroda',
  NBQ: 'nbq',
  CBI: 'cbi',
  BOS: 'bank-of-sharjah',
  UNB: 'unb',
};

export function LiveBankMarquee({ compact = false }: { compact?: boolean }) {
  // Exact logo matching by bank code / short name (prevents "Arab Bank" from colliding with "United Arab Bank")
  const bankSlides = UAE_BANK_POLICIES.map((p) => {
    const mappedKey = EXACT_LOGO_KEY_BY_POLICY_CODE[p.code.toUpperCase()];
    const logoHit =
      (mappedKey ? UAE_BANKS.find((b) => b.key === mappedKey) : undefined) ||
      UAE_BANKS.find(
        (b) =>
          b.short.toLowerCase() === p.short.toLowerCase() ||
          b.name.toLowerCase() === p.name.toLowerCase(),
      );
    return {
      code: p.code,
      name: p.name,
      short: p.short,
      logo: logoHit?.logo || null,
      rate: `${p.indicativeBestRatePct.toFixed(2)}%`,
      loanType: p.loanType === 'Islamic' ? 'Islamic' : p.loanType === 'Conventional' ? 'Conv.' : 'Islamic & Conv.',
      ltv: `${p.maxLtvExpatPct}%/${p.maxLtvLocalPct}%`,
      tat: `${p.totalTatDays}d`,
      fastPass: p.fastPass14Day,
    };
  });

  return (
    <section
      className="w-full rounded-[20px] overflow-hidden border border-[#47a88d]/25 bg-[#091526] text-white shadow-lg no-print"
      aria-label="Live UAE Banks & CBUAE Mortgage Marquee"
    >
      {/* Row 1: Calm Luxury Pace Live UAE 18-Bank Logo & 2026 Rate Marquee */}
      <div className="flex items-center border-b border-white/10">
        <div className="shrink-0 px-3.5 py-2.5 bg-gradient-to-r from-[#0a3f34] to-[#0a3f34] text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-[#dfc285] flex items-center gap-1.5 border-e border-[#47a88d]/30 z-10">
          <span className="size-2 rounded-full bg-[#64c4a8] animate-pulse" />
          <span className="hidden sm:inline">Live UAE Banks</span>
          <span className="sm:hidden">Banks</span>
        </div>
        <div className="flex-1 overflow-hidden py-2">
          <div className="bw-ticker-track items-center gap-3 px-3" style={{ animationDuration: '92s' }}>
            {[...bankSlides, ...bankSlides].map((b, i) => (
              <Link
                key={`${b.code}-${i}`}
                href="/os/mortgage-desk?tab=matrix"
                className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.15] border border-white/10 hover:border-[#47a88d]/60 transition shrink-0"
              >
                {b.logo ? (
                  <span className="h-5 px-1.5 rounded bg-white flex items-center justify-center shrink-0">
                    <img src={b.logo} alt={b.short} className="h-3.5 max-w-[54px] object-contain" />
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded bg-[#47a88d]/20 text-[#64c4a8] text-[10px] font-extrabold">
                    {b.short}
                  </span>
                )}
                <span className="text-[11px] font-extrabold text-white">{b.short}</span>
                <span className="font-mono-num text-[11.5px] font-extrabold text-[#64c4a8]">{b.rate}</span>
                <span className="text-[9.5px] text-slate-300 font-semibold">{b.loanType}</span>
                {b.fastPass && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#dfc285] text-[#0b192c] text-[9px] font-extrabold">
                    {b.tat} FAST
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Calm Pace CBUAE Benchmarks, DLD Fees & UAE Mortgage Rules */}
      {!compact && (
        <div className="flex items-center bg-[#0c1c31]">
          <div className="shrink-0 px-3.5 py-1.5 bg-[#132742] text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#64c4a8] flex items-center gap-1.5 border-e border-white/10 z-10">
            <Activity size={11} className="text-[#dfc285]" />
            <span className="hidden sm:inline">Dubai Pulse</span>
          </div>
          <div className="flex-1 overflow-hidden py-1.5">
            <div className="bw-ticker-track items-center gap-5 px-3" style={{ animationDuration: '104s' }}>
              {[...MARKET_FACTS, ...MARKET_FACTS].map((m, i) => (
                <div key={`${m.label}-${i}`} className="inline-flex items-center gap-1.5 text-[10.5px] whitespace-nowrap">
                  {m.tone === 'emerald' ? (
                    <TrendingDown size={11} className="text-[#64c4a8]" />
                  ) : (
                    <ShieldCheck size={11} className="text-[#dfc285]" />
                  )}
                  <span className="text-slate-400 font-bold">{m.label}:</span>
                  <span className={`font-mono-num font-extrabold ${m.tone === 'emerald' ? 'text-[#64c4a8]' : 'text-[#dfc285]'}`}>
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <Link
            href="/os/calculators"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0a3f34] hover:bg-[#0e5a49] text-[#dfc285] hover:text-white text-[10px] font-extrabold whitespace-nowrap border-s border-[#47a88d]/30 transition shrink-0"
          >
            <Calculator size={11} /> 12 Calculators →
          </Link>
        </div>
      )}
    </section>
  );
}
