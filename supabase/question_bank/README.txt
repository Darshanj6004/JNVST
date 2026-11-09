JNVST question bank — 2320 questions (all in Marathi), 20 ready-made tests.

Run these files IN ORDER in Supabase → SQL Editor (open each file, paste, Run):
  01_setup_and_topics.sql  (11 KB)
  02_mental_ability_1.sql  (452 KB)
  03_mental_ability_2.sql  (350 KB)
  04_arithmetic_1.sql  (453 KB)
  05_arithmetic_2.sql  (119 KB)
  06_language_1.sql  (452 KB)
  07_language_2.sql  (405 KB)
  08_cleanup_and_summary.sql  (105 KB)

Or, with psql:  for f in supabase/question_bank/*.sql; do psql "$DATABASE_URL" -f "$f"; done
All files are safe to run again.
