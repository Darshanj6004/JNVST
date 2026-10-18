import { Link } from "react-router";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Clock,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Timer,
  Users,
} from "lucide-react";
import { Button } from "@/ui";

const sections = [
  { name: "Mental Ability", q: 40, m: 50 },
  { name: "Arithmetic", q: 20, m: 25 },
  { name: "Language", q: 20, m: 25 },
];

const features = [
  {
    icon: BookOpenCheck,
    title: "Guided practice mode",
    body: "Pick a subject, topic and difficulty. Unlimited, untimed questions with instant answers and explanations.",
  },
  {
    icon: Timer,
    title: "True-to-pattern mock tests",
    body: "120-minute timed simulations that mirror the official JNVST blueprint — palette, review flags and auto-submit.",
  },
  {
    icon: BarChart3,
    title: "Topic-wise analytics",
    body: "See strong, average and weak topics at a glance, and track improvement across every attempt.",
  },
  {
    icon: Users,
    title: "Teacher-managed classes",
    body: "Teachers create accounts, build the question bank and schedule tests — no student self-registration.",
  },
];

export default function Welcome() {
  return (
    <div className="min-h-full bg-canvas">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-line bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-brand-500 text-white">
              <GraduationCap className="size-5" />
            </span>
            <div className="leading-none">
              <p className="text-[15px] font-semibold tracking-tight">Navodaya Prep</p>
              <p className="text-[11px] font-medium text-muted">Scholarship & Exam Practice</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/design-system" className="hidden sm:block">
              <Button variant="ghost" size="sm">
                Design System
              </Button>
            </Link>
            <Link to="/login">
              <Button size="sm" rightIcon={<ArrowRight className="size-4" />}>
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="hero-dot-grid pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-16 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[13px] font-medium text-brand-700">
              <Sparkles className="size-3.5" /> Built for JNVST · Class 4
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl">
              Practice smarter for the{" "}
              <span className="text-brand-600">Navodaya</span> entrance test.
            </h1>
            <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-slate-600">
              A calm, structured platform that turns paper drills into digital practice, real exam simulations and
              clear progress — so every student walks in prepared.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/login">
                <Button size="lg" rightIcon={<ArrowRight className="size-4" />}>
                  Get started
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="secondary">
                  I'm a teacher
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-muted">
              <span className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-success" /> No negative marking
              </span>
              <span className="flex items-center gap-2">
                <Clock className="size-4 text-brand-500" /> 120-min mocks
              </span>
            </div>
          </div>

          {/* Exam blueprint card */}
          <div className="relative">
            <div className="rounded-[20px] border border-line bg-white p-6 shadow-[var(--shadow-lg)]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">Official JNVST pattern</p>
                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                  80 Q · 100 marks
                </span>
              </div>
              <div className="mt-5 space-y-3">
                {sections.map((s) => (
                  <div key={s.name} className="flex items-center justify-between rounded-xl bg-canvas px-4 py-3.5">
                    <div>
                      <p className="text-sm font-medium text-ink">{s.name}</p>
                      <p className="text-xs text-muted">{s.q} questions</p>
                    </div>
                    <span className="text-sm font-semibold text-ink tabular">{s.m} marks</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                <span className="text-sm text-muted">Total duration</span>
                <span className="text-sm font-semibold text-ink">120 minutes</span>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-5 hidden rounded-2xl border border-line bg-white p-4 shadow-[var(--shadow-md)] sm:block">
              <p className="text-xs text-muted">Class average</p>
              <p className="text-2xl font-semibold text-ink tabular">
                68<span className="text-base text-muted">/100</span>
              </p>
              <p className="mt-0.5 text-xs font-medium text-success">▲ 6 pts this month</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-line bg-white p-6 transition-shadow hover:shadow-[var(--shadow-md)]">
              <div className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <f.icon className="size-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-ink">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{f.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-8 text-white sm:p-10">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-2xl font-semibold tracking-tight">Ready to begin your first practice set?</h3>
              <p className="mt-2 max-w-lg text-brand-100">
                Sign in with the credentials your teacher shared and pick up right where your class left off.
              </p>
            </div>
            <Link to="/login">
              <Button size="lg" variant="secondary" rightIcon={<ArrowRight className="size-4" />}>
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-line py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 text-sm text-muted sm:flex-row">
          <p>© 2026 Navodaya Prep · Z.P.P. School, Kasare</p>
          <p>Scholarship & Competitive Examination Platform</p>
        </div>
      </footer>
    </div>
  );
}
