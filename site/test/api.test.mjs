// Kiểm thử API v1 và MCP: token Firebase thật (RSA), tài khoản dịch vụ giả, Firestore giả có precondition.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, '..', 'src');
const { handleApi, verifyIdToken, todayFor, sha256Hex, ALL_SCOPES, TOKENS_PER_USER } = await import(pathToFileURL(path.join(SRC, 'api.js')).href);
const { clearAccessTokenCache } = await import(pathToFileURL(path.join(SRC, 'google-auth.js')).href);

const PROJECT = 'study-focus-fox';
const NOW = Date.UTC(2026, 10, 16, 3, 0, 0); // 16/11/2026 10:00 giờ Việt Nam
const subtle = globalThis.crypto.subtle;
const b64u = buf => Buffer.from(buf).toString('base64url');

const pair = await subtle.generateKey(
  { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
  true, ['sign', 'verify']);
const pub = await subtle.exportKey('jwk', pair.publicKey);
const KEYS = [{ ...pub, kid: 'k1', alg: 'RS256', use: 'sig' }];
const pkcs8 = Buffer.from(await subtle.exportKey('pkcs8', pair.privateKey)).toString('base64');
const PEM = `-----BEGIN PRIVATE KEY-----\n${pkcs8.match(/.{1,64}/g).join('\n')}\n-----END PRIVATE KEY-----\n`;
const SA = { type: 'service_account', project_id: PROJECT, client_email: 'api@study-focus-fox.iam.gserviceaccount.com', private_key: PEM };

async function sign(payload, { header = { alg: 'RS256', kid: 'k1', typ: 'JWT' }, privateKey = pair.privateKey } = {}) {
  const h = b64u(JSON.stringify(header));
  const p = b64u(JSON.stringify(payload));
  const sig = await subtle.sign('RSASSA-PKCS1-v1_5', privateKey, new TextEncoder().encode(h + '.' + p));
  return h + '.' + p + '.' + b64u(sig);
}

function claims(over = {}) {
  const t = Math.floor(NOW / 1000);
  return {
    iss: 'https://securetoken.google.com/' + PROJECT, aud: PROJECT, sub: 'uidAlice0000000000000001',
    iat: t, exp: t + 3600, auth_time: t, email: 'alice@example.com', email_verified: true,
    firebase: { sign_in_provider: 'password' }, ...over,
  };
}

// Firestore + Google giả. Kiểm precondition, lưu tài liệu theo đường dẫn, ghi lại token của mỗi lệnh.
function fakeBackend() {
  const docs = new Map(); // 'planners/uid' | 'apiTokens/hash' -> { fields, updateTime }
  const calls = [];
  let tick = 0;
  let adminIssued = 0;
  const fetchFn = async (url, opts = {}) => {
    const auth = (opts.headers && opts.headers.Authorization) || '';
    if (url.includes('googleapis.com/service_accounts')) {
      return new Response(JSON.stringify({ keys: KEYS }), { headers: { 'cache-control': 'max-age=600' } });
    }
    if (url === 'https://oauth2.googleapis.com/token') {
      const assertion = new URLSearchParams(opts.body).get('assertion');
      const [h, p, s] = assertion.split('.');
      const ok = await subtle.verify('RSASSA-PKCS1-v1_5', pair.publicKey, Buffer.from(s, 'base64url'), new TextEncoder().encode(h + '.' + p));
      const c = JSON.parse(Buffer.from(p, 'base64url').toString());
      if (!ok || c.iss !== SA.client_email || !c.scope.includes('datastore')) return new Response('{}', { status: 401 });
      adminIssued += 1;
      return new Response(JSON.stringify({ access_token: 'ya29.admin-' + adminIssued, expires_in: 3600 }));
    }
    calls.push({ url, method: opts.method || 'GET', auth });
    const docMatch = /documents\/(planners|apiTokens)\/([^/?:]+)$/.exec(url);
    if (docMatch && (!opts.method || opts.method === 'GET')) {
      const d = docs.get(docMatch[1] + '/' + docMatch[2]);
      if (!d) return new Response('{}', { status: 404 });
      return new Response(JSON.stringify({ name: url, fields: d.fields, updateTime: d.updateTime }));
    }
    if (url.endsWith(':runQuery')) {
      const q = JSON.parse(opts.body).structuredQuery;
      const f = q.where.fieldFilter;
      const rows = [...docs.entries()]
        .filter(([k]) => k.startsWith(q.from[0].collectionId + '/'))
        .filter(([, d]) => d.fields[f.field.fieldPath] && d.fields[f.field.fieldPath].stringValue === f.value.stringValue)
        .map(([k, d]) => ({ document: { name: 'projects/x/databases/(default)/documents/' + k, fields: d.fields, updateTime: d.updateTime } }));
      return new Response(JSON.stringify([...rows, { readTime: 'now' }]));
    }
    if (url.endsWith(':commit')) {
      const { writes } = JSON.parse(opts.body);
      for (const w of writes) {
        const key = (w.update ? w.update.name : w.delete).split('/documents/')[1];
        const cur = docs.get(key);
        const pre = w.currentDocument || {};
        if (pre.exists === false && cur) return new Response('{"error":{"status":"ALREADY_EXISTS"}}', { status: 400 });
        if (pre.exists === true && !cur) return new Response('{"error":{"status":"NOT_FOUND"}}', { status: 400 });
        if (pre.updateTime && (!cur || cur.updateTime !== pre.updateTime)) {
          return new Response('{"error":{"status":"FAILED_PRECONDITION"}}', { status: 400 });
        }
        if (w.delete) { docs.delete(key); continue; }
        tick += 1;
        docs.set(key, { fields: w.update.fields, updateTime: 'ut' + tick });
      }
      return new Response('{}', { status: 200 });
    }
    return new Response('{}', { status: 500 });
  };
  return { fetchFn, docs, calls };
}

function req(method, p, { token, body, type = 'application/json', headers = {} } = {}) {
  const h = { ...headers };
  if (token) h.Authorization = 'Bearer ' + token;
  let payload;
  if (body !== undefined) {
    payload = typeof body === 'string' ? body : JSON.stringify(body);
    h['Content-Type'] = type;
    h['Content-Length'] = String(payload.length);
  }
  return new Request('https://site.test' + p, { method, headers: h, body: payload });
}

function ctx(be, over = {}) {
  return { projectId: PROJECT, fetchFn: be.fetchFn, keys: KEYS, now: NOW, serviceAccount: SA,
    newId: p => p + '_' + Math.random().toString(36).slice(2, 10), ...over };
}

const ALICE = () => sign(claims());
const ALICE_UID = 'uidAlice0000000000000001';

// Tạo mã cá nhân qua đăng nhập trên trang (token người dùng).
async function makeToken(be, c, { scopes = ALL_SCOPES, days = 30, name = 'Trợ lý AI' } = {}) {
  const t = await ALICE();
  const res = await handleApi(req('POST', '/api/v1/tokens', { token: t, body: { name, scopes, days } }), c);
  assert.equal(res.status, 201);
  return (await res.json()).token;
}

test.beforeEach(() => clearAccessTokenCache());

// ---------- Xác thực Firebase ID token ----------

test('token hợp lệ cho ra uid; chữ ký khác, sai aud/iss, hết hạn, alg none/HS256, kid lạ, ẩn danh đều bị từ chối', async () => {
  const good = await verifyIdToken(await ALICE(), { projectId: PROJECT, keys: KEYS, now: NOW });
  assert.equal(good.uid, ALICE_UID);
  assert.equal(good.emailVerified, true);

  const other = await subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  const tampered = (await ALICE()).split('.');
  tampered[1] = b64u(JSON.stringify(claims({ sub: 'uidVictim' })));
  const cases = {
    'chữ ký khác': await sign(claims(), { privateKey: other.privateKey }),
    'payload bị sửa': tampered.join('.'),
    'sai aud': await sign(claims({ aud: 'project-khac' })),
    'sai iss': await sign(claims({ iss: 'https://evil.example' })),
    'hết hạn': await sign(claims({ exp: Math.floor(NOW / 1000) - 10 })),
    'alg none': await sign(claims(), { header: { alg: 'none', kid: 'k1' } }),
    'alg HS256': await sign(claims(), { header: { alg: 'HS256', kid: 'k1' } }),
    'ẩn danh': await sign(claims({ firebase: { sign_in_provider: 'anonymous' } })),
    'kid lạ': await sign(claims(), { header: { alg: 'RS256', kid: 'zz' } }),
  };
  for (const [name, tok] of Object.entries(cases)) {
    await assert.rejects(verifyIdToken(tok, { projectId: PROJECT, keys: KEYS, now: NOW }), undefined, name);
  }
});

// ---------- HTTP ----------

test('không có token thì 401; không cấu hình Firebase thì 503; đường dẫn lạ 404', async () => {
  const be = fakeBackend();
  assert.equal((await handleApi(req('GET', '/api/v1/plan'), ctx(be))).status, 401);
  assert.equal((await handleApi(req('GET', '/api/v1/plan', { token: await ALICE() }), ctx(be, { projectId: null }))).status, 503);
  assert.equal((await handleApi(req('GET', '/api/v1/khong-co', { token: await ALICE() }), ctx(be))).status, 404);
});

test('sai phương thức 405 kèm Allow; phản hồi không cache, nosniff, không mở CORS', async () => {
  const be = fakeBackend();
  const t = await ALICE();
  const r405 = await handleApi(req('DELETE', '/api/v1/plan', { token: t }), ctx(be));
  assert.equal(r405.status, 405);
  assert.equal(r405.headers.get('allow'), 'GET, PUT');
  const ok = await handleApi(req('GET', '/api/v1/me', { token: t }), ctx(be));
  assert.equal(ok.headers.get('cache-control'), 'no-store');
  assert.equal(ok.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(ok.headers.get('access-control-allow-origin'), null);
});

test('body: sai Content-Type 415, JSON hỏng 400, quá lớn 413', async () => {
  const be = fakeBackend();
  const t = await ALICE();
  const c = ctx(be);
  assert.equal((await handleApi(req('POST', '/api/v1/tasks', { token: t, body: '{}', type: 'text/plain' }), c)).status, 415);
  assert.equal((await handleApi(req('POST', '/api/v1/tasks', { token: t, body: '{nhiều' }), c)).status, 400);
  assert.equal((await handleApi(req('POST', '/api/v1/tasks', { token: t, body: JSON.stringify({ title: 'x'.repeat(20000) }) }), c)).status, 413);
});

// ---------- Dữ liệu với token người dùng (quy tắc Firestore áp dụng) ----------

test('với token người dùng, mọi lệnh Firestore mang đúng token đó (không dùng tài khoản dịch vụ)', async () => {
  const be = fakeBackend();
  const t = await ALICE();
  await handleApi(req('GET', '/api/v1/plan', { token: t }), ctx(be));
  await handleApi(req('POST', '/api/v1/tasks', { token: t, body: { title: 'Đọc', date: '2026-11-16' } }), ctx(be));
  assert.ok(be.calls.length >= 2);
  for (const c of be.calls) assert.equal(c.auth, 'Bearer ' + t);
});

test('việc cần làm: thêm, đọc theo ngày, đánh dấu xong, xoá', async () => {
  const be = fakeBackend();
  const c = ctx(be);
  const t = await ALICE();
  const add = await handleApi(req('POST', '/api/v1/tasks', { token: t, body: { title: 'Ôn Econometrics', course: 'kinh-te-luong', date: '2026-11-16' } }), c);
  assert.equal(add.status, 201);
  const { task } = await add.json();
  assert.equal((await (await handleApi(req('GET', '/api/v1/tasks?date=2026-11-16', { token: t }), c)).json()).tasks.length, 1);
  assert.equal((await (await handleApi(req('POST', `/api/v1/tasks/${task.id}/toggle`, { token: t, body: {} }), c)).json()).task.done, true);
  assert.equal((await handleApi(req('DELETE', `/api/v1/tasks/${task.id}`, { token: t }), c)).status, 204);
  assert.equal((await (await handleApi(req('GET', '/api/v1/tasks?date=2026-11-16', { token: t }), c)).json()).tasks.length, 0);
});

test('thẻ ôn và kỳ thi: thêm, chấm, đếm ngược; tiến độ 7 ngày', async () => {
  const be = fakeBackend();
  const c = ctx(be);
  const t = await ALICE();
  const { card } = await (await handleApi(req('POST', '/api/v1/cards', { token: t, body: { front: 'OLS?', back: 'BPTT' } }), c)).json();
  const due = await (await handleApi(req('GET', '/api/v1/cards/due?utc_offset=420', { token: t }), c)).json();
  assert.equal(due.today, '2026-11-16');
  assert.equal(due.cards.length, 1);
  assert.equal((await (await handleApi(req('POST', `/api/v1/cards/${card.id}/review`, { token: t, body: { remembered: true } }), c)).json()).card.box, 2);
  assert.equal((await handleApi(req('POST', `/api/v1/cards/${card.id}/review`, { token: t, body: { remembered: 'có' } }), c)).status, 400);
  assert.equal((await handleApi(req('POST', '/api/v1/cards/khong_co/review', { token: t, body: { remembered: true } }), c)).status, 404);

  const ex = await handleApi(req('POST', '/api/v1/exams', { token: t, body: { title: 'Giữa kỳ', date: '2026-11-26' } }), c);
  assert.equal(ex.status, 201);
  const exams = await (await handleApi(req('GET', '/api/v1/exams?utc_offset=420', { token: t }), c)).json();
  assert.equal(exams.exams[0].daysLeft, 10);

  const prog = await (await handleApi(req('GET', '/api/v1/progress?utc_offset=420', { token: t }), c)).json();
  assert.equal(prog.days.length, 7);
});

test('ghi đè có kiểm tra: PUT với mốc cũ bị 409, dữ liệu máy khác không bị mất', async () => {
  const be = fakeBackend();
  const t = await ALICE();
  const first = await handleApi(req('PUT', '/api/v1/plan', { token: t, body: { state: { v: 2, tasks: [] } } }), ctx(be));
  assert.equal(first.status, 200);
  const { state } = await first.json();
  await handleApi(req('POST', '/api/v1/tasks', { token: t, body: { title: 'Từ máy khác', date: '2026-11-16' } }), ctx(be, { now: NOW + 60000 }));
  const stale = await handleApi(req('PUT', '/api/v1/plan', { token: t, body: { state: { v: 2, tasks: [] }, base: state.updated } }), ctx(be, { now: NOW + 120000 }));
  assert.equal(stale.status, 409);
  const plan = await (await handleApi(req('GET', '/api/v1/plan', { token: t }), ctx(be))).json();
  assert.equal(plan.state.tasks.length, 1);
});

test('dữ liệu của người khác không lộ: mỗi uid có tài liệu riêng', async () => {
  const be = fakeBackend();
  const alice = await ALICE();
  const bob = await sign(claims({ sub: 'uidBob00000000000000002', email: 'bob@example.com' }));
  await handleApi(req('POST', '/api/v1/tasks', { token: alice, body: { title: 'Bí mật của Alice', date: '2026-11-16' } }), ctx(be));
  const bobPlan = await (await handleApi(req('GET', '/api/v1/plan', { token: bob }), ctx(be))).json();
  assert.equal(bobPlan.state.tasks.length, 0);
});

// ---------- Mã kết nối cá nhân ----------

test('tạo mã: trả mã đúng một lần, máy chủ chỉ lưu SHA-256 của mã', async () => {
  const be = fakeBackend();
  const c = ctx(be);
  const t = await ALICE();
  const res = await handleApi(req('POST', '/api/v1/tokens', { token: t, body: { name: 'Trợ lý AI', scopes: ['plan:read', 'tasks:write'], days: 7 } }), c);
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.ok(body.token.startsWith('sft_'));
  assert.equal(body.id, await sha256Hex(body.token));
  assert.deepEqual(body.scopes, ['plan:read', 'tasks:write']);
  const stored = be.docs.get('apiTokens/' + body.id);
  assert.ok(stored, 'có bản ghi theo hash');
  assert.ok(!JSON.stringify([...be.docs.values()]).includes(body.token), 'không lưu mã gốc');
  // Liệt kê không lộ mã.
  const list = await (await handleApi(req('GET', '/api/v1/tokens', { token: t }), c)).json();
  assert.equal(list.tokens.length, 1);
  assert.ok(!JSON.stringify(list).includes(body.token));
});

test('tạo mã: quyền lạ, không có quyền, ngày sai đều bị từ chối', async () => {
  const be = fakeBackend();
  const c = ctx(be);
  const t = await ALICE();
  const post = body => handleApi(req('POST', '/api/v1/tokens', { token: t, body }), c);
  assert.equal((await post({ name: 'x', scopes: ['admin:all'] })).status, 400);
  assert.equal((await post({ name: 'x', scopes: [] })).status, 400);
  assert.equal((await post({ name: '', scopes: ['plan:read'] })).status, 400);
  assert.equal((await post({ name: 'x', scopes: ['plan:read'], days: 91 })).status, 400);
  assert.equal((await post({ name: 'x', scopes: ['plan:read'], days: 0 })).status, 400);
});

test('mã cá nhân dùng được đúng phạm vi; thiếu quyền thì 403', async () => {
  const be = fakeBackend();
  const c = ctx(be);
  const tok = await makeToken(be, c, { scopes: ['tasks:read'] });
  assert.equal((await handleApi(req('GET', '/api/v1/tasks?date=2026-11-16', { token: tok }), c)).status, 200);
  const before = be.calls.length;
  const denied = await handleApi(req('GET', '/api/v1/plan', { token: tok }), c);
  assert.equal(denied.status, 403);
  // Bước xác thực chỉ đọc bản ghi mã; không có lệnh nào tới dữ liệu kế hoạch.
  assert.equal(be.calls.slice(before).filter(x => x.url.includes('/planners/')).length, 0, 'bị chặn trước khi chạm dữ liệu');
});

test('mã cá nhân đọc/ghi dữ liệu của chủ mã (uid lấy từ bản ghi), dùng token dịch vụ', async () => {
  const be = fakeBackend();
  const c = ctx(be);
  const tok = await makeToken(be, c, { scopes: ['tasks:write', 'tasks:read'] });
  const add = await handleApi(req('POST', '/api/v1/tasks', { token: tok, body: { title: 'Qua mã', date: '2026-11-16' } }), c);
  assert.equal(add.status, 201);
  const list = await (await handleApi(req('GET', '/api/v1/tasks?date=2026-11-16', { token: tok }), c)).json();
  assert.equal(list.tasks.length, 1);
  assert.ok(be.docs.has('planners/' + ALICE_UID), 'ghi đúng kế hoạch của chủ mã');
  const planCalls = be.calls.filter(x => x.url.includes('/planners/'));
  for (const x of planCalls) assert.match(x.auth, /^Bearer ya29\.admin-/);
});

test('mã cá nhân không tự tạo hoặc liệt kê được mã khác (chỉ đăng nhập trên trang)', async () => {
  const be = fakeBackend();
  const c = ctx(be);
  const tok = await makeToken(be, c);
  assert.equal((await handleApi(req('POST', '/api/v1/tokens', { token: tok, body: { name: 'x', scopes: ['plan:read'] } }), c)).status, 403);
  assert.equal((await handleApi(req('GET', '/api/v1/tokens', { token: tok }), c)).status, 403);
});

test('mã cá nhân sai, hết hạn, hoặc đã thu hồi đều 401', async () => {
  const be = fakeBackend();
  const c = ctx(be);
  assert.equal((await handleApi(req('GET', '/api/v1/plan', { token: 'sft_khong_co_that' }), c)).status, 401);
  const tok = await makeToken(be, c, { days: 1 });
  const later = ctx(be, { now: NOW + 2 * 86400000 });
  assert.equal((await handleApi(req('GET', '/api/v1/tasks', { token: tok }), later)).status, 401, 'hết hạn');

  const tok2 = await makeToken(be, c, { name: 'Thu hồi' });
  const id = await sha256Hex(tok2);
  assert.equal((await handleApi(req('DELETE', `/api/v1/tokens/${id}`, { token: await ALICE() }), c)).status, 204);
  assert.equal((await handleApi(req('GET', '/api/v1/plan', { token: tok2 }), c)).status, 401, 'đã thu hồi');
});

test('chỉ chủ mã mới thu hồi được; người khác nhận 404 (không lộ mã tồn tại)', async () => {
  const be = fakeBackend();
  const c = ctx(be);
  const tok = await makeToken(be, c);
  const id = await sha256Hex(tok);
  const bob = await sign(claims({ sub: 'uidBob00000000000000002', email: 'bob@example.com' }));
  assert.equal((await handleApi(req('DELETE', `/api/v1/tokens/${id}`, { token: bob }), c)).status, 404);
  assert.ok(be.docs.has('apiTokens/' + id), 'mã vẫn còn');
});

test('giới hạn số mã mỗi người', async () => {
  const be = fakeBackend();
  const c = ctx(be);
  for (let i = 0; i < TOKENS_PER_USER; i++) await makeToken(be, c, { name: 'm' + i });
  const t = await ALICE();
  const res = await handleApi(req('POST', '/api/v1/tokens', { token: t, body: { name: 'thừa', scopes: ['plan:read'] } }), c);
  assert.equal(res.status, 409);
});

test('thiếu tài khoản dịch vụ: mã cá nhân trả 503, API đăng nhập trên trang vẫn chạy', async () => {
  const be = fakeBackend();
  const withSa = ctx(be);
  const tok = await makeToken(be, withSa);
  const noSa = ctx(be, { serviceAccount: null });
  assert.equal((await handleApi(req('GET', '/api/v1/tasks', { token: tok }), noSa)).status, 503);
  assert.equal((await handleApi(req('GET', '/api/v1/me', { token: await ALICE() }), noSa)).status, 200);
});

// ---------- Giới hạn tốc độ ----------

test('giới hạn tốc độ theo người dùng: vượt ngưỡng thì 429 kèm Retry-After', async () => {
  const be = fakeBackend();
  const sub = 'uidRate000000000000000003';
  const t = await sign(claims({ sub }));
  const c = ctx(be, { rateLimitPerMinute: 3 });
  for (let i = 0; i < 3; i++) assert.equal((await handleApi(req('GET', '/api/v1/me', { token: t }), c)).status, 200);
  const limited = await handleApi(req('GET', '/api/v1/me', { token: t }), c);
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get('retry-after'), '60');
});

// ---------- MCP ----------

async function mcp(be, c, token, msg) {
  return handleApi(req('POST', '/api/v1/mcp', { token, body: msg }), c);
}

test('MCP: khởi tạo, danh sách công cụ theo phạm vi, ping', async () => {
  const be = fakeBackend();
  const c = ctx(be);
  const tok = await makeToken(be, c, { scopes: ['tasks:read', 'cards:read'] });
  const init = await (await mcp(be, c, tok, { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } })).json();
  assert.equal(init.result.protocolVersion, '2025-06-18');
  assert.ok(init.result.capabilities.tools);
  const list = await (await mcp(be, c, tok, { jsonrpc: '2.0', id: 2, method: 'tools/list' })).json();
  const names = list.result.tools.map(t => t.name).sort();
  assert.deepEqual(names, ['list_due_cards', 'list_tasks']);
  const ping = await (await mcp(be, c, tok, { jsonrpc: '2.0', id: 3, method: 'ping' })).json();
  assert.deepEqual(ping.result, {});
});

test('MCP: gọi công cụ thêm việc, rồi xem lại; thiếu quyền thì lỗi công cụ', async () => {
  const be = fakeBackend();
  const c = ctx(be);
  const tok = await makeToken(be, c, { scopes: ['tasks:write', 'tasks:read'] });
  const add = await (await mcp(be, c, tok, { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'add_task', arguments: { title: 'Ôn MCP', date: '2026-11-16' } } })).json();
  assert.equal(add.result.isError, false);
  assert.match(add.result.content[0].text, /Ôn MCP/);
  const view = await (await mcp(be, c, tok, { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'list_tasks', arguments: { date: '2026-11-16' } } })).json();
  assert.equal(JSON.parse(view.result.content[0].text).tasks.length, 1);
  const denied = await (await mcp(be, c, tok, { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'add_card', arguments: { front: 'x' } } })).json();
  assert.equal(denied.result.isError, true);
});

test('MCP: lỗi nghiệp vụ trả isError, không làm hỏng giao thức; công cụ lạ trả lỗi JSON-RPC', async () => {
  const be = fakeBackend();
  const c = ctx(be);
  const tok = await makeToken(be, c, { scopes: ['cards:write'] });
  const bad = await (await mcp(be, c, tok, { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'review_card', arguments: { id: 'khong_co', remembered: true } } })).json();
  assert.equal(bad.result.isError, true);
  assert.match(bad.result.content[0].text, /Không tìm thấy/);
  const unknown = await (await mcp(be, c, tok, { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'xoa_het' } })).json();
  assert.equal(unknown.error.code, -32602);
});

test('MCP: thông báo không có id trả 202; JSON hỏng trả 400; GET trả 405; batch trả mảng', async () => {
  const be = fakeBackend();
  const c = ctx(be);
  const tok = await makeToken(be, c);
  const note = await mcp(be, c, tok, { jsonrpc: '2.0', method: 'notifications/initialized' });
  assert.equal(note.status, 202);
  const bad = await handleApi(req('POST', '/api/v1/mcp', { token: tok, body: '{hỏng' }), c);
  assert.equal(bad.status, 400);
  const get = await handleApi(req('GET', '/api/v1/mcp', { token: tok }), c);
  assert.equal(get.status, 405);
  const batch = await (await mcp(be, c, tok, [{ jsonrpc: '2.0', id: 1, method: 'ping' }, { jsonrpc: '2.0', id: 2, method: 'ping' }])).json();
  assert.equal(batch.length, 2);
});

test('MCP: không có token thì 401; mã chỉ có quyền đọc không thấy công cụ ghi', async () => {
  const be = fakeBackend();
  const c = ctx(be);
  const anon = await handleApi(req('POST', '/api/v1/mcp', { body: { jsonrpc: '2.0', id: 1, method: 'ping' } }), c);
  assert.equal(anon.status, 401);
  const tok = await makeToken(be, c, { scopes: ['tasks:read'] });
  const list = await (await mcp(be, c, tok, { jsonrpc: '2.0', id: 1, method: 'tools/list' })).json();
  assert.ok(!list.result.tools.some(t => t.name === 'add_task'));
});

test('todayFor: múi giờ mặc định là Việt Nam, kẹp giá trị, từ chối tham số sai', () => {
  const url = p => new URL('https://x.test/' + p);
  assert.equal(todayFor(url(''), NOW), '2026-11-16');
  assert.equal(todayFor(url('a?utc_offset=-600'), NOW), '2026-11-15');
  assert.equal(todayFor(url('a?utc_offset=9999'), NOW), todayFor(url('a?utc_offset=840'), NOW));
  assert.throws(() => todayFor(url('a?utc_offset=abc'), NOW));
  assert.throws(() => todayFor(url('a?utc_offset=99999'), NOW));
});
