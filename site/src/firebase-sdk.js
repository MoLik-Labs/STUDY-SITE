// Lớp mỏng quanh Firebase SDK (modular). Chỉ file này import 'firebase/*'.
// Được tải lười: khách không bao giờ tải file này. cloud.js nhận đối tượng trả về qua tham số `sdk`.
// Cấu hình (apiKey, authDomain, projectId, appId) là khoá CÔNG KHAI của web app, không phải bí mật;
// bảo vệ dữ liệu nằm ở firestore.rules, không nằm ở khoá này.
import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import {
  initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, browserPopupRedirectResolver,
  GoogleAuthProvider, signInWithRedirect, getRedirectResult, sendSignInLinkToEmail,
  isSignInWithEmailLink, signInWithEmailLink, onAuthStateChanged, signOut, deleteUser,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification,
} from 'firebase/auth';
import {
  getFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs, writeBatch, query, where, orderBy,
  serverTimestamp, Timestamp,
} from 'firebase/firestore/lite';

import { friendlyError } from './cloud.js';
export { friendlyError };

const BATCH = 400; // writeBatch tối đa 500 thao tác; để dư

export function createSdk(config) {
  const app = initializeApp({
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    appId: config.appId,
  });
  // App Check (reCAPTCHA v3, miễn phí): gắn token vào mọi yêu cầu tới Auth và Firestore để chặn
  // client giả dùng khoá công khai. Chỉ bật khi có khoá site key. Lỗi khởi tạo KHÔNG được làm
  // hỏng đăng nhập: app vẫn chạy, chỉ thiếu token. Bật "Enforce" là việc của chủ dự án (xem FIREBASE-SETUP).
  if (config.appCheckKey) {
    try {
      initializeAppCheck(app, { provider: new ReCaptchaV3Provider(config.appCheckKey), isTokenAutoRefreshEnabled: true });
    } catch { /* bỏ qua: đăng nhập vẫn chạy */ }
  }
  // IndexedDB trước, localStorage dự phòng. Không dùng popup: _headers đặt COOP same-origin,
  // và đăng nhập Google đi bằng chuyển hướng (signInWithRedirect) nên không cần cửa sổ phụ.
  const auth = initializeAuth(app, {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence],
    popupRedirectResolver: browserPopupRedirectResolver,
  });
  auth.languageCode = 'vi'; // email xác nhận và trang đặt lại mật khẩu của Firebase bằng tiếng Việt
  const db = getFirestore(app);
  const userOf = u => (u ? { uid: u.uid, email: u.email || '', lastSignInMs: Date.parse(u.metadata && u.metadata.lastSignInTime) || 0 } : null);

  async function deleteDocs(path) {
    const snap = await getDocs(collection(db, path));
    const refs = snap.docs.map(d => d.ref);
    for (let i = 0; i < refs.length; i += BATCH) {
      const batch = writeBatch(db);
      refs.slice(i, i + BATCH).forEach(r => batch.delete(r));
      await batch.commit();
    }
  }

  return {
    onUser(cb) {
      return onAuthStateChanged(auth, u => cb(userOf(u)));
    },
    authReady() {
      return new Promise((resolve, reject) => {
        const off = onAuthStateChanged(auth, u => { off(); resolve(userOf(u)); }, reject);
      });
    },
    isEmailLink(href) {
      return !!href && isSignInWithEmailLink(auth, href);
    },
    async completeEmailLink(email, href) {
      const cred = await signInWithEmailLink(auth, email, href);
      return userOf(cred.user);
    },
    async sendEmailLink(email, url) {
      await sendSignInLinkToEmail(auth, email, { url, handleCodeInApp: true });
    },
    async signUpWithPassword(email, password, url) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      // Email xác nhận là phụ: lỗi gửi không làm hỏng việc tạo tài khoản.
      try { await sendEmailVerification(cred.user, { url }); } catch { /* bỏ qua */ }
      return userOf(cred.user);
    },
    async signInWithPassword(email, password) {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return userOf(cred.user);
    },
    async sendPasswordReset(email, url) {
      await sendPasswordResetEmail(auth, email, { url });
    },
    async startGoogle() {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithRedirect(auth, provider);
    },
    async finishRedirect() {
      const cred = await getRedirectResult(auth);
      return cred ? userOf(cred.user) : null;
    },
    signOut: () => signOut(auth),
    lastSignInMs: () => (auth.currentUser ? userOf(auth.currentUser).lastSignInMs : 0),
    async deleteAuthUser() {
      if (auth.currentUser) await deleteUser(auth.currentUser);
    },
    // updatedAt do máy chủ ghi (Timestamp) được trả về dạng chuỗi ISO, như listDocs.
    async getDoc(path) {
      const snap = await getDoc(doc(db, path));
      if (!snap.exists()) return null;
      const data = snap.data();
      if (data.updatedAt && typeof data.updatedAt.toDate === 'function') {
        data.updatedAt = data.updatedAt.toDate().toISOString();
      }
      return data;
    },
    setDoc(path, data, opts) {
      return setDoc(doc(db, path), data, opts || {});
    },
    deleteDoc: path => deleteDoc(doc(db, path)),
    deleteCollection: deleteDocs,
    friendly: friendlyError,
    // Dấu thời gian do MÁY CHỦ ghi (không dựa vào đồng hồ từng máy: máy lệch giờ sẽ làm mất thay đổi).
    serverNow: () => serverTimestamp(),
    // Các tài liệu trong một thư mục (ví dụ users/{uid}/keys). since (ISO): chỉ lấy tài liệu có updatedAt > since.
    // updatedAt trả về dưới dạng chuỗi ISO để phía trên không phải biết về Timestamp.
    async listDocs(path, since) {
      const ref = collection(db, path);
      const q = since
        ? query(ref, where('updatedAt', '>', Timestamp.fromDate(new Date(since))), orderBy('updatedAt'))
        : ref;
      const snap = await getDocs(q);
      return snap.docs.map(d => {
        const data = d.data();
        const ts = data.updatedAt;
        const iso = ts && typeof ts.toDate === 'function' ? ts.toDate().toISOString() : (typeof ts === 'string' ? ts : '');
        return { id: d.id, data: { ...data, updatedAt: iso } };
      });
    },
    // Ghi nhiều tài liệu trong một lô (tối đa BATCH mỗi lô).
    async setDocs(items) {
      for (let i = 0; i < items.length; i += BATCH) {
        const batch = writeBatch(db);
        items.slice(i, i + BATCH).forEach(it => batch.set(doc(db, it.path), it.data, { merge: true }));
        await batch.commit();
      }
    },
  };
}
