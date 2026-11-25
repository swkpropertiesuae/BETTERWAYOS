import express from 'express';
import cors from 'cors';
import { seedIfEmpty } from './db.js';
import { initSwkParitySchemaAndSeed } from './swk-parity-db.js';
import { apiRouter } from './api.js';

let initialized = false;
export function ensureDatabaseReady() {
  if (initialized) return;
  seedIfEmpty();
  initSwkParitySchemaAndSeed();
  initialized = true;
}

export function createBaseApp() {
  ensureDatabaseReady();
  const app = express();
  app.set('trust proxy', 1);
  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '4mb' }));

  // Mount full Betterway OS REST API
  app.use('/api', apiRouter);

  return app;
}

// Ready-to-export serverless Express instance for Vercel Functions (api/index.ts & api/[...path].ts)
export const serverlessApp = createBaseApp();
serverlessApp.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = Number(err?.status || err?.statusCode || 500);
  if (!res.headersSent) res.status(status).json({ error: err?.message || 'Unexpected server error' });
});
