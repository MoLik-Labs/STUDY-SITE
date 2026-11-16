#!/usr/bin/env node
/**
 * tests/journal.js — hồi quy: nhật ký phiên bản phải được cắt còn JOURNAL_N mục.
 *
 * Lỗi cũ: idbClear() không trả Promise, nên `idbClear('journal').then(...)` ném
 * TypeError mỗi lần nhật ký vượt 20 mục. Nhật ký không bao giờ được cắt.
 * Test dùng một IndexedDB giả trong bộ nhớ (jsdom không có IndexedDB).
 */
'use strict';
const fs = require('fs');
const path = require('path');
let JSDOM, VirtualConsole;
try { ({ JSDOM, VirtualConsole } = require('jsdom')); }
catch (e) { console.error('✗ thiếu jsdom — chạy: npm ci'); process.exit(2); }

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* IndexedDB tối giản: đủ cho openDB / put / getAll / clear / transaction. */
function fakeIndexedDB() {
  const stores = {};
  const db = {
    objectStoreNames: { contains: n => n in stores },
    createObjectStore(n) { stores[n] = stores[n] || new Map(); return {}; },
    transaction(name) {
      const tx = { oncomplete: null, onerror: null, onabort: null };
      const m = () => stores[name];
      const os = {
        put(v, k) { m().set(k !== undefined ? k : v.at, v); const r = {}; setTimeout(() => r.onsuccess && r.onsuccess(), 0); return r; },
        get(k) { const r = {}; const v = m().get(k); setTimeout(() => { r.result = v; r.onsuccess && r.onsuccess(); }, 0); return r; },
        getAll() { const r = {}; const v = [...m().values()]; setTimeout(() => { r.result = v; r.onsuccess && r.onsuccess(); }, 0); return r; },
        clear() { m().clear(); },
      };
      setTimeout(() => tx.oncomplete && tx.oncomplete(), 0);
      return Object.assign(tx, { objectStore: () => os });
    },
  };
  return {
    stores,
    open() {
      const req = {};
      setTimeout(() => {
        req.result = db;
        if (req.onupgradeneeded) req.onupgradeneeded(); /* như trình duyệt: luôn chạy, handler tự kiểm tra contains() */
        if (req.onsuccess) req.onsuccess();
      }, 0);
      return req;
    },
  };
}

(async () => {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => errors.push(String(e && e.message || e)));
  const idb = fakeIndexedDB();
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', url: 'https://app.test/', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.scrollTo = () => {}; w.print = () => {};
      if (!w.matchMedia) w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
      if (!w.Element.prototype.scrollIntoView) w.Element.prototype.scrollIntoView = () => {};
      w.indexedDB = { open: () => idb.open() };
    },
  });
  const w = dom.window;
  await sleep(300);
  errors.length = 0;

  const checks = [];
  const ok = (name, cond, note) => checks.push({ name, pass: !!cond, note: note || '' });

  /* N+6 lần ghi bắt buộc, cách nhau > debounce → nhật ký phải được cắt về JOURNAL_N */
  const N = w.eval('JOURNAL_N');
  for (let i = 0; i < N + 6; i++) {
    w.eval("AppStore.write(Object.assign(AppStore.readSync().data || {}, { note: { n" + i + ": 'x' } }), { force: true })");
    await sleep(450); /* vượt debounce 400 ms của store, mỗi lần ghi tạo đúng một mục nhật ký */
  }
  await sleep(600);

  const journal = idb.stores.journal ? idb.stores.journal.size : -1;
  ok('nhật ký được cắt về JOURNAL_N mục', journal > 0 && journal <= N, 'còn ' + journal + ' mục');
  ok('không có lỗi JS khi cắt nhật ký', errors.length === 0, errors.join(' | '));

  let fail = 0;
  checks.forEach(c => { if (!c.pass) fail++; console.log((c.pass ? '  ✓ ' : '  ✗ ') + c.name + (!c.pass && c.note ? '  — ' + c.note : '')); });
  console.log('\n' + (checks.length - fail) + '/' + checks.length + ' bước đạt ' + (fail ? '✗' : '✓'));
  w.close();
  process.exit(fail ? 1 : 0);
})();
