import React from 'react';
import { X } from 'lucide-react';
import { UAE_BANKS } from '@shared/banks-data';

export function StaffAvatar({
  avatar,
  name,
  initials,
  size = 'md',
}: {
  avatar?: string | null;
  name: string;
  initials?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}) {
  const dims =
    size === 'xs'
      ? 'size-7 text-[10px]'
      : size === 'sm'
      ? 'size-9 text-xs'
      : size === 'lg'
      ? 'size-14 text-base'
      : size === 'xl'
      ? 'size-20 text-xl'
      : 'size-10 text-xs';
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className={`${dims} rounded-full object-cover object-top ring-2 ring-[#D7B158]/40 shrink-0 bg-[#0C1524]`}
      />
    );
  }
  const init =
    initials ||
    name
      .split(' ')
      .map((s) => s[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  return (
    <div
      className={`${dims} rounded-full shrink-0 flex items-center justify-center font-bold tracking-wide text-[#070E1A] ring-2 ring-[#D7B158]/50`}
      style={{ background: 'linear-gradient(135deg, #FCF1B7 0%, #D7B158 60%, #BA8D36 100%)' }}
    >
      {init}
    </div>
  );
}

export function BankBadge({ bankKey, showName = true }: { bankKey: string; showName?: boolean }) {
  const bank = UAE_BANKS.find((b) => b.key === bankKey);
  if (!bank) return <span className="text-xs font-semibold">{bankKey}</span>;
  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-flex items-center justify-center h-6 w-14 px-1.5 rounded-md bg-white border border-slate-200 shrink-0 overflow-hidden">
        <img src={bank.logo} alt={bank.name} className="h-4 w-11 object-contain" />
      </span>
      {showName && <span className="text-xs font-semibold truncate">{bank.short}</span>}
    </span>
  );
}

export function StatusPill({ label, tone = 'neutral' }: { label: string; tone?: 'emerald' | 'gold' | 'navy' | 'red' | 'blue' | 'neutral' }) {
  const styles: Record<string, string> = {
    emerald: 'bg-[#34DFAC]/15 text-[#0A4A3E] dark:text-[#34DFAC] border-[#179373]/30',
    gold: 'bg-[#D7B158]/18 text-[#8A621C] dark:text-[#FCF1B7] border-[#D7B158]/40',
    navy: 'bg-[#070E1A]/10 text-[#070E1A] dark:bg-white/10 dark:text-white border-[#070E1A]/20',
    red: 'bg-red-500/12 text-red-700 dark:text-red-300 border-red-500/30',
    blue: 'bg-sky-500/12 text-sky-700 dark:text-sky-300 border-sky-500/30',
    neutral: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${styles[tone]}`}>
      {label}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  accent,
  subtitle,
  actions,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
      <div>
        <div className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-[#179373] dark:text-[#34DFAC] mb-1">
          {eyebrow}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-[var(--bw-ink)] leading-tight">
          {title}{' '}
          {accent && <span className="font-serif-accent font-normal text-[#BA8D36] dark:text-[#FCF1B7]">{accent}</span>}
        </h1>
        {subtitle && <p className="text-sm text-[var(--bw-muted)] mt-1 max-w-3xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}

export function ModalDialog({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-2xl',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-[#070E1A]/70 backdrop-blur-sm">
      <div className={`w-full ${maxWidth} bw-card overflow-hidden max-h-[90vh] flex flex-col shadow-2xl`}>
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-[var(--bw-line)] bg-[var(--bw-soft)]/50">
          <div>
            <h3 className="text-lg font-bold text-[var(--bw-ink)]">{title}</h3>
            {subtitle && <p className="text-xs text-[var(--bw-muted)] mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200/60 dark:hover:bg-white/10 text-[var(--bw-muted)] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
