'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { SessionUser } from '@/lib/domain/types';
import type { RoleCapabilities } from '@/lib/auth/rbac';
import { invalidateApiCache, markClientHydrated, prefetchApi, readCachedJson, writeCachedJson } from '@/lib/client-cache';
import {
  applyUiCustomConfigToDom,
  DEFAULT_UI_CONFIG,
  loadUiCustomConfig,
  saveUiCustomConfig,
  type UiCustomConfig,
} from '@/lib/ui-customizer';
import { CustomiseUiDrawer, FloatingPinnedDock } from './CustomiseUiDrawer';
import { SipSoftphoneDock } from './SipSoftphoneDock';

interface ToastItem {
  id: string;
  text: string;
  tone: 'ok' | 'err' | 'info';
}

interface DemoAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  designation: string;
  department: string;
  avatarUrl: string | null;
  portraitUrl: string | null;
  initials: string;
}

interface AuthMePayload {
  user: SessionUser | null;
  capabilities: RoleCapabilities | null;
  demoMode: boolean;
  demoAccounts: DemoAccount[];
}

interface OsContextValue {
  user: SessionUser | null;
  capabilities: RoleCapabilities | null;
  demoMode: boolean;
  demoAccounts: DemoAccount[];
  loading: boolean;
  dark: boolean;
  rtl: boolean;
  toggleDark: () => void;
  toggleRtl: () => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  switchDemoAccount: (email: string) => Promise<void>;
  toast: (text: string, tone?: 'ok' | 'err' | 'info') => void;
  uiConfig: UiCustomConfig;
  setUiConfig: (next: UiCustomConfig) => void;
  resetUiConfig: () => void;
  customizerOpen: boolean;
  setCustomizerOpen: (open: boolean) => void;
}

const OsContext = createContext<OsContextValue | null>(null);

export function OsProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [capabilities, setCapabilities] = useState<RoleCapabilities | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dark, setDark] = useState(false);
  const [rtl, setRtl] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [uiConfig, setUiConfigState] = useState<UiCustomConfig>(DEFAULT_UI_CONFIG);
  const [customizerOpen, setCustomizerOpen] = useState(false);

  const setUiConfig = useCallback((next: UiCustomConfig) => {
    setUiConfigState(next);
    saveUiCustomConfig(next);
    applyUiCustomConfigToDom(next);
  }, []);

  const resetUiConfig = useCallback(() => {
    setUiConfigState(DEFAULT_UI_CONFIG);
    saveUiCustomConfig(DEFAULT_UI_CONFIG);
    applyUiCustomConfigToDom(DEFAULT_UI_CONFIG);
  }, []);

  const toast = useCallback((text: string, tone: 'ok' | 'err' | 'info' = 'ok') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-3), { id, text, tone }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4200);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/auth/me', { cache: 'no-store' });
      const data = (await res.json()) as AuthMePayload;
      setUser(data.user ?? null);
      setCapabilities(data.capabilities ?? null);
      setDemoMode(Boolean(data.demoMode));
      setDemoAccounts(data.demoAccounts ?? []);
      if (data.user) {
        writeCachedJson('/api/v1/auth/me', data);
        // Zero-loading background warm-up of primary workspaces
        prefetchApi('/api/v1/dashboard/overview');
        prefetchApi('/api/v1/mortgage-desk');
        if (data.user.isOwner) {
          prefetchApi('/api/v1/executive/overview');
        }
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    markClientHydrated();
    const savedUi = loadUiCustomConfig();
    setUiConfigState(savedUi);
    applyUiCustomConfigToDom(savedUi);
    const cached = readCachedJson<AuthMePayload>('/api/v1/auth/me', 300_000);
    if (cached?.user) {
      setUser(cached.user);
      setCapabilities(cached.capabilities ?? null);
      setDemoMode(Boolean(cached.demoMode));
      setDemoAccounts(cached.demoAccounts ?? []);
      setLoading(false);
    }
    void refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  useEffect(() => {
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
  }, [rtl]);

  const logout = useCallback(async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST' });
    invalidateApiCache();
    setUser(null);
    window.location.href = '/login';
  }, []);

  const switchDemoAccount = useCallback(
    async (email: string) => {
      const res = await fetch('/api/v1/auth/demo-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast(err.error || 'Unable to switch role', 'err');
        return;
      }
      invalidateApiCache();
      await refreshUser();
      toast(`Switched workspace to ${email}`);
      window.location.href = '/os';
    },
    [refreshUser, toast],
  );

  return (
    <OsContext.Provider
      value={{
        user,
        capabilities,
        demoMode,
        demoAccounts,
        loading,
        dark,
        rtl,
        toggleDark: () => setDark((v) => !v),
        toggleRtl: () => setRtl((v) => !v),
        refreshUser,
        logout,
        switchDemoAccount,
        toast,
        uiConfig,
        setUiConfig,
        resetUiConfig,
        customizerOpen,
        setCustomizerOpen,
      }}
    >
      {children}
      <SipSoftphoneDock user={user} />
      <FloatingPinnedDock
        config={uiConfig}
        onChange={setUiConfig}
        onOpenCustomizer={() => setCustomizerOpen(true)}
      />
      <CustomiseUiDrawer
        open={customizerOpen}
        onClose={() => setCustomizerOpen(false)}
        config={uiConfig}
        onChange={setUiConfig}
        onReset={() => {
          resetUiConfig();
          toast('UI theme & layout reset to Betterway default');
        }}
      />
      <div className="fixed bottom-32 sm:bottom-16 end-5 z-[90] flex flex-col gap-2 max-w-sm no-print">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-2xl text-xs font-bold shadow-2xl border backdrop-blur-xl ${
              t.tone === 'err'
                ? 'bg-[#1f0910]/95 text-[#ffc5cf] border-[#e11d48]/50'
                : t.tone === 'info'
                  ? 'bg-[#090d13]/95 text-[#fbe8a4] border-[#d9b356]/50'
                  : 'bg-[#090d13]/95 text-[#34f0bc] border-[#22e2ad]/50'
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </OsContext.Provider>
  );
}

export function useOs() {
  const ctx = useContext(OsContext);
  if (!ctx) throw new Error('useOs must be used inside OsProvider');
  return ctx;
}
