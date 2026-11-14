/* =========================================================
   sw.js — service worker (Cloudflare Workers / Pages)
   Chiến lược: bản chạy được lưu vào cache ngay lần đầu mở,
   các lần sau trả từ cache (0 ms), đồng thời kiểm tra bản mới
   trong nền. Mất mạng vẫn mở được bình thường.
   ---------------------------------------------------------
   Tên cache chứa VERSION (src/build.py thay 11.9), nên mỗi
   lần deploy là một cache mới và bản cũ bị xoá khi activate.
   ========================================================= */
'use strict';

const CACHE = 'vnl9-v11.9';
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
  /* Không đụng /__version: đó là kênh kiểm tra phiên bản, cache nó đi là
     vô hiệu hoá chính thứ nó tồn tại để làm. */
  if (url.pathname === '/__version') return;

  /* ---------- điều hướng: ưu tiên mạng, cache là lưới an toàn ----------
     Trước đây điều hướng trả cache TRƯỚC: mở lại trang là dùng bản cũ ngay,
     bản mới chỉ được tải ngầm và chỉ hiện ở lần mở SAU. Người dùng có thể
     dùng một bản cũ suốt nhiều ngày mà không biết — với một app học tập có
     sửa lỗi đáp án thì đó là lỗi nặng.
     Giờ: mạng trước (thường < 100 ms vì Cloudflare ở gần), mất mạng mới lấy
     cache. Đổi lại, offline vẫn mở được như cũ. */
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put('./', copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match('./').then(hit => hit || caches.match('./404.html')))
    );
    return;
  }

  /* ---------- tài nguyên tĩnh: cache-first, làm mới trong nền ----------
     Tệp tĩnh có tên/phiên bản riêng nên dùng bản trong cache là an toàn và
     nhanh nhất; bản mới vẫn được ghi lại cho lần sau. */
  event.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
