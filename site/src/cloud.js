// Đám mây: Supabase Auth và REST qua fetch, không cần SDK. Chỉ dùng khoá công khai.
// Không có cấu hình thì enabled = false và mọi nơi gọi đều phải tự rẽ sang chế độ khách.
export const SESSION_KEY = 'sf.session.v1';
export const PLAN_TABLE = 'planner_states';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const REFRESH_MARGIN_MS = 60_000;

// Đọc phần #access_token=… mà Supabase trả về sau liên kết email hoặc Google.
export function parseAuthFragment(hash) {
  const raw = String(hash || '').replace(/^#/, '');
  if (!raw) return null;
  const p = new URLSearchParams(raw);
  const error = p.get('error_description') || p.get('error');
  if (error) return { error: error.replace(/\+/g, ' ') };
  const access = p.get('access_token');
  if (!access) return null;
  return {
    access_token: access,
    refresh_token: p.get('refresh_token') || '',
    expires_in: Number(p.get('expires_in')) || 3600,
  };
}

// Quyết định đồng bộ theo mốc thời gian của lần ghi cuối. Trả về 'pull' | 'push' | 'none'.
// Bên nào mới hơn thắng; bên còn lại được ghi đè (bản local được sao lưu trước khi kéo về).
export function decideSync(localUpdated, remoteUpdated) {
  const local = Date.parse(localUpdated);
  const remote = Date.parse(remoteUpdated);
  const hasLocal = Number.isFinite(local);
  const hasRemote = Number.isFinite(remote);
  if (!hasRemote) return hasLocal ? 'push' : 'none';
  if (!hasLocal) return 'pull';
  if (remote > local) return 'pull';
  if (remote < local) return 'push';
  return 'none';
}

export function friendlyError(status, data) {
  if (status === 429) return 'Gửi quá nhiều yêu cầu. Thử lại sau vài phút.';
  if (status === 401 || status === 403) return 'Phiên đăng nhập đã hết. Hãy đăng nhập lại.';
  const msg = data && (data.msg || data.error_description || data.message || data.error);
  return msg ? String(msg) : 'Máy chủ trả lỗi (' + status + ').';
}

export function createCloud({ config, fetchImpl, storage, now = () => Date.now(), redirectTo = '' } = {}) {
  const enabled = !!(config && config.url && config.key);
  const f = fetchImpl || ((...a) => globalThis.fetch(...a));

  function readSession() {
    if (!storage) return null;
    try {
      const s = JSON.parse(storage.getItem(SESSION_KEY) || 'null');
      return s && typeof s.access_token === 'string' && typeof s.expires_at === 'number' ? s : null;
    } catch {
      return null;
    }
  }
  function writeSession(s) {
    if (storage) storage.setItem(SESSION_KEY, JSON.stringify(s));
  }
  function clearSession() {
    if (storage) storage.removeItem(SESSION_KEY);
  }

  async function call(method, path, { body, token, prefer, auth = true } = {}) {
    if (!enabled) throw new Error('Đám mây chưa được bật trên bản này.');
    const headers = { apikey: config.key };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (prefer) headers.Prefer = prefer;
    if (auth) headers.Authorization = 'Bearer ' + (token || (await freshToken()));
    const res = await f(config.url + path, {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = { msg: text }; }
    if (!res.ok) {
      const err = new Error(friendlyError(res.status, data));
      err.status = res.status;
      throw err;
    }
    return data;
  }

  // Trả về access token còn hạn; làm mới bằng refresh token nếu sắp hết hạn.
  async function freshToken() {
    const s = readSession();
    if (!s) throw new Error('Chưa đăng nhập.');
    if (s.expires_at - REFRESH_MARGIN_MS > now()) return s.access_token;
    try {
      const data = await call('POST', '/auth/v1/token?grant_type=refresh_token', {
        body: { refresh_token: s.refresh_token }, auth: false,
      });
      writeSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: now() + (Number(data.expires_in) || 3600) * 1000,
        user_id: s.user_id,
        email: s.email,
      });
      return data.access_token;
    } catch (e) {
      clearSession();
      throw new Error('Phiên đăng nhập đã hết. Hãy đăng nhập lại.');
    }
  }

  async function fetchUser(token) {
    return call('GET', '/auth/v1/user', { token });
  }

  function requireUid() {
    const s = readSession();
    if (!s || !UUID.test(s.user_id || '')) throw new Error('Chưa đăng nhập.');
    return s.user_id;
  }

  const api = {
    enabled,
    signedIn: () => !!readSession(),
    userId: () => (readSession() || {}).user_id || null,
    email: () => (readSession() || {}).email || '',

    // Gửi liên kết đăng nhập tới email. Tự tạo tài khoản nếu chưa có.
    async sendMagicLink(email) {
      const to = encodeURIComponent(redirectTo);
      await call('POST', '/auth/v1/otp?redirect_to=' + to, { body: { email, create_user: true }, auth: false });
    },

    googleUrl() {
      return config.url + '/auth/v1/authorize?provider=google&redirect_to=' + encodeURIComponent(redirectTo);
    },

    // Xử lý #access_token sau khi người dùng quay lại từ email hoặc Google.
    // Trả về null (không có gì), {ok, text} hoặc {ok:false, text}.
    async handleCallback(hash) {
      const parsed = parseAuthFragment(hash);
      if (!parsed) return null;
      if (parsed.error) return { ok: false, text: 'Đăng nhập không thành công: ' + parsed.error };
      try {
        const user = await fetchUser(parsed.access_token);
        writeSession({
          access_token: parsed.access_token,
          refresh_token: parsed.refresh_token,
          expires_at: now() + parsed.expires_in * 1000,
          user_id: user.id,
          email: user.email || '',
        });
        return { ok: true, text: 'Đã đăng nhập' + (user.email ? ' bằng ' + user.email : '') + '.' };
      } catch (e) {
        clearSession();
        return { ok: false, text: 'Không xác nhận được tài khoản: ' + e.message };
      }
    },

    async signOut() {
      const s = readSession();
      if (s && enabled) {
        try { await call('POST', '/auth/v1/logout', { token: s.access_token, body: {} }); } catch { /* token có thể đã hết hạn */ }
      }
      clearSession();
    },

    clearSession,

    async pullPlan(uid) {
      if (!UUID.test(uid)) throw new Error('Mã tài khoản không hợp lệ.');
      const rows = await call('GET', `/rest/v1/${PLAN_TABLE}?select=state,updated_at&user_id=eq.${uid}`);
      return rows && rows[0] ? rows[0] : null;
    },

    async pushPlan(uid, state) {
      if (!UUID.test(uid)) throw new Error('Mã tài khoản không hợp lệ.');
      await call('POST', `/rest/v1/${PLAN_TABLE}?on_conflict=user_id`, {
        body: { user_id: uid, state, updated_at: state.updated || new Date(now()).toISOString() },
        prefer: 'resolution=merge-duplicates,return=minimal',
      });
    },

    async deletePlan(uid) {
      if (!UUID.test(uid)) throw new Error('Mã tài khoản không hợp lệ.');
      await call('DELETE', `/rest/v1/${PLAN_TABLE}?user_id=eq.${uid}`);
    },

    async getProfile(uid) {
      if (!UUID.test(uid)) throw new Error('Mã tài khoản không hợp lệ.');
      const rows = await call('GET', `/rest/v1/profiles?select=display_name,class_name&id=eq.${uid}`);
      return rows && rows[0] ? rows[0] : { display_name: '', class_name: '' };
    },

    async saveProfile(uid, { display_name, class_name }) {
      if (!UUID.test(uid)) throw new Error('Mã tài khoản không hợp lệ.');
      await call('POST', '/rest/v1/profiles?on_conflict=id', {
        body: {
          id: uid,
          display_name: String(display_name || '').slice(0, 60),
          class_name: String(class_name || '').slice(0, 40),
          updated_at: new Date(now()).toISOString(),
        },
        prefer: 'resolution=merge-duplicates,return=minimal',
      });
    },

    // Xoá tài khoản và mọi dữ liệu liên quan (RPC delete_my_account, có cascade).
    async deleteAccount() {
      requireUid();
      await call('POST', '/rest/v1/rpc/delete_my_account', { body: {} });
      clearSession();
    },
  };
  return api;
}
