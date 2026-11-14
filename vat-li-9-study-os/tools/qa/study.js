/* Đóng vai học sinh: Study OS — thẻ, luyện đề, kế hoạch, tập trung */
(async () => {
  const P = ms => new Promise(r => setTimeout(r, ms));
  const R = [];
  const errs = [];
  window.addEventListener('error', e => errs.push(e.message));
  const ok = (n, c, note) => R.push({ n, pass: !!c, note: note === undefined ? '' : String(note) });
  const $ = q => document.querySelector(q);
  const go = async h => { if (location.hash === h) { location.hash = '#/'; await P(150); } location.hash = h; await P(750); };
  const txt = q => ($(q) ? $(q).textContent.replace(/\s+/g, ' ') : '');

  /* 1 · Học hôm nay mở được, có 4 việc + heatmap */
  await go('#/study');
  ok('01 Học hôm nay', document.querySelectorAll('.sy-task').length === 4 && document.querySelectorAll('.sy-cell').length >= 84,
    document.querySelectorAll('.sy-cell').length + ' ô nhịp học');

  /* 2 · tạo thẻ thủ công */
  const before = studyState().cards.length;
  syAddCard({ front: 'QA: Định luật Ôm phát biểu thế nào?', back: 'I = U/R', g: 9, s: 'vatli' });
  await go('#/study');
  ok('02 thêm thẻ', studyState().cards.length === before + 1, studyState().cards.length + ' thẻ');

  /* 3 · tạo thẻ từ bài học */
  await go('#/cards');
  $('#cdFromLesson').click(); await P(500);
  ok('03 tạo thẻ từ bài học', studyState().cards.length > before + 1, studyState().cards.length + ' thẻ · ' + (syNextLesson()||{}).t);

  /* 4 · ôn: hiện đáp án rồi chấm */
  const dueN = syDue().length;
  await go('#/cards');
  const rv = $('#cdReview');
  if (rv && !rv.disabled) rv.click();
  await P(500);
  const hasCard = !!$('.cd-card');
  $('#cdShow').click(); await P(200);
  const ansShown = !!$('.cd-a');
  $('.cd-g.g2').click(); await P(250);
  ok('04 ôn thẻ chấm điểm', hasCard && ansShown && (studyState().cards.some(c => c.reps > 0)),
    dueN + ' thẻ đến hạn · chấm “Được”');

  /* 5 · thẻ vừa chấm bị dời hạn ra sau */
  const moved = studyState().cards.filter(c => c.reps && c.due > Date.now() + 3600e3).length;
  ok('05 giãn hạn sau khi ôn', moved >= 1, moved + ' thẻ đã giãn');

  /* 6 · luyện đề: đủ bước chọn → câu hỏi → đáp án → chấm */
  await go('#/practice');
  const qCount = syLessonQuestions().length;
  $('#prN').value = '5'; $('#prN').dispatchEvent(new Event('change', { bubbles: true })); await P(500);
  const st = $('#prStart');
  if (st) st.click();
  await P(450);
  const started = !!$('.pr-card');
  $('#prShow').click(); await P(200);
  const ans2 = !!$('.cd-a');
  $('[data-ok="1"]').click(); await P(250);
  ok('06 luyện đề tự tạo', qCount > 20 && started && ans2, qCount + ' câu trong kho');

  /* 7 · làm hết 5 câu → có kết quả lưu lịch sử */
  for (let i = 0; i < 6; i++) {
    const s = $('#prShow');
    if (s) { s.click(); await P(150); }
    const b = $('[data-ok]');
    if (b) { b.click(); await P(180); }
    if ($('.cd-done')) break;
  }
  const res = studyState().results.slice(-1)[0];
  ok('07 lưu kết quả đề', !!res && res.total === 5, res ? res.right + '/' + res.total : 'không lưu');

  /* 8 · kế hoạch: dựng từ bài học */
  await go('#/plan');
  $('#plName').value = 'QA · ôn thi giữa kì';
  $('#plDate').value = new Date(Date.now() + 10 * 864e5).toISOString().slice(0, 10);
  $('#plBuild').click(); await P(600);
  const plan = studyState().plan;
  ok('08 dựng kế hoạch', !!plan && plan.days.length >= 5 && plan.totalCount > 0,
    plan ? plan.days.length + ' ngày · ' + plan.totalCount + ' mục' : 'không tạo');

  /* 9 · đánh dấu xong một mục */
  await P(200);
  const chk = $('[data-pk]');
  if (chk) chk.click();
  await P(500);
  ok('09 tick xong một mục', studyState().plan.doneCount >= 1, 'đã xong ' + (studyState().plan || {}).doneCount + ' mục');

  /* 10 · đồng hồ tập trung chạy và đếm ngược */
  await go('#/focus');
  $('[data-mode="15"]').click(); await P(400);
  $('#fcStart').click(); await P(500);
  const t1 = txt('#fcTime');
  await P(1500);
  const t2 = txt('#fcTime');
  const running = studyState().focus.running;
  $('#fcStart').click(); await P(300);
  ok('10 đồng hồ đếm ngược', running && t1 !== t2, t1 + ' → ' + t2);

  /* 11 · ghi thủ công vào nhật ký, chuỗi ngày > 0 */
  $('#fcLog').click(); await P(350);
  const uiIn = $('#uiV');
  if (uiIn) { uiIn.value = '30'; $('#uiYes').click(); }
  await P(400);
  ok('11 nhật ký phút học', syMinutesOn(syDayKey()) >= 30 && syStreak() >= 1, syMinutesOn(syDayKey()) + ' phút · chuỗi ' + syStreak());

  /* 12 · ghi chú + giảng lại trong bài đọc */
  await go('#/read/seed0');
  $('#syNote').value = 'QA ghi chú: đồ thị hàm bậc nhất là đường thẳng.';
  $('#syNote').dispatchEvent(new Event('input', { bubbles: true }));
  $('#syEx').value = 'QA giảng lại bằng lời của em.';
  $('#syEx').dispatchEvent(new Event('input', { bubbles: true }));
  await P(900);
  ok('12 ghi chú + Feynman', (studyState().notes.seed0 || '').includes('đường thẳng') &&
    (studyState().notes['seed0#explain'] || '').includes('giảng lại'), 'đã lưu');

  /* 13 · ghi chú hiện lại ở Học hôm nay */
  await go('#/study');
  ok('13 ghi chú hiện ở dashboard', txt('#main').includes('đồ thị hàm bậc nhất là đường thẳng'), 'ok');

  /* 14 · đọc thành tiếng bật/tắt không lỗi */
  await go('#/read/seed0');
  $('#syRead').click(); await P(400);
  const label1 = txt('#syRead');
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  ok('14 nút đọc thành tiếng', label1 === 'Dừng đọc' || label1 === 'Đọc thành tiếng', label1);

  /* 15 · chuỗi ngày + heatmap có dữ liệu hôm nay */
  const heat = syHeat();
  const todayCell = heat.find(c => c.k === syDayKey());
  ok('15 heatmap ghi nhận hôm nay', !!todayCell && todayCell.n > 0, 'ô hôm nay = ' + (todayCell ? todayCell.lv : '?'));

  /* 16 · kế hoạch nhắc trên Học hôm nay */
  await go('#/study');
  ok('16 dashboard nhắc kế hoạch', txt('#main').includes('Kế hoạch đang chạy') && !txt('#main').includes('Chưa có kế hoạch'), 'ok');

  /* 16b · tiến độ tổng: KPI + gợi ý + biểu đồ */
  await go('#/progress');
  ok('16b tiến độ tổng', document.querySelectorAll('.pg-k').length === 5 && document.querySelectorAll('.pg-adv').length >= 2
    && document.querySelectorAll('.pg-bcol').length === 7, document.querySelectorAll('.pg-adv').length + ' gợi ý');

  /* 16c · sao lưu dữ liệu học ra tệp */
  let dl = 0;
  const oCreate = URL.createObjectURL, oClick = HTMLAnchorElement.prototype.click;
  URL.createObjectURL = function () { dl++; return 'blob:x'; };
  HTMLAnchorElement.prototype.click = function () { dl++; };
  document.querySelector('#pgExport').click();
  URL.createObjectURL = oCreate; HTMLAnchorElement.prototype.click = oClick;
  ok('16c sao lưu ra tệp', dl >= 2, dl + ' lời gọi');

  /* 16d · phím tắt thẻ không rò sang trang khác */
  await go('#/cards');
  document.querySelector('#cdReview').click(); await P(500);
  await go('#/study');
  const before2 = studyState().cards.filter(c => c.reps).length;
  document.dispatchEvent(new KeyboardEvent('keydown', { key: '3', bubbles: true }));
  await P(200);
  ok('16d phím tắt được gỡ khi rời trang', studyState().cards.filter(c => c.reps).length === before2, 'không đổi');

  /* 17 · dọn dữ liệu thử */
  const S = studyState();
  S.cards = S.cards.filter(c => !/QA/.test(c.front));
  S.results = S.results.filter(r => !r.qa);
  S.sessions = S.sessions.filter(s => s.label !== 'Học thủ công');
  delete S.notes.seed0; delete S.notes['seed0#explain'];
  S.plan = null; S.planDone = {};
  save();
  ok('17 dọn dữ liệu thử', true, 'đã dọn');

  ok('18 không lỗi JS', errs.length === 0, errs.slice(0, 2).join(' · '));
  return { rounds: R, pass: R.filter(r => r.pass).length, total: R.length, errors: errs.slice(0, 4) };
})()
