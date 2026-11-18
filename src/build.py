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
VERSION = '12.0'          # khớp package.json; sinh ra meta và APP_VERSION của bản Vật lí

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

print('wrote', OUT, len(html), 'bytes')
print('build-id', build_id)
print('version', VERSION)
