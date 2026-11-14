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
VERSION = '11.4'          # một nguồn duy nhất; sinh ra meta, APP_VERSION, footer, sw.js

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

css = SRC('app.css')
qa = SRC('qa.js') + '\n\n' + SRC('content2.js') + '\n\n' + SRC('content3.js') + '\n\n' + SRC('content4.js')
brandjs = SRC('brand.js')    # Study Focus Fox — tên, logo pixel, tiêu đề tab
i18n = SRC('i18n.js')        # vi + en, cùng một bản dựng
app = SRC('app.js')
tools = SRC('tools.js')
solver = SRC('solver.js') + '\n\n' + SRC('solver2.js')
teacher = SRC('teacher.js')
board = SRC('board.js')
builder = SRC('builder.js')   # mạch lồng nhau — cần f2/f3 của solver.js
sim = SRC('sim.js')
school = SRC('school.js')
seed_more = SRC('seed_more.js')
study = SRC('study.js')
sched = SRC('schedule.js')
music = SRC('music.js')
pomo = SRC('pomo.js')
lab = SRC('lab.js')
engine = SRC('engine.js')
store = SRC('store.js')
settings = SRC('settings.js')
grades = SRC('grades.js')      # sổ điểm THCS/THPT — hệ số VN + what-if
weekly = SRC('weekly.js')      # bàn lập kế hoạch tuần — dự án → việc → việc con
game = SRC('game.js')          # Đấu trường Pixel — sinh câu vô hạn, 4 môn
special = SRC('special.js')    # Góc Vật lí — đọc đề, hằng số, thang công thức
share = SRC('share.js')        # thiệp tiến độ — vẽ trên máy, không tải lên
cf = SRC('cloudflare.js')     # đăng ký service worker + trạng thái mạng

ver_js = "/* phiên bản — sinh từ src/build.py */\nconst APP_VERSION = '" + VERSION + "';"

# Các khối script, đúng thứ tự sẽ chèn vào HTML.
SCRIPTS = [
    ('DỮ LIỆU LỘ TRÌNH', data),
    ('NGÂN HÀNG HỎI ĐÁP & TRẮC NGHIỆM', qa),
    ('ỨNG DỤNG', ver_js + '\n' + brandjs + '\n' + store + '\n' + i18n + '\n' + app + '\n' + tools + '\n' + engine),
    ('MÁY GIẢI · MẠCH · NHẠC · POMODORO · PHÒNG THÍ NGHIỆM',
     solver + '\n' + teacher + '\n' + board + '\n' + builder + '\n' + sim + '\n' + school + '\n'
     + seed_more + '\n' + study + '\n' + sched + '\n' + music + '\n' + pomo + '\n'
     + settings + '\n' + grades + '\n' + weekly + '\n' + game + '\n' + special + '\n' + share + '\n' + lab),
]

# Áp giao diện trước khi vẽ để không nháy trắng — cũng là một khối inline.
PREFS_JS = """/* áp màu trước khi vẽ để không nháy trắng */
try{var P=JSON.parse(localStorage.getItem('vnl9.prefs')||'{}');
if(P.theme)document.documentElement.setAttribute('data-theme',P.theme);
if(P.density)document.documentElement.setAttribute('data-density',P.density);
if(P.radius)document.documentElement.setAttribute('data-radius',P.radius);
if(P.motion===false)document.documentElement.setAttribute('data-motion','off');
if(P.fs)document.documentElement.style.setProperty('--fs',String(P.fs));
if(P.accent)document.documentElement.style.setProperty('--accent',P.accent);
}catch(e){}"""

SCRIPTS.insert(2, ('TUỲ BIẾN GIAO DIỆN TRƯỚC KHI VẼ', PREFS_JS))
SCRIPTS.append(('CLOUDFLARE — service worker & trạng thái mạng', cf))


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

html = f"""<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Study Focus Fox — Vật lí 9 · lớp 1–12 · học offline</title>
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
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23f4f1ea'/%3E%3Ctext x='6' y='24' font-family='Georgia,serif' font-size='20' fill='%2317150f'%3E9%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="dns-prefetch" href="https://i.ytimg.com">
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600&family=JetBrains+Mono:wght@400;500&family=Lora:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
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
    <span><b>Học mọi thứ</b> — Vật lí 9 · lớp 1–12 · chạy hoàn toàn trong trình duyệt, dữ liệu nằm trong máy bạn.</span>
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
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "style-src-elem 'self' " + style_hash + ' https://fonts.googleapis.com',
    "style-src-attr 'unsafe-inline'",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://i.ytimg.com https://*.ytimg.com blob:",
    "media-src 'self' blob: https:",
    "frame-src https://www.youtube-nocookie.com https://www.youtube.com",
    "connect-src 'self'",
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'self'",
    "upgrade-insecure-requests",
])

# Chèn meta CSP + BUILD_ID vào head (sau <meta charset> để trình duyệt thấy ngay)
html = html.replace(
    '<meta name="viewport"',
    '<meta http-equiv="Content-Security-Policy" content="%s">\n'
    '<meta name="build-id" content="%s">\n'
    '<meta name="viewport"' % (csp.replace('"', '&quot;'), build_id), 1)

io.open(OUT, 'w', encoding='utf-8').write(html)

# ================================================================ tệp phụ trợ
HEADERS = """# Cloudflare — sinh tự động bởi src/build.py, đừng sửa tay.
# Đọc bởi cả Workers Static Assets và Pages.
# Cú pháp: https://developers.cloudflare.com/workers/static-assets/headers/

/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: accelerometer=(), camera=(), microphone=(), geolocation=(), payment=(), usb=()
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-origin

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
    io.open(os.path.join(dist, '_headers'), 'w', encoding='utf-8').write(HEADERS)
    io.open(os.path.join(dist, '_redirects'), 'w', encoding='utf-8').write(REDIRECTS)
    io.open(os.path.join(dist, 'sw.js'), 'w', encoding='utf-8').write(SW)
    io.open(os.path.join(dist, '.nojekyll'), 'w', encoding='utf-8').write('')
    # Worker: một tệp duy nhất, tên bắt đầu bằng "_" nên Cloudflare KHÔNG phục
    # vụ nó như tài nguyên tĩnh — mã nguồn không lộ ra ngoài.
    code = io.open(os.path.join(HERE, 'worker.template.js'), encoding='utf-8').read()
    io.open(os.path.join(dist, '_worker.mjs'), 'w', encoding='utf-8').write(
        code.replace('__VERSION__', VERSION))
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
