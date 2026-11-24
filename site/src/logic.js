// Logic thuần: không đụng DOM hay bộ nhớ trình duyệt. Mọi thao tác trả về trạng thái mới.
// Dữ liệu lấy từ bộ nhớ đều đi qua normalizeState trước khi dùng.

export const COLORS = Object.freeze(['green', 'ochre', 'blue', 'rust', 'plum', 'slate']);

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const SAFE_KEY = /^[A-Za-z0-9_\-:.]{1,120}$/;
const UNSAFE = new Set(['__proto__', 'prototype', 'constructor']);

export function parseIso(value) {
  const m = ISO.exec(typeof value === 'string' ? value : '');
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const date = new Date(y, mo, d);
  return date.getFullYear() === y && date.getMonth() === mo && date.getDate() === d ? date : null;
}

export function isoOf(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(date, n) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
}

// Tuần bắt đầu từ thứ Hai.
export function startOfWeek(date) {
  const dow = (date.getDay() + 6) % 7;
  return addDays(date, -dow);
}

export function weekDays(anchor) {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function sanitizeText(value, max) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

// Ghi chú giữ xuống dòng; chỉ bỏ ký tự điều khiển.
export function sanitizeNote(value) {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .slice(0, 5000);
}

// Chỉ cho phép http(s). Chuỗi khác (javascript:, data:, ...) trả về ''.
export function sanitizeUrl(value) {
  const raw = sanitizeText(value, 500);
  if (!raw) return '';
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
  } catch {
    return '';
  }
}

export function newId(prefix) {
  const rand = Math.random().toString(36).slice(2, 8);
  return prefix + Date.now().toString(36) + rand;
}

// updated: thời điểm ghi cuối (ISO). Dùng để quyết định bên nào mới hơn khi đồng bộ.
export function emptyState() {
  return { v: 2, updated: null, tasks: [], custom: [], progress: {}, notes: {}, cards: [] };
}

function safeMap(obj, fn) {
  const out = {};
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return out;
  for (const [key, value] of Object.entries(obj)) {
    if (UNSAFE.has(key) || !SAFE_KEY.test(key)) continue;
    const next = fn(value);
    if (next !== undefined) out[key] = next;
  }
  return out;
}

export function normalizeState(raw) {
  const state = emptyState();
  if (!raw || typeof raw !== 'object') return state;
  if (typeof raw.updated === 'string' && Number.isFinite(Date.parse(raw.updated))) state.updated = raw.updated;

  if (Array.isArray(raw.tasks)) {
    state.tasks = raw.tasks
      .filter(t => t && typeof t.id === 'string' && parseIso(t.date) && typeof t.title === 'string')
      .map(t => ({
        id: sanitizeText(t.id, 80),
        title: sanitizeText(t.title, 140),
        course: sanitizeText(t.course, 80),
        date: t.date,
        done: t.done === true,
      }))
      .filter(t => t.id && t.title)
      .slice(-2000);
  }

  if (Array.isArray(raw.custom)) {
    state.custom = raw.custom
      .filter(c => c && typeof c.id === 'string')
      .map(c => ({
        id: sanitizeText(c.id, 80),
        name: sanitizeText(c.name, 80),
        color: COLORS.includes(c.color) ? c.color : COLORS[0],
        items: Array.isArray(c.items)
          ? c.items
              .filter(i => i && typeof i.id === 'string')
              .map(i => ({ id: sanitizeText(i.id, 80), title: sanitizeText(i.title, 160), url: sanitizeUrl(i.url), done: i.done === true }))
              .filter(i => i.id && i.title)
              .slice(0, 300)
          : [],
      }))
      .filter(c => c.id && c.name)
      .slice(0, 50);
  }

  state.progress = safeMap(raw.progress, map => (map && typeof map === 'object'
    ? safeMap(map, on => (on === true ? true : undefined))
    : undefined));

  state.notes = safeMap(raw.notes, text => (typeof text === 'string' ? sanitizeNote(text) : undefined));
  state.cards = normalizeCards(raw.cards);
  return state;
}

export function addTask(state, { title, course, date }, id = newId('t')) {
  const clean = sanitizeText(title, 140);
  if (!clean || !parseIso(date)) return state;
  const task = { id, title: clean, course: sanitizeText(course, 80), date, done: false };
  return { ...state, tasks: [...state.tasks, task].slice(-2000) };
}

export function toggleTask(state, id) {
  return { ...state, tasks: state.tasks.map(t => (t.id === id ? { ...t, done: !t.done } : t)) };
}

export function removeTask(state, id) {
  return { ...state, tasks: state.tasks.filter(t => t.id !== id) };
}

export function tasksOn(state, iso) {
  return state.tasks.filter(t => t.date === iso);
}

// doneMap: { [id]: true }. Trả về số đã xong, tổng và phần trăm làm tròn.
export function progressOf(ids, doneMap) {
  const map = doneMap || {};
  const total = ids.length;
  const done = ids.filter(id => map[id] === true).length;
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
}

export function setResourceDone(state, course, resourceId, on) {
  const current = { ...(state.progress[course] || {}) };
  if (on) current[resourceId] = true;
  else delete current[resourceId];
  return { ...state, progress: { ...state.progress, [course]: current } };
}

export function setNote(state, course, text) {
  return { ...state, notes: { ...state.notes, [course]: sanitizeNote(text) } };
}

export function addCustom(state, { name, color }, id = newId('c')) {
  const clean = sanitizeText(name, 80);
  if (!clean) return state;
  const course = { id, name: clean, color: COLORS.includes(color) ? color : COLORS[0], items: [] };
  return { ...state, custom: [...state.custom, course].slice(0, 50) };
}

export function removeCustom(state, id) {
  return { ...state, custom: state.custom.filter(c => c.id !== id) };
}

export function findCustom(state, id) {
  return state.custom.find(c => c.id === id) || null;
}

function mapCustom(state, id, fn) {
  return { ...state, custom: state.custom.map(c => (c.id === id ? fn(c) : c)) };
}

export function addItem(state, courseId, { title, url }, id = newId('i')) {
  const clean = sanitizeText(title, 160);
  if (!clean) return state;
  const item = { id, title: clean, url: sanitizeUrl(url), done: false };
  return mapCustom(state, courseId, c => ({ ...c, items: [...c.items, item].slice(0, 300) }));
}

export function toggleItem(state, courseId, itemId) {
  return mapCustom(state, courseId, c => ({
    ...c,
    items: c.items.map(i => (i.id === itemId ? { ...i, done: !i.done } : i)),
  }));
}

export function removeItem(state, courseId, itemId) {
  return mapCustom(state, courseId, c => ({ ...c, items: c.items.filter(i => i.id !== itemId) }));
}

// Gợi ý học hôm nay, chỉ dựa trên dữ liệu đã có:
//   · việc quá hạn và việc đến hạn hôm nay (chưa xong)
//   · môn có tiến độ thấp nhất còn tài liệu chưa học → tài liệu tiếp theo
// courses: danh sách môn có sẵn (courses.js). Hàm thuần: không đọc giờ hệ thống.
export function suggestToday(state, courses, todayIso) {
  const open = state.tasks.filter(t => !t.done);
  const overdue = open.filter(t => t.date < todayIso).sort((a, b) => (a.date < b.date ? -1 : 1));
  const dueToday = open.filter(t => t.date === todayIso);

  const candidates = [];
  courses.forEach((c, order) => {
    const ids = c.resources.map(r => r.id);
    const pr = progressOf(ids, state.progress[c.slug]);
    if (pr.done >= pr.total) return;
    const next = c.resources.find(r => state.progress[c.slug]?.[r.id] !== true);
    candidates.push({ key: c.slug, name: c.name, percent: pr.percent, order, href: '/' + c.slug + '/', next: next ? next.title : '' });
  });
  for (const c of state.custom) {
    const pr = progressOf(c.items.map(i => i.id), Object.fromEntries(c.items.filter(i => i.done).map(i => [i.id, true])));
    if (pr.total === 0 || pr.done >= pr.total) continue;
    const next = c.items.find(i => !i.done);
    candidates.push({ key: c.id, name: c.name, percent: pr.percent, order: courses.length + state.custom.indexOf(c), href: '#/c/' + c.id, next: next.title });
  }
  candidates.sort((a, b) => a.percent - b.percent || a.order - b.order);

  return { overdue, dueToday, focus: candidates[0] || null, remaining: candidates.length };
}

// ---------- Thẻ ghi nhớ (lịch Leitner, 5 ngăn) ----------
// Nhớ: thẻ lên một ngăn và quay lại sau CARD_INTERVALS[ngăn mới] ngày.
// Quên: thẻ về ngăn 1 và quay lại ngày mai. Ngăn 5 là "đã thuộc".
export const CARD_INTERVALS = Object.freeze([1, 2, 4, 8, 16]);
export const CARD_LIMIT = 1000;
const FRONT_MAX = 300;
const BACK_MAX = 800;

function normalizeCards(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(c => c && typeof c.id === 'string' && typeof c.due === 'string' && parseIso(c.due))
    .map(c => ({
      id: sanitizeText(c.id, 80),
      front: sanitizeText(c.front, FRONT_MAX),
      back: sanitizeNote(c.back).slice(0, BACK_MAX),
      course: sanitizeText(c.course, 80),
      box: Number.isInteger(c.box) && c.box >= 0 && c.box < CARD_INTERVALS.length ? c.box : 0,
      due: c.due,
    }))
    .filter(c => c.id && c.front)
    .slice(0, CARD_LIMIT);
}

// Trả về state mới, hoặc chính state đó nếu thẻ không hợp lệ hoặc đã đủ CARD_LIMIT.
export function addCard(state, { front, back, course }, todayIso, id = newId('k')) {
  const text = sanitizeText(front, FRONT_MAX);
  const cards = state.cards || [];
  if (!text || cards.length >= CARD_LIMIT || !parseIso(todayIso)) return state;
  const card = {
    id,
    front: text,
    back: sanitizeNote(back).slice(0, BACK_MAX),
    course: sanitizeText(course, 80),
    box: 0,
    due: todayIso,
  };
  return { ...state, cards: [...cards, card] };
}

export function reviewCard(state, id, remembered, todayIso) {
  const today = parseIso(todayIso);
  if (!today) return state;
  return {
    ...state,
    cards: (state.cards || []).map(c => {
      if (c.id !== id) return c;
      if (!remembered) return { ...c, box: 0, due: isoOf(addDays(today, 1)) };
      const box = Math.min(c.box + 1, CARD_INTERVALS.length - 1);
      return { ...c, box, due: isoOf(addDays(today, CARD_INTERVALS[box])) };
    }),
  };
}

export function removeCard(state, id) {
  return { ...state, cards: (state.cards || []).filter(c => c.id !== id) };
}

// Thẻ đến hạn (due <= hôm nay), thẻ quá hạn lâu nhất đứng trước.
export function dueCards(state, todayIso) {
  return (state.cards || [])
    .filter(c => c.due <= todayIso)
    .sort((a, b) => a.due.localeCompare(b.due) || a.box - b.box);
}

export function cardStats(state, todayIso) {
  const cards = state.cards || [];
  return {
    total: cards.length,
    due: cards.filter(c => c.due <= todayIso).length,
    learned: cards.filter(c => c.box === CARD_INTERVALS.length - 1).length,
  };
}
