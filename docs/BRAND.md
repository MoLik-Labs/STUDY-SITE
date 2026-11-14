# Study Focus Fox — bộ nhận diện

Tên sản phẩm: **Study Focus Fox** · viết tắt **Focus Fox** · tay `its.fox_`
Khẩu hiệu: *Tập trung sâu · Nhớ lâu hơn* / *Focus deep · Remember longer*

---

## 1. Dấu hiệu (mark)

Cáo pixel 16×16, chỉ lưu **nửa trái** rồi lật gương — nên không bao giờ lệch.

```
..o.....        o = #c6542d  (cáo)
..oo....        d = #a53e20  (bóng trong tai)
.odo....        k = #17150f  (mắt, mũi)
.oodo...        w = #fcf9f2  (má trắng)
.ooodo..
oooooo..
ooooooo.
oooooooo   ← gò má, điểm rộng nhất
.oookkoo   ← mắt 2×2
.oookkoo
..wwoooo   ← dải má trắng bắt đầu từ mép ngoài
...wwooo
....wwoo
.....wwo
......wo
.......k   ← mũi ở đúng đỉnh
```

**Năm bản đã bị loại, và vì sao** — đây là phần đáng giữ nhất của tài liệu này:

| Bản | Trông ra | Nguyên nhân |
|---|---|---|
| 1 | khối đỏ | có viền, viền ăn mất hình |
| 2 | **gấu** | sọ tròn + mõm tròn |
| 3 | mèo | râu hai bên, mắt 1 px thành mặt nạ |
| 4 | **mèo** | mõm trắng **kín** thành khối tròn giữa mặt |
| 5 | **cáo** ✓ | mõm nhọn, má trắng ở **mép ngoài**, mũi ở đỉnh |

Bài học duy nhất: **cái làm nên con cáo không phải cái mõm — mà là hướng
của nó.** Mõm trắng nào còn *bao quanh* là còn ra mèo. Mõm phải *nhọn xuống*
và dải trắng phải *hở ra ngoài*.

Ba quyết định còn lại, đều rút ra sau khi nhìn ảnh render chứ không phải
nghĩ trong đầu:

- **Tai cắt dốc vào trong.** Tai dựng thẳng đứng = tam giác = mèo.
- **Mắt 2×2 nằm ngang.** Mắt 1 px đọc thành mặt nạ; mắt có chấm sáng đọc
  thành hốc mắt rỗng — đã thử, bỏ.
- **Không đặt gì ở đúng ô đáy giữa.** Đỉnh dưới là mũi; chỉ cần một ô đen
  là mũi, không cần mõm.

**Vì sao không viền:** bản có viền đọc thành một khối đỏ. Bỏ viền, để hình
tự đứng — đó là ngôn ngữ của pixel art thật (Nintendo, Cave Story).

| Tệp | Dùng cho |
|---|---|
| `docs/img/fox-favicon.svg` | 16×16, 47 rect, 2,7 KB — favicon + apple-touch-icon, nhúng thẳng `<head>` dạng data-URI (0 request) |
| `docs/img/fox-mark.svg` | dấu hiệu 20×20 có nền giấy (47 rect, 2,8 KB) — README, mạng xã hội |
| `docs/img/fox-lockup.svg` | khoá dấu hiệu + chữ, dùng cho tiêu đề |
| `src/brand.js` | nguồn duy nhất trong mã: `BRAND_MARK_HALF`, `brandMarkHtml()`, `BRAND` |

## 2. Bảng màu

Lấy từ chính bảng màu của trang, không thêm màu mới:

| Vai trò | Mã | Ghi chú |
|---|---|---|
| Cáo | `#c6542d` | màu nhấn của sản phẩm |
| Bóng | `#a53e20` | chỉ dùng cho khối bóng, không dùng cho chữ |
| Mực | `#17150f` | mắt, viền khung, chữ |
| Kem | `#fcf9f2` | mõm, nền thiệp |
| Giấy | `#f4f1ea` | nền trang |

Chữ trên nền giấy luôn là `#17150f` — tương phản 15,4:1, vượt WCAG AAA.

## 3. Chữ

- **Tên sản phẩm:** Lora / Georgia, đậm 600, chữ thường (không viết hoa toàn bộ).
- **Khẩu hiệu:** JetBrains Mono, 7,5–9 px, `letter-spacing: .09em`, VIẾT HOA.
- **Không dùng** gradient, bóng đổ mềm, hay chữ cong — đó là chỗ AI-slop lộ ra.

## 4. Thiệp tiến độ `#/share`

1200×630 (tỉ lệ khung xem trước của chat). Trên thiệp **chỉ có số liệu học**:
chuỗi ngày, thẻ đã thuộc, giờ học, ca đã xong, ĐTB, mức kế hoạch, cấp đấu trường,
ngày tạo. **Không có** tên, email, ghi chú, đáp án.

Vẽ bằng `<canvas>` ngay trên máy; không tải lên máy chủ nào. Trình duyệt không
có canvas thì tự chuyển sang bản chữ — trang không chết.

## 5. Giọng

Tiếng Việt là ngôn ngữ gốc, tiếng Anh là bản dịch giao diện. Nội dung Vật lí
giữ tiếng Việt để khớp đề thi. Xưng "bạn", không xưng "quý khách"; không dùng
từ thán, không emoji trong giao diện.
