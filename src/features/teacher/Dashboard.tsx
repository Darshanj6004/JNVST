import { useEffect, useState } from "react";
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
import { mockTests } from "@/data/mockTests";
import { formatDateTime } from "@/lib/format";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/auth";

const quickActions = [
  { icon: UserPlus, label: "Add student", to: "/teacher/students/new" },
  { icon: Database, label: "Add question", to: "/teacher/questions/new" },
  { icon: CalendarPlus, label: "Schedule mock", to: "/teacher/mock-tests/new" },
  { icon: Upload, label: "Import Excel", to: "/teacher/questions/import" },
];

type WeakStudent = {
  id: string;
  full_name: string;
  roll_number: string | null;
  class_name: string | null;
  avatar_color: string;
};

export default function TeacherDashboard() {
  const { user } = useAuth();
  const active = mockTests.filter((m) => m.status === "live" || m.status === "upcoming");

  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [weakStudents, setWeakStudents] = useState<WeakStudent[]>([]);

  useEffect(() => {
    // Real student count from Supabase
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "student")
      .eq("status", "active")
      .then(({ count }) => setStudentCount(count ?? 0));

    // Real question count
    supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .then(({ count }) => setQuestionCount(count ?? 0));

    // Real student list (latest 4 for "needs attention" panel)
    supabase
      .from("profiles")
      .select("id, full_name, roll_number, class_name, avatar_color")
      .eq("role", "student")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(4)
      .then(({ data }) => setWeakStudents((data as WeakStudent[]) ?? []));
  }, []);

  const teacherName = user?.name?.split(" ")[0] ?? "Teacher";

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
        <StatCard label="Active tests" value={String(active.length)} icon={<FileBarChart className="size-5" />} accent="warning" hint="live & upcoming" />
        <StatCard
          label="Class average"
          value="—"
          icon={<GaugeCircle className="size-5" />}
          accent="success"
          hint="after first mock"
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
          <CardHeader title="Class performance trend" subtitle="Average mock score over recent weeks (demo data until first tests complete)" />
          <CardBody>
            <ScoreTrend data={scoreHistory} height={260} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Accuracy by subject" subtitle="Demo data" />
          <CardBody>
            <AccuracyBars data={subjectAccuracy.map((s) => ({ label: s.subject.split(" ")[0], value: s.accuracy }))} height={260} />
          </CardBody>
        </Card>
      </div>

      {/* Recent students + weak topics */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Recent students"
            subtitle="Latest enrolled students"
            action={
              <Link to="/teacher/students">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="size-4" />}>
                  All
                </Button>
              </Link>
            }
          />
          <CardBody className="space-y-1">
            {weakStudents.length === 0 ? (
              <p className="text-sm text-muted py-4 text-center">No students yet — add your first student.</p>
            ) : (
              weakStudents.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-lg px-1 py-2">
                  <Avatar name={s.full_name} color={s.avatar_color} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{s.full_name}</p>
                    <p className="text-xs text-muted">
                      {s.roll_number ? `Roll ${s.roll_number}` : "No roll number"}
                      {s.class_name ? ` · ${s.class_name}` : ""}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>

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
            {active.length === 0 ? (
              <p className="text-sm text-muted py-4 text-center">No active tests — schedule one now.</p>
            ) : (
              active.map((m) => (
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
              ))
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Weakest topics across class" subtitle="Prioritise these in upcoming practice sets (demo data)" />
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
