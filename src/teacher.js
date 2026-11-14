/* =========================================================
   TEACHER / STUDENT SHEET — generate, print, back up
   Everything runs locally: no server, no API.
   ========================================================= */

function seeded(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
}

const SHEET_TYPES = ['mcq', 'multi', 'tf', 'num', 'pick', 'order'];

function renderSheet() {
  const st = state.sheet || (state.sheet = { n: 12, topics: [], types: ['mcq', 'multi', 'tf', 'num'], key: true, seed: 'VNL9', title: 'Phiếu luyện Vật lí 9' });
  if (!st.topics.length) st.topics = TOPICS.map(t => t.id);

  $('#main').innerHTML = `<section class="wrap wide">
    ${pageHead('Phiếu của tôi · dành cho giáo viên và học sinh', 'Tạo phiếu in từ ngân hàng câu hỏi',
    'Chọn chủ đề, dạng câu, số câu và mã đề. Trang in ra sạch: chỉ câu hỏi, có ô ghi tên và điểm; bản có đáp án in ở trang cuối.')}
    <div class="sheet-grid no-print">
      <div class="sheet-ctrl">
        <label class="cf-row"><span class="cf-l">Tên phiếu</span>
          <span class="cf-in"><input id="shTitle" value="${esc(st.title)}" style="width:100%"></span></label>
        <label class="cf-row"><span class="cf-l">Số câu</span>
          <span class="cf-in"><input type="number" id="shN" min="4" max="40" value="${st.n}"></span></label>
        <label class="cf-row"><span class="cf-l">Mã đề</span>
          <span class="cf-in"><input id="shSeed" value="${esc(st.seed)}" style="width:100%"></span></label>
        <div class="cf-row"><span class="cf-l">Chủ đề</span>
          <div class="chipset" id="shTopics">
            ${TOPICS.map(t => `<button class="chip${st.topics.includes(t.id) ? ' on' : ''}" data-t="${t.id}">${t.id}</button>`).join('')}
            <button class="chip" data-t="all">tất cả</button>
          </div></div>
        <div class="cf-row"><span class="cf-l">Dạng câu</span>
          <div class="chipset" id="shTypes">
            ${SHEET_TYPES.map(k => `<button class="chip${st.types.includes(k) ? ' on' : ''}" data-k="${k}">${TYPE_LABEL[k]}</button>`).join('')}
          </div></div>
        <label class="cf-toggle"><input type="checkbox" id="shKey" ${st.key ? 'checked' : ''}> In kèm đáp án và lời giải</label>
        <div class="sheet-btns">
          <button class="btn" id="shMake">Tạo phiếu</button>
          <button class="btn ghost" id="shPrint">In / lưu PDF</button>
        </div>
        <p class="muted" style="margin-top:12px">Cùng một mã đề luôn ra cùng một phiếu — phát cho cả lớp vẫn công bằng. Đổi mã là ra đề khác.</p>
      </div>
      <div class="sheet-side">
        <div class="kicker">Bài đã lưu từ máy giải (${(state.book || []).length})</div>
        <div class="booklist" id="bookList">
          ${(state.book || []).length ? state.book.map((b, i) => `<div class="bookrow">
            <div><b>${esc(b.name)}</b><span>${esc(b.out || '')}</span></div>
            <button class="x" data-del="${i}" aria-label="Xoá">×</button></div>`).join('') : '<p class="muted">Chưa lưu bài nào. Vào <a href="#/calc">Máy giải</a>, nhập số liệu rồi bấm “Lưu vào phiếu của tôi”.</p>'}
        </div>
        <div class="kicker" style="margin-top:22px">Sao lưu tiến độ</div>
        <div class="sheet-btns">
          <button class="btn ghost sm" id="bkExport">Tải tệp JSON</button>
          <label class="btn ghost sm" style="cursor:pointer">Nhập tệp<input type="file" id="bkImport" accept="application/json" style="display:none"></label>
          <button class="btn ghost sm" id="bkReset">Xoá hết</button>
        </div>
        <p class="muted" style="margin-top:10px;font-size:11.5px">Tệp JSON chứa toàn bộ tiến độ, ghi chú, câu sai và điểm thi. Chuyển máy hoặc đưa cho học sinh khác mà không mất dữ liệu.</p>
      </div>
    </div>
    <div class="sheet-paper" id="sheetPaper"></div>
  </section>`;

  const draw = () => {
    const usable = QUIZ.filter(q => st.topics.includes(q.t) && st.types.includes(q.type || 'mcq'));
    const rnd = seeded(st.seed + '|' + st.n + '|' + st.topics.join(',') + '|' + st.types.join(','));
    const pool = usable.slice();
    const pick = [];
    while (pick.length < st.n && pool.length) {
      pick.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
    }
    const idx = q => pick.indexOf(q) + 1;
    const body = pick.map((q, i) => {
      const t = q.type || 'mcq';
      let ans = '';
      if (t === 'mcq' || t === 'multi') ans = '<div class="pq-opts">' + q.o.map((o, k) => `<div><span>${'ABCD'[k]}.</span> ${o}</div>`).join('') + '</div>';
      if (t === 'tf') ans = '<div class="pq-opts"><div>Đúng / Sai</div></div>';
      if (t === 'num') ans = `<div class="pq-opts"><div>Đáp số: ……… ${q.unit || ''}</div></div>`;
      if (t === 'pick') ans = '<div class="pq-opts"><div>Hình chọn: ………</div></div>';
      if (t === 'order') ans = '<div class="pq-opts"><div>Các bước: ' + q.s.map(() => '……').join(' → ') + '</div></div>';
      return `<div class="pq"><div class="pq-q"><b>${i + 1}.</b> ${q.q}</div>${ans}</div>`;
    }).join('');
    const key = pick.map((q, i) => {
      const t = q.type || 'mcq';
      let a = '';
      if (t === 'mcq') a = 'ABCD'[q.a];
      else if (t === 'multi') a = q.a.map(k => 'ABCD'[k]).join(', ');
      else if (t === 'tf') a = q.a ? 'Đúng' : 'Sai';
      else if (t === 'num') a = f2(q.a) + (q.unit ? ' ' + q.unit : '');
      else if (t === 'pick') a = 'Hình ' + 'ABCD'[q.a];
      else if (t === 'order') a = '1 → ' + q.s.map((_, k) => k + 1).join(' → ');
      return `<div class="pk"><b>${i + 1}.</b> <span>${a}</span>${q.e ? `<i>${q.e}</i>` : ''}</div>`;
    }).join('');
    $('#sheetPaper').innerHTML = `
      <div class="paper-head">
        <div class="kicker">Vật lí 9 · HSG KHTN 1 &amp; Chuyên Lý</div>
        <h1>${esc(st.title)}</h1>
        <div class="paper-meta"><span>Họ tên: …………………………………</span><span>Lớp: …………</span><span>Điểm: ………</span><span>Mã đề: ${esc(st.seed)}</span></div>
      </div>
      <div class="paper-q">${body}</div>
      ${st.key ? `<div class="paper-key"><div class="kicker">Đáp án &amp; lời giải</div>${key}</div>` : ''}
      <div class="paper-foot">Tạo tự động từ ${QUIZ.length} câu hỏi của lớp Vật lí 9 · ${new Date().toLocaleDateString('vi-VN')}</div>`;
    void idx;
  };

  $$('#shTopics .chip').forEach(b => b.onclick = () => {
    const id = b.dataset.t;
    if (id === 'all') st.topics = TOPICS.map(t => t.id);
    else st.topics = st.topics.includes(+id) ? st.topics.filter(x => x !== +id) : st.topics.concat(+id);
    if (!st.topics.length) st.topics = TOPICS.map(t => t.id);
    save(); renderSheet();
  });
  $$('#shTypes .chip').forEach(b => b.onclick = () => {
    const k = b.dataset.k;
    st.types = st.types.includes(k) ? st.types.filter(x => x !== k) : st.types.concat(k);
    if (!st.types.length) st.types = ['mcq'];
    save(); renderSheet();
  });
  $('#shN').onchange = e => { st.n = Math.max(4, Math.min(40, +e.target.value || 12)); save(); draw(); };
  $('#shSeed').onchange = e => { st.seed = e.target.value.trim() || 'VNL9'; save(); draw(); };
  $('#shTitle').onchange = e => { st.title = e.target.value; save(); draw(); };
  $('#shKey').onchange = e => { st.key = e.target.checked; save(); draw(); };
  $('#shMake').onclick = () => { st.seed = 'VNL9-' + Math.floor(Math.random() * 900 + 100); $('#shSeed').value = st.seed; save(); draw(); toast('Đã bốc mã đề mới'); };
  $('#shPrint').onclick = () => window.print();

  $$('#bookList [data-del]').forEach(b => b.onclick = () => {
    state.book.splice(+b.dataset.del, 1); save(); renderSheet();
  });
  $('#bkExport').onclick = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'vat-li-9-tien-do.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  };
  $('#bkImport').onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const o = JSON.parse(rd.result);
        state = Object.assign(loadState(), o);
        save(); toast('Đã nhập tiến độ'); render();
      } catch (err) { toast('Tệp không hợp lệ'); }
    };
    rd.readAsText(f);
  };
  $('#bkReset').onclick = () => {
    uiConfirm('Bắt đầu lại từ đầu',
      'Xoá <b>toàn bộ</b> tiến độ, câu sai, ghi chú và điểm thi trên trình duyệt này? Hãy sao lưu trước nếu cần.',
      () => {
        state = { done: {}, watched: {}, ans: {}, mine: [], note: {}, runs: [], days: {}, calc: null, book: [], sheet: state.sheet, pane: 'learn', last: null };
        save(); toast('Đã xoá'); render();
      }, { danger: true, okText: 'Xoá tất cả' });
  };

  draw();
}
