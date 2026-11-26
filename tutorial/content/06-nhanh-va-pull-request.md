# Làm việc theo nhánh và pull request

Đây là cách làm việc chuyên nghiệp nhất để không làm hỏng bản chính. Mỗi việc mới nằm trên một nhánh riêng. Khi xong, bạn mở một **pull request** (PR) để người khác xem và gộp vào `main`.

## Vì sao không sửa thẳng trên main?

- Nếu có lỗi, bản chính đang chạy đã bị ảnh hưởng.
- Người khác không kịp xem và góp ý trước khi thay đổi có hiệu lực.
- Khó quay lại trạng thái trước khi có vấn đề.

Nhánh giải quyết cả ba: thay đổi nằm riêng, được xem xét, và có thể bỏ đi mà không ảnh hưởng gì.

## Quy tắc đặt tên nhánh

Dùng tiền tố ngắn gọn cho biết loại việc, theo sau là mô tả bằng chữ thường, nối bằng dấu gạch ngang:

- `feature/ten-tinh-nang`: tính năng mới, ví dụ `feature/thong-ke-tuan`
- `fix/ten-loi`: sửa lỗi, ví dụ `fix/lech-ngay-lich`
- `docs/ten-tai-lieu`: tài liệu, ví dụ `docs/huong-dan-upload`

## Quy trình đầy đủ bằng dòng lệnh

```bash
# 1. Đảm bảo main đã mới nhất
git switch main
git pull

# 2. Tạo nhánh mới cho việc này
git switch -c docs/huong-dan-upload

# 3. Làm việc, commit như chương 05
git add tutorial/content/03-upload-tren-web.md
git commit -m "Thêm ví dụ upload nhiều file"

# 4. Đẩy nhánh lên GitHub lần đầu (-u để lần sau chỉ cần git push)
git push -u origin docs/huong-dan-upload

# 5. Mở pull request (cần GitHub CLI, xem chương 01)
gh pr create --title "Thêm ví dụ upload nhiều file" --body "Bổ sung hướng dẫn upload nhiều file lên GitHub."
```

Sau lệnh cuối, GitHub CLI in ra đường dẫn PR. Mở đường dẫn đó để theo dõi.

## Quy trình bằng giao diện

1. Trong GitHub Desktop, chọn **Current branch → New branch**, đặt tên, bấm **Create branch**.
2. Làm việc và commit như bình thường.
3. Bấm **Push origin**, rồi **Create Pull Request**.

Trên trang GitHub của repo, bạn cũng có thể vào tab **Branches** để xem tất cả nhánh đang có.

## Xem xét một pull request

Một PR hiển thị bốn phần hữu ích:

- **Conversation**: mô tả và thảo luận.
- **Files changed**: từng dòng thay đổi. Bấm vào số dòng để để lại nhận xét.
- **Commits**: danh sách commit trong PR.
- **Checks**: kết quả CI tự động (kiểm thử, dựng `dist/`, kiểm tra cấu hình).

Khi PR có màu xanh ở tất cả các Checks và đã được duyệt, chủ dự án gộp PR. Trên dòng lệnh, chủ dự án dùng:

```bash
gh pr merge 12 --merge
```

Số `12` là số PR. Đây là lệnh của người có quyền gộp, bạn chỉ cần biết để hiểu quy trình.

## Cập nhật PR khi có góp ý

Sửa trên cùng nhánh rồi push. PR tự cập nhật, không cần mở PR mới:

```bash
git add tên-file
git commit -m "Sửa theo góp ý: làm rõ bước 3"
git push
```

## Dọn dẹp sau khi gộp

Sau khi PR đã gộp, xoá nhánh cũ để danh sách gọn:

```bash
git switch main
git pull
git branch -d docs/huong-dan-upload
```

Xoá nhánh trên GitHub thường được thực hiện bằng nút **Delete branch** hiện ngay sau khi gộp.

> **Mẹo:** Giữ nhánh ngắn. Một nhánh chỉ nên làm một việc và sống vài ngày. Nhánh sống lâu dễ xung đột với `main` và khó xem lại.

Tiếp theo: [quy trình riêng của dự án STUDY-SITE](07-quy-trinh-du-an.html).
