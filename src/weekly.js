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
    /* Which week this belongs to. Without this, "end week" and "next week" were
       only labels over the same seven columns — every item showed up in every
       week, so a week could never actually be finished. */
    w: wkState().offset || 0,
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
        if ((s.w || 0) !== off) return;
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
   OPERATIONS the board needs to behave like a real planner
   ========================================================= */

/* Move one item to another day (drag, or keyboard arrows). Dragging across a
   week boundary retargets the item's week too — otherwise dropping Tuesday's
   task on next Monday would silently vanish from both views. */
function wkMove(prjId, subId, day, off) {
  const p = wkPrj(prjId);
  if (!p) return false;
  const W = wkState();
  const target = off === undefined ? W.offset : off;
  let found = null;
  p.tasks.forEach(t => t.subs.forEach(s => { if (s.id === subId) found = s; }));
  if (!found) return false;
  found.day = Math.max(0, Math.min(6, +day));
  found.w = target;
  save();
  return true;
}

/* Whole-task move: every subtask of one task shifts to the same day.
   Used when a task has several pieces and the point is "this whole thing
   lands on Thursday", not one fragment of it. */
function wkMoveTask(prjId, taskId, day, off) {
  const p = wkPrj(prjId);
  const t = p && p.tasks.find(x => x.id === taskId);
  if (!t || !t.subs.length) return 0;
  t.subs.forEach(s => {
    s.day = Math.max(0, Math.min(6, +day));
    s.w = off === undefined ? wkState().offset : off;
  });
  save();
  return t.subs.length;
}

/* Everything still open in the current week, in board order. */
function wkOpenItems() {
  const out = [];
  wkPlan().forEach(c => c.items.forEach(it => { if (!it.done) out.push(it); }));
  return out;
}

/* "Move work" — the beaverplans answer to a week that ran out of days.
   Each open item gets a specific new home rather than being dumped on the
   next day, so nothing becomes a permanent guest on Tuesday. */
function wkMoveWork(plan) {
  const W = wkState();
  let n = 0;
  (plan || []).forEach(x => {
    const p = wkPrj(x.prj);
    if (!p) return;
    let s = null;
    p.tasks.forEach(t => t.subs.forEach(z => { if (z.id === x.sub) s = z; }));
    if (!s) return;
    s.day = Math.max(0, Math.min(6, +x.day));
    s.w = (x.w === undefined ? W.offset : x.w);
    n++;
  });
  save();
  return n;
}

/* Close the week. Open work goes to next week by default — the alternative
   (throwing it away) teaches people to hide work instead of finishing it.
   Returns what happened so the UI can say it plainly. */
function wkEndWeek(moveToNextWeek) {
  const W = wkState();
  const open = wkOpenItems();
  const st = wkStats(W.offset);
  if (moveToNextWeek !== false) {
    open.forEach(it => {
      const s = it.sub;
      s.w = W.offset + 1;
      /* keep the weekday if it still makes sense, else let Sunday carry it */
      s.day = Math.min(6, s.day === null ? 6 : s.day);
    });
  }
  W.finished = W.finished || {};
  W.finished[W.offset] = {
    at: Date.now(), done: st.done, all: st.all,
    carried: moveToNextWeek === false ? 0 : open.length,
  };
  if (moveToNextWeek !== false) W.offset = W.offset + 1;
  save();
  return { done: st.done, all: st.all, carried: moveToNextWeek === false ? 0 : open.length };
}

/* Which weeks have a record, so the header can show "week 3 of the term". */
function wkFinished(off) {
  const W = wkState();
  return (W.finished && W.finished[off === undefined ? W.offset : off]) || null;
}

/* ---------- copy / paste plan -------------------------------------
   The feature students actually ask for: reuse last week's shape. It copies
   structure (project → task → subtask) and difficulty, and deliberately not
   the tick marks — a plan you have not done yet is not a finished one. */
function wkCopyPlan(off) {
  const W = wkState();
  const src = off === undefined ? W.offset : off;
  const plan = { v: 1, days: Object.keys(W.days || {}).filter(d => W.days[d]).map(Number), projects: [] };
  W.projects.forEach(p => {
    const pr = { name: p.name, tasks: [] };
    p.tasks.forEach(t => {
      const subs = t.subs.filter(s => (s.w || 0) === src);
      if (!subs.length) return;
      pr.tasks.push({
        title: t.title, link: t.link || '',
        subs: subs.map(s => ({ title: s.title, diff: s.diff, day: s.day })),
      });
    });
    if (pr.tasks.length) plan.projects.push(pr);
  });
  return JSON.stringify(plan, null, 1);
}

/* Paste into the current week. Matches existing projects by name instead of
   creating duplicates on every paste — pasting the same plan twice should
   double the work, not double the projects. */
function wkPastePlan(raw, off) {
  let data;
  try { data = typeof raw === 'string' ? JSON.parse(raw) : raw; }
  catch (e) { return { ok: false, why: 'json' }; }
  if (!data || !Array.isArray(data.projects)) return { ok: false, why: 'shape' };
  const W = wkState();
  const target = off === undefined ? W.offset : off;
  let added = 0;
  if (Array.isArray(data.days) && data.days.length) {
    W.days = {};
    data.days.forEach(d => { W.days[d] = 1; });
  }
  data.projects.forEach(pr => {
    let p = W.projects.find(x => norm(x.name) === norm(pr.name));
    if (!p) p = wkAddProject(pr.name);
    (pr.tasks || []).forEach(t => {
      let task = p.tasks.find(x => norm(x.title) === norm(t.title));
      if (!task) task = wkAddTask(p.id, t.title, { link: t.link });
      (t.subs || []).forEach(s => {
        const z = wkAddSub(p.id, task.id, s.title, s.diff, s.day === undefined ? null : s.day);
        if (z) { z.w = target; added++; }
      });
    });
  });
  save();
  return { ok: true, added: added };
}

/* ---------- smart spread ------------------------------------------
   beaverplans spreads by difficulty. Students have a second constraint the
   original does not model: a heavy day is a day that gets skipped. So the
   spread respects both — hardest first, but never more than the soft cap,
   and it will leave a day empty rather than stack it. */
function wkSpreadBalanced(prjId) {
  const W = wkState();
  const days = Object.keys(W.days).filter(d => W.days[d]).map(Number).sort((a, b) => a - b);
  if (!days.length) return 0;
  const pool = [];
  W.projects.filter(p => !prjId || p.id === prjId).forEach(p => {
    p.tasks.forEach(t => t.subs.forEach(s => {
      if (s.day === null || s.day === undefined) pool.push(s);
    }));
  });
  if (!pool.length) return 0;
  pool.sort((a, b) => (b.diff || 2) - (a.diff || 2));

  /* start from what is already committed to each day */
  const load = {};
  days.forEach(d => {
    load[d] = 0;
    W.projects.forEach(p => p.tasks.forEach(t => t.subs.forEach(s => {
      if ((s.day === d) && (s.w || 0) === W.offset && !pool.includes(s)) load[d] += (s.diff || 2);
    })));
  });
  const cap = Math.max(4, Math.ceil(pool.reduce((a, s) => a + (s.diff || 2), 0) / days.length) + 2);
  pool.forEach(s => {
    /* least-loaded allowed day wins; ties go to the earlier day, which keeps
       hard work near the start where there is still energy */
    let best = days[0];
    for (const d of days) if (load[d] < load[best]) best = d;
    if (load[best] > cap) {
      /* everything is full: give it to the lightest day anyway, but do not
         pretend the week is not overloaded — the UI says so separately */
      best = days.reduce((a, d) => (load[d] <= load[a] ? d : a), days[0]);
    }
    s.day = best;
    s.w = W.offset;
    load[best] += (s.diff || 2);
  });
  save();
  return pool.length;
}

/* Per-day load, in difficulty points. Used to warn before a week is planned
   into the ground — a warning on Monday is worth more than guilt on Sunday. */
function wkLoad(off) {
  const W = wkState();
  const out = WK_DAYS.map((label, i) => ({ day: i, label: label, pts: 0, n: 0, open: 0 }));
  wkPlan(off).forEach(c => c.items.forEach(it => {
    out[c.day].pts += (it.sub.diff || 2);
    out[c.day].n++;
    if (!it.done) out[c.day].open++;
  }));
  return out;
}


/* ---------- pick a lesson to attach to a task -----------------------
   This is the part beaverplans cannot do: it has no lessons. Here a task can
   point at the actual session in the plan, so "Ôn tụ điện" opens the exact
   lesson instead of a generic page. Flat list, searchable, keyboard-friendly. */
function wkAllLessons() {
  const out = [];
  DAYS.forEach(d => d.sessions.forEach(s => {
    out.push({ d: d.n, s: s.n, title: s.title, day: d.title, href: '#/lesson/' + d.n + '/' + s.n });
  }));
  return out;
}

function wkPickLesson(current, cb) {
  const all = wkAllLessons();
  const box = document.createElement('div');
  box.className = 'overlay ui-ov';
  box.innerHTML = `<div class="ov-panel wk-pick" role="dialog" aria-label="Gắn bài học">
    <div class="cal-mh"><span class="kicker">Gắn bài học</span><span class="grow"></span>
      <button class="bd-x" aria-label="Đóng">×</button></div>
    <div class="cal-mb">
      <input id="wkPickQ" type="text" placeholder="Tìm theo tên bài hoặc ngày…" autocomplete="off">
      <div class="wk-pick-list" id="wkPickList" role="listbox" aria-label="Danh sách bài học"></div>
    </div>
    <div class="cal-mf">
      <button class="btn ghost sm" id="wkPickNo">Bỏ gắn</button>
      <span class="grow"></span>
      <button class="btn ghost sm" id="wkPickClose">Đóng</button>
    </div>
  </div>`;
  document.body.appendChild(box);
  const q = $('#wkPickQ', box);
  const list = $('#wkPickList', box);
  const close = () => box.remove();

  const paint = () => {
    /* norm() only strips Vietnamese diacritics; it leaves the space alone, so a
       search for "tụ điện" became "tu dien" and matched nothing in a title that
       normalises to "tu dien". Normalising both sides is not enough — the term
       has to be normalised too. */
    const k = norm(q.value).replace(/\s+/g, '');
    const hits = all.filter(x =>
      !k || norm(x.title + ' ' + x.day).replace(/\s+/g, '').includes(k)
    ).slice(0, 60);
    list.innerHTML = hits.length ? hits.map(x =>
      `<button class="wk-pick-r${norm(current || '') === norm(x.href) ? ' on' : ''}" role="option"
        aria-selected="${norm(current || '') === norm(x.href)}" data-href="${x.href}">
        <span class="wk-pick-d">Ngày ${String(x.d).padStart(2, '0')}</span>
        <span class="wk-pick-t">${esc(x.title)}</span>
      </button>`).join('')
      : '<p class="sy-note" style="padding:10px">Không có bài nào khớp.</p>';
    [...list.querySelectorAll('[data-href]')].forEach(b => {
      b.onclick = () => { close(); cb(b.dataset.href); };
    });
  };
  q.oninput = paint;
  q.onkeydown = e => {
    if (e.key === 'Escape') return close();
    if (e.key === 'Enter') {
      const first = list.querySelector('[data-href]');
      if (first) first.click();
    }
  };
  box.querySelector('.bd-x').onclick = close;
  $('#wkPickClose', box).onclick = close;
  $('#wkPickNo', box).onclick = () => { close(); cb(''); };
  box.onclick = e => { if (e.target === box) close(); };
  paint();
  setTimeout(() => q.focus(), 40);
}

/* ---------- the guided empty state ----------------------------------
   beaverplans grew a three-step guide because a seven-column board with
   nothing in it explains nothing. Same reasoning here: an empty week shows
   the shape of the thing and the first action, not a wall of zeros. */
function wkGuideHtml() {
  const steps = [
    { n: '1', t: 'Tạo một dự án', d: 'Thứ bạn đang làm trong tuần này — “Ôn thi giữa kì Lí”, “Đọc hết chương 3”.', ex: 'Ôn thi giữa kì Lí' },
    { n: '2', t: 'Thêm một việc', d: 'Một phần của dự án, đủ lớn để đáng làm và đủ nhỏ để xong được.', ex: 'Chương 3 — điện trường' },
    { n: '3', t: 'Chia thành việc con', d: 'Rải vào những ngày bạn thật sự học. Việc khó lên đầu tuần, khi còn sức.', ex: 'khó: 15 bài tập tụ điện' },
  ];
  return `<div class="wk-guide">
    <div class="wk-guide-h">
      <span class="kicker">Bắt đầu</span>
      <h2>Lên kế hoạch tuần</h2>
      <p>Ba bước, rồi kế hoạch thành việc cụ thể cho từng ngày.</p>
    </div>
    <ol class="wk-steps">
      ${steps.map(s => `<li>
        <span class="wk-step-n">${s.n}</span>
        <div><b>${s.t}</b><p>${s.d}</p><code>${esc(s.ex)}</code></div>
      </li>`).join('')}
    </ol>
    <div class="sy-btnrow">
      <button class="btn" id="wkGuideStart">+ Dự án đầu tiên</button>
      <button class="btn ghost sm" id="wkGuideSkip">Bỏ qua hướng dẫn</button>
    </div>
  </div>`;
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
  const rangeVN = monday.getDate() + '/' + (monday.getMonth() + 1) + ' – ' +
    sunday.getDate() + '/' + (sunday.getMonth() + 1);
  const left = Math.max(0, 6 - todayIdx);
  const fin = wkFinished(off);
  const load = wkLoad(off);
  const maxPts = Math.max(1, ...load.map(l => l.pts));
  const openN = st.left;

  /* The header line is the one sentence that should be true at a glance.
     beaverplans says "2 days left — make them count"; the useful version for
     a student also has to say whether the week is already overloaded. */
  let headline;
  if (!st.all) headline = 'Tuần trống — thêm dự án rồi chia việc';
  else if (st.left === 0) headline = 'Xong cả tuần · ' + st.all + '/' + st.all + ' việc';
  else if (showToday && left === 0) headline = 'Hôm nay là Chủ nhật · còn ' + st.left + ' việc';
  else if (showToday) headline = 'Còn ' + left + ' ngày — ' + st.left + ' việc đang chờ';
  else headline = st.done + '/' + st.all + ' việc · ' + st.pct + '%';

  const overCap = load.filter(l => l.pts > maxPts * 0.75 && l.n > 3 && l.open);
  const warn = overCap.length
    ? `<p class="wk-warn">${WK_DAY_FULL[overCap[0].day].replace('Thứ ', 'Thứ ')} đang dồn ${overCap[0].open} việc — dời bớt một việc khó sang ngày trống sẽ dễ xong hơn là cố hết.</p>`
    : '';

  const itemHtml = it => `<div class="wk-item d${it.sub.diff || 2}${it.done ? ' ok' : ''}"
      data-prj="${it.prj.id}" data-sub="${it.sub.id}" data-task="${it.task.id}"
      draggable="true" tabindex="0" role="listitem"
      aria-label="${esc(it.sub.title)} — ${esc(it.prj.name)}, độ khó ${(it.sub.diff || 2) === 1 ? 'dễ' : (it.sub.diff || 2) === 3 ? 'khó' : 'vừa'}">
      <button class="wk-check" aria-label="${it.done ? 'Bỏ đánh dấu' : 'Đánh dấu xong'}: ${esc(it.sub.title)}">${it.done ? '✓' : ''}</button>
      <span class="wk-t">
        <b>${esc(it.sub.title)}</b>
        <i><span class="wk-dot" style="background:${it.prj.color || 'var(--ink-3)'}"></span>${esc(it.prj.name)}${it.task.link ? ` · <a href="${esc(it.task.link)}">mở bài</a>` : ''}</i>
      </span>
      <span class="wk-diff d${it.sub.diff || 2}">${(it.sub.diff || 2) === 1 ? 'dễ' : (it.sub.diff || 2) === 3 ? 'khó' : 'vừa'}</span>
    </div>`;

  const colHtml = c => {
    const isToday = showToday && c.day === todayIdx;
    const past = showToday && c.day < todayIdx;
    const open = W.days[c.day];
    const L = load[c.day];
    const doneN = c.items.filter(i => i.done).length;
    return `<div class="wk-col${isToday ? ' today' : ''}${past ? ' past' : ''}${open ? '' : ' off'}"
       data-col="${c.day}" role="list"
       aria-label="${WK_DAY_FULL[c.day]} ${c.date.getDate()}/${c.date.getMonth() + 1}">
      <div class="wk-col-h">
        <span class="wk-d">${c.label}${isToday ? '<em class="wk-now">hôm nay</em>' : ''}</span>
        <span class="wk-date">${c.date.getDate()}/${c.date.getMonth() + 1}</span>
        ${c.items.length ? `<span class="wk-n">${doneN}/${c.items.length}</span>` : ''}
      </div>
      <div class="wk-bar"><i style="width:${maxPts ? Math.round(L.pts / maxPts * 100) : 0}%"></i></div>
      <div class="wk-col-b">
        ${c.items.length ? c.items.map(itemHtml).join('') : '<span class="wk-empty">—</span>'}
      </div>
      <button class="wk-add-sub" data-day="${c.day}" aria-label="Thêm việc cho ${WK_DAY_FULL[c.day]}">+</button>
    </div>`;
  };

  $('#main').innerHTML = `<section class="wrap wide sy-page">
    <div class="wk-top">
      <div class="wk-top-l">
        <span class="kicker">Kế hoạch tuần · ${st.all || 0} việc · ${st.pct || 0}%</span>
        <h1 class="wk-h1">${headline}</h1>
        <div class="wk-nav">
          <button class="wk-arrow" id="wkPrev" aria-label="Tuần trước">‹</button>
          <span class="wk-range">${rangeVN}${off === 0 ? ' · tuần này' : off > 0 ? ' · tuần sau' : ' · tuần trước'}</span>
          <button class="wk-arrow" id="wkNext" aria-label="Tuần sau">›</button>
          ${off !== 0 ? '<button class="wk-today" id="wkThis">về tuần này</button>' : ''}
        </div>
      </div>
      <div class="wk-top-r">
        <div class="wk-prog">
          <span class="wk-prog-pct">${st.pct}%</span>
          <span class="wk-prog-n">${st.done}/${st.all} việc</span>
        </div>
        <div class="wk-tools">
          <button class="wk-chip-btn" id="wkCopy" title="Sao chép kế hoạch tuần này thành văn bản">Sao chép tuần</button>
          <button class="wk-chip-btn" id="wkPaste" title="Dán kế hoạch đã sao chép">Dán tuần</button>
          <button class="wk-chip-btn" id="wkMove" ${openN ? '' : 'disabled'} title="Dời từng việc chưa xong sang ngày khác">Dời việc${openN ? ' · ' + openN : ''}</button>
          <button class="wk-chip-btn wk-end" id="wkEnd" title="Chốt tuần và mang việc còn lại sang tuần sau">Chốt tuần</button>
        </div>
      </div>
    </div>

    ${fin ? `<p class="wk-finished">Tuần đã chốt: ${fin.done}/${fin.all} việc · ${fin.carried} việc mang sang tuần sau.</p>` : ''}
    ${warn}

    ${!W.projects.length && !st.all ? wkGuideHtml() : `
    <div class="wk-board" id="wkBoard">
      ${cols.map(colHtml).join('')}
    </div>

    <p class="wk-hint">Kéo một việc sang ngày khác, hoặc bấm vào nó rồi dùng ← → để dời bằng bàn phím.
      <span class="wk-only-fine">Việc khó nằm ở đầu tuần khi bạn còn sức.</span></p>

    `}
    ${overdue.length ? `<div class="wk-overdue">
      <span><b>${overdue.length} việc</b> của những ngày đã qua mà chưa xong.</span>
      <button class="btn ghost sm" id="wkPull">Kéo về hôm nay</button>
    </div>` : ''}

    <div class="wk-lower">
      <div class="wk-panel">
        <div class="wk-panel-h">
          <span class="kicker">Dự án &amp; việc</span>
          <span class="grow"></span>
          <button class="btn sm" id="wkNewPrj">+ Dự án</button>
        </div>
        ${W.projects.length ? W.projects.map(p => {
    const total = p.tasks.reduce((a, t) => a + t.subs.filter(s => (s.w || 0) === off).length, 0);
    const done = p.tasks.reduce((a, t) => a + t.subs.filter(s => (s.w || 0) === off && wkTaskDone(p, s.id)).length, 0);
    return `<details class="wk-prj" ${total ? 'open' : ''}>
            <summary>
              <span class="wk-swatch" style="background:${p.color || 'var(--ink-3)'}"></span>
              <span class="wk-prj-n">${esc(p.name)}</span>
              <span class="grow"></span>
              <span class="wk-prj-c">${done}/${total}</span>
              <button class="gd-del" data-delprj="${p.id}" title="Xoá dự án" aria-label="Xoá dự án ${esc(p.name)}">×</button>
            </summary>
            ${p.tasks.length ? p.tasks.map(t => `<div class="wk-task">
              <div class="wk-task-h">
                <span class="wk-task-t">${esc(t.title)}</span>
                ${t.link ? `<a class="wk-link" href="${esc(t.link)}">mở →</a>` : ''}
                <button class="wk-link wk-linkbtn" data-linktask="${p.id}:${t.id}"
                  title="${t.link ? 'Đổi bài học' : 'Gắn bài học trong lộ trình'}">${t.link ? 'đổi bài' : '+ bài học'}</button>
                <button class="wk-task-x" data-deltask="${p.id}:${t.id}" aria-label="Xoá việc">×</button>
              </div>
              <div class="wk-subs">
                ${t.subs.filter(s => (s.w || 0) === off).map(s => `<span class="wk-chip d${s.diff}${wkTaskDone(p, s.id) ? ' ok' : ''}">
                  <b>${esc(s.title)}</b><i>${WK_DAYS[s.day] || '?'}</i></span>`).join('') || '<span class="wk-empty-note">chưa có việc con trong tuần này</span>'}
              </div>
              <div class="wk-task-a">
                <button class="btn ghost sm wk-split" data-split="${p.id}:${t.id}">Chia việc con</button>
                ${t.subs.filter(s2 => (s2.w || 0) === off).length
      ? `<button class="btn ghost sm" data-pushtask="${p.id}:${t.id}" title="Dồn cả việc này sang một ngày">Dồn một ngày</button>`
      : ''}
                <button class="btn ghost sm" data-spread="${p.id}" title="Rải việc chưa xếp ngày, cân theo sức">Rải đều</button>
              </div>
            </div>`).join('') : '<p class="sy-note">Chưa có việc nào. Thêm việc đầu tiên bên dưới.</p>'}
            <button class="btn ghost sm wk-addtask" data-addtask="${p.id}">+ Việc cho dự án này</button>
          </details>`;
  }).join('') : `<p class="sy-note">Chưa có dự án. Một dự án là thứ bạn đang làm trong tuần — “Ôn thi giữa kì Lí”, “Đọc hết chương 3”.</p>
        <button class="btn sm" id="wkNewPrj2">+ Dự án đầu tiên</button>`}
      </div>

      <div class="wk-panel">
        <div class="wk-panel-h"><span class="kicker">Ngày tôi có thể học</span></div>
        <p class="sy-note" style="margin-top:0">Việc con chỉ rải vào những ngày được bật. Tắt bớt ngày là cách trung thực nhất để kế hoạch không tự lừa mình.</p>
        <div class="wk-days">
          ${WK_DAYS.map((d, i) => `<button class="wk-day${W.days[i] ? ' on' : ''}" data-wday="${i}"
            aria-pressed="${!!W.days[i]}" ${WK_DAY_FULL[i]}">${d}</button>`).join('')}
        </div>
        <div class="wk-load">
          ${load.map(l => `<div class="wk-load-r">
            <span class="wk-load-d">${l.label}</span>
            <span class="wk-load-bar"><i style="width:${maxPts ? Math.round(l.pts / maxPts * 100) : 0}%;${!W.days[l.day] ? 'opacity:.35' : ''}"></i></span>
            <span class="wk-load-n">${l.open ? l.open : ''}${l.open && l.n !== l.open ? '/' + l.n : !l.open && l.n ? '✓' : ''}</span>
          </div>`).join('')}
        </div>
        <p class="sy-note">Điểm tải = tổng độ khó của việc trong ngày (dễ 1 · vừa 2 · khó 3). Cột đầy là ngày đó sẽ bị bỏ.</p>
      </div>
    </div>
  </section>`;

  /* ---------- week navigation ---------- */
  $('#wkPrev').onclick = () => { W.offset--; save(); renderWeekly(); };
  $('#wkNext').onclick = () => { W.offset++; save(); renderWeekly(); };
  const thisBtn = $('#wkThis');
  if (thisBtn) thisBtn.onclick = () => { W.offset = 0; save(); renderWeekly(); };

  /* ---------- copy / paste / move / end ---------- */
  $('#wkCopy').onclick = () => {
    const txt = wkCopyPlan(off);
    if (!txt.includes('"projects": []')) {
      uiPrompt('Kế hoạch tuần ' + rangeVN, txt, v => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(v).then(() => toast('Đã chép kế hoạch')).catch(() => toast('Đã hiện — chép tay phần đã chọn'));
        } else toast('Đã hiện — chép tay phần đã chọn');
      }, { multiline: true, hint: 'Nội dung này dán được sang tuần khác bằng nút Paste plan.' });
    } else {
      toast('Tuần này chưa có việc nào để chép');
    }
  };

  $('#wkPaste').onclick = () => {
    uiPrompt('Dán kế hoạch', '', v => {
      const r = wkPastePlan(v, off);
      if (!r.ok) return toast(r.why === 'json' ? 'Không đọc được — cần đúng văn bản đã Copy' : 'Văn bản không phải kế hoạch');
      renderWeekly();
      toast('Đã thêm ' + r.added + ' việc vào tuần này');
    }, {
      multiline: true,
      hint: 'Dán phần đã Copy ở tuần khác. Việc trùng tên được xếp vào đúng dự án cũ, không tạo dự án mới.',
      okText: 'Dán',
    });
  };

  const moveBtn = $('#wkMove');
  if (moveBtn) moveBtn.onclick = () => {
    const open = wkOpenItems();
    if (!open.length) return toast('Không còn việc nào để dời');
    /* Default proposal: keep each item's weekday but push the ones on days
       already gone to the next open day. The student can edit the list;
       nothing moves until they press the button. */
    const lines = open.map(it => {
      const d = Math.max(it.sub.day, showToday ? todayIdx : it.sub.day);
      return `${WK_DAYS[d]}\t${it.sub.title}`;
    }).join('\n');
    uiPrompt('Dời việc — sửa ngày ở đầu mỗi dòng', lines, v => {
      const plan = [];
      v.split('\n').forEach(line => {
        const m = line.match(/^\s*(T2|T3|T4|T5|T6|T7|CN)\s+(.+)$/i);
        if (!m) return;
        const idx = WK_DAYS.indexOf(m[1].toUpperCase());
        if (idx < 0) return;
        const hit = open.find(it => it.sub.title === m[2].trim());
        if (hit) plan.push({ prj: hit.prj.id, sub: hit.sub.id, day: idx });
      });
      const n = wkMoveWork(plan);
      renderWeekly();
      toast(n ? 'Đã dời ' + n + ' việc' : 'Không dòng nào đúng dạng T2/T3… + tên việc');
    }, {
      multiline: true,
      hint: 'Mỗi dòng: một trong T2 T3 T4 T5 T6 T7 CN, cách ra, rồi tên việc. Sửa ngày là xong.',
      okText: 'Dời việc',
    });
  };

  $('#wkEnd').onclick = () => {
    if (!st.all) return uiConfirm('Chốt tuần trống?', 'Tuần này chưa có việc nào. Vẫn chuyển sang tuần sau?', () => {
      wkEndWeek(true); renderWeekly(); toast('Đã sang tuần sau');
    }, { okText: 'Sang tuần sau' });
    uiConfirm('Chốt tuần ' + rangeVN + '?',
      `Đã xong <b>${st.done}/${st.all}</b> việc.${st.left ? ` <b>${st.left} việc</b> còn lại sẽ được mang sang tuần sau, giữ nguyên thứ trong tuần.` : ' Không còn việc nào — tuần này trọn vẹn.'}`,
      () => {
        const r = wkEndWeek(true);
        renderWeekly();
        toast('Đã chốt tuần · ' + r.done + '/' + r.all + (r.carried ? ' · ' + r.carried + ' việc sang tuần sau' : ''));
      }, { okText: 'Chốt và sang tuần sau' });
  };

  /* ---------- drag and drop ---------- */
  let dragEl = null;
  $$('.wk-item').forEach(el => {
    el.addEventListener('dragstart', e => {
      dragEl = el;
      el.classList.add('dragging');
      try { e.dataTransfer.setData('text/plain', el.dataset.sub); e.dataTransfer.effectAllowed = 'move'; } catch (err) { }
    });
    el.addEventListener('dragend', () => {
      el.classList.remove('dragging');
      $$('.wk-col').forEach(c => c.classList.remove('over'));
      dragEl = null;
    });
  });
  $$('.wk-col').forEach(col => {
    col.addEventListener('dragover', e => {
      if (!dragEl) return;
      e.preventDefault();
      try { e.dataTransfer.dropEffect = 'move'; } catch (err) { }
      col.classList.add('over');
    });
    col.addEventListener('dragleave', () => col.classList.remove('over'));
    col.addEventListener('drop', e => {
      e.preventDefault();
      col.classList.remove('over');
      if (!dragEl) return;
      const day = +col.dataset.col;
      if (wkMove(dragEl.dataset.prj, dragEl.dataset.sub, day, off)) {
        renderWeekly();
        toast('Đã dời sang ' + WK_DAY_FULL[day]);
      }
    });
  });

  /* keyboard: focus an item, ← → move it a day. Drag is unavailable to a lot
     of people — keyboard and touch have to reach the same operation. */
  $$('.wk-item').forEach(el => {
    el.onkeydown = e => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const day = Math.max(0, Math.min(6, +el.closest('.wk-col').dataset.col + (e.key === 'ArrowRight' ? 1 : -1)));
      if (wkMove(el.dataset.prj, el.dataset.sub, day, off)) {
        renderWeekly();
        const again = $(`.wk-item[data-sub="${el.dataset.sub}"]`);
        if (again) again.focus();
        toast('Đã dời sang ' + WK_DAY_FULL[day]);
      }
    };
  });

  /* ---------- the rest ---------- */
  const pull = $('#wkPull');
  if (pull) pull.onclick = () => {
    const n = wkPullOverdue();
    renderWeekly();
    toast(n ? 'Đã kéo ' + n + ' việc trễ về hôm nay' : 'Không còn việc trễ');
  };

  const newPrj = () => uiPrompt('Dự án mới', '', v => {
    if (!v) return;
    const pal = ['#c6542d', '#3f6b4e', '#2f5f92', '#8b6b34', '#6b4f7a', '#a85a1c'];
    wkAddProject(v.trim(), pal[wkState().projects.length % pal.length]);
    renderWeekly();
    toast('Đã tạo dự án ' + v.trim());
  }, { hint: 'Ví dụ: Ôn thi giữa kì I môn Vật lí', okText: 'Tạo dự án' });
  const b1 = $('#wkNewPrj'), b2 = $('#wkNewPrj2'), b3 = $('#wkGuideStart');
  if (b1) b1.onclick = newPrj;
  if (b2) b2.onclick = newPrj;
  if (b3) b3.onclick = newPrj;
  const skip = $('#wkGuideSkip');
  if (skip) skip.onclick = () => { wkState().noGuide = 1; save(); renderWeekly(); };

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

  /* "Dồn một ngày" — a task with five pieces is often really one sitting's
     work. Moving them one drag at a time is busywork; this moves the set. */
  $$('[data-pushtask]').forEach(b => {
    b.onclick = () => {
      const [pid, tid] = b.dataset.pushtask.split(':');
      uiPrompt('Dồn việc sang ngày nào?', 'T3', v => {
        const want = norm(v).toUpperCase();
        const idx = WK_DAYS.findIndex(d => norm(d).toUpperCase() === want || norm(d).toUpperCase() === ('THU' + (want[1] || '')));
        const day = idx >= 0 ? idx : WK_DAYS.findIndex(d => norm(d) === want);
        if (day < 0) return toast('Cần một ngày: T2 T3 T4 T5 T6 T7 hoặc CN');
        const n = wkMoveTask(pid, tid, day, off);
        renderWeekly();
        toast(n ? 'Đã dồn ' + n + ' việc con sang ' + WK_DAY_FULL[day] : 'Việc này chưa có việc con');
      }, { hint: 'T2 T3 T4 T5 T6 T7 CN — mọi việc con của việc này sẽ sang ngày đó.', okText: 'Dồn' });
    };
  });

  $$('[data-linktask]').forEach(b => {
    b.onclick = () => {
      const [pid, tid] = b.dataset.linktask.split(':');
      const p = wkPrj(pid);
      const t = p && p.tasks.find(x => x.id === tid);
      if (!t) return;
      wkPickLesson(t.link, href => {
        t.link = href;
        save();
        renderWeekly();
        toast(href ? 'Đã gắn bài học — bấm “mở” để vào thẳng bài' : 'Đã bỏ liên kết');
      });
    };
  });

  $$('[data-spread]').forEach(b => {
    b.onclick = () => {
      const n = wkSpreadBalanced(b.dataset.spread);
      renderWeekly();
      toast(n ? 'Đã rải ' + n + ' việc theo sức từng ngày' : 'Không có việc nào chưa xếp ngày');
    };
  });

  $$('[data-split]').forEach(b => {
    b.onclick = () => {
      const [pid, tid] = b.dataset.split.split(':');
      const p = wkPrj(pid);
      const t = p && p.tasks.find(x => x.id === tid);
      if (!t) return;
      uiPrompt('Chia thành việc con', '', v => {
        if (!v) return;
        const parts = v.split('\n').map(x => x.trim()).filter(Boolean);
        parts.forEach(x => wkAddSub(pid, tid, x, 2, undefined));
        const n = wkSpreadBalanced(pid);
        renderWeekly();
        toast('Đã thêm ' + parts.length + ' việc con' + (n ? ' và rải theo sức từng ngày' : ''));
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
        const p = W.projects[0];
        let t = p.tasks[p.tasks.length - 1];
        if (!t) t = wkAddTask(p.id, 'Việc trong tuần');
        wkAddSub(p.id, t.id, v.trim(), 2, day);
        renderWeekly();
      }, { hint: 'Việc này sẽ nằm ở ' + WK_DAY_FULL[day] + '.', okText: 'Thêm' });
    };
  });

  $$('.wk-item').forEach(el => {
    const btn = el.querySelector('.wk-check');
    const flip = () => {
      if (!wkToggle(el.dataset.prj, el.dataset.sub)) return;
      renderWeekly();
    };
    if (btn) btn.onclick = flip;
  });
}
