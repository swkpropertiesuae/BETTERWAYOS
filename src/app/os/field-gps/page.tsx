'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertOctagon, CheckCircle2, ClipboardCheck, ExternalLink, MapPin, Navigation } from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { PageHeader, StatusPill } from '@/components/os/UiKit';
import { ForensicVisitsTab } from '@/components/workspace/ForensicVisitsTab';

export default function FieldGpsPage() {
  const { toast } = useOs();
  const [section, setSection] = useState<'gps' | 'forensic'>('forensic');
  const [visits, setVisits] = useState<any[]>([]);
  const [purpose, setPurpose] = useState('DLD Trustee Transfer');
  const [destination, setDestination] = useState('Dubai Land Department Trustee — Al Barsha');
  const [coords, setCoords] = useState({ lat: 25.118, lng: 55.2006, accuracyM: 15 });

  const load = useCallback(async () => {
    const r = await fetch('/api/v1/field-gps');
    if (r.ok) {
      const d = await r.json();
      setVisits(d.visits ?? []);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const grabGps = (): Promise<{ lat: number; lng: number; accuracyM: number }> =>
    new Promise((resolve) => {
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const c = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracyM: Math.round(pos.coords.accuracy) };
            setCoords(c);
            resolve(c);
          },
          () => resolve(coords),
          { timeout: 5000 },
        );
      } else {
        resolve(coords);
      }
    });

  const startVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    const gps = await grabGps();
    const r = await fetch('/api/v1/field-gps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purpose, destinationLabel: destination, ...gps }),
    });
    if (r.ok) {
      toast('Field Visit GPS Check-In active — Owners & Operations can track live!');
      await load();
    }
  };

  const pingWaypoint = async (visitId: string) => {
    const gps = await grabGps();
    const r = await fetch('/api/v1/field-gps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'waypoint', visitId, lat: gps.lat, lng: gps.lng, note: 'Live GPS Waypoint' }),
    });
    if (r.ok) {
      toast('Live GPS waypoint pinned!');
      await load();
    }
  };

  const endVisit = async (visitId: string) => {
    const r = await fetch('/api/v1/field-gps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'end', visitId, outcomeNotes: 'Field visit completed cleanly' }),
    });
    if (r.ok) {
      toast('Field visit ended and logged!');
      await load();
    }
  };

  const sendSos = async (visitId: string) => {
    const r = await fetch('/api/v1/field-gps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sos', visitId, reason: 'Immediate Field Emergency SOS triggered from GPS Console' }),
    });
    if (r.ok) {
      toast('SOS ALERT sent to Warda Kapadia, Shabib Siraj & #urgent-alerts!', 'err');
      await load();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Field Operations · Live GPS Tracking & Safety SOS"
        title="Field GPS"
        accent="Services"
        subtitle="Track field staff regularly across Bank Desks, Property Valuations, Developer NOC Offices, and DLD Trustees with live GPS coordinates, waypoints, and 1-tap SOS alerts to Owners."
      />

      <div className="flex flex-wrap gap-2 text-xs">
        <button
          type="button"
          onClick={() => setSection('forensic')}
          className={`px-4 py-2 rounded-full font-extrabold inline-flex items-center gap-1.5 cursor-pointer ${
            section === 'forensic' ? 'bg-[#025e3d] text-[#FCF1B7]' : 'border border-[var(--bw-line)] bg-[var(--bw-card)]'
          }`}
        >
          <ClipboardCheck size={14} /> Forensic Mortgage Field Meeting Report &amp; Authority Queue
        </button>
        <button
          type="button"
          onClick={() => setSection('gps')}
          className={`px-4 py-2 rounded-full font-extrabold inline-flex items-center gap-1.5 cursor-pointer ${
            section === 'gps' ? 'bg-[#007b52] text-white' : 'border border-[var(--bw-line)] bg-[var(--bw-card)]'
          }`}
        >
          <Navigation size={14} /> Live Field GPS Check-In &amp; 1-Tap SOS ({visits.length})
        </button>
      </div>

      {section === 'forensic' ? (
        <ForensicVisitsTab compactStaffMode />
      ) : (
      <div className="grid lg:grid-cols-12 gap-6">
        <form onSubmit={startVisit} className="lg:col-span-4 bw-card p-5 space-y-3 text-xs">
          <h3 className="text-sm font-extrabold flex items-center gap-1.5">
            <Navigation size={15} className="text-[#007b52]" /> Start Field Visit (GPS Check-In)
          </h3>
          <div>
            <label className="font-bold block mb-1">Visit Purpose</label>
            <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]">
              <option>DLD Trustee Transfer</option>
              <option>Bank Valuation Inspection</option>
              <option>Bank RM / FOL Signing</option>
              <option>Developer NOC / SOA Office</option>
              <option>VIP Client Home Visit</option>
            </select>
          </div>
          <div>
            <label className="font-bold block mb-1">Destination / Building</label>
            <input required value={destination} onChange={(e) => setDestination(e.target.value)} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
          </div>
          <div className="p-3 rounded-xl bg-[var(--bw-bg)] border border-[var(--bw-line)] font-mono-num text-[11px]">
            Current GPS Anchor: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)} (±{coords.accuracyM}m)
          </div>
          <button type="submit" className="w-full h-10 rounded-full bg-[#007b52] text-white font-bold cursor-pointer">
            Check-In &amp; Share Live GPS
          </button>
        </form>

        <div className="lg:col-span-8 bw-card p-5 space-y-3">
          <h3 className="text-sm font-extrabold flex items-center gap-1.5">
            <MapPin size={15} className="text-[#007b52]" /> Field Staff Live Visit Log ({visits.length})
          </h3>
          {visits.length === 0 ? (
            <div className="py-10 text-center text-xs text-[var(--bw-muted)]">No field visits logged yet.</div>
          ) : (
            visits.map((v) => (
              <div
                key={v.id}
                className={`p-4 rounded-2xl border text-xs space-y-2.5 ${
                  v.status === 'SOS'
                    ? 'bg-red-50 dark:bg-red-950/35 border-red-500'
                    : v.status === 'ACTIVE'
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-400/50'
                      : 'bg-[var(--bw-bg)]/60 border-[var(--bw-line)]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-extrabold text-sm">{v.user_name}</span> · <span className="font-bold text-[#007b52]">{v.purpose}</span>
                    <div className="text-[var(--bw-muted)]">{v.destination_label}</div>
                  </div>
                  <StatusPill label={v.status} tone={v.status === 'SOS' ? 'red' : v.status === 'ACTIVE' ? 'emerald' : 'slate'} />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--bw-line)]">
                  <a
                    href={`https://maps.google.com/?q=${v.last_lat},${v.last_lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono-num text-[#007b52] font-bold inline-flex items-center gap-1 hover:underline"
                  >
                    GPS {Number(v.last_lat).toFixed(4)}, {Number(v.last_lng).toFixed(4)} ({(v.waypoints ?? []).length} pins) <ExternalLink size={11} />
                  </a>
                  {v.status === 'ACTIVE' && (
                    <div className="flex flex-wrap gap-1.5">
                      <button type="button" onClick={() => void pingWaypoint(v.id)} className="px-3 py-1.5 rounded-full border border-[var(--bw-line)] font-bold cursor-pointer">
                        Ping GPS
                      </button>
                      <button type="button" onClick={() => void endVisit(v.id)} className="px-3 py-1.5 rounded-full bg-[#025e3d] text-[#FCF1B7] font-bold inline-flex items-center gap-1 cursor-pointer">
                        <CheckCircle2 size={12} /> End Visit
                      </button>
                      <button type="button" onClick={() => void sendSos(v.id)} className="px-3 py-1.5 rounded-full bg-red-600 text-white font-extrabold inline-flex items-center gap-1 cursor-pointer">
                        <AlertOctagon size={12} /> 1-Tap SOS
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      )}
    </div>
  );
}
