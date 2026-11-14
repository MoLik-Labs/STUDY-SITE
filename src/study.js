/* =========================================================
   STUDY OS — trung tâm tự học
   · Dashboard "Học hôm nay"
   · Flashcards lặp lại cách quãng (mọi lớp, mọi môn)
   · Tự tạo đề luyện từ câu hỏi của bài học
   · Kế hoạch học tới ngày thi
   · Đồng hồ tập trung + nhật ký phút học
   · Ghi chú & giảng lại (Feynman) trong từng bài
   ========================================================= */

const SY_DAY = 86400000;
const SY_INTERVALS = [10 / 1440, 1, 2, 4, 8, 16, 32];   /* hộp 0..6 (ngày) */
const SY_BOX_LABEL = ['10 phút', '1 ngày', '2 ngày', '4 ngày', '8 ngày', '16 ngày', '32 ngày'];

const syDayKey = (ts) => {
  const d = new Date(ts === undefined ? Date.now() : ts);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};
const syTime = ts => {
  const d = new Date(ts);
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
};
const syDateVN = ts => {
  const d = new Date(ts);
  return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');
};
const syNum = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

function studyState() {
  if (!state.study) state.study = {};
  const S = state.study;
  if (!Array.isArray(S.cards)) S.cards = [];
  if (!Array.isArray(S.sessions)) S.sessions = [];
  if (!Array.isArray(S.results)) S.results = [];
  if (!S.notes || typeof S.notes !== 'object') S.notes = {};
  if (!S.goal) S.goal = { min: 60, cards: 20 };
  if (!isFinite(S.goal.min)) S.goal.min = 60;
  if (!isFinite(S.goal.cards)) S.goal.cards = 20;
  if (S.plan === undefined) S.plan = null;
  if (!S.focus || typeof S.focus !== 'object') S.focus = { mode: 25, left: 25 * 60, endAt: 0, running: false };
  return S;
}
const sySid = () => 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

let syKeyOff = null;
function syCleanup() { if (syKeyOff) { try { syKeyOff(); } catch (e) { } syKeyOff = null; } }
function syBindKeys(fn) {
  syCleanup();
  const h = e => { syKeyOff && fn(e); };
  document.addEventListener('keydown', h);
  syKeyOff = () => document.removeEventListener('keydown', h);
}

/* ---------------- thẻ ghi nhớ ---------------- */
function syDue(now) {
  const t = now || Date.now();
  return studyState().cards.filter(c => (c.due || 0) <= t);
}
function syNewCards() { return studyState().cards.filter(c => !c.reps); }

function syAddCard(o) {
  const S = studyState();
  const c = {
    id: sySid(), g: +o.g || 9, s: o.s || 'vatli',
    front: String(o.front || '').trim(), back: String(o.back || '').trim(),
    lesson: o.lesson || null, box: 0, due: Date.now(), at: Date.now(), reps: 0, lapses: 0
  };
  if (!c.front) return null;
  S.cards.push(c); save();
  return c;
}
function syGrade(card, g) {
  const S = studyState();
  const c = S.cards.find(x => x.id === card.id);
  if (!c) return;
  let box = c.box || 0;
  if (g === 0) { box = 0; c.lapses = (c.lapses || 0) + 1; }
  else if (g === 1) { box = Math.max(1, box); }
  else if (g === 2) { box = Math.min(6, box + 1); }
  else { box = Math.min(6, box + 2); }
  c.box = box;
  c.reps = (c.reps || 0) + 1;
  c.at = Date.now();
  c.due = Date.now() + SY_INTERVALS[box] * SY_DAY;
  save();
}

/* ---------------- câu hỏi lấy từ bài học ---------------- */
function syLessonQuestions(scope) {
  const out = [];
  (typeof allLessons === 'function' ? allLessons() : []).forEach(l => {
    if (!l || !Array.isArray(l.blocks)) return;
    if (scope && scope.g && l.g !== scope.g) return;
    if (scope && scope.s && l.s !== scope.s) return;
    l.blocks.forEach((b, i) => {
      if (b && b.k === 'q' && b.v) {
        out.push({
          id: 'q' + l.id + '_' + i, q: b.v, a: b.a || '',
          g: l.g, s: l.s, lesson: l.id, topic: l.t, tag: l.tag || ''
        });
      }
    });
  });
  return out;
}

/* ---------------- nhật ký học ---------------- */
function syLog(min, label, kind) {
  const S = studyState();
  S.sessions.push({ at: Date.now(), min: Math.max(1, Math.round(min)), label: label || '', kind: kind || 'focus' });
  if (S.sessions.length > 800) S.sessions = S.sessions.slice(-800);
  save();
}
function syMinutesOn(key) {
  return studyState().sessions.filter(s => syDayKey(s.at) === key).reduce((a, s) => a + (s.min || 0), 0);
}
function syToday() {
  const k = syDayKey();
  const S = studyState();
  return {
    key: k,
    min: syMinutesOn(k),
    cards: S.cards.filter(c => c.at && syDayKey(c.at) === k && c.reps).length,
    practice: S.results.filter(r => syDayKey(r.at) === k).length
  };
}
function syStreak() {
  const S = studyState();
  const days = new Set();
  S.sessions.forEach(s => days.add(syDayKey(s.at)));
  S.results.forEach(r => days.add(syDayKey(r.at)));
  S.cards.forEach(c => { if (c.reps) days.add(syDayKey(c.at)); });
  Object.keys(state.ans || {}).forEach(id => { const a = state.ans[id]; if (a && a.at) days.add(syDayKey(a.at)); });
  let n = 0;
  const d = new Date(); d.setHours(12, 0, 0, 0);
  for (let i = 0; i < 400; i++) {
    const k = syDayKey(d.getTime());
    if (days.has(k)) n++;
    else if (i > 0) break;          /* hôm nay chưa học vẫn giữ chuỗi của hôm qua */
    d.setTime(d.getTime() - SY_DAY);
  }
  return n;
}

/* ---------------- bản đồ nhiệt 12 tuần ---------------- */
function syHeat() {
  const S = studyState();
  const count = {};
  const bump = (ts, n) => { const k = syDayKey(ts); count[k] = (count[k] || 0) + (n || 1); };
  S.sessions.forEach(s => bump(s.at, Math.min(6, Math.max(1, Math.round((s.min || 10) / 15)))));
  S.results.forEach(r => bump(r.at, 2));
  S.cards.forEach(c => { if (c.reps) bump(c.at, 1); });
  Object.keys(state.ans || {}).forEach(id => { const a = state.ans[id]; if (a && a.at) bump(a.at, 1); });
  const cells = [];
  const end = new Date(); end.setHours(12, 0, 0, 0);
  const start = new Date(end.getTime() - 83 * SY_DAY);
  start.setTime(start.getTime() - ((start.getDay() + 6) % 7) * SY_DAY);   /* về thứ hai */
  for (let t = start.getTime(); t <= end.getTime() + 6 * SY_DAY; t += SY_DAY) {
    const k = syDayKey(t), n = count[k] || 0;
    cells.push({ t, k, n, lv: n === 0 ? 0 : n < 2 ? 1 : n < 4 ? 2 : n < 7 ? 3 : 4, future: t > end.getTime() });
  }
  return cells;
}

/* =========================================================
   ROUTE · HỌC HÔM NAY  #/study
   ========================================================= */
function syNextLesson() {
  const S = schoolState();
  const g = S.grade || 9, s = S.subj || 'vatli';
  const has = l => (l.blocks || []).some(b => b && b.k === 'q');
  const unread = l => !(state.note && state.note['read:' + l.id]);
  const inScope = (lessonList(g, s) || []);
  return inScope.find(l => unread(l) && has(l)) || inScope.find(unread) || inScope[0]
    || allLessons().find(l => unread(l) && has(l)) || allLessons()[0] || null;
}
function syScopeName(g, s) {
  const sub = (typeof SUBJECTS !== 'undefined' ? SUBJECTS.find(x => x.id === s) : null) || { name: s };
  return sub.name;
}

function renderStudy() {
  const S = studyState();
  const today = syToday();
  const due = syDue().length;
  const totalCards = S.cards.length;
  const newCards = syNewCards().length;
  const streak = syStreak();
  const nx = syNextLesson();
  const sc = schoolState();
  const plan = S.plan;
  const hour = new Date().getHours();
  const greet = hour < 11 ? 'Chào buổi sáng' : hour < 14 ? 'Chào buổi trưa' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
  const minPct = Math.min(100, Math.round(today.min / Math.max(1, S.goal.min) * 100));
  const cardPct = Math.min(100, Math.round(today.cards / Math.max(1, S.goal.cards) * 100));

  const tasks = [
    { k: 'Ôn thẻ đến hạn', d: due ? `${due} thẻ đang chờ` : (totalCards ? 'Hôm nay đã sạch' : 'Chưa có thẻ nào'), href: '#/cards', done: !due && totalCards > 0, n: due },
    { k: 'Luyện một đề ngắn', d: today.practice ? `đã làm ${today.practice} đề hôm nay` : '10 câu · tự chấm', href: '#/practice', done: today.practice > 0, n: today.practice },
    { k: 'Đọc một bài mới', d: nx ? `Lớp ${nx.g} · ${syScopeName(nx.g, nx.s)}` : 'chọn lớp & môn', href: nx ? '#/read/' + nx.id : '#/subjects', done: false, n: 0 },
    { k: 'Tập trung 25 phút', d: today.min ? `hôm nay ${today.min} phút` : 'đồng hồ + nhật ký', href: '#/focus', done: today.min >= 25, n: today.min }
  ];
  const dueWrong = (typeof dueList === 'function' ? dueList().length : 0);
  if (dueWrong) tasks.splice(2, 0, { k: 'Câu sai Vật lí 9', d: dueWrong + ' câu đến hạn ôn lại', href: '#/review', done: false, n: dueWrong });
  const doneN = tasks.filter(t => t.done).length;

  const heat = syHeat();
  const weeks = [];
  for (let i = 0; i < heat.length; i += 7) weeks.push(heat.slice(i, i + 7));

  /* tiến độ theo môn của lớp đang chọn */
  const subs = subjectsFor(sc.grade || 9);
  const rows = subs.map(sb => {
    const list = lessonList(sc.grade || 9, sb.id);
    const read = list.filter(l => state.note && state.note['read:' + l.id]).length;
    return { id: sb.id, name: sb.name, n: list.length, read };
  }).filter(r => r.n);

  const recentNotes = Object.keys(S.notes).filter(k => S.notes[k] && String(S.notes[k]).trim()).slice(-4).reverse();

  $('#main').innerHTML = `<section class="wrap wide sy-page">
    <div class="sy-hero">
      <div class="sy-hero-l">
        <span class="kicker">Trung tâm tự học · ${new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}</span>
        <h1>${greet}. <em>Hôm nay học gì?</em></h1>
        <p>Mỗi ngày một ít, đúng thứ tự: ôn cái sắp quên → luyện cái vừa học → đọc cái mới → tập trung sâu. Chuỗi hiện tại <b>${streak} ngày</b>.</p>
      </div>
      <div class="sy-hero-q">
        <a class="btn sm" href="${due ? '#/cards' : '#/practice'}">${due ? 'Ôn ' + due + ' thẻ ngay' : 'Luyện 5 câu ngay'} →</a>
        <span class="sy-note">${due ? 'Liều nhỏ nhất hiệu quả nhất: ôn đúng lúc sắp quên.' : 'Chưa có thẻ đến hạn — làm vài câu để giữ đà.'}</span>
      </div>
      <div class="sy-hero-r">
        <div class="sy-ring" style="--p:${minPct}">
          <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" class="sy-r-bg"/><circle cx="60" cy="60" r="52" class="sy-r-fg"/></svg>
          <div class="sy-ring-t"><b>${today.min}</b><span>/ ${S.goal.min} phút</span></div>
        </div>
        <div class="sy-hero-stats">
          <span><b>${streak}</b> ngày liên tiếp</span>
          <span><b>${today.cards}</b> thẻ hôm nay</span>
          <span><b>${due}</b> thẻ đến hạn</span>
        </div>
      </div>
    </div>

    <div class="sy-do">
      <div class="sy-do-h">
        <span class="kicker">Việc của hôm nay · ${doneN}/${tasks.length}</span>
        <span class="grow"></span>
        <button class="btn ghost sm" id="syGoal">Đổi mục tiêu</button>
      </div>
      <div class="sy-do-grid">
        ${tasks.map((t, i) => `<a class="sy-task${t.done ? ' done' : ''}" href="${t.href}">
          <span class="sy-task-n">${t.done ? '✓' : String(i + 1).padStart(2, '0')}</span>
          <span class="sy-task-b"><b>${t.k}</b><i>${t.d}</i></span>
          <span class="sy-task-go">→</span>
        </a>`).join('')}
      </div>
    </div>

    ${(() => {
      if (typeof schTodaySummary !== 'function') return '';
      const t = schTodaySummary();
      /* luôn hiện: đây là cửa ngõ vào lịch, kể cả khi lịch còn trống */
      return `<div class="sy-today">
        <div class="sy-today-l">
          <span class="kicker">Hôm nay có gì</span>
          ${t.today.length ? `<div class="sy-today-list">${t.today.map(e => {
        const c = (typeof schColor === 'function' ? schColor(e.color) : { fg: 'var(--accent)' });
        return `<span class="sy-td" style="border-left-color:${c.fg}">
              ${e.time ? `<i>${e.time}</i>` : ''}<b>${esc(e.title)}</b></span>`;
      }).join('')}</div>` : '<p class="sy-note">Hôm nay không có việc nào trong lịch.</p>'}
        </div>
        <div class="sy-today-r">
          ${t.next ? `<a class="sy-count" href="#/calendar">
            <span class="kicker">Kỳ thi gần nhất</span>
            <b>${t.days === 0 ? 'Hôm nay' : t.days + ' ngày'}</b>
            <i>${esc(t.next.title)} · ${SCH_VN(t.next.date)}</i></a>` : `<a class="sy-count empty" href="#/calendar">
            <span class="kicker">Kỳ thi gần nhất</span>
            <b>Chưa đặt</b>
            <i>Thêm ngày thi để đếm ngược →</i></a>`}
          <a class="btn ghost sm" href="#/calendar">Mở lịch →</a>
        </div>
      </div>`;
    })()}

    <div class="sy-grid2">
      <div class="sy-box">
        <div class="sy-box-h"><span class="kicker">Nhịp học 12 tuần</span><span class="grow"></span>
          <span class="sy-legend">ít <i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i> nhiều</span></div>
        <div class="sy-heat">
          <div class="sy-heat-days"><span>T2</span><span>T4</span><span>T6</span><span>CN</span></div>
          <div class="sy-heat-grid">${weeks.map(w => `<div class="sy-week">${w.map(c => `<i class="sy-cell lv${c.lv}${c.future ? ' fut' : ''}" title="${c.k} · ${c.n} hoạt động"></i>`).join('')}</div>`).join('')}</div>
        </div>
        <div class="sy-box-f">
          <span>Còn <b>${Math.max(0, S.goal.min - today.min)}</b> phút để đủ mục tiêu hôm nay.</span>
          <a class="btn ghost sm" href="#/focus">Vào tập trung →</a>
        </div>
      </div>

      <div class="sy-box">
        <div class="sy-box-h"><span class="kicker">Thẻ ghi nhớ</span><span class="grow"></span>
          <a class="sy-mini" href="#/cards">Tất cả →</a></div>
        <div class="sy-kpi">
          <div><b>${totalCards}</b><span>thẻ đã tạo</span></div>
          <div><b>${newCards}</b><span>chưa ôn lần nào</span></div>
          <div><b>${due}</b><span>đến hạn hôm nay</span></div>
        </div>
        <div class="sy-cfrost"><i style="width:${cardPct}%"></i></div>
        <p class="sy-note">Mục tiêu ${S.goal.cards} thẻ/ngày · hôm nay ${today.cards}. Thẻ được tạo tự động từ câu hỏi trong bài học, hoặc bạn tự thêm.</p>
        <div class="sy-btnrow">
          <a class="btn sm" href="#/cards">${due ? 'Ôn ' + due + ' thẻ ngay' : 'Mở bộ thẻ'}</a>
          <button class="btn ghost sm" id="syQuickCard">+ Thẻ nhanh</button>
        </div>
      </div>
    </div>

    <div class="sy-grid2">
      <div class="sy-box">
        <div class="sy-box-h"><span class="kicker">Tiến độ lớp ${sc.grade} · ${syScopeName(sc.grade, sc.subj)}</span><span class="grow"></span>
          <a class="sy-mini" href="#/subjects">Đổi lớp →</a></div>
        <div class="sy-prog">
          ${rows.length ? rows.map(r => `<a class="sy-prow" href="#/subject/${sc.grade}/${r.id}">
            <span class="sy-pname">${r.name}</span>
            <span class="sy-pbar"><i style="width:${r.n ? Math.round(r.read / r.n * 100) : 0}%"></i></span>
            <span class="sy-pnum">${r.read}/${r.n}</span></a>`).join('')
      : '<p class="sy-note">Lớp này chưa có bài nào — bấm “Đổi lớp” hoặc tự soạn bài mới.</p>'}
        </div>
      </div>

      <div class="sy-box">
        <div class="sy-box-h"><span class="kicker">Ghi chú của bạn</span><span class="grow"></span></div>
        ${recentNotes.length ? `<div class="sy-notes">${recentNotes.map(k => {
        const id = k.replace(/#.*$/, '');
        const l = (typeof lessonById === 'function') ? lessonById(id) : null;
        const txt = String(S.notes[k]).replace(/\s+/g, ' ');
        return `<a class="sy-note-item" href="${l ? '#/read/' + id : '#/study'}">
            <b>${l ? l.t : 'Ghi chú'}</b><i>${txt.slice(0, 110)}${txt.length > 110 ? '…' : ''}</i></a>`;
      }).join('')}</div>`
      : `<p class="sy-note">Mở một bài đọc bất kỳ — cuối bài có ô <b>Ghi chú</b> và ô <b>Giảng lại bằng lời của em</b>. Ghi chú sẽ hiện ở đây để ôn lại nhanh.</p>
         <a class="btn ghost sm" href="${nx ? '#/read/' + nx.id : '#/subjects'}">Mở bài để ghi chú →</a>`}
        ${plan ? `<div class="sy-plan-mini">
          <span class="kicker">Kế hoạch đang chạy</span>
          <b>${plan.name}</b>
          <span>${plan.doneCount || 0}/${plan.totalCount || 0} mục · tới ${plan.examVN}</span>
          <a class="sy-mini" href="#/plan">Mở kế hoạch →</a>
        </div>` : `<div class="sy-plan-mini">
          <span class="kicker">Chưa có kế hoạch</span>
          <b>Dựng lịch tới ngày thi</b>
          <span>Tự chia bài theo số ngày còn lại, mỗi ngày một ít.</span>
          <a class="sy-mini" href="#/plan">Tạo kế hoạch →</a>
        </div>`}
      </div>
    </div>

    <div class="sy-tools">
      <span class="kicker">Đi thẳng</span>
      <div class="sy-tool-grid">
        <a href="#/cards"><b>Thẻ ghi nhớ</b><span>lặp lại cách quãng</span></a>
        <a href="#/practice"><b>Luyện đề tự tạo</b><span>mọi lớp · mọi môn</span></a>
        <a href="#/plan"><b>Kế hoạch học</b><span>tới ngày thi</span></a>
        <a href="#/focus"><b>Tập trung</b><span>đồng hồ 25/45/50</span></a>
        <a href="#/review"><b>Câu sai Vật lí 9</b><span>hộp Leitner</span></a>
        <a href="#/stats"><b>Thống kê</b><span>theo chủ đề</span></a>
      </div>
      <div class="sy-backup">
        <div class="sy-bk-l">
          <span class="kicker">Dữ liệu học của bạn</span>
          <p>Thẻ, ghi chú, kế hoạch, nhật ký phút học và bài tự soạn — tất cả nằm trong máy này. Sao lưu ra một tệp <code>.json</code> để mang sang máy khác, hoặc để dành khi cần.</p>
        </div>
        <div class="sy-bk-r">
          <button class="btn ghost sm" id="syExport">Sao lưu ra tệp</button>
          <label class="btn ghost sm file-pick">Khôi phục<input type="file" id="syImport" accept=".json,application/json" hidden></label>
        </div>
      </div>
    </div>
  </section>`;

  const gb = $('#syGoal');
  if (gb) gb.onclick = () => uiPrompt('Mục tiêu phút học mỗi ngày', String(S.goal.min), v => {
    if (isFinite(+v) && +v > 0) { S.goal.min = Math.round(+v); save(); renderStudy(); toast('Đã đặt ' + S.goal.min + ' phút/ngày'); }
  }, { type: 'number' });
  const ex = $('#syExport');
  if (ex) ex.onclick = () => syExportAll();
  const im = $('#syImport');
  if (im) im.onchange = async e => { const f = e.target.files[0]; if (f) await syImportAll(f); };
  const qc = $('#syQuickCard');
  if (qc) qc.onclick = () => uiCardForm();
}

/* =========================================================
   ROUTE · THẺ GHI NHỚ  #/cards
   ========================================================= */
function renderCards(filter) {
  const S = studyState();
  const sc = schoolState();
  const f = filter || (S.cardFilter = S.cardFilter || { scope: 'all' });
  const cards = S.cards;
  const due = syDue();
  const totalDue = due.length;

  const list = cards.slice().sort((a, b) => (a.due || 0) - (b.due || 0));
  const byBox = [0, 0, 0, 0, 0, 0, 0];
  cards.forEach(c => { byBox[Math.min(6, c.box || 0)]++; });

  $('#main').innerHTML = `<section class="wrap wide sy-page">
    ${pageHead('Thẻ ghi nhớ', cards.length + ' thẻ · ' + totalDue + ' đến hạn hôm nay',
    'Học theo nhịp quên của trí nhớ: thẻ trả lời tốt sẽ giãn ra 1 → 2 → 4 → 8 → 16 → 32 ngày; thẻ quên quay lại sau 10 phút. Thẻ tạo tự động từ câu hỏi trong bài học.')}

    <div class="cd-top">
      <button class="btn sm" id="cdReview"${totalDue ? '' : ' disabled'}>${totalDue ? 'Ôn ' + totalDue + ' thẻ đến hạn' : 'Hôm nay đã hết thẻ'}</button>
      <button class="btn ghost sm" id="cdNew">+ Thẻ mới</button>
      <button class="btn ghost sm" id="cdFromLesson">Tạo từ một bài học</button>
      <span class="grow"></span>
      <span class="kicker">Chuỗi thẻ: ${Array.from(SY_INTERVALS).map((d, i) => byBox[i] ? `<b>${byBox[i]}</b>·${SY_BOX_LABEL[i]}` : '').filter(Boolean).join('  ') || '—'}</span>
    </div>

    <div id="cdBody"></div>

    <div class="cd-list-h"><span class="kicker">Tất cả thẻ · ${list.length}</span></div>
    <div class="cd-list">
      ${list.length ? list.map(c => `<div class="cd-row" data-id="${c.id}">
        <span class="cd-row-f">${esc(c.front)}</span>
        <span class="cd-row-b">${esc(c.back)}</span>
        <span class="cd-row-m">Lớp ${c.g} · ${syScopeName(c.g, c.s)} · hộp ${(c.box || 0) + 1}</span>
        <span class="cd-row-x"><button class="bkbtn del" data-del="${c.id}" title="Xoá thẻ">×</button></span>
      </div>`).join('') : `<div class="files-empty"><b>Chưa có thẻ nào</b>
        <p>Bấm <b>Tạo từ một bài học</b> để lấy toàn bộ câu hỏi trong bài thành thẻ, hoặc tự thêm thẻ đầu tiên.</p></div>`}
    </div>
  </section>`;

  $$('[data-del]').forEach(b => b.onclick = () => {
    const S2 = studyState();
    S2.cards = S2.cards.filter(c => c.id !== b.dataset.del); save(); renderCards();
  });

  const fromLesson = () => {
    const l = syNextLesson();
    if (!l) return toast('Chưa có bài nào');
    const qs = syLessonQuestions({ g: l.g, s: l.s }).filter(q => q.lesson === l.id);
    if (!qs.length) return toast('Bài này chưa có câu hỏi — thêm khối “Câu hỏi” trong studio');
    let n = 0;
    qs.forEach(q => { if (syAddCard({ front: q.q, back: q.a || '(tự trả lời)', g: q.g, s: q.s, lesson: q.lesson })) n++; });
    toast('Đã tạo ' + n + ' thẻ từ “' + l.t.slice(0, 30) + '”'); renderCards();
  };
  const cdFromLesson = $('#cdFromLesson'); if (cdFromLesson) cdFromLesson.onclick = fromLesson;
  const cdNew = $('#cdNew'); if (cdNew) cdNew.onclick = () => uiCardForm();
  const cdReview = $('#cdReview'); if (cdReview) cdReview.onclick = () => syStartReview();
}

function syStartReview() {
  const queue = syDue();
  const body = $('#cdBody');
  if (!queue.length) { toast('Không còn thẻ đến hạn'); return; }
  let i = 0, shown = false;
  const stat = { again: 0, hard: 0, good: 0, easy: 0 };
  const total = queue.length;

  const done = () => {
    body.innerHTML = `<div class="cd-done">
      <span class="kicker">Xong lượt ôn</span>
      <h3>Đã ôn ${total} thẻ</h3>
      <div class="cd-done-grid">
        <div><b>${stat.again}</b><span>quên</span></div>
        <div><b>${stat.hard}</b><span>khó</span></div>
        <div><b>${stat.good}</b><span>được</span></div>
        <div><b>${stat.easy}</b><span>dễ</span></div>
      </div>
      <div class="cd-done-btns">
        <button class="btn sm" id="cdAgain">${syDue().length ? 'Ôn tiếp ' + syDue().length + ' thẻ quên' : 'Ôn lại toàn bộ'}</button>
        <a class="btn ghost sm" href="#/study">Về Học hôm nay</a>
      </div>
    </div>`;
    syCleanup();
    syLog(Math.max(1, Math.round(total * 0.3)), 'Ôn ' + total + ' thẻ', 'cards');
    const ag = $('#cdAgain');
    if (ag) ag.onclick = () => { ag.textContent = 'Đang tải…'; syStartReview(); };
    renderCards.stats = null;
  };

  const draw = () => {
    const c = queue[i];
    if (!c) return done();
    const box = c.box || 0;
    body.innerHTML = `<div class="cd-card" id="cdCard">
      <div class="cd-prog"><span class="kicker">${i + 1} / ${total}</span><div class="cd-bar"><i style="width:${Math.round(i / total * 100)}%"></i></div>
        <span class="cd-box">hộp ${box + 1} · ${SY_BOX_LABEL[box]}</span></div>
      <div class="cd-face">
        <span class="kicker">Mặt trước</span>
        <div class="cd-q">${esc(c.front)}</div>
        ${shown ? `<div class="cd-div"></div><span class="kicker">Mặt sau</span><div class="cd-a">${esc(c.back)}</div>` : `<button class="cd-show" id="cdShow">Hiện đáp án <kbd>Space</kbd></button>`}
      </div>
      ${shown ? `<div class="cd-grades">
        <button class="cd-g g0" data-g="0">Quên<kbd>1</kbd></button>
        <button class="cd-g g1" data-g="1">Khó<kbd>2</kbd></button>
        <button class="cd-g g2" data-g="2">Được<kbd>3</kbd></button>
        <button class="cd-g g3" data-g="3">Dễ<kbd>4</kbd></button>
      </div>` : ''}
    </div>`;

    const show = () => { shown = true; draw(); };
    const sh = $('#cdShow'); if (sh) sh.onclick = show;
    const card = $('#cdCard'); if (card) card.onclick = e => { if (e.target === card) show(); };
    $$('.cd-g').forEach(b => b.onclick = () => {
      const g = +b.dataset.g;
      syGrade(queue[i], g);
      stat[['again', 'hard', 'good', 'easy'][g]]++;
      i++; shown = false; draw();
    });
    syBindKeys(e => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!shown) show(); }
      else if (shown && /^[1-4]$/.test(e.key)) { const b = $(`.cd-g[data-g="${+e.key - 1}"]`); if (b) b.click(); }
    });
  };
  draw();
}

/* =========================================================
   ROUTE · LUYỆN ĐỀ TỰ TẠO  #/practice
   ========================================================= */
function renderPractice() {
  const S = studyState();
  const sc = schoolState();
  const f = S.practiceFilter = S.practiceFilter || { g: 'all', s: 'all', n: 10 };
  const pool = syLessonQuestions();
  const subjectsInPool = [...new Set(pool.map(q => q.s))];
  const results = S.results.slice(-8).reverse();

  const filteredN = pool.filter(q => (f.g === 'all' || q.g === +f.g) && (f.s === 'all' || q.s === f.s)).length;

  $('#main').innerHTML = `<section class="wrap wide sy-page">
    ${pageHead('Luyện đề tự tạo', pool.length + ' câu hỏi lấy từ bài học · mọi lớp, mọi môn',
    'Chọn phạm vi rồi làm. Trả lời bằng lời của em trước khi mở đáp án — tự chấm đúng/sai. Câu chưa đúng được đưa vào lượt ôn sau và tạo thẻ ghi nhớ bằng một cú bấm.')}

    <div class="pr-form">
      <label class="st-row"><span>Lớp</span>
        <select id="prG"><option value="all"${f.g === 'all' ? ' selected' : ''}>Mọi lớp</option>
          ${Array.from({ length: 12 }, (_, i) => i + 1).map(n => `<option value="${n}"${String(f.g) === String(n) ? ' selected' : ''}>Lớp ${n}</option>`).join('')}</select></label>
      <label class="st-row"><span>Môn</span>
        <select id="prS"><option value="all"${f.s === 'all' ? ' selected' : ''}>Mọi môn</option>
          ${subjectsInPool.map(id => `<option value="${id}"${f.s === id ? ' selected' : ''}>${syScopeName(0, id)}</option>`).join('')}</select></label>
      <label class="st-row"><span>Số câu</span>
        <select id="prN">${[5, 10, 15, 20, 30].map(n => `<option value="${n}"${f.n === n ? ' selected' : ''}>${n} câu</option>`).join('')}</select></label>
      <div class="pr-go"><span class="kicker">${filteredN} câu phù hợp</span>
        <button class="btn" id="prStart"${filteredN ? '' : ' disabled'}>Bắt đầu →</button></div>
    </div>

    <div id="prBody"></div>

    ${results.length ? `<div class="cd-list-h"><span class="kicker">Đề đã làm</span></div>
      <div class="pr-hist">${results.map(r => `<div class="pr-hrow">
        <b>${r.right}/${r.total}</b>
        <span>Lớp ${r.g === 'all' ? 'nhiều' : r.g} · ${r.s === 'all' ? 'nhiều môn' : syScopeName(0, r.s)}</span>
        <i>${syDateVN(r.at)} ${syTime(r.at)}</i>
        <em class="${r.right / r.total >= 0.8 ? 'good' : r.right / r.total >= 0.5 ? 'mid' : 'bad'}">${Math.round(r.right / r.total * 100)}%</em>
      </div>`).join('')}</div>` : ''}
  </section>`;

  const sync = () => {
    f.g = $('#prG').value; f.s = $('#prS').value; f.n = +$('#prN').value;
    save(); renderPractice();
  };
  ['#prG', '#prS', '#prN'].forEach(s => { const el = $(s); if (el) el.onchange = sync; });
  const st = $('#prStart');
  if (st) st.onclick = () => {
    const qs = syLessonQuestions()
      .filter(q => (f.g === 'all' || q.g === +f.g) && (f.s === 'all' || q.s === f.s));
    if (!qs.length) return;
    const n = Math.min(f.n, qs.length);
    syRunPractice(shuffle(qs).slice(0, n), f);
  };
}

function syRunPractice(questions, f) {
  const body = $('#prBody');
  if (!body) return;
  let i = 0, shown = false, right = 0;
  const wrong = [];

  const finish = () => {
    const total = questions.length;
    const S = studyState();
    S.results.push({ at: Date.now(), g: f.g, s: f.s, total, right, wrong: wrong.map(q => q.id) });
    if (S.results.length > 60) S.results = S.results.slice(-60);
    save();
    syCleanup();
    syLog(Math.max(2, total * 1.2), 'Luyện đề ' + total + ' câu', 'practice');
    body.innerHTML = `<div class="cd-done">
      <span class="kicker">Kết quả</span>
      <h3>${right}/${total} câu đúng · ${Math.round(right / total * 100)}%</h3>
      <div class="cd-done-btns">
        ${wrong.length ? `<button class="btn sm" id="prCards">Tạo ${wrong.length} thẻ từ câu chưa đúng</button>
          <button class="btn ghost sm" id="prRedo">Làm lại ${wrong.length} câu sai</button>` : '<span class="sy-note">Không có câu sai — tăng số câu hoặc đổi môn để thử sức.</span>'}
        <a class="btn ghost sm" href="#/study">Về Học hôm nay</a>
      </div>
      ${wrong.length ? `<div class="pr-wrong"><span class="kicker">Cần xem lại</span>
        ${wrong.map(q => `<a class="pr-w" href="#/read/${q.lesson}"><b>${esc(q.q)}</b><i>Lớp ${q.g} · ${syScopeName(q.g, q.s)} · ${esc(q.topic)}</i></a>`).join('')}</div>` : ''}
    </div>`;
    const pc = $('#prCards');
    if (pc) pc.onclick = () => {
      let n = 0;
      wrong.forEach(q => { if (syAddCard({ front: q.q, back: q.a || '(tự trả lời)', g: q.g, s: q.s, lesson: q.lesson })) n++; });
      toast('Đã tạo ' + n + ' thẻ'); location.hash = '#/cards';
    };
    const pr = $('#prRedo');
    if (pr) pr.onclick = () => syRunPractice(shuffle(wrong.slice()), f);
  };

  const draw = () => {
    if (i >= questions.length) return finish();
    const q = questions[i];
    body.innerHTML = `<div class="pr-card">
      <div class="cd-prog"><span class="kicker">Câu ${i + 1} / ${questions.length}</span>
        <div class="cd-bar"><i style="width:${Math.round(i / questions.length * 100)}%"></i></div>
        <span class="cd-box">Lớp ${q.g} · ${syScopeName(q.g, q.s)}</span></div>
      <div class="pr-topic">${esc(q.topic)}${q.tag ? ' · ' + esc(q.tag) : ''}</div>
      <div class="cd-q">${esc(q.q)}</div>
      ${shown ? `<div class="cd-div"></div><span class="kicker">Đáp án / gợi ý</span>
        <div class="cd-a">${esc(q.a || '—')}</div>
        <p class="pr-hint">Em tự chấm: đã trả lời đúng chưa?</p>
        <div class="cd-grades">
          <button class="cd-g g1" data-ok="0">Chưa đúng<kbd>1</kbd></button>
          <button class="cd-g g2" data-ok="1">Đúng rồi<kbd>2</kbd></button>
          <a class="cd-g g0" href="#/read/${q.lesson}">Mở bài học</a>
        </div>`
      : `<button class="cd-show" id="prShow">Xem đáp án <kbd>Space</kbd></button>`}
    </div>`;
    const sh = $('#prShow'); if (sh) sh.onclick = () => { shown = true; draw(); };
    $$('[data-ok]').forEach(b => b.onclick = () => {
      const ok = b.dataset.ok === '1';
      if (ok) right++; else wrong.push(q);
      i++; shown = false; draw();
    });
  };
  draw();
  syBindKeys(e => {
    if (e.key === ' ' && !shown) { e.preventDefault(); shown = true; draw(); }
    else if (shown && (e.key === '1' || e.key === '2')) {
      const b = $(`[data-ok="${e.key === '2' ? 1 : 0}"]`); if (b) b.click();
    }
  });
}

/* =========================================================
   ROUTE · KẾ HOẠCH HỌC  #/plan
   ========================================================= */
function renderPlan() {
  const S = studyState();
  const sc = schoolState();
  const plan = S.plan;
  const today = syDayKey();

  const form = `<div class="pl-form">
    <label class="st-row"><span>Tên kế hoạch</span><input id="plName" type="text" placeholder="Ví dụ: Ôn thi giữa kì I" value="${plan ? esc(plan.name) : ''}"></label>
    <div class="st-two">
      <label class="st-row"><span>Ngày thi / hạn cuối</span><input id="plDate" type="date" value="${plan ? plan.examISO : new Date(Date.now() + 21 * SY_DAY).toISOString().slice(0, 10)}"></label>
      <label class="st-row"><span>Phút mỗi ngày</span><input id="plMin" type="number" min="10" max="480" step="5" value="${plan ? plan.min : 60}"></label>
    </div>
    <div class="st-two">
      <label class="st-row"><span>Lớp</span><select id="plG">${Array.from({ length: 12 }, (_, i) => i + 1).map(n => `<option value="${n}"${n === (plan ? plan.g : sc.grade) ? ' selected' : ''}>Lớp ${n}</option>`).join('')}</select></label>
      <label class="st-row"><span>Môn</span><select id="plS"></select></label>
    </div>
    <div class="sy-btnrow"><button class="btn" id="plBuild">${plan ? 'Dựng lại kế hoạch' : 'Dựng kế hoạch →'}</button>
      ${plan ? '<button class="btn ghost sm" id="plClear">Xoá kế hoạch</button>' : ''}</div>
  </div>`;

  const body = plan ? syPlanBody(plan, today) : '';

  $('#main').innerHTML = `<section class="wrap wide sy-page">
    ${pageHead('Kế hoạch học', plan ? 'tới ' + plan.examVN + ' · ' + plan.days.length + ' ngày' : 'chia đều bài học tới ngày thi',
    'Chọn môn và hạn cuối, máy chia bài thành từng ngày vừa sức — mỗi ngày có phần đọc bài mới và một nhịp ôn lại. Đánh dấu khi xong, kế hoạch tự nhớ.')}
    ${form}
    ${body}
  </section>`;

  const fillS = () => {
    const g = +$('#plG').value;
    const subs = subjectsFor(g).filter(sb => lessonList(g, sb.id).length);
    const cur = plan ? plan.s : (sc.subj);
    $('#plS').innerHTML = subs.map(sb => `<option value="${sb.id}"${sb.id === cur ? ' selected' : ''}>${sb.name}</option>`).join('') || '<option value="">—</option>';
  };
  fillS();
  $('#plG').onchange = fillS;

  $('#plBuild').onclick = () => {
    const g = +$('#plG').value, sId = $('#plS').value;
    if (!sId) return toast('Lớp này chưa có bài để lập kế hoạch');
    const iso = $('#plDate').value;
    const exam = new Date(iso + 'T08:00:00');
    if (!iso || isNaN(exam)) return toast('Chọn ngày thi');
    const min = Math.max(10, Math.min(480, +$('#plMin').value || 60));
    const name = ($('#plName').value || '').trim() || ('Ôn ' + syScopeName(g, sId) + ' lớp ' + g);
    const lessons = lessonList(g, sId);
    if (!lessons.length) return toast('Môn này chưa có bài');

    const start = new Date(); start.setHours(8, 0, 0, 0);
    const total = Math.max(1, Math.min(120, Math.round((exam - start) / SY_DAY) + 1));

    /* hàng đợi: đọc bài mới → ôn lại → luyện đề → thẻ → thi thử */
    const queue = lessons.map(l => ({ k: 'read', id: l.id, t: l.t, href: '#/read/' + l.id }));
    const extras = [];
    if (total >= 3) extras.push({ k: 'drill', t: 'Luyện 10 câu tự tạo', href: '#/practice' });
    if (total >= 5) extras.push({ k: 'cards', t: 'Ôn toàn bộ thẻ ghi nhớ', href: '#/cards' });
    if (total >= 7) extras.push({ k: 'exam', t: 'Thi thử 15 câu', href: '#/exam' });
    if (total >= 9) extras.push({ k: 'drill', t: 'Luyện đề lần hai · tập trung câu sai', href: '#/practice' });

    const want = Math.max(queue.length + extras.length, total);
    let k = 0;
    while (queue.length + extras.length < want && lessons.length) {
      const l = lessons[k % lessons.length]; k++;
      queue.push({ k: 'review', id: l.id, t: 'Ôn lại: ' + l.t, href: '#/read/' + l.id });
    }
    const items = queue.concat(extras);
    const days = [];
    for (let d = 0; d < total; d++) {
      const date = new Date(start.getTime() + d * SY_DAY);
      const from = Math.floor(d * items.length / total);
      const to = Math.floor((d + 1) * items.length / total);
      const take = items.slice(from, Math.max(from + 1, to)).map((x, j) =>
        Object.assign({}, x, { key: date.toISOString().slice(0, 10) + '-' + d + '-' + j }));
      days.push({ date: date.toISOString().slice(0, 10), dateVN: syDateVN(date.getTime()), items: take });
    }

    S.plan = { name, examISO: iso, examVN: syDateVN(exam.getTime()), min, g, s: sId, created: Date.now(), days, totalCount: 0, doneCount: 0 };
    syRecount(); save(); renderPlan(); toast('Đã dựng kế hoạch ' + days.length + ' ngày');
  };
  const cl = $('#plClear');
  if (cl) cl.onclick = () => {
    uiConfirm('Xoá kế hoạch', `Xoá kế hoạch <b>${esc(plan.name)}</b> cùng toàn bộ dấu đã đánh?`, () => {
      S.plan = null; save(); renderPlan(); toast('Đã xoá kế hoạch');
    }, { danger: true, okText: 'Xoá kế hoạch' });
  };

  /* đánh dấu xong */
  $$('[data-pk]').forEach(b => b.onclick = () => {
    const k = b.dataset.pk;
    S.planDone = S.planDone || {};
    if (S.planDone[k]) delete S.planDone[k]; else S.planDone[k] = Date.now();
    syRecount(); save(); renderPlan();
  });
}

function syRecount() {
  const S = studyState();
  const p = S.plan; if (!p) return;
  S.planDone = S.planDone || {};
  let total = 0, done = 0;
  p.days.forEach(d => d.items.forEach(it => { total++; if (S.planDone[it.key]) done++; }));
  p.totalCount = total; p.doneCount = done;
}

function syPlanBody(plan, todayKey) {
  const S = studyState();
  S.planDone = S.planDone || {};
  const pct = plan.totalCount ? Math.round(plan.doneCount / plan.totalCount * 100) : 0;
  let shownToday = false;
  return `<div class="pl-body">
    <div class="pl-head">
      <div><span class="kicker">${plan.name}</span>
        <h2>${plan.doneCount}/${plan.totalCount} mục · ${pct}%</h2>
        <p class="sy-note">Tới <b>${plan.examVN}</b> · ${plan.days.length} ngày · ${plan.min} phút/ngày · Lớp ${plan.g} › ${syScopeName(plan.g, plan.s)}</p></div>
      <div class="pl-ring" style="--p:${pct}">
        <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" class="sy-r-bg"/><circle cx="60" cy="60" r="52" class="sy-r-fg"/></svg>
        <div class="sy-ring-t"><b>${pct}%</b><span>hoàn thành</span></div>
      </div>
    </div>
    ${(() => {
      const fe = (typeof gdFeasible === 'function') ? gdFeasible(plan) : null;
      const cd = (typeof gdCountdown === 'function') ? gdCountdown(plan.examISO, 'Ngày thi') : '';
      if (!fe && !cd) return '';
      const txt = { ok: 'Vừa sức', tight: 'Sát nút', over: 'Quá tải' }[fe ? fe.status : 'ok'];
      const detail = fe
        ? `còn ${fe.totalLeft} mục trong ${fe.daysLeft} ngày · ${fe.perDay} phút/ngày đủ khoảng ${fe.capacity} mục`
        : '';
      return `<div class="pl-feas pl-feas-${fe ? fe.status : 'ok'}">
        ${cd}<span class="pl-feas-t"><b>${txt}</b> — ${detail}</span></div>`;
    })()}
    <div class="pl-days">
      ${plan.days.map(d => {
    const isToday = d.date === todayKey;
    const isPast = d.date < todayKey;
    const allDone = d.items.every(it => S.planDone[it.key]);
    const open = isToday || (!shownToday && !isPast && !allDone);
    if (open) shownToday = true;
    return `<details class="pl-day${isToday ? ' today' : ''}${allDone ? ' done' : ''}"${open ? ' open' : ''}>
          <summary>
            <span class="pl-date">${d.dateVN}</span>
            <span class="pl-title">${isToday ? 'Hôm nay' : allDone ? 'Đã xong' : 'Ngày ' + (plan.days.indexOf(d) + 1)}</span>
            <span class="pl-cnt">${d.items.filter(it => S.planDone[it.key]).length}/${d.items.length}</span>
          </summary>
          <div class="pl-items">
            ${d.items.map(it => `<div class="pl-item${S.planDone[it.key] ? ' ok' : ''}">
              <button class="pl-check" data-pk="${it.key}" aria-label="Đánh dấu xong">${S.planDone[it.key] ? '✓' : ''}</button>
              <a href="${it.href}">${it.t}</a>
              <span class="pl-kind">${({ read: 'đọc bài', drill: 'luyện đề', cards: 'ôn thẻ', exam: 'thi thử' })[it.k] || ''}</span>
            </div>`).join('')}
          </div>
        </details>`;
  }).join('')}
    </div>
  </div>`;
}

/* =========================================================
   ROUTE · TẬP TRUNG  #/focus
   ========================================================= */
function syFocusState() {
  const S = studyState();
  const f = S.focus;
  f.mode = +f.mode || 25;
  if (f.running && f.endAt) {
    f.left = Math.max(0, Math.round((f.endAt - Date.now()) / 1000));
    if (f.left <= 0) {
      f.running = false; f.endAt = 0; f.left = 0;
      f.done = (f.done || 0) + 1;
      syLog(f.mode, 'Tập trung ' + f.mode + ' phút', 'focus');
      if (typeof chime === 'function') { try { chime(false); } catch (e) { } }
      if (typeof toast === 'function') toast('Hết ' + f.mode + ' phút — nghỉ một chút nhé');
      save();
    }
  }
  return f;
}
const syFmt = s => {
  s = Math.max(0, Math.round(s));
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
};

let syFocusTimer = null;
function renderFocus() {
  const S = studyState();
  const f = syFocusState();
  const total = f.mode * 60;
  const pct = Math.max(0, Math.min(100, Math.round((1 - f.left / total) * 100)));
  const todayMin = syMinutesOn(syDayKey());
  const log = S.sessions.filter(s => syDayKey(s.at) === syDayKey()).slice().reverse();
  const week = [0, 1, 2, 3, 4, 5, 6].map(i => {
    const d = new Date(); d.setDate(d.getDate() - i);
    return { k: syDayKey(d.getTime()), vn: syDateVN(d.getTime()), min: syMinutesOn(syDayKey(d.getTime())) };
  }).reverse();
  const maxMin = Math.max(30, ...week.map(w => w.min));

  $('#main').innerHTML = `<section class="wrap wide sy-page">
    ${pageHead('Đồng hồ tập trung', todayMin + ' phút hôm nay · ' + S.sessions.length + ' phiên đã ghi',
    'Một việc, một đồng hồ. Hết giờ tự ghi vào nhật ký và báo chuông. Điện thoại để xa tầm tay — 25 phút không gián đoạn hiệu quả hơn 2 giờ vừa học vừa lướt.')}
    <div class="fc-wrap">
      <div class="fc-main">
        <div class="fc-modes">
          ${[15, 25, 45, 50].map(m => `<button class="fc-mode${f.mode === m ? ' on' : ''}" data-mode="${m}">${m} phút</button>`).join('')}
        </div>
        <div class="fc-ring" style="--p:${pct}">
          <svg viewBox="0 0 240 240">
            <circle cx="120" cy="120" r="104" class="fc-bg"/>
            <circle cx="120" cy="120" r="104" class="fc-fg"/>
          </svg>
          <div class="fc-t">
            <b id="fcTime">${syFmt(f.left)}</b>
            <span>${f.running ? 'đang chạy · ' + f.mode + ' phút' : 'sẵn sàng'}</span>
          </div>
        </div>
        <div class="fc-btns">
          <button class="btn" id="fcStart">${f.running ? 'Tạm dừng' : (f.left === total ? 'Bắt đầu' : 'Tiếp tục')}</button>
          <button class="btn ghost sm" id="fcReset">Đặt lại</button>
          <button class="btn ghost sm" id="fcLog">Ghi thủ công</button>
        </div>
        <p class="sy-note fc-note">Đồng hồ chạy tiếp khi bạn chuyển trang — mở bài đọc rồi quay lại vẫn đúng giờ.</p>
      </div>

      <aside class="fc-side">
        <div class="sy-box">
          <div class="sy-box-h"><span class="kicker">7 ngày gần đây</span><span class="grow"></span><b>${week.reduce((a, w) => a + w.min, 0)} phút</b></div>
          <div class="fc-week">${week.map(w => `<div class="fc-wcol">
            <div class="fc-wbar"><i style="height:${Math.round(w.min / maxMin * 100)}%"></i></div>
            <span>${w.vn}</span><em>${w.min}</em></div>`).join('')}</div>
        </div>
        <div class="sy-box">
          <div class="sy-box-h"><span class="kicker">Phiên hôm nay</span><span class="grow"></span></div>
          ${log.length ? `<div class="fc-log">${log.map(s => `<div class="fc-lrow"><b>${syTime(s.at)}</b><span>${esc(s.label || 'Tập trung')}</span><em>${s.min}′</em></div>`).join('')}</div>`
      : '<p class="sy-note">Chưa có phiên nào hôm nay.</p>'}
        </div>
      </aside>
    </div>
  </section>`;

  if (syFocusTimer) { clearInterval(syFocusTimer); syFocusTimer = null; }
  const tick = () => {
    const st = studyState().focus;
    if (!st.running) return;
    const left = Math.max(0, Math.round((st.endAt - Date.now()) / 1000));
    const el = $('#fcTime');
    if (el) el.textContent = syFmt(left);
    const ring = document.querySelector('.fc-ring');
    if (ring) ring.style.setProperty('--p', Math.max(0, Math.min(100, Math.round((1 - left / (st.mode * 60)) * 100))));
    if (left <= 0) { clearInterval(syFocusTimer); syFocusTimer = null; renderFocus(); }
  };
  if (f.running) syFocusTimer = setInterval(tick, 500);

  $$('[data-mode]').forEach(b => b.onclick = () => {
    f.mode = +b.dataset.mode; f.running = false; f.endAt = 0; f.left = f.mode * 60; save(); renderFocus();
  });
  const start = $('#fcStart');
  if (start) start.onclick = () => {
    if (f.running) {
      f.left = Math.max(0, Math.round((f.endAt - Date.now()) / 1000));
      f.running = false; f.endAt = 0;
    } else {
      if (f.left <= 0) f.left = f.mode * 60;
      f.running = true; f.endAt = Date.now() + f.left * 1000;
    }
    save(); renderFocus();
  };
  const rs = $('#fcReset');
  if (rs) rs.onclick = () => { f.running = false; f.endAt = 0; f.left = f.mode * 60; save(); renderFocus(); };
  const lg = $('#fcLog');
  if (lg) lg.onclick = () => uiPrompt('Số phút vừa học', '30', v => {
    if (!isFinite(+v) || +v <= 0) return;
    syLog(+v, 'Học thủ công', 'manual'); toast('Đã ghi ' + Math.round(+v) + ' phút'); renderFocus();
  }, { type: 'number' });
}

/* =========================================================
   GHI CHÚ & GIẢNG LẠI trong trang đọc bài
   ========================================================= */
function syNoteBlock(l) {
  const S = studyState();
  const kNote = l.id, kEx = l.id + '#explain';
  return `<div class="sy-note-box">
    <div class="sy-nb-h"><span class="kicker">Ghi chú của bạn</span><span class="grow"></span>
      <span class="sy-saved" id="sySaved"></span></div>
    <textarea id="syNote" rows="3" placeholder="Ý chính, công thức cần nhớ, chỗ mình hay sai…">${esc(S.notes[kNote] || '')}</textarea>
    <div class="sy-nb-h" style="margin-top:14px"><span class="kicker">Giảng lại bằng lời của em · cách Feynman</span></div>
    <textarea id="syEx" rows="3" placeholder="Giải thích như đang giảng cho bạn cùng lớp. Chỗ nào bí, đó là chỗ chưa hiểu.">${esc(S.notes[kEx] || '')}</textarea>
    <div class="sy-nb-f"><button class="btn ghost sm" id="syCardFromNote">Tạo thẻ từ ghi chú</button>
      <span class="sy-note">Chỉ lưu trong máy bạn.</span></div>
  </div>`;
}
function syBindNote(l) {
  const S = studyState();
  let t = null;
  const flash = () => { const el = $('#sySaved'); if (el) { el.textContent = 'đã lưu'; setTimeout(() => { if (el) el.textContent = ''; }, 1200); } };
  const note = $('#syNote'), ex = $('#syEx');
  if (note) note.oninput = () => { S.notes[l.id] = note.value; clearTimeout(t); t = setTimeout(() => { save(); flash(); }, 500); };
  if (ex) ex.oninput = () => { S.notes[l.id + '#explain'] = ex.value; clearTimeout(t); t = setTimeout(() => { save(); flash(); }, 500); };
  const c = $('#syCardFromNote');
  if (c) c.onclick = () => {
    const f = (note && note.value.trim()) || l.t;
    uiPrompt('Mặt sau của thẻ (đáp án / ý chính)', (ex && ex.value.trim()) || '', b => {
      syAddCard({ front: f.slice(0, 240), back: b, g: l.g, s: l.s, lesson: l.id });
      toast('Đã tạo thẻ');
    }, { multiline: true });
  };
}

/* =========================================================
   ĐỌC THÀNH TIẾNG (Web Speech API, chạy trong máy)
   ========================================================= */
let sySpeechOn = false;
function sySpeak(text) {
  if (!('speechSynthesis' in window)) { toast('Trình duyệt này không hỗ trợ đọc thành tiếng'); return false; }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'vi-VN'; u.rate = 0.95;
  const vs = speechSynthesis.getVoices().filter(v => /vi/i.test(v.lang));
  if (vs[0]) u.voice = vs[0];
  u.onend = () => { sySpeechOn = false; const b = $('#syRead'); if (b) b.textContent = 'Đọc thành tiếng'; };
  speechSynthesis.speak(u);
  sySpeechOn = true;
  return true;
}
function syStopSpeak() {
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  sySpeechOn = false;
  const b = $('#syRead'); if (b) b.textContent = 'Đọc thành tiếng';
}

/* =========================================================
   XUẤT / NHẬP TOÀN BỘ DỮ LIỆU HỌC
   ========================================================= */
function syExportAll() {
  const S = studyState();
  const pack = {
    app: 'vat-li-9', kind: 'study-backup', v: 1, at: Date.now(),
    school: state.school ? { grade: state.school.grade, subj: state.school.subj, lessons: state.school.lessons } : null,
    study: { cards: S.cards, sessions: S.sessions, results: S.results, notes: S.notes, goal: S.goal, plan: S.plan, planDone: S.planDone || {} },
    ans: state.ans || {}, note: state.note || {}
  };
  const blob = new Blob([JSON.stringify(pack)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'hoc-cua-toi-' + syDayKey() + '.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  toast('Đã xuất dữ liệu học');
}
async function syImportAll(file) {
  try {
    const pack = JSON.parse(await file.text());
    if (pack.kind === 'study-backup') {
      if (pack.school && pack.school.lessons) {
        state.school = state.school || {};
        state.school.lessons = Object.assign({}, state.school.lessons || {}, pack.school.lessons);
      }
      if (pack.study) {
        state.study = Object.assign(studyState(), pack.study);
      }
      if (pack.ans) state.ans = Object.assign({}, state.ans || {}, pack.ans);
      if (pack.note) state.note = Object.assign({}, state.note || {}, pack.note);
      save(); toast('Đã nhập dữ liệu học'); location.hash = '#/study';
      return true;
    }
    toast('Tệp này không phải bản sao dữ liệu học');
  } catch (e) { toast('Tệp không đọc được'); }
  return false;
}

/* =========================================================
   ROUTE · TIẾN ĐỘ TỔNG  #/progress
   ========================================================= */
function syWeekMinutes(offset) {
  const out = [];
  const base = new Date(); base.setHours(12, 0, 0, 0);
  for (let i = 6; i >= 0; i--) {
    const d = new Date(base.getTime() - (i + (offset || 0) * 7) * SY_DAY);
    const k = syDayKey(d.getTime());
    out.push({ k, vn: syDateVN(d.getTime()), dow: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()], min: syMinutesOn(k) });
  }
  return out;
}
function syAccuracy() {
  const S = studyState();
  const bySub = {};
  S.results.forEach(r => {
    const key = r.s === 'all' ? 'all' : r.s;
    bySub[key] = bySub[key] || { right: 0, total: 0, runs: 0 };
    bySub[key].right += r.right; bySub[key].total += r.total; bySub[key].runs++;
  });
  return bySub;
}
function syAdvice() {
  const S = studyState();
  const out = [];
  const due = syDue().length;
  const today = syToday();
  const acc = syAccuracy();
  const weak = Object.keys(acc).filter(k => k !== 'all' && acc[k].total >= 3)
    .map(k => ({ k, p: acc[k].right / acc[k].total })).sort((a, b) => a.p - b.p)[0];

  if (due > 0) out.push({ t: `Ôn ${due} thẻ đang đến hạn`, d: 'Đây là việc hiệu quả nhất lúc này — ôn đúng lúc sắp quên thì nhớ lâu gấp nhiều lần đọc lại.', href: '#/cards', cta: 'Ôn thẻ' });
  if (weak && weak.p < 0.8) out.push({ t: `Môn yếu nhất: ${syScopeName(0, weak.k)}`, d: `Tỉ lệ đúng ${Math.round(weak.p * 100)}%. Làm lại 5 câu dễ trước, rồi mở bài học tương ứng để vá chỗ hổng.`, href: '#/practice', cta: 'Luyện lại' });
  if (S.cards.length === 0) out.push({ t: 'Chưa có thẻ ghi nhớ nào', d: 'Mở một bài đọc rồi bấm “Thành thẻ ghi nhớ” — máy lấy câu hỏi trong bài làm thẻ cho bạn.', href: '#/cards', cta: 'Tạo thẻ' });
  if (!S.plan) out.push({ t: 'Chưa có kế hoạch', d: 'Đặt ngày thi và số ngày còn lại, máy chia bài cho vừa sức mỗi ngày.', href: '#/plan', cta: 'Tạo kế hoạch' });
  if (today.min === 0) out.push({ t: 'Hôm nay chưa có phút học nào', d: 'Bật đồng hồ 15 phút và học một mục nhỏ nhất. Bắt đầu là quan trọng hơn làm nhiều.', href: '#/focus', cta: 'Bắt đầu 15′' });
  if (today.min > 0 && today.min < S.goal.min) out.push({ t: `Còn ${S.goal.min - today.min} phút để đủ mục tiêu`, d: 'Mục tiêu nhỏ mà đều hiệu quả hơn một buổi dài rồi nghỉ vài ngày.', href: '#/focus', cta: 'Học tiếp' });
  if (!out.length) out.push({ t: 'Hôm nay bạn đang rất đều', d: 'Làm thêm một đề ngắn để mở rộng vùng kiến thức, hoặc đọc một bài ở môn khác.', href: '#/practice', cta: 'Luyện thêm' });
  return out.slice(0, 3);
}

function renderProgress() {
  const S = studyState();
  const today = syToday();
  const heat = syHeat();
  const weeks = [];
  for (let i = 0; i < heat.length; i += 7) weeks.push(heat.slice(i, i + 7));
  const wk = syWeekMinutes(0), prev = syWeekMinutes(1);
  const wkSum = wk.reduce((a, x) => a + x.min, 0), prevSum = prev.reduce((a, x) => a + x.min, 0);
  const maxW = Math.max(60, ...wk.map(x => x.min), ...prev.map(x => x.min));
  const acc = syAccuracy();
  const accAll = Object.values(acc).reduce((a, r) => ({ right: a.right + r.right, total: a.total + r.total }), { right: 0, total: 0 });
  const mastered = S.cards.filter(c => (c.box || 0) >= 4).length;
  const boxCount = [0, 0, 0, 0, 0, 0, 0];
  S.cards.forEach(c => { boxCount[Math.min(6, c.box || 0)]++; });
  const plan = S.plan;
  const advice = syAdvice();
  const vlDue = (typeof dueList === 'function') ? dueList().length : 0;
  const topicRows = (typeof topicStats === 'function') ? topicStats().filter(t => t.n >= 3).map(t => ({ name: t.name, p: t.ok / t.n, n: t.n })).sort((a, b) => a.p - b.p).slice(0, 5) : [];

  $('#main').innerHTML = `<section class="wrap wide sy-page">
    ${pageHead('Tiến độ học tập', syNum(today.min) + ' phút hôm nay · chuỗi ' + syStreak() + ' ngày',
    'Một chỗ nhìn thấy toàn bộ việc học: thời gian, thẻ, độ chính xác theo môn, chỗ còn yếu và việc nên làm tiếp. Số liệu lấy từ chính hoạt động của bạn trong máy.')}

    <div class="pg-kpi">
      <div class="pg-k"><span class="kicker">Tuần này</span><b>${syNum(wkSum)}′</b><em class="${wkSum >= prevSum ? 'up' : 'down'}">${prevSum ? (wkSum >= prevSum ? '+' : '') + Math.round((wkSum - prevSum) / prevSum * 100) + '%' : 'tuần đầu'}</em></div>
      <div class="pg-k"><span class="kicker">Chuỗi ngày</span><b>${syStreak()}</b><em>liên tiếp</em></div>
      <div class="pg-k"><span class="kicker">Thẻ đã thuộc</span><b>${mastered}</b><em>/ ${S.cards.length} thẻ</em></div>
      <div class="pg-k"><span class="kicker">Độ chính xác</span><b>${accAll.total ? Math.round(accAll.right / accAll.total * 100) + '%' : '—'}</b><em>${accAll.total} câu đã chấm</em></div>
      <div class="pg-k"><span class="kicker">Đề đã làm</span><b>${S.results.length}</b><em>lượt luyện</em></div>
      ${(() => {
      if (typeof gdTermAvg !== 'function') return '';
      const g = gdTermAvg('hk1'), g2 = gdTermAvg('hk2');
      if (g === null && g2 === null) return '';
      const use = g2 !== null ? g2 : g;
      const rk = gdRank(use);
      return `<div class="pg-k"><span class="kicker">Điểm TB</span>
        <b style="${rk ? 'color:' + rk.color : ''}">${use.toFixed(1)}</b>
        <em><a href="#/grades" class="pg-k-l">sổ điểm →</a></em></div>`;
    })()}
    </div>

    <div class="pg-advice">
      <span class="kicker">Nên làm tiếp</span>
      <div class="pg-adv-grid">
        ${advice.map((a, i) => `<a class="pg-adv" href="${a.href}">
          <span class="pg-adv-n">${String(i + 1).padStart(2, '0')}</span>
          <span class="pg-adv-b"><b>${a.t}</b><i>${a.d}</i></span>
          <span class="pg-adv-go">${a.cta} →</span></a>`).join('')}
      </div>
    </div>

    <div class="sy-grid2">
      <div class="sy-box">
        <div class="sy-box-h"><span class="kicker">Phút học theo tuần</span><span class="grow"></span>
          <span class="sy-legend">tuần này <i class="l4"></i> tuần trước <i class="l2"></i></span></div>
        <div class="pg-bars">
          ${wk.map((d, i) => `<div class="pg-bcol">
            <div class="pg-bpair">
              <div class="pg-bwrap"><i class="prev" style="height:${Math.round(prev[i].min / maxW * 100)}%"></i></div>
              <div class="pg-bwrap"><i class="cur" style="height:${Math.round(d.min / maxW * 100)}%"></i></div>
            </div>
            <span>${d.dow}</span><em>${d.min}</em></div>`).join('')}
        </div>
      </div>

      <div class="sy-box">
        <div class="sy-box-h"><span class="kicker">Nhịp học 12 tuần</span><span class="grow"></span>
          <span class="sy-legend">ít <i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i> nhiều</span></div>
        <div class="sy-heat">
          <div class="sy-heat-days"><span>T2</span><span>T4</span><span>T6</span><span>CN</span></div>
          <div class="sy-heat-grid">${weeks.map(w => `<div class="sy-week">${w.map(c => `<i class="sy-cell lv${c.lv}${c.future ? ' fut' : ''}" title="${c.k} · ${c.n} hoạt động"></i>`).join('')}</div>`).join('')}</div>
        </div>
        <p class="sy-note">Mỗi ô là một ngày; càng đậm càng nhiều hoạt động. Mục tiêu là giữ cho ô nào cũng có màu.</p>
      </div>
    </div>

    <div class="sy-grid2">
      <div class="sy-box">
        <div class="sy-box-h"><span class="kicker">Độ chính xác theo môn</span><span class="grow"></span></div>
        ${Object.keys(acc).length ? `<div class="pg-acc">
          ${Object.keys(acc).sort((a, b) => (acc[a].right / acc[a].total) - (acc[b].right / acc[b].total)).map(k => {
        const r = acc[k], p = Math.round(r.right / r.total * 100);
        return `<div class="pg-arow">
              <span class="pg-aname">${k === 'all' ? 'Nhiều môn' : syScopeName(0, k)}</span>
              <span class="pg-abar"><i class="${p >= 80 ? 'good' : p >= 50 ? 'mid' : 'bad'}" style="width:${p}%"></i></span>
              <span class="pg-anum">${p}% · ${r.right}/${r.total}</span></div>`;
      }).join('')}
        </div>` : '<p class="sy-note">Chưa có đề nào được chấm. Làm một đề 10 câu ở mục Luyện đề để có số liệu.</p>'}
        ${vlDue ? `<p class="sy-note">Vật lí 9 còn <b>${vlDue}</b> câu sai đến hạn ôn. <a class="sy-mini" href="#/review">Ôn ngay →</a></p>` : ''}
      </div>

      <div class="sy-box">
        <div class="sy-box-h"><span class="kicker">Vòng đời thẻ ghi nhớ</span><span class="grow"></span>
          <a class="sy-mini" href="#/cards">Mở bộ thẻ →</a></div>
        <div class="pg-boxes">
          ${boxCount.map((n, i) => `<div class="pg-bx"><b>${n}</b><span>hộp ${i + 1}</span><i>${SY_BOX_LABEL[i]}</i></div>`).join('')}
        </div>
        <p class="sy-note">Thẻ ở hộp 5–7 là thẻ đã thuộc khá chắc. Nếu nhiều thẻ dồn ở hộp 1, hãy giảm số thẻ mới mỗi ngày và ôn đều hơn.</p>
        ${plan ? `<div class="pg-plan">
          <span class="kicker">Kế hoạch</span>
          <b>${esc(plan.name)}</b>
          <span>${plan.doneCount}/${plan.totalCount} mục · tới ${plan.examVN}</span>
          <div class="pg-pbar"><i style="width:${plan.totalCount ? Math.round(plan.doneCount / plan.totalCount * 100) : 0}%"></i></div>
          <a class="sy-mini" href="#/plan">Mở kế hoạch →</a>
        </div>` : ''}
      </div>
    </div>

    ${topicRows.length ? `<div class="sy-box" style="margin-top:14px">
      <div class="sy-box-h"><span class="kicker">Chủ đề Vật lí 9 cần vá</span><span class="grow"></span>
        <a class="sy-mini" href="#/review">Luyện câu sai →</a></div>
      <div class="pg-acc">
        ${topicRows.map(t => `<div class="pg-arow">
          <span class="pg-aname">${esc(t.name)}</span>
          <span class="pg-abar"><i class="${t.p >= .8 ? 'good' : t.p >= .5 ? 'mid' : 'bad'}" style="width:${Math.round(t.p * 100)}%"></i></span>
          <span class="pg-anum">${Math.round(t.p * 100)}% · ${t.n} câu</span></div>`).join('')}
      </div>
    </div>` : ''}

    <div class="sy-tools">
      <span class="kicker">Xuất báo cáo</span>
      <div class="sy-btnrow">
        <button class="btn ghost sm" id="pgPrint">In / lưu PDF báo cáo</button>
        <button class="btn ghost sm" id="pgExport">Sao lưu dữ liệu học</button>
      </div>
    </div>
  </section>`;

  const pr = $('#pgPrint'); if (pr) pr.onclick = () => window.print();
  const ex = $('#pgExport'); if (ex) ex.onclick = () => syExportAll();
}

/* =========================================================
   HỘP THOẠI NHỎ — thay cho prompt() của trình duyệt
   ========================================================= */
/* Hộp xác nhận nội trang — thay hẳn confirm() của trình duyệt.
   confirm() bị chặn trong iframe/preview và làm treo bộ QA, nên mọi chỗ xoá
   dữ liệu đều đi qua đây. `danger` tô nút xác nhận bằng màu cảnh báo. */
function uiConfirm(title, message, onOk, opt) {
  opt = opt || {};
  const d = document.createElement('div');
  d.className = 'overlay ui-ov';
  d.innerHTML = `<div class="ov-panel ui-mini" role="alertdialog" aria-label="${esc(title)}">
    <div class="cal-mh"><span class="kicker">${esc(title)}</span><span class="grow"></span><button class="bd-x" aria-label="Đóng">×</button></div>
    <div class="cal-mb"><p class="ui-msg">${message}</p></div>
    <div class="cal-mf"><span class="grow"></span>
      <button class="btn ghost sm" id="ucNo">Huỷ</button>
      <button class="btn sm${opt.danger ? ' btn-danger' : ''}" id="ucYes">${esc(opt.okText || 'Đồng ý')}</button></div>
  </div>`;
  document.body.appendChild(d);
  const close = () => { d.remove(); document.removeEventListener('keydown', onKey, true); };
  const yes = () => { close(); onOk(); };
  const onKey = e => {
    if (e.key === 'Escape') { e.stopPropagation(); close(); }
    if (e.key === 'Enter') { e.preventDefault(); yes(); }
  };
  d.querySelector('.bd-x').onclick = close;
  $('#ucNo', d).onclick = close;
  $('#ucYes', d).onclick = yes;
  d.onclick = e => { if (e.target === d) close(); };
  document.addEventListener('keydown', onKey, true);
  setTimeout(() => { const b = $('#ucYes', d); if (b) b.focus(); }, 40);
}

function uiPrompt(title, def, onOk, opt) {
  opt = opt || {};
  const d = document.createElement('div');
  d.className = 'overlay ui-ov';
  d.innerHTML = `<div class="ov-panel ui-mini" role="dialog" aria-label="${esc(title)}">
    <div class="cal-mh"><span class="kicker">${esc(title)}</span><span class="grow"></span><button class="bd-x" aria-label="Đóng">×</button></div>
    <div class="cal-mb">
      ${opt.multiline
      ? `<textarea id="uiV" rows="3">${esc(def || '')}</textarea>`
      : `<input id="uiV" type="${opt.type || 'text'}" value="${esc(def || '')}">`}
      ${opt.hint ? `<p class="sy-note">${esc(opt.hint)}</p>` : ''}
    </div>
    <div class="cal-mf"><span class="grow"></span>
      <button class="btn ghost sm" id="uiNo">Huỷ</button>
      <button class="btn sm" id="uiYes">Đồng ý</button></div>
  </div>`;
  document.body.appendChild(d);
  const inp = $('#uiV', d);
  const close = () => d.remove();
  const ok = () => { const v = inp.value.trim(); if (v === '') return; close(); onOk(v); };
  d.querySelector('.bd-x').onclick = close;
  $('#uiNo', d).onclick = close;
  $('#uiYes', d).onclick = ok;
  d.onclick = e => { if (e.target === d) close(); };
  inp.onkeydown = e => {
    if (e.key === 'Enter' && !opt.multiline) { e.preventDefault(); ok(); }
    if (e.key === 'Escape') close();
  };
  setTimeout(() => { inp.focus(); inp.select && inp.select(); }, 40);
}

function uiCardForm(preset) {
  const d = document.createElement('div');
  d.className = 'overlay ui-ov';
  const sc = schoolState();
  d.innerHTML = `<div class="ov-panel ui-mini" role="dialog" aria-label="Thẻ mới">
    <div class="cal-mh"><span class="kicker">Thẻ ghi nhớ mới</span><span class="grow"></span><button class="bd-x" aria-label="Đóng">×</button></div>
    <div class="cal-mb">
      <label class="st-row"><span>Mặt trước · câu hỏi</span>
        <textarea id="ucF" rows="2" placeholder="Ví dụ: Phát biểu định luật Ôm.">${esc(preset && preset.front || '')}</textarea></label>
      <label class="st-row"><span>Mặt sau · đáp án</span>
        <textarea id="ucB" rows="2" placeholder="I = U / R">${esc(preset && preset.back || '')}</textarea></label>
      <div class="st-two">
        <label class="st-row"><span>Lớp</span><select id="ucG">${Array.from({ length: 12 }, (_, i) => i + 1).map(n => `<option value="${n}"${n === sc.grade ? ' selected' : ''}>Lớp ${n}</option>`).join('')}</select></label>
        <label class="st-row"><span>Môn</span><select id="ucS"></select></label>
      </div>
    </div>
    <div class="cal-mf"><span class="grow"></span>
      <button class="btn ghost sm" id="ucNo">Huỷ</button>
      <button class="btn sm" id="ucYes">Thêm thẻ</button></div>
  </div>`;
  document.body.appendChild(d);
  const fillS = () => {
    const g = +$('#ucG', d).value;
    const cur = sc.subj;
    $('#ucS', d).innerHTML = subjectsFor(g).map(x => `<option value="${x.id}"${x.id === cur ? ' selected' : ''}>${x.name}</option>`).join('');
  };
  fillS();
  $('#ucG', d).onchange = fillS;
  const close = () => d.remove();
  d.querySelector('.bd-x').onclick = close;
  $('#ucNo', d).onclick = close;
  d.onclick = e => { if (e.target === d) close(); };
  $('#ucYes', d).onclick = () => {
    const f = $('#ucF', d).value.trim(), b = $('#ucB', d).value.trim();
    if (!f) return toast('Chưa nhập mặt trước');
    syAddCard({ front: f, back: b, g: +$('#ucG', d).value, s: $('#ucS', d).value });
    close(); toast('Đã thêm thẻ');
    if (/^#\/cards/.test(location.hash)) renderCards(); else if (/^#\/study/.test(location.hash)) renderStudy();
  };
  setTimeout(() => $('#ucF', d).focus(), 40);
}
