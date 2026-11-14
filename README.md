<p align="center"><img src="docs/img/fox-mark.svg" width="88" alt="Study Focus Fox"></p>

# Study Focus Fox

*Tập trung sâu · Nhớ lâu hơn* — một tệp HTML duy nhất để học Vật lí 9 và mọi môn:
lộ trình 13 ngày, thẻ ghi nhớ lặp lại cách quãng, sổ điểm đúng quy chế, kế hoạch tuần,
đấu trường pixel và góc công cụ Vật lí. Chạy offline, dữ liệu ở trong máy bạn.

## Mọi thứ về việc học · Vật lí 9 → Chuyên Lý

> Một trang web duy nhất để **học mọi thứ liên quan đến việc học**: lộ trình 52 ca Vật lí 9 và luyện thi chuyên Lý,
> trường học lớp 1–12 đủ 13 môn, **thời khoá biểu — kế hoạch — lịch** chỉn chu, thẻ ghi nhớ, luyện đề, phòng thí nghiệm,
> giải mạch điện, đồng hồ tập trung… Tất cả nằm trong **một tệp `index.html`**, chạy offline, dữ liệu lưu trong máy bạn.

<p>
  <img alt="version" src="https://img.shields.io/badge/version-11.6-bordeaux">
  <img alt="single file" src="https://img.shields.io/badge/build-1%20tệp%20HTML-1f1c17">
  <img alt="offline" src="https://img.shields.io/badge/offline-100%25-4a6b3a">
  <img alt="license" src="https://img.shields.io/badge/license-MIT-8b2e22">
  <img alt="author" src="https://img.shields.io/badge/@its.fox_-owner-c6542d">
</p>

**Tác giả & chủ sở hữu: [`@its.fox_`](https://github.com/MoLik-Labs/STUDY-SITE)** · mã nguồn mở theo giấy phép MIT.

---

## Ảnh chụp

| Học hôm nay | Thời khoá biểu |
|---|---|
| ![Học hôm nay](docs/img/study.png) | ![Thời khoá biểu](docs/img/timetable.png) |

| Lịch tháng | Trang chủ |
|---|---|
| ![Lịch](docs/img/calendar.png) | ![Trang chủ](docs/img/home.png) |

---

## Có gì trong này

### 1. Lộ trình Vật lí 9 · 52 ca · thi chuyên Lý
- 13 ngày × 4 ca, soạn theo hướng **hiểu bản chất → vận dụng → chốt kỹ năng**, ưu tiên cách giảng của thầy Vũ Ngọc Anh.
- Mỗi ca: mục tiêu, công thức, ví dụ có lời giải từng bước, câu hỏi tự kiểm, video đã chọn lọc.
- Máy giải mạch điện (thêm/bớt R tự do), 12 đề luyện, phòng thí nghiệm ảo, ngân hàng câu hỏi.

### 2. Trường học lớp 1 → 12, mọi môn
- **14 lớp · 13 môn · 48 bài mẫu** viết theo chương trình GDPT 2018, có câu hỏi và đáp án.
- Tự tạo bài học, xuất/nhập `.json`, tải tệp lên (ảnh, PDF, tài liệu) — lưu trong IndexedDB, tối đa 40 MB/tệp.

### 3. Study OS — hệ thống dạy bạn học
| Trang | Việc nó làm |
|---|---|
| `#/study` **Học hôm nay** | chào theo giờ, mục tiêu phút, 4–5 việc của ngày, heatmap 12 tuần, KPI thẻ, khối **“Hôm nay có gì” + đếm ngược kỳ thi** |
| `#/cards` **Thẻ ghi nhớ** | lặp lại cách quãng **7 hộp** (10 phút → 1 → 2 → 4 → 8 → 16 → 32 ngày), tự chấm 4 mức, phím 1–4 |
| `#/practice` **Luyện đề tự tạo** | gom câu hỏi mọi lớp/môn, chấm đúng/sai, tạo thẻ từ câu sai |
| `#/plan` **Kế hoạch học** | nhập ngày thi + phút/ngày → chia đều từng ngày tới hạn |
| `#/focus` **Đồng hồ tập trung** | 15/25/45/50 phút, chạy tiếp khi đổi trang, nhật ký + chuông |
| `#/progress` **Tiến độ tổng** | 5 KPI, gợi ý việc nên làm, độ chính xác theo môn, in báo cáo |

### 4. Thời khoá biểu · Kế hoạch · Lịch  *(v10)*
- **`#/timetable`** — lưới tuần 2→7, chia sáng/chiều, chỉnh số tiết; bấm ô để thêm môn · tiết · GV · màu tại chỗ;
  nhiều bảng (chính khoá / ôn thi / lịch hè); **Tự xếp môn** nhận cả dấu phẩy, chấm phẩy và xuống dòng;
  **In / lưu PDF** có dòng ký tên `@its.fox_`.
- **Đưa vào lịch tuần này** — biến từng tiết thành việc có giờ thật (sáng 07:00–11:05, chiều 13:30–17:40), chống trùng.
- **`#/calendar`** — tháng & tuần, ô ngày 104px, màu theo loại (thi / deadline / buổi học / khác), tick xong tại chỗ,
  **xuất `.ics`** để nhập vào Google · Apple · Outlook Calendar.
- **`#/study`** — khối “Hôm nay có gì” + ô đếm ngược ngày tới kỳ thi gần nhất.

### 5. Phòng thí nghiệm & công cụ
- Vẽ mạch bằng **kéo–thả icon** xuống sân, sửa tại chỗ, nhập công thức là ra hình; đủ loại nguồn điện.
- **`#/builder` Mạch lồng nhau** — dựng cây nối tiếp / song song đến 5 tầng, thêm–bớt điện trở tuỳ ý,
  máy giải ra R tương đương, dòng – áp – công suất từng điện trở và hình vẽ tự sinh.
- Thí nghiệm ánh sáng – thấu kính, động năng, con lắc; đồ thị tự căn lại sau khi vẽ.
- Máy tính khoa học, bảng tuần hoàn, công thức, tra cứu, nghe nhạc (theo link của bạn), pomodoro đồng hồ cát pixel-art.

### 6. Giao diện
- **13 theme** basic – sang trọng: `paper` (mặc định, editorial), `midnight`, `moss`, `slate`, `amber`, `pixel`, `pixelnight`, `ivory`, `bordeaux`, `ink`, `lotus`, `graphite`, `ocean`… mỗi theme có **14 màu nhấn**.
- Chữ Việt, in ấn sạch (ẩn thanh điều hướng), phím tắt ⌘K, chạy tốt trên điện thoại 390px.
- **`@its.fox_`** có mặt ở: hero trang chủ, thanh trên, chân trang, `#/about`, bản in, tiêu đề tab, `<meta>`.

---

## Bắt đầu

### Chỉ để học
Mở `index.html` bằng trình duyệt. Không cần mạng, không cần cài gì, không cần tài khoản.

### Dựng lại từ mã nguồn
```bash
python3 src/build.py      # ghép src/* → index.html        (npm run build)
node tools/check.js       # kiểm tra tĩnh                 (npm run check)
npm install --no-save jsdom
node tests/smoke.js       # 51 bước: mọi tuyến + API lõi
node tests/interaction.js # 32 bước: luồng thật trong DOM
npm test                  # chạy tất cả ở trên
python3 -m http.server 8124   # mở http://localhost:8124
```
Chỉ cần **Python 3** để build. `tools/check.js` chạy với **Node 18+** và không cần gì thêm;
hai bộ test trong `tests/` cần `jsdom` (`npm install --no-save jsdom`).

### Đưa lên Cloudflare (khuyên dùng)

**Cloudflare Workers Static Assets** — băng thông tĩnh **miễn phí không giới hạn**, Brotli tự
động, HTTPS tự động, và Cloudflare có máy chủ **ngay ở Việt Nam** (Hà Nội · Đà Nẵng · TP.HCM).
Đây cũng là nơi Cloudflare đang phát triển tính năng mới; Pages chỉ còn được duy trì.

**Cách 1 — nối repo (tự deploy mỗi lần push):**

1. **Cloudflare Dashboard → Workers & Pages → Create → Workers → Connect to Git**, chọn repo này.
2. Điền:

   | Ô | Giá trị |
   |---|---|
   | Build command | `python3 src/build.py --dist` |
   | Deploy command | `npx wrangler deploy` |

3. **Save and Deploy.** `wrangler.jsonc` đã khai đủ mọi thứ, không phải điền tay.

**Cách 2 — từ máy:**

```bash
npm run deploy      # build + wrangler deploy
npm run preview     # chạy thử bằng workerd, không cần tài khoản
```

Bản deploy chỉ có **5 tệp được phục vụ**: `index.html`, `404.html`, `sw.js`, `_headers`,
`_redirects`. Mã Worker (`dist/_worker.mjs`) bị `.assetsignore` loại khỏi assets nên **không**
lộ ra ngoài; `src/`, `tests/`, `docs/` không bao giờ nằm trong `dist/`.

Luồng học bình thường **không tốn một request động nào** — tài nguyên tĩnh được Cloudflare
phục vụ trước khi Worker chạy (`run_worker_first` không bật), nên hạn mức 100.000 request/ngày
của gói Free gần như không bao giờ bị chạm.

**Chi tiết đầy đủ:** [`docs/CLOUDFLARE.md`](docs/CLOUDFLARE.md) — vì sao Workers mà không phải
Pages, so sánh với Vercel/Netlify/GitHub Pages, giới hạn thật của Cloudflare, và những lỗi đã
phát hiện khi chạy thử bằng `wrangler dev`.

### Đưa lên GitHub Pages (vẫn dùng được)

Trang là tệp tĩnh nên GitHub Pages cũng chạy: **Settings → Pages → Source: Deploy from a branch**,
chọn nhánh `main` và thư mục `/` (tệp `index.html` ở gốc repo). Khác biệt so với Cloudflare:
không có `_headers` (nên không có header bảo mật và cache tuỳ chỉnh) và không có Pages Functions
(nên nút “Kiểm tra bản mới” sẽ báo không kiểm tra được).

> Workflow `pages.yml` của GitHub đã được bỏ để không deploy hai nơi. Nếu muốn quay lại GitHub Pages,
> chỉ cần bật lại trong Settings — `index.html` ở gốc repo luôn là bản dựng mới nhất.

## Cấu trúc

```
.
├── index.html              # BẢN CHẠY — một tệp, ~985 KB, mở là dùng
├── _headers                # Cloudflare — sinh tự động, đừng sửa tay
├── _redirects              # Cloudflare — sinh tự động, đừng sửa tay
├── wrangler.jsonc          # cấu hình Workers Static Assets (main, assets, binding)
├── src/
│   ├── build.py            # ghép mọi mô-đun + sinh CSP hash + _headers/_redirects/sw.js
│   ├── base.html           # khung HTML gốc + dữ liệu lộ trình 52 ca
│   ├── app.js              # router, trang chủ, đọc bài, tìm kiếm ⌘K
│   ├── app.css             # toàn bộ giao diện + 13 theme
│   ├── cloudflare.js       # service worker, trạng thái ngoại tuyến
│   ├── brand.js            # Study Focus Fox: tên, dấu hiệu pixel 16x16, tiêu đề tab
│   ├── i18n.js             # song ngữ vi + en, cùng một bản dựng
│   ├── game.js             # Đấu trường Pixel: sinh câu vô hạn, 4 môn
│   ├── special.js          # Góc Vật lí: đọc đề, hằng số, thang công thức
│   ├── share.js            # thiệp tiến độ 1200x630 + chia sẻ bài học (link, QR tự viết, tệp .html)
│   ├── grades.js           # sổ điểm THCS/THPT: hệ số, xếp loại, what-if, đếm ngược
│   ├── weekly.js           # kế hoạch tuần: dự án → việc → việc con, rải theo độ khó
│   ├── sw.template.js      # mẫu service worker (chép vào dist/ khi build)
│   ├── worker.template.js  # Worker: GET /__version + trang 404 (→ dist/_worker.mjs)
│   ├── store.js            # lưu bền 4 tầng: localStorage · IndexedDB · cookie · tệp
│   ├── schedule.js         # thời khoá biểu · lịch · .ics · about
│   ├── study.js            # Study OS: thẻ, luyện đề, kế hoạch, tiến độ, hộp thoại
│   ├── school.js           # trường học lớp 1–12
│   ├── solver*.js          # máy giải mạch điện
│   ├── builder.js          # mạch lồng nhau tuỳ ý  →  #/builder
│   ├── lab.js / sim.js / board.js   # phòng thí nghiệm, mô phỏng, bảng vẽ
│   ├── settings.js         # theme + màu nhấn
│   └── …                   # nội dung, công cụ, nhạc, pomodoro, giáo viên
├── tests/
│   ├── csp.js              # 25 bước: hash CSP, _headers, _redirects, sw.js
│   ├── functions.js        # 18 bước: chạy thật Pages Function /__version
│   ├── smoke.js            # 51 bước: nạp trang, 35 tuyến, API lõi, không lỗi JS
│   └── interaction.js      # 32 bước: dữ liệu, hộp thoại, sao lưu, .ics, luồng học
├── tools/
│   ├── check.js            # kiểm tra tĩnh (CI dùng cái này)
│   ├── authoring/          # script sinh nội dung (cần mạng), không tham gia build
│   └── qa/                 # bộ test cũ chạy trong trình duyệt thật
├── docs/
│   ├── CLOUDFLARE.md       # triển khai, bảo mật, hiệu suất, giới hạn
│   ├── HANDOFF.md          # bàn giao kỹ thuật: schema, route, bài học
│   ├── SPRINT-LOG.md       # nhật ký các sprint
│   ├── archive/            # bản kế hoạch HTML gốc + nhật ký sprint 3–5
│   └── img/                # ảnh chụp cho README
└── .github/workflows/      # check.yml (CI chặn merge)
```

## Dữ liệu của bạn

| Khoá | Nội dung |
|---|---|
| `vnl9.v2` | toàn bộ trạng thái: tiến độ, ghi chú, thẻ, kế hoạch, `sched` (thời khoá biểu + lịch) |
| `vnl9.prefs` | theme, màu nhấn, cỡ chữ, nhạc |
| `vnl9.b1`, `vnl9.b2`, `vnl9.b3` | ba bản sao dự phòng luân phiên (khác thời điểm) |
| IndexedDB | tệp bạn tải lên |

- Không có máy chủ, **không gửi dữ liệu đi đâu**. Xoá dữ liệu trình duyệt là mất — hãy dùng **Sao lưu** trong `#/study` hoặc `#/progress` để xuất `.json`.
- Đổi máy: xuất bản sao lưu → nhập lại ở máy mới.
- Lịch: **Xuất .ics** để mang sang Google/Apple Calendar.

---

## Kiểm thử

`npm test` chạy toàn bộ — **377 bước**, không cần trình duyệt.

| Bộ | Cách chạy | Phạm vi | Kết quả |
|---|---|---|---|
| `tools/check.js` | `npm run check` | cú pháp JS, cân bằng CSS, cấm `prompt/confirm/alert`, mã chết, router ↔ hàm render | ✓ |
| `tests/csp.js` | `node tests/csp.js` | **hash CSP khớp từng khối script/style**, không `unsafe-inline` cho script, `_headers`, `_redirects`, `sw.js`, `404.html`, `.assetsignore` | **28/28** |
| `tests/functions.js` | `node tests/functions.js` | chạy thật `dist/_worker.mjs`: JSON, ETag, 304, 405, chịu lỗi; `wrangler.jsonc` khớp `dist/` | **20/20 + 6** |
| `tests/worker.js` | `node tests/worker.js` | mô phỏng **thứ tự phục vụ của Workers**: tĩnh miễn phí, `_redirects` 200, 404 riêng, không lộ mã nguồn | **32/32** |
| `tests/smoke.js` | `node tests/smoke.js` | 38 tuyến × jsdom, dữ liệu lõi, `esc/import/uid` | **54/54** |
| `tests/newfeat.js` | `node tests/newfeat.js` | **công thức sổ điểm** (hệ số 1/1/2/3, cả năm, xếp loại, what-if) + **bảng tuần** (kéo việc, copy/paste plan, chốt tuần, rải cân theo sức) | **61/61** |
| `tests/v112.js` | `node tests/v112.js` | **i18n đủ vi+en**, dấu hiệu đối xứng, **120 câu sinh cho mỗi môn đều có đáp án**, đọc đơn vị (kΩ, mA, km), **QR giải được ở cả 10 phiên bản**, thiệp không lộ tên | **88/88** |
| `tests/interaction.js` | `node tests/interaction.js` | tên có dấu nháy, `uiConfirm`, xoay vòng sao lưu, `.ics`, thẻ → kế hoạch → thi thử, theme, bẫy Tab | **32/32** |
| `tools/qa/*.js` | `playwright-cli` (trình duyệt thật) | giao diện: thời khoá biểu, Study OS, trường học, bảng vẽ, mô phỏng, quét 30 tuyến | 21/21 · 21/21 · 26/26 · 17/17 · 19/19 · audit |

`tests/` cần `jsdom` (`npm install --no-save jsdom`); riêng `tests/csp.js`, `tests/functions.js`,
`tests/worker.js` chạy được **không cần cài gì**. `tools/qa/` cần trình duyệt thật — xem `docs/HANDOFF.md §7`.

## Lộ trình tiếp theo

- [ ] Xuất thời khoá biểu ra **ảnh PNG** để dán vào group lớp.
- [ ] **Sinh lịch ôn ngược từ ngày thi** (đổ vào `#/plan` và `#/calendar`).
- [ ] Nhắc việc theo giờ trên dashboard + badge số việc hôm nay ở thanh trên.
- [ ] Đồng bộ 2 chiều với Google Calendar (hiện đã có một chiều qua `.ics`).
- [ ] Chế độ giáo viên: giao bài, xem tiến độ học sinh qua mã chia sẻ.

---

## Giấy phép & ghi công

MIT © 2026 **[@its.fox_](https://github.com/MoLik-Labs/STUDY-SITE)**.

Nội dung, mã nguồn và thiết kế thuộc về tác giả. Nếu dùng lại, vui lòng **giữ nguyên dòng ghi công `@its.fox_`** trong giao diện và trong README này.
Ý tưởng giảng dạy tham khảo hướng tiếp cận của thầy Vũ Ngọc Anh; video thuộc về các kênh gốc trên YouTube.
