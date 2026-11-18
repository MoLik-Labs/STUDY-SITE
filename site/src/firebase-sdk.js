// Lớp mỏng quanh Firebase SDK (modular). Chỉ file này import 'firebase/*'.
// Được tải lười: khách không bao giờ tải file này. cloud.js nhận đối tượng trả về qua tham số `sdk`.
// Cấu hình (apiKey, authDomain, projectId, appId) là khoá CÔNG KHAI của web app, không phải bí mật;
// bảo vệ dữ liệu nằm ở firestore.rules, không nằm ở khoá này.
import { initializeApp } from 'firebase/app';
import {
  initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, browserPopupRedirectResolver,
  GoogleAuthProvider, signInWithRedirect, getRedirectResult, sendSignInLinkToEmail,
  isSignInWithEmailLink, signInWithEmailLink, onAuthStateChanged, signOut, deleteUser,
} from 'firebase/auth';
import {
  getFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs, writeBatch, query, where, orderBy,
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
  // IndexedDB trước, localStorage dự phòng. Không dùng popup: _headers đặt COOP same-origin,
  // và đăng nhập Google đi bằng chuyển hướng (signInWithRedirect) nên không cần cửa sổ phụ.
  const auth = initializeAuth(app, {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence],
    popupRedirectResolver: browserPopupRedirectResolver,
  });
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
    async getDoc(path) {
      const snap = await getDoc(doc(db, path));
      return snap.exists() ? snap.data() : null;
    },
    setDoc(path, data, opts) {
      return setDoc(doc(db, path), data, opts || {});
    },
    deleteDoc: path => deleteDoc(doc(db, path)),
    deleteCollection: deleteDocs,
    friendly: friendlyError,
    // Các tài liệu trong một thư mục (ví dụ users/{uid}/keys). since: chỉ lấy tài liệu có updatedAt > since (ISO).
    async listDocs(path, since) {
      const ref = collection(db, path);
      const snap = await getDocs(since ? query(ref, where('updatedAt', '>', since), orderBy('updatedAt')) : ref);
      return snap.docs.map(d => ({ id: d.id, data: d.data() }));
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
