import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCloud, decideSync, friendlyError, HINT_KEY, LINK_KEY, PENDING_KEY } from '../src/cloud.js';

const UID = 'AbC123_uid-000000000000000001';
const CFG = { apiKey: 'AIzaTEST0123456789012345678901234567', authDomain: 'proj.firebaseapp.com', projectId: 'proj', appId: '1:2:web:abc' };
const REDIRECT = 'https://site.test/tai-khoan/';
const NOW = Date.parse('2026-11-18T10:00:00Z');

function memStorage(init = {}) {
  const m = new Map(Object.entries(init));
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: k => m.delete(k),
    dump: () => Object.fromEntries(m),
  };
}

// SDK giả: ghi lại lời gọi, trả về dữ liệu theo kịch bản.
function fakeSdk(over = {}) {
  const calls = [];
  const docs = {};
  const rec = name => (...args) => { calls.push([name, ...args]); return over[name] ? over[name](...args) : Promise.resolve(); };
  const sdk = {
    calls,
    docs,
    onUser: rec('onUser'),
    authReady: over.authReady || (() => Promise.resolve(null)),
    isEmailLink: href => !!href && href.includes('oobCode='),
    completeEmailLink: over.completeEmailLink || (async (email) => ({ uid: UID, email })),
    sendEmailLink: rec('sendEmailLink'),
    startGoogle: rec('startGoogle'),
    finishRedirect: over.finishRedirect || (async () => null),
    signOut: rec('signOut'),
    lastSignInMs: () => (over.lastSignInMs !== undefined ? over.lastSignInMs : NOW),
    deleteAuthUser: rec('deleteAuthUser'),
    getDoc: over.getDoc || (async path => (path in docs ? docs[path] : null)),
    setDoc: over.setDoc || (async (path, data, opts) => { calls.push(['setDoc', path, data, opts]); docs[path] = { ...(opts && opts.merge ? docs[path] : {}), ...data }; }),
    deleteDoc: async path => { calls.push(['deleteDoc', path]); delete docs[path]; },
    deleteCollection: async path => { calls.push(['deleteCollection', path]); },
  };
  return sdk;
}

const make = (opts = {}) => {
  const storage = opts.storage || memStorage();
  const sdk = opts.sdk || fakeSdk(opts.over);
  const cloud = createCloud({ config: opts.config === undefined ? CFG : opts.config, sdk, storage, now: () => NOW, redirectTo: REDIRECT, timeoutMs: opts.timeoutMs || 500 });
  return { cloud, sdk, storage };
};

test('decideSync: bên mới hơn thắng, thiếu mốc thì xử lý an toàn', () => {
  assert.equal(decideSync('2026-11-18T10:00:00Z', '2026-11-18T09:00:00Z'), 'push');
  assert.equal(decideSync('2026-11-18T09:00:00Z', '2026-11-18T10:00:00Z'), 'pull');
  assert.equal(decideSync('2026-11-18T09:00:00Z', '2026-11-18T09:00:00Z'), 'none');
  assert.equal(decideSync('2026-11-18T09:00:00Z', ''), 'push');
  assert.equal(decideSync('', '2026-11-18T09:00:00Z'), 'pull');
  assert.equal(decideSync('', ''), 'none');
});

test('friendlyError: mã Firebase đổi sang tiếng Việt, mã lạ có câu chung', () => {
  assert.match(friendlyError('auth/too-many-requests'), /Gửi quá nhiều/);
  assert.match(friendlyError('auth/unauthorized-domain'), /Authorized domains/);
  assert.match(friendlyError('permission-denied'), /quy tắc Firestore/);
  assert.equal(friendlyError('auth/hoang-gi-do'), 'Có lỗi khi kết nối. Thử lại sau.');
  assert.ok(!/auth\//.test(friendlyError('auth/hoang-gi-do')), 'không hiện mã kỹ thuật');
});

test('không có cấu hình thì enabled=false và init không gọi SDK', async () => {
  const { cloud, sdk } = make({ config: null });
  assert.equal(cloud.enabled, false);
  assert.equal(await cloud.init(''), null);
  assert.equal(sdk.calls.length, 0);
  await assert.rejects(cloud.sendEmailLink('a@b.co'), /chưa được bật/);
});

test('init: đã có phiên thì ghi gợi ý đăng nhập; hết phiên thì xoá gợi ý', async () => {
  const signed = make({ over: { authReady: async () => ({ uid: UID, email: 'a@b.co' }) } });
  await signed.cloud.init('');
  assert.equal(signed.cloud.signedIn(), true);
  assert.equal(signed.cloud.userId(), UID);
  assert.deepEqual(JSON.parse(signed.storage.getItem(HINT_KEY)), { uid: UID, email: 'a@b.co' });

  const gone = make({ storage: memStorage({ [HINT_KEY]: '{"uid":"x"}' }) });
  await gone.cloud.init('');
  assert.equal(gone.cloud.signedIn(), false);
  assert.equal(gone.storage.getItem(HINT_KEY), null);
});

test('liên kết email trên cùng máy: dùng email đã lưu và xoá dấu', async () => {
  const link = 'https://site.test/tai-khoan/?mode=signIn&oobCode=abc';
  const { cloud, storage } = make({ storage: memStorage({ [LINK_KEY]: 'a@b.co' }) });
  const notice = await cloud.init(link);
  assert.equal(notice.ok, true);
  assert.match(notice.text, /a@b\.co/);
  assert.equal(cloud.signedIn(), true);
  assert.equal(storage.getItem(LINK_KEY), null);
});

test('liên kết email trên máy khác: hỏi lại email rồi hoàn tất', async () => {
  const link = 'https://site.test/tai-khoan/?mode=signIn&oobCode=xyz';
  const { cloud } = make();
  const notice = await cloud.init(link);
  assert.equal(notice.needEmail, true);
  assert.equal(cloud.needsEmail(), true);
  const done = await cloud.finishEmailLink('user@x.vn');
  assert.equal(done.ok, true);
  assert.equal(cloud.email(), 'user@x.vn');
  assert.equal(cloud.needsEmail(), false);
});

test('liên kết hết hạn hoặc đã dùng: báo lỗi rõ, không đăng nhập', async () => {
  const { cloud } = make({ storage: memStorage({ [LINK_KEY]: 'a@b.co' }), over: {
    completeEmailLink: async () => { throw Object.assign(new Error('x'), { code: 'auth/expired-action-code' }); },
  } });
  const notice = await cloud.init('https://site.test/?oobCode=old');
  assert.equal(notice.ok, false);
  assert.match(notice.text, /hết hạn/);
  assert.equal(cloud.signedIn(), false);
});

test('sendEmailLink: gửi tới redirect về /tai-khoan/ và nhớ email; email rỗng bị từ chối trước khi gọi mạng', async () => {
  const { cloud, sdk, storage } = make();
  await assert.rejects(cloud.sendEmailLink('  '), /Hãy nhập email/);
  assert.equal(sdk.calls.length, 0);
  await cloud.sendEmailLink(' a@b.co ');
  assert.deepEqual(sdk.calls.find(c => c[0] === 'sendEmailLink'), ['sendEmailLink', 'a@b.co', REDIRECT]);
  assert.equal(storage.getItem(LINK_KEY), 'a@b.co');
});

test('Google: đánh dấu chờ chuyển hướng; quay lại thì nhận kết quả và xoá dấu', async () => {
  const { cloud, sdk, storage } = make();
  await cloud.signInWithGoogle();
  assert.equal(storage.getItem(PENDING_KEY), 'google');
  assert.equal(sdk.calls.find(c => c[0] === 'startGoogle')[1], REDIRECT);

  const back = make({ storage: memStorage({ [PENDING_KEY]: 'google' }), over: { finishRedirect: async () => ({ uid: UID, email: 'g@gmail.com' }) } });
  const notice = await back.cloud.init('');
  assert.equal(notice.ok, true);
  assert.match(notice.text, /g@gmail\.com/);
  assert.equal(back.storage.getItem(PENDING_KEY), null);
});

test('Google: lỗi khi chuyển hướng thì xoá dấu và báo lỗi', async () => {
  const { cloud, storage } = make({ over: { startGoogle: async () => { throw Object.assign(new Error('x'), { code: 'auth/unauthorized-domain' }); } } });
  await assert.rejects(cloud.signInWithGoogle(), /Authorized domains/);
  assert.equal(storage.getItem(PENDING_KEY), null);
});

test('pullPlan / pushPlan: đường dẫn theo uid, state là JSON, kiểm định dạng uid trước', async () => {
  const { cloud, sdk } = make();
  await assert.rejects(cloud.pullPlan('../../etc'), /không hợp lệ/);
  await assert.rejects(cloud.pushPlan('a/b', {}), /không hợp lệ/);
  assert.equal(sdk.calls.length, 0, 'uid sai không gọi mạng');

  assert.equal(await cloud.pullPlan(UID), null, 'chưa có dữ liệu thì null');
  await cloud.pushPlan(UID, { tasks: [1], updated: 'x' });
  const saved = sdk.docs['planners/' + UID];
  assert.equal(typeof saved.state, 'string');
  assert.deepEqual(JSON.parse(saved.state), { tasks: [1], updated: 'x' });
  const back = await cloud.pullPlan(UID);
  assert.deepEqual(back.state, { tasks: [1], updated: 'x' });
  assert.equal(back.updated_at, saved.updatedAt);
});

test('pushPlan: từ chối kế hoạch quá lớn (giới hạn tài liệu Firestore)', async () => {
  const { cloud, sdk } = make();
  await assert.rejects(cloud.pushPlan(UID, { big: 'x'.repeat(950000) }), /quá lớn/);
  assert.equal(sdk.calls.length, 0);
});

test('pullPlan: dữ liệu hỏng trên đám mây báo lỗi, không ghi đè', async () => {
  const { cloud, sdk } = make({ over: {} });
  sdk.docs['planners/' + UID] = { state: '{hong', updatedAt: 'x' };
  await assert.rejects(cloud.pullPlan(UID), /bị hỏng/);
});

test('hồ sơ: lưu gộp (merge) và cắt độ dài; đọc lại đúng tên trường', async () => {
  const { cloud, sdk } = make();
  await cloud.saveProfile(UID, { displayName: 'x'.repeat(100), className: ' 11A2 ' });
  const call = sdk.calls.find(c => c[0] === 'setDoc' && c[1] === 'users/' + UID);
  assert.equal(call[2].displayName.length, 60);
  assert.equal(call[3].merge, true, 'gộp để không xoá trường của app khác');
  assert.deepEqual(await cloud.getProfile(UID), { displayName: 'x'.repeat(60), className: ' 11A2 ' });
});

test('signOut: xoá phiên, gợi ý và dấu liên kết dù mạng lỗi', async () => {
  const { cloud, storage } = make({
    storage: memStorage({ [HINT_KEY]: '{"uid":"x"}', [LINK_KEY]: 'a@b.co' }),
    over: { signOut: async () => { throw new Error('mạng'); } },
    authReady: undefined,
  });
  await assert.rejects(cloud.signOut(), /mạng|Có lỗi/);
  assert.equal(storage.getItem(HINT_KEY), null);
  assert.equal(storage.getItem(LINK_KEY), null);
});

test('deletePlan: xoá planners và toàn bộ users/{uid}/keys', async () => {
  const { cloud, sdk } = make();
  await cloud.deletePlan(UID);
  assert.deepEqual(sdk.calls.filter(c => c[0] !== 'onUser').map(c => c.slice(0, 2)), [
    ['deleteDoc', 'planners/' + UID],
    ['deleteCollection', 'users/' + UID + '/keys'],
  ]);
});

test('deleteAccount: xoá dữ liệu trước, rồi xoá tài khoản, theo đúng thứ tự', async () => {
  const { cloud, sdk, storage } = make({ storage: memStorage({ [HINT_KEY]: '{"uid":"x"}' }) });
  // đăng nhập để có user
  sdk.authReady = async () => ({ uid: UID, email: 'a@b.co', lastSignInMs: NOW });
  await cloud.init('');
  await cloud.deleteAccount();
  const order = sdk.calls.map(c => c[0]).filter(n => ['deleteDoc', 'deleteCollection', 'deleteAuthUser'].includes(n));
  assert.deepEqual(order, ['deleteDoc', 'deleteCollection', 'deleteDoc', 'deleteAuthUser']);
  assert.equal(cloud.signedIn(), false);
  assert.equal(storage.getItem(HINT_KEY), null);
});

test('deleteAccount: đăng nhập quá lâu thì từ chối TRƯỚC khi xoá gì', async () => {
  const { cloud, sdk } = make({ over: { authReady: async () => ({ uid: UID, email: 'a@b.co' }) }, lastSignInMs: NOW - 60 * 60 * 1000 });
  sdk.lastSignInMs = () => NOW - 60 * 60 * 1000;
  await cloud.init('');
  await assert.rejects(cloud.deleteAccount(), /đăng nhập lại/);
  assert.equal(sdk.calls.filter(c => c[0].startsWith('delete')).length, 0, 'không xoá dữ liệu khi chưa xác thực lại');
});

test('deleteAccount: không có người dùng thì báo chưa đăng nhập', async () => {
  const { cloud } = make();
  await assert.rejects(cloud.deleteAccount(), /Chưa đăng nhập/);
});

test('mạng treo: thao tác quá thời gian chờ báo lỗi, không treo giao diện', async () => {
  const { cloud } = make({ timeoutMs: 20, over: { getDoc: () => new Promise(() => {}) } });
  await assert.rejects(cloud.getProfile(UID), /Quá thời gian chờ/);
});
