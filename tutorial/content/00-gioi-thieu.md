# Bắt đầu từ đâu: dự án, Git và GitHub

Trang này giải thích **dự án STUDY-SITE là gì**, các khái niệm cơ bản (repo, commit, nhánh, push), và bạn sẽ làm được gì sau khi đọc hết hướng dẫn.

## Dự án này là gì?

STUDY-SITE là một trang web miễn phí giúp lập kế hoạch học: lịch tuần, việc cần làm, bấm giờ Pomodoro, ôn tập bằng thẻ ghi nhớ, và tài liệu của 8 môn năm 2. Trang chạy trên **Cloudflare Workers**. Đăng nhập và đồng bộ dùng **Firebase** ở gói miễn phí.

Mã nguồn nằm trên GitHub tại `MoLik-Labs/STUDY-SITE`. Toàn bộ lịch sử thay đổi, ai sửa gì và lúc nào, đều được ghi lại.

## Bốn khái niệm cốt lõi

Đọc kỹ phần này một lần. Các chương sau đều dựa trên nó.

### Repository (repo)

Repo là **thư mục dự án cộng với toàn bộ lịch sử của nó**. Repo có hai bản:

- **Trên máy bạn**: thư mục bạn mở bằng VS Code hoặc Finder/File Explorer.
- **Trên GitHub**: bản chung mà mọi người cùng dùng, mở bằng trình duyệt.

### Commit

Commit là **một ảnh chụp có ghi chú** của dự án tại một thời điểm, kiểu "tôi đã sửa những file này vì lý do này". Mỗi commit có mã riêng, tác giả, thời gian và một thông điệp mô tả.

### Nhánh (branch)

Nhánh là **một dòng thay đổi song song**. Nhánh `main` là bản chính thức. Khi làm việc mới, bạn tạo nhánh riêng, làm xong rồi mới gộp vào `main`. Nhờ vậy việc đang dở không làm hỏng bản chính.

### Push và pull

- **Push**: đẩy commit trên máy bạn lên GitHub.
- **Pull**: kéo commit mới nhất từ GitHub về máy bạn.

## Vòng làm việc cơ bản

Hầu như mọi việc đều theo một vòng lặp:

1. **Kéo** bản mới nhất về (`pull`).
2. **Sửa** file.
3. **Kiểm tra** thay đổi (`status`, `diff`).
4. **Ghi lại** bằng commit.
5. **Đẩy** lên GitHub (`push`).

Các chương sau đi qua từng bước, bằng ba cách: giao diện web, GitHub Desktop và dòng lệnh.

## Cấu trúc thư mục dự án

Bạn không cần nhớ hết, nhưng nên biết những thư mục chính:

| Thư mục / file | Nội dung | Có nên sửa tay không? |
|---|---|---|
| `site/` | Khung trang web, logic, giao diện, kiểm thử | Có. Đây là nơi làm việc hằng ngày. |
| `site/src/` | `app.js`, `logic.js`, `cloud.js`, `courses.js` | Có |
| `site/test/` | Các bài kiểm thử | Có, khi thêm tính năng |
| `src/` | Mã của bản Vật lí (app riêng) | Chỉ khi làm việc với Vật lí |
| `docs/` | Tài liệu kỹ thuật (Firebase, Cloudflare, API) | Có |
| `dist/` | Bản đã dựng sẵn, Cloudflare dùng để triển khai | **Không sửa tay.** Luôn tạo bằng `npm run build`. |
| `tutorial/` | Chính web hướng dẫn này | Có |
| `wrangler.jsonc` | Cấu hình Cloudflare Workers | Cẩn thận |
| `firestore.rules` | Quy tắc bảo mật dữ liệu | Cẩn thận, phải kiểm tra kỹ |
| `package.json` | Danh sách thư viện và lệnh (`npm run ...`) | Cẩn thận |

> **Lưu ý:** `dist/` được commit cùng mã nguồn một cách có chủ đích. Chương 07 giải thích vì sao.

## Bạn sẽ làm được gì sau khi đọc

- Tải dự án về máy và chạy thử trên trình duyệt.
- Upload file lên GitHub chỉ bằng chuột, không cần lệnh.
- Commit và push bằng GitHub Desktop hoặc dòng lệnh.
- Làm việc theo nhánh và pull request để không làm hỏng bản chính.
- Chọn cách làm việc phù hợp: trình duyệt, Codespaces, VS Code hoặc terminal.
- Tránh các lỗi thường gặp và không làm lộ khoá bí mật.

Tiếp theo: [chuẩn bị máy và tài khoản](01-chuan-bi.html).
