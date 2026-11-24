// Kiểm thử API v1: xác thực token thật (RSA), Firestore giả có khoá lạc quan, định tuyến và giới hạn.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const api = await import(pathToFileURL(path.join(HERE, '..', 'src', 'api.js')).href);
const { handleApi, verifyIdToken, todayFor } = api;

const PROJECT = 'study-focus-fox';
const NOW = Date.UTC(2026, 10, 16, 3, 0, 0); // 16/11/2026 10:00 giờ Việt Nam
const subtle = globalThis.crypto.subtle;
const b64u = buf => Buffer.from(buf).toString('base64url');

const pair = await subtle.generateKey(
  { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
  true, ['sign', 'verify']);
const pub = await subtle.exportKey('jwk', pair.publicKey);
const KEYS = [{ ...pub, kid: 'k1', alg: 'RS256', use: 'sig' }];

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

// Firestore giả: lưu tài liệu theo uid, kiểm precondition như Firestore thật, ghi nhận token của mỗi lần gọi.
function fakeFirestore() {
  const docs = new Map(); // uid -> { state, updateTime }
  const calls = [];
  let tick = 0;
  const fetchFn = async (url, opts = {}) => {
    const auth = (opts.headers && opts.headers.Authorization) || '';
    if (url.includes('googleapis.com/service_accounts')) {
      return new Response(JSON.stringify({ keys: KEYS }), { headers: { 'cache-control': 'max-age=600' } });
    }
    calls.push({ url, method: opts.method || 'GET', auth });
    const docMatch = /documents\/planners\/([^/?]+)$/.exec(url);
    if (docMatch && (!opts.method || opts.method === 'GET')) {
      const d = docs.get(docMatch[1]);
      if (!d) return new Response('{}', { status: 404 });
      return new Response(JSON.stringify({ fields: { state: { stringValue: d.state } }, updateTime: d.updateTime }));
    }
    if (url.endsWith(':commit')) {
      const body = JSON.parse(opts.body);
      const w = body.writes[0];
      const uid = w.update.name.split('/').pop();
      const cur = docs.get(uid);
      const pre = w.currentDocument || {};
      if (pre.exists === false && cur) return new Response('{"error":{"status":"FAILED_PRECONDITION"}}', { status: 400 });
      if (pre.updateTime && (!cur || cur.updateTime !== pre.updateTime)) {
        return new Response('{"error":{"status":"FAILED_PRECONDITION"}}', { status: 400 });
      }
      tick += 1;
      docs.set(uid, { state: w.update.fields.state.stringValue, updateTime: 'ut' + tick });
      return new Response('{}', { status: 200 });
    }
    return new Response('{}', { status: 500 });
  };
  return { fetchFn, docs, calls };
}

function req(method, p, { token, body, type = 'application/json', headers = {} } = {}) {
  const h = { ...headers };
  if (token) h.Authorization = 'Bearer ' + token;
  if (body !== undefined) {
    h['Content-Type'] = type;
    h['Content-Length'] = String(typeof body === 'string' ? body.length : JSON.stringify(body).length);
  }
  return new Request('https://site.test' + p, { method, headers: h, body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)) });
}

function ctx(fs, over = {}) {
  return { projectId: PROJECT, fetchFn: fs.fetchFn, keys: KEYS, now: NOW, newId: p => p + '_' + Math.random().toString(36).slice(2, 10), ...over };
}

const ALICE = () => sign(claims());

// ---------- Xác thực ----------

test('token hợp lệ cho ra uid; token sai chữ ký, sai aud, hết hạn, alg none, anonymous đều bị từ chối', async () => {
  const good = await verifyIdToken(await ALICE(), { projectId: PROJECT, keys: KEYS, now: NOW });
  assert.equal(good.uid, 'uidAlice0000000000000001');
  assert.equal(good.emailVerified, true);

  const other = await subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  const forged = await sign(claims(), { privateKey: other.privateKey });
  const tamperedPayload = (await ALICE()).split('.');
  tamperedPayload[1] = b64u(JSON.stringify(claims({ sub: 'uidVictim' })));
  const cases = {
    'chữ ký khác': forged,
    'payload bị sửa': tamperedPayload.join('.'),
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

// ---------- Định tuyến và bảo mật HTTP ----------

test('không có token thì 401; không cấu hình Firebase thì 503', async () => {
  const fs = fakeFirestore();
  const r1 = await handleApi(req('GET', '/api/v1/plan'), ctx(fs));
  assert.equal(r1.status, 401);
  const r2 = await handleApi(req('GET', '/api/v1/plan', { token: await ALICE() }), ctx(fs, { projectId: null }));
  assert.equal(r2.status, 503);
});

test('đường dẫn lạ 404, sai phương thức 405 kèm Allow, phản hồi không cache và có nosniff', async () => {
  const fs = fakeFirestore();
  const t = await ALICE();
  const r404 = await handleApi(req('GET', '/api/v1/khong-co', { token: t }), ctx(fs));
  assert.equal(r404.status, 404);
  const r405 = await handleApi(req('DELETE', '/api/v1/plan', { token: t }), ctx(fs));
  assert.equal(r405.status, 405);
  assert.equal(r405.headers.get('allow'), 'GET, PUT');
  const ok = await handleApi(req('GET', '/api/v1/me', { token: t }), ctx(fs));
  assert.equal(ok.headers.get('cache-control'), 'no-store');
  assert.equal(ok.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(ok.headers.get('access-control-allow-origin'), null, 'không mở CORS');
});

test('body: sai Content-Type 415, JSON hỏng 400, quá lớn 413', async () => {
  const fs = fakeFirestore();
  const t = await ALICE();
  const c = ctx(fs);
  const r415 = await handleApi(req('POST', '/api/v1/tasks', { token: t, body: '{}', type: 'text/plain' }), c);
  assert.equal(r415.status, 415);
  const r400 = await handleApi(req('POST', '/api/v1/tasks', { token: t, body: '{nhiều' }), c);
  assert.equal(r400.status, 400);
  const big = JSON.stringify({ title: 'x'.repeat(20000) });
  const r413 = await handleApi(req('POST', '/api/v1/tasks', { token: t, body: big }), c);
  assert.equal(r413.status, 413);
});

// ---------- Dữ liệu: người dùng chỉ thấy và ghi dữ liệu của mình ----------

test('mọi lệnh Firestore đều mang token của người dùng (quy tắc bảo mật áp dụng)', async () => {
  const fs = fakeFirestore();
  const t = await ALICE();
  await handleApi(req('GET', '/api/v1/plan', { token: t }), ctx(fs));
  await handleApi(req('POST', '/api/v1/tasks', { token: t, body: { title: 'Đọc', date: '2026-11-16' } }), ctx(fs));
  assert.ok(fs.calls.length >= 2);
  for (const c of fs.calls) assert.equal(c.auth, 'Bearer ' + t, 'không dùng khoá nào khác token người dùng');
  // Đường dẫn chỉ có uid của chính người dùng đã xác thực.
  for (const c of fs.calls) assert.ok(c.url.includes('planners/uidAlice0000000000000001') || c.url.endsWith(':commit'));
});

test('tác vụ việc cần làm: thêm, đọc theo ngày, đánh dấu xong, xoá', async () => {
  const fs = fakeFirestore();
  const c = ctx(fs);
  const t = await ALICE();
  const add = await handleApi(req('POST', '/api/v1/tasks', { token: t, body: { title: 'Ôn Econometrics', course: 'kinh-te-luong', date: '2026-11-16' } }), c);
  assert.equal(add.status, 201);
  const { task } = await add.json();
  const list = await handleApi(req('GET', '/api/v1/tasks?date=2026-11-16', { token: t }), c);
  assert.equal((await list.json()).tasks.length, 1);
  const tog = await handleApi(req('POST', `/api/v1/tasks/${task.id}/toggle`, { token: t, body: {} }), c);
  assert.equal((await tog.json()).task.done, true);
  const del = await handleApi(req('DELETE', `/api/v1/tasks/${task.id}`, { token: t }), c);
  assert.equal(del.status, 204);
  const after = await handleApi(req('GET', '/api/v1/tasks?date=2026-11-16', { token: t }), c);
  assert.equal((await after.json()).tasks.length, 0);
});

test('thẻ ôn: thêm, xem thẻ đến hạn theo múi giờ, chấm nhớ/quên', async () => {
  const fs = fakeFirestore();
  const c = ctx(fs);
  const t = await ALICE();
  const add = await handleApi(req('POST', '/api/v1/cards', { token: t, body: { front: 'OLS?', back: 'Bình phương tối thiểu' } }), c);
  assert.equal(add.status, 201);
  const { card } = await add.json();
  const due = await handleApi(req('GET', '/api/v1/cards/due?utc_offset=420', { token: t }), c);
  const dj = await due.json();
  assert.equal(dj.today, '2026-11-16');
  assert.equal(dj.cards.length, 1);
  const rv = await handleApi(req('POST', `/api/v1/cards/${card.id}/review`, { token: t, body: { remembered: true } }), c);
  assert.equal((await rv.json()).card.box, 2);
  const badRv = await handleApi(req('POST', `/api/v1/cards/${card.id}/review`, { token: t, body: { remembered: 'có' } }), c);
  assert.equal(badRv.status, 400);
  const missing = await handleApi(req('POST', '/api/v1/cards/khong_co/review', { token: t, body: { remembered: true } }), c);
  assert.equal(missing.status, 404);
});

test('ghi đè có kiểm tra: PUT với mốc cũ bị 409, không ghi đè dữ liệu mới hơn', async () => {
  const fs = fakeFirestore();
  const c = ctx(fs);
  const t = await ALICE();
  const first = await handleApi(req('PUT', '/api/v1/plan', { token: t, body: { state: { v: 2, tasks: [] } } }), c);
  assert.equal(first.status, 200);
  const { state } = await first.json();
  // Máy khác ghi một phút sau (đồng hồ tiến lên giữa các lần gọi).
  await handleApi(req('POST', '/api/v1/tasks', { token: t, body: { title: 'Từ máy khác', date: '2026-11-16' } }), ctx(fs, { now: NOW + 60000 }));
  const stale = await handleApi(req('PUT', '/api/v1/plan', { token: t, body: { state: { v: 2, tasks: [] }, base: state.updated } }), ctx(fs, { now: NOW + 120000 }));
  assert.equal(stale.status, 409);
  const plan = await (await handleApi(req('GET', '/api/v1/plan', { token: t }), c)).json();
  assert.equal(plan.state.tasks.length, 1, 'dữ liệu của máy khác vẫn còn');
});

test('dữ liệu của người khác không lộ: mỗi uid có tài liệu riêng', async () => {
  const fs = fakeFirestore();
  const c = ctx(fs);
  const alice = await ALICE();
  const bob = await sign(claims({ sub: 'uidBob00000000000000002', email: 'bob@example.com' }));
  await handleApi(req('POST', '/api/v1/tasks', { token: alice, body: { title: 'Bí mật của Alice', date: '2026-11-16' } }), c);
  const bobPlan = await (await handleApi(req('GET', '/api/v1/plan', { token: bob }), c)).json();
  assert.equal(bobPlan.state.tasks.length, 0);
});

test('todayFor: múi giờ được kẹp và tham số sai bị từ chối', () => {
  const url = p => new URL('https://x.test/' + p);
  assert.equal(todayFor(url('a?utc_offset=420'), NOW), '2026-11-16');
  assert.equal(todayFor(url('a?utc_offset=-600'), NOW), '2026-11-15');
  assert.equal(todayFor(url('a?utc_offset=9999'), NOW), todayFor(url('a?utc_offset=840'), NOW));
  assert.throws(() => todayFor(url('a?utc_offset=99999'), NOW), 'quá nhiều chữ số bị từ chối');
  assert.throws(() => todayFor(url('a?utc_offset=abc'), NOW));
});
