/* =========================================================
   PIXEL ARENA — học bằng cách chơi
   ---------------------------------------------------------
   Nghiên cứu: Study Bunny (xu cho mỗi phút tập trung), Forest (phần
   thưởng hữu hình), memoryOS (luyện trí nhớ có gamification), Todait
   (đo thời gian theo môn). Điểm chung đáng học: **phần thưởng phải trả
   giá được**, không phải huy hiệu rỗng.

   Nhưng có một thứ các app đó làm sai: trả lời sai thì chỉ "sai". Ở đây
   trả lời sai **bị đánh trả** và **câu đó quay lại ngay trong trận** —
   đúng vòng lặp học tập: sai → sửa → gặp lại → đúng.

   Ba bộ sinh câu, mỗi bộ sinh VÔ HẠN (random hoá tham số), nên không
   bao giờ cạn đề và không phải nhớ 500 câu mẫu:
     · Vật lí  — tính toán theo công thức, có đơn vị
     · Toán    — số học, phân số, phần trăm, phương trình bậc 1
     · Ngữ pháp tiếng Anh — chia thì, giới từ, mạo từ, so sánh

   Vẽ bằng CSS, không dùng <canvas>: chữ vẫn chọn/đọc được, in được, và
   CSP không phải nới. Mọi thứ lưu trong state.game.
   ========================================================= */

/* ---------- pixel sprites (thuần CSS, không ảnh) ---------- */
const GM_SPRITE = {
  hero: [
    '..1111..',
    '.122221.',
    '.123321.',
    '.122221.',
    '..1111..',
    '.144441.',
    '11444411',
    '.1.44.1.',
  ],
  slime: [
    '........',
    '..111...',
    '.12221..',
    '1233321.',
    '1233321.',
    '1222221.',
    '.11111..',
    '........',
  ],
  bat: [
    '........',
    '1......1',
    '11.11.11',
    '11222211',
    '.122221.',
    '..1221..',
    '...11...',
    '........',
  ],
  boss: [
    '.11..11.',
    '11111111',
    '12222221',
    '12333321',
    '12322321',
    '12222221',
    '.111111.',
    '..1..1..',
  ],
};

const GM_ENEMIES = [
  { id: 'slime', name: { vi: 'Slime', en: 'Slime' }, hp: 3, dmg: 1, art: 'slime' },
  { id: 'bat', name: { vi: 'Dơi', en: 'Bat' }, hp: 4, dmg: 1, art: 'bat' },
  { id: 'boss', name: { vi: 'Trùm', en: 'Boss' }, hp: 6, dmg: 2, art: 'boss' },
];

function gmSprite(name, cls) {
  const rows = GM_SPRITE[name] || GM_SPRITE.hero;
  return `<div class="px ${cls || ''}" aria-hidden="true">${rows.map(r => `<span>${[...r].map(c =>
    c === '.' ? '<i></i>' : `<i class="c${c}"></i>`).join('')}</span>`).join('')}</div>`;
}

/* ---------- state ---------- */
function gmState() {
  if (!state.game || typeof state.game !== 'object') state.game = {};
  const G = state.game;
  if (!isFinite(G.coins)) G.coins = 0;
  if (!isFinite(G.best)) G.best = 0;
  if (!isFinite(G.level)) G.level = 1;
  if (!isFinite(G.wins)) G.wins = 0;
  if (!G.diff || typeof G.diff !== 'object') G.diff = { phys: 1, math: 1, eng: 1, chem: 1 };
  if (!G.seen || typeof G.seen !== 'object') G.seen = {};
  return G;
}

/* =========================================================
   CÂU HỎI SINH TỰ ĐỘNG
   Mỗi hàm trả { q, a, unit, hint } — a là chuỗi đã chuẩn hoá để so.
   ========================================================= */
const gmRnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const gmPick = arr => arr[Math.floor(Math.random() * arr.length)];
const gmNum = v => {
  const r = Math.round(v * 100) / 100;
  return String(r).replace('.', ',');
};

/* --- VẬT LÍ: dùng đúng công thức lớp 9 --- */
function gmGenPhysics(diff) {
  const d = Math.max(1, Math.min(4, diff || 1));
  /* lv1: một bước; lv3+: hai bước, phải đổi đơn vị */
  const kinds = d >= 3 ? ['ohm', 'power', 'series', 'work', 'density'] : ['ohm', 'series', 'work', 'speed', 'density'];
  const k = gmPick(kinds);
  if (k === 'ohm') {
    const R = gmRnd(2, 20) * (d >= 3 ? 5 : 1);
    const I = gmRnd(1, 5) / 10;              /* 0,1 – 0,5 A */
    const U = +(R * I).toFixed(2);
    return { q: `U = ? khi R = ${R} Ω và I = ${gmNum(I)} A`, a: gmNum(U), unit: 'V', hint: 'U = I × R' };
  }
  if (k === 'power') {
    const R = gmRnd(5, 40), I = gmRnd(1, 4) / 10;
    const P = +(R * I * I).toFixed(2);
    return { q: `P = ? khi R = ${R} Ω và I = ${gmNum(I)} A`, a: gmNum(P), unit: 'W', hint: 'P = I² × R' };
  }
  if (k === 'series') {
    const R1 = gmRnd(2, 15), R2 = gmRnd(2, 15), U = gmRnd(3, 24);
    const Rt = R1 + R2, I = +(U / Rt).toFixed(3);
    return {
      q: `R₁ = ${R1} Ω, R₂ = ${R2} Ω mắc nối tiếp, U = ${U} V. I = ?`,
      a: gmNum(I), unit: 'A', hint: 'R = R₁ + R₂ rồi I = U / R',
    };
  }
  if (k === 'work') {
    const F = gmRnd(10, 90), s = gmRnd(2, 12);
    return { q: `A = ? khi F = ${F} N và quãng đường s = ${s} m`, a: String(F * s), unit: 'J', hint: 'A = F × s' };
  }
  if (k === 'speed') {
    const s = gmRnd(20, 200), tm = gmRnd(2, 20);
    return { q: `v = ? khi đi ${s} m trong ${tm} s`, a: gmNum(s / tm), unit: 'm/s', hint: 'v = s / t' };
  }
  /* density */
  const m = gmRnd(50, 900), V = gmRnd(20, 300);
  return { q: `D = ? khi m = ${m} g và V = ${V} cm³`, a: gmNum(m / V), unit: 'g/cm³', hint: 'D = m / V' };
}

/* --- TOÁN --- */
function gmGenMath(diff) {
  const d = Math.max(1, Math.min(4, diff || 1));
  const k = gmPick(d >= 3 ? ['linear', 'percent', 'fraction', 'ratio'] : ['arith', 'percent', 'arith', 'fraction']);
  if (k === 'arith') {
    const a = gmRnd(12, 99), b = gmRnd(3, 12);
    return gmPick([
      { q: `${a} × ${b} = ?`, a: String(a * b) },
      { q: `${a * b} ÷ ${b} = ?`, a: String(a) },
      { q: `${a} + ${b * 7} = ?`, a: String(a + b * 7) },
    ]);
  }
  if (k === 'percent') {
    const p = gmPick([5, 10, 15, 20, 25, 40]), n = gmRnd(2, 40) * 20;
    return { q: `${p}% của ${n} = ?`, a: gmNum(n * p / 100) };
  }
  if (k === 'fraction') {
    const a = gmRnd(1, 5), b = gmRnd(2, 7), c = gmRnd(1, 5), e = gmRnd(2, 7);
    /* cộng hai phân số cùng mẫu cho dễ kiểm */
    if (Math.random() < 0.5) {
      const den = b;
      const num = a + Math.min(c, den - a);
      return { q: `${a}/${den} + ${num - a}/${den} = ? (nhập dạng a/b)`, a: `${num}/${den}` };
    }
    return { q: `Rút gọn: ${a * 2}/${b * 2} = ? (nhập dạng a/b)`, a: `${a}/${b}` };
  }
  if (k === 'ratio') {
    const x = gmRnd(2, 12), r = gmRnd(2, 5);
    return { q: `x : ${x * r} = 1 : ${r}. x = ?`, a: String(x) };
  }
  /* linear: 2x + b = c */
  const a = gmRnd(2, 9), x = gmRnd(1, 12), b = gmRnd(1, 20);
  return { q: `Giải: ${a}x + ${b} = ${a * x + b}. x = ?`, a: String(x) };
}

/* --- NGỮ PHÁP TIẾNG ANH --- */
const GM_ENG = [
  { q: 'She ___ to school every day.', a: ['goes'], opts: ['go', 'goes', 'going', 'gone'] },
  { q: 'They ___ football yesterday.', a: ['played'], opts: ['play', 'played', 'playing', 'plays'] },
  { q: 'I ___ here since 2020.', a: ['have lived', 'have been living'], opts: ['live', 'lived', 'have lived', 'am living'] },
  { q: 'He is good ___ maths.', a: ['at'], opts: ['in', 'at', 'on', 'for'] },
  { q: 'She is interested ___ physics.', a: ['in'], opts: ['on', 'at', 'in', 'of'] },
  { q: 'This is ___ apple.', a: ['an'], opts: ['a', 'an', 'the', '—'] },
  { q: 'He is ___ than his brother.', a: ['taller'], opts: ['tall', 'taller', 'tallest', 'more tall'] },
  { q: 'If it ___ tomorrow, we will stay home.', a: ['rains'], opts: ['rain', 'rains', 'rained', 'will rain'] },
  { q: 'The book ___ by Nguyen Du.', a: ['was written'], opts: ['wrote', 'was written', 'has wrote', 'is write'] },
  { q: 'I look forward to ___ you.', a: ['seeing'], opts: ['see', 'seeing', 'saw', 'seen'] },
  { q: 'She asked me where I ___.', a: ['lived'], opts: ['live', 'lived', 'living', 'lives'] },
  { q: 'Neither of them ___ ready.', a: ['is'], opts: ['is', 'are', 'be', 'were'] },
];

function gmGenEng(diff) {
  const d = Math.max(1, Math.min(4, diff || 1));
  const pool = d >= 3 ? GM_ENG : GM_ENG.slice(0, 6);
  const it = gmPick(pool);
  return { q: it.q, a: it.a, opts: it.opts, kind: 'choice' };
}

/* --- HOÁ: cân bằng đơn giản, mol --- */
function gmGenChem(diff) {
  const d = Math.max(1, Math.min(4, diff || 1));
  const k = gmPick(d >= 3 ? ['mol', 'conc', 'mass'] : ['mol', 'mass']);
  if (k === 'mol') {
    const M = gmPick([18, 23, 40, 44, 58.5, 98]);
    const n = gmRnd(1, 5) / 2;
    return { q: `n = ? khi m = ${gmNum(M * n)} g và M = ${M} g/mol`, a: gmNum(n), unit: 'mol', hint: 'n = m / M' };
  }
  if (k === 'conc') {
    const n = gmRnd(1, 10) / 10, V = gmRnd(1, 5) / 10;
    return { q: `Cₘ = ? khi n = ${gmNum(n)} mol trong V = ${gmNum(V)} lít`, a: gmNum(n / V), unit: 'M', hint: 'Cₘ = n / V' };
  }
  const n = gmRnd(1, 4), M = gmPick([18, 40, 44]);
  return { q: `m = ? khi n = ${n} mol và M = ${M} g/mol`, a: String(n * M), unit: 'g', hint: 'm = n × M' };
}

const GM_GEN = { phys: gmGenPhysics, math: gmGenMath, eng: gmGenEng, chem: gmGenChem };

/* so khớp đáp án: chấp nhận 1,5 / 1.5 / 1,50 và chữ không phân biệt hoa thường */
function gmMatch(input, answer) {
  const norm = s => String(s == null ? '' : s).trim().toLowerCase()
    .replace(/\s+/g, ' ').replace(/,/g, '.');
  const a = norm(input), b = norm(answer);
  if (a === b) return true;
  /* số: so theo giá trị, chấp nhận 0,5% */
  const fa = parseFloat(a), fb = parseFloat(b);
  if (isFinite(fa) && isFinite(fb) && fb !== 0) {
    return Math.abs(fa - fb) / Math.abs(fb) < 0.005;
  }
  return false;
}

/* =========================================================
   TRẬN ĐẤU
   ========================================================= */
let GM = null;

function gmStart(topic) {
  const G = gmState();
  const diff = G.diff[topic] || 1;
  const foeIdx = Math.min(GM_ENEMIES.length - 1, Math.floor((G.level - 1) / 3));
  const foe = GM_ENEMIES[Math.min(foeIdx, GM_ENEMIES.length - 1)];
  GM = {
    topic, diff, foe,
    heroHp: 5, heroMax: 5,
    foeHp: foe.hp, foeMax: foe.hp,
    round: 0, right: 0, wrong: 0, combo: 0, bestCombo: 0,
    cur: null, queue: [],   /* queue = câu sai, quay lại ngay */
    over: false, won: false,
    log: [],
  };
  gmNext();
  renderGame();
}

function gmNext() {
  if (!GM || GM.over) return;
  /* A missed question comes back on the VERY NEXT turn, always.
     Earlier this was a 70% chance, which meant a student could miss a
     question and then not see it again for ten rounds — the opposite of
     error correction. Immediate re-testing after a mistake is the
     strongest evidenced pattern, and determinism makes it testable.
     It pays 1 coin instead of 2, so it cannot be farmed. */
  if (GM.queue.length) {
    GM.cur = GM.queue.shift();
    GM.cur.repeat = true;
  } else {
    GM.cur = GM_GEN[GM.topic](GM.diff);
    GM.cur.repeat = false;
  }
}

function gmAnswer(value) {
  if (!GM || GM.over || !GM.cur) return;
  const cur = GM.cur;
  GM.round++;
  const ok = Array.isArray(cur.a) ? cur.a.some(x => gmMatch(value, x)) : gmMatch(value, cur.a);

  if (ok) {
    GM.right++;
    GM.combo++;
    GM.bestCombo = Math.max(GM.bestCombo, GM.combo);
    /* sát thương: 1 + thưởng combo, tối đa 3 */
    const dmg = Math.min(3, 1 + Math.floor(GM.combo / 3));
    GM.foeHp = Math.max(0, GM.foeHp - dmg);
    GM.log.unshift({ ok: true, txt: cur.q, dmg });
    const G = gmState();
    G.coins += cur.repeat ? 1 : 2;         /* câu từng sai trả ít hơn — không farm được */
    if (GM.foeHp <= 0) {
      GM.over = true; GM.won = true;
      G.wins++;
      G.coins += 10;
      /* lên cấp mỗi 3 trận thắng, và tăng độ khó của đúng môn đó */
      if (G.wins % 3 === 0) {
        G.level++;
        G.diff[GM.topic] = Math.min(4, (G.diff[GM.topic] || 1) + 1);
      }
    }
  } else {
    GM.wrong++;
    GM.combo = 0;
    GM.heroHp = Math.max(0, GM.heroHp - GM.foe.dmg);
    GM.log.unshift({ ok: false, txt: cur.q, ans: Array.isArray(cur.a) ? cur.a[0] : cur.a });
    /* câu sai vào hàng đợi để gặp lại trong chính trận này */
    if (!cur.repeat) GM.queue.push(cur);
    if (GM.heroHp <= 0) { GM.over = true; GM.won = false; }
  }
  save();

  if (GM.over) {
    const G = gmState();
    const score = GM.right * 10 - GM.wrong * 3 + GM.bestCombo * 2;
    if (score > G.best) G.best = score;
    GM.score = score;
    save();
  } else {
    gmNext();
  }
  renderGame();
}

/* =========================================================
   ROUTE · ĐẤU TRƯỜNG PIXEL  #/game
   ========================================================= */
function renderGame() {
  const G = gmState();
  const langNow = i18nLang();

  /* màn hình chọn môn khi chưa vào trận */
  if (!GM) {
    const topics = [
      { id: 'phys', name: langNow === 'en' ? 'Physics' : 'Vật lí', note: langNow === 'en' ? 'U = IR, P = I²R, series circuits' : 'U = IR, P = I²R, mạch nối tiếp', art: 'slime' },
      { id: 'math', name: langNow === 'en' ? 'Maths' : 'Toán', note: langNow === 'en' ? 'arithmetic, %, fractions, linear' : 'số học, %, phân số, phương trình', art: 'bat' },
      { id: 'eng', name: langNow === 'en' ? 'English grammar' : 'Ngữ pháp tiếng Anh', note: langNow === 'en' ? 'tenses, prepositions, articles' : 'thì, giới từ, mạo từ', art: 'slime' },
      { id: 'chem', name: langNow === 'en' ? 'Chemistry' : 'Hoá học', note: langNow === 'en' ? 'moles, concentration, mass' : 'mol, nồng độ, khối lượng', art: 'boss' },
    ];
    $('#main').innerHTML = `<section class="wrap wide sy-page">
      ${pageHead(tl('game_title'), tl('game_sub'),
      langNow === 'en'
        ? 'Every round generates a fresh question, so the arena never runs out. Wrong answers come back in the same battle — that is the point.'
        : 'Mỗi lượt sinh một câu mới nên không bao giờ cạn đề. Câu sai quay lại ngay trong chính trận đó — đó mới là chỗ học.')}

      <div class="pg-kpi">
        <div class="pg-k"><span class="kicker">${tl('game_coin')}</span><b>${G.coins}</b><em>${langNow === 'en' ? 'earned' : 'kiếm được'}</em></div>
        <div class="pg-k"><span class="kicker">${tl('level')}</span><b>${G.level}</b><em>${G.wins} ${langNow === 'en' ? 'wins' : 'trận thắng'}</em></div>
        <div class="pg-k"><span class="kicker">${tl('best')}</span><b>${G.best}</b><em>${tl('score')}</em></div>
      </div>

      <div class="gm-arena-select">
        ${topics.map(t => `<button class="gm-foe-card" data-topic="${t.id}">
          ${gmSprite(t.art, 'sm')}
          <b>${t.name}</b>
          <i>${t.note}</i>
          <span class="gm-lv">${tl('level')} ${G.diff[t.id] || 1}</span>
        </button>`).join('')}
      </div>
    </section>`;
    $$('[data-topic]').forEach(b => b.onclick = () => gmStart(b.dataset.topic));
    return;
  }

  /* màn hình trong trận */
  const cur = GM.cur;
  const hpPct = Math.round(GM.heroHp / GM.heroMax * 100);
  const foePct = Math.round(GM.foeHp / GM.foeMax * 100);

  $('#main').innerHTML = `<section class="wrap wide sy-page gm-battle">
    <div class="gm-bar">
      <button class="btn ghost sm" id="gmQuit">← ${langNow === 'en' ? 'Leave' : 'Rời trận'}</button>
      <span class="grow"></span>
      <span class="gm-stat">${tl('game_combo')} <b>${GM.combo}×</b></span>
      <span class="gm-stat">${tl('correct')} <b>${GM.right}</b></span>
      <span class="gm-stat">${tl('wrong')} <b>${GM.wrong}</b></span>
    </div>

    <div class="gm-stage">
      <div class="gm-side gm-side-hero">
        ${gmSprite('hero')}
        <div class="gm-hp"><i style="width:${hpPct}%"></i></div>
        <span class="gm-hp-t">${tl('game_hp')} ${GM.heroHp}/${GM.heroMax}</span>
      </div>

      <div class="gm-mid">
        ${GM.over ? `<div class="gm-over">
            <b>${GM.won ? tl('game_win') : tl('game_over')}</b>
            <span>${tl('score')} ${GM.score}</span>
            <span class="gm-over-sub">${GM.right} ${tl('correct')} · ${GM.wrong} ${tl('wrong')} · combo ${GM.bestCombo}×</span>
            <button class="btn sm" id="gmAgain">${tl('game_again')}</button>
            <button class="btn ghost sm" id="gmBack">${tl('back')}</button>
          </div>` : `<div class="gm-q">
            <span class="kicker">${GM.cur.repeat ? (langNow === 'en' ? 'RETRY — you missed this' : 'GẶP LẠI — câu bạn từng sai') : (langNow === 'en' ? 'QUESTION' : 'CÂU HỎI')}</span>
            <p>${esc(cur.q)}</p>
            ${cur.unit ? `<span class="gm-unit">${langNow === 'en' ? 'unit' : 'đơn vị'}: ${cur.unit}</span>` : ''}
          </div>`}
      </div>

      <div class="gm-side gm-side-foe">
        ${gmSprite(GM.foe.art, 'foe')}
        <div class="gm-hp foe"><i style="width:${foePct}%"></i></div>
        <span class="gm-hp-t">${(GM.foe.name[langNow] || GM.foe.name.vi)} ${GM.foeHp}/${GM.foeMax}</span>
      </div>
    </div>

    ${GM.over ? '' : (cur.opts
      ? `<div class="gm-opts">${cur.opts.map(o =>
        `<button class="gm-opt" data-opt="${esc(o)}">${esc(o)}</button>`).join('')}</div>`
      : `<div class="gm-in">
          <input id="gmIn" type="text" inputmode="decimal" autocomplete="off"
            placeholder="${langNow === 'en' ? 'Your answer…' : 'Đáp án của bạn…'}"
            aria-label="${langNow === 'en' ? 'Answer' : 'Đáp án'}">
          <button class="btn" id="gmSend">${langNow === 'en' ? 'Attack' : 'Tấn công'}</button>
        </div>
        <p class="sy-note gm-hint">${langNow === 'en' ? 'Enter to attack. Comma or dot both work.' : 'Enter để tấn công. Dấu phẩy hay chấm đều được.'}</p>`)}

    ${GM.log.length ? `<div class="gm-log">${GM.log.slice(0, 3).map(l => `
      <div class="gm-log-r ${l.ok ? 'ok' : 'no'}">
        <span class="gm-log-m">${l.ok ? '✓' : '✕'}</span>
        <span class="gm-log-t">${esc(l.txt)}</span>
        <span class="gm-log-a">${l.ok ? '-' + l.dmg + ' HP' : '→ ' + esc(l.ans)}</span>
      </div>`).join('')}</div>` : ''}
  </section>`;

  /* --- bind --- */
  const q = $('#gmQuit');
  if (q) q.onclick = () => { GM = null; renderGame(); };

  if (GM.over) {
    $('#gmAgain').onclick = () => gmStart(GM.topic);
    $('#gmBack').onclick = () => { GM = null; renderGame(); };
    return;
  }

  $$('[data-opt]').forEach(b => b.onclick = () => gmAnswer(b.dataset.opt));

  const inp = $('#gmIn');
  if (inp) {
    inp.focus();
    const send = () => {
      const v = inp.value;
      if (String(v).trim() === '') return;
      gmAnswer(v);
    };
    $('#gmSend').onclick = send;
    inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); send(); } };
  }
}
