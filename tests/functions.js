#!/usr/bin/env node
/**
 * tests/functions.js — chạy thử Cloudflare Pages Function mà không cần Cloudflare.
 *
 * functions/__version.js là module ES dùng Web-standard API (Request/Response/fetch),
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

  const mod = await import(pathToFileURL(path.join(ROOT, 'functions/__version.js')).href);
  ok('module export onRequestGet', typeof mod.onRequestGet === 'function');
  ok('module export onRequest (catch-all)', typeof mod.onRequest === 'function');

  const env = { CF_PAGES_COMMIT_SHA: 'abc123def456', CF_PAGES_BRANCH: 'main' };
  const mk = (init, headers) => {
    const h = new Headers(headers || {});
    return { request: new Request('https://example.pages.dev/__version', Object.assign({ headers: h }, init)), env };
  };

  /* --- GET --- */
  const res = await mod.onRequestGet(mk());
  ok('GET trả 200', res.status === 200, res.status);
  ok('Content-Type JSON', (res.headers.get('content-type') || '').includes('application/json'));
  ok('không cache', res.headers.get('cache-control') === 'no-store');

  const body = await res.json();
  const metaVer = (html.match(/<meta name="app-version" content="([^"]+)"/) || [, ''])[1];
  const metaBuild = (html.match(/<meta name="build-id" content="([^"]+)"/) || [, ''])[1];
  ok('version khớp index.html', body.version === metaVer, body.version + ' vs ' + metaVer);
  ok('build khớp build-id', body.build === metaBuild, body.build + ' vs ' + metaBuild);
  ok('có commit sha', body.commit === 'abc123def456');
  ok('có nhãn runtime', body.runtime === 'cloudflare-pages-functions', body.runtime);
  ok('có mốc thời gian ISO', /^\d{4}-\d\d-\d\dT/.test(body.at || ''));

  /* --- ETag / 304 --- */
  const etag = res.headers.get('etag');
  ok('có ETag', !!etag, etag);
  const res304 = await mod.onRequestGet(mk({}, { 'If-None-Match': etag }));
  ok('If-None-Match trùng → 304', res304.status === 304, res304.status);
  ok('304 không có body', (await res304.text()) === '');

  const res200 = await mod.onRequestGet(mk({}, { 'If-None-Match': 'W/"khac"' }));
  ok('ETag lạ → 200', res200.status === 200);

  /* --- method khác --- */
  const post = await mod.onRequest(mk({ method: 'POST' }));
  ok('POST → 405', post.status === 405, post.status);
  const head = await mod.onRequest(mk({ method: 'HEAD' }));
  ok('HEAD được phép', head.status === 200, head.status);

  /* --- index.html không đọc được thì vẫn trả lời --- */
  globalThis.fetch = async () => { throw new Error('boom'); };
  const resErr = await mod.onRequestGet(mk());
  ok('lỗi đọc index.html vẫn trả 200', resErr.status === 200, resErr.status);
  const bodyErr = await resErr.json();
  ok('lỗi vẫn có trường version', typeof bodyErr.version === 'string', bodyErr.version);

  const pass = results.filter(r => r.pass).length;
  results.filter(r => !r.pass).forEach(r => console.log('  ✗ ' + r.n + (r.note ? ' — ' + r.note : '')));
  console.log(`\n${pass}/${results.length} bước đạt` + (pass === results.length ? '  ✓' : ''));
  process.exit(pass === results.length ? 0 : 1);
})();
