#!/usr/bin/env node
/**
 * tests/resilience.js — dữ liệu hỏng không được làm chết giao diện.
 *
 * Vì sao có tệp này: người dùng thật luôn tìm ra dữ liệu sai kiểu mà lập trình
 * viên không nghĩ tới. Ba lỗi đã gặp thật, đều làm TRẮNG trang chứ không chỉ
 * sai một con số:
 *
 *   state.done = null   → doneCount() ném lỗi → mất thanh ray, trang chủ,
 *                          mọi thanh tiến độ (Cài đặt vẫn "đã lưu" bình thường)
 *   state.school = "x"  → Object.keys(S.lessons) ném lỗi → chết trang Bài của tôi
 *   state.school = {}   → S.lessons thiếu → lessonList()/lessonById() ném lỗi
 *
 * Dữ liệu đó đến từ: tệp .json nhập tay, bản cũ của chính app, tiện ích trình
 * duyệt sửa localStorage, hoặc đồng bộ giữa hai phiên bản.
 *
 * Cách kiểm: nạp bản build thật trong jsdom, tiêm từng dạng hỏng qua ĐÚNG
 * đường đi của người dùng (localStorage → AppStore.readSync → loadState),
 * rồi đi qua toàn bộ tuyến. Bất kỳ ngoại lệ nào cũng là lỗi.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'dist', 'index.html'), 'utf8');

const ROUTES = ['#/', '#/physics', '#/study', '#/cards', '#/library', '#/notes', '#/papers',
  '#/qa', '#/review', '#/calc', '#/build', '#/lab', '#/sim', '#/special', '#/stats',
  '#/settings', '#/grades', '#/timetable', '#/calendar', '#/weekly', '#/plan', '#/focus',
  '#/practice', '#/exam', '#/subjects', '#/discover', '#/share', '#/about', '#/mine',
  '#/files', '#/studio', '#/day/1', '#/lesson/1/1', '#/game', '#/flash', '#/sheet',
  '#/builder', '#/progress', '#/vid/1'];

const SHAPES = [
  { done: null },
  { done: [] },
  { ans: 'x' },
  { watched: null },
  { days: [] },
  { prefs: 5 },
  { last: 'x' },
  { school: 'x' },
  { school: {} },
  { school: { lessons: 'x' } },
  { school: { lessons: { '9|vatli': 'x' } } },
  { mine: 'x' },
  { note: { x: null } },
  { runs: null },
  { goal: '20' },
  { railOpen: 'yes' },
  { done: { d1s1: 'yes' } },
];

const wait = ms => new Promise(r => setTimeout(r, ms));
let fails = 0, checks = 0;

function ok(name, cond, detail) {
  checks++;
  if (cond) return;
  fails++;
  console.log('  ✗ ' + name + (detail ? ' — ' + detail : ''));
}

(async () => {
  for (const shape of SHAPES) {
    const label = JSON.stringify(shape);
    const errs = [];
    const vc = new VirtualConsole();
    /* jsdom không có canvas thật — "Not implemented: getContext" là giới hạn
       của môi trường test, không phải lỗi của app. Bỏ qua đúng thông báo đó. */
    vc.on('jsdomError', e => {
      const m = String((e.detail && e.detail.message) || e.message || e);
      if (/Not implemented|getContext/.test(m)) return;
      errs.push(m);
    });

    const dom = new JSDOM(html, {
      runScripts: 'dangerously', url: 'http://localhost/x.html',
      pretendToBeVisual: true, virtualConsole: vc,
    });
    const w = dom.window;
    w.scrollTo = () => {};
    await wait(300);

    /* Tiêm đúng như một tệp sao lưu hỏng: ghi vào localStorage rồi nạp lại
       bằng chính AppStore — không sửa thẳng biến state, vì như vậy là kiểm
       tra một tình huống không bao giờ xảy ra. */
    w.eval('localStorage.setItem("vnl9.v2", JSON.stringify(' + JSON.stringify(
      Object.assign({}, shape)) + '))');
    const reloaded = w.eval('JSON.stringify(AppStore.readSync().data||{})');
    ok(label + ' · readSync trả về object', reloaded.startsWith('{'), reloaded.slice(0, 40));

    const coerced = w.eval('(function(){var d=AppStore.readSync().data||{};' +
      'return JSON.stringify({doneIsObj:typeof d.done==="object"&&!Array.isArray(d.done),' +
      'schoolIsObj:typeof d.school==="object"&&!Array.isArray(d.school)});})()');
    const c = JSON.parse(coerced);
    ok(label + ' · done được chuẩn hoá về object', c.doneIsObj, coerced);
    ok(label + ' · school được chuẩn hoá về object', c.schoolIsObj, coerced);

    for (const r of ROUTES) {
      try {
        w.location.hash = r;
        await wait(12);
        const main = w.document.querySelector('#main');
        const rail = w.document.querySelector('#rail');
        ok(label + ' ' + r + ' · nội dung có vẽ ra', !!main && main.innerHTML.length > 60);
        ok(label + ' ' + r + ' · thanh ray còn nguyên', !!rail && !!rail.querySelector('a'));
      } catch (e) {
        ok(label + ' ' + r + ' · không ném lỗi', false, e.message);
      }
    }
    ok(label + ' · không ngoại lệ nào trong console', errs.length === 0, errs[0]);
    dom.window.close();
  }

  /* Cùng một tệp hỏng nhưng đi qua ĐƯỜNG NHẬP của người dùng. */
  const importErrs = [];
  const vc2 = new VirtualConsole();
  vc2.on('jsdomError', e => importErrs.push(String((e.detail && e.detail.message) || '')));
  const dom2 = new JSDOM(html, {
    runScripts: 'dangerously', url: 'http://localhost/x.html',
    pretendToBeVisual: true, virtualConsole: vc2,
  });
  const w2 = dom2.window;
  w2.scrollTo = () => {};
  await wait(300);
  const merged = w2.eval(`(() => {
    var raw = JSON.stringify({ app:'vat-li-9', v:1, state:{
      done:null, school:'x', ans:'x', mine:'x', note:null,
      __proto__:{PWN:1}, constructor:{bad:1} }});
    var got = AppStore.importText(raw);
    if (!got) return { ok:false };
    state = AppStore.merge(state, got.state);
    save();
    return { ok:true, doneIsObj: typeof state.done==='object' && state.done!==null,
             schoolIsObj: typeof state.school==='object' && state.school!==null,
             clean: ({PWN:undefined}).PWN===undefined };
  })()`);
  ok('nhập tệp hỏng: vẫn nhập được phần dùng được', merged.ok === true, JSON.stringify(merged));
  ok('nhập tệp hỏng: done/school được chuẩn hoá', merged.doneIsObj && merged.schoolIsObj,
    JSON.stringify(merged));
  ok('nhập tệp hỏng: không làm bẩn prototype', merged.clean === true);

  w2.location.hash = '#/';
  await wait(200);
  ok('nhập tệp hỏng xong trang chủ vẫn vẽ được',
    (w2.document.querySelector('#main') || {}).innerHTML.length > 500);
  ok('nhập tệp hỏng không sinh ngoại lệ', importErrs.length === 0, importErrs[0]);
  dom2.window.close();

  /* =========================================================
     Điều khiển sai giá trị (không phải dữ liệu hỏng)
     ========================================================= */
  const vc3 = new VirtualConsole();
  const ctlErrs = [];
  vc3.on('jsdomError', e => {
    const m = String((e.detail && e.detail.message) || e.message || '');
    if (/Not implemented|getContext/.test(m)) return;
    ctlErrs.push(m);
  });
  const dom3 = new JSDOM(html, {
    runScripts: 'dangerously', url: 'http://localhost/x.html',
    pretendToBeVisual: true, virtualConsole: vc3,
  });
  const w3 = dom3.window;
  w3.scrollTo = () => {};
  w3.HTMLElement.prototype.scrollIntoView = function () {};
  await wait(400);

  /* Select nhận giá trị không có trong danh sách (khôi phục form, trình duyệt
     dịch trang, tiện ích tự điền) từng làm trang soạn bài ném lỗi ngay giữa
     lúc gõ, vì subjectsFor() trả mảng rỗng rồi code đọc list[0].id. */
  w3.location.hash = '#/studio';
  await wait(250);
  const before = ctlErrs.length;
  w3.eval(`(function(){
    var g=document.querySelector('#stG');
    ['', 'abc', '-1', '999'].forEach(function(v){
      g.value=v; g.dispatchEvent(new Event('change',{bubbles:true}));
    });
  })()`);
  ok('lớp không hợp lệ không làm chết trang soạn bài', ctlErrs.length === before,
    ctlErrs[ctlErrs.length - 1]);
  ok('lớp không hợp lệ được kẹp về giá trị cũ',
    w3.eval(`(function(){var g=document.querySelector('#stG');
      return ['1','12','9'].indexOf(g.value)>=0;})()`) === true);

  /* Hình vẽ của máy giải từng in "U = undefined V" vì dạng bài truyền tên
     trường riêng (E/Ud) mà hình vẽ chỉ đọc U/R1. */
  /* thẻ chỉ có trong DOM khi đúng nhóm đang mở, nên đi qua từng nhóm */
  let drawn = 0;
  for (const cat of ['el', 'quang', 'co', 'nhiet', 'tu']) {
    w3.eval('calcState().cat=' + JSON.stringify(cat) + ';');
    w3.location.hash = '#/x'; await wait(25);
    w3.location.hash = '#/calc'; await wait(170);
    const ids = JSON.parse(w3.eval(
      `JSON.stringify(Array.from(document.querySelectorAll('#main .tile[data-id]')).map(function(e){return e.dataset.id}))`));
    for (const id of ids) {
      w3.eval('calcState().id=' + JSON.stringify(id) + ';');
      w3.location.hash = '#/x'; await wait(20);
      w3.location.hash = '#/calc'; await wait(110);
      const d = w3.document.querySelector('#calcDraw');
      const o = w3.document.querySelector('#calcOut');
      const txt = (d ? d.textContent : '') + (o ? o.textContent : '');
      drawn++;
      ok('máy giải ' + id + ' không in undefined/NaN/Infinity',
        !/undefined|NaN|Infinity/.test(txt), (txt.match(/undefined|NaN|Infinity/) || [''])[0]);
    }
  }
  ok('đã kiểm tra toàn bộ máy giải', drawn >= 20, drawn + ' dạng');

  /* Rời bảng mạch phải gỡ listener cấp document — nếu không nó bắt phím
     Delete/Escape trên mọi trang khác và giữ cả lượt vẽ cũ trong bộ nhớ. */
  await wait(50);
  const live0 = w3.eval('document.onkeydown');
  w3.location.hash = '#/build'; await wait(250);
  w3.location.hash = '#/'; await wait(250);
  const live1 = w3.eval('document.onkeydown');
  ok('rời bảng mạch có gỡ phím tắt', live0 === null && live1 === null,
    'trước=' + (live0 === null) + ' sau=' + (live1 === null));

  ok('điều khiển sai giá trị không sinh ngoại lệ nào', ctlErrs.length === 0, ctlErrs[0]);
  dom3.window.close();

  console.log(`\n${checks - fails}/${checks} bước đạt  ${fails ? '✗' : '✓'}`);
  process.exit(fails ? 1 : 0);
})();
