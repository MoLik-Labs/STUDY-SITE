import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, readdir, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, '..');
const { buildSite, routesFrom } = await import(pathToFileURL(path.join(SITE, 'build.mjs')).href);
const { COURSES } = await import(pathToFileURL(path.join(SITE, 'src', 'courses.js')).href);

let out;
before(async () => {
  out = await mkdtemp(path.join(os.tmpdir(), 'sf-site-'));
  await buildSite({ out });
});

test('dữ liệu: 8 môn, slug và id duy nhất, mỗi tài liệu có đủ trường', () => {
  assert.equal(COURSES.length, 8);
  assert.equal(new Set(COURSES.map(c => c.slug)).size, 8);
  const ids = COURSES.flatMap(c => c.resources.map(r => r.id));
  assert.equal(new Set(ids).size, ids.length, 'id tài liệu không trùng');
  for (const c of COURSES) {
    assert.ok(c.resources.length >= 1, c.slug + ' có tài liệu');
    assert.match(c.slug, /^[a-z0-9-]+$/, 'slug là chữ thường không dấu');
    for (const r of c.resources) {
      assert.match(r.url, /^https:\/\//, r.id + ' dùng https');
      assert.equal(typeof r.verified, 'boolean', r.id + ' có cờ verified');
      assert.ok(r.note && r.cost && r.kind, r.id + ' đủ trường');
    }
  }
});

test('mỗi môn có đúng một đường dẫn; trang chủ có trong danh sách', () => {
  const routes = routesFrom(COURSES).map(r => r.path);
  for (const c of COURSES) assert.ok(routes.includes('/' + c.slug + '/'), c.slug);
  assert.ok(routes.includes('/'));
  assert.equal(new Set(routes).size, routes.length);
});

test('mọi trang được sinh ra và không có script inline', async () => {
  for (const r of routesFrom(COURSES)) {
    const html = await readFile(path.join(out, r.path, 'index.html'), 'utf8');
    assert.match(html, /<script type="module" src="\/assets\/boot\.js"><\/script>/, r.path);
    assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)/, 'không script inline ở ' + r.path);
    assert.ok(html.includes(`data-page="${r.page}"`), r.path);
    assert.doesNotMatch(html, /__(TITLE|DESC|PAGE)__/, 'không còn placeholder');
  }
  await stat(path.join(out, '404.html'));
});

test('bản Vật lí có tại /physic/ và chỉ chứa phần vật lí', async () => {
  const html = await readFile(path.join(out, 'physic', 'index.html'), 'utf8');
  assert.match(html, /<title>Vật lí — Học mọi thứ<\/title>/);
  assert.ok(html.includes('#/physics'), 'điểm vào mở #/physics');
  // Kiểm tra mã JavaScript (không phải CSS dùng chung): không có module trường học, lịch, trò chơi, nhạc.
  for (const fn of ['function seedLessons', 'function gdState', 'function schedState', 'function wkMonday', 'function pomoState', 'function gmState', 'function musicState']) {
    assert.ok(!html.includes(fn), 'không kéo theo: ' + fn);
  }
  for (const f of ['be-vietnam-pro-latin-400-normal.woff2']) {
    await stat(path.join(out, 'physic', 'fonts', f));
  }
});

test('mọi khối inline của /physic/ có hash trong CSP header', async () => {
  const html = await readFile(path.join(out, 'physic', 'index.html'), 'utf8');
  const headers = await readFile(path.join(out, '_headers'), 'utf8');
  const scriptSrc = /script-src ([^;]+)/.exec(headers)[1];
  assert.doesNotMatch(scriptSrc, /unsafe-inline/, 'script không có unsafe-inline');
  const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  assert.ok(inline.length >= 5, 'có các khối inline của từng module: ' + inline.length);
  for (const code of inline) {
    const hash = "'sha256-" + createHash('sha256').update(code, 'utf8').digest('base64') + "'";
    assert.ok(scriptSrc.includes(hash), 'thiếu hash cho một khối inline');
  }
});

test('CSP header: chống nhúng khung và không có domain bên ngoài ngoài YouTube', async () => {
  const headers = await readFile(path.join(out, '_headers'), 'utf8');
  assert.match(headers, /frame-ancestors 'self'/);
  assert.match(headers, /object-src 'none'/);
  assert.match(headers, /connect-src 'self'/);
  assert.doesNotMatch(headers, /https:\/\/[^ ;']*google/);
});

test('app.js của site không dùng innerHTML hay eval', async () => {
  const src = await readFile(path.join(SITE, 'src', 'app.js'), 'utf8');
  assert.doesNotMatch(src, /\.innerHTML\s*=|outerHTML\s*=|insertAdjacentHTML|\beval\(|new Function/);
});

test('mọi tệp trong assets có mặt', async () => {
  const files = (await readdir(path.join(out, 'assets'))).sort();
  // config.js KHÔNG phải tệp tĩnh: Worker phục vụ lúc chạy từ biến môi trường.
  assert.deepEqual(files, ['app.js', 'boot.js', 'cloud.js', 'courses.js', 'logic.js', 'store.js', 'styles.css']);
});
