import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { CheckCircle2, Download, Home, Loader2, Lock, RotateCcw, XCircle } from "lucide-react";
import { Badge, Button, Card, CardBody, CardHeader, ProgressBar } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { ProgressRing } from "@/charts";
import { pct } from "@/lib/format";
import { db, rpc, SUBJECT_LABELS, type TopicStat } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";
import React from "react";

interface ResultState {
  score: number;
  total_marks: number;
  total_correct: number;
  total_attempted: number;
  total_questions: number;
  title: string;
}

type SectionBreakdown = {
  name: string;
  correct: number;
  total: number;
  marks: number;
};

type ReviewRow = {
  order_index: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  image_url: string | null;
  marks: number;
  subject_name: string;
  topic_name: string;
  selected_option: string | null;
  correct_option: string;
  is_correct: boolean;
  explanation: string | null;
};

export default function Result() {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const navState = location.state as ResultState | null;

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ResultState | null>(navState);
  const [testStatus, setTestStatus] = useState<string>("");
  const [sections, setSections] = useState<SectionBreakdown[]>([]);
  const [review, setReview] = useState<ReviewRow[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!user?.id || !id) return;
    (async () => {
      setLoading(true);
      const [{ data: attempt }, { data: testData }] = await Promise.all([
        db
          .from("exam_attempts")
          .select("score, total_correct, total_attempted, status")
          .eq("student_id", user.id)
          .eq("mock_test_id", id)
          .maybeSingle(),
        db.from("mock_tests").select("title, total_marks, total_questions, status").eq("id", id).maybeSingle(),
      ]);

      if (!attempt || attempt.status !== "submitted" || !testData) {
        setMissing(true);
        setLoading(false);
        return;
      }
      setTestStatus(testData.status);
      setSummary({
        score: Number(attempt.score ?? 0),
        total_marks: Number(testData.total_marks),
        total_correct: attempt.total_correct ?? 0,
        total_attempted: attempt.total_attempted ?? 0,
        total_questions: testData.total_questions ?? 0,
        title: testData.title,
      });

      try {
        const stats = await rpc<TopicStat[]>("my_topic_stats", { p_test_id: id });
        const map: Record<string, SectionBreakdown> = {};
        for (const s of stats ?? []) {
          const key = s.subject_code;
          map[key] ??= { name: SUBJECT_LABELS[key] ?? s.subject_name, correct: 0, total: 0, marks: 0 };
          map[key].correct += s.correct;
          map[key].total += s.total;
          map[key].marks += Number(s.marks_earned);
        }
        setSections(Object.values(map).map((s) => ({ ...s, marks: Math.round(s.marks * 100) / 100 })));
      } catch {
        setSections([]);
      }

      if (testData.status === "completed") {
        try {
          setReview((await rpc<ReviewRow[]>("get_attempt_review", { p_test_id: id })) ?? []);
        } catch {
          setReview([]);
        }
      }
      setLoading(false);
    })();
  }, [id, user?.id]);

  if (loading && !summary) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-brand-400" />
      </div>
    );
  }

  if (missing && !summary) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardBody className="py-12 text-center space-y-3">
          <p className="text-base font-bold text-ink">No result found for this test</p>
          <p className="text-sm text-muted">You haven't submitted this test yet.</p>
          <Link to="/student/mock-tests">
            <Button variant="secondary">Back to Mock Tests</Button>
          </Link>
        </CardBody>
      </Card>
    );
  }

  const title = summary?.title ?? "Mock Test";
  const score = Math.round((summary?.score ?? 0) * 100) / 100;
  const total = summary?.total_marks ?? 100;
  const correct = summary?.total_correct ?? 0;
  const totalQ = summary?.total_questions ?? 0;
  const attempted = summary?.total_attempted ?? 0;
  const percentage = pct(score, total);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exam Result & Performance Report"
        description={title}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              leftIcon={<Download className="size-4" />}
              onClick={() => window.print()}
            >
              Print / Save PDF
            </Button>
            <Link to="/student/mock-tests">
              <Button variant="secondary" leftIcon={<Home className="size-4" />}>
                All Mock Tests
              </Button>
            </Link>
          </div>
        }
      />

      {/* Encouragement message */}
      <div className="rounded-2xl border border-brand-100 bg-gradient-to-r from-brand-50 to-indigo-50/60 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-brand-900">
            {percentage >= 75
              ? "Superb Performance! 🎉"
              : percentage >= 50
                ? "Good Effort! Keep Pushing Forward 👍"
                : "Good Practice Attempt! Learn from every mistake 💪"}
          </h2>
          <p className="mt-0.5 text-xs text-brand-700">
            Your answers have been evaluated according to official JNVST scoring rules (1.25 marks per question).
          </p>
        </div>
        <Link to="/student/progress" className="shrink-0">
          <Button size="sm" variant="secondary" className="border-brand-200 text-brand-700 bg-white hover:bg-brand-50">
            View My Progress Trend &rarr;
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl border border-line bg-white shadow-xs">
          <CardBody className="flex flex-col items-center py-8 px-6 text-center">
            <ProgressRing value={percentage} size={156} stroke={14} sublabel="Score" />
            <p className="mt-5 text-3xl font-extrabold text-ink tabular">
              {score}
              <span className="text-lg font-medium text-muted">/{total}</span>
            </p>
            <Badge
              tone={percentage >= 75 ? "success" : percentage >= 50 ? "warning" : "danger"}
              className="mt-3 text-xs font-bold px-3 py-1"
            >
              {percentage >= 75
                ? "Grade A · Excellent 🎉"
                : percentage >= 50
                  ? "Grade B · Good Progress"
                  : "Grade C · Practice Needed"}
            </Badge>
            <p className="mt-2 text-xs text-muted">Target for selection: 85%+ marks</p>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2 rounded-2xl border border-line bg-white shadow-xs">
          <CardHeader
            title="Performance Summary"
            subtitle={`${totalQ} questions · ${attempted} attempted · No negative marking`}
          />
          <CardBody className="p-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <SummaryTile
                icon={<CheckCircle2 className="size-5" />}
                label="Correct Answers"
                value={correct}
                tone="success"
              />
              <SummaryTile
                icon={<XCircle className="size-5" />}
                label={`Wrong · ${Math.max(0, totalQ - attempted)} skipped`}
                value={Math.max(0, attempted - correct)}
                tone="danger"
              />
              <SummaryTile
                icon={<span className="text-base font-bold">%</span>}
                label="Overall Accuracy"
                value={pct(correct, totalQ)}
                tone="brand"
                suffix="%"
              />
            </div>

            {/* Section breakdown */}
            <div className="border-t border-line pt-5">
              <p className="mb-4 text-sm font-bold text-ink">Section-Wise Marks Breakdown</p>
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted py-4">
                  <Loader2 className="size-4 animate-spin text-brand-500" /> Calculating section scores…
                </div>
              ) : sections.length > 0 ? (
                <div className="space-y-4">
                  {sections.map((s) => {
                    const sPct = pct(s.correct, s.total);
                    return (
                      <div key={s.name} className="rounded-xl border border-line bg-slate-50/50 p-3.5">
                        <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                          <span className="text-ink font-bold text-sm">{s.name}</span>
                          <span className="text-slate-600 tabular">
                            {s.correct}/{s.total} Correct · {s.marks} Marks ({sPct}%)
                          </span>
                        </div>
                        <ProgressBar
                          value={sPct}
                          tone={sPct >= 75 ? "success" : sPct >= 50 ? "warning" : "danger"}
                          className="h-2.5"
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted py-4">
                  Section breakdown details will load once attempt answers are finalized.
                </p>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Answer review */}
      <Card className="rounded-2xl border border-line bg-white shadow-xs print:break-before-page">
        <CardHeader
          title="Answer review"
          subtitle={
            testStatus === "completed"
              ? "See the correct answer and explanation for every question"
              : "Available after your teacher closes this test for everyone"
          }
          action={
            testStatus === "completed" && review.length > 0 ? (
              <Button size="sm" variant="secondary" onClick={() => setShowReview((v) => !v)}>
                {showReview ? "Hide answers" : "Show answers"}
              </Button>
            ) : undefined
          }
        />
        {testStatus !== "completed" ? (
          <CardBody className="flex items-center gap-3 text-sm text-muted">
            <Lock className="size-4 shrink-0" />
            Other students may still be writing this test, so the answer key is locked for now.
          </CardBody>
        ) : (
          showReview && (
            <CardBody className="space-y-4">
              {review.map((r, i) => {
                const opts = [
                  ["A", r.option_a],
                  ["B", r.option_b],
                  ["C", r.option_c],
                  ["D", r.option_d],
                ] as const;
                return (
                  <div key={i} className="rounded-xl border border-line p-4 break-inside-avoid">
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-ink">Q{i + 1}.</span>
                      <Badge tone="neutral">{r.subject_name}</Badge>
                      <span className="text-muted">{r.topic_name}</span>
                      <Badge tone={r.is_correct ? "success" : r.selected_option ? "danger" : "warning"} className="ml-auto">
                        {r.is_correct ? "Correct" : r.selected_option ? "Wrong" : "Not answered"}
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold text-ink whitespace-pre-wrap">{r.question_text}</p>
                    {r.image_url && (
                      <img src={r.image_url} alt="" className="mt-2 max-h-48 rounded-lg border border-line object-contain" />
                    )}
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {opts.map(([letter, text]) => {
                        const isKey = letter === r.correct_option;
                        const isMine = letter === r.selected_option;
                        return (
                          <div
                            key={letter}
                            className={cn(
                              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                              isKey
                                ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                                : isMine
                                  ? "border-red-300 bg-red-50 text-red-900"
                                  : "border-line text-slate-700",
                            )}
                          >
                            <span className="font-bold">{letter}.</span>
                            <span className="flex-1">{text}</span>
                            {isKey && <CheckCircle2 className="size-4 text-emerald-600" />}
                            {isMine && !isKey && <XCircle className="size-4 text-red-600" />}
                          </div>
                        );
                      })}
                    </div>
                    {r.explanation && (
                      <p className="mt-3 rounded-lg bg-brand-50/60 p-3 text-[13px] text-brand-900">
                        <strong>Explanation: </strong>
                        {r.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </CardBody>
          )
        )}
      </Card>

      <div className="flex flex-wrap justify-center gap-3 pt-2">
        <Link to="/student/practice">
          <Button leftIcon={<RotateCcw className="size-4" />} size="md">
            Practice Weaker Topics
          </Button>
        </Link>
        <Link to="/student/mock-tests">
          <Button variant="secondary" size="md">
            Back to Mock Tests
          </Button>
        </Link>
      </div>
    </div>
  );
}

function SummaryTile({
  icon,
  label,
  value,
  tone,
  suffix,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "success" | "danger" | "brand";
  suffix?: string;
}) {
  const tones = {
    success: "bg-[var(--color-success-soft)] text-success",
    danger: "bg-[var(--color-danger-soft)] text-danger",
    brand: "bg-brand-50 text-brand-600",
  };
  return (
    <div className="rounded-xl border border-line p-4">
      <div className={`flex size-10 items-center justify-center rounded-xl ${tones[tone]}`}>
        {icon}
      </div>
      <p className="mt-3 text-2xl font-semibold text-ink tabular">
        {value}
        {suffix}
      </p>
      <p className="text-[13px] text-muted">{label}</p>
    </div>
  );
}
