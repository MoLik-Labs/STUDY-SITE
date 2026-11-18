/* =========================================================
   TRƯỜNG HỌC — lớp 1 → 12, mọi môn, tự tạo bài học, kho tệp
   Chạy offline. Code in English, UI in Vietnamese.
   ========================================================= */

/* ---------------- 1 · danh mục môn ---------------- */
const GRADE_NOTE = {
  1: 'Lớp 1 · nền nếp & chữ cái', 2: 'Lớp 2 · đọc thông viết thạo', 3: 'Lớp 3 · bảng nhân chia',
  4: 'Lớp 4 · phân số', 5: 'Lớp 5 · ôn thi vào 6', 6: 'Lớp 6 · chuyển cấp', 7: 'Lớp 7 · làm quen KHTN',
  8: 'Lớp 8 · tăng tốc', 9: 'Lớp 9 · thi vào 10 & HSG', 10: 'Lớp 10 · định hướng', 11: 'Lớp 11 · chuyên sâu',
  12: 'Lớp 12 · thi tốt nghiệp'
};
const subjectAt = (grade, id) => {
  const s = SUBJECTS.find(x => x.id === id);
  if (!s) return null;
  const ok = s.stages.some(([a, b]) => grade >= a && grade <= b);
  return ok ? s : null;
};
const subjectsFor = g => SUBJECTS.filter(s => s.stages.some(([a, b]) => g >= a && g <= b));

/* ---------------- 2 · bài học mẫu ---------------- */
const SEED = [
  {
    g: 9, s: 'toan', t: 'Hàm số bậc nhất y = ax + b', tag: 'Đại số · chương 2',
    aim: 'Nhận ra dạng, vẽ đồ thị bằng hai điểm, xét tính đồng biến và vị trí tương đối của hai đường thẳng.',
    blocks: [
      { k: 'p', v: 'Hàm số bậc nhất có dạng y = ax + b với a ≠ 0. Đồ thị là một đường thẳng cắt trục tung tại (0; b).' },
      { k: 'f', v: 'y = ax + b  (a ≠ 0)' },
      { k: 'ul', v: ['a > 0: hàm đồng biến trên ℝ', 'a < 0: hàm nghịch biến trên ℝ', 'a = 0: y = b là đường song song trục hoành, không phải hàm bậc nhất'] },
      { k: 'p', v: 'Cách vẽ nhanh: lấy A(0; b) và B(−b/a; 0) rồi nối. Hai đường y = ax + b và y = a′x + b′ song song khi a = a′ và b ≠ b′; cắt nhau khi a ≠ a′; vuông góc khi a·a′ = −1.' },
      { k: 'note', v: 'Lỗi hay gặp: quên điều kiện a ≠ 0 nên gọi y = 5 là hàm bậc nhất.' },
      { k: 'q', v: 'Cho y = (m − 2)x + 3. Với m bằng bao nhiêu thì hàm nghịch biến?', a: 'm < 2' }
    ]
  },
  {
    g: 9, s: 'van', t: 'Nghị luận xã hội: một hiện tượng đời sống', tag: 'Làm văn · 200 chữ',
    aim: 'Dựng được bố cục 5 phần, viết đoạn mở – thân – kết chắc ý, không lan man.',
    blocks: [
      { k: 'p', v: 'Đề dạng “trình bày suy nghĩ về hiện tượng…” không cần kể chuyện. Đi thẳng vào vấn đề, mỗi đoạn một ý.' },
      { k: 'ul', v: ['Mở: nêu hiện tượng + thái độ (đồng tình / phê phán)', 'Thân 1: giải thích ngắn hiện tượng là gì', 'Thân 2: nguyên nhân, biểu hiện, hệ quả', 'Thân 3: giải pháp và bài học cho bản thân', 'Kết: khẳng định lại, mở ra suy nghĩ'] },
      { k: 'note', v: 'Đoạn văn 200 chữ chỉ nên có 1 dẫn chứng thật tiêu biểu, đừng kể ba bốn câu chuyện.' },
      { k: 'q', v: 'Một đoạn nghị luận 200 chữ nên dành bao nhiêu cho phần giải thích hiện tượng?', a: '1–2 câu, ngắn gọn' }
    ]
  },
  {
    g: 9, s: 'anh', t: 'Thì hiện tại hoàn thành và hiện tại hoàn thành tiếp diễn', tag: 'Grammar · Unit 4',
    aim: 'Phân biệt kết quả (have done) với quá trình kéo dài (have been doing).',
    blocks: [
      { k: 'f', v: 'S + have/has + V3  →  kết quả còn liên quan hiện tại' },
      { k: 'f', v: 'S + have/has been + V-ing  →  nhấn quá trình, thời lượng' },
      { k: 'ul', v: ['I have read that book. (đã đọc xong, biết nội dung)', 'I have been reading that book. (đang đọc dở)', 'for + khoảng thời gian · since + mốc thời gian'] },
      { k: 'q', v: 'Chọn dạng đúng: “She ___ (work) here for five years.”', a: 'has been working' }
    ]
  },
  {
    g: 9, s: 'hoa', t: 'Tính theo phương trình hoá học', tag: 'Chương 4 · mol',
    aim: 'Đổi khối lượng ⇄ mol ⇄ thể tích khí, dùng tỉ lệ hệ số để tính chất còn lại.',
    blocks: [
      { k: 'f', v: 'n = m / M        V(khí, đktc) = n · 22,4' },
      { k: 'ul', v: ['Bước 1: viết và cân bằng phương trình', 'Bước 2: đổi dữ kiện ra mol', 'Bước 3: lập tỉ lệ theo hệ số', 'Bước 4: đổi kết quả ra đơn vị đề hỏi'] },
      { k: 'p', v: 'Ví dụ: đốt 4,8 g Mg. n(Mg) = 0,2 mol; 2Mg + O₂ → 2MgO nên n(O₂) = 0,1 mol ⇒ V = 2,24 lít.' },
      { k: 'note', v: 'Chất dư phải so tỉ lệ n/hệ số cho từng chất trước khi tính theo chất phản ứng hết.' },
      { k: 'q', v: 'Đốt 6,5 g Zn (M=65) trong O₂ dư. Tính khối lượng ZnO (M=81).',
        a: 'n(Zn) = 0,1 mol; 2Zn + O₂ → 2ZnO nên n(ZnO) = 0,1 mol; m = 8,1 g.' }
    ]
  },
  {
    g: 9, s: 'sinh', t: 'Di truyền Menđen: quy luật phân li', tag: 'Chương 2 · lai một cặp tính trạng',
    aim: 'Viết sơ đồ lai, xác định kiểu gen – kiểu hình ở F1, F2.',
    blocks: [
      { k: 'p', v: 'Mỗi tính trạng do một cặp alen quy định; alen trội lấn át alen lặn. Cơ thể đồng hợp tử AA, aa; dị hợp tử Aa.' },
      { k: 'f', v: 'Aa × Aa → 1 AA : 2 Aa : 1 aa  ⇒  3 trội : 1 lặn' },
      { k: 'ul', v: ['Lai phân tích: Aa × aa → 1 : 1', 'Trội hoàn toàn mới cho tỉ lệ 3 : 1', 'Trội không hoàn toàn cho tỉ lệ 1 : 2 : 1 về kiểu hình'] },
      { k: 'q', v: 'Aa × aa cho tỉ lệ kiểu hình nào?', a: '1 trội : 1 lặn' }
    ]
  },
  {
    g: 9, s: 'sudia', t: 'Việt Nam 1945–1954: từ Tổng khởi nghĩa đến Điện Biên Phủ', tag: 'Lịch sử Việt Nam hiện đại',
    aim: 'Nắm trục thời gian và nguyên nhân thắng lợi của hai cuộc kháng chiến mở đầu.',
    blocks: [
      { k: 'ul', v: ['19/8/1945: Tổng khởi nghĩa ở Hà Nội; 2/9/1945: Tuyên ngôn Độc lập', '19/12/1946: Toàn quốc kháng chiến', 'Thu – đông 1947: chiến thắng Việt Bắc', '1950: chiến dịch Biên giới', '7/5/1954: Điện Biên Phủ'] },
      { k: 'p', v: 'Đường lối kháng chiến toàn dân, toàn diện, trường kì, tự lực cánh sinh là sợi chỉ đỏ xuyên suốt.' },
      { k: 'note', v: 'Khi làm bài, luôn gắn sự kiện với nguyên nhân và ý nghĩa, đừng chỉ liệt kê ngày tháng.' },
      { k: 'q', v: 'Vì sao chiến thắng Điện Biên Phủ năm 1954 được coi là mốc kết thúc cuộc kháng chiến chống Pháp?',
        a: 'Vì nó đánh sập ý chí tiếp tục chiến tranh của Pháp, buộc Pháp ký Hiệp định Giơ-ne-vơ (7/1954) công nhận độc lập, chủ quyền của Việt Nam.' }
    ]
  },
  {
    g: 9, s: 'sudia', t: 'Địa lí dân cư Việt Nam', tag: 'Dân số · lao động',
    aim: 'Đọc được tháp dân số, giải thích hậu quả gia tăng dân số nhanh.',
    blocks: [
      { k: 'ul', v: ['Dân số ≈ 100 triệu (2023), đứng thứ 15 thế giới', 'Cơ cấu “dân số vàng”: hơn 60% trong độ tuổi lao động', 'Phân bố không đều: đồng bằng ven biển dày, miền núi thưa'] },
      { k: 'p', v: 'Tháp dân số trẻ có đáy rộng, đỉnh nhọn; tháp già có đáy hẹp, đỉnh mở rộng. Việt Nam đang chuyển dần sang tháp già.' },
      { k: 'q', v: 'Hậu quả chính của gia tăng dân số quá nhanh?', a: 'Sức ép lên việc làm, giáo dục, y tế và tài nguyên' }
    ]
  },
  {
    g: 9, s: 'gdcd', t: 'Quyền và nghĩa vụ của công dân trong hôn nhân', tag: 'GDCD 9 · bài 12',
    aim: 'Nhớ độ tuổi kết hôn, các nguyên tắc cơ bản và hành vi bị cấm.',
    blocks: [
      { k: 'ul', v: ['Nam từ 20 tuổi, nữ từ 18 tuổi trở lên', 'Hôn nhân tự nguyện, tiến bộ, một vợ một chồng', 'Cấm kết hôn giả, cưỡng ép, tảo hôn'] },
      { k: 'note', v: 'Câu hỏi tình huống thường hỏi: kết hôn khi chưa đủ tuổi bị xử lí thế nào — trả lời theo hướng vi phạm pháp luật, hôn nhân không được pháp luật công nhận.' },
      { k: 'q', v: 'Nêu hai điều kiện bắt buộc để một cuộc hôn nhân hợp pháp.',
        a: 'Đủ tuổi kết hôn (nam 20, nữ 18) và tự nguyện; đồng thời không thuộc các trường hợp bị cấm như đang có vợ hoặc chồng, cùng dòng máu trực hệ.' }
    ]
  },
  {
    g: 9, s: 'tin', t: 'Thuật toán tìm kiếm nhị phân', tag: 'Tin 9 · chủ đề F',
    aim: 'Hiểu điều kiện áp dụng, số bước tối đa và cách viết mã giả.',
    blocks: [
      { k: 'p', v: 'Chỉ dùng được khi dãy đã sắp xếp. Mỗi bước loại một nửa dãy nên chỉ mất khoảng log₂n bước.' },
      { k: 'ul', v: ['left = 0, right = n − 1', 'mid = (left + right) // 2', 'Nếu a[mid] = x: tìm thấy', 'Nếu a[mid] < x: left = mid + 1, ngược lại right = mid − 1'] },
      { k: 'q', v: 'Dãy 1 000 000 phần tử đã sắp xếp, tìm nhị phân cần tối đa bao nhiêu bước?', a: 'khoảng 20 bước' }
    ]
  },
  {
    g: 9, s: 'congnghe', t: 'Mạch điện trong gia đình: an toàn và tiết kiệm', tag: 'Công nghệ 9 · định hướng nghề',
    aim: 'Đọc được sơ đồ nguyên lí đơn giản, chọn dây và thiết bị bảo vệ phù hợp.',
    blocks: [
      { k: 'ul', v: ['Aptomat thay cầu chì: tự ngắt khi quá tải, bật lại được', 'Dây tiếp địa nối vỏ kim loại để tránh giật', 'Ổ cắm có chốt an toàn cho trẻ nhỏ'] },
      { k: 'p', v: 'Công suất lớn (bếp từ, điều hoà) nên đi dây riêng, không dùng chung ổ với đèn.' },
      { k: 'note', v: 'Khi tính dây, dùng P = U·I với U = 220 V để suy ra dòng định mức.' },
      { k: 'q', v: 'Vì sao dây nối đất lại quan trọng với các thiết bị vỏ kim loại?',
        a: 'Nếu vỏ bị rò điện, dòng sẽ theo dây nối đất xuống đất thay vì qua người dùng; đồng thời aptomat ngắt mạch.' }
    ]
  },
  {
    g: 1, s: 'toan', t: 'Cộng trong phạm vi 10', tag: 'Toán 1 · số và phép tính',
    aim: 'Biết gộp hai nhóm đồ vật và viết phép cộng tương ứng.',
    blocks: [
      { k: 'p', v: 'Có 3 quả cam, thêm 2 quả cam nữa. Gộp lại được 5 quả cam: 3 + 2 = 5.' },
      { k: 'ul', v: ['Đếm lần lượt từ nhóm lớn hơn: 3, 4, 5', 'Dùng ngón tay để kiểm tra', 'Đổi chỗ hai số, kết quả không đổi: 2 + 3 = 3 + 2'] },
      { k: 'q', v: '4 + 3 bằng mấy?', a: '7' }
    ]
  },
  {
    g: 5, s: 'van', t: 'Tả cảnh: lập dàn ý và chọn chi tiết', tag: 'Tập làm văn 5',
    aim: 'Biết chọn 5–7 chi tiết đắt thay vì liệt kê cảnh vật.',
    blocks: [
      { k: 'ul', v: ['Mở: giới thiệu cảnh và thời điểm', 'Thân: tả theo trình tự không gian hoặc thời gian', 'Kết: cảm xúc của em'] },
      { k: 'p', v: 'Chi tiết đắt là chi tiết có âm thanh, mùi, chuyển động — “nắng rắc vàng trên mái ngói” tốt hơn “trời có nắng”.' },
      { k: 'q', v: 'Viết lại “Cây bàng rất đẹp” thành một câu có chi tiết nghe được hoặc nhìn thấy được.',
        a: 'Ví dụ: “Nắng xuyên qua tán bàng, rơi xuống sân thành những đốm sáng nhảy nhót.” Có hình ảnh cụ thể thay cho lời khen chung.' }
    ]
  },
  {
    g: 12, s: 'vatli', t: 'Dao động điều hoà: các đại lượng đặc trưng', tag: 'Vật lí 12 · chương 1',
    aim: 'Viết phương trình, tính chu kì – tần số, nắm hệ thức độc lập thời gian.',
    blocks: [
      { k: 'f', v: 'x = A·cos(ωt + φ)   ·   ω = 2π/T = 2πf' },
      { k: 'f', v: 'A² = x² + (v/ω)²' },
      { k: 'ul', v: ['Vận tốc sớm pha π/2 so với li độ', 'Gia tốc ngược pha, a = −ω²x', 'Thế năng ↔ động năng biến thiên với chu kì T/2'] },
      { k: 'note', v: 'Ở vị trí cân bằng tốc độ lớn nhất, gia tốc bằng 0; ở biên thì ngược lại.' },
      { k: 'q', v: 'Một vật dao động với A = 5 cm, ω = 2π rad/s. Tính vận tốc cực đại.',
        a: 'v_max = ωA = 2π · 0,05 ≈ 0,314 m/s (nhớ đổi cm sang m).' }
    ]
  },
  {
    g: 12, s: 'van', t: 'Nghị luận văn học: so sánh hai tác phẩm', tag: 'Ngữ văn 12 · kĩ năng',
    aim: 'Dựng được luận điểm so sánh, tránh sa vào kể lại nội dung.',
    blocks: [
      { k: 'ul', v: ['Chọn một tiêu chí so sánh rõ (hình tượng, giọng điệu, không gian)', 'Mỗi đoạn: nêu điểm giống → điểm khác → lí giải vì sao khác', 'Kết mỗi đoạn phải khái quát được phong cách tác giả'] },
      { k: 'note', v: 'Đừng so sánh hai tác phẩm khác đề tài nếu đề không yêu cầu; dễ lạc sang cảm nhận chung chung.' },
      { k: 'q', v: 'Khi so sánh hai tác phẩm, nên chọn tiêu chí nào để bài không lan man?',
        a: 'Chọn một vài tiêu chí cụ thể — cách xây dựng hình tượng, giọng điệu, cách kết thúc — rồi so từng điểm, thay vì kể lần lượt hai tác phẩm.' }
    ]
  }
];

function seedLessons() {
  const out = {};
  /* SEED_MORE and SEED_MORE2 are edited separately from the original SEED so
     subject coverage can grow without touching (or risking) the physics
     lessons. Concatenating here keeps one id scheme and one seeding path. */
  const ALL = SEED
    .concat(typeof SEED_MORE !== 'undefined' ? SEED_MORE : [])
    .concat(typeof SEED_MORE2 !== 'undefined' ? SEED_MORE2 : []);
  ALL.forEach((L, i) => {
    const key = L.g + '|' + L.s;
    out[key] = out[key] || [];
    out[key].push({
      id: 'seed' + i, g: L.g, s: L.s, t: L.t, aim: L.aim, tag: L.tag,
      blocks: L.blocks, at: 0, seed: true
    });
  });
  return out;
}

/* ---------------- 3 · state ---------------- */
/* Một cửa vào duy nhất cho khoá "school". Trước đây chỉ kiểm tra null, nên
   state.school = "x" (từ tệp sao lưu hỏng) đi qua được và làm chết trang
   "Bài của tôi" cùng mọi chỗ dùng Object.keys(S.lessons). Giờ kiểu cũng
   được kiểm tra, và mọi mục con đều được chuẩn hoá ngay tại đây. */
function lessonList(g, s) {
  const S = schoolState();
  const seed = seedLessons()[g + '|' + s] || [];
  const mine = S.lessons[g + '|' + s] || [];
  return seed.concat(mine);
}
function lessonById(id) {
  const S = schoolState();
  for (const k in S.lessons) {
    const list = S.lessons[k];
    const hit = Array.isArray(list) ? list.find(l => l.id === id) : null;
    if (hit) return hit;
  }
  const all = seedLessons();
  for (const k in all) {
    const hit = all[k].find(l => l.id === id);
    if (hit) return hit;
  }
  return null;
}
function allLessons() {
  const S = schoolState();
  const out = [];
  const seeds = seedLessons();
  Object.keys(seeds).forEach(k => seeds[k].forEach(l => out.push(l)));
  /* S.lessons có thể là null/chuỗi nếu dữ liệu bị sửa tay hoặc nhập từ bản
     cũ — Object.keys(null) ném lỗi và làm chết cả thanh ray. */
  const own = S.lessons && typeof S.lessons === 'object' ? S.lessons : {};
  Object.keys(own).forEach(k => { if (Array.isArray(own[k])) own[k].forEach(l => out.push(l)); });
  return out;
}

/* ---------------- 4 · kho tệp (IndexedDB) ---------------- */
const FileStore = (() => {
  let db = null, ready = null;
  const NAME = 'vnl9files', STORE = 'files';
  function open() {
    if (ready) return ready;
    ready = new Promise(res => {
      if (!('indexedDB' in window)) return res(null);
      let req;
      try { req = indexedDB.open(NAME, 1); } catch (e) { return res(null); }
      req.onupgradeneeded = () => {
        const d = req.result;
        if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE, { keyPath: 'id' });
      };
      req.onsuccess = () => { db = req.result; res(db); };
      req.onerror = () => res(null);
    });
    return ready;
  }
  async function put(file) {
    const d = await open();
    const rec = {
      id: 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: file.name, type: file.type || 'application/octet-stream',
      size: file.size, at: Date.now(),
      buf: await file.arrayBuffer()
    };
    if (!d) return { ...rec, buf: null, fail: true };
    await new Promise(res => {
      const tx = d.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(rec);
      tx.oncomplete = res;
      tx.onerror = res;
      tx.onabort = res;
    });
    return rec;
  }
  async function get(id) {
    const d = await open();
    if (!d) return null;
    return new Promise(res => {
      const tx = d.transaction(STORE, 'readonly');
      const rq = tx.objectStore(STORE).get(id);
      rq.onsuccess = () => res(rq.result || null);
      rq.onerror = () => res(null);
    });
  }
  async function all() {
    const d = await open();
    if (!d) return [];
    return new Promise(res => {
      const tx = d.transaction(STORE, 'readonly');
      const rq = tx.objectStore(STORE).getAll();
      rq.onsuccess = () => res(rq.result || []);
      rq.onerror = () => res([]);
    });
  }
  async function del(id) {
    const d = await open();
    if (!d) return;
    return new Promise(res => {
      const tx = d.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = res; tx.onerror = res;
    });
  }
  return { put, get, all, del };
})();

const fileSize = n => n > 1048576 ? (n / 1048576).toFixed(1).replace('.', ',') + ' MB'
  : n > 1024 ? Math.round(n / 1024) + ' KB' : n + ' B';
const fileIcon = t => /^image\//.test(t) ? 'ẢNH' : /pdf/.test(t) ? 'PDF' : /word|officedocument\.word/.test(t) ? 'DOC'
  : /sheet|excel|csv/.test(t) ? 'BẢNG' : /video/.test(t) ? 'VIDEO' : /audio/.test(t) ? 'ÂM' : 'TỆP';

async function filePreview(id) {
  const rec = await FileStore.get(id);
  if (!rec) { toast('Không tìm thấy tệp'); return; }
  const blob = new Blob([rec.buf], { type: rec.type });
  const url = URL.createObjectURL(blob);
  const isImg = /^image\//.test(rec.type), isPdf = /pdf/.test(rec.type);
  const m = document.createElement('div');
  m.className = 'overlay file-ov';
  m.innerHTML = `<div class="ov-panel" style="max-width:min(980px,94vw);height:86vh">
    <div class="file-h"><b>${rec.name}</b><span>${fileSize(rec.size)} · ${rec.type || 'tệp'}</span>
      <a class="btn ghost sm" href="${url}" download="${rec.name}">Tải về</a>
      <button class="bd-x" aria-label="Đóng">×</button></div>
    <div class="file-body">${isImg ? `<img src="${url}" alt="${rec.name}">`
      : isPdf ? `<iframe src="${url}" title="${rec.name}"></iframe>`
        : `<div class="file-none"><p>Tệp này không xem trực tiếp trong trang được.</p>
           <a class="btn" href="${url}" download="${rec.name}">Tải về để mở</a></div>`}</div>
  </div>`;
  document.body.appendChild(m);
  const close = () => { URL.revokeObjectURL(url); m.remove(); };
  m.querySelector('.bd-x').onclick = close;
  m.onclick = e => { if (e.target === m) close(); };
}

/* ---------------- 5 · TRANG: CHỌN LỚP / MÔN ---------------- */
function renderShelf() {
  const S = schoolState();
  const g = S.grade;
  const subs = subjectsFor(g);
  const counts = {};
  subs.forEach(s => { counts[s.id] = lessonList(g, s.id).length; });
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  $('#main').innerHTML = `<section class="wrap wide shelf-page">
    ${pageHead('Khoá học của bạn · lớp 1 đến lớp 12', 'Chọn lớp, chọn môn — mọi thứ nằm trong một chỗ',
    'Vật lí 9 vẫn là khoá đầy đủ nhất (52 ca, 236 bài giảng, phòng thí nghiệm). Các môn khác dùng cùng bộ máy: bài đọc, câu hỏi, sổ tay, nhắc ôn — và bạn tự thêm bài học của mình.')}

    <div class="grade-strip" role="tablist" aria-label="Chọn lớp">
      ${Array.from({ length: 12 }, (_, i) => i + 1).map(n => `
        <button class="gchip${n === g ? ' on' : ''}" data-grade="${n}" role="tab" aria-selected="${n === g}">
          <b>${n}</b><span>${GRADE_NOTE[n].split('·')[1].trim()}</span></button>`).join('')}
    </div>

    ${(() => {
      const lr = (S.soft || {}).lastRead;
      if (!lr) return '';
      const l = lessonById(lr.id); if (!l) return '';
      const sb = SUBJECTS.find(x => x.id === l.s) || { name: l.s };
      return `<a class="resume" href="#/read/${l.id}">
        <span class="kicker">Đọc tiếp</span>
        <b>${l.t}</b>
        <span class="resume-meta">Lớp ${l.g} · ${sb.name}${l.tag ? ' · ' + l.tag : ''}</span>
        <span class="resume-go">Mở lại →</span>
      </a>`;
    })()}

    <div class="shelf-head">
      <div><span class="kicker">Lớp ${g} · ${GRADE_NOTE[g]}</span>
        <h2>${subs.length} môn · ${total} bài học</h2></div>
      <div class="shelf-act">
        <button class="btn ghost sm" id="shelfMine">Bài của tôi</button>
        <button class="btn sm" id="shelfNew">+ Tạo bài học</button>
      </div>
    </div>

    <div class="subj-grid">
      ${subs.map((s, i) => {
        const full = (s.id === 'vatli' && g === 9);
        const n = counts[s.id] || 0;
        return `<a class="subj-card${full ? ' full' : n ? '' : ' empty'}" href="${full ? '#/' : '#/subject/' + g + '/' + s.id}" style="--i:${i}">
          <span class="subj-mono">${s.short}</span>
          <span class="subj-body">
            <b>${s.name}</b>
            <i>${s.note}</i>
            <em>${full ? 'khoá đầy đủ · 52 ca · 54 bộ đề' : n ? n + ' bài' : 'chưa có bài · tự thêm được'}</em>
          </span>
          <span class="subj-go">→</span>
        </a>`;
      }).join('')}
    </div>

    <div class="shelf-foot">
      <div class="shelf-box">
        <span class="kicker">Kho tệp của bạn</span>
        <p>Ảnh, PDF, Word, bảng tính — tải lên rồi gắn vào bài học. Tệp nằm trong máy bạn (IndexedDB), không gửi đi đâu.</p>
        <label class="btn ghost sm file-pick">Tải tệp lên<input type="file" id="shelfFile" multiple hidden></label>
        <div class="file-mini" id="shelfFiles"></div>
      </div>
      <div class="shelf-box">
        <span class="kicker">Đang mở</span>
        <p><b>Vật lí 9</b> — khoá đầy đủ: 52 ca học, 236 bài giảng, 213 câu hỏi, 54 bộ đề, bảng mạch và phòng thí nghiệm.</p>
        <a class="btn sm" href="#/">Vào lộ trình 13 ngày →</a>
      </div>
    </div>
  </section>`;

  $$('[data-grade]').forEach(b => b.onclick = () => {
    S.grade = +b.dataset.grade;
    const list = subjectsFor(S.grade);
    if (!list.some(x => x.id === S.subj)) S.subj = (list[0] || {}).id;
    save(); renderShelf(); renderRail();
  });
  $('#shelfNew').onclick = () => { location.hash = '#/studio'; };
  $('#shelfMine').onclick = () => { location.hash = '#/mine'; };
  const fi = $('#shelfFile');
  if (fi) fi.onchange = async () => { await upFiles(fi.files); fi.value = ''; paintShelfFiles(); };
  paintShelfFiles();
}

const FILE_MAX = 40 * 1024 * 1024;   /* 40 MB mỗi tệp — quá lớn thì trình duyệt dễ từ chối */
async function upFiles(list) {
  if (!list || !list.length) return { ok: 0, fail: 0 };
  let ok = 0, fail = 0, big = 0;
  for (const f of list) {
    if (f.size > FILE_MAX) { big++; fail++; continue; }
    try { const rec = await FileStore.put(f); rec && rec.fail ? fail++ : ok++; } catch (e) { fail++; }
  }
  if (!ok && fail) toast(big ? 'Tệp quá 40 MB — chọn tệp nhỏ hơn' : 'Không lưu được tệp (bộ nhớ trình duyệt đầy?)');
  else if (fail) toast('Đã nhận ' + ok + '/' + list.length + ' tệp · ' + fail + ' tệp lỗi');
  else toast('Đã nhận ' + ok + ' tệp');
  return { ok, fail };
}

async function paintShelfFiles() {
  const host = $('#shelfFiles');
  if (!host) return;
  const all = (await FileStore.all()).slice(-6).reverse();
  host.innerHTML = all.length ? all.map(f => `
    <button class="file-chip" data-f="${f.id}">
      <i>${fileIcon(f.type)}</i><span>${f.name}</span><em>${fileSize(f.size)}</em>
    </button>`).join('') : '<p class="muted" style="font-size:11px">Chưa có tệp nào.</p>';
  $$('#shelfFiles [data-f]').forEach(b => b.onclick = () => filePreview(b.dataset.f));
}

/* ---------------- 6 · TRANG: MÔN HỌC ---------------- */
function renderSubject(g, sid) {
  const sub = subjectAt(g, sid);
  if (!sub) { location.hash = '#/subjects'; return; }
  const S = schoolState();
  S.grade = g; S.subj = sid;
  const list = lessonList(g, sid);
  const mine = new Set((S.lessons[g + '|' + sid] || []).map(l => l.id));

  $('#main').innerHTML = `<section class="wrap wide subj-page">
    ${pageHead('Lớp ' + g + ' · ' + sub.name, sub.note, 'Bài đọc ngắn, có câu hỏi kiểm tra nhanh và chỗ ghi chú riêng. Bài do bạn tạo nằm cùng danh sách, sửa được bất cứ lúc nào.')}
    <div class="subj-bar">
      <a class="btn ghost sm" href="#/subjects">← Đổi lớp / môn</a>
      <span class="dotsep"></span>
      <span class="kicker">${list.length ? list.length + ' bài' : 'chưa có bài tự soạn'}</span>
      <span class="grow"></span>
      <button class="btn ghost sm" id="subjFiles">Kho tệp</button>
      <button class="btn sm" id="subjNew">+ Tạo bài học</button>
    </div>

    ${g === 9 && sid === 'vatli' ? `<div class="phys-hub">
      <div class="ph-head">
        <span class="kicker">Khoá đầy đủ · Vật lí 9 · KHTN 1 · thi Chuyên Lý</span>
        <h3>52 ca học · 236 bài giảng · 213 câu hỏi · 54 bộ đề</h3>
        <p>Lộ trình 13 ngày đã dựng sẵn — kèm máy giải 16 dạng bài, bảng mạch kéo–thả, phòng thí nghiệm và băng thí nghiệm. Bấm một trong các lối vào dưới đây, hoặc tự soạn bài của riêng bạn ngay bên dưới.</p>
      </div>
      <div class="ph-grid">
        <a href="#/"><b>Lộ trình 13 ngày</b><span>52 ca · theo từng giai đoạn</span><em>Bắt đầu ở đây</em></a>
        <a href="#/calc"><b>Máy giải 16 dạng</b><span>nhập số liệu → ra lời giải từng bước</span></a>
        <a href="#/build"><b>Bảng mạch tự dựng</b><span>kéo–thả điện trở, nguồn, ampe kế</span></a>
        <a href="#/lab"><b>Phòng thí nghiệm</b><span>4 bàn đo thật, vẽ đồ thị</span></a>
        <a href="#/sim"><b>Băng thí nghiệm</b><span>khúc xạ · bóng tối · động năng</span></a>
        <a href="#/exam"><b>Thi thử 15 câu</b><span>chấm điểm, lưu câu sai</span></a>
        <a href="#/papers"><b>54 bộ đề chuyên</b><span>PTNK · Hà Nội · Thái Bình…</span></a>
        <a href="#/notes"><b>Sổ tay công thức</b><span>tra nhanh, in được</span></a>
      </div>
    </div>` : ''}

    ${list.length ? `<ol class="lesson-list">
      ${list.map((l, i) => `<li>
        <a href="#/read/${l.id}">
          <span class="ll-n">${String(i + 1).padStart(2, '0')}</span>
          <span class="ll-body">
            <b>${l.t}</b>
            <i>${l.tag || (l.aim || '').slice(0, 70)}</i>
            ${l.blocks && l.blocks.length ? `<em>${l.blocks.length} mục${l.files && l.files.length ? ' · ' + l.files.length + ' tệp' : ''}</em>` : ''}
          </span>
          <span class="ll-flags">${mine.has(l.id) ? '<span class="ll-tag">của tôi</span>' : ''}${(state.note && state.note['read:' + l.id]) ? '<span class="ll-done" title="Đã đọc">✓</span>' : ''}</span>
          <span class="ll-go">→</span>
        </a>
      </li>`).join('')}
    </ol>` : `<div class="shelf-box" style="margin-top:18px">
      <span class="kicker">${(g === 9 && sid === 'vatli') ? 'Chưa có bài tự soạn' : 'Môn này chưa có bài'}</span>
      <p>Bạn có thể tạo bài đầu tiên: dán tài liệu, thêm ảnh tải lên, viết câu hỏi — tất cả lưu trong máy.</p>
      <button class="btn sm" id="subjNew2">+ Tạo bài học ${sub.name} lớp ${g}</button>
    </div>`}`;

  $('#subjNew').onclick = () => { location.hash = '#/studio'; };
  const b2 = $('#subjNew2');
  if (b2) b2.onclick = () => { location.hash = '#/studio'; };
  $('#subjFiles').onclick = () => { location.hash = '#/files'; };
  if (typeof syncScope === 'function') syncScope();
}

/* ---------------- 7 · TRANG: ĐỌC BÀI ---------------- */
function renderRead(id) {
  const l = lessonById(id);
  if (!l) { $('#main').innerHTML = `<section class="wrap"><p>Không tìm thấy bài.</p><a class="btn" href="#/subjects">Về khoá học</a></section>`; return; }
  const sub = SUBJECTS.find(x => x.id === l.s) || { name: l.s };
  const _S = schoolState();
  _S.soft = _S.soft || {};
  _S.soft.lastRead = { id: l.id, t: l.t, g: l.g, s: l.s, at: Date.now() };
  save();
  const sib = lessonList(l.g, l.s);
  const at = sib.findIndex(x => x.id === l.id);
  const prev = at > 0 ? sib[at - 1] : null;
  const next = at >= 0 && at < sib.length - 1 ? sib[at + 1] : null;
  const rel = sib.filter(x => x.id !== l.id).slice(0, 4);

  $('#main').innerHTML = `<section class="wrap read-page">
    <a class="btn ghost sm" href="#/subject/${l.g}/${l.s}">← ${sub.name} lớp ${l.g}</a>
    <article class="read-article">
      <span class="kicker">Lớp ${l.g} · ${sub.name}${l.tag ? ' · ' + l.tag : ''}</span>
      <h1>${l.t}</h1>
      ${l.aim ? `<p class="read-aim">${l.aim}</p>` : ''}
      <div class="read-body">
        ${(l.blocks || []).map(b => renderBlock(b, l)).join('')}
      </div>
      ${(l.files || []).length ? `<div class="read-files"><span class="kicker">Tệp đính kèm</span>
        ${l.files.map(f => `<button class="file-chip" data-f="${f.id}"><i>${fileIcon(f.type)}</i><span>${f.name}</span><em>${fileSize(f.size)}</em></button>`).join('')}</div>` : ''}
      ${typeof syNoteBlock === 'function' ? syNoteBlock(l) : ''}
      ${rel.length ? `<div class="read-rel">
        <span class="kicker">Cùng môn · lớp ${l.g}</span>
        <div class="read-rel-list">${rel.map(r => `<a href="#/read/${r.id}"><span>${r.t}</span><i>${(r.tag || r.aim || '').slice(0, 46)}</i></a>`).join('')}</div>
      </div>` : ''}
      <div class="read-pager">
        ${prev ? `<a class="rp-btn" href="#/read/${prev.id}"><i>← Bài trước</i><b>${prev.t}</b></a>` : '<span></span>'}
        ${next ? `<a class="rp-btn rp-next" href="#/read/${next.id}"><i>Bài sau →</i><b>${next.t}</b></a>` : ''}
      </div>
      <div class="read-foot">
        <button class="btn ghost sm" id="readMark">Đánh dấu đã đọc</button>
        <button class="btn ghost sm" id="readPrint">In bài</button>
        <button class="btn ghost sm" id="syRead">Đọc thành tiếng</button>
        <button class="btn ghost sm" id="syToCards">Thành thẻ ghi nhớ</button>
        ${!l.seed ? `<button class="btn ghost sm" id="readEdit">Sửa bài</button>
        <button class="btn ghost sm" id="readDel">Xoá bài</button>` : ''}
        <span class="grow"></span>
        <a class="btn ghost sm" href="#/studio">+ Bài mới</a>
      </div>
    </article>
  </section>`;

  $$('.read-files [data-f]').forEach(b => b.onclick = () => filePreview(b.dataset.f));
  const pr = $('#readPrint'); if (pr) pr.onclick = () => window.print();
  if (typeof syBindNote === 'function') syBindNote(l);
  const rd = $('#syRead');
  if (rd) rd.onclick = () => {
    if (sySpeechOn) { syStopSpeak(); return; }
    const art = $('.read-article');
    const text = ((l.t || '') + '. ' + (l.aim || '') + '. ' +
      (l.blocks || []).map(b => Array.isArray(b.v) ? b.v.join('. ') : (b.k === 'q' ? 'Câu hỏi: ' + b.v : b.v)).join('. '))
      .replace(/<[^>]+>/g, ' ').slice(0, 4000);
    if (sySpeak(text)) rd.textContent = 'Dừng đọc';
  };
  const tc = $('#syToCards');
  if (tc) tc.onclick = () => {
    const qs = (l.blocks || []).filter(b => b.k === 'q' && b.v);
    if (!qs.length) return toast('Bài này chưa có câu hỏi — thêm khối “Câu hỏi” trong studio');
    let n = 0;
    qs.forEach(b => { if (syAddCard({ front: b.v, back: b.a || '(tự trả lời)', g: l.g, s: l.s, lesson: l.id })) n++; });
    toast('Đã tạo ' + n + ' thẻ từ bài này');
  };
  /* thanh tiến độ đọc */
  if (readProgOff) readProgOff();
  const bar = document.createElement('div');
  bar.className = 'read-prog'; bar.innerHTML = '<i></i>';
  document.body.appendChild(bar);
  const onScroll = () => {
    const art = $('.read-article');
    if (!art) return;
    const r = art.getBoundingClientRect();
    const total = r.height - window.innerHeight * .6;
    const done = Math.min(1, Math.max(0, (-r.top + window.innerHeight * .3) / Math.max(1, total)));
    bar.firstChild.style.width = (done * 100) + '%';
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  setTimeout(onScroll, 60);
  const onKey = e => {
    const t = e.target;
    if (t && /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'ArrowRight' && next) { location.hash = '#/read/' + next.id; }
    else if (e.key === 'ArrowLeft' && prev) { location.hash = '#/read/' + prev.id; }
  };
  document.addEventListener('keydown', onKey);
  readProgOff = () => {
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('scroll', onScroll);
    const b = document.querySelector('.read-prog'); if (b) b.remove();
    readProgOff = null;
  };
  const mk = $('#readMark');
  if (mk) mk.onclick = () => {
    state.note = state.note || {};
    state.note['read:' + l.id] = (state.note['read:' + l.id] || 0) + 1;
    save(); mk.textContent = 'Đã đọc ✓'; mk.disabled = true; toast('Đã ghi vào sổ của bạn');
  };
  const ed = $('#readEdit');
  if (ed) ed.onclick = () => { location.hash = '#/studio/' + l.id; };
  const dl = $('#readDel');
  if (dl) dl.onclick = () => {
    uiConfirm('Xoá bài học', `Xoá <b>${esc(l.t)}</b>? Không hoàn tác được.`, () => {
      const S = schoolState();
      Object.keys(S.lessons).forEach(k => { S.lessons[k] = S.lessons[k].filter(x => x.id !== l.id); });
      if (typeof window !== 'undefined') window.EXPL_INDEX = null;
      save(); toast('Đã xoá bài'); location.hash = '#/subject/' + l.g + '/' + l.s;
    }, { danger: true, okText: 'Xoá bài' });
  };
  if (typeof syncScope === 'function') syncScope();
}

let readProgOff = null;
function renderBlock(b, l) {
  if (!b || !b.v) return '';
  if (b.k === 'p') return `<p>${b.v}</p>`;
  if (b.k === 'f') return `<div class="read-formula">${b.v}</div>`;
  if (b.k === 'note') return `<div class="read-note">${b.v}</div>`;
  if (b.k === 'ul') return `<ul>${(Array.isArray(b.v) ? b.v : [b.v]).map(x => `<li>${x}</li>`).join('')}</ul>`;
  if (b.k === 'img') return `<figure class="read-fig"><button class="file-chip" data-f="${b.v}"><i>ẢNH</i><span>Mở ảnh đính kèm</span></button></figure>`;
  if (b.k === 'q') return `<details class="read-q"><summary>${b.v}</summary><p><b>Trả lời:</b> ${b.a || '—'}</p></details>`;
  return `<p>${b.v}</p>`;
}

/* ---------------- 8 · TRANG: TẠO / SỬA BÀI ---------------- */
function renderStudio(id) {
  const S = schoolState();
  const editing = id ? lessonById(id) : null;
  if (editing && !editing.seed) { S.grade = editing.g; S.subj = editing.s; }
  const draft = {
    t: editing ? editing.t : '',
    aim: editing ? (editing.aim || '') : '',
    tag: editing ? (editing.tag || '') : '',
    blocks: editing ? JSON.parse(JSON.stringify(editing.blocks || [])) : [{ k: 'p', v: '' }],
    files: editing ? JSON.parse(JSON.stringify(editing.files || [])) : []
  };
  let g = editing ? editing.g : S.grade;
  let sj = editing ? editing.s : S.subj;
  const sub = SUBJECTS.find(x => x.id === sj) || SUBJECTS[0];

  const blockRow = (b, i) => `<div class="bk-row" data-i="${i}">
    <div class="bk-head">
      <select class="bk-kind" aria-label="Loại khối">
        ${[['p', 'Đoạn văn'], ['ul', 'Danh sách'], ['f', 'Công thức'], ['note', 'Lưu ý'], ['q', 'Câu hỏi']].map(([k, t]) =>
    `<option value="${k}"${b.k === k ? ' selected' : ''}>${t}</option>`).join('')}
      </select>
      <span class="bk-n">${String(i + 1).padStart(2, '0')}</span>
      <span class="grow"></span>
      <span class="bk-btns">
        <button data-up="${i}" title="Lên" class="bkbtn"${i === 0 ? ' disabled' : ''}>↑</button>
        <button data-dn="${i}" title="Xuống" class="bkbtn">↓</button>
        <button data-rm="${i}" title="Xoá khối" class="bkbtn del">×</button>
      </span>
    </div>
    <textarea class="bk-val" rows="${b.k === 'ul' ? 3 : b.k === 'q' ? 1 : 2}" placeholder="${b.k === 'ul' ? 'Mỗi dòng một ý' : b.k === 'f' ? 'Ví dụ: F = ma' : b.k === 'q' ? 'Câu hỏi cho học sinh…' : 'Nội dung…'}">${Array.isArray(b.v) ? b.v.join('\n') : (b.v || '')}</textarea>
    ${b.k === 'q' ? `<textarea class="bk-ans" rows="1" placeholder="Đáp án / gợi ý">${b.a || ''}</textarea>` : ''}
  </div>`;

  $('#main').innerHTML = `<section class="wrap studio-page">
    ${pageHead(editing ? 'Sửa bài học' : 'Tạo bài học mới', 'Viết, dán, đính kèm tệp — lưu ngay trong máy',
    'Dùng cho mọi môn: chọn lớp và môn, soạn nội dung theo khối, gắn ảnh/PDF/Word, thêm câu hỏi tự kiểm tra. Bài xuất bản sẽ nằm trong danh sách môn đó.')}

    <div class="studio-grid">
      <div class="studio-main">
        <label class="st-row"><span>Tiêu đề bài</span>
          <input id="stT" type="text" value="${draft.t.replace(/"/g, '&quot;')}" placeholder="Ví dụ: Định luật Ôm cho đoạn mạch"></label>
        <div class="st-two">
          <label class="st-row"><span>Lớp</span>
            <select id="stG">${Array.from({ length: 12 }, (_, i) => i + 1).map(n => `<option value="${n}"${n === g ? ' selected' : ''}>Lớp ${n}</option>`).join('')}</select></label>
          <label class="st-row"><span>Môn</span>
            <select id="stS">${subjectsFor(g).map(s => `<option value="${s.id}"${s.id === sj ? ' selected' : ''}>${s.name}</option>`).join('')}</select></label>
        </div>
        <label class="st-row"><span>Mục tiêu (1 câu)</span>
          <input id="stAim" type="text" value="${draft.aim.replace(/"/g, '&quot;')}" placeholder="Học xong làm được gì?"></label>
        <label class="st-row"><span>Nhãn nhỏ</span>
          <input id="stTag" type="text" value="${draft.tag.replace(/"/g, '&quot;')}" placeholder="Ví dụ: Chương 2 · bài 5"></label>

        <div class="st-blocks">
          <div class="st-blocks-h">
            <span class="kicker">Nội dung</span>
            <span class="grow"></span>
            <span class="st-tpl-h">Bắt đầu từ mẫu</span>
          </div>
          <div class="st-tpl">
            <button data-tpl="lecture">Bài giảng</button>
            <button data-tpl="summary">Tóm tắt công thức</button>
            <button data-tpl="drill">Đề luyện 3 câu</button>
            <button data-tpl="lab">Phiếu thí nghiệm</button>
          </div>
          <div id="bkList"></div>
          <button class="btn ghost sm" id="bkAdd">+ Thêm khối</button>
        </div>
      </div>

      <aside class="studio-side">
        <div class="shelf-box">
          <span class="kicker">Tệp đính kèm</span>
          <label class="drop-file" id="stDrop">
            <input type="file" id="stFile" multiple hidden>
            <b>Kéo tệp vào đây</b><span>hoặc bấm để chọn · ảnh, PDF, Word, bảng tính</span>
          </label>
          <div class="file-mini" id="stFiles"></div>
        </div>
        <div class="shelf-box st-prev-box">
          <span class="kicker">Xem trước · sống</span>
          <div class="st-prev" id="stPrev"></div>
          <p class="muted" style="font-size:10.5px;line-height:1.55">Bài sẽ hiện trong <b id="stWhere">Lớp ${g} › ${sub.name}</b>.</p>
          <button class="btn sm" id="stSave">${editing ? 'Lưu thay đổi' : 'Xuất bản bài'}</button>
          <a class="btn ghost sm" href="#/subject/${g}/${sj}" style="margin-top:6px">Huỷ</a>
        </div>
        <div class="shelf-box">
          <span class="kicker">Nhập / xuất</span>
          <p class="muted" style="font-size:11px;line-height:1.6">Giáo viên có thể xuất bài ra tệp <code>.json</code> rồi gửi cho lớp, học sinh nhập vào là có ngay.</p>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button class="btn ghost sm" id="stExport">Xuất bài</button>
            <label class="btn ghost sm" style="display:inline-block">Nhập bài<input type="file" id="stImport" accept=".json,application/json" hidden></label>
          </div>
        </div>
      </aside>
    </div>
  </section>`;

  const syncFromForm = () => {
    draft.t = $('#stT').value.trim();
    draft.aim = $('#stAim').value.trim();
    draft.tag = $('#stTag').value.trim();
  };
  const paintPreview = () => {
    const host = $('#stPrev'); if (!host) return;
    const body = draft.blocks.map(b => renderBlock(b, draft)).join('');
    const title = draft.t || 'Chưa đặt tiêu đề';
    host.innerHTML = `<div class="stp-kicker">Lớp ${g} · ${sub.name}${draft.tag ? ' · ' + draft.tag : ''}</div>
      <div class="stp-title">${title}</div>
      ${draft.aim ? `<div class="stp-aim">${draft.aim}</div>` : ''}
      <div class="stp-body">${body || '<p class="muted" style="font-size:11px">Chưa có nội dung — gõ ở khung bên trái.</p>'}</div>
      ${draft.files.length ? `<div class="stp-files">${draft.files.map(f => `<span class="stp-file">${fileIcon(f.type)}</span>`).join('')}<i>${draft.files.length} tệp đính kèm</i></div>` : ''}`;
    const w = $('#stWhere'); if (w) w.textContent = 'Lớp ' + g + ' › ' + sub.name;
  };
  const paintBlocks = () => {
    $('#bkList').innerHTML = draft.blocks.map(blockRow).join('');
    paintPreview();
    $$('#bkList .bk-kind').forEach(sel => sel.onchange = () => {
      const i = +sel.closest('.bk-row').dataset.i;
      draft.blocks[i].k = sel.value;
      if (sel.value === 'ul' && !Array.isArray(draft.blocks[i].v)) draft.blocks[i].v = String(draft.blocks[i].v || '').split('\n').filter(Boolean);
      if (sel.value !== 'ul' && Array.isArray(draft.blocks[i].v)) draft.blocks[i].v = draft.blocks[i].v.join('\n');
      syncFromForm(); paintBlocks();
    });
    $$('#bkList .bk-val').forEach(ta => ta.oninput = () => {
      const i = +ta.closest('.bk-row').dataset.i;
      draft.blocks[i].v = draft.blocks[i].k === 'ul' ? ta.value.split('\n').filter(Boolean) : ta.value;
      syncFromForm(); paintPreview();
    });
    $$('#bkList .bk-ans').forEach(ta => ta.oninput = () => {
      const i = +ta.closest('.bk-row').dataset.i;
      draft.blocks[i].a = ta.value;
      syncFromForm(); paintPreview();
    });
    $$('#bkList [data-rm]').forEach(b => b.onclick = () => {
      const i = +b.dataset.rm;
      draft.blocks.splice(i, 1);
      if (!draft.blocks.length) draft.blocks.push({ k: 'p', v: '' });
      syncFromForm(); paintBlocks();
    });
    $$('#bkList [data-up]').forEach(b => b.onclick = () => {
      const i = +b.dataset.up;
      if (i <= 0) return;
      [draft.blocks[i - 1], draft.blocks[i]] = [draft.blocks[i], draft.blocks[i - 1]];
      syncFromForm(); paintBlocks();
    });
    $$('#bkList [data-dn]').forEach(b => b.onclick = () => {
      const i = +b.dataset.dn;
      if (i >= draft.blocks.length - 1) return;
      [draft.blocks[i + 1], draft.blocks[i]] = [draft.blocks[i], draft.blocks[i + 1]];
      syncFromForm(); paintBlocks();
    });
  };
  paintBlocks();
  const TPL = {
    lecture: [
      { k: 'p', v: 'Mở bài: vì sao phần này quan trọng, nó nối vào bài trước thế nào.' },
      { k: 'f', v: 'Công thức chính: …' },
      { k: 'ul', v: ['Ý 1: định nghĩa / điều kiện áp dụng', 'Ý 2: cách biến đổi khi làm bài', 'Ý 3: đơn vị và kiểm tra kết quả'] },
      { k: 'note', v: 'Lỗi hay gặp: … (ghi đúng chỗ học sinh trong lớp mình hay sai).' },
      { k: 'q', v: 'Câu hỏi kiểm tra: phát biểu lại định luật bằng lời của em.', a: 'Gợi ý trả lời…' }
    ],
    summary: [
      { k: 'ul', v: ['Công thức 1 — dùng khi nào', 'Công thức 2 — dùng khi nào'] },
      { k: 'f', v: 'Công thức gộp / hệ quả: …' },
      { k: 'note', v: 'Sai đơn vị là lỗi mất điểm nhiều nhất — đổi hết về SI trước khi tính.' }
    ],
    drill: [
      { k: 'p', v: 'Đề: (tóm tắt dữ kiện và yêu cầu cần tìm).' },
      { k: 'q', v: 'Câu 1 (nhận biết): …', a: 'Đáp án / lời giải ngắn' },
      { k: 'q', v: 'Câu 2 (vận dụng): …', a: 'Đáp án / lời giải ngắn' },
      { k: 'q', v: 'Câu 3 (vận dụng cao): …', a: 'Đáp án / lời giải ngắn' }
    ],
    lab: [
      { k: 'p', v: 'Mục đích: đo / kiểm chứng …' },
      { k: 'ul', v: ['Dụng cụ: …', 'Bố trí: …', 'An toàn: …'] },
      { k: 'ul', v: ['Bước 1: …', 'Bước 2: …', 'Bước 3: ghi số liệu vào bảng'] },
      { k: 'note', v: 'Kết quả mong đợi: … — sai số chấp nhận …' }
    ]
  };
  $$('.st-tpl [data-tpl]').forEach(b => b.onclick = () => {
    const onlyEmpty = draft.blocks.every(x => !x.v || (Array.isArray(x.v) && !x.v.length));
    const useTpl = () => {
      draft.blocks = JSON.parse(JSON.stringify(TPL[b.dataset.tpl] || []));
      paintBlocks();
      toast('Đã chèn mẫu — sửa lại theo ý bạn');
    };
    if (onlyEmpty) return useTpl();
    uiConfirm('Chèn mẫu', 'Bài đang soạn đã có nội dung. Thay bằng mẫu này?', useTpl, { okText: 'Thay bằng mẫu' });
  });

  $('#bkAdd').onclick = () => { syncFromForm(); draft.blocks.push({ k: 'p', v: '' }); paintBlocks();
    const last = $('#bkList').lastElementChild; if (last) { last.scrollIntoView({ block: 'center', behavior: 'smooth' }); last.querySelector('.bk-val').focus(); } };
  ['#stT', '#stAim', '#stTag'].forEach(sel => { const el = $(sel); if (el) el.oninput = () => { syncFromForm(); paintPreview(); }; });

  $('#stG').onchange = e => {
    const val = +e.target.value;
    /* Trình duyệt có thể trả về một giá trị không nằm trong danh sách (khôi
       phục form, dịch trang, tiện ích tự điền). Khi đó subjectsFor() trả mảng
       rỗng và `list[0].id` ném lỗi — trang soạn bài chết ngay giữa lúc gõ.
       Kẹp về lớp hợp lệ gần nhất thay vì tin vào giá trị của thẻ select. */
    const list = subjectsFor(val);
    if (!list.length) {
      e.target.value = String(g);
      toast('Lớp này chưa có môn nào — giữ nguyên lớp đang chọn');
      return;
    }
    g = val;
    const cur = $('#stS').value;
    $('#stS').innerHTML = list.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    if (list.some(s => s.id === cur)) $('#stS').value = cur; else sj = list[0].id;
    paintPreview();
    $('#stS').onchange({ target: $('#stS') });
  };
  $('#stS').onchange = e => { sj = e.target.value; paintPreview(); };

  const paintFiles = () => {
    const host = $('#stFiles');
    host.innerHTML = draft.files.length ? draft.files.map(f => `
      <div class="file-chip ro"><i>${fileIcon(f.type)}</i><span>${f.name}</span><em>${fileSize(f.size)}</em>
        <button data-un="${f.id}" title="Bỏ khỏi bài">×</button></div>`).join('') : '<p class="muted" style="font-size:11px">Chưa gắn tệp.</p>';
    $$('#stFiles [data-un]').forEach(b => b.onclick = () => {
      draft.files = draft.files.filter(x => x.id !== b.dataset.un);
      paintFiles(); paintPreview();
    });
  };
  paintFiles();

  const addFiles = async files => {
    for (const f of files) {
      const rec = await FileStore.put(f);
      draft.files.push({ id: rec.id, name: rec.name, type: rec.type, size: rec.size });
    }
    paintFiles(); paintPreview();
    toast('Đã gắn ' + files.length + ' tệp');
  };
  $('#stFile').onchange = async e => { await addFiles(e.target.files); e.target.value = ''; };
  const drop = $('#stDrop');
  ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('hot'); }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('hot'); }));
  drop.addEventListener('drop', async e => { if (e.dataTransfer.files) await addFiles(e.dataTransfer.files); });

  $('#stSave').onclick = () => {
    syncFromForm();
    if (!draft.t) { toast('Chưa đặt tiêu đề bài'); $('#stT').focus(); return; }
    const S2 = schoolState();
    const key = g + '|' + sj;
    S2.lessons[key] = S2.lessons[key] || [];
    if (editing && !editing.seed) {
      const idx = S2.lessons[key].findIndex(x => x.id === editing.id);
      const rec = Object.assign({}, editing, { g, s: sj, t: draft.t, aim: draft.aim, tag: draft.tag, blocks: draft.blocks, files: draft.files, at: Date.now() });
      if (idx >= 0) S2.lessons[key][idx] = rec;
      else {
        const oldKey = editing.g + '|' + editing.s;
        S2.lessons[oldKey] = (S2.lessons[oldKey] || []).filter(x => x.id !== editing.id);
        S2.lessons[key].push(rec);
      }
      if (typeof window !== 'undefined') window.EXPL_INDEX = null;
      save(); toast('Đã lưu thay đổi'); location.hash = '#/read/' + editing.id;
    } else {
      const rec = {
        id: 'my' + Date.now().toString(36), g, s: sj, t: draft.t, aim: draft.aim, tag: draft.tag,
        blocks: draft.blocks, files: draft.files, at: Date.now()
      };
      S2.lessons[key].push(rec);
      if (typeof window !== 'undefined') window.EXPL_INDEX = null;
      save(); toast('Đã xuất bản bài mới');
      location.hash = '#/read/' + rec.id;
    }
  };

  $('#stExport').onclick = () => {
    syncFromForm();
    const pack = { app: 'vat-li-9', kind: 'lesson', v: 1, lesson: { g, s: sj, t: draft.t, aim: draft.aim, tag: draft.tag, blocks: draft.blocks } };
    const blob = new Blob([JSON.stringify(pack, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'bai-hoc-' + (draft.t || 'moi').replace(/[^\p{L}\p{N}]+/gu, '-').slice(0, 40) + '.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
    toast('Đã xuất bài ra tệp .json');
  };
  if (typeof syncScope === 'function') syncScope();
  $('#stImport').onchange = async e => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    try {
      const txt = await f.text();
      const pack = JSON.parse(txt);
      const L = pack.lesson || pack;
      if (!L.t) throw new Error('thiếu tiêu đề');
      draft.t = L.t; draft.aim = L.aim || ''; draft.tag = L.tag || '';
      draft.blocks = (L.blocks || []).map(b => ({ k: b.k || 'p', v: b.v, a: b.a }));
      if (L.g) g = L.g; if (L.s) sj = L.s;
      $('#stT').value = draft.t; $('#stAim').value = draft.aim; $('#stTag').value = draft.tag;
      paintBlocks();
      toast('Đã nạp bài — kiểm tra rồi bấm Xuất bản');
    } catch (err) {
      toast('Tệp không đúng định dạng bài học');
    }
    e.target.value = '';
  };
}

/* ---------------- 9 · TRANG: BÀI CỦA TÔI ---------------- */
function renderMine() {
  const S = schoolState();
  const rows = [];
  Object.keys(S.lessons).forEach(k => S.lessons[k].forEach(l => rows.push(l)));
  rows.sort((a, b) => (b.at || 0) - (a.at || 0));

  $('#main').innerHTML = `<section class="wrap wide">
    ${pageHead('Bài của tôi', rows.length + ' bài tự soạn', 'Tất cả bài bạn tạo, gom một chỗ. Sửa, xuất ra tệp hoặc xoá đều được.')}
    <div class="subj-bar">
      <a class="btn ghost sm" href="#/subjects">← Khoá học</a>
      <span class="grow"></span>
      <a class="btn sm" href="#/studio">+ Tạo bài học</a>
    </div>
    ${rows.length ? `<ol class="lesson-list">${rows.map(l => {
      const sub = SUBJECTS.find(x => x.id === l.s) || { name: l.s };
      return `<li><a href="#/read/${l.id}">
        <span class="ll-n">L${l.g}</span>
        <span class="ll-body"><b>${l.t}</b><i>${sub.name} · ${(l.aim || '').slice(0, 60)}</i>
          <em>${(l.blocks || []).length} mục${(l.files || []).length ? ' · ' + l.files.length + ' tệp' : ''}</em></span>
        <span class="ll-go">→</span></a></li>`;
    }).join('')}</ol>` : `<div class="shelf-box" style="margin-top:16px"><p>Chưa có bài tự soạn. Bấm “Tạo bài học” để bắt đầu.</p></div>`}
  </section>`;
}



const FILE_KINDS = [
  { id: 'all', t: 'Tất cả' }, { id: 'img', t: 'Ảnh', re: /^image\// },
  { id: 'pdf', t: 'PDF', re: /pdf/ }, { id: 'doc', t: 'Word', re: /word|opendocument\.text/ },
  { id: 'sheet', t: 'Bảng tính', re: /sheet|excel|csv/ },
  { id: 'other', t: 'Khác', re: null }
];
const fileKindOf = t => {
  for (const k of FILE_KINDS) { if (k.re && k.re.test(t || '')) return k.id; }
  return 'other';
};
const fileDate = n => {
  const d = new Date(n);
  return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
};
const fileSizeCached = n => n > 1048576 ? (n / 1048576).toFixed(1).replace('.', ',') + ' MB'
  : n > 1024 ? Math.round(n / 1024) + ' KB' : n + ' B';
if (typeof FileStore !== 'undefined' && FileStore.all) {
  FileStore.all().then(list => {
    window.__filesCache = (list || []).map(f => ({ id: f.id, name: f.name, size: f.size }));
    if (typeof PAL_INDEX_CACHE !== 'undefined') PAL_INDEX_CACHE = null;
  }).catch(() => { });
}
let _thumbUrls = [];
const _revokeThumbs = () => { _thumbUrls.forEach(u => URL.revokeObjectURL(u)); _thumbUrls = []; };

async function renderFiles() {
  _revokeThumbs();
  const files = (await FileStore.all()).sort((a, b) => b.at - a.at);
  window.__filesCache = files.map(f => ({ id: f.id, name: f.name, size: f.size }));
  if (typeof PAL_INDEX_CACHE !== 'undefined') PAL_INDEX_CACHE = null;
  if (typeof window !== 'undefined') window.EXPL_INDEX = null;
  /* Trang này dựng nội dung SAU khi đọc IndexedDB, nên khi routeNext() chạy
     thì #main còn trống và dải "Đi tiếp" không được thêm. Gọi lại sau khi
     đã vẽ xong — hàm tự bỏ qua nếu đã có. */
  const _afterPaint = () => { if (typeof routeNext === 'function') routeNext(); };
  const S = (schoolState().soft = schoolState().soft || {});

  const thumb = {};
  for (const f of files) {
    if (fileKindOf(f.type) === 'img' && f.buf) {
      const u = URL.createObjectURL(new Blob([f.buf], { type: f.type }));
      _thumbUrls.push(u); thumb[f.id] = u;
    }
  }
  let quota = null;
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const q = await navigator.storage.estimate();
      quota = { used: q.usage || 0, all: q.quota || 0 };
    }
  } catch (e) { }

  const totalSize = files.reduce((a, f) => a + f.size, 0);
  const counts = {}; files.forEach(f => { const k = fileKindOf(f.type); counts[k] = (counts[k] || 0) + 1; });
  const filter = S.fileFilter || 'all';

  $('#main').innerHTML = `<section class="wrap wide files-page">
    ${pageHead('Kho tệp của bạn', files.length + ' tệp · ' + fileSize(totalSize) + ' · nằm trong máy này',
    'Kéo ảnh đề bài, PDF sách, Word, bảng tính vào ô bên dưới — tệp ở lại trong trình duyệt, không đi đâu cả. Mở xem ngay, gắn vào bài học, hoặc tải về bất cứ lúc nào.')}

    <div class="fz" id="fz" tabindex="0" role="button" aria-label="Tải tệp lên">
      <div class="fz-in">
        <svg viewBox="0 0 24 24" class="fz-ic" aria-hidden="true"><path d="M12 16V4m0 0 4 4m-4-4-4 4"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>
        <b>Kéo tệp vào đây</b>
        <span>hoặc <u>bấm để chọn</u> · ảnh, PDF, Word, Excel, PowerPoint, video, âm thanh</span>
      </div>
      <input type="file" id="filesUp" multiple hidden>
    </div>

    ${quota ? `<div class="store-line">
      <span class="kicker">Đã dùng ${fileSize(quota.used)}${quota.all ? ' / ' + fileSize(quota.all) : ''}</span>
      <div class="store-bar"><i style="width:${quota.all ? Math.min(100, quota.used / quota.all * 100) : 0}%"></i></div>
    </div>` : ''}

    ${files.length ? `<div class="file-bar">
      ${FILE_KINDS.filter(k => k.id === 'all' || counts[k.id]).map(k =>
    `<button class="fchip${filter === k.id ? ' on' : ''}" data-fk="${k.id}">${k.t}<i>${k.id === 'all' ? files.length : counts[k.id]}</i></button>`).join('')}
      <span class="grow"></span>
      <span class="kicker">mới nhất trước</span>
    </div>

    <div class="file-grid">
      ${files.filter(f => filter === 'all' || fileKindOf(f.type) === filter).map(f => `<div class="file-card" data-f="${f.id}">
        <div class="fc-thumb">${thumb[f.id]
      ? `<img src="${thumb[f.id]}" alt="${f.name}" loading="lazy">`
      : `<span class="fc-mono">${fileIcon(f.type)}</span>`}</div>
        <b title="${f.name}">${f.name}</b>
        <i>${fileSize(f.size)} · ${fileDate(f.at)}</i>
        <span class="fc-btns">
          <button data-open="${f.id}" class="bkbtn">Mở</button>
          <a class="bkbtn" href="#" data-dl="${f.id}" download="${f.name}">Tải</a>
          <button data-del="${f.id}" class="bkbtn del">Xoá</button>
        </span>
      </div>`).join('') || '<p class="muted" style="grid-column:1/-1;padding:22px">Không có tệp loại này.</p>'}
    </div>` : `<div class="files-empty">
      <b>Chưa có tệp nào</b>
      <p>Đề thi scan, ảnh chụp bảng, file Word bài giảng, bảng điểm Excel — kéo vào ô phía trên là xong. Tệp sẽ hiện ở đây và gắn được vào bất cứ bài học nào.</p>
    </div>`}
  </section>`;

  const up = $('#filesUp'), fz = $('#fz');
  const take = async list => {
    if (!list || !list.length) return;
    toast('Đang lưu ' + list.length + ' tệp…');
    await upFiles(list);
    renderFiles();
  };
  if (up) up.onchange = e => take(e.target.files);
  if (fz) {
    fz.onclick = () => up && up.click();
    fz.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); up && up.click(); } };
    ['dragenter', 'dragover'].forEach(ev => fz.addEventListener(ev, e => { e.preventDefault(); fz.classList.add('hot'); }));
    ['dragleave', 'drop'].forEach(ev => fz.addEventListener(ev, e => { e.preventDefault(); if (ev === 'drop' || e.target === fz) fz.classList.remove('hot'); }));
    fz.addEventListener('drop', e => take(e.dataTransfer.files));
  }
  const main = $('#main');
  main.ondragover = e => { e.preventDefault(); if (fz) fz.classList.add('hot'); };
  main.ondragleave = e => { if (!main.contains(e.relatedTarget) && fz) fz.classList.remove('hot'); };
  main.ondrop = e => { e.preventDefault(); if (fz) fz.classList.remove('hot'); take(e.dataTransfer.files); };

  $$('[data-fk]').forEach(b => b.onclick = () => {
    schoolState().soft.fileFilter = b.dataset.fk; save(); renderFiles();
  });
  $$('[data-open]').forEach(b => b.onclick = () => filePreview(b.dataset.open));
  $$('[data-dl]').forEach(a => a.onclick = async e => {
    e.preventDefault();
    const rec = await FileStore.get(a.dataset.dl);
    if (!rec) return;
    const u = URL.createObjectURL(new Blob([rec.buf], { type: rec.type }));
    const t = document.createElement('a'); t.href = u; t.download = rec.name; t.click();
    setTimeout(() => URL.revokeObjectURL(u), 4000);
  });
  /* mở thẳng một tệp: #/files?f=<id> */
  const qf = (location.hash.match(/[?&]f=([^&]+)/) || [])[1];
  if (qf) setTimeout(() => filePreview(decodeURIComponent(qf)), 150);
  $$('[data-del]').forEach(b => b.onclick = () => {
    uiConfirm('Xoá tệp', 'Tệp này sẽ bị xoá khỏi kho lưu trong máy. Không hoàn tác được.', async () => {
      await FileStore.del(b.dataset.del);
      renderFiles();
    }, { danger: true, okText: 'Xoá tệp' });
  });
  /* dải "Đi tiếp" thêm sau khi nội dung bất đồng bộ đã vẽ xong */
  _afterPaint();
}
