'use client';

import React, { useState } from 'react';
import { CalendarClock, CheckCircle2, ClipboardCheck, Download, Plus, Share2 } from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { GlossyBlackCard, StatusPill } from '@/components/os/UiKit';

interface NextDayPlanRow {
  id: string;
  date: string;
  advisor: string;
  calls: number;
  visits: number;
  realEstateTieUps: number;
  whatsapp: number;
  fb: number;
  instagram: number;
  tiktok: number;
  snapchat: number;
  reddit: number;
  linkedin: number;
  x: number;
  other: string;
}

interface DailyReportRow {
  id: string;
  date: string;
  advisor: string;
  calls: number;
  visits: number;
  followups: number;
  realEstateTieUps: number;
  otherMeeting: number;
  documentsReceived: number;
  logins: number;
  preApproval: number;
  valuation: number;
  fol: number;
  disbursed: number;
  fb: number;
  instagram: number;
  tiktok: number;
  snapchat: number;
  reddit: number;
  linkedin: number;
  x: number;
  other: string;
}

export function DailyPlanAndReportTab() {
  const { user, toast } = useOs();
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

  const [plans, setPlans] = useState<NextDayPlanRow[]>([
    {
      id: 'p-1',
      date: tomorrow,
      advisor: 'Asif Khan',
      calls: 25,
      visits: 3,
      realEstateTieUps: 2,
      whatsapp: 30,
      fb: 4,
      instagram: 5,
      tiktok: 2,
      snapchat: 1,
      reddit: 1,
      linkedin: 6,
      x: 2,
      other: 'Emaar Hills Broker Desk Follow-up',
    },
    {
      id: 'p-2',
      date: tomorrow,
      advisor: 'Daniel Xavier',
      calls: 20,
      visits: 2,
      realEstateTieUps: 2,
      whatsapp: 22,
      fb: 2,
      instagram: 4,
      tiktok: 1,
      snapchat: 0,
      reddit: 0,
      linkedin: 5,
      x: 1,
      other: 'DIB & ADIB RM Pre-Approval Push',
    },
  ]);

  const [reports, setReports] = useState<DailyReportRow[]>([
    {
      id: 'r-1',
      date: today,
      advisor: 'Asif Khan',
      calls: 28,
      visits: 2,
      followups: 14,
      realEstateTieUps: 2,
      otherMeeting: 1,
      documentsReceived: 4,
      logins: 2,
      preApproval: 1,
      valuation: 1,
      fol: 1,
      disbursed: 0,
      fb: 3,
      instagram: 4,
      tiktok: 1,
      snapchat: 0,
      reddit: 1,
      linkedin: 5,
      x: 1,
      other: '3-Bank Proposal Sent to Dubai Hills Buyer',
    },
    {
      id: 'r-2',
      date: today,
      advisor: 'Elton Frank',
      calls: 22,
      visits: 3,
      followups: 11,
      realEstateTieUps: 3,
      otherMeeting: 1,
      documentsReceived: 3,
      logins: 2,
      preApproval: 2,
      valuation: 1,
      fol: 0,
      disbursed: 1,
      fb: 2,
      instagram: 3,
      tiktok: 2,
      snapchat: 1,
      reddit: 0,
      linkedin: 4,
      x: 2,
      other: 'ENBD Buyout FOL Signed',
    },
  ]);

  const [planForm, setPlanForm] = useState<Omit<NextDayPlanRow, 'id'>>({
    date: tomorrow,
    advisor: user?.name || 'Mortgage Advisor',
    calls: 20,
    visits: 2,
    realEstateTieUps: 2,
    whatsapp: 25,
    fb: 3,
    instagram: 4,
    tiktok: 2,
    snapchat: 1,
    reddit: 1,
    linkedin: 4,
    x: 1,
    other: '',
  });

  const [repForm, setRepForm] = useState<Omit<DailyReportRow, 'id'>>({
    date: today,
    advisor: user?.name || 'Mortgage Advisor',
    calls: 20,
    visits: 2,
    followups: 10,
    realEstateTieUps: 2,
    otherMeeting: 1,
    documentsReceived: 3,
    logins: 2,
    preApproval: 1,
    valuation: 1,
    fol: 0,
    disbursed: 0,
    fb: 2,
    instagram: 3,
    tiktok: 1,
    snapchat: 0,
    reddit: 0,
    linkedin: 3,
    x: 1,
    other: '',
  });

  const addPlan = (e: React.FormEvent) => {
    e.preventDefault();
    setPlans((prev) => [{ id: `p-${Date.now()}`, ...planForm }, ...prev]);
    toast('Next Day Plan logged!');
  };

  const addReport = (e: React.FormEvent) => {
    e.preventDefault();
    setReports((prev) => [{ id: `r-${Date.now()}`, ...repForm }, ...prev]);
    toast('Daily Report logged!');
  };

  const totCalls = reports.reduce((s, r) => s + r.calls, 0);
  const totLogins = reports.reduce((s, r) => s + r.logins, 0);
  const totPreApp = reports.reduce((s, r) => s + r.preApproval, 0);
  const totDisb = reports.reduce((s, r) => s + r.disbursed, 0);

  return (
    <div className="space-y-6">
      {/* Split 4-Tile Shining Black KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <GlossyBlackCard className="p-4 space-y-1" accent="emerald">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-slate-400">Daily Calls Logged</div>
          <div className="font-display text-2xl font-extrabold text-white font-mono-num">{totCalls}</div>
          <div className="text-[11px] text-[#34f0bc]">{reports.length} advisor reports</div>
        </GlossyBlackCard>
        <GlossyBlackCard className="p-4 space-y-1" accent="dual">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-slate-400">Bank Logins Today</div>
          <div className="font-display text-2xl font-extrabold text-[#34f0bc] font-mono-num">{totLogins}</div>
          <div className="text-[11px] text-slate-300">Docs received → submitted</div>
        </GlossyBlackCard>
        <GlossyBlackCard className="p-4 space-y-1" accent="gold">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-slate-400">Pre-Approvals &amp; FOL</div>
          <div className="font-display text-2xl font-extrabold text-[#fbe8a4] font-mono-num">{totPreApp}</div>
          <div className="text-[11px] text-slate-300">Active bank approvals</div>
        </GlossyBlackCard>
        <GlossyBlackCard className="p-4 space-y-1" accent="emerald">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-slate-400">Disbursed Deals</div>
          <div className="font-display text-2xl font-extrabold text-white font-mono-num">{totDisb}</div>
          <div className="text-[11px] text-[#34f0bc]">Ready for Bank DSA payout</div>
        </GlossyBlackCard>
      </div>

      {/* SECTION 1: NEXT DAY PLAN (Exact crm_requierment.xlsx Columns) */}
      <section className="bw-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--bw-line)] pb-3">
          <div>
            <h2 className="font-display text-base font-extrabold flex items-center gap-2 text-[var(--bw-ink)]">
              <CalendarClock size={17} className="text-[#119c78]" /> Next Day Plan (Calls, Meetings, Partner Tie-Ups &amp; All 8 Social Channels)
            </h2>
            <p className="text-xs text-[var(--bw-muted)] mt-0.5">
              Plan tomorrow&apos;s Calls, Bank/Partner Meetings, Real Estate Tie-ups, WhatsApp, FB, Instagram, TikTok, Snapchat, Reddit, LinkedIn &amp; X targets.
            </p>
          </div>
          <a href="/api/v1/utilities/master-backup-excel" className="bw-btn bw-btn-outline text-xs py-1.5 min-h-[34px]">
            <Download size={13} className="text-[#119c78]" /> Export Excel
          </a>
        </div>

        <form onSubmit={addPlan} className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-xs">
          <label className="space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[10.5px] font-bold text-[var(--bw-muted)]">Advisor</span>
            <input value={planForm.advisor} onChange={(e) => setPlanForm({ ...planForm, advisor: e.target.value })} className="w-full h-9 px-2.5 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]" />
          </label>
          {[
            ['calls', 'Calls'],
            ['visits', 'Bank/Client Meetings'],
            ['realEstateTieUps', 'Broker Tie-ups'],
            ['whatsapp', 'WhatsApp'],
            ['fb', 'FB'],
            ['instagram', 'Instagram'],
            ['tiktok', 'TikTok'],
            ['snapchat', 'Snapchat'],
            ['reddit', 'Reddit'],
            ['linkedin', 'LinkedIn'],
            ['x', 'X'],
          ].map(([k, lbl]) => (
            <label key={k} className="space-y-1">
              <span className="text-[10.5px] font-bold text-[var(--bw-muted)]">{lbl}</span>
              <input
                type="number"
                min={0}
                value={(planForm as any)[k]}
                onChange={(e) => setPlanForm({ ...planForm, [k]: Number(e.target.value) })}
                className="w-full h-9 px-2.5 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num"
              />
            </label>
          ))}
          <label className="space-y-1 col-span-2">
            <span className="text-[10.5px] font-bold text-[var(--bw-muted)]">Other Notes</span>
            <input value={planForm.other} onChange={(e) => setPlanForm({ ...planForm, other: e.target.value })} placeholder="Key goal for tomorrow..." className="w-full h-9 px-2.5 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]" />
          </label>
          <div className="flex items-end">
            <button type="submit" className="bw-btn bw-btn-obsidian w-full h-9 text-xs">
              <Plus size={14} /> Save Plan
            </button>
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[920px]">
            <thead>
              <tr className="bg-[var(--bw-soft)] border-y border-[var(--bw-line)] text-[10.5px] font-extrabold text-[var(--bw-muted)]">
                <th className="py-2.5 px-3 text-start">Date</th>
                <th className="py-2.5 px-3 text-start">Advisor</th>
                <th className="py-2.5 px-2 text-center">Calls</th>
                <th className="py-2.5 px-2 text-center">Meetings</th>
                <th className="py-2.5 px-2 text-center">Tie-Ups</th>
                <th className="py-2.5 px-2 text-center">WA</th>
                <th className="py-2.5 px-2 text-center">FB</th>
                <th className="py-2.5 px-2 text-center">IG</th>
                <th className="py-2.5 px-2 text-center">TikTok</th>
                <th className="py-2.5 px-2 text-center">Snap</th>
                <th className="py-2.5 px-2 text-center">Reddit</th>
                <th className="py-2.5 px-2 text-center">LinkedIn</th>
                <th className="py-2.5 px-2 text-center">X</th>
                <th className="py-2.5 px-3 text-start">Other</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--bw-line)]">
              {plans.map((p) => (
                <tr key={p.id} className="hover:bg-[var(--bw-hover)]">
                  <td className="py-2.5 px-3 font-mono-num">{p.date}</td>
                  <td className="py-2.5 px-3 font-bold">{p.advisor}</td>
                  <td className="py-2.5 px-2 text-center font-mono-num font-bold">{p.calls}</td>
                  <td className="py-2.5 px-2 text-center font-mono-num">{p.visits}</td>
                  <td className="py-2.5 px-2 text-center font-mono-num text-[#119c78] font-bold">{p.realEstateTieUps}</td>
                  <td className="py-2.5 px-2 text-center font-mono-num">{p.whatsapp}</td>
                  <td className="py-2.5 px-2 text-center font-mono-num">{p.fb}</td>
                  <td className="py-2.5 px-2 text-center font-mono-num">{p.instagram}</td>
                  <td className="py-2.5 px-2 text-center font-mono-num">{p.tiktok}</td>
                  <td className="py-2.5 px-2 text-center font-mono-num">{p.snapchat}</td>
                  <td className="py-2.5 px-2 text-center font-mono-num">{p.reddit}</td>
                  <td className="py-2.5 px-2 text-center font-mono-num">{p.linkedin}</td>
                  <td className="py-2.5 px-2 text-center font-mono-num">{p.x}</td>
                  <td className="py-2.5 px-3 text-[var(--bw-muted)]">{p.other}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 2: DAILY REPORT FUNNEL (Exact crm_requierment.xlsx Columns) */}
      <section className="bw-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--bw-line)] pb-3">
          <div>
            <h2 className="font-display text-base font-extrabold flex items-center gap-2 text-[var(--bw-ink)]">
              <ClipboardCheck size={17} className="text-[#119c78]" /> Daily Mortgage Activity Report (Calls → Docs → Logins → PA → Valuation → FOL → Disbursed)
            </h2>
            <p className="text-xs text-[var(--bw-muted)] mt-0.5">
              End-of-day conversion report per mortgage advisor across bank submissions, approvals, and social channels.
            </p>
          </div>
          <StatusPill label="Daily Close Compliant" tone="emerald" />
        </div>

        <form onSubmit={addReport} className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs">
          <label className="space-y-1">
            <span className="text-[10.5px] font-bold text-[var(--bw-muted)]">Advisor</span>
            <input value={repForm.advisor} onChange={(e) => setRepForm({ ...repForm, advisor: e.target.value })} className="w-full h-9 px-2.5 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]" />
          </label>
          {[
            ['calls', 'Calls'],
            ['visits', 'Meetings'],
            ['followups', 'Follow-ups'],
            ['realEstateTieUps', 'Broker Tie-ups'],
            ['otherMeeting', 'Other Meetings'],
            ['documentsReceived', 'Docs Received'],
            ['logins', 'Bank Logins'],
            ['preApproval', 'Pre-Approval'],
            ['valuation', 'Valuation'],
            ['fol', 'FOL Issued'],
            ['disbursed', 'Disbursed'],
          ].map(([k, lbl]) => (
            <label key={k} className="space-y-1">
              <span className="text-[10.5px] font-bold text-[var(--bw-muted)]">{lbl}</span>
              <input
                type="number"
                min={0}
                value={(repForm as any)[k]}
                onChange={(e) => setRepForm({ ...repForm, [k]: Number(e.target.value) })}
                className="w-full h-9 px-2.5 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num"
              />
            </label>
          ))}
          <label className="space-y-1 col-span-2 sm:col-span-3 lg:col-span-4">
            <span className="text-[10.5px] font-bold text-[var(--bw-muted)]">Social Channels (FB/IG/TikTok/Snap/Reddit/LI/X) &amp; Notes</span>
            <input value={repForm.other} onChange={(e) => setRepForm({ ...repForm, other: e.target.value })} placeholder="Key wins, bank RM feedback, social leads..." className="w-full h-9 px-2.5 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]" />
          </label>
          <div className="flex items-end col-span-2">
            <button type="submit" className="bw-btn bw-btn-primary w-full h-9 text-xs">
              <CheckCircle2 size={14} /> Submit Daily Report
            </button>
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[1040px]">
            <thead>
              <tr className="bg-[var(--bw-soft)] border-y border-[var(--bw-line)] text-[10.5px] font-extrabold text-[var(--bw-muted)]">
                <th className="py-2.5 px-3 text-start">Date</th>
                <th className="py-2.5 px-3 text-start">Advisor</th>
                <th className="py-2.5 px-2 text-center">Calls</th>
                <th className="py-2.5 px-2 text-center">Mtgs</th>
                <th className="py-2.5 px-2 text-center">Followups</th>
                <th className="py-2.5 px-2 text-center">Tie-Ups</th>
                <th className="py-2.5 px-2 text-center">Docs</th>
                <th className="py-2.5 px-2 text-center">Logins</th>
                <th className="py-2.5 px-2 text-center">Pre-App</th>
                <th className="py-2.5 px-2 text-center">Val.</th>
                <th className="py-2.5 px-2 text-center">FOL</th>
                <th className="py-2.5 px-2 text-center">Disb.</th>
                <th className="py-2.5 px-2 text-center"><Share2 size={11} className="inline" /> Social</th>
                <th className="py-2.5 px-3 text-start">Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--bw-line)]">
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-[var(--bw-hover)]">
                  <td className="py-2.5 px-3 font-mono-num">{r.date}</td>
                  <td className="py-2.5 px-3 font-bold">{r.advisor}</td>
                  <td className="py-2.5 px-2 text-center font-mono-num">{r.calls}</td>
                  <td className="py-2.5 px-2 text-center font-mono-num">{r.visits + r.otherMeeting}</td>
                  <td className="py-2.5 px-2 text-center font-mono-num">{r.followups}</td>
                  <td className="py-2.5 px-2 text-center font-mono-num">{r.realEstateTieUps}</td>
                  <td className="py-2.5 px-2 text-center font-mono-num font-bold">{r.documentsReceived}</td>
                  <td className="py-2.5 px-2 text-center font-mono-num font-extrabold text-[#119c78]">{r.logins}</td>
                  <td className="py-2.5 px-2 text-center font-mono-num font-bold">{r.preApproval}</td>
                  <td className="py-2.5 px-2 text-center font-mono-num">{r.valuation}</td>
                  <td className="py-2.5 px-2 text-center font-mono-num">{r.fol}</td>
                  <td className="py-2.5 px-2 text-center font-mono-num font-extrabold text-[#9a7123]">{r.disbursed}</td>
                  <td className="py-2.5 px-2 text-center font-mono-num text-[11px]">{r.fb + r.instagram + r.tiktok + r.snapchat + r.reddit + r.linkedin + r.x}</td>
                  <td className="py-2.5 px-3 text-[var(--bw-muted)]">{r.other}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
