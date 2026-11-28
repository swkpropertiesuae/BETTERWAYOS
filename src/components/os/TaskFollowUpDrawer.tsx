'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileText,
  History,
  ListChecks,
  Loader2,
  Mail,
  MessageSquare,
  Paperclip,
  Phone,
  Send,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useOs } from './OsProvider';
import { StatusPill } from './UiKit';
import { AttachmentChips, AttachmentPicker } from './AttachmentPicker';
import {
  QUICK_FOLLOWUP_TEMPLATES,
  TASK_FOLLOWUP_CHANNELS,
  TASK_FOLLOWUP_OUTCOMES,
  TASK_FOLLOWUP_STAGES,
  uploadFilesToScope,
  type AttachmentItem,
  type TaskFollowUpChannel,
  type TaskFollowUpEntry,
  type TaskFollowUpOutcome,
  type TaskFollowUpStage,
  type TaskMetaRecord,
} from '@/lib/workspace/attachments-types';

export interface FollowUpTaskItem {
  id: string;
  title: string;
  description?: string | null;
  priority: string;
  status: string;
  due_date?: string | null;
  assigned_to?: string;
  followUpStage?: TaskFollowUpStage;
  nextFollowUpDate?: string | null;
  nextFollowUpTime?: string | null;
  lastFollowUpAt?: string | null;
  contactName?: string;
  contactPhone?: string;
  bankName?: string;
  attachments?: AttachmentItem[];
  followUps?: TaskFollowUpEntry[];
  followUpCount?: number;
  attachmentCount?: number;
}

const CHANNEL_ICON: Record<TaskFollowUpChannel, React.ComponentType<{ size?: number }>> = {
  'SIP Call': Phone,
  WhatsApp: MessageSquare,
  Email: Mail,
  'Bank RM': Building2,
  'Client Meeting': Users,
  'Internal Note': FileText,
};

function stageTone(stage?: string): 'emerald' | 'gold' | 'navy' | 'red' | 'blue' | 'slate' {
  switch (stage) {
    case 'Done':
      return 'emerald';
    case 'Waiting Client':
      return 'gold';
    case 'Waiting Bank':
      return 'navy';
    case 'Escalated':
      return 'red';
    case 'In Progress':
      return 'blue';
    default:
      return 'slate';
  }
}

function dubaiDateOffset(days: number): string {
  const target = new Date(Date.now() + days * 86_400_000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(target);
}

export function TaskFollowUpDrawer({
  task,
  assigneeName,
  onClose,
  onUpdated,
}: {
  task: FollowUpTaskItem | null;
  assigneeName?: string;
  onClose: () => void;
  onUpdated?: () => void | Promise<void>;
}) {
  const { toast } = useOs();
  const [meta, setMeta] = useState<TaskMetaRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'followup' | 'files'>('followup');

  const [channel, setChannel] = useState<TaskFollowUpChannel>('SIP Call');
  const [outcome, setOutcome] = useState<TaskFollowUpOutcome>('Reached — Moving Forward');
  const [nextStage, setNextStage] = useState<TaskFollowUpStage>('In Progress');
  const [note, setNote] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState(() => dubaiDateOffset(1));
  const [nextFollowUpTime, setNextFollowUpTime] = useState('10:00');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [bankName, setBankName] = useState('');
  const [syncDueDate, setSyncDueDate] = useState(true);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [directFiles, setDirectFiles] = useState<File[]>([]);
  const [uploadingDirect, setUploadingDirect] = useState(false);

  const loadMeta = useCallback(async (taskId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/tasks/${encodeURIComponent(taskId)}/followups`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.meta) {
        const m = data.meta as TaskMetaRecord;
        setMeta(m);
        setNextStage(m.followUpStage && m.followUpStage !== 'New' ? m.followUpStage : 'In Progress');
        setContactName(m.contactName ?? '');
        setContactPhone(m.contactPhone ?? '');
        setBankName(m.bankName ?? '');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!task) return;
    setTab('followup');
    setNote('');
    setPendingFiles([]);
    setDirectFiles([]);
    setContactName(task.contactName ?? '');
    setContactPhone(task.contactPhone ?? '');
    setBankName(task.bankName ?? '');
    setNextStage(task.followUpStage && task.followUpStage !== 'New' ? task.followUpStage : 'In Progress');
    setMeta({
      taskId: task.id,
      followUpStage: task.followUpStage ?? (task.status === 'Done' ? 'Done' : 'New'),
      nextFollowUpDate: task.nextFollowUpDate ?? null,
      nextFollowUpTime: task.nextFollowUpTime ?? null,
      lastFollowUpAt: task.lastFollowUpAt ?? null,
      contactName: task.contactName ?? '',
      contactPhone: task.contactPhone ?? '',
      bankName: task.bankName ?? '',
      attachments: task.attachments ?? [],
      followUps: task.followUps ?? [],
    });
    void loadMeta(task.id);
  }, [task, loadMeta]);

  useEffect(() => {
    if (!task) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [task, onClose]);

  if (!task) return null;

  const followUps = meta?.followUps ?? task.followUps ?? [];
  const taskAttachments = meta?.attachments ?? task.attachments ?? [];

  const applyTemplate = (tpl: (typeof QUICK_FOLLOWUP_TEMPLATES)[number]) => {
    setChannel(tpl.channel);
    setOutcome(tpl.outcome);
    setNextStage(tpl.nextStage);
    setNote(tpl.note);
  };

  const submitFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      toast('Please enter a short follow-up note first.', 'err');
      return;
    }
    setSaving(true);
    try {
      let uploadedAttachments: AttachmentItem[] = [];
      if (pendingFiles.length > 0) {
        uploadedAttachments = await uploadFilesToScope(pendingFiles, 'task', task.id);
      }

      const res = await fetch(`/api/v1/tasks/${encodeURIComponent(task.id)}/followups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          outcome,
          note: note.trim(),
          nextFollowUpDate: nextStage === 'Done' ? null : nextFollowUpDate || null,
          nextFollowUpTime: nextStage === 'Done' ? null : nextFollowUpTime || null,
          nextStage,
          attachments: uploadedAttachments,
          contactName: contactName.trim(),
          contactPhone: contactPhone.trim(),
          bankName: bankName.trim(),
          syncDueDate,
        }),
      });
      const out = await res.json();
      if (!res.ok) {
        toast(out.error || 'Could not save follow-up', 'err');
        return;
      }
      if (out.meta) setMeta(out.meta);
      setNote('');
      setPendingFiles([]);
      toast(nextStage === 'Done' ? 'Follow-up saved and task completed!' : `Follow-up logged (${channel} · ${nextStage})`);
      await onUpdated?.();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Follow-up failed', 'err');
    } finally {
      setSaving(false);
    }
  };

  const uploadDirectAttachments = async () => {
    if (directFiles.length === 0) return;
    setUploadingDirect(true);
    try {
      await uploadFilesToScope(directFiles, 'task', task.id);
      setDirectFiles([]);
      await loadMeta(task.id);
      await onUpdated?.();
      toast('Attachment(s) added to task');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Upload failed', 'err');
    } finally {
      setUploadingDirect(false);
    }
  };

  const removeAttachment = async (attId: string) => {
    const res = await fetch(
      `/api/v1/attachments?scope=task&entityId=${encodeURIComponent(task.id)}&id=${encodeURIComponent(attId)}`,
      { method: 'DELETE' },
    );
    if (res.ok) {
      await loadMeta(task.id);
      await onUpdated?.();
      toast('Attachment removed');
    }
  };

  return (
    <div className="fixed inset-0 z-[92] flex justify-end no-print" role="dialog" aria-modal="true" aria-label="Task Follow-Up">
      <div className="flex-1 bg-[#071120]/50 backdrop-blur-[2px]" onClick={onClose} />

      <aside className="w-full max-w-[560px] h-full bg-white dark:bg-[#0e1a2b] border-s border-[var(--bw-line-strong)] shadow-2xl flex flex-col overflow-hidden">
        <div className="px-5 py-4 bg-[#0b192c] text-white border-b border-[#c49a45]/30 flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#dfc285]">
              <CalendarClock size={12} /> Task Follow-Up &amp; Attachments
            </div>
            <h2 className="font-display text-base font-extrabold text-white leading-snug">{task.title}</h2>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
              {assigneeName && (
                <span className="inline-flex items-center gap-1">
                  <UserCheck size={11} className="text-[#64c4a8]" /> {assigneeName}
                </span>
              )}
              {task.due_date && (
                <>
                  <span>·</span>
                  <span className="font-mono-num">Due {task.due_date}</span>
                </>
              )}
              <StatusPill label={meta?.followUpStage || task.status} tone={stageTone(meta?.followUpStage || task.status)} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer shrink-0"
            aria-label="Close follow-up drawer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1.5 p-2.5 bg-[var(--bw-soft)] border-b border-[var(--bw-line)] text-xs font-extrabold">
          <button
            type="button"
            onClick={() => setTab('followup')}
            className={`py-2 px-3 rounded-xl inline-flex items-center justify-center gap-1.5 cursor-pointer transition ${
              tab === 'followup' ? 'bg-[#0b192c] text-[#dfc285]' : 'text-[var(--bw-body)] hover:bg-white dark:hover:bg-white/10'
            }`}
          >
            <History size={13} /> Follow-Up &amp; Timeline ({followUps.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('files')}
            className={`py-2 px-3 rounded-xl inline-flex items-center justify-center gap-1.5 cursor-pointer transition ${
              tab === 'files' ? 'bg-[#0b192c] text-[#dfc285]' : 'text-[var(--bw-body)] hover:bg-white dark:hover:bg-white/10'
            }`}
          >
            <Paperclip size={13} /> Attachments ({taskAttachments.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {tab === 'files' ? (
            <div className="space-y-4">
              <AttachmentPicker
                files={directFiles}
                onChange={setDirectFiles}
                label="Select files to attach to this task"
                existing={taskAttachments}
                onRemoveExisting={(id) => void removeAttachment(id)}
              />
              {directFiles.length > 0 && (
                <button
                  type="button"
                  disabled={uploadingDirect}
                  onClick={() => void uploadDirectAttachments()}
                  className="bw-btn bw-btn-obsidian w-full text-xs"
                >
                  {uploadingDirect ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={14} />}
                  {uploadingDirect ? 'Uploading...' : `Upload ${directFiles.length} File${directFiles.length === 1 ? '' : 's'} to Task`}
                </button>
              )}
              {taskAttachments.length === 0 && directFiles.length === 0 && (
                <div className="py-10 text-center rounded-2xl border border-dashed border-[var(--bw-line)] text-[var(--bw-muted)]">
                  No files attached yet. Drop or browse PDFs, images, Word or Excel files above.
                </div>
              )}
            </div>
          ) : (
            <>
              {task.description && (
                <div className="p-3.5 rounded-xl bg-[var(--bw-soft)] border border-[var(--bw-line)] text-[var(--bw-body)]">
                  <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--bw-muted)] mb-1">Task Details</div>
                  {task.description}
                </div>
              )}

              {meta?.nextFollowUpDate && meta.followUpStage !== 'Done' && (
                <div className="p-3 rounded-xl bg-[#faf6ed] dark:bg-[#251f14] border border-[#e0cca0] dark:border-[#5c4820] flex items-center gap-2">
                  <Clock size={14} className="text-[#7d5b1c] dark:text-[#dfc285] shrink-0" />
                  <div className="font-extrabold text-[#7d5b1c] dark:text-[#dfc285]">
                    Next Follow-Up Scheduled:{' '}
                    <span className="font-mono-num">
                      {meta.nextFollowUpDate}
                      {meta.nextFollowUpTime ? ` · ${meta.nextFollowUpTime}` : ''}
                    </span>
                  </div>
                </div>
              )}

              <form onSubmit={submitFollowUp} className="p-4 rounded-2xl border border-[var(--bw-line-strong)] bg-[var(--bw-card)] space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-extrabold text-[var(--bw-ink)] flex items-center gap-1.5">
                    <ListChecks size={13} className="text-[#0e5a49]" /> Quick Follow-Up Templates
                  </div>
                  {loading && <Loader2 size={13} className="animate-spin text-[var(--bw-muted)]" />}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_FOLLOWUP_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.label}
                      type="button"
                      onClick={() => applyTemplate(tpl)}
                      className="px-2.5 py-1 rounded-full bg-[var(--bw-soft)] hover:bg-[#0b192c] hover:text-[#dfc285] border border-[var(--bw-line)] text-[10.5px] font-bold cursor-pointer transition"
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <div className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--bw-muted)]">1. Channel</div>
                  <div className="flex flex-wrap gap-1.5">
                    {TASK_FOLLOWUP_CHANNELS.map((ch) => {
                      const Icon = CHANNEL_ICON[ch];
                      const active = channel === ch;
                      return (
                        <button
                          key={ch}
                          type="button"
                          onClick={() => setChannel(ch)}
                          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold inline-flex items-center gap-1.5 border cursor-pointer transition ${
                            active
                              ? 'bg-[#0b192c] text-[#dfc285] border-[#c49a45]/60'
                              : 'bg-[var(--bw-soft)] text-[var(--bw-body)] border-[var(--bw-line)] hover:border-[#0e5a49]'
                          }`}
                        >
                          <Icon size={12} /> {ch}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10.5px] font-bold uppercase tracking-wider text-[var(--bw-muted)] mb-1">
                      2. Outcome
                    </label>
                    <select
                      value={outcome}
                      onChange={(e) => setOutcome(e.target.value as TaskFollowUpOutcome)}
                      className="w-full h-9 px-2.5 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] text-[11.5px] font-semibold"
                    >
                      {TASK_FOLLOWUP_OUTCOMES.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-bold uppercase tracking-wider text-[var(--bw-muted)] mb-1">
                      3. Task Stage
                    </label>
                    <select
                      value={nextStage}
                      onChange={(e) => setNextStage(e.target.value as TaskFollowUpStage)}
                      className="w-full h-9 px-2.5 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] text-[11.5px] font-semibold"
                    >
                      {TASK_FOLLOWUP_STAGES.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <textarea
                  required
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Write what happened, what was promised, and any pending blockers..."
                  className="w-full p-2.5 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]/70 outline-none focus:border-[#0e5a49]"
                />

                {nextStage !== 'Done' && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10.5px] font-bold text-[var(--bw-muted)] mb-1">Next Follow-Up Date</label>
                        <input
                          type="date"
                          value={nextFollowUpDate}
                          onChange={(e) => setNextFollowUpDate(e.target.value)}
                          className="w-full h-9 px-2.5 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num"
                        />
                      </div>
                      <div>
                        <label className="block text-[10.5px] font-bold text-[var(--bw-muted)] mb-1">Time (GST)</label>
                        <input
                          type="time"
                          value={nextFollowUpTime}
                          onChange={(e) => setNextFollowUpTime(e.target.value)}
                          className="w-full h-9 px-2.5 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[10.5px]">
                      <span className="font-bold text-[var(--bw-muted)]">Quick set:</span>
                      {[
                        ['Today 4 PM', dubaiDateOffset(0), '16:00'],
                        ['Tomorrow 10 AM', dubaiDateOffset(1), '10:00'],
                        ['+2 Days', dubaiDateOffset(2), '10:00'],
                        ['Next Week', dubaiDateOffset(7), '10:00'],
                      ].map(([lbl, d, t]) => (
                        <button
                          key={lbl}
                          type="button"
                          onClick={() => {
                            setNextFollowUpDate(d);
                            setNextFollowUpTime(t);
                          }}
                          className="px-2 py-0.5 rounded-full bg-[var(--bw-soft)] hover:bg-[#0b192c] hover:text-[#dfc285] border border-[var(--bw-line)] font-bold cursor-pointer"
                        >
                          {lbl}
                        </button>
                      ))}
                      <label className="ms-auto inline-flex items-center gap-1 font-semibold text-[var(--bw-muted)] cursor-pointer">
                        <input type="checkbox" checked={syncDueDate} onChange={(e) => setSyncDueDate(e.target.checked)} />
                        Sync due date
                      </label>
                    </div>
                  </div>
                )}

                <div className="grid sm:grid-cols-3 gap-2">
                  <input
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Contact / Client name"
                    className="h-8 px-2.5 rounded-lg border border-[var(--bw-line)] bg-[var(--bw-soft)] text-[11px]"
                  />
                  <input
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="Phone (optional)"
                    className="h-8 px-2.5 rounded-lg border border-[var(--bw-line)] bg-[var(--bw-soft)] text-[11px] font-mono-num"
                  />
                  <input
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Bank / RM (optional)"
                    className="h-8 px-2.5 rounded-lg border border-[var(--bw-line)] bg-[var(--bw-soft)] text-[11px]"
                  />
                </div>

                <AttachmentPicker
                  compact
                  files={pendingFiles}
                  onChange={setPendingFiles}
                  label="Attach proof / document"
                />

                <button type="submit" disabled={saving} className="bw-btn bw-btn-obsidian w-full text-xs">
                  {saving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Saving Follow-Up...
                    </>
                  ) : nextStage === 'Done' ? (
                    <>
                      <CheckCircle2 size={14} className="text-[#64c4a8]" /> Save &amp; Mark Task Done
                    </>
                  ) : (
                    <>
                      <Send size={13} className="text-[#dfc285]" /> Save Follow-Up &amp; Schedule Next
                    </>
                  )}
                </button>
              </form>

              <div className="space-y-2.5">
                <h3 className="text-xs font-extrabold uppercase tracking-[0.1em] text-[var(--bw-muted)]">
                  Follow-Up History ({followUps.length})
                </h3>
                {followUps.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl border border-dashed border-[var(--bw-line)] text-[var(--bw-muted)]">
                    No follow-ups logged yet. Pick a template or fill the quick form above to record the first follow-up.
                  </div>
                ) : (
                  <ol className="space-y-2.5">
                    {followUps.map((f) => (
                      <li key={f.id} className="p-3.5 rounded-2xl border border-[var(--bw-line)] bg-[var(--bw-soft)]/50 space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-extrabold text-[var(--bw-ink)]">{f.authorName}</span>
                            <span className="px-2 py-0.5 rounded-full bg-white dark:bg-[#10233e] border border-[var(--bw-line)] text-[10px] font-bold">
                              {f.channel}
                            </span>
                            <StatusPill label={f.nextStage} tone={stageTone(f.nextStage)} />
                          </div>
                          <span className="text-[10px] font-mono-num text-[var(--bw-muted)]">
                            {new Date(f.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-[11px] font-bold text-[#0e5a49] dark:text-[#64c4a8]">{f.outcome}</div>
                        <p className="text-xs text-[var(--bw-body)] leading-relaxed">{f.note}</p>
                        {f.nextFollowUpDate && (
                          <div className="text-[10.5px] font-mono-num text-[#7d5b1c] dark:text-[#dfc285]">
                            Next scheduled: {f.nextFollowUpDate}
                            {f.nextFollowUpTime ? ` ${f.nextFollowUpTime}` : ''}
                          </div>
                        )}
                        {f.attachments && f.attachments.length > 0 && (
                          <AttachmentChips attachments={f.attachments} compact />
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
