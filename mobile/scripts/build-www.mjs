import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const www = path.join(root, 'www');
const checkOnly = process.argv.includes('--check');

const FILES = ['index.html', 'style.css', 'app.js', 'sw.js', 'manifest.webmanifest'];

// Static CSP security gate (zero inline script, event handlers, or inline style attributes)
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
if (/\son[a-z]+\s*=/i.test(html)) {
  console.error('FAIL: Inline DOM event handler found in mobile/index.html');
  process.exit(1);
}
if (/style="/i.test(html) || /style="/i.test(js)) {
  console.error('FAIL: Inline style attribute found (violates strict CSP style-src self)');
  process.exit(1);
}
if (!html.includes('Content-Security-Policy')) {
  console.error('FAIL: Missing strict Content-Security-Policy in mobile/index.html');
  process.exit(1);
}

if (checkOnly) {
  console.log('PASS: Betterway Mobile strict CSP & manifest check passed.');
  process.exit(0);
}

fs.rmSync(www, { recursive: true, force: true });
fs.mkdirSync(www, { recursive: true });
for (const f of FILES) {
  fs.copyFileSync(path.join(root, f), path.join(www, f));
}
fs.cpSync(path.join(root, 'assets'), path.join(www, 'assets'), { recursive: true });
console.log(`Built Betterway Mobile Capacitor www/ bundle cleanly (${FILES.length} core files + assets/).`);
