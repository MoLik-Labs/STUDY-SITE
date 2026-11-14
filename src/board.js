/* =========================================================
   BẢNG MẠCH — gõ công thức là ra hình, kéo thả linh kiện,
   sửa giá trị ngay trên sơ đồ. Chạy offline, không API.
   Code in English, UI in Vietnamese.
   ========================================================= */

let cirUidN = 0;
const cirUid = () => 'q' + (++cirUidN).toString(36) + Math.random().toString(36).slice(2, 4);

const CIR_KIND = {
  R: { label: 'Điện trở', short: 'Điện trở', letter: 'R', val: 10 },
  L: { label: 'Bóng đèn', short: 'Đèn', letter: 'Đ', val: 6 },
  K: { label: 'Công tắc', short: 'Công tắc', letter: 'K', val: 0 },
  A: { label: 'Ampe kế', short: 'Ampe kế', letter: 'A', val: 0 },
  V: { label: 'Vôn kế', short: 'Vôn kế', letter: 'V', val: 0 }
};
const CIR_KIND_ORDER = ['R', 'L', 'K', 'A', 'V'];
const CIR_GEN = {
  pin:     { name: 'Pin', note: '1 cell 1,5 V', u: 1.5, r: 0.2 },
  battery: { name: 'Bộ pin', note: 'n cell nối tiếp', u: 1.5, r: 0.2 },
  supply:  { name: 'Nguồn điều chỉnh', note: '0–24 V, vặn liên tục', u: 12, r: 0 },
  ac:      { name: 'Nguồn xoay chiều', note: '12 V · 50 Hz', u: 12, r: 0 }
};

const cirLeaf = (k, v, name) => ({ t: 'e', id: cirUid(), k, name: name || '', v: v === undefined ? CIR_KIND[k].val : v, closed: true, probe: false });
const cirSeries = kids => ({ t: 's', id: cirUid(), kids });
const cirPar = kids => ({ t: 'p', id: cirUid(), kids });

/* ---------- walk / names ---------- */
function cirWalk(n, fn, parent, idx) {
  fn(n, parent, idx);
  if (n.kids) n.kids.forEach((c, i) => cirWalk(c, fn, n, i));
}
function cirLeaves(n, out) {
  out = out || [];
  cirWalk(n, x => { if (x.t === 'e') out.push(x); });
  return out;
}
function cirFindParent(root, id) {
  let hit = null;
  cirWalk(root, (n, p, i) => { if (n.id === id) hit = { node: n, parent: p, index: i }; });
  return hit;
}
function cirNextName(root, k, skipId) {
  const letter = CIR_KIND[k].letter;
  let max = 0;
  cirLeaves(root).forEach(l => {
    if (l.k !== k || l.id === skipId) return;
    const m = String(l.name).match(/(\d+)$/);
    if (m) max = Math.max(max, +m[1]);
  });
  return letter + (max + 1);
}

/* =========================================================
   1 · PARSER — "R1 // R2 nt R3", "(R1 nt R2) // R3", "U=12 r=1"
   ========================================================= */
function cirLex(s) {
  const out = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i], c2 = s.slice(i, i + 2);
    if (/\s/.test(c)) { i++; continue; }
    if (c === '(' || c === ')') { out.push({ k: c }); i++; continue; }
    if (c === '+') { out.push({ k: 'nt' }); i++; continue; }
    if (c === '|' || c === '∥') { out.push({ k: '//' }); i++; continue; }
    if (c2 === '//') { out.push({ k: '//' }); i += 2; continue; }
    if (/[A-Za-zĐđ]/.test(c)) {
      let j = i;
      while (j < s.length && /[A-Za-zĐđ0-9_]/.test(s[j])) j++;
      const w = s.slice(i, j), lw = w.toLowerCase();
      if (lw === 'nt' || lw === 'noitiep' || lw === 'seri' || lw === 'ser') out.push({ k: 'nt' });
      else if (lw === 'ss' || lw === 'song' || lw === 'par') out.push({ k: '//' });
      else out.push({ k: 'id', v: w });
      i = j; continue;
    }
    if (/[0-9]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9.,]/.test(s[j])) j++;
      const num = parseFloat(s.slice(i, j).replace(',', '.'));
      if (!isFinite(num)) throw new Error('Số không hợp lệ: ' + s.slice(i, j));
      out.push({ k: 'num', v: num });
      i = j; continue;
    }
    if (c === 'Ω' || c === '=' || c === ':' || c === '·') { i++; continue; }
    throw new Error('Ký tự lạ: “' + c + '”');
  }
  return out;
}

function cirKindOf(name) {
  const c = String(name)[0];
  if (c === 'Đ' || c === 'đ' || c === 'D' || c === 'd') return 'L';
  if (c === 'A' || c === 'a') return 'A';
  if (c === 'V' || c === 'v') return 'V';
  if (c === 'K' || c === 'k' || c === 'S' || c === 's') return 'K';
  return 'R';
}
function cirPrettyName(name, k) {
  const rest = String(name).replace(/^[^0-9]+/, '');
  return CIR_KIND[k].letter + (rest || '');
}

function cirParseFormula(src) {
  let s = String(src || '');
  s = s.replace(/mắc\s*nối\s*tiếp/gi, ' nt ').replace(/mắc\s*song\s*song/gi, ' // ')
    .replace(/nối\s*tiếp/gi, ' nt ').replace(/song\s*song/gi, ' // ');

  const vals = {};
  s = s.replace(/([A-Za-zĐđ][A-Za-zĐđ0-9]*)\s*=\s*(\d+(?:[.,]\d+)?)\s*(?:Ω|ohm|V|A|W)?/g, (m, name, num) => {
    const v = parseFloat(String(num).replace(',', '.'));
    vals[name] = v;
    vals[name.toLowerCase()] = v;
    return ' ';
  });

  const toks = cirLex(s);
  if (!toks.length) throw new Error('Chưa có gì để vẽ');
  let i = 0;
  const peek = () => toks[i] || { k: 'eof' };

  const leafFrom = (name, forced) => {
    const k = cirKindOf(name);
    const nm = cirPrettyName(name, k);
    const key = name in vals ? name : (name.toLowerCase() in vals ? name.toLowerCase() : null);
    const v = forced !== undefined ? forced : (key ? vals[key] : undefined);
    return cirLeaf(k, v, nm);
  };

  function parseAtom() {
    const t = peek();
    if (t.k === '(') {
      i++;
      const e = parseExpr();
      if (peek().k !== ')') throw new Error('Thiếu dấu “)”');
      i++;
      return e;
    }
    if (t.k === 'id') {
      i++;
      let forced;
      if (peek().k === 'num') { forced = peek().v; i++; }
      return leafFrom(t.v, forced);
    }
    if (t.k === 'num') { i++; return leafFrom('R', t.v); }
    if (t.k === 'eof') throw new Error('Công thức bị cụt — thiếu linh kiện');
    throw new Error('Chỗ này cần tên linh kiện (R1, Đ1, A1…) hoặc dấu “(”');
  }
  function parseTerm() {
    let left = parseAtom();
    while (peek().k === '//') { i++; left = cirPar([left, parseAtom()]); }
    return left;
  }
  function parseExpr() {
    let left = parseTerm();
    while (peek().k === 'nt') { i++; left = cirSeries([left, parseTerm()]); }
    return left;
  }

  const root = parseExpr();
  if (peek().k !== 'eof') throw new Error('Thừa ký tự ở cuối công thức');

  const flat = n => {
    if (n.t === 's' || n.t === 'p') {
      n.kids = n.kids.map(flat);
      const merged = [];
      n.kids.forEach(c => { if (c.t === n.t) merged.push(...c.kids); else merged.push(c); });
      n.kids = merged;
      if (n.kids.length === 1) return n.kids[0];
    }
    return n;
  };
  const clean = flat(root);

  const U = vals.U !== undefined ? vals.U : (vals.u !== undefined ? vals.u : 12);
  const r = vals.r !== undefined ? vals.r : 0;
  return { root: clean, U: Math.max(0, U), r: Math.max(0, r) };
}

function cirFull(n) {
  if (n.t === 'e') return n.name;
  const inner = n.kids.map(cirFull).join(n.t === 'p' ? ' // ' : ' nt ');
  return '(' + inner + ')';
}
function cirStr(n, parentT) {
  if (n.t === 'e') return n.name;
  const s = n.kids.map(k => cirStr(k, n.t)).join(n.t === 'p' ? ' // ' : ' nt ');
  /* con khác phép với cha thì bọc ngoặc cho khỏi đọc nhầm */
  return (parentT && parentT !== n.t) ? '(' + s + ')' : s;
}

/* =========================================================
   2 · PHYSICS
   ========================================================= */
function cirR(n) {
  if (n.t === 'e') {
    if (n.k === 'K') return n.closed ? 0 : Infinity;
    if (n.k === 'A') return 0;
    if (n.k === 'V') return Infinity;
    return Math.max(0, +n.v || 0);
  }
  if (n.t === 's') {
    let sum = 0;
    for (const c of n.kids) {
      const r = cirR(c);
      if (r === Infinity) return Infinity;
      sum += r;
    }
    return sum;
  }
  let inv = 0, anyFinite = false;
  for (const c of n.kids) {
    const r = cirR(c);
    if (r === Infinity) continue;
    anyFinite = true;
    if (r <= 1e-12) return 0;
    inv += 1 / r;
  }
  if (!anyFinite) return Infinity;
  return inv > 0 ? 1 / inv : Infinity;
}

function cirSolve(root, U, rInside) {
  const Req = cirR(root);
  const r = Math.max(0, +rInside || 0);
  const open = Req === Infinity;
  const shorted = !open && Req === 0 && r === 0;
  const Rt = open ? Infinity : Req + r;
  const I = open ? 0 : (Rt > 0 ? U / Rt : 0);
  const Uext = open ? 0 : I * Req;
  const byId = {};
  const rows = [];

  const walk = (n, u, i) => {
    if (n.t === 'e') {
      const R = cirR(n);
      const row = { id: n.id, node: n, name: n.name, k: n.k, R, U: u, I: i, P: u * i };
      byId[n.id] = row;
      rows.push(row);
      return;
    }
    if (n.t === 's') {
      n.kids.forEach(c => {
        const R = cirR(c);
        let Uc = i * (R === Infinity ? 0 : R);
        if (i === 0 && R === Infinity) Uc = u;
        walk(c, Uc, i);
      });
      return;
    }
    n.kids.forEach(c => {
      const R = cirR(c);
      const Ic = (R === Infinity || R <= 0) ? 0 : u / R;
      walk(c, u, Ic);
    });
  };
  walk(root, Uext, I);
  return { Req, Rt, I, Uext, r, open, shorted, byId, rows, P: Uext * I };
}

/* =========================================================
   3 · MEASURE + DRAW
   ========================================================= */
const CIR_LEAF_W = 96;
const cirMeasure = n => {
  if (n.t === 'e') return { w: CIR_LEAF_W, h: n.probe ? 92 : 46 };
  if (n.t === 's') {
    const ms = n.kids.map(cirMeasure);
    return {
      w: ms.reduce((a, m) => a + m.w, 0) + Math.max(0, ms.length - 1) * 26,
      h: Math.max(46, ...ms.map(m => m.h))
    };
  }
  const ms = n.kids.map(cirMeasure);
  return {
    w: Math.max(70, ...ms.map(m => m.w)) + 60,
    h: ms.reduce((a, m) => a + m.h, 0) + Math.max(0, ms.length - 1) * 24
  };
};

function bdNum(x) {
  if (!isFinite(x)) return '∞';
  const v = Math.abs(x) < 5e-4 ? 0 : x;
  return (typeof f2 === 'function' ? f2(v, 2) : String(v));
}

function cirSvgBody(model, sol, opt) {
  opt = opt || {};
  const m = cirMeasure(model.root);
  const W = Math.max(560, m.w + 300);          /* tự co giãn theo mạch */
  const H = 52 + m.h + 132;
  const x0 = Math.round((W - m.w) / 2), y0 = 52;  /* luôn căn giữa */
  const cyR = y0 + m.h / 2;

  const out = [];
  const flow = [];
  const flowLeaves = [];
  const geo = { rungs: [], W, H, x0, y0, rootBox: { x: x0, y: y0, w: m.w, h: m.h, cy: cyR } };

  const WIRE = 'stroke="var(--ink)" stroke-width="1.6" fill="none" stroke-linejoin="round" stroke-linecap="round"';
  const line = (xa, ya, xb, yb) => out.push(`<path d="M${xa} ${ya}L${xb} ${yb}" ${WIRE}/>`);
  const path = d => out.push(`<path d="${d}" ${WIRE}/>`);
  const txt = (x, y, s, cls, anchor) =>
    out.push(`<text x="${x}" y="${y}" text-anchor="${anchor || 'middle'}" class="${cls}">${s}</text>`);

  function drawLeaf(n, x, y, w, h, info) {
    const cy = y + h / 2;
    const cx = x + w / 2;
    const half = 30, bh = 24;
    const row = sol.byId[n.id] || { U: 0, I: 0, P: 0, R: cirR(n) };
    const Rr = row.R;
    const G = `<g class="bd-part${opt.sel === n.id ? ' sel' : ''}" data-leaf="${n.id}">`;
    out.push(G);
    out.push(`<title>${n.name} · ${CIR_KIND[n.k].label}${isFinite(Rr) ? ' · R = ' + bdNum(Rr) + ' Ω' : ' · hở mạch'} · I = ${bdNum(row.I)} A · U = ${bdNum(row.U)} V</title>`);
    out.push(`<rect class="bd-hit" x="${x + 1}" y="${cy - 23}" width="${w - 2}" height="46" fill="transparent"/>`);
    line(x, cy, cx - half, cy);
    line(cx + half, cy, x + w, cy);

    if (n.k === 'R') {
      out.push(`<rect x="${cx - half}" y="${cy - bh / 2}" width="${half * 2}" height="${bh}" rx="2" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.7"/>`);
      out.push(`<path d="M${cx - half + 6} ${cy - bh / 2}v${bh}M${cx + half - 6} ${cy - bh / 2}v${bh}" stroke="var(--rule-2)" stroke-width="1"/>`);
    } else if (n.k === 'L') {
      const glow = Math.max(0, Math.min(1.5, Math.abs(row.U) / 6));
      out.push(`<circle cx="${cx}" cy="${cy}" r="${19 + 11 * glow}" fill="url(#bdglow)" opacity="${(glow * 0.85).toFixed(2)}"/>`);
      out.push(`<circle cx="${cx}" cy="${cy}" r="14" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.7"/>`);
      out.push(`<path d="M${cx - 9.9} ${cy - 9.9}L${cx + 9.9} ${cy + 9.9}M${cx + 9.9} ${cy - 9.9}L${cx - 9.9} ${cy + 9.9}" stroke="var(--ink)" stroke-width="1.3"/>`);
    } else if (n.k === 'K') {
      out.push(`<circle cx="${cx - 22}" cy="${cy}" r="2.6" fill="var(--ink)"/>`);
      out.push(`<circle cx="${cx + 22}" cy="${cy}" r="2.6" fill="var(--ink)"/>`);
      line(cx - 22, cy, cx - 3, cy);
      line(cx + 22, cy, cx + 3, cy);
      if (n.closed) out.push(`<path d="M${cx - 22} ${cy}L${cx + 20} ${cy}" stroke="var(--ink)" stroke-width="2.6" stroke-linecap="round"/>`);
      else out.push(`<path d="M${cx - 20} ${cy - 1}L${cx + 18} ${cy - 16}" stroke="var(--ink)" stroke-width="2.6" stroke-linecap="round"/>`);
    } else {
      out.push(`<circle cx="${cx}" cy="${cy}" r="14" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.7"/>`);
      txt(cx, cy + 4.5, n.k, 'bd-letter');
    }

    txt(cx, cy - bh / 2 - 8, n.name, 'bd-name');
    let val = '';
    if (n.k === 'R' || n.k === 'L') val = bdNum(n.v) + ' Ω';
    else if (n.k === 'K') val = n.closed ? 'đóng' : 'mở';
    else if (n.k === 'A') val = bdNum(row.I) + ' A';
    else if (n.k === 'V') val = isFinite(Rr) ? bdNum(row.U) + ' V' : 'hở';
    txt(cx, cy + bh / 2 + 15, val, 'bd-val');

    if (n.probe) {
      const yv = cy + 46;
      out.push(`<path d="M${x + 8} ${cy}v${yv - cy}H${x + w - 8}V${cy}" fill="none" stroke="var(--accent)" stroke-width="1.2" stroke-dasharray="3 3"/>`);
      out.push(`<circle cx="${cx}" cy="${yv}" r="11" fill="var(--paper)" stroke="var(--accent)" stroke-width="1.5"/>`);
      txt(cx, yv + 3.6, 'V', 'bd-letter acc');
      txt(cx + 17, yv + 3.6, bdNum(row.U) + ' V', 'bd-val acc', 'start');
    }
    out.push('</g>');

    flowLeaves.push({ x, w, cy, I: row.I });
    if (info && info.rg) {
      info.rg.leafIds.push(n.id);
      if (info.direct) info.rg.items.push({ id: n.id, index: info.idx, x, w, cy, h });
    }
  }

  function draw(n, x, y, info) {
    const mm = cirMeasure(n);
    const cy = y + mm.h / 2;
    if (n.t === 'e') { drawLeaf(n, x, y, mm.w, mm.h, info); return; }
    if (n.t === 's') {
      let cx = x;
      n.kids.forEach((c, i) => {
        const cm = cirMeasure(c);
        const childInfo = info && info.rg
          ? (c.t === 'e' ? { rg: info.rg, idx: i, direct: !!info.direct } : { rg: info.rg, idx: i, direct: false })
          : null;
        if (c.t !== 'e' && info && info.rg && info.direct) {
          /* nhóm lồng: ghi một mục để thả trước/sau cả cụm */
          info.rg.items.push({ id: c.id, index: i, x: cx, w: cm.w, cy: cy, h: cm.h, group: true });
        }
        draw(c, cx, cy - cm.h / 2, childInfo);
        if (i < n.kids.length - 1) line(cx + cm.w, cy, cx + cm.w + 26, cy);
        cx += cm.w + 26;
      });
      return;
    }
    const busL = x + 30, busR = x + mm.w - 30;
    let yy = y;
    const centers = [];
    n.kids.forEach(c => { const cm = cirMeasure(c); centers.push(yy + cm.h / 2); yy += cm.h + 24; });
    line(busL, centers[0], busL, centers[centers.length - 1]);
    line(busR, centers[0], busR, centers[centers.length - 1]);
    line(x, cy, busL, cy);
    line(busR, cy, x + mm.w, cy);
    if (centers.length > 1) {
      out.push(`<circle cx="${busL}" cy="${centers[0]}" r="2" fill="var(--ink)"/>`);
      out.push(`<circle cx="${busR}" cy="${centers[0]}" r="2" fill="var(--ink)"/>`);
      out.push(`<circle cx="${busL}" cy="${centers[centers.length - 1]}" r="2" fill="var(--ink)"/>`);
      out.push(`<circle cx="${busR}" cy="${centers[centers.length - 1]}" r="2" fill="var(--ink)"/>`);
    }
    yy = y;
    n.kids.forEach((c, i) => {
      const cm = cirMeasure(c);
      const cxm = x + (mm.w - cm.w) / 2;
      if (info && info.rootLevel) {
        const rg = { chainId: c.id, items: [], leafIds: [], x: cxm, y: yy, w: cm.w, h: cm.h };
        geo.rungs.push(rg);
        if (c.t === 'e') draw(c, cxm, yy, { rg, idx: 0, direct: true });
        else if (c.t === 's') draw(c, cxm, yy, { rg, direct: true });
        else {
          rg.items.push({ id: c.id, index: 0, x: cxm, w: cm.w, cy: yy + cm.h / 2, h: cm.h, group: true });
          draw(c, cxm, yy, { rg, direct: false });
        }
      } else {
        draw(c, cxm, yy, info && info.rg ? { rg: info.rg, direct: false } : null);
      }
      line(busL, centers[i], cxm, centers[i]);
      line(cxm + cm.w, centers[i], busR, centers[i]);
      yy += cm.h + 24;
    });
  }

  const rootIsPar = model.root.t === 'p';
  if (rootIsPar) {
    draw(model.root, x0, y0, { rootLevel: true });
  } else {
    const rg = { chainId: model.root.id, items: [], leafIds: [], x: x0, y: y0, w: m.w, h: m.h, single: true };
    geo.rungs.push(rg);
    draw(model.root, x0, y0, { rg, direct: true });
  }

  /* ---- nguồn ---- */
  const sx0 = x0 - 66, sx1 = x0 + m.w + 66, yB = y0 + m.h + 66;
  const batX = (sx0 + sx1) / 2;
  path(`M${x0} ${cyR}H${sx0}V${yB}`);
  path(`M${sx1} ${yB}V${cyR}H${x0 + m.w}`);
  const gen = model.gen || { kind: 'battery', n: 2 };
  const gU = +model.U;
  if (gen.kind === 'ac') {
    line(sx0, yB, batX - 19, yB);
    line(batX + 19, yB, sx1, yB);
    out.push(`<circle cx="${batX}" cy="${yB}" r="19" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.7"/>`);
    out.push(`<path class="bd-ac" d="M${batX - 11} ${yB}q5.5 -11 11 0t11 0" fill="none" stroke="var(--accent)" stroke-width="1.7" stroke-linecap="round"/>`);
    txt(batX, yB + 32, 'U = ' + bdNum(gU) + ' V ~ ' + (gen.f || 50) + ' Hz', 'bd-src');
  } else if (gen.kind === 'supply') {
    const bw = 74, bh = 38;
    line(sx0, yB, batX - bw / 2, yB);
    line(batX + bw / 2, yB, sx1, yB);
    out.push(`<rect x="${batX - bw / 2}" y="${yB - bh / 2}" width="${bw}" height="${bh}" rx="3" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.7"/>`);
    out.push(`<rect x="${batX - bw / 2 + 8}" y="${yB - 10}" width="30" height="15" rx="1.5" fill="var(--ink)" opacity=".08"/>`);
    txt(batX - bw / 2 + 23, yB + 2, bdNum(gU) + 'V', 'bd-src');
    out.push(`<circle cx="${batX + 22}" cy="${yB}" r="7" fill="var(--card)" stroke="var(--ink-2)" stroke-width="1.4"/>`);
    out.push(`<path d="M${batX + 22} ${yB}v-5" stroke="var(--ink-2)" stroke-width="1.6" stroke-linecap="round"/>`);
    txt(batX, yB - bh / 2 - 8, 'nguồn điều chỉnh', 'bd-plate');
    txt(batX, yB + 30, 'U = ' + bdNum(gU) + ' V', 'bd-src');
  } else {
    const cells = gen.kind === 'battery' ? Math.max(1, Math.min(6, +gen.n || 2)) : 1;
    const cw = 13, span = cells * cw;
    line(sx0, yB, batX - span / 2, yB);
    line(batX + span / 2, yB, sx1, yB);
    for (let i = 0; i < cells; i++) {
      const cx = batX - span / 2 + cw * i + cw / 2;
      out.push(`<path d="M${cx - 4} ${yB - 14}v28" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round"/>`);
      out.push(`<path d="M${cx + 4} ${yB - 8}v16" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round"/>`);
    }
    txt(batX - span / 2 - 8, yB - 18, '+', 'bd-plate');
    txt(batX + span / 2 + 8, yB - 18, '−', 'bd-plate');
    txt(batX, yB + 30, (cells > 1 ? cells + ' pin · ' : '') + 'U = ' + bdNum(gU) + ' V', 'bd-src');
  }
  if (+model.r > 0) {
    const ry = (cyR + yB) / 2;
    out.push(`<rect x="${sx0 - 11}" y="${ry - 17}" width="22" height="34" rx="2" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.6"/>`);
    txt(sx0 - 18, ry + 4, 'r ' + bdNum(model.r) + ' Ω', 'bd-val', 'end');
  }

  /* ---- dòng điện chạy ---- */
  const spd = v => Math.max(0.3, Math.min(4.5, 0.6 / (0.06 + Math.abs(v))));
  const cur = sol.I;
  if (cur > 1e-6) {
    const d1 = spd(cur);
    flow.push(`<path class="bd-cur" style="--d:${d1}s" d="M${batX - 13} ${yB}H${sx0}V${cyR}H${x0 + 2}"/>`);
    flow.push(`<path class="bd-cur" style="--d:${d1}s" d="M${x0 + m.w - 2} ${cyR}H${sx1}V${yB}H${batX + 13}"/>`);
    const ax = batX + (sx1 - batX) * 0.5;
    out.push(`<path d="M${ax + 8} ${yB}l-7 -4v8z" fill="var(--accent)"/>`);
    txt(ax + 14, yB - 9, 'I = ' + bdNum(cur) + ' A', 'bd-src acc', 'start');
  }
  flowLeaves.forEach(lf => {
    if (Math.abs(lf.I) < 1e-6) return;
    const xa = Math.max(x0 + 2, lf.x - 16), xb = Math.min(x0 + m.w - 2, lf.x + lf.w + 16);
    flow.push(`<path class="bd-cur" style="--d:${spd(lf.I)}s" d="M${xa} ${lf.cy}H${xb}"/>`);
  });

  if (sol.open) txt(W / 2, H - 12, 'Mạch hở — không có dòng điện', 'bd-warn');

  const svg = `<svg viewBox="0 0 ${W} ${H}" class="bd-svg" role="img" aria-label="Sơ đồ mạch điện">
    <defs><radialGradient id="bdglow">
      <stop offset="0" stop-color="#ffcf6b" stop-opacity=".95"/>
      <stop offset=".55" stop-color="#ffb03a" stop-opacity=".45"/>
      <stop offset="1" stop-color="#ff9c1a" stop-opacity="0"/>
    </radialGradient></defs>
    ${flow.join('')}${out.join('')}
  </svg>`;
  return { svg, geo };
}

/* =========================================================
   4 · STATE
   ========================================================= */
function cirDefaultRoot() {
  return cirPar([
    cirSeries([cirLeaf('R', 6, 'R1'), cirLeaf('L', 6, 'Đ1')]),
    cirLeaf('R', 12, 'R2')
  ]);
}
/* Validate a saved circuit tree before anyone draws or solves it.
   State comes from localStorage, which any interrupted write, old version, or
   hand edit can leave malformed — a group with `kids: null` was enough to make
   #/build throw on open and stay blank. A tree that cannot be repaired is
   replaced, not patched: a wrong circuit is worse than a default one. */
function cirValidNode(n, depth) {
  if (!n || typeof n !== 'object') return false;
  if (depth > 24) return false;
  if (n.t === 'e') {
    return typeof n.k === 'string' && !!CIR_KIND[n.k];
  }
  if (n.t !== 's' && n.t !== 'p') return false;
  if (!Array.isArray(n.kids) || !n.kids.length) return false;
  return n.kids.every(k => cirValidNode(k, depth + 1));
}

function cirModel() {
  if (!state.cir || !state.cir.root) state.cir = { U: 12, r: 0, root: cirDefaultRoot() };
  const c = state.cir;
  if (!isFinite(+c.U)) c.U = 12;
  if (!isFinite(+c.r)) c.r = 0;
  if (!c.gen) c.gen = { kind: 'battery', n: 2, f: 50 };
  if (!CIR_GEN[c.gen.kind]) c.gen.kind = 'battery';
  if (!cirValidNode(c.root, 0)) c.root = cirDefaultRoot();
  return c;
}
let cirSel = null;
let cirGeo = null;
let cirHist = [], cirFuture = [];

function cirSnapshot() {
  const c = cirModel();
  cirHist.push(JSON.stringify({ U: c.U, r: c.r, root: c.root }));
  if (cirHist.length > 40) cirHist.shift();
  cirFuture = [];
}
function cirRestore(json) {
  const o = JSON.parse(json);
  const c = cirModel();
  c.U = o.U; c.r = o.r; c.root = o.root;
  cirSel = null;
  save(); cirPaint();
}

/* =========================================================
   5 · PAGE
   ========================================================= */
function cirToolIcon(k) {
  const W = 58, H = 26, cy = 13, ink = 'var(--ink)';
  const lead = (a, b) => `<path d="M${a} ${cy}H${b}" stroke="${ink}" stroke-width="1.5" stroke-linecap="round"/>`;
  let body = '';
  if (k === 'R') {
    lead(2, 16); lead(42, 56);
    body = `<rect x="16" y="6" width="26" height="14" rx="2" fill="var(--paper)" stroke="${ink}" stroke-width="1.6"/>`;
  } else if (k === 'L') {
    lead(2, 20); lead(38, 56);
    body = `<circle cx="29" cy="13" r="9.5" fill="var(--paper)" stroke="${ink}" stroke-width="1.6"/>
      <path d="M22.5 6.5l13 13M35.5 6.5l-13 13" stroke="${ink}" stroke-width="1.2"/>`;
  } else if (k === 'K') {
    lead(2, 20); lead(38, 56);
    body = `<circle cx="20" cy="13" r="2.4" fill="${ink}"/><circle cx="38" cy="13" r="2.4" fill="${ink}"/>
      <path d="M22 12L38 3" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>`;
  } else {
    lead(2, 18); lead(40, 56);
    body = `<circle cx="29" cy="13" r="11" fill="var(--paper)" stroke="${ink}" stroke-width="1.6"/>
      <text x="29" y="17" text-anchor="middle" font-family="var(--mono)" font-size="10" fill="${ink}">${k}</text>`;
  }
  return `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">${body}</svg>`;
}

function renderBoard() {
  const c = cirModel();
  const samples = ['R1 // R2 nt R3', '(R1 nt R2) // R3', 'R1 // (R2 nt R3)', 'R1 nt R2 nt R3', '(R1 // R2) nt (R3 // R4)'];

  $('#main').innerHTML = `<section class="wrap wide bd-page">
    ${pageHead('Bảng mạch · gõ công thức hay kéo thả', 'Một dòng công thức, cả sơ đồ hiện ra',
    'Gõ như trong vở — <b>nt</b> là nối tiếp, <b>//</b> là song song, ngoặc tròn để nhóm, U= và r= cho nguồn. Hoặc kéo linh kiện từ ô bên trái thả vào bảng; bấm vào linh kiện để sửa giá trị ngay trên hình.')}

    <div class="bd-formula">
      <div class="kicker">Công thức mạch</div>
      <div class="bd-fbox" id="bdFbox">
        <input id="bdF" value="" spellcheck="false" autocomplete="off" autocapitalize="off"
               placeholder="R1 // R2 nt R3" aria-label="Công thức mạch điện">
        <button class="btn sm" id="bdApply">Vẽ</button>
      </div>
      <div class="bd-hint">
        <span id="bdRead" class="bd-read"></span>
        <span class="bd-eg">Thử: ${samples.map(s => `<button data-eg="${s}">${s}</button>`).join('')}</span>
      </div>
      <div class="bd-err" id="bdErr" role="status"></div>
    </div>

    <div class="bd-grid">
      <aside class="bd-pal" aria-label="Hộp linh kiện">
        <div class="kicker">Kéo xuống bảng</div>
        <div class="bd-tools">
          ${CIR_KIND_ORDER.map(k => `<button class="bd-tool" data-tool="${k}" title="Kéo ${CIR_KIND[k].label.toLowerCase()} vào bảng">
            ${cirToolIcon(k)}<span>${CIR_KIND[k].label}</span></button>`).join('')}
        </div>
        <div class="kicker" style="margin-top:16px">Nguồn điện</div>
        <div class="bd-gens">
          ${Object.keys(CIR_GEN).map(k => `<button data-gen="${k}" class="${(c.gen || {}).kind === k ? 'on' : ''}" title="${CIR_GEN[k].note}">${CIR_GEN[k].name}</button>`).join('')}
        </div>
        <label class="bd-field"><span>U</span><input id="bdU" type="number" step="any" min="0" value="${c.U}"><i>V</i></label>
        <label class="bd-field"><span>r</span><input id="bdRin" type="number" step="any" min="0" value="${c.r}"><i>Ω</i></label>
        <div class="bd-genx" id="bdGenX"></div>
        <div class="bd-tips">Mẹo: kéo <b>V</b> thả lên một điện trở để mắc vôn kế song song. Bấm vào công tắc để đóng/mở.</div>
      </aside>

      <div class="bd-stage">
        <div class="bd-board" id="bdBoard">
          <div id="bdCanvas"></div>
          <div class="bd-trash" id="bdTrash" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
            <span>Thả để xoá</span>
          </div>
        </div>
        <div class="bd-toolbar">
          <button class="bd-btn" id="bdUndo" title="Hoàn tác (Ctrl+Z)">↶ Hoàn tác</button>
          <button class="bd-btn" id="bdRedo" title="Làm lại">↷</button>
          <button class="bd-btn" id="bdClear">Xoá hết</button>
          <button class="bd-btn" id="bdTidy" title="Tự căn lại sơ đồ cho gọn">Tự căn lại</button>
          <span class="bd-scrollhint">← vuốt ngang để xem hết sơ đồ →</span>
          <span class="bd-sp"></span>
          <button class="bd-btn" id="bdSvgt">Tải hình SVG</button>
          <button class="bd-btn" id="bdSaveBook">Lưu vào phiếu</button>
          <a class="bd-btn" href="#/builder" title="Dựng mạch lồng nhau không giới hạn độ sâu">Mạch lồng nhau →</a>
        </div>
      </div>
    </div>

    <div class="bd-outs" id="bdOuts"></div>
    <div class="bd-tablewrap"><div class="kicker">Từng linh kiện</div><div class="tbl-wrap"><table class="tbl" id="bdTab"></table></div></div>
    <div class="bd-notes" id="bdNotes"></div>
  </section>`;

  $('#bdF').value = cirStr(c.root);
  cirPaint();
  cirBind();
}

function cirPaint(opt) {
  opt = opt || {};
  const c = cirModel();
  const sol = cirSolve(c.root, c.U, c.r);
  const { svg, geo } = cirSvgBody(c, sol, { sel: cirSel });
  const host = $('#bdCanvas');
  if (!host) return;
  host.innerHTML = svg;
  if (opt.settle) {
    host.classList.remove('settle');
    void host.offsetWidth;
    host.classList.add('settle');
  }
  cirGeo = geo;

  const kpi = [
    { l: 'R tương đương', v: sol.Req, u: 'Ω' },
    { l: 'I toàn mạch', v: sol.I, u: 'A' },
    { l: 'U hai đầu mạch', v: sol.Uext, u: 'V' },
    { l: 'Công suất', v: sol.P, u: 'W' }
  ];
  const outs = $('#bdOuts');
  if (outs) outs.innerHTML = kpi.map(o =>
    `<div class="bd-kpi"><span>${o.l}</span><b>${isFinite(o.v) ? bdNum(o.v) : '∞'}<i>${o.u}</i></b></div>`).join('');

  const tab = $('#bdTab');
  if (tab) {
    const rows = sol.rows.filter(r => r.k !== 'V');
    cirLeaves(c.root).filter(l => l.probe && l.k !== 'V').forEach(l => {
      const rr = sol.byId[l.id];
      if (rr) rows.push({ id: 'pv_' + l.id, name: 'V kế ' + l.name, k: 'V', R: Infinity, U: rr.U, I: 0, P: 0, probe: true });
    });
    tab.innerHTML = `<thead><tr><th>Linh kiện</th><th>R (Ω)</th><th>I (A)</th><th>U (V)</th><th>P (W)</th><th>Số chỉ</th></tr></thead>
      <tbody>${rows.map(r => `<tr><td><b>${r.name}</b> <span class="bd-kind">${CIR_KIND[r.k].short}</span></td>
        <td class="mono">${isFinite(r.R) ? bdNum(r.R) : '∞'}</td>
        <td class="mono">${bdNum(r.I)}</td><td class="mono">${bdNum(r.U)}</td><td class="mono">${bdNum(r.P)}</td>
        <td class="mono">${r.k === 'A' ? bdNum(r.I) + ' A' : r.k === 'V' ? bdNum(r.U) + ' V' : '—'}</td></tr>`).join('')}</tbody>`;
  }

  const read = $('#bdRead');
  if (read) read.innerHTML = 'Máy hiểu: <b>' + cirFull(c.root) + '</b>';
  const fin = $('#bdF');
  if (fin && document.activeElement !== fin) fin.value = cirStr(c.root);

  const notes = [];
  if (sol.open) notes.push('Mạch hở: có công tắc mở hoặc vôn kế mắc nối tiếp nên dòng điện bằng 0.');
  if (sol.shorted) notes.push('Ngắn mạch: điện trở tương đương bằng 0 — thực tế sẽ cháy nguồn, đừng làm thật.');
  cirLeaves(c.root).forEach(l => {
    if (l.k !== 'L') return;
    const rr = sol.byId[l.id];
    if (rr && Math.abs(rr.U) > 1.15 * 6) notes.push(`<b>${l.name}</b> chịu ${bdNum(rr.U)} V — quá định mức 6 V, bóng dễ cháy.`);
  });
  const nn = $('#bdNotes');
  if (nn) nn.innerHTML = notes.map(n => `<p class="bd-note">${n}</p>`).join('');
}

/* =========================================================
   6 · INTERACTION
   ========================================================= */
function cirBind() {
  const model = cirModel();
  document.body.classList.remove('bd-live');

  const inp = $('#bdF');
  const apply = () => {
    try {
      const p = cirParseFormula(inp.value);
      cirSnapshot();
      model.root = p.root; model.U = p.U; model.r = p.r;
      $('#bdErr').textContent = '';
      $('#bdFbox').classList.remove('err');
      const uu = $('#bdU'); if (uu) uu.value = model.U;
      const rr = $('#bdRin'); if (rr) rr.value = model.r;
      save(); cirPaint();
    } catch (e) {
      $('#bdErr').textContent = '⚠ ' + e.message;
      $('#bdFbox').classList.add('err');
    }
  };
  inp.oninput = apply;
  inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); apply(); inp.blur(); } };
  $('#bdApply').onclick = apply;
  $$('[data-eg]').forEach(b => b.onclick = () => { inp.value = b.dataset.eg; apply(); });

  const updSrc = () => {
    const u = parseFloat(String($('#bdU').value).replace(',', '.'));
    const r = parseFloat(String($('#bdRin').value).replace(',', '.'));
    model.U = isFinite(u) && u >= 0 ? u : 0;
    model.r = isFinite(r) && r >= 0 ? r : 0;
    save(); cirPaint();
  };
  $('#bdU').oninput = updSrc;
  $('#bdRin').oninput = updSrc;

  const paintGenX = () => {
    const host = $('#bdGenX');
    if (!host) return;
    const g = model.gen || (model.gen = { kind: 'battery', n: 2, f: 50 });
    if (g.kind === 'battery') {
      host.innerHTML = `<label class="bd-field"><span>n</span><input id="bdGenN" type="number" step="1" min="1" max="6" value="${g.n || 2}"><i>pin</i></label>
        <p class="bd-gentip">${(g.n || 2)} pin nối tiếp ⇒ ${bdNum(1.5 * (g.n || 2))} V. Đổi n là U tự nhảy theo.</p>`;
      const el = $('#bdGenN');
      if (el) el.oninput = () => {
        g.n = Math.max(1, Math.min(6, Math.round(+el.value || 1)));
        model.U = +(1.5 * g.n).toFixed(2);
        const u = $('#bdU'); if (u) u.value = model.U;
        save(); cirPaint();
        paintGenX();
      };
    } else if (g.kind === 'ac') {
      host.innerHTML = `<label class="bd-field"><span>f</span><input id="bdGenF" type="number" step="1" min="1" max="100" value="${g.f || 50}"><i>Hz</i></label>
        <p class="bd-gentip">Điện xoay chiều: số đo là giá trị hiệu dụng, đèn sáng nhấp nháy theo tần số.</p>`;
      const el = $('#bdGenF');
      if (el) el.oninput = () => {
        g.f = Math.max(1, Math.min(100, Math.round(+el.value || 50)));
        save(); cirPaint();
      };
    } else if (g.kind === 'pin') {
      host.innerHTML = `<p class="bd-gentip">Một pin 1,5 V. Muốn nhiều pin thì chọn “Bộ pin”.</p>`;
    } else {
      host.innerHTML = `<p class="bd-gentip">Vặn U từ 0 đến 24 V, r từ 0 đến 2 Ω — đúng như nguồn trong phòng thực hành.</p>`;
    }
  };
  paintGenX();
  $$('[data-gen]').forEach(b => b.onclick = () => {
    const k = b.dataset.gen;
    if (!CIR_GEN[k]) return;
    cirSnapshot();
    model.gen = model.gen || { n: 2, f: 50 };
    model.gen.kind = k;
    if (k === 'pin') { model.U = 1.5; model.r = 0.2; }
    if (k === 'battery') { model.gen.n = model.gen.n || 2; model.U = +(1.5 * model.gen.n).toFixed(2); model.r = +(0.2 * model.gen.n).toFixed(2); }
    if (k === 'supply') { model.U = Math.min(24, model.U || 12); model.r = 0; }
    if (k === 'ac') { model.U = 12; model.r = 0; }
    $$('[data-gen]').forEach(x => x.classList.toggle('on', x === b));
    const u = $('#bdU'); if (u) u.value = model.U;
    const r = $('#bdRin'); if (r) r.value = model.r;
    save(); cirPaint(); paintGenX();
    toast(CIR_GEN[k].name + ' · U = ' + bdNum(model.U) + ' V');
  });

  $('#bdTidy').onclick = () => {
    cirTidy();
  };

  $$('.bd-tool').forEach(t => {
    t.addEventListener('pointerdown', e => {
      e.preventDefault();
      cirStartDrag(e, { mode: 'new', kind: t.dataset.tool, label: CIR_KIND[t.dataset.tool].label });
    });
    /* bàn phím: Tab tới rồi Enter là thêm vào cuối nhánh đầu */
    t.addEventListener('click', e => {
      if (e.detail !== 0) return;
      cirSnapshot();
      cirInsertNew(t.dataset.tool, { mode: 'rung', chainId: (cirGeo.rungs[0] || {}).chainId, index: 1e9 });
      save(); cirPaint();
    });
  });

  $('#bdCanvas').addEventListener('dblclick', e => {
    const g = e.target.closest('[data-leaf]');
    if (!g) return;
    e.preventDefault();
    cirSelect(g.dataset.leaf);
    const vn = document.querySelector('#bdVn');
    if (vn) { vn.focus(); vn.select(); }
  });
  $('#bdCanvas').addEventListener('pointerdown', e => {
    const g = e.target.closest('[data-leaf]');
    if (!g) return;
    const id = g.dataset.leaf;
    const hit = cirFindParent(model.root, id);
    if (!hit) return;
    e.preventDefault();
    cirStartDrag(e, { mode: 'move', leafId: id, kind: hit.node.k, label: hit.node.name });
  });

  $('#bdUndo').onclick = () => {
    if (!cirHist.length) { toast('Không còn gì để hoàn tác'); return; }
    const c = cirModel();
    cirFuture.push(JSON.stringify({ U: c.U, r: c.r, root: c.root }));
    cirRestore(cirHist.pop());
  };
  $('#bdRedo').onclick = () => {
    if (!cirFuture.length) { toast('Không có bước nào để làm lại'); return; }
    const c = cirModel();
    cirHist.push(JSON.stringify({ U: c.U, r: c.r, root: c.root }));
    cirRestore(cirFuture.pop());
  };
  $('#bdClear').onclick = () => {
    cirSnapshot();
    model.root = cirSeries([cirLeaf('R', 10, 'R1')]);
    cirSel = null;
    save(); cirPaint(); cirClosePop();
    toast('Đã xoá về một điện trở');
  };
  $('#bdSvgt').onclick = () => {
    const svg = $('#bdCanvas svg');
    if (!svg) return;
    const clone = svg.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', '900');
    clone.setAttribute('height', String(Math.round(900 * (cirGeo.H / cirGeo.W))));
    const css = `text{font-family:'JetBrains Mono',ui-monospace,monospace}
.bd-name{font-size:10px;fill:#6b6a63}.bd-val{font-size:9.5px;fill:#b3402f}
.bd-letter{font-size:11px;fill:#17150f;font-weight:600}.bd-src{font-size:10px;fill:#17150f}
.bd-plate{font-size:9px;fill:#6b6a63}.bd-warn{font-size:10px;fill:#b3402f}
.bd-cur{display:none}.bd-hit{display:none}`;
    clone.insertAdjacentHTML('afterbegin', `<style>${css}</style>`);
    const text = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([text], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mach-' + Date.now() + '.svg';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast('Đã tải hình SVG');
  };
  $('#bdSaveBook').onclick = () => {
    const sol = cirSolve(model.root, model.U, model.r);
    state.book = state.book || [];
    state.book.unshift({
      id: 'board', name: 'Bảng mạch · ' + cirLeaves(model.root).length + ' linh kiện',
      vals: { U: model.U, r: model.r, R: sol.Req, I: sol.I },
      out: cirStr(model.root) + ' — R_tđ = ' + bdNum(sol.Req) + ' Ω · I = ' + bdNum(sol.I) + ' A',
      at: Date.now()
    });
    state.book = state.book.slice(0, 30);
    save(); toast('Đã lưu vào phiếu của tôi');
  };

  document.addEventListener('pointerdown', e => {
    const pop = document.querySelector('#bdPop');
    if (!pop) return;
    if (pop.contains(e.target)) return;
    if (e.target.closest && e.target.closest('[data-leaf]')) return;
    if (e.target.closest && e.target.closest('.bd-tool')) return;
    cirClosePop();
  }, true);

  document.onkeydown = e => {
    if (!document.querySelector('#bdCanvas')) return;
    const tgt = e.target || {};
    if (/INPUT|TEXTAREA|SELECT/.test(tgt.tagName || '')) return;
    if ((e.ctrlKey || e.metaKey) && String(e.key).toLowerCase() === 'z') {
      e.preventDefault();
      (e.shiftKey ? $('#bdRedo') : $('#bdUndo')).click();
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && cirSel) {
      e.preventDefault();
      cirDeleteSelected();
    } else if (e.key === 'Escape') {
      cirClosePop();
    }
  };
}

/* ---------- tự căn lại ---------- */
function cirTidy(silent) {
  const c = cirModel();
  /* 1 · dọn cây: gộp nhóm cùng phép, bỏ nhóm rỗng, bọc nhánh một phần tử */
  /* Collapse a group that holds exactly one child.
     The first version was `while (n.kids.length === 1) n = n.kids[0]`, which
     after one step assigns a LEAF to n — leaves have no `kids`, so the next
     iteration read `.length` off undefined and threw. Reachable in two clicks:
     "Xoá hết" leaves a series with one resistor, then "Tự căn lại" crashes.
     Re-check the type before touching kids at all. */
  const clean = n => {
    if (!n || n.t === 'e') return n;
    n.kids = (n.kids || []).map(clean).filter(Boolean);
    const merged = [];
    n.kids.forEach(k => {
      if (!k) return;
      /* splice a same-type child's children in place, but only if it has any:
         an empty group merged into its parent would still be a group with
         nothing in it, which is the case that produced empty branches. */
      if (k.t === n.t && Array.isArray(k.kids) && k.kids.length) merged.push(...k.kids);
      else merged.push(k);
    });
    n.kids = merged;
    while (n.t !== 'e' && Array.isArray(n.kids) && n.kids.length === 1) n = n.kids[0];
    return n;
  };
  c.root = clean(c.root) || cirLeaf('R', 10, 'R1');
  if (!c.root || (c.root.t !== 'e' && !(c.root.kids && c.root.kids.length))) {
    c.root = cirLeaf('R', 10, 'R1');
  }
  /* 2 · đánh số lại tên cho liền mạch: R1, R2… Đ1… A1… */
  const counters = {};
  cirWalk(c.root, n => {
    if (n.t !== 'e') return;
    const k = n.k;
    counters[k] = (counters[k] || 0) + 1;
    n.name = CIR_KIND[k].letter + counters[k];
  });
  /* 3 · bỏ vôn kế thừa (đã gỡ khỏi mọi điện trở) */
  cirWalk(c.root, (n, p, i) => {
    if (n.t === 'e' && n.k === 'V' && p && !n.probe) {
      /* giữ nguyên: vôn kế nối tiếp vẫn là bài học */
    }
    void p; void i;
  });
  save();
  cirSelectedReset();
  cirPaint({ settle: true });
  if (!silent) toast('Đã căn lại: ' + cirLeaves(c.root).length + ' linh kiện, tên đánh lại từ đầu');
}
function cirSelectedReset() { cirSel = null; const p = $('#bdPop'); if (p) p.remove(); }

/* ---------- chọn + bảng sửa nhanh ---------- */
function cirSelect(id) {
  cirSel = id;
  cirPaint({ sel: id });
  cirOpenPop(id);
}
function cirClosePop() {
  const p = $('#bdPop');
  if (p) p.remove();
  cirSel = null;
  cirPaint();
}
function cirDeleteSelected() {
  const c = cirModel();
  const hit = cirFindParent(c.root, cirSel);
  if (!hit || !hit.parent) { toast('Không xoá được phần tử gốc'); return; }
  cirSnapshot();
  hit.parent.kids.splice(hit.index, 1);
  if (!hit.parent.kids.length) {
    if (hit.parent === c.root) hit.parent.kids.push(cirLeaf('R', 10, 'R1'));
    else hit.parent.kids.push(cirLeaf('R', 10, cirNextName(c.root, 'R')));
  }
  cirSel = null;
  const pop = $('#bdPop'); if (pop) pop.remove();
  save(); cirPaint();
  toast('Đã xoá linh kiện');
}
function cirOpenPop(id) {
  const old = $('#bdPop');
  if (old) old.remove();
  const c = cirModel();
  const hit = cirFindParent(c.root, id);
  if (!hit || hit.node.t !== 'e') return;
  const n = hit.node;

  const g = document.querySelector(`[data-leaf="${id}"]`);
  const rect = g ? g.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, bottom: innerHeight / 2 };
  const pop = document.createElement('div');
  pop.className = 'bd-pop';
  pop.id = 'bdPop';
  pop.innerHTML = `
    <div class="bd-pop-h"><b>${n.name}</b><span>${CIR_KIND[n.k].label}</span><button class="bd-x" aria-label="Đóng">×</button></div>
    <div class="bd-kinds">${CIR_KIND_ORDER.map(k => `<button data-k="${k}" class="${k === n.k ? 'on' : ''}">${CIR_KIND[k].label}</button>`).join('')}</div>
    ${(n.k === 'R' || n.k === 'L') ? `
      <div class="bd-slide"><input type="range" min="0.5" max="100" step="0.5" value="${n.v}" id="bdVr"><input type="number" step="any" min="0" value="${n.v}" id="bdVn"><i>Ω</i></div>` : ''}
    ${n.k === 'K' ? `<button class="bd-switch ${n.closed ? 'on' : ''}" id="bdSw">${n.closed ? 'Đang ĐÓNG — bấm để mở' : 'Đang MỞ — bấm để đóng'}</button>` : ''}
    ${n.k === 'V' ? `<p class="bd-pophint">Vôn kế mắc nối tiếp sẽ chặn dòng. Kéo nó lên một điện trở để đo song song.</p>` : ''}
    <div class="bd-pop-f"><button id="bdL">◀</button><button id="bdRt">▶</button><button id="bdDel" class="danger">Xoá</button></div>`;

  document.body.appendChild(pop);
  cirAnchorPop(id, pop);

  pop.querySelector('.bd-x').onclick = cirClosePop;
  pop.querySelectorAll('.bd-kinds button').forEach(b => b.onclick = () => {
    if (b.dataset.k === n.k) return;
    cirSnapshot();
    n.k = b.dataset.k;
    n.v = CIR_KIND[n.k].val;
    n.name = cirNextName(c.root, n.k, n.id);
    n.probe = false;
    save(); cirPaint({ sel: id }); cirOpenPop(id);
  });
  const vr = pop.querySelector('#bdVr'), vn = pop.querySelector('#bdVn');
  if (vr) {
    const setV = v => {
      n.v = Math.max(0, parseFloat(v) || 0);
      vr.value = n.v; if (document.activeElement !== vn) vn.value = n.v;
      save(); cirPaint({ sel: id });
      cirAnchorPop(id, pop);
    };
    vr.onpointerdown = () => cirSnapshot();
    vn.onfocus = () => cirSnapshot();
    vr.oninput = () => setV(vr.value);
    vn.oninput = () => setV(vn.value);
  }
  const sw = pop.querySelector('#bdSw');
  if (sw) sw.onclick = () => {
    cirSnapshot();
    n.closed = !n.closed;
    save(); cirPaint({ sel: id }); cirOpenPop(id);
  };
  pop.querySelector('#bdDel').onclick = cirDeleteSelected;
  pop.querySelector('#bdL').onclick = () => cirMove(id, -1);
  pop.querySelector('#bdRt').onclick = () => cirMove(id, 1);
}
function cirAnchorPop(id, pop) {
  const g = document.querySelector(`[data-leaf="${id}"]`);
  if (!g || !pop) return;
  const r = g.getBoundingClientRect();
  let left = Math.min(r.left, innerWidth - pop.offsetWidth - 10);
  let top = r.bottom + 8;
  if (top + pop.offsetHeight > innerHeight - 10) top = Math.max(10, r.top - pop.offsetHeight - 8);
  pop.style.left = Math.max(10, left) + 'px';
  pop.style.top = top + 'px';
}
function cirMove(id, dir) {
  const c = cirModel();
  const hit = cirFindParent(c.root, id);
  if (!hit || !hit.parent) return;
  const k = hit.index + dir;
  if (k < 0 || k >= hit.parent.kids.length) { toast('Đã ở đầu/cuối nhánh'); return; }
  cirSnapshot();
  const arr = hit.parent.kids;
  [arr[hit.index], arr[k]] = [arr[k], arr[hit.index]];
  save(); cirPaint({ sel: id }); cirOpenPop(id);
}

/* ---------- kéo thả ---------- */
let bdDrag = null;
function cirStartDrag(e, info) {
  if (bdDrag) cirEndDrag();
  const ghost = document.createElement('div');
  ghost.className = 'bd-ghost';
  ghost.innerHTML = cirToolIcon(info.kind) + `<span>${info.label || ''}</span>`;
  document.body.appendChild(ghost);
  bdDrag = Object.assign({ ghost, moved: false, x0: e.clientX, y0: e.clientY }, info);
  cirMoveGhost(e.clientX, e.clientY);
  document.body.classList.add('bd-dragging');
  window.addEventListener('pointermove', cirOnMove);
  window.addEventListener('pointerup', cirOnUp);
  window.addEventListener('pointercancel', cirOnUp);
}
function cirMoveGhost(x, y) {
  if (!bdDrag) return;
  bdDrag.ghost.style.left = x + 'px';
  bdDrag.ghost.style.top = y + 'px';
}
function cirSvgPoint(x, y) {
  const svg = document.querySelector('#bdCanvas svg');
  if (!svg) return null;
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  const p = svg.createSVGPoint();
  p.x = x; p.y = y;
  const q = p.matrixTransform(ctm.inverse());
  return { x: q.x, y: q.y, svg, ctm };
}
function cirInBoard(cx, cy) {
  const b = $('#bdBoard');
  if (!b) return false;
  const r = b.getBoundingClientRect();
  return cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom;
}
function cirHitTest(cx, cy) {
  const trash = $('#bdTrash');
  if (trash && trash.classList.contains('on')) {
    const r = trash.getBoundingClientRect();
    if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) return { mode: 'trash' };
  }
  const sp = cirSvgPoint(cx, cy);
  if (!sp || !cirGeo || !cirInBoard(cx, cy)) return { mode: 'out' };
  let best = null, bestDy = 1e9;
  cirGeo.rungs.forEach(rg => {
    const band = Math.abs(sp.y - (rg.y + rg.h / 2));
    if (band > rg.h / 2 + 22) return;
    if (sp.x < rg.x - 70 || sp.x > rg.x + rg.w + 70) return;
    if (band > bestDy) return;
    let pick = null, dist = 1e9;
    (rg.items || []).forEach(it => {
      const d = Math.abs(sp.x - (it.x + it.w / 2));
      if (d < dist) { dist = d; pick = it; }
    });
    bestDy = band;
    if (pick) {
      const before = sp.x < pick.x + pick.w / 2;
      best = { mode: 'item', chainId: rg.chainId, index: pick.index + (before ? 0 : 1), item: pick, rung: rg };
    } else {
      best = { mode: 'rung', chainId: rg.chainId, index: 1e9, rung: rg };
    }
  });
  return best || { mode: 'new', rung: null };
}

function cirOnMove(e) {
  if (!bdDrag) return;
  if (Math.hypot(e.clientX - bdDrag.x0, e.clientY - bdDrag.y0) > 5) bdDrag.moved = true;
  cirMoveGhost(e.clientX, e.clientY);
  const canTrash = !!(bdDrag.moved && bdDrag.mode === 'move' && cirInBoard(e.clientX, e.clientY));
  $('#bdTrash').classList.toggle('on', canTrash);
  const t = cirHitTest(e.clientX, e.clientY);
  bdDrag.target = t;
  cirShowCaret(t);
}
function cirShowCaret(t) {
  let caret = $('#bdCaret');
  if (!caret) {
    caret = document.createElement('div');
    caret.id = 'bdCaret';
    caret.className = 'bd-caret';
    document.body.appendChild(caret);
  }
  const hide = () => { caret.style.display = 'none'; };
  if (!t || !bdDrag || !bdDrag.moved || t.mode === 'out' || t.mode === 'trash') return hide();
  const svg = document.querySelector('#bdCanvas svg');
  if (!svg) return hide();
  const ctm = svg.getScreenCTM();
  let sx, sy, h;
  if (t.mode === 'item' && t.item) {
    const p = svg.createSVGPoint();
    p.x = (t.index <= t.item.index) ? t.item.x - 2 : t.item.x + t.item.w + 2;
    p.y = t.item.cy;
    const q = p.matrixTransform(ctm);
    sx = q.x; sy = q.y; h = Math.max(40, t.item.h);
  } else if (t.mode === 'rung' && t.rung) {
    const p = svg.createSVGPoint();
    p.x = t.rung.x + t.rung.w + 4;
    p.y = t.rung.y + t.rung.h / 2;
    const q = p.matrixTransform(ctm);
    sx = q.x; sy = q.y; h = t.rung.h;
  } else {
    const p = svg.createSVGPoint();
    p.x = cirGeo.x0 + cirGeo.rootBox.w / 2;
    p.y = cirGeo.y0 + cirGeo.rootBox.h + 34;
    const q = p.matrixTransform(ctm);
    sx = q.x; sy = q.y; h = 34;
  }
  caret.style.display = 'block';
  caret.style.left = (sx - 1) + 'px';
  caret.style.top = (sy - h / 2) + 'px';
  caret.style.height = h + 'px';
}
function cirOnUp(e) {
  if (!bdDrag) return;
  const d = bdDrag;
  const t = cirHitTest(e.clientX, e.clientY);
  if (!d.moved) {
    if (d.mode === 'move' && d.leafId) { cirEndDrag(); cirSelect(d.leafId); return; }
    if (d.mode === 'new') {
      cirEndDrag();
      cirSnapshot();
      cirInsertNew(d.kind, { mode: 'rung', chainId: (cirGeo.rungs[0] || {}).chainId, index: 1e9 });
      save(); cirPaint();
      return;
    }
    cirEndDrag();
    return;
  }
  if (t.mode === 'trash') {
    cirEndDrag();
    if (d.mode === 'move') { cirSel = d.leafId; cirDeleteSelected(); }
    return;
  }
  cirEndDrag();
  if (t.mode !== 'item' && t.mode !== 'rung' && t.mode !== 'new') return;
  cirSnapshot();
  if (d.mode === 'new') cirInsertNew(d.kind, t);
  else cirMoveLeaf(d.leafId, t);
  save(); cirPaint();
  const pop = $('#bdPop'); if (pop) pop.remove();
  cirSel = null;
  cirPaint();
}
function cirEndDrag() {
  if (!bdDrag) return;
  bdDrag.ghost.remove();
  bdDrag = null;
  document.body.classList.remove('bd-dragging');
  const tr = $('#bdTrash'); if (tr) tr.classList.remove('on');
  const caret = $('#bdCaret'); if (caret) caret.style.display = 'none';
  window.removeEventListener('pointermove', cirOnMove);
  window.removeEventListener('pointerup', cirOnUp);
  window.removeEventListener('pointercancel', cirOnUp);
}

function cirNodeById(root, id) {
  let found = null;
  cirWalk(root, n => { if (n.id === id) found = n; });
  return found;
}
/* trả về một node SERIES để chèn vào (tự bọc nếu nhánh chỉ có 1 linh kiện) */
function cirChainForInsert(c, t) {
  if (t.mode === 'new') return null;
  const chain = t.chainId ? cirNodeById(c.root, t.chainId) : null;
  if (!chain) return c.root.t === 's' ? c.root : c.root.kids[0];
  if (chain.t === 's' || chain.t === 'p') return chain;
  /* nhánh đang là một linh kiện đơn: bọc thành chuỗi */
  const hit = cirFindParent(c.root, chain.id);
  if (hit && hit.parent) {
    const wrap = cirSeries([chain]);
    hit.parent.kids[hit.index] = wrap;
    return wrap;
  }
  const wrap = cirSeries([chain]);
  c.root = wrap;
  return wrap;
}
function cirInsertNew(kind, t) {
  const c = cirModel();
  const leaf = cirLeaf(kind, CIR_KIND[kind].val, cirNextName(c.root, kind));

  /* thả V lên một linh kiện = mắc vôn kế song song vào linh kiện đó */
  if (kind === 'V' && t.mode === 'item' && t.item) {
    const hit = cirFindParent(c.root, t.item.id);
    if (hit && hit.node.t === 'e') {
      hit.node.probe = !hit.node.probe;
      cirSel = hit.node.id;
      toast(hit.node.probe ? 'Đã mắc vôn kế song song với ' + hit.node.name : 'Đã gỡ vôn kế khỏi ' + hit.node.name);
      return;
    }
  }
  if (kind === 'V') toast('Vôn kế mắc nối tiếp sẽ chặn dòng — thả lên một linh kiện để đo song song');
  if (t.mode === 'new') {
    if (c.root.t === 'p') c.root.kids.push(leaf);
    else c.root = cirPar([c.root, leaf]);
    cirSel = leaf.id;
    toast('Đã thêm nhánh song song mới');
    return;
  }
  const chain = cirChainForInsert(c, t);
  if (!chain || !chain.kids) return;
  const idx = Math.max(0, Math.min(chain.kids.length, t.index === undefined || t.index > 1e6 ? chain.kids.length : t.index));
  chain.kids.splice(idx, 0, leaf);
  cirSel = leaf.id;
  toast('Đã chèn ' + leaf.name);
}
function cirMoveLeaf(leafId, t) {
  const c = cirModel();
  const hit = cirFindParent(c.root, leafId);
  if (!hit || !hit.parent) return;
  const node = hit.node;
  const from = hit.parent, fromIdx = hit.index;

  if (t.mode === 'new') {
    if (from === c.root && c.root.t === 'p' && c.root.kids.length === 1) return;   // đã đứng riêng một nhánh
    from.kids.splice(fromIdx, 1);
    if (!from.kids.length) from.kids.push(cirLeaf('R', 10, cirNextName(c.root, 'R')));
    if (c.root.t === 'p') c.root.kids.push(node);
    else c.root = cirPar([c.root, node]);
    cirSel = node.id;
    return;
  }
  const chain = cirChainForInsert(c, t);
  if (!chain || !chain.kids) return;
  let idx = (t.index === undefined || t.index > 1e6) ? chain.kids.length : t.index;
  if (chain === from && idx > fromIdx) idx--;
  from.kids.splice(fromIdx, 1);
  if (!from.kids.length) {
    if (from === c.root) from.kids.push(cirLeaf('R', 10, 'R1'));
    else from.kids.push(cirLeaf('R', 10, cirNextName(c.root, 'R')));
  }
  idx = Math.max(0, Math.min(chain.kids.length, idx));
  chain.kids.splice(idx, 0, node);
  cirSel = node.id;
}
