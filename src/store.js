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

/* Tệp sao lưu lớn hơn mức này thì từ chối ngay trước khi JSON.parse —
   một tệp 200 MB làm treo tab chứ không phải "dữ liệu của bạn".
   Dữ liệu thật của người dùng nặng nhất khoảng 1–2 MB, nên 4 MB là rộng rãi. */
const MAX_IMPORT = 4 * 1024 * 1024;
/* Chỉ những khoá này được nhập từ tệp. Danh sách trắng, không phải danh sách
   đen: mọi thứ khác (kể cả __proto__, constructor) bị bỏ luôn tại cửa. */
/* Gồm cả dữ liệu học do người dùng tạo (sổ điểm, thời khoá biểu, ôn tập, kế hoạch tuần,
   đấu trường, khám phá). Thiếu khoá nào thì khoá đó không bao giờ được đồng bộ, không báo lỗi. */
const SAFE_KEYS = ['done', 'watched', 'ans', 'mine', 'note', 'runs', 'days', 'calc', 'book',
  'sheet', 'music', 'pomo', 'build', 'buildName', 'lab', 'cir', 'sim', 'school', 'pane', 'last', 'exam',
  'goal', 'doneAt', 'prefs', 'pomoCfg', 'seenWelcome',
  'grades', 'sched', 'study', 'weekly', 'game', 'explore'];
const UNSAFE_KEY = /^(__proto__|prototype|constructor)$/;

/* Sao chép sâu có kiểm soát: bỏ khoá nguy hiểm, chặn vòng lặp, chặn độ sâu
   và số nút để một tệp độc không làm nổ bộ nhớ. */
function sanitize(v, depth, budget) {
  if (v === null) return null;
  const t = typeof v;
  if (t === 'string') return v.length > 100000 ? v.slice(0, 100000) : v;
  if (t === 'number') return isFinite(v) ? v : 0;
  if (t === 'boolean') return v;
  if (t !== 'object') return undefined;
  if (depth > 8 || budget.n-- <= 0) return undefined;
  if (Array.isArray(v)) {
    const out = [];
    const n = Math.min(v.length, 20000);
    for (let i = 0; i < n; i++) {
      const c = sanitize(v[i], depth + 1, budget);
      if (c !== undefined) out.push(c);
    }
    return out;
  }
  const out = {};
  const keys = Object.keys(v);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (UNSAFE_KEY.test(k) || k.length > 120) continue;
    const c = sanitize(v[k], depth + 1, budget);
    if (c !== undefined) out[k] = c;
  }
  return out;
}

const AppStore = (() => {
  let db = null, dbReady = null, lastWrite = 0, pending = null, cookieT = 0;

  /* Báo cho giao diện biết kho lưu đang có sự cố. store.js chạy trước app.js
     nên không gọi thẳng toast() được; phát sự kiện để app.js bắt. */
  let lastNotify = 0;
  function notify(kind) {
    const now = Date.now();
    if (now - lastNotify < 30000) return;
    lastNotify = now;
    try {
      document.dispatchEvent(new CustomEvent('store:issue', { detail: { kind: kind } }));
    } catch (e) {}
  }

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
  /* Trả về Promise, resolve khi giao dịch xong. Trước đây hàm này không trả
     gì, nên `idbClear('journal').then(...)` ở dưới ném TypeError mỗi lần nhật
     ký vượt 20 mục: nhật ký không bao giờ được cắt và IndexedDB phình mãi. */
  function idbClear(store) {
    return openDB().then(d => new Promise(res => {
      if (!d) return res();
      try {
        const tx = d.transaction(store, 'readwrite');
        tx.objectStore(store).clear();
        tx.oncomplete = () => res();
        tx.onerror = tx.onabort = () => res();
      } catch (e) { res(); }
    }));
  }

  /* ---------- ghi ---------- */
  /* Ghi. Trả về true/false để nơi gọi biết được là đã ghi hay chưa —
     trước đây hàm này không trả gì và nuốt mọi lỗi, nên khi localStorage
     đầy thì người dùng vẫn thấy "Đã lưu" trong khi không có gì được lưu. */
  /* Bảo đảm một trường đúng kiểu. `ans` phải là object chứ không phải null,
     `mine` phải là mảng chứ không phải chuỗi — nếu không thì `Object.keys(x)`
     hay `x.y[id]` ném lỗi ở tận nơi khác (đã gặp thật: tệp có "done":null làm
     trắng cả trang vì doneCount() đọc state.done[id]). */
  function coerce(state) {
    const MAPS = ['done', 'watched', 'ans', 'doneAt', 'prefs', 'pomoCfg', 'note', 'days', 'school'];
    const ARRS = ['mine', 'runs', 'book'];
    MAPS.forEach(k => {
      if (state[k] === null || state[k] === undefined) { state[k] = {}; return; }
      if (typeof state[k] !== 'object' || Array.isArray(state[k])) state[k] = {};
    });
    ARRS.forEach(k => {
      if (!Array.isArray(state[k])) state[k] = [];
    });
    return state;
  }

  function write(state, opts) {
    opts = opts || {};
    const now = Date.now();
    let raw;
    try { raw = JSON.stringify(state); } catch (e) { return false; }

    /* localStorage: bản chính + xoay vòng 3 bản dự phòng.
       Phải ĐỌC bản cũ TRƯỚC khi ghi đè, nếu không cả 3 bản dự phòng sẽ trỏ
       về cùng một nội dung mới và lưới an toàn coi như không có.
       Vòng xoay được "mồi" ngay khi chưa có bản dự phòng nào: nếu chỉ dựa
       vào mốc 20 giây thì một phiên làm việc ngắn chưa kịp có bản sao, và
       một lần hỏng dữ liệu là mất trắng. */
    let ok = true;
    try {
      const prev = localStorage.getItem(APP_KEY);
      if (prev && prev !== raw && (!localStorage.getItem(BAK_KEYS[0]) || now - lastWrite > 20000)) {
        lastWrite = now;
        const old0 = localStorage.getItem(BAK_KEYS[0]);
        const old1 = localStorage.getItem(BAK_KEYS[1]);
        if (old0) localStorage.setItem(BAK_KEYS[1], old0);
        if (old1) localStorage.setItem(BAK_KEYS[2], old1);
        localStorage.setItem(BAK_KEYS[0], prev);
      }
      localStorage.setItem(APP_KEY, raw);
      write._fail = null;
    } catch (e) {
      /* Hết chỗ. Cứu bằng cách bỏ 3 bản dự phòng cũ rồi ghi lại bản chính —
         bản chính là thứ được đọc khi mở app, dự phòng là thứ bỏ được. */
      ok = false;
      try {
        BAK_KEYS.forEach(k => localStorage.removeItem(k));
        localStorage.setItem(APP_KEY, raw);
        ok = true;
        write._fail = null;
      } catch (e2) {
        write._fail = { reason: 'quota', at: now, size: raw.length };
        notify('quota');
      }
    }

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
          if (rows.length <= JOURNAL_N) return;
          rows.sort((a, b) => a.at - b.at);
          /* Cắt một lần rồi ghi lại, thay vì mỗi vòng `while` lại xoá cả
             object store rồi chèn lại toàn bộ — 20 vòng như vậy cho một
             lần dọn. */
          const keep = rows.slice(-JOURNAL_N);
          idbClear('journal').then(() => keep.forEach(r => idbPut('journal', r)));
        });
      }
    }, 400);

    return ok;
  }

  /* ---------- đọc ---------- */
  function parse(raw) {
    try { const o = JSON.parse(raw); return o && typeof o === 'object' ? o : null; }
    catch (e) { return null; }
  }
  /* Mọi dữ liệu đọc lên đều đi qua coerce(): dữ liệu cũ, dữ liệu nhập từ
     máy khác, hay dữ liệu bị sửa tay đều có thể sai kiểu. Sửa một chỗ ở đây
     rẻ hơn nhiều so với rải `|| {}` khắp 40 trang. */
  function readSync() {
    const main = parse(localStorage.getItem(APP_KEY));
    if (main && typeof main === 'object') return { data: coerce(main), from: 'máy này' };
    for (let i = 0; i < BAK_KEYS.length; i++) {
      const b = parse(localStorage.getItem(BAK_KEYS[i]));
      if (b && typeof b === 'object') return { data: coerce(b), from: 'bản dự phòng ' + (i + 1) };
    }
    const c = parse(getCookie(COOKIE));
    if (c && typeof c === 'object') return { data: coerce(c), from: 'cookie', partial: true };
    return { data: null, from: 'trống' };
  }
  function readAsync() {
    return idbGet('kv', 'state').then(raw => {
      const o = parse(raw);
      return o && typeof o === 'object' ? coerce(o) : null;
    });
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

  /* Nhập từ tệp sao lưu. Trả về:
       null                      → tệp không dùng được (báo "sai định dạng")
       { state, dropped:[khoá] }  → dùng được; `dropped` để giao diện nói thật
                                    là tệp có phần không nhập được, thay vì
                                    im lặng bỏ rồi báo "thành công". */
  function importText(txt) {
    if (typeof txt !== 'string' || txt.length > MAX_IMPORT) return null;
    const o = parse(txt);
    if (!o) return null;
    const s = o.state || o;
    if (!s || typeof s !== 'object' || Array.isArray(s)) return null;
    const keys = Object.keys(s);
    if (!keys.some(k => SAFE_KEYS.indexOf(k) >= 0)) return null;

    const budget = { n: 200000 };
    const state = {};
    const dropped = [];
    keys.forEach(k => {
      if (SAFE_KEYS.indexOf(k) < 0) { dropped.push(k); return; }
      const clean = sanitize(s[k], 0, budget);
      if (clean === undefined) { dropped.push(k); return; }
      state[k] = clean;
    });
    if (!Object.keys(state).length) return null;
    coerce(state);
    return { state: state, dropped: dropped };
  }

  /* Gộp một bản nhập vào state đang chạy.
     - Tệp có `ans` thì THAY cả bảng câu trả lời, không trộn: id câu hỏi trùng
       nhau giữa hai máy mà trộn thì câu đúng của bản nhập bị câu sai cũ đè.
     - Không có thì giữ nguyên của máy, vì "không có trong tệp" khác với
       "đã xoá trong tệp". */
  function merge(state, imported) {
    const out = {};
    Object.keys(state || {}).forEach(k => { out[k] = state[k]; });
    Object.keys(imported || {}).forEach(k => {
      if (UNSAFE_KEY.test(k)) return;
      const v = imported[k];
      const isMap = v && typeof v === 'object' && !Array.isArray(v);
      const replaceWhole = (k === 'ans' || k === 'done' || k === 'prefs' ||
        k === 'doneAt' || k === 'pomoCfg' || k === 'watched');
      out[k] = (isMap && replaceWhole) ? v : (isMap && out[k] && typeof out[k] === 'object'
        ? Object.assign({}, out[k], v) : v);
    });
    out.__from = 'tệp sao lưu';
    out.__partial = false;
    return out;
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

  return { write, readSync, readAsync, journal, backupNow, exportFile, importText, merge, coerce, status,
    clearAll, core, remember: s => { write._state = s; },
    health: () => ({ fail: write._fail || null, backups: BAK_KEYS.filter(k => {
      try { return !!localStorage.getItem(k); } catch (e) { return false; }
    }).length }) };
})();
