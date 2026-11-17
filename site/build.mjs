// Dựng site tĩnh: mỗi môn có đường dẫn riêng, cùng một bộ mã JS/CSS.
// Chạy: node site/build.mjs [--out thư-mục]   (mặc định: site-dist/)
// Không có phụ thuộc ngoài. Không sinh script inline, nên CSP chỉ cần 'self'.
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, 'src');
const DEFAULT_OUT = path.resolve(HERE, '..', 'site-dist');

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function routesFrom(courses) {
  return [
    { path: '/', title: 'Kế hoạch học — lịch tuần và môn học', desc: 'Lịch tuần, việc cần làm và các môn học tự tạo.', page: 'planner' },
    { path: '/physic/', title: 'Vật lí — Kế hoạch học', desc: 'Phần Vật lí.', page: 'physics' },
    ...courses.map(c => ({ path: '/' + c.slug + '/', title: c.name + ' — Kế hoạch học', desc: c.summary, page: 'course:' + c.slug })),
  ];
}

export function renderPage(shell, route) {
  return shell
    .replace('__TITLE__', esc(route.title))
    .replace('__DESC__', esc(route.desc))
    .replace('__PAGE__', esc(route.page));
}

export async function buildSite({ out = DEFAULT_OUT } = {}) {
  const { COURSES } = await import(pathToFileURL(path.join(SRC, 'courses.js')).href);
  const shell = await readFile(path.join(HERE, 'shell.html'), 'utf8');
  const routes = routesFrom(COURSES);

  await rm(out, { recursive: true, force: true });
  await mkdir(path.join(out, 'assets'), { recursive: true });
  for (const f of ['app.js', 'boot.js', 'logic.js', 'store.js', 'courses.js', 'styles.css']) {
    await cp(path.join(SRC, f), path.join(out, 'assets', f));
  }

  for (const route of routes) {
    const dir = path.join(out, route.path);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'index.html'), renderPage(shell, route));
  }

  await writeFile(path.join(out, '404.html'), renderPage(shell, {
    path: '/404', title: 'Không tìm thấy trang — Kế hoạch học', desc: 'Trang này không tồn tại.', page: 'notfound',
  }));

  await writeFile(path.join(out, '_headers'), [
    '/*',
    `  Content-Security-Policy: ${CSP}`,
    '  X-Content-Type-Options: nosniff',
    '  Referrer-Policy: strict-origin-when-cross-origin',
    '  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()',
    '  Cross-Origin-Opener-Policy: same-origin',
    '/assets/*',
    '  Cache-Control: no-cache',
    '',
  ].join('\n'));

  return { out, routes: routes.map(r => r.path) };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const i = process.argv.indexOf('--out');
  const out = i > -1 && process.argv[i + 1] ? path.resolve(process.argv[i + 1]) : DEFAULT_OUT;
  const { routes } = await buildSite({ out });
  console.log(`site: ${routes.length} trang → ${path.relative(process.cwd(), out) || '.'}`);
}

export { CSP };
