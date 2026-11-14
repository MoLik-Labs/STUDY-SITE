#!/usr/bin/env node
/**
 * check.js — kiểm tra tĩnh cho bản build một-tệp.
 * Không cần cài gì: node tools/check.js
 *
 * 1. Tách mọi khối <script> trong index.html và biên dịch thử (bắt lỗi cú pháp).
 * 2. Cân bằng ngoặc nhọn của CSS.
 * 3. Nhắc nếu build quá nặng (> 1.2 MB) hoặc thiếu tag chủ sở hữu.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FILE = path.join(ROOT, 'index.html');
const html = fs.readFileSync(FILE, 'utf8');
let fail = 0;

const size = Buffer.byteLength(html);
console.log(`index.html: ${(size / 1024).toFixed(0)} KB`);

/* 1. cú pháp JS */
const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
scripts.forEach((code, i) => {
  try {
    new Function(code);
  } catch (e) {
    fail++;
    console.error(`✗ khối <script> #${i + 1}: ${e.message}`);
  }
});
console.log(`script: ${scripts.length} khối · lỗi: ${fail}`);

/* 2. CSS */
const css = (html.match(/<style[^>]*>([\s\S]*?)<\/style>/) || [, ''])[1];
const open = (css.match(/{/g) || []).length, close = (css.match(/}/g) || []).length;
if (open !== close) { fail++; console.error(`✗ CSS lệch ngoặc: ${open} { · ${close} }`); }
console.log(`css: ${open} khối · ${(Buffer.byteLength(css) / 1024).toFixed(0)} KB`);

/* 3. dấu hiệu nhận diện */
const must = ['@nggkhaiz', 'github.com/Ngg.Khaiz', 'id="main"', 'window.addEventListener(\'hashchange\''];
must.forEach(s => { if (!html.includes(s)) { fail++; console.error(`✗ thiếu: ${s}`); } });

if (size > 1.2 * 1024 * 1024) { fail++; console.error('✗ quá nặng (> 1.2 MB)'); }

console.log(fail ? `\n${fail} lỗi` : '\n✓ tất cả kiểm tra đều đạt');
process.exit(fail ? 1 : 0);
