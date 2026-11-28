'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, type LucideIcon } from 'lucide-react';

export interface SubFeatureItem<T extends string = string> {
  id: T;
  num: string; // '01', '02', ...
  label: string;
  icon: LucideIcon;
  badge?: string | number;
}

/**
 * Numbered Glossy-Black Active Pill Sub-Feature Strip modeled directly on the user's 7 reference screenshots:
 * Active item renders in shining black with brushed gold icon + gold `01` pill; inactive items render crisp white cards with clean numbered badges.
 */
export function SubFeatureTabs<T extends string>({
  sectionTitle,
  items,
  activeId,
  onSelect,
}: {
  sectionTitle: string;
  items: ReadonlyArray<SubFeatureItem<T>>;
  activeId: T;
  onSelect: (id: T) => void;
}) {
  return (
    <div className="bw-card p-3 sm:p-3.5 space-y-2.5 no-print">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2.5">
          <Link
            href="/os"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--bw-line)] bg-[var(--bw-soft)]/70 hover:bg-[#0b192c] hover:text-white text-[10.5px] font-extrabold uppercase tracking-[0.12em] transition"
          >
            <ArrowLeft size={12} /> All Apps
          </Link>
          <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--bw-muted)]">
            {sectionTitle} · {items.length} Sub-Modules
          </span>
        </div>
        <span className="text-[10.5px] font-mono-num font-bold text-[#0e5a49]">
          Active: {items.find((i) => i.id === activeId)?.num} · {items.find((i) => i.id === activeId)?.label}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`group inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-extrabold cursor-pointer transition ${
                active
                  ? 'bg-gradient-to-b from-[#171e29] to-[#06090e] text-white border border-[#c49a45]/55 shadow-[0_10px_24px_-10px_rgba(4,7,12,0.85)]'
                  : 'bg-[var(--bw-soft)]/60 hover:bg-white dark:bg-[#122642] border border-[var(--bw-line)] hover:border-[#0e5a49] text-[var(--bw-ink)]'
              }`}
            >
              <Icon
                size={14}
                className={active ? 'text-[#f5d178]' : 'text-[var(--bw-muted)] group-hover:text-[#0e5a49]'}
              />
              <span className="whitespace-nowrap">{item.label}</span>
              {item.badge !== undefined && item.badge !== '' && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[9.5px] font-mono-num font-bold ${
                    active ? 'bg-[#64c4a8]/20 text-[#64c4a8]' : 'bg-[#0e5a49]/12 text-[#0a3f34] dark:text-[#64c4a8]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono-num font-extrabold ${
                  active
                    ? 'bg-[#c49a45]/22 text-[#dfc285]'
                    : 'bg-black/[0.06] dark:bg-white/10 text-[var(--bw-muted)]'
                }`}
              >
                {item.num}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
