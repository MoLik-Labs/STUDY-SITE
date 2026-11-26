// Chọn giao diện (theme). Thuần: không đụng DOM trực tiếp trừ applyTheme nhận root làm tham số.
// Lựa chọn lưu trên máy (localStorage), không đồng bộ lên đám mây. Mặc định: theo máy.
export const THEME_KEY = 'sf.theme.v1';

// id phải khớp data-theme trong styles.css. scheme dùng cho color-scheme của trình duyệt.
export const THEMES = [
  { id: 'system', label: 'Theo máy', desc: 'Latte khi máy sáng, Mocha khi máy tối.' },
  { id: 'latte', label: 'Latte', desc: 'Catppuccin Latte. Sáng, dịu.', scheme: 'light' },
  { id: 'mocha', label: 'Mocha', desc: 'Catppuccin Mocha. Tối, ấm.', scheme: 'dark' },
  { id: 'forest', label: 'Rừng', desc: 'Everforest. Xanh rừng, tối.', scheme: 'dark' },
  { id: 'nord', label: 'Nord', desc: 'Nord. Xanh băng, tối.', scheme: 'dark' },
  { id: 'gruvbox', label: 'Gruvbox', desc: 'Gruvbox. Tông đất ấm, tối.', scheme: 'dark' },
];

const CONCRETE = new Set(THEMES.filter(t => t.id !== 'system').map(t => t.id));

export function isThemeId(id) {
  return id === 'system' || CONCRETE.has(id);
}

// Đọc lựa chọn đã lưu. Không đọc được hoặc giá trị lạ thì coi như "theo máy".
export function readTheme(storage) {
  try {
    const v = storage && storage.getItem(THEME_KEY);
    return isThemeId(v) ? v : 'system';
  } catch {
    return 'system';
  }
}

// Lưu lựa chọn. Trả về true nếu lưu được; lỗi (chế độ riêng tư, bộ nhớ đầy) thì bỏ qua.
export function saveTheme(storage, id) {
  if (!isThemeId(id)) return false;
  try {
    storage.setItem(THEME_KEY, id);
    return true;
  } catch {
    return false;
  }
}

// Chuyển lựa chọn thành theme cụ thể (không còn "system").
export function resolveTheme(id, prefersDark) {
  if (id === 'system') return prefersDark ? 'mocha' : 'latte';
  return CONCRETE.has(id) ? id : 'latte';
}

export function schemeOf(resolved) {
  const t = THEMES.find(x => x.id === resolved);
  return t && t.scheme ? t.scheme : 'light';
}

// Gắn theme lên phần tử gốc (html). Trả về theme cụ thể đã dùng.
export function applyTheme(root, id, prefersDark) {
  const resolved = resolveTheme(id, prefersDark);
  root.dataset.theme = resolved;
  return resolved;
}
