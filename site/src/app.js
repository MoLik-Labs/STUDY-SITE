// Giao diện: lịch tuần (trang chủ), trang môn học có sẵn, trang môn tự tạo (#/c/<id>).
// Toàn bộ DOM được dựng bằng h() với textContent, nên dữ liệu người dùng không bao giờ được hiểu là HTML.
import { COURSES, COURSE_BY_SLUG } from './courses.js';
import * as L from './logic.js';
import { backupForSync, clearStorage, getBase, getOwner, loadState, saveState, setBase, setOwner } from './store.js';
import { decideSync } from './cloud.js';
import { createTimer } from './timer.js';
import { THEMES, applyTheme, readTheme, resolveTheme, saveTheme } from './theme.js';

const WEEKDAYS = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ nhật'];
const COLOR_NAMES = {
  green: 'Xanh lá', ochre: 'Vàng đất', blue: 'Xanh dương', rust: 'Đỏ gạch', plum: 'Tím', slate: 'Xám xanh',
};
const CUSTOM_HASH = /^#\/c\/([A-Za-z0-9_-]{1,80})$/;
const REVIEW_HASH = '#/on-tap';

function fmtDay(date) {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// Khối trang chủ: thứ tự và cỡ (wide = cả hàng, half = nửa hàng trên màn hình rộng).
const HOME_BLOCKS = {
  today: { label: 'Hôm nay', size: 'half' },
  timer: { label: 'Hẹn giờ', size: 'half' },
  review: { label: 'Ôn tập', size: 'wide' },
  exams: { label: 'Kỳ thi', size: 'half' },
  progress: { label: 'Tiến độ 7 ngày', size: 'half' },
  week: { label: 'Lịch tuần', size: 'wide' },
  courses: { label: 'Môn của tôi', size: 'wide' },
};
const HOME_KEY = 'sf.home.v1';
const HOME_DEFAULT = Object.keys(HOME_BLOCKS);

function homeLayout(storage) {
  let order = HOME_DEFAULT.slice();
  try {
    const raw = storage ? JSON.parse(storage.getItem(HOME_KEY) || 'null') : null;
    // Giữ thứ tự người dùng đã chọn; khối mới thêm sau thì nối vào cuối (không reset bố cục).
    if (Array.isArray(raw)) {
      const known = [...new Set(raw.filter(id => HOME_DEFAULT.includes(id)))];
      order = [...known, ...HOME_DEFAULT.filter(id => !known.includes(id))];
    }
  } catch { /* bố cục hỏng: dùng mặc định */ }
  const put = next => {
    try { storage?.setItem(HOME_KEY, JSON.stringify(next)); } catch { /* không lưu được thì vẫn chạy trong phiên này */ }
  };
  return {
    get order() { return order; },
    save(next) { order = next.slice(); put(order); },
    reset() { order = HOME_DEFAULT.slice(); put(order); },
  };
}

export function mountApp(root, { storage, page, win = globalThis, now = () => new Date(), cloud = null, notice = null }) {
  const doc = root.ownerDocument;

  function h(tag, props, ...kids) {
    const node = doc.createElement(tag);
    for (const [key, value] of Object.entries(props || {})) {
      if (value === undefined || value === null || value === false) continue;
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
      else node.setAttribute(key, value === true ? '' : String(value));
    }
    for (const kid of kids.flat()) {
      if (kid === null || kid === undefined || kid === false) continue;
      node.append(kid instanceof win.Node ? kid : doc.createTextNode(String(kid)));
    }
    return node;
  }

  function bar(percent, label) {
    const fill = h('span', { class: 'bar-fill' });
    fill.style.width = `${percent}%`;
    return h('div', { class: 'bar', role: 'progressbar', 'aria-label': label, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': percent }, fill);
  }

  const loaded = loadState(storage);
  const timer = createTimer({ h, storage, win });
  let state = loaded.state;
  let saveOk = loaded.available;
  let anchor = now();
  let armedDelete = null;
  let authMode = 'signin'; // 'signin' | 'signup' — form email + mật khẩu
  let accountMsg = notice; // { ok, text } từ lần đăng nhập vừa quay lại hoặc thao tác gần nhất
  let syncInfo = { status: 'idle', at: null, error: '' };
  let uploadTimer = 0;
  let profile = null;      // { displayName, className } khi đã tải
  let profileFor = null;   // uid của hồ sơ đã tải, để không tải lại
  let firstPaint = true;   // khối trang chủ chỉ xuất hiện (animation) ở lần dựng đầu tiên
  let arranging = false;   // chế độ sắp xếp bố cục trang chủ
  const home = homeLayout(storage);

  function persist(next) {
    state = { ...next, updated: new Date().toISOString() };
    saveOk = saveState(storage, state);
    if (cloud && cloud.signedIn()) scheduleUpload();
  }
  function commit(next) {
    persist(next);
    render();
  }

  function courseName(key) {
    if (!key) return '';
    if (key.startsWith('c:')) {
      const c = L.findCustom(state, key.slice(2));
      return c ? c.name : '';
    }
    return COURSE_BY_SLUG[key] ? COURSE_BY_SLUG[key].name : '';
  }

  function courseOptions() {
    return [
      h('option', { value: '' }, 'Không gắn môn'),
      ...COURSES.map(c => h('option', { value: c.slug }, c.name)),
      ...state.custom.map(c => h('option', { value: 'c:' + c.id }, c.name + ' (tự tạo)')),
    ];
  }

  function colorSelect(id) {
    return h('select', { id, name: 'color', 'aria-label': 'Màu môn' },
      L.COLORS.map(c => h('option', { value: c }, COLOR_NAMES[c])));
  }

  function alertBox() {
    const parts = [];
    if (!loaded.available) parts.push('Trình duyệt đang chặn bộ nhớ. Dữ liệu chỉ tồn tại trong phiên này.');
    else if (!saveOk) parts.push('Không lưu được thay đổi. Hãy kiểm tra dung lượng trình duyệt hoặc chế độ riêng tư.');
    if (loaded.corrupt) parts.push('Dữ liệu đã lưu bị hỏng, bản gốc được giữ ở khoá sf.plan.v2.bak.');
    return parts.length ? h('div', { class: 'alert', role: 'alert' }, ...parts.map(p => h('p', {}, p))) : null;
  }

  // ---------- Lịch tuần ----------

  function taskRow(t) {
    const box = h('input', { type: 'checkbox', onchange: () => commit(L.toggleTask(state, t.id)) });
    box.checked = t.done;
    const tag = courseName(t.course);
    return h('li', { class: 'task' + (t.done ? ' is-done' : '') },
      h('label', { class: 'task-main' }, box, h('span', { class: 'task-title' }, t.title)),
      tag ? h('span', { class: 'tag' }, tag) : null,
      h('button', { type: 'button', class: 'ghost', 'aria-label': 'Xoá việc: ' + t.title, onclick: () => commit(L.removeTask(state, t.id)) }, 'Xoá'));
  }

  function taskForm() {
    const title = h('input', { type: 'text', name: 'title', required: true, maxlength: 140, placeholder: 'Ví dụ: đọc 2 trang Econometrics chương 1', 'aria-label': 'Việc cần làm' });
    const course = h('select', { name: 'course', 'aria-label': 'Môn' }, courseOptions());
    const date = h('input', { type: 'date', name: 'date', required: true, 'aria-label': 'Ngày', value: L.isoOf(now()) });
    return h('form', {
      class: 'add-task',
      onsubmit: e => {
        e.preventDefault();
        const next = L.addTask(state, { title: title.value, course: course.value, date: date.value });
        if (next === state) { title.focus(); return; }
        commit(next);
      },
    }, title, course, date, h('button', { type: 'submit' }, 'Thêm việc'));
  }

  function weekView() {
    const days = L.weekDays(anchor);
    const todayIso = L.isoOf(now());
    const columns = days.map((d, i) => {
      const iso = L.isoOf(d);
      const list = L.tasksOn(state, iso);
      return h('section', { class: 'day' + (iso === todayIso ? ' is-today' : ''), 'aria-labelledby': 'day-' + i },
        h('h3', { id: 'day-' + i }, WEEKDAYS[i], h('span', { class: 'date' }, fmtDay(d))),
        list.length ? h('ul', { class: 'tasks' }, list.map(taskRow)) : h('p', { class: 'empty' }, 'Chưa có việc'));
    });
    return h('section', { class: 'week', 'aria-label': 'Lịch tuần' },
      h('header', { class: 'week-head' },
        h('h1', {}, 'Lịch tuần'),
        h('p', { class: 'range' }, `${fmtDay(days[0])} – ${fmtDay(days[6])}`)),
      h('div', { class: 'week-nav' },
        h('button', { type: 'button', onclick: () => { anchor = L.addDays(anchor, -7); render(); } }, '← Tuần trước'),
        h('button', { type: 'button', onclick: () => { anchor = now(); render(); } }, 'Tuần này'),
        h('button', { type: 'button', onclick: () => { anchor = L.addDays(anchor, 7); render(); } }, 'Tuần sau →')),
      taskForm(),
      h('div', { class: 'days' }, columns));
  }

  // ---------- Cột bên: môn của tôi ----------

  function sidebar() {
    const builtIn = COURSES.map(c => {
      const pr = L.progressOf(c.resources.map(r => r.id), state.progress[c.slug]);
      return h('li', { class: 'course-card', 'data-color': c.color },
        h('a', { href: '/' + c.slug + '/' }, h('span', { class: 'course-name' }, c.name)),
        bar(pr.percent, 'Tiến độ ' + c.name),
        h('span', { class: 'meta' }, `${pr.done}/${pr.total} tài liệu`));
    });
    const custom = state.custom.map(c => {
      const pr = L.progressOf(c.items.map(i => i.id), Object.fromEntries(c.items.filter(i => i.done).map(i => [i.id, true])));
      return h('li', { class: 'course-card', 'data-color': c.color },
        h('a', { href: '#/c/' + c.id }, h('span', { class: 'course-name' }, c.name)),
        bar(pr.percent, 'Tiến độ ' + c.name),
        h('span', { class: 'meta' }, `${pr.done}/${pr.total} mục`));
    });
    const create = h('form', {
      class: 'stack-form',
      onsubmit: e => {
        e.preventDefault();
        const name = e.currentTarget.elements.name;
        const color = e.currentTarget.elements.color;
        const next = L.addCustom(state, { name: name.value, color: color.value });
        if (next === state) { name.focus(); return; }
        commit(next);
      },
    },
      h('h3', {}, 'Tạo môn mới'),
      h('label', {}, 'Tên môn', h('input', { type: 'text', name: 'name', required: true, maxlength: 80 })),
      h('label', {}, 'Màu', colorSelect(null)),
      h('button', { type: 'submit' }, 'Tạo môn'));
    return h('aside', { class: 'side', 'aria-label': 'Môn học' },
      h('h2', {}, 'Môn của tôi'),
      h('ul', { class: 'course-list' }, builtIn),
      h('div', { class: 'course-card physics' },
        h('a', { href: '/physic/' }, h('span', { class: 'course-name' }, 'Vật lí')),
        h('span', { class: 'meta' }, 'Phần riêng')),
      custom.length ? h('h2', { class: 'sub' }, 'Môn tự tạo') : null,
      custom.length ? h('ul', { class: 'course-list' }, custom) : null,
      create);
  }

  // Gợi ý học hôm nay: việc đến hạn trước, rồi môn có tiến độ thấp nhất.
  function todayPanel() {
    const g = L.suggestToday(state, COURSES, L.isoOf(now()));
    const facts = [];
    if (g.overdue.length) facts.push(h('li', { class: 'warn' }, `${g.overdue.length} việc quá hạn`));
    if (g.dueToday.length) facts.push(h('li', {}, `${g.dueToday.length} việc đến hạn hôm nay`));
    const focus = g.focus
      ? h('a', { class: 'focus', href: g.focus.href },
        h('span', { class: 'focus-t' }, g.focus.next || g.focus.name),
        h('span', { class: 'meta' }, `Nên học tiếp · ${g.focus.name} · ${g.focus.percent}%`))
      : h('p', { class: 'focus-done' }, 'Đã học hết các tài liệu có sẵn. Thêm môn hoặc mục mới để tiếp tục.');
    return h('section', { class: 'today', 'aria-label': 'Hôm nay' },
      h('h2', {}, 'Hôm nay'),
      facts.length ? h('ul', { class: 'today-list' }, facts) : h('p', { class: 'meta' }, 'Không có việc đến hạn.'),
      focus);
  }

  // ---------- Bố cục trang chủ: người dùng tự sắp xếp các khối (lưu trên máy) ----------
  function moveBlock(id, dir) {
    const order = home.order.slice();
    const i = order.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    home.save(order);
    render();
    // Giữ tiêu điểm trên đúng nút vừa bấm, dù khối đã được dựng lại.
    const pick = root.querySelector(`[data-block="${id}"] .move button:${dir < 0 ? 'first' : 'last'}-child`);
    const any = root.querySelector(`[data-block="${id}"] .move button:not([disabled])`);
    (pick && !pick.disabled ? pick : any)?.focus();
  }

  function homeBlock(id, body, idx) {
    const info = HOME_BLOCKS[id];
    const last = home.order.length - 1;
    const moves = arranging ? h('div', { class: 'move' },
      h('button', { type: 'button', class: 'ghost sm', disabled: idx === 0, 'aria-label': `Đưa khối ${info.label} lên trên`, onclick: () => moveBlock(id, -1) }, '↑ Lên'),
      h('button', { type: 'button', class: 'ghost sm', disabled: idx === last, 'aria-label': `Đưa khối ${info.label} xuống dưới`, onclick: () => moveBlock(id, 1) }, '↓ Xuống')) : null;
    return h('div', { class: 'block', 'data-block': id, 'data-size': info.size, 'data-arranging': arranging ? 'true' : null }, moves, body);
  }

  function plannerView() {
    const parts = { today: todayPanel(), timer: timer.element(), review: reviewBlock(), exams: examsBlock(), progress: progressBlock(), week: weekView(), courses: sidebar() };
    return h('div', { class: 'planner' }, alertBox(),
      h('div', { class: 'home-tools' },
        h('p', { class: 'meta' }, arranging ? 'Dùng nút Lên và Xuống để đổi thứ tự các khối.' : null),
        h('div', { class: 'home-actions' },
          arranging ? h('button', { type: 'button', class: 'ghost sm', onclick: () => { home.reset(); render(); } }, 'Đặt lại bố cục') : null,
          h('button', { type: 'button', class: 'ghost sm', 'aria-pressed': arranging ? 'true' : 'false',
            onclick: () => { arranging = !arranging; render(); } }, arranging ? 'Xong' : 'Sắp xếp trang'))),
      h('div', { class: 'home' }, home.order.map((id, i) => homeBlock(id, parts[id], i))));
  }

  // ---------- Ôn tập thẻ ghi nhớ ----------
  let review = null; // { queue: [id], pos, shown } của phiên đang chạy

  function examsBlock() {
    const todayIso = L.isoOf(now());
    const list = L.upcomingExams(state, todayIso);
    const shown = list.slice(0, 3);
    const title = h('input', { type: 'text', name: 'title', required: true, maxlength: 120, placeholder: 'Ví dụ: Giữa kỳ Kinh tế lượng', 'aria-label': 'Tên kỳ thi' });
    const course = h('select', { name: 'course', 'aria-label': 'Môn của kỳ thi' }, courseOptions());
    const date = h('input', { type: 'date', name: 'date', required: true, 'aria-label': 'Ngày thi', min: todayIso });
    const form = h('form', {
      class: 'add-exam',
      onsubmit: e => {
        e.preventDefault();
        const next = L.addExam(state, { title: title.value, course: course.value, date: date.value });
        if (next === state) { title.focus(); return; }
        commit(next);
      },
    }, title, course, date, h('button', { type: 'submit' }, 'Thêm kỳ thi'));
    return h('section', { class: 'today', 'aria-label': 'Kỳ thi' },
      h('h2', {}, 'Kỳ thi'),
      shown.length
        ? h('ul', { class: 'exam-list' }, shown.map(e => h('li', { class: 'exam' },
            h('span', { class: 'exam-days' }, e.daysLeft === 0 ? 'Hôm nay' : `Còn ${e.daysLeft} ngày`),
            h('span', { class: 'exam-name' }, e.title, e.course ? ` · ${courseName(e.course)}` : ''),
            h('button', { type: 'button', class: 'ghost sm', 'aria-label': `Xoá kỳ thi ${e.title}`, onclick: () => commit(L.removeExam(state, e.id)) }, 'Xoá'))))
        : h('p', { class: 'meta' }, 'Chưa có kỳ thi nào. Thêm để theo dõi ngày còn lại.'),
      h('details', {}, h('summary', {}, 'Thêm kỳ thi'), form));
  }

  function progressBlock() {
    const p = L.weeklyProgress(state, L.isoOf(now()));
    const names = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return h('section', { class: 'today', 'aria-label': 'Tiến độ 7 ngày' },
      h('h2', {}, 'Tiến độ 7 ngày'),
      p.total
        ? h('p', { class: 'meta' }, `Đã xong ${p.done}/${p.total} việc (${p.rate}%).`)
        : h('p', { class: 'meta' }, 'Chưa có việc nào trong 7 ngày gần đây.'),
      h('progress', { max: 100, value: p.rate, 'aria-label': `Hoàn thành ${p.rate}% trong 7 ngày` }),
      h('ol', { class: 'week-bars', 'aria-label': 'Việc đã xong theo ngày' }, p.days.map(d => {
        const dow = names[L.parseIso(d.date).getDay()];
        return h('li', { class: 'day-bar' + (d.total === 0 ? ' is-empty' : '') },
          h('span', { class: 'bar-day' }, dow),
          h('span', { class: 'bar-count' }, d.total ? `${d.done}/${d.total}` : '–'));
      })));
  }

  function reviewBlock() {
    const s = L.cardStats(state, L.isoOf(now()));
    const text = s.due ? `${s.due} thẻ cần ôn hôm nay.`
      : s.total ? 'Hôm nay không có thẻ nào đến hạn.'
        : 'Chưa có thẻ nào. Thêm thẻ để bắt đầu ôn.';
    return h('section', { class: 'today', 'aria-label': 'Ôn tập' },
      h('h2', {}, 'Ôn tập'),
      h('p', { class: 'meta' }, text),
      h('div', {}, h('a', { class: 'btn sm', href: REVIEW_HASH }, s.due ? 'Ôn ngay' : 'Mở ôn tập')));
  }

  function reviewView() {
    const today = L.isoOf(now());
    const stats = L.cardStats(state, today);
    if (!review) review = { queue: L.dueCards(state, today).map(c => c.id), pos: 0, shown: false, done: 0 };
    const byId = new Map(state.cards.map(c => [c.id, c]));
    // Bỏ qua thẻ đã bị xoá giữa phiên.
    while (review.pos < review.queue.length && !byId.has(review.queue[review.pos])) review.pos++;
    const current = review.pos < review.queue.length ? byId.get(review.queue[review.pos]) : null;

    let session;
    if (current) {
      const total = review.queue.length;
      session = h('section', { class: 'card-session', 'aria-label': 'Phiên ôn' },
        h('p', { class: 'meta' }, `Thẻ ${review.done + 1} trên ${total} hôm nay`),
        h('p', { class: 'card-front' }, current.front),
        review.shown
          ? h('div', { class: 'card-answer' },
            h('p', { class: 'card-back' }, current.back || 'Thẻ này không có đáp án.'),
            h('div', { class: 'action-row' },
              h('button', { type: 'button', class: 'danger', onclick: () => grade(current.id, false, today) }, 'Chưa nhớ'),
              h('button', { type: 'button', onclick: () => grade(current.id, true, today) }, 'Nhớ rồi')))
          : h('div', { class: 'action-row' },
            h('button', { type: 'button', onclick: () => { review.shown = true; render(); } }, 'Hiện đáp án')));
    } else if (review.done) {
      session = h('p', { class: 'msg ok', role: 'status' }, `Xong ${review.done} thẻ hôm nay. Thẻ quên sẽ quay lại ngày mai.`);
    } else {
      session = h('p', { class: 'meta' }, stats.total ? 'Hôm nay không có thẻ nào đến hạn.' : 'Chưa có thẻ nào. Thêm thẻ bên dưới để bắt đầu.');
    }

    return h('div', { class: 'review' },
      h('p', { class: 'crumb' }, h('a', { href: '/' }, '← Lịch tuần')),
      h('h1', {}, 'Ôn tập'),
      h('p', { class: 'lead' }, 'Thẻ quay lại theo lịch: nhớ thì ôn lâu hơn, quên thì ôn lại ngày mai.'),
      h('p', { class: 'meta' }, `${stats.due} cần ôn hôm nay · ${stats.total} thẻ · ${stats.learned} đã thuộc`),
      session,
      h('h2', {}, 'Thêm thẻ'),
      cardForm(),
      h('h2', {}, 'Tất cả thẻ'),
      cardList());
  }

  function grade(id, remembered, today) {
    review.pos++;
    review.shown = false;
    review.done++;
    commit(L.reviewCard(state, id, remembered, today));
  }

  function cardForm() {
    const front = h('textarea', { name: 'front', required: true, maxlength: 300, rows: 2, 'aria-label': 'Mặt trước', placeholder: 'Mặt trước: câu hỏi hoặc từ cần nhớ' });
    const back = h('textarea', { name: 'back', maxlength: 800, rows: 2, 'aria-label': 'Mặt sau', placeholder: 'Mặt sau: đáp án (không bắt buộc)' });
    const course = h('select', { name: 'course', 'aria-label': 'Môn' }, courseOptions());
    return h('form', {
      class: 'stack-form card-form',
      onsubmit: e => {
        e.preventDefault();
        const next = L.addCard(state, { front: front.value, back: back.value, course: course.value }, L.isoOf(now()));
        if (next === state) { front.focus(); return; }
        // Thẻ mới luôn đến hạn hôm nay: đưa vào cuối phiên đang chạy (giữ tiến độ), không làm lại phiên.
        if (review) review.queue.push(next.cards[next.cards.length - 1].id);
        commit(next);
      },
    }, front, back, course, h('button', { type: 'submit' }, 'Thêm thẻ'));
  }

  function cardList() {
    const cards = state.cards.slice().sort((a, b) => a.due.localeCompare(b.due));
    if (!cards.length) return h('p', { class: 'meta' }, 'Chưa có thẻ nào.');
    return h('ul', { class: 'tasks card-list' }, cards.map(c => h('li', { class: 'card-row' },
      h('span', { class: 'card-row-text' }, c.front),
      h('span', { class: 'tag' }, `Ngăn ${c.box + 1}/5 · ôn ${fmtDay(L.parseIso(c.due))}`),
      h('button', { type: 'button', class: 'ghost sm', 'aria-label': `Xoá thẻ: ${c.front}`, onclick: () => commit(L.removeCard(state, c.id)) }, 'Xoá'))));
  }

  // ---------- Trang môn có sẵn ----------

  function courseView(course) {
    const done = state.progress[course.slug] || {};
    const pr = L.progressOf(course.resources.map(r => r.id), done);
    const kinds = [];
    for (const r of course.resources) {
      const group = kinds.find(g => g.kind === r.kind);
      if (group) group.items.push(r); else kinds.push({ kind: r.kind, items: [r] });
    }
    const resourceRow = r => {
      const box = h('input', { type: 'checkbox', onchange: e => commit(L.setResourceDone(state, course.slug, r.id, e.currentTarget.checked)) });
      box.checked = done[r.id] === true;
      return h('li', { class: 'res' + (box.checked ? ' is-done' : '') },
        h('label', { class: 'res-main' }, box,
          h('span', {},
            h('a', { href: r.url, target: '_blank', rel: 'noopener noreferrer' }, r.title),
            h('span', { class: 'res-note' }, r.note))),
        h('span', { class: 'res-meta' },
          h('span', {}, r.cost),
          h('span', { class: r.verified ? 'badge ok' : 'badge' }, r.verified ? 'Đã mở trang kiểm tra' : 'Chưa mở trang kiểm tra')));
    };
    const noteArea = h('textarea', {
      id: 'course-note', rows: 6, maxlength: 5000, 'aria-label': 'Ghi chú cho môn ' + course.name,
      placeholder: 'Ghi chú của bạn: tiến độ, câu hỏi, từ mới...',
      oninput: e => { persist(L.setNote(state, course.slug, e.currentTarget.value)); },
    });
    noteArea.value = state.notes[course.slug] || '';
    return h('article', { class: 'course', 'data-color': course.color },
      h('p', { class: 'crumb' }, h('a', { href: '/' }, '← Lịch tuần')),
      h('header', { class: 'course-head' }, h('h1', {}, course.name), h('p', { class: 'lead' }, course.summary)),
      h('div', { class: 'course-progress' }, bar(pr.percent, 'Tiến độ môn'), h('span', { class: 'meta' }, `${pr.done}/${pr.total} tài liệu đã học`)),
      alertBox(),
      h('div', { class: 'kinds' }, kinds.map(g => h('section', { class: 'kind' }, h('h2', {}, g.kind), h('ul', { class: 'res-list' }, g.items.map(resourceRow))))),
      h('section', { class: 'notes' }, h('h2', {}, 'Ghi chú'), noteArea),
      h('p', { class: 'fine' }, 'Tài liệu thuộc về tác giả và nhà xuất bản. Trang này chỉ liệt kê và liên kết tới nguồn gốc.'));
  }

  // ---------- Trang môn tự tạo ----------

  function customView(id) {
    const c = L.findCustom(state, id);
    if (!c) {
      return h('section', { class: 'empty-page' }, h('h1', {}, 'Không tìm thấy môn này'), h('p', {}, h('a', { href: '/' }, '← Về lịch tuần')));
    }
    const doneMap = Object.fromEntries(c.items.filter(i => i.done).map(i => [i.id, true]));
    const pr = L.progressOf(c.items.map(i => i.id), doneMap);
    const addItemForm = h('form', {
      class: 'add-task',
      onsubmit: e => {
        e.preventDefault();
        const title = e.currentTarget.elements.title;
        const url = e.currentTarget.elements.url;
        const next = L.addItem(state, c.id, { title: title.value, url: url.value });
        if (next === state) { title.focus(); return; }
        commit(next);
      },
    },
      h('input', { type: 'text', name: 'title', required: true, maxlength: 160, placeholder: 'Tên tài liệu hoặc bài học', 'aria-label': 'Tên tài liệu' }),
      h('input', { type: 'url', name: 'url', placeholder: 'Liên kết (không bắt buộc)', 'aria-label': 'Liên kết' }),
      h('button', { type: 'submit' }, 'Thêm mục'));
    const itemRow = i => {
      const box = h('input', { type: 'checkbox', onchange: () => commit(L.toggleItem(state, c.id, i.id)) });
      box.checked = i.done;
      return h('li', { class: 'res' + (i.done ? ' is-done' : '') },
        h('label', { class: 'res-main' }, box, i.url
          ? h('a', { href: i.url, target: '_blank', rel: 'noopener noreferrer' }, i.title)
          : h('span', {}, i.title)),
        h('button', { type: 'button', class: 'ghost', 'aria-label': 'Xoá mục: ' + i.title, onclick: () => commit(L.removeItem(state, c.id, i.id)) }, 'Xoá'));
    };
    const deleteBtn = h('button', {
      type: 'button', class: 'danger',
      onclick: () => {
        if (armedDelete !== c.id) { armedDelete = c.id; render(); return; }
        armedDelete = null;
        commit(L.removeCustom(state, c.id));
        win.location.hash = '#/';
      },
    }, armedDelete === c.id ? 'Bấm lần nữa để xoá môn này' : 'Xoá môn');
    return h('article', { class: 'course', 'data-color': c.color },
      h('p', { class: 'crumb' }, h('a', { href: '/' }, '← Lịch tuần')),
      h('header', { class: 'course-head' }, h('h1', {}, c.name)),
      h('div', { class: 'course-progress' }, bar(pr.percent, 'Tiến độ môn'), h('span', { class: 'meta' }, `${pr.done}/${pr.total} mục đã xong`)),
      alertBox(),
      addItemForm,
      c.items.length ? h('ul', { class: 'res-list' }, c.items.map(itemRow)) : h('p', { class: 'empty' }, 'Chưa có mục nào. Thêm tài liệu hoặc bài học ở trên.'),
      h('div', { class: 'danger-zone' }, deleteBtn));
  }

  function physicsView() {
    return h('section', { class: 'empty-page' },
      h('h1', {}, 'Vật lí'),
      h('p', {}, 'Phần Vật lí đang được tách sang thư mục riêng này. Nội dung sẽ có ở đây khi chuyển xong.'),
      h('p', {}, h('a', { href: '/' }, '← Lịch tuần')));
  }

  function notFound() {
    return h('section', { class: 'empty-page' }, h('h1', {}, 'Không tìm thấy trang'), h('p', {}, h('a', { href: '/' }, '← Lịch tuần')));
  }

  // ---------- Tài khoản và quyền riêng tư ----------

  function syncLine() {
    if (!cloud || !cloud.signedIn()) return '';
    if (syncInfo.status === 'busy') return 'Đang đồng bộ…';
    if (syncInfo.status === 'error') return 'Chưa đồng bộ được: ' + syncInfo.error + ' Dữ liệu vẫn được giữ trên máy.';
    if (syncInfo.status === 'ok' && syncInfo.at) {
      const t = syncInfo.at;
      return 'Đã đồng bộ lúc ' + String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0') + '.';
    }
    return 'Sẽ đồng bộ khi có thay đổi.';
  }

  function msgBox() {
    if (!accountMsg) return null;
    return h('p', { class: accountMsg.ok ? 'msg ok' : 'msg err', role: 'status' }, accountMsg.text);
  }

  function guestForm() {
    // Mở liên kết trên máy khác (không còn email đã nhập): hỏi lại email để xác nhận.
    if (cloud.needsEmail()) {
      const confirm = h('input', { type: 'email', name: 'email', required: true, autocomplete: 'email', placeholder: 'ban@example.com', 'aria-label': 'Email đã dùng để nhận liên kết' });
      return h('div', { class: 'auth-card' },
        h('h2', {}, 'Xác nhận email'),
        h('p', { class: 'fine' }, 'Liên kết này được mở trên trình duyệt khác. Nhập đúng email đã nhận liên kết để hoàn tất đăng nhập.'),
        h('form', {
          class: 'stack-form',
          onsubmit: async e => {
            e.preventDefault();
            accountMsg = await cloud.finishEmailLink(confirm.value.trim());
            render();
          },
        },
          h('label', {}, 'Email', confirm),
          h('button', { type: 'submit' }, 'Hoàn tất đăng nhập')));
    }
    // Email + mật khẩu là cách chính. Email link (5 lượt/ngày toàn dự án trên gói miễn phí) và Google
    // là phương án phụ.
    const signup = authMode === 'signup';
    const email = h('input', { type: 'email', name: 'email', required: true, autocomplete: 'email', placeholder: 'ban@example.com', 'aria-label': 'Email' });
    const pw = h('input', {
      type: 'password', name: 'password', required: true, ...(signup ? { minlength: 8 } : {}),
      autocomplete: signup ? 'new-password' : 'current-password',
      placeholder: signup ? 'Ít nhất 8 ký tự' : 'Mật khẩu', 'aria-label': 'Mật khẩu',
    });
    const tab = (mode, label) => h('button', {
      type: 'button', class: mode === authMode ? 'chip is-on' : 'chip', 'aria-pressed': mode === authMode ? 'true' : 'false',
      onclick: () => { authMode = mode; accountMsg = null; render(); },
    }, label);
    const busy = (btn, text) => { btn.disabled = true; btn.textContent = text; };
    return h('div', { class: 'auth-card' },
      h('h2', {}, 'Đăng nhập để đồng bộ'),
      h('p', { class: 'fine' }, 'Đăng nhập để dùng kế hoạch trên nhiều thiết bị. Không đăng nhập vẫn dùng đầy đủ, dữ liệu chỉ nằm trên máy này.'),
      h('div', { class: 'auth-seg', role: 'group', 'aria-label': 'Cách đăng nhập' }, tab('signin', 'Đăng nhập'), tab('signup', 'Tạo tài khoản')),
      h('form', {
        class: 'stack-form',
        onsubmit: async e => {
          e.preventDefault();
          const btn = e.submitter || e.target.querySelector('button[type=submit]');
          busy(btn, signup ? 'Đang tạo…' : 'Đang đăng nhập…');
          try {
            accountMsg = signup
              ? await cloud.signUpWithPassword(email.value, pw.value)
              : await cloud.signInWithPassword(email.value, pw.value);
          } catch (err) {
            accountMsg = { ok: false, text: err.message };
          }
          render();
        },
      },
        h('label', {}, 'Email', email),
        h('label', {}, 'Mật khẩu', pw),
        h('button', { type: 'submit' }, signup ? 'Tạo tài khoản' : 'Đăng nhập')),
      h('button', {
        type: 'button', class: 'ghost wide',
        onclick: async () => {
          const value = email.value.trim();
          if (!value) { accountMsg = { ok: false, text: 'Nhập email ở trên, rồi bấm lại để nhận thư đặt lại mật khẩu.' }; render(); return; }
          try {
            accountMsg = await cloud.sendPasswordReset(value);
          } catch (err) {
            accountMsg = { ok: false, text: err.message };
          }
          render();
        },
      }, 'Quên mật khẩu?'),
      h('div', { class: 'or' }, 'hoặc'),
      h('details', { class: 'fine' },
        h('summary', {}, 'Đăng nhập không cần mật khẩu'),
        h('p', { class: 'fine' }, 'Gửi liên kết tới email. Gói miễn phí chỉ cho phép một số lượt gửi mỗi ngày trên toàn dự án, nên nếu không nhận được liên kết, hãy dùng mật khẩu hoặc thử lại ngày mai.'),
        h('button', {
          type: 'button', class: 'ghost wide',
          onclick: async () => {
            const value = email.value.trim();
            if (!value) { accountMsg = { ok: false, text: 'Nhập email ở trên trước.' }; render(); return; }
            accountMsg = { ok: true, text: 'Đang gửi liên kết…' };
            render();
            try {
              await cloud.sendEmailLink(value);
              accountMsg = { ok: true, text: 'Đã gửi liên kết đăng nhập tới ' + value + '. Mở liên kết trong email trên cùng trình duyệt này.' };
            } catch (err) {
              accountMsg = { ok: false, text: err.message };
            }
            render();
          },
        }, 'Gửi liên kết tới email')),
      h('div', { class: 'or' }, 'hoặc'),
      h('button', {
        type: 'button', class: 'ghost wide',
        onclick: async () => {
          try { await cloud.signInWithGoogle(); }
          catch (err) { accountMsg = { ok: false, text: err.message }; render(); }
        },
      }, 'Tiếp tục với Google'));
  }

  function profileForm() {
    const name = h('input', { type: 'text', name: 'displayName', maxlength: 60, value: profile ? profile.displayName || '' : '', 'aria-label': 'Tên hiển thị' });
    const cls = h('input', { type: 'text', name: 'className', maxlength: 40, value: profile ? profile.className || '' : '', 'aria-label': 'Lớp', placeholder: 'Ví dụ: 11A2' });
    return h('form', {
      class: 'stack-form profile-card',
      onsubmit: async e => {
        e.preventDefault();
        try {
          await cloud.saveProfile(cloud.userId(), { displayName: name.value.trim(), className: cls.value.trim() });
          profile = { displayName: name.value.trim(), className: cls.value.trim() };
          accountMsg = { ok: true, text: 'Đã lưu hồ sơ.' };
        } catch (err) {
          accountMsg = { ok: false, text: err.message };
        }
        render();
      },
    },
      h('h3', {}, 'Hồ sơ'),
      h('label', {}, 'Tên hiển thị', name),
      h('label', {}, 'Lớp', cls),
      h('button', { type: 'submit' }, 'Lưu hồ sơ'));
  }

  function twoStep(id, label, armedLabel, run) {
    return h('button', {
      type: 'button', class: 'danger',
      onclick: async () => {
        if (armedDelete !== id) { armedDelete = id; render(); return; }
        armedDelete = null;
        try {
          await run();
        } catch (err) {
          accountMsg = { ok: false, text: err.message };
        }
        render();
      },
    }, armedDelete === id ? armedLabel : label);
  }

  // Chọn giao diện: danh sách nút chọn. Có hiệu lực ngay, lưu trên máy này, không đồng bộ.
  function themeSection() {
    const current = readTheme(storage);
    const prefersDark = () => !!(win.matchMedia && win.matchMedia('(prefers-color-scheme: dark)').matches);
    return h('section', { class: 'theme-pick', 'aria-labelledby': 'theme-title' },
      h('h2', { id: 'theme-title' }, 'Giao diện'),
      h('div', { class: 'theme-grid', role: 'radiogroup', 'aria-labelledby': 'theme-title' },
        THEMES.map(t => h('label', { class: t.id === current ? 'theme-opt is-on' : 'theme-opt' },
          h('input', {
            type: 'radio', name: 'theme', value: t.id, checked: t.id === current,
            onchange: () => {
              saveTheme(storage, t.id);
              applyTheme(win.document.documentElement, t.id, prefersDark());
              render();
            },
          }),
          h('span', { class: 'theme-name' }, t.label),
          h('span', { class: 'theme-desc' }, t.desc)))),
      h('p', { class: 'fine' }, `Đang dùng: ${THEMES.find(t => t.id === resolveTheme(current, prefersDark())).label}.`));
  }

  function accountView() {
    if (!cloud || !cloud.enabled) {
      return h('article', { class: 'account' },
        h('header', { class: 'course-head' }, h('h1', {}, 'Tài khoản')),
        h('p', { class: 'lead' }, 'Đám mây chưa được bật trên bản này. Bạn vẫn dùng đầy đủ ở chế độ khách, dữ liệu nằm trên máy này.'),
        h('p', { class: 'fine' }, 'Khi quản trị viên bật đám mây cho bản này, phần đăng nhập và đồng bộ sẽ hiện ở đây.'),
        themeSection());
    }
    if (!cloud.signedIn()) {
      return h('article', { class: 'account' },
        h('header', { class: 'course-head' }, h('h1', {}, 'Tài khoản')),
        msgBox(), guestForm(), themeSection());
    }
    return h('article', { class: 'account' },
      h('header', { class: 'course-head' }, h('h1', {}, 'Tài khoản'), h('p', { class: 'lead' }, cloud.email())),
      msgBox(),
      themeSection(),
      h('p', { class: 'sync', role: 'status' }, syncLine()),
      profileForm(),
      h('section', { class: 'acct-actions', 'aria-labelledby': 'acct-actions-title' },
        h('h2', { id: 'acct-actions-title' }, 'Dữ liệu và tài khoản'),
        h('div', { class: 'action-row' },
          h('button', {
            type: 'button', class: 'ghost',
            onclick: async () => {
              try { await cloud.signOut(); accountMsg = { ok: true, text: 'Đã đăng xuất. Dữ liệu trên máy này vẫn còn.' }; }
              catch (err) { accountMsg = { ok: false, text: err.message }; }
              profile = null; profileFor = null;
              render();
            },
          }, 'Đăng xuất'),
          twoStep('wipe', 'Xoá dữ liệu học', 'Bấm lần nữa để xoá', async () => {
            await wipeData();
            accountMsg = { ok: true, text: 'Đã xoá dữ liệu học trên máy và trên đám mây. Tài khoản vẫn còn.' };
          })),
        h('p', { class: 'fine' }, 'Xoá dữ liệu học giữ nguyên tài khoản. Xoá tài khoản thì xoá cả tài khoản và mọi dữ liệu liên quan.'),
        h('div', { class: 'action-row' },
          twoStep('account', 'Xoá tài khoản', 'Bấm lần nữa để xoá vĩnh viễn', async () => {
            await cloud.deleteAccount();
            clearTimeout(uploadTimer);
            clearStorage(storage);
            state = L.emptyState();
            saveOk = saveState(storage, state);
            profile = null; profileFor = null;
            accountMsg = { ok: true, text: 'Đã xoá tài khoản và dữ liệu. Bạn vẫn có thể dùng ứng dụng ở chế độ khách.' };
          }))));
  }

  function privacyView() {
    const item = (title, text) => h('section', { class: 'priv' }, h('h2', {}, title), h('p', {}, text));
    return h('article', { class: 'privacy' },
      h('header', { class: 'course-head' }, h('h1', {}, 'Quyền riêng tư'),
        h('p', { class: 'lead' }, 'Trang này nói rõ dữ liệu nào được lưu, lưu ở đâu, và cách xoá.')),
      item('Chế độ khách', 'Mọi thứ bạn nhập (việc cần làm, môn tự tạo, tiến độ, ghi chú) chỉ nằm trong trình duyệt trên máy này. Không gửi đi đâu.'),
      item('Khi đăng nhập', 'Chúng tôi lưu email để đăng nhập và gửi liên kết. Tên hiển thị và lớp là tuỳ chọn. Kế hoạch học được lưu thành một tài liệu trên Firebase Firestore. Quy tắc bảo mật chỉ cho tài khoản của bạn đọc và ghi dữ liệu đó.'),
      item('Đăng nhập bằng Google', 'Google xác thực bạn. Chúng tôi chỉ nhận email và tên hiển thị do Google cung cấp.'),
      item('Nhà cung cấp', 'Cloudflare phục vụ trang. Google Firebase lưu tài khoản và dữ liệu đã đồng bộ. Không có quảng cáo và không có theo dõi bên thứ ba.'),
      item('Xoá dữ liệu', 'Trong Tài khoản, "Xoá dữ liệu học" xoá trên máy và trên đám mây, giữ tài khoản. "Xoá tài khoản" xoá dữ liệu trên đám mây trước, rồi xoá tài khoản. Thao tác này cần bạn vừa đăng nhập (trong vòng vài phút).'),
      item('Đăng xuất', 'Đăng xuất không xoá dữ liệu trên máy. Dữ liệu trên đám mây vẫn được giữ cho lần đăng nhập sau. Nếu đăng nhập bằng tài khoản khác trên cùng máy, dữ liệu của tài khoản trước không được đẩy lên tài khoản mới; bản đó vẫn nằm trong bộ nhớ trình duyệt đến khi bạn xoá dữ liệu học.'));
  }

  function render() {
    const kind = page.split(':')[0];
    const slug = page.split(':')[1];
    timer.dispose(); // bộ đếm chỉ chạy khi đang ở trang chủ; plannerView() dựng lại khi cần
    root.classList.toggle('first-paint', firstPaint);
    firstPaint = false;
    let body;
    if (kind === 'planner') {
      const hash = win.location.hash || '';
      const m = CUSTOM_HASH.exec(hash);
      if (hash !== REVIEW_HASH) review = null; // phiên ôn chỉ sống trong lúc ở trang Ôn tập
      body = m ? customView(m[1]) : hash === REVIEW_HASH ? reviewView() : plannerView();
    } else if (kind === 'course' && COURSE_BY_SLUG[slug]) {
      body = courseView(COURSE_BY_SLUG[slug]);
    } else if (kind === 'physics') {
      body = physicsView();
    } else if (kind === 'account') {
      body = accountView();
      loadProfile();
    } else if (kind === 'privacy') {
      body = privacyView();
    } else {
      body = notFound();
    }
    root.replaceChildren(body);
  }

  // ---------- Đồng bộ với đám mây ----------

  function setSync(status, error = '') {
    syncInfo = { status, at: status === 'ok' ? new Date() : syncInfo.at, error };
    if (page === 'account') render();
  }

  function scheduleUpload() {
    clearTimeout(uploadTimer);
    uploadTimer = setTimeout(uploadNow, 1000);
  }

  async function uploadNow() {
    if (!cloud || !cloud.signedIn()) return;
    // Dữ liệu còn của tài khoản trước: để syncNow tách ra trước, không đẩy đi.
    const owner = getOwner(storage);
    if (owner && owner !== cloud.userId()) return syncNow();
    setSync('busy');
    try {
      const snapshot = state;
      const uid = cloud.userId();
      adoptPushed(uid, snapshot, await cloud.pushPlan(uid, snapshot));
      setOwner(storage, uid);
      setSync('ok');
    } catch (e) {
      setSync('error', e.message);
    }
  }

  // Mở trang hoặc vừa đăng nhập: so với mốc server của lần đồng bộ trước rồi kéo hoặc đẩy.
  // Sau khi đẩy: mốc server vừa ghi thành mốc chung. Nếu trong lúc đẩy không sửa gì
  // thì state lấy đúng mốc đó; nếu có sửa thì state giữ mốc máy để lần sau đẩy tiếp.
  function adoptPushed(uid, snapshot, at) {
    if (!at) return;
    setBase(storage, uid, at);
    if (state !== snapshot) return;
    state = { ...state, updated: at };
    saveOk = saveState(storage, state);
  }

  // Dữ liệu local thuộc tài khoản khác (đã đăng xuất, đăng nhập tài khoản mới) không được đẩy đi.
  async function syncNow() {
    if (!cloud || !cloud.signedIn()) return;
    setSync('busy');
    try {
      const uid = cloud.userId();
      const owner = getOwner(storage);
      if (owner && owner !== uid) {
        backupForSync(storage, state);
        state = L.emptyState();
        saveOk = saveState(storage, state);
      }
      const remote = await cloud.pullPlan(uid);
      const action = decideSync(state.updated, remote && remote.updated_at, getBase(storage, uid));
      if (action === 'pull') applyRemote(remote, uid);
      else if (action === 'push') {
        const snapshot = state;
        adoptPushed(uid, snapshot, await cloud.pushPlan(uid, snapshot));
      } else if (remote && remote.updated_at) setBase(storage, uid, remote.updated_at);
      setOwner(storage, uid);
      setSync('ok');
    } catch (e) {
      setSync('error', e.message);
    }
  }

  function applyRemote(remote, uid) {
    const hasLocal = state.tasks.length || state.custom.length || Object.keys(state.progress).length || Object.keys(state.notes).length;
    if (hasLocal) backupForSync(storage, state);
    state = { ...L.normalizeState(remote.state), updated: remote.updated_at };
    setBase(storage, uid, remote.updated_at);
    saveOk = saveState(storage, state);
    render();
  }

  // Xoá dữ liệu học trên máy và trên đám mây; giữ tài khoản.
  async function wipeData() {
    if (cloud && cloud.signedIn()) await cloud.deletePlan(cloud.userId());
    clearTimeout(uploadTimer);
    clearStorage(storage);
    state = L.emptyState();
    saveOk = saveState(storage, state);
  }

  async function loadProfile() {
    if (!cloud || !cloud.signedIn()) return;
    const uid = cloud.userId();
    if (profileFor === uid) return;
    profileFor = uid;
    try {
      profile = await cloud.getProfile(uid);
    } catch (e) {
      profile = { displayName: '', className: '', error: e.message };
    }
    render();
  }

  render();
  if (cloud && cloud.signedIn()) syncNow();
  return { render, getState: () => state, syncNow, dispose: () => timer.dispose() };
}
