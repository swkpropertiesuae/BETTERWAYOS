import { NextResponse } from 'next/server';
import { getCurrentSessionUser } from '@/lib/auth/session';
import { getCapabilitiesForRole } from '@/lib/auth/rbac';
import { OFFICIAL_ROSTER } from '@/lib/domain/staff';

export async function GET() {
  const user = await getCurrentSessionUser();
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  return NextResponse.json({
    authenticated: Boolean(user),
    user,
    capabilities: user ? getCapabilitiesForRole(user.role) : null,
    demoMode,
    demoAccounts: demoMode
      ? OFFICIAL_ROSTER.map((s) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          role: s.role,
          designation: s.designation,
          department: s.department,
          avatarUrl: s.avatarUrl,
          portraitUrl: s.portraitUrl,
          initials: s.initials,
        }))
      : [],
  });
}
