# -*- coding: utf-8 -*-
"""Ghép app: lấy dữ liệu từ bản kế hoạch v4 + Q&A/quiz + giao diện mới -> 1 file HTML."""
import io, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

def arg(flag, default):
    return sys.argv[sys.argv.index(flag) + 1] if flag in sys.argv else default

SRC_PLAN = arg('--base', os.path.join(HERE, 'base.html'))
OUT = arg('--out', os.path.join(ROOT, 'index.html'))
SRC = lambda name: io.open(os.path.join(HERE, name), encoding='utf-8').read()

plan = io.open(SRC_PLAN, encoding='utf-8').read()

def block(name):
    """Lấy nguyên khối `const NAME=...;` bằng cách đếm ngoặc có nhận biết chuỗi."""
    i = plan.index('const %s=' % name)
    j = i + len('const %s=' % name)
    # tìm ký tự mở đầu [ hoặc {
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
                    # tìm dấu ;
                    end = plan.index(';', k) + 1
                    return plan[i:end]
        k += 1
    raise SystemExit('không đóng được khối ' + name)

names = ['TOPICS', 'WHO', 'LIB', 'PLAN', 'EXT', 'MORE', 'PHASES', 'NOTES']
data = '\n\n'.join(block(n) for n in names)
data += '\n\n' + SRC('papers.js')

css = io.open('/home/user/src/app.css', encoding='utf-8').read()
qa = SRC('qa.js') + '\n\n' + SRC('content2.js') + '\n\n' + SRC('content3.js') + '\n\n' + SRC('content4.js')
app = SRC('app.js')
tools = SRC('tools.js') if os.path.exists(os.path.join(HERE, 'tools.js')) else ''
solver = SRC('solver.js') + '\n\n' + SRC('solver2.js')
teacher = SRC('teacher.js')
board = SRC('board.js')
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

prefs_js = """<script>
/* áp màu trước khi vẽ để không nháy trắng */
try{var P=JSON.parse(localStorage.getItem('vnl9.prefs')||'{}');
if(P.theme)document.documentElement.setAttribute('data-theme',P.theme);
if(P.density)document.documentElement.setAttribute('data-density',P.density);
if(P.radius)document.documentElement.setAttribute('data-radius',P.radius);
if(P.motion===false)document.documentElement.setAttribute('data-motion','off');
if(P.fs)document.documentElement.style.setProperty('--fs',String(P.fs));
if(P.accent)document.documentElement.style.setProperty('--accent',P.accent);
}catch(e){}
</script>"""

html = f"""<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Học mọi thứ — Vật lí 9 · lớp 1–12 · @nggkhaiz</title>
<meta name="description" content="Một trang để học mọi thứ: lộ trình Vật lí 9, trường học lớp 1–12, thẻ ghi nhớ cách quãng, luyện đề tự tạo, kế hoạch học, thời khoá biểu và lịch học. Tác giả @nggkhaiz — github.com/Ngg.Khaiz.">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23f4f1ea'/%3E%3Ctext x='6' y='24' font-family='Georgia,serif' font-size='20' fill='%2317150f'%3E9%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap" rel="stylesheet">
<style>
{css}
</style>
{prefs_js}
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
      <a href="https://github.com/Ngg.Khaiz" target="_blank" rel="noopener">@nggkhaiz</a>
      <em>·</em>
      <a href="#/about">giới thiệu</a>
      <em>·</em>
      <span class="foot-v" title="phiên bản">v10.0</span>
    </span>
  </div>
</footer>
<div class="toast" aria-live="polite"></div>
<noscript><div class="wrap" style="padding:40px 20px"><h1>Cần bật JavaScript</h1><p>Trang này chạy hoàn toàn phía trình duyệt, không cần máy chủ.</p></div></noscript>

<script>
/* ===== DỮ LIỆU LỘ TRÌNH ===== */
{data}
</script>

<script>
/* ===== NGÂN HÀNG HỎI ĐÁP & TRẮC NGHIỆM ===== */
{qa}
</script>

<script>
/* ===== ỨNG DỤNG ===== */
{store}
{app}
{tools}
{engine}
</script>

<script>
/* ===== MÁY GIẢI · MẠCH · NHẠC · POMODORO · PHÒNG THÍ NGHIỆM ===== */
{solver}
{teacher}
{board}
{sim}
{school}
{seed_more}
{study}
{sched}
{music}
{pomo}
{settings}
{lab}
</script>
</body>
</html>
"""

io.open(OUT, 'w', encoding='utf-8').write(html)
print('wrote', OUT, len(html), 'bytes')
