# Công cụ soạn nội dung (không cần để chạy trang)

Ba script Python **chỉ dùng khi soạn thêm nội dung**, không tham gia build và không cần mạng
để chạy trang. Chúng cào hoặc sinh dữ liệu, kết quả được dán vào `src/`.

| Tệp | Việc | Ghi chú |
|---|---|---|
| `gen_content4.py` | Sinh `src/content4.js`: 82 câu trắc nghiệm, 26 hỏi đáp, 6 bài giải mẫu. Mọi đáp án số được **tính lại bằng Python** trước khi xuất, nên không có đáp án “chép tay”. | Không cần mạng. Chạy `python3 tools/authoring/gen_content4.py > src/content4.js` rồi `npm test`. |
| `yt.py` | Tìm video YouTube theo từ khoá để điền `LIB` trong `src/base.html`. | **Cần mạng.** Cào trang kết quả tìm kiếm. |
| `ch.py` | Tìm video trong một kênh cụ thể (tham khảo cách giảng của thầy Vũ Ngọc Anh). | **Cần mạng.** |

## Quy ước khi thêm nội dung

1. Nội dung mới phải parse được bằng `node tools/check.js` và không làm hỏng `tests/smoke.js`
   (bộ test đếm `QA`, `QUIZ`, `LIB` — nếu số tụt bất thường là dấu hiệu ghi đè nhầm file).
2. Đáp án số **phải có `tol`** và `unit`; câu điền số được chấm dung sai ±0,5 % nếu không khai `tol`.
3. Thêm câu hỏi thì thêm cả trường `t` (chủ đề 1–12) để trang *Tiến độ* và *Chẩn đoán chủ đề yếu* hoạt động.
