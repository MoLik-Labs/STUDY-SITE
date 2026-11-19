// Đồng bộ kế hoạch giữa hai máy, qua một "máy chủ" giả có đồng hồ LỆCH 3 tiếng so với máy.
// Mục đích: thay đổi của máy có đồng hồ chậm không bị đè, và không kéo nhầm bản cũ.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(HERE, '..', 'src');
const { mountApp } = await import(pathToFileURL(path.join(SRC, 'app.js')).href);
const { KEY } = await import(pathToFileURL(path.join(SRC, 'store.js')).href);
const L = await import(pathToFileURL(path.join(SRC, 'logic.js')).href);

const UID = 'uid-sync-test-0000000000000001';
const SKEW_MS = 3 * 3600 * 1000;   // máy chủ nhanh hơn máy 3 tiếng
const DAY = '2026-11-16';

function memStorage() {
  const m = new Map();
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: k => m.delete(k),
  };
}

// Máy chủ giả: một tài liệu cho mỗi uid, mốc do đồng hồ máy chủ (đã lệch) ghi.
function fakeServer() {
  const docs = {};
  let tick = 0;
  const clock = () => new Date(Date.now() + SKEW_MS + ++tick).toISOString();
  const cloud = {
    signedIn: () => true, userId: () => UID, email: () => 'hs@example.com', enabled: true,
    needsEmail: () => false,
    pullPlan: async uid => (docs[uid] ? { state: JSON.parse(docs[uid].state), updated_at: docs[uid].updatedAt } : null),
    pushPlan: async (uid, st) => { const at = clock(); docs[uid] = { state: JSON.stringify(st), updatedAt: at }; return at; },
    deletePlan: async uid => { delete docs[uid]; },
    getProfile: async () => ({ displayName: '', className: '' }),
    saveProfile: async () => {},
  };
  return { docs, cloud };
}

const settle = () => new Promise(r => setTimeout(r, 60));

// Mở một "máy": storage riêng, giao diện riêng, đồng bộ ngay khi mở (như khi tải trang).
async function openDevice(storage, cloud) {
  const dom = new JSDOM('<!doctype html><main id="main"></main>', { url: 'https://site.test/' });
  const app = mountApp(dom.window.document.getElementById('main'), {
    storage, page: 'planner', win: dom.window, now: () => new Date(2026, 10, 16, 9, 0, 0), cloud,
  });
  await settle();
  app.dispose();
  return storage;
}

// Thêm một việc trên máy, như khi người dùng sửa: ghi state với mốc máy (updated = giờ máy).
function addTaskOn(storage, title) {
  const cur = storage.getItem(KEY) ? L.normalizeState(JSON.parse(storage.getItem(KEY))) : L.emptyState();
  const next = L.addTask(cur, { title, course: 'toan', date: DAY });
  storage.setItem(KEY, JSON.stringify({ ...next, updated: new Date().toISOString() }));
}

const titlesOn = storage => (JSON.parse(storage.getItem(KEY)).tasks || []).map(t => t.title).sort();

test('hai máy: máy chậm giờ vẫn đẩy được việc mới, máy kia nhận đủ', async () => {
  const { docs, cloud } = fakeServer();
  const a = memStorage(), b = memStorage();

  addTaskOn(a, 'Toán A');
  await openDevice(a, cloud);                       // A đẩy lên lần đầu
  assert.deepEqual(docs[UID].state && JSON.parse(docs[UID].state).tasks.map(t => t.title), ['Toán A']);

  await openDevice(b, cloud);                       // B chưa có gì: kéo về
  assert.deepEqual(titlesOn(b), ['Toán A']);

  addTaskOn(b, 'Lý B');                             // B sửa rồi mở lại: đẩy lên
  await openDevice(b, cloud);
  assert.deepEqual(JSON.parse(docs[UID].state).tasks.map(t => t.title).sort(), ['Lý B', 'Toán A']);

  await openDevice(a, cloud);                       // A mở lại: kéo việc của B về
  assert.deepEqual(titlesOn(a), ['Lý B', 'Toán A']);
});

test('không ai sửa thì không ghi lại lên máy chủ', async () => {
  const { docs, cloud } = fakeServer();
  const a = memStorage();
  addTaskOn(a, 'Hoá');
  await openDevice(a, cloud);
  const before = docs[UID].updatedAt;
  await openDevice(a, cloud);
  await openDevice(a, cloud);
  assert.equal(docs[UID].updatedAt, before, 'mốc server không đổi khi không có thay đổi');
});

test('đám mây đổi trong khi máy đang offline và máy có sửa: bên mới hơn thắng, không im lặng mất', async () => {
  const { docs, cloud } = fakeServer();
  const a = memStorage(), b = memStorage();
  addTaskOn(a, 'Sinh');
  await openDevice(a, cloud);
  await openDevice(b, cloud);
  addTaskOn(b, 'Văn');                              // B sửa khi offline (chưa đẩy)
  // máy chủ nhận thay đổi khác từ A
  addTaskOn(a, 'Sử');
  await openDevice(a, cloud);
  // B quay lại online: có cả thay đổi trên máy lẫn trên đám mây, phải có một bên được giữ
  await openDevice(b, cloud);
  const got = titlesOn(b);
  assert.ok(got.includes('Sử') || got.includes('Văn'), 'ít nhất một bên được giữ: ' + got.join(','));
  assert.ok(got.includes('Sinh'), 'việc cũ không mất');
});
