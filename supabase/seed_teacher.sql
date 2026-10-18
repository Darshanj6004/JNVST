-- ================================================================
-- SEED: Create Teacher Account
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- AFTER running schema.sql
-- ================================================================
-- Credentials created:
--   Email/Username: teacher_sunita@jnvst.local / teacher_sunita
--   Password:       Navodaya@2026
-- ================================================================

do $$
declare
  new_user_id uuid := uuid_generate_v4();
begin
  -- Check if teacher user already exists in auth.users
  if not exists (select 1 from auth.users where email = 'teacher_sunita@jnvst.local') then
    insert into auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud
    ) values (
      new_user_id,
      '00000000-0000-00-00-00-00-00-000000000000',
      'teacher_sunita@jnvst.local',
      crypt('Navodaya@2026', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"teacher","full_name":"Sunita Deshmukh","username":"teacher_sunita","avatar_color":"#1d4ed8"}',
      now(),
      now(),
      'authenticated',
      'authenticated'
    );
  else
    select id into new_user_id from auth.users where email = 'teacher_sunita@jnvst.local';
  end if;

  -- Ensure profile exists
  insert into public.profiles (
    id,
    role,
    full_name,
    username,
    avatar_color,
    status
  ) values (
    new_user_id,
    'teacher',
    'Sunita Deshmukh',
    'teacher_sunita',
    '#1d4ed8',
    'active'
  )
  on conflict (id) do update set
    role = 'teacher',
    full_name = 'Sunita Deshmukh',
    username = 'teacher_sunita';
end $$;

-- Verify teacher creation:
select id, email, created_at from auth.users where email = 'teacher_sunita@jnvst.local';
select id, role, full_name, username from public.profiles where username = 'teacher_sunita';
