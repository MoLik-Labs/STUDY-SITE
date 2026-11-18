# Bàn giao kỹ thuật — Học mọi thứ · v10.0

Tài liệu này là “bộ nhớ” của dự án: đọc hết là có thể sửa, mở rộng và kiểm thử mà không cần hỏi lại.

> **Trạng thái hiện tại (2026-11-16, nhánh `arena/d12df461-study-site`, PR #9).**
> Dự án đang chuyển sang hai phần, chưa xong:
> - **Bản chính (`src/` → `dist/`)** vẫn là app một tệp cũ, phục vụ production. Các phần dưới đây mô tả bản này.
> - **Khung mới (`site/`)**: lịch tuần, việc cần làm, môn tự tạo, và 8 môn năm 2 (`/<slug>/`). Dữ liệu lưu trên máy, bản hỏng được sao lưu sang `sf.plan.v2.bak`. Build bằng `node site/build.mjs` ra `site-dist/`, test bằng `node --test site/test/*.test.mjs`.
> - **Vật lí (`/physic/`)**: dựng từ chính các module vật lí của bản chính bằng `python3 src/build.py --physics-only`. Điểm vào `#/physics`, route ngoài phạm vi chuyển về đây. Chưa có service worker nên chưa chạy offline. CSS dùng chung (~240 KB) chưa được tách.
> - **Chưa làm:** đổi production sang khung mới (đang chờ quyết định), cá nhân hoá (hồ sơ, trang chủ thích ứng, bố cục), đăng nhập và đồng bộ Supabase trong khung mới, trang quyền riêng tư và xoá dữ liệu trong khung mới, đánh giá thiết kế theo taste-skill, đo lại Lighthouse, kiểm chứng các URL tài liệu chưa mở (xem `docs/COURSE-RESOURCES.md`).
> - **Hồ sơ học sinh:** `SUBJECTS` và `schoolState` nằm ở `src/profile.js` (lõi dùng chung).
> - **Supabase:** schema bảng riêng có RLS ở `supabase/migrations/`. Mục nào làm gì xem `docs/SUPABASE-SETUP.md`.
Cập nhật lần cuối: **2026-11-14** · phiên bản **11.2.0** · build ~1.029 KB thô / ~230 KB Brotli

---

## 1. Triết lý

1. **Một tệp, chạy được ngay.** `index.html` chứa toàn bộ CSS/JS/dữ liệu. Không API AI, không CDN bắt buộc.
   Không đăng nhập là mặc định. Tài khoản Supabase là tuỳ chọn (xem `docs/SUPABASE-SETUP.md`), và bản build
   không có biến môi trường thì chỉ có chế độ khách. Mở bằng trình duyệt là dùng; copy sang máy khác vẫn chạy.
2. **Không có “trang trí rỗng”.** Mỗi khối trên giao diện phải gắn với dữ liệu thật của người học.
3. **Dữ liệu thuộc về người học.** Lưu trong `localStorage` + IndexedDB, xuất được ra `.json`, in được ra giấy.
4. **Tiếng Việt trong giao diện, tiếng Anh trong mã.** Tên biến/hàm tiếng Anh, chữ hiển thị tiếng Việt có dấu.

---

## 2. Kiến trúc build

```
src/base.html          khung HTML gốc (title, meta, header/footer, các vùng chứa)
src/*.js               mô-đun, ghép theo thứ tự cố định trong src/build.py
src/app.css            toàn bộ CSS (177 KB, gồm 13 theme)
        │
        ▼  python3 src/build.py
index.html             bản chạy duy nhất
```

`src/build.py` đọc `src/base.html`, chèn 5 khối `<script>` theo thứ tự:

| Khối | Nội dung |
|---|---|
| 1 | `data` — lộ trình 52 ca sinh từ `base.html` + `papers.js` |
| 2 | `qa` — `qa.js` + `content2/3/4.js` (hỏi đáp, trắc nghiệm, bài đọc) |
| 3 | `ver_js` + `store` + `app` + `tools` + `engine` — phiên bản, lõi ứng dụng, router, tìm kiếm |
| 4 | `solver`, `teacher`, `board`, **`builder`**, `sim`, `school`, `seed_more`, `study`, **`sched`**, `music`, `pomo`, `settings`, `lab` |

> **Thứ tự có ý nghĩa:** `study.js` gọi `schTodaySummary()` nếu tồn tại (kiểm tra `typeof`), nên `sched` đứng sau.
> `settings.js` cần đứng trước `lab.js`. `builder.js` dùng `f2`/`f3` của `solver.js` và `pageHead` của `tools.js`
> nên phải đứng **sau** cả hai. Đổi thứ tự phải chạy lại `npm test`.

**Phiên bản chỉ khai một chỗ:** `VERSION` ở đầu `src/build.py` → sinh `const APP_VERSION`,
`<meta name="app-version">` và dòng `v10.1` ở chân trang. Không sửa tay trong `index.html`.

Lệnh:
```bash
python3 src/build.py                 # mặc định: src/base.html → index.html
python3 src/build.py --base X --out Y
node tools/check.js                  # cú pháp, CSS, hộp thoại gốc, mã chết, router
npm test                             # build + check + 51 + 32 bước jsdom
```

---

### 2.1 Build sinh thêm những gì

`python3 src/build.py --dist` không chỉ ghép JS. Nó còn:

| Việc | Vì sao |
|---|---|
| Băm **SHA-256 mọi khối `<script>` / `<style>`** và nhúng vào `<meta http-equiv="Content-Security-Policy">` | CSP nghiêm mà không cần `'unsafe-inline'` |
| Sinh `_headers` | header bảo mật + chiến lược cache (Workers và Pages đều đọc) |
| Sinh `_redirects` | mọi đường dẫn con trả `/` với mã `200` (router dùng hash) |
| Chép `src/sw.template.js` → `dist/sw.js`, thay `__VERSION__` | mỗi deploy là một cache mới |
| Sinh `dist/_worker.mjs` từ `src/worker.template.js`, nhúng `__VERSION__` | Worker: `GET /__version` + trả `404.html`; `.assetsignore` loại nó khỏi assets |
| Sinh `dist/404.html` | trang 404 riêng cho `not_found_handling = "404-page"` |
| Sinh `dist/.assetsignore` | chặn `_worker.mjs` và `.nojekyll` bị phục vụ công khai |
| Tính `build_id` (băm 12 ký tự của HTML) → `<meta name="build-id">` | Worker dùng làm ETag cho `/__version` |

**Quy tắc vàng:** không sửa `index.html` bằng tay. Hash CSP tính từ nội dung, sửa tay là CSP
lệch → **trang trắng**. `npm test` sẽ bắt lỗi này ở `tests/csp.js`.

Chi tiết triển khai Cloudflare: [`docs/CLOUDFLARE.md`](CLOUDFLARE.md).

---

## 3. Bản đồ route

| Route | Hàm | Ghi chú |
|---|---|---|
| `#/` | `renderHome` | hero, dải Học hôm nay, `.hero-sign` |
| `#/day/:id` | `renderDay` | một ngày trong lộ trình |
| `#/lesson/:d/:i` | `renderLesson` | bài đọc, ghi chú, Feynman, đọc thành tiếng |
| `#/library`, `#/notes` | `renderLibrary`, `renderNotes` | thư viện, ghi chú |
| `#/papers`, `#/exam`, `#/review`, `#/solve/:i` | | đề, phòng thi, chữa đề, máy giải |
| `#/qa`, `#/flash`, `#/stats`, `#/calc` | | hỏi đáp, thẻ cũ, thống kê, máy tính |
| `#/build`, `#/sim`, `#/lab` | `renderBoard`, `renderSim`, `renderLab` | bảng vẽ, mô phỏng, 4 bàn thí nghiệm |
| **`#/builder`** | `renderBuild` | v10.1 — mạch lồng nhau: cây nt/ss đến 5 tầng, thêm–bớt R |
| `#/subjects`, `#/subject/:lop/:mon` | | trường học lớp 1–12 |
| `#/read/:id`, `#/studio`, `#/mine`, `#/files` | | đọc bài, tự soạn, bài của tôi, tệp |
| **`#/study`** | `renderStudy` | Study OS + khối `sy-today` |
| **`#/cards`** | `renderCards` | thẻ 7 hộp |
| **`#/practice`** | `renderPractice` | luyện đề tự tạo |
| **`#/plan`** | `renderPlan` | kế hoạch tới ngày thi |
| **`#/focus`** | `renderFocus` | đồng hồ tập trung |
| **`#/progress`** | `renderProgress` | tiến độ tổng |
| **`#/timetable`** | `renderTimetable` | v10 |
| **`#/calendar`** | `renderCalendar` | v10 |
| **`#/about`** | `renderAbout` | v10 — chủ sở hữu, GitHub |
| `#/settings` | `renderSettings` | theme, màu nhấn, cỡ chữ, nhạc |

Router nằm cuối `src/app.js` — một chuỗi `if (p[0]===…) return render…()`, mặc định `renderHome()`.

---

## 4. Lược đồ dữ liệu

### `localStorage['vnl9.v2']` — trạng thái chính
```js
{
  done: [],            // id câu đã làm đúng
  watched: [],         // video đã xem
  ans: {},             // đáp án theo câu
  mine: [],            // bài tự soạn
  note: {},            // ghi chú theo bài
  runs: [],            // lịch sử luyện đề
  days: {},            // 'YYYY-MM-DD' → số hoạt động (heatmap, chuỗi)
  calc: {}, book: {}, sheet: {},
  music: {…}, pomo: {…},
  goal: { min: 60, cards: 20 },
  study: { cards: [], plan: {…}, log: [], … },   // Study OS (v9)
  sched: {…}                                     // v10 — xem dưới
}
```
`localStorage['vnl9.prefs']` giữ `theme`, `accent`, `size`, `music`, `sound`.
`vnl9.b1` / `vnl9.b2` / `vnl9.b3` là ba bản sao lùi dần (`b3 ← b2 ← b1 ← bản cũ`). `write()` phải **đọc bản cũ trước khi ghi đè** — bản 10.0 đọc sau khi ghi nên cả ba bản luôn trùng nhau và lưới an toàn không tồn tại.

### `state.sched` (v10)
```js
{
  tables: [{
    id: 'tkb1', name: 'Thời khoá biểu chính khoá',
    days: 6, morning: 5, afternoon: 3,
    cells: { 'd-k-i': { s: 'Vật lí', t: 'Tiết 1', r: 'Cô Hoa', c: 'brick' } }
  }],
  activeId: 'tkb1',
  events: [{
    id, date: '2026-11-14', time: '19:00', title, color, kind: 'study|exam|deadline|other',
    note, done: false, src: 'tt'    // src = sinh từ thời khoá biểu
  }],
  calView: 'month' | 'week',
  cursor: '2026-11-14'
}
```

### API nội bộ quan trọng
| Hàm | Việc |
|---|---|
| `schedState()` | lấy/khởi tạo `state.sched` |
| `schedTable()` | bảng đang mở |
| `renderTimetable()` / `renderCalendar()` | vẽ trang |
| `schAutoFill(T)` → `schApplyAuto(T, list)` | overlay nhập môn → rải đều + tô màu |
| `schPushWeek(T)` | đổ một tuần TKB thành việc trong lịch, chống trùng `ngày+giờ+tên+src` |
| `schICS()` | tải `.ics` (RFC 5545) |
| `schTodaySummary()` | `{ today[], next, days }` — dùng cho dashboard |
| `schColor(id)` | trả `{ bg, fg, dot }` theo 12 màu bảng |
| `calAdd(o)` / `calEditor(ev, iso)` | thêm việc / hộp thoại sửa việc |
| `SCH_ISO(date)` / `SCH_VN(iso)` | chuyển ngày ISO ↔ `dd/mm/yyyy` |
| `uiPrompt(title, def, onOk, opt)` | hộp nhập nội trang (thay `prompt()`) |
| `uiCardForm()` | form thẻ nhanh |

---

## 5. Giao diện

### 5.0 CSP — những gì được phép

| Loại | Cho phép | Ghi chú |
|---|---|---|
| `<script>` | chỉ 6 khối inline của bản build (khớp hash) + `'self'` | không `unsafe-inline`, không `unsafe-eval` |
| `<style>` | khối duy nhất của bản build (khớp hash) | `style-src-elem` |
| thuộc tính `style="…"` | `'unsafe-inline'` | **cần thiết**: 140+ chỗ (màu ô TKB, thanh tiến độ, vị trí hình vẽ). CSS không chạy được JS; `img/connect/form` đều bị chặn |
| ảnh | `'self' data: i.ytimg.com *.ytimg.com blob:` | ảnh bìa video YouTube |
| iframe | `youtube-nocookie.com`, `youtube.com` | khung phát bài giảng |
| `connect-src` | `'self'` | chỉ `/__version`; **không** gọi API ngoài |

Thêm một origin mới (ví dụ dịch vụ ảnh khác) thì phải sửa `src/build.py` **và** `tests/csp.js`,
nếu không `npm test` sẽ báo “origin không nằm trong CSP”.


- Token: `--paper` (nền trang), `--card`, `--ink` (chữ chính), `--ink2` (chữ phụ), `--accent`, `--line`.
  Không hard-code màu; luôn dùng biến để theme đổi được.
- 13 theme khai báo trong `src/settings.js` → sinh `html[data-theme=…]` trong `app.css`.
  Theme tối (`midnight`, `graphite`, `pixelnight`) có khối override riêng — **thêm theme tối mới phải bổ sung vào đó**
  nếu muốn rail lộ trình và bảng thí nghiệm đọc được.
- Thành phần dùng lại: `.wrap.wide`, `.page-head`, `.kicker`, `.btn` / `.btn.ghost` / `.btn.sm`,
  `.sy-box` + `.sy-box-h/f`, `.cal-*` (lịch), `.tt-*` (thời khoá biểu), `.ab-*` (about), `.overlay` + `.ov-panel` (hộp thoại).
- In ấn: `@media print` ẩn chrome; `.tt-brand` in dòng `@nggkhaiz · github.com/Ngg.Khaiz`.
- Nơi đặt tag chủ sở hữu: hero (`.hero-sign`), topbar (`.tb-owner`), footer (`.foot-own`), `#/about`, `<title>`,
  `<meta name="description">`, bản in, `document.title` từng trang có tiền tố thương hiệu.

---

## 6. Quy tắc viết mã (rút ra từ lỗi thật)

1. **Không dùng `prompt()`, `confirm()`, `alert()`.** Chạy trong iframe/preview sẽ bị chặn và treo QA.
   Dùng `uiPrompt`, `uiConfirm`, `uiCardForm`, hoặc `.overlay` tự dựng.
   `tools/check.js` quét `src/` và **làm CI thất bại** nếu thấy một trong ba hàm này.
2. **Không đặt biến cục bộ trùng tên helper toàn cục** (`esc`, `$`, `$$`, `toast`, `save`, `state`).
   Đã từng gây `TypeError` khi mở hộp thoại lịch vì `const esc = e => …` che `esc()`.
3. **Không gọi mạng.** Preview của Workspace không có network: ảnh phải là SVG inline hoặc data URI.
   Video/âm thanh do người dùng tự dán link.
4. **Mọi thứ ghi vào `state` phải `save()` ngay** và phải chịu được tải lại trang (QA kiểm bằng `location.reload()`).
5. **Không gắn `document.onkeydown` trực tiếp.** Dùng hàm bind + hàm `*Cleanup()` gọi trong router,
   nếu không phím tắt sẽ rò sang trang khác.
6. **Dedupe khi sinh dữ liệu hàng loạt.** Khoá phải đủ đặc (`ngày + giờ + tên + nguồn`), nếu không bấm hai lần sẽ nhân đôi.
7. **Ô lịch tối thiểu 104px**, chấm màu thay vì nhồi chữ; chữ trong ô 10–11px.
8. **Trước khi kết luận “đã xong” phải chạy `npm test`** (build khớp, check tĩnh, 51 + 32 bước jsdom).
   Sửa giao diện thì mở thêm trình duyệt thật (`tools/qa/`): có tràn ngang không, console có lỗi không.
9. **Viết tên người dùng vào HTML phải đi qua `esc()`** — kể cả trong thuộc tính. `esc()` thoát `& < > " '`;
   thiếu `"` là mở ô nhập ra rỗng và mất dữ liệu khi lưu (đúng lỗi đã gặp ở `#/timetable`).
10. **Mọi `src/*.js` phải được `src/build.py` ghép vào**, nếu không `tools/check.js` báo “mã chết”.

---

## 7. Chạy bộ kiểm thử

### 7.1 Không cần trình duyệt (dùng trong CI)

```bash
npm test        # = build + check + smoke + interaction
```

| Tệp | Số bước | Nội dung |
|---|---|---|
| `tools/check.js` | — | cú pháp 5 khối script · cân bằng CSS · cấm `prompt/confirm/alert` · mọi `src/*.js` phải được build dùng · mọi tuyến router phải có hàm `render*` |
| `tests/smoke.js` | 51 | nạp `index.html` trong jsdom, đi qua **35 tuyến**, tuyến nào cũng phải > 200 ký tự và không lỗi; kiểm `DAYS/TOTAL_SESS/QA/QUIZ/LIB/THEMES`, `esc`, `AppStore.importText`, `uid` |
| `tests/interaction.js` | 32 | tên có dấu nháy trong thời khoá biểu · `uiConfirm` Huỷ/Xác nhận · xoay vòng 3 bản sao lưu · `.ics` thoát ký tự + gấp dòng · sao lưu↔khôi phục · thẻ → kế hoạch → thi thử · đổi theme có ghi nhớ · bẫy Tab |

Cần `jsdom`: `npm install --no-save jsdom`.

### 7.2 Trong trình duyệt thật (`tools/qa/`)

Mỗi tệp là **một biểu thức JS** trả về `{rounds, pass, total, errors}`; chạy bằng `playwright-cli`.

```bash
python3 -m http.server 8124
playwright-cli -s=qa open "http://localhost:8124/index.html" --browser=chromium
playwright-cli -s=qa resize 1500 1000
playwright-cli -s=qa eval "$(cat tools/qa/sched.js)"
```

| Tệp | Số bước | Nội dung |
|---|---|---|
| `sched.js` | 21 | lưới 48 ô, tạo bảng, tự xếp 47 tiết, sửa/xoá tiết, lịch 42 ô, `.ics`, đổ TKB → lịch |
| `study.js` | 21 | dashboard, thẻ, ôn, luyện đề, kế hoạch, đồng hồ, heatmap, sao lưu |
| `school.js` | 26 | 12 lớp × môn, đọc bài, tạo bài, xuất/nhập |
| `board.js` | 17 | kéo–thả, nối dây, xoá, lưu |
| `sim.js` | 19 | mô phỏng quang – cơ – điện |
| `audit.js` | 30 route | tràn ngang, phần tử bị cắt, lỗi JS — 1500×1000 và 390×844 |

**Mẹo:** mỗi tệp QA tự dọn dữ liệu nó tạo (`QA …`) và kết thúc bằng bước “không lỗi JS”.
Sau `location.reload()` phải tách lần `eval` — không dùng được trong cùng một lượt.

## 8. Bài học & bẫy đã gặp

| Triệu chứng | Nguyên nhân | Cách xử lý |
|---|---|---|
| Bấm ô lịch không mở hộp thoại, console `Cannot set properties of null` | `const esc` trong `calEditor` che `esc()` toàn cục | đổi tên thành `onEsc` |
| Chữ ở rail gần như mất trên nền tối | nền `--paper` sáng + chữ `--paper` | override `html[data-theme=…] .rs-main` |
| Đổ TKB vào lịch chỉ được 6 việc | chống trùng chỉ theo `ngày+tên` | thêm `giờ` vào khoá |
| Dán 5 môn thành 1 môn | chỉ tách dấu phẩy | tách `[,;\n\r]+` + `Set` |
| Onboarding che mất trang khi chụp QA | overlay “Lần đầu mừng” | bấm “Để sau” hoặc xoá `.overlay` trước khi chụp |
| `eval` sau `location.reload()` trả `null` | trang đang tải lại | tách thành 2 lần gọi, chờ 1–2 giây |
| Server dev chết giữa các phiên | tiến trình nền bị dọn | `curl` kiểm tra, nếu 000 thì `start_process` lại |
| Sửa tên một tiết TKB xong mở lại thấy **ô rỗng**, lưu thì mất chữ | `esc()` chỉ thoát `& < >`, không thoát `"` → `value="Vật "lí""` vỡ thuộc tính | `esc()` thoát thêm `"` và `'` |
| Cả 3 bản dự phòng localStorage giống hệt nhau | đọc `vnl9.v2` **sau** khi đã ghi đè | đọc `prev` trước, rồi mới ghi và xoay vòng |
| GitHub Actions / Pages không bao giờ chạy | `.github/` nằm trong thư mục con của repo | workflow phải ở **gốc** repo |
| `python3 src/build.py` báo `FileNotFoundError: /home/user/src/app.css` | CSS đọc bằng đường dẫn tuyệt đối | luôn dựng đường dẫn từ `HERE`/`ROOT` của `build.py` |
| `builder.js` nằm trong repo nhưng không có tuyến nào | quên thêm vào `build.py` + router | `tools/check.js` giờ chặn “mã chết” |

---

## 9. Định hướng

1. Xuất thời khoá biểu/lịch ra **ảnh PNG** (dùng `<canvas>` hoặc `foreignObject` → `toDataURL`, không thư viện).
2. **Sinh lịch ôn ngược**: từ ngày thi + danh sách chủ đề → chia mốc, đẩy vào `#/plan` và `#/calendar`.
3. Badge “N việc hôm nay” ở topbar, cập nhật khi thêm/xong việc.
4. Xuất/nhập **toàn bộ** `state.sched` để chuyển máy (hiện đã nằm trong sao lưu Study OS).
5. Đồng bộ Google Calendar hai chiều (một chiều đã có qua `.ics`) — cần OAuth, sẽ phá vỡ nguyên tắc “không máy chủ”;
   nếu làm, phải là tuỳ chọn và có cảnh báo.
6. Chuyển `tools/qa/*.js` sang Playwright chạy bằng `node` để CI kiểm được cả giao diện thật
   (hiện phải chạy tay vì `playwright-cli` không có trong CI).

---

## 10. Chuyển giao

```bash
git init
git add .
git commit -m "v10.0 — thời khoá biểu, kế hoạch, lịch, chữ ký tác giả"
git branch -M main
git remote add origin https://github.com/<tài-khoản>/vat-li-9-study-os.git
git push -u origin main
```

Sau khi push: **Settings → Pages → Source: GitHub Actions**. Workflow `pages.yml` sẽ deploy;
`check.yml` chặn merge nếu `index.html` không khớp bản dựng lại từ `src/` hoặc có lỗi cú pháp.

© 2026 **@nggkhaiz** — [github.com/Ngg.Khaiz](https://github.com/Ngg.Khaiz) · MIT
