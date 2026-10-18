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
        title="Test result"
        description={title}
        actions={
          <>
            <Button variant="secondary" leftIcon={<Download className="size-4" />}>
              Download
            </Button>
            <Link to="/student/mock-tests">
              <Button variant="secondary" leftIcon={<Home className="size-4" />}>
                Mock tests
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardBody className="flex flex-col items-center py-8 text-center">
            <ProgressRing value={percentage} size={150} sublabel="Score" />
            <p className="mt-5 text-2xl font-semibold text-ink tabular">
              {score}
              <span className="text-base text-muted">/{total}</span>
            </p>
            <Badge
              tone={percentage >= 75 ? "success" : percentage >= 50 ? "warning" : "danger"}
              className="mt-3"
            >
              {percentage >= 75
                ? "Excellent 🎉"
                : percentage >= 50
                  ? "Good, keep going!"
                  : "Needs improvement"}
            </Badge>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Answer summary"
            subtitle={`${totalQ} questions · no negative marking`}
          />
          <CardBody className="grid gap-4 sm:grid-cols-3">
            <SummaryTile
              icon={<CheckCircle2 className="size-5" />}
              label="Correct"
              value={correct}
              tone="success"
            />
            <SummaryTile
              icon={<XCircle className="size-5" />}
              label="Incorrect"
              value={totalQ - correct}
              tone="danger"
            />
            <SummaryTile
              icon={<span className="text-lg font-semibold">%</span>}
              label="Accuracy"
              value={pct(correct, totalQ)}
              tone="brand"
              suffix="%"
            />

            {/* Section breakdown */}
            <div className="sm:col-span-3">
              <p className="mb-3 mt-2 text-sm font-semibold text-ink">Section-wise breakdown</p>
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Loader2 className="size-4 animate-spin" /> Loading breakdown…
                </div>
              ) : sections.length > 0 ? (
                <div className="space-y-4">
                  {sections.map((s) => (
                    <div key={s.name}>
                      <div className="mb-1.5 flex items-center justify-between text-[13px]">
                        <span className="font-medium text-ink">{s.name}</span>
                        <span className="text-muted tabular">
                          {s.correct}/{s.total} correct · {s.marks} marks
                        </span>
                      </div>
                      <ProgressBar
                        value={pct(s.correct, s.total)}
                        tone={
                          pct(s.correct, s.total) >= 75
                            ? "success"
                            : pct(s.correct, s.total) >= 50
                              ? "warning"
                              : "danger"
                        }
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">
                  Section-wise data will appear here after your test is submitted.
                </p>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="flex justify-center">
        <Link to="/student/practice">
          <Button leftIcon={<RotateCcw className="size-4" />}>Practice weak topics</Button>
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
