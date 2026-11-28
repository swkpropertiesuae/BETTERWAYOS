'use client';

import React from 'react';
import Link from 'next/link';
import { Activity, ShieldCheck, Sparkles, TrendingDown } from 'lucide-react';
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

export function LiveBankMarquee({ compact = false }: { compact?: boolean }) {
  // Merge bank logos from UAE_BANKS with live 2026 rates from UAE_BANK_POLICIES
  const bankSlides = UAE_BANK_POLICIES.map((p) => {
    const logoHit = UAE_BANKS.find(
      (b) =>
        b.short.toLowerCase() === p.short.toLowerCase() ||
        b.name.toLowerCase().includes(p.short.toLowerCase()) ||
        p.name.toLowerCase().includes(b.short.toLowerCase()),
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
      className="w-full rounded-[20px] overflow-hidden border border-[#22e2ad]/25 bg-[#070b11] text-white shadow-lg no-print"
      aria-label="Live UAE Banks & CBUAE Mortgage Marquee"
    >
      {/* Row 1: Live UAE 18-Bank Logo & 2026 Rate Marquee */}
      <div className="flex items-center border-b border-white/10">
        <div className="shrink-0 px-3.5 py-2.5 bg-gradient-to-r from-[#053b2e] to-[#0b5442] text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-[#fbe8a4] flex items-center gap-1.5 border-e border-[#22e2ad]/30 z-10">
          <span className="size-2 rounded-full bg-[#34f0bc] animate-pulse" />
          <span className="hidden sm:inline">Live UAE Banks</span>
          <span className="sm:hidden">Banks</span>
        </div>
        <div className="flex-1 overflow-hidden py-2">
          <div className="bw-ticker-track items-center gap-3 px-3">
            {[...bankSlides, ...bankSlides].map((b, i) => (
              <Link
                key={`${b.code}-${i}`}
                href="/os/mortgage-desk?tab=matrix"
                className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.15] border border-white/10 hover:border-[#22e2ad]/60 transition shrink-0"
              >
                {b.logo ? (
                  <span className="h-5 px-1.5 rounded bg-white flex items-center justify-center shrink-0">
                    <img src={b.logo} alt={b.short} className="h-3.5 max-w-[54px] object-contain" />
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded bg-[#22e2ad]/20 text-[#34f0bc] text-[10px] font-extrabold">
                    {b.short}
                  </span>
                )}
                <span className="text-[11px] font-extrabold text-white">{b.short}</span>
                <span className="font-mono-num text-[11.5px] font-extrabold text-[#34f0bc]">{b.rate}</span>
                <span className="text-[9.5px] text-slate-300 font-semibold">{b.loanType}</span>
                {b.fastPass && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#fbe8a4] text-[#070e1a] text-[9px] font-extrabold">
                    {b.tat} FAST
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Live CBUAE Benchmarks, DLD Fees & UAE Mortgage Rules Marquee */}
      {!compact && (
        <div className="flex items-center bg-[#0b1019]">
          <div className="shrink-0 px-3.5 py-1.5 bg-[#121926] text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#34f0bc] flex items-center gap-1.5 border-e border-white/10 z-10">
            <Activity size={11} className="text-[#fbe8a4]" />
            <span className="hidden sm:inline">Dubai Pulse</span>
          </div>
          <div className="flex-1 overflow-hidden py-1.5">
            <div className="bw-ticker-track items-center gap-5 px-3" style={{ animationDuration: '38s' }}>
              {[...MARKET_FACTS, ...MARKET_FACTS].map((m, i) => (
                <div key={`${m.label}-${i}`} className="inline-flex items-center gap-1.5 text-[10.5px] whitespace-nowrap">
                  {m.tone === 'emerald' ? (
                    <TrendingDown size={11} className="text-[#34f0bc]" />
                  ) : (
                    <ShieldCheck size={11} className="text-[#fbe8a4]" />
                  )}
                  <span className="text-slate-400 font-bold">{m.label}:</span>
                  <span className={`font-mono-num font-extrabold ${m.tone === 'emerald' ? 'text-[#34f0bc]' : 'text-[#fbe8a4]'}`}>
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <Link
            href="/os/calculators"
            className="hidden md:inline-flex items-center gap-1 px-3 py-1.5 bg-[#053b2e] hover:bg-[#119c78] text-[#fbe8a4] hover:text-white text-[10px] font-extrabold whitespace-nowrap border-s border-[#22e2ad]/30 transition shrink-0"
          >
            <Sparkles size={11} /> 12 Calculators →
          </Link>
        </div>
      )}
    </section>
  );
}
