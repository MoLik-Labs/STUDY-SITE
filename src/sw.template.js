/* =========================================================
   sw.js — service worker cho Cloudflare Pages
   Chiến lược: bản chạy được lưu vào cache ngay lần đầu mở,
   các lần sau trả từ cache (0 ms), đồng thời kiểm tra bản mới
   trong nền. Mất mạng vẫn mở được bình thường.
   ---------------------------------------------------------
   Tên cache chứa VERSION (src/build.py thay __VERSION__), nên mỗi
   lần deploy là một cache mới và bản cũ bị xoá khi activate.
   ========================================================= */
'use strict';

const CACHE = 'vnl9-v__VERSION__';
/* Chỉ precache phần vỏ tối thiểu. Trang là MỘT tệp nên chỉ cần index.html. */
const SHELL = ['./', './index.html'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL).catch(() => {}))
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
      caches.match('./index.html').then(hit => {
        const net = fetch(req)
          .then(res => {
            if (res && res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then(c => c.put('./index.html', copy));
            }
            return res;
          })
          .catch(() => hit || caches.match('./'));
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
