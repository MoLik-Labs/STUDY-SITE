// Điểm vào duy nhất của trình duyệt. Mọi logic nằm trong app.js và cloud.js để kiểm thử được.
// Firebase chỉ được tải khi cần: khách không đăng nhập, không ở trang tài khoản và không quay lại
// từ liên kết đăng nhập thì không tải gì ngoài app.
import { mountApp } from './app.js';
import { HINT_KEY, PENDING_KEY, LINK_KEY } from './cloud.js';

// Cấu hình Firebase do Worker phục vụ từ biến môi trường. Thiếu cấu hình thì chạy chế độ khách.
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

function needsCloud(storage, page) {
  const params = new URLSearchParams(window.location.search);
  if (params.has('oobCode') || params.get('mode') === 'signIn') return true;
  if (page === 'account') return true;
  try {
    if (storage.getItem(HINT_KEY) || storage.getItem(PENDING_KEY) || storage.getItem(LINK_KEY)) return true;
  } catch { /* không đọc được thì coi như khách */ }
  return false;
}

async function start() {
  const storage = safeStorage();
  const root = document.getElementById('main');
  const page = root.dataset.page;
  const config = await loadCloudConfig();

  let cloud = null;
  let notice = null;
  if (config && storage && needsCloud(storage, page.split(':')[0])) {
    // Lỗi tải hoặc khởi tạo Firebase KHÔNG được làm trắng trang: rơi về chế độ khách và báo một dòng.
    try {
      const [{ createCloud }, { createSdk }] = await Promise.all([import('./cloud.js'), import('./firebase-sdk.js')]);
      cloud = createCloud({
        config,
        sdk: createSdk(config),
        storage,
        redirectTo: window.location.origin + '/tai-khoan/',
      });
      notice = await cloud.init(window.location.href);
    } catch (err) {
      cloud = null;
      notice = { ok: false, text: 'Không tải được đăng nhập lúc này. Bạn vẫn dùng đầy đủ ở chế độ khách.' };
    }
    // Xoá mã đăng nhập một lần khỏi thanh địa chỉ. Giữ nguyên hash (ví dụ #/c/<id>).
    if (new URLSearchParams(window.location.search).has('oobCode')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.hash);
    }
  }

  const app = mountApp(root, { storage, page, win: window, cloud, notice });
  window.addEventListener('hashchange', () => app.render());

  // Service worker: dùng offline. Lỗi đăng ký không ảnh hưởng việc dùng app.
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

start();
