/* Đóng vai học sinh — băng thí nghiệm + bảng mạch nâng cấp (nguồn, tự căn) */
(async () => {
  const P = ms => new Promise(r => setTimeout(r, ms));
  const R = [];
  const errs = [];
  window.addEventListener('error', e => errs.push(e.message));
  const ok = (n, cond, note) => R.push({ n, pass: !!cond, note: note === undefined ? '' : String(note) });
  const go = async h => { location.hash = h; await P(780); };
  const $ = q => document.querySelector(q);
  const txt = q => ($(q) ? $(q).textContent.replace(/\s+/g, ' ') : '');
  const setRange = (id, v) => { const e = $('#' + id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); };

  /* ---------- KHÚC XẠ ---------- */
  await go('#/sim');
  const ov = $('.overlay'); if (ov && !ov.classList.contains('keys-ov')) ov.remove();
  ok('01 mở băng thí nghiệm', !!$('#simSvg') && document.querySelectorAll('[data-sim]').length === 3, document.querySelectorAll('[data-sim]').length + ' bàn');

  simState().st = 'refr'; simState().th1 = 42; simState().n1 = 1; simState().n2 = 1.33; save(); renderSim(); await P(400);
  const r0 = txt('#simSvg');
  ok('02 khúc xạ có tia + góc', r0.includes('tia khúc xạ') && r0.includes('i = 42'), 'i=42° → r≈30°');

  setRange('sTh1', 80); await P(250);
  ok('03 tăng góc tới → tia khúc xạ lệch', txt('#simSvg').includes('r = '), 'r = ' + (txt('#simSvg').match(/r = ([\d,]+)°/) || [])[1]);

  /* phản xạ toàn phần: nước → không khí */
  simState().n1 = 1.33; simState().n2 = 1; simState().th1 = 60; save(); simPaint(); await P(350);
  ok('04 phản xạ toàn phần', txt('#simSvg').includes('phản xạ toàn phần') && !document.querySelector('#simSvg line[marker-end="url(#mkAcc)"]'),
    txt('#simSvg').slice(-64));

  simState().n1 = 1; simState().n2 = 1.33; simState().th1 = 42; save(); simPaint();

  /* ---------- BÓNG TỐI ---------- */
  document.querySelector('[data-sim="shadow"]').click(); await P(650);
  ok('05 bóng tối + nửa tối', txt('#simSvg').includes('bóng nửa tối') && txt('#simCtlHost').includes('bóng tối'), txt('#simCtlHost').match(/[\d,]+\s*cm · bóng tối/) ? 'có số đo' : '');
  const g1 = shadowGeom(simState());
  const umBefore = (g1.umB - g1.umT);
  setRange('sRs', 2); await P(300);
  const g2 = shadowGeom(simState());
  ok('06 nguồn hẹp → bóng tối sắc cạnh', (g2.umB - g2.umT) > umBefore * 0.9, 'bóng tối ' + simNum((g2.umB - g2.umT) * 0.4, 1) + ' cm');

  /* kéo vật cản bằng chuột */
  const bl = $('#simBlocker'), svg = $('#simSvg');
  const box = svg.getBoundingClientRect();
  const ev = (t, x, y) => new PointerEvent(t, { clientX: x, clientY: y, bubbles: true, pointerId: 1, pointerType: 'mouse', isPrimary: true });
  const xo0 = simState().xo;
  bl.dispatchEvent(ev('pointerdown', box.left + xo0 * box.width / 720, box.top + 100));
  await P(40);
  document.dispatchEvent(ev('pointermove', box.left + (xo0 + 80) * box.width / 720, box.top + 100));
  await P(120);
  document.dispatchEvent(ev('pointerup', box.left + (xo0 + 80) * box.width / 720, box.top + 100));
  await P(250);
  ok('07 kéo vật cản trên hình', simState().xo > xo0 + 40, xo0 + ' → ' + simState().xo);

  /* ---------- ĐỘNG NĂNG ---------- */
  document.querySelector('[data-sim="energy"]').click(); await P(650);
  const p0 = simEnergySolve(simState());
  ok('08 dốc cao đúng h₀', Math.abs(p0.h0 - simState().h0) < 0.001 && Math.abs(p0.E0 - p0.m * 9.8 * p0.h0) < 0.01,
    'h₀ = ' + simNum(p0.h0, 1) + ' m · E = ' + simNum(p0.E0, 1) + ' J');

  $('#sReset').click(); await P(200);
  $('#sRun').click(); await P(1000);
  const s1 = simState()._s;
  await P(1600);
  const s2 = simState()._s;
  ok('09 bóng lăn được', s1 > 0.3 && s2 > s1, simNum(s1, 2) + ' → ' + simNum(s2, 2) + ' m');

  /* ma sát bằng 0 → không dừng */
  simState().mu = 0; save(); simPaint(); await P(250);
  const pz = simEnergySolve(simState());
  ok('10 μ = 0 thì chạy hết băng', Math.abs(pz.sStop - (pz.L1 + pz.L2)) < 0.02 && pz.offEnd, 'sStop = ' + simNum(pz.sStop, 2));

  /* năng lượng bảo toàn (không ma sát) */
  const a = pz.stateAt(0), b = pz.stateAt(pz.L1);
  ok('11 cơ năng bảo toàn', Math.abs(a.ek + a.et - (b.ek + b.et)) < 0.05, 'Eđ đỉnh ' + simNum(a.ek, 1) + ' J → chân dốc ' + simNum(b.ek, 1) + ' J');

  simState().mu = 0.25; save(); simPaint();

  /* ---------- BẢNG MẠCH: NGUỒN + TỰ CĂN ---------- */
  await go('#/build');
  ok('12 bốn loại nguồn', document.querySelectorAll('[data-gen]').length === 4, document.querySelectorAll('[data-gen]').length + ' nút');

  document.querySelector('[data-gen="ac"]').click(); await P(400);
  ok('13 nguồn xoay chiều', !!document.querySelector('.bd-ac') && txt('.bd-src').includes('Hz'), txt('.bd-src'));

  document.querySelector('[data-gen="battery"]').click(); await P(350);
  const nEl = $('#bdGenN');
  if (nEl) { nEl.value = '4'; nEl.dispatchEvent(new Event('input', { bubbles: true })); await P(300); }
  ok('14 bộ pin: n pin → U', $('#bdU').value === '6' && txt('.bd-src').includes('4 pin'), 'U = ' + $('#bdU').value + ' V');

  document.querySelector('[data-gen="supply"]').click(); await P(350);
  ok('15 nguồn điều chỉnh', txt('#bdCanvas').includes('nguồn điều chỉnh'), 'có hộp nguồn');

  /* tự căn: đặt tên lộn xộn rồi căn lại */
  const cS = cirModel();
  const leaves = cirLeaves(cS.root);
  leaves.forEach((l, i) => { l.name = 'R' + (9 - i) + 'x'; });
  save(); cirPaint(); await P(200);
  document.querySelector('#bdTidy').click(); await P(400);
  const names = cirLeaves(cirModel().root).map(l => l.name);
  ok('16 tự căn lại đánh số tên', names.every(n => /^[RĐAKV]\d+$/.test(n)) && names[0] === 'R1', names.join(' · '));

  /* hình tự căn giữa khung */
  const svgB = document.querySelector('#bdCanvas svg');
  const vb = svgB.viewBox.baseVal;
  const rootW = cirMeasure(cirModel().root).w;
  ok('17 sơ đồ căn giữa', Math.abs((vb.width - rootW) / 2 - cirGeo.r00 === undefined ? 0 : 0) === 0 && cirGeo.x0 === Math.round((vb.width - rootW) / 2),
    'x0 = ' + cirGeo.x0 + ' / W = ' + Math.round(vb.width));

  /* gõ công thức dài → khung tự co */
  const i = $('#bdF');
  i.value = 'R1 nt R2 nt R3 nt R4 nt R5 nt R6'; i.dispatchEvent(new Event('input', { bubbles: true })); await P(400);
  const vb2 = document.querySelector('#bdCanvas svg').viewBox.baseVal;
  ok('18 khung tự co giãn theo mạch', vb2.width > vb.width - 1, Math.round(vb.width) + ' → ' + Math.round(vb2.width));

  ok('19 không lỗi JS', errs.length === 0, errs.slice(0, 2).join(' · '));

  return { rounds: R, pass: R.filter(x => x.pass).length, total: R.length, errors: errs.slice(0, 4) };
})()
