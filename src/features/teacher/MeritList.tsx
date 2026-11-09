import { useCallback, useEffect, useState } from "react";
import { Crown, Download, FileSpreadsheet, Medal, RefreshCw, Trophy } from "lucide-react";
import * as XLSX from "xlsx";
import { Avatar, Badge, Button, Card, CardBody, Select, Table, TH, THead, TR, TD, useToast } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/lib/supabaseClient";
import { finalizeExpiredAttempts, rpc } from "@/lib/api";
import { useSettings } from "@/lib/useSettings";
import { printReport } from "@/lib/print";
import { cn } from "@/lib/cn";

type RankedStudent = {
  student_id: string;
  full_name: string;
  roll_number: string | null;
  class_name: string | null;
  avatar_color: string;
  score: number;
  total_correct: number;
  total_attempted: number;
  total_questions: number;
  total_marks: number;
  pct: number;
  rank: number;
  submitted_at: string | null;
};

type DBTest = { id: string; title: string; total_marks: number; scheduled_at: string | null };

const medals = ["#f59e0b", "#94a3b8", "#b45309"];

export default function MeritList() {
  const { toast } = useToast();
  const settings = useSettings();
  const [tests, setTests] = useState<DBTest[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string>("");
  const [ranked, setRanked] = useState<RankedStudent[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all completed/live tests
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    sb.from("mock_tests")
      .select("id, title, total_marks, scheduled_at")
      .in("status", ["live", "completed"])
      .order("scheduled_at", { ascending: false })
      .then(({ data }: { data: DBTest[] }) => {
        const t = data ?? [];
        setTests(t);
        if (t.length > 0) setSelectedTestId(t[0].id);
        else setLoading(false);
      });
  }, []);

  const loadRankings = useCallback(async () => {
    if (!selectedTestId) return;
    setLoading(true);
    await finalizeExpiredAttempts();

    let rows: RankedStudent[] = [];
    try {
      rows = ((await rpc<RankedStudent[]>("merit_list", { p_test_id: selectedTestId })) ?? []).map((r) => ({
        ...r,
        score: Number(r.score),
        total_marks: Number(r.total_marks),
        pct: Number(r.pct),
      }));
    } catch (e) {
      toast({ type: "error", title: "Could not load merit list", message: (e as Error).message });
    }

    setRanked(rows);
    setLoading(false);
  }, [selectedTestId, toast]);

  useEffect(() => {
    if (selectedTestId) loadRankings();
  }, [selectedTestId, loadRankings]);

  const podium = ranked.slice(0, 3);
  const rest = ranked.slice(3);
  const selectedTest = tests.find((t) => t.id === selectedTestId);

  const reportRows = ranked.map((s) => [
    s.rank,
    s.full_name,
    s.roll_number ?? "—",
    s.class_name ?? "—",
    `${s.score} / ${s.total_marks}`,
    `${s.pct}%`,
    s.total_correct,
    `${s.total_attempted} / ${s.total_questions}`,
  ]);
  const avgPct = ranked.length ? Math.round(ranked.reduce((a, s) => a + s.pct, 0) / ranked.length) : 0;

  const downloadPdf = () => {
    if (!selectedTest || ranked.length === 0) return;
    printReport({
      title: `Merit List — ${selectedTest.title}`,
      subtitle: selectedTest.scheduled_at
        ? `Test date: ${new Date(selectedTest.scheduled_at).toLocaleDateString("en-IN", { dateStyle: "long" })}`
        : undefined,
      schoolName: settings.school_name,
      schoolAddress: settings.school_address,
      facts: [
        ["Students appeared", String(ranked.length)],
        ["Highest", `${ranked[0].score} / ${ranked[0].total_marks}`],
        ["Class average", `${avgPct}%`],
      ],
      columns: [
        { label: "Rank", align: "center", width: "48px" },
        { label: "Student name" },
        { label: "Roll No.", align: "center" },
        { label: "Class", align: "center" },
        { label: "Marks", align: "right" },
        { label: "%", align: "right" },
        { label: "Correct", align: "right" },
        { label: "Attempted", align: "right" },
      ],
      rows: reportRows,
      highlightTop: ranked.filter((s) => s.rank <= 3).length,
      footnote: "Students with equal marks share the same rank.",
    });
  };

  const downloadExcel = () => {
    if (!selectedTest || ranked.length === 0) return;
    const ws = XLSX.utils.aoa_to_sheet([
      ["Rank", "Student name", "Roll No.", "Class", "Marks", "%", "Correct", "Attempted"],
      ...reportRows,
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Merit list");
    XLSX.writeFile(wb, `merit-list-${selectedTest.title.replace(/[^\w\u0900-\u097F]+/g, "-")}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Merit list"
        description="Class ranking by score — pulled live from submitted exam attempts."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              leftIcon={<RefreshCw className={cn("size-4", loading && "animate-spin")} />}
              onClick={loadRankings}
              disabled={loading}
            />
            <Button
              variant="secondary"
              leftIcon={<FileSpreadsheet className="size-4" />}
              onClick={downloadExcel}
              disabled={loading || ranked.length === 0}
            >
              Excel
            </Button>
            <Button
              leftIcon={<Download className="size-4" />}
              onClick={downloadPdf}
              disabled={loading || ranked.length === 0}
            >
              Download PDF
            </Button>
          </div>
        }
      />

      {/* Test selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-muted whitespace-nowrap">Select test:</label>
        <div className="w-72">
          <Select
            value={selectedTestId}
            onChange={(e) => setSelectedTestId(e.target.value)}
            disabled={tests.length === 0}
          >
            {tests.length === 0 ? (
              <option>No completed tests yet</option>
            ) : (
              tests.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))
            )}
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted">
          <Trophy className="size-8 animate-pulse text-amber-400" />
          <p className="text-sm">Loading rankings…</p>
        </div>
      ) : ranked.length === 0 ? (
        <Card>
          <CardBody className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <Trophy className="size-10 text-slate-200" />
            <p className="text-sm font-medium text-muted">No submissions yet</p>
            <p className="text-xs text-slate-400">
              Rankings will appear once students submit their attempts.
            </p>
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Podium */}
          {podium.length >= 1 && (
            <div className="grid gap-4 sm:grid-cols-3">
              {podium.map((s, i) => (
                <Card
                  key={s.student_id}
                  className={cn(
                    i === 0 && "ring-1 ring-amber-200 sm:-translate-y-2 sm:order-2",
                    i === 1 && "sm:order-1",
                    i === 2 && "sm:order-3",
                  )}
                >
                  <CardBody className="flex flex-col items-center py-6 text-center">
                    <div className="relative">
                      <Avatar name={s.full_name} color={s.avatar_color} size={64} />
                      <span
                        className="absolute -right-1 -top-1 flex size-7 items-center justify-center rounded-full text-white ring-2 ring-white"
                        style={{ backgroundColor: medals[s.rank - 1] ?? "#64748b" }}
                      >
                        {s.rank === 1 ? <Crown className="size-4" /> : <Medal className="size-4" />}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-ink">{s.full_name}</p>
                    <p className="text-xs text-muted">
                      {s.roll_number ? `Roll ${s.roll_number}` : "—"}
                      {s.class_name ? ` · ${s.class_name}` : ""}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-ink tabular">
                      {s.score}
                      <span className="text-base text-muted">/{s.total_marks}</span>
                    </p>
                    <Badge tone={s.rank === 1 ? "warning" : "neutral"} className="mt-1">
                      Rank {s.rank}
                    </Badge>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}

          {/* Full table */}
          <Card>
            <Table>
              <THead>
                <tr>
                  <TH>Rank</TH>
                  <TH>Student</TH>
                  <TH>Roll No.</TH>
                  <TH>Class</TH>
                  <TH>Score</TH>
                  <TH>%</TH>
                  <TH>Correct</TH>
                  <TH>Attempted</TH>
                </tr>
              </THead>
              <tbody>
                {ranked.map((s) => (
                  <TR key={s.student_id}>
                    <TD>
                      <span
                        className={cn(
                          "inline-flex size-7 items-center justify-center rounded-full text-xs font-bold",
                          s.rank === 1
                            ? "bg-amber-50 text-amber-600"
                            : s.rank === 2
                              ? "bg-slate-100 text-slate-500"
                              : s.rank === 3
                                ? "bg-orange-50 text-orange-600"
                                : "bg-canvas text-muted",
                        )}
                      >
                        {s.rank}
                      </span>
                    </TD>
                    <TD>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={s.full_name} color={s.avatar_color} size={30} />
                        <span className="text-sm font-medium text-ink">{s.full_name}</span>
                      </div>
                    </TD>
                    <TD className="text-muted">{s.roll_number ?? "—"}</TD>
                    <TD className="text-muted">{s.class_name ?? "—"}</TD>
                    <TD>
                      <span className="font-semibold text-ink tabular">
                        {s.score}
                        <span className="text-xs text-muted">/{s.total_marks}</span>
                      </span>
                    </TD>
                    <TD className="tabular">{s.pct}%</TD>
                    <TD className="tabular text-success">{s.total_correct}</TD>
                    <TD className="tabular text-muted">
                      {s.total_attempted}/{s.total_questions}
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
