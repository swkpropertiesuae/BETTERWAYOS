'use client';

import { useEffect, useState } from 'react';
import { OFFICIAL_ROSTER } from '@/lib/domain/staff';

export interface BetterwayExtension {
  ext: string;
  userId: string;
  name: string;
  designation: string;
  department: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  initials: string;
  status: 'Available' | 'On Desk' | 'In Bank Meeting';
}

export const BETTERWAY_EXTENSIONS: BetterwayExtension[] = [
  {
    ext: '100',
    userId: 'USR-00',
    name: 'Oud Metha Reception Desk',
    designation: 'Al Nasr Plaza Main Line',
    department: 'Reception & Operations',
    email: 'admin@betterwaymortgages.com',
    phone: '+971 4 388 2100',
    avatarUrl: null,
    initials: 'OM',
    status: 'Available',
  },
  ...OFFICIAL_ROSTER.filter((m) => m.id !== 'USR-00').map((m, idx) => ({
    ext: String(101 + idx),
    userId: m.id,
    name: m.name,
    designation: m.designation,
    department: m.department,
    email: m.email,
    phone: m.phone,
    avatarUrl: m.avatarUrl,
    initials: m.initials,
    status: (idx % 3 === 2 ? 'On Desk' : 'Available') as BetterwayExtension['status'],
  })),
];

export type SipCallDirection = 'OUTBOUND' | 'INBOUND' | 'INTERNAL';
export type SipCallCategory = 'Bank RM' | 'Borrower' | 'Internal Ext' | 'DLD Trustee' | 'Valuation Panel';
export type SipCallOutcome =
  | 'Connected'
  | 'FOL Confirmed'
  | 'Valuation Booked'
  | 'Docs Requested'
  | 'Callback Scheduled'
  | 'Voicemail'
  | 'No Answer'
  | 'Transferred';

export interface SipCallRecord {
  id: string;
  direction: SipCallDirection;
  remoteNumber: string;
  remoteName: string;
  category: SipCallCategory;
  status: 'COMPLETED' | 'MISSED' | 'TRANSFERRED';
  outcome: SipCallOutcome;
  durationSec: number;
  startedAt: string;
  extensionUsed: string;
  caseRef?: string;
  notes?: string;
  recorded: boolean;
}

export interface ActiveSipCall {
  id: string;
  direction: SipCallDirection;
  remoteNumber: string;
  remoteName: string;
  category: SipCallCategory;
  state: 'DIALING' | 'RINGING' | 'CONNECTED' | 'ON_HOLD';
  startedAtMs: number;
  connectedAtMs: number | null;
  muted: boolean;
  onHold: boolean;
  recording: boolean;
  dtmfHistory: string;
  caseRef: string;
  notes: string;
  outcome: SipCallOutcome;
}

export interface SipTrunkConfig {
  provider: string;
  wssUrl: string;
  sipDomain: string;
  extension: string;
  displayName: string;
  authUsername: string;
  stunServer: string;
  turnServer: string;
  codec: string;
  autoRecord: boolean;
  pdplMaskDefault: boolean;
  registered: boolean;
}

export const SIP_TRUNK_PRESETS: Array<{
  id: string;
  label: string;
  provider: string;
  wssUrl: string;
  sipDomain: string;
  stunServer: string;
}> = [
  {
    id: 'etisalat',
    label: 'Etisalat by e& UAE SIP',
    provider: 'Etisalat by e& Business SIP Trunk',
    wssUrl: 'wss://sip.betterwaymortgages.com:8089/ws',
    sipDomain: 'pbx.betterwaymortgages.com',
    stunServer: 'stun:stun.l.google.com:19302',
  },
  {
    id: 'du',
    label: 'du Business SIP (Dubai)',
    provider: 'du Enterprise SIP Trunk UAE',
    wssUrl: 'wss://du-sbc.betterwaymortgages.com:8089/ws',
    sipDomain: 'sip.du.betterwaymortgages.com',
    stunServer: 'stun:stun1.l.google.com:19302',
  },
  {
    id: '3cx',
    label: '3CX Cloud Dubai',
    provider: '3CX Dedicated UAE Cloud PBX',
    wssUrl: 'wss://betterway.3cx.ae:5001/ws',
    sipDomain: 'betterway.3cx.ae',
    stunServer: 'stun:stun.3cx.com:3478',
  },
  {
    id: 'yeastar',
    label: 'Yeastar P-Series PBX',
    provider: 'Yeastar Cloud PBX (Oud Metha)',
    wssUrl: 'wss://pbx.betterwaymortgages.com:8089/ws',
    sipDomain: 'pbx.betterwaymortgages.com',
    stunServer: 'stun:stun.l.google.com:19302',
  },
];

const CONFIG_KEY = 'bw_sip_trunk_config_v1';
const CDR_KEY = 'bw_sip_call_history_v1';

export const DEFAULT_SIP_CONFIG: SipTrunkConfig = {
  provider: 'Etisalat by e& Business SIP Trunk',
  wssUrl: 'wss://sip.betterwaymortgages.com:8089/ws',
  sipDomain: 'pbx.betterwaymortgages.com',
  extension: '101',
  displayName: 'Betterway Mortgages Desk',
  authUsername: 'bw_ext_101',
  stunServer: 'stun:stun.l.google.com:19302',
  turnServer: 'turn:turn.betterwaymortgages.com:3478',
  codec: 'Opus 48kHz / G.711 PCMU',
  autoRecord: true,
  pdplMaskDefault: false,
  registered: true,
};

const SEEDED_CDR: SipCallRecord[] = [
  {
    id: 'CDR-2026-101',
    direction: 'OUTBOUND',
    remoteNumber: '+971 50 482 1190',
    remoteName: 'Emirates NBD — Mortgage RM Desk',
    category: 'Bank RM',
    status: 'COMPLETED',
    outcome: 'FOL Confirmed',
    durationSec: 264,
    startedAt: new Date(Date.now() - 42 * 60_000).toISOString(),
    extensionUsed: '101',
    caseRef: 'BW-2026-041',
    notes: 'Confirmed 3.89% 2Y fixed STL offer letter release for Dubai Hills villa buyout.',
    recorded: true,
  },
  {
    id: 'CDR-2026-102',
    direction: 'OUTBOUND',
    remoteNumber: '+971 52 910 3340',
    remoteName: 'CBRE UAE Valuation Panel',
    category: 'Valuation Panel',
    status: 'COMPLETED',
    outcome: 'Valuation Booked',
    durationSec: 185,
    startedAt: new Date(Date.now() - 115 * 60_000).toISOString(),
    extensionUsed: '104',
    caseRef: 'BW-2026-039',
    notes: 'Inspection confirmed for tomorrow 11:00 AM GST — access keys logged with coordinator.',
    recorded: true,
  },
  {
    id: 'CDR-2026-103',
    direction: 'INTERNAL',
    remoteNumber: 'Ext 104',
    remoteName: 'Elton Frank (Operations)',
    category: 'Internal Ext',
    status: 'COMPLETED',
    outcome: 'Connected',
    durationSec: 132,
    startedAt: new Date(Date.now() - 190 * 60_000).toISOString(),
    extensionUsed: '101',
    caseRef: 'BW-2026-036',
    notes: 'Verified Emaar developer NOC & Manager Cheque readiness for DLD Trustee booking.',
    recorded: false,
  },
  {
    id: 'CDR-2026-104',
    direction: 'INBOUND',
    remoteNumber: '+971 55 704 8812',
    remoteName: 'ADIB Islamic Credit Desk',
    category: 'Bank RM',
    status: 'COMPLETED',
    outcome: 'Docs Requested',
    durationSec: 210,
    startedAt: new Date(Date.now() - 275 * 60_000).toISOString(),
    extensionUsed: '103',
    caseRef: 'BW-2026-044',
    notes: 'Requested latest 6-month salary statement stamped copy for zero-PF approval.',
    recorded: true,
  },
  {
    id: 'CDR-2026-105',
    direction: 'INBOUND',
    remoteNumber: '+971 4 388 9410',
    remoteName: 'Al Barsha DLD Trustee Office',
    category: 'DLD Trustee',
    status: 'MISSED',
    outcome: 'Callback Scheduled',
    durationSec: 0,
    startedAt: new Date(Date.now() - 340 * 60_000).toISOString(),
    extensionUsed: '100',
    caseRef: 'BW-2026-031',
    notes: 'Trustee slot confirmation callback requested for Thursday 2:00 PM GST.',
    recorded: false,
  },
];

// Real Dual-Tone Multi-Frequency (DTMF) Web Audio API synthesizer
const DTMF_FREQS: Record<string, [number, number]> = {
  '1': [697, 1209],
  '2': [697, 1336],
  '3': [697, 1477],
  '4': [770, 1209],
  '5': [770, 1336],
  '6': [770, 1477],
  '7': [852, 1209],
  '8': [852, 1336],
  '9': [852, 1477],
  '*': [941, 1209],
  '0': [941, 1336],
  '#': [941, 1477],
};

export function playDtmfTone(digit: string, durationMs = 110): void {
  if (typeof window === 'undefined') return;
  const pair = DTMF_FREQS[digit];
  if (!pair) return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);
    gain.connect(ctx.destination);

    for (const freq of pair) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.connect(gain);
      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    }
    setTimeout(() => {
      void ctx.close().catch(() => {});
    }, durationMs + 60);
  } catch {
    /* ignore blocked audio context */
  }
}

export function formatPhoneForDisplay(raw: string, maskPdpl: boolean): string {
  if (!maskPdpl) return raw;
  const trimmed = raw.trim();
  if (/^ext\s*\d+$/i.test(trimmed) || trimmed.length <= 5) return trimmed;
  const digits = trimmed.replace(/[^\d+]/g, '');
  if (digits.length < 7) return trimmed;
  return `${digits.slice(0, 6)} ••• ${digits.slice(-3)}`;
}

export function formatCallDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface SipStoreSnapshot {
  config: SipTrunkConfig;
  activeCall: ActiveSipCall | null;
  history: SipCallRecord[];
  dockExpanded: boolean;
}

type Listener = () => void;

const listeners = new Set<Listener>();
let connectTimer: ReturnType<typeof setTimeout> | null = null;
let initialized = false;

let state: SipStoreSnapshot = {
  config: DEFAULT_SIP_CONFIG,
  activeCall: null,
  history: SEEDED_CDR,
  dockExpanded: false,
};

function emit() {
  for (const l of listeners) l();
}

function hydrateFromStorage() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  try {
    const rawCfg = window.localStorage.getItem(CONFIG_KEY);
    if (rawCfg) {
      state = { ...state, config: { ...DEFAULT_SIP_CONFIG, ...JSON.parse(rawCfg) } };
    }
    const rawCdr = window.localStorage.getItem(CDR_KEY);
    if (rawCdr) {
      const parsed = JSON.parse(rawCdr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        state = { ...state, history: parsed };
      }
    }
  } catch {
    /* ignore */
  }
}

function persistConfig(cfg: SipTrunkConfig) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
  } catch {
    /* ignore */
  }
}

function persistHistory(list: SipCallRecord[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CDR_KEY, JSON.stringify(list.slice(0, 120)));
  } catch {
    /* ignore */
  }
}

export function getExtensionForEmail(email?: string | null): BetterwayExtension {
  if (!email) return BETTERWAY_EXTENSIONS[1] || BETTERWAY_EXTENSIONS[0];
  const lower = email.toLowerCase();
  return (
    BETTERWAY_EXTENSIONS.find((e) => e.email.toLowerCase() === lower) ||
    BETTERWAY_EXTENSIONS[1] ||
    BETTERWAY_EXTENSIONS[0]
  );
}

export function setSipDockExpanded(expanded: boolean): void {
  hydrateFromStorage();
  state = { ...state, dockExpanded: expanded };
  emit();
}

export function saveSipTrunkConfig(patch: Partial<SipTrunkConfig>): void {
  hydrateFromStorage();
  const next = { ...state.config, ...patch };
  state = { ...state, config: next };
  persistConfig(next);
  emit();
}

export function dialViaSip(params: {
  number: string;
  name?: string;
  category?: SipCallCategory;
  caseRef?: string;
  direction?: SipCallDirection;
}): void {
  hydrateFromStorage();
  const cleanNum = params.number.trim();
  if (!cleanNum) return;
  if (connectTimer) clearTimeout(connectTimer);

  const isInternal = /^ext\s*\d{3}$/i.test(cleanNum) || /^\d{3}$/.test(cleanNum);
  const extMatch = BETTERWAY_EXTENSIONS.find(
    (e) => e.ext === cleanNum.replace(/^ext\s*/i, '') || e.phone.replace(/\s+/g, '') === cleanNum.replace(/\s+/g, ''),
  );

  const dir: SipCallDirection = params.direction ?? (isInternal ? 'INTERNAL' : 'OUTBOUND');
  const category: SipCallCategory = params.category ?? (extMatch || isInternal ? 'Internal Ext' : 'Bank RM');
  const displayName = params.name || extMatch?.name || cleanNum;

  const call: ActiveSipCall = {
    id: `CALL-${Date.now().toString(36).toUpperCase()}`,
    direction: dir,
    remoteNumber: extMatch && isInternal ? `Ext ${extMatch.ext}` : cleanNum,
    remoteName: displayName,
    category,
    state: dir === 'INBOUND' ? 'RINGING' : 'DIALING',
    startedAtMs: Date.now(),
    connectedAtMs: null,
    muted: false,
    onHold: false,
    recording: state.config.autoRecord,
    dtmfHistory: '',
    caseRef: params.caseRef || '',
    notes: '',
    outcome: 'Connected',
  };

  state = { ...state, activeCall: call, dockExpanded: true };
  emit();

  if (dir !== 'INBOUND') {
    connectTimer = setTimeout(() => {
      if (state.activeCall?.id === call.id && state.activeCall.state === 'DIALING') {
        state = {
          ...state,
          activeCall: { ...state.activeCall, state: 'CONNECTED', connectedAtMs: Date.now() },
        };
        emit();
      }
    }, 1150);
  }
}

export function answerIncomingSipCall(): void {
  if (!state.activeCall || state.activeCall.state !== 'RINGING') return;
  state = {
    ...state,
    activeCall: { ...state.activeCall, state: 'CONNECTED', connectedAtMs: Date.now() },
  };
  emit();
}

export function toggleSipMute(): void {
  if (!state.activeCall) return;
  state = { ...state, activeCall: { ...state.activeCall, muted: !state.activeCall.muted } };
  emit();
}

export function toggleSipHold(): void {
  if (!state.activeCall) return;
  const nextHold = !state.activeCall.onHold;
  state = {
    ...state,
    activeCall: {
      ...state.activeCall,
      onHold: nextHold,
      state: nextHold ? 'ON_HOLD' : 'CONNECTED',
    },
  };
  emit();
}

export function toggleSipRecording(): void {
  if (!state.activeCall) return;
  state = { ...state, activeCall: { ...state.activeCall, recording: !state.activeCall.recording } };
  emit();
}

export function sendSipDtmf(digit: string): void {
  playDtmfTone(digit);
  if (!state.activeCall) return;
  state = {
    ...state,
    activeCall: { ...state.activeCall, dtmfHistory: `${state.activeCall.dtmfHistory}${digit}` },
  };
  emit();
}

export function updateActiveSipMeta(patch: Partial<Pick<ActiveSipCall, 'caseRef' | 'notes' | 'outcome'>>): void {
  if (!state.activeCall) return;
  state = { ...state, activeCall: { ...state.activeCall, ...patch } };
  emit();
}

export function transferSipCall(targetExt: string): void {
  if (!state.activeCall || !targetExt.trim()) return;
  const active = state.activeCall;
  const durationSec = active.connectedAtMs ? Math.max(1, Math.round((Date.now() - active.connectedAtMs) / 1000)) : 0;
  const rec: SipCallRecord = {
    id: active.id,
    direction: active.direction,
    remoteNumber: active.remoteNumber,
    remoteName: active.remoteName,
    category: active.category,
    status: 'TRANSFERRED',
    outcome: 'Transferred',
    durationSec,
    startedAt: new Date(active.startedAtMs).toISOString(),
    extensionUsed: state.config.extension,
    caseRef: active.caseRef || undefined,
    notes: `${active.notes ? `${active.notes} · ` : ''}Transferred to ${targetExt.trim()}`,
    recorded: active.recording,
  };
  const nextHistory = [rec, ...state.history];
  persistHistory(nextHistory);
  state = { ...state, activeCall: null, history: nextHistory };
  emit();
}

export function hangupSipCall(overrideOutcome?: SipCallOutcome): void {
  if (connectTimer) {
    clearTimeout(connectTimer);
    connectTimer = null;
  }
  const active = state.activeCall;
  if (!active) return;

  const wasConnected = Boolean(active.connectedAtMs);
  const durationSec = active.connectedAtMs ? Math.max(1, Math.round((Date.now() - active.connectedAtMs) / 1000)) : 0;

  const rec: SipCallRecord = {
    id: active.id,
    direction: active.direction,
    remoteNumber: active.remoteNumber,
    remoteName: active.remoteName,
    category: active.category,
    status: wasConnected ? 'COMPLETED' : 'MISSED',
    outcome: overrideOutcome || (wasConnected ? active.outcome : 'No Answer'),
    durationSec,
    startedAt: new Date(active.startedAtMs).toISOString(),
    extensionUsed: state.config.extension,
    caseRef: active.caseRef || undefined,
    notes: active.notes || undefined,
    recorded: active.recording && wasConnected,
  };

  const nextHistory = [rec, ...state.history];
  persistHistory(nextHistory);
  state = { ...state, activeCall: null, history: nextHistory };
  emit();
}

export function useSipPhone() {
  const [snap, setSnap] = useState<SipStoreSnapshot>(state);

  useEffect(() => {
    hydrateFromStorage();
    setSnap(state);
    const onChange = () => setSnap({ ...state });
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, []);

  return snap;
}
