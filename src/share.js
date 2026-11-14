/* =========================================================
   SHARE — progress cards people actually want to post
   ---------------------------------------------------------
   The rule that keeps this from being cringe: a share card must
   show something the person genuinely earned, and it must be
   readable without context. So the numbers come from real state,
   never from a "share for +100 coins" button.

   Two outputs, both offline, no server, no tracking:
     · a 1200x630 PNG drawn on <canvas> (OG-image proportions, so it
       looks right when a chat app unfurls it)
     · plain text for pasting into a message

   Why canvas and not a screenshot library: one file, no dependency,
   and the drawing code doubles as the layout definition.

   Privacy: the card carries a score and a streak, never a name,
   never an email, never the content of notes. The learner decides
   what to share; the card cannot leak more than it shows.
   ========================================================= */

const SH_W = 1200, SH_H = 630;

/* Collect only what is safe and worth showing. */
function shSnapshot() {
  const S = typeof studyState === 'function' ? studyState() : {};
  const G = typeof gmState === 'function' ? gmState() : {};
  const g = typeof gdTermAvg === 'function' ? gdTermAvg('hk1') : null;
  const cards = (S.cards || []).length;
  const mastered = (S.cards || []).filter(c => (c.box || 0) >= 4).length;
  const streak = typeof syStreak === 'function' ? syStreak() : 0;
  const minutes = (S.sessions || []).reduce((a, s) => a + (s.min || 0), 0);
  const plan = S.plan ? Math.round((S.plan.doneCount / Math.max(1, S.plan.totalCount)) * 100) : null;
  return {
    cards, mastered, streak, minutes, plan, grade: g,
    coins: G.coins || 0, level: G.level || 1, best: G.best || 0,
    days: typeof doneCount === 'function' ? doneCount() : 0,
    total: typeof TOTAL_SESS !== 'undefined' ? TOTAL_SESS : 52,
  };
}

/* Draw the card. Kept in one function so the layout is auditable. */
function shDraw(canvas, snap, lang) {
  const en = lang === 'en';
  const W = SH_W, H = SH_H, dpr = 2;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const c = canvas.getContext && canvas.getContext('2d');
  /* Some environments (older browsers, locked-down webviews, and the
     jsdom test runner) have no 2d context. Returning null lets the page
     fall back to the text card instead of taking the whole route down. */
  if (!c) return false;
  c.scale(dpr, dpr);

  const INK = '#17150f', PAPER = '#f4f1ea', CARD = '#fbfaf6';
  const RULE = '#dbd5c6', FOX = '#c6542d', MUTED = '#7a7264';

  /* paper + a 2px ink rule under the top edge, like the site */
  c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
  c.fillStyle = INK; c.fillRect(0, 0, W, 6);

  /* the fox, drawn as squares from the same 16x16 grid as the site */
  const cell = 9, ox = 74, oy = 78;
  const HALF = (typeof BRAND_MARK_HALF !== 'undefined') ? BRAND_MARK_HALF : [];
  const COL = { o: FOX, d: '#a53e20', k: INK, w: '#fcf9f2' };
  HALF.forEach((half, y) => {
    const full = half + half.split('').reverse().join('');
    [...full].forEach((ch, x) => {
      if (!COL[ch]) return;
      c.fillStyle = COL[ch];
      c.fillRect(ox + x * cell, oy + y * cell, cell + 0.5, cell + 0.5);
    });
  });

  /* wordmark */
  const tx = ox + 16 * cell + 34;
  c.fillStyle = INK;
  c.font = '600 56px Georgia, "Times New Roman", serif';
  c.textBaseline = 'alphabetic';
  c.fillText('Study Focus Fox', tx, oy + 80);

  c.fillStyle = MUTED;
  c.font = '500 17px ui-monospace, Menlo, monospace';
  const tag = (typeof BRAND !== 'undefined')
    ? (BRAND.tagline[en ? 'en' : 'vi']) : '';
  c.fillText(tag.toUpperCase(), tx, oy + 116);

  /* Right side of the header: the date. It gives the card a "when" without
     asking for a name, and it fills the void that made the layout look
     unfinished. */
  const now = new Date();
  const dateVN = String(now.getDate()).padStart(2, '0') + '/' +
    String(now.getMonth() + 1).padStart(2, '0') + '/' + now.getFullYear();
  c.textAlign = 'right';
  c.fillStyle = INK;
  c.font = '400 30px Georgia, "Times New Roman", serif';
  c.fillText(dateVN, W - 74, oy + 62);
  c.fillStyle = MUTED;
  c.font = '500 13px ui-monospace, Menlo, monospace';
  c.fillText((en ? 'LEARNING LOG' : 'NHAT KY HOC').toUpperCase(), W - 74, oy + 88);
  c.textAlign = 'left';

  /* rule */
  c.strokeStyle = RULE; c.lineWidth = 1;
  c.beginPath(); c.moveTo(74, 292); c.lineTo(W - 74, 292); c.stroke();

  /* the four numbers that matter, big */
  const stats = [
    { n: String(snap.streak), l: en ? 'day streak' : 'ngày liên tiếp' },
    { n: String(snap.mastered), l: en ? 'cards mastered' : 'thẻ đã thuộc' },
    { n: snap.minutes >= 60 ? (snap.minutes / 60).toFixed(1) : String(snap.minutes), l: en ? 'hours studied' : 'giờ đã học' },
    { n: String(snap.days) + '/' + snap.total, l: en ? 'sessions done' : 'ca đã xong' },
  ];
  const gap = (W - 148) / 4;
  stats.forEach((s, i) => {
    const x = 74 + i * gap;
    c.fillStyle = INK;
    c.font = '400 76px Georgia, "Times New Roman", serif';
    c.fillText(s.n, x, 404);
    c.fillStyle = MUTED;
    c.font = '500 15px ui-monospace, Menlo, monospace';
    c.fillText(s.l.toUpperCase(), x, 434);
  });

  /* footer strip: the honest footnote */
  c.fillStyle = CARD;
  c.fillRect(0, H - 116, W, 116);
  c.strokeStyle = RULE;
  c.beginPath(); c.moveTo(0, H - 116); c.lineTo(W, H - 116); c.stroke();

  c.fillStyle = INK;
  c.font = '400 21px Georgia, "Times New Roman", serif';
  const foot = en
    ? 'Studied offline · data never left this device'
    : 'Học offline · dữ liệu không rời khỏi máy này';
  c.fillText(foot, 74, H - 66);

  c.fillStyle = MUTED;
  c.font = '500 14px ui-monospace, Menlo, monospace';
  const extra = [];
  if (snap.grade !== null) extra.push((en ? 'GPA ' : 'ĐTB ') + snap.grade.toFixed(1));
  if (snap.plan !== null) extra.push((en ? 'plan ' : 'kế hoạch ') + snap.plan + '%');
  if (snap.level > 1) extra.push((en ? 'arena Lv' : 'đấu trường cấp ') + snap.level);
  c.fillText(extra.join('  ·  ') || (en ? 'no data yet' : 'chưa có dữ liệu'), 74, H - 40);

  /* the source, bottom right — a card with a URL is a card people can find */
  c.textAlign = 'right';
  c.fillStyle = MUTED;
  c.font = '500 14px ui-monospace, Menlo, monospace';
  c.fillText('studyfocusfox', W - 74, H - 40);
  c.textAlign = 'left';
  return true;
}

/* Plain-text version — for chat where an image is overkill. */
function shText(snap, lang) {
  const en = lang === 'en';
  const L = [];
  L.push(en ? 'Study Focus Fox — my progress' : 'Study Focus Fox — tiến độ của tôi');
  L.push(en ? `Streak: ${snap.streak} days` : `Chuỗi: ${snap.streak} ngày`);
  L.push(en ? `Cards mastered: ${snap.mastered}/${snap.cards}` : `Thẻ đã thuộc: ${snap.mastered}/${snap.cards}`);
  L.push(en ? `Sessions done: ${snap.days}/${snap.total}` : `Ca đã xong: ${snap.days}/${snap.total}`);
  if (snap.grade !== null) L.push((en ? 'Term average: ' : 'ĐTB học kì: ') + snap.grade.toFixed(1));
  if (snap.plan !== null) L.push((en ? 'Plan: ' : 'Kế hoạch: ') + snap.plan + '%');
  if (snap.level > 1) L.push((en ? 'Arena level: ' : 'Cấp đấu trường: ') + snap.level);
  return L.join('\n');
}

/* =========================================================
   ROUTE · SHARE  #/share
   ========================================================= */
function renderShare() {
  const L = i18nLang(), en = L === 'en';
  const snap = shSnapshot();

  $('#main').innerHTML = `<section class="wrap wide sy-page">
    ${pageHead(en ? 'Share your progress' : 'Khoe tiến độ',
    en ? 'a card built from real numbers' : 'tấm thiệp dựng từ số thật',
    en
      ? 'Every figure on this card comes from your own study data. There is no name, no email, and nothing about what you wrote — share it or do not, nothing changes in your progress.'
      : 'Mọi con số trên thiệp lấy từ dữ liệu học của chính bạn. Không có tên, không email, không lộ nội dung ghi chú — khoe hay không thì tiến độ vẫn vậy.')}

    <div class="sh-grid">
      <div class="sh-prev">
        <canvas id="shCanvas" width="${SH_W}" height="${SH_H}"
          aria-label="${en ? 'Progress card preview' : 'Xem trước thiệp tiến độ'}"></canvas>
      </div>
      <div class="sh-side">
        <div class="sh-kpi">
          <div><b>${snap.streak}</b><span>${en ? 'day streak' : 'ngày liên tiếp'}</span></div>
          <div><b>${snap.mastered}</b><span>${en ? 'mastered' : 'đã thuộc'}</span></div>
          <div><b>${Math.round(snap.minutes / 60 * 10) / 10}</b><span>${en ? 'hours' : 'giờ'}</span></div>
          <div><b>${snap.days}/${snap.total}</b><span>${en ? 'sessions' : 'ca học'}</span></div>
        </div>
        <div class="sy-btnrow">
          <button class="btn" id="shPng">${en ? 'Download image' : 'Tải ảnh'}</button>
          <button class="btn ghost sm" id="shCopy">${en ? 'Copy text' : 'Chép chữ'}</button>
        </div>
        <p class="sy-note">${en
      ? 'The image is 1200×630, the size chat apps and social previews expect. It is rendered on your device and never uploaded.'
      : 'Ảnh 1200×630 — đúng tỉ lệ khung xem trước của ứng dụng chat và mạng xã hội. Ảnh vẽ ngay trên máy bạn, không tải lên đâu cả.'}</p>
        <div class="sh-note">
          <span class="kicker">${en ? 'What is on the card' : 'Trên thiệp có gì'}</span>
          <ul>
            <li>${en ? 'streak, cards mastered, hours, sessions' : 'chuỗi ngày, thẻ đã thuộc, số giờ, số ca'}</li>
            <li>${en ? 'term average (if you use the grade book)' : 'ĐTB học kì (nếu bạn dùng sổ điểm)'}</li>
            <li>${en ? 'plan completion and arena level' : 'mức hoàn thành kế hoạch và cấp đấu trường'}</li>
            <li><s>${en ? 'your name, email, notes, answers' : 'tên, email, ghi chú, đáp án của bạn'}</s></li>
          </ul>
        </div>
      </div>
    </div>
  </section>`;

  const cv = $('#shCanvas');
  const drew = shDraw(cv, snap, L);
  if (!drew) {
    /* No canvas → hide the preview, keep the text card usable. */
    const box = cv.closest('.sh-prev');
    if (box) box.innerHTML = '<p class="sy-note" style="margin:0">'
      + (en ? 'This browser cannot draw the image. Use “Copy text” below — it carries the same numbers.'
        : 'Trình duyệt này không vẽ được ảnh. Dùng “Chép chữ” bên dưới — số liệu y hệt.')
      + '</p>';
    const png = $('#shPng');
    if (png) png.disabled = true;
  }

  const pngBtn = $('#shPng');
  if (pngBtn) pngBtn.onclick = () => {
    try {
      if (!cv.toBlob) throw new Error('no toBlob');
      cv.toBlob(b => {
        if (!b) return toast(en ? 'Could not render the image' : 'Không vẽ được ảnh');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(b);
        a.download = 'study-focus-fox-' + new Date().toISOString().slice(0, 10) + '.png';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
        toast(en ? 'Image saved' : 'Đã lưu ảnh');
      }, 'image/png');
    } catch (e) {
      toast(en ? 'This browser blocked the download' : 'Trình duyệt chặn tải ảnh');
    }
  };

  $('#shCopy').onclick = () => {
    const txt = shText(snap, L);
    const done = () => toast(en ? 'Copied — paste it anywhere' : 'Đã chép — dán vào đâu cũng được');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(done).catch(() => fallback());
    } else fallback();
    function fallback() {
      const ta = document.createElement('textarea');
      ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { toast(txt); }
      ta.remove();
    }
  };
}
