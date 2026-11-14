/* =========================================================
   SEED — Tiếng Anh, Hoá, Toán, Ngữ văn
   ---------------------------------------------------------
   Why this file exists: the grade 1-12 shelf promised 13 subjects but only
   carried 1-2 lessons each outside Physics — a shelf of empty shelves. These
   are the subjects a student actually sits exams in, so they get real
   content, not placeholders.

   Written to be *taught from*, not skimmed: every lesson has a claim, a
   worked example, the mistake people actually make, and one question the
   reader has to answer in their own words. The `q` block is the important
   one — reading a lesson should end with something to do.

   Block kinds are the ones school.js already renders:
     p = paragraph, ul = bullet list, f = formula, note = aside, q = question
   ========================================================= */
const _M = (g, s, t, tag, aim, blocks) => ({ g, s, t, tag, aim, blocks });

const SEED_MORE2 = [

  /* ============================================================
     TIẾNG ANH — ngữ pháp có hệ thống, theo đúng thứ tự thi
     ============================================================ */
  _M(6, 'anh', 'Thì hiện tại đơn: hình thức và cách dùng', 'Ngữ pháp · thì cơ bản',
    'Chia đúng hiện tại đơn ở khẳng định, phủ định, nghi vấn và nhận ra dấu hiệu thì.',
    [
      { k: 'p', v: 'Hiện tại đơn nói về việc lặp lại, thói quen, sự thật. Đây là thì phải thuộc trước mọi thì khác, vì nó xuất hiện trong gần như mọi bài viết.' },
      { k: 'f', v: 'Khẳng định: S + V(s/es) · Phủ định: S + do/does + not + V · Nghi vấn: Do/Does + S + V ?' },
      { k: 'ul', v: [
        'Thêm -es khi động từ tận cùng là -s, -sh, -ch, -x, -o: watch → watches, go → goes',
        'Phụ âm + y thì đổi y thành i rồi thêm -es: study → studies. Nguyên âm + y thì giữ: play → plays',
        'Dấu hiệu: always, usually, often, sometimes, never, every day, on Sundays',
      ] },
      { k: 'note', v: 'Lỗi phổ biến nhất: "He don\'t like it". Chủ ngữ số ít ngôi thứ ba thì dùng does, và khi đã có does thì động từ chính trở về nguyên thể — "He doesn\'t like it", không phải "doesn\'t likes".' },
      { k: 'q', v: 'Chia đúng: "My sister (watch) ____ TV every evening, but she (not/like) ____ the news."', a: 'watches — doesn\'t like. Chủ ngữ "my sister" là số ít nên thêm -es; phủ định dùng doesn\'t + động từ nguyên thể.' },
    ]),

  _M(6, 'anh', 'Danh từ đếm được và không đếm được', 'Ngữ pháp · danh từ',
    'Dùng đúng a/an/some/any/much/many với hai loại danh từ.',
    [
      { k: 'p', v: 'Danh từ đếm được có số nhiều và đi với a/an hoặc số đếm: a book, two books. Danh từ không đếm được không có số nhiều và không đi với a/an: water, information, advice, homework.' },
      { k: 'ul', v: [
        'Đếm được: book, chair, student, apple → many books, a few books',
        'Không đếm được: water, rice, money, news, furniture → much water, a little water',
        'some dùng trong khẳng định, any dùng trong phủ định và nghi vấn',
      ] },
      { k: 'note', v: '"News" trông như số nhiều nhưng là không đếm được: "The news is good", không phải "are good". Cùng nhóm: physics, maths, economics.' },
      { k: 'q', v: 'Điền much hoặc many: "How ____ homework do you have?" và "How ____ students are there?"', a: 'How much homework (homework không đếm được) · How many students (students đếm được).' },
    ]),

  _M(7, 'anh', 'Thì hiện tại hoàn thành và quá khứ đơn', 'Ngữ pháp · thì quan trọng nhất',
    'Phân biệt hai thì này — đây là chỗ mất điểm nhiều nhất trong bài viết.',
    [
      { k: 'p', v: 'Quá khứ đơn nói về một việc đã kết thúc ở một thời điểm xác định. Hiện tại hoàn thành nói về việc còn liên quan tới hiện tại, hoặc kinh nghiệm tính đến bây giờ.' },
      { k: 'f', v: 'QKĐ: S + V2/ed · HTHT: S + have/has + V3/ed' },
      { k: 'ul', v: [
        'QKĐ đi với: yesterday, last week, in 2019, two days ago — mốc thời gian đã đóng',
        'HTHT đi với: already, yet, ever, never, since, for, so far, recently',
        'so sánh: "I saw that film yesterday" (xong) · "I have seen that film" (còn nhớ, còn liên quan)',
      ] },
      { k: 'note', v: 'Nếu trong câu đã có mốc thời gian quá khứ thì không dùng hiện tại hoàn thành. "I have seen him yesterday" là sai; phải là "I saw him yesterday".' },
      { k: 'q', v: 'Chọn thì đúng: "She (live) ____ here since 2020."', a: 'has lived — "since 2020" nối tới hiện tại nên dùng hiện tại hoàn thành.' },
    ]),

  _M(8, 'anh', 'Câu bị động: khi nào dùng và dựng thế nào', 'Ngữ pháp · câu bị động',
    'Chuyển câu chủ động sang bị động đúng thì và đúng giới từ.',
    [
      { k: 'p', v: 'Bị động dùng khi người làm hành động không quan trọng, không biết, hoặc hiển nhiên. Trong văn viết học thuật, bị động giúp câu khách quan hơn.' },
      { k: 'f', v: 'S + be + V3/ed (+ by O) — thì của "be" theo thì của câu gốc' },
      { k: 'ul', v: [
        'Hiện tại đơn: They clean the room → The room is cleaned',
        'Quá khứ đơn: Someone stole my bike → My bike was stolen',
        'Hiện tại hoàn thành: They have built a bridge → A bridge has been built',
      ] },
      { k: 'note', v: 'Động từ có hai tân ngữ (give, send, offer) có thể lấy tân ngữ nào làm chủ ngữ cũng được: "I was given a book" hoặc "A book was given to me". Cách thứ hai cần giới từ to.' },
      { k: 'q', v: 'Chuyển sang bị động: "They will announce the results tomorrow."', a: 'The results will be announced tomorrow. ("will be" + V3)' },
    ]),

  _M(9, 'anh', 'Mệnh đề quan hệ: who, which, that, whose', 'Ngữ pháp · câu phức',
    'Nối hai câu bằng đại từ quan hệ đúng chức năng.',
    [
      { k: 'p', v: 'Mệnh đề quan hệ bổ nghĩa cho danh từ đứng trước. Chọn đại từ theo việc danh từ đó là người hay vật, và nó làm chủ ngữ hay tân ngữ trong mệnh đề.' },
      { k: 'ul', v: [
        'who — người, làm chủ ngữ: the man who called you',
        'which — vật: the book which I bought',
        'that — cả người và vật, trong mệnh đề xác định',
        'whose — sở hữu: the student whose bike was stolen',
        'where — nơi chốn: the school where I studied',
      ] },
      { k: 'note', v: 'Không dùng "that" sau dấu phẩy. "My father, that is a doctor" sai; phải là "My father, who is a doctor". Mệnh đề không xác định thì không rút gọn được bằng that.' },
      { k: 'q', v: 'Nối hai câu: "This is the girl. Her brother won the prize."', a: 'This is the girl whose brother won the prize. (quan hệ sở hữu → whose)' },
    ]),

  _M(10, 'anh', 'Câu điều kiện loại 1, 2, 3', 'Ngữ pháp · câu điều kiện',
    'Dùng đúng ba loại điều kiện và nhận ra loại nào cần ở đề bài.',
    [
      { k: 'p', v: 'Ba loại điều kiện khác nhau ở mức độ có thật: loại 1 là có thể xảy ra, loại 2 là không có thật ở hiện tại, loại 3 là không thể thay đổi vì đã qua.' },
      { k: 'f', v: 'Loại 1: If + S + V(s/es), S + will + V · Loại 2: If + S + V2/ed, S + would + V · Loại 3: If + S + had + V3, S + would have + V3' },
      { k: 'ul', v: [
        'Loại 1: If it rains, we will stay home — trời có thể mưa',
        'Loại 2: If I were you, I would apply — giả định không có thật',
        'Loại 3: If I had studied, I would have passed — đã không học, không sửa được',
      ] },
      { k: 'note', v: 'Loại 2 luôn dùng "were" cho mọi chủ ngữ: "If I were", "If he were". "If I was" sai trong văn viết chuẩn.' },
      { k: 'q', v: 'Chia đúng: "If she (know) ____ the answer, she (tell) ____ you." — biết rằng cô ấy thật sự không biết.', a: 'knew — would tell. Đây là loại 2 vì giả định trái với hiện tại.' },
    ]),

  _M(11, 'anh', 'Viết lại câu: các dạng phổ biến trong đề thi', 'Kỹ năng · viết lại câu',
    'Nhận diện dạng viết lại câu và chọn cấu trúc tương đương.',
    [
      { k: 'p', v: 'Viết lại câu kiểm tra xem bạn có biết nhiều cách nói cùng một ý. Đề thường cho một câu rồi yêu cầu viết lại sao cho nghĩa không đổi, bắt đầu bằng từ cho sẵn.' },
      { k: 'ul', v: [
        'so ... that → such ... that: "The box was so heavy that..." = "It was such a heavy box that..."',
        'too ... to → not ... enough: "He is too young to drive" = "He is not old enough to drive"',
        'because → because of + N: "because it rained" = "because of the rain"',
        'although → in spite of + N/V-ing',
      ] },
      { k: 'note', v: 'Chú ý đổi cả trật tự từ khi đổi cấu trúc. "So heavy that" thành "such a heavy box that" phải thêm mạo từ "a" và đảo tính từ ra trước danh từ.' },
      { k: 'q', v: 'Viết lại: "The coffee was too hot for me to drink." → bắt đầu bằng "The coffee was not ____"', a: 'The coffee was not cool enough for me to drink.' },
    ]),

  /* ============================================================
     HOÁ — 8, 10, 11, 12
     ============================================================ */
  _M(8, 'hoa', 'Nguyên tử, nguyên tố và công thức hoá học', 'Chương 1 · chất và nguyên tử',
    'Viết đúng công thức và tính phân tử khối.',
    [
      { k: 'p', v: 'Nguyên tử là hạt nhỏ nhất không chia được bằng phản ứng hoá học. Nguyên tố là tập hợp các nguyên tử cùng số proton. Công thức hoá học cho biết có bao nhiêu nguyên tử mỗi nguyên tố trong một phân tử.' },
      { k: 'ul', v: [
        'Chỉ số dưới ghi số nguyên tử: H₂O = 2 H và 1 O',
        'Hệ số đứng trước ghi số phân tử: 2H₂O = 2 phân tử nước',
        'Phân tử khối = tổng khối lượng các nguyên tử: H₂O = 2·1 + 16 = 18',
      ] },
      { k: 'note', v: 'Đừng nhầm chỉ số với hệ số. Trong 2H₂O có 4 nguyên tử H, không phải 2. Đây là lỗi cân bằng phương trình phổ biến nhất.' },
      { k: 'q', v: 'Tính phân tử khối của H₂SO₄ (H=1, S=32, O=16).', a: '2·1 + 32 + 4·16 = 98 đvC.' },
    ]),

  _M(8, 'hoa', 'Cân bằng phương trình hoá học', 'Chương 2 · phản ứng',
    'Cân bằng được phương trình đơn giản bằng phương pháp đếm nguyên tử.',
    [
      { k: 'p', v: 'Phản ứng hoá học giữ nguyên số nguyên tử mỗi nguyên tố. Cân bằng phương trình là đặt hệ số sao cho hai bên có cùng số nguyên tử từng nguyên tố.' },
      { k: 'ul', v: [
        'Bước 1: viết đúng công thức hai vế',
        'Bước 2: đếm nguyên tử từng nguyên tố ở mỗi vế',
        'Bước 3: đặt hệ số, bắt đầu từ nguyên tố xuất hiện ít chỗ nhất',
        'Bước 4: đếm lại cả hai vế, kiểm tra lần cuối',
      ] },
      { k: 'note', v: 'Không bao giờ sửa chỉ số để cân bằng. Đổi H₂O thành H₂O₂ là đổi chất, không phải đổi hệ số.' },
      { k: 'q', v: 'Cân bằng: Fe + O₂ → Fe₃O₄', a: '3Fe + 2O₂ → Fe₃O₄. Vế phải có 3 Fe và 4 O, nên cần 3 Fe và 2 O₂.' },
    ]),

  _M(10, 'hoa', 'Mol và cách tính theo mol', 'Chương 3 · mol và tính toán',
    'Chuyển đổi giữa khối lượng, thể tích khí và số mol.',
    [
      { k: 'p', v: 'Mol là lượng chất chứa 6,022·10²³ hạt. Mọi bài tính theo phương trình đều đi qua mol — đây là cây cầu giữa khối lượng cân được và thể tích đo được.' },
      { k: 'f', v: 'n = m / M · n = V / 22,4 (khí, đktc) · n = C_M · V_dd' },
      { k: 'ul', v: [
        'n (mol), m (gam), M (gam/mol)',
        'Thể tích khí ở điều kiện tiêu chuẩn: 1 mol = 22,4 lít',
        'Nồng độ mol: C_M = n / V, V tính bằng lít',
      ] },
      { k: 'note', v: 'Đơn vị là chỗ mất điểm: V trong C_M tính bằng lít, nhưng nhiều đề cho ml. 250 ml = 0,25 lít — phải đổi trước khi chia.' },
      { k: 'q', v: 'Hoà tan 8 gam NaOH (M=40) vào nước thành 200 ml dung dịch. Tính C_M.', a: 'n = 8/40 = 0,2 mol; V = 0,2 lít; C_M = 0,2/0,2 = 1 M.' },
    ]),

  _M(10, 'hoa', 'Tính theo phương trình hoá học', 'Chương 3 · bài toán định lượng',
    'Giải bài toán có lượng chất cho trước bằng chuỗi tỉ lệ mol.',
    [
      { k: 'p', v: 'Bài toán tính theo phương trình luôn đi theo một đường: đổi dữ kiện ra mol → dùng tỉ lệ hệ số → đổi mol kết quả ra đại lượng đề hỏi. Không có đường tắt.' },
      { k: 'ul', v: [
        'Bước 1: viết và cân bằng phương trình',
        'Bước 2: tính số mol chất đã biết',
        'Bước 3: lập tỉ lệ theo hệ số để ra mol chất cần tìm',
        'Bước 4: đổi mol ra gam hoặc lít',
      ] },
      { k: 'note', v: 'Nếu đề cho hai chất tham gia, phải tìm chất hết trước. Chất hết quyết định lượng sản phẩm; bỏ qua bước này là lỗi nặng nhất của dạng bài.' },
      { k: 'q', v: 'Đốt 4,8 gam Mg (M=24) trong O₂ dư. Tính khối lượng MgO tạo thành (MgO = 40).', a: '2Mg + O₂ → 2MgO. n(Mg) = 0,2 mol → n(MgO) = 0,2 mol → m = 8 gam.' },
    ]),

  _M(11, 'hoa', 'Cân bằng hoá học và nguyên lí Le Chatelier', 'Chương 7 · tốc độ và cân bằng',
    'Dự đoán chiều chuyển dịch khi thay đổi điều kiện.',
    [
      { k: 'p', v: 'Phản ứng thuận nghịch đạt cân bằng khi tốc độ thuận bằng tốc độ nghịch. Cân bằng không phải là đứng yên — hai chiều vẫn chạy, chỉ là bằng nhau.' },
      { k: 'p', v: 'Nguyên lí Le Chatelier: khi tác động vào hệ đang cân bằng, hệ chuyển dịch theo chiều làm giảm tác động đó.' },
      { k: 'ul', v: [
        'Tăng nồng độ chất phản ứng → chuyển dịch sang phải (tạo sản phẩm)',
        'Tăng áp suất → chuyển dịch về phía ít phân tử khí hơn',
        'Tăng nhiệt độ → chuyển dịch về phía phản ứng thu nhiệt',
      ] },
      { k: 'note', v: 'Chất xúc tác không làm chuyển dịch cân bằng. Nó làm cả hai chiều nhanh hơn, nên hệ đạt cân bằng sớm hơn nhưng ở cùng vị trí. Đây là câu hỏi bẫy quen thuộc.' },
      { k: 'q', v: 'N₂ + 3H₂ ⇌ 2NH₃ (toả nhiệt). Muốn thu được nhiều NH₃ thì tăng hay giảm nhiệt độ?', a: 'Giảm nhiệt độ — phản ứng thuận toả nhiệt, giảm nhiệt độ làm hệ chuyển dịch sang phải.' },
    ]),

  _M(12, 'hoa', 'Este, chất béo và phản ứng xà phòng hoá', 'Chương 1 · este và lipit',
    'Viết được phản ứng thuỷ phân và tính toán khối lượng xà phòng.',
    [
      { k: 'p', v: 'Este là sản phẩm của axit và ancol, mất nước. Chất béo là este ba chức của glixerol với các axit béo. Thuỷ phân este trong kiềm gọi là xà phòng hoá.' },
      { k: 'f', v: 'RCOOR\' + NaOH → RCOONa + R\'OH · (RCOO)₃C₃H₅ + 3NaOH → 3RCOONa + C₃H₅(OH)₃' },
      { k: 'ul', v: [
        'Thuỷ phân trong axit là phản ứng thuận nghịch',
        'Thuỷ phân trong kiềm là một chiều — dùng để điều chế xà phòng',
        'Chất béo no là rắn (mỡ), không no là lỏng (dầu)',
      ] },
      { k: 'note', v: 'Bảo toàn khối lượng là cách kiểm tra nhanh: m(este) + m(NaOH) = m(muối) + m(ancol). Nếu lệch thì đã sai ở hệ số hoặc ở chỗ quên ancol.' },
      { k: 'q', v: 'Xà phòng hoá 8,8 gam etyl axetat (M=88) bằng NaOH dư. Tính khối lượng muối thu được (CH₃COONa = 82).', a: 'n = 0,1 mol → n(muối) = 0,1 → m = 8,2 gam.' },
    ]),

  /* ============================================================
     TOÁN — 8, 9, 10, 11, 12
     ============================================================ */
  _M(8, 'toan', 'Hằng đẳng thức đáng nhớ', 'Đại số · chương 1',
    'Nhận ra và áp dụng bảy hằng đẳng thức theo cả hai chiều.',
    [
      { k: 'p', v: 'Hằng đẳng thức là công cụ rút gọn nhanh nhất. Điều quan trọng không phải thuộc lòng mà là nhận ra dạng: nhìn thấy a² − b² thì phải nghĩ ngay tới (a−b)(a+b).' },
      { k: 'f', v: '(a±b)² = a² ± 2ab + b² · a² − b² = (a−b)(a+b) · (a±b)³ = a³ ± 3a²b + 3ab² ± b³ · a³ ± b³ = (a±b)(a² ∓ ab + b²)' },
      { k: 'ul', v: [
        'Dấu của 2ab luôn cùng dấu với phép cộng/trừ bên trong',
        'a³ + b³ = (a+b)(a² − ab + b²) — dấu giữa ngược với dấu ngoài',
        'Áp dụng ngược để phân tích thành nhân tử, ví dụ x² − 9 = (x−3)(x+3)',
      ] },
      { k: 'note', v: 'Lỗi phổ biến: viết (a+b)² = a² + b². Thiếu 2ab là sai hoàn toàn. Kiểm tra bằng số: (2+3)² = 25, còn 2²+3² = 13.' },
      { k: 'q', v: 'Tính nhanh 101² mà không dùng máy tính.', a: '101² = (100+1)² = 10000 + 200 + 1 = 10201.' },
    ]),

  _M(9, 'toan', 'Phương trình bậc hai và định lí Vi-ét', 'Đại số · chương 4',
    'Giải phương trình bậc hai và dùng Vi-ét mà không cần giải.',
    [
      { k: 'p', v: 'Phương trình ax² + bx + c = 0 (a ≠ 0). Biệt thức Δ cho biết số nghiệm trước khi giải, và Vi-ét cho quan hệ giữa hai nghiệm mà không cần tìm chúng.' },
      { k: 'f', v: 'Δ = b² − 4ac · x = (−b ± √Δ) / 2a · x₁ + x₂ = −b/a · x₁·x₂ = c/a' },
      { k: 'ul', v: [
        'Δ > 0: hai nghiệm phân biệt · Δ = 0: nghiệm kép · Δ < 0: vô nghiệm thực',
        'Vi-ét dùng để tính nhanh biểu thức đối xứng: x₁² + x₂² = (x₁+x₂)² − 2x₁x₂',
        'Nhẩm nghiệm khi a+b+c = 0 → x₁ = 1, x₂ = c/a',
      ] },
      { k: 'note', v: 'Khi đề cho "phương trình có hai nghiệm", phải nói rõ điều kiện Δ ≥ 0 trước khi dùng Vi-ét. Bỏ bước này là mất điểm trình bày dù kết quả đúng.' },
      { k: 'q', v: 'Cho x² − 5x + 6 = 0. Tính x₁² + x₂² mà không giải phương trình.', a: 'x₁+x₂ = 5, x₁x₂ = 6 → x₁²+x₂² = 25 − 12 = 13.' },
    ]),

  _M(10, 'toan', 'Bất đẳng thức và giá trị nhỏ nhất', 'Đại số · bất đẳng thức',
    'Dùng bất đẳng thức Cauchy để tìm cực trị có điều kiện.',
    [
      { k: 'p', v: 'Bất đẳng thức Cauchy (AM–GM) là công cụ chính để tìm giá trị nhỏ nhất, lớn nhất. Điều kiện dùng: các số không âm. Quên điều kiện này là sai bản chất.' },
      { k: 'f', v: 'a + b ≥ 2√(ab) với a, b ≥ 0 · Dấu bằng khi a = b' },
      { k: 'ul', v: [
        'Mở rộng ba số: a + b + c ≥ 3·³√(abc)',
        'Dạng hay dùng: x + 1/x ≥ 2 với x > 0',
        'Dấu bằng xảy ra khi nào là phần phải ghi — không có nó thì chưa kết luận được cực trị',
      ] },
      { k: 'note', v: 'Câu hỏi "giá trị nhỏ nhất là bao nhiêu" cần hai phần: giá trị đó và điểm đạt được. Thiếu điểm đạt được thì chưa chứng minh xong.' },
      { k: 'q', v: 'Tìm GTNN của A = x + 4/x với x > 0.', a: 'A ≥ 2√(x·4/x) = 4, dấu bằng khi x = 4/x → x = 2. Vậy min A = 4 tại x = 2.' },
    ]),

  _M(11, 'toan', 'Lượng giác: công thức cộng và phương trình cơ bản', 'Đại số · lượng giác',
    'Áp dụng công thức cộng và giải phương trình lượng giác cơ bản.',
    [
      { k: 'p', v: 'Công thức cộng là gốc của gần như mọi công thức lượng giác khác — nhân đôi, hạ bậc, biến đổi tích thành tổng đều suy ra từ nó.' },
      { k: 'f', v: 'sin(a±b) = sin a cos b ± cos a sin b · cos(a±b) = cos a cos b ∓ sin a sin b' },
      { k: 'ul', v: [
        'sin x = m có nghiệm khi |m| ≤ 1: x = α + k2π hoặc x = π − α + k2π',
        'cos x = m: x = ±α + k2π',
        'tan x = m: x = α + kπ — chỉ một họ nghiệm',
      ] },
      { k: 'note', v: 'Phải ghi k ∈ ℤ. Bỏ k là bỏ mất vô số nghiệm, và đó là lỗi bị trừ điểm trình bày nặng nhất ở dạng này.' },
      { k: 'q', v: 'Giải sin x = 1/2.', a: 'x = π/6 + k2π hoặc x = 5π/6 + k2π, k ∈ ℤ.' },
    ]),

  _M(12, 'toan', 'Đạo hàm và khảo sát hàm số', 'Giải tích · chương 1',
    'Tính đạo hàm và dùng dấu đạo hàm để tìm khoảng đơn điệu, cực trị.',
    [
      { k: 'p', v: 'Đạo hàm đo tốc độ thay đổi. Dấu của đạo hàm cho biết hàm tăng hay giảm, nên khảo sát hàm số bắt đầu bằng việc tính và xét dấu đạo hàm.' },
      { k: 'f', v: '(xⁿ)\' = n·xⁿ⁻¹ · (u/v)\' = (u\'v − uv\')/v² · (uv)\' = u\'v + uv\'' },
      { k: 'ul', v: [
        'y\' > 0 trên khoảng nào thì hàm đồng biến trên khoảng đó',
        'y\' đổi dấu từ + sang − tại x₀ → cực đại tại x₀',
        'Không xét dấu được đạo hàm thì chưa kết luận được gì',
      ] },
      { k: 'note', v: 'y\' = 0 chưa đủ để kết luận cực trị. Phải xét dấu hai bên. Ví dụ y = x³ có y\' = 0 tại x = 0 nhưng không có cực trị ở đó.' },
      { k: 'q', v: 'Tìm khoảng đồng biến của y = x³ − 3x.', a: 'y\' = 3x² − 3 = 3(x−1)(x+1). y\' > 0 khi x < −1 hoặc x > 1. Đồng biến trên (−∞;−1) và (1;+∞).' },
    ]),

  /* ============================================================
     NGỮ VĂN — nghị luận, đọc hiểu
     ============================================================ */
  _M(9, 'van', 'Nghị luận xã hội: cách dựng một bài 200 chữ', 'Làm văn · nghị luận',
    'Viết đủ cấu trúc bốn phần trong giới hạn 200 chữ.',
    [
      { k: 'p', v: 'Bài nghị luận xã hội 200 chữ không cần hay, cần đúng cấu trúc và đủ ý. Giám khảo chấm theo các mốc: mở đoạn nêu vấn đề, thân đoạn giải thích — chứng minh — bàn bạc, kết đoạn nêu bài học.' },
      { k: 'ul', v: [
        'Mở đoạn (1–2 câu): dẫn vào vấn đề và nói rõ vấn đề là gì',
        'Giải thích (2–3 câu): cắt nghĩa từ khoá, nêu biểu hiện',
        'Chứng minh (3–4 câu): một ví dụ thật, cụ thể — không cần nhiều',
        'Bàn bạc + bài học (3–4 câu): phản đề và liên hệ bản thân',
      ] },
      { k: 'note', v: 'Đừng kể lại câu chuyện dẫn dắt quá dài. Hai câu là đủ; dài hơn sẽ ăn hết số chữ của phần thân, và bài sẽ mất điểm vì thiếu ý.' },
      { k: 'q', v: 'Viết mở đoạn cho đề: "Sự tự tin là chìa khoá của thành công."', a: 'Gợi ý: khẳng định tự tin giúp con người dám bắt đầu và dám đứng dậy; nhưng tự tin phải đi cùng hiểu biết mới có giá trị.' },
    ]),

  _M(10, 'van', 'Đọc hiểu văn bản: các dạng câu hỏi thường gặp', 'Đọc hiểu · kỹ năng',
    'Trả lời đúng bốn dạng câu hỏi đọc hiểu theo thang điểm.',
    [
      { k: 'p', v: 'Đọc hiểu chiếm phần điểm dễ lấy nhất trong đề. Mỗi dạng câu có cách trả lời riêng; trả lời lẫn dạng thì đúng ý vẫn mất điểm.' },
      { k: 'ul', v: [
        'Nhận biết: tìm phương thức biểu đạt, thể thơ, từ ngữ — trả lời ngắn, đúng, không giải thích',
        'Thông hiểu: "vì sao tác giả viết..." — phải dựa vào chính văn bản, trích dẫn được',
        'Vận dụng: nêu cảm nhận — cần một câu khẳng định rồi một câu lý giải',
        'Vận dụng cao: liên hệ bản thân — nói thật, tránh sáo ngữ',
      ] },
      { k: 'note', v: 'Câu "theo em" cho phép ý kiến riêng, nhưng ý kiến đó vẫn phải được chống đỡ bằng chi tiết trong văn bản. Nêu cảm xúc mà không chỉ ra chi tiết nào gây nên là câu trả lời rỗng.' },
      { k: 'q', v: 'Đề hỏi "Nêu tác dụng của biện pháp tu từ trong câu thơ..." — cần trả lời mấy phần?', a: 'Ba phần: gọi tên biện pháp, chỉ ra hình ảnh cụ thể, nêu hiệu quả với nội dung hoặc cảm xúc.' },
    ]),

  _M(12, 'van', 'Nghị luận văn học: phân tích một đoạn thơ', 'Làm văn · nghị luận văn học',
    'Dựng được một đoạn phân tích có luận điểm, dẫn chứng và bình luận.',
    [
      { k: 'p', v: 'Phân tích thơ không phải kể lại nội dung. Việc của người viết là chỉ ra cách tác giả dùng chữ, hình ảnh, nhịp điệu để tạo ra ý nghĩa — và cái gì chỉ riêng cách viết đó mới làm được.' },
      { k: 'ul', v: [
        'Mỗi đoạn một luận điểm, mở bằng câu khái quát có ý kiến',
        'Dẫn chứng phải nguyên văn, ngắn, đúng chỗ',
        'Sau dẫn chứng là bình: chữ đó gợi gì, đặt trong cả bài thì có nghĩa gì',
        'Kết đoạn nâng lên ý lớn hơn, đừng lặp lại câu mở',
      ] },
      { k: 'note', v: 'Tránh viết "tác giả đã rất tài tình". Đó là lời khen, không phải phân tích. Phải nói tài tình ở chỗ nào: dùng từ nào, đặt nó ở vị trí nào trong câu, và vì sao chỗ đó gây được cảm giác ấy.' },
      { k: 'q', v: 'Viết một câu luận điểm cho câu thơ "Sương trắng rỏ đầu cành như giọt sữa".', a: 'Gợi ý: cách so sánh sương với "giọt sữa" biến buổi sớm thành một vật thể đang chảy, khiến thời gian như nhìn thấy được.' },
    ]),
];
