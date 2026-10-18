import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import {
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Square,
  Trash2,
} from "lucide-react";
import { Badge, Button, Card, CardBody, CardHeader, useToast } from "@/ui";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/lib/supabaseClient";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";

type DBTest = {
  id: string;
  title: string;
  pattern: string;
  duration_minutes: number;
  total_questions: number;
  total_marks: number;
  scheduled_at: string | null;
  status: "draft" | "scheduled" | "live" | "completed";
  created_at: string;
};

type AttemptCounts = Record<string, number>;

const STATUS_META: Record<string, { tone: "neutral" | "brand" | "success" | "warning" | "danger"; label: string }> = {
  draft: { tone: "neutral", label: "Draft" },
  scheduled: { tone: "brand", label: "Scheduled" },
  live: { tone: "success", label: "Live" },
  completed: { tone: "neutral", label: "Completed" },
};

export default function MockTestManagement() {
  const { toast } = useToast();
  const [tests, setTests] = useState<DBTest[]>([]);
  const [counts, setCounts] = useState<AttemptCounts>({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DBTest | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    const { data: testData, error } = await sb
      .from("mock_tests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ type: "error", title: "Failed to load tests", message: error.message });
      setLoading(false);
      return;
    }

    setTests((testData as DBTest[]) ?? []);

    // Get submission counts per test
    const { data: attemptData } = await sb
      .from("exam_attempts")
      .select("mock_test_id")
      .eq("status", "submitted");

    const countMap: AttemptCounts = {};
    for (const a of (attemptData ?? []) as { mock_test_id: string }[]) {
      countMap[a.mock_test_id] = (countMap[a.mock_test_id] ?? 0) + 1;
    }
    setCounts(countMap);

    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (test: DBTest, newStatus: "scheduled" | "live" | "completed") => {
    setUpdating(test.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("mock_tests")
      .update({ status: newStatus })
      .eq("id", test.id);

    if (error) {
      toast({ type: "error", title: "Failed to update", message: error.message });
    } else {
      setTests((prev) => prev.map((t) => t.id === test.id ? { ...t, status: newStatus } : t));
      const labels: Record<string, string> = {
        live: "Test is now live — students can start!",
        completed: "Test closed. Results are locked.",
        scheduled: "Test moved back to scheduled.",
      };
      toast({ type: "success", title: `Status → ${newStatus}`, message: labels[newStatus] ?? "" });

      // If going live, send a notification to all students
      if (newStatus === "live") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("notifications").insert({
          title: `Mock test is now live: ${test.title}`,
          body: `The test "${test.title}" is open. Attempt it before it closes!`,
          type: "test",
          target_role: "student",
        });
      }
    }
    setUpdating(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("mock_tests")
      .delete()
      .eq("id", deleteTarget.id);

    if (error) {
      toast({ type: "error", title: "Delete failed", message: error.message });
    } else {
      setTests((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      toast({ type: "success", title: "Test deleted" });
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  const total = tests.length;
  const live = tests.filter((t) => t.status === "live").length;
  const scheduled = tests.filter((t) => t.status === "scheduled").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mock tests"
        description="Schedule, activate, and close mock tests for your students."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              leftIcon={<RefreshCw className={cn("size-4", loading && "animate-spin")} />}
              onClick={load}
              disabled={loading}
            />
            <Link to="/teacher/mock-tests/new">
              <Button leftIcon={<Plus className="size-4" />}>Create test</Button>
            </Link>
          </div>
        }
      />

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total tests", value: total, icon: FileText, cls: "bg-brand-50 text-brand-600" },
          { label: "Live now", value: live, icon: Play, cls: "bg-[var(--color-success-soft)] text-success" },
          { label: "Scheduled", value: scheduled, icon: CalendarClock, cls: "bg-[var(--color-warning-soft)] text-warning" },
        ].map((s) => (
          <Card key={s.label}>
            <CardBody className="flex items-center gap-3">
              <span className={cn("flex size-10 items-center justify-center rounded-xl", s.cls)}>
                <s.icon className="size-5" />
              </span>
              <div>
                <p className="text-2xl font-semibold text-ink tabular">{s.value}</p>
                <p className="text-[13px] text-muted">{s.label}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Tests list */}
      {loading ? (
        <div className="flex flex-col items-center gap-3 py-20 text-muted">
          <FileText className="size-8 animate-pulse text-brand-400" />
          <p className="text-sm">Loading tests…</p>
        </div>
      ) : tests.length === 0 ? (
        <Card>
          <CardBody className="flex flex-col items-center gap-3 py-16 text-center">
            <FileText className="size-10 text-slate-200" />
            <p className="text-sm font-medium text-muted">No tests yet</p>
            <Link to="/teacher/mock-tests/new">
              <Button leftIcon={<Plus className="size-4" />} size="sm">Create your first test</Button>
            </Link>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-3">
          {tests.map((t) => {
            const meta = STATUS_META[t.status] ?? STATUS_META.draft;
            const submCount = counts[t.id] ?? 0;
            const isUpdating = updating === t.id;

            return (
              <Card key={t.id}>
                <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <span className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-xl",
                      t.status === "live" ? "bg-[var(--color-success-soft)] text-success" :
                      t.status === "completed" ? "bg-slate-100 text-slate-400" :
                      "bg-brand-50 text-brand-600"
                    )}>
                      {t.status === "completed" ? <CheckCircle2 className="size-5" /> : <FileText className="size-5" />}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[15px] font-semibold text-ink">{t.title}</h3>
                        <Badge tone={meta.tone} dot={t.status === "live"}>{meta.label}</Badge>
                        <Badge tone="neutral">{t.pattern}</Badge>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted">
                        <span className="flex items-center gap-1.5">
                          <FileText className="size-3.5" /> {t.total_questions} Q · {t.total_marks} marks
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="size-3.5" /> {t.duration_minutes} min
                        </span>
                        {t.scheduled_at && (
                          <span className="flex items-center gap-1.5">
                            <CalendarClock className="size-3.5" /> {formatDateTime(t.scheduled_at)}
                          </span>
                        )}
                        {submCount > 0 && (
                          <span className="font-medium text-ink">
                            {submCount} submitted
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {isUpdating && <Loader2 className="size-4 animate-spin text-brand-400" />}

                    {/* Status controls */}
                    {t.status === "scheduled" && (
                      <Button
                        size="sm"
                        leftIcon={<Play className="size-3.5" />}
                        disabled={isUpdating}
                        onClick={() => changeStatus(t, "live")}
                      >
                        Go live
                      </Button>
                    )}
                    {t.status === "live" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        leftIcon={<Square className="size-3.5" />}
                        disabled={isUpdating}
                        onClick={() => changeStatus(t, "completed")}
                      >
                        Close test
                      </Button>
                    )}
                    {t.status === "completed" && (
                      <Link to={`/teacher/merit-list`}>
                        <Button size="sm" variant="secondary" rightIcon={<ChevronRight className="size-4" />}>
                          Results
                        </Button>
                      </Link>
                    )}
                    {t.status === "draft" && (
                      <Button
                        size="sm"
                        disabled={isUpdating}
                        onClick={() => changeStatus(t, "scheduled")}
                      >
                        Publish
                      </Button>
                    )}

                    <button
                      onClick={() => setDeleteTarget(t)}
                      className="flex size-8 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-red-50 hover:text-danger"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        tone="danger"
        title="Delete test?"
        confirmLabel="Yes, delete"
        description={
          <span>
            This will permanently delete <strong className="text-ink">{deleteTarget?.title}</strong> and all associated
            question links. Student attempt records will be kept.
          </span>
        }
      />
    </div>
  );
}
