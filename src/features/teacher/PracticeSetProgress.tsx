import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Download, Repeat, UserX, Users } from "lucide-react";
import { Avatar, Badge, Button, Card, Select, StatCard, Table, TD, TH, THead, TR, useToast } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { ago, db, rpc } from "@/lib/api";
import { useSettings } from "@/lib/useSettings";
import { printReport } from "@/lib/print";

type Row = {
  student_id: string;
  full_name: string;
  roll_number: string | null;
  class_name: string | null;
  avatar_color: string;
  attempts: number;
  best_pct: number | null;
  last_pct: number | null;
  first_at: string | null;
  last_at: string | null;
  active_days: number;
};

type SetInfo = { id: string; title: string; description: string | null; question_ids: string[]; created_at: string };

type Status = "regular" | "started" | "not_started";
const statusOf = (r: Row): Status => (r.attempts === 0 ? "not_started" : r.active_days >= 3 ? "regular" : "started");
const STATUS: Record<Status, { label: string; tone: "success" | "warning" | "danger" }> = {
  regular: { label: "Solving regularly", tone: "success" },
  started: { label: "Started", tone: "warning" },
  not_started: { label: "Not started", tone: "danger" },
};

export default function PracticeSetProgress() {
  const { id } = useParams();
  const { toast } = useToast();
  const settings = useSettings();
  const [set, setSet] = useState<SetInfo | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Status>("all");

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const [{ data }, list] = await Promise.all([
          db.from("practice_sets").select("id, title, description, question_ids, created_at").eq("id", id).single(),
          rpc<Row[]>("practice_set_progress", { p_set_id: id }),
        ]);
        setSet(data as SetInfo);
        setRows(
          (list ?? []).map((r) => ({
            ...r,
            best_pct: r.best_pct == null ? null : Number(r.best_pct),
            last_pct: r.last_pct == null ? null : Number(r.last_pct),
          })),
        );
      } catch (e) {
        toast({ type: "error", title: "Could not load progress", message: (e as Error).message });
      }
      setLoading(false);
    })();
  }, [id, toast]);

  const counts = useMemo(() => {
    const c = { regular: 0, started: 0, not_started: 0 };
    rows.forEach((r) => c[statusOf(r)]++);
    return c;
  }, [rows]);
  const order: Status[] = ["not_started", "started", "regular"];
  const shown = rows
    .filter((r) => filter === "all" || statusOf(r) === filter)
    .sort((a, b) => order.indexOf(statusOf(a)) - order.indexOf(statusOf(b)) || a.full_name.localeCompare(b.full_name));
  const avgBest = (() => {
    const done = rows.filter((r) => r.best_pct != null);
    return done.length ? Math.round(done.reduce((a, r) => a + (r.best_pct ?? 0), 0) / done.length) : null;
  })();

  const downloadPdf = () => {
    if (!set) return;
    printReport({
      title: `Practice set progress — ${set.title}`,
      subtitle: `${set.question_ids.length} questions`,
      schoolName: settings.school_name,
      schoolAddress: settings.school_address,
      facts: [
        ["Students", String(rows.length)],
        ["Solving regularly", String(counts.regular)],
        ["Started", String(counts.started)],
        ["Not started", String(counts.not_started)],
        ["Average best score", avgBest != null ? `${avgBest}%` : "—"],
      ],
      columns: [
        { label: "Student" },
        { label: "Roll", align: "center" },
        { label: "Status" },
        { label: "Times solved", align: "right" },
        { label: "Days", align: "right" },
        { label: "Best %", align: "right" },
        { label: "Last %", align: "right" },
        { label: "Last solved" },
      ],
      rows: shown.map((r) => [
        r.full_name,
        r.roll_number ?? "—",
        STATUS[statusOf(r)].label,
        r.attempts,
        r.active_days,
        r.best_pct != null ? `${r.best_pct}%` : "—",
        r.last_pct != null ? `${r.last_pct}%` : "—",
        ago(r.last_at),
      ]),
      footnote: "Solving regularly = solved on 3 or more different days.",
    });
  };

  if (loading) return <p className="py-20 text-center text-muted">Loading…</p>;
  if (!set) return <p className="py-20 text-center text-muted">Practice set not found.</p>;

  return (
    <div className="space-y-6">
      <Link to="/teacher/practice-sets" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Practice sets
      </Link>
      <PageHeader
        title={set.title}
        description={`${set.question_ids.length} questions · created ${ago(set.created_at).toLowerCase()}${set.description ? ` · ${set.description}` : ""}`}
        actions={
          <Button onClick={downloadPdf} leftIcon={<Download className="size-4" />}>
            Download PDF
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Students attempted" value={`${rows.length - counts.not_started}/${rows.length}`} icon={<Users className="size-5" />} hint={avgBest != null ? `average best score ${avgBest}%` : "no attempts yet"} />
        <StatCard label="Solving regularly" value={String(counts.regular)} icon={<Repeat className="size-5" />} accent="success" hint="solved on 3+ different days" />
        <StatCard label="Started" value={String(counts.started)} icon={<CheckCircle2 className="size-5" />} accent="warning" hint="solved on 1–2 days" />
        <StatCard label="Not started" value={String(counts.not_started)} icon={<UserX className="size-5" />} accent="danger" hint="remind these students" />
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
          <div className="w-56">
            <Select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
              <option value="all">All students</option>
              <option value="not_started">Not started</option>
              <option value="started">Started</option>
              <option value="regular">Solving regularly</option>
            </Select>
          </div>
          <span className="text-[13px] text-muted">{shown.length} shown</span>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <THead>
              <tr>
                <TH>Student</TH>
                <TH>Status</TH>
                <TH>Times solved</TH>
                <TH>Different days</TH>
                <TH>Best score</TH>
                <TH>Last score</TH>
                <TH>Last solved</TH>
                <TH className="text-right">Activity</TH>
              </tr>
            </THead>
            <tbody>
              {shown.map((r) => {
                const st = statusOf(r);
                return (
                  <TR key={r.student_id}>
                    <TD>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={r.full_name} color={r.avatar_color} size={30} />
                        <div>
                          <p className="font-medium text-ink">{r.full_name}</p>
                          <p className="text-xs text-muted">{r.roll_number ? `Roll ${r.roll_number}` : "—"}</p>
                        </div>
                      </div>
                    </TD>
                    <TD>
                      <Badge tone={STATUS[st].tone} dot>
                        {STATUS[st].label}
                      </Badge>
                    </TD>
                    <TD className="tabular">{r.attempts}</TD>
                    <TD className="tabular">{r.active_days}</TD>
                    <TD className="tabular">{r.best_pct != null ? `${r.best_pct}%` : "—"}</TD>
                    <TD className="tabular">{r.last_pct != null ? `${r.last_pct}%` : "—"}</TD>
                    <TD className="text-[13px] text-muted">{ago(r.last_at)}</TD>
                    <TD className="text-right">
                      <Link to={`/teacher/students/${r.student_id}/activity`}>
                        <Button size="sm" variant="ghost" rightIcon={<ArrowUpRight className="size-4" />}>
                          View
                        </Button>
                      </Link>
                    </TD>
                  </TR>
                );
              })}
            </tbody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
