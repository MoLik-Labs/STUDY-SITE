// Dựng dist/ — thư mục duy nhất mà Cloudflare Workers deploy.
// Chạy: node site/build.mjs [--out thư-mục]      (mặc định: dist/)
//
// Gồm: web hướng dẫn tại /huong-dan/ (tutorial/build.mjs), khung site (lịch tuần, 8 môn, bấm giờ, tài khoản, quyền riêng tư) được esbuild gom thành
// app shell + các chunk tải lười (Firebase chỉ tải khi cần), bản Vật lí tại /physic/ (do src/build.py
// --physics-only sinh), _headers với CSP băm, sw.js, _worker.mjs, 404.html.
// Cấu hình Firebase KHÔNG nằm trong dist/: Worker đọc biến môi trường lúc chạy (xem /assets/config.js).
import { readFileSync } from 'node:fs';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build as esbuild } from 'esbuild';
import { buildTutorial } from '../tutorial/build.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const SRC = path.join(HERE, 'src');
const DEFAULT_OUT = path.resolve(ROOT, 'dist');
// config.js không có trong mã nguồn: Worker phục vụ /assets/config.js từ biến môi trường.
const SITE_EXTERNAL = ['./config.js'];

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function routesFrom(courses) {
  return [
    { path: '/', title: 'Kế hoạch học — lịch tuần và môn học', desc: 'Lịch tuần, việc cần làm và các môn học tự tạo.', page: 'planner' },
    { path: '/tai-khoan/', title: 'Tài khoản — Kế hoạch học', desc: 'Đăng nhập để đồng bộ kế hoạch học, hoặc dùng ở chế độ khách.', page: 'account' },
    { path: '/quyen-rieng-tu/', title: 'Quyền riêng tư — Kế hoạch học', desc: 'Dữ liệu nào được lưu, lưu ở đâu, và cách xoá.', page: 'privacy' },
    ...courses.map(c => ({ path: '/' + c.slug + '/', title: c.name + ' — Kế hoạch học', desc: c.summary, page: 'course:' + c.slug })),
  ];
}

export function renderPage(shell, route) {
  return shell
    .replace('__TITLE__', esc(route.title))
    .replace('__DESC__', esc(route.desc))
    .replace('__PAGE__', esc(route.page));
}

// Bản Vật lí: src/build.py --physics-only. Trả về CSP băm của bản đó.
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
    throw new Error('Không dựng được bản Vật lí: ' + String(err.stderr || err.message).trim());
  }
  const csp = (await readFile(cspFile, 'utf8')).trim();
  await rm(cspFile, { force: true });
  return csp;
}

// Máy chủ Firebase và reCAPTCHA (App Check) mà trình duyệt cần gọi. Danh sách nằm trong
// firebase-origins.json, dùng chung với src/build.py: meta CSP của bản Vật lí và header của site
// phải giống nhau. Trình duyệt áp dụng cả hai, nên thiếu ở một chỗ là chặn hết kết nối.
const ORIGINS = JSON.parse(readFileSync(path.join(HERE, 'firebase-origins.json'), 'utf8'));

// Thêm các origin còn thiếu vào một directive (không nhân đôi). connect-src và script-src phải có sẵn
// (thiếu là lỗi cấu hình). frame-src thiếu thì thêm mới, vì bản Vật lí không luôn có directive này.
function withOrigins(csp, directive, origins) {
  const re = new RegExp('(^|; )' + directive + ' ([^;]*)');
  const m = csp.match(re);
  if (!m) {
    if (directive === 'frame-src') return csp + '; frame-src ' + origins.join(' ');
    throw new Error('CSP không có ' + directive);
  }
  const have = new Set(m[2].split(/\s+/));
  const add = origins.filter(o => !have.has(o));
  if (!add.length) return csp;
  return csp.replace(re, (all, pre, list) => pre + directive + ' ' + list + ' ' + add.join(' '));
}

// CSP của site = CSP của bản Vật lí, với các máy chủ Firebase/reCAPTCHA đảm bảo có mặt.
// Script vẫn bị giới hạn 'self' + băm; không có 'unsafe-inline' hay 'unsafe-eval'.
export function siteCsp(physicsCsp) {
  let next = withOrigins(physicsCsp, 'connect-src', ORIGINS.connect);
  next = withOrigins(next, 'script-src', ORIGINS.script);
  return withOrigins(next, 'frame-src', ORIGINS.frame);
}

// Gom JS của site: boot.js (trang) và firebase-sdk.js (Firebase, tải lười) là hai entry; phần dùng chung thành chunk.
export async function bundleSite(out) {
  await esbuild({
    // firebase-sdk.js là entry riêng: bản Vật lí (src/account.js) tải nó bằng import() từ /assets/.
    entryPoints: [path.join(SRC, 'boot.js'), path.join(SRC, 'firebase-sdk.js')],
    outdir: path.join(out, 'assets'),
    bundle: true,
    format: 'esm',
    splitting: true,
    minify: true,
    target: ['es2020'],
    entryNames: '[name]',
    chunkNames: 'chunk-[hash]',
    external: SITE_EXTERNAL,
    legalComments: 'none',
    sourcemap: false,
    logLevel: 'warning',
  });
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
    '  Cache-Control: public, max-age=0, must-revalidate',
    '/sw.js',
    '  Cache-Control: public, max-age=0, must-revalidate',
    '/__version',
    '  Cache-Control: no-store',
    '',
  ].join('\n');
}

// Băm nội dung mọi tệp (đã sắp xếp) → mã build. Cùng mã nguồn luôn ra cùng mã.
async function buildId(out) {
  const files = [];
  async function walk(dir) {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) await walk(p);
      else if (!e.name.startsWith('_worker') && e.name !== 'sw.js') files.push(p);
    }
  }
  await walk(out);
  const h = createHash('sha256');
  for (const f of files.sort()) {
    h.update(path.relative(out, f));
    h.update(await readFile(f));
  }
  return h.digest('hex').slice(0, 12);
}

export async function buildSite({ out = DEFAULT_OUT } = {}) {
  const { COURSES } = await import(pathToFileURL(path.join(SRC, 'courses.js')).href);
  const shell = await readFile(path.join(HERE, 'shell.html'), 'utf8');
  const routes = routesFrom(COURSES);
  const version = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8')).version;

  await rm(out, { recursive: true, force: true });
  await mkdir(path.join(out, 'assets'), { recursive: true });
  await cp(path.join(SRC, 'styles.css'), path.join(out, 'assets', 'styles.css'));
  await bundleSite(out);

  for (const route of routes) {
    const dir = path.join(out, route.path);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'index.html'), renderPage(shell, route));
  }
  await writeFile(path.join(out, '404.html'), renderPage(shell, {
    path: '/404', title: 'Không tìm thấy trang — Kế hoạch học', desc: 'Trang này không tồn tại.', page: 'notfound',
  }));
  // Web hướng dẫn GitHub (tĩnh, không script) tại /huong-dan/; nguồn ở tutorial/content/.
  const tutorialOut = path.join(out, 'huong-dan');
  await buildTutorial({ out: tutorialOut });
  const tutorialPages = (await readdir(tutorialOut)).filter(f => f.endsWith('.html')).map(f => '/huong-dan/' + (f === 'index.html' ? '' : f));

  const physicsCsp = await buildPhysics(out);
  await cp(path.join(ROOT, 'src', 'fonts'), path.join(out, 'physic', 'fonts'), {
    recursive: true, filter: f => !path.basename(f).startsWith('LICENSE-'),
  });
  const csp = siteCsp(physicsCsp);
  await writeFile(path.join(out, '_headers'), headersFile(csp));
  await writeFile(path.join(out, '.nojekyll'), '');

  // Mã build cố định theo nội dung; thời điểm build lấy từ SOURCE_DATE_EPOCH (mặc định 0) để không đổi mỗi lần dựng.
  const build = await buildId(out);
  const epoch = Number(process.env.SOURCE_DATE_EPOCH || 0);
  const builtAt = new Date(epoch * 1000).toISOString().replace('.000Z', 'Z');
  const workerSrc = (await readFile(path.join(HERE, 'worker.template.js'), 'utf8'))
    .replace('__VERSION__', version)
    .replace('__BUILD_ID__', build)
    .replace('__BUILT_AT__', builtAt);
  // Worker gom cả logic.js và api.js thành một tệp (không có import ngoài).
  const bundled = await esbuild({
    stdin: { contents: workerSrc, resolveDir: HERE, sourcefile: 'worker.template.js', loader: 'js' },
    bundle: true, format: 'esm', platform: 'neutral', target: 'es2022', write: false,
    legalComments: 'none', minify: true,
  });
  await writeFile(path.join(out, '_worker.mjs'), bundled.outputFiles[0].text);

  // Danh sách precache: mọi trang, bản Vật lí và mọi tệp trong assets/ (gồm chunk Firebase).
  const assetFiles = (await readdir(path.join(out, 'assets'))).filter(f => /\.(js|css)$/.test(f)).map(f => '/assets/' + f);
  const precache = ['/', '/404.html', '/physic/', '/physic/index.html', ...routes.map(r => r.path), ...tutorialPages, '/huong-dan/assets/tutorial.css', ...assetFiles];
  const sw = (await readFile(path.join(SRC, 'sw.template.js'), 'utf8'))
    .replace('__BUILD_ID__', build)
    .replace('__PRECACHE__', JSON.stringify([...new Set(precache)]));
  await writeFile(path.join(out, 'sw.js'), sw);

  await writeFile(path.join(out, '.assetsignore'),
    '# Cloudflare — sinh tự động. _worker.mjs là mã Worker, không phải tài nguyên tĩnh.\n_worker.mjs\n.nojekyll\n');

  return { out, routes: routes.map(r => r.path), csp, build, version, assets: assetFiles };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const i = process.argv.indexOf('--out');
  const out = i > -1 && process.argv[i + 1] ? path.resolve(process.argv[i + 1]) : DEFAULT_OUT;
  const { routes, build, version } = await buildSite({ out });
  console.log(`dist: ${routes.length + 1} trang + /physic/ → ${path.relative(process.cwd(), out) || '.'}  (v${version}, build ${build})`);
}
