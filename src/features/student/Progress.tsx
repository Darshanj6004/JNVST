import { useCallback, useEffect, useState } from "react";
import { Badge, Card, CardBody, CardHeader, ProgressBar, Table, TH, THead, TR, TD } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { AccuracyBars, BandDonut, ScoreTrend } from "@/charts";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

const bandTone = { strong: "success", average: "warning", weak: "danger" } as const;

const SUBJECT_LABELS: Record<string, string> = {
  mental_ability: "Mental Ability",
  arithmetic: "Arithmetic",
  language: "Language",
};

type TopicRow = {
  topic_name: string;
  subject_code: string;
  correct: number;
  total: number;
  accuracy: number;
  band: "strong" | "average" | "weak";
};

type TrendPoint = { label: string; score: number; average: number };

export default function Progress() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [testsTaken, setTestsTaken] = useState(0);
  const [overallAcc, setOverallAcc] = useState<number | null>(null);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [subjectAccuracy, setSubjectAccuracy] = useState<{ label: string; value: number }[]>([]);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    // Submitted attempts for this student
    const { data: attempts } = await sb
      .from("exam_attempts")
      .select("id, score, mock_tests(title, total_marks, scheduled_at)")
      .eq("student_id", user.id)
      .eq("status", "submitted")
      .order("submitted_at", { ascending: true });

    const att = (attempts ?? []) as {
      id: string;
      score: number;
      mock_tests: { title: string; total_marks: number; scheduled_at: string };
    }[];

    setTestsTaken(att.length);

    if (att.length > 0) {
      const pcts = att.map((a) => (a.score / (a.mock_tests?.total_marks || 100)) * 100);
      setOverallAcc(Math.round(pcts.reduce((s, v) => s + v, 0) / pcts.length));
      setBestScore(Math.round(Math.max(...pcts)));

      // Score trend
      setTrend(
        att.map((a) => ({
          label: (a.mock_tests?.title ?? "").slice(0, 10),
          score: Math.round((a.score / (a.mock_tests?.total_marks || 100)) * 100),
          average: Math.round((a.score / (a.mock_tests?.total_marks || 100)) * 100),
        }))
      );
    }

    // Get this student's exam answers with question details
    const { data: answers } = await sb
      .from("exam_answers")
      .select("is_correct, questions(subject_code, topic_name)")
      .in("attempt_id", att.map((a) => a.id));

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

    setSubjectAccuracy(
      Object.entries(subMap).map(([code, v]) => ({
        label: (SUBJECT_LABELS[code] ?? code).split(" ")[0],
        value: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
      }))
    );

    const topicRows: TopicRow[] = Object.entries(topicMap).map(([key, v]) => {
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
    setTopics(topicRows);

    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const bands = {
    strong: topics.filter((t) => t.band === "strong").length,
    average: topics.filter((t) => t.band === "average").length,
    weak: topics.filter((t) => t.band === "weak").length,
  };

  const donut = [
    { name: "Strong", value: bands.strong, key: "strong" },
    { name: "Average", value: bands.average, key: "average" },
    { name: "Weak", value: bands.weak, key: "weak" },
  ];

  const statsEmpty = testsTaken === 0 && !loading;

  return (
    <div className="space-y-6">
      <PageHeader title="Progress analytics" description="Track your improvement and spot topics to focus on." />

      {/* Top stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Overall accuracy", loading ? "…" : overallAcc !== null ? `${overallAcc}%` : "—"],
          ["Tests taken", loading ? "…" : String(testsTaken)],
          ["Best score", loading ? "…" : bestScore !== null ? `${bestScore}%` : "—"],
          ["Topics tracked", loading ? "…" : String(topics.length)],
        ].map(([l, v]) => (
          <Card key={l}>
            <CardBody>
              <p className="text-[13px] text-muted">{l}</p>
              <p className="mt-2 text-2xl font-semibold text-ink tabular">{v}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Score trend" subtitle="Your score per test (% of total marks)" />
          <CardBody>
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="size-6 animate-spin text-brand-400" />
              </div>
            ) : trend.length > 0 ? (
              <ScoreTrend data={trend} height={260} />
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-muted">
                Trend will appear after you submit your first mock test
              </div>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Topic bands" subtitle="Distribution across all topics" />
          <CardBody className="flex flex-col items-center">
            {topics.length > 0 ? (
              <>
                <BandDonut data={donut} />
                <div className="mt-4 grid w-full grid-cols-3 gap-2 text-center">
                  {donut.map((d) => (
                    <div key={d.key}>
                      <p className={`text-lg font-semibold tabular ${
                        d.key === "strong" ? "text-success" : d.key === "average" ? "text-warning" : "text-danger"
                      }`}>{d.value}</p>
                      <p className="text-[11px] text-muted capitalize">{d.key}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-40 items-center justify-center text-sm text-muted">
                No data yet
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Subject accuracy */}
      {subjectAccuracy.length > 0 && (
        <Card>
          <CardHeader title="Accuracy by subject" subtitle="Based on your submitted answers" />
          <CardBody>
            <AccuracyBars data={subjectAccuracy} height={200} />
          </CardBody>
        </Card>
      )}

      {/* Topic table */}
      {statsEmpty ? (
        <Card>
          <CardBody className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-sm font-medium text-muted">No progress data yet</p>
            <p className="text-xs text-slate-400">Take a mock test to start tracking your performance.</p>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader title="Topic-wise performance" subtitle="Your accuracy per topic" />
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
              {topics.map((t) => (
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
        </Card>
      )}
    </div>
  );
}
