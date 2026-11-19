import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, '..');
const { buildSite, siteCsp } = await import(pathToFileURL(path.join(SITE, 'build.mjs')).href);

const GOOD = {
  FIREBASE_API_KEY: 'AIzaSyD0123456789abcdefghijklmnopqrstuv',
  FIREBASE_PROJECT_ID: 'study-focus-fox',
  FIREBASE_APP_ID: '1:123456789012:web:0a1b2c3d4e5f',
};
const SERVICE_ACCOUNT = JSON.stringify({ type: 'service_account', project_id: 'x', private_key: '-----BEGIN PRIVATE KEY-----\nMII' });

let out, worker, mod;
before(async () => {
  out = await mkdtemp(path.join(os.tmpdir(), 'sf-worker-'));
  await buildSite({ out });
  mod = await import(pathToFileURL(path.join(out, '_worker.mjs')).href);
  worker = mod.default;
});

const get = (p, env = {}, init = {}) => worker.fetch(new Request('http://x' + p, init), env);

test('config: thiếu biến → CLOUD = null (chế độ khách)', async () => {
  const r = await get('/assets/config.js', {});
  assert.match(await r.text(), /export const CLOUD = null;/);
});

test('config: đủ biến công khai → CLOUD có apiKey, authDomain mặc định, projectId, appId', async () => {
  const body = await (await get('/assets/config.js', GOOD)).text();
  const m = /CLOUD = Object\.freeze\((\{.*\})\);/.exec(body);
  assert.ok(m, 'có CLOUD');
  const cfg = JSON.parse(m[1]);
  assert.deepEqual(cfg, {
    apiKey: GOOD.FIREBASE_API_KEY,
    authDomain: 'study-focus-fox.firebaseapp.com',
    projectId: 'study-focus-fox',
    appId: GOOD.FIREBASE_APP_ID,
  });
});

test('config: authDomain riêng được dùng khi đặt', async () => {
  const body = await (await get('/assets/config.js', { ...GOOD, FIREBASE_AUTH_DOMAIN: 'auth.vidu.vn' })).text();
  assert.match(body, /"authDomain":"auth\.vidu\.vn"/);
});

test('config: khoá dịch vụ (service account) hoặc private_key bị từ chối, không lộ ra', async () => {
  const body = await (await get('/assets/config.js', { ...GOOD, FIREBASE_APP_ID: SERVICE_ACCOUNT })).text();
  assert.match(body, /CLOUD = null/);
  assert.ok(!body.includes('PRIVATE'), 'không có khoá bí mật trong phản hồi');
  const body2 = await (await get('/assets/config.js', { ...GOOD, FIREBASE_AUTH_DOMAIN: '-----BEGIN PRIVATE KEY-----' })).text();
  assert.match(body2, /CLOUD = null/);
});

test('config: giá trị sai định dạng → null (không đưa vào trang)', async () => {
  const bad = [
    { FIREBASE_API_KEY: 'khong-phai-khoa' },
    { FIREBASE_PROJECT_ID: 'Viet Hoa!' },
    { FIREBASE_APP_ID: '1:2:android:abc' },
    { FIREBASE_AUTH_DOMAIN: 'https://evil.example' },
    { FIREBASE_AUTH_DOMAIN: '"><script>' },
  ];
  for (const b of bad) {
    const body = await (await get('/assets/config.js', { ...GOOD, ...b })).text();
    assert.match(body, /CLOUD = null/, JSON.stringify(b));
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
  for (const p of ['"/"', '"/physic/"', '"/tai-khoan/"', '"/404.html"', '"/assets/boot.js"', '"/assets/styles.css"']) assert.ok(sw.includes(p), p);
  // Chunk Firebase có tên băm: phải có trong precache để chạy offline sau lần đầu.
  assert.match(sw, /\/assets\/chunk-[A-Z0-9]+\.js/);
  assert.ok(!sw.includes('/assets/config.js'), 'config không được precache');
});

test('_headers: CSP băm, mở đúng máy chủ Firebase, một frame-src, sw.js và __version không cache lâu', async () => {
  const h = await readFile(path.join(out, '_headers'), 'utf8');
  const csp = h.split('\n').find(l => l.includes('Content-Security-Policy')).trim();
  assert.match(csp, /connect-src 'self' https:\/\/identitytoolkit\.googleapis\.com/);
  assert.match(csp, /https:\/\/securetoken\.googleapis\.com/);
  assert.match(csp, /https:\/\/firestore\.googleapis\.com/);
  assert.match(csp, /script-src 'self' https:\/\/apis\.google\.com 'sha256-/);
  assert.equal((csp.match(/frame-src /g) || []).length, 1, 'chỉ một frame-src (directive trùng bị trình duyệt bỏ qua)');
  assert.match(csp, /frame-src https:\/\/\*\.firebaseapp\.com/);
  assert.match(csp, /frame-src [^;]*youtube/);
  assert.match(csp, /object-src 'none'/);
  assert.ok(!/supabase/.test(csp), 'không còn Supabase');
  assert.ok(!/script-src[^;]*'unsafe-inline'/.test(csp), 'script không được unsafe-inline');
  assert.ok(!/script-src[^;]*'unsafe-eval'/.test(csp), 'script không được unsafe-eval');
  assert.match(h, /\/sw\.js\n\s+Cache-Control: public, max-age=0, must-revalidate/);
  assert.match(h, /\/__version\n\s+Cache-Control: no-store/);
});

test('siteCsp: từ chối CSP không có connect-src \'self\'', () => {
  assert.throws(() => siteCsp("default-src 'self'"), /connect-src/);
  const out1 = siteCsp("script-src 'self' 'sha256-A'; connect-src 'self'; x 1");
  assert.match(out1, /connect-src 'self' https:\/\/identitytoolkit/);
  assert.match(out1, /script-src 'self' https:\/\/apis\.google\.com 'sha256-A'/);
  assert.match(out1, /; x 1; frame-src https:\/\/\*\.firebaseapp\.com$/);
});
