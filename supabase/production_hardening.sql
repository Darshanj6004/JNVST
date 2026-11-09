-- ================================================================
-- JNVST Platform — PRODUCTION HARDENING & FEATURE COMPLETION
-- Run AFTER: schema.sql, question_bank.sql, student_management.sql,
--            teacher_auth_helper.sql, exam_constraints.sql
-- Supabase Dashboard → SQL Editor → New Query → paste → Run
-- Safe to run multiple times.
--
-- What this does:
--   1. Closes privilege-escalation holes (students changing their role,
--      self-signup as teacher, reading every student's results).
--   2. Moves exam scoring to the server. Students can no longer read
--      answer keys or write their own score.
--   3. Server-enforced exam timer (resume keeps the original deadline).
--   4. Auto-grades abandoned attempts when time is up / test is closed.
--   5. Student login by roll number / username (works before sign-in).
--   6. Practice sets, practice history, question "source" (previous
--      year papers), school settings.
-- ================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------
-- 0. Helpers
-- ----------------------------------------------------------------
create or replace function public.my_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and status = 'active';
$$;

-- ----------------------------------------------------------------
-- 1. ACCOUNT SECURITY
-- ----------------------------------------------------------------

-- 1a. New auth users are ALWAYS students unless app_metadata (server-only)
--     says otherwise. user_metadata is client-controlled and is ignored for role.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, full_name, username, roll_number, class_name, avatar_color)
  values (
    new.id,
    case when new.raw_app_meta_data->>'role' = 'teacher' then 'teacher' else 'student' end,
    coalesce(new.raw_user_meta_data->>'full_name', 'Unknown'),
    coalesce(new.raw_user_meta_data->>'username', new.email),
    new.raw_user_meta_data->>'roll_number',
    new.raw_user_meta_data->>'class_name',
    coalesce(new.raw_user_meta_data->>'avatar_color', '#2563EB')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 1b. Nobody can change role through the API. Students cannot change
--     status / username / roll number / class of their own profile.
create or replace function public.protect_profile_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- auth.uid() is null when run from SQL editor / service role: allow.
  if auth.uid() is null then return new; end if;

  if new.role is distinct from old.role then
    raise exception 'Changing account role is not allowed';
  end if;

  if public.my_role() is distinct from 'teacher' then
    if new.status      is distinct from old.status
    or new.username    is distinct from old.username
    or new.roll_number is distinct from old.roll_number
    or new.class_name  is distinct from old.class_name then
      raise exception 'Only a teacher can change these details';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_fields on public.profiles;
create trigger profiles_protect_fields before update on public.profiles
  for each row execute procedure public.protect_profile_fields();

-- 1c. Student login lookup (callable before sign-in).
--     Accepts username or roll number, returns the auth email.
create or replace function public.get_student_email(p_login text)
returns text language plpgsql security definer set search_path = public as $$
declare v_email text;
begin
  select u.email into v_email
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.role = 'student'
    and (lower(p.username) = lower(trim(p_login)) or p.roll_number = trim(p_login))
  limit 1;
  return v_email;
end;
$$;
grant execute on function public.get_student_email(text) to anon, authenticated;

-- 1d. Results view: only teacher or the owning student.
create or replace view public.mock_test_results as
select
  ea.id as attempt_id, ea.student_id, p.full_name, p.roll_number, p.class_name, p.avatar_color,
  ea.mock_test_id, mt.title as test_title, mt.total_marks, ea.score, ea.total_correct,
  ea.total_attempted, mt.total_questions, ea.status, ea.submitted_at,
  round((ea.score / nullif(mt.total_marks, 0)) * 100) as percentage
from public.exam_attempts ea
join public.profiles p on p.id = ea.student_id
join public.mock_tests mt on mt.id = ea.mock_test_id
where ea.status = 'submitted'
  and (public.my_role() = 'teacher' or ea.student_id = auth.uid());

-- ----------------------------------------------------------------
-- 2. QUESTIONS — answer keys are teacher-only
-- ----------------------------------------------------------------
alter table public.questions add column if not exists source text;
create index if not exists idx_questions_source on public.questions(source);
create index if not exists idx_mtq_question on public.mock_test_questions(question_id);

-- Remove every student-readable policy on questions.
drop policy if exists "Anyone authenticated can read questions" on public.questions;
drop policy if exists "Students can read questions" on public.questions;
drop policy if exists "Teachers can do everything with questions" on public.questions;
drop policy if exists "Teachers can manage questions" on public.questions;
create policy "Teachers can manage questions" on public.questions
  for all using (public.my_role() = 'teacher') with check (public.my_role() = 'teacher');

-- Teacher-only question view (runs as owner, so filter explicitly).
drop view if exists public.questions_view;
create view public.questions_view as
select
  q.id, q.difficulty, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d,
  q.correct_option, q.marks, q.explanation, q.image_url, q.used_count, q.created_at, q.updated_at,
  s.code as subject_code, s.name as subject_name, t.name as topic_name, q.subject_id, q.topic_id,
  q.source
from public.questions q
join public.subjects s on s.id = q.subject_id
join public.topics   t on t.id = q.topic_id
where public.my_role() = 'teacher';
grant select on public.questions_view to authenticated;

-- upsert_question now accepts a source (e.g. "JNVST 2024").
drop function if exists public.upsert_question(text,text,text,text,text,text,text,text,text,numeric,text,text,uuid);
create or replace function public.upsert_question(
  p_subject_code text, p_topic_name text, p_difficulty text, p_question_text text,
  p_option_a text, p_option_b text, p_option_c text, p_option_d text, p_correct_option text,
  p_marks numeric default 1.25, p_explanation text default null, p_image_url text default null,
  p_question_id uuid default null, p_source text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_subject_id uuid; v_topic_id uuid; v_qid uuid;
begin
  if public.my_role() is distinct from 'teacher' then
    raise exception 'Only teachers can manage questions';
  end if;
  if coalesce(trim(p_question_text), '') = '' then raise exception 'Question text is required'; end if;
  if upper(p_correct_option) not in ('A','B','C','D') then raise exception 'Correct option must be A, B, C or D'; end if;
  if lower(p_difficulty) not in ('easy','medium','hard') then raise exception 'Difficulty must be easy, medium or hard'; end if;

  select id into v_subject_id from public.subjects where code = p_subject_code;
  if v_subject_id is null then raise exception 'Unknown subject code: %', p_subject_code; end if;

  select id into v_topic_id from public.topics
   where subject_id = v_subject_id and lower(name) = lower(trim(p_topic_name)) limit 1;
  if v_topic_id is null then
    insert into public.topics (subject_id, name) values (v_subject_id, trim(p_topic_name))
    returning id into v_topic_id;
  end if;

  if p_question_id is null then
    insert into public.questions (subject_id, topic_id, difficulty, question_text, option_a, option_b,
      option_c, option_d, correct_option, marks, explanation, image_url, source, created_by)
    values (v_subject_id, v_topic_id, lower(p_difficulty), trim(p_question_text), p_option_a, p_option_b,
      p_option_c, p_option_d, upper(p_correct_option), coalesce(p_marks, 1.25), nullif(trim(p_explanation), ''),
      nullif(trim(p_image_url), ''), nullif(trim(p_source), ''), auth.uid())
    returning id into v_qid;
  else
    update public.questions set
      subject_id = v_subject_id, topic_id = v_topic_id, difficulty = lower(p_difficulty),
      question_text = trim(p_question_text), option_a = p_option_a, option_b = p_option_b,
      option_c = p_option_c, option_d = p_option_d, correct_option = upper(p_correct_option),
      marks = coalesce(p_marks, 1.25), explanation = nullif(trim(p_explanation), ''),
      image_url = nullif(trim(p_image_url), ''), source = nullif(trim(p_source), ''), updated_at = now()
    where id = p_question_id;
    if not found then raise exception 'Question not found'; end if;
    v_qid := p_question_id;
  end if;
  return v_qid;
end;
$$;

-- delete_question: friendlier error when used in any test.
create or replace function public.delete_question(p_question_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.my_role() is distinct from 'teacher' then raise exception 'Only teachers can delete questions'; end if;
  if exists (select 1 from public.mock_test_questions where question_id = p_question_id) then
    raise exception 'This question is part of a mock test and cannot be deleted. Remove the test first or edit the question instead.';
  end if;
  if exists (select 1 from public.exam_answers where question_id = p_question_id) then
    raise exception 'Students have already answered this question, so it cannot be deleted.';
  end if;
  delete from public.questions where id = p_question_id;
end;
$$;

-- Is a question safe to show (with answer) for practice?
-- Hidden while it belongs to any draft / scheduled / live mock test.
create or replace function public.question_is_practice_safe(p_question_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select not exists (
    select 1 from public.mock_test_questions mtq
    join public.mock_tests mt on mt.id = mtq.mock_test_id
    where mtq.question_id = p_question_id and mt.status in ('draft','scheduled','live')
  );
$$;

-- ----------------------------------------------------------------
-- 3. MOCK TESTS — atomic creation
-- ----------------------------------------------------------------
create or replace function public.create_mock_test(
  p_title text, p_pattern text, p_duration_minutes int, p_scheduled_at timestamptz,
  p_question_ids uuid[], p_description text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_marks numeric; v_count int;
begin
  if public.my_role() is distinct from 'teacher' then raise exception 'Only teachers can create tests'; end if;
  if coalesce(array_length(p_question_ids, 1), 0) = 0 then raise exception 'Select at least one question'; end if;
  if p_duration_minutes is null or p_duration_minutes < 5 or p_duration_minutes > 300 then
    raise exception 'Duration must be between 5 and 300 minutes';
  end if;

  select count(*), coalesce(sum(marks), 0) into v_count, v_marks
  from public.questions where id = any(p_question_ids);
  if v_count <> (select count(distinct x) from unnest(p_question_ids) x) then
    raise exception 'Some selected questions no longer exist. Refresh and try again.';
  end if;

  insert into public.mock_tests (title, description, pattern, duration_minutes, total_questions,
    total_marks, scheduled_at, status, created_by)
  values (coalesce(nullif(trim(p_title), ''), 'Mock Test'), p_description,
    case when p_pattern = 'Manual' then 'Manual' else 'JNVST' end,
    p_duration_minutes, v_count, v_marks, p_scheduled_at, 'scheduled', auth.uid())
  returning id into v_id;

  insert into public.mock_test_questions (mock_test_id, question_id, order_index)
  select v_id, qid, min(ord)::int - 1
  from unnest(p_question_ids) with ordinality as t(qid, ord)
  group by qid;

  update public.questions set used_count = used_count + 1 where id = any(p_question_ids);
  return v_id;
end;
$$;

-- ----------------------------------------------------------------
-- 4. EXAM ENGINE (server-side timer + grading)
-- ----------------------------------------------------------------

-- Students may no longer insert/update attempts directly.
drop policy if exists "Students can insert own attempt" on public.exam_attempts;
drop policy if exists "Students can update own attempt" on public.exam_attempts;
drop policy if exists "Teachers can update attempts" on public.exam_attempts;
create policy "Teachers can update attempts" on public.exam_attempts
  for update using (public.my_role() = 'teacher');

alter table public.exam_attempts add column if not exists auto_submitted boolean not null default false;

-- Deadline of an attempt.
create or replace function public.attempt_deadline(p_attempt_id uuid)
returns timestamptz language sql stable security definer set search_path = public as $$
  select ea.started_at + make_interval(mins => mt.duration_minutes)
  from public.exam_attempts ea join public.mock_tests mt on mt.id = ea.mock_test_id
  where ea.id = p_attempt_id;
$$;

-- Can the current user still write an answer to this attempt?
create or replace function public.attempt_is_writable(p_attempt_id uuid, p_question_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.exam_attempts ea
    join public.mock_tests mt on mt.id = ea.mock_test_id
    join public.mock_test_questions mtq on mtq.mock_test_id = ea.mock_test_id and mtq.question_id = p_question_id
    where ea.id = p_attempt_id
      and ea.student_id = auth.uid()
      and ea.status = 'in_progress'
      and mt.status = 'live'
      and now() <= ea.started_at + make_interval(mins => mt.duration_minutes) + interval '30 seconds'
  );
$$;

-- exam_answers: students read only in-progress answers (to resume) and
-- write only while the attempt is open. Correctness is never exposed here.
drop policy if exists "Students see own answers" on public.exam_answers;
drop policy if exists "Students manage own answers" on public.exam_answers;
drop policy if exists "Read own or teacher answers" on public.exam_answers;
drop policy if exists "Students insert open answers" on public.exam_answers;
drop policy if exists "Students update open answers" on public.exam_answers;

create policy "Read own or teacher answers" on public.exam_answers
  for select using (
    public.my_role() = 'teacher'
    or exists (select 1 from public.exam_attempts ea
               where ea.id = attempt_id and ea.student_id = auth.uid() and ea.status = 'in_progress')
  );
create policy "Students insert open answers" on public.exam_answers
  for insert with check (public.attempt_is_writable(attempt_id, question_id) and is_correct is null);
create policy "Students update open answers" on public.exam_answers
  for update using (public.attempt_is_writable(attempt_id, question_id))
  with check (public.attempt_is_writable(attempt_id, question_id) and is_correct is null);

-- Grade one attempt (internal).
create or replace function public._grade_attempt(p_attempt_id uuid, p_auto boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v_test uuid; v_score numeric; v_correct int; v_attempted int;
begin
  select mock_test_id into v_test from public.exam_attempts
   where id = p_attempt_id and status = 'in_progress' for update;
  if v_test is null then return; end if;

  -- Ensure every paper question has a row (unanswered = wrong) for analytics.
  insert into public.exam_answers (attempt_id, question_id, selected_option)
  select p_attempt_id, mtq.question_id, null
  from public.mock_test_questions mtq where mtq.mock_test_id = v_test
  on conflict (attempt_id, question_id) do nothing;

  update public.exam_answers a
     set is_correct = (a.selected_option is not null and a.selected_option = q.correct_option)
    from public.questions q
   where a.attempt_id = p_attempt_id and q.id = a.question_id;

  select coalesce(sum(q.marks) filter (where a.is_correct), 0),
         count(*) filter (where a.is_correct),
         count(*) filter (where a.selected_option is not null)
    into v_score, v_correct, v_attempted
    from public.exam_answers a join public.questions q on q.id = a.question_id
   where a.attempt_id = p_attempt_id;

  update public.exam_attempts set
    status = 'submitted', submitted_at = now(), score = round(v_score, 2),
    total_correct = v_correct, total_attempted = v_attempted, auto_submitted = p_auto
  where id = p_attempt_id;
end;
$$;
revoke execute on function public._grade_attempt(uuid, boolean) from public, anon, authenticated;

-- Grade every attempt whose time is up or whose test is closed.
create or replace function public.finalize_expired_attempts()
returns int language plpgsql security definer set search_path = public as $$
declare r record; n int := 0;
begin
  for r in
    select ea.id from public.exam_attempts ea
    join public.mock_tests mt on mt.id = ea.mock_test_id
    where ea.status = 'in_progress'
      and (mt.status = 'completed'
           or now() > ea.started_at + make_interval(mins => mt.duration_minutes) + interval '30 seconds')
  loop
    perform public._grade_attempt(r.id, true);
    n := n + 1;
  end loop;
  return n;
end;
$$;
grant execute on function public.finalize_expired_attempts() to authenticated;

-- When a teacher closes a test, grade open attempts immediately.
create or replace function public.on_mock_test_completed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    perform public.finalize_expired_attempts();
  end if;
  return new;
end;
$$;
drop trigger if exists mock_tests_on_completed on public.mock_tests;
create trigger mock_tests_on_completed after update of status on public.mock_tests
  for each row execute procedure public.on_mock_test_completed();

-- Start (or resume) an exam.
create or replace function public.start_exam(p_test_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare v_test public.mock_tests; v_att public.exam_attempts;
begin
  if public.my_role() is distinct from 'student' then
    raise exception 'Only active student accounts can take tests';
  end if;
  select * into v_test from public.mock_tests where id = p_test_id;
  if v_test.id is null then raise exception 'Test not found'; end if;

  perform public.finalize_expired_attempts();

  select * into v_att from public.exam_attempts where student_id = auth.uid() and mock_test_id = p_test_id;

  if v_att.id is null then
    if v_test.status <> 'live' then
      raise exception 'This test is not open right now';
    end if;
    insert into public.exam_attempts (student_id, mock_test_id, status)
    values (auth.uid(), p_test_id, 'in_progress') returning * into v_att;
  end if;

  return json_build_object(
    'attempt_id', v_att.id,
    'status', v_att.status,
    'started_at', v_att.started_at,
    'deadline', v_att.started_at + make_interval(mins => v_test.duration_minutes),
    'server_now', now(),
    'title', v_test.title,
    'pattern', v_test.pattern,
    'duration_minutes', v_test.duration_minutes,
    'total_marks', v_test.total_marks,
    'total_questions', v_test.total_questions
  );
end;
$$;

-- Question paper WITHOUT answers, only for the student's open attempt.
create or replace function public.get_exam_paper(p_test_id uuid)
returns table (question_id uuid, order_index int, question_text text, option_a text, option_b text,
  option_c text, option_d text, image_url text, marks numeric, subject_code text, subject_name text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not exists (select 1 from public.exam_attempts
                 where student_id = auth.uid() and mock_test_id = p_test_id and status = 'in_progress') then
    raise exception 'No open attempt for this test';
  end if;
  return query
    select q.id, mtq.order_index, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d,
           q.image_url, q.marks, s.code, s.name
    from public.mock_test_questions mtq
    join public.questions q on q.id = mtq.question_id
    join public.subjects s on s.id = q.subject_id
    where mtq.mock_test_id = p_test_id
    order by mtq.order_index, q.id;
end;
$$;

-- Submit (student). Returns the result summary.
create or replace function public.submit_exam(p_attempt_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare v_att public.exam_attempts; v_test public.mock_tests;
begin
  select * into v_att from public.exam_attempts where id = p_attempt_id and student_id = auth.uid();
  if v_att.id is null then raise exception 'Attempt not found'; end if;
  if v_att.status = 'in_progress' then
    perform public._grade_attempt(p_attempt_id, false);
    select * into v_att from public.exam_attempts where id = p_attempt_id;
  end if;
  select * into v_test from public.mock_tests where id = v_att.mock_test_id;
  return json_build_object(
    'score', v_att.score, 'total_marks', v_test.total_marks, 'total_correct', v_att.total_correct,
    'total_attempted', v_att.total_attempted, 'total_questions', v_test.total_questions,
    'title', v_test.title
  );
end;
$$;

-- Aggregated per-topic performance for the calling student (no per-question keys).
create or replace function public.my_topic_stats(p_test_id uuid default null)
returns table (mock_test_id uuid, subject_code text, subject_name text, topic_name text,
  total int, correct int, attempted int, marks_earned numeric, marks_total numeric)
language sql stable security definer set search_path = public as $$
  select ea.mock_test_id, s.code, s.name, t.name,
         count(*)::int,
         count(*) filter (where a.is_correct)::int,
         count(*) filter (where a.selected_option is not null)::int,
         coalesce(sum(q.marks) filter (where a.is_correct), 0),
         coalesce(sum(q.marks), 0)
  from public.exam_attempts ea
  join public.exam_answers a on a.attempt_id = ea.id
  join public.questions q on q.id = a.question_id
  join public.subjects s on s.id = q.subject_id
  join public.topics t on t.id = q.topic_id
  where ea.student_id = auth.uid() and ea.status = 'submitted'
    and (p_test_id is null or ea.mock_test_id = p_test_id)
  group by ea.mock_test_id, s.code, s.name, t.name;
$$;

-- Class average % for each test the calling student has taken.
create or replace function public.my_test_class_averages()
returns table (mock_test_id uuid, avg_pct numeric, attempts int)
language sql stable security definer set search_path = public as $$
  select ea.mock_test_id,
         round(avg(ea.score / nullif(mt.total_marks, 0) * 100), 1),
         count(*)::int
  from public.exam_attempts ea
  join public.mock_tests mt on mt.id = ea.mock_test_id
  where ea.status = 'submitted'
    and ea.mock_test_id in (select x.mock_test_id from public.exam_attempts x
                            where x.student_id = auth.uid() and x.status = 'submitted')
  group by ea.mock_test_id;
$$;

-- Answer review: available once the teacher has CLOSED the test.
create or replace function public.get_attempt_review(p_test_id uuid)
returns table (order_index int, question_text text, option_a text, option_b text, option_c text,
  option_d text, image_url text, marks numeric, subject_name text, topic_name text,
  selected_option text, correct_option text, is_correct boolean, explanation text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.exam_attempts ea join public.mock_tests mt on mt.id = ea.mock_test_id
    where ea.student_id = auth.uid() and ea.mock_test_id = p_test_id
      and ea.status = 'submitted' and mt.status = 'completed'
  ) then
    return;
  end if;
  return query
    select mtq.order_index, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.image_url,
           q.marks, s.name, t.name, a.selected_option, q.correct_option, coalesce(a.is_correct, false), q.explanation
    from public.exam_attempts ea
    join public.mock_test_questions mtq on mtq.mock_test_id = ea.mock_test_id
    join public.questions q on q.id = mtq.question_id
    join public.subjects s on s.id = q.subject_id
    join public.topics t on t.id = q.topic_id
    left join public.exam_answers a on a.attempt_id = ea.id and a.question_id = q.id
    where ea.student_id = auth.uid() and ea.mock_test_id = p_test_id
    order by mtq.order_index;
end;
$$;

-- Teacher analytics: one row per graded answer.
drop view if exists public.answer_facts;
create view public.answer_facts as
select a.attempt_id, ea.student_id, ea.mock_test_id, ea.submitted_at, a.question_id,
       a.selected_option, coalesce(a.is_correct, false) as is_correct, q.marks,
       s.code as subject_code, s.name as subject_name, t.name as topic_name
from public.exam_answers a
join public.exam_attempts ea on ea.id = a.attempt_id
join public.questions q on q.id = a.question_id
join public.subjects s on s.id = q.subject_id
join public.topics t on t.id = q.topic_id
where ea.status = 'submitted' and public.my_role() = 'teacher';
grant select on public.answer_facts to authenticated;

-- Teacher: per-topic accuracy for the class (optionally one test).
create or replace function public.class_topic_stats(p_test_id uuid default null)
returns table (subject_code text, subject_name text, topic_name text, total int, correct int, attempted int)
language plpgsql stable security definer set search_path = public as $$
begin
  if public.my_role() is distinct from 'teacher' then raise exception 'Teachers only'; end if;
  return query
    select s.code, s.name, t.name, count(*)::int,
           count(*) filter (where a.is_correct)::int,
           count(*) filter (where a.selected_option is not null)::int
    from public.exam_answers a
    join public.exam_attempts ea on ea.id = a.attempt_id and ea.status = 'submitted'
    join public.questions q on q.id = a.question_id
    join public.subjects s on s.id = q.subject_id
    join public.topics t on t.id = q.topic_id
    where p_test_id is null or ea.mock_test_id = p_test_id
    group by s.code, s.name, t.name;
end;
$$;

-- Teacher: one row per mock test with participation and score stats.
create or replace function public.class_test_summary()
returns table (mock_test_id uuid, title text, status text, scheduled_at timestamptz, total_marks numeric,
  total_questions int, attempts int, avg_pct numeric, max_pct numeric, min_pct numeric)
language plpgsql stable security definer set search_path = public as $$
begin
  if public.my_role() is distinct from 'teacher' then raise exception 'Teachers only'; end if;
  return query
    select mt.id, mt.title, mt.status, mt.scheduled_at, mt.total_marks, mt.total_questions,
           count(ea.id)::int,
           round(avg(ea.score / nullif(mt.total_marks, 0) * 100), 1),
           round(max(ea.score / nullif(mt.total_marks, 0) * 100), 1),
           round(min(ea.score / nullif(mt.total_marks, 0) * 100), 1)
    from public.mock_tests mt
    left join public.exam_attempts ea on ea.mock_test_id = mt.id and ea.status = 'submitted'
    group by mt.id
    order by coalesce(mt.scheduled_at, mt.created_at);
end;
$$;

-- Teacher: one row per active student with overall performance.
create or replace function public.class_student_summary()
returns table (student_id uuid, full_name text, roll_number text, class_name text, avatar_color text,
  tests_taken int, avg_pct numeric, best_pct numeric, last_pct numeric, last_submitted_at timestamptz,
  practice_sessions int)
language plpgsql stable security definer set search_path = public as $$
begin
  if public.my_role() is distinct from 'teacher' then raise exception 'Teachers only'; end if;
  return query
    with s as (
      select ea.student_id, ea.submitted_at, ea.score / nullif(mt.total_marks, 0) * 100 as pct
      from public.exam_attempts ea join public.mock_tests mt on mt.id = ea.mock_test_id
      where ea.status = 'submitted'
    )
    select p.id, p.full_name, p.roll_number, p.class_name, p.avatar_color,
           count(s.pct)::int,
           round(avg(s.pct), 1),
           round(max(s.pct), 1),
           round((array_agg(s.pct order by s.submitted_at desc) filter (where s.pct is not null))[1], 1),
           max(s.submitted_at),
           (select count(*)::int from public.practice_attempts pa where pa.student_id = p.id)
    from public.profiles p
    left join s on s.student_id = p.id
    where p.role = 'student' and p.status = 'active'
    group by p.id;
end;
$$;

-- ----------------------------------------------------------------
-- 5. PRACTICE
-- ----------------------------------------------------------------
alter table public.practice_sets add column if not exists description text;
alter table public.practice_sets add column if not exists is_active boolean not null default true;

-- Random practice questions (with answers), excluding any question
-- that is part of an upcoming / live test.
create or replace function public.get_practice_questions(
  p_subject_code text, p_topic_name text default null, p_difficulty text default null, p_limit int default 20
) returns table (id uuid, question_text text, option_a text, option_b text, option_c text, option_d text,
  correct_option text, explanation text, image_url text, marks numeric, difficulty text,
  subject_code text, topic_name text)
language sql stable security definer set search_path = public as $$
  select q.id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option,
         q.explanation, q.image_url, q.marks, q.difficulty, s.code, t.name
  from public.questions q
  join public.subjects s on s.id = q.subject_id
  join public.topics t on t.id = q.topic_id
  where auth.uid() is not null
    and s.code = p_subject_code
    and (p_topic_name is null or t.name = p_topic_name)
    and (p_difficulty is null or p_difficulty = 'combined' or q.difficulty = p_difficulty)
    and public.question_is_practice_safe(q.id)
  order by random()
  limit greatest(1, least(coalesce(p_limit, 20), 100));
$$;

-- Topic list with number of practice-available questions.
create or replace function public.get_practice_topics()
returns table (subject_code text, topic_name text, question_count int)
language sql stable security definer set search_path = public as $$
  select s.code, t.name, count(q.id) filter (where public.question_is_practice_safe(q.id))::int
  from public.topics t
  join public.subjects s on s.id = t.subject_id
  left join public.questions q on q.topic_id = t.id
  where auth.uid() is not null
  group by s.code, t.name
  order by s.code, t.name;
$$;

-- Questions of a teacher-made practice set.
create or replace function public.get_practice_set_questions(p_set_id uuid)
returns table (id uuid, question_text text, option_a text, option_b text, option_c text, option_d text,
  correct_option text, explanation text, image_url text, marks numeric, difficulty text,
  subject_code text, topic_name text)
language sql stable security definer set search_path = public as $$
  select q.id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option,
         q.explanation, q.image_url, q.marks, q.difficulty, s.code, t.name
  from public.practice_sets ps
  cross join lateral unnest(ps.question_ids) with ordinality as x(qid, ord)
  join public.questions q on q.id = x.qid
  join public.subjects s on s.id = q.subject_id
  join public.topics t on t.id = q.topic_id
  where ps.id = p_set_id and auth.uid() is not null
    and (ps.is_active or public.my_role() = 'teacher')
    and public.question_is_practice_safe(q.id)
  order by x.ord;
$$;

-- Practice history (so teachers can see effort, students see progress).
create table if not exists public.practice_attempts (
  id            uuid primary key default uuid_generate_v4(),
  student_id    uuid not null references public.profiles(id) on delete cascade,
  practice_set_id uuid references public.practice_sets(id) on delete set null,
  subject_code  text not null,
  topic_name    text,
  difficulty    text,
  total         int not null check (total >= 0),
  correct       int not null check (correct >= 0),
  created_at    timestamptz not null default now()
);
create index if not exists idx_practice_attempts_student on public.practice_attempts(student_id, created_at desc);
alter table public.practice_attempts enable row level security;

drop policy if exists "Read own practice or teacher" on public.practice_attempts;
create policy "Read own practice or teacher" on public.practice_attempts
  for select using (student_id = auth.uid() or public.my_role() = 'teacher');
drop policy if exists "Students log own practice" on public.practice_attempts;
create policy "Students log own practice" on public.practice_attempts
  for insert with check (student_id = auth.uid() and public.my_role() = 'student' and correct <= total);

-- ----------------------------------------------------------------
-- 6. SCHOOL SETTINGS (single row)
-- ----------------------------------------------------------------
create table if not exists public.app_settings (
  id                       int primary key default 1 check (id = 1),
  school_name              text not null default 'Z.P.P. School, Kasare',
  school_address           text not null default 'Tal. Sangamner, Dist. Ahilyanagar, Maharashtra',
  strong_threshold         int  not null default 75 check (strong_threshold between 1 and 100),
  weak_threshold           int  not null default 50 check (weak_threshold between 1 and 100),
  default_duration_minutes int  not null default 120 check (default_duration_minutes between 5 and 300),
  idle_logout_minutes      int  not null default 30 check (idle_logout_minutes between 5 and 240),
  updated_at               timestamptz not null default now()
);
insert into public.app_settings (id) values (1) on conflict (id) do nothing;
alter table public.app_settings enable row level security;

drop policy if exists "Anyone signed in reads settings" on public.app_settings;
create policy "Anyone signed in reads settings" on public.app_settings
  for select using (auth.uid() is not null);
drop policy if exists "Teachers update settings" on public.app_settings;
create policy "Teachers update settings" on public.app_settings
  for update using (public.my_role() = 'teacher') with check (public.my_role() = 'teacher');

drop trigger if exists app_settings_updated_at on public.app_settings;
create trigger app_settings_updated_at before update on public.app_settings
  for each row execute procedure public.handle_updated_at();

-- ----------------------------------------------------------------
-- 7. Useful indexes
-- ----------------------------------------------------------------
create index if not exists idx_exam_attempts_test_status on public.exam_attempts(mock_test_id, status);
create index if not exists idx_exam_answers_question on public.exam_answers(question_id);
create index if not exists idx_notifications_created on public.notifications(created_at desc);

-- ================================================================
-- Done. Recommended dashboard settings (Authentication → Providers):
--   • Email: turn OFF "Allow new users to sign up".
-- ================================================================

-- ----------------------------------------------------------------
-- 8. Notifications: unread count for the sidebar badge
-- ----------------------------------------------------------------
create or replace function public.unread_notification_count()
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from public.notifications n
  where (n.target_role = 'all' or n.target_role = public.my_role() or n.target_student_id = auth.uid())
    and not exists (select 1 from public.notification_reads r where r.notification_id = n.id and r.user_id = auth.uid());
$$;
