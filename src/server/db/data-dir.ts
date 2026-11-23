import { mkdirSync } from 'node:fs';
import path from 'node:path';

/**
 * Resolves a writable data directory for SQLite, encrypted vault files, and backup drills.
 * - Uses BW_OS_DATA_DIR when configured (Docker volume, Railway/Render persistent disk, VPS).
 * - Uses /tmp/betterway-os on Vercel serverless where /var/task is read-only (prevents EROFS).
 * - Defaults to <cwd>/data locally.
 */
export function resolveDataDir(...segments: string[]): string {
  const base = process.env.BW_OS_DATA_DIR
    ? path.resolve(process.env.BW_OS_DATA_DIR)
    : process.env.VERCEL
      ? path.join('/tmp', 'betterway-os')
      : path.resolve(process.cwd(), 'data');
  const full = segments.length > 0 ? path.join(base, ...segments) : base;
  mkdirSync(full, { recursive: true });
  return full;
}
