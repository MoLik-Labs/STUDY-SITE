// Worker của site — sinh tự động bởi site/build.mjs (đừng sửa tay bản trong dist/).
// Chỉ hai đường dẫn chạy mã này (xem run_worker_first trong wrangler.jsonc):
//   /__version          JSON phiên bản, có ETag và 304.
//   /assets/config.js   cấu hình Firebase đọc từ biến môi trường lúc CHẠY, không lúc build.
// Mọi tệp tĩnh khác do Cloudflare phục vụ trước, không tốn lượt gọi Worker.

const VERSION = '12.0.0';
const BUILD = '565212c89310';
const BUILT_AT = '1970-01-01T00:00:00Z';

const SECURITY = {
  'X-Content-Type-Options': 'nosniff',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

// Cấu hình Firebase web là khoá CÔNG KHAI (không phải bí mật). Bảo vệ dữ liệu nằm ở firestore.rules.
// Mọi giá trị đều được kiểm định dạng; giá trị lạ bị bỏ, không bao giờ đưa vào trang.
const API_KEY = /^AIza[0-9A-Za-z_-]{35}$/;
const PROJECT_ID = /^[a-z0-9][a-z0-9-]{4,28}[a-z0-9]$/;
const APP_ID = /^\d+:\d+:web:[0-9a-f]+$/;
const AUTH_DOMAIN = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;
// Khoá site reCAPTCHA v3 cho App Check (công khai). Sai định dạng thì bỏ, app vẫn chạy không có App Check.
const APPCHECK_KEY = /^[0-9A-Za-z_-]{20,100}$/;
// Khoá dịch vụ (service account) có private_key. Không bao giờ được đặt vào biến này.
const SECRET_HINT = /private_key|BEGIN [A-Z ]*PRIVATE KEY|"type"\s*:\s*"service_account"/;

// Trả về { apiKey, authDomain, projectId, appId } hoặc null. Thiếu hoặc sai một trường thì null (chế độ khách).
export function cloudFromEnv(env) {
  const read = k => String((env && env[k]) || '').trim();
  const values = ['FIREBASE_API_KEY', 'FIREBASE_AUTH_DOMAIN', 'FIREBASE_PROJECT_ID', 'FIREBASE_APP_ID'].map(read);
  if (values.some(v => SECRET_HINT.test(v))) return null;
  const apiKey = read('FIREBASE_API_KEY');
  const projectId = read('FIREBASE_PROJECT_ID');
  const appId = read('FIREBASE_APP_ID');
  const authDomain = read('FIREBASE_AUTH_DOMAIN') || (projectId + '.firebaseapp.com');
  if (!API_KEY.test(apiKey) || !PROJECT_ID.test(projectId) || !APP_ID.test(appId)) return null;
  if (!AUTH_DOMAIN.test(authDomain)) return null;
  const cfg = { apiKey, authDomain, projectId, appId };
  const appCheckKey = read('FIREBASE_APPCHECK_SITE_KEY');
  if (APPCHECK_KEY.test(appCheckKey)) cfg.appCheckKey = appCheckKey;
  return cfg;
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
