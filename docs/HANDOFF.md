# Bàn giao — Kế hoạch học 12.0.0

## Trạng thái

- **Đã deploy qua merge** (sau khi PR #9 được merge vào `main`): site mới trong `site/`,
  bản Vật lí tại `/physic/`, đăng nhập email/Google, đồng bộ, offline, trang tài khoản và
  quyền riêng tư.
- Kiểm thử: `npm test` (60 bước site), `tools/browser/account_flow.py` (62 bước, 390 và 1440),
  `tools/browser/site_checks.py` (offline và Vật lí).
- Lighthouse (Chromium 131, máy chủ thử không nén): mobile 97 / 98 / 100 / 100 và desktop
  98 / 98 / 100 / 100 (performance, accessibility, best-practices, SEO).

## Việc còn mở

1. **Cấu hình Firebase** (người dùng, console): xem `docs/FIREBASE-SETUP.md`. Gồm authorized domains, bật Email link và Google, triển khai `firestore.rules`, và biến `FIREBASE_*` trên Worker.
   Trước đó đăng nhập không hoạt động, nhưng chế độ khách vẫn chạy.
2. **Kiểm thử RLS với người dùng thật** (chưa làm; mọi kiểm thử đám mây dùng mock).
3. **Khoá đã lộ trong output công cụ** trong quá trình làm việc: xoay vòng service_role
   và secret key trong dashboard.
4. **Tài liệu chưa xác minh** (`verified: false`): OpenStax Econ 2e, MIT 14.382/14.387,
   BPP, Linguahouse, Mandarin Corner, BBC, ChinesePod, và các mục OpenLearn. Hai môn tiếng
   Trung đọc-viết và nói đang dùng chung OpenLearn, cần xem lại.
5. **Dọn `src/`**: module app cũ (lịch cũ, trường học, sổ điểm, thẻ, trò chơi, nhạc) vẫn
   nằm trong `src/`, làm nguồn cho Vật lí. Cần tách `src/physics/` riêng rồi xoá phần còn lại.
6. **CLS mobile 0.106** (ngưỡng tốt là 0.1). Nguyên nhân chưa khoanh vùng. Lighthouse vẫn 97.
7. **Heading-order** (accessibility 98): một mục trong trang tài khoản có h3 sau h2.
8. **CSP của site** dùng chung chuỗi băm của Vật lí. Muốn siết `script-src 'self'` thì
   phải đưa script inline của Vật lí ra file ngoài.

## Lệnh

Xem `README.md`.
