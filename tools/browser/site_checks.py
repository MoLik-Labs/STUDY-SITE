"""Kiểm thử trình duyệt: offline (Service Worker thật) và bản Vật lí tại /physic/.

  BASE=http://127.0.0.1:8124 CHROMIUM_PATH=... python3 tools/browser/site_checks.py
"""
import os, sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get('BASE', 'http://127.0.0.1:8124')
OFFLINE_PATHS = ['/', '/tai-khoan/', '/quyen-rieng-tu/', '/kinh-te-luong/', '/tieng-trung-noi/', '/physic/']
fails = []


def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond:
        fails.append(msg)


def offline(browser):
    ctx = browser.new_context(viewport={'width': 390, 'height': 844}, locale='vi-VN')
    page = ctx.new_page()
    errs = []
    page.on('pageerror', lambda e: errs.append(str(e)))
    page.on('console', lambda m: errs.append(m.text) if m.type == 'error' and '404' not in m.text else None)
    page.goto(BASE + '/')
    page.wait_for_function("() => navigator.serviceWorker && navigator.serviceWorker.controller !== null", timeout=20000)
    # Chờ precache xong: cache phải có đủ các trang đã liệt kê.
    page.wait_for_function("""async () => {
        const names = await caches.keys(); if (!names.length) return false;
        const c = await caches.open(names[0]); const keys = await c.keys();
        return keys.length >= 10; }""", timeout=20000)
    page.fill('input[name=title]', 'Việc làm khi mất mạng')
    page.click('button:has-text("Thêm việc")')
    page.wait_for_timeout(300)
    ctx.set_offline(True)
    for path in OFFLINE_PATHS:
        page.goto(BASE + path)
        n = page.evaluate("() => document.querySelector('main') ? document.querySelector('main').children.length : 0")
        check(n > 0, f'offline {path}: có nội dung (main có {n} phần tử)')
    page.goto(BASE + '/')
    check(page.get_by_text('Việc làm khi mất mạng').count() > 0, 'offline: dữ liệu đã lưu vẫn hiện')
    check(not [e for e in errs if 'net::ERR' not in e and 'Failed to load resource' not in e],
          f'offline: không lỗi trang: {[e for e in errs][:3]}')
    ctx.close()


def physics(browser):
    for vw in (390, 1440):
        ctx = browser.new_context(viewport={'width': vw, 'height': 900}, locale='vi-VN')
        page = ctx.new_page()
        errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        page.on('console', lambda m: errs.append(m.text) if m.type == 'error' and '404' not in m.text else None)
        page.goto(BASE + '/physic/')
        page.wait_for_timeout(800)
        txt = page.evaluate("() => document.body.innerText.length")
        check(txt > 200, f'physic {vw}: trang có nội dung ({txt} ký tự)')
        ov = page.evaluate('() => document.documentElement.scrollWidth - document.documentElement.clientWidth')
        check(ov <= 0, f'physic {vw}: không tràn ngang (overflow={ov})')
        check(not errs, f'physic {vw}: không lỗi trang: {errs[:3]}')
        if vw == 390:
            page.screenshot(path=os.environ.get('SHOTS', '/tmp') + '/physic-390.png')
        ctx.close()


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ['CHROMIUM_PATH'], args=['--no-sandbox', '--no-zygote'])
    offline(browser)
    physics(browser)
    browser.close()
print('---')
print('TỔNG LỖI:', len(fails))
for f in fails:
    print(' -', f)
sys.exit(1 if fails else 0)
