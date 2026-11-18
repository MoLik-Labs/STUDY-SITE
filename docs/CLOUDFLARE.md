> **Cập nhật 12.0.0.** `dist/` do `site/build.mjs` dựng (không còn `src/build.py --dist`).
> Biến `SUPABASE_*` đọc lúc chạy trong Worker (`/assets/config.js`), xem `docs/SUPABASE-SETUP.md` §2.
> `run_worker_first` chỉ gồm `/__version` và `/assets/config.js`. Mục băm CSP bên dưới mô tả
> bản Vật lí (`/physic/`), vì site dùng chung CSP đó với `connect-src` mở tới `*.supabase.co`.

# Triển khai: chọn nền tảng nào, cấu hình ra sao

Tài liệu này trả lời hai câu hỏi: **nền tảng nào tối ưu nhất cho dự án này**, và
**cấu hình cụ thể từng bước** để chạy.

---

## 1. Kết luận trước, giải thích sau

| Hạng | Nền tảng | Vì sao |
|---|---|---|
| **1** | **Cloudflare Workers (Static Assets)** | Băng thông tĩnh **không giới hạn, không tính tiền**; PoP **ngay trong Việt Nam** (HAN · DAD · SGN); đây là nơi Cloudflare đang phát triển tính năng mới. Miễn phí vĩnh viễn, không cần thẻ. |
| 2 | Cloudflare Pages | Y hệt về băng thông và tốc độ, nhưng Cloudflare đã nói rõ **"Pages continues to work, but new features and optimizations are focused on Workers"**. Chỉ nên chọn khi tên miền của bạn **không** dùng nameserver Cloudflare (xem §6). |
| 3 | GitHub Pages | Miễn phí, nhưng **1 GB/site** và **~100 GB/tháng** (mềm), không có header bảo mật, không có backend. Đủ dùng làm bản dự phòng. |
| 4 | Vercel Hobby | **Cấm dùng thương mại** (chỉ "personal, non-commercial"), 100 GB/tháng, vượt là **site ngừng phục vụ đến hết chu kỳ**. Server ở Singapore cho người Việt. Không phù hợp. |
| — | Netlify | Từ 4/2026 đổi sang **300 credit/tháng**, băng thông tính **20 credit/GB** → khoảng 15 GB là hết credit. Tệ nhất trong nhóm. |

**Quyết định của project này: Cloudflare Workers Static Assets.** Không phải vì "mới", mà vì
hai con số: *băng thông tĩnh miễn phí không giới hạn* và *có máy chủ ở Việt Nam*.

---

## 2. Số liệu thật của dự án này

Đo trên bản dựng hiện tại:

| Chỉ số | Giá trị | Ghi chú |
|---|---|---|
| `index.html` thô | **1.029 KB** | một tệp, không chia nhỏ |
| `index.html` qua Brotli | **~230 KB** | Cloudflare tự nén, miễn phí |
| Số tệp phải phục vụ | **5** | index · 404 · sw.js · _headers · _redirects |
| Yêu cầu mạng lần đầu | **1** | sau đó font từ Google |
| Yêu cầu mạng lần hai | **0** | service worker đã cache |
| Request động (`/__version`) | **0** trong luồng học bình thường | chỉ chạy khi bấm "Kiểm tra bản mới" |

### Ước tính tải và hạn mức

Một người học mở trang **lần đầu**: 216 KB (nén). Từ lần hai trở đi: **0 KB** (service worker).

| Lưu lượng | Băng thông/tháng | Cloudflare Workers | Vercel Hobby | Netlify |
|---|---|---|---|---|
| 100 người × 20 lượt | ~4,3 GB | thoải mái | 4 % hạn mức | hết credit |
| 1.000 người × 20 lượt | ~43 GB | thoải mái | 43 % | vượt credit |
| 10.000 người × 20 lượt | ~430 GB | thoải mái | **vượt → ngừng phục vụ** | vượt |
| 100.000 người × 20 lượt | ~4,3 TB | thoải mái | **vượt** | vượt |

Con số 216 KB/người là *lần đầu*; thực tế thấp hơn nhiều vì service worker. Nhưng ngay cả khi tính
xấu nhất, Cloudflare vẫn không tính tiền băng thông tĩnh.

---

## 3. Vì sao Workers mà không phải Pages (bằng chứng)

Cloudflare tự nói, trong tài liệu *Workers Best Practices*:

> "Workers Static Assets is the recommended way to deploy static sites, single-page applications,
> and full-stack apps on Cloudflare. **If you are starting a new project, use Workers instead of
> Pages.** Pages continues to work, but new features and optimizations are focused on Workers."

Và trong blog *"Bringing a unified developer experience to Cloudflare Workers and Pages"* (7/2026):
trong một Worker project có thể gộp tài nguyên tĩnh + hàm serverless + binding — **toàn bộ tính năng
của Pages, trừ cái tên sản phẩm**.

Điều quan trọng nhất với dự án này: **Workers Static Assets vẫn đọc `_headers` và `_redirects`
y như Pages.** Nên bản dựng không phải đổi một dòng nào — xem `src/build.py` sinh hai tệp đó.

Cảnh báo đã kiểm chứng: `_headers` và `_redirects` **chỉ áp dụng cho tài nguyên tĩnh**, không áp
dụng cho phản hồi do Worker sinh ra. Vì endpoint `/__version` tự đặt header của nó, chuyện này
không ảnh hưởng gì ở đây.

*Đánh giá thẳng:* cái giá của việc chọn Workers là **phải khai thêm `main`** trong cấu hình —
một tệp 3,9 KB (`dist/_worker.mjs`) so với Pages không có `main` nào. Bù lại: có chỗ để thêm
cron/queue/D1 sau này mà không phải đổi nền tảng, và đi đúng hướng Cloudflare đang đầu tư.
Nếu bạn chỉ muốn **một tệp tĩnh và không gì khác**, Pages đơn giản hơn thật — nhưng khác biệt
chỉ là một dòng cấu hình.

---

## 4. Cấu hình Workers Static Assets (mặc định)

### 4.1 Nối repo

**Cloudflare Dashboard → Workers & Pages → Create → Workers → Connect to Git**, chọn repo, rồi:

| Ô | Giá trị |
|---|---|
| Build command | để trống (dist/ đã commit; `prepare` tự dựng) |
| Deploy command | `npx wrangler deploy` |
| Root directory | `/` (mặc định) |

`wrangler.jsonc` trong repo đã khai đủ `main`, `assets.directory`, `binding`, `404-page`,
`html_handling` — Cloudflare đọc tệp này, không phải điền tay. Đã kiểm bằng
`wrangler deploy --dry-run`: **8 tệp** vào assets, bundle Worker **2,7 KB** (gzip 1,15 KB).

### 4.2 Deploy từ máy

```bash
npm run deploy      # = node site/build.mjs && npx wrangler deploy
npm run preview     # chạy thử bằng workerd ở máy, không cần tài khoản
```

Lần đầu Wrangler mở trình duyệt để đăng nhập. Không cần API token trong repo.

### 4.3 Địa chỉ

- Tạm: `https://foxfocus.<tài-khoản>.workers.dev`
- Tên miền riêng: bỏ comment khối `routes` trong `wrangler.jsonc`, sửa thành tên miền của bạn,
  rồi deploy. Wrangler tự tạo bản ghi DNS và chứng chỉ TLS, và tự giữ nguyên qua mỗi lần deploy.

### 4.4 Thêm endpoint động sau này

Mở `src/worker.template.js`, thêm nhánh trước phần 404:

```js
if (url.pathname === '/api/diem') {
  return Response.json({ ok: true });
}
```

Rồi `npm run deploy`. Không cần đổi cấu hình. (`src/worker.template.js` là **nguồn**;
`dist/_worker.mjs` được sinh ra từ nó — đừng sửa tệp trong `dist/`.)

---

## 5. Cloudflare **có** chạy backend — giới hạn cụ thể

| Việc | Workers Static Assets | Ghi chú |
|---|---|---|
| Phục vụ tệp tĩnh | ✅ **miễn phí, không giới hạn** | không đếm vào hạn mức |
| Endpoint HTTP (`/__version`, API) | ✅ 100.000 request/ngày, 10 ms CPU/lượt | gói Free |
| Đọc/ghi D1 (SQLite) | ✅ 5 triệu dòng đọc/ngày, 100.000 dòng ghi/ngày, 5 GB | gói Free |
| KV (key-value) | ✅ 100.000 đọc/ngày, 1.000 ghi/ngày, 1 GB | gói Free |
| R2 (tệp, không phí egress) | ✅ 10 GB, 1 triệu thao tác A, 10 triệu B/tháng | gói Free |
| Cron (tác vụ định kỳ) | ✅ có `scheduled()` trên Workers | **Pages không có** — đây là lý do nữa để dùng Workers |
| WebSocket lâu dài | ⚠️ cần Durable Objects | tính phí riêng |
| Gửi email | ⚠️ không có sẵn | phải gọi Resend/MailChannels |
| Chạy > 10 ms CPU/lượt | ❌ gói Free | gói trả phí $5/tháng nới lên 30 s |
| Khi hết 100.000 request/ngày | tệp tĩnh **vẫn chạy**, chỉ phần động ngừng | đây là kiểu "hỏng" an toàn |

**Với trang học này, hạn mức động gần như không bao giờ chạm:** `/__version` chỉ chạy khi người
dùng bấm "Kiểm tra bản mới". Ngay cả 1.000 người bấm mỗi ngày cũng chỉ 1 % hạn mức.

Dữ liệu học **vẫn nằm trong máy người dùng** (`localStorage` + IndexedDB) — đó là lựa chọn có chủ ý:
nhanh, riêng tư, không cần đăng nhập. Chỉ khi muốn **đồng bộ nhiều thiết bị** hoặc **giáo viên xem
tiến độ học sinh** mới cần thêm D1 + đăng nhập, và lúc đó Cloudflare vẫn làm được.

---

## 6. Khi nào nên chọn Pages thay vì Workers

Có **đúng một** lý do kỹ thuật: **Workers custom domain yêu cầu tên miền dùng nameserver của
Cloudflare.** Nếu tên miền của bạn đang ở nhà cung cấp khác và bạn không muốn chuyển DNS, Pages vẫn
gắn được tên miền riêng mà không cần chuyển.

Trường hợp đó, cấu hình Pages:

| Ô | Giá trị |
|---|---|
| Framework preset | `None` |
| Build command | để trống (dist/ đã commit; `prepare` tự dựng) |
| Build output directory | `dist` |

Nếu chọn Pages: đổi `_redirects` đích `/` → `/index.html` (Pages không chuẩn hoá
`/index.html` như Workers), đặt `pages_build_output_dir = "dist"` và **bỏ** `main`/`assets`
khỏi cấu hình. Phần còn lại giữ nguyên: `_headers`, `_redirects`, `sw.js`, `404.html` đều
dùng được. Bản này **không** có thư mục `functions/` sẵn — nếu cần `/__version` trên Pages
thì thêm một tệp `functions/__version.js` gọi `workerFetch` xuất từ `dist/_worker.mjs`.

Còn nếu bạn không cần tên miền riêng, hoặc tên miền đã ở Cloudflare → **dùng Workers**.

---

## 7. Những gì đã cấu hình

### `_headers` — bảo mật + cache

| Header | Giá trị | Vì sao |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | chặn trình duyệt đoán sai kiểu tệp |
| `X-Frame-Options` | `SAMEORIGIN` | chống clickjacking |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | không rò URL ra ngoài |
| `Permissions-Policy` | tắt camera/mic/vị trí/thanh toán | trang không cần |
| `Cross-Origin-Opener-Policy` | `same-origin` | cô lập cửa sổ |
| `Cross-Origin-Resource-Policy` | `same-origin` | chặn trang khác nhúng tài nguyên |
| `Cache-Control` (`/`) | `public, max-age=0, must-revalidate` | nhận bản mới ngay sau deploy, nhưng chỉ tốn `304` vài chục byte thay vì tải lại 1 MB |
| `Cache-Control` (`/sw.js`) | `max-age=0, must-revalidate` | service worker không kẹt bản cũ |

Giới hạn cần nhớ: `_headers` tối đa **100 quy tắc**, mỗi dòng **2.000 ký tự**. Ta dùng 6.

### CSP

Sinh tự động trong `src/build.py`: **hash SHA-256 của từng khối `<script>` và `<style>`** được
nhúng vào `index.html`. Không `'unsafe-inline'` cho script, không `'unsafe-eval'`.

```
default-src 'self';
script-src 'self' 'sha256-…' ×6;
style-src-elem 'self' 'sha256-…' fonts.googleapis.com;
style-src-attr 'unsafe-inline';            ← cho style="…" trong markup
img-src 'self' data: i.ytimg.com blob:;
frame-src www.youtube-nocookie.com www.youtube.com;
connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none';
frame-ancestors 'self'; upgrade-insecure-requests
```

> **Vì sao `style-src-attr` vẫn là `'unsafe-inline'`:** trang có hơn 140 chỗ dùng `style="…"`
> (màu ô thời khoá biểu, thanh tiến độ, vị trí hình vẽ). CSP Level 3 tách `style-src-elem` (thẻ
> `<style>`) khỏi `style-src-attr` (thuộc tính), nên ta **siết chặt phần thẻ** và chỉ nới phần
> thuộc tính. CSS không chạy được JavaScript, và `img/connect/form` đều bị chặn nên không có
> đường rò rỉ. Siết tuyệt đối phải chuyển 140 chỗ sang class — việc lớn, không tương xứng.

Sửa CSP thì phải dựng lại: `npm test` báo lỗi ngay nếu hash lệch (`tests/csp.js`, 28 bước).

### `_redirects`

Router dùng hash nên `/study`, `/cards`, `/timetable`… trả `index.html` (200). Không có tệp này,
người dùng gõ thẳng đường dẫn sẽ nhận 404.

### `404.html`

Có `not_found_handling: "404-page"` nên đường dẫn lạ trả đúng trang 404 của ta, mã 404 thật
(tốt cho SEO), thay vì đoán mò.

### Service worker

Precache ngay lần mở đầu → lần hai gần như tức thì, mất mạng vẫn dùng được. Tên cache chứa phiên
bản (`vnl9-v11.0`) nên mỗi deploy là một cache mới. Có bản mới thì hiện hộp thoại "Nạp lại",
**không tự reload** để không mất bài đang làm.

### `.assetsignore`

**5 tệp được phục vụ**: `index.html`, `404.html`, `sw.js`, `_headers`, `_redirects`.
`_worker.mjs` bị `.assetsignore` loại khỏi assets (nếu không nó bị phục vụ công khai ở
`/_worker.mjs` — đã kiểm bằng `wrangler dev`), và `_headers` / `_redirects` do Cloudflare
tiêu thụ nên cũng không trả về. `src/`, `tests/`, `docs/` không bao giờ nằm trong `dist/`.

---

## 8. Tối ưu tốc độ cho người dùng Việt Nam

| Yếu tố | Tình trạng |
|---|---|
| PoP gần người dùng | Cloudflare có **HAN** (Hà Nội), **DAD** (Đà Nẵng), **SGN** (TP.HCM) |
| Nén | Brotli tự động: 984 KB → **216 KB** |
| Số request | 1 cho lần đầu, **0** cho các lần sau |
| Font | `display=swap`, chỉ 10 độ đậm, `preconnect` |
| Ảnh bìa video | `loading="lazy"`, không tải 236 ảnh cùng lúc |
| Trang trắng khi tải | Không — CSS nằm trong cùng tệp, không có request chặn |
| Độ trễ trang đầu | Chủ yếu là tải 216 KB một lần; sau đó service worker lo |

Lưu ý thực tế: có báo cáo một số mạng Việt Nam vẫn bị định tuyến qua Hong Kong/Singapore thay vì
PoP trong nước. Nếu gặp, đó là vấn đề định tuyến của nhà mạng, không phải cấu hình — và vẫn nhanh
hơn Vercel (Singapore) cho phần lớn người dùng.

---

## 8.1 Đã kiểm bằng workerd thật (`wrangler dev`)

Không chỉ đọc tài liệu — chạy `wrangler dev --local` rồi gọi thật:

| Request | Kết quả | Ghi chú |
|---|---|---|
| `GET /` | `200` | có đủ 6 header bảo mật, `ETag`, `CF-Cache-Status: HIT` |
| `GET /study`, `/about/` | `200` | `_redirects` rewrite, **không** 301/307 |
| `GET /index.html` | `307 → /` | Cloudflare chuẩn hoá; vô hại |
| `GET /sw.js` | `200` + `max-age=0, must-revalidate` | không kẹt bản cũ |
| `GET /__version` | `200` JSON đúng `version`/`build` | `ETag: W/"<build-id>"` |
| `GET /__version` + `If-None-Match` | `304`, body rỗng | tiết kiệm băng thông |
| `POST /__version` | `405` | có `Allow: GET, HEAD` |
| `GET /nope` | `404` + `404.html` của ta | qua Worker + `env.ASSETS` |
| `GET /_worker.mjs` | `404` | mã Worker **không** lộ |
| `GET /_headers`, `/.assetsignore` | `404` | Cloudflare tiêu thụ |
| `GET /src/app.js`, `/package.json`, `/wrangler.jsonc` | `404` | không có trong `dist/` |

**Ba lỗi thật đã phát hiện và sửa nhờ bước này** (nếu chỉ đọc tài liệu thì đã deploy lỗi):

1. `_worker.mjs` **bị phục vụ công khai** — Cloudflare chỉ ẩn tệp bắt đầu bằng `_` khi đó là
   *tài nguyên*, còn ở đây Wrangler cũng upload nó như asset. Sửa: thêm vào `.assetsignore`.
2. `_redirects` trỏ `/index.html` → mỗi lần vào `/study` bị **thêm một vòng 307**. Sửa: trỏ `/`.
3. `dist/404.html` được gọi qua `env.ASSETS` mà **không** `redirect: 'follow'` → Cloudflare trả
   `307` sang `/404` nên phản hồi không "ok", người dùng nhận plain text thay vì trang 404.
   Sửa: thêm `redirect: 'follow'`. Đã kiểm lại: giờ trả `404` + HTML thật.

Bài học đã ghi vào `tests/worker.js` (32 bước) để không tái phát.

---

## 9. Kiểm thử trước khi deploy

```bash
npm test
```

| Bộ | Bước | Kiểm gì |
|---|---|---|
| `tools/check.js` | — | cú pháp, CSS, cấm `prompt/confirm/alert`, mã chết, router |
| `tests/csp.js` | 28 | **hash CSP khớp từng khối**, không `unsafe-inline` cho script, `_headers`, `_redirects`, `sw.js`, `404.html`, `.assetsignore`, `_worker.mjs` |
| `tests/functions.js` | 20 + 6 | chạy thật `__version`: JSON, ETag, 304, 405; kiểm `wrangler.jsonc` khớp `dist/` |
| `tests/worker.js` | 32 | **mô phỏng thứ tự phục vụ của Workers**: tĩnh miễn phí, `_redirects`, 404, không lộ mã nguồn |
| `tests/smoke.js` | 54 | 38 tuyến trong jsdom, dữ liệu lõi |
| `tests/interaction.js` | 32 | dấu nháy, `uiConfirm`, sao lưu, `.ics`, luồng học, theme, bẫy Tab |
| `tests/newfeat.js` | 33 | công thức sổ điểm (hệ số, cả năm, xếp loại, what-if) + rải việc tuần |

CI chạy đúng bộ này và **chặn merge** nếu `index.html` không khớp bản dựng lại.

Tổng: **205 bước** kiểm (28 + 20 + 6 + 32 + 54 + 32 + 33), cộng 4 nhóm của `tools/check.js`.

---

## 10. Sự cố thường gặp

| Triệu chứng | Nguyên nhân | Cách xử lý |
|---|---|---|
| Trang trắng, console `Refused to execute inline script` | hash CSP lệch (thường do sửa `index.html` tay) | chạy lại `npm run build`, **đừng sửa `index.html`** |
| Gõ `/study` ra 404 | thiếu `_redirects`, hoặc Worker chạy trước tài nguyên tĩnh | kiểm `dist/_redirects`; **không** đặt `run_worker_first = true` |
| Deploy xong vẫn thấy bản cũ | service worker cache | phiên bản tăng là cache mới; hoặc DevTools → Application → Service Workers → Unregister |
| `/__version` 404 | `main` trong `wrangler.jsonc` sai, hoặc chưa build | `npm run build` rồi deploy; kiểm `dist/_worker.mjs` tồn tại, và `npm run preview` để thử tại máy |
| `wrangler deploy` báo không thấy `main` | dist/ chưa dựng | `npm run build` rồi deploy |
| Build fail `python3: command not found` | preset framework đè | đặt Framework preset = `None` |
| Sửa CSS xong không thấy đổi | quên build | `npm run build` trước khi deploy |
| Tên miền riêng không gắn được | nameserver chưa về Cloudflare | xem §6 — hoặc chuyển DNS, hoặc dùng Pages |
