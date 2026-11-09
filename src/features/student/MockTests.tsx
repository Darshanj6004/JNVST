import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { CalendarClock, ChevronRight, Clock, FileText, RefreshCw } from "lucide-react";
import { Badge, Button, Card, CardBody, Tabs, type TabItem, useToast } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { formatDateTime } from "@/lib/format";
import { supabase } from "@/lib/supabaseClient";
import { finalizeExpiredAttempts } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { useNum, useT } from "@/lib/lang";

type DBMockTest = {
  id: string;
  title: string;
  pattern: "JNVST" | "Manual";
  duration_minutes: number;
  total_questions: number;
  total_marks: number;
  scheduled_at: string | null;
  ends_at: string | null;
  status: "draft" | "scheduled" | "live" | "completed";
};

type AttemptMap = Record<string, { score: number | null; status: string }>;

const statusMeta: Record<string, { tone: "brand" | "success" | "neutral" | "danger" | "warning"; label: string }> = {
  scheduled: { tone: "brand", label: "Upcoming" },
  live: { tone: "success", label: "Live now" },
  completed: { tone: "neutral", label: "Completed" },
  draft: { tone: "warning", label: "Draft" },
};

const STATUS_MR: Record<string, string> = { scheduled: "लवकरच", live: "आता सुरू", completed: "संपली", draft: "मसुदा" };

export default function MockTests() {
  const t = useT();
  const num = useNum();
  const { toast } = useToast();
  const { user } = useAuth();
  const [tab, setTab] = useState("all");
  const [tests, setTests] = useState<DBMockTest[]>([]);
  const [attempts, setAttempts] = useState<AttemptMap>({});
  const [loading, setLoading] = useState(true);

  const loadTests = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    await finalizeExpiredAttempts();

    // Load all non-draft tests
    const { data: testData, error } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from("mock_tests" as any)
      .select("*")
      .neq("status", "draft")
      .order("scheduled_at", { ascending: false });

    if (error) {
      toast({ type: "error", title: t("परीक्षा लोड झाल्या नाहीत", "Failed to load tests"), message: error.message });
      setLoading(false);
      return;
    }

    setTests((testData as DBMockTest[]) ?? []);

    // Load this student's attempts
    if (user?.id) {
      const { data: attemptData } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("exam_attempts" as any)
        .select("mock_test_id, score, status")
        .eq("student_id", user.id);

      const map: AttemptMap = {};
      for (const a of (attemptData as { mock_test_id: string; score: number | null; status: string }[]) ?? []) {
        map[a.mock_test_id] = { score: a.score, status: a.status };
      }
      setAttempts(map);
    }

    setLoading(false);
  }, [user?.id, toast]);

  useEffect(() => { loadTests(); }, [loadTests]);
  // Tests open at their scheduled time: check every 20 seconds.
  useEffect(() => {
    const t = window.setInterval(() => void loadTests(true), 20000);
    return () => window.clearInterval(t);
  }, [loadTests]);

  const tabs: TabItem[] = [
    { id: "all", label: t("सर्व", "All"), count: tests.length },
    {
      id: "available",
      label: t("देता येणाऱ्या", "Available"),
      count: tests.filter((m) => (m.status === "live" || m.status === "scheduled") && attempts[m.id]?.status !== "submitted").length,
    },
    {
      id: "completed",
      label: t("दिलेल्या", "Completed"),
      count: tests.filter((m) => attempts[m.id]?.status === "submitted").length,
    },
  ];

  const filtered = tests.filter((m) => {
    if (tab === "available") return (m.status === "live" || m.status === "scheduled") && attempts[m.id]?.status !== "submitted";
    if (tab === "completed") return attempts[m.id]?.status === "submitted";
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("सराव परीक्षा", "Mock Tests")}
        description={t("नवोदय प्रवेश परीक्षेसारख्याच वेळेच्या पूर्ण सराव परीक्षा.", "Timed full-length exam simulations that mirror the official Navodaya pattern.")}
        actions={
          <Button
            variant="ghost"
            leftIcon={<RefreshCw className={cn("size-4", loading && "animate-spin")} />}
            onClick={() => void loadTests()}
            disabled={loading}
          >
            {t("पुन्हा तपासा", "Refresh Tests")}
          </Button>
        }
      />

      {/* Info notice for students */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-gradient-to-r from-brand-50/70 to-indigo-50/40 p-4 text-xs font-medium text-brand-900 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-brand-500 text-white font-bold text-xs shadow-xs">
            i
          </span>
          <span>
            {t(
              "पूर्ण नवोदय सराव परीक्षेत ८० प्रश्न (१०० गुण) आणि १२० मिनिटे वेळ असतो. चुकीच्या उत्तराला गुण कापले जात नाहीत. शिक्षकांनी ठरवलेल्या वेळी परीक्षा सुरू होते.",
              "A full JNVST mock has 80 questions (100 marks) in 120 minutes with no negative marking. Tests open at the time set by your teacher.",
            )}
          </span>
        </div>
      </div>

      <Tabs items={tabs} value={tab} onChange={setTab} />

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted">
          <FileText className="size-10 animate-pulse text-brand-400" />
          <p className="text-sm font-medium">Checking available mock tests…</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="rounded-2xl border border-line bg-white shadow-xs">
          <CardBody className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <FileText className="size-7" />
            </div>
            <p className="text-base font-bold text-ink">
              {tab === "completed" ? t("अजून एकही परीक्षा दिलेली नाही", "No completed tests yet") : t("सध्या कोणतीही परीक्षा नाही", "No tests available right now")}
            </p>
            <p className="text-xs text-muted max-w-sm">
              {tab === "completed"
                ? t("पहिली परीक्षा दिल्यानंतर तुमचे गुण येथे दिसतील.", "Once you complete your first live mock test, your scores and review sheets will appear here.")
                : t("शिक्षक पुढची परीक्षा ठरवतील. तोपर्यंत सराव करा!", "Your teacher will schedule the next mock test. Feel free to use Practice mode in the meantime!")}
            </p>
            {tab !== "completed" && (
              <Link to="/student/practice" className="mt-2">
                <Button size="sm">{t("सरावाकडे जा", "Go to Practice Mode")}</Button>
              </Link>
            )}
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((m) => {
            const meta = statusMeta[m.status] ?? { tone: "neutral" as const, label: m.status };
            const attempt = attempts[m.id];
            const done = attempt?.status === "submitted";
            const inProgress = attempt?.status === "in_progress";
            const canStart = m.status === "live" && !done;
            const scorePct = done && attempt.score !== null ? Math.round((attempt.score / m.total_marks) * 100) : null;

            return (
              <Card
                key={m.id}
                className={cn(
                  "rounded-2xl border transition-all duration-200 bg-white",
                  canStart
                    ? "border-emerald-300 ring-2 ring-emerald-500/15 shadow-sm"
                    : "border-line hover:border-slate-300 hover:shadow-xs",
                )}
              >
                <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-5">
                  <div className="flex items-start gap-4 min-w-0">
                    <span
                      className={cn(
                        "flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-xs",
                        canStart
                          ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"
                          : done
                            ? "bg-brand-50 text-brand-600"
                            : "bg-slate-100 text-slate-500",
                      )}
                    >
                      <FileText className="size-6" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-ink truncate">{m.title}</h3>
                        <Badge tone={meta.tone} dot={m.status === "live"}>
                          {t(STATUS_MR[m.status] ?? meta.label, meta.label)}
                        </Badge>
                        <Badge tone="neutral" className="text-[11px] font-semibold">{m.pattern}</Badge>
                        {done && (
                          <Badge tone="success" className="text-[11px] font-semibold">
                            {t("दिली", "Completed")}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <FileText className="size-3.5 text-slate-400" /> {t(`${num(m.total_questions)} प्रश्न · ${num(m.total_marks)} गुण`, `${m.total_questions} Questions · ${m.total_marks} Marks`)}
                        </span>
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <Clock className="size-3.5 text-slate-400" /> {t(`${num(m.duration_minutes)} मिनिटे`, `${m.duration_minutes} Minutes`)}
                        </span>
                        {m.scheduled_at && (
                          <span className="flex items-center gap-1 text-slate-600">
                            <CalendarClock className="size-3.5 text-slate-400" />
                            {m.status === "live" && m.ends_at
                              ? t(`${formatDateTime(m.ends_at)} पर्यंत सुरू`, `Open until ${formatDateTime(m.ends_at)}`)
                              : m.ends_at
                                ? `${formatDateTime(m.scheduled_at)} – ${formatDateTime(m.ends_at)}`
                                : formatDateTime(m.scheduled_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {done && attempt.score !== null && (
                      <div className="text-right pr-2">
                        <span className="text-base font-bold text-ink tabular">
                          {num(attempt.score)}/{num(m.total_marks)}
                        </span>
                        <p className={cn("text-[11px] font-semibold tabular", scorePct && scorePct >= 75 ? "text-success" : scorePct && scorePct >= 50 ? "text-warning" : "text-danger")}>
                          {t(`${num(scorePct ?? 0)}% गुण`, `${scorePct}% score`)}
                        </p>
                      </div>
                    )}
                    {done ? (
                      <Link to={`/student/result/${m.id}`}>
                        <Button variant="secondary" rightIcon={<ChevronRight className="size-4" />} size="md">
                          {t("निकाल पाहा", "View Result")}
                        </Button>
                      </Link>
                    ) : canStart ? (
                      <Link to={`/student/mock-tests/${m.id}/instructions`}>
                        <Button
                          rightIcon={<ChevronRight className="size-4" />}
                          size="md"
                          className="bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                        >
                          {inProgress ? t("परीक्षा पुढे सुरू करा", "Resume Test") : t("परीक्षा सुरू करा", "Start Test Now")}
                        </Button>
                      </Link>
                    ) : m.status === "scheduled" ? (
                      <Button variant="secondary" disabled size="md">
                        {m.scheduled_at ? t(`${formatDateTime(m.scheduled_at)} ला सुरू`, `Opens ${formatDateTime(m.scheduled_at)}`) : t("नियोजित", "Scheduled")}
                      </Button>
                    ) : (
                      <Button variant="secondary" disabled size="md">
                        {t("उपलब्ध नाही", "Not Available")}
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
