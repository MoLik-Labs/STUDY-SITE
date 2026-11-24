# API v1 và máy chủ MCP

Cùng một Worker (`site/src/api.js`) phục vụ REST `/api/v1/…` và MCP tại `/api/v1/mcp`. Mọi thao tác dùng chung một bộ hàm nên hai bên luôn cho cùng kết quả.

## Bật trên Cloudflare (một lần)

1. **Tạo tài khoản dịch vụ** trong Google Cloud Console của project Firebase (`study-focus-fox`):
   IAM → Service Accounts → Create. Chỉ cấp vai trò **Cloud Datastore User** (`roles/datastore.user`). Không cấp thêm vai trò nào.
2. **Tạo khoá JSON** cho tài khoản đó (Keys → Add key → JSON). Đây là bí mật, không commit, không gửi qua chat.
3. **Đặt secret trên Worker**: Workers & Pages → foxfocus → Settings → Variables and Secrets → Add → loại **Secret**, tên `FIREBASE_SERVICE_ACCOUNT`, giá trị là toàn bộ nội dung JSON.
4. Xoay khoá mỗi 6–12 tháng: tạo khoá mới, cập nhật secret, xoá khoá cũ trong Google Cloud.

Không có secret thì mọi phần **mã kết nối** trả 503 (`not_configured`). API đăng nhập trên trang vẫn chạy bình thường.

## Mô hình bảo mật

| Lớp | Cách làm |
|---|---|
| Đăng nhập trên trang | Firebase ID token (RS256, kiểm chữ ký theo khoá Google, iss/aud/exp/iat/auth_time/sub). Từ chối ẩn danh, `alg: none`, HS256. |
| Dữ liệu với ID token | Gọi Firestore REST bằng **chính token người dùng**, nên `firestore.rules` vẫn là lớp bảo vệ. |
| Mã kết nối `sft_…` | Ngẫu nhiên 256 bit. Máy chủ chỉ lưu **SHA-256** trong `apiTokens/{hash}`. Mã gốc chỉ hiện một lần lúc tạo. |
| Phạm vi | `plan:read`, `plan:write`, `tasks:read`, `tasks:write`, `cards:read`, `cards:write`. Mỗi thao tác khai báo phạm vi cần thiết. |
| Hạn dùng | Mặc định 30 ngày, tối đa 90 ngày. Tối đa 10 mã còn hạn mỗi người. |
| Quyền quản lý mã | Chỉ đăng nhập trên trang. Mã kết nối **không** tạo, liệt kê hay thu hồi được mã khác. |
| Dữ liệu cá nhân bằng mã | Tài khoản dịch vụ đọc/ghi `planners/{uid}`; **uid luôn lấy từ bản ghi mã** đã xác thực, không lấy từ yêu cầu. |
| Thu hồi | Chủ mã xoá mã; người khác nhận 404. Mã hết hạn bị từ chối tự động. |
| Tốc độ | 120 yêu cầu/phút mỗi người (bộ đếm trong từng Worker). Vượt thì 429 kèm `Retry-After`. |
| Trình duyệt | Không CORS; `Cache-Control: no-store`; `X-Robots-Tag: noindex`. |

**Đánh đổi cần biết:** tài khoản dịch vụ bỏ qua quy tắc Firestore. Vì vậy mã trong `src/api.js` phải luôn lấy uid từ bản ghi mã, và mọi đường dẫn Firestore phải gắn với uid đó. Các test trong `site/test/api.test.mjs` kiểm việc này (mã của Alice không đụng dữ liệu của Bob).

## Thao tác REST

Gửi `Authorization: Bearer <token>`. Body JSON dùng `Content-Type: application/json`. Lỗi trả `{"error":{"code","message"}}`.

| Phương thức | Đường dẫn | Phạm vi |
|---|---|---|
| GET | `/api/v1/me` | (mọi token) |
| GET / PUT | `/api/v1/plan` | `plan:read` / `plan:write` |
| GET | `/api/v1/tasks?date=YYYY-MM-DD` | `tasks:read` |
| POST | `/api/v1/tasks` `{title, date, course?}` | `tasks:write` |
| POST | `/api/v1/tasks/{id}/toggle` | `tasks:write` |
| DELETE | `/api/v1/tasks/{id}` | `tasks:write` |
| GET | `/api/v1/cards/due` | `cards:read` |
| POST | `/api/v1/cards` `{front, back?, course?}` | `cards:write` |
| POST | `/api/v1/cards/{id}/review` `{remembered: true|false}` | `cards:write` |
| DELETE | `/api/v1/cards/{id}` | `cards:write` |
| GET / POST | `/api/v1/exams` `{title, date, course?}` | `plan:read` / `plan:write` |
| DELETE | `/api/v1/exams/{id}` | `plan:write` |
| GET | `/api/v1/progress` | `plan:read` |
| GET / POST | `/api/v1/tokens` | chỉ đăng nhập trên trang |
| DELETE | `/api/v1/tokens/{id}` | chỉ đăng nhập trên trang |

Tham số `utc_offset` (phút) tính "hôm nay" theo múi giờ; mặc định +420 (Việt Nam).

Ghi kế hoạch (`PUT /api/v1/plan`) cần gửi `base` là mốc `updated` đã đọc. Nếu máy chủ mới hơn thì trả 409 và không ghi đè.

## Tạo mã kết nối

Trên trang, người dùng đăng nhập rồi gọi `POST /api/v1/tokens` với token đăng nhập:

```
{"name": "Trợ lý AI", "scopes": ["plan:read", "tasks:write"], "days": 30}
```

Phản hồi có `token` (chỉ hiện một lần). Lưu lại ngay.

## Kết nối MCP

- URL: `https://<tên-miền>/api/v1/mcp`
- Xác thực: `Authorization: Bearer sft_…`
- Giao thức: Streamable HTTP, JSON-RPC 2.0, phiên bản `2025-06-18` (chấp nhận `2025-03-26`).
- Công cụ, hiện theo đúng phạm vi của mã: `list_tasks`, `add_task`, `toggle_task`, `list_due_cards`, `add_card`, `review_card`, `list_exams`, `add_exam`, `progress`.

Ví dụ cấu hình cho client hỗ trợ HTTP MCP:

```json
{
  "mcpServers": {
    "ke-hoach-hoc": {
      "url": "https://<tên-miền>/api/v1/mcp",
      "headers": { "Authorization": "Bearer sft_..." }
    }
  }
}
```

**Đồng ý về dữ liệu:** mã cho phép đọc và/hoặc ghi việc cần làm, thẻ ôn và kỳ thi theo phạm vi đã chọn. Chỉ cấp mã cho ứng dụng bạn tin tưởng, và thu hồi khi không dùng nữa.

## Kiểm thử

```
node --test --test-force-exit site/test/api.test.mjs
node --test --test-force-exit site/test/google-auth.test.mjs
```

Chưa kiểm được trong sandbox: gọi thật tới Firestore và Google bằng tài khoản dịch vụ (sandbox không truy cập được các host này). Cần chạy một lần trên bản đã deploy: tạo mã, gọi `/api/v1/me`, thu hồi mã.
