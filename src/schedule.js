/* =========================================================
   LỊCH & THỜI KHOÁ BIỂU
   · Thời khoá biểu: sáng/chiều, 5–6 ngày, tự xếp môn, in được
   · Lịch tháng/tuần: sự kiện màu, việc học, hạn nộp, lịch thi
   ========================================================= */

const OWNER = { tag: '@nggkhaiz', name: 'Nguyễn Khải', gh: 'github.com/Ngg.Khaiz', ghUrl: 'https://github.com/Ngg.Khaiz' };

const SCH_DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
const SCH_DAYS_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

/* bảng màu môn học — trầm, sang, in ra vẫn đọc được */
const SCH_COLORS = [
  { id: 'brick', bg: '#f3e2de', fg: '#7d2b20', bd: '#c8837a', name: 'Gạch' },
  { id: 'navy', bg: '#e0e6ef', fg: '#22375a', bd: '#8a9dbb', name: 'Chàm' },
  { id: 'olive', bg: '#e6e9dc', fg: '#414f2c', bd: '#9aa87e', name: 'Ô-liu' },
  { id: 'ochre', bg: '#f5ebd6', fg: '#7a5416', bd: '#c9a86a', name: 'Thổ' },
  { id: 'plum', bg: '#ece0ea', fg: '#5c2952', bd: '#a9859d', name: 'Mận' },
  { id: 'teal', bg: '#dcecea', fg: '#155a54', bd: '#7eaaa4', name: 'Ngọc' },
  { id: 'rose', bg: '#f6e3e4', fg: '#8a3540', bd: '#cf9aa0', name: 'Hồng' },
  { id: 'slate', bg: '#e5e7e9', fg: '#3a4148', bd: '#98a1a8', name: 'Xám' },
  { id: 'sand', bg: '#f2ead9', fg: '#6b5327', bd: '#c3ad84', name: 'Cát' },
  { id: 'sage', bg: '#e2ece0', fg: '#33523a', bd: '#8fb096', name: 'Xanh lá' },
  { id: 'indigo', bg: '#e3e2f0', fg: '#36326b', bd: '#8f8cbb', name: 'Chàm tía' },
  { id: 'coral', bg: '#f8e6dd', fg: '#8c4526', bd: '#d59d80', name: 'San hô' }
];
const schColor = id => SCH_COLORS.find(c => c.id === id) || SCH_COLORS[0];

/* ---------------- state ---------------- */
function schedState() {
  if (!state.sched) state.sched = {};
  const S = state.sched;
  if (!Array.isArray(S.tables)) S.tables = [];
  if (!S.tables.length) S.tables.push(schNewTable('Thời khoá biểu chính khoá'));
  if (!S.activeId || !S.tables.find(t => t.id === S.activeId)) S.activeId = S.tables[0].id;
  if (!Array.isArray(S.events)) S.events = [];
  if (!S.calView) S.calView = 'month';
  if (!S.cursor) S.cursor = new Date().toISOString().slice(0, 10);
  return S;
}
const schedTable = () => {
  const S = schedState();
  return S.tables.find(t => t.id === S.activeId) || S.tables[0];
};
const cellKey = (d, k, idx) => d + '-' + k + '-' + idx;
const schId = () => 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const schNewTable = name => ({ id: schId(), name: name || 'Thời khoá biểu', days: 6, morning: 5, afternoon: 3, cells: {} });

const SCH_ISO = d => {
  const x = new Date(d);
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
};
const SCH_VN = iso => {
  const p = String(iso).split('-');
  return p[2] + '/' + p[1] + '/' + p[0];
};

/* =========================================================
   TRANG · THỜI KHOÁ BIỂU  #/timetable
   ========================================================= */
function renderTimetable() {
  const S = schedState();
  const T = schedTable();
  const subList = (typeof SUBJECTS !== 'undefined' ? SUBJECTS : []);
  const used = new Set();
  Object.values(T.cells).forEach(c => { if (c && c.s) used.add(c.s); });

  const sessions = [
    { k: 'm', label: 'Sáng', n: +T.morning || 5 },
    { k: 'a', label: 'Chiều', n: +T.afternoon || 0 }
  ].filter(s => s.n > 0);

  const gridCols = `54px repeat(${T.days}, minmax(0,1fr))`;

  const cellHTML = (d, k, i) => {
    const c = T.cells[cellKey(d, k, i)];
    if (!c || !c.s) return `<button class="tt-cell empty" data-cell="${cellKey(d, k, i)}" aria-label="Thêm môn"><i>+</i></button>`;
    const col = schColor(c.c);
    return `<button class="tt-cell filled" data-cell="${cellKey(d, k, i)}"
      style="--cb:${col.bg};--cf:${col.fg};--cd:${col.bd}">
      <b>${esc(c.s)}</b>
      ${c.t ? `<i>${esc(c.t)}</i>` : ''}
      ${c.r ? `<u>${esc(c.r)}</u>` : ''}
    </button>`;
  };

  $('#main').innerHTML = `<section class="wrap wide tt-page">
    ${pageHead('Thời khoá biểu', 'Lưới tuần · tự xếp · in ra dán tường',
    'Bấm vào ô trống để thêm môn, bấm ô đã có để sửa. Màu môn giữ nguyên khi in và khi xuất ảnh. Có thể tạo nhiều bảng: chính khoá, ôn thi, lịch hè…')}

    <div class="tt-bar">
      <span class="tt-tabs">
        ${S.tables.map(t => `<button class="tt-tab${t.id === S.activeId ? ' on' : ''}" data-table="${t.id}">${esc(t.name)}</button>`).join('')}
        <button class="tt-tab add" id="ttNew" title="Bảng mới">+</button>
      </span>
      <span class="grow"></span>
      <button class="btn ghost sm" id="ttAuto">Tự xếp môn</button>
      <button class="btn ghost sm" id="ttToCal">Đưa vào lịch tuần này</button>
      <button class="btn ghost sm" id="ttClear">Xoá trắng</button>
      <button class="btn ghost sm" id="ttPrint">In / lưu PDF</button>
    </div>

    <div class="tt-wrap">
      <div class="tt-grid" style="--cols:${gridCols}">
        <div class="tt-corner"><span>Tiết</span></div>
        ${Array.from({ length: T.days }, (_, d) => `<div class="tt-dh${d === 0 ? ' first' : ''}">
          <b>${SCH_DAYS_SHORT[d]}</b><span>${SCH_DAYS[d]}</span></div>`).join('')}

        ${sessions.map(se => `
          <div class="tt-sess">${se.label}</div>
          <div class="tt-srow" style="grid-column:1/-1"></div>
          ${Array.from({ length: se.n }, (_, i) => `
            <button class="tt-time" data-time="${se.k}-${i}">${se.k === 'm' ? 'S' : 'C'}${i + 1}</button>
            ${Array.from({ length: T.days }, (_, d) => cellHTML(d, se.k, i)).join('')}
          `).join('')}
        `).join('')}
      </div>
    </div>

    <div class="tt-legend">
      <span class="kicker">Môn đang có</span>
      ${used.size ? [...used].map(n => {
        const c = Object.values(T.cells).find(x => x && x.s === n);
        const col = schColor(c && c.c);
        return `<span class="tt-lg" style="background:${col.bg};color:${col.fg};border-color:${col.bd}">${esc(n)}</span>`;
      }).join('') : '<span class="sy-note">Chưa xếp môn nào — bấm “Tự xếp môn” để có lưới mẫu.</span>'}
    </div>

    <div class="tt-settings">
      <label class="st-row"><span>Tên bảng</span><input id="ttName" type="text" value="${esc(T.name)}"></label>
      <label class="st-row"><span>Số ngày</span>
        <select id="ttDays">${[5, 6, 7].map(n => `<option value="${n}"${T.days === n ? ' selected' : ''}>${n} ngày</option>`).join('')}</select></label>
      <label class="st-row"><span>Tiết sáng</span>
        <select id="ttM">${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(n => `<option value="${n}"${T.morning === n ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="st-row"><span>Tiết chiều</span>
        <select id="ttA">${[0, 1, 2, 3, 4, 5, 6].map(n => `<option value="${n}"${T.afternoon === n ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
      ${S.tables.length > 1 ? `<label class="st-row"><span>Bảng</span><button class="btn ghost sm" id="ttDel">Xoá bảng này</button></label>` : ''}
    </div>

    <div class="tt-foot">
      <span class="tt-sign">Người lập: ______________________</span>
      <span class="tt-sign">Học sinh / Lớp: ______________________</span>
      <span class="tt-brand">${OWNER.tag} · ${OWNER.gh}</span>
    </div>
  </section>`;

  /* chọn bảng */
  $$('[data-table]').forEach(b => b.onclick = () => { S.activeId = b.dataset.table; save(); renderTimetable(); });
  const nw = $('#ttNew'); if (nw) nw.onclick = () => {
    uiPrompt('Tên bảng mới', 'Ôn thi học kì', name => {
      const t = schNewTable(name);
      S.tables.push(t);
      S.activeId = t.id; save(); renderTimetable(); toast('Đã tạo bảng mới');
    });
  };
  const del = $('#ttDel'); if (del) del.onclick = () => {
    uiConfirm('Xoá bảng thời khoá biểu', `Xoá <b>${esc(T.name)}</b> cùng toàn bộ tiết đã xếp trong đó?`, () => {
      S.tables = S.tables.filter(t => t.id !== T.id);
      if (!S.tables.length) S.tables.push(schNewTable('Thời khoá biểu chính khoá'));
      S.activeId = S.tables[0].id; save(); renderTimetable(); toast('Đã xoá bảng');
    }, { danger: true, okText: 'Xoá bảng' });
  };

  /* sửa cấu hình */
  const bind = (sel, fn) => { const el = $(sel); if (el) el.onchange = () => { fn(el.value); save(); renderTimetable(); }; };
  bind('#ttName', v => { T.name = v.trim() || 'Thời khoá biểu'; });
  bind('#ttDays', v => { T.days = +v; });
  bind('#ttM', v => { T.morning = +v; });
  bind('#ttA', v => { T.afternoon = +v; });

  /* mở ô sửa */
  $$('[data-cell]').forEach(b => b.onclick = e => { e.stopPropagation(); schCellEditor(b.dataset.cell, T); });

  const auto = $('#ttAuto'); if (auto) auto.onclick = () => schAutoFill(T);
  const t2c = $('#ttToCal'); if (t2c) t2c.onclick = () => schPushWeek(T);
  const clr = $('#ttClear'); if (clr) clr.onclick = () => {
    uiConfirm('Xoá toàn bộ tiết', 'Mọi môn đã xếp trong bảng này sẽ bị xoá. Cấu trúc tuần vẫn giữ nguyên.', () => {
      T.cells = {}; save(); renderTimetable(); toast('Đã xoá toàn bộ tiết');
    }, { danger: true, okText: 'Xoá hết' });
  };
  const pr = $('#ttPrint'); if (pr) pr.onclick = () => window.print();

  /* phụ đề in */
  document.title = 'Thời khoá biểu · ' + (T.name || '') + ' · ' + OWNER.tag;
}

/* popover sửa ô */
function schCellEditor(key, T) {
  schClosePop();
  const cur = T.cells[key] || { s: '', t: '', r: '', c: 'brick' };
  const subList = (typeof SUBJECTS !== 'undefined' ? SUBJECTS : []);
  const opts = [...new Set([...subList.map(s => s.name), 'Toán', 'Ngữ văn', 'Tiếng Anh', 'Vật lí', 'Hoá học', 'Sinh học', 'Lịch sử', 'Địa lí', 'GDCD', 'Tin học', 'Công nghệ', 'Thể dục', 'Âm nhạc', 'Mĩ thuật', 'Chào cờ', 'Sinh hoạt lớp', 'Tự học', 'Ôn thi'])];
  const el = document.querySelector(`[data-cell="${key}"]`);
  const r = el.getBoundingClientRect();
  const pop = document.createElement('div');
  pop.className = 'tt-pop';
  pop.style.left = Math.min(window.innerWidth - 300, Math.max(8, r.left)) + 'px';
  pop.style.top = (r.bottom + window.scrollY + 6) + 'px';
  pop.innerHTML = `<div class="tt-pop-h"><b>Sửa tiết</b><button class="bd-x" aria-label="Đóng">×</button></div>
    <label class="tt-pf"><span>Môn</span><input id="tpS" list="tpList" value="${esc(cur.s || '')}" placeholder="Gõ hoặc chọn">
      <datalist id="tpList">${opts.map(o => `<option value="${esc(o)}">`).join('')}</datalist></label>
    <div class="tt-pf2">
      <label class="tt-pf"><span>Giáo viên</span><input id="tpT" value="${esc(cur.t || '')}"></label>
      <label class="tt-pf"><span>Phòng</span><input id="tpR" value="${esc(cur.r || '')}"></label>
    </div>
    <div class="tt-pf"><span>Màu</span>
      <div class="tt-colors">${SCH_COLORS.map(c => `<button class="tt-c${(cur.c === c.id) ? ' on' : ''}" data-c="${c.id}"
        style="background:${c.bg};border-color:${c.bd}" title="${c.name}"><i style="background:${c.fg}"></i></button>`).join('')}</div></div>
    <div class="tt-pop-f">
      <button class="btn ghost sm" id="tpDel">Xoá tiết</button>
      <span class="grow"></span>
      <button class="btn sm" id="tpSave">Lưu</button>
    </div>`;
  document.body.appendChild(pop);
  schPop = pop;
  let color = cur.c || 'brick';
  const close = () => schClosePop();
  pop.querySelector('.bd-x').onclick = close;
  $$('.tt-c', pop).forEach(b => b.onclick = () => {
    color = b.dataset.c; $$('.tt-c', pop).forEach(x => x.classList.toggle('on', x === b));
  });
  $('#tpDel', pop).onclick = () => { delete T.cells[key]; save(); close(); renderTimetable(); };
  $('#tpSave', pop).onclick = () => {
    const s = $('#tpS', pop).value.trim();
    if (!s) { delete T.cells[key]; } else {
      T.cells[key] = { s, t: $('#tpT', pop).value.trim(), r: $('#tpR', pop).value.trim(), c: color };
    }
    save(); close(); renderTimetable();
  };
  setTimeout(() => { const i = $('#tpS', pop); if (i) { i.focus(); i.select(); } }, 30);
  $('#tpS', pop).onkeydown = e => { if (e.key === 'Enter') $('#tpSave', pop).click(); };
  setTimeout(() => document.addEventListener('mousedown', schOutside), 10);
}
let schPop = null;
function schOutside(e) {
  if (schPop && !schPop.contains(e.target) && !e.target.closest('[data-cell]')) schClosePop();
}
function schClosePop() {
  document.removeEventListener('mousedown', schOutside);
  if (schPop) { schPop.remove(); schPop = null; }
}

/* tự xếp môn — trình điền ngay trong trang */
function schAutoFill(T) {
  schClosePop();
  const dflt = (typeof SUBJECTS !== 'undefined' ? SUBJECTS.filter(s => ['toan', 'van', 'anh', 'vatli', 'hoa', 'sinh', 'tin'].includes(s.id)).map(s => s.name).join(', ') : '');
  const d = document.createElement('div');
  d.className = 'overlay';
  d.innerHTML = `<div class="ov-panel" style="max-width:520px">
    <div class="cal-mh"><span class="kicker">Tự xếp môn</span><span class="grow"></span><button class="bd-x">×</button></div>
    <div class="cal-mb">
      <p class="sy-note" style="margin-top:0">Nhập các môn cần xếp — cách nhau bằng dấu phẩy, chấm phẩy hoặc xuống dòng. Máy rải đều và tô màu tự động; sửa lại từng ô tuỳ ý.</p>
      <label class="st-row"><span>Danh sách môn</span><textarea id="taList" rows="3">${esc(dflt)}</textarea></label>
      <div class="sy-btnrow"><button class="btn sm" id="taGo">Xếp lên lưới</button></div>
    </div></div>`;
  document.body.appendChild(d);
  const close = () => d.remove();
  d.querySelector('.bd-x').onclick = close;
  d.onclick = e => { if (e.target === d) close(); };
  setTimeout(() => $('#taList', d).focus(), 40);
  $('#taGo', d).onclick = () => {
    const list = [...new Set($('#taList', d).value.split(/[,;\n\r]+/).map(x => x.trim()).filter(Boolean))];
    if (!list.length) return toast('Chưa nhập môn nào');
    close(); schApplyAuto(T, list);
  };
}
function schApplyAuto(T, list) {
  if (!list.length) return;
  T.cells = {};
  const colorOf = n => SCH_COLORS[list.indexOf(n) % SCH_COLORS.length].id;
  const sessions = [['m', +T.morning || 0], ['a', +T.afternoon || 0]].filter(x => x[1] > 0);
  let k = 0;
  sessions.forEach(([sk, n]) => {
    for (let i = 0; i < n; i++) {
      for (let d = 0; d < T.days; d++) {
        /* bỏ tiết cuối chiều thứ 7 để có khoảng nghỉ */
        if (sk === 'a' && d === 5 && i === n - 1 && n > 2) continue;
        T.cells[cellKey(d, sk, i)] = { s: list[k % list.length], t: '', r: '', c: colorOf(list[k % list.length]) };
        k++;
      }
    }
  });
  save(); renderTimetable();
  toast('Đã xếp ' + list.length + ' môn — sửa lại tuỳ ý');
}

/* =========================================================
   TRANG · LỊCH  #/calendar
   ========================================================= */
function calAdd(o) {
  const S = schedState();
  const ev = Object.assign({ id: schId(), date: SCH_ISO(Date.now()), title: '', time: '', color: 'brick', kind: 'study', done: false }, o);
  if (!ev.title) return null;
  S.events.push(ev); save(); return ev;
}
function calDel(id) {
  const S = schedState();
  S.events = S.events.filter(e => e.id !== id); save();
}

function renderCalendar() {
  const S = schedState();
  const view = S.calView;
  const cur = new Date(S.cursor + 'T12:00:00');
  const todayISO = SCH_ISO(Date.now());

  const eventsOn = iso => S.events.filter(e => e.date === iso).sort((a, b) => (a.time || '99').localeCompare(b.time || '99'));

  let head = '', grid = '';
  if (view === 'month') {
    const y = cur.getFullYear(), m = cur.getMonth();
    const first = new Date(y, m, 1);
    const startShift = (first.getDay() + 6) % 7;
    const start = new Date(y, m, 1 - startShift);
    const cells = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start.getTime() + i * 864e5);
      cells.push(d);
    }
    head = `${SCH_DAYS_SHORT.map(d => `<div class="cal-dh">${d}</div>`).join('')}`;
    grid = cells.map(d => {
      const iso = SCH_ISO(d);
      const other = d.getMonth() !== m;
      const evs = eventsOn(iso);
      return `<div class="cal-cell${other ? ' other' : ''}${iso === todayISO ? ' today' : ''}" data-day="${iso}">
        <span class="cal-dn">${d.getDate()}</span>
        <div class="cal-evs">${evs.slice(0, 3).map(e => {
        const c = schColor(e.color);
        return `<span class="cal-ev${e.done ? ' done' : ''}" data-ev="${e.id}" style="--cb:${c.bg};--cf:${c.fg};--cd:${c.bd}">
            ${e.time ? `<i>${e.time}</i>` : ''}${esc(e.title)}</span>`;
      }).join('')}${evs.length > 3 ? `<span class="cal-more">+${evs.length - 3}</span>` : ''}</div>
        <button class="cal-add" data-add="${iso}" aria-label="Thêm việc">+</button>
      </div>`;
    }).join('');
  } else {
    /* tuần */
    const shift = (cur.getDay() + 6) % 7;
    const start = new Date(cur.getTime() - shift * 864e5);
    const week = Array.from({ length: 7 }, (_, i) => new Date(start.getTime() + i * 864e5));
    head = week.map(d => `<div class="cal-dh${SCH_ISO(d) === todayISO ? ' today' : ''}">
      <b>${SCH_DAYS_SHORT[(d.getDay() + 6) % 7]}</b><span>${d.getDate()}/${d.getMonth() + 1}</span></div>`).join('');
    grid = week.map(d => {
      const iso = SCH_ISO(d);
      const evs = eventsOn(iso);
      return `<div class="cal-wcol${iso === todayISO ? ' today' : ''}" data-day="${iso}">
        ${evs.map(e => {
        const c = schColor(e.color);
        return `<span class="cal-ev big${e.done ? ' done' : ''}" data-ev="${e.id}" style="--cb:${c.bg};--cf:${c.fg};--cd:${c.bd}">
            ${e.time ? `<i>${e.time}</i>` : ''}<b>${esc(e.title)}</b></span>`;
      }).join('')}
        <button class="cal-add wide" data-add="${iso}">+ Thêm</button>
      </div>`;
    }).join('');
  }

  const monthLabel = view === 'month'
    ? 'Tháng ' + (cur.getMonth() + 1) + ' · ' + cur.getFullYear()
    : 'Tuần ' + SCH_VN(SCH_ISO(new Date(cur.getTime() - ((cur.getDay() + 6) % 7) * 864e5)));
  const upcoming = S.events.filter(e => e.date >= todayISO && !e.done).sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || ''))).slice(0, 6);

  $('#main').innerHTML = `<section class="wrap wide cal-page">
    ${pageHead('Lịch học & việc cần làm', S.events.filter(e => !e.done).length + ' việc chưa xong · ' + S.events.length + ' mục đã ghi',
    'Đánh dấu ngày thi, hạn nộp, buổi ôn. Mỗi loại một màu. Bấm ngày để thêm, bấm việc để sửa. Lịch nằm trong máy, không cần đăng nhập.')}

    <div class="cal-bar">
      <div class="cal-nav">
        <button class="cal-arr" id="calPrev" aria-label="Trước">←</button>
        <button class="btn ghost sm" id="calToday">Hôm nay</button>
        <button class="cal-arr" id="calNext" aria-label="Sau">→</button>
        <b class="cal-label">${monthLabel}</b>
      </div>
      <span class="grow"></span>
      <div class="cal-views">
        <button class="cal-v${view === 'month' ? ' on' : ''}" data-view="month">Tháng</button>
        <button class="cal-v${view === 'week' ? ' on' : ''}" data-view="week">Tuần</button>
      </div>
      <button class="btn ghost sm" id="calICS">Xuất .ics</button>
      <button class="btn sm" id="calNew">+ Việc mới</button>
    </div>
    ${S.events.length ? '' : `<div class="cal-empty">
      <span class="cal-ek">Lịch đang trống</span>
      <span class="cal-et">Bắt đầu bằng một ngày thi, một buổi học — hoặc lấy cả thời khoá biểu đổ vào đây một lần.</span>
      <span class="grow"></span>
      <button class="btn ghost sm" id="calE1">+ Việc đầu tiên</button>
      <button class="btn sm" id="calE2">Lấy từ thời khoá biểu</button>
    </div>`}

    <div class="cal-grid ${view}">
      <div class="cal-head">${head}</div>
      <div class="cal-body">${grid}</div>
    </div>

    <div class="cal-detail" id="calDetail"></div>

    <div class="sy-grid2">
      <div class="sy-box">
        <div class="sy-box-h"><span class="kicker">Sắp tới</span><span class="grow"></span>
          <a class="sy-mini" href="#/plan">Kế hoạch học →</a></div>
        ${upcoming.length ? `<div class="cal-up">${upcoming.map(e => {
        const c = schColor(e.color);
        return `<div class="cal-urow" data-ev="${e.id}">
          <span class="cal-udot" style="background:${c.fg}"></span>
          <b>${esc(e.title)}</b>
          <span class="cal-udate">${SCH_VN(e.date)}${e.time ? ' · ' + e.time : ''}</span>
          <button class="cal-udone" data-done="${e.id}" title="Đánh dấu xong">✓</button>
        </div>`;
      }).join('')}</div>` : '<p class="sy-note">Chưa có việc nào sắp tới. Bấm “+ Việc mới” hoặc một ô ngày để thêm.</p>'}
      </div>

      <div class="sy-box">
        <div class="sy-box-h"><span class="kicker">Loại việc & màu</span><span class="grow"></span></div>
        <div class="cal-kinds">
          ${CAL_KINDS.map(k => `<span class="cal-kind" style="--cb:${schColor(k.c).bg};--cf:${schColor(k.c).fg};--cd:${schColor(k.c).bd}">${k.t}</span>`).join('')}
        </div>
        <p class="sy-note">Màu chỉ để dễ nhìn — không ảnh hưởng dữ liệu. Đổi màu từng việc khi sửa.</p>
        <div class="cal-legend-all">
          ${SCH_COLORS.map(c => `<span class="cal-sw" style="background:${c.bg};border-color:${c.bd}" title="${c.name}"></span>`).join('')}
        </div>
      </div>
    </div>
  </section>`;

  const shift = n => {
    const d = new Date(S.cursor + 'T12:00:00');
    if (view === 'month') d.setMonth(d.getMonth() + n);
    else d.setDate(d.getDate() + n * 7);
    S.cursor = SCH_ISO(d); save(); renderCalendar();
  };
  $('#calPrev').onclick = () => shift(-1);
  $('#calNext').onclick = () => shift(1);
  $('#calToday').onclick = () => { S.cursor = todayISO; save(); renderCalendar(); };
  $$('[data-view]').forEach(b => b.onclick = () => { S.calView = b.dataset.view; save(); renderCalendar(); });
  $('#calNew').onclick = () => calEditor(null, todayISO);
  const e1 = $('#calE1'); if (e1) e1.onclick = () => calEditor(null, todayISO);
  const e2 = $('#calE2'); if (e2) e2.onclick = () => schPushWeek(schedTable());
  const ics = $('#calICS'); if (ics) ics.onclick = () => schICS();
  $$('[data-add]').forEach(b => b.onclick = e => { e.stopPropagation(); calEditor(null, b.dataset.add); });
  $$('[data-ev]').forEach(b => b.onclick = e => { e.stopPropagation(); const ev = S.events.find(x => x.id === b.dataset.ev); if (ev) calEditor(ev); });
  $$('[data-done]').forEach(b => b.onclick = () => {
    const ev = S.events.find(x => x.id === b.dataset.done);
    if (ev) { ev.done = !ev.done; save(); renderCalendar(); }
  });
  $$('[data-day]').forEach(c => c.onclick = e => {
    if (e.target.closest('[data-ev]') || e.target.closest('[data-add]')) return;
    schDayDetail(c.dataset.day);
  });
  document.title = 'Lịch · ' + OWNER.tag;
}

const CAL_KINDS = [
  { id: 'exam', t: 'Thi / kiểm tra', c: 'brick' },
  { id: 'study', t: 'Buổi học', c: 'navy' },
  { id: 'homework', t: 'Bài tập về nhà', c: 'ochre' },
  { id: 'deadline', t: 'Hạn nộp', c: 'plum' },
  { id: 'activity', t: 'Hoạt động khác', c: 'sage' }
];

function schDayDetail(iso) {
  const S = schedState();
  const evs = S.events.filter(e => e.date === iso);
  const box = $('#calDetail');
  if (!box) return;
  box.innerHTML = `<div class="cal-dbox">
    <div class="cal-dbox-h"><b>${SCH_VN(iso)}</b><span class="grow"></span>
      <button class="btn ghost sm" data-add2="${iso}">+ Thêm việc</button>
      <button class="bd-x" id="calDX" aria-label="Đóng">×</button></div>
    ${evs.length ? evs.map(e => {
    const c = schColor(e.color);
    return `<div class="cal-drow${e.done ? ' done' : ''}">
        <span class="cal-udot" style="background:${c.fg}"></span>
        <b data-ev="${e.id}">${esc(e.title)}</b>
        <span>${e.time || ''}</span>
        <button class="cal-udone" data-done="${e.id}">${e.done ? '↺' : '✓'}</button>
      </div>`;
  }).join('') : '<p class="sy-note">Ngày này chưa có việc gì.</p>'}
  </div>`;
  $('#calDX').onclick = () => { box.innerHTML = ''; };
  const a2 = box.querySelector('[data-add2]'); if (a2) a2.onclick = () => calEditor(null, iso);
  $$('[data-done]', box).forEach(b => b.onclick = () => {
    const ev = S.events.find(x => x.id === b.dataset.done);
    if (ev) { ev.done = !ev.done; save(); renderCalendar(); schDayDetail(iso); }
  });
  $$('[data-ev]', box).forEach(b => b.onclick = () => {
    const ev = S.events.find(x => x.id === b.dataset.ev); if (ev) calEditor(ev);
  });
}

function calEditor(ev, iso) {
  const S = schedState();
  const isNew = !ev;
  const d = ev || { date: iso || SCH_ISO(Date.now()), title: '', time: '', color: 'navy', kind: 'study', note: '' };
  const dlg = document.createElement('div');
  dlg.className = 'overlay cal-ov';
  dlg.innerHTML = `<div class="ov-panel cal-modal" role="dialog" aria-label="Việc học">
    <div class="cal-mh"><span class="kicker">${isNew ? 'Việc mới' : 'Sửa việc'}</span><span class="grow"></span>
      <button class="bd-x" aria-label="Đóng">×</button></div>
    <div class="cal-mb">
      <label class="st-row"><span>Việc gì</span><input id="cvT" value="${esc(d.title)}" placeholder="Ví dụ: Kiểm tra 1 tiết Vật lí"></label>
      <div class="st-two">
        <label class="st-row"><span>Ngày</span><input id="cvD" type="date" value="${d.date}"></label>
        <label class="st-row"><span>Giờ (không bắt buộc)</span><input id="cvH" type="time" value="${d.time || ''}"></label>
      </div>
      <label class="st-row"><span>Loại</span><select id="cvK">${CAL_KINDS.map(k => `<option value="${k.id}"${d.kind === k.id ? ' selected' : ''}>${k.t}</option>`).join('')}</select></label>
      <label class="st-row"><span>Ghi chú</span><textarea id="cvN" rows="2">${esc(d.note || '')}</textarea></label>
      <div class="tt-pf"><span>Màu</span>
        <div class="tt-colors">${SCH_COLORS.map(c => `<button class="tt-c${(d.color === c.id) ? ' on' : ''}" data-c="${c.id}"
          style="background:${c.bg};border-color:${c.bd}" title="${c.name}"><i style="background:${c.fg}"></i></button>`).join('')}</div></div>
    </div>
    <div class="cal-mf">
      ${isNew ? '' : '<button class="btn ghost sm" id="cvDel">Xoá</button>'}
      <span class="grow"></span>
      <button class="btn ghost sm" id="cvCancel">Huỷ</button>
      <button class="btn sm" id="cvSave">Lưu</button>
    </div>
  </div>`;
  document.body.appendChild(dlg);
  let color = d.color || 'navy';
  const close = () => { dlg.remove(); document.removeEventListener('keydown', onEsc); };
  const onEsc = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onEsc);
  dlg.onclick = e => { if (e.target === dlg) close(); };
  dlg.querySelector('.bd-x').onclick = close;
  $('#cvCancel', dlg).onclick = close;
  $$('.tt-c', dlg).forEach(b => b.onclick = () => { color = b.dataset.c; $$('.tt-c', dlg).forEach(x => x.classList.toggle('on', x === b)); });
  $('#cvK', dlg).onchange = e => {
    const k = CAL_KINDS.find(x => x.id === e.target.value);
    if (k) { color = k.c; $$('.tt-c', dlg).forEach(x => x.classList.toggle('on', x.dataset.c === k.c)); }
  };
  const del = $('#cvDel', dlg); if (del) del.onclick = () => { calDel(d.id); close(); renderCalendar(); toast('Đã xoá'); };
  $('#cvSave', dlg).onclick = () => {
    const t = $('#cvT', dlg).value.trim();
    if (!t) return toast('Chưa nhập tên việc');
    if (isNew) {
      calAdd({ title: t, date: $('#cvD', dlg).value, time: $('#cvH', dlg).value, color, kind: $('#cvK', dlg).value, note: $('#cvN', dlg).value });
    } else {
      const e2 = S.events.find(x => x.id === d.id);
      if (e2) Object.assign(e2, { title: t, date: $('#cvD', dlg).value, time: $('#cvH', dlg).value, color, kind: $('#cvK', dlg).value, note: $('#cvN', dlg).value });
      save();
    }
    close(); renderCalendar(); toast('Đã lưu');
  };
  setTimeout(() => $('#cvT', dlg).focus(), 40);
}

/* =========================================================
   GIỚI THIỆU  #/about  — chủ sở hữu
   ========================================================= */
function renderAbout() {
  const S = studyState();
  const nCards = S.cards.length;
  const nLessons = (typeof allLessons === 'function' ? allLessons().length : 0);
  $('#main').innerHTML = `<section class="wrap ab-page">
    <div class="ab-card">
      <span class="kicker">Về trang này</span>
      <h1>một chỗ để học<br><em>mọi thứ cần học</em></h1>
      <p class="ab-lead">Từ lộ trình 52 ca Vật lí 9 tới trường học lớp 1–12, thẻ ghi nhớ lặp lại cách quãng, luyện đề tự tạo,
      kế hoạch tới ngày thi, thời khoá biểu và lịch học. Tất cả chạy trong một tệp HTML, dữ liệu nằm trong máy bạn.</p>

      <div class="ab-own">
        <div class="ab-av">${OWNER.tag.replace('@', '').slice(0, 2).toUpperCase()}</div>
        <div class="ab-own-t">
          <span class="kicker">Tác giả & chủ sở hữu</span>
          <b>${OWNER.tag}</b>
          <a href="${OWNER.ghUrl}" target="_blank" rel="noopener">${OWNER.gh} ↗</a>
        </div>
      </div>

      <div class="ab-stats">
        <div><b>${nLessons}</b><span>bài học</span></div>
        <div><b>52</b><span>ca Vật lí 9</span></div>
        <div><b>${nCards}</b><span>thẻ ghi nhớ</span></div>
        <div><b>27+</b><span>trang công cụ</span></div>
      </div>

      <div class="ab-ownnote">
        <p>Toàn bộ nội dung, mã nguồn và thiết kế thuộc về <b>${OWNER.tag}</b>. Nếu bạn dùng lại, vui lòng giữ dòng ghi công này.</p>
        <code>© ${new Date().getFullYear()} ${OWNER.tag} · ${OWNER.gh} · v${APP_VERSION}</code>
      </div>

      <div class="ab-links">
        <a class="btn sm" href="${OWNER.ghUrl}" target="_blank" rel="noopener">GitHub của tác giả ↗</a>
        <a class="btn ghost sm" href="#/">Về trang chủ</a>
        <a class="btn ghost sm" href="#/study">Học hôm nay</a>
        <button class="btn ghost sm" id="abVer">Kiểm tra bản mới</button>
      </div>

      <div class="ab-env" id="abEnv">
        <span class="kicker">Bản đang chạy</span>
        <p>v${APP_VERSION} · dữ liệu lưu trong máy bạn${location.protocol === 'file:' ? ' · đang mở trực tiếp từ tệp' : ''}</p>
      </div>
    </div>
  </section>`;
  document.title = 'Giới thiệu · ' + OWNER.tag;

  /* Kiểm tra bản mới qua endpoint Cloudflare Worker /__version.
     Không có mạng hoặc mở bằng file:// thì im lặng, không làm phiền. */
  const btn = $('#abVer'), env = $('#abEnv');
  if (btn) btn.onclick = async () => {
    btn.disabled = true; btn.textContent = 'Đang kiểm tra…';
    try {
      const r = await fetch('/__version', { headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const d = await r.json();
      if (d.version === APP_VERSION) {
        btn.textContent = 'Đã là bản mới nhất ✓';
        toast('Bạn đang dùng bản mới nhất (v' + APP_VERSION + ')');
      } else {
        btn.textContent = 'Có bản v' + d.version + ' — nạp lại';
        btn.disabled = false;
        btn.onclick = () => location.reload();
        toast('Có bản mới v' + d.version + ' — bấm để nạp lại');
      }
      if (env) env.insertAdjacentHTML('beforeend',
        `<p class="sy-note">Máy chủ: v${esc(d.version)} · build ${esc(String(d.build).slice(0, 12))}` +
        (d.commit ? ` · commit ${esc(String(d.commit).slice(0, 7))}` : '') + `</p>`);
    } catch (e) {
      btn.disabled = false;
      btn.textContent = 'Kiểm tra bản mới';
      toast(location.protocol === 'file:'
        ? 'Mở trực tiếp từ tệp nên không kiểm tra được — hãy xem bản trên web'
        : 'Không kiểm tra được — có thể đang ngoại tuyến');
    }
  };
}

/* đưa một tuần thời khoá biểu vào lịch (tạo việc có giờ) */
const SCH_SLOTS = {
  m: ['07:00', '07:45', '08:35', '09:25', '10:15', '11:05'],
  a: ['13:30', '14:20', '15:10', '16:00', '16:50', '17:40']
};
function schPushWeek(T) {
  const S = schedState();
  const base = new Date(); base.setHours(12, 0, 0, 0);
  const monday = new Date(base.getTime() - ((base.getDay() + 6) % 7) * 864e5);
  let made = 0, skipped = 0;
  Object.keys(T.cells).forEach(k => {
    const [d, sess, idx] = k.split('-');
    const dd = +d;
    if (dd >= T.days) return;
    const c = T.cells[k];
    if (!c || !c.s) return;
    const date = SCH_ISO(new Date(monday.getTime() + dd * 864e5));
    const time = (SCH_SLOTS[sess] || [])[+idx] || '';
    const title = c.s + (c.r ? ' · ' + c.r : '');
    const dup = S.events.some(e => e.date === date && e.time === time && e.title === title && e.src === 'tt');
    if (dup) { skipped++; return; }
    S.events.push({
      id: schId(), date, time, title,
      color: c.c || 'navy', kind: 'study', done: false, src: 'tt', note: c.t || ''
    });
    made++;
  });
  save(); toast(made ? 'Đã thêm ' + made + ' tiết vào lịch tuần này' + (skipped ? ' · bỏ qua ' + skipped + ' tiết đã có' : '') : 'Không có tiết nào để đưa vào');
  if (made) { location.hash = '#/calendar'; return; }
  if (!Object.keys(T.cells).some(k => T.cells[k] && T.cells[k].s)) {
    toast('Thời khoá biểu còn trống — xếp môn trước đã nhé'); location.hash = '#/timetable';
  }
}

/* =========================================================
   XUẤT LỊCH RA .ICS — nhập được vào Google / Apple / Outlook
   ========================================================= */
function schICS() {
  const S = schedState();
  const pad = n => String(n).padStart(2, '0');
  const stamp = d => d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + 'T' + pad(d.getHours()) + pad(d.getMinutes()) + '00';
  /* RFC 5545 §3.3.11: thoát \\ ; , và xuống dòng; gấp dòng dài quá 75 octet (§3.1) */
  const esc2 = t => String(t || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;')
    .replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  const fold = line => {
    if (line.length <= 73) return line;
    const out = [];
    let rest = line;
    out.push(rest.slice(0, 73));
    rest = rest.slice(73);
    while (rest.length) { out.push(' ' + rest.slice(0, 72)); rest = rest.slice(72); }
    return out.join('\r\n');
  };
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Hoc moi thu//@nggkhaiz//VI', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  let n = 0;
  S.events.forEach(e => {
    const t = (e.time || '08:00').split(':').map(Number);
    const start = new Date(e.date + 'T00:00:00');
    start.setHours(t[0] || 8, t[1] || 0, 0, 0);
    const end = new Date(start.getTime() + 45 * 60000);
    lines.push('BEGIN:VEVENT');
    lines.push('UID:' + e.id + '@nggkhaiz');
    lines.push('DTSTAMP:' + stamp(new Date()));
    lines.push('DTSTART:' + stamp(start));
    lines.push('DTEND:' + stamp(end));
    lines.push('SUMMARY:' + esc2(e.title));
    if (e.note) lines.push('DESCRIPTION:' + esc2(e.note));
    lines.push('CATEGORIES:' + esc2((CAL_KINDS.find(k => k.id === e.kind) || {}).t || 'Học tập'));
    lines.push('END:VEVENT');
    n++;
  });
  lines.push('END:VCALENDAR');
  if (!n) { toast('Chưa có việc nào để xuất'); return; }
  const blob = new Blob([lines.map(fold).join('\r\n') + '\r\n'], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'lich-hoc-' + (S.events[0] ? S.events[0].date : '') + '.ics';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  toast('Đã xuất ' + n + ' việc · nhập được vào Google / Apple Calendar');
}

/* tóm tắt cho trang Học hôm nay */
function schTodaySummary() {
  const S = schedState();
  const iso = SCH_ISO(Date.now());
  const today = S.events.filter(e => e.date === iso && !e.done)
    .sort((a, b) => (a.time || '99').localeCompare(b.time || '99'));
  const exams = S.events.filter(e => e.kind === 'exam' && e.date >= iso)
    .sort((a, b) => a.date.localeCompare(b.date));
  const next = exams[0];
  let days = null;
  if (next) days = Math.round((new Date(next.date + 'T00:00:00') - new Date(iso + 'T00:00:00')) / 864e5);
  return { today, next, days };
}
