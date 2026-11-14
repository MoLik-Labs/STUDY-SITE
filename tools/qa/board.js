/* Đóng vai học sinh — kiểm bảng mạch: công thức, kéo thả, sửa tại chỗ. */
(async () => {
  const P = ms => new Promise(r => setTimeout(r, ms));
  const R = [];
  const errs = [];
  window.addEventListener('error', e => errs.push(e.message));
  const ok = (n, cond, note) => R.push({ n, pass: !!cond, note: note === undefined ? '' : String(note) });

  const go = async h => { location.hash = h; await P(750); };
  const setF = async v => {
    const i = document.querySelector('#bdF');
    i.value = v;
    i.dispatchEvent(new Event('input', { bubbles: true }));
    await P(320);
  };
  const kpi = () => {
    const b = document.querySelectorAll('.bd-kpi b');
    return [...b].map(x => x.textContent.replace(/[A-Za-zÀ-ỹΩ]+/g, '').trim());
  };
  const ev = (t, x, y) => new PointerEvent(t, { clientX: x, clientY: y, bubbles: true, pointerId: 1, pointerType: 'mouse', isPrimary: true });
  const dragTo = async (el, pt) => {
    const r = el.getBoundingClientRect();
    const s = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    el.dispatchEvent(ev('pointerdown', s.x, s.y));
    await P(50);
    for (let k = 1; k <= 6; k++) {
      window.dispatchEvent(ev('pointermove', s.x + (pt.x - s.x) * k / 6, s.y + (pt.y - s.y) * k / 6));
      await P(35);
    }
    window.dispatchEvent(ev('pointerup', pt.x, pt.y));
    await P(380);
  };
  const leafPt = (i) => {
    const g = document.querySelectorAll('[data-leaf]')[i];
    const r = g.getBoundingClientRect();
    return { el: g, x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };
  const svgPt = (x, y) => {
    const svg = document.querySelector('#bdCanvas svg');
    const ctm = svg.getScreenCTM();
    const p = svg.createSVGPoint(); p.x = x; p.y = y;
    const q = p.matrixTransform(ctm);
    return { x: q.x, y: q.y };
  };

  /* 1 · mở trang */
  await go('#/build');
  const ov = document.querySelector('.overlay'); if (ov && !ov.classList.contains('keys-ov')) ov.remove();
  ok('01 mở bảng mạch', !!document.querySelector('#bdCanvas svg') && document.querySelectorAll('[data-leaf]').length >= 2,
    document.querySelectorAll('[data-leaf]').length + ' linh kiện');

  /* 2 · gõ công thức là ra hình */
  await setF('R1 // R2 nt R3');
  ok('02 công thức → hình', document.querySelectorAll('[data-leaf]').length === 3 && kpi()[0] === '15', 'R_tđ = ' + kpi()[0] + ' Ω');

  /* 3 · ưu tiên toán tử: // trước nt */
  await setF('R1 nt R2 // R3');
  ok('03 // chặt hơn nt', document.querySelector('#bdRead').textContent.includes('(R2 // R3)'), document.querySelector('#bdRead').textContent.slice(0, 44));

  /* 4 · ngoặc đổi kết quả */
  await setF('(R1 nt R2) // R3');
  ok('04 ngoặc đổi kết quả', Math.abs(parseFloat(kpi()[0].replace(',', '.')) - 6.67) < 0.02, kpi()[0] + ' Ω');

  /* 5 · U và r viết ngay trong công thức */
  await setF('U=9 r=0.5 R1 nt R2');
  ok('05 U, r trong công thức', document.querySelector('#bdU').value === '9' && Math.abs(parseFloat(kpi()[1].replace(',', '.')) - 0.43) < 0.02,
    'U=' + document.querySelector('#bdU').value + ' · I=' + kpi()[1]);

  /* 6 · công thức sai thì báo lỗi, hình cũ giữ nguyên */
  const before = document.querySelectorAll('[data-leaf]').length;
  await setF('R1 // (R2 nt');
  ok('06 báo lỗi công thức', document.querySelector('#bdErr').textContent.length > 3 && document.querySelectorAll('[data-leaf]').length === before,
    document.querySelector('#bdErr').textContent.slice(0, 40));

  /* 7 · kéo điện trở từ hộp linh kiện xuống nhánh */
  await setF('R1 nt R2');
  const before7 = document.querySelectorAll('[data-leaf]').length;
  const rg = cirGeo.rungs[0];
  await dragTo(document.querySelector('.bd-tool[data-tool="R"]'), svgPt(rg.x + rg.w + 8, rg.y + rg.h / 2));
  ok('07 kéo thả thêm linh kiện', document.querySelectorAll('[data-leaf]').length === before7 + 1, document.querySelector('#bdF').value);

  /* 8 · kéo vôn kế lên điện trở = mắc song song */
  await setF('R1 nt R2');
  const p8 = leafPt(0);
  await dragTo(document.querySelector('.bd-tool[data-tool="V"]'), { x: p8.x, y: p8.y });
  ok('08 vôn kế song song', document.querySelector('#bdF').value === 'R1 nt R2' && document.querySelectorAll('path[stroke-dasharray="3 3"]').length === 1,
    document.querySelector('#bdF').value);

  /* 9 · bấm linh kiện → sửa giá trị ngay trên hình */
  await setF('R1 nt R2');
  const p9 = leafPt(0);
  p9.el.dispatchEvent(ev('pointerdown', p9.x, p9.y)); await P(40);
  window.dispatchEvent(ev('pointerup', p9.x, p9.y)); await P(320);
  const vn = document.querySelector('#bdVn');
  ok('09 bảng sửa tại chỗ', !!vn && document.querySelector('.bd-pop-h b').textContent === 'R1', vn ? 'có ô nhập' : 'không mở');
  if (vn) { vn.value = '30'; vn.dispatchEvent(new Event('input', { bubbles: true })); await P(300); }
  ok('10 sửa giá trị → tính lại', kpi()[0] === '40', 'R_tđ = ' + kpi()[0] + ' Ω');

  /* 11 · đổi loại linh kiện */
  const kb = document.querySelectorAll('.bd-kinds button')[3];
  if (kb) { kb.click(); await P(300); }
  ok('11 đổi thành ampe kế', /A1/.test(document.querySelector('#bdF').value), document.querySelector('#bdF').value);

  /* 12 · công tắc mở → mạch hở */
  await setF('R1 nt K1');
  const pk = leafPt(1);
  pk.el.dispatchEvent(ev('pointerdown', pk.x, pk.y)); await P(40);
  window.dispatchEvent(ev('pointerup', pk.x, pk.y)); await P(320);
  const sw = document.querySelector('#bdSw');
  if (sw) { sw.click(); await P(350); }
  ok('12 công tắc mở → mạch hở', document.querySelector('#bdNotes').textContent.includes('Mạch hở'), document.querySelector('#bdNotes').textContent.trim().slice(0, 36));

  /* 13 · hoàn tác */
  document.querySelector('#bdUndo').click(); await P(300);
  ok('13 hoàn tác', !document.querySelector('#bdNotes').textContent.includes('Mạch hở'), 'đã trả lại');

  /* 14 · xoá bằng thùng rác khi kéo */
  await setF('R1 nt R2');
  const n14 = document.querySelectorAll('[data-leaf]').length;
  const p14 = leafPt(1);
  const board = document.querySelector('#bdBoard').getBoundingClientRect();
  await dragTo(p14.el, { x: board.right - 60, y: board.bottom - 26 });
  ok('14 kéo vào thùng rác', document.querySelectorAll('[data-leaf]').length === n14 - 1, document.querySelector('#bdF').value);

  /* 15 · ghi được xuống kho lưu (kiểm tra tải lại làm ở bước riêng) */
  await setF('(R1 // R2) nt R3');
  save();
  await P(250);
  let dump = '';
  try { dump = JSON.stringify(AppStore.readSync().data || {}); } catch (e) { dump = localStorage.getItem('vnl9.v2') || ''; }
  ok('15 ghi xuống kho lưu', dump.includes('R1') && dump.indexOf('cir') >= 0, 'có khoá cir');

  /* 16 · tải hình SVG */
  let dl = 0;
  const origCreate = URL.createObjectURL;
  URL.createObjectURL = function () { dl++; return 'blob:x'; };
  const origClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () { dl++; };
  document.querySelector('#bdSvgt').click();
  await P(200);
  URL.createObjectURL = origCreate;
  HTMLAnchorElement.prototype.click = origClick;
  ok('16 tải hình SVG', dl >= 2, dl + ' lời gọi');

  /* 17 · không lỗi JS */
  ok('17 không lỗi JS', errs.length === 0, errs.slice(0, 2).join(' · '));

  return { rounds: R, pass: R.filter(r => r.pass).length, total: R.length, errors: errs.slice(0, 4) };
})()
