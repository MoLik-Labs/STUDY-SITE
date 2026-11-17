// Điểm vào duy nhất của trình duyệt. Mọi logic nằm trong app.js để kiểm thử được.
import { mountApp } from './app.js';

function safeStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const root = document.getElementById('main');
const app = mountApp(root, { storage: safeStorage(), page: root.dataset.page, win: window });
window.addEventListener('hashchange', () => app.render());
