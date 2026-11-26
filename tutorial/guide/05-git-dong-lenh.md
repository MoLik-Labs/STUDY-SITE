# Làm việc với dòng lệnh Git

Dòng lệnh cho bạn kiểm soát chính xác nhất và chạy nhanh nhất khi đã quen. Chương này dạy vòng lệnh cơ bản, cách viết thông điệp commit tốt, và cách xử lý tình huống thường gặp.

## Năm lệnh cốt lõi

| Lệnh | Làm gì |
|---|---|
| `git status` | Cho biết file nào đã đổi, đã thêm vào commit, hoặc chưa theo dõi |
| `git diff` | Xem chi tiết thay đổi chưa thêm vào commit |
| `git add <file>` | Thêm file vào danh sách sẽ commit (gọi là *staging*) |
| `git commit -m "..."` | Ghi lại các thay đổi đã staging thành một commit |
| `git push` | Đẩy commit lên GitHub |

Và hai lệnh kéo về:

| Lệnh | Làm gì |
|---|---|
| `git pull` | Kéo thay đổi mới nhất từ GitHub về và gộp vào nhánh hiện tại |
| `git fetch` | Chỉ tải thông tin về, không gộp. An toàn để xem trước |

## Một phiên làm việc mẫu

Giả sử bạn sửa thông điệp trong một chương hướng dẫn:

```bash
# 1. Bắt đầu: kéo bản mới nhất về
git pull

# 2. Sửa file bằng trình soạn thảo, rồi xem lại thay đổi
git status
git diff

# 3. Thêm đúng file cần commit
git add tutorial/content/05-git-dong-lenh.md

# 4. Commit với thông điệp rõ ràng
git commit -m "Sửa ví dụ lệnh git pull trong chương 5"

# 5. Đẩy lên GitHub
git push
```

::: tip Mẹo
Dùng `git add tên-file` cho từng file thay vì `git add .`. Cách này tránh commit nhầm file không liên quan.
:::

## Xem lại thay đổi trước khi commit

Luôn xem `git diff` trước khi commit. Với thay đổi đã staging, dùng:

```bash
git diff --staged
```

Nếu muốn bỏ thay đổi của một file chưa commit (cẩn thận, không hoàn tác được):

```bash
git restore tên-file
```

Nếu đã `git add` nhầm mà chưa commit, bỏ khỏi danh sách staging mà giữ nguyên thay đổi:

```bash
git restore --staged tên-file
```

## Viết thông điệp commit tốt

Một thông điệp tốt trả lời được câu hỏi "commit này làm gì, và vì sao". Quy ước đơn giản cho dự án:

- **Một dòng tiêu đề**, dưới khoảng 70 ký tự, bắt đầu bằng động từ: `Thêm`, `Sửa`, `Bỏ`, `Đổi`.
- Nếu cần, thêm một dòng trống và vài dòng giải thích **vì sao**.

Ví dụ tốt:

```
Sửa lỗi ngày trong lịch tuần khi chuyển múi giờ

Ngày được tính theo UTC nên lệch một ngày với người dùng Việt Nam.
Dùng múi giờ +7 khi tính hôm nay.
```

Ví dụ nên tránh: `sửa`, `update`, `abc`, `fix` không kèm nội dung. Sáu tháng sau, bạn sẽ không nhớ chúng nghĩa là gì.

## Xem lịch sử

```bash
git log --oneline -10
```

In ra 10 commit gần nhất, mỗi commit một dòng. Muốn xem cả nhánh dưới dạng cây:

```bash
git log --oneline --graph --all -20
```

Muốn xem ai sửa dòng nào trong một file:

```bash
git blame tên-file
```

## Tạm cất việc đang làm

Đang sửa dở mà cần chuyển sang việc khác gấp? Cất tạm bằng `stash`:

```bash
git stash push -m "dang sua chuong 6"
# ... làm việc khác ...
git stash pop
```

`git stash pop` lấy lại thay đổi đã cất. Dùng `git stash list` để xem các phần đã cất.

## Các lệnh cần thận trọng

- `git push --force`: ghi đè lịch sử trên GitHub, có thể làm mất công việc của người khác. **Tránh dùng.** Nếu thật cần, dùng `git push --force-with-lease` và báo trước cho cả nhóm.
- `git reset --hard`: xoá mọi thay đổi chưa commit, không khôi phục được. Đừng dùng khi chưa chắc.
- `git commit --amend`: sửa commit gần nhất. An toàn **trước khi push**. Sau khi đã push thì không nên.

Tiếp theo: [làm việc theo nhánh và pull request](06-nhanh-va-pull-request.md).
