import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Dumbbell,
  FileText,
  LineChart,
  Loader2,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, ProgressBar, Table, TH, THead, TR, TD } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { AccuracyBars, BandDonut, ScoreTrend } from "@/charts";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/auth";

import { useNum, useT } from "@/lib/lang";
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
  const tr = useT();
  const num = useNum();
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
      .select("id, mock_test_id, score, mock_tests(title, total_marks, scheduled_at)")
      .eq("student_id", user.id)
      .eq("status", "submitted")
      .order("submitted_at", { ascending: true });

    const att = (attempts ?? []) as {
      id: string;
      mock_test_id: string;
      score: number;
      mock_tests: { title: string; total_marks: number; scheduled_at: string };
    }[];

    setTestsTaken(att.length);

    if (att.length > 0) {
      const pcts = att.map((a) => (a.score / (a.mock_tests?.total_marks || 100)) * 100);
      setOverallAcc(Math.round(pcts.reduce((s, v) => s + v, 0) / pcts.length));
      setBestScore(Math.round(Math.max(...pcts)));

      // Class average per test (server computes; no other student's data exposed)
      const { data: avgs } = await sb.rpc("my_test_class_averages");
      const avgMap: Record<string, number> = {};
      for (const r of (avgs ?? []) as { mock_test_id: string; avg_pct: number }[]) avgMap[r.mock_test_id] = Math.round(r.avg_pct);

      setTrend(
        att.map((a) => {
          const scoreVal = Math.round((a.score / (a.mock_tests?.total_marks || 100)) * 100);
          return {
            label: (a.mock_tests?.title ?? "").slice(0, 12),
            score: scoreVal,
            average: avgMap[a.mock_test_id] ?? scoreVal,
          };
        })
      );
    }

    // Topic-level stats aggregated on the server
    const { data: stats } = await sb.rpc("my_topic_stats");
    const subMap: Record<string, { correct: number; total: number }> = {};
    const topicMap: Record<string, { correct: number; total: number; subject: string }> = {};
    for (const r of (stats ?? []) as { subject_code: string; topic_name: string; total: number; correct: number }[]) {
      const code = r.subject_code;
      subMap[code] ??= { correct: 0, total: 0 };
      subMap[code].total += r.total;
      subMap[code].correct += r.correct;
      const key = `${code}:${r.topic_name}`;
      topicMap[key] ??= { correct: 0, total: 0, subject: code };
      topicMap[key].total += r.total;
      topicMap[key].correct += r.correct;
    }

    setSubjectAccuracy(
      Object.entries(subMap).map(([code, v]) => ({
        label: (SUBJECT_LABELS[code] ?? code),
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
    { name: tr("चांगले", "Strong"), value: bands.strong, key: "strong" },
    { name: tr("ठीक", "Average"), value: bands.average, key: "average" },
    { name: tr("कमकुवत", "Weak"), value: bands.weak, key: "weak" },
  ];

  const statsEmpty = testsTaken === 0 && !loading;

  return (
    <div className="space-y-6">
      <PageHeader
        title={tr("माझी प्रगती", "My Progress Analytics")}
        description={tr("तुमचे गुण कसे वाढत आहेत आणि कोणत्या घटकांचा सराव हवा ते पाहा.", "Track your mock score growth and discover which topics to practice next.")}
        actions={
          <Link to="/student/practice">
            <Button leftIcon={<Dumbbell className="size-4" />}>
              {tr("घटकांचा सराव करा", "Practice Topics")}
            </Button>
          </Link>
        }
      />

      {/* Top stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: tr("एकूण अचूकता", "Overall Accuracy"), value: loading ? "…" : overallAcc !== null ? `${overallAcc}%` : "—", icon: Target, accent: "bg-brand-50 text-brand-600" },
          { label: tr("दिलेल्या परीक्षा", "Tests Submitted"), value: loading ? "…" : String(testsTaken), icon: FileText, accent: "bg-indigo-50 text-indigo-600" },
          { label: tr("सर्वोत्तम गुण", "Best Score"), value: loading ? "…" : bestScore !== null ? `${bestScore}%` : "—", icon: Trophy, accent: "bg-amber-50 text-amber-600" },
          { label: tr("नोंदवलेले घटक", "Topics Tracked"), value: loading ? "…" : String(topics.length), icon: BookOpen, accent: "bg-emerald-50 text-emerald-600" },
        ].map((s) => (
          <Card key={s.label} className="rounded-2xl border border-line bg-white shadow-xs">
            <CardBody className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">{s.label}</span>
                <span className={`flex size-8 items-center justify-center rounded-xl ${s.accent}`}>
                  <s.icon className="size-4" />
                </span>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-ink tabular">{s.value}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-2xl border border-line bg-white shadow-xs">
          <CardHeader
            title={tr("गुणांचा आलेख", "Score Progress Trend")}
            subtitle={tr("प्रत्येक परीक्षेतील टक्के गुण, क्रमाने", "Percentage scored per submitted test in chronological order")}
          />
          <CardBody className="p-5">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="size-6 animate-spin text-brand-400" />
              </div>
            ) : trend.length > 0 ? (
              <div>
                <ScoreTrend data={trend} height={260} averageLabel="" />
                <p className="mt-3 text-center text-xs text-muted">
                  {tr("प्रत्येक परीक्षेतील तुमचे टक्के गुण.", "Showing your test performance percentage over time.")}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                <LineChart className="size-10 text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-ink">{tr("अजून परीक्षांची नोंद नाही", "No test history yet")}</p>
                <p className="text-xs text-muted max-w-xs mt-1">
                  {tr("पहिली परीक्षा दिल्यानंतर गुणांचा आलेख येथे दिसेल.", "Your performance score curve will appear here after you submit your first mock test.")}
                </p>
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="rounded-2xl border border-line bg-white shadow-xs">
          <CardHeader title={tr("घटकांवरील पकड", "Topic Mastery")} subtitle={tr("चांगले / ठीक / कमकुवत घटक", "Distribution across evaluated topics")} />
          <CardBody className="p-5 flex flex-col items-center">
            {topics.length > 0 ? (
              <>
                <BandDonut data={donut} />
                <div className="mt-4 grid w-full grid-cols-3 gap-2 text-center pt-3 border-t border-line">
                  {donut.map((d) => (
                    <div key={d.key} className="rounded-xl bg-slate-50 p-2">
                      <p
                        className={`text-lg font-bold tabular ${
                          d.key === "strong" ? "text-success" : d.key === "average" ? "text-warning" : "text-danger"
                        }`}
                      >
                        {d.value}
                      </p>
                      <p className="text-[11px] font-medium text-slate-500 capitalize">{d.name}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center text-xs text-muted">
                <Sparkles className="size-8 text-slate-300 mb-2" />
                {tr("अजून घटकनिहाय माहिती नाही", "No topic data yet")}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Subject accuracy */}
      {subjectAccuracy.length > 0 && (
        <Card className="rounded-2xl border border-line bg-white shadow-xs">
          <CardHeader title={tr("विषयनिहाय अचूकता", "Accuracy by Subject")} subtitle={tr("तुमच्या परीक्षांतील उत्तरांवरून", "Calculated from your verified answer submissions")} />
          <CardBody className="p-5">
            <AccuracyBars data={subjectAccuracy} height={220} />
          </CardBody>
        </Card>
      )}

      {/* Topic table */}
      {statsEmpty ? (
        <Card className="rounded-2xl border border-line bg-white shadow-xs">
          <CardBody className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <Award className="size-7" />
            </div>
            <p className="text-base font-bold text-ink">{tr("अजून प्रगतीची नोंद नाही", "No progress recorded yet")}</p>
            <p className="text-xs text-muted max-w-sm">
              {tr("पहिली परीक्षा दिल्यानंतर तुमची प्रगती येथे दिसू लागेल.", "Complete your first scheduled mock test to begin building your personalised analytics profile.")}
            </p>
            <Link to="/student/mock-tests" className="mt-2">
              <Button size="sm">{tr("परीक्षांकडे जा", "Go to Mock Tests")}</Button>
            </Link>
          </CardBody>
        </Card>
      ) : (
        <Card className="rounded-2xl border border-line bg-white shadow-xs overflow-hidden">
          <CardHeader
            title={tr("घटकनिहाय कामगिरी", "Topic-Wise Performance Breakdown")}
            subtitle={tr("सर्वांत कमी गुणांचे घटक आधी — त्यांचा सराव आधी करा", "Topics ordered from lowest to highest accuracy for targeted practice")}
          />
          <Table>
            <THead>
              <tr>
                <TH>{tr("घटक", "Topic Name")}</TH>
                <TH>{tr("विषय", "Subject")}</TH>
                <TH>{tr("सोडवलेले प्रश्न", "Questions Answered")}</TH>
                <TH>{tr("अचूकता", "Accuracy")}</TH>
                <TH>{tr("स्थिती", "Status")}</TH>
                <TH className="text-right">{tr("कृती", "Action")}</TH>
              </tr>
            </THead>
            <tbody>
              {topics.map((t) => (
                <TR key={`${t.subject_code}-${t.topic_name}`}>
                  <TD className="font-bold text-ink text-sm">{t.topic_name}</TD>
                  <TD className="text-muted text-xs">{SUBJECT_LABELS[t.subject_code] ?? t.subject_code}</TD>
                  <TD className="tabular text-muted text-xs">{t.correct} of {t.total} correct</TD>
                  <TD>
                    <div className="flex items-center gap-2.5">
                      <ProgressBar value={t.accuracy} tone={bandTone[t.band]} className="w-24 h-2" />
                      <span className="tabular font-semibold text-xs text-slate-700">{t.accuracy}%</span>
                    </div>
                  </TD>
                  <TD>
                    <Badge tone={bandTone[t.band]}>
                      {t.band === "strong" ? tr("चांगले", "Strong") : t.band === "average" ? tr("ठीक", "Average") : tr("सराव हवा", "Needs Work")}
                    </Badge>
                  </TD>
                  <TD className="text-right">
                    <Link to="/student/practice">
                      <Button variant="ghost" size="sm" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                        Practice &rarr;
                      </Button>
                    </Link>
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
