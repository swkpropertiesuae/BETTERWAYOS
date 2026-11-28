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
  { id: 'sc-inside', label: 'Betterway Inside', href: '/os/inside', accent: 'emerald' },
  { id: 'sc-sip', label: 'SIP Call Desk', href: '/os/sip-calls', accent: 'gold' },
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
  'sip-calls',
  'field-gps',
  'ai',
  'utilities',
  'settings',
];

export const DEFAULT_UI_CONFIG: UiCustomConfig = {
  presetId: 'sovereign-corporate',
  bgColor: '#f3f5f8',
  useCustomBgSolid: false,
  cardBgColor: '#ffffff',
  heroBgColor: '#0b192c',
  textColor: '#0b192c',
  mutedColor: '#5a6b82',
  highlightColor: '#0e5a49',
  goldColor: '#c49a45',
  borderColor: '#d6dee8',
  fontFamily: 'jakarta',
  fontSizePct: 100,
  fontStyle: 'normal',
  letterSpacing: 'normal',
  cardRadiusPx: 20,
  density: 'balanced',
  highlightEnabled: false,
  highlightStyle: 'gold-ring',
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
    id: 'sovereign-corporate',
    name: 'Sovereign Navy & Platinum',
    swatch: ['#f3f5f8', '#0b192c', '#0e5a49'],
    patch: {
      bgColor: '#f3f5f8',
      useCustomBgSolid: false,
      cardBgColor: '#ffffff',
      heroBgColor: '#0b192c',
      textColor: '#0b192c',
      mutedColor: '#5a6b82',
      highlightColor: '#0e5a49',
      goldColor: '#c49a45',
      borderColor: '#d6dee8',
    },
  },
  {
    id: 'swiss-gallery',
    name: 'Swiss White & Oxford Navy',
    swatch: ['#ffffff', '#0c1c33', '#1d3d63'],
    patch: {
      bgColor: '#ffffff',
      useCustomBgSolid: true,
      cardBgColor: '#ffffff',
      heroBgColor: '#0c1c33',
      textColor: '#0b192c',
      mutedColor: '#55657a',
      highlightColor: '#1d3d63',
      goldColor: '#b88e3a',
      borderColor: '#dde4ee',
    },
  },
  {
    id: 'mayfair-limestone',
    name: 'Mayfair Limestone & Pine',
    swatch: ['#f5f3ee', '#0d3b31', '#967028'],
    patch: {
      bgColor: '#f5f3ee',
      useCustomBgSolid: true,
      cardBgColor: '#ffffff',
      heroBgColor: '#0d3b31',
      textColor: '#161f1d',
      mutedColor: '#5c6662',
      highlightColor: '#0e5243',
      goldColor: '#967028',
      borderColor: '#dfd9cc',
    },
  },
  {
    id: 'geneva-bronze',
    name: 'Geneva Slate & Bronze',
    swatch: ['#eef2f6', '#132236', '#a67c2e'],
    patch: {
      bgColor: '#eef2f6',
      useCustomBgSolid: true,
      cardBgColor: '#ffffff',
      heroBgColor: '#132236',
      textColor: '#0f1c2e',
      mutedColor: '#56677d',
      highlightColor: '#8f6922',
      goldColor: '#c49a45',
      borderColor: '#d4dce6',
    },
  },
  {
    id: 'difc-midnight',
    name: 'DIFC Midnight Sovereign',
    swatch: ['#070e1a', '#0e1a2b', '#64c4a8'],
    patch: {
      bgColor: '#070e1a',
      useCustomBgSolid: true,
      cardBgColor: '#0e1a2b',
      heroBgColor: '#081221',
      textColor: '#f4f7fb',
      mutedColor: '#8fa1b8',
      highlightColor: '#64c4a8',
      goldColor: '#dfc285',
      borderColor: '#1f3149',
    },
  },
  {
    id: 'private-reserve',
    name: 'Private Reserve Burgundy',
    swatch: ['#f4f5f7', '#0c1a2e', '#8b1e36'],
    patch: {
      bgColor: '#f4f5f7',
      useCustomBgSolid: true,
      cardBgColor: '#ffffff',
      heroBgColor: '#0c1a2e',
      textColor: '#0e1a2b',
      mutedColor: '#5b687a',
      highlightColor: '#8b1e36',
      goldColor: '#b88e3a',
      borderColor: '#d8dfe8',
    },
  },
];

const STORAGE_KEY = 'bw_customise_ui_v4';
const LEGACY_STORAGE_KEY = 'bw_customise_ui_v3';

export function loadUiCustomConfig(): UiCustomConfig {
  if (typeof window === 'undefined') return DEFAULT_UI_CONFIG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<UiCustomConfig>;
      return {
        ...DEFAULT_UI_CONFIG,
        ...parsed,
        pinnedAppKeys: Array.isArray(parsed.pinnedAppKeys) ? parsed.pinnedAppKeys : DEFAULT_UI_CONFIG.pinnedAppKeys,
        appOrder: Array.isArray(parsed.appOrder) && parsed.appOrder.length > 0 ? parsed.appOrder : DEFAULT_UI_CONFIG.appOrder,
        pinnedShortcuts: Array.isArray(parsed.pinnedShortcuts) ? parsed.pinnedShortcuts : DEFAULT_UI_CONFIG.pinnedShortcuts,
        dockPos: parsed.dockPos && typeof parsed.dockPos.x === 'number' ? parsed.dockPos : DEFAULT_UI_CONFIG.dockPos,
      };
    }
    // Preserve layout/pin/font preferences from v3 while upgrading to the new Sovereign Corporate color palette
    const legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw) as Partial<UiCustomConfig>;
      return {
        ...DEFAULT_UI_CONFIG,
        fontFamily: legacy.fontFamily ?? DEFAULT_UI_CONFIG.fontFamily,
        fontSizePct: legacy.fontSizePct ?? DEFAULT_UI_CONFIG.fontSizePct,
        fontStyle: legacy.fontStyle ?? DEFAULT_UI_CONFIG.fontStyle,
        letterSpacing: legacy.letterSpacing ?? DEFAULT_UI_CONFIG.letterSpacing,
        cardRadiusPx: legacy.cardRadiusPx ?? DEFAULT_UI_CONFIG.cardRadiusPx,
        density: legacy.density ?? DEFAULT_UI_CONFIG.density,
        pinnedAppKeys: Array.isArray(legacy.pinnedAppKeys) ? legacy.pinnedAppKeys : DEFAULT_UI_CONFIG.pinnedAppKeys,
        appOrder: Array.isArray(legacy.appOrder) && legacy.appOrder.length > 0 ? legacy.appOrder : DEFAULT_UI_CONFIG.appOrder,
        pinnedShortcuts: Array.isArray(legacy.pinnedShortcuts) ? legacy.pinnedShortcuts : DEFAULT_UI_CONFIG.pinnedShortcuts,
        dockMode: legacy.dockMode ?? DEFAULT_UI_CONFIG.dockMode,
        dockPos: legacy.dockPos && typeof legacy.dockPos.x === 'number' ? legacy.dockPos : DEFAULT_UI_CONFIG.dockPos,
      };
    }
    return DEFAULT_UI_CONFIG;
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
