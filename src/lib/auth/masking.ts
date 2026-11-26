import type { SessionUser } from '@/lib/domain/types';

/**
 * PDPL Decree-Law 45/2021 phone masking:
 * - Owners (Warda & Shabib) see full unmasked numbers.
 * - Non-Owners see hard-masked format (+971 50 ••• •821) unless explicitly unmasked via PDPL-audited action.
 */
export function maskPhoneNumber(raw: string | null | undefined): string {
  const clean = String(raw || '').trim();
  if (!clean) return '—';
  const digits = clean.replace(/\D/g, '');
  if (digits.length < 6) return '••• ••••';
  const last3 = digits.slice(-3);
  if (clean.startsWith('+971') || digits.startsWith('971')) {
    const prefix = digits.slice(3, 5) || '50';
    return `+971 ${prefix} ••• •${last3}`;
  }
  return `${clean.slice(0, 4)} ••• •${last3}`;
}

export function maskPhoneForRole(
  raw: string | null | undefined,
  user: SessionUser,
  allowUnmasked = false,
): string {
  if (user.role === 'OWNER' || allowUnmasked) return String(raw || '').trim() || '—';
  return maskPhoneNumber(raw);
}
