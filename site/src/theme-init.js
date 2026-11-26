// Áp theme TRƯỚC khi trang vẽ, để không chớp sai màu. Chạy như script đồng bộ trong <head>.
// Logic nằm trong theme.js; lỗi (không có localStorage) thì giữ theme mặc định Latte.
import { applyTheme, readTheme } from './theme.js';
try {
  const prefersDark = !!window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(document.documentElement, readTheme(window.localStorage), prefersDark);
} catch { /* giữ mặc định */ }
