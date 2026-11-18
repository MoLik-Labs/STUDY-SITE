import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCloud, decideSync, parseAuthFragment, SESSION_KEY } from '../src/cloud.js';

const UID = '6f1c2a3e-1111-4222-8333-444455556666';
const CFG = { url: 'https://proj.supabase.co', key: 'sb_publishable_test' };

function memStorage() {
  const m = new Map();
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: k => m.delete(k),
  };
}

function fakeFetch(routes) {
  const calls = [];
  const fn = async (url, opts = {}) => {
    calls.push({ url, method: opts.method, headers: opts.headers, body: opts.body });
    const key = opts.method + ' ' + url.replace(CFG.url, '');
    const hit = Object.keys(routes).find(k => key.startsWith(k));
    if (!hit) return new Response('{"msg":"no route ' + key + '"}', { status: 404 });
    const r = routes[hit];
    const status = r.status || 200;
    return new Response(r.body === undefined ? '' : JSON.stringify(r.body), { status });
  };
  fn.calls = calls;
  return fn;
}

test('parseAuthFragment đọc token, lỗi và bỏ qua hash rỗng', () => {
  assert.equal(parseAuthFragment(''), null);
  assert.equal(parseAuthFragment('#foo=1'), null);
  const ok = parseAuthFragment('#access_token=AAA&refresh_token=RRR&expires_in=3600&token_type=bearer');
  assert.deepEqual(ok, { access_token: 'AAA', refresh_token: 'RRR', expires_in: 3600 });
  const err = parseAuthFragment('#error=access_denied&error_description=Email+link+is+invalid');
  assert.deepEqual(err, { error: 'Email link is invalid' });
});

test('decideSync: bên mới hơn thắng, thiếu mốc thì xử lý an toàn', () => {
  assert.equal(decideSync('2026-11-18T10:00:00Z', '2026-11-18T09:00:00Z'), 'push');
  assert.equal(decideSync('2026-11-18T09:00:00Z', '2026-11-18T10:00:00Z'), 'pull');
  assert.equal(decideSync('2026-11-18T09:00:00Z', '2026-11-18T09:00:00Z'), 'none');
  assert.equal(decideSync(null, '2026-11-18T09:00:00Z'), 'pull');
  assert.equal(decideSync('2026-11-18T09:00:00Z', null), 'push');
  assert.equal(decideSync(null, null), 'none');
});

test('không có cấu hình thì enabled=false và gọi mạng báo lỗi rõ', async () => {
  const c = createCloud({ config: null, storage: memStorage(), fetchImpl: fakeFetch({}) });
  assert.equal(c.enabled, false);
  assert.equal(c.signedIn(), false);
  await assert.rejects(c.pullPlan(UID), /chưa được bật/);
});

test('handleCallback lưu phiên và xoá được thông tin đăng nhập', async () => {
  const storage = memStorage();
  const f = fakeFetch({ 'GET /auth/v1/user': { body: { id: UID, email: 'a@b.co' } } });
  const c = createCloud({ config: CFG, storage, fetchImpl: f, now: () => 1000 });
  const r = await c.handleCallback('#access_token=AAA&refresh_token=RRR&expires_in=3600');
  assert.equal(r.ok, true);
  assert.equal(c.userId(), UID);
  assert.equal(c.email(), 'a@b.co');
  assert.equal(f.calls[0].headers.Authorization, 'Bearer AAA');
  await c.signOut();
  assert.equal(c.signedIn(), false);
  assert.equal(storage.getItem(SESSION_KEY), null);
});

test('handleCallback báo lỗi khi Supabase trả error và không lưu phiên', async () => {
  const storage = memStorage();
  const c = createCloud({ config: CFG, storage, fetchImpl: fakeFetch({}) });
  const r = await c.handleCallback('#error=access_denied&error_description=Expired');
  assert.equal(r.ok, false);
  assert.equal(c.signedIn(), false);
});

test('pullPlan và pushPlan dùng đúng RLS: chỉ lọc theo uid đã kiểm tra định dạng', async () => {
  const storage = memStorage();
  storage.setItem(SESSION_KEY, JSON.stringify({ access_token: 'AAA', refresh_token: 'R', expires_at: 10 ** 13, user_id: UID, email: '' }));
  const f = fakeFetch({
    'GET /rest/v1/planner_states': { body: [{ state: { v: 2 }, updated_at: '2026-11-18T00:00:00Z' }] },
    'POST /rest/v1/planner_states': { status: 201 },
  });
  const c = createCloud({ config: CFG, storage, fetchImpl: f, now: () => 0 });
  const row = await c.pullPlan(UID);
  assert.equal(row.updated_at, '2026-11-18T00:00:00Z');
  await c.pushPlan(UID, { v: 2, updated: '2026-11-18T01:00:00Z' });
  const post = f.calls.find(x => x.method === 'POST');
  assert.match(post.url, /on_conflict=user_id/);
  assert.equal(JSON.parse(post.body).user_id, UID);
  assert.equal(post.headers.Prefer, 'resolution=merge-duplicates,return=minimal');
});

test('uid sai định dạng bị từ chối trước khi gọi mạng (chống injection vào URL)', async () => {
  const storage = memStorage();
  storage.setItem(SESSION_KEY, JSON.stringify({ access_token: 'AAA', refresh_token: 'R', expires_at: 10 ** 13, user_id: UID, email: '' }));
  const f = fakeFetch({});
  const c = createCloud({ config: CFG, storage, fetchImpl: f, now: () => 0 });
  await assert.rejects(c.pullPlan('x&user_id=neq.0'), /không hợp lệ/);
  await assert.rejects(c.deletePlan('../rpc'), /không hợp lệ/);
  assert.equal(f.calls.length, 0);
});

test('token hết hạn được làm mới bằng refresh token', async () => {
  const storage = memStorage();
  storage.setItem(SESSION_KEY, JSON.stringify({ access_token: 'OLD', refresh_token: 'R1', expires_at: 0, user_id: UID, email: '' }));
  const f = fakeFetch({
    'POST /auth/v1/token': { body: { access_token: 'NEW', refresh_token: 'R2', expires_in: 3600 } },
    'GET /rest/v1/profiles': { body: [] },
  });
  const c = createCloud({ config: CFG, storage, fetchImpl: f, now: () => 1_000_000 });
  await c.getProfile(UID);
  assert.equal(f.calls[1].headers.Authorization, 'Bearer NEW');
  assert.equal(JSON.parse(storage.getItem(SESSION_KEY)).refresh_token, 'R2');
});

test('refresh thất bại thì xoá phiên và báo người dùng đăng nhập lại', async () => {
  const storage = memStorage();
  storage.setItem(SESSION_KEY, JSON.stringify({ access_token: 'OLD', refresh_token: 'R1', expires_at: 0, user_id: UID, email: '' }));
  const f = fakeFetch({ 'POST /auth/v1/token': { status: 400, body: { msg: 'bad' } } });
  const c = createCloud({ config: CFG, storage, fetchImpl: f, now: () => 1_000_000 });
  await assert.rejects(c.getProfile(UID), /đăng nhập lại/);
  assert.equal(c.signedIn(), false);
});

test('deleteAccount gọi RPC delete_my_account rồi xoá phiên', async () => {
  const storage = memStorage();
  storage.setItem(SESSION_KEY, JSON.stringify({ access_token: 'AAA', refresh_token: 'R', expires_at: 10 ** 13, user_id: UID, email: '' }));
  const f = fakeFetch({ 'POST /rest/v1/rpc/delete_my_account': { status: 200 } });
  const c = createCloud({ config: CFG, storage, fetchImpl: f, now: () => 0 });
  await c.deleteAccount();
  assert.match(f.calls[0].url, /rpc\/delete_my_account$/);
  assert.equal(c.signedIn(), false);
});

test('googleUrl chứa redirect_to đã mã hoá', () => {
  const c = createCloud({ config: CFG, storage: memStorage(), redirectTo: 'https://x.test/tai-khoan/' });
  assert.equal(c.googleUrl(), 'https://proj.supabase.co/auth/v1/authorize?provider=google&redirect_to=https%3A%2F%2Fx.test%2Ftai-khoan%2F');
});
