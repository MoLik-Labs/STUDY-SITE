/* =========================================================
   GÓC VẬT LÍ  #/special
   ---------------------------------------------------------
   The one page that only makes sense for physics. Four tools:

   1. READ THE PROBLEM — paste a Vietnamese physics problem and the
      engine pulls the numbers out and names the law that fits.
      This is not an AI call; it is a pattern matcher over the
      quantity units a Vietnamese textbook actually uses
      (Ω, V, A, W, J, N, m/s, kg/m³, °C, cal…). Everything runs
      locally, so it works offline and costs nothing.

   2. CONSTANTS + UNITS — the numbers you look up mid-exercise,
      with the SI prefix table, because half of all lost marks in
      physics are unit slips, not physics slips.

   3. SENSE CHECK — order-of-magnitude sanity: is 3000 A through a
      resistor physical? Students memorize formulas but forget that
      answers must be plausible.

   4. MEMORY PALACE — a deliberately tiny spaced-repetition ladder
      for the 12 formula clusters, using the same Leitner boxes as
      the flashcard system, so physics facts survive the exam.
   ========================================================= */

/* ---------- 1. quantity extraction ---------- */
/* Each unit knows: the quantity it measures, its SI factor, and the
   symbols a student might type. Order matters: longer first. */
const SP_UNITS = [
  { u: 'kΩ', q: 'R', f: 1e3 }, { u: 'MΩ', q: 'R', f: 1e6 }, { u: 'Ω', q: 'R', f: 1 },
  { u: 'mV', q: 'U', f: 1e-3 }, { u: 'kV', q: 'U', f: 1e3 }, { u: 'V', q: 'U', f: 1 },
  { u: 'mA', q: 'I', f: 1e-3 }, { u: 'A', q: 'I', f: 1 },
  { u: 'kW', q: 'P', f: 1e3 }, { u: 'W', q: 'P', f: 1 },
  { u: 'kJ', q: 'A', f: 1e3 }, { u: 'J', q: 'A', f: 1 },
  { u: 'km/h', q: 'v', f: 1 / 3.6 }, { u: 'm/s', q: 'v', f: 1 }, { u: 'km', q: 's', f: 1e3 },
  { u: 'cm³', q: 'V', f: 1e-6 }, { u: 'm³', q: 'V', f: 1 }, { u: 'lít', q: 'V', f: 1e-3 },
  { u: 'g/cm³', q: 'D', f: 1e3 }, { u: 'kg/m³', q: 'D', f: 1 },
  { u: 'g', q: 'm', f: 1e-3 }, { u: 'kg', q: 'm', f: 1 },
  { u: 'm', q: 's', f: 1 }, { u: 'cm', q: 's', f: 1e-2 }, { u: 'mm', q: 's', f: 1e-3 },
  { u: 'N', q: 'F', f: 1 }, { u: '°C', q: 't', f: 1 }, { u: 'cal', q: 'Q', f: 4.18 },
  { u: 'phút', q: 't', f: 60 }, { u: 'giây', q: 't', f: 1 }, { u: 'giờ', q: 't', f: 3600 },
  { u: 'Hz', q: 'f', f: 1 }, { u: 'nm', q: 'λ', f: 1e-9 }, { u: 'K', q: 'T', f: 1 },
];

const SP_QNAME = {
  R: 'điện trở', U: 'hiệu điện thế', I: 'cường độ dòng điện', P: 'công suất',
  A: 'công / năng lượng', v: 'vận tốc', s: 'quãng đường / độ dài', V: 'thể tích',
  D: 'khối lượng riêng', m: 'khối lượng', F: 'lực', t: 'nhiệt độ / thời gian',
  Q: 'nhiệt lượng', f: 'tần số', λ: 'bước sóng', T: 'nhiệt độ tuyệt đối',
};

/* Pull "12 Ω", "0,5 A", "1,2 kΩ" out of free text. */
function spParse(text) {
  const out = [];
  const src = String(text || '').replace(/\u00a0/g, ' ');
  /* number, optional space, unit word — longest unit first so kΩ beats Ω */
  const units = SP_UNITS.slice().sort((a, b) => b.u.length - a.u.length);
  units.forEach(({ u, q, f }) => {
    const re = new RegExp('(-?\\d+(?:[.,]\\d+)?)\\s*' + u.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&') +
      '(?![a-zA-ZÀ-ỹ])', 'g');
    let m;
    while ((m = re.exec(src))) {
      const raw = m[1].replace(',', '.');
      const val = parseFloat(raw);
      if (!isFinite(val)) continue;
      /* skip if this match is inside a longer unit already taken */
      if (out.some(o => o.start === m.index && o.unit.length > u.length)) continue;
      out.push({
        start: m.index, end: m.index + m[0].length,
        val, unit: u, qty: q, si: val * f, raw: m[0].trim(),
      });
    }
  });
  /* de-duplicate overlapping hits, keep the longest unit */
  out.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
  const keep = [];
  let lastEnd = -1;
  out.forEach(o => {
    if (o.start < lastEnd) return;
    keep.push(o);
    lastEnd = o.end;
  });
  return keep;
}

/* Which law fits these quantities? Ranked, with the reason spelled out. */
const SP_LAWS = [
  {
    id: 'ohm', name: 'Định luật Ôm', f: 'I = U / R',
    needs: ['U', 'R'], solve: 'I',
    why: 'Có hiệu điện thế và điện trở → tìm được cường độ dòng điện.',
  },
  {
    id: 'power', name: 'Công suất điện', f: 'P = U × I = I²R = U²/R',
    needs: ['U', 'I'], solve: 'P',
    why: 'Có U và I → công suất (hoặc ngược lại, tìm U khi biết P và I).',
  },
  {
    id: 'joule', name: 'Định luật Jun–Len-xơ', f: 'Q = I² R t',
    needs: ['I', 'R'], solve: 'Q',
    why: 'Có dòng điện, điện trở và thời gian → nhiệt lượng toả ra.',
  },
  {
    id: 'work', name: 'Công cơ học', f: 'A = F × s',
    needs: ['F', 's'], solve: 'A',
    why: 'Có lực và quãng đường → công thực hiện.',
  },
  {
    id: 'speed', name: 'Vận tốc', f: 'v = s / t',
    needs: ['s', 'v'], solve: 't',
    why: 'Có quãng đường và vận tốc → thời gian đi hết quãng đường.',
  },
  {
    id: 'density', name: 'Khối lượng riêng', f: 'D = m / V',
    needs: ['m', 'V'], solve: 'D',
    why: 'Có khối lượng và thể tích → khối lượng riêng.',
  },
  {
    id: 'heat', name: 'Phương trình cân bằng nhiệt', f: 'Q = m c Δt',
    needs: ['m', 't'], solve: 'Q',
    why: 'Có khối lượng và nhiệt độ → nhiệt lượng (cần thêm nhiệt dung riêng c).',
  },
];

function spSolve(text) {
  const qty = spParse(text);
  const have = {};
  qty.forEach(q => { if (!have[q.qty]) have[q.qty] = q; });
  const keys = Object.keys(have);

  const ranked = SP_LAWS.map(l => {
    const hit = l.needs.filter(n => have[n]).length;
    return { law: l, hit, full: hit === l.needs.length };
  }).filter(x => x.hit > 0).sort((a, b) => b.hit - a.hit);

  /* compute a numeric answer when the law is fully satisfied */
  let answer = null;
  const top = ranked.find(x => x.full);
  if (top) {
    const g = k => have[k] ? have[k].si : null;
    try {
      if (top.law.id === 'ohm') answer = { v: g('U') / g('R'), u: 'A', sym: 'I' };
      if (top.law.id === 'power') answer = { v: g('U') * g('I'), u: 'W', sym: 'P' };
      if (top.law.id === 'work') answer = { v: g('F') * g('s'), u: 'J', sym: 'A' };
      if (top.law.id === 'density') answer = { v: g('m') / g('V'), u: 'kg/m³', sym: 'D' };
      if (top.law.id === 'speed' && g('s') && g('v')) answer = { v: g('s') / g('v'), u: 's', sym: 't' };
    } catch (e) { answer = null; }
  }
  return { qty, have, ranked, answer, keys };
}

/* ---------- 2. constants ---------- */
const SP_CONST = [
  { s: 'c', n: 'Tốc độ ánh sáng', v: '3 × 10⁸', u: 'm/s' },
  { s: 'g', n: 'Gia tốc trọng trường', v: '9,8 (≈10)', u: 'm/s²' },
  { s: 'cₙ', n: 'Nhiệt dung riêng của nước', v: '4200', u: 'J/(kg·K)' },
  { s: 'cₙₕ', n: 'Nhiệt dung riêng của nhôm', v: '880', u: 'J/(kg·K)' },
  { s: 'Dₙ', n: 'Khối lượng riêng của nước', v: '1000', u: 'kg/m³' },
  { s: 'ρ', n: 'Điện trở suất của đồng', v: '1,7 × 10⁻⁸', u: 'Ω·m' },
  { s: 'p₀', n: 'Áp suất khí quyển', v: '1,013 × 10⁵', u: 'Pa' },
  { s: 'L', n: 'Nhiệt hoá hơi của nước', v: '2,26 × 10⁶', u: 'J/kg' },
];

const SP_PREFIX = [
  { p: 'k', n: 'kilo', f: '10³', e: 3 },
  { p: 'c', n: 'centi', f: '10⁻²', e: -2 },
  { p: 'm', n: 'mili', f: '10⁻³', e: -3 },
  { p: 'µ', n: 'micro', f: '10⁻⁶', e: -6 },
  { p: 'n', n: 'nano', f: '10⁻⁹', e: -9 },
  { p: 'M', n: 'mega', f: '10⁶', e: 6 },
];

/* ---------- 3. sense check ---------- */
/* Thresholds are deliberately generous — this is a "does this smell
   wrong" filter, not a grader. Every band cites a real textbook case. */
const SP_SENSE = [
  { q: 'I', min: 1e-6, max: 20, u: 'A', why: 'Mạch điện học ở lớp 9 thường dưới 5 A. Cỡ 1000 A là đoản mạch hoặc nhầm đơn vị.' },
  { q: 'U', min: 0.1, max: 1000, u: 'V', why: 'Nguồn pin/acquy trong phòng thí nghiệm 1,5–12 V; mạng điện 220 V.' },
  { q: 'R', min: 0.1, max: 1e6, u: 'Ω', why: 'Điện trở thường 1 Ω – 1 MΩ. Nhỏ hơn 0,1 Ω dễ là nhầm mili-ôhm.' },
  { q: 'P', min: 0.01, max: 3000, u: 'W', why: 'Bóng đèn 3–100 W; ấm điện ~1000 W. 10⁶ W là nhầm kW thành W.' },
  { q: 'v', min: 0.1, max: 100, u: 'm/s', why: 'Xe đạp ~5 m/s, xe máy ~15 m/s, âm thanh 340 m/s.' },
  { q: 'D', min: 100, max: 25000, u: 'kg/m³', why: 'Nước 1000, sắt 7800, chì 11300 kg/m³.' },
  { q: 'm', min: 1e-4, max: 100, u: 'kg', why: 'Dụng cụ thí nghiệm lớp 9 nặng gam đến vài kg.' },
];

function spSense(text) {
  return spParse(text).map(p => {
    const band = SP_SENSE.find(b => b.q === p.qty);
    if (!band) return null;
    const ok = p.si >= band.min && p.si <= band.max;
    return { ...p, ok, band, note: ok ? 'hợp lí' : 'đáng ngờ — ' + band.why };
  }).filter(Boolean);
}

/* ---------- 4. formula clusters for the memory ladder ---------- */
const SP_FORMULAS = [
  { id: 'f-ohm', q: 'I = ?', a: 'U / R', note: 'Định luật Ôm cho đoạn mạch' },
  { id: 'f-ohm2', q: 'R = ?', a: 'U / I', note: 'Từ định luật Ôm' },
  { id: 'f-ser', q: 'R tương đương, mắc nối tiếp?', a: 'R₁ + R₂ + …', note: 'Cùng dòng điện' },
  { id: 'f-par', q: 'R tương đương, mắc song song?', a: '1/R₁ + 1/R₂ + …', note: 'Cùng hiệu điện thế' },
  { id: 'f-p1', q: 'P = ? (theo U, I)', a: 'U × I', note: 'Công suất điện' },
  { id: 'f-p2', q: 'P = ? (theo I, R)', a: 'I² × R', note: 'Dạng toả nhiệt' },
  { id: 'f-p3', q: 'P = ? (theo U, R)', a: 'U² / R', note: 'Dạng dùng khi biết U' },
  { id: 'f-joule', q: 'Q = ? (Jun–Len-xơ)', a: 'I² R t', note: 'Nhiệt lượng toả ra' },
  { id: 'f-work', q: 'A = ? (công cơ học)', a: 'F × s', note: 'Lực cùng phương dịch chuyển' },
  { id: 'f-speed', q: 'v = ?', a: 's / t', note: 'Vận tốc trung bình' },
  { id: 'f-dens', q: 'D = ?', a: 'm / V', note: 'Khối lượng riêng' },
  { id: 'f-heat', q: 'Q = ? (nhiệt lượng)', a: 'm c Δt', note: 'Δt = t₂ − t₁' },
];

/* ---------- the page ---------- */
function renderSpecial() {
  const L = i18nLang();
  const en = L === 'en';

  /* formula ladder state lives in the study store so it shares the
     same Leitner boxes as the flashcard system */
  const S = studyState();
  S.specialBox = S.specialBox || {};

  $('#main').innerHTML = `<section class="wrap wide sy-page">
    ${pageHead(tl('special_title'),
    en ? 'only-here physics tools' : 'công cụ Vật lí chỉ có ở đây',
    en
      ? 'Paste a problem and the page reads the quantities out of it. Check whether an answer is even physically plausible. Look up constants. Drill the twelve formula clusters until they survive the exam.'
      : 'Dán một đề bài vào và trang tự đọc ra các đại lượng. Kiểm tra xem đáp án có hợp lí về mặt vật lí không. Tra hằng số. Luyện 12 cụm công thức tới khi nhớ được qua kì thi.')}

    <div class="sp-grid">

      <!-- 1. read the problem -->
      <section class="sp-card sp-wide">
        <div class="sp-h"><span class="kicker">01 · ${en ? 'Read the problem' : 'Đọc đề bài'}</span>
          <span class="sp-badge">${en ? 'runs offline' : 'chạy offline'}</span></div>
        <p class="sy-note">${en
      ? 'Paste a Vietnamese physics problem. Units are what make this work — Ω, V, A, W, J, N, m/s, kg/m³.'
      : 'Dán đề Vật lí tiếng Việt vào. Đơn vị chính là thứ làm được việc — Ω, V, A, W, J, N, m/s, kg/m³.'}</p>
        <textarea id="spIn" rows="4" placeholder="${en ? 'e.g. A resistor of 12 Ω is connected to 6 V. Find the current.' :
      'Ví dụ: Một điện trở 12 Ω mắc vào hiệu điện thế 6 V. Tính cường độ dòng điện.'}"></textarea>
        <div class="sy-btnrow">
          <button class="btn" id="spGo">${en ? 'Read it' : 'Đọc đề'}</button>
          <button class="btn ghost sm" id="spDemo">${en ? 'Try an example' : 'Thử ví dụ'}</button>
        </div>
        <div id="spOut" class="sp-out"></div>
      </section>

      <!-- 3. sense check -->
      <section class="sp-card">
        <div class="sp-h"><span class="kicker">02 · ${en ? 'Sense check' : 'Kiểm tra hợp lí'}</span></div>
        <p class="sy-note">${en
      ? 'Formulas do not warn you when an answer is absurd. This does: a 3000 A current through a lab resistor is not a physics result, it is a unit slip.'
      : 'Công thức không cảnh báo khi đáp án vô lí. Chỗ này thì có: dòng 3000 A qua một điện trở phòng thí nghiệm không phải kết quả vật lí, mà là nhầm đơn vị.'}</p>
        <div class="sp-sense-demo">
          ${spSense('I = 3000 A, U = 6 V, R = 12 Ω').map(r => `<div class="sp-sense-r ${r.ok ? 'ok' : 'no'}">
            <b>${r.raw}</b><span>${r.qty ? (SP_QNAME[r.qty] || r.qty) : ''}</span>
            <i>${r.note}</i></div>`).join('')}
        </div>
        <p class="sy-note">${en ? 'Paste your own numbers above to check them.' : 'Dán số của bạn ở ô trên để kiểm tra.'}</p>
      </section>

      <!-- 2. constants -->
      <section class="sp-card">
        <div class="sp-h"><span class="kicker">03 · ${en ? 'Constants' : 'Hằng số'}</span></div>
        <table class="sp-tab">
          <thead><tr><th>${en ? 'Symbol' : 'Kí hiệu'}</th><th>${en ? 'Value' : 'Giá trị'}</th><th>${en ? 'Unit' : 'Đơn vị'}</th></tr></thead>
          <tbody>${SP_CONST.map(c => `<tr><td><b>${c.s}</b> <span>${c.n}</span></td><td class="mono">${c.v}</td><td class="mono">${c.u}</td></tr>`).join('')}</tbody>
        </table>
        <div class="sp-h" style="margin-top:14px"><span class="kicker">${en ? 'SI prefixes' : 'Tiền tố SI'}</span></div>
        <div class="sp-prefix">${SP_PREFIX.map(p => `<span class="sp-pf"><b>${p.p}</b>${p.f}</span>`).join('')}</div>
        <p class="sy-note">${en
      ? 'Most lost marks in physics are unit slips, not physics slips. Convert first, calculate second.'
      : 'Phần lớn điểm mất trong Vật lí là do nhầm đơn vị, không phải do không hiểu. Đổi đơn vị trước, tính sau.'}</p>
      </section>

      <!-- 4. formula ladder -->
      <section class="sp-card sp-wide">
        <div class="sp-h"><span class="kicker">04 · ${en ? 'Formula ladder' : 'Thang công thức'}</span>
          <span class="sp-badge">${Object.keys(S.specialBox).filter(k => (S.specialBox[k] || 0) >= 4).length}/${SP_FORMULAS.length} ${en ? 'mastered' : 'đã thuộc'}</span></div>
        <p class="sy-note">${en
      ? 'Same Leitner boxes as your flashcards: right answer moves a card up a box, wrong answer drops it to box 1. Mastered = box 4 or higher, which means you recalled it three times on separate days.'
      : 'Cùng thang Leitner với thẻ ghi nhớ: đúng thì lên hộp, sai thì về hộp 1. “Đã thuộc” = hộp 4 trở lên, nghĩa là đã nhớ đúng ba lần ở ba ngày khác nhau.'}</p>
        <div class="sp-ladder">
          ${SP_FORMULAS.map(f => {
        const box = S.specialBox[f.id] || 0;
        return `<div class="sp-f" data-f="${f.id}">
              <div class="sp-f-q"><span class="sp-f-b" data-box="${box}">${box ? 'H' + box : '—'}</span>
                <b>${esc(f.q)}</b></div>
              <div class="sp-f-a">${esc(f.a)}</div>
              <i>${esc(f.note)}</i>
            </div>`;
      }).join('')}
        </div>
        <div class="sy-btnrow">
          <button class="btn" id="spDrill">${en ? 'Drill these' : 'Luyện 12 công thức'}</button>
        </div>
        <div id="spDrillOut"></div>
      </section>

    </div>
  </section>`;

  /* ---- read the problem ---- */
  const run = (text) => {
    const r = spSolve(text);
    const out = $('#spOut');
    if (!r.qty.length) {
      out.innerHTML = `<p class="sp-none">${en
        ? 'No quantities found. The engine reads units — try writing “12 Ω”, “0,5 A”, “6 V”.'
        : 'Không tìm thấy đại lượng nào. Máy đọc theo đơn vị — thử viết “12 Ω”, “0,5 A”, “6 V”.'}</p>`;
      return;
    }
    out.innerHTML = `
      <div class="sp-qty">${r.qty.map(q => `<span class="sp-chip"><b>${esc(q.raw)}</b>
        <i>${SP_QNAME[q.qty] || q.qty}</i></span>`).join('')}</div>
      ${r.ranked.length ? `<div class="sp-laws">${r.ranked.slice(0, 3).map(x => `
        <div class="sp-law ${x.full ? 'full' : ''}">
          <div class="sp-law-h"><b>${esc(x.law.name)}</b>
            <span class="mono">${esc(x.law.f)}</span>
            ${x.full ? `<span class="sp-tag">${en ? 'solvable' : 'giải được'}</span>` : ''}</div>
          <p>${esc(x.law.why)}</p>
        </div>`).join('')}</div>` : ''}
      ${r.answer ? `<div class="sp-ans"><span class="kicker">${en ? 'Answer' : 'Đáp số'}</span>
        <b>${r.answer.sym} = ${spFmt(r.answer.v)} ${r.answer.u}</b></div>` : ''}
      ${spSense(text).length ? `<div class="sp-sense">
        ${spSense(text).map(s => `<span class="sp-sense-p ${s.ok ? 'ok' : 'no'}">${esc(s.raw)}</span>`).join('')}
        ${spSense(text).every(s => s.ok) ? `<i class="sp-ok-t">${en ? 'all plausible' : 'đều hợp lí'}</i>`
        : `<i class="sp-no-t">${en ? 'something looks off' : 'có chỗ đáng ngờ'}</i>`}</div>` : ''}`;
  };

  $('#spGo').onclick = () => run($('#spIn').value);
  $('#spDemo').onclick = () => {
    const demo = en
      ? 'A resistor of 12 Ω is connected to a 6 V supply. Find the current.'
      : 'Một điện trở 12 Ω được mắc vào hiệu điện thế 6 V. Tính cường độ dòng điện chạy qua.';
    $('#spIn').value = demo;
    run(demo);
  };

  /* ---- formula drill ---- */
  const drill = $('#spDrill');
  if (drill) drill.onclick = () => {
    const idx = {};
    SP_FORMULAS.forEach(f => { idx[f.id] = f; });
    /* weakest first: box 0 … box 6 */
    const order = SP_FORMULAS.slice().sort((a, b) =>
      (S.specialBox[a.id] || 0) - (S.specialBox[b.id] || 0));
    let i = 0, right = 0;
    const host = $('#spDrillOut');
    const step = () => {
      if (i >= order.length) {
        host.innerHTML = `<div class="sp-done"><b>${right}/${order.length} ${en ? 'correct' : 'đúng'}</b>
          <p class="sy-note">${en ? 'Boxes updated. Come back tomorrow — spacing is the point.'
          : 'Đã cập nhật hộp. Mai quay lại — giãn cách mới là điều tạo ra trí nhớ.'}</p></div>`;
        save();
        return;
      }
      const f = order[i];
      host.innerHTML = `<div class="sp-drill">
        <span class="kicker">${i + 1}/${order.length}</span>
        <p class="sp-drill-q">${esc(f.q)}</p>
        <input id="spDA" type="text" placeholder="${en ? 'formula…' : 'công thức…'}">
        <div class="sy-btnrow"><button class="btn sm" id="spDGo">${en ? 'Check' : 'Kiểm tra'}</button>
          <button class="btn ghost sm" id="spDSee">${en ? 'Show' : 'Xem đáp án'}</button></div>
        <p class="sy-note" id="spDRes"></p>
      </div>`;
      const judge = (showOnly) => {
        const got = showOnly ? '' : $('#spDA').value;
        const ok = !showOnly && spFormulaMatch(got, f.a);
        if (!showOnly) {
          const box = S.specialBox[f.id] || 0;
          S.specialBox[f.id] = ok ? Math.min(6, box + 1) : 1;
          if (ok) right++;
          save();
        }
        $('#spDRes').innerHTML = (showOnly ? '' :
          ok ? `<b class="sp-y">✓ ${en ? 'correct' : 'đúng'}</b>` : `<b class="sp-n">✕ ${en ? 'not quite' : 'chưa đúng'}</b>`)
          + ` <span class="mono">${esc(f.a)}</span>`;
        i++;
        setTimeout(step, showOnly ? 900 : 620);
      };
      $('#spDGo').onclick = () => judge(false);
      $('#spDA').onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); judge(false); } };
      $('#spDSee').onclick = () => judge(true);
      $('#spDA').focus();
    };
    step();
  };
}

/* Format a computed number the way a physics answer should look. */
function spFmt(v) {
  if (!isFinite(v)) return '—';
  const a = Math.abs(v);
  if (a !== 0 && (a < 0.01 || a >= 1e5)) {
    const e = Math.floor(Math.log10(a));
    const m = v / Math.pow(10, e);
    return m.toFixed(2).replace('.', ',') + ' × 10' + spSup(e);
  }
  return (Math.round(v * 1000) / 1000).toString().replace('.', ',');
}
function spSup(n) {
  const map = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  return String(n).split('').map(c => map[c] || c).join('');
}

/* Formula answers are typed, so be generous: ignore spaces, case,
   and × vs * vs . — the student knows the physics, not the syntax. */
function spFormulaMatch(input, answer) {
  const norm = s => String(s || '').toLowerCase()
    .replace(/[×⋅·*]/g, '').replace(/\s+/g, '').replace(/\./g, '').replace(/,/g, '');
  const a = norm(input), b = norm(answer);
  if (!a) return false;
  if (a === b) return true;
  /* allow "U/R" for "U / R" and "I2Rt" for "I² R t" */
  return a.replace(/²/g, '2').replace(/³/g, '3') === b.replace(/²/g, '2').replace(/³/g, '3');
}
