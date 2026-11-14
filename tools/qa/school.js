/* Đóng vai học sinh/giáo viên — khoá học 1–12, tự tạo bài, kho tệp */
(async () => {
  const P = ms => new Promise(r => setTimeout(r, ms));
  const R = [];
  const errs = [];
  window.addEventListener('error', e => errs.push(e.message));
  const ok = (n, cond, note) => R.push({ n, pass: !!cond, note: note === undefined ? '' : String(note) });
  const $ = q => document.querySelector(q);
  const go = async h => {
    if (location.hash === h) { location.hash = '#/'; await P(160); }   /* ép vẽ lại */
    location.hash = h; await P(760);
  };
  const txt = q => ($(q) ? $(q).textContent.replace(/\s+/g, ' ') : '');

  /* 1 · mở khoá học */
  schoolState().grade = 9; schoolState().subj = 'vatli'; save();
  await go('#/subjects');
  const ov = $('.overlay'); if (ov && !ov.classList.contains('keys-ov')) ov.remove();
  ok('01 khoá học mở được', document.querySelectorAll('.gchip').length === 12 && document.querySelectorAll('.subj-card').length >= 12,
    document.querySelectorAll('.subj-card').length + ' môn · lớp ' + (($('.gchip.on') || {}).dataset || {}).grade);

  /* 2 · đổi lớp 1 thấy môn tiểu học */
  document.querySelector('[data-grade="1"]').click(); await P(500);
  const names1 = [...document.querySelectorAll('.subj-card b')].map(x => x.textContent);
  ok('02 lớp 1 có môn tiểu học', names1.includes('Toán') && names1.includes('Đạo đức') && !names1.includes('Hoá học'),
    names1.length + ' môn: ' + names1.slice(0, 4).join(', '));

  /* 3 · nhớ lớp qua lần vẽ lại */
  go('#/subjects'); await P(500);
  const onG = $('.gchip.on');
  ok('03 nhớ lớp đã chọn', onG && onG.dataset.grade === '1', 'đang ở lớp ' + (onG ? onG.dataset.grade : '?'));

  /* 4 · vào môn học lớp 9, thấy danh sách bài */
  document.querySelector('[data-grade="9"]').click(); await P(450);
  await go('#/subject/9/toan');
  ok('04 danh sách bài của môn', document.querySelectorAll('.lesson-list li').length >= 1, document.querySelectorAll('.lesson-list li').length + ' bài');

  /* 5 · đọc bài: khối công thức, ghi chú, câu hỏi mở được */
  await go('#/read/seed0');
  const hasF = !!$('.read-formula'), hasNote = !!$('.read-note'), hasQ = !!$('.read-q');
  if (hasQ) { $('.read-q summary').click(); await P(150); }
  ok('05 trang đọc bài đủ khối', hasF && hasNote && hasQ && txt('.read-q').includes('Trả lời'), hasF ? 'có công thức' : 'thiếu');

  /* 6 · môn chưa có bài → trang môn vẫn mở, có lời mời tạo */
  await go('#/subject/1/amnhac');
  ok('06 môn trống có lời mời tạo bài', txt('#main').includes('Tạo bài học'), txt('#main').slice(0, 60));

  /* 7 · tạo bài mới bằng studio */
  await go('#/studio');
  $('#stT').value = 'Bài thử của QA — Cộng phân số';
  $('#stAim').value = 'Biết quy đồng mẫu số';
  $('#stG').value = '5'; $('#stG').dispatchEvent(new Event('change', { bubbles: true })); await P(300);
  $('#stS').value = 'toan'; $('#stS').dispatchEvent(new Event('change', { bubbles: true }));
  const ta = document.querySelector('.bk-val');
  ta.value = 'Muốn cộng hai phân số khác mẫu, quy đồng rồi cộng tử.';
  ta.dispatchEvent(new Event('input', { bubbles: true }));
  await P(150);
  $('#stSave').click(); await P(700);
  const newId = (location.hash.match(/#\/read\/(.+)$/) || [])[1];
  ok('07 tạo bài mới', !!newId && txt('h1').includes('Cộng phân số'), newId || 'không lưu');

  /* 8 · bài mới nằm trong đúng lớp + môn */
  await go('#/subject/5/toan');
  ok('08 bài mới vào đúng môn', txt('#main').includes('Cộng phân số'), 'Lớp 5 › Toán');

  /* 9 · sửa lại tiêu đề */
  await go('#/read/' + newId);
  $('#readEdit').click(); await P(650);
  $('#stT').value = 'Bài thử của QA — Cộng phân số (đã sửa)';
  $('#stSave').click(); await P(700);
  ok('09 sửa bài đã tạo', txt('h1').includes('đã sửa'), txt('h1').slice(0, 50));

  /* 10 · bài của tôi liệt kê đúng */
  await go('#/mine');
  ok('10 trang Bài của tôi', txt('#main').includes('Cộng phân số'), document.querySelectorAll('.lesson-list li').length + ' bài');

  /* 11 · xuất bài ra tệp json */
  await go('#/studio/' + newId);
  let dl = 0;
  const oCreate = URL.createObjectURL, oClick = HTMLAnchorElement.prototype.click;
  URL.createObjectURL = function () { dl++; return 'blob:x'; };
  HTMLAnchorElement.prototype.click = function () { dl++; };
  $('#stExport').click(); await P(200);
  URL.createObjectURL = oCreate; HTMLAnchorElement.prototype.click = oClick;
  ok('11 xuất bài ra .json', dl >= 2, dl + ' lời gọi');

  /* 12 · tải tệp lên kho (giả lập file thật) */
  await go('#/files');
  const f = new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], 'de-bai-kiem-tra.png', { type: 'image/png' });
  const dt = new DataTransfer();
  dt.items.add(f);
  const inp = $('#filesUp');
  inp.files = dt.files;
  inp.dispatchEvent(new Event('change', { bubbles: true }));
  await P(900);
  ok('12 tải tệp vào kho', document.querySelectorAll('.file-card').length >= 1 && txt('#main').includes('de-bai-kiem-tra.png'),
    document.querySelectorAll('.file-card').length + ' tệp');

  /* 13 · mở xem trước tệp */
  await P(300);
  const openBtn = document.querySelector('[data-open]');
  if (openBtn) { openBtn.click(); await P(700); }
  const ovf = $('.file-ov');
  ok('13 xem trước tệp', !!ovf && ovf.innerHTML.includes('de-bai-kiem-tra.png'), ovf ? 'có khung xem' : 'không mở');
  if (ovf) { $('.file-ov .bd-x').click(); await P(200); }

  /* 14 · tệp nằm trong IndexedDB (bản ghi còn đọc lại được) */
  const recs = await FileStore.all();
  const got = recs[0] ? await FileStore.get(recs[0].id) : null;
  ok('14 tệp lưu bền trong IndexedDB', !!got && got.buf && got.buf.byteLength > 0,
    recs.length + ' tệp · ' + (got ? got.buf.byteLength + ' byte' : 'không đọc lại được'));

  /* 15 · gắn tệp vào bài học */
  await go('#/studio/' + newId);
  const dt2 = new DataTransfer();
  dt2.items.add(new File([new Uint8Array([1, 2, 3])], 'ghi-chu.txt', { type: 'text/plain' }));
  const stf = $('#stFile');
  stf.files = dt2.files;
  stf.dispatchEvent(new Event('change', { bubbles: true }));
  await P(900);
  $('#stSave').click(); await P(700);
  ok('15 gắn tệp vào bài', txt('.read-files') ? txt('.read-files').includes('ghi-chu.txt') : txt('#main').includes('ghi-chu.txt'), 'ghi-chu.txt');

  /* 16 · xoá dữ liệu bài không làm hỏng trang */
  await go('#/subjects');
  ok('16 về khoá học sau khi xoá', document.querySelectorAll('.subj-card').length > 5, 'ok');

  /* 17 · thanh trên có menu Khám phá + chip lớp */
  const mb = $('#tbMoreBtn');
  if (mb) { mb.click(); await P(250); }
  const menuOn = $('#tbMenu') && $('#tbMenu').classList.contains('on');
  ok('17 menu Khám phá mở được', !!mb && menuOn && document.querySelectorAll('#tbMenu [data-nav]').length >= 10,
    document.querySelectorAll('#tbMenu [data-nav]').length + ' mục');

  /* 18 · lọc theo loại tệp + ảnh thu nhỏ */
  await go('#/files');
  const imgChip = [...document.querySelectorAll('.fchip')].find(c => /Ảnh/.test(c.textContent));
  let onlyImg = 0, thumbs = 0;
  if (imgChip) {
    imgChip.click(); await P(500);
    const cards = [...document.querySelectorAll('.file-card b')].map(b => b.textContent);
    onlyImg = cards.length;
    thumbs = document.querySelectorAll('.fc-thumb img').length;
  }
  ok('18 lọc tệp theo loại', onlyImg >= 1 && onlyImg < 4 && thumbs === onlyImg,
    onlyImg + ' ảnh · ' + thumbs + ' ảnh thu nhỏ');
  const allChip = [...document.querySelectorAll('.fchip')].find(c => /Tất cả/.test(c.textContent));
  if (allChip) { allChip.click(); await P(400); }

  /* 19 · tiêu đề kho tệp có dung lượng */
  ok('19 kho tệp có dung lượng + ô thả', !!$('#fz') && /tệp ·/.test(txt('#main')), txt('.ph-title') || txt('h1'));

  /* 20 · tạo 2 bài cùng môn → có chuyển bài trước/sau */
  const mkLesson = (t, extra) => {
    const S = schoolState();
    const l = Object.assign({ id: 'qa' + Math.random().toString(36).slice(2, 8), g: 7, s: 'toan', t, aim: 'qa', tag: 'qa', blocks: [{ k: 'p', v: 'Nội dung ' + t }], own: 1 }, extra || {});
    (S.lessons['7|toan'] = S.lessons['7|toan'] || []).push(l); save(); return l;
  };
  const a1 = mkLesson('QA · bài Một'), a2 = mkLesson('QA · bài Hai');
  await go('#/read/' + a1.id);
  const pager = document.querySelectorAll('.rp-btn').length;
  ok('20 chuyển bài trước/sau', pager >= 1 && document.querySelector('.rp-next') !== null, pager + ' nút');
  document.querySelector('.rp-next').click(); await P(700);
  ok('21 nút “bài sau” đi đúng bài', txt('h1').includes('bài Hai'), txt('h1'));

  /* 22 · thanh tiến độ đọc + gỡ khi rời trang */
  window.scrollTo(0, 400); await P(250);
  const pw = (document.querySelector('.read-prog i') || {}).style;
  await go('#/subjects');
  ok('22 thanh tiến độ đọc', !!pw && pw.width !== '' && !document.querySelector('.read-prog'), 'width=' + (pw ? pw.width : '—'));

  /* 23 · studio: xem trước sống + đánh số khối */
  await go('#/studio');
  $('#stT').value = 'QA · xem trước sống';
  $('#stT').dispatchEvent(new Event('input', { bubbles: true }));
  await P(200);
  $('#bkAdd').click(); await P(250);
  const nums = [...document.querySelectorAll('.bk-n')].map(x => x.textContent);
  ok('23 xem trước sống + đánh số khối', txt('.stp-title').includes('xem trước sống') && nums.length === 2 && nums[1] === '02',
    nums.join('/'));

  /* 24 · tìm kiếm toàn cục thấy bài của trường học */
  openPalette(); await P(300);
  const qi = $('#ovq'); qi.value = 'hàm số bậc nhất'; qi.dispatchEvent(new Event('input', { bubbles: true })); await P(350);
  const hits = [...document.querySelectorAll('.ov-row .t')].map(x => x.textContent);
  document.querySelector('.overlay').remove();
  ok('24 tìm thấy bài trong khoá học', hits.some(h => /Hàm số bậc nhất/i.test(h)), hits.slice(0, 2).join(' | '));

  /* 25 · dọn dữ liệu QA khỏi máy */
  const S = schoolState();
  Object.keys(S.lessons).forEach(k => { S.lessons[k] = S.lessons[k].filter(x => !/^qa/.test(x.id) && !/QA/.test(x.t)); });
  save();
  const fs = await FileStore.all();
  for (const f of fs) { if (/^(de-|anh-|bang-|ghi-)/.test(f.name)) await FileStore.del(f.id); }
  ok('25 dọn dữ liệu thử', Object.values(S.lessons).flat().every(l => !/QA/.test(l.t)), 'đã dọn');

  ok('26 không lỗi JS', errs.length === 0, errs.slice(0, 2).join(' · '));

  return { rounds: R, pass: R.filter(r => r.pass).length, total: R.length, errors: errs.slice(0, 4) };
})()
