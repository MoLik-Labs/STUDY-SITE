-- Study Focus Fox — schema chuẩn hoá (thay dần user_state dạng key-value).
--
-- Nguyên tắc:
--   · Mỗi bảng có user_id và RLS: chỉ chủ tài khoản đọc/ghi được dòng của mình.
--   · updated_at do TRIGGER đặt phía máy chủ, không tin đồng hồ của trình duyệt.
--     Đồng bộ dùng updated_at làm mốc (xem src/account.js).
--   · Khoá chính kép (user_id, <khoá nghiệp vụ>) để upsert theo lô an toàn.
--   · Mọi cột văn bản có giới hạn độ dài: chặn dữ liệu rác và bơm dung lượng.
--   · Xoá tài khoản: ON DELETE CASCADE từ auth.users xoá sạch mọi bảng này.
--
-- Bảng user_state và profiles (migration trước) giữ nguyên trong giai đoạn
-- chuyển đổi; user_state sẽ bị xoá ở migration sau khi client mới đã chạy.

-- ---------------------------------------------------------------- profiles
alter table public.profiles
  add column if not exists class_name text check (char_length(class_name) <= 40);

-- ------------------------------------------------------- hàm dùng chung
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------- tiến độ bài học
create table if not exists public.lesson_progress (
  user_id    uuid     not null references auth.users (id) on delete cascade,
  lesson_id  text     not null check (char_length(lesson_id) between 1 and 80),
  done       boolean  not null default false,
  score      smallint check (score between 0 and 100),
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

-- ---------------------------------------------------------- lịch sử đáp án
create table if not exists public.answers (
  user_id       uuid     not null references auth.users (id) on delete cascade,
  question_id   text     not null check (char_length(question_id) between 1 and 80),
  attempts      integer  not null default 0 check (attempts >= 0),
  correct       integer  not null default 0 check (correct >= 0),
  last_correct  boolean,
  updated_at    timestamptz not null default now(),
  primary key (user_id, question_id),
  check (correct <= attempts)
);

-- ------------------------------------------------------------------ ghi chú
create table if not exists public.notes (
  user_id    uuid  not null references auth.users (id) on delete cascade,
  note_id    text  not null check (char_length(note_id) between 1 and 80),
  body       text  not null default '' check (char_length(body) <= 20000),
  deleted    boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, note_id)
);

-- ------------------------------------------------- thẻ ôn tập cách quãng
-- Thuật toán SM-2 rút gọn: ease 1.3–4.0, khoảng ôn tính bằng ngày.
create table if not exists public.review_cards (
  user_id       uuid    not null references auth.users (id) on delete cascade,
  card_id       text    not null check (char_length(card_id) between 1 and 80),
  ease          real    not null default 2.5 check (ease between 1.3 and 4.0),
  interval_days integer not null default 0 check (interval_days between 0 and 3650),
  reps          integer not null default 0 check (reps >= 0),
  lapses        integer not null default 0 check (lapses >= 0),
  due_at        timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  primary key (user_id, card_id)
);
create index if not exists review_cards_due_idx on public.review_cards (user_id, due_at);

-- ---------------------------------------------- bố cục trang chủ cá nhân hoá
-- widgets: mảng [{id, size, pos}] do người dùng sắp xếp. Giới hạn 40 mục.
create table if not exists public.layouts (
  user_id    uuid  primary key references auth.users (id) on delete cascade,
  widgets    jsonb not null default '[]'::jsonb
             check (jsonb_typeof(widgets) = 'array' and jsonb_array_length(widgets) <= 40),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------- triggers
drop trigger if exists lesson_progress_touch on public.lesson_progress;
create trigger lesson_progress_touch before insert or update on public.lesson_progress
  for each row execute function public.touch_updated_at();

drop trigger if exists answers_touch on public.answers;
create trigger answers_touch before insert or update on public.answers
  for each row execute function public.touch_updated_at();

drop trigger if exists notes_touch on public.notes;
create trigger notes_touch before insert or update on public.notes
  for each row execute function public.touch_updated_at();

drop trigger if exists review_cards_touch on public.review_cards;
create trigger review_cards_touch before insert or update on public.review_cards
  for each row execute function public.touch_updated_at();

drop trigger if exists layouts_touch on public.layouts;
create trigger layouts_touch before insert or update on public.layouts
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------------ RLS
alter table public.lesson_progress enable row level security;
alter table public.answers         enable row level security;
alter table public.notes           enable row level security;
alter table public.review_cards    enable row level security;
alter table public.layouts         enable row level security;

-- Bốn chính sách cho mỗi bảng, đều giới hạn authenticated và chủ sở hữu.
do $$
declare
  t text;
begin
  foreach t in array array['lesson_progress', 'answers', 'notes', 'review_cards', 'layouts'] loop
    execute format('drop policy if exists %I on public.%I', t || '_select_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_update_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete_own', t);

    execute format(
      'create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)',
      t || '_select_own', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)',
      t || '_insert_own', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      t || '_update_own', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = user_id)',
      t || '_delete_own', t);
  end loop;
end
$$;

-- Quyền: anon không có quyền gì trên các bảng này.
revoke all on public.lesson_progress, public.answers, public.notes,
              public.review_cards, public.layouts from anon;
grant select, insert, update, delete on public.lesson_progress, public.answers,
      public.notes, public.review_cards, public.layouts to authenticated;
