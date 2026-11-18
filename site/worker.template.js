// Worker của site — sinh tự động bởi site/build.mjs (đừng sửa tay bản trong dist/).
// Chỉ hai đường dẫn chạy mã này (xem run_worker_first trong wrangler.jsonc):
//   /__version          JSON phiên bản, có ETag và 304.
//   /assets/config.js   cấu hình đám mây đọc từ biến môi trường lúc CHẠY, không lúc build.
// Mọi tệp tĩnh khác do Cloudflare phục vụ trước, không tốn lượt gọi Worker.

const VERSION = '__VERSION__';
const BUILD = '__BUILD_ID__';
const BUILT_AT = '__BUILT_AT__';

const SECURITY = {
  'X-Content-Type-Options': 'nosniff',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

// Khoá công khai: sb_publishable_… hoặc JWT anon cũ (role = anon). Mọi khoá khác bị từ chối.
const PUBLISHABLE = /^sb_publishable_[A-Za-z0-9_-]{10,}$/;
const URL_OK = /^https:\/\/[a-z0-9]{20}\.supabase\.co$/;

function anonJwt(key) {
  const parts = key.split('.');
  if (parts.length !== 3) return false;
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(b64.padEnd(b64.length + (4 - (b64.length % 4)) % 4, '=')));
    return payload.role === 'anon';
  } catch {
    return false;
  }
}

// Trả về { url, key } hoặc null. Không bao giờ đưa khoá bí mật vào trình duyệt.
export function cloudFromEnv(env) {
  const url = String((env && env.SUPABASE_URL) || '').trim().replace(/\/+$/, '');
  const key = String((env && env.SUPABASE_PUBLISHABLE_KEY) || '').trim();
  if (!url || !key) return null;
  if (!URL_OK.test(url)) return null;
  if (key.startsWith('sb_secret_') || key.includes('service_role')) return null;
  if (!(PUBLISHABLE.test(key) || anonJwt(key))) return null;
  return { url, key };
}

export function configJs(env) {
  const cfg = cloudFromEnv(env);
  return '// Sinh lúc phục vụ từ biến môi trường của Worker.\n' +
    'export const CLOUD = ' + (cfg ? 'Object.freeze(' + JSON.stringify(cfg) + ')' : 'null') + ';\n';
}

function json(body, status, extra) {
  return new Response(body, {
    status,
    headers: Object.assign({
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'ETag': 'W/"' + BUILD + '"',
      'X-Robots-Tag': 'noindex',
    }, SECURITY, extra || {}),
  });
}

function version(request) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return json(JSON.stringify({ error: 'method not allowed' }), 405, { Allow: 'GET, HEAD' });
  }
  const norm = t => t.trim().replace(/^W\//, '').replace(/^"|"$/g, '');
  const inm = request.headers.get('If-None-Match') || '';
  if (inm.split(',').some(t => norm(t) === BUILD || norm(t) === '*')) {
    return new Response(null, { status: 304, headers: { ETag: 'W/"' + BUILD + '"' } });
  }
  const body = '{"version":"' + VERSION + '","build":"' + BUILD + '","builtAt":"' + BUILT_AT + '","runtime":"cloudflare"}';
  return json(request.method === 'HEAD' ? null : body, 200);
}

function config(request, env) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  }
  return new Response(request.method === 'HEAD' ? null : configJs(env), {
    status: 200,
    headers: Object.assign({
      'Content-Type': 'text/javascript; charset=utf-8',
      'Cache-Control': 'no-store',
    }, SECURITY),
  });
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname.replace(/\/+$/, '') || '/';
    if (path === '/__version') return version(request);
    if (path === '/assets/config.js') return config(request, env);
    return new Response('Không tìm thấy', {
      status: 404,
      headers: Object.assign({ 'Content-Type': 'text/plain; charset=utf-8' }, SECURITY),
    });
  },
};
