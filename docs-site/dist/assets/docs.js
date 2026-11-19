// Tiện ích đọc tài liệu (không dùng script inline; đọc được khi CSP chặn inline).
// 1) Nút "Sao chép" cho mỗi khối mã.
// 2) Danh sách kiểm tra: nhớ đã đánh dấu trên trình duyệt này (localStorage), theo trang và thứ tự.
(function () {
  'use strict';

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy') ? resolve() : reject(new Error('copy')); }
      catch (e) { reject(e); }
      finally { document.body.removeChild(ta); }
    });
  }

  function addCopyButtons() {
    var pres = document.querySelectorAll('article pre');
    Array.prototype.forEach.call(pres, function (pre) {
      var wrap = pre.parentNode;
      if (!(wrap.classList && wrap.classList.contains('codewrap'))) {
        wrap = document.createElement('div');
        wrap.className = 'codewrap';
        pre.parentNode.insertBefore(wrap, pre);
        wrap.appendChild(pre);
      }
      if (wrap.querySelector('.copy')) return;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'copy';
      btn.textContent = 'Sao chép';
      btn.setAttribute('aria-label', 'Sao chép khối mã');
      btn.addEventListener('click', function () {
        var code = pre.querySelector('code');
        var text = (code || pre).textContent;
        copyText(text).then(function () {
          btn.textContent = 'Đã sao chép';
          btn.setAttribute('data-state', 'ok');
          setTimeout(function () { btn.textContent = 'Sao chép'; btn.removeAttribute('data-state'); }, 1600);
        }, function () {
          btn.textContent = 'Hãy chọn và sao chép tay';
          setTimeout(function () { btn.textContent = 'Sao chép'; }, 2000);
        });
      });
      wrap.appendChild(btn);
    });
  }

  function setupChecklist() {
    var key = 'docs-check:' + location.pathname;
    var state = {};
    try { state = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch (e) { state = {}; }
    var boxes = document.querySelectorAll('article li.task-list-item input[type="checkbox"]');
    Array.prototype.forEach.call(boxes, function (box, i) {
      var li = box.closest('li');
      box.disabled = false;
      box.checked = !!state[i];
      if (li) li.classList.toggle('done', box.checked);
      box.addEventListener('change', function () {
        state[i] = box.checked;
        if (li) li.classList.toggle('done', box.checked);
        try { localStorage.setItem(key, JSON.stringify(state)); } catch (e) { /* bộ nhớ đầy hoặc bị chặn: bỏ qua */ }
      });
    });
  }

  function init() {
    addCopyButtons();
    setupChecklist();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
