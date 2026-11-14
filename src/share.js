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

/* =========================================================
   SHAREABLE LESSONS  ·  #/share/lesson/<day>/<session>
   ---------------------------------------------------------
   A lesson is already a real URL (#/lesson/3/2), so the hard part is
   not the link — it is making a link that is *worth opening*:

     · it must carry the state the learner is at, so the recipient sees
       the same thing, not a generic front page;
     · it must survive being pasted into a chat, a printout, or a QR
       scan, so every format has to be generated rather than linked;
     · it must never require an account, an upload, or the network.

   Three formats, all produced on the device:
     1. a plain link            — for messages
     2. a QR code (SVG)         — for paper, the classroom screen, a
                                  projector, or a phone handed across a desk
     3. a standalone .html file — for the recipient who has no site open;
                                  self-contained, opens offline

   The QR encoder below is a byte-mode, error-correction-level-M
   implementation of ISO/IEC 18004 v1-10. Small enough to be auditable,
   and it removes the dependency on a CDN — a QR library is exactly the
   kind of thing that quietly breaks an offline-first page.
   ========================================================= */

/* ---------- 1. what gets shared ---------- */
function shLessonUrl(d, s) {
  const base = location.origin === 'null' || !location.origin
    ? '' : location.origin + location.pathname;
  const h = '#/lesson/' + d + '/' + s;
  /* The hash is not sent to a server, so the full URL is what people paste.
     Keep it short: a QR at 6 characters of path is far denser than one at 60. */
  return (base || '') + h;
}

function shLessonData(dn, sn) {
  const d = DAYS.find(x => x.n === +dn);
  const s = d && d.sessions.find(x => x.n === +sn);
  if (!d || !s) return null;
  return {
    d: d.n, s: s.n, title: s.title, obj: s.obj, f: s.f || '',
    day: d.title, theme: d.theme, phase: d.phase,
    time: s.time, label: s.label, videos: (s.v || []).slice(),
  };
}

/* The text version — what goes in a chat message. Deliberately short: a wall
   of text gets skipped, a headline plus a link gets opened. */
function shLessonText(L, en) {
  const out = [];
  out.push((en ? 'Day ' : 'Ngày ') + String(L.d).padStart(2, '0') + ' · ' + L.title);
  if (L.f) out.push(shStripTags(L.f));
  out.push(shLessonUrl(L.d, L.s));
  return out.join('\n');
}

/* Formula strings in the plan carry <sup>/<sub>. For text output they have to
   become real characters, not tags — this is why the share text is not just
   the innerHTML. */
function shStripTags(html) {
  return String(html)
    .replace(/<sup>\s*2\s*<\/sup>/gi, '²')
    .replace(/<sup>\s*3\s*<\/sup>/gi, '³')
    .replace(/<sup>\s*(-?\d+)\s*<\/sup>/gi, '^$1')
    .replace(/<sub>\s*(\d+)\s*<\/sub>/gi, '$1')
    .replace(/<sub>\s*([A-Za-z]+)\s*<\/sub>/gi, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ---------- 2. QR encoder (byte mode, ECC level M) ----------
   Standard-derived tables. Version 1-10 is plenty: a lesson URL is under
   120 characters, and version 10-M holds 213 bytes. Going higher would
   add tables for no benefit. */
const QR_ECC_M = [ /* [ecCodewordsPerBlock, [blocksPerGroup, dataCodewords]] per version */
  null,
  [10, [[1, 16]]], [16, [[1, 28]]], [26, [[1, 44]]], [18, [[2, 32]]],
  [24, [[2, 43]]], [16, [[4, 27]]], [18, [[4, 31]]], [22, [[2, 38], [2, 39]]],
  [22, [[3, 36], [2, 37]]], [26, [[4, 43], [1, 44]]],
];
/* Alignment pattern centres per version (ISO table E.1). */
const QR_ALIGN = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
  [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];
const QR_ECL_M_BITS = 0; /* format-info bits for level M = 00 */

function qrGfMul(x, y) {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z & 0xff;
}
function qrRsDivisor(degree) {
  const r = new Array(degree).fill(0);
  r[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      r[j] = qrGfMul(r[j], root);
      if (j + 1 < degree) r[j] ^= r[j + 1];
    }
    root = qrGfMul(root, 2);
  }
  return r;
}
function qrRsRemainder(data, div) {
  const res = div.map(() => 0);
  for (const b of data) {
    const factor = b ^ res.shift();
    res.push(0);
    for (let i = 0; i < div.length; i++) res[i] ^= qrGfMul(div[i], factor);
  }
  return res;
}

/* UTF-8 by hand rather than TextEncoder: the encoder is four lines of
   arithmetic, and removing the dependency means a QR can be produced in every
   environment the page runs in — including the ones that lack the global. */
function qrUtf8(str) {
  const out = [];
  for (const ch of str) {
    let c = ch.codePointAt(0);
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return out;
}

/* Build the module matrix. Returns {size, cells} where cells[y][x] is 1/0. */
function qrEncode(text) {
  const bytes = qrUtf8(text);
  let ver = 0;
  for (let v = 1; v <= 10; v++) {
    const cap = QR_ECC_M[v][1].reduce((a, g) => a + g[0] * g[1], 0);
    const need = 4 + (v <= 9 ? 8 : 16) + bytes.length * 8;
    if (need <= cap * 8) { ver = v; break; }
  }
  if (!ver) return null; /* too long — caller falls back to no QR */

  /* --- data bit stream --- */
  const bits = [];
  const push = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
  push(4, 4);                       /* byte mode */
  push(bytes.length, ver <= 9 ? 8 : 16);
  for (const b of bytes) push(b, 8);
  const totalData = QR_ECC_M[ver][1].reduce((a, g) => a + g[0] * g[1], 0);
  const cap = totalData * 8;
  push(0, Math.min(4, cap - bits.length)); /* terminator */
  while (bits.length % 8) bits.push(0);
  const dataCw = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
    dataCw.push(b);
  }
  for (let pad = 0xec; dataCw.length < totalData; pad ^= 0xec ^ 0x11) dataCw.push(pad);

  /* --- split into blocks, add ECC --- */
  const eccLen = QR_ECC_M[ver][0];
  const blocks = [];
  let off = 0;
  for (const [count, len] of QR_ECC_M[ver][1]) {
    for (let i = 0; i < count; i++) { blocks.push(dataCw.slice(off, off + len)); off += len; }
  }
  const div = qrRsDivisor(eccLen);
  const eccBlocks = blocks.map(b => qrRsRemainder(b, div));

  /* --- interleave --- */
  const maxData = Math.max(...blocks.map(b => b.length));
  const out = [];
  for (let i = 0; i < maxData; i++) for (const b of blocks) if (i < b.length) out.push(b[i]);
  for (let i = 0; i < eccLen; i++) for (const b of eccBlocks) out.push(b[i]);

  /* --- matrix --- */
  const size = ver * 4 + 17;
  const m = Array.from({ length: size }, () => new Array(size).fill(0));
  const fn = Array.from({ length: size }, () => new Array(size).fill(0)); /* function modules */
  const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < size && y < size) { m[y][x] = v; fn[y][x] = 1; } };

  for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0 ? 1 : 0); set(i, 6, i % 2 === 0 ? 1 : 0); }
  const finder = (cx, cy) => {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const d = Math.max(Math.abs(dx), Math.abs(dy));
      set(cx + dx, cy + dy, (d !== 2 && d !== 4) ? 1 : 0);
    }
  };
  finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
  for (const ay of QR_ALIGN[ver]) for (const ax of QR_ALIGN[ver]) {
    if ((ax === 6 && ay === 6) || (ax === 6 && ay === size - 7) || (ax === size - 7 && ay === 6)) continue;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      set(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1 ? 1 : 0);
    }
  }
  /* Version 7 and up carry an 18-bit version block in two corners. I left it
     out at first; versions 1-6 scanned fine and 7-10 were silently
     undecodable — a failure that would only ever have shown up on a long URL. */
  if (ver >= 7) {
    let remV = ver;
    for (let i = 0; i < 12; i++) remV = (remV << 1) ^ ((remV >>> 11) * 0x1f25);
    const vb = (ver << 12) | remV;
    for (let i = 0; i < 18; i++) {
      const bit = (vb >>> i) & 1;
      const a = size - 11 + (i % 3), b = Math.floor(i / 3);
      set(a, b, bit);   /* top-right */
      set(b, a, bit);   /* bottom-left */
    }
  }

  /* Reserve the format areas — but skip i === 6 on both axes. Those two
     modules belong to the timing lines, and zeroing them (which is what this
     loop did at first) breaks the alternating pattern a scanner relies on to
     tell rows from columns. */
  for (let i = 0; i < 9; i++) {
    if (i !== 6) { set(i, 8, 0); set(8, i, 0); }
  }
  for (let i = 0; i < 8; i++) { set(size - 1 - i, 8, 0); set(8, size - 1 - i, 0); }
  set(8, size - 8, 1); /* dark module */

  /* --- place data with the zig-zag --- */
  let bi = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (!fn[y][x] && bi < out.length * 8) {
          m[y][x] = (out[bi >>> 3] >>> (7 - (bi & 7))) & 1;
          bi++;
        }
      }
    }
  }
  /* --- masks --- */
  const maskFn = [
    (x, y) => (x + y) % 2 === 0,
    (x, y) => y % 2 === 0,
    (x, y) => x % 3 === 0,
    (x, y) => (x + y) % 3 === 0,
    (x, y) => (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0,
    (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
    (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
    (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
  ];
  /* Coordinates here are (x, y) — writing mat[y][x] by hand transposed the
     whole format block, and the result still *looked* like a QR while being
     undecodable. Every scan failed until this was fixed. */
  const drawFormat = (mat, mask) => {
    const put = (x, y, v) => { mat[y][x] = v; };
    const d = (QR_ECL_M_BITS << 3) | mask;
    let rem = d;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const b = ((d << 10) | rem) ^ 0x5412;
    for (let i = 0; i <= 5; i++) put(8, i, (b >>> i) & 1);
    put(8, 7, (b >>> 6) & 1);
    put(8, 8, (b >>> 7) & 1);
    put(7, 8, (b >>> 8) & 1);
    for (let i = 9; i < 15; i++) put(14 - i, 8, (b >>> i) & 1);
    for (let i = 0; i < 8; i++) put(size - 1 - i, 8, (b >>> i) & 1);
    for (let i = 8; i < 15; i++) put(8, size - 15 + i, (b >>> i) & 1);
    put(8, size - 8, 1);
  };
  let best = null, bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    const t = m.map(r => r.slice());
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      if (!fn[y][x] && maskFn[mask](x, y)) t[y][x] ^= 1;
    }
    drawFormat(t, mask);
    const sc = qrPenalty(t, size);
    if (sc < bestScore) { bestScore = sc; best = t; }
  }
  return { size, cells: best };
}

/* Penalty scoring from the spec — picks the mask that scans most reliably. */
function qrPenalty(t, size) {
  let p = 0;
  const runScore = line => {
    let s = 0, run = 1;
    for (let i = 1; i < line.length; i++) {
      if (line[i] === line[i - 1]) { run++; }
      else { if (run >= 5) s += 3 + (run - 5); run = 1; }
    }
    if (run >= 5) s += 3 + (run - 5);
    return s;
  };
  const pattern = [1, 0, 1, 1, 1, 0, 1];
  for (let y = 0; y < size; y++) {
    p += runScore(t[y]);
    const row = t[y];
    for (let x = 0; x + 7 <= size; x++) {
      let hit = true;
      for (let k = 0; k < 7; k++) if (row[x + k] !== pattern[k]) { hit = false; break; }
      if (hit) {
        const before = x >= 4 && !row[x - 1] && !row[x - 2] && !row[x - 3] && !row[x - 4];
        const after = x + 11 <= size && !row[x + 7] && !row[x + 8] && !row[x + 9] && !row[x + 10];
        if (before || after) p += 40;
      }
    }
  }
  for (let x = 0; x < size; x++) {
    const col = [];
    for (let y = 0; y < size; y++) col.push(t[y][x]);
    p += runScore(col);
  }
  for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) {
    const v = t[y][x];
    if (v === t[y][x + 1] && v === t[y + 1][x] && v === t[y + 1][x + 1]) p += 3;
  }
  let dark = 0;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) dark += t[y][x];
  const pct = Math.round(dark * 100 / (size * size));
  p += Math.floor(Math.abs(pct - 50) / 5) * 10;
  return p;
}

/* Render to an SVG path string — one <path> for the whole thing, so a QR at
   any size costs ~150 bytes of markup instead of thousands of <rect>s. */
function qrSvg(text, px) {
  const q = qrEncode(text);
  if (!q) return null;
  const n = q.size, quiet = 4, dim = n + quiet * 2;
  let d = '';
  for (let y = 0; y < n; y++) {
    let x = 0;
    while (x < n) {
      if (!q.cells[y][x]) { x++; continue; }
      let w = 1;
      while (x + w < n && q.cells[y][x + w]) w++;
      d += 'M' + (x + quiet) + ' ' + (y + quiet) + 'h' + w + 'v1h-' + w + 'z';
      x += w;
    }
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + dim + ' ' + dim +
    '" width="' + (px || 240) + '" height="' + (px || 240) + '" shape-rendering="crispEdges" ' +
    'role="img" aria-label="QR: ' + esc(text) + '">' +
    '<rect width="' + dim + '" height="' + dim + '" fill="#fff"/>' +
    '<path d="' + d + '" fill="#17150f"/></svg>';
}

/* ---------- 3. standalone lesson file ----------
   One self-contained HTML document. No scripts from anywhere, no fonts to
   fetch, no images — the recipient can open it on a plane. It is also the
   printout: @media print turns it into a clean A4 sheet. */
function shLessonFile(L, en) {
  const t = s => esc(s);
  const formula = L.f ? '<div class="f">' + L.f + '</div>' : '';
  const vids = L.videos.length
    ? '<p class="v">' + (en ? 'Lectures' : 'Bài giảng') + ': ' +
      L.videos.map(v => '<a href="https://youtu.be/' + t(v) + '">' + t(v) + '</a>').join(' · ') + '</p>'
    : '';
  return '<!doctype html><html lang="' + (en ? 'en' : 'vi') + '"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + t(L.title) + ' — Study Focus Fox</title>' +
    '<style>' +
    '*{box-sizing:border-box}body{margin:0;padding:40px 24px;background:#f4f1ea;color:#17150f;' +
    'font:16px/1.65 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
    '.card{max-width:720px;margin:0 auto;background:#fcf9f2;border:1px solid #dbd5c6;padding:40px}' +
    '.k{font:500 11px/1 ui-monospace,Menlo,monospace;letter-spacing:.1em;text-transform:uppercase;color:#7a7264}' +
    'h1{font:400 30px/1.25 Georgia,"Times New Roman",serif;margin:10px 0 6px}' +
    'h2{font:500 12px/1 ui-monospace,Menlo,monospace;letter-spacing:.1em;text-transform:uppercase;' +
    'color:#c6542d;margin:30px 0 10px;padding-bottom:8px;border-bottom:1px solid #dbd5c6}' +
    'p{margin:0 0 12px}.f{background:#f4f1ea;border-left:3px solid #c6542d;padding:14px 16px;' +
    'font:15px/1.9 Georgia,serif;margin:12px 0;overflow-x:auto}' +
    '.v{font:12px/1.8 ui-monospace,Menlo,monospace;color:#7a7264}.v a{color:#a53e20}' +
    'sup,sub{font-size:.7em}.foot{margin-top:34px;padding-top:14px;border-top:1px solid #dbd5c6;' +
    'font:11px/1.6 ui-monospace,Menlo,monospace;color:#7a7264}' +
    '@media print{body{background:#fff;padding:0}.card{border:0;padding:0}}' +
    '</style></head><body><div class="card">' +
    '<div class="k">' + (en ? 'Day ' : 'Ngày ') + String(L.d).padStart(2, '0') +
    ' · ' + t(L.theme || '') + ' · ' + t(L.time) + '</div>' +
    '<h1>' + t(L.title) + '</h1>' +
    '<p class="k">' + t(L.day) + '</p>' +
    '<h2>' + (en ? 'What this session is for' : 'Mục tiêu ca học') + '</h2>' +
    '<p>' + t(shStripTags(L.obj || '')) + '</p>' +
    (L.f ? '<h2>' + (en ? 'Formulas to have in hand' : 'Công thức cần nắm') + '</h2>' + formula : '') +
    vids +
    '<div class="foot">Study Focus Fox · ' +
    (en ? 'made offline, shared as a file' : 'tạo offline, chia sẻ dạng tệp') +
    ' · ' + new Date().toISOString().slice(0, 10) + '</div>' +
    '</div></body></html>';
}

/* ---------- 4. the route ---------- */
function renderShareLesson(dn, sn) {
  const L = shLessonData(dn, sn);
  if (!L) { go('#/'); return; }
  const lang = i18nLang(), en = lang === 'en';
  const url = shLessonUrl(L.d, L.s);
  const qr = qrSvg(url, 220);

  $('#main').innerHTML = `<section class="wrap">
    <div class="crumb"><a href="#/">${en ? 'Plan' : 'Lộ trình'}</a><span>/</span>
      <a href="#/lesson/${L.d}/${L.s}">${en ? 'Lesson' : 'Bài học'} ${String(L.d).padStart(2, '0')}.${L.s}</a><span>/</span>
      <span>${en ? 'Share' : 'Chia sẻ'}</span></div>
    <div class="sy-hero" style="margin-top:6px">
      <h1 style="font-size:26px">${esc(L.title)}</h1>
      <p class="sy-lede">${en
      ? 'Send this to a classmate, put it on the board, or print it. The link opens exactly this lesson — nothing else to install.'
      : 'Gửi cho bạn cùng lớp, chiếu lên bảng, hoặc in ra. Đường dẫn mở đúng bài này — không phải cài gì.'}</p>
    </div>

    <div class="shl-grid">
      <div class="shl-main">
        <label class="shl-lbl" for="shlUrl">${en ? 'Link' : 'Đường dẫn'}</label>
        <div class="shl-link">
          <input id="shlUrl" type="text" readonly value="${esc(url)}" spellcheck="false">
          <button class="btn sm" id="shlCopy">${en ? 'Copy' : 'Chép'}</button>
        </div>

        <label class="shl-lbl">${en ? 'Message text' : 'Nội dung tin nhắn'}</label>
        <textarea id="shlText" rows="5" readonly class="shl-ta">${esc(shLessonText(L, en))}</textarea>
        <div class="sy-btnrow">
          <button class="btn ghost sm" id="shlCopyText">${en ? 'Copy text' : 'Chép nội dung'}</button>
          <button class="btn ghost sm" id="shlFile">${en ? 'Save .html' : 'Lưu .html'}</button>
          <a class="btn ghost sm" href="#/lesson/${L.d}/${L.s}">${en ? 'Open lesson' : 'Mở bài học'}</a>
        </div>
        <p class="sy-note">${en
      ? 'The .html file is one document that opens offline on any device — the version to send when you do not know whether the other person has the site.'
      : 'Tệp .html là một tài liệu mở được offline trên máy nào cũng được — dùng khi không rõ người nhận có trang này hay không.'}</p>
      </div>

      <div class="shl-side">
        <div class="shl-qr">${qr || `<p class="sy-note">${en ? 'Link too long for a QR code.' : 'Đường dẫn quá dài để tạo mã QR.'}</p>`}</div>
        <p class="sy-note" style="text-align:center;margin-top:8px">${en
      ? 'Point a phone camera at this. Works on a printout.'
      : 'Đưa camera điện thoại vào mã này. In ra giấy vẫn quét được.'}</p>
      </div>
    </div>

    <div class="shl-prev">
      <span class="kicker">${en ? 'What they will see' : 'Người nhận sẽ thấy'}</span>
      <div class="shl-prevbody">
        <div class="kicker">${en ? 'Day' : 'Ngày'} ${String(L.d).padStart(2, '0')} · ${esc(L.theme || '')} · ${esc(L.time)}</div>
        <h3>${esc(L.title)}</h3>
        <p class="sy-note">${esc(shStripTags(L.obj || ''))}</p>
        ${L.f ? `<div class="sp-fbox">${L.f}</div>` : ''}
      </div>
    </div>
  </section>`;

  const copy = (txt) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt)
        .then(() => toast(en ? 'Copied' : 'Đã chép'))
        .catch(() => toast(en ? 'Copy blocked — select and copy by hand' : 'Không chép được — bôi đen rồi chép tay'));
    } else {
      const ta = document.createElement('textarea');
      ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast(en ? 'Copied' : 'Đã chép'); } catch (e) { toast(txt); }
      ta.remove();
    }
  };
  $('#shlCopy').onclick = () => copy(url);
  $('#shlCopyText').onclick = () => copy(shLessonText(L, en));
  $('#shlFile').onclick = () => {
    try {
      const blob = new Blob([shLessonFile(L, en)], { type: 'text/html;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'bai-' + String(L.d).padStart(2, '0') + '-' + L.s + '.html';
      document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
      toast(en ? 'Saved' : 'Đã lưu');
    } catch (e) {
      toast(en ? 'This browser blocked the download' : 'Trình duyệt chặn tải tệp');
    }
  };
  const inp = $('#shlUrl');
  inp.onclick = () => { inp.select(); };
}
