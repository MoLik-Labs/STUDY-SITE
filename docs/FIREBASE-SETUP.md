# Cấu hình Firebase từ A đến Z

Tài liệu này dành cho người quản trị dự án STUDY-SITE. Làm theo đúng thứ tự, mất khoảng 45–60 phút. Mọi bước đều dùng gói **Spark (miễn phí, không cần thẻ)**. Ứng dụng được thiết kế để chạy ổn định trên Spark với một nhóm người dùng nhỏ; các giới hạn cụ thể nằm ở mục 2 và mục 9.

> **Lưu ý quan trọng về chi phí.** Đăng nhập bằng **email + mật khẩu** và **Google** là đường chính, miễn phí trên Spark. Đăng nhập bằng **liên kết qua email** chỉ là phương án phụ vì Spark giới hạn **5 thư mỗi ngày** cho cả dự án. **SMS không miễn phí**: Spark không hỗ trợ SMS, muốn bật phải nâng lên Blaze (cần thẻ) và trả tiền theo từng tin nhắn. Ứng dụng hiện **chưa có giao diện SMS**, nên bạn không cần làm mục 11.

---

## 0. Bạn sẽ có gì sau khi làm xong

| Cách đăng nhập | Trạng thái trong mã | Chi phí | Ghi chú |
|---|---|---|---|
| Email + mật khẩu (chính) | Đã có | Miễn phí (Spark) | Tạo tài khoản, đăng nhập, quên mật khẩu |
| Google | Đã có | Miễn phí (Spark) | Chuyển hướng sang Google rồi quay về |
| Liên kết qua email (phụ) | Đã có | Miễn phí, **5 thư/ngày** cho cả dự án | Không cần mật khẩu; dùng khi cần |
| Khách (không đăng nhập) | Đã có | Miễn phí | Dữ liệu chỉ nằm trên máy |
| SMS | Chưa có giao diện | **Cần Blaze, tính phí theo tin** | Mục 11 |
| Apple | Chưa có | Cần tài khoản Apple Developer (trả phí hằng năm) | Mục 12 |
| GitHub | Chưa có | Miễn phí | Mục 12 |
| Ẩn danh (Anonymous) | Không dùng | Miễn phí | Quy tắc bảo mật từ chối tài khoản ẩn danh |

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
- Blaze giữ hạn mức miễn phí giống Spark nhưng tính tiền phần vượt. Blaze **bắt buộc** nếu bạn muốn SMS (mục 11) hoặc muốn gửi nhiều hơn 5 thư liên kết mỗi ngày. Theo quyết định của dự án, ứng dụng ở lại Spark.

Giới hạn Spark cho các dịch vụ dùng trong ứng dụng (theo trang chính thức <https://firebase.google.com/docs/auth/limits> và <https://firebase.google.com/pricing>; kiểm tra lại vì Google có thể đổi):

- **Firestore**: 1 GiB lưu trữ, 50.000 lượt đọc/ngày, 20.000 lượt ghi/ngày, 20.000 lượt xoá/ngày, 10 GiB truyền ra/tháng.
- **Authentication (email + mật khẩu, Google)**: miễn phí.
- **Thư gửi từ Firebase (trên Spark, tính chung cho cả dự án):**
  - Đặt lại mật khẩu: **150 thư/ngày**.
  - Liên kết đăng nhập qua email: **5 thư/ngày**.
  - Liên kết xác nhận địa chỉ email: 10.000 liên kết/ngày.

Với một nhóm học nhỏ, các hạn mức Firestore thường đủ. Hạn mức **thư** là giới hạn dễ chạm nhất; mục 9 hướng dẫn cách theo dõi và xử lý.

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

### 4.1. Email + mật khẩu (cách chính)
1. Bấm **Email/Password** → bật công tắc **Enable**.
2. Bật thêm công tắc **Email link (passwordless sign-in)**. Đây là phương án phụ (mục 2 nêu giới hạn 5 thư/ngày). Bật cả hai là bình thường.
3. **Save**.

Sau đó, trong **Authentication → Settings**:

- **User actions → Email enumeration protection**: **bật**. Khi bật, Firebase trả cùng một lỗi cho "sai email" và "sai mật khẩu", nên người lạ không dò được email nào đã đăng ký. Ứng dụng đã hiển thị đúng một câu chung ("Email hoặc mật khẩu chưa đúng") cho cả hai trường hợp.
- **Password policy** (nếu có mục này): đặt tối thiểu **8 ký tự**, khớp với ứng dụng. Khi tạo tài khoản, ứng dụng kiểm 8 ký tự ngay trên trình duyệt; Firebase có thể yêu cầu cao hơn và sẽ báo lỗi tương ứng.
- **Templates** (thư xác nhận và đặt lại mật khẩu): ứng dụng đặt ngôn ngữ `vi`, nên Firebase dùng bản tiếng Việt khi có sẵn. Bạn có thể sửa nội dung thư ở đây; đường dẫn trong thư là tên miền bạn đã thêm ở mục 5.

### 4.2. Google (bắt buộc cho đăng nhập Google)
1. Bấm **Google** → bật **Enable**.
2. Chọn **Project support email** (email của bạn).
3. **Save**. Firebase tự tạo màn hình đồng ý OAuth; không cần cấu hình thêm.

### 4.3. Các cách khác: để TẮT
- **Phone (SMS)**: xem mục 11. Chỉ bật khi đã nâng lên Blaze.
- **Anonymous**: để tắt; ứng dụng không dùng và quy tắc bảo mật từ chối tài khoản ẩn danh.
- **Apple, GitHub**: xem mục 12.

## 5. Miền được phép (Authorized domains)

Đây là bước hay bị bỏ qua nhất. Nếu thiếu, đăng nhập và thư xác nhận sẽ báo lỗi `auth/unauthorized-domain`.

1. **Authentication → Settings → Authorized domains**.
2. Đảm bảo có:
   - `localhost` (đã có sẵn, dùng để thử trên máy)
   - `<tên-worker>.<tài-khoản>.workers.dev` (địa chỉ Cloudflare Workers của bạn; xem tên Worker trong `wrangler.jsonc`, ví dụ `foxfocus.<tài-khoản>.workers.dev`)
   - tên miền riêng của bạn, nếu có (ví dụ `study.ten-mien.vn`)
3. Không thêm `*` hay tên miền lạ. Chỉ thêm đúng những địa chỉ mà người dùng thật sự mở. Cùng danh sách này áp dụng cho các thư đặt lại mật khẩu và xác nhận.

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
| `planners/{uid}` | `{ state: "<JSON>", updatedAt }` kế hoạch học. `updatedAt` do máy chủ ghi (không dựa đồng hồ máy) | Trang chủ (lịch tuần) |
| `users/{uid}` | `{ displayName, className, grade, updatedAt }` hồ sơ. `className` là tên lớp tự do (ví dụ 11A2), `grade` là khối lớp 1–12. Hai bên ghi bằng `merge`, không xoá trường của nhau | Tài khoản, Vật lí |
| `users/{uid}/keys/{khoá}` | `{ value: "<JSON>", updatedAt }` dữ liệu Vật lí theo khoá (`updatedAt` do máy chủ ghi). Mỗi khoá tối đa 900 000 ký tự | Vật lí |

### 6.3. Kiểm tra quy tắc (tuỳ chọn)
Trong **Firestore → Rules**, Firebase hiển thị bản đang chạy. Bạn có thể dùng **Rules Playground** để thử: đặt `auth` là một uid, đường dẫn `planners/<uid>`, thao tác `get` và `update`. Kết quả phải là "Allow" khi uid khớp, "Deny" khi không khớp.

### 6.4. App Check (reCAPTCHA v3): chống bot và client giả
Khoá web ở mục 3 ai cũng thấy được. App Check gắn thêm một token do trình duyệt thật tạo (qua reCAPTCHA v3, người dùng không phải bấm gì) để Firebase biết yêu cầu đến từ site thật. **App Check không thay thế quy tắc Firestore**; nó chỉ chặn thêm script lạ.

Ứng dụng đã sẵn sàng: nếu có biến `FIREBASE_APPCHECK_SITE_KEY` (mục 7), trình duyệt sẽ gắn token; nếu không có, ứng dụng vẫn chạy bình thường như trước. Lỗi khởi tạo App Check không làm hỏng đăng nhập.

Các bước (làm theo đúng thứ tự, **không bật Enforce sớm**):

1. Firebase Console → **Build → App Check** → **Get started** → chọn ứng dụng web đã đăng ký ở mục 3 → **Register**.
2. Chọn provider **reCAPTCHA v3**. Firebase dẫn bạn tới trang reCAPTCHA để tạo **site key**. Trong đó, thêm các domain: `<tên-worker>.<tài-khoản>.workers.dev`, tên miền riêng (nếu có) và `localhost` để thử. reCAPTCHA chỉ chấp nhận token từ domain đã đăng ký.
3. Sao chép **site key** (dạng `6L…`) và đặt vào Worker (mục 7) thành `FIREBASE_APPCHECK_SITE_KEY`. Đây là khoá công khai, không phải bí mật. Deploy lại Worker (biến được đọc lúc chạy, không cần build lại).
4. Kiểm tra `https://<worker>/assets/config.js`: phải thấy `appCheckKey` trong `CLOUD`.
5. **Giai đoạn đo (Unenforced, mặc định)**: App Check chỉ ghi nhận, không chặn. Trong App Check, xem số yêu cầu **Verified** so với **Unverified** trong vài ngày, khi đã có người dùng thật. Chỉ tiếp tục khi đa số yêu cầu là Verified và bạn đã tự thử đăng nhập và đồng bộ (mục 8) trên hai thiết bị.
6. **Bật Enforce** cho Cloud Firestore (App Check → APIs → Cloud Firestore → Enforce). Nếu bật Enforce cho Authentication, làm tương tự và kiểm tra lại đăng nhập. Nếu có sự cố, bấm lại **Unenforced** ngay; dữ liệu không mất.

Lưu ý: reCAPTCHA và các điều khoản đi kèm do Google quy định. Trước khi bật, kiểm tra điều khoản và hạn mức hiện hành tại trang Google, vì con số miễn phí có thể thay đổi.

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
| `FIREBASE_APPCHECK_SITE_KEY` | site key reCAPTCHA v3 từ mục 6.4 | Không (App Check tắt nếu thiếu) |

3. Bấm **Deploy** hoặc lưu lại. Mở `https://<worker>/assets/config.js` để kiểm tra: phải thấy `CLOUD = Object.freeze({...})`. Nếu thấy `CLOUD = null`, một biến đang sai định dạng (xem mục 13).

Thiếu biến thì ứng dụng chạy ở chế độ khách, không lỗi. Thiếu `FIREBASE_APPCHECK_SITE_KEY` chỉ có nghĩa là chưa bật App Check.

## 8. Kiểm tra từng luồng

Thử theo thứ tự, trên điện thoại và máy tính:

1. **Khách**: mở trang chủ, thêm một việc, tải lại. Việc vẫn còn.
2. **Tạo tài khoản**: vào **Tài khoản** → **Tạo tài khoản** → nhập email và mật khẩu (ít nhất 8 ký tự). Bạn được đăng nhập ngay. Thư xác nhận được gửi tới email; nếu không thấy, kiểm tra thư rác.
3. **Đăng nhập bằng mật khẩu**: đăng xuất, đăng nhập lại. Nhập sai mật khẩu phải thấy đúng câu "Email hoặc mật khẩu chưa đúng", không nói email có tồn tại hay không.
4. **Quên mật khẩu**: nhập email → bấm **Quên mật khẩu?** → mở thư → đặt mật khẩu mới → đăng nhập lại. Thông báo luôn giống nhau, dù email có đăng ký hay không.
5. **Liên kết qua email (phụ)**: mục **Đăng nhập không cần mật khẩu** → nhập email → **Gửi liên kết tới email**. Mở email trên **cùng trình duyệt** và bấm liên kết. Nếu mở trên trình duyệt khác, ứng dụng sẽ hỏi lại email để xác nhận. Đừng dùng cách này để thử nhiều lần trong một ngày (mục 2).
6. **Google**: **Tài khoản** → **Tiếp tục với Google** → chọn tài khoản → quay về, đã đăng nhập.
7. **Đồng bộ**: thêm việc khi đã đăng nhập, mở trang trên thiết bị khác, cùng tài khoản, việc phải xuất hiện.
8. **Đăng xuất**: dữ liệu trên máy vẫn còn.
9. **Xoá dữ liệu học**: giữ tài khoản, xoá kế hoạch trên máy và trên đám mây.
10. **Xoá tài khoản**: xem mục 10.

## 9. Hạn mức, theo dõi và ngân sách

- Trên Spark, theo dõi mức dùng ở **Firestore → Usage** và **Authentication → Usage**.
- **Thư từ Firebase** là hạn mức dễ chạm nhất (mục 2): 150 thư đặt lại mật khẩu và 5 thư liên kết mỗi ngày, tính chung cho cả dự án. Khi hết lượt, người dùng thấy "Hết lượt gửi email hôm nay trên gói miễn phí. Thử lại ngày mai." Người đã có mật khẩu vẫn đăng nhập được bình thường; chỉ việc gửi thư bị tạm dừng.
- Khi hết hạn mức Firestore, người dùng thấy "Vượt hạn mức miễn phí hôm nay" và dữ liệu vẫn được giữ trên máy. Dữ liệu sẽ đồng bộ lại khi hạn mức được làm mới.
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
4. **Chi phí**: giá mỗi tin nhắn khác nhau theo quốc gia. Xem bảng chính thức tại <https://cloud.google.com/identity-platform/pricing> trước khi bật. Các con số thứ cấp về "10 tin miễn phí mỗi ngày" **chưa được xác minh**; hãy kiểm tra lại.
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
| "Email hoặc mật khẩu chưa đúng" dù chắc chắn đúng | Tài khoản được tạo bằng liên kết email hoặc Google nên chưa có mật khẩu | Bấm **Quên mật khẩu?** để đặt mật khẩu; hoặc kiểm tra Email/Password đã Enable (mục 4.1) |
| Không thấy thư xác nhận hoặc đặt lại mật khẩu | Thư rác, hoặc hết lượt trong ngày (mục 9), hoặc thiếu Authorized domains | Kiểm tra thư rác; chờ ngày mai nếu hết lượt; kiểm tra mục 5 |
| "Hết lượt gửi email hôm nay" | Hạn mức 150 đặt lại mật khẩu hoặc 5 liên kết email/ngày trên Spark | Chờ ngày mai; người có mật khẩu vẫn đăng nhập được |
| "Không có quyền đọc hoặc ghi dữ liệu" | Quy tắc chưa triển khai, hoặc App Check đang Enforce mà token không hợp lệ | Mục 6.2; nếu vừa bật Enforce, chuyển về Unenforced và kiểm tra mục 6.4 |
| Đăng nhập OK nhưng không đồng bộ | Quy tắc sai, hoặc không đúng tài khoản | Xem Firestore → Rules và trang Tài khoản |
| reCAPTCHA báo khoá không hợp lệ hoặc sai domain | Domain chưa thêm vào trang reCAPTCHA, hoặc khoá sai | Mục 6.4, bước 2 và 3 |
| Google quay về trang trắng | Chặn cookie bên thứ ba hoặc tên miền sai | Dùng trình duyệt cho phép cookie; kiểm tra authDomain |
| Console báo CSP chặn `firebaseapp`/`googleapis`/`apis.google.com`/`recaptcha` | CSP không khớp | Firebase dùng `authDomain` mặc định. Danh sách máy chủ nằm trong `site/firebase-origins.json`, dùng chung cho trang chính và trang Vật lí; nếu dùng tên miền riêng, thêm vào đó rồi build lại |
| "Vì bảo mật, hãy đăng nhập lại" | Đăng nhập quá lâu | Đăng xuất, đăng nhập lại, xoá ngay |
| "Vượt hạn mức miễn phí hôm nay" | Spark hết hạn mức Firestore | Chờ làm mới, hoặc xem mục 9 |

## 14. Bảo mật, tóm tắt

- Khoá web Firebase công khai là bình thường. **Lớp bảo vệ thật là `firestore.rules`.** Luôn triển khai quy tắc sau mỗi lần sửa.
- Không đưa tệp service account vào repo, không đặt nó vào biến môi trường của Worker. Worker không đọc và từ chối giá trị như vậy.
- Bật **Email enumeration protection** và đặt mật khẩu tối thiểu 8 ký tự (mục 4.1).
- Tuỳ chọn: giới hạn khoá API theo tên miền (Google Cloud Console → APIs & Services → Credentials → API key → Website restrictions). Làm sau khi đã kiểm tra mọi luồng, vì giới hạn sai sẽ chặn đăng nhập.
- **App Check** đã được hỗ trợ trong mã (mục 6.4). Bật dần: đo trước, Enforce sau khi đã xác nhận token đi qua.

## 15. Kiểm chứng

Mã nguồn có test cho logic đăng nhập bằng mật khẩu và liên kết, đồng bộ, xoá dữ liệu, giao diện đăng nhập và cấu hình Worker/CSP (`npm test`). Các test đó dùng SDK giả, nên **không thay thế việc thử trên dự án Firebase thật**. Hãy làm mục 8 sau khi cấu hình xong, và kiểm tra quy tắc bằng Rules Playground (mục 6.3).
