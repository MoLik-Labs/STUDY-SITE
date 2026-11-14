/* =========================================================
   SEED BỔ SUNG — phủ lớp 1 → 12, nhiều môn
   Viết ngắn, đúng trọng tâm, mỗi bài 4–6 khối.
   ========================================================= */
const _L = (g, s, t, tag, aim, blocks) => ({ g, s, t, tag, aim, blocks });
const SEED_MORE = [
  _L(1, 'toan', 'Cộng và trừ trong phạm vi 10', 'Số học · tuần 3',
    'Nhẩm nhanh phép cộng, trừ trong phạm vi 10 và tự kiểm tra lại bằng phép ngược.',
    [
      { k: 'p', v: 'Cộng là thêm vào, trừ là bớt đi. Với các số trong phạm vi 10, con có thể nhẩm bằng cách đếm thêm hoặc tách – gộp.' },
      { k: 'ul', v: ['5 + 3: đếm thêm 3 bước từ 5 → 6, 7, 8', '8 − 3: đếm bớt 3 bước từ 8 → 7, 6, 5', 'Tách 7 = 5 + 2 để cộng cho tròn 10: 7 + 5 = 7 + 3 + 2'] },
      { k: 'note', v: 'Muốn kiểm tra phép trừ, con làm phép cộng ngược lại: 8 − 3 = 5 vì 5 + 3 = 8.' },
      { k: 'q', v: 'Tính nhẩm: 9 − 4 = ? Kiểm tra lại bằng phép cộng nào?', a: '9 − 4 = 5, vì 5 + 4 = 9.' }
    ]),
  _L(1, 'van', 'Đánh vần: âm đầu – vần – thanh', 'Học vần · tuần 2',
    'Tách được một tiếng thành ba phần và ghép lại để đọc đúng.',
    [
      { k: 'p', v: 'Mỗi tiếng trong câu gồm ba phần: âm đầu, vần và thanh. Đánh vần là đọc rời ba phần rồi ghép lại thành tiếng.' },
      { k: 'ul', v: ['bà → bờ – a – huyền – bà', 'cá → cờ – a – sắc – cá', 'trường → trờ – ương – huyền – trường'] },
      { k: 'note', v: 'Có tiếng không có âm đầu như ăn, uống, em: đánh vần thẳng từ vần.' },
      { k: 'q', v: 'Đánh vần tiếng “nhà”.', a: 'nhờ – a – huyền – nhà.' }
    ]),
  _L(2, 'toan', 'Bảng nhân 2, 3, 4, 5', 'Phép nhân · chương 1',
    'Thuộc bảng nhân và dùng được để tính nhanh, không phải cộng lặp lại.',
    [
      { k: 'p', v: 'Nhân là cộng nhiều lần cùng một số: 3 × 4 nghĩa là 3 + 3 + 3 + 3. Học thuộc bảng nhân giúp tính nhanh hơn hẳn.' },
      { k: 'ul', v: ['Bảng 2: kết quả là các số chẵn 2, 4, 6, 8…', 'Bảng 5: kết quả luôn tận cùng bằng 0 hoặc 5', 'Bảng 3: tổng các chữ số của kết quả chia hết cho 3'] },
      { k: 'note', v: 'Phép nhân đổi chỗ được: 4 × 5 = 5 × 4. Biết một bảng là suy ra được bảng kia.' },
      { k: 'q', v: '5 × 6 = ? và 6 × 5 = ?', a: 'Cả hai đều bằng 30.' }
    ]),
  _L(2, 'tnxh', 'Giữ vệ sinh cơ thể và đôi tay', 'Tự nhiên & Xã hội · bài 6',
    'Nêu được các bước rửa tay và thói quen giữ cơ thể sạch sẽ.',
    [
      { k: 'p', v: 'Tay là nơi dễ mang vi khuẩn nhất vì chạm vào nhiều đồ vật. Rửa tay đúng cách phòng được nhiều bệnh đường tiêu hoá.' },
      { k: 'ul', v: ['Làm ướt tay, xoa xà phòng', 'Chà lòng bàn tay, mu bàn tay, kẽ ngón và đầu ngón', 'Rửa sạch dưới vòi nước, lau khô bằng khăn sạch'] },
      { k: 'note', v: 'Rửa tay trước khi ăn và sau khi đi vệ sinh là hai thời điểm quan trọng nhất trong ngày.' },
      { k: 'q', v: 'Vì sao phải rửa cả kẽ ngón tay?', a: 'Vì vi khuẩn và bụi bẩn giắt ở kẽ ngón, chỉ xoa lòng bàn tay thì không sạch.' }
    ]),
  _L(3, 'toan', 'Chu vi hình chữ nhật và hình vuông', 'Hình học · chương 3',
    'Tính đúng chu vi khi biết cạnh, trình bày bài có đơn vị đo.',
    [
      { k: 'p', v: 'Chu vi là độ dài đường bao quanh hình. Với hình chữ nhật, hai cạnh dài bằng nhau và hai cạnh rộng bằng nhau.' },
      { k: 'f', v: 'P = (dài + rộng) × 2   ·   P hình vuông = cạnh × 4' },
      { k: 'note', v: 'Các cạnh phải cùng một đơn vị trước khi tính. Đổi 1 dm = 10 cm rồi mới cộng.' },
      { k: 'q', v: 'Hình chữ nhật dài 8 cm, rộng 5 cm. Chu vi bằng bao nhiêu?', a: 'P = (8 + 5) × 2 = 26 cm.' }
    ]),
  _L(3, 'van', 'Kể lại một câu chuyện đã đọc', 'Tập làm văn · tuần 8',
    'Kể đủ ba phần, biết chọn chi tiết chính thay vì kể lại toàn bộ câu chuyện.',
    [
      { k: 'p', v: 'Bài kể chuyện cần ba phần: mở đầu (giới thiệu câu chuyện), diễn biến (các sự việc chính), kết thúc (kết quả và suy nghĩ của em).' },
      { k: 'ul', v: ['Mở: tên câu chuyện, nhân vật chính', 'Diễn biến: 2–3 sự việc, mỗi sự việc một đoạn', 'Kết: em thích điều gì, học được gì'] },
      { k: 'note', v: 'Kể lại không phải đọc lại: dùng lời của mình, không chép nguyên văn sách.' },
      { k: 'q', v: 'Phần nào trong bài kể cần nêu cảm nghĩ của người kể?', a: 'Phần kết thúc — nêu điều em thích và bài học rút ra.' }
    ]),
  _L(4, 'toan', 'Phân số bằng nhau và rút gọn phân số', 'Phân số · chương 4',
    'Rút gọn được phân số và nhận ra hai phân số bằng nhau.',
    [
      { k: 'p', v: 'Nhân hoặc chia cả tử và mẫu cho cùng một số khác 0 thì được phân số bằng phân số ban đầu.' },
      { k: 'f', v: 'a/b = (a : m)/(b : m)   với m là ước chung' },
      { k: 'ul', v: ['Rút gọn: chia cả tử và mẫu cho ƯCLN', '12/18: ƯCLN là 6 → 2/3', 'Phân số tối giản khi tử và mẫu chỉ cùng chia hết cho 1'] },
      { k: 'q', v: 'Rút gọn 15/25.', a: 'Chia cả tử và mẫu cho 5 được 3/5.' }
    ]),
  _L(4, 'khoahoc', 'Vật dẫn nhiệt và vật cách nhiệt', 'Khoa học · bài 12',
    'Phân biệt vật dẫn nhiệt tốt, cách nhiệt và giải thích vài ứng dụng quen thuộc.',
    [
      { k: 'p', v: 'Nhiệt truyền từ vật nóng sang vật lạnh. Kim loại dẫn nhiệt tốt; gỗ, nhựa, không khí dẫn nhiệt kém nên dùng làm vật cách nhiệt.' },
      { k: 'ul', v: ['Dẫn nhiệt tốt: đồng, nhôm, sắt', 'Cách nhiệt: gỗ, nhựa xốp, len, không khí', 'Áo len ấm vì giữ lớp không khí, không phải vì len tự toả nhiệt'] },
      { k: 'note', v: 'Nắp nồi bằng nhựa dễ cầm vì nhựa cách nhiệt; tay cầm nồi bằng sắt phải bọc vải.' },
      { k: 'q', v: 'Vì sao bình giữ nhiệt có hai lớp vỏ và khoảng trống ở giữa?', a: 'Lớp không khí ở giữa dẫn nhiệt kém, hạn chế nhiệt truyền ra ngoài.' }
    ]),
  _L(5, 'toan', 'Diện tích hình tam giác và hình thang', 'Hình học · chương 3',
    'Áp dụng đúng công thức, đổi đơn vị và trình bày lời giải gọn.',
    [
      { k: 'p', v: 'Diện tích tam giác bằng nửa tích cạnh đáy với chiều cao ứng với đáy đó. Hình thang coi như nửa tổng hai đáy nhân chiều cao.' },
      { k: 'f', v: 'S tam giác = a × h : 2   ·   S hình thang = (a + b) × h : 2' },
      { k: 'note', v: 'Chiều cao phải vuông góc với đáy. Nếu đề cho cạnh bên, đó chưa chắc là chiều cao.' },
      { k: 'q', v: 'Tam giác đáy 12 cm, cao 7 cm. Diện tích?', a: 'S = 12 × 7 : 2 = 42 cm².' }
    ]),
  _L(6, 'toan', 'Ước chung lớn nhất và bội chung nhỏ nhất', 'Số học · chương 1',
    'Tìm ƯCLN, BCNN bằng phân tích ra thừa số nguyên tố và dùng đúng bài toán.',
    [
      { k: 'p', v: 'ƯCLN dùng khi chia đều thành nhiều phần bằng nhau; BCNN dùng khi tìm thời điểm các sự việc lặp lại cùng lúc.' },
      { k: 'ul', v: ['Phân tích mỗi số ra thừa số nguyên tố', 'ƯCLN: lấy thừa số chung, số mũ nhỏ nhất', 'BCNN: lấy thừa số chung và riêng, số mũ lớn nhất'] },
      { k: 'f', v: 'ƯCLN(a, b) × BCNN(a, b) = a × b' },
      { k: 'q', v: 'Tìm ƯCLN và BCNN của 12 và 18.', a: '12 = 2²·3, 18 = 2·3² → ƯCLN = 6, BCNN = 36.' }
    ]),
  _L(6, 'khtn', 'Đo chiều dài, thể tích và khối lượng', 'KHTN · chương 1',
    'Chọn dụng cụ đúng, đọc đúng GHĐ – ĐCNN và ghi kết quả có đơn vị.',
    [
      { k: 'p', v: 'Mỗi dụng cụ đo có giới hạn đo (GHĐ) và độ chia nhỏ nhất (ĐCNN). Kết quả đo chỉ nên ghi đến độ chia nhỏ nhất.' },
      { k: 'ul', v: ['Thước đo chiều dài: đặt mắt vuông góc với vạch đọc', 'Bình chia độ đo thể tích chất lỏng: đọc ngang mức đáy võng', 'Cân đồng hồ / cân điện tử đo khối lượng'] },
      { k: 'note', v: 'Thể tích vật rắn không thấm nước = mức nước dâng lên, không phải tổng thể tích nước.' },
      { k: 'q', v: 'Một bình có ĐCNN 2 ml. Vì sao không nên ghi kết quả là 21,5 ml?', a: 'Vì vạch chia nhỏ nhất là 2 ml nên chỉ đọc được các giá trị chẵn; 21,5 ml vượt khả năng chia của bình.' }
    ]),
  _L(7, 'toan', 'Tỉ lệ thức và dãy tỉ số bằng nhau', 'Đại số · chương 6',
    'Lập tỉ lệ thức từ dữ kiện và dùng tính chất dãy tỉ số để chia tỉ lệ.',
    [
      { k: 'p', v: 'Tỉ lệ thức là đẳng thức của hai tỉ số. Từ tích chéo bằng nhau ta lập được tỉ lệ thức.' },
      { k: 'f', v: 'a/b = c/d  ⇔  a·d = b·c   ·   a/b = c/d = (a + c)/(b + d)' },
      { k: 'ul', v: ['Dùng khi đề cho “tỉ lệ thuận” hoặc “chia theo tỉ số”', 'Đặt x = 2k, y = 5k rồi thay vào điều kiện tổng / hiệu', 'Kiểm tra lại bằng cách thay số vào đề'] },
      { k: 'q', v: 'Chia 84 thành hai phần tỉ lệ 3 : 4.', a: '3k + 4k = 84 → k = 12 → hai phần là 36 và 48.' }
    ]),
  _L(7, 'vatli', 'Tốc độ và đồ thị quãng đường – thời gian', 'Chuyển động · chương 2',
    'Tính tốc độ, đổi đơn vị và đọc được ý nghĩa độ dốc của đồ thị.',
    [
      { k: 'p', v: 'Tốc độ cho biết quãng đường đi được trong một đơn vị thời gian. Đồ thị s – t của chuyển động đều là đường thẳng.' },
      { k: 'f', v: 'v = s / t   ·   1 m/s = 3,6 km/h' },
      { k: 'ul', v: ['Độ dốc càng lớn thì vật chuyển động càng nhanh', 'Đường nằm ngang: vật dừng lại', 'Càng dốc xuống: vật quay ngược hướng đang chọn'] },
      { k: 'q', v: '36 km/h bằng bao nhiêu m/s?', a: '36 : 3,6 = 10 m/s.' }
    ]),
  _L(8, 'toan', 'Bảy hằng đẳng thức đáng nhớ', 'Đại số · chương 2',
    'Viết đúng công thức, khai triển và rút gọn biểu thức nhanh.',
    [
      { k: 'p', v: 'Hằng đẳng thức giúp bỏ phép nhân dài. Học thuộc theo cặp: bình phương của tổng và của hiệu, rồi lập phương.' },
      { k: 'f', v: '(a ± b)² = a² ± 2ab + b²   ·   a² − b² = (a − b)(a + b)' },
      { k: 'ul', v: ['(a + b)³ = a³ + 3a²b + 3ab² + b³', 'a³ ± b³ = (a ± b)(a² ∓ ab + b²)', 'Dùng hiệu hai bình phương để tính nhẩm: 99² − 1 = 100 · 98'] },
      { k: 'q', v: 'Khai triển (x − 3)².', a: 'x² − 6x + 9.' }
    ]),
  _L(8, 'hoa', 'Mol và khối lượng mol', 'Chương 3 · mol & tính toán',
    'Chuyển đổi giữa số mol, khối lượng và thể tích chất khí ở điều kiện chuẩn.',
    [
      { k: 'p', v: 'Mol là lượng chất chứa 6,022 × 10²³ hạt. Khối lượng mol là khối lượng của một mol chất, tính bằng gam.' },
      { k: 'f', v: 'n = m / M   ·   V = n × 22,4 (đktc)   ·   n = V / 24,79 (đkc 25 °C, 1 bar)' },
      { k: 'note', v: 'Hai mốc thể tích rất dễ lẫn: 22,4 lít dùng cho điều kiện tiêu chuẩn 0 °C, còn 24,79 lít cho điều kiện chuẩn 25 °C – đề ghi “đkc” thì lấy 24,79.' },
      { k: 'q', v: 'Tính số mol của 8 g CuO (M = 80).', a: 'n = 8 : 80 = 0,1 mol.' }
    ]),
  _L(10, 'toan', 'Bất phương trình bậc hai một ẩn', 'Đại số · chương 3',
    'Xét dấu tam thức bậc hai và viết đúng tập nghiệm.',
    [
      { k: 'p', v: 'Tam thức f(x) = ax² + bx + c (a ≠ 0) cùng dấu với a ở ngoài khoảng hai nghiệm và trái dấu với a ở trong khoảng hai nghiệm.' },
      { k: 'f', v: 'Δ < 0: f(x) cùng dấu a với mọi x   ·   Δ = 0: cùng dấu a trừ nghiệm kép' },
      { k: 'ul', v: ['Bước 1: giải phương trình f(x) = 0 tìm nghiệm', 'Bước 2: lập bảng xét dấu theo hệ số a', 'Bước 3: đọc khoảng thoả mãn, chú ý dấu “≤” thì lấy cả nghiệm'] },
      { k: 'q', v: 'Giải x² − 5x + 6 < 0.', a: 'Nghiệm 2 và 3, a > 0 nên f < 0 trong (2; 3). Tập nghiệm (2; 3).' }
    ]),
  _L(10, 'vatli', 'Chuyển động thẳng biến đổi đều', 'Động học · chương 2',
    'Dùng đúng ba phương trình và xử lý dấu của gia tốc.',
    [
      { k: 'p', v: 'Gia tốc là độ biến thiên vận tốc trong một đơn vị thời gian. Chuyển động nhanh dần đều có a cùng dấu v; chậm dần đều có a ngược dấu v.' },
      { k: 'f', v: 'v = v₀ + at   ·   s = v₀t + ½at²   ·   v² − v₀² = 2as' },
      { k: 'note', v: 'Chọn chiều dương trước khi thay số. Sai dấu gia tốc là lỗi mất điểm phổ biến nhất ở dạng này.' },
      { k: 'q', v: 'Xe đang chạy 10 m/s thì hãm, gia tốc −2 m/s². Sau bao lâu xe dừng?', a: 'v = 0 → 0 = 10 − 2t → t = 5 s.' }
    ]),
  _L(10, 'hoa', 'Liên kết ion và liên kết cộng hoá trị', 'Liên kết hoá học · chương 3',
    'Phân biệt hai loại liên kết qua hiệu độ âm điện và bản chất hạt.',
    [
      { k: 'p', v: 'Kim loại điển hình gặp phi kim điển hình tạo liên kết ion (cho – nhận electron). Hai phi kim góp chung electron tạo liên kết cộng hoá trị.' },
      { k: 'ul', v: ['Hiệu độ âm điện ≥ 1,7: phần lớn là liên kết ion', 'Từ 0,4 đến 1,7: cộng hoá trị phân cực', 'Dưới 0,4: cộng hoá trị không phân cực'] },
      { k: 'note', v: 'Chất ion dẫn điện khi nóng chảy hoặc tan trong nước, không dẫn khi ở thể rắn — đây là câu hỏi lý thuyết hay gặp.' },
      { k: 'q', v: 'NaCl thuộc loại liên kết gì? Vì sao?', a: 'Liên kết ion: Na (kim loại điển hình) nhường electron cho Cl (phi kim điển hình).' }
    ]),
  _L(10, 'anh', 'Mệnh đề quan hệ: who, which, that', 'Grammar · Unit 9',
    'Chọn đúng đại từ quan hệ và biết khi nào cần dấu phẩy.',
    [
      { k: 'p', v: 'Mệnh đề quan hệ bổ nghĩa cho danh từ đứng trước. Dùng who cho người, which cho vật, that cho cả hai trong mệnh đề xác định.' },
      { k: 'ul', v: ['The teacher who taught me physics has retired.', 'The book which I borrowed is overdue.', 'Mệnh đề không xác định đặt sau dấu phẩy, không dùng that.'] },
      { k: 'note', v: 'Trong mệnh đề không xác định (có dấu phẩy), không được dùng “that” và không được bỏ đại từ quan hệ.' },
      { k: 'q', v: 'Điền: The house ___ we bought last year is near the river.', a: 'which (hoặc that) — mệnh đề xác định, bổ nghĩa cho vật.' }
    ]),
  _L(11, 'toan', 'Cấp số cộng và cấp số nhân', 'Đại số · chương 2',
    'Nhận dạng dãy, tính số hạng tổng quát và tổng n số hạng đầu.',
    [
      { k: 'p', v: 'Cấp số cộng có hiệu hai số hạng liên tiếp không đổi; cấp số nhân có thương không đổi.' },
      { k: 'f', v: 'CSC: uₙ = u₁ + (n − 1)d, Sₙ = n(u₁ + uₙ)/2   ·   CSN: uₙ = u₁·qⁿ⁻¹' },
      { k: 'ul', v: ['Ba số a, b, c lập CSC khi 2b = a + c', 'Ba số lập CSN khi b² = ac (chú ý b ≠ 0)', 'Tổng CSN lùi vô hạn: S = u₁/(1 − q) với |q| < 1'] },
      { k: 'q', v: 'CSC có u₁ = 3, d = 4. Tính u₁₀.', a: 'u₁₀ = 3 + 9·4 = 39.' }
    ]),
  _L(11, 'vatli', 'Dao động điều hoà: phương trình và đồ thị', 'Dao động · chương 1',
    'Đọc được A, ω, φ từ phương trình và liên hệ với chu kỳ, tần số.',
    [
      { k: 'p', v: 'Trong dao động điều hoà, li độ biến thiên theo hàm cosin. Biên độ A là độ lệch lớn nhất, pha ban đầu φ quyết định vị trí lúc t = 0.' },
      { k: 'f', v: 'x = A·cos(ωt + φ)   ·   v = −Aω·sin(ωt + φ)   ·   ω = 2π/T = 2πf' },
      { k: 'ul', v: ['Ở biên: |x| = A, v = 0, gia tốc cực đại', 'Ở vị trí cân bằng: x = 0, tốc độ cực đại Aω', 'Chu kỳ con lắc lò xo: T = 2π√(m/k)'] },
      { k: 'q', v: 'x = 6cos(4πt) cm. Biên độ, chu kỳ và tốc độ cực đại?', a: 'A = 6 cm, T = 0,5 s, vmax = Aω = 24π cm/s.' }
    ]),
  _L(11, 'sinh', 'Quang hợp ở thực vật', 'Trao đổi chất · chương 1',
    'Nêu hai pha, sản phẩm chính và các yếu tố ảnh hưởng tới cường độ quang hợp.',
    [
      { k: 'p', v: 'Quang hợp biến năng lượng ánh sáng thành năng lượng hoá học: nước và CO₂ tạo glucôzơ và O₂, diễn ra ở lục lạp.' },
      { k: 'f', v: '6CO₂ + 12H₂O → C₆H₁₂O₆ + 6O₂ + 6H₂O   (có ánh sáng, diệp lục)' },
      { k: 'ul', v: ['Pha sáng ở màng tilacôit: tạo ATP, NADPH và giải phóng O₂', 'Pha tối (chu trình Calvin) ở chất nền: cố định CO₂ thành đường', 'Cường độ quang hợp phụ thuộc ánh sáng, CO₂, nhiệt độ và nước'] },
      { k: 'q', v: 'O₂ thải ra trong quang hợp có nguồn gốc từ đâu?', a: 'Từ nước, qua quá trình quang phân li nước ở pha sáng.' }
    ]),
  _L(11, 'tin', 'Mảng một chiều và sắp xếp nổi bọt', 'Python · chương 3',
    'Hiểu chỉ số mảng từ 0 và viết được vòng lặp sắp xếp đơn giản.',
    [
      { k: 'p', v: 'Mảng một chiều lưu nhiều giá trị cùng kiểu. Trong Python, phần tử đầu tiên có chỉ số 0, phần tử cuối là len(a) − 1.' },
      { k: 'f', v: 'a = [5, 2, 9, 1]   ·   len(a) = 4   ·   a[-1] là phần tử cuối' },
      { k: 'ul', v: ['Duyệt: for x in a hoặc for i in range(len(a))', 'Sắp xếp nổi bọt: so sánh từng cặp kề nhau, đổi chỗ nếu sai thứ tự', 'Sau vòng thứ i, phần tử lớn thứ i đã về cuối'] },
      { k: 'q', v: 'Vì sao vòng lặp ngoài của sắp xếp nổi bọt chạy len(a) − 1 lần là đủ?', a: 'Vì sau mỗi lượt, phần tử lớn nhất còn lại đã về đúng vị trí; phần tử cuối cùng tự động đúng chỗ.' }
    ]),
  _L(12, 'toan', 'Khảo sát hàm số bậc ba và bài toán tiếp tuyến', 'Giải tích · chương 1',
    'Lập bảng biến thiên đúng và viết được phương trình tiếp tuyến tại một điểm.',
    [
      { k: 'p', v: 'Khảo sát hàm bậc ba theo bốn bước: tập xác định, đạo hàm và cực trị, giới hạn, bảng biến thiên rồi vẽ đồ thị.' },
      { k: 'ul', v: ['y′ = 3ax² + 2bx + c; y′ = 0 cho cực trị', 'Hệ số a > 0: nhánh phải đi lên; a < 0: nhánh phải đi xuống', 'Điểm uốn tại x = −b/(3a)'] },
      { k: 'f', v: 'Tiếp tuyến tại x₀: y = y′(x₀)(x − x₀) + y(x₀)' },
      { k: 'q', v: 'Hệ số góc tiếp tuyến của y = x³ − 3x tại x = 1?', a: 'y′ = 3x² − 3 → y′(1) = 0. Tiếp tuyến nằm ngang, y = −2.' }
    ]),
  _L(12, 'hoa', 'Este và phản ứng xà phòng hoá', 'Hữu cơ · chương 1',
    'Viết đúng phản ứng thuỷ phân trong môi trường kiềm và tính khối lượng muối.',
    [
      { k: 'p', v: 'Este là sản phẩm của axit và ancol. Thuỷ phân este trong kiềm (xà phòng hoá) cho muối và ancol, phản ứng một chiều.' },
      { k: 'f', v: 'RCOOR′ + NaOH → RCOONa + R′OH' },
      { k: 'ul', v: ['Este của phenol cho hai muối khi tác dụng NaOH dư', 'Khối lượng muối = m este + m NaOH − m ancol', 'Chất béo là este của glixerol với axit béo, xà phòng hoá cho xà phòng + glixerol'] },
      { k: 'q', v: 'Xà phòng hoá 8,8 g etyl axetat (M = 88) bằng NaOH vừa đủ. Số mol NaOH cần dùng?', a: 'n = 8,8/88 = 0,1 mol → cần 0,1 mol NaOH.' }
    ]),
  _L(12, 'sudia', 'Cách mạng tháng Tám 1945: thời cơ và hành động', 'Lịch sử Việt Nam · bài 16',
    'Trình bày được thời cơ “ngàn năm có một” và ba cao trào tiến tới tổng khởi nghĩa.',
    [
      { k: 'p', v: 'Ngay khi Nhật đầu hàng Đồng minh (15/8/1945), chính quyền tay sai hoang mang, quân Đồng minh chưa vào Đông Dương — đó là khoảng trống quyền lực tạo thời cơ.' },
      { k: 'ul', v: ['Hội nghị toàn quốc (13–15/8): quyết định tổng khởi nghĩa', 'Quốc dân Đại hội Tân Trào (16/8): thông qua 10 chính sách', '19/8 Hà Nội khởi nghĩa thắng lợi; 2/9 Tuyên ngôn Độc lập'] },
      { k: 'note', v: 'Thời cơ là ngắn hạn: thắng lợi nhanh trước khi quân Đồng minh kéo vào giải giáp quân Nhật.' },
      { k: 'q', v: 'Vì sao khởi nghĩa tháng Tám được coi là thắng lợi ít đổ máu?', a: 'Vì chọn đúng thời điểm chính quyền địch đã tê liệt, giành chính quyền trước khi đối phương kịp phản ứng.' }
    ]),
  _L(12, 'sudia', 'Địa lí nông nghiệp Việt Nam: cơ cấu và chuyển dịch', 'Địa lí kinh tế · bài 22',
    'Đọc được cơ cấu nông – lâm – thuỷ sản và xu hướng chuyển dịch của ngành.',
    [
      { k: 'p', v: 'Nông nghiệp nước ta chuyển từ lượng sang chất: tăng giá trị, chú trọng giống, thuỷ lợi và thị trường xuất khẩu.' },
      { k: 'ul', v: ['Trồng trọt vẫn chiếm phần lớn nhưng tỉ trọng giảm dần', 'Chăn nuôi và thuỷ sản tăng do nhu cầu thịt, sữa, hải sản', 'Vùng chuyên canh: Đồng bằng sông Cửu Long, Đông Nam Bộ, Tây Nguyên'] },
      { k: 'note', v: 'Khi phân tích biểu đồ cơ cấu, phải nêu xu hướng tăng – giảm kèm số liệu, không chỉ mô tả từng phần.' },
      { k: 'q', v: 'Vì sao thuỷ sản tăng trưởng nhanh nhất trong nông – lâm – thuỷ sản?', a: 'Do nhu cầu xuất khẩu lớn, vùng biển và đồng bằng rộng, cùng đầu tư nuôi trồng.' }
    ]),
  _L(12, 'gdcd', 'Quyền bình đẳng của công dân trước pháp luật', 'Pháp luật · bài 3',
    'Nêu nội dung quyền bình đẳng và lấy được ví dụ trong thực tế.',
    [
      { k: 'p', v: 'Mọi công dân đều bình đẳng trước pháp luật: không ai bị phân biệt đối xử vì giới tính, dân tộc, tôn giáo, thành phần xã hội.' },
      { k: 'ul', v: ['Bình đẳng về quyền và nghĩa vụ', 'Bình đẳng về trách nhiệm pháp lí', 'Bình đẳng trong gia đình, lao động, kinh doanh'] },
      { k: 'note', v: 'Bình đẳng không phải “chia đều như nhau”, mà là cùng một chuẩn pháp luật áp dụng như nhau.' },
      { k: 'q', v: 'Vì sao người phạm tội như nhau phải chịu trách nhiệm pháp lí như nhau dù khác chức vụ?', a: 'Vì công dân bình đẳng về trách nhiệm pháp lí; chức vụ không tạo ra ngoại lệ trước pháp luật.' }
    ]),
  _L(12, 'tin', 'Cơ sở dữ liệu quan hệ và câu lệnh SELECT', 'SQL · chương 4',
    'Xác định khoá chính và viết được câu lệnh truy vấn có lọc, sắp xếp.',
    [
      { k: 'p', v: 'Dữ liệu quan hệ lưu trong các bảng liên kết bằng khoá. Khoá chính định danh duy nhất mỗi bản ghi, khoá ngoại nối sang bảng khác.' },
      { k: 'f', v: 'SELECT tên_học_sinh FROM Lớp WHERE điểm_toán >= 8 ORDER BY điểm_toán DESC;' },
      { k: 'ul', v: ['Mỗi bảng nên có một khoá chính, không dùng thông tin có thể đổi làm khoá', 'WHERE lọc dòng trước khi sắp xếp', 'Câu lệnh chỉ đổi dữ liệu: INSERT, UPDATE, DELETE'] },
      { k: 'q', v: 'Hai bảng HọcSinh và Điểm nên nối nhau bằng cột nào?', a: 'Khoá ngoại mã_học_sinh trong bảng Điểm tham chiếu tới khoá chính của HọcSinh.' }
    ]),
  _L(1, 'van', 'Tập đọc: đọc đúng và hiểu câu', 'Tập đọc · tuần 5',
    'Đọc trôi chảy một đoạn ngắn, trả lời được câu hỏi “ai, làm gì, ở đâu”.',
    [
      { k: 'p', v: 'Khi đọc, con đọc thành tiếng rõ ràng, nghỉ ở dấu phẩy và dấu chấm. Đọc xong phải trả lời được nội dung câu.' },
      { k: 'ul', v: ['Ai? — tìm tên người hoặc con vật', 'Làm gì? — tìm hành động chính', 'Ở đâu? — tìm nơi xảy ra sự việc'] },
      { k: 'note', v: 'Đọc chậm mà đúng còn hơn đọc nhanh mà sai dấu, nuốt chữ.' },
      { k: 'q', v: 'Trong câu “Bé Lan tưới hoa ở vườn”, ai làm gì và ở đâu?', a: 'Bé Lan tưới hoa — ở vườn.' }
    ]),
  _L(2, 'van', 'Từ chỉ sự vật và câu kiểu “Ai là gì?”', 'Luyện từ và câu · tuần 4',
    'Nhận ra từ chỉ sự vật và đặt được câu giới thiệu đơn giản.',
    [
      { k: 'p', v: 'Từ chỉ sự vật là những từ gọi tên người, đồ vật, con vật, cây cối. Câu kiểu “Ai là gì?” dùng để giới thiệu.' },
      { k: 'ul', v: ['Sự vật: bàn, mèo, cô giáo, cây bàng', 'Câu mẫu: Bạn Nam là lớp trưởng.', 'Cấu trúc: Ai (cái gì, con gì) + là + gì'] },
      { k: 'q', v: 'Đặt câu kiểu “Ai là gì?” giới thiệu mẹ em.', a: 'Ví dụ: Mẹ em là bác sĩ.' }
    ]),
  _L(4, 'van', 'Tả con vật em yêu thích', 'Tập làm văn · tuần 12',
    'Viết đoạn tả hình dáng và hoạt động của con vật, có câu mở đoạn.',
    [
      { k: 'p', v: 'Bài tả con vật cần chọn được con vật em thật sự quan sát. Tả theo trình tự: hình dáng chung → bộ phận nổi bật → hoạt động.' },
      { k: 'ul', v: ['Mở đoạn: giới thiệu con vật và lí do em thích', 'Thân đoạn: lông, mắt, tai, đuôi… chọn 3 chi tiết đặc sắc', 'Kết đoạn: tình cảm của em, cách em chăm sóc'] },
      { k: 'note', v: 'Dùng từ gợi tả: “bộ lông vàng óng”, “đôi mắt tròn xoe” thay cho “rất đẹp”, “rất đáng yêu”.' },
      { k: 'q', v: 'Vì sao không nên viết “con mèo của em rất đẹp”?', a: 'Vì câu chung chung, không cho người đọc thấy con mèo đẹp ở đâu.' }
    ]),
  _L(6, 'van', 'Truyện cổ tích: đặc điểm và ý nghĩa', 'Đọc hiểu · chủ đề 2',
    'Nêu đặc trưng thể loại và phân tích một chi tiết kỳ ảo trong truyện.',
    [
      { k: 'p', v: 'Truyện cổ tích phản ánh ước mơ của nhân dân về công bằng, hạnh phúc. Yếu tố kỳ ảo là công cụ để điều chỉnh số phận nhân vật.' },
      { k: 'ul', v: ['Kiểu nhân vật: người bất hạnh, người tài, kẻ ác…', 'Kết thúc có hậu: thiện thắng, ác bị trừng phạt', 'Chi tiết kỳ ảo gắn với niềm tin và ước mơ của người kể'] },
      { k: 'note', v: 'Khi phân tích, nêu chi tiết kỳ ảo gắn với nhân vật nào và nó thay đổi câu chuyện ra sao, đừng chỉ kể lại.' },
      { k: 'q', v: 'Em hãy nêu một chi tiết kỳ ảo ở truyện Tấm Cám và tác dụng của nó.', a: 'Ví dụ: ông Bụt hiện lên giúp Tấm — thể hiện niềm tin cái thiện luôn được che chở.' }
    ]),
  _L(6, 'anh', 'Thì hiện tại đơn: thói quen và sự thật', 'Grammar · Unit 3',
    'Chia đúng động từ ngôi thứ ba số ít và dùng trạng từ tần suất.',
    [
      { k: 'p', v: 'Thì hiện tại đơn diễn tả thói quen, lịch học, sự thật hiển nhiên.' },
      { k: 'ul', v: ['I / you / we / they + V', 'He / she / it + V-s (watch → watches, study → studies)', 'Phủ định: do/does + not + V nguyên thể'] },
      { k: 'note', v: 'Trạng từ tần suất đứng trước động từ thường: She usually walks to school.' },
      { k: 'q', v: 'Chia động từ: My brother (go) to school by bike.', a: 'goes — chủ ngữ số ít.' }
    ]),
];
SEED.push(...SEED_MORE);
