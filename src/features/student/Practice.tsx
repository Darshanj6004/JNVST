import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Calculator,
  Check,
  ChevronRight,
  Languages,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import type { Question, Subject, Topic } from "@/types";
import { Badge, Button, Card, CardBody, ProgressBar } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { QuestionCard } from "@/components/QuestionCard";
import { ProgressRing } from "@/charts";
import { difficulties, subjects } from "@/data/subjects";
import { practiceSet } from "@/data/questions";
import { pct } from "@/lib/format";
import { cn } from "@/lib/cn";

const icons: Record<string, typeof Brain> = { mat: Brain, ari: Calculator, lan: Languages };
type Phase = "subject" | "topic" | "difficulty" | "questions" | "results";

export default function Practice() {
  const [phase, setPhase] = useState<Phase>("subject");
  const [subject, setSubject] = useState<Subject | null>(null);
  const [topic, setTopic] = useState<Topic | "all" | null>(null);
  const [difficulty, setDifficulty] = useState<string | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const begin = (diff: string) => {
    const set = practiceSet(subject!.id, topic === "all" ? "all" : (topic as Topic).id, diff);
    setDifficulty(diff);
    setQuestions(set);
    setIdx(0);
    setAnswers({});
    setPhase("questions");
  };

  const reset = () => {
    setPhase("subject");
    setSubject(null);
    setTopic(null);
    setDifficulty(null);
  };

  const score = useMemo(
    () => questions.reduce((acc, q, i) => acc + (answers[i] === q.answer ? 1 : 0), 0),
    [questions, answers],
  );

  const steps = ["Subject", "Topic", "Difficulty"];
  const stepIndex = phase === "subject" ? 0 : phase === "topic" ? 1 : 2;

  if (phase === "questions" || phase === "results")
    return (
      <RunView
        phase={phase}
        subject={subject!}
        difficulty={difficulty!}
        questions={questions}
        idx={idx}
        setIdx={setIdx}
        answers={answers}
        setAnswers={setAnswers}
        score={score}
        onFinish={() => setPhase("results")}
        onRestart={reset}
      />
    );

  return (
    <div className="space-y-6">
      <PageHeader title="Practice mode" description="Untimed practice with instant feedback and explanations." />

      {/* Stepper */}
      <div className="flex items-center gap-2 text-sm">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 font-medium transition-colors",
                i === stepIndex
                  ? "bg-brand-500 text-white"
                  : i < stepIndex
                    ? "bg-brand-50 text-brand-700"
                    : "bg-white text-muted ring-1 ring-inset ring-line",
              )}
            >
              {i < stepIndex ? <Check className="size-3.5" /> : <span className="tabular">{i + 1}</span>}
              {s}
            </span>
            {i < steps.length - 1 && <ChevronRight className="size-4 text-slate-300" />}
          </div>
        ))}
      </div>

      {phase === "subject" && (
        <div className="grid gap-4 sm:grid-cols-3">
          {subjects.map((s) => {
            const Icon = icons[s.id] ?? Brain;
            return (
              <button
                key={s.id}
                onClick={() => {
                  setSubject(s);
                  setPhase("topic");
                }}
                className="group text-left"
              >
                <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-[var(--shadow-md)]">
                  <CardBody>
                    <div
                      className="flex size-11 items-center justify-center rounded-xl text-white"
                      style={{ backgroundColor: s.accent }}
                    >
                      <Icon className="size-5" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-ink">{s.short}</h3>
                    <p className="mt-1 text-sm text-muted">{s.topics.length} topics available</p>
                    <p className="mt-4 flex items-center gap-1 text-[13px] font-medium text-brand-600">
                      Choose subject <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </p>
                  </CardBody>
                </Card>
              </button>
            );
          })}
        </div>
      )}

      {phase === "topic" && subject && (
        <div className="space-y-4">
          <BackButton onClick={() => setPhase("subject")} label={`Back to subjects`} />
          <div className="grid gap-3 sm:grid-cols-2">
            <button onClick={() => { setTopic("all"); setPhase("difficulty"); }} className="text-left">
              <Card className="border-brand-200 bg-brand-50/40 transition-all hover:shadow-[var(--shadow-sm)]">
                <CardBody className="flex items-center gap-3">
                  <Sparkles className="size-5 text-brand-600" />
                  <div>
                    <p className="text-sm font-semibold text-ink">All topics</p>
                    <p className="text-xs text-muted">Mixed practice across {subject.short}</p>
                  </div>
                </CardBody>
              </Card>
            </button>
            {subject.topics.map((t) => (
              <button key={t.id} onClick={() => { setTopic(t); setPhase("difficulty"); }} className="text-left">
                <Card className="transition-all hover:border-brand-300 hover:shadow-[var(--shadow-sm)]">
                  <CardBody className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{t.name}</p>
                      <p className="truncate text-xs text-muted">{t.description}</p>
                    </div>
                    <Badge tone="neutral">{t.questionCount}</Badge>
                  </CardBody>
                </Card>
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === "difficulty" && (
        <div className="space-y-4">
          <BackButton onClick={() => setPhase("topic")} label="Back to topics" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {difficulties.map((d) => (
              <button key={d.id} onClick={() => begin(d.id)} className="text-left">
                <Card className="h-full transition-all hover:border-brand-300 hover:shadow-[var(--shadow-md)]">
                  <CardBody>
                    <span className="inline-flex rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500 tabular">
                      {d.code}
                    </span>
                    <p className="mt-3 text-base font-semibold text-ink">{d.name}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{d.description}</p>
                  </CardBody>
                </Card>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
      <ArrowLeft className="size-4" /> {label}
    </button>
  );
}

function RunView({
  phase,
  subject,
  difficulty,
  questions,
  idx,
  setIdx,
  answers,
  setAnswers,
  score,
  onFinish,
  onRestart,
}: {
  phase: Phase;
  subject: Subject;
  difficulty: string;
  questions: Question[];
  idx: number;
  setIdx: (n: number) => void;
  answers: Record<number, number>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  score: number;
  onFinish: () => void;
  onRestart: () => void;
}) {
  if (phase === "results") {
    const percentage = pct(score, questions.length);
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardBody className="flex flex-col items-center py-10 text-center">
            <ProgressRing value={percentage} size={148} />
            <h2 className="mt-6 text-xl font-semibold text-ink">Practice complete!</h2>
            <p className="mt-1 text-sm text-muted">
              {subject.short} · {difficulty === "combined" ? "Combined" : difficulty} difficulty
            </p>
            <div className="mt-6 flex gap-8">
              <Stat label="Correct" value={`${score}`} tone="text-success" />
              <Stat label="Incorrect" value={`${questions.length - score}`} tone="text-danger" />
              <Stat label="Total" value={`${questions.length}`} tone="text-ink" />
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button onClick={onRestart} leftIcon={<RotateCcw className="size-4" />}>
                Practice again
              </Button>
              <Link to="/student/dashboard">
                <Button variant="secondary">Back to dashboard</Button>
              </Link>
            </div>
          </CardBody>
        </Card>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-ink">Review answers</h3>
          <div className="space-y-4">
            {questions.map((q, i) => (
              <Card key={q.id}>
                <CardBody>
                  <QuestionCard question={q} index={i} selected={answers[i] ?? null} reveal />
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const q = questions[idx];
  const answered = Object.keys(answers).length;
  const isLast = idx === questions.length - 1;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <BackButton onClick={onRestart} label="Exit practice" />
        <Badge tone="brand">
          {subject.short} · {difficulty === "combined" ? "Combined" : difficulty}
        </Badge>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between text-[13px] text-muted">
          <span>
            Question {idx + 1} of {questions.length}
          </span>
          <span className="tabular">{answered} answered</span>
        </div>
        <ProgressBar value={((idx + 1) / questions.length) * 100} />
      </div>

      <Card>
        <CardBody>
          <QuestionCard
            question={q}
            index={idx}
            selected={answers[idx] ?? null}
            onSelect={(i) => setAnswers((a) => ({ ...a, [idx]: i }))}
          />
        </CardBody>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="secondary" disabled={idx === 0} onClick={() => setIdx(idx - 1)} leftIcon={<ArrowLeft className="size-4" />}>
          Previous
        </Button>
        {isLast ? (
          <Button onClick={onFinish} leftIcon={<Check className="size-4" />}>
            Submit practice
          </Button>
        ) : (
          <Button onClick={() => setIdx(idx + 1)} rightIcon={<ArrowRight className="size-4" />}>
            Next question
          </Button>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="text-center">
      <p className={cn("text-2xl font-semibold tabular", tone)}>{value}</p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
    </div>
  );
}
