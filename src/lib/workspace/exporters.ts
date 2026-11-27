'use client';

import { DEFAULT_BROCHURE_THEME, type BrochureThemeConfig } from './domain';

export interface ExportDocumentPayload {
  filename: string;
  title: string;
  subtitle?: string;
  badge?: string;
  metaPairs?: Array<{ label: string; value: string }>;
  sections?: Array<{ heading: string; rows?: Array<{ label: string; value: string }>; text?: string }>;
  bodyText?: string;
  sealedBy?: string;
  theme?: BrochureThemeConfig;
}

function escHtml(v: string): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 500);
}

/** Builds clean MS-Word / Print-PDF branded HTML using Betterway Mortgages LLC official identity. */
export function buildBrandedDocumentHtml(payload: ExportDocumentPayload): string {
  const theme = payload.theme ?? DEFAULT_BROCHURE_THEME;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const logoSrc = `${origin}/brand/logo-horizontal-dark.png`;

  const metaHtml = payload.metaPairs?.length
    ? `<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:12px;">
        <tbody>
          ${payload.metaPairs
            .map(
              (m) => `<tr>
                <td style="padding:7px 10px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:700;width:32%;color:${theme.inkHex};">${escHtml(m.label)}</td>
                <td style="padding:7px 10px;border:1px solid #e2e8f0;color:#0f172a;">${escHtml(m.value)}</td>
              </tr>`,
            )
            .join('')}
        </tbody>
      </table>`
    : '';

  const sectionsHtml = (payload.sections ?? [])
    .map(
      (sec) => `<div style="margin:18px 0;">
        <h3 style="margin:0 0 8px 0;padding-bottom:4px;border-bottom:2px solid ${theme.accentHex};color:${theme.primaryHex};font-size:14px;text-transform:uppercase;letter-spacing:0.06em;">${escHtml(sec.heading)}</h3>
        ${sec.text ? `<p style="white-space:pre-wrap;font-size:12.5px;line-height:1.65;color:#1e293b;margin:6px 0;">${escHtml(sec.text)}</p>` : ''}
        ${
          sec.rows?.length
            ? `<table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:6px;">
                ${sec.rows
                  .map(
                    (r) => `<tr>
                      <td style="padding:6px 10px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:700;width:34%;">${escHtml(r.label)}</td>
                      <td style="padding:6px 10px;border:1px solid #e2e8f0;">${escHtml(r.value)}</td>
                    </tr>`,
                  )
                  .join('')}
              </table>`
            : ''
        }
      </div>`,
    )
    .join('');

  const bodyHtml = payload.bodyText
    ? `<div style="margin:16px 0;padding:16px 18px;border:1px solid #e2e8f0;border-radius:8px;background:#ffffff;white-space:pre-wrap;font-size:12.5px;line-height:1.7;color:#0f172a;">${escHtml(payload.bodyText)}</div>`
    : '';

  const sealHtml = payload.sealedBy
    ? `<div style="margin-top:24px;padding:12px 16px;border:2px solid ${theme.accentHex};background:#fffdf4;border-radius:8px;display:inline-block;">
        <div style="font-size:10px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:${theme.primaryHex};">BETTERWAY MORTGAGES LLC — OFFICIAL OWNER SEAL</div>
        <div style="font-size:12px;font-weight:700;color:#0D8A6A;margin-top:4px;">Authorised &amp; Sealed by ${escHtml(payload.sealedBy)}</div>
      </div>`
    : '';

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" lang="en">
<head>
<meta charset="utf-8" />
<title>${escHtml(payload.title)}</title>
</head>
<body style="font-family:Calibri,Arial,sans-serif;margin:0;padding:24px;background:${theme.surfaceHex};color:${theme.inkHex};">
  <div style="max-width:820px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
    <div style="background:${theme.primaryHex};color:#ffffff;padding:22px 26px;border-bottom:4px solid ${theme.accentHex};">
      <img src="${logoSrc}" alt="Betterway Mortgages LLC" style="height:36px;margin-bottom:10px;" />
      ${payload.badge ? `<div style="font-size:10px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:${theme.accentHex};margin-bottom:4px;">${escHtml(payload.badge)}</div>` : ''}
      <h1 style="margin:0;font-size:21px;line-height:1.25;">${escHtml(payload.title)}</h1>
      ${payload.subtitle ? `<p style="margin:6px 0 0 0;font-size:12px;color:#cbd5e1;">${escHtml(payload.subtitle)}</p>` : ''}
    </div>
    <div style="padding:22px 26px;">
      ${metaHtml}
      ${sectionsHtml}
      ${bodyHtml}
      ${sealHtml}
      <div style="margin-top:26px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:10.5px;color:#64748b;">
        ${escHtml(theme.footerNote)} · Generated ${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dubai' })} GST
      </div>
    </div>
  </div>
</body>
</html>`;
}

/** Downloads an editable Microsoft Word (.doc) document with Betterway letterhead & tables. */
export function downloadWordDocument(payload: ExportDocumentPayload) {
  const html = buildBrandedDocumentHtml(payload);
  const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' });
  const cleanName = payload.filename.replace(/\.(docx?|html|pdf|jpe?g)$/i, '');
  triggerDownload(blob, `${cleanName}.doc`);
}

/** Opens a crisp printable view for Save-as-PDF / Print. */
export function printBrandedDocument(payload: ExportDocumentPayload) {
  const html = buildBrandedDocumentHtml(payload);
  const w = window.open('', '_blank', 'width=920,height=1050');
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
  setTimeout(() => {
    w.focus();
    w.print();
  }, 350);
}

function wrapCanvasLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const paragraphs = String(text ?? '').split(/\r?\n/);
  const out: string[] = [];
  for (const para of paragraphs) {
    if (!para.trim()) {
      out.push('');
      continue;
    }
    const words = para.split(/\s+/);
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        out.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) out.push(line);
  }
  return out;
}

async function loadImageSafe(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Renders a crisp high-resolution A4-proportioned JPEG (.jpg) directly in browser using official Betterway brand assets. */
export async function downloadJpegDocument(payload: ExportDocumentPayload) {
  const theme = payload.theme ?? DEFAULT_BROCHURE_THEME;
  const width = 1240;
  const padX = 72;
  const contentW = width - padX * 2;

  // Measure lines first to compute exact dynamic height (never clips multi-page contracts or dossiers)
  const measureCanvas = document.createElement('canvas');
  const mctx = measureCanvas.getContext('2d');
  if (!mctx) return;

  type DrawOp =
    | { kind: 'heading'; text: string }
    | { kind: 'kv'; label: string; value: string }
    | { kind: 'line'; text: string }
    | { kind: 'spacer'; h: number };

  const ops: DrawOp[] = [];
  if (payload.metaPairs?.length) {
    ops.push({ kind: 'heading', text: 'KEY SUMMARY & DETAILS' });
    for (const m of payload.metaPairs) {
      ops.push({ kind: 'kv', label: m.label, value: m.value });
    }
    ops.push({ kind: 'spacer', h: 18 });
  }

  for (const sec of payload.sections ?? []) {
    ops.push({ kind: 'heading', text: sec.heading.toUpperCase() });
    if (sec.rows?.length) {
      for (const r of sec.rows) ops.push({ kind: 'kv', label: r.label, value: r.value });
    }
    if (sec.text) {
      mctx.font = '400 22px "Segoe UI", Arial, sans-serif';
      for (const ln of wrapCanvasLines(mctx, sec.text, contentW - 24)) {
        ops.push({ kind: 'line', text: ln });
      }
    }
    ops.push({ kind: 'spacer', h: 18 });
  }

  if (payload.bodyText) {
    ops.push({ kind: 'heading', text: 'DOCUMENT CONTENT' });
    mctx.font = '400 22px "Segoe UI", Arial, sans-serif';
    for (const ln of wrapCanvasLines(mctx, payload.bodyText, contentW - 24)) {
      ops.push({ kind: 'line', text: ln });
    }
  }

  const headerH = 260;
  const footerH = payload.sealedBy ? 210 : 120;
  let bodyH = 40;
  for (const op of ops) {
    if (op.kind === 'heading') bodyH += 50;
    else if (op.kind === 'kv') bodyH += 44;
    else if (op.kind === 'line') bodyH += 32;
    else bodyH += op.h;
  }

  const height = Math.max(1754, headerH + bodyH + footerH);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Page Background
  ctx.fillStyle = theme.surfaceHex === '#111A2E' ? '#0B1222' : '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Subtle Outer Luxury Border
  ctx.strokeStyle = theme.accentHex;
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  // Executive Header Band
  ctx.fillStyle = theme.primaryHex;
  ctx.fillRect(22, 22, width - 44, headerH - 22);
  ctx.fillStyle = theme.accentHex;
  ctx.fillRect(22, headerH, width - 44, 8);

  // Official Betterway Logo
  const logo = await loadImageSafe('/brand/logo-horizontal-dark.png');
  if (logo) {
    const targetH = 54;
    const targetW = (logo.width / Math.max(1, logo.height)) * targetH;
    ctx.drawImage(logo, padX, 52, targetW, targetH);
  } else {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 32px "Segoe UI", Arial, sans-serif';
    ctx.fillText('BETTERWAY MORTGAGES LLC', padX, 92);
  }

  // Badge + Title + Subtitle
  ctx.fillStyle = theme.accentHex;
  ctx.font = '700 18px "Segoe UI", Arial, sans-serif';
  ctx.fillText((payload.badge || 'BETTERWAY MORTGAGES OS · OFFICIAL DOCUMENT').toUpperCase(), padX, 146);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 34px "Segoe UI", Arial, sans-serif';
  const titleLines = wrapCanvasLines(ctx, payload.title, contentW);
  ctx.fillText(titleLines[0] || payload.title, padX, 194);
  if (payload.subtitle) {
    ctx.fillStyle = '#CBD5E1';
    ctx.font = '400 20px "Segoe UI", Arial, sans-serif';
    ctx.fillText(payload.subtitle.slice(0, 95), padX, 232);
  }

  // Draw Body Operations
  const isDarkSurface = theme.surfaceHex === '#111A2E';
  const textInk = isDarkSurface ? '#F8FAFC' : '#0F172A';
  const mutedInk = isDarkSurface ? '#CBD5E1' : '#475569';
  const rowBg = isDarkSurface ? '#15223B' : '#F8FAFC';

  let y = headerH + 54;
  for (const op of ops) {
    if (op.kind === 'heading') {
      ctx.fillStyle = isDarkSurface ? theme.accentHex : theme.primaryHex;
      ctx.font = '800 22px "Segoe UI", Arial, sans-serif';
      ctx.fillText(op.text, padX, y);
      ctx.fillStyle = theme.accentHex;
      ctx.fillRect(padX, y + 10, contentW, 2);
      y += 46;
    } else if (op.kind === 'kv') {
      ctx.fillStyle = rowBg;
      ctx.fillRect(padX, y - 26, contentW, 38);
      ctx.fillStyle = mutedInk;
      ctx.font = '700 19px "Segoe UI", Arial, sans-serif';
      ctx.fillText(op.label.slice(0, 34), padX + 14, y);
      ctx.fillStyle = textInk;
      ctx.font = '600 19px "Segoe UI", Arial, sans-serif';
      ctx.fillText(String(op.value || '—').slice(0, 62), padX + 370, y);
      y += 44;
    } else if (op.kind === 'line') {
      ctx.fillStyle = textInk;
      ctx.font = '400 22px "Segoe UI", Arial, sans-serif';
      if (op.text) ctx.fillText(op.text, padX + 8, y);
      y += 32;
    } else {
      y += op.h;
    }
  }

  // Seal Badge
  if (payload.sealedBy) {
    const sealY = height - 180;
    ctx.strokeStyle = theme.accentHex;
    ctx.lineWidth = 3;
    ctx.fillStyle = isDarkSurface ? '#12203A' : '#FFFDF4';
    ctx.fillRect(padX, sealY, 540, 86);
    ctx.strokeRect(padX, sealY, 540, 86);
    ctx.fillStyle = theme.accentHex;
    ctx.font = '800 15px "Segoe UI", Arial, sans-serif';
    ctx.fillText('BETTERWAY MORTGAGES LLC · OFFICIAL OWNER SEAL', padX + 18, sealY + 32);
    ctx.fillStyle = '#0D8A6A';
    ctx.font = '700 20px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`Authorised & Sealed by ${payload.sealedBy}`, padX + 18, sealY + 64);
  }

  // Footer
  ctx.fillStyle = mutedInk;
  ctx.font = '400 17px "Segoe UI", Arial, sans-serif';
  ctx.fillText(
    `${theme.footerNote} · ${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dubai' })} GST`,
    padX,
    height - 52,
  );

  canvas.toBlob(
    (blob) => {
      if (!blob) return;
      const cleanName = payload.filename.replace(/\.(docx?|html|pdf|jpe?g)$/i, '');
      triggerDownload(blob, `${cleanName}.jpeg`);
    },
    'image/jpeg',
    0.94,
  );
}

/** Downloads clean UTF-8 CSV for Excel/Accounting export. */
export function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  const esc = (v: string | number) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\r\n');
  const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' });
  const cleanName = filename.replace(/\.csv$/i, '');
  triggerDownload(blob, `${cleanName}.csv`);
}
