// Lưu trạng thái vào localStorage. Không bao giờ ném lỗi ra ngoài.
// Nếu dữ liệu đọc được nhưng hỏng, bản gốc được sao lưu sang khoá .bak trước khi
// trạng thái mới được ghi đè, để không mất dữ liệu âm thầm.
import { emptyState, normalizeState } from './logic.js';

export const KEY = 'sf.plan.v2';
const BACKUP = KEY + '.bak';

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
