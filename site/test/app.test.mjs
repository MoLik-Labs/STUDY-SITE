// Kiểm thử giao diện trong jsdom: lịch tuần, môn có sẵn, môn tự tạo, lưu trữ, bảo mật hiển thị.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(HERE, '..', 'src');
const { mountApp } = await import(pathToFileURL(path.join(SRC, 'app.js')).href);
const { KEY } = await import(pathToFileURL(path.join(SRC, 'store.js')).href);

// 16/11/2026 là Thứ Hai.
const NOW = () => new Date(2026, 10, 16, 9, 0, 0);

function setup({ page = 'planner', storageInit = {}, hash = '' } = {}) {
  const dom = new JSDOM('<!doctype html><main id="main"></main>', { url: 'https://site.test/' + (page === 'planner' ? '' : page) + hash });
  const win = dom.window;
  const storage = win.localStorage;
  for (const [k, v] of Object.entries(storageInit)) storage.setItem(k, v);
  const root = win.document.getElementById('main');
  const app = mountApp(root, { storage, page, win, now: NOW });
  const $ = sel => root.querySelector(sel);
  const $$ = sel => [...root.querySelectorAll(sel)];
  const submit = form => form.dispatchEvent(new win.Event('submit', { bubbles: true, cancelable: true }));
  const check = (el, on) => { el.checked = on; el.dispatchEvent(new win.Event('change', { bubbles: true })); };
  return { win, root, storage, app, $, $$, submit, check };
}

test('lịch tuần: 7 ngày, ngày hôm nay được đánh dấu', () => {
  const t = setup();
  assert.equal(t.$$('.day').length, 7);
  assert.equal(t.$$('.day.is-today').length, 1);
  assert.match(t.$('.range').textContent, /16\/11 – 22\/11/);
});

test('thêm việc hiển thị ngay và còn sau khi tải lại', () => {
  const t = setup();
  const form = t.$('form.add-task');
  form.elements.title.value = 'Đọc chương 1 Hansen';
  form.elements.course.value = 'kinh-te-luong';
  t.submit(form);
  assert.ok(t.root.textContent.includes('Đọc chương 1 Hansen'));
  assert.ok(t.root.textContent.includes('Kinh tế lượng'), 'hiện tên môn');

  const again = setup({ storageInit: { [KEY]: t.storage.getItem(KEY) } });
  assert.ok(again.root.textContent.includes('Đọc chương 1 Hansen'), 'còn sau khi mở lại');
});

test('tiêu đề có HTML được hiển thị như chữ, không thành thẻ', () => {
  const t = setup();
  const form = t.$('form.add-task');
  form.elements.title.value = '<img src=x onerror="alert(1)"><b>x</b>';
  t.submit(form);
  assert.equal(t.root.querySelector('img'), null);
  assert.equal(t.root.querySelector('b'), null);
  assert.ok(t.root.textContent.includes('<img src=x'));
});

test('đánh dấu xong và xoá việc', () => {
  const t = setup();
  const form = t.$('form.add-task');
  form.elements.title.value = 'Việc A';
  t.submit(form);
  const box = t.$('li.task input[type=checkbox]');
  t.check(box, true);
  assert.ok(t.$('li.task').classList.contains('is-done'));
  t.$('li.task button.ghost').dispatchEvent(new t.win.Event('click', { bubbles: true }));
  assert.equal(t.$$('li.task').length, 0);
});

test('trang môn: tiến độ, đánh dấu tài liệu, ghi chú được lưu', () => {
  const t = setup({ page: 'course:kinh-te-luong' });
  assert.match(t.$('.course-progress .meta').textContent, /0\/3/);
  const box = t.$('.res-list input[type=checkbox]');
  t.check(box, true);
  assert.match(t.$('.course-progress .meta').textContent, /1\/3/);
  const note = t.$('#course-note');
  note.value = 'Nhớ công thức OLS';
  note.dispatchEvent(new t.win.Event('input', { bubbles: true }));
  const again = setup({ page: 'course:kinh-te-luong', storageInit: { [KEY]: t.storage.getItem(KEY) } });
  assert.match(again.$('.course-progress .meta').textContent, /1\/3/);
  assert.equal(again.$('#course-note').value, 'Nhớ công thức OLS');
});

test('trang môn hiển thị nhãn kiểm tra đúng với cờ verified', () => {
  const t = setup({ page: 'course:tieng-trung-doc-viet' });
  const badges = t.$$('.badge').map(b => b.textContent);
  assert.ok(badges.every(b => b === 'Đã mở trang kiểm tra'), 'môn này đều đã mở');
  const t2 = setup({ page: 'course:tieng-anh-chuyen-nganh-nghe' });
  assert.ok(t2.$$('.badge').every(b => b.textContent === 'Chưa mở trang kiểm tra'));
});

test('môn tự tạo: tạo, thêm mục có liên kết an toàn, đánh dấu', () => {
  const t = setup();
  const createForm = t.$('aside form.stack-form');
  createForm.elements.name.value = 'Tiếng Nhật N5';
  createForm.elements.color.value = 'plum';
  t.submit(createForm);
  const created = JSON.parse(t.storage.getItem(KEY)).custom[0];
  assert.equal(created.name, 'Tiếng Nhật N5');

  t.win.location.hash = '#/c/' + created.id;
  t.app.render();
  const form = t.$('form.add-task');
  form.elements.title.value = 'Bài 1 hiragana';
  form.elements.url.value = 'javascript:alert(1)';
  t.submit(form);
  const link = t.$('li.res');
  assert.ok(link, 'có mục');
  assert.equal(t.root.querySelector('a[href^="javascript"]'), null, 'không có liên kết javascript:');
  assert.match(t.$('.course-progress .meta').textContent, /0\/1/);
  t.check(t.$('li.res input[type=checkbox]'), true);
  assert.match(t.$('.course-progress .meta').textContent, /1\/1/);
});

test('xoá môn tự tạo cần bấm hai lần', () => {
  const t = setup();
  const createForm = t.$('aside form.stack-form');
  createForm.elements.name.value = 'Tạm';
  t.submit(createForm);
  const id = JSON.parse(t.storage.getItem(KEY)).custom[0].id;
  t.win.location.hash = '#/c/' + id;
  t.app.render();
  const del = t.$('.danger-zone button');
  del.dispatchEvent(new t.win.Event('click', { bubbles: true }));
  assert.match(t.$('.danger-zone button').textContent, /Bấm lần nữa/);
  assert.equal(JSON.parse(t.storage.getItem(KEY)).custom.length, 1, 'lần đầu chưa xoá');
  t.$('.danger-zone button').dispatchEvent(new t.win.Event('click', { bubbles: true }));
  assert.equal(JSON.parse(t.storage.getItem(KEY)).custom.length, 0);
});

test('dữ liệu hỏng: báo lỗi, sao lưu bản gốc, không mất dữ liệu', () => {
  const broken = '{bad json';
  const t = setup({ storageInit: { [KEY]: broken } });
  assert.ok(t.$('.alert'), 'có cảnh báo');
  assert.equal(t.storage.getItem(KEY + '.bak'), broken, 'bản gốc được giữ lại');
});

test('không có bộ nhớ: vẫn chạy và cảnh báo', () => {
  const dom = new JSDOM('<!doctype html><main id="main"></main>', { url: 'https://site.test/' });
  const root = dom.window.document.getElementById('main');
  mountApp(root, { storage: null, page: 'planner', win: dom.window, now: NOW });
  assert.ok(root.querySelector('.alert'));
  assert.equal(root.querySelectorAll('.day').length, 7);
});

test('trang không tồn tại hiển thị thông báo', () => {
  const t = setup({ page: 'course:khong-co' });
  assert.match(t.root.textContent, /Không tìm thấy trang/);
});

test('môn tự tạo không tồn tại hiển thị thông báo', () => {
  const t = setup({ hash: '#/c/khongco' });
  assert.match(t.root.textContent, /Không tìm thấy môn này/);
});

test('trang chủ: khối Hôm nay hiện việc đến hạn và môn nên học tiếp', () => {
  const t = setup();
  const form = t.$('form.add-task');
  form.elements.title.value = 'Đọc chương 1';
  form.elements.date.value = '2026-11-16';
  t.submit(form);
  const today = t.$('section.today');
  assert.ok(today, 'có khối Hôm nay');
  assert.match(today.textContent, /1 việc đến hạn hôm nay/);
  const focus = today.querySelector('a.focus');
  assert.ok(focus, 'có gợi ý học tiếp');
  assert.equal(focus.getAttribute('href'), '/tieng-anh-chuyen-nganh-doc/', 'mọi môn 0% → môn đầu tiên');
});

test('trang chủ: việc quá hạn được đếm riêng', () => {
  const t = setup();
  const form = t.$('form.add-task');
  form.elements.title.value = 'Việc cũ';
  form.elements.date.value = '2026-11-10';
  t.submit(form);
  assert.match(t.$('section.today').textContent, /1 việc quá hạn/);
});

test('bấm giờ: hiện 25:00, bắt đầu thì lưu trạng thái đang chạy và đổi nút thành Tạm dừng', () => {
  const { $, $$, storage, app } = setup();
  try {
    assert.equal($('.timer-clock').textContent, '25:00');
    $$('.timer button').find(b => b.textContent === 'Bắt đầu').click();
    const saved = JSON.parse(storage.getItem('sf.timer.v1'));
    assert.equal(saved.running, true);
    assert.ok(saved.endAt > 0);
    assert.ok($$('.timer button').some(b => b.textContent === 'Tạm dừng'));
  } finally {
    app.dispose();
  }
});

test('bấm giờ: bộ 50/10 đổi đồng hồ và đánh dấu đã chọn', () => {
  const { $, $$, app } = setup();
  try {
    $$('.timer-presets button').find(b => b.textContent === '50/10').click();
    assert.equal($('.timer-clock').textContent, '50:00');
    assert.equal($$('.timer-presets button').find(b => b.textContent === '50/10').getAttribute('aria-pressed'), 'true');
  } finally {
    app.dispose();
  }
});

test('bấm giờ: chuyển sang tab Bấm giờ, ghi vòng; nút Vòng chỉ bật khi đang chạy', () => {
  const { $$, storage, app } = setup();
  try {
    const lapBtn = () => $$('#timer-sw button').find(b => b.textContent === 'Vòng');
    $$('.timer-tabs .tab').find(b => b.textContent === 'Bấm giờ').click();
    assert.equal(lapBtn().disabled, true);
    $$('#timer-sw button').find(b => b.textContent === 'Bắt đầu').click();
    assert.equal(lapBtn().disabled, false);
    lapBtn().click();
    assert.equal($$('.laps li').length, 1);
    assert.equal(JSON.parse(storage.getItem('sf.timer.v1')).sw.laps.length, 1);
  } finally {
    app.dispose();
  }
});

test('bấm giờ: trạng thái đã lưu được khôi phục khi tải lại trang', () => {
  const stored = JSON.stringify({ v: 1, preset: 2, phase: 'focus', running: false, left: 9 * 60000, sessions: 2, day: '2026-11-16' });
  const { $ } = setup({ storageInit: { 'sf.timer.v1': stored } });
  assert.equal($('.timer-clock').textContent, '09:00');
});

test('bấm giờ: đọc JSON hỏng không làm vỡ trang chủ', () => {
  const { $ } = setup({ storageInit: { 'sf.timer.v1': '{hong' } });
  assert.equal($('.timer-clock').textContent, '25:00');
  assert.ok($('.today'), 'khối Hôm nay vẫn hiển thị');
});

test('xoá dữ liệu học cũng xoá trạng thái bấm giờ', async () => {
  const { storage } = setup({ storageInit: { 'sf.timer.v1': JSON.stringify({ sessions: 4 }) } });
  // clearStorage dùng chung với nút xoá dữ liệu trên trang tài khoản
  const { clearStorage } = await import(pathToFileURL(path.join(SRC, 'store.js')).href);
  clearStorage(storage);
  assert.equal(storage.getItem('sf.timer.v1'), null);
});
