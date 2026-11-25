import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch, getStoredToken, setStoredToken } from './api';

export interface SessionUser {
  id: string;
  emp_code: string;
  slug: string;
  name: string;
  name_ar: string;
  email: string;
  phone: string;
  role: string;
  tier: string;
  designation: string;
  department: string;
  avatar: string | null;
  portrait: string | null;
  initials: string;
  is_elevated: number;
  can_approve_deletions: number;
  can_approve_payouts: number;
  can_lock_wifi: number;
  can_print_qr: number;
  can_approve_rates: number;
  monthly_target_aed: number;
}

export interface ToastItem {
  id: number;
  message: string;
  tone: 'ok' | 'err' | 'info';
}

interface AuthContextValue {
  user: SessionUser | null;
  staff: any[];
  loading: boolean;
  dark: boolean;
  rtl: boolean;
  toggleDark: () => void;
  toggleRtl: () => void;
  login: (email: string, password: string) => Promise<void>;
  quickRoleLogin: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  toast: (message: string, tone?: 'ok' | 'err' | 'info') => void;
  toasts: ToastItem[];
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem('bw.theme') === 'dark';
    } catch {
      return false;
    }
  });
  const [rtl, setRtl] = useState(() => {
    try {
      return localStorage.getItem('bw.dir') === 'rtl';
    } catch {
      return false;
    }
  });
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem('bw.theme', dark ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
  }, [dark]);

  useEffect(() => {
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
    document.documentElement.lang = rtl ? 'ar' : 'en';
    try {
      localStorage.setItem('bw.dir', rtl ? 'rtl' : 'ltr');
    } catch {
      /* ignore */
    }
  }, [rtl]);

  const toast = useCallback((message: string, tone: 'ok' | 'err' | 'info' = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4200);
  }, []);

  const hydrate = useCallback(async () => {
    if (!getStoredToken()) {
      setLoading(false);
      return;
    }
    try {
      const data = await apiFetch<{ user: SessionUser; staff: any[] }>('/api/auth/me');
      setUser(data.user);
      setStaff(data.staff || []);
    } catch {
      setStoredToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const login = async (email: string, password: string) => {
    const data = await apiFetch<{ token: string; user: SessionUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(data.token);
    setUser(data.user);
    const me = await apiFetch<{ staff: any[] }>('/api/auth/me');
    setStaff(me.staff || []);
    toast(`Welcome back, ${data.user.name}`);
  };

  const quickRoleLogin = async (email: string) => {
    const data = await apiFetch<{ token: string; user: SessionUser }>('/api/auth/quick-role', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    setStoredToken(data.token);
    setUser(data.user);
    const me = await apiFetch<{ staff: any[] }>('/api/auth/me');
    setStaff(me.staff || []);
    toast(`Signed in as ${data.user.name} (${data.user.designation})`);
  };

  const logout = async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setStoredToken(null);
    setUser(null);
    toast('Signed out of Betterway OS', 'info');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        staff,
        loading,
        dark,
        rtl,
        toggleDark: () => setDark((d) => !d),
        toggleRtl: () => setRtl((r) => !r),
        login,
        quickRoleLogin,
        logout,
        toast,
        toasts,
      }}
    >
      {children}
      {/* Floating Toast Stack */}
      <div className="fixed bottom-5 end-5 z-[180] flex flex-col gap-2 max-w-sm no-print">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-2xl shadow-2xl border text-sm font-medium backdrop-blur-md transition-all ${
              t.tone === 'err'
                ? 'bg-[#7f1d1d]/95 border-red-400/40 text-white'
                : t.tone === 'info'
                ? 'bg-[#0C1524]/95 border-[#D7B158]/40 text-white'
                : 'bg-[#0A4A3E]/95 border-[#34DFAC]/45 text-white'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
