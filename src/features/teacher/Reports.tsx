import { useCallback, useEffect, useState } from "react";
import { Download, Filter, Loader2 } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  ProgressBar,
  Select,
  StatCard,
  Table,
  TH,
  THead,
  TR,
  TD,
  useToast,
} from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { AccuracyBars, ScoreTrend } from "@/charts";
import * as XLSX from "xlsx";
import { finalizeExpiredAttempts, rpc, type TestSummary } from "@/lib/api";
import { useSettings } from "@/lib/useSettings";

const bandTone = { strong: "success", average: "warning", weak: "danger" } as const;

type SubjectStat = {
  subject: string;
  correct: number;
  total: number;
  accuracy: number;
};

type TopicStat = {
  topic_name: string;
  subject_code: string;
  correct: number;
  total: number;
  accuracy: number;
  band: "strong" | "average" | "weak";
};


const SUBJECT_LABELS: Record<string, string> = {
  mental_ability: "Mental Ability",
  arithmetic: "Arithmetic",
  language: "Language",
};

export default function Reports() {
  const { toast } = useToast();
  const settings = useSettings();
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const [totalTests, setTotalTests] = useState(0);
  const [classAvg, setClassAvg] = useState<number | null>(null);
  const [topScore, setTopScore] = useState<number | null>(null);
  const [attendance, setAttendance] = useState<number | null>(null);
  const [subjectStats, setSubjectStats] = useState<SubjectStat[]>([]);
  const [topicStats, setTopicStats] = useState<TopicStat[]>([]);
  const [testTrend, setTestTrend] = useState<{ label: string; score: number; avg: number }[]>([]);

  const [testRows, setTestRows] = useState<TestSummary[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    await finalizeExpiredAttempts();
    try {
      const [tests, topicsRaw, students] = await Promise.all([
        rpc<TestSummary[]>("class_test_summary"),
        rpc<{ subject_code: string; topic_name: string; total: number; correct: number }[]>("class_topic_stats", {
          p_test_id: null,
        }),
        rpc<{ tests_taken: number }[]>("class_student_summary"),
      ]);

      const taken = (tests ?? []).filter((t) => t.attempts > 0);
      setTestRows(taken);
      setTotalTests(taken.length);

      const totalAttempts = taken.reduce((s, t) => s + t.attempts, 0);
      setClassAvg(
        totalAttempts > 0
          ? Math.round(taken.reduce((s, t) => s + Number(t.avg_pct ?? 0) * t.attempts, 0) / totalAttempts)
          : null,
      );
      setTopScore(taken.length > 0 ? Math.round(Math.max(...taken.map((t) => Number(t.max_pct ?? 0)))) : null);
      setTestTrend(
        taken.slice(-8).map((t) => ({
          label: t.title.length > 12 ? t.title.slice(0, 12) + "…" : t.title,
          score: Math.round(Number(t.max_pct ?? 0)),
          avg: Math.round(Number(t.avg_pct ?? 0)),
        })),
      );

      // Attendance = attempts / (tests held × active students)
      const studentCount = (students ?? []).length;
      setAttendance(
        studentCount > 0 && taken.length > 0
          ? Math.min(100, Math.round((totalAttempts / (taken.length * studentCount)) * 100))
          : null,
      );

      const subMap: Record<string, { correct: number; total: number }> = {};
      const topics: TopicStat[] = [];
      for (const r of topicsRaw ?? []) {
        subMap[r.subject_code] ??= { correct: 0, total: 0 };
        subMap[r.subject_code].correct += r.correct;
        subMap[r.subject_code].total += r.total;
        const acc = r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0;
        topics.push({
          topic_name: r.topic_name,
          subject_code: r.subject_code,
          correct: r.correct,
          total: r.total,
          accuracy: acc,
          band: acc >= settings.strong_threshold ? "strong" : acc >= settings.weak_threshold ? "average" : "weak",
        });
      }
      setSubjectStats(
        Object.entries(subMap).map(([code, v]) => ({
          subject: SUBJECT_LABELS[code] ?? code,
          correct: v.correct,
          total: v.total,
          accuracy: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
        })),
      );
      setTopicStats(topics.sort((x, y) => x.accuracy - y.accuracy));
    } catch (e) {
      toast({ type: "error", title: "Could not load reports", message: (e as Error).message });
    }
    setLoading(false);
  }, [settings, toast]);

  const exportReport = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        testRows.map((t) => ({
          Test: t.title,
          Date: t.scheduled_at ? new Date(t.scheduled_at).toLocaleDateString("en-IN") : "",
          "Students attempted": t.attempts,
          "Average %": Number(t.avg_pct ?? 0),
          "Highest %": Number(t.max_pct ?? 0),
          "Lowest %": Number(t.min_pct ?? 0),
        })),
      ),
      "Tests",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        topicStats.map((t) => ({
          Subject: SUBJECT_LABELS[t.subject_code] ?? t.subject_code,
          Topic: t.topic_name,
          Correct: t.correct,
          Questions: t.total,
          "Accuracy %": t.accuracy,
          Band: t.band,
        })),
      ),
      "Topics",
    );
    XLSX.writeFile(wb, `class-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  useEffect(() => { load(); }, [load]);

  const filteredTopics = topicStats.filter(
    (t) => subjectFilter === "all" || t.subject_code === subjectFilter
  );

  const chartData = subjectStats.map((s) => ({ label: s.subject.split(" ")[0], value: s.accuracy }));
  const trendData = testTrend.map((t) => ({ label: t.label, score: t.score, average: t.avg }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Class-level and topic-wise performance analysis."
        actions={
          <Button
            variant="secondary"
            leftIcon={<Download className="size-4" />}
            onClick={exportReport}
            disabled={loading || testRows.length === 0}
          >
            Export report
          </Button>
        }
      />

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-2 text-[13px] font-medium text-muted">
            <Filter className="size-4" /> Filters
          </span>
          <Select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="min-w-40"
          >
            <option value="all">All subjects</option>
            <option value="mental_ability">Mental Ability</option>
            <option value="arithmetic">Arithmetic</option>
            <option value="language">Language</option>
          </Select>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Class average"
          value={classAvg !== null ? `${classAvg}%` : "—"}
          hint="across submitted mocks"
          accent="success"
        />
        <StatCard
          label="Tests conducted"
          value={totalTests > 0 ? String(totalTests) : "—"}
          hint="unique tests with submissions"
          accent="brand"
        />
        <StatCard
          label="Submission rate"
          value={attendance !== null ? `${attendance}%` : "—"}
          hint="students with ≥1 submission"
          accent="warning"
        />
        <StatCard
          label="Top score"
          value={topScore !== null ? `${topScore}%` : "—"}
          hint="best single attempt"
          accent="success"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Class average trend"
            subtitle={trendData.length > 0 ? "Average score per test (submitted attempts)" : "No data yet"}
          />
          <CardBody>
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="size-6 animate-spin text-brand-400" />
              </div>
            ) : trendData.length > 0 ? (
              <ScoreTrend data={trendData} height={260} />
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-muted">
                Charts will appear after students submit tests
              </div>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader
            title="Subject accuracy"
            subtitle={chartData.length > 0 ? "Based on submitted answers" : "No data yet"}
          />
          <CardBody>
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="size-6 animate-spin text-brand-400" />
              </div>
            ) : chartData.length > 0 ? (
              <AccuracyBars data={chartData} height={260} />
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-muted">
                No subject data yet
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Topic accuracy table */}
      <Card>
        <CardHeader
          title="Topic-wise accuracy"
          subtitle={`Across all submitted attempts${filteredTopics.length > 0 ? ` · ${filteredTopics.length} topics` : ""}`}
        />
        {filteredTopics.length === 0 ? (
          <CardBody className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <p className="text-sm text-muted">No topic data yet — appears after exam submissions.</p>
          </CardBody>
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Topic</TH>
                <TH>Subject</TH>
                <TH>Answers</TH>
                <TH>Accuracy</TH>
                <TH>Band</TH>
              </tr>
            </THead>
            <tbody>
              {filteredTopics.map((t) => (
                <TR key={`${t.subject_code}-${t.topic_name}`}>
                  <TD className="font-medium">{t.topic_name}</TD>
                  <TD className="text-muted">{SUBJECT_LABELS[t.subject_code] ?? t.subject_code}</TD>
                  <TD className="tabular text-muted">{t.total}</TD>
                  <TD>
                    <div className="flex items-center gap-2">
                      <ProgressBar value={t.accuracy} tone={bandTone[t.band]} className="w-24" />
                      <span className="tabular text-muted">{t.accuracy}%</span>
                    </div>
                  </TD>
                  <TD>
                    <Badge tone={bandTone[t.band]}>
                      {t.band[0].toUpperCase() + t.band.slice(1)}
                    </Badge>
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
