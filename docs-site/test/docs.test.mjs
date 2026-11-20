// Kiểm thử web tài liệu: cấu trúc trang, liên kết nội bộ, tham chiếu "mục N", tên biến khớp với Worker,
// và bản docs-site/dist đã commit phải khớp với bản dựng lại từ docs/FIREBASE-SETUP.md.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { readdir as readdirEntries } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const SOURCE = path.join(ROOT, 'docs', 'FIREBASE-SETUP.md');
const COMMITTED = path.join(ROOT, 'docs-site', 'dist');
const { buildDocs, splitSource } = await import(pathToFileURL(path.join(ROOT, 'docs-site', 'build.mjs')).href);

let fresh;
let freshDir;
before(async () => {
  freshDir = await mkdtemp(path.join(os.tmpdir(), 'sf-docs-'));
  fresh = await buildDocs({ source: SOURCE, out: freshDir });
});

async function listFiles(dir, rel = '') {
  const out = [];
  for (const e of await readdirEntries(path.join(dir, rel), { withFileTypes: true })) {
    const r = path.join(rel, e.name);
    if (e.isDirectory()) out.push(...await listFiles(dir, r));
    else out.push(r);
  }
  return out;
}

const read = f => readFile(path.join(freshDir, f), 'utf8');
const sourceText = () => readFile(SOURCE, 'utf8');

test('có 18 trang: tổng quan và 17 mục (0 đến 16), mỗi trang một tiêu đề h1', async () => {
  assert.equal(fresh.pages.length, 18);
  for (const p of fresh.pages) {
    const html = await read(p.file);
    assert.equal((html.match(/<h1>/g) || []).length, 1, p.file + ' có đúng một h1');
  }
  const sections = splitSource(await sourceText()).sections;
  assert.deepEqual(sections.map(s => s.number), [...Array(17).keys()], 'số mục liên tục từ 0 đến 16');
});

test('không có script inline (khớp CSP) và chỉ tải assets/docs.js', async () => {
  for (const p of fresh.pages) {
    const html = await read(p.file);
    assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)/, p.file + ' không có <script> inline');
    assert.doesNotMatch(html, /\son[a-z]+=/i, p.file + ' không có thuộc tính sự kiện inline');
  }
});

test('menu của mọi trang liệt kê đủ 18 trang và đánh dấu đúng trang hiện tại', async () => {
  for (const p of fresh.pages) {
    const html = await read(p.file);
    for (const q of fresh.pages) assert.match(html, new RegExp('href="' + q.file.replace(/\./g, '\\.') + '"'), p.file + ' có liên kết tới ' + q.file);
    assert.equal((html.match(/aria-current="page"/g) || []).length, 1);
    assert.match(html, new RegExp('href="' + p.file.replace(/\./g, '\\.') + '"[^>]*aria-current="page"'));
  }
});

test('mọi liên kết nội bộ (href, không phải http) trỏ tới tệp tồn tại', async () => {
  const files = new Set(await readdir(freshDir));
  for (const p of fresh.pages) {
    const html = await read(p.file);
    for (const m of html.matchAll(/href="([^"#:]+?)(#[^"]*)?"/g)) {
      const target = m[1];
      if (target.startsWith('assets/') || target.startsWith('../')) {
        assert.ok(existsSync(path.join(freshDir, target)), p.file + ' → ' + target);
      } else {
        assert.ok(files.has(target), p.file + ' → ' + target + ' không tồn tại');
      }
    }
  }
});

test('mọi liên kết trong mục lục (#id) đều có id tương ứng trên trang', async () => {
  for (const p of fresh.pages) {
    const html = await read(p.file);
    for (const m of html.matchAll(/<aside class="toc"[\s\S]*?<\/aside>/g)) {
      for (const link of m[0].matchAll(/href="#([^"]+)"/g)) {
        assert.match(html, new RegExp('id="' + link[1] + '"'), p.file + ' thiếu id ' + link[1]);
      }
    }
  }
});

test('mọi tham chiếu "mục N" trong nguồn đều trỏ tới một mục có thật', async () => {
  const text = await sourceText();
  const numbers = new Set(splitSource(text).sections.map(s => s.number));
  for (const m of text.matchAll(/[Mm]ục (\d+)/g)) {
    assert.ok(numbers.has(Number(m[1])), 'tham chiếu "' + m[0] + '" không có mục tương ứng');
  }
});

test('tên biến FIREBASE_* trong tài liệu đều tồn tại trong cấu hình Worker', async () => {
  const worker = await readFile(path.join(ROOT, 'site', 'worker.template.js'), 'utf8');
  const docNames = new Set((await sourceText()).match(/FIREBASE_[A-Z_]+/g));
  assert.ok(docNames.size >= 5, 'tài liệu nhắc tới các biến cấu hình');
  for (const name of docNames) {
    assert.ok(worker.includes(name), name + ' không có trong site/worker.template.js');
  }
});

test('khối mã có nút sao chép (JS) và bảng được bọc để cuộn ngang khi cần', async () => {
  const pageWithCode = fresh.pages.find(p => p.file.startsWith('06-'));
  const html = await read(pageWithCode.file);
  assert.match(html, /<div class="codewrap"><pre>/);
  assert.match(html, /<div class="tablewrap"><table>/);
  const js = await readFile(path.join(ROOT, 'docs-site', 'assets', 'docs.js'), 'utf8');
  assert.match(js, /'copy'/);
});

test('bản docs-site/dist đã commit khớp với bản dựng lại (chạy npm run docs để cập nhật)', async () => {
  const want = (await listFiles(freshDir)).sort();
  const have = (await listFiles(COMMITTED)).sort();
  assert.deepEqual(have, want, 'cùng danh sách tệp');
  for (const f of want) {
    const a = await readFile(path.join(freshDir, f));
    const b = await readFile(path.join(COMMITTED, f));
    assert.ok(a.equals(b), f + ' khác bản dựng lại; chạy npm run docs và commit lại');
  }
});
