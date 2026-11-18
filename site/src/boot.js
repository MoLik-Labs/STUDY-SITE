// Điểm vào duy nhất của trình duyệt. Mọi logic nằm trong app.js và cloud.js để kiểm thử được.
import { mountApp } from './app.js';
import { createCloud } from './cloud.js';
import { CLOUD } from './config.js';

function safeStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const storage = safeStorage();
const root = document.getElementById('main');
const page = root.dataset.page;
const cloud = createCloud({
  config: CLOUD,
  storage,
  redirectTo: window.location.origin + '/tai-khoan/',
});

async function start() {
  let notice = null;
  // Quay lại từ liên kết email hoặc Google: nhận phiên rồi xoá phần # khỏi thanh địa chỉ.
  if (/access_token=|error(_description)?=/.test(window.location.hash)) {
    notice = await cloud.handleCallback(window.location.hash);
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }
  const app = mountApp(root, { storage, page, win: window, cloud, notice });
  window.addEventListener('hashchange', () => app.render());
}

start();
