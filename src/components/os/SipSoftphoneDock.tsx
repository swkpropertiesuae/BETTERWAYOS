'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowUpRight,
  CircleDot,
  Grid3X3,
  Mic,
  MicOff,
  Pause,
  Phone,
  PhoneCall,
  PhoneForwarded,
  PhoneIncoming,
  PhoneOff,
  Play,
  X,
} from 'lucide-react';
import {
  answerIncomingSipCall,
  BETTERWAY_EXTENSIONS,
  dialViaSip,
  formatCallDuration,
  getExtensionForEmail,
  hangupSipCall,
  playDtmfTone,
  sendSipDtmf,
  setSipDockExpanded,
  toggleSipHold,
  toggleSipMute,
  toggleSipRecording,
  transferSipCall,
  updateActiveSipMeta,
  useSipPhone,
} from '@/lib/sip-store';
import type { SessionUser } from '@/lib/domain/types';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

export function SipSoftphoneDock({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  const { config, activeCall, dockExpanded } = useSipPhone();
  const [dialInput, setDialInput] = useState('');
  const [showDtmf, setShowDtmf] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferExt, setTransferExt] = useState('104');
  const [elapsedSec, setElapsedSec] = useState(0);

  const myExt = getExtensionForEmail(user?.email);

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

  if (!user || pathname === '/login') return null;

  // Compact docked pill when minimized & idle
  if (!dockExpanded && !activeCall) {
    return (
      <div className="fixed bottom-20 sm:bottom-5 start-4 z-[70] no-print flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setSipDockExpanded(true)}
          className="h-10 px-3.5 rounded-full bg-[#090d13]/95 hover:bg-[#111822] text-white border border-[#22e2ad]/45 shadow-2xl backdrop-blur-xl inline-flex items-center gap-2 text-[11.5px] font-extrabold cursor-pointer transition"
          title="Open Betterway SIP Softphone"
        >
          <span className="size-2 rounded-full bg-[#34f0bc] shadow-[0_0_8px_#34f0bc]" />
          <Phone size={13} className="text-[#34f0bc]" />
          <span>SIP Ext {myExt.ext}</span>
          <span className="text-[10px] font-semibold text-[#fbe8a4] hidden sm:inline">· Ready</span>
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label="Betterway SIP Softphone Dock"
      className="fixed bottom-20 sm:bottom-5 start-4 z-[75] w-[328px] max-w-[calc(100vw-2rem)] rounded-[22px] bg-[#080c12]/97 text-white border border-[#22e2ad]/40 shadow-[0_28px_60px_-16px_rgba(3,7,14,0.9)] backdrop-blur-xl overflow-hidden no-print"
    >
      {/* Top Glossy Bar */}
      <div className="px-4 py-3 bg-gradient-to-r from-[#0e1520] to-[#080c12] border-b border-white/10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`size-2.5 rounded-full shrink-0 ${
              activeCall ? 'bg-[#34f0bc] animate-pulse shadow-[0_0_10px_#34f0bc]' : config.registered ? 'bg-[#22e2ad]' : 'bg-amber-400'
            }`}
          />
          <div className="min-w-0">
            <div className="text-[11.5px] font-extrabold truncate">
              Betterway SIP · Ext {myExt.ext}
            </div>
            <div className="text-[9.5px] text-slate-400 truncate">
              {config.sipDomain} · {config.codec}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Link
            href="/os/sip-calls"
            className="size-7 rounded-full bg-white/8 hover:bg-white/18 text-[#fbe8a4] flex items-center justify-center transition"
            title="Open Full SIP Call Desk"
          >
            <ArrowUpRight size={13} />
          </Link>
          {!activeCall && (
            <button
              type="button"
              onClick={() => setSipDockExpanded(false)}
              className="size-7 rounded-full bg-white/8 hover:bg-white/18 text-slate-300 flex items-center justify-center cursor-pointer transition"
              aria-label="Minimize SIP Softphone"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {activeCall ? (
        <div className="p-4 space-y-3.5">
          {/* Active Call Banner */}
          <div className="p-3.5 rounded-2xl bg-white/[0.06] border border-white/12 text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#22e2ad]/15 text-[#34f0bc] text-[10px] font-extrabold uppercase tracking-wider">
              {activeCall.direction === 'INBOUND' ? <PhoneIncoming size={11} /> : <PhoneCall size={11} />}
              {activeCall.state === 'RINGING'
                ? 'Incoming Call'
                : activeCall.state === 'DIALING'
                  ? 'Dialing via SIP...'
                  : activeCall.state === 'ON_HOLD'
                    ? 'On Hold'
                    : `Connected · ${formatCallDuration(elapsedSec)}`}
            </div>
            <div className="font-display text-base font-extrabold text-white truncate pt-0.5">{activeCall.remoteName}</div>
            <div className="font-mono-num text-xs text-[#fbe8a4]">{activeCall.remoteNumber}</div>
            {activeCall.recording && activeCall.state === 'CONNECTED' && (
              <div className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400">
                <CircleDot size={10} className="animate-pulse" /> Recording Call (CBUAE Audit)
              </div>
            )}
            {activeCall.dtmfHistory && (
              <div className="text-[10.5px] font-mono text-slate-300">DTMF: {activeCall.dtmfHistory}</div>
            )}
          </div>

          {activeCall.state === 'RINGING' ? (
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={answerIncomingSipCall}
                className="py-2.5 rounded-full bg-[#119c78] hover:bg-[#14b58b] text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Phone size={14} /> Answer
              </button>
              <button
                type="button"
                onClick={() => hangupSipCall('No Answer')}
                className="py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <PhoneOff size={14} /> Decline
              </button>
            </div>
          ) : (
            <>
              {/* In-Call Controls */}
              <div className="grid grid-cols-4 gap-1.5 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={toggleSipMute}
                  className={`py-2 rounded-xl flex flex-col items-center gap-1 cursor-pointer transition ${
                    activeCall.muted ? 'bg-amber-500 text-black' : 'bg-white/10 hover:bg-white/18 text-white'
                  }`}
                >
                  {activeCall.muted ? <MicOff size={14} /> : <Mic size={14} />}
                  {activeCall.muted ? 'Muted' : 'Mute'}
                </button>
                <button
                  type="button"
                  onClick={toggleSipHold}
                  className={`py-2 rounded-xl flex flex-col items-center gap-1 cursor-pointer transition ${
                    activeCall.onHold ? 'bg-[#fbe8a4] text-black' : 'bg-white/10 hover:bg-white/18 text-white'
                  }`}
                >
                  {activeCall.onHold ? <Play size={14} /> : <Pause size={14} />}
                  {activeCall.onHold ? 'Resume' : 'Hold'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDtmf((v) => !v);
                    setShowTransfer(false);
                  }}
                  className={`py-2 rounded-xl flex flex-col items-center gap-1 cursor-pointer transition ${
                    showDtmf ? 'bg-[#22e2ad] text-black' : 'bg-white/10 hover:bg-white/18 text-white'
                  }`}
                >
                  <Grid3X3 size={14} />
                  Keypad
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowTransfer((v) => !v);
                    setShowDtmf(false);
                  }}
                  className={`py-2 rounded-xl flex flex-col items-center gap-1 cursor-pointer transition ${
                    showTransfer ? 'bg-[#22e2ad] text-black' : 'bg-white/10 hover:bg-white/18 text-white'
                  }`}
                >
                  <PhoneForwarded size={14} />
                  Transfer
                </button>
              </div>

              {showDtmf && (
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {KEYS.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => sendSipDtmf(k)}
                      className="h-9 rounded-xl bg-white/10 hover:bg-[#22e2ad] hover:text-black font-mono font-extrabold text-sm cursor-pointer transition"
                    >
                      {k}
                    </button>
                  ))}
                </div>
              )}

              {showTransfer && (
                <div className="p-2.5 rounded-xl bg-white/[0.06] border border-white/12 space-y-2 text-[11px]">
                  <div className="font-bold text-[#fbe8a4]">Blind Transfer to Extension</div>
                  <div className="flex gap-1.5">
                    <select
                      value={transferExt}
                      onChange={(e) => setTransferExt(e.target.value)}
                      className="flex-1 h-8 px-2 rounded-lg bg-[#0d131d] border border-white/15 text-xs text-white"
                    >
                      {BETTERWAY_EXTENSIONS.map((ext) => (
                        <option key={ext.ext} value={`Ext ${ext.ext} (${ext.name})`}>
                          Ext {ext.ext} · {ext.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => transferSipCall(transferExt)}
                      className="px-3 h-8 rounded-lg bg-[#22e2ad] text-black font-extrabold cursor-pointer"
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Case Tag & Record Toggle */}
              <div className="flex items-center gap-1.5">
                <input
                  value={activeCall.caseRef}
                  onChange={(e) => updateActiveSipMeta({ caseRef: e.target.value })}
                  placeholder="Case Ref (e.g. BW-2026-041)"
                  className="flex-1 h-8 px-2.5 rounded-lg bg-white/8 border border-white/12 text-[11px] text-white placeholder:text-slate-400 outline-none focus:border-[#22e2ad]"
                />
                <button
                  type="button"
                  onClick={toggleSipRecording}
                  className={`h-8 px-2.5 rounded-lg text-[10.5px] font-bold cursor-pointer border ${
                    activeCall.recording
                      ? 'bg-rose-500/20 border-rose-400/50 text-rose-300'
                      : 'bg-white/8 border-white/12 text-slate-300'
                  }`}
                >
                  {activeCall.recording ? 'REC ON' : 'REC OFF'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => hangupSipCall()}
                className="w-full py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-lg transition"
              >
                <PhoneOff size={14} /> End Call &amp; Log CDR
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-1.5">
            <input
              value={dialInput}
              onChange={(e) => setDialInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && dialInput.trim()) {
                  dialViaSip({ number: dialInput, category: 'Borrower' });
                  setDialInput('');
                }
              }}
              placeholder="+971 50 ... or Ext 104"
              className="flex-1 h-9 px-3 rounded-xl bg-white/10 border border-white/15 font-mono-num text-xs text-white placeholder:text-slate-400 outline-none focus:border-[#22e2ad]"
            />
            <button
              type="button"
              onClick={() => {
                if (!dialInput.trim()) return;
                dialViaSip({ number: dialInput, category: 'Borrower' });
                setDialInput('');
              }}
              className="h-9 px-3.5 rounded-xl bg-[#119c78] hover:bg-[#14b58b] text-white text-xs font-extrabold inline-flex items-center gap-1 cursor-pointer"
            >
              <Phone size={13} /> Call
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {KEYS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  playDtmfTone(k);
                  setDialInput((prev) => `${prev}${k}`);
                }}
                className="h-8 rounded-lg bg-white/8 hover:bg-white/18 font-mono font-bold text-xs cursor-pointer transition"
              >
                {k}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10.5px]">
            <Link href="/os/sip-calls" className="text-[#34f0bc] font-bold hover:underline">
              159 Bank RMs &amp; CDR Log →
            </Link>
            <button
              type="button"
              onClick={() => setDialInput('')}
              className="text-slate-400 hover:text-white cursor-pointer font-semibold"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
