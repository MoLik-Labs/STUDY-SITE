// Điểm vào duy nhất của trình duyệt. Mọi logic nằm trong app.js và cloud.js để kiểm thử được.
import { mountApp } from './app.js';
import { createCloud } from './cloud.js';

// Cấu hình đám mây do Worker phục vụ từ biến môi trường. Mất mạng hoặc lỗi thì chạy chế độ khách.
async function loadCloudConfig() {
  try {
    const mod = await import('./config.js');
    return mod.CLOUD || null;
  } catch {
    return null;
  }
}

function safeStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

async function start() {
  const storage = safeStorage();
  const root = document.getElementById('main');
  const page = root.dataset.page;
  const cloud = createCloud({
    config: await loadCloudConfig(),
    storage,
    redirectTo: window.location.origin + '/tai-khoan/',
  });

  let notice = null;
  // Quay lại từ liên kết email hoặc Google: nhận phiên rồi xoá phần # khỏi thanh địa chỉ.
  if (/access_token=|error(_description)?=/.test(window.location.hash)) {
    notice = await cloud.handleCallback(window.location.hash);
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }
  const app = mountApp(root, { storage, page, win: window, cloud, notice });
  window.addEventListener('hashchange', () => app.render());

  // Service worker: dùng offline. Lỗi đăng ký không ảnh hưởng việc dùng app.
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

start();
