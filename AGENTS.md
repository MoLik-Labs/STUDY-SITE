# Hướng dẫn cho agent làm việc trong STUDY-SITE

File này được đọc đầu tiên khi làm việc trong repo này. Nó chứa ràng buộc đã chốt với chủ dự án
và danh sách skill đã cài sẵn trong `.agents/skills/`.

## Ràng buộc đã chốt (không đổi nếu chủ dự án không đổi)

- Hosting: **Cloudflare Workers** (`wrangler.jsonc`). Không chuyển sang nơi khác.
- Backend dữ liệu: **Firebase** (Auth + Firestore) là nguồn duy nhất. Không dùng Supabase.
- Chỉ **gói miễn phí** (Spark). Không SMS, không Blaze, không ẩn danh.
- Chỉ làm **web**, không làm ứng dụng.
- Giữ các phần đã đẹp và không lỗi (ví dụ Pomodoro, trang Vật lí, Kinh tế lượng). Không làm lại chỉ vì làm lại.
- Giao diện người dùng viết bằng tiếng Việt. Không lộ tên biến, mã lỗi kỹ thuật hay hướng dẫn cho quản trị viên ra trang người dùng.
- `dist/` phải khớp với nguồn: chạy `npm run build` rồi commit `dist/` cùng nguồn. CI kiểm tra điều này.
- Trước khi báo xong việc: `npm test` phải xanh.

## Skill đã cài (`.agents/skills/`)

Nguồn, commit đã ghim và giấy phép: `.agents/skills/SOURCES.md`.
Cài lại hoặc cập nhật bằng `bash tools/skills/vendor-skills.sh`.

| Gói | Dùng khi |
|---|---|
| `superpowers` (obra) | Quy trình: brainstorming, writing-plans, executing-plans, TDD, debugging |
| `impeccable` (pbakaus) | Thiết kế giao diện: critique, polish, typeset, layout, motion |
| `ui-ux-pro-max` (nextlevelbuilder) | Hệ thống thiết kế, màu, font, phong cách UI |
| `taste-skill` (Leonxlnx) | Chất lượng thẩm mỹ, tránh giao diện "AI generic" |
| `vercel-agent-skills` (vercel-labs) | React/web: hiệu năng, composition, view transitions, web-design-guidelines |
| `go-skills`, `cc-skills-golang` (spf13, samber) | Go: style, concurrency, lỗi, benchmark, bảo mật |
| `low-level-dev` (mohitmishra786) | Hệ thống sát phần cứng, Rust, tối ưu bộ nhớ và I/O |

Quy tắc khi dùng skill:
- Đọc `SKILL.md` của skill trước khi làm việc thuộc phạm vi đó.
- Skill không được vượt ràng buộc ở trên. Ví dụ: một skill đề nghị đổi hosting hoặc thêm dịch vụ trả phí thì bỏ qua và ghi lại lý do.
- Các skill có script cần Chrome hoặc truy cập web có thể không chạy được trong sandbox. Khi đó ghi rõ điều đó trong báo cáo, không giả vờ đã chạy.

## Lệnh thường dùng

- `npm ci` — cài phụ thuộc
- `npm test` — toàn bộ test (115+)
- `npm run build` — dựng `dist/` (Workers + trang tĩnh)
- `npm run serve` hoặc `node site/test/serve.mjs --port 8124 --dir dist` — máy chủ thử
- `bash tools/browser/install.sh` — cài Chromium headless cho kiểm thử giao diện
