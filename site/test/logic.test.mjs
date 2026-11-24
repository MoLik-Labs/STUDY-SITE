import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../src/logic.js';

test('parseIso nhận ngày thật, từ chối ngày không có thật', () => {
  assert.ok(L.parseIso('2026-11-16'));
  assert.equal(L.parseIso('2026-02-30'), null);
  assert.equal(L.parseIso('2026-13-01'), null);
  assert.equal(L.parseIso('16/11/2026'), null);
  assert.equal(L.parseIso(null), null);
});

test('weekDays bắt đầu từ thứ Hai và có 7 ngày liên tiếp', () => {
  const days = L.weekDays(new Date(2026, 10, 18)); // Thứ Tư
  assert.equal(days.length, 7);
  assert.equal((days[0].getDay() + 6) % 7, 0, 'ngày đầu là thứ Hai');
  assert.equal(L.isoOf(days[6]) > L.isoOf(days[0]), true);
});

test('sanitizeUrl chỉ cho http(s)', () => {
  assert.equal(L.sanitizeUrl('https://ocw.mit.edu/'), 'https://ocw.mit.edu/');
  assert.equal(L.sanitizeUrl('javascript:alert(1)'), '');
  assert.equal(L.sanitizeUrl('data:text/html,hi'), '');
  assert.equal(L.sanitizeUrl('không phải url'), '');
});

test('sanitizeText bỏ ký tự điều khiển và cắt độ dài', () => {
  assert.equal(L.sanitizeText('  a\u0000b \n c  ', 10), 'a b c');
  assert.equal(L.sanitizeText('x'.repeat(50), 5).length, 5);
});

test('addTask từ chối tiêu đề rỗng hoặc ngày sai, trả về cùng trạng thái', () => {
  const s = L.emptyState();
  assert.equal(L.addTask(s, { title: '   ', course: '', date: '2026-11-16' }), s);
  assert.equal(L.addTask(s, { title: 'Học', course: '', date: 'hôm nay' }), s);
  const next = L.addTask(s, { title: 'Học', course: 'kinh-te-luong', date: '2026-11-16' }, 't1');
  assert.equal(next.tasks.length, 1);
  assert.equal(next.tasks[0].id, 't1');
  assert.equal(s.tasks.length, 0, 'không đổi trạng thái cũ');
});

test('toggleTask, removeTask, tasksOn', () => {
  let s = L.addTask(L.emptyState(), { title: 'A', course: '', date: '2026-11-16' }, 'a');
  s = L.addTask(s, { title: 'B', course: '', date: '2026-11-17' }, 'b');
  assert.equal(L.tasksOn(s, '2026-11-16').length, 1);
  s = L.toggleTask(s, 'a');
  assert.equal(s.tasks[0].done, true);
  s = L.removeTask(s, 'b');
  assert.deepEqual(s.tasks.map(t => t.id), ['a']);
});

test('progressOf tính đúng số và phần trăm', () => {
  assert.deepEqual(L.progressOf(['a', 'b', 'c'], { a: true }), { done: 1, total: 3, percent: 33 });
  assert.deepEqual(L.progressOf([], {}), { done: 0, total: 0, percent: 0 });
  assert.equal(L.progressOf(['a'], { a: true }).percent, 100);
});

test('setResourceDone bật và tắt, không làm đổi môn khác', () => {
  let s = L.setResourceDone(L.emptyState(), 'kinh-te-luong', 'hansen', true);
  s = L.setResourceDone(s, 'nguyen-li-ke-toan', 'openstax', true);
  s = L.setResourceDone(s, 'kinh-te-luong', 'hansen', false);
  assert.deepEqual(s.progress, { 'kinh-te-luong': {}, 'nguyen-li-ke-toan': { openstax: true } });
});

test('môn tự tạo: tạo, thêm mục, đánh dấu, xoá', () => {
  let s = L.addCustom(L.emptyState(), { name: 'Tiếng Hàn sơ cấp', color: 'plum' }, 'c1');
  assert.equal(s.custom[0].color, 'plum');
  s = L.addItem(s, 'c1', { title: 'Bài 1', url: 'https://example.com/' }, 'i1');
  s = L.addItem(s, 'c1', { title: 'Bài 2', url: 'javascript:alert(1)' }, 'i2');
  assert.equal(s.custom[0].items[1].url, '', 'URL nguy hiểm bị bỏ');
  s = L.toggleItem(s, 'c1', 'i1');
  assert.equal(s.custom[0].items[0].done, true);
  s = L.removeItem(s, 'c1', 'i2');
  assert.equal(s.custom[0].items.length, 1);
  s = L.removeCustom(s, 'c1');
  assert.equal(L.findCustom(s, 'c1'), null);
});

test('addCustom với màu lạ dùng màu mặc định', () => {
  const s = L.addCustom(L.emptyState(), { name: 'X', color: '#ff0000' }, 'c2');
  assert.equal(s.custom[0].color, L.COLORS[0]);
});

test('normalizeState: bỏ khoá nguy hiểm, URL xấu, dữ liệu sai kiểu', () => {
  const raw = JSON.parse('{"__proto__":{"polluted":true},"progress":{"__proto__":{"x":true},"ok":{"a":true,"b":"yes"}},"tasks":[{"id":"t","title":"ok","date":"2026-11-16","done":true},{"id":"bad","title":"x","date":"2026-02-30"}],"custom":[{"id":"c","name":"M","color":"red","items":[{"id":"i","title":"T","url":"javascript:1"}]}],"notes":{"kinh-te-luong":"ghi chú","bad key!":"x"}}');
  const s = L.normalizeState(raw);
  assert.equal({}.polluted, undefined, 'không ô nhiễm prototype');
  assert.equal(Object.prototype.hasOwnProperty.call(s.progress, '__proto__'), false);
  assert.deepEqual(s.progress.ok, { a: true }, 'chỉ giữ giá trị true');
  assert.equal(s.tasks.length, 1, 'ngày sai bị bỏ');
  assert.equal(s.custom[0].color, L.COLORS[0]);
  assert.equal(s.custom[0].items[0].url, '');
  assert.deepEqual(Object.keys(s.notes), ['kinh-te-luong']);
});

test('normalizeState với đầu vào không phải object trả về trạng thái rỗng', () => {
  for (const raw of [null, 42, 'x', []]) {
    assert.deepEqual(L.normalizeState(raw), L.emptyState());
  }
});

import { COURSES } from '../src/courses.js';

test('suggestToday: việc quá hạn và đến hạn hôm nay, bỏ việc đã xong', () => {
  let s = L.emptyState();
  s = L.addTask(s, { title: 'cũ', course: '', date: '2026-11-10' }, 'a');
  s = L.addTask(s, { title: 'hôm nay', course: '', date: '2026-11-16' }, 'b');
  s = L.addTask(s, { title: 'mai', course: '', date: '2026-11-17' }, 'c');
  s = L.addTask(s, { title: 'đã xong', course: '', date: '2026-11-12' }, 'd');
  s = L.toggleTask(s, 'd');
  const g = L.suggestToday(s, COURSES, '2026-11-16');
  assert.deepEqual(g.overdue.map(t => t.id), ['a']);
  assert.deepEqual(g.dueToday.map(t => t.id), ['b']);
});

test('suggestToday: môn tiến độ thấp nhất trước; cùng mức thì theo thứ tự môn', () => {
  // Mọi môn đều đã xong trừ kinh-te-luong (1/3): chỉ còn môn đó.
  let s = L.emptyState();
  for (const c of COURSES) if (c.slug !== 'kinh-te-luong') for (const r of c.resources) s = L.setResourceDone(s, c.slug, r.id, true);
  const kt = COURSES.find(c => c.slug === 'kinh-te-luong');
  s = L.setResourceDone(s, 'kinh-te-luong', kt.resources[0].id, true);
  const g = L.suggestToday(s, COURSES, '2026-11-16');
  assert.equal(g.focus.key, 'kinh-te-luong');
  assert.equal(g.focus.next, kt.resources[1].title, 'tài liệu chưa học đầu tiên của môn đó');
  assert.equal(g.remaining, 1);

  // Không làm gì cả: mọi môn đều 0%, ưu tiên theo thứ tự trong courses.js.
  const fresh = L.suggestToday(L.emptyState(), COURSES, '2026-11-16');
  assert.equal(fresh.focus.key, COURSES[0].slug);
  assert.equal(fresh.focus.percent, 0);
});

test('suggestToday: khi đã học hết mọi tài liệu thì không có gợi ý', () => {
  let s = L.emptyState();
  for (const c of COURSES) for (const r of c.resources) s = L.setResourceDone(s, c.slug, r.id, true);
  const g = L.suggestToday(s, COURSES, '2026-11-16');
  assert.equal(g.focus, null);
  assert.equal(g.remaining, 0);
});

test('suggestToday: môn tự tạo tham gia gợi ý và trỏ về trang môn đó', () => {
  let s = L.addCustom(L.emptyState(), { name: 'Tiếng Hàn', color: 'plum' }, 'cc');
  s = L.addItem(s, 'cc', { title: 'Bài 1', url: '' }, 'ii');
  const g = L.suggestToday(s, [], '2026-11-16');
  assert.equal(g.focus.href, '#/c/cc');
  assert.equal(g.focus.next, 'Bài 1');
});

// ---------- Thẻ ghi nhớ (Leitner) ----------
test('thẻ: thêm thẻ rỗng hoặc ngày sai thì không đổi state', () => {
  const s = L.emptyState();
  assert.equal(L.addCard(s, { front: '   ', back: 'x' }, '2026-11-16', 'k1'), s);
  assert.equal(L.addCard(s, { front: 'a', back: '' }, 'not-a-date', 'k1'), s);
});

test('thẻ: thẻ mới đến hạn ngay hôm đó, ngăn 1', () => {
  let s = L.addCard(L.emptyState(), { front: 'Hỏi', back: 'Đáp', course: 'kinh-te-luong' }, '2026-11-16', 'k1');
  assert.equal(s.cards.length, 1);
  assert.equal(s.cards[0].box, 0);
  assert.equal(s.cards[0].due, '2026-11-16');
  assert.equal(L.dueCards(s, '2026-11-16').length, 1);
});

test('thẻ: nhớ thì ôn lâu hơn theo ngăn, quên thì về ngăn 1 và ôn ngày mai', () => {
  let s = L.addCard(L.emptyState(), { front: 'A', back: '' }, '2026-11-16', 'k1');
  s = L.reviewCard(s, 'k1', true, '2026-11-16');
  assert.equal(s.cards[0].box, 1);
  assert.equal(s.cards[0].due, '2026-11-18'); // +2 ngày
  s = L.reviewCard(s, 'k1', true, '2026-11-18');
  assert.equal(s.cards[0].due, '2026-11-22'); // ngăn 3: +4
  s = L.reviewCard(s, 'k1', false, '2026-11-22');
  assert.equal(s.cards[0].box, 0);
  assert.equal(s.cards[0].due, '2026-11-23');
});

test('thẻ: ngăn tối đa là 5 và không vượt quá khoảng 16 ngày', () => {
  let s = L.addCard(L.emptyState(), { front: 'A' }, '2026-11-16', 'k1');
  for (let i = 0; i < 10; i++) s = L.reviewCard(s, 'k1', true, s.cards[0].due);
  assert.equal(s.cards[0].box, 4);
  assert.equal(L.cardStats(s, '2026-11-16').learned, 1);
  assert.equal(L.cardStats(s, '2026-11-16').due, 0);
});

test('thẻ: danh sách đến hạn sắp xếp theo ngày, và cardStats đúng', () => {
  let s = L.emptyState();
  s = L.addCard(s, { front: 'B' }, '2026-11-15', 'k2');
  s = L.addCard(s, { front: 'A' }, '2026-11-14', 'k1');
  s = L.addCard(s, { front: 'C' }, '2026-11-20', 'k3');
  assert.deepEqual(L.dueCards(s, '2026-11-16').map(c => c.id), ['k1', 'k2']);
  assert.deepEqual(L.cardStats(s, '2026-11-16'), { total: 3, due: 2, learned: 0 });
});

test('thẻ: xoá thẻ; chuẩn hoá bỏ thẻ hỏng và ngăn không hợp lệ', () => {
  let s = L.addCard(L.emptyState(), { front: 'A' }, '2026-11-16', 'k1');
  s = L.removeCard(s, 'k1');
  assert.equal(s.cards.length, 0);
  const n = L.normalizeState({
    cards: [
      { id: 'ok', front: 'Hỏi', back: 'Đáp', box: 99, due: '2026-11-16' },
      { id: 'bad-date', front: 'x', due: 'hôm qua' },
      { front: 'không có id', due: '2026-11-16' },
      { id: 'rỗng', front: '   ', due: '2026-11-16' },
    ],
  });
  assert.deepEqual(n.cards.map(c => c.id), ['ok']);
  assert.equal(n.cards[0].box, 0);
});

test('thẻ: không vượt quá giới hạn số thẻ', () => {
  const full = { ...L.emptyState(), cards: Array.from({ length: L.CARD_LIMIT }, (_, i) => ({ id: 'k' + i, front: 'x', back: '', course: '', box: 0, due: '2026-11-16' })) };
  assert.equal(L.addCard(full, { front: 'thêm' }, '2026-11-16', 'kmoi'), full);
});

// ---------- Kỳ thi và tiến độ ----------
import { addExam, removeExam, upcomingExams, weeklyProgress, emptyState as _emptyState, normalizeState as _norm, addTask as _addTask, toggleTask as _toggle, addCard as _addCard, reviewCard as _review, dueCards as _due, cardStats as _stats } from '../src/logic.js';

test('kỳ thi: thêm, đếm ngược đúng qua giao thừa và qua mùa đổi giờ, bỏ kỳ thi đã qua', () => {
  let s = _emptyState();
  s = addExam(s, { title: 'Giữa kỳ Econometrics', course: 'kinh-te-luong', date: '2027-01-02' }, 'e1');
  s = addExam(s, { title: 'Cuối kỳ', course: '', date: '2026-11-10' }, 'e2');
  s = addExam(s, { title: 'Không hợp lệ', course: '', date: '2026-02-31' }, 'e3');
  assert.equal(s.exams.length, 2, 'ngày sai bị bỏ');
  const up = upcomingExams(s, '2026-11-16');
  assert.deepEqual(up.map(e => e.id), ['e1']);
  assert.equal(up[0].daysLeft, 47);
  assert.equal(upcomingExams(s, '2027-01-02')[0].daysLeft, 0, 'thi hôm nay còn 0 ngày');
  assert.equal(removeExam(s, 'e1').exams.length, 1);
});

test('kỳ thi: dữ liệu lạ bị lọc khi đọc từ đám mây; giới hạn 30 kỳ thi', () => {
  const raw = { exams: [{ id: 'a', title: 'OK', date: '2026-12-01' }, { id: 'b', title: '', date: '2026-12-01' }, 'hỏng', { id: 'c', title: 'x', date: 'sai' }] };
  assert.equal(_norm(raw).exams.length, 1);
  let s = _emptyState();
  for (let i = 0; i < 40; i++) s = addExam(s, { title: 'T' + i, course: '', date: '2026-12-01' }, 'e' + i);
  assert.equal(s.exams.length, 30);
});

test('tiến độ 7 ngày: đếm việc đã xong và tỉ lệ, không tính ngày ngoài khoảng', () => {
  let s = _emptyState();
  s = _addTask(s, { title: 'A', course: '', date: '2026-11-16' }, 'ta');
  s = _addTask(s, { title: 'B', course: '', date: '2026-11-14' }, 'tb');
  s = _addTask(s, { title: 'C', course: '', date: '2026-11-01' }, 'tc'); // ngoài 7 ngày
  s = _toggle(s, 'ta');
  const p = weeklyProgress(s, '2026-11-16');
  assert.equal(p.days.length, 7);
  assert.equal(p.days[0].date, '2026-11-10');
  assert.equal(p.days[6].date, '2026-11-16');
  assert.equal(p.total, 2);
  assert.equal(p.done, 1);
  assert.equal(p.rate, 50);
  assert.equal(weeklyProgress(_emptyState(), '2026-11-16').rate, 0, 'không chia cho 0');
});

// ---------- Thẻ ghi nhớ (SRS) ----------
test('thẻ: thêm, chấm nhớ tăng hộp, quên đưa về hộp 0 và đến hạn ngày mai', () => {
  let s = _addCard(_emptyState(), { front: 'OLS là gì?', back: 'Bình phương tối thiểu', course: 'kinh-te-luong' }, '2026-11-16', 'k1');
  assert.equal(s.cards.length, 1);
  assert.equal(s.cards[0].box, 0);
  assert.equal(_due(s, '2026-11-16').length, 1, 'thẻ mới đến hạn ngay');
  s = _review(s, 'k1', true, '2026-11-16');
  assert.equal(s.cards[0].box, 1);
  assert.ok(s.cards[0].due > '2026-11-16', 'hộp 1 hẹn ngày sau');
  assert.equal(_due(s, '2026-11-16').length, 0);
  s = _review(s, 'k1', false, '2026-11-16');
  assert.equal(s.cards[0].box, 0);
  assert.equal(s.cards[0].due, '2026-11-17');
});

test('thẻ: front rỗng bị bỏ, quá 1000 thẻ bị từ chối, id không tồn tại không làm hỏng', () => {
  assert.equal(_addCard(_emptyState(), { front: '   ', back: 'x' }, '2026-11-16', 'k').cards.length, 0);
  let s = _emptyState();
  s.cards = Array.from({ length: 1000 }, (_, i) => ({ id: 'c' + i, front: 'f', back: '', course: '', box: 0, due: '2026-11-16' }));
  assert.equal(_addCard(s, { front: 'mới', back: '' }, '2026-11-16', 'kx').cards.length, 1000);
  const before = _emptyState();
  assert.deepEqual(_review(before, 'khong-co', true, '2026-11-16').cards, []);
});

test('thẻ: thống kê tổng, đến hạn, đã thuộc (hộp cuối)', () => {
  const s = _norm({ cards: [
    { id: 'a', front: 'a', back: '', course: '', box: 4, due: '2026-11-20' },
    { id: 'b', front: 'b', back: '', course: '', box: 0, due: '2026-11-10' },
    { id: 'c', front: 'c', back: '', course: '', box: 2, due: '2026-11-16' },
  ] });
  assert.deepEqual(_stats(s, '2026-11-16'), { total: 3, due: 2, learned: 1 });
  assert.deepEqual(_due(s, '2026-11-16').map(c => c.id), ['b', 'c'], 'quá hạn lâu nhất đứng trước');
});
