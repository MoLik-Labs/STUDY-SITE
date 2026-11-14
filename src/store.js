/* =========================================================
   KHO LƯU BỀN — không phụ thuộc cache
   4 tầng:
     1. localStorage  : bản chính (đọc tức thì, đồng bộ)
     2. IndexedDB     : bản sao + LỊCH SỬ 20 phiên bản có giờ
     3. Cookie        : cấu hình + tiến độ gọn (sống qua cả khi xoá site data)
     4. Tệp .json     : người dùng tự tải về / nhập lại
   Ghi xoay vòng 3 bản dự phòng trong localStorage để hỏng 1 bản vẫn còn.
   ========================================================= */
const APP_KEY = 'vnl9.v2';
const BAK_KEYS = ['vnl9.b1', 'vnl9.b2', 'vnl9.b3'];
const PREFS_KEY = 'vnl9.prefs';
const JOURNAL_N = 20;
const COOKIE = 'vnl9core';

const AppStore = (() => {
  let db = null, dbReady = null, lastWrite = 0, pending = null, cookieT = 0;

  /* ---------- cookie ---------- */
  function setCookie(name, val, days) {
    try {
      const d = new Date(Date.now() + days * 864e5).toUTCString();
      document.cookie = name + '=' + encodeURIComponent(val) + '; expires=' + d + '; path=/; SameSite=Lax';
    } catch (e) {}
  }
  function getCookie(name) {
    try {
      const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
      return m ? decodeURIComponent(m[1]) : null;
    } catch (e) { return null; }
  }

  /* ---------- bản gọn để nhét vừa cookie 4 KB ---------- */
  function core(st) {
    const done = Object.keys(st.done || {}).filter(k => st.done[k]).join(',');
    return {
      v: 1,
      at: Date.now(),
      prefs: st.prefs || {},
      pomo: st.pomoCfg || {},
      goal: st.goal || 20,
      streak: st.days ? Object.keys(st.days).length : 0,
      days: st.done ? Object.keys(st.done).length : 0,
      done: done.slice(0, 1400),
      last: st.last || null
    };
  }

  /* ---------- IndexedDB ---------- */
  function openDB() {
    if (dbReady) return dbReady;
    dbReady = new Promise(res => {
      if (!('indexedDB' in window)) return res(null);
      let req;
      try { req = indexedDB.open('vnl9', 1); } catch (e) { return res(null); }
      req.onupgradeneeded = () => {
        const d = req.result;
        if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv');
        if (!d.objectStoreNames.contains('journal')) d.createObjectStore('journal', { keyPath: 'at' });
      };
      req.onsuccess = () => { db = req.result; res(db); };
      req.onerror = () => res(null);
      setTimeout(() => res(db), 1200);
    });
    return dbReady;
  }
  function idbPut(store, val, key) {
    openDB().then(d => {
      if (!d) return;
      try {
        const tx = d.transaction(store, 'readwrite');
        const os = tx.objectStore(store);
        if (key === undefined) os.put(val);
        else os.put(val, key);
      } catch (e) {}
    });
  }
  function idbGet(store, key) {
    return openDB().then(d => new Promise(res => {
      if (!d) return res(null);
      try {
        const req = d.transaction(store, 'readonly').objectStore(store).get(key);
        req.onsuccess = () => res(req.result || null);
        req.onerror = () => res(null);
      } catch (e) { res(null); }
    }));
  }
  function idbAll(store) {
    return openDB().then(d => new Promise(res => {
      if (!d) return res([]);
      try {
        const req = d.transaction(store, 'readonly').objectStore(store).getAll();
        req.onsuccess = () => res(req.result || []);
        req.onerror = () => res([]);
      } catch (e) { res([]); }
    }));
  }
  function idbClear(store) {
    openDB().then(d => {
      if (!d) return;
      try { d.transaction(store, 'readwrite').objectStore(store).clear(); } catch (e) {}
    });
  }

  /* ---------- ghi ---------- */
  function write(state, opts) {
    opts = opts || {};
    const now = Date.now();
    let raw;
    try { raw = JSON.stringify(state); } catch (e) { return; }

    /* localStorage: bản chính + xoay vòng 3 bản dự phòng (mỗi 20 giây)
       Phải ĐỌC bản cũ TRƯỚC khi ghi đè, nếu không cả 3 bản dự phòng sẽ
       trỏ về cùng một nội dung mới và lưới an toàn coi như không có. */
    try {
      const prev = localStorage.getItem(APP_KEY);
      if (now - lastWrite > 20000 && prev && prev !== raw) {
        lastWrite = now;
        /* đẩy chuỗi bản cũ xuống: b1 ← b2, b0 ← b1, b0 ← prev */
        const old0 = localStorage.getItem(BAK_KEYS[0]);
        const old1 = localStorage.getItem(BAK_KEYS[1]);
        if (old0) localStorage.setItem(BAK_KEYS[1], old0);
        if (old1) localStorage.setItem(BAK_KEYS[2], old1);
        localStorage.setItem(BAK_KEYS[0], prev);
      }
      localStorage.setItem(APP_KEY, raw);
    } catch (e) {}

    /* cookie: phần lõi, chỉ ghi mỗi 4 giây */
    if (now - cookieT > 4000 || opts.force) {
      cookieT = now;
      try { setCookie(COOKIE, JSON.stringify(core(state)), 400); } catch (e) {}
    }

    /* IndexedDB: bản sao + lịch sử (gộp 60 giây/lần để không phình) */
    clearTimeout(pending);
    pending = setTimeout(() => {
      idbPut('kv', raw, 'state');
      if (now - (write._lastJournal || 0) > 60000 || opts.force) {
        write._lastJournal = now;
        idbPut('journal', { at: now, raw, note: opts.note || 'tự động' });
        idbAll('journal').then(rows => {
          rows.sort((a, b) => a.at - b.at);
          while (rows.length > JOURNAL_N) idbClear('journal').then(() => {
            rows.slice(-JOURNAL_N).forEach(r => idbPut('journal', r));
          });
        });
      }
    }, 400);
  }

  /* ---------- đọc ---------- */
  function parse(raw) {
    try { const o = JSON.parse(raw); return o && typeof o === 'object' ? o : null; }
    catch (e) { return null; }
  }
  function readSync() {
    let main = parse(localStorage.getItem(APP_KEY));
    if (main) return { data: main, from: 'máy này' };
    for (let i = 0; i < BAK_KEYS.length; i++) {
      const b = parse(localStorage.getItem(BAK_KEYS[i]));
      if (b) return { data: b, from: 'bản dự phòng ' + (i + 1) };
    }
    const c = parse(getCookie(COOKIE));
    if (c) return { data: c, from: 'cookie', partial: true };
    return { data: null, from: 'trống' };
  }
  function readAsync() {
    return idbGet('kv', 'state').then(raw => parse(raw));
  }
  function journal() { return idbAll('journal'); }

  function backupNow(state, note) { write(state, { force: true, note: note || 'thủ công' }); }

  function exportFile(state) {
    const blob = new Blob([JSON.stringify({ app: 'vat-li-9', v: 1, at: Date.now(), state }, null, 1)],
      { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const d = new Date();
    a.download = 'vat-li-9-' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') +
      String(d.getDate()).padStart(2, '0') + '-' + String(d.getHours()).padStart(2, '0') + String(d.getMinutes()).padStart(2, '0') + '.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  function importText(txt) {
    const o = parse(txt);
    if (!o) return null;
    const s = o.state || o;
    if (!s || typeof s !== 'object' || (!s.ans && !s.done && !s.prefs)) return null;
    return s;
  }

  function status() {
    let ls = 0, bak = 0;
    try { ls = (localStorage.getItem(APP_KEY) || '').length; } catch (e) {}
    try { bak = BAK_KEYS.map(k => (localStorage.getItem(k) || '').length).filter(Boolean).length; } catch (e) {}
    const ck = getCookie(COOKIE);
    return { ls, bak, cookie: ck ? ck.length : 0, idb: !!db };
  }

  function clearAll() {
    try { [APP_KEY].concat(BAK_KEYS).forEach(k => localStorage.removeItem(k)); } catch (e) {}
    setCookie(COOKIE, '', -1);
    idbClear('kv'); idbClear('journal');
  }

  /* ghi nốt khi rời trang */
  window.addEventListener('pagehide', () => { if (write._state) write(write._state, { force: true, note: 'rời trang' }); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && write._state) write(write._state, { force: true, note: 'ẩn tab' });
  });

  return { write, readSync, readAsync, journal, backupNow, exportFile, importText, status, clearAll, core,
    remember: s => { write._state = s; } };
})();
