// Cấu trúc nội dung web hướng dẫn (tutorial/guide/*.md): đánh số, tiêu đề, khối cảnh báo cân bằng,
// liên kết nội bộ dạng .md, không còn liên kết .html cũ. Dựng và kiểm link chết: npm run docs:build.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const GUIDE = path.join(ROOT, 'tutorial', 'guide');
const chapters = readdirSync(GUIDE).filter(f => /^\d{2}-.+\.md$/.test(f)).sort();
const read = f => readFileSync(path.join(GUIDE, f), 'utf8');
const KINDS = ['tip', 'info', 'warning', 'danger'];

test('đánh số chương liên tục từ 00', () => {
  assert.deepEqual(chapters.map(f => Number(f.slice(0, 2))), chapters.map((_, i) => i));
  assert.ok(chapters.length >= 12);
});

test('mỗi chương có đúng một tiêu đề cấp 1 (ngoài khối mã) và có mục ##', () => {
  for (const f of chapters) {
    let fence = false;
    const h1 = read(f).split('\n').filter(l => {
      if (/^(```|~~~)/.test(l)) fence = !fence;
      return !fence && /^# /.test(l);
    });
    assert.equal(h1.length, 1, f);
    assert.match(read(f), /^## /m, `${f} cần ít nhất một mục ##`);
  }
});

test('khối cảnh báo (:::) mở và đóng cân bằng, dùng loại được hỗ trợ', () => {
  for (const f of chapters) {
    let depth = 0;
    for (const line of read(f).split('\n')) {
      const open = line.match(/^::: (\S+)(?: (.+))?$/);
      if (open) {
        assert.ok(KINDS.includes(open[1]), `${f}: loại khối lạ "${open[1]}"`);
        depth++;
      } else if (/^:::\s*$/.test(line)) {
        depth--;
        assert.ok(depth >= 0, `${f}: đóng khối thừa`);
      }
    }
    assert.equal(depth, 0, `${f}: khối chưa đóng`);
  }
});

test('liên kết nội bộ dùng .md (VitePress), không còn .html', () => {
  for (const f of [...chapters, '../index.md']) {
    const text = f.startsWith('..') ? readFileSync(path.join(ROOT, 'tutorial', 'index.md'), 'utf8') : read(f);
    assert.doesNotMatch(text, /\]\([^)]*\.html[)#]/, `${f} còn liên kết .html`);
    for (const m of text.matchAll(/\]\((\d{2}-[^)#\s]+)\.md(#[^)]*)?\)/g)) {
      assert.ok(existsSync(path.join(GUIDE, m[1] + '.md')), `${f}: liên kết tới chương không có: ${m[1]}`);
    }
  }
});

test('trang chủ có hero và liệt kê đủ các chương', () => {
  const idx = readFileSync(path.join(ROOT, 'tutorial', 'index.md'), 'utf8');
  assert.match(idx, /^layout: home$/m);
  for (const f of chapters) assert.ok(idx.includes(`guide/${f.slice(0, -3)})`), `thiếu trong trang chủ: ${f}`);
});
