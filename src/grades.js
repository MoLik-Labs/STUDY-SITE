/* =========================================================
   SỔ ĐIỂM — tính điểm trung bình môn đúng cách của THCS/THPT
   ---------------------------------------------------------
   Nghiên cứu từ các trang học tập (Power Planner "GPA + What If?",
   MyStudyLife "grade tracking", Study-Track "course insights") rồi
   đối chiếu với quy chế của Bộ GD&ĐT Việt Nam:

     · Điểm miệng (hệ số 1)
     · Điểm kiểm tra 15 phút (hệ số 1)
     · Điểm kiểm tra 1 tiết (hệ số 2)
     · Điểm thi học kì   (hệ số 3)

     ĐTB môn học kì = Σ(điểm × hệ số) / Σ(hệ số)
     ĐTB môn cả năm = (ĐTB HK1 + 2 × ĐTB HK2) / 3

   Điểm khác biệt so với các app nước ngoài: hệ số là **cấu hình được**,
   vì mỗi trường có thể khác (có nơi 15 phút hệ số 1 nhưng 4 cột, có nơi
   dùng hệ số khác cho môn chuyên). Trang này không áp đặt một công thức
   duy nhất — bạn sửa được hệ số và thấy kết quả đổi ngay.

   Phần "what if" lấy từ Power Planner: cho biết **cần bao nhiêu điểm** ở
   bài kiểm tra tiếp theo để đạt mức mong muốn. Đây là câu hỏi học sinh
   thật sự hỏi, không phải "điểm của tôi là bao nhiêu".
   ========================================================= */

/* ---------- cấu hình hệ số (sửa được, lưu trong máy) ---------- */
const GD_KINDS = [
  { id: 'mouth', name: 'Miệng', short: 'M', w: 1, max: 1 },
  { id: 'p15', name: '15 phút', short: '15′', w: 1, max: 1 },
  { id: 'p45', name: '1 tiết', short: '45′', w: 2, max: 1 },
  { id: 'sem', name: 'Học kì', short: 'HK', w: 3, max: 1 },
];
const GD_TERMS = [{ id: 'hk1', name: 'Học kì I' }, { id: 'hk2', name: 'Học kì II' }];

/* Học lực theo Thông tư 22/2021 (áp dụng cho lớp 6–12 từ 2021). */
const GD_RANKS = [
  { at: 8.0, code: 'T', name: 'Tốt', color: '#2f6b3f' },
  { at: 6.5, code: 'K', name: 'Khá', color: '#3f6b8f' },
  { at: 5.0, code: 'Đ', name: 'Đạt', color: '#b98a2e' },
  { at: 3.5, code: 'C', name: 'Chưa đạt', color: '#b3402f' },
  { at: -1, code: 'Y', name: 'Yếu', color: '#8b2e22' },
];

function gdState() {
  if (!state.grades || typeof state.grades !== 'object') state.grades = {};
  const G = state.grades;
  if (!Array.isArray(G.rows)) G.rows = [];
  if (!G.w || typeof G.w !== 'object') G.w = { mouth: 1, p15: 1, p45: 2, sem: 3 };
  GD_KINDS.forEach(k => {
    const v = +G.w[k.id];
    if (!isFinite(v) || v < 0 || v > 10) G.w[k.id] = k.w;
  });
  if (!G.year) G.year = '2026-2027';
  if (!G.target) G.target = 8.0;            /* mức học lực muốn đạt */
  return G;
}

const gdWeight = kind => +gdState().w[kind] || 0;

/* Điểm trung bình một hàng (một môn, một học kì) */
function gdAvg(row, term) {
  let sum = 0, wsum = 0;
  (row.marks || []).forEach(m => {
    if (m.term !== term) return;
    const w = gdWeight(m.kind);
    if (!w) return;
    sum += (+m.v) * w;
    wsum += w;
  });
  return wsum ? sum / wsum : null;
}

/* Điểm trung bình cả năm của một hàng */
function gdYearAvg(row) {
  const a = gdAvg(row, 'hk1'), b = gdAvg(row, 'hk2');
  if (a === null && b === null) return null;
  if (a === null) return b;
  if (b === null) return a;
  return (a + 2 * b) / 3;
}

function gdRank(v) {
  if (v === null || v === undefined) return null;
  return GD_RANKS.find(r => v >= r.at) || GD_RANKS[GD_RANKS.length - 1];
}

/* Điểm trung bình chung học kì = trung bình cộng ĐTB các môn (làm tròn 1 số lẻ) */
function gdTermAvg(term) {
  const G = gdState();
  const vals = G.rows.map(r => gdAvg(r, term)).filter(v => v !== null);
  if (!vals.length) return null;
  /* quy chế: ĐTB chung làm tròn tới 1 chữ số thập phân */
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10;
}

/* "What if": cần bao nhiêu điểm ở bài tiếp theo để đạt mục tiêu */
function gdWhatIf(row, term) {
  const G = gdState();
  const target = +G.target || 8;
  const cur = gdAvg(row, term);
  if (cur === null) return null;
  /* giả định bài tiếp theo là 1 tiết (hệ số 2) — loại phổ biến nhất */
  const w = gdWeight('p45') || 2;
  let sum = 0, wsum = 0;
  (row.marks || []).forEach(m => {
    if (m.term !== term) return;
    const ww = gdWeight(m.kind);
    if (!ww) return;
    sum += (+m.v) * ww; wsum += ww;
  });
  const need = (target * (wsum + w) - sum) / w;
  return {
    need: Math.max(0, Math.min(10, need)),
    reachable: need <= 10,
    already: cur >= target,
    w,
  };
}

/* ---------- thao tác ---------- */
function gdRow(name, subjectId) {
  const G = gdState();
  const r = { id: 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name, s: subjectId || '', marks: [] };
  G.rows.push(r);
  save();
  return r;
}

function gdAddMark(rowId, kind, v, term) {
  const G = gdState();
  const row = G.rows.find(r => r.id === rowId);
  if (!row) return false;
  const val = Math.max(0, Math.min(10, +v));
  if (!isFinite(val)) return false;
  row.marks = row.marks || [];
  row.marks.push({ kind, v: Math.round(val * 10) / 10, term: term || 'hk1', at: Date.now() });
  save();
  return true;
}

function gdDelMark(rowId, idx) {
  const G = gdState();
  const row = G.rows.find(r => r.id === rowId);
  if (!row || !row.marks || !row.marks[idx]) return false;
  row.marks.splice(idx, 1);
  save();
  return true;
}

/* Gợi ý tên môn từ danh mục có sẵn, để không phải gõ tay */
function gdSuggestSubjects(grade) {
  try {
    if (typeof subjectsFor === 'function') {
      const subs = subjectsFor(grade || (state.school && state.school.grade) || 9);
      if (subs && subs.length) return subs.map(s => ({ id: s.id, name: s.name }));
    }
  } catch (e) { }
  return [];
}

/* =========================================================
   ROUTE · SỔ ĐIỂM  #/grades
   ========================================================= */
function renderGrades(termArg) {
  const G = gdState();
  const term = termArg === 'hk2' ? 'hk2' : 'hk1';
  const termName = GD_TERMS.find(t => t.id === term).name;
  const tAvg = gdTermAvg(term);
  const yAvg = (() => {
    const vals = G.rows.map(gdYearAvg).filter(v => v !== null);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10 : null;
  })();
  const rank = gdRank(yAvg);
  const target = +G.target || 8;
  const targetRank = gdRank(target);

  /* môn yếu nhất — nơi một điểm số tốt tạo ra khác biệt lớn nhất */
  const weak = G.rows
    .map(r => ({ r, v: gdAvg(r, term) }))
    .filter(x => x.v !== null)
    .sort((a, b) => a.v - b.v)
    .slice(0, 3);

  const rowHtml = r => {
    const a = gdAvg(r, term);
    const rk = gdRank(a);
    const wi = gdWhatIf(r, term);
    const marks = (r.marks || []).map((m, i) => ({ m, i })).filter(x => x.m.term === term);
    return `<div class="gd-row" data-row="${r.id}">
      <div class="gd-row-h">
        <span class="gd-name">${esc(r.name)}</span>
        <span class="grow"></span>
        <span class="gd-avg${a === null ? ' none' : ''}" style="${rk ? 'color:' + rk.color : ''}">${a === null ? '—' : a.toFixed(2)}</span>
        <button class="gd-del" data-del="${r.id}" title="Xoá môn" aria-label="Xoá môn ${esc(r.name)}">×</button>
      </div>
      <div class="gd-marks">
        ${GD_KINDS.map(k => {
      const list = marks.filter(x => x.m.kind === k.id);
      const w = gdWeight(k.id);
      return `<div class="gd-kind">
            <span class="gd-kind-h">${k.name}${w !== 1 ? ` <i>×${w}</i>` : ''}</span>
            <span class="gd-pills">${list.map(x =>
        `<button class="gd-pill" data-rm="${r.id}:${x.i}" title="Bấm để xoá điểm này">${x.m.v}</button>`).join('')}
              <button class="gd-add" data-add="${r.id}:${k.id}" aria-label="Thêm điểm ${k.name} cho ${esc(r.name)}">+</button>
            </span>
          </div>`;
    }).join('')}
      </div>
      ${wi && !wi.already && wi.reachable ? `<p class="gd-if">Cần <b>${wi.need.toFixed(1)}</b> điểm 1 tiết nữa để đạt ${target.toFixed(1)}</p>` : ''}
      ${wi && !wi.reachable ? `<p class="gd-if bad">Mục tiêu ${target.toFixed(1)} không còn đạt được ở ${termName} — cần kéo điểm học kì còn lại</p>` : ''}
    </div>`;
  };

  $('#main').innerHTML = `<section class="wrap wide sy-page">
    ${pageHead('Sổ điểm · THCS &amp; THPT',
    yAvg === null ? 'chưa có điểm nào' : 'trung bình cả năm ' + yAvg.toFixed(1) + (rank ? ' · học lực ' + rank.name : ''),
    'Nhập điểm miệng, 15 phút, 1 tiết và học kì — máy tính đúng công thức hệ số của Bộ GD&amp;ĐT. Nút “cần bao nhiêu điểm” cho biết chính xác bài kiểm tra tới phải được mấy điểm để đạt mức bạn muốn.')}

    <div class="pg-kpi">
      <div class="pg-k"><span class="kicker">${termName}</span><b>${tAvg === null ? '—' : tAvg.toFixed(1)}</b><em>${G.rows.length} môn</em></div>
      <div class="pg-k"><span class="kicker">Cả năm</span><b>${yAvg === null ? '—' : yAvg.toFixed(1)}</b><em>HK1 + 2×HK2</em></div>
      <div class="pg-k"><span class="kicker">Học lực</span><b style="${rank ? 'color:' + rank.color : ''}">${rank ? rank.name : '—'}</b><em>theo TT 22/2021</em></div>
      <div class="pg-k"><span class="kicker">Mục tiêu</span><b>${target.toFixed(1)}</b><em>${targetRank ? targetRank.name : ''}</em></div>
      <div class="pg-k"><span class="kicker">Điểm đã nhập</span><b>${G.rows.reduce((a, r) => a + (r.marks || []).length, 0)}</b><em>đầu điểm</em></div>
    </div>

    <div class="gd-bar">
      <div class="gd-tabs" role="tablist">
        ${GD_TERMS.map(t => `<button class="gd-tab${t.id === term ? ' on' : ''}" role="tab" aria-selected="${t.id === term}" data-term="${t.id}">${t.name}</button>`).join('')}
      </div>
      <span class="grow"></span>
      <label class="gd-target"><span>Mục tiêu</span>
        <input id="gdTarget" type="number" min="0" max="10" step="0.1" value="${target}"></label>
    </div>

    ${G.rows.length ? `<div class="gd-list">${G.rows.map(rowHtml).join('')}</div>`
      : `<div class="gd-empty">
          <p><b>Chưa có môn nào.</b> Thêm môn đầu tiên rồi nhập điểm — mọi thứ lưu trong máy bạn.</p>
        </div>`}

    <div class="gd-addrow">
      <input id="gdNew" type="text" list="gdSubs" placeholder="Tên môn — ví dụ: Vật lí">
      <datalist id="gdSubs">${gdSuggestSubjects().map(s => `<option value="${esc(s.name)}">`).join('')}</datalist>
      <button class="btn" id="gdAdd">Thêm môn</button>
    </div>

    ${weak.length ? `<div class="sy-box gd-weak">
      <div class="sy-box-h"><span class="kicker">Nên chú ý nhất · ${termName}</span></div>
      ${weak.map(x => `<div class="gd-weak-r">
        <span class="gd-name">${esc(x.r.name)}</span>
        <span class="gd-weak-v" style="color:${(gdRank(x.v) || {}).color || 'inherit'}">${x.v.toFixed(2)}</span>
        <a class="gd-weak-go" href="#/plan">lập kế hoạch →</a>
      </div>`).join('')}
    </div>` : ''}

    <details class="gd-cfg">
      <summary>Hệ số &amp; cách tính</summary>
      <p class="sy-note">Mỗi trường có thể đặt hệ số khác nhau. Sửa ở đây là mọi điểm trung bình đổi theo ngay — không phải nhập lại điểm.</p>
      <div class="gd-cfg-grid">
        ${GD_KINDS.map(k => `<label class="st-row"><span>${k.name}</span>
          <input type="number" min="0" max="10" step="1" value="${gdWeight(k.id)}" data-w="${k.id}"></label>`).join('')}
      </div>
      <p class="sy-note">ĐTB học kì = Σ(điểm × hệ số) ÷ Σ(hệ số). ĐTB cả năm = (HK1 + 2 × HK2) ÷ 3.
        Xếp loại theo TT 22/2021: Tốt ≥ 8,0 · Khá ≥ 6,5 · Đạt ≥ 5,0 · Chưa đạt ≥ 3,5.</p>
    </details>
  </section>`;

  /* ---------- tương tác ---------- */
  $$('.gd-tab').forEach(b => {
    b.onclick = () => go('#/grades/' + b.dataset.term);
  });

  const tgt = $('#gdTarget');
  if (tgt) tgt.onchange = () => {
    G.target = Math.max(0, Math.min(10, +tgt.value || 8));
    save(); renderGrades(term);
    toast('Mục tiêu: ' + G.target.toFixed(1));
  };

  $$('[data-w]').forEach(inp => {
    inp.onchange = () => {
      const v = +inp.value;
      if (!isFinite(v) || v < 0 || v > 10) return;
      G.w[inp.dataset.w] = v; save(); renderGrades(term);
    };
  });

  $$('[data-add]').forEach(b => {
    b.onclick = () => {
      const [rowId, kind] = b.dataset.add.split(':');
      const row = G.rows.find(r => r.id === rowId);
      if (!row) return;
      uiPrompt(`Điểm ${GD_KINDS.find(k => k.id === kind).name} · ${row.name}`, '', v => {
        if (v === null || v === '' || v === undefined) return;
        if (!gdAddMark(rowId, kind, v, term)) return toast('Điểm phải từ 0 đến 10');
        renderGrades(term);
      }, { type: 'number', min: 0, max: 10, step: 0.1, okText: 'Thêm điểm' });
    };
  });

  $$('[data-rm]').forEach(b => {
    b.onclick = () => {
      const [rowId, idx] = b.dataset.rm.split(':');
      if (!gdDelMark(rowId, +idx)) return;
      renderGrades(term);
    };
  });

  $$('[data-del]').forEach(b => {
    b.onclick = () => {
      const id = b.dataset.del;
      const row = G.rows.find(r => r.id === id);
      if (!row) return;
      uiConfirm('Xoá môn', `Xoá <b>${esc(row.name)}</b> và ${(row.marks || []).length} đầu điểm của môn này?`, () => {
        G.rows = G.rows.filter(r => r.id !== id);
        save(); renderGrades(term); toast('Đã xoá ' + row.name);
      }, { danger: true, okText: 'Xoá môn' });
    };
  });

  const add = $('#gdAdd'), inp2 = $('#gdNew');
  const doAdd = () => {
    const name = (inp2.value || '').trim();
    if (!name) return toast('Nhập tên môn trước đã');
    if (G.rows.some(r => r.name.toLowerCase() === name.toLowerCase())) return toast('Môn này đã có trong sổ');
    const sug = gdSuggestSubjects().find(s => s.name.toLowerCase() === name.toLowerCase());
    gdRow(name, sug ? sug.id : '');
    renderGrades(term);
    toast('Đã thêm ' + name);
  };
  if (add) add.onclick = doAdd;
  if (inp2) inp2.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); doAdd(); } };
}


/* =========================================================
   ĐẾM NGƯỢC + TÍNH KHẢ THI
   ---------------------------------------------------------
   Ý lấy từ Shovel ("Time Cushion: is this schedule even possible?")
   và Sora ("exam countdown"), nhưng làm bằng dữ liệu có thật trong máy:
   số bài còn lại, số phút mỗi ngày bạn khai, và số ngày thật còn lại.

   Câu trả lời quan trọng không phải "còn 14 ngày" mà là
   "14 ngày này có đủ không?" — nên hàm dưới trả về cả hai.
   ========================================================= */

/* Số ngày còn lại tới một mốc ISO (tính theo ngày lịch, không theo giờ) */
function gdDaysLeft(iso) {
  if (!iso) return null;
  const end = new Date(iso + 'T23:59:59');
  if (isNaN(end)) return null;
  const a = new Date(); a.setHours(0, 0, 0, 0);
  const b = new Date(end); b.setHours(0, 0, 0, 0);
  return Math.round((b - a) / 864e5);
}

/* Khả thi của một kế hoạch: cần bao nhiêu phút mỗi ngày so với bạn khai */
function gdFeasible(plan) {
  if (!plan || !plan.days) return null;
  const S = studyState();
  S.planDone = S.planDone || {};
  const today = syDayKey();
  const left = [];
  plan.days.forEach(d => {
    if (d.date < today) return;
    const open = d.items.filter(it => !S.planDone[it.key]);
    if (open.length) left.push({ date: d.date, n: open.length });
  });
  const totalLeft = left.reduce((a, x) => a + x.n, 0);
  const daysLeft = left.length;
  const perDay = plan.min || 60;
  /* một mục (đọc bài / luyện đề) ước khoảng 1/3 số phút mỗi ngày */
  const capacity = perDay / 3 * daysLeft;
  const ratio = capacity ? totalLeft / capacity : 0;
  return {
    totalLeft, daysLeft, perDay, capacity: Math.round(capacity),
    ratio,
    status: ratio <= 0.85 ? 'ok' : ratio <= 1.15 ? 'tight' : 'over',
  };
}

/* Dòng đếm ngược dùng được ở nhiều trang */
function gdCountdown(iso, label) {
  const d = gdDaysLeft(iso);
  if (d === null) return '';
  if (d < 0) return `<span class="cd cd-past">${esc(label || 'Mốc')} đã qua ${-d} ngày</span>`;
  if (d === 0) return `<span class="cd cd-now">${esc(label || 'Mốc')} là <b>hôm nay</b></span>`;
  return `<span class="cd${d <= 7 ? ' cd-soon' : ''}">${esc(label || 'Mốc')} còn <b>${d}</b> ngày</span>`;
}
