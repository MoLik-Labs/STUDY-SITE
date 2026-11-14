/* =========================================================
   CONTENT 3 — new question types (order / pick) + extra items
   Engine support: app.js renderQuestion branches.
   ========================================================= */

/* ---------- tiny svg builders for pick tiles ---------- */
const T = inner => '<svg viewBox="0 0 120 76" class="tile-svg" aria-hidden="true">' + inner + '</svg>';
const ln = (x1, y1, x2, y2, extra) => '<path d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + '" stroke="currentColor" stroke-width="1.3" fill="none" ' + (extra || '') + '/>';
const bx = (x, y, w, h) => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="none" stroke="currentColor" stroke-width="1.3"/>';
const arrowUp = (x, y, h) => '<path d="M' + x + ' ' + y + 'V' + (y - h) + '" stroke="currentColor" stroke-width="1.6"/><path d="M' + (x - 4) + ' ' + (y - h + 7) + 'l4 -7 4 7z" fill="currentColor"/>';

/* circuits: ser / par / mixA / mixB */
function circTile(kind) {
  const c = [];
  const bat = '<path d="M14 33v12M22 36v6" stroke="currentColor" stroke-width="1.5"/>';
  if (kind === 'ser') {
    c.push(ln(18, 46, 18, 22), ln(18, 22, 30, 22), bx(30, 15, 22, 14), ln(52, 22, 68, 22), bx(68, 15, 22, 14), ln(90, 22, 102, 22), ln(102, 22, 102, 46), ln(18, 46, 102, 46));
    c.push(bat);
  } else if (kind === 'par') {
    c.push(ln(18, 20, 18, 56), ln(102, 20, 102, 56), ln(18, 20, 34, 20), bx(34, 13, 24, 14), ln(58, 20, 102, 20),
      ln(18, 46, 40, 46), bx(40, 39, 24, 14), ln(64, 46, 102, 46), bat);
  } else if (kind === 'mixA') {
    c.push(ln(18, 20, 18, 56), ln(102, 20, 102, 56), ln(18, 20, 28, 20), bx(28, 13, 20, 14), ln(48, 20, 72, 20), bx(72, 13, 20, 14), ln(92, 20, 102, 20),
      ln(18, 56, 36, 56), bx(36, 49, 24, 14), ln(60, 56, 102, 56), bat);
  } else {
    c.push(ln(18, 20, 18, 56), ln(102, 20, 102, 56), ln(18, 20, 26, 20), bx(26, 13, 22, 14), ln(48, 20, 102, 20),
      ln(60, 20, 60, 24), ln(60, 24, 60, 32), bx(48, 32, 24, 14), ln(72, 32, 102, 32), ln(102, 32, 102, 56), bat);
  }
  return T(c.join(''));
}

/* lens tiles: real image / virtual (in front) / diverging / no ray */
function lensTile(kind) {
  const c = [ln(6, 38, 114, 38, 'stroke-dasharray="3 3" opacity=".55"')];
  c.push('<path d="M60 12c9 12 9 40 0 52-9-12-9-40 0-52z" fill="none" stroke="currentColor" stroke-width="1.4"/>');
  c.push('<circle cx="34" cy="38" r="1.8" fill="currentColor"/><circle cx="86" cy="38" r="1.8" fill="currentColor"/>');
  if (kind === 'real') {
    c.push(arrowUp(24, 38, 16));
    c.push('<path d="M84 38V' + 52 + '" stroke="currentColor" stroke-width="1.5"/><path d="M80 47l4 6 4-6z" fill="currentColor"/>');
    c.push(ln(24, 22, 60, 22), ln(60, 22, 96, 52), ln(24, 22, 96, 52, 'opacity=".6"'));
  } else if (kind === 'virt') {
    c.push(arrowUp(24, 38, 12));
    c.push('<path d="M40 38V' + 22 + '" stroke="currentColor" stroke-width="1.4" stroke-dasharray="3 3"/><path d="M36 27l4 -6 4 6z" fill="currentColor"/>');
    c.push(ln(24, 26, 60, 26), ln(60, 26, 104, 34), ln(40, 22, 60, 26, 'stroke-dasharray="3 3"'));
  } else if (kind === 'div') {
    c.push('<path d="M60 12c-8 12-8 40 0 52" fill="none" stroke="currentColor" stroke-width="1.4"/>');
    c.push(arrowUp(26, 38, 14));
    c.push('<path d="M44 38V' + 30 + '" stroke="currentColor" stroke-width="1.3" stroke-dasharray="3 3"/><path d="M40 34l4 -5 4 5z" fill="currentColor"/>');
    c.push(ln(26, 24, 60, 24), ln(60, 24, 104, 30), ln(44, 30, 60, 24, 'stroke-dasharray="3 3"'));
  } else {
    c.push(arrowUp(24, 38, 16), ln(24, 22, 60, 22), ln(60, 22, 100, 30));
  }
  return T(c.join(''));
}

/* buoyancy tiles */
function blockTile(state) {
  const c = ['<path d="M14 40H106" stroke="currentColor" stroke-width="1" stroke-dasharray="3 3" opacity=".7"/>',
    '<rect x="34" y="' + (state === 'float' ? 30 : 20) + '" width="34" height="30" fill="none" stroke="currentColor" stroke-width="1.4"/>'];
  c.push('<path d="M51 ' + (state === 'float' ? 30 : 20) + 'V' + (state === 'float' ? 16 : 8) + '" stroke="currentColor" stroke-width="1.2"/><path d="M47 ' + (state === 'float' ? 21 : 13) + 'l4 5 4-5z" fill="currentColor"/>');
  c.push('<path d="M64 ' + (state === 'float' ? 60 : 50) + 'V' + (state === 'float' ? 66 : 60) + '" stroke="currentColor" stroke-width="1.2"/><path d="M60 ' + (state === 'float' ? 63 : 55) + 'l4 -4 4 4z" fill="currentColor"/>');
  if (state === 'equal') c.push('<path d="M96 32v12" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2"/>');
  return T(c.join(''));
}

/* work tiles: force angle */
function forceTile(kind) {
  const c = [ln(14, 56, 106, 56, 'stroke-width="1"')];
  if (kind === 'same') {
    c.push('<rect x="34" y="34" width="26" height="22" fill="none" stroke="currentColor" stroke-width="1.3"/>');
    c.push('<path d="M60 45h30" stroke="currentColor" stroke-width="1.6"/><path d="M84 41l6 4-6 4z" fill="currentColor"/>');
  } else if (kind === 'perp') {
    c.push('<rect x="34" y="34" width="26" height="22" fill="none" stroke="currentColor" stroke-width="1.3"/>');
    c.push('<path d="M64 45h26" stroke="currentColor" stroke-width="1.2"/><path d="M84 41l6 4-6 4z" fill="currentColor"/>');
    c.push('<path d="M47 34V12" stroke="currentColor" stroke-width="1.6"/><path d="M43 18l4 -7 4 7z" fill="currentColor"/>');
  } else if (kind === 'opp') {
    c.push('<rect x="46" y="34" width="26" height="22" fill="none" stroke="currentColor" stroke-width="1.3"/>');
    c.push('<path d="M72 45h24" stroke="currentColor" stroke-width="1.2"/><path d="M90 41l6 4-6 4z" fill="currentColor"/>');
    c.push('<path d="M46 45h-24" stroke="currentColor" stroke-width="1.6"/><path d="M28 41l-6 4 6 4z" fill="currentColor"/>');
  } else {
    c.push('<rect x="34" y="34" width="26" height="22" fill="none" stroke="currentColor" stroke-width="1.3"/>');
    c.push('<path d="M60 34V18" stroke="currentColor" stroke-width="1.6"/><path d="M56 24l4 -7 4 7z" fill="currentColor"/>');
  }
  return T(c.join(''));
}

/* I–U graph tiles */
function graphTile(kind) {
  const c = ['<path d="M20 12v52h84" stroke="currentColor" stroke-width="1.2" fill="none"/>'];
  if (kind === 'linear') c.push('<path d="M20 58L98 18" stroke="currentColor" stroke-width="1.6"/>');
  if (kind === 'flat') c.push('<path d="M20 30H98" stroke="currentColor" stroke-width="1.6"/>');
  if (kind === 'curve') c.push('<path d="M20 58c30 0 50 -10 78 -44" stroke="currentColor" stroke-width="1.6" fill="none"/>');
  if (kind === 'inv') c.push('<path d="M22 16c0 30 30 38 76 42" stroke="currentColor" stroke-width="1.6" fill="none"/>');
  return T(c.join(''));
}

/* magnetic field tiles */
function magnetTile(kind) {
  const c = [bx(44, 28, 32, 20)];
  c.push('<text x="60" y="42" text-anchor="middle" font-size="9" font-family="monospace" fill="currentColor">N→S</text>');
  if (kind === 'out') {
    c.push('<path d="M40 24c-16 -8 -20 -2 -24 4" stroke="currentColor" stroke-width="1.2" fill="none" marker-end="url(#a)"/>');
    c.push('<path d="M80 24c16 -8 20 -2 24 4" stroke="currentColor" stroke-width="1.2" fill="none"/>');
    c.push('<path d="M96 30l6 -2-2 6z" fill="currentColor"/><path d="M24 30l-6 -2 2 6z" fill="currentColor"/>');
  } else if (kind === 'in') {
    c.push('<path d="M24 30c8 -8 12 -2 20 2" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M38 34l6 -2-2 6z" fill="currentColor"/>');
    c.push('<path d="M96 30c-8 -8 -12 -2 -20 2" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M82 34l-6 -2 2 6z" fill="currentColor"/>');
  } else if (kind === 'both') {
    c.push('<path d="M40 24c-14 -6 -18 0 -22 6" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M22 26l-4 6 6 0z" fill="currentColor"/>');
    c.push('<path d="M80 24c14 -6 18 0 22 6" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M98 26l4 6-6 0z" fill="currentColor"/>');
  } else {
    c.push('<path d="M60 28V8" stroke="currentColor" stroke-width="1.2"/><path d="M56 14l4 -7 4 7z" fill="currentColor"/>');
  }
  return T(c.join(''));
}

/* ammeter tiles */
function ammTile(kind) {
  const c = [ln(16, 20, 104, 20), ln(16, 56, 104, 56), ln(16, 20, 16, 56), ln(104, 20, 104, 56), bx(48, 13, 24, 14)];
  const meter = x => '<circle cx="' + x + '" cy="20" r="7" fill="none" stroke="currentColor" stroke-width="1.3"/><text x="' + x + '" y="23" text-anchor="middle" font-size="8" font-family="monospace" fill="currentColor">A</text>';
  if (kind === 'series') c.push(meter(88));
  if (kind === 'parallel') c.push('<path d="M88 20v14" stroke="currentColor" stroke-width="1.2"/>', meter(88));
  if (kind === 'short') c.push('<path d="M88 20h16" stroke="currentColor" stroke-width="1.2"/>', meter(112));
  if (kind === 'none') c.push('');
  return T(c.join(''));
}

/* =========================================================
   QUIZ_EXTRA3
   ========================================================= */
const QUIZ_EXTRA3 = [

  /* ---------------- order: sắp xếp bước giải (8) ---------------- */
  {
    t: 3, type: 'order', q: 'Sắp xếp đúng thứ tự các bước tính công của lực kéo trên mặt phẳng nghiêng có ma sát.',
    s: ['Xác định trọng lượng P = 10m', 'Tính công có ích A_ci = P·h', 'Tính công toàn phần A_tp = F·l', 'Hiệu suất H = A_ci/A_tp · 100%'],
    e: 'Trình bày bài thi phải đi từ dữ kiện gốc (P) đến công có ích, công toàn phần, rồi mới kết luận hiệu suất.'
  },
  {
    t: 5, type: 'order', q: 'Sắp xếp các bước giải mạch R₁ nối tiếp (R₂ song song R₃).',
    s: ['Tính điện trở cụm song song R₂₃ = R₂R₃/(R₂+R₃)', 'Điện trở toàn mạch R = R₁ + R₂₃', 'Dòng mạch chính I = U/R', 'Hiệu điện thế cụm song song U₂₃ = I·R₂₃', 'Dòng qua từng nhánh I₂ = U₂₃/R₂, I₃ = U₂₃/R₃'],
    e: 'Cụm song song phải gộp trước, sau đó mới cộng với điện trở nối tiếp.'
  },
  {
    t: 7, type: 'order', q: 'Sắp xếp các bước giải bài cân bằng nhiệt khi thả miếng kim loại vào nước.',
    s: ['Xác định vật toả nhiệt và vật thu nhiệt', 'Viết phương trình cân bằng Q_toả = Q_thu', 'Thay Q = mc(t₁ − t) và Q = mc(t − t₂)', 'Giải phương trình tìm nhiệt độ cân bằng t'],
    e: 'Phải xác định đúng chiều truyền nhiệt trước khi viết phương trình.'
  },
  {
    t: 4, type: 'order', q: 'Sắp xếp các bước dựng ảnh của một vật qua thấu kính hội tụ.',
    s: ['Vẽ trục chính, quang tâm O, tiêu điểm F và F′', 'Vẽ vật AB vuông góc với trục chính tại A', 'Từ B vẽ tia tới song song trục chính, tia ló đi qua F′', 'Từ B vẽ tia tới đi qua O, tia ló truyền thẳng', 'Giao hai tia ló là B′, hạ vuông góc được A′B′'],
    e: 'Hai tia đặc biệt là đủ; tia thứ ba chỉ dùng để kiểm tra.'
  },
  {
    t: 1, type: 'order', q: 'Sắp xếp các bước giải bài hai xe ngược chiều gặp nhau.',
    s: ['Chọn chiều dương và gốc toạ độ', 'Viết toạ độ mỗi xe theo thời gian x = x₀ ± vt', 'Lập phương trình x₁(t) = x₂(t)', 'Giải tìm t rồi thay lại tính vị trí gặp'],
    e: 'Cùng một hệ quy chiếu cho cả hai xe, nếu không sẽ sai dấu.'
  },
  {
    t: 2, type: 'order', q: 'Sắp xếp các bước xét một vật nhúng trong chất lỏng.',
    s: ['Tính trọng lượng P = d_vật·V', 'Tính lực đẩy F_A = d_lỏng·V_chìm', 'So sánh P với F_A', 'Kết luận: P > F_A vật chìm, P = F_A lơ lửng, P < F_A vật nổi'],
    e: 'Chỉ so sánh được khi cả P và F_A cùng đơn vị và cùng thể tích xét.'
  },
  {
    t: 10, type: 'order', q: 'Sắp xếp các bước giải bài con lắc hoặc vật rơi bằng định luật bảo toàn cơ năng.',
    s: ['Chọn mốc thế năng (thường tại mặt đất)', 'Tính cơ năng tại vị trí đầu W₁ = W_đ + W_t', 'Tính cơ năng tại vị trí sau W₂', 'Cho W₁ = W₂ (bỏ qua ma sát) rồi giải'],
    e: 'Mốc thế năng phải cố định trong suốt bài; đổi mốc giữa bài là lỗi phổ biến.'
  },
  {
    t: 6, type: 'order', q: 'Sắp xếp các bước tính hao phí khi truyền tải điện năng.',
    s: ['Đổi P sang W và U sang V', 'Tính công suất hao phí P_hp = P²R/U²', 'Tính công suất có ích P − P_hp', 'Hiệu suất truyền tải H = (P − P_hp)/P'],
    e: 'Quên đổi kW → W là lỗi khiến kết quả lệch 10⁶ lần.'
  },

  /* ---------------- pick: chọn hình đúng (8) ---------------- */
  {
    t: 5, type: 'pick', q: 'Hình nào biểu diễn hai điện trở mắc song song?',
    tiles: [circTile('ser'), circTile('par'), circTile('mixB'), circTile('mixA')], a: 1,
    e: 'Song song: hai đầu các điện trở nối chung vào cùng hai điểm, hiệu điện thế bằng nhau.'
  },
  {
    t: 4, type: 'pick', q: 'Vật đặt ngoài tiêu cự (d > f) qua thấu kính hội tụ. Hình nào vẽ đúng ảnh?',
    tiles: [lensTile('virt'), lensTile('real'), lensTile('div'), lensTile('noray')], a: 1,
    e: 'd > f cho ảnh thật, ngược chiều, nằm khác phía vật — hứng được trên màn.'
  },
  {
    t: 4, type: 'pick', q: 'Hình nào vẽ đúng ảnh của vật qua thấu kính phân kì?',
    tiles: [lensTile('real'), lensTile('noray'), lensTile('div'), lensTile('virt')], a: 2,
    e: 'Phân kì luôn cho ảnh ảo, cùng chiều, nhỏ hơn vật, nằm trong khoảng tiêu cự cùng phía vật.'
  },
  {
    t: 2, type: 'pick', q: 'Hình nào mô tả đúng trạng thái vật nổi cân bằng trên mặt nước?',
    tiles: [blockTile('sink'), blockTile('float'), blockTile('deep'), blockTile('equal')], a: 1,
    e: 'Vật nổi: một phần thể tích nhô trên mặt thoáng, phần chìm cho F_A = P.'
  },
  {
    t: 3, type: 'pick', q: 'Trường hợp nào lực tác dụng KHÔNG sinh công?',
    tiles: [forceTile('same'), forceTile('perp'), forceTile('opp'), forceTile('up')], a: 1,
    e: 'Lực vuông góc với phương dịch chuyển: A = F·s·cos 90° = 0.'
  },
  {
    t: 5, type: 'pick', q: 'Cách mắc ampe kế nào đúng để đo dòng qua điện trở?',
    tiles: [ammTile('series'), ammTile('parallel'), ammTile('short'), ammTile('none')], a: 0,
    e: 'Ampe kế mắc nối tiếp với nhánh cần đo, chốt dương về phía cực dương của nguồn.'
  },
  {
    t: 5, type: 'pick', q: 'Đồ thị nào biểu diễn đúng định luật Ôm (I tỉ lệ thuận với U)?',
    tiles: [graphTile('curve'), graphTile('linear'), graphTile('flat'), graphTile('inv')], a: 1,
    e: 'Với điện trở không đổi, I = U/R nên đồ thị I–U là đường thẳng qua gốc toạ độ.'
  },
  {
    t: 6, type: 'pick', q: 'Hình nào biểu diễn đúng chiều đường sức từ bên ngoài nam châm thẳng?',
    tiles: [magnetTile('in'), magnetTile('out'), magnetTile('both'), magnetTile('up')], a: 1,
    e: 'Bên ngoài nam châm, đường sức đi ra từ cực Bắc và đi vào cực Nam.'
  },

  /* ---------------- num: điện + quang + nhiệt (13) ---------------- */
  {
    t: 5, type: 'num', q: 'Mạch gồm R₁ = 6 Ω nối tiếp R₂ = 3 Ω, U = 12 V. Công suất tiêu thụ trên R₂ (W)?',
    a: 5.33, tol: 0.1, unit: 'W',
    e: 'I = 12/(6+3) = 1,33 A ⇒ P₂ = I²R₂ = 1,33²·3 ≈ 5,33 W.'
  },
  {
    t: 5, type: 'num', q: 'Hai điện trở 10 Ω và 15 Ω mắc song song vào U = 30 V. Cường độ dòng qua điện trở 10 Ω (A)?',
    a: 3, tol: 0.01, unit: 'A',
    e: 'Mắc song song nên U mỗi nhánh đều 30 V ⇒ I = 30/10 = 3 A.'
  },
  {
    t: 5, type: 'num', q: 'Bếp điện 220 V – 1000 W dùng liên tục 2 giờ. Điện năng tiêu thụ (kWh)?',
    a: 2, tol: 0.01, unit: 'kWh',
    e: 'A = P·t = 1 kW · 2 h = 2 kWh (7,2.10⁶ J).'
  },
  {
    t: 5, type: 'num', q: 'Dây dẫn R = 50 Ω có dòng 2 A chạy qua trong 5 phút. Nhiệt lượng toả ra (kJ)?',
    a: 60, tol: 0.1, unit: 'kJ',
    e: 'Q = I²Rt = 4·50·300 = 60 000 J = 60 kJ.'
  },
  {
    t: 5, type: 'num', q: 'Cho R₁ = 4 Ω nối tiếp với cụm (R₂ = 6 Ω song song R₃ = 3 Ω), U = 12 V. Dòng mạch chính (A)?',
    a: 2, tol: 0.02, unit: 'A',
    e: 'R₂₃ = 6·3/9 = 2 Ω ⇒ R = 6 Ω ⇒ I = 12/6 = 2 A.'
  },
  {
    t: 5, type: 'num', q: 'Một bóng đèn ghi 220 V – 60 W sáng bình thường. Điện trở của đèn (Ω)?',
    a: 806.7, tol: 2, unit: 'Ω',
    e: 'R = U²/P = 220²/60 ≈ 806,7 Ω.'
  },
  {
    t: 5, type: 'num', q: 'Ba điện trở 6 Ω giống nhau mắc song song. Điện trở tương đương (Ω)?',
    a: 2, tol: 0.01, unit: 'Ω',
    e: '1/R = 3/6 ⇒ R = 2 Ω.'
  },
  {
    t: 4, type: 'num', q: 'Vật cao 2 cm đặt cách thấu kính hội tụ f = 10 cm một đoạn 15 cm. Ảnh cao (cm)?',
    a: 4, tol: 0.05, unit: 'cm',
    e: 'd′ = 15·10/5 = 30 cm; |k| = 30/15 = 2 ⇒ h′ = 4 cm, ảnh thật ngược chiều.'
  },
  {
    t: 4, type: 'num', q: 'Thấu kính phân kì có f = −20 cm, vật cách kính 20 cm. Ảnh cách kính bao nhiêu cm (nhập số âm)?',
    a: -10, tol: 0.2, unit: 'cm',
    e: 'd′ = d·f/(d − f) = 20·(−20)/40 = −10 cm: ảnh ảo, cùng phía vật, cách kính 10 cm.'
  },
  {
    t: 4, type: 'num', q: 'Ảnh thật cách thấu kính hội tụ 30 cm, vật cách kính 20 cm. Tiêu cự (cm)?',
    a: 12, tol: 0.1, unit: 'cm',
    e: '1/f = 1/20 + 1/30 = 1/12 ⇒ f = 12 cm.'
  },
  {
    t: 2, type: 'num', q: 'Vật thể tích 200 cm³ nhúng chìm hoàn toàn trong nước (d = 10 000 N/m³). Lực đẩy Archimedes (N)?',
    a: 2, tol: 0.02, unit: 'N',
    e: 'V = 200 cm³ = 2.10⁻⁴ m³ ⇒ F_A = 10 000 · 2.10⁻⁴ = 2 N.'
  },
  {
    t: 7, type: 'num', q: 'Đun 2 kg nước từ 20 °C đến 100 °C, c = 4200 J/kg.K. Nhiệt lượng cần (kJ)?',
    a: 672, tol: 1, unit: 'kJ',
    e: 'Q = m·c·Δt = 2·4200·80 = 672 000 J = 672 kJ.'
  },
  {
    t: 6, type: 'num', q: 'Máy biến áp có n₁ = 4400 vòng, n₂ = 110 vòng, U₁ = 220 V. Hiệu điện thế thứ cấp (V)?',
    a: 5.5, tol: 0.05, unit: 'V',
    e: 'U₂ = U₁·n₂/n₁ = 220·110/4400 = 5,5 V (máy hạ áp 40 lần).'
  },

  /* ---------------- multi: điện (4) ---------------- */
  {
    t: 5, type: 'multi', q: 'Khi mắc thêm một điện trở song song vào đoạn mạch đang có nguồn không đổi, nhận xét nào đúng?',
    o: ['Điện trở tương đương của đoạn mạch giảm', 'Cường độ dòng điện mạch chính tăng', 'Công suất tiêu thụ của cả đoạn mạch tăng', 'Hiệu điện thế trên các nhánh giảm'],
    a: [0, 1, 2],
    e: 'Mắc song song làm R_tđ giảm nên I = U/R_tđ tăng, P = U·I tăng. Hiệu điện thế mỗi nhánh (với nguồn lý tưởng) không đổi — chỉ giảm khi nguồn có điện trở trong.'
  },
  {
    t: 5, type: 'multi', q: 'Cầu chì trong mạch điện gia đình có tác dụng nào?',
    o: ['Ngắt mạch khi dòng điện tăng quá mức', 'Bảo vệ thiết bị khỏi cháy do quá tải', 'Tự động đóng lại sau khi mất điện', 'Thay thế được aptomat trong mọi trường hợp'],
    a: [0, 1],
    e: 'Cầu chì dựa trên tác dụng nhiệt: dây chì nóng chảy khi quá tải. Nó không tự đóng lại và không thay thế hoàn toàn aptomat.'
  },
  {
    t: 4, type: 'multi', q: 'Vật đặt ngoài tiêu cự của thấu kính hội tụ. Ảnh có tính chất nào?',
    o: ['Ảnh thật', 'Ngược chiều với vật', 'Hứng được trên màn', 'Luôn nhỏ hơn vật'],
    a: [0, 1, 2],
    e: 'Khi f < d < 2f thì ảnh thật, ngược chiều và lớn hơn vật — nên "luôn nhỏ hơn vật" là sai.'
  },
  {
    t: 2, type: 'multi', q: 'Một vật nhúng trong chất lỏng nổi lên mặt thoáng khi:',
    o: ['Trọng lượng riêng của vật nhỏ hơn của chất lỏng', 'P < F_A tại thời điểm thả chìm hoàn toàn', 'Khối lượng riêng của vật nhỏ hơn của chất lỏng', 'Thể tích vật lớn hơn thể tích chất lỏng'],
    a: [0, 1, 2],
    e: 'd_vật < d_lỏng (tương đương D_vật < D_lỏng) cho F_A > P khi chìm hoàn toàn, vật nổi lên và chỉ chìm một phần.'
  },

  /* ---------------- tf: điện + quang (4) ---------------- */
  {
    t: 5, type: 'tf', q: 'Trong đoạn mạch song song, hiệu điện thế hai đầu mỗi nhánh bằng nhau và bằng hiệu điện thế hai đầu đoạn mạch.',
    a: true,
    e: 'Đúng — đây là tính chất cơ bản của mạch song song.'
  },
  {
    t: 5, type: 'tf', q: 'Điện trở tương đương của đoạn mạch song song luôn lớn hơn mỗi điện trở thành phần.',
    a: false,
    e: 'Sai — R_tđ song song luôn nhỏ hơn điện trở nhỏ nhất trong các nhánh.'
  },
  {
    t: 4, type: 'tf', q: 'Thấu kính phân kì luôn cho ảnh ảo, cùng chiều và nhỏ hơn vật, với mọi vị trí đặt vật.',
    a: true,
    e: 'Đúng — ảnh ảo nằm trong khoảng tiêu cự, cùng phía với vật.'
  },
  {
    t: 6, type: 'tf', q: 'Máy biến áp có thể làm việc với dòng điện một chiều không đổi để liên tục đổi hiệu điện thế.',
    a: false,
    e: 'Sai — máy biến áp dựa trên hiện tượng cảm ứng điện từ, chỉ đổi được hiệu điện thế xoay chiều.'
  }
];

QUIZ.push(...QUIZ_EXTRA3);
