---
layout: home
hero:
  name: STUDY-SITE
  text: Hướng dẫn làm việc với dự án
  tagline: Từ tải mã về máy đến pull request, từng bước, bằng tiếng Việt.
  actions:
    - theme: brand
      text: Bắt đầu
      link: /guide/00-gioi-thieu
    - theme: alt
      text: Mã nguồn trên GitHub
      link: https://github.com/MoLik-Labs/STUDY-SITE
---

Đây là hướng dẫn từng bước cho người mới làm việc với dự án: tải mã về máy, upload và push lên GitHub, làm việc theo nhánh và pull request, và chọn cách làm việc phù hợp.

Không cần biết lập trình sâu. Mỗi chương có lệnh cụ thể để gõ, và các bước kiểm tra để biết mình làm đúng.

## Bạn sẽ học được gì

- Hiểu các khái niệm Git và GitHub: repo, commit, nhánh, push, pull request.
- Upload file lên GitHub bằng trình duyệt, không cần lệnh.
- Commit và push bằng GitHub Desktop hoặc dòng lệnh.
- Làm việc đúng quy trình của dự án, và xử lý lỗi thường gặp.
- Chọn cách làm việc hiệu quả nhất cho mình.

## Bắt đầu nhanh

Nếu đã có Git và Node.js, bạn có thể chạy thử ngay:

```bash
git clone https://github.com/MoLik-Labs/STUDY-SITE.git
cd STUDY-SITE
npm ci
npm test
npm run serve
```

Sau đó mở `http://localhost:8124`. Nếu chưa cài Git hay Node.js, bắt đầu từ chương 01.

::: tip Mẹo
Đọc chương 00 trước, để hiểu các khái niệm. Mọi chương sau đều dựa vào chúng.
:::

## Quy ước đọc trang

Trong hướng dẫn có các khối được tô màu:

::: tip Mẹo
gợi ý giúp làm nhanh hơn.
:::

::: info Lưu ý
điều cần biết để tránh nhầm lẫn.
:::

::: warning Cảnh báo
việc có thể làm mất dữ liệu hoặc lộ thông tin nhạy cảm. Đọc kỹ.
:::

Lệnh trong khối mã chạy trong Terminal (macOS, Linux) hoặc Git Bash (Windows).

## Lộ trình

Đọc theo thứ tự từ chương 00 đến 11 nếu bạn mới bắt đầu. Đã quen Git thì có thể nhảy thẳng tới chương cần.

- [00. Bắt đầu từ đâu: dự án, Git và GitHub](guide/00-gioi-thieu)
- [01. Chuẩn bị máy và tài khoản](guide/01-chuan-bi)
- [02. Tải dự án về máy và chạy thử](guide/02-tai-ve-may)
- [03. Upload file lên GitHub bằng trình duyệt](guide/03-upload-tren-web)
- [04. Commit và push bằng GitHub Desktop](guide/04-github-desktop)
- [05. Làm việc với dòng lệnh Git](guide/05-git-dong-lenh)
- [06. Làm việc theo nhánh và pull request](guide/06-nhanh-va-pull-request)
- [07. Quy trình riêng của STUDY-SITE](guide/07-quy-trinh-du-an)
- [08. Các cách làm việc hiệu quả](guide/08-lam-viec-hieu-qua)
- [09. Xử lý sự cố thường gặp](guide/09-su-co-thuong-gap)
- [10. Bảo mật khi làm việc](guide/10-bao-mat)
- [11. Thuật ngữ thường gặp](guide/11-thuat-ngu)
