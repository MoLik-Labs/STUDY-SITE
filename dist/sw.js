/* =========================================================
   sw.js — service worker (Cloudflare Workers / Pages)
   Chiến lược: bản chạy được lưu vào cache ngay lần đầu mở,
   các lần sau trả từ cache (0 ms), đồng thời kiểm tra bản mới
   trong nền. Mất mạng vẫn mở được bình thường.
   ---------------------------------------------------------
   Tên cache chứa VERSION (src/build.py thay 11.3), nên mỗi
   lần deploy là một cache mới và bản cũ bị xoá khi activate.
   ========================================================= */
'use strict';

const CACHE = 'vnl9-v11.3';
/* Chỉ precache phần vỏ tối thiểu. Trang là MỘT tệp nên chỉ cần index.html.
   Duyệt từng tệp thay vì addAll(): addAll hỏng cả lô nếu MỘT tệp lỗi, còn
   cách này thì tệp nào lấy được là có, và /404.html lấy được thì người dùng
   mất mạng vẫn thấy trang 404 tử tế. */
/* Chỉ precache "./" (không phải "./index.html"): Cloudflare chuẩn hoá
   /index.html → / bằng 307, precache đường đó sẽ lưu một chuyển hướng thay vì
   trang. Đã kiểm bằng wrangler dev. */
const SHELL = ['./', './404.html'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  /* Không can thiệp vào YouTube / Google Fonts / API — để trình duyệt tự lo */
  if (url.origin !== location.origin) return;

  /* Điều hướng (mở trang, gõ thẳng /study): trả index.html từ cache, cập nhật nền */
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('./').then(hit => {
        const net = fetch(req)
          .then(res => {
            if (res && res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then(c => c.put('./', copy));
            }
            return res;
          })
          .catch(() => hit);
        return hit || net;
      })
    );
    return;
  }

  /* Tài nguyên tĩnh cùng origin: cache-first, làm mới trong nền */
  event.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
