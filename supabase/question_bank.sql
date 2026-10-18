-- ================================================================
-- Question Bank RPCs
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- ================================================================

-- 1. UPSERT QUESTION (create + update in one RPC)
create or replace function public.upsert_question(
  p_subject_code  text,        -- 'mental_ability' | 'arithmetic' | 'language'
  p_topic_name    text,
  p_difficulty    text,        -- 'easy' | 'medium' | 'hard'
  p_question_text text,
  p_option_a      text,
  p_option_b      text,
  p_option_c      text,
  p_option_d      text,
  p_correct_option text,       -- 'A' | 'B' | 'C' | 'D'
  p_marks         numeric default 1.25,
  p_explanation   text default null,
  p_image_url     text default null,
  p_question_id   uuid default null   -- null = create, non-null = update
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_subject_id uuid;
  v_topic_id   uuid;
  v_qid        uuid;
begin
  if public.my_role() != 'teacher' then
    raise exception 'Only teachers can manage questions';
  end if;

  -- Resolve subject
  select id into v_subject_id from public.subjects where code = p_subject_code;
  if v_subject_id is null then
    raise exception 'Unknown subject code: %', p_subject_code;
  end if;

  -- Resolve or create topic
  select id into v_topic_id from public.topics
  where subject_id = v_subject_id and lower(name) = lower(p_topic_name)
  limit 1;

  if v_topic_id is null then
    insert into public.topics (subject_id, name)
    values (v_subject_id, p_topic_name)
    returning id into v_topic_id;
  end if;

  if p_question_id is null then
    -- CREATE
    insert into public.questions (
      subject_id, topic_id, difficulty, question_text,
      option_a, option_b, option_c, option_d,
      correct_option, marks, explanation, image_url,
      created_by
    ) values (
      v_subject_id, v_topic_id, p_difficulty, p_question_text,
      p_option_a, p_option_b, p_option_c, p_option_d,
      p_correct_option, p_marks, p_explanation, p_image_url,
      auth.uid()
    ) returning id into v_qid;
  else
    -- UPDATE
    update public.questions set
      subject_id    = v_subject_id,
      topic_id      = v_topic_id,
      difficulty    = p_difficulty,
      question_text = p_question_text,
      option_a      = p_option_a,
      option_b      = p_option_b,
      option_c      = p_option_c,
      option_d      = p_option_d,
      correct_option = p_correct_option,
      marks         = p_marks,
      explanation   = p_explanation,
      image_url     = p_image_url,
      updated_at    = now()
    where id = p_question_id;
    v_qid := p_question_id;
  end if;

  return v_qid;
end;
$$;

-- 2. DELETE QUESTION
create or replace function public.delete_question(p_question_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.my_role() != 'teacher' then
    raise exception 'Only teachers can delete questions';
  end if;
  -- Protect questions used in active/completed tests
  if exists (
    select 1 from public.mock_test_questions mtq
    join public.mock_tests mt on mt.id = mtq.mock_test_id
    where mtq.question_id = p_question_id
    and mt.status in ('live', 'completed')
  ) then
    raise exception 'Cannot delete a question that is used in an active or completed test';
  end if;
  delete from public.questions where id = p_question_id;
end;
$$;

-- 3. LIST QUESTIONS (with subject/topic names via join)
-- Teachers can see all; RLS policy allows teacher to read all questions
-- (This is a view for convenience)
create or replace view public.questions_view as
select
  q.id,
  q.difficulty,
  q.question_text,
  q.option_a,
  q.option_b,
  q.option_c,
  q.option_d,
  q.correct_option,
  q.marks,
  q.explanation,
  q.image_url,
  q.used_count,
  q.created_at,
  q.updated_at,
  s.code  as subject_code,
  s.name  as subject_name,
  t.name  as topic_name,
  q.subject_id,
  q.topic_id
from public.questions q
join public.subjects s on s.id = q.subject_id
join public.topics   t on t.id = q.topic_id;

-- Grant access
grant select on public.questions_view to authenticated;

-- RLS on questions table (if not already present)
alter table public.questions enable row level security;

drop policy if exists "Teachers can do everything with questions" on public.questions;
create policy "Teachers can do everything with questions"
  on public.questions for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher')
  );

drop policy if exists "Students can read questions" on public.questions;
create policy "Students can read questions"
  on public.questions for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'student')
  );

-- RLS on subjects and topics
alter table public.subjects enable row level security;
drop policy if exists "Anyone authenticated can read subjects" on public.subjects;
create policy "Anyone authenticated can read subjects"
  on public.subjects for select using (auth.uid() is not null);

alter table public.topics enable row level security;
drop policy if exists "Anyone authenticated can read topics" on public.topics;
create policy "Anyone authenticated can read topics"
  on public.topics for select using (auth.uid() is not null);
