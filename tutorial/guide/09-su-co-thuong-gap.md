# Xử lý sự cố thường gặp

Mỗi mục dưới đây có **triệu chứng**, **nguyên nhân** và **cách sửa an toàn**. Đọc hết phần triệu chứng trước khi làm theo, để chắc đúng vấn đề của bạn.

## Push bị từ chối: "rejected" hoặc "fetch first"

**Triệu chứng:** `git push` báo *rejected (fetch first)* hoặc *non-fast-forward*.

**Nguyên nhân:** Trên GitHub đã có commit mà máy bạn chưa có. Thường là người khác vừa push lên cùng nhánh, hoặc bạn đã làm việc trên máy khác.

**Cách sửa:**

```bash
git pull --rebase
git push
```

`--rebase` đặt commit của bạn lên trên commit mới nhất, giữ lịch sử thẳng. Nếu có xung đột, Git dừng lại và báo file cần sửa. Xem mục tiếp theo.

## Xung đột (conflict)

**Triệu chứng:** Git báo *CONFLICT* và file có các dấu `<<<<<<<`, `=======`, `>>>>>>>`.

**Nguyên nhân:** Cùng một đoạn văn bản bị sửa ở cả hai phía, Git không tự quyết được giữ bản nào.

**Cách sửa:**

1. Mở file. Đoạn giữa `<<<<<<<` và `=======` là bản của bạn. Đoạn giữa `=======` và `>>>>>>>` là bản trên GitHub.
2. Chọn giữ một bản, hoặc viết lại đoạn cho đúng. Xoá cả ba dấu.
3. Lưu file, rồi:

```bash
git add tên-file
git rebase --continue
```

Nếu đang trong `git pull` thông thường (không rebase), thay bước cuối bằng `git commit`.

::: tip Mẹo
Trong VS Code, khi có xung đột sẽ có nút **Accept Current / Incoming / Both**. Dùng nó để tránh sai sót khi sửa tay.
:::

Muốn huỷ hẳn lần rebase và quay lại trạng thái trước đó: `git rebase --abort`.

## CI đỏ ở bước "Bản dist/ phải khớp"

**Triệu chứng:** PR có bước *Bản dist/ phải khớp với bản đã commit* màu đỏ.

**Nguyên nhân:** Bạn sửa mã trong `site/` nhưng không dựng lại `dist/` trước khi commit.

**Cách sửa:**

```bash
npm run build
git add dist/
git commit -m "Dựng lại dist sau khi sửa"
git push
```

## CI đỏ ở bước kiểm thử

**Triệu chứng:** Bước *Kiểm thử* đỏ, báo `fail` với tên bài kiểm thử.

**Cách sửa:**

1. Chạy `npm test` trên máy, đọc lỗi đầu tiên. Lỗi đầu thường gây ra các lỗi sau.
2. Xem bài kiểm thử đó đang kiểm tra điều gì. Có khi là mã sai, có khi là kỳ vọng đã cũ.
3. Sửa, rồi chạy lại `npm test` đến khi `fail 0`.

Đừng xoá hoặc bỏ qua bài kiểm thử chỉ để CI xanh. Nếu thật sự cần thay đổi kỳ vọng, nói rõ lý do trong mô tả PR.

## `npm ci` báo lỗi về lockfile

**Triệu chứng:** `npm ci` từ chối chạy, nói *package-lock.json not found* hoặc *out of sync*.

**Nguyên nhân:** `package.json` đã đổi nhưng `package-lock.json` chưa cập nhật, hoặc lockfile bị thiếu.

**Cách sửa:** Không tự sửa lockfile bằng tay. Nếu bạn vừa thêm thư viện bằng `npm install`, commit cả `package.json` và `package-lock.json`. Nếu lỗi xuất hiện sau khi `git pull`, hãy báo chủ dự án.

## Cổng 8124 đã bị chiếm

**Triệu chứng:** `npm run serve` báo `EADDRINUSE`.

**Cách sửa:** Một máy chủ khác đang chạy. Tìm và dừng nó:

- macOS/Linux: `lsof -i :8124`, rồi `kill <số PID>`.
- Windows: `netstat -ano | findstr :8124`, rồi `taskkill /PID <số PID> /F`.

## Thay đổi ở khắp nơi (CRLF / LF)

**Triệu chứng:** Git báo *LF will be replaced by CRLF* hoặc diff đổi toàn bộ dòng dù chỉ sửa một chữ.

**Nguyên nhân:** Windows và macOS/Linux dùng kiểu xuống dòng khác nhau.

**Cách sửa:** Cài Git với tuỳ chọn mặc định, hoặc đặt:

```bash
git config --global core.autocrlf true
```

trên Windows. Đừng commit một loạt file chỉ vì đổi kiểu xuống dòng; nếu đã làm, hỏi chủ dự án trước khi tiếp tục.

## Lỡ commit file bí mật

**Triệu chứng:** Bạn vừa commit một file có mật khẩu hoặc khoá JSON, chưa push hoặc đã push.

**Cách sửa:**

- **Chưa push:** `git reset --soft HEAD~1`, xoá bí mật khỏi file, rồi commit lại.
- **Đã push:** Xoá file trong commit mới là chưa đủ. Bí mật vẫn nằm trong lịch sử. **Thu hồi và tạo khoá mới ngay**, rồi báo chủ dự án. Chương 10 nói rõ quy trình.

## Lỡ xoá nhầm nội dung

Git giữ lịch sử, nên hầu hết mọi thứ đều khôi phục được:

- File đã commit bị xoá nhầm: `git restore --source=HEAD~1 tên-file` hoặc xem `git log -- tên-file` để tìm commit cũ.
- Đã push một commit sai, chưa ai dùng: tạo commit mới để hoàn tác, thay vì xoá lịch sử. Lệnh `git revert <mã-commit>` làm đúng việc này.

::: warning Cảnh báo
Tránh `git push --force` lên nhánh chung. Nếu bắt buộc phải dùng, đó là việc của người có quyền và phải báo cho nhóm trước.
:::

## Vẫn không giải quyết được

Chuẩn bị ba thông tin rồi hỏi chủ dự án: lệnh vừa chạy, toàn bộ thông báo lỗi, và kết quả của `git status`. Thông tin này thường đủ để tìm nguyên nhân nhanh.

Tiếp theo: [bảo mật khi làm việc](10-bao-mat.md).
