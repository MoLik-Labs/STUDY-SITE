# Bộ kiểm thử trong trình duyệt

Mỗi tệp `.js` ở đây là **một biểu thức JS** chạy bằng `playwright-cli eval`, trả về:

```js
{ rounds: [{ n, pass, note }], pass, total, errors }
```

## Cách chạy

```bash
# 1. phục vụ thư mục gốc repo
python3 -m http.server 8124

# 2. mở trình duyệt
playwright-cli -s=qa open "http://localhost:8124/index.html" --browser=chromium
playwright-cli -s=qa resize 1500 1000

# 3. chạy từng bộ
playwright-cli -s=qa eval "$(cat tools/qa/sched.js)"
playwright-cli -s=qa eval "$(cat tools/qa/study.js)"
playwright-cli -s=qa eval "$(cat tools/qa/school.js)"
playwright-cli -s=qa eval "$(cat tools/qa/board.js)"
playwright-cli -s=qa eval "$(cat tools/qa/sim.js)"

# 4. quét toàn bộ tuyến, desktop và mobile
playwright-cli -s=qa eval "$(cat tools/qa/audit.js)"
playwright-cli -s=qa resize 390 844
playwright-cli -s=qa eval "$(cat tools/qa/audit.js)"
```

## Quy ước

- Mỗi bộ **tự dọn dữ liệu** nó tạo (mọi thứ đều mang tiền tố `QA`).
- Bước cuối luôn là **“không lỗi JS”** — đếm qua `window.addEventListener('error')`.
- Không dùng `prompt()`/`confirm()` trong QA: app đã bỏ hẳn, hộp thoại là `#uiV` / `.overlay`.
- `audit.js` trả `{ routes: [...], errors: [] }`; mỗi route có `over` (px tràn ngang) và `clipped` (phần tử bị cắt).
