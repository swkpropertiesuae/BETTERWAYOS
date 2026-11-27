import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import fs from 'node:fs';
import path from 'node:path';
import { getSupabaseAdmin } from '../src/lib/supabase/admin';
import { buildMasterBackupWorkbook } from '../src/lib/backup/master-workbook';
import { buildUpdated2026BankMatrixWorkbook } from '../src/lib/backup/bank-matrix-workbook';

async function main() {
  const db = await getSupabaseAdmin();
  const [result, matrix] = await Promise.all([
    buildMasterBackupWorkbook(db, null),
    buildUpdated2026BankMatrixWorkbook(),
  ]);

  const outDir = path.join(process.cwd(), 'backups', 'daily');
  fs.mkdirSync(outDir, { recursive: true });
  const xlsxPath = path.join(outDir, result.filename);
  const jsonPath = path.join(outDir, result.filename.replace(/\.xlsx$/i, '.json'));
  const matrixPath = path.join(outDir, matrix.filename);

  fs.writeFileSync(xlsxPath, result.buffer);
  fs.writeFileSync(jsonPath, JSON.stringify(result.snapshotJson, null, 2), 'utf8');
  fs.writeFileSync(matrixPath, matrix.buffer);

  let cloudUploaded = false;
  try {
    await db.storage.createBucket('daily-backups', { public: false }).catch(() => {});
    const { error } = await db.storage.from('daily-backups').upload(result.filename, result.buffer, {
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      upsert: true,
    });
    await db.storage.from('daily-backups').upload(matrix.filename, matrix.buffer, {
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      upsert: true,
    });
    if (!error) cloudUploaded = true;
  } catch {
    /* optional */
  }

  console.log(
    JSON.stringify(
      {
        status: 'DAILY_BACKUP_SUCCESS',
        file: xlsxPath,
        jsonManifest: jsonPath,
        matrixFile: matrixPath,
        matrixSheets: matrix.sheetCount,
        matrixBanks: matrix.bankCount,
        matrixRms: matrix.rmCount,
        sheetCount: result.sheetCount,
        totalRows: result.totalRows,
        sizeBytes: result.buffer.length,
        matrixSizeBytes: matrix.buffer.length,
        sha256: result.sha256,
        cloudUploaded,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
