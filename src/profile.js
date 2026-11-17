/* =========================================================
   HỒ SƠ HỌC SINH — danh mục môn và trạng thái lớp/môn đang chọn
   Lõi dùng chung: app.js, explore.js và bản Vật lí đều đọc từ đây.
   Tách khỏi school.js để bản Vật lí không kéo theo toàn bộ module trường học.
   ========================================================= */

const SUBJECTS = [
  { id: 'toan', name: 'Toán', short: 'TO', stages: [[1, 12]], note: 'Số học · hình học · đại số · giải tích' },
  { id: 'van', name: 'Ngữ văn', short: 'VĂ', stages: [[1, 12]], note: 'Đọc hiểu · tiếng Việt · làm văn' },
  { id: 'anh', name: 'Tiếng Anh', short: 'EN', stages: [[1, 12]], note: 'Nghe · nói · đọc · viết' },
  { id: 'vatli', name: 'Vật lí', short: 'LÍ', stages: [[6, 12]], note: 'Cơ · nhiệt · điện · quang · hạt nhân' },
  { id: 'hoa', name: 'Hoá học', short: 'HO', stages: [[8, 12]], note: 'Chất · phản ứng · dung dịch' },
  { id: 'sinh', name: 'Sinh học', short: 'SI', stages: [[6, 12]], note: 'Tế bào · cơ thể · di truyền · sinh thái' },
  { id: 'sudia', name: 'Lịch sử & Địa lí', short: 'SĐ', stages: [[6, 9]], note: 'Việt Nam · thế giới · bản đồ' },
  { id: 'su', name: 'Lịch sử', short: 'SƯ', stages: [[10, 12]], note: 'Việt Nam · thế giới · chuyên đề' },
  { id: 'dia', name: 'Địa lí', short: 'ĐI', stages: [[10, 12]], note: 'Tự nhiên · dân cư · kinh tế' },
  { id: 'gdcd', name: 'GDCD · KT&PL', short: 'GD', stages: [[6, 12]], note: 'Đạo đức · pháp luật · kinh tế' },
  { id: 'tin', name: 'Tin học', short: 'TI', stages: [[3, 12]], note: 'Máy tính · thuật toán · Python' },
  { id: 'congnghe', name: 'Công nghệ', short: 'CN', stages: [[3, 12]], note: 'Gia đình · nông nghiệp · công nghiệp' },
  { id: 'khtn', name: 'Khoa học tự nhiên', short: 'KN', stages: [[6, 9]], note: 'Vật lí · Hoá · Sinh tích hợp' },
  { id: 'tnxh', name: 'Tự nhiên & Xã hội', short: 'TX', stages: [[1, 3]], note: 'Gia đình · trường · quê hương' },
  { id: 'khoahoc', name: 'Khoa học', short: 'KH', stages: [[4, 5]], note: 'Vật chất · năng lượng · cơ thể' },
  { id: 'daoduc', name: 'Đạo đức', short: 'ĐĐ', stages: [[1, 5]], note: 'Lễ phép · trung thực · trách nhiệm' },
  { id: 'amnhac', name: 'Âm nhạc', short: 'NH', stages: [[1, 9]], note: 'Hát · nhạc lí · thưởng thức' },
  { id: 'mythuat', name: 'Mĩ thuật', short: 'MT', stages: [[1, 9]], note: 'Vẽ · tạo hình · sắp đặt' },
  { id: 'theduc', name: 'Giáo dục thể chất', short: 'TD', stages: [[1, 12]], note: 'Vận động · đội hình · sức bền' }
];

function schoolState() {
  if (!state.school || typeof state.school !== 'object' || Array.isArray(state.school)) {
    state.school = { grade: 9, subj: 'vatli', lessons: {}, soft: {} };
  }
  const S = state.school;
  if (!S.lessons || typeof S.lessons !== 'object' || Array.isArray(S.lessons)) S.lessons = {};
  if (!S.soft || typeof S.soft !== 'object' || Array.isArray(S.soft)) S.soft = {};
  if (!S.grade) S.grade = 9;
  if (!S.subj) S.subj = 'vatli';
  Object.keys(S.lessons).forEach(k => {
    if (!Array.isArray(S.lessons[k])) S.lessons[k] = [];
  });
  return S;
}
