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
-- 3. MOCK TESTS — atomic creation + automatic schedule
--    A test opens by itself at scheduled_at and closes at ends_at.
-- ----------------------------------------------------------------
alter table public.mock_tests add column if not exists ends_at timestamptz;

-- Open scheduled tests whose start time has come; close tests whose end time has passed.
create or replace function public.refresh_test_statuses()
returns void language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in
    update public.mock_tests set status = 'live'
     where status = 'scheduled' and scheduled_at is not null and scheduled_at <= now()
       and (ends_at is null or ends_at > now())
    returning id, title
  loop
    insert into public.notifications (title, body, type, target_role)
    values ('Mock test is now live: ' || r.title,
            'The test "' || r.title || '" is open now. Start it from Mock Tests.', 'test', 'student');
  end loop;

  update public.mock_tests set status = 'completed'
   where status in ('scheduled', 'live') and ends_at is not null and ends_at <= now();
end;
$$;
grant execute on function public.refresh_test_statuses() to authenticated;

-- Old signature (without end time) is replaced.
drop function if exists public.create_mock_test(text, text, int, timestamptz, uuid[], text);

create or replace function public.create_mock_test(
  p_title text, p_pattern text, p_duration_minutes int, p_scheduled_at timestamptz,
  p_question_ids uuid[], p_description text default null, p_ends_at timestamptz default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_marks numeric; v_count int; v_end timestamptz;
begin
  if public.my_role() is distinct from 'teacher' then raise exception 'Only teachers can create tests'; end if;
  if coalesce(array_length(p_question_ids, 1), 0) = 0 then raise exception 'Select at least one question'; end if;
  if p_duration_minutes is null or p_duration_minutes < 5 or p_duration_minutes > 300 then
    raise exception 'Duration must be between 5 and 300 minutes';
  end if;
  if p_scheduled_at is null then raise exception 'Choose the date and time when the test starts'; end if;
  v_end := coalesce(p_ends_at, p_scheduled_at + make_interval(mins => p_duration_minutes + 30));
  if v_end <= p_scheduled_at + interval '5 minutes' then
    raise exception 'The end time must be after the start time';
  end if;
  if v_end <= now() then raise exception 'The end time is already in the past'; end if;

  select count(*), coalesce(sum(marks), 0) into v_count, v_marks
  from public.questions where id = any(p_question_ids);
  if v_count <> (select count(distinct x) from unnest(p_question_ids) x) then
    raise exception 'Some selected questions no longer exist. Refresh and try again.';
  end if;

  insert into public.mock_tests (title, description, pattern, duration_minutes, total_questions,
    total_marks, scheduled_at, ends_at, status, created_by)
  values (coalesce(nullif(trim(p_title), ''), 'Mock Test'), p_description,
    case when p_pattern = 'Manual' then 'Manual' else 'JNVST' end,
    p_duration_minutes, v_count, v_marks, p_scheduled_at, v_end, 'scheduled', auth.uid())
  returning id into v_id;

  insert into public.mock_test_questions (mock_test_id, question_id, order_index)
  select v_id, qid, min(ord)::int - 1
  from unnest(p_question_ids) with ordinality as t(qid, ord)
  group by qid;

  update public.questions set used_count = used_count + 1 where id = any(p_question_ids);
  perform public.refresh_test_statuses();
  return v_id;
end;
$$;

-- Change the start / end time of a test that is not completed yet.
create or replace function public.reschedule_mock_test(p_test_id uuid, p_scheduled_at timestamptz, p_ends_at timestamptz)
returns void language plpgsql security definer set search_path = public as $$
declare v_test public.mock_tests; v_has_attempts boolean;
begin
  if public.my_role() is distinct from 'teacher' then raise exception 'Only teachers can reschedule tests'; end if;
  select * into v_test from public.mock_tests where id = p_test_id for update;
  if v_test.id is null then raise exception 'Test not found'; end if;
  if v_test.status = 'completed' then raise exception 'This test is already completed'; end if;
  if p_scheduled_at is null or p_ends_at is null then raise exception 'Enter both start and end time'; end if;
  if p_ends_at <= p_scheduled_at + interval '5 minutes' then raise exception 'The end time must be after the start time'; end if;
  if p_ends_at <= now() then raise exception 'The end time is already in the past'; end if;
  v_has_attempts := exists (select 1 from public.exam_attempts where mock_test_id = p_test_id);
  if v_has_attempts and p_scheduled_at > now() then
    raise exception 'Students have already started this test, so the start time cannot be moved to the future. You can still change the end time.';
  end if;
  update public.mock_tests
     set scheduled_at = p_scheduled_at, ends_at = p_ends_at,
         status = case when p_scheduled_at > now() then 'scheduled' else status end
   where id = p_test_id;
  perform public.refresh_test_statuses();
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

-- Deadline of an attempt: its own duration, but never later than the test's end time.
create or replace function public._deadline(p_started timestamptz, p_duration int, p_ends timestamptz)
returns timestamptz language sql immutable as $$
  select least(p_started + make_interval(mins => p_duration), coalesce(p_ends, 'infinity'::timestamptz));
$$;

create or replace function public.attempt_deadline(p_attempt_id uuid)
returns timestamptz language sql stable security definer set search_path = public as $$
  select public._deadline(ea.started_at, mt.duration_minutes, mt.ends_at)
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
      and now() <= public._deadline(ea.started_at, mt.duration_minutes, mt.ends_at) + interval '30 seconds'
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

-- Grade attempts whose time is up or whose test is closed (internal).
create or replace function public._grade_expired_attempts()
returns int language plpgsql security definer set search_path = public as $$
declare r record; n int := 0;
begin
  for r in
    select ea.id from public.exam_attempts ea
    join public.mock_tests mt on mt.id = ea.mock_test_id
    where ea.status = 'in_progress'
      and (mt.status = 'completed'
           or now() > public._deadline(ea.started_at, mt.duration_minutes, mt.ends_at) + interval '30 seconds')
  loop
    perform public._grade_attempt(r.id, true);
    n := n + 1;
  end loop;
  return n;
end;
$$;
revoke execute on function public._grade_expired_attempts() from public, anon, authenticated;

-- Called by every page: applies the schedule, then grades expired attempts.
create or replace function public.finalize_expired_attempts()
returns int language plpgsql security definer set search_path = public as $$
begin
  perform public.refresh_test_statuses();
  return public._grade_expired_attempts();
end;
$$;
grant execute on function public.finalize_expired_attempts() to authenticated;

-- When a test closes, grade open attempts immediately.
create or replace function public.on_mock_test_completed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    perform public._grade_expired_attempts();
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
  perform public.finalize_expired_attempts();

  select * into v_test from public.mock_tests where id = p_test_id;
  if v_test.id is null then raise exception 'Test not found'; end if;

  select * into v_att from public.exam_attempts where student_id = auth.uid() and mock_test_id = p_test_id;

  if v_att.id is null then
    if v_test.status in ('scheduled', 'draft') then
      raise exception 'This test has not started yet';
    elsif v_test.status = 'completed' then
      raise exception 'This test is closed';
    end if;
    insert into public.exam_attempts (student_id, mock_test_id, status)
    values (auth.uid(), p_test_id, 'in_progress') returning * into v_att;
  end if;

  return json_build_object(
    'attempt_id', v_att.id,
    'status', v_att.status,
    'started_at', v_att.started_at,
    'deadline', public._deadline(v_att.started_at, v_test.duration_minutes, v_test.ends_at),
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

-- ----------------------------------------------------------------
-- 9. Auth users created from SQL must look exactly like users created
--    by Supabase Auth, otherwise login fails with
--    "Database error querying schema" (NULL token columns / no identity).
-- ----------------------------------------------------------------
create or replace function public._create_auth_user(p_email text, p_password text, p_app_meta jsonb, p_user_meta jsonb)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid := gen_random_uuid();
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', lower(p_email),
    crypt(p_password, gen_salt('bf', 10)), now(),
    coalesce(p_app_meta, '{}'::jsonb) || '{"provider":"email","providers":["email"]}'::jsonb,
    coalesce(p_user_meta, '{}'::jsonb), now(), now(), '', '', '', ''
  );
  insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_id::text, v_id,
          jsonb_build_object('sub', v_id::text, 'email', lower(p_email), 'email_verified', true),
          'email', now(), now(), now());
  return v_id;
end;
$$;
revoke execute on function public._create_auth_user(text, text, jsonb, jsonb) from public, anon, authenticated;

create or replace function public.create_student(
  p_full_name text, p_username text, p_roll_number text, p_class_name text, p_password text,
  p_avatar_color text default '#2563EB'
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_username text := lower(trim(p_username));
  v_email text := v_username || '@navodayaprep.edu';
begin
  if public.my_role() is distinct from 'teacher' then
    raise exception 'Only teachers can create student accounts';
  end if;
  if v_username !~ '^[a-z0-9._-]{3,30}$' then
    raise exception 'Username must be 3-30 characters: letters, numbers, dot, dash or underscore';
  end if;
  if length(coalesce(p_password, '')) < 6 then
    raise exception 'Password must be at least 6 characters';
  end if;
  if exists (select 1 from auth.users where email = v_email)
     or exists (select 1 from public.profiles where lower(username) = v_username) then
    raise exception 'Username already taken: %', p_username;
  end if;
  if exists (select 1 from public.profiles where roll_number = trim(p_roll_number)) then
    raise exception 'Roll number already in use: %', p_roll_number;
  end if;

  v_id := public._create_auth_user(v_email, p_password, '{}'::jsonb,
    jsonb_build_object('full_name', p_full_name, 'username', v_username, 'roll_number', trim(p_roll_number),
                       'class_name', p_class_name, 'avatar_color', p_avatar_color));

  insert into public.profiles (id, role, full_name, username, roll_number, class_name, avatar_color, status)
  values (v_id, 'student', trim(p_full_name), v_username, trim(p_roll_number), p_class_name, p_avatar_color, 'active')
  on conflict (id) do update set full_name = excluded.full_name, username = excluded.username,
    roll_number = excluded.roll_number, class_name = excluded.class_name, avatar_color = excluded.avatar_color;
  return v_id;
end;
$$;

-- Repair any existing SQL-created users so they can log in.
update auth.users set
  confirmation_token = coalesce(confirmation_token, ''),
  recovery_token = coalesce(recovery_token, ''),
  email_change_token_new = coalesce(email_change_token_new, ''),
  email_change = coalesce(email_change, '')
where confirmation_token is null or recovery_token is null
   or email_change_token_new is null or email_change is null;

insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id::text, u.id,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       'email', now(), now(), now()
from auth.users u
where not exists (select 1 from auth.identities i where i.user_id = u.id);

create or replace function public.reset_student_password(p_student_id uuid, p_new_password text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if public.my_role() is distinct from 'teacher' then
    raise exception 'Only teachers can reset student passwords';
  end if;
  if length(coalesce(p_new_password, '')) < 6 then
    raise exception 'Password must be at least 6 characters';
  end if;
  if not exists (select 1 from public.profiles where id = p_student_id and role = 'student') then
    raise exception 'Student not found';
  end if;
  update auth.users set encrypted_password = crypt(p_new_password, gen_salt('bf', 10)), updated_at = now()
  where id = p_student_id;
end;
$$;

-- ----------------------------------------------------------------
-- 10. ACTIVITY TRACKING, PRACTICE-SET PROGRESS, MERIT LIST
-- ----------------------------------------------------------------
alter table public.profiles add column if not exists last_seen_at timestamptz;
create index if not exists idx_practice_attempts_set on public.practice_attempts(practice_set_id, student_id);

-- Called by the app when a user opens it (at most once every 5 minutes).
create or replace function public.touch_last_seen()
returns void language sql security definer set search_path = public as $$
  update public.profiles set last_seen_at = now()
  where id = auth.uid() and (last_seen_at is null or last_seen_at < now() - interval '5 minutes');
$$;
grant execute on function public.touch_last_seen() to authenticated;

-- Teacher: one row per active student with practice & test activity.
-- practice_days_14 = number of different days with at least one practice session in the last 14 days.
drop function if exists public.class_activity_summary();
create or replace function public.class_activity_summary()
returns table (student_id uuid, full_name text, roll_number text, class_name text, avatar_color text,
  last_seen_at timestamptz, practice_total int, practice_7d int, practice_30d int, practice_days_14 int,
  last_practice_at timestamptz, practice_accuracy numeric, sets_done int,
  tests_taken int, avg_test_pct numeric, last_test_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if public.my_role() is distinct from 'teacher' then raise exception 'Teachers only'; end if;
  return query
    with pa as (
      select x.student_id,
             count(*)::int as total,
             count(*) filter (where x.created_at > now() - interval '7 days')::int as d7,
             count(*) filter (where x.created_at > now() - interval '30 days')::int as d30,
             max(x.created_at) as last_at,
             round(sum(x.correct)::numeric * 100 / nullif(sum(x.total), 0), 1) as acc,
             count(distinct x.practice_set_id)::int as sets
      from public.practice_attempts x group by x.student_id
    ),
    ex as (
      select ea.student_id, count(*)::int as n,
             round(avg(ea.score / nullif(mt.total_marks, 0) * 100), 1) as avg_pct,
             max(ea.submitted_at) as last_at
      from public.exam_attempts ea join public.mock_tests mt on mt.id = ea.mock_test_id
      where ea.status = 'submitted' group by ea.student_id
    ),
    days as (
      select z.student_id, count(distinct (z.created_at at time zone 'Asia/Kolkata')::date)::int as n
      from public.practice_attempts z where z.created_at > now() - interval '14 days'
      group by z.student_id
    )
    select p.id, p.full_name, p.roll_number, p.class_name, p.avatar_color, p.last_seen_at,
           coalesce(pa.total, 0), coalesce(pa.d7, 0), coalesce(pa.d30, 0), coalesce(days.n, 0),
           pa.last_at, pa.acc, coalesce(pa.sets, 0),
           coalesce(ex.n, 0), ex.avg_pct, ex.last_at
    from public.profiles p
    left join pa on pa.student_id = p.id
    left join ex on ex.student_id = p.id
    left join days on days.student_id = p.id
    where p.role = 'student' and p.status = 'active';
end;
$$;

-- Teacher: full activity timeline of one student (practice + tests), newest first.
create or replace function public.student_activity(p_student uuid)
returns table (kind text, title text, subject_code text, topic_name text, difficulty text,
  correct int, total int, pct numeric, at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if public.my_role() is distinct from 'teacher' then raise exception 'Teachers only'; end if;
  return query
    select * from (
      select 'practice'::text, coalesce(ps.title, 'Self practice'), pa.subject_code, pa.topic_name, pa.difficulty,
             pa.correct, pa.total, round(pa.correct::numeric * 100 / nullif(pa.total, 0), 1), pa.created_at
      from public.practice_attempts pa
      left join public.practice_sets ps on ps.id = pa.practice_set_id
      where pa.student_id = p_student
      union all
      select 'test'::text, mt.title, null::text, null::text, null::text,
             ea.total_correct, mt.total_questions, round(ea.score / nullif(mt.total_marks, 0) * 100, 1), ea.submitted_at
      from public.exam_attempts ea join public.mock_tests mt on mt.id = ea.mock_test_id
      where ea.student_id = p_student and ea.status = 'submitted'
    ) x
    order by 9 desc
    limit 500;
end;
$$;

-- Teacher: summary per practice set.
create or replace function public.practice_sets_overview()
returns table (set_id uuid, students_attempted int, attempts int, avg_pct numeric, last_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if public.my_role() is distinct from 'teacher' then raise exception 'Teachers only'; end if;
  return query
    select pa.practice_set_id, count(distinct pa.student_id)::int, count(*)::int,
           round(sum(pa.correct)::numeric * 100 / nullif(sum(pa.total), 0), 1), max(pa.created_at)
    from public.practice_attempts pa
    where pa.practice_set_id is not null
    group by pa.practice_set_id;
end;
$$;

-- Teacher: every active student's progress on one practice set (incl. not started).
create or replace function public.practice_set_progress(p_set_id uuid)
returns table (student_id uuid, full_name text, roll_number text, class_name text, avatar_color text,
  attempts int, best_pct numeric, last_pct numeric, first_at timestamptz, last_at timestamptz, active_days int)
language plpgsql stable security definer set search_path = public as $$
begin
  if public.my_role() is distinct from 'teacher' then raise exception 'Teachers only'; end if;
  return query
    select p.id, p.full_name, p.roll_number, p.class_name, p.avatar_color,
           count(pa.id)::int,
           max(round(pa.correct::numeric * 100 / nullif(pa.total, 0), 1)),
           (array_agg(round(pa.correct::numeric * 100 / nullif(pa.total, 0), 1) order by pa.created_at desc))[1],
           min(pa.created_at), max(pa.created_at),
           count(distinct (pa.created_at at time zone 'Asia/Kolkata')::date)::int
    from public.profiles p
    left join public.practice_attempts pa on pa.student_id = p.id and pa.practice_set_id = p_set_id
    where p.role = 'student' and p.status = 'active'
    group by p.id;
end;
$$;

-- Teacher: merit list of one test with proper tie handling (same score = same rank).
create or replace function public.merit_list(p_test_id uuid)
returns table (rank int, student_id uuid, full_name text, roll_number text, class_name text, avatar_color text,
  score numeric, total_marks numeric, total_correct int, total_attempted int, total_questions int,
  pct numeric, submitted_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if public.my_role() is distinct from 'teacher' then raise exception 'Teachers only'; end if;
  return query
    select (rank() over (order by ea.score desc))::int, p.id, p.full_name, p.roll_number, p.class_name, p.avatar_color,
           ea.score, mt.total_marks, ea.total_correct, ea.total_attempted, mt.total_questions,
           round(ea.score / nullif(mt.total_marks, 0) * 100, 1), ea.submitted_at
    from public.exam_attempts ea
    join public.profiles p on p.id = ea.student_id
    join public.mock_tests mt on mt.id = ea.mock_test_id
    where ea.mock_test_id = p_test_id and ea.status = 'submitted'
    order by ea.score desc, p.full_name;
end;
$$;

-- ----------------------------------------------------------------
-- 11. SECURITY TIGHTENING (defence in depth)
-- ----------------------------------------------------------------

-- 11a. Logged-out visitors may only call the two login look-ups.
--      (Every function already checks the role; this removes the surface.)
revoke execute on all functions in schema public from anon;
revoke execute on all functions in schema public from public;
grant execute on all functions in schema public to authenticated;
grant execute on function public.get_student_email(text) to anon;
grant execute on function public.get_teacher_email_by_username(text) to anon;
grant execute on function public.my_role() to anon; -- used inside row-level policies
-- Internal helpers stay closed to everyone (re-revoke after the blanket grant above).
revoke execute on function public._grade_attempt(uuid, boolean) from authenticated;
revoke execute on function public._grade_expired_attempts() from authenticated;
revoke execute on function public._create_auth_user(text, text, jsonb, jsonb) from authenticated;
-- Functions created later are not executable by anon/public by default.
alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon;

-- 11b. Which questions belong to which test is teacher-only.
--      Students receive their paper through get_exam_paper() during the exam.
drop policy if exists "Anyone authenticated can read mock_test_questions" on public.mock_test_questions;

-- 11c. Practice records must be realistic (a session has 1–100 questions).
alter table public.practice_attempts drop constraint if exists practice_attempts_sane;
alter table public.practice_attempts add constraint practice_attempts_sane
  check (total between 1 and 100 and correct between 0 and total) not valid;

-- 11d. Students may only change harmless fields of their own profile
--      (already enforced by protect_profile_fields); teachers cannot be
--      edited by other users through the API.
create or replace function public.protect_profile_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;
  if new.role is distinct from old.role then
    raise exception 'Changing account role is not allowed';
  end if;
  if old.role = 'teacher' and old.id <> auth.uid() then
    raise exception 'Teacher accounts can only be changed by their owner';
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
