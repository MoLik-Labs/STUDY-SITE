/* =========================================================
   TÀI KHOẢN & ĐỒNG BỘ — tuỳ chọn, không bắt buộc
   ---------------------------------------------------------
   · Chế độ khách (mặc định) chạy hoàn toàn trên máy và không tải thêm gì.
   · Đăng nhập bằng liên kết qua email hoặc Google, qua Firebase Auth.
     Firebase chỉ được tải khi cần: có phiên trước đó, đang quay về từ liên kết,
     hoặc mở mục Tài khoản trong Cài đặt.
   · Dữ liệu nằm ở users/{uid}/keys/{khoá}, mỗi khoá một tài liệu. Chỉ gửi phần đã đổi.
     Quy tắc bảo mật nằm ở firestore.rules. Trình duyệt chỉ giữ khoá web công khai.
   · Không bao giờ ghi đè dữ liệu của app đang chạy trong bộ nhớ. Thay đổi từ thiết bị
     khác được giữ trong vnl9.remote và áp dụng khi tải lại trang, TRƯỚC khi app đọc kho lưu.
   · Xung đột: khoá nào đang có sửa đổi chưa đồng bộ trên máy này thì giữ bản trên máy.
     Khi đăng nhập lần đầu, bản trên máy được sao lưu vào lịch sử trước khi lấy dữ liệu tài khoản.
   ========================================================= */
const Account = (() => {
  const SESSION_KEY = 'vnl9.session'; /* {user:{id,email}}: không có token, Firebase giữ phiên */
  const PENDING_KEY = 'vnl9.pending'; /* 'google' khi đang chờ quay về từ Google */
  const EMAIL_KEY = 'vnl9.email';     /* email đã nhận liên kết, để hoàn tất trên cùng trình duyệt */
  const BASE_KEY = 'vnl9.sync';       /* {khoá: hash bản đã đồng bộ} */
  const REMOTE_KEY = 'vnl9.remote';   /* thay đổi từ máy khác, chờ tải lại */
  const TIME_KEY = 'vnl9.synced';
  const PULL_KEY = 'vnl9.pulled';     /* mốc updatedAt đã kéo về (ISO) */
  const PULL_SLACK = 60000;           /* lùi 60 giây: hai lần ghi lệch thứ tự không bị bỏ sót */
  const SKIP = ['prefs', 'pane', 'last', 'seenWelcome']; /* trạng thái riêng từng máy */
  const BATCH = 400;                  /* Firestore: một lô tối đa 500 thao tác */
  const PUSH_DELAY = 1500;
  const PULL_EVERY = 120000;
  const ERR_KEY = 'vnl9.acct_err';    /* lỗi cần hiện sau khi tải lại trang */
  const MSG_EXPIRED = 'Liên kết đăng nhập không hợp lệ hoặc đã hết hạn. Hãy gửi lại liên kết.';
  const MSG_SAME_BROWSER = 'Hãy mở liên kết trên cùng trình duyệt đã dùng để nhận email.';
  const MSG_RECENT = 'Vì bảo mật, hãy đăng xuất, đăng nhập lại rồi xoá tài khoản ngay.';
  const CFG_URL = '/assets/config.js';   /* Worker phục vụ lúc chạy từ biến môi trường */
  const SDK_URL = '/assets/firebase-sdk.js';

  let cloudCfg = null;
  const cfgReady = import(CFG_URL).then(m => { cloudCfg = m.CLOUD || null; return cloudCfg; }, () => null);
  const enabled = () => !!(cloudCfg && cloudCfg.apiKey);
  let sdkPromise = null, sdkNow = null;
  const sdkOf = () => sdkPromise || (sdkPromise = import(SDK_URL).then(m => (sdkNow = m.createSdk(cloudCfg))));
  /* Mã lỗi Firebase → câu tiếng Việt. Chỉ gọi sau khi SDK đã tải nên sdkNow có sẵn. */
  const friendly = e => (sdkNow ? sdkNow.friendly(e && e.code) : 'Có lỗi khi kết nối. Thử lại sau.');

  /* Ghi lại hàm gốc TRƯỚC khi bọc: đây là đường ghi không đồng bộ. */
  const rawWrite = AppStore.write;

  let session = null, timer = 0, running = false, again = false, wiping = false;
  let lastError = '', syncState = 'idle', host = null, lastSig = '';

  /* ---------- lưu trữ nhỏ ---------- */
  const get = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  const put = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const del = k => { try { localStorage.removeItem(k); } catch (e) {} };

  /* FNV-1a 32 bit: chỉ dùng để so sánh thay đổi, không dùng cho bảo mật. */
  function hashOf(v) {
    const s = JSON.stringify(v === undefined ? null : v);
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return (h >>> 0).toString(16) + ':' + s.length;
  }

  function localState() {
    try { const g = AppStore.readSync(); return (g && g.data) || {}; } catch (e) { return {}; }
  }
  /* Chỉ đồng bộ những khoá nằm trong danh sách trắng của store.js. */
  const syncKeys = st => Object.keys(st).filter(k => SAFE_KEYS.includes(k) && !SKIP.includes(k));

  /* ---------- phiên đăng nhập ---------- */
  function loadSession() {
    const s = get(SESSION_KEY);
    session = s && s.user && /^[A-Za-z0-9_-]{1,128}$/.test(String(s.user.id || '')) ? s : null;
  }
  function setSession(u) {
    session = { user: { id: u.uid, email: u.email || '' } };
    put(SESSION_KEY, session);
  }
  function clearSession() {
    session = null;
    [SESSION_KEY, BASE_KEY, REMOTE_KEY, TIME_KEY, PULL_KEY, PENDING_KEY, EMAIL_KEY].forEach(del);
  }
  const backUrl = () => location.origin + location.pathname;
  const uidOf = () => (session && session.user ? session.user.id : '');

  /* ---------- Firebase (qua firebase-sdk.js, tải lười) ---------- */
  async function sendLink(email) {
    const sdk = await sdkOf();
    try {
      await sdk.sendEmailLink(email, backUrl());
    } catch (e) {
      throw new Error(friendly(e));
    }
    put(EMAIL_KEY, email);
  }

  async function signInGoogle() {
    put(PENDING_KEY, 'google');
    const sdk = await sdkOf();
    try {
      await sdk.startGoogle(backUrl());
    } catch (e) {
      del(PENDING_KEY);
      throw new Error(friendly(e));
    }
  }

  /* Quay về từ liên kết email hoặc Google: nhận phiên rồi tải lại trang sạch. */
  async function takeCallback() {
    const href = location.href;
    const pending = get(PENDING_KEY) === 'google';
    const sdk = await sdkOf();
    const isLink = sdk.isEmailLink(href);
    if (!isLink && !pending) return;
    del(PENDING_KEY);
    history.replaceState(null, '', location.pathname + '#/settings?s=acct');
    const fail = msg => {
      put(ERR_KEY, msg);
      location.replace(backUrl() + '#/settings?s=acct');
    };
    try {
      let user = null;
      if (isLink) {
        const email = get(EMAIL_KEY);
        if (!email) return fail(MSG_SAME_BROWSER);
        user = await sdk.completeEmailLink(email, href);
      } else {
        user = await sdk.finishRedirect();
        if (!user) return;
      }
      setSession(user);
      del(EMAIL_KEY);
      await prepareFirstSync();
      /* Tải lại có chủ đích: áp dụng dữ liệu tài khoản TRƯỚC khi app đọc kho lưu. */
      location.replace(backUrl() + '#/settings?s=acct');
    } catch (e) {
      clearSession();
      fail(MSG_EXPIRED);
    }
  }

  async function signOut() {
    try { const sdk = await sdkOf(); await sdk.signOut(); } catch (e) { /* phiên có thể đã hết */ }
    clearSession();
    lastError = '';
    setSync('idle');
    banner();
  }

  /* Xoá toàn bộ dữ liệu của tài khoản (cả Vật lí lẫn kế hoạch học), rồi xoá tài khoản.
     Firebase chỉ cho xoá tài khoản khi vừa đăng nhập; kiểm tra trước để không xoá dở dang. */
  async function deleteAccount() {
    const sdk = await sdkOf();
    if (Date.now() - sdk.lastSignInMs() > 4 * 60 * 1000) throw new Error(MSG_RECENT);
    const uid = uidOf();
    try {
      await sdk.deleteDoc('planners/' + uid);
      await sdk.deleteCollection('users/' + uid + '/keys');
      await sdk.deleteDoc('users/' + uid);
      await sdk.deleteAuthUser();
    } catch (e) {
      throw new Error(friendly(e));
    }
    clearSession();
    setSync('idle');
  }

  /* ---------- dữ liệu ---------- */
  const parseVal = s => { try { return JSON.parse(s); } catch (e) { return null; } };

  async function listKeys(uid, since) {
    const sdk = await sdkOf();
    const docs = await sdk.listDocs('users/' + uid + '/keys', since || '');
    return docs.map(d => ({ key: d.id, value: parseVal(d.data.value), updated_at: d.data.updatedAt || '' }));
  }

  /* Lần đầu trên máy này: lấy dữ liệu từ đám mây, nhưng sao lưu bản trên máy trước. */
  async function prepareFirstSync() {
    const st = localState();
    del(PULL_KEY);
    const rows = await listKeys(uidOf());
    if (!rows.length) { put(BASE_KEY, {}); return; } /* đám mây trống: đẩy hết lên sau */
    const remote = {};
    rows.forEach(r => { if (SAFE_KEYS.includes(r.key)) remote[r.key] = r.value; });
    put(REMOTE_KEY, { keys: remote, force: true, at: Date.now() });
    put(BASE_KEY, {});
    const differs = Object.keys(remote).some(k => k in st && hashOf(st[k]) !== hashOf(remote[k]));
    if (differs) { try { AppStore.backupNow(st, 'trước khi đồng bộ tài khoản'); } catch (e) {} }
  }

  /* Áp dụng thay đổi chờ sẵn. Chạy đồng bộ khi nạp script, trước khi app đọc state. */
  function applyPending() {
    const p = get(REMOTE_KEY);
    if (!p || !p.keys) return;
    const st = localState();
    const base = get(BASE_KEY) || {};
    const next = Object.assign({}, st);
    Object.keys(p.keys).forEach(k => {
      if (!SAFE_KEYS.includes(k) || SKIP.includes(k)) return;
      const remoteH = hashOf(p.keys[k]);
      const localH = k in st ? hashOf(st[k]) : null;
      const baseH = k in base ? base[k] : null;
      if (p.force || localH === baseH) {
        if (localH !== remoteH) next[k] = sanitize(p.keys[k], 0, { n: 200000 });
        base[k] = remoteH;
      }
      /* còn lại: máy này có sửa chưa đồng bộ — giữ bản trên máy, lần đẩy sau sẽ gửi đi */
    });
    try { rawWrite(next); } catch (e) { return; }
    put(BASE_KEY, base);
    del(REMOTE_KEY);
  }

  /* ---------- đồng bộ ---------- */
  function setSync(s) { syncState = s; emit(); }

  async function push() {
    if (!session || wiping) return;
    if (running) { again = true; return; } /* ghi mới trong lúc đang đẩy: chạy lại ngay khi xong */
    if (get(REMOTE_KEY)) return;           /* đang chờ tải lại: không đẩy bản cũ đè lên đám mây */
    running = true;
    setSync('syncing');
    try {
      const sdk = await sdkOf();
      const uid = uidOf();
      const st = localState();
      const base = get(BASE_KEY) || {};
      const changed = syncKeys(st).filter(k => base[k] !== hashOf(st[k]));
      for (let i = 0; i < changed.length; i += BATCH) {
        const slice = changed.slice(i, i + BATCH);
        const at = new Date().toISOString();
        await sdk.setDocs(slice.map(k => ({
          path: 'users/' + uid + '/keys/' + k,
          data: { value: JSON.stringify(st[k] === undefined ? null : st[k]), updatedAt: at },
        })));
        slice.forEach(k => { base[k] = hashOf(st[k]); });
        put(BASE_KEY, base);
      }
      put(TIME_KEY, Date.now());
      lastError = '';
      setSync('ok');
    } catch (e) {
      lastError = 'Chưa đồng bộ được. Dữ liệu vẫn an toàn trên máy này và sẽ thử lại.';
      setSync('error');
    } finally {
      running = false;
      if (again) { again = false; schedule(); }
    }
  }

  async function pull() {
    if (!session || running || wiping || get(REMOTE_KEY)) return;
    running = true;
    try {
      const mark = get(PULL_KEY);
      const since = mark ? new Date(Date.parse(mark) - PULL_SLACK).toISOString() : '';
      const rows = await listKeys(uidOf(), since);
      const remote = {};
      let newest = mark ? Date.parse(mark) : 0;
      rows.forEach(r => {
        const t = Date.parse(r.updated_at || '');
        if (t > newest) newest = t;
        if (SAFE_KEYS.includes(r.key) && !SKIP.includes(r.key)) remote[r.key] = r.value;
      });
      if (newest) put(PULL_KEY, new Date(newest).toISOString());
      const st = localState();
      const base = get(BASE_KEY) || {};
      const diff = {};
      Object.keys(remote).forEach(k => {
        const remoteH = hashOf(remote[k]);
        const localH = k in st ? hashOf(st[k]) : null;
        const baseH = k in base ? base[k] : null;
        if (localH !== remoteH && localH === baseH) diff[k] = remote[k];
      });
      if (Object.keys(diff).length) put(REMOTE_KEY, { keys: diff, force: false, at: Date.now() });
      lastError = '';
    } catch (e) {
      lastError = 'Không kiểm tra được thay đổi từ tài khoản lúc này.';
    } finally { running = false; emit(); banner(); }
  }

  /* Banner toàn trang khi có thay đổi từ máy khác: không để người dùng học
     hàng giờ trên một bản cũ mà không biết. Bấm để tải lại và áp dụng. */
  function banner() {
    let b = document.getElementById('acctBanner');
    const want = !!get(REMOTE_KEY) && !!session;
    if (!want) { if (b) b.remove(); return; }
    if (b) return;
    b = document.createElement('div');
    b.id = 'acctBanner';
    b.className = 'acct-banner';
    b.setAttribute('role', 'status');
    b.innerHTML = '<span>Có thay đổi từ thiết bị khác.</span><button class="btn sm" type="button">Tải lại để áp dụng</button>';
    b.querySelector('button').addEventListener('click', () => location.reload());
    document.body.appendChild(b);
  }

  function schedule() {
    if (!session) return;
    clearTimeout(timer);
    timer = setTimeout(() => { push(); }, PUSH_DELAY);
  }

  /* Xoá dữ liệu học của Vật lí trên đám mây, GIỮ tài khoản và hồ sơ (đặt rỗng).
     Chặn đồng bộ trong lúc xoá để không đẩy lại dữ liệu cũ. Nếu một bước lỗi thì ném lỗi,
     và người gọi không xoá dữ liệu trên máy: người dùng thử lại. */
  async function wipeCloud() {
    if (!session) return;
    wiping = true;
    try {
      clearTimeout(timer);
      /* đợi lần đẩy đang chạy kết thúc, nếu không nó sẽ ghi lại mốc cũ sau khi xoá */
      for (let i = 0; running && i < 400; i++) await new Promise(r => setTimeout(r, 25));
      const sdk = await sdkOf();
      const uid = uidOf();
      await sdk.deleteCollection('users/' + uid + '/keys');
      await sdk.setDoc('users/' + uid, { displayName: '', grade: '' }, { merge: true });
      /* đám mây giờ rỗng: mốc đồng bộ cũng rỗng, không còn gì để kéo về */
      put(BASE_KEY, {});
      del(PULL_KEY);
      del(REMOTE_KEY);
      put(TIME_KEY, Date.now());
    } finally { wiping = false; }
  }

  async function loadProfile() {
    const sdk = await sdkOf();
    const d = await sdk.getDoc('users/' + uidOf());
    return {
      display_name: (d && d.displayName) || null,
      grade: d && d.grade ? Number(d.grade) || null : null,
    };
  }

  async function saveProfile(name, grade) {
    const sdk = await sdkOf();
    await sdk.setDoc('users/' + uidOf(), {
      displayName: String(name || '').slice(0, 60),
      grade: grade ? String(grade).slice(0, 40) : '',
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  }

  /* ---------- giao diện ---------- */
  function snapshot() {
    return {
      enabled: enabled(),
      signedIn: !!session,
      email: session ? session.user.email : '',
      pending: !!get(REMOTE_KEY),
      syncedAt: get(TIME_KEY) || 0,
      syncState: syncState,
      error: lastError || get(ERR_KEY) || '',
    };
  }

  const escH = s => String(s == null ? '' : s).replace(/[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function view(s) {
    if (!s.enabled) {
      return `<p class="acct-lead">Đồng bộ đám mây chưa bật trên bản này.</p>
        <p class="muted">Bạn vẫn dùng đầy đủ mọi tính năng ở chế độ khách: dữ liệu nằm trên máy này.</p>`;
    }
    if (!s.signedIn) {
      return `<p class="acct-lead">Đăng nhập để đồng bộ giữa các thiết bị.</p>
        <p class="muted">Không bắt buộc. Chế độ khách vẫn lưu mọi thứ trên máy này. Khi đăng nhập, chỉ lưu email, tên hiển thị, lớp và dữ liệu học.</p>
        <form class="acct-form" data-acct="mail">
          <label class="acct-field">Email
            <input type="email" name="email" required autocomplete="email" maxlength="254"></label>
          <button class="btn sm" type="submit">Gửi liên kết đăng nhập</button>
        </form>
        <button class="btn ghost sm" type="button" data-acct="google">Tiếp tục với Google</button>
        <p class="muted acct-msg" data-acct-msg role="status">${escH(s.error)}</p>`;
    }
    const when = s.syncedAt ? new Date(s.syncedAt).toLocaleString('vi-VN') : 'chưa có';
    const stateTxt = { syncing: 'Đang đồng bộ…', error: 'Chưa đồng bộ được', ok: 'Đã đồng bộ', idle: 'Sẵn sàng' }[s.syncState] || 'Sẵn sàng';
    return `<p class="acct-lead">Đã đăng nhập: <b>${escH(s.email)}</b></p>
      <p class="muted">${stateTxt} · lần cuối: ${escH(when)}</p>
      <p class="muted acct-privacy">Chỉ lưu email, tên hiển thị, lớp và dữ liệu học. Không quảng cáo, không chia sẻ cho bên thứ ba.</p>
      ${s.pending ? `<div class="acct-pending"><span>Có thay đổi từ thiết bị khác.</span>
        <button class="btn sm" type="button" data-acct="reload">Tải lại để áp dụng</button></div>` : ''}
      <div class="acct-row">
        <button class="btn sm" type="button" data-acct="sync">Đồng bộ ngay</button>
        <button class="btn ghost sm" type="button" data-acct="out">Đăng xuất</button>
      </div>
      <form class="acct-form acct-profile" data-acct="profile">
        <label class="acct-field">Tên hiển thị
          <input name="name" maxlength="60" autocomplete="nickname" data-acct-name></label>
        <label class="acct-field">Lớp
          <select name="grade" data-acct-grade>
            <option value="">Chưa chọn</option>
            ${Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}">Lớp ${i + 1}</option>`).join('')}
          </select></label>
        <button class="btn ghost sm" type="submit">Lưu hồ sơ</button>
      </form>
      <div class="acct-danger">
        <span>Xoá tài khoản sẽ xoá dữ liệu trên máy chủ. Dữ liệu trên máy này vẫn còn.</span>
        <button class="btn ghost sm" type="button" data-acct="delete">Xoá tài khoản trên máy chủ</button>
      </div>
      <p class="muted acct-msg" data-acct-msg role="status">${escH(s.error)}</p>`;
  }

  function say(text) {
    const m = host && host.querySelector('[data-acct-msg]');
    if (m) m.textContent = text;
  }

  function bind(el) {
    el.addEventListener('click', async ev => {
      const b = ev.target.closest('[data-acct]');
      if (!b) return;
      const what = b.dataset.acct;
      try {
        if (what === 'google') { say('Đang chuyển sang Google…'); await signInGoogle(); }
        if (what === 'sync') { await push(); say(syncState === 'error' ? lastError : 'Đã đồng bộ.'); }
        if (what === 'reload') { location.reload(); }
        if (what === 'out') { await signOut(); }
        if (what === 'delete') {
          uiConfirm('Xoá tài khoản', 'Xoá tài khoản và toàn bộ dữ liệu trên máy chủ? Dữ liệu trên máy này vẫn còn.',
            async () => {
              try { await deleteAccount(); render(true); }
              catch (e) { say(e && e.message ? e.message : 'Không xoá được tài khoản lúc này. Thử lại sau.'); }
            }, { danger: true, okText: 'Xoá tài khoản' });
          return;
        }
      } catch (e) {
        say(e && e.message ? e.message : 'Có lỗi, thử lại sau.');
      }
      if (what === 'out') render(true);
    });

    el.addEventListener('submit', async ev => {
      ev.preventDefault();
      const f = ev.target;
      try {
        if (f.dataset.acct === 'mail') {
          const email = f.elements.email.value.trim();
          say('Đang gửi…');
          await sendLink(email);
          say('Đã gửi liên kết. Mở email và bấm vào liên kết để đăng nhập.');
        }
        if (f.dataset.acct === 'profile') {
          await saveProfile(f.elements.name.value.trim(), f.elements.grade.value);
          say('Đã lưu hồ sơ.');
        }
      } catch (e) {
        say(e && e.message ? e.message : 'Không gửi được. Kiểm tra kết nối rồi thử lại.');
      }
    });
  }

  function render(force) {
    if (!host || !host.isConnected) return;
    const s = snapshot();
    const sig = JSON.stringify(Object.assign({}, s, { syncedAt: 0 }));
    if (!force && sig === lastSig) return;
    lastSig = sig;
    host.innerHTML = view(s);
    if (s.signedIn && enabled()) {
      loadProfile().then(p => {
        const n = host.querySelector('[data-acct-name]');
        const g = host.querySelector('[data-acct-grade]');
        if (n) n.value = p.display_name || '';
        if (g) g.value = p.grade ? String(p.grade) : '';
      }).catch(() => {});
    }
  }

  function emit() {
    if (host && host.isConnected) render(false);
  }

  function mount(el) {
    if (!el) return;
    host = el;
    bind(el);
    render(true);
    del(ERR_KEY);
  }


  /* ---------- khởi động ---------- */
  /* Bọc đường ghi: mỗi lần app lưu thì lên lịch đẩy (chỉ khi đã đăng nhập). */
  AppStore.write = function (state, opts) {
    const ok = rawWrite(state, opts);
    schedule();
    return ok;
  };

  loadSession();
  applyPending();
  if (get(ERR_KEY) && !location.hash.startsWith('#/settings')) del(ERR_KEY);

  /* Khách không có gì để đồng bộ: không tải Firebase, không gọi mạng. */
  const cloudWanted = () => new URLSearchParams(location.search).has('oobCode')
    || !!get(PENDING_KEY) || !!session || location.hash.startsWith('#/settings');
  cfgReady.then(() => {
    if (!enabled()) return;
    document.addEventListener('DOMContentLoaded', banner);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) pull(); });
    setInterval(() => { if (!document.hidden) pull(); }, PULL_EVERY);
    if (!cloudWanted()) return;
    (async () => {
      try {
        await takeCallback();
        if (session) {
          const sdk = await sdkOf();
          const u = await sdk.authReady();
          if (u) setSession(u); else clearSession();
          if (session) setTimeout(pull, 1500);
        }
      } catch (e) {
        clearSession();
      }
      emit();
      banner();
    })();
  });

  return {
    mount, snapshot,
    enabled: () => enabled(),
    signedIn: () => !!session,
    wipeCloud,
  };
})();
