import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, '..');
const { buildSite, routesFrom, CSP } = await import(pathToFileURL(path.join(SITE, 'build.mjs')).href);
const { COURSES } = await import(pathToFileURL(path.join(SITE, 'src', 'courses.js')).href);

const out = await mkdtemp(path.join(os.tmpdir(), 'sf-site-'));
await buildSite({ out });

test('dữ liệu: 8 môn, slug và id duy nhất, mỗi môn có tài liệu', () => {
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

test('mỗi môn có đúng một đường dẫn, cộng trang vật lí và trang chủ', () => {
  const routes = routesFrom(COURSES).map(r => r.path);
  for (const c of COURSES) assert.ok(routes.includes('/' + c.slug + '/'), c.slug);
  assert.ok(routes.includes('/'));
  assert.ok(routes.includes('/physic/'));
  assert.equal(new Set(routes).size, routes.length);
});

test('mọi trang được sinh ra và không có script inline', async () => {
  const routes = routesFrom(COURSES);
  for (const r of routes) {
    const html = await readFile(path.join(out, r.path, 'index.html'), 'utf8');
    assert.match(html, /<script type="module" src="\/assets\/boot\.js"><\/script>/, r.path);
    assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)/, 'không script inline ở ' + r.path);
    assert.ok(html.includes(`data-page="${r.page}"`), r.path);
    assert.doesNotMatch(html, /__(TITLE|DESC|PAGE)__/, 'không còn placeholder');
  }
  await stat(path.join(out, '404.html'));
});

test('CSP không có unsafe-inline và chặn khung nhúng', async () => {
  const headers = await readFile(path.join(out, '_headers'), 'utf8');
  assert.ok(headers.includes(CSP));
  assert.doesNotMatch(CSP, /unsafe-/);
  assert.match(CSP, /frame-ancestors 'none'/);
  assert.match(CSP, /script-src 'self'/);
});

test('app.js không dùng innerHTML hay eval', async () => {
  const src = await readFile(path.join(SITE, 'src', 'app.js'), 'utf8');
  assert.doesNotMatch(src, /innerHTML|outerHTML|insertAdjacentHTML|\beval\(|new Function/);
});

test('mọi tệp trong assets có mặt', async () => {
  const files = (await readdir(path.join(out, 'assets'))).sort();
  assert.deepEqual(files, ['app.js', 'boot.js', 'courses.js', 'logic.js', 'store.js', 'styles.css']);
});
