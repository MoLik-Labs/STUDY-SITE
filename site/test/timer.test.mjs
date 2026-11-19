import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../src/timer-logic.js';

const MIN = 60000;
const T0 = new Date(2026, 10, 18, 9, 0, 0).getTime(); // 18/11/2026 09:00 giờ địa phương

test('bộ giờ mặc định 25/5 và chuyển bộ giờ đặt lại về phiên học', () => {
  let t = T.emptyTimer(T0);
  assert.equal(T.phaseMs(t), 25 * MIN);
  t = T.pomoSetPreset(t, 1);
  assert.equal(t.left, 50 * MIN);
  assert.equal(t.phase, 'focus');
  assert.equal(T.pomoSetPreset(t, 99).preset, 0, 'chỉ số lạ quay về bộ đầu');
});

test('bắt đầu, tạm dừng và tiếp tục giữ đúng thời gian còn lại', () => {
  let t = T.pomoStart(T.emptyTimer(T0), T0);
  assert.equal(T.pomoRemaining(t, T0 + 10 * MIN), 15 * MIN);
  t = T.pomoPause(t, T0 + 10 * MIN);
  assert.equal(t.running, false);
  assert.equal(T.pomoRemaining(t, T0 + 99 * MIN), 15 * MIN, 'dừng thì không trôi');
  t = T.pomoStart(t, T0 + 20 * MIN);
  assert.equal(T.pomoRemaining(t, T0 + 21 * MIN), 14 * MIN);
});

test('hết giờ học: sang nghỉ, cộng một phiên trong ngày, tự chạy tiếp khi auto', () => {
  let t = T.pomoStart(T.emptyTimer(T0), T0);
  const r = T.pomoTick(t, T0 + 25 * MIN);
  assert.equal(r.finished, 'focus');
  assert.equal(r.t.phase, 'break');
  assert.equal(r.t.sessions, 1);
  assert.equal(r.t.running, true);
  assert.equal(T.pomoRemaining(r.t, T0 + 25 * MIN), 5 * MIN);
});

test('tắt auto: hết giờ nghỉ thì dừng và chờ người dùng', () => {
  let t = { ...T.emptyTimer(T0), auto: false };
  t = T.pomoStart(t, T0);
  let r = T.pomoTick(t, T0 + 25 * MIN);
  assert.equal(r.t.running, false);
  assert.equal(r.t.phase, 'break');
  r = T.pomoTick(T.pomoStart(r.t, T0 + 30 * MIN), T0 + 35 * MIN);
  assert.equal(r.finished, 'break');
  assert.equal(r.t.phase, 'focus');
  assert.equal(r.t.sessions, 1, 'nghỉ xong không cộng phiên học');
});

test('số phiên tự đặt lại khi sang ngày mới', () => {
  const t = { ...T.emptyTimer(T0), day: '2026-11-17', sessions: 7 };
  assert.equal(T.sessionsToday(t, T0), 0);
  assert.equal(T.sessionsToday({ ...t, day: '2026-11-18', sessions: 3 }, T0), 3);
});

test('đồng hồ bấm giờ: chạy, dừng, lap và đặt lại', () => {
  let sw = T.swStart(T.swReset(), T0);
  assert.equal(T.swElapsed(sw, T0 + 5000), 5000);
  sw = T.swLap(sw, T0 + 5000);
  sw = T.swPause(sw, T0 + 8000);
  assert.equal(T.swElapsed(sw, T0 + 99999), 8000, 'đã dừng thì không đếm nữa');
  sw = T.swStart(sw, T0 + 10000);
  sw = T.swLap(sw, T0 + 12000);
  assert.deepEqual(T.lapSplits(sw.laps), [
    { n: 1, at: 5000, split: 5000 },
    { n: 2, at: 10000, split: 5000 },
  ]);
  assert.deepEqual(T.swReset(), { running: false, startedAt: 0, base: 0, laps: [] });
});

test('fmtClock: mm:ss, h:mm:ss, làm tròn lên giây, không âm', () => {
  assert.equal(T.fmtClock(0), '00:00');
  assert.equal(T.fmtClock(999), '00:01');
  assert.equal(T.fmtClock(25 * MIN), '25:00');
  assert.equal(T.fmtClock(3723000), '1:02:03');
  assert.equal(T.fmtClock(-5), '00:00');
  assert.equal(T.fmtClock(NaN), '00:00');
  assert.equal(T.fmtClock(65000, true), '0:01:05');
});

test('normalizeTimer: dữ liệu hỏng hoặc thiếu trường không ra NaN', () => {
  const t = T.normalizeTimer({ preset: 'abc', left: 'x', endAt: -4, running: true, sw: { laps: 'no' } }, T0);
  assert.equal(t.preset, 0);
  assert.equal(t.left, 25 * MIN);
  assert.equal(t.running, false, 'đang chạy nhưng thiếu endAt thì dừng');
  assert.deepEqual(t.sw.laps, []);
  assert.equal(T.normalizeTimer(null, T0).phase, 'focus');
  assert.equal(T.normalizeTimer('chuoi', T0).sessions, 0);
  assert.ok(!JSON.stringify(T.normalizeTimer({ left: 1e30 }, T0)).includes('null'), 'không có NaN/Infinity');
});

test('fmtSpoken đọc được cho trình đọc màn hình', () => {
  assert.equal(T.fmtSpoken(25 * MIN), '25 phút 0 giây');
  assert.equal(T.fmtSpoken(3661000), '1 giờ 1 phút 1 giây');
});
