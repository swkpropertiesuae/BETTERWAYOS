import { useState } from 'react';
import { Download, FileSpreadsheet, Search } from 'lucide-react';
import { EXCEL_SPECS } from '@shared/excel-specs';
import { getStoredToken } from '../lib/api';
import { PageHeader, StatusPill } from '../components/UiPrimitives';

export function DataHubPage() {
  const [phase, setPhase] = useState<'ALL' | 'Launch' | 'Phase 2' | 'Conditional'>('ALL');
  const [q, setQ] = useState('');

  const filtered = EXCEL_SPECS.filter((s) => {
    if (phase !== 'ALL' && s.phase !== phase) return false;
    if (q.trim()) {
      const n = q.toLowerCase();
      return s.filename.toLowerCase().includes(n) || s.owner.toLowerCase().includes(n) || s.columns.join(' ').toLowerCase().includes(n);
    }
    return true;
  });

  const downloadSpec = (num: string) => {
    const token = getStoredToken();
    window.open(`/api/data-hub/export/${num}?token=${encodeURIComponent(token || '')}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Betterway_Mortgages_OS_Requirements.pdf · Complete Register"
        title="50-Spec Excel"
        accent="Governance & Data Hub"
        subtitle="Every single one of the 50 official Betterway OS Excel File Specifications (35 Launch, 10 Phase 2, 5 Conditional) with live Excel-ready UTF-8 CSV template & database exports."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(['ALL', 'Launch', 'Phase 2', 'Conditional'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPhase(p)}
              className={`px-3.5 py-2 rounded-full text-xs font-bold cursor-pointer ${
                phase === p
                  ? 'bg-[#070E1A] text-[#FCF1B7] dark:bg-[#179373] dark:text-white'
                  : 'bg-[var(--bw-card)] border border-[var(--bw-line)]'
              }`}
            >
              {p === 'ALL' ? 'All 50 Specs' : `${p} (${EXCEL_SPECS.filter((x) => x.phase === p).length})`}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-[var(--bw-muted)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by filename, owner, column…"
            className="w-full h-9 ps-9 pe-3 rounded-full border border-[var(--bw-line)] bg-[var(--bw-card)] text-xs"
          />
        </div>
      </div>

      <div className="bw-card overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[960px]">
          <thead className="bg-[var(--bw-soft)] text-[10.5px] uppercase text-[var(--bw-muted)]">
            <tr>
              <th className="p-3.5">#</th>
              <th className="p-3.5">Excel Specification</th>
              <th className="p-3.5">Phase &amp; Type</th>
              <th className="p-3.5">Owner Dept</th>
              <th className="p-3.5">Exact Schema Columns</th>
              <th className="p-3.5">Export</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--bw-line)]">
            {filtered.map((s) => (
              <tr key={s.num} className="hover:bg-[var(--bw-soft)]/50">
                <td className="p-3.5 font-mono-num font-bold text-[#BA8D36]">{s.num}</td>
                <td className="p-3.5 font-bold flex items-center gap-2">
                  <FileSpreadsheet size={15} className="text-[#179373] shrink-0" />
                  <span>{s.filename}</span>
                </td>
                <td className="p-3.5">
                  <div className="flex gap-1.5">
                    <StatusPill label={s.phase} tone={s.phase === 'Launch' ? 'emerald' : s.phase === 'Phase 2' ? 'blue' : 'gold'} />
                    <StatusPill label={s.fileType} tone={s.fileType.includes('Restricted') ? 'red' : 'neutral'} />
                  </div>
                </td>
                <td className="p-3.5 text-[var(--bw-body)]">{s.owner}</td>
                <td className="p-3.5 font-mono-num text-[10.5px] text-[var(--bw-muted)] max-w-md truncate" title={s.columns.join(', ')}>
                  {s.columns.join(', ')}
                </td>
                <td className="p-3.5">
                  <button
                    type="button"
                    onClick={() => downloadSpec(s.num)}
                    className="px-3 py-1.5 rounded-full bg-[#070E1A] text-[#FCF1B7] font-bold inline-flex items-center gap-1 cursor-pointer hover:bg-[#179373] hover:text-white transition-colors"
                  >
                    <Download size={12} /> {s.exportEntity ? 'Live Data' : 'Template'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
