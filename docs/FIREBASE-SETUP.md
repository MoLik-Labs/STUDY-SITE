# Cấu hình Firebase từ A đến Z

Tài liệu này dành cho người quản trị dự án STUDY-SITE. Làm theo đúng thứ tự, mất khoảng 30–45 phút. Mọi bước đều dùng gói **Spark (miễn phí, không cần thẻ)**, trừ khi có ghi chú khác.

> **Lưu ý quan trọng về chi phí.** Đăng nhập bằng **email (liên kết)** và **Google** hoàn toàn miễn phí trên Spark. **Đăng nhập bằng SMS thì KHÔNG miễn phí**: Spark không hỗ trợ SMS; muốn bật SMS phải nâng lên gói **Blaze** (cần thẻ thanh toán) và trả tiền theo từng tin nhắn, tuỳ quốc gia. Phần 11 mô tả chi tiết. Ứng dụng hiện **chưa có giao diện SMS**, nên bạn không cần làm phần 11 để dùng ứng dụng.

---

## 0. Bạn sẽ có gì sau khi làm xong

| Cách đăng nhập | Trạng thái trong mã | Chi phí | Ghi chú |
|---|---|---|---|
| Email (liên kết một lần) | Đã có | Miễn phí (Spark) | Gửi liên kết tới email, bấm là vào |
| Google | Đã có | Miễn phí (Spark) | Chuyển hướng sang Google rồi quay về |
| Khách (không đăng nhập) | Đã có | Miễn phí | Dữ liệu chỉ nằm trên máy |
| SMS | Chưa có giao diện | **Cần Blaze, tính phí theo tin** | Mục 11 |
| Apple | Chưa có | Cần tài khoản Apple Developer (trả phí hằng năm) | Mục 12 |
| GitHub | Chưa có | Miễn phí | Mục 12 |
| Ẩn danh (Anonymous) | Chưa dùng | Miễn phí | Không cần thiết cho ứng dụng |

Để thêm một cách đăng nhập vào giao diện cần sửa mã nguồn (`site/src/app.js`, `site/src/firebase-sdk.js`). Bật cách đó trong Firebase Console (mục 4) chưa đủ.

---

## 1. Tạo dự án Firebase

1. Mở <https://console.firebase.google.com> và đăng nhập bằng tài khoản Google của bạn.
2. Bấm **Create a project** (Thêm dự án).
3. Đặt tên, ví dụ `study-focus-fox`. Firebase sẽ tạo mã dự án (project ID) từ tên này; hãy ghi lại mã đó.
4. Google Analytics: **tắt** (không cần cho ứng dụng này).
5. Bấm **Create project** và chờ xong.

## 2. Gói Spark hay Blaze

- Dự án mới mặc định ở gói **Spark**. Gói này miễn phí, không cần thẻ và không tự phát sinh phí.
- Spark có hạn mức. Khi vượt hạn mức trong ngày hoặc trong tháng, dịch vụ đó bị tạm khoá cho tới khi hạn mức được làm mới. Không có khoản tiền nào bị tính.
- Blaze giữ hạn mức miễn phí giống Spark nhưng tính tiền phần vượt. Blaze **bắt buộc** nếu bạn muốn SMS (mục 11).

Giới hạn Spark cho các dịch vụ dùng trong ứng dụng này (theo trang giá chính thức của Firebase, kiểm tra lại tại <https://firebase.google.com/pricing>):

- Firestore: 1 GiB lưu trữ, 50.000 lượt đọc/ngày, 20.000 lượt ghi/ngày, 20.000 lượt xoá/ngày, 10 GiB truyền ra/tháng.
- Authentication (email, Google): miễn phí.

Với một nhóm học nhỏ, các hạn mức này thường đủ. Mục 9 hướng dẫn cách theo dõi.

## 3. Đăng ký ứng dụng web và lấy cấu hình

1. Trong dự án, bấm biểu tượng bánh răng → **Project settings** → tab **General**.
2. Kéo xuống **Your apps** → bấm biểu tượng **Web** (`</>`).
3. Đặt nickname (ví dụ `study-web`). **Không** bật Firebase Hosting (ứng dụng chạy trên Cloudflare). Bấm **Register app**.
4. Sao chép 4 giá trị trong `firebaseConfig`:
   - `apiKey` (bắt đầu bằng `AIza`, dài 39 ký tự) → sẽ đặt thành `FIREBASE_API_KEY`
   - `authDomain` (thường là `<project-id>.firebaseapp.com`) → tuỳ chọn `FIREBASE_AUTH_DOMAIN`
   - `projectId` → `FIREBASE_PROJECT_ID`
   - `appId` (dạng `1:123456789012:web:abc123`) → `FIREBASE_APP_ID`

Đây là **khoá web công khai**. Nó không phải bí mật và sẽ được gửi tới trình duyệt. Dữ liệu được bảo vệ bởi quy tắc Firestore (mục 6), không phải bởi khoá này.

**Không** tải tệp "service account" (JSON có `private_key`) cho ứng dụng web. Worker từ chối các giá trị có dạng khoá bí mật.

## 4. Bật các cách đăng nhập

Vào **Build → Authentication → Get started**, rồi tab **Sign-in method**.

### 4.1. Email link (bắt buộc cho đăng nhập bằng email)
1. Bấm **Email/Password** → bật công tắc **Enable**.
2. Bật thêm công tắc **Email link (passwordless sign-in)**. Đây là cách ứng dụng dùng; **không** bật "Email/Password" nếu bạn không cần mật khẩu. (Bật cả hai cũng được.)
3. **Save**.

### 4.2. Google (bắt buộc cho đăng nhập Google)
1. Bấm **Google** → bật **Enable**.
2. Chọn **Project support email** (email của bạn).
3. **Save**. Firebase tự tạo màn hình đồng ý OAuth; không cần cấu hình thêm.

### 4.3. Các cách khác: để TẮT
- **Phone (SMS)**: xem mục 11. Chỉ bật khi đã nâng lên Blaze.
- **Anonymous**: để tắt; ứng dụng không dùng và quy tắc bảo mật từ chối tài khoản ẩn danh.
- **Apple, GitHub**: xem mục 12.

## 5. Miền được phép (Authorized domains)

Đây là bước hay bị bỏ qua nhất. Nếu thiếu, đăng nhập sẽ báo lỗi `auth/unauthorized-domain`.

1. **Authentication → Settings → Authorized domains**.
2. Đảm bảo có:
   - `localhost` (đã có sẵn, dùng để thử trên máy)
   - `<tên-worker>.<tài-khoản>.workers.dev` (địa chỉ Cloudflare Workers của bạn; xem tên Worker trong `wrangler.jsonc`, ví dụ `foxfocus.<tài-khoản>.workers.dev`)
   - tên miền riêng của bạn, nếu có (ví dụ `study.ten-mien.vn`)
3. Không thêm `*` hay tên miền lạ. Chỉ thêm đúng những địa chỉ mà người dùng thật sự mở.

## 6. Cơ sở dữ liệu Firestore và quy tắc bảo mật

### 6.1. Tạo cơ sở dữ liệu
1. **Build → Firestore Database → Create database**.
2. Chọn **Native mode**.
3. Chọn vị trí. Vị trí **không đổi được** sau khi tạo. Gợi ý `asia-southeast1` (Singapore), gần Việt Nam.
4. Chọn **Production mode** (quy tắc sẽ được triển khai ở bước 6.2, nên không cần chế độ thử nghiệm).

### 6.2. Triển khai quy tắc bảo mật
Quy tắc nằm trong repo: `firestore.rules`, và `firebase.json` đã trỏ tới nó. Triển khai bằng máy tính của bạn:

```bash
npm install -g firebase-tools     # hoặc dùng: npx firebase-tools ...
firebase login                    # đăng nhập bằng tài khoản Google của bạn
cd STUDY-SITE
firebase use <project-id>         # mã dự án ở bước 1
firebase deploy --only firestore:rules
```

Lệnh này chỉ đẩy quy tắc, không tạo gì khác và không mất phí trên Spark.

**Quy tắc làm gì.** Chỉ tài khoản đã đăng nhập (và không phải ẩn danh) đọc hoặc ghi được tài liệu có `uid` trùng với mã của chính họ. Quy tắc cũng kiểm tra kiểu dữ liệu và độ dài (tên hiển thị tối đa 60 ký tự, lớp 40 ký tự, kế hoạch tối đa khoảng 900 KB). Mọi đường dẫn khác bị từ chối.

**Cấu trúc dữ liệu:**

| Đường dẫn | Nội dung | Ai dùng |
|---|---|---|
| `planners/{uid}` | `{ state: "<JSON>", updatedAt }` kế hoạch học | Trang chủ (lịch tuần) |
| `users/{uid}` | `{ displayName, className, grade, updatedAt }` hồ sơ | Tài khoản, Vật lí |
| `users/{uid}/keys/{khoá}` | `{ value: "<JSON>", updatedAt }` dữ liệu Vật lí theo khoá | Vật lí |

### 6.3. Kiểm tra quy tắc (tuỳ chọn)
Trong **Firestore → Rules**, Firebase hiển thị bản đang chạy. Bạn có thể dùng **Rules Playground** để thử: đặt `auth` là một uid, đường dẫn `planners/<uid>`, thao tác `get` và `update`. Kết quả phải là "Allow" khi uid khớp, "Deny" khi không khớp.

## 7. Cấu hình Cloudflare Workers (biến môi trường)

Cấu hình đọc **lúc chạy** từ Worker (`/assets/config.js`), không cần build lại.

1. Vào Cloudflare Dashboard → **Workers & Pages** → Worker `foxfocus` → **Settings → Variables and Secrets**.
2. Thêm (loại **Text**):

| Tên biến | Giá trị | Bắt buộc |
|---|---|---|
| `FIREBASE_API_KEY` | `apiKey` từ bước 3 | Có |
| `FIREBASE_PROJECT_ID` | `projectId` | Có |
| `FIREBASE_APP_ID` | `appId` | Có |
| `FIREBASE_AUTH_DOMAIN` | `authDomain` | Không (mặc định `<projectId>.firebaseapp.com`) |

3. Bấm **Deploy** hoặc lưu lại. Mở `https://<worker>/assets/config.js` để kiểm tra: phải thấy `CLOUD = Object.freeze({...})`. Nếu thấy `CLOUD = null`, một biến đang sai định dạng (xem mục 13).

Thiếu biến thì ứng dụng chạy ở chế độ khách, không lỗi.

## 8. Kiểm tra từng luồng

Thử theo thứ tự, trên điện thoại và máy tính:

1. **Khách**: mở trang chủ, thêm một việc, tải lại. Việc vẫn còn.
2. **Email**: vào **Tài khoản** → nhập email → **Gửi liên kết đăng nhập**. Mở email trên **cùng trình duyệt** và bấm liên kết. Bạn phải được đăng nhập.
   - Nếu mở liên kết trên trình duyệt khác, ứng dụng sẽ hỏi lại email để xác nhận.
3. **Google**: vào **Tài khoản** → **Tiếp tục với Google** → chọn tài khoản → quay về, đã đăng nhập.
4. **Đồng bộ**: thêm việc khi đã đăng nhập, mở trang trên thiết bị khác, cùng tài khoản, việc phải xuất hiện.
5. **Đăng xuất**: dữ liệu trên máy vẫn còn.
6. **Xoá dữ liệu học**: giữ tài khoản, xoá kế hoạch trên máy và trên đám mây.
7. **Xoá tài khoản**: xem mục 10.

## 9. Hạn mức, theo dõi và ngân sách

- Trên Spark, theo dõi mức dùng ở **Firestore → Usage** và **Authentication → Usage**.
- Khi hết hạn mức, người dùng thấy thông báo "Vượt hạn mức miễn phí hôm nay" và dữ liệu vẫn được giữ trên máy. Dữ liệu sẽ đồng bộ lại khi hạn mức được làm mới.
- **Ngân sách (budget alert)** chỉ cần khi bạn nâng lên Blaze. Vào Google Cloud Console → **Billing → Budgets & alerts** → tạo ngân sách, ví dụ 1 USD/tháng, với cảnh báo ở 50%, 90%, 100%.
- Ứng dụng không dùng Cloud Functions, Hosting hay Storage, nên các dịch vụ đó không phát sinh phí.

## 10. Xoá tài khoản

- Trong ứng dụng, **Xoá tài khoản** xoá trước toàn bộ dữ liệu đám mây (kế hoạch, dữ liệu Vật lí, hồ sơ), rồi mới xoá tài khoản Firebase.
- Firebase chỉ cho xoá tài khoản khi bạn **vừa đăng nhập trong vòng vài phút**. Nếu quá lâu, ứng dụng báo "hãy đăng xuất, đăng nhập lại rồi xoá tài khoản ngay". Việc này nhằm tránh xoá nhầm khi phiên cũ bị lộ.
- Nếu xoá dữ liệu thành công nhưng bước xoá tài khoản lỗi mạng, dữ liệu đã mất nhưng tài khoản còn. Đăng nhập lại và bấm xoá tài khoản lần nữa là xong.

## 11. Đăng nhập bằng SMS (tuỳ chọn, có phí)

**Chỉ làm khi bạn chấp nhận chi phí.** Ứng dụng hiện chưa có giao diện SMS; phần này là hướng dẫn cấu hình phía Firebase cho tương lai.

1. **Nâng cấp lên Blaze**: Firebase Console → biểu tượng bánh răng → **Usage and billing → Modify plan → Blaze**. Cần thẻ thanh toán. Đặt ngân sách ngay (mục 9).
2. **Bật Phone**: **Authentication → Sign-in method → Phone → Enable**.
3. **Giới hạn quốc gia gửi SMS**: **Authentication → Settings → SMS region policy**. Chỉ cho phép các quốc gia bạn cần (ví dụ Việt Nam) để tránh bị lạm dụng và tính phí cho vùng đắt.
4. **Chi phí**: giá mỗi tin nhắn khác nhau theo quốc gia. Xem bảng chính thức tại <https://cloud.google.com/identity-platform/pricing> trước khi bật. Một số nguồn thứ cấp nêu khoảng 10 tin miễn phí mỗi ngày trên Blaze và mức từ vài cent đến gần nửa đô la mỗi tin tuỳ vùng. Các con số này **chưa được xác minh** với trang chính thức; hãy kiểm tra lại.
5. **Ghi nhớ**: SMS không có trên Spark. Nếu bạn quay lại Spark, đăng nhập SMS sẽ ngừng hoạt động.

Để dùng SMS trong giao diện cần thêm `RecaptchaVerifier` và luồng xác nhận mã trong `site/src/firebase-sdk.js`. Đây là công việc mã nguồn, không chỉ là cấu hình.

## 12. Apple, GitHub (tuỳ chọn)

- **GitHub**: tạo OAuth App trong GitHub → Settings → Developer settings (miễn phí). Dùng **Authorization callback URL** mà Firebase hiển thị khi bật provider GitHub. Dán Client ID và Client secret vào Firebase. Cần thêm nút trong giao diện.
- **Apple**: cần tài khoản **Apple Developer Program** (trả phí hằng năm), tạo Services ID và khoá. Chỉ đáng làm nếu bạn cần đăng nhập bằng Apple cho người dùng iPhone.

## 13. Xử lý sự cố

| Triệu chứng | Nguyên nhân thường gặp | Cách sửa |
|---|---|---|
| `/assets/config.js` ra `CLOUD = null` | Biến sai định dạng hoặc thiếu | Kiểm tra apiKey bắt đầu bằng `AIza`, appId dạng `1:…:web:…`, projectId chữ thường |
| "Tên miền này chưa được thêm vào Authorized domains" | Thiếu tên miền | Mục 5 |
| "Cách đăng nhập này chưa được bật" | Chưa bật provider | Mục 4 |
| "Không có quyền đọc hoặc ghi dữ liệu" | Quy tắc chưa triển khai | Mục 6.2 |
| Đăng nhập OK nhưng không đồng bộ | Quy tắc sai, hoặc không đúng tài khoản | Xem Firestore → Rules và trang Tài khoản |
| Mở liên kết email báo hết hạn | Liên kết đã dùng hoặc quá cũ | Gửi liên kết mới và mở ngay trên cùng trình duyệt |
| Google quay về trang trắng | Chặn cookie bên thứ ba hoặc tên miền sai | Dùng trình duyệt cho phép cookie; kiểm tra authDomain |
| Console báo CSP chặn `firebaseapp`/`googleapis`/`apis.google.com` | CSP không khớp | Firebase dùng `authDomain` mặc định; nếu dùng tên miền riêng, sửa `frame-src` và `connect-src` trong `site/build.mjs` rồi build lại |
| "Vì bảo mật, hãy đăng nhập lại" | Đăng nhập quá lâu | Đăng xuất, đăng nhập lại, xoá ngay |
| "Vượt hạn mức miễn phí hôm nay" | Spark hết hạn mức | Chờ làm mới, hoặc xem mục 9 |

## 14. Bảo mật, tóm tắt

- Khoá web Firebase công khai là bình thường. **Lớp bảo vệ thật là `firestore.rules`.** Luôn triển khai quy tắc sau mỗi lần sửa.
- Không đưa tệp service account vào repo, không đặt nó vào biến môi trường của Worker. Worker không đọc và từ chối giá trị như vậy.
- Tuỳ chọn: giới hạn khoá API theo tên miền (Google Cloud Console → APIs & Services → Credentials → API key → Website restrictions). Làm sau khi đã kiểm tra mọi luồng, vì giới hạn sai sẽ chặn đăng nhập.
- **App Check** (chống bot và lạm dụng) chưa được bật trong mã. Nên thêm khi ứng dụng đã ổn định. Kiểm tra giá trước khi bật.

## 15. Kiểm chứng

Mã nguồn có test cho logic đăng nhập, đồng bộ, xoá dữ liệu và cấu hình Worker (`npm test`). Các test đó dùng SDK giả, nên **không thay thế việc thử trên dự án Firebase thật**. Hãy làm mục 8 sau khi cấu hình xong.
