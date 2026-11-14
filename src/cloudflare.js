/* =========================================================
   CLOUDFLARE — service worker, trạng thái mạng, cập nhật
   Trang này không cần máy chủ để học, nhưng khi chạy trên
   Cloudflare Pages thì nên:
     · cài service worker để mở lại là dùng, kể cả khi mất mạng
     · báo cho người dùng biết khi đang offline
     · báo khi có bản mới đã deploy (ETag đổi → SW phát hiện)
   ========================================================= */
const CF = (() => {
  let swReady = false, online = navigator.onLine !== false;

  /* ---------- đăng ký service worker ---------- */
  function register() {
    if (!('serviceWorker' in navigator)) return;
    if (!/^https?:$/.test(location.protocol)) return;   /* file:// thì bỏ qua */
    navigator.serviceWorker.register('sw.js', { scope: './' })
      .then(reg => {
        swReady = true;
        /* có bản mới đang chờ → hỏi người dùng có muốn nạp lại */
        reg.addEventListener('updatefound', () => {
          const w = reg.installing;
          if (!w) return;
          w.addEventListener('statechange', () => {
            if (w.state === 'installed' && navigator.serviceWorker.controller) {
              offerUpdate();
            }
          });
        });
      })
      .catch(() => { swReady = false; });
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (CF._reloading) return;
      CF._reloading = true;
      location.reload();
    });
  }

  function offerUpdate() {
    const d = document.createElement('div');
    d.className = 'overlay ui-ov';
    d.innerHTML = `<div class="ov-panel ui-mini" role="alertdialog" aria-label="Có bản mới">
      <div class="cal-mh"><span class="kicker">Đã có bản mới</span><span class="grow"></span></div>
      <div class="cal-mb"><p class="ui-msg">Trang vừa được cập nhật. Nạp lại để dùng bản mới nhất?
        Tiến độ, thẻ và thời khoá biểu của bạn vẫn còn nguyên.</p></div>
      <div class="cal-mf"><span class="grow"></span>
        <button class="btn ghost sm" id="cfLater">Để sau</button>
        <button class="btn sm" id="cfNow">Nạp lại</button></div>
    </div>`;
    document.body.appendChild(d);
    const close = () => d.remove();
    d.querySelector('#cfLater').onclick = close;
    d.querySelector('#cfNow').onclick = close;
    d.onclick = e => { if (e.target === d) close(); };
    /* Trạng thái đang chờ: nạp lại trang sẽ bật bản mới */
    d.querySelector('#cfNow').addEventListener('click', () => location.reload());
  }

  /* ---------- trạng thái mạng ---------- */
  function paint() {
    const el = document.getElementById('netBadge');
    if (!el) return;
    el.hidden = online;
    el.textContent = 'Đang ngoại tuyến — trang vẫn chạy, dữ liệu lưu trong máy';
  }

  function init() {
    register();
    window.addEventListener('online', () => { online = true; paint(); toast('Đã có mạng trở lại'); });
    window.addEventListener('offline', () => { online = false; paint(); });
    paint();
  }

  return { init, paint, get online() { return online; }, get sw() { return swReady; } };
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(CF.init, 300));
} else {
  setTimeout(CF.init, 300);
}
