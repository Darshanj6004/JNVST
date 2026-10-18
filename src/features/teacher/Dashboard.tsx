import { Link } from "react-router";
import {
  ArrowRight,
  CalendarPlus,
  Database,
  FileBarChart,
  GaugeCircle,
  TriangleAlert,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import { Avatar, Badge, Button, Card, CardBody, CardHeader, ProgressBar, StatCard } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { AccuracyBars, ScoreTrend } from "@/charts";
import { scoreHistory, subjectAccuracy, topicPerformance } from "@/data/analytics";
import { students } from "@/data/users";
import { mockTests } from "@/data/mockTests";
import { formatDateTime } from "@/lib/format";

const quickActions = [
  { icon: UserPlus, label: "Add student", to: "/teacher/students/new" },
  { icon: Database, label: "Add question", to: "/teacher/questions/new" },
  { icon: CalendarPlus, label: "Schedule mock", to: "/teacher/mock-tests/new" },
  { icon: Upload, label: "Import Excel", to: "/teacher/questions/import" },
];

export default function TeacherDashboard() {
  const active = mockTests.filter((m) => m.status === "live" || m.status === "upcoming");
  const weak = (students as (typeof students[number] & { _accuracy: number })[])
    .filter((s) => s._accuracy < 55)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Class overview"
        description="Everything you need to run JNVST prep for 4th Standard."
        actions={
          <Link to="/teacher/mock-tests/new">
            <Button leftIcon={<CalendarPlus className="size-4" />}>Schedule mock test</Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total students" value="30" icon={<Users className="size-5" />} trend={{ value: "+2", up: true }} hint="this month" />
        <StatCard
          label="Questions in bank"
          value="312"
          icon={<Database className="size-5" />}
          accent="brand"
          trend={{ value: "+24", up: true }}
          hint="this week"
        />
        <StatCard label="Active tests" value="2" icon={<FileBarChart className="size-5" />} accent="warning" hint="1 live · 1 upcoming" />
        <StatCard
          label="Class average"
          value="68%"
          icon={<GaugeCircle className="size-5" />}
          accent="success"
          trend={{ value: "+6%", up: true }}
          hint="vs last mock"
        />
      </div>

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((a) => (
          <Link key={a.label} to={a.to}>
            <Card className="group transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-[var(--shadow-md)]">
              <CardBody className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <a.icon className="size-5" />
                </span>
                <span className="text-sm font-semibold text-ink">{a.label}</span>
                <ArrowRight className="ml-auto size-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500" />
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Class performance trend" subtitle="Average mock score over recent weeks" />
          <CardBody>
            <ScoreTrend data={scoreHistory} height={260} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Accuracy by subject" />
          <CardBody>
            <AccuracyBars data={subjectAccuracy.map((s) => ({ label: s.subject.split(" ")[0], value: s.accuracy }))} height={260} />
          </CardBody>
        </Card>
      </div>

      {/* Active tests + weak students */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Active & upcoming tests"
            action={
              <Link to="/teacher/mock-tests/new">
                <Button variant="ghost" size="sm">
                  New
                </Button>
              </Link>
            }
          />
          <CardBody className="space-y-3">
            {active.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 rounded-xl border border-line p-3.5">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-ink">{m.title}</p>
                    <Badge tone={m.status === "live" ? "success" : "brand"} dot>
                      {m.status === "live" ? "Live" : "Upcoming"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted">{formatDateTime(m.scheduledFor)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-ink tabular">
                    {m.attempted}/{m.assigned}
                  </p>
                  <p className="text-xs text-muted">attempted</p>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Students needing attention"
            subtitle="Consistently below 55% accuracy"
            action={
              <Link to="/teacher/weak-students">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="size-4" />}>
                  All
                </Button>
              </Link>
            }
          />
          <CardBody className="space-y-1">
            {weak.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-lg px-1 py-2">
                <Avatar name={s.name} color={s.avatarColor} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{s.name}</p>
                  <p className="text-xs text-muted">Roll {s.rollNo} · {s.className}</p>
                </div>
                <div className="w-28">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted">Accuracy</span>
                    <span className="font-medium text-danger tabular">{s._accuracy}%</span>
                  </div>
                  <ProgressBar value={s._accuracy} tone="danger" />
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Weakest topics across class" subtitle="Prioritise these in upcoming practice sets" />
        <CardBody className="grid gap-3 sm:grid-cols-3">
          {topicPerformance
            .filter((t) => t.band === "weak")
            .map((t) => (
              <div key={t.topicId} className="rounded-xl border border-line p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-ink">{t.topic}</p>
                  <TriangleAlert className="size-4 text-danger" />
                </div>
                <p className="text-xs text-muted">{t.subject}</p>
                <div className="mt-3 flex items-center gap-2">
                  <ProgressBar value={t.accuracy} tone="danger" />
                  <span className="text-xs font-medium text-muted tabular">{t.accuracy}%</span>
                </div>
              </div>
            ))}
        </CardBody>
      </Card>
    </div>
  );
}
