-- ================================================================
-- Teacher Auth Helper
-- Allows teacher to log in with their username (not just email)
-- Run in Supabase Dashboard → SQL Editor → New Query
-- ================================================================

create or replace function public.get_teacher_email_by_username(p_username text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_email   text;
begin
  -- Get the teacher's user ID from profiles
  select id into v_user_id
  from public.profiles
  where username = p_username and role = 'teacher'
  limit 1;

  if v_user_id is null then
    return null;
  end if;

  -- Get their actual email from auth.users (only security definer can do this)
  select email into v_email
  from auth.users
  where id = v_user_id
  limit 1;

  return v_email;
end;
$$;

-- Grant execute to anon so unauthenticated login requests can use it
grant execute on function public.get_teacher_email_by_username(text) to anon, authenticated;
