"""Kiểm thử trình duyệt cho tài khoản và đồng bộ (Firebase), không gọi mạng thật.

Cách làm: Worker giả lập bằng route của Playwright.
  · /assets/config.js  → cấu hình Firebase giả (bật tài khoản).
  · /assets/firebase-sdk.js → SDK giả, Firestore và Auth nằm trong bộ nhớ của trang.
Nhờ vậy kiểm được ĐƯỜNG ĐỒNG BỘ THẬT trong src/account.js (đẩy, kéo, áp dụng thay đổi,
xoá dữ liệu, yêu cầu đăng nhập gần đây) mà không cần Google.

Chạy (sau khi `npm run build` và máy chủ thử đang chạy ở BASE):
  BASE=http://127.0.0.1:8124 CHROMIUM_PATH=... python3 tools/browser/account_flow.py

Phần chưa kiểm được ở đây: đăng nhập thật qua email/Google và quy tắc Firestore.
Hai việc đó phải kiểm trên dự án Firebase thật (xem docs/FIREBASE-SETUP.md mục 8).
"""
import json
import os
import sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get('BASE', 'http://127.0.0.1:8124')
UID = 'uidTest0000000000000001'
FAKE_CFG = ('export const CLOUD = Object.freeze({"apiKey":"AIzaSyD0123456789abcdefghijklmnopqrstuv",'
            '"authDomain":"demo.firebaseapp.com","projectId":"demo-proj","appId":"1:123:web:abc"});\n')

# SDK giả: cùng hình dạng API với site/src/firebase-sdk.js.
FAKE_SDK = r"""
const store = window.__store;
const docsUnder = (p) => Object.keys(store).filter(k => k.startsWith(p + '/') && k.split('/').length === p.split('/').length + 1);
export function createSdk() {
  const user = () => window.__fakeUser || null;
  return {
    friendly: c => (c === 'auth/network-request-failed' ? 'Không có mạng. Dữ liệu vẫn được giữ trên máy.' : 'Có lỗi khi kết nối.'),
    isEmailLink: () => false,
    async completeEmailLink() { return user(); },
    async sendEmailLink() { if (window.__failMail) throw Object.assign(new Error('x'), { code: 'auth/network-request-failed' }); },
    async startGoogle() {},
    async finishRedirect() { return null; },
    async authReady() { return user(); },
    async signOut() { window.__fakeUser = null; },
    lastSignInMs() { return window.__lastSignIn || 0; },
    async deleteAuthUser() { window.__fakeUser = null; },
    serverNow() { return { __serverTimestamp: true }; },
    async getDoc(p) { return store[p] ? { ...store[p] } : null; },
    async setDoc(p, d, o) { store[p] = { ...(o && o.merge ? store[p] || {} : {}), ...d, updatedAt: d.updatedAt && d.updatedAt.__serverTimestamp ? new Date().toISOString() : d.updatedAt }; },
    async deleteDoc(p) { delete store[p]; },
    async deleteCollection(p) { docsUnder(p).forEach(k => delete store[k]); },
    async listDocs(p, since) {
      return docsUnder(p)
        .map(k => ({ id: k.split('/').pop(), data: { ...store[k] } }))
        .filter(d => !since || (d.data.updatedAt || '') > since);
    },
    async setDocs(items) {
      window.__writes = (window.__writes || 0) + items.length;
      for (const it of items) {
        const ts = it.data.updatedAt && it.data.updatedAt.__serverTimestamp ? new Date().toISOString() : it.data.updatedAt;
        store[it.path] = { ...it.data, updatedAt: ts };
      }
    },
  };
}
"""

fails = []


def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond:
        fails.append(msg)


def new_page(browser, signed_in=False, last_sign_in_ago_ms=0):
    ctx = browser.new_context(viewport={'width': 390, 'height': 844}, locale='vi-VN')
    ctx.route('**/assets/config.js', lambda r: r.fulfill(status=200, content_type='text/javascript', body=FAKE_CFG))
    ctx.route('**/assets/firebase-sdk.js', lambda r: r.fulfill(status=200, content_type='text/javascript', body=FAKE_SDK))
    user = json.dumps({'uid': UID, 'email': 'hs@example.com'}) if signed_in else 'null'
    ctx.add_init_script(
        "if(!window.__store){window.__store={};}"
        f"window.__fakeUser={user};"
        f"window.__lastSignIn=Date.now()-{last_sign_in_ago_ms};"
        + ("if(!localStorage.getItem('vnl9.session')){localStorage.setItem('vnl9.session',JSON.stringify({user:{id:'%s',email:'hs@example.com'}}));}" % UID if signed_in else '')
    )
    page = ctx.new_page()
    errs = []
    page.on('pageerror', lambda e: errs.append(str(e)))
    return ctx, page, errs


def open_account(page):
    page.goto(BASE + '/physic/#/account')
    page.wait_for_selector('#acctRoot', timeout=15000)
    page.wait_for_timeout(600)


def store_of(page):
    return page.evaluate('() => JSON.parse(JSON.stringify(window.__store))')


def set_local_done(page, value):
    # Ghi qua `state` của app (không qua readSync): app giữ bản trong bộ nhớ và
    # ghi lại khi rời trang (store.js pagehide), nên ghi thẳng vào kho sẽ bị đè.
    page.evaluate("""(v) => { state.done = v; AppStore.write(state); }""", value)


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ['CHROMIUM_PATH'], args=['--no-sandbox'])

    # 1. Khách: không có mục đồng bộ hoạt động, không gọi Firebase.
    ctx, page, errs = new_page(browser)
    reqs = []
    page.on('request', lambda r: reqs.append(r.url))
    open_account(page)
    check(page.locator('[data-acct=mail]').count() == 1, 'khách: có form gửi liên kết email')
    check(not any('firebase-sdk' in u for u in reqs), 'khách: không tải SDK Firebase')
    check(not errs, f'khách: không lỗi {errs[:2]}')
    ctx.close()

    # 2. Đã đăng nhập: đẩy thay đổi lên đám mây sau khi sửa dữ liệu.
    ctx, page, errs = new_page(browser, signed_in=True)
    open_account(page)
    page.wait_for_timeout(800)
    check(page.locator('[data-acct=sync]').count() == 1, 'đã đăng nhập: có nút Đồng bộ ngay')
    set_local_done(page, {'lesson-1': True})
    page.wait_for_timeout(2600)
    st = store_of(page)
    key = f'users/{UID}/keys/done'
    check(key in st, 'sửa dữ liệu → đẩy khoá done lên đám mây sau vài giây')
    check(key in st and json.loads(st[key]['value']) == {'lesson-1': True}, 'giá trị đẩy lên đúng')
    check(key in st and isinstance(st[key].get('updatedAt'), str), 'updatedAt là chuỗi (máy chủ ghi)')
    writes_before = page.evaluate('() => window.__writes || 0')
    page.locator('[data-acct=sync]').click()
    page.wait_for_timeout(800)
    check(page.evaluate('() => window.__writes || 0') == writes_before, 'không sửa gì thì không ghi lại (chỉ phần đã đổi)')
    check(not errs, f'đồng bộ đẩy: không lỗi {errs[:2]}')

    # 3. Kéo thay đổi từ máy khác: bản trên máy không sửa thì nhận, đổi sau khi tải lại.
    remote = {'lesson-1': True, 'lesson-2': True}
    page.evaluate("""([k, v]) => { window.__store[k] = { value: JSON.stringify(v), updatedAt: new Date(Date.now() + 5000).toISOString() }; }""",
                  [f'users/{UID}/keys/done', remote])
    page.evaluate("() => document.dispatchEvent(new Event('visibilitychange'))")
    page.wait_for_timeout(800)
    page.reload()
    page.wait_for_selector('#acctRoot', timeout=15000)
    page.wait_for_timeout(500)
    got = page.evaluate('() => AppStore.readSync().data.done')
    check(got == remote, f'thay đổi từ máy khác được áp dụng sau khi tải lại: {got}')
    check(not errs, f'kéo thay đổi: không lỗi {errs[:2]}')
    ctx.close()

    # 4. Có sửa chưa đồng bộ trên máy: giữ bản trên máy, không bị ghi đè bởi đám mây.
    ctx, page, errs = new_page(browser, signed_in=True)
    open_account(page)
    page.wait_for_timeout(500)
    base_done = {'lesson-1': True}
    page.evaluate("""([k, v]) => { window.__store[k] = { value: JSON.stringify(v), updatedAt: new Date().toISOString() }; }""",
                  [f'users/{UID}/keys/done', base_done])
    # Mốc đồng bộ chưa có khoá 'done': máy đã sửa, đám mây cũng đổi sau đó → xung đột, giữ bản trên máy.
    page.evaluate("() => { localStorage.setItem('vnl9.sync', JSON.stringify({})); }")
    set_local_done(page, {'local-only': True})
    page.evaluate("""([k, v]) => { window.__store[k] = { value: JSON.stringify(v), updatedAt: new Date(Date.now() + 9000).toISOString() }; }""",
                  [f'users/{UID}/keys/done', {'remote-change': True}])
    page.evaluate("() => document.dispatchEvent(new Event('visibilitychange'))")
    page.wait_for_timeout(800)
    page.reload(); page.wait_for_timeout(600)
    local = page.evaluate('() => AppStore.readSync().data.done')
    check(local == {'local-only': True}, f'sửa chưa đồng bộ trên máy được giữ, không bị đám mây ghi đè: {local}')
    check(not errs, f'giữ bản trên máy: không lỗi {errs[:2]}')
    ctx.close()

    # 5. Đăng xuất: dữ liệu trên máy còn nguyên.
    ctx, page, errs = new_page(browser, signed_in=True)
    open_account(page)
    page.wait_for_timeout(500)
    set_local_done(page, {'kept': True})
    page.wait_for_timeout(300)
    page.locator('[data-acct=out]').click()
    page.wait_for_timeout(600)
    check(page.evaluate('() => localStorage.getItem("vnl9.session")') is None, 'đăng xuất: xoá phiên trên máy')
    check(page.evaluate('() => AppStore.readSync().data.done') == {'kept': True}, 'đăng xuất: dữ liệu trên máy còn nguyên')
    ctx.close()

    # 6. Xoá tài khoản khi đăng nhập quá lâu: từ chối, không xoá dữ liệu.
    ctx, page, errs = new_page(browser, signed_in=True, last_sign_in_ago_ms=10 * 60 * 1000)
    open_account(page)
    page.wait_for_timeout(500)
    set_local_done(page, {'x': 1})
    page.wait_for_timeout(2600)
    before = store_of(page)
    page.locator('[data-acct=delete]').click()
    page.locator('[data-acct=delete-yes]').click()
    page.wait_for_timeout(700)
    msg = page.inner_text('#acctRoot')
    check('đăng nhập lại' in msg, 'đăng nhập lâu: báo cần đăng nhập lại')
    check(store_of(page) == before, 'đăng nhập lâu: không xoá dữ liệu đám mây')
    ctx.close()

    # 7. Xoá tài khoản khi vừa đăng nhập: xoá đám mây và tài khoản, phiên mất.
    ctx, page, errs = new_page(browser, signed_in=True, last_sign_in_ago_ms=0)
    open_account(page)
    page.wait_for_timeout(500)
    set_local_done(page, {'y': 1})
    page.wait_for_timeout(2600)
    page.locator('[data-acct=delete]').click()
    page.locator('[data-acct=delete-yes]').click()
    page.wait_for_timeout(900)
    st = store_of(page)
    check(not any(k.startswith(f'users/{UID}') or k.startswith(f'planners/{UID}') for k in st), 'xoá tài khoản: xoá sạch dữ liệu đám mây')
    check(page.evaluate('() => localStorage.getItem("vnl9.session")') is None, 'xoá tài khoản: xoá phiên trên máy')
    check(page.evaluate('() => AppStore.readSync().data.done') == {'y': 1}, 'xoá tài khoản: dữ liệu trên máy còn (chỉ xoá trên máy chủ)')
    ctx.close()

    # 8. Xoá dữ liệu học (wipeCloud): giữ tài khoản, xoá khoá trên đám mây.
    ctx, page, errs = new_page(browser, signed_in=True)
    open_account(page)
    page.wait_for_timeout(500)
    set_local_done(page, {'z': 1})
    page.wait_for_timeout(2600)
    page.evaluate("() => Account.wipeCloud()")
    page.wait_for_timeout(300)
    st = store_of(page)
    check(f'users/{UID}/keys/done' not in st, 'xoá dữ liệu học: khoá đã xoá khỏi đám mây')
    check(page.evaluate('() => localStorage.getItem("vnl9.session")') is not None, 'xoá dữ liệu học: giữ tài khoản')
    check(not errs, f'xoá dữ liệu học: không lỗi {errs[:2]}')
    ctx.close()

    # 9. Gửi liên kết lỗi mạng: thông báo tiếng Việt, không lộ mã kỹ thuật.
    ctx, page, errs = new_page(browser)
    page.add_init_script("window.__failMail = true")
    open_account(page)
    # Form email nằm trong <details> đóng mặc định: mở ra trước khi điền.
    page.locator('details:has([data-acct=mail]) > summary').click()
    page.locator('[data-acct=mail] input[name=email]').fill('hs@example.com')
    page.locator('[data-acct=mail] button[type=submit]').click()
    page.wait_for_timeout(700)
    txt = page.inner_text('#acctRoot')
    check('Không có mạng' in txt, 'gửi liên kết lỗi: hiện thông báo tiếng Việt')
    check('auth/' not in txt, 'gửi liên kết lỗi: không lộ mã kỹ thuật')
    ctx.close()

    browser.close()

print('TỔNG LỖI:', len(fails))
for f in fails:
    print(' -', f)
sys.exit(1 if fails else 0)
