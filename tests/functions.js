#!/usr/bin/env node
/**
 * tests/functions.js — chạy thử Cloudflare Worker mà không cần Cloudflare.
 *
 * dist/_worker.mjs là module ES dùng Web-standard API (Request/Response/fetch),
 * nên node 18+ chạy thẳng được. Ta giả lập:
 *   · fetch trả về index.html thật đã build
 *   · env có CF_PAGES_COMMIT_SHA như trên Pages
 * rồi kiểm tra JSON, ETag và 304.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

const results = [];
const ok = (n, c, note) => results.push({ n, pass: !!c, note: note === undefined ? '' : String(note) });

(async () => {
  /* fetch giả: chỉ trả lời cho /index.html */
  globalThis.fetch = async (url) => {
    const u = String(url);
    if (u.endsWith('/index.html')) {
      return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html' } });
    }
    return new Response('not found', { status: 404 });
  };

  const mod = await import(pathToFileURL(path.join(ROOT, 'dist/_worker.mjs')).href);
  ok('module export workerFetch', typeof mod.workerFetch === 'function');
  ok('module export default (router)', mod.default && typeof mod.default.fetch === 'function');
  ok('phiên bản đã được nhúng lúc build', !fs.readFileSync(path.join(ROOT,'dist/_worker.mjs'),'utf8').includes('__VERSION__'));

  const env = { CF_WORKERS_CI_COMMIT_SHA: 'abc123def456', CF_WORKERS_CI_BRANCH: 'main' };
  /* workerFetch(request, env) — trả Request thật, không phải object bọc */
  const mk = (init, headers) => new Request('https://example.workers.dev/__version',
    Object.assign({ headers: new Headers(headers || {}) }, init));
  const E = env;

  /* --- GET --- */
  const res = await mod.workerFetch(mk(), E);
  ok('GET trả 200', res.status === 200, res.status);
  ok('Content-Type JSON', (res.headers.get('content-type') || '').includes('application/json'));
  ok('không cache', res.headers.get('cache-control') === 'no-store');

  const body = await res.json();
  const metaVer = (html.match(/<meta name="app-version" content="([^"]+)"/) || [, ''])[1];
  const metaBuild = (html.match(/<meta name="build-id" content="([^"]+)"/) || [, ''])[1];
  ok('version khớp index.html', body.version === metaVer, body.version + ' vs ' + metaVer);
  ok('build khớp build-id', body.build === metaBuild, body.build + ' vs ' + metaBuild);
  ok('có commit sha', body.commit === 'abc123def456');
  ok('có nhãn runtime', body.runtime === 'cloudflare', body.runtime);
  ok('có mốc thời gian ISO', /^\d{4}-\d\d-\d\dT/.test(body.at || ''));

  /* --- ETag / 304 --- */
  const etag = res.headers.get('etag');
  ok('có ETag', !!etag, etag);
  /* --- workerFetch: đường dẫn khác phải trả null để Worker xử lý tiếp --- */
  const other = await mod.workerFetch(new Request('https://x.workers.dev/khac'), E);
  ok('đường dẫn khác → null', other === null);

  const res304 = await mod.workerFetch(mk({}, { 'If-None-Match': etag }), E);
  ok('If-None-Match trùng → 304', res304.status === 304, res304.status);
  ok('304 không có body', (await res304.text()) === '');

  const res200 = await mod.workerFetch(mk({}, { 'If-None-Match': 'W/"khac"' }), E);
  ok('ETag lạ → 200', res200.status === 200);

  /* --- method khác --- */
  const post = await mod.workerFetch(mk({ method: 'POST' }), E);
  ok('POST → 405', post.status === 405, post.status);
  const head = await mod.workerFetch(mk({ method: 'HEAD' }), E);
  ok('HEAD được phép', head.status === 200, head.status);

  /* --- index.html không đọc được thì vẫn trả lời --- */
  globalThis.fetch = async () => { throw new Error('boom'); };
  const resErr = await mod.workerFetch(mk(), E);
  ok('lỗi đọc index.html vẫn trả 200', resErr.status === 200, resErr.status);
  const bodyErr = await resErr.json();
  ok('lỗi vẫn có trường version', typeof bodyErr.version === 'string', bodyErr.version);

  const pass = results.filter(r => r.pass).length;
  results.filter(r => !r.pass).forEach(r => console.log('  ✗ ' + r.n + (r.note ? ' — ' + r.note : '')));
  console.log(`\n${pass}/${results.length} bước đạt` + (pass === results.length ? '  ✓' : ''));
  process.exit(pass === results.length ? 0 : 1);
})();

/* ---------- kiểm tra wrangler.jsonc khớp với dist/ ---------- */
(function checkWrangler() {
  const fsx = require('fs');
  const cfgPath = path.join(ROOT, 'wrangler.jsonc');
  if (!fsx.existsSync(cfgPath)) { console.log('  ✗ thiếu wrangler.jsonc'); process.exitCode = 1; return; }
  let t = fsx.readFileSync(cfgPath, 'utf8');
  t = t.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/,\s*\}/g, '}');
  let c;
  try { c = JSON.parse(t); }
  catch (e) { console.log('  ✗ wrangler.jsonc không parse được: ' + e.message); process.exitCode = 1; return; }

  const rel = p => path.join(ROOT, p.replace(/^\.\//, ''));
  const checks = [
    ['wrangler: có main', !!c.main],
    ['wrangler: main tồn tại trong dist/', !!c.main && fsx.existsSync(rel(c.main))],
    ['wrangler: assets.directory = ./dist', c.assets && c.assets.directory === './dist'],
    ['wrangler: có ASSETS binding cho 404', c.assets && c.assets.binding === 'ASSETS'],
    ['wrangler: run_worker_first KHÔNG bật (tĩnh miễn phí)',
      !(c.assets && c.assets.run_worker_first === true)],
    ['wrangler: not_found_handling = 404-page', c.assets && c.assets.not_found_handling === '404-page'],
  ];
  const bad = checks.filter(x => !x[1]);
  bad.forEach(x => console.log('  ✗ ' + x[0]));
  console.log(`  ${checks.length - bad.length}/${checks.length} bước wrangler`);
  if (bad.length) process.exitCode = 1;
})();
