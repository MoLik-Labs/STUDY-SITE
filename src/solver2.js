/* =========================================================
   SOLVER — phần mở rộng: 9 dạng mới, trong đó 3 dạng thuần
   thực nghiệm (đo D bằng lực kế, Bessel, đo R bằng vôn–ampe).
   ========================================================= */

/* ---------- 19. Đèn sáng bình thường + biến trở + nguồn có r ---------- */
S.el_lamp = {
  cat: 'el', name: 'Đèn sáng bình thường — tìm biến trở', tag: 'Đèn + biến trở + nguồn có r',
  desc: 'Nhập nguồn (E, r) và số ghi trên đèn — máy tính dòng định mức, điện trở đèn, biến trở cần mắc và công suất tiêu hao.',
  fields: [
    { k: 'E', l: 'Suất điện động', u: 'V', v: 12 },
    { k: 'r', l: 'Điện trở trong', u: 'Ω', v: 1 },
    { k: 'Ud', l: 'Hiệu điện thế định mức của đèn', u: 'V', v: 6 },
    { k: 'Pd', l: 'Công suất định mức của đèn', u: 'W', v: 3 }
  ],
  run(v) {
    const E = +v.E, r = +v.r, Ud = +v.Ud, Pd = +v.Pd;
    const Id = Pd / Ud, Rd = Ud * Ud / Pd;
    const Ur = Id * r;
    const Ub = E - Ud - Ur;
    const Rb = Ub / Id;
    const Pb = Id * Id * Rb;
    const eff = (Ud * Id) / (E * Id) * 100;
    const out = [
      { l: 'Dòng định mức', v: Id, u: 'A' },
      { l: 'Điện trở đèn', v: Rd, u: 'Ω' },
      { l: 'Sụt áp trên r', v: Ur, u: 'V' },
      { l: 'Biến trở cần mắc', v: Rb, u: 'Ω' },
      { l: 'Công suất trên biến trở', v: Pb, u: 'W' },
      { l: 'Công suất nguồn', v: E * Id, u: 'W' },
      { l: 'Hiệu suất (phần đèn dùng)', v: eff, u: '%' }
    ];
    const steps = [
      { h: 'Bước 1 · Dòng và điện trở định mức', f: 'I_đm = P/U ; R_đ = U²/P', c: `I = ${f2(Pd)}/${f2(Ud)} = ${f3(Id)} A · R = ${f2(Ud)}²/${f2(Pd)} = ${f2(Rd)} Ω` },
      { h: 'Bước 2 · Sụt áp trên điện trở trong', f: 'U_r = I·r', c: `U_r = ${f3(Id)} · ${f2(r)} = ${f3(Ur)} V` },
      { h: 'Bước 3 · Định luật Ôm cho toàn mạch', f: 'E = U_đ + U_b + U_r', c: `U_b = ${f2(E)} − ${f2(Ud)} − ${f3(Ur)} = ${f3(Ub)} V` },
      { h: 'Bước 4 · Biến trở và công suất tiêu hao', f: 'R_b = U_b/I ; P_b = I²R_b', c: `R_b = ${f3(Ub)}/${f3(Id)} = ${f2(Rb)} Ω · P_b = ${f3(Id)}²·${f2(Rb)} = ${f2(Pb)} W` },
      { h: 'Bước 5 · Kiểm tra', f: 'P_nguồn = P_đ + P_b + P_r', c: `${f2(E * Id)} W = ${f2(Ud * Id)} + ${f2(Pb)} + ${f2(Id * Id * r)} — khớp.` }
    ];
    if (Ub <= 0) steps.push({ h: 'Lưu ý', f: 'U_b ≤ 0', c: 'Nguồn không đủ áp cho đèn sáng bình thường — phải tăng E hoặc giảm r/đổi đèn.' });
    /* Hình vẽ: đèn (R_đ) nối tiếp biến trở (R_b), nguồn E có điện trở trong r.
       Truyền đúng tên trường mà svgCircuit đọc (U/R1/R2/r) — trước đây chỉ
       truyền topology nên hình in ra "U = undefined V". */
    return { out, steps, draw: { type: 'circuit', topology: 'ser',
      U: E, r: r, R1: +Rd.toFixed(2), R2: +Rb.toFixed(2) } };
  }
};

/* ---------- 20. Điện trở dây dẫn theo ρ, l, S ---------- */
S.el_rho = {
  cat: 'el', name: 'Điện trở dây dẫn theo vật liệu', tag: 'R = ρ·l/S',
  desc: 'Nhập điện trở suất, chiều dài, tiết diện — ra điện trở; kèm phần so sánh khi kéo dài dây (thể tích không đổi).',
  fields: [
    { k: 'rho', l: 'Điện trở suất ρ', u: 'Ω·m', v: 1.7e-8 },
    { k: 'l', l: 'Chiều dài', u: 'm', v: 100 },
    { k: 'S', l: 'Tiết diện', u: 'mm²', v: 0.5 },
    { k: 'U', l: 'Hiệu điện thế đặt vào', u: 'V', v: 220 }
  ],
  run(v) {
    const S1 = +v.S * 1e-6, R = +v.rho * +v.l / S1, I = +v.U / R, P = +v.U * I;
    return {
      out: [
        { l: 'Điện trở dây', v: R, u: 'Ω' },
        { l: 'Dòng điện', v: I, u: 'A' },
        { l: 'Công suất toả nhiệt', v: P, u: 'W' },
        { l: 'Nhiệt trong 1 giờ', v: P * 3600 / 1000, u: 'kJ' }
      ],
      steps: [
        { h: 'Bước 1 · Đổi tiết diện', f: '1 mm² = 10⁻⁶ m²', c: `S = ${v.S} mm² = ${(+v.S).toExponential(2)} m²` },
        { h: 'Bước 2 · Công thức', f: 'R = ρ·l/S', c: `R = ${(+v.rho).toExponential(2)} × ${v.l} / ${S1.toExponential(2)} = ${f2(R)} Ω` },
        { h: 'Bước 3 · Dòng và công suất', f: 'I = U/R ; P = U·I', c: `I = ${f2(+v.U)}/${f2(R)} = ${f3(I)} A · P = ${f2(P)} W` },
        { h: 'Bước 4 · Nhận xét', f: 'R ~ l ; R ~ 1/S', c: 'Kéo dây dài gấp đôi mà tiết diện giảm một nửa (thể tích không đổi) thì điện trở tăng 4 lần.' }
      ]
    };
  }
};

/* ---------- 21. Công suất cực đại trên biến trở ---------- */
S.el_max = {
  cat: 'el', name: 'Công suất trên biến trở cực đại', tag: 'P_max = E²/4r khi R = r',
  desc: 'Nhập suất điện động và điện trở trong — máy tìm giá trị biến trở cho công suất lớn nhất, kèm hiệu suất.',
  fields: [{ k: 'E', l: 'Suất điện động', u: 'V', v: 12 }, { k: 'r', l: 'Điện trở trong', u: 'Ω', v: 2 }],
  run(v) {
    const E = +v.E, r = +v.r;
    const Pmax = E * E / (4 * r), R = r, I = E / (2 * r), U = E / 2;
    const rows = [0.5, 1, 2, 3, 5].map(k => {
      const RR = r * k, II = E / (RR + r), PP = II * II * RR;
      return { l: `R = ${f2(RR)} Ω ⇒ P`, v: PP, u: 'W' };
    });
    return {
      out: [{ l: 'Biến trở để P max', v: R, u: 'Ω' }, { l: 'Công suất cực đại', v: Pmax, u: 'W' }, { l: 'Dòng khi đó', v: I, u: 'A' }, { l: 'U hai đầu biến trở', v: U, u: 'V' }, { l: 'Hiệu suất nguồn', v: 50, u: '%' }],
      steps: [
        { h: 'Bước 1 · Viết công suất theo R', f: 'P = E²R/(R+r)²', c: 'Chia cả tử và mẫu cho R được P = E²/(R + 2r + r²/R).' },
        { h: 'Bước 2 · Cực trị', f: 'R + r²/R ≥ 2r', c: 'Theo bất đẳng thức Cauchy, mẫu nhỏ nhất khi R = r.' },
        { h: 'Bước 3 · Giá trị cực đại', f: 'P_max = E²/(4r)', c: `P_max = ${f2(E)}²/(4·${f2(r)}) = ${f2(Pmax)} W` },
        { h: 'Bước 4 · Bảng kiểm tra', f: 'P tại vài giá trị R', c: rows.map(x => `${x.l} = ${f2(x.v)} W`).join(' · ') },
        { h: 'Bước 5 · Nhận xét', f: 'Hiệu suất chỉ 50%', c: 'Công suất ra lớn nhất nhưng một nửa năng lượng rơi trên điện trở trong — thực tế người ta chọn R ≫ r.' }
      ]
    };
  }
};

/* ---------- 22. Mạch cầu dây — tìm vị trí con chạy ---------- */
S.el_cauday = {
  cat: 'el', name: 'Mạch cầu dây — vị trí cân bằng', tag: 'R₁/R₂ = l₁/l₂',
  desc: 'Mạch cầu dây (biến trở con chạy trên dây đồng chất). Nhập điện trở hai nhánh và chiều dài dây — ra vị trí con chạy khi cầu cân bằng.',
  fields: [
    { k: 'R1', l: 'Điện trở nhánh trái R₁', u: 'Ω', v: 6 },
    { k: 'R2', l: 'Điện trở nhánh phải R₂', u: 'Ω', v: 4 },
    { k: 'L', l: 'Chiều dài toàn dây', u: 'cm', v: 100 }
  ],
  run(v) {
    const R1 = +v.R1, R2 = +v.R2, L = +v.L;
    const l1 = L * R1 / (R1 + R2), l2 = L - l1;
    return {
      out: [
        { l: 'Chiều dài đoạn trái l₁', v: l1, u: 'cm' },
        { l: 'Chiều dài đoạn phải l₂', v: l2, u: 'cm' },
        { l: 'Tỉ số l₁/l₂', v: l1 / l2, u: '' },
        { l: 'Kiểm tra R₁/R₂', v: R1 / R2, u: '' }
      ],
      steps: [
        { h: 'Bước 1 · Điều kiện cầu cân bằng', f: 'R₁/R₂ = l₁/l₂', c: 'Dây đồng chất tiết diện đều nên điện trở tỉ lệ với chiều dài.' },
        { h: 'Bước 2 · Dùng l₁ + l₂ = L', f: 'l₁ = L·R₁/(R₁+R₂)', c: `l₁ = ${f2(L)}·${f2(R1)}/(${f2(R1)}+${f2(R2)}) = ${f2(l1)} cm` },
        { h: 'Bước 3 · Đoạn còn lại', f: 'l₂ = L − l₁', c: `l₂ = ${f2(L)} − ${f2(l1)} = ${f2(l2)} cm` },
        { h: 'Bước 4 · Ứng dụng', f: 'Đo điện trở chưa biết', c: 'Biết R₁ và tỉ số hai đoạn dây suy ra R₂ — đây là nguyên lý cầu Wheatstone dạng dây, hay gặp trong đề thực nghiệm.' }
      ]
    };
  }
};

/* ---------- 23. Thực nghiệm: đo khối lượng riêng bằng lực kế ---------- */
S.tn_arch = {
  cat: 'co', name: 'Thực nghiệm · đo D bằng lực kế', tag: 'P trong không khí − F trong nước',
  desc: 'Treo vật vào lực kế, đọc số chỉ ngoài không khí và khi ngập hoàn toàn trong chất lỏng — máy ra thể tích, khối lượng, khối lượng riêng và sai số tương đối.',
  fields: [
    { k: 'P', l: 'Số chỉ lực kế ngoài không khí', u: 'N', v: 5.4 },
    { k: 'F', l: 'Số chỉ khi ngập hoàn toàn', u: 'N', v: 3.24 },
    { k: 'd', l: 'Trọng lượng riêng chất lỏng', u: 'N/m³', v: 10000 }
  ],
  run(v) {
    const P = +v.P, F = +v.F, d = +v.d;
    const FA = P - F, V = FA / d, m = P / 10, D = m / V;
    const dP = 0.05, dF = 0.05, relD = (dP + dF) / FA * 100;
    return {
      out: [
        { l: 'Lực đẩy Archimedes', v: FA, u: 'N' },
        { l: 'Thể tích vật', v: V * 1e6, u: 'cm³' },
        { l: 'Khối lượng', v: m, u: 'kg' },
        { l: 'Khối lượng riêng', v: D, u: 'kg/m³' },
        { l: 'Sai số tương đối (ΔF = 0,05 N)', v: relD, u: '%' }
      ],
      steps: [
        { h: 'Bước 1 · Lực đẩy Archimedes', f: 'F_A = P − F', c: `F_A = ${f2(P)} − ${f2(F)} = ${f3(FA)} N` },
        { h: 'Bước 2 · Thể tích vật', f: 'V = F_A/d', c: `V = ${f3(FA)}/${f2(d)} = ${(V).toExponential(2)} m³ = ${f2(V * 1e6)} cm³` },
        { h: 'Bước 3 · Khối lượng', f: 'm = P/g (g = 10)', c: `m = ${f2(P)}/10 = ${f3(m)} kg` },
        { h: 'Bước 4 · Khối lượng riêng', f: 'D = m/V', c: `D = ${f3(m)}/${V.toExponential(2)} = ${f2(D)} kg/m³` },
        { h: 'Bước 5 · Sai số', f: 'ΔD/D ≈ (ΔP + ΔF)/F_A', c: `(${dP} + ${dF})/${f3(FA)} ≈ ${f2(relD, 1)}% — vật càng nhẹ, F_A càng nhỏ, sai số càng lớn.` },
        { h: 'Bước 6 · Nhận xét', f: 'So với bảng khối lượng riêng', c: 'Đối chiếu kết quả với bảng để đoán kim loại; nếu lệch nhiều, kiểm tra vật có lỗ rỗng hoặc chưa ngập hết.' }
      ]
    };
  }
};

/* ---------- 24. Thực nghiệm: đo tiêu cự bằng phương pháp Bessel ---------- */
S.tn_bessel = {
  cat: 'quang', name: 'Thực nghiệm · tiêu cự theo Bessel', tag: 'f = (L² − Δ²)/4L',
  desc: 'Giữ vật và màn cố định cách nhau L, dịch thấu kính thấy hai vị trí cho ảnh rõ cách nhau Δ — suy ra tiêu cự mà không cần đo d, d′.',
  fields: [
    { k: 'L', l: 'Khoảng cách vật – màn', u: 'cm', v: 90 },
    { k: 'D', l: 'Khoảng cách hai vị trí thấu kính', u: 'cm', v: 30 }
  ],
  run(v) {
    const L = +v.L, D = +v.D;
    const f = (L * L - D * D) / (4 * L);
    const okv = D * D < L * L;
    const d1 = (L - D) / 2, d2 = (L + D) / 2;
    return {
      out: [
        { l: 'Tiêu cự f', v: f, u: 'cm' },
        { l: 'Vị trí 1: d = d′', v: d1, u: 'cm' },
        { l: 'Vị trí 2', v: d2, u: 'cm' },
        { l: 'Độ phóng đại ở vị trí 2', v: d1 / d2, u: '×' }
      ],
      steps: [
        { h: 'Bước 1 · Điều kiện có hai vị trí', f: 'L > 4f', c: okv ? 'Với số liệu này L² > Δ² nên có nghiệm hợp lệ.' : 'Số liệu không hợp lệ: phải có Δ < L.' },
        { h: 'Bước 2 · Lập phương trình', f: '1/f = 1/d + 1/(L−d)', c: 'Rút gọn thành d² − Ld + Lf = 0, hai nghiệm là hai vị trí thấu kính.' },
        { h: 'Bước 3 · Hiệu hai nghiệm', f: 'Δ = √(L² − 4Lf)', c: `Δ² = L² − 4Lf ⇒ f = (L² − Δ²)/(4L)` },
        { h: 'Bước 4 · Thay số', f: 'f = (L² − Δ²)/(4L)', c: `f = (${f2(L)}² − ${f2(D)}²)/(4·${f2(L)}) = (${f2(L * L)} − ${f2(D * D)})/${f2(4 * L)} = ${f2(f)} cm` },
        { h: 'Bước 5 · Vị trí thấu kính', f: 'd = (L ∓ Δ)/2', c: `d₁ = ${f2(d1)} cm · d₂ = ${f2(d2)} cm — đo lại bằng thước để kiểm tra.` }
      ],
      draw: { type: 'lens', f, d: d1, h: 4, kind: 'converging' }
    };
  }
};

/* ---------- 25. Ảnh ảo cao gấp k lần, cách vật ℓ ---------- */
S.quang_ao = {
  cat: 'quang', name: 'Ảnh ảo: biết độ phóng đại và khoảng cách', tag: 'Tìm d, d′, f',
  desc: 'Vật trong tiêu cự cho ảnh ảo cùng chiều. Nhập độ phóng đại k và khoảng cách vật–ảnh — máy tìm d, d′, f.',
  fields: [
    { k: 'k', l: 'Ảnh cao gấp k lần vật', u: '×', v: 3 },
    { k: 'l', l: 'Khoảng cách vật – ảnh', u: 'cm', v: 20 }
  ],
  run(v) {
    const k = +v.k, l = +v.l;
    const d = l / (k - 1), dp = -k * d;
    const f = 1 / (1 / d + 1 / dp);
    return {
      out: [
        { l: 'Khoảng cách vật d', v: d, u: 'cm' },
        { l: 'Ảnh ảo cách kính', v: -dp, u: 'cm' },
        { l: 'Tiêu cự f', v: f, u: 'cm' },
        { l: 'Kiểm tra d < f', v: d < f ? 1 : 0, text: true, vv: d < f ? 'đúng' : 'sai' }
      ].map(o => o.text ? { l: o.l, v: o.vv, text: true } : o),
      steps: [
        { h: 'Bước 1 · Quan hệ độ phóng đại', f: 'ảnh ảo: d′ = −k·d', c: `|d′| = ${f2(k)}d` },
        { h: 'Bước 2 · Khoảng cách vật – ảnh', f: '|d′| − d = ℓ', c: `${f2(k)}d − d = ${f2(l)} ⇒ d = ${f2(d)} cm` },
        { h: 'Bước 3 · Vị trí ảnh', f: 'd′ = −k·d', c: `d′ = −${f2(k)}·${f2(d)} = ${f2(dp)} cm (cùng phía vật)` },
        { h: 'Bước 4 · Tiêu cự', f: '1/f = 1/d + 1/d′', c: `1/f = 1/${f2(d)} − 1/${f2(-dp)} = 1/${f2(f)} ⇒ f = ${f2(f)} cm` },
        { h: 'Bước 5 · Kiểm tra điều kiện', f: 'd < f', c: `${f2(d)} < ${f2(f)} — đúng, nên ảnh là ảnh ảo cùng chiều.` }
      ],
      draw: { type: 'lens', f, d, h: 4, kind: 'converging' }
    };
  }
};

/* ---------- 26. Bếp / hiệu suất: thời gian hoặc nhiên liệu ---------- */
S.nhiet_hieusuat = {
  cat: 'nhiet', name: 'Hiệu suất bếp — thời gian & nhiên liệu', tag: 'H = Q_ci/Q_tp',
  desc: 'Đun m kg nước từ t₁ lên t₂ bằng bếp có công suất P và hiệu suất H — ra nhiệt lượng, thời gian đun và lượng nhiên liệu.',
  fields: [
    { k: 'm', l: 'Khối lượng nước', u: 'kg', v: 2 },
    { k: 't1', l: 'Nhiệt độ đầu', u: '°C', v: 20 },
    { k: 't2', l: 'Nhiệt độ cuối', u: '°C', v: 100 },
    { k: 'c', l: 'Nhiệt dung riêng', u: 'J/kg·K', v: 4200 },
    { k: 'P', l: 'Công suất bếp', u: 'W', v: 1000 },
    { k: 'H', l: 'Hiệu suất bếp', u: '%', v: 80 },
    { k: 'q', l: 'Năng suất toả nhiệt của nhiên liệu', u: 'J/kg', v: 44000000 }
  ],
  run(v) {
    const m = +v.m, c = +v.c, dt = (+v.t2) - (+v.t1), P = +v.P, H = (+v.H) / 100, q = +v.q;
    const Qci = m * c * dt, Qtp = Qci / H, t = Qtp / P, mfuel = Qtp / q;
    return {
      out: [
        { l: 'Nhiệt lượng có ích', v: Qci / 1000, u: 'kJ' },
        { l: 'Nhiệt lượng phải cấp', v: Qtp / 1000, u: 'kJ' },
        { l: 'Thời gian đun', v: t, u: 's' },
        { l: 'Thời gian (phút)', v: t / 60, u: 'phút' },
        { l: 'Nhiên liệu cần đốt', v: mfuel * 1000, u: 'g' },
        { l: 'Nhiệt hao phí', v: (Qtp - Qci) / 1000, u: 'kJ' }
      ],
      steps: [
        { h: 'Bước 1 · Nhiệt lượng có ích', f: 'Q_ci = mcΔt', c: `Q_ci = ${f2(m)}·${f2(c)}·${f2(dt)} = ${f2(Qci)} J` },
        { h: 'Bước 2 · Hiệu suất', f: 'H = Q_ci/Q_tp ⇒ Q_tp = Q_ci/H', c: `Q_tp = ${f2(Qci)}/${f2(H)} = ${f2(Qtp)} J` },
        { h: 'Bước 3 · Thời gian đun', f: 'Q_tp = P·t', c: `t = ${f2(Qtp)}/${f2(P)} = ${f2(t)} s = ${f2(t / 60)} phút` },
        { h: 'Bước 4 · Nếu đốt nhiên liệu', f: 'Q_tp = q·m_nl', c: `m_nl = ${f2(Qtp)}/${q.toExponential(2)} = ${f2(mfuel * 1000)} g` },
        { h: 'Bước 5 · Nhận xét', f: 'Phần hao phí', c: `Hao phí ${f2((1 - H) * 100)}% — giảm bằng nắp kín, bếp có thành dày, đun lượng nước vừa đủ.` }
      ]
    };
  }
};

/* ---------- 27. Rơi tự do / bảo toàn cơ năng ---------- */
S.co_share = {
  cat: 'co', name: 'Rơi tự do & bảo toàn cơ năng', tag: 'v = √(2gh) · W = mgh',
  desc: 'Nhập khối lượng và độ cao — ra thế năng, vận tốc chạm đất, thời gian rơi, và vận tốc ở độ cao bất kỳ.',
  fields: [
    { k: 'm', l: 'Khối lượng', u: 'kg', v: 2 },
    { k: 'h', l: 'Độ cao ban đầu', u: 'm', v: 5 },
    { k: 'g', l: 'Gia tốc trọng trường', u: 'm/s²', v: 10 },
    { k: 'h2', l: 'Độ cao cần tính vận tốc', u: 'm', v: 2 }
  ],
  run(v) {
    const m = +v.m, h = +v.h, g = +v.g, h2 = Math.min(+v.h2, +v.h);
    const W = m * g * h, vg = Math.sqrt(2 * g * h), t = Math.sqrt(2 * h / g);
    const v2 = Math.sqrt(2 * g * (h - h2));
    const Wt2 = m * g * h2, Wd2 = 0.5 * m * v2 * v2;
    return {
      out: [
        { l: 'Thế năng ban đầu', v: W, u: 'J' },
        { l: 'Vận tốc chạm đất', v: vg, u: 'm/s' },
        { l: 'Thời gian rơi', v: t, u: 's' },
        { l: `Vận tốc ở độ cao ${f2(h2)} m`, v: v2, u: 'm/s' },
        { l: 'Động năng tại đó', v: Wd2, u: 'J' },
        { l: 'Thế năng tại đó', v: Wt2, u: 'J' }
      ],
      steps: [
        { h: 'Bước 1 · Cơ năng ban đầu', f: 'W₁ = mgh', c: `W₁ = ${f2(m)}·${f2(g)}·${f2(h)} = ${f2(W)} J` },
        { h: 'Bước 2 · Chạm đất', f: 'mgh = ½mv²', c: `v = √(2gh) = √(2·${f2(g)}·${f2(h)}) = ${f2(vg)} m/s` },
        { h: 'Bước 3 · Thời gian rơi', f: 'h = ½gt²', c: `t = √(2h/g) = ${f2(t)} s` },
        { h: 'Bước 4 · Ở độ cao h₂', f: 'mgh = mgh₂ + ½mv₂²', c: `v₂ = √(2g(h−h₂)) = ${f2(v2)} m/s` },
        { h: 'Bước 5 · Kiểm tra bảo toàn', f: 'W_đ + W_t = W', c: `${f2(Wd2)} + ${f2(Wt2)} = ${f2(W)} J — khớp với cơ năng ban đầu.` }
      ]
    };
  }
};

/* ---------- 28. Cộng vận tốc: thuyền – dòng nước ---------- */
S.co_dongnuoc = {
  cat: 'co', name: 'Thuyền xuôi – ngược dòng', tag: 'v_xuôi = v + b',
  desc: 'Nhập vận tốc thuyền khi nước lặng, vận tốc dòng và quãng đường — ra thời gian xuôi, ngược và vận tốc trung bình cả đi lẫn về.',
  fields: [
    { k: 'v', l: 'Vận tốc thuyền khi nước lặng', u: 'km/h', v: 12 },
    { k: 'b', l: 'Vận tốc dòng nước', u: 'km/h', v: 3 },
    { k: 's', l: 'Quãng đường một chiều', u: 'km', v: 30 }
  ],
  run(v) {
    const vv = +v.v, b = +v.b, s = +v.s;
    const vx = vv + b, vn = vv - b;
    const tx = s / vx, tn = s / vn, vt = 2 * s / (tx + tn);
    return {
      out: [
        { l: 'Vận tốc xuôi dòng', v: vx, u: 'km/h' },
        { l: 'Vận tốc ngược dòng', v: vn, u: 'km/h' },
        { l: 'Thời gian xuôi', v: tx, u: 'giờ' },
        { l: 'Thời gian ngược', v: tn, u: 'giờ' },
        { l: 'Vận tốc trung bình cả đi và về', v: vt, u: 'km/h' }
      ],
      steps: [
        { h: 'Bước 1 · Xuôi dòng', f: 'v_xuôi = v + b', c: `${f2(vv)} + ${f2(b)} = ${f2(vx)} km/h` },
        { h: 'Bước 2 · Ngược dòng', f: 'v_ngược = v − b', c: `${f2(vv)} − ${f2(b)} = ${f2(vn)} km/h` },
        { h: 'Bước 3 · Thời gian', f: 't = s/v', c: `xuôi ${f2(tx)} h · ngược ${f2(tn)} h` },
        { h: 'Bước 4 · Vận tốc trung bình', f: 'v_tb = 2s/(t₁+t₂)', c: `v_tb = ${f2(vt)} km/h, không phải ${f2(vv)} km/h.` },
        { h: 'Bước 5 · Nhận xét', f: 'Nước càng chảy mạnh', c: 'Thời gian ngược tăng nhanh hơn mức thời gian xuôi giảm, nên tổng thời gian luôn tăng.' }
      ]
    };
  }
};
