-- ================================================================
-- SEED: Create a FIRST teacher account for a brand-new installation only.
-- !! The password below is public (it is in Git). Change it immediately after
-- !! the first login (Settings → Change password), or use the private
-- !! reset script instead. Skipped automatically if a teacher already exists.
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- ================================================================

create extension if not exists "pgcrypto";

do $$
declare
  new_user_id uuid := gen_random_uuid();
begin
  -- SAFETY: this file contains a publicly known demo password. It only runs on a
  -- brand-new database. If any teacher already exists, it does nothing.
  if exists (select 1 from public.profiles where role = 'teacher') then
    raise notice 'A teacher account already exists — seed_teacher.sql skipped.';
    return;
  end if;
  if not exists (select 1 from auth.users where email = 'teacher_sunita@jnvst.local') then
    insert into auth.users (
      id,
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
      'teacher_sunita@jnvst.local',
      crypt('Navodaya@2026', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"role":"teacher","full_name":"Sunita Deshmukh","username":"teacher_sunita","avatar_color":"#1d4ed8"}'::jsonb,
      now(),
      now(),
      'authenticated',
      'authenticated'
    );
  else
    select id into new_user_id from auth.users where email = 'teacher_sunita@jnvst.local';
  end if;

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
