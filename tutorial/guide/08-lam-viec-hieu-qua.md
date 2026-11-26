# Các cách làm việc hiệu quả

Không có một cách duy nhất đúng. Chương này giới thiệu năm cách làm việc phổ biến, khi nào nên chọn cách nào, và các thói quen giúp bạn làm nhanh hơn mà ít lỗi hơn.

## Chọn cách làm việc phù hợp

| Cách | Cần cài gì? | Tốt khi | Hạn chế |
|---|---|---|---|
| Trình duyệt (vscode.dev) | Không | Sửa nhanh một hai file, đang ở máy lạ | Không chạy được `npm test` trực tiếp |
| GitHub Codespaces | Không (chạy trên đám mây) | Muốn môi trường đầy đủ, giống nhau trên mọi máy | Có giới hạn miễn phí, cần tính toán |
| VS Code + Git trên máy | VS Code, Git, Node.js | Làm việc dài, hằng ngày | Phải cài và giữ máy đồng bộ |
| GitHub Desktop | GitHub Desktop | Người mới, thích giao diện | Ít kiểm soát hơn dòng lệnh |
| Terminal + `gh` | Git, `gh`, Node.js | Người quen dòng lệnh, làm tự động | Cần học lệnh |

## Cách 1: Trình duyệt với vscode.dev

Mở repo trên GitHub, nhấn phím `.` (dấu chấm). Trình soạn thảo VS Code mở ngay trong trình duyệt, với đầy đủ cây thư mục và tìm kiếm.

Phù hợp cho việc sửa chữ, thêm một chương hướng dẫn, hay xem mã khi đang ở máy khác. Các lệnh `npm` không chạy trong đó, nên vẫn cần máy thật để kiểm thử.

## Cách 2: GitHub Codespaces

Codespaces là một máy ảo Linux trên đám mây, mở bằng VS Code trong trình duyệt hoặc trên máy bạn. Mọi thứ đã cài sẵn, nên không cần cài Node.js hay Git trên máy.

Cách mở: trên trang repo, bấm **Code → Codespaces → Create codespace on main**. Trong terminal của Codespaces, chạy `npm ci` rồi `npm test` như trên máy.

Về chi phí, theo tài liệu billing của GitHub: tài khoản cá nhân miễn phí được **120 core-hours mỗi tháng** và **15 GB-tháng lưu trữ**. Đơn vị là core-hour, không phải giờ đồng hồ: 120 core-hours là **60 giờ** trên máy 2 lõi, **30 giờ** trên máy 4 lõi. Chọn máy nhỏ nhất đủ dùng để tiết kiệm. Con số có thể đổi, nên kiểm tra lại trong trang billing của GitHub trước khi dùng nhiều.

::: tip Mẹo
Đóng Codespace khi không dùng. Máy đang chạy tính tiền; máy đã dừng chỉ tốn phí lưu trữ nhỏ.
:::

## Cách 3: VS Code trên máy

Đây là cách làm việc hằng ngày phổ biến nhất khi bạn đã cài đủ công cụ ở chương 01.

1. Mở thư mục repo trong VS Code: **File → Open Folder**.
2. Mở terminal tích hợp: ``Ctrl + ` `` (hoặc ``Cmd + ` `` trên macOS).
3. Chạy `npm run serve` ở một tab terminal, làm việc ở tab khác.
4. Dùng nhánh **Source Control** (biểu tượng ba nút nối) để xem, stage và commit thay đổi bằng chuột.

Mở đồng thời trang web đang chạy và mã nguồn để thấy kết quả ngay sau khi sửa.

## Cách 4: GitHub Desktop

Đã mô tả ở chương 04. Ưu điểm là trực quan và có thể làm việc không cần nhớ lệnh. Hợp với người mới, hoặc khi cần xem lịch sử và diff nhanh.

## Cách 5: Dòng lệnh với GitHub CLI

Khi đã thoải mái với terminal, nhiều việc nhanh hơn nhiều:

```bash
gh repo view --web          # mở repo trên trình duyệt
gh pr status                # xem các PR của bạn
gh pr checks                # xem trạng thái CI của PR hiện tại
gh run watch                # theo dõi một lần chạy CI cho tới khi xong
gh issue list               # xem danh sách việc cần làm
```

## Thói quen giúp làm nhanh và ít lỗi

**Pull trước khi bắt đầu.** Thói quen này giảm đáng kể xung đột.

**Commit nhỏ, thường xuyên.** Một commit một ý. Dễ xem lại, dễ hoàn tác, dễ viết thông điệp.

**Để Git nhắc bạn.** Thêm vài alias ngắn cho lệnh thường dùng:

```bash
git config --global alias.st status
git config --global alias.lg "log --oneline --graph --all -20"
git config --global alias.co switch
```

Sau đó gõ `git st` thay cho `git status`, `git lg` để xem cây lịch sử.

**Dùng `.gitignore` đúng cách.** File tạm, thư viện và bí mật phải nằm trong đó. Kiểm tra bằng `git status` trước khi commit.

**Đọc diff trước khi commit.** Đây là kiểm tra miễn phí, và bắt được phần lớn lỗi chính tả, dòng thừa, và file nhầm.

**Tự động hoá kiểm tra.** Khi quen, bạn có thể chạy `npm run build && npm test` trước mỗi lần push bằng một lệnh gộp, hoặc để CI làm việc đó và chỉ xem kết quả.

**Ghi chú lại quyết định.** Khi thay đổi có lý do không hiển nhiên, ghi vào thông điệp commit hoặc phần mô tả PR. Người đọc sau sẽ cảm ơn bạn.

## Khi bị kẹt

- Đọc lỗi từ đầu đến cuối, đặc biệt dòng đầu tiên và dòng có tên file.
- Chạy `git status` để biết trạng thái hiện tại trước khi thử lệnh mới.
- Đừng thử ngẫu nhiên các lệnh có chữ `--force` hay `--hard`. Xem chương 09 để biết cách xử lý an toàn.

Tiếp theo: [xử lý sự cố thường gặp](09-su-co-thuong-gap.md).
