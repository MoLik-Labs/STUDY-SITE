# Thiết lập tài khoản & đồng bộ (Supabase)

Tài khoản là **tuỳ chọn**. Không có tài khoản, app vẫn chạy đầy đủ ở chế độ khách,
dữ liệu nằm trên máy. Tài liệu này dành cho người quản trị triển khai.

## 1. Thông tin đã có sẵn

| Mục | Giá trị |
|---|---|
| Project | `study-focus-fox` (organization NIGHT FOX) |
| Project ref | `ljsmiazfmmdxoprjggke` |
| Region | `ap-southeast-1` (Singapore, gần Việt Nam) |
| Gói | Free |
| Project URL | `https://ljsmiazfmmdxoprjggke.supabase.co` |

Schema đã được tạo bằng migration `init_user_state_and_profiles` và
`allow_null_state_value`, gồm hai bảng có RLS:

- `profiles(id, display_name, grade, updated_at)`
- `user_state(user_id, key, value jsonb, updated_at)`, khoá chính `(user_id, key)`

Hàm `public.delete_my_account()` cho phép người dùng tự xoá tài khoản. Chỉ role
`authenticated` được gọi.

## 2. Biến môi trường khi build

Build đọc hai biến và **từ chối** nếu khoá trông như khoá bí mật.

```
SUPABASE_URL=https://ljsmiazfmmdxoprjggke.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...   # khoá CÔNG KHAI, lấy ở Project Settings → API Keys
```

- Chạy local: `SUPABASE_URL=... SUPABASE_PUBLISHABLE_KEY=... npm run build`
- Cloudflare Workers Builds: thêm hai biến trong **Settings → Build → Variables and secrets**
  (dùng loại *Variable*, không dùng *Secret*, vì khoá công khai vẫn sẽ nằm trong bản build).
- **Tuyệt đối không** đặt `service_role` hoặc `sb_secret_…` ở bất kỳ đâu trong repo,
  trong biến build hoặc trong trình duyệt. Chúng bỏ qua RLS.

Không đặt biến nào → bản build chỉ có chế độ khách. CI vẫn dựng bản đó và so với
bản đã commit, nên `dist/` và `index.html` trong repo luôn là bản không có cấu hình đám mây.

## 3. Cấu hình Authentication (Dashboard → Authentication)

1. **URL Configuration**
   - *Site URL*: địa chỉ Workers của bạn, ví dụ `https://foxfocus.<tài-khoản>.workers.dev`
   - *Redirect URLs*: thêm cùng địa chỉ đó, kèm `http://localhost:8124/**` nếu chạy local
2. **Providers → Email**: bật. Giữ *Confirm email* để tránh tài khoản rác.
3. **Providers → Google** (tuỳ chọn):
   - Tạo OAuth Client ID kiểu *Web application* trong Google Cloud Console.
   - Authorized redirect URI: `https://ljsmiazfmmdxoprjggke.supabase.co/auth/v1/callback`
   - Dán Client ID và Client Secret vào Supabase, rồi bật provider.
4. **Email rate limit và SMTP**: gói mặc định của Supabase chỉ gửi **2 email mỗi giờ**
   và email đi từ địa chỉ chung. Trước khi mở cho người dùng thật, cấu hình SMTP riêng
   (Project Settings → Auth → SMTP Settings) và tăng giới hạn tương ứng.

## 4. Kiểm tra sau khi triển khai

1. Mở Cài đặt → mục 06 *Tài khoản & đồng bộ*. Phải thấy ô email, không thấy thông báo "chưa bật".
2. Gửi liên kết tới một email thử. Bấm liên kết, app phải quay về và hiện "Đã đăng nhập".
3. Ghi một ghi chú, bấm *Đồng bộ ngay*, rồi kiểm tra bảng `user_state` trong Table Editor.
4. Mở app trên máy thứ hai với cùng tài khoản. Phải thấy nút *Tải lại để áp dụng* sau vài giây.
5. Thử *Xoá tài khoản trên máy chủ*: bảng `user_state` của user đó phải trống.

## 5. Mô hình đồng bộ (tóm tắt)

- Mỗi khoá dữ liệu cấp cao nhất (`done`, `ans`, `note`, …) là một dòng trong `user_state`.
  Chỉ khoá đã đổi được gửi lên.
- Thay đổi từ máy khác không ghi đè app đang mở. Chúng được áp dụng khi tải lại trang.
- Khi hai máy cùng sửa một khoá mà chưa đồng bộ, bản trên máy đang dùng sẽ thắng.
- Lần đăng nhập đầu tiên trên một máy: bản trên máy được sao lưu vào lịch sử
  (Cài đặt → Dữ liệu) trước khi lấy dữ liệu từ tài khoản.
- Thiết lập riêng từng máy (`prefs`, `pane`, `last`, `seenWelcome`) không đồng bộ.

## 6. Ghi chú bảo mật và quyền riêng tư

- Trình duyệt chỉ giữ publishable key và phiên đăng nhập (refresh token trong localStorage).
  Dữ liệu được bảo vệ bởi RLS: mỗi người chỉ đọc và ghi hàng của chính mình.
- Chỉ thu thập email, tên hiển thị, lớp và dữ liệu học. Người dùng có thể xoá tài khoản
  bất cứ lúc nào.
- Người dùng có thể là học sinh. Trước khi công khai, hãy rà soát lại chính sách
  bảo vệ dữ liệu cá nhân, đặc biệt với dữ liệu của trẻ em, theo quy định hiện hành
  của Việt Nam.
