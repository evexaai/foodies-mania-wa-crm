// Zero-dependency static server with live reload. Run: node server.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = import.meta.dirname;
const PORT = Number(process.env.PORT) || 5500;

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
const watched = ['index.html', 'css', 'js', 'assets'];
for (const w of watched) {
  const p = path.join(ROOT, w);
  if (fs.existsSync(p)) fs.watch(p, { recursive: true }, () => { token = Date.now(); });
}

const RELOAD = `<script>
(function(){var t=null;setInterval(function(){
  fetch('/__reload').then(function(r){return r.text()}).then(function(v){
    if(t===null){t=v}else if(t!==v){location.reload()}
  }).catch(function(){});
},700)})();
</script>`;

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);

  if (url === '/__reload') {
    res.writeHead(200, { 'content-type': 'text/plain', 'cache-control': 'no-store' });
    return res.end(String(token));
  }

  const rel = url === '/' ? 'index.html' : url.replace(/^\/+/, '');
  const file = path.join(ROOT, rel);

  // Never serve outside the project folder.
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }

  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { 'content-type': 'text/plain' }); return res.end('Not found: ' + rel); }
    const ext = path.extname(file).toLowerCase();
    const type = TYPES[ext] || 'application/octet-stream';
    if (ext === '.html') buf = Buffer.concat([buf, Buffer.from(RELOAD)]);
    res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' });
    res.end(buf);
  });
}).listen(PORT, () => {
  console.log(`\n  Foodies Mania CRM\n  ➜  http://localhost:${PORT}/\n  (live reload on; Ctrl+C to stop)\n`);
});
