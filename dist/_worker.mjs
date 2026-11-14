/* =========================================================
   WORKER — sinh tự động bởi src/build.py, ĐỪNG SỬA TAY.
   Nguồn: src/worker.template.js   ·   nhúng lúc build
   ---------------------------------------------------------
   Tệp này là `main` trong wrangler.jsonc. Vì `run_worker_first` KHÔNG bật,
   Cloudflare phục vụ tài nguyên tĩnh TRƯỚC khi Worker chạy — nên luồng học
   bình thường không tốn một request nào trong hạn mức 100.000/ngày.
   Chỉ đường dẫn không phải tệp tĩnh (thực tế: /__version, và 404) mới tới đây.

   Ba thứ tệp này cố tình KHÔNG làm:
     · không đọc index.html để lấy phiên bản — trước đây mỗi lần gọi
       /__version lại fetch nội bộ 1,1 MB HTML rồi regex nó. Giờ bản dựng
       nhúng sẵn số phiên bản và build-id; endpoint còn lại là JSON.stringify.
     · không gọi mạng. Một endpoint "kiểm tra phiên bản" mà phụ thuộc mạng thì
       chính nó là thứ đầu tiên hỏng khi mạng có vấn đề.
     · không tự dựng lại 404 bằng HTML viết trong JS — nó lấy 404.html thật,
       nên giao diện 404 chỉ có một bản.
   ========================================================= */

const VERSION = '11.8';
const BUILD = '65e9fce7317d';
const BUILT_AT = '1970-01-01T00:00:00Z';

/* JSON trả về được dựng sẵn: cùng nội dung cho mọi người, trừ `at`.
   `at` là thời điểm bản dựng, KHÔNG phải thời điểm gọi — nghĩa là phản hồi
   giống nhau cho mọi request cùng build, nên cache được ở edge và ETag có
   nghĩa. Trước đây `at: new Date()` khiến mỗi lần gọi một khác, ETag vô dụng. */
function payload() {
  return '{"version":"' + VERSION + '","build":"' + BUILD + '","builtAt":"' + BUILT_AT + '","runtime":"cloudflare"}';
}

const ETAG = 'W/"' + BUILD + '"';

function jsonHeaders(extra) {
  const h = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=0, must-revalidate',
    'ETag': ETAG,
    'X-Robots-Tag': 'noindex',
  };
  if (extra) for (const k in extra) h[k] = extra[k];
  return h;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    /* ---------- /__version ---------- */
    if (path === '/__version') {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        return new Response(JSON.stringify({ error: 'method not allowed' }), {
          status: 405,
          headers: jsonHeaders({ Allow: 'GET, HEAD' }),
        });
      }
      /* If-None-Match có thể chứa nhiều tag và/hoặc W/ — so khớp đúng cách
         thay vì so nguyên chuỗi, nếu không 304 sẽ không bao giờ xảy ra với
         trình duyệt thật (chúng gửi kèm tiền tố W/ và đôi khi cả danh sách). */
      const inm = request.headers.get('If-None-Match') || '';
      const hit = inm.split(',').map(s => s.trim()).some(t => t === ETAG || t === BUILD || t === '"' + BUILD + '"');
      if (hit) return new Response(null, { status: 304, headers: jsonHeaders() });

      const body = request.method === 'HEAD' ? null : payload();
      return new Response(body, { status: 200, headers: jsonHeaders() });
    }

    /* ---------- mọi thứ còn lại: 404 thật ---------- */
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', {
        status: 405,
        headers: { 'Allow': 'GET, HEAD', 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    try {
      /* redirect:'follow' vì html_handling chuẩn hoá /404.html → /404 bằng 307;
         không follow thì phản hồi không "ok" và ta rơi về plain text. */
      const nf = await env.ASSETS.fetch(new Request(new URL('/404.html', url), {
        method: 'GET',
        redirect: 'follow',
      }));
      if (nf.ok) {
        const headers = new Headers(nf.headers);
        /* 404 KHÔNG được cache lâu: một liên kết gõ sai hôm nay có thể là
           trang thật sau lần deploy sau. */
        headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
        return new Response(request.method === 'HEAD' ? null : nf.body, { status: 404, headers });
      }
    } catch (e) {
      /* chạy ngoài Cloudflare, không có binding ASSETS */
    }
    return new Response('Không tìm thấy trang này. Mọi nội dung nằm sau dấu #, ví dụ /#/study', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  },
};
