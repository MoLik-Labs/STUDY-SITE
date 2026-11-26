// Web hướng dẫn GitHub (tutorial/): đánh số, cấu trúc chương, không script, link nội bộ, precache.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const { buildTutorial, slugify, parseChapter, loadChapters } = await import(pathToFileURL(path.join(ROOT, 'tutorial', 'build.mjs')).href);
const CONTENT = path.join(ROOT, 'tutorial', 'content');

const chapterFiles = readdirSync(CONTENT).filter(f => /^\d{2}-.+\.md$/.test(f)).sort();

test('slugify: bỏ dấu tiếng Việt, đ → d, chữ thường, gạch ngang', () => {
  assert.equal(slugify('Đẩy lên GitHub'), 'day-len-github');
  assert.equal(slugify('Xử lý sự cố thường gặp!'), 'xu-ly-su-co-thuong-gap');
  assert.equal(slugify('   '), '');
});

test('parseChapter: lấy tiêu đề H1 và đoạn mô tả, bỏ markdown', () => {
  const md = '# Tiêu đề **đậm**\n\nĐoạn `mô tả` đầu tiên.\n\n## Mục\n\nNội dung.';
  const p = parseChapter(md);
  assert.equal(p.title, 'Tiêu đề **đậm**');
  assert.equal(p.desc, 'Đoạn mô tả đầu tiên.');
  assert.throws(() => parseChapter('không có tiêu đề'), /tiêu đề/);
});

test('đánh số chương liên tục từ 00, mỗi chương một tệp', () => {
  const nums = chapterFiles.map(f => Number(f.slice(0, 2)));
  assert.deepEqual(nums, nums.map((_, i) => i), 'số chương phải là 00, 01, 02, … không thiếu');
  assert.ok(chapterFiles.length >= 12);
});

test('mỗi chương có tiêu đề, mô tả ngắn và có ít nhất một mục ##', () => {
  for (const f of chapterFiles) {
    const md = readFileSync(path.join(CONTENT, f), 'utf8');
    const p = parseChapter(md);
    assert.ok(p.title.length > 3, f);
    assert.ok(p.desc.length > 20 && p.desc.length < 400, `${f}: mô tả ${p.desc.length} ký tự`);
    assert.match(md, /^## /m, `${f} cần ít nhất một mục ##`);
  }
});

test('khối cảnh báo chỉ dùng nhãn được hỗ trợ', () => {
  const allowed = ['Mẹo', 'Lưu ý', 'Cảnh báo', 'Quy tắc'];
  for (const f of chapterFiles) {
    const md = readFileSync(path.join(CONTENT, f), 'utf8');
    for (const m of md.matchAll(/^> \*\*([^*:]+):\*\*/gm)) {
      assert.ok(allowed.includes(m[1].trim()), `${f}: nhãn lạ "${m[1]}"`);
    }
  }
});

test('không có tiêu đề # thứ hai trong thân chương (trang đã có H1)', () => {
  for (const f of chapterFiles) {
    const md = readFileSync(path.join(CONTENT, f), 'utf8');
    // Bỏ qua dòng bên trong khối mã (chú thích shell cũng bắt đầu bằng "# ").
    let fence = false;
    const h1s = md.split('\n').filter(l => {
      if (/^(```|~~~)/.test(l)) fence = !fence;
      return !fence && /^# /.test(l);
    });
    assert.equal(h1s.length, 1, f);
  }
});

test('dựng: trang tĩnh, không script, có mục lục, chuyển chương, link nội bộ đều tồn tại', async () => {
  const out = mkdtempSync(path.join(tmpdir(), 'sf-tutorial-'));
  const files = await buildTutorial({ out });
  assert.equal(files.length, chapterFiles.length + 1, 'mỗi chương + trang tổng quan');
  assert.ok(existsSync(path.join(out, 'index.html')));
  assert.ok(existsSync(path.join(out, 'assets', 'tutorial.css')));

  for (const f of files) {
    const html = readFileSync(path.join(out, f), 'utf8');
    assert.ok(!/<script\b/i.test(html), `${f} không được có script`);
    assert.ok(!/\sstyle="/i.test(html), `${f} không được có style nội tuyến`);
    assert.match(html, /<html lang="vi">/, f);
    for (const m of html.matchAll(/href="([^"#?]+)"/g)) {
      const href = m[1];
      if (/^(https?:|mailto:|\/)/.test(href)) continue;
      assert.ok(existsSync(path.join(out, href)), `${f}: link hỏng tới ${href}`);
    }
    for (const m of html.matchAll(/href="#([^"]+)"/g)) {
      assert.ok(html.includes(`id="${m[1]}"`), `${f}: mục neo #${m[1]} không tồn tại`);
    }
  }
});

test('dựng: mỗi chương có liên kết trước/tiếp và đường dẫn đúng thứ tự', async () => {
  const out = mkdtempSync(path.join(tmpdir(), 'sf-tutorial-'));
  await buildTutorial({ out });
  const chapters = loadChapters(CONTENT);
  chapters.forEach((c, i) => {
    const html = readFileSync(path.join(out, c.file), 'utf8');
    const next = chapters[i + 1];
    if (next) assert.ok(html.includes(`class="next" href="${next.file}"`), `${c.file} thiếu liên kết tiếp`);
    const prevHref = i === 0 ? 'index.html' : chapters[i - 1].file;
    assert.ok(html.includes(`class="prev" href="${prevHref}"`), `${c.file} thiếu liên kết trước`);
  });
});

test('dựng: khối cảnh báo có nhãn và được gắn lớp', async () => {
  const out = mkdtempSync(path.join(tmpdir(), 'sf-tutorial-'));
  await buildTutorial({ out });
  const html = readFileSync(path.join(out, '10-bao-mat.html'), 'utf8');
  assert.match(html, /class="callout callout-warn" aria-label="Cảnh báo"/);
  assert.match(html, /class="callout-label">Cảnh báo</);
});

test('site: web hướng dẫn nằm tại /huong-dan/ và được precache cho đọc offline', async () => {
  const { buildSite } = await import(pathToFileURL(path.join(ROOT, 'site', 'build.mjs')).href);
  const out = mkdtempSync(path.join(tmpdir(), 'sf-site-'));
  await buildSite({ out });
  assert.ok(existsSync(path.join(out, 'huong-dan', 'index.html')));
  assert.ok(existsSync(path.join(out, 'huong-dan', '05-git-dong-lenh.html')));
  const sw = readFileSync(path.join(out, 'sw.js'), 'utf8');
  assert.ok(sw.includes('"/huong-dan/"'), 'sw.js phải precache /huong-dan/');
  assert.ok(sw.includes('"/huong-dan/assets/tutorial.css"'), 'sw.js phải precache CSS hướng dẫn');
  assert.ok(sw.includes('"/huong-dan/05-git-dong-lenh.html"'), 'sw.js phải precache chương');
});

test('phần dẫn không lặp lại trong thân bài', async () => {
  const out = mkdtempSync(path.join(tmpdir(), 'sf-tutorial-'));
  await buildTutorial({ out });
  for (const c of loadChapters(CONTENT)) {
    const html = readFileSync(path.join(out, c.file), 'utf8');
    const main = html.slice(html.indexOf('<main'));
    const count = main.split(c.desc.slice(0, 60)).length - 1;
    assert.equal(count, 1, `${c.file}: đoạn dẫn xuất hiện ${count} lần`);
  }
});
