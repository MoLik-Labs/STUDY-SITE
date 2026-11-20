// Dựng web tài liệu từ docs/FIREBASE-SETUP.md (nguồn duy nhất).
// Mỗi mục "## N. Tiêu đề" thành một trang HTML tĩnh. Không có script inline (khớp CSP).
// Chạy: node docs-site/build.mjs            → ghi vào docs-site/dist/
// Kiểm tra: npm test (so bản dist/ đã commit với bản dựng lại).
import { readFileSync } from 'node:fs';
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Marked } from 'marked';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const SOURCE = path.join(ROOT, 'docs', 'FIREBASE-SETUP.md');
const ASSETS = path.join(HERE, 'assets');

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const stripTags = s => String(s).replace(/<[^>]*>/g, '');

export function slugify(s) {
  return String(s)
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Tách nguồn thành: phần mở đầu (trước mục H2 đầu) và các mục H2. Bỏ qua dòng trong khối mã.
export function splitSource(md) {
  const lines = md.split('\n');
  const intro = [];
  const sections = [];
  let cur = null;
  let fence = false;
  for (const line of lines) {
    if (/^(```|~~~)/.test(line)) fence = !fence;
    const h2 = !fence && /^## (.+)$/.exec(line);
    if (h2) {
      cur = { heading: h2[1].trim(), body: [] };
      sections.push(cur);
    } else if (cur) {
      cur.body.push(line);
    } else {
      intro.push(line);
    }
  }
  return {
    intro: intro.join('\n').trim(),
    sections: sections.map(s => {
      const m = /^(\d+)\.\s*(.*)$/.exec(s.heading);
      const number = m ? Number(m[1]) : null;
      const title = m ? m[2] : s.heading;
      const slug = (number !== null ? String(number).padStart(2, '0') + '-' : '') + slugify(title);
      return { number, title, slug, body: s.body.join('\n').trim() };
    }),
  };
}

// Markdown → HTML. Tiêu đề có id (để mục lục nhảy tới), dòng tiêu đề H3 được gom để làm mục lục.
function makeRenderer() {
  let ids = new Map();
  let toc = [];
  const marked = new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        const plain = stripTags(text);
        let id = slugify(plain) || 'muc';
        const n = ids.get(id) || 0;
        ids.set(id, n + 1);
        if (n) id = id + '-' + (n + 1);
        // Tiêu đề trang (H1) do khung trang đưa vào, nên ### trong nguồn → h2, #### → h3.
        // Mục lục lấy các ### trong nguồn (cấp h2 trên trang).
        if (depth === 3) toc.push({ id, text: plain });
        const level = Math.max(depth - 1, 2);
        return `<h${level} id="${id}">${text}</h${level}>\n`;
      },
    },
  });
  return {
    render(md) {
      ids = new Map(); toc = [];
      let html = marked.parse(md);
      // Danh sách kiểm tra: đánh dấu lớp để CSS/JS nhận ra.
      html = html.replace(/<li><input /g, '<li class="task-list-item"><input ');
      // Bọc khối mã và bảng ngay trong HTML (không cần JS để không tràn khung).
      html = html.replace(/<pre>/g, '<div class="codewrap"><pre>').replace(/<\/pre>/g, '</pre></div>');
      html = html.replace(/<table>/g, '<div class="tablewrap"><table>').replace(/<\/table>/g, '</table></div>');
      return { html, toc: [...toc] };
    },
  };
}

const CSS_LINK = 'assets/docs.css';
const JS_LINK = 'assets/docs.js';

function page({ title, desc, bodyHtml, toc, current, pages, prev, next, depthBase = '' }) {
  const nav = pages.map(p => {
    const href = p.file;
    const cls = p.file === current ? ' class="on" aria-current="page"' : '';
    const label = p.number !== null ? `<span class="num">${p.number}</span>${esc(p.title)}` : esc(p.title);
    return `<li><a href="${href}"${cls}>${label}</a></li>`;
  }).join('\n');
  const tocHtml = toc.length
    ? `<aside class="toc" aria-label="Mục trong trang"><p class="toc-title">Trong trang này</p><ul>${toc.map(t => `<li><a href="#${t.id}">${stripTags(t.text)}</a></li>`).join('')}</ul></aside>`
    : '';
  const pager = `<nav class="pager" aria-label="Chuyển trang">${prev ? `<a class="prev" href="${prev.file}"><span>← Trước</span>${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a class="next" href="${next.file}"><span>Tiếp →</span>${esc(next.title)}</a>` : '<span></span>'}</nav>`;
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} — Cấu hình Firebase cho STUDY-SITE</title>
<meta name="description" content="${esc(desc)}">
<link rel="stylesheet" href="${depthBase}${CSS_LINK}">
</head>
<body>
<a class="skip" href="#main">Bỏ qua menu</a>
<header class="top">
  <a class="brand" href="${depthBase}index.html">Cấu hình Firebase cho STUDY-SITE</a>
  <nav class="ext" aria-label="Liên kết ngoài">
    <a href="https://console.firebase.google.com" rel="noopener">Firebase Console</a>
    <a href="https://github.com/MoLik-Labs/STUDY-SITE" rel="noopener">GitHub</a>
  </nav>
</header>
<div class="layout">
<aside class="side" aria-label="Danh sách mục">
  <p class="side-title">Các mục</p>
  <ol>
${nav}
  </ol>
</aside>
<main id="main">
<article>
<h1>${esc(title)}</h1>
${bodyHtml}
</article>
${pager}
</main>
${tocHtml}
</div>
<footer class="foot">Tài liệu này được dựng từ <code>docs/FIREBASE-SETUP.md</code>. Sửa nguồn đó rồi chạy <code>npm run docs</code>.</footer>
<script src="${depthBase}${JS_LINK}" defer></script>
</body>
</html>
`;
}

// Dựng toàn bộ trang vào thư mục out. Trả về danh sách file để kiểm thử.
export async function buildDocs({ source = SOURCE, out = path.join(HERE, 'dist') } = {}) {
  const md = readFileSync(source, 'utf8');
  const { intro, sections } = splitSource(md);
  const renderer = makeRenderer();

  const pages = [
    { number: null, title: 'Tổng quan', file: 'index.html' },
    ...sections.map(s => ({ number: s.number, title: s.title, file: s.slug + '.html', slug: s.slug })),
  ];

  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  await cp(ASSETS, path.join(out, 'assets'), { recursive: true });

  const written = [];
  const put = async (file, html) => {
    await writeFile(path.join(out, file), html, 'utf8');
    written.push(file);
  };

  // Trang tổng quan: phần mở đầu của nguồn + danh sách các mục.
  const introHtml = renderer.render(intro).html;
  const startHtml = `<h2 id="bat-dau">Bắt đầu</h2>
<p>Đọc theo thứ tự từ trên xuống, hoặc chọn mục ở menu bên trái. Mục 0 liệt kê những thứ cần chuẩn bị.</p>
<p><a class="btn" href="${pages[1].file}">Mở mục 0: ${esc(pages[1].title)}</a></p>`;
  await put('index.html', page({
    title: 'Cấu hình Firebase từ A đến Z',
    desc: 'Hướng dẫn từng bước cấu hình Firebase (đăng nhập, Firestore, App Check) cho STUDY-SITE, chạy trên Cloudflare Workers.',
    bodyHtml: introHtml + startHtml,
    toc: [],
    current: 'index.html',
    pages,
    prev: null,
    next: pages[1],
  }));

  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    const { html, toc } = renderer.render(s.body);
    const meta = pages[i + 1];
    await put(meta.file, page({
      title: (s.number !== null ? s.number + '. ' : '') + s.title,
      desc: 'Mục ' + (s.number ?? '') + ' của hướng dẫn cấu hình Firebase: ' + s.title + '.',
      bodyHtml: html,
      toc,
      current: meta.file,
      pages,
      prev: pages[i],
      next: pages[i + 2] || null,
    }));
  }
  return { out, files: written, pages };
}

// Chạy trực tiếp: node docs-site/build.mjs
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const { out, files } = await buildDocs();
  console.log(`docs: ${files.length} trang → ${path.relative(ROOT, out)}`);
}
