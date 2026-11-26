import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required in .env.local or environment.');
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Connected to Supabase Postgres.');

  const migrationsDir = path.resolve(process.cwd(), 'supabase/migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`Applying ${file}...`);
    await client.query(sql);
    console.log(`  OK: ${file}`);
  }

  const tablesRes = await client.query(`
    SELECT
      count(*) FILTER (WHERE schemaname = 'public') AS total_tables,
      count(*) FILTER (WHERE schemaname = 'public' AND rowsecurity = true) AS rls_tables
    FROM pg_tables
    WHERE schemaname = 'public';
  `);
  const bucketsRes = await client.query(`SELECT id, public FROM storage.buckets ORDER BY id;`);

  console.log('Public Tables & RLS:', tablesRes.rows[0]);
  console.log('Storage Buckets:', bucketsRes.rows);

  await client.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
