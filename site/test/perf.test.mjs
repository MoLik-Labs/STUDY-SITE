// Ngân sách hiệu năng: chặn hồi quy kích thước trên bản build thật (gzip).
// Trang đầu không được kéo Firebase SDK (chỉ tải khi đăng nhập).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const { buildSite } = await import(pathToFileURL(path.join(HERE, '..', 'build.mjs')).href);

const BUDGET_KB = {
  'assets/boot.js': 22,        // JS của mọi trang (gzip)
  'assets/styles.css': 7,      // CSS của mọi trang (gzip)
  '_worker.mjs': 12,           // Worker gồm API v1, MCP, mã kết nối và logic dùng chung (gzip, ~10 KB)
  'sw.js': 4,                  // service worker (gzip)
};
const PAGE_BUDGET_KB = 8;      // mỗi trang HTML của site (gzip)
const PHYSICS_PAGE_BUDGET_KB = 260; // trang Vật lí hiện ~240 KB gzip: chỉ chặn tăng thêm

const gz = buf => gzipSync(buf, { level: 9 }).length;
const kb = n => n / 1024;

let out;
test.before(async () => {
  out = await mkdtemp(path.join(os.tmpdir(), 'sf-perf-'));
  await buildSite({ out });
});
test.after(async () => { if (out) await rm(out, { recursive: true, force: true }); });

test('ngân sách kích thước: JS, CSS, Worker, service worker', async () => {
  for (const [file, budget] of Object.entries(BUDGET_KB)) {
    const size = kb(gz(await readFile(path.join(out, file))));
    assert.ok(size <= budget, `${file}: ${size.toFixed(1)} KB gzip vượt ngân sách ${budget} KB`);
  }
});

test('ngân sách: mỗi trang HTML nhỏ', async () => {
  const pages = [];
  const walk = async dir => {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) await walk(p);
      else if (e.name.endsWith('.html')) pages.push(p);
    }
  };
  await walk(out);
  assert.ok(pages.length >= 10, 'phải có đủ trang');
  for (const p of pages) {
    const rel = path.relative(out, p);
    // Trang Vật lí là app riêng và nặng (xem docs/PERFORMANCE.md). Mốc này chỉ chặn tăng thêm.
    const budget = rel.startsWith('physic') ? PHYSICS_PAGE_BUDGET_KB : PAGE_BUDGET_KB;
    const size = kb(gz(await readFile(p)));
    assert.ok(size <= budget, `${rel}: ${size.toFixed(1)} KB gzip vượt ${budget} KB`);
  }
});

test('trang đầu không tham chiếu Firebase SDK tĩnh (chỉ tải lười)', async () => {
  const home = await readFile(path.join(out, 'index.html'), 'utf8');
  assert.ok(!/firebase-sdk\.js/.test(home.replace(/<script[^>]*src="\/assets\/boot\.js"[^>]*>/, '')), 'trang chủ không preload Firebase');
  assert.ok(!/<link[^>]+rel="modulepreload"[^>]+firebase/.test(home), 'không modulepreload Firebase');
});
