import fs from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { buildMasterBackupWorkbook } from '@/lib/backup/master-workbook';

async function runDailyBackupJob(actorRole: string, actorLabel: string) {
  const db = await getSupabaseAdmin();
  const result = await buildMasterBackupWorkbook(db, null);

  let localSavedPath: string | null = null;
  try {
    const dir = path.join(process.cwd(), 'backups', 'daily');
    fs.mkdirSync(dir, { recursive: true });
    const xlsxPath = path.join(dir, result.filename);
    const jsonPath = path.join(dir, result.filename.replace(/\.xlsx$/i, '.json'));
    fs.writeFileSync(xlsxPath, result.buffer);
    fs.writeFileSync(jsonPath, JSON.stringify(result.snapshotJson, null, 2), 'utf8');
    localSavedPath = `backups/daily/${result.filename}`;
  } catch {
    // Serverless read-only filesystem on Vercel — cloud storage & audit log still succeed
  }

  let cloudStoragePath: string | null = null;
  try {
    await db.storage.createBucket('daily-backups', { public: false }).catch(() => {});
    const { error } = await db.storage.from('daily-backups').upload(result.filename, result.buffer, {
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      upsert: true,
    });
    if (!error) cloudStoragePath = `supabase://daily-backups/${result.filename}`;
  } catch {
    /* optional cloud bucket */
  }

  try {
    await db.from('audit_events').insert({
      actor_role: actorRole,
      action: 'DAILY_BACKUP_COMPLETED',
      entity_table: 'master_backup_excel',
      entity_id: result.filename,
      metadata: {
        actor: actorLabel,
        generatedAtDubai: result.generatedAtDubai,
        sheetCount: result.sheetCount,
        totalRows: result.totalRows,
        sha256: result.sha256,
        localSavedPath,
        cloudStoragePath,
        counts: result.counts,
      },
    });
  } catch {
    /* ignore if audit table schema differs */
  }

  return {
    ok: true,
    filename: result.filename,
    generatedAtDubai: result.generatedAtDubai,
    sheetCount: result.sheetCount,
    totalRows: result.totalRows,
    sha256: result.sha256,
    localSavedPath,
    cloudStoragePath,
    counts: result.counts,
    downloadUrl: '/api/v1/utilities/master-backup-excel',
  };
}

export async function GET(req: Request) {
  // Support automated Vercel Cron execution (00:00 Dubai GST / 20:00 UTC daily)
  const isVercelCron = req.headers.get('x-vercel-cron') === '1';
  const cronSecret = process.env.CRON_SECRET;
  const bearer = req.headers.get('authorization');
  if (isVercelCron || (cronSecret && bearer === `Bearer ${cronSecret}`)) {
    const out = await runDailyBackupJob('SYSTEM_CRON', 'Automated 00:00 Dubai GST Daily Backup');
    return NextResponse.json(out);
  }

  const auth = await requireSession();
  if ('error' in auth) return auth.error;

  const db = await getSupabaseAdmin();
  const { data: logs } = await db
    .from('audit_events')
    .select('id,action,entity_id,metadata,created_at')
    .eq('action', 'DAILY_BACKUP_COMPLETED')
    .order('created_at', { ascending: false })
    .limit(15);

  const localFiles: Array<{ name: string; sizeKb: number; modifiedAt: string }> = [];
  try {
    const dir = path.join(process.cwd(), 'backups', 'daily');
    if (fs.existsSync(dir)) {
      for (const f of fs.readdirSync(dir)) {
        if (!f.endsWith('.xlsx')) continue;
        const st = fs.statSync(path.join(dir, f));
        localFiles.push({ name: f, sizeKb: Math.round(st.size / 1024), modifiedAt: st.mtime.toISOString() });
      }
      localFiles.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
    }
  } catch {
    /* ignore */
  }

  return NextResponse.json({
    schedule: 'Daily at 00:00 Asia/Dubai (GST) via Vercel Cron + GitHub Actions',
    downloadUrl: '/api/v1/utilities/master-backup-excel',
    history: logs ?? [],
    localFiles: localFiles.slice(0, 14),
  });
}

export async function POST() {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  if (auth.user.role !== 'OWNER' && auth.user.role !== 'OFFICE_ADMIN') {
    return NextResponse.json({ error: 'Only Owners & Office Admin can trigger company-wide backups.' }, { status: 403 });
  }
  const out = await runDailyBackupJob(auth.user.role, auth.user.name);
  return NextResponse.json(out);
}
