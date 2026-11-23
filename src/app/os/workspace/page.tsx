import { requireStaffUser } from '@/server/auth/request';
import { EstateOsHost } from '@/components/estate-os-host';

export const dynamic = 'force-dynamic';

export default async function LegacyEstateWorkspacePage() {
  const user = await requireStaffUser();
  return <EstateOsHost userEmail={user.email} />;
}
