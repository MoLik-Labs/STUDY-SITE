/* =========================================================
   QUYỀN RIÊNG TƯ — trang #/privacy
   Nói rõ: dữ liệu nào được lưu, ở đâu, ai nhận được, và cách xoá.
   Mọi câu ở đây phải khớp với hành vi thật của app. Nếu đổi hành vi,
   sửa trang này trong cùng một thay đổi.
   ========================================================= */
function renderPrivacy() {
  const signedIn = typeof Account !== 'undefined' && Account.signedIn();
  const cloud = typeof Account !== 'undefined' && Account.enabled();
  const status = !cloud
    ? 'Bản này chưa bật tài khoản: mọi dữ liệu chỉ nằm trên máy bạn.'
    : signedIn
      ? 'Bạn đang đăng nhập: dữ liệu học được đồng bộ lên máy chủ đã nêu bên dưới.'
      : 'Bạn đang dùng chế độ khách: không có dữ liệu nào được gửi đi.';

  $('#main').innerHTML = `<section class="wrap ab-page" aria-labelledby="privTitle">
    <div class="ab-card">
      <span class="kicker">Quyền riêng tư</span>
      <h1 id="privTitle">dữ liệu của bạn<br><em>ở đâu, ai thấy, cách xoá</em></h1>
      <p class="ab-lead">${status}</p>

      <h2 style="font-size:20px;margin-top:22px">Chúng tôi lưu gì</h2>
      <ul class="priv-list">
        <li><b>Khi đăng nhập:</b> địa chỉ email (do nhà cung cấp đăng nhập gửi), tên hiển thị và lớp, đều tuỳ chọn.</li>
        <li><b>Dữ liệu học:</b> tiến độ bài, đáp án đã chọn, ghi chú, thẻ ôn tập và bố cục trang chủ.</li>
        <li><b>Trên máy bạn:</b> mọi dữ liệu trên, cùng bản sao lưu và cài đặt giao diện, luôn nằm trong trình duyệt.</li>
      </ul>

      <h2 style="font-size:20px;margin-top:22px">Ai nhận được dữ liệu</h2>
      <ul class="priv-list">
        <li><b>Supabase</b> (máy chủ tại Singapore): chỉ khi bạn đăng nhập. Chỉ bạn đọc được dữ liệu của mình, nhờ chính sách bảo mật theo hàng.</li>
        <li><b>Google</b>: chỉ khi bạn chọn đăng nhập bằng Google.</li>
        <li><b>YouTube</b>: chỉ khi bạn mở một video bài giảng. Video dùng miền youtube-nocookie.com.</li>
        <li>Không có quảng cáo, không có công cụ phân tích hay theo dõi nào.</li>
      </ul>

      <h2 style="font-size:20px;margin-top:22px">Quyền của bạn</h2>
      <ul class="priv-list">
        <li><b>Xem và mang đi:</b> tải toàn bộ dữ liệu trên máy dưới dạng tệp .json (mục Cài đặt).</li>
        <li><b>Đăng xuất:</b> xoá phiên đăng nhập trên máy này, giữ dữ liệu trên máy.</li>
        <li><b>Xoá dữ liệu:</b> "Xoá toàn bộ dữ liệu" xoá trên máy và trên máy chủ, giữ tài khoản.</li>
        <li><b>Xoá tài khoản:</b> xoá tài khoản và mọi dòng dữ liệu trên máy chủ. Dữ liệu trên máy vẫn còn.</li>
      </ul>

      <div class="priv-act">
        <a class="btn sm" href="#/settings">Mở Cài đặt</a>
        <a class="btn ghost sm" href="#/settings?s=acct">Tài khoản & đồng bộ</a>
      </div>
    </div>
  </section>`;
}
