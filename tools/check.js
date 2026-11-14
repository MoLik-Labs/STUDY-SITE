#!/usr/bin/env node
/**
 * tools/check.js — kiểm tra tĩnh, không cần cài gì:  node tools/check.js
 *
 * 1. Biên dịch thử mọi khối <script>  → bắt lỗi cú pháp JS
 * 2. Cân bằng ngoặc nhọn của CSS
 * 3. Dấu hiệu nhận diện tối thiểu (thương hiệu, #main, hashchange)
 * 4. Cấm hộp thoại gốc prompt()/confirm()/alert() trong src/  (bị chặn trong iframe)
 * 5. Không có mô-đun chết: mọi src/*.js phải được src/build.py dùng
 * 6. Mọi tuyến trong router đều có hàm render tương ứng
 * 7. Không có hàm khai báo mà không ai gọi (mã chết)
 * 8. Cảnh báo khi build quá nặng
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const FILE = path.join(ROOT, 'index.html');

let fail = 0;
const failWith = m => { fail++; console.error('✗ ' + m); };

if (!fs.existsSync(FILE)) { console.error('✗ chưa có index.html — chạy: python3 src/build.py'); process.exit(1); }
const html = fs.readFileSync(FILE, 'utf8');
const size = Buffer.byteLength(html);
console.log(`index.html: ${(size / 1024).toFixed(0)} KB`);

/* ---------- 1. cú pháp JS ---------- */
const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let jsFail = 0;
scripts.forEach((code, i) => {
  try { new Function(code); }
  catch (e) { jsFail++; failWith(`khối <script> #${i + 1}: ${e.message}`); }
});
console.log(`script: ${scripts.length} khối · lỗi: ${jsFail}`);

/* ---------- 2. CSS ---------- */
const css = (html.match(/<style[^>]*>([\s\S]*?)<\/style>/) || [, ''])[1];
const open = (css.match(/\{/g) || []).length;
const close = (css.match(/\}/g) || []).length;
if (open !== close) failWith(`CSS lệch ngoặc: ${open} { · ${close} }`);
console.log(`css: ${open} khối · ${(Buffer.byteLength(css) / 1024).toFixed(0)} KB`);

/* ---------- 3. dấu hiệu nhận diện ---------- */
['@its.fox_', 'github.com/MoLik-Labs/STUDY-SITE', 'id="main"', "window.addEventListener('hashchange'"]
  .forEach(s => { if (!html.includes(s)) failWith(`thiếu dấu hiệu nhận diện: ${s}`); });

/* ---------- 4. cấm hộp thoại gốc của trình duyệt ---------- */
/* *.template.js được chép sang dist/ chứ không nhúng vào trang, nên không
   tham gia kiểm tra mã chết / hộp thoại của bản chạy. */
const jsFiles = fs.readdirSync(SRC).filter(f => f.endsWith('.js') && !f.endsWith('.template.js'));
const templateFiles = fs.readdirSync(SRC).filter(f => f.endsWith('.template.js'));
jsFiles.forEach(f => {
  const raw = fs.readFileSync(path.join(SRC, f), 'utf8');
  /* bỏ chú thích khối và chú thích dòng, giữ nguyên số dòng để báo lỗi đúng chỗ */
  const text = raw
    .replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + ' '.repeat(m.length - p1.length));
  text.split('\n').forEach((line, i) => {
    const m = line.match(/(?<![\w.$])(prompt|confirm|alert)\s*\(/);
    if (m) failWith(`src/${f}:${i + 1} dùng ${m[1]}() — dùng uiPrompt/uiConfirm thay thế`);
  });
});

/* ---------- 5. không có mô-đun chết ---------- */
const buildPy = fs.readFileSync(path.join(SRC, 'build.py'), 'utf8');
jsFiles.forEach(f => {
  if (!buildPy.includes(`'${f}'`)) failWith(`src/${f} không được src/build.py ghép vào — mã chết hoặc quên thêm?`);
});

/* ---------- 5b. no duplicate top-level globals ----------
   Every module is a classic script sharing ONE global scope. Two files
   declaring the same name means the second silently wins — a bug that no
   amount of clicking reveals, because the wrong function still runs and
   still looks reasonable. This scan is the guard that keeps the split from
   rotting: it fails the build on a collision instead of hoping nobody
   notices. Template files are excluded; they are shipped, not bundled. */
{
  const seen = new Map();
  const dupes = [];
  jsFiles.forEach(f => {
    const raw = fs.readFileSync(path.join(SRC, f), 'utf8');
    /* strip comments and strings so a name inside a sentence is not counted */
    const text = raw
      .replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))
      .replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + ' '.repeat(m.length - p1.length))
      .replace(/'(?:\\.|[^'\\])*'/g, "''")
      .replace(/"(?:\\.|[^"\\])*"/g, '""')
      .replace(/`(?:\\.|[^`\\])*`/g, '``');
    const re = /^(?:function\s+([A-Za-z_$][\w$]*)|(?:const|let|var)\s+([A-Za-z_$][\w$]*))/gm;
    let m;
    while ((m = re.exec(text))) {
      const name = m[1] || m[2];
      if (seen.has(name) && seen.get(name) !== f) {
        dupes.push(name + ' (' + seen.get(name) + ' & ' + f + ')');
      } else if (!seen.has(name)) {
        seen.set(name, f);
      }
    }
  });
  if (dupes.length) {
    dupes.slice(0, 8).forEach(d => failWith('khai báo trùng tên toàn cục: ' + d));
  }
  console.log('biến toàn cục: ' + seen.size + ' tên · trùng: ' + dupes.length);
}

/* ---------- 6. router ↔ hàm render ---------- */
const appSrc = fs.readFileSync(path.join(SRC, 'app.js'), 'utf8');
const routes = [...appSrc.matchAll(/p\[0\]\s*===\s*'([a-z0-9]+)'[\s\S]{0,40}?render([A-Za-z0-9_]+)\(/g)]
  .map(m => ({ route: m[1], fn: 'render' + m[2] }));
const allSrc = jsFiles.map(f => fs.readFileSync(path.join(SRC, f), 'utf8')).join('\n');
routes.forEach(({ route, fn }) => {
  if (!new RegExp(`function\\s+${fn}\\s*\\(|const\\s+${fn}\\s*=`).test(allSrc)) {
    failWith(`tuyến #/${route} trỏ tới ${fn}() nhưng hàm không tồn tại`);
  }
});
console.log(`router: ${routes.length} tuyến · ${new Set(routes.map(r => r.fn)).size} hàm render`);
templateFiles.forEach(f => {
  if (!buildPy.includes(f)) failWith(`src/${f} không được src/build.py dùng — mẫu chết?`);
});

/* ---------- 7. hàm khai báo nhưng không ai gọi ---------- */
const bundle = scripts.join('\n');
const dead = [];
jsFiles.forEach(f => {
  const text = fs.readFileSync(path.join(SRC, f), 'utf8');
  const names = [...text.matchAll(/^(?:function|const|let)\s+([A-Za-z_$][\w$]*)/gm)].map(m => m[1]);
  new Set(names).forEach(n => {
    const re = new RegExp('(?<![\\w$])' + n.replace(/\$/g, '\\$') + '(?![\\w$])', 'g');
    if ((bundle.match(re) || []).length <= 1) dead.push(`src/${f}: ${n}`);
  });
});
if (dead.length) dead.forEach(d => failWith(`hàm không được gọi ở đâu — ${d}`));
else console.log('mã chết: 0');

/* ---------- 8. kích thước ---------- */
if (size > 1.4 * 1024 * 1024) failWith('quá nặng (> 1.4 MB)');

console.log(fail ? `\n${fail} lỗi` : '\n✓ tất cả kiểm tra đều đạt');
process.exit(fail ? 1 : 0);
