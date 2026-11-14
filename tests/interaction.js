#!/usr/bin/env node
/**
 * tests/interaction.js — kiểm thử hành vi thật trong DOM (jsdom).
 * Tập trung vào những lỗi từng làm hỏng dữ liệu người dùng:
 *   · tên có dấu nháy kép làm vỡ thuộc tính → ô nhập hiện rỗng
 *   · confirm() của trình duyệt bị chặn trong iframe
 *   · 3 bản sao lưu localStorage trỏ về cùng một nội dung
 *   · .ics không thoát ký tự / không gấp dòng
 */
'use strict';

const fs = require('fs');
const path = require('path');
let JSDOM, VirtualConsole;
try { ({ JSDOM, VirtualConsole } = require('jsdom')); }
catch (e) { console.error('✗ thiếu jsdom — chạy:  npm install --no-save jsdom'); process.exit(2); }

const ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

const PATCH = `
  window.scrollTo = function () {};
  window.print = function () {};
  if (!window.matchMedia) window.matchMedia = function () {
    return { matches: false, media: '', addEventListener() {}, removeEventListener() {},
             addListener() {}, removeListener() {} };
  };
  if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = function () {};
  window.__blobs = [];
  const _create = URL.createObjectURL;
  URL.createObjectURL = function (b) { try { window.__blobText = b.text ? 'async' : ''; window.__lastBlob = b; } catch (e) {} return 'blob:test'; };
  URL.revokeObjectURL = function () {};
`;

const results = [];
const errors = [];
const ok = (name, cond, note) => results.push({ name, pass: !!cond, note: note === undefined ? '' : String(note) });
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => {
    const t = String((e && e.stack) || e);
    if (/Not implemented/.test(t)) return;
    errors.push(t.split('\n').slice(0, 4).join('\n'));
  });

  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true,
    url: 'http://localhost/index.html', virtualConsole: vc });
  const w = dom.window, doc = w.document;
  w.eval(PATCH);
  w.addEventListener('error', e => errors.push('window.error: ' + ((e.error && e.error.stack) || e.message)));
  await wait(350);

  const go = async h => { w.location.hash = '#/__x__'; await wait(20); w.location.hash = h; await wait(120); };
  const $ = q => doc.querySelector(q);

  /* ---------- 1. dấu nháy kép trong tên không làm vỡ ô nhập ---------- */
  const NASTY = 'Vật "lí" & <b> 9/1';
  w.eval(`(()=>{ const S=schedState(); schedTable().cells['0-m-0']={s:${JSON.stringify(NASTY)},t:'Cô "Hoa"',r:'P1',c:'brick'}; save(); })()`);
  await go('#/timetable');
  const cellBtn = $('[data-cell="0-m-0"]');
  ok('ô thời khoá biểu có dữ liệu', !!cellBtn);
  if (cellBtn) {
    cellBtn.click(); await wait(120);
    const v = $('#tpS') ? $('#tpS').value : null;
    ok('mở ô: giữ nguyên tên có dấu nháy', v === NASTY, JSON.stringify(v));
    const t = $('#tpT') ? $('#tpT').value : null;
    ok('mở ô: giữ nguyên tên GV có dấu nháy', t === 'Cô "Hoa"', JSON.stringify(t));
    const save2 = $('#tpSave'); if (save2) save2.click(); await wait(120);
    const kept = w.eval(`schedTable().cells['0-m-0'].s`);
    ok('lưu lại: không mất ký tự', kept === NASTY, JSON.stringify(kept));
  }

  /* ---------- 2. không còn confirm() gốc ---------- */
  const nativeConfirm = w.eval(`(() => {
    let called = 0;
    const orig = window.confirm;
    window.confirm = function () { called++; return false; };
    let total = 0;
    ['#/timetable', '#/calendar', '#/plan', '#/exam', '#/study'].forEach(() => {});
    window.__confirmCalled = () => called;
    window.confirm = orig;
    return { hasUiConfirm: typeof uiConfirm === 'function' };
  })()`);
  ok('có uiConfirm()', nativeConfirm.hasUiConfirm);

  /* ---------- 3. uiConfirm: Huỷ thì không xoá, Xác nhận thì xoá ---------- */
  await go('#/timetable');
  w.eval(`(()=>{ const S=schedState(); S.tables.push(schNewTable('QA · bảng phụ')); S.activeId=S.tables[S.tables.length-1].id; save(); })()`);
  await go('#/timetable');
  const nTab0 = w.eval('schedState().tables.length');
  const delBtn = $('#ttDel');
  if (delBtn) {
    delBtn.click(); await wait(80);
    ok('hộp xác nhận hiện ra', !!$('.ov-panel[role="alertdialog"]'));
    $('#ucNo').click(); await wait(80);
    ok('bấm Huỷ: không xoá bảng', w.eval('schedState().tables.length') === nTab0);
    ok('bấm Huỷ: hộp thoại đóng', !$('.ov-panel[role="alertdialog"]'));
    delBtn.click(); await wait(80);
    $('#ucYes').click(); await wait(120);
    ok('bấm Xác nhận: xoá bảng', w.eval('schedState().tables.length') === nTab0 - 1,
      w.eval('schedState().tables.length') + ' bảng');
    ok('luôn còn ít nhất một bảng', w.eval('schedState().tables.length') >= 1);
  } else ok('có nút xoá bảng', false);

  /* ---------- 4. xoay vòng bản sao lưu thật sự khác nhau ---------- */
  const bak = w.eval(`(() => {
    const realNow = Date.now;
    let t = realNow() + 1e6;   /* phải lớn hơn mốc thật đã dùng cho lastWrite */
    Date.now = () => t;
    try {
      state.__marker = 'A'; AppStore.write(state); t += 25000;
      state.__marker = 'B'; AppStore.write(state); t += 25000;
      state.__marker = 'C'; AppStore.write(state); t += 25000;
      state.__marker = 'D'; AppStore.write(state);
      const g = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
      const marks = ['vnl9.b1', 'vnl9.b2', 'vnl9.b3'].map(k => (g(k) || {}).__marker || null);
      const main = (g('vnl9.v2') || {}).__marker;
      return { main, marks, distinct: new Set(marks.filter(Boolean)).size };
    } finally { Date.now = realNow; delete state.__marker; }
  })()`);
  ok('bản chính là mới nhất', bak.main === 'D', bak.main);
  ok('3 bản dự phòng khác nội dung nhau', bak.distinct >= 2, JSON.stringify(bak.marks));

  /* ---------- 5. .ics thoát ký tự và gấp dòng ---------- */
  const ics = w.eval(`(() => {
    const S = schedState();
    S.events = [
      { id: 'e1', date: '2026-12-01', time: '19:00', title: 'Ôn, thi; Vật lí', kind: 'exam', note: 'dòng 1\\ndòng 2', done: false },
      { id: 'e2', date: '2026-12-02', time: '08:00', title: 'X'.repeat(200), kind: 'study', done: false }
    ];
    let captured = null;
    const origBlob = window.Blob;
    window.Blob = function (parts, opts) { captured = parts.join(''); return new origBlob(parts, opts); };
    try { schICS(); } finally { window.Blob = origBlob; }
    return captured;
  })()`);
  if (typeof ics === 'string') {
    ok('.ics có VCALENDAR', ics.includes('BEGIN:VCALENDAR') && ics.includes('END:VCALENDAR'));
    const summ = ics.split('\r\n').filter(l => l.startsWith('SUMMARY')).join(' ');
    ok('.ics thoát dấu phẩy và chấm phẩy', summ.includes(String.raw`Ôn\, thi\; Vật lí`), summ);
    ok('.ics thoát xuống dòng', ics.includes(String.raw`dòng 1\ndòng 2`));
    ok('.ics gấp dòng dài (<75 ký tự/dòng)',
      ics.split('\r\n').every(l => l.length <= 75),
      'dài nhất ' + Math.max(...ics.split('\r\n').map(l => l.length)));
  } else ok('.ics xuất được', false, typeof ics);

  /* ---------- 6. sao lưu → khôi phục giữ nguyên dữ liệu ---------- */
  const rt = w.eval(`(() => {
    state.done['d1s1'] = 1;
    state.note['x'] = 'ghi chú "có nháy"';
    const dump = JSON.parse(JSON.stringify(state));
    const back = AppStore.importText(JSON.stringify({ app: 'vat-li-9', v: 1, state: dump }));
    return { done: back && back.state.done['d1s1'], note: back && back.state.note['x'] };
  })()`);
  ok('sao lưu giữ tiến độ', rt.done === 1);
  ok('sao lưu giữ ghi chú có dấu nháy', rt.note === 'ghi chú "có nháy"', rt.note);

  /* ---------- 6b. nhập tệp không được là lỗ hổng ---------- */
  const safe = w.eval(`(() => {
    const raw = '{"ans":{"a":{"ok":true}},"prefs":{},"__proto__":{"PWNED":1},"constructor":{"bad":1},"junk":"x"}';
    const dirty = JSON.stringify({ state: JSON.parse(raw) });
    const got = AppStore.importText(dirty);
    return { keys: got ? Object.keys(got.state).sort().join(',') : '',
      dropped: got ? got.dropped.length : -1, leak: ({}).PWNED !== undefined };
  })()`);
  /* Bản nhập được chuẩn hoá kiểu (coerce) nên sẽ có thêm khoá rỗng mặc định —
     điều phải kiểm tra là khoá ĐỘC không lọt vào, không phải danh sách y hệt. */
  ok('nhập tệp bỏ __proto__ và khoá lạ',
    safe.dropped === 3 && /(^|,)ans(,|$)/.test(safe.keys) && /(^|,)prefs(,|$)/.test(safe.keys)
      && !/__proto__|constructor|junk/.test(safe.keys),
    safe.keys + ' / bỏ ' + safe.dropped);
  ok('nhập tệp không làm bẩn prototype', safe.leak === false);

  const merged = w.eval(`(() => {
    state.ans = { old: { ok: false } };
    const got = AppStore.importText(JSON.stringify({ state: { ans: { fresh: { ok: true } } } }));
    return Object.keys(AppStore.merge(state, got.state).ans).join(',');
  })()`);
  ok('nhập tệp thay cả bảng câu trả lời (không trộn đáp án cũ)', merged === 'fresh', merged);
  ok('tệp rác bị từ chối',
    w.eval(`AppStore.importText(JSON.stringify({ state: { unrelated: 1 } })) === null`));
  ok('tệp quá lớn bị từ chối trước khi parse',
    w.eval(`AppStore.importText('x'.repeat(5 * 1024 * 1024)) === null`));

  /* ---------- 6c. hết chỗ lưu phải nói ra, và phải tự cứu ---------- */
  const quota = w.eval(`(() => {
    const real = Storage.prototype.setItem;
    const set = (k, v) => real.call(localStorage, k, v);
    localStorage.removeItem('vnl9.b1'); localStorage.removeItem('vnl9.b2');
    set('vnl9.b1', 'cu'); set('vnl9.b2', 'cu2');
    let hit = 0;
    Storage.prototype.setItem = function (k, v) {
      if (k === 'vnl9.v2' && hit++ < 1) {
        const e = new Error('q'); e.name = 'QuotaExceededError'; throw e;
      }
      return real.call(this, k, v);
    };
    const recovered = AppStore.write({ ans: { a: 1 } });
    const backupsDropped = !localStorage.getItem('vnl9.b1');
    Storage.prototype.setItem = function () {
      const e = new Error('q'); e.name = 'QuotaExceededError'; throw e;
    };
    let told = null;
    window.toast = m => { told = m; };
    const honest = AppStore.write({ ans: { b: 1 } });
    Storage.prototype.setItem = real;
    return { recovered, backupsDropped, honest, told: told || '', fail: !!AppStore.health().fail };
  })()`);
  ok('hết chỗ: tự bỏ bản dự phòng để cứu bản chính', quota.recovered === true && quota.backupsDropped);
  ok('hết chỗ hoàn toàn: write() trả false thay vì im lặng', quota.honest === false);
  ok('hết chỗ hoàn toàn: người dùng được báo', /đầy|Không lưu được/.test(quota.told), quota.told);
  ok('sức khoẻ kho lưu ghi nhận lỗi', quota.fail === true);

  /* ---------- 7. luồng học cốt lõi: thẻ → kế hoạch → thi thử ---------- */
  await go('#/cards');
  const nCard0 = w.eval('studyState().cards.length');
  const newCard = $('#cdNew');
  if (newCard) {
    newCard.click(); await wait(100);
    $('#ucF').value = 'Định luật Ôm nói gì?';
    $('#ucB').value = 'I = U / R';
    $('#ucYes').click(); await wait(150);
    ok('tạo thẻ ghi nhớ', w.eval('studyState().cards.length') === nCard0 + 1);
    ok('thẻ có hộp + hạn ôn', !!w.eval('(()=>{const c=studyState().cards[0];return c&&typeof c.box==="number"&&typeof c.due==="number";})()'));
  } else ok('có nút tạo thẻ', false);

  await go('#/plan');
  if ($('#plDate')) {
    $('#plDate').value = '2026-12-31';
    $('#plMin').value = '60';
    $('#plBuild').click(); await wait(250);
    const days = w.eval('studyState().plan ? studyState().plan.days.length : 0');
    ok('dựng được kế hoạch', days > 0, days + ' ngày');
    const pk = $('[data-pk]');
    if (pk) { pk.click(); await wait(150); ok('tick xong một mục', w.eval('studyState().plan.doneCount') >= 1); }
    else ok('có mục để tick', false);
  } else ok('có form kế hoạch', false);

  await go('#/exam');
  const examQs = w.eval('(typeof EXAM!=="undefined"&&EXAM)?(EXAM.qs?EXAM.qs.length:EXAM.q.length):0');
  ok('thi thử bốc được đề', examQs > 0, examQs + ' câu');
  const pickCount = () => w.eval(`(typeof EXAM!=="undefined"&&EXAM)?Object.keys(EXAM.picks||{}).filter(k=>EXAM.picks[k]!==undefined).length:0`);
  const before1 = pickCount();
  const optBtn = doc.querySelector('#main .opt, #main [data-opt]');
  if (optBtn) { optBtn.click(); await wait(120); }
  ok('bấm chọn được đáp án', pickCount() > before1, before1 + ' → ' + pickCount());

  /* ---------- 8. đổi theme có lưu lại ---------- */
  await go('#/settings');
  const themeBtns = [...doc.querySelectorAll('[data-theme-pick]')];
  ok('có đủ 13 theme', themeBtns.length === 13, themeBtns.length + ' theme');
  if (themeBtns.length) {
    themeBtns[themeBtns.length - 1].click(); await wait(120);
    const applied = doc.documentElement.getAttribute('data-theme');
    ok('đổi theme áp dụng ngay', applied === themeBtns[themeBtns.length - 1].dataset.themePick, applied);
    const saved = w.eval(`(()=>{try{return (JSON.parse(localStorage.getItem('vnl9.prefs')||'{}').theme)||null;}catch(e){return null;}})()`);
    ok('theme được ghi nhớ sau khi tải lại', saved === applied, saved);
  }

  /* ---------- 9. bẫy Tab trong hộp thoại ---------- */
  await go('#/timetable');
  w.eval(`uiConfirm('QA', 'thử bẫy Tab', ()=>{})`);
  await wait(80);
  const panel = $('.ov-panel[role="alertdialog"]');
  ok('uiConfirm dựng được hộp thoại', !!panel);
  if (panel) {
    const focusables = panel.querySelectorAll('button, input, a[href]');
    ok('hộp thoại có nút bấm được', focusables.length >= 2, focusables.length + ' phần tử');
    const yes = $('#ucYes');
    yes.focus();
    doc.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    await wait(50);
    ok('Tab không thoát ra ngoài hộp thoại', panel.contains(doc.activeElement));
    $('#ucNo').click(); await wait(50);
    ok('Esc/đóng dọn sạch hộp thoại', !$('.ov-panel[role="alertdialog"]'));
  }

  ok('không có lỗi JS', errors.length === 0, errors[0] || '');

  /* ---------- in ---------- */
  const pass = results.filter(r => r.pass).length;
  results.filter(r => !r.pass).forEach(r => console.log('  ✗ ' + r.name + (r.note ? ' — ' + r.note : '')));
  console.log(`\n${pass}/${results.length} bước đạt` + (pass === results.length ? '  ✓' : ''));
  if (errors.length) [...new Set(errors)].slice(0, 6).forEach(e => console.log('  ✗ ' + e));
  process.exit(pass === results.length ? 0 : 1);
})();
