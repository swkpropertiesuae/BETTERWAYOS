'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Crown, Lock, Search, ShieldAlert } from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { PageHeader, StatusPill } from '@/components/os/UiKit';
import type { MasterRegistryDef } from '@/lib/domain/masters';

interface RegistryWithCount extends MasterRegistryDef {
  count: number;
}

export default function MasterLogPage() {
  const { user } = useOs();
  const [registries, setRegistries] = useState<RegistryWithCount[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCat, setActiveCat] = useState<string>('All');
  const [query, setQuery] = useState('');
  const [pendingProposals, setPendingProposals] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/masters')
      .then((r) => r.json())
      .then((d) => {
        setRegistries(d.registries ?? []);
        setCategories(d.categories ?? []);
        setPendingProposals(d.pendingProposals ?? 0);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = registries.filter((r) => {
    if (activeCat !== 'All' && r.category !== activeCat) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return `${r.label} ${r.subtitle} ${r.key} ${r.category}`.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CORE · The Headquarters · Master Data Registries"
        title="Master Log"
        accent="(22 CORE Registries)"
        subtitle="Single source of truth for Dubai Communities, Developers, Oud Metha Office Geofence & Wi-Fi, 12 Company Departments, FX/VAT/Chart of Accounts, 24 Banks, Staff Directory & AI Case Studies."
        actions={
          <>
            {user?.isOwner ? (
              <StatusPill label="Owner Direct Write Access" tone="gold" />
            ) : user?.role === 'OFFICE_ADMIN' ? (
              <StatusPill label="Admin Mode: Edits Require Owner Approval" tone="blue" />
            ) : (
              <StatusPill label="Read-Only Lookup Mode" tone="slate" />
            )}
            {user?.isOwner && pendingProposals > 0 && (
              <Link
                href="/os/executive?tab=approvals"
                className="px-4 py-2 rounded-full bg-amber-500 text-[#0A1128] text-xs font-extrabold inline-flex items-center gap-1.5"
              >
                <Crown size={13} /> {pendingProposals} Admin Proposal{pendingProposals > 1 ? 's' : ''} Waiting
              </Link>
            )}
          </>
        }
      />

      {user?.role === 'OFFICE_ADMIN' && (
        <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-300/60 text-xs flex items-center gap-3">
          <ShieldAlert size={16} className="text-sky-700 shrink-0" />
          <span>
            <strong>Governance Rule:</strong> Any addition or edit you submit in Master Log is queued for <strong>Warda Kapadia</strong> or{' '}
            <strong>Shabib Siraj</strong> to approve before taking effect. Office Geofence/Hikvision, Roles, and Staff Salaries are strictly Owner-only.
          </span>
        </div>
      )}

      {/* Search & Category Filter Pills (matching Master Log blueprint) */}
      <div className="bw-card p-5 space-y-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={15} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-[var(--bw-muted)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter master tables..."
              className="w-full h-10 ps-10 pe-4 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] text-xs outline-none focus:border-[var(--bw-emerald)]"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {['All', ...categories].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCat(cat)}
                className={`px-3.5 py-2 rounded-full text-xs font-bold border transition cursor-pointer ${
                  activeCat === cat
                    ? 'bg-[#0D8A6A] text-white border-[#0D8A6A]'
                    : 'bg-[var(--bw-card)] text-[var(--bw-body)] border-[var(--bw-line)] hover:border-[#0D8A6A]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 3-Column Master Registry Cards Grid */}
        {loading ? (
          <div className="py-12 text-center text-xs text-[var(--bw-muted)]">Loading 22 CORE Master registries from Supabase...</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((reg) => {
              const isOwnerLocked = reg.writePolicy === 'OWNER_ONLY' || reg.writePolicy === 'OWNER_ONLY_SALARY_ROLE';
              return (
                <Link
                  key={reg.key}
                  href={`/os/master-log/${reg.key}`}
                  className="group rounded-2xl border border-[var(--bw-line)] hover:border-[#0D8A6A] bg-[var(--bw-card)] p-4 flex flex-col justify-between gap-4 transition hover:shadow-md"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--bw-muted)] flex items-center gap-1">
                        {reg.category}
                        {isOwnerLocked && <Lock size={10} className="text-amber-600" />}
                      </span>
                      <span className="min-w-7 h-6 px-2 rounded-full bg-emerald-500/12 text-emerald-800 dark:text-emerald-300 text-[11px] font-mono-num font-extrabold flex items-center justify-center">
                        {reg.count}
                      </span>
                    </div>
                    <h3 className="text-sm font-extrabold tracking-tight group-hover:text-[#0D8A6A] transition">{reg.label}</h3>
                    <p className="text-xs text-[var(--bw-muted)] leading-relaxed">{reg.subtitle}</p>
                  </div>

                  <div className="pt-2.5 border-t border-[var(--bw-line)] flex items-center justify-between text-xs">
                    <span className="font-mono text-[11px] text-[var(--bw-muted)]">{reg.key}</span>
                    <span className="font-bold text-[#0D8A6A] inline-flex items-center gap-1">
                      Open Master <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
