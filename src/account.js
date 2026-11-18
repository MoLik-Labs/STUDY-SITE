/* =========================================================
   TÀI KHOẢN & ĐỒNG BỘ — tuỳ chọn, không bắt buộc
   ---------------------------------------------------------
   · Chế độ khách (mặc định) vẫn chạy hoàn toàn trên máy, như trước.
   · Đăng nhập bằng liên kết qua email hoặc Google, theo luồng PKCE.
     Trình duyệt chỉ giữ publishable key; bảo vệ dữ liệu bằng RLS trên
     Supabase. Không có secret key nào trong mã nguồn hay bản build.
   · Đồng bộ theo TỪNG KHOÁ dữ liệu cấp cao nhất (done, ans, note…): mỗi khoá
     là một dòng trong bảng user_state. Vnl9.sync lưu hash của bản đã đồng
     bộ, để chỉ gửi đúng phần đã đổi.
   · Không bao giờ ghi đè dữ liệu của app đang chạy trong bộ nhớ. Thay đổi từ
     thiết bị khác được giữ trong vnl9.remote và áp dụng khi tải lại trang,
     TRƯỚC khi app đọc kho lưu. Trong lúc đó việc đẩy lên bị tạm dừng.
   · Xung đột: khoá nào đang có sửa đổi chưa đồng bộ trên máy này thì giữ
     bản trên máy. Khi đăng nhập lần đầu, bản trên máy được sao lưu vào
     lịch sử (IndexedDB) trước khi lấy dữ liệu tài khoản.
   ========================================================= */
const Account = (() => {
  const SESSION_KEY = 'vnl9.session';
  const PKCE_KEY = 'vnl9.pkce';
  const BASE_KEY = 'vnl9.sync';     /* {khoá: hash bản đã đồng bộ} */
  const REMOTE_KEY = 'vnl9.remote'; /* thay đổi từ máy khác, chờ tải lại */
  const TIME_KEY = 'vnl9.synced';
  const PULL_KEY = 'vnl9.pulled';   /* mốc updated_at đã kéo về (ISO) */
  const PULL_SLACK = 60000;         /* lùi 60 giây: hai giao dịch commit lệch thứ tự không bị bỏ sót */
  const SKIP = ['prefs', 'pane', 'last', 'seenWelcome']; /* trạng thái riêng từng máy */
  const BATCH = 25;
  const PUSH_DELAY = 1500;
  const PULL_EVERY = 120000;
  const ERR_KEY = 'vnl9.acct_err';  /* lỗi cần hiện sau khi tải lại trang */
  const MSG_EXPIRED = 'Liên kết đăng nhập không hợp lệ hoặc đã hết hạn. Hãy gửi lại liên kết.';

  const cfg = () => (typeof SB_CONFIG !== 'undefined' ? SB_CONFIG : { url: '', key: '' });
  const enabled = () => !!(cfg().url && cfg().key);

  /* Ghi lại hàm gốc TRƯỚC khi bọc: đây là đường ghi không đồng bộ. */
  const rawWrite = AppStore.write;

  let session = null, timer = 0, running = false, again = false, refreshing = null, wiping = false;
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
  function normalize(j) {
    return {
      access_token: j.access_token,
      refresh_token: j.refresh_token,
      expires_at: j.expires_at || Math.floor(Date.now() / 1000) + (j.expires_in || 3600),
      user: { id: j.user.id, email: j.user.email || '' },
    };
  }
  function loadSession() {
    const s = get(SESSION_KEY);
    session = s && s.access_token && s.user && s.user.id ? s : null;
  }
  function setSession(s) { session = s; put(SESSION_KEY, s); }
  function clearSession() {
    session = null;
    [SESSION_KEY, BASE_KEY, REMOTE_KEY, TIME_KEY, PKCE_KEY, PULL_KEY].forEach(del);
  }

  /* ---------- HTTP tới Supabase (không có SDK, không có CDN) ---------- */
  async function http(path, o) {
    o = o || {};
    const headers = { apikey: cfg().key, 'Content-Type': 'application/json' };
    if (o.prefer) headers.Prefer = o.prefer;
    headers.Authorization = 'Bearer ' + (o.auth === false || !session ? cfg().key : session.access_token);
    const res = await fetch(cfg().url + path, {
      method: o.method || 'GET',
      headers,
      body: o.body === undefined ? undefined : JSON.stringify(o.body),
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }
    if (!res.ok) {
      const err = new Error((data && (data.msg || data.error_description || data.message || data.error)) || ('HTTP ' + res.status));
      err.status = res.status;
      throw err;
    }
    return data;
  }

  function refresh() {
    if (!session) return Promise.reject(new Error('chưa đăng nhập'));
    if (!refreshing) {
      refreshing = (async () => {
        try {
          const j = await http('/auth/v1/token?grant_type=refresh_token', {
            method: 'POST', auth: false, body: { refresh_token: session.refresh_token },
          });
          setSession(normalize(j));
        } catch (e) {
          if (e.status === 400 || e.status === 401 || e.status === 403) clearSession();
          throw e;
        } finally { refreshing = null; }
      })();
    }
    return refreshing;
  }

  /* Gọi có xác thực: làm mới token trước khi hết hạn, thử lại đúng một lần nếu 401. */
  async function call(path, o) {
    if (session && session.expires_at * 1000 - Date.now() < 60000) await refresh();
    try { return await http(path, o); }
    catch (e) {
      if (e.status === 401 && session) { await refresh(); return http(path, o); }
      throw e;
    }
  }

  /* ---------- PKCE ---------- */
  const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  async function newChallenge() {
    const verifier = b64u(crypto.getRandomValues(new Uint8Array(32)));
    const challenge = b64u(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
    put(PKCE_KEY, { v: verifier, at: Date.now() });
    return challenge;
  }
  const backUrl = () => location.origin + location.pathname;

  async function sendLink(email) {
    const challenge = await newChallenge();
    await http('/auth/v1/otp?redirect_to=' + encodeURIComponent(backUrl()), {
      method: 'POST', auth: false,
      body: { email: email, create_user: true, code_challenge: challenge, code_challenge_method: 's256' },
    });
  }

  async function signInGoogle() {
    const challenge = await newChallenge();
    location.assign(cfg().url + '/auth/v1/authorize?provider=google'
      + '&redirect_to=' + encodeURIComponent(backUrl())
      + '&code_challenge=' + challenge + '&code_challenge_method=s256');
  }

  /* Quay về từ liên kết email hoặc Google: đổi ?code= lấy phiên. */
  async function takeCallback() {
    const q = new URLSearchParams(location.search);
    const code = q.get('code');
    const failed = q.get('error') || q.get('error_code');
    if (!code && !failed) return;
    history.replaceState(null, '', location.pathname + '#/settings?s=acct');
    const fail = () => {
      put(ERR_KEY, MSG_EXPIRED);
      location.replace(backUrl() + '#/settings?s=acct');
    };
    if (failed) return fail();
    const pk = get(PKCE_KEY);
    del(PKCE_KEY);
    if (!pk || !pk.v || Date.now() - pk.at > 3600000) return fail();
    try {
      const j = await http('/auth/v1/token?grant_type=pkce', {
        method: 'POST', auth: false, body: { auth_code: code, code_verifier: pk.v },
      });
      setSession(normalize(j));
      await prepareFirstSync();
      /* Tải lại có chủ đích: áp dụng dữ liệu tài khoản TRƯỚC khi app đọc kho lưu. */
      location.replace(backUrl() + '#/settings?s=acct');
    } catch (e) {
      clearSession();
      fail();
    }
  }

  /* Lần đầu trên máy này: lấy dữ liệu từ đám mây, nhưng sao lưu bản trên máy trước. */
  async function prepareFirstSync() {
    const st = localState();
    del(PULL_KEY);
    const rows = await call('/rest/v1/user_state?select=key,value,updated_at&user_id=eq.' + session.user.id);
    if (!rows || !rows.length) { put(BASE_KEY, {}); return; } /* đám mây trống: đẩy hết lên sau */
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
    if (get(REMOTE_KEY)) return;           /* đang chờ tải lại: không đẩy bản cũ đè lên cloud */
    running = true;
    setSync('syncing');
    try {
      const st = localState();
      const base = get(BASE_KEY) || {};
      const changed = syncKeys(st).filter(k => base[k] !== hashOf(st[k]));
      for (let i = 0; i < changed.length; i += BATCH) {
        const slice = changed.slice(i, i + BATCH);
        await call('/rest/v1/user_state?on_conflict=user_id,key', {
          method: 'POST',
          prefer: 'resolution=merge-duplicates,return=minimal',
          body: slice.map(k => ({ user_id: session.user.id, key: k, value: st[k] === undefined ? null : st[k] })),
        });
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
      const since = mark ? '&updated_at=gt.' + encodeURIComponent(new Date(Date.parse(mark) - PULL_SLACK).toISOString()) : '';
      const rows = await call('/rest/v1/user_state?select=key,value,updated_at&user_id=eq.' + session.user.id + since);
      const remote = {};
      let newest = mark ? Date.parse(mark) : 0;
      (rows || []).forEach(r => {
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

  async function signOut() {
    try { if (session) await http('/auth/v1/logout', { method: 'POST' }); } catch (e) {}
    clearSession();
    lastError = '';
    setSync('idle');
    banner();
  }

  async function deleteAccount() {
    await call('/rest/v1/rpc/delete_my_account', { method: 'POST', body: {} });
    clearSession();
    setSync('idle');
  }

  /* Xoá dữ liệu học trên máy chủ, GIỮ tài khoản đăng nhập và hồ sơ (đặt rỗng).
     Chặn đồng bộ trong lúc xoá để không đẩy lại dữ liệu cũ. Nếu một bước lỗi,
     hàm ném lỗi và người gọi không xoá dữ liệu trên máy: người dùng thử lại. */
  const CLOUD_TABLES = ['user_state', 'lesson_progress', 'answers', 'notes', 'review_cards', 'layouts'];
  async function wipeCloud() {
    if (!session) return;
    wiping = true;
    try {
      clearTimeout(timer);
      /* đợi lần đẩy đang chạy kết thúc, nếu không nó sẽ ghi lại mốc cũ sau khi xoá */
      for (let i = 0; running && i < 400; i++) await new Promise(r => setTimeout(r, 25));
      const uid = session.user.id;
      for (const t of CLOUD_TABLES) {
        await call('/rest/v1/' + t + '?user_id=eq.' + uid, { method: 'DELETE', prefer: 'return=minimal' });
      }
      await call('/rest/v1/profiles?id=eq.' + uid, {
        method: 'PATCH', prefer: 'return=minimal',
        body: { display_name: null, grade: null, class_name: null },
      });
      /* đám mây giờ rỗng: mốc đồng bộ cũng rỗng, không còn gì để kéo về */
      put(BASE_KEY, {}); del(PULL_KEY); del(REMOTE_KEY);
      put(TIME_KEY, Date.now());
    } finally { wiping = false; }
  }

  async function loadProfile() {
    const r = await call('/rest/v1/profiles?select=display_name,grade&id=eq.' + session.user.id);
    return (r && r[0]) || {};
  }

  async function saveProfile(name, grade) {
    await call('/rest/v1/profiles?on_conflict=id', {
      method: 'POST',
      prefer: 'resolution=merge-duplicates,return=minimal',
      body: { id: session.user.id, display_name: name || null, grade: grade ? Number(grade) : null },
    });
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
              catch (e) { say('Không xoá được tài khoản lúc này. Thử lại sau.'); }
            }, { danger: true, okText: 'Xoá tài khoản' });
          return;
        }
      } catch (e) {
        say(e && e.status === 429 ? 'Bạn gửi quá nhiều yêu cầu. Thử lại sau ít phút.' : 'Có lỗi, thử lại sau.');
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
        say(e && e.status === 429 ? 'Đã gửi nhiều liên kết. Đợi khoảng một giờ rồi thử lại.' : 'Không gửi được. Kiểm tra email rồi thử lại.');
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
  if (enabled()) {
    takeCallback();
    if (session) setTimeout(pull, 1500);
    document.addEventListener('DOMContentLoaded', banner);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) pull(); });
    setInterval(() => { if (!document.hidden) pull(); }, PULL_EVERY);
  }

  return {
    mount, snapshot,
    enabled: () => enabled(),
    signedIn: () => !!session,
    wipeCloud,
  };
})();
