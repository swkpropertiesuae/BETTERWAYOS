'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Hash, Send, ShieldAlert } from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { PageHeader, StaffAvatar, StatusPill } from '@/components/os/UiKit';

const CHANNELS = [
  { id: 'attendance-checkin', label: 'Attendance Check-In (Live)', desc: 'Auto-populated by Oud Metha 20s Office QR Check-In' },
  { id: 'general', label: 'General Company Desk', desc: 'Daily team announcements & leadership updates' },
  { id: 'bank-desk', label: '24-Bank Underwriting Desk', desc: 'Rate specials, APL confirmations & bank RM notes' },
  { id: 'progression', label: 'Valuations, NOC & Trustee', desc: 'Step 07–10 closing coordination' },
  { id: 'urgent-alerts', label: 'Urgent Alerts & Field SOS', desc: 'Critical SLA & Field GPS SOS escalations' },
];

export default function TeamGroupInsidePage() {
  const { toast } = useOs();
  const [channel, setChannel] = useState('attendance-checkin');
  const [messages, setMessages] = useState<any[]>([]);
  const [body, setBody] = useState('');

  const load = useCallback(async (ch = channel) => {
    const r = await fetch(`/api/v1/chat?channel=${encodeURIComponent(ch)}`);
    if (r.ok) {
      const d = await r.json();
      setMessages(d.messages ?? []);
    }
  }, [channel]);

  useEffect(() => {
    void load(channel);
    const id = setInterval(() => void load(channel), 8000);
    return () => clearInterval(id);
  }, [channel, load]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    const r = await fetch('/api/v1/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel, body }),
    });
    if (r.ok) {
      setBody('');
      await load(channel);
    } else {
      toast('Could not send message', 'err');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Betterway Inside · Company Team Group & Auto Check-In Feed"
        title="Team Group"
        accent="(#attendance-checkin)"
        subtitle="Every staff check-in via the Al Nasr Plaza Oud Metha 20-second Reception QR automatically posts here in real time."
      />

      <div className="grid lg:grid-cols-12 gap-5">
        <div className="lg:col-span-4 bw-card p-4 space-y-2">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--bw-muted)] px-2">Channels</div>
          {CHANNELS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setChannel(c.id)}
              className={`w-full p-3 rounded-xl text-start text-xs transition cursor-pointer ${
                channel === c.id ? 'bg-[#0A1128] text-white' : 'hover:bg-[var(--bw-soft)]'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                <Hash size={13} className={channel === c.id ? 'text-[#34DFAC]' : 'text-[var(--bw-muted)]'} />
                {c.label}
              </div>
              <div className={`text-[10.5px] mt-0.5 ${channel === c.id ? 'text-slate-300' : 'text-[var(--bw-muted)]'}`}>{c.desc}</div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-8 bw-card p-5 flex flex-col justify-between min-h-[520px]">
          <div className="space-y-3 max-h-[420px] overflow-y-auto pe-1">
            {messages.length === 0 ? (
              <div className="py-16 text-center text-xs text-[var(--bw-muted)]">
                No posts in #{channel} yet. Staff check-ins from the Oud Metha Office QR appear here automatically.
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-3.5 rounded-2xl border text-xs flex items-start gap-3 ${
                    m.message_kind === 'CHECKIN_CARD'
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300/60'
                      : m.message_kind === 'SOS'
                        ? 'bg-red-50 dark:bg-red-950/40 border-red-400/70'
                        : 'bg-[var(--bw-bg)]/70 border-[var(--bw-line)]'
                  }`}
                >
                  <StaffAvatar name={m.sender_name} avatarUrl={m.sender_avatar || null} initials={m.sender_name.slice(0, 2).toUpperCase()} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-bold flex items-center gap-1.5">
                        {m.sender_name}
                        {m.message_kind === 'CHECKIN_CARD' && <StatusPill label="Verified Check-In" tone="emerald" />}
                        {m.message_kind === 'SOS' && <StatusPill label="FIELD SOS" tone="red" />}
                      </div>
                      <span className="text-[10px] text-[var(--bw-muted)]">
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="mt-1 leading-relaxed">{m.body}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={send} className="pt-4 mt-4 border-t border-[var(--bw-line)] flex gap-2">
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={`Message #${channel}...`}
              className="flex-1 h-10 px-4 rounded-full border border-[var(--bw-line)] bg-[var(--bw-bg)] text-xs outline-none focus:border-[#0D8A6A]"
            />
            <button type="submit" className="h-10 px-5 rounded-full bg-[#0D8A6A] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer">
              <Send size={13} /> Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
