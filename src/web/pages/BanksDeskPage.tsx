import { useState } from 'react';
import { Building2, CheckCircle2, Clock, Landmark, Search } from 'lucide-react';
import { DEVELOPER_APL_PROJECTS, EIBOR_SNAPSHOT, UAE_BANKS } from '@shared/banks-data';
import { PageHeader, StatusPill } from '../components/UiPrimitives';

export function BanksDeskPage() {
  const [filterType, setFilterType] = useState<'ALL' | 'Conventional' | 'Islamic' | 'Dual'>('ALL');
  const [onlyNonRes, setOnlyNonRes] = useState(false);
  const [onlyLowDoc, setOnlyLowDoc] = useState(false);
  const [q, setQ] = useState('');

  const filtered = UAE_BANKS.filter((b) => {
    if (filterType !== 'ALL' && b.type !== filterType) return false;
    if (onlyNonRes && !b.nonResidentSupported) return false;
    if (onlyLowDoc && !b.lowDocSupported) return false;
    if (q.trim()) {
      const s = q.toLowerCase();
      return b.name.toLowerCase().includes(s) || b.short.toLowerCase().includes(s) || b.hq.toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Whole-of-Market Lender Panel · 24 Official UAE Banks"
        title="24-Bank Rate Desk &"
        accent="Developer APL Matrix"
        subtitle="Versioned indicative 3-year fixed and 3M EIBOR revert benchmarks, bank SLAs, Low-Doc & Non-Resident appetites, and Developer Approved Project List (APL)."
      />

      {/* Live CBUAE EIBOR Benchmark Bar */}
      <div className="bw-card p-5 bg-[#070E1A] text-white border-[#D7B158]/35">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#34DFAC]">
              Central Bank of the UAE · Official EIBOR Fixing ({EIBOR_SNAPSHOT.asOfDate})
            </div>
            <div className="text-sm text-slate-300 mt-0.5">
              Value Date: {EIBOR_SNAPSHOT.valueDate} · Applied automatically across all 24 bank revert-rate calculations
            </div>
          </div>
          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {[
              ['O/N', EIBOR_SNAPSHOT.latest.overnight],
              ['1M', EIBOR_SNAPSHOT.latest.oneMonth],
              ['3M', EIBOR_SNAPSHOT.latest.threeMonth],
              ['6M', EIBOR_SNAPSHOT.latest.sixMonth],
              ['1Y', EIBOR_SNAPSHOT.latest.oneYear],
            ].map(([label, val]) => (
              <div
                key={String(label)}
                className={`px-3 py-2 rounded-xl border text-center ${
                  label === '3M' ? 'bg-[#179373]/25 border-[#34DFAC]/60' : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="text-[10px] font-bold text-slate-300">{label}</div>
                <div className="font-mono-num text-sm font-bold text-[#FCF1B7]">{Number(val).toFixed(3)}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {(['ALL', 'Conventional', 'Islamic', 'Dual'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilterType(t)}
              className={`px-3.5 py-2 rounded-full text-xs font-bold cursor-pointer ${
                filterType === t
                  ? 'bg-[#070E1A] text-[#FCF1B7] dark:bg-[#179373] dark:text-white'
                  : 'bg-[var(--bw-card)] border border-[var(--bw-line)]'
              }`}
            >
              {t === 'ALL' ? `All 24 Banks` : t}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setOnlyNonRes((v) => !v)}
            className={`px-3.5 py-2 rounded-full text-xs font-bold cursor-pointer border ${
              onlyNonRes ? 'bg-[#179373] text-white border-[#179373]' : 'bg-[var(--bw-card)] border-[var(--bw-line)]'
            }`}
          >
            Non-Resident Desk
          </button>
          <button
            type="button"
            onClick={() => setOnlyLowDoc((v) => !v)}
            className={`px-3.5 py-2 rounded-full text-xs font-bold cursor-pointer border ${
              onlyLowDoc ? 'bg-[#BA8D36] text-white border-[#BA8D36]' : 'bg-[var(--bw-card)] border-[var(--bw-line)]'
            }`}
          >
            Low-Doc Self-Employed
          </button>
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-[var(--bw-muted)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search bank name or emirate…"
            className="w-full h-9 ps-9 pe-3 rounded-full border border-[var(--bw-line)] bg-[var(--bw-card)] text-xs focus:outline-none focus:border-[#179373]"
          />
        </div>
      </div>

      {/* All 24 Official UAE Banks Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((b) => {
          const revertRate = Math.max(b.floorPct, EIBOR_SNAPSHOT.latest.threeMonth + b.revertMarginOver3m);
          return (
            <div key={b.id} className="bw-card p-4 flex flex-col justify-between hover:border-[#179373]/60 transition-all">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="h-11 w-28 px-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden">
                    <img src={b.logo} alt={b.name} className="h-7 w-22 object-contain" />
                  </div>
                  <StatusPill
                    label={b.type}
                    tone={b.type === 'Islamic' ? 'emerald' : b.type === 'Dual' ? 'gold' : 'navy'}
                  />
                </div>
                <h3 className="text-sm font-bold mt-3">{b.name}</h3>
                <div className="text-[11px] text-[var(--bw-muted)]">{b.nameAr} · {b.hq}</div>
                <p className="text-[11.5px] text-[var(--bw-body)] mt-2 line-clamp-2">{b.note}</p>

                <div className="grid grid-cols-3 gap-1.5 mt-3 p-2.5 rounded-xl bg-[var(--bw-soft)] font-mono-num text-center">
                  <div>
                    <div className="text-[9.5px] text-[var(--bw-muted)]">3Y Fixed*</div>
                    <div className="text-xs font-bold text-[#179373] dark:text-[#34DFAC]">{b.indicativeFixed3Y.toFixed(2)}%</div>
                  </div>
                  <div>
                    <div className="text-[9.5px] text-[var(--bw-muted)]">Revert</div>
                    <div className="text-xs font-bold">{revertRate.toFixed(2)}%</div>
                  </div>
                  <div>
                    <div className="text-[9.5px] text-[var(--bw-muted)]">DSA Fee</div>
                    <div className="text-xs font-bold text-[#BA8D36]">{b.dsaRatePct.toFixed(2)}%</div>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[var(--bw-line)] flex flex-wrap items-center justify-between gap-1.5 text-[10.5px]">
                <span className="inline-flex items-center gap-1 text-[var(--bw-muted)]">
                  <Clock size={12} /> {b.slaDays}d DIP SLA
                </span>
                <div className="flex items-center gap-1">
                  {b.nonResidentSupported && <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-700 dark:text-sky-300 font-semibold">Non-Res</span>}
                  {b.lowDocSupported && <span className="px-1.5 py-0.5 rounded bg-[#D7B158]/15 text-[#8A621C] dark:text-[#FCF1B7] font-semibold">Low-Doc</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Developer Approved Project List (APL) with Official Project Renders */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#179373]">
              Spec #11 · Developer_Project_APL_and_Handover.xlsx
            </div>
            <h2 className="text-xl font-bold flex items-center gap-2 mt-0.5">
              <Building2 size={18} className="text-[#BA8D36]" /> Approved Project List (APL) &amp; Handover Readiness
            </h2>
          </div>
          <Landmark size={18} className="text-[var(--bw-muted)]" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEVELOPER_APL_PROJECTS.map((p) => (
            <div key={p.id} className="bw-card overflow-hidden flex flex-col">
              <div className="relative h-44 bg-[#070E1A]">
                <img src={p.image} alt={p.project} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070E1A]/90 via-transparent to-transparent" />
                <div className="absolute top-3 start-3 flex items-center gap-2">
                  <StatusPill label={p.stage} tone="gold" />
                  <StatusPill label={`${p.maxLtv}% Max LTV`} tone="emerald" />
                </div>
                {p.developerLogo && (
                  <div className="absolute top-3 end-3 h-7 px-2 rounded-lg bg-white/95 flex items-center">
                    <img src={p.developerLogo} alt={p.developer} className="max-h-4 max-w-[64px] object-contain" />
                  </div>
                )}
                <div className="absolute bottom-3 start-3 end-3 text-white">
                  <div className="text-[10.5px] uppercase tracking-wider text-[#34DFAC] font-bold">{p.developer}</div>
                  <div className="text-base font-bold">{p.project}</div>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {p.approvedBanks.map((bn) => (
                    <span key={bn} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-[var(--bw-soft)]">
                      <CheckCircle2 size={11} className="text-[#179373]" /> {bn}
                    </span>
                  ))}
                </div>
                <div className="mt-3 pt-2.5 border-t border-[var(--bw-line)] flex items-center justify-between text-xs text-[var(--bw-muted)]">
                  <span>{p.emirate}</span>
                  <span className="font-mono-num font-bold text-[#179373]">Est. Gross Yield {p.typicalYieldPct}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="text-[11px] text-[var(--bw-muted)]">
        *Regulatory Disclosure: Indicative rate-desk configurations shown for internal Betterway planning and KFS quote drafting. Lending decisions, final rates, revert margins, and valuation approvals rest solely with the licensed UAE financial institution in writing.
      </p>
    </div>
  );
}
