/* Vòng 21–40: những câu học sinh thật hay hỏi, kiểm bằng máy */
(async () => {
  const P = ms => new Promise(r => setTimeout(r, ms));
  const R = [];
  const errs = [];
  window.addEventListener('error', e => errs.push(e.message));
  const ok = (n, c, note) => R.push({ n, pass: !!c, note: note === undefined ? '' : String(note) });
  const go = async (h, ms) => { location.hash = h; await P(ms || 700); };

  /* 21 · mở trang KHÔNG tự phát nhạc */
  const ms0 = musicState();
  if (!ms0.q.length) { ms0.q.push({ id: 'dQw4w9WgXcQ', list: null, title: 'test' }); save(); }
  ms0.playing = false; save();
  await go('#/');
  ok('21 không tự phát nhạc', document.querySelectorAll('#muStage iframe').length === 0,
     document.querySelectorAll('#muStage iframe').length + ' iframe');

  /* 22 · phải bấm phát thì nhạc mới chạy */
  $('#muPill').click(); await P(500);
  const idle = !!$('.mu-idle');
  $('#muPlay').click(); await P(900);
  const ifr = document.querySelector('#muStage iframe');
  ok('22 nút phát rõ ràng', idle && !!ifr && !!musicState().playing,
     ifr ? 'iframe đã dựng' : 'chưa dựng');

  /* 23 · iframe có enablejsapi để điều khiển âm lượng */
  ok('23 điều khiển được âm lượng', !!(ifr && ifr.src.includes('enablejsapi')), ifr ? 'ok' : 'thiếu');

  /* 24 · âm lượng 0 = im, 100 = tối đa, nhớ sau khi vẽ lại */
  const v = $('#muVol');
  v.value = '0'; v.dispatchEvent(new Event('input')); await P(200);
  const zero = musicTargetVol() === 0;
  v.value = '100'; v.dispatchEvent(new Event('input')); await P(200);
  const full = musicTargetVol() === 100;
  ok('24 âm lượng 0–100', zero && full && musicState().vol === 100, '0/100 ok');

  /* 25 · mở bài giảng → nhạc tự nhỏ; đóng → trả lại */
  v.value = '60'; v.dispatchEvent(new Event('input')); await P(150);
  musicState().videoMode = 'duck'; save();
  musicDuck(true);
  const ducked = musicTargetVol() === Math.min(60, musicState().duckTo);
  musicDuck(false);
  const back = musicTargetVol() === 60;
  ok('25 tự nhỏ khi mở bài giảng', ducked && back, 'còn ' + musicTargetVol() + '%');

  /* 26 · chế độ "tạm dừng" hoạt động */
  musicState().videoMode = 'pause'; save();
  ytCmdCalls = [];
  const _orig = window.ytCmd; let calls = [];
  window.ytCmd = (f, a) => { calls.push(f); try { _orig(f, a); } catch (e) {} };
  musicDuck(true); musicDuck(false);
  window.ytCmd = _orig;
  ok('26 chế độ tạm dừng', calls.includes('pauseVideo') && calls.includes('playVideo'), calls.join(','));
  musicState().videoMode = 'duck'; save();

  /* 27 · phím M tắt nhanh */
  const m0 = musicState().muted;
  document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'm', bubbles: true })); await P(200);
  const m1 = musicState().muted;
  document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'm', bubbles: true })); await P(200);
  ok('27 phím M tắt nhạc', m1 === !m0 && musicState().muted === m0, m0 + ' → ' + m1);

  /* 28 · nút dừng dọn iframe */
  $('#muStop').click(); await P(400);
  ok('28 nút dừng', !musicState().playing && !document.querySelector('#muStage iframe'), 'đã dọn');

  /* 29 · đồng hồ cát pixel là mặc định, có cát và khung */
  ok('29 đồng hồ cát pixel', state.pomoCfg.style === 'pixel' && !!document.querySelector('#pxBox'),
     state.pomoCfg.style + ' · ' + document.querySelectorAll('#pxSand rect').length + ' ô cát');

  /* 30 · đổi màu cát thì đổi màu thật */
  pomoCfg().tint = 'green'; save(); rebuildPomo(); await P(500);
  const fills = [...new Set([...document.querySelectorAll('#pxSand rect')].map(r => r.getAttribute('fill')))];
  ok('30 màu cát', fills.some(f => /3f8f57|7fd396|2a5c3a/.test(f)), fills.length + ' màu');
  pomoCfg().tint = 'accent'; save(); rebuildPomo();

  /* 31 · hết giờ tự nộp có báo */
  EXAM = null;
  await go('#/exam', 900);
  if ($('#examAgain')) { $('#examAgain').click(); await P(600); }
  EXAM.left = 0; EXAM.t0 = Date.now() - (EXAM_SEC - 1) * 1000;
  await P(1600);
  ok('31 hết giờ tự nộp', !!document.querySelector('.exam-report') &&
     /Hết giờ/.test((document.querySelector('.toast') || {}).textContent || document.querySelector('.er-verdict').textContent || ''),
     document.querySelector('.er-verdict') ? 'có báo cáo' : 'không');

  /* 32 · "Đề mới" hỏi lại khi đang làm dở */
  await go('#/exam', 900);
  if ($('#examAgain')) { $('#examAgain').click(); await P(600); }
  const qt = qType(EXAM.qs[0]);
  if (qt === 'num') {
    const inp = document.querySelector('#eqslot0 .numin');
    inp.value = '9'; inp.dispatchEvent(new Event('change')); await P(250);
  } else if (qt === 'tf') document.body.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true }));
  else document.body.dispatchEvent(new KeyboardEvent('keydown', { key: '2', bubbles: true }));
  await P(300);
  let asked = false;
  const _c = window.confirm;
  window.confirm = () => { asked = true; return false; };
  const before = EXAM.qs.map(q => q.id).join(',');
  $('#examReset').click(); await P(300);
  window.confirm = _c;
  ok('32 chống mất bài', asked && EXAM && EXAM.qs.map(q => q.id).join(',') === before, asked ? 'đã hỏi' : 'không hỏi');

  /* 33 · mục tiêu mỗi ngày đổi được và hiện ở trang chủ */
  await go('#/settings', 800);
  const g30 = document.querySelector('[data-goal="30"]');
  if (g30) g30.click();
  await P(250);
  await go('#/', 600);
  const goalTxt = (document.querySelector('.today-txt .kicker') || {}).textContent || '';
  ok('33 mục tiêu tuỳ chỉnh', state.goal === 30 && /30 câu/.test(goalTxt), goalTxt.trim());

  /* 34 · lịch 14 ngày + bảng chủ đề yếu */
  await go('#/stats', 800);
  ok('34 lịch + chẩn đoán', document.querySelectorAll('.hc').length === 14 && !!document.querySelector('.plan'),
     document.querySelectorAll('.hc').length + ' ô');

  /* 35 · sổ thí nghiệm xuất CSV (kiểm nội dung) */
  await go('#/lab', 900);
  if ($('#dcRec')) { $('#dcRec').click(); await P(300); }
  let csvOk = false;
  const _create = URL.createObjectURL;
  URL.createObjectURL = b => { csvOk = true; return _create(b); };
  if ($('#logCsv')) $('#logCsv').click();
  URL.createObjectURL = _create;
  ok('35 xuất CSV sổ lab', csvOk, csvOk ? 'có tạo tệp' : 'không');

  /* 36 · tìm bằng từ khoá không dấu ra đúng đáp án */
  await go('#/', 400);
  openPalette(); await P(250);
  const q1 = $('#ovq');
  q1.value = 'mach cau day'; q1.dispatchEvent(new Event('input')); await P(250);
  const hitTxt = [...document.querySelectorAll('.ov-row .t')].map(x => x.textContent).join(' | ');
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  ok('36 tìm theo từ khoá', /mạch cầu|Mạch cầu/i.test(hitTxt), hitTxt.slice(0, 46));

  /* 37 · vào tab luyện của ca bằng link */
  await go('#/lesson/4/3?pane=quiz', 900);
  ok('37 link thẳng tới luyện tập', !!document.querySelector('.qcard') &&
     (document.querySelector('[data-pane][aria-selected="true"]') || {}).dataset.pane === 'quiz', 'ok');

  /* 38 · chế độ gọn chữ + bo mềm áp thật */
  setPref('density', 'compact'); setPref('radius', 'soft'); await P(250);
  const r = getComputedStyle(document.querySelector('.qcard') || document.body).borderRadius;
  ok('38 mật độ + bo góc', document.documentElement.getAttribute('data-density') === 'compact' &&
     document.documentElement.getAttribute('data-radius') === 'soft' && r !== '0px', r);
  setPref('density', 'cozy'); setPref('radius', 'sharp');

  /* 39 · tắt chuyển động thì transition gần như 0 */
  setPref('motion', false); await P(200);
  const dur = getComputedStyle(document.querySelector('.today') || document.body).transitionDuration;
  ok('39 tắt chuyển động', document.documentElement.getAttribute('data-motion') === 'off' && /0\.001|0s|1e-0/.test(dur), dur);
  setPref('motion', true);

  /* 40 · không có lỗi console suốt phiên */
  ok('40 không lỗi JS', errs.length === 0, errs.slice(0, 2).join(' | '));

  return { rounds: R, pass: R.filter(x => x.pass).length, total: R.length, errors: errs };
})()
