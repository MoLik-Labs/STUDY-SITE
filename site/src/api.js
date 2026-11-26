// API v1 và máy chủ MCP của site (cùng một Worker, cùng một bộ thao tác).
//
// Hai cách xác thực (Authorization: Bearer ...):
// 1. Firebase ID token (đăng nhập trên trang): có đủ mọi quyền, dữ liệu đi qua firestore.rules bằng token này.
//    Chỉ cách này được quản lý mã kết nối (tạo, liệt kê, thu hồi).
// 2. Mã kết nối cá nhân "sft_…": có phạm vi (scope) và hạn dùng. Chỉ lưu SHA-256 của mã trong Firestore
//    (apiTokens/{hash}). Đọc/ghi dữ liệu bằng tài khoản dịch vụ, và uid luôn lấy từ bản ghi mã đã xác thực.
//
// Bảo mật chung:
// - Firebase ID token: RS256, kiểm iss/aud/exp/iat/auth_time/sub; từ chối ẩn danh và alg none/HS256.
// - Không CORS; Cache-Control: no-store; X-Content-Type-Options: nosniff; X-Robots-Tag: noindex.
// - Ghi có khoá lạc quan (updateTime) cho kế hoạch: xung đột trả 409, không ghi đè âm thầm.
// - Giới hạn tốc độ theo người dùng: 120 yêu cầu/phút (bộ đếm trong từng Worker) và binding tuỳ chọn.
// - Lỗi trả mã máy đọc được; không lộ chi tiết nội bộ.
import {
  addCard, addExam, addTask, cardStats, dueCards, emptyState, normalizeState,
  parseIso, removeCard, removeExam, removeTask, reviewCard, sanitizeText, toggleTask,
  upcomingExams, weeklyProgress,
} from './logic.js';
import { accessToken } from './google-auth.js';

export const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
export const ALL_SCOPES = ['plan:read', 'plan:write', 'tasks:read', 'tasks:write', 'cards:read', 'cards:write'];
export const TOKEN_PREFIX = 'sft_';
export const TOKEN_MAX_DAYS = 90;
export const TOKEN_DEFAULT_DAYS = 30;
export const TOKENS_PER_USER = 10;
export const RATE_PER_MINUTE = 120;
export const DEFAULT_UTC_OFFSET = 420; // Việt Nam (UTC+7): múi giờ mặc định khi không gửi utc_offset
const STATE_MAX_CHARS = 900000;        // khớp firestore.rules
const SMALL_BODY = 16 * 1024;
const LARGE_BODY = 1024 * 1024;
const MCP_BODY = 64 * 1024;
const MCP_VERSION = '2025-06-18';
const MCP_SUPPORTED = ['2025-06-18', '2025-03-26'];

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const authError = () => new ApiError(401, 'unauthenticated', 'Token không hợp lệ hoặc đã hết hạn.');
const invalid = msg => new ApiError(400, 'invalid', msg);
const upstream = () => new ApiError(502, 'upstream', 'Không đọc được dữ liệu, thử lại sau.');
const forbiddenData = () => new ApiError(403, 'forbidden', 'Không có quyền truy cập dữ liệu này.');

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

function b64urlEncode(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function hex(buffer) {
  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function sha256Hex(text, subtle = globalThis.crypto.subtle) {
  return hex(await subtle.digest('SHA-256', new TextEncoder().encode(text)));
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
  if (payload.firebase && payload.firebase.sign_in_provider === 'anonymous') {
    throw new ApiError(403, 'anonymous', 'Cần đăng nhập bằng tài khoản thật.');
  }
  return { uid: payload.sub, email: typeof payload.email === 'string' ? payload.email : null, emailVerified: payload.email_verified === true };
}

// ---------- Firestore REST (token người dùng hoặc tài khoản dịch vụ) ----------

const docName = (pid, rel) => `projects/${pid}/databases/(default)/documents/${rel}`;
const restRoot = pid => `https://firestore.googleapis.com/v1/projects/${pid}/databases/(default)/documents`;

async function fsGet(ctx, rel) {
  const res = await ctx.fetchFn(`https://firestore.googleapis.com/v1/${docName(ctx.projectId, rel)}`, {
    headers: { Authorization: 'Bearer ' + ctx.fsToken },
  });
  if (res.status === 404) return null;
  if (res.status === 401 || res.status === 403) throw forbiddenData();
  if (!res.ok) throw upstream();
  return res.json();
}

async function fsCommit(ctx, writes) {
  const res = await ctx.fetchFn(restRoot(ctx.projectId) + ':commit', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + ctx.fsToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({ writes }),
  });
  if (res.status === 409 || res.status === 400) {
    // Firestore trả FAILED_PRECONDITION / ALREADY_EXISTS khi tài liệu đã đổi hoặc đã có.
    const text = await res.text().catch(() => '');
    if (res.status === 409 || /FAILED_PRECONDITION|ALREADY_EXISTS|precondition/i.test(text)) {
      throw new ApiError(409, 'conflict', 'Dữ liệu vừa được sửa ở nơi khác. Đọc lại rồi thử lại.');
    }
    throw invalid('Dữ liệu không được chấp nhận.');
  }
  if (res.status === 401 || res.status === 403) throw forbiddenData();
  if (!res.ok) throw new ApiError(502, 'upstream', 'Không ghi được dữ liệu, thử lại sau.');
}

const fieldsOf = doc => {
  const out = {};
  for (const [k, v] of Object.entries(doc.fields || {})) if (typeof v.stringValue === 'string') out[k] = v.stringValue;
  return out;
};

// Tài khoản dịch vụ: cần cho mã kết nối cá nhân. Thiếu secret thì trả 503, không đoán.
async function adminCtx(ctx) {
  if (!ctx.serviceAccount) throw new ApiError(503, 'not_configured', 'Mã kết nối chưa được bật trên bản này.');
  let fsToken;
  try {
    fsToken = await accessToken(ctx.serviceAccount, { fetchFn: ctx.fetchFn, now: ctx.now() });
  } catch {
    throw new ApiError(503, 'upstream', 'Không kết nối được dịch vụ, thử lại sau.');
  }
  return { ...ctx, fsToken };
}

// ---------- Kế hoạch (planners/{uid}) ----------

async function readPlan(ctx) {
  const doc = await fsGet(ctx, `planners/${ctx.uid}`);
  if (!doc) return { state: emptyState(), updateTime: null, exists: false };
  const raw = fieldsOf(doc).state;
  let state = emptyState();
  if (typeof raw === 'string') {
    try { state = normalizeState(JSON.parse(raw)); } catch { state = emptyState(); }
  }
  return { state, updateTime: doc.updateTime || null, exists: true };
}

async function writePlan(ctx, state, current) {
  const serialized = JSON.stringify(state);
  if (serialized.length > STATE_MAX_CHARS) throw new ApiError(413, 'too_large', 'Dữ liệu vượt giới hạn.');
  const precondition = current.exists ? { updateTime: current.updateTime } : { exists: false };
  await fsCommit(ctx, [{
    update: { name: docName(ctx.projectId, `planners/${ctx.uid}`), fields: { state: { stringValue: serialized } } },
    updateTransforms: [{ fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' }],
    currentDocument: precondition,
  }]);
}

// Đọc - sửa - ghi có khoá lạc quan. mutate(state) trả về state mới (cùng tham chiếu nếu không đổi).
async function mutatePlan(ctx, mutate) {
  const current = await readPlan(ctx);
  const next = mutate(current.state);
  const stamped = { ...next, updated: new Date(ctx.now()).toISOString() };
  await writePlan(ctx, stamped, current);
  return stamped;
}

// ---------- Mã kết nối cá nhân (apiTokens/{sha256}) ----------

async function listTokenRecords(ctx) {
  const res = await ctx.fetchFn(restRoot(ctx.projectId) + ':runQuery', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + ctx.fsToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'apiTokens' }],
        where: { fieldFilter: { field: { fieldPath: 'uid' }, op: 'EQUAL', value: { stringValue: ctx.uid } } },
        limit: 100,
      },
    }),
  });
  if (!res.ok) throw upstream();
  const rows = await res.json();
  return rows.filter(r => r.document).map(r => ({ id: r.document.name.split('/').pop(), ...fieldsOf(r.document) }));
}

const tokenView = r => ({
  id: r.id,
  name: r.name,
  scopes: (r.scopes || '').split(' ').filter(s => ALL_SCOPES.includes(s)),
  createdAt: r.createdAt,
  expiresAt: r.expiresAt,
});

function randomSecret() {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return TOKEN_PREFIX + b64urlEncode(bytes);
}

// ---------- Thao tác dùng chung (API và MCP đều gọi qua đây) ----------

const taskView = t => ({ id: t.id, title: t.title, course: t.course, date: t.date, done: t.done });
const cardView = c => ({ id: c.id, front: c.front, back: c.back, course: c.course, box: c.box + 1, due: c.due });
const examView = e => ({ id: e.id, title: e.title, course: e.course, date: e.date });

const OPS = {
  async me(ctx) {
    return { uid: ctx.uid, email: ctx.email, emailVerified: ctx.emailVerified, kind: ctx.kind, scopes: ctx.scopes };
  },

  async getPlan(ctx) {
    return { state: (await readPlan(ctx)).state };
  },

  async putPlan(ctx, body) {
    const incoming = normalizeState(body.state);
    const current = await readPlan(ctx);
    // Ghi đè có kiểm tra: client gửi mốc 'updated' đã đọc. Server mới hơn thì từ chối.
    const base = typeof body.base === 'string' ? body.base : null;
    if (current.state.updated && (!base || Date.parse(current.state.updated) > Date.parse(base))) {
      throw new ApiError(409, 'conflict', 'Dữ liệu trên máy chủ mới hơn. Đọc lại rồi thử lại.');
    }
    const stamped = { ...incoming, updated: new Date(ctx.now()).toISOString() };
    await writePlan(ctx, stamped, current);
    return { state: stamped };
  },

  async listTasks(ctx, date) {
    if (!parseIso(date)) throw invalid('date phải là YYYY-MM-DD.');
    const { state } = await readPlan(ctx);
    return { date, tasks: state.tasks.filter(t => t.date === date).map(taskView) };
  },

  async addTask(ctx, body) {
    let added = null;
    await mutatePlan(ctx, s => {
      const next = addTask(s, { title: body.title, course: body.course || '', date: body.date }, ctx.newId('t'));
      if (next === s) throw invalid('Cần tiêu đề và ngày hợp lệ (YYYY-MM-DD).');
      added = next.tasks[next.tasks.length - 1];
      return next;
    });
    return { task: taskView(added) };
  },

  async toggleTask(ctx, id) {
    const state = await mutatePlan(ctx, s => {
      if (!s.tasks.some(t => t.id === id)) throw new ApiError(404, 'not_found', 'Không tìm thấy việc này.');
      return toggleTask(s, id);
    });
    return { task: taskView(state.tasks.find(t => t.id === id)) };
  },

  async deleteTask(ctx, id) {
    await mutatePlan(ctx, s => removeTask(s, id));
    return null;
  },

  async listDueCards(ctx, today) {
    const { state } = await readPlan(ctx);
    return { today, stats: cardStats(state, today), cards: dueCards(state, today).map(cardView) };
  },

  async addCard(ctx, body, today) {
    let added = null;
    await mutatePlan(ctx, s => {
      const next = addCard(s, { front: body.front, back: body.back, course: body.course || '' }, today, ctx.newId('k'));
      if (next === s) throw invalid('Cần mặt trước; số thẻ tối đa là 1000.');
      added = next.cards[next.cards.length - 1];
      return next;
    });
    return { card: cardView(added) };
  },

  async reviewCard(ctx, id, remembered, today) {
    if (typeof remembered !== 'boolean') throw invalid('remembered phải là true hoặc false.');
    const state = await mutatePlan(ctx, s => {
      if (!s.cards.some(c => c.id === id)) throw new ApiError(404, 'not_found', 'Không tìm thấy thẻ này.');
      return reviewCard(s, id, remembered, today);
    });
    return { card: cardView(state.cards.find(c => c.id === id)) };
  },

  async deleteCard(ctx, id) {
    await mutatePlan(ctx, s => removeCard(s, id));
    return null;
  },

  async listExams(ctx, today) {
    const { state } = await readPlan(ctx);
    return { today, exams: upcomingExams(state, today).map(e => ({ ...examView(e), daysLeft: e.daysLeft })) };
  },

  async addExam(ctx, body) {
    let added = null;
    await mutatePlan(ctx, s => {
      const next = addExam(s, { title: body.title, course: body.course || '', date: body.date }, ctx.newId('e'));
      if (next === s) throw invalid('Cần tên kỳ thi và ngày hợp lệ (YYYY-MM-DD).');
      added = next.exams[next.exams.length - 1];
      return next;
    });
    return { exam: examView(added) };
  },

  async deleteExam(ctx, id) {
    await mutatePlan(ctx, s => removeExam(s, id));
    return null;
  },

  async progress(ctx, today) {
    const { state } = await readPlan(ctx);
    return weeklyProgress(state, today);
  },

  async listTokens(ctx) {
    const admin = await adminCtx(ctx);
    const rows = await listTokenRecords(admin);
    return { tokens: rows.filter(r => r.expiresAt > ctx.nowIso()).map(tokenView) };
  },

  async createToken(ctx, body) {
    const name = sanitizeText(body.name, 60);
    if (!name) throw invalid('Cần tên cho mã kết nối.');
    const scopes = Array.isArray(body.scopes) ? [...new Set(body.scopes)] : [];
    if (!scopes.length || scopes.length > ALL_SCOPES.length || scopes.some(s => !ALL_SCOPES.includes(s))) {
      throw invalid('Quyền không hợp lệ.');
    }
    const days = body.days === undefined ? TOKEN_DEFAULT_DAYS : body.days;
    if (!Number.isInteger(days) || days < 1 || days > TOKEN_MAX_DAYS) {
      throw invalid(`Số ngày phải từ 1 đến ${TOKEN_MAX_DAYS}.`);
    }
    const admin = await adminCtx(ctx);
    const existing = await listTokenRecords(admin);
    const live = existing.filter(r => r.expiresAt > ctx.nowIso());
    if (live.length >= TOKENS_PER_USER) {
      throw new ApiError(409, 'limit', `Tối đa ${TOKENS_PER_USER} mã kết nối. Xoá bớt mã cũ trước.`);
    }
    const secret = randomSecret();
    const id = await sha256Hex(secret);
    const createdAt = ctx.nowIso();
    const expiresAt = new Date(ctx.now() + days * 86400000).toISOString();
    await fsCommit(admin, [{
      update: {
        name: docName(ctx.projectId, `apiTokens/${id}`),
        fields: {
          uid: { stringValue: ctx.uid },
          name: { stringValue: name },
          scopes: { stringValue: scopes.join(' ') },
          createdAt: { stringValue: createdAt },
          expiresAt: { stringValue: expiresAt },
        },
      },
      currentDocument: { exists: false },
    }]);
    // Mã chỉ hiện đúng một lần. Máy chủ chỉ giữ SHA-256 của nó.
    return { token: secret, ...tokenView({ id, name, scopes: scopes.join(' '), createdAt, expiresAt }) };
  },

  async revokeToken(ctx, id) {
    if (!/^[a-f0-9]{64}$/.test(id)) throw new ApiError(404, 'not_found', 'Không tìm thấy mã này.');
    const admin = await adminCtx(ctx);
    const doc = await fsGet(admin, `apiTokens/${id}`);
    // Không phải của người này: trả 404 như không tồn tại, để không lộ mã của người khác.
    if (!doc || fieldsOf(doc).uid !== ctx.uid) throw new ApiError(404, 'not_found', 'Không tìm thấy mã này.');
    await fsCommit(admin, [{ delete: docName(ctx.projectId, `apiTokens/${id}`) }]);
    return null;
  },
};

// ---------- Xác thực chung ----------

async function authenticate(request, { projectId, fetchFn, keys, nowValue, serviceAccount }) {
  const m = /^Bearer ([A-Za-z0-9._-]{1,4096})$/.exec(request.headers.get('Authorization') || '');
  if (!m) throw authError();
  const token = m[1];

  if (token.startsWith(TOKEN_PREFIX)) {
    if (!serviceAccount) throw new ApiError(503, 'not_configured', 'Mã kết nối chưa được bật trên bản này.');
    const hash = await sha256Hex(token);
    const ctx = { projectId, fetchFn, now: () => nowValue, serviceAccount };
    const admin = await adminCtx(ctx);
    const doc = await fsGet(admin, `apiTokens/${hash}`);
    if (!doc) throw authError();
    const f = fieldsOf(doc);
    if (!f.uid || !(f.expiresAt > new Date(nowValue).toISOString())) throw authError();
    const scopes = (f.scopes || '').split(' ').filter(s => ALL_SCOPES.includes(s));
    return { kind: 'personal', uid: f.uid, email: null, emailVerified: false, scopes, fsToken: admin.fsToken };
  }

  const user = await verifyIdToken(token, { projectId, keys: keys || await fetchJwks(fetchFn, nowValue), now: nowValue });
  return { kind: 'id', uid: user.uid, email: user.email, emailVerified: user.emailVerified, scopes: ALL_SCOPES, fsToken: token };
}

const rateBuckets = new Map();

function rateLimit(uid, limit, nowValue) {
  const minute = Math.floor(nowValue / 60000);
  let b = rateBuckets.get(uid);
  if (!b || b.minute !== minute) {
    if (rateBuckets.size > 5000) rateBuckets.clear();
    b = { minute, n: 0 };
    rateBuckets.set(uid, b);
  }
  b.n += 1;
  if (b.n > limit) throw new ApiError(429, 'rate_limited', 'Quá nhiều yêu cầu. Thử lại sau một phút.');
}

// ---------- Tiện ích HTTP ----------

const NO_STORE = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex',
  'Vary': 'Authorization',
};

function json(body, status = 200, extra = {}) {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, NO_STORE, extra),
  });
}

function fail(err) {
  if (err instanceof ApiError) {
    const extra = err.status === 429 ? { 'Retry-After': '60' } : {};
    return json({ error: { code: err.code, message: err.message } }, err.status, extra);
  }
  return json({ error: { code: 'internal', message: 'Lỗi không mong muốn.' } }, 500);
}

async function readText(request, maxBytes) {
  const declared = Number(request.headers.get('Content-Length') || 0);
  if (declared > maxBytes) throw new ApiError(413, 'too_large', 'Nội dung quá lớn.');
  const text = await request.text();
  if (text.length > maxBytes) throw new ApiError(413, 'too_large', 'Nội dung quá lớn.');
  return text;
}

async function readJson(request, maxBytes) {
  const type = (request.headers.get('Content-Type') || '').split(';')[0].trim();
  if (type !== 'application/json') throw new ApiError(415, 'unsupported_media_type', 'Cần Content-Type: application/json.');
  const text = await readText(request, maxBytes);
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new ApiError(400, 'bad_json', 'JSON không hợp lệ.');
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ApiError(400, 'bad_json', 'JSON không hợp lệ.');
  return body;
}

// Ngày "hôm nay" theo múi giờ người dùng (utc_offset tính bằng phút, mặc định Việt Nam +420).
export function todayFor(url, now) {
  const raw = url.searchParams.get('utc_offset');
  let offset = DEFAULT_UTC_OFFSET;
  if (raw !== null) {
    if (!/^-?\d{1,4}$/.test(raw)) throw invalid('utc_offset phải là số phút.');
    offset = Math.max(-840, Math.min(840, Number(raw)));
  }
  return new Date(now + offset * 60000).toISOString().slice(0, 10);
}

// ---------- Định tuyến REST ----------

const ID = '([A-Za-z0-9_-]{1,80})';
const ROUTES = [
  { method: 'GET', re: /^\/api\/v1\/me$/, run: ctx => OPS.me(ctx) },
  { method: 'GET', re: /^\/api\/v1\/plan$/, scope: 'plan:read', run: ctx => OPS.getPlan(ctx) },
  { method: 'PUT', re: /^\/api\/v1\/plan$/, scope: 'plan:write', body: LARGE_BODY, run: (ctx, b) => OPS.putPlan(ctx, b) },
  {
    method: 'GET', re: /^\/api\/v1\/tasks$/, scope: 'tasks:read',
    run: (ctx, _b, url) => OPS.listTasks(ctx, url.searchParams.get('date') || todayFor(url, ctx.now())),
  },
  { method: 'POST', re: /^\/api\/v1\/tasks$/, scope: 'tasks:write', body: SMALL_BODY, status: 201, run: (ctx, b) => OPS.addTask(ctx, b) },
  { method: 'POST', re: new RegExp(`^/api/v1/tasks/${ID}/toggle$`), scope: 'tasks:write', run: (ctx, _b, _u, id) => OPS.toggleTask(ctx, id) },
  { method: 'DELETE', re: new RegExp(`^/api/v1/tasks/${ID}$`), scope: 'tasks:write', run: (ctx, _b, _u, id) => OPS.deleteTask(ctx, id) },
  { method: 'GET', re: /^\/api\/v1\/cards\/due$/, scope: 'cards:read', run: (ctx, _b, url) => OPS.listDueCards(ctx, todayFor(url, ctx.now())) },
  { method: 'POST', re: /^\/api\/v1\/cards$/, scope: 'cards:write', body: SMALL_BODY, status: 201, run: (ctx, b, url) => OPS.addCard(ctx, b, todayFor(url, ctx.now())) },
  {
    method: 'POST', re: new RegExp(`^/api/v1/cards/${ID}/review$`), scope: 'cards:write', body: SMALL_BODY,
    run: (ctx, b, url, id) => OPS.reviewCard(ctx, id, b.remembered, todayFor(url, ctx.now())),
  },
  { method: 'DELETE', re: new RegExp(`^/api/v1/cards/${ID}$`), scope: 'cards:write', run: (ctx, _b, _u, id) => OPS.deleteCard(ctx, id) },
  { method: 'GET', re: /^\/api\/v1\/exams$/, scope: 'plan:read', run: (ctx, _b, url) => OPS.listExams(ctx, todayFor(url, ctx.now())) },
  { method: 'POST', re: /^\/api\/v1\/exams$/, scope: 'plan:write', body: SMALL_BODY, status: 201, run: (ctx, b) => OPS.addExam(ctx, b) },
  { method: 'DELETE', re: new RegExp(`^/api/v1/exams/${ID}$`), scope: 'plan:write', run: (ctx, _b, _u, id) => OPS.deleteExam(ctx, id) },
  { method: 'GET', re: /^\/api\/v1\/progress$/, scope: 'plan:read', run: (ctx, _b, url) => OPS.progress(ctx, todayFor(url, ctx.now())) },
  // Quản lý mã kết nối: chỉ bằng đăng nhập trên trang (idOnly), không dùng được bằng chính mã kết nối.
  { method: 'GET', re: /^\/api\/v1\/tokens$/, idOnly: true, run: ctx => OPS.listTokens(ctx) },
  { method: 'POST', re: /^\/api\/v1\/tokens$/, idOnly: true, body: SMALL_BODY, status: 201, run: (ctx, b) => OPS.createToken(ctx, b) },
  { method: 'DELETE', re: new RegExp(`^/api/v1/tokens/${ID}$`), idOnly: true, run: (ctx, _b, _u, id) => OPS.revokeToken(ctx, id) },
];

// ---------- Máy chủ MCP (Streamable HTTP, JSON-RPC 2.0) ----------

const TOOLS = [
  {
    name: 'list_tasks', scope: 'tasks:read',
    description: 'Xem việc cần làm trong một ngày. Mặc định là hôm nay (giờ Việt Nam).',
    inputSchema: { type: 'object', properties: { date: { type: 'string', description: 'Ngày dạng YYYY-MM-DD' } }, additionalProperties: false },
    run: (ctx, a) => OPS.listTasks(ctx, a.date || todayFor(new URL('https://x/'), ctx.now())),
  },
  {
    name: 'add_task', scope: 'tasks:write',
    description: 'Thêm một việc cần làm vào lịch.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', maxLength: 140 },
        date: { type: 'string', description: 'Ngày dạng YYYY-MM-DD' },
        course: { type: 'string', description: 'Mã môn (không bắt buộc)' },
      },
      required: ['title', 'date'], additionalProperties: false,
    },
    run: (ctx, a) => OPS.addTask(ctx, a),
  },
  {
    name: 'toggle_task', scope: 'tasks:write',
    description: 'Đánh dấu một việc là xong hoặc chưa xong.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'], additionalProperties: false },
    run: (ctx, a) => OPS.toggleTask(ctx, String(a.id || '')),
  },
  {
    name: 'list_due_cards', scope: 'cards:read',
    description: 'Xem thẻ ghi nhớ đến hạn ôn hôm nay.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    run: (ctx) => OPS.listDueCards(ctx, todayFor(new URL('https://x/'), ctx.now())),
  },
  {
    name: 'add_card', scope: 'cards:write',
    description: 'Thêm một thẻ ghi nhớ (mặt trước và mặt sau).',
    inputSchema: {
      type: 'object',
      properties: { front: { type: 'string', maxLength: 300 }, back: { type: 'string', maxLength: 800 }, course: { type: 'string' } },
      required: ['front'], additionalProperties: false,
    },
    run: (ctx, a) => OPS.addCard(ctx, a, todayFor(new URL('https://x/'), ctx.now())),
  },
  {
    name: 'review_card', scope: 'cards:write',
    description: 'Chấm một thẻ: nhớ (remembered = true) hoặc quên (false).',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' }, remembered: { type: 'boolean' } },
      required: ['id', 'remembered'], additionalProperties: false,
    },
    run: (ctx, a) => OPS.reviewCard(ctx, String(a.id || ''), a.remembered, todayFor(new URL('https://x/'), ctx.now())),
  },
  {
    name: 'list_exams', scope: 'plan:read',
    description: 'Xem các kỳ thi sắp tới và số ngày còn lại.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    run: (ctx) => OPS.listExams(ctx, todayFor(new URL('https://x/'), ctx.now())),
  },
  {
    name: 'add_exam', scope: 'plan:write',
    description: 'Thêm một kỳ thi để đếm ngược.',
    inputSchema: {
      type: 'object',
      properties: { title: { type: 'string', maxLength: 120 }, date: { type: 'string' }, course: { type: 'string' } },
      required: ['title', 'date'], additionalProperties: false,
    },
    run: (ctx, a) => OPS.addExam(ctx, a),
  },
  {
    name: 'progress', scope: 'plan:read',
    description: 'Xem tiến độ việc cần làm trong 7 ngày gần nhất.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    run: (ctx) => OPS.progress(ctx, todayFor(new URL('https://x/'), ctx.now())),
  },
];

const toolError = text => ({ content: [{ type: 'text', text }], isError: true });

async function mcpDispatch(item, ctx) {
  if (!item || typeof item !== 'object' || Array.isArray(item) || item.jsonrpc !== '2.0' || typeof item.method !== 'string') {
    return { jsonrpc: '2.0', id: item && item.id !== undefined ? item.id : null, error: { code: -32600, message: 'Yêu cầu không hợp lệ.' } };
  }
  const notification = item.id === undefined;
  const reply = result => (notification ? null : { jsonrpc: '2.0', id: item.id, result });
  const fail = (code, message) => (notification ? null : { jsonrpc: '2.0', id: item.id, error: { code, message } });

  switch (item.method) {
    case 'initialize': {
      const asked = item.params && item.params.protocolVersion;
      return reply({
        protocolVersion: MCP_SUPPORTED.includes(asked) ? asked : MCP_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: 'ke-hoach-hoc', version: '1.0.0' },
      });
    }
    case 'ping':
      return reply({});
    case 'tools/list':
      return reply({
        tools: TOOLS.filter(t => ctx.scopes.includes(t.scope))
          .map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
      });
    case 'tools/call': {
      const name = item.params && item.params.name;
      const tool = TOOLS.find(t => t.name === name);
      if (!tool) return fail(-32602, 'Không có công cụ này.');
      if (!ctx.scopes.includes(tool.scope)) return reply(toolError('Mã kết nối này không có quyền dùng công cụ này.'));
      const args = item.params.arguments && typeof item.params.arguments === 'object' ? item.params.arguments : {};
      try {
        const data = await tool.run(ctx, args);
        return reply({ content: [{ type: 'text', text: JSON.stringify(data ?? { ok: true }) }], isError: false });
      } catch (err) {
        if (err instanceof ApiError) return reply(toolError(err.message));
        return reply(toolError('Lỗi không mong muốn.'));
      }
    }
    default:
      if (notification) return null; // ví dụ notifications/initialized
      return fail(-32601, 'Phương thức không được hỗ trợ.');
  }
}

async function handleMcp(request, ctx) {
  const type = (request.headers.get('Content-Type') || '').split(';')[0].trim();
  if (type !== 'application/json') throw new ApiError(415, 'unsupported_media_type', 'Cần Content-Type: application/json.');
  const text = await readText(request, MCP_BODY);
  let msg;
  try {
    msg = JSON.parse(text);
  } catch {
    return json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'JSON không hợp lệ.' } }, 400);
  }
  const batch = Array.isArray(msg);
  const items = batch ? msg : [msg];
  if (!items.length || items.length > 20) {
    return json({ jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Yêu cầu không hợp lệ.' } }, 400);
  }
  const replies = [];
  for (const item of items) {
    const r = await mcpDispatch(item, ctx);
    if (r) replies.push(r);
  }
  if (!replies.length) return new Response(null, { status: 202, headers: NO_STORE });
  return json(batch ? replies : replies[0], 200);
}

// ---------- Điểm vào ----------

export async function handleApi(request, opts = {}) {
  const {
    projectId, fetchFn = fetch, keys, now: nowValue = Date.now(), newId,
    serviceAccount = null, rateLimitPerMinute = RATE_PER_MINUTE,
  } = opts;
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  try {
    if (!path.startsWith('/api/')) throw new ApiError(404, 'not_found', 'Không tìm thấy.');
    if (!projectId) throw new ApiError(503, 'not_configured', 'API chưa được bật trên bản này.');

    const isMcp = path === '/api/v1/mcp';
    let route = null;
    if (isMcp) {
      if (request.method !== 'POST') {
        return json({ error: { code: 'method_not_allowed', message: 'Phương thức không được hỗ trợ.' } }, 405, { Allow: 'POST' });
      }
    } else {
      const matches = ROUTES.filter(r => r.re.test(path));
      if (!matches.length) throw new ApiError(404, 'not_found', 'Không tìm thấy.');
      route = matches.find(r => r.method === request.method);
      if (!route) {
        return json({ error: { code: 'method_not_allowed', message: 'Phương thức không được hỗ trợ.' } }, 405,
          { Allow: [...new Set(matches.map(r => r.method))].join(', ') });
      }
    }

    const principal = await authenticate(request, { projectId, fetchFn, keys, nowValue, serviceAccount });
    rateLimit(principal.uid, rateLimitPerMinute, nowValue);

    const ctx = {
      projectId, fetchFn, serviceAccount,
      now: () => nowValue,
      nowIso: () => new Date(nowValue).toISOString(),
      uid: principal.uid,
      email: principal.email,
      emailVerified: principal.emailVerified,
      kind: principal.kind,
      scopes: principal.scopes,
      fsToken: principal.fsToken,
      newId: prefix => (newId ? newId(prefix) : prefix + '_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16)),
    };

    if (isMcp) return await handleMcp(request, ctx);

    if (route.idOnly && ctx.kind !== 'id') {
      throw new ApiError(403, 'id_only', 'Thao tác này chỉ dùng đăng nhập trên trang, không dùng mã kết nối.');
    }
    if (route.scope && !ctx.scopes.includes(route.scope)) {
      throw new ApiError(403, 'scope', 'Mã kết nối này không có quyền cho thao tác này.');
    }
    let body = null;
    if (route.method === 'PUT' || route.method === 'POST') body = await readJson(request, route.body || SMALL_BODY);
    const id = (path.match(new RegExp(`^/api/v1/(?:tasks|cards|exams|tokens)/${ID}`)) || [])[1] || null;
    const out = await route.run(ctx, body, url, id);
    if (out === null) return new Response(null, { status: 204, headers: NO_STORE });
    return json(out, route.status || 200);
  } catch (err) {
    return fail(err);
  }
}
