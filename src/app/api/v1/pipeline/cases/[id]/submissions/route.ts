import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { UAE_BANKS } from '@/lib/domain/banks';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  const { id } = await ctx.params;
  try {
    const body = (await req.json()) as {
      bankKey: string;
      productType?: string;
      ratePct?: number;
      loanAmountAed: number;
      lenderRef?: string;
      status?: string;
    };
    const bank = UAE_BANKS.find((b) => b.key === body.bankKey);
    const db = await getSupabaseAdmin();
    const { data, error } = await db
      .from('bank_submissions')
      .insert({
        case_id: id,
        bank_key: body.bankKey,
        bank_name: bank?.name || body.bankKey,
        lender_ref: body.lenderRef || `REF-${Date.now().toString().slice(-6)}`,
        product_type: body.productType || '3Y Fixed',
        rate_pct: body.ratePct ?? bank?.indicativeFixed3Y ?? 3.99,
        loan_amount_aed: body.loanAmountAed,
        status: body.status || 'Submitted',
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, submission: data }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Submission failed' }, { status: 400 });
  }
}
