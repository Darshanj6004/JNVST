import { Link } from "react-router";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Dumbbell,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { Badge, Button, Card, CardBody, CardHeader, ProgressBar } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { ProgressRing, ScoreTrend } from "@/charts";
import { currentStudent } from "@/data/users";
import { attempts, scoreHistory, topicPerformance } from "@/data/analytics";
import { mockTests } from "@/data/mockTests";
import { formatDateTime, relativeTime } from "@/lib/format";

const bandMeta = {
  strong: { tone: "success" as const, label: "Strong" },
  average: { tone: "warning" as const, label: "Average" },
  weak: { tone: "danger" as const, label: "Weak" },
};

export default function StudentDashboard() {
  const strong = topicPerformance.filter((t) => t.band === "strong");
  const weak = topicPerformance.filter((t) => t.band === "weak");
  const upcoming = mockTests.filter((m) => m.status === "upcoming" || m.status === "live");
  const lastMock = attempts.find((a) => a.kind === "mock");

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Namaste, ${currentStudent.name.split(" ")[0]} 👋`}
        description="Here's how your JNVST preparation is shaping up today."
        actions={
          <Link to="/student/practice">
            <Button leftIcon={<Dumbbell className="size-4" />}>Start practice</Button>
          </Link>
        }
      />

      {/* Top row: score ring + stats */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardBody className="flex items-center gap-5">
            <ProgressRing value={lastMock?.percentage ?? 0} sublabel="Last mock" />
            <div>
              <p className="text-sm text-muted">Latest mock score</p>
              <p className="text-2xl font-semibold text-ink tabular">
                {lastMock?.score}
                <span className="text-base text-muted">/100</span>
              </p>
              <p className="mt-1.5 flex items-center gap-1 text-[13px] font-medium text-success">
                <TrendingUp className="size-3.5" /> +7 pts vs previous
              </p>
            </div>
          </CardBody>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3 lg:col-span-2">
          {[
            { label: "Questions solved", value: "470", icon: Target, accent: "bg-brand-50 text-brand-600" },
            { label: "Avg. accuracy", value: "72%", icon: CheckCircle2, accent: "bg-[var(--color-success-soft)] text-success" },
            { label: "Class rank", value: "#4", icon: Trophy, accent: "bg-[var(--color-warning-soft)] text-warning" },
          ].map((s) => (
            <Card key={s.label}>
              <CardBody>
                <div className={`flex size-10 items-center justify-center rounded-xl ${s.accent}`}>
                  <s.icon className="size-5" />
                </div>
                <p className="mt-4 text-2xl font-semibold text-ink tabular leading-none">{s.value}</p>
                <p className="mt-1.5 text-[13px] text-muted">{s.label}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      {/* Progress chart + upcoming */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Progress over time"
            subtitle="Your mock score vs the class average"
            action={
              <Link to="/student/progress">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="size-4" />}>
                  Details
                </Button>
              </Link>
            }
          />
          <CardBody>
            <ScoreTrend data={scoreHistory} />
            <div className="mt-4 flex items-center gap-5 text-[13px]">
              <span className="flex items-center gap-2 text-ink">
                <span className="h-0.5 w-4 rounded bg-brand-500" /> Your score
              </span>
              <span className="flex items-center gap-2 text-muted">
                <span className="h-0.5 w-4 rounded border-t-2 border-dashed border-slate-400" /> Class average
              </span>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Upcoming mocks" subtitle={`${upcoming.length} scheduled`} />
          <CardBody className="space-y-3">
            {upcoming.map((m) => (
              <div key={m.id} className="rounded-xl border border-line p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-ink">{m.title}</p>
                  <Badge tone={m.status === "live" ? "success" : "brand"} dot>
                    {m.status === "live" ? "Live" : "Upcoming"}
                  </Badge>
                </div>
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
                  <CalendarClock className="size-3.5" /> {formatDateTime(m.scheduledFor)}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {m.totalQuestions} Q · {m.totalMarks} marks · {m.durationMin} min
                </p>
              </div>
            ))}
            <Link to="/student/mock-tests" className="block">
              <Button variant="secondary" block size="sm">
                View all mock tests
              </Button>
            </Link>
          </CardBody>
        </Card>
      </div>

      {/* Topics + recent activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Topic performance" subtitle="Where you're strong and what needs work" />
          <CardBody className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-success">
                <span className="size-2 rounded-full bg-success" /> Strong topics
              </p>
              <div className="space-y-3">
                {strong.slice(0, 3).map((t) => (
                  <TopicRow key={t.topicId} label={t.topic} value={t.accuracy} tone="success" />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-danger">
                <span className="size-2 rounded-full bg-danger" /> Needs practice
              </p>
              <div className="space-y-3">
                {weak.slice(0, 3).map((t) => (
                  <TopicRow key={t.topicId} label={t.topic} value={t.accuracy} tone="danger" />
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Recent activity" />
          <CardBody className="space-y-1">
            {attempts.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-lg px-1 py-2">
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                    a.kind === "mock" ? "bg-brand-50 text-brand-600" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {a.kind === "mock" ? <ClipboardIcon /> : <Dumbbell className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">{a.label}</p>
                  <p className="text-xs text-muted">{relativeTime(a.date)}</p>
                </div>
                <Badge tone={bandMeta[bandFromPct(a.percentage)].tone}>{a.percentage}%</Badge>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function bandFromPct(p: number): "strong" | "average" | "weak" {
  if (p >= 75) return "strong";
  if (p >= 50) return "average";
  return "weak";
}

function TopicRow({ label, value, tone }: { label: string; value: number; tone: "success" | "danger" }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[13px]">
        <span className="text-ink">{label}</span>
        <span className="font-medium text-muted tabular">{value}%</span>
      </div>
      <ProgressBar value={value} tone={tone} />
    </div>
  );
}

function ClipboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-4" stroke="currentColor" strokeWidth={2}>
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M9 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3" />
    </svg>
  );
}
