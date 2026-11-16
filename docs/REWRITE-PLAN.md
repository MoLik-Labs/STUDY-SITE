# Kế hoạch viết lại: giao diện và backend

Nhánh: `arena/d12df461-study-site` (từ `main` @ `eb9d7e8`).
Trạng thái: **giai đoạn 1 xong (backend), giai đoạn 2–5 chưa bắt đầu.**

## Quyết định đã chốt (từ hỏi đáp)

| Chủ đề | Lựa chọn |
|---|---|
| Cách làm | Viết lại theo giai đoạn trên nhánh này; mỗi giai đoạn có test và build xanh |
| Phạm vi | Viết lại **toàn bộ UI/UX**; giữ toàn bộ tính năng và nội dung bài giảng; gộp về 6–8 khu vực |
| Hình ảnh | Không dùng ảnh stock (sandbox không truy cập được kho ảnh). Dùng giao diện sản phẩm thật (HTML/CSS) làm hình minh hoạ |
| Backend | Bảng riêng theo nghiệp vụ, mỗi bảng có RLS. Không dùng key-value nữa |
| Dữ liệu cũ | Bảng `user_state` và `profiles` chưa có dòng dữ liệu nào và chưa có tài khoản auth nào, nên không cần chuyển dữ liệu |
| Migration `allow_null_state_value` | Giữ |
| Xoá dữ liệu | "Xoá toàn bộ dữ liệu" xoá cả trên máy lẫn trên Supabase |
| Supabase | Project `study-focus-fox`, ref `ljsmiazfmmdxoprjggke`, region `ap-southeast-1` |

## Giai đoạn 1 — Backend (xong)

- Migration `normalized_study_tables` đã áp dụng lên Supabase, và bản SQL nằm ở
  `supabase/migrations/20261116150000_normalized_study_tables.sql`.
- Bảng mới: `lesson_progress`, `answers`, `notes`, `review_cards`, `layouts`. Thêm cột `class_name` vào `profiles`.
- Cả 7 bảng `public` đều bật RLS. Mỗi bảng mới có 4 chính sách (select/insert/update/delete) cho `authenticated`, với điều kiện `auth.uid() = user_id`.
- `anon` bị thu hồi mọi quyền trên các bảng mới.
- `updated_at` do trigger đặt phía máy chủ.
- Chưa kiểm thử hành vi RLS với một người dùng đã đăng nhập thật. Mới kiểm tra cấu trúc.

## Giai đoạn 2 — Hệ thống thiết kế và vỏ ứng dụng

- Tokens theo phong cách editorial, gọn kiểu công cụ (`tool_editorial`), áp dụng nguyên tắc của taste-skill:
  một hệ thống nút, một kiểu thẻ, một thang bán kính, một bộ chữ.
- Vỏ ứng dụng: router hash, thanh điều hướng 6–8 khu vực, trang chủ có bố cục cá nhân hoá.
- Module tải lười (`import()`); build tách thành nhiều tệp JS, vẫn giữ CSP bằng hash.

## Giai đoạn 3 — Chuyển module theo khu vực

Mỗi khu vực được viết lại và có test riêng. Trang cũ chuyển hướng sang khu mới và giữ dữ liệu của người dùng.

## Giai đoạn 4 — Đồng bộ mới và xoá dữ liệu

- `src/account.js` đổi từ `user_state` sang các bảng mới. Có xoá `user_state` sau khi client mới chạy ổn.
- Xoá toàn bộ dữ liệu: xoá cục bộ và xoá các hàng trên Supabase.

## Giai đoạn 5 — Kiểm định cuối

- `npm test`, kiểm thử trình duyệt thật (`tools/browser/audit.py`) ở 1440 và 390 px.
- Lighthouse ≥ 90 trên mobile và desktop (đo qua máy chủ có nén gzip).
- Bump phiên bản, CHANGELOG, trang quyền riêng tư.

## Việc còn mở

- Thiết kế lại giao diện và chuyển module: chưa bắt đầu.
- Kiểm thử RLS với người dùng thật.
- Quyết định khi xoá `user_state`: lên lịch sau khi client mới đã triển khai.
