# Tải dự án về máy và chạy thử

Sau chương này bạn có một bản sao đầy đủ của dự án trên máy, chạy được trang web và kiểm thử. Đây là điểm xuất phát cho mọi việc sửa đổi.

> **Lưu ý:** Bạn cần quyền truy cập repo `MoLik-Labs/STUDY-SITE`. Nếu chưa có, nhờ chủ dự án thêm bạn vào repo trước.

## 1. Clone repo

**Clone** là tải toàn bộ repo, kèm lịch sử, về máy. Mở Terminal (macOS/Linux) hoặc Git Bash (Windows) rồi gõ:

```bash
cd ~/Documents
git clone https://github.com/MoLik-Labs/STUDY-SITE.git
cd STUDY-SITE
```

Lệnh `cd ~/Documents` chọn thư mục để lưu dự án. Đổi sang thư mục bạn muốn. Lệnh cuối `cd STUDY-SITE` đi vào thư mục vừa tải.

Kiểm tra bạn đang ở đúng nhánh:

```bash
git status
git branch --show-current
```

Lệnh thứ hai in ra tên nhánh hiện tại. Với bản làm việc, bạn sẽ thấy nhánh khác `main` (xem chương 06 về nhánh).

## 2. Cài thư viện

```bash
npm ci
```

Lệnh này đọc `package-lock.json` và cài đúng phiên bản thư viện đã khoá. Lần đầu mất vài phút. Dùng `npm ci` thay vì `npm install` để kết quả giống nhau trên mọi máy.

Sau khi cài xong, `npm` tự chạy bước dựng `dist/` (xem chương 07).

## 3. Chạy kiểm thử

```bash
npm test
```

Nếu mọi thứ đều ổn, cuối màn hình có dòng báo `pass` với số lượng bài kiểm thử, và `fail 0`. Nếu có `fail`, đừng bỏ qua: đọc chương 09 về lỗi thường gặp.

## 4. Chạy trang web trên máy

```bash
npm run serve
```

Mở trình duyệt, vào địa chỉ:

```
http://localhost:8124
```

Bạn sẽ thấy trang lịch tuần. Thử các trang khác: `/kinh-te-luong/`, `/physic/`, `/tai-khoan/`.

Để dừng máy chủ, nhấn `Ctrl + C` trong cửa sổ Terminal.

> **Mẹo:** Máy chủ thử chỉ phục vụ những gì đã được dựng vào `dist/`. Sau khi sửa mã trong `site/`, hãy chạy `npm run build` rồi tải lại trang.

## 5. Các lệnh bạn sẽ dùng hằng ngày

| Lệnh | Khi nào dùng | Làm gì |
|---|---|---|
| `npm run build` | Sau mỗi lần sửa `site/` | Dựng lại `dist/` |
| `npm test` | Trước khi commit | Chạy toàn bộ kiểm thử |
| `npm run serve` | Khi muốn xem trang | Máy chủ thử tại cổng 8124 |
| `npm run deploy` | Chỉ người có quyền Cloudflare | Đưa bản mới lên mạng |

Web hướng dẫn này nằm tại `/huong-dan/` trên trang đã dựng. Sau khi sửa nội dung trong `tutorial/content/`, chạy `npm run build` rồi `npm run serve` và mở `http://localhost:8124/huong-dan/`.

## 6. Khi gặp lỗi

- **`command not found: npm`**: Node.js chưa cài đúng. Quay lại chương 01.
- **`EADDRINUSE` hoặc cổng 8124 đã bận**: một máy chủ khác đang chạy. Đóng cửa sổ đó hoặc đổi cổng trong lệnh `serve`.
- **Trang trắng hoặc thiếu nội dung**: chạy `npm run build` rồi tải lại trang.

Tiếp theo: [upload file lên GitHub bằng trình duyệt](03-upload-tren-web.html).
