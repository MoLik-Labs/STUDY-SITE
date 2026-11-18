-- Hàm xoá tài khoản do người dùng tự gọi (RPC /rest/v1/rpc/delete_my_account).
-- Xoá auth.users; mọi bảng dữ liệu có "on delete cascade" tới auth.users sẽ tự xoá theo.
-- Nội dung này khớp với hàm đang chạy trên project; file tồn tại để repo là nguồn sự thật.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
