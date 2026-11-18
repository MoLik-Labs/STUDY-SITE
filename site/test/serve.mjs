// Máy chủ thử cục bộ, mô phỏng thứ tự phục vụ của Cloudflare Workers Static Assets:
// tệp tĩnh có trước; /__version và /assets/config.js đi qua _worker.mjs với biến môi trường
// của tiến trình (giống Settings → Variables). Dùng cho `npm run serve` và các kiểm thử trình duyệt.
//   node site/test/serve.mjs [--port 8124] [--dir dist]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const arg = (f, d) => (process.argv.includes(f) ? process.argv[process.argv.indexOf(f) + 1] : d);
const PORT = Number(arg('--port', 8124));
const DIR = path.resolve(ROOT, arg('--dir', 'dist'));
const WORKER_PATHS = new Set(['/__version', '/assets/config.js']);

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
};

let workerPromise = null;
const worker = () => (workerPromise ||= import(pathToFileURL(path.join(DIR, '_worker.mjs')).href).then(m => m.default));

async function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]);
  const rel = path.normalize(clean).replace(/^([/\\])+/, '');
  const full = path.join(DIR, rel);
  if (!full.startsWith(DIR)) return null;
  for (const candidate of [full, path.join(full, 'index.html')]) {
    try {
      const s = await stat(candidate);
      if (s.isFile() && !path.basename(candidate).startsWith('_worker')) return candidate;
    } catch { /* tiếp */ }
  }
  return null;
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const p = url.pathname.replace(/\/+$/, '') || '/';
    if (WORKER_PATHS.has(p)) {
      const w = await worker();
      const r = await w.fetch(new Request('http://localhost' + url.pathname, { method: req.method, headers: req.headers }), process.env);
      res.writeHead(r.status, Object.fromEntries(r.headers));
      res.end(req.method === 'HEAD' ? undefined : Buffer.from(await r.arrayBuffer()));
      return;
    }
    const file = await resolveFile(url.pathname);
    if (file) {
      const body = await readFile(file);
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(req.method === 'HEAD' ? undefined : body);
      return;
    }
    const nf = await readFile(path.join(DIR, '404.html'));
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(nf);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Lỗi máy chủ thử');
    console.error(err);
  }
});

server.listen(PORT, '0.0.0.0', () => console.log(`serve: http://localhost:${PORT} ← ${path.relative(ROOT, DIR)}`));
