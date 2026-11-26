# Chuẩn bị máy và tài khoản

Chương này làm đúng một lần: tạo tài khoản GitHub, cài Git, Node.js và một trình soạn thảo. Mất khoảng 30 phút nếu máy chưa có gì.

## 1. Tạo tài khoản GitHub

1. Vào [github.com](https://github.com) và chọn **Sign up**.
2. Chọn tên người dùng ngắn, dễ nhớ. Tên này xuất hiện trong mọi commit của bạn.
3. Bật xác thực hai lớp ở **Settings → Password and authentication**. Đây là bước bảo vệ tài khoản quan trọng nhất.

> **Mẹo:** Trong **Settings → Emails**, bật tuỳ chọn *Keep my email addresses private*. Khi cấu hình Git, dùng địa chỉ dạng `...@users.noreply.github.com` để email thật không lộ trong lịch sử công khai.

## 2. Cài Git

Git là công cụ ghi lại lịch sử thay đổi. Kiểm tra xem máy đã có chưa:

```bash
git --version
```

Nếu hiện một số phiên bản (ví dụ `git version 2.45.0`) thì bạn đã có Git. Nếu chưa, cài theo hệ điều hành:

- **Windows**: tải *Git for Windows* tại [git-scm.com](https://git-scm.com). Giữ tuỳ chọn mặc định khi cài. Sau đó dùng **Git Bash** để gõ lệnh.
- **macOS**: mở Terminal và gõ `xcode-select --install`, hoặc cài từ [git-scm.com](https://git-scm.com).
- **Linux (Ubuntu/Debian)**: `sudo apt install git`.

### Cấu hình Git lần đầu

Git cần biết tên và email để ghi vào mỗi commit. Chạy hai lệnh này một lần, thay bằng thông tin của bạn:

```bash
git config --global user.name "Tên của bạn"
git config --global user.email "ten-nguoi-dung@users.noreply.github.com"
```

Kiểm tra lại:

```bash
git config --global --list
```

## 3. Cài Node.js

Dự án dùng Node.js để dựng trang và chạy kiểm thử. CI của dự án dùng **Node.js 20**; tối thiểu là 18.

1. Vào [nodejs.org](https://nodejs.org) và tải bản **LTS** (hỗ trợ dài hạn).
2. Cài theo hướng dẫn, giữ mặc định.
3. Kiểm tra:

```bash
node -v
npm -v
```

## 4. Cài một trình soạn thảo

**Visual Studio Code** là lựa chọn phổ biến và miễn phí, tải tại [code.visualstudio.com](https://code.visualstudio.com). Sau khi cài, nên thêm tiện ích **GitLens** để xem lịch sử từng dòng code.

Nếu chỉ muốn sửa nhanh, bạn có thể bỏ qua bước này và dùng trình duyệt (xem chương 08).

## 5. Đăng nhập GitHub từ máy bạn

Khi push lần đầu, Git sẽ hỏi xác thực. Cách dễ nhất là dùng **GitHub CLI** (`gh`):

```bash
gh auth login
```

Chọn GitHub.com, HTTPS, rồi đăng nhập bằng trình duyệt. Không cần tự tạo mật khẩu thủ công. Nếu dùng GitHub Desktop (chương 04), ứng dụng tự làm bước này.

> **Cảnh báo:** Không bao giờ dán mật khẩu, token truy cập hay khoá bí mật vào chat, vào file trong repo hay vào commit. Chương 10 nói kỹ hơn.

## 6. Kiểm tra toàn bộ

Chạy lần lượt. Tất cả phải có kết quả:

```bash
git --version
node -v
npm -v
git config --global user.name
gh --version
```

Nếu lệnh nào báo *command not found*, quay lại bước tương ứng ở trên.

Tiếp theo: [tải dự án về máy và chạy thử](02-tai-ve-may.html).
