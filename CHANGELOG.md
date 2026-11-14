# Changelog

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/), phiên bản theo [SemVer](https://semver.org/lang/vi/).
Mọi thay đổi lớn đều có kiểm thử: `node tools/check.js`, `node tests/smoke.js`, `node tests/interaction.js`.

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
