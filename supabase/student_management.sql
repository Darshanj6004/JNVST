-- ================================================================
-- Student Management RPCs
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- ================================================================

-- 1. CREATE STUDENT
create or replace function public.create_student(
  p_full_name  text,
  p_username   text,
  p_roll_number text,
  p_class_name text,
  p_password   text,
  p_avatar_color text default '#2563EB'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_user_id uuid := gen_random_uuid();
  student_email text := lower(trim(p_username)) || '@navodayaprep.edu';
begin
  if public.my_role() != 'teacher' then
    raise exception 'Only teachers can create student accounts';
  end if;
  if exists (select 1 from auth.users where email = student_email) then
    raise exception 'Username already taken: %', p_username;
  end if;
  if exists (select 1 from public.profiles where roll_number = p_roll_number) then
    raise exception 'Roll number already in use: %', p_roll_number;
  end if;

  insert into auth.users (
    id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    new_user_id,
    'authenticated',
    'authenticated',
    student_email,
    crypt(p_password, gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object(
      'role', 'student', 'full_name', p_full_name,
      'username', p_username, 'roll_number', p_roll_number,
      'class_name', p_class_name, 'avatar_color', p_avatar_color
    ),
    now(), now()
  );

  insert into public.profiles (id, role, full_name, username, roll_number, class_name, avatar_color, status)
  values (new_user_id, 'student', p_full_name, p_username, p_roll_number, p_class_name, p_avatar_color, 'active')
  on conflict (id) do update set
    full_name = p_full_name, username = p_username,
    roll_number = p_roll_number, class_name = p_class_name;

  return new_user_id;
end;
$$;

-- 2. UPDATE STUDENT PROFILE
create or replace function public.update_student(
  p_student_id  uuid,
  p_full_name   text,
  p_roll_number text,
  p_class_name  text,
  p_username    text,
  p_status      text default 'active'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.my_role() != 'teacher' then
    raise exception 'Only teachers can update student accounts';
  end if;
  update public.profiles set
    full_name   = p_full_name,
    roll_number = p_roll_number,
    class_name  = p_class_name,
    username    = p_username,
    status      = p_status,
    updated_at  = now()
  where id = p_student_id and role = 'student';
end;
$$;

-- 3. RESET STUDENT PASSWORD
create or replace function public.reset_student_password(
  p_student_id uuid,
  p_new_password text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.my_role() != 'teacher' then
    raise exception 'Only teachers can reset student passwords';
  end if;
  update auth.users set
    encrypted_password = crypt(p_new_password, gen_salt('bf', 10)),
    updated_at = now()
  where id = p_student_id;
end;
$$;

-- 4. DEACTIVATE / REACTIVATE STUDENT
create or replace function public.set_student_status(
  p_student_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.my_role() != 'teacher' then
    raise exception 'Only teachers can change student status';
  end if;
  update public.profiles
  set status = p_status, updated_at = now()
  where id = p_student_id and role = 'student';
end;
$$;
