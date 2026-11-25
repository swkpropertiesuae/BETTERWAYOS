import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { seedIfEmpty } from './db.js';
import { initSwkParitySchemaAndSeed } from './swk-parity-db.js';
import { apiRouter } from './api.js';

seedIfEmpty();
initSwkParitySchemaAndSeed();

const app = express();
const PORT = Number(process.env.PORT || 8088);

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json({ limit: '4mb' }));

// Mount full Betterway OS REST API
app.use('/api', apiRouter);

// Serve Dedicated Betterway Mobile App (PWA + Capacitor) at /mobile
const mobileDir = path.resolve(process.cwd(), 'mobile');
if (fs.existsSync(mobileDir)) {
  app.use('/mobile', express.static(mobileDir, { index: 'index.html' }));
}

// Serve static public brand/bank/staff/image/video assets directly in dev/prod
const publicDir = path.resolve(process.cwd(), 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

// Serve built Web OS SPA in production
const distWebDir = path.resolve(process.cwd(), 'dist', 'web');
if (fs.existsSync(distWebDir)) {
  app.use(express.static(distWebDir));
  app.get('/{*splat}', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/mobile') || req.path.startsWith('/.')) return next();
    res.sendFile('index.html', { root: distWebDir, dotfiles: 'allow' }, (err) => {
      if (err && !res.headersSent) res.status(404).end();
    });
  });
}

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = Number(err?.status || err?.statusCode || 500);
  if (!res.headersSent) res.status(status).json({ error: err?.message || 'Unexpected server error' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`[Betterway Mortgages OS] API & Mobile Server live on http://127.0.0.1:${PORT}`);
  console.log(`[Betterway Mobile App]   PWA live at http://127.0.0.1:${PORT}/mobile/`);
});
