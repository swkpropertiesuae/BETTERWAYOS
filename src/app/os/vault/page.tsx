'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Download, FileLock2, Upload } from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { PageHeader, StatusPill } from '@/components/os/UiKit';

export default function ClientDocumentVaultPage() {
  const { toast } = useOs();
  const [cases, setCases] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [docs, setDocs] = useState<any[]>([]);

  const load = useCallback(async (cid?: string) => {
    const q = cid ? `?caseId=${encodeURIComponent(cid)}` : '';
    const r = await fetch(`/api/v1/vault/documents${q}`);
    if (r.ok) {
      const d = await r.json();
      setCases(d.cases ?? []);
      setSelectedCaseId(d.selectedCaseId || '');
      setDocs(d.documents ?? []);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleFileUpload = async (docId: string, file: File) => {
    const r = await fetch('/api/v1/vault/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upload_url', docId, fileName: file.name }),
    });
    const out = await r.json();
    if (!r.ok) {
      toast(out.error || 'Could not generate signed upload URL', 'err');
      return;
    }
    // Direct upload to Supabase Private Storage (handles 20MB+ bank statements cleanly!)
    const put = await fetch(out.signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'application/pdf' },
      body: file,
    });
    if (!put.ok) {
      toast('Direct storage upload failed', 'err');
      return;
    }
    toast(`Uploaded "${file.name}" directly into encrypted Supabase Private Storage!`);
    await load(selectedCaseId);
  };

  const verifyDoc = async (docId: string) => {
    const r = await fetch('/api/v1/vault/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', docId, status: 'Verified' }),
    });
    if (r.ok) {
      toast('Document stamped as Verified!');
      await load(selectedCaseId);
    }
  };

  const downloadDoc = async (docId: string) => {
    const r = await fetch('/api/v1/vault/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'download_url', docId }),
    });
    const out = await r.json();
    if (r.ok && out.signedUrl) window.open(out.signedUrl, '_blank');
    else toast(out.error || 'No file uploaded yet', 'err');
  };

  const verifiedCount = docs.filter((d) => d.status === 'Verified').length;
  const uploadedCount = docs.filter((d) => d.status === 'Uploaded' || d.status === 'Verified').length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Supabase Private Storage · Per-Client Encrypted Document Vault"
        title="Client Document"
        accent="Vault"
        subtitle="Passport, Emirates ID, Visa Page, Salary Certificate, Last 6 Months Payslips & Bank Statements, AECB Credit Report, Signed Bank Application & Info Sheet, Form F, Oqood, Title Deed & Developer SOA/NOC."
      />

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Client Case Selector */}
        <div className="lg:col-span-4 bw-card p-5 space-y-3">
          <h3 className="text-sm font-extrabold flex items-center gap-1.5">
            <FileLock2 size={15} className="text-[#007b52]" /> Client Cases ({cases.length})
          </h3>
          {cases.length === 0 ? (
            <div className="text-xs text-[var(--bw-muted)] py-8 text-center">
              Open a Mortgage Case in 12-Step Pipeline to auto-generate its 13-document private vault.
            </div>
          ) : (
            <div className="space-y-2">
              {cases.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => void load(c.id)}
                  className={`w-full p-3 rounded-xl border text-start text-xs transition cursor-pointer ${
                    selectedCaseId === c.id
                      ? 'bg-[#025e3d] text-white border-[#D4AF37]'
                      : 'border-[var(--bw-line)] hover:border-[#007b52]'
                  }`}
                >
                  <div className="font-mono-num font-bold text-[#34DFAC]">{c.case_code}</div>
                  <div className="font-extrabold text-sm">{c.borrower_name}</div>
                  <div className="text-[11px] opacity-75">{c.community} · {c.borrower_profile}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Per-Client Checklist & Direct Private Uploads */}
        <div className="lg:col-span-8 bw-card p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--bw-line)]">
            <div>
              <h3 className="text-sm font-extrabold">Mandatory Mortgage Document Checklist</h3>
              <p className="text-xs text-[var(--bw-muted)]">
                Uploaded: <strong>{uploadedCount}/{docs.length}</strong> · Verified: <strong>{verifiedCount}/{docs.length}</strong> · Short-lived 5-minute signed URLs only
              </p>
            </div>
            <StatusPill label="Private Bucket: client-vault" tone="navy" />
          </div>

          <div className="space-y-2.5">
            {docs.map((d) => (
              <div key={d.id} className="p-3.5 rounded-2xl border border-[var(--bw-line)] bg-[var(--bw-bg)]/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5 max-w-md">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-[var(--bw-soft)] text-[#007b52]">
                      {d.doc_category}
                    </span>
                    <span className="font-bold">{d.doc_name}</span>
                  </div>
                  <div className="text-[11px] text-[var(--bw-muted)]">
                    Max recency: {d.recency_days}d · {d.file_name ? `File: ${d.file_name}` : 'Awaiting upload'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill
                    label={d.status}
                    tone={d.status === 'Verified' ? 'emerald' : d.status === 'Uploaded' ? 'blue' : 'gold'}
                  />
                  <label className="px-3 py-1.5 rounded-full bg-[#007b52] text-white font-bold inline-flex items-center gap-1 cursor-pointer">
                    <Upload size={12} /> Upload
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void handleFileUpload(d.id, f);
                      }}
                    />
                  </label>
                  {d.storage_path && (
                    <>
                      <button type="button" onClick={() => void downloadDoc(d.id)} className="px-2.5 py-1.5 rounded-full border border-[var(--bw-line)] font-bold inline-flex items-center gap-1 cursor-pointer">
                        <Download size={12} /> View
                      </button>
                      {d.status !== 'Verified' && (
                        <button type="button" onClick={() => void verifyDoc(d.id)} className="px-2.5 py-1.5 rounded-full bg-[#025e3d] text-[#FCF1B7] font-bold inline-flex items-center gap-1 cursor-pointer">
                          <CheckCircle2 size={12} /> Verify
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
