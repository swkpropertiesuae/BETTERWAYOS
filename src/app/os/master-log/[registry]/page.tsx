'use client';

import React, { use, useCallback, useEffect, useState } from 'react';
import { Lock, Plus, RefreshCw, Save, X } from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { PageHeader, StatusPill } from '@/components/os/UiKit';
import type { MasterRegistryDef } from '@/lib/domain/masters';

export default function MasterRegistryDetailPage({ params }: { params: Promise<{ registry: string }> }) {
  const { registry } = use(params);
  const { user, toast } = useOs();
  const [def, setDef] = useState<MasterRegistryDef | null>(null);
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string | number | boolean>>({});
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch(`/api/v1/masters/${registry}`);
    if (r.ok) {
      const d = await r.json();
      setDef(d.registry);
      setRows(d.rows ?? []);
    }
  }, [registry]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditId(null);
    setForm({});
    setReason('');
    setModalOpen(true);
  };

  const openEdit = (row: Record<string, unknown>) => {
    setEditId(String(row.id));
    const next: Record<string, string | number | boolean> = {};
    for (const f of def?.fields ?? []) {
      if (f.ownerOnlyField && !user?.isOwner) continue;
      const v = row[f.key];
      if (v !== undefined && v !== null) next[f.key] = v as string | number | boolean;
    }
    setForm(next);
    setReason('');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editId ? `/api/v1/masters/${registry}/${editId}` : `/api/v1/masters/${registry}`;
      const method = editId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: form, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Action blocked', 'err');
        return;
      }
      if (data.mode === 'QUEUED_FOR_OWNER_APPROVAL') {
        toast('Proposal queued for Warda / Shabib Owner approval!', 'info');
      } else {
        toast(`${def?.label} saved directly to Supabase Master Log!`);
      }
      setModalOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const isOwnerLocked = def?.writePolicy === 'OWNER_ONLY';
  const canSubmit = user?.isOwner || (user?.role === 'OFFICE_ADMIN' && !isOwnerLocked);
  const canCreate = user?.isOwner || (user?.role === 'OFFICE_ADMIN' && !isOwnerLocked && def?.writePolicy !== 'OWNER_ONLY_SALARY_ROLE');

  const filtered = rows.filter((r) => {
    if (!search.trim()) return true;
    return JSON.stringify(r).toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Master Log · ${def?.category || registry}`}
        title={def?.label || registry}
        accent={`(${rows.length})`}
        subtitle={def?.subtitle || 'Master data registry'}
        backHref="/os/master-log"
        actions={
          <>
            <button
              type="button"
              onClick={() => void load()}
              className="h-9 px-3.5 rounded-full border border-[var(--bw-line)] bg-[var(--bw-card)] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={13} /> Refresh
            </button>
            {canCreate ? (
              <button
                type="button"
                onClick={openCreate}
                className="h-9 px-4 rounded-full bg-[#0e5243] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} /> {user?.isOwner ? 'Add Master Record' : 'Propose Addition (Owner Approval)'}
              </button>
            ) : (
              <StatusPill label={isOwnerLocked ? 'Owner-Only Security Master' : 'Read-Only'} tone="gold" />
            )}
          </>
        }
      />

      <div className="bw-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${def?.label || 'records'}...`}
            className="w-full sm:w-80 h-9 px-3.5 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] text-xs outline-none focus:border-[#0e5243]"
          />
          {def && (
            <StatusPill
              label={
                def.writePolicy === 'OWNER_ONLY'
                  ? 'Strictly Owner-Only (Warda & Shabib)'
                  : def.writePolicy === 'ADMIN_APPROVAL_REQUIRED'
                    ? 'Admin Writes Require 1-of-2 Owner Approval'
                    : def.writePolicy === 'OWNER_ONLY_SALARY_ROLE'
                      ? 'Roles & Salaries Locked to Owners'
                      : 'Operational Create Enabled'
              }
              tone={def.writePolicy === 'OWNER_ONLY' ? 'navy' : 'emerald'}
            />
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start border-collapse">
            <thead>
              <tr className="border-b border-[var(--bw-line)] text-[10.5px] uppercase tracking-wider text-[var(--bw-muted)]">
                {(def?.displayColumns ?? []).map((col) => (
                  <th key={col} className="py-2.5 px-3 text-start font-bold">
                    {col.replace(/_/g, ' ')}
                  </th>
                ))}
                {canSubmit && <th className="py-2.5 px-3 text-end font-bold">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--bw-line)]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={(def?.displayColumns.length ?? 4) + 1} className="py-10 text-center text-[var(--bw-muted)]">
                    No records yet in this registry.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={String(row.id)} className="hover:bg-[var(--bw-soft)]/50">
                    {(def?.displayColumns ?? []).map((col) => (
                      <td key={col} className="py-2.5 px-3 max-w-xs truncate">
                        {typeof row[col] === 'boolean'
                          ? row[col]
                            ? 'Yes'
                            : 'No'
                          : String(row[col] ?? '—')}
                      </td>
                    ))}
                    {canSubmit && (
                      <td className="py-2.5 px-3 text-end">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="px-3 py-1 rounded-full border border-[var(--bw-line)] hover:border-[#0e5243] font-bold text-[11px] cursor-pointer"
                        >
                          {user?.isOwner ? 'Edit' : 'Propose Edit'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit / Propose Modal */}
      {modalOpen && def && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="w-full max-w-xl bw-card p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--bw-line)] pb-3">
              <div>
                <h3 className="text-base font-extrabold">
                  {editId ? 'Edit' : 'New'} {def.label}
                </h3>
                <p className="text-[11px] text-[var(--bw-muted)]">
                  {user?.isOwner
                    ? 'Saves directly to live Supabase Master Log.'
                    : 'Submits a change proposal for Warda Kapadia or Shabib Siraj to approve.'}
                </p>
              </div>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {def.fields.map((f) => {
                const blockedField = !user?.isOwner && f.ownerOnlyField;
                return (
                  <div key={f.key} className={f.type === 'textarea' ? 'sm:col-span-2 space-y-1' : 'space-y-1'}>
                    <label className="text-[11px] font-bold text-[var(--bw-body)] flex items-center gap-1">
                      {f.label}
                      {blockedField && <Lock size={10} className="text-amber-600" />}
                    </label>
                    {f.type === 'select' ? (
                      <select
                        disabled={blockedField}
                        required={f.required && !blockedField}
                        value={String(form[f.key] ?? '')}
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                        className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] text-xs disabled:opacity-50"
                      >
                        <option value="">Select...</option>
                        {(f.options ?? []).map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : f.type === 'textarea' ? (
                      <textarea
                        rows={3}
                        disabled={blockedField}
                        required={f.required && !blockedField}
                        value={String(form[f.key] ?? '')}
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] text-xs disabled:opacity-50"
                      />
                    ) : (
                      <input
                        type={f.type === 'number' ? 'number' : 'text'}
                        step="any"
                        disabled={blockedField}
                        required={f.required && !blockedField}
                        value={String(form[f.key] ?? '')}
                        onChange={(e) =>
                          setForm({ ...form, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })
                        }
                        className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] text-xs disabled:opacity-50"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {!user?.isOwner && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-amber-700">Reason for Company / Owner Approval (Required)</label>
                <input
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this Master Log entry should be added or updated..."
                  className="w-full h-9 px-3 rounded-xl border border-amber-400/60 bg-amber-50/40 text-xs"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--bw-line)]">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-full border border-[var(--bw-line)] text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-full bg-[#0e5243] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Save size={13} /> {saving ? 'Saving...' : user?.isOwner ? 'Save to Master Log' : 'Submit for Owner Approval'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
