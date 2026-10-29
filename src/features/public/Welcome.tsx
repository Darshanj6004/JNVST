import { Link } from "react-router";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  Clock,
  GraduationCap,
  HelpCircle,
  Layers,
  School,
  ShieldCheck,
  Sparkles,
  Timer,
  UserCheck,
  Users,
} from "lucide-react";
import { Badge, Button, Card, CardBody } from "@/ui";

const sections = [
  {
    name: "Mental Ability Test",
    code: "MAT",
    questions: 40,
    marks: 50,
    duration: "60 mins",
    desc: "Pattern completion, analogies, odd-one-out, visual reasoning, and figures.",
  },
  {
    name: "Arithmetic Test",
    code: "ARI",
    questions: 20,
    marks: 25,
    duration: "30 mins",
    desc: "Number systems, four basic operations, fractions, decimals, and measurement.",
  },
  {
    name: "Language Test",
    code: "LAN",
    questions: 20,
    marks: 25,
    duration: "30 mins",
    desc: "Reading comprehension passages, grammar, vocabulary, and sentence completion.",
  },
];

const capabilities = [
  {
    icon: BookOpenCheck,
    title: "Guided Practice Mode",
    body: "Subject and topic-wise practice sets with instant solutions and detailed explanations. Students learn at their own pace without time pressure.",
  },
  {
    icon: Timer,
    title: "Timed Full-Length Mocks",
    body: "120-minute simulations adhering strictly to the 80-question JNVST pattern with question palette, review markers, and automatic submission.",
  },
  {
    icon: BarChart3,
    title: "Accurate Progress Tracking",
    body: "Topic-wise accuracy metrics identify strong areas and concepts needing more practice, giving students clear feedback on their exam readiness.",
  },
  {
    icon: Users,
    title: "Teacher-Administered Platform",
    body: "Teachers provision student accounts, schedule live tests, manage question banks, and review class merit rankings in one secure portal.",
  },
];

export default function Welcome() {
  return (
    <div className="min-h-full bg-canvas text-ink">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand-500 text-white shadow-xs">
              <GraduationCap className="size-5" />
            </span>
            <div className="leading-none">
              <p className="text-[15px] font-bold tracking-tight text-ink">Navodaya Prep</p>
              <p className="text-[11px] font-medium text-muted">JNVST Examination Platform</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button size="md" rightIcon={<ArrowRight className="size-4" />} className="shadow-xs font-semibold">
                Sign In to Portal
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-white to-slate-50/60">
        <div className="hero-dot-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-16 lg:grid-cols-12 lg:items-center lg:py-20">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1 text-xs font-semibold text-brand-700">
              <Sparkles className="size-3.5 text-brand-500" />
              Official Pattern · Class 4 Scholarship & Entrance Practice
            </div>

            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl lg:text-5xl">
              Structured preparation for the <span className="text-brand-600">Jawahar Navodaya</span> entrance exam.
            </h1>

            <p className="max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
              A calm, distraction-free examination platform that provides untimed guided practice, realistic 120-minute mock simulations, and transparent performance insights for students and teachers.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link to="/login">
                <Button size="lg" className="font-bold shadow-sm" rightIcon={<ArrowRight className="size-4" />}>
                  Enter Student Portal
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="secondary" className="font-semibold">
                  Teacher Login
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-3 text-xs font-medium text-slate-600 border-t border-slate-200/80">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-emerald-600" />
                No negative marking
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-4 text-brand-600" />
                120-minute standard exam
              </span>
              <span className="flex items-center gap-1.5">
                <UserCheck className="size-4 text-indigo-600" />
                Teacher-supervised accounts
              </span>
            </div>
          </div>

          {/* Exam Blueprint Card */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-line bg-white p-6 shadow-[var(--shadow-md)]">
              <div className="flex items-center justify-between pb-4 border-b border-line">
                <div>
                  <h2 className="text-sm font-bold text-ink">Official JNVST Exam Pattern</h2>
                  <p className="text-xs text-muted">Class 6 Selection Test Structure</p>
                </div>
                <Badge tone="brand" className="font-semibold">
                  80 Questions · 100 Marks
                </Badge>
              </div>

              <div className="mt-4 space-y-3">
                {sections.map((s) => (
                  <div key={s.name} className="rounded-xl border border-line bg-canvas p-3.5 transition-colors">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-ink">{s.name}</p>
                      <span className="text-sm font-bold text-brand-600 tabular">{s.marks} Marks</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-muted">
                      <span>{s.questions} Questions ({s.duration})</span>
                      <span className="rounded bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                        1.25 marks / Q
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-xl bg-brand-50 p-3.5 text-xs text-brand-800 flex items-center justify-between">
                <span className="font-medium">Total Duration & Scoring</span>
                <span className="font-bold">120 Minutes · Single Paper</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities Section */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="max-w-2xl text-left sm:text-center sm:mx-auto mb-12">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-600">Built for Young Learners</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Everything students need to build exam confidence
          </h2>
          <p className="mt-3 text-sm text-slate-600">
            Carefully structured to reduce exam anxiety and turn paper drills into engaging, interactive learning.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {capabilities.map((c) => (
            <Card key={c.title} className="rounded-2xl border border-line bg-white p-6 shadow-xs hover:border-brand-300 transition-all">
              <CardBody className="p-0">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 shadow-xs mb-4">
                  <c.icon className="size-6" />
                </span>
                <h3 className="text-base font-bold text-ink">{c.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">{c.body}</p>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Portal Access Roles */}
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-line bg-white p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold">
                <GraduationCap className="size-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-ink">Student Experience</h3>
                <p className="text-xs text-muted">Designed specifically for Class 4 learners</p>
              </div>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Simple login with roll number or student username provided by your school.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Untimed subject practice with instant explanation cards for every question.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Clean live exam interface with timer, review palette, and score analysis.</span>
              </li>
            </ul>
            <div className="mt-6 pt-4 border-t border-line">
              <Link to="/login">
                <Button size="sm" className="font-semibold">
                  Sign In as Student
                </Button>
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 font-bold">
                <School className="size-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-ink">Teacher Administration</h3>
                <p className="text-xs text-muted">Complete control over student accounts and testing</p>
              </div>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-4 text-brand-600 shrink-0 mt-0.5" />
                <span>Centralized student account creation and secure password management.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-4 text-brand-600 shrink-0 mt-0.5" />
                <span>Question bank management with LaTeX math and bulk Excel/CSV import.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-4 text-brand-600 shrink-0 mt-0.5" />
                <span>Automated evaluation, class rank merit lists, and weak student identification.</span>
              </li>
            </ul>
            <div className="mt-6 pt-4 border-t border-line">
              <Link to="/login">
                <Button size="sm" variant="secondary" className="font-semibold">
                  Sign In as Teacher
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="mt-12 overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 via-brand-700 to-indigo-800 p-8 text-white shadow-sm sm:p-10">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div className="space-y-2 max-w-xl">
              <h3 className="text-2xl font-bold tracking-tight">Ready to begin today's practice session?</h3>
              <p className="text-xs sm:text-sm text-brand-100 leading-relaxed">
                Log in using your school-provided credentials and start mastering Mental Ability, Arithmetic, and Language questions.
              </p>
            </div>
            <Link to="/login">
              <Button size="lg" variant="secondary" className="font-bold shadow-sm" rightIcon={<ArrowRight className="size-4" />}>
                Go to Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 text-xs text-muted sm:flex-row">
          <div className="flex items-center gap-2">
            <GraduationCap className="size-4 text-brand-600" />
            <span className="font-semibold text-ink">Navodaya Prep</span>
            <span>· Jawahar Navodaya Vidyalaya Selection Test Platform</span>
          </div>
          <p>© 2026 Digital Scholarship Examination Portal</p>
        </div>
      </footer>
    </div>
  );
}
