'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  CircleDot,
  Clock,
  Delete,
  Download,
  Eye,
  EyeOff,
  History,
  MessagesSquare,
  Mic,
  MicOff,
  Pause,
  Phone,
  PhoneCall,
  PhoneForwarded,
  PhoneIncoming,
  PhoneMissed,
  PhoneOff,
  PhoneOutgoing,
  Play,
  Radio,
  Search,
  Settings2,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { GlossyBlackCard, PageHeader, StaffAvatar, StatusPill } from '@/components/os/UiKit';
import { UAE_BANK_RMS } from '@/lib/domain/bank-intelligence';
import {
  answerIncomingSipCall,
  BETTERWAY_EXTENSIONS,
  dialViaSip,
  formatCallDuration,
  formatPhoneForDisplay,
  getExtensionForEmail,
  hangupSipCall,
  playDtmfTone,
  saveSipTrunkConfig,
  sendSipDtmf,
  SIP_TRUNK_PRESETS,
  toggleSipHold,
  toggleSipMute,
  toggleSipRecording,
  transferSipCall,
  updateActiveSipMeta,
  useSipPhone,
  type SipCallCategory,
  type SipCallOutcome,
} from '@/lib/sip-store';

const DIALPAD_KEYS: Array<{ digit: string; letters: string }> = [
  { digit: '1', letters: '' },
  { digit: '2', letters: 'ABC' },
  { digit: '3', letters: 'DEF' },
  { digit: '4', letters: 'GHI' },
  { digit: '5', letters: 'JKL' },
  { digit: '6', letters: 'MNO' },
  { digit: '7', letters: 'PQRS' },
  { digit: '8', letters: 'TUV' },
  { digit: '9', letters: 'WXYZ' },
  { digit: '*', letters: '' },
  { digit: '0', letters: '+' },
  { digit: '#', letters: '' },
];

const OUTCOMES: SipCallOutcome[] = [
  'Connected',
  'FOL Confirmed',
  'Valuation Booked',
  'Docs Requested',
  'Callback Scheduled',
  'Voicemail',
  'No Answer',
];

type PhoneTab = 'dialer' | 'directory' | 'history' | 'trunk';

export default function BetterwaySipCallsPage() {
  const { user, toast } = useOs();
  const { config, activeCall, history } = useSipPhone();
  const [tab, setTab] = useState<PhoneTab>('dialer');

  // Dialer state
  const [dialNumber, setDialNumber] = useState('+971 ');
  const [dialName, setDialName] = useState('');
  const [dialCategory, setDialCategory] = useState<SipCallCategory>('Bank RM');
  const [transferTarget, setTransferTarget] = useState('Ext 104 (Elton Frank)');
  const [elapsedSec, setElapsedSec] = useState(0);

  // Directory filters
  const [rmSearch, setRmSearch] = useState('');
  const [rmBank, setRmBank] = useState('ALL');

  // CDR filters
  const [cdrFilter, setCdrFilter] = useState<'ALL' | 'OUTBOUND' | 'INBOUND' | 'INTERNAL' | 'MISSED' | 'BANK_RM'>('ALL');
  const [cdrQuery, setCdrQuery] = useState('');
  const [maskPdpl, setMaskPdpl] = useState(config.pdplMaskDefault);

  // Admin SIP trunk draft
  const [trunkDraft, setTrunkDraft] = useState(config);
  useEffect(() => setTrunkDraft(config), [config]);

  const myExt = getExtensionForEmail(user?.email);
  const isOwnerOrAdmin = user?.role === 'OWNER' || user?.role === 'OFFICE_ADMIN';

  useEffect(() => {
    if (!activeCall?.connectedAtMs) {
      setElapsedSec(0);
      return;
    }
    const tick = () => setElapsedSec(Math.max(0, Math.floor((Date.now() - activeCall.connectedAtMs!) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeCall?.connectedAtMs]);

  const rmBanks = useMemo(() => ['ALL', ...Array.from(new Set(UAE_BANK_RMS.map((r) => r.bank)))], []);
  const filteredRms = useMemo(() => {
    const q = rmSearch.trim().toLowerCase();
    return UAE_BANK_RMS.filter((r) => {
      if (rmBank !== 'ALL' && r.bank !== rmBank) return false;
      if (q && !`${r.bank} ${r.desk} ${r.rmName} ${r.phone} ${r.email}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rmBank, rmSearch]);

  const filteredHistory = useMemo(() => {
    const q = cdrQuery.trim().toLowerCase();
    return history.filter((row) => {
      if (cdrFilter === 'MISSED' && row.status !== 'MISSED') return false;
      if (cdrFilter === 'BANK_RM' && row.category !== 'Bank RM') return false;
      if ((cdrFilter === 'OUTBOUND' || cdrFilter === 'INBOUND' || cdrFilter === 'INTERNAL') && row.direction !== cdrFilter) {
        return false;
      }
      if (q && !`${row.remoteName} ${row.remoteNumber} ${row.caseRef || ''} ${row.notes || ''}`.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [history, cdrFilter, cdrQuery]);

  const stats = useMemo(() => {
    const totalCalls = history.length;
    const bankRmCalls = history.filter((h) => h.category === 'Bank RM').length;
    const totalTalkSec = history.reduce((sum, h) => sum + h.durationSec, 0);
    const recordedCount = history.filter((h) => h.recorded).length;
    return { totalCalls, bankRmCalls, totalTalkSec, recordedCount };
  }, [history]);

  const handleDialKey = (digit: string) => {
    if (activeCall) {
      sendSipDtmf(digit);
      return;
    }
    playDtmfTone(digit);
    setDialNumber((prev) => `${prev}${digit}`);
  };

  const placeCall = () => {
    const clean = dialNumber.trim();
    if (!clean || clean === '+971') {
      toast('Enter a UAE phone number or extension first', 'err');
      return;
    }
    dialViaSip({
      number: clean,
      name: dialName.trim() || undefined,
      category: dialCategory,
    });
    toast(`Dialing ${dialName.trim() || clean} via Betterway SIP Ext ${myExt.ext}`);
  };

  const simulateInbound = () => {
    dialViaSip({
      number: '+971 50 884 2219',
      name: 'Emirates NBD Priority Desk (Inbound)',
      category: 'Bank RM',
      caseRef: 'BW-2026-048',
      direction: 'INBOUND',
    });
    toast('Incoming SIP call ringing on Ext ' + myExt.ext, 'info');
  };

  const exportCdrCsv = () => {
    const header = 'ID,Direction,Category,Contact,Number,Extension,Status,Outcome,DurationSec,CaseRef,Recorded,StartedAt,Notes';
    const rows = filteredHistory.map((r) =>
      [
        r.id,
        r.direction,
        r.category,
        `"${r.remoteName.replace(/"/g, '""')}"`,
        `"${formatPhoneForDisplay(r.remoteNumber, maskPdpl)}"`,
        r.extensionUsed,
        r.status,
        r.outcome,
        r.durationSec,
        r.caseRef || '',
        r.recorded ? 'Yes' : 'No',
        r.startedAt,
        `"${(r.notes || '').replace(/"/g, '""')}"`,
      ].join(','),
    );
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Betterway_SIP_Call_Log_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Exported SIP Call History (.csv)');
  };

  const saveTrunkSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveSipTrunkConfig({ ...trunkDraft, registered: true });
    toast(`SIP Trunk saved & registered on ${trunkDraft.sipDomain}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Betterway Cloud PBX · UAE WebRTC SIP Softphone · Direct 159 Bank RMs & Team Extensions"
        title="Betterway SIP"
        accent="Call Desk"
        subtitle="Place and receive mortgage desk calls directly from your browser with DTMF keypad tones, blind transfer, call recording audit, internal extensions (100–108), and 1-click dialing to all 159 UAE Bank RMs."
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={simulateInbound}
              className="bw-btn bw-btn-outline text-xs py-2 min-h-[36px]"
            >
              <PhoneIncoming size={13} className="text-[#0e5a49]" /> Test Inbound Ring
            </button>
            <Link href="/os/inside" className="bw-btn bw-btn-obsidian text-xs py-2 min-h-[36px]">
              <MessagesSquare size={13} className="text-[#64c4a8]" /> Open Betterway Inside
            </Link>
          </div>
        }
      />

      {/* Glossy Shining Black SIP Line Status Hero */}
      <GlossyBlackCard className="p-5 sm:p-6 space-y-4" accent="dual">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="size-12 rounded-2xl bg-[#0e5a49]/20 border border-[#64c4a8]/40 flex items-center justify-center text-[#64c4a8] shrink-0">
              <Radio size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#47a88d]/15 border border-[#47a88d]/40 text-[#64c4a8] text-[10px] font-extrabold uppercase tracking-wider">
                  <span className="size-1.5 rounded-full bg-[#64c4a8] animate-pulse" />
                  {config.registered ? 'SIP Registered · Live' : 'SIP Offline'}
                </span>
                <span className="text-[11px] font-mono-num text-[#dfc285] font-bold">
                  Ext {myExt.ext} · {myExt.name}
                </span>
              </div>
              <div className="text-xs text-slate-300 mt-1 truncate">
                {config.provider} · <span className="font-mono text-slate-200">{config.wssUrl}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="px-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/10">
              <div className="text-[9.5px] uppercase text-slate-400 font-bold">Logged Calls</div>
              <div className="font-mono-num text-base font-extrabold text-white">{stats.totalCalls}</div>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/10">
              <div className="text-[9.5px] uppercase text-slate-400 font-bold">Bank RM Calls</div>
              <div className="font-mono-num text-base font-extrabold text-[#64c4a8]">{stats.bankRmCalls}</div>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/10">
              <div className="text-[9.5px] uppercase text-slate-400 font-bold">Talk Duration</div>
              <div className="font-mono-num text-base font-extrabold text-[#dfc285]">{formatCallDuration(stats.totalTalkSec)}</div>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/10">
              <div className="text-[9.5px] uppercase text-slate-400 font-bold">Recorded Audit</div>
              <div className="font-mono-num text-base font-extrabold text-white">{stats.recordedCount}</div>
            </div>
          </div>
        </div>

        {/* 4 Navigation Pills Inside Hero */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-white/12">
          {[
            { id: 'dialer', label: 'Softphone & Live Dialer', icon: Phone },
            { id: 'directory', label: `Extensions (9) & 159 Bank RMs`, icon: Users },
            { id: 'history', label: `Call History & CDR (${history.length})`, icon: History },
            { id: 'trunk', label: 'SIP Trunk & PBX Settings', icon: Settings2 },
          ].map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id as PhoneTab)}
                className={`px-4 py-2 rounded-full text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer transition ${
                  active
                    ? 'bg-[#c49a45] text-[#0b192c] shadow-md'
                    : 'bg-white/[0.08] text-slate-200 hover:bg-white/[0.16] border border-white/12'
                }`}
              >
                <Icon size={13} /> {t.label}
              </button>
            );
          })}
        </div>
      </GlossyBlackCard>

      {/* TAB 1: SOFTPHONE & LIVE DIALER */}
      {tab === 'dialer' && (
        <div className="grid lg:grid-cols-12 gap-5">
          {/* Left: Tactile Softphone Keypad */}
          <div className="lg:col-span-5 bw-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-sm font-extrabold">UAE WebRTC SIP Dialpad</h2>
                <p className="text-[11px] text-[var(--bw-muted)]">DTMF audio tones enabled · Dock stays live across all pages</p>
              </div>
              <StatusPill label={`Ext ${myExt.ext}`} tone="emerald" />
            </div>

            <div className="space-y-2.5">
              <div className="relative">
                <input
                  value={dialNumber}
                  onChange={(e) => setDialNumber(e.target.value)}
                  placeholder="+971 50 ... or Ext 104"
                  className="w-full h-12 px-4 pe-10 rounded-2xl bg-[var(--bw-soft)] border border-[var(--bw-line-strong)] font-mono-num text-lg font-extrabold text-[var(--bw-ink)] outline-none focus:border-[#0e5a49]"
                />
                {dialNumber && (
                  <button
                    type="button"
                    onClick={() => setDialNumber((p) => p.slice(0, -1))}
                    aria-label="Backspace digit"
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 size-8 rounded-full hover:bg-black/10 flex items-center justify-center text-[var(--bw-muted)] cursor-pointer"
                  >
                    <Delete size={16} />
                  </button>
                )}
              </div>

              {/* Quick UAE Prefixes */}
              <div className="flex flex-wrap gap-1.5 text-[10.5px] font-bold">
                {['+971 50 ', '+971 52 ', '+971 55 ', '+971 4 ', 'Ext 10'].map((pre) => (
                  <button
                    key={pre}
                    type="button"
                    onClick={() => setDialNumber(pre)}
                    className="px-2.5 py-1 rounded-full bg-[var(--bw-soft)] hover:bg-[#0b192c] hover:text-[#64c4a8] border border-[var(--bw-line)] cursor-pointer transition"
                  >
                    {pre.trim()}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <input
                  value={dialName}
                  onChange={(e) => setDialName(e.target.value)}
                  placeholder="Contact / Bank RM Name (optional)"
                  className="h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-soft)]"
                />
                <select
                  value={dialCategory}
                  onChange={(e) => setDialCategory(e.target.value as SipCallCategory)}
                  className="h-9 px-2.5 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-soft)] font-semibold"
                >
                  <option value="Bank RM">Bank RM</option>
                  <option value="Borrower">Borrower</option>
                  <option value="DLD Trustee">DLD Trustee</option>
                  <option value="Valuation Panel">Valuation Panel</option>
                  <option value="Internal Ext">Internal Ext</option>
                </select>
              </div>
            </div>

            {/* 12-Key Keypad */}
            <div className="grid grid-cols-3 gap-2">
              {DIALPAD_KEYS.map((k) => (
                <button
                  key={k.digit}
                  type="button"
                  onClick={() => handleDialKey(k.digit)}
                  className="h-14 rounded-2xl bg-[var(--bw-soft)] hover:bg-[#0b192c] hover:text-white border border-[var(--bw-line)] hover:border-[#47a88d]/60 flex flex-col items-center justify-center cursor-pointer transition group shadow-xs"
                >
                  <span className="font-mono-num text-lg font-extrabold leading-none">{k.digit}</span>
                  {k.letters && (
                    <span className="text-[9px] font-bold tracking-widest text-[var(--bw-muted)] group-hover:text-[#64c4a8] mt-0.5">
                      {k.letters}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={placeCall}
              className="bw-btn bw-btn-primary w-full min-h-[46px] text-sm font-extrabold"
            >
              <PhoneCall size={16} /> Place SIP Call
            </button>
          </div>

          {/* Right: Live Active Call Console + Quick Team Extensions */}
          <div className="lg:col-span-7 space-y-5">
            {activeCall ? (
              <GlossyBlackCard className="p-6 space-y-5" accent="emerald">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#47a88d]/15 border border-[#47a88d]/40 text-[#64c4a8] text-[10.5px] font-extrabold uppercase tracking-wider">
                      <span className="size-2 rounded-full bg-[#64c4a8] animate-pulse" />
                      {activeCall.state === 'RINGING'
                        ? 'Incoming SIP Ringing'
                        : activeCall.state === 'DIALING'
                          ? 'Connecting SIP Audio...'
                          : activeCall.state === 'ON_HOLD'
                            ? 'Call On Hold'
                            : `Live Audio · ${formatCallDuration(elapsedSec)}`}
                    </div>
                    <h3 className="font-display text-2xl font-extrabold text-white mt-2">{activeCall.remoteName}</h3>
                    <div className="font-mono-num text-sm text-[#dfc285]">
                      {activeCall.remoteNumber} · {activeCall.category}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={toggleSipRecording}
                    className={`px-3 py-1.5 rounded-full text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer border ${
                      activeCall.recording
                        ? 'bg-rose-500/20 border-rose-400/50 text-rose-300'
                        : 'bg-white/10 border-white/15 text-slate-300'
                    }`}
                  >
                    <CircleDot size={12} className={activeCall.recording ? 'animate-pulse' : ''} />
                    {activeCall.recording ? 'Recording Active' : 'Recording Off'}
                  </button>
                </div>

                {activeCall.state === 'RINGING' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={answerIncomingSipCall}
                      className="py-3 rounded-full bg-[#0e5a49] hover:bg-[#14705b] text-white text-sm font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Phone size={16} /> Answer Call
                    </button>
                    <button
                      type="button"
                      onClick={() => hangupSipCall('No Answer')}
                      className="py-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-sm font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <PhoneOff size={16} /> Decline
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-2.5 text-xs font-bold">
                      <button
                        type="button"
                        onClick={toggleSipMute}
                        className={`py-3 rounded-2xl inline-flex items-center justify-center gap-2 cursor-pointer transition ${
                          activeCall.muted ? 'bg-amber-400 text-black' : 'bg-white/10 hover:bg-white/18 text-white'
                        }`}
                      >
                        {activeCall.muted ? <MicOff size={15} /> : <Mic size={15} />}
                        {activeCall.muted ? 'Unmute Mic' : 'Mute Mic'}
                      </button>
                      <button
                        type="button"
                        onClick={toggleSipHold}
                        className={`py-3 rounded-2xl inline-flex items-center justify-center gap-2 cursor-pointer transition ${
                          activeCall.onHold ? 'bg-[#dfc285] text-black' : 'bg-white/10 hover:bg-white/18 text-white'
                        }`}
                      >
                        {activeCall.onHold ? <Play size={15} /> : <Pause size={15} />}
                        {activeCall.onHold ? 'Resume Call' : 'Hold Line'}
                      </button>
                      <button
                        type="button"
                        onClick={() => hangupSipCall()}
                        className="py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white inline-flex items-center justify-center gap-2 cursor-pointer transition"
                      >
                        <PhoneOff size={15} /> Hang Up
                      </button>
                    </div>

                    {/* Transfer & Call Disposition Logger */}
                    <div className="grid sm:grid-cols-2 gap-3 pt-3 border-t border-white/12 text-xs">
                      <div className="space-y-1.5">
                        <label className="text-[10.5px] font-bold uppercase text-slate-400">Blind Transfer to Staff</label>
                        <div className="flex gap-1.5">
                          <select
                            value={transferTarget}
                            onChange={(e) => setTransferTarget(e.target.value)}
                            className="flex-1 h-9 px-2.5 rounded-xl bg-white/10 border border-white/15 text-xs text-white"
                          >
                            {BETTERWAY_EXTENSIONS.map((ext) => (
                              <option key={ext.ext} value={`Ext ${ext.ext} (${ext.name})`} className="text-black">
                                Ext {ext.ext} · {ext.name}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              transferSipCall(transferTarget);
                              toast(`Call transferred to ${transferTarget}`);
                            }}
                            className="px-3.5 h-9 rounded-xl bg-[#dfc285] text-[#0b192c] font-extrabold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <PhoneForwarded size={13} /> Send
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10.5px] font-bold uppercase text-slate-400">Call Outcome &amp; Case Ref</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          <select
                            value={activeCall.outcome}
                            onChange={(e) => updateActiveSipMeta({ outcome: e.target.value as SipCallOutcome })}
                            className="h-9 px-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white"
                          >
                            {OUTCOMES.map((o) => (
                              <option key={o} value={o} className="text-black">
                                {o}
                              </option>
                            ))}
                          </select>
                          <input
                            value={activeCall.caseRef}
                            onChange={(e) => updateActiveSipMeta({ caseRef: e.target.value })}
                            placeholder="Case Ref"
                            className="h-9 px-2.5 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder:text-slate-400"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <textarea
                          rows={2}
                          value={activeCall.notes}
                          onChange={(e) => updateActiveSipMeta({ notes: e.target.value })}
                          placeholder="Log mortgage desk notes (bank RM quote, FOL condition, valuation access timing)..."
                          className="w-full p-2.5 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder:text-slate-400 outline-none focus:border-[#47a88d]"
                        />
                      </div>
                    </div>
                  </>
                )}
              </GlossyBlackCard>
            ) : (
              <div className="bw-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-sm font-extrabold">Betterway Oud Metha Quick Extensions</h3>
                    <p className="text-[11px] text-[var(--bw-muted)]">1-click internal office SIP intercom across all 9 Betterway seats</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTab('directory')}
                    className="text-xs font-extrabold text-[#0e5a49] hover:underline cursor-pointer"
                  >
                    + 159 Bank RMs →
                  </button>
                </div>
                <div className="grid sm:grid-cols-3 gap-2.5">
                  {BETTERWAY_EXTENSIONS.map((ext) => (
                    <div
                      key={ext.ext}
                      className="p-3 rounded-2xl border border-[var(--bw-line)] bg-[var(--bw-soft)]/70 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <StaffAvatar name={ext.name} avatarUrl={ext.avatarUrl} initials={ext.initials} size="sm" />
                        <div className="min-w-0">
                          <div className="text-xs font-extrabold truncate">{ext.name}</div>
                          <div className="text-[10px] font-mono-num text-[#0e5a49] font-bold">Ext {ext.ext}</div>
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
                        className="size-8 rounded-full bg-[#0b192c] hover:bg-[#0e5a49] text-[#64c4a8] hover:text-white flex items-center justify-center shrink-0 cursor-pointer transition"
                        title={`Call ${ext.name} (Ext ${ext.ext})`}
                      >
                        <Phone size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Calls Preview */}
            <div className="bw-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-extrabold flex items-center gap-1.5">
                  <Clock size={14} className="text-[#0e5a49]" /> Latest SIP Calls
                </h3>
                <button
                  type="button"
                  onClick={() => setTab('history')}
                  className="text-xs font-extrabold text-[#0e5a49] hover:underline cursor-pointer"
                >
                  Full Call Log →
                </button>
              </div>
              <div className="space-y-2">
                {history.slice(0, 4).map((row) => (
                  <div
                    key={row.id}
                    className="p-3 rounded-2xl border border-[var(--bw-line)] bg-[var(--bw-soft)]/50 flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`size-8 rounded-xl flex items-center justify-center shrink-0 ${
                          row.status === 'MISSED'
                            ? 'bg-rose-100 text-rose-700'
                            : row.direction === 'INBOUND'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-[#0b192c] text-[#64c4a8]'
                        }`}
                      >
                        {row.status === 'MISSED' ? (
                          <PhoneMissed size={14} />
                        ) : row.direction === 'INBOUND' ? (
                          <PhoneIncoming size={14} />
                        ) : (
                          <PhoneOutgoing size={14} />
                        )}
                      </span>
                      <div className="min-w-0">
                        <div className="font-extrabold truncate">{row.remoteName}</div>
                        <div className="text-[10.5px] text-[var(--bw-muted)] font-mono-num">
                          {formatPhoneForDisplay(row.remoteNumber, maskPdpl)} · {formatCallDuration(row.durationSec)}
                          {row.caseRef ? ` · ${row.caseRef}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusPill label={row.outcome} tone={row.status === 'MISSED' ? 'red' : 'emerald'} />
                      <button
                        type="button"
                        onClick={() =>
                          dialViaSip({
                            number: row.remoteNumber,
                            name: row.remoteName,
                            category: row.category,
                            caseRef: row.caseRef,
                          })
                        }
                        className="px-3 py-1 rounded-full bg-[#0b192c] text-[#64c4a8] font-bold text-[11px] hover:brightness-110 cursor-pointer"
                      >
                        Redial
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXTENSIONS & 159 DIRECT UAE BANK RMs SPEED-DIAL */}
      {tab === 'directory' && (
        <div className="space-y-6">
          <div className="bw-card p-5 space-y-3">
            <h2 className="font-display text-sm font-extrabold flex items-center gap-2">
              <Users size={15} className="text-[#0e5a49]" /> Betterway Oud Metha Internal Extensions (100–108)
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {BETTERWAY_EXTENSIONS.map((ext) => (
                <div
                  key={ext.ext}
                  className="p-3.5 rounded-2xl border border-[var(--bw-line)] bg-[var(--bw-soft)]/60 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <StaffAvatar name={ext.name} avatarUrl={ext.avatarUrl} initials={ext.initials} size="sm" />
                    <div className="min-w-0">
                      <div className="font-extrabold truncate">{ext.name}</div>
                      <div className="text-[10.5px] text-[var(--bw-muted)] truncate">{ext.designation}</div>
                      <div className="text-[10.5px] font-mono-num font-bold text-[#0e5a49]">Ext {ext.ext}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        dialViaSip({
                          number: `Ext ${ext.ext}`,
                          name: ext.name,
                          category: 'Internal Ext',
                          direction: 'INTERNAL',
                        });
                        setTab('dialer');
                      }}
                      className="px-3 py-1.5 rounded-full bg-[#0b192c] text-[#64c4a8] font-extrabold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Phone size={11} /> Call
                    </button>
                    <Link
                      href={`/os/inside?dm=${encodeURIComponent(ext.userId)}`}
                      className="size-8 rounded-full border border-[var(--bw-line)] bg-white hover:border-[#0e5a49] flex items-center justify-center text-[var(--bw-ink)]"
                      title={`Message ${ext.name} in Betterway Inside`}
                    >
                      <MessagesSquare size={12} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 159 Direct UAE Bank RMs Speed Dial */}
          <div className="bw-card p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-sm font-extrabold flex items-center gap-2">
                  <Building2 size={15} className="text-[#0e5a49]" /> 159 Direct UAE Bank RMs — 1-Click SIP Speed-Dial ({filteredRms.length})
                </h2>
                <p className="text-[11px] text-[var(--bw-muted)]">
                  Click any Bank RM to dial directly through your Betterway SIP extension with automatic CDR logging.
                </p>
              </div>
              <label className="flex items-center gap-2 px-3.5 h-9 rounded-full border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] w-72">
                <Search size={13} className="text-[var(--bw-muted)]" />
                <input
                  value={rmSearch}
                  onChange={(e) => setRmSearch(e.target.value)}
                  placeholder="Search bank, RM name, desk..."
                  className="flex-1 bg-transparent outline-none text-xs"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-1.5 text-[11px]">
              {rmBanks.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setRmBank(b)}
                  className={`px-3 py-1 rounded-full font-bold cursor-pointer transition ${
                    rmBank === b
                      ? 'bg-[#0b192c] text-[#64c4a8] border border-[#47a88d]/50'
                      : 'bg-[var(--bw-soft)] border border-[var(--bw-line)]'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[540px] overflow-y-auto pe-1">
              {filteredRms.map((rm, idx) => (
                <div
                  key={`${rm.bank}-${rm.rmName}-${idx}`}
                  className="p-3.5 rounded-2xl border border-[var(--bw-line)] bg-[var(--bw-soft)]/50 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#0e5a49]">
                        {rm.bank} · {rm.desk}
                      </div>
                      <div className="font-display font-extrabold text-sm truncate">{rm.rmName}</div>
                    </div>
                    <StatusPill label={rm.directSubmissionAllowed ? 'Direct OK' : 'Desk'} tone={rm.directSubmissionAllowed ? 'emerald' : 'gold'} />
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="font-mono-num text-[11px] text-[var(--bw-muted)] truncate">
                      {rm.phone ? formatPhoneForDisplay(rm.phone, maskPdpl) : 'Email desk only'}
                    </span>
                    {rm.phone && (
                      <button
                        type="button"
                        onClick={() => {
                          dialViaSip({
                            number: rm.phone,
                            name: `${rm.rmName} (${rm.bank})`,
                            category: 'Bank RM',
                          });
                          toast(`Calling ${rm.rmName} (${rm.bank}) via SIP`);
                        }}
                        className="px-3 py-1.5 rounded-full bg-[#0b192c] hover:bg-[#0e5a49] text-[#64c4a8] hover:text-white font-extrabold inline-flex items-center gap-1 cursor-pointer transition shrink-0"
                      >
                        <PhoneCall size={11} /> SIP Call
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CALL HISTORY & CDR */}
      {tab === 'history' && (
        <div className="bw-card p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5 text-xs">
              {[
                ['ALL', 'All Calls'],
                ['OUTBOUND', 'Outbound'],
                ['INBOUND', 'Inbound'],
                ['INTERNAL', 'Internal Ext'],
                ['BANK_RM', 'Bank RMs'],
                ['MISSED', 'Missed'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCdrFilter(id as any)}
                  className={`px-3 py-1.5 rounded-full font-bold cursor-pointer transition ${
                    cdrFilter === id
                      ? 'bg-[#0b192c] text-[#64c4a8]'
                      : 'bg-[var(--bw-soft)] border border-[var(--bw-line)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setMaskPdpl((v) => !v)}
                className="px-3 py-1.5 rounded-full border border-[var(--bw-line)] bg-[var(--bw-soft)] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                {maskPdpl ? <EyeOff size={13} className="text-[#0e5a49]" /> : <Eye size={13} />}
                {maskPdpl ? 'PDPL Masked' : 'Full Numbers'}
              </button>
              <input
                value={cdrQuery}
                onChange={(e) => setCdrQuery(e.target.value)}
                placeholder="Filter contact, case ref, notes..."
                className="h-9 px-3.5 rounded-full border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] text-xs w-56"
              />
              <button type="button" onClick={exportCdrCsv} className="bw-btn bw-btn-gold text-xs py-1.5 min-h-[34px]">
                <Download size={12} /> Export CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[820px]">
              <thead>
                <tr className="bg-[#0b192c] text-white text-[10.5px] uppercase tracking-wider">
                  <th className="py-3 px-3.5 text-start">Contact &amp; Direction</th>
                  <th className="py-3 px-3 text-start">Number</th>
                  <th className="py-3 px-3 text-start">Category / Case</th>
                  <th className="py-3 px-3 text-start">Outcome &amp; Duration</th>
                  <th className="py-3 px-3 text-start">Notes</th>
                  <th className="py-3 px-3 text-end">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--bw-line)]">
                {filteredHistory.map((row) => (
                  <tr key={row.id} className="hover:bg-[var(--bw-hover)]/50">
                    <td className="py-3 px-3.5">
                      <div className="font-extrabold">{row.remoteName}</div>
                      <div className="text-[10.5px] text-[var(--bw-muted)]">
                        {row.direction} · Ext {row.extensionUsed} ·{' '}
                        {new Date(row.startedAt).toLocaleTimeString('en-GB', {
                          timeZone: 'Asia/Dubai',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono-num font-bold">
                      {formatPhoneForDisplay(row.remoteNumber, maskPdpl)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold">{row.category}</div>
                      {row.caseRef && <div className="text-[10.5px] font-mono-num text-[#0e5a49] font-bold">{row.caseRef}</div>}
                    </td>
                    <td className="py-3 px-3 space-y-1">
                      <StatusPill
                        label={row.outcome}
                        tone={row.status === 'MISSED' ? 'red' : row.status === 'TRANSFERRED' ? 'gold' : 'emerald'}
                      />
                      <div className="text-[10.5px] font-mono-num text-[var(--bw-muted)]">
                        {formatCallDuration(row.durationSec)} {row.recorded ? '· REC' : ''}
                      </div>
                    </td>
                    <td className="py-3 px-3 max-w-[240px] text-[11px] text-[var(--bw-muted)]">
                      {row.notes || '—'}
                    </td>
                    <td className="py-3 px-3 text-end">
                      <button
                        type="button"
                        onClick={() => {
                          dialViaSip({
                            number: row.remoteNumber,
                            name: row.remoteName,
                            category: row.category,
                            caseRef: row.caseRef,
                          });
                          setTab('dialer');
                        }}
                        className="px-3 py-1.5 rounded-full bg-[#0b192c] text-[#64c4a8] font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Phone size={11} /> Call
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SIP TRUNK & EXTENSIONS SETUP */}
      {tab === 'trunk' && (
        <div className="grid lg:grid-cols-12 gap-5">
          <form onSubmit={saveTrunkSettings} className="lg:col-span-7 bw-card p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-sm font-extrabold">UAE SIP Trunk &amp; WebRTC Gateway Provisioning</h2>
                <p className="text-[11px] text-[var(--bw-muted)]">
                  Connect Etisalat e&, du Business, 3CX Cloud Dubai, or Yeastar P-Series over encrypted WSS.
                </p>
              </div>
              <StatusPill label={isOwnerOrAdmin ? 'Admin Write' : 'Personal Ext'} tone={isOwnerOrAdmin ? 'gold' : 'emerald'} />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {SIP_TRUNK_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() =>
                    setTrunkDraft((d) => ({
                      ...d,
                      provider: p.provider,
                      wssUrl: p.wssUrl,
                      sipDomain: p.sipDomain,
                      stunServer: p.stunServer,
                    }))
                  }
                  className="px-3 py-1.5 rounded-full bg-[var(--bw-soft)] hover:bg-[#0b192c] hover:text-[#64c4a8] border border-[var(--bw-line)] font-bold cursor-pointer transition"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold block mb-1">Carrier / PBX Provider</label>
                <input
                  value={trunkDraft.provider}
                  onChange={(e) => setTrunkDraft({ ...trunkDraft, provider: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">SIP Domain / Registrar</label>
                <input
                  value={trunkDraft.sipDomain}
                  onChange={(e) => setTrunkDraft({ ...trunkDraft, sipDomain: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="font-bold block mb-1">WebSocket Secure (WSS) Server URL</label>
                <input
                  value={trunkDraft.wssUrl}
                  onChange={(e) => setTrunkDraft({ ...trunkDraft, wssUrl: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Assigned Extension</label>
                <input
                  value={trunkDraft.extension}
                  onChange={(e) => setTrunkDraft({ ...trunkDraft, extension: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">SIP Auth Username</label>
                <input
                  value={trunkDraft.authUsername}
                  onChange={(e) => setTrunkDraft({ ...trunkDraft, authUsername: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">ICE STUN Server</label>
                <input
                  value={trunkDraft.stunServer}
                  onChange={(e) => setTrunkDraft({ ...trunkDraft, stunServer: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">ICE TURN Relay</label>
                <input
                  value={trunkDraft.turnServer}
                  onChange={(e) => setTrunkDraft({ ...trunkDraft, turnServer: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-1">
              <label className="flex items-center gap-2 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={trunkDraft.autoRecord}
                  onChange={(e) => setTrunkDraft({ ...trunkDraft, autoRecord: e.target.checked })}
                />
                Auto-record outbound bank &amp; borrower calls (CBUAE audit)
              </label>
              <label className="flex items-center gap-2 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={trunkDraft.pdplMaskDefault}
                  onChange={(e) => setTrunkDraft({ ...trunkDraft, pdplMaskDefault: e.target.checked })}
                />
                Mask phone numbers in CDR by default (UAE PDPL)
              </label>
            </div>

            <button type="submit" className="bw-btn bw-btn-obsidian text-xs">
              Save &amp; Register SIP Trunk
            </button>
          </form>

          <GlossyBlackCard className="lg:col-span-5 p-5 space-y-4 text-xs" accent="gold">
            <div className="inline-flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[#dfc285]">
              <ShieldCheck size={13} className="text-[#64c4a8]" /> UAE TDRA &amp; CBUAE Call Governance
            </div>
            <h3 className="font-display text-base font-extrabold text-white">
              Oud Metha Office Telephony Standards
            </h3>
            <ul className="space-y-2.5 text-slate-300 leading-relaxed">
              <li>• <strong className="text-white">Dedicated UAE Caller ID:</strong> All outbound calls present Betterway Mortgages LLC registered Dubai landline / DID.</li>
              <li>• <strong className="text-white">Persistent Softphone Dock:</strong> Active SIP calls stay connected while advisors switch between 18-Bank Matrix, 3-Bank Proposal Maker, and 12-Step Pipeline.</li>
              <li>• <strong className="text-white">PDPL Call Masking:</strong> Advisors can toggle number masking on shared screens while retaining 1-click redial and full Case Ref notes.</li>
              <li>• <strong className="text-white">1-Click Bank RM Escalation:</strong> Every one of the 159 direct UAE bank RMs can be called directly from the directory or inside Mortgage Desk.</li>
            </ul>
          </GlossyBlackCard>
        </div>
      )}
    </div>
  );
}
