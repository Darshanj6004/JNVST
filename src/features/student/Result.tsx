import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { CheckCircle2, Download, Home, Loader2, RotateCcw, XCircle } from "lucide-react";
import { Badge, Button, Card, CardBody, CardHeader, ProgressBar } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { ProgressRing } from "@/charts";
import { pct } from "@/lib/format";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/auth";
import React from "react";

interface ResultState {
  score: number;
  total: number;
  correct: number;
  totalQ: number;
  title: string;
  attemptId?: string;
}

type SectionBreakdown = {
  name: string;
  correct: number;
  total: number;
  marks: number;
};

type DBAnswer = {
  is_correct: boolean | null;
  selected_option: string | null;
  questions: {
    marks: number;
    subject_code: string;
  };
};

const SUBJECT_NAMES: Record<string, string> = {
  mental_ability: "Mental Ability",
  arithmetic: "Arithmetic",
  language: "Language",
};

export default function Result() {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const state = location.state as ResultState | null;

  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState<SectionBreakdown[]>([]);
  const [title, setTitle] = useState(state?.title ?? "Mock Test");

  const score = state?.score ?? 0;
  const total = state?.total ?? 100;
  const correct = state?.correct ?? 0;
  const totalQ = state?.totalQ ?? 0;
  const percentage = pct(score, total);

  // Load detailed answer breakdown from Supabase
  useEffect(() => {
    if (!user?.id || !id) return;

    (async () => {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;

      // Get attempt for this student + test
      const { data: attempt } = await sb
        .from("exam_attempts")
        .select("id, score, total_correct, total_attempted")
        .eq("student_id", user.id)
        .eq("mock_test_id", id)
        .maybeSingle();

      if (!attempt) { setLoading(false); return; }

      // Get test title
      const { data: testData } = await sb
        .from("mock_tests")
        .select("title")
        .eq("id", id)
        .single();
      if (testData?.title) setTitle(testData.title);

      // Get all answers with question details
      const { data: answers } = await sb
        .from("exam_answers")
        .select("is_correct, selected_option, questions(marks, subject_code)")
        .eq("attempt_id", attempt.id);

      if (!answers) { setLoading(false); return; }

      // Build section breakdown
      const map: Record<string, { correct: number; total: number; marks: number }> = {};
      for (const a of answers as DBAnswer[]) {
        const code = a.questions?.subject_code ?? "other";
        if (!map[code]) map[code] = { correct: 0, total: 0, marks: 0 };
        map[code].total++;
        if (a.is_correct) {
          map[code].correct++;
          map[code].marks += a.questions?.marks ?? 0;
        }
      }

      setSections(
        Object.entries(map).map(([code, v]) => ({
          name: SUBJECT_NAMES[code] ?? code,
          correct: v.correct,
          total: v.total,
          marks: Math.round(v.marks * 100) / 100,
        }))
      );

      setLoading(false);
    })();
  }, [id, user?.id]);

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
            subtitle={`${totalQ} total questions · No negative marking`}
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
                label="Incorrect Answers"
                value={Math.max(0, totalQ - correct)}
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
