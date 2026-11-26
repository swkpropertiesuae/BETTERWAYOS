import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createOwnerApproval } from '@/lib/auth/approvals';
import { generatePintAeXml, validateCorporateAccountChannel } from '@/lib/compliance/statutory';

export async function GET(req: Request) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  if (auth.user.role !== 'OWNER' && auth.user.role !== 'OFFICE_ADMIN') {
    return NextResponse.json({ error: 'Accounts restricted to Owners & Office Admin' }, { status: 403 });
  }

  const url = new URL(req.url);
  const pintInvoiceId = url.searchParams.get('pintInvoiceId');
  const db = await getSupabaseAdmin();

  if (pintInvoiceId) {
    const { data: inv } = await db.from('invoices').select('*').eq('id', pintInvoiceId).single();
    if (!inv) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    const xml = generatePintAeXml({
      invoiceNo: inv.invoice_no,
      issueDate: String(inv.created_at).slice(0, 10),
      sellerName: 'Betterway Mortgages LLC',
      sellerTrn: '100000000000003',
      buyerName: inv.counterparty_name,
      subtotalAed: Number(inv.subtotal_aed),
      vatAmountAed: Number(inv.vat_amount_aed),
      totalAed: Number(inv.total_aed),
    });
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="${inv.invoice_no}-PINT-AE.xml"`,
      },
    });
  }

  const [invRes, expRes, payRes, glRes, coaRes, brokersRes] = await Promise.all([
    db.from('invoices').select('*').order('created_at', { ascending: false }).limit(100),
    db.from('expenses').select('*').order('expense_date', { ascending: false }).limit(100),
    db.from('payout_requests').select('*').order('created_at', { ascending: false }).limit(100),
    db.from('journal_entries').select('*').order('created_at', { ascending: false }).limit(100),
    db.from('chart_of_accounts').select('code,name,account_type').order('code', { ascending: true }),
    db.from('rera_brokers').select('*'),
  ]);

  const invoices = invRes.data ?? [];
  const expenses = expRes.data ?? [];
  const revenue = invoices.reduce((s, i) => s + Number(i.subtotal_aed || 0), 0);
  const outputVat = invoices.reduce((s, i) => s + Number(i.vat_amount_aed || 0), 0);
  const totalExp = expenses.reduce((s, e) => s + Number(e.amount_aed || 0), 0);
  const inputVat = expenses.reduce((s, e) => s + Number(e.vat_aed || 0), 0);

  return NextResponse.json({
    summary: {
      revenueAed: revenue,
      expensesAed: totalExp,
      netProfitAed: revenue - totalExp,
      outputVatAed: outputVat,
      inputVatAed: inputVat,
      netVatPayableAed: outputVat - inputVat,
    },
    invoices,
    expenses,
    payouts: payRes.data ?? [],
    journalEntries: glRes.data ?? [],
    coa: coaRes.data ?? [],
    brokers: brokersRes.data ?? [],
  });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  if (auth.user.role !== 'OWNER' && auth.user.role !== 'OFFICE_ADMIN') {
    return NextResponse.json({ error: 'Accounts write restricted to Owners & Office Admin' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const db = await getSupabaseAdmin();

    if (body.kind === 'payout') {
      validateCorporateAccountChannel({
        payeeAccountType: String(body.payeeAccountType || 'CORPORATE'),
        destinationIban: String(body.destinationIban || ''),
        channelNote: String(body.channelNote || ''),
        ornVerified: Boolean(body.ornVerified),
        bankLetterVerified: Boolean(body.bankLetterVerified),
      });

      const code = `PAY-${new Date().getFullYear()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
      const { data: payout, error } = await db
        .from('payout_requests')
        .insert({
          payout_code: code,
          broker_id: body.brokerId || null,
          payee_name: body.payeeName,
          payee_account_type: 'CORPORATE',
          destination_iban: body.destinationIban,
          bank_name: body.bankName || '',
          amount_aed: Number(body.amountAed),
          vat_aed: Number(((Number(body.amountAed) * 5) / 100).toFixed(2)),
          orn_verified: true,
          bank_letter_verified: true,
          requested_by: auth.user.id,
          status: 'PENDING_DUAL_APPROVAL',
        })
        .select('*')
        .single();
      if (error || !payout) throw new Error(error?.message || 'Payout failed');

      const approval = await createOwnerApproval({
        approvalKind: 'PAYOUT_RELEASE',
        referenceTable: 'payout_requests',
        referenceId: payout.id,
        title: `Payout ${code} · ${body.payeeName} (${Number(body.amountAed).toLocaleString()} AED)`,
        summary: `Verified ORN Corporate IBAN ${body.destinationIban}. Requires 2-of-2 Owner sign-off (Warda + Shabib).`,
        amountAed: Number(body.amountAed),
        requestedBy: auth.user.id,
      });
      await db.from('payout_requests').update({ approval_id: approval.id }).eq('id', payout.id);
      return NextResponse.json({ ok: true, payout, approval }, { status: 201 });
    }

    if (body.kind === 'expense') {
      const amt = Number(body.amountAed || 0);
      const vat = body.vatApplicable === false ? 0 : Number(((amt * 5) / 100).toFixed(2));
      const { data: exp, error } = await db
        .from('expenses')
        .insert({
          vendor_name: body.vendorName,
          account_code: body.accountCode || '5200',
          description: body.description,
          amount_aed: amt,
          vat_aed: vat,
          payment_channel: 'Betterway Mortgages LLC Corporate Bank Account (AED)',
          created_by: auth.user.id,
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true, expense: exp }, { status: 201 });
    }

    // Standard Bank DSA / Advisory Invoice (strictly Corporate IBAN)
    const subtotal = Number(body.subtotalAed || 0);
    const vatAmount = Number(((subtotal * 5) / 100).toFixed(2));
    const total = Number((subtotal + vatAmount).toFixed(2));
    const invoiceNo = `BW-INV-${new Date().getFullYear()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const receivingIban = String(body.receivingCorporateIban || 'AE460260001015889900101');
    validateCorporateAccountChannel({
      payeeAccountType: 'CORPORATE',
      destinationIban: receivingIban,
      channelNote: 'Betterway Corporate Bank Account',
      ornVerified: true,
      bankLetterVerified: true,
    });

    const { data: inv, error } = await db
      .from('invoices')
      .insert({
        invoice_no: invoiceNo,
        invoice_type: body.invoiceType || 'BANK_DSA',
        counterparty_name: body.counterpartyName,
        counterparty_trn: body.counterpartyTrn || '',
        subtotal_aed: subtotal,
        vat_rate_pct: 5,
        vat_amount_aed: vatAmount,
        total_aed: total,
        receiving_corporate_iban: receivingIban,
        payment_term: body.paymentTerm || 'Net 30',
        created_by: auth.user.id,
      })
      .select('*')
      .single();
    if (error || !inv) throw new Error(error?.message || 'Invoice create failed');

    await db.from('journal_entries').insert({
      entry_no: `JE-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
      description: `Invoice ${invoiceNo} — ${body.counterpartyName}`,
      debit_account_code: '1100',
      credit_account_code: '4000',
      amount_aed: total,
      vat_code: 'STD-5',
      vat_amount_aed: vatAmount,
      corporate_account_ref: receivingIban,
      created_by: auth.user.id,
    });

    return NextResponse.json({ ok: true, invoice: inv }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Accounting error' }, { status: 400 });
  }
}
