-- Kế hoạch học của khung mới (việc, môn tự tạo, tiến độ, ghi chú): một hàng mỗi người dùng.
-- Lưu nguyên khối JSON để đồng bộ đơn giản và xoá gọn. Giới hạn 512 KB để không ai đẩy dữ liệu quá lớn.
-- Chỉ chủ tài khoản đọc/ghi được (RLS). Xoá tài khoản thì hàng này bị xoá theo (on delete cascade).

create table if not exists public.planner_states (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  state      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint planner_states_state_size check (octet_length(state::text) <= 524288),
  constraint planner_states_state_object check (jsonb_typeof(state) = 'object')
);

alter table public.planner_states enable row level security;

drop policy if exists planner_states_select_own on public.planner_states;
drop policy if exists planner_states_insert_own on public.planner_states;
drop policy if exists planner_states_update_own on public.planner_states;
drop policy if exists planner_states_delete_own on public.planner_states;

create policy planner_states_select_own on public.planner_states
  for select to authenticated using ((select auth.uid()) = user_id);
create policy planner_states_insert_own on public.planner_states
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy planner_states_update_own on public.planner_states
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy planner_states_delete_own on public.planner_states
  for delete to authenticated using ((select auth.uid()) = user_id);
