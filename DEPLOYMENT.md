# JNVST Prep Platform — Setup & Go-Live Guide

## 1. Database (Supabase)

In **Supabase Dashboard → SQL Editor**, run these files **in this order** (each one is safe to re-run):

| # | File | Purpose |
|---|------|---------|
| 1 | `supabase/schema.sql` | Tables, subjects, topics, base policies |
| 2 | `supabase/question_bank.sql` | Question management |
| 3 | `supabase/student_management.sql` | Create / edit / reset students |
| 4 | `supabase/teacher_auth_helper.sql` | Teacher login by username |
| 5 | `supabase/exam_constraints.sql` | Exam answer constraints |
| 6 | `supabase/seed_teacher.sql` | Creates the first teacher account |
| 7 | **`supabase/production_hardening.sql`** | **Required.** Security, server-side exam scoring, practice sets, settings, reports |

> If the database was set up earlier, only file 7 needs to be run.

Then in **Authentication → Providers → Email**, turn **OFF** "Allow new users to sign up".
Student accounts are created only by teachers inside the app.

## 2. Website (Vercel)

1. Import the Git repository in Vercel (framework: Vite).
2. In **Project → Settings → Environment Variables** add:
   - `VITE_SUPABASE_URL` — from Supabase → Project Settings → API
   - `VITE_SUPABASE_ANON_KEY` — the **anon / public** key (never the service-role key)
3. Deploy.

For local development, put the same two values in `.env.local` and run `npm install && npm run dev`.

## 3. First login (teacher)

- Username: `teacher_sunita` · Password: `Navodaya@2026`
- **Immediately change the password** in **Settings → Change password**, and update your name and the school details.

## 4. Day-to-day workflow

1. **Students** → *Add student* (roll number + password). Students log in with their **roll number or username**.
2. **Question Bank** → add questions or *Import Excel* (download the template on that page).
   Fill the optional **Source** column (e.g. `JNVST 2024`) for previous-year papers. They then appear under
   *Schedule Mock → Previous year paper*.
3. **Practice Sets** → create focused sets. They appear on every student's Practice page.
4. **Schedule Mock** → pick questions, date and duration. The test starts as *Scheduled*.
5. **Mock Tests** → press **Go live** when students are seated. Press **Complete** when the exam is over:
   - any student who did not press Submit is graded automatically,
   - students can then see the answer key and explanations on their Result page.
6. **Reports / Weak Students / Merit List**: class analysis. *Reports → Export report* downloads an Excel file.

## 5. How the exam is protected

- Answer keys are never sent to student devices during a test. Scoring happens on the server.
- The timer is set by the server. Reloading the page or changing the device clock does not add time.
- Answers are saved automatically every few seconds and retried if the Wi-Fi drops.
  If a computer crashes, the student logs in again and presses **Resume Test**.
- Questions that are in an upcoming or live test are hidden from Practice mode.
- Deactivated students cannot log in.
- Idle sessions log out automatically (configurable in Settings). Logout never happens during an exam.

## 6. Exam-day checklist

- [ ] Test the lab internet; open the site on one machine and log in as a student.
- [ ] Confirm the test shows *Scheduled* with the correct number of questions.
- [ ] Students log in and wait on the **Mock Tests** page.
- [ ] Press **Go live** and ask students to press **Refresh Tests**, then **Start Test Now**.
- [ ] After the time is up, press **Complete** on the test.
