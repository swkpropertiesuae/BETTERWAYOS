import { BadgeCheck, Mail, Phone, ShieldCheck, UserCheck } from 'lucide-react';
import { BETTERWAY_STAFF } from '@shared/staff-directory';
import { useAuth } from '../lib/auth-context';
import { fmtAed } from '../lib/api';
import { PageHeader, StaffAvatar, StatusPill } from '../components/UiPrimitives';

export function TeamPage() {
  const { user, quickRoleLogin } = useAuth();
  const executives = BETTERWAY_STAFF.filter((s) => s.tier === 'Owner' || s.tier === 'Executive Leadership');
  const specialists = BETTERWAY_STAFF.filter((s) => s.portrait);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Official Corporate Roster · MOHRE & Role Governance"
        title="Executive Leadership &"
        accent="8K Studio Team Portfolio"
        subtitle="Betterway Mortgages LLC governance hierarchy (Al Nasr Plaza, Oud Metha, Dubai) — click any profile to inspect permissions or switch workspace role."
      />

      {/* Executive Leadership Tier */}
      <div className="grid md:grid-cols-3 gap-4">
        {executives.map((exec) => (
          <div key={exec.id} className="bw-card p-5 bg-[#070E1A] text-white border-[#D7B158]/40 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-3">
                <StaffAvatar name={exec.name} initials={exec.initials} size="lg" />
                <StatusPill label={exec.tier} tone="gold" />
              </div>
              <h3 className="text-lg font-bold mt-4">{exec.name}</h3>
              <div className="text-xs text-[#34DFAC] font-semibold">{exec.designation}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{exec.nameAr} · {exec.empCode}</div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {exec.specialties.map((sp) => (
                  <span key={sp} className="px-2 py-0.5 rounded-full text-[10.5px] bg-white/10 text-slate-200">
                    {sp}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-slate-300 truncate">{exec.email}</span>
              {user?.email !== exec.email ? (
                <button
                  type="button"
                  onClick={() => void quickRoleLogin(exec.email)}
                  className="px-3 py-1 rounded-full bg-[#34DFAC] text-[#070E1A] font-bold shrink-0 cursor-pointer"
                >
                  Switch
                </button>
              ) : (
                <span className="text-[#34DFAC] font-bold flex items-center gap-1"><UserCheck size={13} /> Active</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 6 Studio Portrait Specialists */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--bw-muted)] mb-4">
          Advisory, Progression, Marketing &amp; HR Specialists (Official Studio Portraits)
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {specialists.map((s) => (
            <div key={s.id} className="bw-card overflow-hidden flex flex-col group">
              <div className="relative h-72 bg-[#0C1524] overflow-hidden">
                <img
                  src={s.portrait || s.avatar || ''}
                  alt={s.name}
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070E1A] via-[#070E1A]/20 to-transparent" />
                <div className="absolute top-3 start-3">
                  <StatusPill label={s.department.split('&')[0]!.trim()} tone="emerald" />
                </div>
                <div className="absolute bottom-3 start-4 end-4 text-white">
                  <div className="text-lg font-bold flex items-center gap-1.5">
                    {s.name} <BadgeCheck size={16} className="text-[#34DFAC]" />
                  </div>
                  <div className="text-xs text-[#FCF1B7] font-semibold">{s.designation}</div>
                  <div className="text-[11px] text-slate-300">{s.nameAr} · {s.empCode}</div>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3 text-xs">
                <div className="flex flex-wrap gap-1.5">
                  {s.specialties.map((sp) => (
                    <span key={sp} className="px-2.5 py-0.5 rounded-full bg-[var(--bw-soft)] text-[11px] font-medium">
                      {sp}
                    </span>
                  ))}
                </div>
                <div className="space-y-1 text-[var(--bw-muted)]">
                  <div className="flex items-center gap-2"><Mail size={12} /> {s.email}</div>
                  <div className="flex items-center gap-2"><Phone size={12} /> {s.phone}</div>
                  {s.monthlyTargetAed > 0 && (
                    <div className="flex items-center gap-2 text-[#179373] font-mono-num font-bold">
                      <ShieldCheck size={12} /> Monthly Loan Target: {fmtAed(s.monthlyTargetAed, true)}
                    </div>
                  )}
                </div>
                <div className="pt-2 border-t border-[var(--bw-line)] flex items-center justify-between">
                  <span className="text-[11px] font-mono-num text-[var(--bw-muted)]">{s.role}</span>
                  {user?.email !== s.email ? (
                    <button
                      type="button"
                      onClick={() => void quickRoleLogin(s.email)}
                      className="px-3.5 py-1.5 rounded-full bg-[#070E1A] text-[#FCF1B7] font-bold hover:bg-[#179373] hover:text-white cursor-pointer"
                    >
                      Switch Role
                    </button>
                  ) : (
                    <StatusPill label="Current Session" tone="emerald" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
