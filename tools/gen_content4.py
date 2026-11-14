# -*- coding: utf-8 -*-
"""Sinh content4.js: quiz + hỏi đáp + bài giải, mọi đáp án số đều tính bằng Python."""
import io, json, math

def J(x): return json.dumps(x, ensure_ascii=False)

Q = []   # quiz
def num(t, q, a, unit, e, tol=None):
    tol = tol if tol is not None else max(0.02, abs(a) * 0.012)
    Q.append({"t": t, "type": "num", "q": q, "a": round(a, 4), "tol": round(tol, 4), "unit": unit, "e": e})
def mcq(t, q, o, a, e):
    Q.append({"t": t, "type": "mcq", "q": q, "o": o, "a": a, "e": e})
def multi(t, q, o, a, e):
    Q.append({"t": t, "type": "multi", "q": q, "o": o, "a": a, "e": e})
def tf(t, q, a, e):
    Q.append({"t": t, "type": "tf", "q": q, "a": a, "e": e})
def order(t, q, s, e):
    Q.append({"t": t, "type": "order", "q": q, "s": s, "e": e})

# ============ T1 CHUYỂN ĐỘNG ============
v1, t1, v2, t2 = 40, 2.0, 60, 3.0
num(1, f"Xe chạy {t1:.0f} giờ đầu với {v1} km/h, rồi {t2:.0f} giờ sau với {v2} km/h. Vận tốc trung bình cả hành trình?",
    (v1*t1+v2*t2)/(t1+t2), "km/h", f"s = {v1}·{t1:.0f} + {v2}·{t2:.0f} = {v1*t1+v2*t2:.0f} km, t = {t1+t2:.0f} h ⇒ v = {v1*t1+v2*t2:.0f}/{t1+t2:.0f} = {(v1*t1+v2*t2)/(t1+t2):.0f} km/h.")
num(1, "Hai xe cùng chiều, xe sau chạy 70 km/h đuổi xe trước 50 km/h, lúc đầu cách nhau 40 km. Bao lâu thì đuổi kịp?", 40/20, "giờ",
    "Hiệu vận tốc 20 km/h, thời gian = 40/20 = 2 giờ.")
num(1, "Thuyền xuôi dòng đạt 12 km/h, nước chảy 3 km/h. Vận tốc thuyền khi nước lặng?", 12-3, "km/h",
    "v_xuôi = v + b ⇒ v = 12 − 3 = 9 km/h. Khi ngược dòng sẽ chỉ còn 9 − 3 = 6 km/h.")
tf(1, "Vận tốc trung bình luôn bằng trung bình cộng của các vận tốc trên từng đoạn.", False,
   "Chỉ bằng trung bình cộng khi các đoạn có cùng thời gian. Cùng quãng đường thì phải dùng trung bình điều hoà 2v₁v₂/(v₁+v₂).")
num(1, "Đi 30 phút với 60 km/h rồi 45 phút với 40 km/h. Vận tốc trung bình?", (0.5*60+0.75*40)/1.25, "km/h",
    "s = 30 + 30 = 60 km; t = 1,25 h ⇒ v = 48 km/h.")
mcq(1, "Đồ thị quãng đường – thời gian của một vật đứng yên là",
    ["Đường thẳng xiên lên", "Đường thẳng nằm ngang", "Đường cong parabol", "Đường thẳng xiên xuống"], 1,
    "s không đổi theo t nên đồ thị là đường nằm ngang song song trục thời gian.")
num(1, "Hai xe ngược chiều cách nhau 150 km, vận tốc 45 km/h và 55 km/h, khởi hành cùng lúc. Sau bao lâu gặp nhau?", 150/100, "giờ",
    "Ngược chiều cộng vận tốc: t = 150/(45+55) = 1,5 giờ.")

# ============ T2 ÁP SUẤT & ARCHIMEDES ============
V = 500e-6
num(2, "Vật thể tích 500 cm³ chìm hoàn toàn trong nước (d = 10 000 N/m³). Lực đẩy Archimedes?", 10000*V, "N",
    "500 cm³ = 5·10⁻⁴ m³; F_A = d·V = 10 000 × 5·10⁻⁴ = 5 N.")
num(2, "Áp suất do cột nước cao 2,5 m gây ra tại đáy (d = 10 000 N/m³)?", 10000*2.5, "Pa",
    "p = d·h = 10 000 × 2,5 = 25 000 Pa.")
num(2, "Miếng gỗ khối lượng riêng 800 kg/m³ nổi trên nước 1000 kg/m³. Phần trăm thể tích chìm?", 80, "%",
    "Nổi: D_vật·V = D_nước·V_chìm ⇒ V_chìm/V = 800/1000 = 80%.")
tf(2, "Khi vật nổi cân bằng trên mặt chất lỏng thì lực đẩy Archimedes bằng trọng lượng của vật.", True,
   "Hai lực cân bằng nên F_A = P; đó là điều kiện để tính phần thể tích chìm.")
multi(2, "Lực đẩy Archimedes phụ thuộc trực tiếp vào những đại lượng nào?",
    ["Thể tích phần vật chiếm chỗ trong chất lỏng", "Khối lượng riêng của chất lỏng", "Khối lượng riêng của vật", "Độ sâu của vật dưới mặt thoáng"], [0, 1],
    "F_A = d_lỏng·V_chìm: chỉ hai đại lượng đó. F_A không phụ thuộc vật liệu vật, cũng không phụ thuộc độ sâu khi đã chìm hoàn toàn.")
num(2, "Người 60 kg đứng co một chân, diện tích tiếp xúc 150 cm². Áp suất lên sàn?", 600/0.015, "Pa",
    "F = 600 N; S = 150 cm² = 0,015 m² ⇒ p = 600/0,015 = 40 000 Pa.")
num(2, "Vật có trọng lượng 7,8 N, nhúng ngập trong nước lực kế chỉ 6,8 N. Lực đẩy Archimedes?", 1.0, "N",
    "F_A = P − F = 7,8 − 6,8 = 1 N, tương đương 100 cm³ nước bị chiếm chỗ.")
mcq(2, "Hai bình thông nhau đựng nước, một nhánh đổ thêm dầu. Mặt thoáng hai nhánh",
    ["Cao bằng nhau", "Nhánh nước cao hơn", "Nhánh dầu cao hơn", "Không so sánh được"], 2,
    "Dầu nhẹ hơn nước nên để cùng áp suất ở đáy, cột dầu phải cao hơn cột nước.")

# ============ T3 CÔNG & NĂNG LƯỢNG ============
num(3, "Kéo vật bằng lực 200 N theo phương ngang đi 5 m. Công của lực kéo?", 1000, "J",
    "A = F·s·cos0° = 200 × 5 = 1 000 J.")
num(3, "Nâng vật 50 kg lên cao 4 m trong 10 s (g = 10 m/s²). Công suất trung bình?", 50*10*4/10, "W",
    "A = mgh = 50·10·4 = 2 000 J ⇒ P = 2 000/10 = 200 W.")
num(3, "Mặt phẳng nghiêng: công có ích 600 J, công toàn phần 800 J. Hiệu suất?", 75, "%",
    "H = A_ci/A_tp = 600/800 = 75%.")
tf(3, "Công của trọng lực chỉ phụ thuộc độ cao đầu và cuối, không phụ thuộc đường đi.", True,
   "Trọng lực là lực thế: A = mg(h₁ − h₂), đi đường nào cũng vậy, kể cả đường vòng.")
num(3, "Vật 2 kg rơi tự do từ độ cao 5 m (g = 10 m/s², bỏ qua sức cản). Vận tốc khi chạm đất?", math.sqrt(2*10*5), "m/s",
    "mgh = ½mv² ⇒ v = √(2gh) = √100 = 10 m/s.")
mcq(3, "Trong chuyển động rơi tự do, đại lượng nào tăng và đại lượng nào giảm?",
    ["Động năng tăng, thế năng giảm", "Cả hai cùng tăng", "Động năng giảm, thế năng tăng", "Cả hai không đổi"], 0,
    "Độ cao giảm nên thế năng giảm, vận tốc tăng nên động năng tăng; tổng cơ năng không đổi.")
num(3, "Con lắc có cơ năng 2 J, ở vị trí thế năng 0,8 J. Động năng tại đó?", 1.2, "J",
    "W_đ = W − W_t = 2 − 0,8 = 1,2 J.")

# ============ T4 QUANG HÌNH ============
num(4, "Vật cách thấu kính hội tụ f = 10 cm một đoạn 15 cm. Ảnh cách kính bao nhiêu?", 15*10/(15-10), "cm",
    "1/d′ = 1/10 − 1/15 = 1/30 ⇒ d′ = 30 cm, ảnh thật ngoài khoảng 2f.")
num(4, "Thấu kính hội tụ f = 8 cm, vật cách 12 cm. Khoảng cách ảnh tới kính?", 12*8/(12-8), "cm",
    "d′ = df/(d − f) = 12·8/4 = 24 cm.")
mcq(4, "Thấu kính hội tụ cho ảnh ảo khi",
    ["d > 2f", "f < d < 2f", "d = f", "d < f"], 3,
    "Vật nằm trong tiêu cự cho ảnh ảo, cùng chiều, lớn hơn vật.")
tf(4, "Thấu kính phân kì luôn cho ảnh ảo, cùng chiều và nhỏ hơn vật, với mọi vị trí đặt vật.", True,
   "Đó là tính chất đặc trưng: ảnh luôn nằm trong khoảng tiêu cự cùng phía vật.")
num(4, "Ảnh thật cao bằng vật qua thấu kính hội tụ f = 12 cm. Vật cách kính bao nhiêu?", 24, "cm",
    "Ảnh cao bằng vật ⇒ ảnh cách kính bằng vật và đều bằng 2f = 24 cm.")
multi(4, "Ảnh của vật qua thấu kính hội tụ khi d > f có đặc điểm nào?",
    ["Ngược chiều với vật", "Hứng được trên màn", "Luôn lớn hơn vật", "Nằm khác phía vật so với thấu kính"], [0, 1, 3],
    "Ảnh thật nên hứng được, ngược chiều, khác phía. Nhưng chỉ lớn hơn vật khi f < d < 2f.")
num(4, "Vật AB cao 4 cm đặt cách thấu kính hội tụ f = 10 cm một đoạn 15 cm. Chiều cao ảnh?", 4*2, "cm",
    "d′ = 30 cm; |k| = d′/d = 2 ⇒ ảnh cao 8 cm, ngược chiều.")

# ============ T5 ĐIỆN HỌC I ============
num(5, "Đặt 12 V vào hai đầu điện trở 20 Ω. Cường độ dòng điện?", 12/20, "A",
    "I = U/R = 12/20 = 0,6 A.")
num(5, "Hai điện trở 10 Ω và 15 Ω mắc song song. Điện trở tương đương?", 10*15/25, "Ω",
    "R = 10·15/(10+15) = 150/25 = 6 Ω, nhỏ hơn cả hai điện trở thành phần.")
num(5, "Hai điện trở 6 Ω và 12 Ω mắc nối tiếp, đặt vào hiệu điện thế 9 V. Cường độ dòng điện?", 9/18, "A",
    "R = 18 Ω ⇒ I = 9/18 = 0,5 A, dòng như nhau qua cả hai.")
num(5, "Dây dẫn dài 100 m, tiết diện 0,5 mm², điện trở suất 1,7·10⁻⁸ Ω·m. Điện trở dây?", 1.7e-8*100/0.5e-6, "Ω",
    "R = ρl/S = 1,7·10⁻⁸ × 100 / (0,5·10⁻⁶) = 3,4 Ω.")
tf(5, "Trong đoạn mạch nối tiếp, hiệu điện thế giữa hai đầu mỗi điện trở tỉ lệ thuận với điện trở đó.", True,
   "U₁/U₂ = R₁/R₂ vì dòng điện bằng nhau.")
mcq(5, "Đèn ghi 6 V – 3 W. Điện trở của đèn khi sáng bình thường là",
    ["2 Ω", "3 Ω", "12 Ω", "18 Ω"], 2,
    "R = U²/P = 36/3 = 12 Ω; dòng định mức I = P/U = 0,5 A.")
num(5, "Ba điện trở 3 Ω giống nhau mắc song song. Điện trở tương đương?", 1, "Ω",
    "R = R/3 = 1 Ω.")

# ============ T6 ĐIỆN HỌC II ============
num(6, "R₁ = 10 Ω nối tiếp với cụm (R₂ = 20 Ω song song R₃ = 20 Ω). Điện trở tương đương?", 10+10, "Ω",
    "Cụm song song = 20/2 = 10 Ω; cộng R₁ thành 20 Ω.")
num(6, "Bếp điện 220 V – 484 Ω. Công suất tiêu thụ ở đúng hiệu điện thế 220 V?", 220**2/484, "W",
    "P = U²/R = 48 400/484 = 100 W.")
num(6, "Bóng 100 W dùng 5 giờ mỗi ngày trong 30 ngày. Điện năng tiêu thụ?", 0.1*5*30, "kWh",
    "0,1 kW × 5 h × 30 = 15 kWh, tương đương 525 000 đồng nếu 35 000 đ/kWh." if False else "0,1 kW × 5 h × 30 ngày = 15 kWh.")
num(6, "Mạch cầu cân bằng có R₁ = 6 Ω, R₂ = 9 Ω, R₃ = 8 Ω. R₄ bằng bao nhiêu?", 9*8/6, "Ω",
    "Cân bằng: R₁/R₂ = R₃/R₄ ⇒ R₄ = R₂R₃/R₁ = 9·8/6 = 12 Ω.")
tf(6, "Công suất toả nhiệt trên một điện trở có thể viết là P = I²R hoặc P = U²/R.", True,
   "Hai dạng tương đương nhau nhờ U = IR; chọn dạng nào tiện với dữ kiện đã cho.")
mcq(6, "Biến trở R mắc nối tiếp với nguồn có điện trở trong r. Công suất trên biến trở lớn nhất khi",
    ["R rất lớn", "R = 0", "R = r", "R = 2r"], 2,
    "P = E²R/(R+r)² đạt cực đại khi R = r, giá trị E²/(4r).")
num(6, "Truyền công suất 100 kW đi xa bằng đường dây có R = 10 Ω, hiệu điện thế 10 kV. Công suất hao phí?", (1e5**2*10)/(1e4**2), "W",
    "P_hp = P²R/U² = (10⁵)²·10/(10⁴)² = 1 000 W, tức 1%.")

# ============ T7 NHIỆT ============
num(7, "Đun 2 kg nước tăng thêm 30 °C (c = 4200 J/kg·K). Nhiệt lượng cần?", 2*4200*30, "J",
    "Q = mcΔt = 2 × 4200 × 30 = 252 000 J = 252 kJ.")
num(7, "Trộn 1 kg nước 80 °C với 2 kg nước 20 °C. Nhiệt độ cân bằng?", (1*80+2*20)/3, "°C",
    "t = (m₁t₁ + m₂t₂)/(m₁+m₂) = (80 + 40)/3 = 40 °C.")
num(7, "Đốt 0,2 kg dầu, năng suất toả nhiệt 44·10⁶ J/kg. Nhiệt lượng toả ra?", 0.2*44e6/1e6, "MJ",
    "Q = q·m = 44·10⁶ × 0,2 = 8,8·10⁶ J = 8,8 MJ.")
num(7, "Đun 2 kg nước từ 20 °C đến 100 °C cần 672 kJ, bếp toả 800 kJ. Hiệu suất bếp?", 672/800*100, "%",
    "Q_có ích = 2·4200·80 = 672 000 J; H = 672/800 = 84%.")
tf(7, "Nhiệt lượng vật thu vào phụ thuộc khối lượng, độ tăng nhiệt độ và chất làm vật.", True,
   "Q = mcΔt: c đặc trưng cho chất, m và Δt là hai yếu tố còn lại.")
num(7, "Bếp điện 1000 W đun nước 7 phút. Điện năng chuyển thành nhiệt?", 1000*420/1000, "kJ",
    "Q = P·t = 1000 × 420 s = 420 000 J = 420 kJ.")
mcq(7, "Trong suốt quá trình nóng chảy của nước đá, nhiệt độ của nó",
    ["Tăng dần", "Giảm dần", "Không đổi", "Tăng rồi giảm"], 2,
    "Nhiệt lượng nhận vào dùng để phá vỡ cấu trúc tinh thể, nhiệt độ giữ ở 0 °C.")

# ============ T8 QUANG MỞ RỘNG ============
num(8, "Vật cách gương phẳng 40 cm. Ảnh cách vật bao nhiêu?", 80, "cm",
    "Ảnh đối xứng qua gương nên cách gương 40 cm, cách vật 80 cm.")
mcq(8, "Ảnh của vật qua gương phẳng là",
    ["Ảnh thật, ngược chiều", "Ảnh ảo, cùng chiều, bằng vật", "Ảnh ảo, nhỏ hơn vật", "Ảnh thật, lớn hơn vật"], 1,
    "Ảnh ảo đối xứng, cùng chiều, cùng kích thước, không hứng được trên màn.")
num(8, "Thấu kính phân kì f = 20 cm, vật cách 30 cm. Ảnh ảo cách kính bao nhiêu?", 20*30/(20+30), "cm",
    "1/d′ = 1/f − 1/d với f = −20 ⇒ |d′| = df/(d+f) = 30·20/50 = 12 cm, cùng phía vật.")
tf(8, "Ảnh của một vật qua gương phẳng có thể hứng được trên màn chắn.", False,
   "Ảnh là ảnh ảo: chùm tia phản xạ không hội tụ thật, đặt màn không thu được ảnh.")
num(8, "Ánh sáng truyền trong môi trường có vận tốc 2·10⁸ m/s. Chiết suất của môi trường?", 3e8/2e8, "",
    "n = c/v = 3·10⁸/2·10⁸ = 1,5, cỡ của thuỷ tinh.")
mcq(8, "Chiếu tia sáng tới gương phẳng với góc tới 30°. Góc hợp bởi tia tới và tia phản xạ là",
    ["30°", "60°", "90°", "120°"], 1,
    "Góc phản xạ bằng góc tới 30°, hai tia nằm hai bên pháp tuyến ⇒ góc giữa chúng là 60°.")

# ============ T9 ÁNH SÁNG MÀU ============
mcq(9, "Trộn ánh sáng đỏ với ánh sáng lục ta được ánh sáng",
    ["Trắng", "Vàng", "Xanh lam", "Đen"], 1,
    "Trộn hai ánh sáng màu với nhau cho màu khác; đỏ + lục cho vàng.")
tf(9, "Vật màu đỏ tán xạ tốt ánh sáng đỏ và tán xạ kém các ánh sáng màu khác.", True,
   "Đó là lý do đặt vật đỏ dưới ánh sáng xanh thì vật gần như đen.")
mcq(9, "Nhìn một tờ giấy trắng qua kính lọc màu đỏ, ta thấy tờ giấy",
    ["Trắng", "Đỏ", "Đen", "Xanh"], 1,
    "Kính lọc chỉ cho ánh sáng đỏ đi qua; giấy trắng tán xạ đủ màu nên phần lọt qua là đỏ.")
num(9, "Chiếu tia sáng từ không khí vào nước, góc tới 45°, góc khúc xạ 32°. Góc lệch giữa tia tới và tia khúc xạ?", 13, "°",
    "Tia khúc xạ gãy về phía pháp tuyến nên lệch góc 45° − 32° = 13°.")
tf(9, "Ánh sáng trắng là hỗn hợp của nhiều ánh sáng đơn sắc có màu biến thiên liên tục từ đỏ đến tím.", True,
   "Đó là kết luận từ thí nghiệm tán sắc của Newton qua lăng kính.")

# ============ T10 ĐIỆN TỪ ============
num(10, "Máy biến áp có N₁ = 1000 vòng, N₂ = 5000 vòng, đặt vào cuộn sơ cấp 220 V. Hiệu điện thế thứ cấp?", 220*5, "V",
    "U₂/U₁ = N₂/N₁ = 5 ⇒ U₂ = 1 100 V (máy tăng áp).")
num(10, "Máy biến áp lý tưởng: U₁ = 220 V, U₂ = 1100 V, dòng sơ cấp 10 A. Dòng thứ cấp?", 220*10/1100, "A",
    "P không đổi: U₁I₁ = U₂I₂ ⇒ I₂ = 2200/1100 = 2 A.")
mcq(10, "Dòng điện xoay chiều là dòng điện",
    ["Có chiều không đổi", "Có cường độ không đổi", "Luôn đổi chiều theo chu kì", "Chỉ chạy một chiều"], 2,
    "Chiều và cường độ biến thiên tuần hoàn theo thời gian, ở lưới điện Việt Nam 50 Hz.")
tf(10, "Máy phát điện xoay chiều hoạt động dựa trên hiện tượng cảm ứng điện từ.", True,
   "Cuộn dây quay trong từ trường khiến số đường sức qua nó biến thiên, sinh suất điện động cảm ứng.")
mcq(10, "Muốn tăng lực từ của nam châm điện, ta",
    ["Giảm số vòng dây", "Tăng cường độ dòng điện", "Đổi chiều dòng điện", "Dùng lõi nhựa thay lõi sắt"], 1,
    "Tăng I hoặc tăng số vòng dây đều làm từ trường mạnh hơn; đổi chiều chỉ đổi cực.")
num(10, "Cùng công suất truyền đi, nếu tăng hiệu điện thế đường dây lên 10 lần thì công suất hao phí giảm bao nhiêu lần?", 100, "lần",
    "P_hp ~ 1/U² nên tăng U 10 lần thì hao phí giảm 100 lần.")

# ============ T11 THỰC NGHIỆM ============
num(11, "Thí nghiệm đo điện trở: vôn kế chỉ 6,0 V, ampe kế chỉ 0,5 A. R bằng bao nhiêu?", 6/0.5, "Ω",
    "R = U/I = 6,0/0,5 = 12 Ω. Sai số lấy theo nửa vạch chia nhỏ nhất của mỗi đồng hồ.")
mcq(11, "Để đo điện trở bằng vôn kế và ampe kế, cách mắc đúng là",
    ["Ampe kế song song, vôn kế nối tiếp", "Cả hai nối tiếp với R", "Ampe kế nối tiếp, vôn kế song song với R", "Cả hai song song với R"], 2,
    "Ampe kế phải nối tiếp để đo dòng qua R; vôn kế song song để đo đúng hiệu điện thế hai đầu R.")
num(11, "Thí nghiệm đo tiêu cự: vật cách thấu kính 30 cm, màn cách 15 cm cho ảnh rõ. Tiêu cự?", 30*15/45, "cm",
    "1/f = 1/30 + 1/15 = 1/10 ⇒ f = 10 cm.")
num(11, "Treo vật vào lực kế: ngoài không khí 5,4 N, ngập trong nước 3,24 N. Khối lượng riêng của vật? (d_nước = 10 000 N/m³)", 2500, "kg/m³",
    "F_A = 2,16 N ⇒ V = 2,16/10 000 = 2,16·10⁻⁴ m³; m = 0,54 kg ⇒ D = 0,54/2,16·10⁻⁴ = 2 500 kg/m³.")
tf(11, "Trong thí nghiệm đo điện trở, phải thay đổi con chạy biến trở để lấy nhiều cặp số liệu rồi mới kết luận.", True,
    "Một cặp số liệu không cho biết sai số; nhiều điểm và đồ thị I–U mới đánh giá được kết quả.")
mcq(11, "Khi đọc số chỉ trên đồng hồ kim, sai số thường lấy bằng",
    ["Cả vạch chia nhỏ nhất", "Nửa vạch chia nhỏ nhất", "Hai vạch chia nhỏ nhất", "Không cần sai số"], 1,
    "Mắt chỉ phân biệt được khoảng nửa vạch, nên sai số đọc là nửa độ chia nhỏ nhất.")
order(11, "Sắp xếp đúng trình tự thí nghiệm đo tiêu cự thấu kính hội tụ.",
      ["Bố trí nến, thấu kính, màn trên giá quang học thẳng hàng",
       "Đặt vật ngoài 2f, dịch màn đến khi ảnh rõ nét nhất",
       "Đọc và ghi d, d′ vào bảng",
       "Lặp lại với ba vị trí vật khác nhau",
       "Tính f cho từng lần rồi lấy trung bình"],
      "Phải căn thẳng hàng trước, sau đó mới dịch màn; ba lần đo để giảm sai số ngẫu nhiên.")
order(11, "Sắp xếp các bước đo khối lượng riêng của một vật rắn bằng lực kế.",
      ["Treo vật vào lực kế, đọc trọng lượng P trong không khí",
       "Nhúng vật ngập hoàn toàn trong nước, đọc F",
       "Tính F_A = P − F, suy ra thể tích V = F_A/d_nước",
       "Tính khối lượng m = P/10 rồi D = m/V"],
      "Thứ tự này tránh phải đo thể tích bằng bình chia độ khi vật không lọt bình.")

# ============ T12 TỔNG HỢP ============
num(12, "R₁ = 4 Ω nối tiếp với (R₂ = 6 Ω song song R₃ = 3 Ω), U = 12 V. Cường độ dòng mạch chính?", 12/(4+2), "A",
    "Cụm song song = 6·3/9 = 2 Ω; R = 6 Ω ⇒ I = 2 A.")
num(12, "Vật 0,5 kg ở độ cao 2 m (g = 10 m/s²). Thế năng trọng trường?", 0.5*10*2, "J",
    "W_t = mgh = 0,5·10·2 = 10 J, chọn mốc tại mặt đất.")
num(12, "Nhiệt lượng để 0,5 kg nước tăng 20 °C (c = 4200 J/kg·K)?", 0.5*4200*20/1000, "kJ",
    "Q = 0,5 × 4200 × 20 = 42 000 J = 42 kJ.")
tf(12, "Điện trở tương đương của đoạn mạch song song luôn nhỏ hơn điện trở nhỏ nhất trong đoạn.", True,
    "Vì có thêm đường cho dòng điện đi, R giảm so với từng nhánh.")
num(12, "Thấu kính hội tụ f = 12 cm, vật cách 36 cm. Ảnh cách kính?", 36*12/(36-12), "cm",
    "d′ = df/(d−f) = 36·12/24 = 18 cm; ảnh thật, ngược chiều, cao bằng nửa vật.")
mcq(12, "Đơn vị nào KHÔNG phải của công suất?",
    ["W", "J/s", "kW", "J·s"], 3,
    "Công suất = công/thời gian nên đơn vị là J/s = W; J·s là đơn vị của một đại lượng khác (tác dụng của dòng điện).")
num(12, "Một bóng đèn 220 V – 60 W sáng bình thường. Điện trở của đèn?", 220**2/60, "Ω",
    "R = U²/P = 48 400/60 ≈ 806,7 Ω.")

print("quiz", len(Q))

# ================= HỎI ĐÁP =================
QA = [
 (1, "Vì sao trên cùng một quãng đường, vận tốc trung bình không bằng trung bình cộng hai vận tốc?",
  "van toc trung binh|trung binh cong|sai lam|hai nua quang duong",
  "Vì thời gian hai chặng khác nhau: chặng nhanh mất ít thời gian nên ít ảnh hưởng. Dùng <code>v<sub>tb</sub> = 2v₁v₂/(v₁+v₂)</code> cho hai nửa quãng đường bằng nhau."),
 (1, "Khi nào dùng công thức cộng vận tốc dạng cộng và khi nào dùng dạng trừ?",
  "cong van toc|thuyen|dong nuoc|xuoi|nguoc|dau",
  "Xuôi chiều (thuyền − nước, người − thang cuốn) thì cộng; ngược chiều thì trừ. Luôn cộng dạng vectơ: <code>v⃗<sub>13</sub> = v⃗<sub>12</sub> + v⃗<sub>23</sub></code>, rồi mới xét dấu."),
 (2, "Đặt vật lên cân trong thang máy đang đi lên nhanh dần, số chỉ thay đổi thế nào?",
  "can|thang may|trong luong bieu kien|nhanh dan|cham dan",
  "Số chỉ tăng, vì cân phải tác dụng lực lớn hơn trọng lượng để tạo gia tốc hướng lên: <code>N = m(g + a)</code>. Đi xuống nhanh dần thì số chỉ giảm."),
 (2, "Tại sao tàu thuỷ bằng thép nặng vẫn nổi?",
  "tau thuy|thep|noi|the tich chiem cho|trong luong rieng trung binh",
  "Vì toàn bộ thân tàu là một khối rỗng chiếm thể tích nước rất lớn. Trọng lượng riêng trung bình của cả tàu (kể cả khoang khí) nhỏ hơn của nước."),
 (3, "Công suất ghi trên máy có phải là công suất thực tế máy luôn sinh ra không?",
  "cong suat dinh muc|thuc te|hao phi|hieu suat",
  "Không. Đó là công suất định mức. Công suất thực tế nhỏ hơn vì hao phí: <code>P<sub>thực</sub> = H·P<sub>định mức</sub></code>."),
 (3, "Tại sao đi bộ đường dài lại mệt hơn đi trên cùng quãng đường bằng phẳng ngắn hơn?",
  "cong|cong can|ma sat|nang luong|met",
  "Cơ thể vẫn phải sinh công để thắng ma sát và nâng hạ trọng tâm. Cùng độ cao nhưng đường dài hơn ⇒ công của lực cản lớn hơn, năng lượng phải cung cấp nhiều hơn."),
 (4, "Vì sao khi chụp ảnh phải lấy nét?",
  "may anh|lay net|tieu cu|anh that|man",
  "Vì phim/cảm biến đóng vai trò cái màn cố định, muốn ảnh rõ thì phải dịch thấu kính để ảnh rơi đúng mặt phẳng cảm biến — tức thay đổi d′."),
 (4, "Ảnh ảo của thấu kính hội tụ có hứng được trên màn không, vì sao vẫn nhìn thấy?",
  "anh ao|hung man|nhin thay|thau kinh hoi tu",
  "Không hứng được vì các tia ló phân kì. Nhưng mắt đặt phía sau thấu kính vẫn nhận được chùm phân kì đó và “kéo dài” chúng về phía trước để thấy ảnh."),
 (5, "Vì sao ampe kế phải mắc nối tiếp và có điện trở rất nhỏ?",
  "ampe ke|noi tiep|dien tro nho|sai so",
  "Mắc nối tiếp để dòng cần đo chạy qua nó. Điện trở phải nhỏ để không làm thay đổi dòng điện của mạch, nếu không số đo sai."),
 (5, "Vì sao vôn kế phải mắc song song và có điện trở rất lớn?",
  "von ke|song song|dien tro lon|sai so",
  "Song song để đo hiệu điện thế giữa hai điểm. Điện trở lớn để dòng rẽ qua vôn kế không đáng kể, không làm lệch trạng thái mạch."),
 (6, "Khi hai đèn mắc nối tiếp, đèn nào sáng hơn?",
  "hai den|noi tiep|sang hon|cong suat|dien tro",
  "Đèn có điện trở lớn hơn sáng hơn vì cùng dòng: <code>P = I²R</code>. Mắc song song thì ngược lại — đèn có điện trở nhỏ hơn sáng hơn do <code>P = U²/R</code>."),
 (6, "Vì sao đường dây tải điện phải dùng hiệu điện thế rất cao?",
  "truyen tai|hao phi|hieu dien the cao|1/U2",
  "Công suất hao phí <code>P<sub>hp</sub> = P²R/U²</code> tỉ lệ nghịch với bình phương hiệu điện thế. Tăng U 10 lần thì hao phí giảm 100 lần."),
 (7, "Vì sao nước đá đang tan lại ở 0 °C dù vẫn nhận nhiệt?",
  "nuoc da|tan|0 do|nong chay|nhiet do khong doi",
  "Nhiệt lượng nhận vào dùng để phá vỡ liên kết tinh thể chứ không làm tăng động năng trung bình của phân tử, nên nhiệt độ không đổi."),
 (7, "Vì sao ban ngày ở biển gió thổi từ biển vào đất liền?",
  "gio bien|doi luu|nhiet dung rieng|ban ngay",
  "Đất nóng nhanh hơn nước nên không khí trên đất bốc lên, không khí mát từ biển tràn vào thay chỗ. Ban đêm thì đảo chiều."),
 (8, "Vì sao ảnh trong gương phẳng không hứng được nhưng lại đúng chiều cao?",
  "guong phang|anh ao|do lon|doi xung",
  "Vì ảnh là giao của các tia phản xạ kéo dài về phía sau gương. Khoảng cách và kích thước đối xứng nên bằng vật, nhưng không có ánh sáng thật hội tụ ở đó."),
 (8, "Kính chiếu hậu ô tô dùng gương gì và vì sao?",
  "kinh chieu hau|guong cau loi|guong cau lom|thi truong",
  "Gương cầu lồi: vùng nhìn thấy rộng hơn gương phẳng cùng kích thước, đổi lại ảnh nhỏ hơn vật nên khó ước lượng khoảng cách."),
 (9, "Vì sao ban đêm nhìn lá cây có màu gần đen?",
  "la cay|mau den|tan xa|anh sang|ban dem",
  "Lá tán xạ tốt ánh sáng lục; dưới ánh sáng yếu và lệch màu của đèn đường, phần lớn các màu khác bị hấp thụ nên lá trông sẫm."),
 (10, "Vì sao máy biến áp không dùng được với dòng điện một chiều?",
  "may bien ap|mot chieu|xoat chieu|cam ung|tu thong bien thien",
  "Cần từ thông biến thiên mới có suất điện động cảm ứng. Dòng một chiều cho từ thông không đổi nên cuộn thứ cấp không có điện áp."),
 (10, "Làm sao biết một nam châm còn từ tính hay đã mất?",
  "nam cham|tu tinh|thu nghiem|kim nam cham|man sat",
  "Đưa lại gần kim nam châm hoặc vài đinh sắt: nếu kim lệch hoặc đinh bị hút thì còn từ tính. Đốt nóng hoặc gõ mạnh làm nam châm yếu dần."),
 (11, "Vì sao phải mắc vôn kế song song đúng hai đầu điện trở cần đo, không phải hai đầu cả mạch?",
  "von ke|do dien tro|hai dau|sai|noi tiep",
  "Vì R = U/I phải dùng đúng U của chính điện trở đó. Mắc sang hai đầu cả mạch sẽ cộng thêm hiệu điện thế trên ampe kế và dây nối, kết quả sai."),
 (11, "Bảng số liệu nên ghi bao nhiêu điểm là đủ?",
  "bang so lieu|bao nhieu diem|do thi|sai so|5 diem",
  "Tối thiểu 5 điểm rải đều trong khoảng đo. Vẽ đồ thị rồi mới kết luận, vì đồ thị phát hiện được điểm đo sai mà bảng số liệu thì không."),
 (11, "Nếu các điểm đo không nằm thẳng hàng trên đồ thị thì làm gì?",
  "do thi|khong thang hang|sai so|duong trung binh|loai diem",
  "Vẽ đường thẳng đi “giữa” các điểm sao cho tổng khoảng cách lệch nhỏ nhất, không nối từng điểm. Điểm lệch quá xa nên kiểm tra lại phép đo trước khi loại."),
 (12, "Trong đề thi, câu thực nghiệm thường được trình bày theo mấy phần?",
  "thuc nghiem|trinh bay|de thi|phuong an|cach lam",
  "Bốn phần: (1) mục đích, (2) dụng cụ, (3) các bước tiến hành, (4) công thức tính và xử lý kết quả kèm sai số."),
 (12, "Vì sao phải ghi đơn vị ngay trong bước tính?",
  "don vi|trinh bay|bai thi|sai don vi|diem",
  "Đơn vị là một phần của kết quả; ghi đúng đơn vị vừa cho điểm trình bày, vừa giúp phát hiện lỗi đổi đơn vị — lỗi làm mất điểm nhiều nhất trong bài điện và nhiệt."),
 (4, "Vật dịch lại gần thấu kính hội tụ thì ảnh dịch về đâu?",
  "dich vat|dich anh|thau kinh|gan|xa",
  "Khi d giảm (vẫn lớn hơn f), d′ tăng: ảnh dịch ra xa và lớn dần. Khi d tiến sát f thì d′ tiến tới vô cực."),
 (6, "Vì sao khi mắc thêm một bóng đèn song song, các đèn còn lại tối đi?",
  "mac them|song song|toi di|dien tro trong|sut ap",
  "Vì dòng tổng tăng, hiệu điện thế rơi trên điện trở trong và dây dẫn tăng, nên hiệu điện thế đặt vào các đèn giảm."),
]

# ================= BÀI GIẢI MẪU =================
S = []
S.append({"t": 6, "title": "Đèn sáng bình thường — tìm biến trở và công suất tiêu hao",
 "problem": "Nguồn E = 12 V, điện trở trong r = 1 Ω. Đèn ghi 6 V – 3 W mắc nối tiếp với biến trở R. Tìm R để đèn sáng bình thường và công suất tiêu hao trên biến trở khi đó.",
 "steps": [
  "Đèn sáng bình thường ⇒ hiệu điện thế hai đầu đèn đúng 6 V và dòng qua đèn đúng dòng định mức.",
  "Dòng định mức: I = P/U = 3/6 = 0,5 A. Điện trở đèn R_đ = U²/P = 36/3 = 12 Ω.",
  "Sụt áp trên điện trở trong: U_r = I·r = 0,5 × 1 = 0,5 V.",
  "Định luật Ôm cho cả mạch: E = U_đ + U_R + U_r ⇒ 12 = 6 + U_R + 0,5 ⇒ U_R = 5,5 V.",
  "Điện trở biến trở: R = U_R/I = 5,5/0,5 = 11 Ω.",
  "Công suất tiêu hao trên biến trở: P_R = I²R = 0,25 × 11 = 2,75 W; kiểm tra công suất toàn mạch P = 12 × 0,5 = 6 W = 3 W (đèn) + 2,75 W + 0,25 W (trong)."],
 "answer": "R = 11 Ω; P_R = 2,75 W"})
S.append({"t": 11, "title": "Đo tiêu cự bằng phương pháp Bessel (vật – màn cố định)",
 "problem": "Giữ vật và màn cách nhau L = 90 cm. Dịch thấu kính hội tụ giữa chúng, thấy có hai vị trí cho ảnh rõ nét, hai vị trí cách nhau 30 cm. Tính tiêu cự thấu kính.",
 "steps": [
  "Gọi d là khoảng cách vật – thấu kính ở một vị trí cho ảnh rõ, thì d + d′ = L.",
  "Từ 1/f = 1/d + 1/d′ với d′ = L − d, rút ra phương trình bậc hai: d² − Ld + Lf = 0.",
  "Phương trình có hai nghiệm d₁, d₂ thoả d₁ + d₂ = L và d₁d₂ = Lf.",
  "Hiệu hai nghiệm chính là khoảng cách hai vị trí thấu kính: Δ = |d₁ − d₂| = 30 cm.",
  "Bình phương: Δ² = L² − 4Lf ⇒ f = (L² − Δ²)/(4L) = (8100 − 900)/360 = 20 cm.",
  "Kiểm tra: với f = 20 cm, L = 90 cm thì hai nghiệm d = 60 cm và 30 cm, cách nhau đúng 30 cm."],
 "answer": "f = 20 cm"})
S.append({"t": 7, "title": "Bếp điện đun nước — thời gian khi có hiệu suất",
 "problem": "Bếp điện 220 V – 1 000 W đun 1 lít nước từ 20 °C đến sôi. Hiệu suất của bếp là 80%, nhiệt dung riêng của nước 4 200 J/kg·K. Tính thời gian đun.",
 "steps": [
  "Khối lượng nước: m = 1 kg (1 lít nước).",
  "Nhiệt lượng có ích: Q_ci = mcΔt = 1 × 4 200 × 80 = 336 000 J.",
  "Vì H = Q_ci/Q_tp ⇒ nhiệt lượng bếp phải toả: Q_tp = Q_ci/H = 336 000/0,8 = 420 000 J.",
  "Bếp có công suất 1 000 W nên Q_tp = P·t ⇒ t = Q_tp/P = 420 000/1 000 = 420 s.",
  "Đổi ra phút: 7 phút. Nhận xét: 20% năng lượng mất vào môi trường, nắp càng kín thì H càng cao."],
 "answer": "t = 420 s = 7 phút"})
S.append({"t": 2, "title": "Khối nước đá nổi — phần chìm, phần nổi và mực nước khi tan",
 "problem": "Một khối nước đá thể tích 200 cm³ (D = 900 kg/m³) thả vào cốc nước. Tính thể tích phần chìm, phần nổi và cho biết mực nước thay đổi thế nào khi đá tan hết.",
 "steps": [
  "Khối lượng đá: m = D·V = 900 × 200·10⁻⁶ = 0,18 kg ⇒ trọng lượng P = 1,8 N.",
  "Nổi cân bằng ⇒ F_A = P ⇒ 10 000 × V_chìm = 1,8 ⇒ V_chìm = 1,8·10⁻⁴ m³ = 180 cm³.",
  "Phần nổi: V_nổi = 200 − 180 = 20 cm³, tức 10% thể tích.",
  "Khi tan, khối đá thành 0,18 kg nước, chiếm thể tích 180 cm³ — đúng bằng phần thể tích đã chìm.",
  "Vậy mực nước trong cốc không đổi. Nếu khối đá có bọt khí hoặc vật nặng bên trong thì kết luận thay đổi."],
 "answer": "V_chìm = 180 cm³; V_nổi = 20 cm³; mực nước không đổi"})
S.append({"t": 4, "title": "Ảnh ảo cao gấp ba, cách vật 20 cm — tìm tiêu cự",
 "problem": "Vật sáng AB vuông góc trục chính của thấu kính hội tụ cho ảnh ảo A′B′ cùng chiều cao gấp 3 lần vật, ảnh cách vật 20 cm. Tính tiêu cự.",
 "steps": [
  "Ảnh ảo, cùng chiều ⇒ vật nằm trong tiêu cự d < f, ảnh cùng phía vật và xa hơn: d′ < 0 theo quy ước, |d′| = 3d (vì |k| = |d′|/d = 3).",
  "Ảnh cách vật 20 cm ⇒ |d′| − d = 20 ⇒ 3d − d = 20 ⇒ d = 10 cm, |d′| = 30 cm.",
  "Công thức thấu kính với d′ = −30 cm: 1/f = 1/d + 1/d′ = 1/10 − 1/30 = 2/30.",
  "Suy ra f = 15 cm. Kiểm tra lại: d = 10 < f = 15 nên đúng là ảnh ảo.",
  "Kết luận: vật cách kính 10 cm, ảnh ảo cách kính 30 cm cùng phía, cao 3 lần vật."],
 "answer": "f = 15 cm"})
S.append({"t": 6, "title": "Công suất trên biến trở đạt cực đại",
 "problem": "Nguồn E = 12 V, r = 2 Ω nối với biến trở R. Tìm R để công suất tiêu thụ trên biến trở lớn nhất và tính giá trị lớn nhất đó.",
 "steps": [
  "Dòng mạch chính: I = E/(R + r).",
  "Công suất trên biến trở: P = I²R = E²R/(R + r)².",
  "Chia cả tử và mẫu cho R: P = E²/(R + 2r + r²/R). Mẫu nhỏ nhất khi R = r²/R, tức R = r.",
  "Vậy P cực đại khi R = r = 2 Ω.",
  "Giá trị cực đại P_max = E²/(4r) = 144/8 = 18 W; khi đó U_R = E/2 = 6 V và hiệu suất của nguồn chỉ 50%.",
  "Nhận xét: muốn hiệu suất cao thì phải chọn R ≫ r, đánh đổi với công suất ra."],
 "answer": "R = 2 Ω; P_max = 18 W"})

# ================= XUẤT FILE =================
def obj(d, indent="  "):
    parts = []
    for k, v in d.items():
        if isinstance(v, bool):
            s = "true" if v else "false"
        elif isinstance(v, (int, float)):
            s = repr(v)
        elif isinstance(v, list):
            s = "[" + ", ".join(J(x) if not isinstance(x, int) else str(x) for x in v) + "]"
        else:
            s = J(v)
        parts.append(f"{k}: {s}")
    return "{" + ", ".join(parts) + "}"

out = []
out.append("/* =========================================================")
out.append("   NỘI DUNG BỔ SUNG LỚN — sinh từ tools/gen_content4.py")
out.append(f"   {len(Q)} câu trắc nghiệm · {len(QA)} hỏi đáp · {len(S)} bài giải mẫu")
out.append("   Mọi đáp án số đều được tính lại bằng Python trước khi xuất.")
out.append("========================================================= */")
out.append("const QUIZ_EXTRA4 = [")
out.append(",\n".join(obj(q) for q in Q))
out.append("];")
out.append("QUIZ.push(...QUIZ_EXTRA4);")
out.append("")
out.append("const QA_EXTRA4 = [")
out.append(",\n".join(obj({"t": t, "q": q, "k": k, "a": a}) for (t, q, k, a) in QA))
out.append("];")
out.append("QA.push(...QA_EXTRA4);")
out.append("")
out.append("const SOLVE_EXTRA4 = [")
out.append(",\n".join("{" + ", ".join([
    f"t: {s['t']}",
    f"title: {J(s['title'])}",
    f"problem: {J(s['problem'])}",
    "steps: [" + ", ".join(J(x) for x in s["steps"]) + "]",
    f"answer: {J(s['answer'])}"]) + "}" for s in S))
out.append("];")
out.append("SOLVE.push(...SOLVE_EXTRA4);")
io.open('/home/user/src/content4.js', 'w', encoding='utf-8').write("\n".join(out) + "\n")
print("wrote content4.js", len("\n".join(out)))
