// Service worker của site: để dùng offline. Sinh tự động bởi site/build.mjs.
// Bản cache gắn với mã build, nên mỗi lần deploy là một bộ cache mới; bộ cũ bị xoá khi kích hoạt.
const BUILD = '565212c89310';
const CACHE = 'sf-' + BUILD;
const PRECACHE = ["/","/404.html","/physic/","/physic/index.html","/tai-khoan/","/quyen-rieng-tu/","/tieng-anh-chuyen-nganh-doc/","/tieng-anh-chuyen-nganh-nghe/","/tieng-trung-doc-viet/","/tieng-trung-noi/","/tieng-trung-nghe/","/kinh-te-luong/","/nguyen-li-ke-toan/","/quan-he-kinh-te-quoc-te/","/assets/boot.js","/assets/chunk-JWHQMGR2.js","/assets/chunk-NUP2XZKH.js","/assets/firebase-sdk.js","/assets/styles.css"];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('sf-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function sameOrigin(url) {
  return url.origin === self.location.origin;
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (!sameOrigin(url)) return; // đám mây Firebase không bao giờ đi qua cache

  // Trang điều hướng: mạng trước để nhận bản mới; mất mạng thì dùng bản đã cache.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(url.pathname.endsWith('/') ? url.pathname : url.pathname + '/', copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(url.pathname.endsWith('/') ? url.pathname : url.pathname + '/')
          .then(hit => hit || caches.match('/404.html') || Response.error()))
    );
    return;
  }

  // Tệp tĩnh: cache trước (đã precache theo mã build), không có thì mạng.
  event.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok && PRECACHE.includes(url.pathname)) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      }
      return res;
    }))
  );
});
