/* =========================================================
   POMODORO — small hourglass that flips at every phase
   Sand drains top → bottom, then the glass turns over.
   ========================================================= */

/* người dùng tự đặt 3 ô giờ, kiểu đồng hồ, màu cát, chuông */
function pomoCfg() {
  const def = { presets: [[25, 5], [50, 10], [15, 3]], style: 'pixel', tint: 'accent', sound: true, v: 2 };
  const c = Object.assign(def, state.pomoCfg || {});
  if (!Array.isArray(c.presets) || c.presets.length < 3) c.presets = def.presets.map(x => x.slice());
  /* cấu hình cũ (chưa có v) một lần chuyển sang đồng hồ cát pixel */
  if (!c.v) { c.style = 'pixel'; c.v = 2; }
  state.pomoCfg = c;
  return c;
}
const pomoPreset = i => {
  const c = pomoCfg();
  return c.presets[Math.max(0, Math.min(c.presets.length - 1, i || 0))] || [25, 5];
};
const pomoTint = () => {
  const t = pomoCfg().tint;
  return t === 'green' ? 'var(--green)' : t === 'ink' ? 'var(--ink)' : 'var(--accent)';
};

function pomoState() {
  if (!state.pomo) state.pomo = { m: 0, phase: 'focus', left: 25 * 60, endAt: 0, running: false, auto: true, rounds: 0 };
  const p = state.pomo;
  /* dữ liệu cũ có thể thiếu trường — chuẩn hoá để không ra NaN */
  if (!isFinite(p.m)) p.m = 0;
  if (!isFinite(p.left) || p.left < 0) p.left = pomoTotal(p);
  if (!isFinite(p.endAt)) p.endAt = 0;
  if (!p.phase) p.phase = 'focus';
  if (p.running && !p.endAt) p.running = false;
  return p;
}
const pomoTotal = p => {
  const pr = pomoPreset(p.m);
  return (p.phase === 'focus' ? pr[0] : pr[1]) * 60;
};
const mmss = s => {
  if (!isFinite(s)) s = 0;
  s = Math.max(0, Math.ceil(s));
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
};

let AC = null;
function chime(breath) {
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const t0 = AC.currentTime;
    const notes = breath ? [440, 587.33] : [523.25, 783.99];
    notes.forEach((fr, i) => {
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = 'sine'; o.frequency.value = fr;
      const at = t0 + i * 0.16;
      g.gain.setValueAtTime(0.0001, at);
      g.gain.linearRampToValueAtTime(0.09, at + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.95);
      o.connect(g).connect(AC.destination);
      o.start(at); o.stop(at + 1);
    });
  } catch (e) { /* audio blocked until first gesture — fine */ }
}

/* =========================================================
   ĐỒNG HỒ CÁT PIXEL ART — sprite vẽ theo lưới 26×32 ô
   Khung gỗ · bình thuỷ tinh · cát chảy + dòng hạt ở cổ
   ========================================================= */
const PX_HW = { 7:6, 8:6, 9:5, 10:5, 11:4, 12:4, 13:3, 14:2, 15:1,
                16:1, 17:2, 18:3, 19:4, 20:4, 21:5, 22:5, 23:6, 24:6 };

function pxPal(isRest) {
  const t = isRest ? 'green' : pomoCfg().tint;
  const sand = t === 'green' ? ['#3f8f57', '#7fd396', '#2a5c3a']
             : t === 'ink'   ? ['#4d4d59', '#8b8b9e', '#292932']
             : ['#e0483a', '#f0796b', '#a32a20'];
  return {
    dark: '#3a2030', woodD: '#8c4433', wood: '#c8694a', woodH: '#ec9a72', woodL: '#e08a63',
    glass: '#d6eef7', glassE: '#9cc9dc', shine: '#ffffff',
    sand: sand[0], sandH: sand[1], sandS: sand[2]
  };
}
const pxRow = (r, a, b, f) => `<rect x="${a}" y="${r}" width="${b - a + 1}" height="1" fill="${f}"/>`;

function pxFrame() {
  const P = pxPal(); let s = '';
  /* đỉnh: nắp gỗ bo góc */
  s += pxRow(0, 8, 17, P.dark);
  s += pxRow(1, 6, 19, P.dark);
  s += pxRow(2, 5, 20, P.woodD);
  s += pxRow(3, 4, 21, P.wood);
  s += pxRow(4, 4, 21, P.woodH);
  s += pxRow(5, 5, 20, P.wood);
  s += pxRow(6, 6, 19, P.woodD);
  /* hai cột gỗ dọc thân */
  for (let r = 7; r <= 24; r++) {
    s += pxRow(r, 5, 5, P.woodH);
    s += pxRow(r, 6, 6, P.woodD);
    s += pxRow(r, 19, 19, P.woodD);
    s += pxRow(r, 20, 20, P.woodL);
  }
  /* đáy: nắp gỗ bo góc */
  s += pxRow(25, 6, 19, P.woodD);
  s += pxRow(26, 5, 20, P.wood);
  s += pxRow(27, 4, 21, P.woodH);
  s += pxRow(28, 4, 21, P.wood);
  s += pxRow(29, 5, 20, P.woodD);
  s += pxRow(30, 6, 19, P.dark);
  s += pxRow(31, 8, 17, P.dark);
  return s;
}

/* frac = phần thời gian còn lại (0..1) */
function pxGlassSand(frac, running, isRest) {
  const P = pxPal(isRest); let s = '';
  const f = Math.max(0, Math.min(1, isFinite(frac) ? frac : 1));

  /* thân bình: bóng thuỷ tinh */
  for (let r = 7; r <= 24; r++) {
    const hw = PX_HW[r];
    s += pxRow(r, 13 - hw, 12 + hw, P.glass);
  }
  /* phản chiếu */
  s += pxRow(8, 9, 9, P.shine) + pxRow(9, 9, 10, P.shine) + pxRow(10, 9, 9, P.shine);
  s += pxRow(22, 15, 15, P.shine) + pxRow(23, 15, 15, P.shine);

  /* cát bình trên: đầy khi còn nhiều thời gian, rút dần lên trên */
  const topFull = Math.round(f * 9);
  for (let i = 0; i < topFull; i++) {
    const r = 15 - i;
    if (r < 7) break;
    const hw = PX_HW[r];
    const edge = i === 0;
    s += pxRow(r, 13 - hw + 1, 12 + hw - 1, edge ? P.sandH : P.sand);
  }
  /* mặt cát hơi lõm ở giữa */
  if (topFull > 0) {
    const r = 15 - topFull + 1;
    if (r >= 7) s += pxRow(r, 12, 13, P.sandS);
  }

  /* cát bình dưới: đống hình nón, đỉnh nhọn, hai vai thoải */
  const bot = Math.round((1 - f) * 9);
  for (let i = 0; i < bot; i++) {
    const r = 24 - i;
    if (r < 16) break;
    const hw = Math.max(1, Math.min(PX_HW[r] - 1, bot - i));
    s += pxRow(r, 13 - hw, 12 + hw, P.sand);
  }
  if (bot > 0) {
    const rTop = 24 - bot;
    if (rTop >= 16) s += pxRow(rTop, 12, 13, P.sandH);
    s += pxRow(24, 11, 14, P.sandH);
  }

  /* dòng hạt rơi ở cổ bình */
  if (running && f > 0.004 && f < 0.996) {
    const topOfPile = 24 - bot;
    for (let r = 16; r <= Math.max(16, topOfPile); r++) {
      s += `<rect x="${12 + (r % 2)}" y="${r}" width="1" height="1" fill="${P.sandH}"/>`;
    }
  }

  /* thành bình vẽ sau cùng cho cát nằm gọn bên trong */
  for (let r = 7; r <= 24; r++) {
    const hw = PX_HW[r];
    s += `<rect x="${13 - hw}" y="${r}" width="1" height="1" fill="${P.glassE}"/>`;
    s += `<rect x="${12 + hw}" y="${r}" width="1" height="1" fill="${P.glassE}"/>`;
  }
  return s;
}

function pomoWidgetHTML(frac, isPreview) {
  const c = pomoCfg();
  const pr = pomoPreset(0);
  const mm = String(pr[0]).padStart(2, '0');
  const html = `<div class="pomo${c.style === 'pixel' ? ' pix' : ''}${isPreview ? ' preview' : ''}" id="pomo">
      <div class="hg-box" id="hgBox">
        <svg class="hg" viewBox="0 0 60 92" aria-hidden="true">
          <defs>
            <clipPath id="hgTop${isPreview ? 'P' : ''}"><polygon points="12,8 48,8 30,45"/></clipPath>
            <clipPath id="hgBot${isPreview ? 'P' : ''}"><polygon points="12,84 48,84 30,47"/></clipPath>
          </defs>
          <rect x="8" y="8" width="44" height="37" fill="${pomoTint()}" opacity=".8" clip-path="url(#hgTop${isPreview ? 'P' : ''})" id="sandTop"/>
          <rect x="8" y="47" width="44" height="37" fill="${pomoTint()}" opacity=".8" clip-path="url(#hgBot${isPreview ? 'P' : ''})" id="sandBot"/>
          <path d="M12 8h36L30 45 12 8Z" fill="none" stroke="var(--ink-2)" stroke-width="1.2"/>
          <path d="M12 84h36L30 47 12 84Z" fill="none" stroke="var(--ink-2)" stroke-width="1.2"/>
          <path d="M10 6h40M10 86h40" stroke="var(--ink)" stroke-width="1.6"/>
          <path d="M30 45v2" stroke="var(--ink-2)" stroke-width="1"/>
        </svg>
      </div>
      <div class="px-box" id="pxBox">
        <svg class="pxg" viewBox="0 0 26 32" shape-rendering="crispEdges" aria-hidden="true">
          <g>${pxFrame()}</g>
          <g id="pxSand">${pxGlassSand(frac, false, false)}</g>
        </svg>
      </div>
      <div class="pomo-meta">
        <span class="pomo-t" id="pomoT">${mm}:00</span>
        <button class="pomo-play" id="pomoPlay" aria-label="Bắt đầu">▶</button>
      </div>
      <div class="pomo-ph" id="pomoPh">tập trung</div>
      <div class="pomo-modes" id="pomoModes">
        ${c.presets.map((x, i) => `<button data-mode="${i}">${x[0]}/${x[1]}</button>`).join('')}
        <button data-pomo="skip" title="Sang chặng khác">⤳</button>
      </div>
      <div class="pomo-dots" id="pomoDots"></div>
    </div>`;
  return isPreview ? html.replace(/ id="[^"]*"/g, '') : html;
}

function rebuildPomo() {
  const old = $('#pomoDock');
  if (old) old.remove();
  mountPomo();
}

function mountPomo() {
  if ($('#pomoDock')) return;
  const d = document.createElement('div');
  d.id = 'pomoDock';
  d.className = 'dock dock-l';
  d.innerHTML = pomoWidgetHTML(1, false);
  document.body.appendChild(d);

  /* điện thoại: thu gọn thành một viên nhỏ, bấm vào đồng hồ cát để mở */
  const collapse = () => {
    const box = $('#pomo');
    if (window.innerWidth <= 640) box.classList.add('min');
    else box.classList.remove('min');
  };
  collapse();
  window.addEventListener('resize', collapse);
  const hg = $('#hgBox');
  if (hg) hg.onclick = () => { if (window.innerWidth <= 640) $('#pomo').classList.toggle('min'); };

  const paint = () => {
    const p = pomoState();
    const total = pomoTotal(p);
    const f = Math.max(0, Math.min(1, p.left / total));
    const topH = 37 * f, botH = 37 * (1 - f);
    const st = $('#sandTop'), sb = $('#sandBot');
    st.setAttribute('y', String(45 - topH));
    st.setAttribute('height', String(Math.max(0, topH)));
    sb.setAttribute('y', String(84 - botH));
    sb.setAttribute('height', String(Math.max(0, botH)));
    const tint = p.phase === 'focus' ? pomoTint() : 'var(--green)';
    st.setAttribute('fill', tint);
    sb.setAttribute('fill', tint);
    $('#pomoT').textContent = mmss(p.left);
    $('#pomoPh').textContent = p.phase === 'focus' ? 'tập trung' : 'nghỉ';
    $('#pomoPlay').textContent = p.running ? '❙❙' : '▶';
    $('#pomoPlay').setAttribute('aria-label', p.running ? 'Tạm dừng' : 'Bắt đầu');
    $('#pomo').classList.toggle('running', p.running);
    $('#pomo').classList.toggle('rest', p.phase !== 'focus');
    /* pixel: tô lại lưới ô vuông theo phần thời gian còn lại */
    if (pomoCfg().style === 'pixel') {
      const g = $('#pxSand');
      if (g) g.innerHTML = pxGlassSand(f, p.running, p.phase !== 'focus');
      $('#pomo').classList.toggle('running', p.running);
      return;
    }
    $$('#pomoModes [data-mode]').forEach(b => b.classList.toggle('on', +b.dataset.mode === p.m));
    $('#pomoDots').innerHTML = Array.from({ length: Math.min(6, Math.max(0, p.rounds % 7)) }).map(() => '<i></i>').join('') || '';
  };

  const flip = () => {
    if (pomoCfg().style === 'pixel') {
      const box = $('#pxBox');
      if (box) {
        box.classList.add('flip');
        setTimeout(() => { box.classList.remove('flip'); paint(); }, 620);
      } else paint();
      return;
    }
    const box = $('#hgBox');
    box.classList.add('flip');
    setTimeout(() => {
      box.style.transition = 'none';
      box.classList.remove('flip');
      void box.offsetHeight;
      box.style.transition = '';
      paint();
    }, 720);
  };

  const finish = () => {
    const p = pomoState();
    if (p.phase === 'focus') { p.rounds = (p.rounds || 0) + 1; p.phase = 'rest'; }
    else p.phase = 'focus';
    p.left = pomoTotal(p);
    if (pomoCfg().sound !== false) chime(p.phase === 'rest');
    if (p.running) p.endAt = Date.now() + p.left * 1000;
    save();
    flip();
    if (p.phase === 'rest') toast('Hết một phiên · nghỉ ' + pomoPreset(p.m)[1] + ' phút');
    else toast('Nghỉ xong · vào phiên tiếp');
  };

  const tick = () => {
    const p = pomoState();
    if (p.running) {
      p.left = (p.endAt - Date.now()) / 1000;
      if (!isFinite(p.left)) { p.left = pomoTotal(p); p.endAt = Date.now() + p.left * 1000; }
      if (p.left <= 0) { p.left = 0; finish(); return; }
      paint();
    }
  };
  /* chỉ một nhịp duy nhất: mỗi lần dựng lại đồng hồ thì dọn nhịp cũ trước */
  if (window.__pomoTick) clearInterval(window.__pomoTick);
  window.__pomoTick = setInterval(tick, 400);

  $('#pomoPlay').onclick = () => {
    const p = pomoState();
    if (p.running) { p.left = Math.max(0, (p.endAt - Date.now()) / 1000); p.running = false; }
    else {
      if (p.left <= 0.5) p.left = pomoTotal(p);
      p.endAt = Date.now() + p.left * 1000;
      p.running = true;
      try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
    }
    save(); paint();
  };
  $$('#pomoModes [data-mode]').forEach(b => b.onclick = () => {
    const p = pomoState();
    p.m = +b.dataset.mode;
    p.phase = 'focus';
    p.running = false;
    p.left = pomoTotal(p);
    save(); paint();
  });
  $('#pomoModes [data-pomo="skip"]').onclick = () => { finish(); };

  paint();
}

function mountDocks() {
  mountMusic();
  mountPomo();
}
