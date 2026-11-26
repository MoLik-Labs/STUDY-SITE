// Dựng web hướng dẫn (tiếng Việt) từ tutorial/index.md và tutorial/content/*.md.
// Mỗi chương là một trang HTML tĩnh; không có script (khớp CSP chặt của site).
// Được gọi từ site/build.mjs (npm run build) → ghi vào dist/huong-dan/, phục vụ tại /huong-dan/.
import { readFileSync, readdirSync } from 'node:fs';
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CONTENT = path.join(HERE, 'content');
const ASSETS = path.join(HERE, 'assets');
const INDEX_SOURCE = path.join(HERE, 'index.md');
const SITE_NAME = 'Hướng dẫn làm việc với STUDY-SITE';

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const stripTags = s => String(s).replace(/<[^>]*>/g, '');
const CALLOUTS = { 'Mẹo': 'tip', 'Lưu ý': 'note', 'Cảnh báo': 'warn', 'Quy tắc': 'rule' };

export function slugify(s) {
  return String(s)
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Tách nguồn: tiêu đề H1, đoạn mô tả đầu tiên (dùng làm phần dẫn), phần thân không còn đoạn đó.
// Bỏ qua dòng trong khối mã.
export function parseChapter(md) {
  const lines = md.split('\n');
  const h1 = lines.findIndex(l => /^# /.test(l));
  if (h1 < 0) throw new Error('Chương thiếu tiêu đề cấp 1 (# ...)');
  const title = lines[h1].replace(/^# /, '').trim();
  const rest = lines.slice(h1 + 1);
  // Đoạn mô tả: đoạn văn đầu tiên sau H1 (không phải tiêu đề, danh sách, bảng, trích dẫn hay khối mã).
  const used = new Set();
  let desc = '';
  for (let i = 0; i < rest.length; i++) {
    const t = rest[i].trim();
    if (t === '') { if (desc) break; continue; }
    if (/^(```|~~~|#|\||[-*]|\d+\.|>)/.test(t)) break;
    desc = desc ? desc + ' ' + t : t;
    used.add(i);
  }
  const body = rest.filter((_, i) => !used.has(i)).join('\n').replace(/^\s+/, '').trim();
  return { title, desc: stripTags(desc).replace(/\*\*|__|`/g, ''), body };
}

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
        // H1 do khung trang đưa vào; ## trong nguồn → h2; ### → h3.
        if (depth === 2 || depth === 3) toc.push({ id, text: plain, depth });
        const level = Math.min(Math.max(depth, 2), 4);
        return `<h${level} id="${id}">${text}</h${level}>\n`;
      },
      blockquote({ tokens }) {
        const inner = this.parser.parse(tokens);
        const m = /^<p><strong>([^<:]+):<\/strong>\s*/.exec(inner);
        const kind = m && CALLOUTS[m[1].trim()];
        if (!kind) return `<blockquote>\n${inner}</blockquote>\n`;
        const label = m[1].trim();
        const body = inner.replace(m[0], '<p>');
        return `<aside class="callout callout-${kind}" aria-label="${esc(label)}"><p class="callout-label">${esc(label)}</p>\n${body}</aside>\n`;
      },
    },
  });
  return {
    render(md) {
      ids = new Map();
      toc = [];
      let html = marked.parse(md);
      html = html.replace(/<pre>/g, '<div class="codewrap"><pre>').replace(/<\/pre>/g, '</pre></div>');
      html = html.replace(/<table>/g, '<div class="tablewrap"><table>').replace(/<\/table>/g, '</table></div>');
      return { html, toc: [...toc] };
    },
  };
}

export function loadChapters(dir = CONTENT) {
  const files = readdirSync(dir).filter(f => /^\d{2}-.+\.md$/.test(f)).sort();
  return files.map(f => {
    const number = Number(f.slice(0, 2));
    const parsed = parseChapter(readFileSync(path.join(dir, f), 'utf8'));
    return { number, file: f.replace(/\.md$/, '.html'), title: parsed.title, desc: parsed.desc, body: parsed.body };
  });
}

function nav(chapters, current) {
  const items = chapters.map(c => {
    const on = c.file === current ? ' class="on" aria-current="page"' : '';
    return `<li><a href="${c.file}"${on}><span class="num">${String(c.number).padStart(2, '0')}</span>${esc(c.title)}</a></li>`;
  }).join('\n');
  return `<nav class="side" aria-label="Các chương">
  <p class="side-title">Các chương</p>
  <ol>
${items}
  </ol>
</nav>`;
}

function tocAside(toc) {
  if (!toc.length) return '';
  const items = toc.map(t => `<li class="d${t.depth}"><a href="#${t.id}">${stripTags(t.text)}</a></li>`).join('');
  return `<aside class="toc" aria-label="Mục trong trang"><p class="toc-title">Trong trang này</p><ul>${items}</ul></aside>`;
}

function pager(chapters, i, isIndex) {
  const prev = isIndex ? null : (i === 0 ? { file: 'index.html', title: 'Trang tổng quan' } : chapters[i - 1]);
  const next = isIndex ? chapters[0] : chapters[i + 1];
  const p = prev ? `<a class="prev" href="${prev.file}"><span>← Trước</span>${esc(prev.title)}</a>` : '<span></span>';
  const n = next ? `<a class="next" href="${next.file}"><span>Tiếp →</span>${esc(next.title)}</a>` : '<span></span>';
  return `<nav class="pager" aria-label="Chuyển chương">${p}${n}</nav>`;
}

export function pageShell({ title, desc, bodyHtml, toc, navHtml, pagerHtml, isIndex = false, pageTitle }) {
  const headTitle = isIndex ? SITE_NAME : `${title} — ${SITE_NAME}`;
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(headTitle)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="stylesheet" href="assets/tutorial.css">
</head>
<body>
<a class="skip" href="#main">Bỏ qua menu</a>
<header class="top">
  <a class="brand" href="index.html">${esc(SITE_NAME)}</a>
  <nav class="ext" aria-label="Liên kết">
    <a href="/">Về trang học</a>
    <a href="https://github.com/MoLik-Labs/STUDY-SITE" rel="noopener">GitHub</a>
  </nav>
</header>
<div class="layout">
${navHtml}
<main id="main">
<article>
<h1>${esc(pageTitle || title)}</h1>
${desc && !isIndex ? `<p class="lead">${esc(desc)}</p>` : ''}
${bodyHtml}
</article>
${pagerHtml}
</main>
${toc}
</div>
<footer class="foot">Nội dung nằm trong <code>tutorial/content/</code>. Sau khi sửa, chạy <code>npm run build</code> rồi <code>npm run serve</code> để xem thử.</footer>
</body>
</html>
`;
}

// Dựng toàn bộ web hướng dẫn vào out. Trả về danh sách file đã ghi (dùng cho kiểm thử).
export async function buildTutorial({ out, contentDir = CONTENT, indexSource = INDEX_SOURCE } = {}) {
  const chapters = loadChapters(contentDir);
  if (!chapters.length) throw new Error('Không có chương nào trong ' + contentDir);
  const numbers = chapters.map(c => c.number);
  if (new Set(numbers).size !== numbers.length) throw new Error('Trùng số chương');

  if (!out) throw new Error('Thiếu thư mục đích');
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  await cp(ASSETS, path.join(out, 'assets'), { recursive: true });

  const renderer = makeRenderer();
  const written = [];
  const put = async (file, html) => {
    await writeFile(path.join(out, file), html, 'utf8');
    written.push(file);
  };

  // Trang tổng quan: phần giới thiệu + lưới các chương.
  const introMd = readFileSync(indexSource, 'utf8');
  const intro = renderer.render(introMd.replace(/^# .*\n?/, ''));
  const cards = chapters.map(c => `<li><a class="card" href="${c.file}"><span class="card-num">${String(c.number).padStart(2, '0')}</span><span class="card-title">${esc(c.title)}</span><span class="card-desc">${esc(c.desc)}</span></a></li>`).join('\n');
  const indexBody = `${intro.html}
<h2 id="lo-trinh">Lộ trình</h2>
<p>Đọc theo thứ tự từ chương 00 đến 11 nếu bạn mới bắt đầu. Đã quen Git thì có thể nhảy thẳng tới chương cần.</p>
<ol class="cards">
${cards}
</ol>`;
  await put('index.html', pageShell({
    title: 'Tổng quan',
    pageTitle: 'Hướng dẫn làm việc với STUDY-SITE',
    desc: 'Hướng dẫn từng bước: tải dự án, upload và push lên GitHub, làm việc theo nhánh, và các cách làm việc hiệu quả.',
    bodyHtml: indexBody,
    toc: tocAside(intro.toc),
    navHtml: nav(chapters, 'index.html'),
    pagerHtml: pager(chapters, -1, true),
    isIndex: true,
  }));

  for (let i = 0; i < chapters.length; i++) {
    const c = chapters[i];
    const { html, toc } = renderer.render(c.body);
    await put(c.file, pageShell({
      title: c.title,
      desc: c.desc,
      bodyHtml: html,
      toc: tocAside(toc),
      navHtml: nav(chapters, c.file),
      pagerHtml: pager(chapters, i, false),
    }));
  }
  return written;
}
