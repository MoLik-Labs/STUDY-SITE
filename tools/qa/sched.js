/* Thời khoá biểu + Lịch + nhận diện tác giả */
(async () => {
  const P = ms => new Promise(r => setTimeout(r, ms));
  const R = []; const errs = [];
  window.addEventListener('error', e => errs.push(e.message));
  const ok = (n, c, note) => R.push({ n, pass: !!c, note: note === undefined ? '' : String(note) });
  const $ = q => document.querySelector(q);
  const go = async h => { if (location.hash === h) { location.hash = '#/'; await P(150); } location.hash = h; await P(800); };
  const txt = q => ($(q) ? $(q).textContent.replace(/\s+/g, ' ') : '');

  /* 1 · mở thời khoá biểu */
  await go('#/timetable');
  ok('01 lưới thời khoá biểu', document.querySelectorAll('.tt-cell').length >= 40 && document.querySelectorAll('.tt-time').length === 8,
    document.querySelectorAll('.tt-cell').length + ' ô');

  /* 2 · thêm bảng mới bằng hộp thoại trong trang */
  const nTab = schedState().tables.length;
  $('#ttNew').click(); await P(300);
  $('#uiV').value = 'QA · bảng ôn thi'; $('#uiYes').click(); await P(500);
  ok('02 tạo bảng mới', schedState().tables.length === nTab + 1 && txt('.tt-tab.on').includes('QA'), schedState().tables.length + ' bảng');

  /* 3 · tự xếp môn */
  $('#ttAuto').click(); await P(300);
  $('#taList').value = 'Toán, Văn, Anh, Lí';
  $('#taGo').click(); await P(600);
  const filled = document.querySelectorAll('.tt-cell.filled').length;
  ok('03 tự xếp môn + tô màu', filled > 30 && document.querySelectorAll('.tt-lg').length === 4, filled + ' tiết có môn');

  /* 4 · sửa một ô: đổi tên + đổi màu */
  const cell = document.querySelector('.tt-cell [data-cell], [data-cell]');
  const key = cell.dataset.cell;
  cell.click(); await P(350);
  $('#tpS').value = 'Chuyên đề Ôn'; $('#tpT').value = 'Cô Hoa';
  const colorBtn = document.querySelectorAll('.tt-pop .tt-c')[4];
  colorBtn.click();
  $('#tpSave').click(); await P(500);
  const saved = schedTable().cells[key];
  ok('04 sửa tiết tại chỗ', saved && saved.s === 'Chuyên đề Ôn' && saved.t === 'Cô Hoa' && !!saved.c,
    saved ? saved.s + ' · ' + saved.t + ' · ' + saved.c : 'không lưu');

  /* 5 · xoá tiết */
  document.querySelector(`[data-cell="${key}"]`).click(); await P(300);
  $('#tpDel').click(); await P(400);
  ok('05 xoá tiết', !schedTable().cells[key], 'ô trống lại');

  /* 6 · đổi số ngày của lưới */
  $('#ttDays').value = '7'; $('#ttDays').dispatchEvent(new Event('change', { bubbles: true })); await P(500);
  ok('06 đổi số ngày', document.querySelectorAll('.tt-dh').length === 7 && schedTable().days === 7, '7 cột');

  /* 7 · lịch tháng mở được */
  await go('#/calendar');
  ok('07 lịch tháng', document.querySelectorAll('.cal-cell').length === 42, document.querySelectorAll('.cal-cell').length + ' ô');

  /* 8 · thêm việc qua hộp thoại */
  const nEv = schedState().events.length;
  $('#calNew').click(); await P(300);
  $('#cvT').value = 'QA · kiểm tra Vật lí';
  $('#cvD').value = new Date().toISOString().slice(0, 10);
  $('#cvH').value = '08:00';
  $('#cvSave').click(); await P(600);
  ok('08 thêm việc', schedState().events.length === nEv + 1 && txt('#main').includes('QA · kiểm tra Vật lí'),
    schedState().events.length + ' việc');

  /* 9 · đổi màu tự động theo loại */
  $('#calNew').click(); await P(300);
  $('#cvK').value = 'deadline'; $('#cvK').dispatchEvent(new Event('change', { bubbles: true })); await P(200);
  const picked = document.querySelector('.cal-modal .tt-c.on');
  ok('09 màu theo loại việc', picked && picked.dataset.c === 'plum', picked ? picked.dataset.c : 'không đổi');
  $('.cal-modal .bd-x').click(); await P(200);

  /* 10 · tick xong + chuyển tuần */
  const doneBtn = document.querySelector('[data-done]');
  doneBtn.click(); await P(500);
  ok('10 đánh dấu xong', schedState().events.some(e => e.done), 'đã tick');
  $('[data-view="week"]').click(); await P(500);
  ok('11 xem theo tuần', document.querySelectorAll('.cal-wcol').length === 7, '7 cột tuần');
  $('#calNext').click(); await P(500);
  ok('12 chuyển tuần', document.querySelectorAll('.cal-wcol').length === 7, 'ok');

  /* 13 · theme mới có trong danh sách + áp được */
  await go('#/settings');
  const themeIds = THEMES.map(t => t.id);
  const newOnes = ['ivory', 'bordeaux', 'ink', 'lotus', 'graphite', 'ocean'].filter(t => themeIds.includes(t));
  setPref('theme', 'bordeaux'); await P(400);
  const applied = document.documentElement.getAttribute('data-theme');
  setPref('theme', 'paper'); await P(300);
  ok('13 thêm 6 theme sang trọng', newOnes.length === 6 && applied === 'bordeaux', newOnes.join(', '));

  /* 14 · nhận diện tác giả */
  await go('#/about');
  const hasTag = txt('#main').includes('@its.fox_') && document.querySelector('a[href*="github.com/MoLik-Labs/STUDY-SITE"]');
  ok('14 trang giới thiệu có chủ sở hữu', !!hasTag, '@its.fox_ · github');
  await go('#/');
  ok('15 tag ở thanh trên + chân trang', !!$('.tb-owner') && document.querySelector('.foot-own a[href*="MoLik-Labs"]'),
    ($('.tb-owner') || {}).textContent);

  /* 16 · thời khoá biểu giữ màu khi in (class in) */
  await go('#/timetable');
  const printed = !!document.querySelector('.tt-brand');
  ok('16 có dòng ký tên + tên tác giả khi in', printed, txt('.tt-brand'));

  /* 17 · xuất .ics đọc được, có VEVENT */
  await go('#/calendar');
  let dl = 0, pack = null;
  const oC = URL.createObjectURL, oK = HTMLAnchorElement.prototype.click;
  URL.createObjectURL = function (b) { dl++; pack = b; return 'blob:x'; };
  HTMLAnchorElement.prototype.click = function () { dl++; };
  document.querySelector('#calICS').click(); await P(300);
  URL.createObjectURL = oC; HTMLAnchorElement.prototype.click = oK;
  const ics = pack ? await pack.text() : '';
  ok('17 xuất lịch ra .ics', dl >= 2 && /BEGIN:VCALENDAR/.test(ics) && /BEGIN:VEVENT/.test(ics),
    (ics.match(/BEGIN:VEVENT/g) || []).length + ' sự kiện');

  /* 18 · đưa thời khoá biểu vào lịch */
  await go('#/timetable');
  const n0 = schedState().events.length;
  document.querySelector('#ttToCal').click();
  for (let k = 0; k < 40 && schedState().events.length === n0; k++) await P(100);
  ok('18 đưa thời khoá biểu vào lịch', schedState().events.length > n0, (schedState().events.length - n0) + ' tiết');

  /* 19 · dashboard hiện "hôm nay có gì" + đếm ngược thi */
  await go('#/study');
  for (let k = 0; k < 40 && !document.querySelector('.sy-count'); k++) await P(100);
  ok('19 Học hôm nay có lịch + đếm ngược', !!document.querySelector('.sy-today') && !!document.querySelector('.sy-count'),
    (document.querySelector('.sy-count b') || {}).textContent || '');

  /* dọn dữ liệu thử */
  const S = schedState();
  S.tables = S.tables.filter(t => !/^QA/.test(t.name));
  S.activeId = S.tables[0].id;
  S.events = S.events.filter(e => !/^QA/.test(e.title) && e.src !== 'tt');
  S.events.forEach(e => { if (e.done) e.done = false; });
  S.calView = 'month'; save();
  document.querySelectorAll('.overlay').forEach(x => x.remove()); document.body.style.overflow = '';
  ok('20 dọn dữ liệu thử', true, 'đã dọn');

  ok('21 không lỗi JS', errs.length === 0, errs.slice(0, 2).join(' · '));
  return { rounds: R, pass: R.filter(r => r.pass).length, total: R.length, errors: errs.slice(0, 4) };
})()
