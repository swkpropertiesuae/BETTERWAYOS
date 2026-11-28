import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { logAudit } from '@/lib/auth/approvals';
import type { AttachmentItem } from '@/lib/workspace/attachments-types';
import {
  deleteScopeAttachment,
  getTaskMeta,
  listScopeAttachments,
  saveScopeAttachments,
} from '@/lib/workspace/task-followups-server';

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB per file
const INLINE_FALLBACK_MAX = 512 * 1024; // 512 KB inline fallback if storage bucket rejects mime

const CLIENT_VAULT_MIMES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
]);

const FAST_TRACK_MIMES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

function inferMimeType(fileName: string, provided?: string): string {
  const clean = (provided || '').trim().toLowerCase();
  if (clean && clean !== 'application/octet-stream') return clean;
  const ext = fileName.toLowerCase().split('.').pop() || '';
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt: 'text/plain',
  };
  return map[ext] || 'application/octet-stream';
}

function pickBucket(mime: string): { bucket: 'client-vault' | 'privacy-fast-track'; uploadMime: string } {
  if (CLIENT_VAULT_MIMES.has(mime)) return { bucket: 'client-vault', uploadMime: mime };
  if (FAST_TRACK_MIMES.has(mime)) return { bucket: 'privacy-fast-track', uploadMime: mime };
  return { bucket: 'client-vault', uploadMime: 'text/csv' };
}

function sanitizeSegment(raw: string, fallback: string): string {
  const clean = raw
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 96);
  return clean || fallback;
}

export async function GET(req: Request) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;

  const url = new URL(req.url);
  const scope = url.searchParams.get('scope')?.trim() || 'general';
  const entityId = url.searchParams.get('entityId')?.trim() || 'default';
  const id = url.searchParams.get('id')?.trim();
  const download = url.searchParams.get('download') === '1';

  const db = await getSupabaseAdmin();
  let items = await listScopeAttachments(db, scope, entityId);

  if (id) {
    let target = items.find((a) => a.id === id);
    if (!target && scope === 'task') {
      const meta = await getTaskMeta(db, entityId);
      for (const fu of meta.followUps) {
        const hit = (fu.attachments ?? []).find((a) => a.id === id);
        if (hit) {
          target = hit;
          break;
        }
      }
    }
    if (!target) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    const safeName = target.name.replace(/["\r\n]/g, '_');
    const disposition = download ? 'attachment' : 'inline';

    if (target.storagePath) {
      const [bucketPart, ...rest] = target.storagePath.includes(':')
        ? target.storagePath.split(':')
        : ['client-vault', target.storagePath];
      const pathInBucket = rest.join(':');
      const bucketName = bucketPart === 'privacy-fast-track' ? 'privacy-fast-track' : 'client-vault';
      const { data: blob, error: dlErr } = await db.storage.from(bucketName).download(pathInBucket);
      if (!dlErr && blob) {
        const buf = await blob.arrayBuffer();
        return new NextResponse(buf, {
          status: 200,
          headers: {
            'Content-Type': target.mimeType || 'application/octet-stream',
            'Content-Disposition': `${disposition}; filename="${safeName}"`,
            'Cache-Control': 'private, max-age=60',
          },
        });
      }
    }

    if (target.dataUrl) {
      const match = /^data:([^;]+);base64,(.+)$/.exec(target.dataUrl);
      if (match) {
        const buf = Buffer.from(match[2], 'base64');
        return new NextResponse(buf, {
          status: 200,
          headers: {
            'Content-Type': match[1] || target.mimeType || 'application/octet-stream',
            'Content-Disposition': `${disposition}; filename="${safeName}"`,
            'Cache-Control': 'private, max-age=60',
          },
        });
      }
    }

    return NextResponse.json({ error: 'Attachment payload unavailable' }, { status: 404 });
  }

  return NextResponse.json({ attachments: items });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;

  try {
    const formData = await req.formData();
    const scope = sanitizeSegment(String(formData.get('scope') || 'general'), 'general');
    const entityId = sanitizeSegment(String(formData.get('entityId') || 'default'), 'default');

    const rawEntries = [...formData.getAll('files'), ...formData.getAll('file')];
    const files = rawEntries.filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length === 0) {
      return NextResponse.json({ error: 'Please select at least one file to attach.' }, { status: 400 });
    }

    const db = await getSupabaseAdmin();
    const nowIso = new Date().toISOString();
    const uploaded: AttachmentItem[] = [];

    for (const file of files) {
      if (file.size > MAX_BYTES) {
        return NextResponse.json({ error: `${file.name} exceeds the 15 MB limit.` }, { status: 400 });
      }
      const id = `att-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      const mimeType = inferMimeType(file.name, file.type);
      const safeName = sanitizeSegment(file.name, 'attachment');
      const { bucket, uploadMime } = pickBucket(mimeType);
      const storageKey = `attachments/${scope}/${entityId}/${Date.now()}-${safeName}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      let storagePath: string | null = null;
      let dataUrl: string | null = null;

      const { error: upErr } = await db.storage.from(bucket).upload(storageKey, buffer, {
        contentType: uploadMime,
        upsert: false,
      });

      if (!upErr) {
        storagePath = `${bucket}:${storageKey}`;
      } else if (file.size <= INLINE_FALLBACK_MAX) {
        dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
      } else {
        throw new Error(`Upload failed for ${file.name}: ${upErr.message}`);
      }

      uploaded.push({
        id,
        name: file.name,
        mimeType,
        sizeBytes: file.size,
        scope,
        entityId,
        storagePath,
        dataUrl,
        downloadUrl: `/api/v1/attachments?scope=${encodeURIComponent(scope)}&entityId=${encodeURIComponent(entityId)}&id=${encodeURIComponent(id)}&download=1`,
        uploadedBy: auth.user.id,
        uploadedByName: auth.user.name,
        uploadedAt: nowIso,
      });
    }

    await saveScopeAttachments(db, scope, entityId, uploaded, auth.user.id);
    await logAudit(auth.user, 'attachments', `${scope}:${entityId}`, 'ATTACHMENTS_UPLOADED', {
      scope,
      entityId,
      count: uploaded.length,
      names: uploaded.map((u) => u.name),
    });

    return NextResponse.json({ ok: true, attachments: uploaded }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Attachment upload failed' },
      { status: 400 },
    );
  }
}

export async function DELETE(req: Request) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;

  const url = new URL(req.url);
  const scope = url.searchParams.get('scope')?.trim() || 'general';
  const entityId = url.searchParams.get('entityId')?.trim() || 'default';
  const id = url.searchParams.get('id')?.trim();
  if (!id) return NextResponse.json({ error: 'Attachment id is required' }, { status: 400 });

  const db = await getSupabaseAdmin();
  const existing = await listScopeAttachments(db, scope, entityId);
  const target = existing.find((a) => a.id === id);

  if (target?.storagePath) {
    const [bucketPart, ...rest] = target.storagePath.includes(':')
      ? target.storagePath.split(':')
      : ['client-vault', target.storagePath];
    const bucketName = bucketPart === 'privacy-fast-track' ? 'privacy-fast-track' : 'client-vault';
    await db.storage.from(bucketName).remove([rest.join(':')]).catch(() => {});
  }

  const next = await deleteScopeAttachment(db, scope, entityId, id, auth.user.id);
  await logAudit(auth.user, 'attachments', `${scope}:${entityId}`, 'ATTACHMENT_DELETED', {
    scope,
    entityId,
    id,
    name: target?.name,
  });

  return NextResponse.json({ ok: true, attachments: next });
}
