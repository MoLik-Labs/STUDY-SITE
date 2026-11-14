#!/usr/bin/env node
/**
 * tests/worker.js — mô phỏng đúng luồng request của Cloudflare Workers
 * Static Assets, để kiểm mà không cần tài khoản Cloudflare.
 *
 * Thứ tự Cloudflare áp dụng (run_worker_first = false):
 *   1. tệp tĩnh khớp  → phục vụ thẳng, KHÔNG chạy Worker, KHÔNG tính request
 *   2. không khớp     → chạy dist/functions/[[path]].js
 *   3. _headers       → áp lên phản hồi tĩnh
 *   4. _redirects     → áp trước cả hai
 *
 * Nếu bước 1 sai (ví dụ đặt run_worker_first = true), mọi lượt xem sẽ bị tính
 * vào hạn mức 100.000/ngày — đây chính là thứ tệp này canh.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const results = [];
const ok = (n, c, note) => results.push({ n, pass: !!c, note: note === undefined ? '' : String(note) });

/* ---------- đọc cấu hình tĩnh như Cloudflare đọc ---------- */
function readHeaders() {
  const rules = [];
  let cur = null;
  for (const line of fs.readFileSync(path.join(DIST, '_headers'), 'utf8').split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!line.startsWith(' ') && !line.startsWith('\t')) {
      cur = { path: line.trim(), headers: {} };
      rules.push(cur);
    } else if (cur) {
      const i = line.indexOf(':');
      if (i > 0) cur.headers[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  }
  return rules;
}

function readRedirects() {
  const out = [];
  for (const line of fs.readFileSync(path.join(DIST, '_redirects'), 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const [from, to, status] = t.split(/\s+/);
    if (from && to) out.push({ from, to, status: +(status || 302) });
  }
  return out;
}

const HEADERS = readHeaders();

/* gói kết quả tĩnh thành Response thật, header lấy từ _headers */
function toResponse(st) {
  return new Response(st.body, { status: st.status, headers: st.headers });
}
const REDIRECTS = readRedirects();

/* Cloudflare áp MỌI quy tắc khớp, quy tắc sau đè quy tắc trước */
function applyHeaders(res, pathname) {
  for (const rule of HEADERS) {
    const hit = rule.path === '/*' || rule.path === pathname ||
      (rule.path.endsWith('/*') && pathname.startsWith(rule.path.slice(0, -1)));
    if (!hit) continue;
    for (const [k, v] of Object.entries(rule.headers)) res.headers[k] = v;
  }
  return res;
}

/* ---------- giả lập lớp tài nguyên tĩnh ---------- */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

function serveStatic(pathname) {
  const rel = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
  const file = path.join(DIST, rel);
  /* chặn path traversal như Cloudflare */
  if (!file.startsWith(DIST)) return null;
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return null;
  if (rel.startsWith('_') || rel.startsWith('.')) return null;  /* Cloudflare: _ và . không được phục vụ */
  if (rel === '_headers' || rel === '_redirects' || rel === '.assetsignore' || rel === '.nojekyll') return null;
  return applyHeaders({
    status: 200,
    body: fs.readFileSync(file),
    headers: { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' },
  }, pathname);
}

/* ---------- mô phỏng request ---------- */
async function handle(method, pathname, headers) {
  /* _redirects áp trước */
  const rd = REDIRECTS.find(r => r.from === pathname);
  if (rd) {
    if (rd.status >= 300 && rd.status < 400) {
      return { from: 'redirect', status: rd.status, location: rd.to, billed: false };
    }
    const target = serveStatic(rd.to);
    if (target) return { from: 'redirect→static', status: rd.status, res: toResponse(target), billed: false };
  }

  /* 1. tài nguyên tĩnh khớp → miễn phí */
  const st = serveStatic(pathname);
  if (st) return { from: 'static', status: st.status, res: toResponse(st), billed: false };

  /* 2. chạy Worker */
  const worker = (await import(pathToFileURL(path.join(DIST, '_worker.mjs')).href)).default;
  globalThis.fetch = async (url) => {
    const u = new URL(String(url));
    const f = serveStatic(u.pathname);
    if (!f) return new Response('nf', { status: 404 });
    return toResponse(f);
  };
  const env = { ASSETS: { fetch: async req => {
    const f = serveStatic(new URL(req.url).pathname);
    return f ? toResponse(f) : new Response('nf', { status: 404 });
  } } };
  const res = await worker.fetch(
    new Request('https://study.example' + pathname, { method, headers: headers || {} }),
    env,
    {}
  );
  return { from: 'worker', status: res.status, res, billed: true };
}

(async () => {
  /* --- 1. thứ tự phục vụ: tĩnh trước, Worker sau --- */
  const home = await handle('GET', '/');
  ok('GET / phục vụ tĩnh, KHÔNG tốn request', home.from !== 'worker' && !home.billed, home.from);
  ok('GET / → 200', home.status === 200);
  ok('GET / là HTML', (home.res.headers.get('Content-Type') || '').includes('text/html'),
    home.res.headers.get('Content-Type'));

  const idx = await handle('GET', '/index.html');
  ok('GET /index.html tĩnh, miễn phí', !idx.billed, idx.from);

  const sw = await handle('GET', '/sw.js');
  ok('GET /sw.js tĩnh, miễn phí', !sw.billed);
  ok('sw.js revalidate', sw.res.headers.get('Cache-Control') === 'public, max-age=0, must-revalidate',
    sw.res.headers.get('Cache-Control'));

  /* --- 2. header bảo mật áp cho tài nguyên tĩnh --- */
  ok('có X-Content-Type-Options: nosniff', home.res.headers.get('X-Content-Type-Options') === 'nosniff',
    home.res.headers.get('X-Content-Type-Options'));
  const sf = serveStatic('/');
  ok('có X-Frame-Options', sf.headers['X-Frame-Options'] === 'SAMEORIGIN');
  ok('có Permissions-Policy', (sf.headers['Permissions-Policy'] || '').includes('camera=()'));
  ok('có Referrer-Policy', (sf.headers['Referrer-Policy'] || '').startsWith('strict-origin'));

  /* --- 3. _redirects giữ đường dẫn con chạy được --- */
  for (const p of ['/study', '/study/', '/cards', '/timetable/', '/about', '/about/']) {
    const r = await handle('GET', p);
    ok('_redirects: ' + p + ' → 200 tĩnh, miễn phí', r.status === 200 && !r.billed, r.from + ' ' + r.status);
  }

  /* --- 4. endpoint động --- */
  const ver = await handle('GET', '/__version');
  ok('/__version chạy Worker (có tính request)', ver.from === 'worker' && ver.billed);
  ok('/__version → 200', ver.status === 200);
  const body = await ver.res.json();
  const meta = (fs.readFileSync(path.join(DIST, 'index.html'), 'utf8')
    .match(/<meta name="app-version" content="([^"]+)"/) || [, ''])[1];
  ok('/__version đúng phiên bản', body.version === meta, body.version + ' vs ' + meta);

  const head = await handle('HEAD', '/__version');
  ok('HEAD /__version → 200', head.status === 200);

  const post = await handle('POST', '/__version');
  ok('POST /__version → 405', post.status === 405);

  /* --- 5. 404 đúng kiểu --- */
  const nf = await handle('GET', '/khong-ton-tai');
  ok('đường dẫn lạ → 404', nf.status === 404, nf.status);
  const nfBody = await nf.res.text();
  ok('404 là trang HTML của ta', /<html/i.test(nfBody) && !/nf$/.test(nfBody), nfBody.slice(0, 40));

  /* --- 6. KHÔNG lộ mã nguồn --- */
  for (const leak of ['/src/app.js', '/package.json', '/tests/smoke.js', '/wrangler.jsonc',
    '/dist/_worker.mjs']) {
    const r = await handle('GET', leak);
    ok('không lộ ' + leak, r.status === 404, r.status + ' ' + r.from);
  }

  /* --- 7. mã Worker không bị phục vụ như tài nguyên --- */
  const wk = await handle('GET', '/_worker.mjs');
  ok('/_worker.mjs KHÔNG phục vụ được', wk.status === 404, wk.status);

  /* .assetsignore phải loại _worker.mjs, nếu không nó bị upload thành asset */
  const ai = fs.readFileSync(path.join(DIST, '.assetsignore'), 'utf8');
  ok('.assetsignore loại _worker.mjs', /^_worker\.mjs\s*$/m.test(ai));

  /* --- 8. tài nguyên nội bộ Cloudflare không bị phục vụ --- */
  const hdr = await handle('GET', '/_headers');
  ok('/_headers không bị phục vụ như tệp thường', hdr.status === 404, hdr.status);

  /* --- 8. đếm: trang chạy bình thường không tốn request động --- */
  let billed = 0;
  for (const p of ['/', '/index.html', '/sw.js', '/study', '/cards', '/calendar']) {
    const r = await handle('GET', p);
    if (r.billed) billed++;
  }
  ok('luồng học bình thường tốn 0 request động', billed === 0, billed + ' request');

  const pass = results.filter(r => r.pass).length;
  results.filter(r => !r.pass).forEach(r => console.log('  ✗ ' + r.n + (r.note ? ' — ' + r.note : '')));
  console.log(`\n${pass}/${results.length} bước đạt` + (pass === results.length ? '  ✓' : ''));
  process.exit(pass === results.length ? 0 : 1);
})();
