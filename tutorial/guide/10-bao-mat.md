# Bảo mật khi làm việc

Mã nguồn công khai có thể bị quét bởi các công cụ tự động trong vài phút sau khi xuất hiện. Chương này nói về những thứ không bao giờ được đưa vào repo, cách lưu chúng đúng chỗ, và việc cần làm khi lỡ làm lộ.

## Những thứ không bao giờ commit

- **Mật khẩu** và **token truy cập** (GitHub, Cloudflare, bất kỳ dịch vụ nào).
- **Khoá dịch vụ** dạng JSON của Google Cloud (`service account`), có trường `private_key`.
- **File môi trường** `.env`, `dev.vars`, hoặc tương tự.
- **Ảnh chụp màn hình** có thông tin đăng nhập hoặc khoá hiện trên màn hình.
- **Dữ liệu cá nhân thật** của người dùng.

Repo đã cấu hình `.gitignore` để bỏ qua nhiều loại trong số này, nhưng **đó không phải lớp bảo vệ duy nhất**. Luôn kiểm tra `git status` và danh sách file trước khi commit.

## Nơi lưu bí mật đúng cách

Dự án dùng hai loại cấu hình trên Cloudflare Workers:

| Loại | Dùng cho | Có hiện ra trong mã trang không? |
|---|---|---|
| **Variable** (biến thường) | Cấu hình công khai, như khoá web Firebase | Có, và điều đó không sao vì chúng là công khai |
| **Secret** (bí mật) | Khoá dịch vụ, mật khẩu, token | Không. Chỉ Worker đọc được khi chạy |

Quy tắc: **nếu giá trị có thể dùng để chiếm quyền hoặc đọc dữ liệu riêng tư, nó là Secret**. Thêm Secret trong Cloudflare: **Workers & Pages → chọn Worker → Settings → Variables and Secrets**.

Khoá web Firebase (`apiKey`, `appId`) là công khai theo thiết kế của Firebase. Bảo vệ dữ liệu thật nằm ở quy tắc `firestore.rules`, không nằm ở việc giấu khoá.

## Bí mật đã lộ thì làm gì

Thứ tự quan trọng. Làm đúng thứ tự, theo đúng thời gian:

1. **Thu hồi hoặc vô hiệu hoá bí mật ngay.** Đây là bước quan trọng nhất. Đừng chờ xoá commit.
2. **Tạo bí mật mới** và cập nhật nơi đang dùng (Secret trên Cloudflare, cấu hình trên máy).
3. **Kiểm tra nhật ký** của dịch vụ xem bí mật cũ có bị dùng bất thường không.
4. **Xoá khỏi repo** nếu cần. Nhưng nhớ rằng lịch sử git vẫn giữ nó, nên bước 1 mới là bước cứu cánh.
5. **Báo chủ dự án.**

::: warning Cảnh báo
Xoá file rồi commit lại không làm mất bí mật khỏi lịch sử. Chỉ việc thu hồi bí mật mới đảm bảo an toàn.
:::

## Các công cụ GitHub hỗ trợ

- **Secret scanning** và **push protection**: GitHub có thể chặn push khi phát hiện mẫu khoá quen thuộc. Nếu bạn gặp thông báo này, đừng vòng qua nó. Hãy kiểm tra thứ bị phát hiện, xoá khỏi commit, rồi thử lại.
- **Dependabot**: cảnh báo khi thư viện có lỗ hổng bảo mật đã biết.

## Quyền truy cập

- Bật xác thực hai lớp cho tài khoản GitHub và Cloudflare.
- Chỉ cấp quyền cho người thật sự cần. Dùng quyền tối thiểu cần thiết.
- Khoá dịch vụ Google chỉ nên có vai trò hẹp nhất. Dự án này dùng vai trò *Cloud Datastore User*.
- Khi nghỉ dự án hoặc đổi người, thu hồi quyền ngay.

## Dữ liệu người dùng

Dự án có tính năng đăng nhập và đồng bộ. Khi làm việc với dữ liệu này:

- Không tải dữ liệu thật về máy để thử nghiệm. Dùng dữ liệu giả.
- Không ghi log dữ liệu cá nhân hay nội dung người dùng.
- Đọc `docs/FIREBASE-SETUP.md` và `firestore.rules` trước khi đổi bất kỳ quy tắc nào.

## Khi cần chia sẻ thông tin cho người khác

Không gửi bí mật qua chat, email hay ảnh. Thay vào đó:

- Dùng trình quản lý mật khẩu có chia sẻ có kiểm soát.
- Hoặc để người có quyền tự tạo bí mật trên dịch vụ đó.

Tiếp theo: [thuật ngữ thường gặp](11-thuat-ngu.md).
