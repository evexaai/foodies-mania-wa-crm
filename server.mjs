// Static server with live reload, and the same /api functions Vercel runs.
// Run: node server.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = import.meta.dirname;
const PORT = Number(process.env.PORT) || 5500;

// A .env beside this file, so DATABASE_URL can live there in development.
// Anything already in the environment wins, and the file is never committed.
try {
  for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '');
  }
} catch {}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.webp': 'image/webp',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
};

// Browsers hold this open; every save bumps the token and the page reloads.
let token = Date.now();
const watched = ['dashboard', 'website'];
for (const w of watched) {
  const p = path.join(ROOT, w);
  // Only code changes reload the page. Photos being copied in (a new menu,
  // say) arrive one by one and would otherwise reload every open tab each time.
  if (fs.existsSync(p)) fs.watch(p, { recursive: true }, (e, f) => {
    if (!f || /\.(html|css|js|mjs|json|webmanifest)$/i.test(f)) token = Date.now();
  });
}

const RELOAD = `<script>
(function(){var t=null;setInterval(function(){
  fetch('/__reload').then(function(r){return r.text()}).then(function(v){
    if(t===null){t=v}else if(t!==v){location.reload()}
  }).catch(function(){});
},700)})();
</script>`;

/**
 * /api in development.
 *
 * The files under api/ are ordinary Vercel Node functions, so the same code
 * serves both: here they are handed a request and a response dressed up the
 * way Vercel dresses them, and nothing in the functions knows the difference.
 */
async function runApi(req, res, name, query) {
  const file = path.join(ROOT, 'api', name + '.js');
  if (!fs.existsSync(file)) { res.writeHead(404, { 'content-type': 'application/json' }); return res.end('{"error":"no such endpoint"}') }

  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');

  req.query = query;
  req.body = raw && /json/.test(req.headers['content-type'] || '') ? JSON.parse(raw) : raw;
  res.status = code => { res.statusCode = code; return res };
  res.json = obj => { res.setHeader('content-type', 'application/json; charset=utf-8'); res.end(JSON.stringify(obj)); return res };

  try {
    // a fresh import each time, so editing a function does not need a restart
    const mod = await import(pathToFileURL(file).href + '?v=' + Date.now());
    await mod.default(req, res);
  } catch (e) {
    console.error(`api/${name}:`, e);
    if (!res.headersSent) { res.statusCode = 500; res.setHeader('content-type', 'application/json') }
    res.end(JSON.stringify({ error: String(e && e.message || e) }));
  }
}

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);

  if (url.startsWith('/api/')) {
    const name = url.slice(5).replace(/[^\w-]/g, '');
    const query = Object.fromEntries(new URL(req.url, 'http://x').searchParams);
    return runApi(req, res, name, query);
  }

  if (url === '/__reload') {
    res.writeHead(200, { 'content-type': 'text/plain', 'cache-control': 'no-store' });
    return res.end(String(token));
  }

  // The root has no page of its own: send it to the dashboard, as on Vercel.
  if (url === '/') { res.writeHead(302, { location: '/dashboard/' }); return res.end(); }

  let rel = url.replace(/^\/+/, '');
  let file = path.join(ROOT, rel);

  // Never serve outside the project folder.
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }

  // Folders serve their index.html (/dashboard/ and /website/), and
  // clean URLs like /website/order-chat find order-chat.html, as on Vercel.
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    if (!url.endsWith('/')) { res.writeHead(301, { location: url + '/' }); return res.end(); }
    rel = path.join(rel, 'index.html'); file = path.join(ROOT, rel);
  } else if (!path.extname(file) && fs.existsSync(file + '.html')) {
    rel += '.html'; file += '.html';
  }

  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { 'content-type': 'text/plain' }); return res.end('Not found: ' + rel); }
    const ext = path.extname(file).toLowerCase();
    const type = TYPES[ext] || 'application/octet-stream';
    if (ext === '.html') buf = Buffer.concat([buf, Buffer.from(RELOAD)]);
    res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' });
    res.end(buf);
  });
}).listen(PORT, () => {
  console.log(`\n  Foodies Mania\n  ➜  Dashboard:    http://localhost:${PORT}/dashboard/\n  ➜  Website:      http://localhost:${PORT}/website/\n  ➜  Chat to order: http://localhost:${PORT}/website/order-chat\n  (live reload on; Ctrl+C to stop)\n`);
});
