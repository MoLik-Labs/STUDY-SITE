import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, '..');
const { buildSite, siteCsp } = await import(pathToFileURL(path.join(SITE, 'build.mjs')).href);

const GOOD_URL = 'https://ljsmiazfmmdxoprjggke.supabase.co';
const GOOD_KEY = 'sb_publishable_TESTKEY0123456789';
// JWT anon thật có role=anon trong payload (chữ ký không kiểm tra ở đây).
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const ANON_JWT = [b64({ alg: 'HS256' }), b64({ role: 'anon', iss: 'supabase' }), 'sig'].join('.');
const SERVICE_JWT = [b64({ alg: 'HS256' }), b64({ role: 'service_role' }), 'sig'].join('.');

let out, worker, mod;
before(async () => {
  out = await mkdtemp(path.join(os.tmpdir(), 'sf-worker-'));
  await buildSite({ out });
  mod = await import(pathToFileURL(path.join(out, '_worker.mjs')).href);
  worker = mod.default;
});

const get = (p, env = {}, init = {}) => worker.fetch(new Request('http://x' + p, init), env);

test('config: thiếu biến → CLOUD = null (chế độ khách)', async () => {
  const body = await (await get('/assets/config.js', {})).text();
  assert.match(body, /export const CLOUD = null;/);
});

test('config: URL và khoá hợp lệ → CLOUD đúng, khoá anon JWT cũng được', async () => {
  let body = await (await get('/assets/config.js', { SUPABASE_URL: GOOD_URL + '/', SUPABASE_PUBLISHABLE_KEY: GOOD_KEY })).text();
  assert.ok(body.includes(JSON.stringify({ url: GOOD_URL, key: GOOD_KEY })));
  body = await (await get('/assets/config.js', { SUPABASE_URL: GOOD_URL, SUPABASE_PUBLISHABLE_KEY: ANON_JWT })).text();
  assert.ok(body.includes(ANON_JWT));
});

test('config: khoá bí mật và service_role bị từ chối, không lộ ra', async () => {
  const secret = 'sb_secret_' + 'a'.repeat(20);
  for (const key of [secret, SERVICE_JWT, 'service_role_key_here']) {
    const body = await (await get('/assets/config.js', { SUPABASE_URL: GOOD_URL, SUPABASE_PUBLISHABLE_KEY: key })).text();
    assert.match(body, /export const CLOUD = null;/);
    assert.ok(!body.includes(key), 'không được in khoá ra');
  }
});

test('config: URL sai dạng (http, host lạ, ref sai) → null', async () => {
  for (const url of ['http://ljsmiazfmmdxoprjggke.supabase.co', 'https://evil.example.com', 'https://short.supabase.co', GOOD_URL + '.attacker.com']) {
    const body = await (await get('/assets/config.js', { SUPABASE_URL: url, SUPABASE_PUBLISHABLE_KEY: GOOD_KEY })).text();
    assert.match(body, /export const CLOUD = null;/, url);
  }
});

test('config: chỉ GET/HEAD, không cache', async () => {
  const r = await get('/assets/config.js', {}, { method: 'POST' });
  assert.equal(r.status, 405);
  const ok = await get('/assets/config.js', {});
  assert.equal(ok.headers.get('cache-control'), 'no-store');
  assert.equal(ok.headers.get('content-type'), 'text/javascript; charset=utf-8');
});

test('__version: JSON, ETag, 304 khi khớp, 405 với phương thức lạ', async () => {
  const r = await get('/__version');
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.equal(j.version, '12.0.0');
  assert.match(j.build, /^[0-9a-f]{12}$/);
  const etag = r.headers.get('etag');
  assert.equal(etag, `W/"${j.build}"`);
  assert.equal((await get('/__version', {}, { headers: { 'If-None-Match': etag } })).status, 304);
  assert.equal((await get('/__version', {}, { headers: { 'If-None-Match': `"${j.build}"` } })).status, 304);
  assert.equal((await get('/__version', {}, { method: 'POST' })).status, 405);
});

test('đường dẫn khác không rơi vào mã Worker (404 thuần)', async () => {
  assert.equal((await get('/random')).status, 404);
});

test('build: placeholder đã thay hết, mã build xác định (cùng nội dung → cùng mã)', async () => {
  const src = await readFile(path.join(out, '_worker.mjs'), 'utf8');
  assert.ok(!/__(VERSION|BUILD_ID|BUILT_AT)__/.test(src));
  const again = await mkdtemp(path.join(os.tmpdir(), 'sf-worker-b-'));
  const r2 = await buildSite({ out: again });
  const r1 = await buildSite({ out: out });
  assert.equal(r1.build, r2.build);
});

test('sw.js: precache có trang, bản Vật lí và tệp tĩnh; gắn mã build', async () => {
  const sw = await readFile(path.join(out, 'sw.js'), 'utf8');
  assert.ok(!sw.includes('__PRECACHE__') && !sw.includes('__BUILD_ID__'));
  for (const p of ['"/"', '"/physic/"', '"/tai-khoan/"', '"/assets/app.js"', '"/404.html"']) assert.ok(sw.includes(p), p);
  assert.ok(!sw.includes('/assets/config.js'), 'config không được precache');
});

test('_headers: CSP băm + connect-src mở *.supabase.co, sw.js và __version không cache lâu', async () => {
  const h = await readFile(path.join(out, '_headers'), 'utf8');
  const csp = h.split('\n').find(l => l.includes('Content-Security-Policy')).trim();
  assert.match(csp, /connect-src 'self' https:\/\/\*\.supabase\.co/);
  assert.match(csp, /script-src 'self' 'sha256-/);
  assert.match(csp, /object-src 'none'/);
  assert.ok(!/script-src[^;]*'unsafe-inline'/.test(csp), 'script không được unsafe-inline');
  assert.match(h, /\/sw\.js\n\s+Cache-Control: public, max-age=0, must-revalidate/);
  assert.match(h, /\/__version\n\s+Cache-Control: no-store/);
});

test('siteCsp: từ chối CSP không có connect-src \'self\'', () => {
  assert.throws(() => siteCsp("default-src 'self'"), /connect-src/);
  assert.equal(siteCsp("connect-src 'self'; x 1"), "connect-src 'self' https://*.supabase.co; x 1");
});
