"""Kiểm thử trình duyệt cho luồng tài khoản và đồng bộ của site (Playwright + Chromium).

Supabase được giả lập bằng route (không gọi mạng thật). Site chạy trên máy chủ thử
`node site/test/serve.mjs` với SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY đặt trong môi trường.

  BASE=http://127.0.0.1:8124 CHROMIUM_PATH=... python3 tools/browser/account_flow.py

Phủ: khách, gửi OTP, quay lại từ liên kết, đẩy/kéo đồng bộ, debounce, hồ sơ, xoá dữ liệu,
đăng xuất, xoá tài khoản, đổi tài khoản trên cùng máy (không đẩy dữ liệu sang tài khoản mới),
quyền riêng tư, không tràn ngang và console sạch ở 390px và 1440px.
"""
import json, os, re, sys, urllib.parse
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get('BASE', 'http://127.0.0.1:8124')
SB = os.environ.get('SUPABASE_URL', 'https://ljsmiazfmmdxoprjggke.supabase.co').rstrip('/')
UID = '6f1c2a3e-1111-4222-8333-444455556666'
UID_B = '7a2d3b4f-2222-4333-8444-555566667777'
EMAIL = 'hs.lop11a2@example.com'
TOKENS = {'TOK': UID, 'TOKB': UID_B}
OUT = os.environ.get('SHOTS', '/tmp/acct-shots')
os.makedirs(OUT, exist_ok=True)

db = {'planners': {}, 'profiles': {}, 'deleted': set()}
reqs, fails = [], []


def cors(extra=None):
    h = {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*',
         'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS', 'Content-Type': 'application/json'}
    if extra:
        h.update(extra)
    return h


def handle(route, request):
    if request.url.startswith(BASE):
        return route.continue_()
    if not request.url.startswith(SB):
        fails.append('mạng lạ: ' + request.url)
        return route.abort()
    if request.method == 'OPTIONS':
        return route.fulfill(status=204, headers=cors())
    u = urllib.parse.urlparse(request.url)
    path, q = u.path, u.query
    body = request.post_data or ''
    auth = request.headers.get('authorization', '')
    uid = TOKENS.get(auth.replace('Bearer ', ''), UID)
    reqs.append((request.method, path + ('?' + q if q else ''), body, auth))

    def ok(data=None, status=200):
        return route.fulfill(status=status, headers=cors(), body='' if data is None else json.dumps(data))

    if path == '/auth/v1/otp':
        return ok({})
    if path == '/auth/v1/logout':
        return ok(None, 204)
    if path == '/auth/v1/user':
        if uid in db['deleted']:
            return ok({'msg': 'invalid'}, 401)
        return ok({'id': uid, 'email': EMAIL if uid == UID else 'b@example.com'})
    if path == '/auth/v1/token':
        return ok({'access_token': 'TOK', 'refresh_token': 'RT', 'expires_in': 3600})
    if path == '/rest/v1/planner_states':
        if request.method == 'GET':
            row = db['planners'].get(uid)
            return ok([row] if row else [])
        if request.method == 'POST':
            b = json.loads(body)
            db['planners'][b['user_id']] = {'state': b['state'], 'updated_at': b['updated_at']}
            return ok(None, 201)
        if request.method == 'DELETE':
            db['planners'].pop(uid, None)
            return ok(None, 204)
    if path == '/rest/v1/profiles':
        if request.method == 'GET':
            row = db['profiles'].get(uid)
            return ok([row] if row else [])
        if request.method == 'POST':
            db['profiles'][uid] = json.loads(body)
            return ok(None, 201)
    if path == '/rest/v1/rpc/delete_my_account':
        db['deleted'].add(uid)
        db['planners'].pop(uid, None)
        db['profiles'].pop(uid, None)
        return ok(None, 200)
    fails.append('route lạ: %s %s' % (request.method, path))
    return ok({'msg': 'no route'}, 404)


def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond:
        fails.append(msg)


def no_overflow(page, label):
    ov = page.evaluate('() => document.documentElement.scrollWidth - document.documentElement.clientWidth')
    check(ov <= 0, f'{label}: không tràn ngang (overflow={ov})')


def fresh_login(page, token, email_hint):
    # Liên kết từ email luôn tải mới trang; đổi chỉ #hash thì trình duyệt không chạy lại boot.
    page.goto(BASE + '/quyen-rieng-tu/')
    page.goto(BASE + '/tai-khoan/#access_token=%s&refresh_token=RT&expires_in=3600&token_type=bearer' % token)
    expect(page.get_by_text(email_hint)).to_be_visible()


def run_viewport(browser, vw, vh):
    tag = str(vw)
    ctx = browser.new_context(viewport={'width': vw, 'height': vh}, locale='vi-VN')
    ctx.route('**/*', handle)
    page = ctx.new_page()
    errs = []
    page.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    page.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
    db['planners'].clear(); db['profiles'].clear(); db['deleted'].clear(); reqs.clear()

    # 1. Khách: thêm việc, không gọi đám mây
    page.goto(BASE + '/')
    page.wait_for_selector('form input[name=title]')
    page.fill('input[name=title]', 'Đọc chương 1 Econometrics')
    page.click('button:has-text("Thêm việc")')
    expect(page.get_by_text('Đọc chương 1 Econometrics').first).to_be_visible()
    page.wait_for_timeout(1500)
    check(not any(r[1].startswith(('/rest', '/auth')) for r in reqs), f'[{tag}] khách: không gọi đám mây')
    check(page.evaluate("() => !!localStorage.getItem('sf.plan.v2')"), f'[{tag}] khách: lưu localStorage')
    no_overflow(page, f'[{tag}] trang chủ')
    page.screenshot(path=f'{OUT}/home-{tag}.png', full_page=True)

    # 2. Gửi liên kết đăng nhập
    page.goto(BASE + '/tai-khoan/')
    page.fill('input[name=email]', EMAIL)
    page.click('button:has-text("Gửi liên kết đăng nhập")')
    expect(page.get_by_text('Đã gửi liên kết đăng nhập')).to_be_visible()
    otp = [r for r in reqs if r[1].startswith('/auth/v1/otp')]
    check(len(otp) == 1 and json.loads(otp[0][2]).get('create_user') is True, f'[{tag}] OTP có create_user=true')
    check(len(otp) == 1 and urllib.parse.quote(BASE + '/tai-khoan/', safe='') in otp[0][1], f'[{tag}] OTP có redirect_to đúng')
    no_overflow(page, f'[{tag}] tài khoản (khách)')
    if vw == 390:
        page.screenshot(path=f'{OUT}/account-guest-{tag}.png', full_page=True)

    # 3. Quay lại từ email: phiên được nhận, #token bị xoá, kế hoạch được đẩy lên
    fresh_login(page, 'TOK', 'Đã đăng nhập bằng ' + EMAIL)
    check('access_token' not in page.url, f'[{tag}] đã xoá token khỏi thanh địa chỉ')
    page.wait_for_timeout(800)
    check(db['planners'].get(UID) is not None and len(db['planners'][UID]['state'].get('tasks', [])) == 1,
          f'[{tag}] đẩy kế hoạch lên đám mây khi máy mới hơn')
    check(any(r[0] == 'POST' and r[1].startswith('/rest/v1/planner_states') and r[3] == 'Bearer TOK' for r in reqs),
          f'[{tag}] POST dùng Bearer đúng')
    expect(page.get_by_text(re.compile('Đã đồng bộ lúc'))).to_be_visible()
    no_overflow(page, f'[{tag}] tài khoản (đã đăng nhập)')
    if vw == 390:
        page.screenshot(path=f'{OUT}/account-in-{tag}.png', full_page=True)

    # 4. Thiết bị khác có dữ liệu mới hơn → trang chủ kéo về, bản local được sao lưu
    db['planners'][UID] = {'state': {'v': 2, 'updated': '2099-01-01T00:00:00.000Z', 'tasks': [
        {'id': 't-remote', 'title': 'Việc từ máy khác', 'course': 'kinh-te-luong', 'date': '2026-11-17', 'done': False}],
        'custom': [], 'progress': {}, 'notes': {}}, 'updated_at': '2099-01-01T00:00:00.000Z'}
    page.goto(BASE + '/')
    expect(page.get_by_text('Việc từ máy khác').first).to_be_visible(timeout=8000)
    check(page.get_by_text('Đọc chương 1 Econometrics').count() == 0, f'[{tag}] bản local cũ được thay bằng bản mới hơn')
    check(page.evaluate("() => !!localStorage.getItem('sf.plan.v2.sync-bak')"), f'[{tag}] bản local được sao lưu trước khi kéo đè')
    no_overflow(page, f'[{tag}] trang chủ sau kéo đồng bộ')

    # 5. Thêm việc khi đăng nhập → đẩy đúng 1 lần sau debounce
    n0 = len([r for r in reqs if r[0] == 'POST' and 'planner_states' in r[1]])
    page.fill('input[name=title]', 'Ôn từ vựng HSK 3')
    page.click('button:has-text("Thêm việc")')
    page.wait_for_timeout(2000)
    n1 = len([r for r in reqs if r[0] == 'POST' and 'planner_states' in r[1]])
    check(n1 == n0 + 1, f'[{tag}] thay đổi được đẩy đúng 1 lần sau debounce')
    check(any('Ôn từ vựng HSK 3' in t.get('title', '') for t in db['planners'][UID]['state']['tasks']),
          f'[{tag}] đám mây có việc mới')

    # 6. Hồ sơ học sinh
    page.goto(BASE + '/tai-khoan/')
    page.fill('input[name=display_name]', 'Nguyễn Minh An')
    page.fill('input[name=class_name]', '11A2')
    page.click('button:has-text("Lưu hồ sơ")')
    expect(page.get_by_text('Đã lưu hồ sơ.')).to_be_visible()
    check((db['profiles'].get(UID) or {}).get('class_name') == '11A2', f'[{tag}] lưu hồ sơ lên profiles')
    page.reload()
    expect(page.locator('input[name=display_name]')).to_have_value('Nguyễn Minh An')
    check(page.locator('input[name=class_name]').input_value() == '11A2', f'[{tag}] tải lại vẫn đúng hồ sơ')

    # 7. Xoá dữ liệu học (hai bước), giữ tài khoản
    page.get_by_role('button', name='Xoá dữ liệu học').click()
    page.get_by_role('button', name='Bấm lần nữa để xoá').click()
    expect(page.get_by_text('Đã xoá dữ liệu học trên máy và trên đám mây')).to_be_visible()
    check(db['planners'].get(UID) is None, f'[{tag}] xoá dữ liệu học: đám mây trống')
    check(page.evaluate("() => JSON.parse(localStorage.getItem('sf.plan.v2')).tasks.length === 0"), f'[{tag}] xoá dữ liệu học: local trống')
    check(page.evaluate("() => !localStorage.getItem('sf.plan.v2.sync-bak')"), f'[{tag}] xoá dữ liệu học: xoá bản sao lưu')
    check(page.evaluate("() => !!localStorage.getItem('sf.session.v1')"), f'[{tag}] xoá dữ liệu học: vẫn đăng nhập')

    # 8. Đăng xuất
    page.get_by_role('button', name='Đăng xuất').click()
    expect(page.get_by_text('Đã đăng xuất.')).to_be_visible()
    check(page.evaluate("() => !localStorage.getItem('sf.session.v1')"), f'[{tag}] đăng xuất xoá phiên')
    check(any(r[1].startswith('/auth/v1/logout') for r in reqs), f'[{tag}] đăng xuất gọi /auth/v1/logout')
    expect(page.get_by_role('button', name='Tiếp tục với Google')).to_be_visible()

    # 9. Đổi tài khoản trên cùng máy: dữ liệu A không được đẩy sang B
    fresh_login(page, 'TOK', 'Đã đăng nhập bằng ' + EMAIL)
    page.goto(BASE + '/')
    page.fill('input[name=title]', 'Việc riêng của A')
    page.click('button:has-text("Thêm việc")')
    page.wait_for_timeout(1500)
    page.goto(BASE + '/tai-khoan/')
    page.get_by_role('button', name='Đăng xuất').click()
    expect(page.get_by_text('Đã đăng xuất.')).to_be_visible()
    fresh_login(page, 'TOKB', 'Đã đăng nhập bằng b@example.com')
    page.wait_for_timeout(1200)
    check(db['planners'].get(UID_B) is None, f'[{tag}] đổi tài khoản: không đẩy dữ liệu A sang B')
    check(page.evaluate("() => (localStorage.getItem('sf.plan.v2.sync-bak') || '').includes('Việc riêng của A')"),
          f'[{tag}] đổi tài khoản: dữ liệu A nằm trong bản sao lưu trên máy')
    page.goto(BASE + '/')
    check(page.get_by_text('Việc riêng của A').count() == 0, f'[{tag}] đổi tài khoản: trang chủ của B không thấy việc của A')
    page.fill('input[name=title]', 'Việc của B')
    page.click('button:has-text("Thêm việc")')
    page.wait_for_timeout(1500)
    titles = [t['title'] for t in (db['planners'].get(UID_B) or {}).get('state', {}).get('tasks', [])]
    check(titles == ['Việc của B'], f'[{tag}] B chỉ có việc của B trên đám mây')

    # 10. Xoá tài khoản (hai bước)
    page.goto(BASE + '/tai-khoan/')
    page.get_by_role('button', name='Xoá tài khoản').click()
    page.get_by_role('button', name='Bấm lần nữa để xoá vĩnh viễn').click()
    expect(page.get_by_text('Đã xoá tài khoản và dữ liệu')).to_be_visible()
    check(any(r[0] == 'POST' and r[1].startswith('/rest/v1/rpc/delete_my_account') for r in reqs), f'[{tag}] gọi RPC delete_my_account')
    check(page.evaluate("() => !localStorage.getItem('sf.session.v1')"), f'[{tag}] xoá tài khoản xoá phiên')

    # 11. Quyền riêng tư
    page.goto(BASE + '/quyen-rieng-tu/')
    expect(page.get_by_role('heading', name='Quyền riêng tư', exact=True)).to_be_visible()
    no_overflow(page, f'[{tag}] quyền riêng tư')
    if vw == 390:
        page.screenshot(path=f'{OUT}/privacy-{tag}.png', full_page=True)

    real = [e for e in errs if '404' not in e]
    check(not real, f'[{tag}] console không lỗi: {real[:3]}')
    ctx.close()


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ['CHROMIUM_PATH'], args=['--no-sandbox', '--no-zygote'])
    for vw, vh in [(390, 844), (1440, 900)]:
        run_viewport(browser, vw, vh)
    browser.close()

print('---')
print('TỔNG LỖI:', len(fails))
for f in fails:
    print(' -', f)
sys.exit(1 if fails else 0)
