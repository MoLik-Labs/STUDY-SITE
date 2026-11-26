# Upload file lên GitHub bằng trình duyệt

Cách này không cần cài gì, chỉ cần trình duyệt. Phù hợp khi bạn muốn thêm vài file tài liệu, ảnh hoặc sửa nhanh một file văn bản. Không phù hợp để sửa mã nguồn của trang web, vì mã đó cần được dựng và kiểm thử trước khi commit (xem chương 07).

## Khi nào nên dùng cách này

| Tình huống | Có nên dùng web không? |
|---|---|
| Thêm vài file ảnh, PDF, ghi chú | Có |
| Sửa một file `.md` hướng dẫn | Có |
| Sửa `site/src/app.js` hoặc file test | Không. Dùng Git hoặc Codespaces. |
| Upload `node_modules/`, `dist/` hoặc file `.env` | **Không bao giờ** |

## Giới hạn cần nhớ

GitHub giới hạn upload qua trình duyệt ở mức sau, theo tài liệu hiện hành:

- Tối đa **100 file** trong mỗi lần commit.
- Mỗi file tối đa **25 MiB**.

Với file lớn hơn hoặc số lượng nhiều hơn, dùng GitHub Desktop hoặc Git (chương 04 và 05). Các giới hạn có thể thay đổi, nên kiểm tra lại trong tài liệu GitHub nếu cần.

## Các bước upload

1. Mở repo trên [github.com](https://github.com), ví dụ `MoLik-Labs/STUDY-SITE`.
2. Vào đúng thư mục đích. Ví dụ `tutorial/content/` nếu bạn thêm chương mới.
3. Bấm **Add file → Upload files**.
4. Kéo file hoặc thư mục từ máy vào vùng thả file. Hoặc bấm *choose your files* để chọn bằng hộp thoại.
5. Xem lại danh sách đường dẫn. GitHub giữ nguyên cấu trúc thư mục khi bạn kéo cả thư mục.
6. Viết **thông điệp commit** ngắn, rõ, ví dụ `Thêm ảnh minh hoạ cho chương 3`.
7. Chọn một trong hai tuỳ chọn:
   - **Commit directly to the main branch**: ghi thẳng vào `main`. Chỉ dùng khi bạn chắc chắn và đang làm một mình.
   - **Create a new branch for this commit and start a pull request**: tạo nhánh riêng và mở pull request. **Đây là lựa chọn an toàn hơn**, đặc biệt khi làm việc chung.
8. Bấm **Commit changes** hoặc **Propose changes**.

> **Mẹo:** Luôn chọn tuỳ chọn tạo nhánh mới. Nếu có gì sai, người khác có thể xem và góp ý trước khi gộp vào `main`.

## Sửa một file có sẵn trên web

1. Mở file trên GitHub, ví dụ `tutorial/content/00-gioi-thieu.md`.
2. Bấm biểu tượng bút chì (**Edit this file**).
3. Sửa trong trình soạn thảo. Dùng tab **Preview** để xem trước khi markdown được hiển thị đẹp.
4. Kéo xuống dưới, viết thông điệp commit, rồi chọn tuỳ chọn như trên.

Nhấn phím `.` (dấu chấm) khi đang xem repo trên GitHub để mở trình soạn thảo đầy đủ của VS Code ngay trong trình duyệt (vscode.dev). Bạn có thể sửa nhiều file và commit từ đó.

## Kiểm tra sau khi upload

- Mở repo, xem thông điệp commit có xuất hiện ở danh sách file không.
- Nếu là pull request, xem tab **Checks** để biết CI có chạy xong không.
- Kiểm tra đường dẫn file đúng thư mục bạn muốn.

> **Cảnh báo:** Commit đã đẩy lên GitHub không xoá được hoàn toàn khỏi lịch sử. Nếu lỡ upload thứ không nên (mật khẩu, khoá bí mật), đừng chỉ xoá file: làm theo chương 10 để thu hồi khoá trước.

Tiếp theo: [dùng GitHub Desktop để commit và push](04-github-desktop.html).
