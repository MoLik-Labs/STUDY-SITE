// Giao diện: lịch tuần (trang chủ), trang môn học có sẵn, trang môn tự tạo (#/c/<id>).
// Toàn bộ DOM được dựng bằng h() với textContent, nên dữ liệu người dùng không bao giờ được hiểu là HTML.
import { COURSES, COURSE_BY_SLUG } from './courses.js';
import * as L from './logic.js';
import { loadState, saveState } from './store.js';

const WEEKDAYS = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ nhật'];
const COLOR_NAMES = {
  green: 'Xanh lá', ochre: 'Vàng đất', blue: 'Xanh dương', rust: 'Đỏ gạch', plum: 'Tím', slate: 'Xám xanh',
};
const CUSTOM_HASH = /^#\/c\/([A-Za-z0-9_-]{1,80})$/;

function fmtDay(date) {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function mountApp(root, { storage, page, win = globalThis, now = () => new Date() }) {
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
  let state = loaded.state;
  let saveOk = loaded.available;
  let anchor = now();
  let armedDelete = null;

  function persist(next) {
    state = next;
    saveOk = saveState(storage, state);
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

  function plannerView() {
    return h('div', { class: 'planner' }, alertBox(), h('div', { class: 'planner-grid' }, weekView(), sidebar()));
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

  function render() {
    const kind = page.split(':')[0];
    const slug = page.split(':')[1];
    let body;
    if (kind === 'planner') {
      const m = CUSTOM_HASH.exec(win.location.hash || '');
      body = m ? customView(m[1]) : plannerView();
    } else if (kind === 'course' && COURSE_BY_SLUG[slug]) {
      body = courseView(COURSE_BY_SLUG[slug]);
    } else if (kind === 'physics') {
      body = physicsView();
    } else {
      body = notFound();
    }
    root.replaceChildren(body);
  }

  render();
  return { render, getState: () => state };
}
