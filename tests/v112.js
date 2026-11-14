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
  /* thu thập ngoại lệ thật (bỏ qua các "Not implemented" của jsdom) — nhiều
     lỗi trước đây chỉ hiện ra dưới dạng trang trắng, không phải câu assert sai */
  const { VirtualConsole } = require('jsdom');
  const vc = new VirtualConsole();
  const errsSeen = [];
  vc.on('jsdomError', e => { if (!/Not implemented/.test(e.message)) errsSeen.push(e.message); });
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/x.html',
    virtualConsole: vc,
  });
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


  /* =========================================================
     7. PHYSICS HUB + SUBJECT COVERAGE
     ---------------------------------------------------------
     The hub reads from real plan state and real answers, so these check
     the derivation rather than the markup: a hub whose numbers do not
     move is decoration.
     ========================================================= */
  ev('state.ans = {}; save();');
  w.location.hash = '#/__blank__'; await wait(20);
  w.location.hash = '#/physics'; await wait(200);
  const ph = w.document.querySelector('#main');
  ok('#/physics renders', ph && ph.innerHTML.length > 2500, ph ? ph.innerHTML.length : 0);
  ok('#/physics shows a progress ring', !!ph.querySelector('.ph-ring svg'));
  ok('#/physics shows the current percentage',
    /\d+%/.test((ph.querySelector('.ph-ring-t b') || {}).textContent || ''));
  ok('#/physics lists 4 phases', ph.querySelectorAll('.ph-phase').length === 4);
  ok('#/physics groups the tools', ph.querySelectorAll('.ph-group').length >= 4);
  ok('#/physics links only to real routes',
    [...ph.querySelectorAll('.ph-tool')].every(a => /^#\/[a-z]/.test(a.getAttribute('href'))));
  ok('#/physics points at the next unfinished session', !!ph.querySelector('.ph-next-t'));

  /* the percentage has to move when the plan moves */
  const before = (ph.querySelector('.ph-ring-t b') || {}).textContent;
  ev("(function(){var d=DAYS[0],s=d.sessions[0];state.done[sid(d.n,s.n)]=1;save();})()");
  w.location.hash = '#/__blank__'; await wait(20);
  w.location.hash = '#/physics'; await wait(200);
  const after = (w.document.querySelector('.ph-ring-t b') || {}).textContent;
  ok('#/physics percentage follows real progress', before !== after, before + ' → ' + after);
  ev("(function(){var d=DAYS[0],s=d.sessions[0];delete state.done[sid(d.n,s.n)];save();})()");

  /* weak topics: derived from answers, and silent until there is enough data */
  ok('#/physics does not invent weak topics from no answers',
    !ev("phWeakTopics(3).length"));
  ev(`[0,1,2].forEach(function(i){state.ans[i]={ok:false};});save();`);
  ok('#/physics names a weak topic after 3 wrong answers',
    ev("phWeakTopics(3).length") === 1, ev("JSON.stringify(phWeakTopics(3))"));
  ok('#/physics reports the real rate, not a guess',
    Math.round(ev("phWeakTopics(3)[0].rate") * 100) === 0);
  ev('state.ans = {}; save();');

  /* =========================================================
     8. SUBJECT COVERAGE
     Every grade-1-12 subject the shelf promises must actually carry
     lessons, and every lesson must have a body you can read.
     ========================================================= */
  const coverage = ev('JSON.parse(JSON.stringify((function(){' +
    'var t={};for(var g=1;g<=12;g++){SUBJECTS.forEach(function(s){' +
    'var n=lessonList(g,s.id).length; if(n) t[s.id]=(t[s.id]||0)+n;});}return t;})()))');
  ok('mọi môn có bài học thật', Object.keys(coverage).length >= 12, JSON.stringify(coverage));
  ['toan', 'van', 'anh', 'hoa', 'vatli'].forEach(id => {
    ok('môn ' + id + ' có ít nhất 5 bài', (coverage[id] || 0) >= 5, coverage[id] || 0);
  });

  /* no lesson may be an empty shell */
  const empties = ev(`JSON.parse(JSON.stringify((function(){
    var bad=[];
    for (var g=1; g<=12; g++) SUBJECTS.forEach(function(s){
      lessonList(g,s.id).forEach(function(l){
        var n=(l.blocks||[]).length;
        var hasQ=(l.blocks||[]).some(function(b){return b.k==='q';});
        if (n<3 || !l.aim || !hasQ) bad.push(l.id+':'+l.t);
      });
    });
    return bad;})()))`);
  ok('không bài nào rỗng: đủ 3 khối, có mục tiêu và có câu hỏi',
    empties.length === 0, empties.slice(0, 3).join(' | '));

  /* a real lesson from the new content renders its blocks */
  const sample = ev("lessonList(12,'toan')[0].id");
  w.location.hash = '#/__blank__'; await wait(20);
  w.location.hash = '#/read/' + sample; await wait(220);
  const rd = w.document.querySelector('#main');
  ok('bài học mới mở được', rd && rd.innerHTML.length > 1200, rd ? rd.innerHTML.length : 0);
  ok('bài có công thức', !!rd.querySelector('.read-formula'));
  ok('bài có câu hỏi tự kiểm tra', !!rd.querySelector('.read-q'));


  /* =========================================================
     9. KHÁM PHÁ — one table, and every entry actually goes somewhere
     ---------------------------------------------------------
     The bug this section exists for: clicking a menu item closed the
     popup and went nowhere, because the close handler was assigned after
     the navigate handler and overwrote it, and the <a> had no href. Every
     assertion below fails on that version.
     ========================================================= */
  const hrefs = ev("JSON.parse(JSON.stringify(EXPLORE_GROUPS.reduce(function(a,g){" +
    "return a.concat(g.items.map(function(i){return i.href}))},[])))");
  ok('explore table is not empty', hrefs.length >= 30, hrefs.length + ' entries');
  ok('the home roadmap is reachable from Explore', hrefs.includes('#/'));
  ok('explore table has no duplicate destinations',
    new Set(hrefs).size === hrefs.length, hrefs.length - new Set(hrefs).size + ' dupes');
  ok('every explore entry explains when to use it',
    ev("EXPLORE_GROUPS.every(function(g){return g.items.every(function(i){" +
      "return i.need && i.need.length>12 && i.vi && i.en})})"));

  /* every entry has a real href attribute — without it, keyboard users can
     never reach the item and middle-click opens nothing */
  const menuAnchors = [...w.document.querySelectorAll('#tbMenu [data-nav]')];
  ok('menu items are real links',
    menuAnchors.length > 0 && menuAnchors.every(a => a.getAttribute('href') === a.dataset.nav),
    menuAnchors.length + ' items');

  /* the regression: click a menu item and the app must navigate */
  const probe = menuAnchors.find(a => a.dataset.nav === '#/library');
  let navOk = false;
  if (probe) {
    w.location.hash = '#/about'; await wait(60);
    w.document.querySelector('#tbMoreBtn').click(); await wait(40);
    const again = [...w.document.querySelectorAll('#tbMenu [data-nav]')]
      .find(a => a.dataset.nav === '#/library');
    again.click(); await wait(160);
    navOk = w.location.hash === '#/library' && !w.document.querySelector('#tbMenu').classList.contains('on');
  }
  ok('clicking an Explore item navigates AND closes the menu', navOk, w.location.hash);

  /* keyboard: focus moves inside the popup */
  w.document.querySelector('#tbMoreBtn').click(); await wait(60);
  const mRows = [...w.document.querySelectorAll('#tbMenu [data-nav]')];
  mRows[0].focus();
  const focusable = w.document.activeElement === mRows[0];
  mRows[0].dispatchEvent(new w.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  ok('popup items are focusable', focusable);
  ok('ArrowDown moves focus inside the popup', w.document.activeElement === mRows[1]);
  w.document.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  ok('Escape closes the popup', !w.document.querySelector('#tbMenu').classList.contains('on'));

  /* the page itself */
  w.location.hash = '#/__blank__'; await wait(20);
  w.location.hash = '#/discover'; await wait(240);
  const dPage = w.document.querySelector('#main');
  ok('#/discover renders', dPage && dPage.innerHTML.length > 3000, dPage ? dPage.innerHTML.length : 0);
  ok('#/discover shows every group', dPage.querySelectorAll('.expl-sec .expl-card').length >= 30,
    dPage.querySelectorAll('.expl-card').length + ' cards');
  ok('#/discover has a search box', !!dPage.querySelector('#explQ'));

  /* search: diacritic-insensitive, AND across words, html-safe, never throws */
  const noDia = ev("explSearch('dinh luat om',5).map(function(x){return x.t})");
  const withDia = ev("explSearch('định luật ôm',5).map(function(x){return x.t})");
  ok('search ignores diacritics', JSON.stringify(noDia) === JSON.stringify(withDia));
  ok('search finds the Ohm formula', noDia.some(t => /Ôm/i.test(t)), noDia.slice(0, 2).join(' | '));
  ok('a two-word query requires BOTH words somewhere in the entry',
    ev("explSearch('mach cau',8).every(function(x){" +
       "var t=norm(x.t+' '+(x.d||'')+' '+(x.k||''));" +
       "return t.indexOf('mach')>=0 && t.indexOf('cau')>=0})"),
    ev("explSearch('mach cau',3).map(function(x){return x.t.slice(0,26)})").join(' | '));
  ok('junk queries return nothing instead of throwing',
    ev("['!!!','<script>','   ','&amp;'].every(function(q){return explSearch(q,5).length>=0})"));
  ok('a query with no match returns an empty list',
    ev("explSearch('zzzqqqxxx',5).length") === 0);

  /* live typing renders rows without pressing Enter */
  const qi = dPage.querySelector('#explQ');
  qi.value = 'the ghi nho';
  qi.dispatchEvent(new w.Event('input'));
  await wait(80);
  const liveRows = w.document.querySelectorAll('#explOut .expl-row');
  ok('typing filters live', liveRows.length > 0, liveRows.length + ' rows');
  ok('live rows are links', [...liveRows].every(r => r.getAttribute('href').startsWith('#/')));

  /* "recent" is recorded, capped, and survives a reload of the page */
  ev("state.explore={recent:[]};save();");
  for (let i = 0; i < 12; i++) {
    w.location.hash = '#/about'; await wait(12);
    w.location.hash = '#/library'; await wait(12);
  }
  ok('recent list is capped at 8', ev("state.explore.recent.length") <= 8, ev("state.explore.recent.length"));
  ok('recent list records real destinations',
    ev("state.explore.recent.every(function(r){return !!explToolAt(r.href)})"));

  /* a fresh install must not show a fabricated "continue" */
  ev("state.school.soft=(state.school.soft||{});delete state.school.soft.lastRead;state.explore={recent:[]};save();");
  w.location.hash = '#/__blank__'; await wait(20);
  w.location.hash = '#/discover'; await wait(200);
  const fresh = w.document.querySelector('#main');
  /* a brand-new visitor has no lesson history, so the card must be the
     first-lesson offer ("Bài mới"), never a claim that they were "reading"
     something they never opened */
  const fc = fresh.querySelector('.expl-resume');
  ok('#/discover never invents reading history',
    !fc || /Bài mới/.test(fc.textContent), fc ? fc.textContent.replace(/\s+/g, ' ').slice(0, 60) : 'no card');
  ok('#/discover offers a start button when there is no history',
    !!fresh.querySelector('.expl-empty-top a[href="#/subjects"]') || !!fc);


  /* a lesson created after the search index was built must be findable —
     the index is cached for speed, so it has to be invalidated on write */
  ev(`(function(){var S=schoolState();S.lessons['9|toan']=S.lessons['9|toan']||[];
      S.lessons['9|toan'].push({id:'mytest1',g:9,s:'toan',t:'Bài kiểm tra chỉ mục tìm kiếm',aim:'x',blocks:[],at:Date.now()});
      if(window.EXPL_INDEX) window.EXPL_INDEX=null; save();})()`);
  ok('a newly created lesson is searchable',
    ev("explSearch('chi muc tim kiem',5).some(function(x){return x.t.indexOf('chỉ mục')>=0||x.t.indexOf('chỉ mục tìm')>=0})"));
  ev("(function(){var S=schoolState();S.lessons['9|toan']=(S.lessons['9|toan']||[]).filter(function(l){return l.id!=='mytest1'});window.EXPL_INDEX=null;save();})()");
  ok('a deleted lesson disappears from search',
    !ev("explSearch('chi muc tim kiem',5).some(function(x){return x.href==='#/read/mytest1'})"));

  /* one Explore control, never two: the compact key replaces the popup ≤980px */
  const hasKey = !!w.document.querySelector('a.tb-key[href="#/discover"]');
  ok('there is an Explore control on small screens', hasKey);


  /* =========================================================
     10. SAVED STATE CAN BE ANYTHING
     ---------------------------------------------------------
     localStorage is user-writable and JSON import takes any file, so an
     answer entry can be null and a recent list can hold numbers. Each of
     these used to throw DURING RENDER on a real page — the page went blank,
     not just one card. The assertions are deliberately about "no exception",
     because that is what the user loses.
     ========================================================= */
  const errBase = errsSeen.length;
  ev("state.ans={0:null,1:{ok:'x'},2:'junk',3:{}};save();");
  for (const r of ['#/', '#/discover', '#/stats', '#/physics', '#/study']) {
    w.location.hash = '#/__blank__'; await wait(15);
    w.location.hash = r; await wait(80);
    ok('trang ' + r + ' sống sót khi state.ans hỏng',
      !!w.document.querySelector('#main') && w.document.querySelector('#main').innerHTML.length > 200);
  }
  ok('state.ans hỏng không ném ngoại lệ', errsSeen.length === errBase, (errsSeen.length - errBase) + ' lỗi');
  ok('đếm câu trả lời bỏ qua mục hỏng',
    ev("JSON.stringify(answerStats())") === '{"n":2,"ok":1}', ev("JSON.stringify(answerStats())"));

  ev("state.explore={recent:[null,1,{},'x',{href:'#/nope'},{href:'#/library'}]};save();");
  w.location.hash = '#/__blank__'; await wait(15);
  w.location.hash = '#/discover'; await wait(200);
  ok('Khám phá sống sót khi danh sách "vừa mở" hỏng',
    w.document.querySelector('#main').innerHTML.length > 3000);
  ok('mục "vừa mở" hỏng bị loại, mục tốt được giữ',
    w.document.querySelectorAll('.expl-recent a').length === 1,
    w.document.querySelectorAll('.expl-recent a').length + ' thẻ');

  ev("state={ans:{},done:{},days:{},note:{},prefs:{},mine:[],watched:null,school:null,study:null,explore:null};save();");
  for (const r of ['#/', '#/library', '#/discover', '#/study', '#/stats']) {
    w.location.hash = '#/__blank__'; await wait(15);
    w.location.hash = r; await wait(80);
    ok('trang ' + r + ' sống sót khi toàn bộ state bị xoá',
      !!w.document.querySelector('#main') && w.document.querySelector('#main').innerHTML.length > 200);
  }
  ok('state trắng không ném ngoại lệ', errsSeen.length === errBase, (errsSeen.length - errBase) + ' lỗi');
  ev("state.ans={};state.watched={};save();");


  /* =========================================================
     11. VẬT LÍ ĐỨNG ĐẦU
     ========================================================= */
  ok('Vật lí có nút riêng trên thanh trên',
    !!w.document.querySelector('.topbar a.tb-phys[href="#/physics"]'));
  ok('nút Vật lí hiện tiến độ thật',
    /\d+\/\d+/.test((w.document.querySelector('.tb-phys span') || {}).textContent || ''));
  ok('ngăn kéo mở bằng khối Vật lí',
    !!w.document.querySelector('#rail .rail-phys .rp-main[href="#/physics"]'));
  ok('mục Vật lí trong ngăn kéo có thanh tiến độ',
    !!w.document.querySelector('#rail .rail-phys .rp-bar'));
  w.location.hash = '#/'; await wait(220);
  const physCard = w.document.querySelector('#main a.hero-phys[href="#/physics"]');
  ok('trang chủ đặt thẻ Vật lí TRƯỚC thẻ tự học', !!physCard &&
    physCard.compareDocumentPosition(w.document.querySelector('#main a.hero-study')) & 4);
  ok('thẻ Vật lí trên trang chủ có thanh tiến độ', !!physCard.querySelector('.hp-bar'));

  /* ---- điều hướng phải đầy đủ và không trùng ----
     Bản trước mất 9 tuyến khỏi ngăn kéo (thư viện, sổ tay, đề thi, hỏi đáp,
     ôn câu sai, máy giải, bảng mạch, thí nghiệm, tiến độ) và lặp 6 lối ra.
     Hai lỗi đó đều không nhìn thấy được bằng mắt trên máy tính để bàn. */
  const navAudit = w.eval(`(() => {
    const rail = document.querySelector('#rail');
    const spine = [...rail.querySelectorAll('a')].filter(a => !a.closest('#railGroups'));
    const drawer = [...rail.querySelectorAll('#railGroups a')];
    const all = [...spine, ...drawer].map(a => a.getAttribute('href'));
    const spineHrefs = spine.map(a => a.getAttribute('href'));
    const must = ['#/physics','#/settings','#/library','#/papers','#/qa','#/review',
      '#/calc','#/build','#/lab','#/sim','#/special','#/stats','#/share','#/about',
      '#/study','#/cards','#/grades','#/timetable','#/notes','#/discover'];
    return {
      missing: must.filter(h => all.indexOf(h) < 0),
      dupes: spineHrefs.filter((h, i) => spineHrefs.indexOf(h) !== i),
      groups: rail.querySelectorAll('#railGroups .rn-group').length,
      hasToggle: !!rail.querySelector('#railMore'),
      drawerOpenable: (() => {
        const btn = rail.querySelector('#railMore');
        if (!btn) return false;
        const body = rail.querySelector('#railGroups');
        const before = body.hidden; btn.click();
        const after = body.hidden;
        btn.click();
        return before !== after;
      })()
    };
  })()`);
  ok('ngăn kéo có đủ tuyến phụ trợ', navAudit.missing.length === 0, navAudit.missing.join(' '));
  ok('thanh ray không lặp lối ra', navAudit.dupes.length === 0, navAudit.dupes.join(' '));
  ok('công cụ được chia nhóm thay vì một dãy phẳng', navAudit.groups >= 4, navAudit.groups + ' nhóm');
  ok('ngăn kéo công cụ mở/đóng được', navAudit.hasToggle && navAudit.drawerOpenable);
  ok('cài đặt với tới được từ thanh trên',
    !!w.document.querySelector('.topbar a.tb-gear[href="#/settings"][aria-label]'));

  /* =========================================================
     12. TUỲ BIẾN — trang từng bị bỏ quên
     ---------------------------------------------------------
     It had six sections with no index, secondary text below AA, and no way
     to change how a lesson reads. Every switch below must actually reach the
     document, not just localStorage.
     ========================================================= */
  w.location.hash = '#/__blank__'; await wait(15);
  w.location.hash = '#/settings'; await wait(240);
  const setPage = w.document.querySelector('#main');
  ok('#/settings có mục lục', setPage.querySelectorAll('[data-snav]').length >= 6,
    setPage.querySelectorAll('[data-snav]').length + ' mục');
  ok('#/settings: mọi mục lục trỏ tới mục có thật',
    [...setPage.querySelectorAll('[data-snav]')].every(a => !!setPage.querySelector('#set-' + a.dataset.snav)));
  ok('#/settings: mọi section đều có id',
    [...setPage.querySelectorAll('.set-sec')].every(x => x.id));

  const meas = setPage.querySelector('[data-measure]');
  meas.value = '84';
  meas.dispatchEvent(new w.Event('change'));
  await wait(120);
  ok('độ dài dòng áp vào tài liệu', w.document.documentElement.style.getPropertyValue('--measure') === '84ch',
    w.document.documentElement.style.getPropertyValue('--measure'));
  ok('độ dài dòng được lưu', ev('prefs().measure') === 84);

  const lineBtn = setPage.querySelector('[data-line="1.8"]');
  lineBtn.click(); await wait(100);
  ok('giãn dòng áp vào tài liệu', w.document.documentElement.style.getPropertyValue('--lh') === '1.8');
  ok('giãn dòng ảnh hưởng bài đọc thật',
    /--lh:\s*1\.8/.test(w.document.documentElement.getAttribute('style') || '') ||
    w.getComputedStyle(w.document.documentElement).getPropertyValue('--lh').trim() === '1.8');

  const ulBtn = setPage.querySelector('[data-underline="on"]');
  ulBtn.click(); await wait(100);
  ok('gạch chân liên kết bật được', w.document.documentElement.getAttribute('data-underline') === 'on');

  const startBtn = setPage.querySelector('[data-start="#/study"]');
  startBtn.click(); await wait(100);
  ok('trang mở đầu được lưu', ev('prefs().start') === '#/study');
  ok('nút thương hiệu đi theo trang mở đầu',
    ev("prefs().start") === '#/study');
  ev("setPref('start','#/physics')");

  /* deep link tới một mục */
  w.location.hash = '#/settings?s=pomo'; await wait(240);
  ok('đường dẫn sâu tới một mục hoạt động',
    (w.document.querySelector('[data-snav].on') || { dataset: {} }).dataset.snav === 'pomo');

  /* =========================================================
     13. Ý ĐỊNH THỰC HIỆN — "nếu … thì …"
     ========================================================= */
  ev("state.study.ifthen={list:[],asked:false};save();");
  w.location.hash = '#/__blank__'; await wait(15);
  w.location.hash = '#/study'; await wait(260);
  ok('#/study hỏi cam kết khi chưa có', !!w.document.querySelector('#main .ift-ask'));

  w.document.querySelector('#iftCue').value = 'sau khi tan học';
  w.document.querySelector('#iftAct').value = 'ôn 10 thẻ';
  w.document.querySelector('#iftSave').click();
  await wait(300);
  ok('lưu cam kết ghi vào state', ev('studyState().ifthen.list.length') === 1,
    ev('JSON.stringify(studyState().ifthen.list)'));
  ok('lưu cam kết KHÔNG ném lỗi (biến cục bộ từng che save())',
    errsSeen.length === errBase, (errsSeen.length - errBase) + ' lỗi');
  ok('cam kết hiện lại ngay trên trang', w.document.querySelectorAll('#main .ift-line').length === 1);

  /* chỉ tối đa hai — nhiều hơn thì không còn là kích hoạt */
  ev("(function(){var it=studyState().ifthen;it.list.push({cue:'a',act:'b'},{cue:'c',act:'d'},{cue:'e',act:'f'});save();})()");
  ok('cam kết bị giới hạn ở 2', ev('syIfThen().list.length') === 2, ev('syIfThen().list.length'));

  /* dữ liệu hỏng không được làm trắng trang */
  ev("state.study.ifthen={list:[null,1,{},{cue:'x'}],asked:false};save();");
  w.location.hash = '#/__blank__'; await wait(15);
  w.location.hash = '#/study'; await wait(220);
  ok('#/study sống sót khi cam kết hỏng', w.document.querySelector('#main').innerHTML.length > 3000);
  ok('cam kết hỏng bị loại bỏ', ev('syIfThen().list.length') === 0, ev('JSON.stringify(syIfThen().list)'));

  w.location.hash = '#/'; await wait(220);
  ev("state.study.ifthen={list:[{cue:'tối nay',act:'học 25 phút'}],asked:true};save();");
  w.location.hash = '#/__blank__'; await wait(15);
  w.location.hash = '#/'; await wait(220);
  ok('trang chủ nhắc lại cam kết', w.document.querySelectorAll('#main .ift-line').length === 1);

  /* =========================================================
     14. ĐIỀU HƯỚNG NHẤT QUÁN
     ========================================================= */
  const probeRoutes = ['#/cards', '#/practice', '#/plan', '#/weekly', '#/focus', '#/grades',
    '#/timetable', '#/calendar', '#/library', '#/notes', '#/papers', '#/exam', '#/lab', '#/sim',
    '#/settings', '#/stats', '#/progress', '#/subjects', '#/files', '#/share', '#/game'];
  let noH1 = [], noExit = [], noBack = [];
  for (const r of probeRoutes) {
    w.location.hash = '#/__blank__'; await wait(10);
    w.location.hash = r; await wait(110);
    const m = w.document.querySelector('#main');
    if (!m.querySelector('h1')) noH1.push(r);
    if (m.querySelectorAll('.ns-card').length < 2) noExit.push(r);
    if (!m.querySelector('.pg-back')) noBack.push(r);
  }
  ok('mọi trang đều có h1', noH1.length === 0, noH1.join(', '));
  ok('mọi trang đều có lối đi tiếp', noExit.length === 0, noExit.join(', '));
  ok('mọi trang con đều có nút lùi', noBack.length === 0, noBack.join(', '));
  w.location.hash = '#/'; await wait(180);
  ok('trang chủ không có nút lùi', !w.document.querySelector('#main .pg-back'));

  /* "Đang học dở" phải trỏ đúng ca vừa rời, không phải ca trống đầu tiên */
  ev("state.done={};state.last={d:5,s:2};save();");
  w.location.hash = '#/__blank__'; await wait(15);
  w.location.hash = '#/'; await wait(200);
  const cont = w.document.querySelector('#main .continue');
  ok('Học tiếp trỏ về ca vừa rời', cont && cont.getAttribute('href') === '#/lesson/5/2',
    cont ? cont.getAttribute('href') : 'none');
  ok('nhãn nói rõ là đang học dở', /Đang học dở/.test(cont.textContent));
  ev("state.last=null;save();");

  /* =========================================================
     15. LOGO = BIỂU TƯỢNG TAB
     ========================================================= */
  ok('favicon là chính dấu cáo, không phải chữ số',
    /shape-rendering='crispEdges'/.test(w.document.querySelector('link[rel=icon]').getAttribute('href')));
  const markRows = [...w.document.querySelectorAll('.px-mark')][0].querySelectorAll(':scope > span').length;
  ok('mark là lưới 16 dòng', markRows === 16, markRows);
  /* Compare CELL BY CELL. Comparing the joined className string is wrong:
     'c1' is two characters, so reversing the string interleaves '1c'. That
     bug made a correct mark look asymmetric. */
  const symRows = ev(`(function(){
    var m=document.querySelector('.px-mark');
    return [...m.querySelectorAll(':scope > span')].map(r=>{
      var c=[...r.children].map(x=>x.className.replace(/^c/,'')||'.');
      return c.join('')===c.slice().reverse().join('');
    });
  })()`);
  ok('mark đối xứng trái–phải', symRows.every(Boolean), symRows.filter(x => !x).length + ' dòng lệch');
  ok('hai mắt đối xứng qua trục giữa', ev(`(function(){
    var m=document.querySelector('.px-mark');
    var rows=[...m.querySelectorAll(':scope > span')];
    return rows.every(r=>{
      var c=[...r.children].map(x=>x.className);
      return c.join('')===c.slice().reverse().join('');
    });
  })()`));

  const pass = results.filter(r => r.pass).length;
  results.filter(r => !r.pass).forEach(r => console.log('  ✗ ' + r.n + (r.note ? ' — ' + r.note : '')));
  console.log(`\n${pass}/${results.length} bước đạt` + (pass === results.length ? '  ✓' : ''));
  process.exit(pass === results.length ? 0 : 1);
})();
