/* =========================================================
   KHÁM PHÁ · #/discover
   ---------------------------------------------------------
   The product has ~40 routes. Until now they lived in three
   half-overlapping lists — the rail, a flat "Explore ▾" popup and
   the ⌘K palette — so the same destination had up to three names
   and none of them said *why* you would go there.

   This module is the one place that answers "what can I open?":

     · EXPLORE_GROUPS is the single table of every destination,
       with `need` explaining WHEN to use it (a menu of names is
       useless, which is what made the old popup hard to use);
     · explSearch q   — one ranked search over tools, lessons,
                        formulas, Q&A, plan sessions and papers;
     · explRecent     — what you actually used, and a resume card
                        derived from real state (last lesson read,
                        cards due, unread lessons);
     · renderDiscover — the page, reachable at #/discover and from
                        every Explore button.

   The topbar popup and the rail are rendered from the same table,
   so a new route cannot exist in one place and be missing from the
   other. tools/check.js enforces that every non-parameterised route
   appears here.
   ========================================================= */

/* Every destination, once. `kw` carries the Vietnamese words a student
   might type (diacritic-free) that the visible name does not contain. */
const EXPLORE_GROUPS = [
  {
    id: 'hoc', vi: 'Học mỗi ngày', en: 'Every day', spread: true,
    items: [
      /* trang chủ là lộ trình Vật lí 9 — nội dung lớn nhất của sản phẩm. Nó là
         tuyến mặc định nên không khớp mẫu `p[0]===…`, và vì thế đã từng không
         xuất hiện ở bất kỳ danh sách nào ngoài logo. */
      { href: '#/', vi: 'Lộ trình 13 ngày', en: '13-day plan', need: 'Toàn bộ lộ trình Vật lí 9, chia theo 4 giai đoạn', kw: 'lo trinh 13 ngay vat li 9 trang chu roadmap' },
      { href: '#/study', vi: 'Học hôm nay', en: 'Today', need: 'Việc cần làm hôm nay, chuỗi ngày, tiến độ môn', kw: 'dashboard hom nay viec can lam chuoi ngay' },
      { href: '#/cards', vi: 'Thẻ ghi nhớ', en: 'Flashcards', need: 'Ôn theo lịch lặp lại cách quãng — thẻ đáo hạn hiện ở đây', kw: 'the ghi nho flashcard on cach quang on tap' },
      { href: '#/practice', vi: 'Luyện đề tự tạo', en: 'Practice', need: 'Tự chọn lớp, môn, số câu rồi tự chấm', kw: 'luyen de tu tao kiem tra cau hoi' },
      { href: '#/plan', vi: 'Kế hoạch tới ngày thi', en: 'Plan', need: 'Chia bài theo số ngày còn lại trước deadline', kw: 'ke hoach hoc deadline thi' },
      { href: '#/weekly', vi: 'Kế hoạch tuần', en: 'Week', need: 'Rải việc theo 7 ngày, kéo thả, dồn một ngày', kw: 'ke hoach tuan lich tuan' },
      { href: '#/focus', vi: 'Đồng hồ tập trung', en: 'Focus timer', need: 'Pomodoro 15/25/45/50 phút, có nhật ký phút học', kw: 'pomodoro dong ho hen gio tap trung' },
      { href: '#/grades', vi: 'Sổ điểm', en: 'Grades', need: 'Nhập điểm thật, tính điểm trung bình theo hệ số', kw: 'so diem bang diem diem trung binh' },
      { href: '#/timetable', vi: 'Thời khoá biểu', en: 'Timetable', need: 'Lịch học theo thứ và tiết', kw: 'thoi khoa bieu tkb tiet hoc' },
      { href: '#/calendar', vi: 'Lịch', en: 'Calendar', need: 'Xem tháng, thêm việc có giờ', kw: 'lich thang su kien' },
    ],
  },
  {
    id: 'khoa', vi: 'Khoá học lớp 1–12', en: 'Courses, grade 1–12',
    items: [
      { href: '#/subjects', vi: 'Chọn lớp & môn', en: 'Subjects', need: 'Cửa vào toàn bộ bài học theo lớp, theo môn', kw: 'khoa hoc lop mon bai hoc' },
      { href: '#/physics', vi: 'Mục Vật lí', en: 'Physics', need: 'Một chỗ cho cả Vật lí: lộ trình, 8 công cụ, công thức, chủ đề yếu', kw: 'vat li physics vat ly' },
      { href: '#/library', vi: 'Thư viện bài giảng', en: 'Lectures', need: '236 bài giảng đã chọn lọc, lọc được theo chủ đề', kw: 'thu vien bai giang video' },
      { href: '#/notes', vi: 'Sổ tay công thức', en: 'Formula sheet', need: 'Tra 57 công thức, in ra được', kw: 'so tay cong thuc tra cuu' },
      { href: '#/papers', vi: 'Đề thi & lời giải', en: 'Papers', need: '54 bộ đề chuyên kèm hướng dẫn', kw: 'de thi chuyen hsg loi giai' },
      { href: '#/qa', vi: 'Hỏi đáp', en: 'Q&A', need: 'Câu hỏi thường gặp, gõ không dấu vẫn ra', kw: 'hoi dap cau hoi thuong gap' },
      { href: '#/review', vi: 'Luyện câu sai', en: 'Review', need: 'Ôn lại đúng những câu bạn từng làm sai', kw: 'on cau sai on cach quang' },
      { href: '#/studio', vi: 'Tạo bài học', en: 'New lesson', need: 'Tự soạn bài, dán tài liệu, thêm ảnh và câu hỏi', kw: 'tao bai hoc tu soan studio' },
      { href: '#/mine', vi: 'Bài của tôi', en: 'My lessons', need: 'Sửa lại các bài bạn tự soạn', kw: 'bai cua toi tu soan' },
      { href: '#/files', vi: 'Kho tệp', en: 'Files', need: 'Ảnh, PDF, Word bạn đã tải lên', kw: 'kho tep tai len upload file' },
    ],
  },
  {
    id: 'congcu', vi: 'Công cụ Vật lí', en: 'Physics tools', spread: true,
    items: [
      { href: '#/calc', vi: 'Máy giải 16 dạng', en: 'Solver', need: 'Có số liệu, cần lời giải từng bước', kw: 'may giai solver bai tap' },
      { href: '#/solve', vi: 'Bài giải mẫu', en: 'Worked solutions', need: 'Xem cách trình bày một bài tự luận', kw: 'bai giai mau tu luan' },
      { href: '#/special', vi: 'Đọc đề tự động', en: 'Read a problem', need: 'Dán cả đề, máy rút đại lượng và chọn định luật', kw: 'doc de tu dong rut dai luong' },
      { href: '#/build', vi: 'Bảng mạch', en: 'Circuit board', need: 'Kéo–thả điện trở, nguồn, ampe kế', kw: 'bang mach mach dien keo tha' },
      { href: '#/builder', vi: 'Mạch lồng nhau', en: 'Nested circuit', need: 'Nhiều tầng nối tiếp / song song, thêm bớt R', kw: 'mach long nhau noi tiep song song' },
      { href: '#/sim', vi: 'Mô phỏng', en: 'Simulation', need: 'Xem hiện tượng chạy thay vì đọc công thức', kw: 'mo phong khuc xa bong toi dong nang' },
      { href: '#/lab', vi: 'Phòng thí nghiệm', en: 'Lab', need: 'Bốn bàn thực hành: đo, cân, nhiệt, quang', kw: 'phong thi nghiem thuc hanh' },
      { href: '#/exam', vi: 'Thi thử 15 câu', en: 'Mock exam', need: '20 phút, chấm điểm, lưu câu sai', kw: 'thi thu de 15 cau 20 phut' },
      { href: '#/flash', vi: 'Flashcard công thức', en: 'Formula cards', need: 'Học thuộc công thức bằng thẻ', kw: 'flashcard cong thuc hoc thuoc' },
      { href: '#/sheet', vi: 'Tạo phiếu in', en: 'Printable sheet', need: 'In đề cho lớp hoặc cho mình', kw: 'phieu in de giao vien in an' },
    ],
  },
  {
    id: 'tien', vi: 'Tiến độ & khác', en: 'Progress & more',
    items: [
      { href: '#/progress', vi: 'Tiến độ tổng', en: 'Progress', need: 'Báo cáo tuần: phút học, độ chính xác, lời khuyên', kw: 'tien do bao cao thong ke phut hoc' },
      { href: '#/stats', vi: 'Thống kê', en: 'Stats', need: 'Số liệu thô: số câu, hộp ôn, chủ đề yếu', kw: 'thong ke so lieu hop on' },
      { href: '#/share', vi: 'Khoe tiến độ', en: 'Share progress', need: 'Xuất thiệp tiến độ để đăng hoặc gửi bạn', kw: 'chia se khoe tien do the anh' },
      { href: '#/game', vi: 'Đấu trường', en: 'Study game', need: 'Học bằng trò chơi khi không muốn đọc', kw: 'game dau truong tro choi' },
      { href: '#/settings', vi: 'Tuỳ biến', en: 'Settings', need: 'Cỡ chữ, sáng/tối, pomodoro, ngôn ngữ', kw: 'tuy bien cai dat sang toi co chu' },
      { href: '#/about', vi: 'Giới thiệu', en: 'About', need: 'Dự án này là gì, dữ liệu lưu ở đâu', kw: 'gioi thieu ve du an' },
    ],
  },
];

/* nhãn theo ngôn ngữ đang chọn; vi là nguồn nên luôn có */
const explLang = () => (typeof i18nLang === 'function' ? i18nLang() : 'vi');
const explName = it => (explLang() === 'en' && it.en ? it.en : it.vi);
const explGroupName = g => (explLang() === 'en' && g.en ? g.en : g.vi);

/* tra ngược: href → tên hiển thị. Dùng cho "vừa mở" và cho tiêu đề trang. */
function explToolAt(href) {
  const h = String(href || '').split('?')[0];
  for (const g of EXPLORE_GROUPS) {
    for (const it of g.items) if (it.href === h) return { group: g, item: it };
  }
  return null;
}

/* ---------------- "vừa mở" ----------------
   Ghi lại route người dùng thật sự ghé, tối đa 8 mục, mới nhất trước.
   Không lưu route có tham số (bài học, ngày) — danh sách sẽ đầy rác. */
function explorRecentList() {
  if (!state.explore || typeof state.explore !== 'object') state.explore = { recent: [] };
  if (!Array.isArray(state.explore.recent)) state.explore.recent = [];
  /* phần tử có thể hỏng (null, số, chuỗi) vì đây là dữ liệu người dùng sửa
     được. Lọc bỏ tại chỗ: một phần tử null từng làm cả trang Khám phá ném lỗi
     ngay trong lúc render, tức là mất luôn cả trang chứ không chỉ mất một thẻ. */
  state.explore.recent = state.explore.recent.filter(r => r && typeof r === 'object' && typeof r.href === 'string');
  return state.explore.recent;
}
function explRecord(hash) {
  const hit = explToolAt(hash);
  if (!hit || !hit.item.href) return;
  const list = explorRecentList();
  /* đã là mục mới nhất rồi thì thôi — nếu không, mỗi lần đổi trang lại ghi
     localStorage + IndexedDB + cookie, trong khi danh sách không đổi gì. */
  if (list[0] && list[0].href === hit.item.href) return;
  const i = list.findIndex(x => x.href === hit.item.href);
  const entry = { href: hit.item.href, at: Date.now(), n: hit.item.vi };
  if (i >= 0) list.splice(i, 1);
  list.unshift(entry);
  if (list.length > 8) list.length = 8;
  save();
}

/* ---------------- tìm kiếm ----------------
   Một hàm, một thứ hạng, dùng cho cả trang Khám phá và ô tìm trên thanh trên.
   `hit` đòi MỌI từ khoá cùng khớp — giống searchAll — nên "định luật ôm"
   không trả về mọi thứ có chữ "định luật". */
function explIndex() {
  const out = [];
  EXPLORE_GROUPS.forEach(g => g.items.forEach(it => out.push({
    kind: 'tool', g: explGroupName(g), t: explName(it), vi: it.vi,
    d: it.need, href: it.href, k: it.vi + ' ' + (it.en || '') + ' ' + (it.kw || '') + ' ' + it.need,
  })));

  if (typeof allLessons === 'function' && typeof SUBJECTS !== 'undefined') {
    const nm = id => { const x = SUBJECTS.find(s => s.id === id); return x ? x.name : id; };
    allLessons().forEach(l => out.push({
      kind: 'lesson', g: 'Lớp ' + l.g, t: l.t, d: nm(l.s) + (l.tag ? ' · ' + l.tag : ''),
      href: '#/read/' + l.id,
      k: l.t + ' ' + nm(l.s) + ' ' + l.g + ' ' + (l.aim || '') + ' ' + (l.tag || ''),
    }));
  }
  if (typeof DAYS !== 'undefined') {
    DAYS.forEach(d => d.sessions.forEach(s => out.push({
      kind: 'session', g: 'Lộ trình', t: s.title, d: 'Ngày ' + String(d.n).padStart(2, '0') + ' · ' + s.label,
      href: sessionHref(d.n, s.n), k: s.title + ' ' + (s.obj || '') + ' ' + d.title,
    })));
  }
  if (typeof NOTES !== 'undefined') {
    NOTES.forEach(n => n.rows.forEach(([a, b]) => {
      const plain = String(b).replace(/<[^>]+>/g, ' ');
      out.push({ kind: 'formula', g: 'Công thức', t: a, d: plain, href: '#/notes?q=' + encodeURIComponent(a), k: a + ' ' + plain });
    }));
  }
  if (Array.isArray(window.QA)) {
    window.QA.forEach(x => out.push({
      kind: 'qa', g: 'Hỏi đáp', t: x.q, d: '',
      href: '#/qa?q=' + encodeURIComponent(x.q), k: x.q + ' ' + (x.k || ''),
    }));
  }
  if (typeof PAPER_BANK !== 'undefined') {
    PAPER_BANK.forEach(p => out.push({
      kind: 'paper', g: 'Đề thi', t: (p.reg || '') + (p.y ? ' · ' + p.y : ''), d: p.note || '',
      href: '#/papers', k: (p.reg || '') + ' ' + (p.note || '') + ' ' + (p.y || '') + ' de thi',
    }));
  }

  /* n: chuỗi đã chuẩn hoá để so — tính một lần, không tính lại mỗi phím */
  return out.map(o => {
    const nm = norm(o.t + ' ' + o.d + ' ' + o.k);
    return { o, n: nm, nt: norm(o.t), titleCount: toks(o.t).length };
  });
}

/* Trọng số: khớp trong tên > khớp trong mô tả > khớp trong từ khoá.
   Công cụ và bài học được ưu tiên hơn câu hỏi lẻ, vì đó là thứ người ta
   đang tìm khi mở ô tìm. */
const EXPL_KIND_W = { tool: 2.2, lesson: 1.6, formula: 1.8, session: 1.3, qa: 1.0, paper: 1.1 };

function explSearch(q, limit) {
  const words = toks(q);
  if (!words.length) return [];
  const idx = window.EXPL_INDEX || (window.EXPL_INDEX = explIndex());
  const cap = limit || 24;
  const scored = [];
  for (let i = 0; i < idx.length; i++) {
    const row = idx[i];
    let ok = true, sc = 0;
    for (let w = 0; w < words.length; w++) {
      const word = words[w];
      if (row.n.indexOf(word) < 0) { ok = false; break; }
      if (row.nt.indexOf(word) >= 0) sc += 3;
      else sc += 1;
    }
    if (!ok) continue;
    sc *= EXPL_KIND_W[row.o.kind] || 1;
    if (row.nt === norm(q)) sc += 8;                    /* tên trùng khít */
    else if (row.nt.indexOf(norm(q)) === 0) sc += 3;     /* tên bắt đầu bằng */
    scored.push({ o: row.o, sc });
  }
  scored.sort((a, b) => b.sc - a.sc);
  const seen = new Set(), out = [];
  for (const r of scored) {
    const key = r.o.href + '|' + r.o.t;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r.o);
    if (out.length >= cap) break;
  }
  return out;
}

/* ---------------- gợi ý: đọc tiếp / ôn tập ----------------
   Tất cả suy ra từ dữ liệu thật. Nếu chưa có gì để gợi ý thì trả null,
   thay vì bịa ra một "khoá học nên học tiếp". */
function explResume() {
  const S = (typeof schoolState === 'function') ? schoolState() : null;
  const last = S && S.soft && S.soft.lastRead;
  if (last && last.id && typeof lessonById === 'function') {
    const l = lessonById(last.id);
    if (l) return {
      kind: 'continue', href: '#/read/' + l.id, kicker: 'Đọc tiếp',
      title: l.t, sub: 'Lớp ' + l.g + ' · ' + (typeof syScopeName === 'function' ? syScopeName(l.g, l.s) : l.s),
    };
  }
  if (typeof syNextLesson === 'function') {
    const nx = syNextLesson();
    if (nx) return {
      kind: 'new', href: '#/read/' + nx.id, kicker: 'Bài mới',
      title: nx.t, sub: 'Lớp ' + nx.g + ' · ' + (typeof syScopeName === 'function' ? syScopeName(nx.g, nx.s) : nx.s),
    };
  }
  return null;
}

/* Việc đang chờ: thẻ đáo hạn, câu sai cần ôn. Chỉ trả về cái có số > 0. */
function explDue() {
  const out = [];
  let cards = 0, wrong = 0;
  try { cards = typeof syDue === 'function' ? syDue().length : 0; } catch (e) { cards = 0; }
  try { wrong = typeof dueList === 'function' ? dueList().length : 0; } catch (e) { wrong = 0; }
  if (cards) out.push({ href: '#/cards', n: cards, k: 'Thẻ đến hạn ôn', vi2: 'Ôn ngay' });
  if (wrong) out.push({ href: '#/review', n: wrong, k: 'Câu sai đến hạn', vi2: 'Luyện lại' });
  return out;
}

/* ---------------- trang #/discover ---------------- */
function renderDiscover(q0) {
  const q = (q0 || '').trim();
  const res = q ? explSearch(q, 30) : [];
  const resume = explResume();
  const due = explDue();
  const recent = explorRecentList().slice(0, 6).map(r => {
    const hit = explToolAt(r.href);
    return hit ? { href: r.href, t: explName(hit.item), d: hit.item.need } : null;
  }).filter(Boolean);
  /* recent entries pointing at routes that no longer exist are dropped above */

  const kindLabel = { tool: 'Công cụ', lesson: 'Bài học', formula: 'Công thức', session: 'Lộ trình', qa: 'Hỏi đáp', paper: 'Đề thi' };
  const mkRow = (r, i) => `<a class="expl-row${i === 0 && q ? ' on' : ''}" href="${r.href}" data-expl-row>
      <span class="k">${kindLabel[r.kind] || r.g}</span>
      <span class="t">${esc(r.t)}</span>
      <span class="d">${esc((r.d || '').slice(0, 76))}</span>
      <span class="go">→</span>
    </a>`;

  $('#main').innerHTML = `<section class="wrap wide expl-page">
    ${pageHead('Khám phá · ' + EXPLORE_GROUPS.reduce((n, g) => n + g.items.length, 0) + ' lối vào',
    'Một chỗ để mở mọi thứ',
    'Tìm bằng tiếng Việt có dấu hay không dấu đều được. Mỗi mục ghi rõ <em>khi nào nên dùng</em>, vì một danh sách tên gọi thì không giúp được gì khi bạn đang cần gấp.')}

    <form class="expl-search" id="explForm" role="search">
      <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.6"/><path d="M10.5 10.5 14 14"/></svg>
      <input id="explQ" value="${esc(q)}" placeholder="định luật ôm, thẻ ghi nhớ, mạch cầu, lớp 12 toán…" autocomplete="off" aria-label="Tìm trong toàn bộ khoá học">
      <kbd>ENTER</kbd>
    </form>

    ${q ? `<div class="expl-out" id="explOut">
      <div class="expl-h"><span class="kicker">${res.length} kết quả cho “${esc(q)}”</span>
        <a class="expl-clear" href="#/discover">xoá tìm kiếm</a></div>
      ${res.length ? res.map(mkRow).join('') : `<div class="expl-none">
        <b>Không thấy “${esc(q)}”</b>
        <p>Thử một từ khoá ngắn hơn, hoặc mở mục Hỏi đáp để tra theo câu hỏi thường gặp.</p>
        <a class="btn ghost sm" href="#/qa?q=${encodeURIComponent(q)}">Tra trong Hỏi đáp →</a>
      </div>`}
    </div>` : `
      ${due.length || resume ? `<div class="expl-top">
        ${resume ? `<a class="expl-resume" href="${resume.href}">
          <span class="kicker">${resume.kicker}</span>
          <b>${esc(resume.title)}</b>
          <i>${esc(resume.sub)}</i>
          <em>Mở bài →</em>
        </a>` : ''}
        ${due.map(d => `<a class="expl-due" href="${d.href}">
          <b>${d.n}</b><span>${d.k}</span><em>${d.vi2} →</em>
        </a>`).join('')}
      </div>` : `<div class="expl-empty-top">
        <b>Bắt đầu từ đâu?</b>
        <p>Chưa có bài nào đang đọc dở. Chọn lớp và môn để mở bài đầu tiên — hoặc thử ôn thẻ, làm một đề ngắn.</p>
        <a class="btn sm" href="#/subjects">Chọn lớp &amp; môn →</a>
      </div>`}

      ${recent.length ? `<div class="expl-sec">
        <div class="expl-sec-h"><span class="kicker">Vừa mở</span><a href="#/discover" data-expl-clear>xoá</a></div>
        <div class="expl-recent">${recent.map(r => `<a href="${r.href}"><b>${esc(r.t)}</b><i>${esc((r.d || '').slice(0, 40))}</i></a>`).join('')}</div>
      </div>` : ''}

      ${EXPLORE_GROUPS.map(g => `<div class="expl-sec" id="expl-${g.id}">
        <div class="expl-sec-h"><span class="kicker">${explGroupName(g)}</span><em>${g.items.length} mục</em></div>
        <div class="expl-grid">
          ${g.items.map(it => `<a class="expl-card" href="${it.href}">
            <b>${esc(explName(it))}</b>
            <span>${esc(it.need)}</span>
          </a>`).join('')}
        </div>
      </div>`).join('')}
    `}
  </section>`;

  const form = $('#explForm'), input = $('#explQ');
  form.onsubmit = e => { e.preventDefault(); go('#/discover?q=' + encodeURIComponent(input.value.trim())); };
  input.oninput = () => {
    /* gợi ý sống ngay dưới ô, không cần Enter — nhưng vẫn giữ Enter để chốt */
    const v = input.value.trim();
    const out = $('#explOut');
    if (!v) { if (out) out.remove(); return; }
    const r = explSearch(v, 12);
    let host = out;
    if (!host) {
      host = document.createElement('div');
      host.className = 'expl-out'; host.id = 'explOut';
      form.insertAdjacentElement('afterend', host);
    }
    host.innerHTML = `<div class="expl-h"><span class="kicker">${r.length} kết quả</span></div>` +
      (r.length ? r.map(mkRow).join('') :
        `<div class="expl-none"><b>Không thấy</b><p>Thử từ khoá ngắn hơn.</p></div>`);
  };
  input.onkeydown = e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const rows = $$('[data-expl-row]', $('#explOut') || document);
      if (!rows.length) return;
      e.preventDefault();
      const cur = rows.findIndex(r => r.classList.contains('on'));
      const next = e.key === 'ArrowDown' ? Math.min(rows.length - 1, cur + 1) : Math.max(0, cur - 1 || 0);
      rows.forEach(r => r.classList.remove('on'));
      rows[next < 0 ? 0 : next].classList.add('on');
      rows[next < 0 ? 0 : next].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      const on = $('[data-expl-row].on') || $('[data-expl-row]');
      if (on) { e.preventDefault(); go(on.getAttribute('href')); }
    } else if (e.key === 'Escape') {
      input.value = ''; const out = $('#explOut'); if (out) out.remove();
    }
  };
  const clr = $('[data-expl-clear]');
  if (clr) clr.onclick = e => { e.preventDefault(); state.explore = { recent: [] }; save(); renderDiscover(''); };
  if (q) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
  if (typeof syncScope === 'function') syncScope();
}

/* ---------------- popup "Khám phá" ở thanh trên ----------------
   Cùng bảng dữ liệu, nên không bao giờ lệch với trang. Có: nhóm, mũi tên,
   Enter, Esc, và khoá tiêu điểm trong hộp (Tab không lạc ra sau trang). */
function explMenuBody() {
  const head = `<div class="tm-head">
    <a class="tm-all" href="#/discover"><b>Mở trang Khám phá</b><span>Tìm và mở mọi thứ trong một chỗ</span></a>
  </div>`;
  /* `spread` marks the first few items of each group so the two-column popup
     does not become an unbroken 36-row ladder on a wide screen. */
  return head + EXPLORE_GROUPS.map(g => `<div class="tm-grp${g.spread ? ' tm-2' : ''}">
    <span class="tm-lbl">${explGroupName(g)}</span>
    ${g.items.map(it => `<a href="${it.href}" data-nav="${it.href}" role="menuitem">${esc(explName(it))}</a>`).join('')}
  </div>`).join('');
}
