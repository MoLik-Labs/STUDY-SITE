/* =========================================================
   WORKER — sinh tự động bởi src/build.py, ĐỪNG SỬA TAY.
   Nguồn: src/worker.template.js   ·   nhúng lúc build
   ---------------------------------------------------------
   Tệp này là `main` trong wrangler.jsonc. Vì `run_worker_first` KHÔNG bật,
   Cloudflare phục vụ tài nguyên tĩnh TRƯỚC khi Worker chạy — nên luồng học
   bình thường không tốn một request nào trong hạn mức 100.000/ngày.
   Chỉ đường dẫn không phải tệp tĩnh (thực tế: /__version, và 404) mới tới đây.
   ========================================================= */

const VERSION = '__VERSION__';

/* Đọc phiên bản từ chính index.html đã deploy → một nguồn sự thật duy nhất,
   không phải sửa số ở hai nơi. */
async function readDeployed(origin) {
  let version = VERSION;
  let build = 'dev';
  try {
    const res = await fetch(origin + '/index.html', { cf: { cacheTtl: 0, cacheEverything: false } });
    if (res.ok) {
      const html = await res.text();
      const m = html.match(/<meta name="app-version" content="([^"]+)"/);
      const b = html.match(/<meta name="build-id" content="([^"]+)"/);
      if (m) version = m[1];
      if (b) build = b[1];
    }
  } catch (e) {
    /* không đọc được thì vẫn trả lời, đừng để endpoint chết */
  }
  return { version, build };
}

export async function workerFetch(request, env) {
  const url = new URL(request.url);
  if (url.pathname !== '/__version' && url.pathname !== '/__version/') return null;

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(JSON.stringify({ error: 'method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json; charset=utf-8', Allow: 'GET, HEAD' },
    });
  }

  const { version, build } = await readDeployed(url.origin);

  /* ETag = build id: client gửi If-None-Match, không đổi thì 304 */
  const etag = 'W/"' + build + '"';
  if (request.headers.get('If-None-Match') === etag) {
    return new Response(null, { status: 304, headers: { ETag: etag } });
  }

  const body = JSON.stringify({
    version,
    build,
    at: new Date().toISOString(),
    runtime: 'cloudflare',
    commit: (env && (env.CF_WORKERS_CI_COMMIT_SHA || env.CF_PAGES_COMMIT_SHA)) || null,
    branch: (env && (env.CF_WORKERS_CI_BRANCH || env.CF_PAGES_BRANCH)) || null,
  });

  return new Response(request.method === 'HEAD' ? null : body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ETag: etag,
    },
  });
}

/* ---------- router ---------- */
export default {
  async fetch(request, env) {
    const version = await workerFetch(request, env);
    if (version) return version;

    /* Không khớp route động nào → trả 404.html của ta, mã 404 thật.
       Request đã vào Worker nên Cloudflare không tự rơi về tệp tĩnh. */
    const url = new URL(request.url);
    try {
      /* redirect:'follow' vì html_handling chuẩn hoá /404.html → /404 bằng 307;
         không follow thì phản hồi không "ok" và ta rơi về plain text. */
      const nf = await env.ASSETS.fetch(new Request(new URL('/404.html', url), {
        method: 'GET',
        redirect: 'follow',
      }));
      if (nf.ok) {
        return new Response(nf.body, {
          status: 404,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
    } catch (e) {
      /* chạy ngoài Cloudflare, không có binding ASSETS */
    }
    return new Response('Không tìm thấy trang này. Mọi nội dung nằm sau dấu #, ví dụ /#/study', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  },
};
