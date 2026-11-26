'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Flame,
  Globe,
  Megaphone,
  Percent,
  RefreshCw,
  Share2,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { fmtAed, PageHeader, StatusPill } from '@/components/os/UiKit';

interface StudioPayload {
  offers: Array<Record<string, unknown>>;
  banners: Array<Record<string, unknown>>;
  rates: Array<Record<string, unknown>>;
  team: Array<Record<string, unknown>>;
  campaigns: Array<Record<string, unknown>>;
  publicPreview: Record<string, unknown>;
  canPublishDirect: boolean;
}

export default function WebsiteStudioPage() {
  const [data, setData] = useState<StudioPayload | null>(null);
  const [tab, setTab] = useState<'offers' | 'banners' | 'rates' | 'social' | 'team'>('offers');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Offer composer
  const [offId, setOffId] = useState('');
  const [offSlug, setOffSlug] = useState('dubai-priority-fixed');
  const [offTab, setOffTab] = useState('Priority Fixed');
  const [offBadge, setOffBadge] = useState('3.89% 3Y Fixed');
  const [offHeadline, setOffHeadline] = useState('Compare 24 UAE Banks with Written FOL Transparency');
  const [offSummary, setOffSummary] = useState('Zero broker fee advisory across conventional & Islamic lenders.');
  const [offHighlights, setOffHighlights] = useState(
    'Up to 80% Expat / 85% UAE National LTV\nFull 4% DLD & Trustee closing cost breakdown\n24-hour pre-approval document readiness',
  );
  const [offCtaHref, setOffCtaHref] = useState('/get-started?goal=new-mortgage');
  const [offCtaLabel, setOffCtaLabel] = useState('Check Eligibility');

  // Banner composer
  const [bnrBadge, setBnrBadge] = useState('LIVE CBUAE EIBOR UPDATE');
  const [bnrMessage, setBnrMessage] = useState(
    'Compare 24 licensed UAE mortgage lenders with zero broker fee · Al Nasr Plaza, Oud Metha Desk Open Mon–Sat.',
  );
  const [bnrCtaLabel, setBnrCtaLabel] = useState('Explore Hot Offers');
  const [bnrCtaHref, setBnrCtaHref] = useState('/hot-offers');

  // Rate composer
  const [rateBankKey, setRateBankKey] = useState('emirates-nbd');
  const [rateBankName, setRateBankName] = useState('Emirates NBD');
  const [rateProduct, setRateProduct] = useState('3-Year Fixed Residential');
  const [ratePct, setRatePct] = useState('3.89');
  const [rateRevert, setRateRevert] = useState('1.49');
  const [rateLtv, setRateLtv] = useState('80');
  const [rateIslamic, setRateIslamic] = useState(false);

  // Social campaign composer
  const [socTitle, setSocTitle] = useState('Dubai Golden Visa AED 2M Mortgage Reels');
  const [socPlatform, setSocPlatform] = useState('Instagram');
  const [socUtm, setSocUtm] = useState('ig_golden_visa_nov2026');
  const [socBudget, setSocBudget] = useState('4500');
  const [socCaption, setSocCaption] = useState(
    'Buying in Dubai? Compare 24 UAE banks upfront with Betterway Mortgages LLC before you sign Form F.',
  );

  const load = useCallback(async () => {
    const r = await fetch('/api/v1/website-studio', { cache: 'no-store' });
    if (r.ok) {
      const j = (await r.json()) as StudioPayload;
      setData(j);
      const top = j.banners?.[0];
      if (top) {
        setBnrBadge(String(top.badge || 'LIVE UPDATE'));
        setBnrMessage(String(top.message || ''));
        setBnrCtaLabel(String(top.cta_label || 'Compare Rates'));
        setBnrCtaHref(String(top.cta_href || '/hot-offers'));
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function publish(payload: Record<string, unknown>, successMsg: string) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const r = await fetch('/api/v1/website-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Publish failed');
      setNotice(
        `${successMsg}${
          j.revalidate?.triggered
            ? ' Live cache revalidated on betterwaymortgages.com!'
            : ' Saved live in Public CMS feed (/api/v1/public/cms).'
        }`,
      );
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Live Two-Way Control · betterwaymortgages.com · Zero-SWK Brand Guard"
        title="Website &"
        accent="Social Media Studio"
        subtitle="Publish Hot Offers, Top Website Banners, 24-Bank Rates, 8-Member Team Sync, and Social UTM Campaigns directly from Betterway OS — synced instantly to betterwaymortgages.com."
        actions={
          <div className="flex items-center gap-2">
            <a
              href="/api/v1/public/cms"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] px-3.5 py-2 text-xs font-bold hover:border-[#0B664F]"
            >
              <Globe size={13} /> Inspect Live CMS JSON
            </a>
            <button
              type="button"
              disabled={busy}
              onClick={() => void publish({ kind: 'revalidate' }, 'Website cache-bust ping dispatched.')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#083B2E] text-white px-3.5 py-2 text-xs font-bold hover:brightness-110"
            >
              <RefreshCw size={13} /> Push Instant Sync
            </button>
          </div>
        }
      />

      <div className="rounded-2xl bg-[#0A1128] text-white border border-[#D4AF37]/35 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={16} className="text-[#34DFAC] shrink-0" />
          <span>
            <strong className="text-[#FCF1B7]">Zero-SWK Public Guard Active:</strong> Every public CMS payload served to <code>betterwaymortgages.com</code> is strictly sanitized so internal brokerage partner records never leak to the public website.
          </span>
        </div>
        <StatusPill label={`${data?.offers.length ?? 0} Offers · ${data?.rates.length ?? 0} Rates · ${data?.team.length ?? 8} Team`} tone="emerald" />
      </div>

      {error && <div className="rounded-xl border border-red-400/40 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</div>}
      {notice && (
        <div className="rounded-xl border border-emerald-500/35 bg-emerald-50 dark:bg-emerald-950/30 p-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 size={14} /> {notice}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['offers', `Hot Offers (${data?.offers.length ?? 0})`, Flame],
            ['banners', `Live Banners (${data?.banners.length ?? 0})`, Megaphone],
            ['rates', `24-Bank Rates (${data?.rates.length ?? 0})`, Percent],
            ['social', `Social & UTM Campaigns (${data?.campaigns.length ?? 0})`, Share2],
            ['team', `Website Team Sync (${data?.team.length ?? 8})`, Users],
          ] as const
        ).map(([k, label, Icon]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition ${
              tab === k ? 'bg-[#083B2E] text-white border-[#083B2E]' : 'bg-[var(--bw-card)] border-[var(--bw-line)]'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === 'offers' && (
        <div className="grid lg:grid-cols-3 gap-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void publish(
                {
                  kind: 'offer',
                  offer: {
                    id: offId || undefined,
                    slug: offSlug,
                    tab_label: offTab,
                    badge: offBadge,
                    headline: offHeadline,
                    summary: offSummary,
                    highlights: offHighlights.split(/\r?\n/).filter(Boolean),
                    rate_badge: offBadge,
                    cta_href: offCtaHref,
                    cta_label: offCtaLabel,
                    published: true,
                    spotlight: true,
                  },
                },
                'Published Hot Offer live to betterwaymortgages.com.',
              );
            }}
            className="rounded-2xl bg-[var(--bw-card)] border border-[var(--bw-line)] p-5 space-y-3"
          >
            <h2 className="text-sm font-extrabold">Publish / Edit Live Hot Offer</h2>
            <div className="grid grid-cols-2 gap-2">
              <input value={offTab} onChange={(e) => setOffTab(e.target.value)} placeholder="Tab Label" className="rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 text-xs" required />
              <input value={offBadge} onChange={(e) => setOffBadge(e.target.value)} placeholder="Badge / Rate" className="rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 text-xs" required />
            </div>
            <input value={offSlug} onChange={(e) => setOffSlug(e.target.value)} placeholder="URL Slug" className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 text-xs font-mono" required />
            <input value={offHeadline} onChange={(e) => setOffHeadline(e.target.value)} placeholder="Headline" className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 text-xs font-semibold" required />
            <textarea rows={2} value={offSummary} onChange={(e) => setOffSummary(e.target.value)} placeholder="Summary" className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent p-2.5 text-xs" required />
            <textarea rows={3} value={offHighlights} onChange={(e) => setOffHighlights(e.target.value)} placeholder="Bullet highlights (one per line)" className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent p-2.5 text-xs" />
            <div className="grid grid-cols-2 gap-2">
              <input value={offCtaLabel} onChange={(e) => setOffCtaLabel(e.target.value)} placeholder="CTA Label" className="rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 text-xs" />
              <input value={offCtaHref} onChange={(e) => setOffCtaHref(e.target.value)} placeholder="/get-started" className="rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 text-xs font-mono" />
            </div>
            <button disabled={busy} className="w-full rounded-xl bg-[#083B2E] text-white py-2.5 text-xs font-bold">
              {offId ? `Update Offer ${offId} Live` : 'Publish New Offer Live'}
            </button>
          </form>

          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-3 content-start">
            {(data?.offers ?? []).map((o) => (
              <div key={String(o.id)} className="rounded-2xl bg-[var(--bw-card)] border border-[var(--bw-line)] p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <StatusPill label={String(o.badge)} tone="gold" />
                  <button
                    type="button"
                    onClick={() => {
                      setOffId(String(o.id));
                      setOffSlug(String(o.slug));
                      setOffTab(String(o.tab_label));
                      setOffBadge(String(o.badge));
                      setOffHeadline(String(o.headline));
                      setOffSummary(String(o.summary));
                      setOffHighlights(Array.isArray(o.highlights) ? o.highlights.join('\n') : '');
                      setOffCtaHref(String(o.cta_href || '/get-started'));
                      setOffCtaLabel(String(o.cta_label || 'Check Eligibility'));
                    }}
                    className="text-[11px] font-bold text-[var(--bw-emerald)] hover:underline"
                  >
                    Edit →
                  </button>
                </div>
                <div className="font-extrabold text-sm">{String(o.headline)}</div>
                <p className="text-[var(--bw-muted)]">{String(o.summary)}</p>
                <div className="font-mono text-[10.5px] text-[var(--bw-muted)] pt-1 border-t border-[var(--bw-line)]">
                  {String(o.id)} · {String(o.cta_href)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'banners' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void publish(
              {
                kind: 'banner',
                banner: {
                  id: 'BNR-TOP',
                  placement: 'top_bar',
                  badge: bnrBadge,
                  message: bnrMessage,
                  cta_label: bnrCtaLabel,
                  cta_href: bnrCtaHref,
                  active: true,
                },
              },
              'Updated live Top Announcement Banner on betterwaymortgages.com.',
            );
          }}
          className="rounded-2xl bg-[var(--bw-card)] border border-[var(--bw-line)] p-5 space-y-4 max-w-2xl"
        >
          <h2 className="text-sm font-extrabold">Live Website Announcement Banner</h2>
          <div className="rounded-xl bg-[#0A1128] text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#0A1128] font-extrabold text-[10px]">{bnrBadge}</span>
              <span>{bnrMessage}</span>
            </div>
            <span className="text-[#34DFAC] font-bold">{bnrCtaLabel} →</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <input value={bnrBadge} onChange={(e) => setBnrBadge(e.target.value)} placeholder="Badge" className="rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2" required />
            <input value={bnrCtaLabel} onChange={(e) => setBnrCtaLabel(e.target.value)} placeholder="CTA Label" className="rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2" required />
          </div>
          <input value={bnrMessage} onChange={(e) => setBnrMessage(e.target.value)} placeholder="Live announcement message..." className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 text-xs" required />
          <input value={bnrCtaHref} onChange={(e) => setBnrCtaHref(e.target.value)} placeholder="Target path (/hot-offers)" className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 text-xs font-mono" required />
          <button disabled={busy} className="rounded-xl bg-[#083B2E] text-white px-5 py-2.5 text-xs font-bold">
            Publish Live Banner to betterwaymortgages.com
          </button>
        </form>
      )}

      {tab === 'rates' && (
        <div className="grid lg:grid-cols-3 gap-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void publish(
                {
                  kind: 'rate',
                  rate: {
                    bank_key: rateBankKey,
                    bank_name: rateBankName,
                    product_name: rateProduct,
                    rate_pct: Number(ratePct),
                    revert_margin_pct: Number(rateRevert),
                    max_ltv_pct: Number(rateLtv),
                    islamic: rateIslamic,
                    featured: true,
                    published: true,
                  },
                },
                `Updated ${rateBankName} live rate (${ratePct}%) on website.`,
              );
            }}
            className="rounded-2xl bg-[var(--bw-card)] border border-[var(--bw-line)] p-5 space-y-3"
          >
            <h2 className="text-sm font-extrabold">Update Live UAE Bank Rate</h2>
            <input value={rateBankKey} onChange={(e) => setRateBankKey(e.target.value)} placeholder="Bank Slug (e.g. emirates-nbd)" className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 text-xs font-mono" required />
            <input value={rateBankName} onChange={(e) => setRateBankName(e.target.value)} placeholder="Bank Name" className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 text-xs" required />
            <input value={rateProduct} onChange={(e) => setRateProduct(e.target.value)} placeholder="Product Name" className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 text-xs" required />
            <div className="grid grid-cols-3 gap-2">
              <input type="number" step="0.01" value={ratePct} onChange={(e) => setRatePct(e.target.value)} placeholder="Rate %" className="rounded-xl border border-[var(--bw-line)] bg-transparent px-2.5 py-2 text-xs font-mono" required />
              <input type="number" step="0.01" value={rateRevert} onChange={(e) => setRateRevert(e.target.value)} placeholder="Revert +" className="rounded-xl border border-[var(--bw-line)] bg-transparent px-2.5 py-2 text-xs font-mono" />
              <input type="number" value={rateLtv} onChange={(e) => setRateLtv(e.target.value)} placeholder="Max LTV" className="rounded-xl border border-[var(--bw-line)] bg-transparent px-2.5 py-2 text-xs font-mono" />
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={rateIslamic} onChange={(e) => setRateIslamic(e.target.checked)} />
              Islamic Sharia-Compliant Product (Ijara / Murabaha)
            </label>
            <button disabled={busy} className="w-full rounded-xl bg-[#083B2E] text-white py-2.5 text-xs font-bold">
              Push Live Rate Update
            </button>
          </form>

          <div className="lg:col-span-2 rounded-2xl bg-[var(--bw-card)] border border-[var(--bw-line)] p-5 overflow-x-auto">
            <h3 className="text-sm font-extrabold mb-3">Published Live Bank Rates ({data?.rates.length ?? 0})</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[var(--bw-muted)] border-b border-[var(--bw-line)]">
                  <th className="py-2 pr-3">Bank</th>
                  <th className="py-2 pr-3">Product</th>
                  <th className="py-2 pr-3">Rate %</th>
                  <th className="py-2 pr-3">Revert</th>
                  <th className="py-2">Max LTV</th>
                </tr>
              </thead>
              <tbody>
                {(data?.rates ?? []).map((r) => (
                  <tr key={String(r.id)} className="border-b border-[var(--bw-line)]/60">
                    <td className="py-2 pr-3 font-bold">{String(r.bank_name)}</td>
                    <td className="py-2 pr-3">{String(r.product_name)}</td>
                    <td className="py-2 pr-3 font-mono font-extrabold text-[var(--bw-emerald)]">{Number(r.rate_pct).toFixed(2)}%</td>
                    <td className="py-2 pr-3 font-mono">+{Number(r.revert_margin_pct).toFixed(2)}%</td>
                    <td className="py-2 font-mono">{Number(r.max_ltv_pct)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'social' && (
        <div className="grid lg:grid-cols-3 gap-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void publish(
                {
                  kind: 'campaign',
                  campaign: {
                    title: socTitle,
                    platform: socPlatform,
                    campaign_utm: socUtm,
                    budget_aed: Number(socBudget),
                    caption: socCaption,
                    target_url: `https://betterwaymortgages.com/hot-offers?utm_source=${encodeURIComponent(socPlatform.toLowerCase())}&utm_campaign=${encodeURIComponent(socUtm)}`,
                  },
                },
                'Social campaign & tracked UTM link created.',
              );
            }}
            className="rounded-2xl bg-[var(--bw-card)] border border-[var(--bw-line)] p-5 space-y-3"
          >
            <h2 className="text-sm font-extrabold">Social Campaign &amp; UTM Link Builder</h2>
            <input value={socTitle} onChange={(e) => setSocTitle(e.target.value)} placeholder="Campaign Title" className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 text-xs" required />
            <div className="grid grid-cols-2 gap-2">
              <select value={socPlatform} onChange={(e) => setSocPlatform(e.target.value)} className="rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] px-3 py-2 text-xs">
                <option value="Instagram">Instagram</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Meta Ads">Meta Ads</option>
                <option value="Google Ads">Google Ads</option>
                <option value="TikTok">TikTok</option>
                <option value="YouTube">YouTube</option>
                <option value="WhatsApp Broadcast">WhatsApp Broadcast</option>
              </select>
              <input type="number" value={socBudget} onChange={(e) => setSocBudget(e.target.value)} placeholder="Budget AED" className="rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 text-xs" />
            </div>
            <input value={socUtm} onChange={(e) => setSocUtm(e.target.value)} placeholder="UTM Campaign Tag" className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 text-xs font-mono" required />
            <textarea rows={3} value={socCaption} onChange={(e) => setSocCaption(e.target.value)} placeholder="Post caption / ad copy..." className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent p-2.5 text-xs" />
            <button disabled={busy} className="w-full rounded-xl bg-[#0A1128] text-[#FCF1B7] py-2.5 text-xs font-bold">
              Launch Tracked Social Campaign
            </button>
          </form>

          <div className="lg:col-span-2 rounded-2xl bg-[var(--bw-card)] border border-[var(--bw-line)] p-5 space-y-3">
            <h3 className="text-sm font-extrabold">Active Social &amp; Paid Lead Campaigns ({data?.campaigns.length ?? 0})</h3>
            <div className="space-y-2.5">
              {(data?.campaigns ?? []).map((c) => (
                <div key={String(c.id)} className="rounded-xl border border-[var(--bw-line)] p-3.5 text-xs space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-extrabold">{String(c.title)}</span>
                    <div className="flex items-center gap-1.5">
                      <StatusPill label={String(c.platform)} tone="navy" />
                      <StatusPill label={fmtAed(Number(c.budget_aed))} tone="gold" />
                    </div>
                  </div>
                  <div className="text-[11px] text-[var(--bw-muted)]">{String(c.caption)}</div>
                  <div className="font-mono text-[10.5px] text-[var(--bw-emerald)] break-all">{String(c.target_url)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'team' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(data?.team ?? []).map((t) => (
            <div key={String(t.id)} className="rounded-2xl overflow-hidden bg-[var(--bw-card)] border border-[var(--bw-line)]">
              <img src={String(t.portrait_url)} alt={String(t.name)} className="w-full h-48 object-cover object-top" />
              <div className="p-3.5 space-y-1 text-xs">
                <div className="font-extrabold">{String(t.name)}</div>
                <div className="text-[11px] font-semibold text-[var(--bw-emerald)]">{String(t.designation)}</div>
                <div className="text-[10.5px] text-[var(--bw-muted)]">{String(t.email)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
