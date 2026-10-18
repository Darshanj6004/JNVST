import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { CalendarClock, ChevronRight, Clock, FileText, RefreshCw } from "lucide-react";
import { Badge, Button, Card, CardBody, Tabs, type TabItem, useToast } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { formatDateTime } from "@/lib/format";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";

type DBMockTest = {
  id: string;
  title: string;
  pattern: "JNVST" | "Manual";
  duration_minutes: number;
  total_questions: number;
  total_marks: number;
  scheduled_at: string | null;
  status: "draft" | "scheduled" | "live" | "completed";
};

type AttemptMap = Record<string, { score: number | null; status: string }>;

const statusMeta: Record<string, { tone: "brand" | "success" | "neutral" | "danger" | "warning"; label: string }> = {
  scheduled: { tone: "brand", label: "Upcoming" },
  live: { tone: "success", label: "Live now" },
  completed: { tone: "neutral", label: "Completed" },
  draft: { tone: "warning", label: "Draft" },
};

export default function MockTests() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [tab, setTab] = useState("all");
  const [tests, setTests] = useState<DBMockTest[]>([]);
  const [attempts, setAttempts] = useState<AttemptMap>({});
  const [loading, setLoading] = useState(true);

  const loadTests = useCallback(async () => {
    setLoading(true);

    // Load all non-draft tests
    const { data: testData, error } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from("mock_tests" as any)
      .select("*")
      .neq("status", "draft")
      .order("scheduled_at", { ascending: false });

    if (error) {
      toast({ type: "error", title: "Failed to load tests", message: error.message });
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

  const tabs: TabItem[] = [
    { id: "all", label: "All", count: tests.length },
    {
      id: "available",
      label: "Available",
      count: tests.filter((m) => (m.status === "live" || m.status === "scheduled") && !attempts[m.id]).length,
    },
    {
      id: "completed",
      label: "Completed",
      count: tests.filter((m) => !!attempts[m.id]).length,
    },
  ];

  const filtered = tests.filter((m) => {
    if (tab === "available") return (m.status === "live" || m.status === "scheduled") && !attempts[m.id];
    if (tab === "completed") return !!attempts[m.id];
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mock tests"
        description="Timed simulations that mirror the official JNVST pattern."
        actions={
          <Button
            variant="ghost"
            leftIcon={<RefreshCw className={cn("size-4", loading && "animate-spin")} />}
            onClick={loadTests}
            disabled={loading}
          >
            Refresh
          </Button>
        }
      />
      <Tabs items={tabs} value={tab} onChange={setTab} />

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted">
          <FileText className="size-8 animate-pulse text-brand-400" />
          <p className="text-sm">Loading tests…</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardBody className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <FileText className="size-10 text-slate-200" />
            <p className="text-sm font-medium text-muted">
              {tab === "completed" ? "No completed tests yet" : "No tests available right now"}
            </p>
            <p className="text-xs text-slate-400">
              {tab === "available"
                ? "Your teacher will schedule a mock test soon."
                : "Check back later."}
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((m) => {
            const meta = statusMeta[m.status] ?? { tone: "neutral" as const, label: m.status };
            const attempt = attempts[m.id];
            const canStart = m.status === "live" && !attempt;
            const done = !!attempt;
            return (
              <Card key={m.id}>
                <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      <FileText className="size-5" />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[15px] font-semibold text-ink">{m.title}</h3>
                        <Badge tone={meta.tone} dot={m.status === "live"}>
                          {meta.label}
                        </Badge>
                        <Badge tone="neutral">{m.pattern}</Badge>
                        {done && attempt.status === "submitted" && (
                          <Badge tone="success">Submitted</Badge>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted">
                        <span className="flex items-center gap-1.5">
                          <FileText className="size-3.5" /> {m.total_questions} Q · {m.total_marks} marks
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="size-3.5" /> {m.duration_minutes} min
                        </span>
                        {m.scheduled_at && (
                          <span className="flex items-center gap-1.5">
                            <CalendarClock className="size-3.5" /> {formatDateTime(m.scheduled_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:shrink-0">
                    {done && attempt.score !== null && (
                      <span className="text-sm font-semibold text-ink tabular">
                        {attempt.score}/{m.total_marks}
                      </span>
                    )}
                    {done ? (
                      <Link to={`/student/result/${m.id}`}>
                        <Button variant="secondary" rightIcon={<ChevronRight className="size-4" />}>
                          View result
                        </Button>
                      </Link>
                    ) : canStart ? (
                      <Link to={`/student/mock-tests/${m.id}/instructions`}>
                        <Button rightIcon={<ChevronRight className="size-4" />}>Start test</Button>
                      </Link>
                    ) : m.status === "scheduled" ? (
                      <Button variant="secondary" disabled>
                        Scheduled
                      </Button>
                    ) : (
                      <Button variant="secondary" disabled>
                        Not available
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
