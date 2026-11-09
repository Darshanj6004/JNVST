import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  CalendarPlus,
  Database,
  FileBarChart,
  GaugeCircle,
  Layers,
  TriangleAlert,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import { Avatar, Badge, Button, Card, CardBody, CardHeader, ProgressBar, StatCard } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { AccuracyBars, ScoreTrend } from "@/charts";
import { formatDateTime } from "@/lib/format";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/auth";
import { finalizeExpiredAttempts, rpc, SUBJECT_LABELS, type StudentSummary, type TestSummary } from "@/lib/api";
import { useSettings } from "@/lib/useSettings";

const quickActions = [
  { icon: UserPlus, label: "Add student", to: "/teacher/students/new" },
  { icon: Database, label: "Add question", to: "/teacher/questions/new" },
  { icon: CalendarPlus, label: "Schedule mock", to: "/teacher/mock-tests/new" },
  { icon: Layers, label: "Practice set", to: "/teacher/practice-sets" },
  { icon: Upload, label: "Import Excel", to: "/teacher/questions/import" },
];

type WeakTopic = { subject: string; topic: string; accuracy: number; total: number };

export default function TeacherDashboard() {
  const { user } = useAuth();
  const settings = useSettings();

  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [active, setActive] = useState<TestSummary[]>([]);
  const [classAvg, setClassAvg] = useState<number | null>(null);
  const [trend, setTrend] = useState<{ label: string; score: number; average: number }[]>([]);
  const [subjectAcc, setSubjectAcc] = useState<{ label: string; value: number }[]>([]);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [attention, setAttention] = useState<StudentSummary[]>([]);

  useEffect(() => {
    (async () => {
      await finalizeExpiredAttempts();

      supabase
        .from("questions")
        .select("id", { count: "exact", head: true })
        .then(({ count }) => setQuestionCount(count ?? 0));

      try {
        const [tests, topics, students] = await Promise.all([
          rpc<TestSummary[]>("class_test_summary"),
          rpc<{ subject_code: string; topic_name: string; total: number; correct: number }[]>("class_topic_stats", {
            p_test_id: null,
          }),
          rpc<StudentSummary[]>("class_student_summary"),
        ]);

        setStudentCount((students ?? []).length);
        setActive(
          (tests ?? [])
            .filter((t) => t.status === "live" || t.status === "scheduled")
            .sort((x, y) => Number(y.status === "live") - Number(x.status === "live")),
        );

        const taken = (tests ?? []).filter((t) => t.attempts > 0);
        const n = taken.reduce((acc, t) => acc + t.attempts, 0);
        setClassAvg(
          n > 0 ? Math.round(taken.reduce((acc, t) => acc + Number(t.avg_pct ?? 0) * t.attempts, 0) / n) : null,
        );
        setTrend(
          taken.slice(-8).map((t) => ({
            label: t.title.length > 12 ? t.title.slice(0, 12) + "…" : t.title,
            score: Math.round(Number(t.max_pct ?? 0)),
            average: Math.round(Number(t.avg_pct ?? 0)),
          })),
        );

        const sub: Record<string, { c: number; t: number }> = {};
        for (const r of topics ?? []) {
          sub[r.subject_code] ??= { c: 0, t: 0 };
          sub[r.subject_code].c += r.correct;
          sub[r.subject_code].t += r.total;
        }
        setSubjectAcc(
          Object.entries(sub).map(([code, v]) => ({
            label: SUBJECT_LABELS[code] ?? code,
            value: v.t ? Math.round((v.c / v.t) * 100) : 0,
          })),
        );
        setWeakTopics(
          (topics ?? [])
            .filter((r) => r.total >= 3)
            .map((r) => ({
              subject: SUBJECT_LABELS[r.subject_code] ?? r.subject_code,
              topic: r.topic_name,
              accuracy: Math.round((r.correct / r.total) * 100),
              total: r.total,
            }))
            .sort((x, y) => x.accuracy - y.accuracy)
            .slice(0, 6),
        );
        setAttention(
          (students ?? [])
            .filter((r) => r.tests_taken > 0)
            .sort((x, y) => Number(x.avg_pct ?? 0) - Number(y.avg_pct ?? 0))
            .slice(0, 5),
        );
      } catch {
        /* empty states are shown */
      }
    })();
  }, []);

  const teacherName = user?.name?.split(" ")[0] ?? "Teacher";
  const tone = (v: number) =>
    v < settings.weak_threshold ? "danger" : v < settings.strong_threshold ? "warning" : "success";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Namaste, ${teacherName} 🙏`}
        description="Class overview — everything you need to run JNVST prep."
        actions={
          <Link to="/teacher/mock-tests/new">
            <Button leftIcon={<CalendarPlus className="size-4" />}>Schedule mock test</Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total students"
          value={studentCount === null ? "—" : String(studentCount)}
          icon={<Users className="size-5" />}
          hint="active accounts"
        />
        <StatCard
          label="Questions in bank"
          value={questionCount === null ? "—" : String(questionCount)}
          icon={<Database className="size-5" />}
          accent="brand"
          hint="across 3 subjects"
        />
        <StatCard
          label="Active tests"
          value={String(active.length)}
          icon={<FileBarChart className="size-5" />}
          accent="warning"
          hint="live & upcoming"
        />
        <StatCard
          label="Class average"
          value={classAvg === null ? "—" : `${classAvg}%`}
          icon={<GaugeCircle className="size-5" />}
          accent="success"
          hint={classAvg === null ? "after first mock" : "across all mock tests"}
        />
      </div>

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
          <CardHeader title="Class performance trend" subtitle="Highest and average % in recent mock tests" />
          <CardBody>
            {trend.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted">
                The trend appears after the first mock test is submitted.
              </p>
            ) : (
              <ScoreTrend data={trend} height={260} scoreLabel="Highest" averageLabel="Class average" />
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Accuracy by subject" subtitle="All submitted mock tests" />
          <CardBody>
            {subjectAcc.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted">No data yet.</p>
            ) : (
              <AccuracyBars data={subjectAcc} height={260} />
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Students needing attention"
            subtitle="Lowest average across mock tests"
            action={
              <Link to="/teacher/weak-students">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="size-4" />}>
                  All
                </Button>
              </Link>
            }
          />
          <CardBody className="space-y-1">
            {attention.length === 0 ? (
              <p className="text-sm text-muted py-4 text-center">
                Appears after students submit their first mock test.
              </p>
            ) : (
              attention.map((s) => {
                const avg = Math.round(Number(s.avg_pct ?? 0));
                return (
                  <div key={s.student_id} className="flex items-center gap-3 rounded-lg px-1 py-2">
                    <Avatar name={s.full_name} color={s.avatar_color} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{s.full_name}</p>
                      <p className="text-xs text-muted">
                        {s.roll_number ? `Roll ${s.roll_number}` : "No roll number"} · {s.tests_taken} tests
                      </p>
                    </div>
                    <Badge tone={tone(avg)}>{avg}%</Badge>
                  </div>
                );
              })
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Active & upcoming tests"
            action={
              <Link to="/teacher/mock-tests">
                <Button variant="ghost" size="sm">
                  Manage
                </Button>
              </Link>
            }
          />
          <CardBody className="space-y-3">
            {active.length === 0 ? (
              <p className="text-sm text-muted py-4 text-center">No active tests — schedule one now.</p>
            ) : (
              active.map((m) => (
                <div
                  key={m.mock_test_id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line p-3.5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-ink">{m.title}</p>
                      <Badge tone={m.status === "live" ? "success" : "brand"} dot>
                        {m.status === "live" ? "Live" : "Upcoming"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {m.scheduled_at ? formatDateTime(m.scheduled_at) : "Not scheduled"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-ink tabular">
                      {m.attempts}/{studentCount ?? "—"}
                    </p>
                    <p className="text-xs text-muted">submitted</p>
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Weakest topics across class" subtitle="Prioritise these in upcoming practice sets" />
        <CardBody className="grid gap-3 sm:grid-cols-3">
          {weakTopics.length === 0 ? (
            <p className="col-span-full py-4 text-center text-sm text-muted">
              Topic analysis appears after mock tests are submitted.
            </p>
          ) : (
            weakTopics.map((t) => (
              <div key={`${t.subject}-${t.topic}`} className="rounded-xl border border-line p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-ink">{t.topic}</p>
                  {tone(t.accuracy) === "danger" && <TriangleAlert className="size-4 shrink-0 text-danger" />}
                </div>
                <p className="text-xs text-muted">
                  {t.subject} · {t.total} answers
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <ProgressBar value={t.accuracy} tone={tone(t.accuracy)} />
                  <span className="text-xs font-medium text-muted tabular">{t.accuracy}%</span>
                </div>
              </div>
            ))
          )}
        </CardBody>
      </Card>
    </div>
  );
}
