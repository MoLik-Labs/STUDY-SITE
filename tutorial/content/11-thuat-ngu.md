# Thuật ngữ thường gặp

Tra cứu nhanh. Thuật ngữ được xếp theo bảng chữ cái tiếng Anh, vì đó là cách bạn sẽ gặp chúng trong công cụ.

| Thuật ngữ | Nghĩa |
|---|---|
| **Branch (nhánh)** | Một dòng thay đổi song song trong repo. `main` là nhánh chính. |
| **Checks** | Kết quả các kiểm tra tự động (CI) của một commit hoặc PR. |
| **Clone** | Tải toàn bộ repo, kèm lịch sử, về máy. |
| **Commit** | Ảnh chụp có ghi chú của dự án tại một thời điểm. |
| **CI (Continuous Integration)** | Hệ thống tự động chạy kiểm tra mỗi khi có thay đổi. Dự án dùng GitHub Actions. |
| **Conflict (xung đột)** | Hai thay đổi trên cùng một đoạn mà Git không tự gộp được. |
| **Diff** | Bản so sánh chi tiết giữa hai phiên bản, thường xem theo dòng. |
| **Fetch** | Tải thông tin mới về từ GitHub mà không gộp vào nhánh hiện tại. |
| **Fork** | Bản sao repo dưới tài khoản khác. Dùng khi không có quyền ghi vào repo gốc. |
| **Issue** | Mục ghi việc cần làm, lỗi, hoặc câu hỏi trên GitHub. |
| **Merge (gộp)** | Kết hợp thay đổi từ nhánh này vào nhánh khác. |
| **Pull** | Kéo commit mới về và gộp vào nhánh hiện tại. (`fetch` + `merge` hoặc `rebase`). |
| **Pull request (PR)** | Đề nghị gộp một nhánh vào nhánh khác, kèm thảo luận và kiểm tra. |
| **Push** | Đẩy commit từ máy lên GitHub. |
| **Rebase** | Đặt commit của bạn lên trên commit mới nhất, giữ lịch sử thẳng. |
| **Remote (`origin`)** | Tên mặc định của bản repo trên GitHub, nhìn từ máy bạn. |
| **Repository (repo)** | Thư mục dự án cùng toàn bộ lịch sử. |
| **Revert** | Tạo commit mới để hoàn tác một commit cũ, an toàn với lịch sử chung. |
| **Stage (staging)** | Chọn file để đưa vào commit kế tiếp (`git add`). |
| **Stash** | Cất tạm thay đổi chưa commit để làm việc khác. |
| **Tag** | Nhãn cố định gắn vào một commit, thường để đánh dấu phiên bản. |
| **Workflow** | Kịch bản CI được định nghĩa trong `.github/workflows/`. |

## Thuật ngữ của dự án

| Thuật ngữ | Nghĩa |
|---|---|
| **dist/** | Bản đã dựng sẵn của trang web. Không sửa tay. |
| **Lockfile** | `package-lock.json`, khoá phiên bản thư viện để cài giống nhau mọi nơi. |
| **Preview** | Bản xem thử của một nhánh, do Cloudflare tạo, trước khi lên bản chính. |
| **Secret** | Biến bí mật trên Cloudflare, Worker đọc được nhưng không hiện trong mã trang. |
| **Worker** | Mã chạy trên máy chủ Cloudflare, xử lý yêu cầu của trình duyệt. |

Quay lại [trang tổng quan](index.html) để đọc lại từ đầu, hoặc đi tới [chương 00](00-gioi-thieu.html).
