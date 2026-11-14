# Sprint 3–5 — nhật ký nâng cấp (bản v17)

File chạy: **`vat_li_9_lop_hoc.html`** — một file duy nhất, ~634 KB, mở là chạy, không cần mạng cho phần học/giải.

---

## 1 · Động cơ học tập (mới)

| Thành phần | Cách hoạt động | Đo được |
|---|---|---|
| **Ôn cách quãng 5 hộp (Leitner)** | Đúng → lên hộp, hẹn 1 / 3 / 7 / 21 ngày; sai → về hộp 1, hỏi lại ngay | Mỗi câu có `box`, `due`, `tries` lưu trong máy |
| **Dải "Hôm nay"** | Vòng tiến độ theo mục tiêu ngày, số câu đến hạn, chủ đề yếu nhất | 20 câu/ngày (đổi được trong `state.goal`) |
| **Phiên hôm nay 3 việc** | Ôn 10 câu · học 1 ca · thi 1 lượt, tự tick khi làm xong | Đếm trực tiếp từ dữ liệu, không phải "tự khai" |
| **Chẩn đoán chủ đề yếu** | Bảng theo chủ đề + gợi ý ca học cụ thể để vá | Ngưỡng < 75% và ≥ 2 câu |
| **Lịch nhịp 14 ngày** | Ô đậm theo số hoạt động mỗi ngày | `state.days` |

## 2 · Phòng thi (Exam cockpit)

- **Lưới nhảy câu**: 15 ô, xanh = đã làm, gạch chân đỏ = cắm cờ, viền = câu đang xem.
- **Phím tắt**: `1–4` / `A–D` chọn đáp án, `↑ ↓` chuyển câu, `F` cắm cờ, `Enter` nhảy tới câu trống kế tiếp.
- **Tự lưu & khôi phục**: rời trang hoặc tải lại vẫn giữ đề, đáp án và đồng hồ (lưu mỗi 5 giây).
- **Báo cáo theo chủ đề**: bảng đúng/sai từng chủ đề, chip "luyện ngay" cho chủ đề dưới 60%, nút **Luyện lại đúng N câu sai** (bốc lại chính các câu đó).
- **Chấm câu điền số thông minh**: nhận cả `12`, `12,5`, `12.5 Ω`; dung sai ±0,5% hoặc theo `tol` của câu; **báo riêng khi sai đơn vị**; hiện dung sai ngay trong đáp án.

## 3 · Phòng thí nghiệm (nâng cấp sâu)

- **Sổ ghi chép dùng chung 4 bàn**: mỗi lần "Ghi số liệu" thêm một dòng (bàn · giờ · số liệu), xoá từng dòng, **xuất CSV** để dán vào báo cáo.
- **Bàn điện**: cảnh báo *mạch hở*, *quá thang ampe/vôn kế*, *quá công suất điện trở*; số liệu (U, I) tự vào sổ, đồ thị I–U + hệ số góc suy ra R.
- **Bàn quang**: nút **Dời màn tới ảnh** (giải ngược ra d′), cảnh báo vật trong tiêu cự, ghi bộ ba (f, d, d′) + độ phóng đại.
- **Bàn cơ**: chọn **vật liệu** (nhôm/sắt/đồng/đá/gỗ), thêm **cân điện tử dưới bình** đọc phần tăng đúng F_A/g, hiện **D suy ra từ P và V**.
- **Bàn nhiệt**: thanh **Q toả / Q thu** song song + ghi kết quả vào sổ.

## 4 · Tìm kiếm & điều hướng

- **⌘K / Ctrl+K** hoặc `/`: bảng lệnh quét **bài học · công thức · hỏi đáp · bài giải · đề thi · câu hỏi luyện · máy giải · phòng lab**.
- Dòng "Câu hỏi" có hành động **↵ luyện ngay** — mở đúng câu đó trong chế độ thi 1 câu.
- Điều hướng bằng `↑ ↓ Enter Esc`.

## 5 · Hiệu năng & trải nghiệm đọc

- Trang **Hỏi đáp** gập theo chủ đề (3 câu đầu + "xem thêm"): chiều cao trang giảm **37.800 px → 9.900 px** ở 390 px.
- **Thư viện** hiện 4 bài/chủ đề, mở dần (48 dòng thay vì 236 khi vào trang).
- Máy giải: dải chủ đề cuộn ngang trên điện thoại (tiết kiệm ~210 px), lưới dạng bài 2 cột.
- Đồng hồ cát thu gọn thành viên nhỏ trên điện thoại, bấm để mở.

## 6 · Tiếp cận (a11y)

- Skip link "Tới nội dung chính", `:focus-visible` toàn cục, `aria-live` cho toast, `Esc` đóng overlay, tôn trọng `prefers-reduced-motion`.

---

## Kiểm thử đã chạy

| Bài kiểm | Kết quả |
|---|---|
| `node --check` cả 4 khối `<script>` | OK |
| 12 route × 2 khổ (1500 px, 390 px) | 0 tràn ngang, 0 phần tử cắt, **0 lỗi console** |
| 28 dạng máy giải, giá trị mặc định | 0 lỗi, 0 NaN |
| Cực trị (0,001 và 1e6) | 3 trường hợp chia 0 → hiện hộp "Trường hợp đặc biệt" thay vì NaN |
| Thi thử 15 câu: chọn → lưu → F5 | Khôi phục đúng đề, đúng 6 đáp án, đồng hồ chạy tiếp |
| Trả lời trong Hỏi-đáp/Ôn | Hộp Leitner tăng, `due` đúng, không xoá dấu câu đã làm |
| Lab: 4 bàn ghi sổ → CSV | 4 dòng, xoá từng dòng OK |
| Số liệu lab | sắt: P 16,85 N · F 14,69 N · F_A 2,16 N · cân 0,57 kg · D 7800 kg/m³; nhiệt 600 g 80 °C + 300 g 20 °C → 60 °C, Q 50,4 kJ |

## Nội dung hiện có

13 ngày · 52 ca · 236 bài giảng · **213 câu luyện** · **168 hỏi đáp** · **22 bài giải mẫu** · 57 flashcard · **28 dạng máy giải** · 4 bàn thí nghiệm · **54 bộ đề** + 6 kho tải.

## Việc tiếp theo (đang xếp hàng)

1. Nút "Ghi số liệu" nhanh trên chính hình vẽ (không cần xuống bảng điều khiển).
2. Đồ thị Q–t cho bàn nhiệt, đường chuẩn hoá cho bàn quang.
3. Phiếu in: thêm phần "số liệu thí nghiệm của tôi" xuất từ sổ.
4. Giảm thời gian khởi động (hiện ~48 ms DCL, 522 KB HTML — chấp nhận được nhưng còn cắt được).

---

# Sprint 4 — lưu bền & cá nhân hoá (bản v12)

## 1 · Lưu 4 tầng, không phải cache

| Tầng | Nội dung | Vòng đời |
|---|---|---|
| **Bộ nhớ trình duyệt** (localStorage `vnl9.v2`) | toàn bộ tiến độ, đáp án, ghi chú, tuỳ biến | còn tới khi xoá site data |
| **3 bản dự phòng xoay vòng** (`vnl9.b1..b3`) | bản chụp mỗi 20 giây | tự thay nhau, hỏng 1 bản vẫn còn 2 |
| **Kho trình duyệt + lịch sử** (IndexedDB) | bản đầy đủ + **20 mốc thời gian**, khôi phục từng mốc | tự động mỗi phút hoặc bấm "Sao lưu ngay" |
| **Cookie `vnl9core`** (400 ngày) | cấu hình, pomodoro, mục tiêu, tiến độ gọn | sống cả khi xoá localStorage |
| **Tệp `.json`** | toàn bộ dữ liệu | người dùng giữ, nhập lại bất cứ lúc nào |

- Khi mở trang: đọc bộ nhớ máy → nếu trống/hỏng lấy bản dự phòng → cookie; **sau đó tự đồng bộ ngược từ IndexedDB** nếu kho có bản đầy đủ hơn (đã test: xoá sạch localStorage, reload vẫn lấy lại 2 câu + 1 ca và hiện "Đã khôi phục từ kho trình duyệt").
- Không dùng cache/session: dữ liệu là bản ghi thật, có giờ, xem lại được.

## 2 · Bảy bộ màu

Giấy cũ (mặc định, giữ đúng ngôn ngữ editorial), Đêm than, Rêu, Chì xanh, Hổ phách, **Pixel giấy**, **Pixel đêm**.

- Đổi tức thì, không nháy trắng (script nhỏ trong `<head>` áp màu trước khi vẽ).
- Theme pixel: viền dày, bóng khối 3px, chữ tiêu đề monospace, nền lưới 8px, mọi góc vuông.
- Đo tương phản sau khi chỉnh: chữ chính **14–18:1**, nút **11–16:1**, nhãn nhỏ **4–7:1** ở cả 7 theme.

## 3 · Tuỳ biến cá nhân (`#/settings`)

- Màu nhấn: 8 lựa chọn + màu gốc.
- Cỡ chữ 4 mức (0.92 → 1.18), mật độ Thoáng/Gọn, bo góc Sắc/Mềm, tắt chuyển động.
- Màn chào lần đầu: chọn tông ngay, có nút "Để sau", `Esc` để đóng.
- Lối vào: nút **Tuỳ biến** trên thanh trên cùng (máy tính) và **bánh răng** (điện thoại), cùng mục trong menu ngày.

## 4 · Pomodoro tự đặt

- **3 ô giờ tự nhập** (tập trung 1–180 phút, nghỉ 1–60 phút) — nhãn nút trong dock đổi theo (40/5, 50/10, 15/3…).
- **Kiểu đồng hồ**: **đồng hồ cát pixel-art** (mặc định) hoặc bản vẽ mảnh.
  - Sprite pixel vẽ trên lưới **26×32 ô**, mỗi ô là một khối màu: khung gỗ 3 sắc (sáng/chuẩn/tối), bình thuỷ tinh có phản chiếu, cát đỏ 2 sắc.
  - Cát **rút từng hàng** ở bình trên và **chất thành đống nón** ở bình dưới theo thời gian thật; có **dòng hạt rơi** ở cổ bình khi đang chạy; hết giờ **lật cả khối** 0,62 giây.
  - Chặng nghỉ: cát đổi sang **xanh lục** để thấy ngay đang nghỉ.
  - Co giãn theo bội số nguyên của lưới (78 px ở dock, 52 px bản thu nhỏ trên điện thoại) nên không bị nhoè.
- **Màu cát**: nhấn / lục / mực. **Chuông**: bật/tắt. Có ô xem trước ngay trong trang tuỳ biến.
- Trên điện thoại tự thu thành viên nhỏ (119×80), bấm vào để mở.

## Kiểm thử sprint 4

| Bài kiểm | Kết quả |
|---|---|
| 13 route × 2 khổ (1500 / 390) | 0 tràn ngang, 0 phần tử cắt, 0 lỗi console |
| Đổi theme → F5 | màu áp trước khi vẽ, không nháy trắng |
| Xoá sạch localStorage → F5 | khôi phục từ IndexedDB, toast báo rõ |
| Cookie còn, localStorage mất | nạp lại tuỳ biến + tiến độ gọn |
| Lịch sử: tạo mốc → thêm dữ liệu → khôi phục | trả về đúng 3 câu + ghi chú của mốc, có toast giờ khôi phục |
| Pomodoro 40/5 + pixel | nhãn nút đổi 40/5, 108 ô vẽ, đồng hồ 25:00 sau khi đặt lại |
| Tương phản 7 theme | chữ ≥ 14:1, nút ≥ 11:1, nhãn ≥ 4:1 |

---

# Sprint 5 — nhạc thông minh + 40 vòng đóng vai học sinh

## 1 · Nhạc nền không lấn bài giảng

- **Không tự phát**: mở trang chỉ thấy nút "▶ Phát nhạc nền"; iframe YouTube chỉ được dựng khi người dùng bấm → không tải nặng, không tự ồn.
- **Thanh âm lượng 0–100%** (mặc định 35%), có nút **tắt tiếng**, nút **■ dừng** (dọn hẳn iframe).
- **Ba cách cư xử khi mở bài giảng**: *Nhỏ còn 12%* (mặc định) · *Tạm dừng* · *Giữ nguyên* — chọn ngay trong panel.
- Kỹ thuật: iframe có `enablejsapi=1`, điều khiển bằng `postMessage` (`setVolume`, `pauseVideo`, `playVideo`) + **giảm dần 8 bước × 60 ms** nên không bị giật âm lượng.
- **Phím M** tắt/bật tiếng nhạc ở bất kỳ trang nào (trừ khi đang gõ và trừ trong phòng thi).
- Đóng video hoặc rời trang khi đang mở video → nhạc **tự trả lại âm lượng cũ**.

## 2 · Mặc định đã đổi

- Pomodoro: **đồng hồ cát pixel** là kiểu mặc định; dữ liệu cũ được chuyển đổi một lần (đánh dấu `v: 2`).

## 3 · 40 vòng backtest đóng vai học sinh

Hai bộ kiểm tự động, chạy trong trình duyệt thật, mỗi vòng là một tình huống học sinh gặp:

| Bộ | Nội dung | Kết quả |
|---|---|---|---|
|---|---|---|
| `tools/qa/student20.js` (vòng 1–20) | mở trang → chào lần đầu → đổi tông → trang chủ → đánh dấu ca → luyện trong ca → hộp Leitner → phím thi → nộp + luyện câu sai → tự lưu đề → máy giải → lab ghi số liệu → tìm không dấu → sổ tay + flashcard → hỏi đáp → đề + luyện → nhạc/âm lượng → pomodoro pixel → tương phản theme tối → xuất/nhập sao lưu | **22/22** |
| `tools/qa/student40b.js` (vòng 21–40) | không tự phát nhạc → nút phát → enablejsapi → âm lượng 0/100 → tự nhỏ khi mở bài giảng → chế độ tạm dừng → phím M → nút dừng → đồng hồ cát pixel → màu cát → hết giờ tự nộp → chống mất bài → mục tiêu tuỳ chỉnh → lịch + chẩn đoán → xuất CSV → tìm từ khoá → link thẳng tới luyện tập → mật độ/bo góc → tắt chuyển động → không lỗi JS | **20/20** |

**Tổng: 42/42 vòng, 0 lỗi console.** Chạy lại hai lần liên tiếp đều 42/42 → bộ test **lặp lại được** (đã dọn trạng thái tồn đọng trước mỗi vòng).

### Lỗi tìm ra và đã sửa trong vòng test này

1. Không có link đi thẳng vào phần luyện của ca → thêm `#/lesson/3/2?pane=quiz`.
2. Bấm phím số ở câu điền số thì im lặng, học sinh tưởng web hỏng → nay báo "Câu này điền số — gõ đáp án rồi Enter".
3. Nút "Đề mới" xoá bài đang làm không hỏi → nay hỏi lại nếu đã chọn đáp án.
4. Nhạc tự phát khi mở panel → nay chỉ phát khi bấm.
5. Phím M bị chặn nhầm khi vừa bấm nút → sửa sang đọc `e.target`.
6. Hết giờ thi không có tín hiệu → thêm chuông nhẹ + toast "Hết giờ — đã tự nộp bài".
7. Không biết còn bao lâu mới xong lộ trình → thêm dòng **ETA** theo nhịp học thật ("Còn 51 ca · nhịp 1,2 ca/ngày ⇒ khoảng 43 ngày nữa").
8. Không có chỗ tra phím tắt → gõ **?** ra bảng 10 phím.
9. Panel nhạc trên điện thoại che mất bài → giới hạn 74vh, cuộn trong panel.
10. Đang mở video mà đổi trang thì video cũ còn treo → tự đóng và trả âm lượng nhạc.
11. **Phím F cắm cờ không có tác dụng** sau khi vào/ra trang thi vài lần: mỗi lần vẽ lại đề lại gắn thêm một listener bàn phím trên `document`, nên một lần bấm bị xử lý 2 lần (bật rồi tắt ngay). Đã gắn bộ gỡ `__examUnbind` dùng chung, gỡ trước mỗi lần vẽ → bấm F bật/tắt đúng.
12. **Rò nhịp đồng hồ cát**: `mountPomo()` gọi `setInterval` mới mỗi lần đổi kiểu/màu cát mà không xoá nhịp cũ → đổi 10 lần là 10 nhịp cùng chạy. Nay giữ một nhịp duy nhất trong `window.__pomoTick`.
13. Panel nhạc trên máy 390 px bị dài quá màn hình → nay cao tối đa `min(74vh, 600px)` và tự cuộn trong panel (đo được 424 px, không tràn ngang).
14. Không biết tiến độ thật → thêm dòng **ETA** ngay dưới hàng số liệu ở trang chủ ("Còn 51 ca. Học đều 4 ca/ngày là xong trong 13 ngày" / khi đã có nhịp: "… nhịp hiện tại 1,2 ca/ngày ⇒ khoảng 43 ngày nữa").
15. Không tra được phím tắt → gõ **?** ra bảng 10 phím, Esc đóng. (Bảng này lúc đầu bị kéo cao hết màn hình vì `.ov-panel` là flex bị stretch → đã cho `align-self:flex-start`, giờ cao đúng 551 px.)

---

# Sprint 6 — Bảng mạch: gõ công thức là ra hình, kéo thả như PhET

Thay hẳn công cụ "Mạch tự dựng" cũ (cây nút +R / +— / +∥ phải bấm lia lịa) bằng **một bảng mạch duy nhất** — `#/build`.

## 1 · Gõ công thức, hình tự hiện

| Gõ | Máy hiểu | Kết quả |
|---|---|---|
| `R1 // R2 nt R3` | `(R1 // R2) nt R3` | 5 + 10 = **15 Ω** |
| `(R1 nt R2) // R3` | giữ nguyên | **6,67 Ω** |
| `R1 nt (R2 // R3) nt R4` | giữ nguyên | **15 Ω** |
| `U=9 r=0.5 (R1 nt R2) // (R3 nt Đ1)` | nguồn + mạch | I = **0,96 A** |

- Nhận `nt`, `+`, `//`, `|`, `∥`, `nối tiếp`, `song song`, ngoặc tròn lồng nhau bao nhiêu tầng cũng được.
- `//` **chặt hơn** `nt` (như nhân trước cộng), nên dòng "Máy hiểu" luôn in lại đầy đủ ngoặc để không đọc nhầm.
- Viết `R1=10`, `R1 10`, `Đ1=6`, `A1`, `K1`, `V1`, `U=12`, `r=0.5` ngay trong công thức.
- Gõ sai → viền đỏ + câu giải thích ("Thiếu dấu )", "Công thức bị cụt…"), hình cũ **không bị xoá**.
- Sơ đồ vẽ theo tỉ lệ thật: nối tiếp dàn ngang, song song thành thang hai thanh bus, có chấm nối ở điểm ba nhánh, chiều dòng bằng hạt chạy (nhanh theo cường độ).

## 2 · Kéo thả linh kiện như phòng thí nghiệm ảo

- Hộp linh kiện bên trái: **điện trở, bóng đèn, công tắc, ampe kế, vôn kế** — kéo xuống bảng là chèn đúng chỗ con trỏ, có **con trỏ dọc** báo chỗ sẽ chèn.
- Kéo một linh kiện đang có để **đổi vị trí** trong nhánh, sang nhánh khác, hoặc xuống vùng trống = tách thành **nhánh song song mới**.
- Kéo ra **thùng rác** hiện ở góc là xoá.
- Kéo **V** thả lên một điện trở = **mắc vôn kế song song** (dây nét đứt + số chỉ ngay trên hình), không phá mạch.
- Bấm (không kéo) một linh kiện → **bảng sửa tại chỗ**: đổi loại, kéo thanh trượt R (0,5–100 Ω), gõ số trực tiếp, đóng/mở công tắc, dịch ◀ ▶, xoá. Số liệu toàn mạch nhảy theo từng mili-giây kéo.
- Bóng đèn **sáng dần theo điện áp**, công tắc vẽ đúng tư thế đóng/mở, ampe kế/vôn kế hiện số đo trong hình.
- Bàn phím: `Tab` tới hộp linh kiện rồi `Enter` để thêm; `Delete` xoá linh kiện đang chọn; `Ctrl+Z` hoàn tác (40 bước); `Esc` đóng bảng sửa; nhấp đúp vào linh kiện là mở ô số để gõ ngay.
- Trên điện thoại: 5 ô linh kiện nằm gọn một hàng, sơ đồ rộng thì **vuốt ngang** trong khung (không đẩy cả trang).

## 3 · Đo được, lưu được

- Bốn số lớn: R tương đương · I toàn mạch · U hai đầu mạch · công suất.
- Bảng từng linh kiện: R, I, U, P, số chỉ ampe/vôn kế.
- Cảnh báo tự động: mạch hở (công tắc mở hoặc vôn kế nối tiếp), ngắn mạch, bóng đèn quá 6 V.
- **Lưu vào phiếu**, **tải hình SVG** (mở được trong Word/PowerPoint), và lưu bền qua tải lại như mọi dữ liệu khác.

## 4 · Kiểm tự động

`tools/qa/board.js` — 17 vòng: mở trang · công thức → hình · `//` chặt hơn `nt` · ngoặc đổi kết quả · U/r trong công thức · báo lỗi công thức · kéo thả thêm linh kiện · vôn kế song song · bảng sửa tại chỗ · sửa giá trị → tính lại · đổi loại linh kiện · công tắc mở → mạch hở · hoàn tác · kéo vào thùng rác · ghi xuống kho lưu · tải SVG · không lỗi JS. **17/17, 0 lỗi console.**

Ba bộ cũ vẫn xanh sau khi thay trang: `student20` **22/22**, `student40b` **20/20**, audit 13 tuyến ở 1500×1000 và 390×844 **0 tràn**.

---

# Sprint 7 — đủ nguồn điện, tự căn hình, và ba bàn ánh sáng – chuyển động

## 1 · Bảng mạch: đủ loại nguồn như phòng thực hành

| Nguồn | Vẽ ra | Ghi chú |
|---|---|---|
| **Pin** | một cell 1,5 V · r = 0,2 Ω | đúng chiều dài — ngắn |
| **Bộ pin** | n cell nối tiếp (1–6) | đổi n là **U tự nhảy theo** 1,5 × n |
| **Nguồn điều chỉnh** | hộp có mặt số + núm vặn | 0–24 V, vặn liên tục như máy thật |
| **Nguồn xoay chiều** | vòng tròn có dấu ~ nhấp nháy | 12 V hiệu dụng, tần số 1–100 Hz |

Công thức vẫn gõ được `U=9 r=0.5` để đặt nguồn bằng chữ.

## 2 · Tự căn lại hình

- Khung vẽ **tự co giãn** đúng bằng mạch (không còn khoảng trống hai bên), sơ đồ **luôn căn giữa**.
- Nút **Tự căn lại**: gộp các nhóm cùng phép (nối tiếp lồng nối tiếp), bỏ nhóm rỗng, gỡ nhóm chỉ có một phần tử, **đánh số lại tên** R1, R2… Đ1… A1… cho liền mạch, rồi vẽ lại với hiệu ứng "xếp vào chỗ" 0,42 s.
- Mọi lần thêm/bớt/kéo thả đều vẽ lại và căn lại ngay — không bao giờ có hình lệch khung.

## 3 · Băng thí nghiệm (menu **Thí nghiệm**, `#/sim`)

| Bàn | Kéo được | Số đo hiện ngay |
|---|---|---|
| **Khúc xạ** | góc tới 0–89°, hai môi trường (không khí / nước / thuỷ tinh / kim cương) | i, r, góc giới hạn; qua môi trường chiết quang hơn thì **phản xạ toàn phần** tự hiện, tia khúc xạ biến mất |
| **Bóng tối** | kéo vật cản, chỉnh bề rộng nguồn và chiều cao vật | hai dải **bóng tối / bóng nửa tối** đo bằng cm, vẽ đúng 4 tia biên; thu nguồn về 1 px là bóng sắc cạnh |
| **Động năng** | kéo m, h₀, μ; nút Thả bóng chạy thật | thanh năng lượng sống: động năng · thế năng · **mất do ma sát**, vận tốc tức thời, quãng đường; dốc cao đúng bằng h₀ (đổi h₀ là dốc cao lên) |

Cả ba bàn đều ghi được số liệu vào **sổ thí nghiệm** chung (xuất CSV như cũ).

## 4 · Kiểm tự động

`tools/qa/sim.js` — **19/19**: ba bàn · khúc xạ đúng định luật · tăng góc tới → r tăng · phản xạ toàn phần · bóng tối + nửa tối · nguồn hẹp → bóng sắc · kéo vật cản bằng chuột · dốc cao đúng h₀ · bóng lăn · μ = 0 chạy hết băng · cơ năng bảo toàn · 4 loại nguồn · nguồn xoay chiều · n pin → U · nguồn điều chỉnh · tự căn đánh số tên · sơ đồ căn giữa · khung tự co · không lỗi JS.

Các bộ cũ vẫn xanh: `board` **17/17**, `student20` **22/22**, `student40b` **20/20**; audit **15 tuyến** × (1500×1000, 390×844) — **0 tràn, 0 lỗi**.

---

## Sprint 8 — Trường học lớp 1 → 12, mọi môn

**Mục tiêu:** mở rộng từ một khoá Vật lí 9 thành một trường học dùng được cho mọi lớp, mọi môn — có tự soạn bài, tải tệp lên, chia sẻ bài qua tệp.

### Đã dựng
- **`src/school.js`** — 19 môn (`SUBJECTS`), ghi chú từng lớp (`GRADE_NOTE`), 6 trang:
  `#/subjects` (chọn lớp 1–12 → chọn môn), `#/subject/g/s` (danh sách bài), `#/read/id` (đọc bài),
  `#/studio[/id]` (soạn bài), `#/mine` (bài của tôi), `#/files` (kho tệp).
- **`src/seed_more.js`** — 34 bài bổ sung, phủ **đủ 12 lớp**, 13 môn: Toán (1→12), Ngữ văn (1,2,4,5,6,9,12),
  Tiếng Anh (6,9,10), Vật lí (7,10,11,12), Hoá (8,9,10,12), Sinh (9,11), Sử–Địa (9,12), GDCD (9,12),
  Tin (9,11,12), Công nghệ (9), TNXH (2), Khoa học (4), KHTN (6).
- **Kho tệp IndexedDB `vnl9files`** — ảnh thu nhỏ cho ảnh, lọc theo loại (Ảnh/PDF/Word/Bảng tính),
  thanh dung lượng, kéo–thả ở cả ô thả và toàn trang, giới hạn 40 MB/tệp, xem trước ngay trong trang.
- **Studio** — 4 mẫu khởi đầu (bài giảng · tóm tắt công thức · đề luyện 3 câu · phiếu thí nghiệm),
  **xem trước sống** cập nhật theo từng phím, đánh số khối, đổi thứ tự, gắn tệp, xuất/nhập `.json`.
- **Đọc bài** — thanh tiến độ đọc, chuyển bài trước/sau (nút + phím ← →), bài cùng môn,
  nút in (có `@media print` riêng), dấu ✓ đã đọc, thẻ "Đọc tiếp" trên trang chọn lớp.
- **Điều hướng** — thanh trên gom thành chip `Lớp 9 · Vật lí` + menu "Khám phá ▾";
  rail có khối Trường học (đổi lớp/môn, tạo bài, bài của tôi, kho tệp) đứng trên lộ trình Vật lí 9.
- **Tìm kiếm ⌘K** — thêm bài học mọi lớp, bài tự soạn và **tên tệp trong kho**; khớp cả cụm được cộng điểm.
- **Trang chủ** — dải "Trường học · lớp 1 đến lớp 12" dẫn vào 3 lối: chọn lớp & môn / tạo bài / kho tệp.
- **Trang môn Vật lí 9** — khối "khoá đầy đủ" 8 lối vào: lộ trình 13 ngày, máy giải, bảng mạch,
  phòng thí nghiệm, băng thí nghiệm, thi thử, 54 bộ đề, sổ tay công thức.

### QA
- `tools/qa/school.js` — **26/26**: mở khoá học, đổi lớp, nhớ lớp, danh sách bài, trang đọc, môn trống,
  tạo bài, bài vào đúng môn, sửa bài, bài của tôi, xuất `.json`, tải tệp, xem trước, IndexedDB,
  gắn tệp vào bài, menu Khám phá, lọc tệp + ảnh thu nhỏ, dung lượng, chuyển bài, tiến độ đọc,
  xem trước sống, tìm kiếm, dọn dữ liệu thử, 0 lỗi JS.
- Hồi quy: `board` 17/17 · `sim` 19/19 · `student20` 22/22 · `student40b` 20/20.
- `audit` **21 tuyến** (thêm `#/subjects`, `#/subject/9/vatli`, `#/read/seed0`, `#/studio`, `#/mine`, `#/files`)
  ở 1500×1000 và 390×844: **0 tràn, 0 lỗi**.

### Bài học kỹ thuật
- Tên lớp CSS toàn cục dễ đụng: nút xoá dùng `.bkbtn.danger` bị `.danger{margin-top:16px}` của trang khác đè →
  đổi thành `.bkbtn.del`.
- Grid dùng `gap:1px` + nền `--rule` sẽ lộ dải beige khi thiếu ô → chuyển sang thẻ có viền riêng.
- `.wrap` có `padding:0 30px` nên `.school-strip` phải `padding:0`, nếu không nền lưới lộ thành dải.
- `renderRail()` chạy **trước** route nên lớp/môn hiển thị trễ một nhịp → thêm `syncScope()` gọi lại
  `renderTop()+renderRail()` ở cuối các trang đổi phạm vi.
- `openPalette()` giữ biến `PAL` sau khi lớp phủ bị gỡ tay → kiểm `document.body.contains(PAL)` mới tái dùng.
- `readProgOff` phải kiểm null trước khi gọi, nếu không toàn bộ phần còn lại của `renderRead` bị dừng.

---

## Sprint 9 — Study OS: tự học từ A→Z

**Mục tiêu:** không chỉ "có tài liệu để đọc" mà là **một hệ thống dạy bạn học**: biết hôm nay làm gì, nhớ lâu bằng lặp lại cách quãng, luyện đúng chỗ yếu, giữ nhịp bằng kế hoạch và đồng hồ.

### Đã dựng (`src/study.js`)
- **`#/study` Học hôm nay** — chào theo giờ, vòng tròn mục tiêu phút, 4–5 việc của ngày (tự đổi theo dữ liệu),
  heatmap 12 tuần, KPI thẻ, tiến độ từng môn của lớp đang chọn, ghi chú gần đây, nhắc kế hoạch, sao lưu dữ liệu.
- **`#/cards` Thẻ ghi nhớ** — lặp lại cách quãng 7 hộp (10 phút → 1 → 2 → 4 → 8 → 16 → 32 ngày),
  4 mức tự chấm (Quên/Khó/Được/Dễ) + phím 1–4 và Space, tạo thẻ từ câu hỏi trong bài (một cú bấm), xoá thẻ.
- **`#/practice` Luyện đề tự tạo** — gom **41 câu hỏi** từ toàn bộ bài học mọi lớp/môn, lọc theo lớp + môn + số câu,
  tự chấm đúng/sai, lưu lịch sử, tạo thẻ từ câu sai, làm lại riêng câu sai.
- **`#/plan` Kế hoạch học** — nhập ngày thi + số phút/ngày → chia **đều từng ngày** (đọc bài, ôn lại, luyện đề, thẻ, thi thử),
  tick tiến độ, mở đúng ngày hôm nay.
- **`#/focus` Đồng hồ tập trung** — 15/25/45/50 phút, chạy tiếp khi đổi trang, tự ghi nhật ký + chuông, biểu đồ 7 ngày.
- **`#/progress` Tiến độ tổng** — 5 KPI, **gợi ý việc nên làm tiếp** (ưu tiên thẻ đến hạn → môn yếu → mục tiêu ngày),
  phút học tuần này vs tuần trước, heatmap, độ chính xác theo môn, vòng đời thẻ, chủ đề Vật lí 9 cần vá, in báo cáo.
- **Trong trang đọc bài** — ô **Ghi chú**, ô **Giảng lại bằng lời của em** (Feynman), nút **Đọc thành tiếng** (Web Speech, chạy trong máy),
  nút **Thành thẻ ghi nhớ**.
- **Sao lưu / khôi phục** — xuất toàn bộ dữ liệu học (thẻ, ghi chú, kế hoạch, nhật ký, bài tự soạn, đáp án) ra `.json`, nhập lại được.
- Điều hướng: khối **Học hôm nay** đứng đầu rail, 5 mục con; thanh "Khám phá" có nhóm Tự học; ⌘K thêm 6 trang;
  trang chủ có dải **Học hôm nay** hiện số phút hôm nay.

### QA
- `tools/qa/study.js` — **21/21**: dashboard, thêm thẻ, tạo thẻ từ bài, ôn + giãn hạn, luyện đề, lưu kết quả,
  dựng kế hoạch **11 ngày**, tick mục, đồng hồ đếm ngược, nhật ký phút, ghi chú/Feynman, ghi chú lên dashboard,
  đọc thành tiếng, heatmap, nhắc kế hoạch, tiến độ tổng, sao lưu, phím tắt không rò trang, dọn dữ liệu, 0 lỗi JS.
- Hồi quy: `school` 26/26 · `board` 17/17 · `sim` 19/19 · `student20` 22/22 · `student40b` 20/20.
- `audit` **27 tuyến** × (1500×1000, 390×844): **0 tràn, 0 lỗi**.

### Bài học kỹ thuật
- `document.onkeydown` gán trực tiếp trong thẻ/luyện đề sẽ **rò sang trang khác** → thay bằng `syBindKeys`/`syCleanup`
  và gọi `syCleanup()` trong router.
- Kế hoạch phải **trải đủ mọi ngày** kể cả khi ít bài: chèn mục "ôn lại" cho đủ `total` ngày thay vì dừng sớm.
- Chọn "bài đọc tiếp" nên ưu tiên bài **có câu hỏi** để nút tạo thẻ luôn có việc.
- `#/read/seed0` có thể là bài của lớp khác → phải có nhánh `allLessons()` dự phòng.

---

## Sprint 10 — Thời khoá biểu · Kế hoạch · Lịch · Chữ ký tác giả

**Mục tiêu:** biến web thành **nơi tổ chức việc học thật** — không chỉ đọc và ôn, mà còn *xếp lịch*: tuần này học gì, mấy giờ, khi nào thi, in ra dán tường.
Đồng thời làm giao diện **basic – sang trọng** hơn (thêm 6 bảng màu mực/giấy) và gắn **tag `@nggkhaiz`** ở những chỗ người học thật sự nhìn thấy.

### Đã dựng (`src/schedule.js`)
- **`#/timetable` Thời khoá biểu** — lưới tuần 2→7 (hoặc 2→CN), chia **sáng/chiều**, số tiết sáng/chiều chỉnh được;
  nhiều bảng (chính khoá / ôn thi / lịch hè), đổi tên, xoá, nhân bản; **bấm ô để thêm môn – tiết – GV – màu** tại chỗ;
  **"Tự xếp môn"** mở bảng nhập nội trang (không dùng `prompt`), chia đều các môn đã nhập vào toàn bộ ô trống,
  tô màu theo 12 màu bảng; **"In / lưu PDF"** có dòng ký tên `@nggkhaiz · github.com/Ngg.Khaiz` trên bản in.
- **Đưa vào lịch tuần này** — một nút biến từng tiết của thời khoá biểu thành việc có giờ trong lịch
  (sáng 07:00–11:05, chiều 13:30–17:40), **chống trùng** theo ngày + tên + nguồn, báo số tiết đã thêm.
- **`#/calendar` Lịch** — tháng và tuần, ô ngày 104px, chấm + việc theo màu loại (thi / deadline / buổi học / khác);
  thêm–sửa–xoá việc, đặt giờ, ghi chú, tick xong ngay trên lịch; chuyển tuần/tháng, về hôm nay.
- **Xuất `.ics`** — tải cả lịch về máy để nhập vào Google/Apple Calendar (giờ, ghi chú, màu, sự kiện cả ngày).
- **Học hôm nay có thêm khối "Hôm nay có gì"** — chip giờ + tên việc hôm nay, ô **đếm ngược ngày tới kỳ thi gần nhất**, nút mở lịch.
- **`#/about` Giới thiệu** — chủ sở hữu, GitHub, những gì web làm được, nguyên tắc dữ liệu (lưu trong máy, không gửi đi đâu).
- **Chữ ký tác giả** ở hero trang chủ, thanh trên, chân trang, trang giới thiệu, tiêu đề tab, bản in.

### Giao diện
- Thêm 6 theme **basic – sang trọng**: `ivory`, `bordeaux`, `ink`, `lotus`, `graphite`, `ocean` (tổng **13 theme**, 14 màu nhấn),
  chữ và viền tính theo giấy–mực chứ không phải gradient tím.
- Sửa tương phản theme tối: `.rs-main` (rail lộ trình) trước đây chữ gần như vô hình trên nền giấy sáng → override riêng cho `midnight`/`graphite`/`pixelnight`.
- Hộp thoại nội trang dùng chung `uiPrompt` / `uiCardForm` — **bỏ sạch `prompt()`/`confirm()`** để chạy được trong iframe, trên máy tính bảng và khi in.

### QA
- `tools/qa/sched.js` — **21/21**: lưới 48 ô · tạo bảng · tự xếp 47 tiết · sửa tiết tại chỗ · xoá tiết · đổi số ngày ·
  lịch 42 ô · thêm việc · màu theo loại · tick xong · xem tuần · chuyển tuần · 6 theme mới · about `@nggkhaiz` ·
  tag topbar/footer · ký tên khi in · **xuất .ics đọc lại được** · **đưa thời khoá biểu vào lịch có chống trùng** ·
  **khối "Hôm nay có gì" + đếm ngược thi** · dọn dữ liệu · 0 lỗi JS.
- `audit` **30 tuyến** × (1500×1000, 390×844): **0 tràn, 0 lỗi**.
- Hồi quy: `study` 21/21 · `school` 26/26 · `board` 17/17 · `sim` 19/19.

### Bài học kỹ thuật
- Trong `calEditor` có `const esc = e => …` (phím Escape) **che mất helper `esc()` toàn cục** → `TypeError` khi mở hộp thoại việc mới.
  Đổi thành `onEsc`. **Luật mới: không đặt biến cục bộ trùng tên helper (`esc`, `$`, `toast`) trong hàm render.**
- `prompt()` bị chặn trong iframe/playwright → mọi chỗ nhập liệu phải dùng hộp thoại nội trang.
- Nạp thời khoá biểu vào lịch phải **dedupe theo `date + title + src`**, nếu không bấm hai lần sẽ nhân đôi 42 việc.
- Ô lịch tháng phải cao tối thiểu 104px mới đọc được 2–3 việc; chấm màu thay vì nhồi chữ.

### Vá thêm cuối Sprint 10
- **Lịch trống có lối vào**: dải “Lịch đang trống” + hai nút *Việc đầu tiên* / *Lấy từ thời khoá biểu*; nếu thời khoá biểu còn trống thì tự nhảy sang
  `#/timetable` kèm nhắc “xếp môn trước đã nhé”.
- **"Tự xếp môn" nhận cả dấu phẩy, chấm phẩy và xuống dòng**, tự bỏ môn trùng — trước đó chỉ tách dấu phẩy nên dán danh sách nhiều dòng bị dồn thành một môn.
- **Chống trùng khi đổ thời khoá biểu vào lịch** đổi khoá sang `ngày + giờ + tên + nguồn`: cùng môn hai tiết trong một ngày vẫn vào đủ, bấm lại lần hai không nhân đôi (47 tiết → 47 việc, lần hai +0).
- **Khối “Hôm nay có gì” luôn hiện** trên Học hôm nay; chưa có ngày thi thì hiện ô “Chưa đặt” dẫn tới lịch, thay vì ẩn cả khối.
