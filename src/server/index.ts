import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { createBaseApp } from './app.js';

const app = createBaseApp();
const PORT = Number(process.env.PORT || 8088);
const HOST = process.env.HOST || '127.0.0.1';

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

app.listen(PORT, HOST, () => {
  console.log(`[Betterway Mortgages OS] API & Mobile Server live on http://${HOST}:${PORT}`);
  console.log(`[Betterway Mobile App]   PWA live at http://${HOST}:${PORT}/mobile/`);
});
