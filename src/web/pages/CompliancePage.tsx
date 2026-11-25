import { useEffect, useState } from 'react';
import { History, ShieldCheck, Stamp, Trash2 } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { PageHeader, StatusPill } from '../components/UiPrimitives';

export function CompliancePage() {
  const { user, toast } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [bin, setBin] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);

  const load = async () => {
    const d = await apiFetch<{ records: any[]; recycleBin: any[]; audit: any[] }>('/api/compliance');
    setRecords(d.records || []);
    setBin(d.recycleBin || []);
    setAudit(d.audit || []);
  };
  useEffect(() => {
    void load();
  }, []);

  const approveSeal = async (id: string) => {
    try {
      await apiFetch(`/api/compliance/${id}/seal`, { method: 'POST' });
      toast('Corporate Seal & Governance approved by Owner');
      await load();
    } catch (err: any) {
      toast(err.message, 'err');
    }
  };

  const decideBin = async (id: string, decision: 'approve' | 'reject') => {
    try {
      await apiFetch(`/api/recycle-bin/${id}/decide`, { method: 'POST', body: JSON.stringify({ decision }) });
      toast(decision === 'approve' ? 'Deletion approved & executed' : 'Deletion rejected & record retained');
      await load();
    } catch (err: any) {
      toast(err.message, 'err');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CBUAE · UAE PDPL Law 45/2021 · goAML · SWK-Parity Governance"
        title="Compliance, Seal Approvals &"
        accent="Owner Delete Bin"
        subtitle="Non-Owner deletion requests are held in the Pending Delete Bin with full JSON snapshots until Owner Shabib Siraj or Executive Director Warda approves."
      />

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Compliance, goAML & Seal Approval Governance */}
        <div className="bw-card p-5 space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#179373]" /> goAML, PDPL &amp; Corporate Seal Queue
          </h3>
          {records.map((r) => (
            <div key={r.id} className="p-3.5 rounded-2xl bg-[var(--bw-soft)]/70 border border-[var(--bw-line)] text-xs space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono-num font-bold text-[#179373]">{r.record_code} · {r.category}</span>
                <StatusPill label={r.status} tone={r.status.includes('Cleared') || r.status.includes('Sealed') ? 'emerald' : 'gold'} />
              </div>
              <div className="font-bold">{r.subject}</div>
              <div className="text-[var(--bw-muted)]">{r.notes}</div>
              {r.status.includes('Pending') && user?.can_approve_deletions === 1 && (
                <button
                  type="button"
                  onClick={() => void approveSeal(r.id)}
                  className="mt-1 px-3 py-1.5 rounded-full bg-[#070E1A] text-[#FCF1B7] font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Stamp size={13} /> Grant Official Seal
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Owner Pending Delete Bin */}
        <div className="bw-card p-5 space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Trash2 size={16} className="text-red-500" /> Pending Owner Delete Bin ({bin.length})
          </h3>
          {!bin.length ? (
            <div className="p-8 text-center text-xs text-[var(--bw-muted)] border border-dashed border-[var(--bw-line)] rounded-2xl">
              Zero pending deletion requests. When a non-Owner staff member requests deletion of a case in the Pipeline, it lands here with a full backup snapshot for Owner approval.
            </div>
          ) : (
            bin.map((b) => (
              <div key={b.id} className="p-3.5 rounded-2xl bg-red-500/5 border border-red-500/25 text-xs space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold">{b.record_label}</span>
                  <StatusPill label={b.status} tone={b.status.includes('Pending') ? 'gold' : 'neutral'} />
                </div>
                <div className="text-[var(--bw-muted)]">
                  Requested by <b>{b.requested_by_name}</b> · Reason: &ldquo;{b.reason}&rdquo;
                </div>
                {b.status === 'Pending Owner Approval' && user?.can_approve_deletions === 1 && (
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={() => void decideBin(b.id, 'approve')} className="px-3 py-1 rounded-full bg-red-600 text-white font-bold cursor-pointer">
                      Approve Permanent Archive
                    </button>
                    <button type="button" onClick={() => void decideBin(b.id, 'reject')} className="px-3 py-1 rounded-full bg-[#179373] text-white font-bold cursor-pointer">
                      Reject &amp; Keep Record
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Immutable Universal Audit Log */}
      <div className="bw-card overflow-x-auto">
        <div className="px-5 py-3.5 border-b border-[var(--bw-line)] font-bold text-sm flex items-center gap-2">
          <History size={16} className="text-[#BA8D36]" /> Immutable Universal Audit Log (Last 100 Events)
        </div>
        <table className="w-full text-left text-xs min-w-[820px]">
          <thead className="bg-[var(--bw-soft)] text-[10.5px] uppercase text-[var(--bw-muted)]">
            <tr>
              <th className="p-3">Time (UTC)</th>
              <th className="p-3">Actor &amp; Role</th>
              <th className="p-3">Action</th>
              <th className="p-3">Entity / Record</th>
              <th className="p-3">Reason / Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--bw-line)]">
            {audit.map((a) => (
              <tr key={a.id}>
                <td className="p-3 font-mono-num text-[11px] text-[var(--bw-muted)]">{a.created_at.slice(0, 19).replace('T', ' ')}</td>
                <td className="p-3"><b>{a.actor_name}</b> <span className="text-[var(--bw-muted)]">({a.actor_role})</span></td>
                <td className="p-3"><StatusPill label={a.action} tone={a.action.includes('VIOLATION') ? 'red' : 'navy'} /></td>
                <td className="p-3 font-mono-num">{a.entity_type} · {a.record_id}</td>
                <td className="p-3 text-[var(--bw-body)]">{a.reason} {a.details ? `— ${a.details}` : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
