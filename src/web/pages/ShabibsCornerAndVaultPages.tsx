import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Crown,
  Lock,
  MessageCircle,
  PhoneCall,
  Save,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Upload,
  Wand2,
} from 'lucide-react';
import { apiFetch, fmtAed } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { BETTERWAY_STAFF } from '@shared/staff-directory';
import { UAE_BANKS } from '@shared/banks-data';
import { BankBadge, PageHeader, StatusPill } from '../components/UiPrimitives';

export function ShabibsCornerPage() {
  const { user, toast } = useAuth();
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState<'playbook' | 'importer' | 'override' | 'approvals'>('playbook');
  const [rawText, setRawText] = useState(
    'Tariq Al Naimi, +971 50 441 8821, Dubai Hills Estate, Sidra Villa #44, 4800000\nLisa Hartmann, +971 58 912 3304, Palm Jumeirah, Shoreline Bldg 4, 3450000',
  );
  const [importTarget, setImportTarget] = useState<'vault' | 'leads'>('vault');
  const [importResult, setImportResult] = useState<any>(null);
  const [vip, setVip] = useState({
    borrower_name: '',
    borrower_phone: '+971 50 ',
    community: 'Palm Jumeirah',
    project_name: '',
    property_price_aed: 5_500_000,
    requested_loan_aed: 3_850_000,
    primary_bank_key: 'emirates-nbd',
    reason: 'Direct Owner VIP fast-track approval',
  });

  const load = async () => {
    const d = await apiFetch('/api/shabibs-corner/overview');
    setData(d);
  };
  useEffect(() => {
    void load();
  }, []);

  const runImport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch<any>('/api/shabibs-corner/ai-import', {
        method: 'POST',
        body: JSON.stringify({ raw_text: rawText, target: importTarget }),
      });
      setImportResult(res);
      toast(`Converted and saved ${res.count} clients into ${importTarget === 'vault' ? 'Client Vault' : 'New Enquiries'}!`);
      await load();
    } catch (err: any) {
      toast(err.message, 'err');
    }
  };

  const runOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch<any>('/api/shabibs-corner/emergency-override', {
        method: 'POST',
        body: JSON.stringify(vip),
      });
      toast(`VIP Mortgage Case ${res.case_code} opened under Owner Override!`);
      setVip({ ...vip, borrower_name: '', project_name: '' });
      await load();
    } catch (err: any) {
      toast(err.message, 'err');
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Crown Header (SWKOS v3.9.0 Shabib's Corner Parity) */}
      <div className="bw-card bg-[#070E1A] text-white border-[#D7B158]/45 p-6 sm:p-7 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src="/brand/betterway-app-icon-dark-squircle-512x512.png"
              alt="Betterway Brandmark"
              className="size-16 rounded-2xl border border-[#D7B158]/50 shadow-lg shrink-0"
            />
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D7B158]/18 border border-[#D7B158]/40 text-[#FCF1B7] text-[10.5px] font-bold uppercase tracking-[0.18em]">
                <Crown size={12} /> Owner Command Desk · Betterway Mortgages LLC
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mt-1.5 tracking-[-0.03em]">
                Shabib&apos;s Corner <span className="font-serif-accent font-normal text-[#FCF1B7]">Executive Control</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                Simple step-by-step control over every mortgage deal from Enquiry (Step 1) to Bank Commission Paid (Step 12), plus bulk AI lead import and VIP Owner fast-track.
              </p>
            </div>
          </div>
          <Link to="/ai" className="px-4 py-2.5 rounded-full bg-[#179373] text-white text-xs font-bold inline-flex items-center gap-1.5">
            <Sparkles size={14} /> Open Betterway AI Helper
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
          {[
            ['playbook', 'Step 1 → 12 Playbook'],
            ['importer', 'Bulk AI Lead Converter'],
            ['override', `VIP Owner Fast-Track (${data?.overrides?.length ?? 0})`],
            ['approvals', `All Owner Approvals (${data?.approvals?.total ?? 0})`],
          ].map(([id, lbl]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id as any)}
              className={`px-4 py-2 rounded-full text-xs font-bold cursor-pointer transition-all ${
                tab === id ? 'bg-white text-[#070E1A]' : 'bg-white/10 text-slate-200 hover:bg-white/20'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {tab === 'playbook' && data && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.stages.map((s: any) => (
            <div key={s.code} className="bw-card p-4 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold">{s.title}</span>
                  <StatusPill label={`${s.count} deals`} tone={s.count > 0 ? 'emerald' : 'neutral'} />
                </div>
                <div className="text-[11px] text-[var(--bw-muted)] mt-0.5">
                  Owner: <b>{s.ownerRole}</b> · Volume: <b className="font-mono-num">{s.loanAed ? fmtAed(s.loanAed, true) : 'AED 0'}</b>
                </div>
                <ul className="mt-3 space-y-1.5 text-xs text-[var(--bw-body)]">
                  {s.howTo.map((tip: string) => (
                    <li key={tip} className="flex items-start gap-1.5">
                      <CheckCircle2 size={13} className="text-[#179373] shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link to="/pipeline" className="text-xs font-bold text-[#179373] hover:underline pt-2 border-t border-[var(--bw-line)]">
                Open deals in Step {s.step} →
              </Link>
            </div>
          ))}
        </div>
      )}

      {tab === 'importer' && (
        <form onSubmit={runImport} className="bw-card p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <Wand2 size={17} className="text-[#179373]" /> Confidential AI Bulk Lead &amp; Sheet Converter
              </h3>
              <p className="text-xs text-[var(--bw-muted)] mt-0.5">
                Paste messy WhatsApp messages, Excel rows, or CSV lines (`Client Name, Mobile, Area, Property, Price`) — automatically cleans, masks numbers, and loads into Betterway.
              </p>
            </div>
            <select
              value={importTarget}
              onChange={(e) => setImportTarget(e.target.value as any)}
              className="h-9 px-3 rounded-full border border-[var(--bw-line)] bg-[var(--bw-card)] text-xs font-bold"
            >
              <option value="vault">Save into Masked Client Vault (Recommended)</option>
              <option value="leads">Save into New Enquiries (CRM)</option>
            </select>
          </div>
          <textarea
            rows={5}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className="w-full p-3.5 rounded-2xl border border-[var(--bw-line)] bg-[var(--bw-soft)]/50 font-mono-num text-xs"
          />
          <button type="submit" className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#179373] to-[#0A4A3E] text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer">
            <Upload size={14} /> Convert &amp; Import Now
          </button>
          {importResult && (
            <div className="p-4 rounded-2xl bg-[#34DFAC]/10 border border-[#179373]/30 text-xs">
              <b>Imported {importResult.count} records cleanly:</b>{' '}
              {importResult.imported.map((x: any) => `${x.code} (${x.name} — ${fmtAed(x.price, true)})`).join(' · ')}
            </div>
          )}
        </form>
      )}

      {tab === 'override' && (
        <div className="grid lg:grid-cols-12 gap-5">
          <form onSubmit={runOverride} className="lg:col-span-6 bw-card p-5 space-y-3 text-xs">
            <div className="text-sm font-bold flex items-center gap-2 text-[#BA8D36]">
              <ShieldAlert size={16} /> Open VIP Mortgage File (Owner Emergency Override)
            </div>
            <p className="text-[var(--bw-muted)]">
              Fast-tracks a VIP client directly to <b>Step 5 · Submit to Partner Banks</b> under Owner authority. Every override is logged permanently in the audit trail.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">VIP Client Name</label>
                <input required value={vip.borrower_name} onChange={(e) => setVip({ ...vip, borrower_name: e.target.value })} placeholder="e.g. Sheikh / VIP Buyer" className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)]" />
              </div>
              <div>
                <label className="block font-bold mb-1">Mobile</label>
                <input required value={vip.borrower_phone} onChange={(e) => setVip({ ...vip, borrower_phone: e.target.value })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)]" />
              </div>
              <div>
                <label className="block font-bold mb-1">Community</label>
                <input value={vip.community} onChange={(e) => setVip({ ...vip, community: e.target.value })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)]" />
              </div>
              <div>
                <label className="block font-bold mb-1">Target Bank</label>
                <select value={vip.primary_bank_key} onChange={(e) => setVip({ ...vip, primary_bank_key: e.target.value })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)]">
                  {UAE_BANKS.slice(0, 12).map((b) => <option key={b.key} value={b.key}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">Property Value (AED)</label>
                <input type="number" value={vip.property_price_aed} onChange={(e) => setVip({ ...vip, property_price_aed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] font-mono-num" />
              </div>
              <div>
                <label className="block font-bold mb-1">Loan Amount (AED)</label>
                <input type="number" value={vip.requested_loan_aed} onChange={(e) => setVip({ ...vip, requested_loan_aed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] font-mono-num" />
              </div>
            </div>
            <div>
              <label className="block font-bold mb-1">Owner Override Reason</label>
              <input required value={vip.reason} onChange={(e) => setVip({ ...vip, reason: e.target.value })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)]" />
            </div>
            <button
              type="submit"
              disabled={!user?.can_approve_deletions}
              className="w-full h-10 rounded-full bg-[#070E1A] text-[#FCF1B7] font-bold disabled:opacity-50 cursor-pointer"
            >
              {user?.can_approve_deletions ? 'Open VIP File Now (Owner Authority)' : 'Restricted to Owner Shabib / Executive Director Warda'}
            </button>
          </form>

          <div className="lg:col-span-6 bw-card p-5 space-y-3 text-xs">
            <h4 className="text-sm font-bold">Owner Override Audit Log</h4>
            {!data?.overrides?.length ? (
              <div className="p-6 text-center text-[var(--bw-muted)] border border-dashed border-[var(--bw-line)] rounded-2xl">
                No emergency overrides used yet.
              </div>
            ) : (
              data.overrides.map((o: any) => (
                <div key={o.id} className="p-3 rounded-xl bg-[var(--bw-soft)] border border-[var(--bw-line)]">
                  <div className="font-bold">{o.record_label}</div>
                  <div className="text-[var(--bw-muted)]">{o.actor_name} · &ldquo;{o.reason}&rdquo;</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'approvals' && data && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            ['Corporate Seal Requests', data.approvals.seals, '/word-studio', 'Letters & KFS awaiting official seal'],
            ['Delete Approvals (Bin)', data.approvals.deleteBin, '/compliance', 'Non-Owner delete requests'],
            ['Client Refund Requests', data.approvals.withdrawals, '/finance', 'Fee refund sign-offs'],
            ['Staff Leave Requests', data.approvals.leaves, '/hr', 'Team holiday & sick leave'],
          ].map(([title, count, to, desc]) => (
            <Link key={String(title)} to={String(to)} className="bw-card p-5 hover:border-[#179373] transition-all">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--bw-muted)]">{title}</div>
              <div className="text-3xl font-bold font-mono-num text-[#179373] mt-2">{count}</div>
              <div className="text-xs text-[var(--bw-muted)] mt-1">{desc} →</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function ClientVaultPage() {
  const { toast } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [canDispatch, setCanDispatch] = useState(false);
  const [pickAdvisor, setPickAdvisor] = useState<Record<string, string>>({});

  const advisors = BETTERWAY_STAFF.filter((s) => ['TEAM_MANAGER', 'MORTGAGE_ADVISOR', 'TELESALES_ADVISOR'].includes(s.role));

  const load = async () => {
    const d = await apiFetch<{ rows: any[]; canDispatch: boolean }>('/api/vault/all');
    setRows(d.rows || []);
    setCanDispatch(Boolean(d.canDispatch));
  };
  useEffect(() => {
    void load();
  }, []);

  const dispatch = async (vaultId: string) => {
    const advId = pickAdvisor[vaultId] || 'USR-05';
    const adv = advisors.find((a) => a.id === advId) || advisors[0]!;
    try {
      await apiFetch('/api/vault/dispatch', {
        method: 'POST',
        body: JSON.stringify({ vaultId, assigneeId: adv.id, assigneeName: adv.name }),
      });
      toast(`Dispatched masked client to ${adv.name}!`);
      await load();
    } catch (e: any) {
      toast(e.message, 'err');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="SWK CRM Vault Parity · Hard-Masked Client Privacy"
        title="Client & Lead"
        accent="Vault Dispatch"
        subtitle="Protect high-value Dubai mortgage leads. Leadership sees the full vault and assigns deals to advisors — advisors contact clients through Masked Call & Masked WhatsApp without exposing raw phone numbers."
        actions={
          <Link to="/my-cases" className="px-4 py-2 rounded-full bg-[#070E1A] text-[#FCF1B7] text-xs font-bold">
            Open My Assigned Clients →
          </Link>
        }
      />

      <div className="bw-card overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[940px]">
          <thead className="bg-[var(--bw-soft)] text-[10.5px] uppercase text-[var(--bw-muted)]">
            <tr>
              <th className="p-3.5">Vault ID</th>
              <th className="p-3.5">Client &amp; Phone</th>
              <th className="p-3.5">Property &amp; Trigger</th>
              <th className="p-3.5">Target Loan &amp; Bank</th>
              <th className="p-3.5">Assigned Advisor</th>
              <th className="p-3.5">Calls / WA</th>
              <th className="p-3.5">Dispatch</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--bw-line)]">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="p-3.5 font-mono-num font-bold text-[#179373]">{r.vault_code}</td>
                <td className="p-3.5">
                  <div className="font-bold">{r.client_name}</div>
                  <div className="font-mono-num text-[11px] text-[var(--bw-muted)] flex items-center gap-1">
                    <Lock size={11} className="text-[#BA8D36]" /> {r.masked_phone}
                  </div>
                </td>
                <td className="p-3.5">
                  <div className="font-semibold">{r.project_unit} ({r.community})</div>
                  <div className="text-[11px] text-[#179373] font-semibold">{r.trigger_type}</div>
                </td>
                <td className="p-3.5">
                  <div className="font-mono-num font-bold">{fmtAed(r.target_loan_aed, true)}</div>
                  <div className="mt-1"><BankBadge bankKey={r.primary_bank_key} /></div>
                </td>
                <td className="p-3.5">
                  <StatusPill label={r.assigned_name || 'Unassigned'} tone={r.assigned_to ? 'emerald' : 'gold'} />
                </td>
                <td className="p-3.5 font-mono-num">{r.calls_count} calls · {r.wa_count} WA</td>
                <td className="p-3.5">
                  {canDispatch ? (
                    <div className="flex items-center gap-1.5">
                      <select
                        value={pickAdvisor[r.id] || r.assigned_to || 'USR-05'}
                        onChange={(e) => setPickAdvisor({ ...pickAdvisor, [r.id]: e.target.value })}
                        className="h-8 px-2 rounded-lg border border-[var(--bw-line)] bg-[var(--bw-card)] text-[11px]"
                      >
                        {advisors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                      <button type="button" onClick={() => void dispatch(r.id)} className="h-8 px-3 rounded-lg bg-[#179373] text-white font-bold inline-flex items-center gap-1 cursor-pointer">
                        <Send size={11} /> Assign
                      </button>
                    </div>
                  ) : (
                    <span className="text-[var(--bw-muted)]">Leadership only</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function MyAssignedClientsPage() {
  const { toast } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, string>>({});

  const load = async () => {
    const d = await apiFetch<{ rows: any[] }>('/api/vault/mine');
    setRows(d.rows || []);
  };
  useEffect(() => {
    void load();
  }, []);

  const maskedAction = async (id: string, kind: 'call' | 'whatsapp') => {
    try {
      const res = await apiFetch<any>(`/api/vault/${id}/masked-action`, { method: 'POST', body: JSON.stringify({ kind }) });
      toast(kind === 'call' ? `Masked Call connected (${res.masked_phone}) — raw phone kept private` : `Masked WhatsApp sent via Betterway Official Account`);
      await load();
    } catch (e: any) {
      toast(e.message, 'err');
    }
  };

  const saveProgress = async (r: any) => {
    try {
      await apiFetch(`/api/vault/${r.id}/progress`, {
        method: 'PATCH',
        body: JSON.stringify({
          vault_status: statuses[r.id] ?? r.vault_status,
          agent_notes: notes[r.id] ?? r.agent_notes,
        }),
      });
      toast(`Saved progress for ${r.client_name}`);
      await load();
    } catch (e: any) {
      toast(e.message, 'err');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bw-card bg-[#070E1A] text-white border-[#D7B158]/40 p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#34DFAC] flex items-center gap-1.5">
            <ShieldCheck size={14} /> Advisor Action Desk · Hard-Masked Client Privacy
          </div>
          <h1 className="text-2xl font-bold mt-1">My Assigned Mortgage Clients</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Call or WhatsApp your assigned buyers in 1 click without ever exposing raw mobile numbers. Update every outcome right here to move deals faster.
          </p>
        </div>
        <StatusPill label={`${rows.length} Active Assignments`} tone="gold" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {rows.map((r) => (
          <div key={r.id} className="bw-card p-5 space-y-3 text-xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono-num font-bold text-[#179373]">{r.vault_code}</span>
                <h3 className="text-base font-bold mt-0.5">{r.client_name}</h3>
                <div className="text-[var(--bw-muted)]">{r.project_unit} · {r.community}</div>
              </div>
              <BankBadge bankKey={r.primary_bank_key} />
            </div>

            <div className="p-3 rounded-xl bg-[var(--bw-soft)] flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase text-[var(--bw-muted)]">Target Mortgage</div>
                <div className="font-mono-num font-bold text-sm text-[#179373]">{fmtAed(r.target_loan_aed)}</div>
              </div>
              <div className="text-end">
                <div className="text-[10px] uppercase text-[var(--bw-muted)]">Trigger</div>
                <div className="font-bold">{r.trigger_type}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => void maskedAction(r.id, 'call')}
                className="h-9 rounded-full bg-[#070E1A] text-[#FCF1B7] font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <PhoneCall size={13} /> Call ({r.masked_phone})
              </button>
              <button
                type="button"
                onClick={() => void maskedAction(r.id, 'whatsapp')}
                className="h-9 rounded-full bg-[#179373] text-white font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageCircle size={13} /> Masked WhatsApp
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-2 pt-2 border-t border-[var(--bw-line)]">
              <select
                value={statuses[r.id] ?? r.vault_status}
                onChange={(e) => setStatuses({ ...statuses, [r.id]: e.target.value })}
                className="h-9 px-2.5 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] font-semibold"
              >
                {['Assigned', 'In Progress', 'Quote Sent', 'Docs Requested', 'Bank Submitted', 'Pre-Approved', 'Closed Won'].map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void saveProgress(r)}
                className="h-9 rounded-xl border border-[#179373]/40 text-[#179373] font-bold inline-flex items-center justify-center gap-1 cursor-pointer hover:bg-[#179373] hover:text-white"
              >
                <Save size={13} /> Save Result ({r.calls_count}c · {r.wa_count}wa)
              </button>
            </div>
            <input
              value={notes[r.id] ?? r.agent_notes ?? ''}
              onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })}
              placeholder="Write short next step or client feedback…"
              className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)]"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
