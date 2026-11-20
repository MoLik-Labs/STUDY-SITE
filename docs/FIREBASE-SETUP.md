Làm theo đúng thứ tự từ mục 1 đến mục 16. Mỗi bước có **Xong khi** (bạn kiểm tra được bằng mắt) và **Nếu lỗi** (cách xử lý thường gặp). Thời gian khoảng 45–60 phút. Mọi thứ dùng gói **Spark (miễn phí, không cần thẻ)**.

> **Tóm tắt chi phí.** Đăng nhập bằng **email + mật khẩu** và **Google** là cách chính, miễn phí trên Spark. Đăng nhập bằng **liên kết qua email** là phương án phụ, vì Spark chỉ cho **5 thư mỗi ngày** cho cả dự án. **SMS không miễn phí**: Spark không hỗ trợ SMS. Ứng dụng hiện chưa có giao diện SMS, nên bạn không cần làm mục 12.

---

## 0. Trước khi bắt đầu: bạn cần gì

Chuẩn bị các thứ sau, rồi mới bắt đầu mục 1:

| Thứ cần có | Dùng để làm gì | Xong khi |
|---|---|---|
| Một tài khoản Google | Đăng nhập Firebase Console | Mở được https://console.firebase.google.com |
| Tài khoản Cloudflare và Worker `foxfocus` | Chạy trang web (mục 8) | Thấy Worker `foxfocus` trong Workers & Pages |
| Quyền sửa repo GitHub `MoLik-Labs/STUDY-SITE` | Đọc `firestore.rules`, `wrangler.jsonc` | Mở được repo trên GitHub |
| (Tuỳ chọn) Máy có Node.js 18 trở lên | Triển khai quy tắc bằng dòng lệnh (mục 6) | `node -v` hiện số phiên bản |

Bạn **không cần** biết lập trình. Mục 6 có hai cách triển khai quy tắc: dán bằng giao diện web (dễ nhất), hoặc dùng dòng lệnh.

**Bản đồ các bước:**

```
1 Tạo dự án ──► 2 Hiểu gói Spark ──► 3 Đăng ký web, lấy cấu hình
                                              │
4 Bật đăng nhập ◄─────────────────────────────┘
      │
5 Miền được phép ──► 6 Firestore + quy tắc ──► 7 App Check (tuỳ chọn, nên làm)
                                                        │
8 Cloudflare Workers (biến môi trường) ◄────────────────┘
      │
9 Kiểm tra từng luồng ──► 10 Theo dõi hạn mức ──► 16 Checklist cuối
```

---

## 1. Tạo dự án Firebase

1. Mở <https://console.firebase.google.com> và đăng nhập bằng tài khoản Google của bạn.
2. Bấm **Create a project** (hoặc **Thêm dự án**).
3. Đặt tên, ví dụ `study-focus-fox`. Firebase tạo **mã dự án** (project ID) từ tên này, thường viết thường và có thể có số. **Ghi lại mã này.**
4. Google Analytics: **tắt**. Ứng dụng không cần.
5. Bấm **Create project** và chờ xong.

**Xong khi:** trang tổng quan của dự án mở ra, và tên dự án xuất hiện ở góc trên.

**Nếu lỗi:** tên dự án đã có người dùng. Đổi tên khác, ví dụ thêm hậu tố `-2026`.

## 2. Gói Spark, Blaze và giới hạn

- Dự án mới mặc định ở gói **Spark**. Gói này miễn phí, không cần thẻ, không tự phát sinh phí.
- Khi vượt hạn mức, dịch vụ đó bị tạm dừng cho tới khi hạn mức được làm mới. **Không có khoản tiền nào bị tính.**
- **Blaze** giữ hạn mức miễn phí như Spark, nhưng tính tiền phần vượt. Blaze **bắt buộc** nếu muốn SMS (mục 12). Theo quyết định của dự án, ứng dụng ở lại Spark.

Giới hạn Spark cho các dịch vụ ứng dụng dùng. Kiểm tra lại tại <https://firebase.google.com/docs/auth/limits> và <https://firebase.google.com/pricing>, vì Google có thể đổi.

| Dịch vụ | Giới hạn Spark | Ảnh hưởng tới ứng dụng |
|---|---|---|
| Firestore lưu trữ | 1 GiB | Đủ cho nhóm học nhỏ |
| Firestore đọc | 50.000 lượt/ngày | Đủ cho nhóm học nhỏ |
| Firestore ghi | 20.000 lượt/ngày | Đủ cho nhóm học nhỏ |
| Firestore xoá | 20.000 lượt/ngày | Đủ cho nhóm học nhỏ |
| Firestore truyền ra | 10 GiB/tháng | Đủ cho nhóm học nhỏ |
| Authentication email + mật khẩu, Google | Miễn phí | Đường chính |
| **Thư đặt lại mật khẩu** | **150 thư/ngày** (cả dự án) | Có thể chạm khi nhiều người quên mật khẩu cùng lúc |
| **Liên kết đăng nhập qua email** | **5 thư/ngày** (cả dự án) | Chỉ là phương án phụ |
| Liên kết xác nhận địa chỉ email | 10.000 liên kết/ngày | Đủ |

**Xong khi:** bạn hiểu rằng liên kết qua email là phương án phụ và đăng nhập bằng mật khẩu là đường chính.

**Nếu lỗi:** không có lỗi ở bước này. Đây là phần đọc hiểu.

## 3. Đăng ký ứng dụng web và lấy cấu hình

1. Trong dự án, bấm biểu tượng **bánh răng** → **Project settings** → tab **General**.
2. Kéo xuống **Your apps** → bấm biểu tượng **Web** (`</>`).
3. Đặt nickname, ví dụ `study-web`. **Không** bật Firebase Hosting, vì ứng dụng chạy trên Cloudflare. Bấm **Register app**.
4. Sao chép 4 giá trị trong `firebaseConfig`:

| Giá trị trong Firebase | Đặt tên trên Cloudflare (mục 8) | Ví dụ |
|---|---|---|
| `apiKey` | `FIREBASE_API_KEY` | Bắt đầu bằng `AIza`, dài 39 ký tự |
| `projectId` | `FIREBASE_PROJECT_ID` | `study-focus-fox` |
| `appId` | `FIREBASE_APP_ID` | Dạng `1:123456789012:web:abc123` |
| `authDomain` | `FIREBASE_AUTH_DOMAIN` (tuỳ chọn) | `study-focus-fox.firebaseapp.com` |

Đây là **khoá web công khai**. Nó không phải bí mật và sẽ gửi tới trình duyệt của người dùng. Dữ liệu được bảo vệ bởi quy tắc Firestore (mục 6), không phải bởi khoá này.

> **Không** tải tệp "service account" (JSON có `private_key`) cho ứng dụng web. Worker từ chối các giá trị có dạng khoá bí mật.

**Xong khi:** bạn có đủ 4 giá trị trong một ghi chú tạm.

**Nếu lỗi:** không thấy `firebaseConfig`? Bấm lại **Register app** hoặc chọn ứng dụng web đã có trong **Your apps**.

## 4. Bật đăng nhập

Vào **Build → Authentication → Get started**, rồi chọn tab **Sign-in method**. Bật ba cách sau.

### 4.1. Email và mật khẩu (đường chính)

1. Bấm **Email/Password** → bật công tắc **Enable**.
2. Bật thêm **Email link (passwordless sign-in)**. Đây là phương án phụ, và giới hạn 5 thư/ngày vẫn áp dụng. Bật cả hai là bình thường.
3. **Save**.

Sau đó vào **Authentication → Settings** và làm tiếp:

- **User actions → Email enumeration protection**: **bật**. Khi bật, Firebase trả cùng một lỗi cho "sai email" và "sai mật khẩu", nên người lạ không dò được email nào đã đăng ký. Ứng dụng đã hiển thị đúng một câu chung cho cả hai trường hợp.
- **Password policy** (nếu console có mục này): đặt tối thiểu **8 ký tự**, khớp với ứng dụng. Khi tạo tài khoản, ứng dụng kiểm 8 ký tự ngay trên trình duyệt. Firebase có thể yêu cầu cao hơn và sẽ báo lỗi tương ứng.
- **Templates** (thư xác nhận và đặt lại mật khẩu): ứng dụng đặt ngôn ngữ `vi`, nên Firebase dùng bản tiếng Việt khi có sẵn. Bạn có thể sửa nội dung thư ở đây. Đường dẫn trong thư là tên miền bạn đã thêm ở mục 5.

**Xong khi:** trong **Sign-in method**, dòng **Email/Password** hiện trạng thái **Enabled**, và **Enable email enumeration protection** đã bật.

**Nếu lỗi:** "Cách đăng nhập này chưa được bật trong Firebase" nghĩa là bạn chưa bấm Enable ở bước 1.

### 4.2. Google

1. Bấm **Google** → bật **Enable**.
2. Chọn **Project support email** là email của bạn.
3. **Save**. Firebase tự tạo màn hình đồng ý OAuth, không cần cấu hình thêm.

**Xong khi:** dòng **Google** hiện **Enabled**.

**Nếu lỗi:** nếu Google báo lỗi về "support email", chọn lại email trong danh sách rồi Save.

### 4.3. Các cách khác: để TẮT

- **Phone (SMS)**: xem mục 12. Chỉ bật khi đã nâng lên Blaze.
- **Anonymous**: để tắt. Ứng dụng không dùng, và quy tắc bảo mật từ chối tài khoản ẩn danh.
- **Apple, GitHub**: xem mục 13.

## 5. Miền được phép (Authorized domains)

Đây là bước hay bị bỏ qua nhất. Nếu thiếu, đăng nhập và thư xác nhận sẽ báo lỗi `auth/unauthorized-domain`.

1. **Authentication → Settings → Authorized domains**.
2. Đảm bảo có đủ các tên miền sau:
   - `localhost` (đã có sẵn, để thử trên máy).
   - `<tên-worker>.<tài-khoản>.workers.dev`. Ví dụ `foxfocus.<tài-khoản>.workers.dev`. Tên Worker xem trong `wrangler.jsonc`.
   - Tên miền riêng của bạn, nếu có. Ví dụ `study.ten-mien.vn`.
3. **Không** thêm `*` hay tên miền bạn không dùng. Chỉ thêm đúng những địa chỉ người dùng thật sự mở.

**Xong khi:** danh sách có đủ tên miền Worker của bạn.

**Nếu lỗi:** "Tên miền này chưa được thêm vào Authorized domains" nghĩa là thiếu một tên miền trong danh sách này.

## 6. Firestore và quy tắc bảo mật

### 6.1. Tạo cơ sở dữ liệu

1. **Build → Firestore Database → Create database**.
2. Chọn **Native mode**.
3. Chọn vị trí. Vị trí **không đổi được** sau khi tạo. Gợi ý `asia-southeast1` (Singapore), gần Việt Nam.
4. Chọn **Production mode**. Quy tắc sẽ được triển khai ở bước 6.2, nên không cần chế độ thử nghiệm.

**Xong khi:** trang **Firestore Database** hiện một cơ sở dữ liệu trống.

**Nếu lỗi:** cơ sở dữ liệu đã có sẵn thì bỏ qua bước tạo, chỉ cần làm 6.2.

### 6.2. Triển khai quy tắc bảo mật

Quy tắc nằm trong repo, tệp `firestore.rules`. Chọn **một** trong hai cách.

**Cách A: dán bằng giao diện web (không cần cài gì).**

1. Mở tệp `firestore.rules` trên GitHub (`MoLik-Labs/STUDY-SITE`) và sao chép toàn bộ nội dung.
2. Trong Firebase Console, vào **Firestore Database → Rules**.
3. Xoá nội dung cũ, dán nội dung vừa sao chép.
4. Bấm **Publish**.

**Cách B: dòng lệnh (nếu đã có Node.js).**

```bash
npm install -g firebase-tools     # hoặc dùng: npx firebase-tools ...
firebase login                    # đăng nhập bằng tài khoản Google của bạn
cd STUDY-SITE
firebase use <project-id>         # mã dự án ở mục 1
firebase deploy --only firestore:rules
```

Cả hai cách chỉ đẩy quy tắc. Không tạo gì khác và không mất phí trên Spark.

**Quy tắc làm gì.** Chỉ tài khoản đã đăng nhập (và không phải ẩn danh) mới đọc hoặc ghi được dữ liệu có mã `uid` trùng với mã của chính họ. Quy tắc cũng kiểm tra kiểu dữ liệu và độ dài: tên hiển thị tối đa 60 ký tự, lớp tối đa 40 ký tự, kế hoạch tối đa khoảng 900 KB. Mọi đường dẫn khác bị từ chối.

**Xong khi:** trang **Rules** hiện nội dung mới, có ngày publish gần đây.

**Nếu lỗi:** nếu Publish báo lỗi cú pháp, kiểm tra xem đã sao chép đủ toàn bộ tệp chưa, đặc biệt dấu `}` cuối cùng.

### 6.3. Cấu trúc dữ liệu

| Đường dẫn | Nội dung | Ai dùng |
|---|---|---|
| `planners/{uid}` | `{ state: "<JSON>", updatedAt }`: kế hoạch học. `updatedAt` do máy chủ ghi, không dựa vào đồng hồ máy | Trang chủ (lịch tuần) |
| `users/{uid}` | `{ displayName, className, grade, updatedAt }`: hồ sơ. `className` là tên lớp tự do (ví dụ 11A2), `grade` là khối lớp 1–12. Hai bên ghi bằng `merge`, không xoá trường của nhau | Tài khoản, Vật lí |
| `users/{uid}/keys/{khoá}` | `{ value: "<JSON>", updatedAt }`: dữ liệu Vật lí theo từng khoá. Mỗi khoá tối đa 900 000 ký tự | Vật lí |

### 6.4. Kiểm tra quy tắc bằng Rules Playground

1. Trong **Firestore → Rules**, bấm **Rules Playground**.
2. Đặt **Authenticated** là một uid giả, ví dụ `test-uid-123`.
3. Đường dẫn: `planners/test-uid-123`, thao tác `get`. Kết quả phải là **Allow**.
4. Đổi đường dẫn thành `planners/nguoi-khac`, vẫn thao tác `get`. Kết quả phải là **Deny**.
5. Thử thêm đường dẫn `secret/abc`. Kết quả phải là **Deny**.

**Xong khi:** ba kết quả trên đúng như mô tả.

**Nếu lỗi:** nếu kết quả khác, quy tắc chưa được publish đúng. Quay lại mục 6.2.

## 7. App Check: chống bot và client giả (nên làm)

Khoá web ở mục 3 ai cũng xem được. App Check gắn thêm một token do trình duyệt thật tạo (qua reCAPTCHA v3, người dùng không phải bấm gì), để Firebase biết yêu cầu đến từ trang web thật. **App Check không thay thế quy tắc Firestore**. Nó chỉ chặn thêm script lạ.

Ứng dụng đã sẵn sàng. Nếu có biến `FIREBASE_APPCHECK_SITE_KEY` (mục 8), trình duyệt sẽ gắn token. Nếu không có, ứng dụng vẫn chạy như bình thường. Lỗi khởi tạo App Check không làm hỏng đăng nhập.

Làm theo đúng thứ tự. **Không bật Enforce sớm.**

1. **Build → App Check → Get started**. Chọn ứng dụng web đã đăng ký ở mục 3 → **Register**.
2. Chọn provider **reCAPTCHA v3**. Firebase dẫn bạn tới trang reCAPTCHA để tạo **site key**. Trong đó, thêm các domain: `<tên-worker>.<tài-khoản>.workers.dev`, tên miền riêng (nếu có), và `localhost` để thử. reCAPTCHA chỉ chấp nhận token từ domain đã đăng ký.
3. Sao chép **site key** (dạng `6L…`). Đây là khoá công khai, không phải bí mật. Bạn sẽ đặt nó ở mục 8.
4. **Giai đoạn đo (Unenforced, mặc định).** App Check chỉ ghi nhận, không chặn. Sau vài ngày có người dùng thật, xem số yêu cầu **Verified** so với **Unverified** trong App Check. Chỉ tiếp tục khi đa số yêu cầu là Verified, và bạn đã tự thử đăng nhập và đồng bộ (mục 9) trên hai thiết bị.
5. **Bật Enforce** cho Cloud Firestore: **App Check → APIs → Cloud Firestore → Enforce**. Nếu bật Enforce cho Authentication, làm tương tự rồi kiểm tra lại đăng nhập.
6. Nếu có sự cố sau khi bật Enforce, bấm lại **Unenforced** ngay. Dữ liệu không mất.

Lưu ý: reCAPTCHA và các điều khoản đi kèm do Google quy định. Trước khi bật, kiểm tra điều khoản và hạn mức hiện hành tại trang Google, vì con số miễn phí có thể thay đổi.

**Xong khi:** App Check hiện ứng dụng web ở trạng thái đã đăng ký, và có số liệu Verified trong vài ngày.

**Nếu lỗi:** "Invalid site key" hoặc sai domain nghĩa là domain chưa được thêm vào trang reCAPTCHA (bước 2), hoặc site key bị sao chép thiếu.

## 8. Cấu hình Cloudflare Workers

Cấu hình được đọc **lúc chạy** từ Worker (`/assets/config.js`), nên không cần build lại. Chỉ cần lưu biến và deploy.

1. Vào Cloudflare Dashboard → **Workers & Pages** → Worker `foxfocus` → **Settings → Variables and Secrets**.
2. Thêm từng biến (loại **Text**):

| Tên biến | Giá trị | Bắt buộc |
|---|---|---|
| `FIREBASE_API_KEY` | `apiKey` từ mục 3 | Có |
| `FIREBASE_PROJECT_ID` | `projectId` từ mục 3 | Có |
| `FIREBASE_APP_ID` | `appId` từ mục 3 | Có |
| `FIREBASE_AUTH_DOMAIN` | `authDomain` từ mục 3 | Không (mặc định `<projectId>.firebaseapp.com`) |
| `FIREBASE_APPCHECK_SITE_KEY` | Site key reCAPTCHA v3 từ mục 7 | Không (App Check tắt nếu thiếu) |

3. Bấm **Deploy** hoặc lưu lại.
4. Mở `https://<tên-worker>.<tài-khoản>.workers.dev/assets/config.js` để kiểm tra.

**Xong khi:** trang `/assets/config.js` hiện `CLOUD = Object.freeze({...})` với `apiKey`, `projectId`, `appId`. Nếu có App Check, còn thấy `appCheckKey`.

**Nếu lỗi:** nếu thấy `CLOUD = null`, một biến đang sai định dạng. Kiểm tra lại: `apiKey` bắt đầu bằng `AIza`, `appId` dạng `1:…:web:…`, `projectId` viết thường. Site key App Check dài từ 20 đến 100 ký tự, chỉ gồm chữ, số, `_` và `-`. Thiếu biến thì ứng dụng chạy ở chế độ khách, không báo lỗi.

## 9. Kiểm tra từng luồng

Thử theo đúng thứ tự, trên cả điện thoại và máy tính. Mỗi bước có kết quả mong đợi.

1. **Khách.** Mở trang chủ, thêm một việc, tải lại. Việc vẫn còn.
2. **Tạo tài khoản.** Vào **Tài khoản** → **Tạo tài khoản** → nhập email và mật khẩu ít nhất 8 ký tự. Bạn được đăng nhập ngay. Thư xác nhận được gửi tới email (nếu chưa thấy, kiểm tra thư rác).
3. **Sai mật khẩu.** Đăng xuất, đăng nhập lại với mật khẩu sai. Phải thấy đúng câu "Email hoặc mật khẩu chưa đúng". Câu này không cho biết email có tồn tại hay không.
4. **Quên mật khẩu.** Nhập email → bấm **Quên mật khẩu?** → mở thư → đặt mật khẩu mới → đăng nhập lại. Thông báo luôn giống nhau, dù email có đăng ký hay không.
5. **Liên kết qua email (phụ).** Mục **Đăng nhập không cần mật khẩu** → nhập email → **Gửi liên kết tới email**. Mở thư trên **cùng trình duyệt** và bấm liên kết. Nếu mở trên trình duyệt khác, ứng dụng sẽ hỏi lại email để xác nhận. Đừng thử nhiều lần trong một ngày (mục 10).
6. **Google.** **Tài khoản** → **Tiếp tục với Google** → chọn tài khoản → quay về, đã đăng nhập.
7. **Đồng bộ.** Khi đã đăng nhập, thêm một việc. Mở trang trên thiết bị khác, cùng tài khoản. Việc phải xuất hiện.
8. **Đăng xuất.** Dữ liệu trên máy vẫn còn.
9. **Xoá dữ liệu học.** Giữ tài khoản, xoá kế hoạch trên máy và trên đám mây.
10. **Xoá tài khoản.** Xem mục 11.
11. **Vật lí.** Mở `/physic/`, vào `#/account`. Đăng nhập bằng mật khẩu. Tài khoản phải hiện email đã đăng nhập, và dữ liệu Vật lí đồng bộ được giữa hai thiết bị.

**Xong khi:** cả 11 bước đều đúng kết quả mong đợi.

**Nếu lỗi:** xem mục 14 theo triệu chứng.

## 10. Hạn mức, theo dõi và ngân sách

- Trên Spark, theo dõi mức dùng ở **Firestore → Usage** và **Authentication → Usage**.
- **Thư từ Firebase** là hạn mức dễ chạm nhất (mục 2): 150 thư đặt lại mật khẩu và 5 thư liên kết mỗi ngày, tính chung cho cả dự án.
- Khi hết lượt gửi thư, người dùng thấy: "Hết lượt gửi email hôm nay trên gói miễn phí. Thử lại ngày mai." Người đã có mật khẩu vẫn đăng nhập được bình thường. Chỉ việc gửi thư bị tạm dừng.
- Khi hết hạn mức Firestore, người dùng thấy "Vượt hạn mức miễn phí hôm nay". Dữ liệu vẫn giữ trên máy và sẽ đồng bộ lại khi hạn mức được làm mới.
- **Ngân sách (budget alert)** chỉ cần khi bạn nâng lên Blaze. Vào Google Cloud Console → **Billing → Budgets & alerts** → tạo ngân sách, ví dụ 1 USD/tháng, cảnh báo ở 50%, 90%, 100%.
- Ứng dụng không dùng Cloud Functions, Hosting hay Storage, nên các dịch vụ đó không phát sinh phí.

**Xong khi:** bạn biết đường dẫn tới trang Usage và biết hạn mức thư là 5 và 150 mỗi ngày.

## 11. Xoá tài khoản

- Trong ứng dụng, **Xoá tài khoản** xoá trước toàn bộ dữ liệu đám mây (kế hoạch, dữ liệu Vật lí, hồ sơ), rồi mới xoá tài khoản Firebase.
- Firebase chỉ cho xoá tài khoản khi bạn **vừa đăng nhập trong vài phút**. Nếu quá lâu, ứng dụng báo "hãy đăng xuất, đăng nhập lại rồi xoá tài khoản ngay". Việc này nhằm tránh xoá nhầm khi phiên cũ bị lộ.
- Nếu xoá dữ liệu thành công nhưng bước xoá tài khoản lỗi mạng, dữ liệu đã mất nhưng tài khoản còn. Đăng nhập lại và bấm xoá tài khoản lần nữa là xong.

## 12. Đăng nhập bằng SMS (tuỳ chọn, có phí)

**Chỉ làm khi bạn chấp nhận chi phí.** Ứng dụng hiện chưa có giao diện SMS. Mục này chỉ là hướng dẫn cấu hình phía Firebase cho tương lai.

1. **Nâng cấp lên Blaze**: Firebase Console → biểu tượng bánh răng → **Usage and billing → Modify plan → Blaze**. Cần thẻ thanh toán. Đặt ngân sách ngay (mục 10).
2. **Bật Phone**: **Authentication → Sign-in method → Phone → Enable**.
3. **Giới hạn quốc gia gửi SMS**: **Authentication → Settings → SMS region policy**. Chỉ cho phép các quốc gia bạn cần, ví dụ Việt Nam, để tránh bị lạm dụng và tính phí vùng đắt.
4. **Chi phí**: giá mỗi tin khác nhau theo quốc gia. Xem bảng chính thức tại <https://cloud.google.com/identity-platform/pricing> trước khi bật. Các con số thứ cấp về "10 tin miễn phí mỗi ngày" **chưa được xác minh**.
5. **Ghi nhớ**: SMS không có trên Spark. Nếu quay lại Spark, đăng nhập SMS sẽ ngừng hoạt động.

Để dùng SMS trong giao diện cần thêm `RecaptchaVerifier` và luồng xác nhận mã trong `site/src/firebase-sdk.js`. Đây là công việc mã nguồn, không chỉ là cấu hình.

## 13. Apple và GitHub (tuỳ chọn)

- **GitHub**: tạo OAuth App trong GitHub → Settings → Developer settings (miễn phí). Dùng **Authorization callback URL** mà Firebase hiển thị khi bật provider GitHub. Dán Client ID và Client secret vào Firebase. Cần thêm nút trong giao diện.
- **Apple**: cần tài khoản **Apple Developer Program** (trả phí hằng năm), tạo Services ID và khoá. Chỉ đáng làm nếu bạn cần đăng nhập bằng Apple cho người dùng iPhone.

## 14. Xử lý sự cố

| Triệu chứng | Nguyên nhân thường gặp | Cách sửa |
|---|---|---|
| `/assets/config.js` hiện `CLOUD = null` | Biến sai định dạng hoặc thiếu | Mục 8, phần "Nếu lỗi" |
| "Tên miền này chưa được thêm vào Authorized domains" | Thiếu tên miền | Mục 5 |
| "Cách đăng nhập này chưa được bật" | Chưa bật provider | Mục 4 |
| "Email hoặc mật khẩu chưa đúng" dù chắc chắn đúng | Tài khoản tạo bằng liên kết email hoặc Google nên chưa có mật khẩu | Bấm **Quên mật khẩu?** để đặt mật khẩu. Hoặc kiểm tra Email/Password đã Enable (mục 4.1) |
| Không thấy thư xác nhận hoặc đặt lại mật khẩu | Thư nằm trong mục rác, hoặc hết lượt trong ngày (mục 10), hoặc thiếu Authorized domains | Kiểm tra thư rác. Chờ ngày mai nếu hết lượt. Kiểm tra mục 5 |
| "Hết lượt gửi email hôm nay" | Hết hạn mức 150 thư đặt lại hoặc 5 liên kết email mỗi ngày trên Spark | Chờ ngày mai. Người có mật khẩu vẫn đăng nhập được |
| "Không có quyền đọc hoặc ghi dữ liệu" | Quy tắc chưa publish, hoặc App Check đang Enforce mà token không hợp lệ | Mục 6.2. Nếu vừa bật Enforce, chuyển về Unenforced và kiểm tra mục 7 |
| Đăng nhập được nhưng không đồng bộ | Quy tắc sai, hoặc đang đăng nhập bằng tài khoản khác | Xem Firestore → Rules và trang Tài khoản |
| reCAPTCHA báo site key không hợp lệ hoặc sai domain | Domain chưa thêm vào trang reCAPTCHA, hoặc site key sai | Mục 7, bước 2 và 3 |
| Google quay về trang trắng | Trình duyệt chặn cookie bên thứ ba, hoặc tên miền sai | Cho phép cookie. Kiểm tra `authDomain` |
| Console báo CSP chặn `firebaseapp`, `googleapis`, `apis.google.com` hoặc reCAPTCHA | CSP không khớp | Firebase dùng `authDomain` mặc định. Danh sách máy chủ nằm trong `site/firebase-origins.json`, dùng chung cho trang chính và trang Vật lí. Nếu dùng tên miền riêng, thêm vào đó rồi build lại |
| "Vì bảo mật, hãy đăng nhập lại" | Đăng nhập đã quá lâu | Đăng xuất, đăng nhập lại, rồi xoá ngay |
| "Vượt hạn mức miễn phí hôm nay" | Spark hết hạn mức Firestore | Chờ làm mới, hoặc xem mục 10 |

## 15. Bảo mật, tóm tắt

- Khoá web Firebase công khai là bình thường. **Lớp bảo vệ thật là `firestore.rules`.** Luôn publish lại quy tắc sau mỗi lần sửa.
- Không đưa tệp service account vào repo và không đặt nó vào biến môi trường của Worker. Worker không đọc và từ chối giá trị như vậy.
- Bật **Email enumeration protection** và đặt mật khẩu tối thiểu 8 ký tự (mục 4.1).
- Tuỳ chọn: giới hạn khoá API theo tên miền (Google Cloud Console → APIs & Services → Credentials → API key → Website restrictions). Làm sau khi đã kiểm tra mọi luồng, vì giới hạn sai sẽ chặn đăng nhập.
- **App Check** đã được hỗ trợ trong mã (mục 7). Bật dần: đo trước, Enforce sau khi đã xác nhận token đi qua.

## 16. Kiểm chứng và checklist cuối

Mã nguồn có test cho logic đăng nhập bằng mật khẩu và liên kết, đồng bộ, xoá dữ liệu, giao diện đăng nhập và cấu hình Worker/CSP (`npm test`). Các test đó dùng SDK giả, nên **không thay thế việc thử trên dự án Firebase thật**. Hãy làm mục 9 sau khi cấu hình xong.

Đánh dấu từng dòng khi xong:

- [ ] Mục 1: tạo dự án, ghi lại project ID
- [ ] Mục 3: có đủ 4 giá trị cấu hình
- [ ] Mục 4.1: Email/Password bật, email enumeration protection bật
- [ ] Mục 4.2: Google bật
- [ ] Mục 5: Authorized domains có tên miền Worker
- [ ] Mục 6.1–6.2: Firestore đã tạo, quy tắc đã publish
- [ ] Mục 6.4: Rules Playground cho đúng ba kết quả
- [ ] Mục 7: App Check đã đăng ký (Unenforced trước)
- [ ] Mục 8: năm biến đã đặt, `/assets/config.js` đúng
- [ ] Mục 9: cả 11 luồng đã thử
- [ ] Mục 10: đã biết cách xem Usage
- [ ] Mục 7 (sau vài ngày): đã xem số Verified và quyết định bật Enforce hay chưa
