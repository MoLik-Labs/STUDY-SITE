# -*- coding: utf-8 -*-
"""Ghép app: lấy dữ liệu từ bản kế hoạch v4 + Q&A/quiz + giao diện mới -> 1 file HTML.

Bản dựng phục vụ Cloudflare Pages:
  · nhúng CSP với SHA-256 của từng khối <script> và <style> (không cần 'unsafe-inline')
  · sinh BUILD_ID (băm nội dung) để đặt ?v= trên font và làm ETag cho /__version
  · ghi _headers (bảo mật + cache) và _redirects (SPA/router bằng hash)
Chạy:  python3 src/build.py
"""
import hashlib, io, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
VERSION = '11.9'          # một nguồn duy nhất; sinh ra meta, APP_VERSION, footer, sw.js

# --physics-only: dựng riêng phần Vật lí để đặt tại /physic/ của site.
# Chỉ giữ các module vật lí và lõi cần thiết; không có lịch, trường học, nhạc.
PHYSICS_ONLY = '--physics-only' in sys.argv
PHYSICS_KEEP = {'data', 'content', 'prefs', 'core', 'explore', 'physics'}

def arg(flag, default):
    """--flag giá-trị, hoặc chỉ --flag (dùng giá trị mặc định)."""
    if flag not in sys.argv:
        return default
    i = sys.argv.index(flag) + 1
    return sys.argv[i] if i < len(sys.argv) and not sys.argv[i].startswith('--') else default

SRC_PLAN = arg('--base', os.path.join(HERE, 'base.html'))
OUT = arg('--out', os.path.join(ROOT, 'index.html'))
SRC = lambda name: io.open(os.path.join(HERE, name), encoding='utf-8').read()

plan = io.open(SRC_PLAN, encoding='utf-8').read()

def block(name):
    """Lấy nguyên khối `const NAME=...;` bằng cách đếm ngoặc có nhận biết chuỗi."""
    i = plan.index('const %s=' % name)
    j = i + len('const %s=' % name)
    while plan[j] not in '[{':
        j += 1
    depth = 0
    k = j
    quote = None
    while k < len(plan):
        c = plan[k]
        if quote:
            if c == '\\':
                k += 2
                continue
            if c == quote:
                quote = None
        else:
            if c in '\'"`':
                quote = c
            elif c in '[{(':
                depth += 1
            elif c in ']})':
                depth -= 1
                if depth == 0:
                    end = plan.index(';', k) + 1
                    return plan[i:end]
        k += 1
    raise SystemExit('không đóng được khối ' + name)

names = ['TOPICS', 'WHO', 'LIB', 'PLAN', 'EXT', 'MORE', 'PHASES', 'NOTES']
data = '\n\n'.join(block(n) for n in names)
data += '\n\n' + SRC('papers.js')

css = SRC('fonts.css') + SRC('app.css')  # phông chữ tự host: không gọi Google
qa = SRC('qa.js') + '\n\n' + SRC('content2.js') + '\n\n' + SRC('content3.js') + '\n\n' + SRC('content4.js')
cf = SRC('cloudflare.js')     # đăng ký service worker + trạng thái mạng
PREFS_JS = """/* áp màu trước khi vẽ để không nháy trắng */
try{var P=JSON.parse(localStorage.getItem('vnl9.prefs')||'{}');
if(P.theme)document.documentElement.setAttribute('data-theme',P.theme);
if(P.density)document.documentElement.setAttribute('data-density',P.density);
if(P.radius)document.documentElement.setAttribute('data-radius',P.radius);
if(P.motion===false)document.documentElement.setAttribute('data-motion','off');
if(P.fs)document.documentElement.style.setProperty('--fs',String(P.fs));
if(P.accent)document.documentElement.style.setProperty('--accent',P.accent);
}catch(e){}"""

ver_js = "/* phiên bản — sinh từ src/build.py */\nconst APP_VERSION = '" + VERSION + "';"

# ================================================================
# MODULES — one entry per <script> block, in load order.
# ----------------------------------------------------------------
# Why an explicit table instead of one giant concatenation:
#   · a stack trace names the module that threw, so debugging starts where the
#     bug is instead of in a 500 KB blob;
#   · the browser lists each block separately in devtools, so a breakpoint
#     survives an unrelated edit;
#   · load order is data, visible in one place, rather than implied by the
#     order of string concatenations;
#   · each block gets its own CSP hash, so adding a module cannot invalidate
#     the others.
# Order matters: a module may use functions declared by any earlier module.
# Everything here is a classic script sharing one global scope, which is why
# a name must be declared exactly once — check.js enforces that.
# ================================================================
# ----------------------------------------------------------------
# Cấu hình đám mây — đọc từ biến môi trường lúc build, KHÔNG nằm trong mã.
#   SUPABASE_URL                 https://<ref>.supabase.co
#   SUPABASE_PUBLISHABLE_KEY     sb_publishable_… (hoặc anon JWT cũ)
# Thiếu cả hai → bản build chỉ có chế độ khách (không gọi mạng). Từ chối
# ngay nếu khoá trông như secret: khoá bí mật KHÔNG được vào trình duyệt.
# ----------------------------------------------------------------
import json as _json, re as _re
SB_URL = os.environ.get('SUPABASE_URL', '').strip().rstrip('/')
SB_KEY = os.environ.get('SUPABASE_PUBLISHABLE_KEY', '').strip()
if SB_URL or SB_KEY:
    if not _re.fullmatch(r'https://[a-z0-9]{20}\.supabase\.co', SB_URL):
        raise SystemExit('SUPABASE_URL phải dạng https://<ref>.supabase.co')
    if SB_KEY.startswith('sb_secret_') or 'service_role' in SB_KEY:
        raise SystemExit('SUPABASE_PUBLISHABLE_KEY là khoá BÍ MẬT — dừng ngay, không đưa vào trình duyệt')
    if not (_re.fullmatch(r'sb_publishable_[A-Za-z0-9_-]{10,}', SB_KEY)
            or _re.fullmatch(r'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+', SB_KEY)):
        raise SystemExit('SUPABASE_PUBLISHABLE_KEY không đúng định dạng khoá công khai')
CLOUD_JS = 'const SB_CONFIG = Object.freeze(' + _json.dumps(
    {'url': SB_URL, 'key': SB_KEY}, ensure_ascii=True) + ');'
CLOUD_ORIGIN = SB_URL  # rỗng khi không bật đám mây

MODULES = [
    ('DỮ LIỆU LỘ TRÌNH', 'data',
     [('dữ liệu', data)]),

    ('NGÂN HÀNG HỎI ĐÁP & TRẮC NGHIỆM', 'content',
     [('hỏi đáp', SRC('qa.js')),
      ('nội dung 2', SRC('content2.js')),
      ('nội dung 3', SRC('content3.js')),
      ('nội dung 4', SRC('content4.js'))]),

    ('TUỲ BIẾN GIAO DIỆN TRƯỚC KHI VẼ', 'prefs', [('prefs', PREFS_JS)]),

    ('LÕI — biến thể, lưu trữ, i18n, thương hiệu', 'core',
     [('phiên bản', ver_js),
      ('thương hiệu', SRC('brand.js')),
      ('lưu trữ', SRC('store.js')),
      ('hồ sơ', SRC('profile.js')),
      ('song ngữ', SRC('i18n.js')),
      ('cấu hình đám mây', CLOUD_JS),
      ('tài khoản & đồng bộ', SRC('account.js')),
      ('khung ứng dụng', SRC('app.js')),
      ('tiện ích', SRC('tools.js')),
      ('máy tính', SRC('engine.js'))]),

    ('KHÁM PHÁ — một bảng cho mọi lối vào, tìm kiếm toàn kho', 'explore',
     [('khám phá', SRC('explore.js'))]),

    ('VẬT LÍ — máy giải, mạch điện, phòng thí nghiệm', 'physics',
     [('giải đề', SRC('solver.js')),
      ('giải đề 2', SRC('solver2.js')),
      ('dạy học', SRC('teacher.js')),
      ('bảng mạch', SRC('board.js')),
      ('mạch lồng nhau', SRC('builder.js')),
      ('mô phỏng', SRC('sim.js')),
      ('góc vật lí', SRC('special.js')),
      ('mục Vật lí', SRC('physics.js'))]),

    ('TRƯỜNG HỌC — lớp 1–12, sổ điểm, thẻ ghi nhớ', 'school',
     [('trường học', SRC('school.js')),
      ('dữ liệu thêm', SRC('seed_more.js')),
      ('dữ liệu môn học', SRC('seed_subjects.js')),
      ('học tập', SRC('study.js')),
      ('sổ điểm', SRC('grades.js'))]),

    ('THỜI GIAN — lịch, thời khoá biểu, tuần, pomodoro', 'time',
     [('lịch biểu', SRC('schedule.js')),
      ('kế hoạch tuần', SRC('weekly.js')),
      ('pomodoro', SRC('pomo.js'))]),

    ('NỘI DUNG — nhạc, đấu trường, thiết lập', 'extras',
     [('nhạc', SRC('music.js')),
      ('đấu trường', SRC('game.js')),
      ('thiết lập', SRC('settings.js'))]),

    ('CHIA SẺ — thiệp tiến độ, chia sẻ bài học', 'share',
     [('chia sẻ', SRC('share.js'))]),

    ('PHÒNG THÍ NGHIỆM TƯƠNG TÁC', 'lab', [('lab', SRC('lab.js'))]),

    ('QUYỀN RIÊNG TƯ — trang dữ liệu, ai thấy, cách xoá', 'privacy', [('privacy', SRC('privacy.js'))]),

    ('CLOUDFLARE — service worker & trạng thái mạng', 'cloudflare', [('cf', cf)]),
]

if PHYSICS_ONLY:
    # Điểm vào của bản Vật lí: mở thẳng #/physics khi chưa có hash. replaceState
    # để không sinh hashchange. Chạy trước mọi module để router thấy hash đúng.
    # Chỉ các route của Vật lí được mở; mọi route khác (trường học, lịch, cài
    # đặt...) đưa về #/physics. Trình nghe được gắn trước app.js nên chặn được
    # cả việc app vẽ trang cũ. Lần đầu dùng replaceState (không sinh sự kiện).
    ENTRY_JS = r"""(function(){
var OK=/^#\/(physics|solve|build|builder|sim|calc|flash|qa|discover|papers|exam|review|stats|library|notes|read|lesson)(\/|\?|$)/;
if(!OK.test(location.hash||'')){history.replaceState(null,'',location.pathname+'#/physics');}
window.addEventListener('hashchange',function(e){
  if(!OK.test(location.hash||'')){e.stopImmediatePropagation();location.hash='#/physics';}
},true);
})();"""
    MODULES = [('ĐIỂM VÀO VẬT LÍ', 'core', [('điểm vào', ENTRY_JS)])] + [
        m for m in MODULES if m[1] in PHYSICS_KEEP]
    PAGE_TITLE = 'Vật lí — Học mọi thứ'
    FOOT_LEAD = ('<b>Vật lí</b> — chạy hoàn toàn trong trình duyệt, '
                 'dữ liệu nằm trong máy bạn.')
else:
    PAGE_TITLE = 'Study Focus Fox — Vật lí 9 · lớp 1–12 · học offline'
    FOOT_LEAD = ('<b>Học mọi thứ</b> — Vật lí 9 · lớp 1–12 · chạy hoàn toàn '
                 'trong trình duyệt, dữ liệu nằm trong máy bạn.')

# Each module becomes its own <script>. Labels are kept short and stable: they
# are what a stack trace shows, so they have to stay meaningful for years.
SCRIPTS = [(label, '\n\n'.join(
    '/* ---- %s ---- */\n%s' % (part, code) for part, code in parts))
    for label, _slug, parts in MODULES]

if len(SCRIPTS) != len(MODULES):
    raise SystemExit('module table mismatch')

# Áp giao diện trước khi vẽ để không nháy trắng — cũng là một khối inline.


def csp_hash(raw):
    """SHA-256 base64, đúng định dạng `'sha256-…'` của CSP.

    Trình duyệt băm **đúng chuỗi nằm giữa cặp thẻ**, không phải chuỗi trong
    biến Python. Ở đây khối được dựng bằng `'<script>' + code + '</script>'`
    nên chuỗi đó chính là `code` — dùng cùng một hàm cho cả hai việc để không
    bao giờ lệch.
    """
    import base64
    return "'sha256-" + base64.b64encode(hashlib.sha256(raw.encode('utf-8')).digest()).decode() + "'"


script_hashes = ' '.join(csp_hash(code) for _, code in SCRIPTS)
style_hash = csp_hash(css)


def script_block(code):
    """Nội dung giữa hai thẻ phải == `code` thì hash mới khớp."""
    return '<script>' + code + '</script>'


scripts_html = '\n\n'.join(
    '<!-- ===== %s ===== -->\n%s' % (label, script_block(code)) for label, code in SCRIPTS)


def build_favicon():
    """Favicon = the brand mark, generated from the same half-grid the page uses.

    It used to be a "9" glyph in a serif — the product's own tab icon was a
    number, while the product is a fox. Deriving it from BRAND_MARK_HALF means
    the two can never drift apart: change the mark, the tab follows.
    """
    import re
    src = SRC('brand.js')
    m = re.search(r'const BRAND_MARK_HALF = \[(.*?)\];', src, re.S)
    if not m:
        raise SystemExit('brand.js: BRAND_MARK_HALF not found')
    halves = re.findall(r"'([^']{8})'", m.group(1))
    if len(halves) != 16:
        raise SystemExit('brand.js: BRAND_MARK_HALF must be 16 rows, got %d' % len(halves))
    fill = {'o': '#c6542d', 'd': '#a53e20', 'k': '#17150f', 'w': '#fcf9f2'}
    rects = []
    for y, h in enumerate(halves):
        row = h + h[::-1]
        for x, ch in enumerate(row):
            if ch in fill:
                rects.append('<rect x="%d" y="%d" width="1" height="1" fill="%s"/>' % (x, y, fill[ch]))
    svg = ("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' shape-rendering='crispEdges'>"
           "<rect width='16' height='16' fill='#f4f1ea'/>" + ''.join(rects) + "</svg>")
    from urllib.parse import quote
    return "data:image/svg+xml," + quote(svg, safe="/:='<># ")


favicon = build_favicon()
MAIN_HTML_FAVICON = '<link rel="icon" href="%s">' % favicon

html = f"""<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{PAGE_TITLE}</title>
<meta name="app-version" content="{VERSION}">
<meta name="description" content="Một trang để học mọi thứ: lộ trình Vật lí 9, trường học lớp 1–12, thẻ ghi nhớ cách quãng, luyện đề tự tạo, kế hoạch học, thời khoá biểu và lịch học. Study Focus Fox · @its.fox_.">
<meta name="theme-color" content="#f4f1ea" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#12110e" media="(prefers-color-scheme: dark)">
<meta name="color-scheme" content="light dark">
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta property="og:type" content="website">
<meta property="og:title" content="Học mọi thứ — Vật lí 9 · lớp 1–12">
<meta property="og:description" content="Lộ trình Vật lí 9 · luyện thi chuyên Lý · trường học lớp 1–12 · thời khoá biểu · lịch · thẻ ghi nhớ · phòng thí nghiệm. Chạy offline, dữ liệu trong máy bạn.">
<meta property="og:locale" content="vi_VN">
{MAIN_HTML_FAVICON}
<link rel="dns-prefetch" href="https://i.ytimg.com">
<style>{css}</style>
</head>
<body>
<a class="skip" href="#main">Tới nội dung chính</a>
<header class="topbar" id="top"></header>
<div class="backdrop" id="backdrop"></div>
<div class="shell">
  <nav class="rail" id="rail" aria-label="Danh sách ngày"></nav>
  <main class="main" id="main">
    <div class="wrap" style="padding-top:60px"><p class="kicker">Đang tải…</p></div>
  </main>
</div>
<footer class="foot">
  <div class="wrap wide foot-in">
    <span>{FOOT_LEAD}</span>
    <span>Thẻ ghi nhớ · luyện đề · kế hoạch · thời khoá biểu · lịch học · phòng thí nghiệm — xuất được ra tệp, dùng offline.</span>
    <span class="foot-own">
      <a href="https://github.com/MoLik-Labs/STUDY-SITE" target="_blank" rel="noopener">@its.fox_</a>
      <em>·</em>
      <a href="#/about">giới thiệu</a>
      <em>·</em>
      <span class="foot-v" title="phiên bản">v{VERSION}</span>
    </span>
  </div>
</footer>
<div class="toast" aria-live="polite"></div>
<p class="net-badge" id="netBadge" role="status" aria-live="polite" hidden></p>
<noscript><div class="wrap" style="padding:40px 20px"><h1>Cần bật JavaScript</h1><p>Trang này chạy hoàn toàn phía trình duyệt, không cần máy chủ.</p></div></noscript>

{scripts_html}
</body>
</html>
"""

# BUILD_ID = băm của nội dung cuối (bỏ phần tự tham chiếu) — dùng cho ?v= và /__version
build_id = hashlib.sha256(html.encode('utf-8')).hexdigest()[:12]

# CSP: chỉ cho phép đúng những origin mà trang thật sự dùng.
# 'unsafe-inline' KHÔNG xuất hiện ở script-src / style-src — mọi khối inline đều có hash.
# Ghi chú về style:
#   · style-src-elem  — thẻ <style> và <link rel=stylesheet>: CHỈ 'self' + hash + fonts
#   · style-src-attr  — thuộc tính style="…" trong markup. Trang dùng 140+ chỗ
#     (màu ô thời khoá biểu, vòng tiến độ, chiều rộng cột) nên phải cho phép;
#     đây là CSS, không chạy được JavaScript, và img/connect/form đều bị chặn
#     nên không mở đường rò rỉ dữ liệu.
#   · style-src       — đường lùi cho trình duyệt chưa biết style-src-elem:
#     vẫn giữ 'unsafe-inline' để giao diện không vỡ trên trình duyệt cũ.
csp = '; '.join([
    "default-src 'self'",
    "script-src 'self' " + script_hashes,
    "style-src 'self' 'unsafe-inline'",
    "style-src-elem 'self' " + style_hash,
    "style-src-attr 'unsafe-inline'",
    "font-src 'self'",
    "img-src 'self' data: https://i.ytimg.com https://*.ytimg.com blob:",
    "media-src 'self' blob: https:",
    "frame-src https://www.youtube-nocookie.com https://www.youtube.com",
    "connect-src 'self'" + (' ' + CLOUD_ORIGIN if CLOUD_ORIGIN else ''),
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'self'",
    "upgrade-insecure-requests",
])

# Chèn meta CSP + BUILD_ID vào head (sau <meta charset> để trình duyệt thấy ngay).
# Meta KHÔNG hỗ trợ frame-ancestors (trình duyệt bỏ qua và in cảnh báo console),
# nên directive đó chỉ đi qua header ở dưới; meta giữ phần còn lại.
meta_csp = '; '.join(d for d in csp.split('; ') if not d.startswith('frame-ancestors'))
html = html.replace(
    '<meta name="viewport"',
    '<meta http-equiv="Content-Security-Policy" content="%s">\n'
    '<meta name="build-id" content="%s">\n'
    '<meta name="viewport"' % (meta_csp.replace('"', '&quot;'), build_id), 1)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
io.open(OUT, 'w', encoding='utf-8').write(html)
if PHYSICS_ONLY and arg('--csp-out', None):
    # Site ghép cần đúng chuỗi CSP của bản này (có hash của các khối inline).
    io.open(arg('--csp-out', None), 'w', encoding='utf-8').write(csp)

# ================================================================ tệp phụ trợ
HEADERS = """# Cloudflare — sinh tự động bởi src/build.py, đừng sửa tay.
# Đọc bởi cả Workers Static Assets và Pages.
# Cú pháp: https://developers.cloudflare.com/workers/static-assets/headers/
#
# CSP được gửi CẢ bằng header, không chỉ bằng <meta>: meta không đặt được
# frame-ancestors và chỉ có hiệu lực sau khi trình duyệt bắt đầu đọc HTML.
# Header có hiệu lực trước byte đầu tiên. Cả hai sinh từ CÙNG một chuỗi nên
# không thể lệch nhau.
#
# Bẫy của Cloudflare: mỗi directive chỉ được đặt MỘT lần. Lặp lại thì trình
# duyệt chỉ dùng cái đầu tiên, nên toàn bộ CSP phải nằm trên một dòng.
#
# Bẫy thứ hai (đã mắc và đã sửa): chú thích trong tệp này PHẢI bắt đầu bằng
# '#'. Một dòng thụt lề nằm trong khối luật được hiểu là TÊN HEADER — chú
# thích kiểu /* */ trong khối luật làm trình duyệt nhận header rác.

/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: accelerometer=(), camera=(), microphone=(), geolocation=(), payment=(), usb=()
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-origin
  X-DNS-Prefetch-Control: off
  X-Permitted-Cross-Domain-Policies: none
  Content-Security-Policy: @@CSP@@

# Trang chính: luôn xác thực lại bằng ETag (304, vài chục byte) để người
# dùng nhận bản mới ngay sau khi deploy. Không dùng no-store để còn 304.
/
  Cache-Control: public, max-age=0, must-revalidate
/index.html
  Cache-Control: public, max-age=0, must-revalidate

# Service worker không bao giờ được cache lâu — nếu không sẽ kẹt bản cũ
/sw.js
  Cache-Control: public, max-age=0, must-revalidate

# Endpoint phiên bản: không cache
/__version
  Cache-Control: no-store
"""
# Cloudflare Workers Static Assets reads `_routes.json`-style include/exclude
# from wrangler.jsonc, but for edge cache behaviour the portable, documented
# mechanism is a Cache Rule. What we CAN do from the repo is make the correct
# behaviour the default for every asset: versioned query strings + a long TTL
# on immutable files, and a short TTL on the HTML shell.
ROUTES_JSON = """{
  "version": 1,
  "include": ["/*"],
  "exclude": []
}
"""

NOT_FOUND = """<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Không tìm thấy trang — Học mọi thứ</title>
<meta name="robots" content="noindex">
<style>
:root{--paper:#f4f1ea;--ink:#17150f;--ink2:#4f4a41;--rule:#dbd5c6;--accent:#8b2e22}
@media(prefers-color-scheme:dark){:root{--paper:#12110e;--ink:#efeade;--ink2:#b9b2a3;--rule:#2f2d26;--accent:#d98d5b}}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--paper);color:var(--ink);
  font-family:system-ui,-apple-system,'Segoe UI',sans-serif;line-height:1.6;padding:24px}
main{max-width:46ch;text-align:left}
.k{font-family:ui-monospace,monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink2)}
h1{font-family:Georgia,serif;font-size:32px;line-height:1.2;margin:10px 0 12px;font-weight:600}
p{color:var(--ink2);margin:0 0 22px}
a.btn{display:inline-block;background:var(--ink);color:var(--paper);padding:10px 16px;text-decoration:none;
  border-radius:2px;font-size:14px}
a.ghost{margin-left:10px;background:none;color:var(--ink);border:1px solid var(--rule)}
nav{margin-top:26px;padding-top:16px;border-top:1px solid var(--rule);font-size:13px}
nav a{color:var(--accent);text-decoration:none;margin-right:14px;white-space:nowrap}
</style>
</head>
<body>
<main>
  <p class="k">Lỗi 404</p>
  <h1>Không có trang này</h1>
  <p>Đường dẫn bạn mở không tồn tại. Trang này là một ứng dụng một-tệp,
     nên mọi thứ nằm sau dấu <code>#</code> — ví dụ <code>#/study</code>.</p>
  <a class="btn" href="/">Về trang chủ</a>
  <a class="btn ghost" href="/#/study">Học hôm nay</a>
  <nav>
    <a href="/#/cards">Thẻ ghi nhớ</a>
    <a href="/#/timetable">Thời khoá biểu</a>
    <a href="/#/calendar">Lịch</a>
    <a href="/#/progress">Tiến độ</a>
    <a href="/#/about">Giới thiệu</a>
  </nav>
</main>
</body>
</html>
"""

REDIRECTS = """# Cloudflare — sinh tự động bởi src/build.py, đừng sửa tay.
# Trả index.html (200, không chuyển hướng) cho mọi đường dẫn của router.
# Router dùng hash (#/study) nên người dùng gõ /study cũng phải mở được app,
# và không phải nhận 404 của Cloudflare.
#
# Vì sao đích là "/" chứ không phải "/index.html": khi html_handling =
# auto-trailing-slash, Cloudflare chuẩn hoá /index.html → / bằng 307. Rewrite
# tới /index.html vì thế sinh thêm một vòng chuyển hướng; rewrite tới / thì
# trả 200 ngay. Đã kiểm bằng `wrangler dev`.
#
# Cú pháp: <từ> <đến> <mã>. Kèm cả dạng có dấu / ở cuối.

/study       /  200
/study/      /  200
/cards       /  200
/cards/      /  200
/practice    /  200
/practice/   /  200
/plan        /  200
/plan/       /  200
/focus       /  200
/focus/      /  200
/progress    /  200
/progress/   /  200
/grades      /  200
/grades/     /  200
/weekly      /  200
/weekly/     /  200
/game        /  200
/game/       /  200
/special     /  200
/special/    /  200
/timetable   /  200
/timetable/  /  200
/calendar    /  200
/calendar/   /  200
/settings    /  200
/settings/   /  200
/about       /  200
/about/      /  200
"""

SW = io.open(os.path.join(HERE, 'sw.template.js'), encoding='utf-8').read().replace('__VERSION__', VERSION)

# Ghi bản chạy một-tệp ở gốc repo (để mở bằng file:// và commit vào Git)
io.open(OUT, 'w', encoding='utf-8').write(html)

# Chế độ deploy: chỉ chép những tệp trang cần, không lộ src/tests/docs
if '--dist' in sys.argv:
    import shutil
    dist = os.path.abspath(arg('--dist', os.path.join(ROOT, 'dist')))
    if os.path.isdir(dist):
        shutil.rmtree(dist)
    os.makedirs(dist)
    io.open(os.path.join(dist, 'index.html'), 'w', encoding='utf-8').write(html)
    io.open(os.path.join(dist, '_headers'), 'w', encoding='utf-8').write(
        HEADERS.replace('@@CSP@@', csp))
    io.open(os.path.join(dist, '_redirects'), 'w', encoding='utf-8').write(REDIRECTS)
    # Edge cache rules (Cloudflare's `_headers` cannot express CDN cache policy).
    io.open(os.path.join(dist, '_routes.json'), 'w', encoding='utf-8').write(ROUTES_JSON)
    io.open(os.path.join(dist, 'sw.js'), 'w', encoding='utf-8').write(SW)
    io.open(os.path.join(dist, '.nojekyll'), 'w', encoding='utf-8').write('')
    shutil.copytree(os.path.join(HERE, 'fonts'), os.path.join(dist, 'fonts'),
                    ignore=shutil.ignore_patterns('LICENSE-*'))
    # Worker: một tệp duy nhất, tên bắt đầu bằng "_" nên Cloudflare KHÔNG phục
    # vụ nó như tài nguyên tĩnh — mã nguồn không lộ ra ngoài.
    code = io.open(os.path.join(HERE, 'worker.template.js'), encoding='utf-8').read()
    # Build id is baked in, so /__version answers without reading index.html
    # and without touching the network.
    #
    # There is deliberately NO wall-clock timestamp here. A build that embeds
    # `now()` produces a different file on every run, so `git diff` never
    # settles, CI cannot assert "the committed build matches src/", and two
    # deploys of the same commit get different bytes (and different ETags).
    # The build id already identifies the build; SOURCE_DATE_EPOCH lets us
    # report a time when the caller supplies a reproducible one.
    stamp = os.environ.get('SOURCE_DATE_EPOCH', '0')
    try:
        import datetime
        built_at = datetime.datetime.fromtimestamp(int(stamp), datetime.timezone.utc)
    except Exception:
        import datetime
        built_at = datetime.datetime(1970, 1, 1, tzinfo=datetime.timezone.utc)
    stamped = (code
               .replace('__VERSION__', VERSION)
               .replace('__BUILD_ID__', build_id)
               .replace('__BUILT_AT__', built_at.isoformat().replace('+00:00', 'Z')))
    if '__BUILD_ID__' in stamped or '__BUILT_AT__' in stamped:
        raise SystemExit('worker template placeholders not substituted')
    io.open(os.path.join(dist, '_worker.mjs'), 'w', encoding='utf-8').write(stamped)
    io.open(os.path.join(dist, '404.html'), 'w', encoding='utf-8').write(NOT_FOUND)
    # .assetsignore: KHÔNG đưa mã nguồn/thư mục làm việc vào bản deploy.
    # Chỉ những gì cần cho trang mới lên mạng.
    io.open(os.path.join(dist, '.assetsignore'), 'w', encoding='utf-8').write(
        "# Cloudflare — sinh tự động, đừng sửa tay.\n"
        "#\n"
        "# _worker.mjs là MÃ WORKER, không phải tài nguyên. Nếu không loại trừ,\n"
        "# nó bị phục vụ công khai ở /_worker.mjs (đã kiểm bằng wrangler dev).\n"
        "# .assetsignore chặn việc upload nó thành tài nguyên tĩnh.\n"
        "_worker.mjs\n.nojekyll\n")
    print('dist   ', dist, '(index.html · 404.html · _headers · _redirects · sw.js · _worker.mjs)')

print('wrote', OUT, len(html), 'bytes')
print('build-id', build_id)
print('version', VERSION)
