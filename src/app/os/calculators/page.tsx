'use client';

import React from 'react';
import Link from 'next/link';
import { Download, FileSpreadsheet } from 'lucide-react';
import { PageHeader } from '@/components/os/UiKit';
import { LiveBankMarquee } from '@/components/os/LiveBankMarquee';
import { AllMortgageCalculatorsSuite } from '@/components/workspace/AllMortgageCalculatorsSuite';

export default function CalculatorsAndToolsPage() {
  return (
    <div className="space-y-6">
      <LiveBankMarquee />

      <PageHeader
        eyebrow="12 Institutional UAE Mortgage Calculators & Advisor Tools · CBUAE 2026 Rules"
        title="UAE Calculators &"
        accent="Mortgage Tools"
        subtitle="EMI & Fixed-to-Variable Amortization, CBUAE 50% DBR, 4-Emirate DLD/ADM Cash-to-Close, Buyout & Equity Release, Partial Prepayment Saver, Rent vs Buy, Off-Plan vs Ready, Rental Yield & DSCR, EIBOR Shock, CC Limit Optimizer, Bank DSA / Golden Visa / Age Tenure & FX Converter."
        actions={
          <div className="flex flex-wrap gap-2">
            <a href="/api/v1/utilities/bank-matrix-excel" className="bw-btn bw-btn-gold text-xs py-2 min-h-[36px]">
              <Download size={13} /> 2026 Bank Matrix (.xlsx)
            </a>
            <Link href="/os/mortgage-desk?tab=proposal" className="bw-btn bw-btn-obsidian text-xs py-2 min-h-[36px]">
              <FileSpreadsheet size={13} className="text-[#34f0bc]" /> 3-Bank Proposal Maker
            </Link>
          </div>
        }
      />

      <AllMortgageCalculatorsSuite />
    </div>
  );
}
