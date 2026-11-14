/* =========================================================
   BÀN LẬP KẾ HOẠCH TUẦN — học theo mô hình của beaverplans.com
   ---------------------------------------------------------
   Beaverplans (một planner tuần tối giản cho học sinh) có một ý rất đúng:
   đừng bắt người học nghĩ bằng "task rời rạc", hãy bắt họ nghĩ bằng **dự án**.

        Dự án  →  việc  →  việc con  →  rải vào các ngày trong tuần

   Mỗi việc con được gắn một độ khó (dễ / vừa / khó) và được rải vào đúng
   những ngày bạn nói mình có thể học. Đó là toàn bộ cơ chế — và nó đủ, vì
   vấn đề của học sinh không phải thiếu tính năng mà là thiếu chỗ để bắt đầu.

   Bản này thêm hai thứ beaverplans không có, hợp với bối cảnh Việt Nam:
     · Nối thẳng vào bài học trong máy  (#/read/… , #/practice, #/cards)
     · Kéo việc trễ sang hôm nay thay vì bỏ mặc — "không mất việc nào"

   Lưu trong state.weekly. Không gửi đi đâu.
   ========================================================= */

const WK_DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const WK_DAY_FULL = ['Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy', 'Chủ nhật'];

/* thứ Hai = 0 ... Chủ nhật = 6 */
const wkDow = (d = new Date()) => (d.getDay() + 6) % 7;
/* ISO của thứ Hai tuần chứa ngày d */
function wkMonday(d = new Date()) {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  x.setTime(x.getTime() - wkDow(x) * 864e5);
  return x;
}
function wkDateOf(dayIdx, weekOffset) {
  const x = wkMonday();
  x.setTime(x.getTime() + ((weekOffset || 0) * 7 + dayIdx) * 864e5);
  return x;
}

function wkState() {
  if (!state.weekly || typeof state.weekly !== 'object') state.weekly = {};
  const W = state.weekly;
  if (!Array.isArray(W.projects)) W.projects = [];
  if (!W.days || typeof W.days !== 'object') W.days = {};   /* mặc định học cả tuần */
  if (W.days && !Object.keys(W.days).length) W.days = { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 };
  if (!isFinite(W.offset)) W.offset = 0;
  return W;
}

const wkPrj = id => wkState().projects.find(p => p.id === id);
const wkTaskDone = (prj, taskId) => !!(prj.done && prj.done[taskId]);

function wkAddProject(name, color) {
  const W = wkState();
  const p = {
    id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    name: name, color: color || '', at: Date.now(),
    tasks: [], done: {},
  };
  W.projects.push(p);
  save();
  return p;
}

function wkAddTask(prjId, title, opt) {
  const p = wkPrj(prjId);
  if (!p) return null;
  opt = opt || {};
  const t = {
    id: 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    title: title,
    link: opt.link || '',
    subs: [],           /* [{id, title, diff, day}] */
    at: Date.now(),
  };
  p.tasks.push(t);
  save();
  return t;
}

/* Đọc tiền tố "khó:", "vừa:", "dễ:" ở đầu tên việc.
   Đặt ở đây — tầng dữ liệu — để mọi đường nhập đều hiểu như nhau:
   ô "+" theo từng ngày, hộp "Chia việc con", và cả khi nhập tay sau này. */
function wkParseDiff(raw) {
  const s = String(raw || '').trim();
  const m = s.match(/^(khó|kho|vừa|vua|dễ|de)\s*[:：]\s*(.+)$/i);
  if (!m) return null;
  const k = norm(m[1]);
  return { diff: k === 'kho' ? 3 : (k === 'de' ? 1 : 2), title: m[2].trim() };
}

function wkAddSub(prjId, taskId, title, diff, day) {
  const p = wkPrj(prjId);
  if (!p) return null;
  const t = p.tasks.find(x => x.id === taskId);
  if (!t) return null;
  /* tiền tố trong tên thắng tham số diff — người dùng gõ gì thì hiểu nấy */
  const pre = wkParseDiff(title);
  if (pre) { title = pre.title; diff = pre.diff; }
  const s = {
    id: 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    title: title, diff: Math.max(1, Math.min(3, +diff || 2)),
    /* day === null/undefined nghĩa là "chưa xếp" — để wkAutoSpread rải sau.
       Không được mặc định về 0, nếu không mọi việc dồn hết vào thứ Hai. */
    day: (day === null || day === undefined || day === '') ? null
      : Math.max(0, Math.min(6, +day || 0)),
  };
  t.subs.push(s);
  save();
  return s;
}

/* Rải đều các việc con chưa có ngày vào những ngày bạn có thể học.
   Việc "khó" được đặt lên đầu tuần — khi còn sức. */
function wkAutoSpread(prjId) {
  const p = wkPrj(prjId);
  if (!p) return 0;
  const W = wkState();
  const days = Object.keys(W.days).filter(d => W.days[d]).map(Number).sort((a, b) => a - b);
  if (!days.length) return 0;
  const pool = [];
  p.tasks.forEach(t => t.subs.forEach(s => { if (s.day === undefined || s.day === null) pool.push(s); }));
  if (!pool.length) return 0;
  pool.sort((a, b) => (b.diff || 2) - (a.diff || 2));
  /* Việc khó trước → ngày đầu danh sách. Nhưng với 3 việc và 7 ngày, rải xen kẽ
     sẽ đặt việc thứ ba vào giữa tuần, làm chữ "khó nhất ở đầu tuần" thành sai.
     Nên: chừng nào còn việc thì điền liên tiếp từng ngày, mỗi ngày đủ suất rồi
     mới sang ngày kế. Như vậy thứ tự khó→dễ luôn trùng thứ tự thời gian. */
  const perDay = Math.max(1, Math.ceil(pool.length / days.length));
  pool.forEach((s, i) => { s.day = days[Math.min(days.length - 1, Math.floor(i / perDay))]; });
  save();
  return pool.length;
}

/* Gom toàn bộ việc con của một tuần thành 7 cột */
function wkPlan(weekOffset) {
  const W = wkState();
  const off = weekOffset === undefined ? W.offset : weekOffset;
  const cols = WK_DAYS.map((d, i) => ({ day: i, label: d, date: wkDateOf(i, off), items: [] }));
  W.projects.forEach(p => {
    (p.tasks || []).forEach(t => {
      (t.subs || []).forEach(s => {
        if (s.day === undefined || s.day === null) return;
        const col = cols[s.day];
        if (!col) return;
        col.items.push({ prj: p, task: t, sub: s, done: wkTaskDone(p, s.id) });
      });
    });
  });
  return cols;
}

/* Số việc còn lại / đã xong trong tuần đang xem */
function wkStats(off) {
  const cols = wkPlan(off);
  let all = 0, done = 0;
  cols.forEach(c => c.items.forEach(it => { all++; if (it.done) done++; }));
  return { all, done, left: all - done, pct: all ? Math.round(done / all * 100) : 0 };
}

/* Việc trễ: nằm ở ngày đã qua mà chưa xong */
function wkOverdue() {
  const W = wkState();
  const todayIdx = wkDow();
  const out = [];
  wkPlan().forEach(c => {
    if (c.day >= todayIdx) return;
    c.items.forEach(it => { if (!it.done) out.push(it); });
  });
  return out;
}

/* Kéo mọi việc trễ về hôm nay — "không mất việc nào" */
function wkPullOverdue() {
  const list = wkOverdue();
  if (!list.length) return 0;
  const todayIdx = wkDow();
  list.forEach(it => { it.sub.day = todayIdx; });
  save();
  return list.length;
}

function wkToggle(prjId, subId) {
  const p = wkPrj(prjId);
  if (!p) return false;
  p.done = p.done || {};
  if (p.done[subId]) delete p.done[subId];
  else p.done[subId] = Date.now();
  save();
  return true;
}

/* =========================================================
   ROUTE · KẾ HOẠCH TUẦN  #/weekly
   ========================================================= */
function renderWeekly() {
  const W = wkState();
  const off = W.offset;
  const cols = wkPlan(off);
  const st = wkStats(off);
  const overdue = wkOverdue();
  const todayIdx = wkDow();
  const showToday = off === 0;
  const monday = wkDateOf(0, off);
  const sunday = wkDateOf(6, off);
  const rangeVN = monday.getDate() + '/' + (monday.getMonth() + 1) + ' – ' + sunday.getDate() + '/' + (sunday.getMonth() + 1);
  const left = Math.max(0, 6 - todayIdx);

  const subHtml = it => `<div class="wk-item${it.done ? ' ok' : ''}" data-prj="${it.prj.id}" data-sub="${it.sub.id}">
      <button class="wk-check" aria-label="${it.done ? 'Bỏ đánh dấu' : 'Đánh dấu xong'}: ${esc(it.sub.title)}">${it.done ? '✓' : ''}</button>
      <span class="wk-t">
        <b class="d${it.sub.diff}">${esc(it.sub.title)}</b>
        <i>${esc(it.prj.name)}${it.task.link ? ` · <a href="${esc(it.task.link)}">mở bài</a>` : ''}</i>
      </span>
    </div>`;

  const colHtml = c => {
    const isToday = showToday && c.day === todayIdx;
    const past = showToday && c.day < todayIdx;
    const open = W.days[c.day];
    return `<div class="wk-col${isToday ? ' today' : ''}${past ? ' past' : ''}${open ? '' : ' off'}">
      <div class="wk-col-h">
        <span class="wk-d">${c.label}</span>
        <span class="wk-date">${c.date.getDate()}/${c.date.getMonth() + 1}</span>
        ${c.items.length ? `<span class="wk-n">${c.items.filter(i => i.done).length}/${c.items.length}</span>` : ''}
      </div>
      <div class="wk-col-b">
        ${c.items.length ? c.items.map(subHtml).join('') : '<span class="wk-empty">—</span>'}
      </div>
      <button class="wk-add-sub" data-day="${c.day}" aria-label="Thêm việc cho ${WK_DAY_FULL[c.day]}">+</button>
    </div>`;
  };

  $('#main').innerHTML = `<section class="wrap wide sy-page">
    ${pageHead('Kế hoạch tuần',
    rangeVN + ' · ' + st.done + '/' + st.all + ' việc' + (st.all ? ' · còn ' + (100 - st.pct) + '%' : ' · tuần mới'),
    'Nghĩ theo dự án, không theo từng việc rời. Mỗi dự án có việc, mỗi việc chia thành việc con rải vào các ngày bạn có thể học — việc khó xếp lên đầu tuần khi còn sức.')}

    <div class="pg-kpi">
      <div class="pg-k"><span class="kicker">Tuần này</span><b>${st.done}/${st.all}</b><em>việc con</em></div>
      <div class="pg-k"><span class="kicker">Đã xong</span><b>${st.pct}%</b><em>${st.left} việc còn lại</em></div>
      <div class="pg-k"><span class="kicker">Còn</span><b>${left}</b><em>ngày tới cuối tuần</em></div>
      <div class="pg-k"><span class="kicker">Trễ</span><b style="${overdue.length ? 'color:#b3402f' : ''}">${overdue.length}</b><em>việc chưa xong</em></div>
      <div class="pg-k"><span class="kicker">Dự án</span><b>${W.projects.length}</b><em>đang theo</em></div>
    </div>

    <div class="wk-head">
      <button class="btn ghost sm" id="wkPrev" aria-label="Tuần trước">←</button>
      <button class="btn ghost sm" id="wkThis">Tuần này</button>
      <button class="btn ghost sm" id="wkNext" aria-label="Tuần sau">→</button>
      <span class="grow"></span>
      ${overdue.length ? `<button class="btn sm" id="wkPull">Kéo ${overdue.length} việc trễ về hôm nay</button>` : ''}
      <button class="btn sm" id="wkNewPrj">+ Dự án</button>
    </div>

    <div class="wk-board">
      ${cols.map(colHtml).join('')}
    </div>

    <div class="sy-grid2 wk-lower">
      <div class="sy-box">
        <div class="sy-box-h"><span class="kicker">Dự án &amp; việc</span>
          <span class="grow"></span>
          <span class="sy-legend">bấm vào dòng để thêm việc con</span></div>
        ${W.projects.length ? W.projects.map(p => {
    const total = p.tasks.reduce((a, t) => a + t.subs.length, 0);
    const done = p.tasks.reduce((a, t) => a + t.subs.filter(s => wkTaskDone(p, s.id)).length, 0);
    return `<details class="wk-prj" open>
            <summary>
              <span class="wk-prj-n">${esc(p.name)}</span>
              <span class="grow"></span>
              <span class="wk-prj-c">${done}/${total}</span>
              <button class="gd-del" data-delprj="${p.id}" title="Xoá dự án" aria-label="Xoá dự án ${esc(p.name)}">×</button>
            </summary>
            ${p.tasks.length ? p.tasks.map(t => `<div class="wk-task">
              <div class="wk-task-h">
                <span class="wk-task-t">${esc(t.title)}</span>
                ${t.link ? `<a class="wk-link" href="${esc(t.link)}">mở →</a>` : ''}
                <button class="wk-task-x" data-deltask="${p.id}:${t.id}" aria-label="Xoá việc">×</button>
              </div>
              <div class="wk-subs">
                ${t.subs.map(s => `<span class="wk-chip d${s.diff}${wkTaskDone(p, s.id) ? ' ok' : ''}">
                  <b>${esc(s.title)}</b><i>${WK_DAYS[s.day] || '?'}</i></span>`).join('') || '<span class="wk-empty-note">chưa chia việc con</span>'}
              </div>
              <button class="btn ghost sm wk-split" data-split="${p.id}:${t.id}">Chia việc con</button>
            </div>`).join('') : '<p class="sy-note">Chưa có việc nào. Thêm việc đầu tiên bên dưới.</p>'}
            <button class="btn ghost sm wk-addtask" data-addtask="${p.id}">+ Việc cho dự án này</button>
          </details>`;
  }).join('') : `<p class="sy-note">Chưa có dự án. Một dự án là thứ bạn đang làm trong tuần — “Ôn thi giữa kì Lí”, “Đọc hết chương 3”.</p>
        <button class="btn sm" id="wkNewPrj2">+ Dự án đầu tiên</button>`}
      </div>

      <div class="sy-box">
        <div class="sy-box-h"><span class="kicker">Ngày tôi có thể học</span></div>
        <p class="sy-note" style="margin-top:0">Việc con chỉ được rải vào những ngày được bật. Tắt bớt ngày là cách trung thực nhất để kế hoạch không tự lừa mình.</p>
        <div class="wk-days">
          ${WK_DAYS.map((d, i) => `<button class="wk-day${W.days[i] ? ' on' : ''}" data-wday="${i}"
            aria-pressed="${!!W.days[i]}">${d}</button>`).join('')}
        </div>
        <div class="pg-bars wk-bars">
          ${cols.map(c => {
    const max = Math.max(1, ...cols.map(x => x.items.length));
    return `<div class="pg-bcol"><div class="pg-bwrap"><i class="cur" style="height:${Math.round(c.items.length / max * 100)}%"></i></div>
              <span>${c.label}</span><em>${c.items.length}</em></div>`;
  }).join('')}
        </div>
        <p class="sy-note">Việc khó nên nằm ở đầu tuần: đó là lúc bạn còn sức nhất, và trễ một việc dễ thì dễ cứu hơn trễ một việc khó.</p>
      </div>
    </div>
  </section>`;

  /* ---------- tương tác ---------- */
  $('#wkPrev').onclick = () => { W.offset--; save(); renderWeekly(); };
  $('#wkNext').onclick = () => { W.offset++; save(); renderWeekly(); };
  $('#wkThis').onclick = () => { W.offset = 0; save(); renderWeekly(); };

  const pull = $('#wkPull');
  if (pull) pull.onclick = () => {
    const n = wkPullOverdue();
    renderWeekly();
    toast(n ? 'Đã kéo ' + n + ' việc trễ về hôm nay' : 'Không còn việc trễ');
  };

  const newPrj = () => uiPrompt('Dự án mới', '', v => {
    if (!v) return;
    wkAddProject(v.trim());
    renderWeekly();
    toast('Đã tạo dự án ' + v.trim());
  }, { hint: 'Ví dụ: Ôn thi giữa kì I môn Vật lí', okText: 'Tạo dự án' });
  const b1 = $('#wkNewPrj'), b2 = $('#wkNewPrj2');
  if (b1) b1.onclick = newPrj;
  if (b2) b2.onclick = newPrj;

  $$('[data-wday]').forEach(b => {
    b.onclick = () => {
      const i = +b.dataset.wday;
      if (W.days[i]) delete W.days[i]; else W.days[i] = 1;
      save(); renderWeekly();
    };
  });

  $$('[data-delprj]').forEach(b => {
    b.onclick = e => {
      e.preventDefault(); e.stopPropagation();
      const id = b.dataset.delprj;
      const p = wkPrj(id);
      if (!p) return;
      uiConfirm('Xoá dự án', `Xoá <b>${esc(p.name)}</b> cùng ${p.tasks.length} việc và mọi dấu đã xong?`, () => {
        W.projects = W.projects.filter(x => x.id !== id);
        save(); renderWeekly(); toast('Đã xoá dự án');
      }, { danger: true, okText: 'Xoá dự án' });
    };
  });

  $$('[data-deltask]').forEach(b => {
    b.onclick = () => {
      const [pid, tid] = b.dataset.deltask.split(':');
      const p = wkPrj(pid);
      if (!p) return;
      p.tasks = p.tasks.filter(t => t.id !== tid);
      save(); renderWeekly();
    };
  });

  $$('[data-addtask]').forEach(b => {
    b.onclick = () => uiPrompt('Việc mới', '', v => {
      if (!v) return;
      wkAddTask(b.dataset.addtask, v.trim());
      renderWeekly();
    }, { hint: 'Một việc là phần của dự án — ví dụ: “Đọc chương 3”', okText: 'Thêm việc' });
  });

  $$('[data-split]').forEach(b => {
    b.onclick = () => {
      const [pid, tid] = b.dataset.split.split(':');
      const p = wkPrj(pid);
      const t = p && p.tasks.find(x => x.id === tid);
      if (!t) return;
      uiPrompt('Chia thành việc con', '', v => {
        if (!v) return;
        /* nhiều dòng = nhiều việc con, rải tự động */
        const parts = v.split('\n').map(s => s.trim()).filter(Boolean);
        parts.forEach(s => wkAddSub(pid, tid, s, 2, undefined));
        wkAutoSpread(pid);
        renderWeekly();
        toast('Đã thêm ' + parts.length + ' việc con và rải vào các ngày bạn có thể học');
      }, {
        multiline: true,
        hint: 'Mỗi dòng một việc con. Thêm “khó:” hoặc “dễ:” ở đầu dòng để đặt độ khó — việc khó tự lên đầu tuần.',
        okText: 'Chia và rải',
      });
    };
  });

  $$('[data-day]').forEach(b => {
    b.onclick = () => {
      if (!W.projects.length) return newPrj();
      const day = +b.dataset.day;
      uiPrompt('Việc cho ' + WK_DAY_FULL[day], '', v => {
        if (!v) return;
        /* thêm nhanh vào dự án đầu tiên; nếu có nhiều thì hỏi */
        const p = W.projects[0];
        let t = p.tasks[p.tasks.length - 1];
        if (!t) t = wkAddTask(p.id, 'Việc trong tuần');
        wkAddSub(p.id, t.id, v.trim(), 2, day);
        renderWeekly();
      }, { hint: 'Việc này sẽ nằm ở ' + WK_DAY_FULL[day] + '.', okText: 'Thêm' });
    };
  });

  /* bấm vào một việc con = đánh dấu xong */
  $$('.wk-item').forEach(el => {
    const btn = el.querySelector('.wk-check');
    const flip = () => {
      if (!wkToggle(el.dataset.prj, el.dataset.sub)) return;
      renderWeekly();
    };
    if (btn) btn.onclick = flip;
  });
}
