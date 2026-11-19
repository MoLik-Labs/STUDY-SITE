// Lưu trạng thái vào localStorage. Không bao giờ ném lỗi ra ngoài.
// Nếu dữ liệu đọc được nhưng hỏng, bản gốc được sao lưu sang khoá .bak trước khi
// trạng thái mới được ghi đè, để không mất dữ liệu âm thầm.
import { emptyState, normalizeState } from './logic.js';
import { TIMER_KEY } from './timer.js';

export const KEY = 'sf.plan.v2';
const BACKUP = KEY + '.bak';
// Bản local được giữ lại khi kéo dữ liệu từ đám mây đè lên (không bao giờ mất âm thầm).
export const SYNC_BACKUP = KEY + '.sync-bak';
// uid của tài khoản đã đồng bộ dữ liệu local này. Đổi tài khoản thì không đẩy dữ liệu cũ đi.
const OWNER = KEY + '.owner';
// Mốc server của lần đồng bộ gần nhất, kèm uid. Dùng để biết máy có sửa gì mới (không cần đồng hồ).
const BASE = KEY + '.base';

export function loadState(storage) {
  const result = { state: emptyState(), corrupt: false, available: !!storage };
  if (!storage) return result;
  let raw;
  try {
    raw = storage.getItem(KEY);
  } catch {
    result.available = false;
    return result;
  }
  if (!raw) return result;
  try {
    result.state = normalizeState(JSON.parse(raw));
  } catch {
    result.corrupt = true;
    try { storage.setItem(BACKUP, raw); } catch { /* không sao lưu được thì vẫn tiếp tục */ }
  }
  return result;
}

export function saveState(storage, state) {
  if (!storage) return false;
  try {
    storage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function backupForSync(storage, state) {
  if (!storage) return false;
  try {
    storage.setItem(SYNC_BACKUP, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function getOwner(storage) {
  try {
    return storage ? storage.getItem(OWNER) : null;
  } catch {
    return null;
  }
}

export function setOwner(storage, uid) {
  try {
    if (!storage) return;
    if (uid) storage.setItem(OWNER, uid); else storage.removeItem(OWNER);
  } catch { /* không ghi được thì lần sau sẽ hỏi lại qua so sánh mốc thời gian */ }
}

export function getBase(storage, uid) {
  try {
    const b = storage && uid ? JSON.parse(storage.getItem(BASE) || 'null') : null;
    return b && b.uid === uid && typeof b.at === 'string' ? b.at : null;
  } catch {
    return null;
  }
}

export function setBase(storage, uid, at) {
  try {
    if (!storage || !uid) return;
    if (at) storage.setItem(BASE, JSON.stringify({ uid, at })); else storage.removeItem(BASE);
  } catch { /* không ghi được thì lần sau so lại từ đầu, không mất dữ liệu */ }
}

export function clearStorage(storage) {
  if (!storage) return;
  try {
    storage.removeItem(KEY);
    storage.removeItem(BACKUP);
    storage.removeItem(SYNC_BACKUP);
    storage.removeItem(OWNER);
    storage.removeItem(BASE);
    storage.removeItem(TIMER_KEY);
  } catch { /* không xoá được thì trạng thái trong bộ nhớ vẫn đúng */ }
}
