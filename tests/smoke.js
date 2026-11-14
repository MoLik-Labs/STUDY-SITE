#!/usr/bin/env node
/**
 * tests/smoke.js — kiểm thử tự động chạy bằng Node, không cần trình duyệt.
 *
 *   node tests/smoke.js            # chạy toàn bộ
 *   node tests/smoke.js --watch    # (không) chỉ chạy một lần
 *
 * Cần `jsdom` (npm i -D jsdom). Nếu chưa cài, script tự báo cách cài.
 * Kiểm tra: nạp index.html, đi qua mọi tuyến, không có lỗi JS,
 * mọi trang đều vẽ ra nội dung, các API lõi trả về đúng kiểu.
 */
'use strict';

const fs = require('fs');
const path = require('path');

let JSDOM, VirtualConsole;
try {
  ({ JSDOM, VirtualConsole } = require('jsdom'));
} catch (e) {
  console.error('✗ thiếu jsdom — chạy:  npm install --no-save jsdom');
  process.exit(2);
}

const ROOT = path.resolve(__dirname, '..');
const FILE = path.join(ROOT, 'index.html');
const html = fs.readFileSync(FILE, 'utf8');

/* jsdom không cài đặt các API này — cấp bản rỗng để app chạy thật */
const PATCH = `
  window.scrollTo = function () {};
  window.print = function () {};
  if (!window.matchMedia) window.matchMedia = function () {
    return { matches: false, media: '', addEventListener() {}, removeEventListener() {},
             addListener() {}, removeListener() {} };
  }
  if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = function () {};
`;

const ROUTES = [
  '#/', '#/day/1', '#/lesson/1/1', '#/lesson/1/1?pane=quiz', '#/lesson/1/1?pane=qa',
  '#/library', '#/notes', '#/papers', '#/qa', '#/exam', '#/review', '#/solve', '#/stats',
  '#/calc', '#/build', '#/builder', '#/sim', '#/subjects', '#/subject/9/vatli', '#/read/seed0',
  '#/studio', '#/mine', '#/files', '#/study', '#/cards', '#/practice', '#/plan',
  '#/focus', '#/progress', '#/timetable', '#/calendar', '#/about', '#/flash',
  '#/settings', '#/lab', '#/sheet', '#/grades', '#/grades/hk2', '#/weekly'
];

const results = [];
const errors = [];

function ok(name, cond, note) {
  results.push({ name, pass: !!cond, note: note === undefined ? '' : String(note) });
}
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => {
    const t = String((e && e.stack) || e);
    if (/Not implemented/.test(t)) return;           // API jsdom chưa có, không phải lỗi app
    errors.push(t.split('\n').slice(0, 5).join('\n'));
  });
  vc.on('error', (...a) => errors.push('console.error: ' + a.join(' ')));

  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'http://localhost/index.html',
    virtualConsole: vc,
  });
  const w = dom.window;
  w.eval(PATCH);
  w.addEventListener('error', e => errors.push('window.error: ' + ((e.error && e.error.stack) || e.message)));

  await wait(350);

  /* ---------- 1. dữ liệu lõi ---------- */
  const core = w.eval(`(() => ({
    days: DAYS.length,
    sessions: TOTAL_SESS,
    videos: Object.keys(LIB).length,
    qa: QA.length,
    quiz: QUIZ.length,
    subjects: SUBJECTS.length,
    grades: (typeof GRADES !== 'undefined' ? GRADES.length : 12),
    lessons: (typeof allLessons === 'function' ? allLessons().length : 0),
    themes: THEMES.length,
    exams: (typeof PAPERS !== 'undefined' ? PAPERS.length : 0)
  }))()`);
  ok('13 ngày trong lộ trình', core.days === 13, core.days + ' ngày');
  ok('52 ca học', core.sessions === 52, core.sessions + ' ca');
  ok('có bài giảng', core.videos > 100, core.videos + ' video');
  ok('có ngân hàng hỏi đáp', core.qa > 100, core.qa + ' câu');
  ok('có trắc nghiệm', core.quiz > 100, core.quiz + ' câu');
  ok('có bài học lớp 1–12', core.lessons > 20, core.lessons + ' bài');
  ok('13 theme', core.themes === 13, core.themes + ' theme');

  /* ---------- 2. mọi tuyến vẽ được, không lỗi ---------- */
  for (const r of ROUTES) {
    const before = errors.length;
    w.location.hash = '#/__blank__';
    await wait(15);
    w.location.hash = r;
    await wait(120);
    const main = w.document.querySelector('#main');
    const chars = main ? main.innerHTML.trim().length : 0;
    const newErr = errors.slice(before);
    ok('tuyến ' + r, chars > 200 && newErr.length === 0,
      chars + ' ký tự' + (newErr.length ? ' · ' + newErr[0].split('\n')[0] : ''));
  }

  /* ---------- 3. API lõi ---------- */
  const api = w.eval(`(() => {
    const out = {};
    out.sched = !!schedState() && Array.isArray(schedState().tables);
    out.study = !!studyState() && Array.isArray(studyState().cards);
    out.school = !!schoolState() && typeof schoolState().grade === 'number';
    out.escQuote = esc('a"b<c>d&e');
    out.importOk = !!AppStore.importText(JSON.stringify({ state: { done: {}, ans: {} } }));
    out.importRejectsGarbage = AppStore.importText('{"hello":1}') === null;
    out.uidUnique = (typeof uid === 'function') ? (() => { const s = new Set(); for (let i = 0; i < 500; i++) s.add(uid()); return s.size; })() : -1;
    return out;
  })()`);
  ok('schedState() hợp lệ', api.sched);
  ok('studyState() hợp lệ', api.study);
  ok('schoolState() hợp lệ', api.school);
  ok('esc() thoát dấu nháy kép', api.escQuote === 'a&quot;b&lt;c&gt;d&amp;e', api.escQuote);
  ok('import sao lưu hợp lệ', api.importOk);
  ok('import từ chối rác', api.importRejectsGarbage);
  ok('uid() không trùng', api.uidUnique === -1 || api.uidUnique === 500, api.uidUnique + '/500');

  /* ---------- 4. không lỗi JS toàn cục ---------- */
  ok('không có lỗi JS', errors.length === 0, errors.length ? errors[0].split('\n')[0] : '');

  /* ---------- in kết quả ---------- */
  const pass = results.filter(r => r.pass).length;
  const total = results.length;
  for (const r of results) {
    if (!r.pass) console.log('  ✗ ' + r.name + (r.note ? ' — ' + r.note : ''));
  }
  console.log(`\n${pass}/${total} bước đạt` + (pass === total ? '  ✓' : ''));
  if (errors.length) {
    console.log('\nLỗi JS:');
    [...new Set(errors)].slice(0, 10).forEach(e => console.log('  ✗ ' + e));
  }
  process.exit(pass === total ? 0 : 1);
})();
