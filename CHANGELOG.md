# Changelog

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/), phiên bản theo [SemVer](https://semver.org/lang/vi/).
Mọi thay đổi lớn đều có kiểm thử: `npm test` (check tĩnh + CSP + Worker + mô phỏng Workers + 83 bước jsdom).

## [11.2.0] — 2026-11-14

Nghiên cứu 15+ trang học tập đang chạy tốt (beaverplans, MyStudyLife, Power Planner,
Shovel, Todait, Study-Track, StudyTracker, Mindomax…), rồi lấy **cơ chế** đúng với
bối cảnh Việt Nam thay vì bắt chước giao diện.

### Mới · Sổ điểm `#/grades`
- **Đúng quy chế Bộ GD&ĐT**: miệng & 15 phút hệ số 1, 1 tiết hệ số 2, học kì hệ số 3.
  ĐTB môn = Σ(điểm × hệ số) ÷ Σ(hệ số); **cả năm = (HK1 + 2 × HK2) ÷ 3**.
- **Hệ số sửa được** — mỗi trường một khác; sửa là mọi con số đổi ngay, không nhập lại điểm.
  Đây là chỗ các app nước ngoài (GPA thang 4.0 theo tín chỉ) không làm được cho học sinh VN.
- **Xếp loại theo TT 22/2021**: Tốt ≥ 8,0 · Khá ≥ 6,5 · Đạt ≥ 5,0 · Chưa đạt ≥ 3,5.
- **"Cần bao nhiêu điểm"** (what-if, học từ Power Planner): cho biết bài 1 tiết tới phải
  được mấy điểm để đạt mục tiêu — và **nói thẳng khi mục tiêu đã bất khả thi**.
- Dòng "nên chú ý nhất": 3 môn thấp nhất, nối thẳng sang `#/plan`.
- KPI điểm TB xuất hiện cả ở `#/progress`, có liên kết về sổ điểm.

### Mới · Kế hoạch tuần `#/weekly`
- Mô hình của **beaverplans**: `dự án → việc → việc con → rải vào ngày`.
- **Rải theo độ khó**: việc **khó nhất lên đầu tuần** (lúc còn sức), giảm dần.
  Gõ `khó:` / `vừa:` / `dễ:` ở đầu tên việc là đặt được độ khó — hiểu ở mọi đường nhập,
  kể cả dấu hai chấm full-width.
- **Chọn ngày mình có thể học**: tắt T7/CN là cách trung thực nhất để kế hoạch không tự lừa.
- **Kéo việc trễ về hôm nay** — không mất việc nào (khác beaverplans, vốn bỏ mặc việc cũ).
- Việc con nối được vào bài học trong máy (`#/read/…`), không phải gõ lại.

### Mới · Đếm ngược & tính khả thi (học từ Shovel, Sora, Todait)
- Kế hoạch học hiện **"còn N ngày"** ngay trên đầu trang, tô đậm khi ≤ 7 ngày.
- **"Vừa sức / Sát nút / Quá tải"**: so số mục còn lại với số phút bạn khai × số ngày thật
  còn lại — trả lời "kế hoạch này có làm kịp không", không chỉ "còn mấy ngày".

### Kiểm thử
- **`tests/newfeat.js` (mới, 33 bước)** khoá công thức bằng số thật: ví dụ sách giáo khoa
  109/14 = 7,7857 (nhiều trang web in 7,714 — đó là 108/14, tính nhẩm sai), đổi hệ số,
  cả năm, xếp loại, what-if, rải việc theo độ khó, kéo việc trễ.
- `tests/smoke.js` thêm 3 tuyến → **54 bước**. Tổng **205 bước** xanh.
- Build vẫn tất định (hai lần dựng byte-identical).

---

## [11.1.0] — 2026-11-14

**Chuyển sang Cloudflare Workers Static Assets** sau khi so sánh có bằng chứng với Pages, Vercel,
Netlify và GitHub Pages. Không phải đổi một dòng nào trong `src/` về mặt giao diện.

### Vì sao đổi
- Cloudflare tự viết trong *Workers Best Practices*: "If you are starting a new project, use
  Workers instead of Pages. Pages continues to work, but new features and optimizations are
  focused on Workers." Pages **không** bị khai tử — nhưng Workers là nơi mọi thứ mới diễn ra.
- Workers Static Assets vẫn đọc `_headers` và `_redirects` y như Pages, nên chi phí chuyển đổi
  gần bằng không, còn đường dài thì mở ra D1/KV/R2/**cron** (Pages không có cron).
- Với `run_worker_first` không bật, **mọi request tĩnh vẫn miễn phí và không bị đếm** vào hạn
  mức 100.000/ngày — nên trang này thực tế không bao giờ chạm hạn mức.

### Thay đổi
- `wrangler.toml` → **`wrangler.jsonc`**: `main`, `assets.directory`, `assets.binding = ASSETS`,
  `not_found_handling = "404-page"`, `html_handling = "auto-trailing-slash"`, `workers_dev`,
  `preview_urls`, và khối `routes` ghi sẵn để gắn tên miền riêng.
- **Worker một tệp** sinh từ `src/worker.template.js` → `dist/_worker.mjs`: `GET /__version`
  (JSON, `ETag`, `304`, `405`, chịu lỗi khi không đọc được `index.html`) + trả `404.html` thật.
  Bỏ cấu trúc `functions/` của Pages; Pages vẫn dùng lại được nếu cần (§6 trong tài liệu).
- **`dist/404.html`**: trang 404 riêng, nhẹ (2 KB), có lối về các tuyến chính, `noindex`.
- **`.assetsignore`**: loại `_worker.mjs` (và `.nojekyll`) khỏi assets — **nếu không, mã Worker
  bị phục vụ công khai ở `/_worker.mjs`**. Lỗi này chỉ lộ ra khi chạy `wrangler dev` thật.
- **`_redirects` trỏ `/` thay vì `/index.html`**: đích cũ sinh thêm một vòng `307` mỗi lần vào
  `/study`. Thêm cả dạng có dấu `/` cuối. Đã kiểm: giờ trả `200` thẳng.
- **`src/worker.template.js`**: gọi `env.ASSETS` với `redirect: 'follow'` — thiếu cờ này thì
  `/404.html` bị `307` sang `/404` và người dùng nhận plain text thay vì trang 404.
- **`sw.js`**: precache `./` thay vì `./index.html` (Cloudflare `307` đường `/index.html`), và
  thêm `./404.html` để mất mạng vẫn thấy trang 404 tử tế. Duyệt từng tệp thay vì `addAll()`
  để một tệp lỗi không làm hỏng cả lô.
- `npm run deploy` = `wrangler deploy`; thêm `npm run preview` (chạy workerd ở máy).
- `_headers`/`_redirects` bỏ nhãn "Pages" trong chú thích; giữ nguyên toàn bộ giá trị.

### Kiểm thử
- **`tests/worker.js` (mới, 32 bước)** — mô phỏng đúng thứ tự phục vụ của Workers: tài nguyên
  tĩnh miễn phí, `_redirects`, 404, và **không lộ mã nguồn**. Đây là lưới an toàn cho cả ba lỗi
  ở trên.
- `tests/functions.js` chuyển sang `dist/_worker.mjs`, thêm 6 bước kiểm `wrangler.jsonc` khớp
  `dist/` (main tồn tại, `assets.directory`, `binding`, `run_worker_first` không bật).
- `tests/csp.js` thêm kiểm `404.html`, `.assetsignore`, `_worker.mjs` → **28 bước**.
- CI thêm bước chạy `tests/worker.js`.

### Kiểm chứng
- `wrangler deploy --dry-run`: **8 tệp** vào assets, Worker **2,7 KB** (gzip 1,15 KB).
- `wrangler dev --local` rồi gọi thật 11 loại request: `/`, `/study`, `/about/` → `200`;
  `/index.html` → `307`; `/__version` → `200` JSON + `304` khi khớp `If-None-Match` + `405` khi
  `POST`; `/nope` → `404` + HTML của ta; `/_worker.mjs`, `/_headers`, `/src/app.js`,
  `/package.json`, `/wrangler.jsonc` → `404`.
- `npm test`: **163 bước** xanh.

---

## [11.0.0] — 2026-11-14

Bản dành cho **Cloudflare Pages**: bảo mật bằng CSP nghiêm, cache đúng, chạy offline, có một
endpoint backend thật.

### Bảo mật
- **Content-Security-Policy sinh tự động.** `src/build.py` băm SHA-256 từng khối `<script>` và
  `<style>` rồi nhúng hash vào `<meta http-equiv>`. `script-src` **không có `'unsafe-inline'`**,
  không có `'unsafe-eval'`, `object-src 'none'`, `base-uri 'none'`, `form-action 'none'`,
  `connect-src 'self'`. Kiểm bằng `tests/csp.js` (25 bước) — sai một hash là CI chặn.
- Bỏ thuộc tính `onerror="…"` còn sót trong thẻ ảnh bìa (CSP nghiêm chặn inline handler);
  thay bằng trình xử lý bắt ở pha capture.
- `_headers`: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`
  (tắt camera/mic/vị trí/thanh toán), `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`.
- `img-src`/`frame-src` chỉ mở đúng `i.ytimg.com` và `youtube-nocookie.com`.

### Hiệu suất
- **Service worker** (`sw.js`, sinh từ `src/sw.template.js`): precache bản chạy, điều hướng
  trả cache trước và cập nhật nền → **lần mở thứ hai 0 yêu cầu mạng, mất mạng vẫn dùng được**.
  Tên cache chứa phiên bản nên mỗi deploy là một cache mới.
- **Giảm 17 → 10 độ đậm font**: Be Vietnam Pro 400·600, JetBrains Mono 400·500, Lora 400·600 + italic —
  bớt 7 tệp font phải tải, chữ vẫn đẹp (trình duyệt tự chọn độ đậm gần nhất).
- Ảnh bìa video `loading="lazy" decoding="async"` — không tải 236 ảnh YouTube cùng lúc.
- `Cache-Control: public, max-age=0, must-revalidate` cho `index.html`: sau khi deploy người dùng
  nhận bản mới ngay nhưng chỉ tốn `304` vài chục byte thay vì tải lại ~1 MB.
- `dns-prefetch` cho `i.ytimg.com`, `theme-color` cho chế độ sáng/tối.

### Cloudflare Pages
- **Pages Function `functions/__version.js`** — `GET /__version` trả `{version, build, at, commit}`,
  có ETag/`304`, trả `405` cho method khác, và vẫn trả lời được khi không đọc nổi `index.html`.
  Đọc phiên bản từ chính `index.html` đã deploy nên không phải sửa số ở hai nơi.
- **`_redirects`**: `/study`, `/cards`, `/timetable`… trả `index.html` (200) — trước đây gõ thẳng
  đường dẫn là 404 vì router dùng hash.
- **`--dist`**: build chỉ xuất `index.html`, `_headers`, `_redirects`, `sw.js` ra `dist/` →
  không đưa `src/`, `tests/`, `docs/` lên web công khai.
- `wrangler.toml` + `npm run deploy`.
- Nút **“Kiểm tra bản mới”** trong `#/about` gọi `/__version`, báo khi có bản mới và hiện
  phiên bản máy chủ. Không có mạng / mở bằng `file://` thì im lặng, không làm phiền.
- Thanh báo **ngoại tuyến** ở đáy trang khi mất mạng.
- Hộp thoại “Đã có bản mới — Nạp lại” khi service worker phát hiện bản mới (không tự reload
  để không mất bài đang làm).

### Kiểm thử
- `tests/csp.js` **25** · `tests/functions.js` **18** · `tests/smoke.js` **51** ·
  `tests/interaction.js` **32** → **126 bước**, `npm test` chạy hết, không cần trình duyệt.
- CI thêm hai bước: kiểm CSP và chạy thử Pages Function.
- Bỏ `pages.yml` của GitHub (không deploy hai nơi nữa).

## [10.1.0] — 2026-11-14

Bản làm sạch và sửa lỗi. Không đổi giao diện, không đổi lược đồ dữ liệu — chỉ làm đúng những gì
trước đây tuyên bố là đã đúng.

### Sửa — dữ liệu người dùng
- **Bản dự phòng localStorage không hề tồn tại.** `write()` ghi đè `vnl9.v2` *rồi* mới đọc lại để
  sao ra `vnl9.b1/b2`, nên cả ba bản luôn giống hệt nhau. Giờ đọc bản cũ **trước** khi ghi và xoay vòng
  `b3 ← b2 ← b1 ← bản cũ`. Kiểm chứng: `tests/interaction.js` → *“3 bản dự phòng khác nội dung nhau”*.
- **`esc()` không thoát dấu nháy.** Tên có `"` (ví dụ `Vật "lí" & <b>`) làm vỡ thuộc tính `value="…"`
  → mở ô thời khoá biểu ra **ô rỗng** và mất dữ liệu khi bấm Lưu. Giờ thoát cả `"` và `'`.
- Chỉnh `.ics`: thoát đủ `\ ; ,` và xuống dòng theo RFC 5545 §3.3.11, **gấp dòng > 75 ký tự** (§3.1)
  để Google/Apple/Outlook nhập được tiêu đề dài.

### Sửa — hộp thoại
- **9 chỗ còn gọi `confirm()` gốc** của trình duyệt (xoá bảng TKB, xoá tiết, xoá bài, xoá tệp, xoá kế hoạch,
  đổi mẫu bài soạn, bốc lại đề, đặt lại toàn bộ) — bị chặn trong iframe/preview và làm treo bộ QA.
  Thay hết bằng `uiConfirm()` mới: hộp thoại nội trang, có `Esc` / `Enter`, nút nguy hiểm tô đỏ.
- **Bẫy phím Tab** cho mọi hộp thoại (`role=dialog|alertdialog`): trước đây Tab chạy ra sau lớp phủ.

### Thêm
- **`#/builder` Mạch lồng nhau** — `src/builder.js` (358 dòng) và toàn bộ CSS `.build-*` đã có trong repo
  nhưng **chưa từng được ghép vào build**, tức là mã chết. Giờ có tuyến riêng: dựng cây nối tiếp /
  song song lồng nhau đến 5 tầng, thêm–bớt–đổi giá trị từng điện trở, máy giải tính R tương đương,
  dòng, điện áp và công suất từng điện trở, hình vẽ tự sinh, 3 mạch mẫu.
- `tests/smoke.js` (**51 bước**) và `tests/interaction.js` (**32 bước**) chạy bằng `jsdom` —
  kiểm thử không cần trình duyệt, chạy được trong CI.
- `tools/check.js` thêm 3 lớp chặn hồi quy: cấm `prompt()/confirm()/alert()` trong `src/`,
  phát hiện mô-đun không được `build.py` ghép (mã chết), và đối chiếu mọi tuyến router ↔ hàm `render*`.
- `uiConfirm()` + `.btn-danger` + `.modal-f` trong CSS.

### Sửa — hạ tầng
- **`src/build.py` đọc CSS từ đường dẫn tuyệt đối `/home/user/src/app.css`** → build **luôn thất bại**
  trên mọi máy khác. Giờ đọc `src/app.css` tương đối. Bản dựng đã khớp byte-for-byte với `index.html`.
- **Workflow CI/Pages nằm trong `vat-li-9-study-os/.github/`** nên GitHub không bao giờ chạy.
  Chuyển ra gốc repo; Pages giờ tự build lại từ `src/` và chỉ deploy `index.html` + `.nojekyll`.
- Gộp cây thư mục: `src/`, `tools/`, `docs/` ở gốc repo là **bản sao y hệt** của `vat-li-9-study-os/`.
  Xoá bản trùng, đưa dự án về một cây duy nhất.
- Xoá `vat-li-9-study-os.zip` (1,1 MB, bản nén lỗi thời của chính repo), `vat_li_9_lop_hoc.html`
  (bản build cũ 976 KB trùng `index.html`), `uploads/` (3 ảnh không được tham chiếu ở đâu),
  `.config/` (rác Crash Reports của Chrome). Tài liệu cũ chuyển vào `docs/archive/`.

### Kiểm thử
- `node tools/check.js` ✓ · `node tests/smoke.js` **51/51** · `node tests/interaction.js` **32/32**.
- 35 tuyến × jsdom: 0 lỗi JS, trang nào cũng vẽ ra nội dung.

## [10.0.0] — 2026-10-21

### Thêm
- **`#/timetable` Thời khoá biểu**: lưới tuần 2→7 (hoặc 2→CN), sáng/chiều, số tiết chỉnh được, nhiều bảng,
  sửa tiết tại chỗ (môn · tiết · GV · màu), **Tự xếp môn** tự động tô 12 màu, **In / lưu PDF** có dòng ký tên.
- **Đưa thời khoá biểu vào lịch tuần này** — tạo việc có giờ thật, chống trùng theo `ngày + giờ + tên + nguồn`.
- **`#/calendar` Lịch** tháng/tuần, màu theo loại việc, tick xong tại chỗ, **xuất `.ics`** cho Google/Apple/Outlook.
- **Lịch trống có lối vào**: dải “Lịch đang trống” + *Việc đầu tiên* / *Lấy từ thời khoá biểu*.
- **`@nggkhaiz`** ở hero, thanh trên, chân trang, `#/about`, bản in, tiêu đề tab + phiên bản `v10.0`.
- **6 theme mới** (ivory · bordeaux · ink · lotus · graphite · ocean) → tổng **13 theme**, 14 lựa chọn màu nhấn.

### Sửa
- `const esc` trong hộp thoại lịch che helper toàn cục → đổi thành `onEsc` (lỗi `TypeError` khi mở việc mới).
- Theme tối làm chữ ở rail lộ trình gần như vô hình → override riêng cho `midnight` / `graphite` / `pixelnight`.
- Ô “Tự xếp môn” chỉ tách dấu phẩy → nhận thêm chấm phẩy, xuống dòng, tự bỏ môn trùng.
- Khoá chống trùng quá thô làm mất tiết khi cùng môn hai tiết/ngày (47 tiết → chỉ 6 việc).
- Khối “Hôm nay có gì” bị ẩn khi lịch trống → luôn hiện, kèm ô “Chưa đặt” dẫn tới lịch.

### Bỏ
- Toàn bộ `prompt()` / `confirm()` — thay bằng hộp thoại nội trang `uiPrompt`, `uiCardForm`.

### Kiểm thử
- `tools/qa/sched.js` **21/21** · `study` 21/21 · `school` 26/26 · `board` 17/17 · `sim` 19/19.
- `audit` **30 tuyến** × desktop + mobile: 0 tràn · 0 lỗi JS. Build **976 KB**.

## [9.0.0] — 2026-10-10

### Thêm — Study OS
- **Học hôm nay**, **thẻ ghi nhớ 7 hộp**, **luyện đề tự tạo**, **kế hoạch tới ngày thi**, **đồng hồ tập trung**,
  **ghi chú + Feynman**, **heatmap 12 tuần**, **chuỗi ngày**, **đọc thành tiếng**, **tiến độ tổng + khuyến nghị**,
  **sao lưu / khôi phục `.json`**.

### Kiểm thử
- `tools/qa/study.js` 21/21 · audit 27 tuyến · build 850 KB.

## [8.0.0] — 2026-09-28

### Thêm
- **Trường học lớp 1 → 12, 13 môn, 48 bài mẫu**; tự tạo bài học, xuất/nhập `.json`.
- **Tải tệp lên** (ảnh, PDF, tài liệu) lưu trong IndexedDB — tối đa 40 MB/tệp.

## [7.17.0] — 2026-09-15

### Thêm
- Động cơ học tập: ôn cách quãng Leitner, phòng thi có lưới nhảy câu và phím tắt, báo cáo theo chủ đề.
- Phòng thí nghiệm 4 bàn (điện · quang · cơ · nhiệt) + sổ ghi chép xuất CSV.
- Bảng lệnh ⌘K quét toàn bộ bài học, công thức, hỏi đáp, đề, câu hỏi.

## [6.0.0] và trước đó

- Lộ trình **52 ca Vật lí 9 → chuyên Lý** (13 ngày × 4 ca), ngân hàng câu hỏi, 12 đề luyện.
- Máy giải mạch điện thêm/bớt R tự do; bảng vẽ kéo–thả; mô phỏng quang – cơ – điện.
- Giao diện editorial nhiều theme, pomodoro đồng hồ cát pixel-art, nhạc theo link người dùng.
