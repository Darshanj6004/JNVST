import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowUpRight, RefreshCw, TrendingDown, TriangleAlert } from "lucide-react";
import { Avatar, Button, Card, CardBody, ProgressBar, Table, TH, THead, TR, TD } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/cn";

type WeakStudent = {
  student_id: string;
  full_name: string;
  roll_number: string | null;
  class_name: string | null;
  avatar_color: string;
  avg_score_pct: number;
  attempts: number;
};

export default function WeakStudents() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<WeakStudent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    // Get all submitted attempts grouped by student
    const { data } = await sb
      .from("exam_attempts")
      .select("student_id, score, mock_tests(total_marks), profiles(full_name, roll_number, class_name, avatar_color)")
      .eq("status", "submitted");

    if (!data) { setLoading(false); return; }

    // Aggregate per student
    const map: Record<string, {
      full_name: string;
      roll_number: string | null;
      class_name: string | null;
      avatar_color: string;
      totalPct: number;
      count: number;
    }> = {};

    for (const a of data as {
      student_id: string;
      score: number;
      mock_tests: { total_marks: number };
      profiles: { full_name: string; roll_number: string | null; class_name: string | null; avatar_color: string };
    }[]) {
      if (!map[a.student_id]) {
        map[a.student_id] = {
          full_name: a.profiles?.full_name ?? "Unknown",
          roll_number: a.profiles?.roll_number ?? null,
          class_name: a.profiles?.class_name ?? null,
          avatar_color: a.profiles?.avatar_color ?? "#2563EB",
          totalPct: 0,
          count: 0,
        };
      }
      const totalMarks = a.mock_tests?.total_marks ?? 100;
      map[a.student_id].totalPct += (a.score / totalMarks) * 100;
      map[a.student_id].count++;
    }

    const weak: WeakStudent[] = Object.entries(map)
      .map(([id, s]) => ({
        student_id: id,
        full_name: s.full_name,
        roll_number: s.roll_number,
        class_name: s.class_name,
        avatar_color: s.avatar_color,
        avg_score_pct: Math.round(s.totalPct / s.count),
        attempts: s.count,
      }))
      .filter((s) => s.avg_score_pct < 60)
      .sort((a, b) => a.avg_score_pct - b.avg_score_pct);

    setStudents(weak);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weak students"
        description="Students averaging below 60% across submitted mock tests."
        actions={
          <Button
            variant="ghost"
            leftIcon={<RefreshCw className={cn("size-4", loading && "animate-spin")} />}
            onClick={load}
            disabled={loading}
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardBody className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--color-danger-soft)] text-danger">
              <TriangleAlert className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-semibold text-ink tabular">{students.length}</p>
              <p className="text-[13px] text-muted">Need attention (&lt;60%)</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--color-warning-soft)] text-warning">
              <TrendingDown className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-semibold text-ink tabular">
                {students.length > 0
                  ? `${Math.round(students.reduce((s, x) => s + x.avg_score_pct, 0) / students.length)}%`
                  : "—"}
              </p>
              <p className="text-[13px] text-muted">Average score of weak group</p>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        {students.length === 0 && !loading ? (
          <CardBody className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <TriangleAlert className="size-8 text-slate-200" />
            <p className="text-sm font-medium text-muted">
              No weak students found — great news!
            </p>
            <p className="text-xs text-slate-400">
              Data appears once students submit mock tests.
            </p>
          </CardBody>
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Student</TH>
                <TH>Class</TH>
                <TH>Avg Score</TH>
                <TH>Tests</TH>
                <TH className="text-right">Action</TH>
              </tr>
            </THead>
            <tbody>
              {students.map((s) => (
                <TR key={s.student_id}>
                  <TD>
                    <div className="flex items-center gap-3">
                      <Avatar name={s.full_name} color={s.avatar_color} size={36} />
                      <div>
                        <p className="font-medium text-ink">{s.full_name}</p>
                        <p className="text-xs text-muted">
                          {s.roll_number ? `Roll ${s.roll_number}` : "No roll number"}
                        </p>
                      </div>
                    </div>
                  </TD>
                  <TD className="text-muted">{s.class_name ?? "—"}</TD>
                  <TD>
                    <div className="flex items-center gap-2">
                      <ProgressBar
                        value={s.avg_score_pct}
                        tone={s.avg_score_pct < 40 ? "danger" : "warning"}
                        className="w-24"
                      />
                      <span className={cn("tabular font-medium", s.avg_score_pct < 40 ? "text-danger" : "text-warning")}>
                        {s.avg_score_pct}%
                      </span>
                    </div>
                  </TD>
                  <TD className="tabular text-muted">{s.attempts}</TD>
                  <TD>
                    <div className="flex justify-end">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate("/teacher/mock-tests/new")}
                        rightIcon={<ArrowUpRight className="size-3.5" />}
                      >
                        Assign practice
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
