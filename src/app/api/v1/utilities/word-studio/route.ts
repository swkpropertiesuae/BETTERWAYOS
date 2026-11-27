import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createOwnerApproval } from '@/lib/auth/approvals';
import { scrubPiiForLlm } from '@/lib/ai/pii-shield';

const MORTGAGE_GLOSSARY: Record<string, Record<string, string>> = {
  ar: { 'Pre-Approval': 'الموافقة المبدئية', 'Down Payment': 'الدفعة المقدمة', 'Title Deed': 'سند الملكية', 'Valuation': 'تقييم العقار', 'Zero Broker Fee': 'بدون عمولة وسيط' },
  hi: { 'Pre-Approval': 'प्री-अप्रूवल', 'Down Payment': 'डाउन पेमेंट', 'Title Deed': 'टाइटल डीड', 'Valuation': 'संपत्ति मूल्यांकन', 'Zero Broker Fee': 'शून्य ब्रोकर शुल्क' },
  ur: { 'Pre-Approval': 'پیشگی منظوری', 'Down Payment': 'ابتدائی ادائیگی', 'Title Deed': 'ملکیت کی دستاویز', 'Valuation': 'جائیداد کی قیمت کا اندازہ', 'Zero Broker Fee': 'زیرو بروکر فیس' },
  ru: { 'Pre-Approval': 'Предварительное одобрение', 'Down Payment': 'Первоначальный взнос', 'Title Deed': 'Свидетельство о собственности', 'Valuation': 'Оценка недвижимости', 'Zero Broker Fee': 'Без комиссии брокера' },
  fr: { 'Pre-Approval': 'Pré-approbation', 'Down Payment': 'Apport initial', 'Title Deed': 'Titre de propriété', 'Valuation': 'Évaluation bancaire', 'Zero Broker Fee': 'Zéro frais de courtage' },
  zh: { 'Pre-Approval': '贷款预批', 'Down Payment': '首付款', 'Title Deed': '产权证', 'Valuation': '银行房产评估', 'Zero Broker Fee': '零中介费' },
  tl: { 'Pre-Approval': 'Paunang Pag-apruba', 'Down Payment': 'Paunang Bayad', 'Title Deed': 'Titulo ng Ari-arian', 'Valuation': 'Pagsusuri ng Halaga', 'Zero Broker Fee': 'Walang Bayad sa Broker' },
  ml: { 'Pre-Approval': 'പ്രീ-അപ്രൂവൽ', 'Down Payment': 'ഡൗൺ പേയ്‌മെന്റ്', 'Title Deed': 'ഉടമസ്ഥാവകാശ രേഖ', 'Valuation': 'വസ്തു മൂല്യനിർണ്ണയം', 'Zero Broker Fee': 'സീറോ ബ്രോക്കർ ഫീസ്' },
};

export async function GET() {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  const db = await getSupabaseAdmin();
  const [{ data: docs }, { data: templates }] = await Promise.all([
    db.from('word_documents').select('*').order('created_at', { ascending: false }).limit(50),
    db.from('document_templates').select('*').eq('status', 'Active').order('code', { ascending: true }),
  ]);
  return NextResponse.json({ docs: docs ?? [], templates: templates ?? [] });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  try {
    const body = await req.json();
    if (body.kind === 'translate') {
      const lang = String(body.targetLang || 'ar');
      let out = String(body.text || '');
      const dict = MORTGAGE_GLOSSARY[lang] || {};
      for (const [k, v] of Object.entries(dict)) {
        out = out.replace(new RegExp(k, 'gi'), `${v} (${k})`);
      }
      return NextResponse.json({ ok: true, translated: `[${lang.toUpperCase()} Glossary-Locked]\n${out}` });
    }
    if (body.kind === 'ocr') {
      const text = String(body.rawOcrText || '');
      const eid = text.match(/784[-\s]?\d{4}[-\s]?\d{7}[-\s]?\d/)?.[0] || 'Not detected';
      const salary = text.match(/(?:AED|DHS)\s*([\d,]{4,9})/i)?.[1] || 'Not detected';
      const expiry = text.match(/\b(20\d{2}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]20\d{2})\b/)?.[0] || 'Not detected';
      const shielded = scrubPiiForLlm(text);
      return NextResponse.json({
        ok: true,
        extracted: { emiratesIdDetected: eid !== 'Not detected', maskedPreview: shielded.sanitized.slice(0, 220), salaryAed: salary, expiryDate: expiry },
      });
    }

    const db = await getSupabaseAdmin();
    const code = `DOC-${new Date().getFullYear()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const { data: doc, error } = await db
      .from('word_documents')
      .insert({
        doc_code: code,
        title: body.title,
        template_category: body.category || 'Mortgage Quote',
        locale: body.locale || 'en',
        body_text: body.bodyText,
        created_by: auth.user.id,
        seal_status: auth.user.isOwner ? 'Sealed' : 'Pending Seal',
        sealed_by: auth.user.isOwner ? auth.user.id : null,
        sealed_at: auth.user.isOwner ? new Date().toISOString() : null,
      })
      .select('*')
      .single();
    if (error || !doc) throw new Error(error?.message || 'Document create failed');

    if (!auth.user.isOwner) {
      await createOwnerApproval({
        approvalKind: 'CORPORATE_SEAL',
        referenceTable: 'word_documents',
        referenceId: doc.id,
        title: `Corporate Seal Request: ${doc.title} (${code})`,
        summary: `Prepared by ${auth.user.name}. Requires 1-of-2 Owner seal sign-off.`,
        requestedBy: auth.user.id,
      });
    }

    return NextResponse.json({ ok: true, doc }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Utilities error' }, { status: 400 });
  }
}
