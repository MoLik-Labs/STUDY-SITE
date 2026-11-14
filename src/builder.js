/* =========================================================
   CIRCUIT BUILDER — arbitrary series / parallel trees
   Add or remove resistors freely, nested to any depth.
   Code in English, UI in Vietnamese.
   ========================================================= */

let uidN = 0;
const uid = () => 'n' + (++uidN) + '_' + Math.random().toString(36).slice(2, 7);

const BUILD_DEFAULT = () => ({
  root: {
    id: uid(), type: 'series', children: [
      { id: uid(), type: 'R', v: 6 },
      { id: uid(), type: 'R', v: 12 },
      { id: uid(), type: 'parallel', children: [{ id: uid(), type: 'R', v: 8 }, { id: uid(), type: 'R', v: 24 }] }
    ]
  },
  U: 12, r: 0
});

function buildState() {
  if (!state.build) state.build = BUILD_DEFAULT();
  if (!state.build.root) state.build = BUILD_DEFAULT();
  return state.build;
}

/* ---------- tree helpers ---------- */
function nodeAt(root, path) {
  let n = root;
  for (const i of path) { if (!n.children) return null; n = n.children[i]; }
  return n;
}
function parentAt(root, path) { return nodeAt(root, path.slice(0, -1)); }

/* ---------- compute ---------- */
function reqOf(n) {
  if (!n) return 0;
  if (n.type === 'R') return Math.max(0, +n.v || 0);
  if (n.type === 'series') return n.children.reduce((a, c) => a + reqOf(c), 0);
  if (n.type === 'parallel') {
    const s = n.children.reduce((a, c) => a + 1 / Math.max(reqOf(c), 1e-9), 0);
    return s > 0 ? 1 / s : 0;
  }
  return 0;
}

function buildSolve(cfg) {
  const root = cfg.root;
  const Req = reqOf(root);
  const U = Math.max(0, +cfg.U || 0);
  const r = Math.max(0, +cfg.r || 0);
  const Rtot = Req + r;
  const I = Rtot > 0 ? U / Rtot : 0;
  const rows = [];
  let k = 0;
  const walk = (n, u, i, depth) => {
    if (n.type === 'R') {
      k++;
      rows.push({ n: 'R' + String(k).split('').map(d => '₁₂₃₄₅₆₇₈₉'[+d - 1] || d).join(''), R: +n.v || 0, U: u, I: i, P: u * i, depth });
      return;
    }
    if (n.type === 'series') {
      n.children.forEach(c => { const uu = i * reqOf(c); walk(c, uu, i, depth + 1); });
    } else {
      n.children.forEach(c => { const ii = reqOf(c) > 0 ? u / reqOf(c) : 0; walk(c, u, ii, depth + 1); });
    }
  };
  walk(root, I * Req, I, 0);
  return { Req, I, U, r, Rtot, rows, Uext: I * Req, P: U * I, Pload: I * I * Req };
}

/* ---------- measure + draw ---------- */
function measure(n) {
  if (n.type === 'R') return { w: 86, h: 34 };
  if (n.type === 'series') {
    const ms = n.children.map(measure);
    return {
      w: ms.reduce((a, m) => a + m.w, 0) + Math.max(0, ms.length - 1) * 30,
      h: Math.max(34, ...ms.map(m => m.h)) + 20
    };
  }
  const ms = n.children.map(measure);
  return {
    w: Math.max(70, ...ms.map(m => m.w)) + 56,
    h: ms.reduce((a, m) => a + m.h, 0) + Math.max(0, ms.length - 1) * 18
  };
}

function drawNode(n, x, y, out, names) {
  const m = measure(n);
  const cy = y + m.h / 2;
  const L = (x1, y1, x2, y2, extra) => out.push(`<path d="M${x1} ${y1}L${x2} ${y2}" stroke="var(--ink)" stroke-width="1.5" fill="none" ${extra || ''}/>`);

  if (n.type === 'R') {
    const bw = 66, bh = 26;
    out.push(`<rect x="${x + (m.w - bw) / 2}" y="${cy - bh / 2}" width="${bw}" height="${bh}" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.5"/>`);
    L(x, cy, x + (m.w - bw) / 2, cy);
    L(x + (m.w + bw) / 2, cy, x + m.w, cy);
    const nm = names.get(n.id) || 'R';
    out.push(`<text x="${x + m.w / 2}" y="${cy - 6}" text-anchor="middle" font-family="var(--mono)" font-size="10" fill="var(--ink-2)">${nm}</text>`);
    out.push(`<text x="${x + m.w / 2}" y="${cy + 18}" text-anchor="middle" font-family="var(--mono)" font-size="9.5" fill="var(--accent)">${f2(n.v)} Ω</text>`);
    return;
  }

  if (n.type === 'series') {
    let cx = x;
    n.children.forEach((c, i) => {
      const cm = measure(c);
      drawNode(c, cx, y + (m.h - cm.h) / 2, out, names);
      if (i < n.children.length - 1) L(cx + cm.w, cy, cx + cm.w + 30, cy);
      cx += cm.w + 30;
    });
    return;
  }

  // parallel: two vertical buses, children stacked
  const left = x + 14, right = x + m.w - 14;
  let yy = y;
  const cys = [];
  n.children.forEach(c => { const cm = measure(c); cys.push(yy + cm.h / 2); yy += cm.h + 18; });
  L(left, cys[0], left, cys[cys.length - 1]);
  L(right, cys[0], right, cys[cys.length - 1]);
  L(x, cy, left, cy);
  L(right, cy, x + m.w, cy);
  yy = y;
  n.children.forEach((c, i) => {
    const cm = measure(c);
    const cx = x + (m.w - cm.w) / 2;
    drawNode(c, cx, yy, out, names);
    L(left, cys[i], cx, cys[i]);
    L(cx + cm.w, cys[i], right, cys[i]);
    yy += cm.h + 18;
  });
}

function svgBuild(cfg, res) {
  const m = measure(cfg.root);
  const padX = 150, padY = 46, bottom = 86;
  const W = m.w + padX + 76, H = m.h + padY + bottom;
  const x0 = padX, y0 = padY;
  const cy = y0 + m.h / 2;
  const out = [];
  const L = (x1, y1, x2, y2) => out.push(`<path d="M${x1} ${y1}L${x2} ${y2}" stroke="var(--ink)" stroke-width="1.5" fill="none"/>`);

  const names = new Map();
  res.rows.forEach((r, i) => names.set(res.nodes[i], r.n));
  drawNode(cfg.root, x0, y0, out, names);

  // outer loop to the source
  const bx = x0 - 58, railY = y0 + m.h + 58, x1 = x0 + m.w;
  L(x0, cy, bx, cy);
  const byBat = cy + (railY - cy) / 2;
  L(bx, cy, bx, byBat - 16);
  L(bx, byBat + 16, bx, railY);
  out.push(`<path d="M${bx - 11} ${byBat - 15}v30M${bx + 11} ${byBat - 9}v18" stroke="var(--ink)" stroke-width="1.8"/>`);
  out.push(`<text x="${bx - 18}" y="${byBat + 4}" text-anchor="end" font-family="var(--mono)" font-size="10" fill="var(--ink-2)">U = ${f2(cfg.U)} V</text>`);
  if (+cfg.r > 0) out.push(`<text x="${bx - 18}" y="${byBat + 18}" text-anchor="end" font-family="var(--mono)" font-size="9" fill="var(--ink-3)">r = ${f2(cfg.r)} Ω</text>`);
  L(bx, railY, x1 + 44, railY);
  L(x1 + 44, railY, x1 + 44, cy);
  L(x1, cy, x1 + 44, cy);
  out.push(`<path d="M${(bx + x1) / 2} ${railY}l-8 -4v8z" fill="var(--accent)"/>`);
  out.push(`<text x="${(bx + x1) / 2 + 12}" y="${railY - 8}" font-family="var(--mono)" font-size="9.5" fill="var(--accent)">I = ${f3(res.I)} A</text>`);

  return `<svg viewBox="0 0 ${Math.max(520, W)} ${Math.max(240, H)}" class="calc-svg" role="img" aria-label="Sơ đồ mạch tự dựng">${out.join('')}</svg>`;
}

/* =========================================================
   UI
   ========================================================= */
function renderBuild() {
  const cfg = buildState();
  if (!state.buildName) state.buildName = 'Mạch của tôi';

  const rows = [];
  const walk = (n, path, depth) => {
    rows.push({ n, path, depth });
    if (n.children) n.children.forEach((c, i) => walk(c, path.concat(i), depth + 1));
  };
  walk(cfg.root, [], 0);

  $('#main').innerHTML = `<section class="wrap wide">
    ${pageHead('Mạch tự dựng · thêm bớt R tuỳ ý', 'Không gò bó trong bốn sơ đồ mẫu',
    'Dựng mạch bằng cách lồng các nhóm nối tiếp và song song đến bất kỳ độ sâu nào. Máy tính điện trở tương đương, dòng qua từng điện trở và vẽ lại đúng cấu trúc bạn vừa dựng.')}
    <div class="build-grid">
      <div class="build-left">
        <div class="build-tree" id="buildTree"></div>
        <div class="build-src">
          <label class="cf-row"><span class="cf-l">Hiệu điện thế nguồn</span>
            <span class="cf-in"><input type="number" step="any" data-src="U" value="${cfg.U}"><i>V</i></span></label>
          <label class="cf-row"><span class="cf-l">Điện trở trong r</span>
            <span class="cf-in"><input type="number" step="any" data-src="r" value="${cfg.r}"><i>Ω</i></span></label>
        </div>
        <div class="build-tools">
          <button class="btn ghost sm" id="bSample1">Mẫu: cầu phân áp</button>
          <button class="btn ghost sm" id="bSample2">Mẫu: 3 nhánh hỗn hợp</button>
          <button class="btn ghost sm" id="bSample3">Mẫu: cầu cân bằng</button>
          <button class="btn ghost sm" id="bClear">Xoá về 1 điện trở</button>
        </div>
      </div>
      <div class="build-right">
        <div class="calc-res" id="buildRes"></div>
        <div class="calc-fig" id="buildFig"></div>
        <div class="kicker" style="margin:20px 0 8px">Từng điện trở</div>
        <div class="tbl-wrap"><table class="tbl" id="buildTab"></table></div>
        <div class="calc-actions">
          <button class="btn" id="buildSave">Lưu vào phiếu của tôi</button>
          <a class="btn ghost" href="#/calc">Các dạng giải khác →</a>
        </div>
      </div>
    </div>
  </section>`;

  const drawTree = () => {
    const host = $('#buildTree');
    host.innerHTML = rows.map(({ n, path, depth }) => {
      const p = path.join('.');
      const isR = n.type === 'R';
      const kind = isR ? 'R' : (n.type === 'series' ? '—' : '∥');
      const label = isR ? 'Điện trở' : (n.type === 'series' ? 'Nối tiếp' : 'Song song');
      const lim = depth >= 5;
      return `<div class="brow${isR ? ' is-r' : ''}" style="padding-left:${depth * 22}px" data-p="${p}">
        <span class="bkind">${kind}</span>
        <span class="bname">${label}</span>
        ${isR ? `<input class="bval" type="number" step="any" min="0" value="${n.v}" data-v="${p}"><span class="bunit">Ω</span>` : `<span class="bcount">${n.children.length} phần tử</span>`}
        <span class="bbtns">
          ${isR ? '' : `<button data-add-r="${p}" title="Thêm điện trở">+R</button>
          <button data-add-s="${p}" title="Thêm nhóm nối tiếp" ${lim ? 'disabled' : ''}>+—</button>
          <button data-add-p="${p}" title="Thêm nhóm song song" ${lim ? 'disabled' : ''}>+∥</button>`}
          <button data-up="${p}" title="Lên" ${path.length && path[path.length - 1] > 0 ? '' : 'disabled'}>↑</button>
          <button data-dn="${p}" title="Xuống">↓</button>
          <button data-del="${p}" title="Xoá" ${path.length ? '' : 'disabled'}>×</button>
        </span>
      </div>`;
    }).join('');
    wireTree();
  };

  const refresh = () => { save(); renderBuild(); };

  const wireTree = () => {
    $$('#buildTree [data-v]').forEach(inp => inp.onchange = () => {
      const n = nodeAt(cfg.root, inp.dataset.v.split('.').map(Number));
      n.v = Math.max(0, parseFloat(inp.value.replace(',', '.')) || 0);
      refresh();
    });
    $$('#buildTree [data-add-r]').forEach(b => b.onclick = () => {
      const path = b.dataset.addR === '' ? [] : b.dataset.addR.split('.').map(Number);
      nodeAt(cfg.root, path).children.push({ id: uid(), type: 'R', v: 10 });
      refresh();
    });
    $$('#buildTree [data-add-s]').forEach(b => b.onclick = () => {
      const path = b.dataset.addS === '' ? [] : b.dataset.addS.split('.').map(Number);
      nodeAt(cfg.root, path).children.push({ id: uid(), type: 'series', children: [{ id: uid(), type: 'R', v: 10 }, { id: uid(), type: 'R', v: 10 }] });
      refresh();
    });
    $$('#buildTree [data-add-p]').forEach(b => b.onclick = () => {
      const path = b.dataset.addP === '' ? [] : b.dataset.addP.split('.').map(Number);
      nodeAt(cfg.root, path).children.push({ id: uid(), type: 'parallel', children: [{ id: uid(), type: 'R', v: 10 }, { id: uid(), type: 'R', v: 10 }] });
      refresh();
    });
    $$('#buildTree [data-del]').forEach(b => b.onclick = () => {
      const path = b.dataset.del === '' ? [] : b.dataset.del.split('.').map(Number);
      if (!path.length) return;
      const par = parentAt(cfg.root, path);
      par.children.splice(path[path.length - 1], 1);
      if (!par.children.length) {
        // keep the structure valid
        const pp = path.slice(0, -1);
        if (!pp.length) { par.children.push({ id: uid(), type: 'R', v: 10 }); }
      }
      refresh();
    });
    $$('#buildTree [data-up]').forEach(b => b.onclick = () => {
      const path = b.dataset.up.split('.').map(Number);
      const i = path[path.length - 1];
      if (i <= 0) return;
      const par = parentAt(cfg.root, path);
      [par.children[i - 1], par.children[i]] = [par.children[i], par.children[i - 1]];
      refresh();
    });
    $$('#buildTree [data-dn]').forEach(b => b.onclick = () => {
      const path = b.dataset.dn.split('.').map(Number);
      const i = path[path.length - 1];
      const par = parentAt(cfg.root, path);
      if (i >= par.children.length - 1) return;
      [par.children[i + 1], par.children[i]] = [par.children[i], par.children[i + 1]];
      refresh();
    });
  };
  drawTree();

  $$('[data-src]').forEach(inp => inp.oninput = () => {
    cfg[inp.dataset.src] = Math.max(0, parseFloat(inp.value.replace(',', '.')) || 0);
    save(); update();
  });

  const update = () => {
    const s = buildSolve(cfg);
    const names2 = new Map();
    // rebuild names each time
    const rr = s.rows.map((r, i) => Object.assign({}, r));
    $('#buildRes').innerHTML = [
      { l: 'R tương đương', v: s.Req, u: 'Ω' },
      { l: 'I toàn mạch', v: s.I, u: 'A' },
      { l: 'U hai đầu mạch', v: s.Uext, u: 'V' },
      { l: 'Công suất tiêu thụ', v: s.Pload, u: 'W' }
    ].map(o => `<div class="cr"><span class="cr-k">${o.l}</span><span class="cr-v">${f2(o.v)}<i>${o.u}</i></span></div>`).join('');
    $('#buildFig').innerHTML = `<div class="kicker">Hình vẽ tự động</div>${svgBuild(cfg, Object.assign({}, s, { nodes: nodesInOrder(cfg.root) }))}`;
    $('#buildTab').innerHTML = `<thead><tr><th>Điện trở</th><th>R (Ω)</th><th>I (A)</th><th>U (V)</th><th>P (W)</th></tr></thead>
      <tbody>${s.rows.map(r => `<tr><td>${r.n}</td><td class="mono">${f2(r.R)}</td><td class="mono">${f3(r.I)}</td><td class="mono">${f2(r.U)}</td><td class="mono">${f2(r.P)}</td></tr>`).join('')}</tbody>`;
    void names2; void rr;
  };
  update();

  const load = (obj) => { state.build = obj; save(); renderBuild(); };
  $('#bSample1').onclick = () => load({
    root: { id: uid(), type: 'series', children: [
      { id: uid(), type: 'R', v: 6 },
      { id: uid(), type: 'parallel', children: [{ id: uid(), type: 'R', v: 12 }, { id: uid(), type: 'R', v: 12 }] }
    ] }, U: 12, r: 0
  });
  $('#bSample2').onclick = () => load({
    root: { id: uid(), type: 'parallel', children: [
      { id: uid(), type: 'R', v: 6 },
      { id: uid(), type: 'series', children: [{ id: uid(), type: 'R', v: 4 }, { id: uid(), type: 'R', v: 8 }] },
      { id: uid(), type: 'R', v: 12 }
    ] }, U: 24, r: 1
  });
  $('#bSample3').onclick = () => load({
    root: { id: uid(), type: 'series', children: [
      { id: uid(), type: 'R', v: 10 },
      { id: uid(), type: 'parallel', children: [
        { id: uid(), type: 'series', children: [{ id: uid(), type: 'R', v: 20 }, { id: uid(), type: 'R', v: 30 }] },
        { id: uid(), type: 'series', children: [{ id: uid(), type: 'R', v: 30 }, { id: uid(), type: 'R', v: 20 }] }
      ] }
    ] }, U: 12, r: 0
  });
  $('#bClear').onclick = () => load({ root: { id: uid(), type: 'series', children: [{ id: uid(), type: 'R', v: 10 }] }, U: cfg.U, r: cfg.r });
  $('#buildSave').onclick = () => {
    const s = buildSolve(cfg);
    state.book = state.book || [];
    state.book.unshift({
      id: 'build', name: 'Mạch tự dựng (' + s.rows.length + ' điện trở)',
      vals: { U: cfg.U, r: cfg.r, R: s.Req },
      out: `R_tđ = ${f2(s.Req)} Ω · I = ${f3(s.I)} A · U = ${f2(cfg.U)} V`, at: Date.now()
    });
    state.book = state.book.slice(0, 30);
    save(); toast('Đã lưu vào phiếu của tôi');
  };
}

/* nodes in drawing order (for labels) */
function nodesInOrder(n, out) {
  out = out || [];
  if (n.type === 'R') { out.push(n.id); return out; }
  n.children.forEach(c => nodesInOrder(c, out));
  return out;
}
