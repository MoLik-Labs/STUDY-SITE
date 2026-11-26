// Giao diện: logic chọn theme, đồng bộ danh sách theme với CSS, tương phản chữ ≥ 4.5:1 (WCAG AA) cho mọi theme,
// và bảng màu của web hướng dẫn (VitePress) trùng với site chính.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const T = await import(pathToFileURL(path.join(ROOT, 'site', 'src', 'theme.js')).href);
const css = readFileSync(path.join(ROOT, 'site', 'src', 'styles.css'), 'utf8');
const vpCss = readFileSync(path.join(ROOT, 'tutorial', '.vitepress', 'theme', 'custom.css'), 'utf8');

function memStorage(init = {}) {
  const m = new Map(Object.entries(init));
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), _m: m };
}

// Khối khai báo của một theme trong CSS (selector chứa data-theme='id').
function declarations(source, id, selectorRe = null) {
  const re = new RegExp(`([^{}]*\\[data-theme='${id}'\\][^{}]*)\\{([^}]*)\\}`, 'g');
  let out = null;
  for (const m of source.matchAll(re)) {
    if (selectorRe && !selectorRe.test(m[1])) continue;
    out = Object.assign(out || {}, parseDecl(m[2]));
  }
  return out;
}
function parseDecl(body) {
  const d = {};
  for (const m of body.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) d[m[1]] = m[2].trim();
  return d;
}
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  assert.match(h, /^[0-9a-fA-F]{6}$/, `giá trị không phải hex: ${hex}`);
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
}
function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const CONCRETE = T.THEMES.filter(t => t.id !== 'system').map(t => t.id);

test('danh sách theme: có "Theo máy" và 5 theme cụ thể, id duy nhất, mỗi theme cụ thể có scheme', () => {
  assert.equal(T.THEMES[0].id, 'system');
  assert.equal(new Set(T.THEMES.map(t => t.id)).size, T.THEMES.length);
  assert.deepEqual(CONCRETE, ['latte', 'mocha', 'forest', 'nord', 'gruvbox']);
  for (const t of T.THEMES.slice(1)) assert.ok(['light', 'dark'].includes(t.scheme), t.id);
});

test('mỗi theme cụ thể có khối khai báo trong styles.css', () => {
  for (const id of CONCRETE) {
    assert.ok(declarations(css, id), `thiếu khối [data-theme='${id}'] trong styles.css`);
  }
});

test('readTheme: mặc định theo máy; giá trị lạ hoặc lỗi bộ nhớ thì coi như theo máy', () => {
  assert.equal(T.readTheme(memStorage()), 'system');
  assert.equal(T.readTheme(memStorage({ [T.THEME_KEY]: 'mocha' })), 'mocha');
  assert.equal(T.readTheme(memStorage({ [T.THEME_KEY]: 'hack' })), 'system');
  assert.equal(T.readTheme(null), 'system');
  const broken = { getItem() { throw new Error('bị chặn'); } };
  assert.equal(T.readTheme(broken), 'system');
});

test('saveTheme: chỉ lưu id hợp lệ; lỗi ghi thì trả false, không ném lỗi', () => {
  const s = memStorage();
  assert.equal(T.saveTheme(s, 'nord'), true);
  assert.equal(s._m.get(T.THEME_KEY), 'nord');
  assert.equal(T.saveTheme(s, 'rác'), false);
  const full = { setItem() { throw new Error('đầy'); } };
  assert.equal(T.saveTheme(full, 'nord'), false);
});

test('resolveTheme: "Theo máy" theo hệ điều hành (Latte sáng, Mocha tối); theme cụ thể giữ nguyên', () => {
  assert.equal(T.resolveTheme('system', false), 'latte');
  assert.equal(T.resolveTheme('system', true), 'mocha');
  assert.equal(T.resolveTheme('forest', false), 'forest');
  assert.equal(T.resolveTheme('không-có', true), 'latte');
  assert.equal(T.schemeOf('latte'), 'light');
  assert.equal(T.schemeOf('gruvbox'), 'dark');
});

test('applyTheme: gắn data-theme lên phần tử gốc, trả về theme đã dùng', () => {
  const root = { dataset: {} };
  assert.equal(T.applyTheme(root, 'system', true), 'mocha');
  assert.equal(root.dataset.theme, 'mocha');
  assert.equal(T.applyTheme(root, 'nord', false), 'nord');
  assert.equal(root.dataset.theme, 'nord');
});

test('tương phản chữ ≥ 4.5:1 trên nền, thẻ và nền phụ, cho mọi theme', () => {
  const pairs = [
    ['ink', 'paper'], ['ink', 'surface'], ['ink', 'surface-2'],
    ['ink-2', 'paper'], ['ink-2', 'surface'], ['ink-2', 'surface-2'],
    ['muted', 'paper'], ['muted', 'surface'], ['muted', 'surface-2'],
    ['accent', 'surface'], ['accent', 'paper'],
    ['accent-ink', 'accent'],
    ['ok', 'surface'], ['warn', 'surface'], ['danger', 'surface'],
  ];
  const failures = [];
  for (const id of CONCRETE) {
    const d = declarations(css, id);
    const baseD = id === 'latte' ? Object.assign({}, declarations(css, 'latte'), parseDecl((css.match(/:root\s*\{([^}]*)\}/) || [])[1] || '')) : d;
    for (const [fg, bg] of pairs) {
      const c = contrast(baseD[fg], baseD[bg]);
      if (c < 4.5) failures.push(`${id}: ${fg} (${baseD[fg]}) trên ${bg} (${baseD[bg]}) = ${c.toFixed(2)}`);
    }
  }
  assert.deepEqual(failures, []);
});

test('bảng màu web hướng dẫn trùng với site chính (cùng giá trị cho các token chung)', () => {
  const map = { paper: 'vp-c-bg', surface: 'vp-c-bg-elv', 'surface-2': 'vp-c-bg-soft', ink: 'vp-c-text-1', 'ink-2': 'vp-c-text-2', muted: 'vp-c-text-3', line: 'vp-c-divider', accent: 'vp-c-brand-1', 'accent-ink': 'vp-button-brand-text', ok: 'vp-c-tip-1', warn: 'vp-c-warning-1', danger: 'vp-c-danger-1', focus: 'vp-c-info-1' };
  const diffs = [];
  for (const id of CONCRETE) {
    const a = declarations(css, id, id === 'latte' ? /:root/ : null);
    const b = declarations(vpCss, id);
    assert.ok(b, `thiếu khối [data-theme='${id}'] trong custom.css`);
    for (const [site, vp] of Object.entries(map)) {
      const x = a[site], y = b['vp-c-bg'] !== undefined ? b[vp] : undefined;
      if (x && y && x.toLowerCase() !== y.toLowerCase()) diffs.push(`${id} ${site}: site ${x} ≠ hướng dẫn ${y}`);
    }
  }
  assert.deepEqual(diffs, []);
});
