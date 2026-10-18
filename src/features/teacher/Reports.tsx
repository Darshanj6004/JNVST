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
} from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { AccuracyBars, ScoreTrend } from "@/charts";
import { supabase } from "@/lib/supabaseClient";

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

type TestStat = {
  test_title: string;
  avg_score: number;
  total_marks: number;
  attempts: number;
  submitted_at: string;
};

const SUBJECT_LABELS: Record<string, string> = {
  mental_ability: "Mental Ability",
  arithmetic: "Arithmetic",
  language: "Language",
};

export default function Reports() {
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const [totalTests, setTotalTests] = useState(0);
  const [classAvg, setClassAvg] = useState<number | null>(null);
  const [topScore, setTopScore] = useState<number | null>(null);
  const [attendance, setAttendance] = useState<number | null>(null);
  const [subjectStats, setSubjectStats] = useState<SubjectStat[]>([]);
  const [topicStats, setTopicStats] = useState<TopicStat[]>([]);
  const [testTrend, setTestTrend] = useState<{ label: string; score: number; avg: number }[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    // 1. Submitted attempts with mock test info
    const { data: attempts } = await sb
      .from("exam_attempts")
      .select("score, mock_tests(title, total_marks, scheduled_at)")
      .eq("status", "submitted");

    const att = (attempts ?? []) as {
      score: number;
      mock_tests: { title: string; total_marks: number; scheduled_at: string };
    }[];

    setTotalTests(new Set(att.map((a) => a.mock_tests?.title)).size);

    if (att.length > 0) {
      const pcts = att.map((a) => (a.score / (a.mock_tests?.total_marks || 100)) * 100);
      setClassAvg(Math.round(pcts.reduce((s, v) => s + v, 0) / pcts.length));
      setTopScore(Math.round(Math.max(...pcts)));

      // Build test trend: group by test title, compute avg
      const byTest: Record<string, { pcts: number[]; date: string }> = {};
      for (const a of att) {
        const title = a.mock_tests?.title ?? "Unknown";
        const pct = (a.score / (a.mock_tests?.total_marks || 100)) * 100;
        if (!byTest[title]) byTest[title] = { pcts: [], date: a.mock_tests?.scheduled_at ?? "" };
        byTest[title].pcts.push(pct);
      }
      const trend = Object.entries(byTest)
        .map(([title, { pcts, date }]) => ({
          label: title.length > 12 ? title.slice(0, 12) + "…" : title,
          score: Math.round(Math.max(...pcts)),
          avg: Math.round(pcts.reduce((s, v) => s + v, 0) / pcts.length),
          date,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-8);
      setTestTrend(trend);
    }

    // 2. Exam answers with subject info for accuracy
    const { data: answers } = await sb
      .from("exam_answers")
      .select("is_correct, questions(subject_code, topic_name)");

    const ans = (answers ?? []) as {
      is_correct: boolean | null;
      questions: { subject_code: string; topic_name: string };
    }[];

    // Subject accuracy
    const subMap: Record<string, { correct: number; total: number }> = {};
    const topicMap: Record<string, { correct: number; total: number; subject: string }> = {};
    for (const a of ans) {
      const code = a.questions?.subject_code ?? "other";
      const topic = a.questions?.topic_name ?? "Unknown";
      if (!subMap[code]) subMap[code] = { correct: 0, total: 0 };
      subMap[code].total++;
      if (a.is_correct) subMap[code].correct++;

      const key = `${code}:${topic}`;
      if (!topicMap[key]) topicMap[key] = { correct: 0, total: 0, subject: code };
      topicMap[key].total++;
      if (a.is_correct) topicMap[key].correct++;
    }

    setSubjectStats(
      Object.entries(subMap).map(([code, v]) => ({
        subject: SUBJECT_LABELS[code] ?? code,
        correct: v.correct,
        total: v.total,
        accuracy: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
      }))
    );

    const topics: TopicStat[] = Object.entries(topicMap).map(([key, v]) => {
      const acc = v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0;
      return {
        topic_name: key.split(":")[1],
        subject_code: v.subject,
        correct: v.correct,
        total: v.total,
        accuracy: acc,
        band: (acc >= 75 ? "strong" : acc >= 50 ? "average" : "weak") as "strong" | "average" | "weak",
      };
    }).sort((a, b) => a.accuracy - b.accuracy);
    setTopicStats(topics);

    // Total students attempted (for attendance proxy)
    const { count: studentAttempts } = await sb
      .from("exam_attempts")
      .select("student_id", { count: "exact", head: true })
      .eq("status", "submitted");

    const { count: totalStudents } = await sb
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "student")
      .eq("status", "active");

    if (totalStudents && totalStudents > 0) {
      setAttendance(Math.min(100, Math.round(((studentAttempts ?? 0) / totalStudents) * 100)));
    }

    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredTopics = topicStats.filter(
    (t) => subjectFilter === "all" || t.subject_code === subjectFilter
  );

  const chartData = subjectStats.map((s) => ({ label: s.subject.split(" ")[0], value: s.accuracy }));
  const trendData = testTrend.map((t) => ({ label: t.label, score: t.avg, average: t.avg }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Class-level and topic-wise performance analysis."
        actions={
          <Button variant="secondary" leftIcon={<Download className="size-4" />}>
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
