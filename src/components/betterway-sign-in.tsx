'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  Home,
  KeyRound,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react';
import { StaffAvatar } from '@/components/staff-avatar';

type PortalTab = 'staff' | 'borrower' | 'partner';
type AuthAction = 'signin' | 'register';

export interface ActiveSessionBanner {
  fullName: string;
  email: string;
  role: string;
  homeHref: string;
}

export interface StaffPreviewItem {
  label: string;
  role: string;
  department: string;
  email: string;
  avatarUrl: string | null;
}

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;

function OrbitalBrandPanel() {
  const paths = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    width: 0.45 + i * 0.028,
    d: `M-${360 - i * 6} -${170 + i * 6}C-${360 - i * 6} -${170 + i * 6} -${290 - i * 6} ${210 - i * 6} ${
      160 - i * 6
    } ${335 - i * 6}C${610 - i * 6} ${460 - i * 6} ${680 - i * 6} ${860 - i * 6} ${680 - i * 6} ${860 - i * 6}`,
  }));

  return (
    <aside className="swk-login2-aside">
      <div className="swk-login2-fade" aria-hidden />
      <div className="pointer-events-none absolute inset-0 opacity-75" aria-hidden>
        <svg className="h-full w-full" style={{ color: '#d7b04e' }} fill="none" viewBox="0 0 696 316">
          {paths.map((p) => (
            <path
              key={p.id}
              d={p.d}
              stroke="currentColor"
              strokeOpacity={0.05 + p.id * 0.015}
              strokeWidth={p.width}
            />
          ))}
        </svg>
      </div>

      {/* Top brand lockup */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
        className="relative z-10 flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3.5">
          <img
            src="/brand/icon-gold-squircle-midnight.svg"
            alt="Betterway Mortgages LLC"
            className="h-12 w-12 rounded-xl border border-[#d7b04e]/45 shadow-lg"
          />
          <div>
            <div className="text-xl font-bold tracking-tight text-white">
              Betterway <span className="text-[#d7b04e]">Mortgages</span>
            </div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-slate-400">
              Corporate Operating System
            </div>
          </div>
        </div>
        <span className="rounded-full border border-[#d7b04e]/35 bg-white/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#f2dcb3]">
          Dubai · UAE
        </span>
      </motion.div>

      {/* Center 21st.dev-inspired spotlit orbital emblem */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.1, ease: EASE_OUT_EXPO }}
        className="relative z-10 my-auto py-8 flex flex-col items-center text-center"
      >
        <div className="relative flex items-center justify-center w-56 h-56">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 36, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border border-dashed border-[#d7b04e]/25"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-6 rounded-full border border-[#d7b04e]/30"
          />
          <div
            className="absolute inset-12 rounded-full blur-2xl"
            style={{ background: 'radial-gradient(circle, rgba(215,176,78,0.28), transparent 72%)' }}
          />
          <div className="relative flex flex-col items-center justify-center w-28 h-28 rounded-3xl bg-[#041933]/90 border border-[#d7b04e]/55 shadow-2xl">
            <img
              src="/brand/icon-gold-squircle-midnight.svg"
              alt="Betterway Emblem"
              className="w-16 h-16 rounded-2xl"
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2.5 w-full max-w-md text-left">
          {[
            { k: '24 UAE Banks', v: 'CBUAE 50% DBR' },
            { k: 'AES-256-GCM', v: 'Encrypted Vault' },
            { k: 'FTA & MOHRE', v: 'VAT · WPS · DLD' },
          ].map((pill) => (
            <div
              key={pill.k}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 backdrop-blur-xs"
            >
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#d7b04e]">
                {pill.k}
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">{pill.v}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Bottom editorial quote */}
      <motion.figure
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.18, ease: EASE_OUT_EXPO }}
        className="swk-login2-quote"
      >
        <blockquote>
          Every enquiry, 24-bank underwriting and DLD transfer in one place,{' '}
          <em>from first call to disbursal</em>.
        </blockquote>
        <figcaption>
          Betterway Mortgages LLC <span aria-hidden>|</span> Owner Governance: Shabib Siraj
        </figcaption>
      </motion.figure>
    </aside>
  );
}

export function BetterwaySignIn({
  initialTab = 'staff',
  initialError,
  activeSession,
  staffPreview,
}: {
  initialTab?: PortalTab;
  initialError?: string;
  activeSession?: ActiveSessionBanner | null;
  staffPreview: StaffPreviewItem[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<PortalTab>(initialTab);
  const [action, setAction] = useState<AuthAction>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [otp, setOtp] = useState('');
  const [needsTotp, setNeedsTotp] = useState(false);

  // Registration fields (Borrower & RERA Partner)
  const [fullNameEn, setFullNameEn] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [reraOrn, setReraOrn] = useState('');
  const [reraBrn, setReraBrn] = useState('');
  const [residencyType, setResidencyType] = useState('EXPAT_RESIDENT');
  const [communityName, setCommunityName] = useState('Dubai Hills Estate');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(initialError || null);

  const tabs: { id: PortalTab; label: string; icon: typeof ShieldCheck }[] = [
    { id: 'staff', label: 'Staff OS', icon: ShieldCheck },
    { id: 'borrower', label: 'Client Portal', icon: Home },
    { id: 'partner', label: 'RERA Partner', icon: Building2 },
  ];

  const switchTab = (next: PortalTab) => {
    setTab(next);
    setAction('signin');
    setError(null);
    setNeedsTotp(false);
    setOtp('');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const payload: Record<string, unknown> =
        action === 'signin' || tab === 'staff'
          ? { mode: 'login', email: email.trim(), password, otp: otp.trim() || undefined }
          : tab === 'borrower'
            ? {
                mode: 'register_borrower',
                fullNameEn: fullNameEn.trim(),
                email: email.trim(),
                phone: phone.trim(),
                password,
                residencyType,
                communityName,
              }
            : {
                mode: 'register_partner',
                companyName: companyName.trim(),
                reraOrn: reraOrn.trim(),
                reraBrn: reraBrn.trim(),
                fullNameEn: fullNameEn.trim(),
                email: email.trim(),
                phone: phone.trim(),
                password,
                isAgencyAdmin: false,
              };

      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.needsTotp) setNeedsTotp(true);
        setError(data.error || 'Authentication failed. Please check your credentials.');
        return;
      }

      router.push(data.redirectTo || '/os');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach Betterway OS authentication service.');
    } finally {
      setBusy(false);
    }
  };

  const headingByTab: Record<PortalTab, { title: string; sub: string }> = {
    staff: {
      title: 'Welcome back.',
      sub: 'Sign in with your Betterway Mortgages LLC staff credentials.',
    },
    borrower: {
      title: action === 'register' ? 'Open your Client Portal.' : 'Borrower Client Portal.',
      sub:
        action === 'register'
          ? 'Create an encrypted household file to upload KYC documents and track your CBUAE pre-approval.'
          : 'Track your 24-bank pre-approval, sign your CBUAE KFS, and upload documents safely.',
    },
    partner: {
      title: action === 'register' ? 'Register RERA Partner Access.' : 'RERA Partner Hub.',
      sub:
        action === 'register'
          ? 'Register your RERA ORN/BRN to refer buyers, issue 60-day AIP certificates, and track commissions.'
          : 'Submit buyer referrals under 100% non-circumvention protection and monitor transfer milestones.',
    },
  };

  return (
    <div className="swk-login2">
      <OrbitalBrandPanel />

      <main className="swk-login2-main">
        <div className="swk-login2-glow" aria-hidden />
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
          className="swk-login2-panel"
        >
          {/* Mobile & Compact Brand Header */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <img
                src="/brand/icon-gold-squircle-midnight.svg"
                alt="Betterway Mortgages"
                className="h-10 w-10 rounded-xl border border-[#021125]/15 shadow-xs"
              />
              <div>
                <div className="text-base font-bold tracking-tight text-[#021125]">
                  Betterway <span className="text-[#8a6518] font-mono">OS</span>
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#64748b]">
                  Betterway Mortgages LLC · Dubai
                </div>
              </div>
            </div>
            <Link
              href="/fintechx"
              className="text-[11px] font-semibold text-[#4a5868] hover:text-[#021125] underline underline-offset-4"
            >
              Platform Overview
            </Link>
          </div>

          {/* 3-Portal Morphing Pill Tabs */}
          <div
            role="tablist"
            aria-label="Portal selection"
            className="grid grid-cols-3 gap-1 rounded-full bg-[#f1f5f9] p-1 border border-[#e2e6ea] mb-6"
          >
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => switchTab(t.id)}
                  className={`relative flex items-center justify-center gap-1.5 rounded-full py-2 px-2 text-xs font-semibold transition cursor-pointer ${
                    active ? 'text-white' : 'text-[#4a5868] hover:text-[#021125]'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="bw-login-tab-pill"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      className="absolute inset-0 rounded-full bg-[#021125] shadow-xs"
                    />
                  )}
                  <Icon size={13} className="relative z-10" />
                  <span className="relative z-10 truncate">{t.label}</span>
                </button>
              );
            })}
          </div>

          <h1>{headingByTab[tab].title}</h1>
          <p className="swk-login2-sub">{headingByTab[tab].sub}</p>

          {activeSession && (
            <div className="mb-4 rounded-xl bg-[#faf3e0] border border-[#d7b04e]/50 p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <StaffAvatar name={activeSession.fullName} email={activeSession.email} size={32} />
                <div className="text-xs text-[#021125] truncate">
                  Active session: <b>{activeSession.fullName}</b>
                </div>
              </div>
              <Link
                href={activeSession.homeHref}
                className="inline-flex items-center gap-1 rounded-full bg-[#021125] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#072244] transition shrink-0"
              >
                <span>Resume</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          )}

          {/* Sign In / Create Account toggle for Borrower & Partner */}
          {tab !== 'staff' && (
            <div className="mb-4 flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setAction('signin');
                  setError(null);
                }}
                className={`rounded-lg px-3 py-1.5 font-semibold border transition cursor-pointer ${
                  action === 'signin'
                    ? 'bg-[#021125] text-white border-[#021125]'
                    : 'bg-white text-[#4a5868] border-[#e2e6ea] hover:border-[#021125]'
                }`}
              >
                Existing Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setAction('register');
                  setError(null);
                }}
                className={`rounded-lg px-3 py-1.5 font-semibold border transition cursor-pointer ${
                  action === 'register'
                    ? 'bg-[#021125] text-white border-[#021125]'
                    : 'bg-white text-[#4a5868] border-[#e2e6ea] hover:border-[#021125]'
                }`}
              >
                {tab === 'borrower' ? 'New Borrower File' : 'New RERA Registration'}
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="auth-error"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mb-4 rounded-xl bg-[#fef2f2] border border-[#fecaca] p-3 text-[#991b1b] text-xs font-medium"
                role="alert"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form className="grid gap-3.5" onSubmit={onSubmit} aria-label="Authentication form">
            {tab !== 'staff' && action === 'register' && (
              <>
                <div>
                  <label htmlFor="fullNameEn" className="block mb-1 text-[12px] font-semibold text-[#021125]">
                    Full Name
                  </label>
                  <div className="swk-login2-field">
                    <User size={16} />
                    <input
                      id="fullNameEn"
                      value={fullNameEn}
                      onChange={(e) => setFullNameEn(e.target.value)}
                      required
                      placeholder="Full legal name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block mb-1 text-[12px] font-semibold text-[#021125]">
                    UAE / Mobile Phone
                  </label>
                  <div className="swk-login2-field">
                    <Phone size={16} />
                    <input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      placeholder="+971 50 000 0000"
                    />
                  </div>
                </div>

                {tab === 'partner' && (
                  <>
                    <div>
                      <label htmlFor="companyName" className="block mb-1 text-[12px] font-semibold text-[#021125]">
                        Brokerage / Agency Legal Name
                      </label>
                      <div className="swk-login2-field">
                        <Building2 size={16} />
                        <input
                          id="companyName"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          required
                          placeholder="e.g. SWK Properties LLC"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="reraOrn" className="block mb-1 text-[12px] font-semibold text-[#021125]">
                          RERA ORN
                        </label>
                        <div className="swk-login2-field">
                          <input
                            id="reraOrn"
                            value={reraOrn}
                            onChange={(e) => setReraOrn(e.target.value)}
                            required
                            placeholder="ORN-12345"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="reraBrn" className="block mb-1 text-[12px] font-semibold text-[#021125]">
                          RERA BRN
                        </label>
                        <div className="swk-login2-field">
                          <input
                            id="reraBrn"
                            value={reraBrn}
                            onChange={(e) => setReraBrn(e.target.value)}
                            required
                            placeholder="BRN-54321"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {tab === 'borrower' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="residencyType" className="block mb-1 text-[12px] font-semibold text-[#021125]">
                        Residency Profile
                      </label>
                      <div className="swk-login2-field">
                        <select
                          id="residencyType"
                          value={residencyType}
                          onChange={(e) => setResidencyType(e.target.value)}
                        >
                          <option value="EXPAT_RESIDENT">UAE Expat Resident</option>
                          <option value="UAE_NATIONAL">UAE National</option>
                          <option value="NON_RESIDENT">Non-Resident</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="communityName" className="block mb-1 text-[12px] font-semibold text-[#021125]">
                        Target Community
                      </label>
                      <div className="swk-login2-field">
                        <input
                          id="communityName"
                          value={communityName}
                          onChange={(e) => setCommunityName(e.target.value)}
                          placeholder="Dubai Hills Estate"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            <div>
              <label htmlFor="email" className="block mb-1 text-[12px] font-semibold text-[#021125]">
                Email Address
              </label>
              <div className="swk-login2-field">
                <Mail size={16} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={
                    tab === 'staff'
                      ? 'name@betterwaymortgages.com'
                      : tab === 'partner'
                        ? 'agent@brokerage.ae'
                        : 'you@example.com'
                  }
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="text-[12px] font-semibold text-[#021125]">
                  Password
                </label>
                {action === 'register' ? (
                  <span className="font-mono text-[10.5px] text-[#64748b]">Min 10 chars · A-Z · a-z · 0-9</span>
                ) : (
                  <span className="font-mono text-[10.5px] text-[#8a6518] font-semibold">5-Attempt Lockout Guard</span>
                )}
              </div>
              <div className="swk-login2-field">
                <Lock size={16} />
                <input
                  id="password"
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete={action === 'register' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="text-[#64748b] hover:text-[#021125] cursor-pointer"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {(needsTotp || (tab === 'staff' && otp.length > 0)) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="overflow-hidden"
              >
                <label htmlFor="otp" className="block mb-1 text-[12px] font-semibold text-[#021125]">
                  6-Digit Authenticator Code (TOTP MFA)
                </label>
                <div className="swk-login2-field">
                  <KeyRound size={16} />
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="font-mono tracking-[0.25em]"
                  />
                </div>
              </motion.div>
            )}

            <div className="pt-1">
              <button type="submit" disabled={busy} className="swk-login2-btn">
                <span>
                  {busy
                    ? 'Verifying credentials…'
                    : action === 'register' && tab !== 'staff'
                      ? 'Create Account & Enter Portal'
                      : 'Sign in securely'}
                </span>
                <ArrowRight size={16} />
              </button>
            </div>
          </form>

          {/* Non-privileged Staff Directory Reference (display-only, never stores or submits passwords) */}
          {tab === 'staff' && (
            <div className="mt-6 pt-5 border-t border-[#e2e6ea]">
              <div className="flex items-center justify-between mb-2.5">
                <span className="inline-flex items-center gap-1.5 text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#64748b]">
                  <Users size={12} />
                  Authorized Betterway Staff Directory
                </span>
                <span className="font-mono text-[10px] text-[#8a6518]">Click to prefill email only</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-52 overflow-y-auto pr-1">
                {staffPreview.map((u) => (
                  <button
                    key={u.email}
                    type="button"
                    onClick={() => {
                      setEmail(u.email);
                      setError(null);
                    }}
                    className={`w-full text-left p-2 border rounded-xl transition cursor-pointer flex items-center gap-2.5 ${
                      email.toLowerCase() === u.email.toLowerCase()
                        ? 'bg-[#faf3e0] border-[#d7b04e]'
                        : 'bg-[#f8f9fa] border-[#e2e6ea] hover:border-[#021125]'
                    }`}
                  >
                    <StaffAvatar name={u.label} email={u.email} avatarUrl={u.avatarUrl} size={32} />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#021125] truncate">{u.label}</div>
                      <div className="text-[10px] text-[#4a5868] truncate">{u.role}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="mt-6 flex items-center gap-1.5 text-[11px] text-[#64748b]">
            <ShieldCheck size={14} className="text-[#021125] shrink-0" />
            <span>
              scrypt + TOTP MFA · HttpOnly encrypted sessions · Append-only audit log · © {new Date().getFullYear()}{' '}
              Betterway Mortgages LLC
            </span>
          </p>
        </motion.div>
      </main>
    </div>
  );
}
