/* =========================================================
   MUSIC DOCK — user supplied YouTube links
   Nocookie embed by default, optional Invidious instance.
   ========================================================= */

function musicState() {
  if (!state.music) state.music = { q: [], i: 0, open: false, loop: true, shuffle: false, inst: '', minimised: true };
  const ms = state.music;
  if (!Array.isArray(ms.q)) ms.q = [];
  /* âm lượng + cách cư xử khi có bài giảng */
  if (typeof ms.vol !== 'number') ms.vol = 35;
  if (typeof ms.muted !== 'boolean') ms.muted = false;
  if (!ms.videoMode) ms.videoMode = 'duck';      /* duck | pause | off */
  if (typeof ms.duckTo !== 'number') ms.duckTo = 12;
  if (typeof ms.fade !== 'boolean') ms.fade = true;
  if (typeof ms.ducked !== 'boolean') ms.ducked = false;
  if (typeof ms.playing !== 'boolean') ms.playing = false;
  return ms;
}

/* ---------- điều khiển iframe YouTube bằng postMessage ---------- */
function ytCmd(func, args) {
  const fr = document.querySelector('#muStage iframe');
  if (!fr || !fr.contentWindow) return;
  try {
    fr.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args: args || [] }), '*');
  } catch (e) {}
}
function musicTargetVol() {
  const ms = musicState();
  if (ms.muted) return 0;
  return ms.ducked ? Math.min(ms.vol, ms.duckTo) : ms.vol;
}
let musicFadeT = null;
function musicApplyVol(instant) {
  const ms = musicState();
  const target = musicTargetVol();
  clearInterval(musicFadeT);
  if (!ms.fade || instant) { ytCmd('setVolume', [target]); return; }
  let cur = musicTargetVol.__cur === undefined ? target : musicTargetVol.__cur;
  const step = (target - cur) / 8;
  let n = 0;
  musicFadeT = setInterval(() => {
    n++;
    cur = n >= 8 ? target : cur + step;
    ytCmd('setVolume', [Math.round(cur)]);
    if (n >= 8) { clearInterval(musicFadeT); musicTargetVol.__cur = target; }
  }, 60);
}
/* gọi từ chỗ mở / đóng video bài giảng */
function musicDuck(on) {
  const ms = musicState();
  const mode = ms.videoMode || 'duck';
  if (mode === 'off') return;
  if (on) {
    if (mode === 'pause') { ytCmd('pauseVideo'); ms.ducked = false; }
    else { ms.ducked = true; musicApplyVol(); }
    ms._wasPlayingBeforeVideo = true;
  } else {
    if (mode === 'pause') { ytCmd('playVideo'); }
    ms.ducked = false;
    musicApplyVol();
  }
}

function parseYT(raw) {
  const s = String(raw || '').trim();
  if (!s) return null;
  const list = (s.match(/[?&]list=([\w-]+)/) || [])[1] || null;
  const v = (s.match(/(?:[?&]v=|youtu\.be\/|\/shorts\/|\/embed\/|\/live\/)([\w-]{11})/) || [])[1] || null;
  if (v) return { id: v, list };
  if (/^[\w-]{11}$/.test(s)) return { id: s, list: null };
  if (list) return { id: null, list };
  return null;
}

function musicURL(tr, autoplay) {
  const ms = musicState();
  const host = (ms.inst || '').trim().replace(/\/+$/, '');
  const ap = autoplay ? 1 : 0;
  if (host) {
    if (tr.list && !tr.id) return `${host}/playlist?list=${tr.list}`;
    return `${host}/embed/${tr.id}?autoplay=${ap}&enablejsapi=1`;
  }
  if (tr.list && !tr.id) {
    return `https://www.youtube-nocookie.com/embed/videoseries?list=${tr.list}&autoplay=${ap}&rel=0&modestbranding=1&iv_load_policy=3&enablejsapi=1`;
  }
  return `https://www.youtube-nocookie.com/embed/${tr.id}?autoplay=${ap}&rel=0&modestbranding=1&iv_load_policy=3&playsinline=1&enablejsapi=1${ms.loop ? `&loop=1&playlist=${tr.id}` : ''}`;
}

function mountMusic() {
  if ($('#musicDock')) return;
  const d = document.createElement('div');
  d.id = 'musicDock';
  d.className = 'dock dock-r';
  d.innerHTML = `
    <button class="dock-pill" id="muPill" aria-label="Mở phòng nghe nhạc">
      <span class="mu-note">♪</span><span class="mu-txt" id="muPillTxt">Nhạc</span>
    </button>
    <div class="mu-panel" id="muPanel" hidden>
      <div class="mu-head">
        <span class="kicker">Phòng nghe · link của bạn</span>
        <button class="mu-x" id="muClose" aria-label="Đóng">×</button>
      </div>
      <div class="mu-add">
        <input id="muUrl" placeholder="Dán link YouTube, playlist hoặc ID…" autocomplete="off" spellcheck="false">
        <button class="btn sm" id="muAdd">Thêm</button>
      </div>
      <div class="mu-list" id="muList"></div>
      <div class="mu-stage" id="muStage"></div>
      <div class="mu-vol">
        <span class="mu-vol-i" id="muVolIco">🔈</span>
        <input type="range" id="muVol" min="0" max="100" step="1" value="${musicState().vol}" aria-label="Âm lượng nhạc nền">
        <span class="mu-vol-v" id="muVolV">${musicState().vol}%</span>
        <button class="mu-mute" id="muMute" aria-label="Tắt tiếng" aria-pressed="${musicState().muted}">${musicState().muted ? 'bật lại' : 'tắt'}</button>
        <button class="mu-stop" id="muStop" title="Dừng phát (tải lại iframe)">■</button>
      </div>
      <div class="mu-duck">
        <span class="mu-duck-l">Khi mở bài giảng</span>
        <div class="seg mini">
          <button data-vm="duck" class="${musicState().videoMode === 'duck' ? 'on' : ''}">Nhỏ còn ${musicState().duckTo}%</button>
          <button data-vm="pause" class="${musicState().videoMode === 'pause' ? 'on' : ''}">Tạm dừng</button>
          <button data-vm="off" class="${musicState().videoMode === 'off' ? 'on' : ''}">Giữ nguyên</button>
        </div>
      </div>
      <div class="mu-ctrl">
        <button data-mu="prev" title="Bài trước">⏮</button>
        <button data-mu="shuffle" title="Xáo trộn" id="muShuffle">⤨</button>
        <button data-mu="loop" title="Lặp lại" id="muLoop">↻</button>
        <button data-mu="next" title="Bài sau">⏭</button>
        <span class="mu-count" id="muCount"></span>
      </div>
      <details class="mu-adv">
        <summary>Cấu hình nâng cao</summary>
        <p>Trình phát nhúng dùng <b>youtube-nocookie</b>: không lưu cookie theo dõi và ít quảng cáo hơn, nhưng YouTube vẫn có thể chèn quảng cáo — điều đó do phía YouTube quyết định, không có cách nào chặn hẳn từ trang tĩnh này.</p>
        <p>Nếu bạn có một máy chủ <b>Invidious / Piped</b> riêng, dán địa chỉ vào đây để phát hoàn toàn không quảng cáo:</p>
        <input id="muInst" placeholder="https://invidious.ten-mien-cua-ban" spellcheck="false">
        <div class="mu-adv-row"><button class="btn ghost sm" id="muInstSave">Lưu máy chủ</button><span class="muted" id="muInstSt"></span></div>
      </details>
    </div>`;
  document.body.appendChild(d);

  const draw = () => {
    const ms = musicState();
    const list = $('#muList');
    list.innerHTML = ms.q.length
      ? ms.q.map((t, i) => `<div class="mu-row${i === ms.i ? ' on' : ''}" data-i="${i}">
          <span class="mu-i">${i === ms.i ? '▶' : '♪'}</span>
          <span class="mu-t">${esc(t.title || (t.list && !t.id ? 'Playlist ' + t.list : t.id))}</span>
          <button class="mu-del" data-del="${i}" aria-label="Xoá">×</button></div>`).join('')
      : '<p class="mu-empty">Chưa có bài nào. Dán một link YouTube ở trên — chỉ bạn quyết định danh sách.</p>';
    const cur = ms.q[ms.i];
    /* không tự phát: chỉ dựng iframe khi người dùng đã bấm phát */
    const stage = $('#muStage');
    const want = cur && ms.playing ? musicURL(cur, true) : '';
    if (!want) {
      stage.innerHTML = cur
        ? `<div class="mu-idle">
             <button class="btn sm" id="muPlay">▶ Phát nhạc nền</button>
             <span>Nhạc chỉ chạy khi bạn bấm. Mở bài giảng sẽ tự ${ms.videoMode === 'pause' ? 'tạm dừng' : ms.videoMode === 'off' ? 'giữ nguyên' : 'nhỏ còn ' + ms.duckTo + '%'}.</span>
           </div>`
        : '';
      const pb = $('#muPlay');
      if (pb) pb.onclick = () => { ms.playing = true; save(); draw(); };
    } else if (stage.querySelector('iframe') === null || stage.dataset.src !== want) {
      stage.dataset.src = want;
      stage.innerHTML = `<iframe src="${want}" title="Trình phát nhạc" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    }
    $('#muCount').textContent = ms.q.length ? `${ms.i + 1} / ${ms.q.length}` : '';
    const fr = $('#muStage iframe');
    if (fr) {
      fr.onload = () => { setTimeout(() => musicApplyVol(true), 700); };
    }
    $('#muShuffle').classList.toggle('on', !!ms.shuffle);
    $('#muLoop').classList.toggle('on', !!ms.loop);
    $('#muPillTxt').textContent = cur ? (cur.title || 'Nhạc · ' + (ms.i + 1) + '/' + ms.q.length).slice(0, 18) : 'Nhạc';
    document.querySelectorAll('[data-mu="prev"]').forEach(b => b.disabled = !ms.q.length);
    document.querySelectorAll('[data-mu="next"]').forEach(b => b.disabled = !ms.q.length);
    $$('#muList [data-i]').forEach(r => r.onclick = e => {
      if (e.target.dataset.del !== undefined) return;
      ms.i = +r.dataset.i; save(); draw();
    });
    $$('#muList [data-del]').forEach(b => b.onclick = e => {
      e.stopPropagation();
      const i = +b.dataset.del;
      ms.q.splice(i, 1);
      if (ms.i >= ms.q.length) ms.i = Math.max(0, ms.q.length - 1);
      save(); draw();
    });
    $('#muInst').value = ms.inst || '';
    $('#muInstSt').textContent = ms.inst ? 'đang dùng máy chủ riêng' : 'đang dùng youtube-nocookie';
  };

  const toggle = (open) => {
    const ms = musicState();
    ms.open = open === undefined ? !ms.open : open;
    save();
    $('#muPanel').hidden = !ms.open;
    $('#musicDock').classList.toggle('open', ms.open);
    if (ms.open) { draw(); setTimeout(() => $('#muUrl').focus(), 60); }
  };

  const mi = $('#muVol');
  if (mi) mi.oninput = () => {
    const ms = musicState();
    ms.vol = +mi.value;
    if (ms.vol > 0) ms.muted = false;
    $('#muVolV').textContent = ms.vol + '%';
    $('#muVolIco').textContent = ms.vol === 0 || ms.muted ? '🔇' : ms.vol < 40 ? '🔈' : '🔉';
    musicApplyVol();
    save();
  };
  if (mi) mi.onchange = () => { ytCmd('setVolume', [musicTargetVol()]); };
  const sb = $('#muStop');
  if (sb) sb.onclick = () => {
    const ms = musicState();
    ms.playing = false; ms.ducked = false; save(); draw();
    toast('Đã dừng nhạc nền');
  };
  const mb = $('#muMute');
  if (mb) mb.onclick = () => {
    const ms = musicState();
    ms.muted = !ms.muted;
    mb.textContent = ms.muted ? 'bật lại' : 'tắt';
    mb.setAttribute('aria-pressed', String(ms.muted));
    $('#muVolIco').textContent = ms.muted ? '🔇' : '🔈';
    musicApplyVol(true);
    save();
    toast(ms.muted ? 'Đã tắt tiếng nhạc nền' : 'Đã bật lại nhạc nền');
  };
  $$('[data-vm]').forEach(b => b.onclick = () => {
    const ms = musicState();
    ms.videoMode = b.dataset.vm;
    $$('[data-vm]').forEach(x => x.classList.toggle('on', x === b));
    if (ms.videoMode === 'duck' && ms.ducked) musicApplyVol();
    save();
    toast(b.dataset.vm === 'duck' ? 'Nhạc sẽ tự nhỏ khi mở bài giảng'
      : b.dataset.vm === 'pause' ? 'Nhạc sẽ tạm dừng khi mở bài giảng'
      : 'Nhạc giữ nguyên âm lượng');
  });
  $('#muPill').onclick = () => toggle();
  $('#muClose').onclick = () => toggle(false);
  $('#muAdd').onclick = add;
  $('#muUrl').onkeydown = e => { if (e.key === 'Enter') add(); };
  $('#muInstSave').onclick = () => {
    const ms = musicState();
    ms.inst = $('#muInst').value.trim();
    save(); draw(); toast(ms.inst ? 'Đã đổi máy chủ phát' : 'Đã quay lại youtube-nocookie');
  };
  $$('[data-mu]').forEach(b => b.onclick = () => {
    const ms = musicState();
    if (!ms.q.length) return;
    if (b.dataset.mu === 'shuffle') { ms.shuffle = !ms.shuffle; save(); draw(); return; }
    if (b.dataset.mu === 'loop') { ms.loop = !ms.loop; save(); draw(); return; }
    if (b.dataset.mu === 'next') ms.i = (ms.i + 1 + ms.q.length) % ms.q.length;
    if (b.dataset.mu === 'prev') ms.i = (ms.i - 1 + ms.q.length) % ms.q.length;
    save(); draw();
  });

  function add() {
    const ms = musicState();
    const raw = $('#muUrl').value;
    const p = parseYT(raw);
    if (!p) { toast('Link không đọc được — dán link youtube.com/watch?v=… hoặc youtu.be/…'); return; }
    const tr = { id: p.id, list: p.list, title: (p.id || 'Playlist') };
    ms.q.push(tr);
    ms.i = ms.q.length - 1;
    $('#muUrl').value = '';
    save(); draw(); toggle(true);
    if (p.id) {
      // optional title lookup; silently falls back when offline
      try {
        const ctl = new AbortController();
        const t = setTimeout(() => ctl.abort(), 2500);
        fetch('https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=' + p.id + '&format=json', { signal: ctl.signal })
          .then(r => r.ok ? r.json() : null)
          .then(j => { if (j && j.title) { tr.title = j.title; save(); draw(); } })
          .catch(() => {})
          .finally(() => clearTimeout(t));
      } catch (e) { /* offline — keep the id as the label */ }
    }
  }

  if (musicState().open) { $('#muPanel').hidden = false; $('#musicDock').classList.add('open'); }
  draw();
}
