'use client';

export type FontFamilyChoice =
  | 'jakarta'
  | 'system'
  | 'serif'
  | 'geometric'
  | 'mono'
  | 'arabic';

export type FontStyleChoice = 'normal' | 'italic-headings' | 'bold-clarity';
export type HighlightStyleChoice = 'emerald-glow' | 'gold-ring' | 'spotlight' | 'high-contrast';
export type DensityChoice = 'compact' | 'balanced' | 'spacious';
export type DockModeChoice = 'floating' | 'hidden';

export interface PinnedShortcutItem {
  id: string;
  label: string;
  href: string;
  accent?: 'emerald' | 'gold' | 'navy';
}

export interface UiCustomConfig {
  presetId: string;
  bgColor: string;
  useCustomBgSolid: boolean;
  cardBgColor: string;
  heroBgColor: string;
  textColor: string;
  mutedColor: string;
  highlightColor: string;
  goldColor: string;
  borderColor: string;
  fontFamily: FontFamilyChoice;
  fontSizePct: number; // 88 .. 125
  fontStyle: FontStyleChoice;
  letterSpacing: 'tight' | 'normal' | 'wide';
  cardRadiusPx: number; // 8 .. 28
  density: DensityChoice;
  highlightEnabled: boolean;
  highlightStyle: HighlightStyleChoice;
  pinnedAppKeys: string[];
  appOrder: string[];
  pinnedShortcuts: PinnedShortcutItem[];
  dockMode: DockModeChoice;
  dockPos: { x: number; y: number }; // percentage (0..85) or px offset from left/top
}

export const ALL_QUICK_SHORTCUTS: PinnedShortcutItem[] = [
  { id: 'sc-place', label: "Warda's / Shabib's Place", href: '/os/place', accent: 'gold' },
  { id: 'sc-corner', label: "Warda's / Shabib's Corner", href: '/os/corner', accent: 'navy' },
  { id: 'sc-proposal', label: '3-Bank Proposal Maker', href: '/os/mortgage-desk?tab=proposal', accent: 'emerald' },
  { id: 'sc-calcs', label: '12 UAE Calculators', href: '/os/calculators', accent: 'emerald' },
  { id: 'sc-matrix', label: '18-Bank 2026 Matrix', href: '/os/mortgage-desk?tab=matrix', accent: 'gold' },
  { id: 'sc-rms', label: '159 Direct Bank RMs', href: '/os/mortgage-desk?tab=rms', accent: 'emerald' },
  { id: 'sc-coord', label: 'Coordinator & Logins', href: '/os/coordinator', accent: 'navy' },
  { id: 'sc-pipeline', label: '12-Step Pipeline', href: '/os/pipeline', accent: 'emerald' },
  { id: 'sc-excel', label: 'Full 17-Sheet Excel', href: '/api/v1/utilities/master-backup-excel', accent: 'gold' },
  { id: 'sc-matrix-dl', label: '2026 Matrix (.xlsx)', href: '/api/v1/utilities/bank-matrix-excel', accent: 'emerald' },
  { id: 'sc-qr', label: 'Oud Metha QR Check-In', href: '/os/employees', accent: 'navy' },
  { id: 'sc-gps', label: 'Field GPS + SOS', href: '/os/field-gps', accent: 'emerald' },
  { id: 'sc-crm', label: 'Daily Leads (CRM)', href: '/os/crm', accent: 'navy' },
];

export const DEFAULT_APP_ORDER: string[] = [
  'place',
  'corner',
  'command-center',
  'dashboard',
  'master-log',
  'pipeline',
  'coordinator',
  'crm',
  'mortgage-desk',
  'calculators',
  'sales',
  'vault',
  'accounts',
  'compliance',
  'website-studio',
  'employees',
  'inside',
  'field-gps',
  'ai',
  'utilities',
  'settings',
];

export const DEFAULT_UI_CONFIG: UiCustomConfig = {
  presetId: 'beige-obsidian',
  bgColor: '#fbf6e6',
  useCustomBgSolid: false,
  cardBgColor: '#ffffff',
  heroBgColor: '#090d14',
  textColor: '#090d12',
  mutedColor: '#595547',
  highlightColor: '#119c78',
  goldColor: '#d9b356',
  borderColor: '#e5d8b8',
  fontFamily: 'jakarta',
  fontSizePct: 100,
  fontStyle: 'normal',
  letterSpacing: 'normal',
  cardRadiusPx: 20,
  density: 'balanced',
  highlightEnabled: false,
  highlightStyle: 'emerald-glow',
  pinnedAppKeys: ['place', 'corner', 'mortgage-desk', 'coordinator'],
  appOrder: DEFAULT_APP_ORDER,
  pinnedShortcuts: [
    ALL_QUICK_SHORTCUTS[2], // 3-Bank Proposal Maker
    ALL_QUICK_SHORTCUTS[3], // 18-Bank 2026 Matrix
    ALL_QUICK_SHORTCUTS[5], // Coordinator & Logins
    ALL_QUICK_SHORTCUTS[7], // Full 17-Sheet Excel
  ],
  dockMode: 'hidden',
  dockPos: { x: 24, y: 82 },
};

export interface UiPreset {
  id: string;
  name: string;
  swatch: [string, string, string];
  patch: Partial<UiCustomConfig>;
}

export const UI_PRESETS: UiPreset[] = [
  {
    id: 'beige-obsidian',
    name: 'Beige-Yellow & Shining Black',
    swatch: ['#fbf6e6', '#090d14', '#119c78'],
    patch: {
      bgColor: '#fbf6e6',
      useCustomBgSolid: false,
      cardBgColor: '#ffffff',
      heroBgColor: '#090d14',
      textColor: '#090d12',
      mutedColor: '#595547',
      highlightColor: '#119c78',
      goldColor: '#d9b356',
      borderColor: '#e5d8b8',
    },
  },
  {
    id: 'gallery-white',
    name: 'Pure White & Obsidian',
    swatch: ['#ffffff', '#080b10', '#22e2ad'],
    patch: {
      bgColor: '#ffffff',
      useCustomBgSolid: true,
      cardBgColor: '#ffffff',
      heroBgColor: '#080b10',
      textColor: '#090d12',
      mutedColor: '#586573',
      highlightColor: '#119c78',
      goldColor: '#d9b356',
      borderColor: '#e4e9ef',
    },
  },
  {
    id: 'champagne-gold',
    name: 'Royal Champagne Gold',
    swatch: ['#f7ecd0', '#161108', '#c6972c'],
    patch: {
      bgColor: '#f7ecd0',
      useCustomBgSolid: true,
      cardBgColor: '#fffdf7',
      heroBgColor: '#141008',
      textColor: '#1c1507',
      mutedColor: '#695a3a',
      highlightColor: '#b5841d',
      goldColor: '#e0b74f',
      borderColor: '#e4d1a0',
    },
  },
  {
    id: 'emerald-mint',
    name: 'Betterway Emerald Mint',
    swatch: ['#eef9f5', '#053b2e', '#119c78'],
    patch: {
      bgColor: '#eef9f5',
      useCustomBgSolid: true,
      cardBgColor: '#ffffff',
      heroBgColor: '#052b22',
      textColor: '#06201a',
      mutedColor: '#3f6359',
      highlightColor: '#0e8d6c',
      goldColor: '#d9b356',
      borderColor: '#cbe9de',
    },
  },
  {
    id: 'midnight-pro',
    name: 'Midnight Obsidian Pro',
    swatch: ['#070a10', '#121824', '#34f0bc'],
    patch: {
      bgColor: '#070a10',
      useCustomBgSolid: true,
      cardBgColor: '#111722',
      heroBgColor: '#05070b',
      textColor: '#f8fafc',
      mutedColor: '#94a3b8',
      highlightColor: '#22e2ad',
      goldColor: '#fbe8a4',
      borderColor: '#223044',
    },
  },
  {
    id: 'pearl-blue',
    name: 'Dubai DIFC Slate Blue',
    swatch: ['#f1f5fa', '#0d192b', '#0284c7'],
    patch: {
      bgColor: '#f1f5fa',
      useCustomBgSolid: true,
      cardBgColor: '#ffffff',
      heroBgColor: '#0b1628',
      textColor: '#0f172a',
      mutedColor: '#475569',
      highlightColor: '#0284c7',
      goldColor: '#d9b356',
      borderColor: '#d7e2f0',
    },
  },
];

const STORAGE_KEY = 'bw_customise_ui_v3';

export function loadUiCustomConfig(): UiCustomConfig {
  if (typeof window === 'undefined') return DEFAULT_UI_CONFIG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_UI_CONFIG;
    const parsed = JSON.parse(raw) as Partial<UiCustomConfig>;
    return {
      ...DEFAULT_UI_CONFIG,
      ...parsed,
      pinnedAppKeys: Array.isArray(parsed.pinnedAppKeys) ? parsed.pinnedAppKeys : DEFAULT_UI_CONFIG.pinnedAppKeys,
      appOrder: Array.isArray(parsed.appOrder) && parsed.appOrder.length > 0 ? parsed.appOrder : DEFAULT_UI_CONFIG.appOrder,
      pinnedShortcuts: Array.isArray(parsed.pinnedShortcuts) ? parsed.pinnedShortcuts : DEFAULT_UI_CONFIG.pinnedShortcuts,
      dockPos: parsed.dockPos && typeof parsed.dockPos.x === 'number' ? parsed.dockPos : DEFAULT_UI_CONFIG.dockPos,
    };
  } catch {
    return DEFAULT_UI_CONFIG;
  }
}

export function saveUiCustomConfig(cfg: UiCustomConfig): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch {
    /* ignore storage quota */
  }
}

const FONT_STACKS: Record<FontFamilyChoice, { sans: string; display: string }> = {
  jakarta: {
    sans: "'Instrument Sans', system-ui, -apple-system, sans-serif",
    display: "'Plus Jakarta Sans', 'Instrument Sans', system-ui, sans-serif",
  },
  system: {
    sans: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    display: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  },
  serif: {
    sans: "Georgia, 'Cambria', 'Times New Roman', serif",
    display: "Georgia, 'Cambria', 'Times New Roman', serif",
  },
  geometric: {
    sans: "'Trebuchet MS', 'Plus Jakarta Sans', 'Segoe UI', sans-serif",
    display: "'Trebuchet MS', 'Plus Jakarta Sans', sans-serif",
  },
  mono: {
    sans: "ui-monospace, 'Cascadia Code', Consolas, monospace",
    display: "ui-monospace, 'Cascadia Code', Consolas, monospace",
  },
  arabic: {
    sans: "'Noto Sans Arabic', 'Instrument Sans', system-ui, sans-serif",
    display: "'Noto Sans Arabic', 'Plus Jakarta Sans', system-ui, sans-serif",
  },
};

export function applyUiCustomConfigToDom(cfg: UiCustomConfig): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const stack = FONT_STACKS[cfg.fontFamily] || FONT_STACKS.jakarta;

  root.style.setProperty('--bw-bg', cfg.bgColor);
  root.style.setProperty('--bw-card', cfg.cardBgColor);
  root.style.setProperty('--bw-obsidian-custom', cfg.heroBgColor);
  root.style.setProperty('--bw-ink', cfg.textColor);
  root.style.setProperty('--bw-body', cfg.textColor);
  root.style.setProperty('--bw-muted', cfg.mutedColor);
  root.style.setProperty('--bw-emerald', cfg.highlightColor);
  root.style.setProperty('--bw-gold', cfg.goldColor);
  root.style.setProperty('--bw-line', cfg.borderColor);
  root.style.setProperty('--font-sans', stack.sans);
  root.style.setProperty('--font-display', stack.display);
  root.style.setProperty('--bw-card-radius', `${cfg.cardRadiusPx}px`);
  root.style.fontSize = `${cfg.fontSizePct}%`;

  const ls = cfg.letterSpacing === 'tight' ? '-0.02em' : cfg.letterSpacing === 'wide' ? '0.03em' : '0em';
  root.style.setProperty('--bw-letter-spacing', ls);

  root.dataset.bwCustomBg = cfg.useCustomBgSolid ? 'solid' : 'default';
  root.dataset.bwFontStyle = cfg.fontStyle;
  root.dataset.bwDensity = cfg.density;
  root.dataset.bwHighlight = cfg.highlightEnabled ? cfg.highlightStyle : 'off';
}
