// Logic hẹn giờ thuần (không DOM, không localStorage): kiểm thử được.
// Pomodoro theo bộ giờ của bản Vật lí (học/nghỉ phút) và đồng hồ bấm giờ có vòng (lap).
// Mọi mốc thời gian dùng ms epoch. Trạng thái "đang chạy" lưu endAt, nên đóng trang rồi mở lại vẫn đúng.

export const PRESETS = [[25, 5], [50, 10], [15, 3]];
const MIN = 60 * 1000;
const MAX_LAPS = 50;

function dayKey(ms) {
  const d = new Date(ms);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function emptyTimer(now = 0) {
  const pr = PRESETS[0];
  return {
    v: 1,
    preset: 0,
    phase: 'focus',     // 'focus' | 'break'
    auto: true,         // tự chuyển sang phase tiếp theo khi hết giờ
    sound: true,        // chuông khi hết giờ
    running: false,
    endAt: 0,           // khi đang chạy: mốc kết thúc phase
    left: pr[0] * MIN,  // khi dừng: thời gian còn lại
    day: now ? dayKey(now) : '',
    sessions: 0,        // số phiên học đã xong trong ngày
    sw: { running: false, startedAt: 0, base: 0, laps: [] },
  };
}

function num(v, lo, hi, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : fallback;
}

// Chuẩn hoá dữ liệu lưu trữ (có thể hỏng hoặc từ phiên bản cũ). Không bao giờ trả về NaN.
export function normalizeTimer(raw, now = Date.now()) {
  const base = emptyTimer(now);
  if (!raw || typeof raw !== 'object') return base;
  const t = { ...base };
  t.preset = num(raw.preset, 0, PRESETS.length - 1, 0);
  t.phase = raw.phase === 'break' ? 'break' : 'focus';
  t.auto = raw.auto !== false;
  t.sound = raw.sound !== false;
  t.running = raw.running === true;
  t.endAt = num(raw.endAt, 0, Number.MAX_SAFE_INTEGER, 0);
  const total = phaseMs(t);
  t.left = num(raw.left, 0, total, total);
  if (t.running && !t.endAt) t.running = false;
  t.day = typeof raw.day === 'string' ? raw.day : '';
  t.sessions = num(raw.sessions, 0, 100000, 0);
  const sw = raw.sw && typeof raw.sw === 'object' ? raw.sw : {};
  t.sw = {
    running: sw.running === true && num(sw.startedAt, 0, Number.MAX_SAFE_INTEGER, 0) > 0,
    startedAt: num(sw.startedAt, 0, Number.MAX_SAFE_INTEGER, 0),
    base: num(sw.base, 0, Number.MAX_SAFE_INTEGER, 0),
    laps: Array.isArray(sw.laps) ? sw.laps.map(x => num(x, 0, Number.MAX_SAFE_INTEGER, 0)).slice(-MAX_LAPS) : [],
  };
  return t;
}

export function phaseMs(t) {
  const pr = PRESETS[t.preset] || PRESETS[0];
  return (t.phase === 'break' ? pr[1] : pr[0]) * MIN;
}

export function pomoRemaining(t, now) {
  if (!t.running) return t.left;
  return Math.max(0, t.endAt - now);
}

export function pomoStart(t, now) {
  if (t.running) return t;
  const left = t.left > 0 ? t.left : phaseMs(t);
  return { ...t, running: true, endAt: now + left, left };
}

export function pomoPause(t, now) {
  if (!t.running) return t;
  return { ...t, running: false, endAt: 0, left: pomoRemaining(t, now) };
}

export function pomoReset(t) {
  return { ...t, running: false, endAt: 0, phase: 'focus', left: phaseMs({ ...t, phase: 'focus' }) };
}

export function pomoSetPreset(t, i) {
  const preset = Number.isInteger(i) && i >= 0 && i < PRESETS.length ? i : 0;
  const next = { ...t, preset, running: false, endAt: 0, phase: 'focus' };
  next.left = phaseMs(next);
  return next;
}

// Đổi sang phase kế tiếp. Phiên học xong thì cộng vào số phiên trong ngày.
function nextPhase(t, now) {
  const today = dayKey(now);
  const sessions = t.day === today ? t.sessions : 0;
  const finished = t.phase;
  const phase = finished === 'focus' ? 'break' : 'focus';
  const add = finished === 'focus' ? 1 : 0;
  const next = { ...t, phase, day: today, sessions: sessions + add, running: false, endAt: 0 };
  next.left = phaseMs(next);
  return { next, finished };
}

// Cập nhật theo thời gian. Trả về { t, finished } với finished = phase vừa hết ('focus' | 'break') hoặc null.
export function pomoTick(t, now) {
  if (!t.running || pomoRemaining(t, now) > 0) return { t, finished: null };
  const { next, finished } = nextPhase(t, now);
  if (next.auto) {
    const started = { ...next, running: true, endAt: now + next.left };
    return { t: started, finished };
  }
  return { t: next, finished };
}

// Bỏ qua phase hiện tại (không tính là hoàn thành phiên học nếu đang học).
export function pomoSkip(t, now) {
  const phase = t.phase === 'focus' ? 'break' : 'focus';
  const next = { ...t, phase, running: false, endAt: 0 };
  next.left = phaseMs(next);
  return next;
}

export function sessionsToday(t, now) {
  return t.day === dayKey(now) ? t.sessions : 0;
}

export function swElapsed(sw, now) {
  return sw.running ? sw.base + Math.max(0, now - sw.startedAt) : sw.base;
}

export function swStart(sw, now) {
  if (sw.running) return sw;
  return { ...sw, running: true, startedAt: now };
}

export function swPause(sw, now) {
  if (!sw.running) return sw;
  return { ...sw, running: false, startedAt: 0, base: swElapsed(sw, now) };
}

export function swLap(sw, now) {
  const at = swElapsed(sw, now);
  return { ...sw, laps: [...sw.laps, at].slice(-MAX_LAPS) };
}

export function swReset() {
  return { running: false, startedAt: 0, base: 0, laps: [] };
}

// Lap: khoảng cách từ lap trước (lap đầu tính từ 0).
export function lapSplits(laps) {
  return laps.map((at, i) => ({ n: i + 1, at, split: at - (i ? laps[i - 1] : 0) }));
}

// mm:ss, hoặc h:mm:ss khi từ một giờ trở lên. Làm tròn lên giây để 00:00 chỉ hiện khi thật sự hết.
export function fmtClock(ms, forceHours = false) {
  const total = Math.max(0, Math.ceil((Number.isFinite(ms) ? ms : 0) / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h || forceHours ? h + ':' + mm + ':' + ss : mm + ':' + ss;
}

// Chuỗi đọc cho trình đọc màn hình (không dùng để hiển thị).
export function fmtSpoken(ms) {
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const parts = [];
  if (h) parts.push(h + ' giờ');
  if (m) parts.push(m + ' phút');
  parts.push(s + ' giây');
  return parts.join(' ');
}
