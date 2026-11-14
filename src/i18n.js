/* =========================================================
   i18n — VIETNAMESE + ENGLISH, ONE BUILD
   ---------------------------------------------------------
   The site ships as a single self-contained HTML file, so both
   languages live in the same build. That is a deliberate choice:
   216 KB is one file either way, and a student switching to English
   should not pay for a second download.

   Rules of engagement:
     · Vietnamese is the source language and the default.
     · Keys are stable snake_case ids, never English prose — so the
       Vietnamese text can be rewritten without touching call sites.
     · t() falls back vi → en → key. A missing key shows its own id,
       which is how a bug becomes visible instead of silent.
     · The <html lang> attribute follows the choice; screen readers
       need it, and so does hyphenation.

   Content that is genuinely subject matter (physics explanations,
   question banks) is NOT translated here — it lives in content
   files. This table is the interface: chrome, buttons, headings,
   empty states, confirmations.
   ========================================================= */

const I18N = {
  /* ---------- chrome ---------- */
  brand_sub: { vi: 'HSG KHTN 1 · Chuyên Lý', en: 'Physics · Grade 9' },
  nav_study: { vi: 'Học hôm nay', en: 'Today' },
  nav_cards: { vi: 'Thẻ ghi nhớ', en: 'Flashcards' },
  nav_practice: { vi: 'Luyện đề tự tạo', en: 'Practice' },
  nav_plan: { vi: 'Kế hoạch học', en: 'Study plan' },
  nav_weekly: { vi: 'Kế hoạch tuần', en: 'Week plan' },
  nav_grades: { vi: 'Sổ điểm', en: 'Grade book' },
  nav_focus: { vi: 'Đồng hồ tập trung', en: 'Focus timer' },
  nav_timetable: { vi: 'Thời khoá biểu', en: 'Timetable' },
  nav_calendar: { vi: 'Lịch học', en: 'Calendar' },
  nav_subjects: { vi: 'Khoá học lớp 1–12', en: 'Courses 1–12' },
  nav_studio: { vi: 'Tạo bài học', en: 'Create a lesson' },
  nav_mine: { vi: 'Bài của tôi', en: 'My lessons' },
  nav_files: { vi: 'Kho tệp', en: 'Files' },
  nav_build: { vi: 'Bảng mạch', en: 'Circuit board' },
  nav_builder: { vi: 'Mạch lồng nhau', en: 'Nested circuits' },
  nav_lab: { vi: 'Phòng thí nghiệm', en: 'Lab' },
  nav_solve: { vi: 'Bài giải mẫu', en: 'Worked examples' },
  nav_library: { vi: 'Thư viện bài giảng', en: 'Video library' },
  nav_notes: { vi: 'Sổ tay công thức', en: 'Formula sheet' },
  nav_papers: { vi: 'Đề thi', en: 'Exam papers' },
  nav_qa: { vi: 'Hỏi đáp', en: 'Q&A' },
  nav_review: { vi: 'Luyện câu sai', en: 'Retry mistakes' },
  nav_progress: { vi: 'Tiến độ tổng · báo cáo', en: 'Progress & report' },
  nav_stats: { vi: 'Tiến độ Vật lí 9', en: 'Physics 9 progress' },
  nav_settings: { vi: 'Tuỳ biến giao diện', en: 'Appearance' },
  nav_about: { vi: 'Giới thiệu', en: 'About' },
  nav_game: { vi: 'Đấu trường Pixel', en: 'Pixel Arena' },
  nav_special: { vi: 'Góc Vật lí', en: 'Physics Lab' },
  nav_physics: { vi: 'Vật lí', en: 'Physics' },
  nav_share: { vi: 'Khoe tiến độ', en: 'Share progress' },
  lesson_share: { vi: 'Chia sẻ bài này', en: 'Share this lesson' },

  more: { vi: 'Khám phá', en: 'Explore' },
  search_ph: { vi: 'Tìm bài, công thức, câu hỏi', en: 'Search lessons, formulas, questions' },
  scope_change: { vi: 'Đổi lớp và môn', en: 'Change grade and subject' },
  btn_calc: { vi: 'Máy giải', en: 'Solver' },
  btn_sim: { vi: 'Thí nghiệm', en: 'Simulate' },
  btn_exam: { vi: 'Thi thử', en: 'Mock exam' },

  /* ---------- rail ---------- */
  rail_today_sub: { vi: 'việc cần làm · chuỗi ngày', en: 'what to do · streak' },
  rail_plan: { vi: 'Kế hoạch', en: 'Plan' },
  rail_week: { vi: 'Tuần này', en: 'This week' },
  rail_focus: { vi: 'Tập trung', en: 'Focus' },
  rail_week_short: { vi: 'Thời khoá biểu', en: 'Timetable' },
  rail_cal: { vi: 'Lịch', en: 'Calendar' },
  rail_progress: { vi: 'Tiến độ', en: 'Progress' },
  rail_courses: { vi: 'Khoá học 1–12', en: 'Courses 1–12' },

  /* ---------- common actions ---------- */
  ok: { vi: 'Đồng ý', en: 'OK' },
  cancel: { vi: 'Huỷ', en: 'Cancel' },
  close: { vi: 'Đóng', en: 'Close' },
  save: { vi: 'Lưu', en: 'Save' },
  saved: { vi: 'Đã lưu', en: 'Saved' },
  delete: { vi: 'Xoá', en: 'Delete' },
  add: { vi: 'Thêm', en: 'Add' },
  next: { vi: 'Tiếp', en: 'Next' },
  back: { vi: 'Quay lại', en: 'Back' },
  done: { vi: 'Xong', en: 'Done' },
  start: { vi: 'Bắt đầu', en: 'Start' },
  retry: { vi: 'Làm lại', en: 'Retry' },
  reset: { vi: 'Đặt lại', en: 'Reset' },
  loading: { vi: 'Đang tải…', en: 'Loading…' },
  empty: { vi: 'Chưa có gì ở đây', en: 'Nothing here yet' },
  optional: { vi: 'không bắt buộc', en: 'optional' },
  today: { vi: 'Hôm nay', en: 'Today' },
  yesterday: { vi: 'Hôm qua', en: 'Yesterday' },
  minutes: { vi: 'phút', en: 'min' },
  days: { vi: 'ngày', en: 'days' },
  points: { vi: 'điểm', en: 'pts' },
  level: { vi: 'Cấp', en: 'Level' },
  streak: { vi: 'Chuỗi', en: 'Streak' },
  correct: { vi: 'đúng', en: 'correct' },
  wrong: { vi: 'sai', en: 'wrong' },
  score: { vi: 'Điểm', en: 'Score' },
  best: { vi: 'Kỷ lục', en: 'Best' },
  new_record: { vi: 'Kỷ lục mới!', en: 'New record!' },

  /* ---------- language ---------- */
  lang_label: { vi: 'Ngôn ngữ', en: 'Language' },
  lang_vi: { vi: 'Tiếng Việt', en: 'Vietnamese' },
  lang_en: { vi: 'English', en: 'English' },
  lang_note: {
    vi: 'Đổi ngôn ngữ giao diện. Nội dung bài học Vật lí giữ tiếng Việt để khớp đề thi.',
    en: 'Changes the interface language. Physics lesson content stays in Vietnamese to match the exam.',
  },

  /* ---------- game ---------- */
  game_title: { vi: 'Đấu trường Pixel', en: 'Pixel Arena' },
  game_sub: {
    vi: 'Trả lời đúng để gây sát thương. Sai thì bị đánh trả — và ôn lại ngay.',
    en: 'Answer right to deal damage. Answer wrong and you take the hit — then review it.',
  },
  game_start: { vi: 'Vào trận', en: 'Enter battle' },
  game_hp: { vi: 'Máu', en: 'HP' },
  game_coin: { vi: 'Xu', en: 'Coins' },
  game_combo: { vi: 'Liên hoàn', en: 'Combo' },
  game_topic_phys: { vi: 'Vật lí', en: 'Physics' },
  game_topic_math: { vi: 'Toán', en: 'Maths' },
  game_topic_eng: { vi: 'Ngữ pháp tiếng Anh', en: 'English grammar' },
  game_topic_chem: { vi: 'Hoá học', en: 'Chemistry' },
  game_over: { vi: 'Hết máu rồi', en: 'You ran out of HP' },
  game_win: { vi: 'Thắng rồi!', en: 'You win!' },
  game_again: { vi: 'Đánh lại', en: 'Fight again' },

  /* ---------- special / physics ---------- */
  special_title: { vi: 'Góc Vật lí', en: 'Physics Lab' },
  special_sub: {
    vi: 'Những thứ chỉ có ở đây: công thức tự đọc đề, mô phỏng, và bảng hằng số.',
    en: 'Things only this site has: formulas that read your problem, simulations, constants.',
  },

  /* ---------- grades ---------- */
  grades_title: { vi: 'Sổ điểm · THCS & THPT', en: 'Grade book · Secondary' },
  grades_target: { vi: 'Mục tiêu', en: 'Target' },
  grades_add_subject: { vi: 'Thêm môn', en: 'Add subject' },
  grades_need: { vi: 'Cần', en: 'Need' },
  grades_need_tail: { vi: 'điểm 1 tiết nữa để đạt', en: 'on the next test to reach' },

  /* ---------- weekly ---------- */
  weekly_title: { vi: 'Kế hoạch tuần', en: 'Week plan' },
  weekly_project: { vi: 'Dự án', en: 'Project' },
  weekly_task: { vi: 'Việc', en: 'Task' },
  weekly_subtask: { vi: 'Việc con', en: 'Subtask' },
  weekly_available: { vi: 'Ngày tôi có thể học', en: 'Days I can study' },
  weekly_pull: { vi: 'Kéo việc trễ về hôm nay', en: 'Pull overdue to today' },
};

/* ---------- current language ---------- */
const I18N_DEFAULT = 'vi';
function i18nLang() {
  const p = (typeof state !== 'undefined' && state && state.prefs) ? state.prefs : {};
  return p.lang === 'en' ? 'en' : (p.lang === 'vi' ? 'vi' : I18N_DEFAULT);
}

function t(key, lang) {
  const row = I18N[key];
  if (!row) return key;                     /* key tự hiện ra = bug nhìn thấy được */
  const L = lang || i18nLang();
  return row[L] != null ? row[L] : (row.vi != null ? row.vi : key);
}

/* Đặt ngôn ngữ, cập nhật <html lang>, lưu lại */
function setLang(lang) {
  const L = lang === 'en' ? 'en' : 'vi';
  if (!state.prefs) state.prefs = {};
  state.prefs.lang = L;
  try { document.documentElement.setAttribute('lang', L); } catch (e) { }
  save();
  if (typeof render === 'function') render();
  return L;
}

/* Dùng trong template cho gọn: tl('nav_study') */
const tl = key => t(key);
