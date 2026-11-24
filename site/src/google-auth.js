// Lấy access token cho Firestore bằng tài khoản dịch vụ (JWT bearer grant, RS256 bằng WebCrypto).
//
// Chỉ dùng cho: xác thực mã kết nối cá nhân và quản lý mã đó. Tài khoản dịch vụ được cấp đúng
// vai trò "Cloud Datastore User" (xem docs/API.md). Khoá private_key chỉ tồn tại trong secret
// FIREBASE_SERVICE_ACCOUNT của Worker, không bao giờ được trả ra trang hay log.

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/datastore';
const LIFETIME_S = 3600;
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

let cache = { email: null, token: null, until: 0 };

// Trả về đối tượng tài khoản dịch vụ đã kiểm định, hoặc null nếu chuỗi không hợp lệ.
export function parseServiceAccount(raw) {
  if (typeof raw !== 'string' || raw.length < 40 || raw.length > 8000) return null;
  let sa;
  try { sa = JSON.parse(raw); } catch { return null; }
  if (!sa || sa.type !== 'service_account') return null;
  if (typeof sa.client_email !== 'string' || !/^[^@\s]+@[^@\s]+\.iam\.gserviceaccount\.com$/.test(sa.client_email)) return null;
  if (typeof sa.private_key !== 'string' || !sa.private_key.includes('PRIVATE KEY')) return null;
  if (typeof sa.project_id !== 'string') return null;
  return { client_email: sa.client_email, private_key: sa.private_key, project_id: sa.project_id };
}

function b64url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToDer(pem) {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

export async function accessToken(sa, { fetchFn = fetch, now = Date.now(), subtle = globalThis.crypto.subtle } = {}) {
  if (cache.token && cache.email === sa.client_email && now < cache.until) return cache.token;
  const iat = Math.floor(now / 1000);
  const header = b64url(new TextEncoder().encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const claims = b64url(new TextEncoder().encode(JSON.stringify({
    iss: sa.client_email, scope: SCOPE, aud: TOKEN_URL, iat, exp: iat + LIFETIME_S,
  })));
  const key = await subtle.importKey('pkcs8', pemToDer(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(header + '.' + claims));
  const assertion = header + '.' + claims + '.' + b64url(new Uint8Array(sig));

  const res = await fetchFn(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }).toString(),
  });
  if (!res.ok) throw new Error('google token ' + res.status);
  const body = await res.json();
  if (typeof body.access_token !== 'string' || !body.access_token) throw new Error('google token missing');
  const ttl = Math.min(Number(body.expires_in) || LIFETIME_S, LIFETIME_S) * 1000;
  cache = { email: sa.client_email, token: body.access_token, until: now + ttl - REFRESH_MARGIN_MS };
  return body.access_token;
}

export function clearAccessTokenCache() {
  cache = { email: null, token: null, until: 0 };
}
