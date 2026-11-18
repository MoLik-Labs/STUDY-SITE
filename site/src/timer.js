// Bộ hẹn giờ trên trang chủ: Pomodoro (3 bộ giờ, tự chuyển phase, chuông) và đồng hồ bấm giờ có vòng.
// Chỉ chạy bộ đếm (setInterval) khi có đồng hồ đang chạy; dừng khi không còn gì chạy hoặc khi trang bị thay thế.
import * as T from './timer-logic.js';

export const TIMER_KEY = 'sf.timer.v1';
const TICK_MS = 250;

export function loadTimer(storage, now) {
  try {
    return T.normalizeTimer(JSON.parse((storage && storage.getItem(TIMER_KEY)) || 'null'), now);
  } catch {
    return T.normalizeTimer(null, now);
  }
}

function saveTimer(storage, t) {
  try {
    if (storage) storage.setItem(TIMER_KEY, JSON.stringify(t));
  } catch { /* không lưu được thì vẫn chạy trong trang */ }
}

// Hai nốt đi lên khi học xong, hai nốt đi xuống khi nghỉ xong. Chỉ phát khi người dùng bật chuông.
function chime(kind, ctxRef) {
  try {
    const Ctx = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Ctx) return;
    ctxRef.ctx = ctxRef.ctx || new Ctx();
    const ac = ctxRef.ctx;
    const t0 = ac.currentTime;
    const notes = kind === 'focus' ? [659.25, 880] : [523.25, 392];
    notes.forEach((freq, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const at = t0 + i * 0.2;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.linearRampToValueAtTime(0.1, at + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.9);
      osc.connect(gain).connect(ac.destination);
      osc.start(at);
      osc.stop(at + 1);
    });
  } catch { /* trình duyệt không có âm thanh: báo bằng chữ là đủ */ }
}

// h: hàm tạo DOM của app (dùng textContent, không innerHTML).
export function createTimer({ h, storage, now = () => Date.now(), win = globalThis }) {
  let t = loadTimer(storage, now());
  let tab = 'pomo';
  let timerId = 0;
  const audio = {};
  const refs = {};

  const pr = () => T.PRESETS[t.preset];
  const isRunning = () => t.running || t.sw.running;

  // Mọi thao tác của người dùng dựng lại giao diện (chip, nút Vòng, nhãn nút đổi theo trạng thái).
  function commit(next) {
    t = next;
    saveTimer(storage, t);
    rebuild();
  }

  function syncTicking() {
    if (isRunning() && !timerId) timerId = win.setInterval(step, TICK_MS);
    if (!isRunning() && timerId) { win.clearInterval(timerId); timerId = 0; }
  }

  // Một nhịp: cập nhật phase khi hết giờ (phát chuông, báo chữ), rồi vẽ lại.
  function step() {
    const r = T.pomoTick(t, now());
    if (r.finished) {
      if (t.sound) chime(r.finished, audio);
      const msg = r.finished === 'focus'
        ? (r.t.auto ? 'Hết giờ học. Bắt đầu nghỉ ' + pr()[1] + ' phút.' : 'Hết giờ học. Nghỉ ' + pr()[1] + ' phút rồi bấm bắt đầu.')
        : 'Hết giờ nghỉ. Sẵn sàng học tiếp.';
      if (refs.announce) refs.announce.textContent = msg;
      t = r.t;
      saveTimer(storage, t);
    }
    update();
    syncTicking();
  }

  function pomoView() {
    const total = T.phaseMs(t);
    const left = T.pomoRemaining(t, now());
    const done = total ? Math.min(100, Math.max(0, ((total - left) / total) * 100)) : 0;
    const clock = h('p', { class: 'timer-clock', role: 'timer', 'aria-label': 'Còn lại ' + T.fmtSpoken(left) }, T.fmtClock(left));
    const fill = h('span', { class: 'bar-fill' });
    fill.style.width = done.toFixed(1) + '%';
    refs.clock = clock;
    refs.fill = fill;
    refs.bar = h('div', { class: 'bar timer-bar', role: 'progressbar', 'aria-label': 'Tiến độ phiên hiện tại', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': Math.round(done) }, fill);
    refs.phase = h('p', { class: 'timer-phase' }, (t.phase === 'focus' ? 'Đang học' : 'Đang nghỉ') + ' · ' + T.sessionsToday(t, now()) + ' phiên hôm nay');
    refs.toggle = h('button', { type: 'button', onclick: () => commit(t.running ? T.pomoPause(t, now()) : T.pomoStart(t, now())) }, t.running ? 'Tạm dừng' : 'Bắt đầu');
    const presets = T.PRESETS.map((p, i) => h('button', {
      type: 'button', class: 'chip' + (i === t.preset ? ' is-on' : ''),
      'aria-pressed': i === t.preset ? 'true' : 'false',
      onclick: () => commit(T.pomoSetPreset(t, i)),
    }, p[0] + '/' + p[1]));
    return h('div', { class: 'timer-body', id: 'timer-pomo' },
      refs.phase,
      clock,
      refs.bar,
      h('div', { class: 'timer-row' },
        refs.toggle,
        h('button', { type: 'button', class: 'ghost', onclick: () => commit(T.pomoSkip(t, now())) }, 'Bỏ qua'),
        h('button', { type: 'button', class: 'ghost', onclick: () => commit(T.pomoReset(t)) }, 'Đặt lại')),
      h('div', { class: 'timer-presets', role: 'group', 'aria-label': 'Bộ giờ học/nghỉ (phút)' }, presets),
      h('div', { class: 'timer-opts' },
        h('label', { class: 'check' },
          h('input', { type: 'checkbox', checked: t.auto, onchange: e => commit({ ...t, auto: e.currentTarget.checked }) }), 'Tự chuyển phase'),
        h('label', { class: 'check' },
          h('input', { type: 'checkbox', checked: t.sound, onchange: e => commit({ ...t, sound: e.currentTarget.checked }) }), 'Chuông')),
      refs.announce = h('p', { class: 'timer-say', role: 'status', 'aria-live': 'polite' }));
  }

  function swView() {
    const ms = T.swElapsed(t.sw, now());
    refs.swClock = h('p', { class: 'timer-clock', 'aria-label': 'Thời gian ' + T.fmtSpoken(ms) }, T.fmtClock(ms, false));
    const laps = T.lapSplits(t.sw.laps).slice().reverse();
    return h('div', { class: 'timer-body', id: 'timer-sw' },
      refs.swClock,
      h('div', { class: 'timer-row' },
        h('button', { type: 'button', onclick: () => commit(t.sw.running ? { ...t, sw: T.swPause(t.sw, now()) } : { ...t, sw: T.swStart(t.sw, now()) }) },
          t.sw.running ? 'Dừng' : 'Bắt đầu'),
        h('button', { type: 'button', class: 'ghost', disabled: !t.sw.running, onclick: () => commit({ ...t, sw: T.swLap(t.sw, now()) }) }, 'Vòng'),
        h('button', { type: 'button', class: 'ghost', onclick: () => commit({ ...t, sw: T.swReset() }) }, 'Đặt lại')),
      laps.length
        ? h('ol', { class: 'laps', 'aria-label': 'Các vòng' }, laps.map(l => h('li', {}, h('span', {}, 'Vòng ' + l.n), h('span', { class: 'mono' }, T.fmtClock(l.at, true)), h('span', { class: 'mono muted' }, '+' + T.fmtClock(l.split, true)))))
        : h('p', { class: 'muted fine' }, 'Bấm “Vòng” để ghi mốc thời gian.'));
  }

  function tabButtons() {
    return h('div', { class: 'timer-tabs', role: 'tablist', 'aria-label': 'Chế độ' },
      [['pomo', 'Pomodoro'], ['sw', 'Bấm giờ']].map(([key, label]) => h('button', {
        type: 'button', role: 'tab', id: 'tab-' + key, class: 'tab' + (tab === key ? ' is-on' : ''),
        'aria-selected': tab === key ? 'true' : 'false', 'aria-controls': key === 'pomo' ? 'timer-pomo' : 'timer-sw',
        onclick: () => { tab = key; rebuild(); },
      }, label)));
  }

  function build() {
    refs.announce = null;
    const body = tab === 'pomo' ? pomoView() : swView();
    return h('section', { class: 'timer', 'aria-label': 'Bấm giờ và Pomodoro' }, tabButtons(), body);
  }

  let root = null;
  function rebuild() {
    // Hết giờ khi đang ở trang khác: chuyển phase ngay, không phát chuông (đã quá muộn).
    const caught = T.pomoTick(t, now());
    if (caught.finished) { t = caught.t; saveTimer(storage, t); }
    // Giữ tiêu điểm bàn phím: nút đang focus được tìm lại theo vị trí sau khi dựng lại.
    const doc = root ? root.ownerDocument : null;
    const active = doc ? doc.activeElement : null;
    const focusIdx = root && active && root.contains(active) ? [...root.querySelectorAll('button')].indexOf(active) : -1;
    const next = build();
    if (root && root.parentNode) root.replaceWith(next);
    root = next;
    if (focusIdx >= 0) {
      const again = next.querySelectorAll('button')[focusIdx];
      if (again && !again.disabled && doc) again.focus();
    }
    update();
    syncTicking();
  }

  // Vẽ lại số liệu mà không dựng lại DOM (mỗi 250 ms).
  function update() {
    if (!root) return;
    if (tab === 'pomo' && refs.clock) {
      const total = T.phaseMs(t);
      const left = T.pomoRemaining(t, now());
      refs.clock.textContent = T.fmtClock(left);
      refs.clock.setAttribute('aria-label', 'Còn lại ' + T.fmtSpoken(left));
      const done = total ? Math.min(100, Math.max(0, ((total - left) / total) * 100)) : 0;
      refs.fill.style.width = done.toFixed(1) + '%';
      refs.bar.setAttribute('aria-valuenow', String(Math.round(done)));
      refs.toggle.textContent = t.running ? 'Tạm dừng' : 'Bắt đầu';
    } else if (tab === 'sw' && refs.swClock) {
      refs.swClock.textContent = T.fmtClock(T.swElapsed(t.sw, now()), false);
    }
  }

  function element() {
    rebuild();
    return root;
  }

  return {
    element,
    dispose() {
      if (timerId) { win.clearInterval(timerId); timerId = 0; }
    },
    state: () => t,
  };
}
