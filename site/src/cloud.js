// Đám mây: Firebase Auth (liên kết qua email, Google) và Firestore.
// Module này KHÔNG import SDK Firebase. SDK được truyền vào qua `sdk` (xem firebase-sdk.js),
// nhờ vậy logic đăng nhập, đồng bộ và xoá dữ liệu kiểm thử được bằng SDK giả, và
// trình duyệt chỉ tải Firebase khi thật sự cần (khách không tải gì).
//
// Cấu trúc dữ liệu (xem docs/FIREBASE-SETUP.md và firestore.rules):
//   planners/{uid}          { state: "<JSON kế hoạch>", updatedAt: ISO }   — site kế hoạch học
//   users/{uid}             { displayName, className, grade, updatedAt }   — hồ sơ
//   users/{uid}/keys/{key}  { value: "<JSON>", updatedAt: ISO }            — dữ liệu Vật lí theo khoá
export const HINT_KEY = 'sf.account';      // {uid, email}: để biết đã đăng nhập trước khi SDK tải xong
export const LINK_KEY = 'sf.emailForSignIn'; // email đã nhập để gửi liên kết (đăng nhập trên cùng máy)
export const PENDING_KEY = 'sf.auth.pending'; // 'google' khi đang chờ quay lại từ Google
const UID = /^[A-Za-z0-9_-]{1,128}$/;
const MAX_STATE = 900_000;                 // Firestore giới hạn 1 MiB mỗi tài liệu
const RECENT_LOGIN_MS = 4 * 60 * 1000;     // Firebase yêu cầu đăng nhập trong ~5 phút để xoá tài khoản

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

// Mã lỗi Firebase → câu tiếng Việt. Không bao giờ hiện mã kỹ thuật cho người dùng.
const MESSAGES = {
  'auth/invalid-email': 'Email không hợp lệ.',
  'auth/missing-email': 'Hãy nhập email.',
  'auth/too-many-requests': 'Gửi quá nhiều yêu cầu. Thử lại sau vài phút.',
  'auth/network-request-failed': 'Không có mạng. Dữ liệu vẫn được giữ trên máy.',
  'auth/invalid-action-code': 'Liên kết đăng nhập không hợp lệ hoặc đã dùng. Hãy gửi lại liên kết.',
  'auth/expired-action-code': 'Liên kết đăng nhập đã hết hạn. Hãy gửi lại liên kết.',
  'auth/user-disabled': 'Tài khoản này đã bị khoá.',
  'auth/operation-not-allowed': 'Cách đăng nhập này chưa được bật trong Firebase.',
  'auth/unauthorized-domain': 'Tên miền này chưa được thêm vào Authorized domains của Firebase.',
  'auth/requires-recent-login': 'Vì bảo mật, hãy đăng xuất, đăng nhập lại rồi xoá tài khoản ngay.',
  'auth/popup-closed-by-user': 'Đăng nhập bị huỷ.',
  'permission-denied': 'Không có quyền đọc hoặc ghi dữ liệu. Kiểm tra quy tắc Firestore.',
  'unavailable': 'Máy chủ tạm thời không sẵn sàng. Thử lại sau.',
  'resource-exhausted': 'Vượt hạn mức miễn phí hôm nay. Thử lại vào ngày mai.',
  'timeout': 'Quá thời gian chờ. Kiểm tra mạng rồi thử lại.',
};
export function friendlyError(code) {
  return MESSAGES[code] || 'Có lỗi khi kết nối. Thử lại sau.';
}

function codeOf(err) {
  if (err && typeof err.code === 'string') return err.code;
  return '';
}

function withTimeout(promise, ms) {
  let timer = 0;
  const limit = new Promise((_, reject) => {
    timer = setTimeout(() => reject(Object.assign(new Error('timeout'), { code: 'timeout' })), ms);
  });
  return Promise.race([promise, limit]).finally(() => clearTimeout(timer));
}

export function createCloud({ config, sdk, storage, now = () => Date.now(), redirectTo = '', timeoutMs = 15000 } = {}) {
  const enabled = !!(config && config.projectId && config.apiKey && sdk);
  let user = null;               // { uid, email } khi đã đăng nhập
  let emailLinkHref = '';        // liên kết email đang chờ xác nhận email (khi máy khác mở)
  let unsubscribe = null;

  function setHint(u) {
    try {
      if (!storage) return;
      if (u) storage.setItem(HINT_KEY, JSON.stringify({ uid: u.uid, email: u.email || '' }));
      else storage.removeItem(HINT_KEY);
    } catch { /* không ghi được thì lần sau SDK tự kiểm tra */ }
  }
  function getItem(k) { try { return storage ? storage.getItem(k) : null; } catch { return null; } }
  function setItem(k, v) { try { if (storage) storage.setItem(k, v); } catch { /* bỏ qua */ } }
  function delItem(k) { try { if (storage) storage.removeItem(k); } catch { /* bỏ qua */ } }

  function requireUid(uid) {
    if (!UID.test(String(uid || ''))) throw new Error('Mã tài khoản không hợp lệ.');
    return uid;
  }
  function requireUser() {
    if (!user) throw new Error('Chưa đăng nhập.');
    return user;
  }
  // Giữ mã lỗi (code) để lớp bọc ngoài vẫn nhận ra lỗi gốc.
  function fail(err) {
    const code = codeOf(err);
    return Object.assign(new Error(friendlyError(code)), { code });
  }
  async function op(promise) {
    try {
      return await withTimeout(promise, timeoutMs);
    } catch (err) {
      throw fail(err);
    }
  }

  function setUser(u) {
    user = u ? { uid: u.uid, email: u.email || '' } : null;
    setHint(user);
  }

  const api = {
    enabled,

    // Gọi một lần khi tải trang. Xử lý liên kết email hoặc quay lại từ Google, rồi đồng bộ
    // trạng thái đăng nhập với SDK. Trả về null hoặc {ok, text, needEmail?}.
    async init(href) {
      if (!enabled) return null;
      let notice = null;
      try {
        if (!unsubscribe && sdk.onUser) unsubscribe = sdk.onUser(u => { if (!u) { user = null; setHint(null); } });
        const current = await withTimeout(sdk.authReady(), timeoutMs);
        setUser(current);
        if (sdk.isEmailLink(href || '')) {
          const email = getItem(LINK_KEY) || '';
          if (email) {
            notice = await api.finishEmailLink(email, href);
          } else {
            emailLinkHref = href;
            notice = { ok: false, needEmail: true, text: 'Nhập email bạn đã dùng để nhận liên kết, để hoàn tất đăng nhập.' };
          }
        } else if (getItem(PENDING_KEY) === 'google') {
          delItem(PENDING_KEY);
          const u = await op(sdk.finishRedirect());
          if (u) {
            setUser(u);
            notice = { ok: true, text: 'Đã đăng nhập bằng ' + (u.email || 'Google') + '.' };
          }
        }
      } catch (err) {
        if (codeOf(err) === 'auth/requires-recent-login') throw err;
        notice = { ok: false, text: 'Không xác nhận được tài khoản: ' + fail(err).message };
      }
      return notice;
    },

    async finishEmailLink(email, href) {
      const clean = String(email || '').trim();
      const link = href || emailLinkHref;
      if (!clean) return { ok: false, needEmail: true, text: 'Hãy nhập email.' };
      try {
        const u = await op(sdk.completeEmailLink(clean, link));
        delItem(LINK_KEY);
        emailLinkHref = '';
        setUser(u);
        return { ok: true, text: 'Đã đăng nhập bằng ' + u.email + '.' };
      } catch (err) {
        return { ok: false, text: 'Không đăng nhập được: ' + fail(err).message };
      }
    },

    needsEmail() { return !!emailLinkHref; },

    signedIn: () => !!user,
    userId: () => (user ? user.uid : null),
    email: () => (user ? user.email : ''),

    // Gửi liên kết đăng nhập tới email. Firebase tự tạo tài khoản nếu chưa có.
    async sendEmailLink(email) {
      if (!enabled) throw new Error('Đám mây chưa được bật trên bản này.');
      const clean = String(email || '').trim();
      if (!clean) throw new Error('Hãy nhập email.');
      try {
        await op(sdk.sendEmailLink(clean, redirectTo));
      } catch (err) {
        throw fail(err);
      }
      setItem(LINK_KEY, clean);
    },

    // Chuyển sang Google. Trang sẽ rời đi và quay lại; init() nhận kết quả.
    async signInWithGoogle() {
      if (!enabled) throw new Error('Đám mây chưa được bật trên bản này.');
      setItem(PENDING_KEY, 'google');
      try {
        await sdk.startGoogle(redirectTo);
      } catch (err) {
        delItem(PENDING_KEY);
        throw fail(err);
      }
    },

    async signOut() {
      try {
        if (enabled) await op(sdk.signOut());
      } finally {
        user = null;
        setHint(null);
        delItem(LINK_KEY);
      }
    },

    async pullPlan(uid) {
      requireUid(uid);
      const data = await op(sdk.getDoc('planners/' + uid));
      if (!data || typeof data.state !== 'string') return null;
      let state;
      try { state = JSON.parse(data.state); } catch { throw new Error('Dữ liệu trên đám mây bị hỏng. Bản trên máy vẫn được giữ.'); }
      return { state, updated_at: data.updatedAt || '' };
    },

    async pushPlan(uid, state) {
      requireUid(uid);
      const json = JSON.stringify(state);
      if (json.length > MAX_STATE) throw new Error('Kế hoạch quá lớn để đồng bộ. Hãy xoá bớt mục cũ.');
      await op(sdk.setDoc('planners/' + uid, { state: json, updatedAt: new Date(now()).toISOString() }));
    },

    async deletePlan(uid) {
      requireUid(uid);
      await op(sdk.deleteDoc('planners/' + uid));
      await op(sdk.deleteCollection('users/' + uid + '/keys'));
    },

    async getProfile(uid) {
      requireUid(uid);
      const data = await op(sdk.getDoc('users/' + uid));
      return {
        displayName: data && typeof data.displayName === 'string' ? data.displayName : '',
        className: data && typeof data.className === 'string' ? data.className : '',
      };
    },

    async saveProfile(uid, { displayName, className }) {
      requireUid(uid);
      await op(sdk.setDoc('users/' + uid, {
        displayName: String(displayName || '').slice(0, 60),
        className: String(className || '').slice(0, 40),
        updatedAt: new Date(now()).toISOString(),
      }, { merge: true }));
    },

    // Xoá toàn bộ dữ liệu trước, rồi mới xoá tài khoản. Thứ tự này bắt buộc: sau khi
    // xoá tài khoản, Firestore không còn cho phép ghi dữ liệu của uid đó.
    async deleteAccount() {
      const u = requireUser();
      requireUid(u.uid);
      const last = sdk.lastSignInMs ? sdk.lastSignInMs() : now();
      if (now() - last > RECENT_LOGIN_MS) {
        throw new Error(friendlyError('auth/requires-recent-login'));
      }
      await op(sdk.deleteDoc('planners/' + u.uid));
      await op(sdk.deleteCollection('users/' + u.uid + '/keys'));
      await op(sdk.deleteDoc('users/' + u.uid));
      try {
        await op(sdk.deleteAuthUser());
      } catch (err) {
        throw fail(err);
      }
      user = null;
      setHint(null);
      delItem(LINK_KEY);
    },
  };
  return api;
}
