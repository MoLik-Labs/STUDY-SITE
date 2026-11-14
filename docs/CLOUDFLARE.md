# Triển khai trên Cloudflare Pages

Trang này là **một tệp HTML chạy hoàn toàn trong trình duyệt**. Cloudflare Pages phục vụ nó rất tốt:
miễn phí, có CDN toàn cầu, tự nén Brotli, tự cấp HTTPS, không cần cấu hình gì thêm.

---

## 1. Nối repo (cách khuyên dùng — không cần cài gì)

1. Vào **Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git**.
2. Chọn repo `STUDY-SITE`.
3. Điền đúng ba ô sau — **quan trọng**:

   | Ô | Giá trị |
   |---|---|
   | Framework preset | `None` |
   | Build command | `python3 src/build.py --dist` |
   | Build output directory | `dist` |

4. **Save and Deploy.** Xong. Mỗi lần push lên `main`, Cloudflare tự dựng lại và deploy.

> Vì sao là `dist` chứ không phải thư mục gốc: `python3 src/build.py --dist` chỉ chép ra
> `index.html`, `_headers`, `_redirects`, `sw.js`, `.nojekyll`. Nếu trỏ vào gốc repo thì
> toàn bộ `src/`, `tests/`, `docs/` cũng bị đưa lên web công khai — không cần thiết và làm
> tăng bề mặt tấn công.

Build chỉ cần **Python 3** (có sẵn trên máy dựng của Cloudflare). Không có `npm install`,
không có bước biên dịch nào, nên thời gian deploy thường dưới 30 giây.

---

## 2. Deploy từ máy (khi chưa muốn nối Git)

```bash
npm run deploy          # = python3 src/build.py --dist && npx wrangler pages deploy dist
```

Lần đầu `wrangler` sẽ mở trình duyệt để bạn đăng nhập Cloudflare. Không cần API token trong repo.

---

## 3. Cloudflare Pages **có** chạy backend

Pages không chỉ là hosting tĩnh: thư mục `functions/` biến thành **Worker chạy ở biên**,
miễn phí trong hạn mức của Pages (100.000 lượt gọi/ngày ở gói Free). Không cần thẻ tín dụng,
không cần bật Workers riêng.

Trang này dùng đúng **một** endpoint:

```
GET /__version  →  { version, build, at, runtime, commit, branch }
```

- Đọc `<meta name="app-version">` và `<meta name="build-id">` từ chính `index.html` đã deploy,
  nên **không phải sửa số phiên bản ở hai nơi**.
- Trả `ETag` = build id; client gửi `If-None-Match`, không đổi thì `304` (vài chục byte).
- Nút **“Kiểm tra bản mới”** trong `#/about` gọi endpoint này và báo người dùng nạp lại khi có bản mới.

Mã nguồn: `functions/__version.js`. Chạy trên **workerd** (Web-standard API: `Request`, `Response`,
`fetch`, `crypto`), **không có** `fs`, `process`, `Buffer` của Node.

### Muốn backend nhiều hơn thì làm được gì?

| Nhu cầu | Cloudflare Pages làm được? | Ghi chú |
|---|---|---|
| Kiểm tra phiên bản, health check | ✅ đã có | `functions/__version.js` |
| Đếm lượt truy cập ẩn danh | ✅ | thêm `functions/api/hit.js` + KV binding |
| Đồng bộ tiến độ giữa các máy | ✅ | Pages Functions + **D1** (SQL) hoặc **KV**; cần tài khoản đăng nhập |
| Chia sẻ thời khoá biểu bằng link | ✅ | D1 + một mã chia sẻ ngẫu nhiên |
| Tài khoản giáo viên / lớp học | ✅ nhưng nặng | cần D1 + xác thực (Cloudflare Access hoặc tự viết JWT) |
| Gửi email nhắc học | ⚠️ | Pages Functions không gửi email; phải gọi dịch vụ ngoài (Resend, MailChannels) |
| Tác vụ định kỳ (cron) | ❌ trên Pages | cần **Workers Cron Triggers** (Workers riêng, vẫn trong Cloudflare) |
| Chạy dài hơn 30 giây | ❌ | giới hạn CPU của Worker; trang này không cần |
| WebSocket lâu dài | ⚠️ | phải dùng **Durable Objects** (Workers, không phải Pages Functions) |

**Kết luận thực dụng:** với một trang học cá nhân, `functions/__version.js` là đủ; dữ liệu học
vẫn nằm trong máy người dùng (`localStorage` + IndexedDB) — đó là lựa chọn có chủ ý, không phải
giới hạn kỹ thuật. Chỉ khi bạn muốn **đồng bộ nhiều thiết bị** hoặc **giáo viên xem tiến độ học sinh**
thì mới cần thêm D1 + đăng nhập, và lúc đó Pages vẫn làm được.

---

## 4. Những gì đã cấu hình cho Cloudflare

### `_headers` (bảo mật + cache)

| Header | Giá trị | Vì sao |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | chặn trình duyệt đoán sai kiểu tệp |
| `X-Frame-Options` | `SAMEORIGIN` | chặn nhúng vào trang lạ (chống clickjacking) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | không rò URL nội bộ ra ngoài |
| `Permissions-Policy` | tắt camera/mic/vị trí/thanh toán | trang không cần |
| `Cross-Origin-Opener-Policy` | `same-origin` | cô lập cửa sổ |
| `Cross-Origin-Resource-Policy` | `same-origin` | chặn trang khác nhúng tài nguyên |
| `Cache-Control` (index) | `public, max-age=0, must-revalidate` | **luôn nhận bản mới ngay sau deploy** nhưng vẫn `304` vài chục byte thay vì tải lại 1 MB |
| `Cache-Control` (sw.js) | `max-age=0, must-revalidate` | service worker không được kẹt bản cũ |

### CSP (Content-Security-Policy)

Sinh tự động trong `src/build.py`, **hash SHA-256 của từng khối `<script>` và `<style>`** được
nhúng vào `index.html`. Không có `'unsafe-inline'` cho script, không có `'unsafe-eval'`.

```
default-src 'self';
script-src 'self' 'sha256-…' 'sha256-…' …;     ← đúng các khối của bản build
style-src-elem 'self' 'sha256-…' fonts.googleapis.com;
style-src-attr 'unsafe-inline';                 ← cho style="…" trong markup
style-src 'self' 'unsafe-inline' fonts.googleapis.com;   ← đường lùi cho trình duyệt cũ
img-src 'self' data: i.ytimg.com blob:;
frame-src www.youtube-nocookie.com www.youtube.com;
connect-src 'self';
object-src 'none'; base-uri 'none'; form-action 'none';
frame-ancestors 'self'; upgrade-insecure-requests
```

> **Vì sao `style-src-attr` vẫn là `'unsafe-inline'`:** trang có hơn 140 chỗ dùng
> `style="…"` (màu ô thời khoá biểu, độ dài thanh tiến độ, vị trí hình vẽ). CSP Level 3 tách
> `style-src-elem` (thẻ `<style>`) khỏi `style-src-attr` (thuộc tính), nên ta siết chặt phần
> **thẻ** và chỉ nới phần **thuộc tính**. CSS không chạy được JavaScript, và `img-src`,
> `connect-src`, `form-action` đều bị chặn nên không có đường rò rỉ dữ liệu.
> Nếu sau này muốn siết tuyệt đối, phải chuyển toàn bộ `style="…"` sang class — đó là việc lớn,
> không tương xứng với lợi ích.

Sửa CSP thì phải dựng lại: `npm test` sẽ **báo lỗi ngay** nếu hash không khớp
(`tests/csp.js`, 25 bước).

### `_redirects`

Router dùng hash (`#/study`) nên mọi đường dẫn con đều trả `index.html` với mã `200`.
Không có bước này, người dùng gõ thẳng `/study` hoặc `/cards` sẽ nhận 404 của Cloudflare.

### Service worker (`sw.js`)

- Precaches `index.html` ngay lần mở đầu → **mở lần hai gần như tức thì, mất mạng vẫn dùng được**.
- Tên cache chứa phiên bản (`vnl9-v11.0`), nên mỗi lần deploy là một cache mới, cache cũ bị xoá.
- Điều hướng: trả cache trước, cập nhật nền (stale-while-revalidate).
- Không can thiệp vào YouTube / Google Fonts / origin khác.
- Có bản mới → hiện hộp thoại “Đã có bản mới / Nạp lại”, **không tự reload** để không mất bài đang làm.

---

## 5. Hiệu suất

| Chỉ số | Số liệu |
|---|---|
| `index.html` thô | ~985 KB |
| **Brotli** (Cloudflare tự bật) | **~215 KB** |
| gzip | ~268 KB |
| Yêu cầu mạng để mở trang | **1** (sau đó font từ Google) |
| Lần mở thứ hai trở đi | **0** yêu cầu (service worker) |
| Thời gian deploy | < 30 s |

Những gì đã tối ưu:

- **Một tệp duy nhất** — không có waterfall request, không có bundle splitting cần thiết.
- **Font `display=swap`** và đã **giảm từ 17 xuống 10 độ đậm** (400 · 600 cho Be Vietnam Pro,
  400 · 500 cho JetBrains Mono, 400 · 600 + italic cho Lora) — mỗi độ đậm bỏ đi là một tệp font
  người dùng không phải tải. Chữ vẫn dùng `font-weight: 500` ở vài chỗ và trình duyệt tự chọn
  độ đậm gần nhất.
- **`preconnect`** tới `fonts.googleapis.com` và `fonts.gstatic.com`; `dns-prefetch` cho `i.ytimg.com`.
- **Ảnh bìa video `loading="lazy"` + `decoding="async"`** — trang không tải 236 ảnh YouTube cùng lúc.
- **ETag/must-revalidate** — sau khi bạn deploy, người dùng nhận bản mới mà chỉ tốn vài chục byte
  (304), không phải tải lại 1 MB.
- **Service worker** — lần mở thứ hai không đi mạng.

### Đo thật sau khi deploy

```bash
curl -sI https://<tên>.pages.dev/ | grep -iE 'cf-cache|content-encoding|cache-control'
curl -s https://<tên>.pages.dev/__version
```

Kỳ vọng: `content-encoding: br`, `cache-control: public, max-age=0, must-revalidate`,
`/__version` trả JSON có `version` khớp với chân trang.

---

## 6. Kiểm thử trước khi deploy

```bash
npm test
```

| Bộ | Bước | Kiểm gì |
|---|---|---|
| `tools/check.js` | — | cú pháp JS, CSS, cấm `prompt/confirm/alert`, mã chết, router ↔ `render*` |
| `tests/csp.js` | 25 | **hash CSP khớp từng khối**, không `unsafe-inline` cho script, `_headers`, `_redirects`, `sw.js` mang đúng phiên bản, mọi origin tải về đều được cho phép |
| `tests/functions.js` | 18 | chạy thật `functions/__version.js`: 200, JSON, ETag, 304, 405 cho POST, vẫn trả lời khi không đọc được `index.html` |
| `tests/smoke.js` | 51 | 35 tuyến trong jsdom, dữ liệu lõi, không lỗi JS |
| `tests/interaction.js` | 32 | tên có dấu nháy, `uiConfirm`, xoay vòng sao lưu, `.ics`, luồng học, theme, bẫy Tab |

CI (`.github/workflows/check.yml`) chạy đúng bộ này và **chặn merge** nếu `index.html` không
khớp bản dựng lại từ `src/`.

---

## 7. Sự cố thường gặp

| Triệu chứng | Nguyên nhân | Cách xử lý |
|---|---|---|
| Trang trắng, console `Refused to execute inline script` | Hash CSP không khớp (thường do sửa `index.html` bằng tay) | chạy lại `python3 src/build.py --dist`, **đừng sửa `index.html` trực tiếp** |
| Gõ `/study` ra 404 | thiếu `_redirects` hoặc deploy sai thư mục | kiểm Build output = `dist` |
| Deploy xong nhưng người dùng vẫn thấy bản cũ | service worker còn cache cũ | phiên bản tăng → cache mới; hoặc DevTools → Application → Service Workers → Unregister |
| `/__version` trả 404 | thư mục `functions/` không có trong bản build | kiểm repo có `functions/__version.js`; Wrangler đọc từ thư mục làm việc |
| Build fail `python3: command not found` | preset framework đè biến môi trường | đặt Framework preset = `None` |
| Sửa CSS xong deploy mà không thấy đổi | quên dựng lại / trình duyệt cache | `npm run build` rồi deploy; hard-reload |
