# Hướng dẫn làm việc với STUDY-SITE

Đây là hướng dẫn từng bước cho người mới làm việc với dự án: tải mã về máy, upload và push lên GitHub, làm việc theo nhánh và pull request, và chọn cách làm việc phù hợp.

Không cần biết lập trình sâu. Mỗi chương có lệnh cụ thể để gõ, và các bước kiểm tra để biết mình làm đúng.

## Bạn sẽ học được gì

- Hiểu các khái niệm Git và GitHub: repo, commit, nhánh, push, pull request.
- Upload file lên GitHub bằng trình duyệt, không cần lệnh.
- Commit và push bằng GitHub Desktop hoặc dòng lệnh.
- Làm việc đúng quy trình của dự án, và xử lý lỗi thường gặp.
- Chọn cách làm việc hiệu quả nhất cho mình.

## Bắt đầu nhanh

Nếu đã có Git và Node.js, bạn có thể chạy thử ngay:

```bash
git clone https://github.com/MoLik-Labs/STUDY-SITE.git
cd STUDY-SITE
npm ci
npm test
npm run serve
```

Sau đó mở `http://localhost:8124`. Nếu chưa cài Git hay Node.js, bắt đầu từ chương 01.

> **Mẹo:** Đọc chương 00 trước, để hiểu các khái niệm. Mọi chương sau đều dựa vào chúng.

## Quy ước đọc trang

Trong hướng dẫn có các khối được tô màu:

> **Mẹo:** gợi ý giúp làm nhanh hơn.

> **Lưu ý:** điều cần biết để tránh nhầm lẫn.

> **Cảnh báo:** việc có thể làm mất dữ liệu hoặc lộ thông tin nhạy cảm. Đọc kỹ.

Lệnh trong khối mã chạy trong Terminal (macOS, Linux) hoặc Git Bash (Windows).
