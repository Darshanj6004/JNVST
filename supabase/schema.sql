-- ============================================================
-- JNVST Digital Scholarship Platform — Supabase Database Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. ENABLE EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- 2. PROFILES (extends auth.users)
-- ============================================================
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          text not null check (role in ('teacher','student')),
  full_name     text not null,
  username      text not null unique,
  roll_number   text unique,
  class_name    text,
  avatar_color  text not null default '#2563EB',
  status        text not null default 'active' check (status in ('active','inactive')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- 3. SUBJECTS
-- ============================================================
create table if not exists public.subjects (
  id                uuid primary key default uuid_generate_v4(),
  name              text not null,
  code              text not null unique,  -- 'mental_ability' | 'arithmetic' | 'language'
  total_questions   int not null default 0,
  total_marks       numeric not null default 0,
  duration_minutes  int not null default 40,
  created_at        timestamptz not null default now()
);

-- Seed subjects (JNVST pattern)
insert into public.subjects (name, code, total_questions, total_marks, duration_minutes) values
  ('Mental Ability Test', 'mental_ability', 40, 50, 60),
  ('Arithmetic Test',     'arithmetic',     20, 25, 30),
  ('Language Test',       'language',       20, 25, 30)
on conflict (code) do nothing;

-- ============================================================
-- 4. TOPICS
-- ============================================================
create table if not exists public.topics (
  id          uuid primary key default uuid_generate_v4(),
  subject_id  uuid not null references public.subjects(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now()
);

-- Seed topics
do $$
declare
  ma_id uuid; ar_id uuid; la_id uuid;
begin
  select id into ma_id from public.subjects where code = 'mental_ability';
  select id into ar_id from public.subjects where code = 'arithmetic';
  select id into la_id from public.subjects where code = 'language';

  insert into public.topics (subject_id, name) values
    (ma_id, 'Analogy'),
    (ma_id, 'Classification (Odd One Out)'),
    (ma_id, 'Series Completion'),
    (ma_id, 'Pattern Recognition'),
    (ma_id, 'Visual Reasoning'),
    (ma_id, 'Coding-Decoding'),
    (ma_id, 'Mirror & Water Images'),
    (ma_id, 'Embedded Figures'),
    (ar_id, 'Number System'),
    (ar_id, 'Addition, Subtraction, Multiplication & Division'),
    (ar_id, 'Fractions & Decimals'),
    (ar_id, 'Geometry & Shapes'),
    (ar_id, 'Measurement'),
    (ar_id, 'Data Interpretation'),
    (la_id, 'Reading Comprehension'),
    (la_id, 'Grammar & Vocabulary'),
    (la_id, 'Fill in the Blanks'),
    (la_id, 'Sentence Correction')
  on conflict do nothing;
end $$;

-- ============================================================
-- 5. QUESTIONS
-- ============================================================
create table if not exists public.questions (
  id              uuid primary key default uuid_generate_v4(),
  subject_id      uuid not null references public.subjects(id),
  topic_id        uuid not null references public.topics(id),
  difficulty      text not null check (difficulty in ('easy','medium','hard')),
  question_text   text not null,
  option_a        text not null,
  option_b        text not null,
  option_c        text not null,
  option_d        text not null,
  correct_option  text not null check (correct_option in ('A','B','C','D')),
  explanation     text,
  image_url       text,
  marks           numeric not null default 1.25,
  used_count      int not null default 0,
  created_by      uuid references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger questions_updated_at before update on public.questions
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- 6. MOCK TESTS
-- ============================================================
create table if not exists public.mock_tests (
  id               uuid primary key default uuid_generate_v4(),
  title            text not null,
  description      text,
  pattern          text not null default 'JNVST' check (pattern in ('JNVST','Manual')),
  duration_minutes int not null default 120,
  total_questions  int not null default 80,
  total_marks      numeric not null default 100,
  scheduled_at     timestamptz,
  status           text not null default 'draft' check (status in ('draft','scheduled','live','completed')),
  created_by       uuid references public.profiles(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger mock_tests_updated_at before update on public.mock_tests
  for each row execute procedure public.handle_updated_at();

-- Questions assigned to a mock test
create table if not exists public.mock_test_questions (
  id            uuid primary key default uuid_generate_v4(),
  mock_test_id  uuid not null references public.mock_tests(id) on delete cascade,
  question_id   uuid not null references public.questions(id),
  order_index   int not null default 0,
  unique (mock_test_id, question_id)
);

-- ============================================================
-- 7. EXAM ATTEMPTS
-- ============================================================
create table if not exists public.exam_attempts (
  id              uuid primary key default uuid_generate_v4(),
  student_id      uuid not null references public.profiles(id),
  mock_test_id    uuid not null references public.mock_tests(id),
  started_at      timestamptz not null default now(),
  submitted_at    timestamptz,
  score           numeric,
  total_attempted int not null default 0,
  total_correct   int not null default 0,
  status          text not null default 'in_progress' check (status in ('in_progress','submitted','timed_out')),
  created_at      timestamptz not null default now(),
  -- One active attempt per student per test
  unique (student_id, mock_test_id)
);

-- Per-question answers within an attempt
create table if not exists public.exam_answers (
  id                   uuid primary key default uuid_generate_v4(),
  attempt_id           uuid not null references public.exam_attempts(id) on delete cascade,
  question_id          uuid not null references public.questions(id),
  selected_option      text check (selected_option in ('A','B','C','D')),
  is_marked_for_review boolean not null default false,
  is_correct           boolean,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create trigger exam_answers_updated_at before update on public.exam_answers
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- 8. PRACTICE SETS
-- ============================================================
create table if not exists public.practice_sets (
  id            uuid primary key default uuid_generate_v4(),
  title         text not null,
  subject_id    uuid not null references public.subjects(id),
  topic_id      uuid references public.topics(id),
  difficulty    text check (difficulty in ('easy','medium','hard','combined')),
  question_ids  uuid[] not null default '{}',
  created_by    uuid references public.profiles(id),
  created_at    timestamptz not null default now()
);

-- ============================================================
-- 9. NOTIFICATIONS
-- ============================================================
create table if not exists public.notifications (
  id                uuid primary key default uuid_generate_v4(),
  title             text not null,
  body              text not null,
  type              text not null default 'info' check (type in ('test','result','info','alert')),
  target_role       text check (target_role in ('student','teacher','all')),
  target_student_id uuid references public.profiles(id),
  created_at        timestamptz not null default now()
);

-- Track which users have read which notifications
create table if not exists public.notification_reads (
  id              uuid primary key default uuid_generate_v4(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  read_at         timestamptz not null default now(),
  unique (notification_id, user_id)
);

-- ============================================================
-- 10. ROW-LEVEL SECURITY (RLS)
-- ============================================================
alter table public.profiles             enable row level security;
alter table public.subjects             enable row level security;
alter table public.topics               enable row level security;
alter table public.questions            enable row level security;
alter table public.mock_tests           enable row level security;
alter table public.mock_test_questions  enable row level security;
alter table public.exam_attempts        enable row level security;
alter table public.exam_answers         enable row level security;
alter table public.practice_sets        enable row level security;
alter table public.notifications        enable row level security;
alter table public.notification_reads   enable row level security;

-- Helper: get caller's role
create or replace function public.my_role()
returns text language sql stable security definer as $$
  select role from public.profiles where id = auth.uid();
$$;

-- PROFILES
create policy "Users can view their own profile" on public.profiles
  for select using (id = auth.uid() or public.my_role() = 'teacher');
create policy "Teachers can insert profiles" on public.profiles
  for insert with check (public.my_role() = 'teacher');
create policy "Teachers can update profiles" on public.profiles
  for update using (public.my_role() = 'teacher' or id = auth.uid());

-- SUBJECTS & TOPICS (everyone can read)
create policy "Anyone authenticated can read subjects" on public.subjects
  for select using (auth.uid() is not null);
create policy "Anyone authenticated can read topics" on public.topics
  for select using (auth.uid() is not null);

-- QUESTIONS (all can read; only teachers write)
create policy "Anyone authenticated can read questions" on public.questions
  for select using (auth.uid() is not null);
create policy "Teachers can manage questions" on public.questions
  for all using (public.my_role() = 'teacher');

-- MOCK TESTS (all can read; only teachers write)
create policy "Anyone authenticated can read mock tests" on public.mock_tests
  for select using (auth.uid() is not null);
create policy "Teachers can manage mock tests" on public.mock_tests
  for all using (public.my_role() = 'teacher');

-- MOCK TEST QUESTIONS
create policy "Anyone authenticated can read mock_test_questions" on public.mock_test_questions
  for select using (auth.uid() is not null);
create policy "Teachers can manage mock_test_questions" on public.mock_test_questions
  for all using (public.my_role() = 'teacher');

-- EXAM ATTEMPTS (students see own; teachers see all)
create policy "Students see own attempts" on public.exam_attempts
  for select using (student_id = auth.uid() or public.my_role() = 'teacher');
create policy "Students can insert own attempt" on public.exam_attempts
  for insert with check (student_id = auth.uid());
create policy "Students can update own attempt" on public.exam_attempts
  for update using (student_id = auth.uid() or public.my_role() = 'teacher');

-- EXAM ANSWERS
create policy "Students see own answers" on public.exam_answers
  for select using (
    exists (select 1 from public.exam_attempts ea where ea.id = attempt_id and (ea.student_id = auth.uid() or public.my_role() = 'teacher'))
  );
create policy "Students manage own answers" on public.exam_answers
  for all using (
    exists (select 1 from public.exam_attempts ea where ea.id = attempt_id and ea.student_id = auth.uid())
  );

-- PRACTICE SETS
create policy "Anyone authenticated can read practice sets" on public.practice_sets
  for select using (auth.uid() is not null);
create policy "Teachers can manage practice sets" on public.practice_sets
  for all using (public.my_role() = 'teacher');

-- NOTIFICATIONS
create policy "Users see notifications targeted to them" on public.notifications
  for select using (
    auth.uid() is not null and (
      target_role = 'all'
      or target_role = public.my_role()
      or target_student_id = auth.uid()
    )
  );
create policy "Teachers can manage notifications" on public.notifications
  for all using (public.my_role() = 'teacher');

-- NOTIFICATION READS
create policy "Users manage own reads" on public.notification_reads
  for all using (user_id = auth.uid());

-- ============================================================
-- 11. AUTO-CREATE PROFILE ON SIGN-UP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, full_name, username, roll_number, class_name, avatar_color)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    coalesce(new.raw_user_meta_data->>'full_name', 'Unknown'),
    coalesce(new.raw_user_meta_data->>'username', new.email),
    new.raw_user_meta_data->>'roll_number',
    new.raw_user_meta_data->>'class_name',
    coalesce(new.raw_user_meta_data->>'avatar_color', '#2563EB')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Done! All tables, RLS policies, and triggers created.
-- ============================================================
