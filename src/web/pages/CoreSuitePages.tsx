import React, { useEffect, useState } from 'react';
import {
  Bot,
  Hash,
  MessagesSquare,
  PhoneCall,
  PhoneOutgoing,
  Play,
  Send,
  Sparkles,
  Workflow,
  Zap,
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { PageHeader, StaffAvatar, StatusPill } from '../components/UiPrimitives';

const CHANNELS = [
  { id: 'general', label: 'general', desc: 'Company announcements & EIBOR alerts' },
  { id: 'bank-desk', label: 'bank-desk', desc: '24-bank underwriting & DIP escalations' },
  { id: 'progression', label: 'progression', desc: 'Valuations, Developer NOC & DLD Trustee' },
  { id: 'swk-relay', label: 'swk-relay', desc: 'SWK Properties Dual-Relay live referrals' },
];

export function InsidePage() {
  const { toast } = useAuth();
  const [channel, setChannel] = useState('general');
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [caseRef, setCaseRef] = useState('');

  const load = async (ch = channel) => {
    const d = await apiFetch<{ messages: any[] }>(`/api/chat?channel=${ch}`);
    setMessages(d.messages || []);
  };
  useEffect(() => {
    void load(channel);
  }, [channel]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await apiFetch('/api/chat', { method: 'POST', body: JSON.stringify({ channel, body: text, case_ref: caseRef }) });
      setText('');
      setCaseRef('');
      await load(channel);
    } catch (err: any) {
      toast(err.message, 'err');
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Betterway Core Suite · Encrypted Internal Messaging"
        title="Betterway"
        accent="Inside"
        subtitle="Dedicated mortgage deal rooms linking Advisors, Progression Coordinator (Elton), SWK Properties Relay, and Executive Leadership."
      />
      <div className="grid lg:grid-cols-12 gap-5 min-h-[520px]">
        <div className="lg:col-span-3 bw-card p-3 space-y-1.5">
          {CHANNELS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setChannel(c.id)}
              className={`w-full text-start p-3 rounded-2xl transition-all cursor-pointer ${
                channel === c.id ? 'bg-[#070E1A] text-white border border-[#34DFAC]/40' : 'hover:bg-[var(--bw-soft)]'
              }`}
            >
              <div className="text-xs font-bold flex items-center gap-1.5">
                <Hash size={13} className="text-[#34DFAC]" /> {c.label}
              </div>
              <div className={`text-[11px] mt-0.5 ${channel === c.id ? 'text-slate-300' : 'text-[var(--bw-muted)]'}`}>{c.desc}</div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-9 bw-card flex flex-col overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[var(--bw-line)] flex items-center justify-between bg-[var(--bw-soft)]/50">
            <div className="font-bold text-sm flex items-center gap-2">
              <MessagesSquare size={16} className="text-[#179373]" /> #{channel}
            </div>
            <StatusPill label="Real-Time Sync" tone="emerald" />
          </div>
          <div className="flex-1 p-5 space-y-4 overflow-y-auto max-h-[420px]">
            {messages.map((m) => (
              <div key={m.id} className="flex items-start gap-3">
                <StaffAvatar avatar={m.sender_avatar} name={m.sender_name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <b>{m.sender_name}</b>
                    {m.case_ref && <StatusPill label={m.case_ref} tone="gold" />}
                    <span className="text-[10.5px] text-[var(--bw-muted)] font-mono-num">{m.created_at.slice(11, 16)}</span>
                  </div>
                  <p className="text-sm text-[var(--bw-body)] mt-1 leading-relaxed">{m.body}</p>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={send} className="p-3.5 border-t border-[var(--bw-line)] flex flex-wrap gap-2 bg-[var(--bw-soft)]/40">
            <input
              value={caseRef}
              onChange={(e) => setCaseRef(e.target.value)}
              placeholder="Case Ref (optional)"
              className="w-36 h-10 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] text-xs font-mono-num"
            />
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Post update to #${channel}…`}
              className="flex-1 h-10 px-3.5 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] text-sm"
            />
            <button type="submit" className="h-10 px-5 rounded-xl bg-[#179373] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer">
              <Send size={14} /> Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function AutomationsPage() {
  const { toast } = useAuth();
  const [flows, setFlows] = useState<any[]>([]);

  const load = async () => {
    const d = await apiFetch<{ automations: any[] }>('/api/automations');
    setFlows(d.automations || []);
  };
  useEffect(() => {
    void load();
  }, []);

  const toggle = async (id: string, enabled: boolean) => {
    await apiFetch(`/api/automations/${id}`, { method: 'PATCH', body: JSON.stringify({ enabled: !enabled }) });
    toast(`Automation ${!enabled ? 'enabled' : 'paused'}`);
    await load();
  };

  const runNow = async (id: string, name: string) => {
    await apiFetch(`/api/automations/${id}`, { method: 'PATCH', body: JSON.stringify({ trigger_now: true }) });
    toast(`Executed workflow: ${name}`);
    await load();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Betterway Work · Visual No-Code Workflow Engine"
        title="Automations &"
        accent="Rate-Reset Radar"
        subtitle="Autonomous UAE mortgage triggers: 90-day fixed-rate expiry buyout detection, 5-minute website lead SLA escalation, DIP expiry shield, missing vault doc chaser, and SWK Dual-Relay attribution."
      />
      <div className="grid md:grid-cols-2 gap-4">
        {flows.map((f) => (
          <div key={f.id} className="bw-card p-5 flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="size-10 rounded-xl bg-[#070E1A] text-[#34DFAC] flex items-center justify-center border border-[#D7B158]/35">
                    <Workflow size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-sm">{f.name}</div>
                    <div className="text-[11px] font-mono-num text-[#179373]">{f.trigger_event} · {f.channel}</div>
                  </div>
                </div>
                <StatusPill label={f.enabled ? 'ACTIVE' : 'PAUSED'} tone={f.enabled ? 'emerald' : 'neutral'} />
              </div>
              <div className="mt-3 p-3 rounded-xl bg-[var(--bw-soft)] text-xs space-y-1">
                <div><b className="text-[var(--bw-muted)]">WHEN:</b> <code className="font-mono-num">{f.condition_expr}</code></div>
                <div><b className="text-[var(--bw-muted)]">THEN:</b> {f.action_desc}</div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-[var(--bw-line)] text-xs">
              <span className="font-mono-num text-[var(--bw-muted)] flex items-center gap-1">
                <Zap size={12} className="text-[#D7B158]" /> {f.runs_count} executions
              </span>
              <div className="flex gap-2">
                <button type="button" onClick={() => void toggle(f.id, Boolean(f.enabled))} className="px-3 py-1.5 rounded-full border border-[var(--bw-line)] font-bold cursor-pointer">
                  {f.enabled ? 'Pause' : 'Enable'}
                </button>
                <button type="button" onClick={() => void runNow(f.id, f.name)} className="px-3 py-1.5 rounded-full bg-[#179373] text-white font-bold inline-flex items-center gap-1 cursor-pointer">
                  <Play size={12} /> Run Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PhonePage() {
  const { toast } = useAuth();
  const [calls, setCalls] = useState<any[]>([]);
  const [contactName, setContactName] = useState('Afshin Behbahani');
  const [phone, setPhone] = useState('+971 50 422 4218');
  const [outcome, setOutcome] = useState('Connected — DIP Follow-up');
  const [notes, setNotes] = useState('');

  const load = async () => {
    const d = await apiFetch<{ calls: any[] }>('/api/calls');
    setCalls(d.calls || []);
  };
  useEffect(() => {
    void load();
  }, []);

  const placeCall = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch<any>('/api/calls', {
        method: 'POST',
        body: JSON.stringify({ contact_name: contactName, phone, outcome, notes, duration_sec: 145 }),
      });
      toast(`Masked Vault Call Logged: ${contactName} (${res.masked_number})`);
      setNotes('');
      await load();
    } catch (err: any) {
      toast(err.message, 'err');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Betterway Phone · Zero-Leak Masked Vault Dialer"
        title="Softphone &"
        accent="Borrower Call Log"
        subtitle="Protects client PII under UAE PDPL by automatically masking numbers in staff call logs while tracking every advisor follow-up."
      />
      <div className="grid lg:grid-cols-12 gap-5">
        <form onSubmit={placeCall} className="lg:col-span-5 bw-card p-6 bg-[#070E1A] text-white border-[#D7B158]/35 space-y-3.5 text-xs">
          <div className="text-sm font-bold flex items-center gap-2 text-[#FCF1B7]">
            <PhoneCall size={17} className="text-[#34DFAC]" /> Place Masked Outbound Call
          </div>
          <div>
            <label className="block text-slate-300 mb-1">Borrower / Partner Name</label>
            <input value={contactName} onChange={(e) => setContactName(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-white/10 border border-white/15 text-white" />
          </div>
          <div>
            <label className="block text-slate-300 mb-1">Phone Number (Auto-Masked on Log)</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-white/10 border border-white/15 text-white font-mono-num" />
          </div>
          <div>
            <label className="block text-slate-300 mb-1">Call Outcome</label>
            <select value={outcome} onChange={(e) => setOutcome(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-[#0C1524] border border-white/15 text-white">
              <option>Connected — Fact-Find Booked</option>
              <option>Connected — DIP Follow-up</option>
              <option>Connected — Valuation Scheduled</option>
              <option>No Answer — WhatsApp Magic Link Sent</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-300 mb-1">Underwriting Call Notes</label>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Log salary, liabilities, AECB consent, or developer SOA status…" className="w-full p-3 rounded-xl bg-white/10 border border-white/15 text-white" />
          </div>
          <button type="submit" className="w-full h-11 rounded-full bg-gradient-to-r from-[#34DFAC] to-[#179373] text-[#070E1A] font-bold flex items-center justify-center gap-2 cursor-pointer">
            <PhoneOutgoing size={15} /> Log Masked Vault Call
          </button>
        </form>

        <div className="lg:col-span-7 bw-card p-5 space-y-3">
          <h3 className="text-sm font-bold">Recent Masked Call Activity</h3>
          <div className="divide-y divide-[var(--bw-line)] text-xs">
            {calls.map((c) => (
              <div key={c.id} className="py-3 flex items-start justify-between gap-3">
                <div>
                  <div className="font-bold">{c.contact_name} <span className="font-mono-num text-[#179373] ms-1">{c.masked_number}</span></div>
                  <div className="text-[var(--bw-muted)] mt-0.5">{c.notes || c.outcome}</div>
                  <div className="text-[10.5px] text-[var(--bw-muted)] mt-0.5">Advisor: {c.user_name}</div>
                </div>
                <StatusPill label={c.outcome.split('—')[0]!.trim()} tone="emerald" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AiCopilotPage() {
  const [prompt, setPrompt] = useState('');
  const [history, setHistory] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    {
      role: 'ai',
      text: 'Welcome to the Betterway AI Underwriting Copilot. I am grounded in your live SQLite loan book, CBUAE 50% DBR & LTV rules, live EIBOR snapshot (3M: 4.207%), and Betterway’s 15-year Salaried / Low-Doc / Non-Resident underwriting playbook. Ask anything!',
    },
  ]);
  const [busy, setBusy] = useState(false);

  const ask = async (q: string) => {
    if (!q.trim()) return;
    setHistory((h) => [...h, { role: 'user', text: q }]);
    setPrompt('');
    setBusy(true);
    try {
      const res = await apiFetch<{ answer: string }>('/api/ai/copilot', { method: 'POST', body: JSON.stringify({ prompt: q }) });
      setHistory((h) => [...h, { role: 'ai', text: res.answer }]);
    } finally {
      setBusy(false);
    }
  };

  const PRESETS = [
    'Give me our executive pipeline summary & DSA pool',
    'Explain Betterway Low-Doc self-employed underwriting rules',
    'What are Non-Resident minimum bank balance & LTV criteria?',
    'Show live CBUAE EIBOR rates & buyout early settlement cap',
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Grounded Mortgage Intelligence · Zero Hallucination Rules"
        title="Betterway AI"
        accent="Underwriting Copilot"
        subtitle="Instant answers backed by live SQLite case telemetry, CBUAE Circular 31/2013 thresholds, and Betterway's 15-year UAE bank policy handbook."
      />

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => void ask(p)}
            className="px-3.5 py-2 rounded-full text-xs font-semibold bg-[var(--bw-card)] border border-[var(--bw-line)] hover:border-[#179373] cursor-pointer"
          >
            <Sparkles size={12} className="inline me-1.5 text-[#D7B158]" />
            {p}
          </button>
        ))}
      </div>

      <div className="bw-card p-5 space-y-4">
        <div className="space-y-3 max-h-[420px] overflow-y-auto">
          {history.map((h, i) => (
            <div
              key={i}
              className={`p-4 rounded-2xl text-sm whitespace-pre-line leading-relaxed ${
                h.role === 'user'
                  ? 'bg-[#070E1A] text-white ms-auto max-w-2xl'
                  : 'bg-[var(--bw-soft)] text-[var(--bw-ink)] border border-[var(--bw-line)] max-w-3xl'
              }`}
            >
              {h.role === 'ai' && (
                <div className="text-[10.5px] font-bold uppercase tracking-wider text-[#179373] mb-1.5 flex items-center gap-1.5">
                  <Bot size={14} /> Betterway Underwriting Copilot
                </div>
              )}
              {h.text}
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void ask(prompt);
          }}
          className="flex gap-2 pt-2 border-t border-[var(--bw-line)]"
        >
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask about DBR rules, Low-Doc self-employed, Non-Resident banks, EIBOR, or live pipeline…"
            className="flex-1 h-11 px-4 rounded-full border border-[var(--bw-line)] bg-[var(--bw-card)] text-sm"
          />
          <button
            type="submit"
            disabled={busy}
            className="h-11 px-6 rounded-full bg-gradient-to-r from-[#179373] to-[#0A4A3E] text-white text-xs font-bold cursor-pointer"
          >
            {busy ? 'Analyzing…' : 'Ask Copilot'}
          </button>
        </form>
      </div>
    </div>
  );
}
