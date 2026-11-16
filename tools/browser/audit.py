#!/usr/bin/env python3
"""Kiểm tra trên trình duyệt thật: mọi tuyến ở desktop (1440) và mobile (390).

Ghi lại: lỗi JavaScript, lỗi console, request thất bại, tràn ngang, và ảnh chụp.
Dùng:
    export CHROMIUM_PATH=$(bash tools/browser/install.sh)
    export LD_LIBRARY_PATH=$HOME/.cache/study-browser/lib:$HOME/.cache/study-browser
    python3 tools/browser/audit.py --base http://localhost:8124 --out /tmp/audit
Không ghi gì vào repo; ảnh nằm trong --out.
"""
import argparse, json, os, re, sys
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def routes():
    src = open(os.path.join(ROOT, 'tests', 'smoke.js'), encoding='utf-8').read()
    block = src[src.index('const ROUTES = ['):]
    block = block[:block.index('];')]
    return re.findall(r"'(#[^']*)'", block)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--base', default='http://localhost:8124')
    ap.add_argument('--out', default='/tmp/audit')
    ap.add_argument('--shots', action='store_true', help='chụp ảnh từng trang')
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    exe = os.environ.get('CHROMIUM_PATH')
    report = []
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=exe, headless=True,
                              args=['--no-sandbox', '--no-zygote', '--disable-gpu', '--disable-dev-shm-usage'])
        for label, vp in (('desktop', {'width': 1440, 'height': 900}), ('mobile', {'width': 390, 'height': 844})):
            ctx = b.new_context(viewport=vp, device_scale_factor=1, reduced_motion='reduce')
            for r in routes():
                pg = ctx.new_page()
                errs, cons, fails = [], [], []
                pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
                pg.on('console', lambda m: cons.append(m.text[:200]) if m.type == 'error' else None)
                pg.on('requestfailed', lambda q: fails.append(q.url[:120]))
                try:
                    pg.goto(a.base + '/' + r, wait_until='load', timeout=20000)
                    pg.wait_for_timeout(400)
                    over = pg.evaluate('() => document.documentElement.scrollWidth - document.documentElement.clientWidth')
                    empty = pg.evaluate("() => { const m = document.querySelector('#main'); return !m || m.innerText.trim().length < 20; }")
                except Exception as e:
                    over, empty = -1, True
                    errs.append('goto: ' + str(e)[:160])
                row = {'view': label, 'route': r, 'pageerrors': errs, 'consoleerrors': cons,
                       'failed': fails, 'overflowPx': over, 'emptyMain': empty}
                report.append(row)
                if a.shots:
                    pg.screenshot(path=os.path.join(a.out, f"{label}-{r.strip('#/').replace('/', '_') or 'home'}.png"))
                pg.close()
            ctx.close()
        b.close()
    json.dump(report, open(os.path.join(a.out, 'report.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    bad = [x for x in report if x['pageerrors'] or x['overflowPx'] > 0 or x['emptyMain'] or x['failed']]
    for x in bad:
        print(x['view'], x['route'], 'err=%d' % len(x['pageerrors']), 'overflow=%spx' % x['overflowPx'],
              'empty=%s' % x['emptyMain'], 'failed=%d' % len(x['failed']), (x['pageerrors'] or [''])[0][:120])
    print('\n%d trang kiểm tra · %d có vấn đề' % (len(report), len(bad)))
    return 1 if any(x['pageerrors'] for x in report) else 0


if __name__ == '__main__':
    sys.exit(main())
