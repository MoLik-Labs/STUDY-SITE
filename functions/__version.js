/**
 * functions/__version.js — Cloudflare Pages Function
 *
 *   GET /__version   →  { version, build, at }
 *
 * Cloudflare Pages **có** chạy backend: mọi tệp trong thư mục `functions/`
 * trở thành Worker chạy ở biên (edge), miễn phí trong hạn mức của Pages.
 * Tệp này không đụng tới dữ liệu người học — nó chỉ trả về phiên bản đang
 * deploy để client biết khi nào có bản mới.
 *
 * Không có Node.js ở đây: Pages Functions chạy trên workerd (Web-standard API),
 * nên chỉ dùng fetch/Response/crypto.
 */

/* BUILD_ID được Cloudflare đưa vào môi trường ở mỗi lần deploy.
   CF_PAGES_COMMIT_SHA cũng có, nhưng chỉ khi deploy từ Git. */
const BUILD =
  (typeof __BUILD__ !== 'undefined' && __BUILD__) ||
  'dev';

export async function onRequestGet(context) {
  const { request, env } = context;

  /* Đọc phiên bản từ chính index.html đã deploy — một nguồn sự thật duy nhất,
     không phải sửa số ở hai nơi. */
  let version = 'unknown';
  let build = env.CF_PAGES_COMMIT_SHA || BUILD;

  try {
    const url = new URL('/index.html', request.url);
    const res = await fetch(url.toString(), { cf: { cacheTtl: 0, cacheEverything: false } });
    if (res.ok) {
      const html = await res.text();
      const m = html.match(/<meta name="app-version" content="([^"]+)"/);
      const b = html.match(/<meta name="build-id" content="([^"]+)"/);
      if (m) version = m[1];
      if (b) build = b[1];
    }
  } catch (e) {
    /* Không đọc được index.html thì vẫn trả lời, đừng để endpoint chết */
  }

  /* ETag = build id: client gửi If-None-Match, không đổi thì 304, khỏi tải lại */
  const etag = 'W/"' + build + '"';
  if (request.headers.get('If-None-Match') === etag) {
    return new Response(null, { status: 304, headers: { ETag: etag } });
  }

  const body = JSON.stringify({
    version,
    build,
    at: new Date().toISOString(),
    runtime: 'cloudflare-pages-functions',
    commit: env.CF_PAGES_COMMIT_SHA || null,
    branch: env.CF_PAGES_BRANCH || null,
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ETag: etag,
      'Access-Control-Allow-Origin': new URL(request.url).origin,
    },
  });
}

/* Mọi method khác trả 405 thay vì rơi vào trang HTML */
export async function onRequest(context) {
  if (context.request.method === 'GET' || context.request.method === 'HEAD') {
    return onRequestGet(context);
  }
  return new Response(JSON.stringify({ error: 'method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json; charset=utf-8', Allow: 'GET, HEAD' },
  });
}
