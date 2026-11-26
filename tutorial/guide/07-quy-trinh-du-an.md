# Quy trình riêng của STUDY-SITE

Chương này nói về những điều đặc thù của dự án này, và vì sao chúng khác với một dự án web thông thường. Đọc kỹ trước khi sửa mã nguồn lần đầu.

## Tóm tắt quy trình

```
sửa site/ hoặc tutorial/
   ↓
npm run build        ← dựng lại dist/
   ↓
npm test             ← kiểm thử, phải fail 0
   ↓
git add ... (cả dist/)
   ↓
git commit, git push
   ↓
CI kiểm tra lại: dist/ khớp nguồn, test xanh, cấu hình Cloudflare hợp lệ
```

## Vì sao phải commit cả dist/?

`dist/` là bản đã dựng sẵn, và Cloudflare Workers triển khai trực tiếp từ thư mục này. Dự án commit nó vì Workers Builds của repo này **không tự chạy build**. Nếu `dist/` không nằm trong repo, sẽ không có gì để triển khai. Hệ quả tốt kèm theo: mỗi thay đổi trong `dist/` đều hiện trong pull request, nên ai cũng thấy chính xác cái gì sẽ lên mạng.

Hệ quả: **nếu bạn sửa mã nguồn mà quên dựng lại `dist/`, CI sẽ đỏ** ở bước *Bản dist/ phải khớp với bản đã commit*. Cách sửa là chạy `npm run build`, thêm `dist/` vào commit, rồi push lại.

::: danger Quy tắc
Không sửa tay file trong `dist/`. Sửa nguồn trong `site/` hoặc `tutorial/`, rồi dựng lại.
:::

## Lệnh `npm ci` làm gì ngoài việc cài thư viện?

Trong `package.json` có một hook tên `prepare`. Nó tự chạy sau `npm ci` và dựng lại `dist/` từ nguồn. Nếu sau khi cài bạn thấy `git status` có thay đổi trong `dist/`, nghĩa là bản commit trước chưa khớp nguồn. Hãy báo cho chủ dự án, hoặc commit phần thay đổi đó nếu bạn chắc đúng.

## Các bước kiểm tra CI chạy

Theo `.github/workflows/check.yml`, mỗi PR và mỗi lần push lên `main` chạy:

1. **Cài đặt và dựng `dist/`**: `npm ci`.
2. **Kiểm tra khớp**: `git diff --exit-code -- dist/`. Nếu `dist/` không khớp nguồn, bước này đỏ.
3. **Kiểm thử**: `npm test`. Gồm dữ liệu, logic, giao diện, build, Worker, chính sách bảo mật nội dung (CSP), và tài liệu.
4. **Kiểm tra cấu hình Cloudflare**: chạy `wrangler deploy --dry-run`. Không triển khai thật, chỉ kiểm tra cấu hình có hợp lệ.

Bạn xem kết quả ở tab **Checks** của PR. Bấm vào một bước đỏ để đọc lỗi.

## Triển khai lên mạng

Cloudflare Workers Builds đã được kết nối với repo. Xem trạng thái ở tab **Checks** của PR, hoặc trong trang Workers của tài khoản Cloudflare.

Lệnh triển khai thủ công chỉ dành cho người có quyền Cloudflare:

```bash
npm run deploy
```

Lệnh này dựng lại và chạy `wrangler deploy`. Đừng chạy nếu bạn chưa được chủ dự án cho phép.

## Những thư mục bạn không nên chỉnh tay

| Thư mục | Lý do |
|---|---|
| `dist/` | Sinh tự động từ `site/` và `src/`. Sửa tay sẽ bị ghi đè hoặc làm CI đỏ. |
| `package-lock.json` | Khoá phiên bản thư viện. Chỉ đổi khi thêm hoặc nâng cấp thư viện bằng `npm install`. |
| `node_modules/` | Thư viện tải về máy. Không bao giờ commit (đã có trong `.gitignore`). |

## Cấu trúc để thêm tính năng

Khi thêm một tính năng vào `site/`, nên đi theo thứ tự này:

1. **Logic thuần** trong `site/src/logic.js`: hàm nhận dữ liệu, trả kết quả, không đụng giao diện. Dễ kiểm thử nhất.
2. **Test** trong `site/test/logic.test.mjs` cho hàm đó.
3. **Giao diện** trong `site/src/app.js`, kết nối với logic.
4. **Test giao diện** trong `site/test/app.test.mjs` nếu cần.
5. **Dựng lại** với `npm run build`, rồi `npm test`.

Thứ tự này giúp lỗi nằm đúng chỗ, và giữ logic có thể kiểm thử mà không cần trình duyệt.

## Kiểm tra trước khi push (checklist)

- [ ] Đã `git pull`, đang ở đúng nhánh.
- [ ] Đã `npm run build`.
- [ ] `npm test` báo `fail 0`.
- [ ] `git status` chỉ còn những file mình định commit.
- [ ] Không có file `.env`, khoá JSON, hay mật khẩu trong danh sách.
- [ ] Thông điệp commit rõ ràng.

Tiếp theo: [các cách làm việc hiệu quả](08-lam-viec-hieu-qua.md).
