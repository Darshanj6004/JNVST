import { Link, useLocation, useParams } from "react-router";
import { CheckCircle2, Download, Home, RotateCcw, XCircle } from "lucide-react";
import { Badge, Button, Card, CardBody, CardHeader, ProgressBar } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { ProgressRing, AccuracyBars } from "@/charts";
import { getMockTest } from "@/data/mockTests";
import { subjectAccuracy } from "@/data/analytics";
import { pct } from "@/lib/format";

interface ResultState {
  score: number;
  total: number;
  correct: number;
  totalQ: number;
  title: string;
}

export default function Result() {
  const { id } = useParams();
  const location = useLocation();
  const test = id ? getMockTest(id) : undefined;
  const state = location.state as ResultState | null;

  const score = state?.score ?? test?.score ?? 78;
  const total = state?.total ?? test?.totalMarks ?? 100;
  const correct = state?.correct ?? 62;
  const totalQ = state?.totalQ ?? test?.totalQuestions ?? 80;
  const title = state?.title ?? test?.title ?? "Mock Test";
  const percentage = pct(score, total);

  const sections = [
    { name: "Mental Ability", correct: 34, total: 40, marks: 42.5 },
    { name: "Arithmetic", correct: 16, total: 20, marks: 20 },
    { name: "Language", correct: 12, total: 20, marks: 15 },
  ];

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
            <Badge tone={percentage >= 75 ? "success" : percentage >= 50 ? "warning" : "danger"} className="mt-3">
              {percentage >= 75 ? "Excellent" : percentage >= 50 ? "Good, keep going" : "Needs improvement"}
            </Badge>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Answer summary" subtitle={`${totalQ} questions · no negative marking`} />
          <CardBody className="grid gap-4 sm:grid-cols-3">
            <SummaryTile icon={<CheckCircle2 className="size-5" />} label="Correct" value={correct} tone="success" />
            <SummaryTile icon={<XCircle className="size-5" />} label="Incorrect" value={totalQ - correct} tone="danger" />
            <SummaryTile
              icon={<span className="text-lg font-semibold">%</span>}
              label="Accuracy"
              value={pct(correct, totalQ)}
              tone="brand"
              suffix="%"
            />
            <div className="sm:col-span-3">
              <p className="mb-3 mt-2 text-sm font-semibold text-ink">Section-wise breakdown</p>
              <div className="space-y-4">
                {sections.map((s) => (
                  <div key={s.name}>
                    <div className="mb-1.5 flex items-center justify-between text-[13px]">
                      <span className="font-medium text-ink">{s.name}</span>
                      <span className="text-muted tabular">
                        {s.correct}/{s.total} correct · {s.marks} marks
                      </span>
                    </div>
                    <ProgressBar value={pct(s.correct, s.total)} />
                  </div>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Accuracy by subject" subtitle="How this attempt compares across sections" />
        <CardBody>
          <AccuracyBars data={subjectAccuracy.map((s) => ({ label: s.subject, value: s.accuracy }))} />
        </CardBody>
      </Card>

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
      <div className={`flex size-10 items-center justify-center rounded-xl ${tones[tone]}`}>{icon}</div>
      <p className="mt-3 text-2xl font-semibold text-ink tabular">
        {value}
        {suffix}
      </p>
      <p className="text-[13px] text-muted">{label}</p>
    </div>
  );
}
