// Dựng site: khung mới (lịch tuần, 8 môn năm 2) + bản Vật lí tại /physic/.
// Chạy: node site/build.mjs [--out thư-mục]   (mặc định: site-dist/)
//
// Bản Vật lí do src/build.py --physics-only sinh ra. Các trang đó có khối
// <script> inline có băm SHA-256 trong CSP, nên site dùng đúng chuỗi CSP đó:
// không thể có hai CSP cho hai phần của cùng một origin.
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const SRC = path.join(HERE, 'src');
const DEFAULT_OUT = path.resolve(ROOT, 'site-dist');

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function routesFrom(courses) {
  return [
    { path: '/', title: 'Kế hoạch học — lịch tuần và môn học', desc: 'Lịch tuần, việc cần làm và các môn học tự tạo.', page: 'planner' },
    { path: '/tai-khoan/', title: 'Tài khoản — Kế hoạch học', desc: 'Đăng nhập để đồng bộ kế hoạch học, hoặc dùng ở chế độ khách.', page: 'account' },
    { path: '/quyen-rieng-tu/', title: 'Quyền riêng tư — Kế hoạch học', desc: 'Dữ liệu nào được lưu, lưu ở đâu, và cách xoá.', page: 'privacy' },
    ...courses.map(c => ({ path: '/' + c.slug + '/', title: c.name + ' — Kế hoạch học', desc: c.summary, page: 'course:' + c.slug })),
  ];
}

// Cấu hình đám mây lấy từ biến môi trường lúc build (Cloudflare build hoặc shell).
// Việc kiểm tra định dạng và từ chối khoá bí mật nằm trong src/build.py; ở đây chỉ đọc.
export function cloudConfigFromEnv(env = process.env) {
  const url = String(env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const key = String(env.SUPABASE_PUBLISHABLE_KEY || '').trim();
  return url && key ? { url, key } : null;
}

export function configModule(cfg) {
  return '// Sinh ra bởi site/build.mjs từ biến môi trường. Không sửa tay.\n' +
    'export const CLOUD = ' + (cfg ? 'Object.freeze(' + JSON.stringify(cfg) + ')' : 'null') + ';\n';
}

export function renderPage(shell, route) {
  return shell
    .replace('__TITLE__', esc(route.title))
    .replace('__DESC__', esc(route.desc))
    .replace('__PAGE__', esc(route.page));
}

// Gọi build Python của app Vật lí. Trả về CSP đã dùng cho bản đó.
export async function buildPhysics(out) {
  const dir = path.join(out, 'physic');
  await mkdir(dir, { recursive: true });
  const cspFile = path.join(os.tmpdir(), 'sf-physics-csp-' + process.pid + '.txt');
  try {
    execFileSync('python3', [
      path.join(ROOT, 'src', 'build.py'), '--physics-only',
      '--out', path.join(dir, 'index.html'), '--csp-out', cspFile,
    ], { stdio: 'pipe' });
  } catch (err) {
    // build.py từ chối cấu hình sai (URL, khoá bí mật...). Hiện đúng lý do.
    throw new Error('Cấu hình build không hợp lệ: ' + String(err.stderr || err.message).trim());
  }
  const csp = (await readFile(cspFile, 'utf8')).trim();
  await rm(cspFile, { force: true });
  return csp;
}

function headersFile(csp) {
  return [
    '/*',
    `  Content-Security-Policy: ${csp}`,
    '  X-Content-Type-Options: nosniff',
    '  Referrer-Policy: strict-origin-when-cross-origin',
    '  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    '  Cross-Origin-Opener-Policy: same-origin',
    '  Cross-Origin-Resource-Policy: same-origin',
    '/assets/*',
    '  Cache-Control: no-cache',
    '',
  ].join('\n');
}

export async function buildSite({ out = DEFAULT_OUT } = {}) {
  const { COURSES } = await import(pathToFileURL(path.join(SRC, 'courses.js')).href);
  const shell = await readFile(path.join(HERE, 'shell.html'), 'utf8');
  const routes = routesFrom(COURSES);

  await rm(out, { recursive: true, force: true });
  await mkdir(path.join(out, 'assets'), { recursive: true });
  for (const f of ['app.js', 'boot.js', 'cloud.js', 'logic.js', 'store.js', 'courses.js', 'styles.css']) {
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

  // Vật lí: build riêng, kèm font (fonts.css dùng đường dẫn tương đối).
  const csp = await buildPhysics(out);
  await writeFile(path.join(out, 'assets', 'config.js'), configModule(cloudConfigFromEnv()));
  await cp(path.join(ROOT, 'src', 'fonts'), path.join(out, 'physic', 'fonts'), {
    recursive: true, filter: f => !path.basename(f).startsWith('LICENSE-'),
  });

  await writeFile(path.join(out, '_headers'), headersFile(csp));
  return { out, routes: [...routes.map(r => r.path), '/physic/'], csp, cloud: !!cloudConfigFromEnv() };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const i = process.argv.indexOf('--out');
  const out = i > -1 && process.argv[i + 1] ? path.resolve(process.argv[i + 1]) : DEFAULT_OUT;
  const { routes } = await buildSite({ out });
  console.log(`site: ${routes.length} đường dẫn → ${path.relative(process.cwd(), out) || '.'}`);
}
