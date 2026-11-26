# Commit và push bằng GitHub Desktop

GitHub Desktop là ứng dụng miễn phí có giao diện đồ hoạ cho Git. Bạn không cần gõ lệnh, nhưng vẫn có đầy đủ tính năng: xem thay đổi, commit, push, pull, tạo nhánh và mở pull request. Đây là cách đơn giản nhất cho người mới mà vẫn chuyên nghiệp.

## 1. Cài đặt và đăng nhập

1. Tải tại [desktop.github.com](https://desktop.github.com) và cài.
2. Mở ứng dụng, chọn **Sign in to GitHub.com**. Đăng nhập bằng trình duyệt.
3. Khi được hỏi cấu hình Git, điền tên và email giống chương 01.

## 2. Tải repo về máy

1. Chọn **File → Clone repository**.
2. Chọn tab **GitHub.com**, tìm `MoLik-Labs/STUDY-SITE`.
3. Chọn thư mục lưu, rồi bấm **Clone**.

Sau khi xong, ứng dụng mở repo. Bạn sẽ thấy tên nhánh hiện tại ở trên cùng.

## 3. Hiểu các vùng trong giao diện

- **Changes** (bên trái): danh sách file đã thay đổi kể từ commit cuối. Tích vào ô để chọn file muốn đưa vào commit.
- **History** (bên trái, tab khác): lịch sử các commit.
- **Diff** (bên phải): so sánh từng dòng. Màu xanh là thêm, màu đỏ là xoá.
- **Khung Summary** (góc dưới trái): tiêu đề commit. Phần **Description** là mô tả chi tiết, không bắt buộc.

## 4. Vòng làm việc đầy đủ

1. **Pull trước khi bắt đầu.** Bấm **Fetch origin**, rồi **Pull origin** nếu có thay đổi mới. Làm bước này để không sửa trên bản cũ.
2. **Sửa file** bằng VS Code hoặc trình soạn thảo bất kỳ. GitHub Desktop tự nhận ra thay đổi.
3. **Xem lại** từng thay đổi trong **Diff**. Đây là bước quan trọng nhất, và nhiều lỗi được phát hiện ở đây.
4. **Viết thông điệp commit** ở khung Summary, ví dụ `Sửa lỗi hiển thị ngày trong lịch tuần`.
5. Bấm **Commit to main** (hoặc tên nhánh bạn đang dùng).
6. Bấm **Push origin** để đưa lên GitHub.

::: tip Mẹo
Không nên làm việc trực tiếp trên `main`. Xem chương 06 để biết cách tạo nhánh riêng trong GitHub Desktop bằng **Current branch → New branch**.
:::

## 5. Tạo pull request từ GitHub Desktop

Sau khi push một nhánh riêng:

1. Bấm **Create Pull Request**. Ứng dụng mở trình duyệt đúng trang tạo PR.
2. Kiểm tra tiêu đề và mô tả, rồi bấm **Create pull request**.
3. Chờ CI chạy xong (tab **Checks**). Nếu đỏ, xem lỗi và sửa.
4. Khi đã được duyệt và xanh hết, chủ dự án gộp PR vào `main`.

## 6. Các lỗi thường gặp

- **"Push rejected" hoặc "fetch first"**: có người khác đã đẩy lên trước. Bấm **Pull origin**, xử lý xung đột nếu có (xem chương 09), rồi push lại.
- **File không hiện trong Changes**: file có thể nằm trong `.gitignore`. Ví dụ `node_modules/` là cố ý bị bỏ qua.
- **Commit nhầm file**: chưa push thì chọn commit gần nhất, bấm chuột phải vào file và **Uncommit**.

::: warning Cảnh báo
Chỉ bấm *Discard changes* khi thật chắc chắn. Thao tác này xoá vĩnh viễn thay đổi chưa commit.
:::

Tiếp theo: [làm việc với dòng lệnh Git](05-git-dong-lenh.md).
