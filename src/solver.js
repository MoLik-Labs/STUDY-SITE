/* =========================================================
   SOLVER ENGINE
   Pure calculators (no network, no AI) + auto diagram drawing.
   Code in English. All user-facing strings in Vietnamese.
   ========================================================= */

/* ---------- number helpers ---------- */
const f2 = (x, d = 2) => {
  if (!isFinite(x)) return '—';
  let s = (+x).toFixed(d);
  s = s.replace(/\.?0+$/, '');
  if (s === '' || s === '-0') s = '0';
  return s.replace('.', ',');
};
const f3 = x => f2(x, 3);
const ok = v => isFinite(v) && v !== null && v !== undefined;
const sub = n => String(n).replace(/1/g, '₁').replace(/2/g, '₂').replace(/3/g, '₃');

/* ---------- categories & icon set ---------- */
const CATS = [
  { id: 'el', name: 'Điện học', note: 'Mạch điện, công suất, tiền điện' },
  { id: 'quang', name: 'Quang hình', note: 'Thấu kính, dựng ảnh' },
  { id: 'co', name: 'Cơ học', note: 'Chuyển động, lực, công' },
  { id: 'nhiet', name: 'Nhiệt học', note: 'Nhiệt lượng, cân bằng nhiệt' },
  { id: 'tu', name: 'Điện từ', note: 'Máy biến áp, hao phí, lực từ' }
];

const ICO = {
  circ: '<svg viewBox="0 0 40 24"><path d="M2 12h7M31 12h7" stroke="currentColor" stroke-width="1.4" fill="none"/><rect x="9" y="8" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.2"/><rect x="23" y="8" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M19 8v8" stroke="currentColor" stroke-width="1.2"/></svg>',
  lens: '<svg viewBox="0 0 40 24"><path d="M20 2c4 4 4 16 0 20-4-4-4-16 0-20Z" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M2 12h36" stroke="currentColor" stroke-width=".8" stroke-dasharray="2 2"/><circle cx="28" cy="12" r="1.2" fill="currentColor"/></svg>',
  move: '<svg viewBox="0 0 40 24"><path d="M3 18h34" stroke="currentColor" stroke-width="1"/><circle cx="8" cy="11" r="2" fill="currentColor"/><path d="M13 11h13M22 7l5 4-5 4" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>',
  heat: '<svg viewBox="0 0 40 24"><rect x="17" y="2" width="6" height="20" rx="3" fill="none" stroke="currentColor" stroke-width="1.3"/><rect x="19" y="12" width="2" height="8" fill="currentColor"/><path d="M28 6v12M32 9v6" stroke="currentColor" stroke-width="1.1"/></svg>',
  coil: '<svg viewBox="0 0 40 24"><path d="M6 18c0-8 6-8 6 0s6 8 6 0 6-8 6 0 6 8 6 0" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M2 6h36" stroke="currentColor" stroke-width=".8"/></svg>',
  drag: '<svg viewBox="0 0 24 24"><path d="M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>'
};

/* =========================================================
   DRAWING — circuit (600 × 250 canvas)
   ========================================================= */
function svgCircuit(topology, v, r) {
  const P = [];
  const wire = (x1, y1, x2, y2) => P.push(`<path d="M${x1} ${y1}L${x2} ${y2}" stroke="var(--ink)" stroke-width="1.5" fill="none"/>`);
  const res = (x, y, w, h, label, val) => {
    P.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.5"/>`);
    P.push(`<text x="${x + w / 2}" y="${y - 7}" text-anchor="middle" font-family="var(--mono)" font-size="10" fill="var(--ink-2)">${label}</text>`);
    P.push(`<text x="${x + w / 2}" y="${y + h + 14}" text-anchor="middle" font-family="var(--mono)" font-size="10" fill="var(--accent)">${val}</text>`);
  };
  const battery = (x, y) => {
    P.push(`<rect x="${x - 14}" y="${y - 17}" width="28" height="34" fill="var(--paper)"/>`);
    P.push(`<path d="M${x - 10} ${y - 13}v26M${x + 10} ${y - 8}v16" stroke="var(--ink)" stroke-width="1.8"/>`);
    const uShown = (typeof v.U === 'number' && isFinite(v.U)) ? v.U
      : ((typeof v.E === 'number' && isFinite(v.E)) ? v.E : null);
    if (uShown !== null) {
      P.push(`<text x="${x + 20}" y="${y + 4}" font-family="var(--mono)" font-size="10" fill="var(--ink-2)">${typeof v.E === 'number' && v.U === undefined ? 'E' : 'U'} = ${uShown} V</text>`);
    }
    if (+v.r > 0) P.push(`<text x="${x}" y="${y - 22}" text-anchor="middle" font-family="var(--mono)" font-size="9" fill="var(--ink-3)">r = ${v.r} Ω</text>`);
  };
  const flow = (x, y) => P.push(`<path d="M${x} ${y}l-8 -4v8z" fill="var(--accent)"/>`);
  const top = 55, bot = 205, left = 110, right = 470, midY = (top + bot) / 2;
  const W = 100, H = 26;

  if (topology === 'ser') {
    /* Một số dạng bài (ví dụ "đèn sáng bình thường") dùng tên trường riêng
       (E, Ud, Pd) chứ không phải R1/R2/R3. Trước đây hình vẽ in thẳng
       `U = ${v.U} V` nên hiện ra "U = undefined V" — đúng loại lỗi làm người
       học mất tin vào lời giải. Chỉ vẽ nhãn khi thật sự có số. */
    const num = x => (typeof x === 'number' && isFinite(x)) ? x : null;
    const n = +v.R3 > 0 ? 3 : 2, lbl = ['R₁', 'R₂', 'R₃'], val = [v.R1, v.R2, v.R3];
    wire(left, top, right, top); wire(left, bot, right, bot);
    wire(left, top, left, bot); wire(right, top, right, bot);
    battery(left, midY);
    const gap = (right - left - n * W) / (n + 1);
    for (let i = 0; i < n; i++) {
      const x = left + gap + i * (W + gap);
      const rv = num(val[i]);
      res(x, top - H / 2, W, H, lbl[i], rv === null ? '' : rv + ' Ω');
    }
    flow(320, bot - 5);
    P.push(`<text x="300" y="${bot - 9}" font-family="var(--mono)" font-size="9" fill="var(--accent)">I</text>`);
  }
  if (topology === 'par') {
    const n = +v.R3 > 0 ? 3 : 2, lbl = ['R₁', 'R₂', 'R₃'], val = [v.R1, v.R2, v.R3];
    const ys = n === 3 ? [top - 5, midY + 5, bot + 5] : [top, bot];
    wire(left, top - 20, right, top - 20);
    wire(left, bot + 20, right, bot + 20);
    wire(left, top - 20, left, bot + 20); wire(right, top - 20, right, bot + 20);
    battery(left, midY);
    ys.forEach((y, i) => {
      wire(left, y, midY - W / 2, y);
      res(midY - W / 2, y - H / 2, W, H, lbl[i], val[i] + ' Ω');
      wire(midY + W / 2, y, right, y);
    });
  }
  if (topology === 'mixA') {
    const l2 = 120, r2 = 480;
    wire(l2, top, r2, top); wire(l2, bot, r2, bot);
    wire(l2, top, l2, bot); wire(r2, top, r2, bot);
    battery(l2, midY);
    wire(l2, top, l2 + 20, top);
    res(l2 + 20, top - H / 2, 90, H, 'R₁', v.R1 + ' Ω');
    wire(l2 + 110, top, l2 + 140, top);
    res(l2 + 140, top - H / 2, 90, H, 'R₂', v.R2 + ' Ω');
    wire(l2 + 230, top, r2, top);
    res(l2 + 60, bot - H / 2, 90, H, 'R₃', v.R3 + ' Ω');
    P.push(`<text x="${(l2 + r2) / 2}" y="${bot + 46}" text-anchor="middle" font-family="var(--mono)" font-size="9" fill="var(--ink-3)">R₃ mắc song song với cả nhánh (R₁ nt R₂)</text>`);
  }
  if (topology === 'mixB') {
    const node1 = 290, node2 = 500;
    wire(left, top, right, top); wire(left, bot, right, bot);
    wire(left, top, left, bot); wire(right, top, right, bot);
    battery(left, midY);
    res(left + 20, top - H / 2, 90, H, 'R₁', v.R1 + ' Ω');
    wire(left + 110, top, node1, top);
    wire(node1, top, node1, 140);
    res(node1 + 20, top - H / 2, 100, H, 'R₂', v.R2 + ' Ω');
    wire(node1 + 120, top, node2, top);
    res(node1 + 20, 140 - H / 2, 100, H, 'R₃', v.R3 + ' Ω');
    wire(node1, 140, node1 + 20, 140); wire(node1 + 120, 140, node2, 140);
    wire(node2, top, node2, 140);
    wire(node2, top, right, top);
    P.push(`<text x="${(left + right) / 2}" y="${bot + 40}" text-anchor="middle" font-family="var(--mono)" font-size="9" fill="var(--ink-3)">R₁ nối tiếp với cụm (R₂ // R₃)</text>`);
  }
  return `<svg viewBox="0 0 600 260" class="calc-svg" role="img" aria-label="Sơ đồ mạch điện">${P.join('')}</svg>`;
}

/* =========================================================
   DRAWING — lens (660 × 300)
   ========================================================= */
function svgLens(f, d, h, kind) {
  const Lx = 330, Ay = 165, W = 660, Hh = 300;
  const dp = d * f / (d - f);
  const k = -dp / d, hp = k * h;
  const real = dp > 0;
  const span = Math.max(d, Math.abs(dp), Math.abs(f) * 2, 5) * 1.2;
  const sc = (Lx - 45) / span;
  const sy = 95 / Math.max(h, Math.abs(hp) || 0.001);
  const X = cm => Lx + cm * sc, Y = cm => Ay - cm * sy;
  const out = [];
  out.push(`<path d="M12 ${Ay}H648" stroke="var(--rule-2)" stroke-width="1"/>`);
  const lh = 112;
  if (kind !== 'div') {
    out.push(`<path d="M${Lx} ${Ay - lh}c30 36 30 ${2 * lh - 36} 0 ${2 * lh}" fill="none" stroke="var(--ink)" stroke-width="1.6"/>`);
    out.push(`<path d="M${Lx} ${Ay - lh}c-30 36 -30 ${2 * lh - 36} 0 ${2 * lh}" fill="none" stroke="var(--ink)" stroke-width="1.6"/>`);
  } else {
    out.push(`<path d="M${Lx} ${Ay - lh}c-22 36 -22 ${2 * lh - 36} 0 ${2 * lh}" fill="none" stroke="var(--ink)" stroke-width="1.6"/>`);
    out.push(`<path d="M${Lx} ${Ay - lh}c22 36 22 ${2 * lh - 36} 0 ${2 * lh}" fill="none" stroke="var(--ink)" stroke-width="1.6"/>`);
  }
  [[-Math.abs(f), 'F'], [Math.abs(f), "F'"]].forEach(([fv, lab]) => {
    const x = X(fv);
    if (x > 16 && x < 644) {
      out.push(`<circle cx="${x}" cy="${Ay}" r="3.2" fill="var(--accent)"/>`);
      out.push(`<text x="${x}" y="${Ay + 18}" text-anchor="middle" font-family="var(--mono)" font-size="9" fill="var(--accent)">${lab}</text>`);
    }
  });
  out.push(`<circle cx="${Lx}" cy="${Ay}" r="3" fill="var(--ink)"/><text x="${Lx + 7}" y="${Ay - 9}" font-family="var(--mono)" font-size="9" fill="var(--ink-3)">O</text>`);
  // object
  const bx = X(-d), by = Y(h);
  out.push(`<path d="M${bx} ${Ay}V${by}" stroke="var(--ink)" stroke-width="2.6"/>`);
  out.push(`<path d="M${bx - 5} ${by + 10}l5 -10 5 10z" fill="var(--ink)"/>`);
  out.push(`<text x="${bx}" y="${Ay + 30}" text-anchor="middle" font-family="var(--mono)" font-size="9" fill="var(--ink)">A</text>`);
  out.push(`<text x="${bx - 11}" y="${by + 4}" text-anchor="end" font-family="var(--mono)" font-size="9" fill="var(--ink)">B</text>`);
  // rays
  const far = span * 1.02;
  out.push(`<path d="M${bx} ${by}H${Lx}L${X(far)} ${Y(h - h * far / f)}" fill="none" stroke="var(--green)" stroke-width="1.1" opacity=".85"/>`);
  out.push(`<path d="M${bx} ${by}L${X(far)} ${Y(-h * far / d)}" fill="none" stroke="var(--green)" stroke-width="1.1" opacity=".85"/>`);
  if (!real) {
    out.push(`<path d="M${Lx} ${by}L${X(dp)} ${Y(hp)}" stroke="var(--green)" stroke-width="1" stroke-dasharray="4 4" opacity=".7" fill="none"/>`);
    out.push(`<path d="M${Lx} ${Ay}L${X(dp)} ${Y(hp)}" stroke="var(--green)" stroke-width="1" stroke-dasharray="4 4" opacity=".7" fill="none"/>`);
  }
  // image
  const ix = X(dp), iy = Y(hp);
  if (ix > 8 && ix < 652) {
    out.push(`<path d="M${ix} ${Ay}V${iy}" stroke="var(--accent)" stroke-width="2.2"${real ? '' : ' stroke-dasharray="6 4"'}/>`);
    out.push(`<path d="M${ix - 5} ${iy + (hp > 0 ? 10 : -10)}l5 ${hp > 0 ? -10 : 10} 5 ${hp > 0 ? 10 : -10}z" fill="var(--accent)"/>`);
    out.push(`<text x="${ix}" y="${Ay + 30}" text-anchor="middle" font-family="var(--mono)" font-size="9" fill="var(--accent)">A'</text>`);
    out.push(`<text x="${ix + 9}" y="${iy + 4}" font-family="var(--mono)" font-size="9" fill="var(--accent)">B'</text>`);
  }
  out.push(`<text x="${(bx + Lx) / 2}" y="${Ay + 62}" text-anchor="middle" font-family="var(--mono)" font-size="9" fill="var(--ink-3)">d = ${f2(d)} cm</text>`);
  if (isFinite(dp)) out.push(`<text x="${(Lx + ix) / 2}" y="${Ay + 62}" text-anchor="middle" font-family="var(--mono)" font-size="9" fill="var(--accent)">d' = ${f2(dp)} cm</text>`);
  return `<svg viewBox="0 0 ${W} ${Hh}" class="calc-svg" role="img" aria-label="Dựng ảnh qua thấu kính">${out.join('')}</svg>`;
}

/* ---------- motion diagram ---------- */
function svgMeet(x1, x2, v1, v2, same, t, pos) {
  const W = 660, Ay = 110, left = 40, right = 620;
  const lo = Math.min(x1, x2, pos) - 5, hi = Math.max(x1, x2, pos) + 5;
  const X = m => left + (m - lo) / (hi - lo) * (right - left);
  const out = [];
  out.push(`<path d="M${left} ${Ay}H${right}" stroke="var(--rule-2)" stroke-width="1"/>`);
  [x1, x2, pos].forEach((m, i) => {
    if (!ok(m)) return;
    const x = X(m);
    out.push(`<circle cx="${x}" cy="${Ay}" r="${i === 2 ? 6 : 5}" fill="${i === 2 ? 'var(--accent)' : 'var(--ink)'}"/>`);
    out.push(`<text x="${x}" y="${Ay - 14}" text-anchor="middle" font-family="var(--mono)" font-size="10" fill="${i === 2 ? 'var(--accent)' : 'var(--ink-2)'}">${i === 2 ? 'gặp · ' + f2(m, 1) + ' m' : 'x' + (i + 1) + ' = ' + f2(m, 1) + ' m'}</text>`);
  });
  if (ok(pos)) out.push(`<path d="M${X(pos)} ${Ay + 8}v16" stroke="var(--accent)" stroke-width="1"/>`);
  if (!same) {
    out.push(`<path d="M${X(x1)} ${Ay + 34}h26M${X(x1) + 22} ${Ay + 30}l5 4-5 4" stroke="var(--ink)" stroke-width="1.2" fill="none"/>`);
    out.push(`<path d="M${X(x2)} ${Ay + 34}h-26M${X(x2) - 22} ${Ay + 30}l-5 4 5 4" stroke="var(--ink)" stroke-width="1.2" fill="none"/>`);
  } else {
    out.push(`<path d="M${X(x1)} ${Ay + 34}h34M${X(x1) + 30} ${Ay + 30}l5 4-5 4" stroke="var(--ink)" stroke-width="1.2" fill="none"/>`);
    out.push(`<path d="M${X(x2)} ${Ay + 34}h34M${X(x2) + 30} ${Ay + 30}l5 4-5 4" stroke="var(--ink)" stroke-width="1.2" fill="none"/>`);
  }
  out.push(`<text x="${left}" y="${Ay + 66}" font-family="var(--mono)" font-size="9" fill="var(--ink-3)">v₁ = ${v1} m/s · v₂ = ${v2} m/s · gặp sau ${f2(t, 2)} s</text>`);
  return `<svg viewBox="0 0 ${W} 190" class="calc-svg" role="img" aria-label="Sơ đồ chuyển động">${out.join('')}</svg>`;
}

/* ---------- buoyancy diagram ---------- */
function svgArch(sub, state, P, FA) {
  const out = [];
  const wl = 120, bx = 235, bw = 80, bh = 80;
  out.push(`<rect x="140" y="${wl}" width="370" height="105" fill="var(--card-2)" stroke="var(--rule-2)"/>`);
  out.push(`<path d="M140 ${wl}H510" stroke="var(--accent)" stroke-width="1" stroke-dasharray="4 3"/>`);
  out.push(`<text x="146" y="${wl - 7}" font-family="var(--mono)" font-size="9" fill="var(--accent)">mặt nước</text>`);
  const yTop = wl - bh * (1 - sub);
  out.push(`<rect x="${bx}" y="${yTop}" width="${bw}" height="${bh}" fill="var(--card)" stroke="var(--ink)" stroke-width="1.5"/>`);
  const cx = bx + bw / 2;
  // trọng lực: mũi tên hướng xuống, đặt dưới đáy vật
  out.push(`<path d="M${cx} ${yTop + bh + 8}V${yTop + bh + 46}" stroke="var(--ink)" stroke-width="1.4"/>`);
  out.push(`<path d="M${cx - 5} ${yTop + bh + 40}l5 6 5-6z" fill="var(--ink)"/>`);
  out.push(`<text x="${cx + 10}" y="${yTop + bh + 34}" font-family="var(--mono)" font-size="10" fill="var(--ink)">P${P !== undefined ? ' = ' + f2(P) + ' N' : ''}</text>`);
  // lực đẩy: mũi tên hướng lên, đặt trên đỉnh vật
  out.push(`<path d="M${cx} ${yTop - 8}V${yTop - 46}" stroke="var(--accent)" stroke-width="1.4"/>`);
  out.push(`<path d="M${cx - 5} ${yTop - 40}l5 -6 5 6z" fill="var(--accent)"/>`);
  out.push(`<text x="${cx + 10}" y="${yTop - 30}" font-family="var(--mono)" font-size="10" fill="var(--accent)">F_A${FA !== undefined ? ' = ' + f2(FA) + ' N' : ''}</text>`);
  out.push(`<text x="522" y="${wl + 40}" font-family="var(--mono)" font-size="10" fill="var(--ink-2)">${state}</text>`);
  out.push(`<text x="146" y="${wl + 96}" font-family="var(--mono)" font-size="9" fill="var(--ink-3)">phần chìm ${f2(sub * 100, 0)}% thể tích</text>`);
  return `<svg viewBox="0 0 660 250" class="calc-svg" role="img" aria-label="Sơ đồ lực đẩy Archimedes">${out.join('')}</svg>`;
}

/* =========================================================
   SOLVERS
   ========================================================= */
const S = {};

const push = (arr, h, f, c) => arr.push({ h, f, c });

/* ---------- 1. circuit ---------- */
S.el_circuit = {
  cat: 'el', name: 'Mạch điện: tính I, U, P', tag: 'Nối tiếp · song song · hỗn hợp',
  desc: 'Chọn sơ đồ, nhập số liệu — máy tính điện trở tương đương, dòng qua từng nhánh, công suất và vẽ lại mạch.',
  fields: [
    { k: 'topology', l: 'Sơ đồ mạch', type: 'tiles', opts: [['ser', 'Nối tiếp'], ['par', 'Song song'], ['mixA', '(R₁ nt R₂) // R₃'], ['mixB', 'R₁ nt (R₂ // R₃)']], v: 'ser' },
    { k: 'U', l: 'Hiệu điện thế nguồn', u: 'V', v: 12 },
    { k: 'r', l: 'Điện trở trong (bỏ trống = 0)', u: 'Ω', v: 0 },
    { k: 'R1', l: 'R₁', u: 'Ω', v: 6 },
    { k: 'R2', l: 'R₂', u: 'Ω', v: 6 },
    { k: 'R3', l: 'R₃ (chỉ dùng cho sơ đồ có R₃)', u: 'Ω', v: 6 }
  ],
  run(v) {
    const t = v.topology, r = +v.r || 0;
    const R1 = +v.R1, R2 = +v.R2, R3 = +v.R3;
    const out = [], st = [];
    let Rt, branches = [];
    if (t === 'ser') {
      const R = R3 > 0 ? R1 + R2 + R3 : R1 + R2;
      Rt = R + r;
      const fR = (R3 > 0 ? 'R = R₁ + R₂ + R₃' : 'R = R₁ + R₂') + (r ? ' + r' : '');
      push(st, 'Bước 1 · Điện trở tương đương', fR, `R = ${R3 > 0 ? `${R1} + ${R2} + ${R3}` : `${R1} + ${R2}`}${r ? ` + ${r}` : ''} = ${f2(Rt)} Ω`);
      const I = v.U / Rt;
      push(st, 'Bước 2 · Cường độ dòng điện', 'I = U / R', `I = ${v.U} / ${f2(Rt)} = ${f3(I)} A`);
      branches = [{ k: 'I', l: 'Dòng toàn mạch', v: I, u: 'A' }];
      const list = R3 > 0 ? [R1, R2, R3] : [R1, R2];
      list.forEach((R, i) => {
        const U = I * R;
        out.push({ l: `U${sub(i + 1)}`, v: U, u: 'V' });
        out.push({ l: `P${sub(i + 1)}`, v: I * I * R, u: 'W' });
        branches.push({ k: `U${sub(i + 1)}`, l: `Hiệu điện thế R${sub(i + 1)}`, v: U, u: 'V' });
      });
      if (r) push(st, 'Bước 3 · Độ giảm thế trên nguồn', 'U_nguồn = I·r', `${f3(I)} · ${r} = ${f3(I * r)} V · hiệu suất ${f2(I * (Rt - r) / v.U * 100, 1)}%`);
      out.unshift({ l: 'R tương đương', v: Rt, u: 'Ω' }, { l: 'I toàn mạch', v: I, u: 'A' }, { l: 'Công suất toàn mạch', v: v.U * I, u: 'W' });
      return { out, steps: st, draw: { type: 'circuit', topology: t }, branches };
    }
    if (t === 'par') {
      const list = R3 > 0 ? [R1, R2, R3] : [R1, R2];
      const Rp = 1 / list.reduce((a, R) => a + 1 / R, 0);
      Rt = Rp + r;
      push(st, 'Bước 1 · Điện trở tương đương', list.length === 3 ? '1/R = 1/R₁ + 1/R₂ + 1/R₃' : '1/R = 1/R₁ + 1/R₂', `1/R = ${list.map(R => `1/${R}`).join(' + ')} ⇒ R = ${f2(Rp)} Ω`);
      const I = v.U / Rt;
      const Up = I * Rp;
      push(st, 'Bước 2 · Dòng toàn mạch', 'I = U / (R + r)', `I = ${v.U} / ${f2(Rt)} = ${f3(I)} A`);
      push(st, 'Bước 3 · Hiệu điện thế hai đầu mạch song song', 'U' + '‖' + ' = I·R', `U = ${f3(I)} · ${f2(Rp)} = ${f3(Up)} V`);
      list.forEach((R, i) => {
        out.push({ l: `I${sub(i + 1)}`, v: Up / R, u: 'A' });
        branches.push({ k: `I${sub(i + 1)}`, l: `Dòng qua R${sub(i + 1)}`, v: Up / R, u: 'A' });
      });
      out.unshift({ l: 'R tương đương', v: Rt, u: 'Ω' }, { l: 'I toàn mạch', v: I, u: 'A' }, { l: 'U hai nhánh', v: Up, u: 'V' });
      return { out, steps: st, draw: { type: 'circuit', topology: t }, branches };
    }
    if (t === 'mixA') { // (R1 nt R2) // R3
      const R12 = R1 + R2;
      const Rp = R12 * R3 / (R12 + R3);
      Rt = Rp + r;
      push(st, 'Bước 1 · Nhánh trên mắc nối tiếp', 'R₁₂ = R₁ + R₂', `R₁₂ = ${R1} + ${R2} = ${f2(R12)} Ω`);
      push(st, 'Bước 2 · Hai nhánh song song', 'R = R₁₂·R₃ / (R₁₂ + R₃)', `R = ${f2(R12)}·${R3} / (${f2(R12)} + ${R3}) = ${f2(Rp)} Ω`);
      const I = v.U / Rt, Up = I * Rp;
      push(st, 'Bước 3 · Dòng và hiệu điện thế', 'I = U/R_tđ ; U‖ = I·R', `I = ${f3(I)} A · U‖ = ${f3(Up)} V`);
      const I12 = Up / R12, I3 = Up / R3;
      out.push({ l: 'R tương đương', v: Rt, u: 'Ω' }, { l: 'I toàn mạch', v: I, u: 'A' }, { l: 'U hai nhánh', v: Up, u: 'V' },
        { l: 'I qua R₁ = I qua R₂', v: I12, u: 'A' }, { l: 'I qua R₃', v: I3, u: 'A' },
        { l: 'U₁', v: I12 * R1, u: 'V' }, { l: 'U₂', v: I12 * R2, u: 'V' }, { l: 'P toàn mạch', v: v.U * I, u: 'W' });
      branches = [{ k: 'I₁₂', l: 'Nhánh R₁ nt R₂', v: I12, u: 'A' }, { k: 'I₃', l: 'Nhánh R₃', v: I3, u: 'A' }];
      return { out, steps: st, draw: { type: 'circuit', topology: t }, branches };
    }
    // mixB: R1 nt (R2 // R3)
    const R23 = R2 * R3 / (R2 + R3);
    Rt = R1 + R23 + r;
    push(st, 'Bước 1 · Nhánh song song', 'R₂₃ = R₂·R₃/(R₂+R₃)', `R₂₃ = ${R2}·${R3}/(${R2}+${R3}) = ${f2(R23)} Ω`);
    push(st, 'Bước 2 · Điện trở toàn mạch', 'R = R₁ + R₂₃' + (r ? ' + r' : ''), `R = ${R1} + ${f2(R23)}${r ? ` + ${r}` : ''} = ${f2(Rt)} Ω`);
    const I = v.U / Rt, U23 = I * R23;
    push(st, 'Bước 3 · Dòng và hiệu điện thế', 'I = U/R ; U₂₃ = I·R₂₃', `I = ${f3(I)} A · U₂₃ = ${f3(U23)} V`);
    out.push({ l: 'R tương đương', v: Rt, u: 'Ω' }, { l: 'I toàn mạch', v: I, u: 'A' }, { l: 'U₁', v: I * R1, u: 'V' },
      { l: 'U₂ = U₃', v: U23, u: 'V' }, { l: 'I₂', v: U23 / R2, u: 'A' }, { l: 'I₃', v: U23 / R3, u: 'A' },
      { l: 'P toàn mạch', v: v.U * I, u: 'W' });
    branches = [{ k: 'I', l: 'Dòng chính', v: I, u: 'A' }, { k: 'I₂', l: 'Nhánh R₂', v: U23 / R2, u: 'A' }, { k: 'I₃', l: 'Nhánh R₃', v: U23 / R3, u: 'A' }];
    return { out, steps: st, draw: { type: 'circuit', topology: t }, branches };
  }
};

/* ---------- 2. power + energy ---------- */
S.el_power = {
  cat: 'el', name: 'Công suất · điện năng · nhiệt lượng', tag: 'P = I²R, A = P·t, Q = I²Rt',
  desc: 'Nhập R, I, thời gian — tính công suất, điện năng tiêu thụ và nhiệt lượng toả ra.',
  fields: [{ k: 'R', l: 'Điện trở', u: 'Ω', v: 20 }, { k: 'I', l: 'Cường độ dòng điện', u: 'A', v: 1.5 }, { k: 't', l: 'Thời gian', u: 'phút', v: 30 }],
  run(v) {
    const t = v.t * 60, P = v.I * v.I * v.R, A = P * t, Q = A;
    return {
      out: [{ l: 'Công suất', v: P, u: 'W' }, { l: 'Điện năng A', v: A, u: 'J' }, { l: 'Điện năng', v: A / 3600000, u: 'kWh' }, { l: 'Nhiệt lượng', v: Q, u: 'J' }],
      steps: [
        { h: 'Bước 1 · Công suất', f: 'P = I²·R', c: `P = ${f2(v.I)}² · ${v.R} = ${f2(P)} W` },
        { h: 'Bước 2 · Đổi thời gian', f: 't = phút × 60', c: `t = ${v.t} · 60 = ${f2(t)} s` },
        { h: 'Bước 3 · Điện năng', f: 'A = P·t = U·I·t', c: `A = ${f2(P)} · ${f2(t)} = ${f2(A)} J = ${f3(A / 3600000)} kWh` },
        { h: 'Bước 4 · Nhiệt lượng', f: 'Q = I²Rt', c: `Q = ${f2(Q)} J` }
      ]
    };
  }
};

S.el_cost = {
  cat: 'el', name: 'Tiền điện hằng tháng', tag: 'kWh · đơn giá',
  desc: 'Nhập công suất và số giờ dùng mỗi ngày để ra số kWh và số tiền.',
  fields: [{ k: 'P', l: 'Công suất thiết bị', u: 'W', v: 1000 }, { k: 'h', l: 'Số giờ/ngày', u: 'h', v: 4 }, { k: 'n', l: 'Số ngày', u: 'ngày', v: 30 }, { k: 'price', l: 'Đơn giá', u: 'đ/kWh', v: 3500 }],
  run(v) {
    const kwh = v.P / 1000 * v.h * v.n, money = kwh * v.price;
    return {
      out: [{ l: 'Điện năng', v: kwh, u: 'kWh' }, { l: 'Số tiền', v: money, u: 'đ' }, { l: 'Mỗi ngày', v: v.P / 1000 * v.h * v.price, u: 'đ' }],
      steps: [
        { h: 'Bước 1 · Điện năng mỗi ngày', f: 'A = P·t', c: `A = ${f2(v.P / 1000)} kW · ${v.h} h = ${f3(v.P / 1000 * v.h)} kWh` },
        { h: 'Bước 2 · Cả chu kỳ', f: 'A_tổng = A·n', c: `${f3(v.P / 1000 * v.h)} · ${v.n} = ${f2(kwh)} kWh` },
        { h: 'Bước 3 · Tiền', f: 'T = A · đơn giá', c: `${f2(kwh)} · ${v.price} = ${Math.round(money).toLocaleString('vi-VN')} đ` }
      ]
    };
  }
};

/* ---------- 3. lens ---------- */
S.quang_lens = {
  cat: 'quang', name: 'Thấu kính: ảnh cách bao xa, cao bao nhiêu', tag: 'd′ = df/(d − f)',
  desc: 'Chọn thấu kính, nhập f, d, chiều cao vật — máy dựng ảnh và vẽ hình theo tỉ lệ.',
  fields: [
    { k: 'type', l: 'Loại thấu kính', type: 'tiles', opts: [['conv', 'Hội tụ (f > 0)'], ['div', 'Phân kì (f < 0)']], v: 'conv' },
    { k: 'f', l: 'Tiêu cự |f|', u: 'cm', v: 12 },
    { k: 'd', l: 'Khoảng cách vật – kính d', u: 'cm', v: 30 },
    { k: 'h', l: 'Chiều cao vật', u: 'cm', v: 3 }
  ],
  run(v) {
    const f = v.type === 'div' ? -Math.abs(v.f) : Math.abs(v.f);
    const d = v.d, dp = d * f / (d - f), k = -dp / d, hp = k * v.h;
    const real = dp > 0;
    const st = [], out = [];
    push(st, 'Bước 1 · Công thức thấu kính', '1/f = 1/d + 1/d′', `1/${f2(f)} = 1/${f2(d)} + 1/d′`);
    push(st, 'Bước 2 · Giải ra d′', 'd′ = d·f/(d − f)', `d′ = ${f2(d)}·${f2(f)}/(${f2(d)} − ${f2(f)}) = ${f2(dp)} cm`);
    push(st, 'Bước 3 · Độ phóng đại', '|k| = |d′|/d', `|k| = ${f2(Math.abs(dp))}/${f2(d)} = ${f2(Math.abs(k))}`);
    push(st, 'Bước 4 · Chiều cao ảnh', 'h′ = |k|·h', `h′ = ${f2(Math.abs(k))} · ${f2(v.h)} = ${f2(Math.abs(hp))} cm`);
    push(st, 'Bước 5 · Kết luận', 'Tính chất ảnh', real ? 'Ảnh thật, ngược chiều với vật, hứng được trên màn' : (f > 0 ? 'Ảnh ảo, cùng chiều, lớn hơn vật (vật trong tiêu cự)' : 'Ảnh ảo, cùng chiều, nhỏ hơn vật'));
    out.push({ l: 'd′', v: dp, u: 'cm' }, { l: 'h′', v: Math.abs(hp), u: 'cm' }, { l: 'Độ phóng đại |k|', v: Math.abs(k), u: '×' },
      { l: 'Tính chất', v: real ? 'thật, ngược chiều' : 'ảo, cùng chiều', u: '', text: true });
    return { out, steps: st, draw: { type: 'lens', f, d, h: v.h, kind: v.type }, note: real ? 'Ảnh thật nằm cùng phía bên kia kính so với vật.' : 'Ảnh ảo cùng phía với vật — vẽ bằng nét đứt.' };
  }
};

S.quang_findf = {
  cat: 'quang', name: 'Tìm tiêu cự khi biết vật và ảnh', tag: '1/f = 1/d + 1/d′',
  desc: 'Nhập khoảng cách vật và ảnh (ảnh ảo nhập d′ âm) để ra tiêu cự và độ phóng đại.',
  fields: [{ k: 'd', l: 'd (vật → kính)', u: 'cm', v: 30 }, { k: 'dp', l: "d′ (kính → ảnh, ảo thì nhập số âm)", u: 'cm', v: 20 }, { k: 'h', l: 'Chiều cao vật', u: 'cm', v: 2 }],
  run(v) {
    const f = 1 / (1 / v.d + 1 / v.dp), k = -v.dp / v.d;
    return {
      out: [{ l: 'Tiêu cự f', v: f, u: 'cm' }, { l: 'Loại kính', v: f > 0 ? 'hội tụ' : 'phân kì', u: '', text: true }, { l: '|k|', v: Math.abs(k), u: '×' }, { l: 'h′', v: Math.abs(k * v.h), u: 'cm' }],
      steps: [
        { h: 'Bước 1 · Công thức', f: '1/f = 1/d + 1/d′', c: `1/f = 1/${v.d} + 1/${v.dp}` },
        { h: 'Bước 2 · Tính f', f: 'f = d·d′/(d + d′)', c: `f = ${f2(f)} cm ⇒ ${f > 0 ? 'thấu kính hội tụ' : 'thấu kính phân kì'}` },
        { h: 'Bước 3 · Độ phóng đại', f: '|k| = |d′|/d', c: `|k| = ${f2(Math.abs(k))} ⇒ h′ = ${f2(Math.abs(k * v.h))} cm` }
      ],
      draw: { type: 'lens', f, d: v.d, h: v.h, kind: f > 0 ? 'conv' : 'div' }
    };
  }
};

/* ---------- 4. motion ---------- */
S.co_meet = {
  cat: 'co', name: 'Hai vật chuyển động gặp nhau', tag: 'cùng chiều · ngược chiều',
  desc: 'Nhập vị trí xuất phát và tốc độ — máy tính thời điểm gặp, quãng đường mỗi vật, vẽ trục toạ độ.',
  fields: [
    { k: 'mode', l: 'Chiều chuyển động', type: 'tiles', opts: [['opp', 'Ngược chiều'], ['same', 'Cùng chiều (đuổi nhau)']], v: 'opp' },
    { k: 'x1', l: 'Vị trí vật 1', u: 'm', v: 0 },
    { k: 'x2', l: 'Vị trí vật 2', u: 'm', v: 120 },
    { k: 'v1', l: 'Tốc độ vật 1', u: 'm/s', v: 6 },
    { k: 'v2', l: 'Tốc độ vật 2', u: 'm/s', v: 4 }
  ],
  run(v) {
    const same = v.mode === 'same';
    const rel = same ? Math.abs(v.v2 - v.v1) : v.v1 + v.v2;
    const gap = Math.abs(v.x2 - v.x1);
    const t = rel > 0 ? gap / rel : Infinity;
    const s1 = v.v1 * t, s2 = v.v2 * t;
    const meet = same ? v.x1 + s1 : (v.x1 < v.x2 ? v.x1 + s1 : v.x1 - s1);
    const st = [];
    push(st, 'Bước 1 · Khoảng cách ban đầu', 'Δx = |x₂ − x₁|', `Δx = ${f2(gap)} m`);
    push(st, 'Bước 2 · Tốc độ tương đối', same ? 'v_rel = |v₂ − v₁|' : 'v_rel = v₁ + v₂', `v_rel = ${same ? `|${v.v2} − ${v.v1}|` : `${v.v1} + ${v.v2}`} = ${f2(rel)} m/s`);
    push(st, 'Bước 3 · Thời gian gặp', 't = Δx / v_rel', `t = ${f2(gap)} / ${f2(rel)} = ${f2(t, 2)} s${ok(t) && t > 90 ? ` ≈ ${f2(t / 60, 1)} phút` : ''}`);
    push(st, 'Bước 4 · Chỗ gặp', 'x_gặp = x₁ ± v₁·t', `x_gặp = ${f2(meet, 1)} m · vật 1 đi ${f2(s1, 1)} m, vật 2 đi ${f2(s2, 1)} m`);
    return {
      out: [{ l: 'Thời gian gặp', v: t, u: 's' }, { l: 'Chỗ gặp', v: meet, u: 'm' }, { l: 'Quãng đường vật 1', v: s1, u: 'm' }, { l: 'Quãng đường vật 2', v: s2, u: 'm' }],
      steps: st, draw: { type: 'meet', x1: v.x1, x2: v.x2, v1: v.v1, v2: v.v2, same, t, pos: meet }
    };
  }
};

S.co_avg = {
  cat: 'co', name: 'Tốc độ trung bình nhiều đoạn', tag: 'v_tb = Σs / Σt',
  desc: 'Nhập quãng đường và thời gian của hai đoạn — ra tốc độ trung bình cả hành trình.',
  fields: [{ k: 's1', l: 'Quãng đường 1', u: 'm', v: 300 }, { k: 't1', l: 'Thời gian 1', u: 's', v: 60 }, { k: 's2', l: 'Quãng đường 2', u: 'm', v: 600 }, { k: 't2', l: 'Thời gian 2', u: 's', v: 120 }],
  run(v) {
    const s = v.s1 + v.s2, t = v.t1 + v.t2, avg = s / t;
    return {
      out: [{ l: 'Tổng quãng đường', v: s, u: 'm' }, { l: 'Tổng thời gian', v: t, u: 's' }, { l: 'Tốc độ trung bình', v: avg, u: 'm/s' }, { l: 'Đổi ra', v: avg * 3.6, u: 'km/h' }],
      steps: [
        { h: 'Bước 1 · Cộng quãng đường', f: 's = s₁ + s₂', c: `s = ${v.s1} + ${v.s2} = ${f2(s)} m` },
        { h: 'Bước 2 · Cộng thời gian', f: 't = t₁ + t₂', c: `t = ${v.t1} + ${v.t2} = ${f2(t)} s` },
        { h: 'Bước 3 · Tốc độ trung bình', f: 'v_tb = s/t', c: `v_tb = ${f2(avg, 2)} m/s = ${f2(avg * 3.6, 2)} km/h` }
      ],
      note: 'Tốc độ trung bình không phải trung bình cộng của hai tốc độ.'
    };
  }
};

S.co_work = {
  cat: 'co', name: 'Công và công suất', tag: 'A = F·s·cos α',
  desc: 'Nhập lực, quãng đường, góc hợp và thời gian để ra công, công suất.',
  fields: [{ k: 'F', l: 'Lực kéo', u: 'N', v: 50 }, { k: 's', l: 'Quãng đường', u: 'm', v: 20 }, { k: 'a', l: 'Góc so với phương chuyển động', u: '°', v: 0 }, { k: 't', l: 'Thời gian', u: 's', v: 10 }],
  run(v) {
    const rad = v.a * Math.PI / 180, A = v.F * v.s * Math.cos(rad), P = A / v.t;
    return {
      out: [{ l: 'Công A', v: A, u: 'J' }, { l: 'Công suất P', v: P, u: 'W' }, { l: 'Công suất', v: P / 1000, u: 'kW' }],
      steps: [
        { h: 'Bước 1 · Công', f: 'A = F·s·cos α', c: `A = ${v.F} · ${v.s} · cos ${v.a}° = ${f2(A)} J` },
        { h: 'Bước 2 · Công suất', f: 'P = A/t', c: `P = ${f2(A)} / ${v.t} = ${f2(P)} W` }
      ],
      draw: null
    };
  }
};

S.co_incline = {
  cat: 'co', name: 'Mặt phẳng nghiêng: lực, hiệu suất', tag: 'H = A_ci / A_tp',
  desc: 'Nhập khối lượng, chiều cao, chiều dài dốc và lực kéo thực tế.',
  fields: [{ k: 'm', l: 'Khối lượng', u: 'kg', v: 50 }, { k: 'h', l: 'Chiều cao dốc', u: 'm', v: 1.5 }, { k: 'l', l: 'Chiều dài dốc', u: 'm', v: 6 }, { k: 'F', l: 'Lực kéo thực tế', u: 'N', v: 150 }],
  run(v) {
    const P = 10 * v.m, Ac = P * v.h, At = v.F * v.l, H = At ? Ac / At * 100 : 0, Fms = (At - Ac) / v.l;
    return {
      out: [{ l: 'Trọng lượng', v: P, u: 'N' }, { l: 'Công có ích', v: Ac, u: 'J' }, { l: 'Công toàn phần', v: At, u: 'J' }, { l: 'Hiệu suất', v: H, u: '%' }, { l: 'Lực ma sát', v: Fms, u: 'N' }],
      steps: [
        { h: 'Bước 1 · Trọng lượng', f: 'P = 10m', c: `P = 10 · ${v.m} = ${f2(P)} N` },
        { h: 'Bước 2 · Công có ích', f: 'A_ci = P·h', c: `A_ci = ${f2(P)} · ${v.h} = ${f2(Ac)} J` },
        { h: 'Bước 3 · Công toàn phần', f: 'A_tp = F·l', c: `A_tp = ${v.F} · ${v.l} = ${f2(At)} J` },
        { h: 'Bước 4 · Hiệu suất', f: 'H = A_ci/A_tp', c: `H = ${f2(Ac)}/${f2(At)} = ${f2(H, 1)}%` },
        { h: 'Bước 5 · Lực ma sát', f: 'F_ms = (A_tp − A_ci)/l', c: `F_ms = ${f2(Fms)} N` }
      ]
    };
  }
};

S.co_arch = {
  cat: 'co', name: 'Lực đẩy Archimedes: chìm, nổi, lơ lửng', tag: 'F_A = d_lỏng·V',
  desc: 'Nhập thể tích, trọng lượng riêng của vật và của chất lỏng — máy xét trạng thái và vẽ sơ đồ lực.',
  fields: [{ k: 'V', l: 'Thể tích vật', u: 'cm³', v: 500 }, { k: 'dv', l: 'Trọng lượng riêng của vật', u: 'N/m³', v: 7800 }, { k: 'dl', l: 'Trọng lượng riêng chất lỏng', u: 'N/m³', v: 10000 }],
  run(v) {
    const V = v.V / 1e6, P = v.dv * V, FA = v.dl * V;
    const state = P > FA ? 'vật chìm xuống' : (P < FA ? 'vật nổi' : 'lơ lửng');
    const sub = Math.min(1, v.dv / v.dl);
    const st = [
      { h: 'Bước 1 · Đổi thể tích', f: 'V = cm³ / 10⁶', c: `V = ${v.V} cm³ = ${f3(V)} m³` },
      { h: 'Bước 2 · Trọng lượng', f: 'P = d_vật·V', c: `P = ${v.dv}·${f3(V)} = ${f2(P)} N` },
      { h: 'Bước 3 · Lực đẩy', f: 'F_A = d_lỏng·V', c: `F_A = ${v.dl}·${f3(V)} = ${f2(FA)} N` },
      { h: 'Bước 4 · So sánh', f: 'P với F_A', c: `P ${P > FA ? '>' : P < FA ? '<' : '='} F_A ⇒ ${state}` }
    ];
    if (P < FA) st.push({ h: 'Bước 5 · Phần chìm', f: 'V_chìm = P/d_lỏng', c: `V_chìm = ${f2(P / v.dl * 1e6)} cm³ (${f2(P / FA * 100, 1)}% thể tích)` });
    return {
      out: [{ l: 'Trọng lượng P', v: P, u: 'N' }, { l: 'Lực đẩy F_A', v: FA, u: 'N' }, { l: 'Trạng thái', v: state, u: '', text: true }, { l: 'Lực cần giữ thêm', v: Math.abs(P - FA), u: 'N' }],
      steps: st, draw: { type: 'arch', sub, state, P, FA }
    };
  }
};

S.co_press = {
  cat: 'co', name: 'Áp suất chất rắn và chất lỏng', tag: 'p = F/S · p = d·h',
  desc: 'Tính áp suất do một vật đè lên mặt sàn, hoặc áp suất tại độ sâu h trong chất lỏng.',
  fields: [{ k: 'F', l: 'Áp lực', u: 'N', v: 400 }, { k: 'S', l: 'Diện tích tiếp xúc', u: 'cm²', v: 80 }, { k: 'd', l: 'Trọng lượng riêng chất lỏng', u: 'N/m³', v: 10000 }, { k: 'h', l: 'Độ sâu', u: 'm', v: 0.8 }],
  run(v) {
    const S = v.S / 1e4, p = v.F / S, pl = v.d * v.h;
    return {
      out: [{ l: 'Áp suất rắn p', v: p, u: 'Pa' }, { l: 'Áp suất lỏng tại h', v: pl, u: 'Pa' }, { l: 'Tổng', v: p + pl, u: 'Pa' }],
      steps: [
        { h: 'Bước 1 · Đổi diện tích', f: 'S = cm² / 10⁴', c: `S = ${v.S} cm² = ${f3(S)} m²` },
        { h: 'Bước 2 · Áp suất chất rắn', f: 'p = F/S', c: `p = ${v.F}/${f3(S)} = ${f2(p)} Pa` },
        { h: 'Bước 3 · Áp suất chất lỏng', f: 'p = d·h', c: `p = ${v.d}·${v.h} = ${f2(pl)} Pa` }
      ]
    };
  }
};

/* ---------- 5. heat ---------- */
S.nhiet_q = {
  cat: 'nhiet', name: 'Nhiệt lượng thu vào / toả ra', tag: 'Q = m·c·Δt',
  desc: 'Nhập khối lượng, nhiệt dung riêng và độ tăng nhiệt độ.',
  fields: [{ k: 'm', l: 'Khối lượng', u: 'kg', v: 2 }, { k: 'c', l: 'Nhiệt dung riêng', u: 'J/kg.K', v: 4200 }, { k: 't1', l: 'Nhiệt độ đầu', u: '°C', v: 25 }, { k: 't2', l: 'Nhiệt độ cuối', u: '°C', v: 100 }],
  run(v) {
    const dt = v.t2 - v.t1, Q = v.m * v.c * dt;
    return {
      out: [{ l: 'Δt', v: dt, u: 'K' }, { l: 'Nhiệt lượng |Q|', v: Math.abs(Q), u: 'J' }, { l: 'Đổi ra', v: Math.abs(Q) / 1000, u: 'kJ' }],
      steps: [
        { h: 'Bước 1 · Độ biến thiên nhiệt độ', f: 'Δt = t₂ − t₁', c: `Δt = ${v.t2} − ${v.t1} = ${f2(dt)} K` },
        { h: 'Bước 2 · Nhiệt lượng', f: 'Q = m·c·Δt', c: `Q = ${v.m}·${v.c}·${f2(dt)} = ${f2(Math.abs(Q))} J` },
        { h: 'Bước 3 · Kết luận', f: 'Thu hay toả', c: Q > 0 ? 'Vật thu nhiệt (nóng lên)' : 'Vật toả nhiệt (nguội đi)' }
      ]
    };
  }
};

S.nhiet_mix = {
  cat: 'nhiet', name: 'Cân bằng nhiệt hai chất', tag: 'm₁c₁Δt₁ = m₂c₂Δt₂',
  desc: 'Trộn hai lượng nước (hoặc hai chất) — máy giải phương trình cân bằng nhiệt.',
  fields: [{ k: 'm1', l: 'Khối lượng 1', u: 'kg', v: 0.5 }, { k: 't1', l: 'Nhiệt độ 1', u: '°C', v: 100 }, { k: 'c1', l: 'Nhiệt dung riêng 1', u: 'J/kg.K', v: 4200 }, { k: 'm2', l: 'Khối lượng 2', u: 'kg', v: 1 }, { k: 't2', l: 'Nhiệt độ 2', u: '°C', v: 20 }, { k: 'c2', l: 'Nhiệt dung riêng 2', u: 'J/kg.K', v: 4200 }],
  run(v) {
    const t = (v.m1 * v.c1 * v.t1 + v.m2 * v.c2 * v.t2) / (v.m1 * v.c1 + v.m2 * v.c2);
    return {
      out: [{ l: 'Nhiệt độ cân bằng', v: t, u: '°C' }, { l: 'Nhiệt toả ra', v: v.m1 * v.c1 * Math.abs(v.t1 - t), u: 'J' }, { l: 'Nhiệt thu vào', v: v.m2 * v.c2 * Math.abs(t - v.t2), u: 'J' }],
      steps: [
        { h: 'Bước 1 · Phương trình cân bằng', f: 'm₁c₁(t₁ − t) = m₂c₂(t − t₂)', c: `${v.m1}·${v.c1}(${v.t1} − t) = ${v.m2}·${v.c2}(t − ${v.t2})` },
        { h: 'Bước 2 · Giải', f: 't = (m₁c₁t₁ + m₂c₂t₂)/(m₁c₁ + m₂c₂)', c: `t = ${f2(t, 2)} °C` },
        { h: 'Bước 3 · Kiểm tra', f: 'Q_toả = Q_thu', c: `Q = ${f2(v.m1 * v.c1 * Math.abs(v.t1 - t))} J` }
      ]
    };
  }
};

S.nhiet_fuel = {
  cat: 'nhiet', name: 'Đốt nhiên liệu đun nước', tag: 'Q = q·m ; H = Q_ci/Q_tp',
  desc: 'Nhập lượng nước, độ tăng nhiệt, năng suất toả nhiệt và hiệu suất bếp.',
  fields: [{ k: 'm', l: 'Khối lượng nước', u: 'kg', v: 3 }, { k: 'dt', l: 'Độ tăng nhiệt', u: 'K', v: 80 }, { k: 'q', l: 'Năng suất toả nhiệt', u: 'J/kg', v: 44000000 }, { k: 'H', l: 'Hiệu suất', u: '%', v: 40 }],
  run(v) {
    const Qi = v.m * 4200 * v.dt, Qt = Qi / (v.H / 100), mf = Qt / v.q;
    return {
      out: [{ l: 'Nhiệt có ích', v: Qi, u: 'J' }, { l: 'Nhiệt toàn phần', v: Qt, u: 'J' }, { l: 'Khối lượng nhiên liệu', v: mf, u: 'kg' }, { l: 'Đổi ra', v: mf * 1000, u: 'g' }],
      steps: [
        { h: 'Bước 1 · Nhiệt có ích', f: 'Q_ci = m·c·Δt', c: `Q_ci = ${v.m}·4200·${v.dt} = ${f2(Qi)} J` },
        { h: 'Bước 2 · Nhiệt toàn phần', f: 'Q_tp = Q_ci/H', c: `Q_tp = ${f2(Qi)}/${v.H / 100} = ${f2(Qt)} J` },
        { h: 'Bước 3 · Nhiên liệu', f: 'm = Q_tp/q', c: `m = ${f2(Qt)}/${v.q} = ${f3(mf)} kg` }
      ]
    };
  }
};

S.nhiet_joule = {
  cat: 'nhiet', name: 'Điện năng biến thành nhiệt', tag: 'Q = I²·R·t',
  desc: 'Tính nhiệt lượng dây dẫn toả ra và lượng nước đun được trong thời gian t.',
  fields: [{ k: 'I', l: 'Cường độ dòng điện', u: 'A', v: 2 }, { k: 'R', l: 'Điện trở dây', u: 'Ω', v: 50 }, { k: 't', l: 'Thời gian', u: 'phút', v: 10 }, { k: 'm', l: 'Khối lượng nước', u: 'kg', v: 1 }],
  run(v) {
    const t = v.t * 60, Q = v.I * v.I * v.R * t, dT = Q / (v.m * 4200);
    return {
      out: [{ l: 'Nhiệt lượng', v: Q, u: 'J' }, { l: 'Nước tăng thêm', v: dT, u: '°C' }, { l: 'Công suất toả', v: v.I * v.I * v.R, u: 'W' }],
      steps: [
        { h: 'Bước 1 · Công suất toả nhiệt', f: 'P = I²R', c: `P = ${v.I}²·${v.R} = ${f2(v.I * v.I * v.R)} W` },
        { h: 'Bước 2 · Nhiệt lượng', f: 'Q = P·t = I²Rt', c: `Q = ${f2(v.I * v.I * v.R)}·${f2(t)} = ${f2(Q)} J` },
        { h: 'Bước 3 · Nếu dùng đun nước', f: 'Δt = Q/(m·c)', c: `Δt = ${f2(dT)} °C (bỏ qua hao phí)` }
      ]
    };
  }
};

/* ---------- 6. electromagnetism ---------- */
S.tu_trans = {
  cat: 'tu', name: 'Máy biến áp', tag: 'U₁/U₂ = n₁/n₂',
  desc: 'Nhập hiệu điện thế và số vòng hai cuộn — ra hiệu điện thế thứ cấp và dòng điện.',
  fields: [{ k: 'U1', l: 'Hiệu điện thế cuộn sơ cấp', u: 'V', v: 220 }, { k: 'n1', l: 'Số vòng sơ cấp', u: 'vòng', v: 4400 }, { k: 'n2', l: 'Số vòng thứ cấp', u: 'vòng', v: 220 }, { k: 'P', l: 'Công suất (bỏ trống nếu không cần)', u: 'W', v: 0 }],
  run(v) {
    const U2 = v.U1 * v.n2 / v.n1, out = [{ l: 'U₂', v: U2, u: 'V' }, { l: 'Tỉ số', v: v.n1 / v.n2, u: 'lần' }, { l: 'Máy', v: v.n1 > v.n2 ? 'hạ thế' : 'tăng thế', u: '', text: true }];
    const st = [
      { h: 'Bước 1 · Công thức', f: 'U₁/U₂ = n₁/n₂', c: `${v.U1}/U₂ = ${v.n1}/${v.n2}` },
      { h: 'Bước 2 · Suy ra U₂', f: 'U₂ = U₁·n₂/n₁', c: `U₂ = ${v.U1}·${v.n2}/${v.n1} = ${f2(U2)} V` },
      { h: 'Bước 3 · Kết luận', f: 'So sánh n₁, n₂', c: `n₁ ${v.n1 > v.n2 ? '>' : v.n1 < v.n2 ? '<' : '='} n₂ ⇒ máy ${v.n1 > v.n2 ? 'hạ thế' : 'tăng thế'}` }
    ];
    if (v.P > 0) {
      out.push({ l: 'I₁', v: v.P / v.U1, u: 'A' }, { l: 'I₂', v: v.P / U2, u: 'A' });
      st.push({ h: 'Bước 4 · Dòng điện (lý tưởng)', f: 'P = U₁I₁ = U₂I₂', c: `I₁ = ${f3(v.P / v.U1)} A · I₂ = ${f3(v.P / U2)} A` });
    }
    return { out, steps: st, draw: { type: 'coil', n1: v.n1, n2: v.n2 } };
  }
};

S.tu_loss = {
  cat: 'tu', name: 'Hao phí truyền tải điện', tag: 'P_hp = P²·R/U²',
  desc: 'Nhập công suất truyền đi, hiệu điện thế đường dây, điện trở dây — ra công suất hao phí.',
  fields: [{ k: 'P', l: 'Công suất truyền đi', u: 'kW', v: 100 }, { k: 'U', l: 'Hiệu điện thế đường dây', u: 'kV', v: 10 }, { k: 'R', l: 'Điện trở dây dẫn', u: 'Ω', v: 5 }],
  run(v) {
    const P = v.P * 1000, U = v.U * 1000, hp = P * P * v.R / (U * U);
    return {
      out: [{ l: 'Công suất hao phí', v: hp, u: 'W' }, { l: 'Tỉ lệ hao phí', v: hp / P * 100, u: '%' }, { l: 'Hiệu suất truyền tải', v: (1 - hp / P) * 100, u: '%' }],
      steps: [
        { h: 'Bước 1 · Đổi đơn vị', f: '1 kW = 1000 W ; 1 kV = 1000 V', c: `P = ${f2(P)} W · U = ${f2(U)} V` },
        { h: 'Bước 2 · Công suất hao phí', f: 'P_hp = P²R/U²', c: `P_hp = ${f2(P)}²·${v.R}/${f2(U)}² = ${f2(hp)} W` },
        { h: 'Bước 3 · Hiệu suất', f: 'H = 1 − P_hp/P', c: `H = ${f2((1 - hp / P) * 100, 2)}%` },
        { h: 'Bước 4 · Nhận xét', f: 'Tăng U gấp k ⇒ hao phí giảm k²', c: 'Muốn giảm hao phí, tăng hiệu điện thế truyền tải là cách hiệu quả nhất.' }
      ]
    };
  }
};

S.tu_force = {
  cat: 'tu', name: 'Lực điện từ lên đoạn dây', tag: 'F = B·I·l·sin α',
  desc: 'Nhập cảm ứng từ, dòng điện, chiều dài đoạn dây và góc hợp.',
  fields: [{ k: 'B', l: 'Cảm ứng từ', u: 'T', v: 0.5 }, { k: 'I', l: 'Cường độ dòng điện', u: 'A', v: 2 }, { k: 'l', l: 'Chiều dài đoạn dây', u: 'cm', v: 10 }, { k: 'a', l: 'Góc hợp', u: '°', v: 90 }],
  run(v) {
    const l = v.l / 100, F = v.B * v.I * l * Math.sin(v.a * Math.PI / 180);
    return {
      out: [{ l: 'Chiều dài', v: l, u: 'm' }, { l: 'Lực điện từ F', v: F, u: 'N' }],
      steps: [
        { h: 'Bước 1 · Đổi chiều dài', f: 'l = cm/100', c: `l = ${v.l} cm = ${f2(l)} m` },
        { h: 'Bước 2 · Lực điện từ', f: 'F = B·I·l·sin α', c: `F = ${v.B}·${v.I}·${f2(l)}·sin ${v.a}° = ${f3(F)} N` },
        { h: 'Bước 3 · Chiều lực', f: 'Quy tắc bàn tay trái', c: 'Đặt bàn tay trái sao cho đường sức xuyên vào lòng bàn tay, chiều từ cổ tay đến ngón tay là chiều dòng điện, ngón tay cái choãi 90° chỉ chiều lực.' }
      ]
    };
  }
};

/* =========================================================
   UI
   ========================================================= */
const CALC_DEFAULT = { cat: 'el', id: 'el_circuit', vals: {}, saved: false };

function calcState() {
  if (!state.calc) state.calc = JSON.parse(JSON.stringify(CALC_DEFAULT));
  if (!state.calc.vals) state.calc.vals = {};
  return state.calc;
}

function renderCalc() {
  const cs = calcState();
  const cat = cs.cat || 'el';
  const list = Object.keys(S).filter(k => S[k].cat === cat);
  if (!list.includes(cs.id)) cs.id = list[0];
  const sol = S[cs.id];
  const vals = {};
  sol.fields.forEach(f => { vals[f.k] = cs.vals[cs.id] && cs.vals[cs.id][f.k] !== undefined ? cs.vals[cs.id][f.k] : f.v; });

  $('#main').innerHTML = `<section class="wrap wide">
    ${pageHead('Máy giải · nhập số liệu, ra lời giải và hình vẽ', 'Tự giải mọi dạng, không cần mạng',
    'Chọn dạng bài (bấm hoặc kéo thẻ vào khung), nhập số liệu — máy tính ngay từng bước và vẽ hình theo tỉ lệ. Kết quả có thể lưu vào phiếu để in.')}
    <div class="calc-tabs">
      ${CATS.map(c => `<button class="calc-tab${c.id === cat ? ' on' : ''}" data-cat="${c.id}">${c.name}<i>${c.note}</i></button>`).join('')}
    </div>
    <div class="calc-body">
      <aside class="calc-pick">
        <div class="kicker">Chọn dạng bài</div>
        <div class="tile-list" id="tileList">
          ${list.map(id => {
            const s = S[id];
            return `<button class="tile${id === cs.id ? ' on' : ''}" draggable="true" data-id="${id}">
              <span class="tile-ic">${ICO[s.cat === 'el' ? 'circ' : s.cat === 'quang' ? 'lens' : s.cat === 'co' ? 'move' : s.cat === 'nhiet' ? 'heat' : 'coil']}</span>
              <span class="tile-t">${s.name}</span><span class="tile-d">${s.tag}</span></button>`;
          }).join('')}
        </div>
        <div class="drop-zone" id="dropZone"><span class="kicker">Kéo thẻ vào đây</span></div>
      </aside>
      <div class="calc-work">
        <div class="calc-head">
          <div><h2>${sol.name}</h2><p>${sol.desc}</p></div>
          <span style="display:flex;gap:8px;flex-wrap:wrap">
            <a class="btn ghost sm" href="#/build">Bảng mạch →</a>
            <button class="btn ghost sm" id="calcReset">Số liệu mẫu</button>
          </span>
        </div>
        <div class="calc-form" id="calcForm"></div>
        <div class="calc-out" id="calcOut"></div>
        <div class="calc-draw" id="calcDraw"></div>
        <div class="calc-steps" id="calcSteps"></div>
        <div class="calc-actions">
          <button class="btn" id="calcSave">Lưu vào phiếu của tôi</button>
          <a class="btn ghost" href="#/sheet">Mở phiếu & in →</a>
        </div>
      </div>
    </div>
  </section>`;

  const form = $('#calcForm');
  form.innerHTML = sol.fields.map(f => {
    if (f.type === 'tiles') {
      return `<div class="cf-row cf-tiles"><span class="cf-l">${f.l}</span><div class="cf-opts">
        ${f.opts.map(([k, t]) => `<button class="cf-opt${vals[f.k] === k ? ' on' : ''}" data-k="${f.k}" data-v="${k}">${t}</button>`).join('')}</div></div>`;
    }
    return `<label class="cf-row"><span class="cf-l">${f.l}</span>
      <span class="cf-in"><input type="number" step="any" inputmode="decimal" data-k="${f.k}" value="${vals[f.k]}"><i>${f.u || ''}</i></span></label>`;
  }).join('');

  const compute = () => {
    sol.fields.forEach(f => {
      if (f.type === 'tiles') return;
      const el = form.querySelector(`[data-k="${f.k}"]`);
      vals[f.k] = el && el.value !== '' ? parseFloat(String(el.value).replace(',', '.')) : f.v;
      if (!ok(vals[f.k])) vals[f.k] = f.v;
    });
    cs.vals[cs.id] = Object.assign({}, vals);
    save();
    let res;
    try { res = sol.run(vals); } catch (e) { $('#calcOut').innerHTML = '<p class="muted">Số liệu chưa hợp lệ — kiểm tra lại (tránh chia cho 0).</p>'; return; }
    const broken = (res.out || []).filter(o => !o.text && (!isFinite(+o.v) || o.v === undefined));
    if (broken.length) {
      $('#calcOut').innerHTML = `<div class="calc-bad"><b>Trường hợp đặc biệt</b>
        Số liệu này làm mẫu số bằng 0 (ví dụ d = f với thấu kính, hoặc vận tốc riêng bằng vận tốc dòng nước) nên bài toán không có nghiệm hữu hạn.
        Đổi một thông số rồi tính lại.</div>`;
      $('#calcDraw').innerHTML = '';
      $('#calcSteps').innerHTML = '';
      return;
    }
    $('#calcOut').innerHTML = `<div class="calc-res">${res.out.map(o => `<div class="cr${o.text ? ' txt' : ''}">
      <span class="cr-k">${o.l}</span><span class="cr-v">${o.text ? o.v : f2(o.v)}<i>${o.u || ''}</i></span></div>`).join('')}</div>`
      + (res.note ? `<p class="calc-note">${res.note}</p>` : '');
    $('#calcDraw').innerHTML = res.draw ? `<div class="calc-fig"><div class="kicker">Hình vẽ tự động</div>${drawFor(res.draw)}</div>` : '';
    $('#calcSteps').innerHTML = `<div class="kicker" style="margin:22px 0 10px">Lời giải từng bước</div>
      ${res.steps.map((s, i) => `<div class="cs">
        <div class="cs-h"><span class="cs-n">${String(i + 1).padStart(2, '0')}</span>${s.h}</div>
        <div class="cs-f">${s.f}</div><div class="cs-c">${s.c}</div></div>`).join('')}`;
  };

  const drawFor = d => {
    /* hình vẽ có thể mang sẵn số liệu riêng (d.U, d.R1, …) do dạng bài tự
       tính; nếu không thì dùng số người dùng vừa nhập. */
    if (d.type === 'circuit') return svgCircuit(d.topology, Object.assign({}, vals, d), { I: 0 });
    if (d.type === 'lens') return svgLens(d.f, d.d, d.h, d.kind);
    if (d.type === 'meet') return svgMeet(d.x1, d.x2, d.v1, d.v2, d.same, d.t, d.pos);
    if (d.type === 'arch') return svgArch(d.sub, d.state, d.P, d.FA);
    if (d.type === 'coil') return svgCoil(d.n1, d.n2);
    return '';
  };
  window.__drawFor = drawFor;

  form.querySelectorAll('input').forEach(inp => { inp.oninput = compute; });
  form.querySelectorAll('.cf-opt').forEach(b => b.onclick = () => {
    vals[b.dataset.k] = b.dataset.v;
    form.querySelectorAll(`.cf-opt[data-k="${b.dataset.k}"]`).forEach(x => x.classList.toggle('on', x === b));
    compute();
  });
  $('#calcReset').onclick = () => { delete cs.vals[cs.id]; renderCalc(); };

  $$('#tileList .tile').forEach(t => {
    t.onclick = () => { cs.id = t.dataset.id; renderCalc(); };
    t.ondragstart = e => { e.dataTransfer.setData('text/plain', t.dataset.id); };
  });
  const dz = $('#dropZone');
  dz.ondragover = e => { e.preventDefault(); dz.classList.add('hot'); };
  dz.ondragleave = () => dz.classList.remove('hot');
  dz.ondrop = e => {
    e.preventDefault(); dz.classList.remove('hot');
    const id = e.dataTransfer.getData('text/plain');
    if (S[id]) { cs.id = id; renderCalc(); toast('Đã chọn: ' + S[id].name); }
  };
  $$('.calc-tab').forEach(b => b.onclick = () => { cs.cat = b.dataset.cat; cs.id = ''; renderCalc(); });

  $('#calcSave').onclick = () => {
    const name = S[cs.id].name;
    const summary = $('#calcOut').textContent.replace(/\s+/g, ' ').trim().slice(0, 160);
    state.book = state.book || [];
    state.book.unshift({ id: cs.id, name, vals: Object.assign({}, vals), out: summary, at: Date.now() });
    state.book = state.book.slice(0, 30);
    save(); toast('Đã lưu vào phiếu của tôi');
  };

  compute();
}

function svgCoil(n1, n2) {
  const out = [];
  out.push(`<rect x="120" y="60" width="120" height="120" fill="none" stroke="var(--ink)" stroke-width="1.4"/>`);
  out.push(`<rect x="330" y="85" width="90" height="90" fill="none" stroke="var(--ink)" stroke-width="1.4"/>`);
  for (let i = 0; i < 6; i++) out.push(`<path d="M${132 + i * 18} 60v-16" stroke="var(--ink-2)" stroke-width="1"/>`);
  for (let i = 0; i < 4; i++) out.push(`<path d="M${342 + i * 18} 85v-12" stroke="var(--ink-2)" stroke-width="1"/>`);
  out.push(`<text x="180" y="130" text-anchor="middle" font-family="var(--mono)" font-size="11" fill="var(--ink)">n₁ = ${n1}</text>`);
  out.push(`<text x="375" y="135" text-anchor="middle" font-family="var(--mono)" font-size="11" fill="var(--ink)">n₂ = ${n2}</text>`);
  out.push(`<path d="M240 120h90" stroke="var(--ink-2)" stroke-width="1" stroke-dasharray="4 3"/>`);
  return `<svg viewBox="0 0 520 220" class="calc-svg" role="img" aria-label="Máy biến áp">${out.join('')}</svg>`;
}
