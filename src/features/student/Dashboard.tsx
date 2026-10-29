import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Dumbbell,
  FileText,
  Info,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, ProgressBar } from "@/ui";
import { ProgressRing, ScoreTrend } from "@/charts";
import { formatDateTime, relativeTime } from "@/lib/format";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/auth";
import type { Student } from "@/types";

const bandMeta = {
  strong: { tone: "success" as const, label: "Strong" },
  average: { tone: "warning" as const, label: "Average" },
  weak: { tone: "danger" as const, label: "Needs Practice" },
};

interface AttemptRecord {
  id: string;
  mock_test_id: string;
  score: number | null;
  total_attempted: number;
  total_correct: number;
  status: "in_progress" | "submitted" | "timed_out";
  submitted_at: string | null;
  created_at: string;
  mock_tests: {
    id: string;
    title: string;
    total_marks: number;
    scheduled_at: string | null;
    duration_minutes: number;
  } | null;
}

interface UpcomingTest {
  id: string;
  title: string;
  pattern: "JNVST" | "Manual";
  duration_minutes: number;
  total_questions: number;
  total_marks: number;
  scheduled_at: string | null;
  status: "scheduled" | "live";
}

interface TopicPerformance {
  key: string;
  topic: string;
  subject: string;
  total: number;
  correct: number;
  accuracy: number;
  band: "strong" | "average" | "weak";
  isBuilding: boolean;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const student = user as Student | null;
  const firstName = student?.name?.split(" ")[0] ?? "Student";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [submittedAttempts, setSubmittedAttempts] = useState<AttemptRecord[]>([]);
  const [upcomingTests, setUpcomingTests] = useState<UpcomingTest[]>([]);
  const [topicStats, setTopicStats] = useState<TopicPerformance[]>([]);

  const loadDashboardData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;

      // 1. Fetch submitted attempts for this student with linked mock test details
      const { data: attemptsData, error: attemptsErr } = await sb
        .from("exam_attempts")
        .select(`
          id,
          mock_test_id,
          score,
          total_attempted,
          total_correct,
          status,
          submitted_at,
          created_at,
          mock_tests (
            id,
            title,
            total_marks,
            scheduled_at,
            duration_minutes
          )
        `)
        .eq("student_id", user.id)
        .eq("status", "submitted")
        .order("submitted_at", { ascending: false });

      if (attemptsErr) throw attemptsErr;

      const attemptsList = (attemptsData as AttemptRecord[]) ?? [];
      setSubmittedAttempts(attemptsList);

      // 2. Fetch upcoming and live tests for student calendar preview
      const { data: testsData, error: testsErr } = await sb
        .from("mock_tests")
        .select("id, title, pattern, duration_minutes, total_questions, total_marks, scheduled_at, status")
        .in("status", ["scheduled", "live"])
        .order("scheduled_at", { ascending: true })
        .limit(4);

      if (testsErr) throw testsErr;
      setUpcomingTests((testsData as UpcomingTest[]) ?? []);

      // 3. If student has submitted attempts, load answers to compute real topic strengths & weaknesses
      if (attemptsList.length > 0) {
        const attemptIds = attemptsList.map((a) => a.id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let answersData: any[] | null = null;

        // Try primary query with questions view/columns
        const { data: aData, error: aErr } = await sb
          .from("exam_answers")
          .select("is_correct, questions(subject_code, topic_name)")
          .in("attempt_id", attemptIds);

        if (!aErr && aData) {
          answersData = aData;
        } else {
          // Schema-resilient relational fallback joining via subjects and topics tables
          const { data: aDataRel, error: aErrRel } = await sb
            .from("exam_answers")
            .select("is_correct, questions(subjects(code), topics(name))")
            .in("attempt_id", attemptIds);

          if (!aErrRel && aDataRel) {
            answersData = aDataRel;
          }
        }

        if (answersData) {
          const topicMap: Record<string, { correct: number; total: number; subject: string; topic: string }> = {};

          for (const a of answersData) {
            const code = a.questions?.subject_code ?? a.questions?.subjects?.code ?? "other";
            const topic = a.questions?.topic_name ?? a.questions?.topics?.name ?? "General";
            const key = `${code}:${topic}`;

            if (!topicMap[key]) {
              topicMap[key] = { correct: 0, total: 0, subject: code, topic };
            }
            topicMap[key].total++;
            if (a.is_correct) topicMap[key].correct++;
          }

          const parsedTopics: TopicPerformance[] = Object.values(topicMap).map((item) => {
            const accuracy = item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0;
            const isBuilding = item.total < 3; // Phase 3 rule: < 3 questions marked as "Building data"
            const band: "strong" | "average" | "weak" =
              accuracy >= 75 ? "strong" : accuracy >= 50 ? "average" : "weak";

            return {
              key: `${item.subject}:${item.topic}`,
              topic: item.topic,
              subject: item.subject,
              total: item.total,
              correct: item.correct,
              accuracy,
              band,
              isBuilding,
            };
          });

          setTopicStats(parsedTopics);
        }
      } else {
        setTopicStats([]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load dashboard data from Supabase";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Derived metrics from verified Supabase records
  const latestAttempt = submittedAttempts[0] ?? null;
  const previousAttempt = submittedAttempts[1] ?? null;

  const latestScore = latestAttempt?.score ?? 0;
  const latestTotalMarks = latestAttempt?.mock_tests?.total_marks ?? 100;
  const latestPercentage = latestAttempt
    ? Math.round((latestScore / (latestTotalMarks || 100)) * 100)
    : null;

  // Score delta vs previous attempt
  let scoreDelta: number | null = null;
  if (latestAttempt && previousAttempt) {
    const prevScore = previousAttempt.score ?? 0;
    const prevTotal = previousAttempt.mock_tests?.total_marks ?? 100;
    const prevPct = Math.round((prevScore / (prevTotal || 100)) * 100);
    scoreDelta = (latestPercentage ?? 0) - prevPct;
  }

  // Questions solved (sum of total_attempted across submitted attempts)
  const totalQuestionsSolved = submittedAttempts.reduce(
    (sum, att) => sum + (att.total_attempted || 0),
    0
  );

  // Overall average accuracy (sum(total_correct) / sum(total_attempted) * 100)
  const totalCorrectSolved = submittedAttempts.reduce(
    (sum, att) => sum + (att.total_correct || 0),
    0
  );
  const averageAccuracy =
    totalQuestionsSolved > 0
      ? Math.round((totalCorrectSolved / totalQuestionsSolved) * 100)
      : null;

  // Trend data points for ScoreTrend chart (chronological: oldest to newest)
  const scoreTrendData = [...submittedAttempts]
    .reverse()
    .map((att) => {
      const marks = att.mock_tests?.total_marks || 100;
      const pctValue = Math.round(((att.score ?? 0) / marks) * 100);
      return {
        label: (att.mock_tests?.title ?? "Mock Test").slice(0, 14),
        score: pctValue,
        average: pctValue,
      };
    });

  // Filtered topics: Strong vs Weak
  const strongTopics = topicStats
    .filter((t) => !t.isBuilding && t.band === "strong")
    .sort((a, b) => b.accuracy - a.accuracy);

  const weakTopics = topicStats
    .filter((t) => !t.isBuilding && t.band === "weak")
    .sort((a, b) => a.accuracy - b.accuracy);

  const buildingTopics = topicStats.filter((t) => t.isBuilding);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-800 p-8 text-white shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-40 bg-white/20 rounded-full animate-pulse" />
            <div className="h-8 w-64 bg-white/25 rounded-lg animate-pulse" />
            <div className="h-4 w-96 bg-white/15 rounded-md animate-pulse" />
          </div>
          <Loader2 className="size-8 text-white/50 animate-spin" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardBody className="h-28 flex flex-col justify-between">
                <div className="h-4 w-24 bg-slate-200 rounded" />
                <div className="h-7 w-16 bg-slate-200 rounded" />
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-rose-200 bg-rose-50/50">
          <CardBody className="flex flex-col items-center justify-center p-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mb-3">
              <Info className="size-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Unable to load dashboard data</h3>
            <p className="mt-1 text-sm text-slate-600 max-w-md">{error}</p>
            <Button
              onClick={loadDashboardData}
              variant="secondary"
              size="sm"
              className="mt-4"
              leftIcon={<RefreshCw className="size-4" />}
            >
              Retry Connection
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcoming Banner for 4th Standard Student */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 via-brand-700 to-indigo-800 p-6 sm:p-8 text-white shadow-[var(--shadow-md)]">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-brand-100 backdrop-blur-md">
              <Sparkles className="size-3.5 text-amber-300" /> JNVST 2027 · Class 4 Preparation
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Namaste, {firstName}! 👋
            </h1>
            <p className="text-sm text-brand-100 leading-relaxed">
              Every small daily practice brings you closer to your Navodaya scholarship dream. Keep up the great work!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/student/practice">
              <Button
                variant="secondary"
                size="md"
                className="bg-white text-brand-700 hover:bg-brand-50 border-white font-semibold shadow-sm"
                leftIcon={<Dumbbell className="size-4" />}
              >
                Start Practice
              </Button>
            </Link>
            <Link to="/student/mock-tests">
              <Button
                variant="ghost"
                size="md"
                className="text-white hover:bg-white/15 border border-white/20"
                rightIcon={<ArrowRight className="size-4" />}
              >
                View Tests
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Database Status Notice */}
        <div className="mt-4 pt-4 border-t border-white/15 flex items-center justify-between flex-wrap gap-2 text-[12px] text-brand-200">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Connected to real Supabase records · Analytics update automatically with your tests.</span>
          </div>
          <span className="text-brand-300">Phase 3 Live Connection</span>
        </div>
      </div>

      {/* Top row: 4 Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Latest Mock Score */}
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardBody className="flex items-center gap-4">
            <ProgressRing value={latestPercentage ?? 0} sublabel="Score" />
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-muted">Latest Mock Score</p>
              {latestAttempt ? (
                <>
                  <p className="mt-1 text-2xl font-bold text-ink tabular">
                    {Math.round(latestScore)}
                    <span className="text-sm font-normal text-muted">/{latestTotalMarks}</span>
                  </p>
                  {scoreDelta !== null ? (
                    scoreDelta > 0 ? (
                      <p className="mt-1.5 flex items-center gap-1 text-[12px] font-semibold text-success">
                        <TrendingUp className="size-3.5" /> +{scoreDelta} pts vs previous
                      </p>
                    ) : scoreDelta < 0 ? (
                      <p className="mt-1.5 flex items-center gap-1 text-[12px] font-semibold text-rose-600">
                        <TrendingDown className="size-3.5" /> {scoreDelta} pts vs previous
                      </p>
                    ) : (
                      <p className="mt-1.5 text-[12px] font-semibold text-slate-500">
                        Same as previous test
                      </p>
                    )
                  ) : (
                    <p className="mt-1.5 flex items-center gap-1 text-[12px] font-medium text-brand-600">
                      <Sparkles className="size-3.5" /> First mock test!
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="mt-1 text-2xl font-bold text-slate-400 tabular">—</p>
                  <p className="mt-1.5 text-[12px] text-muted">No tests taken yet</p>
                </>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Card 2: Questions Attempted (Mock Tests) */}
        <Card>
          <CardBody>
            <div className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Target className="size-5" />
            </div>
            <p className="mt-3 text-2xl font-bold text-ink tabular leading-none">
              {totalQuestionsSolved}
            </p>
            <p className="mt-1 text-xs text-muted font-medium">Questions Attempted</p>
            <p className="mt-2 text-[11px] font-medium text-brand-600">
              {submittedAttempts.length > 0
                ? `Across ${submittedAttempts.length} completed mock ${submittedAttempts.length === 1 ? "test" : "tests"}`
                : "Start practicing today"}
            </p>
          </CardBody>
        </Card>

        {/* Card 3: Average Accuracy */}
        <Card>
          <CardBody>
            <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--color-success-soft)] text-success">
              <CheckCircle2 className="size-5" />
            </div>
            <p className="mt-3 text-2xl font-bold text-ink tabular leading-none">
              {averageAccuracy !== null ? `${averageAccuracy}%` : "—"}
            </p>
            <p className="mt-1 text-xs text-muted font-medium">Mock Exam Accuracy</p>
            <p className="mt-2 text-[11px] font-medium text-emerald-600">
              {averageAccuracy !== null
                ? averageAccuracy >= 75
                  ? "Outstanding accuracy"
                  : averageAccuracy >= 50
                    ? "Good steady progress"
                    : "Needs more practice"
                : "Take a test to calculate"}
            </p>
          </CardBody>
        </Card>

        {/* Card 4: Class Rank (Securely Handled) */}
        <Card>
          <CardBody>
            <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--color-warning-soft)] text-warning">
              <Trophy className="size-5" />
            </div>
            <p className="mt-3 text-lg font-bold text-slate-700 leading-none">
              Not available yet
            </p>
            <p className="mt-1.5 text-xs text-muted font-medium">Class Rank</p>
            <p className="mt-2 text-[11px] font-medium text-amber-700 flex items-center gap-1">
              <Info className="size-3" /> Class ranks published by teacher
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Progress chart + upcoming tests */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Progress Over Time"
            subtitle={
              scoreTrendData.length >= 2
                ? "Your mock test percentage scores across tests"
                : "Complete at least 2 mock tests to see your progress curve"
            }
            action={
              <Link to="/student/progress">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="size-4" />}>
                  Detailed Analytics
                </Button>
              </Link>
            }
          />
          <CardBody>
            {scoreTrendData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 mb-3">
                  <TrendingUp className="size-6" />
                </div>
                <h4 className="text-sm font-bold text-ink">No test history yet</h4>
                <p className="mt-1 text-xs text-muted max-w-sm">
                  Complete your first mock test to begin building your personal score progression curve.
                </p>
                <Link to="/student/mock-tests" className="mt-4">
                  <Button size="sm">Explore Mock Tests</Button>
                </Link>
              </div>
            ) : (
              <>
                {/* ScoreTrend rendered with averageLabel="" to ensure no artificial class average line is rendered */}
                <ScoreTrend data={scoreTrendData} height={250} averageLabel="" />
                <div className="mt-4 flex flex-wrap items-center gap-6 text-[13px] pt-3 border-t border-line">
                  <span className="flex items-center gap-2 text-ink font-medium">
                    <span className="h-2 w-4 rounded-full bg-brand-500" /> Your Mock Score (%)
                  </span>
                  {scoreTrendData.length === 1 && (
                    <span className="text-xs text-muted">
                      1 test recorded · Take another test to see your score trajectory.
                    </span>
                  )}
                </div>
              </>
            )}
          </CardBody>
        </Card>

        {/* Upcoming Mock Tests from real database */}
        <Card>
          <CardHeader
            title="Upcoming Mock Tests"
            subtitle={`${upcomingTests.length} scheduled in school`}
          />
          <CardBody className="space-y-3">
            {upcomingTests.length === 0 ? (
              <EmptyState
                icon={<CalendarClock className="size-8" />}
                title="No tests right now"
                description="Your teacher hasn't scheduled any tests today. Practice topics below!"
              />
            ) : (
              upcomingTests.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl border border-line p-3.5 hover:border-brand-300 transition-colors bg-white shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-ink line-clamp-1">{m.title}</p>
                    <Badge tone={m.status === "live" ? "success" : "brand"} dot>
                      {m.status === "live" ? "Live Now" : "Upcoming"}
                    </Badge>
                  </div>
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
                    <CalendarClock className="size-3.5" />{" "}
                    {m.scheduled_at ? formatDateTime(m.scheduled_at) : "Date to be announced"}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted">
                    <span>
                      {m.total_questions} Questions · {m.duration_minutes} min
                    </span>
                    <Link
                      to="/student/mock-tests"
                      className="font-semibold text-brand-600 hover:text-brand-700"
                    >
                      Open &rarr;
                    </Link>
                  </div>
                </div>
              ))
            )}
            <Link to="/student/mock-tests" className="block pt-1">
              <Button variant="secondary" block size="sm">
                View All Mock Tests
              </Button>
            </Link>
          </CardBody>
        </Card>
      </div>

      {/* Topics + Recent Activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Topic Strengths and Weaknesses */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Topic Performance"
            subtitle="Calculated from real exam answers (minimum 3 questions per topic)"
            action={
              <Link to="/student/practice">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="size-4" />}>
                  Practice Topics
                </Button>
              </Link>
            }
          />
          <CardBody>
            {topicStats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 rounded-xl border border-line">
                <Target className="size-8 text-slate-400 mb-2" />
                <p className="text-sm font-bold text-slate-700">No topic answers recorded yet</p>
                <p className="text-xs text-muted max-w-sm mt-1">
                  Complete mock tests or practice questions to unlock your topic strengths and weakness insights.
                </p>
                <Link to="/student/practice" className="mt-3">
                  <Button size="sm" variant="secondary">Start Practice Now</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-6 sm:grid-cols-2">
                  {/* Strong Topics */}
                  <div className="rounded-xl bg-emerald-50/40 p-4 border border-emerald-100">
                    <p className="mb-3 flex items-center gap-2 text-sm font-bold text-emerald-800">
                      <span className="size-2 rounded-full bg-success" /> Strong Topics (&ge; 75%)
                    </p>
                    {strongTopics.length > 0 ? (
                      <div className="space-y-3.5">
                        {strongTopics.slice(0, 3).map((t) => (
                          <TopicRow key={t.key} label={t.topic} value={t.accuracy} tone="success" />
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 py-2">
                        No topics &ge; 75% accuracy yet. Keep practising!
                      </p>
                    )}
                  </div>

                  {/* Needs Practice */}
                  <div className="rounded-xl bg-rose-50/40 p-4 border border-rose-100">
                    <p className="mb-3 flex items-center gap-2 text-sm font-bold text-rose-800">
                      <span className="size-2 rounded-full bg-danger" /> Needs Practice (&lt; 50%)
                    </p>
                    {weakTopics.length > 0 ? (
                      <div className="space-y-3.5">
                        {weakTopics.slice(0, 3).map((t) => (
                          <TopicRow key={t.key} label={t.topic} value={t.accuracy} tone="danger" />
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 py-2">
                        Great work! No topics below 50% accuracy right now.
                      </p>
                    )}
                  </div>
                </div>

                {/* Building Data indicator for topics with fewer than 3 answers */}
                {buildingTopics.length > 0 && (
                  <div className="flex items-center gap-2 rounded-xl bg-amber-50/70 p-3 border border-amber-200 text-xs text-amber-800">
                    <Info className="size-4 shrink-0 text-amber-600" />
                    <span>
                      <strong>Building data:</strong> {buildingTopics.length}{" "}
                      {buildingTopics.length === 1 ? "topic has" : "topics have"} fewer than 3 questions answered ({buildingTopics.map(t => t.topic).slice(0, 3).join(", ")}{buildingTopics.length > 3 ? "..." : ""}). Solve more questions to finalize categorization.
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Recent Activity from Real Exam Attempts */}
        <Card>
          <CardHeader title="Recent Activity" subtitle="Your latest submitted mock tests" />
          <CardBody className="space-y-1">
            {submittedAttempts.length === 0 ? (
              <EmptyState
                icon={<FileText className="size-8" />}
                title="No tests submitted yet"
                description="When you take and submit mock tests, your results will show up here."
              />
            ) : (
              submittedAttempts.slice(0, 5).map((a) => {
                const totalMarks = a.mock_tests?.total_marks || 100;
                const pct = Math.round(((a.score ?? 0) / totalMarks) * 100);
                const band = bandFromPct(pct);

                return (
                  <Link
                    key={a.id}
                    to={`/student/result/${a.mock_test_id}`}
                    state={{
                      score: a.score,
                      total: totalMarks,
                      correct: a.total_correct,
                      totalQ: a.total_attempted,
                      title: a.mock_tests?.title ?? "Mock Test",
                      attemptId: a.id,
                    }}
                    className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-slate-50 transition-colors group"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 group-hover:bg-brand-100 transition-colors">
                      <FileText className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-ink group-hover:text-brand-600 transition-colors">
                        {a.mock_tests?.title ?? "Mock Test"}
                      </p>
                      <p className="text-xs text-muted">
                        {relativeTime(a.submitted_at || a.created_at)}
                      </p>
                    </div>
                    <Badge tone={bandMeta[band].tone}>{pct}%</Badge>
                  </Link>
                );
              })
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function bandFromPct(p: number): "strong" | "average" | "weak" {
  if (p >= 75) return "strong";
  if (p >= 50) return "average";
  return "weak";
}

function TopicRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "danger";
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[13px]">
        <span className="text-ink font-medium">{label}</span>
        <span className="font-semibold text-slate-700 tabular">{value}%</span>
      </div>
      <ProgressBar value={value} tone={tone} />
    </div>
  );
}
