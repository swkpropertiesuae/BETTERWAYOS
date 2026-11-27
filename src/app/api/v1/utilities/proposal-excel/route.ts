import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { buildProposalExcelBuffer } from '@/lib/backup/master-workbook';

export async function POST(req: Request) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;

  const body = await req.json();
  const buffer = await buildProposalExcelBuffer({
    clientName: String(body.clientName || 'Betterway Client'),
    advisorName: String(body.advisorName || auth.user.name),
    emirate: String(body.emirate || 'Dubai'),
    profile: String(body.profile || 'Salaried'),
    txType: String(body.txType || 'Ready Purchase'),
    mortgageType: String(body.mortgageType || 'Conventional'),
    propertyValueAed: Number(body.propertyValueAed || 3_000_000),
    loanAmountAed: Number(body.loanAmountAed || 2_400_000),
    ltvPct: Number(body.ltvPct || 80),
    tenorMonths: Number(body.tenorMonths || 300),
    personalLoanAed: Number(body.personalLoanAed || 0),
    lumpSumMonth12Aed: Number(body.lumpSumMonth12Aed || 0),
    options: Array.isArray(body.options) ? body.options : [],
  });

  const safeName = String(body.clientName || 'Client').replace(/[^A-Za-z0-9]+/g, '_');
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Betterway_3Bank_Proposal_${safeName}.xlsx"`,
    },
  });
}
