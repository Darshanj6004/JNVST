import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Activity, ArrowUpRight, Download, FileSpreadsheet, RefreshCw, Search } from "lucide-react";
import * as XLSX from "xlsx";
import { Avatar, Badge, Button, Card, CardBody, Input, Select, StatCard, Table, TD, TH, THead, TR, useToast } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { ago, REGULARITY_META, regularity, rpc, type ActivityRow, type Regularity } from "@/lib/api";
import { useSettings } from "@/lib/useSettings";
import { printReport } from "@/lib/print";
import { cn } from "@/lib/cn";

type SortKey = "status" | "name" | "roll" | "practice" | "last";

export default function StudentActivity() {
  const { toast } = useToast();
  const settings = useSettings();
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Regularity>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("status");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows((await rpc<ActivityRow[]>("class_activity_summary")) ?? []);
    } catch (e) {
      toast({ type: "error", title: "Could not load activity", message: (e as Error).message });
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    const c = { regular: 0, occasional: 0, inactive: 0 };
    rows.forEach((r) => c[regularity(r.practice_days_14)]++);
    return c;
  }, [rows]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    const order: Regularity[] = ["inactive", "occasional", "regular"];
    return rows
      .filter((r) => filter === "all" || regularity(r.practice_days_14) === filter)
      .filter((r) => !q || r.full_name.toLowerCase().includes(q) || (r.roll_number ?? "").includes(q))
      .sort((a, b) => {
        if (sort === "name") return a.full_name.localeCompare(b.full_name);
        if (sort === "roll") return (a.roll_number ?? "").localeCompare(b.roll_number ?? "", undefined, { numeric: true });
        if (sort === "practice") return b.practice_30d - a.practice_30d;
        if (sort === "last") return (b.last_practice_at ?? "").localeCompare(a.last_practice_at ?? "");
        return (
          order.indexOf(regularity(a.practice_days_14)) - order.indexOf(regularity(b.practice_days_14)) ||
          a.practice_days_14 - b.practice_days_14
        );
      });
  }, [rows, filter, search, sort]);

  const tableRows = shown.map((r) => [
    r.full_name,
    r.roll_number ?? "—",
    REGULARITY_META[regularity(r.practice_days_14)].label,
    `${r.practice_days_14} / 14`,
    r.practice_7d,
    r.practice_30d,
    r.practice_accuracy != null ? `${r.practice_accuracy}%` : "—",
    r.sets_done,
    r.tests_taken,
    r.avg_test_pct != null ? `${r.avg_test_pct}%` : "—",
    ago(r.last_practice_at),
    ago(r.last_seen_at),
  ]);
  const columns = [
    "Student", "Roll", "Status", "Practice days (14)", "Sessions 7d", "Sessions 30d",
    "Practice accuracy", "Sets done", "Tests", "Test avg", "Last practice", "Last seen",
  ];

  const exportPdf = () =>
    printReport({
      title: "Student activity report",
      subtitle: "Practice regularity over the last 14 days, practice sessions and mock tests",
      schoolName: settings.school_name,
      schoolAddress: settings.school_address,
      facts: [
        ["Students", String(rows.length)],
        ["Regular", String(counts.regular)],
        ["Occasional", String(counts.occasional)],
        ["Not practising", String(counts.inactive)],
      ],
      columns: columns.map((label, i) => ({ label, align: i >= 3 && i <= 9 ? "right" : "left" })),
      rows: tableRows,
      landscape: true,
      footnote: "Regular = practised on 6+ of the last 14 days · Occasional = 2–5 days · Not practising = 0–1 day",
    });

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([columns, ...tableRows]), "Activity");
    XLSX.writeFile(wb, `student-activity-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student activity"
        description="Who is practising regularly, who needs a nudge, and how every student is doing."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" onClick={() => void load()} disabled={loading} leftIcon={<RefreshCw className={cn("size-4", loading && "animate-spin")} />} />
            <Button variant="secondary" onClick={exportExcel} disabled={loading || rows.length === 0} leftIcon={<FileSpreadsheet className="size-4" />}>
              Excel
            </Button>
            <Button onClick={exportPdf} disabled={loading || rows.length === 0} leftIcon={<Download className="size-4" />}>
              Download PDF
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Students" value={String(rows.length)} icon={<Activity className="size-5" />} hint="active accounts" />
        {(["regular", "occasional", "inactive"] as Regularity[]).map((k) => (
          <button key={k} className="text-left" onClick={() => setFilter(filter === k ? "all" : k)}>
            <StatCard
              label={REGULARITY_META[k].label}
              value={String(counts[k])}
              icon={<Activity className="size-5" />}
              accent={REGULARITY_META[k].tone}
              hint={REGULARITY_META[k].hint}
            />
          </button>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full sm:w-64">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or roll no."
              leftIcon={<Search className="size-4" />}
            />
          </div>
          <div className="w-44">
            <Select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
              <option value="all">All students</option>
              <option value="regular">Regular</option>
              <option value="occasional">Occasional</option>
              <option value="inactive">Not practising</option>
            </Select>
          </div>
          <div className="w-52">
            <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              <option value="status">Sort: needs attention first</option>
              <option value="name">Sort: name</option>
              <option value="roll">Sort: roll number</option>
              <option value="practice">Sort: most practice</option>
              <option value="last">Sort: last practised</option>
            </Select>
          </div>
          <span className="ml-auto text-[13px] text-muted">{shown.length} shown</span>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <THead>
              <tr>
                <TH>Student</TH>
                <TH>Practice regularity</TH>
                <TH>Sessions (7d / 30d)</TH>
                <TH>Practice accuracy</TH>
                <TH>Sets done</TH>
                <TH>Mock tests</TH>
                <TH>Last practice</TH>
                <TH>Last seen</TH>
                <TH className="text-right">Details</TH>
              </tr>
            </THead>
            <tbody>
              {loading ? (
                <TR>
                  <TD colSpan={9} className="py-10 text-center text-muted">
                    Loading…
                  </TD>
                </TR>
              ) : shown.length === 0 ? (
                <TR>
                  <TD colSpan={9} className="py-10 text-center text-muted">
                    No students match.
                  </TD>
                </TR>
              ) : (
                shown.map((r) => {
                  const reg = regularity(r.practice_days_14);
                  return (
                    <TR key={r.student_id}>
                      <TD>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={r.full_name} color={r.avatar_color} size={32} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-ink">{r.full_name}</p>
                            <p className="text-xs text-muted">
                              {r.roll_number ? `Roll ${r.roll_number}` : "—"}
                              {r.class_name ? ` · ${r.class_name}` : ""}
                            </p>
                          </div>
                        </div>
                      </TD>
                      <TD>
                        <div className="flex items-center gap-2">
                          <Badge tone={REGULARITY_META[reg].tone} dot>
                            {REGULARITY_META[reg].label}
                          </Badge>
                          <span className="text-xs text-muted tabular">{r.practice_days_14}/14 days</span>
                        </div>
                        <DayBar days={r.practice_days_14} />
                      </TD>
                      <TD className="tabular">
                        {r.practice_7d} / {r.practice_30d}
                      </TD>
                      <TD className="tabular">{r.practice_accuracy != null ? `${r.practice_accuracy}%` : "—"}</TD>
                      <TD className="tabular">{r.sets_done}</TD>
                      <TD className="tabular">
                        {r.tests_taken}
                        {r.avg_test_pct != null && <span className="text-xs text-muted"> · avg {r.avg_test_pct}%</span>}
                      </TD>
                      <TD className={cn("text-[13px]", !r.last_practice_at && "text-danger")}>{ago(r.last_practice_at)}</TD>
                      <TD className="text-[13px] text-muted">{ago(r.last_seen_at)}</TD>
                      <TD className="text-right">
                        <Link to={`/teacher/students/${r.student_id}/activity`}>
                          <Button size="sm" variant="ghost" rightIcon={<ArrowUpRight className="size-4" />}>
                            View
                          </Button>
                        </Link>
                      </TD>
                    </TR>
                  );
                })
              )}
            </tbody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

/** 14 small blocks: filled = number of practice days (order not implied). */
function DayBar({ days }: { days: number }) {
  return (
    <div className="mt-1.5 flex gap-0.5" aria-label={`${days} practice days in the last 14 days`}>
      {Array.from({ length: 14 }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 w-2.5 rounded-sm",
            i < days ? (days >= 6 ? "bg-emerald-500" : days >= 2 ? "bg-amber-400" : "bg-red-400") : "bg-slate-200",
          )}
        />
      ))}
    </div>
  );
}
