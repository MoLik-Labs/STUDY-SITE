/* =========================================================
   BĂNG THÍ NGHIỆM — 3 bàn tương tác kiểu PhET, tự căn hình
   refr  : khúc xạ · phản xạ toàn phần
   shadow: bóng tối · bóng nửa tối
   energy: động năng · thế năng · ma sát
   Code in English, UI in Vietnamese.
   ========================================================= */

const SIM_DEF = { st: 'refr', th1: 42, n1: 1.0, n2: 1.33, rs: 22, xo: 330, ho: 62, h0: 1.6, m: 0.5, mu: 0.25, run: false, _s: 0 };
function simState() {
  if (!state.sim) state.sim = JSON.parse(JSON.stringify(SIM_DEF));
  const s = state.sim;
  Object.keys(SIM_DEF).forEach(k => { if (s[k] === undefined) s[k] = SIM_DEF[k]; });
  return s;
}
const SIM_TABS = [
  ['refr', 'Khúc xạ', 'Tia sáng đổi hướng khi qua mặt nước'],
  ['shadow', 'Bóng tối', 'Nguồn sáng · vật cản · màn'],
  ['energy', 'Động năng', 'Dốc nghiêng · ma sát · năng lượng']
];
const SIM_MED = [['Không khí', 1.0], ['Nước', 1.33], ['Thuỷ tinh', 1.5], ['Kim cương', 2.42]];

const simNum = (x, n) => {
  if (!isFinite(x)) return '—';
  const k = n === undefined ? 2 : n;
  let t = (+x).toFixed(k);
  if (t.indexOf('.') >= 0) t = t.replace(/0+$/, '').replace(/\.$/, '');
  return t === '-0' ? '0' : t.replace('.', ',');
};

/* =========================================================
   A · KHÚC XẠ
   ========================================================= */
function simRefrBody(S) {
  const W = 720, H = 430, cy = 210, cx = 372;
  const d2r = Math.PI / 180;
  const th1 = Math.max(0, Math.min(89, +S.th1));
  const n1 = Math.max(1, Math.min(2.5, +S.n1)), n2 = Math.max(1, Math.min(2.5, +S.n2));
  const sin2 = n1 * Math.sin(th1 * d2r) / n2;
  const tir = sin2 > 1;
  const th2 = tir ? NaN : Math.asin(Math.min(1, sin2)) / d2r;
  const L = 175;
  const R = (a, side) => ({
    x: cx + side * Math.sin(a * d2r) * L,
    y: cy - Math.cos(a * d2r) * L
  });
  const R2 = (a, side) => ({
    x: cx + side * Math.sin(a * d2r) * L,
    y: cy + Math.cos(a * d2r) * L
  });
  const inc = R(th1, -1);              /* tia tới đi từ trên-trái xuống */
  const ref = R(th1, 1);               /* phản xạ lên trên-phải */
  const refr = tir ? null : R2(th2, 1);
  const nm = a => simNum(a, 0);
  const fmt = v => (+v).toFixed(2).replace('.', ',');
  const nameOf = n => Math.abs(n - 1) < 0.02 ? 'không khí' : n < 1.4 ? 'nước' : n < 1.8 ? 'thuỷ tinh' : 'kim cương';
  const crit = n1 > n2 ? Math.asin(n2 / n1) / d2r : null;
  const arc = (a, side, up, col) => {
    const r = 62, t = a * d2r;
    const ex = cx + side * Math.sin(t) * r, ey = cy - (up ? 1 : -1) * Math.cos(t) * r;
    return `<path d="M${cx} ${cy - (up ? r : -r)} A${r} ${r} 0 0 ${side > 0 ? (up ? 1 : 0) : (up ? 0 : 1)} ${ex} ${ey}" fill="none" stroke="${col}" stroke-width="1.1" opacity=".65"/>`;
  };
  const lbl = (a, side, up, text, cls) => {
    /* như hình trong sách: nhãn nằm sát pháp tuyến, hai bên trục */
    const r = 86, t = Math.min(60, a / 2) * d2r;
    const y = cy + (up ? -1 : 1) * Math.max(34, Math.cos(t) * r);
    const x = cx + (side < 0 ? -40 : 40);
    return `<text x="${x}" y="${y}" text-anchor="${side < 0 ? 'end' : 'start'}" class="${cls}">${text}</text>`;
  };

  return `<div class="sim-stage">
    <svg viewBox="0 0 ${W} ${H}" class="sim-svg" id="simSvg" role="img" aria-label="Khúc xạ ánh sáng">
      <defs>
        <linearGradient id="simWaterG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#4b93b6" stop-opacity=".20"/>
          <stop offset="1" stop-color="#4b93b6" stop-opacity=".07"/>
        </linearGradient>
        <marker id="mkInk" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" fill="var(--ink)"/></marker>
        <marker id="mkAcc" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" fill="var(--accent)"/></marker>
        <marker id="mkDim" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" fill="var(--ink-3)"/></marker>
      </defs>
      <rect width="${W}" height="${H}" fill="var(--paper)"/>
      <rect x="0" y="${cy}" width="${W}" height="${H - cy}" fill="url(#simWaterG)"/>
      <line x1="0" y1="${cy}" x2="${W}" y2="${cy}" stroke="var(--ink)" stroke-width="1.6"/>
      <text x="18" y="${cy - 14}" class="sim-lab">${nameOf(n1).toUpperCase()} · n₁ = ${fmt(n1)}</text>
      <text x="18" y="${cy + 22}" class="sim-lab">${nameOf(n2).toUpperCase()} · n₂ = ${fmt(n2)}</text>
      <line x1="${cx}" y1="${cy - 168}" x2="${cx}" y2="${cy + 168}" stroke="var(--ink-3)" stroke-width="1" stroke-dasharray="6 5" opacity=".8"/>
      <text x="${cx + 7}" y="${cy - 160}" class="sim-lab">pháp tuyến</text>

      ${arc(th1, -1, true, 'var(--ink-2)')}
      ${tir ? '' : arc(th2, 1, false, 'var(--accent)')}
      ${th1 > 4 ? arc(th1, 1, true, 'var(--ink-3)') : ''}
      ${lbl(th1, -1, true, 'i = ' + nm(th1) + '°', 'sim-val')}
      ${tir ? '' : lbl(th2, 1, false, 'r = ' + simNum(th2, 1) + '°', 'sim-val acc')}

      <line x1="${inc.x}" y1="${inc.y}" x2="${cx}" y2="${cy}" stroke="var(--ink)" stroke-width="2" marker-end="url(#mkInk)"/>
      <text x="${inc.x + 4}" y="${inc.y - 8}" class="sim-tag">tia tới</text>

      <line x1="${cx}" y1="${cy}" x2="${ref.x}" y2="${ref.y}" stroke="var(--ink-2)" stroke-width="1.6"
        stroke-dasharray="${tir ? '0' : '6 4'}" marker-end="url(#mkDim)"/>
      <text x="${ref.x + 6}" y="${ref.y - 6}" class="sim-tag dim">tia phản xạ${tir ? ' toàn phần' : ''}</text>

      ${tir ? '' : `<line x1="${cx}" y1="${cy}" x2="${refr.x}" y2="${refr.y}" stroke="var(--accent)" stroke-width="2" marker-end="url(#mkAcc)"/>
      <text x="${refr.x + 8}" y="${refr.y + 4}" class="sim-tag acc">tia khúc xạ</text>`}

      <circle cx="${cx}" cy="${cy}" r="4.2" fill="var(--ink)"/>
      <circle cx="${cx}" cy="${cy}" r="8" fill="none" stroke="var(--ink)" stroke-width=".8" opacity=".35"/>
      ${tir ? `<text x="${W / 2}" y="${H - 18}" text-anchor="middle" class="sim-warn">i &gt; góc giới hạn ${simNum(crit, 1)}° ⇒ phản xạ toàn phần, không có tia khúc xạ</text>`
      : crit !== null ? `<text x="${W - 18}" y="${H - 18}" text-anchor="end" class="sim-lab">góc giới hạn ≈ ${simNum(crit, 1)}°</text>` : ''}
    </svg>
  </div>`;
}

function simRefrCtl(S) {
  return `<div class="sim-panel">
    <span class="kicker">Thay đổi</span>
    <label class="sim-row"><span>Góc tới i</span><input type="range" id="sTh1" min="0" max="89" step="1" value="${S.th1}"><b id="sTh1V">${S.th1}°</b></label>
    <div class="kicker" style="margin-top:14px">Môi trường trên (tia tới đi ra từ đây)</div>
    <div class="sim-chips">${SIM_MED.map(([n, v]) => `<button data-n1="${v}" class="${Math.abs(S.n1 - v) < 0.01 ? 'on' : ''}">${n} · ${simNum(v, 2)}</button>`).join('')}</div>
    <div class="kicker" style="margin-top:14px">Môi trường dưới</div>
    <div class="sim-chips">${SIM_MED.map(([n, v]) => `<button data-n2="${v}" class="${Math.abs(S.n2 - v) < 0.01 ? 'on' : ''}">${n} · ${simNum(v, 2)}</button>`).join('')}</div>
    <div class="sim-btns"><button class="btn ghost sm" id="sRec">Ghi vào sổ thí nghiệm</button></div>
    <div class="sim-note" id="simNote"></div>
  </div>`;
}

/* =========================================================
   B · BÓNG TỐI
   ========================================================= */
function shadowGeom(S) {
  const W = 720, H = 420, cy = 196, xs = 96, xScr = 652;
  const rs = Math.max(1, +S.rs), xo = Math.max(180, Math.min(560, +S.xo)), ho = Math.max(12, +S.ho);
  const at = (ya, yb) => {                       /* nối (xs, ya) qua (xo, yb) tới màn */
    const t = (xScr - xs) / (xo - xs);
    return ya + (yb - ya) * t;
  };
  /* bóng tối: tia từ mép XA của nguồn qua mép vật. nửa tối: tia từ mép gần. */
  const umT = at(cy - rs, cy - ho), umB = at(cy + rs, cy + ho);
  const penT = at(cy + rs, cy - ho), penB = at(cy - rs, cy + ho);
  const hasUmBra = umT < umB;
  return { W, H, cy, xs, xScr, rs, xo, ho, penT, penB, umT, umB, hasUmBra, scale: 0.4 };
}

function simShadowBody(S) {
  const g = shadowGeom(S);
  const rays = [];
  const pts = [[g.cy - g.rs, g.cy - g.ho], [g.cy + g.rs, g.cy + g.ho], [g.cy + g.rs, g.cy - g.ho], [g.cy - g.rs, g.cy + g.ho]];
  pts.forEach(([a, b], i) => {
    const t = (g.xScr - g.xs) / (g.xo - g.xs);
    const yEnd = a + (b - a) * t;
    rays.push(`<line x1="${g.xs}" y1="${a}" x2="${g.xScr}" y2="${yEnd}" stroke="var(--accent)" stroke-width=".9" opacity="${i === 2 ? .55 : .38}"/>`);
  });
  const clipped = (v) => Math.max(40, Math.min(g.H - 40, v));
  return `<div class="sim-stage">
    <svg viewBox="0 0 ${g.W} ${g.H}" class="sim-svg" id="simSvg" role="img" aria-label="Bóng tối và bóng nửa tối">
      <rect width="${g.W}" height="${g.H}" fill="var(--paper)"/>
      <rect x="${g.xScr}" y="26" width="16" height="${g.H - 52}" fill="var(--card)" stroke="var(--ink-2)" stroke-width="1.3"/>
      <text x="${g.xScr + 8}" y="20" text-anchor="middle" class="sim-lab">màn</text>
      ${rays.join('')}
      ${g.hasUmBra ? `<rect x="${g.xScr + 1}" y="${clipped(g.penT)}" width="14" height="${Math.max(2, clipped(g.penB) - clipped(g.penT))}" fill="var(--ink)" opacity=".16"/>` : ''}
      ${g.hasUmBra ? `<rect x="${g.xScr + 1}" y="${clipped(g.umT)}" width="14" height="${Math.max(2, clipped(g.umB) - clipped(g.umT))}" fill="var(--ink)" opacity=".85"/>` : `<rect x="${g.xScr + 1}" y="${clipped(g.penT)}" width="14" height="${Math.max(2, clipped(g.penB) - clipped(g.penT))}" fill="var(--ink)" opacity=".85"/>`}
      <g id="simLamp">
        <circle cx="${g.xs}" cy="${g.cy}" r="${g.rs + 7}" fill="url(#simLampG)"/>
        <line x1="${g.xs}" y1="${g.cy - g.rs}" x2="${g.xs}" y2="${g.cy + g.rs}" stroke="var(--ink)" stroke-width="2.6" stroke-linecap="round"/>
        <text x="${g.xs}" y="${g.cy - g.rs - 14}" text-anchor="middle" class="sim-lab">nguồn sáng</text>
      </g>
      <defs><radialGradient id="simLampG"><stop offset="0" stop-color="#ffd88a" stop-opacity=".85"/><stop offset="1" stop-color="#ffd88a" stop-opacity="0"/></radialGradient></defs>
      <g id="simBlocker" style="cursor:grab">
        <rect x="${g.xo - 5}" y="${g.cy - g.ho}" width="10" height="${g.ho * 2}" fill="var(--ink)" stroke="var(--accent)" stroke-width="1.4"/>
        <rect x="${g.xo - 22}" y="${g.cy - g.ho - 10}" width="44" height="${g.ho * 2 + 20}" fill="transparent"/>
        <text x="${g.xo}" y="${g.cy + g.ho + 22}" text-anchor="middle" class="sim-tag">vật cản · kéo ngang</text>
      </g>
      <line x1="${g.xScr - 12}" y1="${clipped(g.umT)}" x2="${g.xScr - 12}" y2="${clipped(g.umB)}" stroke="var(--ink)" stroke-width="1"/>
      <text x="${g.xScr - 20}" y="${(clipped(g.umT) + clipped(g.umB)) / 2 + 3}" text-anchor="end" class="sim-tag">${simNum((g.umB - g.umT) * g.scale, 1)} cm</text>
      <line x1="${g.xScr - 12}" y1="${clipped(g.penT)}" x2="${g.xScr - 12}" y2="${clipped(g.umT)}" stroke="var(--ink-3)" stroke-width="1" stroke-dasharray="3 3"/>
      <text x="${g.xScr - 20}" y="${clipped(g.penT) - 5}" text-anchor="end" class="sim-lab">bóng nửa tối</text>
    </svg>
  </div>`;
}

function simShadowCtl(S) {
  const g = shadowGeom(S);
  return `<div class="sim-panel">
    <span class="kicker">Thay đổi</span>
    <label class="sim-row"><span>Bề rộng nguồn</span><input type="range" id="sRs" min="1" max="60" step="1" value="${S.rs}"><b id="sRsV">${S.rs} px</b></label>
    <label class="sim-row"><span>Cao vật cản</span><input type="range" id="sHo" min="12" max="110" step="1" value="${S.ho}"><b id="sHoV">${S.ho} px</b></label>
    <label class="sim-row"><span>Vị trí vật</span><input type="range" id="sXo" min="180" max="560" step="1" value="${S.xo}"><b id="sXoV">${S.xo}</b></label>
    <div class="sim-stats">
      <div><b>${g.hasUmBra ? simNum((g.umB - g.umT) * g.scale, 1) : '0'}</b><span>cm · bóng tối</span></div>
      <div><b>${simNum((g.penB - g.penT) * g.scale, 1)}</b><span>cm · bóng nửa tối</span></div>
    </div>
    <div class="sim-btns"><button class="btn ghost sm" id="sRec">Ghi vào sổ thí nghiệm</button></div>
    <div class="sim-note">Nguồn càng rộng hoặc vật càng gần màn thì <b>bóng tối nhỏ lại</b> và vùng nửa tối loe ra. Kéo nguồn về 1 px là có nguồn điểm — lúc đó chỉ còn bóng tối sắc cạnh.</div>
  </div>`;
}

/* =========================================================
   C · ĐỘNG NĂNG
   ========================================================= */
const SIM_EN = { g: 9.8, px: 85, run: 4.0, flat: 5.2, x0: 84, y1: 292 };

function simEnergySolve(S) {
  const g = SIM_EN.g;
  const h0 = Math.max(0.2, +S.h0);
  const m = Math.max(0.05, +S.m);
  const mu = Math.max(0, +S.mu);
  const d1 = SIM_EN.run;                      /* chạy ngang trên dốc (m) */
  const L1 = Math.sqrt(d1 * d1 + h0 * h0);    /* chiều dài mặt dốc (m) */
  const sinA = h0 / L1, cosA = d1 / L1;
  const L2 = SIM_EN.flat;

  const stateAt = s => {
    const onSlope = s <= L1;
    const wf = mu * m * g * (cosA * Math.min(s, L1) + Math.max(0, s - L1));
    const hh = onSlope ? h0 * (1 - s / L1) : 0;
    const ek = Math.max(0, m * g * h0 - m * g * hh - wf);
    return { s, onSlope, wf, h: hh, v: Math.sqrt(2 * ek / m), ek, et: m * g * hh };
  };
  const total = L1 + L2;
  let sStop = total, started = false;
  for (let s = 0.02; s <= total; s += 0.01) {
    const e = stateAt(s).ek;
    if (e > 0.001) started = true;
    else if (started) { sStop = s; break; }
  }
  if (!started) sStop = 0;
  if (mu === 0) sStop = total;
  return { L1, L2, d1, h0, m, mu, sinA, cosA, stateAt, sStop, E0: m * g * h0, offEnd: sStop >= total - 0.02 };
}

function simEnergyBody(S) {
  const p = simEnergySolve(S);
  const B = SIM_EN;
  const s = Math.max(0, Math.min(S._s || 0, p.sStop));
  const st = p.stateAt(s);
  const x0 = B.x0, y1 = B.y1, y0 = y1 - p.h0 * B.px;
  const x1 = x0 + p.d1 * B.px, x2 = x1 + p.L2 * B.px;
  const W = Math.round(x2 + 44), H = 420;

  const pt = (() => {
    if (s <= p.L1) { const k = s / p.L1; return { x: x0 + (x1 - x0) * k, y: y0 + (y1 - y0) * k }; }
    return { x: x1 + (s - p.L1) * B.px, y: y1 };
  })();

  const bx = 56, by = 30, barW = Math.round(Math.min(430, W - 150));
  const tot = Math.max(0.001, p.E0);
  const w1 = Math.max(0, st.ek / tot) * barW, w2 = Math.max(0, st.et / tot) * barW, w3 = Math.max(0, st.wf / tot) * barW;
  const ang = Math.atan2(p.h0, p.d1) * 180 / Math.PI;

  return `<div class="sim-stage">
    <svg viewBox="0 0 ${W} ${H}" class="sim-svg" id="simSvg" role="img" aria-label="Động năng và thế năng trên dốc">
      <rect width="${W}" height="${H}" fill="var(--paper)"/>
      <path d="M${x0} ${y0}L${x1} ${y1}H${x2}V${y1 + 34}H${x0}Z" fill="var(--rule)" opacity=".38"/>
      <path d="M${x0} ${y0}L${x1} ${y1}H${x2}" fill="none" stroke="var(--ink)" stroke-width="2"/>
      <line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y1}" stroke="var(--ink-3)" stroke-width="1" stroke-dasharray="4 4"/>
      <text x="${x0 - 10}" y="${(y0 + y1) / 2}" text-anchor="end" class="sim-tag">h₀ = ${simNum(p.h0, 1)} m</text>
      <text x="${(x0 + x1) / 2 - 34}" y="${(y0 + y1) / 2 - 12}" class="sim-lab">dốc ${simNum(ang, 0)}°</text>
      <line x1="${x1}" y1="${y1 + 12}" x2="${x2}" y2="${y1 + 12}" stroke="var(--rule-2)" stroke-width="1"/>
      <text x="${(x1 + x2) / 2}" y="${y1 + 26}" text-anchor="middle" class="sim-lab">mặt ngang ${simNum(p.L2, 1)} m</text>

      <line x1="${pt.x}" y1="${pt.y}" x2="${pt.x}" y2="${y1 + 44}" stroke="var(--rule-2)" stroke-width="1" stroke-dasharray="3 3"/>
      <g id="simBall">
        <ellipse cx="${pt.x}" cy="${pt.y - 2}" rx="12" ry="3" fill="var(--ink)" opacity=".12"/>
        <circle cx="${pt.x}" cy="${pt.y - 13}" r="13" fill="var(--accent)" opacity=".94"/>
        <circle cx="${pt.x - 4}" cy="${pt.y - 17}" r="4" fill="#fff" opacity=".32"/>
      </g>
      <text x="${pt.x}" y="${y1 + 58}" text-anchor="middle" class="sim-tag">${simNum(s, 2)} m</text>

      <text x="${bx}" y="${by}" class="sim-lab">NĂNG LƯỢNG · cơ năng ban đầu ${simNum(p.E0, 1)} J</text>
      <rect x="${bx}" y="${by + 8}" width="${barW}" height="18" fill="var(--rule)"/>
      <rect x="${bx}" y="${by + 8}" width="${w1}" height="18" fill="var(--accent)"/>
      <rect x="${bx + w1}" y="${by + 8}" width="${w2}" height="18" fill="var(--green)"/>
      <rect x="${bx + w1 + w2}" y="${by + 8}" width="${w3}" height="18" fill="var(--ink-3)" opacity=".55"/>
      <g>
        <text x="${bx}" y="${by + 40}" class="sim-tag acc">■ động năng ${simNum(st.ek, 1)} J</text>
        <text x="${bx + 196}" y="${by + 40}" class="sim-tag" fill="var(--green)">■ thế năng ${simNum(st.et, 1)} J</text>
        <text x="${bx}" y="${by + 57}" class="sim-tag dim">■ mất do ma sát ${simNum(st.wf, 1)} J</text>
        <text x="${bx + 196}" y="${by + 57}" class="sim-tag">v = ${simNum(st.v, 2)} m/s</text>
      </g>
      ${p.offEnd ? `<text x="${W - 16}" y="${H - 14}" text-anchor="end" class="sim-warn">ma sát nhỏ quá — bóng chạy hết băng</text>` : ''}
    </svg>
  </div>`;
}

function simEnergyCtl(S) {
  const p = simEnergySolve(S);
  return `<div class="sim-panel">
    <span class="kicker">Thay đổi</span>
    <label class="sim-row"><span>Khối lượng m</span><input type="range" id="sM" min="0.1" max="2" step="0.05" value="${S.m}"><b id="sMV">${simNum(S.m, 2)} kg</b></label>
    <label class="sim-row"><span>Độ cao h₀</span><input type="range" id="sH0" min="0.4" max="2" step="0.05" value="${S.h0}"><b id="sH0V">${simNum(S.h0, 2)} m</b></label>
    <label class="sim-row"><span>Ma sát μ</span><input type="range" id="sMu" min="0" max="0.6" step="0.01" value="${S.mu}"><b id="sMuV">${simNum(S.mu, 2)}</b></label>
    <div class="sim-btns">
      <button class="btn sm" id="sRun">${S.run ? '❚❚ Dừng' : '▶ Thả bóng'}</button>
      <button class="btn ghost sm" id="sReset">Về đỉnh dốc</button>
    </div>
    <div class="sim-stats">
      <div><b>${simNum(p.E0, 1)}</b><span>J · năng lượng ban đầu</span></div>
      <div><b>${simNum(p.sStop - p.L1, 1)}</b><span>m · quãng đường trên mặt ngang</span></div>
    </div>
    <div class="sim-btns"><button class="btn ghost sm" id="sRec">Ghi vào sổ thí nghiệm</button></div>
    <div class="sim-note">Thả bóng: thế năng đổi dần thành động năng, nên <b>v lớn nhất ở chân dốc</b>. Phần bị ma sát “lấy đi” hiện màu xám — bật μ = 0 thì bóng chạy mãi.</div>
  </div>`;
}

/* =========================================================
   PAGE + BIND
   ========================================================= */
const SIM_BODY = { refr: simRefrBody, shadow: simShadowBody, energy: simEnergyBody };
const SIM_CTL = { refr: simRefrCtl, shadow: simShadowCtl, energy: simEnergyCtl };

function renderSim() {
  const S = simState();
  if (S.run && S.st !== 'energy') S.run = false;
  $('#main').innerHTML = `<section class="wrap wide sim-page">
    ${pageHead('Băng thí nghiệm · ánh sáng và chuyển động', 'Kéo là thấy, số đo hiện ngay',
    'Ba bàn tương tác như phòng thí nghiệm ảo: khúc xạ qua mặt nước, bóng tối – bóng nửa tối, và bóng lăn trên dốc với động năng – thế năng. Mọi hình đều tự căn lại theo số liệu bạn đặt.')}
    <div class="lab-tabs sim-tabs">${SIM_TABS.map(([k, t, s]) => `
      <button data-sim="${k}" class="${S.st === k ? 'on' : ''}"><b>${t}</b><span>${s}</span></button>`).join('')}</div>
    <div class="sim-grid">
      <div id="simStageHost">${SIM_BODY[S.st](S)}</div>
      <div id="simCtlHost">${SIM_CTL[S.st](S)}</div>
    </div>
  </section>`;
  simBind();
}

function simPaint() {
  const S = simState();
  const host = $('#simStageHost');
  if (host) host.innerHTML = SIM_BODY[S.st](S);
  const ctl = $('#simCtlHost');
  if (ctl) ctl.innerHTML = SIM_CTL[S.st](S);
  simBind();
}

let simTimer = null;
function simStopLoop() { if (simTimer) { clearInterval(simTimer); simTimer = null; } }

function simBind() {
  const S = simState();
  simStopLoop();

  $$('.sim-tabs [data-sim]').forEach(b => b.onclick = () => {
    simStopLoop();
    S.st = b.dataset.sim; S.run = false; S._s = 0;
    save(); renderSim();
  });

  const rec = $('#sRec');
  if (rec) rec.onclick = () => {
    const L = (typeof LAB_ST === 'function') ? LAB_ST() : null;
    if (!L) { toast('Chưa mở được sổ thí nghiệm'); return; }
    let cells = [];
    if (S.st === 'refr') {
      const n1 = +S.n1, n2 = +S.n2, th = +S.th1;
      const s2 = n1 * Math.sin(th * Math.PI / 180) / n2;
      cells = ['khúc xạ · n₁=' + simNum(n1, 2) + ' · n₂=' + simNum(n2, 2),
        'i=' + simNum(th, 0) + '°', s2 <= 1 ? 'r=' + simNum(Math.asin(s2) * 180 / Math.PI, 1) + '°' : 'phản xạ toàn phần'];
    } else if (S.st === 'shadow') {
      const g = shadowGeom(S);
      cells = ['bóng · nguồn ' + simNum(S.rs, 0) + ' px', 'vật ở ' + simNum(S.xo, 0),
        'bóng tối=' + simNum((g.umB - g.umT) * g.scale, 1) + ' cm', 'nửa tối=' + simNum((g.penB - g.penT) * g.scale, 1) + ' cm'];
    } else {
      const p = simEnergySolve(S), st = p.stateAt(Math.min(S._s || 0, p.sStop));
      cells = ['dốc · m=' + simNum(S.m, 2) + ' kg', 'h₀=' + simNum(S.h0, 1) + ' m', 'μ=' + simNum(S.mu, 2),
        'Eđ=' + simNum(st.ek, 1) + ' J', 'v=' + simNum(st.v, 2) + ' m/s'];
    }
    cells.unshift('băng thí nghiệm · ' + (S.st === 'refr' ? 'khúc xạ' : S.st === 'shadow' ? 'bóng tối' : 'động năng'));
    if (typeof labAddLog === 'function') labAddLog(L, cells);
    save(); toast('Đã ghi vào sổ thí nghiệm');
  };

  const slider = (id, key, fmt) => {
    const el = $('#' + id);
    if (!el) return;
    el.oninput = () => {
      S[key] = +el.value;
      const lab = $('#' + id + 'V');
      if (lab) lab.textContent = fmt(+el.value);
      save(); simPaint();
    };
  };

  if (S.st === 'refr') {
    slider('sTh1', 'th1', v => v + '°');
    $$('[data-n1]').forEach(b => b.onclick = () => { S.n1 = +b.dataset.n1; save(); simPaint(); });
    $$('[data-n2]').forEach(b => b.onclick = () => { S.n2 = +b.dataset.n2; save(); simPaint(); });
  }

  if (S.st === 'shadow') {
    slider('sRs', 'rs', v => v + ' px');
    slider('sHo', 'ho', v => v + ' px');
    slider('sXo', 'xo', v => String(v));
    /* kéo vật cản trên hình */
    const bl = $('#simBlocker');
    if (bl) {
      bl.onpointerdown = e => {
        e.preventDefault();
        const svg = $('#simSvg');
        const move = ev => {
          const box = svg.getBoundingClientRect();
          const x = (ev.clientX - box.left) * (720 / box.width);
          S.xo = Math.max(180, Math.min(560, Math.round(x)));
          const sl = $('#sXo'); if (sl) sl.value = S.xo;
          const lb = $('#sXoV'); if (lb) lb.textContent = String(S.xo);
          simPaint();
        };
        const up = () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); save(); };
        document.addEventListener('pointermove', move);
        document.addEventListener('pointerup', up);
      };
    }
  }

  if (S.st === 'energy') {
    slider('sM', 'm', v => simNum(v, 2) + ' kg');
    slider('sH0', 'h0', v => simNum(v, 2) + ' m');
    slider('sMu', 'mu', v => simNum(v, 2));
    const run = $('#sRun'), reset = $('#sReset');
    if (reset) reset.onclick = () => { S._s = 0; S.run = false; save(); simPaint(); };
    if (run) run.onclick = () => {
      S.run = !S.run;
      if (!S.run) { save(); simPaint(); return; }
      if ((S._s || 0) >= simEnergySolve(S).sStop - 0.01) S._s = 0;
      save(); simPaint();
      const p = simEnergySolve(S);
      simTimer = setInterval(() => {
        if (!document.querySelector('#simSvg')) { simStopLoop(); return; }
        const st = simState();
        const vNow = p.stateAt(Math.max(0, Math.min(st._s || 0, p.sStop))).v;
        let s = (st._s || 0) + Math.max(0.02, vNow * 0.055);
        if (s >= p.sStop) { s = p.sStop; st.run = false; simStopLoop(); }
        st._s = s;
        const host = $('#simStageHost');
        if (host) host.innerHTML = SIM_BODY.energy(st);
        const bar = $('#sRun');
        if (bar && !st.run) bar.textContent = '▶ Thả lại';
      }, 40);
    };
  }
}

/* dọn nhịp khi rời trang */
const __simRoute = window.addEventListener('hashchange', () => {
  if (!/^#\/sim/.test(location.hash)) simStopLoop();
});
void __simRoute;
