/* =========================================================
   NỘI DUNG MỞ RỘNG
   1. QA_EXTRA   — 60 câu hỏi đáp
   2. QUIZ_EXTRA — 58 câu, 4 dạng: mcq / multi / tf / num
   3. SOLVE      — 16 bài giải mẫu theo từng bước
========================================================= */

/* ---------- 1. HỎI ĐÁP ---------- */
window.QA_EXTRA=[
/* T1 */
{t:1,q:'Một xe đi nửa quãng đường đầu với 20 km/h, nửa sau 30 km/h. Vận tốc trung bình là bao nhiêu?',
 k:'van toc trung binh|hai nua|20 30|24|tinh toan',
 a:'Không phải 25. Gọi mỗi nửa là s: <code>v<sub>tb</sub> = 2s/(s/20 + s/30) = 2/(1/20+1/30) = 24 km/h</code>. Vì thời gian hai nửa khác nhau.'},
{t:1,q:'Hai xe cùng xuất phát, một xe đi trước 30 phút. Muốn đuổi kịp thì cần điều kiện gì?',
 k:'duoi kip|xuat phat truoc|30 phut|dieu kien|cung chieu',
 a:'Xe sau phải có vận tốc lớn hơn. Quãng đường xe trước đã đi là <code>s<sub>0</sub> = v<sub>1</sub>·0,5</code>; thời gian đuổi kịp tính từ lúc xe sau xuất phát: <code>t = s<sub>0</sub>/(v<sub>2</sub>−v<sub>1</sub>)</code>.'},
{t:1,q:'Đồ thị quãng đường – thời gian của chuyển động đều có dạng gì?',
 k:'do thi|quang duong thoi gian|duong thang|do doc|van toc',
 a:'Là đường thẳng qua gốc toạ độ; độ dốc của đường thẳng chính là vận tốc. Đường càng dốc thì vật chuyển động càng nhanh.'},
{t:1,q:'Khi nói "xe chạy 60 km/h" thì con số đó là vận tốc gì?',
 k:'60 km h|van toc trung binh|toc ke|thuc te',
 a:'Thường là vận tốc trung bình của cả hành trình hoặc giá trị hiển thị tức thời trên tốc kế. Trong đề bài, nếu không nói "tức thời" thì hiểu là trung bình trên đoạn đường đó.'},
{t:1,q:'Làm sao biết một bài chuyển động cần dùng công thức cộng vận tốc?',
 k:'cong van toc|thuyen|xe lua|nguoi di tren tau|moc',
 a:'Khi có hai hệ quy chiếu chuyển động với nhau: thuyền trên dòng nước, người đi trên tàu, máy bay gặp gió. Khi đó <code>v<sub>13</sub> = v<sub>12</sub> + v<sub>23</sub></code> (cộng vectơ).'},

/* T2 */
{t:2,q:'Vì sao ấm trà có vòi cao hơn thân lại không tràn?',
 k:'am tra|voi|binh thong nhau|mat thoang|do cao',
 a:'Vì vòi và thân ấm là hai nhánh của bình thông nhau: nước dâng tới cùng một mặt phẳng ngang. Vòi chỉ tràn khi mực nước trong ấm cao hơn miệng vòi.'},
{t:2,q:'Áp kế đo áp suất khí quyển bằng cách nào?',
 k:'ap ke|khi quyen|torrixen|thuy ngan|760mm',
 a:'Dùng ống Torricelli: ống thuỷ tinh dài đầy thuỷ ngân dốc ngược trong chậu. Cột thuỷ ngân còn lại cao khoảng 76 cm ở mực nước biển, tương đương 101 300 Pa.'},
{t:2,q:'Vì sao vật có hình dáng khác nhau vẫn có thể nổi như nhau?',
 k:'hinh dang|noi|the tich chiem cho|trong luong rieng trung binh',
 a:'Vì điều quyết định là trọng lượng riêng trung bình của cả vật so với chất lỏng, tức tỉ số P/V. Cùng khối lượng, vật nào chiếm thể tích lớn hơn thì dễ nổi hơn.'},
{t:2,q:'Khi vật chìm hoàn toàn trong nước, đặt sâu hơn thì lực đẩy Archimedes có đổi không?',
 k:'chim hoan toan|do sau|FA khong doi|the tich',
 a:'Không đổi, vì <code>F<sub>A</sub> = d·V<sub>chìm</sub></code> và thể tích phần chìm đã bằng cả vật. Áp suất tác dụng lên vật thì vẫn tăng theo độ sâu.'},
{t:2,q:'Làm sao xác định khối lượng riêng của một vật nổi?',
 k:'vat noi|khoi luong rieng|cach do|phan chim',
 a:'Đo phần thể tích chìm V<sub>chìm</sub> và thể tích toàn phần V. Khi nổi: <code>D<sub>vật</sub> = D<sub>lỏng</sub>·V<sub>chìm</sub>/V</code>.'},

/* T3 */
{t:3,q:'Công của trọng lực khi vật đi lên và đi xuống khác dấu thế nào?',
 k:'trong luc|cong am|cong duong|di len|di xuong',
 a:'Đi xuống: trọng lực cùng chiều chuyển động nên <code>A = mgh > 0</code>. Đi lên: ngược chiều nên <code>A = −mgh < 0</code> (công cản). Tổng công của trọng lực trên đường đi kín bằng 0.'},
{t:3,q:'Vì sao nói công suất mới là đại lượng đánh giá máy làm việc nhanh hay chậm?',
 k:'cong suat|danh gia|nhanh cham|may|so sanh',
 a:'Vì hai máy có thể sinh cùng một công nhưng thời gian khác nhau. Công suất <code>P = A/t</code> cho biết công sinh ra trong một giây, mới so sánh được tốc độ làm việc.'},
{t:3,q:'Khi vật trượt trên mặt phẳng nghiêng có ma sát, năng lượng đã chuyển hoá thế nào?',
 k:'mat phang nghieng|ma sat|chuyen hoa|nhiet|the nang',
 a:'Thế năng giảm, chia thành động năng và nhiệt năng do ma sát: <code>mgh = ½mv<sup>2</sup> + F<sub>ms</sub>·l</code>. Ma sát ăn bớt phần năng lượng có ích.'},
{t:3,q:'Con lắc đơn dao động: cơ năng bảo toàn nhưng động năng biến thiên thế nào?',
 k:'con lac|dao dong|co nang|dong nang|vi tri can bang',
 a:'Động năng lớn nhất ở vị trí cân bằng (thế năng nhỏ nhất), bằng 0 ở hai biên. Động năng và thế năng chuyển hoá qua lại nhưng tổng không đổi nếu bỏ qua ma sát.'},
{t:3,q:'Cần cẩu nâng vật 2 tấn lên 10 m trong 20 s. Công suất tối thiểu là bao nhiêu?',
 k:'can cau|2 tan|10m|20s|cong suat|tinh',
 a:'<code>A = mgh = 2000·10·10 = 200 000 J</code>; <code>P = A/t = 10 000 W = 10 kW</code>. Thực tế cần lớn hơn vì có hao phí.'},

/* T4 */
{t:4,q:'Vì sao ảnh qua thấu kính hội tụ lại ngược chiều?',
 k:'nguoc chieu|vi sao|anh that|tia|quang tam',
 a:'Vì tia qua quang tâm truyền thẳng: phần trên của vật nằm phía trên trục chính cho ảnh nằm phía dưới trục chính. Hai tia cắt nhau ở phía đối diện nên ảnh bị đảo.'},
{t:4,q:'Khi vật tiến lại gần thấu kính hội tụ (vẫn ngoài tiêu cự), ảnh thay đổi thế nào?',
 k:'tien lai gan|anh|xa hon|lon hon|thay doi',
 a:'Ảnh thật dịch ra xa thấu kính và lớn dần. Khi d giảm từ ∞ về f thì d′ tăng từ f đến ∞, độ phóng đại tăng theo.'},
{t:4,q:'Vì sao đặt vật trong tiêu cự lại không hứng được ảnh trên màn?',
 k:'trong tieu cu|khong hung duoc|anh ao|man',
 a:'Vì các tia ló phân kì, không cắt nhau ở phía sau thấu kính. Đường kéo dài ngược chiều mới cắt nhau, tạo ảnh ảo — màn đặt ở đâu cũng không nhận được.'},
{t:4,q:'Chiết suất của nước là 4/3 nghĩa là gì?',
 k:'chiec suat|4/3|n=c/v|y nghia|nuoc',
 a:'Nghĩa là ánh sáng truyền trong nước chậm hơn trong chân không 4/3 lần: <code>n = c/v</code>. Từ đó tính được vận tốc ánh sáng trong nước ≈ 225 000 km/s.'},
{t:4,q:'Hệ hai thấu kính ghép sát nhau (a ≈ 0) tính tiêu cự thế nào?',
 k:'he hai thau kinh|ghep sat|a=0|tieu cu tuong duong',
 a:'Cộng nghịch đảo tiêu cự: <code>1/f = 1/f<sub>1</sub> + 1/f<sub>2</sub></code>. Thấu kính hội tụ có f > 0, phân kì f < 0, nên ghép sát có thể triệt tiêu nhau.'},

/* T5 */
{t:5,q:'Vì sao bóng đèn dây tóc có điện trở lớn hơn nhiều so với dây nối?',
 k:'bong den|dien tro lon|day toc|day noi|vi sao',
 a:'Vì dây tóc làm bằng vonfram có điện trở suất lớn, rất mảnh và dài; dây nối bằng đồng, to và ngắn. Điện trở lớn nên toả nhiệt nhiều và phát sáng.'},
{t:5,q:'Mắc hai bóng đèn khác công suất nối tiếp: bóng nào sáng hơn?',
 k:'noi tiep|sang hon|cong suat|cung dong dien|R lon',
 a:'Bóng có điện trở lớn hơn sáng hơn, vì cùng cường độ dòng điện nên <code>P = I<sup>2</sup>R</code>. Với bóng ghi cùng hiệu điện thế, bóng công suất nhỏ hơn có điện trở lớn hơn.'},
{t:5,q:'Vì sao mạch điện trong nhà mắc song song?',
 k:'trong nha|song song|vi sao|dung cu doc lap|220v',
 a:'Để mỗi thiết bị hoạt động độc lập với cùng hiệu điện thế 220 V. Tắt một thiết bị không ảnh hưởng thiết bị khác, và có thể bật tắt riêng.'},
{t:5,q:'Điện trở tương đương của đoạn mạch song song so với các điện trở thành phần thế nào?',
 k:'tuong duong|song song|nho hon|so sanh',
 a:'Luôn nhỏ hơn điện trở nhỏ nhất trong mạch. Càng mắc thêm nhánh song song, điện trở tương đương càng giảm và dòng tổng càng tăng.'},
{t:5,q:'Vì sao không được mắc ampe kế song song với bóng đèn?',
 k:'ampe ke|song song|nguy hiem|noi tat|chay',
 a:'Vì ampe kế có điện trở rất nhỏ, mắc song song sẽ nối tắt bóng đèn và gây dòng điện rất lớn, có thể cháy ampe kế và nguồn.'},

/* T6 */
{t:6,q:'Vì sao lõi nam châm điện dùng sắt non chứ không phải thép?',
 k:'loi sat|sat non|thep|nam cham dien|tu tinh du',
 a:'Sắt non nhiễm từ mạnh nhưng mất từ tính ngay khi ngắt điện, phù hợp làm nam châm điện đóng cắt. Thép giữ từ tính lâu nên dùng làm nam châm vĩnh cửu.'},
{t:6,q:'Từ trường của ống dây có dòng điện giống từ trường của vật gì?',
 k:'ong day|tu truong|nam cham thang|dau cuc',
 a:'Giống từ trường của một nam châm thẳng: một đầu là cực Bắc, một đầu là cực Nam. Đổi chiều dòng điện thì đổi cực.'},
{t:6,q:'Vì sao máy biến áp không dùng được với dòng một chiều?',
 k:'may bien ap|mot chieu|khong dung duoc|tu thong bien thien',
 a:'Vì dòng một chiều tạo từ thông không đổi trong lõi, không có sự biến thiên nên không sinh dòng cảm ứng ở cuộn thứ cấp. Máy biến áp cần dòng xoay chiều.'},
{t:6,q:'Máy phát điện xoay chiều biến đổi năng lượng thế nào?',
 k:'may phat|bien doi|co nang|dien nang|roto',
 a:'Biến cơ năng (quay rôto) thành điện năng. Rôto là nam châm quay trong cuộn dây, làm số đường sức qua cuộn biến thiên tuần hoàn.'},
{t:6,q:'Vì sao đường dây cao thế nguy hiểm dù chỉ tiếp xúc gián tiếp?',
 k:'cao the|nguy hiem|dien giat|khoang cach|cach dien',
 a:'Vì hiệu điện thế hàng trăm kV, điện trường mạnh có thể gây phóng điện qua không khí khi lại gần. Khoảng cách an toàn phải rất lớn, không chỉ tránh chạm dây.'},

/* T7 */
{t:7,q:'Vì sao nước biển lâu nóng hơn nước trong hồ?',
 k:'nuoc bien|nong cham|nhiet dung rieng|khoi luong|muoi',
 a:'Do khối lượng nước lớn và nhiệt dung riêng của nước cao (4200 J/kg.K), cần rất nhiều nhiệt để tăng 1 °C. Nước biển còn có muối làm thay đổi nhiệt dung và nhiệt độ sôi.'},
{t:7,q:'Vì sao khi đun nước, nước nóng đối lưu thành dòng?',
 k:'doi luu|dun nuoc|dong|noi len|lanh xuong',
 a:'Lớp nước dưới nóng lên, nở ra, khối lượng riêng giảm nên nổi lên; lớp lạnh phía trên chìm xuống tạo dòng đối lưu làm nước nóng đều.'},
{t:7,q:'Tại sao mùa đông mặc áo len lại ấm?',
 k:'ao len|mua dong|am|dan nhiet|khong khi',
 a:'Len dẫn nhiệt kém và giữ lớp không khí giữa các sợi, ngăn nhiệt truyền từ cơ thể ra ngoài. Áo không sinh nhiệt, chỉ giảm mất nhiệt.'},
{t:7,q:'Khi tính cân bằng nhiệt có vật chuyển thể, cần kiểm tra gì trước?',
 k:'chuyen the|kiem tra|nuoc da tan het|bien luan|nhiet do cuoi',
 a:'So sánh nhiệt lượng cần để vật chuyển thể hết với nhiệt lượng vật kia có thể toả ra. Nếu thiếu thì nhiệt độ cuối dừng ở nhiệt độ chuyển thể; nếu đủ mới tính tiếp nhiệt độ tăng.'},
{t:7,q:'Vì sao nắp ấm đậy kín nước sôi lâu hơn?',
 k:'nap am|day kin|lau soi|bay hoi|hao phi',
 a:'Vì giảm bay hơi — bay hơi lấy nhiệt từ khối nước nên làm nguội. Đậy nắp giữ hơi, giảm hao phí nhiệt ra không khí.'},

/* T8 */
{t:8,q:'Vì sao gương chiếu hậu ô tô dùng gương lồi?',
 k:'guong loi|chieu hau|o to|vung nhin thay|anh nho',
 a:'Gương cầu lồi cho vùng nhìn thấy rộng hơn gương phẳng cùng kích thước, dù ảnh nhỏ hơn. Ưu tiên quan sát phía sau hơn là kích thước ảnh.'},
{t:8,q:'Mắt viễn thị khác mắt lão ở điểm nào?',
 k:'vien thi|lao thi|khac nhau|hoi tu|diem cuc can',
 a:'Cả hai đều dùng kính hội tụ. Viễn thị là tật bẩm sinh, ảnh hội tụ sau võng mạc kể cả khi nhìn xa. Lão thị là do tuổi, mất khả năng điều tiết nhìn gần, nhìn xa vẫn rõ.'},
{t:8,q:'Vì sao khi chụp ảnh, người ta thường đứng xa để chụp toàn thân?',
 k:'chup anh|toan than|dung xa|tieu cu|anh nho',
 a:'Với tiêu cự cố định, muốn ảnh nhỏ lại cho vừa khung hình thì phải tăng d: <code>d′ = df/(d−f)</code> tiến dần về f và ảnh nhỏ đi.'},
{t:8,q:'Muốn quan sát một vật nhỏ, nên chọn kính lúp có bội giác lớn hay nhỏ?',
 k:'kinh lup|boi giac|chon|quan sat|f nho',
 a:'Chọn bội giác lớn, tức tiêu cự nhỏ (<code>G = 25/f</code>). Nhưng bội giác quá lớn làm vùng nhìn thấy hẹp và ảnh méo, nên thực tế dùng 2×–10×.'},
{t:8,q:'Ảnh của vật qua gương phẳng có hứng được bằng màn không? Vì sao?',
 k:'guong phang|hung duoc|anh ao|vi sao|man',
 a:'Không. Các tia phản xạ từ gương là chùm phân kì, đường kéo dài về sau gương mới cắt nhau, nên ảnh là ảnh ảo.'},

/* T9 */
{t:9,q:'Vì sao bầu trời màu xanh còn hoàng hôn màu đỏ?',
 k:'bau troi xanh|hoang hon|tan xa|mau do|anh sang',
 a:'Ánh sáng xanh bị tán xạ mạnh trong khí quyển nên mắt nhận xanh khi nhìn lên. Khi Mặt Trời thấp, ánh sáng đi qua lớp khí dày, phần xanh bị tán xạ hết, còn đỏ đi tới mắt.'},
{t:9,q:'Vì sao vật màu đen hấp thụ nhiều năng lượng ánh sáng?',
 k:'mau den|hap thu|nang luong|nong|anh sang',
 a:'Vật đen hấp thụ hầu hết các ánh sáng tới và tán xạ rất ít, nên nhận nhiều năng lượng và nóng lên nhanh hơn vật sáng màu.'},
{t:9,q:'Có thể tạo ánh sáng trắng bằng cách trộn hai màu không?',
 k:'tron hai mau|trang|do luc|bo sung|man hinh',
 a:'Có. Hai màu gọi là bổ sung cho nhau khi trộn lại thành trắng, ví dụ đỏ và lục lam. Ba màu cơ bản đỏ – lục – lam trộn theo tỉ lệ thích hợp cũng cho trắng.'},
{t:9,q:'Vì sao phim ảnh cũ phải chụp trong buồng tối đỏ?',
 k:'phim anh|buong toi do|anh sang do|hong phim',
 a:'Phim nhạy với ánh sáng xanh và tím, ít nhạy với đỏ, nên đèn đỏ không làm hỏng phim. Đây là ứng dụng của việc phân biệt màu ánh sáng theo bước sóng.'},
{t:9,q:'Ánh sáng có bị đổi màu khi truyền qua môi trường trong suốt không?',
 k:'truyen qua|doi mau|trong suot|chiec suat',
 a:'Không đổi tần số nên không đổi màu; chỉ đổi vận tốc và đổi hướng. Màu của một ánh sáng đơn sắc được quyết định bởi tần số.'},

/* T10 */
{t:10,q:'Vì sao không thể chế tạo động cơ có hiệu suất 100%?',
 k:'hieu suat 100|dong co|ma sat|nhiet|khong the',
 a:'Vì luôn có ma sát, toả nhiệt ra môi trường và tổn thất khác. Nhiệt sinh ra không được dùng hữu ích nên hiệu suất luôn nhỏ hơn 1.'},
{t:10,q:'Khi phanh xe, năng lượng đi đâu?',
 k:'phanh xe|nang luong|nhiet|ma sat|dien nang',
 a:'Động năng chuyển thành nhiệt ở má phanh và đĩa phanh (một phần thành âm thanh). Với xe điện, phần lớn được thu hồi thành điện năng (phanh tái sinh).'},
{t:10,q:'Năng lượng của bóng đèn LED so với bóng sợi đốt về hiệu suất?',
 k:'led|soi dot|hieu suat|anh sang|nhiet',
 a:'LED biến phần lớn điện năng thành ánh sáng nên hiệu suất cao hơn nhiều lần. Bóng sợi đốt chỉ khoảng 5% thành ánh sáng, còn lại là nhiệt.'},
{t:10,q:'Vì sao nói năng lượng của thức ăn cũng cuối cùng thành nhiệt?',
 k:'thuc an|hoa nang|nhiet|co the|chuyen hoa',
 a:'Hoá năng trong thức ăn chuyển thành cơ năng và nhiệt năng trong cơ thể, cuối cùng toả ra môi trường. Năng lượng chỉ đổi dạng, không mất đi.'},
{t:10,q:'Vì sao hiệu suất của quạt điện lại thấp hơn động cơ công nghiệp?',
 k:'quat dien|hieu suat|dong co|hao phi|cong suat nho',
 a:'Động cơ nhỏ có tỉ lệ tổn thất ma sát và toả nhiệt cao hơn so với công suất hữu ích. Máy lớn có thiết kế tối ưu hơn nên hiệu suất cao hơn.'},

/* T11 */
{t:11,q:'Vì sao trong thí nghiệm đo tiêu cự phải để vật sáng và màn song song?',
 k:'thí nghiem|do tieu cu|song song|vat sang|man',
 a:'Để trục chính vuông góc với mặt phẳng vật và màn, nhờ đó ảnh rõ nét và khoảng cách L đo đúng dọc theo trục chính.'},
{t:11,q:'Khi đo nhiều lần nên xử lý số liệu thế nào?',
 k:'do nhieu lan|trung binh|so lieu|sai so|ket qua',
 a:'Tính giá trị trung bình cộng của các lần đo, rồi tính sai số tuyệt đối trung bình. Ghi kết quả dạng <code>A = Ā ± ΔA</code> kèm đơn vị.'},
{t:11,q:'Vì sao cần đo độ dài bằng thước có ĐCNN nhỏ hơn?',
 k:'docnn|thuoc|do dai|do chinh xac|sai so',
 a:'ĐCNN nhỏ nghĩa là thước chia vạch mịn hơn, đọc được giá trị chi tiết hơn nên sai số dụng cụ nhỏ hơn. Sai số tuyệt đối không thể nhỏ hơn nửa ĐCNN.'},
{t:11,q:'Làm sao đo tiêu cự nếu chỉ có thấu kính và một vật ở rất xa?',
 k:'tieu cu|vat o xa|mat troi|anh|f',
 a:'Hứng ảnh của vật ở xa (Mặt Trời, đèn đường) lên màn; khi ảnh rõ nét thì khoảng cách từ thấu kính tới màn xấp xỉ bằng tiêu cự, vì d ≈ ∞ nên d′ ≈ f.'},
{t:11,q:'Sai số hệ thống khác sai số ngẫu nhiên ở đâu?',
 k:'sai so he thong|ngau nhien|khac nhau|dung cu',
 a:'Sai số hệ thống lặp lại như nhau do dụng cụ lệch hoặc phương pháp sai. Sai số ngẫu nhiên thay đổi mỗi lần đo do thao tác và điều kiện, giảm bằng cách đo nhiều lần.'},

/* T12 */
{t:12,q:'Nên đọc đề và ghi nhanh những gì?',
 k:'doc de|ghi nhanh|du kien|yeu cau|don vi',
 a:'Ghi dữ kiện đã cho kèm đơn vị, đại lượng cần tìm, và dạng bài nhận ra. Với bài quang, phác nhanh hình; với bài điện, vẽ lại sơ đồ mạch.'},
{t:12,q:'Khi bí một câu, nên viết gì để vẫn có điểm?',
 k:'bi|viet gi|co diem|huong lam|cong thuc',
 a:'Viết công thức liên quan, vẽ hình, nêu hướng giải và điều kiện. Giám khảo chấm theo bước nên phần đúng vẫn được điểm dù chưa ra kết quả.'},
{t:12,q:'Vì sao nên kiểm tra đơn vị ở bước cuối?',
 k:'kiem tra don vi|buoc cuoi|sai don vi|ket qua',
 a:'Vì phần lớn lỗi mất điểm là đổi đơn vị sai (cm sang m, gam sang kg, phút sang giây). Kiểm tra đơn vị cũng giúp phát hiện công thức sai.'},
{t:12,q:'Có nên học thuộc đáp án các đề đã chữa không?',
 k:'hoc thuoc|dap an|de chua|khong nen|phuong phap',
 a:'Không nên. Chỉ nên ghi lại dạng bài và lỗi sai. Học thuộc đáp án không giúp khi đề đổi số, còn nhận dạng lỗi thì áp dụng được cho mọi bài.'},
{t:12,q:'Thời gian hợp lý cho một bài thi 5 câu tự luận 120 phút?',
 k:'5 cau|120 phut|phan bo|thoi gian|chien thuat',
 a:'Khoảng 10 phút đọc và định hướng, 95 phút làm bài theo điểm số, 15 phút soát lại đơn vị, dấu và kết luận. Câu dễ làm trước.'}
];

/* ---------- 2. TRẮC NGHIỆM ---------- */
window.QUIZ_EXTRA=[
/* T1 */
{t:1,type:'num',q:'Hai xe cách nhau 180 km chạy ngược chiều với vận tốc 50 km/h và 40 km/h. Sau bao lâu gặp nhau?',a:2,tol:0.05,unit:'giờ',
 e:'t = s/(v₁+v₂) = 180/90 = 2 giờ.'},
{t:1,type:'multi',q:'Những yếu tố nào ảnh hưởng tới vận tốc trung bình của cả hành trình?',o:['Tổng quãng đường','Tổng thời gian','Cách chia chặng','Màu của xe'],a:[0,1,2],
 e:'v_tb = s/t nên chỉ phụ thuộc quãng đường và thời gian; cách chia chặng quyết định hai đại lượng đó.'},
{t:1,type:'tf',q:'Trên cùng một quãng đường, vận tốc và thời gian tỉ lệ nghịch với nhau.',a:true,
 e:'s = v·t không đổi nên v tăng bao nhiêu lần thì t giảm bấy nhiêu lần.'},
{t:1,type:'mcq',q:'Thuyền xuôi dòng 4 giờ, ngược dòng 6 giờ trên cùng quãng đường. Tỉ số vận tốc thuyền / vận tốc nước là:',o:['3','4','5','6'],a:2,
 e:'4(v+b) = 6(v−b) ⇒ 4v+4b = 6v−6b ⇒ 10b = 2v ⇒ v = 5b.'},
{t:1,type:'num',q:'Xe đi nửa quãng đường đầu với 20 km/h, nửa sau với 30 km/h. Vận tốc trung bình (km/h)?',a:24,tol:0.2,unit:'km/h',
 e:'v_tb = 2/(1/20 + 1/30) = 24 km/h, không phải trung bình cộng 25.'},

/* T2 */
{t:2,type:'num',q:'Áp suất tại đáy cột nước cao 1,2 m (d = 10 000 N/m³) là bao nhiêu Pa?',a:12000,tol:10,unit:'Pa',
 e:'p = d·h = 10 000 × 1,2 = 12 000 Pa.'},
{t:2,type:'multi',q:'Lực đẩy Archimedes phụ thuộc vào:',o:['Trọng lượng riêng của chất lỏng','Thể tích phần vật chìm','Khối lượng của vật','Độ sâu khi vật đã chìm hoàn toàn'],a:[0,1],
 e:'F_A = d·V_chìm. Khi đã chìm hoàn toàn, thể tích không đổi nên độ sâu không ảnh hưởng.'},
{t:2,type:'tf',q:'Áp suất của chất lỏng tại một điểm phụ thuộc vào diện tích đáy bình chứa.',a:false,
 e:'p = d·h chỉ phụ thuộc độ sâu và trọng lượng riêng, không phụ thuộc hình dạng hay diện tích đáy.'},
{t:2,type:'num',q:'Máy nén thuỷ lực: F₁ = 100 N trên pit-tông S₁ = 10 cm². Hỏi lực F₂ trên pit-tông S₂ = 200 cm²?',a:2000,tol:1,unit:'N',
 e:'F₂ = F₁·S₂/S₁ = 100 × 200/10 = 2 000 N.'},
{t:2,type:'mcq',q:'Khối gỗ nổi trong nước, phần nổi trên mặt bằng 1/3 thể tích. Trọng lượng riêng của gỗ (nước 10 000 N/m³) là:',o:['3 333 N/m³','6 667 N/m³','10 000 N/m³','1 000 N/m³'],a:1,
 e:'Phần chìm là 2/3 nên d_gỗ = (2/3)·10 000 ≈ 6 667 N/m³.'},

/* T3 */
{t:3,type:'num',q:'Lực 50 N kéo vật đi 10 m, phương của lực hợp với phương chuyển động góc 60°. Công của lực (J)?',a:250,tol:0.5,unit:'J',
 e:'A = F·s·cos60° = 50 × 10 × 0,5 = 250 J.'},
{t:3,type:'tf',q:'Máy cơ đơn giản cho ta lợi về công khi bỏ qua ma sát.',a:false,
 e:'Không máy cơ nào cho lợi về công. Lợi về lực thì thiệt về đường đi, công giữ nguyên.'},
{t:3,type:'multi',q:'Lực nào không sinh công trong các trường hợp sau?',o:['Trọng lực khi vật chuyển động ngang','Lực hướng tâm khi vật chuyển động tròn đều','Lực kéo cùng chiều chuyển động','Áp lực của vật lên mặt sàn khi vật trượt trên sàn'],a:[0,1,3],
 e:'Công bằng 0 khi lực vuông góc với độ dời. Lực kéo cùng chiều thì sinh công dương.'},
{t:3,type:'num',q:'Công của lực đàn hồi khi lò xo k = 200 N/m giãn từ 0 đến 5 cm (J)?',a:0.25,tol:0.005,unit:'J',
 e:'A = ½kx² = ½ × 200 × 0,05² = 0,25 J.'},
{t:3,type:'mcq',q:'Vật rơi tự do từ độ cao h (bỏ qua sức cản). Khi chạm đất, động năng của vật:',o:['Bằng một nửa thế năng ban đầu','Bằng thế năng ban đầu','Lớn hơn thế năng ban đầu','Bằng 0'],a:1,
 e:'Bảo toàn cơ năng: toàn bộ mgh chuyển thành động năng khi chạm đất.'},
{t:3,type:'num',q:'Một lực kéo 200 N làm vật chuyển động đều với vận tốc 5 m/s. Công suất của lực kéo (W)?',a:1000,tol:1,unit:'W',
 e:'P = F·v = 200 × 5 = 1 000 W.'},

/* T4 */
{t:4,type:'num',q:'Vật cách thấu kính hội tụ f = 10 cm một khoảng d = 15 cm. Ảnh cách kính bao nhiêu cm?',a:30,tol:0.2,unit:'cm',
 e:'1/d′ = 1/f − 1/d = 1/10 − 1/15 = 1/30 ⇒ d′ = 30 cm.'},
{t:4,type:'tf',q:'Ảnh của một vật qua thấu kính phân kì luôn nhỏ hơn vật.',a:true,
 e:'Phân kì luôn cho ảnh ảo, cùng chiều, nhỏ hơn vật và nằm trong khoảng tiêu cự.'},
{t:4,type:'multi',q:'Điều kiện để có phản xạ toàn phần:',o:['Ánh sáng đi từ môi trường chiết quang hơn sang kém hơn','Góc tới lớn hơn góc giới hạn','Góc tới nhỏ hơn góc giới hạn','Ánh sáng chiếu vuông góc với mặt phân cách'],a:[0,1],
 e:'Đủ hai điều kiện: môi trường chiết quang hơn → kém hơn và i > i_gh.'},
{t:4,type:'num',q:'Máy ảnh có tiêu cự 5 cm chụp vật cách 200 cm. Ảnh cách vật kính bao nhiêu cm (làm tròn 2 chữ số)?',a:5.13,tol:0.05,unit:'cm',
 e:'d′ = df/(d−f) = 200×5/195 ≈ 5,13 cm — xấp xỉ tiêu cự vì vật ở rất xa.'},
{t:4,type:'mcq',q:'Vật đặt trong tiêu cự của thấu kính hội tụ cho ảnh ảo. Ảnh đó nằm:',o:['Cùng phía vật, xa kính hơn vật','Cùng phía vật, gần kính hơn vật','Khác phía vật','Ngay tại tiêu điểm'],a:0,
 e:'|d′| = df/(f−d) > d khi d < f, nên ảnh ảo cùng phía và xa hơn vật.'},

/* T5 */
{t:5,type:'num',q:'Bóng đèn 220 V – 100 W sáng bình thường. Cường độ dòng điện qua đèn (A, làm tròn 2 chữ số)?',a:0.45,tol:0.02,unit:'A',
 e:'I = P/U = 100/220 ≈ 0,45 A.'},
{t:5,type:'multi',q:'Điện trở của một dây dẫn phụ thuộc vào:',o:['Chiều dài dây','Tiết diện dây','Vật liệu làm dây','Hiệu điện thế đặt vào dây'],a:[0,1,2],
 e:'R = ρl/S. Hiệu điện thế chỉ quyết định dòng điện, không làm đổi điện trở (bỏ qua ảnh hưởng nhiệt độ).'},
{t:5,type:'num',q:'Ba điện trở 2 Ω mắc song song. Điện trở tương đương (Ω, làm tròn 2 chữ số)?',a:0.67,tol:0.02,unit:'Ω',
 e:'1/R = 3/2 ⇒ R = 2/3 ≈ 0,67 Ω, nhỏ hơn mỗi điện trở thành phần.'},
{t:5,type:'mcq',q:'Hai bóng 110 V – 60 W và 110 V – 40 W mắc nối tiếp vào 220 V. Hiện tượng:',o:['Bóng 60 W sáng hơn','Bóng 40 W sáng hơn và dễ hỏng','Hai bóng sáng như nhau','Cả hai không sáng'],a:1,
 e:'Bóng 40 W có R lớn hơn (302 Ω so với 202 Ω) nên cùng dòng điện thì toả nhiều hơn, đồng thời chịu U > 110 V nên dễ hỏng.'},
{t:5,type:'num',q:'Dòng điện 2 A qua điện trở 10 Ω trong 60 s. Nhiệt lượng toả ra (J)?',a:2400,tol:1,unit:'J',
 e:'Q = I²Rt = 4 × 10 × 60 = 2 400 J.'},
{t:5,type:'tf',q:'Ampe kế phải mắc song song với đoạn mạch cần đo cường độ dòng điện.',a:false,
 e:'Ampe kế mắc nối tiếp; mắc song song sẽ nối tắt đoạn mạch và gây nguy hiểm.'},
{t:5,type:'num',q:'Nguồn U = 12 V, điện trở trong R₀ = 4 Ω, biến trở R_x. Công suất cực đại trên biến trở (W)?',a:9,tol:0.05,unit:'W',
 e:'P_max = U²/(4R₀) = 144/16 = 9 W, đạt khi R_x = R₀ = 4 Ω.'},

/* T6 */
{t:6,type:'tf',q:'Máy biến áp có thể dùng với dòng điện một chiều để đổi hiệu điện thế.',a:false,
 e:'Dòng một chiều cho từ thông không đổi, không sinh dòng cảm ứng ở cuộn thứ cấp.'},
{t:6,type:'num',q:'Máy biến áp n₁ = 500 vòng, n₂ = 2 500 vòng, U₁ = 220 V. Hiệu điện thế thứ cấp (V)?',a:1100,tol:1,unit:'V',
 e:'U₂ = U₁·n₂/n₁ = 220 × 5 = 1 100 V.'},
{t:6,type:'multi',q:'Cách nào làm tăng lực từ của nam châm điện?',o:['Tăng số vòng dây','Tăng cường độ dòng điện','Dùng lõi sắt non','Giảm cường độ dòng điện'],a:[0,1,2],
 e:'Lực từ tăng theo số vòng, cường độ dòng điện và vật liệu sắt từ của lõi.'},
{t:6,type:'mcq',q:'Tăng hiệu điện thế truyền tải lên 20 lần thì công suất hao phí giảm:',o:['20 lần','40 lần','200 lần','400 lần'],a:3,
 e:'P_hp tỉ lệ nghịch với U², giảm 20² = 400 lần.'},
{t:6,type:'tf',q:'Dòng điện xoay chiều ở Việt Nam có tần số 50 Hz, tức đổi chiều 50 lần mỗi giây.',a:false,
 e:'Tần số 50 Hz nghĩa là 50 chu kỳ mỗi giây, mỗi chu kỳ đổi chiều 2 lần ⇒ đổi chiều 100 lần/s.'},

/* T7 */
{t:7,type:'num',q:'Nhiệt lượng cần để làm nóng chảy hoàn toàn 0,5 kg nước đá ở 0 °C (λ = 3,4.10⁵ J/kg) là bao nhiêu J?',a:170000,tol:100,unit:'J',
 e:'Q = λm = 3,4.10⁵ × 0,5 = 1,7.10⁵ J.'},
{t:7,type:'num',q:'Đốt 2 kg dầu có năng suất toả nhiệt 44.10⁶ J/kg. Nhiệt lượng toả ra (J, dạng 10⁶)?',a:88000000,tol:1000,unit:'J',
 e:'Q = q·m = 44.10⁶ × 2 = 88.10⁶ J.'},
{t:7,type:'tf',q:'Trong suốt thời gian nước đá tan, nhiệt độ của hỗn hợp tăng dần.',a:false,
 e:'Nhiệt nhận vào dùng để phá liên kết tinh thể nên nhiệt độ giữ nguyên ở 0 °C.'},
{t:7,type:'num',q:'Trộn 0,5 kg nước 100 °C với 1 kg nước 20 °C (bỏ qua hao phí). Nhiệt độ cuối (°C, làm tròn 1 chữ số)?',a:46.7,tol:0.3,unit:'°C',
 e:'mcΔt toả = mcΔt thu: 0,5(100 − t) = 1(t − 20) ⇒ 50 − 0,5t = t − 20 ⇒ t = 70/1,5 ≈ 46,7 °C.'},
{t:7,type:'multi',q:'Các cách truyền nhiệt đã học gồm:',o:['Dẫn nhiệt','Đối lưu','Bức xạ nhiệt','Chuyển hoá hoá học'],a:[0,1,2],
 e:'Ba cách truyền nhiệt: dẫn nhiệt, đối lưu, bức xạ nhiệt.'},

/* T8 */
{t:8,type:'num',q:'Người đứng cách gương phẳng 0,8 m. Ảnh cách người bao nhiêu mét?',a:1.6,tol:0.02,unit:'m',
 e:'Ảnh cách gương 0,8 m về phía sau nên cách người 1,6 m.'},
{t:8,type:'tf',q:'Muốn nhìn thấy toàn thân trong gương phẳng, gương phải cao bằng người.',a:false,
 e:'Chỉ cần gương cao bằng nửa chiều cao người (và đặt đúng vị trí), vì tia tới và tia phản xạ đối xứng.'},
{t:8,type:'num',q:'Kính lúp có số bội giác 8×. Tiêu cự của kính (cm)?',a:3.125,tol:0.02,unit:'cm',
 e:'G = 25/f ⇒ f = 25/8 = 3,125 cm.'},
{t:8,type:'mcq',q:'Mắt cận thị được sửa bằng:',o:['Thấu kính hội tụ','Thấu kính phân kì','Gương cầu lõm','Lăng kính'],a:1,
 e:'Mắt cận hội tụ ảnh trước võng mạc nên cần phân kì để đẩy ảnh ra sau, f = −OC_v.'},
{t:8,type:'num',q:'Hai gương phẳng hợp góc 60°. Số ảnh của một điểm sáng quan sát được?',a:5,tol:0.01,unit:'ảnh',
 e:'360°/60° = 6 là số nguyên chẵn nên n = 6 − 1 = 5 ảnh.'},

/* T9 */
{t:9,type:'tf',q:'Vật màu đỏ đặt dưới ánh sáng xanh lam sẽ vẫn hiện màu đỏ.',a:false,
 e:'Vật đỏ hấp thụ ánh sáng xanh lam nên gần như không tán xạ ánh sáng nào tới mắt — ta thấy vật màu đen.'},
{t:9,type:'multi',q:'Ánh sáng có những tác dụng nào sau đây?',o:['Tác dụng nhiệt','Tác dụng sinh học','Tác dụng quang điện','Tác dụng từ'],a:[0,1,2],
 e:'Ba tác dụng đã học: nhiệt, sinh học, quang điện. Ánh sáng không gây tác dụng từ.'},
{t:9,type:'mcq',q:'Cầu vồng xuất hiện sau mưa là do:',o:['Phản xạ toàn phần trong giọt nước','Tán sắc và phản xạ ánh sáng trong giọt nước','Nhiễu xạ qua mây','Ánh sáng bị hấp thụ'],a:1,
 e:'Ánh sáng Mặt Trời khúc xạ vào giọt nước, tán sắc và phản xạ bên trong rồi ló ra thành dải màu.'},
{t:9,type:'tf',q:'Ánh sáng trắng là ánh sáng đơn sắc.',a:false,
 e:'Ánh sáng trắng là hỗn hợp nhiều ánh sáng đơn sắc; qua lăng kính bị tách thành dải màu.'},

/* T10 */
{t:10,type:'num',q:'Thiết bị nhận 2 000 J, sinh công có ích 800 J. Hiệu suất (%)?',a:40,tol:0.5,unit:'%',
 e:'H = 800/2 000 = 40%.'},
{t:10,type:'tf',q:'Khi có ma sát, một phần năng lượng bị mất đi hoàn toàn.',a:false,
 e:'Năng lượng không mất đi mà chuyển thành nhiệt, âm thanh… vẫn tồn tại nhưng không dùng được.'},
{t:10,type:'multi',q:'Với ô tô chạy xăng, năng lượng hao phí xuất hiện dưới dạng:',o:['Nhiệt qua ống xả và két nước','Ma sát trong động cơ','Âm thanh','Năng lượng biến mất khỏi vũ trụ'],a:[0,1,2],
 e:'Hao phí vẫn là năng lượng, chỉ chuyển thành dạng không có ích.'},
{t:10,type:'mcq',q:'Thiết bị nào biến điện năng thành cơ năng?',o:['Máy phát điện','Động cơ điện','Máy biến áp','Ắc quy'],a:1,
 e:'Động cơ điện nhận điện năng và sinh cơ năng; máy phát làm ngược lại.'},

/* T11 */
{t:11,type:'num',q:'Silbermann: L = 100 cm, khoảng cách hai vị trí thấu kính l = 60 cm. Tiêu cự (cm)?',a:16,tol:0.2,unit:'cm',
 e:'f = (L² − l²)/(4L) = (10 000 − 3 600)/400 = 16 cm.'},
{t:11,type:'tf',q:'Có thể đo tiêu cự bằng cách đo trực tiếp khoảng cách từ quang tâm O đến tiêu điểm F.',a:false,
 e:'Không xác định được chính xác O và F bên trong thấu kính; phải dùng phương pháp gián tiếp như Silbermann.'},
{t:11,type:'multi',q:'Thí nghiệm đo tiêu cự thấu kính hội tụ cần những dụng cụ nào?',o:['Băng quang học có chia độ','Thấu kính hội tụ','Vật sáng và màn chắn','Ampe kế'],a:[0,1,2],
 e:'Ampe kế thuộc bài điện, không dùng trong thí nghiệm quang.'},
{t:11,type:'num',q:'Đo được 5,0 cm với sai số tuyệt đối 0,1 cm. Sai số tương đối (%)?',a:2,tol:0.05,unit:'%',
 e:'δ = ΔA/A = 0,1/5,0 = 0,02 = 2%.'},

/* T12 */
{t:12,type:'mcq',q:'Thời gian hợp lý để đọc và định hướng đề trước khi làm bài là:',o:['1–2 phút','5–10 phút','20 phút','30 phút'],a:1,
 e:'5–10 phút đủ để nhận dạng câu và chọn thứ tự làm, không nên quá lâu.'},
{t:12,type:'tf',q:'Nên làm ngay câu khó nhất để "ăn điểm cao" trước.',a:false,
 e:'Nên làm câu chắc điểm trước để giữ nhịp và thời gian; câu khó làm sau.'},
{t:12,type:'multi',q:'Những lỗi thường mất điểm trong bài Vật lí:',o:['Thiếu đơn vị ở kết quả','Sai dấu của d′ (ảnh ảo)','Không có kết luận','Viết đúng công thức'],a:[0,1,2],
 e:'Ba lỗi đầu đều mất điểm; viết đúng công thức là điều nên làm.'}
];

/* ---------- 3. BÀI GIẢI MẪU ---------- */
window.SOLVE=[
{t:3,title:'Công của lực biến thiên khi kéo vật ra khỏi nước',
 problem:'Một khối lập phương cạnh 20 cm, trọng lượng riêng 8 000 N/m³, đang chìm hoàn toàn trong nước (d = 10 000 N/m³). Kéo vật lên đều cho đến khi vừa ra khỏi mặt nước. Tính công của lực kéo, bỏ qua ma sát.',
 steps:['Vật chìm hoàn toàn, lực kéo cân bằng: F₁ = P − F_A = d_v·V − d_n·V = (8 000 − 10 000)·0,008 = −16 N. Dấu âm cho thấy vật tự nổi, phải giữ lại.','Khi vật vừa ra khỏi mặt nước: F₂ = P = 8 000 × 0,008 = 64 N.','Lực kéo biến thiên bậc nhất theo quãng đường, quãng đường kéo bằng cạnh vật s = 0,2 m.','Công bằng diện tích hình thang: A = ½(F₁ + F₂)s = ½(−16 + 64)×0,2 = 4,8 J.'],
 answer:'A = 4,8 J'}

,{t:3,title:'Bảo toàn cơ năng có ma sát trên mặt phẳng nghiêng',
 problem:'Vật 2 kg trượt không vận tốc đầu từ đỉnh mặt phẳng nghiêng cao 1,2 m, dài 3 m, hệ số ma sát 0,2. Tính vận tốc ở chân dốc. Lấy g = 10 m/s².',
 steps:['Cơ năng đầu: W₁ = mgh = 2×10×1,2 = 24 J (chọn mốc thế năng ở chân dốc).','Công của ma sát: A_ms = −F_ms·l = −μ·mg·cos α·l, với cos α = √(l² − h²)/l = √(9 − 1,44)/3 ≈ 0,919.','A_ms = −0,2×2×10×0,919×3 ≈ −11,0 J.','Định luật biến thiên cơ năng: W₂ − W₁ = A_ms ⇒ ½mv² = 24 − 11 = 13 J.','v = √(2×13/2) ≈ 3,6 m/s.'],
 answer:'v ≈ 3,6 m/s'}

,{t:4,title:'Hệ hai thấu kính hội tụ đồng trục',
 problem:'Hai thấu kính hội tụ f₁ = 20 cm, f₂ = 10 cm đặt cách nhau a = 50 cm. Vật AB cao 2 cm đặt trước L₁ cách 30 cm. Xác định vị trí, tính chất, độ cao ảnh cuối.',
 steps:['Với L₁: 1/d₁′ = 1/20 − 1/30 = 1/60 ⇒ d₁′ = 60 cm. Ảnh A₁B₁ là ảnh thật, ngược chiều, cách L₁ 60 cm.','Khoảng cách tới L₂: d₂ = a − d₁′ = 50 − 60 = −10 cm ⇒ vật ảo với L₂.','Với L₂: 1/d₂′ = 1/10 − 1/(−10) = 1/10 + 1/10 = 1/5 ⇒ d₂′ = 5 cm.','Ảnh cuối là ảnh thật, cách L₂ 5 cm về phía sau.','Độ phóng đại: k = (d₁′/d₁)·(d₂′/d₂) = (60/30)·(5/−10) = −1. Ảnh cao 2 cm, ngược chiều vật.'],
 answer:'Ảnh thật, cách L₂ 5 cm, cao 2 cm, ngược chiều'}

,{t:4,title:'Dịch vật lại gần thấu kính — ảnh dịch bao nhiêu?',
 problem:'Vật cách thấu kính hội tụ f = 12 cm một khoảng 36 cm. Dịch vật lại gần 12 cm. Hỏi ảnh dịch chuyển bao nhiêu và độ phóng đại thay đổi thế nào?',
 steps:['Trước: 1/d′ = 1/12 − 1/36 = 2/36 ⇒ d₁′ = 18 cm; k₁ = 18/36 = 0,5.','Sau khi dịch: d = 24 cm ⇒ 1/d′ = 1/12 − 1/24 = 1/24 ⇒ d₂′ = 24 cm; k₂ = 1.','Ảnh dịch ra xa thấu kính: 24 − 18 = 6 cm.','Độ phóng đại tăng từ 0,5 lên 1 (ảnh lớn gấp đôi so với trước).'],
 answer:'Ảnh dịch xa thêm 6 cm, độ phóng đại tăng gấp đôi'}

,{t:5,title:'Mạch cầu cân bằng và cách bỏ nhánh giữa',
 problem:'Mạch cầu gồm R₁ = 6 Ω, R₂ = 3 Ω ở nhánh trên; R₃ = 4 Ω, R₄ = 2 Ω ở nhánh dưới; điện trở R₅ = 10 Ω nối giữa hai điểm giữa. Tính điện trở tương đương.',
 steps:['Kiểm tra điều kiện cân bằng: R₁·R₄ = 6×2 = 12 và R₂·R₃ = 3×4 = 12 ⇒ cân bằng.','Cầu cân bằng nên không có dòng qua R₅, có thể bỏ R₅ khỏi mạch.','Mạch còn (R₁ nt R₂) // (R₃ nt R₄): nhánh trên 9 Ω, nhánh dưới 6 Ω.','R = (9×6)/(9+6) = 54/15 = 3,6 Ω.'],
 answer:'R = 3,6 Ω'}

,{t:5,title:'Cực trị công suất trên biến trở',
 problem:'Nguồn U = 18 V, điện trở trong R₀ = 6 Ω mắc với biến trở R_x. Tìm R_x để công suất trên biến trở lớn nhất và tính giá trị đó.',
 steps:['Dòng điện: I = U/(R₀ + R_x).','Công suất trên biến trở: P = I²R_x = U²R_x/(R₀+R_x)².','Áp dụng Cauchy: (R₀+R_x)² ≥ 4R₀R_x ⇒ P ≤ U²/(4R₀).','Dấu bằng khi R_x = R₀ = 6 Ω.','P_max = 18²/(4×6) = 324/24 = 13,5 W.'],
 answer:'R_x = 6 Ω, P_max = 13,5 W'}

,{t:5,title:'Bếp điện — hiệu suất và tiền điện',
 problem:'Bếp ghi 220 V – 1 000 W dùng đúng hiệu điện thế định mức để đun 2 lít nước từ 25 °C đến sôi. Hiệu suất 80%. Tính thời gian đun và điện năng tiêu thụ.',
 steps:['Nhiệt lượng có ích: Q = mcΔt = 2×4200×75 = 630 000 J.','Hiệu suất 80% ⇒ điện năng toàn phần A = Q/0,8 = 787 500 J.','Thời gian: t = A/P = 787 500/1 000 = 787,5 s ≈ 13,1 phút.','Điện năng theo kWh: 787 500/3,6.10⁶ ≈ 0,22 kWh.'],
 answer:'t ≈ 13,1 phút, A ≈ 0,22 kWh'}

,{t:7,title:'Cân bằng nhiệt có nước đá — biện luận trạng thái cuối',
 problem:'Thả 200 g nước đá ở 0 °C vào 1 kg nước ở 30 °C. Nước đá có tan hết không? Tính nhiệt độ cuối. Cho λ = 3,4.10⁵ J/kg, c = 4200 J/kg.K.',
 steps:['Nhiệt cần làm tan hết đá: Q₁ = λm = 3,4.10⁵ × 0,2 = 68 000 J.','Nhiệt nước toả khi hạ xuống 0 °C: Q₂ = mcΔt = 1×4200×30 = 126 000 J.','Q₂ > Q₁ nên đá tan hết, còn dư 58 000 J để làm ấm toàn bộ 1,2 kg nước.','Δt = Q_dư/(mc) = 58 000/(1,2×4200) ≈ 11,5 °C.'],
 answer:'Đá tan hết, nhiệt độ cuối ≈ 11,5 °C'}

,{t:7,title:'Hiệu suất bếp dầu đun nước',
 problem:'Đun 3 kg nước từ 20 °C đến 100 °C bằng bếp dầu, tiêu thụ 60 g dầu (q = 44.10⁶ J/kg). Tính hiệu suất bếp.',
 steps:['Q có ích: mcΔt = 3×4200×80 = 1 008 000 J.','Q toàn phần: q·m = 44.10⁶ × 0,06 = 2 640 000 J.','H = 1 008 000/2 640 000 ≈ 0,382.'],
 answer:'H ≈ 38%'}

,{t:11,title:'Xử lý số liệu đo tiêu cự bằng Silbermann',
 problem:'Bố trí vật – màn cách nhau L = 90 cm. Dịch thấu kính thấy hai vị trí cho ảnh rõ, cách nhau l = 30 cm. Tính tiêu cự và sai số nếu ΔL = Δl = 1 cm.',
 steps:['f = (L² − l²)/(4L) = (8 100 − 900)/360 = 20 cm.','Sai số tương đối: δf ≈ 2LΔL/(L²−l²) + 2lΔl/(L²−l²) + ΔL/L.','Thay số: 2×90/(7 200) + 2×30/(7 200) + 1/90 ≈ 0,025 + 0,0083 + 0,011 ≈ 4,4%.','Δf ≈ 0,044 × 20 ≈ 0,9 cm.'],
 answer:'f = 20 ± 0,9 cm'}

,{t:6,title:'Truyền tải điện năng — chọn hiệu điện thế',
 problem:'Cần truyền công suất 500 kW đi xa 20 km, dây có điện trở tổng 4 Ω. Hao phí cho phép không quá 2% công suất. Tìm hiệu điện thế tối thiểu.',
 steps:['Hao phí cho phép: P_hp = 2% × 500 000 = 10 000 W.','Công thức: P_hp = P²R/U² ⇒ U² = P²R/P_hp.','U² = (5.10⁵)² × 4/10⁴ = 10¹¹ × 4/10⁴ = 4.10⁷.','U = 6,32.10³ V ≈ 6,3 kV.'],
 answer:'U ≥ 6,3 kV'}

,{t:6,title:'Máy biến áp hai cấp',
 problem:'Máy tăng thế n₁ = 500 vòng, n₂ = 5 000 vòng nhận U₁ = 220 V. Cuộn thứ cấp nối vào đường dây. Tính U₂ và cường độ nếu công suất truyền đi 22 kW (bỏ qua hao phí máy).',
 steps:['U₂ = U₁·n₂/n₁ = 220 × 10 = 2 200 V.','Bỏ qua hao phí: P₁ = P₂ = 22 000 W.','I₂ = P₂/U₂ = 22 000/2 200 = 10 A.','I₁ = P₁/U₁ = 22 000/220 = 100 A — dòng sơ cấp lớn hơn 10 lần, đúng với máy tăng thế.'],
 answer:'U₂ = 2 200 V, I₂ = 10 A, I₁ = 100 A'}

,{t:1,title:'Hai vật chuyển động cùng chiều — bài toán đuổi kịp',
 problem:'Xe đạp khởi hành lúc 6h với v = 15 km/h. Xe máy khởi hành lúc 6h30 với v = 45 km/h cùng tuyến. Hỏi xe máy đuổi kịp lúc mấy giờ, cách điểm xuất phát bao xa?',
 steps:['Trong 30 phút đầu xe đạp đi được: 15 × 0,5 = 7,5 km.','Hiệu vận tốc: 45 − 15 = 30 km/h.','Thời gian đuổi: t = 7,5/30 = 0,25 h = 15 phút.','Thời điểm gặp: 6h30 + 15 phút = 6h45.','Quãng đường từ điểm xuất phát: 45 × 0,25 = 11,25 km.'],
 answer:'6h45, cách điểm xuất phát 11,25 km'}

,{t:2,title:'Vật nổi — tìm phần chìm và lực kéo',
 problem:'Khối gỗ thể tích 500 cm³, trọng lượng riêng 6 000 N/m³ nổi trong nước (10 000 N/m³). Tính thể tích phần chìm và lực cần ấn để vật chìm hoàn toàn.',
 steps:['Khi nổi: d_gỗ·V = d_nước·V_chìm ⇒ V_chìm = (6 000/10 000)×500 = 300 cm³.','Phần nổi: 200 cm³.','Khi ấn chìm hoàn toàn, lực đẩy tăng thêm: ΔF_A = d_nước·V_nổi = 10 000 × 200.10⁻⁶ = 2 N.','Vậy cần ấn với lực ít nhất 2 N.'],
 answer:'V_chìm = 300 cm³, lực ấn 2 N'}

,{t:9,title:'Màu sắc vật dưới ánh sáng màu',
 problem:'Một vật có khả năng tán xạ mạnh ánh sáng đỏ và xanh lam. Dưới ánh sáng trắng vật có màu gì? Dưới ánh sáng lục thì sao?',
 steps:['Dưới ánh sáng trắng (đủ mọi màu): vật tán xạ đỏ và lam, các màu khác bị hấp thụ ⇒ mắt nhận tổng hợp đỏ + lam = hồng tím.','Dưới ánh sáng lục: vật không tán xạ lục, hấp thụ hết ⇒ không có ánh sáng nào tới mắt.','Kết luận: vật trông gần như đen dưới ánh sáng lục.'],
 answer:'Trắng: hồng tím; dưới ánh sáng lục: đen'}

,{t:10,title:'Chuỗi chuyển hoá năng lượng của đèn pin',
 problem:'Mô tả và tính hiệu suất của đèn pin: pin 3 V – 0,3 A cung cấp trong 2 giờ; bóng LED phát ra 540 J ánh sáng.',
 steps:['Điện năng tiêu thụ: A = UIt = 3×0,3×7 200 = 6 480 J.','Năng lượng ánh sáng có ích: 540 J.','Hiệu suất phát sáng: H = 540/6 480 ≈ 8,3%.','Phần còn lại chuyển thành nhiệt ở pin và mạch. Chuỗi: hoá năng → điện năng → quang năng + nhiệt năng.'],
 answer:'H ≈ 8,3%; hoá → điện → quang + nhiệt'}
];

/* gộp vào ngân hàng chung */
QA.push(...window.QA_EXTRA);
QUIZ.push(...window.QUIZ_EXTRA);
