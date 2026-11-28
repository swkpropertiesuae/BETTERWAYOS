'use client';

import React, { useId, useRef, useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Paperclip,
  ExternalLink,
  Upload,
  X,
} from 'lucide-react';
import {
  formatFileSize,
  normalizeAttachmentUrl,
  type AttachmentItem,
} from '@/lib/workspace/attachments-types';

function FileKindIcon({ name, mimeType }: { name: string; mimeType?: string }) {
  const lower = `${name} ${mimeType || ''}`.toLowerCase();
  if (lower.includes('image') || /\.(png|jpe?g|webp|gif)$/.test(lower)) {
    return <ImageIcon size={13} className="text-[#0e5a49] shrink-0" />;
  }
  if (lower.includes('sheet') || lower.includes('excel') || /\.(xlsx?|csv)$/.test(lower)) {
    return <FileSpreadsheet size={13} className="text-[#0e5a49] shrink-0" />;
  }
  return <FileText size={13} className="text-[#7d5b1c] shrink-0" />;
}

export function AttachmentChips({
  attachments,
  onRemove,
  compact = false,
}: {
  attachments?: AttachmentItem[] | null;
  onRemove?: (id: string) => void;
  compact?: boolean;
}) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${compact ? 'mt-1' : 'mt-2'}`}>
      {attachments.map((att) => {
        const href = normalizeAttachmentUrl(att);
        return (
          <span
            key={att.id}
            className="inline-flex items-center gap-1.5 max-w-full px-2.5 py-1 rounded-full border border-[var(--bw-line-strong)] bg-white dark:bg-[#0f2036] text-[11px] font-semibold text-[var(--bw-ink)] shadow-2xs"
          >
            <FileKindIcon name={att.name} mimeType={att.mimeType} />
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              download={att.dataUrl ? att.name : undefined}
              className="truncate max-w-[170px] hover:text-[#0e5a49] hover:underline inline-flex items-center gap-1"
              title={`Open ${att.name} (${formatFileSize(att.sizeBytes)})`}
            >
              <span className="truncate">{att.name}</span>
              <ExternalLink size={10} className="shrink-0 opacity-60" />
            </a>
            <span className="text-[10px] font-mono-num text-[var(--bw-muted)] shrink-0">
              {formatFileSize(att.sizeBytes)}
            </span>
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(att.id)}
                className="p-0.5 rounded-full hover:bg-red-50 text-[var(--bw-muted)] hover:text-[#9f243b] cursor-pointer"
                aria-label={`Remove ${att.name}`}
              >
                <X size={11} />
              </button>
            )}
          </span>
        );
      })}
    </div>
  );
}

export function AttachmentPicker({
  files,
  onChange,
  label = 'Attachments (PDF, Image, Excel, Word)',
  compact = false,
  existing,
  onRemoveExisting,
  accept = '.pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.csv,.txt',
  maxFiles = 6,
  className = '',
}: {
  files: File[];
  onChange: (next: File[]) => void;
  label?: string;
  compact?: boolean;
  existing?: AttachmentItem[];
  onRemoveExisting?: (id: string) => void;
  accept?: string;
  maxFiles?: number;
  className?: string;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const appendFiles = (list: FileList | File[] | null) => {
    if (!list) return;
    const incoming = Array.from(list);
    const merged = [...files];
    for (const f of incoming) {
      if (merged.length >= maxFiles) break;
      if (!merged.some((e) => e.name === f.name && e.size === f.size)) {
        merged.push(f);
      }
    }
    onChange(merged);
  };

  const removeAt = (idx: number) => {
    onChange(files.filter((_, i) => i !== idx));
  };

  if (compact) {
    return (
      <div className={`space-y-1.5 ${className}`}>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            multiple
            accept={accept}
            onChange={(e) => {
              appendFiles(e.target.files);
              e.target.value = '';
            }}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-dashed border-[var(--bw-line-strong)] bg-white dark:bg-[#0f2036] hover:border-[#0e5a49] hover:text-[#0e5a49] text-[11px] font-bold text-[var(--bw-ink)] transition cursor-pointer"
          >
            <Paperclip size={12} className="text-[#0e5a49]" />
            <span>{label}</span>
            {files.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-[#0b192c] text-[#dfc285] font-mono-num text-[10px]">
                {files.length}
              </span>
            )}
          </button>

          {files.map((f, idx) => (
            <span
              key={`${f.name}-${f.size}-${idx}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#eef2f7] dark:bg-[#132642] border border-[var(--bw-line)] text-[11px] font-semibold text-[var(--bw-ink)]"
            >
              <FileKindIcon name={f.name} mimeType={f.type} />
              <span className="max-w-[140px] truncate">{f.name}</span>
              <span className="text-[10px] font-mono-num text-[var(--bw-muted)]">{formatFileSize(f.size)}</span>
              <button
                type="button"
                onClick={() => removeAt(idx)}
                className="text-[var(--bw-muted)] hover:text-[#9f243b] cursor-pointer"
                aria-label={`Remove ${f.name}`}
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
        {existing && existing.length > 0 && (
          <AttachmentChips attachments={existing} onRemove={onRemoveExisting} compact />
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          appendFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`rounded-xl border border-dashed px-3.5 py-2.5 transition cursor-pointer flex flex-wrap items-center justify-between gap-2 ${
          dragging
            ? 'border-[#0e5a49] bg-[#eaf4f1] dark:bg-[#0f2924]'
            : 'border-[var(--bw-line-strong)] bg-[var(--bw-soft)]/70 hover:border-[#0e5a49]'
        }`}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          multiple
          accept={accept}
          onChange={(e) => {
            appendFiles(e.target.files);
            e.target.value = '';
          }}
          className="hidden"
        />
        <div className="flex items-center gap-2 min-w-0">
          <span className="size-7 rounded-lg bg-[#0b192c] text-[#dfc285] flex items-center justify-center shrink-0">
            <Paperclip size={13} />
          </span>
          <div className="min-w-0">
            <div className="text-[11.5px] font-extrabold text-[var(--bw-ink)] truncate">{label}</div>
            <div className="text-[10.5px] text-[var(--bw-muted)]">
              Click or drop files · PDF, JPG/PNG, Word, Excel (up to 10 MB each)
            </div>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white dark:bg-[#0f2036] border border-[var(--bw-line)] text-[10.5px] font-bold text-[#0e5a49] shrink-0">
          <Upload size={11} /> Browse
        </span>
      </div>

      {files.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {files.map((f, idx) => (
            <span
              key={`${f.name}-${f.size}-${idx}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-[#0f2036] border border-[#0e5a49]/30 text-[11px] font-semibold text-[var(--bw-ink)]"
            >
              <FileKindIcon name={f.name} mimeType={f.type} />
              <span className="max-w-[170px] truncate">{f.name}</span>
              <span className="text-[10px] font-mono-num text-[var(--bw-muted)]">{formatFileSize(f.size)}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeAt(idx);
                }}
                className="text-[var(--bw-muted)] hover:text-[#9f243b] cursor-pointer"
                aria-label={`Remove ${f.name}`}
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      {existing && existing.length > 0 && (
        <AttachmentChips attachments={existing} onRemove={onRemoveExisting} compact />
      )}
    </div>
  );
}
