'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowDown,
  ArrowUp,
  Check,
  GripHorizontal,
  GripVertical,
  Palette,
  Pin,
  PinOff,
  RotateCcw,
  Sliders,
  Sparkles,
  Type,
  X,
} from 'lucide-react';
import {
  ALL_QUICK_SHORTCUTS,
  DEFAULT_APP_ORDER,
  DEFAULT_UI_CONFIG,
  UI_PRESETS,
  type DensityChoice,
  type FontFamilyChoice,
  type FontStyleChoice,
  type HighlightStyleChoice,
  type UiCustomConfig,
} from '@/lib/ui-customizer';

const APP_LABEL_MAP: Record<string, string> = {
  place: "Warda's / Shabib's Place",
  corner: "Warda's / Shabib's Corner",
  'command-center': 'Command Center',
  dashboard: 'Dashboard',
  'master-log': 'Master Log (CORE)',
  pipeline: '12-Step Pipeline',
  coordinator: 'Coordinator & Logins',
  crm: 'CRM',
  'mortgage-desk': 'Mortgage Exclusive Desk',
  calculators: 'Calculators & Tools (12)',
  sales: 'Sales & Services',
  vault: 'Client Document Vault',
  accounts: 'Accounts',
  compliance: 'Compliance',
  'website-studio': 'Website & Social Studio',
  employees: 'Employees & Attendance',
  inside: 'Team Group (Inside)',
  'field-gps': 'Field GPS Services',
  ai: 'AI Case-Study Copilot',
  utilities: 'Utilities & Documents',
  settings: 'Settings',
};

export function CustomiseUiDrawer({
  open,
  onClose,
  config,
  onChange,
  onReset,
}: {
  open: boolean;
  onClose: () => void;
  config: UiCustomConfig;
  onChange: (next: UiCustomConfig) => void;
  onReset: () => void;
}) {
  const [tab, setTab] = useState<'colors' | 'fonts' | 'highlight' | 'pins'>('colors');
  const [dragKey, setDragKey] = useState<string | null>(null);

  if (!open) return null;

  const update = (patch: Partial<UiCustomConfig>) => {
    onChange({ ...config, ...patch });
  };

  const togglePinApp = (key: string) => {
    const exists = config.pinnedAppKeys.includes(key);
    const next = exists ? config.pinnedAppKeys.filter((k) => k !== key) : [key, ...config.pinnedAppKeys];
    update({ pinnedAppKeys: next });
  };

  const moveApp = (key: string, dir: -1 | 1) => {
    const list = [...config.appOrder];
    for (const k of DEFAULT_APP_ORDER) {
      if (!list.includes(k)) list.push(k);
    }
    const idx = list.indexOf(key);
    const nextIdx = idx + dir;
    if (idx < 0 || nextIdx < 0 || nextIdx >= list.length) return;
    [list[idx], list[nextIdx]] = [list[nextIdx], list[idx]];
    update({ appOrder: list });
  };

  const dropAppOn = (targetKey: string) => {
    if (!dragKey || dragKey === targetKey) return;
    const list = [...config.appOrder];
    for (const k of DEFAULT_APP_ORDER) {
      if (!list.includes(k)) list.push(k);
    }
    const fromIdx = list.indexOf(dragKey);
    const toIdx = list.indexOf(targetKey);
    if (fromIdx < 0 || toIdx < 0) return;
    const [moved] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, moved);
    setDragKey(null);
    update({ appOrder: list });
  };

  const toggleShortcut = (id: string) => {
    const exists = config.pinnedShortcuts.some((s) => s.id === id);
    if (exists) {
      update({ pinnedShortcuts: config.pinnedShortcuts.filter((s) => s.id !== id) });
    } else {
      const found = ALL_QUICK_SHORTCUTS.find((s) => s.id === id);
      if (found) update({ pinnedShortcuts: [...config.pinnedShortcuts, found], dockMode: 'floating' });
    }
  };

  const orderedKeys = [...config.appOrder, ...DEFAULT_APP_ORDER.filter((k) => !config.appOrder.includes(k))];

  return (
    <div className="fixed inset-0 z-[80] flex justify-end no-print">
      {/* Subtle click-away scrim (keeps live UI visible behind!) */}
      <div className="flex-1 bg-black/25 backdrop-blur-[1px]" onClick={onClose} />

      {/* Slide-Over Customise UI Studio */}
      <aside
        className="w-full max-w-[430px] h-full bg-white dark:bg-[#0b0f16] border-s border-[var(--bw-line-strong)] shadow-2xl flex flex-col overflow-hidden"
        aria-label="Customise UI Studio"
      >
        {/* Dark Glossy Drawer Header */}
        <div className="px-5 py-4 bg-[#080c12] text-white border-b border-[#22e2ad]/30 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="size-9 rounded-xl bg-white/10 border border-[#22e2ad]/40 text-[#34f0bc] flex items-center justify-center">
              <Palette size={18} />
            </span>
            <div>
              <h2 className="font-display text-sm font-extrabold text-white">Customise UI Studio</h2>
              <p className="text-[10.5px] text-slate-300">Live colors, fonts, sizes, highlights &amp; drag/pin layout</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onReset}
              className="px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[10.5px] font-bold text-[#fbe8a4] inline-flex items-center gap-1 cursor-pointer"
              title="Reset to default Betterway theme"
            >
              <RotateCcw size={12} /> Reset
            </button>
            <button
              type="button"
              onClick={onClose}
              className="size-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
              aria-label="Close Customise UI"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* 4 Studio Tabs */}
        <div className="grid grid-cols-4 gap-1 p-2 bg-[#f8f3e4] dark:bg-[#0e141e] border-b border-[var(--bw-line)] text-[11px] font-extrabold">
          {[
            { id: 'colors', label: 'Colors', icon: Palette },
            { id: 'fonts', label: 'Fonts', icon: Type },
            { id: 'highlight', label: 'Highlight', icon: Sparkles },
            { id: 'pins', label: 'Pin & Drag', icon: Pin },
          ].map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id as any)}
                className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition ${
                  active ? 'bg-[#090d13] text-[#34f0bc] shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-white/70'
                }`}
              >
                <Icon size={13} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Scrollable Studio Controls */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {tab === 'colors' && (
            <>
              <div className="space-y-2.5">
                <div className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[#119c78]">
                  1-Click Theme Presets
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {UI_PRESETS.map((p) => {
                    const active = config.presetId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => update({ presetId: p.id, ...p.patch })}
                        className={`p-2.5 rounded-xl border text-start cursor-pointer transition ${
                          active
                            ? 'border-[#119c78] bg-[#e3fbf3]/60 dark:bg-[#0d2b24] ring-1 ring-[#22e2ad]'
                            : 'border-[var(--bw-line)] bg-white dark:bg-[#111722] hover:border-[#119c78]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <div className="flex items-center gap-1">
                            {p.swatch.map((hex, i) => (
                              <span
                                key={i}
                                className="size-4 rounded-full border border-black/15 shadow-xs"
                                style={{ backgroundColor: hex }}
                              />
                            ))}
                          </div>
                          {active && <Check size={13} className="text-[#119c78]" />}
                        </div>
                        <div className="font-bold text-[11px] leading-tight text-slate-900 dark:text-white">{p.name}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-[var(--bw-line)]">
                <div className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[#119c78]">
                  Fine-Tune Every Surface Color
                </div>
                {(
                  [
                    ['bgColor', 'UI Background Color', true],
                    ['cardBgColor', 'Cards Background Color', false],
                    ['heroBgColor', 'Shining Black Hero / Dark Card', false],
                    ['textColor', 'Primary Font Color', false],
                    ['mutedColor', 'Secondary / Label Font Color', false],
                    ['highlightColor', 'Primary Highlight / Accent Color', false],
                    ['goldColor', 'Secondary Gold Highlight', false],
                    ['borderColor', 'Card & Table Border Color', false],
                  ] as const
                ).map(([field, label, isBg]) => (
                  <div
                    key={field}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-soft)]/50"
                  >
                    <div className="font-bold text-slate-800 dark:text-slate-100">{label}</div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config[field]}
                        onChange={(e) =>
                          update({
                            presetId: 'custom',
                            [field]: e.target.value,
                            ...(isBg ? { useCustomBgSolid: true } : {}),
                          } as Partial<UiCustomConfig>)
                        }
                        aria-label={label}
                        className="size-8 rounded-lg border border-black/15 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={config[field]}
                        onChange={(e) =>
                          update({
                            presetId: 'custom',
                            [field]: e.target.value,
                            ...(isBg ? { useCustomBgSolid: true } : {}),
                          } as Partial<UiCustomConfig>)
                        }
                        className="w-20 h-8 px-2 rounded-lg border border-[var(--bw-line)] bg-white dark:bg-[#0d1219] font-mono text-[11px] text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'fonts' && (
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[#119c78]">
                  Font Type / Family
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {(
                    [
                      ['jakarta', 'Betterway Luxury Sans (Plus Jakarta + Instrument)'],
                      ['system', 'Clean Executive System Sans (Segoe / SF Pro)'],
                      ['serif', 'Editorial Private-Banking Serif (Georgia / Cambria)'],
                      ['geometric', 'Modern Geometric Display'],
                      ['mono', 'Precision Quant / Financial Monospace'],
                      ['arabic', 'Bilingual Arabic + English (Noto Sans Arabic)'],
                    ] as Array<[FontFamilyChoice, string]>
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => update({ fontFamily: id })}
                      className={`px-3.5 py-2.5 rounded-xl border text-start font-bold cursor-pointer flex items-center justify-between ${
                        config.fontFamily === id
                          ? 'bg-[#090d13] text-[#34f0bc] border-[#22e2ad]'
                          : 'bg-white dark:bg-[#111722] border-[var(--bw-line)] text-slate-800 dark:text-slate-100 hover:border-[#119c78]'
                      }`}
                    >
                      <span>{label}</span>
                      {config.fontFamily === id && <Check size={14} />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[var(--bw-line)]">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[#119c78]">
                    Font Size Scale
                  </span>
                  <span className="font-mono font-extrabold text-slate-900 dark:text-white">{config.fontSizePct}%</span>
                </div>
                <input
                  type="range"
                  min={88}
                  max={124}
                  step={2}
                  value={config.fontSizePct}
                  onChange={(e) => update({ fontSizePct: Number(e.target.value) })}
                  className="w-full accent-[#119c78] cursor-pointer"
                />
                <div className="flex justify-between gap-1.5">
                  {[
                    ['Compact', 92],
                    ['Default', 100],
                    ['Comfort', 108],
                    ['Large', 116],
                  ].map(([lbl, pct]) => (
                    <button
                      key={String(lbl)}
                      type="button"
                      onClick={() => update({ fontSizePct: Number(pct) })}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer ${
                        config.fontSizePct === pct
                          ? 'bg-[#090d13] text-[#34f0bc] border-[#22e2ad]'
                          : 'bg-white dark:bg-[#111722] border-[var(--bw-line)]'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[var(--bw-line)]">
                <div className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[#119c78]">
                  Font Style &amp; Weight
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      ['normal', 'Standard'],
                      ['bold-clarity', 'Bold Clarity'],
                      ['italic-headings', 'Italic Titles'],
                    ] as Array<[FontStyleChoice, string]>
                  ).map(([st, lbl]) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => update({ fontStyle: st })}
                      className={`py-2 px-2 rounded-xl border font-bold text-[11px] cursor-pointer ${
                        config.fontStyle === st
                          ? 'bg-[#090d13] text-[#fbe8a4] border-[#d9b356]'
                          : 'bg-white dark:bg-[#111722] border-[var(--bw-line)]'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[var(--bw-line)]">
                <div className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[#119c78]">
                  Letter Spacing
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['tight', 'normal', 'wide'] as const).map((ls) => (
                    <button
                      key={ls}
                      type="button"
                      onClick={() => update({ letterSpacing: ls })}
                      className={`py-2 rounded-xl border font-bold capitalize cursor-pointer ${
                        config.letterSpacing === ls
                          ? 'bg-[#090d13] text-[#34f0bc] border-[#22e2ad]'
                          : 'bg-white dark:bg-[#111722] border-[var(--bw-line)]'
                      }`}
                    >
                      {ls}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'highlight' && (
            <div className="space-y-5">
              {/* Highlight Feature Toggle */}
              <div className="p-4 rounded-2xl bg-[#090d13] text-white border border-[#22e2ad]/40 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-display font-extrabold text-sm flex items-center gap-1.5 text-[#34f0bc]">
                      <Sparkles size={15} className="text-[#fbe8a4]" /> Highlight Feature Mode
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Luminous border &amp; spotlight emphasis on pinned apps, live numbers, and key actions across the entire OS.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => update({ highlightEnabled: !config.highlightEnabled })}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold cursor-pointer transition shrink-0 ${
                      config.highlightEnabled ? 'bg-[#22e2ad] text-[#070e1a]' : 'bg-white/15 text-slate-200'
                    }`}
                  >
                    {config.highlightEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {(
                    [
                      ['emerald-glow', 'Emerald Glow'],
                      ['gold-ring', 'Royal Gold Ring'],
                      ['spotlight', 'Luminous Spotlight'],
                      ['high-contrast', 'High-Contrast Focus'],
                    ] as Array<[HighlightStyleChoice, string]>
                  ).map(([st, lbl]) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => update({ highlightEnabled: true, highlightStyle: st })}
                      className={`py-2 px-3 rounded-xl text-[11px] font-bold border cursor-pointer transition ${
                        config.highlightEnabled && config.highlightStyle === st
                          ? 'bg-[#fbe8a4] text-[#070e1a] border-[#fbe8a4]'
                          : 'bg-white/8 text-slate-200 border-white/15 hover:bg-white/16'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Roundness Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[#119c78] flex items-center gap-1.5">
                    <Sliders size={13} /> Card Corner Radius
                  </span>
                  <span className="font-mono font-extrabold">{config.cardRadiusPx}px</span>
                </div>
                <input
                  type="range"
                  min={8}
                  max={28}
                  step={2}
                  value={config.cardRadiusPx}
                  onChange={(e) => update({ cardRadiusPx: Number(e.target.value) })}
                  className="w-full accent-[#119c78] cursor-pointer"
                />
              </div>

              {/* Card Density */}
              <div className="space-y-2 pt-2 border-t border-[var(--bw-line)]">
                <div className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[#119c78]">
                  Card Spacing &amp; Size Density
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['compact', 'balanced', 'spacious'] as DensityChoice[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => update({ density: d })}
                      className={`py-2 rounded-xl border font-bold capitalize cursor-pointer ${
                        config.density === d
                          ? 'bg-[#090d13] text-[#34f0bc] border-[#22e2ad]'
                          : 'bg-white dark:bg-[#111722] border-[var(--bw-line)]'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'pins' && (
            <div className="space-y-5">
              {/* Floating Draggable Pinned Options Widget Control */}
              <div className="p-4 rounded-2xl bg-[#090d13] text-white border border-[#d9b356]/40 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-display font-extrabold text-sm text-[#fbe8a4] flex items-center gap-1.5">
                      <Pin size={14} /> Floating Draggable Quick Bar
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Pin important options and drag the floating bar anywhere on your screen.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => update({ dockMode: config.dockMode === 'floating' ? 'hidden' : 'floating' })}
                    className={`px-3 py-1.5 rounded-full text-xs font-extrabold cursor-pointer shrink-0 ${
                      config.dockMode === 'floating' ? 'bg-[#22e2ad] text-[#070e1a]' : 'bg-white/15 text-slate-200'
                    }`}
                  >
                    {config.dockMode === 'floating' ? 'VISIBLE' : 'SHOW'}
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {ALL_QUICK_SHORTCUTS.map((sc) => {
                    const active = config.pinnedShortcuts.some((x) => x.id === sc.id);
                    return (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => toggleShortcut(sc.id)}
                        className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold inline-flex items-center gap-1 cursor-pointer transition ${
                          active
                            ? 'bg-[#22e2ad] text-[#070e1a]'
                            : 'bg-white/10 text-slate-200 hover:bg-white/20 border border-white/10'
                        }`}
                      >
                        <Pin size={10} /> {sc.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Drag & Pin Order for Applications Grid */}
              <div className="space-y-2">
                <div className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[#119c78]">
                  Pin &amp; Drag Apps Order (Also Draggable Directly on Home!)
                </div>
                <p className="text-[11px] text-[var(--bw-muted)]">
                  Drag rows or use arrows to reorder your 4-column apps grid. Pinned apps glow &amp; sit in your Pinned Strip.
                </p>
                <div className="space-y-1.5 max-h-[340px] overflow-y-auto pe-1">
                  {orderedKeys.map((key) => {
                    const pinned = config.pinnedAppKeys.includes(key);
                    return (
                      <div
                        key={key}
                        draggable
                        onDragStart={() => setDragKey(key)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => dropAppOn(key)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing ${
                          pinned
                            ? 'bg-[#fdf4dc]/70 dark:bg-[#221b0d] border-[#d9b356]'
                            : 'bg-white dark:bg-[#111722] border-[var(--bw-line)]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <GripVertical size={14} className="text-[var(--bw-muted)] shrink-0" />
                          <span className="font-bold truncate text-slate-900 dark:text-white">
                            {APP_LABEL_MAP[key] || key}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => moveApp(key, -1)}
                            className="size-6 rounded-lg hover:bg-black/10 flex items-center justify-center cursor-pointer"
                            title="Move up"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveApp(key, 1)}
                            className="size-6 rounded-lg hover:bg-black/10 flex items-center justify-center cursor-pointer"
                            title="Move down"
                          >
                            <ArrowDown size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => togglePinApp(key)}
                            className={`size-7 rounded-lg flex items-center justify-center cursor-pointer ${
                              pinned ? 'bg-[#090d13] text-[#fbe8a4]' : 'hover:bg-black/10 text-slate-500'
                            }`}
                            title={pinned ? 'Unpin app' : 'Pin app'}
                          >
                            {pinned ? <PinOff size={12} /> : <Pin size={12} />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Confirm */}
        <div className="px-5 py-3 border-t border-[var(--bw-line)] bg-[#fffcf4] dark:bg-[#080c12] flex items-center justify-between text-[11px]">
          <span className="text-[var(--bw-muted)] font-semibold">Saved automatically for this browser</span>
          <button type="button" onClick={onClose} className="bw-btn bw-btn-obsidian text-xs py-1.5 min-h-[34px] px-4">
            Done
          </button>
        </div>
      </aside>
    </div>
  );
}

/**
 * Floating Draggable Pinned Options Dock — users can grab the handle & drag it anywhere on screen!
 */
export function FloatingPinnedDock({
  config,
  onChange,
  onOpenCustomizer,
}: {
  config: UiCustomConfig;
  onChange: (next: UiCustomConfig) => void;
  onOpenCustomizer: () => void;
}) {
  const dockRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ dx: 0, dy: 0 });

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      const vw = Math.max(320, window.innerWidth);
      const vh = Math.max(320, window.innerHeight);
      const nx = Math.max(1, Math.min(82, ((e.clientX - dragOffset.current.dx) / vw) * 100));
      const ny = Math.max(8, Math.min(90, ((e.clientY - dragOffset.current.dy) / vh) * 100));
      onChange({ ...config, dockPos: { x: Math.round(nx), y: Math.round(ny) } });
    };
    const onUp = () => setDragging(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragging, config, onChange]);

  if (config.dockMode !== 'floating' || config.pinnedShortcuts.length === 0) return null;

  return (
    <div
      ref={dockRef}
      style={{ left: `${config.dockPos.x}%`, top: `${config.dockPos.y}%` }}
      className="fixed z-[65] no-print flex items-center gap-1.5 px-2.5 py-2 rounded-full bg-[#090d13]/95 backdrop-blur-xl text-white border border-[#22e2ad]/45 shadow-2xl max-w-[92vw] overflow-x-auto"
      aria-label="Pinned Quick Options Dock"
    >
      <button
        type="button"
        onPointerDown={(e) => {
          const rect = dockRef.current?.getBoundingClientRect();
          if (rect) {
            dragOffset.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
          }
          setDragging(true);
        }}
        className="size-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-grab active:cursor-grabbing shrink-0 text-[#fbe8a4]"
        title="Drag pinned bar anywhere on screen"
        aria-label="Drag pinned bar"
      >
        <GripHorizontal size={14} />
      </button>

      {config.pinnedShortcuts.map((sc) => {
        const isApi = sc.href.startsWith('/api/');
        const cls =
          'px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap bg-white/10 hover:bg-[#22e2ad] hover:text-[#070e1a] transition shrink-0';
        return isApi ? (
          <a key={sc.id} href={sc.href} className={cls}>
            {sc.label}
          </a>
        ) : (
          <Link key={sc.id} href={sc.href} className={cls}>
            {sc.label}
          </Link>
        );
      })}

      <button
        type="button"
        onClick={onOpenCustomizer}
        className="size-7 rounded-full bg-white/10 hover:bg-white/20 text-[#34f0bc] flex items-center justify-center cursor-pointer shrink-0"
        title="Customise pinned bar"
      >
        <Palette size={13} />
      </button>
      <button
        type="button"
        onClick={() => onChange({ ...config, dockMode: 'hidden' })}
        className="size-6 rounded-full hover:bg-white/15 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer shrink-0"
        title="Hide floating dock"
      >
        <X size={12} />
      </button>
    </div>
  );
}

export { DEFAULT_UI_CONFIG };
