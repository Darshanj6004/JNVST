-- ================================================================
-- Exam Answers Upsert Constraint
-- REQUIRED for LiveExam to save/update answers with upsert
-- Run in Supabase Dashboard → SQL Editor → New Query
-- ================================================================

-- Add unique constraint so upsert(attempt_id, question_id) works
alter table public.exam_answers
  drop constraint if exists exam_answers_attempt_question_unique;

alter table public.exam_answers
  add constraint exam_answers_attempt_question_unique
  unique (attempt_id, question_id);

-- Also add is_correct and is_marked_for_review columns if not present
alter table public.exam_answers
  add column if not exists is_correct boolean,
  add column if not exists is_marked_for_review boolean default false;

-- Add total_correct and total_attempted to exam_attempts if not present
alter table public.exam_attempts
  add column if not exists total_correct int default 0,
  add column if not exists total_attempted int default 0,
  add column if not exists submitted_at timestamptz;

-- Index for fast student result lookup
create index if not exists idx_exam_attempts_student_test
  on public.exam_attempts(student_id, mock_test_id);

create index if not exists idx_exam_answers_attempt
  on public.exam_answers(attempt_id);

-- View: mock_test_results — teacher can see all student results per test
create or replace view public.mock_test_results as
select
  ea.id as attempt_id,
  ea.student_id,
  p.full_name,
  p.roll_number,
  p.class_name,
  p.avatar_color,
  ea.mock_test_id,
  mt.title as test_title,
  mt.total_marks,
  ea.score,
  ea.total_correct,
  ea.total_attempted,
  mt.total_questions,
  ea.status,
  ea.submitted_at,
  round((ea.score / nullif(mt.total_marks, 0)) * 100) as percentage
from public.exam_attempts ea
join public.profiles p on p.id = ea.student_id
join public.mock_tests mt on mt.id = ea.mock_test_id
where ea.status = 'submitted';

-- RLS: teachers can see all results, students see only their own
drop policy if exists "Anyone can read mock_test_results" on public.exam_attempts;
