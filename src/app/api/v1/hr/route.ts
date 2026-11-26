import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { calculateUaeEosbGratuity, generateMohreWpsSif } from '@/lib/compliance/statutory';

export async function GET(req: Request) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  const url = new URL(req.url);
  const wpsPeriod = url.searchParams.get('wpsPeriod');
  const db = await getSupabaseAdmin();

  const [usersRes, compRes, leavesRes] = await Promise.all([
    db.from('users').select('id,emp_code,name,name_ar,email,phone,role,tier,designation,department,avatar_url,portrait_url,initials,specialties,monthly_target_aed,active').order('emp_code', { ascending: true }),
    db.from('hr_staff_compliance').select('*'),
    db.from('hr_leave_requests').select('*, users(name,designation)').order('created_at', { ascending: false }).limit(60),
  ]);

  const canSeeSalaries = auth.user.role === 'OWNER' || auth.user.role === 'HR_MANAGER';
  if (wpsPeriod) {
    if (!canSeeSalaries) {
      return NextResponse.json({ error: 'WPS payroll export is strictly restricted to Owners & HR Manager.' }, { status: 403 });
    }
    const rows = (compRes.data ?? []).filter((c) => Number(c.basic_salary_aed || 0) > 0);
    const sif = generateMohreWpsSif(
      '0000000000001',
      wpsPeriod,
      rows.map((r) => ({
        molId: r.mohre_labour_card,
        routingCode: r.wps_routing_code,
        iban: r.wps_iban,
        fixedAed: Number(r.basic_salary_aed),
        variableAed: Number(r.allowances_aed),
      })),
    );
    return new NextResponse(sif, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="Betterway-MOHRE-WPS-${wpsPeriod}.SIF"`,
      },
    });
  }

  const scopedCompliance = canSeeSalaries
    ? compRes.data ?? []
    : (compRes.data ?? []).filter((c) => c.user_id === auth.user.id);
  const compliance = scopedCompliance.map((c) => {
    const years = Math.max(0.5, (Date.now() - new Date(c.join_date).getTime()) / (365.25 * 86_400_000));
    return {
      ...c,
      basic_salary_aed: canSeeSalaries ? c.basic_salary_aed : undefined,
      allowances_aed: canSeeSalaries ? c.allowances_aed : undefined,
      eosb_gratuity_aed: canSeeSalaries ? calculateUaeEosbGratuity(Number(c.basic_salary_aed || 0), years) : undefined,
    };
  });

  const scopedLeaves = canSeeSalaries
    ? leavesRes.data ?? []
    : (leavesRes.data ?? []).filter((l) => l.user_id === auth.user.id);

  return NextResponse.json({
    staff: usersRes.data ?? [],
    compliance,
    leaves: scopedLeaves,
    canManageHr: canSeeSalaries,
  });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  try {
    const body = await req.json();
    const db = await getSupabaseAdmin();
    if (body.action === 'decide_leave') {
      if (auth.user.role !== 'OWNER' && auth.user.role !== 'HR_MANAGER') {
        return NextResponse.json({ error: 'Only Owners or HR Manager can decide leave requests' }, { status: 403 });
      }
      const { data, error } = await db
        .from('hr_leave_requests')
        .update({ status: body.decision, decided_by: auth.user.id })
        .eq('id', body.leaveId)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true, leave: data });
    }

    const { data, error } = await db
      .from('hr_leave_requests')
      .insert({
        user_id: auth.user.id,
        leave_type: body.leaveType || 'Annual Leave',
        from_date: body.fromDate,
        to_date: body.toDate,
        days: Number(body.days || 1),
        reason: body.reason || '',
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, leave: data }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'HR action failed' }, { status: 400 });
  }
}
