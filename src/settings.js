/* =========================================================
   TUỲ BIẾN — giao diện, màu, cỡ chữ, pomodoro, dữ liệu
   ========================================================= */

const THEMES = [
  { id: 'paper', name: 'Giấy cũ', note: 'Mặc định · editorial', sw: ['#f4f1ea', '#fbfaf6', '#8b2e22', '#17150f'] },
  { id: 'midnight', name: 'Đêm than', note: 'Nền tối · chữ ngà', sw: ['#12110e', '#1b1a15', '#d98d5b', '#efeade'] },
  { id: 'moss', name: 'Rêu', note: 'Xanh dịu · dễ chịu', sw: ['#eef0e7', '#f7f8f2', '#4a6b3a', '#1b211a'] },
  { id: 'slate', name: 'Chì xanh', note: 'Lạnh · tập trung', sw: ['#eef0f3', '#f8f9fb', '#2f5f92', '#14181f'] },
  { id: 'amber', name: 'Hổ phách', note: 'Ấm · như giấy cũ', sw: ['#f7efe0', '#fdf8ec', '#a85a1c', '#20180e'] },
  { id: 'pixel', name: 'Pixel giấy', note: 'Ô vuông · viền đậm', sw: ['#f2f2ee', '#fffef8', '#1f6f4a', '#111111'] },
  { id: 'pixelnight', name: 'Pixel đêm', note: 'Ô vuông · nền tối', sw: ['#14161a', '#1c2026', '#5fd39a', '#eef1f4'] },
  { id: 'ivory', name: 'Ngà', note: 'Trắng ngà · vàng cổ', sw: ['#f7f4ec', '#fffdf7', '#8a6a2f', '#1a1813'] },
  { id: 'bordeaux', name: 'Rượu vang', note: 'Đỏ trầm · sang', sw: ['#f4ecea', '#fbf6f4', '#6f2433', '#1e1416'] },
  { id: 'ink', name: 'Mực', note: 'Xanh mực · giấy trắng', sw: ['#eef1f4', '#f9fbfc', '#1d3a5c', '#0f1620'] },
  { id: 'lotus', name: 'Sen', note: 'Hồng phấn · dịu', sw: ['#f6efef', '#fdf8f8', '#8c4353', '#221a1c'] },
  { id: 'graphite', name: 'Than chì', note: 'Xám đậm · tối giản', sw: ['#222426', '#2c2f32', '#d9b26a', '#f3f2ef'] },
  { id: 'ocean', name: 'Biển', note: 'Xanh sâu · mát', sw: ['#e9eef2', '#f7fafc', '#1e5f6f', '#101a1e'] }
];

const ACCENTS = ['', '#8b2e22', '#2f5f92', '#4a6b3a', '#a85a1c', '#7a3f8c', '#0f6b6b', '#b03060', '#6f2433', '#1d3a5c', '#8c4353', '#2b6b4f', '#8a6a2f', '#4b4f8a'];

const DEF_PREFS = {
  theme: 'paper', accent: '', fs: 1, density: 'cozy', radius: 'sharp',
  motion: true, hl: true
};

function prefs() {
  state.prefs = Object.assign({}, DEF_PREFS, state.prefs || {});
  return state.prefs;
}

function applyPrefs() {
  const p = prefs();
  const root = document.documentElement;
  root.setAttribute('data-theme', p.theme || 'paper');
  root.setAttribute('data-density', p.density === 'compact' ? 'compact' : 'cozy');
  root.setAttribute('data-radius', p.radius === 'soft' ? 'soft' : 'sharp');
  root.setAttribute('data-motion', p.motion === false ? 'off' : 'on');
  root.style.setProperty('--fs', String(p.fs || 1));
  if (p.accent) root.style.setProperty('--accent', p.accent);
  else root.style.removeProperty('--accent');
  try { localStorage.setItem(PREFS_KEY, JSON.stringify({ theme: p.theme, fs: p.fs, accent: p.accent, density: p.density, radius: p.radius, motion: p.motion })); } catch (e) {}
}

function setPref(k, v) {
  prefs()[k] = v;
  applyPrefs();
  save();
  if (typeof paintLab === 'function' && /^#\/lab/.test(location.hash)) paintLab(true);
}

/* =========================================================
   TRANG TUỲ BIẾN
   ========================================================= */
function renderSettings() {
  /* đổi ngôn ngữ — render lại ngay, không cần tải lại trang */
  setTimeout(() => $$('[data-lang]').forEach(b => {
    b.onclick = () => setLang(b.dataset.lang);
  }), 0);
  const p = prefs();
  const c = typeof pomoCfg === 'function' ? pomoCfg() : { presets: [[25, 5], [50, 10], [15, 3]] };
  const st = AppStore.status();

  $('#main').innerHTML = `<section class="wrap wide">
    ${pageHead('Tuỳ biến', 'Chỉnh web theo mắt và nhịp học của bạn',
      'Mọi thứ dưới đây lưu ngay vào máy — ở 3 tầng khác nhau, kèm lịch sử phiên bản. Không phải cache: đóng trình duyệt, tắt máy vẫn còn.')}

    <div class="set-grid">
      <section class="set-sec">
        <div class="set-h"><span class="kicker">00 · ${tl('lang_label')}</span><span class="muted">vi · en</span></div>
        <div class="lang-row">
          <button class="lang-btn${i18nLang() === 'vi' ? ' on' : ''}" data-lang="vi" lang="vi">
            <b>Tiếng Việt</b><i>giao diện gốc · nội dung Vật lí</i></button>
          <button class="lang-btn${i18nLang() === 'en' ? ' on' : ''}" data-lang="en" lang="en">
            <b>English</b><i>interface only · physics content stays Vietnamese</i></button>
        </div>
        <p class="sy-note">${tl('lang_note')}</p>
      </section>

      <section class="set-sec">
        <div class="set-h"><span class="kicker">01 · Giao diện</span><span class="muted">${THEMES.length} bộ màu</span></div>
        <div class="theme-grid">
          ${THEMES.map(t => `<button class="theme-card${p.theme === t.id ? ' on' : ''}" data-theme-pick="${t.id}">
            <span class="tc-prev" style="background:${t.sw[0]}">
              <i style="background:${t.sw[1]}"></i>
              <b style="background:${t.sw[2]}"></b>
              <u style="background:${t.sw[3]}"></u>
            </span>
            <span class="tc-name">${t.name}</span>
            <span class="tc-note">${t.note}</span>
          </button>`).join('')}
        </div>
      </section>

      <section class="set-sec">
        <div class="set-h"><span class="kicker">02 · Màu nhấn</span><span class="muted">nút, gạch chân, số</span></div>
        <div class="acc-row">
          ${ACCENTS.map(a => `<button class="acc-dot${p.accent === a ? ' on' : ''}" data-accent="${a}"
            style="background:${a || 'var(--ink)'}" aria-label="${a ? 'màu ' + a : 'màu gốc'}">${a ? '' : '×'}</button>`).join('')}
        </div>
        <div class="set-row">
          <span class="set-l">Cỡ chữ</span>
          <div class="seg">${[['0.92', 'Nhỏ'], ['1', 'Vừa'], ['1.08', 'Lớn'], ['1.18', 'Rất lớn']].map(([v, t]) =>
            `<button data-fs="${v}" class="${String(p.fs) === v ? 'on' : ''}">${t}</button>`).join('')}</div>
        </div>
        <div class="set-row">
          <span class="set-l">Mật độ</span>
          <div class="seg">${[['cozy', 'Thoáng'], ['compact', 'Gọn']].map(([v, t]) =>
            `<button data-density="${v}" class="${p.density === v ? 'on' : ''}">${t}</button>`).join('')}</div>
        </div>
        <div class="set-row">
          <span class="set-l">Bo góc</span>
          <div class="seg">${[['sharp', 'Sắc cạnh'], ['soft', 'Mềm']].map(([v, t]) =>
            `<button data-radius="${v}" class="${p.radius === v ? 'on' : ''}">${t}</button>`).join('')}</div>
        </div>
        <div class="set-row">
          <span class="set-l">Mục tiêu mỗi ngày</span>
          <div class="seg">${[[10, '10 câu'], [20, '20 câu'], [30, '30 câu'], [50, '50 câu']].map(([v2, t2]) =>
            `<button data-goal="${v2}" class="${(state.goal || 20) === v2 ? 'on' : ''}">${t2}</button>`).join('')}</div>
        </div>
        <div class="set-row">
          <span class="set-l">Chuyển động</span>
          <div class="seg">${[['on', 'Bật'], ['off', 'Tắt']].map(([v, t]) =>
            `<button data-motion="${v}" class="${String(p.motion !== false) === String(v === 'on') ? 'on' : ''}">${t}</button>`).join('')}</div>
        </div>
      </section>

      <section class="set-sec" id="setPomo">
        <div class="set-h"><span class="kicker">03 · Pomodoro</span><span class="muted">tự đặt giờ và kiểu</span></div>
        <div class="pm-grid">
          ${c.presets.map((pr, i) => `<div class="pm-preset">
            <span class="pm-i">Ô ${i + 1}</span>
            <label>Tập trung <input type="number" min="1" max="180" value="${pr[0]}" data-preset="${i}" data-k="f"> phút</label>
            <label>Nghỉ <input type="number" min="1" max="60" value="${pr[1]}" data-preset="${i}" data-k="r"> phút</label>
          </div>`).join('')}
        </div>
        <div class="set-row">
          <span class="set-l">Kiểu đồng hồ</span>
          <div class="seg">
            <button data-pmstyle="pixel" class="${c.style === 'pixel' ? 'on' : ''}">Đồng hồ cát pixel</button>
            <button data-pmstyle="hourglass" class="${c.style !== 'pixel' ? 'on' : ''}">Bản vẽ mảnh</button>
          </div>
        </div>
        <div class="set-row">
          <span class="set-l">Màu cát</span>
          <div class="seg">${[['accent', 'Nhấn'], ['green', 'Lục'], ['ink', 'Mực']].map(([v, t]) =>
            `<button data-pmtint="${v}" class="${(c.tint || 'accent') === v ? 'on' : ''}">${t}</button>`).join('')}</div>
        </div>
        <div class="set-row">
          <span class="set-l">Chuông hết giờ</span>
          <div class="seg">${[['on', 'Có'], ['off', 'Không']].map(([v, t]) =>
            `<button data-pmsound="${v}" class="${String(c.sound !== false) === String(v === 'on') ? 'on' : ''}">${t}</button>`).join('')}</div>
        </div>
        <div class="pm-prev">
          <span class="kicker">Xem trước</span>
          <div id="pmPrev"></div>
        </div>
      </section>

      <section class="set-sec">
        <div class="set-h"><span class="kicker">04 · Dữ liệu của bạn</span>
          <span class="muted">${st.idb ? 'đang lưu 3 tầng' : 'đang lưu 2 tầng'}</span></div>
        <div class="store-grid">
          <div class="store-cell"><b>${(st.ls / 1024).toFixed(1)} KB</b><span>máy này (bộ nhớ trình duyệt)</span><i class="${st.ls ? 'ok' : 'bad'}">${st.ls ? 'đang ghi' : 'trống'}</i></div>
          <div class="store-cell"><b>${st.bak}/3</b><span>bản dự phòng xoay vòng</span><i class="${st.bak ? 'ok' : 'bad'}">${st.bak ? 'sẵn sàng' : 'chưa có'}</i></div>
          <div class="store-cell"><b>${st.cookie ? (st.cookie / 1024).toFixed(1) + ' KB' : '—'}</b><span>cookie (400 ngày)</span><i class="${st.cookie ? 'ok' : 'bad'}">${st.cookie ? 'còn khi xoá site data' : 'chưa ghi'}</i></div>
          <div class="store-cell"><b>${st.idb ? 'Bật' : 'Tắt'}</b><span>kho trình duyệt + lịch sử 20 bản</span><i class="${st.idb ? 'ok' : 'bad'}">${st.idb ? 'đang chạy' : 'trình duyệt chặn'}</i></div>
        </div>
        <div class="set-acts">
          <button class="btn sm" id="setBackup">Sao lưu ngay</button>
          <button class="btn ghost sm" id="setExport">Tải tệp .json</button>
          <label class="btn ghost sm" for="setImport">Nhập tệp .json
            <input type="file" id="setImport" accept="application/json,.json" hidden></label>
          <button class="btn ghost sm" id="setHist">Lịch sử ${''}</button>
        </div>
        <div id="histBox" class="hist-box"></div>
        <div class="danger">
          <span class="kicker">Vùng nguy hiểm</span>
          <p>Xoá mọi thứ đã lưu: tiến độ, câu sai, ghi chú, tuỳ biến. Không hoàn tác được — trừ khi bạn đã tải tệp .json.</p>
          <button class="btn ghost sm" id="setWipe">Xoá toàn bộ dữ liệu</button>
        </div>
      </section>
    </div>
  </section>`;

  /* --- chọn giao diện --- */
  $$('[data-theme-pick]').forEach(b => b.onclick = () => {
    setPref('theme', b.dataset.themePick);
    $$('[data-theme-pick]').forEach(x => x.classList.toggle('on', x === b));
    toast('Đã đổi giao diện · ' + (THEMES.find(t => t.id === b.dataset.themePick) || {}).name);
  });
  $$('[data-accent]').forEach(b => b.onclick = () => {
    setPref('accent', b.dataset.accent);
    $$('[data-accent]').forEach(x => x.classList.toggle('on', x === b));
  });
  $$('[data-fs]').forEach(b => b.onclick = () => { setPref('fs', +b.dataset.fs); sel(b, '[data-fs]'); });
  $$('[data-density]').forEach(b => b.onclick = () => { setPref('density', b.dataset.density); renderSettings(); });
  $$('[data-radius]').forEach(b => b.onclick = () => { setPref('radius', b.dataset.radius); sel(b, '[data-radius]'); });
  $$('[data-motion]').forEach(b => b.onclick = () => { setPref('motion', b.dataset.motion === 'on'); sel(b, '[data-motion]'); });
  $$('[data-goal]').forEach(b => b.onclick = () => {
    state.goal = +b.dataset.goal; save();
    sel(b, '[data-goal]');
    toast('Mục tiêu mỗi ngày: ' + state.goal + ' câu');
  });

  /* --- pomodoro --- */
  $$('[data-preset]').forEach(inp => inp.onchange = () => {
    const cfg = pomoCfg();
    const i = +inp.dataset.preset, k = inp.dataset.k;
    const v = Math.max(1, Math.min(k === 'f' ? 180 : 60, +inp.value || 1));
    cfg.presets[i][k === 'f' ? 0 : 1] = v;
    inp.value = v;
    const ps = pomoState();
    if (!ps.running) ps.left = pomoTotal(ps);
    save(); rebuildPomo();
    paintPomoPreview();
  });
  $$('[data-pmstyle]').forEach(b => b.onclick = () => {
    pomoCfg().style = b.dataset.pmstyle; save(); sel(b, '[data-pmstyle]');
    rebuildPomo(); paintPomoPreview();
  });
  $$('[data-pmtint]').forEach(b => b.onclick = () => {
    pomoCfg().tint = b.dataset.pmtint; save(); sel(b, '[data-pmtint]');
    rebuildPomo(); paintPomoPreview();
  });
  $$('[data-pmsound]').forEach(b => b.onclick = () => {
    pomoCfg().sound = b.dataset.pmsound === 'on'; save(); sel(b, '[data-pmsound]');
    if (pomoCfg().sound) chime(false);
  });
  paintPomoPreview();

  /* --- dữ liệu --- */
  $('#setBackup').onclick = () => { AppStore.backupNow(state, 'thủ công'); toast('Đã ghi bản sao + một mốc lịch sử'); fillHist(); };
  $('#setExport').onclick = () => { AppStore.exportFile(state); toast('Đang tải tệp sao lưu'); };
  $('#setImport').onchange = e => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      const s = AppStore.importText(rd.result);
      if (!s) { toast('Tệp không đúng định dạng'); return; }
      state = Object.assign(state, s);
      applyPrefs(); save(); render(); toast('Đã nhập dữ liệu từ tệp');
    };
    rd.readAsText(f);
  };
  $('#setHist').onclick = fillHist;
  $('#setWipe').onclick = () => {
    const box = document.createElement('div');
    box.className = 'overlay';
    box.innerHTML = `<div class="ov-panel" style="max-width:430px">
      <div style="padding:22px 24px">
        <span class="kicker">Xác nhận</span>
        <h3 style="font-family:var(--serif);font-size:20px;margin:8px 0 6px">Gõ <b>XOA</b> để xoá hết</h3>
        <p style="font-size:12.5px;color:var(--ink-2)">Toàn bộ tiến độ, câu sai, ghi chú, tuỳ biến sẽ mất ở cả 4 tầng lưu.</p>
        <input id="wipeIn" style="width:100%;border:1px solid var(--rule);background:var(--card);padding:8px 10px;margin:12px 0;font:inherit">
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button class="btn ghost sm" id="wipeNo">Thôi</button>
          <button class="btn sm" id="wipeYes" disabled>Xoá</button>
        </div>
      </div></div>`;
    document.body.appendChild(box);
    const inp = $('#wipeIn', box), yes = $('#wipeYes', box);
    inp.oninput = () => { yes.disabled = inp.value.trim().toUpperCase() !== 'XOA'; };
    const close = () => box.remove();
    $('#wipeNo', box).onclick = close;
    yes.onclick = () => { AppStore.clearAll(); state = loadState(); applyPrefs(); close(); render(); toast('Đã xoá toàn bộ dữ liệu'); };
  };

  function fillHist() {
    const hb = $('#histBox');
    if (!hb) return;
    hb.innerHTML = '<p class="muted" style="font-size:12px">Đang đọc lịch sử…</p>';
    AppStore.journal().then(rows => {
      rows.sort((a, b) => b.at - a.at);
      if (!rows.length) {
        hb.innerHTML = `<p class="muted" style="font-size:12px">Chưa có mốc nào. Lịch sử tự ghi mỗi phút khi bạn học; bấm <b>Sao lưu ngay</b> để tạo mốc thủ công.</p>`;
        return;
      }
      hb.innerHTML = `<div class="hist-h"><span class="kicker">Lịch sử · ${rows.length} mốc</span>
        <span class="muted">giữ 20 mốc gần nhất</span></div>
        <div class="hist-list">${rows.map(r => {
          const d = new Date(r.at);
          let n = 0;
          try { n = Object.keys(JSON.parse(r.raw).ans || {}).length; } catch (e) {}
          return `<div class="hist-row">
            <span class="mono">${d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
            <span>${n} câu đã làm</span>
            <span class="mono">${(r.raw.length / 1024).toFixed(0)} KB</span>
            <button class="btn ghost sm" data-restore="${r.at}">Khôi phục</button>
          </div>`;
        }).join('')}</div>`;
      $$('[data-restore]').forEach(b => b.onclick = () => {
        const at = +b.dataset.restore;
        const row = rows.find(r => r.at === at);
        if (!row) return;
        try {
          state = Object.assign(state, JSON.parse(row.raw));
          applyPrefs(); save(); render(); toast('Đã khôi phục mốc ' + new Date(at).toLocaleTimeString('vi-VN'));
        } catch (e) { toast('Mốc này hỏng, thử mốc khác'); }
      });
    });
  }

  function sel(btn, group) {
    $$(group).forEach(x => x.classList.toggle('on', x === btn));
  }
}

/* xem trước pomodoro ngay trong trang tuỳ biến */
function paintPomoPreview() {
  const host = $('#pmPrev');
  if (!host) return;
  const c = pomoCfg();
  const pr = pomoPreset(0);
  host.innerHTML = `<div class="pv-wrap">${pomoWidgetHTML(0.62, true)}
    <div class="pv-cap">
      <b>${c.style === 'pixel' ? 'Đồng hồ cát pixel' : 'Đồng hồ cát lật'}</b>
      <span>${pr[0]} phút tập trung · ${pr[1]} phút nghỉ</span>
      <span class="pv-note">${c.style === 'pixel'
        ? 'Cát tụt từng ô khi chạy; hết giờ đồng hồ lật và cát đổi sang màu nghỉ.'
        : 'Cát chảy và lật bình ở mỗi chặng.'}</span>
    </div></div>`;
}

/* =========================================================
   DẮT TAY LẦN ĐẦU: chọn nhanh giao diện
   ========================================================= */
function maybeWelcome() {
  if (state.seenWelcome) return;
  if (!/^#\/?$/.test(location.hash || '#/')) return;
  const d = document.createElement('div');
  d.className = 'overlay';
  d.innerHTML = `<div class="ov-panel" style="max-width:560px">
    <div style="padding:24px 26px">
      <span class="kicker">Lần đầu mở</span>
      <h3 style="font-family:var(--serif);font-size:23px;margin:8px 0 4px">Chọn tông cho dễ nhìn</h3>
      <p style="font-size:12.5px;color:var(--ink-2);margin-bottom:14px">Đổi lúc nào cũng được ở mục <b>Tuỳ biến</b>. Tiến độ luôn được lưu 3 tầng, không mất khi đóng trình duyệt.</p>
      <div class="theme-grid">${THEMES.map(t => `<button class="theme-card" data-wp="${t.id}">
        <span class="tc-prev" style="background:${t.sw[0]}"><i style="background:${t.sw[1]}"></i>
          <b style="background:${t.sw[2]}"></b><u style="background:${t.sw[3]}"></u></span>
        <span class="tc-name">${t.name}</span></button>`).join('')}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px;gap:10px">
        <button class="btn ghost sm" id="wSkip">Để sau</button>
        <a class="btn sm" id="wGo" href="#/settings">Vào tuỳ biến →</a>
      </div>
    </div></div>`;
  document.body.appendChild(d);
  const close = () => { d.remove(); state.seenWelcome = 1; save(); };
  $$('[data-wp]', d).forEach(b => b.onclick = () => {
    setPref('theme', b.dataset.wp); close(); toast('Đã chọn · ' + THEMES.find(t => t.id === b.dataset.wp).name);
  });
  $('#wSkip', d).onclick = close;
  $('#wGo', d).onclick = close;
  d.onclick = e => { if (e.target === d) close(); };
  document.addEventListener('keydown', function escW(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escW); }
  });
}
