-- ================================================================
-- SEED: Create Teacher Account
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- AFTER running schema.sql
-- ================================================================
-- This creates the teacher login:
--   Username: teacher_sunita
--   Password: Navodaya@2026
-- ================================================================

select auth.create_user(
  '{
    "email": "teacher_sunita@jnvst.local",
    "password": "Navodaya@2026",
    "email_confirm": true,
    "user_metadata": {
      "role": "teacher",
      "full_name": "Sunita Deshmukh",
      "username": "teacher_sunita",
      "avatar_color": "#1d4ed8"
    }
  }'::json
);

-- Verify it was created:
select id, email, created_at from auth.users where email = 'teacher_sunita@jnvst.local';
select id, role, full_name, username from public.profiles where username = 'teacher_sunita';
