# JNVST Digital Scholarship & Examination Platform

## Context

The project is a blank Figma Make scaffold (React 19 + Vite + Tailwind v4, `@` → `src`, no router/chart/UI libs). The brief and the attached SRS (`src/imports/SRS_Digital_Scholarship_Platform.docx`) ask for a premium, production-feeling web app for JNVST exam prep with three areas: Public, Student portal, Teacher portal, plus a Design System showcase.

Key domain facts pulled from the SRS to keep content authentic:
- Two roles: **Teacher** (sole admin; creates student accounts — no self-registration, students can't change password) and **Student** (learning consumer).
- **JNVST pattern (strict):** 80 questions / 100 marks / 120 minutes. Sections: Mental Ability (40 Q, 50 marks), Arithmetic (20 Q, 25), Language (20 Q, 25). 1.25 marks/question, **no negative marking**, single attempt, auto-submit on timer expiry.
- **Practice Mode:** untimed, Subject → Topic → Difficulty (Easy/Medium/Hard/Combined), immediate feedback + correct answer/explanation.
- Subjects/topics: Mental Ability (Analogy, Classification, Series, Pattern Recognition, Visual Reasoning, Coding-Decoding, Mirror & Water Images, Embedded Figures), Arithmetic (Number System, Add/Sub/Mul/Div, Fractions, Geometry, Measurement, Data Interpretation), Language.

**Approach chosen by user: depth-first.** Fully polish the core flows; represent remaining screens as clean, on-brand, solid screens (real layout + mock data, lighter interactivity).

## Aesthetic

Minimal handcrafted SaaS (Stripe / Linear / Notion). Inter font. 8px spacing rhythm, 12–16px radii, soft shadows. Tokens: Primary `#2563EB`, Background `#F8FAFC`, Surface `#FFFFFF`, Text `#0F172A`, Secondary `#64748B`, Border `#E5E7EB`. Responsive, desktop-1440 first with tablet/mobile behavior on key screens.

Before writing UI, invoke `aesthetic-stance` and issue a `create_make_theme` call (full multi-section product). Invoke `dataviz` before writing charts and `react-router` before wiring routes.

## Fully-polished core flows (depth)
- Public: **Welcome/landing**, **Login** (segmented Teacher/Student), **404**.
- Student: **Dashboard**, **Live Exam** (120-min countdown, question palette, mark-for-review, confirm-submit, auto-submit), **Practice** selection → questions → results.
- Teacher: **Dashboard**, **Question Bank** + Add/Edit Question.

## Represented cleanly (breadth, real layout + mock data)
- Student: Mock Test List, Instructions, Result, Progress Analytics, Profile, Notifications.
- Teacher: Student Management, Create/Edit Student, Reset Password, Excel Import, Create Practice Set, Create & Schedule Mock Test, Reports, Weak Students, Merit List, Settings.
- **Design System** showcase page.

## Architecture

Install `react-router-dom`, `recharts`, `lucide-react`. Tokens go in `src/index.css` via Tailwind v4 `@theme` (colors, radius, shadows, Inter wiring — Inter added per repo convention).

```
src/
  App.tsx                 <RouterProvider/>
  routes/router.tsx       nested route tree (lazy)
  routes/guards.tsx       RequireAuth / RequireRole
  app/  AppShell.tsx  Sidebar.tsx  Navbar.tsx      (shared shell, nav-config driven)
  layouts/ PublicLayout  StudentLayout  TeacherLayout  ExamLayout(full-screen)
  ui/    primitives = the design system: Button, Input, Select, SearchInput,
         Textarea, Checkbox, Radio, Card, Table, Badge, Modal, Toast(+provider),
         Pagination, Tabs, Avatar, Dropdown, Tooltip, Spinner, EmptyState,
         StatCard, ProgressBar, Skeleton, FileDropzone  (+ index.ts barrel)
  charts/ LineChart, BarChart, DonutChart (recharts wrappers) + hand SVG ProgressRing/Sparkline
  components/ PageHeader, DataTable, FilterBar, ConfirmDialog,
              QuestionCard, QuestionPalette, TimerBadge
  features/ public/*  student/*  teacher/*  design-system/ShowcasePage
  data/    users, subjects, questions, mockTests, attempts, analytics,
           notifications, reports  (typed, internally consistent, stable ids)
  lib/     auth.tsx (mock AuthProvider), format.ts, hooks.ts (useCountdown,
           usePagination), nav.ts (studentNav/teacherNav)
  types/index.ts
```

Route shape:
```
/                 Welcome        /login  Login        /design-system  Showcase
/student/*  (StudentLayout+AppShell): dashboard, practice, practice/questions,
            practice/results, mock-tests, mock-tests/:id/instructions,
            progress, profile, notifications
/student/exam/:id  Live Exam (ExamLayout, no sidebar)
/teacher/*  (TeacherLayout+AppShell): dashboard, students, students/new,
            students/:id/edit, students/:id/reset-password, questions,
            questions/new, questions/:id/edit, questions/import,
            practice-sets/new, mock-tests/new, reports, weak-students,
            merit-list, settings
*  NotFound
```

One `AppShell` parameterized by a nav config powers both portals; role differences live in `lib/nav.ts` data, not duplicated components. `ExamLayout` is deliberately shell-free (focus mode). Mock `AuthProvider` holds the logged-in user; guards redirect unauthenticated/wrong-role.

## Build ordering
1. Tokens in `index.css` + Inter; `types/`; install deps.
2. `ui/` primitives + `ShowcasePage` (all states: default/hover/active/disabled/error/loading/empty) — visual test harness.
3. `AppShell` + Sidebar + Navbar + layouts + `router.tsx` with placeholder stubs → app fully navigable.
4. `data/` + `AuthProvider` + guards; Welcome, Login, 404.
5. `charts/` wrappers + composed `components/`.
6. Student portal — polish Dashboard, Practice flow, Live Exam; solid rest.
7. Teacher portal — polish Dashboard, Question Bank + Add/Edit; solid rest.
8. Polish: responsive checks on key screens, empty/loading states, global toasts, notification badges.

## Verification
- App auto-reloads on Vite dev server (already running); no manual start.
- Manually walk routes: `/` → login as student → dashboard → practice flow → mock exam (timer counts down, palette + mark-for-review work, confirm-submit → result); login as teacher → dashboard → question bank add/edit; visit `/design-system`, an unknown path (404), and check tablet/mobile widths on Dashboard, Live Exam, and Login.
- Run a typecheck/build only if a broad breakage is suspected.
