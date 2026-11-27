'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Building2, FileText, Image as ImageIcon, Palette, Plus, Printer, Save } from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { fmtAed, StatusPill } from '@/components/os/UiKit';
import {
  BROCHURE_THEME_PRESETS,
  DEFAULT_BROCHURE_THEME,
  type BrochureCoverLayout,
  type BrochurePresetKey,
  type BrochureThemeConfig,
} from '@/lib/workspace/domain';
import { downloadJpegDocument, downloadWordDocument, printBrandedDocument } from '@/lib/workspace/exporters';

type EntityKind = 'community' | 'developer' | 'property' | 'unit';

export function CatalogBrochureStudioTab() {
  const { user, toast } = useOs();
  const [data, setData] = useState<any>(null);
  const [entity, setEntity] = useState<EntityKind>('property');
  const [theme, setTheme] = useState<BrochureThemeConfig>(DEFAULT_BROCHURE_THEME);

  const [form, setForm] = useState({
    code: '',
    name: '',
    emirate: 'Dubai',
    communityId: '',
    developerId: '',
    propertyId: '',
    completionStatus: 'Off-Plan',
    startingPriceAed: 2_450_000,
    askingPriceAed: 2_450_000,
    yearlyRentAed: 185_000,
    avgSqftAed: 2150,
    grossYieldPct: 6.8,
    handoverQuarter: 'Q4 2027',
    paymentPlanSummary: '10% Booking · 50% Construction · 40% Handover Mortgage Eligible',
    bedrooms: '2BR',
    areaSqft: 1380,
    floorNo: '14',
    viewLabel: 'Burj / Water Canal View',
    aplTier: 'Tier 1 — All 24 UAE Banks',
    flooring: 'Italian Porcelain / Natural Marble',
    kitchen: 'Built-in European Appliances & Quartz Countertops',
    amenities: 'Infinity Pool, Private Gym, Concierge, EV Parking, Kids Club',
    coverImageUrl: '',
    description: 'Prime Dubai freehold residential asset pre-approved across 24 UAE partner banks via Betterway Mortgages LLC.',
  });

  const load = useCallback(async () => {
    const r = await fetch('/api/v1/workspace/catalog-studio', { cache: 'no-store' });
    if (r.ok) {
      const d = await r.json();
      setData(d);
      if (d.defaultTheme) setTheme(d.defaultTheme);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const applyPreset = (preset: Exclude<BrochurePresetKey, 'custom'>) => {
    const p = BROCHURE_THEME_PRESETS[preset];
    setTheme((prev) => ({ ...prev, ...p }));
  };

  const createEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await fetch('/api/v1/workspace/catalog-studio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        entity,
        ...form,
        unitNumber: form.name,
        brochureTheme: theme,
        materialsSpec: {
          flooring: form.flooring,
          kitchen: form.kitchen,
          amenities: form.amenities,
        },
        marketingDetails: {
          paymentPlan: form.paymentPlanSummary,
          handover: form.handoverQuarter,
          view: form.viewLabel,
        },
      }),
    });
    const out = await r.json();
    if (!r.ok) {
      toast(out.error || 'Failed to add record', 'err');
      return;
    }
    toast(`Added ${entity.toUpperCase()} "${form.name}" with custom brochure theme & material specs!`);
    setForm((f) => ({ ...f, code: '', name: '' }));
    await load();
  };

  const saveCompanyDefaultTheme = async () => {
    const r = await fetch('/api/v1/workspace/catalog-studio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save_default_theme', theme }),
    });
    if (r.ok) toast('Saved as Betterway Company Default Brochure Theme!');
  };

  const buildBrochurePayload = (title: string, subtitle: string, meta: Array<{ label: string; value: string }>, desc: string) => ({
    filename: `Betterway_Brochure_${title.replace(/[^A-Za-z0-9]+/g, '_')}`,
    badge: theme.headerTagline,
    title,
    subtitle,
    theme,
    sealedBy: user?.name,
    metaPairs: meta,
    sections: [
      {
        heading: 'Materials, Finishes & Specifications',
        rows: [
          { label: 'Flooring & Interiors', value: form.flooring },
          { label: 'Kitchen & Appliances', value: form.kitchen },
          { label: 'Lifestyle Amenities', value: form.amenities },
        ],
      },
      ...(theme.showPaymentPlan
        ? [
            {
              heading: 'Payment Plan & UAE Mortgage Financing (24 Banks)',
              text: `${form.paymentPlanSummary}\n\nBetterway Mortgages LLC Financing Advisory: Up to 80% LTV for UAE Expats (85% UAE Nationals, 60% Non-Residents) across 24 Partner Banks with AED 0 Client Broker Fee.`,
            },
          ]
        : []),
      {
        heading: 'Executive Overview',
        text: desc,
      },
    ],
  });

  const currentTitle = form.name.trim() || `New ${entity.charAt(0).toUpperCase() + entity.slice(1)} Showcase`;
  const previewMeta = [
    { label: 'Emirate & Type', value: `${form.emirate} · ${entity.toUpperCase()} (${form.completionStatus})` },
    { label: 'Price / Benchmark', value: entity === 'community' ? `Avg ${fmtAed(form.avgSqftAed)}/sqft · ${form.grossYieldPct}% Yield` : fmtAed(entity === 'unit' ? form.askingPriceAed : form.startingPriceAed) },
    { label: 'Handover / Specs', value: `${form.handoverQuarter} · ${form.bedrooms} · ${form.areaSqft} Sq.Ft · ${form.viewLabel}` },
    { label: 'Bank APL Readiness', value: form.aplTier },
  ];

  const existingList: any[] =
    entity === 'community'
      ? data?.communities ?? []
      : entity === 'developer'
        ? data?.developers ?? []
        : entity === 'unit'
          ? data?.units ?? []
          : data?.properties ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold flex items-center gap-2">
            <Building2 size={16} className="text-[#0D8A6A]" /> Community, Developer, Project &amp; Unit Creator + Custom Brochure Studio
          </h2>
          <p className="text-xs text-[var(--bw-muted)]">
            Add any new Community, Developer, Project, or Unit with complete material specifications, payment plans, and custom brochure colors/layouts — exportable immediately to JPEG, Word &amp; PDF.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs">
          {(['community', 'developer', 'property', 'unit'] as EntityKind[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setEntity(k)}
              className={`px-3.5 py-2 rounded-full font-bold capitalize cursor-pointer ${
                entity === k ? 'bg-[#0A1128] text-[#FCF1B7]' : 'border border-[var(--bw-line)] bg-[var(--bw-card)]'
              }`}
            >
              + {k === 'property' ? 'Project / Building' : k}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-5">
        {/* Left: Complete Details & Materials Creator */}
        <form onSubmit={createEntity} className="lg:col-span-6 bw-card p-5 space-y-3 text-xs">
          <h3 className="text-sm font-extrabold flex items-center gap-1.5">
            <Plus size={15} className="text-[#0D8A6A]" /> Add New {entity === 'property' ? 'Project / Building' : entity.toUpperCase()} &amp; Material Specs
          </h3>

          <div className="grid sm:grid-cols-2 gap-2.5">
            <div>
              <label className="font-bold block mb-1">{entity === 'unit' ? 'Unit Door Number *' : 'Name *'}</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={entity === 'unit' ? 'e.g. Tower A - 1402' : 'e.g. Creek Waters Residence'} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
            </div>
            <div>
              <label className="font-bold block mb-1">Emirate</label>
              <select value={form.emirate} onChange={(e) => setForm({ ...form, emirate: e.target.value })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]">
                <option>Dubai</option>
                <option>Abu Dhabi</option>
                <option>Ras Al Khaimah</option>
                <option>Sharjah</option>
              </select>
            </div>

            {entity === 'property' && (
              <>
                <div>
                  <label className="font-bold block mb-1">Community</label>
                  <select value={form.communityId} onChange={(e) => setForm({ ...form, communityId: e.target.value })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]">
                    <option value="">Select Community...</option>
                    {(data?.communities ?? []).map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.emirate})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold block mb-1">Master Developer</label>
                  <select value={form.developerId} onChange={(e) => setForm({ ...form, developerId: e.target.value })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]">
                    <option value="">Select Developer...</option>
                    {(data?.developers ?? []).map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {entity === 'unit' && (
              <>
                <div>
                  <label className="font-bold block mb-1">Parent Project / Building</label>
                  <select value={form.propertyId} onChange={(e) => setForm({ ...form, propertyId: e.target.value })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]">
                    <option value="">Select Project / Building...</option>
                    {(data?.properties ?? []).map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.emirate})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <div>
                    <label className="font-bold block mb-1">Beds</label>
                    <input value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} placeholder="2BR" className="w-full h-9 px-2 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Sq.Ft</label>
                    <input type="number" value={form.areaSqft} onChange={(e) => setForm({ ...form, areaSqft: Number(e.target.value) })} className="w-full h-9 px-2 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] font-mono-num" />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Floor</label>
                    <input value={form.floorNo} onChange={(e) => setForm({ ...form, floorNo: e.target.value })} placeholder="14" className="w-full h-9 px-2 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="font-bold block mb-1">{entity === 'community' ? 'Avg AED / Sq.Ft' : 'Starting / Asking Price (AED)'}</label>
              <input
                type="number"
                value={entity === 'community' ? form.avgSqftAed : entity === 'unit' ? form.askingPriceAed : form.startingPriceAed}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (entity === 'community') setForm({ ...form, avgSqftAed: v });
                  else if (entity === 'unit') setForm({ ...form, askingPriceAed: v });
                  else setForm({ ...form, startingPriceAed: v });
                }}
                className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] font-mono-num"
              />
            </div>
            <div>
              <label className="font-bold block mb-1">Handover / Status</label>
              <div className="grid grid-cols-2 gap-1.5">
                <select value={form.completionStatus} onChange={(e) => setForm({ ...form, completionStatus: e.target.value })} className="h-9 px-2 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]">
                  <option>Off-Plan</option>
                  <option>Ready</option>
                  <option>Handover</option>
                </select>
                <input value={form.handoverQuarter} onChange={(e) => setForm({ ...form, handoverQuarter: e.target.value })} placeholder="Q4 2027" className="h-9 px-2 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--bw-line)] space-y-2">
            <div className="font-extrabold text-[#0D8A6A]">Materials, Finishes &amp; Payment Plan</div>
            <div className="grid sm:grid-cols-2 gap-2">
              <input value={form.flooring} onChange={(e) => setForm({ ...form, flooring: e.target.value })} placeholder="Flooring & Finishes" className="h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
              <input value={form.kitchen} onChange={(e) => setForm({ ...form, kitchen: e.target.value })} placeholder="Kitchen & Appliances" className="h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
            </div>
            <input value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} placeholder="Amenities list" className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
            <input value={form.paymentPlanSummary} onChange={(e) => setForm({ ...form, paymentPlanSummary: e.target.value })} placeholder="Payment Plan Summary (e.g. 60/40 Handover Mortgage)" className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
            <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Executive brochure narrative..." className="w-full p-2.5 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
          </div>

          <button type="submit" className="w-full h-10 rounded-full bg-[#0D8A6A] hover:bg-[#10a17c] text-white font-extrabold cursor-pointer">
            Save {entity === 'property' ? 'Project' : entity.toUpperCase()} &amp; Brochure Theme to Master Catalog
          </button>
        </form>

        {/* Right: Interactive Brochure Look, Color & Template Customizer + Live Preview */}
        <div className="lg:col-span-6 bw-card p-5 space-y-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-extrabold flex items-center gap-1.5">
              <Palette size={15} className="text-[#D4AF37]" /> Custom Brochure Colors &amp; Template Designer
            </h3>
            <button type="button" onClick={() => void saveCompanyDefaultTheme()} className="px-3 py-1.5 rounded-full border border-[var(--bw-line)] font-bold inline-flex items-center gap-1 cursor-pointer hover:border-[#0D8A6A]">
              <Save size={12} /> Set Company Default
            </button>
          </div>

          {/* Preset Swatches */}
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(BROCHURE_THEME_PRESETS) as Array<Exclude<BrochurePresetKey, 'custom'>>).map((key) => {
              const p = BROCHURE_THEME_PRESETS[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyPreset(key)}
                  className={`px-3 py-1.5 rounded-full font-bold inline-flex items-center gap-1.5 border cursor-pointer ${
                    theme.preset === key ? 'border-[#0D8A6A] ring-1 ring-[#0D8A6A]' : 'border-[var(--bw-line)]'
                  }`}
                >
                  <span className="size-3 rounded-full" style={{ backgroundColor: p.primaryHex }} />
                  <span className="size-3 rounded-full" style={{ backgroundColor: p.accentHex }} />
                  {key.replace(/_/g, ' ')}
                </button>
              );
            })}
          </div>

          {/* Custom Color Pickers + Template Layout */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <label className="flex items-center justify-between px-2.5 py-1.5 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]">
              <span className="font-bold">Primary</span>
              <input type="color" value={theme.primaryHex} onChange={(e) => setTheme({ ...theme, preset: 'custom', primaryHex: e.target.value })} className="size-6 cursor-pointer" />
            </label>
            <label className="flex items-center justify-between px-2.5 py-1.5 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]">
              <span className="font-bold">Accent</span>
              <input type="color" value={theme.accentHex} onChange={(e) => setTheme({ ...theme, preset: 'custom', accentHex: e.target.value })} className="size-6 cursor-pointer" />
            </label>
            <label className="flex items-center justify-between px-2.5 py-1.5 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]">
              <span className="font-bold">Surface</span>
              <input type="color" value={theme.surfaceHex} onChange={(e) => setTheme({ ...theme, preset: 'custom', surfaceHex: e.target.value })} className="size-6 cursor-pointer" />
            </label>
            <select
              value={theme.coverLayout}
              onChange={(e) => setTheme({ ...theme, coverLayout: e.target.value as BrochureCoverLayout })}
              className="px-2 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] font-bold"
            >
              <option value="executive_band">Executive Band</option>
              <option value="editorial_split">Editorial Split</option>
              <option value="minimal_frame">Minimal Frame</option>
            </select>
          </div>

          {/* Live Brochure Card Preview */}
          <div
            className="rounded-2xl overflow-hidden shadow-lg border-2"
            style={{ backgroundColor: theme.surfaceHex, borderColor: theme.accentHex, color: theme.inkHex }}
          >
            <div className="p-5 text-white" style={{ backgroundColor: theme.primaryHex, borderBottom: `4px solid ${theme.accentHex}` }}>
              <img src="/brand/logo-horizontal-dark.png" alt="Betterway Mortgages" className="h-7 mb-2.5" />
              <div className="text-[10px] font-extrabold uppercase tracking-[0.16em]" style={{ color: theme.accentHex }}>
                {theme.headerTagline}
              </div>
              <div className="text-xl font-extrabold mt-1">{currentTitle}</div>
              <div className="text-[11px] opacity-80 mt-0.5">{form.emirate} · {form.completionStatus} · {form.handoverQuarter}</div>
            </div>
            <div className="p-4 space-y-2.5 text-[11.5px]">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-black/5">
                  <div className="text-[9.5px] uppercase opacity-70 font-bold">Price / Benchmark</div>
                  <div className="font-extrabold font-mono-num">{fmtAed(entity === 'unit' ? form.askingPriceAed : form.startingPriceAed)}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-black/5">
                  <div className="text-[9.5px] uppercase opacity-70 font-bold">Payment &amp; Mortgage</div>
                  <div className="font-bold truncate">{form.paymentPlanSummary}</div>
                </div>
              </div>
              <div className="opacity-85"><strong>Finishes:</strong> {form.flooring} · {form.kitchen}</div>
              <div className="opacity-85"><strong>Amenities:</strong> {form.amenities}</div>
              <div className="pt-2 border-t border-black/10 text-[10px] opacity-70">{theme.footerNote}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void downloadJpegDocument(buildBrochurePayload(currentTitle, `${form.emirate} · ${form.completionStatus}`, previewMeta, form.description))}
              className="px-4 py-2 rounded-full bg-[#0D8A6A] text-white font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ImageIcon size={13} /> Export Brochure (.JPEG)
            </button>
            <button
              type="button"
              onClick={() => downloadWordDocument(buildBrochurePayload(currentTitle, `${form.emirate} · ${form.completionStatus}`, previewMeta, form.description))}
              className="px-4 py-2 rounded-full bg-[#0A1128] text-[#FCF1B7] font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <FileText size={13} /> Export Word (.DOC)
            </button>
            <button
              type="button"
              onClick={() => printBrandedDocument(buildBrochurePayload(currentTitle, `${form.emirate} · ${form.completionStatus}`, previewMeta, form.description))}
              className="px-4 py-2 rounded-full border border-[var(--bw-line)] font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={13} /> Print / PDF
            </button>
          </div>
        </div>
      </div>

      {/* Existing Master Catalog Records Quick Export */}
      <div className="bw-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold capitalize">Saved {entity === 'property' ? 'Projects & Buildings' : `${entity}s`} ({existingList.length})</h3>
          <span className="text-[11px] text-[var(--bw-muted)]">Click any record to load into Brochure Customizer</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs max-h-60 overflow-y-auto pe-1">
          {existingList.slice(0, 24).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setForm((f) => ({
                  ...f,
                  name: item.name || item.unit_number || '',
                  emirate: item.emirate || 'Dubai',
                  startingPriceAed: Number(item.starting_price_aed || item.asking_price_aed || f.startingPriceAed),
                  description: item.description || f.description,
                  handoverQuarter: item.handover_quarter || f.handoverQuarter,
                  paymentPlanSummary: item.payment_plan_summary || f.paymentPlanSummary,
                }));
                if (item.brochure_theme_json?.primaryHex) setTheme({ ...DEFAULT_BROCHURE_THEME, ...item.brochure_theme_json });
                toast(`Loaded "${item.name || item.unit_number}" into Brochure Designer`);
              }}
              className="p-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]/60 hover:border-[#0D8A6A] text-start space-y-1 cursor-pointer"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-mono-num text-[10px] font-bold text-[#0D8A6A]">{item.code}</span>
                <StatusPill label={item.emirate || item.bedrooms || 'Active'} tone="slate" />
              </div>
              <div className="font-bold truncate">{item.name || item.unit_number}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
