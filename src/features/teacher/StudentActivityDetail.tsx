import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, CalendarDays, ClipboardList, Download, Dumbbell, Target } from "lucide-react";
import { Avatar, Badge, Button, Card, CardBody, CardHeader, ProgressBar, StatCard, Table, TD, TH, THead, TR, useToast } from "@/ui";
import { ago, db, REGULARITY_META, regularity, rpc, SUBJECT_LABELS } from "@/lib/api";
import { useSettings } from "@/lib/useSettings";
import { printReport } from "@/lib/print";
import { cn } from "@/lib/cn";

type Item = {
  kind: "practice" | "test";
  title: string;
  subject_code: string | null;
  topic_name: string | null;
  difficulty: string | null;
  correct: number;
  total: number;
  pct: number | null;
  at: string;
};

type Profile = {
  id: string;
  full_name: string;
  roll_number: string | null;
  class_name: string | null;
  avatar_color: string;
  last_seen_at: string | null;
  created_at: string;
};

const DAY_MS = 86400000;
const dayKey = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // YYYY-MM-DD
const LEVEL_MR: Record<string, string> = { easy: "Easy", medium: "Medium", hard: "Hard", combined: "Mixed" };

export default function StudentActivityDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const settings = useSettings();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const [{ data: p }, list] = await Promise.all([
          db.from("profiles").select("id, full_name, roll_number, class_name, avatar_color, last_seen_at, created_at").eq("id", id).single(),
          rpc<Item[]>("student_activity", { p_student: id }),
        ]);
        setProfile(p as Profile);
        setItems((list ?? []).map((x) => ({ ...x, pct: x.pct == null ? null : Number(x.pct) })));
      } catch (e) {
        toast({ type: "error", title: "Could not load activity", message: (e as Error).message });
      }
      setLoading(false);
    })();
  }, [id, toast]);

  const practice = useMemo(() => items.filter((i) => i.kind === "practice"), [items]);
  const tests = useMemo(() => items.filter((i) => i.kind === "test"), [items]);

  // Last 30 days: number of practice sessions and tests per day
  const days = useMemo(() => {
    const map: Record<string, { p: number; t: number }> = {};
    for (const i of items) {
      const k = dayKey(new Date(i.at));
      map[k] ??= { p: 0, t: 0 };
      if (i.kind === "practice") map[k].p++;
      else map[k].t++;
    }
    const today = new Date();
    return Array.from({ length: 30 }, (_, n) => {
      const d = new Date(today.getTime() - (29 - n) * DAY_MS);
      const k = dayKey(d);
      return { key: k, date: d, ...(map[k] ?? { p: 0, t: 0 }) };
    });
  }, [items]);

  const practiceDays14 = days.slice(-14).filter((d) => d.p > 0).length;
  const reg = regularity(practiceDays14);
  const streak = useMemo(() => {
    let n = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].p > 0) n++;
      else if (i === days.length - 1) continue; // today not done yet doesn't break the streak
      else break;
    }
    return n;
  }, [days]);
  const sessions30 = days.reduce((a, d) => a + d.p, 0);
  const acc = practice.length
    ? Math.round((practice.reduce((a, i) => a + i.correct, 0) / Math.max(1, practice.reduce((a, i) => a + i.total, 0))) * 100)
    : null;
  const testAvg = tests.length ? Math.round(tests.reduce((a, i) => a + (i.pct ?? 0), 0) / tests.length) : null;

  const bySubject = useMemo(() => {
    const m: Record<string, { n: number; c: number; t: number }> = {};
    for (const i of practice) {
      const k = i.subject_code ?? "other";
      m[k] ??= { n: 0, c: 0, t: 0 };
      m[k].n++;
      m[k].c += i.correct;
      m[k].t += i.total;
    }
    return Object.entries(m).map(([code, v]) => ({ code, ...v, pct: v.t ? Math.round((v.c / v.t) * 100) : 0 }));
  }, [practice]);

  const sets = useMemo(() => {
    const m: Record<string, { n: number; best: number; last: string }> = {};
    for (const i of practice) {
      if (i.title === "Self practice") continue;
      m[i.title] ??= { n: 0, best: 0, last: i.at };
      m[i.title].n++;
      m[i.title].best = Math.max(m[i.title].best, i.pct ?? 0);
      if (i.at > m[i.title].last) m[i.title].last = i.at;
    }
    return Object.entries(m);
  }, [practice]);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

  const downloadPdf = () => {
    if (!profile) return;
    printReport({
      title: `Activity report — ${profile.full_name}`,
      subtitle: `${profile.roll_number ? `Roll ${profile.roll_number}` : ""}${profile.class_name ? ` · ${profile.class_name}` : ""}`,
      schoolName: settings.school_name,
      schoolAddress: settings.school_address,
      facts: [
        ["Practice regularity", `${REGULARITY_META[reg].label} (${practiceDays14}/14 days)`],
        ["Practice sessions (30 days)", String(sessions30)],
        ["Practice accuracy", acc != null ? `${acc}%` : "—"],
        ["Mock tests", `${tests.length}${testAvg != null ? ` · avg ${testAvg}%` : ""}`],
        ["Last seen", ago(profile.last_seen_at)],
      ],
      columns: [
        { label: "Date" },
        { label: "Type" },
        { label: "Title" },
        { label: "Subject / topic" },
        { label: "Score", align: "right" },
        { label: "%", align: "right" },
      ],
      rows: items.map((i) => [
        fmtDate(i.at),
        i.kind === "test" ? "Mock test" : "Practice",
        i.title,
        i.subject_code ? `${SUBJECT_LABELS[i.subject_code] ?? i.subject_code}${i.topic_name ? ` / ${i.topic_name}` : ""}` : "—",
        `${i.correct}/${i.total}`,
        i.pct != null ? `${i.pct}%` : "—",
      ]),
    });
  };

  if (loading) return <p className="py-20 text-center text-muted">Loading…</p>;
  if (!profile) return <p className="py-20 text-center text-muted">Student not found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/teacher/activity" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
          <ArrowLeft className="size-4" /> All students
        </Link>
        <Button onClick={downloadPdf} leftIcon={<Download className="size-4" />}>
          Download PDF
        </Button>
      </div>

      <Card>
        <CardBody className="flex flex-wrap items-center gap-4">
          <Avatar name={profile.full_name} color={profile.avatar_color} size={56} />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-ink">{profile.full_name}</h1>
            <p className="text-sm text-muted">
              {profile.roll_number ? `Roll ${profile.roll_number}` : "No roll number"}
              {profile.class_name ? ` · ${profile.class_name}` : ""} · Last seen {ago(profile.last_seen_at).toLowerCase()}
            </p>
          </div>
          <Badge tone={REGULARITY_META[reg].tone} dot className="px-3 py-1 text-sm">
            {REGULARITY_META[reg].label}
          </Badge>
        </CardBody>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Practice days (last 14)" value={`${practiceDays14}/14`} icon={<CalendarDays className="size-5" />} accent={REGULARITY_META[reg].tone} hint={streak > 1 ? `${streak}-day streak` : REGULARITY_META[reg].hint} />
        <StatCard label="Practice sessions (30 days)" value={String(sessions30)} icon={<Dumbbell className="size-5" />} hint={`${practice.length} in total`} />
        <StatCard label="Practice accuracy" value={acc != null ? `${acc}%` : "—"} icon={<Target className="size-5" />} accent="success" hint="all practice sessions" />
        <StatCard label="Mock tests taken" value={String(tests.length)} icon={<ClipboardList className="size-5" />} accent="warning" hint={testAvg != null ? `average ${testAvg}%` : "none yet"} />
      </div>

      <Card>
        <CardHeader title="Last 30 days" subtitle="Each square is one day. Green = practised, blue ring = mock test." />
        <CardBody>
          <div className="grid grid-cols-10 gap-1.5 sm:grid-cols-15">
            {days.map((d) => (
              <div
                key={d.key}
                title={`${d.date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}: ${d.p} practice, ${d.t} test`}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center rounded-md text-[10px] tabular",
                  d.p === 0 ? "bg-slate-100 text-slate-400" : d.p === 1 ? "bg-emerald-200 text-emerald-900" : d.p <= 3 ? "bg-emerald-400 text-white" : "bg-emerald-600 text-white",
                  d.t > 0 && "ring-2 ring-brand-500",
                )}
              >
                <span className="font-semibold">{d.date.getDate()}</span>
                {d.p > 0 && <span>{d.p}×</span>}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Practice by subject" />
          <CardBody className="space-y-4">
            {bySubject.length === 0 ? (
              <p className="text-sm text-muted">No practice yet.</p>
            ) : (
              bySubject.map((s) => (
                <div key={s.code}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium text-ink">{SUBJECT_LABELS[s.code] ?? s.code}</span>
                    <span className="text-muted tabular">
                      {s.n} sessions · {s.pct}%
                    </span>
                  </div>
                  <ProgressBar value={s.pct} tone={s.pct >= settings.strong_threshold ? "success" : s.pct >= settings.weak_threshold ? "warning" : "danger"} />
                </div>
              ))
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Practice sets solved" subtitle="Sets assigned by the teacher" />
          <CardBody className="space-y-2">
            {sets.length === 0 ? (
              <p className="text-sm text-muted">No practice set solved yet.</p>
            ) : (
              sets.map(([title, v]) => (
                <div key={title} className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm">
                  <span className="font-medium text-ink">{title}</span>
                  <span className="text-muted tabular">
                    {v.n}× · best {v.best}% · {ago(v.last).toLowerCase()}
                  </span>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Activity timeline" subtitle={`${items.length} entries, newest first`} />
        <div className="overflow-x-auto">
          <Table>
            <THead>
              <tr>
                <TH>When</TH>
                <TH>Type</TH>
                <TH>Title</TH>
                <TH>Subject / topic</TH>
                <TH>Level</TH>
                <TH className="text-right">Score</TH>
              </tr>
            </THead>
            <tbody>
              {items.length === 0 ? (
                <TR>
                  <TD colSpan={6} className="py-8 text-center text-muted">
                    No activity yet.
                  </TD>
                </TR>
              ) : (
                items.map((i, k) => (
                  <TR key={k}>
                    <TD className="whitespace-nowrap text-[13px] text-muted">{fmtDate(i.at)}</TD>
                    <TD>
                      <Badge tone={i.kind === "test" ? "brand" : "neutral"}>{i.kind === "test" ? "Mock test" : "Practice"}</Badge>
                    </TD>
                    <TD className="font-medium">{i.title}</TD>
                    <TD className="text-[13px] text-muted">
                      {i.subject_code ? `${SUBJECT_LABELS[i.subject_code] ?? i.subject_code}${i.topic_name ? ` / ${i.topic_name}` : ""}` : "—"}
                    </TD>
                    <TD className="text-[13px]">{i.difficulty ? LEVEL_MR[i.difficulty] ?? i.difficulty : "—"}</TD>
                    <TD className="text-right tabular">
                      {i.correct}/{i.total}
                      {i.pct != null && <span className="text-xs text-muted"> · {i.pct}%</span>}
                    </TD>
                  </TR>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
