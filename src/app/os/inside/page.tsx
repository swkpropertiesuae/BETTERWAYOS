'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  BellOff,
  BellRing,
  Briefcase,
  Building2,
  CheckCheck,
  ExternalLink,
  Hash,
  Info,
  Lock,
  MapPin,
  MessagesSquare,
  Phone,
  PhoneCall,
  Pin,
  PinOff,
  Reply,
  Search,
  Send,
  ShieldAlert,
  Smile,
  X,
} from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { PageHeader, StaffAvatar, StatusPill } from '@/components/os/UiKit';
import { OFFICIAL_ROSTER } from '@/lib/domain/staff';
import { BETTERWAY_EXTENSIONS, dialViaSip } from '@/lib/sip-store';

interface ChannelDef {
  id: string;
  label: string;
  desc: string;
  badge: string;
  ownerOnly?: boolean;
}

const INSIDE_CHANNELS: ChannelDef[] = [
  {
    id: 'attendance-checkin',
    label: 'attendance-checkin',
    desc: 'Live feed populated automatically when staff scan the Al Nasr Plaza Oud Metha Reception QR.',
    badge: 'Live QR',
  },
  {
    id: 'general',
    label: 'general-desk',
    desc: 'Daily Betterway Dubai desk announcements, team huddles, and leadership updates.',
    badge: 'Company',
  },
  {
    id: 'bank-desk',
    label: 'bank-rm-updates',
    desc: '2026 UAE bank rate drops, zero-PF promos, APL developer approvals & RM desk changes.',
    badge: '18 Banks',
  },
  {
    id: 'pre-approvals',
    label: 'pre-approvals',
    desc: 'Steps 01–06 submissions, credit queries, AECB flags & pre-approval letter sign-offs.',
    badge: 'Credit',
  },
  {
    id: 'progression',
    label: 'valuations-and-fol',
    desc: 'Steps 07–09 valuation panel bookings, Final Offer Letters (FOL) & developer NOCs.',
    badge: 'Operations',
  },
  {
    id: 'disbursals',
    label: 'disbursals-payouts',
    desc: 'Steps 10–12 DLD Trustee transfers, Manager Cheques & bank DSA invoice confirmations.',
    badge: 'Closing',
  },
  {
    id: 'urgent-alerts',
    label: 'urgent-alerts-sos',
    desc: 'Time-critical SLA escalations, Form F expiry warnings & live Field GPS SOS dispatches.',
    badge: 'SLA / SOS',
  },
  {
    id: 'owners-private',
    label: 'owners-private',
    desc: 'Strictly private channel for Warda Kapadia & Shabib Siraj only.',
    badge: 'Owners Only',
    ownerOnly: true,
  },
];

const QUICK_REACTIONS = ['👍', '❤️', '✅', '🔥', '🙏'];
const COMPOSER_EMOJIS = ['👍', '✅', '🏦', '📄', '🔑', '📍', '🎉', '🙏', '📞', '⏱️'];

interface ChatMsg {
  id: string;
  channel: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  sender_avatar?: string;
  message_kind: 'TEXT' | 'CHECKIN_CARD' | 'ALERT' | 'SOS';
  body: string;
  metadata?: {
    reactions?: Record<string, string[]>;
    cardType?: 'LOCATION' | 'CASE_CARD';
    mapsLink?: string;
    lat?: number;
    lng?: number;
    caseCode?: string;
    bankName?: string;
    loanAmount?: string;
    replyTo?: { id: string; senderName: string; excerpt: string };
  };
  created_at: string;
}

function makeDmChannelId(userA: string, userB: string): string {
  const [first, second] = [userA, userB].sort();
  return `dm:${first}:${second}`;
}

function formatDubaiTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Dubai',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
      .format(new Date(iso))
      .toUpperCase();
  } catch {
    return '';
  }
}

function formatDubaiDayLabel(iso: string): string {
  try {
    const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' });
    const dStr = fmt.format(new Date(iso));
    const todayStr = fmt.format(new Date());
    const yestStr = fmt.format(new Date(Date.now() - 86_400_000));
    if (dStr === todayStr) return 'Today · Dubai GST';
    if (dStr === yestStr) return 'Yesterday';
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Dubai',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return 'Today';
  }
}

function BetterwayInsideInner() {
  const { user, toast } = useOs();
  const searchParams = useSearchParams();
  const dmParam = searchParams?.get('dm') || '';

  const [activeThread, setActiveThread] = useState<string>('attendance-checkin');
  const [railTab, setRailTab] = useState<'all' | 'channels' | 'direct' | 'pinned'>('all');
  const [searchQ, setSearchQ] = useState('');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [summaries, setSummaries] = useState<
    Record<string, { sender_name: string; body: string; created_at: string; count: number }>
  >({});
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; senderName: string; excerpt: string } | null>(null);
  const [showEmojiBar, setShowEmojiBar] = useState(false);
  const [showCaseComposer, setShowCaseComposer] = useState(false);
  const [caseDraft, setCaseDraft] = useState({ caseCode: 'BW-2026-041', bankName: 'Emirates NBD', loanAmount: 'AED 2,800,000', note: 'Pre-approval received — booking CBRE valuation.' });
  const [showInfo, setShowInfo] = useState(false);
  const [pinnedThreads, setPinnedThreads] = useState<string[]>(['attendance-checkin', 'bank-desk']);
  const [mutedThreads, setMutedThreads] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const visibleChannels = useMemo(
    () => INSIDE_CHANNELS.filter((c) => !c.ownerOnly || user?.isOwner),
    [user?.isOwner],
  );

  const dmPeers = useMemo(
    () => OFFICIAL_ROSTER.filter((m) => m.id !== user?.id && m.id !== 'USR-00'),
    [user?.id],
  );

  // Sync deep-link ?dm=USR-XX from SIP Call Desk
  useEffect(() => {
    if (dmParam && user?.id && dmParam !== user.id) {
      setActiveThread(makeDmChannelId(user.id, dmParam));
    }
  }, [dmParam, user?.id]);

  // Persist pinned/muted thread preferences
  useEffect(() => {
    try {
      const savedPins = window.localStorage.getItem('bw_inside_pins_v1');
      const savedMutes = window.localStorage.getItem('bw_inside_mutes_v1');
      if (savedPins) setPinnedThreads(JSON.parse(savedPins));
      if (savedMutes) setMutedThreads(JSON.parse(savedMutes));
    } catch {
      /* ignore */
    }
  }, []);

  const togglePinThread = (id: string) => {
    setPinnedThreads((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev];
      try {
        window.localStorage.setItem('bw_inside_pins_v1', JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const toggleMuteThread = (id: string) => {
    setMutedThreads((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        window.localStorage.setItem('bw_inside_mutes_v1', JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const loadThread = useCallback(async (ch: string) => {
    const [msgRes, sumRes] = await Promise.all([
      fetch(`/api/v1/chat?channel=${encodeURIComponent(ch)}`, { cache: 'no-store' }),
      fetch('/api/v1/chat?summary=1', { cache: 'no-store' }),
    ]);
    if (msgRes.ok) {
      const d = await msgRes.json();
      setMessages(d.messages ?? []);
    }
    if (sumRes.ok) {
      const s = await sumRes.json();
      setSummaries(s.channels ?? {});
    }
  }, []);

  useEffect(() => {
    void loadThread(activeThread);
    const id = setInterval(() => void loadThread(activeThread), 8000);
    return () => clearInterval(id);
  }, [activeThread, loadThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, activeThread]);

  const activeChannelDef = visibleChannels.find((c) => c.id === activeThread) ?? null;
  const activeDmPeer = useMemo(() => {
    if (!activeThread.startsWith('dm:') || !user?.id) return null;
    const parts = activeThread.split(':');
    const peerId = parts[1] === user.id ? parts[2] : parts[1];
    return OFFICIAL_ROSTER.find((m) => m.id === peerId) ?? null;
  }, [activeThread, user?.id]);

  const activePeerExt = useMemo(() => {
    if (!activeDmPeer) return null;
    return BETTERWAY_EXTENSIONS.find((e) => e.userId === activeDmPeer.id) ?? null;
  }, [activeDmPeer]);

  const postMessage = async (payload: {
    text: string;
    messageKind?: 'TEXT' | 'ALERT';
    metadata?: Record<string, unknown>;
  }) => {
    if (!payload.text.trim()) return;
    setSending(true);
    try {
      const meta = {
        ...(payload.metadata || {}),
        ...(replyTo ? { replyTo } : {}),
      };
      const r = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: activeThread,
          body: payload.text.trim(),
          messageKind: payload.messageKind || 'TEXT',
          metadata: meta,
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        toast(err.error || 'Could not send message', 'err');
        return;
      }
      setBody('');
      setReplyTo(null);
      setShowEmojiBar(false);
      await loadThread(activeThread);
    } finally {
      setSending(false);
    }
  };

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    await postMessage({ text: body });
  };

  const handleShareLocation = () => {
    const sendPin = (lat: number, lng: number, label: string) => {
      const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
      void postMessage({
        text: `Shared live location: ${label} (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        metadata: { cardType: 'LOCATION', lat, lng, mapsLink },
      });
      toast('Live location pin posted to Betterway Inside');
    };

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => sendPin(pos.coords.latitude, pos.coords.longitude, 'Live Dubai Field GPS'),
        () => sendPin(25.2367, 55.3112, 'Betterway HQ · Al Nasr Plaza, Oud Metha'),
        { timeout: 4000 },
      );
    } else {
      sendPin(25.2367, 55.3112, 'Betterway HQ · Al Nasr Plaza, Oud Metha');
    }
  };

  const handleShareCaseCard = async (e: React.FormEvent) => {
    e.preventDefault();
    await postMessage({
      text: `${caseDraft.caseCode} · ${caseDraft.bankName} · ${caseDraft.loanAmount} — ${caseDraft.note}`,
      metadata: {
        cardType: 'CASE_CARD',
        caseCode: caseDraft.caseCode,
        bankName: caseDraft.bankName,
        loanAmount: caseDraft.loanAmount,
      },
    });
    setShowCaseComposer(false);
    toast(`Posted Mortgage Case Card ${caseDraft.caseCode}`);
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    const r = await fetch('/api/v1/chat', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId, emoji }),
    });
    if (r.ok) {
      const d = await r.json();
      setMessages((prev) => prev.map((m) => (m.id === messageId ? d.message : m)));
    }
  };

  const q = searchQ.trim().toLowerCase();
  const filteredChannels = visibleChannels.filter((c) => {
    if (railTab === 'direct') return false;
    if (railTab === 'pinned' && !pinnedThreads.includes(c.id)) return false;
    if (q && !`${c.label} ${c.desc} ${c.badge}`.toLowerCase().includes(q)) return false;
    return true;
  });

  const filteredPeers = dmPeers.filter((m) => {
    const dmId = user?.id ? makeDmChannelId(user.id, m.id) : `dm:${m.id}`;
    if (railTab === 'channels') return false;
    if (railTab === 'pinned' && !pinnedThreads.includes(dmId)) return false;
    if (q && !`${m.name} ${m.designation} ${m.department}`.toLowerCase().includes(q)) return false;
    return true;
  });

  // Group messages by Dubai calendar day
  const groupedMessages = useMemo(() => {
    const groups: Array<{ day: string; items: ChatMsg[] }> = [];
    for (const msg of messages) {
      const day = formatDubaiDayLabel(msg.created_at);
      const last = groups[groups.length - 1];
      if (!last || last.day !== day) {
        groups.push({ day, items: [msg] });
      } else {
        last.items.push(msg);
      }
    }
    return groups;
  }, [messages]);

  const isPinned = pinnedThreads.includes(activeThread);
  const isMuted = mutedThreads.includes(activeThread);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Betterway Inside · Internal Messaging, Bank Desk Channels & Direct Staff Chat"
        title="Betterway"
        accent="Inside"
        subtitle="Dedicated company channels, 1-on-1 staff direct messages, automatic Oud Metha QR check-in cards, mortgage case shares, and 1-click SIP voice calls."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/os/sip-calls" className="bw-btn bw-btn-obsidian text-xs py-2 min-h-[36px]">
              <PhoneCall size={13} className="text-[#34f0bc]" /> Open SIP Call Desk
            </Link>
          </div>
        }
      />

      {/* Main Split Messaging Studio */}
      <div className="grid lg:grid-cols-12 gap-4 items-stretch">
        {/* LEFT RAIL: Search, Tabs, Channels & Direct Messages */}
        <aside className="lg:col-span-4 xl:col-span-3 bw-card p-3.5 flex flex-col gap-3 min-h-[600px] max-h-[720px]">
          <label className="flex items-center gap-2 px-3 h-9 rounded-full bg-[var(--bw-soft)] border border-[var(--bw-line)] focus-within:border-[#119c78]">
            <Search size={13} className="text-[var(--bw-muted)] shrink-0" />
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search channels or team..."
              className="flex-1 bg-transparent outline-none text-xs"
            />
          </label>

          <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-[var(--bw-soft)] text-[10.5px] font-extrabold">
            {(
              [
                ['all', 'All'],
                ['channels', 'Channels'],
                ['direct', 'Direct'],
                ['pinned', 'Pinned'],
              ] as const
            ).map(([id, lbl]) => (
              <button
                key={id}
                type="button"
                onClick={() => setRailTab(id)}
                className={`py-1.5 rounded-lg cursor-pointer transition ${
                  railTab === id ? 'bg-[#090d13] text-[#34f0bc] shadow-xs' : 'text-[var(--bw-muted)] hover:text-[var(--bw-ink)]'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pe-0.5">
            {filteredChannels.length > 0 && (
              <div className="space-y-1">
                <div className="px-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--bw-muted)] flex items-center justify-between">
                  <span>Mortgage Channels</span>
                  <span>{filteredChannels.length}</span>
                </div>
                {filteredChannels.map((c) => {
                  const active = activeThread === c.id;
                  const last = summaries[c.id];
                  const pinned = pinnedThreads.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setActiveThread(c.id)}
                      className={`w-full p-2.5 rounded-xl text-start transition cursor-pointer ${
                        active
                          ? 'bg-[#090d13] text-white shadow-md'
                          : 'hover:bg-[var(--bw-soft)] text-[var(--bw-ink)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-bold text-xs flex items-center gap-1.5 truncate">
                          {c.ownerOnly ? (
                            <Lock size={12} className={active ? 'text-[#fbe8a4]' : 'text-[#b88a1e]'} />
                          ) : (
                            <Hash size={12} className={active ? 'text-[#34f0bc]' : 'text-[#119c78]'} />
                          )}
                          <span className="truncate">{c.label}</span>
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {pinned && <Pin size={10} className={active ? 'text-[#fbe8a4]' : 'text-[#b88a1e]'} />}
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                              active ? 'bg-white/12 text-[#34f0bc]' : 'bg-[var(--bw-soft)] text-[var(--bw-muted)]'
                            }`}
                          >
                            {c.badge}
                          </span>
                        </div>
                      </div>
                      <div className={`text-[10.5px] truncate mt-0.5 ${active ? 'text-slate-300' : 'text-[var(--bw-muted)]'}`}>
                        {last ? `${last.sender_name}: ${last.body}` : c.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {filteredPeers.length > 0 && (
              <div className="space-y-1">
                <div className="px-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--bw-muted)] flex items-center justify-between">
                  <span>Direct Messages</span>
                  <span>{filteredPeers.length}</span>
                </div>
                {filteredPeers.map((peer) => {
                  const dmId = user?.id ? makeDmChannelId(user.id, peer.id) : `dm:${peer.id}`;
                  const active = activeThread === dmId;
                  const last = summaries[dmId];
                  const ext = BETTERWAY_EXTENSIONS.find((e) => e.userId === peer.id);
                  return (
                    <button
                      key={peer.id}
                      type="button"
                      onClick={() => setActiveThread(dmId)}
                      className={`w-full p-2.5 rounded-xl text-start transition cursor-pointer flex items-center gap-2.5 ${
                        active
                          ? 'bg-[#090d13] text-white shadow-md'
                          : 'hover:bg-[var(--bw-soft)] text-[var(--bw-ink)]'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <StaffAvatar name={peer.name} avatarUrl={peer.avatarUrl} initials={peer.initials} size="sm" />
                        <span className="absolute -bottom-0.5 -end-0.5 size-2.5 rounded-full bg-[#22e2ad] ring-2 ring-white dark:ring-[#090d13]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs truncate">{peer.name}</span>
                          {ext && (
                            <span className={`text-[9.5px] font-mono-num font-bold ${active ? 'text-[#fbe8a4]' : 'text-[var(--bw-muted)]'}`}>
                              Ext {ext.ext}
                            </span>
                          )}
                        </div>
                        <div className={`text-[10.5px] truncate ${active ? 'text-slate-300' : 'text-[var(--bw-muted)]'}`}>
                          {last ? last.body : peer.designation}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* CENTER THREAD CANVAS */}
        <section
          className={`${
            showInfo ? 'lg:col-span-5 xl:col-span-6' : 'lg:col-span-8 xl:col-span-9'
          } bw-card flex flex-col overflow-hidden min-h-[600px] max-h-[720px]`}
        >
          {/* Glossy Black Thread Header */}
          <div className="px-5 py-3.5 bg-[#090d13] text-white border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {activeDmPeer ? (
                <StaffAvatar
                  name={activeDmPeer.name}
                  avatarUrl={activeDmPeer.avatarUrl}
                  initials={activeDmPeer.initials}
                  size="sm"
                />
              ) : (
                <span className="size-9 rounded-xl bg-white/10 border border-[#22e2ad]/40 text-[#34f0bc] flex items-center justify-center shrink-0">
                  {activeChannelDef?.ownerOnly ? <Lock size={16} className="text-[#fbe8a4]" /> : <Hash size={16} />}
                </span>
              )}
              <div className="min-w-0">
                <div className="font-display font-extrabold text-sm flex items-center gap-2 truncate">
                  {activeDmPeer ? activeDmPeer.name : `#${activeChannelDef?.label || activeThread}`}
                  {activeDmPeer && (
                    <span className="px-2 py-0.5 rounded-full bg-[#22e2ad]/15 text-[#34f0bc] text-[9.5px] font-bold">
                      Online · {activePeerExt ? `Ext ${activePeerExt.ext}` : 'Dubai'}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-300 truncate">
                  {activeDmPeer
                    ? `${activeDmPeer.designation} · ${activeDmPeer.department}`
                    : activeChannelDef?.desc || 'Betterway internal channel'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {activeDmPeer && activePeerExt ? (
                <button
                  type="button"
                  onClick={() => {
                    dialViaSip({
                      number: `Ext ${activePeerExt.ext}`,
                      name: activeDmPeer.name,
                      category: 'Internal Ext',
                      direction: 'INTERNAL',
                    });
                    toast(`Dialing ${activeDmPeer.name} on SIP Ext ${activePeerExt.ext}`);
                  }}
                  className="px-3 py-1.5 rounded-full bg-[#119c78] hover:bg-[#14b58b] text-white text-[11px] font-extrabold inline-flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Phone size={12} /> Call Ext {activePeerExt.ext}
                </button>
              ) : (
                <Link
                  href="/os/sip-calls"
                  className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/18 text-[#34f0bc] text-[11px] font-bold inline-flex items-center gap-1.5 transition"
                >
                  <PhoneCall size={12} /> SIP Desk
                </Link>
              )}

              <button
                type="button"
                onClick={() => togglePinThread(activeThread)}
                className={`size-8 rounded-full flex items-center justify-center cursor-pointer transition ${
                  isPinned ? 'bg-[#fbe8a4] text-[#070e1a]' : 'bg-white/10 hover:bg-white/20 text-slate-200'
                }`}
                title={isPinned ? 'Unpin thread' : 'Pin thread'}
              >
                {isPinned ? <PinOff size={13} /> : <Pin size={13} />}
              </button>
              <button
                type="button"
                onClick={() => toggleMuteThread(activeThread)}
                className={`size-8 rounded-full flex items-center justify-center cursor-pointer transition ${
                  isMuted ? 'bg-amber-500/30 text-[#fbe8a4]' : 'bg-white/10 hover:bg-white/20 text-slate-200'
                }`}
                title={isMuted ? 'Unmute notifications' : 'Mute notifications'}
              >
                {isMuted ? <BellOff size={13} /> : <BellRing size={13} />}
              </button>
              <button
                type="button"
                onClick={() => setShowInfo((v) => !v)}
                className={`size-8 rounded-full flex items-center justify-center cursor-pointer transition ${
                  showInfo ? 'bg-[#22e2ad] text-[#070e1a]' : 'bg-white/10 hover:bg-white/20 text-slate-200'
                }`}
                title="Thread details"
              >
                <Info size={13} />
              </button>
            </div>
          </div>

          {/* Messages Scroll Viewport */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 bg-[var(--bw-soft)]/35">
            {groupedMessages.length === 0 ? (
              <div className="py-16 text-center space-y-2 max-w-md mx-auto">
                <div className="size-12 rounded-2xl bg-[#090d13] text-[#34f0bc] flex items-center justify-center mx-auto shadow-md">
                  <MessagesSquare size={20} />
                </div>
                <div className="font-display font-extrabold text-sm">
                  {activeDmPeer ? `Start a private conversation with ${activeDmPeer.name}` : `Welcome to #${activeChannelDef?.label || activeThread}`}
                </div>
                <p className="text-xs text-[var(--bw-muted)]">
                  {activeThread === 'attendance-checkin'
                    ? 'Staff QR check-ins from Al Nasr Plaza Oud Metha reception post here automatically.'
                    : 'Share bank rate updates, attach mortgage case cards, drop live field location pins, or dial teammates directly on SIP.'}
                </p>
              </div>
            ) : (
              groupedMessages.map((grp) => (
                <div key={grp.day} className="space-y-3">
                  <div className="flex items-center justify-center">
                    <span className="px-3 py-0.5 rounded-full bg-white dark:bg-[#111722] border border-[var(--bw-line)] text-[10px] font-extrabold text-[var(--bw-muted)] shadow-xs">
                      {grp.day}
                    </span>
                  </div>

                  {grp.items.map((m) => {
                    const isMine = m.sender_id === user?.id;
                    const reactions = m.metadata?.reactions ?? {};
                    const reactionEntries = Object.entries(reactions).filter(([, arr]) => Array.isArray(arr) && arr.length > 0);
                    return (
                      <div key={m.id} className={`flex items-start gap-2.5 ${isMine ? 'flex-row-reverse' : ''}`}>
                        <StaffAvatar
                          name={m.sender_name}
                          avatarUrl={m.sender_avatar || null}
                          initials={m.sender_name.slice(0, 2).toUpperCase()}
                          size="sm"
                        />
                        <div className={`max-w-[78%] space-y-1 ${isMine ? 'items-end flex flex-col' : ''}`}>
                          <div
                            className={`rounded-2xl px-4 py-3 border text-xs shadow-xs group relative ${
                              m.message_kind === 'SOS'
                                ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-400 text-rose-950 dark:text-rose-100'
                                : m.message_kind === 'CHECKIN_CARD'
                                  ? 'bg-[#e3fbf3] dark:bg-[#0d2b24] border-[#9be8ce] dark:border-[#1c5c4b]'
                                  : m.message_kind === 'ALERT'
                                    ? 'bg-[#fdf4dc] dark:bg-[#2a210f] border-[#d9b356]'
                                    : isMine
                                      ? 'bg-[#090d13] text-white border-[#22e2ad]/35'
                                      : 'bg-white dark:bg-[#111722] border-[var(--bw-line)] text-[var(--bw-ink)]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3 mb-1">
                              <div className="font-extrabold text-[11px] flex items-center gap-1.5">
                                <span className={isMine && m.message_kind === 'TEXT' ? 'text-[#34f0bc]' : ''}>
                                  {m.sender_name}
                                </span>
                                {m.message_kind === 'CHECKIN_CARD' && <StatusPill label="Verified QR Check-In" tone="emerald" />}
                                {m.message_kind === 'SOS' && <StatusPill label="FIELD SOS" tone="red" />}
                                {m.message_kind === 'ALERT' && <StatusPill label="SLA Alert" tone="gold" />}
                              </div>
                              <span
                                className={`text-[10px] font-mono-num flex items-center gap-1 ${
                                  isMine && m.message_kind === 'TEXT' ? 'text-slate-400' : 'text-[var(--bw-muted)]'
                                }`}
                              >
                                {formatDubaiTime(m.created_at)}
                                {isMine && <CheckCheck size={12} className="text-[#34f0bc]" />}
                              </span>
                            </div>

                            {m.metadata?.replyTo && (
                              <div
                                className={`mb-2 px-2.5 py-1.5 rounded-lg border-s-2 border-[#22e2ad] text-[10.5px] ${
                                  isMine && m.message_kind === 'TEXT' ? 'bg-white/10 text-slate-300' : 'bg-[var(--bw-soft)] text-[var(--bw-muted)]'
                                }`}
                              >
                                <div className="font-bold">{m.metadata.replyTo.senderName}</div>
                                <div className="truncate">{m.metadata.replyTo.excerpt}</div>
                              </div>
                            )}

                            {m.metadata?.cardType === 'CASE_CARD' && (
                              <div
                                className={`mb-2 p-2.5 rounded-xl border text-[11px] space-y-1 ${
                                  isMine ? 'bg-white/8 border-[#fbe8a4]/40' : 'bg-[var(--bw-soft)] border-[var(--bw-line)]'
                                }`}
                              >
                                <div className="font-extrabold flex items-center gap-1.5 text-[#119c78]">
                                  <Briefcase size={12} /> Mortgage Case · {m.metadata.caseCode}
                                </div>
                                <div className="font-mono-num font-bold">
                                  {m.metadata.bankName} · {m.metadata.loanAmount}
                                </div>
                              </div>
                            )}

                            <p className="leading-relaxed whitespace-pre-wrap">{m.body}</p>

                            {m.metadata?.mapsLink && (
                              <a
                                href={m.metadata.mapsLink}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#119c78] text-white text-[10.5px] font-bold hover:brightness-110"
                              >
                                <MapPin size={11} /> Open Live Pin in Google Maps <ExternalLink size={10} />
                              </a>
                            )}
                          </div>

                          {/* Reactions + Quick Actions Row */}
                          <div className="flex flex-wrap items-center gap-1 px-1">
                            {reactionEntries.map(([emoji, users]) => {
                              const reacted = Boolean(user?.id && users.includes(user.id));
                              return (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => void toggleReaction(m.id, emoji)}
                                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold border cursor-pointer transition ${
                                    reacted
                                      ? 'bg-[#090d13] text-[#34f0bc] border-[#22e2ad]/50'
                                      : 'bg-white dark:bg-[#111722] border-[var(--bw-line)]'
                                  }`}
                                >
                                  {emoji} {users.length}
                                </button>
                              );
                            })}

                            <div className="inline-flex items-center gap-0.5 opacity-60 hover:opacity-100 transition">
                              {QUICK_REACTIONS.slice(0, 3).map((em) => (
                                <button
                                  key={em}
                                  type="button"
                                  onClick={() => void toggleReaction(m.id, em)}
                                  className="size-6 rounded-full hover:bg-black/10 text-[11px] flex items-center justify-center cursor-pointer"
                                  title={`React ${em}`}
                                >
                                  {em}
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={() =>
                                  setReplyTo({
                                    id: m.id,
                                    senderName: m.sender_name,
                                    excerpt: m.body.slice(0, 90),
                                  })
                                }
                                className="size-6 rounded-full hover:bg-black/10 text-[var(--bw-muted)] flex items-center justify-center cursor-pointer"
                                title="Reply"
                              >
                                <Reply size={11} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Optional Mortgage Case Card Composer Sheet */}
          {showCaseComposer && (
            <form
              onSubmit={handleShareCaseCard}
              className="px-4 py-3 bg-[#fdf8e8] dark:bg-[#121822] border-t border-[var(--bw-line)] space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold flex items-center gap-1.5 text-[#0b5442] dark:text-[#34f0bc]">
                  <Briefcase size={13} /> Share Mortgage Case Update Card
                </span>
                <button type="button" onClick={() => setShowCaseComposer(false)} className="cursor-pointer">
                  <X size={14} />
                </button>
              </div>
              <div className="grid sm:grid-cols-3 gap-2">
                <input
                  value={caseDraft.caseCode}
                  onChange={(e) => setCaseDraft({ ...caseDraft, caseCode: e.target.value })}
                  placeholder="Case Ref"
                  className="h-8 px-2.5 rounded-lg border border-[var(--bw-line)] bg-white dark:bg-[#0d1219] font-mono-num font-bold"
                />
                <input
                  value={caseDraft.bankName}
                  onChange={(e) => setCaseDraft({ ...caseDraft, bankName: e.target.value })}
                  placeholder="UAE Bank"
                  className="h-8 px-2.5 rounded-lg border border-[var(--bw-line)] bg-white dark:bg-[#0d1219]"
                />
                <input
                  value={caseDraft.loanAmount}
                  onChange={(e) => setCaseDraft({ ...caseDraft, loanAmount: e.target.value })}
                  placeholder="Loan Amount"
                  className="h-8 px-2.5 rounded-lg border border-[var(--bw-line)] bg-white dark:bg-[#0d1219] font-mono-num"
                />
              </div>
              <div className="flex gap-2">
                <input
                  value={caseDraft.note}
                  onChange={(e) => setCaseDraft({ ...caseDraft, note: e.target.value })}
                  placeholder="Status milestone note..."
                  className="flex-1 h-8 px-2.5 rounded-lg border border-[var(--bw-line)] bg-white dark:bg-[#0d1219]"
                />
                <button type="submit" className="px-4 h-8 rounded-lg bg-[#090d13] text-[#34f0bc] font-extrabold cursor-pointer">
                  Post Card
                </button>
              </div>
            </form>
          )}

          {/* Reply Preview Bar */}
          {replyTo && (
            <div className="px-4 py-2 bg-[#e3fbf3] dark:bg-[#0d2b24] border-t border-[#9be8ce] flex items-center justify-between text-[11px]">
              <div className="truncate">
                <strong>Replying to {replyTo.senderName}:</strong> {replyTo.excerpt}
              </div>
              <button type="button" onClick={() => setReplyTo(null)} className="cursor-pointer ms-2">
                <X size={13} />
              </button>
            </div>
          )}

          {/* Emoji Picker Strip */}
          {showEmojiBar && (
            <div className="px-4 py-2 bg-white dark:bg-[#0d1219] border-t border-[var(--bw-line)] flex flex-wrap gap-1.5">
              {COMPOSER_EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setBody((p) => `${p}${em}`)}
                  className="size-8 rounded-lg hover:bg-[var(--bw-soft)] text-base flex items-center justify-center cursor-pointer"
                >
                  {em}
                </button>
              ))}
            </div>
          )}

          {/* Composer Bar */}
          <form onSubmit={handleSendText} className="p-3.5 bg-white dark:bg-[#0d1219] border-t border-[var(--bw-line)] space-y-2">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => setShowCaseComposer((v) => !v)}
                className="px-2.5 py-1 rounded-full bg-[var(--bw-soft)] hover:bg-[#090d13] hover:text-[#34f0bc] border border-[var(--bw-line)] font-bold inline-flex items-center gap-1 cursor-pointer transition"
              >
                <Briefcase size={11} /> Case Card
              </button>
              <button
                type="button"
                onClick={handleShareLocation}
                className="px-2.5 py-1 rounded-full bg-[var(--bw-soft)] hover:bg-[#090d13] hover:text-[#34f0bc] border border-[var(--bw-line)] font-bold inline-flex items-center gap-1 cursor-pointer transition"
              >
                <MapPin size={11} /> Live Pin
              </button>
              <button
                type="button"
                onClick={() =>
                  void postMessage({
                    text: body.trim() || 'Priority SLA reminder — please review pending FOL & valuation timeline.',
                    messageKind: 'ALERT',
                  })
                }
                className="px-2.5 py-1 rounded-full bg-[#fdf4dc] hover:bg-[#090d13] hover:text-[#fbe8a4] text-[#9a6b0d] border border-[#ebd28b] font-bold inline-flex items-center gap-1 cursor-pointer transition"
              >
                <ShieldAlert size={11} /> SLA Alert
              </button>
              <button
                type="button"
                onClick={() => setShowEmojiBar((v) => !v)}
                className="px-2.5 py-1 rounded-full bg-[var(--bw-soft)] border border-[var(--bw-line)] font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <Smile size={11} /> Emoji
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={
                  activeDmPeer
                    ? `Direct message ${activeDmPeer.name}...`
                    : `Message #${activeChannelDef?.label || activeThread}...`
                }
                className="flex-1 h-10 px-4 rounded-full border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] text-xs outline-none focus:border-[#119c78]"
              />
              <button
                type="submit"
                disabled={sending || !body.trim()}
                className="bw-btn bw-btn-obsidian h-10 px-5 text-xs disabled:opacity-50"
              >
                <Send size={13} className="text-[#34f0bc]" /> Send
              </button>
            </div>
          </form>
        </section>

        {/* RIGHT INFO PANEL (Toggleable) */}
        {showInfo && (
          <aside className="lg:col-span-3 bw-card p-4 space-y-4 min-h-[600px] max-h-[720px] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-[var(--bw-line)] pb-2.5">
              <span className="font-display font-extrabold">Thread Details</span>
              <button type="button" onClick={() => setShowInfo(false)} className="cursor-pointer">
                <X size={14} />
              </button>
            </div>

            {activeDmPeer ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <StaffAvatar
                    name={activeDmPeer.name}
                    avatarUrl={activeDmPeer.avatarUrl}
                    initials={activeDmPeer.initials}
                    size="md"
                  />
                  <div>
                    <div className="font-extrabold text-sm">{activeDmPeer.name}</div>
                    <div className="text-[11px] text-[var(--bw-muted)]">{activeDmPeer.designation}</div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--bw-soft)] space-y-1">
                  <div><strong>Department:</strong> {activeDmPeer.department}</div>
                  <div><strong>Email:</strong> {activeDmPeer.email}</div>
                  {activePeerExt && <div><strong>SIP Extension:</strong> Ext {activePeerExt.ext}</div>}
                </div>
                {activePeerExt && (
                  <button
                    type="button"
                    onClick={() =>
                      dialViaSip({
                        number: `Ext ${activePeerExt.ext}`,
                        name: activeDmPeer.name,
                        category: 'Internal Ext',
                        direction: 'INTERNAL',
                      })
                    }
                    className="bw-btn bw-btn-primary w-full text-xs py-2 min-h-[36px]"
                  >
                    <PhoneCall size={13} /> Call Ext {activePeerExt.ext} via SIP
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-[var(--bw-soft)] space-y-1">
                  <div className="font-extrabold">#{activeChannelDef?.label || activeThread}</div>
                  <p className="text-[11px] text-[var(--bw-muted)]">{activeChannelDef?.desc}</p>
                </div>
                <div className="space-y-1.5">
                  <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-[var(--bw-muted)]">
                    Betterway Desk Members ({BETTERWAY_EXTENSIONS.length})
                  </div>
                  {BETTERWAY_EXTENSIONS.map((ext) => (
                    <div key={ext.ext} className="flex items-center justify-between gap-2 py-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <StaffAvatar name={ext.name} avatarUrl={ext.avatarUrl} initials={ext.initials} size="sm" />
                        <div className="min-w-0">
                          <div className="font-bold truncate">{ext.name}</div>
                          <div className="text-[10px] text-[var(--bw-muted)]">Ext {ext.ext}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          dialViaSip({
                            number: `Ext ${ext.ext}`,
                            name: ext.name,
                            category: 'Internal Ext',
                            direction: 'INTERNAL',
                          })
                        }
                        className="size-7 rounded-full bg-[#090d13] text-[#34f0bc] flex items-center justify-center cursor-pointer shrink-0"
                        title={`Call ${ext.name}`}
                      >
                        <Phone size={11} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-[var(--bw-line)]">
                  <Link
                    href="/os/mortgage-desk?tab=rms"
                    className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#119c78] hover:underline"
                  >
                    <Building2 size={12} /> 159 Direct UAE Bank RMs →
                  </Link>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

export default function BetterwayInsidePage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-[var(--bw-muted)]">Loading Betterway Inside...</div>}>
      <BetterwayInsideInner />
    </Suspense>
  );
}
