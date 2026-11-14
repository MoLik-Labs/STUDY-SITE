/* =========================================================
   PHÒNG THÍ NGHIỆM — bàn thực hành dựng bằng SVG
   1 · Điện: vôn–ampe, nối tiếp, song song, ghi số liệu, đồ thị
   2 · Quang: băng quang học, kéo nến / thấu kính / màn
   3 · Cơ: lực kế + Archimedes, hạ vật vào chất lỏng
   4 · Nhiệt: nhiệt lượng kế, trộn hai khối nước
========================================================= */
const LAB_ST = () => {
  if (!state.lab) state.lab = {
    st: 'dc', mode: 'A', E: 6, Rv: 8, sw: true, rec: [], simT: 0,
    lensF: 12, dObj: 30, dScr: 20,
    liquid: 0, depth: 0, liq: 'nuoc', mat: 'nhom', log: [],
    m1: 0.2, t1: 80, m2: 0.3, t2: 20, mixed: false, tEq: 0, tNow: 20
  };
  return state.lab;
};
const float = (x, n = 2) => {
  const s = (+x).toFixed(n);
  if (s.indexOf('.') < 0) return s;                 /* 7800 phải giữ nguyên, không cắt thành 78 */
  const t = s.replace(/0+$/, '').replace(/\.$/, '');
  return t === '-0' ? '0' : t;
};
const nuocD = { nuoc: 1000, dau: 800, ruou: 790, muoi: 1100 };
const LAB_MAT = { nhom: ['nhôm', 2700], sat: ['sắt', 7800], dong: ['đồng', 8900], da: ['đá', 2500], go: ['gỗ', 700] };
const LAB_NAME = { dc: 'Bàn 1 · Điện', opt: 'Bàn 2 · Quang', arch: 'Bàn 3 · Cơ', heat: 'Bàn 4 · Nhiệt' };
const nuocN = { nuoc: 'nước', dau: 'dầu', ruou: 'rượu', muoi: 'nước muối' };

/* ---------- cảnh báo an toàn của bàn điện ---------- */
function labAlerts(L, r) {
  const w = [];
  if (!L.sw) w.push(['hở', 'Khoá K đang mở — mạch hở, I = 0. Đóng K để có dòng.']);
  else {
    if (r.I > 1) w.push(['quá', `I = ${float(r.I, 2)} A vượt thang ampe kế 1 A: kim chạm cữ, số đọc không còn đúng. Tăng điện trở biến trở hoặc giảm E.`]);
    if (r.U > 15) w.push(['quá', `U = ${float(r.U, 1)} V vượt thang vôn kế 15 V.`]);
    const PR = L.mode === 'A' ? r.I * r.I * 10 : L.mode === 'B' ? r.I * r.I * 6 : r.I1 * r.I1 * 6;
    if (PR > 2) w.push(['nóng', `Công suất trên điện trở ${float(PR, 2)} W > định mức 2 W — điện trở nóng lên, giá trị R trôi theo nhiệt độ, dây có thể cháy.`]);
  }
  if (!w.length) return `<div class="lab-ok">Mạch kín, mọi đại lượng nằm trong thang đo — số đọc tin được.</div>`;
  return `<div class="lab-alerts">${w.map(([k, t]) => `<div class="lab-alert ${k}"><b>${k === 'hở' ? 'Mạch hở' : k === 'quá' ? 'Quá thang' : 'Quá công suất'}</b>${t}</div>`).join('')}</div>`;
}

/* ---------- hình học bàn điện ---------- */
const DC = { L: 96, R: 646, T: 138, B: 348 };

function dcSolve(L) {
  const E = L.E, r = 0.4;
  const R1 = 6, R2 = 12, R = 10;
  if (L.mode === 'A') {
    const Rt = R + L.Rv + r, I = L.sw ? E / Rt : 0;
    return { I, U: I * R, U1: 0, U2: 0, I1: 0, I2: 0, Req: R + L.Rv, items: [{ R, U: I * R }] };
  }
  if (L.mode === 'B') {
    const Rt = R1 + R2 + L.Rv + r, I = L.sw ? E / Rt : 0;
    return { I, U: I * (R1 + R2), U1: I * R1, U2: I * R2, I1: I, I2: I, Req: R1 + R2, items: [{ R: R1, U: I * R1 }, { R: R2, U: I * R2 }] };
  }
  const Rp = (R1 * R2) / (R1 + R2), Rt = Rp + L.Rv + r, I = L.sw ? E / Rt : 0;
  const U = I * Rp;
  return { I, U, U1: U, U2: U, I1: U / R1, I2: U / R2, Req: Rp, items: [{ R: R1, U }, { R: R2, U }] };
}

/* kim đồng hồ: kim quay từ -52° đến +52° */
function dial(cx, cy, val, max, label, unit) {
  const a = (-52 + 104 * Math.max(0, Math.min(1, val / max))) * Math.PI / 180;
  const len = 30;
  const ticks = Array.from({ length: 11 }, (_, i) => {
    const t = (-52 + 104 * i / 10) * Math.PI / 180;
    const big = i % 5 === 0, r1 = 34, r2 = big ? 27 : 30.5;
    return `<line x1="${cx + Math.sin(t) * r1}" y1="${cy - Math.cos(t) * r1}"
      x2="${cx + Math.sin(t) * r2}" y2="${cy - Math.cos(t) * r2}"
      stroke="var(--ink-3)" stroke-width="${big ? 1.2 : .7}"/>`;
  }).join('');
  const nums = [0, .5, 1].map((f, i) => {
    const t = (-52 + 104 * f) * Math.PI / 180;
    return `<text x="${cx + Math.sin(t) * 21}" y="${cy - Math.cos(t) * 21 + 3}" text-anchor="middle"
      font-family="var(--mono)" font-size="7" fill="var(--ink-3)">${float(max * f, 1)}</text>`;
  }).join('');
  return `<g class="meter">
    <circle cx="${cx}" cy="${cy}" r="40" fill="var(--card)" stroke="var(--ink-2)" stroke-width="1.4"/>
    <circle cx="${cx}" cy="${cy}" r="35" fill="none" stroke="var(--rule)" stroke-width=".8"/>
    <path d="M${cx - 34} ${cy + 14} A34 34 0 0 1 ${cx + 34} ${cy + 14}Z" fill="var(--paper)" opacity=".55"/>
    ${ticks}${nums}
    <line x1="${cx}" y1="${cy}" x2="${cx + Math.sin(a) * len}" y2="${cy - Math.cos(a) * len}"
      stroke="var(--accent)" stroke-width="1.8" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${cy}" r="3.4" fill="var(--ink)"/>
    <text x="${cx}" y="${cy + 20}" text-anchor="middle" font-family="var(--mono)" font-size="10" fill="var(--ink-2)">${label}</text>
    <text x="${cx}" y="${cy - 22}" text-anchor="middle" font-family="var(--mono)" font-size="6.5" letter-spacing=".1em" fill="var(--ink-3)">${unit}</text>
  </g>`;
}

function wire(pts, hot) {
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' ');
  return `<path d="${d}" fill="none" stroke="${hot ? 'var(--accent)' : 'var(--ink-2)'}" stroke-width="2.1"
    stroke-linecap="round" stroke-linejoin="round"/>`;
}
function term(x, y) {
  return `<circle cx="${x}" cy="${y}" r="3.6" fill="var(--card)" stroke="var(--ink)" stroke-width="1.2"/>
          <circle cx="${x}" cy="${y}" r="1.3" fill="var(--ink)"/>`;
}

function dcBench(L) {
  const r = dcSolve(L);
  const A = { x: 108 };            /* ắc quy */
  const AMP = { x: 292 };          /* ampe kế */
  const REE = { x0: 346, x1: 500 };/* biến trở */
  const SW = { x0: 236, x1: 278 }; /* khoá */
  const RS = { x: 604 };           /* điện trở khảo sát */
  const ty = DC.T, by = DC.B;
  const midY = (ty + by) / 2;

  let w = '';
  /* vòng ngoài */
  w += wire([[A.x, ty], [A.x, 194]]);
  w += wire([[A.x, 292], [A.x, by]]);
  w += wire([[A.x, ty], [AMP.x - 44, ty]]);
  w += wire([[AMP.x + 44, ty], [RS.x, ty]]);
  w += wire([[RS.x, ty], [RS.x, midY - 62]]);
  w += wire([[RS.x, midY + 62], [RS.x, by]]);
  w += wire([[RS.x, by], [REE.x1, by]]);
  w += wire([[REE.x0, by], [SW.x1, by]]);
  w += wire([[SW.x0, by], [A.x, by]]);

  /* ắc quy */
  w += `<g>
    <rect x="${A.x - 26}" y="${midY - 49}" width="52" height="98" rx="2" fill="var(--card-2)" stroke="var(--ink-2)" stroke-width="1.3"/>
    <rect x="${A.x - 21}" y="${midY - 44}" width="42" height="32" fill="var(--accent)" opacity=".14"/>
    <line x1="${A.x - 15}" y1="${midY - 16}" x2="${A.x + 15}" y2="${midY - 16}" stroke="var(--ink)" stroke-width="1.7"/>
    <line x1="${A.x - 7}" y1="${midY + 12}" x2="${A.x + 7}" y2="${midY + 12}" stroke="var(--ink)" stroke-width="1.7"/>
    <text x="${A.x - 33}" y="${midY - 14}" text-anchor="end" font-family="var(--mono)" font-size="10" fill="var(--accent)">+</text>
    <text x="${A.x - 33}" y="${midY + 16}" text-anchor="end" font-family="var(--mono)" font-size="10" fill="var(--ink-2)">−</text>
    <text x="${A.x + 34}" y="${midY + 4}" font-family="var(--mono)" font-size="8.5" fill="var(--ink-3)">NGUỒN</text>
    <text x="${A.x + 34}" y="${midY + 17}" font-family="var(--mono)" font-size="9.5" fill="var(--accent)">${float(L.E, 1)} V</text>
  </g>`;

  /* ampe kế */
  w += dial(AMP.x, ty, r.I, 1, 'A', 'AMPE KẾ 0–1 A');
  w += `<text x="${AMP.x}" y="${ty - 46}" text-anchor="middle" font-family="var(--mono)" font-size="8" fill="var(--ink-3)">đo I toàn mạch</text>`;

  /* điện trở khảo sát */
  const rLabel = L.mode === 'A' ? 'R = 10 Ω' : L.mode === 'B' ? 'R₁ + R₂ = 18 Ω' : 'R₁ ∥ R₂ = 4 Ω';
  w += `<g>
    <rect x="${RS.x - 19}" y="${midY - 62}" width="38" height="124" fill="var(--card)" stroke="var(--ink)" stroke-width="1.5"/>
    <path d="M${RS.x - 9} ${midY - 40} l9 9 l-9 9 l9 9 l-9 9 l9 9 l-9 9" fill="none" stroke="var(--ink-2)" stroke-width="1.4"/>
    <text x="${RS.x}" y="${midY - 74}" text-anchor="middle" font-family="var(--mono)" font-size="8.5" fill="var(--ink-2)">${rLabel}</text>
  </g>`;

  /* vôn kế mắc song song với điện trở */
  const VX = RS.x - 112;
  w += wire([[RS.x, midY - 62], [VX, midY - 62]]);
  w += wire([[VX, midY - 62], [VX, midY - 40]]);
  w += wire([[VX, midY + 40], [VX, midY + 62]]);
  w += wire([[VX, midY + 62], [RS.x, midY + 62]]);
  w += dial(VX, midY, r.U, 15, 'V', 'VÔN KẾ 0–15 V');
  w += `<text x="${VX}" y="${midY + 54}" text-anchor="middle" font-family="var(--mono)" font-size="7.5" fill="var(--ink-3)">mắc song song với R</text>`;

  /* khoá K */
  w += `<g id="dcSwitch" style="cursor:pointer">
    <line x1="${SW.x0}" y1="${by}" x2="${SW.x1}" y2="${by}" stroke="var(--paper)" stroke-width="7"/>
    <line x1="${SW.x0}" y1="${by}" x2="${SW.x1}" y2="${by}" stroke="var(--ink-2)" stroke-width="2.2"
      style="transform:rotate(${L.sw ? 0 : -24}deg);transform-origin:${SW.x0}px ${by}px;transition:transform .15s"/>
    ${term(SW.x0, by)}${term(SW.x1, by)}
    <text x="${(SW.x0 + SW.x1) / 2}" y="${by + 20}" text-anchor="middle" font-family="var(--mono)" font-size="8" fill="${L.sw ? 'var(--ink-3)' : 'var(--accent)'}">K · ${L.sw ? 'đóng' : 'mở'}</text>
  </g>`;

  /* biến trở */
  const knobX = REE.x0 + 8 + (REE.x1 - REE.x0 - 16) * (L.Rv / 20);
  const coils = Array.from({ length: 15 }, (_, i) =>
    `<line x1="${REE.x0 + 9 + i * 10}" y1="${by - 9}" x2="${REE.x0 + 9 + i * 10}" y2="${by + 9}" stroke="var(--rule-2)" stroke-width="1.5"/>`).join('');
  w += `<rect x="${REE.x0}" y="${by - 15}" width="${REE.x1 - REE.x0}" height="30" fill="var(--card)" stroke="var(--ink-2)" stroke-width="1.3"/>
    ${coils}
    <g id="dcKnob" style="cursor:grab">
      <rect x="${knobX - 8}" y="${by - 24}" width="16" height="22" fill="var(--accent)" opacity=".92"/>
      <rect x="${knobX - 11}" y="${by - 29}" width="22" height="7" fill="var(--ink)"/>
    </g>
    ${term(REE.x0, by)}${term(REE.x1, by)}
    <text x="${(REE.x0 + REE.x1) / 2}" y="${by + 30}" text-anchor="middle" font-family="var(--mono)" font-size="8" fill="var(--ink-3)">BIẾN TRỞ ${float(L.Rv, 0)}/20 Ω · kéo con chạy</text>`;
  return w;
}

function fitLine(pts) {
  const n = pts.length;
  const sx = pts.reduce((a, p) => a + p.U, 0), sy = pts.reduce((a, p) => a + p.I, 0);
  const sxx = pts.reduce((a, p) => a + p.U * p.U, 0), sxy = pts.reduce((a, p) => a + p.U * p.I, 0);
  const k = (n * sxy - sx * sy) / (n * sxx - sx * sx || 1e-9);
  return { k, n };
}

function ivGraph(pts, fit) {
  const W = 640, H = 240, P = { l: 46, r: 16, t: 14, b: 30 };
  const maxU = Math.max(15, ...pts.map(p => p.U)) , maxI = Math.max(0.6, ...pts.map(p => p.I));
  const X = u => P.l + (u / maxU) * (W - P.l - P.r);
  const Y = i => H - P.b - (i / maxI) * (H - P.t - P.b);
  const grid = [0, 1, 2, 3, 4, 5].map(k => {
    const y = Y(maxI * k / 5);
    return `<line x1="${P.l}" y1="${y}" x2="${W - P.r}" y2="${y}" stroke="var(--rule)" stroke-width=".7"/>
      <text x="${P.l - 6}" y="${y + 3}" text-anchor="end" font-family="var(--mono)" font-size="7.5" fill="var(--ink-3)">${float(maxI * k / 5, 2)}</text>`;
  }).join('');
  const gx = [0, 1, 2, 3, 4, 5].map(k => {
    const x = X(maxU * k / 5);
    return `<line x1="${x}" y1="${H - P.b}" x2="${x}" y2="${P.t}" stroke="var(--rule)" stroke-width=".4" opacity=".6"/>
      <text x="${x}" y="${H - P.b + 13}" text-anchor="middle" font-family="var(--mono)" font-size="7.5" fill="var(--ink-3)">${float(maxU * k / 5, 0)}</text>`;
  }).join('');
  let line = '';
  if (fit && fit.k > 0) {
    const uEnd = Math.min(maxU, maxI / fit.k * 0.98);
    line = `<line x1="${X(0)}" y1="${Y(0)}" x2="${X(uEnd)}" y2="${Y(fit.k * uEnd)}" stroke="var(--accent)" stroke-width="1.4" stroke-dasharray="5 4"/>`;
  }
  const dots = pts.map((p, i) => `<g>
      <circle cx="${X(p.U)}" cy="${Y(p.I)}" r="4.2" fill="var(--card)" stroke="var(--accent)" stroke-width="1.6"/>
      <text x="${X(p.U) + 7}" y="${Y(p.I) - 6}" font-family="var(--mono)" font-size="7" fill="var(--ink-3)">${i + 1}</text>
    </g>`).join('');
  return `<svg class="lab-graph" viewBox="0 0 ${W} ${H}" role="img" aria-label="Đồ thị I theo U">
    ${grid}${gx}
    <line x1="${P.l}" y1="${H - P.b}" x2="${W - P.r}" y2="${H - P.b}" stroke="var(--ink-2)" stroke-width="1.1"/>
    <line x1="${P.l}" y1="${P.t}" x2="${P.l}" y2="${H - P.b}" stroke="var(--ink-2)" stroke-width="1.1"/>
    ${line}${dots}
    <text x="${W - P.r}" y="${H - 8}" text-anchor="end" font-family="var(--mono)" font-size="8" fill="var(--ink-3)">U (V)</text>
    <text x="${P.l + 6}" y="${P.t + 4}" font-family="var(--mono)" font-size="8" fill="var(--ink-3)">I (A)</text>
  </svg>`;
}

/* =========================================================
   BÀN 02 · QUANG HỌC — băng quang học kéo được
========================================================= */
const OPT = { y: 176, cx: 372, scale: 5.1, h: 5 };
function optSolve(L) {
  const f = L.lensF, d = L.dObj;
  const real = d > f;
  const dp = real ? (d * f) / (d - f) : (d * f) / (d - f); /* âm khi d<f */
  const k = -(dp / d);
  return { f, d, dp, k, real, hi: k * OPT.h };
}
function candle(x, y, h, px, cls, inv) {
  const hh = h * px * (inv ? -1 : 1);
  return `<g class="${cls}">
    <rect x="${x - 4}" y="${y - hh}" width="8" height="${hh}" fill="${inv ? 'var(--accent)' : 'var(--card-2)'}" stroke="var(--ink-2)" stroke-width="1"/>
    <path d="M${x} ${y - hh} c4 -7 3 -12 0 -16 c-3 4 -4 9 0 16" fill="${inv ? 'var(--accent)' : '#d08b2a'}" opacity="${inv ? .75 : 1}"/>
  </g>`;
}
/* =========================================================
   BÀN 03 · CƠ HỌC — lực kế & Archimedes
========================================================= */
function archSolve(L) {
  const V = 216e-6, g = 10;
  const mat = LAB_MAT[L.mat] || LAB_MAT.nhom;
  const Dv = mat[1], m = Dv * V, P = m * g;
  const D = nuocD[L.liq] || 1000;
  const f = L.depth / 100;                       /* phần thể tích chìm */
  const FA = D * g * V * f;
  const base = 0.35;                             /* khối lượng bình + nước, kg */
  const scale = base + FA / g;                   /* cân điện tử dưới bình */
  return { m, P, FA, F: P - FA, D, V, f, Dv, matName: mat[0], scale, base, full: f >= .999 };
}
/* =========================================================
   BÀN 04 · NHIỆT — nhiệt lượng kế
========================================================= */
function heatSolve(L) {
  const c = 4200;
  const m1 = L.m1, m2 = L.m2, t1 = L.t1, t2 = L.t2;
  const teq = (m1 * c * t1 + m2 * c * t2) / ((m1 + m2) * c);
  const Q = Math.abs(m1 * c * (t1 - teq));
  const Q1 = Math.abs(m1 * c * (t1 - teq)), Q2 = Math.abs(m2 * c * (t2 - teq));
  return { c, teq, Q, Q1, Q2, hot: t1 >= t2 ? 1 : 2,
           dt1: Math.abs(t1 - teq), dt2: Math.abs(t2 - teq) };
}

/* =========================================================
   KHUNG PHÒNG THÍ NGHIỆM — mỗi bàn trả về {body, ctl}
========================================================= */
const LAB_TABS = [
  ['dc', 'Điện', 'Vôn–ampe · nối tiếp · song song'],
  ['opt', 'Quang', 'Thấu kính hội tụ'],
  ['arch', 'Cơ', 'Lực kế · Archimedes'],
  ['heat', 'Nhiệt', 'Nhiệt lượng kế']
];

function sheet(title, aim, tools, steps, ask) {
  return `<details class="lab-sheet">
    <summary>Phiếu thực hành · ${title}</summary>
    <div class="sheet-grid">
      <div><span class="kicker">Mục đích</span><p>${aim}</p></div>
      <div><span class="kicker">Dụng cụ</span><p>${tools}</p></div>
    </div>
    <ol class="sheet-steps">${steps.map(s => `<li>${s}</li>`).join('')}</ol>
    <p class="sheet-ask">${ask}</p>
  </details>`;
}

/* ---------- BÀN 01 ---------- */
function viewDC(L) {
  const r = dcSolve(L), rec = L.rec.filter(x => x.mode === L.mode);
  const fit = rec.length > 1 ? fitLine(rec) : null;
  const body = `
  <div class="lab-grid">
    <div class="lab-stage">
      <div class="lab-title"><span class="kicker">Bàn 01 · Điện</span>
        <div class="lab-modes">${[['A', 'R + biến trở'], ['B', 'Nối tiếp'], ['C', 'Song song']].map(([k, t]) =>
          `<button data-mode="${k}" class="${L.mode === k ? 'on' : ''}">${t}</button>`).join('')}</div>
      </div>
      <svg class="lab-svg" viewBox="64 92 610 312" role="img" aria-label="Bàn thí nghiệm điện">${dcBench(L)}</svg>
      <div class="lab-hint">Kéo <b>con chạy biến trở</b> trên hình hoặc bấm <b>khoá K</b>. Số chỉ lấy từ hai đồng hồ kim; sai số đọc là nửa vạch chia nhỏ nhất.</div>
    </div>
    <aside class="lab-side">
      <div class="lab-panel">
        <span class="kicker">Số đọc tức thời</span>
        <div class="lab-read">
          <div><b>${L.sw ? float(r.U, 2) : '0'}</b><span>V · vôn kế</span></div>
          <div><b>${L.sw ? float(r.I, 3) : '0'}</b><span>A · ampe kế</span></div>
          <div><b>${float(r.Req, 1)}</b><span>Ω · R tương đương</span></div>
        </div>
        <div class="lab-note">${L.mode === 'A'
          ? 'R cố định 10 Ω. Đổi con chạy cho U hai đầu R thay đổi, ghi cặp (U, I) — hệ số góc đồ thị chính là R.'
          : L.mode === 'B'
            ? `U = U₁ + U₂ = ${float(r.U1, 2)} + ${float(r.U2, 2)} = ${float(r.U, 2)} V — đo riêng rồi cộng lại để kiểm chứng.`
            : `I = I₁ + I₂ = ${float(r.I1, 3)} + ${float(r.I2, 3)} = ${float(r.I, 3)} A, U hai nhánh bằng nhau ${float(r.U, 2)} V.`}</div>
      </div>
      ${labAlerts(L, r)}
      <div class="lab-panel">
        <span class="kicker">Bảng số liệu · ${rec.length} điểm</span>
        <table class="lab-tbl">
          <thead><tr><th>#</th><th>U (V)</th><th>I (A)</th><th>R = U/I</th></tr></thead>
          <tbody>${rec.length ? rec.map((x, i) => `<tr><td>${i + 1}</td><td>${float(x.U, 2)}</td><td>${float(x.I, 3)}</td><td>${float(x.U / x.I, 1)}</td></tr>`).join('')
            : `<tr><td colspan="4" class="dim">Chưa có số liệu — bấm “Ghi số liệu”.</td></tr>`}</tbody>
        </table>
      </div>
      ${sheet('Xác định điện trở bằng vôn kế và ampe kế',
        'Đo U và I trên cùng một điện trở, dựng đồ thị I–U, từ hệ số góc suy ra R.',
        'nguồn một chiều, biến trở, điện trở cần đo, ampe kế, vôn kế, khoá K, dây nối.',
        ['Mắc ampe kế nối tiếp với R, vôn kế song song với R (đúng chiều dương của đồng hồ).',
         'Đóng K, điều chỉnh con chạy để U nhận 5 giá trị khác nhau, mỗi lần ghi (U, I).',
         'Dựng đồ thị I theo U, vẽ đường thẳng gần các điểm nhất, tính hệ số góc.',
         'Lấy R = 1/hệ số góc, so với giá trị ghi trên điện trở, nêu nguyên nhân sai lệch.'],
        'Vì sao phải đổi con chạy mà không lấy một điểm duy nhất? Vì một điểm chỉ cho một tỉ số, còn nhiều điểm mới loại được sai số đọc kim.')}
    </aside>
  </div>
  <div class="lab-panel lab-wide">
    <span class="kicker">Đồ thị I–U dựng từ chính số liệu bạn ghi</span>
    ${fit ? `<div class="lab-fit">Hệ số góc = ${float(fit.k, 3)} A/V → R đo được ≈ <b>${float(1 / fit.k, 1)} Ω</b></div>`
      : `<div class="dim" style="font-size:12px;margin:6px 0 10px">Ghi ít nhất 2 điểm, tốt nhất 5 điểm rải đều thì đồ thị mới có nghĩa.</div>`}
    ${ivGraph(rec, fit)}
  </div>`;
  const ctl = `
    <label>Suất điện động <input type="range" id="dcE" min="1.5" max="12" step="0.5" value="${L.E}"><span id="dcEV">${float(L.E, 1)} V</span></label>
    ${L.mode === 'A' ? `<label>Con chạy <input type="range" id="dcRv" min="0" max="20" step="0.5" value="${L.Rv}"><span id="dcRvV">${float(L.Rv, 0)} Ω</span></label>` : ''}
    <button class="btn sm" id="dcRec">Ghi số liệu</button>
    <button class="btn ghost sm" id="dcClear">Xoá bảng</button>`;
  return { body, ctl };
}

/* ---------- BÀN 02 ---------- */
function viewOpt(L) {
  const o = optSolve(L), px = OPT.scale, cx = OPT.cx, y = OPT.y;
  const xo = cx - o.d * px, xs = cx + L.dScr * px, xi = cx + o.dp * px;
  const blur = Math.min(16, Math.abs(L.dScr - o.dp) * 1.8);
  const sharp = Math.abs(L.dScr - o.dp) < 1.2;
  const body = `
  <div class="lab-grid">
    <div class="lab-stage">
      <div class="lab-title"><span class="kicker">Bàn 02 · Quang hình</span><div class="lab-modes"><span class="lab-tag">kéo nến · kéo màn</span></div></div>
      <svg class="lab-svg" id="optSvg" viewBox="0 20 760 320" role="img" aria-label="Băng quang học">
        <defs>
          <filter id="blurImg"><feGaussianBlur stdDeviation="${blur.toFixed(1)}"/></filter>
          <linearGradient id="lensG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#dfe7ea"/><stop offset=".5" stop-color="#f7f9f9"/><stop offset="1" stop-color="#dfe7ea"/>
          </linearGradient>
        </defs>
        <rect width="760" height="340" fill="var(--paper)"/>
        ${Array.from({ length: 25 }, (_, i) => `<line x1="${20 + i * 30}" y1="302" x2="${20 + i * 30}" y2="310" stroke="var(--rule-2)" stroke-width="1"/>`).join('')}
        <line x1="20" y1="311" x2="740" y2="311" stroke="var(--ink-2)" stroke-width="1.1"/>
        <text x="24" y="326" font-family="var(--mono)" font-size="7" fill="var(--ink-3)">0</text>
        <text x="736" y="326" text-anchor="end" font-family="var(--mono)" font-size="7" fill="var(--ink-3)">băng quang học · đơn vị cm</text>
        <line x1="24" y1="${y}" x2="736" y2="${y}" stroke="var(--ink-3)" stroke-width=".7" stroke-dasharray="6 5"/>
        <text x="28" y="${y - 6}" font-family="var(--mono)" font-size="7" fill="var(--ink-3)">trục chính</text>

        <g id="optLens">
          <path d="M${cx} ${y - 66} q28 66 0 132 q-28 -66 0 -132" fill="url(#lensG)" stroke="var(--ink-2)" stroke-width="1.3"/>
          <line x1="${cx}" y1="${y - 74}" x2="${cx}" y2="${y + 74}" stroke="var(--rule-2)" stroke-width=".8"/>
          <circle cx="${cx - o.f * px}" cy="${y}" r="2.6" fill="var(--accent)"/>
          <circle cx="${cx + o.f * px}" cy="${y}" r="2.6" fill="var(--accent)"/>
          <text x="${cx - o.f * px}" y="${y + 16}" text-anchor="middle" font-family="var(--mono)" font-size="8" fill="var(--accent)">F</text>
          <text x="${cx + o.f * px}" y="${y + 16}" text-anchor="middle" font-family="var(--mono)" font-size="8" fill="var(--accent)">F′</text>
          <text x="${cx}" y="${y + 96}" text-anchor="middle" font-family="var(--mono)" font-size="7.5" fill="var(--ink-3)">THẤU KÍNH · f = ${o.f} cm</text>
        </g>

        ${o.real ? `
          <line x1="${xo}" y1="${y - OPT.h * px}" x2="${cx}" y2="${y - OPT.h * px}" stroke="var(--accent)" stroke-width=".9" opacity=".6"/>
          <line x1="${cx}" y1="${y - OPT.h * px}" x2="${xi}" y2="${y - o.hi * px}" stroke="var(--accent)" stroke-width=".9" opacity=".6"/>
          <line x1="${xo}" y1="${y - OPT.h * px}" x2="${cx}" y2="${y}" stroke="var(--green)" stroke-width=".9" opacity=".5"/>
          <line x1="${cx}" y1="${y}" x2="${xi}" y2="${y - o.hi * px}" stroke="var(--green)" stroke-width=".9" opacity=".5"/>
          <line x1="${xo}" y1="${y}" x2="${cx}" y2="${y - OPT.h * px}" stroke="var(--rule-2)" stroke-width=".7" opacity=".8"/>
          <line x1="${cx}" y1="${y - OPT.h * px}" x2="${xi}" y2="${y - o.hi * px}" stroke="var(--rule-2)" stroke-width=".7" opacity=".55"/>
        ` : `
          <line x1="${xo}" y1="${y - OPT.h * px}" x2="${cx}" y2="${y - OPT.h * px}" stroke="var(--accent)" stroke-width=".9" opacity=".55"/>
          <line x1="${cx}" y1="${y - OPT.h * px}" x2="${xi}" y2="${y - o.hi * px}" stroke="var(--green)" stroke-width=".9" opacity=".5" stroke-dasharray="4 3"/>
          <line x1="${xo}" y1="${y - OPT.h * px}" x2="${xi}" y2="${y - o.hi * px}" stroke="var(--rule-2)" stroke-width=".7" opacity=".6" stroke-dasharray="3 3"/>
        `}

        <g id="optObj" style="cursor:grab">
          ${candle(xo, y, OPT.h, px)}
          <rect x="${xo - 16}" y="${y - 70}" width="32" height="82" fill="transparent"/>
          <text x="${xo}" y="${y + 20}" text-anchor="middle" font-family="var(--mono)" font-size="8" fill="var(--ink-3)">vật · ${float(o.d, 0)} cm</text>
        </g>

        <g opacity=".6">
          <line x1="${xi}" y1="${y}" x2="${xi}" y2="${y - o.hi * px}" stroke="${o.real ? 'var(--accent)' : 'var(--green)'}" stroke-width="1" stroke-dasharray="4 3"/>
          <text x="${xi}" y="${y + (o.real ? 52 : 20)}" text-anchor="middle" font-family="var(--mono)" font-size="8" fill="${o.real ? 'var(--accent)' : 'var(--green)'}">
            ${o.real ? 'ảnh · ' + float(o.dp, 1) + ' cm' : 'ảnh ảo · ' + float(-o.dp, 1) + ' cm'}</text>
        </g>

        <g id="optScr" style="cursor:grab">
          <rect x="${xs - 4}" y="${y - 92}" width="8" height="184" fill="var(--card)" stroke="var(--ink)" stroke-width="1.2"/>
          <rect x="${xs - 4}" y="${y - 92}" width="8" height="184" fill="var(--ink)" opacity=".05"/>
          <rect x="${xs - 14}" y="${y - 96}" width="28" height="192" fill="transparent"/>
          <g filter="url(#blurImg)">
            ${o.real ? `<rect x="${xs - Math.max(3, blur * .8)}" y="${y}" width="${Math.max(6, blur * 1.6)}" height="${Math.max(2, Math.abs(o.hi) * px)}" fill="var(--accent)" opacity="${(0.9 - Math.min(.65, blur / 22)).toFixed(2)}"/>` : ''}
          </g>
          ${o.real && sharp ? `<path d="M${xs - 6} ${y} L${xs} ${y - Math.abs(o.hi) * px} L${xs + 6} ${y}" fill="var(--accent)" opacity=".9"/>
            <circle cx="${xs}" cy="${y - Math.abs(o.hi) * px}" r="1.8" fill="var(--ink)"/>` : ''}
          <line x1="${xs}" y1="${y + 92}" x2="${xs}" y2="${y + 104}" stroke="var(--ink-3)" stroke-width="1"/>
          <text x="${xs}" y="${y - 100}" text-anchor="middle" font-family="var(--mono)" font-size="8" fill="var(--ink-3)">màn · ${float(L.dScr, 0)} cm</text>
        </g>
      </svg>
      <div class="lab-hint">Kéo <b>cây nến</b> hoặc <b>tấm màn</b> theo phương ngang. Khi màn đứng đúng vị trí ảnh, vệt sáng thu lại thành ảnh ngược chiều rõ nét.</div>
    </div>
    <aside class="lab-side">
      <div class="lab-panel">
        <span class="kicker">Số đo</span>
        <div class="lab-read">
          <div><b>${float(o.d, 1)}</b><span>cm · d</span></div>
          <div><b>${float(o.dp, 1)}</b><span>cm · d′</span></div>
          <div><b>${float(Math.abs(o.k), 2)}</b><span>× · phóng đại</span></div>
        </div>
        <div class="lab-note">${!o.real ? 'Vật trong tiêu cự: ảnh ảo, cùng chiều, lớn hơn vật, không hứng được trên màn.'
          : sharp ? 'Màn đúng vị trí ảnh: ảnh thật, ngược chiều, rõ nét. Đây là vị trí chốt số đo.'
            : 'Màn lệch ' + float(Math.abs(L.dScr - o.dp), 1) + ' cm so với vị trí ảnh nên ảnh nhoè.'}</div>
        <div class="lab-formula">1/f = 1/d + 1/d′ ⇒ 1/${float(o.d, 0)} + 1/${float(o.dp, 1)} = 1/${o.f}</div>
      </div>
      ${sheet('Đo tiêu cự thấu kính hội tụ',
        'Dịch vật và màn đến khi ảnh rõ nét, ghi d và d′, tính f rồi so với giá trị danh định.',
        'thấu kính hội tụ, nến, màn ảnh, giá quang học có thước chia đến mm.',
        ['Đặt vật cách thấu kính một khoảng lớn hơn 2f, dời màn đến khi ảnh rõ.',
         'Ghi d, d′. Lặp lại với ba vị trí khác nhau của vật.',
         'Tính f theo 1/f = 1/d + 1/d′ cho từng lần, lấy trung bình.',
         'Nhận xét: ảnh thật luôn ngược chiều; khi d giảm về f thì d′ tăng rất nhanh.'],
        'Nếu chỉ có một vị trí của màn cho ảnh rõ, vì sao vẫn nên đo ba lần? Vì mỗi lần đều có sai số đọc thước, ba lần cho giá trị trung bình đáng tin hơn.')}
    </aside>
  </div>`;
  const ctl = `<label>Tiêu cự f <input type="range" id="opF" min="8" max="24" step="1" value="${o.f}"><span id="opFV">${o.f} cm</span></label>
    <label>Khoảng cách vật d <input type="range" id="opD" min="8" max="70" step="1" value="${L.dObj}"><span id="opDV">${L.dObj} cm</span></label>
    <label>Vị trí màn <input type="range" id="opS" min="6" max="90" step="1" value="${L.dScr}"><span id="opSV">${L.dScr} cm</span></label>
    <button class="btn sm" id="opAuto">Dời màn tới ảnh</button>
    <button class="btn ghost sm" id="opRec">Ghi số liệu</button>`;
  return { body, ctl };
}

/* ---------- BÀN 03 ---------- */
function viewArch(L) {
  const a = archSolve(L);
  const S = 300, H = 54, surfY = S;
  const blockTop = (S - H) + (L.depth / 100) * H;
  const blockCy = blockTop + H / 2;
  const hookY = 196;
  const springTop = hookY, springBot = blockTop - 4;
  const springH = Math.max(12, springBot - springTop);
  const zz = Array.from({ length: 6 }, () => `l9 ${(springH / 12).toFixed(1)} l-9 ${(springH / 12).toFixed(1)}`).join(' ');
  const body = `
  <div class="lab-grid">
    <div class="lab-stage">
      <div class="lab-title"><span class="kicker">Bàn 03 · Cơ học</span><div class="lab-modes"><span class="lab-tag">lực kế lò xo · cốc chất lỏng</span></div></div>
      <svg class="lab-svg" viewBox="88 24 430 392" role="img" aria-label="Lực kế và bình chất lỏng">
        <rect width="620" height="440" fill="var(--paper)"/>
        <line x1="120" y1="40" x2="440" y2="40" stroke="var(--ink-2)" stroke-width="3"/>
        <line x1="130" y1="40" x2="130" y2="404" stroke="var(--ink-2)" stroke-width="3"/>
        <line x1="100" y1="404" x2="162" y2="404" stroke="var(--ink-2)" stroke-width="3"/>
        <g>
          <rect x="250" y="52" width="46" height="120" rx="4" fill="var(--card)" stroke="var(--ink)" stroke-width="1.5"/>
          ${Array.from({ length: 11 }, (_, i) => `<line x1="252" y1="${60 + i * 10}" x2="${i % 5 === 0 ? 266 : 259}" y2="${60 + i * 10}" stroke="var(--ink-3)" stroke-width="${i % 5 === 0 ? 1 : .7}"/>
            ${i % 5 === 0 ? `<text x="299" y="${63 + i * 10}" font-family="var(--mono)" font-size="6.5" fill="var(--ink-3)">${i === 0 ? '6' : i === 5 ? '3' : '0'}</text>` : ''}`).join('')}
          <line x1="252" y1="${60 + (a.F / 6) * 100}" x2="292" y2="${60 + (a.F / 6) * 100}" stroke="var(--accent)" stroke-width="2.2"/>
          <circle cx="273" cy="52" r="2.6" fill="var(--ink)"/>
          <text x="273" y="188" text-anchor="middle" font-family="var(--mono)" font-size="7.5" fill="var(--ink-3)">LỰC KẾ · 0–6 N</text>
          <line x1="273" y1="172" x2="273" y2="${hookY}" stroke="var(--ink-3)" stroke-width="1.2"/>
        </g>
        <path d="M273 ${springTop} ${zz}" fill="none" stroke="var(--ink-3)" stroke-width="1.4"/>
        <line x1="273" y1="${springBot}" x2="273" y2="${blockTop}" stroke="var(--ink-3)" stroke-width="1.2"/>
        <g>
          <rect x="${273 - 34}" y="${blockTop}" width="68" height="${H}" fill="var(--card-2)" stroke="var(--ink)" stroke-width="1.5"/>
          <rect x="${273 - 34}" y="${Math.max(blockTop, surfY)}" width="68" height="${Math.max(0, blockTop + H - Math.max(blockTop, surfY))}" fill="#4f7f96" opacity=".22"/>
          <text x="273" y="${blockCy + 3}" text-anchor="middle" font-family="var(--mono)" font-size="7.5" fill="var(--ink-2)">6×6×6 cm</text>
          <text x="${273}" y="${blockTop - 8}" text-anchor="middle" font-family="var(--mono)" font-size="7" fill="var(--ink-3)">ngập ${L.depth}%</text>
        </g>
        <g>
          <path d="M196 268 L196 388 Q196 396 204 396 L342 396 Q350 396 350 388 L350 268" fill="none" stroke="var(--ink)" stroke-width="1.8"/>
          <clipPath id="liqClip"><path d="M197 268 L349 268 L349 388 Q349 395 342 395 L204 395 Q197 395 197 388Z"/></clipPath>
          <rect x="197" y="${surfY}" width="152" height="${395 - surfY}" fill="#cfdbe4" opacity=".55" clip-path="url(#liqClip)"/>
          <line x1="197" y1="${surfY}" x2="349" y2="${surfY}" stroke="#7f97a8" stroke-width="1.3"/>
          <text x="356" y="${surfY + 4}" font-family="var(--mono)" font-size="8" fill="#4f6a7a">${nuocN[L.liq]}</text>
          <text x="356" y="${surfY + 17}" font-family="var(--mono)" font-size="8" fill="var(--ink-3)">D = ${a.D} kg/m³</text>
        </g>
        <defs>
          <marker id="arrB" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6" fill="var(--ink-2)"/></marker>
          <marker id="arrG" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6" fill="var(--green)"/></marker>
        </defs>
        <line x1="273" y1="${blockCy}" x2="273" y2="${blockCy + 36}" stroke="var(--ink-2)" stroke-width="1.7" marker-end="url(#arrB)"/>
        <text x="278" y="${blockCy + 42}" font-family="var(--mono)" font-size="7.5" fill="var(--ink-2)">P = ${float(a.P, 1)} N</text>
        ${a.f > .02 ? `<line x1="318" y1="${blockCy}" x2="318" y2="${blockCy - 40 * a.f}" stroke="var(--green)" stroke-width="1.7" marker-end="url(#arrG)"/>
          <text x="323" y="${blockCy - 36 * a.f}" font-family="var(--mono)" font-size="7.5" fill="var(--green)">F_A = ${float(a.FA, 2)} N</text>` : ''}
      </svg>
      <div class="lab-hint">Hạ dần vật vào chất lỏng: số chỉ lực kế giảm đúng bằng lực đẩy Archimedes. Khi vật đã ngập hoàn toàn, hạ sâu thêm cũng không đổi số chỉ.</div>
    </div>
    <aside class="lab-side">
      <div class="lab-panel">
        <span class="kicker">Số đọc</span>
        <div class="lab-read">
          <div><b>${float(a.F, 2)}</b><span>N · lực kế</span></div>
          <div><b>${float(a.FA, 2)}</b><span>N · F<sub>A</sub></span></div>
          <div><b>${float(a.P, 2)}</b><span>N · trọng lượng</span></div>
        </div>
        <div class="lab-read lab-read-2">
          <div><b>${float(a.scale, 2)}</b><span>kg · cân dưới bình</span></div>
          <div><b>${float(a.m / a.V, 0)}</b><span>kg/m³ · D suy ra</span></div>
        </div>
        <div class="lab-note">Vật <b>${a.matName}</b> · V = 216 cm³ · m = P/g = ${float(a.m, 3)} kg → D = m/V = ${float(a.m / a.V, 0)} kg/m³.
          Cân dưới bình tăng thêm đúng F<sub>A</sub>/g = ${float(a.FA / 10, 3)} kg so với khi vật chưa chạm nước.</div>
        <div class="lab-formula">F<sub>A</sub> = d·V<sub>chìm</sub> = ${a.D}·10·${float(a.V * a.f * 1e6, 0)}·10⁻⁶ = ${float(a.FA, 2)} N</div>
        <div class="lab-formula">số chỉ = P − F<sub>A</sub> = ${float(a.P, 2)} − ${float(a.FA, 2)} = <b>${float(a.F, 2)} N</b></div>
        ${a.full ? `<div class="lab-note">Vật đã chìm hoàn toàn: lực đẩy không đổi dù hạ sâu thêm, vì thể tích chiếm chỗ không tăng.</div>` : ''}
      </div>
      ${sheet('Đo lực đẩy Archimedes bằng lực kế',
        'Treo vật vào lực kế, hạ vào chất lỏng, so số chỉ trong không khí và trong chất lỏng để suy ra F_A.',
        'lực kế 0–5 N, vật kim loại đồng chất, cốc nước, cốc dầu ăn, dây treo.',
        ['Treo vật, đọc số chỉ P khi còn trong không khí.',
         'Hạ vật ngập hoàn toàn, đọc số chỉ F. Tính F_A = P − F.',
         'Làm lại với chất lỏng khác, so F_A hai lần để thấy F_A phụ thuộc khối lượng riêng chất lỏng.',
         'Từ F_A = d·V suy ra thể tích vật, kết hợp P suy ra khối lượng riêng của kim loại.'],
        'Vì sao F_A không tăng khi vật chìm sâu hơn? Vì V chìm đã đạt cực đại bằng thể tích vật, độ sâu không còn làm tăng thể tích chiếm chỗ.')}
    </aside>
  </div>`;
  const ctl = `<label>Độ ngập <input type="range" id="arD" min="0" max="100" step="1" value="${L.depth}"><span id="arDV">${L.depth}%</span></label>
    <label>Chất lỏng <select id="arL">${Object.keys(nuocD).map(k => `<option value="${k}" ${L.liq === k ? 'selected' : ''}>${nuocN[k]} · ${nuocD[k]} kg/m³</option>`).join('')}</select></label>
    <label>Vật liệu <select id="arM">${Object.keys(LAB_MAT).map(k => `<option value="${k}" ${L.mat === k ? 'selected' : ''}>${LAB_MAT[k][0]} · ${LAB_MAT[k][1]} kg/m³</option>`).join('')}</select></label>
    <button class="btn ghost sm" id="arRec">Ghi số liệu</button>`;
  return { body, ctl };
}

/* ---------- BÀN 04 ---------- */
function viewHeat(L) {
  const h = heatSolve(L);
  const col = t => (t > 50 ? 'var(--accent)' : t > 32 ? '#b08b3a' : '#5f7f94');
  const body = `
  <div class="lab-grid">
    <div class="lab-stage">
      <div class="lab-title"><span class="kicker">Bàn 04 · Nhiệt</span><div class="lab-modes"><span class="lab-tag">nhiệt lượng kế lý tưởng</span></div></div>
      <svg class="lab-svg" viewBox="130 20 480 390" role="img" aria-label="Nhiệt lượng kế">
        <rect width="620" height="400" fill="var(--paper)"/>
        <g>
          <path d="M150 130 L150 330 Q150 340 160 340 L280 340 Q290 340 290 330 L290 130" fill="none" stroke="var(--ink)" stroke-width="1.6"/>
          <path d="M152 ${340 - (L.t1 - 5) * 1.9} L288 ${340 - (L.t1 - 5) * 1.9} L288 330 Q288 338 280 338 L160 338 Q152 338 152 330Z" fill="${col(L.t1)}" opacity=".32"/>
          <line x1="152" y1="${340 - (L.t1 - 5) * 1.9}" x2="288" y2="${340 - (L.t1 - 5) * 1.9}" stroke="${col(L.t1)}" stroke-width="1.4"/>
          <rect x="208" y="56" width="24" height="140" rx="10" fill="var(--card)" stroke="var(--ink-2)" stroke-width="1.2"/>
          <rect x="213" y="${176 - (L.t1 - 5) * 1.25}" width="14" height="${(L.t1 - 5) * 1.25}" rx="7" fill="${col(L.t1)}"/>
          <circle cx="220" cy="196" r="11" fill="${col(L.t1)}" stroke="var(--ink-2)" stroke-width="1"/>
          <text x="220" y="38" text-anchor="middle" font-family="var(--mono)" font-size="10" fill="var(--ink-2)">${float(L.t1, 0)}°C</text>
          <text x="220" y="362" text-anchor="middle" font-family="var(--mono)" font-size="8.5" fill="var(--ink-3)">m₁ = ${float(L.m1 * 1000, 0)} g · c = 4200 J/kg.K</text>
        </g>
        <g>
          <path d="M350 160 L350 330 Q350 340 360 340 L480 340 Q490 340 490 330 L490 160" fill="none" stroke="var(--ink)" stroke-width="1.6"/>
          <path d="M352 ${340 - (L.t2 - 5) * 1.9} L488 ${340 - (L.t2 - 5) * 1.9} L488 330 Q488 338 480 338 L360 338 Q352 338 352 330Z" fill="${col(L.t2)}" opacity=".32"/>
          <line x1="352" y1="${340 - (L.t2 - 5) * 1.9}" x2="488" y2="${340 - (L.t2 - 5) * 1.9}" stroke="${col(L.t2)}" stroke-width="1.4"/>
          <text x="420" y="152" text-anchor="middle" font-family="var(--mono)" font-size="10" fill="var(--ink-2)">${float(L.t2, 0)}°C</text>
          <text x="420" y="362" text-anchor="middle" font-family="var(--mono)" font-size="8.5" fill="var(--ink-3)">m₂ = ${float(L.m2 * 1000, 0)} g</text>
        </g>
        <g opacity="${L.mixed ? 1 : .3}">
          <line x1="292" y1="250" x2="346" y2="250" stroke="var(--accent)" stroke-width="1.4" stroke-dasharray="5 4"/>
          <path d="M342 246 l6 4 l-6 4" fill="none" stroke="var(--accent)" stroke-width="1.4"/>
          <text x="319" y="240" text-anchor="middle" font-family="var(--mono)" font-size="7.5" fill="var(--accent)">đổ chung</text>
        </g>
        <g>
          <rect x="520" y="150" width="80" height="190" fill="var(--card)" stroke="${L.mixed ? 'var(--ink)' : 'var(--rule-2)'}" stroke-width="1.2" stroke-dasharray="${L.mixed ? 0 : '4 4'}"/>
          <rect x="523" y="${340 - (h.teq - 5) * 1.9}" width="74" height="${Math.max(0, (h.teq - 5) * 1.9)}" fill="${col(h.teq)}" opacity="${L.mixed ? .45 : .12}"/>
          <text x="560" y="142" text-anchor="middle" font-family="var(--mono)" font-size="9" fill="var(--ink-2)">${L.mixed ? float(h.teq, 1) + '°C' : '— °C'}</text>
          <text x="560" y="356" text-anchor="middle" font-family="var(--mono)" font-size="7.5" fill="var(--ink-3)">nhiệt độ cân bằng</text>
        </g>
      </svg>
      <div class="lab-hint">Đặt khối lượng và nhiệt độ hai lượng nước, bấm <b>Đổ chung</b> để xem nhiệt độ cân bằng và kiểm tra Q toả = Q thu.</div>
    </div>
    <aside class="lab-side">
      <div class="lab-panel">
        <span class="kicker">Kết quả</span>
        <div class="lab-read">
          <div><b>${L.mixed ? float(h.teq, 1) : '—'}</b><span>°C · cân bằng</span></div>
          <div><b>${L.mixed ? float(h.Q / 1000, 1) : '—'}</b><span>kJ · Q trao đổi</span></div>
          <div><b>${float(Math.abs(L.t1 - L.t2), 0)}</b><span>°C · chênh lệch</span></div>
        </div>
        ${L.mixed ? `<div class="qbars">
            <div class="qbar"><span>Q toả (nước ${h.hot === 1 ? 'nóng' : 'nguội'})</span><i style="width:100%"></i><b>${float((h.hot === 1 ? h.Q1 : h.Q2) / 1000, 1)} kJ</b></div>
            <div class="qbar thu"><span>Q thu (nước ${h.hot === 1 ? 'nguội' : 'nóng'})</span><i style="width:${(h.hot === 1 ? h.Q2 / h.Q1 : h.Q1 / h.Q2) * 100}%"></i><b>${float((h.hot === 1 ? h.Q2 : h.Q1) / 1000, 1)} kJ</b></div>
            <p class="qnote">Q toả = Q thu — nhiệt lượng kế lí tưởng không hao phí. Thực tế Q thu luôn nhỏ hơn vì cốc và môi trường hấp thụ một phần.</p>
          </div>
          <div class="lab-formula">t = (m₁t₁ + m₂t₂)/(m₁ + m₂) = ${float(h.teq, 2)} °C</div>
          <div class="lab-formula">Q toả = Q thu = m·c·Δt = <b>${float(h.Q / 1000, 1)} kJ</b></div>`
        : `<div class="lab-note">Trước khi trộn, hai lượng nước tách riêng — chưa có cân bằng nhiệt.</div>`}
      </div>
      ${sheet('Xác định nhiệt độ cân bằng',
        'Trộn hai lượng nước khác nhiệt độ, đo nhiệt độ cân bằng và kiểm tra phương trình cân bằng nhiệt.',
        'nhiệt lượng kế, nhiệt kế, cốc chia độ, nước nóng, nước nguội.',
        ['Đong m₁, đo t₁; đong m₂, đo t₂.',
         'Đổ m₂ vào nhiệt lượng kế rồi từ từ đổ m₁, khuấy nhẹ.',
         'Theo dõi nhiệt kế đến khi cột thuỷ ngân đứng yên, ghi t.',
         'So t đo được với t tính theo công thức, giải thích sai lệch do hao phí và nhiệt dung của cốc.'],
        'Vì sao phải khuấy khi trộn? Để nhiệt độ đồng đều trong toàn khối nước, nếu không nhiệt kế chỉ nhiệt độ cục bộ.')}
    </aside>
  </div>`;
  const ctl = `<label>m₁ <input type="range" id="hm1" min="50" max="600" step="10" value="${L.m1 * 1000}"><span id="hm1V">${float(L.m1 * 1000, 0)} g</span></label>
    <label>t₁ <input type="range" id="ht1" min="5" max="95" step="1" value="${L.t1}"><span id="ht1V">${L.t1}°C</span></label>
    <label>m₂ <input type="range" id="hm2" min="50" max="600" step="10" value="${L.m2 * 1000}"><span id="hm2V">${float(L.m2 * 1000, 0)} g</span></label>
    <label>t₂ <input type="range" id="ht2" min="5" max="95" step="1" value="${L.t2}"><span id="ht2V">${L.t2}°C</span></label>
    <button class="btn sm" id="hMix">Đổ chung</button>
    <button class="btn ghost sm" id="hRec">Ghi số liệu</button>`;
  return { body, ctl };
}

/* =========================================================
   SỔ GHI CHÉP DÙNG CHUNG CHO CẢ 4 BÀN
========================================================= */
function labAddLog(L, cells) {
  L.log = L.log || [];
  L.log.push({ st: L.st, at: Date.now(), cells });
  save();
}
function labNotebook(L) {
  const log = (L.log || []).slice(-14).reverse();
  return `<div class="lab-panel lab-wide lab-book">
    <div class="lab-book-h">
      <span class="kicker">Sổ ghi chép thí nghiệm · ${(L.log || []).length} dòng</span>
      <span class="lab-book-acts">
        <button class="btn ghost sm" id="logCsv">Xuất CSV</button>
        <button class="btn ghost sm" id="logClear">Xoá sổ</button>
      </span>
    </div>
    ${log.length ? `<div class="tbl-wrap"><table class="tbl lab-book-t">
      <thead><tr><th>#</th><th>Bàn</th><th>Giờ</th><th>Số liệu</th><th></th></tr></thead>
      <tbody>${log.map(x => `<tr>
        <td class="mono">${(L.log || []).length - (L.log || []).indexOf(x)}</td>
        <td>${LAB_NAME[x.st] || x.st}</td>
        <td class="mono">${new Date(x.at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
        <td class="mono">${x.cells.join(' · ')}</td>
        <td><button class="log-del" data-at="${x.at}" aria-label="xoá dòng">×</button></td></tr>`).join('')}
      </tbody></table></div>`
      : `<p class="dim" style="font-size:12px;padding:4px 0 2px">Chưa ghi dòng nào. Ở mỗi bàn, chỉnh thông số rồi bấm <b>Ghi số liệu</b> — cả bốn bàn dùng chung một sổ, xuất được ra CSV để đưa vào báo cáo.</p>`}
  </div>`;
}
function mountNotebook(L) {
  const csv = $('#logCsv');
  if (csv) csv.onclick = () => {
    const rows = [['ban', 'gio', 'so_lieu']].concat((L.log || []).map(x =>
      [LAB_NAME[x.st] || x.st, new Date(x.at).toISOString(), x.cells.join(' | ')]));
    const text = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff' + text], { type: 'text/csv;charset=utf-8' }));
    a.download = 'so-thi-nghiem.csv'; a.click(); URL.revokeObjectURL(a.href);
    toast('Đã xuất sổ ra CSV');
  };
  const clr = $('#logClear');
  if (clr) clr.onclick = () => { L.log = []; save(); paintLab(false); toast('Đã xoá sổ'); };
  $$('.log-del').forEach(b => b.onclick = () => {
    L.log = (L.log || []).filter(x => String(x.at) !== b.dataset.at); save(); paintLab(false);
  });
}

const LAB_VIEW = { dc: viewDC, opt: viewOpt, arch: viewArch, heat: viewHeat };

function renderLab() {
  const L = LAB_ST();
  $('#main').innerHTML = `<section class="wrap wide">
    ${pageHead('Phòng thí nghiệm ảo · 4 bàn thực hành',
      'Dựng bằng hình vẽ, đo bằng số thật',
      'Kéo trực tiếp trên hình: con chạy biến trở, cây nến, tấm màn, độ ngập của vật. Mỗi bàn có phiếu thực hành, số liệu ghi lại được và phần kiểm tra công thức ngay dưới.')}
    <div class="lab-tabs">${LAB_TABS.map(([k, t, s]) => `
      <button data-lab="${k}" class="${L.st === k ? 'on' : ''}"><b>${t}</b><span>${s}</span></button>`).join('')}</div>
    <div id="labBody"></div>
    <div class="lab-ctl" id="labCtl"></div>
  </section>`;
  paintLab(true);
}

function paintLab(rebuildCtl) {
  const L = LAB_ST();
  const v = LAB_VIEW[L.st](L);
  $('#labBody').innerHTML = v.body + labNotebook(L);
  mountNotebook(L);
  if (rebuildCtl) {
    $('#labCtl').innerHTML = `<span class="lab-ctl-h">Bảng điều khiển</span>${v.ctl}`;
    bindCtl();
  }
  bindStage();
}

function bindCtl() {
  const L = LAB_ST();
  $$('.lab-tabs [data-lab]').forEach(b => b.onclick = () => {
    L.st = b.dataset.lab;
    renderLab();
  });
  const on = (id, fn) => { const el = $('#' + id); if (el) el.oninput = e => fn(e.target); };
  const val = id => { const e = $('#' + id); return e ? +e.value : 0; };

  on('dcE', el => { L.E = +el.value; $('#dcEV').textContent = float(L.E, 1) + ' V'; paintLab(false); });
  on('dcRv', el => { L.Rv = +el.value; $('#dcRvV').textContent = float(L.Rv, 0) + ' Ω'; paintLab(false); });
  const rec = $('#dcRec');
  if (rec) rec.onclick = () => {
    const r = dcSolve(L);
    if (!L.sw || r.I <= 0) { toast('Đóng khoá K trước đã'); return; }
    L.rec.push({ U: r.U, I: r.I, mode: L.mode });
    labAddLog(L, [L.mode + ': U=' + float(r.U, 2) + ' V', 'I=' + float(r.I, 3) + ' A', 'R=' + float(r.U / r.I, 1) + ' Ω', 'Rv=' + float(L.Rv, 0) + ' Ω']);
    save(); paintLab(false); toast('Đã ghi điểm thứ ' + L.rec.filter(x => x.mode === L.mode).length);
  };
  const clr = $('#dcClear');
  if (clr) clr.onclick = () => { L.rec = L.rec.filter(x => x.mode !== L.mode); save(); paintLab(false); };

  const auto = $('#opAuto');
  if (auto) auto.onclick = () => {
    const o = optSolve(L);
    if (!o.real) { toast('Vật trong tiêu cự — ảnh ảo, màn không hứng được'); return; }
    L.dScr = Math.max(6, Math.min(90, Math.round(o.dp)));
    save(); paintLab(true); toast('Màn đặt tại ' + L.dScr + ' cm · ảnh rõ nét');
  };
  const orec = $('#opRec');
  if (orec) orec.onclick = () => {
    const o = optSolve(L);
    labAddLog(L, ['f=' + o.f + ' cm', 'd=' + float(o.d, 1) + ' cm', 'd′=' + float(o.dp, 1) + ' cm',
      'k=' + float(Math.abs(o.k), 2), o.real ? 'ảnh thật' : 'ảnh ảo']);
    paintLab(false); toast('Đã ghi vào sổ thí nghiệm');
  };
  on('opF', el => { L.lensF = +el.value; $('#opFV').textContent = L.lensF + ' cm'; paintLab(false); });
  on('opD', el => { L.dObj = +el.value; $('#opDV').textContent = L.dObj + ' cm'; paintLab(false); });
  on('opS', el => { L.dScr = +el.value; $('#opSV').textContent = L.dScr + ' cm'; paintLab(false); });

  on('arD', el => { L.depth = +el.value; $('#arDV').textContent = L.depth + '%'; paintLab(false); });
  const arL = $('#arL'); if (arL) arL.onchange = e => { L.liq = e.target.value; paintLab(false); };
  const arM = $('#arM'); if (arM) arM.onchange = e => { L.mat = e.target.value; paintLab(false); };
  const arRec = $('#arRec');
  if (arRec) arRec.onclick = () => {
    const a = archSolve(L);
    labAddLog(L, [nuocN[L.liq], 'ngập ' + L.depth + '%', 'P=' + float(a.P, 2) + ' N',
      'F=' + float(a.F, 2) + ' N', 'F_A=' + float(a.FA, 2) + ' N', 'cân=' + float(a.scale, 2) + ' kg']);
    paintLab(false); toast('Đã ghi vào sổ thí nghiệm');
  };

  on('hm1', el => { L.m1 = +el.value / 1000; $('#hm1V').textContent = el.value + ' g'; L.mixed = false; paintLab(false); });
  on('hm2', el => { L.m2 = +el.value / 1000; $('#hm2V').textContent = el.value + ' g'; L.mixed = false; paintLab(false); });
  on('ht1', el => { L.t1 = +el.value; $('#ht1V').textContent = el.value + '°C'; L.mixed = false; paintLab(false); });
  on('ht2', el => { L.t2 = +el.value; $('#ht2V').textContent = el.value + '°C'; L.mixed = false; paintLab(false); });
  const mix = $('#hMix');
  if (mix) mix.onclick = () => { L.mixed = true; paintLab(false); toast('Đã đổ chung · nhiệt độ cân bằng ' + float(heatSolve(L).teq, 1) + '°C'); };
  const hRec = $('#hRec');
  if (hRec) hRec.onclick = () => {
    const h = heatSolve(L);
    if (!L.mixed) { toast('Bấm “Đổ chung” trước khi ghi'); return; }
    labAddLog(L, ['m₁=' + float(L.m1 * 1000, 0) + ' g', 't₁=' + L.t1 + '°C',
      'm₂=' + float(L.m2 * 1000, 0) + ' g', 't₂=' + L.t2 + '°C', 't=' + float(h.teq, 1) + '°C',
      'Q=' + float(h.Q / 1000, 1) + ' kJ']);
    paintLab(false); toast('Đã ghi vào sổ thí nghiệm');
  };
}

/* kéo trực tiếp trên hình — nghe ở document nên sống sót qua mọi lần vẽ lại */
function bindStage() {
  const L = LAB_ST();
  const drag = (el, get, set, dir) => {
    if (!el) return;
    el.style.cursor = 'grab';
    el.onpointerdown = ev => {
      ev.preventDefault();
      el.style.cursor = 'grabbing';
      const start = ev.clientX, v0 = get();
      const move = e => {
        const svg = $('#main .lab-svg');
        if (!svg) return;
        const k = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
        set(v0 + dir * (e.clientX - start) / k);
      };
      const up = () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); paintLab(true); };
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
    };
  };
  if (L.st === 'dc') {
    const knob = $('#dcKnob');
    if (knob) {
      knob.style.cursor = 'grab';
      knob.onpointerdown = ev => {
        ev.preventDefault();
        const svg = $('#main .lab-svg'), box = svg.getBoundingClientRect();
        const toRv = cx => {
          const k = 740 / box.width;
          const x = (cx - box.left) * k;
          return Math.max(0, Math.min(20, (x - 308) / (452 - 308) * 20));
        };
        const move = e => { L.Rv = toRv(e.clientX); const s = $('#dcRv'); if (s) { s.value = L.Rv; const l = $('#dcRvV'); if (l) l.textContent = float(L.Rv, 0) + ' Ω'; } paintLab(false); };
        const up = () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); save(); };
        document.addEventListener('pointermove', move);
        document.addEventListener('pointerup', up);
      };
    }
    const sw = $('#dcSwitch');
    if (sw) sw.onclick = () => { L.sw = !L.sw; paintLab(false); };
    $$('#labBody .lab-modes [data-mode]').forEach(b => b.onclick = () => { L.mode = b.dataset.mode; paintLab(true); });
  }
  if (L.st === 'opt') {
    const svgBox = () => { const s = $('#optSvg'); return s ? s.getBoundingClientRect().width / 760 : 1; };
    drag($('#optObj'), () => L.dObj, v => {
      L.dObj = Math.min(70, Math.max(8, v)); const s = $('#opD'); if (s) s.value = Math.round(L.dObj); paintLab(false);
    }, -1);
    drag($('#optScr'), () => L.dScr, v => {
      L.dScr = Math.min(90, Math.max(6, v)); const s = $('#opS'); if (s) s.value = Math.round(L.dScr); paintLab(false);
    }, 1);
  }
}
