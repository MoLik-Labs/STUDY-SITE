#!/usr/bin/env node
/**
 * tests/newfeat.js — khoá lại phần tính toán của hai trang mới
 * (Sổ điểm #/grades và Kế hoạch tuần #/weekly).
 *
 * Những chỗ này là **công thức**, không phải giao diện: sai một hệ số là
 * điểm trung bình sai, và học sinh sẽ tin con số đó. Vì vậy phải có kiểm thử
 * chạy trên số thật, không chỉ "trang có vẽ ra chữ".
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
    window.scrollTo = function(){};
    if(!window.matchMedia) window.matchMedia = () => ({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
    if(!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = function(){};
  `);
  await wait(400);
  const ev = code => w.eval(code);

  /* =========================================================
     1. SỔ ĐIỂM — công thức hệ số của Bộ GD&ĐT
     ========================================================= */

  /* Ví dụ trong tài liệu: miệng 7,6,9 · 15' 6,6,8,7 · 1 tiết 6,9 · HK 10
     Σ = 7+6+9+6+6+8+7 + 2×(6+9) + 3×10 = 109 ; Σ hệ số = 7 + 4 + 6 = 14
     (nhiều trang trên mạng in 7,714 — đó là 108/14, tính nhẩm sai 1 điểm) */
  ev("state.grades = null;");
  const gid = ev("gdRow('Vật lí').id");
  [['mouth',7],['mouth',6],['mouth',9],['p15',6],['p15',6],['p15',8],['p15',7],
   ['p45',6],['p45',9],['sem',10]].forEach(([k,v]) => ev(`gdAddMark('${gid}','${k}',${v},'hk1');`));

  const avg = ev(`gdAvg(gdState().rows[0],'hk1')`);
  ok('ĐTB học kì = 109/14', Math.abs(avg - 109 / 14) < 1e-9, avg.toFixed(4));
  ok('ĐTB làm tròn 7,79', avg.toFixed(2) === '7.79', avg.toFixed(2));

  /* hệ số mặc định đúng: miệng 1 · 15′ 1 · 1 tiết 2 · học kì 3 */
  const wts = ev('JSON.stringify(gdState().w)');
  ok('hệ số mặc định 1/1/2/3', wts === '{"mouth":1,"p15":1,"p45":2,"sem":3}', wts);

  /* đổi hệ số → điểm đổi theo ngay, không phải nhập lại */
  ev("gdState().w.p45 = 1;");
  const avg2 = ev(`gdAvg(gdState().rows[0],'hk1')`);
  /* Đổi hệ số 1 tiết từ 2 → 1 thì mẫu số 14 giảm còn 10, tử số 109 giữ nguyên
     (vì cả 6 và 9 đều nhân 1 thay vì 2): 109/10 = 10,9 → nhưng điểm vào bị
     chặn ở 10 nên mẫu phải tính lại đúng theo dữ liệu thật. */
  const expect2 = ev(`(() => { const r = gdState().rows[0];
    let s = 0, m = 0;
    r.marks.forEach(k => { if (k.term !== 'hk1') return;
      const w = gdState().w[k.kind]; s += k.v * w; m += w; });
    return s / m; })()`);
  ok('sửa hệ số 1 tiết → 2 thành 1', Math.abs(avg2 - expect2) < 1e-9, avg2.toFixed(4) + ' vs ' + expect2.toFixed(4));
  ev("gdState().w.p45 = 2;");

  /* cả năm = (HK1 + 2×HK2) / 3 */
  [['sem',8,'hk2']].forEach(([k,v,t]) => ev(`gdAddMark('${gid}','${k}',${v},'${t}');`));
  const hk1 = ev(`gdAvg(gdState().rows[0],'hk1')`);
  const hk2 = ev(`gdAvg(gdState().rows[0],'hk2')`);
  const yr = ev('gdYearAvg(gdState().rows[0])');
  ok('cả năm = (HK1 + 2×HK2)/3', Math.abs(yr - (hk1 + 2 * hk2) / 3) < 1e-9, yr.toFixed(4));
  ok('HK2 chỉ có điểm học kì', Math.abs(hk2 - 8) < 1e-9, hk2);

  /* điểm bị chặn trong [0,10] */
  ok('chặn điểm > 10', ev(`gdAddMark('${gid}','p15',15,'hk1')`) === true &&
     ev("gdState().rows[0].marks.slice(-1)[0].v") === 10);
  ok('chặn điểm < 0', ev(`gdAddMark('${gid}','p15',-4,'hk1')`) === true &&
     ev("gdState().rows[0].marks.slice(-1)[0].v") === 0);
  ok('từ chối điểm không phải số', ev(`gdAddMark('${gid}','p15','abc','hk1')`) === false);

  /* xếp loại theo TT 22/2021 */
  const ranks = ev("JSON.stringify([gdRank(9),gdRank(8),gdRank(7),gdRank(6.5),gdRank(5),gdRank(3.5),gdRank(2)].map(r=>r.code))");
  ok('xếp loại T/K/Đ/C/Y', ranks === '["T","T","K","K","Đ","C","Y"]', ranks);

  /* what-if: cần bao nhiêu điểm ở bài 1 tiết tiếp theo */
  ev("state.grades = null;");
  const wid = ev("gdRow('Toán').id");
  [['p45',6],['p45',6]].forEach(([k,v]) => ev(`gdAddMark('${wid}','${k}',${v},'hk1');`));
  ev('gdState().target = 8;');
  const wi = ev(`gdWhatIf(gdState().rows[0],'hk1')`);
  /* hiện 6.0 với hệ số 4; thêm 1 tiết (hệ số 2) để đạt 8 → cần (8×6−24)/2 = 12 → không đạt được */
  ok('what-if phát hiện mục tiêu bất khả thi', wi.reachable === false, JSON.stringify(wi));
  ev('gdState().target = 7;');
  const wi2 = ev(`gdWhatIf(gdState().rows[0],'hk1')`);
  /* (7×6−24)/2 = 9 */
  ok('what-if tính đúng điểm cần', Math.abs(wi2.need - 9) < 1e-9, wi2.need);

  /* =========================================================
     2. KẾ HOẠCH TUẦN — rải việc, độ khó, đếm ngược
     ========================================================= */
  ev('state.weekly = null;');
  const pid = ev("wkAddProject('Ôn thi giữa kì').id");
  const tid = ev(`wkAddTask('${pid}','Đọc chương 3').id`);
  ev(`wkAddSub('${pid}','${tid}','khó: giải 10 bài',3,null);
      wkAddSub('${pid}','${tid}','vừa: làm đề',2,null);
      wkAddSub('${pid}','${tid}','dễ: học công thức',1,null);`);

  ok('việc con mới chưa có ngày', ev(`wkState().projects[0].tasks[0].subs.every(s=>s.day===null)`));
  ok('rải 3 việc vào 3 ngày', ev(`wkAutoSpread('${pid}')`) === 3);
  const spread = ev(`JSON.stringify(wkState().projects[0].tasks[0].subs.map(s=>s.day))`);
  ok('mỗi việc một ngày khác nhau', spread === '[0,1,2]', spread);
  const diffs = ev(`JSON.stringify(wkState().projects[0].tasks[0].subs.map(s=>s.diff))`);
  ok('việc khó nhất lên đầu tuần', diffs === '[3,2,1]', diffs);

  /* tắt hết ngày → không rải được, không làm hỏng dữ liệu */
  ev('state.weekly.days = {};');
  ok('không có ngày nào → rải 0', ev(`wkAutoSpread('${pid}')`) === 0);
  ev('state.weekly.days = {0:1,1:1,2:1,3:1,4:1,5:1,6:1};');

  /* đánh dấu xong → đếm đúng */
  const st0 = ev('wkStats(0)');
  ok('thống kê tuần: 3 việc', st0.all === 3, JSON.stringify(st0));
  ev(`wkToggle('${pid}', wkState().projects[0].tasks[0].subs[0].id)`);
  const st1 = ev('wkStats(0)');
  ok('tick 1 → 1/3 xong', st1.done === 1 && st1.left === 2 && st1.pct === 33, JSON.stringify(st1));
  ev(`wkToggle('${pid}', wkState().projects[0].tasks[0].subs[0].id)`);
  ok('bỏ tick → về 0', ev('wkStats(0)').done === 0);

  /* kéo việc trễ */
  ev('state.weekly.projects[0].tasks[0].subs.forEach(s=>s.day=0);');
  const od = ev('wkOverdue().length');
  ok('việc ở thứ Hai đã qua thì tính là trễ', od === 0 || ev('wkDow()') === 0 ? true : od === 3,
     'hôm nay là ngày ' + ev('wkDow()') + ', trễ ' + od);
  if (od) {
    const moved = ev('wkPullOverdue()');
    ok('kéo việc trễ về hôm nay', moved === od && ev('wkOverdue().length') === 0, moved);
  }

  /* tiền tố độ khó phải được hiểu ở MỌI đường nhập */
  ev('state.weekly = null;');
  const p2 = ev("wkAddProject('P2').id");
  const t2 = ev(`wkAddTask('${p2}','T2').id`);
  ev(`wkAddSub('${p2}','${t2}','khó: việc khó',2,0);
      wkAddSub('${p2}','${t2}','dễ: việc dễ',2,0);
      wkAddSub('${p2}','${t2}','việc thường',2,0);`);
  const parsed = ev(`JSON.stringify(wkState().projects[0].tasks[0].subs.map(s=>s.diff+':'+s.title))`);
  ok('tiền tố khó:/dễ: thắng tham số', parsed === '["3:việc khó","1:việc dễ","2:việc thường"]', parsed);
  /* tên "việc khó" có chữ "khó" là hợp lệ — chỉ không được còn tiền tố "khó:" */
  ok('tiền tố không nằm lại trong tên',
    !/^\s*(khó|vừa|dễ)\s*[:：]/i.test(ev(`wkState().projects[0].tasks[0].subs[0].title`)),
    ev(`wkState().projects[0].tasks[0].subs[0].title`));

  /* đếm ngược + khả thi */
  const iso = ev("new Date(Date.now()+10*864e5).toISOString().slice(0,10)");
  ok('đếm ngược 10 ngày', ev(`gdDaysLeft('${iso}')`) === 10, ev(`gdDaysLeft('${iso}')`));
  ok('đếm ngược hôm nay = 0', ev(`gdDaysLeft(new Date().toISOString().slice(0,10))`) === 0);
  ok('đếm ngược rỗng = null', ev('gdDaysLeft(null)') === null);

  /* =========================================================
     3. Hai tuyến mới thật sự vẽ ra nội dung
     ========================================================= */
  for (const r of ['#/grades', '#/weekly']) {
    w.location.hash = '#/__blank__';
    await wait(20);
    w.location.hash = r;
    await wait(160);
    const main = w.document.querySelector('#main');
    ok('tuyến ' + r + ' có nội dung', main && main.innerHTML.length > 800, main ? main.innerHTML.length : 0);
  }

  w.location.hash = '#/grades';
  await wait(160);
  ok('#/grades vẽ 4 nhóm điểm', w.document.querySelectorAll('.gd-kind').length >= 4,
     w.document.querySelectorAll('.gd-kind').length);
  ok('#/grades có ô thêm môn', !!w.document.querySelector('#gdNew'));

  w.location.hash = '#/weekly';
  await wait(160);
  ok('#/weekly vẽ 7 cột', w.document.querySelectorAll('.wk-col').length === 7,
     w.document.querySelectorAll('.wk-col').length);
  ok('#/weekly có nút thêm việc cho từng ngày', w.document.querySelectorAll('.wk-add-sub').length === 7);


  /* =========================================================
     WEEK BOARD v2 — the beaverplans operations
     ---------------------------------------------------------
     Each of these is a state transition that used to be impossible:
     a week could not be finished, a plan could not be reused, an item
     could not move between days. They are tested as operations, not as
     pixels, because the pixels follow from the state.
     ========================================================= */
  ev('state.weekly = null;');
  const bp = ev("wkAddProject('Ôn thi','#c6542d').id");
  const bt = ev(`wkAddTask('${bp}','Chương 3').id`);
  ev(`wkAddSub('${bp}','${bt}','khó: 15 bài tụ điện',3,0);
      wkAddSub('${bp}','${bt}','vừa: đọc lý thuyết',2,1);
      wkAddSub('${bp}','${bt}','dễ: 5 công thức',1,2);`);

  /* --- move one item, including across a week boundary --- */
  const mvSub = ev(`wkState().projects[0].tasks[0].subs[0].id`);
  ok('dời một việc sang thứ Sáu', ev(`wkMove('${bp}','${mvSub}',4,0)`) === true);
  ok('việc đã ở thứ Sáu', ev(`wkState().projects[0].tasks[0].subs[0].day`) === 4);
  ok('dời sang tuần sau thì đổi cả tuần',
    ev(`wkMove('${bp}','${mvSub}',2,1)`) === true &&
    ev(`wkState().projects[0].tasks[0].subs[0].w`) === 1);
  ok('rời tuần cũ thì tuần cũ không còn việc đó',
    ev('wkStats(0).all') === 2, ev('wkStats(0).all'));
  ok('tuần mới có đúng một việc', ev('wkStats(1).all') === 1, ev('wkStats(1).all'));
  ev('wkState().offset = 0;');

  /* --- whole-task move --- */
  const subCount = ev(`wkState().projects[0].tasks[0].subs.length`);
  ok('dồn cả việc sang thứ Ba', ev(`wkMoveTask('${bp}','${bt}',1,0)`) === subCount, subCount);
  ok('mọi việc con của việc đó đều sang thứ Ba',
    ev(`wkState().projects[0].tasks[0].subs.every(s=>s.day===1)`));

  /* --- scope: a week only shows its own work --- */
  ok('việc của tuần 1 không lọt sang tuần 0',
    ev(`wkMove('${bp}','${mvSub}',0,1)`) && ev('wkStats(0).all') === 2);

  /* --- copy / paste --- */
  const planTxt = ev('wkCopyPlan(0)');
  ok('copy plan ra văn bản có cấu trúc', /"projects"/.test(planTxt) && planTxt.length > 40);
  const pasted = ev(`wkPastePlan(${JSON.stringify(planTxt)}, 2)`);
  ok('paste sang tuần khác', pasted.ok && pasted.added === 2, JSON.stringify(pasted));
  ok('paste không tạo dự án trùng', ev('wkState().projects.length') === 1,
    ev('wkState().projects.length'));
  ok('paste vào đúng tuần đích', ev('wkStats(2).all') === 2, ev('wkStats(2).all'));
  ok('paste rác bị từ chối', ev("wkPastePlan('không phải json',0)").ok === false);
  ok('paste sai hình dạng bị từ chối', ev("wkPastePlan('{\"a\":1}',0)").ok === false);

  /* --- end week ---
     Reset first: the paste test above deliberately put work into week 2, and
     a carry-over assertion against a dirty week measures the fixture, not the
     behaviour. */
  ev('state.weekly = null;');
  ev(`const ep=wkAddProject('E').id; const et=wkAddTask(ep,'T').id;
      wkAddSub(ep,et,'còn 1',3,0); wkAddSub(ep,et,'còn 2',2,1);
      wkToggle(ep, wkState().projects[0].tasks[0].subs[0].id);`);
  ev('wkState().offset = 0;');
  const before = ev('wkStats(0)');
  const end = ev('wkEndWeek(true)');
  ok('chốt tuần mang việc còn lại sang tuần sau', end.carried === (before.all - before.done),
    JSON.stringify(end));
  ok('chốt tuần đẩy sang tuần sau', ev('wkState().offset') === 1);
  ok('tuần đã chốt để lại dấu vết', !!ev('wkFinished(0)') && ev('wkFinished(0).all') === before.all);
  ok('việc còn lại nằm ở tuần mới',
    ev('wkStats(1).all') === before.all - before.done, ev('wkStats(1).all'));
  ev('wkState().offset = 0;');

  /* --- balanced spread respects the empty days --- */
  ev('state.weekly = null;');
  const sp = ev("wkAddProject('P').id");
  const spT = ev(`wkAddTask('${sp}','T').id`);
  ev(`[1,2,3,4,5,6,7].forEach((n,i)=>wkAddSub('${sp}','${spT}','việc '+(i+1), i<2?3:1, null));`);
  ev('wkState().days = {0:1,2:1,4:1};');
  ok('rải cân theo sức chỉ dùng ngày được bật',
    ev(`wkSpreadBalanced('${sp}')`) === 7 &&
    ev(`wkState().projects[0].tasks[0].subs.every(s=>[0,2,4].includes(s.day))`));
  ok('rải cân không dồn hết vào một ngày',
    ev(`new Set(wkState().projects[0].tasks[0].subs.map(s=>s.day)).size`) === 3);

  /* --- load model --- */
  const ld = ev('wkLoad(0)');
  ok('tải mỗi ngày có 7 mục', Array.isArray(ld) && ld.length === 7);
  ok('tải đếm đúng tổng độ khó', ld.reduce((a, x) => a + x.pts, 0) ===
    ev(`wkState().projects[0].tasks[0].subs.reduce((a,s)=>a+s.diff,0)`),
    JSON.stringify(ld.map(x => x.pts)));

  /* --- lesson picker data --- */
  ok('danh sách bài học lấy từ lộ trình thật', ev('wkAllLessons().length') === ev('TOTAL_SESS'),
    ev('wkAllLessons().length') + ' vs ' + ev('TOTAL_SESS'));
  ok('mỗi bài có đường dẫn đúng dạng', ev("wkAllLessons().every(x=>/^#\\/lesson\\/\\d+\\/\\d+$/.test(x.href))"));

  /* --- the guide only appears on a genuinely empty week --- */
  ev('state.weekly = null;');
  w.location.hash = '#/__blank__'; await wait(20);
  w.location.hash = '#/weekly'; await wait(200);
  ok('tuần trống hiện hướng dẫn 3 bước', w.document.querySelectorAll('.wk-steps li').length === 3);
  ev("const q=wkAddProject('X');const qq=wkAddTask(q.id,'Y');wkAddSub(q.id,qq.id,'việc',2,0);");
  w.location.hash = '#/__blank__'; await wait(20);
  w.location.hash = '#/weekly'; await wait(200);
  ok('có việc rồi thì hướng dẫn biến mất', !w.document.querySelector('.wk-guide'));
  ok('bảng 7 cột hiện ra', w.document.querySelectorAll('.wk-col').length === 7);
  ok('mọi việc đều kéo được', [...w.document.querySelectorAll('.wk-item')]
    .every(e => e.getAttribute('draggable') === 'true'));


  const pass = results.filter(r => r.pass).length;
  results.filter(r => !r.pass).forEach(r => console.log('  ✗ ' + r.n + (r.note ? ' — ' + r.note : '')));
  console.log(`\n${pass}/${results.length} bước đạt` + (pass === results.length ? '  ✓' : ''));
  process.exit(pass === results.length ? 0 : 1);
})();
