'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileText,
  Landmark,
  Lock,
  Percent,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';

const BANK_PANEL_CAPABILITIES = [
  { bank: 'Emirates NBD', structure: 'Conventional & Islamic', tenor: 'Fixed & 3M EIBOR', maxLtv: '80% Expat / 85% National', dbrRule: '5% Card Limit Stress' },
  { bank: 'First Abu Dhabi Bank', structure: 'Conventional & Islamic', tenor: 'Fixed & 3M EIBOR', maxLtv: '80% Expat / 85% National', dbrRule: '5% Card Limit Stress' },
  { bank: 'Abu Dhabi Commercial Bank', structure: 'Conventional & Islamic', tenor: 'Fixed & 3M EIBOR', maxLtv: '80% Ready Property', dbrRule: '3% Card Limit Stress' },
  { bank: 'Dubai Islamic Bank', structure: 'Sharia Ijara', tenor: 'Fixed & 3M EIBOR', maxLtv: '80% Expat / 85% National', dbrRule: '3% Card Limit Stress' },
  { bank: 'HSBC Middle East', structure: 'Conventional', tenor: 'Fixed & 3M EIBOR', maxLtv: '80% Resident / 60% Non-Res', dbrRule: '3% Card Limit Stress' },
  { bank: 'Mashreq Bank', structure: 'Conventional & Islamic', tenor: 'Fixed & 3M EIBOR', maxLtv: '80% Ready / 50% Off-Plan', dbrRule: '5% Card Limit Stress' },
];

const PRICING_TIERS = [
  {
    badge: 'Standard Salaried & UAE Nationals',
    title: 'Zero-Fee Advisory',
    price: 'AED 0',
    period: 'Paid 100% by Lending Bank Subvention',
    highlighted: true,
    description: 'Complete end-to-end mortgage origination, 24-bank comparison, CBUAE KFS clearance, and DLD Trustee transfer coordination for salaried buyers.',
    features: [
      '24-Bank CBUAE 50% DBR & LTV Underwriting',
      'Official 60-Day Pre-Qualification (AIP) Certificate',
      '3-Bank Side-by-Side Total Cost Proposal PDF',
      'RICS Panel Valuation & Developer E-NOC Coordination',
      '72-Hour DLD Trustee Manager Cheque Settlement Pack',
    ],
    ctaLabel: 'Launch Origination Desk',
    ctaHref: '/os/los',
  },
  {
    badge: 'Non-Resident, HNW SPV & Complex Self-Employed',
    title: 'Private Advisory Mandate',
    price: 'AED 4,500',
    period: '+ 5% FTA VAT (Success-Linked)',
    highlighted: false,
    description: 'Bespoke cross-border structuring, DIFC/ADGM SPV underwriting, multi-entity audit analysis, and finance-to-finance DLD blocking coordination.',
    features: [
      'Everything in Zero-Fee Advisory',
      'Cross-Border FX Income Haircut & Tax Structuring',
      'Bank BDM Fast-Pass Credit Packaging Dossier',
      'Finance-to-Finance Seller Mortgage Payoff & Blocking',
      'Dedicated In-House Sales Progression Officer',
    ],
    ctaLabel: 'Open Deal Structuring',
    ctaHref: '/os/deals',
  },
  {
    badge: 'B2B RERA Real Estate Agencies',
    title: 'Partner Introducer Hub',
    price: 'Up to 40%',
    period: 'of Bank Subvention Pool (Pay-When-Paid)',
    highlighted: false,
    description: 'Built for RERA-licensed brokerages and agents. You keep 100% ownership of the property client while we clear their mortgage.',
    features: [
      '100% RERA Non-Circumvention Client Protection Guarantee',
      'Instant 30-Second Buyer Lead-Drop (5-Min GST SLA)',
      'Co-Branded 60-Day Buyer AIP Certificate for Form F',
      'Pre-Approved Buyer → Property Inventory Matcher',
      'Automated Self-Billed Peppol PINT-AE Tax Invoices',
    ],
    ctaLabel: 'Open RERA Partner Hub',
    ctaHref: '/partners',
  },
];

export default function FintechXShowcasePage() {
  const [propertyPriceAed, setPropertyPriceAed] = useState(3500000);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [tenureYears, setTenureYears] = useState(25);
  const [interestRatePct, setInterestRatePct] = useState(3.89);

  const loanAmountAed = Math.round(propertyPriceAed * (1 - downPaymentPct / 100));
  const months = tenureYears * 12;
  const monthlyRate = interestRatePct / 100 / 12;
  const factor = Math.pow(1 + monthlyRate, months);
  const monthlyEmiAed =
    monthlyRate > 0 ? Math.round((loanAmountAed * monthlyRate * factor) / (factor - 1)) : Math.round(loanAmountAed / months);
  const dldTransferFeeAed = Math.round(propertyPriceAed * 0.04) + 580;
  const mortgageRegFeeAed = Math.round(loanAmountAed * 0.0025) + 290;
  // CBUAE Mortgage Regulations require DBR affordability stress testing at +2.0% above note rate (min 6.5%)
  const stressedRatePct = Math.max(interestRatePct + 2.0, 6.5);
  const stressedMonthlyRate = stressedRatePct / 100 / 12;
  const stressedFactor = Math.pow(1 + stressedMonthlyRate, months);
  const stressedEmiAed = Math.round((loanAmountAed * stressedMonthlyRate * stressedFactor) / (stressedFactor - 1));
  const minRequiredSalaryAed = Math.round(stressedEmiAed * 2); // CBUAE 50% DBR stressed ceiling

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#021125]">
      {/* FintechX Sticky Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-[#e2e6ea] bg-[#f8f9fa]/92 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          <Link href="/os" className="flex items-center gap-3">
            <img
              src="/brand/icon-gold-squircle.svg"
              alt="Betterway Mortgages"
              className="size-10 rounded-xl object-contain shadow-xs"
            />
            <img
              src="/brand/logo-navy-gold-transparent.svg"
              alt="Betterway Mortgages"
              className="h-6 w-auto object-contain hidden sm:block"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-1 rounded-full bg-white border border-[#e7dccd] px-2 py-1 shadow-2xs text-xs font-semibold">
            <a href="#calculator" className="px-3.5 py-1.5 rounded-full hover:bg-[#f1ebe1] transition">
              Calculator
            </a>
            <a href="#features" className="px-3.5 py-1.5 rounded-full hover:bg-[#f1ebe1] transition">
              Platform Features
            </a>
            <a href="#banks" className="px-3.5 py-1.5 rounded-full hover:bg-[#f1ebe1] transition">
              24-Bank Panel
            </a>
            <a href="#pricing" className="px-3.5 py-1.5 rounded-full hover:bg-[#f1ebe1] transition">
              Advisory &amp; Partners
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link
              href="/partners"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#e7dccd] bg-white hover:bg-[#e7dccd] px-4 py-2 text-xs font-semibold text-[#021125] transition"
            >
              Partner Hub
            </Link>
            <Link
              href="/os"
              className="inline-flex items-center gap-2 rounded-full bg-[#021125] hover:bg-[#072244] pl-4 pr-2 py-1.5 text-xs font-semibold text-white transition shadow-sm"
            >
              <span>Enter Corporate OS</span>
              <span className="size-6 rounded-full bg-[#c9a257] text-[#021125] flex items-center justify-center">
                <ArrowUpRight className="size-3.5" />
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* FintechX Hero Section with Trust Pill, Value Prop & Live Interactive Mortgage Intelligence Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-16 space-y-12">
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-white border border-[#e2e6ea] px-3.5 py-1.5 text-xs font-semibold text-[#021125] shadow-2xs">
            <span className="size-2 rounded-full bg-emerald-600" />
            <span>Betterway Mortgages LLC · Dubai, UAE · 24 UAE Panel Banks</span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#021125] leading-[1.12]">
            Institutional Mortgage Intelligence &amp; DLD Settlement for the UAE.
          </h1>

          <p className="text-sm sm:text-base text-[#766661] max-w-2xl mx-auto leading-relaxed">
            Compare live fixed-to-floating EIBOR facilities across 24 UAE banks, generate 60-day buyer pre-qualification certificates, and execute DLD Trustee transfers and FTA-compliant treasury settlements under one roof.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/os"
              className="inline-flex items-center gap-2.5 rounded-full bg-[#021125] hover:bg-[#072244] pl-5 pr-2.5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md transition"
            >
              <span>Open Live Corporate Dashboard</span>
              <span className="size-7 rounded-full bg-[#c9a257] text-[#021125] flex items-center justify-center">
                <ArrowRight className="size-4" />
              </span>
            </Link>
            <Link
              href="/os/los"
              className="inline-flex items-center gap-2 rounded-full border border-[#e7dccd] bg-white hover:bg-[#e7dccd] px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#021125] transition"
            >
              <span>24-Bank Underwriting Desk</span>
            </Link>
            <Link
              href="/os/print/proposal/1"
              className="inline-flex items-center gap-2 rounded-full border border-[#e7dccd] bg-white hover:bg-[#e7dccd] px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#021125] transition"
            >
              <span>View Official 3-Bank Proposal PDF</span>
            </Link>
          </div>
        </div>

        {/* FintechX Social Proof Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: '24 UAE Banks', label: 'Conventional & Islamic (Ijara / Murabaha) Panel' },
            { value: '50.00% DBR', label: 'Deterministic CBUAE 3% vs 5% Card Stress Engine' },
            { value: '42 Hours', label: 'Average Bank BDM Fast-Pass IPA Turnaround' },
            { value: '100% Integer Fils', label: 'Double-Entry GL, FTA VAT 201 & 9% Corporate Tax' },
          ].map((stat, idx) => (
            <div key={idx} className="rounded-2xl bg-white border border-[#e7dccd] p-5 text-center shadow-2xs">
              <div className="font-display text-2xl font-bold text-[#021125] font-num">{stat.value}</div>
              <div className="text-xs text-[#766661] mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Interactive FintechX Product Preview: UAE Mortgage, DLD & CBUAE DBR Calculator */}
        <div id="calculator" className="rounded-3xl bg-white border border-[#e7dccd] p-6 sm:p-8 shadow-sm grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1ebe1] border border-[#e7dccd] px-3 py-1 text-[11px] font-semibold text-[#7d5f1f]">
                  <Sparkles className="size-3.5" />
                  Live CBUAE Affordability &amp; DLD Fee Engine
                </span>
                <h2 className="text-xl font-bold text-[#021125] mt-2">
                  Interactive UAE Mortgage &amp; Upfront Cash-to-Close Calculator
                </h2>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-[#f6f1ea] border border-[#e7dccd] space-y-2">
                <div className="flex justify-between font-semibold">
                  <span>Property Purchase Price</span>
                  <span className="font-num text-[#021125]">AED {propertyPriceAed.toLocaleString('en-US')}</span>
                </div>
                <input
                  type="range"
                  min={800000}
                  max={15000000}
                  step={50000}
                  value={propertyPriceAed}
                  onChange={(e) => setPropertyPriceAed(Number(e.target.value))}
                  className="w-full accent-[#021125]"
                />
                <div className="flex justify-between text-[10px] text-[#766661] font-num">
                  <span>AED 800k</span>
                  <span>AED 15.0M</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#f6f1ea] border border-[#e7dccd] space-y-2">
                <div className="flex justify-between font-semibold">
                  <span>Buyer Down Payment ({downPaymentPct}%)</span>
                  <span className="font-num text-[#021125]">
                    AED {Math.round((propertyPriceAed * downPaymentPct) / 100).toLocaleString('en-US')}
                  </span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={60}
                  step={5}
                  value={downPaymentPct}
                  onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                  className="w-full accent-[#021125]"
                />
                <div className="flex justify-between text-[10px] text-[#766661]">
                  <span>15% (UAE National)</span>
                  <span>20% (Expat)</span>
                  <span>40%+ (Non-Res)</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#f6f1ea] border border-[#e7dccd] space-y-2">
                <div className="flex justify-between font-semibold">
                  <span>Loan Tenure (Max 25 Years)</span>
                  <span className="font-num text-[#021125]">{tenureYears} Years ({months} mos)</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={25}
                  step={1}
                  value={tenureYears}
                  onChange={(e) => setTenureYears(Number(e.target.value))}
                  className="w-full accent-[#021125]"
                />
              </div>

              <div className="p-4 rounded-2xl bg-[#f6f1ea] border border-[#e7dccd] space-y-2">
                <div className="flex justify-between font-semibold">
                  <span>3-Year Fixed Rate (% p.a.)</span>
                  <span className="font-num text-[#021125]">{interestRatePct.toFixed(2)}%</span>
                </div>
                <input
                  type="range"
                  min={3.49}
                  max={5.99}
                  step={0.05}
                  value={interestRatePct}
                  onChange={(e) => setInterestRatePct(Number(e.target.value))}
                  className="w-full accent-[#021125]"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-3xl bg-[#021125] text-white p-6 sm:p-7 space-y-5 border border-[#c9a257]/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#c9a257]">
                Estimated Monthly Installment
              </span>
              <img src="/brand/icon-gold-squircle.svg" alt="" className="size-7 rounded-lg" />
            </div>

            <div>
              <div className="text-3xl sm:text-4xl font-bold font-num text-white">
                AED {monthlyEmiAed.toLocaleString('en-US')}
                <span className="text-sm font-normal text-slate-300"> / month</span>
              </div>
              <div className="text-xs text-[#c9a257] mt-1 font-num">
                Net Mortgage Facility: AED {loanAmountAed.toLocaleString('en-US')} ({100 - downPaymentPct}% LTV)
              </div>
            </div>

            <div className="space-y-2 border-t border-white/15 pt-4 text-xs font-num">
              <div className="flex justify-between">
                <span className="text-slate-300 font-sans">DLD 4% Transfer + AED 580 Admin</span>
                <span className="font-semibold">AED {dldTransferFeeAed.toLocaleString('en-US')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300 font-sans">DLD 0.25% Mortgage Registration</span>
                <span className="font-semibold">AED {mortgageRegFeeAed.toLocaleString('en-US')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300 font-sans">Min. Salary (50% DBR @ {stressedRatePct.toFixed(2)}% stress)</span>
                <span className="font-bold text-[#d7b04e]">AED {minRequiredSalaryAed.toLocaleString('en-US')}/mo</span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-2">
              <Link
                href="/os/los"
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#c9a257] hover:bg-[#b08a3e] py-2.5 px-4 text-xs font-bold text-[#021125] transition"
              >
                <span>Run 24-Bank Underwriting</span>
                <ArrowRight className="size-3.5" />
              </Link>
              <Link
                href="/os/print/aip/1"
                className="inline-flex items-center justify-center rounded-full border border-white/25 hover:bg-white/10 py-2.5 px-4 text-xs font-semibold text-white transition"
              >
                60d AIP PDF
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FintechX Feature Grid: 6 Core Institutional Pillars */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#e7dccd] px-3 py-1 text-[11px] font-semibold text-[#7d5f1f]">
              End-to-End Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#021125] mt-2">
              Built for Corporate Origination, DLD Transfers &amp; FTA Accounting
            </h2>
          </div>
          <Link href="/os" className="bw-btn-navy">
            Explore All 28 Modules →
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              title: '24-Bank CBUAE Underwriting & Buyout Desk',
              desc: 'Evaluates 3% vs 5% credit card stress DBR, 7x LTI multiple, age-at-maturity (65/70), Rent-vs-Buy 5Y wealth comparison, and CBUAE AED 10k buyout penalty cap.',
              href: '/os/los',
              tag: 'Underwriting & LOS',
            },
            {
              title: 'Allsopp-Style DLD Conveyancing & Blocking',
              desc: 'Coordinates RICS panel valuers (ValuStrat, Cavendish Maxwell), Developer E-NOC portals (Emaar Sakani, Nakheel), Finance-to-Finance blocking, and 72h cheque splits.',
              href: '/os/conveyancing',
              tag: 'Sales Progression',
            },
            {
              title: 'OCA Amortization, Risk & UAE PDC Cheque Vault',
              desc: 'Fixed-to-floating EIBOR ACT/365 schedules, AAA–D credit risk scorecard, Title Deed/Oqood yield registry, and Post-Dated Cheque (PDC) safe vault.',
              href: '/os/loan-risk-pdc',
              tag: 'Risk & PDC Vault',
            },
            {
              title: 'Double-Entry Ledger, P&L, Balance Sheet & Tax',
              desc: '28-account integer-fils General Ledger, live Income Statement & Balance Sheet, FTA VAT 201, 9% Corporate Tax, Peppol PINT-AE XML, and >AED 5k expense gate.',
              href: '/os/accounts-expenses',
              tag: 'Corporate Treasury',
            },
            {
              title: 'MOHRE WPS .SIF Payroll, EOSB & Visa Radar',
              desc: 'Generates compliant MOHRE .SIF batches, Emirati GPSSA pension (5%/12.5%), Article 51 gratuity on Basic Salary, and 90/60/30-day Visa & RERA BRN expiry radar.',
              href: '/os/hrm',
              tag: 'Workforce & WPS',
            },
            {
              title: 'CBUAE Joint KFS Gate & Sealed UAE FIU goAML',
              desc: 'Hard-blocks bank IPA submission until all co-borrowers sign the CBUAE Key Facts Statement (KFS) and clear DNFBP AML/CDD screening, with MLRO-isolated goAML XML.',
              href: '/os/compliance',
              tag: 'Regulatory & AML',
            },
          ].map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="bw-card bw-lift p-6 flex flex-col justify-between gap-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="bw-badge">{card.tag}</span>
                  <ArrowUpRight className="size-4 text-[#7d5f1f]" />
                </div>
                <h3 className="text-base font-bold text-[#021125]">{card.title}</h3>
                <p className="text-xs text-[#766661] leading-relaxed">{card.desc}</p>
              </div>
              <div className="pt-3 border-t border-[#e7dccd] flex items-center justify-between text-xs font-semibold text-[#021125]">
                <span>Open Workbench</span>
                <ChevronRight className="size-3.5 text-[#7d5f1f]" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 24-Bank Policy & Eligibility Capability Matrix */}
      <section id="banks" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-6">
        <div className="rounded-3xl bg-white border border-[#e2e6ea] p-6 sm:p-8 shadow-2xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="bw-badge">24-Bank UAE Lending Panel</span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#021125] mt-2">
                Panel Policy &amp; CBUAE Underwriting Matrix (Live Rate Cards Inside OS)
              </h2>
              <p className="text-xs text-[#4a5868] mt-1">
                Verified lender rate cards are maintained under Maker-Checker control inside Betterway OS; live written quotes are issued only after KFS acknowledgement.
              </p>
            </div>
            <Link href="/os/banks-apl" className="bw-btn-navy">
              Open Full 24-Bank &amp; 80-Project APL Desk →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#f8f9fa] text-[#4a5868] border-y border-[#e2e6ea]">
                <tr>
                  <th className="py-3 px-4 text-left">Lending Institution</th>
                  <th className="py-3 px-4 text-left">Facility Structure</th>
                  <th className="py-3 px-4 text-left">Pricing Benchmark</th>
                  <th className="py-3 px-4 text-left">CBUAE LTV Ceiling</th>
                  <th className="py-3 px-4 text-left">Card Limit DBR Rule</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e6ea]">
                {BANK_PANEL_CAPABILITIES.map((row) => (
                  <tr key={row.bank} className="hover:bg-[#f8f9fa]">
                    <td className="py-3 px-4 font-bold text-[#021125]">{row.bank}</td>
                    <td className="py-3 px-4 text-[#4a5868]">{row.structure}</td>
                    <td className="py-3 px-4 font-num">{row.tenor}</td>
                    <td className="py-3 px-4">{row.maxLtv}</td>
                    <td className="py-3 px-4">
                      <span className="bw-badge bg-[#faf3e0] text-[#8a6518] border-[#d7b04e]/40">{row.dbrRule}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FintechX Pricing & B2B Partner Tiers */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="bw-badge">Transparent CBUAE KFS Fee Structure</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#021125]">
            Advisory Mandates &amp; B2B RERA Partner Splits
          </h2>
          <p className="text-xs sm:text-sm text-[#766661]">
            All client fees and lender subventions are disclosed upfront in the mandatory CBUAE Key Facts Statement (KFS) and settled strictly through corporate bank accounts.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.title}
              className={`rounded-3xl p-7 flex flex-col justify-between gap-6 border ${
                tier.highlighted
                  ? 'bg-[#021125] text-white border-[#c9a257]/50 shadow-xl'
                  : 'bg-white text-[#021125] border-[#e7dccd] shadow-2xs'
              }`}
            >
              <div className="space-y-4">
                <span
                  className={`inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                    tier.highlighted ? 'bg-[#c9a257] text-[#021125]' : 'bg-[#f1ebe1] text-[#7d5f1f]'
                  }`}
                >
                  {tier.badge}
                </span>
                <div>
                  <h3 className="text-lg font-bold">{tier.title}</h3>
                  <div className="text-3xl font-bold font-num mt-2">{tier.price}</div>
                  <div className={`text-xs mt-0.5 ${tier.highlighted ? 'text-[#c9a257]' : 'text-[#766661]'}`}>
                    {tier.period}
                  </div>
                </div>
                <p className={`text-xs leading-relaxed ${tier.highlighted ? 'text-slate-300' : 'text-[#766661]'}`}>
                  {tier.description}
                </p>
                <ul className="space-y-2.5 pt-2 text-xs">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2
                        className={`size-4 shrink-0 mt-0.5 ${
                          tier.highlighted ? 'text-[#c9a257]' : 'text-emerald-700'
                        }`}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={tier.ctaHref}
                className={`inline-flex items-center justify-center gap-2 rounded-full py-2.5 px-5 text-xs font-bold transition ${
                  tier.highlighted
                    ? 'bg-[#c9a257] text-[#021125] hover:bg-[#b08a3e]'
                    : 'bg-[#021125] text-white hover:bg-[#072244]'
                }`}
              >
                <span>{tier.ctaLabel}</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FintechX Footer */}
      <footer className="border-t border-[#e7dccd] bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-wrap items-center justify-between gap-4 text-xs text-[#766661]">
          <div className="flex items-center gap-3">
            <img src="/brand/icon-gold-squircle.svg" alt="Betterway" className="size-7 rounded-lg" />
            <span className="font-semibold text-[#021125]">Betterway Mortgages LLC</span>
            <span>· Al Nasr Plaza, Oud Metha, Dubai, UAE · Institutional Corporate OS</span>
          </div>
          <div className="flex items-center gap-4 font-semibold text-[#021125]">
            <Link href="/os" className="hover:underline">Corporate OS</Link>
            <Link href="/partners" className="hover:underline">RERA Partner Hub</Link>
            <Link href="/portal" className="hover:underline">Client Portal</Link>
            <Link href="/os/print/proposal/1" className="hover:underline">Print Suite</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
