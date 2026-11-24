// API v1 của site: đọc/ghi kế hoạch, việc cần làm và thẻ ôn tập.
//
// Bảo mật:
// - Xác thực bằng Firebase ID token (RS256, kiểm chữ ký theo khoá công khai của Google, iss/aud/exp/iat/auth_time/sub).
//   Tài khoản ẩn danh bị từ chối.
// - Mọi thao tác dữ liệu gọi Firestore REST bằng CHÍNH token của người dùng, nên quy tắc firestore.rules là lớp
//   bảo vệ thật sự. Worker không giữ khoá dịch vụ nào, không đọc dữ liệu của người khác.
// - Ghi có khoá lạc quan (currentDocument.updateTime): hai máy cùng sửa thì một bên nhận 409, không ghi đè âm thầm.
// - Không có CORS: chỉ client có token mới gọi được, trình duyệt bên ngoài bị chặn.
// - Lỗi trả mã máy đọc được, không lộ chi tiết nội bộ.
import { addCard, addTask, cardStats, dueCards, emptyState, normalizeState, reviewCard, removeCard, removeTask, toggleTask, parseIso } from './logic.js';

export const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
const STATE_MAX_CHARS = 900000;     // khớp firestore.rules
const SMALL_BODY = 16 * 1024;
const LARGE_BODY = 1024 * 1024;

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const authError = () => new ApiError(401, 'unauthenticated', 'Token không hợp lệ hoặc đã hết hạn.');

// ---------- Xác thực Firebase ID token ----------

let jwksCache = { keys: null, until: 0 };

export async function fetchJwks(fetchFn = fetch, now = Date.now()) {
  if (jwksCache.keys && now < jwksCache.until) return jwksCache.keys;
  const res = await fetchFn(JWKS_URL);
  if (!res.ok) throw new ApiError(503, 'upstream', 'Không tải được khoá xác thực.');
  const body = await res.json();
  const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get('cache-control') || '')?.[1]) || 3600;
  jwksCache = { keys: Array.isArray(body.keys) ? body.keys : [], until: now + Math.min(maxAge, 86400) * 1000 };
  return jwksCache.keys;
}

function b64urlBytes(s) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=');
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

function b64urlJson(s) {
  return JSON.parse(new TextDecoder().decode(b64urlBytes(s)));
}

export async function verifyIdToken(token, { projectId, keys, now = Date.now(), subtle = globalThis.crypto.subtle }) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3 || parts.some(p => !/^[A-Za-z0-9_-]+$/.test(p))) throw authError();
  let header;
  let payload;
  try {
    header = b64urlJson(parts[0]);
    payload = b64urlJson(parts[1]);
  } catch {
    throw authError();
  }
  // Chỉ chấp nhận RS256 với khoá có kid khớp. Không bao giờ chấp nhận alg "none" hay HS256.
  if (!header || header.alg !== 'RS256' || typeof header.kid !== 'string') throw authError();
  const jwk = (keys || []).find(k => k && k.kid === header.kid && k.kty === 'RSA');
  if (!jwk) throw authError();
  const key = await subtle.importKey('jwk', { kty: 'RSA', n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const signed = new TextEncoder().encode(parts[0] + '.' + parts[1]);
  const ok = await subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlBytes(parts[2]), signed);
  if (!ok) throw authError();

  const t = Math.floor(now / 1000);
  const skew = 60;
  if (payload.aud !== projectId || payload.iss !== 'https://securetoken.google.com/' + projectId) throw authError();
  if (!(typeof payload.exp === 'number' && payload.exp > t)) throw authError();
  if (!(typeof payload.iat === 'number' && payload.iat <= t + skew)) throw authError();
  if (!(typeof payload.auth_time === 'number' && payload.auth_time <= t + skew)) throw authError();
  if (typeof payload.sub !== 'string' || !payload.sub || payload.sub.length > 128) throw authError();
  if (payload.firebase && payload.firebase.sign_in_provider === 'anonymous') throw new ApiError(403, 'anonymous', 'Cần đăng nhập bằng tài khoản thật.');
  return { uid: payload.sub, email: typeof payload.email === 'string' ? payload.email : null, emailVerified: payload.email_verified === true };
}

// ---------- Firestore REST bằng token của người dùng ----------

function docName(pid, uid) {
  return `projects/${pid}/databases/(default)/documents/planners/${uid}`;
}

async function readPlan(pid, uid, token, fetchFn) {
  const res = await fetchFn(`https://firestore.googleapis.com/v1/${docName(pid, uid)}`, {
    headers: { Authorization: 'Bearer ' + token },
  });
  if (res.status === 404) return { state: emptyState(), updateTime: null, exists: false };
  if (res.status === 401 || res.status === 403) throw new ApiError(403, 'forbidden', 'Không có quyền đọc dữ liệu này.');
  if (!res.ok) throw new ApiError(502, 'upstream', 'Không đọc được dữ liệu, thử lại sau.');
  const doc = await res.json();
  const raw = doc.fields && doc.fields.state && doc.fields.state.stringValue;
  let state = emptyState();
  if (typeof raw === 'string') {
    try { state = normalizeState(JSON.parse(raw)); } catch { state = emptyState(); }
  }
  return { state, updateTime: doc.updateTime || null, exists: true };
}

async function writePlan(pid, uid, token, state, precondition, fetchFn) {
  const serialized = JSON.stringify(state);
  if (serialized.length > STATE_MAX_CHARS) throw new ApiError(413, 'too_large', 'Dữ liệu vượt giới hạn.');
  const write = {
    update: { name: docName(pid, uid), fields: { state: { stringValue: serialized } } },
    updateTransforms: [{ fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' }],
    currentDocument: precondition,
  };
  const res = await fetchFn(`https://firestore.googleapis.com/v1/projects/${pid}/databases/(default)/documents:commit`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ writes: [write] }),
  });
  if (res.status === 409 || res.status === 400) {
    // Firestore trả FAILED_PRECONDITION khi tài liệu đã đổi từ lúc đọc.
    const text = await res.text().catch(() => '');
    if (res.status === 409 || /FAILED_PRECONDITION|precondition/i.test(text)) {
      throw new ApiError(409, 'conflict', 'Dữ liệu vừa được sửa ở nơi khác. Đọc lại rồi thử lại.');
    }
    throw new ApiError(400, 'rejected', 'Dữ liệu không được chấp nhận.');
  }
  if (res.status === 401 || res.status === 403) throw new ApiError(403, 'forbidden', 'Không có quyền ghi dữ liệu này.');
  if (!res.ok) throw new ApiError(502, 'upstream', 'Không ghi được dữ liệu, thử lại sau.');
}

// Đọc - sửa - ghi có khoá lạc quan. mutate(state) trả về state mới (hoặc ném ApiError).
async function mutatePlan(ctx, mutate) {
  const current = await readPlan(ctx.projectId, ctx.uid, ctx.token, ctx.fetchFn);
  const next = mutate(current.state);
  const stamped = { ...next, updated: new Date(ctx.now()).toISOString() };
  const precondition = current.exists ? { updateTime: current.updateTime } : { exists: false };
  await writePlan(ctx.projectId, ctx.uid, ctx.token, stamped, precondition, ctx.fetchFn);
  return stamped;
}

// ---------- Tiện ích HTTP ----------

function json(body, status = 200, extra = {}) {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: Object.assign({
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Vary': 'Authorization',
      'X-Robots-Tag': 'noindex',
    }, extra),
  });
}

function fail(err) {
  if (err instanceof ApiError) {
    return json({ error: { code: err.code, message: err.message } }, err.status);
  }
  return json({ error: { code: 'internal', message: 'Lỗi không mong muốn.' } }, 500);
}

async function readJson(request, maxBytes) {
  const type = (request.headers.get('Content-Type') || '').split(';')[0].trim();
  if (type !== 'application/json') throw new ApiError(415, 'unsupported_media_type', 'Cần Content-Type: application/json.');
  const declared = Number(request.headers.get('Content-Length') || 0);
  if (declared > maxBytes) throw new ApiError(413, 'too_large', 'Nội dung quá lớn.');
  const text = await request.text();
  if (text.length > maxBytes) throw new ApiError(413, 'too_large', 'Nội dung quá lớn.');
  try {
    const body = JSON.parse(text);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('not object');
    return body;
  } catch {
    throw new ApiError(400, 'bad_json', 'JSON không hợp lệ.');
  }
}

// Ngày "hôm nay" theo múi giờ người dùng: utc_offset tính bằng phút (ví dụ Việt Nam: 420).
export function todayFor(url, now) {
  const raw = url.searchParams.get('utc_offset');
  let offset = 0;
  if (raw !== null) {
    if (!/^-?\d{1,4}$/.test(raw)) throw new ApiError(400, 'bad_param', 'utc_offset phải là số phút.');
    offset = Math.max(-840, Math.min(840, Number(raw)));
  }
  return new Date(now + offset * 60000).toISOString().slice(0, 10);
}

function cardView(c) {
  return { id: c.id, front: c.front, back: c.back, course: c.course, box: c.box + 1, due: c.due };
}

function taskView(t) {
  return { id: t.id, title: t.title, course: t.course, date: t.date, done: t.done };
}

// ---------- Định tuyến ----------

const ROUTES = [
  { method: 'GET', re: /^\/api\/v1\/me$/, run: (ctx) => ({ uid: ctx.user.uid, email: ctx.user.email, emailVerified: ctx.user.emailVerified }) },
  {
    method: 'GET', re: /^\/api\/v1\/plan$/,
    run: async (ctx) => {
      const { state } = await readPlan(ctx.projectId, ctx.uid, ctx.token, ctx.fetchFn);
      return { state };
    },
  },
  {
    method: 'PUT', re: /^\/api\/v1\/plan$/, body: LARGE_BODY,
    run: async (ctx, body) => {
      const incoming = normalizeState(body.state);
      const current = await readPlan(ctx.projectId, ctx.uid, ctx.token, ctx.fetchFn);
      // Ghi đè có kiểm tra: client phải gửi mốc 'updated' đã đọc. Server mới hơn thì từ chối.
      const base = typeof body.base === 'string' ? body.base : null;
      if (current.state.updated && (!base || Date.parse(current.state.updated) > Date.parse(base))) {
        throw new ApiError(409, 'conflict', 'Dữ liệu trên máy chủ mới hơn. Đọc lại rồi thử lại.');
      }
      const stamped = { ...incoming, updated: new Date(ctx.now()).toISOString() };
      await writePlan(ctx.projectId, ctx.uid, ctx.token, stamped,
        current.exists ? { updateTime: current.updateTime } : { exists: false }, ctx.fetchFn);
      return { state: stamped };
    },
  },
  {
    method: 'GET', re: /^\/api\/v1\/tasks$/,
    run: async (ctx, _b, url) => {
      const date = url.searchParams.get('date') || todayFor(url, ctx.now());
      if (!parseIso(date)) throw new ApiError(400, 'bad_param', 'date phải là YYYY-MM-DD.');
      const { state } = await readPlan(ctx.projectId, ctx.uid, ctx.token, ctx.fetchFn);
      return { date, tasks: state.tasks.filter(t => t.date === date).map(taskView) };
    },
  },
  {
    method: 'POST', re: /^\/api\/v1\/tasks$/, body: SMALL_BODY, status: 201,
    run: async (ctx, body) => {
      let added = null;
      const state = await mutatePlan(ctx, s => {
        const next = addTask(s, { title: body.title, course: body.course || '', date: body.date }, ctx.newId('t'));
        if (next === s) throw new ApiError(400, 'invalid', 'Cần tiêu đề và ngày hợp lệ (YYYY-MM-DD).');
        added = next.tasks[next.tasks.length - 1];
        return next;
      });
      return { task: taskView(added), updated: state.updated };
    },
  },
  {
    method: 'POST', re: /^\/api\/v1\/tasks\/([A-Za-z0-9_-]{1,80})\/toggle$/,
    run: async (ctx, _b, _u, id) => {
      const state = await mutatePlan(ctx, s => {
        if (!s.tasks.some(t => t.id === id)) throw new ApiError(404, 'not_found', 'Không tìm thấy việc này.');
        return toggleTask(s, id);
      });
      return { task: taskView(state.tasks.find(t => t.id === id)) };
    },
  },
  {
    method: 'DELETE', re: /^\/api\/v1\/tasks\/([A-Za-z0-9_-]{1,80})$/,
    run: async (ctx, _b, _u, id) => {
      await mutatePlan(ctx, s => removeTask(s, id));
      return null;
    },
  },
  {
    method: 'GET', re: /^\/api\/v1\/cards\/due$/,
    run: async (ctx, _b, url) => {
      const today = todayFor(url, ctx.now());
      const { state } = await readPlan(ctx.projectId, ctx.uid, ctx.token, ctx.fetchFn);
      return { today, stats: cardStats(state, today), cards: dueCards(state, today).map(cardView) };
    },
  },
  {
    method: 'POST', re: /^\/api\/v1\/cards$/, body: SMALL_BODY, status: 201,
    run: async (ctx, body, url) => {
      const today = todayFor(url, ctx.now());
      let added = null;
      await mutatePlan(ctx, s => {
        const next = addCard(s, { front: body.front, back: body.back, course: body.course || '' }, today, ctx.newId('k'));
        if (next === s) throw new ApiError(400, 'invalid', 'Cần mặt trước; số thẻ tối đa là 1000.');
        added = next.cards[next.cards.length - 1];
        return next;
      });
      return { card: cardView(added) };
    },
  },
  {
    method: 'POST', re: /^\/api\/v1\/cards\/([A-Za-z0-9_-]{1,80})\/review$/, body: SMALL_BODY,
    run: async (ctx, body, url, id) => {
      if (typeof body.remembered !== 'boolean') throw new ApiError(400, 'invalid', 'remembered phải là true hoặc false.');
      const today = todayFor(url, ctx.now());
      const state = await mutatePlan(ctx, s => {
        if (!s.cards.some(c => c.id === id)) throw new ApiError(404, 'not_found', 'Không tìm thấy thẻ này.');
        return reviewCard(s, id, body.remembered, today);
      });
      return { card: cardView(state.cards.find(c => c.id === id)) };
    },
  },
  {
    method: 'DELETE', re: /^\/api\/v1\/cards\/([A-Za-z0-9_-]{1,80})$/,
    run: async (ctx, _b, _u, id) => {
      await mutatePlan(ctx, s => removeCard(s, id));
      return null;
    },
  },
];

export async function handleApi(request, { projectId, fetchFn = fetch, keys, now = Date.now(), newId } = {}) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  try {
    if (!path.startsWith('/api/')) throw new ApiError(404, 'not_found', 'Không tìm thấy.');
    if (!projectId) throw new ApiError(503, 'not_configured', 'API chưa được bật trên bản này.');

    const matches = ROUTES.filter(r => r.re.test(path));
    if (!matches.length) throw new ApiError(404, 'not_found', 'Không tìm thấy.');
    const route = matches.find(r => r.method === request.method);
    if (!route) {
      return json({ error: { code: 'method_not_allowed', message: 'Phương thức không được hỗ trợ.' } }, 405,
        { Allow: [...new Set(matches.map(r => r.method))].join(', ') });
    }

    const m = /^Bearer ([A-Za-z0-9._-]{1,4096})$/.exec(request.headers.get('Authorization') || '');
    if (!m) throw authError();
    const token = m[1];
    const user = await verifyIdToken(token, { projectId, keys: keys || await fetchJwks(fetchFn, now), now });

    let body = null;
    if (route.method === 'PUT' || route.method === 'POST') {
      body = await readJson(request, route.body || SMALL_BODY);
    }
    const id = (path.match(/^\/api\/v1\/(?:tasks|cards)\/([A-Za-z0-9_-]{1,80})/) || [])[1] || null;
    const ctx = {
      projectId, token, fetchFn, user, uid: user.uid, now: () => now,
      newId: prefix => (newId ? newId(prefix) : prefix + '_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16)),
    };
    const out = await route.run(ctx, body, url, id);
    if (out === null) return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
    return json(out, route.status || 200);
  } catch (err) {
    return fail(err);
  }
}
