# Skills dùng cho dự án

Thư mục này lưu các skill bên ngoài để dùng lại mà không phải tải lại. Mỗi skill là một thư mục có `SKILL.md`
(hướng dẫn cho agent) và có thể kèm script, ví dụ, và giấy phép.

## Nguồn

| Thư mục | Nguồn | Giấy phép | Commit |
|---|---|---|---|
| `anthropic/webapp-testing` | github.com/anthropics/skills | Apache 2.0 (`LICENSE.txt`) | xem `anthropic/SOURCE_SHA` |
| `anthropic/frontend-design` | github.com/anthropics/skills | Apache 2.0 (`LICENSE.txt`) | xem `anthropic/SOURCE_SHA` |

Giữ nguyên `LICENSE.txt` khi sửa hoặc chia sẻ lại. Khi nâng cấp, chép lại từ nguồn và cập nhật `SOURCE_SHA`.

## Dùng vào việc gì

### `webapp-testing` → kiểm thử thật trong trình duyệt
Playwright trên Chromium thật, dùng để:
- Chụp ảnh màn hình ở 1440 và 390 px, kiểm tra bố cục
- Bắt lỗi console và lỗi mạng trong lúc dùng app
- Kiểm tra luồng đăng nhập, đồng bộ và các trang chính

Cài trình duyệt (sandbox không tải được từ CDN của Playwright, nên dùng npm):
```bash
bash tools/browser/install.sh
```
Sau đó trong script Python:
```python
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ['CHROMIUM_PATH'], headless=True,
        args=['--no-sandbox', '--no-zygote', '--disable-gpu'])
```
Audit toàn bộ tuyến (kết quả ở `--out`): `CHROMIUM_PATH=$CHROMIUM_PATH python3 tools/browser/audit.py --base http://localhost:8124 --out /tmp/audit`

Chạy có máy chủ: `python3 tools/skills/anthropic/webapp-testing/scripts/with_server.py --server "python3 -m http.server 8124 --directory dist" --port 8124 -- python3 your_test.py`

### `frontend-design` → nguyên tắc thiết kế
Quy trình: lập kế hoạch token (màu, chữ, bố cục, nguyên tắc), tự rà với brief, rồi mới viết code, và cuối cùng tự phê bình.
Với app học tập này, áp dụng có chọn lọc:
- Giữ chữ rõ, một họ font hoặc hai họ khác nhau rõ rệt, không dùng chữ IN HOA cho nhãn
- Không dùng viền tròn đồng đều, bóng đổ giống nhau và gradient trang trí ở mọi thẻ
- Chuyển động chỉ để trả lời thao tác của người dùng, không dùng hiệu ứng xuất hiện cho mọi mục
- Văn bản giao diện viết theo người dùng, động từ chủ động, lỗi nói rõ cách sửa

### Đã dùng trong vòng debug 11.9.x
- `webapp-testing` → `tools/browser/audit.py` chạy 39 tuyến ở 1440 px và 390 px, ghi `report.json` với lỗi JS, lỗi console, request thất bại, tràn ngang và trang trống. Vòng này tìm ra lỗi `#/study` (`idbClear` không trả Promise) và cảnh báo `frame-ancestors` trong `<meta>`.
- `frontend-design` → chọn phông chữ tự host (Be Vietnam Pro, Lora, JetBrains Mono) và bỏ hiệu ứng không cần thiết.

### Không dùng
- `claude-api`, `mcp-builder`, `web-artifacts-builder`: không khớp với stack vanilla JS và Cloudflare Workers của dự án.
- `skill-creator`: dành cho việc viết skill mới, không phải debug ứng dụng.
- Không có skill nào trong anthropics/skills chuyên về bảo mật. Phần bảo mật được kiểm bằng `tests/csp.js`, `tests/worker.js` và `tests/account.js` trong repo.

## Quy ước
- Skill không chứa bí mật. Khoá Firebase (khoá web công khai) chỉ đi qua biến môi trường của Worker.
- Không sửa `LICENSE.txt`.
