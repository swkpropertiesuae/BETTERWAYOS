// Backup + restore drill (spec 35). A copy of the database is made, opened as a separate database,
// integrity-checked and compared table by table with the live one. The result is logged as a test row.
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { assertRole, writeAuditLog, type UserRecord } from '@/server/auth';
import { resolveDataDir } from '@/server/db/data-dir';

export function runBackupAndRestoreTest(db: DatabaseSync, actor: UserRecord, dir = resolveDataDir('backups')) {
  assertRole(actor, ['SUPER_ADMIN', 'COMPLIANCE_MLRO']);
  const t0 = Date.now();
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `betterway-os-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`);
  db.exec(`VACUUM INTO '${file.replace(/'/g, "''")}'`);

  const copy = new DatabaseSync(file, { readOnly: true });
  const problems: string[] = [];
  try {
    const integrity = (copy.prepare('PRAGMA integrity_check').get() as { integrity_check: string }).integrity_check;
    if (integrity !== 'ok') problems.push(`integrity_check: ${integrity}`);
    const tables = (db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[]).map((t) => t.name);
    for (const t of tables) {
      const a = (db.prepare(`SELECT COUNT(*) c FROM ${t}`).get() as { c: number }).c;
      const b = (copy.prepare(`SELECT COUNT(*) c FROM ${t}`).get() as { c: number }).c;
      if (a !== b) problems.push(`${t}: live ${a} rows vs backup ${b}`);
    }
    // restore proof: the append-only audit trail and the ledger must read back identically
    const q = (d: DatabaseSync) => JSON.stringify([d.prepare('SELECT MAX(id) m, COUNT(*) c FROM audit_logs').get(), d.prepare('SELECT COALESCE(SUM(debit_fils),0) d, COALESCE(SUM(credit_fils),0) c FROM gl_journal_lines').get()]);
    if (q(db) !== q(copy)) problems.push('audit log or ledger totals differ in the backup');
  } finally { copy.close(); }

  // encrypted vault files live outside the database: confirm every referenced file exists
  const vaultRoot = resolveDataDir();
  const docs = db.prepare('SELECT storage_path FROM vault_documents').all() as { storage_path: string }[];
  const missingFiles = docs.filter((d) => {
    if (!d.storage_path) return false;
    if (path.isAbsolute(d.storage_path)) return !existsSync(d.storage_path);
    return !existsSync(path.resolve(vaultRoot, d.storage_path)) && !existsSync(path.resolve(process.cwd(), d.storage_path));
  }).length;
  if (missingFiles) problems.push(`${missingFiles} vault file(s) referenced in the database are missing on disk`);

  const sha = createHash('sha256').update(readFileSync(file)).digest('hex');
  const seconds = Math.max(1, Math.round((Date.now() - t0) / 1000));
  const status = problems.length ? 'FAIL' : 'PASS';
  const row = { integration_id: 'SQLITE-BACKUP', test_type: 'BACKUP_RESTORE', test_at: new Date().toISOString(), environment: process.env.NODE_ENV || 'local', status, recovery_time: `${seconds}s`, restore_evidence_ref: `${path.basename(file)} sha256:${sha.slice(0, 16)}${problems.length ? ` | ${problems.join('; ')}` : ''}`, action_owner: actor.role };
  const b = db.prepare("INSERT INTO data_batches (spec_no, file_name, source_rows, accepted_rows, created_by) VALUES (35, 'backup-restore-drill', 1, 1, ?)").run(actor.id);
  db.prepare("INSERT INTO data_rows (batch_id, spec_no, row_no, external_id, data_json, status) VALUES (?, 35, 1, ?, ?, 'ACCEPTED')").run(Number(b.lastInsertRowid), `SQLITE-BACKUP|${row.test_at}`, JSON.stringify(row));
  writeAuditLog(db, actor, 'backup', path.basename(file), 'BACKUP_RESTORE_TEST', null, { status, sha256: sha, problems });
  return { file, status, problems, sha256: sha, seconds, vaultFilesMissing: missingFiles };
}
