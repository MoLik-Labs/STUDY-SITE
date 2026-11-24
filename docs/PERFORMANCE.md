# Hiệu năng

Đo bằng Chromium headless trên máy chủ thử cục bộ, viewport 390px (không tính độ trễ mạng thật).

| Trang | Request | Truyền tải | DOMContentLoaded | Load | FCP |
|---|---|---|---|---|---|
| Trang chủ `/` | 5 | 82 KB | 36 ms | 37 ms | 52 ms |
| Môn `/kinh-te-luong/` | 5 | 82 KB | 29 ms | 29 ms | 34 ms |
| Vật lí `/physic/` | 16 | 1 109 KB | 131 ms | 196 ms | 101 ms |

Kích thước gzip (bản build hiện tại):

- `assets/boot.js` 16,9 KB (ngân sách 22 KB)
- `assets/styles.css` 5,1 KB (ngân sách 7 KB)
- `_worker.mjs` 9,8 KB (ngân sách 12 KB; tăng từ 2,1 KB do gom API v1, MCP, mã kết nối và logic dùng chung)
- Firebase SDK `assets/firebase-sdk.js` 73,7 KB: chỉ tải khi đăng nhập, trang chủ không tải.

## Đã làm

- Ngân sách kích thước trong `site/test/perf.test.mjs`: chặn tăng thêm trên bản build thật. Trang chủ không được kéo Firebase.
- Bảo mật phụ thuộc: `npm audit --omit=dev` về 0 lỗi (xem `overrides` trong `package.json`).

## Điểm nghẽn còn lại

1. **Trang Vật lí 928 KB HTML, toàn bộ script nằm inline.** Đây là điểm nặng nhất. Tách script thành file riêng có
   hash sẽ cho phép cache lâu. Đây là việc trong `src/build.py`, lớn hơn đợt này.
2. **Tên file asset cố định** (`boot.js`, `styles.css`), nên `_headers` phải để `max-age=0, must-revalidate`.
   Đổi sang tên có hash và `immutable` cần sửa đồng thời shell, `sw.js` và bản Vật lí (tải `/assets/firebase-sdk.js` bằng tên cố định).
3. Số đo trên là cục bộ. Đo trên mạng thật cần Lighthouse trên URL đã deploy.
