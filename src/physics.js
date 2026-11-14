/* =========================================================
   PHYSICS HUB · #/physics
   ---------------------------------------------------------
   Physics already had more pieces than any other subject — a 52-session
   plan, a problem reader, a circuit board, a nested-circuit builder, an
   interactive lab, a formula sheet, 236 lectures — but they were scattered
   across menu entries with no front door. A student who wanted "physics"
   had to know which of nine pages to open.

   This is that front door. It shows, in order:
     1. where you are in the plan, and the next thing to do
     2. the tools, grouped by what they are for
     3. the formulas you should already know, searchable
     4. weak topics, from real quiz answers

   Every number comes from existing state. Nothing here is a duplicate of
   another page's data; it is a view over it.
   ========================================================= */

/* The tool index is data, so the hub cannot drift from the real routes.
   `need` explains WHEN to reach for the tool — a menu of names is useless
   without that, which is why the original menu was hard to navigate. */
const PH_TOOLS = [
  {
    group: 'Giải bài',
    items: [
      { href: '#/solve', name: 'Máy giải đề', need: 'Đề có số liệu, cần lời giải từng bước' },
      { href: '#/special', name: 'Đọc đề tự động', need: 'Dán cả đề, máy rút đại lượng và chọn định luật' },
      { href: '#/calc', name: 'Máy tính công thức', need: 'Biết công thức, chỉ cần bấm số' },
    ],
  },
  {
    group: 'Mạch điện',
    items: [
      { href: '#/build', name: 'Bảng mạch', need: 'Gõ công thức hoặc kéo thả linh kiện' },
      { href: '#/builder', name: 'Mạch lồng nhau', need: 'Nhiều tầng nối tiếp / song song' },
    ],
  },
  {
    group: 'Thực hành',
    items: [
      { href: '#/lab', name: 'Phòng thí nghiệm ảo', need: 'Bốn bàn thực hành, kéo thả đo đạc' },
      { href: '#/sim', name: 'Mô phỏng', need: 'Xem hiện tượng chạy thay vì đọc công thức' },
    ],
  },
  {
    group: 'Ôn tập',
    items: [
      { href: '#/notes', name: 'Sổ tay công thức', need: 'Tra nhanh 57 công thức cả chương trình' },
      { href: '#/papers', name: 'Luyện đề', need: 'Đề tự tạo, chấm theo chủ đề' },
      { href: '#/library', name: 'Bài giảng', need: '236 bài đã chọn lọc theo chủ đề' },
    ],
  },
];

/* Weakest topics from real quiz answers — the only honest source.
   Below 3 attempts a topic is not "weak", it is simply unknown, and saying
   otherwise would send students to revise things they already know. */
function phWeakTopics(limit) {
  /* Answers are stored keyed by question id and carry no topic — the topic
     has to be looked up in the question bank. My first version read
     `a.topic`, which never exists, so the list was always empty and looked
     like a "not enough data" state rather than a bug. */
  const topicOf = {};
  (typeof QS !== 'undefined' ? QS : []).forEach(q => { topicOf[q.id] = q.t; });
  const stat = {};
  TOPICS.forEach(t => { stat[t.id] = { id: t.id, name: t.name, n: 0, ok: 0 }; });
  Object.keys(state.ans || {}).forEach(k => {
    const a = state.ans[k];
    if (!a) return;
    let tp = topicOf[k];
    if (tp === undefined) {
      /* flashcard ids are prefixed by topic where they follow that scheme */
      const m = String(k).match(/^t(\d+)/);
      if (m) tp = +m[1];
    }
    if (tp === undefined || !stat[tp]) return;
    stat[tp].n++;
    if (a.ok) stat[tp].ok++;
  });
  const rows = Object.keys(stat).map(k => stat[k]).filter(r => r.n >= 3);
  rows.forEach(r => { r.rate = r.ok / r.n; });
  rows.sort((a, b) => a.rate - b.rate || b.n - a.n);
  return rows.slice(0, limit || 3);
}

function renderPhysics() {
  const L = i18nLang(), en = L === 'en';
  const dc = doneCount();
  const pct = TOTAL_SESS ? Math.round(dc / TOTAL_SESS * 100) : 0;
  const next = (() => {
    for (const d of DAYS) {
      for (const s of d.sessions) {
        if (!state.done[sid(d.n, s.n)]) return { d, s };
      }
    }
    return null;
  })();
  const weak = phWeakTopics(3);
  const cards = (state.cards || []).length;
  const mastered = (state.cards || []).filter(c => (c.box || 0) >= 4).length;

  /* phase bars — four segments, so the plan reads as a journey not a list */
  const phaseRows = ['I', 'II', 'III', 'IV'].map(ph => {
    const days = DAYS.filter(d => d.phase === ph);
    const all = days.reduce((a, d) => a + d.sessions.length, 0);
    const done = days.reduce((a, d) => a + dayDone(d), 0);
    return { ph, all, done, pct: all ? Math.round(done / all * 100) : 0 };
  });

  $('#main').innerHTML = `<section class="wrap wide sy-page">
    <div class="ph-hero">
      <div class="ph-hero-l">
        <span class="kicker">${en ? 'Physics · grade 9 → specialised exam' : 'Vật lí 9 · luyện thi chuyên'}</span>
        <h1>${en ? 'Physics' : 'Vật lí'}</h1>
        <p>${en
      ? 'One place for the whole subject: where you are in the 52-session plan, the eight tools, the formulas, and the topics that need another pass.'
      : 'Một chỗ cho cả môn: đang ở đâu trong 52 ca, tám công cụ, công thức, và những chủ đề cần quay lại.'}</p>
      </div>
      <div class="ph-ring" role="img" aria-label="${pct}%">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="42" class="ph-ring-bg"/>
          <circle cx="50" cy="50" r="42" class="ph-ring-fg"
            stroke-dasharray="${(pct * 264 / 100).toFixed(1)} 264"
            transform="rotate(-90 50 50)"/>
        </svg>
        <div class="ph-ring-t"><b>${pct}%</b><span>${dc}/${TOTAL_SESS}</span></div>
      </div>
    </div>

    ${next ? `<a class="ph-next" href="${sessionHref(next.d.n, next.s.n)}">
      <span class="ph-next-k">${en ? 'Next session' : 'Ca tiếp theo'} · ${en ? 'Day' : 'Ngày'} ${String(next.d.n).padStart(2, '0')}</span>
      <span class="ph-next-t">${esc(next.s.title)}</span>
      <span class="ph-next-a">${en ? 'Open' : 'Mở'} →</span>
    </a>` : `<div class="ph-next done">
      <span class="ph-next-k">${en ? 'Plan complete' : 'Đã xong lộ trình'}</span>
      <span class="ph-next-t">${en ? 'All 52 sessions are marked done.' : 'Cả 52 ca đều đã đánh dấu xong.'}</span>
    </div>`}

    <div class="ph-phases">
      ${phaseRows.map(r => `<div class="ph-phase">
        <div class="ph-phase-h">
          <span class="ph-phase-k">${en ? 'Phase' : 'Giai đoạn'} ${r.ph}</span>
          <span class="ph-phase-n">${r.done}/${r.all}</span>
        </div>
        <div class="ph-phase-bar"><i style="width:${r.pct}%"></i></div>
        <p class="ph-phase-d">${esc(PHASES[r.ph].s)}</p>
      </div>`).join('')}
    </div>

    <div class="ph-sec">
      <div class="ph-sec-h">
        <span class="kicker">${en ? 'Tools' : 'Công cụ'}</span>
        <span class="ph-sec-n">${PH_TOOLS.reduce((a, g) => a + g.items.length, 0)}</span>
      </div>
      <div class="ph-tools">
        ${PH_TOOLS.map(g => `<div class="ph-group">
          <h3>${g.group}</h3>
          ${g.items.map(it => `<a class="ph-tool" href="${it.href}">
            <b>${it.name}</b>
            <span>${it.need}</span>
          </a>`).join('')}
        </div>`).join('')}
      </div>
    </div>

    <div class="ph-two">
      <div class="ph-panel">
        <div class="ph-sec-h"><span class="kicker">${en ? 'Formulas mastered' : 'Công thức đã thuộc'}</span></div>
        <p class="ph-big">${mastered}<span>/${cards}</span></p>
        <p class="sy-note">${en
      ? 'Formula flashcards in the spaced-repetition box. A card counts as mastered after four correct reviews.'
      : 'Thẻ công thức trong hộp lặp lại cách quãng. Một thẻ được tính là thuộc sau bốn lần đúng.'}</p>
        <a class="btn ghost sm" href="#/flash">${en ? 'Review now' : 'Ôn ngay'}</a>
      </div>

      <div class="ph-panel">
        <div class="ph-sec-h"><span class="kicker">${en ? 'Needs another pass' : 'Cần quay lại'}</span></div>
        ${weak.length ? weak.map(w => `<div class="ph-weak">
            <span class="ph-weak-n">${esc(w.name)}</span>
            <span class="ph-weak-b"><i style="width:${Math.round(w.rate * 100)}%"></i></span>
            <span class="ph-weak-r">${Math.round(w.rate * 100)}% · ${w.n}</span>
          </div>`).join('')
      : `<p class="sy-note">${en
        ? 'Not enough answers yet. After three attempts in a topic it appears here, weakest first.'
        : 'Chưa đủ dữ liệu. Sau ba câu trong một chủ đề, chủ đề đó hiện ở đây — yếu nhất trước.'}</p>`}
      </div>
    </div>
  </section>`;
}
