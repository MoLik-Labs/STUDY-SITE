# Kế hoạch học — Study Focus Fox

Lịch tuần và việc cần làm, kèm 8 môn đại học năm 2 và bản Vật lí riêng tại `/physic/`.
Phiên bản 12.0.0. Triển khai trên Cloudflare Workers (Static Assets).

## Trang

| Đường dẫn | Nội dung |
|---|---|
| `/` | Lịch tuần, gợi ý "Hôm nay", môn của tôi |
| `/<môn>/` | 8 môn năm 2: tài liệu, tiến độ, ghi chú, mục kiểm tra |
| `/physic/` | Vật lí (bản tách riêng) |
| `/tai-khoan/` | Đăng nhập email/Google, hồ sơ, đồng bộ, đăng xuất, xoá dữ liệu, xoá tài khoản |
| `/quyen-rieng-tu/` | Dữ liệu được lưu, lưu ở đâu, cách xoá |

Chế độ khách dùng đầy đủ, không cần tài khoản. Dữ liệu khách chỉ nằm trên máy này.

## Lệnh

```bash
npm ci                 # cài đặt; hook prepare dựng dist/
npm run build          # node site/build.mjs → dist/
npm run serve          # máy chủ thử tại :8124 (đọc biến FIREBASE_* từ môi trường)
npm test               # build tạm + kiểm thử site (node:test + jsdom)
npm run deploy         # build + npx wrangler deploy
npm run docs:dev       # web hướng dẫn (VitePress) tại :5173
npm run docs:build     # dựng web hướng dẫn → tutorial/.vitepress/dist (link chết làm lỗi)
```

Web hướng dẫn GitHub nằm ở `tutorial/` (VitePress), triển khai qua GitHub Pages bởi
`.github/workflows/pages.yml` khi merge vào `main`. Trên Pages, bật: Settings → Pages → Source: GitHub Actions.

Kiểm thử trình duyệt (cần Chromium và Playwright): `tools/browser/account_flow.py`,
`tools/browser/site_checks.py`. Cài trình duyệt: `bash tools/browser/install.sh`.

## Cấu hình

Biến môi trường trên Worker (không đặt trong repo):

- `FIREBASE_API_KEY`, `FIREBASE_PROJECT_ID`, `FIREBASE_APP_ID` (tuỳ chọn `FIREBASE_AUTH_DOMAIN`): bật đăng nhập và đồng bộ. Thiếu thì chế độ khách.
- Không đặt khoá bí mật của Firebase (service account, Admin SDK) vào Worker. App chỉ dùng khoá web công khai; dữ liệu được bảo vệ bởi `firestore.rules`.

Chi tiết: `docs/FIREBASE-SETUP.md`, `docs/CLOUDFLARE.md`.

## Cấu trúc

```
site/              khung site mới (nguồn của mọi trang ngoài Vật lí)
  build.mjs        dựng dist/ (site + /physic/ + _headers + sw.js + _worker.mjs)
  worker.template.js  Worker: /__version và /assets/config.js
  src/             app.js, cloud.js, logic.js, store.js, boot.js, courses.js, sw.template.js
  test/            node:test (logic, giao diện, build, Worker) và máy chủ thử
src/               mã nguồn Vật lí (build.py --physics-only) và module dùng chung
dist/              đầu ra đã commit (CI kiểm tra khớp với nguồn)
firestore.rules     quy tắc bảo mật Firestore (lớp bảo vệ dữ liệu thật)
tools/browser/     kiểm thử trình duyệt
docs/              tài liệu (DESIGN, PERFORMANCE, HANDOFF, CLOUDFLARE, FIREBASE-SETUP, COURSE-RESOURCES, REWRITE-PLAN)
tutorial/          web hướng dẫn GitHub (VitePress): guide/NN-*.md là nội dung, .vitepress/ là cấu hình và theme
```

## Ghi chú

- `src/` vẫn chứa các module của app cũ. Chúng không nằm trong bản deploy; việc dọn sâu
  nằm trong `docs/HANDOFF.md`.
- Tài liệu có cờ `verified: false` trong `site/src/courses.js` chưa được kiểm tra bản quyền
  và URL. Xem `docs/COURSE-RESOURCES.md`.
