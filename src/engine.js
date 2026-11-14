/* =========================================================
   LEARNING ENGINE v2
   · Ôn cách quãng 5 hộp (Leitner): 0 · 1 · 3 · 7 · 21 ngày
   · Mục tiêu ngày + chuỗi ngày học
   · Chẩn đoán chủ đề yếu, gợi ý việc học tiếp theo
   · Lưu và khôi phục bài thi đang làm
   ========================================================= */

const SRS_DAYS = [0, 1, 3, 7, 21];
const DAY_MS = 86400000;

/* ---------- ghi nhận một câu trả lời, cập nhật hộp ---------- */
function srsRecord(id, ok, p) {
  const prev = ansOf(id) || {};
  const box = ok ? Math.min(SRS_DAYS.length - 1, (prev.box || 0) + 1) : 0;
  const due = ok ? Date.now() + SRS_DAYS[box] * DAY_MS : Date.now();
  state.ans[id] = { ok, p, at: Date.now(), box, due, tries: (prev.tries || 0) + 1 };
  activity(ok ? 2 : 1);
  save();
}

/* ---------- danh sách đến hạn ôn ---------- */
function dueList() {
  const now = Date.now();
  return ALLQ.filter(q => {
    const a = ansOf(q.id);
    if (!a) return false;
    if (a.due === undefined) return !a.ok;       /* dữ liệu cũ: chỉ câu sai */
    return a.due <= now;
  });
}
function srsBoxes() {
  const c = [0, 0, 0, 0, 0];
  ALLQ.forEach(q => {
    const a = ansOf(q.id);
    if (!a) return;
    c[Math.min(4, a.box || 0)]++;
  });
  return c;
}

/* ---------- thống kê hôm nay ---------- */
/* Every reader of state.ans goes through here.
   The map is user-writable through localStorage/JSON import, so an entry can
   be null, a string, or `{}`. Before this guard, one null entry made
   todayStats() throw and the HOME PAGE failed to render — the most important
   page in the product, killed by a corrupt save. `at` defaults to 0 instead
   of undefined so arithmetic on it stays finite. */
function ansOf(id) {
  const a = state && state.ans ? state.ans[id] : null;
  return (a && typeof a === 'object') ? a : null;
}

function todayStats() {
  const t0 = new Date(); t0.setHours(0, 0, 0, 0);
  const from = t0.getTime();
  let n = 0, ok = 0;
  Object.keys(state.ans || {}).forEach(k => {
    const a = ansOf(k);
    if (a && typeof a.at === 'number' && a.at >= from) { n++; if (a.ok) ok++; }
  });
  const goal = state.goal || 20;
  return { n, ok, goal, pct: Math.min(100, Math.round(n / goal * 100)), streak: streak(), due: dueList().length };
}

/* ---------- chẩn đoán chủ đề ---------- */
function topicStats() {
  const rows = TOPICS.map(t => ({ id: t.id, name: t.name.replace(/&amp;/g, '&'), n: 0, ok: 0 }));
  const byId = {};
  rows.forEach(r => byId[r.id] = r);
  ALLQ.forEach(q => {
    const a = ansOf(q.id);
    if (!a) return;
    const r = byId[q.t]; if (!r) return;
    r.n++; if (a.ok) r.ok++;
  });
  rows.forEach(r => r.acc = r.n ? r.ok / r.n : null);
  return rows;
}
function weakTopics(k = 3) {
  const rows = topicStats().filter(r => r.n >= 2 && r.acc < 0.75);
  rows.sort((a, b) => a.acc - b.acc || b.n - a.n);
  const untouched = topicStats().filter(r => r.n === 0).slice(0, 2);
  return rows.slice(0, k).concat(rows.length < k ? untouched.slice(0, k - rows.length) : []);
}
function firstSessionOfTopic(tid) {
  for (const d of DAYS) for (const s of d.sessions) {
    if (TOPIC_OF_DAY(d) === tid) return { d, s };
  }
  return null;
}

/* ---------- dải "hôm nay" trên trang chủ ---------- */
function todayStrip() {
  const t = todayStats();
  const weak = weakTopics(1)[0];
  const ring = 2 * Math.PI * 15;
  const out = `<div class="today">
    <div class="today-ring">
      <svg viewBox="0 0 36 36" aria-hidden="true">
        <circle cx="18" cy="18" r="15" fill="none" stroke="var(--rule)" stroke-width="2.4"/>
        <circle cx="18" cy="18" r="15" fill="none" stroke="var(--accent)" stroke-width="2.4"
          stroke-dasharray="${(ring * t.pct / 100).toFixed(1)} ${ring}" stroke-linecap="round"
          transform="rotate(-90 18 18)"/>
      </svg>
      <b>${t.n}</b>
    </div>
    <div class="today-txt">
      <span class="kicker">Hôm nay · mục tiêu ${t.goal} câu</span>
      <h3>${t.n === 0 ? 'Chưa làm câu nào hôm nay' : `${t.n} câu, đúng ${t.ok} · ${Math.round(t.ok / t.n * 100)}%`}</h3>
      <p>${t.due ? `<b>${t.due}</b> câu đến hạn ôn cách quãng.` : 'Không còn câu nào đến hạn — làm đề mới để mở rộng.'}
        ${weak ? ` Chủ đề yếu nhất: <b>${weak.name}</b>${weak.acc !== null ? ` (${Math.round(weak.acc * 100)}%)` : ''}.` : ''}</p>
    </div>
    <div class="today-act">
      <a class="btn sm" href="#/review">${t.due ? `Ôn ${t.due} câu →` : 'Ôn cách quãng →'}</a>
      ${weak ? `<a class="btn ghost sm" href="#/exam" data-drill-topic="${weak.id}">Luyện chủ đề ${weak.id} →</a>` : ''}
      <span class="today-streak">${t.streak ? `Chuỗi ${t.streak} ngày` : 'Bắt đầu chuỗi hôm nay'}</span>
    </div>
  </div>`;
  /* todayStrip() trả về chuỗi HTML, nên phải gắn hành động sau khi đã chèn vào DOM */
  setTimeout(() => mountTopicDrills(), 0);
  return out;
}

/* ---------- ước lượng thời gian còn lại theo nhịp thực tế ---------- */
function etaText() {
  const dm = doneMap();
  const done = Object.keys(dm).filter(k => dm[k]).length;
  const left = TOTAL_SESS - done;
  if (left <= 0) return 'Đã học hết 52 ca — quay lại ôn cách quãng để giữ kiến thức.';
  const days = Object.keys(state.days || {}).filter(d => (state.days[d] || 0) > 0).length;
  if (days < 2) return `Còn ${left} ca. Học đều 4 ca/ngày là xong trong ${Math.ceil(left / 4)} ngày.`;
  const perDay = done / days;
  if (perDay <= 0.01) return `Còn ${left} ca — bắt đầu hôm nay để máy tính được nhịp của bạn.`;
  const daysLeft = Math.ceil(left / perDay);
  return `Còn ${left} ca · nhịp hiện tại ${perDay.toFixed(1)} ca/ngày ⇒ khoảng ${daysLeft} ngày nữa.`;
}

/* ---------- lịch 14 ngày ---------- */
function heatStrip(days = 14) {
  const out = [];
  const t = new Date(); t.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(t.getTime() - i * DAY_MS);
    const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const n = state.days[k] || 0;
    const lv = n === 0 ? 0 : n < 4 ? 1 : n < 10 ? 2 : n < 20 ? 3 : 4;
    const wd = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()];
    out.push({ wd, n, lv, d: d.getDate(), today: i === 0 });
  }
  const max = Math.max(1, ...out.map(o => o.n));
  return `<div class="heat">
    <div class="heat-h"><span class="kicker">Nhịp học ${days} ngày</span>
      <span class="muted">Đỉnh ${max} hoạt động/ngày · ${out.filter(o => o.n).length}/${days} ngày có học</span></div>
    <div class="heat-cells">${out.map(o => `<div class="hc l${o.lv}${o.today ? ' now' : ''}" title="${o.d}: ${o.n} hoạt động">
      <b>${o.n || ''}</b><span>${o.today ? 'nay' : o.wd}</span></div>`).join('')}</div>
    <p class="muted" style="font-size:11px;margin:6px 0 0">Mỗi ô là một ngày: số trong ô là số hoạt động (câu trả lời, ca học, lượt thi). Ô đậm = ngày học dày.</p>
  </div>`;
}

/* ---------- bảng kế hoạch cho trang tiến độ ---------- */
function planCard() {
  const rows = topicStats();
  const weak = weakTopics(3);
  const boxes = srsBoxes();
  const total = boxes.reduce((a, b) => a + b, 0);
  return `<div class="plan">
    <div class="plan-h"><span class="kicker">Việc nên làm tiếp</span>
      <span class="muted">Tính từ ${total} câu bạn đã trả lời</span></div>
    <div class="plan-grid">
      <div class="plan-col">
        <h4>Chủ đề cần vá</h4>
        ${weak.length ? weak.map(w => {
          const fs = firstSessionOfTopic(w.id);
          const href = fs ? sessionHref(fs.d.n, fs.s.n) : '#/';
          return `<div class="plan-row">
            <span class="plan-n">${w.id}</span>
            <div><b>${w.name}</b><span class="muted">${w.n ? `${w.ok}/${w.n} câu đúng` : 'chưa làm câu nào'}</span></div>
            <a class="plan-a" href="${href}">Học ca →</a>
          </div>`;
        }).join('') : '<p class="muted" style="font-size:12px">Chưa đủ dữ liệu — làm thêm vài đề để máy chẩn đoán.</p>'}
      </div>
      <div class="plan-col">
        <h4>Hộp ôn cách quãng</h4>
        <div class="srs-bars">
          ${SRS_DAYS.map((d, i) => `<div class="srs-row">
            <span class="srs-k">Hộp ${i + 1} · ${d ? d + ' ngày' : 'hôm nay'}</span>
            <span class="srs-bar"><i style="width:${total ? Math.max(2, boxes[i] / total * 100) : 0}%"></i></span>
            <span class="srs-v">${boxes[i]}</span>
          </div>`).join('')}
        </div>
        <p class="muted" style="font-size:11.5px;margin-top:8px">Trả lời đúng thì câu lên hộp cao hơn và lâu mới hỏi lại; sai thì về hộp 1 và hỏi lại ngay hôm nay.</p>
      </div>
    </div>
  </div>`;
}

/* ---------- phiên học hôm nay: 3 việc, đo được ---------- */
function nextSessionLink() {
  for (const d of DAYS) for (const s of d.sessions)
    if (!doneMap()[sid(d.n, s.n)]) return sessionHref(d.n, s.n);
  return '#/review';
}
function routineState() {
  const t0 = new Date(); t0.setHours(0, 0, 0, 0);
  const from = t0.getTime();
  const ansN = Object.keys(state.ans || {}).filter(k => {
    const a = ansOf(k);
    return a && typeof a.at === 'number' && a.at >= from;
  }).length;
  const lesN = Object.keys(state.doneAt || {}).filter(k => state.doneAt[k] >= from).length;
  const runN = (state.runs || []).filter(r => r.at >= from).length;
  const goal = state.goal || 20;
  return [
    { k: 'Ôn tập', need: Math.min(10, goal), have: ansN, href: '#/review', unit: 'câu' },
    { k: 'Học một ca', need: 1, have: lesN, href: nextSessionLink(), unit: 'ca' },
    { k: 'Thi một lượt', need: 1, have: runN, href: '#/exam', unit: 'lượt' }
  ];
}
function routineCard() {
  const rows = routineState();
  const done = rows.filter(r => r.have >= r.need).length;
  if (done === rows.length) {
    return `<div class="routine all"><div class="rt-h"><span class="kicker">Phiên hôm nay</span>
      <b>Đủ 3 việc — chốt sổ hôm nay.</b></div>
      <p class="muted">Mai quay lại: câu đến hạn sẽ tự xếp hàng vào mục Ôn cách quãng.</p></div>`;
  }
  return `<div class="routine"><div class="rt-h"><span class="kicker">Phiên hôm nay · ${done}/3 việc</span>
    <span class="rt-bar"><i style="width:${done / rows.length * 100}%"></i></span></div>
    <div class="rt-rows">${rows.map(r => {
      const ok = r.have >= r.need;
      return `<a class="rt-row${ok ? ' ok' : ''}" href="${r.href}">
        <span class="rt-tick">${ok ? '✓' : ''}</span>
        <span class="rt-k">${r.k}</span>
        <span class="rt-v">${Math.min(r.have, r.need)}/${r.need} ${r.unit}</span>
        ${ok ? '' : '<span class="rt-go">làm →</span>'}
      </a>`;
    }).join('')}</div></div>`;
}

/* =========================================================
   LƯU BÀI THI ĐANG LÀM
========================================================= */
function examSnapshot(EX) {
  if (!EX) return null;
  return { ids: EX.qs.map(q => q.id), picks: EX.picks, t0: EX.t0, left: EX.left, done: EX.done, label: EX.label || '' };
}
function examPersist(EX) {
  state.exam = examSnapshot(EX);
  save();
}
function examRestore() {
  const s = state.exam;
  if (!s || s.done || !s.ids) return null;
  const qs = s.ids.map(id => ALLQ.find(q => q.id === id)).filter(Boolean);
  if (qs.length < 3) return null;
  const left = s.left || 0;
  if (left <= 0) return null;
  return { qs, picks: s.picks || {}, left, t0: Date.now() - (EXAM_SEC - left) * 1000, done: false, report: null, label: s.label || '' };
}
function examClear() { delete state.exam; save(); }

/* Gắn hành động cho nút trong examBanner(). Gọi ngay sau khi chèn HTML. */
function examBannerBind() {
  const r = $('#examResume'), d = $('#examDrop');
  if (r) r.onclick = () => go('#/exam');
  if (d) d.onclick = () => {
    uiConfirm('Bỏ đề đang làm', 'Xoá đề và toàn bộ đáp án đã chọn?', () => {
      if (typeof examClear === 'function') examClear();
      EXAM = null; render();
    }, { danger: true, okText: 'Bỏ đề' });
  };
}

function examBanner(EX) {
  setTimeout(examBannerBind, 0);
  if (!EX) return '';
  const n = Object.keys(EX.picks || {}).length;
  return `<div class="exam-resume">
    <span class="kicker">Đang có đề làm dở</span>
    <b>${EX.qs.length} câu · đã trả lời ${n} · còn ${Math.floor(EX.left / 60)} phút</b>
    <span>
      <button class="btn sm" id="examResume">Làm tiếp</button>
      <button class="btn ghost sm" id="examDrop">Bỏ đề này</button>
    </span>
  </div>`;
}

/* =========================================================
   THANH TÌM KIẾM — mở rộng phạm vi, điều hướng bằng bàn phím
========================================================= */
function paletteIndex() {
  const out = [
    { g: 'Công cụ', t: 'Máy giải 16 dạng bài', href: '#/calc', k: 'may giai solver bai tap' },
    { g: 'Công cụ', t: 'Mạch tự dựng', href: '#/build', k: 'mach tu dung dien tro noi tiep song song' },
    { g: 'Công cụ', t: 'Phòng thí nghiệm · 4 bàn', href: '#/lab', k: 'phong thi nghiem thuc hanh do dien tro tieu cu archimedes nhiet' },
    { g: 'Công cụ', t: 'Ngân hàng đề', href: '#/papers', k: 'de thi chuyen hsg pdf' },
    { g: 'Công cụ', t: 'Thi thử 15 câu', href: '#/exam', k: 'thi thu de 15 cau 20 phut' },
    { g: 'Công cụ', t: 'Ôn cách quãng', href: '#/review', k: 'on cach quang cau sai' },
    { g: 'Công cụ', t: 'Bài giải mẫu', href: '#/solve', k: 'bai giai mau tu luan' },
    { g: 'Công cụ', t: 'Flashcard công thức', href: '#/flash', k: 'flashcard cong thuc' },
    { g: 'Công cụ', t: 'Tạo phiếu in', href: '#/sheet', k: 'phieu in de cho lop giao vien' },
    { g: 'Công cụ', t: 'Tiến độ học tập', href: '#/stats', k: 'tien do thong ke' }
  ];
  DAYS.forEach(d => d.sessions.forEach(s => out.push({
    g: 'Bài học', t: s.title, d: `Ngày ${String(d.n).padStart(2, '0')} · ${s.label}`,
    href: sessionHref(d.n, s.n), k: `ngay ${d.n} ${s.title} ${d.title}`
  })));
  QA.forEach(x => out.push({ g: 'Hỏi đáp', t: x.q, href: '#/qa?q=' + encodeURIComponent(x.q), k: x.k }));
  NOTES.forEach(n => n.rows.forEach(([a, b]) => out.push({
    g: 'Công thức', t: a, d: b.replace(/<[^>]+>/g, ''), href: '#/notes?q=' + encodeURIComponent(a), k: a + ' ' + b.replace(/<[^>]+>/g, ' ')
  })));
  SOLVE.forEach((s, i) => out.push({ g: 'Bài giải', t: s.title, d: `Chủ đề ${s.t}`, href: '#/solve/' + i, k: s.title + ' ' + s.problem }));
  ALLQ.forEach(q => out.push({
    g: 'Câu hỏi', t: q.q.replace(/<[^>]+>/g, '').slice(0, 90), d: `Chủ đề ${q.t} · ${TYPE_LABEL[qType(q)] || 'trắc nghiệm'}`,
    href: '#/exam', act: q.id, k: q.q.replace(/<[^>]+>/g, '') + ' ' + (q.e || '') + ' cau hoi luyen'
  }));
  PAPER_BANK.forEach(p => out.push({
    g: 'Đề thi', t: `${p.reg}${p.y ? ' · ' + p.y : ''}`, d: p.note, href: '#/papers',
    k: `${p.reg} ${p.note} ${p.y || ''} de thi ${PAPER_KINDS[p.kind]}`
  }));
  /* trường học: điều hướng + bài mẫu + bài tự soạn (đọc trực tiếp từ state) */
  out.push({ g: 'Tự học', t: 'Học hôm nay', d: 'việc cần làm · chuỗi ngày', href: '#/study', k: 'hoc hom nay dashboard viec can lam chuoi ngay hom nay hoc gi' });
  out.push({ g: 'Tự học', t: 'Thẻ ghi nhớ', d: 'lặp lại cách quãng', href: '#/cards', k: 'the ghi nho flashcard on cach quang spaced repetition' });
  out.push({ g: 'Tự học', t: 'Luyện đề tự tạo', d: 'mọi lớp · mọi môn', href: '#/practice', k: 'luyen de tu tao de kiem tra cau hoi on tap' });
  out.push({ g: 'Tự học', t: 'Kế hoạch học tới ngày thi', d: 'chia bài theo ngày', href: '#/plan', k: 'ke hoach hoc lich on thi deadline' });
  out.push({ g: 'Tự học', t: 'Đồng hồ tập trung', d: '15 · 25 · 45 · 50 phút', href: '#/focus', k: 'dong ho tap trung pomodoro hen gio hoc' });
  out.push({ g: 'Tự học', t: 'Tiến độ tổng · báo cáo', d: 'thời gian · độ chính xác', href: '#/progress', k: 'tien do bao cao thong ke phut hoc do chinh xac' });
  out.push({ g: 'Trường học', t: 'Khoá học lớp 1–12', d: 'chọn lớp, chọn môn', href: '#/subjects', k: 'truong hoc khoa hoc lop 1 2 3 4 5 6 7 8 9 10 11 12 mon' });
  out.push({ g: 'Trường học', t: 'Kho tệp của tôi', d: 'ảnh · PDF · Word · bảng tính', href: '#/files', k: 'kho tep tai len upload file anh pdf word excel' });
  out.push({ g: 'Trường học', t: 'Bài của tôi', d: 'bài tự soạn', href: '#/mine', k: 'bai cua toi tu soan studio' });
  if (typeof allLessons === 'function' && typeof SUBJECTS !== 'undefined') {
    const nm = id => { const x = SUBJECTS.find(s => s.id === id); return x ? x.name : id; };
    allLessons().forEach(l => out.push({
      g: 'Bài lớp ' + l.g, t: l.t, d: nm(l.s) + (l.own ? ' · bài tự soạn' : ''),
      href: '#/read/' + l.id, k: `${l.t} ${nm(l.s)} lop ${l.g} ${(l.aim || '')} ${(l.tag || '')} bai hoc doc`
    }));
  }
  (window.__filesCache || []).forEach(f => out.push({
    g: 'Tệp', t: f.name, d: fileSizeCached(f.size), href: '#/files?f=' + f.id,
    k: `${f.name} tep tai lieu file anh pdf word ${f.name.replace(/\.[a-z0-9]+$/i, '')}`
  }));
  return out.map(o => Object.assign(o, { n: norm(o.t + ' ' + (o.k || '') + ' ' + (o.d || '')) }));
}

let PAL = null;
function openPalette() {
  if (PAL && document.body.contains(PAL)) { PAL.querySelector('#ovq').focus(); return; }
  PAL = null;                        /* lớp phủ cũ bị gỡ tay thì mở lại được */
  const idx = PAL_INDEX_CACHE || (PAL_INDEX_CACHE = paletteIndex());
  const d = document.createElement('div');
  d.className = 'overlay';
  d.innerHTML = `<div class="ov-panel" role="dialog" aria-label="Bảng lệnh">
    <div class="ov-in">
      <svg viewBox="0 0 16 16" style="width:15px;height:15px;stroke:#8b8478;fill:none;stroke-width:1.6"><circle cx="7" cy="7" r="4.6"/><path d="M10.5 10.5 14 14"/></svg>
      <input id="ovq" placeholder="Gõ để tìm bài học, công thức, đề, dạng bài…" autocomplete="off">
      <span class="kicker">↑↓ · ENTER · ESC</span>
    </div>
    <div class="ov-body" id="ovbody"></div>
  </div>`;
  document.body.appendChild(d); PAL = d;
  const input = $('#ovq', d);
  input.focus();
  let sel = 0, rows = [];
  const close = () => { d.remove(); PAL = null; };
  d.onclick = e => { if (e.target === d) close(); };
  const render = () => {
    const q = input.value.trim();
    const k = toks(q);
    if (!k.length) {
      rows = idx.filter(o => o.g === 'Công cụ').slice(0, 8);
    } else {
      rows = idx.map(o => {
        let sc = 0;
        k.forEach(w => { if (o.n.includes(w)) sc += o.t.toLowerCase().includes(w) ? 3 : 1; });
        if (q && norm(o.t).includes(norm(q))) sc += 6;       /* khớp cả cụm thì lên đầu */
        if (o.act) sc -= 0.5;                          /* câu hỏi lẻ xếp sau bài học */
        return { o, sc };
      }).filter(x => x.sc > 0).sort((a, b) => b.sc - a.sc).slice(0, 16).map(x => x.o);
    }
    sel = 0;
    paint();
  };
  const paint = () => {
    $('#ovbody', d).innerHTML = rows.length
      ? `<div class="ov-sec">${input.value.trim() ? rows.length + ' kết quả' : 'Đi nhanh'}</div>` +
        rows.map((r, i) => `<div class="ov-row${i === sel ? ' on' : ''}" data-href="${r.href}"${r.act ? ` data-act="${r.act}"` : ''}>
          <span class="k">${r.g}</span><span class="t">${esc(r.t)}</span><span class="d">${r.act ? '↵ luyện ngay' : esc((r.d || '').slice(0, 60))}</span></div>`).join('')
      : '<div class="ov-sec">Không thấy. Thử: thấu kính, mạch cầu, hệ số góc, Bessel…</div>';
    $$('.ov-row', d).forEach((r, i) => {
      r.onmouseenter = () => { sel = i; paint(); };
      r.onclick = () => {
        const h = r.dataset.href, qid = r.dataset.act ? +r.dataset.act : null;
        close();
        if (qid) { const q = ALLQ.find(x => x.id === qid); if (q) drillQuestions([q], 'câu đã chọn'); }
        else go(h);
      };
    });
  };
  input.oninput = render;
  input.onkeydown = e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(rows.length - 1, sel + 1); paint(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); paint(); }
    else if (e.key === 'Enter') {
      const r = rows[sel]; if (!r) return;
      close();
      if (r.act) { const q = ALLQ.find(x => x.id === r.act); if (q) drillQuestions([q], 'câu đã chọn'); }
      else go(r.href);
    }
  };
  document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });
  render();
}
let PAL_INDEX_CACHE = null;

/* =========================================================
   NÚT "LUYỆN CHỦ ĐỀ" BẤT KỲ ĐÂU
========================================================= */
function mountTopicDrills(root) {
  $$('[data-drill-topic]', root || document).forEach(a => {
    a.onclick = e => {
      e.preventDefault();
      const t = +a.dataset.drillTopic;
      drillExam([t], 10, 'Chủ đề ' + t);
    };
  });
}
