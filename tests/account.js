#!/usr/bin/env node
/**
 * tests/account.js — tài khoản & đồng bộ, chạy hoàn toàn offline.
 *
 * Dùng một máy chủ Supabase GIẢ trong bộ nhớ (không gọi mạng thật) để kiểm:
 *   1. Build: khoá bí mật bị từ chối; CSP chỉ mở origin Supabase khi có cấu hình
 *   2. Chưa đăng nhập → không gọi mạng lúc khởi động
 *   3. Chỉ đẩy các khoá đã đổi (không đẩy lại toàn bộ)
 *   4. Thay đổi từ máy khác: CHỜ tới khi tải lại, không ghi đè app đang chạy
 *   5. Xung đột: khoá đang sửa trên máy này được giữ nguyên
 *   6. Đăng nhập PKCE: đổi ?code= lấy phiên, xoá code khỏi URL
 *   7. Đăng xuất xoá phiên và trạng thái đồng bộ, giữ dữ liệu trên máy
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

let JSDOM, VirtualConsole;
try { ({ JSDOM, VirtualConsole } = require('jsdom')); }
catch (e) { console.error('✗ thiếu jsdom — chạy: npm ci'); process.exit(2); }

const ROOT = path.resolve(__dirname, '..');
const BUILT = path.join(ROOT, 'index.html');
const CLOUD_HTML = '/tmp/foxfocus-cloud-test.html';
const URL_ = 'https://ljsmiazfmmdxoprjggke.supabase.co';
const KEY = 'sb_publishable_testkey_0123456789';

const results = [];
const ok = (name, cond, note) => results.push({ name, pass: !!cond, note: note || '' });

/* FNV-1a giống src/account.js, để tạo đúng trạng thái "đã đồng bộ" ban đầu */
const hashOf = v => {
  const s = JSON.stringify(v === undefined ? null : v);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16) + ':' + s.length;
};

/* ---------- 1. build: cấu hình & CSP ---------- */
function build(env, out) {
  const r = spawnSync('python3', ['src/build.py', '--out', out], {
    cwd: ROOT, encoding: 'utf8', env: Object.assign({}, process.env, env),
  });
  return r;
}
const cloud = build({ SUPABASE_URL: URL_, SUPABASE_PUBLISHABLE_KEY: KEY }, CLOUD_HTML);
ok('build có cấu hình đám mây thành công', cloud.status === 0, cloud.stderr.slice(-200));
const cloudHtml = fs.existsSync(CLOUD_HTML) ? fs.readFileSync(CLOUD_HTML, 'utf8') : '';
ok('bản đám mây nhúng đúng URL', cloudHtml.includes('"url": "' + URL_ + '"'));
ok('CSP bản đám mây mở connect-src tới Supabase', /connect-src 'self' https:\/\/ljsmiazfmmdxoprjggke\.supabase\.co/.test(cloudHtml));

const secret = build({ SUPABASE_URL: URL_, SUPABASE_PUBLISHABLE_KEY: 'sb_secret_abcdefghijk' }, '/tmp/foxfocus-secret.html');
ok('khoá bí mật bị từ chối khi build', secret.status !== 0 && /BÍ MẬT/.test(secret.stderr));
const badUrl = build({ SUPABASE_URL: 'http://evil.example', SUPABASE_PUBLISHABLE_KEY: KEY }, '/tmp/foxfocus-bad.html');
ok('URL không phải supabase.co bị từ chối', badUrl.status !== 0);

const plain = fs.readFileSync(BUILT, 'utf8');
ok('bản thường: không mở connect-src tới bên thứ ba', /connect-src 'self';/.test(plain));
ok('bản thường: không nhúng URL Supabase', !plain.includes('supabase.co'));

/* ---------- máy chủ Supabase giả ---------- */
function makeServer() {
  const srv = {
    rows: {}, calls: [], bodies: [], profile: null, delay: 0,
    user: { id: 'u1', email: 'hoc.sinh@example.com' },
    /* đặt dữ liệu đám mây như thể đã được ghi lúc `at` (mặc định: bây giờ) */
    put(key, value, at) { srv.rows[key] = { value, at: at || new Date().toISOString() }; },
  };
  srv.handle = async (url, o) => {
    o = o || {};
    const u = new URL(url);
    const m = o.method || 'GET';
    const body = o.body ? JSON.parse(o.body) : null;
    srv.calls.push(m + ' ' + u.pathname + u.search);
    const reply = (status, obj) => ({ ok: status < 300, status, text: async () => (obj === undefined ? '' : JSON.stringify(obj)) });
    if (u.pathname === '/auth/v1/otp') return reply(200, {});
    if (u.pathname === '/auth/v1/logout') return reply(204);
    if (u.pathname === '/auth/v1/token') {
      const g = u.searchParams.get('grant_type');
      if (g === 'pkce') return reply(200, { access_token: 'A1', refresh_token: 'R1', expires_in: 3600, user: srv.user });
      if (g === 'refresh_token') return reply(200, { access_token: 'A2', refresh_token: 'R2', expires_in: 3600, user: srv.user });
    }
    const auth = (o.headers && o.headers.Authorization) || '';
    if (u.pathname.startsWith('/rest/') && !/^Bearer A[12]$/.test(auth)) return reply(401, { msg: 'JWT' });
    if (u.pathname === '/rest/v1/user_state') {
      if (m === 'GET') {
        const gt = u.searchParams.get('updated_at');
        const min = gt ? Date.parse(gt.replace(/^gt\./, '')) : -Infinity;
        return reply(200, Object.keys(srv.rows)
          .filter(k => Date.parse(srv.rows[k].at) > min)
          .map(k => ({ key: k, value: srv.rows[k].value, updated_at: srv.rows[k].at })));
      }
      if (m === 'POST') {
        if (srv.delay) await new Promise(r => setTimeout(r, srv.delay));
        srv.bodies.push(body.map(r => r.key));
        const now = new Date().toISOString();
        body.forEach(r => { srv.rows[r.key] = { value: r.value, at: now }; });
        return reply(201);
      }
    }
    if (u.pathname === '/rest/v1/profiles') {
      if (m === 'GET') return reply(200, srv.profile ? [srv.profile] : []);
      if (m === 'POST') { srv.profile = body; return reply(201); }
    }
    if (u.pathname === '/rest/v1/rpc/delete_my_account') { srv.rows = {}; return reply(204); }
    if (m === 'DELETE' && /^\/rest\/v1\/(user_state|lesson_progress|answers|notes|review_cards|layouts)$/.test(u.pathname)) {
      if (srv.failDelete === u.pathname) return reply(500, { msg: 'lỗi giả lập' });
      srv.deleted = (srv.deleted || []).concat(u.pathname);
      if (u.pathname === '/rest/v1/user_state') srv.rows = {};
      return reply(204);
    }
    if (m === 'PATCH' && u.pathname === '/rest/v1/profiles') {
      srv.profilePatch = body; if (srv.profile) Object.assign(srv.profile, body); return reply(204);
    }
    return reply(404, { msg: 'không có tuyến ' + u.pathname });
  };
  return srv;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* Mở trang trong jsdom. `storage` là localStorage có sẵn; `hash` là URL phụ. */
async function open(html, storage, srv, opts) {
  opts = opts || {};
  const vc = new VirtualConsole();
  const errors = [];
  vc.on('jsdomError', e => errors.push(String(e && e.message || e)));
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', url: opts.url || 'https://app.test/', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.scrollTo = () => {}; w.print = () => {};
      if (!w.matchMedia) w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
      if (!w.Element.prototype.scrollIntoView) w.Element.prototype.scrollIntoView = () => {};
      if (!w.crypto || !w.crypto.subtle) Object.defineProperty(w, 'crypto', { value: crypto.webcrypto, configurable: true });
      if (!w.TextEncoder) w.TextEncoder = TextEncoder;
      w.fetch = (u, o) => srv.handle(u, o);
      Object.keys(storage || {}).forEach(k => w.localStorage.setItem(k, storage[k]));
    },
  });
  await sleep(opts.wait || 250);
  const dump = {};
  for (let i = 0; i < dom.window.localStorage.length; i++) {
    const k = dom.window.localStorage.key(i);
    dump[k] = dom.window.localStorage.getItem(k);
  }
  return { dom, win: dom.window, errors, storage: dump };
}

const stateWith = patch => JSON.stringify(Object.assign({
  done: {}, watched: {}, ans: {}, mine: [], note: {}, runs: [], days: {}, calc: null, book: [], sheet: null,
  music: null, pomo: null, build: null, lab: null, cir: null, sim: null, school: null, pane: 'learn',
  last: null, exam: null, goal: 20, doneAt: {}, prefs: {}, pomoCfg: {}, seenWelcome: 0,
}, patch));

const session = (extra) => JSON.stringify(Object.assign({
  access_token: 'A1', refresh_token: 'R1', expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: { id: 'u1', email: 'hoc.sinh@example.com' },
}, extra || {}));

(async () => {
  const cloudHtmlReady = cloudHtml || plain;

  /* ---------- 2. chưa đăng nhập: không gọi mạng ---------- */
  {
    const srv = makeServer();
    const r = await open(cloudHtmlReady, { 'vnl9.v2': stateWith({}) }, srv, { wait: 300 });
    ok('chưa đăng nhập: không gọi mạng khi khởi động', srv.calls.length === 0, srv.calls.join(' | '));
    ok('không có lỗi JS khi nạp trang đám mây', r.errors.length === 0, r.errors.join(' | '));
    r.win.location.hash = '#/settings?s=acct';
    await sleep(300);
    const root = r.win.document.getElementById('acctRoot');
    ok('chưa đăng nhập: có ô email', !!(root && root.querySelector('input[type=email]')));
    ok('chưa đăng nhập: có nút Google', !!(root && root.querySelector('[data-acct="google"]')));
    r.dom.window.close();
  }

  /* ---------- bản không có cấu hình: thông báo rõ, không lỗi ---------- */
  {
    const srv = makeServer();
    const r = await open(plain, { 'vnl9.v2': stateWith({}) }, srv, { wait: 300 });
    r.win.location.hash = '#/settings?s=acct';
    await sleep(300);
    const root = r.win.document.getElementById('acctRoot');
    ok('bản thường: báo đồng bộ chưa bật', !!root && /chưa bật/.test(root.textContent));
    ok('bản thường: không có form đăng nhập', !!root && !root.querySelector('input[type=email]'));
    r.dom.window.close();
  }

  /* ---------- 3. chỉ đẩy khoá đã đổi ---------- */
  {
    const srv = makeServer();
    const local = { done: { a: true }, ans: { q1: 1 } };
    const base = { done: hashOf(local.done), ans: hashOf(local.ans) };
    const r = await open(cloudHtmlReady, {
      'vnl9.v2': stateWith(local), 'vnl9.session': session(), 'vnl9.sync': JSON.stringify(base),
    }, srv, { wait: 200 });
    srv.put('done', { a: true }, '2000-01-01T00:00:00Z');
    srv.put('ans', { q1: 1 }, '2000-01-01T00:00:00Z');
    await sleep(1800);
    srv.calls.length = 0;
    srv.bodies.length = 0;
    r.win.eval("AppStore.write(Object.assign(AppStore.readSync().data, { note: { n1: 'mới' } }))");
    await sleep(2200);
    ok('chỉ đẩy đúng 1 lần upsert', srv.bodies.length === 1, JSON.stringify(srv.bodies));
    ok('chỉ khoá đã đổi (note) nằm trong lần đẩy', JSON.stringify(srv.bodies[0]) === '["note"]', JSON.stringify(srv.bodies));
    ok('khoá đã đổi (note) được lưu lên máy chủ', srv.rows.note && srv.rows.note.value.n1 === 'mới');
    ok('prefs không bao giờ được đồng bộ', srv.rows.prefs === undefined);
    ok('mốc kéo về được ghi lại sau lần đồng bộ', !!r.win.localStorage.getItem('vnl9.pulled'));
    r.dom.window.close();
  }

  /* ---------- 4. thay đổi từ máy khác: chờ tải lại ---------- */
  {
    const srv = makeServer();
    const local = { done: { a: true } };
    const base = { done: hashOf(local.done) };
    srv.put('done', { a: true, b: true });
    const r = await open(cloudHtmlReady, {
      'vnl9.v2': stateWith(local), 'vnl9.session': session(), 'vnl9.sync': JSON.stringify(base),
    }, srv, { wait: 2300 });
    const pend = r.storage['vnl9.remote'] ? JSON.parse(r.storage['vnl9.remote']) : null;
    ok('phát hiện thay đổi từ máy khác', !!(pend && pend.keys && pend.keys.done));
    ok('banner toàn trang hiện khi có thay đổi chờ', !!r.dom.window.document.getElementById('acctBanner'));
    ok('app đang chạy: KHÔNG ghi đè state cục bộ', JSON.parse(r.storage['vnl9.v2']).done.a === true && !JSON.parse(r.storage['vnl9.v2']).done.b);
    ok('khi chờ tải lại: không đẩy gì lên', !srv.calls.some(c => c.startsWith('POST /rest/v1/user_state')), srv.calls.join(' | '));
    r.dom.window.close();

    /* tải lại: áp dụng trước khi app đọc kho */
    const r2 = await open(cloudHtmlReady, r.storage, srv, { wait: 300 });
    const after = JSON.parse(r2.storage['vnl9.v2']);
    ok('tải lại: áp dụng thay đổi từ máy khác', after.done.b === true, JSON.stringify(after.done));
    ok('tải lại: xoá hàng chờ', r2.storage['vnl9.remote'] === undefined);
    r2.dom.window.close();
  }

  /* ---------- 5. xung đột: sửa cục bộ được giữ ---------- */
  {
    const srv = makeServer();
    const base = { done: hashOf({ a: true }) };
    srv.put('done', { a: true, b: true });
    const r = await open(cloudHtmlReady, {
      'vnl9.v2': stateWith({ done: { a: true, c: true } }),
      'vnl9.session': session(), 'vnl9.sync': JSON.stringify(base),
    }, srv, { wait: 2300 });
    ok('xung đột: không tạo hàng chờ ghi đè bản đang sửa', r.storage['vnl9.remote'] === undefined);
    ok('xung đột: giữ sửa đổi cục bộ', JSON.parse(r.storage['vnl9.v2']).done.c === true);
    r.dom.window.close();
  }

  /* ---------- 6. đăng nhập PKCE qua ?code= ---------- */
  {
    const srv = makeServer();
    const r = await open(cloudHtmlReady, {
      'vnl9.v2': stateWith({}),
      'vnl9.pkce': JSON.stringify({ v: 'verifier-test-value-1234567890abcdef', at: Date.now() }),
    }, srv, { url: 'https://app.test/?code=abc123#/', wait: 800 });
    const s = r.storage['vnl9.session'] ? JSON.parse(r.storage['vnl9.session']) : null;
    ok('callback: đổi code lấy phiên', !!(s && s.access_token === 'A1'), srv.calls.join(' | '));
    ok('callback: gọi đúng luồng PKCE', srv.calls.some(c => c === 'POST /auth/v1/token?grant_type=pkce'));
    ok('callback: xoá verifier sau khi dùng', r.storage['vnl9.pkce'] === undefined);
    ok('callback: không còn ?code trên URL', !r.win.location.search.includes('code='));
    r.dom.window.close();
  }

  /* ---------- 7. đăng xuất: xoá phiên, giữ dữ liệu trên máy ---------- */
  {
    const srv = makeServer();
    const r = await open(cloudHtmlReady, {
      'vnl9.v2': stateWith({ done: { a: true } }),
      'vnl9.session': session(), 'vnl9.sync': JSON.stringify({ done: hashOf({ a: true }) }),
    }, srv, { wait: 300 });
    r.win.location.hash = '#/settings?s=acct';
    await sleep(300);
    const btn = r.win.document.querySelector('[data-acct="out"]');
    ok('đã đăng nhập: có nút đăng xuất', !!btn);
    if (btn) btn.click();
    await sleep(300);
    ok('đăng xuất: xoá phiên', r.win.localStorage.getItem('vnl9.session') === null);
    ok('đăng xuất: xoá trạng thái đồng bộ', r.win.localStorage.getItem('vnl9.sync') === null);
    ok('đăng xuất: giữ dữ liệu trên máy', JSON.parse(r.win.localStorage.getItem('vnl9.v2')).done.a === true);
    r.dom.window.close();
  }


  /* ---------- 8. ghi trong lúc đang đẩy: lượt đẩy lại phải chạy ---------- */
  {
    const srv = makeServer();
    srv.delay = 700;
    const r = await open(cloudHtmlReady, {
      'vnl9.v2': stateWith({ note: {} }), 'vnl9.session': session(), 'vnl9.sync': JSON.stringify({}),
    }, srv, { wait: 1900 });
    srv.bodies.length = 0;
    r.win.eval("AppStore.write(Object.assign(AppStore.readSync().data, { note: { a: 1 } }))");
    await sleep(1700); /* lượt đầu bắt đầu, đang chờ 700 ms */
    r.win.eval("AppStore.write(Object.assign(AppStore.readSync().data, { note: { a: 2 } }))");
    await sleep(3500);
    const sentNote = srv.bodies.filter(b => b.includes('note')).length;
    ok('ghi trong lúc đẩy: được đẩy lại (không mất)', sentNote >= 2 && srv.rows.note.value.a === 2,
      'số lần gửi note=' + sentNote + ', cloud=' + JSON.stringify(srv.rows.note && srv.rows.note.value));
    r.dom.window.close();
  }

  /* ---------- 9. kéo gia tăng: chỉ hỏi các dòng đổi sau mốc ---------- */
  {
    const srv = makeServer();
    srv.put('done', { a: true }, '2000-01-01T00:00:00Z');
    const r = await open(cloudHtmlReady, {
      'vnl9.v2': stateWith({ done: { a: true } }), 'vnl9.session': session(),
      'vnl9.sync': JSON.stringify({ done: hashOf({ a: true }) }),
      'vnl9.pulled': JSON.stringify('2000-01-01T00:00:00Z'),
    }, srv, { wait: 1900 });
    const pulls = srv.calls.filter(c => c.startsWith('GET /rest/v1/user_state'));
    ok('kéo gia tăng: có lọc theo updated_at', pulls.length > 0 && pulls.every(c => c.includes('updated_at=gt.')), pulls.join(' | '));
    ok('kéo gia tăng: không có thay đổi nên không chờ tải lại', !r.storage['vnl9.remote']);
    r.dom.window.close();
  }


  /* ---------- 10. xoá dữ liệu trên máy chủ: giữ tài khoản, lỗi thì không xoá gì ---------- */
  {
    const srv = makeServer();
    srv.put('done', { a: true });
    srv.profile = { display_name: 'Lan', grade: 9 };
    const r = await open(cloudHtmlReady, {
      'vnl9.v2': stateWith({ done: { a: true } }), 'vnl9.session': session(),
      'vnl9.sync': JSON.stringify({ done: hashOf({ a: true }) }),
    }, srv, { wait: 1900 });
    await r.win.eval('Account.wipeCloud()');
    /* đọc NGAY sau khi await, trước mọi lịch đẩy: luồng thật xoá dữ liệu máy trong cùng tick */
    const afterWipe = { sync: r.storage && r.win.localStorage.getItem('vnl9.sync'), pulled: r.win.localStorage.getItem('vnl9.pulled'), remote: r.win.localStorage.getItem('vnl9.remote') };
    const tables = ['user_state', 'lesson_progress', 'answers', 'notes', 'review_cards', 'layouts'];
    ok('xoá cloud: xoá đủ 6 bảng dữ liệu', tables.every(t => (srv.deleted || []).includes('/rest/v1/' + t)), JSON.stringify(srv.deleted));
    ok('xoá cloud: hồ sơ được đặt rỗng, KHÔNG xoá tài khoản', srv.profilePatch && srv.profilePatch.display_name === null && !srv.calls.some(c => c.includes('delete_my_account')));
    ok('xoá cloud: còn đăng nhập sau khi xoá', r.win.eval('Account.signedIn()'));
    ok('xoá cloud: mốc đồng bộ về rỗng, không còn mốc kéo về', afterWipe.sync === '{}' && afterWipe.pulled === null && afterWipe.remote === null, JSON.stringify(afterWipe));
    r.dom.window.close();

    const srv2 = makeServer();
    srv2.failDelete = '/rest/v1/notes';
    const r2 = await open(cloudHtmlReady, {
      'vnl9.v2': stateWith({ done: { a: true } }), 'vnl9.session': session(),
    }, srv2, { wait: 1900 });
    let threw = false;
    try { await r2.win.eval('Account.wipeCloud()'); } catch (e) { threw = true; }
    ok('xoá cloud lỗi: ném lỗi để giao diện giữ dữ liệu trên máy', threw);
    r2.dom.window.close();
  }

  /* ---------- 11. trang quyền riêng tư ---------- */
  {
    const srv = makeServer();
    const r = await open(cloudHtmlReady, {
      'vnl9.v2': stateWith({}), 'vnl9.session': session(),
    }, srv, { wait: 1200 });
    r.win.location.hash = '#/privacy';
    await sleep(400);
    const doc = r.dom.window.document;
    ok('trang #/privacy: có tiêu đề', !!doc.querySelector('#privTitle'));
    ok('trang #/privacy: nói đúng trạng thái đăng nhập', /đang đăng nhập/.test(doc.querySelector('.ab-lead') ? doc.querySelector('.ab-lead').textContent : ''));
    ok('trang #/privacy: nêu Supabase và cách xoá', /Supabase/.test(doc.body.textContent) && /Xoá toàn bộ dữ liệu/.test(doc.body.textContent));
    ok('trang #/privacy: không có ô nhập hay form nào', !doc.querySelector('#main form, #main input'));
    r.dom.window.close();
  }

  /* ---------- kết quả ---------- */
  let fail = 0;
  results.forEach(r => {
    if (!r.pass) fail++;
    console.log((r.pass ? '  ✓ ' : '  ✗ ') + r.name + (!r.pass && r.note ? '  — ' + r.note : ''));
  });
  console.log('\n' + (results.length - fail) + '/' + results.length + ' bước đạt ' + (fail ? '✗' : '✓'));
  process.exit(fail ? 1 : 0);
})();
