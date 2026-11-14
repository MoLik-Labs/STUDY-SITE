#!/usr/bin/env node
/**
 * tests/v112.js — Study Focus Fox: i18n, brand, pixel arena, physics lab.
 *
 * These four things are load-bearing and easy to break silently:
 *   · a missing translation key falls back instead of showing "undefined"
 *   · the fox mark must stay symmetric (it is stored as a half-grid)
 *   · the question generators must never produce an unanswerable question
 *   · the problem reader must not invent quantities that are not there
 *
 * So every assertion below uses real data through the real functions.
 */
'use strict';

const fs = require('fs');
const path = require('path');

let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch (e) { console.error('✗ thiếu jsdom — chạy:  npm install --no-save jsdom'); process.exit(2); }

const ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

const results = [];
const ok = (n, c, note) => results.push({ n, pass: !!c, note: note === undefined ? '' : String(note) });
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/x.html' });
  const w = dom.window;
  w.eval(`
    window.scrollTo=function(){};
    if(!window.matchMedia) window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
    if(!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView=function(){};
  `);
  await wait(450);
  const ev = code => w.eval(code);

  /* =========================================================
     1. i18n
     ========================================================= */
  ok('default language is Vietnamese', ev('i18nLang()') === 'vi', ev('i18nLang()'));
  ok('vi translation', ev("t('nav_study')") === 'Học hôm nay', ev("t('nav_study')"));
  ok('en translation', ev("t('nav_study','en')") === 'Today', ev("t('nav_study','en')"));
  ok('unknown key returns the key itself (visible bug, not "undefined")',
    ev("t('no_such_key_xyz')") === 'no_such_key_xyz');

  /* read the key table out of the source, so this test covers every key */
  const src = fs.readFileSync(path.join(ROOT, 'src/i18n.js'), 'utf8');
  const blocks = [...src.matchAll(/^\s{2}([a-z0-9_]+):\s*\{([^}]*)\}/gm)];
  ok('i18n table has keys', blocks.length > 40, blocks.length + ' keys');
  const missingEn = blocks.filter(b => !/\ben:/.test(b[2])).map(b => b[1]);
  const missingVi = blocks.filter(b => !/\bvi:/.test(b[2])).map(b => b[1]);
  ok('every key has vi', missingVi.length === 0, missingVi.slice(0, 4).join(', '));
  ok('every key has en', missingEn.length === 0, missingEn.slice(0, 4).join(', '));

  /* switching language changes the chrome and <html lang> */
  ev("setLang('en')");
  await wait(120);
  ok('setLang(en) sets <html lang>', w.document.documentElement.getAttribute('lang') === 'en',
    w.document.documentElement.getAttribute('lang'));
  ok('setLang(en) persists', ev("state.prefs.lang") === 'en');
  const enMenu = [...w.document.querySelectorAll('#tbMenu a')].map(a => a.textContent.trim());
  ok('menu is in English after switch', enMenu.includes('Flashcards') || enMenu.includes('Today'),
    enMenu.slice(0, 3).join(' | '));
  ev("setLang('vi')");
  await wait(120);
  ok('back to Vietnamese', ev('i18nLang()') === 'vi' && w.document.documentElement.getAttribute('lang') === 'vi');

  /* =========================================================
     2. brand
     ========================================================= */
  ok('brand name', ev('BRAND.name') === 'Study Focus Fox', ev('BRAND.name'));
  ok('brand has tagline in both languages',
    !!ev('BRAND.tagline.vi') && !!ev('BRAND.tagline.en'));
  const markCells = w.document.querySelectorAll('.px-mark i').length;
  ok('mark is a 16x16 grid', markCells === 256, markCells + ' cells');
  ok('mark renders on every page', w.document.querySelectorAll('.px-mark').length >= 1);

  /* symmetry: the right half must mirror the left, cell by cell */
  const halfRows = ev('JSON.stringify(BRAND_MARK_HALF)');
  const halves = JSON.parse(halfRows);
  ok('mark stores 16 half-rows', halves.length === 16, halves.length);
  ok('every half-row is 8 wide', halves.every(r => r.length === 8),
    halves.filter(r => r.length !== 8).join(','));
  const asymmetric = [...w.document.querySelectorAll('.px-mark')][0].querySelectorAll('span')
    .length ? null : null;
  const rows = [...[...w.document.querySelectorAll('.px-mark')][0].children];
  let sym = true;
  rows.forEach(r => {
    const cells = [...r.children].map(c => c.className);
    for (let i = 0; i < 8; i++) if (cells[i] !== cells[15 - i]) sym = false;
  });
  ok('rendered mark is symmetric', sym);

  /* favicon is inline and is an SVG data URI (no extra request) */
  const icon = w.document.querySelector('link[rel="icon"]');
  ok('favicon is inline SVG', icon && icon.getAttribute('href').startsWith('data:image/svg+xml'),
    icon ? icon.getAttribute('href').slice(0, 30) : 'missing');
  ok('theme-color declared', !!w.document.querySelector('meta[name="theme-color"]'));
  ok('title carries the brand', /Study Focus Fox/.test(w.document.title), w.document.title);

  /* =========================================================
     3. PIXEL ARENA — generators must always be answerable
     ========================================================= */
  const gens = ['gmGenPhysics', 'gmGenMath', 'gmGenEng', 'gmGenChem'];
  for (const g of gens) {
    let bad = 0, empty = 0, examples = [];
    for (let i = 0; i < 120; i++) {
      const q = ev(`${g}(${1 + (i % 4)})`);
      if (!q || !q.q || q.a === undefined || q.a === null || q.a === '') { empty++; continue; }
      if (Array.isArray(q.a) ? q.a.length === 0 : String(q.a).trim() === '') bad++;
      if (examples.length < 2) examples.push(q.q + ' → ' + (Array.isArray(q.a) ? q.a[0] : q.a));
    }
    ok(g + ': 120 câu đều có đáp án', empty === 0 && bad === 0,
      empty + ' rỗng, ' + bad + ' sai' + (examples.length ? ' · ' + examples[0] : ''));
  }

  /* answers must match themselves (obvious, but catches format drift) */
  ok('gmMatch accepts comma decimals', ev("gmMatch('1,5','1.5')") === true);
  ok('gmMatch accepts dot decimals', ev("gmMatch('1.5','1,5')") === true);
  ok('gmMatch tolerates 0,5% rounding', ev("gmMatch('7.786','7.7857')") === true);
  ok('gmMatch still rejects 0,1% off by more than tolerance',
    ev("gmMatch('8.2','7.7857')") === false);
  ok('gmMatch rejects a wrong number', ev("gmMatch('5','7.5')") === false);
  ok('gmMatch is case-insensitive for words', ev("gmMatch('Have Lived','have lived')") === true);

  /* a full battle: correct answers must end in a win and pay coins */
  ev('state.game = null;');
  ev("gmStart('phys')");
  ok('battle starts with full HP', ev('GM.heroHp') === 5, ev('GM.heroHp'));
  let guard = 0;
  while (!ev('GM.over') && guard++ < 40) {
    const a = JSON.parse(ev('JSON.stringify(GM.cur.a)'));
    const v = Array.isArray(a) ? a[0] : a;
    ev('gmAnswer(' + JSON.stringify(String(v)) + ')');
  }
  ok('answering correctly wins the battle', ev('GM.won') === true, 'guard=' + guard);
  ok('winning pays coins', ev('gmState().coins') > 0, ev('gmState().coins'));

  /* wrong answers: HP drops, and the missed question comes back */
  ev('state.game = null;');
  ev("gmStart('math')");
  ev("gmAnswer('definitely-wrong-999999')");
  const hpAfterMiss = ev('GM.heroHp');
  ok('wrong answer costs HP', hpAfterMiss < 5, hpAfterMiss);
  ok('the missed question is served again immediately', ev('GM.cur.repeat') === true);
  ok('and it is no longer waiting in the queue', ev('GM.queue.length') === 0, ev('GM.queue.length'));
  ok('combo resets on a miss', ev('GM.combo') === 0);

  /* the retry is worth less than a fresh question — no farming */
  const coinsBefore = ev('gmState().coins');
  const retryAnswer = JSON.parse(ev('JSON.stringify(GM.cur.a)'));
  ev('gmAnswer(' + JSON.stringify(String(Array.isArray(retryAnswer) ? retryAnswer[0] : retryAnswer)) + ')');
  ok('a retried question pays 1 coin, a fresh one pays 2',
    ev('gmState().coins') - coinsBefore === 1, ev('gmState().coins') - coinsBefore);

  /* =========================================================
     4. PHYSICS LAB — the problem reader
     ========================================================= */
  const parse = t => JSON.parse(ev('JSON.stringify(spParse(' + JSON.stringify(t) + '))'));

  let p = parse('Một điện trở 12 Ω mắc vào hiệu điện thế 6 V. Tính cường độ dòng điện.');
  ok('reads R in ohm', p.some(x => x.qty === 'R' && x.val === 12), JSON.stringify(p.map(x => x.raw)));
  ok('reads U in volt', p.some(x => x.qty === 'U' && x.val === 6));

  p = parse('Dòng điện 0,5 A chạy qua điện trở 20 Ω trong 30 giây.');
  ok('reads a decimal current with a comma', p.some(x => x.qty === 'I' && Math.abs(x.val - 0.5) < 1e-9));
  ok('reads time in seconds', p.some(x => x.qty === 't' && x.val === 30));

  /* prefix handling is where unit bugs live */
  p = parse('R = 1,2 kΩ, U = 5 V');
  const kOhm = p.find(x => x.unit === 'kΩ');
  ok('kΩ is parsed as 1200 ohm', kOhm && kOhm.si === 1200, kOhm ? kOhm.si : 'not found');
  p = parse('I = 250 mA');
  ok('mA is parsed as 0,25 A', p.find(x => x.qty === 'I').si === 0.25);

  /* longer unit must win over its own suffix */
  p = parse('dài 3 km');
  ok('km is not misread as m', p.length === 1 && p[0].unit === 'km', JSON.stringify(p.map(x => x.raw)));

  /* no quantities → no invented ones */
  ok('invents nothing from prose',
    parse('Hãy giải thích hiện tượng khúc xạ ánh sáng.').length === 0);

  /* law selection + numeric answer */
  const sol = JSON.parse(ev("JSON.stringify(spSolve('R = 12 Ω, U = 6 V'))"));
  ok('picks Ohm\'s law', sol.ranked.length && sol.ranked[0].law.id === 'ohm');
  ok('computes I = 0,5 A', sol.answer && Math.abs(sol.answer.v - 0.5) < 1e-9, sol.answer ? sol.answer.v : 'none');

  const sol2 = JSON.parse(ev("JSON.stringify(spSolve('F = 40 N, s = 5 m'))"));
  ok('picks work for force + distance', sol2.ranked.length && sol2.ranked[0].law.id === 'work');
  ok('computes A = 200 J', sol2.answer && sol2.answer.v === 200, sol2.answer ? sol2.answer.v : 'none');

  /* sense check flags the absurd */
  const sense = JSON.parse(ev("JSON.stringify(spSense('I = 3000 A, R = 12 Ω'))"));
  ok('flags 3000 A as implausible', sense.some(s => s.qty === 'I' && s.ok === false),
    JSON.stringify(sense.map(s => [s.qty, s.ok])));
  const sense2 = JSON.parse(ev("JSON.stringify(spSense('U = 6 V, R = 12 Ω'))"));
  ok('accepts lab-scale values', sense2.every(s => s.ok), JSON.stringify(sense2.map(s => [s.qty, s.ok])));

  /* formula matching is generous about syntax, strict about physics */
  ok('formula: ignores spaces and case', ev("spFormulaMatch('u / r','U / R')") === true);
  ok('formula: accepts * for ×', ev("spFormulaMatch('I*R','I × R')") === true);
  ok('formula: accepts dot for multiplication', ev("spFormulaMatch('I.R','I × R')") === true);
  ok('formula: rejects the wrong formula', ev("spFormulaMatch('R / U','U / R')") === false);

  /* =========================================================
     5. both routes actually render
     ========================================================= */
  for (const r of ['#/game', '#/special']) {
    w.location.hash = '#/__blank__';
    await wait(20);
    w.location.hash = r;
    await wait(180);
    const main = w.document.querySelector('#main');
    ok('tuyến ' + r + ' có nội dung', main && main.innerHTML.length > 900, main ? main.innerHTML.length : 0);
  }

  w.location.hash = '#/special';
  await wait(180);
  ok('#/special shows 12 formulas', w.document.querySelectorAll('.sp-f').length === 12,
    w.document.querySelectorAll('.sp-f').length);
  ok('#/special has a constants table', w.document.querySelectorAll('.sp-tab tbody tr').length >= 6);

  ev('GM = null;');
  w.location.hash = '#/__blank__';
  await wait(20);
  w.location.hash = '#/game';
  await wait(180);
  ok('#/game shows 4 subjects', w.document.querySelectorAll('.gm-foe-card').length === 4,
    w.document.querySelectorAll('.gm-foe-card').length);
  ok('#/game draws pixel sprites', w.document.querySelectorAll('.gm-foe-card .px').length === 4);


  /* =========================================================
     6. shareable lessons
     ---------------------------------------------------------
     The QR encoder is the risky part: a broken one still *looks* like a
     QR code, so nothing on screen tells you it is unscannable. These
     checks decode nothing (no decoder here), but they pin the properties
     that, when wrong, made every scan fail while I was building it:
     the format-info block and the version block have to be written in
     (x, y) order, and versions 7+ need the version block at all.
     ========================================================= */
  const qs = ev('qrEncode("https://example.com/#/lesson/3/2")');
  ok('qr: encodes a real lesson link', qs && qs.size >= 21, qs && qs.size);
  ok('qr: size is 4v+17', qs && (qs.size - 17) % 4 === 0, qs && qs.size);

  /* the three finder patterns must be present, in the three corners */
  /* A finder is a 7x7 block: 3x3 dark inside a light ring inside a dark
     border, with the centre at (cx, cy). Checking a 5x5 would pass on a
     half-rendered pattern, so it is checked at full size. */
  const finderAt = (m, cx, cy) => {
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      const d = Math.max(Math.abs(dx), Math.abs(dy));
      const want = (d === 0 || d === 1 || d === 3) ? 1 : 0;
      if (m[cy + dy][cx + dx] !== want) return false;
    }
    return true;
  };
  const n = qs.size;
  ok('qr: finder top-left', finderAt(qs.cells, 3, 3));
  ok('qr: finder top-right', finderAt(qs.cells, n - 4, 3));
  ok('qr: finder bottom-left', finderAt(qs.cells, 3, n - 4));
  let timingOk = true;
  for (let i = 8; i < n - 8; i++) if (qs.cells[6][i] !== (i % 2 === 0 ? 1 : 0)) timingOk = false;
  ok('qr: timing line alternates', timingOk);
  ok('qr: dark module set', qs.cells[n - 8][8] === 1);

  /* a long URL forces version 7+, which needs the version block */
  const big = ev('qrEncode("' + 'x'.repeat(150) + '")');
  ok('qr: long text reaches v7+', big && big.size >= 45, big && big.size);
  let vbits = 0;
  for (let i = 0; i < 18; i++) vbits += big.cells[Math.floor(i / 3)][big.size - 11 + (i % 3)];
  ok('qr: version block is written for v7+', vbits > 0 && vbits < 18, vbits + '/18 set');

  /* lesson link + text + file */
  ev('studyState();');
  const L = ev('shLessonData(3,2)');
  ok('share: finds a real lesson', L && L.title && L.d === 3 && L.s === 2, L && L.title);
  ok('share: keeps the formula', L && typeof L.f === 'string' && L.f.length > 0);
  const txt = ev('shLessonText(shLessonData(3,2), false)');
  ok('share: text has the link', /#\/lesson\/3\/2/.test(txt), txt.split('\n').pop());
  ok('share: text has no raw HTML tags', !/[<>]/.test(txt.replace(/https?:[^\s]*/g, '')), txt.slice(0, 60));
  /* Assert the conversion itself rather than the sample lesson — that lesson
     happens to use only subscripts, so a superscript check on it was testing
     the wrong thing. */
  const strip = ev('shStripTags("F<sup>2</sup> = F<sub>1</sub><sup>2</sup> + v<sup>3</sup>")');
  ok('share: sup 2/3 become real characters', /²/.test(strip) && /³/.test(strip), strip);
  ok('share: subscripts survive as plain text', /F1²/.test(strip), strip);
  ok('share: no tags left after stripping', !/[<>]/.test(strip), strip);
  ok('share: real lesson formula loses its tags',
    !/[<>]/.test(ev('shStripTags(shLessonData(3,2).f)')), ev('shStripTags(shLessonData(3,2).f)'));
  const file = ev('shLessonFile(shLessonData(3,2), false)');
  ok('share: file is a complete document', /^<!doctype html>/i.test(file) && /<\/html>/.test(file));
  ok('share: file needs no script', !/<script/i.test(file));
  ok('share: file needs no network', !/(https?:)?\/\/(fonts|cdn|unpkg)/i.test(file));

  /* the route renders, with a QR in it */
  w.location.hash = '#/__blank__';
  await wait(20);
  w.location.hash = '#/share/lesson/3/2';
  await wait(200);
  const sm = w.document.querySelector('#main');
  ok('#/share/lesson/3/2 renders', sm && sm.innerHTML.length > 1200, sm ? sm.innerHTML.length : 0);
  ok('#/share/lesson has a QR svg', !!w.document.querySelector('.shl-qr svg'));
  ok('#/share/lesson shows the copyable link', !!w.document.querySelector('#shlUrl'));
  ok('#/share/lesson offers a file download', !!w.document.querySelector('#shlFile'));
  w.location.hash = '#/__blank__';
  await wait(20);
  w.location.hash = '#/share/lesson/999/9';
  await wait(150);
  ok('#/share/lesson with a bad id does not crash', !!w.document.querySelector('#main') &&
    w.document.querySelector('#main').innerHTML.length > 200);

  const pass = results.filter(r => r.pass).length;
  results.filter(r => !r.pass).forEach(r => console.log('  ✗ ' + r.n + (r.note ? ' — ' + r.note : '')));
  console.log(`\n${pass}/${results.length} bước đạt` + (pass === results.length ? '  ✓' : ''));
  process.exit(pass === results.length ? 0 : 1);
})();
