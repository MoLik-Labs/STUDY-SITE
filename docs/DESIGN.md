# Thiết kế giao diện site (Kế hoạch học)

Nguồn chân lý cho token và quy tắc: `site/src/styles.css`. Tài liệu này giải thích lý do.

## Chế độ và đối tượng

- Chế độ: **Operate** (theo phân loại của skill impeccable). Người dùng là sinh viên đang làm việc
  cụ thể: xem việc hôm nay, bấm giờ học, đánh dấu tiến độ. Ưu tiên quét nhanh, nhất quán, chính xác.
- Bối cảnh dùng: buổi tối, trên điện thoại và máy tính. Vì vậy có **chế độ tối** theo cài đặt hệ điều hành.
- Không áp dụng luật ảnh thật, shader, hiệu ứng cuộn của taste-skill: đó là luật cho trang marketing.

## Màu

- Một màu nhấn (xanh rêu `#2f5d50`), dùng cho hành động chính, trạng thái đang chọn và liên kết.
- Nền giấy ấm, bề mặt trắng, viền xám ấm. Không gradient, không màu trang trí.
- Màu ngữ nghĩa có cặp nền nhạt: `ok`, `warn`, `danger`. Không dùng màu một mình để báo trạng thái;
  luôn có chữ đi kèm.
- Màu môn học (6 màu) hiện bằng một chấm tròn, không bằng thanh viền.
- Mọi cặp chữ/nền đạt WCAG AA (≥ 4.5:1) ở cả hai chế độ. Kiểm bằng công thức độ tương phản WCAG
  trên đúng giá trị token. Chạy lại: `python3 tools/design/contrast.py` (in `FAIL: []` khi đạt).

## Chữ

- Tiêu đề: serif hệ thống (Iowan, Palatino, Georgia). Không tải font ngoài (CSP chỉ cho `self`).
- Nội dung: sans hệ thống. Đồng hồ Pomodoro: serif, số dạng bảng (`tabular-nums`) để không nhảy.
- Độ rộng đoạn văn tối đa 62ch.

## Bề mặt và chiều sâu

- Viền 1px là chính. Bóng chỉ dùng khi nổi lên (thẻ đang hover), có độ lệch và độ mờ.
- Không dùng thanh viền một bên (bị cấm trong `craft-floor`), không card lồng card.

## Trạng thái bắt buộc

Mọi thành phần tương tác có: hover, focus-visible (viền 3px màu `--focus`), disabled (mờ 45%),
trạng thái rỗng, và lỗi (`.alert`, `.msg.err`). Vùng chạm tối thiểu 44px trên màn cảm ứng.

## Chuyển động

- Một đợt xuất hiện khi tải trang (`rise`), so le theo khối. Tắt hẳn khi người dùng bật
  "giảm chuyển động" trong hệ điều hành.
- Hover: nút dịch lên 1px, thẻ nổi nhẹ. Không animation lặp vô hạn.

## Cấm (theo skill impeccable, mục Refuse)

- Nhãn viết hoa phía trên tiêu đề (eyebrow). Đã bỏ ở ô "Nên học tiếp".
- Gradient trên chữ; kính mờ trang trí; thanh viền một bên bo tròn.
- Emoji hoặc ký tự Unicode thay icon. Icon, nếu có, là SVG một nét đồng nhất.
- Số thứ tự giả (01/02/03) và chỉ số "hero" trang trí.

## Ngôn ngữ giao diện

- Tiếng Việt. Nút nói rõ hành động ("Thêm việc", "Bắt đầu"). Lỗi nói rõ vấn đề và cách sửa.
- Không hiện tên biến, mã lỗi kỹ thuật, hay hướng dẫn cho quản trị viên.

## Phạm vi đã làm và chưa làm

- Đã làm: token sáng/tối, trình duyệt (vùng chọn, thanh cuộn, con trỏ), nút, thẻ "Hôm nay",
  thẻ môn, ô "Nên học tiếp", ngày hôm nay trong lịch tuần.
- Chưa làm: bố cục lại trang môn, lịch tuần (kéo thả), trang Tài khoản, trang Quyền riêng tư.
- Vật lí (`/physic/`) là app riêng (~20 000 dòng), chưa đổi giao diện trong đợt này.
