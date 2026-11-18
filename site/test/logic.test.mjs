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
