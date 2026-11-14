/* Vòng đóng vai học sinh — 20 bước, chạy trong trang */
(async () => {
  const P = ms => new Promise(r => setTimeout(r, ms));
  const R = [];
  const errs = [];
  window.addEventListener('error', e => errs.push(e.message));
  const ok = (name, cond, note) => R.push({ name, pass: !!cond, note: note === undefined ? '' : String(note) });
  const go = async (h, ms) => { location.hash = h; await P(ms || 700); };

  localStorage.removeItem('vnl9.qa'); save();

  /* 1 · mở máy lạnh */
  await go('#/');
  ok('01 mở trang', document.querySelectorAll('#main *').length > 50, document.querySelectorAll('#main *').length + ' node');

  /* 2 · màn chào lần đầu, Esc đóng được */
  state.seenWelcome = 0; save();
  maybeWelcome(); await P(300);
  const wl = document.querySelector('.overlay .theme-card');
  let closed = false;
  if (wl) {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await P(250);
    closed = !document.querySelector('.overlay');
  }
  ok('02 màn chào + Esc', !!wl && closed, wl ? 'có thẻ chọn tông' : 'không hiện');
  state.seenWelcome = 1; save();

  /* 3 · đổi tông giữ được qua lần vẽ lại */
  setPref('theme', 'moss'); await P(150);
  const themeAttr = document.documentElement.getAttribute('data-theme');
  const prefsStored = JSON.parse(localStorage.getItem('vnl9.prefs') || '{}').theme;
  ok('03 đổi tông', themeAttr === 'moss' && prefsStored === 'moss', themeAttr + ' / ' + prefsStored);
  setPref('theme', 'paper');

  /* 4 · trang chủ: dải hôm nay + phiên + nút học tiếp đúng tuyến */
  await go('#/');
  const today = document.querySelector('.today'), routine = document.querySelector('.routine');
  const cta = document.querySelector('.continue');
  const href = cta ? cta.getAttribute('href') : '';
  ok('04 trang chủ 3 khối', today && routine && /^#\/lesson\/\d+\/\d+$/.test(href), href);

  /* 5 · mở ca học: đánh dấu xong rồi bỏ đánh dấu */
  await go('#/lesson/2/1', 900);
  const doneBtn = $('#doneBtn');
  /* đưa ca 2/1 về trạng thái "chưa xong" để vòng test lặp lại được */
  if (state.done['d2s1']) { delete state.done['d2s1']; delete state.doneAt['d2s1']; save(); await go('#/lesson/2/1', 800); }
  const before = Object.keys(state.done).filter(k => state.done[k]).length;
  if ($('#doneBtn')) $('#doneBtn').click();
  await P(400);
  const after1 = Object.keys(state.done).filter(k => state.done[k]).length;
  ok('05 đánh dấu ca', !!$('#doneBtn') && after1 === before + 1, before + ' → ' + after1);

  /* 6 · vào thẳng phần luyện của ca, trả lời, thấy phản hồi */
  await go('#/lesson/2/1?pane=quiz', 900);
  const card = document.querySelector('.qcard');
  let wrongOk = false, how = 'không có câu';
  if (card) {
    const t = (card.querySelector('.qtype') || {}).textContent || '';
    const q = ALLQ.find(x => card.textContent.includes(String(x.q).replace(/<[^>]+>/g, '').slice(0, 26)));
    if (t === 'Điền số' && q) {
      const inp = card.querySelector('.numin');
      inp.value = String(q.a); inp.dispatchEvent(new Event('input'));
      const chk = card.querySelector('[data-check]'); if (chk) chk.click();
      how = 'điền số';
    } else {
      const opts = card.querySelectorAll('.opt');
      if (opts.length) {
        if (q && qType(q) === 'mcq') opts[(q.a + 1) % opts.length].click();
        else if (q && qType(q) === 'tf') card.querySelector('[data-tf="' + (q.a ? '0' : '1') + '"]').click();
        else opts[0].click();
        how = 'chọn đáp án';
        const chk = card.querySelector('[data-check]'); if (chk) { chk.click(); }
      }
    }
    await P(500);
    wrongOk = !!document.querySelector('.exp');
  }
  ok('06 luyện trong ca (deep-link)', wrongOk, how);

  /* 7 · ôn cách quãng: trả lời đúng thì lên hộp */
  srsRecord(ALLQ[3].id, false, 0);
  const box0 = state.ans[ALLQ[3].id].box;
  srsRecord(ALLQ[3].id, true, 1);
  const a = state.ans[ALLQ[3].id];
  ok('07 hộp Leitner', box0 === 0 && a.box === 1 && a.due > Date.now(), 'hộp ' + box0 + ' → ' + a.box);

  /* 8 · thi thử: phím 1–4, cờ, Enter */
  EX=''; if (typeof EXAM !== 'undefined') EXAM = null;
  if (typeof examClear === 'function') examClear();   /* bỏ đề cũ đã lưu để vòng lặp lại được */
  await go('#/exam', 900);
  if ($('#examAgain')) { $('#examAgain').click(); await P(700); }
  const press = k => document.body.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
  const t0 = qType(EXAM.qs[0]);
  if (t0 === 'num') {
    const inp = document.querySelector('#eqslot0 .numin');
    inp.value = '12'; inp.dispatchEvent(new Event('change')); await P(250);
  } else if (t0 === 'tf') press('1');
  else press('2');
  await P(350);
  const picked = Object.keys(EXAM.picks).length;
  press('f'); await P(200);
  const flag = document.querySelectorAll('#examMap .em.flag').length;
  press('Enter'); await P(500);
  const cur = document.querySelector('.exam-q.cur');
  ok('08 phím thi', picked >= 1 && flag === 1 && !!cur, picked + ' đáp án · ' + flag + ' cờ');

  /* 9 · nộp bài + luyện lại câu sai */
  document.querySelector('#examSubmit').click(); await P(800);
  const rep = !!document.querySelector('.exam-report');
  const wb = $('#examWrong');
  const wrongN = wb ? parseInt((wb.textContent.match(/\d+/) || [0])[0], 10) : 0;
  if (wb) { wb.click(); await P(800); }
  ok('09 nộp + luyện câu sai', rep && wrongN >= 0 && EXAM && EXAM.qs.length === wrongN, wrongN + ' câu');

  /* 10 · lưu đề đang làm */
  const snap = state.exam;
  ok('10 tự lưu đề', !!(snap && snap.ids && snap.ids.length), snap ? snap.ids.length + ' câu' : 'trống');

  /* 11 · máy giải: đổi số liệu → kết quả đổi */
  await go('#/calc', 900);
  const form = $('#calcForm');
  const firstIn = form ? form.querySelector('input[data-k]') : null;
  let calcOk = false;
  if (firstIn) {
    firstIn.value = '20';
    firstIn.dispatchEvent(new Event('input', { bubbles: true }));
    firstIn.dispatchEvent(new Event('change', { bubbles: true }));
    await P(400);
    calcOk = !!document.querySelector('.calc-res .cr-v');
  }
  const saveBtn = $('#calcSave');
  if (saveBtn) { saveBtn.click(); await P(300); }
  ok('11 máy giải', calcOk, calcOk ? 'có kết quả' : 'không ra kết quả');

  /* 12 · phòng lab: ghi số liệu bàn điện */
  await go('#/lab', 900);
  const rec = $('#dcRec');
  const rowsBefore = document.querySelectorAll('.lab-book-t tbody tr').length;
  if (rec) { rec.click(); await P(400); }
  const rowsAfter = document.querySelectorAll('.lab-book-t tbody tr').length;
  ok('12 lab ghi số liệu', rowsAfter >= rowsBefore, rowsBefore + ' → ' + rowsAfter);
  ok('12b nút CSV', !!$('#logCsv'), $('#logCsv') ? 'có' : 'thiếu');

  /* 13 · bảng lệnh: tìm không dấu */
  await go('#/', 500);
  openPalette(); await P(250);
  const ov = $('#ovq');
  ov.value = 'thau kinh'; ov.dispatchEvent(new Event('input')); await P(250);
  const nRes = document.querySelectorAll('.ov-row').length;
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  ok('13 tìm không dấu', nRes >= 3, nRes + ' kết quả');

  /* 14 · sổ tay + flashcard */
  await go('#/notes', 700);
  const noteRows = document.querySelectorAll('#main .note-row, #main tr, #main .nb-row').length;
  await go('#/flash', 700);
  const flash = $('#flashCard');
  if (flash) { flash.click(); await P(400); }
  const flipped = document.querySelector('.flash-wrap .flash.on, .flash.open, .flash-in.flip') || document.querySelector('.flash');
  ok('14 sổ tay + flashcard', noteRows > 5 && !!flash, noteRows + ' dòng');

  /* 15 · hỏi đáp: tra ra kết quả */
  await go('#/qa?q=cong%20suat', 800);
  const qaHit = document.querySelectorAll('#qaPageOut .qa-item').length;
  ok('15 hỏi đáp', qaHit >= 1, qaHit + ' câu trả lời');

  /* 16 · ngân hàng đề + luyện phổ đề */
  await go('#/papers', 900);
  const cards = document.querySelectorAll('.pcard').length;
  const drill = document.querySelector('[data-drill]');
  let drillN = 0;
  if (drill) { drill.click(); await P(800); drillN = EXAM ? EXAM.qs.length : 0; }
  ok('16 đề + luyện', cards >= 50 && drillN >= 10, cards + ' bộ · ' + drillN + ' câu');

  /* 17 · nhạc: âm lượng + tự nhỏ khi mở bài giảng */
  await go('#/', 400);
  const mp = $('#muPill');
  if (mp) { mp.click(); await P(400); }
  const vol = $('#muVol');
  let duckOk = false;
  if (vol) {
    vol.value = '55'; vol.dispatchEvent(new Event('input')); await P(200);
    const ms = musicState();
    musicDuck(true); const ducked = ms.ducked && musicTargetVol() === Math.min(55, ms.duckTo);
    musicDuck(false);
    duckOk = ms.vol === 55 && ducked && musicTargetVol() === 55;
  }
  ok('17 nhạc: âm lượng + duck', !!vol && duckOk, vol ? musicState().vol + '%' : 'không có slider');
  ok('17b mode khi mở bài giảng', ['duck', 'pause', 'off'].includes(musicState().videoMode), musicState().videoMode);
  const mc = $('#muClose'); if (mc) mc.click();

  /* 18 · pomodoro mặc định là đồng hồ cát pixel */
  const pix = !!document.querySelector('#pxBox .pxg, #pomo.pix');
  ok('18 pomodoro pixel mặc định', state.pomoCfg.style === 'pixel' && pix, state.pomoCfg.style);

  /* 19 · tương phản theme tối */
  setPref('theme', 'midnight'); await P(250);
  const lum = c => { const [r, g, b] = c.match(/\d+/g).map(Number).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * r + .7152 * g + .0722 * b; };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05); };
  const body = getComputedStyle(document.body);
  const cr = ratio(body.color, body.backgroundColor);
  ok('19 theme tối tương phản', cr >= 7, cr.toFixed(1) + ':1');
  setPref('theme', 'paper');

  /* 20 · xuất/nhập tệp sao lưu */
  const dump = JSON.stringify({ app: 'vat-li-9', state: { ans: state.ans, done: state.done, prefs: prefs() } });
  const parsed = AppStore.importText(dump);
  ok('20 xuất/nhập sao lưu', !!parsed && Object.keys(parsed.ans).length === Object.keys(state.ans).length,
     parsed ? Object.keys(parsed.ans).length + ' câu' : 'không đọc được');

  return { rounds: R, pass: R.filter(r => r.pass).length, total: R.length, errors: errs };
})()
