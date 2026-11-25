import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Plus,
  Send,
  Square,
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { PageHeader, StatusPill } from '../components/UiPrimitives';

const dubaiToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(new Date());

export function MyWorkPage() {
  const { toast } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [scope, setScope] = useState<'all' | 'mine'>('all');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(dubaiToday());
  const [caseCode, setCaseCode] = useState('');
  const [priority, setPriority] = useState('High');

  const load = async (sc = scope) => {
    const d = await apiFetch<{ tasks: any[] }>(`/api/tasks?scope=${sc}`);
    setTasks(d.tasks || []);
  };
  useEffect(() => {
    void load(scope);
  }, [scope]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await apiFetch('/api/tasks', { method: 'POST', body: JSON.stringify({ title, due_date: dueDate, case_code: caseCode, priority }) });
    setTitle('');
    setCaseCode('');
    toast('Task added to your action list');
    await load(scope);
  };

  const toggleDone = async (t: any) => {
    const next = t.status === 'Done' ? 'To do' : 'Done';
    await apiFetch(`/api/tasks/${t.id}`, { method: 'PATCH', body: JSON.stringify({ status: next }) });
    toast(next === 'Done' ? `Completed: ${t.title}` : 'Re-opened task');
    await load(scope);
  };

  const today = dubaiToday();
  const openTasks = tasks.filter((t) => t.status !== 'Done');
  const doneTasks = tasks.filter((t) => t.status === 'Done');
  const overdue = openTasks.filter((t) => t.due_date < today);
  const dueToday = openTasks.filter((t) => t.due_date === today);
  const upcoming = openTasks.filter((t) => t.due_date > today);

  const renderGroup = (label: string, list: any[], tone: 'red' | 'emerald' | 'navy') => {
    if (!list.length) return null;
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
          <StatusPill label={`${label} (${list.length})`} tone={tone} />
        </div>
        <div className="bw-card divide-y divide-[var(--bw-line)]">
          {list.map((t) => (
            <div key={t.id} className="p-3.5 flex items-center gap-3 hover:bg-[var(--bw-soft)]/50">
              <button type="button" onClick={() => void toggleDone(t)} className="text-[#179373] cursor-pointer">
                {t.status === 'Done' ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-slate-400 hover:text-[#179373]" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold ${t.status === 'Done' ? 'line-through text-[var(--bw-muted)]' : ''}`}>{t.title}</div>
                <div className="text-[11px] text-[var(--bw-muted)]">
                  {t.assignee_name} · {t.kind} {t.case_code ? `· ${t.case_code}` : ''}
                </div>
              </div>
              <StatusPill label={t.priority} tone={t.priority === 'Urgent' ? 'red' : t.priority === 'High' ? 'gold' : 'neutral'} />
              <span className="font-mono-num text-xs text-[var(--bw-muted)]">{t.due_date}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        eyebrow="Betterway Work · Simple Daily Execution"
        title="My Work &"
        accent="Today's Tasks"
        subtitle="Everything that moves a mortgage forward — Overdue, Due Today, and Upcoming. Tick off tasks as you finish them."
        actions={
          <div className="inline-flex rounded-full border border-[var(--bw-line)] bg-[var(--bw-card)] p-0.5">
            {([['all', 'Whole Team'], ['mine', 'Only Mine']] as const).map(([id, lbl]) => (
              <button
                key={id}
                type="button"
                onClick={() => setScope(id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer ${scope === id ? 'bg-[#070E1A] text-[#FCF1B7]' : 'text-[var(--bw-muted)]'}`}
              >
                {lbl}
              </button>
            ))}
          </div>
        }
      />

      <form onSubmit={addTask} className="bw-card p-3.5 flex flex-wrap items-center gap-2.5">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a clear next action (e.g. Call ENBD RM for BW-2026-M02 valuation)…"
          className="flex-1 min-w-[220px] h-10 px-3.5 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-soft)]/50 text-sm"
        />
        <input value={caseCode} onChange={(e) => setCaseCode(e.target.value)} placeholder="Case #" className="w-28 h-10 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] text-xs font-mono-num" />
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="h-10 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] text-xs font-bold">
          <option>Urgent</option><option>High</option><option>Medium</option><option>Low</option>
        </select>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-10 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] text-xs font-mono-num" />
        <button type="submit" className="h-10 px-5 rounded-full bg-[#179373] text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer">
          <Plus size={14} /> Add Task
        </button>
      </form>

      {renderGroup('Overdue — Do First', overdue, 'red')}
      {renderGroup('Due Today', dueToday, 'emerald')}
      {renderGroup('Coming Up', upcoming, 'navy')}
      {renderGroup('Completed Results', doneTasks, 'emerald')}
    </div>
  );
}

export function CalendarPage() {
  const { toast } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: '',
    event_type: 'DLD Transfer',
    dubai_date: dubaiToday(),
    dubai_time: '11:00 AM',
    location: 'Al Barsha Heights DLD Trustee',
    case_code: '',
  });

  const load = async () => {
    const d = await apiFetch<{ events: any[] }>('/api/calendar');
    setEvents(d.events || []);
  };
  useEffect(() => {
    void load();
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/api/calendar', { method: 'POST', body: JSON.stringify(form) });
    toast('Added to Betterway Company Schedule');
    setForm({ ...form, title: '', case_code: '' });
    await load();
  };

  const markDone = async (id: string) => {
    await apiFetch(`/api/calendar/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'Completed' }) });
    toast('Marked appointment completed');
    await load();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Company Schedule · Dubai GST"
        title="Transfers, Valuations &"
        accent="Deadlines Calendar"
        subtitle="Never miss a Bank Valuation, Developer NOC pickup, Form F deadline, DLD Trustee transfer, or fixed-rate expiry."
      />
      <div className="grid lg:grid-cols-12 gap-5">
        <form onSubmit={add} className="lg:col-span-4 bw-card p-5 space-y-3 text-xs h-fit">
          <h3 className="text-sm font-bold flex items-center gap-2"><CalendarDays size={16} className="text-[#179373]" /> Book Appointment / Deadline</h3>
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Event title…" className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)]" />
          <select value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)]">
            <option>DLD Transfer</option><option>Bank Valuation</option><option>Developer NOC</option><option>Client Meeting</option><option>Rate Reset</option>
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={form.dubai_date} onChange={(e) => setForm({ ...form, dubai_date: e.target.value })} className="h-9 px-2.5 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] font-mono-num" />
            <input value={form.dubai_time} onChange={(e) => setForm({ ...form, dubai_time: e.target.value })} className="h-9 px-2.5 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] font-mono-num" />
          </div>
          <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Location in Dubai / Abu Dhabi" className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)]" />
          <input value={form.case_code} onChange={(e) => setForm({ ...form, case_code: e.target.value })} placeholder="Case Code (optional)" className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] font-mono-num" />
          <button type="submit" className="w-full h-10 rounded-full bg-[#179373] text-white font-bold cursor-pointer">Save to Schedule</button>
        </form>

        <div className="lg:col-span-8 space-y-3">
          {events.map((ev) => (
            <div key={ev.id} className="bw-card p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-3">
                <div className="px-3 py-2 rounded-2xl bg-[#070E1A] text-[#FCF1B7] font-mono-num text-center shrink-0">
                  <div className="text-[10px] text-[#34DFAC]">{ev.dubai_date}</div>
                  <div className="font-bold text-xs">{ev.dubai_time}</div>
                </div>
                <div>
                  <div className="font-bold text-sm">{ev.title}</div>
                  <div className="text-[var(--bw-muted)] mt-0.5">{ev.location} · {ev.owner_name} {ev.case_code ? `· ${ev.case_code}` : ''}</div>
                  <div className="mt-1.5 flex gap-1.5">
                    <StatusPill label={ev.event_type} tone={ev.event_type === 'DLD Transfer' ? 'gold' : 'emerald'} />
                    <StatusPill label={ev.status} tone={ev.status === 'Completed' ? 'emerald' : 'blue'} />
                  </div>
                </div>
              </div>
              {ev.status !== 'Completed' && (
                <button type="button" onClick={() => void markDone(ev.id)} className="px-3.5 py-2 rounded-full bg-[#179373] text-white font-bold inline-flex items-center gap-1 cursor-pointer">
                  <Check size={13} /> Done
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FieldDutyPage() {
  const { toast } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [purpose, setPurpose] = useState('DLD Trustee Transfer');
  const [community, setCommunity] = useState('Al Barsha Heights');
  const [caseCode, setCaseCode] = useState('BW-2026-M04');
  const [notes, setNotes] = useState('');

  const load = async () => {
    const d = await apiFetch<{ sessions: any[] }>('/api/field-duty');
    setSessions(d.sessions || []);
  };
  useEffect(() => {
    void load();
  }, []);

  const startVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/api/field-duty/start', {
      method: 'POST',
      body: JSON.stringify({ purpose, community, case_code: caseCode, notes, lat: 25.1972 + (Math.random() - 0.5) * 0.05, lng: 55.2744 + (Math.random() - 0.5) * 0.05 }),
    });
    toast('Live Field GPS visit started!');
    setNotes('');
    await load();
  };

  const act = async (id: string, action: 'complete' | 'sos') => {
    await apiFetch(`/api/field-duty/${id}/action`, { method: 'POST', body: JSON.stringify({ action }) });
    toast(action === 'sos' ? 'SOS Alert sent immediately to Owner Shabib Siraj!' : 'Field visit marked Completed', action === 'sos' ? 'err' : 'ok');
    await load();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="SWK Field Duty Parity · GPS Visits & Live Team Map"
        title="Field Visits GPS &"
        accent="Live Team Board"
        subtitle="Track advisors and progression coordinators during Bank Branch runs, DLD Trustee transfers, Developer NOC pickups, Property Valuations, and Client Meetings — with 1-tap SOS safety alert."
      />
      <div className="grid lg:grid-cols-12 gap-5">
        <form onSubmit={startVisit} className="lg:col-span-4 bw-card p-5 space-y-3 text-xs h-fit">
          <h3 className="text-sm font-bold flex items-center gap-2"><Navigation size={16} className="text-[#179373]" /> Start Verified Field Visit</h3>
          <div>
            <label className="block font-bold mb-1">Visit Purpose</label>
            <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)]">
              <option>DLD Trustee Transfer</option><option>Bank Branch Meeting</option><option>Developer NOC Desk</option><option>Property Valuation</option><option>Client Home Meeting</option>
            </select>
          </div>
          <div>
            <label className="block font-bold mb-1">Dubai / UAE Area</label>
            <input value={community} onChange={(e) => setCommunity(e.target.value)} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)]" />
          </div>
          <div>
            <label className="block font-bold mb-1">Case Code</label>
            <input value={caseCode} onChange={(e) => setCaseCode(e.target.value)} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] font-mono-num" />
          </div>
          <div>
            <label className="block font-bold mb-1">Notes</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Submitting cheques & title deed copy…" className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)]" />
          </div>
          <button type="submit" className="w-full h-10 rounded-full bg-gradient-to-r from-[#179373] to-[#0A4A3E] text-white font-bold cursor-pointer">
            Start GPS Check-In
          </button>
        </form>

        <div className="lg:col-span-8 space-y-3">
          {sessions.map((s) => (
            <div key={s.id} className="bw-card p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className={s.status === 'SOS' ? 'text-red-500' : 'text-[#179373]'} />
                  <b className="text-sm">{s.user_name} — {s.purpose}</b>
                  <StatusPill label={s.status} tone={s.status === 'SOS' ? 'red' : s.status === 'Active' ? 'emerald' : 'neutral'} />
                </div>
                <div className="text-[var(--bw-muted)] mt-1">
                  {s.community} {s.case_code ? `· ${s.case_code}` : ''} · GPS <span className="font-mono-num">{Number(s.lat).toFixed(4)}, {Number(s.lng).toFixed(4)}</span>
                </div>
                {s.notes && <div className="mt-1">{s.notes}</div>}
              </div>
              {s.status === 'Active' && (
                <div className="flex gap-2">
                  <button type="button" onClick={() => void act(s.id, 'complete')} className="px-3 py-1.5 rounded-full bg-[#070E1A] text-[#FCF1B7] font-bold inline-flex items-center gap-1 cursor-pointer">
                    <Square size={11} /> End Visit
                  </button>
                  <button type="button" onClick={() => void act(s.id, 'sos')} className="px-3 py-1.5 rounded-full bg-red-600 text-white font-bold inline-flex items-center gap-1 cursor-pointer">
                    <AlertTriangle size={12} /> SOS
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const MSG_TEMPLATES = [
  { label: 'Missing Docs Checklist', subject: 'Quick Checklist for Your UAE Mortgage Pre-Approval', body: 'Hi [Client], To lock your bank pre-approval within 48 hours at zero broker fee, please upload: 1) Passport & Emirates ID 2) Salary Certificate 3) Last 6 months bank statements. Upload safely in your Betterway Portal.' },
  { label: 'Pre-Approval Won!', subject: 'Congratulations — Your UAE Mortgage Pre-Approval is Ready!', body: 'Great news [Client]! Your official Bank Pre-Approval (DIP) is approved. You can now sign Form F with full confidence. Reply YES to schedule the bank property valuation.' },
  { label: 'Fixed-Rate Ending Buyout', subject: 'Save AED 1,500+/month Before Your Mortgage Rate Resets', body: 'Hi [Client], Your fixed mortgage period ends soon and will revert to 3M EIBOR + margin. Betterway can compare all 24 UAE banks and handle a smooth buyout under the CBUAE early-exit cap. Shall we share your savings sheet?' },
  { label: 'Arabic Welcome (AR)', subject: 'مرحباً بك في بيتر واي للتمويل العقاري', body: 'مرحباً [العميل]، يسعدنا في بيتر واي للتمويل العقاري (دبي) مساعدتك في مقارنة عروض 24 بنكاً إماراتياً بدون أي رسوم وساطة. يرجى إرسال شهادة الراتب وكشف حساب 6 أشهر للبدء فوراً.' },
];

export function CommunicationsPage() {
  const { toast } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [channel, setChannel] = useState<'WhatsApp' | 'Email'>('WhatsApp');
  const [recipientName, setRecipientName] = useState('');
  const [recipientContact, setRecipientContact] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [caseCode, setCaseCode] = useState('');

  const load = async () => {
    const d = await apiFetch<{ messages: any[] }>('/api/communications');
    setMessages(d.messages || []);
  };
  useEffect(() => {
    void load();
  }, []);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/api/communications', {
      method: 'POST',
      body: JSON.stringify({ channel, recipient_name: recipientName, recipient_contact: recipientContact, subject, body, case_code: caseCode }),
    });
    toast(`${channel} message sent & logged to client history!`);
    setBody('');
    await load();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="WhatsApp & Corporate Email Desk"
        title="Client"
        accent="Messages & Templates"
        subtitle="Send clear Simple-English or Arabic WhatsApp and Email updates in 1 click using approved Betterway templates — every outbound message is automatically saved."
      />
      <div className="grid lg:grid-cols-12 gap-5">
        <form onSubmit={send} className="lg:col-span-5 bw-card p-5 space-y-3 text-xs">
          <div className="flex gap-2">
            {(['WhatsApp', 'Email'] as const).map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setChannel(ch)}
                className={`flex-1 h-9 rounded-full font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                  channel === ch ? 'bg-[#179373] text-white' : 'border border-[var(--bw-line)]'
                }`}
              >
                {ch === 'WhatsApp' ? <MessageCircle size={14} /> : <Mail size={14} />} {ch}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {MSG_TEMPLATES.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => { setSubject(t.subject); setBody(t.body); }}
                className="px-2.5 py-1 rounded-full bg-[var(--bw-soft)] hover:bg-[#34DFAC]/20 text-[11px] font-semibold cursor-pointer"
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input required value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Client Name" className="h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)]" />
            <input required value={recipientContact} onChange={(e) => setRecipientContact(e.target.value)} placeholder={channel === 'WhatsApp' ? '+971 50 …' : 'client@email.com'} className="h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)]" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject / Topic" className="col-span-2 h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)]" />
            <input value={caseCode} onChange={(e) => setCaseCode(e.target.value)} placeholder="Case #" className="h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] font-mono-num" />
          </div>
          <textarea required rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write clear, simple message…" className="w-full p-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)]" />
          <button type="submit" className="w-full h-10 rounded-full bg-[#070E1A] text-[#FCF1B7] font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer">
            <Send size={13} /> Send &amp; Log {channel}
          </button>
        </form>

        <div className="lg:col-span-7 bw-card p-5 space-y-3">
          <h3 className="text-sm font-bold">Sent Client Outbox ({messages.length})</h3>
          <div className="divide-y divide-[var(--bw-line)] text-xs max-h-[460px] overflow-y-auto">
            {messages.map((m) => (
              <div key={m.id} className="py-3 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-bold">{m.recipient_name} <span className="text-[var(--bw-muted)] font-normal">({m.recipient_contact})</span></div>
                  <div className="flex gap-1.5">
                    <StatusPill label={m.channel} tone={m.channel === 'WhatsApp' ? 'emerald' : 'blue'} />
                    {m.case_code && <StatusPill label={m.case_code} tone="gold" />}
                  </div>
                </div>
                {m.subject && <div className="font-semibold text-[#179373]">{m.subject}</div>}
                <p className="text-[var(--bw-body)] leading-relaxed">{m.body}</p>
                <div className="text-[10.5px] text-[var(--bw-muted)]">Sent by {m.sent_by} · {m.status}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
