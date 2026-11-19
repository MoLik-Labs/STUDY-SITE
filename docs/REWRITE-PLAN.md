# Kế hoạch viết lại: giao diện và backend

Nhánh: `arena/16228fa4-study-site` (PR #10 vào `main`).
Trạng thái: backend đã chuyển sang Firebase. Giao diện và đồng bộ đang ở bước kiểm định cuối.

## Quyết định đã chốt

| Chủ đề | Lựa chọn |
|---|---|
| Cách làm | Viết lại theo giai đoạn; mỗi giai đoạn có test và build xanh |
| Phạm vi | Giữ Vật lí (`/physic/`) và 8 môn, mỗi môn một `/ten_web`. Gộp về 6–8 khu vực |
| Hình ảnh | Không dùng ảnh stock. Dùng giao diện sản phẩm thật (HTML/CSS) |
| Backend | Firebase: Auth (email link, Google) và Firestore. Xem `docs/FIREBASE-SETUP.md` |
| Đăng nhập | Email link và Google. Không SMS (Phone Auth cần gói trả phí), không ẩn danh |
| Hosting | Cloudflare Workers (Static Assets) |
| Supabase | Đã gỡ hoàn toàn khỏi repo. Đã đếm 0 dòng ở `auth.users`, `user_state`, `planner_states`, `profiles`, `lesson_progress`, `notes`, `layouts` (chưa đếm `answers`, `review_cards`) |
| Xoá dữ liệu | Xoá trên máy và trên Firestore, giữ tài khoản. Xoá tài khoản là thao tác riêng, cần đăng nhập gần đây |

## Kiến trúc hiện tại

- Vỏ ứng dụng (router hash, thanh điều hướng) và module tải lười (`import()`). Build tách tệp JS, CSP bằng hash.
- Đồng bộ site: `planners/{uid}` (một tài liệu JSON). Mốc `updatedAt` do máy chủ ghi. Mốc server của lần đồng bộ gần nhất lưu cục bộ (`sf.plan.v2.base`), nên đồng hồ máy lệch không làm mất thay đổi.
- Đồng bộ Vật lí: `users/{uid}/keys/{khoá}`, mỗi khoá một tài liệu, chỉ gửi phần đã đổi. Khoá quá lớn được báo riêng, không chặn các khoá khác.
- Hồ sơ `users/{uid}`: `displayName`, `className` (tên lớp, site), `grade` (khối lớp, Vật lí). Hai bên ghi bằng `merge`.

## Việc còn mở

- Kiểm thử trên Firebase thật (emulator không chạy được trong sandbox): đăng nhập, quy tắc, đồng bộ hai máy.
- Kiểm thử RLS với người dùng thật sau khi triển khai `firestore.rules`.
- Script chuyển dữ liệu từ Supabase: chờ người dùng quyết định (số dòng đã đếm bằng 0).
- Xoá project Supabase trên dashboard: việc của chủ tài khoản, không làm từ repo.
