# Changelog

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/), phiên bản theo [SemVer](https://semver.org/lang/vi/).
Mọi thay đổi lớn đều có kiểm thử trong `tools/qa/`.

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
