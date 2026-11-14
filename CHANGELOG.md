# Changelog

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/), phiên bản theo [SemVer](https://semver.org/lang/vi/).
Mọi thay đổi lớn đều có kiểm thử: `npm test` (check tĩnh + CSP + Worker + mô phỏng Workers + 1848 bước jsdom).

## [11.8.0] — 2026-11-14

Bản này không thêm tính năng. Nó sửa **những chỗ dữ liệu của người dùng có thể
mất mà không ai báo** — loại lỗi tệ nhất trong một app học tập, vì người dùng
chỉ phát hiện sau khi đã học xong một buổi.

### Mất tiến độ trong im lặng

`AppStore.write()` nuốt mọi ngoại lệ và không trả về gì. Khi localStorage đầy
(hoàn toàn thực tế: bản chính + 3 bản dự phòng, mỗi bản một bản sao đầy đủ),
lệnh ghi ném `QuotaExceededError`, bị nuốt, và **giao diện vẫn báo "Đã lưu"**.
Đo được trước khi sửa: 1 lần ghi, 0 thông báo, 0 lưu.

- `write()` giờ **trả về true/false**; `save()` đọc kết quả và báo cho người dùng;
- khi hết chỗ, **tự bỏ 3 bản dự phòng cũ để cứu bản chính** (bản chính là thứ
  được đọc khi mở app; dự phòng là thứ bỏ được) rồi ghi lại;
- hỏng hẳn thì phát `store:issue`, hiện toast *"Bộ nhớ trình duyệt đã đầy —
  tiến độ mới chưa lưu được…"* và **một khối cảnh báo trong Cài đặt → Dữ liệu**
  kèm giờ hỏng và lời khuyên xuất tệp ngay;
- `AppStore.health()` công bố lỗi gần nhất để giao diện đọc được.

### Nhập tệp sao lưu: 3 lỗi

- **ô nhiễm prototype**: `importText()` trả nguyên object trong tệp, kể cả khoá
  `__proto__` / `constructor`. Giờ có **danh sách trắng 25 khoá** + bộ lọc đệ quy
  bỏ mọi khoá nguy hiểm ở mọi độ sâu, chặn vòng lặp, chặn độ sâu và số nút.
- **trộn đáp án cũ**: `Object.assign(state, s)` để lại câu trả lời của máy cũ
  bên cạnh câu của tệp. Hai máy trùng id câu hỏi thì **đáp án đúng bị đáp án cũ
  đè**. Giờ `ans`/`done`/`prefs`/`doneAt` được **thay cả bảng**, các trường khác
  vẫn gộp.
- **không giới hạn kích thước**: một tệp 200 MB làm treo tab trước khi kịp báo
  "sai định dạng". Giờ từ chối trước khi `JSON.parse` ở ngưỡng 4 MB.
- giao diện **nói thật** khi tệp có phần bỏ đi: *"Đã nhập 42 câu trả lời · bỏ 3
  mục không hợp lệ"* thay vì "thành công" chung chung.

### Dữ liệu sai kiểu làm trắng trang

Ba lỗi thật, tìm bằng cách tiêm 13 dạng hỏng qua đúng đường người dùng
(`localStorage → readSync → loadState`) rồi đi hết 39 tuyến:

- `done: null` → `doneCount()` ném lỗi → mất thanh ray, trang chủ và **mọi**
  thanh tiến độ, trong khi Cài đặt vẫn báo lưu bình thường;
- `school: "x"` → `Object.keys(S.lessons)` ném lỗi → chết trang Bài của tôi;
- `school: {}` → `lessonList()` / `lessonById()` ném lỗi.

Sửa ở **một cửa**: `AppStore.coerce()` chuẩn hoá kiểu cho mọi lần đọc
(localStorage, bản dự phòng, cookie, IndexedDB), `schoolState()` kiểm tra kiểu
thay vì chỉ kiểm tra null, và các chỗ đọc nóng dùng `doneMap()`. Thêm
`tests/resilience.js`: **17 dạng hỏng × 39 tuyến × 2 điều kiện + đường nhập tệp
= 1399 bước**.

### Vòng xoay bản dự phòng và lịch sử

- Bản sao lưu chỉ được tạo sau **20 giây** kể từ lần ghi đầu — một phiên ngắn
  chưa kịp có bản dự phòng nào, hỏng một lần là mất trắng. Giờ vòng xoay được
  **mồi ngay** khi chưa có bản dự phòng.
- Dọn lịch sử IndexedDB cũ chạy `while` 20 vòng, **mỗi vòng xoá cả object store
  rồi chèn lại toàn bộ**. Giờ cắt một lần rồi ghi lại.

### Điều hướng: 48 lối ra phẳng → một thanh có nhóm

Thanh ray trước đây có **48 liên kết phẳng**, trong đó **6 lối bị lặp**
(Máy giải, Bảng mạch, Thí nghiệm, Vật lí, Học hôm nay, Khoá học) và **9 tuyến
không có lối vào nào** (thư viện, sổ tay, đề thi, hỏi đáp, ôn câu sai, máy giải,
bảng mạch, thí nghiệm, tiến độ).

- thanh ray giờ chỉ còn **phần dùng hằng ngày, không lặp**;
- phần còn lại nằm trong **ngăn kéo chia 5 nhóm có tiêu đề** (Vật lí · Học ·
  Trường lớp · Nội dung · Tuỳ biến), đóng sẵn, mở/đóng được và **nhớ trạng thái**;
- tự **mở sẵn** khi tuyến đang mở chỉ nằm trong ngăn kéo, nếu không người dùng
  vào thẳng `#/papers` sẽ thấy không có mục nào được chọn;
- **quy tắc kiểm tra mới** bắt liên kết nội bộ trỏ tới tuyến không tồn tại — và
  nó bắt được một liên kết chết thật (`#/nested`) ngay khi viết ra.

### Hiệu năng

`renderTop` / `renderRail` / `renderHome` chỉ dựng lại khi dấu hiệu đổi, có
kiểm tra khung còn sống trong DOM (tái sử dụng markup đã bị trang khác xoá là
cách im lặng nhất để trang trắng). Dấu hiệu của trang chủ **có cả tuyến đang
mở** — hash lạ rơi xuống chính hàm đó, thiếu tuyến là trang cũ sống sót.
A/B trên bản build thật: **1.4–1.6× nhanh hơn** khi đi lại giữa các trang.

### Kiểm thử

`npm test` giờ **1848 bước**: 8 bộ, thêm `resilience`; quy tắc tĩnh thứ 9
(liên kết chết) với ca kiểm tra ngược để chắc nó bắt được lỗi thật.

## [11.7.0] — 2026-11-14

### Vật lí đứng đầu — và luôn đứng đầu

Trước đây muốn vào Vật lí phải mở menu **Khám phá** rồi tìm giữa 36 mục, dù
Vật lí là nội dung lớn nhất sản phẩm (52 ca, 236 bài giảng, 8 công cụ). Giờ:

- **nút riêng trên thanh trên**, nền màu nhấn, kèm tiến độ `7/52` — không thể
  không thấy;
- **khối đầu tiên trong ngăn kéo** có thanh tiến độ và bốn lối tắt;
- **thẻ đầu tiên trên trang chủ**, trước cả thẻ tự học;
- nhưng vẫn **đổi được** trong Tuỳ biến nếu bạn dùng phần Trường học nhiều hơn.
  Mặc định là Vật lí; áp đặt thì không.

### Tuỳ biến — mục bị bỏ quên

Sáu mục không có mục lục, chữ phụ dưới ngưỡng tương phản, và **không có chỗ nào
đổi cách đọc bài**. Giờ:

- **cột mục lục dính bên trái** (thành thanh ngang trên điện thoại), đường dẫn
  sâu `#/settings?s=read` mở đúng mục;
- **mục Đọc mới**: độ dài dòng 48–92 ký tự, giãn dòng 1.5–2.0, gạch chân liên
  kết — cả ba áp vào **bài đọc thật**, có ô xem trước;
- **mục Bắt đầu mới**: chọn trang mở đầu và kiểu ngăn kéo;
- chữ phụ `--ink-3` từ **4.21:1 lên 5.26:1** (AA cho chữ thường, trước đó trượt);
- **132 khai báo cỡ chữ 7–8.5px gộp thành một biến `--micro`**, và nó **co theo
  cỡ chữ người dùng chọn** — trước đây chọn "Rất lớn" vẫn có nhãn 7px.

### Tâm lí học: "nếu … thì …"

Việc duy nhất trong tâm lí học hành vi có bằng chứng mạnh và lặp lại được là
**ý định thực hiện** (Gollwitzer; meta-analysis Gollwitzer & Sheeran 2006,
~94 nghiên cứu, d ≈ 0.65). Người viết "nếu <tình huống> thì tôi <hành động>"
làm đúng kế hoạch nhiều hơn hẳn người chỉ đặt mục tiêu.

Đặt trong sản phẩm, có chủ đích:

- hỏi ở **trang Học hôm nay** — lúc người dùng đang định học, không phải lúc
  onboarding (hỏi lúc onboarding chỉ tạo ra một câu điền cho xong);
- **ba ô có gợi ý**, không phải một ô văn xuôi — văn xuôi tự do không gắn được
  với dấu hiệu nào;
- **hiện lại trên trang chủ** — chính việc nhìn lại là phần có tác dụng;
- **tối đa hai câu**, xoá được, "Để sau" thì không hỏi lại.

### Điều hướng: hết ngõ cụt

Đo được: **24 trong 36 trang là ngõ cụt** — chỉ còn thanh trên để thoát, mà
trên điện thoại nghĩa là mở ngăn kéo. Giờ mọi trang con có **dải "Đi tiếp"**
(3 gợi ý, gợi ý đầu là bước kế tiếp thật: làm đề xong → xem câu sai) và **nút
lùi**. `#/weekly` là trang duy nhất không có `<h1>` — đã có.

**Học tiếp giờ trỏ đúng chỗ đang dở.** `state.last` được ghi mỗi lần vào ca
nhưng **không ai đọc**: mở ca 5, đóng tab, mở lại thì nút đưa về ca 1. Giờ nút
đọc `state.last` và ghi rõ "Đang học dở".

Nút công cụ của trang tuần còn là tiếng Anh (*Copy plan*, *End week*) giữa giao
diện tiếng Việt — đã dịch.

### Logo: vẽ lại bằng cách nhìn

Ba phiên bản trước được vẽ ra **thật** ở 16, 24, 32 và 48 px rồi soi cạnh nhau
(không đoán). Bản cũ để lộ một mảng kem chéo trông như vết xước; các bản thử
nghiệm đều ra **mèo** hoặc **mặt nạ**. Bản chốt:

- tai quét từ mép ngoài lên, đỉnh 1px — tam giác dựng đứng đọc thành mèo;
- mắt 2×2 **lệch vào trong**, dưới chân tai — mắt giữa làm con vật "nhìn chằm
  chằm", mắt lệch ra ngoài thành mặt nạ;
- mõm kem hẹp ở cằm rồi mở rộng — mảng kem rộng đọc thành miệng bị cắt;
- **biểu tượng tab giờ chính là dấu cáo**, sinh từ cùng một lưới 16×16 với
  logo trên trang. Trước đây tab là **chữ số "9"** trong khi sản phẩm là con cáo.

### Backend

- **`/__version` không còn đọc `index.html`.** Trước đây mỗi lần gọi nó fetch
  nội bộ 1,1 MB HTML rồi regex — một endpoint kiểm tra phiên bản mà phụ thuộc
  mạng thì chính nó hỏng đầu tiên khi mạng có vấn đề. Giờ bản dựng nhúng sẵn
  version + build-id + thời điểm.
- **ETag có tác dụng**: `at: new Date()` khiến hai lần gọi khác nhau nên 304
  không bao giờ xảy ra. Giờ phản hồi tất định, so khớp `If-None-Match` đúng
  cách (chấp nhận `W/`, danh sách tag).
- **CSP gửi bằng header**, không chỉ `<meta>` — meta không đặt được
  `frame-ancestors` và chỉ có hiệu lực sau khi bắt đầu đọc HTML. Cả hai sinh từ
  **cùng một chuỗi**.
- Thêm `X-DNS-Prefetch-Control`, `X-Permitted-Cross-Domain-Policies`; 404 không
  bị cache; HEAD không có body; 405 có `Allow`.
- **Bẫy đã mắc và đã sửa:** chú thích `/* */` nằm *trong* khối luật của
  `_headers` bị Cloudflare đọc thành tên header rác. `tests/worker.js` bắt được
  ngay. Từ đó có luật kiểm: mọi dòng thụt lề trong `_headers` phải là header.

**432 bước kiểm thử** (trước 377), 39 tuyến × 9 dạng dữ liệu hỏng = **0 ngoại
lệ**, tương phản chữ **0 lỗi AA**, bản dựng tất định.

---

## [11.6.0] — 2026-11-14

### Ba lỗi thật trong mục Khám phá

Mục "Khám phá" (nút ▾ trên thanh trên) là nơi duy nhất liệt kê mọi trang. Nó
có **một lỗi chí mạng**: bấm vào bất kỳ mục nào cũng **không đi đâu cả**.
Handler đóng menu được gán *sau* handler điều hướng nên ghi đè nó, còn thẻ
`<a>` không có `href` nên trình duyệt cũng không tự chuyển trang. Menu chỉ
đóng lại. Chưa ai báo vì nó trông như "menu vừa đóng" chứ không như lỗi.

| Lỗi | Hậu quả |
|---|---|
| Handler đóng ghi đè handler điều hướng, `<a>` không có `href` | Bấm mục nào cũng **không đi đâu cả**; bàn phím cũng không tới được mục nào |
| `renderTop()` gắn listener `click` vào `document` mỗi lần đổi trang, không bao giờ gỡ | Đổi 60 trang → 60 listener chạy mãi trên mỗi cú bấm |
| `.tb-menu.on{display:flex}` + `columns:2` | Hai cột không bao giờ hiện ra — flex container bỏ qua `columns` |

Đồng thời: sáu nút công cụ trên thanh trên bị `display:none` ở màn hình hẹp,
nên **điện thoại không có lối vào nào** ngoài ngăn kéo ☰. Giờ có nút Khám phá
luôn hiện, và nó *thay* popup thay vì đứng cạnh (hai nút cùng tên là lỗi).

### Lỗi dữ liệu hỏng làm trắng trang — có từ trước

Chạy 132 tổ hợp *trang × dữ liệu hỏng* thì lộ ra ba chỗ ném ngoại lệ **ngay
trong lúc render**, nghĩa là **mất cả trang** chứ không chỉ mất một thẻ:

- `state.ans` có một mục `null` → `todayStats()` ném lỗi → **trang chủ trắng**.
  Trang chủ là lộ trình Vật lí 9, nội dung lớn nhất của sản phẩm.
- `state.watched = null` → `Library` ném lỗi trong `rowHTML`.
- `state.explore.recent` chứa `null` → **cả trang Khám phá** ném lỗi.

Cách sửa là sửa **cả lớp lỗi**, không phải từng chỗ: thêm `ansOf(id)` làm cửa
duy nhất đọc `state.ans` (12 chỗ đọc đều đi qua nó), và mọi nơi đọc
`state.watched` / `state.explore` đều chịu được giá trị rỗng.

### Trang Khám phá `#/discover`

- **Một bảng dữ liệu duy nhất** (`EXPLORE_GROUPS`, 36 lối vào) sinh ra cả trang,
  popup trên thanh trên **và** mục trong ngăn kéo — trước đây là ba danh sách
  chép tay, mỗi danh sách thiếu một thứ khác nhau.
- Mỗi mục ghi rõ **khi nào nên dùng**, vì danh sách tên gọi không giúp gì khi
  đang cần gấp.
- **Tìm kiếm một thứ hạng** trên công cụ, bài học, công thức, hỏi đáp, lộ trình,
  đề thi: bỏ dấu, đòi **mọi** từ khoá cùng khớp, xếp theo tên > mô tả > từ khoá.
- **Đọc tiếp** và **việc đến hạn** suy ra từ dữ liệu thật — chưa đọc bài nào thì
  nói thẳng "bắt đầu từ đâu", không bịa ra "đang đọc dở".
- **Vừa mở**: 8 lối vào gần nhất, chỉ ghi khi danh sách thật sự đổi.
- Bàn phím đầy đủ: `↑ ↓`, `Home/End`, `Enter`, `Esc`.
- **Trang chủ được thêm vào bảng**: nó là tuyến mặc định nên không khớp mẫu
  `p[0]==='…'`, và vì thế trước đây không có trong bất kỳ danh sách nào.

### Chốt chặn mới

`tools/check.js` luật **6b**: mọi tuyến không tham số **phải** có mặt trong
`EXPLORE_GROUPS`, ngược lại mọi mục trong bảng phải trỏ tới tuyến có thật, không
trùng, và phải có nhãn vi/en cùng câu "khi nào dùng". Đã thử bằng cách xoá mục
`#/about` — bản dựng báo lỗi ngay.

Đồng thời gỡ một khối `SCRIPTS`/`assert` bị chép hai lần trong `src/build.py`.

**377 bước kiểm thử** (trước 336), bản dựng tất định, 42 tuyến render.

---

## [11.5.0] — 2026-11-14

### Bốn lỗi làm chết trang — tìm bằng cách chạy thử, không phải đọc mã

Không đoán. Tôi cho chạy hết 39 tuyến: bấm mọi nút, gõ vào mọi ô, nạp **13 dạng
dữ liệu hỏng** vào localStorage, rồi đọc lại ngoại lệ.

| Lỗi | Hậu quả |
|---|---|
| `cirTidy` gộp nhóm sai | Bấm "Xoá hết" rồi "Tự căn lại" là **bảng mạch chết** — vòng lặp gán một lá cây vào biến nhóm, lần sau đọc `.length` của `undefined` |
| `builder` dời nút bằng chỉ số | Bấm "↓" ở con cuối cùng là **ném lỗi** — `parentAt` trả về lá, `.children` không tồn tại |
| `cirModel` không kiểm tra cây đã lưu | Dữ liệu mạch hỏng (nhóm có `kids: null`) làm **#/build trắng trang** với mọi người từng ghi dở |
| `renderLibrary` / `renderNotes` | Ô tìm kiếm **chết hoàn toàn** — gán vào biến `const`, mỗi lần gõ phím ném "Assignment to constant variable" |

Sau khi sửa: **492 lượt tương tác** trên 39 tuyến, **507 tổ hợp** tuyến × dữ liệu
hỏng — không còn ngoại lệ nào.

### Tách mã để sửa lâu dài

Bản dựng cũ nhồi 33 tệp vào **6 khối `<script>`** khổng lồ. Giờ là **11 mô-đun có
tên**, khai báo trong một bảng duy nhất ở `src/build.py`:

- stack trace ghi tên mô-đun, không phải một khối 500 KB;
- mỗi mô-đun một hash CSP riêng — thêm mô-đun không làm hỏng hash của mô-đun khác;
- thứ tự nạp là **dữ liệu**, đọc được một chỗ.

**Chốt chặn mới trong `tools/check.js`:** mọi mô-đun dùng chung một phạm vi toàn
cục, nên hai tệp khai báo cùng tên thì tệp sau **lặng lẽ thắng**. Giờ bản dựng
**thất bại** khi có tên trùng (đã thử bằng cách cố tình thêm `const toast`).

### Mục Vật lí `#/physics` — cửa vào cho cả môn

Vật lí đã có nhiều thứ nhất (52 ca, 236 bài giảng, 8 công cụ) nhưng nằm rải rác
sau chín mục menu; muốn học Vật lí phải biết mở trang nào. Giờ có một chỗ:
vòng tiến độ, **ca tiếp theo bấm là vào**, bốn giai đoạn, công cụ nhóm theo *khi
nào dùng*, công thức đã thuộc, và **chủ đề yếu** suy ra từ câu trả lời thật.

### Các môn khác: từ vỏ rỗng thành có bài

Shelf lớp 1–12 hứa 13 môn nhưng ngoài Vật lí mỗi môn chỉ có **1–2 bài**. Thêm
**21 bài mới** cho Tiếng Anh (6 bài: thì, danh từ, hiện tại hoàn thành, bị động,
mệnh đề quan hệ, điều kiện), Hoá (4), Toán (5), Ngữ văn (3) — mỗi bài có mục
tiêu, ví dụ đã giải, **lỗi người học thật sự mắc**, và một câu hỏi tự kiểm tra.

Đồng thời **sửa 5 bài cũ thiếu câu hỏi tự kiểm tra** — bài đọc mà không có gì để
làm thì không phải bài học.

Tổng: **103 bài** (trước 82). Kiểm thử mới bắt buộc mọi bài phải có mục tiêu,
≥3 khối và ≥1 câu hỏi.

---

## [11.4.0] — 2026-11-14

### Kế hoạch tuần — làm lại theo [beaverplans.com](https://beaverplans.com/)

Bản 11.2 có bảng tuần nhưng **không phải một công cụ lập kế hoạch**: không kéo
được việc, không chốt được tuần, không tái dùng được kế hoạch cũ, và mọi tuần
đều hiện cùng một danh sách. Bản này dựng lại phần vận hành cho đúng cách một
tuần thật sự được lên kế hoạch và kết thúc.

**Vì sao phải thêm `s.w` (tuần của từng việc).** Trước đây "tuần này / tuần sau"
chỉ là cái nhãn trên cùng bảy cột — mọi việc xuất hiện ở mọi tuần, nên **không
tuần nào chốt được**. Giờ mỗi việc con thuộc về một tuần cụ thể. Đây là thay đổi
gốc, mọi thứ dưới đây dựa vào nó.

**Sáu thao tác mới, mỗi thao tác là một chuyển trạng thái thật:**
- **Kéo thả** việc sang ngày khác. Kéo qua ranh giới tuần thì việc đổi luôn tuần,
  không biến mất khỏi cả hai chỗ.
- **← → trên bàn phím** để dời việc. Kéo thả không dùng được với nhiều người;
  bàn phím phải tới được cùng một thao tác.
- **Copy plan / Paste plan**: chép cấu trúc dự án → việc → việc con sang tuần
  khác. Cố ý **không** chép dấu đã xong — kế hoạch chưa làm không phải kế hoạch
  đã xong. Dán trùng tên thì xếp vào dự án cũ, không tạo dự án thứ hai.
- **Move work**: dời từng việc chưa xong bằng cách sửa chữ trong danh sách gợi ý
  (`T3  đọc lý thuyết`). Mỗi việc có nhà riêng, không dồn hết sang thứ Ba.
- **End week**: chốt tuần, mang việc còn lại sang tuần sau, để lại dấu vết
  (`x/y việc · n việc mang sang`). Vứt việc đi là cách dạy người ta giấu việc.
- **Dồn một ngày** cho cả một việc có nhiều việc con — việc năm mảnh thường là
  một buổi làm, kéo từng mảnh là làm việc vô ích.

**Thiết kế lại màn hình.** Bản cũ là một bảng điều khiển: năm ô KPI, hai bảng
lớn, mọi thứ cùng kêu. Bản mới theo beaverplans: **một con số mạnh** (phần trăm),
một câu nói đúng sự thật ("Còn 1 ngày — 6 việc đang chờ"), **đường kẻ thay vì
hộp**, và độ khó là **một chữ** (khó / vừa / dễ) chứ không phải chấm chấm.

**Ngày trống có hướng dẫn 3 bước.** Bảy cột trống không giải thích được gì —
beaverplans thêm hướng dẫn vì lý do đó, bản này cũng vậy: dự án → việc → việc con,
kèm ví dụ và một nút bắt đầu.

**Gắn bài học (thứ beaverplans không có).** Mỗi việc gắn được vào một ca học
trong lộ trình 52 ca; bấm "mở →" là vào thẳng bài. Tìm không dấu ("hieu dien"
ra "Dòng điện, hiệu điện thế"). Đây là chỗ bản clone vượt bản gốc: beaverplans
không có bài nào để mở.

**Rải việc cân theo sức** thay cho rải đều: việc khó trước, nhưng không nhồi quá
một ngưỡng, và **thà để trống một ngày còn hơn nhồi**. Có thanh tải mỗi ngày
(dễ 1 · vừa 2 · khó 3) và cảnh báo khi một ngày sắp bị bỏ.

### Sửa lỗi
- Không tuần nào chốt được (thiếu phạm vi tuần trên từng việc).
- Ô tìm bài học lọc bằng chuỗi chưa chuẩn hoá → gõ có dấu không ra kết quả.

### Kiểm thử
- `tests/newfeat.js`: **61 bước** (thêm 28) — dời việc trong và qua tuần, copy/paste
  không tạo dự án trùng, chốt tuần mang đúng số việc, rải cân chỉ dùng ngày được
  bật, và hướng dẫn chỉ hiện khi tuần thật sự trống.
- Tổng: **315 bước** xanh.

---

## [11.3.0] — 2026-11-14

**Study Focus Fox.** Đổi tên, làm bộ nhận diện, thêm tiếng Anh, thêm Đấu trường
Pixel và Góc Vật lí, thêm thiệp khoe tiến độ.

### Nhận diện · Study Focus Fox
- **Dấu hiệu cáo pixel 16×16**, chỉ lưu nửa trái rồi lật gương nên không bao giờ lệch.
  Ba bản trước đều hỏng và đã bị loại: có viền → khối đỏ; mõm tròn → gấu; mõm nhọn
  + mắt to → mèo. Bản cuối chỉ giữ **tai nhọn, mắt xếch, mõm nhọn xuống**.
- **Favicon SVG 800 byte nhúng thẳng dạng data-URI** → 0 request, không cần host ảnh,
  CSP không phải nới. Có `theme-color` cho cả sáng và tối.
- `docs/BRAND.md` — đặc tả đầy đủ: lưới, bảng màu, kiểu chữ, giọng văn, và **lý do
  từng quyết định**, kèm những bản đã bị loại.
- `src/brand.js` là nguồn duy nhất: `BRAND`, `BRAND_MARK_HALF`, `brandMarkHtml()`.

### Song ngữ Việt–Anh
- `src/i18n.js`: bảng khoá ổn định, `t(key)` rơi về vi → en → chính khoá đó
  (thiếu bản dịch thì **hiện khoá**, không hiện `undefined`).
- Đổi ngôn ngữ ngay trong `#/settings`, không tải lại trang; `<html lang>` đổi theo.
- **Nội dung Vật lí giữ tiếng Việt** — dịch đề Vật lí sang tiếng Anh là làm hỏng
  đúng thứ người dùng cần. Chỉ giao diện đổi.

### Đấu trường Pixel `#/game`
- Bốn môn, **sinh câu vô hạn** (không phải kho 500 câu mẫu): Vật lí, Toán,
  Ngữ pháp tiếng Anh, Hoá.
- Trả lời sai → **mất máu** và **câu đó quay lại ngay lượt sau**, luôn luôn.
  Bản đầu để 70% ngẫu nhiên; đó là lỗi — sai mà có thể 10 lượt sau mới gặp lại
  thì không phải sửa lỗi. Câu gặp lại trả 1 xu thay vì 2 nên không farm được.
- Combo, lên cấp, tăng độ khó theo môn. Sprite vẽ bằng CSS, không ảnh, không canvas
  → chữ vẫn đọc được, in được, CSP không đổi.

### Góc Vật lí `#/special`
- **Đọc đề**: dán đề tiếng Việt, máy rút ra đại lượng theo **đơn vị** (Ω, kΩ, mA,
  kW, km/h, g/cm³, cal…) kèm quy đổi SI, rồi chọn định luật khớp và tính đáp số.
  Chạy hoàn toàn trong máy — không gọi AI, không cần mạng.
- **Kiểm tra hợp lí**: 3000 A qua điện trở phòng thí nghiệm không phải kết quả
  vật lí mà là nhầm đơn vị — chỗ này nói ra.
- **Hằng số + tiền tố SI**.
- **Thang 12 cụm công thức** dùng chung hộp Leitner với thẻ ghi nhớ.

### Chia sẻ bài học `#/share/lesson/<ngày>/<ca>`
- **Đường dẫn thật cho từng bài**: `#/lesson/3/2` vốn đã là URL, nên phần khó
  không phải là tạo link — mà là làm cho link đó *đáng mở*. Trang chia sẻ đưa ra
  ba thứ, tất cả sinh ngay trên máy: link, **mã QR (SVG)**, và **một tệp `.html`
  tự chứa** mở được offline.
- Tệp `.html` không có script, không phông chữ ngoài, không ảnh — gửi cho người
  không chắc có trang này. Cũng chính là bản in: `@media print` cho ra tờ A4 sạch.
- Nút "Chia sẻ bài này" nằm ngay trong đầu mỗi bài học.
- **Mã QR tự viết** (byte mode, ECC mức M, chuẩn ISO/IEC 18004 v1–10). Không dùng
  thư viện CDN vì một trang chạy offline không nên chết khi CDN chết.
- Ba lỗi trong chính bộ mã hoá này, tìm bằng cách giải mã lại bằng `jsQR`:
  1. **Khối format-info bị viết ngược (x,y)** → **cả 8 phiên bản đều không quét
     được**, nhưng hình vẫn trông y hệt mã QR. Không có cách nào phát hiện bằng mắt.
  2. **Thiếu khối version-info** ở v7+ → v1–v6 quét tốt, v7–v10 câm lặng. Chỉ lộ
     ra với URL dài.
  3. **Dòng timing bị ghi đè** ở ô (8,6) và (6,8) khi "giữ chỗ" vùng format.
- `TextEncoder` bị bỏ: tự mã hoá UTF-8 bốn dòng, để QR tạo được ở mọi môi trường
  (kể cả môi trường không có global đó).
- Kiểm thử: **88 bước** (thêm 25), gồm cả kiểm tra đủ 3 mẫu định vị 7×7, dòng
  timing, khối version, và tệp chia sẻ không cần mạng.

### Khoe tiến độ `#/share`
- Thiệp 1200×630 vẽ bằng `<canvas>` trên máy, không tải lên đâu.
- Chỉ có **số liệu học**: chuỗi, thẻ đã thuộc, giờ, ca, ĐTB, mức kế hoạch, cấp.
  Không tên, không email, không ghi chú.
- Trình duyệt không có canvas → tự chuyển bản chữ, trang không chết.

### Sửa lỗi
- `shDraw` ném lỗi khi `getContext('2d')` trả `null` (jsdom, webview bị khoá)
  làm chết cả tuyến `#/share` → giờ trả `false` và chuyển sang bản chữ.
- `wkAddSub` mặc định ngày về 0 làm mọi việc dồn vào thứ Hai (đã sửa ở 11.2).
- Hàm chết `i18nHas`/`i18nKeys` bị loại khỏi bundle.

### Kiểm thử
- **`tests/v112.js` (mới, 63 bước)**: mọi khoá i18n phải có đủ vi và en; dấu hiệu
  phải đối xứng từng ô; **120 câu sinh ra cho mỗi môn đều phải có đáp án**;
  đọc đơn vị (kΩ→1200, mA→0,25, km không bị nhầm thành m); chọn đúng định luật;
  câu sai quay lại ngay; thiệp không lộ tên.
- Tổng: **268 bước** xanh. Build tất định. 1.105 KB thô / 304 KB gzip.

---

## [11.2.0] — 2026-11-14

Nghiên cứu 15+ trang học tập đang chạy tốt (beaverplans, MyStudyLife, Power Planner,
Shovel, Todait, Study-Track, StudyTracker, Mindomax…), rồi lấy **cơ chế** đúng với
bối cảnh Việt Nam thay vì bắt chước giao diện.

### Mới · Sổ điểm `#/grades`
- **Đúng quy chế Bộ GD&ĐT**: miệng & 15 phút hệ số 1, 1 tiết hệ số 2, học kì hệ số 3.
  ĐTB môn = Σ(điểm × hệ số) ÷ Σ(hệ số); **cả năm = (HK1 + 2 × HK2) ÷ 3**.
- **Hệ số sửa được** — mỗi trường một khác; sửa là mọi con số đổi ngay, không nhập lại điểm.
  Đây là chỗ các app nước ngoài (GPA thang 4.0 theo tín chỉ) không làm được cho học sinh VN.
- **Xếp loại theo TT 22/2021**: Tốt ≥ 8,0 · Khá ≥ 6,5 · Đạt ≥ 5,0 · Chưa đạt ≥ 3,5.
- **"Cần bao nhiêu điểm"** (what-if, học từ Power Planner): cho biết bài 1 tiết tới phải
  được mấy điểm để đạt mục tiêu — và **nói thẳng khi mục tiêu đã bất khả thi**.
- Dòng "nên chú ý nhất": 3 môn thấp nhất, nối thẳng sang `#/plan`.
- KPI điểm TB xuất hiện cả ở `#/progress`, có liên kết về sổ điểm.

### Mới · Kế hoạch tuần `#/weekly`
- Mô hình của **beaverplans**: `dự án → việc → việc con → rải vào ngày`.
- **Rải theo độ khó**: việc **khó nhất lên đầu tuần** (lúc còn sức), giảm dần.
  Gõ `khó:` / `vừa:` / `dễ:` ở đầu tên việc là đặt được độ khó — hiểu ở mọi đường nhập,
  kể cả dấu hai chấm full-width.
- **Chọn ngày mình có thể học**: tắt T7/CN là cách trung thực nhất để kế hoạch không tự lừa.
- **Kéo việc trễ về hôm nay** — không mất việc nào (khác beaverplans, vốn bỏ mặc việc cũ).
- Việc con nối được vào bài học trong máy (`#/read/…`), không phải gõ lại.

### Mới · Đếm ngược & tính khả thi (học từ Shovel, Sora, Todait)
- Kế hoạch học hiện **"còn N ngày"** ngay trên đầu trang, tô đậm khi ≤ 7 ngày.
- **"Vừa sức / Sát nút / Quá tải"**: so số mục còn lại với số phút bạn khai × số ngày thật
  còn lại — trả lời "kế hoạch này có làm kịp không", không chỉ "còn mấy ngày".

### Kiểm thử
- **`tests/newfeat.js` (mới, 33 bước)** khoá công thức bằng số thật: ví dụ sách giáo khoa
  109/14 = 7,7857 (nhiều trang web in 7,714 — đó là 108/14, tính nhẩm sai), đổi hệ số,
  cả năm, xếp loại, what-if, rải việc theo độ khó, kéo việc trễ.
- `tests/smoke.js` thêm 3 tuyến → **54 bước**. Tổng **205 bước** xanh.
- Build vẫn tất định (hai lần dựng byte-identical).

---

## [11.1.0] — 2026-11-14

**Chuyển sang Cloudflare Workers Static Assets** sau khi so sánh có bằng chứng với Pages, Vercel,
Netlify và GitHub Pages. Không phải đổi một dòng nào trong `src/` về mặt giao diện.

### Vì sao đổi
- Cloudflare tự viết trong *Workers Best Practices*: "If you are starting a new project, use
  Workers instead of Pages. Pages continues to work, but new features and optimizations are
  focused on Workers." Pages **không** bị khai tử — nhưng Workers là nơi mọi thứ mới diễn ra.
- Workers Static Assets vẫn đọc `_headers` và `_redirects` y như Pages, nên chi phí chuyển đổi
  gần bằng không, còn đường dài thì mở ra D1/KV/R2/**cron** (Pages không có cron).
- Với `run_worker_first` không bật, **mọi request tĩnh vẫn miễn phí và không bị đếm** vào hạn
  mức 100.000/ngày — nên trang này thực tế không bao giờ chạm hạn mức.

### Thay đổi
- `wrangler.toml` → **`wrangler.jsonc`**: `main`, `assets.directory`, `assets.binding = ASSETS`,
  `not_found_handling = "404-page"`, `html_handling = "auto-trailing-slash"`, `workers_dev`,
  `preview_urls`, và khối `routes` ghi sẵn để gắn tên miền riêng.
- **Worker một tệp** sinh từ `src/worker.template.js` → `dist/_worker.mjs`: `GET /__version`
  (JSON, `ETag`, `304`, `405`, chịu lỗi khi không đọc được `index.html`) + trả `404.html` thật.
  Bỏ cấu trúc `functions/` của Pages; Pages vẫn dùng lại được nếu cần (§6 trong tài liệu).
- **`dist/404.html`**: trang 404 riêng, nhẹ (2 KB), có lối về các tuyến chính, `noindex`.
- **`.assetsignore`**: loại `_worker.mjs` (và `.nojekyll`) khỏi assets — **nếu không, mã Worker
  bị phục vụ công khai ở `/_worker.mjs`**. Lỗi này chỉ lộ ra khi chạy `wrangler dev` thật.
- **`_redirects` trỏ `/` thay vì `/index.html`**: đích cũ sinh thêm một vòng `307` mỗi lần vào
  `/study`. Thêm cả dạng có dấu `/` cuối. Đã kiểm: giờ trả `200` thẳng.
- **`src/worker.template.js`**: gọi `env.ASSETS` với `redirect: 'follow'` — thiếu cờ này thì
  `/404.html` bị `307` sang `/404` và người dùng nhận plain text thay vì trang 404.
- **`sw.js`**: precache `./` thay vì `./index.html` (Cloudflare `307` đường `/index.html`), và
  thêm `./404.html` để mất mạng vẫn thấy trang 404 tử tế. Duyệt từng tệp thay vì `addAll()`
  để một tệp lỗi không làm hỏng cả lô.
- `npm run deploy` = `wrangler deploy`; thêm `npm run preview` (chạy workerd ở máy).
- `_headers`/`_redirects` bỏ nhãn "Pages" trong chú thích; giữ nguyên toàn bộ giá trị.

### Kiểm thử
- **`tests/worker.js` (mới, 32 bước)** — mô phỏng đúng thứ tự phục vụ của Workers: tài nguyên
  tĩnh miễn phí, `_redirects`, 404, và **không lộ mã nguồn**. Đây là lưới an toàn cho cả ba lỗi
  ở trên.
- `tests/functions.js` chuyển sang `dist/_worker.mjs`, thêm 6 bước kiểm `wrangler.jsonc` khớp
  `dist/` (main tồn tại, `assets.directory`, `binding`, `run_worker_first` không bật).
- `tests/csp.js` thêm kiểm `404.html`, `.assetsignore`, `_worker.mjs` → **28 bước**.
- CI thêm bước chạy `tests/worker.js`.

### Kiểm chứng
- `wrangler deploy --dry-run`: **8 tệp** vào assets, Worker **2,7 KB** (gzip 1,15 KB).
- `wrangler dev --local` rồi gọi thật 11 loại request: `/`, `/study`, `/about/` → `200`;
  `/index.html` → `307`; `/__version` → `200` JSON + `304` khi khớp `If-None-Match` + `405` khi
  `POST`; `/nope` → `404` + HTML của ta; `/_worker.mjs`, `/_headers`, `/src/app.js`,
  `/package.json`, `/wrangler.jsonc` → `404`.
- `npm test`: **163 bước** xanh.

---

## [11.0.0] — 2026-11-14

Bản dành cho **Cloudflare Pages**: bảo mật bằng CSP nghiêm, cache đúng, chạy offline, có một
endpoint backend thật.

### Bảo mật
- **Content-Security-Policy sinh tự động.** `src/build.py` băm SHA-256 từng khối `<script>` và
  `<style>` rồi nhúng hash vào `<meta http-equiv>`. `script-src` **không có `'unsafe-inline'`**,
  không có `'unsafe-eval'`, `object-src 'none'`, `base-uri 'none'`, `form-action 'none'`,
  `connect-src 'self'`. Kiểm bằng `tests/csp.js` (25 bước) — sai một hash là CI chặn.
- Bỏ thuộc tính `onerror="…"` còn sót trong thẻ ảnh bìa (CSP nghiêm chặn inline handler);
  thay bằng trình xử lý bắt ở pha capture.
- `_headers`: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`
  (tắt camera/mic/vị trí/thanh toán), `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`.
- `img-src`/`frame-src` chỉ mở đúng `i.ytimg.com` và `youtube-nocookie.com`.

### Hiệu suất
- **Service worker** (`sw.js`, sinh từ `src/sw.template.js`): precache bản chạy, điều hướng
  trả cache trước và cập nhật nền → **lần mở thứ hai 0 yêu cầu mạng, mất mạng vẫn dùng được**.
  Tên cache chứa phiên bản nên mỗi deploy là một cache mới.
- **Giảm 17 → 10 độ đậm font**: Be Vietnam Pro 400·600, JetBrains Mono 400·500, Lora 400·600 + italic —
  bớt 7 tệp font phải tải, chữ vẫn đẹp (trình duyệt tự chọn độ đậm gần nhất).
- Ảnh bìa video `loading="lazy" decoding="async"` — không tải 236 ảnh YouTube cùng lúc.
- `Cache-Control: public, max-age=0, must-revalidate` cho `index.html`: sau khi deploy người dùng
  nhận bản mới ngay nhưng chỉ tốn `304` vài chục byte thay vì tải lại ~1 MB.
- `dns-prefetch` cho `i.ytimg.com`, `theme-color` cho chế độ sáng/tối.

### Cloudflare Pages
- **Pages Function `functions/__version.js`** — `GET /__version` trả `{version, build, at, commit}`,
  có ETag/`304`, trả `405` cho method khác, và vẫn trả lời được khi không đọc nổi `index.html`.
  Đọc phiên bản từ chính `index.html` đã deploy nên không phải sửa số ở hai nơi.
- **`_redirects`**: `/study`, `/cards`, `/timetable`… trả `index.html` (200) — trước đây gõ thẳng
  đường dẫn là 404 vì router dùng hash.
- **`--dist`**: build chỉ xuất `index.html`, `_headers`, `_redirects`, `sw.js` ra `dist/` →
  không đưa `src/`, `tests/`, `docs/` lên web công khai.
- `wrangler.toml` + `npm run deploy`.
- Nút **“Kiểm tra bản mới”** trong `#/about` gọi `/__version`, báo khi có bản mới và hiện
  phiên bản máy chủ. Không có mạng / mở bằng `file://` thì im lặng, không làm phiền.
- Thanh báo **ngoại tuyến** ở đáy trang khi mất mạng.
- Hộp thoại “Đã có bản mới — Nạp lại” khi service worker phát hiện bản mới (không tự reload
  để không mất bài đang làm).

### Kiểm thử
- `tests/csp.js` **25** · `tests/functions.js` **18** · `tests/smoke.js` **51** ·
  `tests/interaction.js` **32** → **126 bước**, `npm test` chạy hết, không cần trình duyệt.
- CI thêm hai bước: kiểm CSP và chạy thử Pages Function.
- Bỏ `pages.yml` của GitHub (không deploy hai nơi nữa).

## [10.1.0] — 2026-11-14

Bản làm sạch và sửa lỗi. Không đổi giao diện, không đổi lược đồ dữ liệu — chỉ làm đúng những gì
trước đây tuyên bố là đã đúng.

### Sửa — dữ liệu người dùng
- **Bản dự phòng localStorage không hề tồn tại.** `write()` ghi đè `vnl9.v2` *rồi* mới đọc lại để
  sao ra `vnl9.b1/b2`, nên cả ba bản luôn giống hệt nhau. Giờ đọc bản cũ **trước** khi ghi và xoay vòng
  `b3 ← b2 ← b1 ← bản cũ`. Kiểm chứng: `tests/interaction.js` → *“3 bản dự phòng khác nội dung nhau”*.
- **`esc()` không thoát dấu nháy.** Tên có `"` (ví dụ `Vật "lí" & <b>`) làm vỡ thuộc tính `value="…"`
  → mở ô thời khoá biểu ra **ô rỗng** và mất dữ liệu khi bấm Lưu. Giờ thoát cả `"` và `'`.
- Chỉnh `.ics`: thoát đủ `\ ; ,` và xuống dòng theo RFC 5545 §3.3.11, **gấp dòng > 75 ký tự** (§3.1)
  để Google/Apple/Outlook nhập được tiêu đề dài.

### Sửa — hộp thoại
- **9 chỗ còn gọi `confirm()` gốc** của trình duyệt (xoá bảng TKB, xoá tiết, xoá bài, xoá tệp, xoá kế hoạch,
  đổi mẫu bài soạn, bốc lại đề, đặt lại toàn bộ) — bị chặn trong iframe/preview và làm treo bộ QA.
  Thay hết bằng `uiConfirm()` mới: hộp thoại nội trang, có `Esc` / `Enter`, nút nguy hiểm tô đỏ.
- **Bẫy phím Tab** cho mọi hộp thoại (`role=dialog|alertdialog`): trước đây Tab chạy ra sau lớp phủ.

### Thêm
- **`#/builder` Mạch lồng nhau** — `src/builder.js` (358 dòng) và toàn bộ CSS `.build-*` đã có trong repo
  nhưng **chưa từng được ghép vào build**, tức là mã chết. Giờ có tuyến riêng: dựng cây nối tiếp /
  song song lồng nhau đến 5 tầng, thêm–bớt–đổi giá trị từng điện trở, máy giải tính R tương đương,
  dòng, điện áp và công suất từng điện trở, hình vẽ tự sinh, 3 mạch mẫu.
- `tests/smoke.js` (**51 bước**) và `tests/interaction.js` (**32 bước**) chạy bằng `jsdom` —
  kiểm thử không cần trình duyệt, chạy được trong CI.
- `tools/check.js` thêm 3 lớp chặn hồi quy: cấm `prompt()/confirm()/alert()` trong `src/`,
  phát hiện mô-đun không được `build.py` ghép (mã chết), và đối chiếu mọi tuyến router ↔ hàm `render*`.
- `uiConfirm()` + `.btn-danger` + `.modal-f` trong CSS.

### Sửa — hạ tầng
- **`src/build.py` đọc CSS từ đường dẫn tuyệt đối `/home/user/src/app.css`** → build **luôn thất bại**
  trên mọi máy khác. Giờ đọc `src/app.css` tương đối. Bản dựng đã khớp byte-for-byte với `index.html`.
- **Workflow CI/Pages nằm trong `vat-li-9-study-os/.github/`** nên GitHub không bao giờ chạy.
  Chuyển ra gốc repo; Pages giờ tự build lại từ `src/` và chỉ deploy `index.html` + `.nojekyll`.
- Gộp cây thư mục: `src/`, `tools/`, `docs/` ở gốc repo là **bản sao y hệt** của `vat-li-9-study-os/`.
  Xoá bản trùng, đưa dự án về một cây duy nhất.
- Xoá `vat-li-9-study-os.zip` (1,1 MB, bản nén lỗi thời của chính repo), `vat_li_9_lop_hoc.html`
  (bản build cũ 976 KB trùng `index.html`), `uploads/` (3 ảnh không được tham chiếu ở đâu),
  `.config/` (rác Crash Reports của Chrome). Tài liệu cũ chuyển vào `docs/archive/`.

### Kiểm thử
- `node tools/check.js` ✓ · `node tests/smoke.js` **51/51** · `node tests/interaction.js` **32/32**.
- 35 tuyến × jsdom: 0 lỗi JS, trang nào cũng vẽ ra nội dung.

## [10.0.0] — 2026-10-21

### Thêm
- **`#/timetable` Thời khoá biểu**: lưới tuần 2→7 (hoặc 2→CN), sáng/chiều, số tiết chỉnh được, nhiều bảng,
  sửa tiết tại chỗ (môn · tiết · GV · màu), **Tự xếp môn** tự động tô 12 màu, **In / lưu PDF** có dòng ký tên.
- **Đưa thời khoá biểu vào lịch tuần này** — tạo việc có giờ thật, chống trùng theo `ngày + giờ + tên + nguồn`.
- **`#/calendar` Lịch** tháng/tuần, màu theo loại việc, tick xong tại chỗ, **xuất `.ics`** cho Google/Apple/Outlook.
- **Lịch trống có lối vào**: dải “Lịch đang trống” + *Việc đầu tiên* / *Lấy từ thời khoá biểu*.
- **`@nggkhaiz`** ở hero, thanh trên, chân trang, `#/about`, bản in, tiêu đề tab + phiên bản `v10.0`.
- **6 theme mới** (ivory · bordeaux · ink · lotus · graphite · ocean) → tổng **13 theme**, 14 lựa chọn màu nhấn.

### Sửa
- `const esc` trong hộp thoại lịch che helper toàn cục → đổi thành `onEsc` (lỗi `TypeError` khi mở việc mới).
- Theme tối làm chữ ở rail lộ trình gần như vô hình → override riêng cho `midnight` / `graphite` / `pixelnight`.
- Ô “Tự xếp môn” chỉ tách dấu phẩy → nhận thêm chấm phẩy, xuống dòng, tự bỏ môn trùng.
- Khoá chống trùng quá thô làm mất tiết khi cùng môn hai tiết/ngày (47 tiết → chỉ 6 việc).
- Khối “Hôm nay có gì” bị ẩn khi lịch trống → luôn hiện, kèm ô “Chưa đặt” dẫn tới lịch.

### Bỏ
- Toàn bộ `prompt()` / `confirm()` — thay bằng hộp thoại nội trang `uiPrompt`, `uiCardForm`.

### Kiểm thử
- `tools/qa/sched.js` **21/21** · `study` 21/21 · `school` 26/26 · `board` 17/17 · `sim` 19/19.
- `audit` **30 tuyến** × desktop + mobile: 0 tràn · 0 lỗi JS. Build **976 KB**.

## [9.0.0] — 2026-10-10

### Thêm — Study OS
- **Học hôm nay**, **thẻ ghi nhớ 7 hộp**, **luyện đề tự tạo**, **kế hoạch tới ngày thi**, **đồng hồ tập trung**,
  **ghi chú + Feynman**, **heatmap 12 tuần**, **chuỗi ngày**, **đọc thành tiếng**, **tiến độ tổng + khuyến nghị**,
  **sao lưu / khôi phục `.json`**.

### Kiểm thử
- `tools/qa/study.js` 21/21 · audit 27 tuyến · build 850 KB.

## [8.0.0] — 2026-09-28

### Thêm
- **Trường học lớp 1 → 12, 13 môn, 48 bài mẫu**; tự tạo bài học, xuất/nhập `.json`.
- **Tải tệp lên** (ảnh, PDF, tài liệu) lưu trong IndexedDB — tối đa 40 MB/tệp.

## [7.17.0] — 2026-09-15

### Thêm
- Động cơ học tập: ôn cách quãng Leitner, phòng thi có lưới nhảy câu và phím tắt, báo cáo theo chủ đề.
- Phòng thí nghiệm 4 bàn (điện · quang · cơ · nhiệt) + sổ ghi chép xuất CSV.
- Bảng lệnh ⌘K quét toàn bộ bài học, công thức, hỏi đáp, đề, câu hỏi.

## [6.0.0] và trước đó

- Lộ trình **52 ca Vật lí 9 → chuyên Lý** (13 ngày × 4 ca), ngân hàng câu hỏi, 12 đề luyện.
- Máy giải mạch điện thêm/bớt R tự do; bảng vẽ kéo–thả; mô phỏng quang – cơ – điện.
- Giao diện editorial nhiều theme, pomodoro đồng hồ cát pixel-art, nhạc theo link người dùng.
