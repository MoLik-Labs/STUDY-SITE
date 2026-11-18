// Dữ liệu 8 môn năm 2. Nguồn và trạng thái kiểm tra xem docs/COURSE-RESOURCES.md.
// verified: true  = đã mở trang và xác nhận nội dung (ngày 2026-11-16)
// verified: false = chỉ thấy trong kết quả tìm kiếm; cần mở trước khi học
// Không thêm nguồn nếu chưa có URL xác nhận, và không đưa vào trang tải lậu.

export const COURSES = Object.freeze([
  {
    slug: 'tieng-anh-chuyen-nganh-doc',
    name: 'Tiếng Anh chuyên ngành — đọc',
    summary: 'Đọc văn bản kinh tế và kế toán bằng tiếng Anh, học từ vựng theo ngữ cảnh.',
    color: 'green',
    resources: [
      { id: 'bpp-english', kind: 'Khoá tự học', title: 'Free English language course (BPP, cho sinh viên tài chính – kế toán)', url: 'https://bpp.pl/en/free-english-courses/', cost: 'Miễn phí', note: 'Hơn 60 mô-đun, khoảng 60 giờ. Thiết kế cho ACCA nhưng dùng được cho sinh viên kinh tế.', verified: false },
      { id: 'linguahouse-accounting', kind: 'Bài đọc và bài tập', title: 'Accounting — ESL lesson plans (Linguahouse)', url: 'https://www.linguahouse.com/esl-lesson-plans/topic/accounting', cost: 'Miễn phí', note: 'Bài về báo cáo tài chính và nợ xấu, trình độ B1–B2.', verified: false },
      { id: 'openlearn-inequality', kind: 'Bài đọc kinh tế', title: 'Understanding economic inequality (OpenLearn, Open University)', url: 'https://www.open.edu/openlearn/society-politics-law/understanding-economic-inequality/content-section-0?intro=1', cost: 'Miễn phí', note: 'Khoảng 6 giờ. Từ vựng kinh tế thật, mức nhập môn.', verified: false },
    ],
  },
  {
    slug: 'tieng-anh-chuyen-nganh-nghe',
    name: 'Tiếng Anh chuyên ngành — nghe',
    summary: 'Nghe hội thoại và bài nói về kinh tế, kinh doanh với tốc độ tự nhiên.',
    color: 'blue',
    resources: [
      { id: 'bbc-6-minute', kind: 'Podcast', title: 'BBC Learning English — 6 Minute English', url: 'https://bbclearningenglish.org/programme/6-minute-english', cost: 'Miễn phí', note: '6–7 phút mỗi tập, có bản ghi và phiếu bài tập. Có chủ đề về tiết kiệm, nợ, giá vàng.', verified: false },
      { id: 'openlearn-everyday', kind: 'Nghe và nói', title: 'Everyday English 1 (OpenLearn, phần nghe và nói)', url: 'https://www.open.edu/openlearn/languages/everyday-english-1/', cost: 'Miễn phí', note: 'Khoảng 48 giờ. Luyện nghe hiểu, nhịp và phát âm.', verified: false },
    ],
  },
  {
    slug: 'tieng-trung-doc-viet',
    name: 'Tiếng Trung — đọc và viết',
    summary: 'Đọc bài có phiên âm theo HSK, học ngữ pháp có ví dụ, luyện viết chữ Hán.',
    color: 'rust',
    resources: [
      { id: 'mandarin-bean', kind: 'Đọc', title: 'Mandarin Bean — bài đọc phân cấp HSK 1–6+', url: 'https://mandarinbean.com/', cost: 'Miễn phí', note: 'Mọi bài đọc đều miễn phí, có âm thanh, pinyin và bản dịch. Có bài tập ngữ pháp và đề HSK mẫu.', verified: true },
      { id: 'cgw', kind: 'Ngữ pháp', title: 'Chinese Grammar Wiki', url: 'https://resources.allsetlearning.com/chinese/grammar/Main_Page', cost: 'Miễn phí', note: 'Hơn 2.100 bài, sắp theo A1–C1 và HSK 1–3. Ví dụ có pinyin và bản dịch.', verified: true },
      { id: 'olc-chinese-1', kind: 'Nhập môn', title: 'Getting started with Chinese 1 (OpenLearn, Open University)', url: 'https://www.open.edu/openlearn/languages/getting-started-chinese-1', cost: 'Miễn phí', note: 'Phát âm, pinyin, chào hỏi, đếm số. Dành cho người mới.', verified: true },
    ],
  },
  {
    slug: 'tieng-trung-noi',
    name: 'Tiếng Trung — nói',
    summary: 'Luyện nói theo hội thoại thật, bắt đầu từ mẫu câu và phát âm chuẩn.',
    color: 'ochre',
    resources: [
      { id: 'olc-chinese-1-speak', kind: 'Nhập môn', title: 'Getting started with Chinese 1 (OpenLearn)', url: 'https://www.open.edu/openlearn/languages/getting-started-chinese-1', cost: 'Miễn phí', note: 'Bắt đầu từ phát âm và các mẫu câu chào hỏi cơ bản.', verified: true },
      { id: 'chinesepod-business', kind: 'Hội thoại', title: 'ChinesePod — "How\'s business?" (bài kinh doanh, trung cấp)', url: 'https://chinesepod.com/lessons/hows-business', cost: 'Gói miễn phí có quảng cáo', note: 'Hội thoại tự nhiên có bản ghi và từ vựng. Gói miễn phí giới hạn tài liệu phụ.', verified: false },
    ],
  },
  {
    slug: 'tieng-trung-nghe',
    name: 'Tiếng Trung — nghe',
    summary: 'Nghe phỏng vấn, hội thoại và bài podcast có phụ đề, phân biệt thanh điệu.',
    color: 'plum',
    resources: [
      { id: 'mandarin-corner', kind: 'Video', title: 'Mandarin Corner (YouTube, kênh của Eileen Xu)', url: 'https://www.youtube.com/channel/UC2fAiRQHRQT9aj9P_ijYeow', cost: 'Miễn phí', note: 'Phụ đề Trung–Anh và pinyin. URL kênh lấy từ một bài năm 2020, cần kiểm tra lại.', verified: false },
      { id: 'hacking-chinese-listening', kind: 'Tổng hợp', title: 'The 10 best free Chinese listening resources (Hacking Chinese)', url: 'https://www.hackingchinese.com/the-10-best-free-chinese-listening-resources-for-beginner-intermediate-and-advanced-learners/', cost: 'Miễn phí', note: 'Gợi ý khoá luyện phân biệt thanh điệu và nguồn nghe theo trình độ.', verified: false },
    ],
  },
  {
    slug: 'kinh-te-luong',
    name: 'Kinh tế lượng',
    summary: 'Hồi quy, kiểm định giả thuyết và dữ liệu thật từ giáo trình của Bruce Hansen.',
    color: 'slate',
    resources: [
      { id: 'hansen-data', kind: 'Dữ liệu và chương trình', title: 'Bruce E. Hansen — Econometrics: dữ liệu bài tập và mã tính toán', url: 'https://www.ssc.wisc.edu/~bhansen/econometrics/', cost: 'Miễn phí', note: 'Bộ dữ liệu và toàn bộ mã của sách. Trang hiện trỏ tới bản Princeton 2022 có phí. Chỉ dùng phần miễn phí.', verified: true },
      { id: 'mit-14-382', kind: 'Bài giảng', title: 'MIT OCW 14.382 Econometrics (Spring 2017)', url: 'https://ocw.mit.edu/courses/14-382-econometrics-spring-2017/download/', cost: 'Miễn phí', note: 'Ghi chú bài giảng, bài tập và ghi chú giải bài. Trình độ sau đại học, nhiều toán.', verified: false },
      { id: 'mit-14-387', kind: 'Bài giảng', title: 'MIT OCW 14.387 Applied Econometrics: Mostly Harmless Big Data', url: 'https://ocw.mit.edu/courses/14-387-applied-econometrics-mostly-harmless-big-data-fall-2014/download/', cost: 'Miễn phí', note: 'Hồi quy, biến công cụ và ghép cặp, có ví dụ dữ liệu thật.', verified: false },
    ],
  },
  {
    slug: 'nguyen-li-ke-toan',
    name: 'Nguyên lí kế toán',
    summary: 'Ghi nhận giao dịch, bút toán điều chỉnh, báo cáo tài chính. Đọc cùng giáo trình mở.',
    color: 'green',
    resources: [
      { id: 'openstax-acc-1', kind: 'Giáo trình', title: 'OpenStax — Principles of Accounting, Vol. 1: Financial Accounting', url: 'https://openstax.org/details/books/principles-financial-accounting', cost: 'Miễn phí (đọc online và PDF)', note: 'Giấy phép CC BY-NC-SA 4.0. Ghi nguồn OpenStax khi trích dẫn.', verified: true },
    ],
  },
  {
    slug: 'quan-he-kinh-te-quoc-te',
    name: 'Quan hệ kinh tế quốc tế',
    summary: 'Thương mại, lợi thế so sánh, chính sách thương mại và các quy tắc của WTO.',
    color: 'blue',
    resources: [
      { id: 'mit-14-581', kind: 'Bài giảng', title: 'MIT OCW 14.581 International Economics I (Costinot & Donaldson)', url: 'https://ocw.mit.edu/courses/14-581-international-economics-i-spring-2013/', cost: 'Miễn phí', note: '26 buổi với ghi chú và slide. Nên bắt đầu từ các buổi đầu về lợi thế so sánh.', verified: true },
      { id: 'wto-elearning', kind: 'Khoá học', title: 'WTO e-Learning — Introduction to the WTO', url: 'https://www.learning.wto.org/', cost: 'Miễn phí, cần đăng ký', note: 'Khoá "WTO in 10\'" và khoá nhập môn WTO. Có chứng nhận.', verified: true },
      { id: 'openstax-econ-2e', kind: 'Giáo trình', title: 'OpenStax — Principles of Economics 2e (chương 23: Thương mại và dòng vốn quốc tế)', url: 'https://d3bxy9euw4e147.cloudfront.net/oscms-prodcms/media/documents/Economics2e-LR.pdf', cost: 'Miễn phí, CC BY 4.0', note: 'Chương nền về thương mại quốc tế. Đây là file PDF, chưa mở trang kiểm tra.', verified: false },
    ],
  },
]);

export const COURSE_BY_SLUG = Object.freeze(Object.fromEntries(COURSES.map(c => [c.slug, c])));
