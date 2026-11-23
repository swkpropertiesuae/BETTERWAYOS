import { defaultHomeForRole, getCurrentUser } from '@/server/auth/request';
import { OFFICIAL_STAFF_DIRECTORY } from '@/lib/staff-directory';
import { BetterwaySignIn } from '@/components/betterway-sign-in';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; tab?: string }>;
}) {
  const user = await getCurrentUser();
  const sp = await searchParams;

  const initialTab =
    sp.tab === 'borrower' ? 'borrower' : sp.tab === 'partner' ? 'partner' : 'staff';

  const staffPreview = OFFICIAL_STAFF_DIRECTORY.map((s) => ({
    label: s.fullNameEn,
    role: s.designation,
    department: s.department,
    email: s.email,
    avatarUrl: s.avatarUrl,
  }));

  return (
    <BetterwaySignIn
      initialTab={initialTab}
      initialError={sp.error}
      activeSession={
        user
          ? {
              fullName: user.full_name_en,
              email: user.email,
              role: user.role,
              homeHref: defaultHomeForRole(user.role),
            }
          : null
      }
      staffPreview={staffPreview}
    />
  );
}
