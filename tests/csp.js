#!/usr/bin/env node
/**
 * tests/csp.js — kiểm tra Content-Security-Policy của bản build.
 *
 * CSP sai một hash là cả trang trắng trên Cloudflare Pages, nên phải kiểm:
 *   1. Có meta CSP
 *   2. MỌI khối <script> nội tuyến đều có hash khớp trong script-src
 *   3. Hash của <style> có trong style-src
 *   4. Không có 'unsafe-inline' / 'unsafe-eval' cho script/style
 *   5. Không có thuộc tính on*="" nào trong HTML (CSP nghiêm sẽ chặn)
 *   6. Mọi origin mà app thật sự gọi đều nằm trong danh sách cho phép
 */
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

const results = [];
const ok = (name, cond, note) => results.push({ name, pass: !!cond, note: note === undefined ? '' : String(note) });
const sha256 = t => "'sha256-" + crypto.createHash('sha256').update(t, 'utf8').digest('base64') + "'";

/* ---------- 1. meta CSP ---------- */
const m = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]*)">/);
ok('có meta CSP', !!m);
const csp = m ? m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&') : '';

const directive = name => {
  const d = csp.split(';').map(s => s.trim()).find(s => s.startsWith(name + ' '));
  return d ? d.slice(name.length + 1).trim() : '';
};

/* ---------- 2. hash cho mọi script nội tuyến ---------- */
const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(x => x[1]);
const scriptSrc = directive('script-src');
const missing = scripts.filter(code => !scriptSrc.includes(sha256(code)));
ok('mọi <script> nội tuyến có hash trong script-src', missing.length === 0,
  missing.length ? missing.length + ' khối thiếu hash' : scripts.length + ' khối');
ok('có ít nhất 5 khối script', scripts.length >= 5, scripts.length + ' khối');

/* ---------- 3. hash cho style ----------
   Phải bỏ các khối <script> trước: trong board.js có một chuỗi
   '<style>${css}</style>' dùng để xuất SVG, nếu không bỏ sẽ bị đếm nhầm
   thành một khối style thứ hai và báo thiếu hash sai. */
const htmlNoJs = html.replace(/<script[^>]*>[\s\S]*?<\/script>/g, '');
const styles = [...htmlNoJs.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(x => x[1]);
const styleSrc = directive('style-src-elem') || directive('style-src');
const missingStyle = styles.filter(css => !styleSrc.includes(sha256(css)));
ok('mọi <style> nội tuyến có hash trong style-src-elem', missingStyle.length === 0,
  missingStyle.length ? missingStyle.length + ' khối thiếu hash' : styles.length + ' khối');

/* ---------- 4. không nới lỏng ---------- */
ok("script-src không có 'unsafe-inline'", !/(^|;)\s*script-src[^;]*'unsafe-inline'/.test(csp));
ok("style-src-elem không có 'unsafe-inline'", !/(^|;)\s*style-src-elem[^;]*'unsafe-inline'/.test(csp));
ok("style-src-attr chỉ cho CSS (không chạy được JS)", directive('style-src-attr') === "'unsafe-inline'");
ok("không có 'unsafe-eval'", !csp.includes("'unsafe-eval'"));
ok("script-src không dùng host lạ", !/script-src[^;]*https?:\/\//.test(csp));
ok("object-src 'none'", directive('object-src') === "'none'");
ok("base-uri 'none'", directive('base-uri') === "'none'");
ok("frame-ancestors giới hạn", /frame-ancestors (?!\*)/.test(csp));

/* ---------- 5. không có on*="" trong HTML ---------- */
const inlineHandlers = [...html.matchAll(/\son[a-z]+\s*=\s*["']/g)].map(x => x[0].trim());
ok('không có thuộc tính on*="" (CSP nghiêm sẽ chặn)', inlineHandlers.length === 0,
  inlineHandlers.slice(0, 4).join(' '));

/* ---------- 6. origin được gọi đều được cho phép ---------- */
const origins = [...new Set(
  [...html.matchAll(/https?:\/\/([a-z0-9.-]+)/g)].map(x => x[1]).filter(h => !/w3\.org|schema/.test(h))
)];
const allowed = {
  'fonts.googleapis.com': 'style-src',
  'fonts.gstatic.com': 'font-src',
  'www.youtube-nocookie.com': 'frame-src',
  'www.youtube.com': 'frame-src',
  'i.ytimg.com': 'img-src',
  'github.com': '(link ra ngoài, không phải tài nguyên tải về)',
  'drive.google.com': '(link ra ngoài)',
};
/* Chỉ những origin thật sự ĐƯỢC TẢI VỀ (stylesheet, font, ảnh, iframe, âm thanh)
   mới cần có trong CSP. Link người dùng bấm ra ngoài thì không. */
const LOADS = /<(?:link[^>]+rel="stylesheet"[^>]+href|img[^>]+src|iframe[^>]+src|source[^>]+src)="https?:\/\/([a-z0-9.-]+)/g;
const loaded = [...new Set([...html.matchAll(LOADS)].map(m => m[1]))];
const unlisted = loaded.filter(h => !(h in allowed) &&
  !/^(thuvienvatly|dethi|vndoc|vnteach|thuviendethi)\./.test(h) &&
  !/invidious/.test(h));
ok('mọi tài nguyên tải về đều nằm trong CSP', unlisted.length === 0,
  unlisted.length ? unlisted.join(', ') : loaded.length + ' origin');
ok('mọi origin tải tài nguyên đều nằm trong CSP', unlisted.length === 0, unlisted.join(', '));

/* ---------- 7. tệp Cloudflare ---------- */
/* sw.js được sinh vào dist/ (không commit ở gốc) — kiểm ở cả hai chỗ */
const distFile = f => path.join(ROOT, 'dist', f);
/* 404.html được sinh ra để `not_found_handling: 404-page` của Workers có tệp trả về */
ok('có 404.html trong dist/ (Workers not_found_handling)', fs.existsSync(distFile('404.html')));
ok('có .assetsignore (không lộ mã nguồn)', fs.existsSync(distFile('.assetsignore')));
ok('có _worker.mjs trong dist/', fs.existsSync(distFile('_worker.mjs')));
ok('_worker.mjs bắt đầu bằng _ (Cloudflare không phục vụ)', true);
['_headers', '_redirects', 'sw.js'].forEach(f => {
  const atRoot = fs.existsSync(path.join(ROOT, f));
  const atDist = fs.existsSync(distFile(f));
  ok('có ' + f, atRoot || atDist, atDist ? 'trong dist/' : atRoot ? 'ở gốc' : 'thiếu');
});
/* service worker phải mang đúng số phiên bản của bản build */
const swPath = fs.existsSync(distFile('sw.js')) ? distFile('sw.js') : path.join(ROOT, 'sw.js');
if (fs.existsSync(swPath)) {
  const sw = fs.readFileSync(swPath, 'utf8');
  const meta = (html.match(/<meta name="app-version" content="([^"]+)"/) || [, ''])[1];
  ok('sw.js cache đúng phiên bản', sw.includes('vnl9-v' + meta), 'v' + meta);
  ok('sw.js không precache origin ngoài', !/addAll\(\s*\[[^\]]*https?:/.test(sw));
}
const headers = fs.existsSync(path.join(ROOT, '_headers'))
  ? fs.readFileSync(path.join(ROOT, '_headers'), 'utf8') : '';
['X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy', 'Cache-Control'].forEach(h => {
  ok('_headers có ' + h, headers.includes(h));
});

/* ---------- in ---------- */
const pass = results.filter(r => r.pass).length;
results.filter(r => !r.pass).forEach(r => console.log('  ✗ ' + r.name + (r.note ? ' — ' + r.note : '')));
console.log(`\n${pass}/${results.length} bước đạt` + (pass === results.length ? '  ✓' : ''));
if (!pass === results.length) console.log('\nCSP:\n' + csp);
process.exit(pass === results.length ? 0 : 1);
